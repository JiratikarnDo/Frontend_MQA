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
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import TeacherAssignModal from './teacherAssignModal/teacherAssignModal'
import styles from './courseManagementPage.module.css'

const initialApprovedCourseRows = [
  {
    id: 'row-001',
    level: 'bachelor',
    curriculumName: 'หลักสูตรวิทยาศาสตรบัณฑิต',
    majorName: 'วิทยาการคอมพิวเตอร์',
    semester: '1',
    academicYear: '2569',
    yearLevel: '1',
    courseCode: 'CS101',
    courseName: 'พื้นฐานการเขียนโปรแกรม',
    sectionNumber: '1',
    studentCount: 45,
    assignedTeachers: ['อาจารย์ธนกฤต วัฒนกิจ'],
  },
  {
    id: 'row-002',
    level: 'bachelor',
    curriculumName: 'หลักสูตรวิทยาศาสตรบัณฑิต',
    majorName: 'วิทยาการคอมพิวเตอร์',
    semester: '1',
    academicYear: '2569',
    yearLevel: '1',
    courseCode: 'CS101',
    courseName: 'พื้นฐานการเขียนโปรแกรม',
    sectionNumber: '2',
    studentCount: 42,
    assignedTeachers: [],
  },
  {
    id: 'row-003',
    level: 'bachelor',
    curriculumName: 'หลักสูตรวิทยาศาสตรบัณฑิต',
    majorName: 'เทคโนโลยีมัลติมีเดีย',
    semester: '1',
    academicYear: '2569',
    yearLevel: '2',
    courseCode: 'MMT2204',
    courseName: 'การถ่ายภาพเพื่อการสื่อสาร',
    sectionNumber: '1',
    studentCount: 38,
    assignedTeachers: ['อาจารย์พิมพ์ชนก ศรีสว่าง', 'อาจารย์กิตติพงษ์ จันทร์ดี'],
  },
  {
    id: 'row-004',
    level: 'master',
    curriculumName: 'หลักสูตรวิทยาศาสตรมหาบัณฑิต',
    majorName: 'วิทยาการคอมพิวเตอร์',
    semester: '1',
    academicYear: '2569',
    yearLevel: '1',
    courseCode: 'CSM601',
    courseName: 'การวิเคราะห์ข้อมูลขั้นสูง',
    sectionNumber: '1',
    studentCount: 18,
    assignedTeachers: ['อาจารย์ณัฐพงศ์ วรวิทย์'],
  },
  {
    id: 'row-005',
    level: 'master',
    curriculumName: 'หลักสูตรวิทยาศาสตรมหาบัณฑิต',
    majorName: 'วิทยาการคอมพิวเตอร์',
    semester: '1',
    academicYear: '2569',
    yearLevel: '2',
    courseCode: 'CSM702',
    courseName: 'สัมมนาประเด็นพิเศษทางคอมพิวเตอร์',
    sectionNumber: '1',
    studentCount: 12,
    assignedTeachers: [],
  },
  {
    id: 'row-006',
    level: 'doctoral',
    curriculumName: 'หลักสูตรปรัชญาดุษฎีบัณฑิต',
    majorName: 'เทคโนโลยีสารสนเทศ',
    semester: '1',
    academicYear: '2569',
    yearLevel: '1',
    courseCode: 'ITD801',
    courseName: 'ระเบียบวิธีวิจัยขั้นสูง',
    sectionNumber: '1',
    studentCount: 10,
    assignedTeachers: ['อาจารย์วรกร สุขเจริญ', 'อาจารย์นภัสสร พูลทรัพย์'],
  },
  {
    id: 'row-007',
    level: 'doctoral',
    curriculumName: 'หลักสูตรปรัชญาดุษฎีบัณฑิต',
    majorName: 'เทคโนโลยีสารสนเทศ',
    semester: '1',
    academicYear: '2569',
    yearLevel: '2',
    courseCode: 'ITD902',
    courseName: 'หัวข้อพิเศษด้านระบบอัจฉริยะ',
    sectionNumber: '1',
    studentCount: 8,
    assignedTeachers: [],
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

function getAssignmentStatus(item) {
  if (item.assignedTeachers.length > 0) {
    return {
      label: 'มอบหมายแล้ว',
      className: styles.assignmentStatusAssigned,
    }
  }

  return {
    label: 'ยังไม่ได้มอบหมาย',
      className: styles.assignmentStatusPending,
  }
}

function CourseManagementPage() {
  const [courseRows, setCourseRows] = useState(initialApprovedCourseRows)
  const [searchText, setSearchText] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [assignmentFilter, setAssignmentFilter] = useState('all')
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedCourseItem, setSelectedCourseItem] = useState(null)

  const filteredCourseRows = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLowerCase()

    return courseRows.filter((item) => {
      const matchedLevel =
        levelFilter === 'all' ? true : item.level === levelFilter

      const matchedAssignment =
        assignmentFilter === 'all'
          ? true
          : assignmentFilter === 'assigned'
            ? item.assignedTeachers.length > 0
            : item.assignedTeachers.length === 0

      const matchedSearch =
        normalizedSearchText.length === 0 ||
        item.courseCode.toLowerCase().includes(normalizedSearchText) ||
        item.courseName.toLowerCase().includes(normalizedSearchText) ||
        item.majorName.toLowerCase().includes(normalizedSearchText) ||
        item.curriculumName.toLowerCase().includes(normalizedSearchText) ||
        getLevelLabel(item.level).toLowerCase().includes(normalizedSearchText) ||
        item.assignedTeachers.some((teacherName) =>
          teacherName.toLowerCase().includes(normalizedSearchText)
        )

      return matchedLevel && matchedAssignment && matchedSearch
    })
  }, [assignmentFilter, courseRows, levelFilter, searchText])

  const pageSummary = useMemo(() => {
    const approvedCourseCount = new Set(courseRows.map((item) => item.courseCode)).size

    return {
      approvedCourseCount,
    }
  }, [courseRows])

  const handleOpenAssignModal = (courseItem) => {
    setSelectedCourseItem(courseItem)
    setIsAssignModalOpen(true)
  }

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false)
    setSelectedCourseItem(null)
  }

  const handleSaveAssignedTeachers = (selectedTeacherNames) => {
    if (!selectedCourseItem) return

    setCourseRows((prev) =>
      prev.map((item) =>
        item.id === selectedCourseItem.id
          ? {
              ...item,
              assignedTeachers: selectedTeacherNames,
            }
          : item
      )
    )

    handleCloseAssignModal()
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>
              จัดการรายวิชาที่อนุมัติเปิดสอนแล้ว
            </Typography>
            <Typography className={styles.pageDescription}>
              หน้านี้ใช้สำหรับแสดงรายวิชาที่ผ่านการอนุมัติเปิดสอนแล้วทั้งหมด
              เพื่อให้หัวหน้าสาขาสามารถตรวจสอบข้อมูลรายวิชาแต่ละกลุ่ม
              และมอบหมายอาจารย์ผู้รับผิดชอบรายวิชาในขั้นตอนถัดไปก่อนจัดทำเอกสาร
              มคอ.
            </Typography>
          </Box>
        </Box>

        <Box className={styles.summaryGrid}>
          <Box className={styles.summaryCard}>
            <Box className={styles.summaryIconBlue}>
              <MenuBookRoundedIcon />
            </Box>
            <Box>
              <Typography className={styles.summaryLabel}>
                รายวิชาที่อนุมัติแล้ว
              </Typography>
              <Typography className={styles.summaryValue}>
                {pageSummary.approvedCourseCount}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box className={styles.filterCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>
                ค้นหาและกรองรายการ
              </Typography>
              <Typography className={styles.sectionDescription}>
                สามารถค้นหาจากรหัสวิชา ชื่อรายวิชา หลักสูตร สาขา
                หรือชื่ออาจารย์ที่ถูกมอบหมายแล้ว และกรองตามระดับหลักสูตรหรือสถานะการมอบหมายได้
              </Typography>
            </Box>
          </Box>

          <Box className={styles.filterGrid}>
            <TextField
              fullWidth
              label="ค้นหารายวิชา"
              placeholder="ค้นหาจากรหัสวิชา / ชื่อรายวิชา / หลักสูตร / สาขา / อาจารย์"
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
              label="ระดับหลักสูตร"
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
            >
              <MenuItem value="all">ทั้งหมด</MenuItem>
              <MenuItem value="bachelor">ปริญญาตรี</MenuItem>
              <MenuItem value="master">ปริญญาโท</MenuItem>
              <MenuItem value="doctoral">ปริญญาเอก</MenuItem>
            </TextField>

            <TextField
              select
              fullWidth
              label="สถานะการมอบหมาย"
              value={assignmentFilter}
              onChange={(event) => setAssignmentFilter(event.target.value)}
            >
              <MenuItem value="all">ทั้งหมด</MenuItem>
              <MenuItem value="assigned">มอบหมายแล้ว</MenuItem>
              <MenuItem value="pending">ยังไม่ได้มอบหมาย</MenuItem>
            </TextField>
          </Box>
        </Box>

        <Box className={styles.listCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>
                รายการรายวิชาที่อนุมัติเปิดสอนแล้ว
              </Typography>
              <Typography className={styles.sectionDescription}>
                สามารถกดเพิ่มหรือแก้ไขอาจารย์ผู้สอนของแต่ละกลุ่มได้จากปุ่มด้านขวา
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
                  <TableCell className={styles.headCell}>มอบหมายให้</TableCell>
                  <TableCell className={styles.headCell}>จัดการ</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredCourseRows.map((item) => {
                  const assignmentStatus = getAssignmentStatus(item)

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
                            {item.curriculumName} • สาขา{item.majorName} • ภาคการศึกษา{' '}
                            {item.semester}/{item.academicYear}
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
                        <Box className={styles.assignmentCell}>
                          <Chip
                            label={assignmentStatus.label}
                            className={assignmentStatus.className}
                            size="small"
                          />

                          {item.assignedTeachers.length > 0 ? (
                            <Box className={styles.teacherChipList}>
                              {item.assignedTeachers.map((teacherName) => (
                                <Chip
                                  key={teacherName}
                                  label={teacherName}
                                  className={styles.teacherChip}
                                  size="small"
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography className={styles.unassignedText}>
                              ยังไม่มีอาจารย์ผู้รับผิดชอบรายวิชากลุ่มนี้
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Button
                          variant={item.assignedTeachers.length > 0 ? 'outlined' : 'contained'}
                          startIcon={
                            item.assignedTeachers.length > 0 ? (
                              <EditRoundedIcon />
                            ) : (
                              <PersonAddAlt1RoundedIcon />
                            )
                          }
                          className={
                            item.assignedTeachers.length > 0
                              ? styles.outlinedButton
                              : styles.primaryButton
                          }
                          onClick={() => handleOpenAssignModal(item)}
                        >
                          {item.assignedTeachers.length > 0
                            ? 'แก้ไขผู้สอน'
                            : 'เพิ่มอาจารย์ผู้สอน'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {!filteredCourseRows.length && (
                  <TableRow>
                    <TableCell colSpan={7} className={styles.emptyTableCell}>
                      <Box className={styles.emptyState}>
                        <MenuBookRoundedIcon className={styles.emptyStateIcon} />
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

      <TeacherAssignModal
        open={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        courseItem={selectedCourseItem}
        onSave={handleSaveAssignedTeachers}
      />
    </Box>
  )
}

export default CourseManagementPage