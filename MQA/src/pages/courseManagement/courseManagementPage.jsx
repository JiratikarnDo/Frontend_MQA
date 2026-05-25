import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
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

const COURSE_ASSIGNMENT_ENDPOINT = '/course-assignment'

const getAuthConfig = () => {
  const token = localStorage.getItem('mqa_token')
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} }
}

const normalizeText = (value) => String(value ?? '').trim()

const getResponseList = (data, keyList = []) => {
  if (Array.isArray(data)) return data
  for (const key of keyList) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}

const getErrorMessage = (error, fallbackMessage) => {
  const detail = error?.response?.data?.detail
  const message = error?.response?.data?.message
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(', ')
  return detail || message || fallbackMessage
}

function normalizeLevelFromApi(item) {
  const levelText = normalizeText(
    item?.level ??
      item?.education_level ??
      item?.educationLevel ??
      item?.degree_level ??
      item?.degreeLevel
  ).toLowerCase()

  const curriculumName = normalizeText(
    item?.curriculum_name ?? item?.curriculumName
  ).toLowerCase()

  if (['bachelor', 'master', 'doctoral'].includes(levelText)) return levelText

  if (
    levelText.includes('เอก') ||
    levelText.includes('doctoral') ||
    levelText.includes('phd') ||
    levelText === '1.1' ||
    levelText === '1.2' ||
    curriculumName.includes('ดุษฎีบัณฑิต') ||
    curriculumName.includes('ปริญญาเอก')
  ) {
    return 'doctoral'
  }

  if (
    levelText.includes('โท') ||
    levelText.includes('master') ||
    levelText === 'plana' ||
    levelText === 'plana2' ||
    levelText === 'planb' ||
    curriculumName.includes('มหาบัณฑิต') ||
    curriculumName.includes('ปริญญาโท')
  ) {
    return 'master'
  }

  return 'bachelor'
}

function getTeacherName(teacher) {
  if (!teacher) return ''

  if (typeof teacher === 'string') return normalizeText(teacher)

  return normalizeText(
    teacher.teacher_name ??
      teacher.teacherName ??
      teacher.name ??
      [teacher.prefixname, teacher.first_name, teacher.last_name]
        .filter(Boolean)
        .join(' ')
  )
}

