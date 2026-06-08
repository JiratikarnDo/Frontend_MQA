import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Avatar, Box, Button, Chip, Dialog, DialogContent, IconButton, InputAdornment, MenuItem, TextField, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import styles from './teacherAssignModal.module.css'

const COURSE_ASSIGNMENT_ENDPOINT = '/course-assignment'
const DEPARTMENT_ENDPOINT = '/departments/'
const USER_ENDPOINT = '/users/'

const getAuthConfig = () => {
  const token = localStorage.getItem('mqa_token')
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} }
}

const normalizeText = (value) => String(value ?? '').trim()
const isIntegerLike = (value) => /^\d+$/.test(normalizeText(value))
const toNumberIfPossible = (value) => isIntegerLike(value) ? Number(value) : value
const getUniqueStringList = (valueList = []) => Array.from(new Set((Array.isArray(valueList) ? valueList : []).map((value) => normalizeText(value)).filter(Boolean)))
const getTeacherNameKey = (value) => normalizeText(value).toLowerCase().replace(/\s+/g, ' ')

const getResponseList = (data, keyList = []) => {
  if (Array.isArray(data)) return data
  for (const key of keyList) if (Array.isArray(data?.[key])) return data[key]
  return []
}

const getResponseObject = (data) => {
  if (Array.isArray(data)) return data[0] ?? null
  if (data?.user && typeof data.user === 'object') return data.user
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

function getLevelLabel(level) {
  if (level === 'bachelor') return 'ปริญญาตรี'
  if (level === 'master') return 'ปริญญาโท'
  if (level === 'doctoral') return 'ปริญญาเอก'
  return '-'
}

function getTeacherInitials(teacherName) {
  if (!teacherName) return 'อ'
  const cleanedName = teacherName.replace('อาจารย์', '').trim()
  const parts = cleanedName.split(' ')
  const firstChar = parts[0]?.charAt(0) || ''
  const secondChar = parts[1]?.charAt(0) || ''
  return `${firstChar}${secondChar}` || 'อ'
}

function getRoleLabel(role) {
  const roleText = normalizeText(role).toLowerCase()
  if (roleText === 'headmajor' || roleText === 'head_major') return 'หัวหน้าสาขา'
  if (roleText === 'teacher' || roleText === 'lecturer' || roleText === 'instructor') return 'อาจารย์ประจำสาขา'
  return normalizeText(role) || 'อาจารย์'
}

function isTeacherRole(role) {
  const roleText = normalizeText(role).toLowerCase()
  return ['teacher', 'headmajor', 'head_major', 'lecturer', 'instructor'].includes(roleText)
}

function getTeacherFullName(item) {
  const directName = normalizeText(item?.teacher_name ?? item?.teacherName ?? item?.full_name ?? item?.fullName ?? item?.name)
  if (directName) return directName
  return normalizeText([item?.prefixname ?? item?.prefix_name ?? item?.prefixName, item?.first_name ?? item?.firstName ?? item?.firstname, item?.last_name ?? item?.lastName ?? item?.lastname].filter(Boolean).join(' '))
}

function getDepartmentIdFromUser(user) {
  return user?.department_id ?? user?.departmentId ?? user?.department?.id ?? ''
}

function getDepartmentNameFromUser(user) {
  return normalizeText(user?.department_name ?? user?.departmentName ?? user?.department?.department_name ?? user?.department?.departmentName ?? user?.department?.name)
}

function getMajorNameFromUser(user) {
  const departmentName = getDepartmentNameFromUser(user)
  return normalizeText(user?.major_name ?? user?.majorName ?? user?.department?.major_name ?? user?.department?.majorName ?? departmentName.replace(/^สาขา/, ''))
}

function normalizeDepartmentFromApi(item) {
  const departmentId = item?.department_id ?? item?.departmentId ?? item?.id
  const departmentName = normalizeText(item?.department_name ?? item?.departmentName ?? item?.department_name_th ?? item?.departmentNameTh ?? item?.name_th ?? item?.name ?? item?.major_name ?? item?.majorName)
  const majorName = normalizeText(item?.major_name ?? item?.majorName ?? departmentName.replace(/^สาขา/, ''))
  return { id: departmentId ? String(departmentId) : '', departmentId: departmentId ? String(departmentId) : '', departmentName: departmentName || (departmentId ? `สาขา ID ${departmentId}` : '-'), majorName: majorName || departmentName || (departmentId ? `สาขา ID ${departmentId}` : '-'), rawData: item }
}

function normalizeDepartmentFromUserApi(user) {
  const departmentId = getDepartmentIdFromUser(user)
  const departmentName = getDepartmentNameFromUser(user)
  const majorName = getMajorNameFromUser(user)
  if (!departmentId && !departmentName && !majorName) return null
  return { id: departmentId ? String(departmentId) : normalizeText(departmentName || majorName), departmentId: departmentId ? String(departmentId) : '', departmentName: departmentName || majorName || (departmentId ? `สาขา ID ${departmentId}` : '-'), majorName: majorName || departmentName || (departmentId ? `สาขา ID ${departmentId}` : '-'), rawData: user }
}

function mergeDepartmentList(...departmentLists) {
  const departmentMap = new Map()
  departmentLists.flat().filter(Boolean).forEach((department) => {
    const normalizedDepartment = normalizeDepartmentFromApi(department)
    if (!normalizedDepartment.id || normalizedDepartment.departmentName === '-') return
    const key = String(normalizedDepartment.id)
    const oldDepartment = departmentMap.get(key)
    if (!oldDepartment) departmentMap.set(key, normalizedDepartment)
    else departmentMap.set(key, { ...oldDepartment, departmentName: oldDepartment.departmentName?.startsWith('สาขา ID') ? normalizedDepartment.departmentName : oldDepartment.departmentName, majorName: oldDepartment.majorName?.startsWith('สาขา ID') ? normalizedDepartment.majorName : oldDepartment.majorName, rawData: oldDepartment.rawData })
  })
  return Array.from(departmentMap.values()).sort((a, b) => a.departmentName.localeCompare(b.departmentName, 'th'))
}

function normalizeTeacherFromUserApi(item, departmentNameMap = new Map(), departmentMajorNameMap = new Map()) {
  const teacherId = item?.teacher_id ?? item?.teacherId ?? item?.user_id ?? item?.userId ?? item?.id
  const departmentId = getDepartmentIdFromUser(item)
  const departmentNameFromMap = departmentId ? departmentNameMap.get(String(departmentId)) : ''
  const majorNameFromMap = departmentId ? departmentMajorNameMap.get(String(departmentId)) : ''
  const departmentName = normalizeText(item?.department_name ?? item?.departmentName ?? item?.department?.department_name ?? item?.department?.departmentName ?? item?.department?.name ?? departmentNameFromMap)
  const majorName = normalizeText(item?.major_name ?? item?.majorName ?? item?.department?.major_name ?? item?.department?.majorName ?? majorNameFromMap ?? departmentName.replace(/^สาขา/, ''))
  return { id: teacherId ? String(teacherId) : '', teacherId, teacherName: getTeacherFullName(item) || '-', teacherRole: getRoleLabel(item?.role ?? item?.teacher_role ?? item?.teacherRole), role: normalizeText(item?.role ?? item?.teacher_role ?? item?.teacherRole), majorName: majorName || departmentName || '-', departmentId: departmentId ? String(departmentId) : '', departmentName: departmentName || majorName || (departmentId ? `สาขา ID ${departmentId}` : '-'), rawData: item }
}

function getAssignedTeacherObjectId(teacher) {
  return teacher?.teacher_id ?? teacher?.teacherId ?? teacher?.user_id ?? teacher?.userId ?? teacher?.id
}

function getAssignedTeacherIdList(courseItem) {
  const directIdList = getResponseList(courseItem?.assignedTeacherIds ?? courseItem?.assigned_teacher_ids ?? courseItem?.rawData?.assigned_teacher_ids ?? courseItem?.rawData?.assignedTeacherIds)
  const teacherObjectList = getResponseList(courseItem?.assignedTeacherList ?? courseItem?.assigned_teachers ?? courseItem?.assignedTeachersRaw ?? courseItem?.rawData?.assigned_teachers ?? courseItem?.rawData?.assignedTeachers)
  const objectIdList = teacherObjectList.map(getAssignedTeacherObjectId).filter(Boolean)
  return getUniqueStringList([...directIdList, ...objectIdList])
}

function getAssignedTeacherNameList(courseItem) {
  const nameList = getResponseList(courseItem?.assignedTeachers)
  const teacherObjectList = getResponseList(courseItem?.assignedTeacherList ?? courseItem?.assigned_teachers ?? courseItem?.assignedTeachersRaw ?? courseItem?.rawData?.assigned_teachers ?? courseItem?.rawData?.assignedTeachers)
  const objectNameList = teacherObjectList.map((teacher) => getTeacherFullName(teacher)).filter(Boolean)
  const nameMap = new Map()
  const mergedNameList = [...nameList, ...objectNameList].map((name) => normalizeText(name)).filter(Boolean)
  mergedNameList.forEach((name) => {
    const key = getTeacherNameKey(name)
    if (key && !nameMap.has(key)) nameMap.set(key, name)
  })
  return Array.from(nameMap.values())
}

function getRequestedCourseItemId(courseItem) {
  return courseItem?.requestedCourseItemId ?? courseItem?.requested_course_item_id ?? courseItem?.requestedCourseItemID ?? courseItem?.rawData?.requested_course_item_id ?? courseItem?.rawData?.requestedCourseItemId ?? courseItem?.rawData?.course_id ?? courseItem?.rawData?.courseId ?? courseItem?.id
}

function getCourseDepartmentId(courseItem) {
  return courseItem?.departmentId ?? courseItem?.department_id ?? courseItem?.rawData?.department_id ?? courseItem?.rawData?.departmentId ?? ''
}

function getCourseMajorName(courseItem) {
  return normalizeText(courseItem?.majorName ?? courseItem?.major_name ?? courseItem?.rawData?.major_name ?? courseItem?.rawData?.majorName)
}

function normalizeDepartmentNameForCompare(value) {
  return normalizeText(value).toLowerCase().replace(/^สาขา/, '').replace(/\s+/g, '')
}

function isSameCourseDepartment(department, courseItem, fallbackDepartmentId = '', fallbackDepartmentName = '') {
  const courseDepartmentId = normalizeText(getCourseDepartmentId(courseItem) || fallbackDepartmentId)
  const departmentId = normalizeText(department?.id ?? department?.departmentId)
  if (courseDepartmentId && departmentId) return courseDepartmentId === departmentId
  const courseMajorName = normalizeDepartmentNameForCompare(getCourseMajorName(courseItem) || fallbackDepartmentName)
  const departmentMajorName = normalizeDepartmentNameForCompare(department?.majorName ?? department?.departmentName)
  if (!courseMajorName || !departmentMajorName) return false
  return courseMajorName === departmentMajorName || departmentMajorName.includes(courseMajorName) || courseMajorName.includes(departmentMajorName)
}

function isTeacherInDepartment(teacher, departmentId, departmentData = null) {
  const teacherDepartmentId = normalizeText(teacher?.departmentId)
  const targetDepartmentId = normalizeText(departmentId)
  if (targetDepartmentId && teacherDepartmentId) return teacherDepartmentId === targetDepartmentId
  const targetDepartmentName = normalizeDepartmentNameForCompare(departmentData?.departmentName ?? departmentData?.majorName)
  const teacherDepartmentName = normalizeDepartmentNameForCompare(teacher?.departmentName ?? teacher?.majorName)
  if (!targetDepartmentName || !teacherDepartmentName) return false
  return teacherDepartmentName === targetDepartmentName || teacherDepartmentName.includes(targetDepartmentName) || targetDepartmentName.includes(teacherDepartmentName)
}

function TeacherAssignModal({ open, onClose, courseItem, onSave }) {
  const apiUrl = import.meta.env.VITE_API_URL || ''
  const [searchText, setSearchText] = useState('')
  const [teacherScope, setTeacherScope] = useState('department')
  const [teacherOptions, setTeacherOptions] = useState([])
  const [allTeacherOptions, setAllTeacherOptions] = useState([])
  const [departmentOptions, setDepartmentOptions] = useState([])
  const [currentUserDepartmentId, setCurrentUserDepartmentId] = useState('')
  const [currentUserDepartmentName, setCurrentUserDepartmentName] = useState('')
  const [selectedExternalDepartmentId, setSelectedExternalDepartmentId] = useState('')
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([])
  const [selectedTeacherMap, setSelectedTeacherMap] = useState({})
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false)
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [departmentErrorMessage, setDepartmentErrorMessage] = useState('')

  const ownDepartmentId = useMemo(() => normalizeText(getCourseDepartmentId(courseItem) || currentUserDepartmentId), [courseItem, currentUserDepartmentId])
  const ownDepartmentName = useMemo(() => normalizeText(getCourseMajorName(courseItem) || currentUserDepartmentName), [courseItem, currentUserDepartmentName])
  const availableDepartmentOptions = useMemo(() => departmentOptions.filter((department) => !isSameCourseDepartment(department, courseItem, currentUserDepartmentId, currentUserDepartmentName)), [courseItem, currentUserDepartmentId, currentUserDepartmentName, departmentOptions])
  const selectedExternalDepartment = useMemo(() => availableDepartmentOptions.find((department) => String(department.id) === String(selectedExternalDepartmentId)) || null, [availableDepartmentOptions, selectedExternalDepartmentId])

  const fetchModalData = useCallback(async () => {
    if (!open) return
    setIsLoadingTeachers(true)
    setIsLoadingDepartments(true)
    setErrorMessage('')
    setDepartmentErrorMessage('')

    try {
      const config = getAuthConfig()
      let currentUserData = null
      let nextCurrentUserDepartmentId = ''
      let nextCurrentUserDepartmentName = ''
      let departmentListFromDepartmentApi = []
      let userList = []

      try {
        const userResponse = await axios.get(`${apiUrl}/auth/me`, config)
        currentUserData = getResponseObject(userResponse.data)
        nextCurrentUserDepartmentId = getDepartmentIdFromUser(currentUserData) ? String(getDepartmentIdFromUser(currentUserData)) : ''
        nextCurrentUserDepartmentName = getDepartmentNameFromUser(currentUserData)
        setCurrentUserDepartmentId(nextCurrentUserDepartmentId)
        setCurrentUserDepartmentName(nextCurrentUserDepartmentName)
      } catch (error) {
        console.error('Error fetching current user:', error)
        setCurrentUserDepartmentId('')
        setCurrentUserDepartmentName('')
      }

      try {
        const departmentResponse = await axios.get(`${apiUrl}${DEPARTMENT_ENDPOINT}`, config)
        const departmentResponseList = getResponseList(departmentResponse.data, ['items', 'data', 'results', 'departments'])
        departmentListFromDepartmentApi = departmentResponseList.map(normalizeDepartmentFromApi).filter((department) => department.id && department.departmentName !== '-')
      } catch (error) {
        console.error('Error fetching departments:', error)
        setDepartmentErrorMessage(getErrorMessage(error, 'ไม่สามารถดึงรายการสาขาจากระบบได้ จึงใช้ข้อมูลสาขาจากรายชื่อผู้ใช้แทน'))
      }

      try {
        const usersResponse = await axios.get(`${apiUrl}${USER_ENDPOINT}`, config)
        userList = getResponseList(usersResponse.data, ['items', 'data', 'results', 'users'])
      } catch (error) {
        console.error('Error fetching teacher users:', error)
        setAllTeacherOptions([])
        setErrorMessage(getErrorMessage(error, 'ไม่สามารถดึงรายชื่ออาจารย์จากระบบได้'))
        return
      }

      const departmentListFromUsers = userList.map(normalizeDepartmentFromUserApi).filter(Boolean)
      const mergedDepartmentList = mergeDepartmentList(departmentListFromDepartmentApi, departmentListFromUsers)
      const departmentNameMap = new Map(mergedDepartmentList.map((department) => [String(department.departmentId || department.id), department.departmentName]))
      const departmentMajorNameMap = new Map(mergedDepartmentList.map((department) => [String(department.departmentId || department.id), department.majorName]))
      const normalizedTeacherList = userList.map((user) => normalizeTeacherFromUserApi(user, departmentNameMap, departmentMajorNameMap)).filter((teacher) => teacher.id && teacher.teacherName !== '-' && isTeacherRole(teacher.role))

      const currentUserAsTeacher = currentUserData ? normalizeTeacherFromUserApi(currentUserData, departmentNameMap, departmentMajorNameMap) : null
      if (currentUserAsTeacher?.id && currentUserAsTeacher.teacherName !== '-' && isTeacherRole(currentUserAsTeacher.role)) {
        const alreadyExists = normalizedTeacherList.some((teacher) => String(teacher.id) === String(currentUserAsTeacher.id))
        if (!alreadyExists) normalizedTeacherList.unshift(currentUserAsTeacher)
      }

      const nextDepartmentList = mergeDepartmentList(mergedDepartmentList, currentUserAsTeacher ? [normalizeDepartmentFromUserApi(currentUserAsTeacher.rawData)] : [])
      setDepartmentOptions(nextDepartmentList)
      setAllTeacherOptions(normalizedTeacherList)
      setSelectedTeacherMap((prev) => {
        const nextMap = { ...prev }
        normalizedTeacherList.forEach((teacher) => { nextMap[teacher.id] = teacher })
        return nextMap
      })
    } catch (error) {
      console.error('Error fetching modal data:', error)
      setAllTeacherOptions([])
      setDepartmentOptions([])
      setErrorMessage(getErrorMessage(error, 'ไม่สามารถดึงข้อมูลสำหรับมอบหมายอาจารย์ได้'))
    } finally {
      setIsLoadingTeachers(false)
      setIsLoadingDepartments(false)
    }
  }, [apiUrl, open])

  useEffect(() => {
    if (!open) return
    setSearchText('')
    setTeacherScope('department')
    setTeacherOptions([])
    setAllTeacherOptions([])
    setDepartmentOptions([])
    setSelectedExternalDepartmentId('')
    setErrorMessage('')
    setDepartmentErrorMessage('')
    fetchModalData()

    if (!courseItem) {
      setSelectedTeacherIds([])
      setSelectedTeacherMap({})
      return
    }

    const assignedTeacherIdList = getAssignedTeacherIdList(courseItem)
    const assignedTeacherNameList = getAssignedTeacherNameList(courseItem)
    setSelectedTeacherIds(assignedTeacherIdList)
    setSelectedTeacherMap((prev) => {
      const nextMap = { ...prev }
      assignedTeacherIdList.forEach((teacherId, index) => {
        const teacherName = assignedTeacherNameList[index] || ''
        if (!nextMap[teacherId]) nextMap[teacherId] = { id: teacherId, teacherId, teacherName, teacherRole: 'อาจารย์', majorName: '-', departmentName: '-', rawData: null }
      })
      return nextMap
    })
  }, [courseItem, fetchModalData, open])

  useEffect(() => {
    if (!open) return
    const targetDepartmentId = teacherScope === 'outside' ? selectedExternalDepartmentId : ownDepartmentId
    const targetDepartmentData = teacherScope === 'outside' ? selectedExternalDepartment : { id: ownDepartmentId, departmentId: ownDepartmentId, departmentName: ownDepartmentName, majorName: ownDepartmentName }

    if (teacherScope === 'outside' && !selectedExternalDepartmentId) {
      setTeacherOptions([])
      return
    }

    setTeacherOptions(allTeacherOptions.filter((teacher) => isTeacherInDepartment(teacher, targetDepartmentId, targetDepartmentData)))
  }, [allTeacherOptions, open, ownDepartmentId, ownDepartmentName, selectedExternalDepartment, selectedExternalDepartmentId, teacherScope])

  useEffect(() => {
    if (!allTeacherOptions.length || !courseItem) return
    const assignedTeacherNameList = getAssignedTeacherNameList(courseItem)
    if (!assignedTeacherNameList.length) return

    const assignedNameKeySet = new Set(assignedTeacherNameList.map(getTeacherNameKey).filter(Boolean))
    const matchedAssignedTeacherList = allTeacherOptions.filter((teacher) => assignedNameKeySet.has(getTeacherNameKey(teacher.teacherName)))
    if (!matchedAssignedTeacherList.length) return

    const matchedNameKeySet = new Set(matchedAssignedTeacherList.map((teacher) => getTeacherNameKey(teacher.teacherName)).filter(Boolean))
    const originalAssignedIdList = getAssignedTeacherIdList(courseItem)
    const originalAssignedNameList = getAssignedTeacherNameList(courseItem)
    const fallbackAssignedIdList = originalAssignedIdList.filter((teacherId, index) => {
      const nameKey = getTeacherNameKey(originalAssignedNameList[index])
      return !nameKey || !matchedNameKeySet.has(nameKey)
    })

    setSelectedTeacherIds(getUniqueStringList([...fallbackAssignedIdList, ...matchedAssignedTeacherList.map((teacher) => teacher.id)]))
    setSelectedTeacherMap((prev) => {
      const nextMap = { ...prev }
      matchedAssignedTeacherList.forEach((teacher) => { nextMap[teacher.id] = teacher })
      return nextMap
    })
  }, [allTeacherOptions, courseItem])

  const availableTeacherOptions = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLowerCase()
    if (!normalizedSearchText) return teacherOptions
    return teacherOptions.filter((teacher) => teacher.teacherName.toLowerCase().includes(normalizedSearchText) || teacher.teacherRole.toLowerCase().includes(normalizedSearchText) || teacher.departmentName.toLowerCase().includes(normalizedSearchText) || teacher.majorName.toLowerCase().includes(normalizedSearchText))
  }, [searchText, teacherOptions])

  const selectedTeacherList = useMemo(() => {
    const teacherMap = new Map()
    selectedTeacherIds.forEach((teacherId) => {
      const teacher = selectedTeacherMap[teacherId]
      if (!teacher) return
      const key = getTeacherNameKey(teacher.teacherName) ? `name:${getTeacherNameKey(teacher.teacherName)}` : `id:${teacher.id}`
      if (!teacherMap.has(key)) teacherMap.set(key, teacher)
    })
    return Array.from(teacherMap.values())
  }, [selectedTeacherIds, selectedTeacherMap])

  const handleChangeTeacherScope = (nextScope) => {
    setTeacherScope(nextScope)
    setSearchText('')
    setTeacherOptions([])
    setErrorMessage('')
    if (nextScope === 'department') setSelectedExternalDepartmentId('')
  }

  const handleToggleTeacher = (teacher) => {
    setSelectedTeacherIds((prev) => prev.includes(teacher.id) ? prev.filter((item) => item !== teacher.id) : getUniqueStringList([...prev, teacher.id]))
    setSelectedTeacherMap((prev) => ({ ...prev, [teacher.id]: teacher }))
  }

  const handleRemoveSelectedTeacher = (teacherId) => {
    const removingNameKey = getTeacherNameKey(selectedTeacherMap[teacherId]?.teacherName)
    setSelectedTeacherIds((prev) => prev.filter((item) => item !== teacherId && (!removingNameKey || getTeacherNameKey(selectedTeacherMap[item]?.teacherName) !== removingNameKey)))
  }

  const handleSave = async () => {
    const requestedCourseItemId = getRequestedCourseItemId(courseItem)
    if (!requestedCourseItemId || !isIntegerLike(requestedCourseItemId)) {
      window.alert('ไม่พบ ID ตัวเลขของรายการรายวิชาที่ต้องการมอบหมาย กรุณาตรวจสอบข้อมูลจากหน้ารายการรายวิชา')
      return
    }

    setIsSaving(true)
    const selectedTeacherIdPayload = getUniqueStringList(selectedTeacherList.map((teacher) => teacher.teacherId ?? teacher.id)).map(toNumberIfPossible).filter((teacherId) => teacherId !== '' && teacherId !== null && teacherId !== undefined)
    const selectedTeacherNames = selectedTeacherList.map((teacher) => teacher.teacherName)
    const hasExistingAssignment = Boolean(courseItem?.assignmentId) || Boolean(courseItem?.assignment_id) || Boolean(courseItem?.rawData?.assignment_id) || Boolean(courseItem?.rawData?.assignmentId) || Boolean(courseItem?.assignedTeachers?.length)

    try {
      if (!selectedTeacherIdPayload.length) {
        if (hasExistingAssignment) await axios.delete(`${apiUrl}${COURSE_ASSIGNMENT_ENDPOINT}/${requestedCourseItemId}`, getAuthConfig())
        onSave?.([])
        return
      }

      const payload = { teacher_ids: selectedTeacherIdPayload }

      try {
        if (hasExistingAssignment) await axios.put(`${apiUrl}${COURSE_ASSIGNMENT_ENDPOINT}/${requestedCourseItemId}`, payload, getAuthConfig())
        else await axios.post(`${apiUrl}${COURSE_ASSIGNMENT_ENDPOINT}/${requestedCourseItemId}`, payload, getAuthConfig())
      } catch (error) {
        if (hasExistingAssignment && error?.response?.status === 404) await axios.post(`${apiUrl}${COURSE_ASSIGNMENT_ENDPOINT}/${requestedCourseItemId}`, payload, getAuthConfig())
        else throw error
      }

      onSave?.(selectedTeacherNames, { teacherIds: selectedTeacherIdPayload, teachers: selectedTeacherList })
    } catch (error) {
      console.error('Error saving teacher assignment:', error)
      window.alert(getErrorMessage(error, 'ไม่สามารถบันทึกการมอบหมายอาจารย์ได้'))
    } finally {
      setIsSaving(false)
    }
  }

  const scopeTitle = teacherScope === 'department' ? 'อาจารย์ในสาขา' : 'อาจารย์นอกสาขา'
  const shouldShowSelectDepartmentMessage = teacherScope === 'outside' && !selectedExternalDepartmentId && !isLoadingDepartments

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} maxWidth="lg" fullWidth scroll="paper" PaperProps={{ className: styles.dialogPaper }}>
      <DialogContent className={styles.dialogContent}>
        <Box className={styles.backgroundGlowTop} />
        <Box className={styles.backgroundGlowBottom} />

        <Box className={styles.modalShell}>
          <Box className={styles.modalHeader}>
            <Box className={styles.headerContent}>
              <Typography className={styles.modalTitle}>เพิ่มอาจารย์ผู้สอน</Typography>
              <Typography className={styles.modalDescription}>เลือกอาจารย์ผู้รับผิดชอบรายวิชาที่ผ่านการอนุมัติเปิดสอนแล้ว สามารถเลือกได้หลายคน ทั้งอาจารย์ในสาขาและอาจารย์นอกสาขา</Typography>
            </Box>
            <IconButton onClick={onClose} className={styles.closeButton} disabled={isSaving}><CloseRoundedIcon /></IconButton>
          </Box>

          {courseItem && (
            <Box className={styles.courseInfoCard}>
              <Box className={styles.courseInfoGrid}>
                <Box className={styles.infoItem}><Box className={styles.infoIconBlue}><MenuBookRoundedIcon /></Box><Box><Typography className={styles.infoLabel}>รายวิชา</Typography><Typography className={styles.infoValue}>{courseItem.courseCode} - {courseItem.courseName}</Typography></Box></Box>
                <Box className={styles.infoItem}><Box className={styles.infoIconIndigo}><SchoolRoundedIcon /></Box><Box><Typography className={styles.infoLabel}>ระดับหลักสูตร / ชั้นปี</Typography><Typography className={styles.infoValue}>{getLevelLabel(courseItem.level)} • ชั้นปี {courseItem.yearLevel}</Typography></Box></Box>
                <Box className={styles.infoItem}><Box className={styles.infoIconGreen}><GroupsRoundedIcon /></Box><Box><Typography className={styles.infoLabel}>กลุ่ม / นักศึกษา</Typography><Typography className={styles.infoValue}>กลุ่ม {courseItem.sectionNumber} • {courseItem.studentCount} คน</Typography></Box></Box>
              </Box>
              <Typography className={styles.courseMetaText}>{courseItem.curriculumName} • สาขา{courseItem.majorName} • ภาคการศึกษา {courseItem.semester}/{courseItem.academicYear}</Typography>
            </Box>
          )}

          <Box className={styles.contentGrid}>
            <Box className={styles.leftPanel}>
              <Box className={styles.panelHeader}>
                <Typography className={styles.panelTitle}>ค้นหา{scopeTitle}</Typography>
                <Typography className={styles.panelDescription}>เลือกอาจารย์จากรายการด้านล่าง โดยอาจารย์นอกสาขาต้องเลือกสาขาก่อน แล้วระบบจะแสดงรายชื่อจาก /users/ ตามสาขาที่เลือก</Typography>
              </Box>

              <Box className={styles.scopeButtonGroup}>
                <Button variant={teacherScope === 'department' ? 'contained' : 'outlined'} className={teacherScope === 'department' ? styles.scopeButtonActive : styles.scopeButton} onClick={() => handleChangeTeacherScope('department')} disabled={isLoadingTeachers || isSaving}>อาจารย์ในสาขา</Button>
                <Button variant={teacherScope === 'outside' ? 'contained' : 'outlined'} className={teacherScope === 'outside' ? styles.scopeButtonActive : styles.scopeButton} onClick={() => handleChangeTeacherScope('outside')} disabled={isLoadingTeachers || isSaving}>อาจารย์นอกสาขา</Button>
              </Box>

              {teacherScope === 'outside' && (
                <Box className={styles.externalDepartmentBox}>
                  <TextField select fullWidth label="เลือกสาขานอกหลักสูตร" value={selectedExternalDepartmentId} onChange={(event) => { setSelectedExternalDepartmentId(event.target.value); setSearchText(''); setTeacherOptions([]); setErrorMessage('') }} disabled={isLoadingDepartments || isSaving} helperText={departmentErrorMessage || (selectedExternalDepartment ? `กำลังเลือก: ${selectedExternalDepartment.departmentName}` : 'เลือกสาขาก่อนเพื่อดึงรายชื่ออาจารย์ในสาขานั้น')}>
                    <MenuItem value="">กรุณาเลือกสาขา</MenuItem>
                    {availableDepartmentOptions.map((department) => <MenuItem key={department.id} value={department.id}>{department.departmentName}</MenuItem>)}
                  </TextField>
                  {isLoadingDepartments && <Typography className={styles.externalDepartmentHint}>กำลังโหลดรายการสาขา...</Typography>}
                </Box>
              )}

              <TextField fullWidth label="ค้นหาอาจารย์" placeholder="ค้นหาจากชื่อ ตำแหน่ง หรือสาขา" value={searchText} onChange={(event) => setSearchText(event.target.value)} disabled={isLoadingTeachers || isSaving || shouldShowSelectDepartmentMessage} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchRoundedIcon /></InputAdornment>) }} />

              <Box className={styles.teacherList}>
                {shouldShowSelectDepartmentMessage && <Box className={styles.emptyState}><Typography className={styles.emptyStateTitle}>กรุณาเลือกสาขาก่อน</Typography><Typography className={styles.emptyStateDescription}>เมื่อเลือกสาขาแล้ว ระบบจะแสดงอาจารย์ของสาขานั้นจากข้อมูล /users/</Typography></Box>}
                {isLoadingTeachers && <Box className={styles.emptyState}><Typography className={styles.emptyStateTitle}>กำลังโหลดรายชื่ออาจารย์</Typography><Typography className={styles.emptyStateDescription}>ระบบกำลังดึงข้อมูลจาก API</Typography></Box>}
                {!isLoadingTeachers && errorMessage && !shouldShowSelectDepartmentMessage && <Box className={styles.emptyState}><Typography className={styles.emptyStateTitle}>เกิดข้อผิดพลาด</Typography><Typography className={styles.emptyStateDescription}>{errorMessage}</Typography><Button variant="contained" onClick={fetchModalData} disabled={isSaving}>โหลดใหม่</Button></Box>}

                {!isLoadingTeachers && !errorMessage && !shouldShowSelectDepartmentMessage && availableTeacherOptions.map((teacher) => {
                  const isSelected = selectedTeacherIds.includes(teacher.id)
                  return (
                    <Box key={teacher.id} className={`${styles.teacherCard} ${isSelected ? styles.teacherCardSelected : ''}`} onClick={() => { if (!isSaving) handleToggleTeacher(teacher) }}>
                      <Box className={styles.teacherCardLeft}>
                        <Avatar className={styles.teacherAvatar}>{getTeacherInitials(teacher.teacherName)}</Avatar>
                        <Box className={styles.teacherTextBlock}>
                          <Typography className={styles.teacherName}>{teacher.teacherName}</Typography>
                          <Typography className={styles.teacherMeta}>{teacher.teacherRole}</Typography>
                          <Typography className={styles.teacherDepartment}>{teacher.departmentName}</Typography>
                        </Box>
                      </Box>
                      <Box className={styles.teacherCardRight}>{isSelected ? <Chip icon={<CheckCircleRoundedIcon />} label="เลือกแล้ว" className={styles.selectedChip} size="small" /> : <Chip icon={<PersonAddAlt1RoundedIcon />} label="กดเพื่อเลือก" className={styles.defaultChip} size="small" />}</Box>
                    </Box>
                  )
                })}

                {!isLoadingTeachers && !errorMessage && !shouldShowSelectDepartmentMessage && !availableTeacherOptions.length && <Box className={styles.emptyState}><Typography className={styles.emptyStateTitle}>ไม่พบอาจารย์ในสาขาที่เลือก</Typography><Typography className={styles.emptyStateDescription}>ตรวจสอบว่า /users/ ส่ง department_id ของอาจารย์กลับมาหรือไม่ หรือ API /users/ อาจส่งกลับมาเฉพาะอาจารย์ในสาขาของผู้ใช้ปัจจุบัน</Typography></Box>}
              </Box>
            </Box>

            <Box className={styles.rightPanel}>
              <Box className={styles.panelHeader}>
                <Typography className={styles.panelTitle}>อาจารย์ที่เลือกแล้ว</Typography>
                <Typography className={styles.panelDescription}>สามารถลบรายชื่อที่เลือกออกได้ก่อนกดบันทึก</Typography>
              </Box>

              <Box className={styles.selectedSummaryCard}>
                <Typography className={styles.selectedSummaryLabel}>จำนวนอาจารย์ที่เลือก</Typography>
                <Typography className={styles.selectedSummaryValue}>{selectedTeacherList.length} คน</Typography>
              </Box>

              <Box className={styles.selectedTeacherList}>
                {selectedTeacherList.length > 0 ? selectedTeacherList.map((teacher) => (
                  <Box key={teacher.id} className={styles.selectedTeacherCard}>
                    <Box className={styles.selectedTeacherInfo}>
                      <Avatar className={styles.selectedTeacherAvatar}>{getTeacherInitials(teacher.teacherName)}</Avatar>
                      <Box><Typography className={styles.selectedTeacherName}>{teacher.teacherName}</Typography><Typography className={styles.selectedTeacherMeta}>{teacher.teacherRole} • {teacher.departmentName}</Typography></Box>
                    </Box>
                    <IconButton className={styles.removeButton} onClick={() => handleRemoveSelectedTeacher(teacher.id)} disabled={isSaving}><DeleteOutlineRoundedIcon /></IconButton>
                  </Box>
                )) : <Box className={styles.emptySelectedState}><Typography className={styles.emptyStateTitle}>ยังไม่ได้เลือกอาจารย์</Typography><Typography className={styles.emptyStateDescription}>เลือกอาจารย์จากรายการด้านซ้ายเพื่อกำหนดผู้รับผิดชอบรายวิชา</Typography></Box>}
              </Box>
            </Box>
          </Box>

          <Box className={styles.actionRow}>
            <Button variant="outlined" className={styles.cancelButton} onClick={onClose} disabled={isSaving}>ยกเลิก</Button>
            <Button variant="contained" className={styles.saveButton} onClick={handleSave} disabled={isSaving || isLoadingTeachers}>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการมอบหมาย'}</Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default TeacherAssignModal