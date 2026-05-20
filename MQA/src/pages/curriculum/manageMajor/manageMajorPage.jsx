import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import DeviceHubRoundedIcon from '@mui/icons-material/DeviceHubRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import styles from './manageMajorPage.module.css'

function ManageMajorPage() {
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL
  const [majorList, setMajorList] = useState([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedMajor, setSelectedMajor] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)

  useEffect(() => {
    const fetchMajorList = async () => {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const token = localStorage.getItem('mqa_token')
        const response = await axios.get(`${apiUrl}/departments/`, { headers: { Authorization: `Bearer ${token}` } })
        const departmentList = Array.isArray(response.data) ? response.data : response.data.departments || []

        const mappedMajorList = departmentList.map((department) => ({
          id: department.id || department.department_id || department.departmentId,
          majorCode: department.external_id || department.department_code || department.departmentCode || department.id,
          majorNameTh: department.department_name || department.departmentName || department.name || '-',
          rawData: department,
        }))

        setMajorList(mappedMajorList)
      } catch (error) {
        console.error('Error fetching major list:', error)
        setErrorMessage('ไม่สามารถดึงข้อมูลสาขาได้ กรุณาลองใหม่อีกครั้ง')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMajorList()
  }, [apiUrl])

  const filteredMajorList = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase()
    if (!normalizedKeyword) return majorList

    return majorList.filter((major) => major.majorNameTh.toLowerCase().includes(normalizedKeyword))
  }, [majorList, searchKeyword])

  const handleSelectMajor = (major) => {
    setSelectedMajor(major)
    setIsActionDialogOpen(true)
  }

  const handleCloseActionDialog = () => setIsActionDialogOpen(false)

  const handleGoToAddSubject = () => {
    if (!selectedMajor) return
    navigate('/addSubject', { state: { major: selectedMajor } })
  }

  const handleGoToManagePloSubjectMapping = () => {
    if (!selectedMajor) return
    navigate('/managePloSubjectMapping', { state: { major: selectedMajor } })
  }

  const handleGoToManageDocumentCheck = () => {
    if (!selectedMajor) return
    navigate('/manageDocumentCheck', { state: { major: selectedMajor } })
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>จัดการสาขา</Typography>
            <Typography className={styles.pageDescription}>เลือกสาขาที่ต้องการจัดการ เพื่อเข้าสู่ขั้นตอนการทำงานของสาขานั้น</Typography>
          </Box>

          <Box className={styles.pageStatus}>
            <Typography className={styles.pageStatusLabel}>จำนวนสาขา</Typography>
            <Typography className={styles.pageStatusValue}>{filteredMajorList.length}</Typography>
          </Box>
        </Box>

        <Box className={styles.contentShell}>
          <Box className={styles.infoBanner}>
            <Box className={styles.infoBadge}>
              <AccountTreeRoundedIcon fontSize="small" />
              <Typography className={styles.infoBadgeText}>MAJOR MANAGEMENT</Typography>
            </Box>

            <Typography className={styles.infoTitle}>เลือกสาขาก่อนเพื่อเข้าสู่การจัดการ</Typography>
            <Typography className={styles.infoDescription}>ข้อมูลสาขาถูกดึงมาจากระบบ และจะแสดงเฉพาะชื่อสาขาสำหรับเลือกจัดการ</Typography>
          </Box>

          <Box className={styles.searchSection}>
            <TextField
              fullWidth
              placeholder="ค้นหาชื่อสาขา..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon className={styles.searchIcon} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {isLoading ? (
            <Box className={styles.emptyState}>
              <Typography className={styles.emptyStateTitle}>กำลังโหลดข้อมูลสาขา...</Typography>
              <Typography className={styles.emptyStateDescription}>กรุณารอสักครู่</Typography>
            </Box>
          ) : errorMessage ? (
            <Box className={styles.emptyState}>
              <Typography className={styles.emptyStateTitle}>เกิดข้อผิดพลาด</Typography>
              <Typography className={styles.emptyStateDescription}>{errorMessage}</Typography>
            </Box>
          ) : filteredMajorList.length === 0 ? (
            <Box className={styles.emptyState}>
              <Typography className={styles.emptyStateTitle}>ไม่พบสาขาที่ค้นหา</Typography>
              <Typography className={styles.emptyStateDescription}>ลองเปลี่ยนคำค้นหาแล้วค้นหาใหม่อีกครั้ง</Typography>
            </Box>
          ) : (
            <Box className={styles.majorGrid}>
              {filteredMajorList.map((major) => (
                <Box key={major.id} className={styles.majorCard} onClick={() => handleSelectMajor(major)} role="button" tabIndex={0} onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') handleSelectMajor(major)
                }}>
                  <Typography className={styles.majorName}>{major.majorNameTh}</Typography>

                  <Button variant="text" endIcon={<ArrowForwardRoundedIcon />} className={styles.selectButton} onClick={(event) => {
                    event.stopPropagation()
                    handleSelectMajor(major)
                  }}>
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
              <Typography className={styles.dialogMajorName}>{selectedMajor.majorNameTh}</Typography>
            </Box>
          )}

          <Box className={styles.actionOptionGrid}>
            <Box className={styles.actionOptionCard}>
              <Box className={styles.actionOptionIcon}><MenuBookRoundedIcon /></Box>
              <Typography className={styles.actionOptionTitle}>เพิ่มวิชา</Typography>
              <Typography className={styles.actionOptionDescription}>เข้าไปกรอกข้อมูลรายวิชาใหม่สำหรับสาขานี้</Typography>
              <Button variant="contained" className={styles.actionOptionButton} onClick={handleGoToAddSubject}>ไปหน้าเพิ่มวิชา</Button>
            </Box>

            <Box className={styles.actionOptionCard}>
              <Box className={styles.actionOptionIcon}><DeviceHubRoundedIcon /></Box>
              <Typography className={styles.actionOptionTitle}>จัดการความเชื่อมโยงผลลัพธ์การเรียนรู้กับรายวิชาในหลักสูตร</Typography>
              <Typography className={styles.actionOptionDescription}>ใช้สำหรับกำหนดความเชื่อมโยงของผลลัพธ์การเรียนรู้กับรายวิชาในหลักสูตรของสาขานี้</Typography>
              <Button variant="contained" className={styles.actionOptionButton} onClick={handleGoToManagePloSubjectMapping}>ไปหน้าจัดการ</Button>
            </Box>

            <Box className={styles.actionOptionCard}>
              <Box className={styles.actionOptionIcon}><FactCheckRoundedIcon /></Box>
              <Typography className={styles.actionOptionTitle}>ตรวจสอบการส่งเอกสาร มคอ.</Typography>
              <Typography className={styles.actionOptionDescription}>ใช้สำหรับตรวจสอบว่าอาจารย์ในสาขานี้ส่งเอกสาร มคอ. ครบหรือยัง ส่งเวลาใด และมีรายการใดที่ล่าช้าหรือยังไม่ส่ง</Typography>
              <Button variant="contained" className={styles.actionOptionButton} onClick={handleGoToManageDocumentCheck}>ไปหน้าตรวจเอกสาร</Button>
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

export default ManageMajorPage