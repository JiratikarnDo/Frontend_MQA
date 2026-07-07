import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Autocomplete, Box, Button, Checkbox, Chip, FormControlLabel, MenuItem, Radio, RadioGroup, TextField, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import SubjectSelectorModal from '../../components/courseOpeningBachelor/subjectSelectorModal'
import styles from './courseOpeningBachelorPage.module.css'

const COURSE_OPENING_ENDPOINT = '/course-opening/'

const learningPeriodOptions = [
  { value: 'regular', label: 'ภาคปกติ' },
  { value: 'evening', label: 'ภาคนอกเวลาราชการ (จ.-ศ. ค่ำ)' },
  { value: 'sunday', label: 'ภาคนอกเวลาราชการ (วันอาทิตย์)' },
]

const campusOptions = [
  { value: 'chakrabongse', label: 'จักรพงษภูวนารถ' },
  { value: 'bangpra', label: 'บางพระ' },
]

const targetGroupOptions = [
  { value: 'bp', label: 'BP' },
  { value: 'fivePlus', label: 'Five Plus' },
  { value: 'specialProgram', label: 'ส.อ.บ.' },
]

const yearLevelOptions = ['1', '2', '3', '4', '5', '6']

const defaultGeneralForm = { submissionRound: '1', semester: '1', academicYear: '2568', curriculumName: '', majorName: '', programType: '4year' }
const defaultStudyForm = { learningPeriod: 'regular', campus: 'bangpra', targetGroup: 'bp' }

const getAuthConfig = () => {
  const token = localStorage.getItem('mqa_token')
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} }
}

