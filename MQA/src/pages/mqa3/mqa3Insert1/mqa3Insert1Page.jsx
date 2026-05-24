import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import Mqa3FormNav from '../../../components/mqa3/mqa3FormNav'
import styles from './mqa3Insert1Page.module.css'

const COURSE_ENDPOINT = '/course/'
const SUBJECT_SUBGROUP_ENDPOINT = '/subject-category/subgroup'
const FIXED_LEARNING_PLACE = 'คณะบริหารธุรกิจและเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีราชมงคลตะวันออก'
const MQA3_ACTIVE_DRAFT_KEY = 'mqa3ActiveDraftKey'

const initialFormValue = {
  courseCode: '',
  courseNameThai: '',
  courseNameEnglish: '',
  creditText: '',
  creditTotal: '',
  creditLecture: '',
  creditLab: '',
  creditSelfStudy: '',
  curriculumMajor: '',
  courseType: '',
  semester: '',
  yearLevel: '',
  sectionNumber: '',
  studentCount: '',
  learningPlace: FIXED_LEARNING_PLACE,
}

const subjectCategoryLabelMap = {
  1: 'วิชาศึกษาทั่วไป',
  2: 'วิชาเฉพาะ',
  3: 'วิชาเลือกเสรี',
  generalEducation: 'วิชาศึกษาทั่วไป',
  specific: 'วิชาเฉพาะ',
  freeElective: 'วิชาเลือกเสรี',
}

const fallbackSubGroupOptions = [
  { id: '1', name: 'กลุ่มวิชาบูรณาการ', categoryId: '1' },
  { id: '2', name: 'กลุ่มวิชาภาษา', categoryId: '1' },
  { id: '3', name: 'กลุ่มวิชาชีพบังคับ', categoryId: '2' },
  { id: '4', name: 'กลุ่มวิชาชีพเลือก', categoryId: '2' },
]

const getAuthConfig = () => {
  const token = localStorage.getItem('mqa_token')
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} }
}

const normalizeText = (value) => String(value ?? '').trim()

const hasObjectData = (value) => Boolean(value && typeof value === 'object' && Object.keys(value).length > 0)

const getResponseList = (data, keyList = []) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.results)) return data.results
  for (const key of keyList) if (Array.isArray(data?.[key])) return data[key]
  return []
}

const getResponseObject = (data) => {
  if (Array.isArray(data)) return data[0] ?? null
  if (data?.course && typeof data.course === 'object') return data.course
  if (data?.data && typeof data.data === 'object') return data.data
  if (data?.item && typeof data.item === 'object') return data.item
  if (data?.result && typeof data.result === 'object') return data.result
  return data
}

const getErrorMessage = (error, fallbackMessage) => {
  const detail = error?.response?.data?.detail
  const message = error?.response?.data?.message
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(', ')
  return detail || message || fallbackMessage
}

const safeReadJson = (key) => {
  try {
    const rawValue = sessionStorage.getItem(key)
    return rawValue ? JSON.parse(rawValue) : null
  } catch (error) {
    return null
  }
}

const safeWriteJson = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('Cannot write MQA3 draft to sessionStorage:', error)
  }
}

const getActiveDraftKey = () => {
  try {
    return sessionStorage.getItem(MQA3_ACTIVE_DRAFT_KEY) || ''
  } catch (error) {
    return ''
  }
}

const setActiveDraftKey = (draftKey) => {
  try {
    sessionStorage.setItem(MQA3_ACTIVE_DRAFT_KEY, draftKey)
  } catch (error) {
    console.warn('Cannot set active MQA3 draft key:', error)
  }
}

const getMqa3DraftKey = (state = {}) => {
  const courseItem = state?.courseItem ?? {}
  const keySource = state?.mqa3DraftKey || state?.openingCourseItemId || state?.requestedCourseItemId || state?.courseId || state?.courseCode || courseItem?.openingCourseItemId || courseItem?.requestedCourseItemId || courseItem?.courseId || courseItem?.courseCode || ''
  if (keySource) return String(keySource).startsWith('mqa3Draft:') ? String(keySource) : `mqa3Draft:${keySource}`
  return getActiveDraftKey() || 'mqa3Draft:new'
}

const readMqa3Draft = (draftKey) => safeReadJson(draftKey)