function normalizeCourseRowFromApi(item) {
  const requestedCourseItemId =
    item?.requested_course_item_id ??
    item?.requestedCourseItemId ??
    item?.requested_course_itemId ??
    item?.id

  const assignedTeacherList = getResponseList(
    item?.assigned_teachers ?? item?.assignedTeachers
  )

  return {
    id: String(
      requestedCourseItemId ??
        `${item?.course_code ?? item?.courseCode ?? ''}-${item?.section_number ?? item?.sectionNumber ?? ''}`
    ),
    requestedCourseItemId,
    requestId: item?.request_id ?? item?.requestId ?? '',
    level: normalizeLevelFromApi(item),
    curriculumName: normalizeText(item?.curriculum_name ?? item?.curriculumName) || '-',
    majorName: normalizeText(item?.major_name ?? item?.majorName) || '-',
    semester: normalizeText(item?.semester) || '-',
    academicYear: normalizeText(item?.academic_year ?? item?.academicYear) || '-',
    yearLevel: normalizeText(item?.year_level ?? item?.yearLevel) || '-',
    courseId: item?.course_id ?? item?.courseId ?? '',
    courseCode: normalizeText(item?.course_code ?? item?.courseCode) || '-',
    courseName: normalizeText(item?.course_name ?? item?.courseName) || '-',
    sectionNumber:
      normalizeText(
        item?.section_number ??
          item?.sectionNumber ??
          item?.group_no ??
          item?.groupNo
      ) || '1',
    studentCount: Number(item?.student_count ?? item?.studentCount ?? 0),
    assignedTeachers: assignedTeacherList.map(getTeacherName).filter(Boolean),
    assignmentStatus: normalizeText(item?.assignment_status ?? item?.assignmentStatus),
    rawData: item,
  }
}

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
  const apiUrl = import.meta.env.VITE_API_URL || ''

  const [courseRows, setCourseRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [assignmentFilter, setAssignmentFilter] = useState('all')
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedCourseItem, setSelectedCourseItem] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchApprovedCourseRows = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await axios.get(
        `${apiUrl}${COURSE_ASSIGNMENT_ENDPOINT}/approved-courses`,
        {
          ...getAuthConfig(),
          params: {
            page: 1,
            limit: 100,
          },
        }
      )

      const approvedCourseList = getResponseList(response.data, [
        'items',
        'data',
        'results',
        'courses',
      ])

      setCourseRows(approvedCourseList.map(normalizeCourseRowFromApi))
    } catch (error) {
      console.error('Error fetching approved course rows:', error)
      setCourseRows([])
      setErrorMessage(
        getErrorMessage(
          error,
          'ไม่สามารถดึงรายวิชาที่อนุมัติเปิดสอนแล้วได้'
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [apiUrl])

  useEffect(() => {
    fetchApprovedCourseRows()
  }, [fetchApprovedCourseRows])

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
    return {
      approvedCourseCount: courseRows.length,
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
                  <TableCell className={styles.headCell}>
                    ระดับหลักสูตร
                  </TableCell>
                  <TableCell className={styles.headCell}>
                    ชั้นปี
                  </TableCell>
                  <TableCell className={`${styles.headCell} ${styles.courseCodeColumn}`}>
                    รหัสวิชา
                  </TableCell>
                  <TableCell className={styles.headCell}>
                    ชื่อรายวิชา
                  </TableCell>
                  <TableCell className={styles.headCell}>
                    กลุ่มที่ / นักศึกษา
                  </TableCell>
                  <TableCell className={styles.headCell}>
                    มอบหมายให้
                  </TableCell>
                  <TableCell className={styles.headCell}>
                    จัดการ
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {errorMessage && (
                  <TableRow>
                    <TableCell colSpan={7} className={styles.emptyTableCell}>
                      <Box className={styles.emptyState}>
                        <MenuBookRoundedIcon className={styles.emptyStateIcon} />
                        <Typography className={styles.emptyStateTitle}>
                          เกิดข้อผิดพลาด
                        </Typography>
                        <Typography className={styles.emptyStateDescription}>
                          {errorMessage}
                        </Typography>
                        <Button
                          variant="contained"
                          className={styles.primaryButton}
                          onClick={fetchApprovedCourseRows}
                        >
                          โหลดใหม่
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {!errorMessage && isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className={styles.emptyTableCell}>
                      <Box className={styles.emptyState}>
                        <MenuBookRoundedIcon className={styles.emptyStateIcon} />
                        <Typography className={styles.emptyStateTitle}>
                          กำลังโหลดรายวิชา
                        </Typography>
                        <Typography className={styles.emptyStateDescription}>
                          ระบบกำลังดึงรายวิชาที่ผ่านการอนุมัติเปิดสอนแล้วจาก API
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {!errorMessage &&
                  !isLoading &&
                  filteredCourseRows.map((item) => {
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

                        <TableCell className={`${styles.bodyCell} ${styles.courseCodeColumn}`}>
                          <Typography
                            className={`${styles.codeText} ${styles.noWrapText}`}
                            title={item.courseCode}
                          >
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
                            disabled={isLoading}
                          >
                            {item.assignedTeachers.length > 0
                              ? 'แก้ไขผู้สอน'
                              : 'เพิ่มอาจารย์ผู้สอน'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}

                {!errorMessage && !isLoading && !filteredCourseRows.length && (
                  <TableRow>
                    <TableCell colSpan={7} className={styles.emptyTableCell}>
                      <Box className={styles.emptyState}>
                        <MenuBookRoundedIcon className={styles.emptyStateIcon} />
                        <Typography className={styles.emptyStateTitle}>
                          ไม่พบรายวิชาที่ตรงกับเงื่อนไข
                        </Typography>
                        <Typography className={styles.emptyStateDescription}>
                          ยังไม่มีรายวิชาที่ผ่านการอนุมัติเปิดสอนแล้วในสาขาของคุณ
                          หรือลองเปลี่ยนคำค้นหา/ตัวกรองใหม่อีกครั้ง
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