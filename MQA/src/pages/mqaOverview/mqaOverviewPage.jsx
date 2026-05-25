import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import { useNavigate } from 'react-router-dom'
import styles from './mqaOverviewPage.module.css'

const DEADLINE_ENDPOINT = '/tqf/deadlines'
const ASSIGNED_COURSES_ENDPOINT = '/course-assignment/my-primary-courses'
const TQF3_ENDPOINT = '/tqf3/'
const TQF5_ENDPOINT = '/tqf5/'

const getAuthConfig = () => { const token = localStorage.getItem('mqa_token'); return { headers: token ? { Authorization: `Bearer ${token}` } : {} } }
const normalizeText = (value) => String(value ?? '').trim()
const normalizeCourseCodeForMatch = (value) => normalizeText(value).toLowerCase().replace(/[\s-]/g, '')
const getApiUrl = (apiUrl, path) => `${String(apiUrl || '').replace(/\/$/, '')}${path}`

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
  if (status === 'draft') return { label: 'บันทึกแล้ว', className: styles.statusDraft }
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
  if (status === 'draft') return dueDate && daysUntilDue < 0 ? `บันทึกเอกสารไว้แล้ว แต่เลยกำหนดส่งแล้ว` : `บันทึกเอกสารไว้แล้ว ยังไม่ได้ส่ง`
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

