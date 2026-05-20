import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, MenuItem, TextField, Typography } from '@mui/material'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import styles from './courseOpeningRequestListPage.module.css'

const COURSE_OPENING_ENDPOINT = '/course-opening/'

const getAuthConfig = () => {
  const token = localStorage.getItem('mqa_token')
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} }
}

const normalizeText = (value) => String(value ?? '').trim()

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

const formatThaiDateTime = (dateValue) => {
  if (!dateValue) return '-'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatDateInput = (dateValue) => {
  if (!dateValue) return ''
  if (String(dateValue).includes('T')) return String(dateValue).split('T')[0]
  return String(dateValue).slice(0, 10)
}

const getCourseOpeningRequestId = (item) => item?.id ?? item?.request_id ?? item?.requestId ?? null

const normalizeStatus = (status) => {
  const statusText = normalizeText(status).toLowerCase()
  if (statusText === 'draft') return 'draft'
  if (statusText === 'pending' || statusText === 'pendingapproval' || statusText === 'pending_approval') return 'pendingApproval'
  if (statusText === 'approved' || statusText === 'approve') return 'approved'
  if (statusText === 'rejected' || statusText === 'rejected_by_dean' || statusText === 'reject') return 'rejected'
  return statusText || '-'
}

const getLevelLabel = (level) => {
  if (level === 'bachelor') return 'ปริญญาตรี'
  if (level === 'master') return 'ปริญญาโท'
  if (level === 'doctoral') return 'ปริญญาเอก'
  return '-'
}

const getStatusConfig = (status) => {
  if (status === 'draft') return { label: 'บันทึกแล้ว ยังไม่ส่ง', className: styles.statusChipDraft }
  if (status === 'pendingApproval') return { label: 'ส่งเอกสารแล้วกำลังรออนุมัติ', className: styles.statusChipPendingApproval }
  if (status === 'rejected') return { label: 'ไม่อนุมัติ', className: styles.statusChipRejected }
  if (status === 'approved') return { label: 'อนุมัติแล้ว', className: styles.statusChipPendingApproval }
  return { label: '-', className: '' }
}

const inferCourseOpeningLevel = (data) => {
  const explicitLevel = normalizeText(data?.level ?? data?.education_level ?? data?.educationLevel ?? data?.degree_level ?? data?.degreeLevel).toLowerCase()
  if (['bachelor', 'master', 'doctoral'].includes(explicitLevel)) return explicitLevel
  if (explicitLevel.includes('ตรี') || explicitLevel.includes('bachelor')) return 'bachelor'
  if (explicitLevel.includes('โท') || explicitLevel.includes('master')) return 'master'
  if (explicitLevel.includes('เอก') || explicitLevel.includes('doctoral') || explicitLevel.includes('phd')) return 'doctoral'

  const programType = normalizeText(data?.program_type ?? data?.programType).toLowerCase()
  const targetGroup = normalizeText(data?.target_group ?? data?.targetGroup).toLowerCase()
  const curriculumName = normalizeText(data?.curriculum_name ?? data?.curriculumName ?? data?.documentData?.generalForm?.curriculumName).toLowerCase()

  if (programType === '1.1' || programType === '1.2' || targetGroup === '1.1' || targetGroup === '1.2' || curriculumName.includes('ดุษฎีบัณฑิต') || curriculumName.includes('ปริญญาเอก')) return 'doctoral'
  if (programType === 'plana' || programType === 'plana2' || programType === 'planb' || curriculumName.includes('มหาบัณฑิต') || curriculumName.includes('ปริญญาโท')) return 'master'
  return 'bachelor'
}

const buildSubjectRowsFromApi = (requestedCourses = []) => {
  return requestedCourses.map((course, index) => ({
    id: course?.id ?? `${course?.year_level ?? 1}-${index}`,
    courseId: course?.course_id ?? course?.courseId ?? '',
    courseCode: course?.course_code_snapshot ?? course?.courseCode ?? course?.course_code ?? '',
    courseName: course?.course_name_snapshot ?? course?.courseName ?? course?.course_name ?? '',
    credits: String(course?.credits_snapshot ?? course?.credits ?? ''),
    groupCount: String(course?.group_no ?? course?.groupCount ?? 1),
    studentCount: String(course?.student_count ?? course?.studentCount ?? ''),
    isFreeElective: Boolean(course?.is_elective ?? course?.isFreeElective),
    scienceTrack: Boolean(course?.is_science_related ?? course?.scienceTrack),
    humanitiesTrack: Boolean(course?.is_humanities_related ?? course?.humanitiesTrack),
    note: course?.note ?? '',
  }))
}

const buildYearBlocksFromApi = (data) => {
  const requestedCourses = getResponseList(data, ['requested_courses', 'requestedCourses'])
  if (!requestedCourses.length) {
    return [{ id: 1, yearLevel: '1', entryTerm: String(data?.semester ?? ''), academicYear: String(data?.academic_year ?? data?.academicYear ?? ''), subjectRows: [{ id: 1, courseId: '', courseCode: '', courseName: '', credits: '', groupCount: '1', studentCount: '', isFreeElective: false, scienceTrack: false, humanitiesTrack: false, note: '' }] }]
  }

  const courseGroupMap = new Map()
  requestedCourses.forEach((course) => {
    const yearLevel = String(course?.year_level ?? course?.yearLevel ?? 1)
    if (!courseGroupMap.has(yearLevel)) courseGroupMap.set(yearLevel, [])
    courseGroupMap.get(yearLevel).push(course)
  })

  return Array.from(courseGroupMap.entries()).sort(([a], [b]) => Number(a) - Number(b)).map(([yearLevel, courses], index) => ({
    id: Number(yearLevel) || index + 1,
    yearLevel,
    entryTerm: String(data?.semester ?? ''),
    academicYear: String(data?.academic_year ?? data?.academicYear ?? ''),
    subjectRows: buildSubjectRowsFromApi(courses),
  }))
}

const buildResponsiblePeopleFromApi = (data) => {
  const responsiblePeople = getResponseList(data, ['responsible_persons', 'responsiblePersons'])
  if (!responsiblePeople.length) return [{ id: 1, name: '', signedDate: '' }, { id: 2, name: '', signedDate: '' }, { id: 3, name: '', signedDate: '' }]
  return responsiblePeople.map((person, index) => ({ id: person?.id ?? index + 1, name: person?.name ?? '', signedDate: formatDateInput(person?.signed_date ?? person?.signedDate) }))
}

const buildDocumentDataFromApi = (data, level) => {
  const submissionRound = String(data?.submission_times ?? data?.submissionTimes ?? '1')
  const semester = String(data?.semester ?? '')
  const academicYear = String(data?.academic_year ?? data?.academicYear ?? '')
  const curriculumName = data?.curriculum_name ?? data?.curriculumName ?? ''
  const majorName = data?.major_name ?? data?.majorName ?? ''
  const programType = data?.program_type ?? data?.programType ?? ''
  const studyMode = data?.study_mode ?? data?.studyMode ?? ''
  const campus = data?.campus ?? ''
  const targetGroup = data?.target_group ?? data?.targetGroup ?? ''

  const approvalForm = {
    responsiblePeople: buildResponsiblePeopleFromApi(data),
    headName: data?.head_dept_name ?? data?.headDeptName ?? '',
    headDate: formatDateInput(data?.head_dept_signed ?? data?.headDeptSigned),
    deputyDeanName: data?.vice_dean_name ?? data?.viceDeanName ?? '',
    deputyDeanDate: formatDateInput(data?.vice_dean_signed ?? data?.viceDeanSigned),
    deanName: data?.dean_name ?? data?.deanName ?? '',
    deanDate: formatDateInput(data?.dean_signed ?? data?.deanSigned),
    isConfirmed: Boolean(data?.is_confirmed ?? data?.isConfirmed ?? true),
  }

  if (level === 'master') {
    return {
      generalForm: { submissionRound, semester, academicYear, curriculumName, majorName },
      studyForm: { studyPlan: programType || targetGroup || 'planB', learningPeriod: studyMode || 'afterHours', campus },
      yearBlocks: buildYearBlocksFromApi(data),
      approvalForm,
    }
  }

  if (level === 'doctoral') {
    return {
      generalForm: { submissionRound, semester, academicYear, curriculumName, majorName, doctoralFormType: programType || targetGroup || '1.1', formType: programType || targetGroup || '1.1', campus },
      studyForm: {},
      yearBlocks: buildYearBlocksFromApi(data),
      approvalForm,
    }
  }

  return {
    generalForm: { submissionRound, semester, academicYear, curriculumName, majorName, programType: programType || '4year' },
    studyForm: { learningPeriod: studyMode || 'regular', campus, targetGroup: targetGroup || 'bp' },
    yearBlocks: buildYearBlocksFromApi(data),
    approvalForm,
  }
}

const normalizeCourseOpeningFromApi = (apiData, fallbackData = {}) => {
  const data = { ...fallbackData, ...apiData }
  const id = getCourseOpeningRequestId(data)
  const level = inferCourseOpeningLevel(data)
  const status = normalizeStatus(data?.status)
  const createdAt = data?.created_at ?? data?.createdAt ?? ''
  const updatedAt = data?.updated_at ?? data?.updatedAt ?? createdAt
  const submittedAt = data?.submitted_at ?? data?.submittedAt ?? (status === 'pendingApproval' || status === 'approved' || status === 'rejected' ? createdAt : '')
  const rejectedReason = data?.rejected_reason ?? data?.rejectedReason ?? data?.note ?? ''

  return {
    id,
    level,
    status,
    updatedAt,
    submittedAt,
    rejectedReason,
    rawData: data,
    documentData: buildDocumentDataFromApi(data, level),
  }
}

const buildCourseOpeningUpdatePayload = (item) => {
  const rawData = item?.rawData ?? {}
  const documentData = item?.documentData ?? {}
  const generalForm = documentData.generalForm ?? {}
  const studyForm = documentData.studyForm ?? {}
  const approvalForm = documentData.approvalForm ?? {}
  const rawRequestedCourses = getResponseList(rawData, ['requested_courses', 'requestedCourses'])
  const rawResponsiblePersons = getResponseList(rawData, ['responsible_persons', 'responsiblePersons'])
  const yearBlocks = getResponseList(documentData, ['yearBlocks'])

  const fallbackRequestedCourses = yearBlocks.flatMap((yearBlock) => getResponseList(yearBlock, ['subjectRows']).filter((subjectRow) => subjectRow.courseId || subjectRow.course_id).map((subjectRow) => ({
    year_level: Number(yearBlock.yearLevel || yearBlock.year_level || 1),
    course_id: Number(subjectRow.courseId || subjectRow.course_id),
    group_no: Number(subjectRow.groupCount || subjectRow.group_no || 1),
    student_count: Number(subjectRow.studentCount || subjectRow.student_count || 0),
    is_elective: Boolean(subjectRow.isFreeElective || subjectRow.is_elective),
    is_science_related: Boolean(subjectRow.scienceTrack || subjectRow.is_science_related),
    is_humanities_related: Boolean(subjectRow.humanitiesTrack || subjectRow.is_humanities_related),
    note: subjectRow.note || '',
  })))

  const requestedCourses = rawRequestedCourses.length ? rawRequestedCourses.map((course) => ({
    year_level: Number(course?.year_level ?? course?.yearLevel ?? 1),
    course_id: Number(course?.course_id ?? course?.courseId ?? 0),
    group_no: Number(course?.group_no ?? course?.groupCount ?? 1),
    student_count: Number(course?.student_count ?? course?.studentCount ?? 0),
    is_elective: Boolean(course?.is_elective ?? course?.isFreeElective),
    is_science_related: Boolean(course?.is_science_related ?? course?.scienceTrack),
    is_humanities_related: Boolean(course?.is_humanities_related ?? course?.humanitiesTrack),
    note: course?.note ?? '',
  })).filter((course) => course.course_id) : fallbackRequestedCourses

  const fallbackResponsiblePersons = getResponseList(approvalForm, ['responsiblePeople']).map((person) => ({
    name: person?.name ?? '',
    signed_date: formatDateInput(person?.signedDate ?? person?.signed_date) || null,
  })).filter((person) => person.name)

  const responsiblePersons = rawResponsiblePersons.length ? rawResponsiblePersons.map((person) => ({
    name: person?.name ?? '',
    signed_date: formatDateInput(person?.signed_date ?? person?.signedDate) || null,
  })).filter((person) => person.name) : fallbackResponsiblePersons

  return {
    submission_times: Number(rawData.submission_times ?? rawData.submissionTimes ?? generalForm.submissionRound ?? 1),
    semester: String(rawData.semester ?? generalForm.semester ?? ''),
    academic_year: Number(rawData.academic_year ?? rawData.academicYear ?? generalForm.academicYear ?? 0),
    curriculum_name: String(rawData.curriculum_name ?? rawData.curriculumName ?? generalForm.curriculumName ?? ''),
    major_name: String(rawData.major_name ?? rawData.majorName ?? generalForm.majorName ?? ''),
    program_type: String(rawData.program_type ?? rawData.programType ?? generalForm.programType ?? generalForm.formType ?? generalForm.doctoralFormType ?? studyForm.studyPlan ?? ''),
    study_mode: String(rawData.study_mode ?? rawData.studyMode ?? studyForm.learningPeriod ?? ''),
    campus: String(rawData.campus ?? studyForm.campus ?? generalForm.campus ?? ''),
    target_group: String(rawData.target_group ?? rawData.targetGroup ?? studyForm.targetGroup ?? generalForm.formType ?? generalForm.doctoralFormType ?? ''),
    requested_courses: requestedCourses,
    responsible_persons: responsiblePersons,
    head_of_department: {
      name: String(rawData.head_dept_name ?? rawData.headDeptName ?? approvalForm.headName ?? ''),
      signed_date: formatDateInput(rawData.head_dept_signed ?? rawData.headDeptSigned ?? approvalForm.headDate) || null,
    },
    vice_dean: {
      name: String(rawData.vice_dean_name ?? rawData.viceDeanName ?? approvalForm.deputyDeanName ?? ''),
      signed_date: formatDateInput(rawData.vice_dean_signed ?? rawData.viceDeanSigned ?? approvalForm.deputyDeanDate) || null,
    },
    dean: {
      name: String(rawData.dean_name ?? rawData.deanName ?? approvalForm.deanName ?? ''),
      signed_date: formatDateInput(rawData.dean_signed ?? rawData.deanSigned ?? approvalForm.deanDate) || null,
    },
    is_confirmed: Boolean(rawData.is_confirmed ?? rawData.isConfirmed ?? approvalForm.isConfirmed ?? true),
    status: 'pending',
  }
}

function CourseOpeningRequestListPage() {
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL

  const [requestList, setRequestList] = useState([])
  const [levelFilter, setLevelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingId, setIsSendingId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [reasonDialog, setReasonDialog] = useState({ isOpen: false, requestId: '', requestTitle: '', rejectedReason: '' })

  const fetchRequestDetail = useCallback(async (item) => {
    const requestId = getCourseOpeningRequestId(item)
    if (!requestId) return item
    const detailResponse = await axios.get(`${apiUrl}${COURSE_OPENING_ENDPOINT}${requestId}`, getAuthConfig())
    return normalizeCourseOpeningFromApi(getResponseObject(detailResponse.data), item.rawData ?? item)
  }, [apiUrl])

  const fetchRequestList = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await axios.get(`${apiUrl}${COURSE_OPENING_ENDPOINT}`, { ...getAuthConfig(), params: { page: 1, limit: 100 } })
      const summaryList = getResponseList(response.data, ['items', 'data', 'results', 'requests'])

      const normalizedList = await Promise.all(
        summaryList.map(async (summaryItem) => {
          const normalizedSummary = normalizeCourseOpeningFromApi(summaryItem)
          try {
            return await fetchRequestDetail(normalizedSummary)
          } catch (error) {
            return normalizedSummary
          }
        })
      )

      setRequestList(normalizedList)
    } catch (error) {
      console.error('Error fetching course opening requests:', error)
      setRequestList([])
      setErrorMessage(getErrorMessage(error, 'ไม่สามารถดึงรายการคำขอเปิดรายวิชาได้'))
    } finally {
      setIsLoading(false)
    }
  }, [apiUrl, fetchRequestDetail])

  useEffect(() => {
    fetchRequestList()
  }, [fetchRequestList])

  const filteredRequestList = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLowerCase()

    return requestList.filter((item) => {
      const curriculumName = item.documentData?.generalForm?.curriculumName ?? ''
      const majorName = item.documentData?.generalForm?.majorName ?? ''
      const requestId = String(item.id ?? '')

      const matchedLevel = levelFilter === 'all' ? true : item.level === levelFilter
      const matchedStatus = statusFilter === 'all' ? true : item.status === statusFilter
      const matchedSearch = normalizedSearchText.length === 0 || requestId.toLowerCase().includes(normalizedSearchText) || curriculumName.toLowerCase().includes(normalizedSearchText) || majorName.toLowerCase().includes(normalizedSearchText) || getLevelLabel(item.level).toLowerCase().includes(normalizedSearchText)

      return matchedLevel && matchedStatus && matchedSearch
    })
  }, [levelFilter, requestList, searchText, statusFilter])

  const pageSummary = useMemo(() => {
    const totalCount = requestList.length
    const draftCount = requestList.filter((item) => item.status === 'draft').length
    const pendingApprovalCount = requestList.filter((item) => item.status === 'pendingApproval').length
    const rejectedCount = requestList.filter((item) => item.status === 'rejected').length
    return { totalCount, draftCount, pendingApprovalCount, rejectedCount }
  }, [requestList])

  const handleSendDocument = async (item) => {
    const requestId = getCourseOpeningRequestId(item)
    if (!requestId) { window.alert('ไม่พบรหัสคำขอเปิดรายวิชา'); return }

    const confirmed = window.confirm('ต้องการส่งเอกสารรายการนี้ใช่หรือไม่')
    if (!confirmed) return

    setIsSendingId(String(requestId))

    try { await axios.patch(`${apiUrl}${COURSE_OPENING_ENDPOINT}${requestId}/submit`, {}, getAuthConfig()); await fetchRequestList(); window.alert('ส่งเอกสารสำเร็จ เอกสารกำลังรอการอนุมัติ') } catch (error) { console.error('Error submitting course opening request:', error); window.alert(getErrorMessage(error, 'ไม่สามารถส่งเอกสารคำขอเปิดรายวิชาได้')) } finally { setIsSendingId('') }
  }

  const handleViewDetail = async (item) => {
    try {
      const detailItem = await fetchRequestDetail(item)

      if (detailItem.level === 'bachelor') {
        navigate('/courseOpeningBachelor', { state: { requestData: detailItem } })
        return
      }

      if (detailItem.level === 'master') {
        navigate('/courseOpeningMaster', { state: { requestData: detailItem } })
        return
      }

      if (detailItem.level === 'doctoral') {
        navigate('/courseOpeningDoctoral', { state: { requestData: detailItem } })
      }
    } catch (error) {
      console.error('Error fetching request detail:', error)
      window.alert(getErrorMessage(error, 'ไม่สามารถดึงรายละเอียดคำขอเปิดรายวิชาได้'))
    }
  }

  const handleOpenRejectedReason = (item) => {
    setReasonDialog({
      isOpen: true,
      requestId: String(item.id ?? ''),
      requestTitle: `${item.documentData?.generalForm?.curriculumName ?? '-'} - ${item.documentData?.generalForm?.majorName ?? '-'}`,
      rejectedReason: item.rejectedReason,
    })
  }

  const handleCloseRejectedReason = () => setReasonDialog({ isOpen: false, requestId: '', requestTitle: '', rejectedReason: '' })

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>ดูรายละเอียดการเปิดรายวิชา</Typography>
            <Typography className={styles.pageDescription}>หน้านี้ใช้สำหรับตรวจสอบรายการคำขอเปิดรายวิชาที่บันทึกไว้ก่อนส่งเอกสารจริง ผู้ใช้สามารถดูรายละเอียดของคำขอแต่ละรายการ ตรวจสอบสถานะ และดูผลการอนุมัติได้</Typography>
          </Box>
        </Box>

        <Box className={styles.summaryGrid}>
          <Box className={styles.summaryCard}>
            <Box className={styles.summaryIconBlue}><DescriptionRoundedIcon /></Box>
            <Box><Typography className={styles.summaryLabel}>เอกสารทั้งหมด</Typography><Typography className={styles.summaryValue}>{pageSummary.totalCount}</Typography></Box>
          </Box>

          <Box className={styles.summaryCard}>
            <Box className={styles.summaryIconAmber}><AccessTimeRoundedIcon /></Box>
            <Box><Typography className={styles.summaryLabel}>แบบร่าง</Typography><Typography className={styles.summaryValue}>{pageSummary.draftCount}</Typography></Box>
          </Box>

          <Box className={styles.summaryCard}>
            <Box className={styles.summaryIconGreen}><FactCheckRoundedIcon /></Box>
            <Box><Typography className={styles.summaryLabel}>รออนุมัติ</Typography><Typography className={styles.summaryValue}>{pageSummary.pendingApprovalCount}</Typography></Box>
          </Box>

          <Box className={styles.summaryCard}>
            <Box className={styles.summaryIconRed}><InfoOutlinedIcon /></Box>
            <Box><Typography className={styles.summaryLabel}>ไม่อนุมัติ</Typography><Typography className={styles.summaryValue}>{pageSummary.rejectedCount}</Typography></Box>
          </Box>
        </Box>

        <Box className={styles.filterCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>ค้นหาและกรองรายการ</Typography>
              <Typography className={styles.sectionDescription}>สามารถกรองตามระดับการศึกษา สถานะ และค้นหาด้วยรหัสคำขอ ชื่อหลักสูตร หรือชื่อสาขาได้</Typography>
            </Box>
          </Box>

          <Box className={styles.filterGrid}>
            <TextField fullWidth label="ค้นหารายการ" placeholder="ค้นหาจากรหัสคำขอ / หลักสูตร / สาขา" value={searchText} onChange={(event) => setSearchText(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }} />

            <Box className={styles.filterRightGrid}>
              <TextField select fullWidth label="ระดับการศึกษา" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
                <MenuItem value="all">ทั้งหมด</MenuItem>
                <MenuItem value="bachelor">ปริญญาตรี</MenuItem>
                <MenuItem value="master">ปริญญาโท</MenuItem>
                <MenuItem value="doctoral">ปริญญาเอก</MenuItem>
              </TextField>

              <TextField select fullWidth label="สถานะเอกสาร" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <MenuItem value="all">ทั้งหมด</MenuItem>
                <MenuItem value="draft">บันทึกแล้ว ยังไม่ส่ง</MenuItem>
                <MenuItem value="pendingApproval">ส่งเอกสารแล้วกำลังรออนุมัติ</MenuItem>
                <MenuItem value="approved">อนุมัติแล้ว</MenuItem>
                <MenuItem value="rejected">ไม่อนุมัติ</MenuItem>
              </TextField>
            </Box>
          </Box>
        </Box>

        <Box className={styles.listCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>รายการคำขอเปิดรายวิชา</Typography>
              <Typography className={styles.sectionDescription}>{isLoading ? 'กำลังดึงรายการจากระบบ...' : 'รายการนี้ดึงข้อมูลจาก API /course-opening/ โดยตรง'}</Typography>
            </Box>

            <Chip label={`พบ ${filteredRequestList.length} รายการ`} className={styles.resultChip} />
          </Box>

          {errorMessage && <Box className={styles.emptyState}><InfoOutlinedIcon className={styles.emptyStateIcon} /><Typography className={styles.emptyStateTitle}>เกิดข้อผิดพลาด</Typography><Typography className={styles.emptyStateDescription}>{errorMessage}</Typography><Button variant="contained" className={styles.primaryButton} onClick={fetchRequestList}>ลองโหลดใหม่</Button></Box>}

          {!errorMessage && (
            <Box className={styles.requestList}>
              {filteredRequestList.map((item) => {
                const statusConfig = getStatusConfig(item.status)
                const curriculumName = item.documentData?.generalForm?.curriculumName || '-'
                const majorName = item.documentData?.generalForm?.majorName || '-'

                return (
                  <Box key={item.id} className={styles.requestCard}>
                    <Box className={styles.requestCardTop}>
                      <Box className={styles.requestTitleBlock}>
                        <Box className={styles.requestBadgeRow}>
                          <Box className={styles.levelBadge}><SchoolRoundedIcon fontSize="small" /><span>{getLevelLabel(item.level)}</span></Box>
                          <Chip label={statusConfig.label} className={statusConfig.className} />
                        </Box>

                        <Typography className={styles.requestTitle}>{curriculumName}</Typography>
                        <Typography className={styles.requestSubtitle}>สาขา {majorName} • รหัสคำขอ {item.id}</Typography>
                      </Box>

                      <Box className={styles.actionGroup}>
                        <Button variant="outlined" startIcon={<VisibilityRoundedIcon />} className={styles.outlinedButton} onClick={() => handleViewDetail(item)}>ดูรายละเอียด</Button>

                        {item.status === 'rejected' && (
                          <Button variant="outlined" startIcon={<InfoOutlinedIcon />} color="error" className={styles.outlinedButton} onClick={() => handleOpenRejectedReason(item)}>ดูสาเหตุ</Button>
                        )}

                        {item.status === 'draft' && (
                          <Button variant="contained" startIcon={<SendRoundedIcon />} className={styles.primaryButton} onClick={() => handleSendDocument(item)} disabled={isSendingId === String(item.id)}>
                            {isSendingId === String(item.id) ? 'กำลังส่ง...' : 'ส่งเอกสาร'}
                          </Button>
                        )}
                      </Box>
                    </Box>

                    <Box className={styles.metaGrid}>
                      <Box className={styles.metaCard}><Typography className={styles.metaLabel}>ภาคการศึกษา</Typography><Typography className={styles.metaValue}>{item.documentData?.generalForm?.semester || '-'}</Typography></Box>
                      <Box className={styles.metaCard}><Typography className={styles.metaLabel}>ปีการศึกษา</Typography><Typography className={styles.metaValue}>{item.documentData?.generalForm?.academicYear || '-'}</Typography></Box>
                      <Box className={styles.metaCard}><Typography className={styles.metaLabel}>แก้ไขล่าสุด</Typography><Typography className={styles.metaValue}>{formatThaiDateTime(item.updatedAt)}</Typography></Box>
                      <Box className={styles.metaCard}><Typography className={styles.metaLabel}>วันที่ส่ง</Typography><Typography className={styles.metaValue}>{formatThaiDateTime(item.submittedAt)}</Typography></Box>
                    </Box>

                    <Box className={styles.requestFooter}>
                      <Typography className={styles.footerText}>
                        {item.status === 'pendingApproval' && 'เอกสารรายการนี้ถูกส่งแล้วและกำลังอยู่ระหว่างรอการอนุมัติ'}
                        {item.status === 'draft' && 'เอกสารรายการนี้ยังอยู่ในสถานะบันทึกไว้ สามารถตรวจสอบและส่งเอกสารได้'}
                        {item.status === 'rejected' && 'เอกสารรายการนี้ไม่อนุมัติ สามารถกดดูสาเหตุและเตรียมแก้ไขในขั้นตอนถัดไป'}
                        {item.status === 'approved' && 'เอกสารรายการนี้ได้รับการอนุมัติแล้ว'}
                      </Typography>
                    </Box>
                  </Box>
                )
              })}

              {!isLoading && !filteredRequestList.length && (
                <Box className={styles.emptyState}>
                  <DescriptionRoundedIcon className={styles.emptyStateIcon} />
                  <Typography className={styles.emptyStateTitle}>ไม่พบรายการที่ตรงกับเงื่อนไข</Typography>
                  <Typography className={styles.emptyStateDescription}>ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองใหม่อีกครั้ง</Typography>
                </Box>
              )}

              {isLoading && (
                <Box className={styles.emptyState}>
                  <DescriptionRoundedIcon className={styles.emptyStateIcon} />
                  <Typography className={styles.emptyStateTitle}>กำลังโหลดรายการคำขอ</Typography>
                  <Typography className={styles.emptyStateDescription}>กรุณารอสักครู่ ระบบกำลังดึงข้อมูลจาก API</Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>

      <Dialog open={reasonDialog.isOpen} onClose={handleCloseRejectedReason} fullWidth maxWidth="sm">
        <DialogTitle>สาเหตุที่ไม่อนุมัติ</DialogTitle>

        <DialogContent dividers>
          <Typography className={styles.dialogTitleText}>{reasonDialog.requestTitle}</Typography>
          <Typography className={styles.dialogSubText}>รหัสคำขอ {reasonDialog.requestId}</Typography>
          <Box className={styles.reasonBox}><Typography className={styles.reasonText}>{reasonDialog.rejectedReason || '-'}</Typography></Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseRejectedReason}>ปิด</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CourseOpeningRequestListPage