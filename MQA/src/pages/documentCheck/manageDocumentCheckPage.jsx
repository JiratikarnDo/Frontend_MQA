import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, Divider, InputAdornment, MenuItem, TextField, Typography } from '@mui/material'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import styles from './manageDocumentCheckPage.module.css'

const USERS_ENDPOINT = '/users/'
const CURRENT_USER_ENDPOINT = '/auth/me'
const ASSIGNMENT_ENDPOINT = '/course-assignment/approved-courses'
const COURSE_OPENING_ENDPOINT = '/course-opening/'
const DEADLINE_ENDPOINT = '/tqf/deadlines'
const TQF3_ENDPOINT = '/tqf3/'
const TQF5_ENDPOINT = '/tqf5/'
const fallbackRoundOptions = [
  { id: 'mqa3-current', label: 'มคอ.3', documentType: 'มคอ.3', documentKey: 'mqa3', termLabel: 'รอบปัจจุบัน', semester: '', academicYear: '', dueAt: null },
  { id: 'mqa5-current', label: 'มคอ.5', documentType: 'มคอ.5', documentKey: 'mqa5', termLabel: 'รอบปัจจุบัน', semester: '', academicYear: '', dueAt: null },
]

const getAuthConfig = () => {
  const token = localStorage.getItem('mqa_token')
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} }
}

const getApiUrl = (apiUrl, endpoint) => `${String(apiUrl || '').replace(/\/$/, '')}/${String(endpoint || '').replace(/^\//, '')}`
const getResponseList = (data, keyList = []) => {
  if (Array.isArray(data)) return data
  for (const key of keyList) if (Array.isArray(data?.[key])) return data[key]
  if (data?.data && data.data !== data) return getResponseList(data.data, keyList)
  return []
}

const normalizeId = (value) => (value === null || value === undefined || value === '' ? '' : String(value))
const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ')
const normalizeSearchText = (value) => normalizeText(value).toLowerCase()
const normalizeRole = (value) => String(value || '').trim().toLowerCase()
const isTeacherRole = (value) => ['teacher', 'headmajor'].includes(normalizeRole(value))
const getDepartmentId = (source = {}) => source.department_id ?? source.departmentId ?? source.department?.id ?? source.department?.department_id ?? source.department?.departmentId ?? ''
const getTeacherId = (source = {}) => source.teacher_id ?? source.teacherId ?? source.user_id ?? source.userId ?? source.id ?? ''
const getAssignmentRequestedCourseItemId = (source = {}) => source.requested_course_item_id ?? source.requestedCourseItemId ?? source.opening_course_item_id ?? source.openingCourseItemId ?? source.course_item_id ?? source.courseItemId ?? source.course_id ?? source.courseId ?? source.id ?? ''
const getAssignmentMasterCourseId = (source = {}) => source.master_course_id ?? source.masterCourseId ?? source.courseMasterId ?? source.masterCourse?.id ?? source.course?.id ?? ''
const getFullName = (source = {}) => normalizeText(source.teacher_name || source.teacherName || source.full_name || source.fullName || source.name || [source.prefixname || source.prefixName, source.first_name || source.firstName, source.last_name || source.lastName].filter(Boolean).join(' '))

function getResponseObject(data) {
  if (Array.isArray(data)) return data[0] ?? null
  if (data?.data && typeof data.data === 'object') return data.data
  if (data?.item && typeof data.item === 'object') return data.item
  if (data?.result && typeof data.result === 'object') return data.result
  return data
}

function getCourseOpeningRequestId(item) {
  return item?.id ?? item?.request_id ?? item?.requestId ?? item?.course_opening_request_id ?? item?.courseOpeningRequestId ?? null
}

function getSelectedMajorId(selectedMajor) {
  return normalizeId(selectedMajor?.id || selectedMajor?.department_id || selectedMajor?.departmentId || selectedMajor?.rawData?.id || selectedMajor?.rawData?.department_id || selectedMajor?.rawData?.departmentId)
}

function getSelectedMajorName(selectedMajor) {
  return normalizeText(selectedMajor?.majorNameTh || selectedMajor?.majorName || selectedMajor?.department_name || selectedMajor?.departmentName || selectedMajor?.name || selectedMajor?.rawData?.majorNameTh || selectedMajor?.rawData?.department_name || selectedMajor?.rawData?.departmentName || selectedMajor?.rawData?.name)
}

function getDocumentKeyFromType(value) {
  const text = normalizeSearchText(value).replace(/\s+/g, '')
  if (text.includes('5') || text.includes('tqf5') || text.includes('mqa5')) return 'mqa5'
  return 'mqa3'
}

function getDocumentTypeLabel(documentKey) {
  return documentKey === 'mqa5' ? 'มคอ.5' : 'มคอ.3'
}

function formatTermLabel(semester, academicYear) {
  const semesterText = semester ? `ภาค ${semester}` : ''
  const yearText = academicYear ? `ปี ${academicYear}` : ''
  return [semesterText, yearText].filter(Boolean).join(' / ') || 'รอบปัจจุบัน'
}

function mapDeadlineToRound(deadline, index) {
  const documentKey = getDocumentKeyFromType(deadline.tqf_type || deadline.tqfType || deadline.document_type || deadline.documentType)
  const semester = deadline.semester ?? ''
  const academicYear = deadline.academic_year ?? deadline.academicYear ?? deadline.year ?? ''
  const documentType = getDocumentTypeLabel(documentKey)
  const termLabel = formatTermLabel(semester, academicYear)
  return { id: `${documentKey}-${deadline.id ?? `${semester}-${academicYear}-${index}`}`, label: `${documentType} ${termLabel}`, documentType, documentKey, termLabel, semester: normalizeId(semester), academicYear: normalizeId(academicYear), dueAt: deadline.end_date || deadline.endDate || deadline.due_at || deadline.dueAt || null }
}

function buildRoundOptions(deadlineList) {
  const mappedRounds = getResponseList(deadlineList, ['items', 'data', 'results', 'deadlines']).map(mapDeadlineToRound).filter(Boolean)
  if (!mappedRounds.length) return fallbackRoundOptions
  const roundMap = new Map()
  mappedRounds.forEach((round) => roundMap.set(round.id, round))
  return Array.from(roundMap.values()).sort((a, b) => Number(b.academicYear || 0) - Number(a.academicYear || 0) || String(b.semester || '').localeCompare(String(a.semester || ''), 'th') || a.documentKey.localeCompare(b.documentKey))
}