function normalizeTqfDocumentRow(row, documentType, index) {
  return { id: getNestedValue(row, ['id', 'tqf3_id', 'tqf3Id', 'tqf5_id', 'tqf5Id']) || `${documentType}-${index}`, documentType, courseId: String(getNestedValue(row, ['course_id', 'courseId', 'course.id']) || ''), courseCode: normalizeText(getNestedValue(row, ['course_code_snap', 'courseCodeSnap', 'course_code', 'courseCode', 'course.course_code', 'course.courseCode'])), semester: String(getNestedValue(row, ['semester', 'term']) || ''), academicYear: String(getNestedValue(row, ['academic_year', 'academicYear', 'year']) || ''), sectionNumber: String(getNestedValue(row, ['section_group', 'sectionGroup', 'section_number', 'sectionNumber', 'group_no', 'groupNo']) || ''), status: normalizeDocumentStatus(getNestedValue(row, ['status', 'document_status', 'documentStatus'])), submittedAt: getNestedValue(row, ['submitted_at', 'submittedAt', 'updated_at', 'updatedAt']) || null }
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
    requestedCourseItemId: getNestedValue(row, ['requested_course_item_id', 'requestedCourseItemId', 'requested_course_item.id', 'requestedCourseItem.id']) || getNestedValue(requestedItem, ['id']) || '',
    courseId: String(getNestedValue(row, ['course_id', 'courseId', 'course.id', 'requested_course_item.course_id', 'requestedCourseItem.course_id']) || getNestedValue(courseData, ['id', 'course_id', 'courseId']) || getNestedValue(requestedItem, ['course_id', 'courseId']) || ''),
    level: getNestedValue(row, ['level', 'education_level', 'educationLevel', 'degree_level', 'degreeLevel', 'request.education_level', 'course_opening_request.education_level']) || '',
    curriculumName: getNestedValue(row, ['curriculumName', 'curriculum_name', 'request.curriculum_name', 'course_opening_request.curriculum_name', 'courseOpeningRequest.curriculum_name']) || getNestedValue(requestData, ['curriculum_name', 'curriculumName']) || '-',
    majorName: getNestedValue(row, ['majorName', 'major_name', 'department_name', 'departmentName', 'request.major_name', 'course_opening_request.major_name', 'courseOpeningRequest.major_name']) || getNestedValue(requestData, ['major_name', 'majorName']) || '-',
    semester: String(getNestedValue(row, ['semester', 'term', 'request.semester', 'course_opening_request.semester', 'courseOpeningRequest.semester']) || getNestedValue(requestData, ['semester']) || ''),
    academicYear: String(getNestedValue(row, ['academicYear', 'academic_year', 'year', 'request.academic_year', 'course_opening_request.academic_year', 'courseOpeningRequest.academic_year']) || getNestedValue(requestData, ['academic_year', 'academicYear']) || ''),
    yearLevel: String(getNestedValue(row, ['yearLevel', 'year_level', 'requested_course_item.year_level', 'requestedCourseItem.year_level']) || getNestedValue(requestedItem, ['year_level', 'yearLevel']) || '-'),
    courseCode: getNestedValue(row, ['courseCode', 'course_code', 'course_code_snapshot', 'course.course_code', 'course.courseCode', 'requested_course_item.course_code_snapshot', 'requestedCourseItem.course_code_snapshot']) || getNestedValue(courseData, ['course_code', 'courseCode']) || getNestedValue(requestedItem, ['course_code_snapshot', 'courseCode']) || '-',
    courseName: getNestedValue(row, ['courseName', 'course_name', 'course_name_snapshot', 'course.course_name_th', 'course.courseNameTh', 'course.course_name', 'requested_course_item.course_name_snapshot', 'requestedCourseItem.course_name_snapshot']) || getNestedValue(courseData, ['course_name_th', 'courseNameTh', 'course_name', 'courseName']) || getNestedValue(requestedItem, ['course_name_snapshot', 'courseName']) || '-',
    sectionNumber: String(getNestedValue(row, ['sectionNumber', 'section_number', 'section_no', 'sectionNo', 'group_no', 'groupNo', 'requested_course_item.group_no', 'requestedCourseItem.group_no']) || getNestedValue(requestedItem, ['group_no', 'groupNo']) || '1'),
    studentCount: getNestedValue(row, ['studentCount', 'student_count', 'requested_course_item.student_count', 'requestedCourseItem.student_count']) || getNestedValue(requestedItem, ['student_count', 'studentCount']) || 0,
    assignedTeacher: getNestedValue(row, ['assignedTeacher', 'assigned_teacher_name', 'teacher_name', 'teacher.full_name', 'teacher.name', 'primary_teacher.full_name']) || getNestedValue(teacherData, ['full_name', 'fullName', 'name']) || '-',
    mqa3Id: getNestedValue(row, ['mqa3Id', 'mqa3_id', 'tqf3Id', 'tqf3_id', 'mqa3.id', 'tqf3.id']) || '',
    mqa3Status,
    mqa3SubmittedAt: getNestedValue(row, ['mqa3SubmittedAt', 'mqa3_submitted_at', 'tqf3SubmittedAt', 'tqf3_submitted_at', 'mqa3.submitted_at', 'tqf3.submitted_at']) || null,
    mqa5Id: getNestedValue(row, ['mqa5Id', 'mqa5_id', 'tqf5Id', 'tqf5_id', 'mqa5.id', 'tqf5.id']) || '',
    mqa5Status,
    mqa5SubmittedAt: getNestedValue(row, ['mqa5SubmittedAt', 'mqa5_submitted_at', 'tqf5SubmittedAt', 'tqf5_submitted_at', 'mqa5.submitted_at', 'tqf5.submitted_at']) || null,
  }
}

function getDocumentMatchScore(courseItem, documentRow) {
  const courseIdMatched = normalizeText(courseItem.courseId) && normalizeText(documentRow.courseId) && normalizeText(courseItem.courseId) === normalizeText(documentRow.courseId)
  const courseCodeMatched = normalizeCourseCodeForMatch(courseItem.courseCode) && normalizeCourseCodeForMatch(documentRow.courseCode) && normalizeCourseCodeForMatch(courseItem.courseCode) === normalizeCourseCodeForMatch(documentRow.courseCode)
  if (!courseIdMatched && !courseCodeMatched) return 0
  let score = 0
  if (courseIdMatched) score += 100
  if (courseCodeMatched) score += 80
  return score
}

