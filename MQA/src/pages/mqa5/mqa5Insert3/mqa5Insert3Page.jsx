import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import Mqa5FormNav from '../../../components/mqa5/mqa5FormNav'
import styles from './mqa5Insert3Page.module.css'

const MQA5_ACTIVE_DRAFT_KEY = 'mqa5ActiveDraftKey'
const defaultSec13 = { issue131: '', impact131: '', issue132: '', impact132: '' }
const defaultSec141 = { critique: '', teacherComment: '' }
const defaultRow142 = { critique: '', teacherComment: '' }

const normalizeText = (value) => String(value ?? '').trim()
const hasText = (value) => normalizeText(value) !== ''
const safeReadJson = (key) => { try { const rawValue = sessionStorage.getItem(key); return rawValue ? JSON.parse(rawValue) : null } catch { return null } }
const safeWriteJson = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)) } catch (error) { console.warn('Cannot write MQA5 draft:', error) } }
const getActiveDraftKey = () => { try { return sessionStorage.getItem(MQA5_ACTIVE_DRAFT_KEY) || '' } catch { return '' } }
const setActiveDraftKey = (draftKey) => { try { sessionStorage.setItem(MQA5_ACTIVE_DRAFT_KEY, draftKey) } catch (error) { console.warn('Cannot set active MQA5 draft key:', error) } }

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
const normalizeRows142 = (rows = []) => Array.isArray(rows) && rows.length ? rows.map((row) => ({ ...defaultRow142, ...row })) : [{ ...defaultRow142 }]

function Mqa5Insert3Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = useMemo(() => location.state || {}, [location.state])
  const draftKey = useMemo(() => getMqa5DraftKey(locationState), [locationState])
  const savedDraft = useMemo(() => safeReadJson(draftKey), [draftKey])
  const navigationState = useMemo(() => Object.keys(locationState).length ? locationState : savedDraft?.navigationState || {}, [locationState, savedDraft])
  const tqf3ReferenceId = useMemo(() => getTqf3ReferenceId(navigationState, savedDraft), [navigationState, savedDraft])
  const tqf5DocumentId = useMemo(() => getTqf5DocumentId(navigationState, savedDraft), [navigationState, savedDraft])
  const savedPageData = savedDraft?.mqa5Insert3 || navigationState?.mqa5Insert3 || null

  const [sec13, setSec13] = useState(() => ({ ...defaultSec13, ...(savedPageData?.sec13 || {}) }))
  const [sec141, setSec141] = useState(() => ({ ...defaultSec141, ...(savedPageData?.sec141 || {}) }))
  const [rows142, setRows142] = useState(() => normalizeRows142(savedPageData?.rows142))
  const [popup, setPopup] = useState({ open: false, title: '', value: '', mode: '', field: '', rowIndex: null, rowField: '' })

  const isPageComplete = useMemo(() => {
    const sec13Complete = hasText(sec13.issue131) && hasText(sec13.impact131) && hasText(sec13.issue132) && hasText(sec13.impact132)
    const sec141Complete = hasText(sec141.critique) && hasText(sec141.teacherComment)
    const rows142Complete = rows142.length > 0 && rows142.every((row) => hasText(row.critique) && hasText(row.teacherComment))
    return sec13Complete && sec141Complete && rows142Complete
  }, [sec13, sec141, rows142])

  const buildNextState = () => ({ ...navigationState, mqa5DraftKey: draftKey, referenceTqf3Id: tqf3ReferenceId, sourceTqf3Id: tqf3ReferenceId, tqf3Id: tqf3ReferenceId, mqa3Id: tqf3ReferenceId, tqf5Id: tqf5DocumentId, mqa5Id: tqf5DocumentId, mqa5Insert3: { sec13, sec141, rows142 } })

  useEffect(() => {
    const nextState = buildNextState()
    writeMqa5Draft(draftKey, { draftKey, navigationState: nextState, referenceTqf3Id: tqf3ReferenceId, sourceTqf3Id: tqf3ReferenceId, tqf3Id: tqf3ReferenceId, mqa3Id: tqf3ReferenceId, tqf5Id: tqf5DocumentId, mqa5Id: tqf5DocumentId, mqa5Insert3: { sec13, sec141, rows142 } })
  }, [draftKey, navigationState, rows142, sec13, sec141, tqf3ReferenceId, tqf5DocumentId])

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
    if (!isPageComplete) return
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
            <Button variant="contained" endIcon={<NavigateNextIcon />} className={styles.nextButton} onClick={handleNext} disabled={!isPageComplete}>ถัดไป</Button>
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