import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import styles from './deanMajorSelectPage.module.css'

const DEPARTMENT_ENDPOINT = '/departments/'
const COURSE_OPENING_ENDPOINT = '/course-opening/'

const getAuthConfig = () => {
  const token = localStorage.getItem('mqa_token')
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} }
}

const getResponseList = (data, keyList = []) => {
  if (Array.isArray(data)) return data
  for (const key of keyList) if (Array.isArray(data?.[key])) return data[key]
  return []
}

const normalizeText = (value) => String(value ?? '').trim()

const normalizeStatus = (status) => {
  const statusText = normalizeText(status).toLowerCase()
  if (statusText === 'pending' || statusText === 'pendingapproval' || statusText === 'pending_approval') return 'pendingApproval'
  if (statusText === 'approved' || statusText === 'approve') return 'approved'
  if (statusText === 'rejected' || statusText === 'rejected_by_dean' || statusText === 'reject') return 'rejected'
  if (statusText === 'draft') return 'draft'
  return statusText || '-'
}

const getErrorMessage = (error, fallbackMessage) => {
  const detail = error?.response?.data?.detail
  const message = error?.response?.data?.message
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(', ')
  return detail || message || fallbackMessage
}

const getDepartmentId = (department) => department?.id ?? department?.department_id ?? department?.departmentId ?? department?.major_id ?? department?.majorId ?? null

const getDepartmentCode = (department) => department?.department_code ?? department?.departmentCode ?? department?.major_code ?? department?.majorCode ?? department?.code ?? getDepartmentId(department) ?? ''

const getDepartmentName = (department) => department?.department_name_thai ?? department?.departmentNameThai ?? department?.department_name_th ?? department?.departmentNameTh ?? department?.department_name ?? department?.departmentName ?? department?.major_name_thai ?? department?.majorNameThai ?? department?.major_name ?? department?.majorName ?? department?.name_thai ?? department?.nameThai ?? department?.name ?? ''

const getCurriculumName = (department) => {
  const curriculumList = getResponseList(department, ['curriculums', 'curriculum_list', 'curriculumList', 'shared_curriculums', 'sharedCurriculums'])
  const firstCurriculum = curriculumList[0]
  return department?.curriculum_name_thai ?? department?.curriculumNameThai ?? department?.curriculum_name ?? department?.curriculumName ?? firstCurriculum?.curriculum_name_thai ?? firstCurriculum?.curriculumNameThai ?? firstCurriculum?.curriculum_name ?? firstCurriculum?.curriculumName ?? '-'
}

const getRequestDepartmentId = (requestItem) => requestItem?.department_id ?? requestItem?.departmentId ?? requestItem?.department?.id ?? requestItem?.rawData?.department_id ?? requestItem?.rawData?.departmentId ?? null

const normalizeMajorFromApi = (department, pendingCountMap = new Map()) => {
  const departmentId = getDepartmentId(department)
  const majorCode = String(getDepartmentCode(department) || departmentId || '')
  const majorNameTh = getDepartmentName(department) || '-'
  const curriculumNameTh = getCurriculumName(department)
  const pendingRequestCount = pendingCountMap.get(String(departmentId)) ?? pendingCountMap.get(String(majorCode)) ?? 0

  return {
    id: departmentId ?? majorCode,
    departmentId,
    majorCode,
    majorNameTh,
    curriculumNameTh,
    pendingRequestCount,
    rawData: department,
  }
}

