import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, MenuItem, TextField, Typography } from '@mui/material'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import styles from './deanCourseOpeningReviewListPage.module.css'

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

const getRequestDepartmentId = (item) => item?.department_id ?? item?.departmentId ?? item?.department?.id ?? item?.rawData?.department_id ?? item?.rawData?.departmentId ?? item?.rawData?.department?.id ?? null

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
  if (status === 'pendingApproval') return { label: 'รอคณบดีพิจารณา', className: styles.statusChipPendingApproval }
  if (status === 'approved') return { label: 'อนุมัติแล้ว', className: styles.statusChipApproved }
  if (status === 'rejected') return { label: 'ไม่อนุมัติ', className: styles.statusChipRejected }
  if (status === 'draft') return { label: 'แบบร่าง', className: styles.statusChipPendingApproval }
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
  if (!requestedCourses.length) return [{ id: 1, yearLevel: '1', entryTerm: String(data?.semester ?? ''), academicYear: String(data?.academic_year ?? data?.academicYear ?? ''), subjectRows: [{ id: 1, courseId: '', courseCode: '', courseName: '', credits: '', groupCount: '1', studentCount: '', isFreeElective: false, scienceTrack: false, humanitiesTrack: false, note: '' }] }]

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

  if (level === 'master') return { generalForm: { submissionRound, semester, academicYear, curriculumName, majorName }, studyForm: { studyPlan: programType || targetGroup || 'planB', learningPeriod: studyMode || 'afterHours', campus }, yearBlocks: buildYearBlocksFromApi(data), approvalForm }
  if (level === 'doctoral') return { generalForm: { submissionRound, semester, academicYear, curriculumName, majorName, doctoralFormType: programType || targetGroup || '1.1', formType: programType || targetGroup || '1.1', campus }, studyForm: {}, yearBlocks: buildYearBlocksFromApi(data), approvalForm }

  return { generalForm: { submissionRound, semester, academicYear, curriculumName, majorName, programType: programType || '4year' }, studyForm: { learningPeriod: studyMode || 'regular', campus, targetGroup: targetGroup || 'bp' }, yearBlocks: buildYearBlocksFromApi(data), approvalForm }
}

const normalizeCourseOpeningFromApi = (apiData, fallbackData = {}) => {
  const data = { ...fallbackData, ...apiData }
  const id = getCourseOpeningRequestId(data)
  const level = inferCourseOpeningLevel(data)
  const status = normalizeStatus(data?.status)
  const createdAt = data?.created_at ?? data?.createdAt ?? ''
  const updatedAt = data?.updated_at ?? data?.updatedAt ?? createdAt
  const submittedAt = data?.submitted_at ?? data?.submittedAt ?? (status === 'pendingApproval' || status === 'approved' || status === 'rejected' ? updatedAt || createdAt : '')
  const reviewedAt = data?.reviewed_at ?? data?.reviewedAt ?? (status === 'approved' || status === 'rejected' ? updatedAt || createdAt : '')
  const rejectedReason = data?.rejected_reason ?? data?.rejectedReason ?? data?.note ?? ''

  return { id, level, status, updatedAt, submittedAt, reviewedAt, rejectedReason, rawData: data, documentData: buildDocumentDataFromApi(data, level) }
}

const isMatchedSelectedMajor = (item, selectedMajor) => {
  if (!selectedMajor) return true

  const selectedDepartmentId = selectedMajor?.departmentId ?? selectedMajor?.id ?? null
  const requestDepartmentId = getRequestDepartmentId(item)

  if (selectedDepartmentId && requestDepartmentId) return String(requestDepartmentId) === String(selectedDepartmentId)

  const selectedMajorCode = normalizeText(selectedMajor?.majorCode)
  const requestMajorCode = normalizeText(item?.rawData?.major_code ?? item?.rawData?.majorCode ?? item?.documentData?.generalForm?.majorCode)

  if (selectedMajorCode && requestMajorCode) return selectedMajorCode === requestMajorCode

  const selectedMajorName = normalizeText(selectedMajor?.majorNameTh ?? selectedMajor?.majorName ?? selectedMajor?.departmentName ?? selectedMajor?.department_name).toLowerCase()
  const requestMajorName = normalizeText(item?.documentData?.generalForm?.majorName ?? item?.rawData?.major_name ?? item?.rawData?.majorName).toLowerCase()

  if (selectedMajorName && requestMajorName) return selectedMajorName === requestMajorName || requestMajorName.includes(selectedMajorName) || selectedMajorName.includes(requestMajorName)

  return true
}

function DeanCourseOpeningReviewListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const apiUrl = import.meta.env.VITE_API_URL
  const selectedMajor = location.state?.selectedMajor || null

  const [requestList, setRequestList] = useState([])
  const [levelFilter, setLevelFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isActionLoadingId, setIsActionLoadingId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [rejectDialog, setRejectDialog] = useState({ isOpen: false, requestId: '', requestTitle: '', note: '' })
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
      const normalizedList = await Promise.all(summaryList.map(async (summaryItem) => {
        const normalizedSummary = normalizeCourseOpeningFromApi(summaryItem)
        try { return await fetchRequestDetail(normalizedSummary) } catch (error) { return normalizedSummary }
      }))

      const scopedList = normalizedList.filter((item) => isMatchedSelectedMajor(item, selectedMajor))
      setRequestList(scopedList)
    } catch (error) {
      console.error('Error fetching dean course opening requests:', error)
      setRequestList([])
      setErrorMessage(getErrorMessage(error, 'ไม่สามารถดึงรายการคำขอเปิดรายวิชาสำหรับคณบดีได้'))
    } finally {
      setIsLoading(false)
    }
  }, [apiUrl, fetchRequestDetail, selectedMajor])

  useEffect(() => {
    fetchRequestList()
  }, [fetchRequestList])

  const pendingRequestList = useMemo(() => requestList.filter((item) => item.status === 'pendingApproval'), [requestList])

  const filteredRequestList = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLowerCase()

    return pendingRequestList.filter((item) => {
      const curriculumName = item.documentData?.generalForm?.curriculumName ?? ''
      const majorName = item.documentData?.generalForm?.majorName ?? ''
      const requestId = String(item.id ?? '')
      const matchedLevel = levelFilter === 'all' ? true : item.level === levelFilter
      const matchedSearch = normalizedSearchText.length === 0 || requestId.toLowerCase().includes(normalizedSearchText) || curriculumName.toLowerCase().includes(normalizedSearchText) || majorName.toLowerCase().includes(normalizedSearchText) || getLevelLabel(item.level).toLowerCase().includes(normalizedSearchText)

      return matchedLevel && matchedSearch
    })
  }, [levelFilter, pendingRequestList, searchText])

  const pageSummary = useMemo(() => {
    const totalCount = requestList.length
    const pendingApprovalCount = requestList.filter((item) => item.status === 'pendingApproval').length
    const approvedCount = requestList.filter((item) => item.status === 'approved').length
    const rejectedCount = requestList.filter((item) => item.status === 'rejected').length
    return { totalCount, pendingApprovalCount, approvedCount, rejectedCount }
  }, [requestList])

  const handleViewDetail = async (item) => {
    try {
      const detailItem = await fetchRequestDetail(item)
      const navigationState = { requestData: detailItem, viewerRole: 'dean' }

      if (detailItem.level === 'bachelor') { navigate('/courseOpeningBachelor', { state: navigationState }); return }
      if (detailItem.level === 'master') { navigate('/courseOpeningMaster', { state: navigationState }); return }
      if (detailItem.level === 'doctoral') navigate('/courseOpeningDoctoral', { state: navigationState })
    } catch (error) {
      console.error('Error fetching dean request detail:', error)
      window.alert(getErrorMessage(error, 'ไม่สามารถดึงรายละเอียดคำขอเปิดรายวิชาได้'))
    }
  }

  const handleApproveRequest = async (item) => {
    const requestId = getCourseOpeningRequestId(item)
    if (!requestId) { window.alert('ไม่พบรหัสคำขอเปิดรายวิชา'); return }

    const confirmed = window.confirm('ต้องการอนุมัติคำขอเปิดรายวิชารายการนี้ใช่หรือไม่')
    if (!confirmed) return

    setIsActionLoadingId(String(requestId))

    try {
      await axios.patch(`${apiUrl}${COURSE_OPENING_ENDPOINT}${requestId}/dean-approval`, { status: 'approved', comment: '' }, getAuthConfig())
      await fetchRequestList()
      window.alert('อนุมัติเอกสารเรียบร้อยแล้ว')
    } catch (error) {
      console.error('Error approving course opening request:', error)
      window.alert(getErrorMessage(error, 'ไม่สามารถอนุมัติคำขอเปิดรายวิชาได้'))
    } finally {
      setIsActionLoadingId('')
    }
  }

  const handleOpenRejectDialog = (item) => {
    setRejectDialog({ isOpen: true, requestId: String(item.id ?? ''), requestTitle: `${item.documentData?.generalForm?.curriculumName ?? '-'} - ${item.documentData?.generalForm?.majorName ?? '-'}`, note: '' })
  }

  const handleCloseRejectDialog = () => setRejectDialog({ isOpen: false, requestId: '', requestTitle: '', note: '' })

  const handleConfirmRejectRequest = async () => {
    const trimmedNote = rejectDialog.note.trim()
    if (!trimmedNote) { window.alert('กรุณาระบุหมายเหตุสำหรับการไม่อนุมัติ'); return }

    setIsActionLoadingId(String(rejectDialog.requestId))

    try {
      await axios.patch(`${apiUrl}${COURSE_OPENING_ENDPOINT}${rejectDialog.requestId}/dean-approval`, { status: 'rejected', comment: trimmedNote }, getAuthConfig())
      handleCloseRejectDialog()
      await fetchRequestList()
      window.alert('บันทึกผลไม่อนุมัติเรียบร้อยแล้ว')
    } catch (error) {
      console.error('Error rejecting course opening request:', error)
      window.alert(getErrorMessage(error, 'ไม่สามารถไม่อนุมัติคำขอเปิดรายวิชาได้'))
    } finally {
      setIsActionLoadingId('')
    }
  }

  const handleOpenRejectedReason = (item) => {
    setReasonDialog({ isOpen: true, requestId: String(item.id ?? ''), requestTitle: `${item.documentData?.generalForm?.curriculumName ?? '-'} - ${item.documentData?.generalForm?.majorName ?? '-'}`, rejectedReason: item.rejectedReason })
  }

  const handleCloseRejectedReason = () => setReasonDialog({ isOpen: false, requestId: '', requestTitle: '', rejectedReason: '' })

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>ตรวจสอบเอกสารการเปิดรายวิชา</Typography>
            <Typography className={styles.pageDescription}>หน้านี้ใช้สำหรับตรวจสอบเอกสารที่หัวหน้าสาขาส่งมาในสถานะรอพิจารณา คณบดีสามารถดูรายละเอียดเอกสารก่อนตัดสินใจอนุมัติหรือไม่อนุมัติได้</Typography>
          </Box>

          {selectedMajor && (
            <Box className={styles.selectedMajorBox}>
              <Typography className={styles.selectedMajorLabel}>สาขาที่กำลังตรวจสอบ</Typography>
              <Typography className={styles.selectedMajorValue}>{selectedMajor.majorNameTh || selectedMajor.majorName || '-'}</Typography>
              <Typography className={styles.selectedMajorSubValue}>รหัสสาขา {selectedMajor.majorCode || selectedMajor.departmentId || '-'}</Typography>
            </Box>
          )}
        </Box>

        <Box className={styles.summaryGrid}>
          <Box className={styles.summaryCard}><Box className={styles.summaryIconBlue}><DescriptionRoundedIcon /></Box><Box><Typography className={styles.summaryLabel}>เอกสารทั้งหมด</Typography><Typography className={styles.summaryValue}>{pageSummary.totalCount}</Typography></Box></Box>
          <Box className={styles.summaryCard}><Box className={styles.summaryIconAmber}><AccessTimeRoundedIcon /></Box><Box><Typography className={styles.summaryLabel}>รอพิจารณา</Typography><Typography className={styles.summaryValue}>{pageSummary.pendingApprovalCount}</Typography></Box></Box>
          <Box className={styles.summaryCard}><Box className={styles.summaryIconGreen}><CheckCircleRoundedIcon /></Box><Box><Typography className={styles.summaryLabel}>อนุมัติแล้ว</Typography><Typography className={styles.summaryValue}>{pageSummary.approvedCount}</Typography></Box></Box>
          <Box className={styles.summaryCard}><Box className={styles.summaryIconRed}><CancelRoundedIcon /></Box><Box><Typography className={styles.summaryLabel}>ไม่อนุมัติ</Typography><Typography className={styles.summaryValue}>{pageSummary.rejectedCount}</Typography></Box></Box>
        </Box>

        <Box className={styles.filterCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>ค้นหาและกรองรายการ</Typography>
              <Typography className={styles.sectionDescription}>รายการด้านล่างแสดงเฉพาะเอกสารสถานะรอคณบดีพิจารณาของสาขาที่เลือก</Typography>
            </Box>
          </Box>

          <Box className={styles.filterGrid}>
            <TextField fullWidth label="ค้นหารายการ" placeholder="ค้นหาจากรหัสคำขอ / หลักสูตร / สาขา" value={searchText} onChange={(event) => setSearchText(event.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchRoundedIcon /></InputAdornment>) }} />

            <Box className={styles.filterRightGrid}>
              <TextField select fullWidth label="ระดับการศึกษา" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
                <MenuItem value="all">ทั้งหมด</MenuItem>
                <MenuItem value="bachelor">ปริญญาตรี</MenuItem>
                <MenuItem value="master">ปริญญาโท</MenuItem>
                <MenuItem value="doctoral">ปริญญาเอก</MenuItem>
              </TextField>

              <TextField select fullWidth label="สถานะการพิจารณา" value="pendingApproval" disabled>
                <MenuItem value="pendingApproval">รอคณบดีพิจารณา</MenuItem>
              </TextField>
            </Box>
          </Box>
        </Box>

        <Box className={styles.listCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>รายการคำขอเปิดรายวิชา</Typography>
              <Typography className={styles.sectionDescription}>{isLoading ? 'กำลังดึงรายการจากระบบ...' : 'คณบดีสามารถกดดูรายละเอียดเอกสาร และเลือกอนุมัติหรือไม่อนุมัติได้จากรายการด้านล่าง'}</Typography>
            </Box>

            <Chip label={`พบ ${filteredRequestList.length} รายการ`} className={styles.resultChip} />
          </Box>

          {errorMessage && <Box className={styles.emptyState}><InfoOutlinedIcon className={styles.emptyStateIcon} /><Typography className={styles.emptyStateTitle}>เกิดข้อผิดพลาด</Typography><Typography className={styles.emptyStateDescription}>{errorMessage}</Typography><Button variant="contained" onClick={fetchRequestList}>ลองโหลดใหม่</Button></Box>}

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
                        <Button variant="outlined" startIcon={<VisibilityRoundedIcon />} className={styles.outlinedButton} onClick={() => handleViewDetail(item)} disabled={isActionLoadingId === String(item.id)}>ดูรายละเอียด</Button>

                        <Button variant="contained" startIcon={<CheckCircleRoundedIcon />} className={styles.approveButton} onClick={() => handleApproveRequest(item)} disabled={isActionLoadingId === String(item.id)}>
                          {isActionLoadingId === String(item.id) ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
                        </Button>

                        <Button variant="outlined" startIcon={<CancelRoundedIcon />} color="error" className={styles.rejectButton} onClick={() => handleOpenRejectDialog(item)} disabled={isActionLoadingId === String(item.id)}>
                          ไม่อนุมัติ
                        </Button>
                      </Box>
                    </Box>

                    <Box className={styles.metaGrid}>
                      <Box className={styles.metaCard}><Typography className={styles.metaLabel}>ภาคการศึกษา</Typography><Typography className={styles.metaValue}>{item.documentData?.generalForm?.semester || '-'}</Typography></Box>
                      <Box className={styles.metaCard}><Typography className={styles.metaLabel}>ปีการศึกษา</Typography><Typography className={styles.metaValue}>{item.documentData?.generalForm?.academicYear || '-'}</Typography></Box>
                      <Box className={styles.metaCard}><Typography className={styles.metaLabel}>วันที่ส่ง</Typography><Typography className={styles.metaValue}>{formatThaiDateTime(item.submittedAt)}</Typography></Box>
                      <Box className={styles.metaCard}><Typography className={styles.metaLabel}>วันที่พิจารณา</Typography><Typography className={styles.metaValue}>{formatThaiDateTime(item.reviewedAt)}</Typography></Box>
                    </Box>

                    <Box className={styles.requestFooter}>
                      <Typography className={styles.footerText}>เอกสารรายการนี้ถูกส่งเข้ามาแล้วและกำลังรอคณบดีพิจารณา</Typography>
                    </Box>
                  </Box>
                )
              })}

              {!isLoading && !filteredRequestList.length && (
                <Box className={styles.emptyState}>
                  <DescriptionRoundedIcon className={styles.emptyStateIcon} />
                  <Typography className={styles.emptyStateTitle}>ไม่พบเอกสารที่รอพิจารณา</Typography>
                  <Typography className={styles.emptyStateDescription}>ยังไม่มีเอกสารสถานะรอคณบดีพิจารณาของสาขานี้ หรือรายการอาจถูกอนุมัติ/ไม่อนุมัติไปแล้ว</Typography>
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

      <Dialog open={rejectDialog.isOpen} onClose={handleCloseRejectDialog} fullWidth maxWidth="sm">
        <DialogTitle>ไม่อนุมัติการเปิดรายวิชา</DialogTitle>

        <DialogContent dividers>
          <Typography className={styles.dialogTitleText}>{rejectDialog.requestTitle}</Typography>
          <Typography className={styles.dialogSubText}>รหัสคำขอ {rejectDialog.requestId}</Typography>
          <TextField fullWidth multiline minRows={4} label="หมายเหตุ" placeholder="กรุณาระบุเหตุผลหรือข้อเสนอแนะสำหรับการไม่อนุมัติ" value={rejectDialog.note} onChange={(event) => setRejectDialog((prev) => ({ ...prev, note: event.target.value }))} />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseRejectDialog} disabled={Boolean(isActionLoadingId)}>ยกเลิก</Button>
          <Button variant="contained" color="error" onClick={handleConfirmRejectRequest} disabled={Boolean(isActionLoadingId)}>
            {isActionLoadingId ? 'กำลังบันทึก...' : 'ยืนยันไม่อนุมัติ'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reasonDialog.isOpen} onClose={handleCloseRejectedReason} fullWidth maxWidth="sm">
        <DialogTitle>หมายเหตุการไม่อนุมัติ</DialogTitle>

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

export default DeanCourseOpeningReviewListPage