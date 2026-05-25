import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import Mqa5FormNav from '../../../components/mqa5/mqa5FormNav'
import styles from './mqa5Insert3Page.module.css'

const MQA5_ACTIVE_DRAFT_KEY = 'mqa5ActiveDraftKey'
const TQF5_DETAIL_ENDPOINTS = ['/tqf5', '/mqa5']

const defaultSec13 = { issue131: '', impact131: '', issue132: '', impact132: '' }
const defaultSec141 = { critique: '', teacherComment: '' }
const defaultRow142 = { critique: '', teacherComment: '' }

const normalizeText = (value) => String(value ?? '').trim()
const hasText = (value) => normalizeText(value) !== ''
const getApiUrl = (apiUrl, path) => `${String(apiUrl || '').replace(/\/$/, '')}${path}`
const getAuthConfig = () => { const token = localStorage.getItem('mqa_token'); return { headers: token ? { Authorization: `Bearer ${token}` } : {} } }
const safeReadJson = (key) => { try { const rawValue = sessionStorage.getItem(key); return rawValue ? JSON.parse(rawValue) : null } catch { return null } }
const safeWriteJson = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)) } catch (error) { console.warn('Cannot write MQA5 draft:', error) } }
const getActiveDraftKey = () => { try { return sessionStorage.getItem(MQA5_ACTIVE_DRAFT_KEY) || '' } catch { return '' } }
const setActiveDraftKey = (draftKey) => { try { sessionStorage.setItem(MQA5_ACTIVE_DRAFT_KEY, draftKey) } catch (error) { console.warn('Cannot set active MQA5 draft key:', error) } }
const getResponseObject = (data) => { if (Array.isArray(data)) return data[0] || null; if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) return data.data; if (data?.item && typeof data.item === 'object') return data.item; if (data?.result && typeof data.result === 'object') return data.result; return data }
const getResponseList = (data, keyList = []) => { if (Array.isArray(data)) return data; if (Array.isArray(data?.data)) return data.data; if (Array.isArray(data?.items)) return data.items; if (Array.isArray(data?.results)) return data.results; for (const key of keyList) { const value = key.split('.').reduce((current, part) => current?.[part], data); if (Array.isArray(value)) return value } return [] }
const getErrorMessage = (error, fallbackMessage) => { const detail = error?.response?.data?.detail; const message = error?.response?.data?.message; if (Array.isArray(detail)) return detail.map((item) => item.msg || item.message || JSON.stringify(item)).join(', '); return detail || message || fallbackMessage }
const pickFirstText = (...values) => values.map((value) => normalizeText(value)).find(Boolean) || ''
const isNumericId = (value) => /^\d+$/.test(normalizeText(value))