const getResponseList = (data, keyList = []) => {
  if (Array.isArray(data)) return data
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

const getDepartmentIdFromUser = (user) => user?.department?.id ?? user?.department_id ?? user?.departmentId ?? null

const getDepartmentNameFromUser = (user) => {
  return user?.department?.department_name ?? user?.department?.departmentName ?? user?.department_name ?? user?.departmentName ?? ''
}

const getCurriculumNameThai = (curriculum) => {
  return curriculum?.curriculum_name_thai ?? curriculum?.curriculumNameThai ?? curriculum?.curriculum_name_th ?? curriculum?.curriculumNameTh ?? ''
}

const isBachelorCurriculum = (curriculum) => {
  const curriculumLevel = String(curriculum?.curriculum_level || '').toLowerCase()
  return curriculumLevel === 'bachelor' || curriculumLevel.includes('bachelor') || curriculumLevel.includes('ปริญญาตรี') || curriculumLevel.includes('ตรี') || curriculumLevel === ''
}

const isCurriculumMatchedWithDepartment = (curriculum, departmentId) => {
  const departmentIdText = String(departmentId || '')
  const sharedDepartments = getResponseList(curriculum, ['shared_departments', 'sharedDepartments', 'departments', 'department_list'])
  return sharedDepartments.some((item) => {
    const currentDepartmentId = item?.department_id ?? item?.departmentId ?? item?.department?.id ?? item?.id
    return String(currentDepartmentId) === departmentIdText
  })
}

const normalizeText = (value) => String(value ?? '').trim()
const getResponsibleUserId = (user) => user?.id ?? user?.user_id ?? user?.userId ?? user?.email ?? user?.username ?? ''

const getResponsibleUserDepartmentId = (user) => {
  return user?.department?.id ?? user?.department?.department_id ?? user?.department?.departmentId ?? user?.department_id ?? user?.departmentId ?? user?.major?.id ?? user?.major_id ?? user?.majorId ?? ''
}

const getResponsibleUserDepartmentName = (user) => {
  return user?.department?.department_name ?? user?.department?.departmentName ?? user?.department?.department_name_thai ?? user?.department?.departmentNameThai ?? user?.department?.name ?? user?.department_name ?? user?.departmentName ?? user?.department_name_thai ?? user?.departmentNameThai ?? user?.major?.name ?? user?.major?.major_name ?? user?.major_name ?? user?.majorName ?? ''
}

const getResponsibleUserDisplayName = (user) => {
  const directName = user?.full_name ?? user?.fullName ?? user?.name ?? user?.display_name ?? user?.displayName ?? user?.teacher_name ?? user?.teacherName ?? user?.employee_name ?? user?.employeeName ?? user?.thai_name ?? user?.thaiName ?? ''
  if (normalizeText(directName)) return normalizeText(directName)

  const prefix = user?.prefixname ?? user?.prefixName ?? user?.prefix ?? user?.prefix_name ?? user?.title ?? user?.academic_title ?? user?.academicTitle ?? ''
  const firstName = user?.first_name ?? user?.firstName ?? user?.firstname ?? user?.given_name ?? user?.givenName ?? user?.first_name_th ?? user?.firstNameTh ?? user?.fname_th ?? user?.fnameTh ?? ''
  const lastName = user?.last_name ?? user?.lastName ?? user?.lastname ?? user?.surname ?? user?.family_name ?? user?.familyName ?? user?.last_name_th ?? user?.lastNameTh ?? user?.lname_th ?? user?.lnameTh ?? ''
  const builtName = normalizeText(`${prefix} ${firstName} ${lastName}`)
  if (builtName) return builtName
  return normalizeText(user?.email ?? user?.username ?? '')
}

const normalizeResponsibleUserFromApi = (user) => {
  const name = getResponsibleUserDisplayName(user)
  const userId = getResponsibleUserId(user)
  return { id: String(userId || name), name, email: normalizeText(user?.email ?? ''), departmentId: normalizeText(getResponsibleUserDepartmentId(user)), departmentName: getResponsibleUserDepartmentName(user), rawData: user }
}

const getUserRole = (user) => normalizeText(user?.role).toLowerCase()

const findUserByRole = (userList, targetRole) => {
  const roleText = normalizeText(targetRole).toLowerCase()
  return userList.find((user) => getUserRole(user) === roleText) ?? null
}

const filterResponsibleUsersByDepartment = (userList, userDepartmentId, userDepartmentName) => {
  const departmentIdText = normalizeText(userDepartmentId)
  const departmentNameText = normalizeText(userDepartmentName).toLowerCase()

  return userList.filter((user) => {
    const responsibleDepartmentId = normalizeText(user.departmentId)
    const responsibleDepartmentName = normalizeText(user.departmentName).toLowerCase()

    if (departmentIdText && responsibleDepartmentId) return responsibleDepartmentId === departmentIdText
    if (departmentNameText && responsibleDepartmentName) return responsibleDepartmentName === departmentNameText || responsibleDepartmentName.includes(departmentNameText) || departmentNameText.includes(responsibleDepartmentName)

    return false
  })
}

const getCourseOpeningRequestId = (requestData) => requestData?.id ?? requestData?.request_id ?? requestData?.requestId ?? null

const toNumberOrZero = (value) => {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

const toNullableDate = (value) => value || null

const getTodayDateString = () => {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

const isPastDate = (value) => {
  const dateText = normalizeText(value)
  return Boolean(dateText) && dateText < getTodayDateString()
}

const getPositiveNumberFromValue = (value) => {
  const text = normalizeText(value)
  if (!text) return 0

  const directNumber = Number(text)
  if (Number.isFinite(directNumber)) return directNumber

  const firstNumber = text.match(/\d+(\.\d+)?/)
  return firstNumber ? Number(firstNumber[0]) : 0
}

const isCode15CourseCode = (courseCode) => {
  const cleanCode = normalizeText(courseCode).replace(/\s+/g, '').replace(/–/g, '-')
  return cleanCode.startsWith('15')
}

function createDefaultResponsiblePeople() {
  return [
    { id: 1, name: '', signedDate: '' },
    { id: 2, name: '', signedDate: '' },
    { id: 3, name: '', signedDate: '' },
  ]
}

function createDefaultApprovalForm() {
  return { responsiblePeople: createDefaultResponsiblePeople(), headName: '', headDate: '', deputyDeanName: 'ผู้ช่วยศาสตราจารย์ อภิรัตน์ ใจผ่อง', deputyDeanDate: '', deanName: '', deanDate: '', isConfirmed: false }
}

function createEmptySubjectRow() {
  return { id: Date.now() + Math.random(), courseId: '', courseCode: '', courseName: '', credits: '', groupCount: '1', studentCount: '', isFreeElective: false, scienceTrack: false, humanitiesTrack: false, note: '' }
}

function createYearBlock(order = 1) {
  return { id: Date.now() + Math.random(), yearLevel: String(order), entryTerm: '', academicYear: '', subjectRows: [createEmptySubjectRow()] }
}

function normalizeSubjectRow(row = {}) {
  return { ...createEmptySubjectRow(), ...row, id: row.id ?? Date.now() + Math.random(), courseId: row.courseId ?? row.course_id ?? '' }
}

function normalizeYearBlock(block = {}, order = 1) {
  return { ...createYearBlock(order), ...block, id: block.id ?? Date.now() + Math.random(), yearLevel: String(block.yearLevel ?? order), subjectRows: Array.isArray(block.subjectRows) && block.subjectRows.length ? block.subjectRows.map((row) => normalizeSubjectRow(row)) : [createEmptySubjectRow()] }
}

function normalizeResponsiblePeople(responsiblePeople) {
  if (!Array.isArray(responsiblePeople) || !responsiblePeople.length) return createDefaultResponsiblePeople()
  return responsiblePeople.map((person, index) => ({ id: person.id ?? Date.now() + Math.random() + index, name: person.name ?? '', signedDate: person.signedDate ?? '' }))
}

function buildInitialPageData(requestData) {
  const documentData = requestData?.documentData || {}
  const defaultApprovalForm = createDefaultApprovalForm()

  return {
    generalForm: { ...defaultGeneralForm, ...(documentData.generalForm || {}) },
    studyForm: { ...defaultStudyForm, ...(documentData.studyForm || {}) },
    yearBlocks: Array.isArray(documentData.yearBlocks) && documentData.yearBlocks.length ? documentData.yearBlocks.map((block, index) => normalizeYearBlock(block, index + 1)) : [createYearBlock(1)],
    approvalForm: { ...defaultApprovalForm, ...(documentData.approvalForm || {}), responsiblePeople: normalizeResponsiblePeople(documentData.approvalForm?.responsiblePeople) },
  }
}

function getStatusConfig(status) {
  if (status === 'draft') return { label: 'บันทึกแล้ว ยังไม่ส่ง', className: styles.statusChipDraft }
  if (status === 'pendingApproval' || status === 'pending') return { label: 'ส่งเอกสารแล้วกำลังรออนุมัติ', className: styles.statusChipPendingApproval }
  if (status === 'approved') return { label: 'อนุมัติแล้ว', className: styles.statusChipPendingApproval }
  if (status === 'rejected' || status === 'rejected_by_dean') return { label: 'ไม่อนุมัติ', className: styles.statusChipRejected }
  return { label: '-', className: '' }
}

const normalizeRequestStatus = (status) => normalizeText(status).toLowerCase().replace(/[\s_-]/g, '')
const isRejectedRequestStatus = (status) => ['rejected', 'rejectedbydean', 'reject'].includes(normalizeRequestStatus(status))

function CourseOpeningBachelorPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL
  const requestData = location.state?.requestData || null
  const initialPageData = useMemo(() => buildInitialPageData(requestData), [requestData])

  const [pageMode, setPageMode] = useState(requestData ? 'view' : 'create')
  const [generalForm, setGeneralForm] = useState(initialPageData.generalForm)
  const [studyForm, setStudyForm] = useState(initialPageData.studyForm)
  const [yearBlocks, setYearBlocks] = useState(initialPageData.yearBlocks)
  const [approvalForm, setApprovalForm] = useState(initialPageData.approvalForm)
  const [createdRequestId, setCreatedRequestId] = useState(getCourseOpeningRequestId(requestData) || '')
  const [subjectSelectorState, setSubjectSelectorState] = useState({ isOpen: false, blockId: null, rowId: null })
  const [isInitialInfoLoading, setIsInitialInfoLoading] = useState(false)
  const [initialInfoErrorMessage, setInitialInfoErrorMessage] = useState('')
  const [responsibleUserOptions, setResponsibleUserOptions] = useState([])
  const [isResponsibleUserLoading, setIsResponsibleUserLoading] = useState(false)
  const [responsibleUserErrorMessage, setResponsibleUserErrorMessage] = useState('')
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

  const fetchInitialCurriculumAndDepartment = useCallback(async () => {
    if (requestData) return

    setIsInitialInfoLoading(true)
    setInitialInfoErrorMessage('')

    try {
      const config = getAuthConfig()
      const userResponse = await axios.get(`${apiUrl}/auth/me`, config)
      const currentUser = getResponseObject(userResponse.data)
      const userDepartmentId = getDepartmentIdFromUser(currentUser)
      const userDepartmentName = getDepartmentNameFromUser(currentUser)

      if (!userDepartmentId) {
        setGeneralForm((prev) => ({ ...prev, majorName: userDepartmentName || prev.majorName }))
        setInitialInfoErrorMessage('ไม่พบรหัสสาขาของผู้ใช้งานปัจจุบัน จึงยังไม่สามารถค้นหาหลักสูตรที่ผูกกับสาขาได้')
        return
      }

      const curriculumResponse = await axios.get(`${apiUrl}/curriculums/`, config)
      const curriculumList = getResponseList(curriculumResponse.data, ['items', 'data', 'curriculums', 'results'])

      const curriculumDetailList = await Promise.all(
        curriculumList.map(async (curriculum) => {
          const curriculumId = curriculum.id ?? curriculum.curriculum_id
          if (!curriculumId) return curriculum

          try {
            const detailResponse = await axios.get(`${apiUrl}/curriculums/${curriculumId}`, config)
            return getResponseObject(detailResponse.data) || curriculum
          } catch {
            return curriculum
          }
        })
      )

      const matchedCurriculum = curriculumDetailList.find((curriculum) => isBachelorCurriculum(curriculum) && isCurriculumMatchedWithDepartment(curriculum, userDepartmentId)) || curriculumDetailList.find((curriculum) => isCurriculumMatchedWithDepartment(curriculum, userDepartmentId))

      setGeneralForm((prev) => ({ ...prev, majorName: userDepartmentName || prev.majorName, curriculumName: getCurriculumNameThai(matchedCurriculum) || prev.curriculumName }))

      if (!matchedCurriculum) setInitialInfoErrorMessage('พบข้อมูลสาขาของผู้ใช้งานแล้ว แต่ยังไม่พบหลักสูตรระดับปริญญาตรีที่ผูกกับสาขานี้')
    } catch (error) {
      console.error('Error fetching initial curriculum and department:', error)
      setInitialInfoErrorMessage(getErrorMessage(error, 'ไม่สามารถดึงข้อมูลหลักสูตรและสาขาของผู้ใช้งานได้'))
    } finally {
      setIsInitialInfoLoading(false)
    }
  }, [apiUrl, requestData])

  const fetchResponsibleUsers = useCallback(async () => {
    setIsResponsibleUserLoading(true)
    setResponsibleUserErrorMessage('')

    try {
      const config = getAuthConfig()
      const userResponse = await axios.get(`${apiUrl}/auth/me`, config)
      const currentUser = getResponseObject(userResponse.data)
      const userDepartmentId = getDepartmentIdFromUser(currentUser)
      const userDepartmentName = getDepartmentNameFromUser(currentUser)
      const currentUserName = getResponsibleUserDisplayName(currentUser)

      if (!userDepartmentId && !userDepartmentName) {
        setResponsibleUserOptions([])
        setResponsibleUserErrorMessage('ไม่พบข้อมูลสาขาของผู้ใช้งาน จึงยังไม่สามารถดึงรายชื่อผู้รับผิดชอบหลักสูตรในสาขาเดียวกันได้')
        return
      }

      const usersResponse = await axios.get(`${apiUrl}/users/`, config)
      const userList = getResponseList(usersResponse.data, ['users', 'items', 'data', 'results'])
      const deanUser = findUserByRole(userList, 'dean')
      const deanName = deanUser ? getResponsibleUserDisplayName(deanUser) : ''

      if (!requestData) setApprovalForm((prev) => ({ ...prev, headName: currentUserName || prev.headName, deanName: deanName || prev.deanName }))

      const normalizedUserMap = new Map()
      const normalizedCurrentUser = normalizeResponsibleUserFromApi({ ...currentUser, department_id: getDepartmentIdFromUser(currentUser), department_name: getDepartmentNameFromUser(currentUser) })

      if (normalizedCurrentUser.name) {
        const currentUserKey = normalizedCurrentUser.email || normalizedCurrentUser.id || normalizedCurrentUser.name
        normalizedUserMap.set(currentUserKey, { ...normalizedCurrentUser, departmentId: normalizedCurrentUser.departmentId || normalizeText(userDepartmentId), departmentName: normalizedCurrentUser.departmentName || userDepartmentName || '' })
      }

      userList.map((user) => normalizeResponsibleUserFromApi(user)).filter((user) => user.name).forEach((user) => {
        const key = user.email || user.id || user.name
        if (!normalizedUserMap.has(key)) normalizedUserMap.set(key, user)
      })

      const normalizedUserList = Array.from(normalizedUserMap.values())
      const filteredUserList = filterResponsibleUsersByDepartment(normalizedUserList, userDepartmentId, userDepartmentName)

      setResponsibleUserOptions(filteredUserList)
      if (!filteredUserList.length) setResponsibleUserErrorMessage('ไม่พบรายชื่อผู้ใช้ในสาขาเดียวกันจาก API /users/')
    } catch (error) {
      console.error('Error fetching responsible users:', error)
      setResponsibleUserOptions([])
      setResponsibleUserErrorMessage(getErrorMessage(error, 'ไม่สามารถดึงรายชื่อผู้รับผิดชอบหลักสูตรจากระบบได้'))
    } finally {
      setIsResponsibleUserLoading(false)
    }
  }, [apiUrl, requestData])

  useEffect(() => { fetchInitialCurriculumAndDepartment() }, [fetchInitialCurriculumAndDepartment])
  useEffect(() => { fetchResponsibleUsers() }, [fetchResponsibleUsers])

  const isViewMode = pageMode === 'view'
  const isEditMode = pageMode === 'edit'
  const isCreateMode = pageMode === 'create'
  const isFormDisabled = isViewMode || isSubmittingRequest

  const currentRequestStatus = requestData?.status || 'draft'
  const statusConfig = getStatusConfig(currentRequestStatus)
  const canEditCurrentDocument = !requestData || currentRequestStatus === 'draft' || currentRequestStatus === 'rejected' || currentRequestStatus === 'rejected_by_dean'

  const allowedTargetGroupOptions = useMemo(() => {
    if (studyForm.campus === 'chakrabongse') return ['specialProgram']
    return ['bp', 'fivePlus']
  }, [studyForm.campus])

  const resetFormStatesFromRequest = () => {
    const nextPageData = buildInitialPageData(requestData)
    setGeneralForm(nextPageData.generalForm)
    setStudyForm(nextPageData.studyForm)
    setYearBlocks(nextPageData.yearBlocks)
    setApprovalForm(nextPageData.approvalForm)
    setSubjectSelectorState({ isOpen: false, blockId: null, rowId: null })
  }

  const handleChangeGeneralForm = (event) => {
    const { name, value } = event.target
    setGeneralForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleChangeStudyForm = (event) => {
    const { name, value } = event.target

    if (name === 'campus') {
      const nextTargetGroup = value === 'chakrabongse' ? 'specialProgram' : 'bp'
      setStudyForm((prev) => ({ ...prev, campus: value, targetGroup: nextTargetGroup }))
      return
    }

    setStudyForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleChangeYearBlockField = (blockId, fieldName, value) => {
    setYearBlocks((prev) => prev.map((block) => (block.id === blockId ? { ...block, [fieldName]: value } : block)))
  }

const handleChangeSubjectRowField = (blockId, rowId, fieldName, value) => {
  setYearBlocks((prev) =>
    prev.map((block) => {
      if (block.id !== blockId) return block

      return {
        ...block,
        subjectRows: block.subjectRows.map((row) => {
          if (row.id !== rowId) return row

          if (fieldName === 'courseCode') {
            return { ...row, courseCode: value, isFreeElective: isCode15CourseCode(value) ? true : row.isFreeElective }
          }

          return { ...row, [fieldName]: value }
        }),
      }
    })
  )
}

  const handleToggleSubjectRowCheckbox = (blockId, rowId, fieldName) => {
    setYearBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block

        return {
          ...block,
          subjectRows: block.subjectRows.map((row) => {
            if (row.id !== rowId) return row

            if (fieldName === 'scienceTrack') {
              const nextScienceTrack = !row.scienceTrack
              return { ...row, scienceTrack: nextScienceTrack, humanitiesTrack: nextScienceTrack ? false : row.humanitiesTrack }
            }

            if (fieldName === 'humanitiesTrack') {
              const nextHumanitiesTrack = !row.humanitiesTrack
              return { ...row, humanitiesTrack: nextHumanitiesTrack, scienceTrack: nextHumanitiesTrack ? false : row.scienceTrack }
            }

            return { ...row, [fieldName]: !row[fieldName] }
          }),
        }
      })
    )
  }

  const handleAddSubjectRow = (blockId) => {
    setYearBlocks((prev) => prev.map((block) => (block.id === blockId ? { ...block, subjectRows: [...block.subjectRows, createEmptySubjectRow()] } : block)))
  }

  const handleDeleteSubjectRow = (blockId, rowId) => {
    setYearBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block
        if (block.subjectRows.length === 1) {
          window.alert('อย่างน้อย 1 ตารางชั้นปี ต้องมีรายวิชาอย่างน้อย 1 แถว')
          return block
        }
        return { ...block, subjectRows: block.subjectRows.filter((row) => row.id !== rowId) }
      })
    )
  }

  const handleAddYearBlock = () => {
    if (yearBlocks.length >= 6) {
      window.alert('เพิ่มตารางชั้นปีได้สูงสุด 6 ตาราง')
      return
    }

    const usedYearLevels = yearBlocks.map((block) => block.yearLevel)
    const nextAvailableYearLevel = yearLevelOptions.find((yearLevel) => !usedYearLevels.includes(yearLevel)) || String(Math.min(yearBlocks.length + 1, 6))
    setYearBlocks((prev) => [...prev, createYearBlock(nextAvailableYearLevel)])
  }

  const handleDeleteYearBlock = (blockId) => {
    if (yearBlocks.length === 1) {
      window.alert('ต้องมีตารางชั้นปีอย่างน้อย 1 ตาราง')
      return
    }

    setYearBlocks((prev) => prev.filter((block) => block.id !== blockId))
  }

  const openSubjectSelector = (blockId, rowId) => {
    if (isFormDisabled) return
    setSubjectSelectorState({ isOpen: true, blockId, rowId })
  }

  const closeSubjectSelector = () => setSubjectSelectorState({ isOpen: false, blockId: null, rowId: null })