const writeMqa3Draft = (draftKey, nextDraft) => {
  const currentDraft = readMqa3Draft(draftKey) || {}
  const mergedDraft = { ...currentDraft, ...nextDraft, updatedAt: new Date().toISOString() }
  safeWriteJson(draftKey, mergedDraft)
  setActiveDraftKey(draftKey)
}

const getCourseId = (course) => course?.id ?? course?.course_id ?? course?.courseId ?? ''
const getCourseCode = (course) => normalizeText(course?.course_code ?? course?.courseCode ?? course?.course_code_snapshot ?? '')
const normalizeCourseCode = (value) => normalizeText(value).toLowerCase().replace(/[\s-]/g, '')

const mapSubGroupFromApi = (subGroup) => ({
  id: String(subGroup?.id ?? subGroup?.sub_group_id ?? subGroup?.subGroupId ?? ''),
  name: subGroup?.name ?? subGroup?.sub_group_name ?? subGroup?.subGroupName ?? '',
  categoryId: String(subGroup?.category_id ?? subGroup?.categoryId ?? ''),
})

const fetchSubGroupOptions = async (apiUrl) => {
  try {
    const response = await axios.get(`${apiUrl}${SUBJECT_SUBGROUP_ENDPOINT}`, getAuthConfig())
    const subGroupList = getResponseList(response.data, ['subgroups', 'items', 'data', 'results'])
    const mappedSubGroupOptions = subGroupList.map((subGroup) => mapSubGroupFromApi(subGroup))
    return mappedSubGroupOptions.length ? mappedSubGroupOptions : fallbackSubGroupOptions
  } catch (error) {
    console.warn('Cannot fetch subject subgroup, use fallback subgroup map:', error)
    return fallbackSubGroupOptions
  }
}

const splitTeacherText = (value) => normalizeText(value).split(',').map((item) => normalizeText(item)).filter(Boolean)

const getTeacherListFromNavigation = (navigationState) => {
  const courseItem = navigationState?.courseItem ?? {}
  const teacherSource = navigationState?.assignedTeacher ?? courseItem?.assignedTeacher ?? courseItem?.teacherName ?? courseItem?.teacher_name ?? ''
  const teacherList = Array.isArray(teacherSource) ? teacherSource.map((item) => normalizeText(item)).filter(Boolean) : splitTeacherText(teacherSource)
  return teacherList.length ? teacherList : ['']
}

const formatSemesterText = (semester, academicYear) => {
  const semesterText = normalizeText(semester)
  const academicYearText = normalizeText(academicYear)
  if (!semesterText && !academicYearText) return ''
  if (semesterText === 'summer') return `ภาคฤดูร้อน${academicYearText ? `/${academicYearText}` : ''}`
  return `ภาคการศึกษา ${semesterText || '-'}${academicYearText ? `/${academicYearText}` : ''}`
}

const normalizeCreditPart = (value, fallbackValue = '') => {
  if (value === null || value === undefined || value === '') return fallbackValue
  const text = String(value).trim()
  const match = text.match(/^(\d+(\.\d+)?)/)
  return match ? match[1] : text
}

const buildCreditText = (course) => {
  const total = normalizeCreditPart(course?.credit_total ?? course?.creditTotal ?? course?.totalCredits ?? course?.credits_snapshot ?? course?.credits)
  const lecture = normalizeCreditPart(course?.credit_lecture ?? course?.creditLecture ?? course?.lectureHours, '0')
  const lab = normalizeCreditPart(course?.credit_lab ?? course?.creditLab ?? course?.labHours, '0')
  const selfStudy = normalizeCreditPart(course?.credit_self_study ?? course?.creditSelfStudy ?? course?.selfStudyHours, '0')
  if (total && (lecture || lab || selfStudy)) return `${total} หน่วยกิต (${lecture || 0}-${lab || 0}-${selfStudy || 0})`
  if (total) return `${total} หน่วยกิต`
  return ''
}

