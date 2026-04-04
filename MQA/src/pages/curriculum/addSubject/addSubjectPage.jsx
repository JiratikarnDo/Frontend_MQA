import { useMemo, useState } from 'react'
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
  'กลุ่มวิชาสังคมศาสตร์และมนุษยศาสตร์',
  'กลุ่มวิชาภาษา',
  'กลุ่มวิชาวิทยาศาสตร์กับคณิตศาสตร์',
  'กลุ่มบูรณาการ',
  'กลุ่มวิชาแกน',
  'กลุ่มวิชาเฉพาะด้าน',
  'กลุ่มวิชาเลือก',
  'กลุ่มวิชาโครงงานสำหรับวิทยาการคอมพิวเตอร์',
  'กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ',
]

const studyLineOptions = [
  'สายวิทยาศาสตร์',
  'สายมนุษยศาสตร์และสังคมศาสตร์',
]

const mockReferenceSubjectOptions = [
  '04-10-101 การคิดอย่างเป็นระบบ',
  '04-10-102 ภาษาอังกฤษเพื่อการสื่อสาร',
  '04-10-103 คณิตศาสตร์พื้นฐาน',
  '04-10-201 โครงสร้างข้อมูล',
  '04-10-202 การเขียนโปรแกรมเชิงวัตถุ',
]

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

const initialSubjectList = [
  {
    id: 1,
    courseCode: '04-10-201',
    curriculumLevel: 'bachelor',
    courseNameThai: 'โครงสร้างข้อมูล',
    courseNameEnglish: 'Data Structures',
    subjectCategory: 'specific',
    subCategory: 'กลุ่มวิชาเฉพาะด้าน',
    studyLine: 'สายวิทยาศาสตร์',
    totalCredits: 3,
    lectureHours: 3,
    labHours: 0,
    selfStudyHours: 6,
    descriptionThai: 'ศึกษาโครงสร้างข้อมูลพื้นฐานและการประยุกต์ใช้งาน',
    descriptionEnglish: 'Study basic data structures and applications.',
    hasPreSubjects: 'no',
    preSubjects: [],
    hasCoSubjects: 'no',
    coSubjects: [],
  },
  {
    id: 2,
    courseCode: '04-10-202',
    curriculumLevel: 'bachelor',
    courseNameThai: 'การเขียนโปรแกรมเชิงวัตถุ',
    courseNameEnglish: 'Object-Oriented Programming',
    subjectCategory: 'specific',
    subCategory: 'กลุ่มวิชาแกน',
    studyLine: 'สายวิทยาศาสตร์',
    totalCredits: 3,
    lectureHours: 2,
    labHours: 2,
    selfStudyHours: 5,
    descriptionThai: 'ศึกษาแนวคิดการพัฒนาโปรแกรมเชิงวัตถุ',
    descriptionEnglish: 'Study object-oriented programming concepts.',
    hasPreSubjects: 'yes',
    preSubjects: ['04-10-101 การคิดอย่างเป็นระบบ'],
    hasCoSubjects: 'no',
    coSubjects: [],
  },
]

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

  const handleSubmitSubject = () => {
    const normalizedCourseCode = formValue.courseCode.trim().toLowerCase()

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

    const payload = {
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
    }

    if (editingSubjectId) {
      setSubjectList((prev) =>
        prev.map((subject) => (
          subject.id === editingSubjectId
            ? { ...subject, ...payload }
            : subject
        ))
      )
    } else {
      setSubjectList((prev) => [
        {
          id: Date.now(),
          ...payload,
        },
        ...prev,
      ])
    }

    resetForm()
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  const handleDeleteSubject = (subjectId, subjectName) => {
    const isConfirmed = window.confirm(`ต้องการลบรายวิชา "${subjectName}" ใช่หรือไม่`)

    if (!isConfirmed) return

    setSubjectList((prev) => prev.filter((subject) => subject.id !== subjectId))

    if (editingSubjectId === subjectId) {
      resetForm()
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
                  options={mockReferenceSubjectOptions}
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
                  options={mockReferenceSubjectOptions}
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
              >
                {editingSubjectId ? 'บันทึกการแก้ไข' : 'บันทึกรายวิชา'}
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