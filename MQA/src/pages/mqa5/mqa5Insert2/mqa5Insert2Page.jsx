import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import Mqa5FormNav from '../../../components/mqa5/mqa5FormNav'
import styles from './mqa5Insert2Page.module.css'

const MQA5_ACTIVE_DRAFT_KEY = 'mqa5ActiveDraftKey'

const gradeRows = [
  { grade: 'A', range: '80->>' },
  { grade: 'B+', range: '75-79.99' },
  { grade: 'B', range: '70-74.99' },
  { grade: 'C+', range: '65-69.99' },
  { grade: 'C', range: '60-64.99' },
  { grade: 'D+', range: '55-59.99' },
  { grade: 'D', range: '50-54.99' },
  { grade: 'F', range: '49-49.99' },
  { grade: 'I', range: '-' },
]

const defaultForm = { prereq: '-', coreq: '-', updateDate: '', actualHoursDeviation: '', missingTopics: '', registered: '', remained: '', withdrewW: '', abnormalReason: 'ไม่มี' }
const defaultRow11 = { clo: '', teach: '', operationMethod: '', assess: '', outcome: '', improve: '' }
const defaultRow126 = { deviation: '-', reason: '-' }

const normalizeText = (value) => String(value ?? '').trim()
const hasText = (value) => normalizeText(value) !== ''
const getApiUrl = (apiUrl, path) => `${String(apiUrl || '').replace(/\/$/, '')}${path}`
const getAuthConfig = () => { const token = localStorage.getItem('mqa_token'); return { headers: token ? { Authorization: `Bearer ${token}` } : {} } }
const safeReadJson = (key) => { try { const rawValue = sessionStorage.getItem(key); return rawValue ? JSON.parse(rawValue) : null } catch { return null } }
const safeWriteJson = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)) } catch (error) { console.warn('Cannot write MQA5 draft:', error) } }
const getActiveDraftKey = () => { try { return sessionStorage.getItem(MQA5_ACTIVE_DRAFT_KEY) || '' } catch { return '' } }
const setActiveDraftKey = (draftKey) => { try { sessionStorage.setItem(MQA5_ACTIVE_DRAFT_KEY, draftKey) } catch (error) { console.warn('Cannot set active MQA5 draft key:', error) } }
const getResponseObject = (data) => { if (Array.isArray(data)) return data[0] || null; if (data?.data && typeof data.data === 'object') return data.data; if (data?.item && typeof data.item === 'object') return data.item; if (data?.result && typeof data.result === 'object') return data.result; return data }
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

const getTqf3ReferenceId = (state = {}, savedDraft = {}) => normalizeText(state?.referenceTqf3Id || state?.sourceTqf3Id || state?.tqf3Id || state?.mqa3Id || state?.courseItem?.referenceTqf3Id || state?.courseItem?.sourceTqf3Id || state?.courseItem?.tqf3Id || state?.courseItem?.mqa3Id || savedDraft?.referenceTqf3Id || savedDraft?.sourceTqf3Id || savedDraft?.tqf3Id || savedDraft?.mqa3Id || '')
const getTqf5DocumentId = (state = {}, savedDraft = {}) => normalizeText(state?.tqf5Id || state?.mqa5Id || state?.selectedDocumentId || state?.courseItem?.tqf5Id || state?.courseItem?.mqa5Id || savedDraft?.tqf5Id || savedDraft?.mqa5Id || '')
const normalizeCloNumber = (value) => normalizeText(value).replace(/^CLO/i, '').trim()

const buildFormFromTqf3 = (tqf3Data = {}) => ({
  prereq: normalizeText(tqf3Data.pre_requisite || tqf3Data.preRequisite) || '-',
  coreq: normalizeText(tqf3Data.co_requisite || tqf3Data.coRequisite) || '-',
})

const findDevelopmentPlanByClo = (developmentPlans, cloNumber) => {
  const normalizedCloNumber = normalizeCloNumber(cloNumber)
  return developmentPlans.find((dev) => normalizeCloNumber(dev.clo_number || dev.cloNumber || dev.number) === normalizedCloNumber) || null
}

const getTeachingStrategyText = (developmentPlan) => normalizeText(developmentPlan?.teaching_strategy || developmentPlan?.teachingStrategy || developmentPlan?.learning_strategy || developmentPlan?.learningStrategy || developmentPlan?.strategy || '')

