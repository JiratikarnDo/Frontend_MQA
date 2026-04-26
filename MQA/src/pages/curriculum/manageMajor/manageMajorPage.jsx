import { useMemo, useState } from 'react'
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

const mockMajorList = [
  {
    id: 61,
    majorCode: '61',
    majorNameTh: 'วิทยาการคอมพิวเตอร์',
    curriculumNameTh: 'หลักสูตรวิทยาศาสตร์',
  },
  {
    id: 103,
    majorCode: '103',
    majorNameTh: 'วิทยาการสารสนเทศทางธุรกิจ',
    curriculumNameTh: 'หลักสูตรบริหารธุรกิจ',
  },
  {
    id: 91,
    majorCode: '91',
    majorNameTh: 'เทคโนโลยีคอมพิวเตอร์',
    curriculumNameTh: 'หลักสูตรเทคโนโลยีอุตสาหกรรม',
  },
  {
    id: 93,
    majorCode: '93',
    majorNameTh: 'เทคโนโลยีมัลติมีเดีย',
    curriculumNameTh: 'หลักสูตรเทคโนโลยีอุตสาหกรรม',
  },
]

function ManageMajorPage() {
  const navigate = useNavigate()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedMajor, setSelectedMajor] = useState(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)

  const filteredMajorList = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase()

    if (!normalizedKeyword) {
      return mockMajorList
    }

    return mockMajorList.filter((major) => {
      return (
        String(major.majorCode).toLowerCase().includes(normalizedKeyword) ||
        major.majorNameTh.toLowerCase().includes(normalizedKeyword) ||
        (major.curriculumNameTh || '').toLowerCase().includes(normalizedKeyword)
      )
    })
  }, [searchKeyword])

  const handleSelectMajor = (major) => {
    setSelectedMajor(major)
    setIsActionDialogOpen(true)
  }

  const handleCloseActionDialog = () => {
    setIsActionDialogOpen(false)
  }

  const handleGoToAddSubject = () => {
    if (!selectedMajor) return

    navigate('/addSubject', {
      state: {
        major: selectedMajor,
      },
    })
  }

  const handleGoToManagePloSubjectMapping = () => {
    if (!selectedMajor) return

    navigate('/managePloSubjectMapping', {
      state: {
        major: selectedMajor,
      },
    })
  }

  const handleGoToManageDocumentCheck = () => {
    if (!selectedMajor) return

    navigate('/manageDocumentCheck', {
      state: {
        major: selectedMajor,
      },
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
              ตอนนี้หน้านี้ใช้ mock data ไปก่อน ภายหลังค่อยเปลี่ยนเป็นดึงข้อมูลจาก API
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

          {filteredMajorList.length === 0 ? (
            <Box className={styles.emptyState}>
              <Typography className={styles.emptyStateTitle}>
                ไม่พบสาขาที่ค้นหา
              </Typography>

              <Typography className={styles.emptyStateDescription}>
                ลองเปลี่ยนคำค้นหาแล้วค้นหาใหม่อีกครั้ง
              </Typography>
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
                ใช้สำหรับตรวจสอบว่าอาจารย์ในสาขานี้ส่งเอกสาร มคอ. ครบหรือยัง
                ส่งเวลาใด และมีรายการใดที่ล่าช้าหรือยังไม่ส่ง
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