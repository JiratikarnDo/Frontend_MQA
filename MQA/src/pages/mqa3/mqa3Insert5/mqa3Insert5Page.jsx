import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import Mqa3FormNav from '../../../components/mqa3/mqa3FormNav'
import styles from './mqa3Insert5Page.module.css'

const MQA3_ACTIVE_DRAFT_KEY = 'mqa3ActiveDraftKey'
const TQF3_ENDPOINT = '/tqf3/'
const initialRows16 = [{ clo: '', activities: '', weeks: '', percent: '' }]
const initialExam16 = { label: 'คะแนนสอบกลางภาคและปลายภาค (รวมทุก CLO)', items: [{ name: 'สอบกลางภาค', week: '9', percent: '20' }, { name: 'สอบปลายภาค', week: '17', percent: '30' }] }
const normalizeText = (value) => String(value ?? '').trim()
const hasObjectData = (value) => Boolean(value && typeof value === 'object' && Object.keys(value).length > 0)
const hasText = (value) => normalizeText(value) !== ''
const getAuthConfig = () => { const token = localStorage.getItem('mqa_token'); return { headers: token ? { Authorization: `Bearer ${token}` } : {} } }
const getApiUrl = (apiUrl, path) => `${String(apiUrl || '').replace(/\/$/, '')}${path}`
const safeReadJson = (key) => { try { const rawValue = sessionStorage.getItem(key); return rawValue ? JSON.parse(rawValue) : null } catch (error) { return null } }
const safeWriteJson = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)) } catch (error) { console.warn('Cannot write MQA3 draft to sessionStorage:', error) } }
const getActiveDraftKey = () => { try { return sessionStorage.getItem(MQA3_ACTIVE_DRAFT_KEY) || '' } catch (error) { return '' } }
const setActiveDraftKey = (draftKey) => { try { sessionStorage.setItem(MQA3_ACTIVE_DRAFT_KEY, draftKey) } catch (error) { console.warn('Cannot set active MQA3 draft key:', error) } }
const getMqa3DraftKey = (state = {}) => { const courseItem = state?.courseItem ?? {}; const keySource = state?.mqa3DraftKey || state?.openingCourseItemId || state?.requestedCourseItemId || state?.courseId || state?.courseCode || courseItem?.openingCourseItemId || courseItem?.requestedCourseItemId || courseItem?.courseId || courseItem?.courseCode || ''; if (keySource) return String(keySource).startsWith('mqa3Draft:') ? String(keySource) : `mqa3Draft:${keySource}`; return getActiveDraftKey() || 'mqa3Draft:new' }
const readMqa3Draft = (draftKey) => safeReadJson(draftKey)
const writeMqa3Draft = (draftKey, nextDraft) => { const currentDraft = readMqa3Draft(draftKey) || {}; const mergedDraft = { ...currentDraft, ...nextDraft, updatedAt: new Date().toISOString() }; safeWriteJson(draftKey, mergedDraft); setActiveDraftKey(draftKey); return mergedDraft }
const getErrorMessage = (error, fallbackMessage) => { const detail = error?.response?.data?.detail; const message = error?.response?.data?.message; if (Array.isArray(detail)) return detail.map((item) => item.msg || item.message || JSON.stringify(item)).join(', '); return detail || message || fallbackMessage }
const toNumberOrNull = (value) => { const text = normalizeText(value); if (!text) return null; if (!/^\d+(\.\d+)?$/.test(text)) return null; return Number(text) }
const toIntegerOrNull = (value) => { const numberValue = toNumberOrNull(value); return numberValue === null ? null : Math.trunc(numberValue) }
const getCurrentDateString = () => { const now = new Date(); const year = now.getFullYear(); const month = String(now.getMonth() + 1).padStart(2, '0'); const day = String(now.getDate()).padStart(2, '0'); return `${year}-${month}-${day}` }
const normalizeList = (value) => Array.isArray(value) ? value.map((item) => normalizeText(item)).filter(Boolean) : normalizeText(value).split('\n').map((item) => normalizeText(item)).filter(Boolean)
const normalizeCloList = (value) => normalizeList(value)
const getCloListFromPage2 = (navigationState = {}, savedDraft = {}) => normalizeCloList(navigationState?.mqa3Insert2?.cloList ?? navigationState?.mqa3Insert2?.clo ?? savedDraft?.mqa3Insert2?.cloList ?? savedDraft?.mqa3Insert2?.clo ?? [])
const syncRows16WithCloList = (currentRows = [], cloList = []) => { const safeRows = Array.isArray(currentRows) && currentRows.length > 0 ? currentRows : initialRows16; const cleanCloList = normalizeCloList(cloList); if (cleanCloList.length === 0) return safeRows; const rowMapByClo = new Map(); safeRows.forEach((row) => { const rowClo = normalizeText(row?.clo); if (rowClo && !rowMapByClo.has(rowClo)) rowMapByClo.set(rowClo, row) }); return cleanCloList.map((clo, index) => { const matchedRow = rowMapByClo.get(clo) || safeRows[index] || {}; return { clo, activities: matchedRow.activities || '', weeks: matchedRow.weeks || '', percent: matchedRow.percent || '' } }) }
const listToText = (items = []) => normalizeList(items).join('\n')
const sumPercent = (values) => values.reduce((total, item) => total + (Number.parseFloat(item) || 0), 0)
const getResponseList = (data, keyList = []) => { if (Array.isArray(data)) return data; if (Array.isArray(data?.data)) return data.data; if (Array.isArray(data?.items)) return data.items; if (Array.isArray(data?.results)) return data.results; for (const key of keyList) if (Array.isArray(data?.[key])) return data[key]; return [] }
const normalizeDocumentStatus = (value) => { const text = normalizeText(value).toLowerCase().replace(/[\s_-]/g, ''); if (!text) return 'notStarted'; if (['submitted', 'submit', 'sent', 'approved', 'pending', 'pendingapproval', 'waitingapproval'].includes(text)) return 'submitted'; if (['draft', 'savedraft'].includes(text)) return 'draft'; if (['rejected', 'reject'].includes(text)) return 'rejected'; return text }
const getCourseIdForPayload = (navigationState = {}, savedDraft = {}) => { const courseItem = navigationState?.courseItem || savedDraft?.navigationState?.courseItem || {}; const page1 = navigationState?.mqa3Insert1 || savedDraft?.mqa3Insert1 || {}; return toIntegerOrNull(navigationState?.courseId || navigationState?.course_id || courseItem?.courseId || courseItem?.course_id || courseItem?.rawData?.course_id || courseItem?.rawData?.courseId || page1?.courseId || page1?.course_id || page1?.courseDetail?.id || page1?.courseDetail?.course_id || page1?.courseDetail?.courseId) }
const getAcademicYearFromText = (value, navigationState = {}) => { const text = normalizeText(value); const fromNavigation = navigationState?.academicYear || navigationState?.academic_year || navigationState?.courseItem?.academicYear || navigationState?.courseItem?.academic_year; if (fromNavigation) return toIntegerOrNull(fromNavigation); const matchSlash = text.match(/\/\s*(\d{4})/); if (matchSlash) return toIntegerOrNull(matchSlash[1]); const matchYear = text.match(/(25\d{2}|20\d{2})/); return matchYear ? toIntegerOrNull(matchYear[1]) : null }
const getSemesterForPayload = (value) => { const text = normalizeText(value); if (!text) return ''; const match = text.match(/(\d)\s*\/\s*(\d{4})/); if (match) return `${match[1]}/${match[2]}`; return text }
const getCloNumberFromText = (value, fallbackIndex) => { const match = normalizeText(value).match(/CLO\s*0*(\d+)/i); if (match) return Number(match[1]); return fallbackIndex + 1 }
const getPageData = (navigationState = {}, savedDraft = {}) => ({ page1: navigationState?.mqa3Insert1 || savedDraft?.mqa3Insert1 || {}, page2: navigationState?.mqa3Insert2 || savedDraft?.mqa3Insert2 || {}, page3: navigationState?.mqa3Insert3 || savedDraft?.mqa3Insert3 || {}, page4: navigationState?.mqa3Insert4 || savedDraft?.mqa3Insert4 || {} })
const buildTqf3Payload = ({ navigationState, savedDraft, rows16, exam16, agreements17, integration18, books19, websites19 }) => {
  const { page1, page2, page3, page4 } = getPageData(navigationState, savedDraft)
  const page3Form = page3?.form || {}
  const dev14Rows = Array.isArray(page3?.dev14Rows) ? page3.dev14Rows : []
  const plan15Rows = Array.isArray(page4?.plan15Rows) ? page4.plan15Rows : []
  const cleanTeachers = normalizeList(page1?.teachers || page1?.teacher || navigationState?.courseItem?.assignedTeacher || navigationState?.courseItem?.assignedTeachers)
  const cleanCloList = normalizeList(page2?.cloList || page2?.clo)
  const lessonPlans = plan15Rows.map((row) => row?.type === 'exam' ? { week: toIntegerOrNull(row.week), topic: normalizeText(row.examText), clos: '', hours: null, activities_media: '', instructor_name: '' } : { week: toIntegerOrNull(row.week), topic: normalizeText(row.topic), clos: normalizeText(row.clos), hours: toNumberOrNull(row.hours), activities_media: normalizeText(row.activities), instructor_name: normalizeText(row.teacher) }).filter((row) => hasText(row.topic) || row.week !== null)
  const evaluationRows = rows16.map((row) => ({ activity: normalizeText(row.activities), clo_number: normalizeText(row.clo), evaluation_week: normalizeText(row.weeks), proportion_percent: toNumberOrNull(row.percent) })).filter((row) => hasText(row.activity) || hasText(row.clo_number) || hasText(row.evaluation_week) || row.proportion_percent !== null)
  const examRows = exam16.items.map((item) => ({ activity: normalizeText(item.name), clo_number: normalizeText(exam16.label), evaluation_week: normalizeText(item.week), proportion_percent: toNumberOrNull(item.percent) })).filter((row) => hasText(row.activity) || hasText(row.evaluation_week) || row.proportion_percent !== null)
  return { course_id: getCourseIdForPayload(navigationState, savedDraft), curriculum_name: normalizeText(page1.curriculumMajor), course_category: normalizeText(page1.courseType), semester: getSemesterForPayload(page1.semester), academic_year: getAcademicYearFromText(page1.semester, navigationState), year_level: normalizeText(page1.yearLevel), section_group: normalizeText(page1.sectionNumber), student_count: toIntegerOrNull(page1.studentCount), location: normalizeText(page1.learningPlace), pre_requisite: normalizeText(page2.prerequisite), co_requisite: normalizeText(page2.corequisite), updated_at: normalizeText(page2.updateDate) || getCurrentDateString(), course_description: normalizeText(page2.descriptionThai), objectives: normalizeText(page2.developmentObjective), plo_mapping: normalizeText(page2.plo), lecture_hours: toNumberOrNull(page3Form.lectureHours), practice_hours: toNumberOrNull(page3Form.practiceHours), self_study_hours: toNumberOrNull(page3Form.selfStudyHours), contact_detail: normalizeText(page3Form.contactChannel), agreements: listToText(agreements17), integration_detail: listToText(integration18), main_textbooks: listToText(books19), references: listToText(websites19), instructors: cleanTeachers.map((name) => ({ name })), clos: cleanCloList.map((detail, index) => ({ number: index + 1, detail })), development_plans: dev14Rows.map((row, index) => ({ clo_number: getCloNumberFromText(row.clo, index), teaching_strategy: normalizeText(row.teachStrategy), evaluation_strategy: normalizeText(row.assessStrategy) })).filter((row) => row.clo_number || hasText(row.teaching_strategy) || hasText(row.evaluation_strategy)), lesson_plans: lessonPlans, evaluation_plans: [...evaluationRows, ...examRows] }
}
const getInitialPage5Data = (navigationState = {}, savedDraft = {}, page2CloList = []) => { const page5 = navigationState?.mqa3Insert5 || savedDraft?.mqa3Insert5 || {}; const page5Rows16 = Array.isArray(page5.rows16) && page5.rows16.length ? page5.rows16 : initialRows16; return { rows16: syncRows16WithCloList(page5Rows16, page2CloList), exam16: page5.exam16 || initialExam16, agreements17: Array.isArray(page5.agreements17) && page5.agreements17.length ? page5.agreements17 : [''], integration18: Array.isArray(page5.integration18) && page5.integration18.length ? page5.integration18 : [''], books19: Array.isArray(page5.books19) && page5.books19.length ? page5.books19 : [''], websites19: Array.isArray(page5.websites19) && page5.websites19.length ? page5.websites19 : [''] } }
const getExistingTqf3IdFromSource = (navigationState = {}, savedDraft = {}) => normalizeText(navigationState?.tqf3Id || navigationState?.tqf3_id || navigationState?.mqa3Id || navigationState?.mqa3_id || navigationState?.courseItem?.tqf3Id || navigationState?.courseItem?.tqf3_id || navigationState?.courseItem?.mqa3Id || navigationState?.courseItem?.mqa3_id || navigationState?.courseItem?.tqf3?.id || navigationState?.courseItem?.mqa3?.id || savedDraft?.tqf3Id || savedDraft?.tqf3_id || savedDraft?.mqa3Id || savedDraft?.mqa3_id || savedDraft?.navigationState?.tqf3Id || savedDraft?.navigationState?.tqf3_id || savedDraft?.navigationState?.mqa3Id || savedDraft?.navigationState?.mqa3_id || savedDraft?.navigationState?.courseItem?.tqf3Id || savedDraft?.navigationState?.courseItem?.tqf3_id || savedDraft?.navigationState?.courseItem?.mqa3Id || savedDraft?.navigationState?.courseItem?.mqa3_id || savedDraft?.navigationState?.courseItem?.tqf3?.id || savedDraft?.navigationState?.courseItem?.mqa3?.id || '')
const normalizeTqf3DocumentRow = (row = {}, index = 0) => ({ id: normalizeText(row?.id || row?.tqf3_id || row?.tqf3Id || ''), courseId: normalizeText(row?.course_id || row?.courseId || row?.course?.id || ''), semester: normalizeText(row?.semester || row?.term || ''), academicYear: normalizeText(row?.academic_year || row?.academicYear || row?.year || ''), sectionGroup: normalizeText(row?.section_group || row?.sectionGroup || row?.section_number || row?.sectionNumber || row?.group_no || row?.groupNo || ''), status: normalizeDocumentStatus(row?.status || row?.document_status || row?.documentStatus), sortId: Number(row?.id || row?.tqf3_id || row?.tqf3Id || index) || index })
const isSameValueIfBothExist = (firstValue, secondValue) => { const firstText = normalizeText(firstValue); const secondText = normalizeText(secondValue); if (!firstText || !secondText) return true; return firstText === secondText }
const isSameTqf3Document = (payload, documentRow) => { if (!payload?.course_id || !documentRow?.courseId) return false; if (normalizeText(payload.course_id) !== normalizeText(documentRow.courseId)) return false; if (!isSameValueIfBothExist(payload.semester, documentRow.semester)) return false; if (!isSameValueIfBothExist(payload.academic_year, documentRow.academicYear)) return false; if (!isSameValueIfBothExist(payload.section_group, documentRow.sectionGroup)) return false; return true }
const findExistingTqf3Document = async (apiUrl, payload) => {
  try {
    const response = await axios.get(getApiUrl(apiUrl, TQF3_ENDPOINT), getAuthConfig())
    const documentRows = getResponseList(response.data, ['items', 'data', 'results', 'tqf3', 'documents']).map((item, index) => normalizeTqf3DocumentRow(item, index))
    const matchedRows = documentRows.filter((documentRow) => isSameTqf3Document(payload, documentRow)).sort((a, b) => { if (a.status === 'draft' && b.status !== 'draft') return -1; if (a.status !== 'draft' && b.status === 'draft') return 1; return b.sortId - a.sortId })
    return matchedRows[0] || null
  } catch (error) {
    console.warn('Cannot check existing TQF3 document:', error)
    return null
  }
}

