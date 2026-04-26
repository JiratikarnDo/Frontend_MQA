import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import EditCalendarRoundedIcon from '@mui/icons-material/EditCalendarRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useNavigate } from 'react-router-dom'
import styles from './documentSelectDialog.module.css'

function DocumentSelectDialog({ open, onClose, courseItem }) {
  const navigate = useNavigate()

  const handleNavigate = (path) => {
    onClose()
    navigate(path)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        className: styles.dialogPaper,
      }}
    >
      <DialogTitle className={styles.dialogTitleWrapper}>
        <Box className={styles.dialogTitleRow}>
          <Box className={styles.dialogTitleContent}>
            <Typography className={styles.dialogEyebrow}>
              เลือกเอกสารที่ต้องการจัดทำ
            </Typography>
            <Typography className={styles.dialogTitle}>
              {courseItem?.courseCode} {courseItem?.courseName}
            </Typography>
            <Typography className={styles.dialogDescription}>
              เลือกว่าจะเข้าไปจัดทำ มคอ.3 หรือ มคอ.5 ของรายวิชากลุ่มนี้จากตัวเลือกด้านล่าง
            </Typography>
          </Box>

          <Button
            onClick={onClose}
            className={styles.closeButton}
            startIcon={<CloseRoundedIcon />}
          >
            ปิด
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent className={styles.dialogContent}>
        <Box className={styles.courseMetaCard}>
          <Box className={styles.metaRow}>
            <Typography className={styles.metaLabel}>หลักสูตร</Typography>
            <Typography className={styles.metaValue}>{courseItem?.curriculumName}</Typography>
          </Box>
          <Box className={styles.metaRow}>
            <Typography className={styles.metaLabel}>สาขา</Typography>
            <Typography className={styles.metaValue}>{courseItem?.majorName}</Typography>
          </Box>
          <Box className={styles.metaRow}>
            <Typography className={styles.metaLabel}>ภาคการศึกษา</Typography>
            <Typography className={styles.metaValue}>
              {courseItem?.semester === 'summer'
                ? `ภาคฤดูร้อน/${courseItem?.academicYear}`
                : `ภาคการศึกษา ${courseItem?.semester}/${courseItem?.academicYear}`}
            </Typography>
          </Box>
          <Box className={styles.metaRow}>
            <Typography className={styles.metaLabel}>กลุ่มเรียน</Typography>
            <Typography className={styles.metaValue}>กลุ่ม {courseItem?.sectionNumber}</Typography>
          </Box>
        </Box>

        <Box className={styles.optionGrid}>
          <Box className={styles.optionCard}>
            <Box className={styles.optionIconBlue}>
              <EditCalendarRoundedIcon />
            </Box>

            <Typography className={styles.optionTitle}>
              กรอก มคอ.3
            </Typography>
            <Typography className={styles.optionDescription}>
              ใช้สำหรับจัดทำแผนการสอนและรายละเอียดรายวิชาก่อนเปิดภาคการศึกษา
            </Typography>

            <Button
              variant="contained"
              fullWidth
              startIcon={<DescriptionRoundedIcon />}
              className={styles.primaryButton}
              onClick={() => handleNavigate('/mqa3Insert-1')}
            >
              ไปหน้ากรอก มคอ.3
            </Button>
          </Box>

          <Box className={styles.optionCard}>
            <Box className={styles.optionIconIndigo}>
              <FactCheckRoundedIcon />
            </Box>

            <Typography className={styles.optionTitle}>
              กรอก มคอ.5
            </Typography>
            <Typography className={styles.optionDescription}>
              ใช้สำหรับสรุปผลการเรียนการสอนและผลลัพธ์หลังจบรายวิชาเมื่อเกรดออกแล้ว
            </Typography>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<DescriptionRoundedIcon />}
              className={styles.secondaryButton}
              onClick={() => handleNavigate('/mqa5Insert-1')}
            >
              ไปหน้ากรอก มคอ.5
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default DocumentSelectDialog