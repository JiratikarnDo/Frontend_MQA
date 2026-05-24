import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import Mqa3FormNav from '../../../components/mqa3/mqa3FormNav'
import styles from './mqa3Insert4Page.module.css'

const MQA3_ACTIVE_DRAFT_KEY = 'mqa3ActiveDraftKey'
const createPlan15Row = (type = 'normal', teacherText = '') => ({ type, week: '', topic: '', clos: '', hours: '', activities: '', teacher: type === 'normal' ? teacherText : '', examText: type === 'exam' ? 'สอบปลายภาค' : '' })
const initialPlan15Rows = [createPlan15Row()]
const normalizeText = (value) => String(value ?? '').trim()
const hasObjectData = (value) => Boolean(value && typeof value === 'object' && Object.keys(value).length > 0)
const hasText = (value) => normalizeText(value) !== ''
const safeReadJson = (key) => { try { const rawValue = sessionStorage.getItem(key); return rawValue ? JSON.parse(rawValue) : null } catch (error) { return null } }
const safeWriteJson = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)) } catch (error) { console.warn('Cannot write MQA3 draft to sessionStorage:', error) } }
const getActiveDraftKey = () => { try { return sessionStorage.getItem(MQA3_ACTIVE_DRAFT_KEY) || '' } catch (error) { return '' } }
const setActiveDraftKey = (draftKey) => { try { sessionStorage.setItem(MQA3_ACTIVE_DRAFT_KEY, draftKey) } catch (error) { console.warn('Cannot set active MQA3 draft key:', error) } }
const getMqa3DraftKey = (state = {}) => { const courseItem = state?.courseItem ?? {}; const keySource = state?.mqa3DraftKey || state?.openingCourseItemId || state?.requestedCourseItemId || state?.courseId || state?.courseCode || courseItem?.openingCourseItemId || courseItem?.requestedCourseItemId || courseItem?.courseId || courseItem?.courseCode || ''; if (keySource) return String(keySource).startsWith('mqa3Draft:') ? String(keySource) : `mqa3Draft:${keySource}`; return getActiveDraftKey() || 'mqa3Draft:new' }
const readMqa3Draft = (draftKey) => safeReadJson(draftKey)
const writeMqa3Draft = (draftKey, nextDraft) => { const currentDraft = readMqa3Draft(draftKey) || {}; const mergedDraft = { ...currentDraft, ...nextDraft, updatedAt: new Date().toISOString() }; safeWriteJson(draftKey, mergedDraft); setActiveDraftKey(draftKey) }
const uniqueTextList = (list = []) => Array.from(new Set(list.map((item) => normalizeText(item)).filter(Boolean)))
const getTeacherFullName = (item) => { if (typeof item === 'string') return normalizeText(item); const directName = normalizeText(item?.teacher_name ?? item?.teacherName ?? item?.full_name ?? item?.fullName ?? item?.name); if (directName) return directName; return normalizeText([item?.prefixname ?? item?.prefix_name ?? item?.prefixName, item?.first_name ?? item?.firstName ?? item?.firstname, item?.last_name ?? item?.lastName ?? item?.lastname].filter(Boolean).join(' ')) }
const normalizeTeacherNameList = (value) => { if (!value) return []; if (typeof value === 'string') return value.split(/[\n,]/).map((item) => normalizeText(item)).filter(Boolean); if (Array.isArray(value)) return value.map((item) => getTeacherFullName(item)).filter(Boolean); if (typeof value === 'object') return [getTeacherFullName(value)].filter(Boolean); return [] }
const getTeacherNamesFromSource = (source = {}) => uniqueTextList([source?.assignedTeachers, source?.assigned_teacher_names, source?.assignedTeacherNames, source?.assignedTeacherList, source?.assigned_teachers, source?.assignedTeachersRaw, source?.teachers, source?.teacherList, source?.teacher_list, source?.instructors, source?.instructorList, source?.rawData?.assignedTeachers, source?.rawData?.assigned_teachers, source?.rawData?.assignedTeacherList, source?.rawData?.teacherList, source?.rawData?.teachers, source?.rawData?.instructors].flatMap((value) => normalizeTeacherNameList(value)))
const getAssignedTeacherText = (navigationState = {}, savedDraft = {}) => { const savedNavigationState = savedDraft?.navigationState || {}; const mqa3Insert1 = navigationState?.mqa3Insert1 || savedDraft?.mqa3Insert1 || savedNavigationState?.mqa3Insert1 || {}; const sourceList = [navigationState?.courseItem, savedNavigationState?.courseItem, navigationState?.assignedCourse, savedNavigationState?.assignedCourse, navigationState?.requestedCourseItem, savedNavigationState?.requestedCourseItem, navigationState?.course, savedNavigationState?.course, navigationState?.selectedCourse, savedNavigationState?.selectedCourse, mqa3Insert1, mqa3Insert1?.form, mqa3Insert1?.courseItem, mqa3Insert1?.courseDetail]; const teacherNames = uniqueTextList(sourceList.flatMap((source) => getTeacherNamesFromSource(source || {}))); return teacherNames.join('\n') }
const normalizePlan15Rows = (rows = [], teacherText = '') => { const safeRows = Array.isArray(rows) && rows.length > 0 ? rows : initialPlan15Rows; return safeRows.map((row) => { const type = row?.type === 'exam' ? 'exam' : 'normal'; return { ...createPlan15Row(type, teacherText), ...row, type, teacher: type === 'normal' ? (hasText(row?.teacher) ? row.teacher : teacherText) : (row?.teacher || '') } }) }
const getInitialPage4Data = (navigationState = {}, savedDraft = {}, teacherText = '') => { const statePage4 = navigationState?.mqa3Insert4 || null; const draftPage4 = savedDraft?.mqa3Insert4 || null; const page4Data = statePage4 || draftPage4 || {}; const page4Rows = Array.isArray(page4Data?.plan15Rows) ? page4Data.plan15Rows : Array.isArray(page4Data) ? page4Data : initialPlan15Rows; return { plan15Rows: normalizePlan15Rows(page4Rows, teacherText) } }

