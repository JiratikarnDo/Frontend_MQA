import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded'
import DocumentSelectDialog from './documentSelectDialog/documentSelectDialog'
import styles from './myAssignedCoursesPage.module.css'

const mockAssignedCourseRows = [
  {
    id: 'assigned-001',
    level: 'bachelor',
    curriculumName: 'หลักสูตรบริหารธุรกิจบัณฑิต',
    majorName: 'ระบบสารสนเทศทางธุรกิจ',
    semester: '1',
    academicYear: '2569',
    yearLevel: '3',
    courseCode: 'BIS3301',
    courseName: 'การวิเคราะห์และออกแบบระบบ',
    sectionNumber: '1',
    studentCount: 38,
    assignedTeacher: 'อาจารย์ธนชัย บัวรุ่ง',
    mqa3Status: 'draft',
    mqa5Status: 'waitingGrade',
  },
  {
    id: 'assigned-002',
    level: 'bachelor',
    curriculumName: 'หลักสูตรบริหารธุรกิจบัณฑิต',
    majorName: 'ระบบสารสนเทศทางธุรกิจ',
    semester: '1',
    academicYear: '2569',
    yearLevel: '2',
    courseCode: 'BIS2204',
    courseName: 'การจัดการฐานข้อมูล',
    sectionNumber: '2',
    studentCount: 42,
    assignedTeacher: 'อาจารย์ธนชัย บัวรุ่ง',
    mqa3Status: 'notStarted',
    mqa5Status: 'waitingGrade',
  },
  {
    id: 'assigned-003',
    level: 'master',
    curriculumName: 'หลักสูตรบริหารธุรกิจมหาบัณฑิต',
    majorName: 'การจัดการเทคโนโลยีสารสนเทศ',
    semester: '2',
    academicYear: '2568',
    yearLevel: '1',
    courseCode: 'MIT6102',
    courseName: 'การจัดการโครงการดิจิทัล',
    sectionNumber: '1',
    studentCount: 18,
    assignedTeacher: 'อาจารย์ธนชัย บัวรุ่ง',
    mqa3Status: 'submitted',
    mqa5Status: 'draft',
  },
  {
    id: 'assigned-004',
    level: 'doctoral',
    curriculumName: 'หลักสูตรปรัชญาดุษฎีบัณฑิต',
    majorName: 'เทคโนโลยีสารสนเทศ',
    semester: '2',
    academicYear: '2568',
    yearLevel: '1',
    courseCode: 'ITD8103',
    courseName: 'สัมมนาการวิจัยขั้นสูง',
    sectionNumber: '1',
    studentCount: 9,
    assignedTeacher: 'อาจารย์ธนชัย บัวรุ่ง',
    mqa3Status: 'submitted',
    mqa5Status: 'notStarted',
  },
  {
    id: 'assigned-005',
    level: 'bachelor',
    curriculumName: 'หลักสูตรบริหารธุรกิจบัณฑิต',
    majorName: 'ระบบสารสนเทศทางธุรกิจ',
    semester: 'summer',
    academicYear: '2568',
    yearLevel: '4',
    courseCode: 'BIS4408',
    courseName: 'โครงงานระบบสารสนเทศทางธุรกิจ',
    sectionNumber: '1',
    studentCount: 24,
    assignedTeacher: 'อาจารย์ธนชัย บัวรุ่ง',
    mqa3Status: 'submitted',
    mqa5Status: 'submitted',
  },
]

function getLevelLabel(level) {
  if (level === 'bachelor') return 'ปริญญาตรี'
  if (level === 'master') return 'ปริญญาโท'
  if (level === 'doctoral') return 'ปริญญาเอก'
  return '-'
}

function getLevelBadgeClassName(level) {
  if (level === 'bachelor') return styles.levelBadgeBachelor
  if (level === 'master') return styles.levelBadgeMaster
  if (level === 'doctoral') return styles.levelBadgeDoctoral
  return ''
}

function getSemesterLabel(semester) {
  if (semester === 'summer') return 'ภาคฤดูร้อน'
  return `ภาคการศึกษา ${semester}`
}

