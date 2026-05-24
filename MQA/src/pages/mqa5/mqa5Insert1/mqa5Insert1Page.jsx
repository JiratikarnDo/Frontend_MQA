import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import Mqa5FormNav from '../../../components/mqa5/mqa5FormNav'
import styles from './mqa5Insert1Page.module.css'

const MQA5_ACTIVE_DRAFT_KEY = 'mqa5ActiveDraftKey'
const defaultLearningPlace = 'คณะบริหารธุรกิจและเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีราชมงคลตะวันออก'
const emptyForm = { courseCode: '', courseNameThai: '', courseNameEnglish: '', creditText: '', curriculumMajor: '', courseType: '', semester: '', yearLevel: '', sectionNumber: '', studentCount: '', learningPlace: defaultLearningPlace }

const normalizeText = (value) => String(value ?? '').trim()
const hasText = (value) => normalizeText(value) !== ''
const getApiUrl = (apiUrl, path) => `${String(apiUrl || '').replace(/\/$/, '')}${path}`
const getAuthConfig = () => { const token = localStorage.getItem('mqa_token'); return { headers: token ? { Authorization: `Bearer ${token}` } : {} } }
const getResponseObject = (data) => { if (Array.isArray(data)) return data[0] || null; if (data?.data && typeof data.data === 'object') return data.data; if (data?.item && typeof data.item === 'object') return data.item; if (data?.result && typeof data.result === 'object') return data.result; return data }
const safeReadJson = (key) => { try { const rawValue = sessionStorage.getItem(key); return rawValue ? JSON.parse(rawValue) : null } catch (error) { return null } }
const safeWriteJson = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)) } catch (error) { console.warn('Cannot write MQA5 draft:', error) } }
const setActiveDraftKey = (draftKey) => { try { sessionStorage.setItem(MQA5_ACTIVE_DRAFT_KEY, draftKey) } catch (error) { console.warn('Cannot set active MQA5 draft key:', error) } }
const getActiveDraftKey = () => { try { return sessionStorage.getItem(MQA5_ACTIVE_DRAFT_KEY) || '' } catch (error) { return '' } }
const getErrorMessage = (error, fallbackMessage) => { const detail = error?.response?.data?.detail; const message = error?.response?.data?.message; if (Array.isArray(detail)) return detail.map((item) => item.msg || item.message || JSON.stringify(item)).join(', '); return detail || message || fallbackMessage }

const getMqa5DraftKey = (state = {}) => {
  const courseItem = state?.courseItem || {}
  const keySource = state?.mqa5DraftKey || state?.tqf5Id || state?.mqa5Id || state?.selectedDocumentId || state?.openingCourseItemId || state?.requestedCourseItemId || state?.courseId || state?.courseCode || courseItem?.tqf5Id || courseItem?.mqa5Id || courseItem?.openingCourseItemId || courseItem?.requestedCourseItemId || courseItem?.courseId || courseItem?.courseCode || ''
  if (keySource) return String(keySource).startsWith('mqa5Draft:') ? String(keySource) : `mqa5Draft:${keySource}`
  return getActiveDraftKey() || 'mqa5Draft:new'
}

const writeMqa5Draft = (draftKey, nextDraft) => {
  const currentDraft = safeReadJson(draftKey) || {}
  const mergedDraft = { ...currentDraft, ...nextDraft, updatedAt: new Date().toISOString() }
  safeWriteJson(draftKey, mergedDraft)
  setActiveDraftKey(draftKey)
  return mergedDraft
}

const getTqf3ReferenceId = (state = {}, savedDraft = {}) => normalizeText(
  state?.referenceTqf3Id || state?.sourceTqf3Id || state?.tqf3Id || state?.mqa3Id ||
  state?.courseItem?.referenceTqf3Id || state?.courseItem?.sourceTqf3Id || state?.courseItem?.tqf3Id || state?.courseItem?.mqa3Id ||
  savedDraft?.referenceTqf3Id || savedDraft?.sourceTqf3Id || savedDraft?.tqf3Id || savedDraft?.mqa3Id || ''
)

const getTqf5DocumentId = (state = {}, savedDraft = {}) => normalizeText(
  state?.tqf5Id || state?.mqa5Id || state?.selectedDocumentId ||
  state?.courseItem?.tqf5Id || state?.courseItem?.mqa5Id ||
  savedDraft?.tqf5Id || savedDraft?.mqa5Id || ''
)

