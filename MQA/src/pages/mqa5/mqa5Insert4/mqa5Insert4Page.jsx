import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import Mqa5FormNav from '../../../components/mqa5/mqa5FormNav'
import styles from './mqa5Insert4Page.module.css'

const MQA5_ACTIVE_DRAFT_KEY = 'mqa5ActiveDraftKey'
const TQF5_ENDPOINT = '/tqf5/'
const defaultRow154 = { suggestion: '', due: '', owner: '' }

const normalizeText = (value) => String(value ?? '').trim()
const hasText = (value) => normalizeText(value) !== ''
const getApiUrl = (apiUrl, path) => `${String(apiUrl || '').replace(/\/$/, '')}${path}`
const getAuthConfig = () => { const token = localStorage.getItem('mqa_token'); return { headers: token ? { Authorization: `Bearer ${token}` } : {} } }
const safeReadJson = (key) => { try { const rawValue = sessionStorage.getItem(key); return rawValue ? JSON.parse(rawValue) : null } catch { return null } }
const safeWriteJson = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)) } catch (error) { console.warn('Cannot write MQA5 draft:', error) } }
const getActiveDraftKey = () => { try { return sessionStorage.getItem(MQA5_ACTIVE_DRAFT_KEY) || '' } catch { return '' } }
const setActiveDraftKey = (draftKey) => { try { sessionStorage.setItem(MQA5_ACTIVE_DRAFT_KEY, draftKey) } catch (error) { console.warn('Cannot set active MQA5 draft key:', error) } }

function createCourseSigner(name = '', date = '') { const signerName = normalizeText(name); return { name: signerName, signature: signerName, date: date || '' } }
function createProgramSigner(name = '', date = '') { const signerName = normalizeText(name); return { name: signerName, signature: signerName, date: date || '' } }

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

const getResponseObject = (data) => { if (Array.isArray(data)) return data[0] || null; if (data?.data && typeof data.data === 'object') return data.data; if (data?.item && typeof data.item === 'object') return data.item; if (data?.result && typeof data.result === 'object') return data.result; return data }
const getResponseList = (data, keyList = []) => { if (Array.isArray(data)) return data; for (const key of keyList) if (Array.isArray(data?.[key])) return data[key]; return [] }
const getErrorMessage = (error, fallbackMessage) => { const detail = error?.response?.data?.detail; const message = error?.response?.data?.message; if (Array.isArray(detail)) return detail.map((item) => item.msg || item.message || JSON.stringify(item)).join(', '); return detail || message || fallbackMessage }

const getTqf3ReferenceId = (state = {}, savedDraft = {}) => normalizeText(state?.referenceTqf3Id || state?.sourceTqf3Id || state?.tqf3Id || state?.mqa3Id || state?.courseItem?.referenceTqf3Id || state?.courseItem?.sourceTqf3Id || state?.courseItem?.tqf3Id || state?.courseItem?.mqa3Id || savedDraft?.referenceTqf3Id || savedDraft?.sourceTqf3Id || savedDraft?.tqf3Id || savedDraft?.mqa3Id || '')
const getTqf5DocumentId = (state = {}, savedDraft = {}) => normalizeText(state?.tqf5Id || state?.mqa5Id || state?.selectedDocumentId || state?.courseItem?.tqf5Id || state?.courseItem?.mqa5Id || savedDraft?.tqf5Id || savedDraft?.mqa5Id || '')
const getRequestedCourseItemId = (state = {}, savedDraft = {}) => normalizeText(state?.requestedCourseItemId || state?.openingCourseItemId || state?.requested_course_item_id || state?.opening_course_item_id || state?.courseItem?.requestedCourseItemId || state?.courseItem?.requested_course_item_id || state?.courseItem?.openingCourseItemId || state?.courseItem?.opening_course_item_id || state?.courseItem?.rawData?.requested_course_item_id || state?.courseItem?.rawData?.requestedCourseItemId || state?.courseItem?.rawData?.opening_course_item_id || state?.courseItem?.rawData?.openingCourseItemId || state?.courseItem?.rawData?.id || savedDraft?.requestedCourseItemId || savedDraft?.openingCourseItemId || '')
const getCourseOpeningRequestId = (state = {}, savedDraft = {}) => {
  const courseItem = state?.courseItem || {}
  const rawData = courseItem?.rawData || {}
  const openingObject = state?.courseOpeningRequest || state?.courseOpening || state?.openingRequest || courseItem?.courseOpeningRequest || courseItem?.courseOpening || courseItem?.openingRequest || rawData?.courseOpeningRequest || rawData?.courseOpening || rawData?.openingRequest || {}
  return normalizeText(state?.courseOpeningRequestId || state?.course_opening_request_id || state?.requestId || state?.request_id || state?.openingRequestId || state?.opening_request_id || state?.courseOpeningId || state?.course_opening_id || courseItem?.courseOpeningRequestId || courseItem?.course_opening_request_id || courseItem?.requestId || courseItem?.request_id || courseItem?.openingRequestId || courseItem?.opening_request_id || courseItem?.courseOpeningId || courseItem?.course_opening_id || rawData?.courseOpeningRequestId || rawData?.course_opening_request_id || rawData?.requestId || rawData?.request_id || rawData?.openingRequestId || rawData?.opening_request_id || rawData?.courseOpeningId || rawData?.course_opening_id || openingObject?.id || openingObject?.request_id || openingObject?.requestId || savedDraft?.courseOpeningRequestId || savedDraft?.course_opening_request_id || savedDraft?.requestId || savedDraft?.request_id || '')
}

const getTeacherFullName = (teacher = {}) => {
  const directName = normalizeText(teacher?.teacher_name ?? teacher?.teacherName ?? teacher?.full_name ?? teacher?.fullName ?? teacher?.name ?? teacher?.display_name ?? teacher?.displayName)
  if (directName) return directName
  return normalizeText([teacher?.prefixname ?? teacher?.prefix_name ?? teacher?.prefixName, teacher?.first_name ?? teacher?.firstName ?? teacher?.firstname, teacher?.last_name ?? teacher?.lastName ?? teacher?.lastname].filter(Boolean).join(' '))
}

const getResponsiblePersonName = (person = {}) => {
  const directName = normalizeText(person?.name ?? person?.full_name ?? person?.fullName ?? person?.teacher_name ?? person?.teacherName ?? person?.display_name ?? person?.displayName ?? person?.employee_name ?? person?.employeeName ?? person?.thai_name ?? person?.thaiName)
  if (directName) return directName
  return normalizeText([person?.prefixname ?? person?.prefix_name ?? person?.prefixName ?? person?.title ?? person?.academic_title ?? person?.academicTitle, person?.first_name ?? person?.firstName ?? person?.firstname ?? person?.given_name ?? person?.givenName, person?.last_name ?? person?.lastName ?? person?.lastname ?? person?.surname ?? person?.family_name ?? person?.familyName].filter(Boolean).join(' '))
}

const getResponsiblePersonDate = (person = {}) => person?.signedDate || person?.signed_date || person?.date || person?.reportDate || person?.report_date || ''
const uniqueNameList = (nameList = []) => Array.from(new Set(nameList.map(normalizeText).filter(Boolean)))
const splitTeacherNameText = (value) => normalizeText(value).split(/[,/|]+/).map(normalizeText).filter(Boolean)

const buildCourseSignersFromNames = (nameList = [], oldSigners = []) => {
  const dateByName = new Map(oldSigners.map((signer) => [normalizeText(signer.name), signer.date || '']))
  const names = uniqueNameList(nameList)
  return names.length ? names.map((name) => createCourseSigner(name, dateByName.get(name) || '')) : [createCourseSigner()]
}

const buildProgramSignersFromPeople = (people = [], oldSigners = []) => {
  const oldSignerByName = new Map(oldSigners.map((signer) => [normalizeText(signer.name), signer]))
  const normalizedPeople = people.map((person) => ({ name: typeof person === 'string' ? normalizeText(person) : getResponsiblePersonName(person), date: typeof person === 'string' ? '' : getResponsiblePersonDate(person) })).filter((person) => hasText(person.name))
  const uniquePeople = normalizedPeople.filter((person, index, list) => list.findIndex((item) => item.name === person.name) === index)
  return uniquePeople.length ? uniquePeople.map((person) => { const oldSigner = oldSignerByName.get(person.name); return createProgramSigner(person.name, oldSigner?.date || person.date || '') }) : [createProgramSigner()]
}

