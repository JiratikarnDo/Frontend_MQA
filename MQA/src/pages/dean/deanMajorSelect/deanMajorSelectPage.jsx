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
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import styles from './deanMajorSelectPage.module.css'

const mockMajorList = [
  {
    id: 61,
    majorCode: '61',
    majorNameTh: 'วิทยาการคอมพิวเตอร์',
    curriculumNameTh: 'หลักสูตรวิทยาศาสตร์',
    pendingRequestCount: 4,
  },
  {
    id: 103,
    majorCode: '103',
    majorNameTh: 'วิทยาการสารสนเทศทางธุรกิจ',
    curriculumNameTh: 'หลักสูตรบริหารธุรกิจ',
    pendingRequestCount: 2,
  },
  {
    id: 91,
    majorCode: '91',
    majorNameTh: 'เทคโนโลยีคอมพิวเตอร์',
    curriculumNameTh: 'หลักสูตรเทคโนโลยีอุตสาหกรรม',
    pendingRequestCount: 3,
  },
  {
    id: 93,
    majorCode: '93',
    majorNameTh: 'เทคโนโลยีมัลติมีเดีย',
    curriculumNameTh: 'หลักสูตรเทคโนโลยีอุตสาหกรรม',
    pendingRequestCount: 1,
  },
]

function DeanMajorSelectPage() {
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

  const handleGoToDeanCourseOpeningReviewList = () => {
    if (!selectedMajor) return

    navigate('/deanCourseOpeningReviewList', {
      state: {
        selectedMajor,
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
              เลือกสาขาสำหรับพิจารณาการเปิดรายวิชา
            </Typography>

            <Typography className={styles.pageDescription}>
              เลือกสาขาที่ต้องการตรวจสอบ เพื่อเข้าสู่หน้ารายการเอกสารขอเปิดรายวิชาของสาขานั้น
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
              <FactCheckRoundedIcon fontSize="small" />
              <Typography className={styles.infoBadgeText}>
                DEAN REVIEW
              </Typography>
            </Box>

            <Typography className={styles.infoTitle}>
              เลือกสาขาก่อนเพื่อเข้าสู่การตรวจสอบเอกสาร
            </Typography>

            <Typography className={styles.infoDescription}>
              ตอนนี้หน้านี้ใช้ mock data ไปก่อน ภายหลังค่อยเปลี่ยนเป็นดึงข้อมูลจริงจาก API
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
                <DescriptionRoundedIcon />
              </Box>

              <Typography className={styles.actionOptionTitle}>
                ตรวจสอบเอกสารการเปิดรายวิชา
              </Typography>

              <Typography className={styles.actionOptionDescription}>
                ใช้สำหรับตรวจสอบรายการเอกสารขอเปิดรายวิชาของสาขานี้
                เข้าไปดูรายละเอียดเอกสาร และพิจารณาอนุมัติหรือไม่อนุมัติได้
                {selectedMajor
                  ? ` ขณะนี้มีรายการรอพิจารณา ${selectedMajor.pendingRequestCount} รายการ`
                  : ''}
              </Typography>

              <Button
                variant="contained"
                className={styles.actionOptionButton}
                onClick={handleGoToDeanCourseOpeningReviewList}
              >
                ไปหน้าตรวจสอบเอกสาร
              </Button>
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