function findMatchingDocument(courseItem, documentRows) {
  const matchedRows = documentRows.map((documentRow) => ({ documentRow, score: getDocumentMatchScore(courseItem, documentRow) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || Number(b.documentRow.id) - Number(a.documentRow.id))
  return matchedRows[0]?.documentRow || null
}

function mergeAssignedCourseWithDocuments(courseItem, tqf3Rows, tqf5Rows) {
  const tqf3Document = findMatchingDocument(courseItem, tqf3Rows)
  const tqf5Document = findMatchingDocument(courseItem, tqf5Rows)
  return { ...courseItem, mqa3Id: tqf3Document?.id || courseItem.mqa3Id || '', mqa3Status: tqf3Document?.status || courseItem.mqa3Status || 'notStarted', mqa3SubmittedAt: tqf3Document?.submittedAt || courseItem.mqa3SubmittedAt || null, mqa5Id: tqf5Document?.id || courseItem.mqa5Id || '', mqa5Status: tqf5Document?.status || courseItem.mqa5Status || 'notStarted', mqa5SubmittedAt: tqf5Document?.submittedAt || courseItem.mqa5SubmittedAt || null }
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
  const [tqf3Rows, setTqf3Rows] = useState([])
  const [tqf5Rows, setTqf5Rows] = useState([])
  const [isLoadingDeadline, setIsLoadingDeadline] = useState(false)
  const [isLoadingAssignedCourses, setIsLoadingAssignedCourses] = useState(false)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [deadlineErrorMessage, setDeadlineErrorMessage] = useState('')
  const [assignedCourseErrorMessage, setAssignedCourseErrorMessage] = useState('')
  const [submitDialog, setSubmitDialog] = useState({ open: false, courseItem: null })
  const [submittingDocumentKey, setSubmittingDocumentKey] = useState('')

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

  const fetchDocumentRows = useCallback(async () => {
    setIsLoadingDocuments(true)
    try {
      const config = getAuthConfig()
      const tqf3Request = axios.get(getApiUrl(apiUrl, TQF3_ENDPOINT), config).then((response) => getResponseList(response.data, ['items', 'data', 'results', 'tqf3', 'documents']).map((item, index) => normalizeTqfDocumentRow(item, 'mqa3', index))).catch((error) => { console.warn('Cannot fetch TQF3 documents:', error); return [] })
      const tqf5Request = axios.get(getApiUrl(apiUrl, TQF5_ENDPOINT), config).then((response) => getResponseList(response.data, ['items', 'data', 'results', 'tqf5', 'documents']).map((item, index) => normalizeTqfDocumentRow(item, 'mqa5', index))).catch((error) => { console.warn('Cannot fetch TQF5 documents:', error); return [] })
      const [nextTqf3Rows, nextTqf5Rows] = await Promise.all([tqf3Request, tqf5Request])
      setTqf3Rows(nextTqf3Rows)
      setTqf5Rows(nextTqf5Rows)
    } finally {
      setIsLoadingDocuments(false)
    }
  }, [apiUrl])

  useEffect(() => { fetchDeadlineRows(); fetchAssignedCourseRows(); fetchDocumentRows() }, [fetchDeadlineRows, fetchAssignedCourseRows, fetchDocumentRows])

  const currentRound = useMemo(() => findCurrentRound(deadlineRows, assignedCourseRows, currentDateString), [deadlineRows, assignedCourseRows, currentDateString])
  const currentRoundCourseRows = useMemo(() => assignedCourseRows.map((courseItem) => mergeAssignedCourseWithDocuments(courseItem, tqf3Rows, tqf5Rows)), [assignedCourseRows, tqf3Rows, tqf5Rows])
  const currentRoundDeadlineRows = useMemo(() => { if (!currentRound.semester || !currentRound.academicYear) return deadlineRows; return deadlineRows.filter((item) => item.semester === currentRound.semester && item.academicYear === currentRound.academicYear) }, [deadlineRows, currentRound.semester, currentRound.academicYear])
  const currentRoundDeadlineMap = useMemo(() => { const deadlineMap = {}; currentRoundDeadlineRows.forEach((item) => { deadlineMap[item.documentType] = item }); return deadlineMap }, [currentRoundDeadlineRows])

  const openSubmitDialog = (courseItem) => setSubmitDialog({ open: true, courseItem })
  const closeSubmitDialog = () => { if (submittingDocumentKey) return; setSubmitDialog({ open: false, courseItem: null }) }
  const getSubmitDocumentInfo = (courseItem, documentType) => documentType === 'mqa3' ? { id: courseItem?.mqa3Id || '', status: courseItem?.mqa3Status || 'notStarted', label: 'มคอ.3', submitPath: courseItem?.mqa3Id ? `/tqf3/${courseItem.mqa3Id}/submit` : '' } : { id: courseItem?.mqa5Id || '', status: courseItem?.mqa5Status || 'notStarted', label: 'มคอ.5', submitPath: courseItem?.mqa5Id ? `/tqf5/${courseItem.mqa5Id}/submit` : '' }

  const getSubmitButtonText = (documentInfo) => {
    if (!documentInfo.id) return `ยังไม่มีเอกสาร ${documentInfo.label}`
    if (documentInfo.status === 'draft') return `ส่งเอกสาร ${documentInfo.label}`
    if (documentInfo.status === 'submitted') return `${documentInfo.label} ส่งแล้ว`
    if (documentInfo.status === 'rejected') return `${documentInfo.label} ถูกตีกลับ`
    return `ยังไม่พร้อมส่ง ${documentInfo.label}`
  }

  const handleSubmitDocument = async (documentType) => {
    const courseItem = submitDialog.courseItem
    const documentInfo = getSubmitDocumentInfo(courseItem, documentType)
    const submitKey = `${documentType}-${documentInfo.id}`

    if (!documentInfo.id) {
      window.alert(`ไม่พบรหัสเอกสาร ${documentInfo.label}`)
      return
    }

    if (documentInfo.status !== 'draft') {
      window.alert(`เอกสาร ${documentInfo.label} ต้องอยู่ในสถานะบันทึกแล้วก่อน จึงจะส่งเอกสารได้`)
      return
    }

    const confirmed = window.confirm(`ยืนยันการส่งเอกสาร ${documentInfo.label} ของวิชา ${courseItem.courseCode} ${courseItem.courseName} หรือไม่`)
    if (!confirmed) return

    try {
      setSubmittingDocumentKey(submitKey)
      await axios.patch(getApiUrl(apiUrl, documentInfo.submitPath), {}, getAuthConfig())
      window.alert(`ส่งเอกสาร ${documentInfo.label} เรียบร้อยแล้ว`)
      setSubmitDialog({ open: false, courseItem: null })
      await Promise.all([fetchDocumentRows(), fetchAssignedCourseRows()])
    } catch (error) {
      console.error(`Error submitting ${documentInfo.label}:`, error)
      window.alert(getErrorMessage(error, `ไม่สามารถส่งเอกสาร ${documentInfo.label} ได้ กรุณาลองใหม่อีกครั้ง`))
    } finally {
      setSubmittingDocumentKey('')
    }
  }

  const renderSubmitDocumentButton = (documentType) => {
    const courseItem = submitDialog.courseItem
    const documentInfo = getSubmitDocumentInfo(courseItem, documentType)
    const submitKey = `${documentType}-${documentInfo.id}`
    const canSubmit = Boolean(documentInfo.id) && documentInfo.status === 'draft'

    return (
      <Button fullWidth variant={canSubmit ? 'contained' : 'outlined'} disabled={!canSubmit || submittingDocumentKey === submitKey} onClick={() => handleSubmitDocument(documentType)} className={`${styles.submitDocumentButton} ${canSubmit ? styles.submitDocumentButtonActive : styles.submitDocumentButtonDisabled}`}>
        {submittingDocumentKey === submitKey ? 'กำลังส่ง...' : getSubmitButtonText(documentInfo)}
      </Button>
    )
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />
      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box className={styles.headerTopRow}>
            <Box className={styles.headerContent}>
              <Typography className={styles.pageEyebrow}>หน้าหลักสำหรับอาจารย์ผู้รับผิดชอบรายวิชา</Typography>
              <Typography className={styles.pageTitle}>ภาพรวมการจัดทำเอกสาร มคอ.</Typography>
              <Typography className={styles.pageDescription}>หน้านี้ใช้สำหรับแสดงสถานะเอกสารของรายวิชาในรอบการศึกษาปัจจุบัน โดยแสดง มคอ.3 และ มคอ.5 ของแต่ละวิชาในแถวเดียวกัน เพื่อให้อ่านง่ายและดูเหมือนหน้าจัดทำเอกสารที่คุณใช้อยู่</Typography>
            </Box>

            <Box className={styles.headerActionBlock}>
              <Chip label={`ภาคการศึกษา ${currentRound.semester || '-'} / ปีการศึกษา ${currentRound.academicYear || '-'}`} className={styles.roundChip} />
              <Button variant="contained" endIcon={<ArrowForwardRoundedIcon />} className={styles.headerActionButton} onClick={() => navigate('/myAssignedCourses')}>ไปหน้ารายวิชาที่ได้รับมอบหมาย</Button>
            </Box>
          </Box>
        </Box>

        <Box className={styles.deadlineSectionCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>กำหนดเวลาการจัดทำเอกสารในรอบปัจจุบัน</Typography>
              <Typography className={styles.sectionDescription}>แสดงวันและเวลาสิ้นสุดของแต่ละเอกสาร พร้อมจำนวนวันที่เปิดให้จัดทำ</Typography>
            </Box>
          </Box>

          <Box className={styles.deadlineList}>
            {isLoadingDeadline && <Box className={styles.emptyState}><CircularProgress size={28} /><Typography className={styles.emptyStateDescription}>กำลังโหลดข้อมูลกำหนดเวลา...</Typography></Box>}

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
                    <Box className={styles.deadlineIcon}><CalendarMonthRoundedIcon /></Box>
                    <Box className={styles.deadlineInfoBlock}>
                      <Box className={styles.deadlineTitleRow}>
                        <Box className={`${styles.documentTypeBadge} ${deadlineRow.documentType === 'mqa3' ? styles.documentTypeBadgeMqa3 : styles.documentTypeBadgeMqa5}`}>{getDocumentTypeLabel(deadlineRow.documentType)}</Box>
                        <Chip label={deadlineStatus.label} className={deadlineStatus.className} size="small" />
                      </Box>
                      <Typography className={styles.deadlineMainText}>หมดเวลาทำ: {formatThaiDateWithTime(deadlineRow.dueDate, deadlineRow.dueTime)}</Typography>
                      <Typography className={styles.deadlineHelperText}>{deadlineStatus.helperText}</Typography>
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
              <Typography className={styles.sectionTitle}>ตารางสถานะเอกสารตามรายวิชา</Typography>
              <Typography className={styles.sectionDescription}>ตารางนี้จะแสดงรายวิชาทั้งหมดที่อาจารย์ได้รับมอบหมายจากหน้าจัดการรายวิชา พร้อมสถานะ มคอ.3 และ มคอ.5 ของแต่ละรายวิชา</Typography>
            </Box>
            <Chip label={`ทั้งหมด ${currentRoundCourseRows.length} วิชา`} className={styles.resultChip} />
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
                {(isLoadingAssignedCourses || isLoadingDocuments) && (
                  <TableRow>
                    <TableCell colSpan={6} className={styles.emptyTableCell}>
                      <Box className={styles.emptyState}>
                        <CircularProgress size={28} />
                        <Typography className={styles.emptyStateDescription}>กำลังโหลดข้อมูลรายวิชาและสถานะเอกสาร...</Typography>
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

                {!isLoadingAssignedCourses && !isLoadingDocuments && !assignedCourseErrorMessage && currentRoundCourseRows.map((courseItem) => {
                  const mqa3Deadline = currentRoundDeadlineMap.mqa3
                  const mqa5Deadline = currentRoundDeadlineMap.mqa5
                  const mqa3Status = getDocumentStatusChipConfig(courseItem.mqa3Status, courseItem.mqa3SubmittedAt, mqa3Deadline?.dueDate)
                  const mqa5Status = getDocumentStatusChipConfig(courseItem.mqa5Status, courseItem.mqa5SubmittedAt, mqa5Deadline?.dueDate)
                  const mqa3DetailText = getDocumentDetailText({ documentType: 'mqa3', status: courseItem.mqa3Status, submittedAt: courseItem.mqa3SubmittedAt, dueDate: mqa3Deadline?.dueDate, currentDateString })
                  const mqa5DetailText = getDocumentDetailText({ documentType: 'mqa5', status: courseItem.mqa5Status, submittedAt: courseItem.mqa5SubmittedAt, dueDate: mqa5Deadline?.dueDate, currentDateString })

                  return (
                    <TableRow key={courseItem.id} className={styles.tableBodyRow}>
                      <TableCell className={styles.bodyCell}><Typography className={styles.codeText}>{courseItem.courseCode}</Typography></TableCell>
                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.courseInfoBlock}>
                          <Typography className={styles.courseName}>{courseItem.courseName}</Typography>
                          <Typography className={styles.courseMeta}>{courseItem.curriculumName} • สาขา{courseItem.majorName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.groupInfoBlock}>
                          <Typography className={styles.primaryText}>กลุ่ม {courseItem.sectionNumber}</Typography>
                          <Typography className={styles.secondaryText}>นักศึกษา {courseItem.studentCount || 0} คน</Typography>
                        </Box>
                      </TableCell>
                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.documentStatusCell}>
                          <Box className={styles.documentStatusItem}>
                            <Typography className={styles.documentLabel}>มคอ.3</Typography>
                            <Chip label={mqa3Status.label} className={mqa3Status.className} size="small" />
                          </Box>
                          <Box className={styles.documentStatusItem}>
                            <Typography className={styles.documentLabel}>มคอ.5</Typography>
                            <Chip label={mqa5Status.label} className={mqa5Status.className} size="small" />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.detailInfoCell}>
                          <Box className={styles.detailInfoItem}>
                            <Typography className={styles.detailTitle}>มคอ.3</Typography>
                            <Typography className={styles.detailText}>{mqa3DetailText}</Typography>
                          </Box>
                          <Box className={styles.detailInfoItem}>
                            <Typography className={styles.detailTitle}>มคอ.5</Typography>
                            <Typography className={styles.detailText}>{mqa5DetailText}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell className={styles.bodyCell}>
                        <Button variant="contained" endIcon={<ArrowForwardRoundedIcon />} className={styles.tableActionButton} onClick={() => openSubmitDialog(courseItem)}>
                          จัดการเอกสาร
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {!isLoadingAssignedCourses && !isLoadingDocuments && !assignedCourseErrorMessage && !currentRoundCourseRows.length && (
                  <TableRow>
                    <TableCell colSpan={6} className={styles.emptyTableCell}>
                      <Box className={styles.emptyState}>
                        <DescriptionRoundedIcon className={styles.emptyStateIcon} />
                        <Typography className={styles.emptyStateTitle}>ยังไม่มีรายวิชาที่ได้รับมอบหมาย</Typography>
                        <Typography className={styles.emptyStateDescription}>เมื่อมีการมอบหมายรายวิชาจากหน้าจัดการรายวิชาแล้ว รายการทั้งหมดจะแสดงในตารางนี้</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      <Dialog open={submitDialog.open} onClose={closeSubmitDialog} fullWidth maxWidth="sm" PaperProps={{ className: styles.submitDialogPaper }}>
        <DialogTitle className={styles.submitDialogTitle}>จัดการเอกสาร มคอ.</DialogTitle>
        <DialogContent className={styles.submitDialogContent}>
          <Box className={styles.submitDialogBody}>
            <Box className={styles.submitCourseCard}>
              <Box className={styles.submitCourseCode}>{submitDialog.courseItem?.courseCode || '-'}</Box>
              <Typography className={styles.submitCourseName}>{submitDialog.courseItem?.courseName || '-'}</Typography>
              <Typography className={styles.submitDialogHint}>เลือกเอกสารที่ต้องการส่ง โดยส่งได้เฉพาะเอกสารที่มีสถานะบันทึกแล้วเท่านั้น</Typography>
            </Box>

            <Box className={styles.submitButtonList}>
              {renderSubmitDocumentButton('mqa3')}
              {renderSubmitDocumentButton('mqa5')}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions className={styles.submitDialogActions}>
          <Button onClick={closeSubmitDialog} disabled={Boolean(submittingDocumentKey)} className={styles.submitDialogCloseButton}>ปิด</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MqaOverviewPage