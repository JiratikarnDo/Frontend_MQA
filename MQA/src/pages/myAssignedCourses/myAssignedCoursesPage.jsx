import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded'
import DocumentSelectDialog from './documentSelectDialog/documentSelectDialog'
import styles from './myAssignedCoursesPage.module.css'

const ASSIGNED_COURSES_ENDPOINT = '/course-assignment/my-primary-courses'
const COURSE_OPENING_ENDPOINT = '/course-opening/'
const TQF3_ENDPOINT = '/tqf3/'
const TQF5_ENDPOINT = '/tqf5/'

const getAuthConfig = () => {
  const token = localStorage.getItem('mqa_token')
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} }
}

const normalizeText = (value) => String(value ?? '').trim()
const normalizeCompareText = (value) => normalizeText(value).toLowerCase().replace(/[\s\-_./]+/g, '')
const getApiUrl = (apiUrl, path) => `${String(apiUrl || '').replace(/\/$/, '')}${path}`

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
  if (data?.data && typeof data.data === 'object') return data.data
  if (data?.item && typeof data.item === 'object') return data.item
  if (data?.result && typeof data.result === 'object') return data.result
  return data
}

const getErrorMessage = (error, fallbackMessage) => {
  const detail = error?.response?.data?.detail
  const message = error?.response?.data?.message
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(', ')
  return detail || message || fallbackMessage
}

function getNestedValue(object, keyList = []) {
  for (const key of keyList) {
    const value = key.split('.').reduce((current, part) => current?.[part], object)
    if (value !== undefined && value !== null && value !== '') return value
  }
  return ''
}