const getAssignedTeacherNamesFromSource = (source = {}) => {
  const courseItem = source?.courseItem || {}
  const rawData = courseItem?.rawData || {}
  const teacherLists = [source?.assigned_teachers, source?.assignedTeachers, source?.assignedTeacherList, source?.assignedTeachersRaw, source?.primary_teacher ? [source.primary_teacher] : [], courseItem?.assigned_teachers, courseItem?.assignedTeachers, courseItem?.assignedTeacherList, courseItem?.assignedTeachersRaw, courseItem?.primary_teacher ? [courseItem.primary_teacher] : [], rawData?.assigned_teachers, rawData?.assignedTeachers, rawData?.assignedTeacherList, rawData?.assignedTeachersRaw, rawData?.primary_teacher ? [rawData.primary_teacher] : []]
  const namesFromLists = teacherLists.flatMap((list) => getResponseList(list).map((teacher) => typeof teacher === 'string' ? teacher : getTeacherFullName(teacher))).filter(Boolean)
  const fallbackNames = [source?.assignedTeacher, source?.assigned_teacher_name, courseItem?.assignedTeacher, courseItem?.assigned_teacher_name, rawData?.assignedTeacher, rawData?.assigned_teacher_name].flatMap(splitTeacherNameText)
  return uniqueNameList([...namesFromLists, ...fallbackNames])
}

const getCourseOpeningSources = (source = {}) => {
  const courseItem = source?.courseItem || {}
  const rawData = courseItem?.rawData || {}
  return [source, source?.courseOpeningRequest, source?.courseOpening, source?.openingRequest, source?.requestData, source?.request_data, courseItem?.courseOpeningRequest, courseItem?.courseOpening, courseItem?.openingRequest, courseItem?.requestData, courseItem?.request_data, rawData?.courseOpeningRequest, rawData?.courseOpening, rawData?.openingRequest, rawData?.requestData, rawData?.request_data].filter(Boolean)
}

const getProgramResponsiblePeopleFromSource = (source = {}) => {
  const sources = getCourseOpeningSources(source)
  const people = sources.flatMap((item) => {
    const documentData = item?.documentData || item?.document_data || {}
    const approvalForm = item?.approvalForm || item?.approval_form || documentData?.approvalForm || documentData?.approval_form || {}
    return [item?.responsible_persons, item?.responsiblePersons, item?.curriculum_responsible_persons, item?.curriculumResponsiblePersons, item?.program_responsible_persons, item?.programResponsiblePersons, approvalForm?.responsiblePeople, approvalForm?.responsible_people, documentData?.responsible_persons, documentData?.responsiblePersons].flatMap((list) => getResponseList(list))
  })
  const uniquePeople = []
  people.forEach((person) => { const name = typeof person === 'string' ? normalizeText(person) : getResponsiblePersonName(person); if (name && !uniquePeople.some((item) => (typeof item === 'string' ? item : getResponsiblePersonName(item)) === name)) uniquePeople.push(person) })
  return uniquePeople
}

const getCourseOpeningIdFromSource = (opening = {}) => normalizeText(opening?.id || opening?.request_id || opening?.requestId || opening?.courseOpeningRequestId || opening?.course_opening_request_id || opening?.courseOpeningId || opening?.course_opening_id || '')
const getRequestedCourseItemsFromOpening = (opening = {}) => {
  const documentData = opening?.documentData || opening?.document_data || {}
  const directItems = [opening?.requested_course_items, opening?.requestedCourseItems, opening?.requested_courses, opening?.requestedCourses, opening?.course_items, opening?.courseItems, opening?.items, documentData?.requested_course_items, documentData?.requestedCourseItems, documentData?.requested_courses, documentData?.requestedCourses].flatMap((list) => getResponseList(list))
  const yearBlockItems = getResponseList(documentData?.yearBlocks || documentData?.year_blocks).flatMap((block) => getResponseList(block?.subjectRows || block?.subject_rows))
  return [...directItems, ...yearBlockItems]
}

const getRequestedCourseItemIdFromItem = (item = {}) => normalizeText(item?.id || item?.requested_course_item_id || item?.requestedCourseItemId || item?.opening_course_item_id || item?.openingCourseItemId || item?.requestedCourseId || item?.requested_course_id || '')
const getCourseCodeFromState = (state = {}) => normalizeText(state?.courseCode || state?.course_code || state?.courseItem?.courseCode || state?.courseItem?.course_code || state?.courseItem?.rawData?.course_code || state?.courseItem?.rawData?.courseCode || '')
const getCourseIdFromState = (state = {}) => normalizeText(state?.courseId || state?.course_id || state?.courseItem?.courseId || state?.courseItem?.course_id || state?.courseItem?.rawData?.course_id || state?.courseItem?.rawData?.courseId || '')

const isOpeningMatchedWithCurrentCourse = (opening = {}, requestedCourseItemId = '', state = {}) => {
  const requestedItemIdText = normalizeText(requestedCourseItemId)
  const courseCodeText = getCourseCodeFromState(state)
  const courseIdText = getCourseIdFromState(state)
  const openingItems = getRequestedCourseItemsFromOpening(opening)
  if (requestedItemIdText && openingItems.some((item) => getRequestedCourseItemIdFromItem(item) === requestedItemIdText)) return true
  if (courseIdText && openingItems.some((item) => normalizeText(item?.course_id || item?.courseId || item?.id) === courseIdText)) return true
  if (courseCodeText && openingItems.some((item) => normalizeText(item?.course_code || item?.courseCode || item?.code) === courseCodeText)) return true
  return false
}

const normalizeSignerList = (signers = [], fallbackCreator = createCourseSigner) => Array.isArray(signers) && signers.length ? signers.map((signer) => ({ name: normalizeText(signer?.name), signature: normalizeText(signer?.signature || signer?.name), date: signer?.date || '' })) : [fallbackCreator()]
const normalizeRows154 = (rows = []) => Array.isArray(rows) && rows.length ? rows.map((row) => ({ ...defaultRow154, ...row })) : [{ ...defaultRow154 }]
const normalizeStringList = (items = []) => Array.isArray(items) && items.length ? items : ['']
const hasFilledSignerList = (signers = []) => Array.isArray(signers) && signers.some((signer) => hasText(signer?.name) || hasText(signer?.signature) || hasText(signer?.date))

