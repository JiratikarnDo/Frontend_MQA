import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import styles from './subjectSelectorModal.module.css'

const inMajorSubjects = [
  {
    id: 1,
    courseCode: '04-10-102',
    courseName: 'วิทยาการคอมพิวเตอร์เบื้องต้น',
    credits: '3(3-0-6)',
  },
  {
    id: 2,
    courseCode: '04-22-205',
    courseName: 'โครงสร้างข้อมูล',
    credits: '3(2-2-5)',
  },
  {
    id: 3,
    courseCode: '04-22-301',
    courseName: 'การวิเคราะห์และออกแบบระบบ',
    credits: '3(2-2-5)',
  },
]

const externalMajorOptions = [
  'เทคโนโลยีสารสนเทศ',
  'วิทยาการข้อมูล',
  'การบัญชี',
]

const externalMajorSubjects = [
  {
    id: 11,
    majorName: 'เทคโนโลยีสารสนเทศ',
    courseCode: '06-11-201',
    courseName: 'เครือข่ายคอมพิวเตอร์',
    credits: '3(2-2-5)',
  },
  {
    id: 12,
    majorName: 'วิทยาการข้อมูล',
    courseCode: '06-31-202',
    courseName: 'สถิติสำหรับวิทยาการข้อมูล',
    credits: '3(3-0-6)',
  },
  {
    id: 13,
    majorName: 'การบัญชี',
    courseCode: '01-44-101',
    courseName: 'การบัญชีเบื้องต้น',
    credits: '3(3-0-6)',
  },
]

function SubjectSelectorModal({
  open,
  onClose,
  onSelectSubject,
  currentMajorName,
}) {
  const [activeTab, setActiveTab] = useState('inMajor')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedExternalMajor, setSelectedExternalMajor] = useState('')

  useEffect(() => {
    if (open) {
      setActiveTab('inMajor')
      setSearchKeyword('')
      setSelectedExternalMajor('')
    }
  }, [open])

  const filteredSubjects = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase()

    if (activeTab === 'inMajor') {
      return inMajorSubjects.filter((subject) => {
        const searchableText =
          `${subject.courseCode} ${subject.courseName}`.toLowerCase()

        return searchableText.includes(normalizedKeyword)
      })
    }

    return externalMajorSubjects.filter((subject) => {
      const searchableText =
        `${subject.courseCode} ${subject.courseName} ${subject.majorName}`.toLowerCase()

      const matchedMajor = selectedExternalMajor
        ? subject.majorName === selectedExternalMajor
        : true

      return matchedMajor && searchableText.includes(normalizedKeyword)
    })
  }, [activeTab, searchKeyword, selectedExternalMajor])

  const handleChangeTab = (_, nextTab) => {
    setActiveTab(nextTab)
    setSearchKeyword('')
    setSelectedExternalMajor('')
  }

  const handleSelectSubject = (subject) => {
    onSelectSubject(subject)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        className: styles.dialogPaper,
      }}
    >
      <DialogTitle className={styles.dialogTitle}>
        <Typography className={styles.titleText}>เลือกรายวิชา</Typography>

        <IconButton onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={styles.dialogContent}>
        <Tabs
          value={activeTab}
          onChange={handleChangeTab}
          className={styles.tabs}
        >
          <Tab value="inMajor" label="รายวิชาในสาขา" />
          <Tab value="externalMajor" label="รายวิชานอกสาขา" />
        </Tabs>

        <Box className={styles.filterSection}>
          {activeTab === 'inMajor' && (
            <Box className={styles.infoRow}>
              <Typography className={styles.infoLabel}>
                สาขาปัจจุบัน:
              </Typography>
              <Typography className={styles.infoValue}>
                {currentMajorName || '-'}
              </Typography>
            </Box>
          )}

          {activeTab === 'externalMajor' && (
            <TextField
              select
              label="เลือกสาขา"
              value={selectedExternalMajor}
              onChange={(event) => setSelectedExternalMajor(event.target.value)}
              fullWidth
            >
              <MenuItem value="">ทั้งหมด</MenuItem>
              {externalMajorOptions.map((majorName) => (
                <MenuItem key={majorName} value={majorName}>
                  {majorName}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            placeholder="พิมพ์ชื่อวิชา/รหัสวิชา เพื่อค้นหา"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box className={styles.subjectList}>
          {filteredSubjects.length > 0 ? (
            filteredSubjects.map((subject) => (
              <Box
                key={subject.id}
                component="button"
                type="button"
                className={styles.subjectCard}
                onClick={() => handleSelectSubject(subject)}
              >
                <Box className={styles.subjectCardTop}>
                  <Typography className={styles.subjectCode}>
                    {subject.courseCode}
                  </Typography>

                  {activeTab === 'externalMajor' && (
                    <Typography className={styles.subjectMajor}>
                      {subject.majorName}
                    </Typography>
                  )}
                </Box>

                <Typography className={styles.subjectName}>
                  {subject.courseName}
                </Typography>

                <Typography className={styles.subjectMeta}>
                  หน่วยกิต {subject.credits}
                </Typography>
              </Box>
            ))
          ) : (
            <Box className={styles.emptyState}>
              <Typography className={styles.emptyStateTitle}>
                ไม่พบรายวิชาที่ค้นหา
              </Typography>

              <Typography className={styles.emptyStateText}>
                ลองเปลี่ยนคำค้นหา หรือเลือกสาขาใหม่อีกครั้ง
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default SubjectSelectorModal