function normalizeCourseOpeningRequest(apiData, fallbackData = {}) {
  const data = { ...fallbackData, ...apiData }
  const id = getCourseOpeningRequestId(data)
  const curriculumName = data?.curriculum_name ?? data?.curriculumName ?? data?.documentData?.generalForm?.curriculumName ?? ''
  const majorName = data?.major_name ?? data?.majorName ?? data?.documentData?.generalForm?.majorName ?? ''
  const semester = String(data?.semester ?? data?.documentData?.generalForm?.semester ?? '')
  const academicYear = String(data?.academic_year ?? data?.academicYear ?? data?.documentData?.generalForm?.academicYear ?? '')
  const requestedCourses = getResponseList(data, ['requested_courses', 'requestedCourses']).map((course, index) => ({ id: normalizeId(course?.id ?? course?.requested_course_item_id ?? course?.requestedCourseItemId ?? `${id || 'request'}-${index}`), requestId: normalizeId(id), curriculumName, majorName, semester, academicYear, courseId: normalizeId(course?.course_id ?? course?.courseId ?? course?.id_course ?? course?.course?.id ?? course?.course?.course_id ?? course?.course?.courseId ?? ''), courseCode: normalizeText(course?.course_code_snapshot ?? course?.courseCode ?? course?.course_code ?? course?.course?.course_code ?? course?.course?.courseCode ?? ''), courseName: normalizeText(course?.course_name_snapshot ?? course?.courseName ?? course?.course_name ?? course?.course?.course_name_th ?? course?.course?.courseNameTh ?? ''), groupNo: normalizeId(course?.group_no ?? course?.groupNo ?? course?.section_number ?? course?.sectionNumber ?? '1'), yearLevel: normalizeId(course?.year_level ?? course?.yearLevel ?? ''), studentCount: course?.student_count ?? course?.studentCount ?? 0, rawData: course }))
  return { id: normalizeId(id), curriculumName, majorName, semester, academicYear, requestedCourses, rawData: data }
}

async function fetchCourseOpeningCourseRows(apiUrl) {
  const fetchOpeningList = async () => {
    try {
      const response = await axios.get(getApiUrl(apiUrl, COURSE_OPENING_ENDPOINT), { ...getAuthConfig(), params: { page: 1, limit: 100 } })
      return getResponseList(response.data, ['items', 'data', 'results', 'requests'])
    } catch (firstError) {
      try {
        const response = await axios.get(getApiUrl(apiUrl, COURSE_OPENING_ENDPOINT), getAuthConfig())
        return getResponseList(response.data, ['items', 'data', 'results', 'requests'])
      } catch (secondError) {
        console.warn('Cannot fetch course opening list for document check matching:', firstError, secondError)
        return []
      }
    }
  }
  const summaryList = await fetchOpeningList()
  const requestList = await Promise.all(summaryList.map(async (summaryItem) => {
    const requestId = getCourseOpeningRequestId(summaryItem)
    if (!requestId) return normalizeCourseOpeningRequest(summaryItem)
    try {
      const detailResponse = await axios.get(getApiUrl(apiUrl, `${COURSE_OPENING_ENDPOINT}${requestId}`), getAuthConfig())
      return normalizeCourseOpeningRequest(getResponseObject(detailResponse.data), summaryItem)
    } catch (error) {
      return normalizeCourseOpeningRequest(summaryItem)
    }
  }))
  return requestList.flatMap((requestItem) => requestItem.requestedCourses.map((course) => ({ ...course, requestRawData: requestItem.rawData })))
}