const buildRows11FromTqf3 = (tqf3Data = {}) => {
  const clos = Array.isArray(tqf3Data.clos) ? tqf3Data.clos : []
  const developmentPlans = Array.isArray(tqf3Data.development_plans) ? tqf3Data.development_plans : Array.isArray(tqf3Data.developmentPlans) ? tqf3Data.developmentPlans : []

  if (clos.length) {
    return clos.map((clo) => {
      const cloNumber = normalizeCloNumber(clo.number || clo.clo_number || clo.cloNumber)
      const cloDetail = normalizeText(clo.detail || clo.description || clo.clo_detail || clo.cloDetail)
      const matchedDevelopment = findDevelopmentPlanByClo(developmentPlans, cloNumber)
      const teachingStrategy = getTeachingStrategyText(matchedDevelopment)
      return { clo: cloNumber ? `CLO${cloNumber}${cloDetail ? ` ${cloDetail}` : ''}` : cloDetail, teach: teachingStrategy, operationMethod: teachingStrategy, assess: '', outcome: '', improve: '' }
    })
  }

  if (developmentPlans.length) {
    return developmentPlans.map((dev) => {
      const cloNumber = normalizeCloNumber(dev.clo_number || dev.cloNumber || dev.number)
      const teachingStrategy = getTeachingStrategyText(dev)
      return { clo: cloNumber ? `CLO${cloNumber}` : '', teach: teachingStrategy, operationMethod: teachingStrategy, assess: '', outcome: '', improve: '' }
    })
  }

  return [{ ...defaultRow11 }]
}

const mergeMissingFormValues = (currentForm, nextForm) => {
  const mergedForm = { ...currentForm }
  Object.keys(nextForm).forEach((key) => { if (!hasText(mergedForm[key])) mergedForm[key] = nextForm[key] })
  return mergedForm
}

const normalizeRows11ForCurrentVersion = (rows = []) => {
  if (!Array.isArray(rows) || !rows.length) return [{ ...defaultRow11 }]
  return rows.map((row) => ({ ...defaultRow11, ...row, operationMethod: hasText(row.operationMethod) ? row.operationMethod : normalizeText(row.teach) }))
}

