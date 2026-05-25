import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import Mqa3FormNav from '../../../components/mqa3/mqa3FormNav'
import styles from './mqa3Insert3Page.module.css'

const COURSE_ENDPOINT = '/course/'
const TQF3_ENDPOINT = '/tqf3'
const MQA3_ACTIVE_DRAFT_KEY = 'mqa3ActiveDraftKey'
const initialFormValue = { lectureHours: '', practiceHours: '', selfStudyHours: '', contactChannel: '' }
const initialDev14Rows = [{ clo: '', teachStrategy: '', assessStrategy: '' }]
const normalizeText = (value) => String(value ?? '').trim()
const hasObjectData = (value) => Boolean(value && typeof value === 'object' && Object.keys(value).length > 0)
const hasText = (value) => normalizeText(value) !== ''
const getAuthConfig = () => { const token = localStorage.getItem('mqa_token'); return { headers: token ? { Authorization: `Bearer ${token}` } : {} } }
const getResponseObject = (data) => { if (Array.isArray(data)) return data[0] ?? null; if (data?.course && typeof data.course === 'object') return data.course; if (data?.data && typeof data.data === 'object') return data.data; if (data?.item && typeof data.item === 'object') return data.item; if (data?.result && typeof data.result === 'object') return data.result; return data }
const getResponseList = (data, keyList = []) => { if (Array.isArray(data)) return data; for (const key of keyList) { const value = key.split('.').reduce((current, part) => current?.[part], data); if (Array.isArray(value)) return value } if (Array.isArray(data?.data)) return data.data; if (Array.isArray(data?.items)) return data.items; if (Array.isArray(data?.results)) return data.results; return [] }
const safeReadJson = (key) => { try { const rawValue = sessionStorage.getItem(key); return rawValue ? JSON.parse(rawValue) : null } catch (error) { return null } }
const safeWriteJson = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)) } catch (error) { console.warn('Cannot write MQA3 draft to sessionStorage:', error) } }
const getActiveDraftKey = () => { try { return sessionStorage.getItem(MQA3_ACTIVE_DRAFT_KEY) || '' } catch (error) { return '' } }
const setActiveDraftKey = (draftKey) => { try { sessionStorage.setItem(MQA3_ACTIVE_DRAFT_KEY, draftKey) } catch (error) { console.warn('Cannot set active MQA3 draft key:', error) } }
const getMqa3DraftKey = (state = {}) => { const courseItem = state?.courseItem ?? {}; const keySource = state?.mqa3DraftKey || state?.openingCourseItemId || state?.requestedCourseItemId || state?.courseId || state?.courseCode || courseItem?.openingCourseItemId || courseItem?.requestedCourseItemId || courseItem?.courseId || courseItem?.courseCode || ''; if (keySource) return String(keySource).startsWith('mqa3Draft:') ? String(keySource) : `mqa3Draft:${keySource}`; return getActiveDraftKey() || 'mqa3Draft:new' }
const readMqa3Draft = (draftKey) => safeReadJson(draftKey)
const writeMqa3Draft = (draftKey, nextDraft) => { const currentDraft = readMqa3Draft(draftKey) || {}; const mergedDraft = { ...currentDraft, ...nextDraft, updatedAt: new Date().toISOString() }; safeWriteJson(draftKey, mergedDraft); setActiveDraftKey(draftKey) }
const normalizeHourValue = (value, fallbackValue = '') => { if (value === null || value === undefined || value === '') return fallbackValue; const text = String(value).trim(); const match = text.match(/^(\d+(\.\d+)?)/); return match ? match[1] : text }
const parseHourFromCreditText = (value) => { const text = normalizeText(value); if (!text) return {}; const bracketMatch = text.match(/\(([^)]+)\)/); const targetText = bracketMatch?.[1] || text; const hourMatch = targetText.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/); if (!hourMatch) return {}; return { lectureHours: hourMatch[1], practiceHours: hourMatch[2], selfStudyHours: hourMatch[3] } }
const normalizeCloList = (value) => { if (Array.isArray(value)) return value.map((item) => normalizeText(item)).filter(Boolean); if (hasText(value)) return String(value).split('\n').map((item) => normalizeText(item)).filter(Boolean); return [] }
const getCloListFromPage2 = (navigationState = {}, savedDraft = {}) => normalizeCloList(navigationState?.mqa3Insert2?.cloList ?? navigationState?.mqa3Insert2?.clo ?? savedDraft?.mqa3Insert2?.cloList ?? savedDraft?.mqa3Insert2?.clo ?? [])
const syncDev14RowsWithCloList = (currentRows = [], cloList = []) => { const safeRows = Array.isArray(currentRows) && currentRows.length > 0 ? currentRows : initialDev14Rows; const cleanCloList = normalizeCloList(cloList); if (cleanCloList.length === 0) return safeRows; const rowMapByClo = new Map(); safeRows.forEach((row) => { const rowClo = normalizeText(row?.clo); if (rowClo && !rowMapByClo.has(rowClo)) rowMapByClo.set(rowClo, row) }); return cleanCloList.map((clo, index) => { const matchedRow = rowMapByClo.get(clo) || safeRows[index] || {}; return { clo, teachStrategy: matchedRow.teachStrategy || '', assessStrategy: matchedRow.assessStrategy || '' } }) }
const getHoursFromCourseData = (course = {}) => { const creditTextHours = parseHourFromCreditText(course?.creditText ?? course?.credit_text ?? course?.creditFormat ?? course?.credit_format ?? course?.credits ?? course?.credit); return { lectureHours: normalizeHourValue(course?.credit_lecture ?? course?.creditLecture ?? course?.lectureHours ?? course?.lecture_hours ?? course?.lecture) || creditTextHours.lectureHours || '', practiceHours: normalizeHourValue(course?.credit_lab ?? course?.creditLab ?? course?.labHours ?? course?.lab_hours ?? course?.practiceHours ?? course?.practice_hours ?? course?.practice) || creditTextHours.practiceHours || '', selfStudyHours: normalizeHourValue(course?.credit_self_study ?? course?.creditSelfStudy ?? course?.selfStudyHours ?? course?.self_study_hours ?? course?.selfStudy) || creditTextHours.selfStudyHours || '' } }
const getCourseIdFromNavigation = (navigationState = {}, savedDraft = {}) => { const courseItem = navigationState?.courseItem || savedDraft?.navigationState?.courseItem || {}; const mqa3Insert1 = navigationState?.mqa3Insert1 || savedDraft?.mqa3Insert1 || {}; const courseDetail = mqa3Insert1?.courseDetail || {}; return navigationState?.courseId || navigationState?.course_id || courseItem?.courseId || courseItem?.course_id || courseItem?.rawData?.courseId || courseItem?.rawData?.course_id || mqa3Insert1?.courseId || mqa3Insert1?.course_id || courseDetail?.id || courseDetail?.courseId || courseDetail?.course_id || '' }
const getTqf3DocumentId = (navigationState = {}, savedDraft = {}) => { const savedState = savedDraft?.navigationState || {}; const courseItem = navigationState?.courseItem || savedState?.courseItem || {}; const rawData = courseItem?.rawData || {}; return normalizeText(navigationState?.tqf3Id || navigationState?.tqf3_id || navigationState?.mqa3Id || navigationState?.mqa3_id || navigationState?.selectedDocumentId || navigationState?.documentId || savedState?.tqf3Id || savedState?.tqf3_id || savedState?.mqa3Id || savedState?.mqa3_id || savedState?.selectedDocumentId || savedState?.documentId || savedDraft?.tqf3Id || savedDraft?.mqa3Id || courseItem?.tqf3Id || courseItem?.mqa3Id || rawData?.tqf3Id || rawData?.mqa3Id || '') }
const hasUsefulPage3Data = (page3Data) => { const data = page3Data || {}; const form = data?.form || data || {}; const rows = Array.isArray(data?.dev14Rows) ? data.dev14Rows : []; return hasText(form.lectureHours) || hasText(form.practiceHours) || hasText(form.selfStudyHours) || hasText(form.contactChannel) || rows.some((row) => hasText(row?.clo) || hasText(row?.teachStrategy) || hasText(row?.assessStrategy)) }
const getTqf3CloText = (clo) => normalizeText(clo?.detail ?? clo?.clo_detail ?? clo?.description ?? clo?.description_thai ?? clo?.name ?? clo?.clo ?? clo)
const getTqf3CloNumber = (clo, index = 0) => normalizeText(clo?.number ?? clo?.clo_number ?? clo?.cloNumber ?? clo?.order_no ?? clo?.orderNo ?? (index + 1))
const getCloListFromTqf3Detail = (tqf3Detail = {}) => getResponseList(tqf3Detail, ['clos', 'data.clos']).map((clo, index) => getTqf3CloText(clo) || `CLO${getTqf3CloNumber(clo, index)}`).filter(Boolean)
const buildCloLookupFromTqf3Detail = (tqf3Detail = {}) => { const lookup = new Map(); getResponseList(tqf3Detail, ['clos', 'data.clos']).forEach((clo, index) => { const cloText = getTqf3CloText(clo) || `CLO${getTqf3CloNumber(clo, index)}`; const cloNumber = getTqf3CloNumber(clo, index); if (cloNumber) { lookup.set(cloNumber, cloText); lookup.set(`CLO${cloNumber}`, cloText) } if (cloText) lookup.set(cloText, cloText) }); return lookup }
const getDevelopmentPlanRowsFromTqf3Detail = (tqf3Detail = {}) => { const developmentPlanList = getResponseList(tqf3Detail, ['development_plans', 'developmentPlans', 'developments', 'data.development_plans']); const cloList = getCloListFromTqf3Detail(tqf3Detail); const cloLookup = buildCloLookupFromTqf3Detail(tqf3Detail); if (developmentPlanList.length) return developmentPlanList.map((item, index) => { const rawClo = normalizeText(item?.clo_number ?? item?.cloNumber ?? item?.clo ?? item?.clo_detail ?? item?.cloDetail ?? item?.number ?? ''); return { clo: cloLookup.get(rawClo) || cloLookup.get(`CLO${rawClo}`) || cloList[index] || rawClo || `CLO${index + 1}`, teachStrategy: normalizeText(item?.teaching_strategy ?? item?.teachingStrategy ?? item?.teachStrategy ?? item?.teaching ?? ''), assessStrategy: normalizeText(item?.evaluation_strategy ?? item?.evaluationStrategy ?? item?.assessStrategy ?? item?.assessment_strategy ?? item?.assessmentStrategy ?? '') } }); if (cloList.length) return cloList.map((clo) => ({ clo, teachStrategy: '', assessStrategy: '' })); return initialDev14Rows }
const getInitialPage3Data = (navigationState = {}, savedDraft = {}) => { const statePage3 = navigationState?.mqa3Insert3 || null; const draftPage3 = savedDraft?.mqa3Insert3 || null; const page3Data = statePage3 || draftPage3 || {}; const page3Form = page3Data?.form || page3Data || {}; const page3Rows = Array.isArray(page3Data?.dev14Rows) && page3Data.dev14Rows.length > 0 ? page3Data.dev14Rows : initialDev14Rows; const page2CloList = getCloListFromPage2(navigationState, savedDraft); const mqa3Insert1 = navigationState?.mqa3Insert1 || savedDraft?.mqa3Insert1 || {}; const courseDetail = mqa3Insert1?.courseDetail || {}; const hoursFromPage1 = getHoursFromCourseData({ creditLecture: mqa3Insert1.creditLecture, creditLab: mqa3Insert1.creditLab, creditSelfStudy: mqa3Insert1.creditSelfStudy, creditText: mqa3Insert1.creditText }); const hoursFromCourseDetail = getHoursFromCourseData(courseDetail); return { form: { ...initialFormValue, lectureHours: page3Form.lectureHours || hoursFromPage1.lectureHours || hoursFromCourseDetail.lectureHours || '', practiceHours: page3Form.practiceHours || hoursFromPage1.practiceHours || hoursFromCourseDetail.practiceHours || '', selfStudyHours: page3Form.selfStudyHours || hoursFromPage1.selfStudyHours || hoursFromCourseDetail.selfStudyHours || '', contactChannel: page3Form.contactChannel || '' }, dev14Rows: syncDev14RowsWithCloList(page3Rows, page2CloList) } }
const mapTqf3DetailToPage3Data = (tqf3Detail = {}, navigationState = {}, savedDraft = {}) => { const detail = getResponseObject(tqf3Detail) || {}; const basePage3 = getInitialPage3Data(navigationState, savedDraft); const dbRows = getDevelopmentPlanRowsFromTqf3Detail(detail); return { form: { ...basePage3.form, lectureHours: normalizeHourValue(detail?.lecture_hours ?? detail?.lectureHours ?? detail?.lecture) || basePage3.form.lectureHours || '', practiceHours: normalizeHourValue(detail?.practice_hours ?? detail?.practiceHours ?? detail?.practice) || basePage3.form.practiceHours || '', selfStudyHours: normalizeHourValue(detail?.self_study_hours ?? detail?.selfStudyHours ?? detail?.selfStudy) || basePage3.form.selfStudyHours || '', contactChannel: normalizeText(detail?.contact_detail ?? detail?.contactDetail ?? detail?.contactChannel) || basePage3.form.contactChannel || '' }, dev14Rows: dbRows.length ? dbRows : basePage3.dev14Rows } }