function mqa3Insert4Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = useMemo(() => location.state || {}, [location.state])
  const draftKey = useMemo(() => getMqa3DraftKey(locationState), [locationState])
  const savedDraft = useMemo(() => readMqa3Draft(draftKey), [draftKey])
  const navigationState = useMemo(() => hasObjectData(locationState) ? locationState : savedDraft?.navigationState || {}, [locationState, savedDraft])
  const assignedTeacherText = useMemo(() => getAssignedTeacherText(navigationState, savedDraft), [navigationState, savedDraft])
  const initialPage4Data = useMemo(() => getInitialPage4Data(navigationState, savedDraft, assignedTeacherText), [navigationState, savedDraft, assignedTeacherText])
  const [plan15Rows, setPlan15Rows] = useState(initialPage4Data.plan15Rows)
  const [plan15Popup, setPlan15Popup] = useState({ open: false, rowIndex: null, field: '', title: '', value: '' })

  useEffect(() => { if (!assignedTeacherText) return; setPlan15Rows((prev) => prev.map((row) => row.type === 'normal' && !hasText(row.teacher) ? { ...row, teacher: assignedTeacherText } : row)) }, [assignedTeacherText])
  useEffect(() => { const nextState = { ...navigationState, mqa3DraftKey: draftKey, mqa3Insert4: { plan15Rows } }; writeMqa3Draft(draftKey, { draftKey, navigationState: nextState, mqa3Insert4: { plan15Rows } }) }, [draftKey, navigationState, plan15Rows])

  const isPlan15Complete = useMemo(() => plan15Rows.length > 0 && plan15Rows.every((row) => row.type === 'exam' ? hasText(row.week) && hasText(row.examText) : hasText(row.week) && hasText(row.topic) && hasText(row.clos) && hasText(row.hours) && hasText(row.activities) && hasText(row.teacher)), [plan15Rows])
  const isPageComplete = isPlan15Complete
  const addPlan15Row = () => setPlan15Rows((prev) => [...prev, createPlan15Row('normal', assignedTeacherText)])
  const addExamRow = () => setPlan15Rows((prev) => [...prev, createPlan15Row('exam')])
  const removePlan15Row = (index) => setPlan15Rows((prev) => prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index))
  const updatePlan15Row = (index, field, value) => setPlan15Rows((prev) => { const next = [...prev]; next[index] = { ...next[index], [field]: value }; return next })
  const openPlan15Popup = (rowIndex, field, title) => setPlan15Popup({ open: true, rowIndex, field, title, value: plan15Rows[rowIndex]?.[field] || '' })
  const closePlan15Popup = () => setPlan15Popup((prev) => ({ ...prev, open: false }))
  const savePlan15Popup = () => { if (plan15Popup.rowIndex === null) return; updatePlan15Row(plan15Popup.rowIndex, plan15Popup.field, plan15Popup.value); closePlan15Popup() }
  const handleGoBack = () => { const nextState = { ...navigationState, mqa3DraftKey: draftKey, mqa3Insert4: { plan15Rows } }; writeMqa3Draft(draftKey, { draftKey, navigationState: nextState, mqa3Insert4: { plan15Rows } }); navigate('/mqa3Insert-3', { state: nextState }) }
  const handleGoNext = () => { if (!isPageComplete) return; const nextState = { ...navigationState, mqa3DraftKey: draftKey, mqa3Insert4: { plan15Rows } }; writeMqa3Draft(draftKey, { draftKey, navigationState: nextState, mqa3Insert4: { plan15Rows } }); navigate('/mqa3Insert-5', { state: nextState }) }
  const renderPlan15Cell = (rowIndex, label, field, rows = 2) => <TextField fullWidth multiline rows={rows} value={plan15Rows[rowIndex]?.[field] || ''} placeholder={field === 'teacher' && assignedTeacherText ? 'ดึงจากอาจารย์ที่ได้รับมอบหมาย' : 'คลิกเพื่อกรอกข้อมูล'} InputProps={{ readOnly: true }} onClick={() => openPlan15Popup(rowIndex, field, label)} size="small" className={styles.popupPreviewField} />
  const renderExamMergedCell = (rowIndex) => <Box onClick={() => openPlan15Popup(rowIndex, 'examText', 'ข้อความแถวสอบ')} className={styles.examMergedCell}><Typography className={styles.examMergedText} color={plan15Rows[rowIndex]?.examText ? 'text.primary' : 'text.secondary'}>{plan15Rows[rowIndex]?.examText || 'คลิกเพื่อกรอก (เช่น สอบปลายภาค)'}</Typography></Box>

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />
      <Box className={styles.container}>
        <Mqa3FormNav currentStep={4} />
        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>แผนการสอน</Typography>
              <Typography className={styles.pageDescription}>กรอกข้อมูลตามแบบฟอร์มเดิมของหัวข้อ 15</Typography>
            </Box>
            <Box className={styles.pageStatus}>
              <Typography className={styles.pageStatusLabel}>สถานะหน้านี้</Typography>
              <Typography className={styles.pageStatusValue}>{isPageComplete ? 'ครบแล้ว' : 'ยังไม่ครบ'}</Typography>
            </Box>
          </Box>

          <Box className={styles.contentFlow}>
            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>15. แผนการสอน</Typography>
              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.planTable}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="8%" align="center">สัปดาห์ที่</TableCell>
                      <TableCell width="24%" align="center">หัวข้อ/รายละเอียด</TableCell>
                      <TableCell width="20%" align="center">CLOs</TableCell>
                      <TableCell width="8%" align="center">จำนวนชั่วโมง</TableCell>
                      <TableCell width="20%" align="center">กิจกรรมการเรียนการสอน/สื่อที่ใช้</TableCell>
                      <TableCell width="15%" align="center">ผู้สอน</TableCell>
                      <TableCell width="5%" align="center" />
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {plan15Rows.map((row, index) => {
                      if (row.type === 'exam') {
                        return (
                          <TableRow key={index} hover>
                            <TableCell><TextField fullWidth size="small" placeholder="เช่น 7 หรือ 8-9" value={row.week} onChange={(event) => updatePlan15Row(index, 'week', event.target.value)} /></TableCell>
                            <TableCell colSpan={5} align="center">{renderExamMergedCell(index)}</TableCell>
                            <TableCell align="center"><IconButton color="error" onClick={() => removePlan15Row(index)} disabled={plan15Rows.length === 1}><DeleteOutlineIcon /></IconButton></TableCell>
                          </TableRow>
                        )
                      }

                      return (
                        <TableRow key={index} hover>
                          <TableCell><TextField fullWidth size="small" placeholder="เช่น 1-6" value={row.week} onChange={(event) => updatePlan15Row(index, 'week', event.target.value)} /></TableCell>
                          <TableCell>{renderPlan15Cell(index, 'หัวข้อ/รายละเอียด', 'topic', 3)}</TableCell>
                          <TableCell>{renderPlan15Cell(index, 'CLOs', 'clos', 3)}</TableCell>
                          <TableCell><TextField fullWidth size="small" placeholder="เช่น 3 หรือ 3-4" value={row.hours} onChange={(event) => updatePlan15Row(index, 'hours', event.target.value)} /></TableCell>
                          <TableCell>{renderPlan15Cell(index, 'กิจกรรมการเรียนการสอน/สื่อที่ใช้', 'activities', 3)}</TableCell>
                          <TableCell>{renderPlan15Cell(index, 'ผู้สอน', 'teacher', 3)}</TableCell>
                          <TableCell align="center"><IconButton color="error" onClick={() => removePlan15Row(index)} disabled={plan15Rows.length === 1}><DeleteOutlineIcon /></IconButton></TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box className={styles.addButtonRow}>
                <Button startIcon={<AddCircleOutlineIcon />} onClick={addPlan15Row} className={styles.addButton}>เพิ่มแถวสอน</Button>
                <Button startIcon={<AddCircleOutlineIcon />} variant="outlined" onClick={addExamRow} className={styles.addButton}>เพิ่มแถวสอบ</Button>
              </Box>
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button variant="outlined" startIcon={<NavigateBeforeIcon />} className={styles.backButton} onClick={handleGoBack}>ย้อนกลับ</Button>
            <Button variant="contained" endIcon={<NavigateNextIcon />} className={styles.nextButton} onClick={handleGoNext} disabled={!isPageComplete}>ถัดไป</Button>
          </Box>
        </Box>
      </Box>

      <Dialog open={plan15Popup.open} onClose={closePlan15Popup} maxWidth="md" fullWidth>
        <DialogTitle>{plan15Popup.title}</DialogTitle>
        <DialogContent><TextField fullWidth multiline minRows={10} value={plan15Popup.value} onChange={(event) => setPlan15Popup((prev) => ({ ...prev, value: event.target.value }))} className={styles.dialogField} /></DialogContent>
        <DialogActions><Button onClick={closePlan15Popup}>ยกเลิก</Button><Button variant="contained" onClick={savePlan15Popup}>บันทึก</Button></DialogActions>
      </Dialog>
    </Box>
  )
}

export default mqa3Insert4Page