const buildCourseTypeText = (course, subGroupOptions = []) => {
  const categoryId = String(course?.category_id ?? course?.categoryId ?? '')
  const subGroupId = String(course?.sub_group_id ?? course?.subGroupId ?? '')
  const directCategoryName = course?.category_name ?? course?.categoryName ?? course?.subject_category_name ?? course?.subjectCategoryName ?? course?.category?.name ?? course?.subjectCategory?.name ?? ''
  const directSubGroupName = course?.sub_group_name ?? course?.subGroupName ?? course?.sub_category_name ?? course?.subCategoryName ?? course?.sub_category ?? course?.subCategory ?? course?.sub_group?.name ?? course?.subGroup?.name ?? course?.subgroup?.name ?? ''
  const subGroupOptionList = subGroupOptions.length ? subGroupOptions : fallbackSubGroupOptions
  const subGroup = subGroupOptionList.find((item) => String(item.id) === subGroupId)
  const categoryLabel = directCategoryName || subjectCategoryLabelMap[categoryId] || ''
  const subGroupLabel = directSubGroupName || subGroup?.name || ''
  return [categoryLabel, subGroupLabel].map((item) => normalizeText(item)).filter(Boolean).join(' / ')
}

const mapCourseDetailFromApi = (course, subGroupOptions = []) => {
  const creditTotal = normalizeCreditPart(course?.credit_total ?? course?.creditTotal ?? course?.totalCredits ?? course?.credits_snapshot ?? course?.credits)
  const creditLecture = normalizeCreditPart(course?.credit_lecture ?? course?.creditLecture ?? course?.lectureHours, '0')
  const creditLab = normalizeCreditPart(course?.credit_lab ?? course?.creditLab ?? course?.labHours, '0')
  const creditSelfStudy = normalizeCreditPart(course?.credit_self_study ?? course?.creditSelfStudy ?? course?.selfStudyHours, '0')

  return {
    courseId: getCourseId(course),
    courseCode: getCourseCode(course),
    courseNameThai: course?.course_name_th ?? course?.courseNameTh ?? course?.course_name ?? course?.courseName ?? '',
    courseNameEnglish: course?.course_name_en ?? course?.courseNameEn ?? course?.course_name_english ?? course?.courseNameEnglish ?? '',
    creditTotal,
    creditLecture,
    creditLab,
    creditSelfStudy,
    creditText: buildCreditText(course),
    courseType: buildCourseTypeText(course, subGroupOptions),
    rawData: course,
  }
}

const fetchAllCoursesFromApi = async (apiUrl, config) => {
  const pageSize = 100
  let currentPage = 1
  let allCourses = []
  let shouldContinue = true

  while (shouldContinue) {
    const response = await axios.get(`${apiUrl}${COURSE_ENDPOINT}`, { ...config, params: { page: currentPage, size: pageSize } })
    const courseList = getResponseList(response.data, ['courses', 'items', 'data', 'results'])
    allCourses = [...allCourses, ...courseList]
    shouldContinue = courseList.length === pageSize
    currentPage += 1
  }

  return allCourses
}

const fetchCourseDetailForMqa3 = async (apiUrl, navigationState, subGroupOptions) => {
  const config = getAuthConfig()
  const courseItem = navigationState?.courseItem ?? {}
  const courseId = navigationState?.courseId ?? courseItem?.courseId ?? courseItem?.course_id ?? courseItem?.rawData?.course_id ?? courseItem?.rawData?.courseId ?? ''
  const courseCode = navigationState?.courseCode ?? courseItem?.courseCode ?? courseItem?.course_code ?? ''

  if (courseId) {
    try {
      const detailResponse = await axios.get(`${apiUrl}${COURSE_ENDPOINT}${courseId}`, config)
      return mapCourseDetailFromApi(getResponseObject(detailResponse.data), subGroupOptions)
    } catch (error) {
      console.warn('Cannot fetch course detail by id, fallback to course code:', error)
    }
  }

  if (!courseCode) return null

  const courseList = await fetchAllCoursesFromApi(apiUrl, config)
  const matchedCourse = courseList.find((course) => normalizeCourseCode(getCourseCode(course)) === normalizeCourseCode(courseCode))
  if (!matchedCourse) return null

  try {
    const detailResponse = await axios.get(`${apiUrl}${COURSE_ENDPOINT}${getCourseId(matchedCourse)}`, config)
    return mapCourseDetailFromApi(getResponseObject(detailResponse.data), subGroupOptions)
  } catch (error) {
    return mapCourseDetailFromApi(matchedCourse, subGroupOptions)
  }
}