function mqa3Insert5Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const apiUrl = import.meta.env.VITE_API_URL
  const locationState = useMemo(() => location.state || {}, [location.state])
  const draftKey = useMemo(() => getMqa3DraftKey(locationState), [locationState])
  const savedDraft = useMemo(() => readMqa3Draft(draftKey), [draftKey])
  const navigationState = useMemo(() => hasObjectData(locationState) ? locationState : savedDraft?.navigationState || {}, [locationState, savedDraft])
  const page2CloList = useMemo(() => getCloListFromPage2(navigationState, savedDraft), [navigationState, savedDraft])
  const page2CloListKey = useMemo(() => page2CloList.join('|||'), [page2CloList])
  const isCloSyncedFromPage2 = page2CloList.length > 0
  const initialPage5Data = useMemo(() => getInitialPage5Data(navigationState, savedDraft, page2CloList), [navigationState, savedDraft, page2CloList])

  const [rows16, setRows16] = useState(initialPage5Data.rows16)
  const [exam16, setExam16] = useState(initialPage5Data.exam16)
  const [agreements17, setAgreements17] = useState(initialPage5Data.agreements17)
  const [integration18, setIntegration18] = useState(initialPage5Data.integration18)
  const [books19, setBooks19] = useState(initialPage5Data.books19)
  const [websites19, setWebsites19] = useState(initialPage5Data.websites19)
  const [isSaving, setIsSaving] = useState(false)
  const [popup, setPopup] = useState({ open: false, title: '', value: '', onSave: null })

  const cloTotal = sumPercent(rows16.map((row) => row.percent))
  const examTotal = sumPercent(exam16.items.map((item) => item.percent))
  const total = Math.round((cloTotal + examTotal) * 100) / 100
  const totalColor = total === 100 ? 'text.primary' : 'error.main'
  const isRows16Complete = useMemo(() => rows16.length > 0 && rows16.every((row) => hasText(row.clo) && hasText(row.activities) && hasText(row.weeks) && hasText(row.percent)), [rows16])
  const isExam16Complete = useMemo(() => hasText(exam16.label) && exam16.items.length > 0 && exam16.items.every((item) => hasText(item.name) && hasText(item.week) && hasText(item.percent)), [exam16])
  const isListComplete = (items) => items.length > 0 && items.every((item) => hasText(item))
  const isPageComplete = useMemo(() => isRows16Complete && isExam16Complete && isListComplete(agreements17) && isListComplete(integration18) && isListComplete(books19) && isListComplete(websites19) && total === 100, [isRows16Complete, isExam16Complete, agreements17, integration18, books19, websites19, total])

  useEffect(() => { const nextCloList = page2CloListKey ? page2CloListKey.split('|||').filter(Boolean) : []; if (nextCloList.length === 0) return; setRows16((prev) => syncRows16WithCloList(prev, nextCloList)) }, [page2CloListKey])
  useEffect(() => { const nextState = { ...navigationState, mqa3DraftKey: draftKey, mqa3Insert5: { rows16, exam16, agreements17, integration18, books19, websites19 } }; writeMqa3Draft(draftKey, { draftKey, navigationState: nextState, mqa3Insert5: { rows16, exam16, agreements17, integration18, books19, websites19 } }) }, [draftKey, navigationState, rows16, exam16, agreements17, integration18, books19, websites19])

  const openPopup = (title, value, onSave) => setPopup({ open: true, title, value, onSave })
  const closePopup = () => setPopup((prev) => ({ ...prev, open: false }))
  const savePopup = () => { popup.onSave?.(popup.value); closePopup() }
  const renderROCell = (value, title, onSave, rows = 3, locked = false) => <TextField fullWidth multiline rows={rows} value={value} placeholder={locked ? 'ดึงจากหัวข้อ 12 ในหน้า 2' : 'คลิกเพื่อกรอกข้อมูล'} InputProps={{ readOnly: true }} onClick={locked ? undefined : () => openPopup(title, value, onSave)} size="small" className={styles.popupPreviewField} />
  const addRow16 = () => { if (isCloSyncedFromPage2) return; setRows16((prev) => [...prev, { clo: '', activities: '', weeks: '', percent: '' }]) }
  const removeRow16 = (index) => { if (isCloSyncedFromPage2) return; setRows16((prev) => prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index)) }
  const updateRow16 = (index, field, value) => setRows16((prev) => { const next = [...prev]; next[index] = { ...next[index], [field]: value }; return next })
  const addExamItem16 = () => setExam16((prev) => ({ ...prev, items: [...prev.items, { name: 'สอบ...', week: '', percent: '' }] }))
  const removeExamItem16 = (index) => setExam16((prev) => prev.items.length === 1 ? prev : { ...prev, items: prev.items.filter((_, itemIndex) => itemIndex !== index) })
  const updateExamItem16 = (index, field, value) => setExam16((prev) => { const nextItems = [...prev.items]; nextItems[index] = { ...nextItems[index], [field]: value }; return { ...prev, items: nextItems } })
  const updateListItem = (setter, index, value) => setter((prev) => { const next = [...prev]; next[index] = value; return next })
  const addListItem = (setter) => setter((prev) => [...prev, ''])
  const removeListItem = (setter, index, minItems = 1) => setter((prev) => prev.length <= minItems ? prev : prev.filter((_, itemIndex) => itemIndex !== index))
  const handleGoBack = () => { const nextState = { ...navigationState, mqa3DraftKey: draftKey, mqa3Insert5: { rows16, exam16, agreements17, integration18, books19, websites19 } }; writeMqa3Draft(draftKey, { draftKey, navigationState: nextState, mqa3Insert5: { rows16, exam16, agreements17, integration18, books19, websites19 } }); navigate('/mqa3Insert-4', { state: nextState }) }
  const handleSaveDocument = async () => {
    if (!isPageComplete || isSaving) return
    const latestDraft = writeMqa3Draft(draftKey, { draftKey, navigationState: { ...navigationState, mqa3DraftKey: draftKey, mqa3Insert5: { rows16, exam16, agreements17, integration18, books19, websites19 } }, mqa3Insert5: { rows16, exam16, agreements17, integration18, books19, websites19 } })
    const payload = buildTqf3Payload({ navigationState: latestDraft.navigationState || navigationState, savedDraft: latestDraft, rows16, exam16, agreements17, integration18, books19, websites19 })
    if (!payload.course_id) { window.alert('ไม่พบรหัสรายวิชา ไม่สามารถบันทึกเอกสาร มคอ.3 ได้ กรุณากลับไปเลือกหรือกรอกข้อมูลรายวิชาใหม่'); return }
    try {
      setIsSaving(true)
      let targetTqf3Id = getExistingTqf3IdFromSource(latestDraft.navigationState || navigationState, latestDraft)
      let existingDocument = null
      if (!targetTqf3Id) { existingDocument = await findExistingTqf3Document(apiUrl, payload); targetTqf3Id = existingDocument?.id || '' }
      if (existingDocument && existingDocument.status !== 'draft') { window.alert('เอกสาร มคอ.3 นี้ถูกส่งเข้าระบบแล้ว ไม่สามารถบันทึกทับแบบร่างได้'); return }
      if (targetTqf3Id) {
        await axios.put(getApiUrl(apiUrl, `/tqf3/${targetTqf3Id}`), payload, getAuthConfig())
        writeMqa3Draft(draftKey, { ...latestDraft, tqf3Id: targetTqf3Id, isSavedToDatabase: true, mqa3Insert5: { rows16, exam16, agreements17, integration18, books19, websites19 } })
        window.alert('อัปเดตเอกสาร มคอ.3 แบบร่างเรียบร้อยแล้ว')
      } else {
        const response = await axios.post(getApiUrl(apiUrl, TQF3_ENDPOINT), payload, getAuthConfig())
        const newTqf3Id = response.data?.id || response.data?.data?.id || response.data?.tqf3_id || response.data?.tqf3Id || ''
        writeMqa3Draft(draftKey, { ...latestDraft, tqf3Id: newTqf3Id, isSavedToDatabase: true, mqa3Insert5: { rows16, exam16, agreements17, integration18, books19, websites19 } })
        window.alert('บันทึกเอกสาร มคอ.3 แบบร่างเรียบร้อยแล้ว')
      }
      navigate('/mqaOverview')
    } catch (error) {
      console.error('Error saving TQF3 draft:', error)
      window.alert(getErrorMessage(error, 'ไม่สามารถบันทึกเอกสาร มคอ.3 ได้ กรุณาลองใหม่อีกครั้ง'))
    } finally {
      setIsSaving(false)
    }
  }

  const NumberedListEditor = ({ title, items, setItems, minItems = 1, addLabel = 'เพิ่มข้อ', placeholder = 'คลิกเพื่อกรอกข้อมูล' }) => (
    <Box className={styles.numberedListBlock}>
      <Typography className={styles.subSectionTitle}>{title}</Typography>
      {items.map((text, index) => (
        <Box key={index} className={styles.listRow}>
          <Typography className={styles.listIndex}>{index + 1}.</Typography>
          <TextField fullWidth multiline rows={1} value={text} placeholder={placeholder} InputProps={{ readOnly: true }} onClick={() => openPopup(`${title} (ข้อ ${index + 1})`, text, (value) => updateListItem(setItems, index, value))} size="small" className={styles.popupPreviewField} />
          <IconButton color="error" onClick={() => removeListItem(setItems, index, minItems)} disabled={items.length <= minItems} className={styles.listDeleteButton}><DeleteOutlineIcon /></IconButton>
        </Box>
      ))}
      <Button startIcon={<AddCircleOutlineIcon />} onClick={() => addListItem(setItems)} className={styles.addButton}>{addLabel}</Button>
    </Box>
  )

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />
      <Box className={styles.container}>
        <Mqa3FormNav currentStep={5} />
        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>การประเมินผล</Typography>
              <Typography className={styles.pageDescription}>กรอกข้อมูลตามแบบฟอร์มเดิมของหัวข้อ 16 - 19</Typography>
            </Box>
            <Box className={styles.pageStatus}>
              <Typography className={styles.pageStatusLabel}>สถานะหน้านี้</Typography>
              <Typography className={styles.pageStatusValue}>{isPageComplete ? 'ครบแล้ว' : 'ยังไม่ครบ'}</Typography>
            </Box>
          </Box>

          <Box className={styles.contentFlow}>
            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>16. แผนการประเมินผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา</Typography>
              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.assessmentTable}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="30%" align="center">ผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา (CLOs)</TableCell>
                      <TableCell width="35%" align="center">กิจกรรมการประเมินผลการเรียนรู้ของผู้เรียน</TableCell>
                      <TableCell width="20%" align="center">กำหนดการประเมิน (สัปดาห์ที่)</TableCell>
                      <TableCell width="10%" align="center">สัดส่วนของการประเมินผล (%)</TableCell>
                      <TableCell width="5%" align="center" />
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows16.map((row, index) => (
                      <TableRow key={`clo-${index}`} hover>
                        <TableCell>{renderROCell(row.clo, 'ผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา (CLOs)', (value) => updateRow16(index, 'clo', value), 3, isCloSyncedFromPage2)}</TableCell>
                        <TableCell>{renderROCell(row.activities, 'กิจกรรมการประเมินผลการเรียนรู้ของผู้เรียน', (value) => updateRow16(index, 'activities', value), 3)}</TableCell>
                        <TableCell><TextField fullWidth size="small" multiline rows={2} placeholder="เช่น 1-2, 15" value={row.weeks} onChange={(event) => updateRow16(index, 'weeks', event.target.value)} className={styles.fixedTextField} /></TableCell>
                        <TableCell><TextField fullWidth size="small" type="number" placeholder="0" value={row.percent} onChange={(event) => updateRow16(index, 'percent', event.target.value)} inputProps={{ min: 0 }} /></TableCell>
                        <TableCell align="center"><IconButton color="error" onClick={() => removeRow16(index)} disabled={isCloSyncedFromPage2 || rows16.length === 1}><DeleteOutlineIcon /></IconButton></TableCell>
                      </TableRow>
                    ))}

                    {exam16.items.map((item, index) => (
                      <TableRow key={`exam-${index}`} hover>
                        {index === 0 && <TableCell rowSpan={exam16.items.length} className={styles.examLabelCell}>{renderROCell(exam16.label, 'หัวข้อสรุปท้ายตาราง', (value) => setExam16((prev) => ({ ...prev, label: value })), 3)}</TableCell>}
                        <TableCell><Box className={styles.examNameWrap}><Typography className={styles.examBullet}>■</Typography><TextField fullWidth size="small" placeholder="ชื่อรายการ (เช่น สอบกลางภาค)" value={item.name} onChange={(event) => updateExamItem16(index, 'name', event.target.value)} /></Box></TableCell>
                        <TableCell><TextField fullWidth size="small" placeholder="สัปดาห์ที่ (เช่น 9)" value={item.week} onChange={(event) => updateExamItem16(index, 'week', event.target.value)} /></TableCell>
                        <TableCell><TextField fullWidth size="small" type="number" placeholder="0" value={item.percent} onChange={(event) => updateExamItem16(index, 'percent', event.target.value)} inputProps={{ min: 0 }} /></TableCell>
                        <TableCell align="center"><IconButton color="error" onClick={() => removeExamItem16(index)} disabled={exam16.items.length === 1}><DeleteOutlineIcon /></IconButton></TableCell>
                      </TableRow>
                    ))}

                    <TableRow>
                      <TableCell colSpan={3} align="center"><Typography fontWeight="bold">รวม</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight="bold" sx={{ color: totalColor }}>{total}</Typography></TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box className={styles.addButtonRow}>
                <Button startIcon={<AddCircleOutlineIcon />} onClick={addRow16} className={styles.addButton} disabled={isCloSyncedFromPage2}>เพิ่มรายการ CLO</Button>
                <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={addExamItem16} className={styles.addButton}>เพิ่มรายการสอบ (ท้ายตาราง)</Button>
              </Box>
            </Box>

            <Divider className={styles.divider} />
            <NumberedListEditor title="17. ข้อตกลงร่วมกันระหว่างผู้เรียนและผู้สอน" items={agreements17} setItems={setAgreements17} minItems={1} addLabel="เพิ่มข้อ" placeholder="คลิกเพื่อกรอกข้อมูล" />
            <Divider className={styles.divider} />
            <NumberedListEditor title="18. แผนการบูรณาการระหว่างรายวิชา" items={integration18} setItems={setIntegration18} minItems={1} addLabel="เพิ่มข้อ" placeholder="คลิกเพื่อกรอกข้อมูล" />
            <Divider className={styles.divider} />

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>19. ตำราและเอกสารที่ใช้ประกอบการเรียนการสอน</Typography>
              <NumberedListEditor title="หนังสือและเอกสารประกอบการสอน" items={books19} setItems={setBooks19} minItems={1} addLabel="เพิ่มรายการหนังสือ/เอกสาร" placeholder="คลิกเพื่อกรอกข้อมูล" />
              <Divider className={styles.divider} />
              <NumberedListEditor title="เว็บไซต์และแหล่งข้อมูลออนไลน์" items={websites19} setItems={setWebsites19} minItems={1} addLabel="เพิ่มรายการเว็บไซต์/แหล่งข้อมูล" placeholder="คลิกเพื่อกรอกข้อมูล" />
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button variant="outlined" startIcon={<NavigateBeforeIcon />} className={styles.backButton} onClick={handleGoBack} disabled={isSaving}>ย้อนกลับ</Button>
            <Button variant="contained" endIcon={<NavigateNextIcon />} className={styles.nextButton} onClick={handleSaveDocument} disabled={!isPageComplete || isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึกเอกสาร'}</Button>
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

export default mqa3Insert5Page