const getMqa5DraftKey = (state = {}) => {
  const courseItem = state?.courseItem || {}
  const keySource = state?.mqa5DraftKey || state?.tqf5Id || state?.tqf5_id || state?.mqa5Id || state?.mqa5_id || state?.selectedDocumentId || state?.documentId || state?.document_id || state?.openingCourseItemId || state?.requestedCourseItemId || state?.courseId || state?.courseCode || courseItem?.tqf5Id || courseItem?.tqf5_id || courseItem?.mqa5Id || courseItem?.mqa5_id || courseItem?.openingCourseItemId || courseItem?.requestedCourseItemId || courseItem?.courseId || courseItem?.courseCode || ''
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

const getTqf3ReferenceId = (state = {}, savedDraft = {}) => normalizeText(state?.referenceTqf3Id || state?.reference_tqf3_id || state?.sourceTqf3Id || state?.source_tqf3_id || state?.tqf3Id || state?.tqf3_id || state?.mqa3Id || state?.mqa3_id || state?.courseItem?.referenceTqf3Id || state?.courseItem?.reference_tqf3_id || state?.courseItem?.sourceTqf3Id || state?.courseItem?.source_tqf3_id || state?.courseItem?.tqf3Id || state?.courseItem?.tqf3_id || state?.courseItem?.mqa3Id || state?.courseItem?.mqa3_id || savedDraft?.referenceTqf3Id || savedDraft?.reference_tqf3_id || savedDraft?.sourceTqf3Id || savedDraft?.source_tqf3_id || savedDraft?.tqf3Id || savedDraft?.tqf3_id || savedDraft?.mqa3Id || savedDraft?.mqa3_id || savedDraft?.navigationState?.referenceTqf3Id || savedDraft?.navigationState?.sourceTqf3Id || savedDraft?.navigationState?.tqf3Id || savedDraft?.navigationState?.mqa3Id || '')
const getTqf5DocumentId = (state = {}, savedDraft = {}) => normalizeText(state?.tqf5Id || state?.tqf5_id || state?.mqa5Id || state?.mqa5_id || state?.selectedDocumentId || state?.documentId || state?.document_id || state?.courseItem?.tqf5Id || state?.courseItem?.tqf5_id || state?.courseItem?.mqa5Id || state?.courseItem?.mqa5_id || savedDraft?.tqf5Id || savedDraft?.tqf5_id || savedDraft?.mqa5Id || savedDraft?.mqa5_id || savedDraft?.navigationState?.tqf5Id || savedDraft?.navigationState?.mqa5Id || '')

const normalizeRows142 = (rows = []) => Array.isArray(rows) && rows.length ? rows.map((row) => ({ ...defaultRow142, ...row })) : [{ ...defaultRow142 }]
const hasUsefulSec13Data = (sec13 = {}) => hasText(sec13?.issue131) || hasText(sec13?.impact131) || hasText(sec13?.issue132) || hasText(sec13?.impact132)
const hasUsefulSec141Data = (sec141 = {}) => hasText(sec141?.critique) || hasText(sec141?.teacherComment)
const hasUsefulRows142Data = (rows = []) => Array.isArray(rows) && rows.some((row) => hasText(row?.critique) || hasText(row?.teacherComment))

const getDocumentDataFromTqf5 = (tqf5Data = {}) => {
  const documentData = tqf5Data?.documentData || tqf5Data?.document_data || tqf5Data?.document || tqf5Data?.data?.documentData || {}
  return documentData && typeof documentData === 'object' && !Array.isArray(documentData) ? documentData : {}
}

const getSectionFromTqf5 = (tqf5Data = {}, sectionName = '') => {
  const documentData = getDocumentDataFromTqf5(tqf5Data)
  const section = documentData?.[sectionName] || tqf5Data?.[sectionName] || {}
  return section && typeof section === 'object' && !Array.isArray(section) ? section : {}
}

const getIssueRowsByType = (tqf5Data = {}, issueType = '') => {
  const normalizedIssueType = normalizeText(issueType).toLowerCase()
  return getResponseList(tqf5Data?.issues ?? tqf5Data?.issue_list ?? tqf5Data?.issueList, ['issues', 'issue_list', 'issueList']).filter((item) => normalizeText(item?.issue_type || item?.issueType || item?.type).toLowerCase() === normalizedIssueType)
}

const getFeedbackRowsByType = (tqf5Data = {}, feedbackType = '') => {
  const normalizedFeedbackType = normalizeText(feedbackType).toLowerCase()
  return getResponseList(tqf5Data?.feedbacks ?? tqf5Data?.feedback_list ?? tqf5Data?.feedbackList, ['feedbacks', 'feedback_list', 'feedbackList']).filter((item) => normalizeText(item?.feedback_type || item?.feedbackType || item?.type).toLowerCase() === normalizedFeedbackType)
}

const mapIssueToSec13Part = (issue = {}) => ({
  issue: pickFirstText(issue?.issue, issue?.problem, issue?.problem_text, issue?.problemText, issue?.detail),
  impact: pickFirstText(issue?.impact, issue?.effect, issue?.learning_impact, issue?.learningImpact, issue?.result),
})

const mapFeedbackToRow = (feedback = {}) => ({
  critique: pickFirstText(feedback?.critique, feedback?.criticism, feedback?.comment, feedback?.feedback, feedback?.suggestion, feedback?.detail),
  teacherComment: pickFirstText(feedback?.teacherComment, feedback?.teacher_comment, feedback?.response, feedback?.teacher_response, feedback?.teacherResponse, feedback?.comment_response),
})

const mapTqf5DetailToPage3Data = (tqf5Data = {}) => {
  const section13 = getSectionFromTqf5(tqf5Data, 'section13')
  const section14 = getSectionFromTqf5(tqf5Data, 'section14')

  const resourceIssueList = getResponseList(section13?.resourceIssues ?? section13?.resource_issues ?? section13?.resources, ['resourceIssues', 'resource_issues', 'resources'])
  const adminIssueList = getResponseList(section13?.adminIssues ?? section13?.admin_issues ?? section13?.administrationIssues, ['adminIssues', 'admin_issues', 'administrationIssues'])
  const resourceIssue = mapIssueToSec13Part(resourceIssueList[0] || getIssueRowsByType(tqf5Data, 'resource')[0] || {})
  const adminIssue = mapIssueToSec13Part(adminIssueList[0] || getIssueRowsByType(tqf5Data, 'admin')[0] || {})

  const sec13 = {
    issue131: resourceIssue.issue,
    impact131: resourceIssue.impact,
    issue132: adminIssue.issue,
    impact132: adminIssue.impact,
  }

  const systemFeedbackList = getResponseList(section14?.systemFeedback ?? section14?.system_feedback ?? section14?.studentSystemFeedback, ['systemFeedback', 'system_feedback', 'studentSystemFeedback'])
  const otherFeedbackList = getResponseList(section14?.otherFeedback ?? section14?.other_feedback ?? section14?.otherFeedbacks, ['otherFeedback', 'other_feedback', 'otherFeedbacks'])

  const sec141 = { ...defaultSec141, ...mapFeedbackToRow(systemFeedbackList[0] || getFeedbackRowsByType(tqf5Data, 'system')[0] || {}) }

  const feedback142Source = otherFeedbackList.length ? otherFeedbackList : getFeedbackRowsByType(tqf5Data, 'other')
  const rows142 = feedback142Source.map((feedback) => mapFeedbackToRow(feedback)).filter((row) => hasText(row.critique) || hasText(row.teacherComment))

  return {
    sec13,
    sec141,
    rows142: rows142.length ? normalizeRows142(rows142) : [{ ...defaultRow142 }],
  }
}

const fetchTqf5Detail = async (apiUrl, tqf5Id) => {
  let lastError = null
  for (const endpoint of TQF5_DETAIL_ENDPOINTS) {
    try {
      const response = await axios.get(getApiUrl(apiUrl, `${endpoint}/${tqf5Id}`), getAuthConfig())
      return getResponseObject(response.data) || {}
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

function Mqa5Insert3Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const apiUrl = import.meta.env.VITE_API_URL
  const locationState = useMemo(() => location.state || {}, [location.state])
  const draftKey = useMemo(() => getMqa5DraftKey(locationState), [locationState])
  const savedDraft = useMemo(() => safeReadJson(draftKey), [draftKey])
  const navigationState = useMemo(() => Object.keys(locationState).length ? locationState : savedDraft?.navigationState || {}, [locationState, savedDraft])
  const tqf3ReferenceId = useMemo(() => getTqf3ReferenceId(navigationState, savedDraft), [navigationState, savedDraft])
  const tqf5DocumentId = useMemo(() => getTqf5DocumentId(navigationState, savedDraft), [navigationState, savedDraft])
  const savedPageData = savedDraft?.mqa5Insert3 || navigationState?.mqa5Insert3 || null
  const hydrationKey = `${tqf5DocumentId || 'new'}:${tqf3ReferenceId || 'no-tqf3'}`
  const loadedHydrationKeyRef = useRef('')

  const [sec13, setSec13] = useState(() => ({ ...defaultSec13, ...(savedPageData?.sec13 || {}) }))
  const [sec141, setSec141] = useState(() => ({ ...defaultSec141, ...(savedPageData?.sec141 || {}) }))
  const [rows142, setRows142] = useState(() => normalizeRows142(savedPageData?.rows142))
  const [isLoadingExistingData, setIsLoadingExistingData] = useState(false)
  const [loadErrorMessage, setLoadErrorMessage] = useState('')
  const [hasHydratedInitialData, setHasHydratedInitialData] = useState(false)
  const [popup, setPopup] = useState({ open: false, title: '', value: '', mode: '', field: '', rowIndex: null, rowField: '' })

  const isPageComplete = useMemo(() => {
    const sec13Complete = hasText(sec13.issue131) && hasText(sec13.impact131) && hasText(sec13.issue132) && hasText(sec13.impact132)
    const sec141Complete = hasText(sec141.critique) && hasText(sec141.teacherComment)
    const rows142Complete = rows142.length > 0 && rows142.every((row) => hasText(row.critique) && hasText(row.teacherComment))
    return sec13Complete && sec141Complete && rows142Complete
  }, [sec13, sec141, rows142])

  const buildNextState = () => ({ ...navigationState, mqa5DraftKey: draftKey, referenceTqf3Id: tqf3ReferenceId, sourceTqf3Id: tqf3ReferenceId, tqf3Id: tqf3ReferenceId, mqa3Id: tqf3ReferenceId, tqf5Id: tqf5DocumentId, mqa5Id: tqf5DocumentId, mqa5Insert3: { sec13, sec141, rows142 } })

  useEffect(() => {
    if (!apiUrl) return
    if (loadedHydrationKeyRef.current === hydrationKey) return

    let isMounted = true

    const hydratePageData = async () => {
      let nextSec13 = { ...defaultSec13, ...(savedPageData?.sec13 || {}) }
      let nextSec141 = { ...defaultSec141, ...(savedPageData?.sec141 || {}) }
      let nextRows142 = normalizeRows142(savedPageData?.rows142)

      setLoadErrorMessage('')

      if (tqf5DocumentId && isNumericId(tqf5DocumentId)) {
        try {
          setIsLoadingExistingData(true)
          const tqf5Data = await fetchTqf5Detail(apiUrl, tqf5DocumentId)
          if (!isMounted) return

          const mappedPage3 = mapTqf5DetailToPage3Data(tqf5Data)
          if (hasUsefulSec13Data(mappedPage3.sec13)) nextSec13 = { ...defaultSec13, ...mappedPage3.sec13 }
          if (hasUsefulSec141Data(mappedPage3.sec141)) nextSec141 = { ...defaultSec141, ...mappedPage3.sec141 }
          if (hasUsefulRows142Data(mappedPage3.rows142)) nextRows142 = mappedPage3.rows142
        } catch (error) {
          if (!isMounted) return
          console.warn('Cannot fetch existing MQA5 page 3 data:', error)
          setLoadErrorMessage(getErrorMessage(error, 'ไม่สามารถดึงข้อมูลเดิมของ มคอ.5 หน้า 3 ได้ ระบบจะแสดงข้อมูลจากแบบร่างในเครื่องแทน'))
        } finally {
          if (isMounted) setIsLoadingExistingData(false)
        }
      } else if (tqf5DocumentId && !isNumericId(tqf5DocumentId)) {
        setLoadErrorMessage('รหัสเอกสาร มคอ.5 ไม่ถูกต้อง กรุณากลับไปเปิดจากหน้ารายการเอกสารใหม่อีกครั้ง')
      }

      if (!isMounted) return

      loadedHydrationKeyRef.current = hydrationKey
      setSec13(nextSec13)
      setSec141(nextSec141)
      setRows142(nextRows142)
      setHasHydratedInitialData(true)

      const nextState = { ...navigationState, mqa5DraftKey: draftKey, referenceTqf3Id: tqf3ReferenceId, sourceTqf3Id: tqf3ReferenceId, tqf3Id: tqf3ReferenceId, mqa3Id: tqf3ReferenceId, tqf5Id: tqf5DocumentId, mqa5Id: tqf5DocumentId, mqa5Insert3: { sec13: nextSec13, sec141: nextSec141, rows142: nextRows142 } }
      writeMqa5Draft(draftKey, { draftKey, navigationState: nextState, referenceTqf3Id: tqf3ReferenceId, sourceTqf3Id: tqf3ReferenceId, tqf3Id: tqf3ReferenceId, mqa3Id: tqf3ReferenceId, tqf5Id: tqf5DocumentId, mqa5Id: tqf5DocumentId, mqa5Insert3: { sec13: nextSec13, sec141: nextSec141, rows142: nextRows142 } })
    }

    hydratePageData()

    return () => { isMounted = false }
  }, [apiUrl, hydrationKey])

  useEffect(() => {
    if (!hasHydratedInitialData) return
    const nextState = buildNextState()
    writeMqa5Draft(draftKey, { draftKey, navigationState: nextState, referenceTqf3Id: tqf3ReferenceId, sourceTqf3Id: tqf3ReferenceId, tqf3Id: tqf3ReferenceId, mqa3Id: tqf3ReferenceId, tqf5Id: tqf5DocumentId, mqa5Id: tqf5DocumentId, mqa5Insert3: { sec13, sec141, rows142 } })
  }, [draftKey, hasHydratedInitialData, navigationState, rows142, sec13, sec141, tqf3ReferenceId, tqf5DocumentId])

  const openPopupForSec13 = (field, title) => setPopup({ open: true, title, value: sec13[field] || '', mode: 'sec13', field, rowIndex: null, rowField: '' })
  const openPopupForSec141 = (field, title) => setPopup({ open: true, title, value: sec141[field] || '', mode: 'sec141', field, rowIndex: null, rowField: '' })
  const openPopupForRow142 = (rowIndex, rowField, title) => setPopup({ open: true, title, value: rows142[rowIndex]?.[rowField] || '', mode: 'row142', field: '', rowIndex, rowField })
  const closePopup = () => setPopup((prev) => ({ ...prev, open: false }))

  const savePopup = () => {
    if (popup.mode === 'sec13') setSec13((prev) => ({ ...prev, [popup.field]: popup.value }))
    if (popup.mode === 'sec141') setSec141((prev) => ({ ...prev, [popup.field]: popup.value }))
    if (popup.mode === 'row142') setRows142((prev) => { const next = [...prev]; next[popup.rowIndex] = { ...next[popup.rowIndex], [popup.rowField]: popup.value }; return next })
    closePopup()
  }

  const renderPopupField = (value, onClickTitle, openFn, minRows = 4, extraClassName = '') => (
    <TextField fullWidth multiline minRows={minRows} maxRows={minRows} value={value} placeholder="คลิกเพื่อกรอกข้อมูล" InputProps={{ readOnly: true }} onClick={() => openFn(onClickTitle.field, onClickTitle.title)} className={`${styles.popupPreviewField} ${extraClassName}`} />
  )

  const renderRow142Field = (rowIndex, rowField, title, minRows = 3) => (
    <TextField fullWidth multiline minRows={minRows} maxRows={minRows} value={rows142[rowIndex]?.[rowField] || ''} placeholder="คลิกเพื่อกรอกข้อมูล" InputProps={{ readOnly: true }} onClick={() => openPopupForRow142(rowIndex, rowField, title)} className={styles.compactPreviewField} />
  )

  const addRow142 = () => setRows142((prev) => [...prev, { ...defaultRow142 }])
  const removeRow142 = (index) => setRows142((prev) => prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index))

  const handleBack = () => {
    const nextState = buildNextState()
    writeMqa5Draft(draftKey, { draftKey, navigationState: nextState, mqa5Insert3: { sec13, sec141, rows142 } })
    navigate('/mqa5Insert-2', { state: nextState })
  }

  const handleNext = () => {
    if (!isPageComplete || isLoadingExistingData) return
    const nextState = buildNextState()
    writeMqa5Draft(draftKey, { draftKey, navigationState: nextState, mqa5Insert3: { sec13, sec141, rows142 } })
    navigate('/mqa5Insert-4', { state: nextState })
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />
      <Box className={styles.container}>
        <Mqa5FormNav currentStep={3} />
        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>การพัฒนานักศึกษาตามผลลัพธ์การเรียนรู้ที่คาดหวัง</Typography>
              <Typography className={styles.pageDescription}>กรอกข้อมูลตามแบบฟอร์มเดิมของหัวข้อ 13 - 14 สำหรับแบบฟอร์ม มคอ.5</Typography>
            </Box>
            <Box className={styles.pageStatus}>
              <Typography className={styles.pageStatusLabel}>สถานะหน้านี้</Typography>
              <Typography className={styles.pageStatusValue}>{isPageComplete ? 'ครบแล้ว' : 'ยังไม่ครบ'}</Typography>
            </Box>
          </Box>

          {isLoadingExistingData && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <CircularProgress size={22} />
              <Typography color="text.secondary">กำลังดึงข้อมูลเดิมจาก มคอ.5...</Typography>
            </Box>
          )}

          {loadErrorMessage && (
            <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.18)' }}>
              <Typography color="error" fontWeight={700}>{loadErrorMessage}</Typography>
            </Box>
          )}

          <Box className={styles.contentFlow}>
            <Box className={styles.sectionBlock}><Typography className={styles.sectionTitle}>13. ปัญหาและผลกระทบต่อการดำเนินการ</Typography></Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.subSectionTitle}>13.1 ประเด็นด้านทรัพยากรประกอบการเรียนและสิ่งอำนวยความสะดวก</Typography>
              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.fixedWideTable}>
                  <TableHead><TableRow><TableCell width="50%">ปัญหาในการใช้แหล่งทรัพยากรประกอบการเรียนการสอน</TableCell><TableCell width="50%">ผลกระทบต่อการเรียนรู้</TableCell></TableRow></TableHead>
                  <TableBody><TableRow><TableCell>{renderPopupField(sec13.issue131, { field: 'issue131', title: '13.1 ปัญหาในการใช้แหล่งทรัพยากรประกอบการเรียนการสอน' }, openPopupForSec13, 4)}</TableCell><TableCell>{renderPopupField(sec13.impact131, { field: 'impact131', title: '13.1 ผลกระทบต่อการเรียนรู้' }, openPopupForSec13, 4)}</TableCell></TableRow></TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.subSectionTitle}>13.2 ประเด็นด้านการบริหารและองค์กร</Typography>
              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.fixedWideTable}>
                  <TableHead><TableRow><TableCell width="50%">ปัญหาด้านการบริหารและองค์กร</TableCell><TableCell width="50%">ผลกระทบต่อการเรียนรู้</TableCell></TableRow></TableHead>
                  <TableBody><TableRow><TableCell>{renderPopupField(sec13.issue132, { field: 'issue132', title: '13.2 ปัญหาด้านการบริหารและองค์กร' }, openPopupForSec13, 4)}</TableCell><TableCell>{renderPopupField(sec13.impact132, { field: 'impact132', title: '13.2 ผลกระทบต่อการเรียนรู้' }, openPopupForSec13, 4)}</TableCell></TableRow></TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box className={styles.sectionBlock}><Typography className={styles.sectionTitle}>14. การประเมินรายวิชา</Typography></Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.subSectionTitle}>14.1 ผลการประเมินรายวิชาโดยนักศึกษาในระบบทะเบียน (แนบผลการประเมินจากระบบ)</Typography>
              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.fixedWideTable}>
                  <TableHead><TableRow><TableCell width="50%">ข้อวิพากษ์สำคัญจากผลการประเมินโดยนักศึกษา</TableCell><TableCell width="50%">ความเห็นของอาจารย์ผู้สอนต่อข้อวิพากษ์</TableCell></TableRow></TableHead>
                  <TableBody><TableRow><TableCell>{renderPopupField(sec141.critique, { field: 'critique', title: '14.1 ข้อวิพากษ์สำคัญจากผลการประเมินโดยนักศึกษา' }, openPopupForSec141, 4)}</TableCell><TableCell>{renderPopupField(sec141.teacherComment, { field: 'teacherComment', title: '14.1 ความเห็นของอาจารย์ผู้สอนต่อข้อวิพากษ์' }, openPopupForSec141, 4)}</TableCell></TableRow></TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.subSectionTitle}>14.2 ผลการประเมินรายวิชาโดยวิธีอื่น (เช่น การฟังเสียงสะท้อนจากนักศึกษาในห้องเรียน)</Typography>
              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.fixedWideTable}>
                  <TableHead><TableRow><TableCell width="45%">ข้อวิพากษ์สำคัญจากผลการประเมินโดยวิธีอื่น</TableCell><TableCell width="45%">ความเห็นของอาจารย์ผู้สอนต่อข้อวิพากษ์</TableCell><TableCell width="10%" /></TableRow></TableHead>
                  <TableBody>
                    {rows142.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell><Box className={styles.indexedFieldWrap}><Typography className={styles.inlineIndex}>{index + 1}.</Typography><Box className={styles.inlineField}>{renderRow142Field(index, 'critique', `14.2 ข้อวิพากษ์สำคัญจากผลการประเมินโดยวิธีอื่น (รายการที่ ${index + 1})`, 3)}</Box></Box></TableCell>
                        <TableCell><Box className={styles.indexedFieldWrap}><Typography className={styles.inlineIndex}>{index + 1}.</Typography><Box className={styles.inlineField}>{renderRow142Field(index, 'teacherComment', `14.2 ความเห็นของอาจารย์ผู้สอนต่อข้อวิพากษ์ (รายการที่ ${index + 1})`, 3)}</Box></Box></TableCell>
                        <TableCell className={styles.actionCell}><IconButton color="error" onClick={() => removeRow142(index)} disabled={rows142.length === 1} className={styles.deleteButton}><DeleteOutlineIcon /></IconButton></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button startIcon={<AddCircleOutlineIcon />} variant="outlined" onClick={addRow142} className={styles.addButton}>เพิ่มข้อ (14.2)</Button>
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button variant="outlined" startIcon={<NavigateBeforeIcon />} className={styles.backButton} onClick={handleBack}>ย้อนกลับ</Button>
            <Button variant="contained" endIcon={<NavigateNextIcon />} className={styles.nextButton} onClick={handleNext} disabled={!isPageComplete || isLoadingExistingData}>ถัดไป</Button>
          </Box>
        </Box>
      </Box>

      <Dialog open={popup.open} onClose={closePopup} maxWidth="md" fullWidth>
        <DialogTitle>{popup.title}</DialogTitle>
        <DialogContent><TextField fullWidth multiline minRows={10} value={popup.value} onChange={(event) => setPopup((prev) => ({ ...prev, value: event.target.value }))} className={styles.dialogField} /></DialogContent>
        <DialogActions><Button onClick={closePopup}>ยกเลิก</Button><Button variant="contained" onClick={savePopup}>บันทึก</Button></DialogActions>
      </Dialog>
    </Box>
  )
}

export default Mqa5Insert3Page