const hasObjectData = (value) => Boolean(value && typeof value === 'object' && Object.keys(value).length > 0)
const toNumberOrNull = (value) => { const text = normalizeText(value); if (!text) return null; const numberValue = Number(text); return Number.isFinite(numberValue) ? numberValue : null }
const toIntegerOrNull = (value) => { const numberValue = toNumberOrNull(value); return numberValue === null ? null : Math.trunc(numberValue) }
const normalizePathId = (value) => { const text = normalizeText(value); return /^\d+$/.test(text) ? text : '' }
const pickPathId = (...values) => { for (const value of values) { const idText = normalizePathId(value); if (idText) return idText } return '' }
const pickFirst = (...values) => values.find((value) => hasText(value)) || ''
const listToArray = (value) => Array.isArray(value) ? value.map(normalizeText).filter(Boolean) : normalizeText(value).split('\n').map(normalizeText).filter(Boolean)
const getPageData = (navigationState = {}, savedDraft = {}) => ({ page1: navigationState?.mqa5Insert1 || savedDraft?.mqa5Insert1 || savedDraft?.navigationState?.mqa5Insert1 || {}, page2: navigationState?.mqa5Insert2 || savedDraft?.mqa5Insert2 || savedDraft?.navigationState?.mqa5Insert2 || {}, page3: navigationState?.mqa5Insert3 || savedDraft?.mqa5Insert3 || savedDraft?.navigationState?.mqa5Insert3 || {}, page4: navigationState?.mqa5Insert4 || savedDraft?.mqa5Insert4 || savedDraft?.navigationState?.mqa5Insert4 || {} })
const getCourseIdForPayload = (navigationState = {}, savedDraft = {}) => { const courseItem = navigationState?.courseItem || savedDraft?.navigationState?.courseItem || {}; const page1 = navigationState?.mqa5Insert1 || savedDraft?.mqa5Insert1 || savedDraft?.navigationState?.mqa5Insert1 || {}; return toIntegerOrNull(navigationState?.courseId || navigationState?.course_id || courseItem?.courseId || courseItem?.course_id || courseItem?.rawData?.course_id || courseItem?.rawData?.courseId || page1?.courseId || page1?.course_id || page1?.courseDetail?.id || page1?.courseDetail?.course_id || page1?.courseDetail?.courseId) }
const getCourseCodeForPayload = (navigationState = {}, savedDraft = {}) => { const { page1 } = getPageData(navigationState, savedDraft); const courseItem = navigationState?.courseItem || savedDraft?.navigationState?.courseItem || {}; return pickFirst(navigationState?.courseCode, navigationState?.course_code, courseItem?.courseCode, courseItem?.course_code, courseItem?.rawData?.course_code, courseItem?.rawData?.courseCode, page1?.courseCode, page1?.course_code, page1?.courseDetail?.course_code, page1?.courseDetail?.courseCode) }
const getSemesterForPayload = (navigationState = {}, savedDraft = {}) => { const { page1 } = getPageData(navigationState, savedDraft); const courseItem = navigationState?.courseItem || savedDraft?.navigationState?.courseItem || {}; const text = pickFirst(page1?.semester, page1?.term, navigationState?.semester, navigationState?.term, courseItem?.semester, courseItem?.term); const match = normalizeText(text).match(/(\d)\s*\/\s*(\d{4})/); return match ? `${match[1]}/${match[2]}` : text }
const getAcademicYearForPayload = (navigationState = {}, savedDraft = {}) => { const { page1 } = getPageData(navigationState, savedDraft); const courseItem = navigationState?.courseItem || savedDraft?.navigationState?.courseItem || {}; const source = pickFirst(page1?.academicYear, page1?.academic_year, navigationState?.academicYear, navigationState?.academic_year, courseItem?.academicYear, courseItem?.academic_year, page1?.semester); const match = normalizeText(source).match(/(25\d{2}|20\d{2})/); return toIntegerOrNull(match ? match[1] : source) }
const getSectionGroupForPayload = (navigationState = {}, savedDraft = {}) => { const { page1 } = getPageData(navigationState, savedDraft); const courseItem = navigationState?.courseItem || savedDraft?.navigationState?.courseItem || {}; return pickFirst(page1?.sectionGroup, page1?.section_group, page1?.sectionNumber, page1?.section_number, navigationState?.sectionGroup, navigationState?.section_group, courseItem?.sectionGroup, courseItem?.section_group, courseItem?.sectionNumber, courseItem?.section_number, courseItem?.groupNo, courseItem?.group_no) }
const getExistingTqf5IdFromSource = (navigationState = {}, savedDraft = {}) => pickPathId(navigationState?.tqf5Id, navigationState?.tqf5_id, navigationState?.mqa5Id, navigationState?.mqa5_id, navigationState?.selectedDocumentId, navigationState?.courseItem?.tqf5Id, navigationState?.courseItem?.tqf5_id, navigationState?.courseItem?.mqa5Id, navigationState?.courseItem?.mqa5_id, navigationState?.courseItem?.tqf5?.id, navigationState?.courseItem?.mqa5?.id, savedDraft?.tqf5Id, savedDraft?.tqf5_id, savedDraft?.mqa5Id, savedDraft?.mqa5_id, savedDraft?.navigationState?.tqf5Id, savedDraft?.navigationState?.tqf5_id, savedDraft?.navigationState?.mqa5Id, savedDraft?.navigationState?.mqa5_id)
const normalizeDocumentStatus = (value) => { const text = normalizeText(value).toLowerCase().replace(/[\s_-]/g, ''); if (!text) return 'notStarted'; if (['submitted', 'submit', 'sent', 'approved', 'pending', 'pendingapproval', 'waitingapproval'].includes(text)) return 'submitted'; if (['draft', 'savedraft'].includes(text)) return 'draft'; if (['rejected', 'reject'].includes(text)) return 'rejected'; return text }
const normalizeTqf5DocumentRow = (row = {}, index = 0) => ({ id: pickPathId(row?.id, row?.tqf5_id, row?.tqf5Id, row?.mqa5_id, row?.mqa5Id), courseId: normalizeText(row?.course_id || row?.courseId || row?.course?.id || ''), courseCode: normalizeText(row?.course_code || row?.courseCode || row?.course?.course_code || row?.course?.courseCode || ''), semester: normalizeText(row?.semester || row?.term || ''), academicYear: normalizeText(row?.academic_year || row?.academicYear || row?.year || ''), sectionGroup: normalizeText(row?.section_group || row?.sectionGroup || row?.section_number || row?.sectionNumber || row?.group_no || row?.groupNo || ''), status: normalizeDocumentStatus(row?.status || row?.document_status || row?.documentStatus), sortId: Number(row?.id || row?.tqf5_id || row?.tqf5Id || index) || index })
const isSameValueIfBothExist = (firstValue, secondValue) => { const firstText = normalizeText(firstValue); const secondText = normalizeText(secondValue); if (!firstText || !secondText) return true; return firstText === secondText }
const isSameTqf5Document = (payload, documentRow) => { const sameCourseId = payload?.course_id && documentRow?.courseId && normalizeText(payload.course_id) === normalizeText(documentRow.courseId); const sameCourseCode = payload?.course_code && documentRow?.courseCode && normalizeText(payload.course_code) === normalizeText(documentRow.courseCode); if (!sameCourseId && !sameCourseCode) return false; if (!isSameValueIfBothExist(payload.semester, documentRow.semester)) return false; if (!isSameValueIfBothExist(payload.academic_year, documentRow.academicYear)) return false; if (!isSameValueIfBothExist(payload.section_group, documentRow.sectionGroup)) return false; return true }
const findExistingTqf5Document = async (apiUrl, payload) => {
  try {
    const response = await axios.get(getApiUrl(apiUrl, TQF5_ENDPOINT), getAuthConfig())
    const documentRows = getResponseList(response.data, ['items', 'data', 'results', 'tqf5', 'documents']).map((item, index) => normalizeTqf5DocumentRow(item, index))
    const matchedRows = documentRows.filter((documentRow) => isSameTqf5Document(payload, documentRow)).sort((a, b) => { if (a.status === 'draft' && b.status !== 'draft') return -1; if (a.status !== 'draft' && b.status === 'draft') return 1; return b.sortId - a.sortId })
    return matchedRows[0] || null
  } catch (error) {
    console.warn('Cannot check existing TQF5 document:', error)
    return null
  }
}
const buildTqf5Payload = ({ navigationState, savedDraft, plan151, result151, items152, items153, rows154, items16, courseSigners, programSigners }) => {
  const { page1, page2, page3 } = getPageData(navigationState, savedDraft)
  const getPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const normalizeDigits = (value) => normalizeText(value).replace(/[๐-๙]/g, (digit) => '0123456789'['๐๑๒๓๔๕๖๗๘๙'.indexOf(digit)])
  const toSafeNumber = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null
    const text = normalizeDigits(value)
    if (!text) return null
    const directNumber = Number(text)
    if (Number.isFinite(directNumber)) return directNumber
    const match = text.match(/-?\d+(?:\.\d+)?/)
    if (!match) return null
    const numberValue = Number(match[0])
    return Number.isFinite(numberValue) ? numberValue : null
  }
  const toSafeInteger = (value) => {
    const numberValue = toSafeNumber(value)
    return numberValue === null ? null : Math.trunc(numberValue)
  }
  const pickSafeInteger = (...values) => {
    for (const value of values) {
      const intValue = toSafeInteger(value)
      if (intValue !== null) return intValue
    }
    return null
  }
  const pickSafeYear = (...values) => {
    for (const value of values) {
      const text = normalizeDigits(value)
      if (!text) continue
      const yearMatch = text.match(/(25\d{2}|20\d{2})/)
      if (yearMatch) return Number(yearMatch[1])
      const intValue = toSafeInteger(text)
      if (intValue !== null) return intValue
    }
    return null
  }
  const pickSafeText = (...values) => values.find((value) => hasText(value) || typeof value === 'number') ?? ''
  const toSafeDate = (value) => {
    const text = normalizeDigits(value)
    if (!text) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
    const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (slashMatch) return `${slashMatch[3]}-${String(slashMatch[1]).padStart(2, '0')}-${String(slashMatch[2]).padStart(2, '0')}`
    return text
  }
  const toSafeArray = (value) => Array.isArray(value) ? value : value ? [value] : []
  const textList = (value) => Array.isArray(value) ? value.map(normalizeText).filter(Boolean) : normalizeText(value).split('\n').map(normalizeText).filter(Boolean)
  const page1Form = getPlainObject(page1?.form)
  const page2Form = getPlainObject(page2?.form)
  const courseItem = navigationState?.courseItem || savedDraft?.navigationState?.courseItem || {}
  const rawData = courseItem?.rawData || {}
  const section1Source = getPlainObject(page1?.section1 || page1?.sec1 || page1?.generalInfo || page1?.courseDetail)
  const section2Source = getPlainObject(page1?.section2 || page1?.sec2 || page1?.creditDetail || page1?.courseDetail)
  const section3Source = getPlainObject(page1?.section3 || page1?.sec3)
  const section4Source = getPlainObject(page1?.section4 || page1?.sec4)
  const section5Source = getPlainObject(page1?.section5 || page1?.sec5)
  const section6Source = getPlainObject(page1?.section6 || page1?.sec6)
  const section7Source = getPlainObject(page2?.section7 || page2?.sec7)
  const section8Source = getPlainObject(page2?.section8 || page2?.sec8)
  const section9Source = getPlainObject(page2?.section9 || page2?.sec9)
  const section10Source = getPlainObject(page2?.section10 || page2?.sec10)
  const creditText = pickSafeText(section2Source?.creditsDetail, section2Source?.creditText, section2Source?.creditDetail, section2Source?.credit_detail, page1Form?.creditText, page1Form?.creditsDetail, page1Form?.creditDetail, page1?.creditText, page1?.creditsDetail, page1?.creditDetail, courseItem?.creditsDetail, courseItem?.creditDetail, rawData?.credits_snapshot, rawData?.credit_detail)
  const semesterText = pickSafeText(section5Source?.semester, page1Form?.semester, page1?.semester, navigationState?.semester, courseItem?.semester)
  const semesterMatch = normalizeText(semesterText).match(/^(\d)\s*\/\s*(\d{4})$/)
  const curriculumValue = section3Source?.curriculum || section3Source?.curriculumName || page1Form?.curriculumMajor || page1Form?.curriculum || page1Form?.curriculumName || page1?.curriculum || page1?.curriculumMajor || navigationState?.curriculumName || courseItem?.curriculumName || courseItem?.curriculum_name
  const teachersValue = section4Source?.teachers || page1?.teachers || page1Form?.teachers || page1?.teacher || courseItem?.assignedTeachers || courseItem?.assignedTeacherList || courseSigners.map((signer) => signer.name)
  const teacherList = Array.isArray(teachersValue) ? teachersValue.map((teacher) => typeof teacher === 'string' ? normalizeText(teacher) : getTeacherFullName(teacher)).filter(Boolean) : textList(teachersValue)
  const rows11 = toSafeArray(page2?.section11?.rows || page2?.sec11?.rows || page2?.rows11 || page2?.cloRows || page2?.cloResults).map((row) => ({ clo: normalizeText(row?.clo || row?.CLO), teach: normalizeText(row?.teach || row?.teaching || row?.operationMethod), assess: normalizeText(row?.assess || row?.assessment), outcome: normalizeText(row?.outcome || row?.result), improve: normalizeText(row?.improve || row?.improvement) })).filter((row) => row.clo || row.teach || row.assess || row.outcome || row.improve)
  const gradeCounts = getPlainObject(page2?.gradeCounts)
  const totalGradeCount = Object.values(gradeCounts).reduce((sum, value) => sum + (toSafeInteger(value) || 0), 0)
  const gradeRowsFromCounts = Object.keys(gradeCounts).map((grade) => {
    const count = toSafeInteger(gradeCounts[grade])
    return { grade, range: null, count, percent: totalGradeCount && count !== null ? Number(((count / totalGradeCount) * 100).toFixed(2)) : null }
  }).filter((row) => row.count !== null)
  const gradeRows = toSafeArray(page2?.section12?.grades || page2?.sec12?.grades || page2?.grades).map((grade) => ({ grade: normalizeText(grade?.grade) || null, range: normalizeText(grade?.range) || null, count: toSafeInteger(grade?.count), percent: toSafeNumber(grade?.percent) })).filter((grade) => grade.grade || grade.count !== null)
  const toleranceRows = toSafeArray(page2?.section12?.tolerance || page2?.sec12?.tolerance || page2?.rows126 || page2?.tolerance).map((row) => ({ deviation: normalizeText(row?.deviation) || null, reason: normalizeText(row?.reason) || null })).filter((row) => row.deviation || row.reason)
  const sec13 = getPlainObject(page3?.section13 || page3?.sec13)
  const sec141 = getPlainObject(page3?.section14?.studentEvaluation || page3?.section14?.systemFeedback?.[0] || page3?.sec141)
  const rows142 = toSafeArray(page3?.section14?.otherFeedback || page3?.section14?.otherEvaluations || page3?.rows142)
  return {
    course_id: getCourseIdForPayload(navigationState, savedDraft),
    section1: {
      courseCode: normalizeText(pickSafeText(section1Source?.courseCode, section1Source?.course_code, page1Form?.courseCode, page1Form?.course_code, page1?.courseCode, page1?.course_code, navigationState?.courseCode, navigationState?.course_code, courseItem?.courseCode, courseItem?.course_code, rawData?.courseCode, rawData?.course_code)),
      nameThai: normalizeText(pickSafeText(section1Source?.nameThai, section1Source?.courseNameThai, section1Source?.course_name_th, section1Source?.name_th, page1Form?.courseNameThai, page1Form?.nameThai, page1Form?.course_name_th, page1?.nameThai, page1?.courseNameThai, courseItem?.nameThai, courseItem?.courseNameThai, courseItem?.course_name_th, rawData?.nameThai, rawData?.course_name_th)),
      nameEng: normalizeText(pickSafeText(section1Source?.nameEng, section1Source?.nameEnglish, section1Source?.courseNameEnglish, section1Source?.course_name_en, section1Source?.name_en, page1Form?.courseNameEnglish, page1Form?.nameEng, page1Form?.nameEnglish, page1Form?.course_name_en, page1?.nameEng, page1?.nameEnglish, page1?.courseNameEnglish, courseItem?.nameEng, courseItem?.nameEnglish, courseItem?.course_name_en, rawData?.nameEng, rawData?.course_name_en)),
    },
    section2: {
      credits: pickSafeInteger(section2Source?.credits, section2Source?.creditTotal, section2Source?.credit_total, page1Form?.credits, page1Form?.creditTotal, page1Form?.credit_total, creditText, page1?.credits, page1?.creditTotal, courseItem?.credits, courseItem?.creditTotal, courseItem?.credit_total, rawData?.credit_total),
      creditsDetail: normalizeText(creditText) || null,
    },
    section3: {
      curriculum: Array.isArray(curriculumValue) ? curriculumValue.map(normalizeText).filter(Boolean) : textList(curriculumValue),
      courseCategory: normalizeText(pickSafeText(section3Source?.courseCategory, section3Source?.course_category, page1Form?.courseType, page1Form?.courseCategory, page1Form?.course_category, page1?.courseCategory, page1?.courseType, courseItem?.courseCategory, courseItem?.course_category)) || null,
    },
    section4: { teachers: teacherList },
    section5: {
      semester: pickSafeInteger(section5Source?.semester, page1Form?.semesterNumber, semesterMatch ? semesterMatch[1] : semesterText),
      year: pickSafeYear(section5Source?.year, section5Source?.academicYear, section5Source?.academic_year, page1Form?.year, page1Form?.academicYear, page1Form?.academic_year, semesterText, page1?.academicYear, navigationState?.academicYear, navigationState?.academic_year, courseItem?.academicYear, courseItem?.academic_year),
      yearLevel: pickSafeInteger(section5Source?.yearLevel, section5Source?.year_level, page1Form?.yearLevel, page1Form?.year_level, page1?.yearLevel, courseItem?.yearLevel, courseItem?.year_level),
      group: pickSafeInteger(section5Source?.group, section5Source?.groupNumber, section5Source?.group_no, section5Source?.sectionNumber, page1Form?.sectionNumber, page1Form?.group, page1Form?.groupNumber, page1?.sectionNumber, navigationState?.sectionNumber, courseItem?.sectionNumber, courseItem?.groupNo),
      studentCount: pickSafeInteger(section5Source?.studentCount, section5Source?.student_count, page1Form?.studentCount, page1Form?.student_count, page1?.studentCount, courseItem?.studentCount, courseItem?.student_count),
    },
    section6: { location: normalizeText(pickSafeText(section6Source?.location, section6Source?.learningPlace, page1Form?.learningPlace, page1Form?.location, page1?.location, page1?.learningPlace)) || null },
    section7: {
      pre: normalizeText(pickSafeText(section7Source?.pre, section7Source?.prereq, section7Source?.prerequisite, section7Source?.pre_requisite, page2Form?.prereq, page2Form?.pre, page2Form?.prerequisite, page2?.prereq, page2?.prerequisite)) || null,
      co: normalizeText(pickSafeText(section7Source?.co, section7Source?.coreq, section7Source?.corequisite, section7Source?.co_requisite, page2Form?.coreq, page2Form?.co, page2Form?.corequisite, page2?.coreq, page2?.corequisite)) || null,
    },
    section8: { updatedDate: toSafeDate(section8Source?.updatedDate || section8Source?.updateDate || page2Form?.updateDate || page2Form?.updatedDate || page2?.updateDate) },
    section9: { deviatedHours: normalizeText(pickSafeText(section9Source?.deviatedHours, section9Source?.deviated_hours, page2Form?.actualHoursDeviation, page2Form?.deviatedHours, page2Form?.hourDeviation, page2?.actualHoursDeviation, page2?.deviatedHours)) || null },
    section10: { uncoveredTopics: normalizeText(pickSafeText(section10Source?.uncoveredTopics, section10Source?.uncovered_topics, page2Form?.missingTopics, page2Form?.uncoveredTopics, page2Form?.uncoveredContent, page2?.missingTopics, page2?.uncoveredTopics)) || null },
    section11: { rows: rows11 },
    section12: {
      registered: pickSafeInteger(page2Form?.registered, page2Form?.registeredCount, page2?.registered),
      remaining: pickSafeInteger(page2Form?.remaining, page2Form?.remainingCount, page2Form?.remained, page2?.remaining, page2?.remained),
      withdrawn: pickSafeInteger(page2Form?.withdrawn, page2Form?.withdrawnCount, page2Form?.withdrewW, page2Form?.withdrew, page2?.withdrawn, page2?.withdrewW),
      grades: gradeRows.length ? gradeRows : gradeRowsFromCounts,
      abnormalFactor: normalizeText(pickSafeText(page2Form?.abnormalFactor, page2Form?.abnormalReason, page2?.abnormalFactor, page2?.abnormalReason)) || null,
      tolerance: toleranceRows,
    },
    section13: {
      resourceIssues: [{ issue: normalizeText(sec13?.issue131 || sec13?.resourceIssue || sec13?.issue), impact: normalizeText(sec13?.impact131 || sec13?.resourceImpact || sec13?.impact) }].filter((row) => row.issue || row.impact),
      adminIssues: [{ issue: normalizeText(sec13?.issue132 || sec13?.organizationIssue || sec13?.adminIssue), impact: normalizeText(sec13?.impact132 || sec13?.organizationImpact || sec13?.adminImpact) }].filter((row) => row.issue || row.impact),
    },
    section14: {
      systemFeedback: [{ criticism: normalizeText(sec141?.critique || sec141?.criticism), response: normalizeText(sec141?.teacherComment || sec141?.response) }].filter((row) => row.criticism || row.response),
      otherFeedback: rows142.map((row) => ({ criticism: normalizeText(row?.critique || row?.criticism), response: normalizeText(row?.teacherComment || row?.response) })).filter((row) => row.criticism || row.response),
    },
    section15: {
      pastPlans: [{ plan: normalizeText(plan151) || null, result: normalizeText(result151) || null }].filter((row) => row.plan || row.result),
      otherActions: items152.map(normalizeText).filter(Boolean),
      recommendations: items153.map(normalizeText).filter(Boolean),
      nextPlans: rows154.map((row) => ({ plan: normalizeText(row?.suggestion) || null, deadline: normalizeText(row?.due) || null, owner: normalizeText(row?.owner) || null })).filter((row) => row.plan || row.deadline || row.owner),
    },
    section16: {
      integrations: items16.map(normalizeText).filter(Boolean),
      subjectTeachers: courseSigners.map((signer) => ({ name: normalizeText(signer?.name) || null, signature: normalizeText(signer?.signature) || null, date: toSafeDate(signer?.date) })).filter((signer) => signer.name || signer.signature || signer.date),
      curriculumTeachers: programSigners.map((signer) => ({ name: normalizeText(signer?.name) || null, signature: normalizeText(signer?.signature) || null, date: toSafeDate(signer?.date) })).filter((signer) => signer.name || signer.signature || signer.date),
    },
  }
}
function Mqa5Insert4Page() {
  const navigate = useNavigate()
  const location = useLocation()
  const apiUrl = import.meta.env.VITE_API_URL || ''
  const locationState = useMemo(() => location.state || {}, [location.state])
  const draftKey = useMemo(() => getMqa5DraftKey(locationState), [locationState])
  const savedDraft = useMemo(() => safeReadJson(draftKey), [draftKey])
  const navigationState = useMemo(() => Object.keys(locationState).length ? locationState : savedDraft?.navigationState || {}, [locationState, savedDraft])
  const tqf3ReferenceId = useMemo(() => getTqf3ReferenceId(navigationState, savedDraft), [navigationState, savedDraft])
  const tqf5DocumentId = useMemo(() => getTqf5DocumentId(navigationState, savedDraft), [navigationState, savedDraft])
  const requestedCourseItemId = useMemo(() => getRequestedCourseItemId(navigationState, savedDraft), [navigationState, savedDraft])
  const courseOpeningRequestId = useMemo(() => getCourseOpeningRequestId(navigationState, savedDraft), [navigationState, savedDraft])
  const savedPageData = savedDraft?.mqa5Insert4 || navigationState?.mqa5Insert4 || null
  const initialCourseSigners = useMemo(() => savedPageData?.courseSigners?.length ? normalizeSignerList(savedPageData.courseSigners, createCourseSigner) : buildCourseSignersFromNames(getAssignedTeacherNamesFromSource(navigationState)), [navigationState, savedPageData])
  const initialProgramSigners = useMemo(() => savedPageData?.programSigners?.length && hasFilledSignerList(savedPageData.programSigners) ? normalizeSignerList(savedPageData.programSigners, createProgramSigner) : buildProgramSignersFromPeople(getProgramResponsiblePeopleFromSource(navigationState)), [navigationState, savedPageData])

  const [plan151, setPlan151] = useState(savedPageData?.plan151 || '')
  const [result151, setResult151] = useState(savedPageData?.result151 || '')
  const [items152, setItems152] = useState(() => normalizeStringList(savedPageData?.items152))
  const [items153, setItems153] = useState(() => normalizeStringList(savedPageData?.items153))
  const [items16, setItems16] = useState(() => normalizeStringList(savedPageData?.items16))
  const [rows154, setRows154] = useState(() => normalizeRows154(savedPageData?.rows154))
  const [courseSigners, setCourseSigners] = useState(() => initialCourseSigners)
  const [programSigners, setProgramSigners] = useState(() => initialProgramSigners)
  const [isLoadingCourseSigners, setIsLoadingCourseSigners] = useState(false)
  const [isLoadingProgramSigners, setIsLoadingProgramSigners] = useState(false)
  const [courseSignerMessage, setCourseSignerMessage] = useState('')
  const [programSignerMessage, setProgramSignerMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [popup, setPopup] = useState({ open: false, title: '', value: '', mode: '', itemIndex: null, rowIndex: null, rowField: '', field: '' })

  useEffect(() => {
    if (savedPageData?.courseSigners?.length && hasFilledSignerList(savedPageData.courseSigners)) return
    if (!requestedCourseItemId) return
    let isMounted = true
    const fetchCourseAssignmentSigners = async () => {
      setIsLoadingCourseSigners(true)
      setCourseSignerMessage('')
      try {
        const response = await axios.get(getApiUrl(apiUrl, `/course-assignment/${requestedCourseItemId}`), getAuthConfig())
        const assignmentData = getResponseObject(response.data) || {}
        const teacherNames = getAssignedTeacherNamesFromSource({ ...assignmentData, courseItem: { ...navigationState?.courseItem, rawData: { ...(navigationState?.courseItem?.rawData || {}), ...assignmentData } } })
        if (!isMounted) return
        if (teacherNames.length) { setCourseSigners((prev) => buildCourseSignersFromNames(teacherNames, prev)); setCourseSignerMessage(`ดึงรายชื่อผู้ลงนามรายวิชาจากการมอบหมายแล้ว ${teacherNames.length} คน`) }
        else setCourseSignerMessage('ยังไม่พบรายชื่ออาจารย์ที่มอบหมายให้รายวิชานี้ ระบบจึงเว้นช่องให้กรอกเอง')
      } catch (error) {
        if (!isMounted) return
        console.error('Error fetching course assignment signers:', error)
        const fallbackNames = getAssignedTeacherNamesFromSource(navigationState)
        if (fallbackNames.length) { setCourseSigners((prev) => buildCourseSignersFromNames(fallbackNames, prev)); setCourseSignerMessage(`ใช้รายชื่อผู้ลงนามรายวิชาจากข้อมูลที่ส่งมากับหน้าเอกสาร ${fallbackNames.length} คน`) }
        else setCourseSignerMessage(getErrorMessage(error, 'ไม่สามารถดึงรายชื่อผู้ลงนามรายวิชาจากการมอบหมายได้ สามารถกรอกเองหรือเพิ่มชุดรายวิชาได้'))
      } finally {
        if (isMounted) setIsLoadingCourseSigners(false)
      }
    }
    fetchCourseAssignmentSigners()
    return () => { isMounted = false }
  }, [apiUrl, navigationState, requestedCourseItemId, savedPageData?.courseSigners])

  useEffect(() => {
    if (savedPageData?.programSigners?.length && hasFilledSignerList(savedPageData.programSigners)) return
    let isMounted = true
    const fetchProgramSigners = async () => {
      setIsLoadingProgramSigners(true)
      setProgramSignerMessage('')
      try {
        const directPeople = getProgramResponsiblePeopleFromSource(navigationState)
        if (directPeople.length) {
          if (!isMounted) return
          setProgramSigners((prev) => buildProgramSignersFromPeople(directPeople, prev))
          setProgramSignerMessage(`ดึงรายชื่อผู้ลงนามหลักสูตรจากข้อมูลเอกสารที่ส่งมากับหน้าแล้ว ${directPeople.length} คน`)
          return
        }

        let openingData = null
        if (courseOpeningRequestId) {
          const detailResponse = await axios.get(getApiUrl(apiUrl, `/course-opening/${courseOpeningRequestId}`), getAuthConfig())
          openingData = getResponseObject(detailResponse.data) || {}
        } else if (requestedCourseItemId || getCourseCodeFromState(navigationState) || getCourseIdFromState(navigationState)) {
          const listResponse = await axios.get(getApiUrl(apiUrl, '/course-opening/'), getAuthConfig())
          const openingList = getResponseList(listResponse.data, ['items', 'data', 'results', 'requests', 'courseOpenings', 'course_openings'])
          const matchedOpening = openingList.find((opening) => isOpeningMatchedWithCurrentCourse(opening, requestedCourseItemId, navigationState)) || null
          const matchedOpeningId = matchedOpening ? getCourseOpeningIdFromSource(matchedOpening) : ''
          if (matchedOpeningId) {
            try {
              const detailResponse = await axios.get(getApiUrl(apiUrl, `/course-opening/${matchedOpeningId}`), getAuthConfig())
              openingData = getResponseObject(detailResponse.data) || matchedOpening
            } catch {
              openingData = matchedOpening
            }
          } else openingData = matchedOpening
        }

        const programPeople = getProgramResponsiblePeopleFromSource(openingData || {})
        if (!isMounted) return
        if (programPeople.length) { setProgramSigners((prev) => buildProgramSignersFromPeople(programPeople, prev)); setProgramSignerMessage(`ดึงรายชื่อผู้ลงนามหลักสูตรจากเอกสารขอเปิดรายวิชาแล้ว ${programPeople.length} คน`) }
        else setProgramSignerMessage('ยังไม่พบรายชื่อผู้รับผิดชอบหลักสูตรจากเอกสารขอเปิดรายวิชา ระบบจึงเว้นช่องให้กรอกเอง')
      } catch (error) {
        if (!isMounted) return
        console.error('Error fetching program signers from course opening:', error)
        const fallbackPeople = getProgramResponsiblePeopleFromSource(navigationState)
        if (fallbackPeople.length) { setProgramSigners((prev) => buildProgramSignersFromPeople(fallbackPeople, prev)); setProgramSignerMessage(`ใช้รายชื่อผู้ลงนามหลักสูตรจากข้อมูลที่ส่งมากับหน้าเอกสาร ${fallbackPeople.length} คน`) }
        else setProgramSignerMessage(getErrorMessage(error, 'ไม่สามารถดึงรายชื่อผู้ลงนามหลักสูตรจากเอกสารขอเปิดรายวิชาได้ สามารถกรอกเองหรือเพิ่มชุดหลักสูตรได้'))
      } finally {
        if (isMounted) setIsLoadingProgramSigners(false)
      }
    }
    fetchProgramSigners()
    return () => { isMounted = false }
  }, [apiUrl, courseOpeningRequestId, navigationState, requestedCourseItemId, savedPageData?.programSigners])

  const isPageComplete = useMemo(() => {
    const planComplete = hasText(plan151) && hasText(result151)
    const listComplete = items152.every(hasText) && items153.every(hasText) && items16.every(hasText)
    const rows154Complete = rows154.length > 0 && rows154.every((row) => hasText(row.suggestion) && hasText(row.due) && hasText(row.owner))
    const courseSignersComplete = courseSigners.length > 0 && courseSigners.every((signer) => hasText(signer.name) && hasText(signer.signature) && hasText(signer.date))
    const programSignersComplete = programSigners.length > 0 && programSigners.every((signer) => hasText(signer.name) && hasText(signer.signature) && hasText(signer.date))
    return planComplete && listComplete && rows154Complete && courseSignersComplete && programSignersComplete
  }, [courseSigners, items152, items153, items16, plan151, programSigners, result151, rows154])

  const buildNextState = () => ({ ...navigationState, mqa5DraftKey: draftKey, referenceTqf3Id: tqf3ReferenceId, sourceTqf3Id: tqf3ReferenceId, tqf3Id: tqf3ReferenceId, mqa3Id: tqf3ReferenceId, tqf5Id: tqf5DocumentId, mqa5Id: tqf5DocumentId, requestedCourseItemId, openingCourseItemId: requestedCourseItemId || navigationState?.openingCourseItemId, courseOpeningRequestId, mqa5Insert4: { plan151, result151, items152, items153, rows154, items16, courseSigners, programSigners } })

  useEffect(() => {
    const nextState = buildNextState()
    writeMqa5Draft(draftKey, { draftKey, navigationState: nextState, referenceTqf3Id: tqf3ReferenceId, sourceTqf3Id: tqf3ReferenceId, tqf3Id: tqf3ReferenceId, mqa3Id: tqf3ReferenceId, tqf5Id: tqf5DocumentId, mqa5Id: tqf5DocumentId, requestedCourseItemId, openingCourseItemId: requestedCourseItemId || navigationState?.openingCourseItemId, courseOpeningRequestId, mqa5Insert4: { plan151, result151, items152, items153, rows154, items16, courseSigners, programSigners } })
  }, [courseOpeningRequestId, courseSigners, draftKey, items152, items153, items16, navigationState, plan151, programSigners, requestedCourseItemId, result151, rows154, tqf3ReferenceId, tqf5DocumentId])

  const openPopupForSimple = (field, title, value) => setPopup({ open: true, title, value: value || '', mode: field, itemIndex: null, rowIndex: null, rowField: '', field })
  const openPopupForList = (mode, itemIndex, title, value) => setPopup({ open: true, title, value: value || '', mode, itemIndex, rowIndex: null, rowField: '', field: '' })
  const openPopupForRow154 = (rowIndex, rowField, title, value) => setPopup({ open: true, title, value: value || '', mode: 'row154', itemIndex: null, rowIndex, rowField, field: '' })
  const closePopup = () => setPopup((prev) => ({ ...prev, open: false }))

  const savePopup = () => {
    if (popup.mode === 'plan151') setPlan151(popup.value)
    if (popup.mode === 'items152') setItems152((prev) => { const next = [...prev]; next[popup.itemIndex] = popup.value; return next })
    if (popup.mode === 'items153') setItems153((prev) => { const next = [...prev]; next[popup.itemIndex] = popup.value; return next })
    if (popup.mode === 'items16') setItems16((prev) => { const next = [...prev]; next[popup.itemIndex] = popup.value; return next })
    if (popup.mode === 'row154') setRows154((prev) => { const next = [...prev]; next[popup.rowIndex] = { ...next[popup.rowIndex], [popup.rowField]: popup.value }; return next })
    closePopup()
  }

  const toggleResult151 = (value) => setResult151((prev) => prev === value ? '' : value)
  const addListItem = (setter) => setter((prev) => [...prev, ''])
  const removeListItem = (setter, index) => setter((prev) => prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index))
  const addRow154 = () => setRows154((prev) => [...prev, { ...defaultRow154 }])
  const removeRow154 = (index) => setRows154((prev) => prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index))
  const addCourseSigner = () => setCourseSigners((prev) => [...prev, createCourseSigner()])
  const removeCourseSigner = (index) => setCourseSigners((prev) => prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index))
  const updateCourseSignerField = (index, field, value) => setCourseSigners((prev) => { const next = [...prev]; const nextSigner = { ...next[index], [field]: value }; if (field === 'name' && !hasText(nextSigner.signature)) nextSigner.signature = value; next[index] = nextSigner; return next })
  const addProgramSigner = () => setProgramSigners((prev) => [...prev, createProgramSigner()])
  const removeProgramSigner = (index) => setProgramSigners((prev) => prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index))
  const updateProgramSignerField = (index, field, value) => setProgramSigners((prev) => { const next = [...prev]; const nextSigner = { ...next[index], [field]: value }; if (field === 'name' && !hasText(nextSigner.signature)) nextSigner.signature = value; next[index] = nextSigner; return next })

  const handleBack = () => {
    const nextState = buildNextState()
    writeMqa5Draft(draftKey, { draftKey, navigationState: nextState, mqa5Insert4: { plan151, result151, items152, items153, rows154, items16, courseSigners, programSigners } })
    navigate('/mqa5Insert-3', { state: nextState })
  }

  const handleSaveDocument = async () => {
    if (!isPageComplete || isSaving) return
    const nextState = buildNextState()
    const latestDraft = writeMqa5Draft(draftKey, { draftKey, navigationState: nextState, mqa5Insert4: { plan151, result151, items152, items153, rows154, items16, courseSigners, programSigners } })
    const payload = buildTqf5Payload({ navigationState: latestDraft.navigationState || nextState, savedDraft: latestDraft, plan151, result151, items152, items153, rows154, items16, courseSigners, programSigners })
    if (!payload.course_id) { window.alert('ไม่พบรหัสรายวิชา ไม่สามารถบันทึกเอกสาร มคอ.5 ได้ กรุณากลับไปเลือกเอกสารจากหน้ารายวิชาที่ได้รับมอบหมายใหม่'); return }
    try {
      setIsSaving(true)
      let targetTqf5Id = getExistingTqf5IdFromSource(latestDraft.navigationState || nextState, latestDraft)
      let existingDocument = null
      if (!targetTqf5Id) { existingDocument = await findExistingTqf5Document(apiUrl, payload); targetTqf5Id = normalizePathId(existingDocument?.id) }
      if (existingDocument && existingDocument.status !== 'draft') { window.alert('เอกสาร มคอ.5 นี้ถูกส่งเข้าระบบแล้ว ไม่สามารถบันทึกทับแบบร่างได้'); return }
      targetTqf5Id = normalizePathId(targetTqf5Id)
      if (targetTqf5Id) {
        await axios.put(getApiUrl(apiUrl, `/tqf5/${targetTqf5Id}`), payload, getAuthConfig())
        writeMqa5Draft(draftKey, { ...latestDraft, tqf5Id: targetTqf5Id, mqa5Id: targetTqf5Id, isSavedToDatabase: true, mqa5Insert4: { plan151, result151, items152, items153, rows154, items16, courseSigners, programSigners } })
        window.alert('อัปเดตเอกสาร มคอ.5 แบบร่างเรียบร้อยแล้ว')
      } else {
        const response = await axios.post(getApiUrl(apiUrl, TQF5_ENDPOINT), payload, getAuthConfig())
        const newTqf5Id = pickPathId(response.data?.id, response.data?.data?.id, response.data?.tqf5_id, response.data?.tqf5Id, response.data?.mqa5_id, response.data?.mqa5Id)
        writeMqa5Draft(draftKey, { ...latestDraft, tqf5Id: newTqf5Id, mqa5Id: newTqf5Id, isSavedToDatabase: true, mqa5Insert4: { plan151, result151, items152, items153, rows154, items16, courseSigners, programSigners } })
        window.alert('บันทึกเอกสาร มคอ.5 แบบร่างเรียบร้อยแล้ว')
      }
      navigate('/mqaOverview')
    } catch (error) {
      console.error('Error saving TQF5 draft:', error)
      window.alert(getErrorMessage(error, 'ไม่สามารถบันทึกเอกสาร มคอ.5 ได้ กรุณาลองใหม่อีกครั้ง'))
    } finally {
      setIsSaving(false)
    }
  }

  const renderPopupField = (value, onClick, minRows = 4, extraClassName = '') => <TextField fullWidth multiline minRows={minRows} maxRows={minRows} value={value} placeholder="คลิกเพื่อกรอกข้อมูล" InputProps={{ readOnly: true }} onClick={onClick} className={`${styles.popupPreviewField} ${extraClassName}`} />

  const renderListSection = (title, items, mode, setter, isNumbered = false, hint = '') => (
    <Box className={styles.sectionBlock}>
      <Typography className={styles.subSectionTitle}>{title}</Typography>
      {hint && <Typography className={styles.helperText}>{hint}</Typography>}
      <Box className={styles.listWrap}>
        {items.map((item, index) => (
          <Box key={index} className={styles.listRow}>
            <Typography className={styles.listPrefix}>{isNumbered ? `${index + 1}.` : '■'}</Typography>
            <Box className={styles.listField}>{renderPopupField(item, () => openPopupForList(mode, index, `${title} (ข้อ ${index + 1})`, item), 2, styles.compactPreviewField)}</Box>
            <IconButton color="error" onClick={() => removeListItem(setter, index)} disabled={items.length === 1} className={styles.deleteButton}><DeleteOutlineIcon /></IconButton>
          </Box>
        ))}
      </Box>
      <Button startIcon={<AddCircleOutlineIcon />} variant="outlined" onClick={() => addListItem(setter)} className={styles.addButton}>เพิ่มข้อ</Button>
    </Box>
  )

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />
      <Box className={styles.container}>
        <Mqa5FormNav currentStep={4} />
        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>แผนการปรับปรุง</Typography>
              <Typography className={styles.pageDescription}>กรอกข้อมูลตามแบบฟอร์มเดิมของหัวข้อ 15 - 16 และข้อมูลลงชื่อสำหรับแบบฟอร์ม มคอ.5</Typography>
            </Box>
            <Box className={styles.pageStatus}>
              <Typography className={styles.pageStatusLabel}>สถานะหน้านี้</Typography>
              <Typography className={styles.pageStatusValue}>{isPageComplete ? 'ครบแล้ว' : 'ยังไม่ครบ'}</Typography>
            </Box>
          </Box>

          <Box className={styles.contentFlow}>
            <Box className={styles.sectionBlock}><Typography className={styles.sectionTitle}>15. แผนการปรับปรุง</Typography></Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.subSectionTitle}>15.1 ความก้าวหน้าของการปรับปรุงการเรียนการสอนตามที่เสนอในรายวิชาครั้งที่ผ่านมา (ถ้ามี)</Typography>
              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.fixedWideTable}>
                  <TableHead><TableRow><TableCell width="70%">แผนการปรับปรุงที่เสนอในภาคการศึกษา/ปีการศึกษาที่ผ่านมา</TableCell><TableCell width="30%">ผลการดำเนินการ</TableCell></TableRow></TableHead>
                  <TableBody><TableRow><TableCell>{renderPopupField(plan151, () => openPopupForSimple('plan151', '15.1 แผนการปรับปรุงที่เสนอในภาคการศึกษา/ปีการศึกษาที่ผ่านมา', plan151), 4)}</TableCell><TableCell><Box className={styles.checkboxGroup}><FormControlLabel control={<Checkbox checked={result151 === 'done'} onChange={() => toggleResult151('done')} />} label="ปรับปรุงแล้ว" /><FormControlLabel control={<Checkbox checked={result151 === 'no'} onChange={() => toggleResult151('no')} />} label="ไม่ได้ปรับปรุง" /><FormControlLabel control={<Checkbox checked={result151 === 'partial'} onChange={() => toggleResult151('partial')} />} label="ปรับปรุงแต่ไม่เสร็จสมบูรณ์" /></Box></TableCell></TableRow></TableBody>
                </Table>
              </TableContainer>
            </Box>

            {renderListSection('15.2 การดำเนินการอื่น ๆ ในการปรับปรุงรายวิชาให้สอดคล้องผลลัพธ์การเรียนรู้ (PLO)', items152, 'items152', setItems152, false, '(เช่น เพิ่มตัวอย่างให้นักศึกษา / อภิปรายกลุ่มย่อย / เชิญวิทยากร / โปรแกรมออกแบบผลงาน ฯลฯ)')}
            {renderListSection('15.3 ข้อเสนอแนะของอาจารย์ผู้รับผิดชอบรายวิชาต่ออาจารย์ผู้รับผิดชอบหลักสูตร', items153, 'items153', setItems153, false)}

            <Box className={styles.sectionBlock}>
              <Typography className={styles.subSectionTitle}>15.4 ข้อเสนอแผนการปรับปรุงสำหรับภาคการศึกษา/ปีการศึกษาต่อไปที่มีความสอดคล้องกับผลลัพธ์การเรียนรู้ (PLO) ของหลักสูตร</Typography>
              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.fixedWideTable}>
                  <TableHead><TableRow><TableCell width="50%">ข้อเสนอ</TableCell><TableCell width="25%">กำหนดเวลาแล้วเสร็จ</TableCell><TableCell width="17%">ผู้รับผิดชอบ</TableCell><TableCell width="8%" /></TableRow></TableHead>
                  <TableBody>
                    {rows154.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell><Box className={styles.indexedFieldWrap}><Typography className={styles.inlineIndex}>{index + 1}.</Typography><Box className={styles.inlineField}>{renderPopupField(row.suggestion, () => openPopupForRow154(index, 'suggestion', `15.4 ข้อเสนอ (ข้อ ${index + 1})`, row.suggestion), 3, styles.compactPreviewField)}</Box></Box></TableCell>
                        <TableCell>{renderPopupField(row.due, () => openPopupForRow154(index, 'due', `15.4 กำหนดเวลาแล้วเสร็จ (ข้อ ${index + 1})`, row.due), 2, styles.compactPreviewField)}</TableCell>
                        <TableCell>{renderPopupField(row.owner, () => openPopupForRow154(index, 'owner', `15.4 ผู้รับผิดชอบ (ข้อ ${index + 1})`, row.owner), 2, styles.compactPreviewField)}</TableCell>
                        <TableCell className={styles.actionCell}><IconButton color="error" onClick={() => removeRow154(index)} disabled={rows154.length === 1} className={styles.deleteButton}><DeleteOutlineIcon /></IconButton></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button startIcon={<AddCircleOutlineIcon />} variant="outlined" onClick={addRow154} className={styles.addButton}>เพิ่มแถว (15.4)</Button>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>16. แผนการบูรณาการระหว่างรายวิชา</Typography>
              <Typography className={styles.helperText}>(อธิบายการเชื่อมโยงรายวิชากับรายวิชาอื่น เช่น รายวิชาพื้นฐานที่สนับสนุนความเข้าใจ หรือรายวิชาต่อเนื่อง)</Typography>
            </Box>

            {renderListSection('ตัวอย่าง/รายการบูรณาการ', items16, 'items16', setItems16, true)}

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>ข้อมูลลงชื่อ</Typography>

              <Box className={styles.signGroup}>
                <Box className={styles.signHeaderRow}>
                  <Box>
                    <Typography className={styles.subSectionTitle}>ผู้ลงนามรายวิชา</Typography>
                    {courseSignerMessage && <Typography className={styles.helperText}>{isLoadingCourseSigners ? 'กำลังดึงรายชื่อผู้ลงนามรายวิชา...' : courseSignerMessage}</Typography>}
                    {!courseSignerMessage && isLoadingCourseSigners && <Typography className={styles.helperText}>กำลังดึงรายชื่อผู้ลงนามรายวิชา...</Typography>}
                  </Box>
                  <Button startIcon={<AddCircleOutlineIcon />} variant="outlined" onClick={addCourseSigner} className={styles.addButton}>เพิ่มชุดรายวิชา</Button>
                </Box>

                <Box className={styles.signerWrap}>
                  {courseSigners.map((signer, index) => (
                    <Box key={index} className={styles.signerCard}>
                      <Box className={styles.signerTopRow}>
                        <TextField label="ชื่ออาจารย์ผู้รับผิดชอบรายวิชา" value={signer.name} onChange={(event) => updateCourseSignerField(index, 'name', event.target.value)} fullWidth />
                        <IconButton color="error" onClick={() => removeCourseSigner(index)} disabled={courseSigners.length === 1} className={styles.deleteSignerButton}><DeleteOutlineIcon /></IconButton>
                      </Box>
                      <Box className={styles.signerBottomRow}>
                        <TextField label="ลงชื่อ" value={signer.signature} onChange={(event) => updateCourseSignerField(index, 'signature', event.target.value)} fullWidth />
                        <TextField type="date" label="วันที่รายงาน" value={signer.date} onChange={(event) => updateCourseSignerField(index, 'date', event.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box className={styles.signGroup}>
                <Box className={styles.signHeaderRow}>
                  <Box>
                    <Typography className={styles.subSectionTitle}>ผู้ลงนามหลักสูตร</Typography>
                    {programSignerMessage && <Typography className={styles.helperText}>{isLoadingProgramSigners ? 'กำลังดึงรายชื่อผู้ลงนามหลักสูตร...' : programSignerMessage}</Typography>}
                    {!programSignerMessage && isLoadingProgramSigners && <Typography className={styles.helperText}>กำลังดึงรายชื่อผู้ลงนามหลักสูตร...</Typography>}
                  </Box>
                  <Button startIcon={<AddCircleOutlineIcon />} variant="outlined" onClick={addProgramSigner} className={styles.addButton}>เพิ่มชุดหลักสูตร</Button>
                </Box>

                <Box className={styles.signerWrap}>
                  {programSigners.map((signer, index) => (
                    <Box key={index} className={styles.signerCard}>
                      <Box className={styles.signerTopRow}>
                        <TextField label="ชื่ออาจารย์ผู้รับผิดชอบหลักสูตร" value={signer.name} onChange={(event) => updateProgramSignerField(index, 'name', event.target.value)} fullWidth />
                        <IconButton color="error" onClick={() => removeProgramSigner(index)} disabled={programSigners.length === 1} className={styles.deleteSignerButton}><DeleteOutlineIcon /></IconButton>
                      </Box>
                      <Box className={styles.signerBottomRow}>
                        <TextField label="ลงชื่อ" value={signer.signature} onChange={(event) => updateProgramSignerField(index, 'signature', event.target.value)} fullWidth />
                        <TextField type="date" label="วันที่รับรายงาน" value={signer.date} onChange={(event) => updateProgramSignerField(index, 'date', event.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button variant="outlined" startIcon={<NavigateBeforeIcon />} className={styles.backButton} onClick={handleBack} disabled={isSaving}>ย้อนกลับ</Button>
            <Button variant="contained" className={styles.nextButton} onClick={handleSaveDocument} disabled={!isPageComplete || isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึกเอกสาร'}</Button>
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

export default Mqa5Insert4Page