function mqa3Insert3Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const apiUrl = import.meta.env.VITE_API_URL
  const locationState = useMemo(() => location.state || {}, [location.state])
  const draftKey = useMemo(() => getMqa3DraftKey(locationState), [locationState])
  const savedDraft = useMemo(() => readMqa3Draft(draftKey), [draftKey])
  const navigationState = useMemo(() => hasObjectData(locationState) ? locationState : savedDraft?.navigationState || {}, [locationState, savedDraft])
  const initialPage3Data = useMemo(() => getInitialPage3Data(navigationState, savedDraft), [navigationState, savedDraft])
  const page2CloList = useMemo(() => getCloListFromPage2(navigationState, savedDraft), [navigationState, savedDraft])
  const page2CloListKey = useMemo(() => page2CloList.join('|||'), [page2CloList])
  const isCloSyncedFromPage2 = page2CloList.length > 0
  const [form, setForm] = useState(initialPage3Data.form)
  const [contactPopup, setContactPopup] = useState({ open: false, value: '' })
  const [dev14Rows, setDev14Rows] = useState(initialPage3Data.dev14Rows)
  const [dev14Popup, setDev14Popup] = useState({ open: false, rowIndex: null, field: '', title: '', value: '' })

  useEffect(() => { setActiveDraftKey(draftKey) }, [draftKey])

  useEffect(() => {
    let isMounted = true
    const hydratePage3FromExistingTqf3 = async () => {
      const tqf3Id = getTqf3DocumentId(navigationState, savedDraft)
      if (!tqf3Id || !apiUrl) return
      const hasExistingPage3Draft = hasUsefulPage3Data(navigationState?.mqa3Insert3) || hasUsefulPage3Data(savedDraft?.mqa3Insert3)
      if (hasExistingPage3Draft) return
      try {
        const response = await axios.get(`${apiUrl}${TQF3_ENDPOINT}/${tqf3Id}`, getAuthConfig())
        if (!isMounted) return
        const tqf3Detail = getResponseObject(response.data)
        const hydratedPage3 = mapTqf3DetailToPage3Data(tqf3Detail, navigationState, savedDraft)
        const nextNavigationState = { ...(savedDraft?.navigationState || {}), ...navigationState, tqf3Id, mqa3Id: tqf3Id, selectedDocumentId: tqf3Id, mqa3DraftKey: draftKey, mqa3Insert3: hydratedPage3 }
        setForm(hydratedPage3.form)
        setDev14Rows(hydratedPage3.dev14Rows)
        writeMqa3Draft(draftKey, { draftKey, navigationState: nextNavigationState, mqa3Insert3: hydratedPage3 })
      } catch (error) { console.warn('Cannot hydrate MQA3 page 3 from existing TQF3:', error) }
    }
    hydratePage3FromExistingTqf3()
    return () => { isMounted = false }
  }, [apiUrl, draftKey, navigationState, savedDraft])

  useEffect(() => {
    let isMounted = true
    const fetchCourseHours = async () => {
      const courseId = getCourseIdFromNavigation(navigationState, savedDraft)
      if (!courseId || !apiUrl) return
      try {
        const response = await axios.get(`${apiUrl}${COURSE_ENDPOINT}${courseId}`, getAuthConfig())
        if (!isMounted) return
        const courseData = getResponseObject(response.data)
        const courseHours = getHoursFromCourseData(courseData)
        setForm((prev) => ({ ...prev, lectureHours: hasText(prev.lectureHours) ? prev.lectureHours : courseHours.lectureHours, practiceHours: hasText(prev.practiceHours) ? prev.practiceHours : courseHours.practiceHours, selfStudyHours: hasText(prev.selfStudyHours) ? prev.selfStudyHours : courseHours.selfStudyHours }))
      } catch (error) { console.warn('Cannot fetch course hours for MQA3 page 3:', error) }
    }
    fetchCourseHours()
    return () => { isMounted = false }
  }, [apiUrl, navigationState, savedDraft])

  useEffect(() => { const nextCloList = page2CloListKey ? page2CloListKey.split('|||').filter(Boolean) : []; if (nextCloList.length === 0) return; setDev14Rows((prev) => syncDev14RowsWithCloList(prev, nextCloList)) }, [page2CloListKey])
  useEffect(() => { const nextState = { ...navigationState, mqa3DraftKey: draftKey, mqa3Insert3: { form, dev14Rows } }; writeMqa3Draft(draftKey, { draftKey, navigationState: nextState, mqa3Insert3: { form, dev14Rows } }) }, [draftKey, navigationState, form, dev14Rows])

  const isDev14Complete = useMemo(() => dev14Rows.length > 0 && dev14Rows.every((row) => hasText(row.clo) && hasText(row.teachStrategy) && hasText(row.assessStrategy)), [dev14Rows])
  const isPageComplete = useMemo(() => Boolean(hasText(form.lectureHours) && hasText(form.practiceHours) && hasText(form.selfStudyHours) && hasText(form.contactChannel) && isDev14Complete), [form.lectureHours, form.practiceHours, form.selfStudyHours, form.contactChannel, isDev14Complete])
  const openContactPopup = () => setContactPopup({ open: true, value: form.contactChannel })
  const closeContactPopup = () => setContactPopup((prev) => ({ ...prev, open: false }))
  const saveContactPopup = () => { setForm((prev) => ({ ...prev, contactChannel: contactPopup.value })); closeContactPopup() }
  const addDev14Row = () => { if (isCloSyncedFromPage2) return; setDev14Rows((prev) => [...prev, { clo: '', teachStrategy: '', assessStrategy: '' }]) }
  const removeDev14Row = (index) => { if (isCloSyncedFromPage2) return; setDev14Rows((prev) => prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index)) }
  const updateDev14Row = (index, field, value) => setDev14Rows((prev) => { const next = [...prev]; next[index] = { ...next[index], [field]: value }; return next })
  const openDev14Popup = (rowIndex, field, title) => { if (field === 'clo' && isCloSyncedFromPage2) return; setDev14Popup({ open: true, rowIndex, field, title, value: dev14Rows[rowIndex]?.[field] || '' }) }
  const closeDev14Popup = () => setDev14Popup((prev) => ({ ...prev, open: false }))
  const saveDev14Popup = () => { if (dev14Popup.rowIndex === null) return; updateDev14Row(dev14Popup.rowIndex, dev14Popup.field, dev14Popup.value); closeDev14Popup() }
  const handleGoBack = () => { const nextState = { ...navigationState, mqa3DraftKey: draftKey, mqa3Insert3: { form, dev14Rows } }; writeMqa3Draft(draftKey, { draftKey, navigationState: nextState, mqa3Insert3: { form, dev14Rows } }); navigate('/mqa3Insert-2', { state: nextState }) }
  const handleGoNext = () => { if (!isPageComplete) return; const nextState = { ...navigationState, mqa3DraftKey: draftKey, mqa3Insert3: { form, dev14Rows } }; writeMqa3Draft(draftKey, { draftKey, navigationState: nextState, mqa3Insert3: { form, dev14Rows } }); navigate('/mqa3Insert-4', { state: nextState }) }
  const renderDev14Cell = (rowIndex, label, field, rows = 3) => <TextField fullWidth multiline rows={rows} value={dev14Rows[rowIndex]?.[field] || ''} placeholder={field === 'clo' && isCloSyncedFromPage2 ? 'ดึงจากหัวข้อ 12 ในหน้า 2' : 'คลิกเพื่อกรอกข้อมูล'} InputProps={{ readOnly: true }} onClick={() => openDev14Popup(rowIndex, field, label)} size="small" className={styles.popupPreviewField} />

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />
      <Box className={styles.container}>
        <Mqa3FormNav currentStep={3} />
        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>การพัฒนานักศึกษาตามผลลัพธ์การเรียนรู้ที่คาดหวัง</Typography>
              <Typography className={styles.pageDescription}>กรอกข้อมูลตามแบบฟอร์มเดิมของหัวข้อ 13 - 14</Typography>
            </Box>
            <Box className={styles.pageStatus}>
              <Typography className={styles.pageStatusLabel}>สถานะหน้านี้</Typography>
              <Typography className={styles.pageStatusValue}>{isPageComplete ? 'ครบแล้ว' : 'ยังไม่ครบ'}</Typography>
            </Box>
          </Box>

          <Box className={styles.contentFlow}>
            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>13. จำนวนชั่วโมงที่ต้องใช้ต่อสัปดาห์</Typography>
              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">บรรยาย</TableCell>
                      <TableCell align="center">การฝึกปฏิบัติ/งานภาคสนาม/การฝึกงาน</TableCell>
                      <TableCell align="center">การศึกษาด้วยตนเอง</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell><TextField fullWidth type="number" placeholder="ชั่วโมง/สัปดาห์" value={form.lectureHours} onChange={(event) => setForm((prev) => ({ ...prev, lectureHours: event.target.value }))} size="small" InputProps={{ endAdornment: <InputAdornment position="end">ชั่วโมงต่อสัปดาห์</InputAdornment> }} /></TableCell>
                      <TableCell><TextField fullWidth type="number" placeholder="ชั่วโมง/สัปดาห์" value={form.practiceHours} onChange={(event) => setForm((prev) => ({ ...prev, practiceHours: event.target.value }))} size="small" InputProps={{ endAdornment: <InputAdornment position="end">ชั่วโมงต่อสัปดาห์</InputAdornment> }} /></TableCell>
                      <TableCell><TextField fullWidth type="number" placeholder="ชั่วโมง/สัปดาห์" value={form.selfStudyHours} onChange={(event) => setForm((prev) => ({ ...prev, selfStudyHours: event.target.value }))} size="small" InputProps={{ endAdornment: <InputAdornment position="end">ชั่วโมงต่อสัปดาห์</InputAdornment> }} /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.subSectionTitle}>แนวทางและช่องทางการติดต่อกับนักศึกษา</Typography>
              <TextField fullWidth multiline minRows={5} placeholder="คลิกเพื่อกรอกข้อมูล" value={form.contactChannel} InputProps={{ readOnly: true }} onClick={openContactPopup} className={styles.popupPreviewField} />
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>14. การพัฒนานักศึกษาตามผลลัพธ์การเรียนรู้ที่คาดหวัง</Typography>
              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.dev14Table}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="5%" align="center">ลำดับ</TableCell>
                      <TableCell width="30%" align="center">ผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา (CLOs)</TableCell>
                      <TableCell width="32.5%" align="center">กลยุทธ์การสอนตาม CLOs</TableCell>
                      <TableCell width="32.5%" align="center">กลยุทธ์สำหรับการวัดและประเมินผลตาม CLOs</TableCell>
                      <TableCell width="5%" align="center" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dev14Rows.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell align="center">{index + 1}</TableCell>
                        <TableCell>{renderDev14Cell(index, 'ผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา (CLOs)', 'clo', 3)}</TableCell>
                        <TableCell>{renderDev14Cell(index, 'กลยุทธ์การสอนตาม CLOs', 'teachStrategy', 3)}</TableCell>
                        <TableCell>{renderDev14Cell(index, 'กลยุทธ์สำหรับการวัดและประเมินผลตาม CLOs', 'assessStrategy', 3)}</TableCell>
                        <TableCell align="center"><IconButton color="error" onClick={() => removeDev14Row(index)} disabled={isCloSyncedFromPage2 || dev14Rows.length === 1}><DeleteOutlineIcon /></IconButton></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button startIcon={<AddCircleOutlineIcon />} onClick={addDev14Row} className={styles.addButton} disabled={isCloSyncedFromPage2}>เพิ่มแถว</Button>
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button variant="outlined" startIcon={<NavigateBeforeIcon />} className={styles.backButton} onClick={handleGoBack}>ย้อนกลับ</Button>
            <Button variant="contained" endIcon={<NavigateNextIcon />} className={styles.nextButton} onClick={handleGoNext} disabled={!isPageComplete}>ถัดไป</Button>
          </Box>
        </Box>
      </Box>

      <Dialog open={contactPopup.open} onClose={closeContactPopup} maxWidth="md" fullWidth>
        <DialogTitle>แนวทางและช่องทางการติดต่อกับนักศึกษา</DialogTitle>
        <DialogContent><TextField fullWidth multiline minRows={10} value={contactPopup.value} onChange={(event) => setContactPopup((prev) => ({ ...prev, value: event.target.value }))} className={styles.dialogField} /></DialogContent>
        <DialogActions><Button onClick={closeContactPopup}>ยกเลิก</Button><Button variant="contained" onClick={saveContactPopup}>บันทึก</Button></DialogActions>
      </Dialog>

      <Dialog open={dev14Popup.open} onClose={closeDev14Popup} maxWidth="md" fullWidth>
        <DialogTitle>{dev14Popup.title}</DialogTitle>
        <DialogContent><TextField fullWidth multiline minRows={10} value={dev14Popup.value} onChange={(event) => setDev14Popup((prev) => ({ ...prev, value: event.target.value }))} className={styles.dialogField} /></DialogContent>
        <DialogActions><Button onClick={closeDev14Popup}>ยกเลิก</Button><Button variant="contained" onClick={saveDev14Popup}>บันทึก</Button></DialogActions>
      </Dialog>
    </Box>
  )
}

export default mqa3Insert3Page