const buildInitialFormValue = (navigationState, courseDetail, savedDraft) => {
  const courseItem = navigationState?.courseItem ?? {}
  const curriculumName = navigationState?.curriculumName ?? courseItem?.curriculumName ?? ''
  const majorName = navigationState?.majorName ?? courseItem?.majorName ?? ''
  const semester = navigationState?.semester ?? courseItem?.semester ?? ''
  const academicYear = navigationState?.academicYear ?? courseItem?.academicYear ?? ''
  const stateForm = navigationState?.mqa3Insert1 ?? navigationState?.mqa3GeneralForm ?? null

  if (stateForm) return { ...initialFormValue, ...stateForm, learningPlace: stateForm.learningPlace || FIXED_LEARNING_PLACE, creditText: stateForm.creditText || buildCreditText(stateForm) }
  if (savedDraft?.mqa3Insert1) return { ...initialFormValue, ...savedDraft.mqa3Insert1, learningPlace: savedDraft.mqa3Insert1.learningPlace || FIXED_LEARNING_PLACE, creditText: savedDraft.mqa3Insert1.creditText || buildCreditText(savedDraft.mqa3Insert1) }

  const fallbackCreditText = buildCreditText({
    credit_total: navigationState?.creditTotal ?? courseItem?.creditTotal ?? courseItem?.credits ?? courseItem?.creditsSnapshot ?? courseItem?.credits_snapshot,
    credit_lecture: navigationState?.creditLecture ?? courseItem?.creditLecture,
    credit_lab: navigationState?.creditLab ?? courseItem?.creditLab,
    credit_self_study: navigationState?.creditSelfStudy ?? courseItem?.creditSelfStudy,
  })

  return {
    courseCode: courseDetail?.courseCode || navigationState?.courseCode || courseItem?.courseCode || '',
    courseNameThai: courseDetail?.courseNameThai || navigationState?.courseName || courseItem?.courseName || '',
    courseNameEnglish: courseDetail?.courseNameEnglish || '',
    creditText: courseDetail?.creditText || fallbackCreditText,
    creditTotal: courseDetail?.creditTotal || normalizeCreditPart(navigationState?.creditTotal ?? courseItem?.creditTotal ?? courseItem?.credits ?? courseItem?.creditsSnapshot ?? courseItem?.credits_snapshot),
    creditLecture: courseDetail?.creditLecture || normalizeCreditPart(navigationState?.creditLecture ?? courseItem?.creditLecture, '0'),
    creditLab: courseDetail?.creditLab || normalizeCreditPart(navigationState?.creditLab ?? courseItem?.creditLab, '0'),
    creditSelfStudy: courseDetail?.creditSelfStudy || normalizeCreditPart(navigationState?.creditSelfStudy ?? courseItem?.creditSelfStudy, '0'),
    curriculumMajor: [curriculumName, majorName ? `สาขา${majorName}` : ''].filter(Boolean).join(' / '),
    courseType: courseDetail?.courseType || (courseItem?.isFreeElective ? 'วิชาเลือกเสรี' : ''),
    semester: formatSemesterText(semester, academicYear),
    yearLevel: navigationState?.yearLevel ?? courseItem?.yearLevel ?? '',
    sectionNumber: navigationState?.sectionNumber ?? courseItem?.sectionNumber ?? '',
    studentCount: navigationState?.studentCount ?? courseItem?.studentCount ?? '',
    learningPlace: FIXED_LEARNING_PLACE,
  }
}

