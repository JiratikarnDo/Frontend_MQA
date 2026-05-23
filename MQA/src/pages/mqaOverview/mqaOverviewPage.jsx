import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import { useNavigate } from 'react-router-dom'
import styles from './mqaOverviewPage.module.css'

const DEADLINE_ENDPOINT = '/tqf/deadlines'
const ASSIGNED_COURSES_ENDPOINT = '/course-assignment/my-primary-courses'

const getAuthConfig = () => {
  const token = localStorage.getItem('mqa_token')
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} }
}

const normalizeText = (value) => String(value ?? '').trim()

const getResponseList = (data, keyList = []) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.results)) return data.results
  for (const key of keyList) if (Array.isArray(data?.[key])) return data[key]
  return []
}

const getErrorMessage = (error, fallbackMessage) => {
  const detail = error?.response?.data?.detail
  const message = error?.response?.data?.message
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(', ')
  return detail || message || fallbackMessage
}

function getTodayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createLocalDate(dateString) {
  if (!dateString) return null
  const normalizedDate = String(dateString).split('T')[0]
  const [year, month, day] = normalizedDate.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function toDateOnly(value) {
  if (!value) return ''
  return String(value).split('T')[0]
}

function toTimeOnly(value) {
  if (!value) return ''
  const text = String(value)
  if (text.includes('T')) return text.split('T')[1]?.slice(0, 5) || ''
  return text.slice(0, 5)
}

function formatThaiDate(dateString) {
  if (!dateString) return '-'
  const thaiMonthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const normalizedDate = String(dateString).split('T')[0]
  const [year, month, day] = normalizedDate.split('-').map(Number)
  if (!year || !month || !day) return '-'
  return `${day} ${thaiMonthNames[month - 1]} ${year + 543}`
}

function formatThaiDateTime(dateTimeString) {
  if (!dateTimeString) return '-'
  const [datePart, timePart = '00:00'] = String(dateTimeString).split('T')
  const [hour = '00', minute = '00'] = timePart.split(':')
  return `${formatThaiDate(datePart)} • ${hour}:${minute} น.`
}

function formatThaiDateWithTime(dateString, timeString = '00:00') {
  if (!dateString) return '-'
  const [hour = '00', minute = '00'] = String(timeString || '00:00').split(':')
  return `${formatThaiDate(dateString)} • ${hour}:${minute} น.`
}

function getDaysDiff(fromDateString, toDateString) {
  const fromDate = createLocalDate(fromDateString)
  const toDate = createLocalDate(toDateString)
  if (!fromDate || !toDate) return 0
  const diffTime = toDate.getTime() - fromDate.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getDurationDays(openDate, dueDate) {
  const openDateObject = createLocalDate(openDate)
  const dueDateObject = createLocalDate(dueDate)
  if (!openDateObject || !dueDateObject) return 0
  const diffTime = dueDateObject.getTime() - openDateObject.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

function getSubmissionDelayDays(submittedAt, dueDate) {
  if (!submittedAt || !dueDate) return 0
  const submittedDate = createLocalDate(String(submittedAt).split('T')[0])
  const dueDateObject = createLocalDate(dueDate)
  if (!submittedDate || !dueDateObject) return 0
  const diffTime = submittedDate.getTime() - dueDateObject.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function normalizeDocumentType(value) {
  const text = normalizeText(value).toLowerCase().replace(/\s/g, '')
  if (text.includes('mqa3') || text.includes('tqf3') || text.includes('มคอ.3') || text.includes('มคอ3')) return 'mqa3'
  if (text.includes('mqa5') || text.includes('tqf5') || text.includes('มคอ.5') || text.includes('มคอ5')) return 'mqa5'
  return text || 'unknown'
}

function normalizeDocumentStatus(value) {
  const text = normalizeText(value).toLowerCase().replace(/[\s_-]/g, '')
  if (!text) return 'notStarted'
  if (['submitted', 'submit', 'sent', 'approved', 'pending', 'pendingapproval', 'waitingapproval'].includes(text)) return 'submitted'
  if (['draft', 'savedraft'].includes(text)) return 'draft'
  if (['waitinggrade', 'waitgrade', 'aftergrade'].includes(text)) return 'waitingGrade'
  if (['rejected', 'reject', 'rejectedbydean'].includes(text)) return 'rejected'
  return 'notStarted'
}

function getDocumentTypeLabel(documentType) {
  if (documentType === 'mqa3') return 'มคอ.3'
  if (documentType === 'mqa5') return 'มคอ.5'
  return '-'
}

function getDeadlineStatusConfig(deadlineRow, currentDateString) {
  if (!deadlineRow?.openDate || !deadlineRow?.dueDate) return { label: 'ไม่พบกำหนด', className: styles.deadlineStatusUpcoming, helperText: 'ยังไม่มีข้อมูลกำหนดเวลาจากระบบ' }
  const daysUntilOpen = getDaysDiff(currentDateString, deadlineRow.openDate)
  const daysUntilDue = getDaysDiff(currentDateString, deadlineRow.dueDate)
  const durationDays = getDurationDays(deadlineRow.openDate, deadlineRow.dueDate)
  if (daysUntilOpen > 0) return { label: 'ยังไม่เปิดรอบ', className: styles.deadlineStatusUpcoming, helperText: `มีเวลาจัดทำ ${durationDays} วัน` }
  if (daysUntilDue < 0) return { label: 'เลยกำหนด', className: styles.deadlineStatusOverdue, helperText: `มีเวลาจัดทำ ${durationDays} วัน` }
  if (daysUntilDue <= 7) return { label: 'ใกล้ครบกำหนด', className: styles.deadlineStatusUrgent, helperText: `มีเวลาจัดทำ ${durationDays} วัน` }
  return { label: 'กำลังเปิดดำเนินการ', className: styles.deadlineStatusOpen, helperText: `มีเวลาจัดทำ ${durationDays} วัน` }
}

function getDocumentStatusChipConfig(status, submittedAt, dueDate) {
  if (status === 'submitted') {
    const delayDays = getSubmissionDelayDays(submittedAt, dueDate)
    if (delayDays > 0) return { label: 'ส่งล่าช้า', className: styles.statusLate }
    return { label: 'ส่งแล้ว', className: styles.statusSubmitted }
  }
  if (status === 'draft') return { label: 'แบบร่าง', className: styles.statusDraft }
  if (status === 'waitingGrade') return { label: 'รอหลังเกรดออก', className: styles.statusWaiting }
  if (status === 'rejected') return { label: 'ตีกลับ', className: styles.statusPending }
  return { label: 'ยังไม่เริ่ม', className: styles.statusPending }
}

function getDocumentDetailText({ documentType, status, submittedAt, dueDate, currentDateString }) {
  const documentLabel = getDocumentTypeLabel(documentType)
  const delayDays = submittedAt ? getSubmissionDelayDays(submittedAt, dueDate) : 0
  const daysUntilDue = dueDate ? getDaysDiff(currentDateString, dueDate) : 0
  if (status === 'submitted') {
    if (submittedAt && delayDays > 0) return `ส่ง ${documentLabel} เมื่อ ${formatThaiDateTime(submittedAt)} • ช้ากว่ากำหนด ${delayDays} วัน`
    if (submittedAt) return `ส่ง ${documentLabel} เมื่อ ${formatThaiDateTime(submittedAt)}`
    return `ส่ง ${documentLabel} แล้ว`
  }
  if (status === 'waitingGrade') return `รอผลการเรียนก่อนจึงจะส่ง ${documentLabel} ได้`
  if (status === 'draft') return dueDate && daysUntilDue < 0 ? `บันทึกแบบร่างไว้แล้ว แต่เลยกำหนดส่งแล้ว` : `บันทึกแบบร่างไว้แล้ว ยังไม่ได้ส่ง`
  if (status === 'rejected') return `${documentLabel} ถูกตีกลับ กรุณาแก้ไขและส่งใหม่`
  if (dueDate && daysUntilDue < 0) return `ยังไม่ได้เริ่มจัดทำ และเลยกำหนดส่งแล้ว`
  return `ยังไม่ได้เริ่มจัดทำ`
}

function getNestedValue(object, keyList = []) {
  for (const key of keyList) {
    const value = key.split('.').reduce((current, part) => current?.[part], object)
    if (value !== undefined && value !== null && value !== '') return value
  }
  return ''
}

function normalizeDeadlineRow(row, index) {
  const documentType = normalizeDocumentType(getNestedValue(row, ['documentType', 'document_type', 'tqfType', 'tqf_type', 'type', 'document_name', 'documentName', 'name']))
  return { id: getNestedValue(row, ['id', 'deadline_id', 'deadlineId']) || `deadline-${documentType}-${index}`, documentType, semester: String(getNestedValue(row, ['semester', 'term']) || ''), academicYear: String(getNestedValue(row, ['academicYear', 'academic_year', 'year']) || ''), openDate: toDateOnly(getNestedValue(row, ['openDate', 'open_date', 'startDate', 'start_date', 'start_date_time', 'startDateTime', 'openAt', 'open_at'])), dueDate: toDateOnly(getNestedValue(row, ['dueDate', 'due_date', 'endDate', 'end_date', 'deadlineDate', 'deadline_date', 'end_date_time', 'endDateTime', 'dueAt', 'due_at'])), dueTime: toTimeOnly(getNestedValue(row, ['dueTime', 'due_time', 'endTime', 'end_time', 'deadlineTime', 'deadline_time', 'endDate', 'end_date', 'dueAt', 'due_at'])) || '23:59' }
}

function normalizeAssignedCourseRow(row, index) {
  const requestData = getNestedValue(row, ['request', 'course_opening_request', 'courseOpeningRequest', 'opening_request', 'openingRequest']) || {}
  const courseData = getNestedValue(row, ['course', 'course_data', 'courseData', 'requested_course_item.course', 'requestedCourseItem.course']) || {}
  const requestedItem = getNestedValue(row, ['requested_course_item', 'requestedCourseItem', 'course_item', 'courseItem', 'item']) || {}
  const teacherData = getNestedValue(row, ['teacher', 'assigned_teacher', 'assignedTeacher', 'primary_teacher', 'primaryTeacher']) || {}
  const mqa3Status = normalizeDocumentStatus(getNestedValue(row, ['mqa3Status', 'mqa3_status', 'tqf3Status', 'tqf3_status', 'mqa3.status', 'tqf3.status']))
  const mqa5Status = normalizeDocumentStatus(getNestedValue(row, ['mqa5Status', 'mqa5_status', 'tqf5Status', 'tqf5_status', 'mqa5.status', 'tqf5.status']))
  return {
    id: getNestedValue(row, ['id', 'assignment_id', 'assignmentId', 'requested_course_item_id', 'requestedCourseItemId']) || `assigned-${index}`,
    level: getNestedValue(row, ['level', 'education_level', 'educationLevel', 'degree_level', 'degreeLevel', 'request.education_level', 'course_opening_request.education_level']) || '',
    curriculumName: getNestedValue(row, ['curriculumName', 'curriculum_name', 'request.curriculum_name', 'course_opening_request.curriculum_name', 'courseOpeningRequest.curriculum_name']) || getNestedValue(requestData, ['curriculum_name', 'curriculumName']) || '-',
    majorName: getNestedValue(row, ['majorName', 'major_name', 'department_name', 'departmentName', 'request.major_name', 'course_opening_request.major_name', 'courseOpeningRequest.major_name']) || getNestedValue(requestData, ['major_name', 'majorName']) || '-',
    semester: String(getNestedValue(row, ['semester', 'term', 'request.semester', 'course_opening_request.semester', 'courseOpeningRequest.semester']) || getNestedValue(requestData, ['semester']) || ''),
    academicYear: String(getNestedValue(row, ['academicYear', 'academic_year', 'year', 'request.academic_year', 'course_opening_request.academic_year', 'courseOpeningRequest.academic_year']) || getNestedValue(requestData, ['academic_year', 'academicYear']) || ''),
    yearLevel: String(getNestedValue(row, ['yearLevel', 'year_level', 'requested_course_item.year_level', 'requestedCourseItem.year_level']) || getNestedValue(requestedItem, ['year_level', 'yearLevel']) || '-'),
    courseCode: getNestedValue(row, ['courseCode', 'course_code', 'course_code_snapshot', 'course.course_code', 'course.courseCode', 'requested_course_item.course_code_snapshot', 'requestedCourseItem.course_code_snapshot']) || getNestedValue(courseData, ['course_code', 'courseCode']) || getNestedValue(requestedItem, ['course_code_snapshot', 'courseCode']) || '-',
    courseName: getNestedValue(row, ['courseName', 'course_name', 'course_name_snapshot', 'course.course_name_th', 'course.courseNameTh', 'course.course_name', 'requested_course_item.course_name_snapshot', 'requestedCourseItem.course_name_snapshot']) || getNestedValue(courseData, ['course_name_th', 'courseNameTh', 'course_name', 'courseName']) || getNestedValue(requestedItem, ['course_name_snapshot', 'courseName']) || '-',
    sectionNumber: getNestedValue(row, ['sectionNumber', 'section_number', 'section_no', 'sectionNo', 'group_no', 'groupNo', 'requested_course_item.group_no', 'requestedCourseItem.group_no']) || getNestedValue(requestedItem, ['group_no', 'groupNo']) || '1',
    studentCount: getNestedValue(row, ['studentCount', 'student_count', 'requested_course_item.student_count', 'requestedCourseItem.student_count']) || getNestedValue(requestedItem, ['student_count', 'studentCount']) || 0,
    assignedTeacher: getNestedValue(row, ['assignedTeacher', 'assigned_teacher_name', 'teacher_name', 'teacher.full_name', 'teacher.name', 'primary_teacher.full_name']) || getNestedValue(teacherData, ['full_name', 'fullName', 'name']) || '-',
    mqa3Status,
    mqa3SubmittedAt: getNestedValue(row, ['mqa3SubmittedAt', 'mqa3_submitted_at', 'tqf3SubmittedAt', 'tqf3_submitted_at', 'mqa3.submitted_at', 'tqf3.submitted_at']) || null,
    mqa5Status,
    mqa5SubmittedAt: getNestedValue(row, ['mqa5SubmittedAt', 'mqa5_submitted_at', 'tqf5SubmittedAt', 'tqf5_submitted_at', 'mqa5.submitted_at', 'tqf5.submitted_at']) || null,
  }
}

function findCurrentRound(deadlineRows, assignedCourseRows, currentDateString) {
  const activeDeadline = deadlineRows.find((item) => item.openDate && item.dueDate && getDaysDiff(currentDateString, item.openDate) <= 0 && getDaysDiff(currentDateString, item.dueDate) >= 0)
  const nearestDeadline = deadlineRows[0]
  const firstCourse = assignedCourseRows[0]
  return { semester: activeDeadline?.semester || nearestDeadline?.semester || firstCourse?.semester || '', academicYear: activeDeadline?.academicYear || nearestDeadline?.academicYear || firstCourse?.academicYear || '' }
}

function MqaOverviewPage() {
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL
  const currentDateString = useMemo(() => getTodayDateString(), [])
  const [deadlineRows, setDeadlineRows] = useState([])
  const [assignedCourseRows, setAssignedCourseRows] = useState([])
  const [isLoadingDeadline, setIsLoadingDeadline] = useState(false)
  const [isLoadingAssignedCourses, setIsLoadingAssignedCourses] = useState(false)
  const [deadlineErrorMessage, setDeadlineErrorMessage] = useState('')
  const [assignedCourseErrorMessage, setAssignedCourseErrorMessage] = useState('')

  const fetchDeadlineRows = useCallback(async () => {
    setIsLoadingDeadline(true)
    setDeadlineErrorMessage('')
    try {
      const response = await axios.get(`${apiUrl}${DEADLINE_ENDPOINT}`, getAuthConfig())
      const nextRows = getResponseList(response.data, ['deadlines', 'deadlineRows', 'items', 'data', 'results']).map((item, index) => normalizeDeadlineRow(item, index)).filter((item) => item.documentType === 'mqa3' || item.documentType === 'mqa5')
      setDeadlineRows(nextRows)
    } catch (error) {
      console.error('Error fetching TQF deadlines:', error)
      setDeadlineRows([])
      setDeadlineErrorMessage(getErrorMessage(error, 'ไม่สามารถดึงข้อมูลกำหนดเวลาการจัดทำเอกสารได้'))
    } finally {
      setIsLoadingDeadline(false)
    }
  }, [apiUrl])

  const fetchAssignedCourseRows = useCallback(async () => {
    setIsLoadingAssignedCourses(true)
    setAssignedCourseErrorMessage('')
    try {
      const response = await axios.get(`${apiUrl}${ASSIGNED_COURSES_ENDPOINT}`, getAuthConfig())
      const nextRows = getResponseList(response.data, ['courses', 'assignedCourses', 'assignments', 'items', 'data', 'results']).map((item, index) => normalizeAssignedCourseRow(item, index))
      setAssignedCourseRows(nextRows)
    } catch (error) {
      console.error('Error fetching assigned course rows:', error)
      setAssignedCourseRows([])
      setAssignedCourseErrorMessage(getErrorMessage(error, 'ไม่สามารถดึงข้อมูลรายวิชาที่ได้รับมอบหมายได้'))
    } finally {
      setIsLoadingAssignedCourses(false)
    }
  }, [apiUrl])

  useEffect(() => { fetchDeadlineRows(); fetchAssignedCourseRows() }, [fetchDeadlineRows, fetchAssignedCourseRows])

  const currentRound = useMemo(() => findCurrentRound(deadlineRows, assignedCourseRows, currentDateString), [deadlineRows, assignedCourseRows, currentDateString])

  const currentRoundCourseRows = useMemo(() => assignedCourseRows, [assignedCourseRows])

  const currentRoundDeadlineRows = useMemo(() => {
    if (!currentRound.semester || !currentRound.academicYear) return deadlineRows
    return deadlineRows.filter((item) => item.semester === currentRound.semester && item.academicYear === currentRound.academicYear)
  }, [deadlineRows, currentRound.semester, currentRound.academicYear])

  const currentRoundDeadlineMap = useMemo(() => {
    const deadlineMap = {}
    currentRoundDeadlineRows.forEach((item) => { deadlineMap[item.documentType] = item })
    return deadlineMap
  }, [currentRoundDeadlineRows])

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box className={styles.headerTopRow}>
            <Box className={styles.headerContent}>
              <Typography className={styles.pageEyebrow}>
                หน้าหลักสำหรับอาจารย์ผู้รับผิดชอบรายวิชา
              </Typography>

              <Typography className={styles.pageTitle}>
                ภาพรวมการจัดทำเอกสาร มคอ.
              </Typography>

              <Typography className={styles.pageDescription}>
                หน้านี้ใช้สำหรับแสดงสถานะเอกสารของรายวิชาในรอบการศึกษาปัจจุบัน
                โดยแสดง มคอ.3 และ มคอ.5 ของแต่ละวิชาในแถวเดียวกัน
                เพื่อให้อ่านง่ายและดูเหมือนหน้าจัดทำเอกสารที่คุณใช้อยู่
              </Typography>
            </Box>

            <Box className={styles.headerActionBlock}>
              <Chip
                label={`ภาคการศึกษา ${currentRound.semester || '-'} / ปีการศึกษา ${currentRound.academicYear || '-'}`}
                className={styles.roundChip}
              />

              <Button
                variant="contained"
                endIcon={<ArrowForwardRoundedIcon />}
                className={styles.headerActionButton}
                onClick={() => navigate('/myAssignedCourses')}
              >
                ไปหน้ารายวิชาที่ได้รับมอบหมาย
              </Button>
            </Box>
          </Box>
        </Box>

        <Box className={styles.deadlineSectionCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>
                กำหนดเวลาการจัดทำเอกสารในรอบปัจจุบัน
              </Typography>
              <Typography className={styles.sectionDescription}>
                แสดงวันและเวลาสิ้นสุดของแต่ละเอกสาร พร้อมจำนวนวันที่เปิดให้จัดทำ
              </Typography>
            </Box>
          </Box>

          <Box className={styles.deadlineList}>
            {isLoadingDeadline && (
              <Box className={styles.emptyState}>
                <CircularProgress size={28} />
                <Typography className={styles.emptyStateDescription}>กำลังโหลดข้อมูลกำหนดเวลา...</Typography>
              </Box>
            )}

            {!isLoadingDeadline && deadlineErrorMessage && (
              <Box className={styles.emptyState}>
                <DescriptionRoundedIcon className={styles.emptyStateIcon} />
                <Typography className={styles.emptyStateTitle}>ยังไม่สามารถโหลดกำหนดเวลาได้</Typography>
                <Typography className={styles.emptyStateDescription}>{deadlineErrorMessage}</Typography>
              </Box>
            )}

            {!isLoadingDeadline && !deadlineErrorMessage && currentRoundDeadlineRows.map((deadlineRow) => {
              const deadlineStatus = getDeadlineStatusConfig(deadlineRow, currentDateString)

              return (
                <Box key={deadlineRow.id} className={styles.deadlineRow}>
                  <Box className={styles.deadlineRowLeft}>
                    <Box className={styles.deadlineIcon}>
                      <CalendarMonthRoundedIcon />
                    </Box>

                    <Box className={styles.deadlineInfoBlock}>
                      <Box className={styles.deadlineTitleRow}>
                        <Box className={`${styles.documentTypeBadge} ${deadlineRow.documentType === 'mqa3' ? styles.documentTypeBadgeMqa3 : styles.documentTypeBadgeMqa5}`}>
                          {getDocumentTypeLabel(deadlineRow.documentType)}
                        </Box>

                        <Chip
                          label={deadlineStatus.label}
                          className={deadlineStatus.className}
                          size="small"
                        />
                      </Box>

                      <Typography className={styles.deadlineMainText}>
                        หมดเวลาทำ: {formatThaiDateWithTime(deadlineRow.dueDate, deadlineRow.dueTime)}
                      </Typography>

                      <Typography className={styles.deadlineHelperText}>
                        {deadlineStatus.helperText}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )
            })}

            {!isLoadingDeadline && !deadlineErrorMessage && !currentRoundDeadlineRows.length && (
              <Box className={styles.emptyState}>
                <DescriptionRoundedIcon className={styles.emptyStateIcon} />
                <Typography className={styles.emptyStateTitle}>ยังไม่มีกำหนดเวลาของรอบปัจจุบัน</Typography>
                <Typography className={styles.emptyStateDescription}>เมื่อเจ้าหน้าที่กำหนดรอบ มคอ.3 และ มคอ.5 แล้ว ข้อมูลจะแสดงในส่วนนี้</Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box className={styles.tableSectionCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>
                ตารางสถานะเอกสารตามรายวิชา
              </Typography>
              <Typography className={styles.sectionDescription}>
                ตารางนี้จะแสดงรายวิชาทั้งหมดที่อาจารย์ได้รับมอบหมายจากหน้าจัดการรายวิชา พร้อมสถานะ มคอ.3 และ มคอ.5 ของแต่ละรายวิชา
              </Typography>
            </Box>

            <Chip
              label={`ทั้งหมด ${currentRoundCourseRows.length} วิชา`}
              className={styles.resultChip}
            />
          </Box>

          <TableContainer className={styles.tableContainer}>
            <Table className={styles.table}>
              <TableHead>
                <TableRow className={styles.tableHeadRow}>
                  <TableCell className={styles.headCell}>รหัสวิชา</TableCell>
                  <TableCell className={styles.headCell}>ชื่อรายวิชา</TableCell>
                  <TableCell className={styles.headCell}>กลุ่ม / นักศึกษา</TableCell>
                  <TableCell className={styles.headCell}>สถานะเอกสาร</TableCell>
                  <TableCell className={styles.headCell}>รายละเอียดการส่ง</TableCell>
                  <TableCell className={styles.headCell}>จัดการ</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isLoadingAssignedCourses && (
                  <TableRow>
                    <TableCell colSpan={6} className={styles.emptyTableCell}>
                      <Box className={styles.emptyState}>
                        <CircularProgress size={28} />
                        <Typography className={styles.emptyStateDescription}>กำลังโหลดข้อมูลรายวิชาที่ได้รับมอบหมาย...</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {!isLoadingAssignedCourses && assignedCourseErrorMessage && (
                  <TableRow>
                    <TableCell colSpan={6} className={styles.emptyTableCell}>
                      <Box className={styles.emptyState}>
                        <DescriptionRoundedIcon className={styles.emptyStateIcon} />
                        <Typography className={styles.emptyStateTitle}>ยังไม่สามารถโหลดรายวิชาได้</Typography>
                        <Typography className={styles.emptyStateDescription}>{assignedCourseErrorMessage}</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {!isLoadingAssignedCourses && !assignedCourseErrorMessage && currentRoundCourseRows.map((courseItem) => {
                  const mqa3Deadline = currentRoundDeadlineMap.mqa3
                  const mqa5Deadline = currentRoundDeadlineMap.mqa5
                  const mqa3Status = getDocumentStatusChipConfig(courseItem.mqa3Status, courseItem.mqa3SubmittedAt, mqa3Deadline?.dueDate)
                  const mqa5Status = getDocumentStatusChipConfig(courseItem.mqa5Status, courseItem.mqa5SubmittedAt, mqa5Deadline?.dueDate)
                  const mqa3DetailText = getDocumentDetailText({ documentType: 'mqa3', status: courseItem.mqa3Status, submittedAt: courseItem.mqa3SubmittedAt, dueDate: mqa3Deadline?.dueDate, currentDateString })
                  const mqa5DetailText = getDocumentDetailText({ documentType: 'mqa5', status: courseItem.mqa5Status, submittedAt: courseItem.mqa5SubmittedAt, dueDate: mqa5Deadline?.dueDate, currentDateString })

                  return (
                    <TableRow key={courseItem.id} className={styles.tableBodyRow}>
                      <TableCell className={styles.bodyCell}>
                        <Typography className={styles.codeText}>
                          {courseItem.courseCode}
                        </Typography>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.courseInfoBlock}>
                          <Typography className={styles.courseName}>
                            {courseItem.courseName}
                          </Typography>
                          <Typography className={styles.courseMeta}>
                            {courseItem.curriculumName} • สาขา{courseItem.majorName}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.groupInfoBlock}>
                          <Typography className={styles.primaryText}>
                            กลุ่ม {courseItem.sectionNumber}
                          </Typography>
                          <Typography className={styles.secondaryText}>
                            นักศึกษา {courseItem.studentCount || 0} คน
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.documentStatusCell}>
                          <Box className={styles.documentStatusItem}>
                            <Typography className={styles.documentLabel}>
                              มคอ.3
                            </Typography>
                            <Chip
                              label={mqa3Status.label}
                              className={mqa3Status.className}
                              size="small"
                            />
                          </Box>

                          <Box className={styles.documentStatusItem}>
                            <Typography className={styles.documentLabel}>
                              มคอ.5
                            </Typography>
                            <Chip
                              label={mqa5Status.label}
                              className={mqa5Status.className}
                              size="small"
                            />
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.detailInfoCell}>
                          <Box className={styles.detailInfoItem}>
                            <Typography className={styles.detailTitle}>
                              มคอ.3
                            </Typography>
                            <Typography className={styles.detailText}>
                              {mqa3DetailText}
                            </Typography>
                          </Box>

                          <Box className={styles.detailInfoItem}>
                            <Typography className={styles.detailTitle}>
                              มคอ.5
                            </Typography>
                            <Typography className={styles.detailText}>
                              {mqa5DetailText}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Button
                          variant="contained"
                          endIcon={<ArrowForwardRoundedIcon />}
                          className={styles.tableActionButton}
                          onClick={() => navigate('/myAssignedCourses')}
                        >
                          เปิดรายการ
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {!isLoadingAssignedCourses && !assignedCourseErrorMessage && !currentRoundCourseRows.length && (
                  <TableRow>
                    <TableCell colSpan={6} className={styles.emptyTableCell}>
                      <Box className={styles.emptyState}>
                        <DescriptionRoundedIcon className={styles.emptyStateIcon} />
                        <Typography className={styles.emptyStateTitle}>
                          ยังไม่มีรายวิชาที่ได้รับมอบหมาย
                        </Typography>
                        <Typography className={styles.emptyStateDescription}>
                          เมื่อมีการมอบหมายรายวิชาจากหน้าจัดการรายวิชาแล้ว รายการทั้งหมดจะแสดงในตารางนี้
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  )
}

export default MqaOverviewPage