const buildSemesterText = (semester, academicYear) => {
  const semesterText = normalizeText(semester)
  const academicYearText = normalizeText(academicYear)
  if (semesterText && academicYearText && !semesterText.includes('/')) return `${semesterText}/${academicYearText}`
  return semesterText || academicYearText
}

const buildCurriculumMajorText = (curriculumName, majorName) => {
  const curriculumText = normalizeText(curriculumName)
  const majorText = normalizeText(majorName)
  if (curriculumText && majorText) return `${curriculumText} / สาขา${majorText}`
  return curriculumText || majorText
}

const buildInitialFormFromState = (state = {}) => {
  const courseItem = state?.courseItem || {}
  return {
    courseCode: normalizeText(state.courseCode || courseItem.courseCode),
    courseNameThai: normalizeText(state.courseName || courseItem.courseName),
    courseNameEnglish: normalizeText(state.courseNameEnglish || courseItem.courseNameEnglish),
    creditText: normalizeText(state.creditText || state.credits || courseItem.creditText || courseItem.credits),
    curriculumMajor: buildCurriculumMajorText(state.curriculumName || courseItem.curriculumName, state.majorName || courseItem.majorName),
    courseType: normalizeText(state.courseType || courseItem.courseType || courseItem.courseCategory),
    semester: buildSemesterText(state.semester || courseItem.semester, state.academicYear || courseItem.academicYear),
    yearLevel: normalizeText(state.yearLevel || courseItem.yearLevel),
    sectionNumber: normalizeText(state.sectionNumber || courseItem.sectionNumber),
    studentCount: normalizeText(state.studentCount || courseItem.studentCount),
    learningPlace: normalizeText(state.learningPlace || state.location || courseItem.learningPlace || courseItem.location) || defaultLearningPlace,
  }
}

const getTeacherName = (teacher) => normalizeText(teacher?.name || teacher?.full_name || teacher?.fullName || teacher?.teacher_name || teacher?.teacherName || teacher)
const getTeachersFromState = (state = {}) => {
  const courseItem = state?.courseItem || {}
  const rawTeachers = state.assignedTeachers || state.teachers || courseItem.assignedTeachers || courseItem.teachers || state.assignedTeacher || courseItem.assignedTeacher || ''
  const teacherList = Array.isArray(rawTeachers) ? rawTeachers.map(getTeacherName).filter(Boolean) : normalizeText(rawTeachers).split(',').map((item) => normalizeText(item)).filter(Boolean)
  return teacherList.length ? teacherList : ['']
}

const getTeachersFromTqf3 = (tqf3Data) => {
  const rawTeachers = Array.isArray(tqf3Data?.instructors) ? tqf3Data.instructors : []
  const teacherList = rawTeachers.map(getTeacherName).filter(Boolean)
  return teacherList.length ? teacherList : null
}

const buildFormFromTqf3 = (tqf3Data = {}, fallbackForm = emptyForm) => ({
  courseCode: normalizeText(tqf3Data.course_code_snap || tqf3Data.courseCodeSnap || tqf3Data.course_code || tqf3Data.courseCode) || fallbackForm.courseCode,
  courseNameThai: normalizeText(tqf3Data.course_name_th_snap || tqf3Data.courseNameThSnap || tqf3Data.course_name_th || tqf3Data.courseNameThai || tqf3Data.course_name) || fallbackForm.courseNameThai,
  courseNameEnglish: normalizeText(tqf3Data.course_name_en_snap || tqf3Data.courseNameEnSnap || tqf3Data.course_name_en || tqf3Data.courseNameEnglish) || fallbackForm.courseNameEnglish,
  creditText: normalizeText(tqf3Data.credits_snap || tqf3Data.creditsSnap || tqf3Data.credit || tqf3Data.credits) || fallbackForm.creditText,
  curriculumMajor: normalizeText(tqf3Data.curriculum_name || tqf3Data.curriculumName) || fallbackForm.curriculumMajor,
  courseType: normalizeText(tqf3Data.course_category || tqf3Data.courseCategory) || fallbackForm.courseType,
  semester: buildSemesterText(tqf3Data.semester, tqf3Data.academic_year || tqf3Data.academicYear) || fallbackForm.semester,
  yearLevel: normalizeText(tqf3Data.year_level || tqf3Data.yearLevel) || fallbackForm.yearLevel,
  sectionNumber: normalizeText(tqf3Data.section_group || tqf3Data.sectionGroup || tqf3Data.section_number || tqf3Data.sectionNumber) || fallbackForm.sectionNumber,
  studentCount: normalizeText(tqf3Data.student_count || tqf3Data.studentCount) || fallbackForm.studentCount,
  learningPlace: normalizeText(tqf3Data.location || tqf3Data.learningPlace) || fallbackForm.learningPlace || defaultLearningPlace,
})