function formatThaiDateTime(dateValue) {
  if (!dateValue) return '-'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function normalizeDocumentStatus(value) {
  const text = String(value || '').trim().toLowerCase().replace(/[\s_-]/g, '')
  if (!text) return 'notStarted'
  if (['submitted', 'submit', 'sent', 'approved', 'pending', 'pendingapproval', 'waitingapproval'].includes(text)) return 'submitted'
  if (['draft', 'savedraft'].includes(text)) return 'draft'
  if (['rejected', 'reject'].includes(text)) return 'rejected'
  return text
}

function getSubmittedAt(documentItem) {
  return documentItem?.submittedAt || documentItem?.submitted_at || documentItem?.updated_at || documentItem?.updatedAt || documentItem?.created_at || documentItem?.createdAt || null
}

function normalizeDocument(documentItem, documentKey, index) {
  const status = normalizeDocumentStatus(documentItem?.status || documentItem?.document_status || documentItem?.documentStatus)
  return { id: normalizeId(documentItem?.id ?? documentItem?.tqf3Id ?? documentItem?.tqf5Id ?? documentItem?.mqa3Id ?? documentItem?.mqa5Id ?? index), documentKey, requestedCourseItemId: normalizeId(documentItem?.requested_course_item_id ?? documentItem?.requestedCourseItemId ?? documentItem?.opening_course_item_id ?? documentItem?.openingCourseItemId), courseId: normalizeId(documentItem?.course_id ?? documentItem?.courseId ?? documentItem?.master_course_id ?? documentItem?.masterCourseId), courseCode: normalizeText(documentItem?.course_code_snap || documentItem?.courseCodeSnap || documentItem?.course_code || documentItem?.courseCode), creatorId: normalizeId(documentItem?.creator_id ?? documentItem?.creatorId ?? documentItem?.teacher_id ?? documentItem?.teacherId ?? documentItem?.user_id ?? documentItem?.userId), semester: normalizeId(documentItem?.semester ?? documentItem?.term), academicYear: normalizeId(documentItem?.academic_year ?? documentItem?.academicYear ?? documentItem?.year), sectionNumber: normalizeId(documentItem?.section_group ?? documentItem?.sectionGroup ?? documentItem?.section_number ?? documentItem?.sectionNumber ?? documentItem?.group_no ?? documentItem?.groupNo), status, submittedAt: status === 'submitted' ? getSubmittedAt(documentItem) : null, rawData: documentItem }
}

function isTeacherInSelectedMajor(teacher, selectedMajor) {
  const selectedMajorId = getSelectedMajorId(selectedMajor)
  if (!selectedMajorId) return true
  return normalizeId(getDepartmentId(teacher)) === selectedMajorId
}

function normalizeTeacher(teacher) {
  const teacherId = normalizeId(getTeacherId(teacher))
  const teacherName = getFullName(teacher) || `อาจารย์ ID ${teacherId}`
  const role = normalizeRole(teacher.role)
  const departmentName = teacher.department?.department_name || teacher.department?.departmentName || teacher.department?.name || teacher.department_name || teacher.departmentName || ''
  return { teacherId, teacherName, teacherCode: teacher.teacher_code || teacher.teacherCode || `ID-${teacherId}`, role, departmentId: normalizeId(getDepartmentId(teacher)), departmentName, majorName: departmentName, assignedCourseItems: [], rawData: teacher }
}

function mergeUniqueTeachers(userList, currentUser, selectedMajor) {
  const teacherMap = new Map()
  const sourceList = [...getResponseList(userList, ['items', 'data', 'results', 'users'])]
  if (currentUser && isTeacherRole(currentUser.role)) sourceList.push(currentUser)
  sourceList.filter((user) => isTeacherRole(user.role) && isTeacherInSelectedMajor(user, selectedMajor)).forEach((user) => {
    const teacher = normalizeTeacher(user)
    if (teacher.teacherId) teacherMap.set(teacher.teacherId, teacher)
  })
  return Array.from(teacherMap.values()).sort((a, b) => a.teacherName.localeCompare(b.teacherName, 'th'))
}

function getAssignmentTeachers(assignmentItem) {
  const assignedTeachers = getResponseList(assignmentItem?.assigned_teachers ?? assignmentItem?.assignedTeachers, ['items', 'data', 'results'])
  if (assignedTeachers.length) return assignedTeachers
  const assignedTeacherIds = getResponseList(assignmentItem?.assigned_teacher_ids ?? assignmentItem?.assignedTeacherIds, ['items', 'data', 'results'])
  if (assignedTeacherIds.length) return assignedTeacherIds.map((teacherId) => ({ teacher_id: teacherId }))
  return assignmentItem?.primary_teacher || assignmentItem?.primaryTeacher ? [assignmentItem.primary_teacher || assignmentItem.primaryTeacher] : []
}

function getTeacherAssignmentRole(assignmentTeacher) {
  const isPrimary = assignmentTeacher?.is_primary ?? assignmentTeacher?.isPrimary
  if (isPrimary === true || isPrimary === 1 || isPrimary === '1') return 'ผู้รับผิดชอบหลัก'
  return 'ผู้สอนร่วม'
}

function isPrimaryAssignmentRole(value) {
  return normalizeText(value).includes('ผู้รับผิดชอบหลัก')
}

function compareCourseItemsByRoleAndName(a, b) {
  const roleScore = Number(isPrimaryAssignmentRole(b.assignmentRole)) - Number(isPrimaryAssignmentRole(a.assignmentRole))
  if (roleScore !== 0) return roleScore
  return String(a.courseCode || '').localeCompare(String(b.courseCode || ''), 'th') || String(a.courseName || '').localeCompare(String(b.courseName || ''), 'th') || String(a.sectionNumber || '').localeCompare(String(b.sectionNumber || ''), 'th')
}

function compareOverviewRowsByRoleAndName(a, b) {
  const noCourseScore = Number(b.isNoCourseRow === true) - Number(a.isNoCourseRow === true)
  if (noCourseScore !== 0) return noCourseScore
  const roleScore = Number(isPrimaryAssignmentRole(b.assignmentRole)) - Number(isPrimaryAssignmentRole(a.assignmentRole))
  if (roleScore !== 0) return roleScore
  return String(a.teacherName || '').localeCompare(String(b.teacherName || ''), 'th') || String(a.courseCode || '').localeCompare(String(b.courseCode || ''), 'th') || String(a.courseName || '').localeCompare(String(b.courseName || ''), 'th') || String(a.sectionLabel || '').localeCompare(String(b.sectionLabel || ''), 'th')
}

function shouldUseAssignmentForSelectedMajor(assignmentItem, selectedMajor) {
  const selectedMajorId = getSelectedMajorId(selectedMajor)
  const assignmentDepartmentId = normalizeId(assignmentItem.department_id || assignmentItem.departmentId || assignmentItem.major_id || assignmentItem.majorId)
  if (selectedMajorId && assignmentDepartmentId) return selectedMajorId === assignmentDepartmentId
  return true
}

function shouldUseAssignmentForRound(assignmentItem, selectedRound) {
  if (!selectedRound) return true
  const roundSemester = normalizeId(selectedRound.semester)
  const roundAcademicYear = normalizeId(selectedRound.academicYear)
  const assignmentSemester = normalizeId(assignmentItem.semester ?? assignmentItem.term)
  const assignmentAcademicYear = normalizeId(assignmentItem.academic_year ?? assignmentItem.academicYear ?? assignmentItem.year)
  if (roundSemester && assignmentSemester && roundSemester !== assignmentSemester) return false
  if (roundAcademicYear && assignmentAcademicYear && roundAcademicYear !== assignmentAcademicYear) return false
  return true
}

function getOpeningMatchScore(assignmentItem, openingCourse) {
  let score = 0
  const assignmentRequestedItemId = normalizeId(getAssignmentRequestedCourseItemId(assignmentItem))
  const assignmentRequestId = normalizeId(assignmentItem.request_id ?? assignmentItem.requestId)
  const assignmentMasterCourseId = normalizeId(getAssignmentMasterCourseId(assignmentItem))
  const assignmentCourseCode = normalizeSearchText(assignmentItem.course_code || assignmentItem.courseCode)
  const assignmentCourseName = normalizeSearchText(assignmentItem.course_name || assignmentItem.courseName)
  const assignmentSection = normalizeId(assignmentItem.section_number ?? assignmentItem.sectionNumber ?? assignmentItem.group_no ?? assignmentItem.groupNo)
  const assignmentSemester = normalizeId(assignmentItem.semester ?? assignmentItem.term)
  const assignmentAcademicYear = normalizeId(assignmentItem.academic_year ?? assignmentItem.academicYear ?? assignmentItem.year)
  const openingRequestedItemId = normalizeId(openingCourse.id)
  const openingRequestId = normalizeId(openingCourse.requestId)
  const openingCourseId = normalizeId(openingCourse.courseId)
  const openingCourseCode = normalizeSearchText(openingCourse.courseCode)
  const openingCourseName = normalizeSearchText(openingCourse.courseName)
  const openingSection = normalizeId(openingCourse.groupNo)
  const openingSemester = normalizeId(openingCourse.semester)
  const openingAcademicYear = normalizeId(openingCourse.academicYear)
  if (assignmentRequestedItemId && openingRequestedItemId && assignmentRequestedItemId === openingRequestedItemId) score += 1000
  if (assignmentRequestId && openingRequestId && assignmentRequestId === openingRequestId) score += 250
  if (assignmentMasterCourseId && openingCourseId && assignmentMasterCourseId === openingCourseId) score += 180
  if (assignmentCourseCode && openingCourseCode && assignmentCourseCode === openingCourseCode) score += 160
  if (assignmentCourseName && openingCourseName && assignmentCourseName === openingCourseName) score += 70
  if (assignmentSection && openingSection && assignmentSection === openingSection) score += 35
  if (assignmentSemester && openingSemester && assignmentSemester === openingSemester) score += 45
  if (assignmentAcademicYear && openingAcademicYear && assignmentAcademicYear === openingAcademicYear) score += 45
  if (!assignmentRequestedItemId && !assignmentMasterCourseId && !assignmentCourseCode && !assignmentCourseName && !assignmentRequestId) return 0
  return score
}

function findBestOpeningCourseMatch(assignmentItem, openingCourseRows) {
  const matchedList = openingCourseRows.map((openingCourse) => ({ openingCourse, score: getOpeningMatchScore(assignmentItem, openingCourse) })).filter((item) => item.score >= 160).sort((a, b) => b.score - a.score)
  return matchedList[0]?.openingCourse ?? null
}

function buildTeacherFromAssignmentTeacher(assignmentTeacher, selectedMajor) {
  const teacherId = normalizeId(getTeacherId(assignmentTeacher))
  const teacherName = getFullName(assignmentTeacher) || `อาจารย์ ID ${teacherId}`
  const role = normalizeRole(assignmentTeacher.teacher_role || assignmentTeacher.teacherRole || assignmentTeacher.role) || 'teacher'
  return { teacherId, teacherName, teacherCode: `ID-${teacherId}`, role, departmentId: getSelectedMajorId(selectedMajor), departmentName: getSelectedMajorName(selectedMajor), majorName: getSelectedMajorName(selectedMajor), assignedCourseItems: [], rawData: assignmentTeacher }
}

function buildCourseItemFromAssignment(assignmentItem, selectedRound, selectedMajor, assignmentTeacher, openingCourseRows = []) {
  const matchedOpeningCourse = findBestOpeningCourseMatch(assignmentItem, openingCourseRows)
  const groupNumber = assignmentItem.section_number ?? assignmentItem.sectionNumber ?? assignmentItem.section_group ?? assignmentItem.sectionGroup ?? assignmentItem.group_no ?? assignmentItem.groupNo ?? ''
  const requestedCourseItemId = normalizeId(getAssignmentRequestedCourseItemId(assignmentItem))
  const masterCourseId = normalizeId(getAssignmentMasterCourseId(assignmentItem))
  const fallbackCourseId = normalizeId(assignmentItem.course?.id ?? assignmentItem.master_course?.id ?? assignmentItem.masterCourse?.id)
  const sectionNumber = normalizeId(groupNumber || matchedOpeningCourse?.groupNo || '1')
  return { itemId: `${selectedRound?.id || 'round'}-${requestedCourseItemId || matchedOpeningCourse?.id || masterCourseId || fallbackCourseId || assignmentItem.id || assignmentItem.course_code}`, requestedCourseItemId: requestedCourseItemId || matchedOpeningCourse?.id || '', courseId: masterCourseId || matchedOpeningCourse?.courseId || fallbackCourseId, masterCourseId: masterCourseId || matchedOpeningCourse?.courseId || fallbackCourseId, courseCode: assignmentItem.course_code || assignmentItem.courseCode || matchedOpeningCourse?.courseCode || assignmentItem.course?.course_code || assignmentItem.course?.courseCode || '-', courseName: assignmentItem.course_name || assignmentItem.courseName || matchedOpeningCourse?.courseName || assignmentItem.course?.course_name_th || assignmentItem.course?.courseNameTh || assignmentItem.course?.nameThai || '-', sectionLabel: sectionNumber ? `กลุ่ม ${sectionNumber}` : 'ไม่ระบุกลุ่ม', sectionNumber, documentType: selectedRound?.documentType || 'มคอ.3', assignmentRole: getTeacherAssignmentRole(assignmentTeacher), majorName: assignmentItem.major_name || assignmentItem.majorName || matchedOpeningCourse?.majorName || assignmentItem.department_name || assignmentItem.departmentName || getSelectedMajorName(selectedMajor) || '-', semester: normalizeId(assignmentItem.semester ?? assignmentItem.term ?? matchedOpeningCourse?.semester), academicYear: normalizeId(assignmentItem.academic_year ?? assignmentItem.academicYear ?? assignmentItem.year ?? matchedOpeningCourse?.academicYear), submittedAt: null, status: 'pending', backendStatus: 'not_found', documentId: '' }
}

function getDocumentMatchScore(courseItem, documentItem, teacherId, selectedRound) {
  const requestedMatched = courseItem.requestedCourseItemId && documentItem.requestedCourseItemId && courseItem.requestedCourseItemId === documentItem.requestedCourseItemId
  const masterMatched = courseItem.masterCourseId && documentItem.courseId && courseItem.masterCourseId === documentItem.courseId
  const courseCodeMatched = normalizeSearchText(courseItem.courseCode) && normalizeSearchText(documentItem.courseCode) && normalizeSearchText(courseItem.courseCode) === normalizeSearchText(documentItem.courseCode)
  if (!requestedMatched && !masterMatched && !courseCodeMatched) return 0
  let score = requestedMatched ? 180 : masterMatched ? 120 : 70
  if (courseCodeMatched) score += 40
  if (documentItem.creatorId && normalizeId(teacherId) && documentItem.creatorId === normalizeId(teacherId)) score += 90
  if (documentItem.semester && selectedRound?.semester && documentItem.semester === selectedRound.semester) score += 25
  if (documentItem.academicYear && selectedRound?.academicYear && documentItem.academicYear === selectedRound.academicYear) score += 25
  if (documentItem.sectionNumber && courseItem.sectionNumber && documentItem.sectionNumber === courseItem.sectionNumber) score += 25
  if (documentItem.semester && selectedRound?.semester && documentItem.semester !== selectedRound.semester) score -= 60
  if (documentItem.academicYear && selectedRound?.academicYear && documentItem.academicYear !== selectedRound.academicYear) score -= 60
  if (documentItem.sectionNumber && courseItem.sectionNumber && documentItem.sectionNumber !== courseItem.sectionNumber) score -= 40
  return Math.max(score, 0)
}

function findMatchedDocument(courseItem, documentList, teacherId, selectedRound) {
  const matchedRows = documentList.map((documentItem) => ({ documentItem, score: getDocumentMatchScore(courseItem, documentItem, teacherId, selectedRound) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || Number(b.documentItem.id || 0) - Number(a.documentItem.id || 0))
  return matchedRows[0]?.documentItem || null
}

function getCourseDocumentStatus(documentItem, dueAt) {
  if (!documentItem || documentItem.status !== 'submitted') return { status: 'pending', submittedAt: null, backendStatus: documentItem?.status || 'not_found' }
  if (!dueAt || !documentItem.submittedAt) return { status: 'submittedOnTime', submittedAt: documentItem.submittedAt, backendStatus: documentItem.status }
  const submittedDate = new Date(documentItem.submittedAt)
  const dueDate = new Date(dueAt)
  if (Number.isNaN(submittedDate.getTime()) || Number.isNaN(dueDate.getTime())) return { status: 'submittedOnTime', submittedAt: documentItem.submittedAt, backendStatus: documentItem.status }
  return { status: submittedDate.getTime() > dueDate.getTime() ? 'submittedLate' : 'submittedOnTime', submittedAt: documentItem.submittedAt, backendStatus: documentItem.status }
}

function attachAssignmentsToTeachers(teacherList, assignmentList, documentList, selectedRound, selectedMajor, openingCourseRows = []) {
  const teacherMap = new Map(teacherList.map((teacher) => [teacher.teacherId, { ...teacher, assignedCourseItems: [] }]))
  const majorMatchedAssignments = assignmentList.filter((assignmentItem) => shouldUseAssignmentForSelectedMajor(assignmentItem, selectedMajor))
  const roundMatchedAssignments = majorMatchedAssignments.filter((assignmentItem) => shouldUseAssignmentForRound(assignmentItem, selectedRound))
  const assignmentSourceList = roundMatchedAssignments.length ? roundMatchedAssignments : majorMatchedAssignments
  assignmentSourceList.forEach((assignmentItem) => {
    getAssignmentTeachers(assignmentItem).forEach((assignmentTeacher) => {
      const teacherId = normalizeId(getTeacherId(assignmentTeacher))
      if (!teacherId) return
      if (!teacherMap.has(teacherId)) teacherMap.set(teacherId, buildTeacherFromAssignmentTeacher(assignmentTeacher, selectedMajor))
      const courseItemBase = buildCourseItemFromAssignment(assignmentItem, selectedRound, selectedMajor, assignmentTeacher, openingCourseRows)
      const matchedDocument = findMatchedDocument(courseItemBase, documentList, teacherId, selectedRound)
      const documentStatus = getCourseDocumentStatus(matchedDocument, selectedRound?.dueAt)
      teacherMap.get(teacherId).assignedCourseItems.push({ ...courseItemBase, itemId: `${courseItemBase.itemId}-${teacherId}`, submittedAt: documentStatus.submittedAt, status: documentStatus.status, backendStatus: documentStatus.backendStatus, documentId: matchedDocument?.id || '' })
    })
  })
  return Array.from(teacherMap.values()).map((teacher) => ({ ...teacher, assignedCourseItems: teacher.assignedCourseItems.sort(compareCourseItemsByRoleAndName) })).sort((a, b) => a.teacherName.localeCompare(b.teacherName, 'th'))
}

function getTeacherSummary(courseItems) {
  const submittedOnTimeCount = courseItems.filter((item) => item.status === 'submittedOnTime').length
  const submittedLateCount = courseItems.filter((item) => item.status === 'submittedLate').length
  const pendingCount = courseItems.filter((item) => item.status === 'pending').length
  const submittedCount = submittedOnTimeCount + submittedLateCount
  return { totalAssignedCount: courseItems.length, submittedOnTimeCount, submittedLateCount, pendingCount, submittedCount }
}

function getTeacherOverallStatus(summary) {
  if (summary.totalAssignedCount === 0) return { label: 'ยังไม่มีรายวิชา', className: styles.teacherStatusNoCourse }
  if (summary.pendingCount === 0 && summary.submittedLateCount === 0) return { label: 'ส่งครบแล้ว', className: styles.teacherStatusComplete }
  if (summary.pendingCount === 0 && summary.submittedLateCount > 0) return { label: 'ส่งครบแต่มีล่าช้า', className: styles.teacherStatusLate }
  if (summary.submittedCount > 0) return { label: 'ส่งบางส่วน', className: styles.teacherStatusPartial }
  return { label: 'ยังไม่ส่ง', className: styles.teacherStatusPending }
}

const courseStatusMap = {
  submittedOnTime: { label: 'ส่งตรงเวลา', className: styles.statusChipSuccess },
  submittedLate: { label: 'ส่งล่าช้า', className: styles.statusChipLate },
  pending: { label: 'ยังไม่ส่ง', className: styles.statusChipPending },
  noCourse: { label: 'ยังไม่มีรายวิชา', className: styles.teacherStatusNoCourse },
}

function getOverviewRound(roundOptions, selectedRound, documentKey) {
  const sameTermRound = roundOptions.find((round) => round.documentKey === documentKey && normalizeId(round.semester) === normalizeId(selectedRound?.semester) && normalizeId(round.academicYear) === normalizeId(selectedRound?.academicYear))
  const sameTypeRound = roundOptions.find((round) => round.documentKey === documentKey)
  return sameTermRound || sameTypeRound || { ...(selectedRound || fallbackRoundOptions[0]), id: `${documentKey}-overview`, documentKey, documentType: getDocumentTypeLabel(documentKey), label: getDocumentTypeLabel(documentKey), dueAt: null }
}

function getOverviewCourseKey(courseItem) {
  return [courseItem.requestedCourseItemId || courseItem.courseId || courseItem.courseCode, courseItem.sectionNumber || courseItem.sectionLabel || ''].filter(Boolean).join('-')
}

function buildOverviewNoCourseRow(teacher) {
  return { teacherId: teacher.teacherId, teacherName: teacher.teacherName, teacherRole: teacher.role, majorName: teacher.majorName, courseCode: '-', courseName: 'ยังไม่ได้รับมอบหมายรายวิชา', sectionLabel: '-', assignmentRole: 'ยังไม่มีรายวิชา', mqa3Status: 'noCourse', mqa3SubmittedAt: null, mqa5Status: 'noCourse', mqa5SubmittedAt: null, isNoCourseRow: true }
}

function buildOverviewRows(mqa3TeacherItems, mqa5TeacherItems) {
  const rowMap = new Map()
  const teacherMap = new Map()
  const rememberTeacher = (teacher) => teacherMap.set(teacher.teacherId, teacher)
  const appendRows = (teacherList, documentKey) => {
    teacherList.forEach((teacher) => {
      rememberTeacher(teacher)
      teacher.assignedCourseItems.forEach((courseItem) => {
        const rowKey = `${teacher.teacherId}-${getOverviewCourseKey(courseItem)}`
        const previousRow = rowMap.get(rowKey) || { teacherId: teacher.teacherId, teacherName: teacher.teacherName, teacherRole: teacher.role, majorName: teacher.majorName, courseCode: courseItem.courseCode, courseName: courseItem.courseName, sectionLabel: courseItem.sectionLabel, assignmentRole: courseItem.assignmentRole, mqa3Status: 'pending', mqa3SubmittedAt: null, mqa5Status: 'pending', mqa5SubmittedAt: null, isNoCourseRow: false }
        rowMap.set(rowKey, { ...previousRow, [`${documentKey}Status`]: courseItem.status, [`${documentKey}SubmittedAt`]: courseItem.submittedAt })
      })
    })
  }
  appendRows(mqa3TeacherItems, 'mqa3')
  appendRows(mqa5TeacherItems, 'mqa5')
  teacherMap.forEach((teacher) => {
    const hasOverviewCourse = Array.from(rowMap.values()).some((row) => row.teacherId === teacher.teacherId && !row.isNoCourseRow)
    if (!hasOverviewCourse) rowMap.set(`${teacher.teacherId}-no-course`, buildOverviewNoCourseRow(teacher))
  })
  return Array.from(rowMap.values()).sort(compareOverviewRowsByRoleAndName)
}

function buildTeacherItems(teacherList, assignmentList, documentList, selectedRound, selectedMajor, openingCourseRows = []) {
  return attachAssignmentsToTeachers(teacherList, assignmentList, documentList, selectedRound, selectedMajor, openingCourseRows).map((teacher) => ({ ...teacher, filteredCourseItems: teacher.assignedCourseItems, summary: getTeacherSummary(teacher.assignedCourseItems), majorName: getSelectedMajorName(selectedMajor) || teacher.majorName || teacher.departmentName || '-' }))
}

function getFilteredTeacherItems(teacherItems, searchText) {
  const keyword = normalizeSearchText(searchText)
  if (!keyword) return teacherItems.map((teacher) => ({ ...teacher, filteredCourseItems: teacher.assignedCourseItems, summary: getTeacherSummary(teacher.assignedCourseItems) }))
  return teacherItems.map((teacher) => {
    const filteredCourseItems = teacher.assignedCourseItems.filter((courseItem) => normalizeSearchText(courseItem.courseCode).includes(keyword) || normalizeSearchText(courseItem.courseName).includes(keyword) || normalizeSearchText(courseItem.sectionLabel).includes(keyword) || normalizeSearchText(courseItem.assignmentRole).includes(keyword))
    const hasMatchedTeacher = normalizeSearchText(teacher.teacherName).includes(keyword) || normalizeSearchText(teacher.teacherCode).includes(keyword) || normalizeSearchText(teacher.role).includes(keyword)
    if (!hasMatchedTeacher && !filteredCourseItems.length) return null
    const nextCourseItems = hasMatchedTeacher ? teacher.assignedCourseItems : filteredCourseItems
    return { ...teacher, filteredCourseItems: nextCourseItems.sort(compareCourseItemsByRoleAndName), summary: getTeacherSummary(nextCourseItems) }
  }).filter(Boolean)
}

function summarizePage(teacherItems) {
  const totalAssignedCount = teacherItems.reduce((sum, teacher) => sum + teacher.summary.totalAssignedCount, 0)
  const submittedOnTimeCount = teacherItems.reduce((sum, teacher) => sum + teacher.summary.submittedOnTimeCount, 0)
  const submittedLateCount = teacherItems.reduce((sum, teacher) => sum + teacher.summary.submittedLateCount, 0)
  const pendingCount = teacherItems.reduce((sum, teacher) => sum + teacher.summary.pendingCount, 0)
  return { totalTeacherCount: teacherItems.length, totalAssignedCount, submittedOnTimeCount, submittedLateCount, pendingCount }
}

function ManageDocumentCheckPage() {
  const location = useLocation()
  const apiUrl = import.meta.env.VITE_API_URL
  const selectedMajorFromState = location.state?.major || null
  const [selectedRoundId, setSelectedRoundId] = useState('')
  const [searchText, setSearchText] = useState('')
  const [expandedTeacherIds, setExpandedTeacherIds] = useState([])
  const [overviewDialog, setOverviewDialog] = useState({ open: false, scope: 'major', teacherId: '' })
  const [teacherBaseList, setTeacherBaseList] = useState([])
  const [assignmentList, setAssignmentList] = useState([])
  const [openingCourseRows, setOpeningCourseRows] = useState([])
  const [deadlineList, setDeadlineList] = useState([])
  const [tqf3DocumentList, setTqf3DocumentList] = useState([])
  const [tqf5DocumentList, setTqf5DocumentList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const safeGet = useCallback(async (endpoint, config, fallbackData = []) => {
    try {
      const response = await axios.get(getApiUrl(apiUrl, endpoint), config)
      return response.data
    } catch (error) {
      console.warn(`Optional API failed: ${endpoint}`, error)
      return fallbackData
    }
  }, [apiUrl])

  const fetchApprovedCourseAssignments = useCallback(async (config) => {
    const limit = 100
    let page = 1
    let allItems = []
    let shouldContinue = true
    while (shouldContinue && page <= 30) {
      const response = await axios.get(getApiUrl(apiUrl, ASSIGNMENT_ENDPOINT), { ...config, params: { page, limit } })
      const itemList = getResponseList(response.data, ['items', 'data', 'results', 'courses', 'approved_courses', 'approvedCourses'])
      allItems = [...allItems, ...itemList]
      shouldContinue = itemList.length === limit
      page += 1
    }
    return allItems
  }, [apiUrl])

  const fetchPageData = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const config = getAuthConfig()
      const [userResponse, currentUserData, assignmentItems, openingRows, deadlineData, tqf3Data, tqf5Data] = await Promise.all([axios.get(getApiUrl(apiUrl, USERS_ENDPOINT), config), safeGet(CURRENT_USER_ENDPOINT, config, null), fetchApprovedCourseAssignments(config), fetchCourseOpeningCourseRows(apiUrl), safeGet(DEADLINE_ENDPOINT, config, []), safeGet(TQF3_ENDPOINT, config, []), safeGet(TQF5_ENDPOINT, config, [])])
      setTeacherBaseList(mergeUniqueTeachers(userResponse.data, currentUserData, selectedMajorFromState))
      setAssignmentList(assignmentItems)
      setOpeningCourseRows(openingRows)
      setDeadlineList(getResponseList(deadlineData, ['items', 'data', 'results', 'deadlines']))
      setTqf3DocumentList(getResponseList(tqf3Data, ['items', 'data', 'results', 'tqf3', 'documents']).map((item, index) => normalizeDocument(item, 'mqa3', index)))
      setTqf5DocumentList(getResponseList(tqf5Data, ['items', 'data', 'results', 'tqf5', 'documents']).map((item, index) => normalizeDocument(item, 'mqa5', index)))
    } catch (error) {
      console.error('Error fetching document check data:', error)
      setErrorMessage(error.response?.data?.detail || 'ไม่สามารถดึงรายชื่ออาจารย์หรือรายการมอบหมายรายวิชาได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsLoading(false)
    }
  }, [apiUrl, fetchApprovedCourseAssignments, safeGet, selectedMajorFromState])

  useEffect(() => { fetchPageData() }, [fetchPageData])

  const roundOptions = useMemo(() => buildRoundOptions(deadlineList), [deadlineList])
  useEffect(() => {
    if (!roundOptions.length) return
    if (!selectedRoundId || !roundOptions.some((item) => item.id === selectedRoundId)) setSelectedRoundId(roundOptions[0].id)
  }, [roundOptions, selectedRoundId])

  const selectedRound = useMemo(() => roundOptions.find((item) => item.id === selectedRoundId) || roundOptions[0] || fallbackRoundOptions[0], [roundOptions, selectedRoundId])
  const selectedDocumentList = selectedRound?.documentKey === 'mqa5' ? tqf5DocumentList : tqf3DocumentList
  const allTeacherItems = useMemo(() => buildTeacherItems(teacherBaseList, assignmentList, selectedDocumentList, selectedRound, selectedMajorFromState, openingCourseRows), [teacherBaseList, assignmentList, selectedDocumentList, selectedRound, selectedMajorFromState, openingCourseRows])
  const overviewMqa3Round = useMemo(() => getOverviewRound(roundOptions, selectedRound, 'mqa3'), [roundOptions, selectedRound])
  const overviewMqa5Round = useMemo(() => getOverviewRound(roundOptions, selectedRound, 'mqa5'), [roundOptions, selectedRound])
  const overviewMqa3TeacherItems = useMemo(() => buildTeacherItems(teacherBaseList, assignmentList, tqf3DocumentList, overviewMqa3Round, selectedMajorFromState, openingCourseRows), [teacherBaseList, assignmentList, tqf3DocumentList, overviewMqa3Round, selectedMajorFromState, openingCourseRows])
  const overviewMqa5TeacherItems = useMemo(() => buildTeacherItems(teacherBaseList, assignmentList, tqf5DocumentList, overviewMqa5Round, selectedMajorFromState, openingCourseRows), [teacherBaseList, assignmentList, tqf5DocumentList, overviewMqa5Round, selectedMajorFromState, openingCourseRows])
  const overviewRows = useMemo(() => buildOverviewRows(overviewMqa3TeacherItems, overviewMqa5TeacherItems), [overviewMqa3TeacherItems, overviewMqa5TeacherItems])
  const teacherItems = useMemo(() => getFilteredTeacherItems(allTeacherItems, searchText), [allTeacherItems, searchText])
  const pageSummary = useMemo(() => summarizePage(allTeacherItems), [allTeacherItems])
  const displayMajorName = getSelectedMajorName(selectedMajorFromState) || allTeacherItems[0]?.majorName || 'สาขาตามสิทธิ์ผู้ใช้งาน'
  const overviewTeacherName = useMemo(() => allTeacherItems.find((teacher) => teacher.teacherId === overviewDialog.teacherId)?.teacherName || '', [allTeacherItems, overviewDialog.teacherId])
  const displayedOverviewRows = useMemo(() => overviewDialog.scope === 'teacher' ? overviewRows.filter((row) => row.teacherId === overviewDialog.teacherId) : overviewRows, [overviewDialog.scope, overviewDialog.teacherId, overviewRows])
  const overviewSummary = useMemo(() => ({ total: displayedOverviewRows.length, mqa3Submitted: displayedOverviewRows.filter((row) => row.mqa3Status === 'submittedOnTime' || row.mqa3Status === 'submittedLate').length, mqa5Submitted: displayedOverviewRows.filter((row) => row.mqa5Status === 'submittedOnTime' || row.mqa5Status === 'submittedLate').length, bothSubmitted: displayedOverviewRows.filter((row) => (row.mqa3Status === 'submittedOnTime' || row.mqa3Status === 'submittedLate') && (row.mqa5Status === 'submittedOnTime' || row.mqa5Status === 'submittedLate')).length }), [displayedOverviewRows])

  useEffect(() => {
    setExpandedTeacherIds((previousIds) => previousIds.filter((teacherId) => teacherItems.some((teacher) => teacher.teacherId === teacherId)))
  }, [teacherItems])

  const handleToggleExpand = (teacherId) => setExpandedTeacherIds((previousIds) => previousIds.includes(teacherId) ? previousIds.filter((item) => item !== teacherId) : [...previousIds, teacherId])
  const handleExpandAll = () => setExpandedTeacherIds(teacherItems.map((teacher) => teacher.teacherId))
  const handleCollapseAll = () => setExpandedTeacherIds([])
  const handleOpenMajorOverview = () => setOverviewDialog({ open: true, scope: 'major', teacherId: '' })
  const handleOpenTeacherOverview = (teacherId) => setOverviewDialog({ open: true, scope: 'teacher', teacherId })
  const handleCloseOverview = () => setOverviewDialog({ open: false, scope: 'major', teacherId: '' })

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />
      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>ตรวจเอกสาร มคอ.</Typography>
            <Typography className={styles.pageDescription}>หน้านี้ใช้สำหรับตรวจสอบว่าอาจารย์ในสาขาได้รับมอบหมายรายวิชาและกลุ่มเรียนอะไรบ้าง และได้ส่งเอกสาร มคอ. ตามรอบที่กำหนดแล้วหรือยัง พร้อมดูเวลาในการส่งและแยกสถานะตรงเวลา ล่าช้า หรือยังไม่ส่ง</Typography>
          </Box>
        </Box>

        <Box className={styles.filterCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>ตัวกรองและข้อมูลรอบส่ง</Typography>
              <Typography className={styles.sectionDescription}>{isLoading ? 'กำลังดึงข้อมูลจาก API...' : 'ข้อมูลถูกดึงจากรายชื่ออาจารย์ในสาขา รายการมอบหมายรายวิชา เอกสาร มคอ. และรอบกำหนดส่ง'}</Typography>
            </Box>
            <Chip icon={<FactCheckRoundedIcon />} label={`กำลังตรวจ ${selectedRound.label}`} className={styles.roundChip} />
          </Box>

          <Box className={styles.filterGrid}>
            <TextField select fullWidth label="เลือกรอบส่งเอกสาร" value={selectedRound?.id || ''} onChange={(event) => setSelectedRoundId(event.target.value)} disabled={isLoading}>
              {roundOptions.map((item) => <MenuItem key={item.id} value={item.id}>{item.label}</MenuItem>)}
            </TextField>
            <TextField fullWidth label="ค้นหาอาจารย์ / รหัสวิชา / ชื่อรายวิชา / กลุ่มเรียน" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="เช่น MMT1101 หรือ กลุ่ม 2" InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }} />
          </Box>

          <Box className={styles.metaGrid}>
            <Box className={styles.metaCard}><Typography className={styles.metaLabel}>สาขาที่กำลังตรวจ</Typography><Typography className={styles.metaValue}>{displayMajorName}</Typography></Box>
            <Box className={styles.metaCard}><Typography className={styles.metaLabel}>เอกสารรอบนี้</Typography><Typography className={styles.metaValue}>{selectedRound.documentType}</Typography></Box>
            <Box className={styles.metaCard}><Typography className={styles.metaLabel}>กำหนดส่ง</Typography><Typography className={styles.metaValue}>{selectedRound.dueAt ? `${formatThaiDateTime(selectedRound.dueAt)} น.` : 'ยังไม่พบกำหนดส่ง'}</Typography></Box>
            <Box className={styles.metaCard}><Box className={styles.metaLabelWithIcon}><GroupsRoundedIcon fontSize="small" /><Typography className={styles.metaLabel}>จำนวนอาจารย์ในสาขานี้</Typography></Box><Typography className={styles.metaValue}>{pageSummary.totalTeacherCount} คน</Typography></Box>
          </Box>
        </Box>

        <Box className={styles.listCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>รายชื่ออาจารย์และสถานะการส่งเอกสาร</Typography>
              <Typography className={styles.sectionDescription}>กดดูรายละเอียดเพื่อเช็กแต่ละรายการตามรหัสวิชา ชื่อวิชา กลุ่มเรียน และเวลาที่ส่งเอกสาร</Typography>
            </Box>
            <Box className={styles.headerButtonGroup}>
              <Button variant="contained" onClick={handleOpenMajorOverview} className={styles.headerButton} disabled={isLoading || !overviewRows.length}>ดูภาพรวมทั้งสาขา</Button>
              <Button variant="outlined" onClick={handleExpandAll} className={styles.headerButton} disabled={isLoading || !teacherItems.length}>แสดงทั้งหมด</Button>
              <Button variant="outlined" onClick={handleCollapseAll} className={styles.headerButton} disabled={isLoading || !teacherItems.length}>ย่อทั้งหมด</Button>
            </Box>
          </Box>

          {isLoading ? (
            <Box className={styles.emptyState}><Typography className={styles.emptyTitle}>กำลังโหลดข้อมูล</Typography><Typography className={styles.emptyDescription}>ระบบกำลังดึงข้อมูลจาก API กรุณารอสักครู่</Typography></Box>
          ) : errorMessage ? (
            <Box className={styles.emptyState}><Typography className={styles.emptyTitle}>ดึงข้อมูลไม่สำเร็จ</Typography><Typography className={styles.emptyDescription}>{errorMessage}</Typography><Button variant="contained" className={styles.headerButton} onClick={fetchPageData}>ลองโหลดใหม่</Button></Box>
          ) : !teacherItems.length ? (
            <Box className={styles.emptyState}><Typography className={styles.emptyTitle}>ไม่พบข้อมูลที่ค้นหา</Typography><Typography className={styles.emptyDescription}>{allTeacherItems.length ? 'ลองเปลี่ยนคำค้นหา หรือเลือกรอบส่งเอกสารอื่น' : 'ยังไม่พบอาจารย์ในสาขานี้ หรือ API /users/ ยังไม่ส่งข้อมูลอาจารย์กลับมา'}</Typography></Box>
          ) : (
            <Box className={styles.teacherList}>
              {teacherItems.map((teacher) => {
                const isExpanded = expandedTeacherIds.includes(teacher.teacherId)
                const teacherStatus = getTeacherOverallStatus(teacher.summary)
                return (
                  <Box key={teacher.teacherId} className={styles.teacherCard}>
                    <Box className={styles.teacherCardTop}>
                      <Box><Typography className={styles.teacherName}>{teacher.teacherName}</Typography><Typography className={styles.teacherSubtext}>{teacher.role === 'headmajor' ? 'หัวหน้าสาขา' : 'อาจารย์'} • {teacher.majorName}</Typography></Box>
                      <Box className={styles.teacherTopActions}><Chip label={teacherStatus.label} className={teacherStatus.className} /><Button variant="outlined" onClick={() => handleOpenTeacherOverview(teacher.teacherId)} className={styles.expandButton} disabled={!overviewRows.some((row) => row.teacherId === teacher.teacherId)}>ดูภาพรวมรายคน</Button><Button variant="outlined" onClick={() => handleToggleExpand(teacher.teacherId)} endIcon={isExpanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />} className={styles.expandButton}>{isExpanded ? 'ย่อรายละเอียด' : 'ดูรายละเอียด'}</Button></Box>
                    </Box>
                    <Box className={styles.teacherSummaryGrid}>
                      <Box className={`${styles.teacherSummaryCard} ${teacher.summary.totalAssignedCount ? styles.summaryCardAssigned : styles.summaryCardNoCourse}`}><Typography className={styles.teacherSummaryLabel}>รายการที่รับผิดชอบ</Typography><Typography className={styles.teacherSummaryValue}>{teacher.summary.totalAssignedCount}</Typography></Box>
                      <Box className={`${styles.teacherSummaryCard} ${styles.summaryCardSubmitted}`}><Typography className={styles.teacherSummaryLabel}>ส่งแล้ว</Typography><Typography className={styles.teacherSummaryValue}>{teacher.summary.submittedCount}</Typography></Box>
                      <Box className={`${styles.teacherSummaryCard} ${styles.summaryCardPending}`}><Typography className={styles.teacherSummaryLabel}>ยังไม่ส่ง</Typography><Typography className={styles.teacherSummaryValue}>{teacher.summary.pendingCount}</Typography></Box>
                    </Box>
                    {isExpanded && (
                      <Box className={styles.detailSection}>
                        <Divider className={styles.detailDivider} />
                        {!teacher.filteredCourseItems.length ? (
                          <Box className={styles.emptyState}><Typography className={styles.emptyTitle}>ยังไม่มีรายวิชาที่ได้รับมอบหมายในรอบนี้</Typography><Typography className={styles.emptyDescription}>เมื่อมีการมอบหมายรายวิชาจากหน้าจัดการรายวิชา รายการจะแสดงที่นี่</Typography></Box>
                        ) : (
                          <Box className={styles.courseList}>
                            {teacher.filteredCourseItems.map((courseItem) => {
                              const statusData = courseStatusMap[courseItem.status] || courseStatusMap.pending
                              return (
                                <Box key={courseItem.itemId} className={styles.courseCard}>
                                  <Box className={styles.courseInfoBlock}>
                                    <Typography className={styles.courseCode}>{courseItem.courseCode}</Typography>
                                    <Typography className={styles.courseName}>{courseItem.courseName}</Typography>
                                    <Box className={styles.courseMetaRow}><Chip label={courseItem.sectionLabel} className={styles.sectionChip} /><Chip label={courseItem.assignmentRole} className={styles.sectionChip} /><Typography className={styles.courseSubtext}>เอกสารที่ต้องส่ง: {courseItem.documentType}</Typography></Box>
                                  </Box>
                                  <Box className={styles.courseRightSide}>
                                    <Chip label={statusData.label} className={statusData.className} />
                                    <Box className={styles.timeCard}><AccessTimeRoundedIcon fontSize="small" /><Box><Typography className={styles.timeLabel}>เวลาที่ส่งเอกสาร</Typography><Typography className={styles.timeValue}>{formatThaiDateTime(courseItem.submittedAt)}</Typography></Box></Box>
                                  </Box>
                                </Box>
                              )
                            })}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>
      </Box>

      <Dialog open={overviewDialog.open} onClose={handleCloseOverview} maxWidth="lg" fullWidth PaperProps={{ className: styles.overviewDialogPaper }}>
        <DialogTitle className={styles.overviewDialogTitle}>
          <Box>
            <Typography className={styles.overviewTitle}>{overviewDialog.scope === 'teacher' ? `ภาพรวมการส่งเอกสารของ ${overviewTeacherName || 'อาจารย์'}` : `ภาพรวมการส่งเอกสารทั้งสาขา${displayMajorName ? ` ${displayMajorName}` : ''}`}</Typography>
            <Typography className={styles.overviewSubtitle}>แสดงสถานะ มคอ.3 และ มคอ.5 ของรายวิชาเดียวกันในตารางเดียว รวมถึงอาจารย์ที่ยังไม่ได้รับมอบหมายรายวิชา เพื่อใช้ตรวจสอบภาพรวมโดยไม่ต้องสลับรอบเอกสาร</Typography>
          </Box>
          <Button variant="outlined" onClick={handleCloseOverview} className={styles.headerButton}>ปิด</Button>
        </DialogTitle>
        <DialogContent className={styles.overviewDialogContent}>
          <Box className={styles.overviewSummaryGrid}>
            <Box className={`${styles.overviewSummaryCard} ${styles.summaryCardAssigned}`}><Typography className={styles.teacherSummaryLabel}>รายการทั้งหมด</Typography><Typography className={styles.teacherSummaryValue}>{overviewSummary.total}</Typography></Box>
            <Box className={`${styles.overviewSummaryCard} ${styles.summaryCardSubmitted}`}><Typography className={styles.teacherSummaryLabel}>ส่ง มคอ.3 แล้ว</Typography><Typography className={styles.teacherSummaryValue}>{overviewSummary.mqa3Submitted}</Typography></Box>
            <Box className={`${styles.overviewSummaryCard} ${styles.summaryCardSubmitted}`}><Typography className={styles.teacherSummaryLabel}>ส่ง มคอ.5 แล้ว</Typography><Typography className={styles.teacherSummaryValue}>{overviewSummary.mqa5Submitted}</Typography></Box>
            <Box className={`${styles.overviewSummaryCard} ${overviewSummary.bothSubmitted === overviewSummary.total && overviewSummary.total ? styles.summaryCardSubmitted : styles.summaryCardPending}`}><Typography className={styles.teacherSummaryLabel}>ส่งครบทั้งสองเอกสาร</Typography><Typography className={styles.teacherSummaryValue}>{overviewSummary.bothSubmitted}</Typography></Box>
          </Box>
          {!displayedOverviewRows.length ? (
            <Box className={styles.emptyState}><Typography className={styles.emptyTitle}>ยังไม่มีข้อมูลสำหรับภาพรวม</Typography><Typography className={styles.emptyDescription}>เมื่อมีรายวิชาที่ได้รับมอบหมาย รายการสถานะ มคอ.3 และ มคอ.5 จะแสดงที่นี่</Typography></Box>
          ) : (
            <Box className={styles.overviewTableWrap}>
              <Box className={`${styles.overviewTableRow} ${styles.overviewTableHead}`}>
                <Typography>อาจารย์</Typography>
                <Typography>รายวิชา</Typography>
                <Typography>กลุ่ม / บทบาท</Typography>
                <Typography>มคอ.3</Typography>
                <Typography>มคอ.5</Typography>
              </Box>
              {displayedOverviewRows.map((row) => {
                const mqa3Status = courseStatusMap[row.mqa3Status] || courseStatusMap.pending
                const mqa5Status = courseStatusMap[row.mqa5Status] || courseStatusMap.pending
                return (
                  <Box key={`${row.teacherId}-${row.courseCode}-${row.sectionLabel}-${row.assignmentRole}`} className={styles.overviewTableRow}>
                    <Box><Typography className={styles.overviewPrimaryText}>{row.teacherName}</Typography><Typography className={styles.overviewSubText}>{row.majorName || '-'}</Typography></Box>
                    <Box><Typography className={styles.overviewCourseCode}>{row.courseCode}</Typography><Typography className={styles.overviewPrimaryText}>{row.courseName}</Typography></Box>
                    <Box className={styles.overviewChipGroup}><Chip label={row.sectionLabel} className={styles.sectionChip} size="small" /><Chip label={row.assignmentRole} className={styles.sectionChip} size="small" /></Box>
                    <Box className={styles.overviewStatusCell}><Chip label={mqa3Status.label} className={mqa3Status.className} size="small" /><Typography className={styles.overviewSubText}>{formatThaiDateTime(row.mqa3SubmittedAt)}</Typography></Box>
                    <Box className={styles.overviewStatusCell}><Chip label={mqa5Status.label} className={mqa5Status.className} size="small" /><Typography className={styles.overviewSubText}>{formatThaiDateTime(row.mqa5SubmittedAt)}</Typography></Box>
                  </Box>
                )
              })}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default ManageDocumentCheckPage