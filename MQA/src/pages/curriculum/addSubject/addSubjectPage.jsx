import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import styles from './addSubjectPage.module.css'
import SubjectReviewDialog from './subjectReviewDialog'

const curriculumLevelOptions = [
  { value: 'bachelor', label: 'ปริญญาตรี' },
  { value: 'master', label: 'ปริญญาโท' },
  { value: 'doctorate', label: 'ปริญญาเอก' },
]

const subjectCategoryOptions = [
  { value: 'generalEducation', label: 'วิชาศึกษาทั่วไป' },
  { value: 'specific', label: 'วิชาเฉพาะ' },
  { value: 'freeElective', label: 'วิชาเลือกเสรี' },
]

const subjectCategoryIdMap = {
  generalEducation: 1,
  specific: 2,
  freeElective: 3,
}

const subjectCategoryValueMap = {
  1: 'generalEducation',
  2: 'specific',
  3: 'freeElective',
}

const studyLineOptions = [
  'สายวิทยาศาสตร์',
  'สายมนุษยศาสตร์และสังคมศาสตร์',
]

const initialFormValue = {
  courseCode: '',
  curriculumLevel: '',
  courseNameThai: '',
  courseNameEnglish: '',
  subjectCategory: 'generalEducation',
  subCategory: '',
  subGroupId: '',
  studyLine: 'สายวิทยาศาสตร์',
  totalCredits: 3,
  lectureHours: 3,
  labHours: 0,
  selfStudyHours: 6,
  descriptionThai: '',
  descriptionEnglish: '',
  hasPreSubjects: 'no',
  preSubjects: [],
  hasCoSubjects: 'no',
  coSubjects: [],
}

const getAuthConfig = () => {
  const token = localStorage.getItem('mqa_token')
  return { headers: { Authorization: `Bearer ${token}` } }
}

const getResponseList = (data, keyList = []) => {
  if (Array.isArray(data)) return data

  for (const key of keyList) {
    if (Array.isArray(data?.[key])) return data[key]
  }

  return []
}

const getCourseId = (course) => {
  return course.id ?? course.course_id ?? course.courseId ?? ''
}

const getDepartmentId = (course) => {
  return (
    course.department_id ??
    course.departmentId ??
    course.department?.id ??
    course.department?.department_id ??
    course.department?.departmentId ??
    ''
  )
}

const normalizeDegree = (value) => {
  const degree = String(value || '').trim().toLowerCase()
  if (degree === 'bachelor' || degree === 'ปริญญาตรี' || degree.includes('ตรี')) return 'bachelor'
  if (degree === 'master' || degree === 'ปริญญาโท' || degree.includes('โท')) return 'master'
  if (degree === 'doctorate' || degree === 'doctoral' || degree === 'doctor' || degree === 'phd' || degree === 'ปริญญาเอก' || degree.includes('เอก')) return 'doctorate'
  return degree
}

const splitSubjectText = (value) => {
  if (!value) return []
  return String(value).split(',').map((item) => item.trim()).filter(Boolean)
}

const getRelatedSubjectText = (hasSubject, subjectList) => {
  if (hasSubject !== 'yes') return null
  if (!Array.isArray(subjectList) || subjectList.length === 0) return null
  return subjectList.join(', ')
}

const getSubjectDisplayText = (subject) => {
  const courseCode = subject.courseCode || '-'
  const courseNameThai = subject.courseNameThai || '-'
  return `${courseCode} ${courseNameThai}`
}

const mapSubGroupFromApi = (subGroup) => ({
  id: String(subGroup.id ?? subGroup.sub_group_id ?? subGroup.subGroupId ?? ''),
  name: subGroup.name || subGroup.sub_group_name || subGroup.subGroupName || '-',
  categoryId: String(subGroup.category_id ?? subGroup.categoryId ?? ''),
  rawData: subGroup,
})