function DeanMajorSelectPage() {
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL

  const [majorList, setMajorList] = useState([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedMajor, setSelectedMajor] = useState(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchPendingCountMap = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}${COURSE_OPENING_ENDPOINT}`, { ...getAuthConfig(), params: { page: 1, limit: 100 } })
      const requestList = getResponseList(response.data, ['items', 'data', 'results', 'requests'])
      const pendingCountMap = new Map()

      requestList.forEach((requestItem) => {
        const status = normalizeStatus(requestItem?.status)
        if (status !== 'pendingApproval') return

        const departmentId = getRequestDepartmentId(requestItem)
        if (!departmentId) return

        const key = String(departmentId)
        pendingCountMap.set(key, (pendingCountMap.get(key) ?? 0) + 1)
      })

      return pendingCountMap
    } catch (error) {
      console.warn('Cannot fetch course opening pending count:', error)
      return new Map()
    }
  }, [apiUrl])

  const fetchMajorList = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [departmentResponse, pendingCountMap] = await Promise.all([
        axios.get(`${apiUrl}${DEPARTMENT_ENDPOINT}`, getAuthConfig()),
        fetchPendingCountMap(),
      ])

      const departmentList = getResponseList(departmentResponse.data, ['items', 'data', 'departments', 'results'])
      const nextMajorList = departmentList.map((department) => normalizeMajorFromApi(department, pendingCountMap)).filter((major) => major.id || major.majorCode || major.majorNameTh)

      setMajorList(nextMajorList)
    } catch (error) {
      console.error('Error fetching department list:', error)
      setMajorList([])
      setErrorMessage(getErrorMessage(error, 'ไม่สามารถดึงข้อมูลสาขาจากระบบได้'))
    } finally {
      setIsLoading(false)
    }
  }, [apiUrl, fetchPendingCountMap])

  useEffect(() => {
    fetchMajorList()
  }, [fetchMajorList])

  const filteredMajorList = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase()
    if (!normalizedKeyword) return majorList

    return majorList.filter((major) => {
      return String(major.majorCode).toLowerCase().includes(normalizedKeyword) || major.majorNameTh.toLowerCase().includes(normalizedKeyword) || (major.curriculumNameTh || '').toLowerCase().includes(normalizedKeyword)
    })
  }, [majorList, searchKeyword])

  const handleSelectMajor = (major) => {
    setSelectedMajor(major)
    setIsActionDialogOpen(true)
  }

  const handleCloseActionDialog = () => setIsActionDialogOpen(false)

  const handleGoToDeanCourseOpeningReviewList = () => {
    if (!selectedMajor) return
    navigate('/deanCourseOpeningReviewList', { state: { selectedMajor } })
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>เลือกสาขาสำหรับพิจารณาการเปิดรายวิชา</Typography>
            <Typography className={styles.pageDescription}>เลือกสาขาที่ต้องการตรวจสอบ เพื่อเข้าสู่หน้ารายการเอกสารขอเปิดรายวิชาของสาขานั้น</Typography>
          </Box>

          <Box className={styles.pageStatus}>
            <Typography className={styles.pageStatusLabel}>จำนวนสาขา</Typography>
            <Typography className={styles.pageStatusValue}>{filteredMajorList.length}</Typography>
          </Box>
        </Box>

        <Box className={styles.contentShell}>
          <Box className={styles.infoBanner}>
            <Box className={styles.infoBadge}>
              <FactCheckRoundedIcon fontSize="small" />
              <Typography className={styles.infoBadgeText}>DEAN REVIEW</Typography>
            </Box>

            <Typography className={styles.infoTitle}>เลือกสาขาก่อนเพื่อเข้าสู่การตรวจสอบเอกสาร</Typography>
            <Typography className={styles.infoDescription}>ข้อมูลสาขาถูกดึงจาก API และเมื่อเลือกสาขาแล้ว ระบบจะส่งข้อมูลสาขานั้นไปยังหน้าตรวจสอบเอกสาร</Typography>
          </Box>

          <Box className={styles.searchSection}>
            <TextField fullWidth placeholder="ค้นหาชื่อสาขา..." value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchRoundedIcon className={styles.searchIcon} /></InputAdornment>) }} />
          </Box>

          {errorMessage && (
            <Box className={styles.emptyState}>
              <Typography className={styles.emptyStateTitle}>เกิดข้อผิดพลาด</Typography>
              <Typography className={styles.emptyStateDescription}>{errorMessage}</Typography>
              <Button variant="contained" onClick={fetchMajorList}>ลองโหลดใหม่</Button>
            </Box>
          )}

          {!errorMessage && isLoading && (
            <Box className={styles.emptyState}>
              <Typography className={styles.emptyStateTitle}>กำลังโหลดข้อมูลสาขา</Typography>
              <Typography className={styles.emptyStateDescription}>กรุณารอสักครู่ ระบบกำลังดึงข้อมูลจาก API</Typography>
            </Box>
          )}

          {!errorMessage && !isLoading && filteredMajorList.length === 0 ? (
            <Box className={styles.emptyState}>
              <Typography className={styles.emptyStateTitle}>ไม่พบสาขาที่ค้นหา</Typography>
              <Typography className={styles.emptyStateDescription}>ลองเปลี่ยนคำค้นหาแล้วค้นหาใหม่อีกครั้ง</Typography>
            </Box>
          ) : null}

          {!errorMessage && !isLoading && filteredMajorList.length > 0 && (
            <Box className={styles.majorGrid}>
              {filteredMajorList.map((major) => (
                <Box key={major.id ?? major.majorCode} className={styles.majorCard} onClick={() => handleSelectMajor(major)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') handleSelectMajor(major) }}>
                  <Typography className={styles.majorName}>{major.majorNameTh}</Typography>

                  <Button variant="text" endIcon={<ArrowForwardRoundedIcon />} className={styles.selectButton} onClick={(event) => { event.stopPropagation(); handleSelectMajor(major) }}>
                    เลือกสาขานี้
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <Dialog open={isActionDialogOpen} onClose={handleCloseActionDialog} fullWidth maxWidth="lg" PaperProps={{ className: styles.actionDialogPaper }}>
        <DialogTitle className={styles.actionDialogTitle}>เลือกการจัดการสาขา</DialogTitle>

        <DialogContent className={styles.actionDialogContent}>
          {selectedMajor && (
            <Box className={styles.selectedMajorSummary}>
              <Chip label={`#${selectedMajor.majorCode || '-'}`} className={styles.dialogMajorChip} />
              <Typography className={styles.dialogMajorName}>{selectedMajor.majorNameTh}</Typography>
              <Typography className={styles.dialogCurriculumName}>{selectedMajor.curriculumNameTh}</Typography>
            </Box>
          )}

          <Box className={styles.actionOptionGrid}>
            <Box className={styles.actionOptionCard}>
              <Box className={styles.actionOptionIcon}><DescriptionRoundedIcon /></Box>

              <Typography className={styles.actionOptionTitle}>ตรวจสอบเอกสารการเปิดรายวิชา</Typography>
              <Typography className={styles.actionOptionDescription}>
                ใช้สำหรับตรวจสอบรายการเอกสารขอเปิดรายวิชาของสาขานี้ เข้าไปดูรายละเอียดเอกสาร และพิจารณาอนุมัติหรือไม่อนุมัติได้{selectedMajor ? ` ขณะนี้มีรายการรอพิจารณา ${selectedMajor.pendingRequestCount} รายการ` : ''}
              </Typography>

              <Button variant="contained" className={styles.actionOptionButton} onClick={handleGoToDeanCourseOpeningReviewList}>ไปหน้าตรวจสอบเอกสาร</Button>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions className={styles.actionDialogActions}>
          <Button onClick={handleCloseActionDialog}>ปิด</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DeanMajorSelectPage