const mergeMissingFormValues = (currentForm, nextForm) => {
  const mergedForm = { ...currentForm }
  Object.keys(nextForm).forEach((key) => { if (!hasText(mergedForm[key])) mergedForm[key] = nextForm[key] })
  return mergedForm
}

function Mqa5Insert1Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const apiUrl = import.meta.env.VITE_API_URL
  const locationState = useMemo(() => location.state || {}, [location.state])
  const draftKey = useMemo(() => getMqa5DraftKey(locationState), [locationState])
  const savedDraft = useMemo(() => safeReadJson(draftKey), [draftKey])
  const navigationState = useMemo(() => Object.keys(locationState).length ? locationState : savedDraft?.navigationState || {}, [locationState, savedDraft])
  const tqf3ReferenceId = useMemo(() => getTqf3ReferenceId(navigationState, savedDraft), [navigationState, savedDraft])
  const tqf5DocumentId = useMemo(() => getTqf5DocumentId(navigationState, savedDraft), [navigationState, savedDraft])
  const savedPageData = savedDraft?.mqa5Insert1 || navigationState?.mqa5Insert1 || null
  const initialForm = savedPageData?.form || buildInitialFormFromState(navigationState)
  const initialTeachers = savedPageData?.teachers?.length ? savedPageData.teachers : getTeachersFromState(navigationState)

  const [form, setForm] = useState(initialForm)
  const [teachers, setTeachers] = useState(initialTeachers)
  const [isLoadingTqf3, setIsLoadingTqf3] = useState(false)
  const [tqf3ErrorMessage, setTqf3ErrorMessage] = useState('')

  const isPageComplete = useMemo(() => {
    return hasText(form.courseCode) && hasText(form.courseNameThai) && hasText(form.courseNameEnglish) && hasText(form.creditText) && hasText(form.curriculumMajor) && hasText(form.courseType) && hasText(form.semester) && hasText(form.yearLevel) && hasText(form.sectionNumber) && hasText(form.studentCount) && hasText(form.learningPlace) && teachers.length > 0 && teachers.every((teacher) => hasText(teacher))
  }, [form, teachers])

  useEffect(() => {
    if (!tqf3ReferenceId) {
      setTqf3ErrorMessage('ไม่พบรหัสอ้างอิง มคอ.3 กรุณากลับไปเลือกเอกสารจากหน้ารายวิชาที่ได้รับมอบหมายใหม่อีกครั้ง')
      return
    }

    let isMounted = true
    const fetchTqf3Reference = async () => {
      setIsLoadingTqf3(true)
      setTqf3ErrorMessage('')

      try {
        const response = await axios.get(getApiUrl(apiUrl, `/tqf3/${tqf3ReferenceId}`), getAuthConfig())
        const tqf3Data = getResponseObject(response.data) || {}
        const nextForm = buildFormFromTqf3(tqf3Data, buildInitialFormFromState(navigationState))
        const nextTeachers = getTeachersFromTqf3(tqf3Data)

        if (!isMounted) return

        if (savedPageData?.form) {
          setForm((prev) => mergeMissingFormValues(prev, nextForm))
        } else {
          setForm(nextForm)
        }

        if (nextTeachers && !savedPageData?.teachers?.length) {
          setTeachers(nextTeachers)
        }
      } catch (error) {
        if (!isMounted) return
        console.error('Error fetching TQF3 reference for MQA5:', error)
        setTqf3ErrorMessage(getErrorMessage(error, 'ไม่สามารถดึงข้อมูลจาก มคอ.3 ได้ กรุณาลองใหม่อีกครั้ง'))
      } finally {
        if (isMounted) setIsLoadingTqf3(false)
      }
    }

    fetchTqf3Reference()
    return () => { isMounted = false }
  }, [apiUrl, navigationState, savedPageData?.form, savedPageData?.teachers?.length, tqf3ReferenceId])

  useEffect(() => {
    const nextState = { ...navigationState, mqa5DraftKey: draftKey, referenceTqf3Id: tqf3ReferenceId, sourceTqf3Id: tqf3ReferenceId, tqf3Id: tqf3ReferenceId, mqa3Id: tqf3ReferenceId, tqf5Id: tqf5DocumentId, mqa5Id: tqf5DocumentId, mqa5Insert1: { form, teachers } }
    writeMqa5Draft(draftKey, { draftKey, navigationState: nextState, referenceTqf3Id: tqf3ReferenceId, sourceTqf3Id: tqf3ReferenceId, tqf3Id: tqf3ReferenceId, mqa3Id: tqf3ReferenceId, tqf5Id: tqf5DocumentId, mqa5Id: tqf5DocumentId, mqa5Insert1: { form, teachers } })
  }, [draftKey, form, navigationState, teachers, tqf3ReferenceId, tqf5DocumentId])

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const addTeacher = () => setTeachers((prev) => [...prev, ''])

  const removeTeacher = (index) => {
    setTeachers((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const updateTeacher = (index, value) => {
    setTeachers((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleNext = () => {
    if (!isPageComplete || isLoadingTqf3 || tqf3ErrorMessage) return
    const nextState = { ...navigationState, mqa5DraftKey: draftKey, referenceTqf3Id: tqf3ReferenceId, sourceTqf3Id: tqf3ReferenceId, tqf3Id: tqf3ReferenceId, mqa3Id: tqf3ReferenceId, tqf5Id: tqf5DocumentId, mqa5Id: tqf5DocumentId, mqa5Insert1: { form, teachers } }
    writeMqa5Draft(draftKey, { draftKey, navigationState: nextState, referenceTqf3Id: tqf3ReferenceId, sourceTqf3Id: tqf3ReferenceId, tqf3Id: tqf3ReferenceId, mqa3Id: tqf3ReferenceId, tqf5Id: tqf5DocumentId, mqa5Id: tqf5DocumentId, mqa5Insert1: { form, teachers } })
    navigate('/mqa5Insert-2', { state: nextState })
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Mqa5FormNav currentStep={1} />

        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>
                ข้อมูลทั่วไป
              </Typography>
              <Typography className={styles.pageDescription}>
                ดึงข้อมูลตั้งต้นจาก มคอ.3 ที่บันทึกไว้แล้ว เพื่อใช้เป็นข้อมูลทั่วไปของแบบฟอร์ม มคอ.5
              </Typography>
            </Box>

            <Box className={styles.pageStatus}>
              <Typography className={styles.pageStatusLabel}>
                สถานะหน้านี้
              </Typography>
              <Typography className={styles.pageStatusValue}>
                {isPageComplete ? 'ครบแล้ว' : 'ยังไม่ครบ'}
              </Typography>
            </Box>
          </Box>

          {isLoadingTqf3 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <CircularProgress size={22} />
              <Typography color="text.secondary">กำลังดึงข้อมูลจาก มคอ.3...</Typography>
            </Box>
          )}

          {tqf3ErrorMessage && (
            <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.18)' }}>
              <Typography color="error" fontWeight={700}>{tqf3ErrorMessage}</Typography>
            </Box>
          )}

          <Box className={styles.sectionGrid}>
            <Box className={styles.sectionCard}>
              <Box className={styles.sectionHeader}>
                <Typography className={styles.sectionTitle}>
                  1.รหัสและชื่อรายวิชา
                </Typography>
                <Typography className={styles.sectionHint}>
                  ข้อมูลชื่อรายวิชาในภาษาไทยและภาษาอังกฤษ
                </Typography>
              </Box>

              <Box className={styles.courseCodeGrid}>
                <TextField label="รหัสวิชา" value={form.courseCode} onChange={(event) => updateForm('courseCode', event.target.value)} placeholder="เช่น BIS12345" fullWidth />
                <TextField label="ชื่อรายวิชา (ภาษาไทย)" value={form.courseNameThai} onChange={(event) => updateForm('courseNameThai', event.target.value)} placeholder="เช่น การวิเคราะห์ระบบ" fullWidth />
                <TextField label="ชื่อรายวิชา (ภาษาอังกฤษ)" value={form.courseNameEnglish} onChange={(event) => updateForm('courseNameEnglish', event.target.value)} placeholder="เช่น Systems Analysis" fullWidth />
              </Box>
            </Box>

            <Box className={styles.sectionCard}>
              <Box className={styles.sectionHeader}>
                <Typography className={styles.sectionTitle}>
                  2 จำนวนหน่วยกิต
                </Typography>
                <Typography className={styles.sectionHint}>
                  ระบุจำนวนหน่วยกิตของรายวิชา
                </Typography>
              </Box>

              <Box className={styles.singleFieldRow}>
                <TextField label="จำนวนหน่วยกิต" value={form.creditText} onChange={(event) => updateForm('creditText', event.target.value)} placeholder="เช่น 3 หน่วยกิต (3-0-6)" fullWidth />
              </Box>
            </Box>

            <Box className={styles.sectionCard}>
              <Box className={styles.sectionHeader}>
                <Typography className={styles.sectionTitle}>
                  3 หลักสูตรและประเภทรายวิชา
                </Typography>
                <Typography className={styles.sectionHint}>
                  ข้อมูลหลักสูตร สาขาวิชา และประเภทของรายวิชา
                </Typography>
              </Box>

              <Box className={styles.courseTypeGrid}>
                <TextField label="หลักสูตร / สาขาวิชา" value={form.curriculumMajor} onChange={(event) => updateForm('curriculumMajor', event.target.value)} placeholder="เช่น หลักสูตรวิทยาศาสตรบัณฑิต / สาขาวิทยาการคอมพิวเตอร์" fullWidth />
                <TextField label="ประเภทรายวิชา" value={form.courseType} onChange={(event) => updateForm('courseType', event.target.value)} placeholder="เช่น วิชาบังคับ" fullWidth />
              </Box>
            </Box>

            <Box className={styles.sectionCard}>
              <Box className={styles.sectionHeader}>
                <Typography className={styles.sectionTitle}>
                  4 อาจารย์ผู้รับผิดชอบรายวิชาและอาจารย์ผู้สอน
                </Typography>
                <Typography className={styles.sectionHint}>
                  เพิ่มรายชื่ออาจารย์ได้มากกว่า 1 คน
                </Typography>
              </Box>

              <Box className={styles.teacherList}>
                {teachers.map((teacher, index) => (
                  <Box key={index} className={styles.teacherRow}>
                    <TextField label={`ชื่ออาจารย์คนที่ ${index + 1}`} value={teacher} onChange={(event) => updateTeacher(index, event.target.value)} placeholder="กรอกชื่ออาจารย์" fullWidth />

                    <IconButton color="error" onClick={() => removeTeacher(index)} disabled={teachers.length === 1} className={styles.deleteButton}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>

              <Button startIcon={<AddCircleOutlineIcon />} variant="outlined" onClick={addTeacher} className={styles.addButton}>
                เพิ่มอาจารย์
              </Button>
            </Box>

            <Box className={styles.sectionCard}>
              <Box className={styles.sectionHeader}>
                <Typography className={styles.sectionTitle}>
                  5 ภาคการศึกษา / ชั้นปี / กลุ่มเรียน / จำนวนนักศึกษา
                </Typography>
                <Typography className={styles.sectionHint}>
                  ข้อมูลการเปิดสอนในภาคเรียนนี้
                </Typography>
              </Box>

              <Box className={styles.fieldGridFour}>
                <TextField label="ภาคการศึกษา" value={form.semester} onChange={(event) => updateForm('semester', event.target.value)} placeholder="เช่น 1/2568" fullWidth />
                <TextField label="ชั้นปี" value={form.yearLevel} onChange={(event) => updateForm('yearLevel', event.target.value)} placeholder="เช่น 3" fullWidth />
                <TextField label="กลุ่มเรียน" value={form.sectionNumber} onChange={(event) => updateForm('sectionNumber', event.target.value)} placeholder="เช่น BIS3/1" fullWidth />
                <TextField label="จำนวนนักศึกษา" value={form.studentCount} onChange={(event) => updateForm('studentCount', event.target.value)} placeholder="เช่น 40" fullWidth />
              </Box>
            </Box>

            <Box className={styles.sectionCard}>
              <Box className={styles.sectionHeader}>
                <Typography className={styles.sectionTitle}>
                  6 สถานที่เรียน
                </Typography>
                <Typography className={styles.sectionHint}>
                  ระบุสถานที่เรียนหรือห้องเรียนที่ใช้งาน
                </Typography>
              </Box>

              <Box className={styles.school}>
                <TextField label="สถานที่เรียน" value={form.learningPlace} onChange={(event) => updateForm('learningPlace', event.target.value)} fullWidth />
              </Box>
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button variant="outlined" startIcon={<NavigateBeforeIcon />} disabled className={styles.backButton}>
              ย้อนกลับ
            </Button>

            <Button variant="contained" endIcon={<NavigateNextIcon />} className={styles.nextButton} onClick={handleNext} disabled={!isPageComplete || isLoadingTqf3 || Boolean(tqf3ErrorMessage)}>
              ถัดไป
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Mqa5Insert1Page