const handleSelectSubject = (selectedSubject) => {
  const selectedScienceTrack = Boolean(selectedSubject.scienceTrack)
  const selectedHumanitiesTrack = selectedScienceTrack ? false : Boolean(selectedSubject.humanitiesTrack)
  const selectedCourseCode = selectedSubject.courseCode ?? ''
  const selectedIsFreeElective = isCode15CourseCode(selectedCourseCode) || Boolean(selectedSubject.isFreeElective)

  setYearBlocks((prev) =>
    prev.map((block) => {
      if (block.id !== subjectSelectorState.blockId) return block

      return {
        ...block,
        subjectRows: block.subjectRows.map((row) =>
          row.id === subjectSelectorState.rowId
            ? {
                ...row,
                courseId: selectedSubject.courseId ?? selectedSubject.id ?? '',
                courseCode: selectedCourseCode,
                courseName: selectedSubject.courseName,
                credits: selectedSubject.credits,
                isFreeElective: selectedIsFreeElective,
                scienceTrack: selectedScienceTrack,
                humanitiesTrack: selectedHumanitiesTrack,
              }
            : row
        ),
      }
    })
  )

  closeSubjectSelector()
}

  const handleAddResponsiblePerson = () => {
    setApprovalForm((prev) => ({ ...prev, responsiblePeople: [...prev.responsiblePeople, { id: Date.now() + Math.random(), name: '', signedDate: '' }] }))
  }

  const handleRemoveResponsiblePerson = (personId) => {
    if (approvalForm.responsiblePeople.length <= 3) {
      window.alert('ผู้รับผิดชอบหลักสูตรต้องมีอย่างน้อย 3 คน')
      return
    }

    setApprovalForm((prev) => ({ ...prev, responsiblePeople: prev.responsiblePeople.filter((person) => person.id !== personId) }))
  }