function mqa3Insert1Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const apiUrl = import.meta.env.VITE_API_URL
  const locationState = useMemo(() => location.state || {}, [location.state])
  const draftKey = useMemo(() => getMqa3DraftKey(locationState), [locationState])
  const savedDraft = useMemo(() => readMqa3Draft(draftKey), [draftKey])
  const navigationState = useMemo(() => hasObjectData(locationState) ? locationState : savedDraft?.navigationState || {}, [locationState, savedDraft])
  const initializedRef = useRef(false)

  const [formValue, setFormValue] = useState(initialFormValue)
  const [teachers, setTeachers] = useState([''])
  const [courseDetail, setCourseDetail] = useState(null)
  const [isCourseLoading, setIsCourseLoading] = useState(false)
  const [courseErrorMessage, setCourseErrorMessage] = useState('')

  const fetchInitialData = useCallback(async () => {
    if (initializedRef.current) return

    setActiveDraftKey(draftKey)
    setIsCourseLoading(true)
    setCourseErrorMessage('')

    try {
      const subGroupOptions = await fetchSubGroupOptions(apiUrl)
      const nextCourseDetail = await fetchCourseDetailForMqa3(apiUrl, navigationState, subGroupOptions)
      const latestDraft = readMqa3Draft(draftKey)
      const nextTeachers = navigationState?.mqa3Insert1?.teachers || navigationState?.mqa3GeneralForm?.teachers || latestDraft?.mqa3Insert1?.teachers || getTeacherListFromNavigation(navigationState)

      setCourseDetail(nextCourseDetail)
      setFormValue(buildInitialFormValue(navigationState, nextCourseDetail, latestDraft))
      setTeachers(nextTeachers.length ? nextTeachers : [''])
      initializedRef.current = true
    } catch (error) {
      console.error('Error fetching MQA3 initial course data:', error)
      const latestDraft = readMqa3Draft(draftKey)
      const nextTeachers = navigationState?.mqa3Insert1?.teachers || navigationState?.mqa3GeneralForm?.teachers || latestDraft?.mqa3Insert1?.teachers || getTeacherListFromNavigation(navigationState)

      setFormValue(buildInitialFormValue(navigationState, null, latestDraft))
      setTeachers(nextTeachers.length ? nextTeachers : [''])
      setCourseErrorMessage(getErrorMessage(error, 'ไม่สามารถดึงข้อมูลรายวิชาจากระบบได้ แต่ยังสามารถกรอกข้อมูลเองได้'))
      initializedRef.current = true
    } finally {
      setIsCourseLoading(false)
    }
  }, [apiUrl, draftKey, navigationState])

  useEffect(() => { fetchInitialData() }, [fetchInitialData])

  useEffect(() => {
    if (!initializedRef.current) return
    const cleanTeachers = teachers.map((teacher) => normalizeText(teacher)).filter(Boolean)
    const nextNavigationState = { ...navigationState, mqa3DraftKey: draftKey, mqa3Insert1: { ...formValue, teachers: cleanTeachers, courseDetail: courseDetail?.rawData || null } }
    writeMqa3Draft(draftKey, { draftKey, navigationState: nextNavigationState, mqa3Insert1: nextNavigationState.mqa3Insert1 })
  }, [draftKey, navigationState, formValue, teachers, courseDetail])

  const isPageComplete = useMemo(() => {
    return Boolean(
      normalizeText(formValue.courseCode) &&
      normalizeText(formValue.courseNameThai) &&
      normalizeText(formValue.courseNameEnglish) &&
      normalizeText(formValue.creditText) &&
      normalizeText(formValue.curriculumMajor) &&
      normalizeText(formValue.courseType) &&
      teachers.some((teacher) => normalizeText(teacher)) &&
      normalizeText(formValue.semester) &&
      normalizeText(formValue.yearLevel) &&
      normalizeText(formValue.sectionNumber) &&
      normalizeText(formValue.studentCount) &&
      normalizeText(formValue.learningPlace)
    )
  }, [formValue.courseCode, formValue.courseNameThai, formValue.courseNameEnglish, formValue.creditText, formValue.curriculumMajor, formValue.courseType, formValue.semester, formValue.yearLevel, formValue.sectionNumber, formValue.studentCount, formValue.learningPlace, teachers])

  const handleChangeField = (fieldName, value) => {
    setFormValue((prev) => ({ ...prev, [fieldName]: value }))
  }

  const addTeacher = () => {
    setTeachers((prev) => [...prev, ''])
  }

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

  const handleGoNext = () => {
    if (!isPageComplete) return

    const cleanTeachers = teachers.map((teacher) => normalizeText(teacher)).filter(Boolean)
    const nextState = {
      ...navigationState,
      mqa3DraftKey: draftKey,
      mqa3Insert1: { ...formValue, teachers: cleanTeachers, courseDetail: courseDetail?.rawData || null },
      courseItem: {
        ...(navigationState?.courseItem || {}),
        courseCode: formValue.courseCode,
        courseName: formValue.courseNameThai,
        curriculumName: navigationState?.curriculumName ?? navigationState?.courseItem?.curriculumName ?? '',
        majorName: navigationState?.majorName ?? navigationState?.courseItem?.majorName ?? '',
        yearLevel: formValue.yearLevel,
        sectionNumber: formValue.sectionNumber,
        studentCount: formValue.studentCount,
        assignedTeacher: cleanTeachers.join(', '),
      },
    }

    writeMqa3Draft(draftKey, { draftKey, navigationState: nextState, mqa3Insert1: nextState.mqa3Insert1 })
    navigate('/mqa3Insert-2', { state: nextState })
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Mqa3FormNav />

        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>
                ข้อมูลทั่วไป
              </Typography>
              <Typography className={styles.pageDescription}>
                กรอกข้อมูลพื้นฐานของรายวิชาเพื่อใช้เป็นข้อมูลตั้งต้นของแบบฟอร์ม มคอ.3
              </Typography>
              {isCourseLoading && <Typography className={styles.sectionHint}>กำลังดึงข้อมูลรายวิชาจากระบบ...</Typography>}
              {courseErrorMessage && <Typography className={styles.sectionHint}>{courseErrorMessage}</Typography>}
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
                <TextField label="รหัสวิชา" placeholder="เช่น 04-10-211" value={formValue.courseCode} onChange={(event) => handleChangeField('courseCode', event.target.value)} fullWidth />
                <TextField label="ชื่อรายวิชา (ภาษาไทย)" placeholder="เช่น การวิเคราะห์ระบบ" value={formValue.courseNameThai} onChange={(event) => handleChangeField('courseNameThai', event.target.value)} fullWidth />
                <TextField label="ชื่อรายวิชา (ภาษาอังกฤษ)" placeholder="เช่น Systems Analysis" value={formValue.courseNameEnglish} onChange={(event) => handleChangeField('courseNameEnglish', event.target.value)} fullWidth />
              </Box>
            </Box>

            <Box className={styles.sectionCard}>
              <Box className={styles.sectionHeader}>
                <Typography className={styles.sectionTitle}>
                  2 จำนวนหน่วยกิต
                </Typography>
                <Typography className={styles.sectionHint}>
                  แสดงรูปแบบหน่วยกิตรวม บรรยาย ปฏิบัติการ และศึกษาด้วยตนเอง
                </Typography>
              </Box>

              <Box className={styles.singleFieldRow}>
                <TextField label="จำนวนหน่วยกิต" placeholder="เช่น 3 หน่วยกิต (3-0-6)" value={formValue.creditText} onChange={(event) => handleChangeField('creditText', event.target.value)} fullWidth />
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
                <TextField label="หลักสูตร / สาขาวิชา" placeholder="เช่น หลักสูตรวิทยาศาสตรบัณฑิต / สาขาวิทยาการคอมพิวเตอร์" value={formValue.curriculumMajor} onChange={(event) => handleChangeField('curriculumMajor', event.target.value)} fullWidth />
                <TextField label="ประเภทรายวิชา" placeholder="เช่น วิชาศึกษาทั่วไป / กลุ่มวิชาบูรณาการ" value={formValue.courseType} onChange={(event) => handleChangeField('courseType', event.target.value)} fullWidth />
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
                <TextField label="ภาคการศึกษา" placeholder="เช่น ภาคการศึกษา 1/2568" value={formValue.semester} onChange={(event) => handleChangeField('semester', event.target.value)} fullWidth />
                <TextField label="ชั้นปี" placeholder="เช่น 1" value={formValue.yearLevel} onChange={(event) => handleChangeField('yearLevel', event.target.value)} fullWidth />
                <TextField label="กลุ่มเรียน" placeholder="เช่น กลุ่ม 1" value={formValue.sectionNumber} onChange={(event) => handleChangeField('sectionNumber', event.target.value)} fullWidth />
                <TextField label="จำนวนนักศึกษา" type="number" placeholder="เช่น 40" value={formValue.studentCount} onChange={(event) => handleChangeField('studentCount', event.target.value)} fullWidth />
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
                <TextField label="สถานที่เรียน" value={formValue.learningPlace} onChange={(event) => handleChangeField('learningPlace', event.target.value)} fullWidth />
              </Box>
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button variant="outlined" startIcon={<NavigateBeforeIcon />} disabled className={styles.backButton}>
              ย้อนกลับ
            </Button>
            <Button variant="contained" endIcon={<NavigateNextIcon />} className={styles.nextButton} onClick={handleGoNext} disabled={!isPageComplete}>
              ถัดไป
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
export default mqa3Insert1Page