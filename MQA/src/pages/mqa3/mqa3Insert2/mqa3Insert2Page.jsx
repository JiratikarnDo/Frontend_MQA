import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import Mqa3FormNav from '../../../components/mqa3/mqa3FormNav'
import styles from './mqa3Insert2Page.module.css'

const COURSE_ENDPOINT = '/course/'
const PLO_SUB_PLO_ENDPOINT = '/plo/sub-plos'
const MQA3_ACTIVE_DRAFT_KEY = 'mqa3ActiveDraftKey'

const initialFormValue = {
  prerequisite: '',
  corequisite: '',
  descriptionThai: '',
  developmentObjective: '',
  plo: '',
  cloList: [''],
  updateDate: '',
}

const getAuthConfig = () => {
  const token = localStorage.getItem('mqa_token')
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} }
}

const normalizeText = (value) => String(value ?? '').trim()
const normalizeCourseCode = (value) => normalizeText(value).toLowerCase().replace(/[\s-]/g, '')
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

const getNestedValue = (object, keyList = []) => {
  for (const key of keyList) {
    const value = key.split('.').reduce((current, part) => current?.[part], object)
    if (value !== undefined && value !== null && normalizeText(value) !== '') return value
  }
  return ''
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

const getTodayDateString = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const normalizeCloList = (value) => {
  if (Array.isArray(value)) {
    const normalizedList = value.map((item) => normalizeText(item))
    return normalizedList.length ? normalizedList : ['']
  }

  if (normalizeText(value)) {
    const splitList = String(value).split('\n').map((item) => normalizeText(item)).filter(Boolean)
    return splitList.length ? splitList : [normalizeText(value)]
  }

  return ['']
}

const getCourseDetailFromNavigation = (navigationState, savedDraft) => {
  const stateCourseDetail = navigationState?.mqa3Insert1?.courseDetail || navigationState?.mqa3GeneralForm?.courseDetail || null
  const draftCourseDetail = savedDraft?.mqa3Insert1?.courseDetail || null
  return stateCourseDetail || draftCourseDetail || null
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

const fetchCourseDetailForMqa3 = async (apiUrl, navigationState, savedDraft) => {
  const existingCourseDetail = getCourseDetailFromNavigation(navigationState, savedDraft)
  if (existingCourseDetail) return existingCourseDetail

  const config = getAuthConfig()
  const courseItem = navigationState?.courseItem ?? {}
  const courseId = navigationState?.courseId ?? courseItem?.courseId ?? courseItem?.course_id ?? courseItem?.rawData?.course_id ?? courseItem?.rawData?.courseId ?? ''
  const courseCode = navigationState?.courseCode ?? courseItem?.courseCode ?? courseItem?.course_code ?? navigationState?.mqa3Insert1?.courseCode ?? savedDraft?.mqa3Insert1?.courseCode ?? ''

  if (courseId) {
    try {
      const detailResponse = await axios.get(`${apiUrl}${COURSE_ENDPOINT}${courseId}`, config)
      return getResponseObject(detailResponse.data)
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
    return getResponseObject(detailResponse.data)
  } catch (error) {
    return matchedCourse
  }
}

const getCourseTextField = (course, keyList = []) => {
  for (const key of keyList) {
    const value = getNestedValue(course, [key])
    if (value !== undefined && value !== null && normalizeText(value) !== '') return normalizeText(value)
  }
  return ''
}

const getCurrentCourseIdForPlo = (navigationState, savedDraft, courseDetail) => {
  const courseItem = navigationState?.courseItem || savedDraft?.navigationState?.courseItem || {}
  const mqa3Insert1 = navigationState?.mqa3Insert1 || savedDraft?.mqa3Insert1 || {}
  return normalizeText(
    navigationState?.courseId ||
    navigationState?.course_id ||
    courseItem?.courseId ||
    courseItem?.course_id ||
    courseItem?.rawData?.course_id ||
    courseItem?.rawData?.courseId ||
    courseItem?.rawData?.id ||
    courseDetail?.id ||
    courseDetail?.course_id ||
    courseDetail?.courseId ||
    mqa3Insert1?.courseDetail?.id ||
    mqa3Insert1?.courseDetail?.course_id ||
    mqa3Insert1?.courseDetail?.courseId ||
    ''
  )
}

const getCurrentCourseCodeForPlo = (navigationState, savedDraft, courseDetail) => {
  const courseItem = navigationState?.courseItem || savedDraft?.navigationState?.courseItem || {}
  const mqa3Insert1 = navigationState?.mqa3Insert1 || savedDraft?.mqa3Insert1 || {}
  return normalizeText(
    navigationState?.courseCode ||
    navigationState?.course_code ||
    courseItem?.courseCode ||
    courseItem?.course_code ||
    courseDetail?.course_code ||
    courseDetail?.courseCode ||
    mqa3Insert1?.courseCode ||
    mqa3Insert1?.courseDetail?.course_code ||
    mqa3Insert1?.courseDetail?.courseCode ||
    ''
  )
}

const normalizePloMainFromSubPloDetail = (subPloDetail) => {
  const parentPlo = subPloDetail?.parent_plo || subPloDetail?.parentPlo || subPloDetail?.plo || subPloDetail?.PLO || {}
  const fallbackPloId = subPloDetail?.plo_id ?? subPloDetail?.ploId ?? ''
  const fallbackPloCode = fallbackPloId ? `PLO${fallbackPloId}` : ''

  return {
    id: normalizeText(parentPlo?.id ?? fallbackPloId),
    code: normalizeText(parentPlo?.plo_code ?? parentPlo?.ploCode ?? parentPlo?.code ?? fallbackPloCode),
    nameThai: normalizeText(parentPlo?.plo_name_thai ?? parentPlo?.ploNameThai ?? parentPlo?.name_thai ?? parentPlo?.nameThai ?? parentPlo?.description_thai ?? parentPlo?.descriptionThai ?? parentPlo?.name ?? ''),
  }
}

const normalizeCourseItemForPlo = (course) => {
  const nestedCourse = course?.course || course?.Course || {}

  return {
    id: normalizeText(course?.course_id ?? course?.courseId ?? course?.id ?? nestedCourse?.id ?? nestedCourse?.course_id ?? nestedCourse?.courseId ?? ''),
    code: normalizeText(course?.course_code ?? course?.courseCode ?? course?.course_code_snapshot ?? course?.courseCodeSnapshot ?? nestedCourse?.course_code ?? nestedCourse?.courseCode ?? nestedCourse?.course_code_snapshot ?? ''),
  }
}

const isMatchedPloCourse = (course, currentCourseId, currentCourseCode) => {
  const normalizedCourse = normalizeCourseItemForPlo(course)
  const matchedById = currentCourseId && normalizedCourse.id && String(normalizedCourse.id) === String(currentCourseId)
  const matchedByCode = currentCourseCode && normalizedCourse.code && normalizeCourseCode(normalizedCourse.code) === normalizeCourseCode(currentCourseCode)
  return matchedById || matchedByCode
}

const getSubPloItemsFromResponse = (responseData) => {
  if (Array.isArray(responseData)) return responseData
  if (Array.isArray(responseData?.items)) return responseData.items
  if (Array.isArray(responseData?.data)) return responseData.data
  if (Array.isArray(responseData?.sub_plos)) return responseData.sub_plos
  if (Array.isArray(responseData?.subPlos)) return responseData.subPlos
  if (Array.isArray(responseData?.results)) return responseData.results
  return []
}

const fetchSubPloListForPlo = async (apiUrl) => {
  const config = getAuthConfig()

  try {
    const response = await axios.get(`${apiUrl}${PLO_SUB_PLO_ENDPOINT}`, { ...config, params: { page: 1, limit: 500 } })
    return getSubPloItemsFromResponse(response.data)
  } catch (firstError) {
    try {
      const response = await axios.get(`${apiUrl}${PLO_SUB_PLO_ENDPOINT}`, config)
      return getSubPloItemsFromResponse(response.data)
    } catch (secondError) {
      console.warn('Cannot fetch Sub-PLO list:', firstError, secondError)
      return []
    }
  }
}

const fetchPloTextForMqa3 = async (apiUrl, navigationState, savedDraft, courseDetail) => {
  const statePlo = normalizeText(navigationState?.mqa3Insert2?.plo || savedDraft?.mqa3Insert2?.plo || '')
  if (statePlo) return statePlo

  const currentCourseId = getCurrentCourseIdForPlo(navigationState, savedDraft, courseDetail)
  const currentCourseCode = getCurrentCourseCodeForPlo(navigationState, savedDraft, courseDetail)
  if (!currentCourseId && !currentCourseCode) return ''

  try {
    const config = getAuthConfig()
    const subPloList = await fetchSubPloListForPlo(apiUrl)

    const subPloDetailList = await Promise.all(
      subPloList.map(async (subPlo) => {
        const subPloId = subPlo?.id ?? subPlo?.sub_plo_id ?? subPlo?.subPloId
        if (!subPloId) return subPlo

        try {
          const detailResponse = await axios.get(`${apiUrl}${PLO_SUB_PLO_ENDPOINT}/${subPloId}`, config)
          return getResponseObject(detailResponse.data) || subPlo
        } catch (error) {
          console.warn(`Cannot fetch Sub-PLO detail ID ${subPloId}:`, error)
          return subPlo
        }
      })
    )

    const matchedMainPloMap = new Map()

    subPloDetailList.forEach((subPloDetail) => {
      const courseList = getResponseList(subPloDetail, ['courses', 'courseList', 'subjects', 'items', 'sub_plo_courses', 'subPloCourses', 'linked_courses', 'linkedCourses'])
      const isLinkedWithCurrentCourse = courseList.some((course) => isMatchedPloCourse(course, currentCourseId, currentCourseCode))
      if (!isLinkedWithCurrentCourse) return

      const mainPlo = normalizePloMainFromSubPloDetail(subPloDetail)
      if (!mainPlo.id && !mainPlo.code) return

      const mapKey = mainPlo.id || mainPlo.code
      matchedMainPloMap.set(mapKey, mainPlo)
    })

    return Array.from(matchedMainPloMap.values())
      .sort((a, b) => {
        const aNumber = Number(String(a.code).replace(/\D/g, ''))
        const bNumber = Number(String(b.code).replace(/\D/g, ''))
        if (Number.isNaN(aNumber) || Number.isNaN(bNumber)) return String(a.code).localeCompare(String(b.code))
        return aNumber - bNumber
      })
      .map((ploItem) => `${ploItem.code} ${ploItem.nameThai || ''}`.trim())
      .filter(Boolean)
      .join('\n')
  } catch (error) {
    console.warn('Cannot fetch PLO linked with current course:', error)
    return ''
  }
}

const buildInitialFormValue = (navigationState, savedDraft, courseDetail, ploText = '') => {
  const stateForm = navigationState?.mqa3Insert2 ?? null
  if (stateForm) {
    return {
      ...initialFormValue,
      ...stateForm,
      plo: normalizeText(stateForm.plo) || ploText || '',
      cloList: normalizeCloList(stateForm.cloList ?? stateForm.clo),
    }
  }

  const draftForm = savedDraft?.mqa3Insert2 ?? null
  if (draftForm) {
    return {
      ...initialFormValue,
      ...draftForm,
      plo: normalizeText(draftForm.plo) || ploText || '',
      cloList: normalizeCloList(draftForm.cloList ?? draftForm.clo),
    }
  }

  const prerequisite = getCourseTextField(courseDetail, ['prerequisite', 'pre_requisite', 'preRequisite', 'pre_subject', 'preSubject'])
  const corequisite = getCourseTextField(courseDetail, ['corequisite', 'co_requisite', 'coRequisite', 'co_subject', 'coSubject'])
  const descriptionThai = getCourseTextField(courseDetail, ['description_thai', 'descriptionThai', 'description_th', 'descriptionTh'])

  return {
    prerequisite: prerequisite || '-',
    corequisite: corequisite || '-',
    descriptionThai: descriptionThai || '',
    developmentObjective: '',
    plo: ploText || '',
    cloList: [''],
    updateDate: getTodayDateString(),
  }
}

const getCourseDisplayText = (navigationState, savedDraft) => {
  const courseItem = navigationState?.courseItem || savedDraft?.navigationState?.courseItem || {}
  const mqa3Insert1 = navigationState?.mqa3Insert1 || savedDraft?.mqa3Insert1 || {}
  const courseCode = navigationState?.courseCode || courseItem?.courseCode || mqa3Insert1?.courseCode || ''
  const courseName = navigationState?.courseName || courseItem?.courseName || mqa3Insert1?.courseNameThai || ''
  if (!courseCode && !courseName) return 'ยังไม่พบข้อมูลรายวิชา'
  return `${courseCode} ${courseName}`.trim()
}

function mqa3Insert2Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const apiUrl = import.meta.env.VITE_API_URL
  const locationState = useMemo(() => location.state || {}, [location.state])
  const draftKey = useMemo(() => getMqa3DraftKey(locationState), [locationState])
  const savedDraft = useMemo(() => readMqa3Draft(draftKey), [draftKey])
  const navigationState = useMemo(() => hasObjectData(locationState) ? locationState : savedDraft?.navigationState || {}, [locationState, savedDraft])
  const initializedRef = useRef(false)

  const [form, setForm] = useState(initialFormValue)
  const [courseDetail, setCourseDetail] = useState(null)
  const [isCourseLoading, setIsCourseLoading] = useState(false)
  const [courseErrorMessage, setCourseErrorMessage] = useState('')
  const [popup, setPopup] = useState({ open: false, field: '', title: '', value: '' })

  const fetchInitialData = useCallback(async () => {
    if (initializedRef.current) return

    setActiveDraftKey(draftKey)
    setIsCourseLoading(true)
    setCourseErrorMessage('')

    try {
      const latestDraft = readMqa3Draft(draftKey)
      const nextCourseDetail = await fetchCourseDetailForMqa3(apiUrl, navigationState, latestDraft)
      const nextPloText = await fetchPloTextForMqa3(apiUrl, navigationState, latestDraft, nextCourseDetail)

      setCourseDetail(nextCourseDetail)
      setForm(buildInitialFormValue(navigationState, latestDraft, nextCourseDetail, nextPloText))
      initializedRef.current = true

      if (!nextCourseDetail && getCourseDisplayText(navigationState, latestDraft) === 'ยังไม่พบข้อมูลรายวิชา') {
        setCourseErrorMessage('ไม่พบข้อมูลรายวิชาที่กำลังจัดทำ กรุณากลับไปเลือกรายวิชาก่อน')
      }
    } catch (error) {
      console.error('Error fetching MQA3 page 2 course data:', error)
      const latestDraft = readMqa3Draft(draftKey)
      setForm(buildInitialFormValue(navigationState, latestDraft, null, ''))
      setCourseErrorMessage('ไม่สามารถดึงข้อมูลรายวิชาหรือ PLO จากระบบได้ แต่ยังสามารถกรอกข้อมูลเองได้')
      initializedRef.current = true
    } finally {
      setIsCourseLoading(false)
    }
  }, [apiUrl, draftKey, navigationState])

  useEffect(() => { fetchInitialData() }, [fetchInitialData])

  useEffect(() => {
    if (!initializedRef.current) return
    const nextNavigationState = { ...navigationState, mqa3DraftKey: draftKey, mqa3Insert2: form }
    writeMqa3Draft(draftKey, { draftKey, navigationState: nextNavigationState, mqa3Insert2: form })
  }, [draftKey, navigationState, form])

  const isCloListComplete = useMemo(() => {
    const cleanCloList = normalizeCloList(form.cloList).map((item) => normalizeText(item)).filter(Boolean)
    return cleanCloList.length > 0 && cleanCloList.length === form.cloList.length
  }, [form.cloList])

  const isPageComplete = useMemo(() => {
    return Boolean(
      normalizeText(form.prerequisite) &&
      normalizeText(form.corequisite) &&
      normalizeText(form.updateDate) &&
      normalizeText(form.descriptionThai) &&
      normalizeText(form.developmentObjective) &&
      normalizeText(form.plo) &&
      isCloListComplete
    )
  }, [form.prerequisite, form.corequisite, form.updateDate, form.descriptionThai, form.developmentObjective, form.plo, isCloListComplete])

  const handleChangeField = (fieldName, value) => {
    setForm((prev) => ({ ...prev, [fieldName]: value }))
  }

  const addCloItem = () => {
    setForm((prev) => ({ ...prev, cloList: [...normalizeCloList(prev.cloList), ''] }))
  }

  const removeCloItem = (index) => {
    setForm((prev) => {
      const currentList = normalizeCloList(prev.cloList)
      if (currentList.length === 1) return prev
      return { ...prev, cloList: currentList.filter((_, itemIndex) => itemIndex !== index) }
    })
  }

  const updateCloItem = (index, value) => {
    setForm((prev) => {
      const nextList = normalizeCloList(prev.cloList)
      nextList[index] = value
      return { ...prev, cloList: nextList }
    })
  }

  const openPopup = (field, title) => {
    setPopup({ open: true, field, title, value: form[field] || '' })
  }

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, open: false }))
  }

  const savePopup = () => {
    setForm((prev) => ({ ...prev, [popup.field]: popup.value }))
    closePopup()
  }

  const renderPopupField = (label, field, minRows = 5) => (
    <TextField fullWidth multiline minRows={minRows} value={form[field]} placeholder="คลิกเพื่อกรอกข้อมูล" InputProps={{ readOnly: true }} onClick={() => openPopup(field, label)} className={styles.popupPreviewField} />
  )

  const handleGoBack = () => {
    const nextState = { ...navigationState, mqa3DraftKey: draftKey, mqa3Insert2: form }
    writeMqa3Draft(draftKey, { draftKey, navigationState: nextState, mqa3Insert2: form })
    navigate('/mqa3Insert-1', { state: nextState })
  }

  const handleGoNext = () => {
    if (!isPageComplete) return

    const cleanCloList = normalizeCloList(form.cloList).map((item) => normalizeText(item)).filter(Boolean)
    const nextForm = { ...form, cloList: cleanCloList }
    const nextState = { ...navigationState, mqa3DraftKey: draftKey, mqa3Insert2: nextForm }

    writeMqa3Draft(draftKey, { draftKey, navigationState: nextState, mqa3Insert2: nextForm })
    navigate('/mqa3Insert-3', { state: nextState })
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Mqa3FormNav currentStep={2} />

        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>
                รายวิชาที่ต้องเรียนมาก่อน
              </Typography>
              <Typography className={styles.pageDescription}>
                กำลังจัดทำเอกสารของรายวิชา: {getCourseDisplayText(navigationState, savedDraft)}
              </Typography>
              <Typography className={styles.pageDescription}>
                กรอกข้อมูลตามแบบฟอร์มเดิมของหัวข้อ 7 - 12
              </Typography>
              {isCourseLoading && <Typography className={styles.pageDescription}>กำลังดึงข้อมูลรายวิชาและ PLO จากระบบ...</Typography>}
              {courseErrorMessage && <Typography className={styles.pageDescription}>{courseErrorMessage}</Typography>}
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

          <Box className={styles.contentFlow}>
            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                7. รายวิชาที่ต้องเรียนมาก่อน (Pre-requisite) และรายวิชาที่ต้องเรียนพร้อมกัน (Co-requisite)
              </Typography>

              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="40%">ประเภทรายวิชา</TableCell>
                      <TableCell width="60%">ชื่อรายวิชา</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    <TableRow>
                      <TableCell>รายวิชาที่ต้องเรียนมาก่อน (Pre-requisite)</TableCell>
                      <TableCell>
                        <TextField fullWidth multiline minRows={2} placeholder="-" value={form.prerequisite} onChange={(event) => handleChangeField('prerequisite', event.target.value)} className={styles.tableInput} />
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>รายวิชาที่ต้องเรียนพร้อมกัน (Co-requisite)</TableCell>
                      <TableCell>
                        <TextField fullWidth multiline minRows={2} placeholder="-" value={form.corequisite} onChange={(event) => handleChangeField('corequisite', event.target.value)} className={styles.tableInput} />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                8. วันที่จัดทำหรือปรับปรุงรายละเอียดของรายวิชาครั้งล่าสุด
              </Typography>

              <Box className={styles.dateFieldRow}>
                <TextField type="date" value={form.updateDate} onChange={(event) => handleChangeField('updateDate', event.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
              </Box>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                9. คำอธิบายรายวิชา
              </Typography>

              {renderPopupField('คำอธิบายรายวิชา', 'descriptionThai', 6)}
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                10. วัตถุประสงค์ในการพัฒนา / ปรับปรุงรายวิชา
              </Typography>

              {renderPopupField('วัตถุประสงค์ในการพัฒนา / ปรับปรุงรายวิชา', 'developmentObjective', 6)}
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                11. ผลลัพธ์การเรียนรู้ของหลักสูตร (PLO)
              </Typography>

              {renderPopupField('ผลลัพธ์การเรียนรู้ของหลักสูตร (PLO)', 'plo', 6)}
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                12. ผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา (CLOs)
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {normalizeCloList(form.cloList).map((cloItem, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <TextField fullWidth multiline minRows={2} label={`CLO ข้อที่ ${index + 1}`} placeholder={`กรอกผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา ข้อที่ ${index + 1}`} value={cloItem} onChange={(event) => updateCloItem(index, event.target.value)} />
                    <IconButton color="error" onClick={() => removeCloItem(index)} disabled={normalizeCloList(form.cloList).length === 1} sx={{ mt: 1 }}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>

              <Button startIcon={<AddCircleOutlineIcon />} variant="outlined" onClick={addCloItem} sx={{ mt: 2 }}>
                เพิ่ม CLO
              </Button>
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button variant="outlined" startIcon={<NavigateBeforeIcon />} className={styles.backButton} onClick={handleGoBack}>
              ย้อนกลับ
            </Button>

            <Button variant="contained" endIcon={<NavigateNextIcon />} className={styles.nextButton} onClick={handleGoNext} disabled={!isPageComplete}>
              ถัดไป
            </Button>
          </Box>
        </Box>
      </Box>

      <Dialog open={popup.open} onClose={closePopup} maxWidth="md" fullWidth>
        <DialogTitle>{popup.title}</DialogTitle>

        <DialogContent>
          <TextField fullWidth multiline minRows={10} value={popup.value} onChange={(event) => setPopup((prev) => ({ ...prev, value: event.target.value }))} className={styles.dialogField} />
        </DialogContent>

        <DialogActions>
          <Button onClick={closePopup}>ยกเลิก</Button>
          <Button variant="contained" onClick={savePopup}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default mqa3Insert2Page