function Mqa5Insert2Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const apiUrl = import.meta.env.VITE_API_URL
  const locationState = useMemo(() => location.state || {}, [location.state])
  const draftKey = useMemo(() => getMqa5DraftKey(locationState), [locationState])
  const savedDraft = useMemo(() => safeReadJson(draftKey), [draftKey])
  const navigationState = useMemo(() => Object.keys(locationState).length ? locationState : savedDraft?.navigationState || {}, [locationState, savedDraft])
  const tqf3ReferenceId = useMemo(() => getTqf3ReferenceId(navigationState, savedDraft), [navigationState, savedDraft])
  const tqf5DocumentId = useMemo(() => getTqf5DocumentId(navigationState, savedDraft), [navigationState, savedDraft])
  const savedPageData = savedDraft?.mqa5Insert2 || navigationState?.mqa5Insert2 || null

  const [form, setForm] = useState(savedPageData?.form || defaultForm)
  const [rows11, setRows11] = useState(() => normalizeRows11ForCurrentVersion(savedPageData?.rows11 || [{ ...defaultRow11 }]))
  const [rows126, setRows126] = useState(savedPageData?.rows126?.length ? savedPageData.rows126 : [{ ...defaultRow126 }])
  const [gradeCounts, setGradeCounts] = useState(() => savedPageData?.gradeCounts || Object.fromEntries(gradeRows.map((item) => [item.grade, ''])))
  const [isLoadingTqf3, setIsLoadingTqf3] = useState(false)
  const [tqf3ErrorMessage, setTqf3ErrorMessage] = useState('')
  const [popup, setPopup] = useState({ open: false, field: '', title: '', value: '', rowIndex: null, rowField: '', mode: 'form' })

  useEffect(() => {
    if (!tqf3ReferenceId) { setTqf3ErrorMessage('ไม่พบรหัสอ้างอิง มคอ.3 กรุณากลับไปเลือกเอกสารจากหน้ารายวิชาที่ได้รับมอบหมายใหม่อีกครั้ง'); return }
    let isMounted = true
    const fetchTqf3Reference = async () => {
      setIsLoadingTqf3(true)
      setTqf3ErrorMessage('')
      try {
        const response = await axios.get(getApiUrl(apiUrl, `/tqf3/${tqf3ReferenceId}`), getAuthConfig())
        const tqf3Data = getResponseObject(response.data) || {}
        const nextFormFromTqf3 = buildFormFromTqf3(tqf3Data)
        const nextRows11FromTqf3 = buildRows11FromTqf3(tqf3Data)
        if (!isMounted) return
        if (savedPageData?.form) { setForm((prev) => mergeMissingFormValues(prev, nextFormFromTqf3)) } else { setForm((prev) => ({ ...prev, ...nextFormFromTqf3 })) }
        if (!savedPageData?.rows11?.length) setRows11(nextRows11FromTqf3)
      } catch (error) {
        if (!isMounted) return
        console.error('Error fetching TQF3 reference for MQA5 page 2:', error)
        setTqf3ErrorMessage(getErrorMessage(error, 'ไม่สามารถดึงข้อมูลจาก มคอ.3 ได้ กรุณาลองใหม่อีกครั้ง'))
      } finally {
        if (isMounted) setIsLoadingTqf3(false)
      }
    }
    fetchTqf3Reference()
    return () => { isMounted = false }
  }, [apiUrl, savedPageData?.form, savedPageData?.rows11?.length, tqf3ReferenceId])

  useEffect(() => {
    const nextState = { ...navigationState, mqa5DraftKey: draftKey, referenceTqf3Id: tqf3ReferenceId, sourceTqf3Id: tqf3ReferenceId, tqf3Id: tqf3ReferenceId, mqa3Id: tqf3ReferenceId, tqf5Id: tqf5DocumentId, mqa5Id: tqf5DocumentId, mqa5Insert2: { form, rows11, rows126, gradeCounts } }
    writeMqa5Draft(draftKey, { draftKey, navigationState: nextState, referenceTqf3Id: tqf3ReferenceId, sourceTqf3Id: tqf3ReferenceId, tqf3Id: tqf3ReferenceId, mqa3Id: tqf3ReferenceId, tqf5Id: tqf5DocumentId, mqa5Id: tqf5DocumentId, mqa5Insert2: { form, rows11, rows126, gradeCounts } })
  }, [draftKey, form, gradeCounts, navigationState, rows11, rows126, tqf3ReferenceId, tqf5DocumentId])

  const openPopupForForm = (field, title) => setPopup({ open: true, field, title, value: form[field] || '', rowIndex: null, rowField: '', mode: 'form' })
  const openPopupForRow11 = (rowIndex, rowField, title) => setPopup({ open: true, field: '', title, value: rows11[rowIndex]?.[rowField] || '', rowIndex, rowField, mode: 'row11' })
  const openPopupForRow126 = (rowIndex, rowField, title) => setPopup({ open: true, field: '', title, value: rows126[rowIndex]?.[rowField] || '', rowIndex, rowField, mode: 'row126' })
  const closePopup = () => setPopup((prev) => ({ ...prev, open: false }))

  const savePopup = () => {
    if (popup.mode === 'form') setForm((prev) => ({ ...prev, [popup.field]: popup.value }))
    if (popup.mode === 'row11') setRows11((prev) => { const next = [...prev]; next[popup.rowIndex] = { ...next[popup.rowIndex], [popup.rowField]: popup.value }; return next })
    if (popup.mode === 'row126') setRows126((prev) => { const next = [...prev]; next[popup.rowIndex] = { ...next[popup.rowIndex], [popup.rowField]: popup.value }; return next })
    closePopup()
  }

  const renderPopupField = (label, field, minRows = 5, extraClassName = '') => (
    <TextField fullWidth multiline minRows={minRows} maxRows={minRows} value={form[field]} placeholder="คลิกเพื่อกรอกข้อมูล" InputProps={{ readOnly: true }} onClick={() => openPopupForForm(field, label)} className={`${styles.popupPreviewField} ${extraClassName}`} />
  )

  const renderRow11Field = (rowIndex, rowField, label, minRows = 3) => (
    <TextField fullWidth multiline minRows={minRows} maxRows={minRows} value={rows11[rowIndex]?.[rowField] || ''} placeholder="คลิกเพื่อกรอกข้อมูล" InputProps={{ readOnly: true }} onClick={() => openPopupForRow11(rowIndex, rowField, label)} className={styles.compactPreviewField} />
  )

  const renderRow126Field = (rowIndex, rowField, label, minRows = 2) => (
    <TextField fullWidth multiline minRows={minRows} maxRows={minRows} value={rows126[rowIndex]?.[rowField] || ''} placeholder="คลิกเพื่อกรอกข้อมูล" InputProps={{ readOnly: true }} onClick={() => openPopupForRow126(rowIndex, rowField, label)} className={styles.compactPreviewField} />
  )

  const addRow11 = () => setRows11((prev) => [...prev, { ...defaultRow11 }])
  const removeRow11 = (index) => setRows11((prev) => prev.length === 1 ? prev : prev.filter((_, i) => i !== index))
  const addRow126 = () => setRows126((prev) => [...prev, { ...defaultRow126 }])
  const removeRow126 = (index) => setRows126((prev) => prev.length === 1 ? prev : prev.filter((_, i) => i !== index))

  const totalGrades = useMemo(() => gradeRows.reduce((sum, item) => sum + (Number.parseFloat(gradeCounts[item.grade]) || 0), 0), [gradeCounts])
  const getGradePercent = (grade) => { const currentValue = Number.parseFloat(gradeCounts[grade]) || 0; if (!totalGrades) return '0.00'; return ((currentValue / totalGrades) * 100).toFixed(2) }

  const isPageComplete = useMemo(() => {
    const formComplete = hasText(form.prereq) && hasText(form.coreq) && hasText(form.updateDate) && hasText(form.actualHoursDeviation) && hasText(form.missingTopics) && hasText(form.registered) && hasText(form.remained) && hasText(form.withdrewW) && hasText(form.abnormalReason)
    const rows11Complete = rows11.length > 0 && rows11.every((row) => hasText(row.clo) && hasText(row.teach) && hasText(row.operationMethod) && hasText(row.assess) && hasText(row.outcome) && hasText(row.improve))
    const rows126Complete = rows126.length > 0 && rows126.every((row) => hasText(row.deviation) && hasText(row.reason))
    const gradesComplete = gradeRows.every((item) => hasText(gradeCounts[item.grade]))
    return formComplete && rows11Complete && rows126Complete && gradesComplete
  }, [form, gradeCounts, rows11, rows126])

  const buildNextState = () => ({ ...navigationState, mqa5DraftKey: draftKey, referenceTqf3Id: tqf3ReferenceId, sourceTqf3Id: tqf3ReferenceId, tqf3Id: tqf3ReferenceId, mqa3Id: tqf3ReferenceId, tqf5Id: tqf5DocumentId, mqa5Id: tqf5DocumentId, mqa5Insert2: { form, rows11, rows126, gradeCounts } })

  const handleBack = () => {
    const nextState = buildNextState()
    writeMqa5Draft(draftKey, { draftKey, navigationState: nextState, mqa5Insert2: { form, rows11, rows126, gradeCounts } })
    navigate('/mqa5Insert-1', { state: nextState })
  }

  const handleNext = () => {
    if (!isPageComplete || isLoadingTqf3 || Boolean(tqf3ErrorMessage)) return
    const nextState = buildNextState()
    writeMqa5Draft(draftKey, { draftKey, navigationState: nextState, mqa5Insert2: { form, rows11, rows126, gradeCounts } })
    navigate('/mqa5Insert-3', { state: nextState })
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Mqa5FormNav currentStep={2} />

        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>รายวิชาที่ต้องเรียนมาก่อน</Typography>
              <Typography className={styles.pageDescription}>กรอกข้อมูลตามแบบฟอร์มเดิมของหัวข้อ 7 - 12 สำหรับแบบฟอร์ม มคอ.5</Typography>
            </Box>
            <Box className={styles.pageStatus}>
              <Typography className={styles.pageStatusLabel}>สถานะหน้านี้</Typography>
              <Typography className={styles.pageStatusValue}>{isPageComplete ? 'ครบแล้ว' : 'ยังไม่ครบ'}</Typography>
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

          <Box className={styles.contentFlow}>
            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>7. รายวิชาที่ต้องเรียนมาก่อน (Pre-requisite) และรายวิชาที่ต้องเรียนพร้อมกัน (Co-requisite) (ถ้ามี)</Typography>
              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.fixedWideTable}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="45%">ประเภทของรายวิชา</TableCell>
                      <TableCell width="55%">ชื่อรายวิชา</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell className={styles.labelCell}>รายวิชาที่ต้องเรียนมาก่อน (Pre-requisite)</TableCell>
                      <TableCell>{renderPopupField('7. รายวิชาที่ต้องเรียนมาก่อน (Pre-requisite)', 'prereq', 3)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className={styles.labelCell}>รายวิชาที่ต้องเรียนพร้อมกัน (Co-requisite)</TableCell>
                      <TableCell>{renderPopupField('7. รายวิชาที่ต้องเรียนพร้อมกัน (Co-requisite)', 'coreq', 3)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography className={styles.noteText}>** หากไม่มีรายวิชาที่ต้องเรียนมาก่อน/เรียนพร้อมกัน ให้ใส่เครื่องหมาย "-"</Typography>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>8. วันที่จัดทำหรือปรับปรุงผลการดำเนินการของรายวิชาครั้งล่าสุด</Typography>
              <Box className={styles.dateFieldRow}>
                <TextField type="date" value={form.updateDate} onChange={(event) => setForm((prev) => ({ ...prev, updateDate: event.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
              </Box>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>9. รายงานชั่วโมงการสอนจริงที่คาดเคลื่อนจากแผนการสอน (ถ้ามี)</Typography>
              {renderPopupField('9. รายงานชั่วโมงการสอนจริงที่คาดเคลื่อนจากแผนการสอน (ถ้ามี)', 'actualHoursDeviation', 5, styles.largePreviewField)}
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>10. หัวข้อที่สอนไม่ครอบคลุมตามแผน (ถ้ามี)</Typography>
              {renderPopupField('10. หัวข้อที่สอนไม่ครอบคลุมตามแผน (ถ้ามี)', 'missingTopics', 5, styles.largePreviewField)}
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>11. ประสิทธิผลของวิธีการจัดการเรียนรู้และวิธีการประเมินผลที่ดำเนินการเพื่อให้เกิดผลลัพธ์การเรียนรู้ตามที่ระบุในรายละเอียดของรายวิชา</Typography>
              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.effectivenessTable}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="14%">CLOs</TableCell>
                      <TableCell width="18%">กลยุทธ์การสอน/การจัดการเรียนรู้</TableCell>
                      <TableCell width="18%">วิธีการดำเนินผล</TableCell>
                      <TableCell width="14%">วิธีการประเมินผล</TableCell>
                      <TableCell width="14%">ผลที่เกิดกับนักศึกษา</TableCell>
                      <TableCell width="14%">แนวทางพัฒนา/ปรับปรุง</TableCell>
                      <TableCell width="8%" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows11.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{renderRow11Field(index, 'clo', `11. CLOs (รายการที่ ${index + 1})`, 3)}</TableCell>
                        <TableCell>{renderRow11Field(index, 'teach', `11. กลยุทธ์การสอน/การจัดการเรียนรู้ (รายการที่ ${index + 1})`, 3)}</TableCell>
                        <TableCell>{renderRow11Field(index, 'operationMethod', `11. วิธีการดำเนินผล (รายการที่ ${index + 1})`, 3)}</TableCell>
                        <TableCell>{renderRow11Field(index, 'assess', `11. วิธีการประเมินผล (รายการที่ ${index + 1})`, 3)}</TableCell>
                        <TableCell>{renderRow11Field(index, 'outcome', `11. ผลที่เกิดกับนักศึกษา (รายการที่ ${index + 1})`, 3)}</TableCell>
                        <TableCell>{renderRow11Field(index, 'improve', `11. แนวทางพัฒนา/ปรับปรุง (รายการที่ ${index + 1})`, 3)}</TableCell>
                        <TableCell className={styles.actionCell}>
                          <IconButton color="error" onClick={() => removeRow11(index)} disabled={rows11.length === 1} className={styles.deleteButton}><DeleteOutlineIcon /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button startIcon={<AddCircleOutlineIcon />} variant="outlined" onClick={addRow11} className={styles.addButton}>เพิ่มแถว (CLO)</Button>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>12. สรุปผลการจัดการเรียนการสอนของรายวิชา</Typography>
              <Box className={styles.summaryGrid}>
                <TextField label="12.1 จำนวนนักศึกษาที่ลงทะเบียนเรียน" value={form.registered} onChange={(event) => setForm((prev) => ({ ...prev, registered: event.target.value }))} type="number" fullWidth />
                <TextField label="12.2 จำนวนนักศึกษาที่คงอยู่สิ้นสุดภาคการศึกษา" value={form.remained} onChange={(event) => setForm((prev) => ({ ...prev, remained: event.target.value }))} type="number" fullWidth />
                <TextField label="12.3 จำนวนนักศึกษาที่ถอน (W)" value={form.withdrewW} onChange={(event) => setForm((prev) => ({ ...prev, withdrewW: event.target.value }))} type="number" fullWidth />
              </Box>

              <Box className={styles.subSectionBlock}>
                <Typography className={styles.subSectionTitle}>12.4 การกระจายของระดับคะแนน (เกรด)</Typography>
                <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                  <Table size="small" className={styles.gradeTable}>
                    <TableHead>
                      <TableRow>
                        <TableCell width="18%">ระดับคะแนน</TableCell>
                        <TableCell width="28%">ช่วงระดับคะแนน</TableCell>
                        <TableCell width="27%">รวม (คน)</TableCell>
                        <TableCell width="27%">%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gradeRows.map((item) => (
                        <TableRow key={item.grade}>
                          <TableCell className={styles.centerCell}>{item.grade}</TableCell>
                          <TableCell className={styles.centerCell}>{item.range}</TableCell>
                          <TableCell className={styles.centerCell}>
                            <TextField size="small" type="number" value={gradeCounts[item.grade]} onChange={(event) => setGradeCounts((prev) => ({ ...prev, [item.grade]: event.target.value }))} className={styles.gradeInput} />
                          </TableCell>
                          <TableCell className={styles.centerCell}>{getGradePercent(item.grade)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Box className={styles.subSectionBlock}>
                <Typography className={styles.subSectionTitle}>12.5 ปัจจัยที่ทำให้ระดับคะแนนผิดปกติ (ถ้ามี)</Typography>
                {renderPopupField('12.5 ปัจจัยที่ทำให้ระดับคะแนนผิดปกติ (ถ้ามี)', 'abnormalReason', 4)}
              </Box>

              <Box className={styles.subSectionBlock}>
                <Typography className={styles.subSectionTitle}>12.6 ความคลาดเคลื่อนจากแผนการประเมินฯ (ถ้ามี)</Typography>
                <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                  <Table size="small" className={styles.fixedWideTable}>
                    <TableHead>
                      <TableRow>
                        <TableCell width="45%">ความคลาดเคลื่อน</TableCell>
                        <TableCell width="45%">เหตุผล</TableCell>
                        <TableCell width="10%" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows126.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{renderRow126Field(index, 'deviation', `12.6 ความคลาดเคลื่อน (รายการที่ ${index + 1})`, 2)}</TableCell>
                          <TableCell>{renderRow126Field(index, 'reason', `12.6 เหตุผล (รายการที่ ${index + 1})`, 2)}</TableCell>
                          <TableCell className={styles.actionCell}>
                            <IconButton color="error" onClick={() => removeRow126(index)} disabled={rows126.length === 1} className={styles.deleteButton}><DeleteOutlineIcon /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button startIcon={<AddCircleOutlineIcon />} variant="outlined" onClick={addRow126} className={styles.addButton}>เพิ่มแถว (12.6)</Button>
              </Box>
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button variant="outlined" startIcon={<NavigateBeforeIcon />} className={styles.backButton} onClick={handleBack}>ย้อนกลับ</Button>
            <Button variant="contained" endIcon={<NavigateNextIcon />} className={styles.nextButton} onClick={handleNext} disabled={!isPageComplete || isLoadingTqf3 || Boolean(tqf3ErrorMessage)}>ถัดไป</Button>
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
          <Button variant="contained" onClick={savePopup}>บันทึก</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Mqa5Insert2Page