function getDocumentStatusConfig(status) {
  if (status === 'submitted') {
    return {
      label: 'ส่งแล้ว',
      className: styles.statusSubmitted,
    }
  }

  if (status === 'draft') {
    return {
      label: 'แบบร่าง',
      className: styles.statusDraft,
    }
  }

  if (status === 'waitingGrade') {
    return {
      label: 'รอหลังเกรดออก',
      className: styles.statusWaiting,
    }
  }

  return {
    label: 'ยังไม่เริ่ม',
    className: styles.statusPending,
  }
}

function MyAssignedCoursesPage() {
  const [courseRows] = useState(mockAssignedCourseRows)
  const [searchText, setSearchText] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [documentFilter, setDocumentFilter] = useState('all')
  const [selectedCourseItem, setSelectedCourseItem] = useState(null)
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)

  const filteredCourseRows = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLowerCase()

    return courseRows.filter((item) => {
      const matchedSemester =
        semesterFilter === 'all' ? true : item.semester === semesterFilter

      const matchedDocument =
        documentFilter === 'all'
          ? true
          : documentFilter === 'mqa3Pending'
            ? item.mqa3Status === 'notStarted' || item.mqa3Status === 'draft'
            : documentFilter === 'mqa5Pending'
              ? item.mqa5Status === 'notStarted' || item.mqa5Status === 'draft'
              : documentFilter === 'completed'
                ? item.mqa3Status === 'submitted' && item.mqa5Status === 'submitted'
                : true

      const matchedSearch =
        normalizedSearchText.length === 0 ||
        item.courseCode.toLowerCase().includes(normalizedSearchText) ||
        item.courseName.toLowerCase().includes(normalizedSearchText) ||
        item.curriculumName.toLowerCase().includes(normalizedSearchText) ||
        item.majorName.toLowerCase().includes(normalizedSearchText) ||
        getLevelLabel(item.level).toLowerCase().includes(normalizedSearchText) ||
        item.assignedTeacher.toLowerCase().includes(normalizedSearchText)

      return matchedSemester && matchedDocument && matchedSearch
    })
  }, [courseRows, documentFilter, searchText, semesterFilter])

  const handleOpenDocumentDialog = (courseItem) => {
    setSelectedCourseItem(courseItem)
    setIsDocumentDialogOpen(true)
  }

  const handleCloseDocumentDialog = () => {
    setIsDocumentDialogOpen(false)
    setSelectedCourseItem(null)
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>
              รายวิชาที่ได้รับมอบหมาย
            </Typography>
            <Typography className={styles.pageDescription}>
              หน้านี้ใช้สำหรับแสดงรายวิชาทั้งหมดที่อาจารย์ได้รับมอบหมายให้รับผิดชอบในแต่ละภาคการศึกษา
              เพื่อเลือกเข้าไปจัดทำเอกสาร มคอ.3 และ มคอ.5 ของรายวิชานั้นได้จากหน้ารายการเดียว
            </Typography>
          </Box>
        </Box>

        <Box className={styles.filterCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>
                ค้นหาและกรองรายการ
              </Typography>
              <Typography className={styles.sectionDescription}>
                สามารถค้นหาจากรหัสวิชา ชื่อรายวิชา หลักสูตร สาขา หรือชื่ออาจารย์
                และกรองตามภาคการศึกษาหรือสถานะการจัดทำเอกสารได้
              </Typography>
            </Box>
          </Box>

          <Box className={styles.filterGrid}>
            <TextField
              fullWidth
              label="ค้นหารายวิชา"
              placeholder="ค้นหาจากรหัสวิชา / ชื่อรายวิชา / หลักสูตร / สาขา"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              fullWidth
              label="ภาคการศึกษา"
              value={semesterFilter}
              onChange={(event) => setSemesterFilter(event.target.value)}
            >
              <MenuItem value="all">ทั้งหมด</MenuItem>
              <MenuItem value="1">ภาคการศึกษา 1</MenuItem>
              <MenuItem value="2">ภาคการศึกษา 2</MenuItem>
              <MenuItem value="summer">ภาคฤดูร้อน</MenuItem>
            </TextField>

            <TextField
              select
              fullWidth
              label="สถานะเอกสาร"
              value={documentFilter}
              onChange={(event) => setDocumentFilter(event.target.value)}
            >
              <MenuItem value="all">ทั้งหมด</MenuItem>
              <MenuItem value="mqa3Pending">มคอ.3 ที่ยังต้องดำเนินการ</MenuItem>
              <MenuItem value="mqa5Pending">มคอ.5 ที่ยังต้องดำเนินการ</MenuItem>
              <MenuItem value="completed">จัดทำครบแล้ว</MenuItem>
            </TextField>
          </Box>
        </Box>

        <Box className={styles.listCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>
                รายการรายวิชาที่ได้รับมอบหมายทั้งหมด
              </Typography>
              <Typography className={styles.sectionDescription}>
                กดปุ่มเลือกเอกสารเพื่อเปิดตัวเลือกสำหรับจัดทำ มคอ.3 หรือ มคอ.5 ของรายวิชาที่ต้องการ
              </Typography>
            </Box>

            <Chip
              label={`พบ ${filteredCourseRows.length} รายการ`}
              className={styles.resultChip}
            />
          </Box>

          <TableContainer className={styles.tableContainer}>
            <Table className={styles.table}>
              <TableHead>
                <TableRow className={styles.tableHeadRow}>
                  <TableCell className={styles.headCell}>ระดับหลักสูตร</TableCell>
                  <TableCell className={styles.headCell}>ชั้นปี</TableCell>
                  <TableCell className={styles.headCell}>รหัสวิชา</TableCell>
                  <TableCell className={styles.headCell}>ชื่อรายวิชา</TableCell>
                  <TableCell className={styles.headCell}>กลุ่มที่ / นักศึกษา</TableCell>
                  <TableCell className={styles.headCell}>สถานะเอกสาร</TableCell>
                  <TableCell className={styles.headCell}>จัดการ</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredCourseRows.map((item) => {
                  const mqa3Status = getDocumentStatusConfig(item.mqa3Status)
                  const mqa5Status = getDocumentStatusConfig(item.mqa5Status)

                  return (
                    <TableRow key={item.id} className={styles.tableBodyRow}>
                      <TableCell className={styles.bodyCell}>
                        <Box
                          className={`${styles.levelBadge} ${getLevelBadgeClassName(item.level)}`}
                        >
                          <SchoolRoundedIcon fontSize="small" />
                          <span>{getLevelLabel(item.level)}</span>
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Typography className={styles.primaryText}>
                          ชั้นปี {item.yearLevel}
                        </Typography>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Typography className={styles.codeText}>
                          {item.courseCode}
                        </Typography>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.courseInfoBlock}>
                          <Typography className={styles.courseName}>
                            {item.courseName}
                          </Typography>
                          <Typography className={styles.courseMeta}>
                            {item.curriculumName} • สาขา{item.majorName} • {getSemesterLabel(item.semester)}/{item.academicYear}
                          </Typography>
                          <Typography className={styles.teacherMeta}>
                            ผู้รับผิดชอบรายวิชา: {item.assignedTeacher}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.groupStudentInfo}>
                          <Typography className={styles.primaryText}>
                            กลุ่ม {item.sectionNumber}
                          </Typography>
                          <Box className={styles.studentCountPill}>
                            {item.studentCount} คน
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.documentStatusCell}>
                          <Box className={styles.documentStatusItem}>
                            <Typography className={styles.documentLabel}>
                              มคอ.3
                            </Typography>
                            <Chip
                              label={mqa3Status.label}
                              className={mqa3Status.className}
                              size="small"
                            />
                          </Box>

                          <Box className={styles.documentStatusItem}>
                            <Typography className={styles.documentLabel}>
                              มคอ.5
                            </Typography>
                            <Chip
                              label={mqa5Status.label}
                              className={mqa5Status.className}
                              size="small"
                            />
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Button
                          variant="contained"
                          startIcon={<AssignmentTurnedInRoundedIcon />}
                          className={styles.primaryButton}
                          onClick={() => handleOpenDocumentDialog(item)}
                        >
                          เลือกเอกสาร
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {!filteredCourseRows.length && (
                  <TableRow>
                    <TableCell colSpan={7} className={styles.emptyTableCell}>
                      <Box className={styles.emptyState}>
                        <DescriptionRoundedIcon className={styles.emptyStateIcon} />
                        <Typography className={styles.emptyStateTitle}>
                          ไม่พบรายวิชาที่ตรงกับเงื่อนไข
                        </Typography>
                        <Typography className={styles.emptyStateDescription}>
                          ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองใหม่อีกครั้ง
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      <DocumentSelectDialog
        open={isDocumentDialogOpen}
        onClose={handleCloseDocumentDialog}
        courseItem={selectedCourseItem}
      />
    </Box>
  )
}

export default MyAssignedCoursesPage