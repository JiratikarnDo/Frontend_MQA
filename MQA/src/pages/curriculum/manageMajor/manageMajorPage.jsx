import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import DeviceHubRoundedIcon from '@mui/icons-material/DeviceHubRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import styles from './manageMajorPage.module.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const getToken = () => localStorage.getItem('mqa_token') || ''

const buildAuthHeaders = () => {
  const token = getToken()

  if (!token) {
    return {}
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

const normalizeText = (value) => String(value ?? '').trim()

const getFieldValue = (source, fieldNames, fallback = '') => {
  for (const fieldName of fieldNames) {
    const value = source?.[fieldName]

    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value
    }
  }

  return fallback
}

const mapDepartmentToMajor = (department, index) => {
  const id = Number(getFieldValue(department, ['id', 'department_id', 'departmentId'], index + 1))
  const departmentName = normalizeText(
    getFieldValue(department, [
      'department_name',
      'departmentName',
      'majorNameTh',
      'major_name_th',
      'name',
    ])
  )
  const facultyName = normalizeText(
    getFieldValue(department, [
      'faculty_name',
      'facultyName',
      'faculty',
    ])
  )
  const curriculumName = normalizeText(
    getFieldValue(department, [
      'curriculum_name_th',
      'curriculumNameTh',
      'curriculum_name',
      'curriculumName',
    ])
  )

  return {
    ...department,
    id,
    departmentId: id,
    department_id: id,
    majorCode: normalizeText(
      getFieldValue(department, [
        'department_code',
        'departmentCode',
        'majorCode',
        'major_code',
      ], id)
    ),
    majorNameTh: departmentName || `สาขาที่ ${id}`,
    departmentName: departmentName || `สาขาที่ ${id}`,
    department_name: departmentName || `สาขาที่ ${id}`,
    curriculumNameTh: curriculumName || facultyName || 'ข้อมูลสาขาจากฐานข้อมูล',
    facultyName,
  }
}

function ManageMajorPage() {
  const navigate = useNavigate()
  const [majorList, setMajorList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedMajor, setSelectedMajor] = useState(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)

  const fetchMajorList = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const response = await axios.get(`${API_URL}/departments/`, {
        headers: buildAuthHeaders(),
      })

      const departmentList = Array.isArray(response.data) ? response.data : []
      const mappedMajorList = departmentList.map(mapDepartmentToMajor)

      setMajorList(mappedMajorList)
    } catch (error) {
      console.error('FETCH DEPARTMENTS ERROR:', error)

      const errorDetail =
        error?.response?.data?.detail ||
        error?.message ||
        'ไม่สามารถดึงข้อมูลสาขาจากฐานข้อมูลได้'

      setLoadError(errorDetail)
      setMajorList([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMajorList()
  }, [fetchMajorList])

  const filteredMajorList = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase()

    if (!normalizedKeyword) {
      return majorList
    }

    return majorList.filter((major) => {
      return (
        String(major.majorCode || '').toLowerCase().includes(normalizedKeyword) ||
        String(major.majorNameTh || '').toLowerCase().includes(normalizedKeyword) ||
        String(major.curriculumNameTh || '').toLowerCase().includes(normalizedKeyword) ||
        String(major.facultyName || '').toLowerCase().includes(normalizedKeyword)
      )
    })
  }, [majorList, searchKeyword])

  const handleSelectMajor = (major) => {
    setSelectedMajor(major)
    setIsActionDialogOpen(true)
  }

  const handleCloseActionDialog = () => {
    setIsActionDialogOpen(false)
  }

  const buildNavigateState = () => ({
    major: selectedMajor,
    selectedMajor,
    departmentId: selectedMajor?.id,
  })

  const handleGoToAddSubject = () => {
    if (!selectedMajor) return

    navigate(`/addSubject?departmentId=${selectedMajor.id}`, {
      state: buildNavigateState(),
    })
  }

  const handleGoToManagePloSubjectMapping = () => {
    if (!selectedMajor) return

    navigate(`/managePloSubjectMapping?departmentId=${selectedMajor.id}`, {
      state: buildNavigateState(),
    })
  }

  const handleGoToManageDocumentCheck = () => {
    if (!selectedMajor) return

    navigate(`/manageDocumentCheck?departmentId=${selectedMajor.id}`, {
      state: buildNavigateState(),
    })
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>
              จัดการสาขา
            </Typography>

            <Typography className={styles.pageDescription}>
              เลือกสาขาที่ต้องการจัดการ เพื่อเข้าสู่ขั้นตอนการทำงานของสาขานั้น
            </Typography>
          </Box>

          <Box className={styles.pageStatus}>
            <Typography className={styles.pageStatusLabel}>
              จำนวนสาขา
            </Typography>

            <Typography className={styles.pageStatusValue}>
              {filteredMajorList.length}
            </Typography>
          </Box>
        </Box>

        <Box className={styles.contentShell}>
          <Box className={styles.infoBanner}>
            <Box className={styles.infoBadge}>
              <AccountTreeRoundedIcon fontSize="small" />
              <Typography className={styles.infoBadgeText}>
                MAJOR MANAGEMENT
              </Typography>
            </Box>

            <Typography className={styles.infoTitle}>
              เลือกสาขาก่อนเพื่อเข้าสู่การจัดการ
            </Typography>

            <Typography className={styles.infoDescription}>
              ดึงข้อมูลสาขาจริงจากฐานข้อมูลผ่าน API /departments และส่ง departmentId ไปยังหน้าทำงานถัดไป
            </Typography>
          </Box>

          <Box className={styles.searchSection}>
            <TextField
              fullWidth
              placeholder="ค้นหาชื่อสาขาหรือพิมพ์เลขรหัส..."
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

          {loadError ? (
            <Box className={styles.emptyState}>
              <Typography className={styles.emptyStateTitle}>
                ดึงข้อมูลสาขาไม่สำเร็จ
              </Typography>

              <Typography className={styles.emptyStateDescription}>
                {loadError}
              </Typography>

              <Button variant="contained" onClick={fetchMajorList}>
                โหลดข้อมูลใหม่
              </Button>
            </Box>
          ) : isLoading ? (
            <Box className={styles.emptyState}>
              <Typography className={styles.emptyStateTitle}>
                กำลังโหลดข้อมูลสาขา...
              </Typography>

              <Typography className={styles.emptyStateDescription}>
                กรุณารอสักครู่ ระบบกำลังดึงข้อมูลจากฐานข้อมูล
              </Typography>
            </Box>
          ) : filteredMajorList.length === 0 ? (
            <Box className={styles.emptyState}>
              <Typography className={styles.emptyStateTitle}>
                ไม่พบสาขาที่ค้นหา
              </Typography>

              <Typography className={styles.emptyStateDescription}>
                ลองเปลี่ยนคำค้นหาแล้วค้นหาใหม่อีกครั้ง หรือกดโหลดข้อมูลใหม่
              </Typography>

              <Button variant="outlined" onClick={fetchMajorList}>
                โหลดข้อมูลใหม่
              </Button>
            </Box>
          ) : (
            <Box className={styles.majorGrid}>
              {filteredMajorList.map((major) => (
                <Box
                  key={major.id}
                  className={styles.majorCard}
                  onClick={() => handleSelectMajor(major)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      handleSelectMajor(major)
                    }
                  }}
                >
                  <Box className={styles.majorCardTop}>
                    <Chip
                      label={`#${major.majorCode}`}
                      className={styles.majorCodeChip}
                    />
                  </Box>

                  <Typography className={styles.majorName}>
                    {major.majorNameTh}
                  </Typography>

                  <Typography className={styles.curriculumName}>
                    {major.curriculumNameTh}
                  </Typography>

                  <Button
                    variant="text"
                    endIcon={<ArrowForwardRoundedIcon />}
                    className={styles.selectButton}
                    onClick={(event) => {
                      event.stopPropagation()
                      handleSelectMajor(major)
                    }}
                  >
                    เลือกสาขานี้
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <Dialog
        open={isActionDialogOpen}
        onClose={handleCloseActionDialog}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          className: styles.actionDialogPaper,
        }}
      >
        <DialogTitle className={styles.actionDialogTitle}>
          เลือกการจัดการสาขา
        </DialogTitle>

        <DialogContent className={styles.actionDialogContent}>
          {selectedMajor && (
            <Box className={styles.selectedMajorSummary}>
              <Chip
                label={`#${selectedMajor.majorCode}`}
                className={styles.dialogMajorChip}
              />

              <Typography className={styles.dialogMajorName}>
                {selectedMajor.majorNameTh}
              </Typography>

              <Typography className={styles.dialogCurriculumName}>
                {selectedMajor.curriculumNameTh}
              </Typography>
            </Box>
          )}

          <Box className={styles.actionOptionGrid}>
            <Box className={styles.actionOptionCard}>
              <Box className={styles.actionOptionIcon}>
                <MenuBookRoundedIcon />
              </Box>

              <Typography className={styles.actionOptionTitle}>
                เพิ่มวิชา
              </Typography>

              <Typography className={styles.actionOptionDescription}>
                เข้าไปกรอกข้อมูลรายวิชาใหม่สำหรับสาขานี้
              </Typography>

              <Button
                variant="contained"
                className={styles.actionOptionButton}
                onClick={handleGoToAddSubject}
              >
                ไปหน้าเพิ่มวิชา
              </Button>
            </Box>

            <Box className={styles.actionOptionCard}>
              <Box className={styles.actionOptionIcon}>
                <DeviceHubRoundedIcon />
              </Box>

              <Typography className={styles.actionOptionTitle}>
                จัดการความเชื่อมโยงผลลัพธ์การเรียนรู้กับรายวิชาในหลักสูตร
              </Typography>

              <Typography className={styles.actionOptionDescription}>
                ใช้สำหรับกำหนดความเชื่อมโยงของผลลัพธ์การเรียนรู้กับรายวิชาในหลักสูตรของสาขานี้
              </Typography>

              <Button
                variant="contained"
                className={styles.actionOptionButton}
                onClick={handleGoToManagePloSubjectMapping}
              >
                ไปหน้าจัดการ
              </Button>
            </Box>

            <Box className={styles.actionOptionCard}>
              <Box className={styles.actionOptionIcon}>
                <FactCheckRoundedIcon />
              </Box>

              <Typography className={styles.actionOptionTitle}>
                ตรวจสอบการส่งเอกสาร มคอ.
              </Typography>

              <Typography className={styles.actionOptionDescription}>
                ใช้สำหรับตรวจสอบว่าอาจารย์ในสาขานี้ส่งเอกสาร มคอ. ครบหรือยัง ส่งเวลาใด และมีรายการใดที่ล่าช้าหรือยังไม่ส่ง
              </Typography>

              <Button
                variant="contained"
                className={styles.actionOptionButton}
                onClick={handleGoToManageDocumentCheck}
              >
                ไปหน้าตรวจเอกสาร
              </Button>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions className={styles.actionDialogActions}>
          <Button onClick={handleCloseActionDialog}>
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ManageMajorPage