const mapCourseFromApi = (course, subGroupOptions) => {
  const categoryId = String(course.category_id ?? course.categoryId ?? '')
  const subGroupId = String(course.sub_group_id ?? course.subGroupId ?? '')
  const subGroup = subGroupOptions.find((item) => String(item.id) === subGroupId)

  return {
    id: getCourseId(course),
    departmentId: getDepartmentId(course),
    courseCode: course.course_code || course.courseCode || '',
    curriculumLevel: normalizeDegree(course.course_level || course.courseLevel),
    courseNameThai: course.course_name_th || course.courseNameTh || '',
    courseNameEnglish: course.course_name_en || course.courseNameEn || '',
    subjectCategory: subjectCategoryValueMap[categoryId] || 'generalEducation',
    subCategory: subGroup?.name || '',
    subGroupId: subGroup?.id || subGroupId || '',
    studyLine: course.subject_line || course.subjectLine || 'สายวิทยาศาสตร์',
    totalCredits: course.credit_total ?? course.creditTotal ?? 3,
    lectureHours: course.credit_lecture ?? course.creditLecture ?? 3,
    labHours: course.credit_lab ?? course.creditLab ?? 0,
    selfStudyHours: course.credit_self_study ?? course.creditSelfStudy ?? 6,
    descriptionThai: course.description_thai || course.descriptionThai || '',
    descriptionEnglish: course.description_english || course.descriptionEnglish || '',
    hasPreSubjects: course.prerequisite ? 'yes' : 'no',
    preSubjects: splitSubjectText(course.prerequisite),
    hasCoSubjects: course.corequisite ? 'yes' : 'no',
    coSubjects: splitSubjectText(course.corequisite),
    rawData: course,
  }
}

function AddSubjectPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const apiUrl = import.meta.env.VITE_API_URL
  const selectedMajor = location.state?.major || null
  const selectedDepartmentId = selectedMajor?.id || selectedMajor?.department_id || selectedMajor?.departmentId || null

  const [formValue, setFormValue] = useState(initialFormValue)
  const [popup, setPopup] = useState({ open: false, field: '', title: '', value: '' })
  const [relatedSubjectPopup, setRelatedSubjectPopup] = useState({ open: false, target: '', title: '', keyword: '' })
  const [subjectList, setSubjectList] = useState([])
  const [subGroupOptions, setSubGroupOptions] = useState([])
  const [editingSubjectId, setEditingSubjectId] = useState(null)
  const [isSubjectReviewDialogOpen, setIsSubjectReviewDialogOpen] = useState(false)
  const [isCourseLoading, setIsCourseLoading] = useState(false)
  const [isSavingSubject, setIsSavingSubject] = useState(false)
  const [courseErrorMessage, setCourseErrorMessage] = useState('')

  const fetchSubjectData = useCallback(async () => {
    try {
      setIsCourseLoading(true)
      setCourseErrorMessage('')

      const config = getAuthConfig()
      const subGroupResponse = await axios.get(`${apiUrl}/subject-category/subgroup`, config)
      const subGroupList = getResponseList(subGroupResponse.data, ['subgroups', 'data'])
      const mappedSubGroupOptions = subGroupList.map((subGroup) => mapSubGroupFromApi(subGroup))

      setSubGroupOptions(mappedSubGroupOptions)

      if (!selectedDepartmentId) {
        setSubjectList([])
        setCourseErrorMessage('ยังไม่ได้เลือกสาขาจากหน้าจัดการสาขา ถ้าต้องการบันทึกรายวิชา กรุณากลับไปเลือกสาขาก่อน')
        return
      }

      const courseResponse = await axios.get(`${apiUrl}/course/department/${selectedDepartmentId}`, config)
      const courseList = getResponseList(courseResponse.data, ['courses', 'data'])
      const detailList = await Promise.all(
        courseList.map(async (course) => {
          const courseId = getCourseId(course)

          if (!courseId) return course

          try {
            const detailResponse = await axios.get(`${apiUrl}/course/${courseId}`, config)
            return detailResponse.data?.course || detailResponse.data?.data || detailResponse.data
          } catch (error) {
            return course
          }
        })
      )

      const mappedSubjectList = detailList.map((course) => mapCourseFromApi(course, mappedSubGroupOptions))

      setSubjectList(mappedSubjectList)
    } catch (error) {
      console.error('Error fetching subject data:', error)
      setCourseErrorMessage(error.response?.data?.detail || 'ไม่สามารถดึงข้อมูลรายวิชาได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsCourseLoading(false)
    }
  }, [apiUrl, selectedDepartmentId])

  useEffect(() => {
    fetchSubjectData()
  }, [fetchSubjectData])

  const filteredSubGroupOptions = useMemo(() => {
    const selectedCategoryId = String(subjectCategoryIdMap[formValue.subjectCategory] || '')
    return subGroupOptions.filter((item) => !item.categoryId || item.categoryId === selectedCategoryId)
  }, [formValue.subjectCategory, subGroupOptions])

  const availableRelatedSubjectList = useMemo(() => {
    const currentCourseCode = formValue.courseCode.trim().toLowerCase()

    return subjectList.filter((subject) => {
      const subjectCourseCode = String(subject.courseCode || '').trim().toLowerCase()

      if (editingSubjectId && subject.id === editingSubjectId) return false
      if (currentCourseCode && subjectCourseCode === currentCourseCode) return false

      return true
    })
  }, [editingSubjectId, formValue.courseCode, subjectList])

  const filteredRelatedSubjectList = useMemo(() => {
    const keyword = relatedSubjectPopup.keyword.trim().toLowerCase()

    if (!keyword) return availableRelatedSubjectList

    return availableRelatedSubjectList.filter((subject) => {
      const courseCode = String(subject.courseCode || '').toLowerCase()
      const courseNameThai = String(subject.courseNameThai || '').toLowerCase()
      const courseNameEnglish = String(subject.courseNameEnglish || '').toLowerCase()

      return courseCode.includes(keyword) || courseNameThai.includes(keyword) || courseNameEnglish.includes(keyword)
    })
  }, [availableRelatedSubjectList, relatedSubjectPopup.keyword])

  const creditFormat = useMemo(() => {
    return `${Number(formValue.totalCredits || 0)}(${Number(formValue.lectureHours || 0)}-${Number(formValue.labHours || 0)}-${Number(formValue.selfStudyHours || 0)})`
  }, [formValue.labHours, formValue.lectureHours, formValue.selfStudyHours, formValue.totalCredits])

  const handleChangeField = (fieldName, value) => {
    setFormValue((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleChangeSubjectCategory = (value) => {
    setFormValue((prev) => ({ ...prev, subjectCategory: value, subCategory: '', subGroupId: '' }))
  }

  const handleChangeSubGroup = (value) => {
    const selectedSubGroup = subGroupOptions.find((item) => item.id === String(value))
    setFormValue((prev) => ({ ...prev, subGroupId: selectedSubGroup?.id || '', subCategory: selectedSubGroup?.name || '' }))
  }

  const openRelatedSubjectPopup = async (target) => {
    const title = target === 'preSubjects' ? 'เลือกวิชาที่ต้องเรียนมาก่อน' : 'เลือกวิชาที่ต้องเรียนพร้อมกัน'
    await fetchSubjectData()
    setRelatedSubjectPopup({ open: true, target, title, keyword: '' })
  }

  const closeRelatedSubjectPopup = () => {
    setRelatedSubjectPopup((prev) => ({ ...prev, open: false }))
  }

  const handleToggleRelatedSubject = (fieldName, value) => {
    if (fieldName === 'hasPreSubjects') {
      setFormValue((prev) => ({ ...prev, hasPreSubjects: value, preSubjects: value === 'yes' ? prev.preSubjects : [] }))
      if (value === 'yes') openRelatedSubjectPopup('preSubjects')
      return
    }

    setFormValue((prev) => ({ ...prev, hasCoSubjects: value, coSubjects: value === 'yes' ? prev.coSubjects : [] }))
    if (value === 'yes') openRelatedSubjectPopup('coSubjects')
  }

  const handleToggleSelectedRelatedSubject = (subject) => {
    const target = relatedSubjectPopup.target
    const selectedText = getSubjectDisplayText(subject)

    setFormValue((prev) => {
      const currentList = Array.isArray(prev[target]) ? prev[target] : []
      const isSelected = currentList.includes(selectedText)
      const nextList = isSelected ? currentList.filter((item) => item !== selectedText) : [...currentList, selectedText]

      return { ...prev, [target]: nextList }
    })
  }

  const handleRemoveRelatedSubject = (fieldName, subjectText) => {
    setFormValue((prev) => {
      const currentList = Array.isArray(prev[fieldName]) ? prev[fieldName] : []
      return { ...prev, [fieldName]: currentList.filter((item) => item !== subjectText) }
    })
  }

  const openPopup = (fieldName, title) => {
    setPopup({ open: true, field: fieldName, title, value: formValue[fieldName] || '' })
  }

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, open: false }))
  }

  const savePopup = () => {
    setFormValue((prev) => ({ ...prev, [popup.field]: popup.value }))
    closePopup()
  }

  const resetForm = () => {
    setFormValue(initialFormValue)
    setEditingSubjectId(null)
  }

  const handleOpenSubjectReviewDialog = async () => {
    await fetchSubjectData()
    setIsSubjectReviewDialogOpen(true)
  }

  const handleCloseSubjectReviewDialog = () => setIsSubjectReviewDialogOpen(false)

  const buildCoursePayload = () => ({
    course_code: formValue.courseCode.trim(),
    course_level: formValue.curriculumLevel || null,
    course_name_th: formValue.courseNameThai.trim(),
    course_name_en: formValue.courseNameEnglish.trim(),
    category_id: subjectCategoryIdMap[formValue.subjectCategory] || null,
    sub_group_id: formValue.subGroupId ? Number(formValue.subGroupId) : null,
    subject_line: formValue.studyLine || null,
    credit_total: Number(formValue.totalCredits || 0),
    credit_lecture: Number(formValue.lectureHours || 0),
    credit_lab: Number(formValue.labHours || 0),
    credit_self_study: Number(formValue.selfStudyHours || 0),
    description_thai: formValue.descriptionThai.trim(),
    description_english: formValue.descriptionEnglish.trim(),
    prerequisite: getRelatedSubjectText(formValue.hasPreSubjects, formValue.preSubjects),
    corequisite: getRelatedSubjectText(formValue.hasCoSubjects, formValue.coSubjects),
    department_id: Number(selectedDepartmentId),
  })

  const handleSubmitSubject = async () => {
    const normalizedCourseCode = formValue.courseCode.trim().toLowerCase()

    if (!selectedDepartmentId) {
      window.alert('กรุณาเลือกสาขาจากหน้าจัดการสาขาก่อน')
      return
    }

    if (!normalizedCourseCode || !formValue.courseNameThai.trim()) {
      window.alert('กรุณากรอกรหัสวิชาและชื่อรายวิชาภาษาไทย')
      return
    }

    const duplicatedSubject = subjectList.find((subject) => {
      if (editingSubjectId && subject.id === editingSubjectId) return false
      return subject.courseCode.trim().toLowerCase() === normalizedCourseCode
    })

    if (duplicatedSubject) {
      window.alert('รหัสวิชานี้มีอยู่แล้วในสาขานี้')
      return
    }

    try {
      setIsSavingSubject(true)
      const config = getAuthConfig()
      const payload = buildCoursePayload()

      if (editingSubjectId) {
        await axios.put(`${apiUrl}/course/${editingSubjectId}`, payload, config)
      } else {
        await axios.post(`${apiUrl}/course/`, payload, config)
      }

      await fetchSubjectData()
      resetForm()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('Error saving subject:', error)
      window.alert(error.response?.data?.detail || 'ไม่สามารถบันทึกรายวิชาได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsSavingSubject(false)
    }
  }

  const handleEditSubject = (subject) => {
    setEditingSubjectId(subject.id)
    setFormValue({
      courseCode: subject.courseCode || '',
      curriculumLevel: subject.curriculumLevel || '',
      courseNameThai: subject.courseNameThai || '',
      courseNameEnglish: subject.courseNameEnglish || '',
      subjectCategory: subject.subjectCategory || 'generalEducation',
      subCategory: subject.subCategory || '',
      subGroupId: subject.subGroupId || '',
      studyLine: subject.studyLine || 'สายวิทยาศาสตร์',
      totalCredits: subject.totalCredits ?? 3,
      lectureHours: subject.lectureHours ?? 3,
      labHours: subject.labHours ?? 0,
      selfStudyHours: subject.selfStudyHours ?? 6,
      descriptionThai: subject.descriptionThai || '',
      descriptionEnglish: subject.descriptionEnglish || '',
      hasPreSubjects: subject.hasPreSubjects || 'no',
      preSubjects: subject.preSubjects || [],
      hasCoSubjects: subject.hasCoSubjects || 'no',
      coSubjects: subject.coSubjects || [],
    })

    setIsSubjectReviewDialogOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteSubject = async (subjectId, subjectName) => {
    const isConfirmed = window.confirm(`ต้องการลบรายวิชา "${subjectName}" ใช่หรือไม่`)
    if (!isConfirmed) return

    try {
      await axios.delete(`${apiUrl}/course/${subjectId}`, getAuthConfig())
      await fetchSubjectData()

      if (editingSubjectId === subjectId) resetForm()
    } catch (error) {
      console.error('Error deleting subject:', error)
      window.alert(error.response?.data?.detail || 'ไม่สามารถลบรายวิชาได้ กรุณาลองใหม่อีกครั้ง')
    }
  }

  const renderPopupField = (label, fieldName, minRows = 5) => (
    <TextField fullWidth multiline minRows={minRows} maxRows={minRows} value={formValue[fieldName]} placeholder="คลิกเพื่อกรอกข้อมูล" InputProps={{ readOnly: true }} onClick={() => openPopup(fieldName, label)} className={styles.popupPreviewField} />
  )

  const renderRelatedSubjectChipList = (fieldName) => {
    const selectedList = formValue[fieldName] || []

    if (selectedList.length === 0) {
      return <Typography className={styles.sectionHint}>ยังไม่ได้เลือกรายวิชา</Typography>
    }

    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
        {selectedList.map((subjectText) => (
          <Chip key={subjectText} label={subjectText} onDelete={() => handleRemoveRelatedSubject(fieldName, subjectText)} />
        ))}
      </Box>
    )
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>{editingSubjectId ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชา'}</Typography>
            <Typography className={styles.pageDescription}>{selectedMajor ? `กำลังจัดการรายวิชาในสาขา ${selectedMajor.majorNameTh}` : 'กรอกข้อมูลรายวิชาที่ต้องการเพิ่มเข้าสู่สาขาที่เลือกไว้'}</Typography>
          </Box>

          <Box className={styles.pageHeaderRight}>
            <Box className={styles.pageStatus}>
              <Typography className={styles.pageStatusLabel}>จำนวนรายวิชา</Typography>
              <Typography className={styles.pageStatusValue}>{subjectList.length}</Typography>
            </Box>

            <Box className={styles.headerActionGroup}>
              <Button variant="outlined" startIcon={<AssessmentRoundedIcon />} className={styles.topReviewButton} onClick={handleOpenSubjectReviewDialog}>ตรวจสอบรายวิชา</Button>
            </Box>
          </Box>
        </Box>

        <Box className={styles.formShell}>
          <Box className={styles.infoBanner}>
            <Box className={styles.infoBadge}>
              <SchoolOutlinedIcon fontSize="small" />
              <Typography className={styles.infoBadgeText}>SUBJECT FORM</Typography>
            </Box>

            <Typography className={styles.infoTitle}>หน้านี้ใช้สำหรับเพิ่มและแก้ไขรายวิชา</Typography>
            <Typography className={styles.infoDescription}>ใช้ฟอร์มนี้ในการเพิ่มรายวิชาใหม่ และสามารถกดปุ่มตรวจสอบรายวิชาเพื่อดูภาพรวมหน่วยกิต ค้นหา แก้ไข หรือลบรายวิชาที่มีอยู่แล้วได้</Typography>
            {isCourseLoading && <Typography className={styles.infoDescription}>กำลังโหลดข้อมูลรายวิชา...</Typography>}
            {courseErrorMessage && <Typography className={styles.infoDescription}>{courseErrorMessage}</Typography>}
          </Box>

          <Box className={styles.sectionCard}>
            <Box className={styles.sectionHeader}>
              <Typography className={styles.sectionTitle}>1) ข้อมูลพื้นฐานของรายวิชา</Typography>
              <Typography className={styles.sectionHint}>กรอกรหัสวิชา ชื่อรายวิชา ระดับหลักสูตร หมวดวิชา กลุ่มย่อย และสายรายวิชา</Typography>
            </Box>

            <Box className={styles.formGridTwo}>
              <TextField label="รหัสวิชา" placeholder="เช่น 04-10-211" value={formValue.courseCode} onChange={(event) => handleChangeField('courseCode', event.target.value)} fullWidth />

              <TextField select label="ระดับหลักสูตร" value={formValue.curriculumLevel} onChange={(event) => handleChangeField('curriculumLevel', event.target.value)} fullWidth>
                {curriculumLevelOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>

              <TextField label="ชื่อรายวิชา (ภาษาไทย)" placeholder="กรอกชื่อรายวิชาภาษาไทย" value={formValue.courseNameThai} onChange={(event) => handleChangeField('courseNameThai', event.target.value)} fullWidth />
              <TextField label="ชื่อรายวิชา (ภาษาอังกฤษ)" placeholder="กรอกชื่อรายวิชาภาษาอังกฤษ" value={formValue.courseNameEnglish} onChange={(event) => handleChangeField('courseNameEnglish', event.target.value)} fullWidth />
            </Box>

            <Divider />

            <Box className={styles.optionSection}>
              <Typography className={styles.fieldLabel}>หมวดวิชา</Typography>

              <RadioGroup row value={formValue.subjectCategory} onChange={(event) => handleChangeSubjectCategory(event.target.value)}>
                {subjectCategoryOptions.map((option) => <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />)}
              </RadioGroup>
            </Box>

            <Box className={styles.formGridTwo}>
              <TextField select label="กลุ่มย่อย" value={formValue.subGroupId} onChange={(event) => handleChangeSubGroup(event.target.value)} fullWidth>
                {filteredSubGroupOptions.length === 0 ? (
                  <MenuItem value="" disabled>ไม่มีกลุ่มย่อยในหมวดนี้</MenuItem>
                ) : (
                  filteredSubGroupOptions.map((option) => <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>)
                )}
              </TextField>
            </Box>

            <Box className={styles.optionSection}>
              <Typography className={styles.fieldLabel}>สายรายวิชา</Typography>

              <RadioGroup row value={formValue.studyLine} onChange={(event) => handleChangeField('studyLine', event.target.value)}>
                {studyLineOptions.map((option) => <FormControlLabel key={option} value={option} control={<Radio />} label={option} />)}
              </RadioGroup>
            </Box>
          </Box>

          <Box className={styles.sectionCard}>
            <Box className={styles.sectionHeader}>
              <Typography className={styles.sectionTitle}>2) หน่วยกิตและชั่วโมง</Typography>
              <Typography className={styles.sectionHint}>ระบุจำนวนหน่วยกิตรวม บรรยาย ปฏิบัติการ และศึกษาด้วยตนเอง</Typography>
            </Box>

            <Box className={styles.formGridFour}>
              <TextField type="number" label="หน่วยกิตรวม" value={formValue.totalCredits} onChange={(event) => handleChangeField('totalCredits', event.target.value)} fullWidth />
              <TextField type="number" label="บรรยาย" value={formValue.lectureHours} onChange={(event) => handleChangeField('lectureHours', event.target.value)} fullWidth />
              <TextField type="number" label="ปฏิบัติการ" value={formValue.labHours} onChange={(event) => handleChangeField('labHours', event.target.value)} fullWidth />
              <TextField type="number" label="ศึกษาด้วยตนเอง" value={formValue.selfStudyHours} onChange={(event) => handleChangeField('selfStudyHours', event.target.value)} fullWidth />
            </Box>

            <Box className={styles.creditPreviewCard}>
              <Typography className={styles.creditPreviewLabel}>รูปแบบหน่วยกิตที่ได้</Typography>
              <Chip label={creditFormat} className={styles.creditChip} />
            </Box>
          </Box>

          <Box className={styles.sectionCard}>
            <Box className={styles.sectionHeader}>
              <Typography className={styles.sectionTitle}>3) คำอธิบายรายวิชา</Typography>
              <Typography className={styles.sectionHint}>คลิกที่ช่องเพื่อเปิดหน้ากรอกข้อมูลแบบเต็ม เหมือนแนวของหน้า MQA</Typography>
            </Box>

            <Box className={styles.formGridOne}>
              {renderPopupField('คำอธิบายรายวิชา (ภาษาไทย)', 'descriptionThai', 5)}
              {renderPopupField('คำอธิบายรายวิชา (ภาษาอังกฤษ)', 'descriptionEnglish', 5)}
            </Box>
          </Box>

          <Box className={styles.sectionCard}>
            <Box className={styles.sectionHeader}>
              <Typography className={styles.sectionTitle}>4) วิชาที่ต้องเรียนมาก่อนและวิชาที่ต้องเรียนพร้อมกัน</Typography>
              <Typography className={styles.sectionHint}>เลือกจากรายวิชาที่มีอยู่แล้วในสาขานี้ สามารถค้นหารหัสวิชา ชื่อไทย หรือชื่ออังกฤษได้</Typography>
            </Box>

            <Box className={styles.relatedSubjectBlock}>
              <Typography className={styles.fieldLabel}>วิชาที่ต้องเรียนมาก่อน</Typography>

              <RadioGroup row value={formValue.hasPreSubjects} onChange={(event) => handleToggleRelatedSubject('hasPreSubjects', event.target.value)}>
                <FormControlLabel value="no" control={<Radio />} label="ไม่มี" />
                <FormControlLabel value="yes" control={<Radio />} label="มี" />
              </RadioGroup>

              {formValue.hasPreSubjects === 'yes' && (
                <Box>
                  {renderRelatedSubjectChipList('preSubjects')}
                  <Button variant="outlined" sx={{ mt: 1 }} onClick={() => openRelatedSubjectPopup('preSubjects')}>
                    เลือกวิชาที่ต้องเรียนมาก่อน
                  </Button>
                </Box>
              )}
            </Box>

            <Divider />

            <Box className={styles.relatedSubjectBlock}>
              <Typography className={styles.fieldLabel}>วิชาที่ต้องเรียนพร้อมกัน</Typography>

              <RadioGroup row value={formValue.hasCoSubjects} onChange={(event) => handleToggleRelatedSubject('hasCoSubjects', event.target.value)}>
                <FormControlLabel value="no" control={<Radio />} label="ไม่มี" />
                <FormControlLabel value="yes" control={<Radio />} label="มี" />
              </RadioGroup>

              {formValue.hasCoSubjects === 'yes' && (
                <Box>
                  {renderRelatedSubjectChipList('coSubjects')}
                  <Button variant="outlined" sx={{ mt: 1 }} onClick={() => openRelatedSubjectPopup('coSubjects')}>
                    เลือกวิชาที่ต้องเรียนพร้อมกัน
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} className={styles.backButton} onClick={() => navigate('/manageMajor')}>กลับ</Button>

            <Box className={styles.actionButtonGroup}>
              {editingSubjectId && <Button variant="outlined" className={styles.cancelEditButton} onClick={resetForm}>ยกเลิกการแก้ไข</Button>}

              <Button variant="contained" startIcon={<SaveRoundedIcon />} className={styles.saveButton} onClick={handleSubmitSubject} disabled={isSavingSubject}>
                {editingSubjectId ? 'บันทึกการแก้ไข' : 'บันทึกรายวิชา'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Dialog open={popup.open} onClose={closePopup} maxWidth="md" fullWidth>
        <DialogTitle>{popup.title}</DialogTitle>

        <DialogContent>
          <TextField fullWidth multiline minRows={12} value={popup.value} onChange={(event) => setPopup((prev) => ({ ...prev, value: event.target.value }))} className={styles.dialogField} />
        </DialogContent>

        <DialogActions>
          <Button onClick={closePopup}>ยกเลิก</Button>
          <Button variant="contained" onClick={savePopup}>บันทึก</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={relatedSubjectPopup.open} onClose={closeRelatedSubjectPopup} maxWidth="md" fullWidth>
        <DialogTitle>{relatedSubjectPopup.title}</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            value={relatedSubjectPopup.keyword}
            placeholder="ค้นหารหัสวิชา ชื่อไทย หรือชื่ออังกฤษ..."
            onChange={(event) => setRelatedSubjectPopup((prev) => ({ ...prev, keyword: event.target.value }))}
            sx={{ mt: 1, mb: 2 }}
          />

          {filteredRelatedSubjectList.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography>ยังไม่มีรายวิชาสำหรับเลือก หรือไม่พบรายวิชาที่ค้นหา</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {filteredRelatedSubjectList.map((subject) => {
                const selectedText = getSubjectDisplayText(subject)
                const selectedList = formValue[relatedSubjectPopup.target] || []
                const isSelected = selectedList.includes(selectedText)

                return (
                  <Box key={subject.id || subject.courseCode} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, border: '1px solid #e5e7eb', borderRadius: 2, p: 2 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{subject.courseCode || '-'}</Typography>
                      <Typography>{subject.courseNameThai || '-'}</Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>{subject.courseNameEnglish || '-'}</Typography>
                    </Box>

                    <Button variant={isSelected ? 'contained' : 'outlined'} onClick={() => handleToggleSelectedRelatedSubject(subject)}>
                      {isSelected ? 'เลือกแล้ว' : 'เลือก'}
                    </Button>
                  </Box>
                )
              })}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeRelatedSubjectPopup}>ปิด</Button>
        </DialogActions>
      </Dialog>

      <SubjectReviewDialog
        open={isSubjectReviewDialogOpen}
        onClose={handleCloseSubjectReviewDialog}
        selectedMajor={selectedMajor}
        activeOverviewLevel="all"
        isUsingDefaultOverviewLevel={false}
        subjectList={subjectList}
        curriculumLevelOptions={curriculumLevelOptions}
        subjectCategoryOptions={subjectCategoryOptions}
        onEditSubject={handleEditSubject}
        onDeleteSubject={handleDeleteSubject}
      />
    </Box>
  )
}

export default AddSubjectPage