const handleChangeResponsiblePerson = (personId, fieldName, value) => {
  const nextValue = normalizeText(value)

  if (fieldName === 'name' && nextValue) {
    const isDuplicated = approvalForm.responsiblePeople.some((person) => person.id !== personId && normalizeText(person.name) === nextValue)

    if (isDuplicated) {
      window.alert('ไม่สามารถเลือกผู้รับผิดชอบหลักสูตรคนเดิมซ้ำได้')
      return
    }
  }

  setApprovalForm((prev) => ({ ...prev, responsiblePeople: prev.responsiblePeople.map((person) => (person.id === personId ? { ...person, [fieldName]: value } : person)) }))
}

  const handleChangeApprovalField = (event) => {
    const { name, value, checked, type } = event.target
    setApprovalForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const buildCourseOpeningPayload = () => {
    const requestedCourses = yearBlocks.flatMap((block) =>
      block.subjectRows.map((row) => ({
        year_level: toNumberOrZero(block.yearLevel),
        course_id: toNumberOrZero(row.courseId),
        group_no: toNumberOrZero(row.groupCount || 1),
        student_count: toNumberOrZero(row.studentCount),
        is_elective: Boolean(row.isFreeElective),
        is_science_related: Boolean(row.scienceTrack),
        is_humanities_related: Boolean(row.humanitiesTrack),
        note: normalizeText(row.note) || null,
      }))
    )

    return {
      submission_times: toNumberOrZero(generalForm.submissionRound || 1),
      semester: generalForm.semester,
      academic_year: toNumberOrZero(generalForm.academicYear),
      curriculum_name: normalizeText(generalForm.curriculumName),
      major_name: normalizeText(generalForm.majorName),
      program_type: generalForm.programType,
      study_mode: studyForm.learningPeriod,
      campus: studyForm.campus,
      target_group: studyForm.targetGroup,
      requested_courses: requestedCourses,
      responsible_persons: approvalForm.responsiblePeople.map((person) => ({ name: normalizeText(person.name), signed_date: toNullableDate(person.signedDate) })),
      head_of_department: { name: normalizeText(approvalForm.headName), signed_date: toNullableDate(approvalForm.headDate) },
      vice_dean: { name: normalizeText(approvalForm.deputyDeanName), signed_date: toNullableDate(approvalForm.deputyDeanDate) },
      dean: { name: normalizeText(approvalForm.deanName), signed_date: toNullableDate(approvalForm.deanDate) },
      is_confirmed: false,
    }
  }

const validateDraftPayload = (payload, formState = {}) => {
  if (!payload.curriculum_name) return 'กรุณาระบุชื่อหลักสูตร'
  if (!payload.major_name) return 'กรุณาระบุสาขาวิชา/กลุ่มวิชา'
  if (!payload.semester) return 'กรุณาเลือกภาคการศึกษา'
  if (!payload.academic_year) return 'กรุณาระบุปีการศึกษา'
  if (!payload.study_mode) return 'กรุณาเลือกภาคการเรียน'
  if (!payload.campus) return 'กรุณาเลือกเขตพื้นที่'
  if (!payload.target_group) return 'กรุณาเลือกกลุ่มเป้าหมาย'
  if (!payload.requested_courses.length) return 'กรุณาเพิ่มรายวิชาอย่างน้อย 1 รายวิชา'

  const subjectRows = (formState.yearBlocks || []).flatMap((block) => block.subjectRows.map((row) => ({ block, row })))

  const invalidCourseCodeIndex = subjectRows.findIndex(({ row }) => !normalizeText(row.courseCode))
  if (invalidCourseCodeIndex !== -1) return `กรุณาระบุรหัสวิชาของรายวิชาลำดับที่ ${invalidCourseCodeIndex + 1}`

  const invalidCreditsIndex = subjectRows.findIndex(({ row }) => getPositiveNumberFromValue(row.credits) <= 0)
  if (invalidCreditsIndex !== -1) return `กรุณาระบุจำนวนหน่วยกิตของรายวิชาลำดับที่ ${invalidCreditsIndex + 1}`

  const invalidCourseIndex = payload.requested_courses.findIndex((course) => !course.course_id)
  if (invalidCourseIndex !== -1) return `รายวิชาลำดับที่ ${invalidCourseIndex + 1} ยังไม่ได้เลือกรายวิชาจากระบบ กรุณากดปุ่ม "เลือกรายวิชา"`

  const invalidGroupIndex = payload.requested_courses.findIndex((course) => !course.group_no || course.group_no <= 0)
  if (invalidGroupIndex !== -1) return `กรุณาระบุจำนวนกลุ่มของรายวิชาลำดับที่ ${invalidGroupIndex + 1}`

  const invalidStudentIndex = payload.requested_courses.findIndex((course) => !course.student_count || course.student_count <= 0)
  if (invalidStudentIndex !== -1) return `กรุณาระบุจำนวนนักศึกษา(จริง)ของรายวิชาลำดับที่ ${invalidStudentIndex + 1}`

  const invalidTrackIndex = payload.requested_courses.findIndex((course) => !course.is_science_related && !course.is_humanities_related)
  if (invalidTrackIndex !== -1) return `กรุณาติ๊กสายวิทยาศาสตร์ หรือมนุษยศาสตร์และสังคมศาสตร์ ของรายวิชาลำดับที่ ${invalidTrackIndex + 1}`

  if (payload.responsible_persons.length < 3) return 'ผู้รับผิดชอบหลักสูตรต้องมีอย่างน้อย 3 คน'

  const invalidResponsibleIndex = payload.responsible_persons.findIndex((person) => !normalizeText(person.name))
  if (invalidResponsibleIndex !== -1) return `กรุณาเลือกผู้รับผิดชอบหลักสูตร คนที่ ${invalidResponsibleIndex + 1}`

  const invalidResponsibleDateIndex = payload.responsible_persons.findIndex((person) => !normalizeText(person.signed_date))
  if (invalidResponsibleDateIndex !== -1) return `กรุณาระบุวันที่ลงนามของผู้รับผิดชอบหลักสูตร คนที่ ${invalidResponsibleDateIndex + 1}`

  const pastResponsibleDateIndex = payload.responsible_persons.findIndex((person) => isPastDate(person.signed_date))
  if (pastResponsibleDateIndex !== -1) return `วันที่ลงนามของผู้รับผิดชอบหลักสูตร คนที่ ${pastResponsibleDateIndex + 1} ต้องไม่เป็นวันที่ย้อนหลัง`

  const responsibleNameList = payload.responsible_persons.map((person) => normalizeText(person.name)).filter(Boolean)
  const duplicateResponsibleName = responsibleNameList.find((name, index) => responsibleNameList.indexOf(name) !== index)
  if (duplicateResponsibleName) return `ไม่สามารถเลือกผู้รับผิดชอบหลักสูตรซ้ำได้: ${duplicateResponsibleName}`

  if (!normalizeText(payload.head_of_department.name)) return 'กรุณาระบุชื่อหัวหน้าสาขาวิชา'
  if (!normalizeText(payload.head_of_department.signed_date)) return 'กรุณาระบุวันที่ลงนามของหัวหน้าสาขาวิชา'
  if (isPastDate(payload.head_of_department.signed_date)) return 'วันที่ลงนามของหัวหน้าสาขาวิชาต้องไม่เป็นวันที่ย้อนหลัง'

  if (!normalizeText(payload.vice_dean.name)) return 'กรุณาระบุชื่อรองคณบดี'
  if (!normalizeText(payload.vice_dean.signed_date)) return 'กรุณาระบุวันที่ลงนามของรองคณบดี'
  if (isPastDate(payload.vice_dean.signed_date)) return 'วันที่ลงนามของรองคณบดีต้องไม่เป็นวันที่ย้อนหลัง'

  if (normalizeText(payload.dean.signed_date) && isPastDate(payload.dean.signed_date)) return 'วันที่ลงนามของคณบดีต้องไม่เป็นวันที่ย้อนหลัง'

  return ''
}

const saveDraftRequest = async ({ returnToViewMode = false } = {}) => {
  const payload = buildCourseOpeningPayload()
  const validationMessage = validateDraftPayload(payload, { yearBlocks, approvalForm })
  if (validationMessage) { window.alert(validationMessage); return }

  const requestId = getCourseOpeningRequestId(requestData) || createdRequestId
  const isRejectedRequest = isRejectedRequestStatus(currentRequestStatus)
  const updatePayload = isRejectedRequest ? { ...payload, status: 'draft' } : payload

  closeSubjectSelector()
  setIsSubmittingRequest(true)

  try {
    if (requestId) {
      await axios.put(`${apiUrl}${COURSE_OPENING_ENDPOINT}${requestId}`, updatePayload, getAuthConfig())
      window.alert(isRejectedRequest ? 'บันทึกการแก้ไขสำเร็จ เอกสารถูกเปลี่ยนกลับเป็นแบบร่างแล้ว สามารถกลับไปส่งเอกสารใหม่ได้' : 'บันทึกแบบร่างสำเร็จ')
      if (isRejectedRequest) { navigate(-1); return }
    } else {
      const response = await axios.post(`${apiUrl}${COURSE_OPENING_ENDPOINT}Draft`, payload, getAuthConfig())
      const newRequestId = response.data?.id ?? response.data?.request_id ?? response.data?.requestId ?? response.data?.data?.id ?? response.data?.data?.request_id ?? response.data?.data?.requestId ?? ''
      if (newRequestId) setCreatedRequestId(newRequestId)
      window.alert(newRequestId ? `บันทึกแบบร่างสำเร็จ เลขที่คำร้อง ${newRequestId}` : 'บันทึกแบบร่างสำเร็จ')
    }

    if (returnToViewMode) setPageMode('view')
  } catch (error) {
    console.error('Error saving course opening draft:', error)
    window.alert(getErrorMessage(error, 'ไม่สามารถบันทึกแบบร่างคำขอเปิดรายวิชาได้'))
  } finally {
    setIsSubmittingRequest(false)
  }
}

  const handleSaveDraft = () => {
    saveDraftRequest()
  }

  const handleStartEdit = () => {
    if (!canEditCurrentDocument) return
    setPageMode('edit')
  }

  const handleCancelEdit = () => {
    resetFormStatesFromRequest()
    setPageMode('view')
  }

const handleSaveEditedDocument = () => {
  saveDraftRequest({ returnToViewMode: true })
}

const getResponsibleUserOptionsForPerson = (personId) => {
  const selectedNameSet = new Set(
    approvalForm.responsiblePeople
      .filter((person) => person.id !== personId)
      .map((person) => normalizeText(person.name))
      .filter(Boolean)
  )

  return responsibleUserOptions.filter((option) => !selectedNameSet.has(normalizeText(option.name)))
}

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Typography className={styles.pageTitle}>
            {requestData ? 'ดูรายละเอียดการเปิดรายวิชา (ระดับปริญญาตรี)' : 'แบบเปิดรายวิชาประจำภาคการศึกษา (ระดับปริญญาตรี)'}
          </Typography>

          <Typography className={styles.pageDescription}>
            {requestData
              ? 'หน้านี้ใช้สำหรับตรวจสอบรายละเอียดเอกสารที่บันทึกไว้ โดยสามารถแก้ไขแบบร่างก่อนส่งเอกสารจริงจากหน้ารายการคำขอเปิดรายวิชา'
              : 'หน้าสำหรับกรอกข้อมูลคำขอเปิดรายวิชาและบันทึกเป็นแบบร่างก่อน จากนั้นจึงไปตรวจสอบและกดส่งเอกสารจริงที่หน้ารายการคำขอเปิดรายวิชา'}
          </Typography>
        </Box>

        {requestData && (
          <Box className={styles.modeCard}>
            <Box className={styles.modeCardTop}>
              <Box className={styles.modeTextBlock}>
                <Typography className={styles.modeEyebrow}>{isViewMode ? 'โหมดดูรายละเอียดเอกสาร' : 'โหมดแก้ไขแบบร่าง'}</Typography>
                <Typography className={styles.modeTitle}>{generalForm.curriculumName} • สาขา {generalForm.majorName}</Typography>
                <Typography className={styles.modeDescription}>
                  {isViewMode
                    ? 'ในโหมดนี้ข้อมูลทั้งหมดจะถูกล็อกไว้เพื่อให้ตรวจสอบเอกสารได้อย่างเดียว หากต้องการแก้ไขแบบร่างให้กดปุ่มแก้ไขที่ด้านล่างของหน้า'
                    : 'กำลังแก้ไขเอกสารฉบับร่างในหน้าเดิม ข้อมูลทุกส่วนจะถูกปลดล็อกชั่วคราวเพื่อให้แก้ไขและบันทึกได้'}
                </Typography>
              </Box>

              <Box className={styles.modeChipRow}>
                <Chip label={`รหัสคำขอ ${requestData.id || createdRequestId || '-'}`} className={styles.requestIdChip} />
                <Chip label={statusConfig.label} className={statusConfig.className} />
              </Box>
            </Box>

            {!canEditCurrentDocument && <Typography className={styles.lockedHint}>เอกสารนี้ถูกส่งแล้วหรือได้รับอนุมัติแล้ว จึงยังไม่สามารถแก้ไขได้ ยกเว้นกรณีถูกตีกลับให้แก้ไข</Typography>}
          </Box>
        )}

        <Box className={styles.viewModeHintBox}>
          <VisibilityRoundedIcon className={styles.viewModeHintIcon} />
          <Box>
            <Typography className={styles.viewModeHintTitle}>
              {isViewMode ? 'กำลังแสดงเอกสารในโหมดดูอย่างเดียว' : isEditMode ? 'กำลังแสดงเอกสารในโหมดแก้ไขแบบร่าง' : 'กำลังแสดงเอกสารในโหมดสร้างแบบร่างใหม่'}
            </Typography>
            <Typography className={styles.viewModeHintDescription}>
              {isViewMode ? 'ทุก field และปุ่มภายในเอกสารถูก disabled ไว้ทั้งหมด เพื่อให้ตรวจสอบข้อมูลได้ก่อนตัดสินใจแก้ไข' : isEditMode ? 'สามารถปรับข้อมูลในแบบฟอร์มได้ทั้งหมด เมื่อแก้ไขเสร็จแล้วให้กดบันทึกแบบร่างที่ด้านล่างของหน้า' : 'โหมดนี้ใช้สำหรับกรอกแบบฟอร์มใหม่และบันทึกเป็นแบบร่างก่อนส่งเอกสารจริง'}
            </Typography>
          </Box>
        </Box>

        <Box className={styles.sectionCard}>
          <Typography className={styles.sectionTitle}>ข้อมูลทั่วไป</Typography>

          {isInitialInfoLoading && <Typography className={styles.helperText}>กำลังดึงข้อมูลหลักสูตรและสาขาของผู้ใช้งาน...</Typography>}
          {initialInfoErrorMessage && <Typography className={styles.helperText}>{initialInfoErrorMessage}</Typography>}

          <Box className={styles.formGridThree}>
            <TextField label="ส่งแบบเปิดรายวิชา ครั้งที่" name="submissionRound" value={generalForm.submissionRound} onChange={handleChangeGeneralForm} fullWidth disabled={isFormDisabled} />

            <TextField select label="ภาคการศึกษา" name="semester" value={generalForm.semester} onChange={handleChangeGeneralForm} fullWidth disabled={isFormDisabled}>
              <MenuItem value="1">ภาค 1</MenuItem>
              <MenuItem value="2">ภาค 2</MenuItem>
              <MenuItem value="summer">ภาคฤดูร้อน</MenuItem>
            </TextField>

            <TextField label="ปีการศึกษา" name="academicYear" value={generalForm.academicYear} onChange={handleChangeGeneralForm} fullWidth disabled={isFormDisabled} />
          </Box>

          <Box className={styles.formGridBottom}>
            <TextField label="หลักสูตร (พิมพ์ชื่อหลักสูตร/ปีที่ปรับปรุง)" name="curriculumName" value={generalForm.curriculumName} onChange={handleChangeGeneralForm} fullWidth disabled={isFormDisabled} />

            <Box className={styles.majorFieldWrapper}>
              <TextField label="สาขาวิชา/กลุ่มวิชา" name="majorName" value={generalForm.majorName} onChange={handleChangeGeneralForm} fullWidth disabled={isFormDisabled} />
              <Button variant="text" className={styles.inlineEditButton} disabled>แก้ไข</Button>
            </Box>

            <Box className={styles.programTypeBox}>
              <Typography className={styles.fieldLabel}>ประเภทหลักสูตร</Typography>
              <RadioGroup row name="programType" value={generalForm.programType} onChange={handleChangeGeneralForm} className={styles.radioGroupRow}>
                <FormControlLabel value="4year" control={<Radio />} label="4 ปี" disabled={isFormDisabled} />
                <FormControlLabel value="transfer" control={<Radio />} label="เทียบโอน" disabled={isFormDisabled} />
              </RadioGroup>
            </Box>
          </Box>
        </Box>

        <Box className={styles.sectionCard}>
          <Typography className={styles.sectionTitle}>สถานที่และเวลาเรียน</Typography>

          <Box className={styles.studySection}>
            <Box className={styles.optionGroup}>
              <Typography className={styles.optionGroupTitle}>ภาคการเรียน</Typography>
              <RadioGroup row name="learningPeriod" value={studyForm.learningPeriod} onChange={handleChangeStudyForm} className={styles.optionRadioRow}>
                {learningPeriodOptions.map((item) => <FormControlLabel key={item.value} value={item.value} control={<Radio />} label={item.label} disabled={isFormDisabled} />)}
              </RadioGroup>
            </Box>

            <Box className={styles.optionRowTwo}>
              <Box className={styles.optionGroup}>
                <Typography className={styles.optionGroupTitle}>ศึกษาที่เขตพื้นที่</Typography>
                <RadioGroup row name="campus" value={studyForm.campus} onChange={handleChangeStudyForm} className={styles.optionRadioRow}>
                  {campusOptions.map((item) => <FormControlLabel key={item.value} value={item.value} control={<Radio />} label={item.label} disabled={isFormDisabled} />)}
                </RadioGroup>
              </Box>

              <Box className={styles.optionGroup}>
                <Typography className={styles.optionGroupTitle}>กลุ่มเป้าหมาย</Typography>
                <RadioGroup row name="targetGroup" value={studyForm.targetGroup} onChange={handleChangeStudyForm} className={styles.optionRadioRow}>
                  {targetGroupOptions.map((item) => {
                    const isAllowed = allowedTargetGroupOptions.includes(item.value)
                    return <FormControlLabel key={item.value} value={item.value} control={<Radio />} label={item.label} disabled={isFormDisabled || !isAllowed} />
                  })}
                </RadioGroup>

                <Typography className={styles.helperText}>
                  {studyForm.campus === 'chakrabongse' ? 'เมื่อเลือกจักรพงษภูวนารถ จะเลือกได้เฉพาะ ส.อ.บ.' : 'เมื่อเลือกบางพระ จะเลือกได้เฉพาะ BP หรือ Five Plus'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box className={styles.sectionCard}>
          <Box className={styles.sectionHeaderRow}>
            <Typography className={styles.sectionTitle}>ตารางรายวิชาที่ขอเปิดสอน</Typography>
            <Button variant="outlined" startIcon={<AddRoundedIcon />} className={styles.secondaryButton} onClick={handleAddYearBlock} disabled={isFormDisabled}>เพิ่มตาราง (ชั้นปี)</Button>
          </Box>

          <Box className={styles.yearBlockList}>
            {yearBlocks.map((block) => (
              <Box key={block.id} className={styles.yearBlock}>
                <Box className={styles.yearBlockHeader}>
                  <Box className={styles.yearBlockHeaderLeft}>
                    <Box className={styles.yearBadge}>ชั้นปีที่ {block.yearLevel}</Box>
                    <Typography className={styles.yearBlockTitle}>ตารางรายวิชาที่ขอเปิดสอน</Typography>
                    <Typography className={styles.yearBlockSubtitle}>กำหนดรายวิชาที่ต้องการเปิดสอนในชั้นปีนี้</Typography>
                  </Box>

                  <Box className={styles.yearBlockHeaderRight}>
                    <TextField select label="ชั้นปี" value={block.yearLevel} onChange={(event) => handleChangeYearBlockField(block.id, 'yearLevel', event.target.value)} size="small" className={styles.yearLevelSelect} disabled={isFormDisabled}>
                      {yearLevelOptions.map((yearLevel) => <MenuItem key={yearLevel} value={yearLevel}>ปีที่ {yearLevel}</MenuItem>)}
                    </TextField>

                    <Button variant="outlined" color="error" startIcon={<DeleteOutlineRoundedIcon />} className={styles.deleteYearBlockButton} onClick={() => handleDeleteYearBlock(block.id)} disabled={isFormDisabled}>ลบตารางนี้</Button>
                  </Box>
                </Box>

                <Box className={styles.yearBlockForm}>
                  <TextField select label="เข้าเรียน" value={block.entryTerm} onChange={(event) => handleChangeYearBlockField(block.id, 'entryTerm', event.target.value)} fullWidth disabled={isFormDisabled}>
                    <MenuItem value="1">ภาค 1</MenuItem>
                    <MenuItem value="2">ภาค 2</MenuItem>
                    <MenuItem value="summer">ภาคฤดูร้อน</MenuItem>
                  </TextField>

                  <TextField label="ปีการศึกษา" value={block.academicYear} onChange={(event) => handleChangeYearBlockField(block.id, 'academicYear', event.target.value)} fullWidth disabled={isFormDisabled} />
                </Box>

                <Box className={styles.tableSection}>
                  <Box className={styles.tableHeaderRow}>
                    <Box className={`${styles.tableHeaderCell} ${styles.colIndex}`}>#</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colCode}`}>รหัสวิชา</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colName}`}>ชื่อรายวิชา</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colCredits}`}>จำนวนหน่วยกิต</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colGroup}`}>กลุ่ม</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colStudents}`}>จำนวนนักศึกษา(จริง)</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colTrack}`}>รายวิชา (สายวิทยาศาสตร์)</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colTrack}`}>รายวิชา (มนุษยศาสตร์และสังคมศาสตร์)</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colNote}`}>หมายเหตุ</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colAction}`}>จัดการ</Box>
                  </Box>

                  <Box className={styles.tableBody}>
                    {block.subjectRows.map((row, rowIndex) => (
                      <Box key={row.id} className={`${styles.tableRow} ${rowIndex % 2 === 1 ? styles.tableRowAlt : ''}`}>
                        <Box className={`${styles.tableCell} ${styles.colIndex} ${styles.indexCell}`}>{rowIndex + 1}</Box>

                        <Box className={`${styles.tableCell} ${styles.colCode}`}>
                          <TextField value={row.courseCode} onChange={(event) => handleChangeSubjectRowField(block.id, row.id, 'courseCode', event.target.value)} placeholder="รหัสวิชา" size="small" fullWidth className={styles.compactField} disabled={isFormDisabled} />
                        </Box>

                        <Box className={`${styles.tableCell} ${styles.colName}`}>
                          <Box className={styles.courseNameCell}>
                            <Button variant="outlined" size="small" startIcon={<SearchRoundedIcon fontSize="small" />} className={styles.subjectPickerButton} onClick={() => openSubjectSelector(block.id, row.id)} fullWidth disabled={isFormDisabled}>
                              {row.courseName ? <span className={styles.subjectPickerText}>{row.courseName}</span> : <span className={styles.subjectPickerPlaceholder}>เลือกรายวิชา</span>}
                            </Button>

                            <FormControlLabel className={styles.freeElectiveToggle} control={<Checkbox checked={row.isFreeElective} onChange={() => handleToggleSubjectRowCheckbox(block.id, row.id, 'isFreeElective')} size="small" disabled={isFormDisabled} />} label={<span className={styles.freeElectiveLabel}>เลือกเสรี</span>} />
                          </Box>
                        </Box>

                        <Box className={`${styles.tableCell} ${styles.colCredits}`}>
                          <TextField value={row.credits} onChange={(event) => handleChangeSubjectRowField(block.id, row.id, 'credits', event.target.value)} placeholder="0" size="small" fullWidth className={styles.compactField} disabled={isFormDisabled} inputProps={{ style: { textAlign: 'center' } }} />
                        </Box>

                        <Box className={`${styles.tableCell} ${styles.colGroup}`}>
                          <TextField value={row.groupCount} onChange={(event) => handleChangeSubjectRowField(block.id, row.id, 'groupCount', event.target.value)} placeholder="1" size="small" fullWidth className={styles.compactField} disabled={isFormDisabled} inputProps={{ style: { textAlign: 'center' } }} />
                        </Box>

                        <Box className={`${styles.tableCell} ${styles.colStudents}`}>
                          <TextField value={row.studentCount} onChange={(event) => handleChangeSubjectRowField(block.id, row.id, 'studentCount', event.target.value)} placeholder="0" size="small" fullWidth className={styles.compactField} disabled={isFormDisabled} inputProps={{ style: { textAlign: 'center' } }} />
                        </Box>

                        <Box className={`${styles.tableCell} ${styles.colTrack} ${styles.centerCell}`}>
                          <Checkbox checked={row.scienceTrack} onChange={() => handleToggleSubjectRowCheckbox(block.id, row.id, 'scienceTrack')} size="small" className={styles.trackCheckbox} disabled={isFormDisabled} />
                        </Box>

                        <Box className={`${styles.tableCell} ${styles.colTrack} ${styles.centerCell}`}>
                          <Checkbox checked={row.humanitiesTrack} onChange={() => handleToggleSubjectRowCheckbox(block.id, row.id, 'humanitiesTrack')} size="small" className={styles.trackCheckbox} disabled={isFormDisabled} />
                        </Box>

                        <Box className={`${styles.tableCell} ${styles.colNote}`}>
                          <TextField value={row.note} onChange={(event) => handleChangeSubjectRowField(block.id, row.id, 'note', event.target.value)} placeholder="หมายเหตุ" size="small" fullWidth className={styles.compactField} disabled={isFormDisabled} />
                        </Box>

                        <Box className={`${styles.tableCell} ${styles.colAction} ${styles.centerCell}`}>
                          <Button variant="text" color="error" size="small" className={styles.deleteRowButton} onClick={() => handleDeleteSubjectRow(block.id, row.id)} disabled={isFormDisabled}>
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </Button>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box className={styles.subjectActionRow}>
                  <Button variant="contained" startIcon={<AddRoundedIcon />} className={styles.primaryButton} onClick={() => handleAddSubjectRow(block.id)} disabled={isFormDisabled}>เพิ่มรายวิชา</Button>
                  <Typography className={styles.rowCount}>{block.subjectRows.length} รายวิชา</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box className={styles.sectionCard}>
          <Typography className={styles.sectionTitle}>ข้อมูลผู้รับผิดชอบและการลงนาม</Typography>
          <Typography className={styles.subSectionTitle}>ผู้รับผิดชอบหลักสูตร (อย่างน้อย 3 คน และเพิ่ม/ลบได้)</Typography>

          {isResponsibleUserLoading && <Typography className={styles.helperText}>กำลังดึงรายชื่อผู้ใช้ในสาขาเดียวกัน...</Typography>}
          {responsibleUserErrorMessage && <Typography className={styles.helperText}>{responsibleUserErrorMessage}</Typography>}

          <Box className={styles.responsibleList}>
            {approvalForm.responsiblePeople.map((person, index) => (
              <Box key={person.id} className={styles.responsibleItem}>
                <Autocomplete
                  options={getResponsibleUserOptionsForPerson(person.id)}
                  value={responsibleUserOptions.find((option) => option.name === person.name) || (person.name ? { id: `current-${person.id}`, name: person.name, email: '', departmentId: '', departmentName: '' } : null)}
                  getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name ?? '')}
                  isOptionEqualToValue={(option, value) => String(option?.id ?? '') === String(value?.id ?? '') || String(option?.name ?? '') === String(value?.name ?? '')}
                  onChange={(_, nextValue) => handleChangeResponsiblePerson(person.id, 'name', nextValue?.name ?? '')}
                  loading={isResponsibleUserLoading}
                  loadingText="กำลังโหลดรายชื่อ..."
                  noOptionsText="ไม่พบรายชื่อในสาขาเดียวกัน"
                  disabled={isFormDisabled}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props
                    return <Box component="li" key={key} {...optionProps}><Typography>{option.name}</Typography></Box>
                  }}
                  renderInput={(params) => <TextField {...params} label={`ผู้รับผิดชอบหลักสูตร คนที่ ${index + 1}`} placeholder="พิมพ์ชื่อเพื่อค้นหา" fullWidth />}
                />

                <TextField type="date" value={person.signedDate} onChange={(event) => handleChangeResponsiblePerson(person.id, 'signedDate', event.target.value)} fullWidth disabled={isFormDisabled} InputLabelProps={{ shrink: true }} inputProps={{ min: getTodayDateString() }} />
                <Box className={styles.responsibleItemActions}>
                  <Button variant="outlined" color="error" className={styles.removeResponsibleButton} onClick={() => handleRemoveResponsiblePerson(person.id)} disabled={isFormDisabled || approvalForm.responsiblePeople.length <= 3}>ลบ</Button>
                </Box>
              </Box>
            ))}
          </Box>

          <Box className={styles.addResponsibleRow}>
            <Button variant="contained" startIcon={<AddRoundedIcon />} className={styles.primaryButton} onClick={handleAddResponsiblePerson} disabled={isFormDisabled}>เพิ่มผู้รับผิดชอบ</Button>
          </Box>

          <Box className={styles.signerGrid}>
            {[
              { title: 'หัวหน้าสาขาวิชา', nameKey: 'headName', dateKey: 'headDate' },
              { title: 'รองคณบดี', nameKey: 'deputyDeanName', dateKey: 'deputyDeanDate' },
              { title: 'คณบดี', nameKey: 'deanName', dateKey: 'deanDate' },
            ].map(({ title, nameKey, dateKey }) => (
              <Box key={nameKey} className={styles.signerCard}>
                <Typography className={styles.signerTitle}>{title}</Typography>
                <TextField name={nameKey} value={approvalForm[nameKey]} onChange={handleChangeApprovalField} fullWidth disabled={isFormDisabled} />
                <TextField type="date" name={dateKey} value={approvalForm[dateKey]} onChange={handleChangeApprovalField} fullWidth disabled={isFormDisabled} InputLabelProps={{ shrink: true }} inputProps={{ min: getTodayDateString() }} />              </Box>
            ))}
          </Box>

          {isCreateMode && (
            <Box className={styles.submitRow}>
              <Button variant="contained" className={styles.submitButton} disabled={isSubmittingRequest} onClick={handleSaveDraft}>
                {isSubmittingRequest ? 'กำลังบันทึกแบบร่าง...' : 'บันทึกแบบร่าง'}
              </Button>
            </Box>
          )}
        </Box>

        {requestData && (
          <Box className={styles.requestActionCard}>
            <Box className={styles.requestActionInfo}>
              <Typography className={styles.requestActionTitle}>{isViewMode ? 'ตรวจสอบเอกสารเรียบร้อยแล้วหรือยัง' : 'แก้ไขข้อมูลเรียบร้อยแล้วหรือยัง'}</Typography>
              <Typography className={styles.requestActionDescription}>
                {isViewMode ? 'หากต้องการแก้ไขข้อมูล ให้กดปุ่มแก้ไขเอกสาร ระบบจะปลดล็อก field ทั้งหมดของเอกสารฉบับนี้ในหน้าเดิม' : 'เมื่อบันทึกแบบร่างแล้ว เอกสารจะกลับไปอยู่ในโหมดดูอย่างเดียวอีกครั้ง เพื่อใช้ตรวจสอบก่อนย้อนกลับไปหน้ารายการและกดส่งเอกสาร'}
              </Typography>
            </Box>

            <Box className={styles.requestActionButtons}>
              {isViewMode && canEditCurrentDocument && (
                <Button variant="contained" startIcon={<EditRoundedIcon />} className={styles.editButton} onClick={handleStartEdit}>แก้ไขเอกสาร</Button>
              )}

              {isEditMode && (
                <>
                  <Button variant="outlined" className={styles.cancelEditButton} onClick={handleCancelEdit} disabled={isSubmittingRequest}>ยกเลิก</Button>
                  <Button variant="contained" startIcon={<SaveRoundedIcon />} className={styles.saveButton} onClick={handleSaveEditedDocument} disabled={isSubmittingRequest}>
                    {isSubmittingRequest ? 'กำลังบันทึก...' : 'บันทึกแบบร่าง'}
                  </Button>
                </>
              )}
            </Box>
          </Box>
        )}
      </Box>

      <SubjectSelectorModal open={subjectSelectorState.isOpen} onClose={closeSubjectSelector} onSelectSubject={handleSelectSubject} currentMajorName={generalForm.majorName} />
    </Box>
  )
}

export default CourseOpeningBachelorPage