function getCourseOpeningRequestId(item) {
  return item?.id ?? item?.request_id ?? item?.requestId ?? item?.course_opening_request_id ?? item?.courseOpeningRequestId ?? null
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

function inferCourseOpeningLevel(data = {}) {
  const explicitLevel = normalizeText(data?.level ?? data?.curriculum_level ?? data?.curriculumLevel ?? data?.education_level ?? data?.educationLevel ?? data?.degree_level ?? data?.degreeLevel).toLowerCase()
  if (['bachelor', 'master', 'doctoral'].includes(explicitLevel)) return explicitLevel
  if (explicitLevel.includes('ตรี') || explicitLevel.includes('bachelor')) return 'bachelor'
  if (explicitLevel.includes('โท') || explicitLevel.includes('master')) return 'master'
  if (explicitLevel.includes('เอก') || explicitLevel.includes('doctoral') || explicitLevel.includes('phd') || explicitLevel.includes('doctor')) return 'doctoral'

  const programType = normalizeText(data?.program_type ?? data?.programType ?? data?.study_plan ?? data?.studyPlan).toLowerCase()
  const targetGroup = normalizeText(data?.target_group ?? data?.targetGroup).toLowerCase()
  const curriculumName = normalizeText(data?.curriculum_name ?? data?.curriculumName ?? data?.curriculum_name_thai ?? data?.curriculumNameThai).toLowerCase()

  if (programType === '1.1' || programType === '1.2' || targetGroup === '1.1' || targetGroup === '1.2' || curriculumName.includes('ดุษฎีบัณฑิต') || curriculumName.includes('ปรัชญาดุษฎีบัณฑิต') || curriculumName.includes('ปริญญาเอก')) return 'doctoral'
  if (programType === 'plana' || programType === 'plana2' || programType === 'planb' || programType === 'plan_a' || programType === 'plan_a2' || programType === 'plan_b' || curriculumName.includes('มหาบัณฑิต') || curriculumName.includes('ปริญญาโท')) return 'master'
  if (programType === '4year' || programType === '4-year' || programType === 'transfer' || curriculumName.includes('ปริญญาตรี') || curriculumName.includes('วิทยาศาสตรบัณฑิต') || curriculumName.includes('บริหารธุรกิจบัณฑิต') || curriculumName.includes('ศิลปศาสตรบัณฑิต') || curriculumName.includes('บัณฑิต')) return 'bachelor'

  return ''
}

function normalizeCourseOpeningRequest(apiData, fallbackData = {}) {
  const data = { ...fallbackData, ...apiData }
  const id = getCourseOpeningRequestId(data)
  const status = normalizeText(data?.status).toLowerCase()
  const curriculumName = data?.curriculum_name ?? data?.curriculumName ?? data?.documentData?.generalForm?.curriculumName ?? ''
  const majorName = data?.major_name ?? data?.majorName ?? data?.documentData?.generalForm?.majorName ?? ''
  const semester = String(data?.semester ?? data?.documentData?.generalForm?.semester ?? '')
  const academicYear = String(data?.academic_year ?? data?.academicYear ?? data?.documentData?.generalForm?.academicYear ?? '')
  const programType = data?.program_type ?? data?.programType ?? data?.study_plan ?? data?.studyPlan ?? ''
  const targetGroup = data?.target_group ?? data?.targetGroup ?? ''
  const level = inferCourseOpeningLevel({ ...data, curriculum_name: curriculumName, curriculumName, program_type: programType, programType, target_group: targetGroup, targetGroup })
  const requestedCourses = getResponseList(data, ['requested_courses', 'requestedCourses']).map((course, index) => ({
    id: course?.id ?? course?.requested_course_item_id ?? course?.requestedCourseItemId ?? `${id || 'request'}-${index}`,
    requestId: id,
    level,
    status,
    curriculumName,
    majorName,
    semester,
    academicYear,
    courseId: normalizeText(course?.course_id ?? course?.courseId ?? course?.id_course ?? course?.course?.id ?? course?.course?.course_id ?? course?.course?.courseId ?? ''),
    courseCode: normalizeText(course?.course_code_snapshot ?? course?.courseCode ?? course?.course_code ?? course?.course?.course_code ?? course?.course?.courseCode ?? ''),
    courseName: normalizeText(course?.course_name_snapshot ?? course?.courseName ?? course?.course_name ?? course?.course?.course_name_th ?? course?.course?.courseNameTh ?? ''),
    groupNo: normalizeText(course?.group_no ?? course?.groupNo ?? course?.section_number ?? course?.sectionNumber ?? '1'),
    yearLevel: String(course?.year_level ?? course?.yearLevel ?? ''),
    studentCount: course?.student_count ?? course?.studentCount ?? 0,
    rawData: course,
  }))
  return { id, status, level, curriculumName, majorName, semester, academicYear, programType, targetGroup, requestedCourses, rawData: data }
}

async function fetchCourseOpeningCourseRows(apiUrl) {
  const fetchOpeningList = async () => {
    try {
      const response = await axios.get(`${apiUrl}${COURSE_OPENING_ENDPOINT}`, { ...getAuthConfig(), params: { page: 1, limit: 100 } })
      return getResponseList(response.data, ['items', 'data', 'results', 'requests'])
    } catch (firstError) {
      try {
        const response = await axios.get(`${apiUrl}${COURSE_OPENING_ENDPOINT}`, getAuthConfig())
        return getResponseList(response.data, ['items', 'data', 'results', 'requests'])
      } catch (secondError) {
        console.warn('Cannot fetch course opening list for assigned-course level matching:', firstError, secondError)
        return []
      }
    }
  }

  const summaryList = await fetchOpeningList()
  const requestList = await Promise.all(summaryList.map(async (summaryItem) => {
    const requestId = getCourseOpeningRequestId(summaryItem)
    if (!requestId) return normalizeCourseOpeningRequest(summaryItem)

    try {
      const detailResponse = await axios.get(`${apiUrl}${COURSE_OPENING_ENDPOINT}${requestId}`, getAuthConfig())
      return normalizeCourseOpeningRequest(getResponseObject(detailResponse.data), summaryItem)
    } catch (error) {
      return normalizeCourseOpeningRequest(summaryItem)
    }
  }))

  return requestList.flatMap((requestItem) => requestItem.requestedCourses.map((course) => ({ ...course, requestStatus: requestItem.status, requestRawData: requestItem.rawData })))
}

async function fetchTqfDocumentRows(apiUrl, endpoint, documentType) {
  try {
    const response = await axios.get(getApiUrl(apiUrl, endpoint), getAuthConfig())
    return getResponseList(response.data, ['items', 'data', 'results', 'tqf3', 'tqf5', 'documents']).map((item, index) => normalizeTqfDocumentRow(item, documentType, index))
  } catch (error) {
    console.warn(`Cannot fetch ${documentType} documents:`, error)
    return []
  }
}

function buildTeacherName(teacherData, fallback = '') {
  const directName = getNestedValue(teacherData, ['full_name', 'fullName', 'name', 'display_name', 'displayName', 'teacher_name', 'teacherName'])
  if (directName) return directName
  const prefix = getNestedValue(teacherData, ['prefixname', 'prefixName', 'prefix', 'title', 'academic_title', 'academicTitle'])
  const firstName = getNestedValue(teacherData, ['first_name', 'firstName', 'firstname', 'given_name', 'givenName'])
  const lastName = getNestedValue(teacherData, ['last_name', 'lastName', 'lastname', 'surname', 'family_name', 'familyName'])
  const builtName = normalizeText(`${prefix} ${firstName} ${lastName}`)
  return builtName || fallback || '-'
}

function normalizeTqfDocumentRow(row, documentType, index) {
  return {
    id: getNestedValue(row, ['id', 'tqf3_id', 'tqf3Id', 'tqf5_id', 'tqf5Id']) || `${documentType}-${index}`,
    documentType,
    requestedCourseItemId: normalizeText(getNestedValue(row, ['requested_course_item_id', 'requestedCourseItemId', 'opening_course_item_id', 'openingCourseItemId', 'course_item_id', 'courseItemId'])),
    courseId: normalizeText(getNestedValue(row, ['course_id', 'courseId', 'course.id'])),
    courseCode: normalizeText(getNestedValue(row, ['course_code_snap', 'courseCodeSnap', 'course_code', 'courseCode', 'course.course_code', 'course.courseCode'])),
    semester: String(getNestedValue(row, ['semester', 'term']) || ''),
    academicYear: String(getNestedValue(row, ['academic_year', 'academicYear', 'year']) || ''),
    sectionNumber: String(getNestedValue(row, ['section_group', 'sectionGroup', 'section_number', 'sectionNumber', 'group_no', 'groupNo']) || ''),
    status: normalizeDocumentStatus(getNestedValue(row, ['status', 'document_status', 'documentStatus'])),
    submittedAt: getNestedValue(row, ['submitted_at', 'submittedAt', 'updated_at', 'updatedAt']) || null,
    rawData: row,
  }
}

function normalizeAssignedCourseBaseRow(row, index) {
  const requestData = getNestedValue(row, ['request', 'course_opening_request', 'courseOpeningRequest', 'opening_request', 'openingRequest', 'requested_course_item.request', 'requestedCourseItem.request', 'requested_course_item.course_opening_request', 'requestedCourseItem.courseOpeningRequest', 'course_item.request', 'courseItem.request']) || {}
  const courseData = getNestedValue(row, ['course', 'course_data', 'courseData', 'requested_course_item.course', 'requestedCourseItem.course']) || {}
  const requestedItem = getNestedValue(row, ['requested_course_item', 'requestedCourseItem', 'course_item', 'courseItem', 'item']) || {}
  const teacherData = getNestedValue(row, ['teacher', 'assigned_teacher', 'assignedTeacher', 'primary_teacher', 'primaryTeacher']) || {}
  const requestId = normalizeText(getNestedValue(row, ['request_id', 'requestId', 'course_opening_request_id', 'courseOpeningRequestId', 'opening_request_id', 'openingRequestId', 'requested_course_item.request_id', 'requestedCourseItem.request_id', 'requested_course_item.course_opening_request_id', 'requestedCourseItem.courseOpeningRequestId']) || getNestedValue(requestData, ['id', 'request_id', 'requestId']))
  const requestedCourseItemId = normalizeText(getNestedValue(row, ['requested_course_item_id', 'requestedCourseItemId', 'course_item_id', 'courseItemId', 'item_id', 'itemId', 'requested_course_item.id', 'requestedCourseItem.id']) || getNestedValue(requestedItem, ['id', 'requested_course_item_id', 'requestedCourseItemId']))
  const curriculumName = getNestedValue(row, ['curriculumName', 'curriculum_name', 'request.curriculum_name', 'course_opening_request.curriculum_name', 'courseOpeningRequest.curriculum_name', 'opening_request.curriculum_name', 'openingRequest.curriculum_name', 'requested_course_item.request.curriculum_name', 'requestedCourseItem.request.curriculum_name', 'requested_course_item.course_opening_request.curriculum_name', 'requestedCourseItem.courseOpeningRequest.curriculum_name']) || getNestedValue(requestData, ['curriculum_name', 'curriculumName']) || '-'
  const programType = getNestedValue(row, ['programType', 'program_type', 'studyPlan', 'study_plan', 'request.program_type', 'request.study_plan', 'course_opening_request.program_type', 'courseOpeningRequest.program_type', 'opening_request.program_type', 'openingRequest.program_type']) || getNestedValue(requestData, ['program_type', 'programType', 'study_plan', 'studyPlan'])
  const targetGroup = getNestedValue(row, ['targetGroup', 'target_group', 'request.target_group', 'course_opening_request.target_group', 'courseOpeningRequest.target_group', 'opening_request.target_group', 'openingRequest.target_group']) || getNestedValue(requestData, ['target_group', 'targetGroup'])
  const directLevel = inferCourseOpeningLevel({ ...requestData, ...row, curriculum_name: curriculumName, curriculumName, program_type: programType, programType, target_group: targetGroup, targetGroup })

  return {
    id: getNestedValue(row, ['id', 'assignment_id', 'assignmentId', 'requested_course_item_id', 'requestedCourseItemId']) || `assigned-${index}`,
    requestId,
    requestedCourseItemId,
    openingCourseItemId: requestedCourseItemId,
    level: directLevel,
    curriculumName,
    majorName: getNestedValue(row, ['majorName', 'major_name', 'department_name', 'departmentName', 'request.major_name', 'course_opening_request.major_name', 'courseOpeningRequest.major_name', 'opening_request.major_name', 'openingRequest.major_name', 'requested_course_item.request.major_name', 'requestedCourseItem.request.major_name']) || getNestedValue(requestData, ['major_name', 'majorName']) || '-',
    semester: String(getNestedValue(row, ['semester', 'term', 'request.semester', 'course_opening_request.semester', 'courseOpeningRequest.semester', 'opening_request.semester', 'openingRequest.semester', 'requested_course_item.request.semester', 'requestedCourseItem.request.semester']) || getNestedValue(requestData, ['semester']) || ''),
    academicYear: String(getNestedValue(row, ['academicYear', 'academic_year', 'year', 'request.academic_year', 'course_opening_request.academic_year', 'courseOpeningRequest.academic_year', 'opening_request.academic_year', 'openingRequest.academic_year', 'requested_course_item.request.academic_year', 'requestedCourseItem.request.academic_year']) || getNestedValue(requestData, ['academic_year', 'academicYear']) || ''),
    yearLevel: String(getNestedValue(row, ['yearLevel', 'year_level', 'requested_course_item.year_level', 'requestedCourseItem.year_level']) || getNestedValue(requestedItem, ['year_level', 'yearLevel']) || '-'),
    courseId: normalizeText(getNestedValue(row, ['courseId', 'course_id', 'requested_course_item.course_id', 'requestedCourseItem.course_id']) || getNestedValue(requestedItem, ['course_id', 'courseId']) || getNestedValue(courseData, ['id', 'course_id', 'courseId'])),
    courseCode: getNestedValue(row, ['courseCode', 'course_code', 'course_code_snapshot', 'course.course_code', 'course.courseCode', 'requested_course_item.course_code_snapshot', 'requestedCourseItem.course_code_snapshot']) || getNestedValue(courseData, ['course_code', 'courseCode']) || getNestedValue(requestedItem, ['course_code_snapshot', 'courseCode']) || '-',
    courseName: getNestedValue(row, ['courseName', 'course_name', 'course_name_snapshot', 'course.course_name_th', 'course.courseNameTh', 'course.course_name', 'course.courseName', 'requested_course_item.course_name_snapshot', 'requestedCourseItem.course_name_snapshot']) || getNestedValue(courseData, ['course_name_th', 'courseNameTh', 'course_name', 'courseName']) || getNestedValue(requestedItem, ['course_name_snapshot', 'courseName']) || '-',
    sectionNumber: getNestedValue(row, ['sectionNumber', 'section_number', 'section_no', 'sectionNo', 'group_no', 'groupNo', 'requested_course_item.group_no', 'requestedCourseItem.group_no']) || getNestedValue(requestedItem, ['group_no', 'groupNo']) || '1',
    studentCount: getNestedValue(row, ['studentCount', 'student_count', 'requested_course_item.student_count', 'requestedCourseItem.student_count']) || getNestedValue(requestedItem, ['student_count', 'studentCount']) || 0,
    assignedTeacher: getNestedValue(row, ['assignedTeacher', 'assigned_teacher_name', 'teacher_name', 'teacher.full_name', 'teacher.name', 'primary_teacher.full_name']) || buildTeacherName(teacherData),
    mqa3Id: getNestedValue(row, ['mqa3Id', 'mqa3_id', 'tqf3Id', 'tqf3_id', 'mqa3.id', 'tqf3.id']) || '',
    mqa3Status: normalizeDocumentStatus(getNestedValue(row, ['mqa3Status', 'mqa3_status', 'tqf3Status', 'tqf3_status', 'mqa3.status', 'tqf3.status'])),
    mqa3SubmittedAt: getNestedValue(row, ['mqa3SubmittedAt', 'mqa3_submitted_at', 'tqf3SubmittedAt', 'tqf3_submitted_at', 'mqa3.submitted_at', 'tqf3.submitted_at']) || null,
    mqa5Id: getNestedValue(row, ['mqa5Id', 'mqa5_id', 'tqf5Id', 'tqf5_id', 'mqa5.id', 'tqf5.id']) || '',
    mqa5Status: normalizeDocumentStatus(getNestedValue(row, ['mqa5Status', 'mqa5_status', 'tqf5Status', 'tqf5_status', 'mqa5.status', 'tqf5.status'])),
    mqa5SubmittedAt: getNestedValue(row, ['mqa5SubmittedAt', 'mqa5_submitted_at', 'tqf5SubmittedAt', 'tqf5_submitted_at', 'mqa5.submitted_at', 'tqf5.submitted_at']) || null,
    rawData: row,
  }
}

function getOpeningMatchScore(assignedRow, openingCourse) {
  let score = 0
  const assignedRequestedItemId = normalizeText(assignedRow.requestedCourseItemId)
  const assignedRequestId = normalizeText(assignedRow.requestId)
  const assignedCourseId = normalizeText(assignedRow.courseId)
  const assignedCourseCode = normalizeCompareText(assignedRow.courseCode)
  const assignedCourseName = normalizeCompareText(assignedRow.courseName)
  const assignedGroupNo = normalizeText(assignedRow.sectionNumber)
  const assignedSemester = normalizeText(assignedRow.semester)
  const assignedAcademicYear = normalizeText(assignedRow.academicYear)
  const assignedCurriculumName = normalizeCompareText(assignedRow.curriculumName)
  const assignedMajorName = normalizeCompareText(assignedRow.majorName)
  const openingRequestedItemId = normalizeText(openingCourse.id)
  const openingRequestId = normalizeText(openingCourse.requestId)
  const openingCourseId = normalizeText(openingCourse.courseId)
  const openingCourseCode = normalizeCompareText(openingCourse.courseCode)
  const openingCourseName = normalizeCompareText(openingCourse.courseName)
  const openingGroupNo = normalizeText(openingCourse.groupNo)
  const openingSemester = normalizeText(openingCourse.semester)
  const openingAcademicYear = normalizeText(openingCourse.academicYear)
  const openingCurriculumName = normalizeCompareText(openingCourse.curriculumName)
  const openingMajorName = normalizeCompareText(openingCourse.majorName)

  if (assignedRequestedItemId && openingRequestedItemId && assignedRequestedItemId === openingRequestedItemId) score += 1000
  if (assignedRequestId && openingRequestId && assignedRequestId === openingRequestId) score += 250
  if (assignedCourseId && openingCourseId && assignedCourseId === openingCourseId) score += 180
  if (assignedCourseCode && openingCourseCode && assignedCourseCode === openingCourseCode) score += 160
  if (assignedCourseName && openingCourseName && assignedCourseName === openingCourseName) score += 70
  if (assignedGroupNo && openingGroupNo && assignedGroupNo === openingGroupNo) score += 35
  if (assignedSemester && openingSemester && assignedSemester === openingSemester) score += 45
  if (assignedAcademicYear && openingAcademicYear && assignedAcademicYear === openingAcademicYear) score += 45
  if (assignedCurriculumName && openingCurriculumName && (assignedCurriculumName === openingCurriculumName || assignedCurriculumName.includes(openingCurriculumName) || openingCurriculumName.includes(assignedCurriculumName))) score += 35
  if (assignedMajorName && openingMajorName && (assignedMajorName === openingMajorName || assignedMajorName.includes(openingMajorName) || openingMajorName.includes(assignedMajorName))) score += 25

  if (!assignedCourseId && !assignedCourseCode && !assignedCourseName && !assignedRequestedItemId && !assignedRequestId) return 0
  return score
}

function findBestOpeningCourseMatch(assignedRow, openingCourseRows) {
  const matchedList = openingCourseRows.map((openingCourse) => ({ openingCourse, score: getOpeningMatchScore(assignedRow, openingCourse) })).filter((item) => item.score >= 160).sort((a, b) => b.score - a.score)
  return matchedList[0]?.openingCourse ?? null
}

function normalizeAssignedCourseRow(row, index, openingCourseRows = []) {
  const baseRow = normalizeAssignedCourseBaseRow(row, index)
  const matchedOpeningCourse = findBestOpeningCourseMatch(baseRow, openingCourseRows)
  const fixedCourseId = normalizeText(matchedOpeningCourse?.courseId) || baseRow.courseId
  return {
    ...baseRow,
    courseId: fixedCourseId,
    level: baseRow.level || matchedOpeningCourse?.level || '',
    curriculumName: baseRow.curriculumName && baseRow.curriculumName !== '-' ? baseRow.curriculumName : matchedOpeningCourse?.curriculumName || baseRow.curriculumName,
    majorName: baseRow.majorName && baseRow.majorName !== '-' ? baseRow.majorName : matchedOpeningCourse?.majorName || baseRow.majorName,
    semester: baseRow.semester || matchedOpeningCourse?.semester || '',
    academicYear: baseRow.academicYear || matchedOpeningCourse?.academicYear || '',
    yearLevel: baseRow.yearLevel && baseRow.yearLevel !== '-' ? baseRow.yearLevel : matchedOpeningCourse?.yearLevel || baseRow.yearLevel,
    sectionNumber: baseRow.sectionNumber || matchedOpeningCourse?.groupNo || '1',
    studentCount: baseRow.studentCount || matchedOpeningCourse?.studentCount || 0,
    openingRequestId: matchedOpeningCourse?.requestId || baseRow.requestId || '',
    openingRequestStatus: matchedOpeningCourse?.requestStatus || '',
    openingCourseItemId: matchedOpeningCourse?.id || baseRow.requestedCourseItemId || '',
    requestedCourseItemId: baseRow.requestedCourseItemId || matchedOpeningCourse?.id || '',
    rawData: { ...baseRow.rawData, matchedOpeningCourse: matchedOpeningCourse || null, originalCourseId: baseRow.courseId, fixedCourseId },
  }
}

function getDocumentMatchScore(courseItem, documentRow) {
  let score = 0
  const courseRequestedItemId = normalizeText(courseItem.openingCourseItemId || courseItem.requestedCourseItemId)
  const documentRequestedItemId = normalizeText(documentRow.requestedCourseItemId)
  const courseIdMatched = normalizeText(courseItem.courseId) && normalizeText(documentRow.courseId) && normalizeText(courseItem.courseId) === normalizeText(documentRow.courseId)
  const courseCodeMatched = normalizeCompareText(courseItem.courseCode) && normalizeCompareText(documentRow.courseCode) && normalizeCompareText(courseItem.courseCode) === normalizeCompareText(documentRow.courseCode)

  if (courseRequestedItemId && documentRequestedItemId && courseRequestedItemId === documentRequestedItemId) score += 1000
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

  return {
    ...courseItem,
    mqa3Id: tqf3Document?.id || courseItem.mqa3Id || '',
    mqa3Status: tqf3Document?.status || courseItem.mqa3Status || 'notStarted',
    mqa3SubmittedAt: tqf3Document?.submittedAt || courseItem.mqa3SubmittedAt || null,
    mqa5Id: tqf5Document?.id || courseItem.mqa5Id || '',
    mqa5Status: tqf5Document?.status || courseItem.mqa5Status || 'notStarted',
    mqa5SubmittedAt: tqf5Document?.submittedAt || courseItem.mqa5SubmittedAt || null,
  }
}

function getLevelLabel(level) {
  if (level === 'bachelor') return 'ปริญญาตรี'
  if (level === 'master') return 'ปริญญาโท'
  if (level === 'doctoral') return 'ปริญญาเอก'
  return '-'
}

function getLevelBadgeClassName(level) {
  if (level === 'bachelor') return styles.levelBadgeBachelor
  if (level === 'master') return styles.levelBadgeMaster
  if (level === 'doctoral') return styles.levelBadgeDoctoral
  return ''
}

function getSemesterLabel(semester) {
  if (semester === 'summer') return 'ภาคฤดูร้อน'
  if (!semester) return 'ไม่ระบุภาคการศึกษา'
  return `ภาคการศึกษา ${semester}`
}

function getDocumentStatusConfig(status) {
  if (status === 'submitted') return { label: 'ส่งแล้ว', className: styles.statusSubmitted }
  if (status === 'draft') return { label: 'บันทึกแล้ว', className: styles.statusDraft }
  if (status === 'waitingGrade') return { label: 'รอหลังเกรดออก', className: styles.statusWaiting }
  if (status === 'rejected') return { label: 'ตีกลับ', className: styles.statusPending }
  return { label: 'ยังไม่เริ่ม', className: styles.statusPending }
}

function MyAssignedCoursesPage() {
  const apiUrl = import.meta.env.VITE_API_URL
  const [courseRows, setCourseRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [documentFilter, setDocumentFilter] = useState('all')
  const [selectedCourseItem, setSelectedCourseItem] = useState(null)
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [courseErrorMessage, setCourseErrorMessage] = useState('')

  const fetchAssignedCourses = useCallback(async () => {
    setIsLoadingCourses(true)
    setCourseErrorMessage('')
    try {
      const [assignedResponse, openingCourseRows, tqf3Rows, tqf5Rows] = await Promise.all([
        axios.get(`${apiUrl}${ASSIGNED_COURSES_ENDPOINT}`, getAuthConfig()),
        fetchCourseOpeningCourseRows(apiUrl),
        fetchTqfDocumentRows(apiUrl, TQF3_ENDPOINT, 'mqa3'),
        fetchTqfDocumentRows(apiUrl, TQF5_ENDPOINT, 'mqa5'),
      ])
      const assignedRows = getResponseList(assignedResponse.data, ['courses', 'assignedCourses', 'assignments', 'items', 'data', 'results'])
      const nextRows = assignedRows.map((item, index) => normalizeAssignedCourseRow(item, index, openingCourseRows)).map((item) => mergeAssignedCourseWithDocuments(item, tqf3Rows, tqf5Rows))
      setCourseRows(nextRows)
    } catch (error) {
      console.error('Error fetching assigned courses:', error)
      setCourseRows([])
      setCourseErrorMessage(getErrorMessage(error, 'ไม่สามารถดึงข้อมูลรายวิชาที่ได้รับมอบหมายได้'))
    } finally {
      setIsLoadingCourses(false)
    }
  }, [apiUrl])

  useEffect(() => { fetchAssignedCourses() }, [fetchAssignedCourses])

  const filteredCourseRows = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLowerCase()
    return courseRows.filter((item) => {
      const matchedSemester = semesterFilter === 'all' ? true : item.semester === semesterFilter
      const matchedDocument = documentFilter === 'all' ? true : documentFilter === 'mqa3Pending' ? item.mqa3Status === 'notStarted' || item.mqa3Status === 'draft' || item.mqa3Status === 'rejected' : documentFilter === 'mqa5Pending' ? item.mqa5Status === 'notStarted' || item.mqa5Status === 'draft' || item.mqa5Status === 'rejected' : documentFilter === 'completed' ? item.mqa3Status === 'submitted' && item.mqa5Status === 'submitted' : true
      const searchSource = `${item.courseCode} ${item.courseName} ${item.curriculumName} ${item.majorName} ${getLevelLabel(item.level)} ${item.assignedTeacher} ${getSemesterLabel(item.semester)} ${item.academicYear}`.toLowerCase()
      const matchedSearch = normalizedSearchText.length === 0 || searchSource.includes(normalizedSearchText)
      return matchedSemester && matchedDocument && matchedSearch
    })
  }, [courseRows, documentFilter, searchText, semesterFilter])

  const handleOpenDocumentDialog = (courseItem) => {
    setSelectedCourseItem(courseItem)
    setIsDocumentDialogOpen(true)
  }

  const handleCloseDocumentDialog = () => {
    setIsDocumentDialogOpen(false)
    setSelectedCourseItem(null)
    fetchAssignedCourses()
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>
              รายวิชาที่ได้รับมอบหมาย
            </Typography>
            <Typography className={styles.pageDescription}>
              หน้านี้ใช้สำหรับแสดงรายวิชาทั้งหมดที่อาจารย์ได้รับมอบหมายให้รับผิดชอบในแต่ละภาคการศึกษา
              เพื่อเลือกเข้าไปจัดทำเอกสาร มคอ.3 และ มคอ.5 ของรายวิชานั้นได้จากหน้ารายการเดียว
            </Typography>
          </Box>
        </Box>

        <Box className={styles.filterCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>
                ค้นหาและกรองรายการ
              </Typography>
              <Typography className={styles.sectionDescription}>
                สามารถค้นหาจากรหัสวิชา ชื่อรายวิชา หลักสูตร สาขา หรือชื่ออาจารย์
                และกรองตามภาคการศึกษาหรือสถานะการจัดทำเอกสารได้
              </Typography>
            </Box>
          </Box>

          <Box className={styles.filterGrid}>
            <TextField fullWidth label="ค้นหารายวิชา" placeholder="ค้นหาจากรหัสวิชา / ชื่อรายวิชา / หลักสูตร / สาขา" value={searchText} onChange={(event) => setSearchText(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }} />

            <TextField select fullWidth label="ภาคการศึกษา" value={semesterFilter} onChange={(event) => setSemesterFilter(event.target.value)}>
              <MenuItem value="all">ทั้งหมด</MenuItem>
              <MenuItem value="1">ภาคการศึกษา 1</MenuItem>
              <MenuItem value="2">ภาคการศึกษา 2</MenuItem>
              <MenuItem value="summer">ภาคฤดูร้อน</MenuItem>
            </TextField>

            <TextField select fullWidth label="สถานะเอกสาร" value={documentFilter} onChange={(event) => setDocumentFilter(event.target.value)}>
              <MenuItem value="all">ทั้งหมด</MenuItem>
              <MenuItem value="mqa3Pending">มคอ.3 ที่ยังต้องดำเนินการ</MenuItem>
              <MenuItem value="mqa5Pending">มคอ.5 ที่ยังต้องดำเนินการ</MenuItem>
              <MenuItem value="completed">จัดทำครบแล้ว</MenuItem>
            </TextField>
          </Box>
        </Box>

        <Box className={styles.listCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>
                รายการรายวิชาที่ได้รับมอบหมายทั้งหมด
              </Typography>
              <Typography className={styles.sectionDescription}>
                กดปุ่มเลือกเอกสารเพื่อเปิดตัวเลือกสำหรับจัดทำ มคอ.3 หรือ มคอ.5 ของรายวิชาที่ต้องการ
              </Typography>
            </Box>

            <Chip label={`พบ ${filteredCourseRows.length} รายการ`} className={styles.resultChip} />
          </Box>

          <TableContainer className={styles.tableContainer}>
            <Table className={styles.table}>
              <TableHead>
                <TableRow className={styles.tableHeadRow}>
                  <TableCell className={styles.headCell}>ระดับหลักสูตร</TableCell>
                  <TableCell className={styles.headCell}>ชั้นปี</TableCell>
                  <TableCell className={styles.headCell}>รหัสวิชา</TableCell>
                  <TableCell className={styles.headCell}>ชื่อรายวิชา</TableCell>
                  <TableCell className={styles.headCell}>กลุ่มที่ / นักศึกษา</TableCell>
                  <TableCell className={styles.headCell}>สถานะเอกสาร</TableCell>
                  <TableCell className={styles.headCell}>จัดการ</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isLoadingCourses && (
                  <TableRow>
                    <TableCell colSpan={7} className={styles.emptyTableCell}>
                      <Box className={styles.emptyState}>
                        <CircularProgress size={28} />
                        <Typography className={styles.emptyStateDescription}>
                          กำลังโหลดข้อมูลรายวิชาที่ได้รับมอบหมาย...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {!isLoadingCourses && courseErrorMessage && (
                  <TableRow>
                    <TableCell colSpan={7} className={styles.emptyTableCell}>
                      <Box className={styles.emptyState}>
                        <DescriptionRoundedIcon className={styles.emptyStateIcon} />
                        <Typography className={styles.emptyStateTitle}>
                          ยังไม่สามารถโหลดรายวิชาได้
                        </Typography>
                        <Typography className={styles.emptyStateDescription}>
                          {courseErrorMessage}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {!isLoadingCourses && !courseErrorMessage && filteredCourseRows.map((item) => {
                  const mqa3Status = getDocumentStatusConfig(item.mqa3Status)
                  const mqa5Status = getDocumentStatusConfig(item.mqa5Status)

                  return (
                    <TableRow key={item.id} className={styles.tableBodyRow}>
                      <TableCell className={styles.bodyCell}>
                        <Box className={`${styles.levelBadge} ${getLevelBadgeClassName(item.level)}`}>
                          <SchoolRoundedIcon fontSize="small" />
                          <span>{getLevelLabel(item.level)}</span>
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Typography className={styles.primaryText}>
                          ชั้นปี {item.yearLevel}
                        </Typography>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Typography className={styles.codeText}>
                          {item.courseCode}
                        </Typography>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.courseInfoBlock}>
                          <Typography className={styles.courseName}>
                            {item.courseName}
                          </Typography>
                          <Typography className={styles.courseMeta}>
                            {item.curriculumName} • สาขา{item.majorName} • {getSemesterLabel(item.semester)}/{item.academicYear || '-'}
                          </Typography>
                          <Typography className={styles.teacherMeta}>
                            ผู้รับผิดชอบรายวิชา: {item.assignedTeacher}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.groupStudentInfo}>
                          <Typography className={styles.primaryText}>
                            กลุ่ม {item.sectionNumber}
                          </Typography>
                          <Box className={styles.studentCountPill}>
                            {item.studentCount || 0} คน
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.documentStatusCell}>
                          <Box className={styles.documentStatusItem}>
                            <Typography className={styles.documentLabel}>
                              มคอ.3
                            </Typography>
                            <Chip label={mqa3Status.label} className={mqa3Status.className} size="small" />
                          </Box>

                          <Box className={styles.documentStatusItem}>
                            <Typography className={styles.documentLabel}>
                              มคอ.5
                            </Typography>
                            <Chip label={mqa5Status.label} className={mqa5Status.className} size="small" />
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Button variant="contained" startIcon={<AssignmentTurnedInRoundedIcon />} className={styles.primaryButton} onClick={() => handleOpenDocumentDialog(item)}>
                          เลือกเอกสาร
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {!isLoadingCourses && !courseErrorMessage && !filteredCourseRows.length && (
                  <TableRow>
                    <TableCell colSpan={7} className={styles.emptyTableCell}>
                      <Box className={styles.emptyState}>
                        <DescriptionRoundedIcon className={styles.emptyStateIcon} />
                        <Typography className={styles.emptyStateTitle}>
                          ไม่พบรายวิชาที่ตรงกับเงื่อนไข
                        </Typography>
                        <Typography className={styles.emptyStateDescription}>
                          ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองใหม่อีกครั้ง
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

      <DocumentSelectDialog open={isDocumentDialogOpen} onClose={handleCloseDocumentDialog} courseItem={selectedCourseItem} />
    </Box>
  )
}

export default MyAssignedCoursesPage