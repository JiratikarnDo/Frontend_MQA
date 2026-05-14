import { useEffect, useMemo, useState } from 'react'
import {
  Autocomplete,
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
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
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

const subCategoryOptions = [
  'กลุ่มสาระวิชาอัตลักษณ์',
  'กลุ่มสาระวิชาคุณภาพชีวิต',
  'กลุ่มสาระวิชาคุณภาพการทำงาน',
  'กลุ่มสาระวิชาภาษาและการสื่อสาร',
  'กลุ่มสาระวิชาการปรับตัวและการใช้ชีวิต',
  'กลุ่มสาระวิชาความเป็นพลเมืองไทยและพลเมืองโลก',
  'กลุ่มวิชาแกน',
  'กลุ่มวิชาบังคับ',
  'กลุ่มวิชาเลือก',
  'กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ',
  'วิชาเลือกเสรี',
]

const studyLineOptions = [
  'สายวิทยาศาสตร์',
  'สายมนุษยศาสตร์และสังคมศาสตร์',
]

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const initialFormValue = {
  courseCode: '',
  curriculumLevel: '',
  courseNameThai: '',
  courseNameEnglish: '',
  subjectCategory: 'generalEducation',
  subCategory: '',
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

const initialSubjectList = []



const getFirstTextValue = (...values) => {
  for (const value of values) {
    const cleanValue = String(value ?? '').trim()

    if (cleanValue) {
      return cleanValue
    }
  }

  return ''
}

const getNormalizedCourseCode = (courseCode) => {
  return String(courseCode || '').trim().toLowerCase()
}

const normalizeImportedSubject = (subject) => {
  const preSubjects = Array.isArray(subject.preSubjects)
    ? subject.preSubjects
    : Array.isArray(subject.pre_subjects)
      ? subject.pre_subjects
      : []

  const coSubjects = Array.isArray(subject.coSubjects)
    ? subject.coSubjects
    : Array.isArray(subject.co_subjects)
      ? subject.co_subjects
      : []

  return {
    id: subject.id || Date.now() + Math.random(),
    courseCode: getFirstTextValue(
      subject.courseCode,
      subject.course_code,
      subject.code
    ),
    curriculumLevel: getFirstTextValue(
      subject.curriculumLevel,
      subject.curriculum_level,
      subject.courseLevel,
      subject.course_level,
      'bachelor'
    ),
    courseNameThai: getFirstTextValue(
      subject.courseNameThai,
      subject.courseNameTh,
      subject.course_name_thai,
      subject.course_name_th,
      subject.nameThai,
      subject.name_thai
    ),
    courseNameEnglish: getFirstTextValue(
      subject.courseNameEnglish,
      subject.courseNameEn,
      subject.course_name_english,
      subject.course_name_en,
      subject.nameEnglish,
      subject.name_english,
      subject.englishName,
      subject.english_name
    ),
    subjectCategory: getFirstTextValue(
      subject.subjectCategory,
      subject.subject_category,
      'specific'
    ),
    subCategory: getFirstTextValue(
      subject.subCategory,
      subject.sub_category
    ),
    studyLine: getFirstTextValue(
      subject.studyLine,
      subject.study_line,
      'สายวิทยาศาสตร์'
    ),
    totalCredits: Number(subject.totalCredits ?? subject.total_credits ?? 0),
    lectureHours: Number(subject.lectureHours ?? subject.lecture_hours ?? 0),
    labHours: Number(subject.labHours ?? subject.lab_hours ?? 0),
    selfStudyHours: Number(subject.selfStudyHours ?? subject.self_study_hours ?? 0),
    descriptionThai: getFirstTextValue(
      subject.descriptionThai,
      subject.descriptionTh,
      subject.description_thai,
      subject.description_th
    ),
    descriptionEnglish: getFirstTextValue(
      subject.descriptionEnglish,
      subject.descriptionEn,
      subject.description_english,
      subject.description_en
    ),
    hasPreSubjects: getFirstTextValue(
      subject.hasPreSubjects,
      subject.has_pre_subjects,
      preSubjects.length > 0 ? 'yes' : 'no'
    ),
    preSubjects,
    hasCoSubjects: getFirstTextValue(
      subject.hasCoSubjects,
      subject.has_co_subjects,
      coSubjects.length > 0 ? 'yes' : 'no'
    ),
    coSubjects,
  }
}


const getSelectedDepartmentId = (selectedMajor) => {
  return (
    selectedMajor?.id ||
    selectedMajor?.departmentId ||
    selectedMajor?.department_id ||
    selectedMajor?.majorId ||
    null
  )
}

const getAuthToken = () => {
  return (
    localStorage.getItem('mqa_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    ''
  )
}

const buildCoursePayload = (subject, selectedMajor) => {
  return {
    courseCode: subject.courseCode || '',
    curriculumLevel: subject.curriculumLevel || 'bachelor',
    courseNameThai: subject.courseNameThai || '',
    courseNameEnglish: subject.courseNameEnglish || '',
    subjectCategory: subject.subjectCategory || 'specific',
    subCategory: subject.subCategory || '',
    studyLine: subject.studyLine || 'สายวิทยาศาสตร์',
    totalCredits: Number(subject.totalCredits || 0),
    lectureHours: Number(subject.lectureHours || 0),
    labHours: Number(subject.labHours || 0),
    selfStudyHours: Number(subject.selfStudyHours || 0),
    descriptionThai: subject.descriptionThai || '',
    descriptionEnglish: subject.descriptionEnglish || '',
    hasPreSubjects: subject.preSubjects?.length ? 'yes' : subject.hasPreSubjects || 'no',
    preSubjects: Array.isArray(subject.preSubjects) ? subject.preSubjects : [],
    hasCoSubjects: subject.coSubjects?.length ? 'yes' : subject.hasCoSubjects || 'no',
    coSubjects: Array.isArray(subject.coSubjects) ? subject.coSubjects : [],
    departmentId: getSelectedDepartmentId(selectedMajor),
  }
}

function AddSubjectPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedMajor = location.state?.major || null

  const [formValue, setFormValue] = useState(initialFormValue)
  const [popup, setPopup] = useState({
    open: false,
    field: '',
    title: '',
    value: '',
  })
  const [subjectList, setSubjectList] = useState(initialSubjectList)
  const [editingSubjectId, setEditingSubjectId] = useState(null)
  const [isSubjectReviewDialogOpen, setIsSubjectReviewDialogOpen] = useState(false)
  const [wordFiles, setWordFiles] = useState([])
  const [isImportingWord, setIsImportingWord] = useState(false)
  const [importWordMessage, setImportWordMessage] = useState('')
  const [importWordError, setImportWordError] = useState('')
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)
  const [loadSubjectError, setLoadSubjectError] = useState('')
  const [isSavingSubject, setIsSavingSubject] = useState(false)

  const creditFormat = useMemo(() => {
    return `${Number(formValue.totalCredits || 0)}(${Number(formValue.lectureHours || 0)}-${Number(formValue.labHours || 0)}-${Number(formValue.selfStudyHours || 0)})`
  }, [
    formValue.labHours,
    formValue.lectureHours,
    formValue.selfStudyHours,
    formValue.totalCredits,
  ])

  const activeOverviewLevel = formValue.curriculumLevel || 'bachelor'
  const isUsingDefaultOverviewLevel = !formValue.curriculumLevel
  const selectedDepartmentId = getSelectedDepartmentId(selectedMajor)

  const referenceSubjectOptions = useMemo(() => {
    return subjectList
      .filter((subject) => subject.courseCode)
      .map((subject) => {
        const name = subject.courseNameThai || subject.courseNameEnglish || ''
        return `${subject.courseCode}${name ? ` ${name}` : ''}`.trim()
      })
  }, [subjectList])

  const loadSubjectsFromBackend = async () => {
    const token = getAuthToken()

    if (!token) {
      setSubjectList([])
      setLoadSubjectError('ไม่พบ token การเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่')
      return
    }

    setIsLoadingSubjects(true)
    setLoadSubjectError('')

    try {
      const queryParams = new URLSearchParams({
        page: '1',
        size: '1000',
      })

      if (selectedDepartmentId) {
        queryParams.set('departmentId', String(selectedDepartmentId))
      }

      const response = await fetch(`${apiBaseUrl}/course/?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'โหลดรายวิชาจากฐานข้อมูลไม่สำเร็จ')
      }

      const subjectArray = Array.isArray(result)
        ? result
        : Array.isArray(result.subjects)
          ? result.subjects
          : []

      setSubjectList(subjectArray.map((subject) => normalizeImportedSubject(subject)))
    } catch (error) {
      setSubjectList([])
      setLoadSubjectError(error.message || 'โหลดรายวิชาจากฐานข้อมูลไม่สำเร็จ')
    } finally {
      setIsLoadingSubjects(false)
    }
  }

  useEffect(() => {
    loadSubjectsFromBackend()
  }, [selectedDepartmentId])

  const handleChangeField = (fieldName, value) => {
    setFormValue((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const handleChangeMultiValueField = (fieldName, valueList) => {
    const normalizedValueList = Array.from(
      new Set(
        valueList
          .map((item) => String(item).trim())
          .filter(Boolean)
      )
    )

    setFormValue((prev) => ({
      ...prev,
      [fieldName]: normalizedValueList,
    }))
  }

  const handleToggleRelatedSubject = (fieldName, value) => {
    setFormValue((prev) => {
      if (fieldName === 'hasPreSubjects') {
        return {
          ...prev,
          hasPreSubjects: value,
          preSubjects: value === 'yes' ? prev.preSubjects : [],
        }
      }

      return {
        ...prev,
        hasCoSubjects: value,
        coSubjects: value === 'yes' ? prev.coSubjects : [],
      }
    })
  }

  const openPopup = (fieldName, title) => {
    setPopup({
      open: true,
      field: fieldName,
      title,
      value: formValue[fieldName] || '',
    })
  }

  const closePopup = () => {
    setPopup((prev) => ({
      ...prev,
      open: false,
    }))
  }

  const savePopup = () => {
    setFormValue((prev) => ({
      ...prev,
      [popup.field]: popup.value,
    }))

    closePopup()
  }

  const resetForm = () => {
    setFormValue(initialFormValue)
    setEditingSubjectId(null)
  }

  const handleOpenSubjectReviewDialog = () => {
    setIsSubjectReviewDialogOpen(true)
  }

  const handleCloseSubjectReviewDialog = () => {
    setIsSubjectReviewDialogOpen(false)
  }


  const mergeSubjectListByCourseCode = (currentList, importedList) => {
    const subjectMap = new Map()

    currentList.forEach((subject) => {
      subjectMap.set(getNormalizedCourseCode(subject.courseCode), subject)
    })

    importedList.forEach((subject) => {
      const normalizedSubject = normalizeImportedSubject(subject)
      const normalizedCode = getNormalizedCourseCode(normalizedSubject.courseCode)

      if (!normalizedCode) return

      subjectMap.set(normalizedCode, normalizedSubject)
    })

    return Array.from(subjectMap.values()).sort((a, b) => {
      return String(a.courseCode || '').localeCompare(String(b.courseCode || ''))
    })
  }

  const handleWordFilesChange = (event) => {
    const selectedFiles = Array.from(event.target.files || [])

    setImportWordMessage('')
    setImportWordError('')

    if (selectedFiles.length > 2) {
      setWordFiles([])
      event.target.value = ''
      setImportWordError('อัปโหลดได้สูงสุด 2 ไฟล์เท่านั้น')
      return
    }

    const invalidFile = selectedFiles.find((file) => {
      const lowerName = file.name.toLowerCase()
      return !lowerName.endsWith('.doc') && !lowerName.endsWith('.docx')
    })

    if (invalidFile) {
      setWordFiles([])
      event.target.value = ''
      setImportWordError(`ไฟล์ ${invalidFile.name} ไม่ใช่ไฟล์ .doc หรือ .docx`)
      return
    }

    const temporaryFile = selectedFiles.find((file) => file.name.startsWith('~$'))

    if (temporaryFile) {
      setWordFiles([])
      event.target.value = ''
      setImportWordError(`ไฟล์ ${temporaryFile.name} เป็นไฟล์ชั่วคราวของ Microsoft Word กรุณาเลือกไฟล์จริง`)
      return
    }

    setWordFiles(selectedFiles)
  }

  const handleImportSubjectsFromWord = async () => {
    if (wordFiles.length === 0) {
      setImportWordError('กรุณาเลือกไฟล์ .doc หรือ .docx ก่อน')
      return
    }

    const token = localStorage.getItem('mqa_token')

    if (!token) {
      setImportWordError('ไม่พบ token การเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่')
      return
    }

    const formData = new FormData()

    wordFiles.forEach((file) => {
      formData.append('files', file)
    })

    formData.append('courseLevel', formValue.curriculumLevel || activeOverviewLevel || 'bachelor')

    if (selectedMajor?.id) {
      formData.append('departmentId', selectedMajor.id)
    }

    setIsImportingWord(true)
    setImportWordMessage('')
    setImportWordError('')

    try {
      const response = await fetch(`${apiBaseUrl}/course/import-docx`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'นำเข้ารายวิชาจากไฟล์ Word ไม่สำเร็จ')
      }

      const importedSubjects = Array.isArray(result.subjects) ? result.subjects : []

      setSubjectList((prev) => mergeSubjectListByCourseCode(prev, importedSubjects))
      await loadSubjectsFromBackend()
      setImportWordMessage(
        `นำเข้าสำเร็จ ${result.totalCount || importedSubjects.length} รายวิชา ` +
        `(เพิ่มใหม่ ${result.createdCount || 0}, อัปเดต ${result.updatedCount || 0})`
      )
      setIsSubjectReviewDialogOpen(true)
    } catch (error) {
      setImportWordError(error.message || 'นำเข้ารายวิชาจากไฟล์ Word ไม่สำเร็จ')
    } finally {
      setIsImportingWord(false)
    }
  }

  const handleSubmitSubject = async () => {
    const normalizedCourseCode = formValue.courseCode.trim().toLowerCase()

    if (!normalizedCourseCode || !formValue.courseNameThai.trim()) {
      window.alert('กรุณากรอกรหัสวิชาและชื่อรายวิชาภาษาไทย')
      return
    }

    if (!selectedDepartmentId) {
      window.alert('ไม่พบรหัสสาขา กรุณากลับไปเลือกสาขาก่อนเพิ่มรายวิชา')
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

    const token = getAuthToken()

    if (!token) {
      window.alert('ไม่พบ token การเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่')
      return
    }

    const payload = buildCoursePayload({
      ...formValue,
      courseCode: formValue.courseCode.trim(),
      courseNameThai: formValue.courseNameThai.trim(),
      courseNameEnglish: formValue.courseNameEnglish.trim(),
      descriptionThai: formValue.descriptionThai.trim(),
      descriptionEnglish: formValue.descriptionEnglish.trim(),
      totalCredits: Number(formValue.totalCredits || 0),
      lectureHours: Number(formValue.lectureHours || 0),
      labHours: Number(formValue.labHours || 0),
      selfStudyHours: Number(formValue.selfStudyHours || 0),
    }, selectedMajor)

    setIsSavingSubject(true)

    try {
      const response = await fetch(`${apiBaseUrl}/course/add-subject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'บันทึกรายวิชาไม่สำเร็จ')
      }

      const savedSubject = normalizeImportedSubject(result.subject || payload)

      setSubjectList((prev) => mergeSubjectListByCourseCode(
        prev.filter((subject) => !editingSubjectId || subject.id !== editingSubjectId),
        [savedSubject]
      ))

      resetForm()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      window.alert(error.message || 'บันทึกรายวิชาไม่สำเร็จ')
    } finally {
      setIsSavingSubject(false)
    }
  }

  const handleEditSubject = (subject) => {
    const normalizedSubject = normalizeImportedSubject(subject)

    setEditingSubjectId(subject.id)
    setFormValue({
      courseCode: normalizedSubject.courseCode || '',
      curriculumLevel: normalizedSubject.curriculumLevel || '',
      courseNameThai: normalizedSubject.courseNameThai || '',
      courseNameEnglish: normalizedSubject.courseNameEnglish || '',
      subjectCategory: normalizedSubject.subjectCategory || 'generalEducation',
      subCategory: normalizedSubject.subCategory || '',
      studyLine: normalizedSubject.studyLine || 'สายวิทยาศาสตร์',
      totalCredits: normalizedSubject.totalCredits ?? 3,
      lectureHours: normalizedSubject.lectureHours ?? 3,
      labHours: normalizedSubject.labHours ?? 0,
      selfStudyHours: normalizedSubject.selfStudyHours ?? 6,
      descriptionThai: normalizedSubject.descriptionThai || '',
      descriptionEnglish: normalizedSubject.descriptionEnglish || '',
      hasPreSubjects: normalizedSubject.hasPreSubjects || 'no',
      preSubjects: normalizedSubject.preSubjects || [],
      hasCoSubjects: normalizedSubject.hasCoSubjects || 'no',
      coSubjects: normalizedSubject.coSubjects || [],
    })

    setIsSubjectReviewDialogOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteSubject = async (subjectId, subjectName) => {
    const isConfirmed = window.confirm(`ต้องการลบรายวิชา "${subjectName}" ใช่หรือไม่`)

    if (!isConfirmed) return

    const token = getAuthToken()

    if (!token) {
      window.alert('ไม่พบ token การเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่')
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/course/${subjectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.detail || 'ลบรายวิชาไม่สำเร็จ')
      }

      setSubjectList((prev) => prev.filter((subject) => subject.id !== subjectId))

      if (editingSubjectId === subjectId) {
        resetForm()
      }
    } catch (error) {
      window.alert(error.message || 'ลบรายวิชาไม่สำเร็จ')
    }
  }

  const renderPopupField = (label, fieldName, minRows = 5) => (
    <TextField
      fullWidth
      multiline
      minRows={minRows}
      maxRows={minRows}
      value={formValue[fieldName]}
      placeholder="คลิกเพื่อกรอกข้อมูล"
      InputProps={{ readOnly: true }}
      onClick={() => openPopup(fieldName, label)}
      className={styles.popupPreviewField}
    />
  )

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>
              {editingSubjectId ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชา'}
            </Typography>

            <Typography className={styles.pageDescription}>
              {selectedMajor
                ? `กำลังจัดการรายวิชาในสาขา ${selectedMajor.majorNameTh}`
                : 'กรอกข้อมูลรายวิชาที่ต้องการเพิ่มเข้าสู่สาขาที่เลือกไว้'}
            </Typography>
          </Box>

          <Box className={styles.pageHeaderRight}>
            <Box className={styles.pageStatus}>
              <Typography className={styles.pageStatusLabel}>
                จำนวนรายวิชา
              </Typography>

              <Typography className={styles.pageStatusValue}>
                {subjectList.length}
              </Typography>
            </Box>

            <Box className={styles.headerActionGroup}>
              <Button
                variant="outlined"
                startIcon={<AssessmentRoundedIcon />}
                className={styles.topReviewButton}
                onClick={handleOpenSubjectReviewDialog}
              >
                ตรวจสอบรายวิชา
              </Button>
            </Box>
          </Box>
        </Box>

        <Box className={styles.formShell}>
          {isLoadingSubjects && (
            <Typography sx={{ color: '#2563eb', fontWeight: 700 }}>
              กำลังโหลดรายวิชาจากฐานข้อมูล...
            </Typography>
          )}

          {loadSubjectError && (
            <Typography sx={{ color: '#dc2626', fontWeight: 700 }}>
              {loadSubjectError}
            </Typography>
          )}

          <Box className={styles.infoBanner}>
            <Box className={styles.infoBadge}>
              <SchoolOutlinedIcon fontSize="small" />
              <Typography className={styles.infoBadgeText}>
                SUBJECT FORM
              </Typography>
            </Box>

            <Typography className={styles.infoTitle}>
              หน้านี้ใช้สำหรับเพิ่มและแก้ไขรายวิชา
            </Typography>

            <Typography className={styles.infoDescription}>
              ใช้ฟอร์มนี้ในการเพิ่มรายวิชาใหม่ และสามารถกดปุ่มตรวจสอบรายวิชาเพื่อดูภาพรวมหน่วยกิต ค้นหา แก้ไข หรือลบรายวิชาที่มีอยู่แล้วได้
            </Typography>
          </Box>

          <Box className={styles.sectionCard}>
            <Box className={styles.sectionHeader}>
              <Typography className={styles.sectionTitle}>
                อัปโหลดไฟล์ Word เพื่อนำเข้ารายวิชา
              </Typography>

              <Typography className={styles.sectionHint}>
                รองรับไฟล์ .docx และ .doc
              </Typography>
            </Box>

            <Box className={styles.formGridTwo}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileRoundedIcon />}
                className={styles.backButton}
              >
                เลือกไฟล์ Word
                <input
                  type="file"
                  accept=".doc,.docx"
                  multiple
                  hidden
                  onChange={handleWordFilesChange}
                />
              </Button>

              <TextField
                label="ไฟล์ที่เลือก"
                value={wordFiles.map((file) => file.name).join(', ')}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Box>

            <Box className={styles.actionButtonGroup}>
              <Button
                variant="contained"
                className={styles.saveButton}
                onClick={handleImportSubjectsFromWord}
                disabled={isImportingWord || wordFiles.length === 0}
              >
                {isImportingWord ? 'กำลังนำเข้า...' : 'นำเข้ารายวิชา'}
              </Button>
            </Box>

            {importWordError && (
              <Typography sx={{ color: '#dc2626', fontWeight: 700 }}>
                {importWordError}
              </Typography>
            )}

            {importWordMessage && (
              <Typography sx={{ color: '#15803d', fontWeight: 700 }}>
                {importWordMessage}
              </Typography>
            )}
          </Box>

          <Box className={styles.sectionCard}>
            <Box className={styles.sectionHeader}>
              <Typography className={styles.sectionTitle}>
                1) ข้อมูลพื้นฐานของรายวิชา
              </Typography>

              <Typography className={styles.sectionHint}>
                กรอกรหัสวิชา ชื่อรายวิชา ระดับหลักสูตร หมวดวิชา กลุ่มย่อย และสายรายวิชา
              </Typography>
            </Box>

            <Box className={styles.formGridTwo}>
              <TextField
                label="รหัสวิชา"
                placeholder="เช่น 04-10-211"
                value={formValue.courseCode}
                onChange={(event) => handleChangeField('courseCode', event.target.value)}
                fullWidth
              />

              <TextField
                select
                label="ระดับหลักสูตร"
                value={formValue.curriculumLevel}
                onChange={(event) => handleChangeField('curriculumLevel', event.target.value)}
                fullWidth
              >
                {curriculumLevelOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="ชื่อรายวิชา (ภาษาไทย)"
                placeholder="กรอกชื่อรายวิชาภาษาไทย"
                value={formValue.courseNameThai}
                onChange={(event) => handleChangeField('courseNameThai', event.target.value)}
                fullWidth
              />

              <TextField
                label="ชื่อรายวิชา (ภาษาอังกฤษ)"
                placeholder="กรอกชื่อรายวิชาภาษาอังกฤษ"
                value={formValue.courseNameEnglish}
                onChange={(event) => handleChangeField('courseNameEnglish', event.target.value)}
                fullWidth
              />
            </Box>

            <Divider />

            <Box className={styles.optionSection}>
              <Typography className={styles.fieldLabel}>
                หมวดวิชา
              </Typography>

              <RadioGroup
                row
                value={formValue.subjectCategory}
                onChange={(event) => handleChangeField('subjectCategory', event.target.value)}
              >
                {subjectCategoryOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio />}
                    label={option.label}
                  />
                ))}
              </RadioGroup>
            </Box>

            <Box className={styles.formGridTwo}>
              <TextField
                select
                label="กลุ่มย่อย"
                value={formValue.subCategory}
                onChange={(event) => handleChangeField('subCategory', event.target.value)}
                fullWidth
              >
                {subCategoryOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box className={styles.optionSection}>
              <Typography className={styles.fieldLabel}>
                สายรายวิชา
              </Typography>

              <RadioGroup
                row
                value={formValue.studyLine}
                onChange={(event) => handleChangeField('studyLine', event.target.value)}
              >
                {studyLineOptions.map((option) => (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            </Box>
          </Box>

          <Box className={styles.sectionCard}>
            <Box className={styles.sectionHeader}>
              <Typography className={styles.sectionTitle}>
                2) หน่วยกิตและชั่วโมง
              </Typography>

              <Typography className={styles.sectionHint}>
                ระบุจำนวนหน่วยกิตรวม บรรยาย ปฏิบัติการ และศึกษาด้วยตนเอง
              </Typography>
            </Box>

            <Box className={styles.formGridFour}>
              <TextField
                type="number"
                label="หน่วยกิตรวม"
                value={formValue.totalCredits}
                onChange={(event) => handleChangeField('totalCredits', event.target.value)}
                fullWidth
              />

              <TextField
                type="number"
                label="บรรยาย"
                value={formValue.lectureHours}
                onChange={(event) => handleChangeField('lectureHours', event.target.value)}
                fullWidth
              />

              <TextField
                type="number"
                label="ปฏิบัติการ"
                value={formValue.labHours}
                onChange={(event) => handleChangeField('labHours', event.target.value)}
                fullWidth
              />

              <TextField
                type="number"
                label="ศึกษาด้วยตนเอง"
                value={formValue.selfStudyHours}
                onChange={(event) => handleChangeField('selfStudyHours', event.target.value)}
                fullWidth
              />
            </Box>

            <Box className={styles.creditPreviewCard}>
              <Typography className={styles.creditPreviewLabel}>
                รูปแบบหน่วยกิตที่ได้
              </Typography>

              <Chip
                label={creditFormat}
                className={styles.creditChip}
              />
            </Box>
          </Box>

          <Box className={styles.sectionCard}>
            <Box className={styles.sectionHeader}>
              <Typography className={styles.sectionTitle}>
                3) คำอธิบายรายวิชา
              </Typography>

              <Typography className={styles.sectionHint}>
                คลิกที่ช่องเพื่อเปิดหน้ากรอกข้อมูลแบบเต็ม เหมือนแนวของหน้า MQA
              </Typography>
            </Box>

            <Box className={styles.formGridOne}>
              {renderPopupField('คำอธิบายรายวิชา (ภาษาไทย)', 'descriptionThai', 5)}
              {renderPopupField('คำอธิบายรายวิชา (ภาษาอังกฤษ)', 'descriptionEnglish', 5)}
            </Box>
          </Box>

          <Box className={styles.sectionCard}>
            <Box className={styles.sectionHeader}>
              <Typography className={styles.sectionTitle}>
                4) วิชาที่ต้องเรียนมาก่อนและวิชาที่ต้องเรียนพร้อมกัน
              </Typography>

              <Typography className={styles.sectionHint}>
                เลือกก่อนว่ามีหรือไม่มี ถ้าเลือกว่ามี ระบบจะแสดงช่องให้กรอก
              </Typography>
            </Box>

            <Box className={styles.relatedSubjectBlock}>
              <Typography className={styles.fieldLabel}>
                วิชาที่ต้องเรียนมาก่อน
              </Typography>

              <RadioGroup
                row
                value={formValue.hasPreSubjects}
                onChange={(event) => handleToggleRelatedSubject('hasPreSubjects', event.target.value)}
              >
                <FormControlLabel value="no" control={<Radio />} label="ไม่มี" />
                <FormControlLabel value="yes" control={<Radio />} label="มี" />
              </RadioGroup>

              {formValue.hasPreSubjects === 'yes' && (
                <Autocomplete
                  multiple
                  freeSolo
                  options={referenceSubjectOptions}
                  value={formValue.preSubjects}
                  onChange={(event, value) => handleChangeMultiValueField('preSubjects', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="วิชาบังคับก่อน"
                      placeholder="เลือกจากรายการหรือพิมพ์เอง"
                    />
                  )}
                />
              )}
            </Box>

            <Divider />

            <Box className={styles.relatedSubjectBlock}>
              <Typography className={styles.fieldLabel}>
                วิชาที่ต้องเรียนพร้อมกัน
              </Typography>

              <RadioGroup
                row
                value={formValue.hasCoSubjects}
                onChange={(event) => handleToggleRelatedSubject('hasCoSubjects', event.target.value)}
              >
                <FormControlLabel value="no" control={<Radio />} label="ไม่มี" />
                <FormControlLabel value="yes" control={<Radio />} label="มี" />
              </RadioGroup>

              {formValue.hasCoSubjects === 'yes' && (
                <Autocomplete
                  multiple
                  freeSolo
                  options={referenceSubjectOptions}
                  value={formValue.coSubjects}
                  onChange={(event, value) => handleChangeMultiValueField('coSubjects', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="วิชาที่ต้องเรียนพร้อมกัน"
                      placeholder="เลือกจากรายการหรือพิมพ์เอง"
                    />
                  )}
                />
              )}
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackRoundedIcon />}
              className={styles.backButton}
              onClick={() => navigate('/manageMajor')}
            >
              กลับ
            </Button>

            <Box className={styles.actionButtonGroup}>
              {editingSubjectId && (
                <Button
                  variant="outlined"
                  className={styles.cancelEditButton}
                  onClick={resetForm}
                >
                  ยกเลิกการแก้ไข
                </Button>
              )}

              <Button
                variant="contained"
                startIcon={<SaveRoundedIcon />}
                className={styles.saveButton}
                onClick={handleSubmitSubject}
                disabled={isSavingSubject}
              >
                {isSavingSubject ? 'กำลังบันทึก...' : editingSubjectId ? 'บันทึกการแก้ไข' : 'บันทึกรายวิชา'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Dialog open={popup.open} onClose={closePopup} maxWidth="md" fullWidth>
        <DialogTitle>{popup.title}</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={12}
            value={popup.value}
            onChange={(event) =>
              setPopup((prev) => ({
                ...prev,
                value: event.target.value,
              }))
            }
            className={styles.dialogField}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={closePopup}>ยกเลิก</Button>
          <Button variant="contained" onClick={savePopup}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      <SubjectReviewDialog
        open={isSubjectReviewDialogOpen}
        onClose={handleCloseSubjectReviewDialog}
        selectedMajor={selectedMajor}
        activeOverviewLevel={activeOverviewLevel}
        isUsingDefaultOverviewLevel={isUsingDefaultOverviewLevel}
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