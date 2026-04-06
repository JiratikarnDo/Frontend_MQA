import { useMemo } from 'react'
import {
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import { useNavigate } from 'react-router-dom'
import styles from './mqaOverviewPage.module.css'

const mockCurrentDate = '2026-09-10'

const currentRound = {
  semester: '1',
  academicYear: '2569',
}

const mockDeadlineRows = [
  {
    id: 'deadline-mqa3-2569-1',
    documentType: 'mqa3',
    semester: '1',
    academicYear: '2569',
    openDate: '2026-04-01',
    dueDate: '2026-05-15',
    dueTime: '23:59',
  },
  {
    id: 'deadline-mqa5-2569-1',
    documentType: 'mqa5',
    semester: '1',
    academicYear: '2569',
    openDate: '2026-08-15',
    dueDate: '2026-09-15',
    dueTime: '23:59',
  },
]

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
    mqa3Status: 'submitted',
    mqa3SubmittedAt: '2026-05-10T10:30',
    mqa5Status: 'submitted',
    mqa5SubmittedAt: '2026-09-09T15:45',
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
    mqa3SubmittedAt: null,
    mqa5Status: 'waitingGrade',
    mqa5SubmittedAt: null,
  },
  {
    id: 'assigned-003',
    level: 'bachelor',
    curriculumName: 'หลักสูตรบริหารธุรกิจบัณฑิต',
    majorName: 'ระบบสารสนเทศทางธุรกิจ',
    semester: '1',
    academicYear: '2569',
    yearLevel: '4',
    courseCode: 'BIS4408',
    courseName: 'โครงงานระบบสารสนเทศทางธุรกิจ',
    sectionNumber: '1',
    studentCount: 24,
    assignedTeacher: 'อาจารย์ธนชัย บัวรุ่ง',
    mqa3Status: 'submitted',
    mqa3SubmittedAt: '2026-05-18T09:15',
    mqa5Status: 'draft',
    mqa5SubmittedAt: null,
  },
  {
    id: 'assigned-004',
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
    mqa3SubmittedAt: '2026-01-20T13:20',
    mqa5Status: 'draft',
    mqa5SubmittedAt: null,
  },
]

function createLocalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatThaiDate(dateString) {
  const thaiMonthNames = [
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.',
  ]

  const [year, month, day] = dateString.split('-').map(Number)

  return `${day} ${thaiMonthNames[month - 1]} ${year + 543}`
}

function formatThaiDateTime(dateTimeString) {
  if (!dateTimeString) return '-'

  const [datePart, timePart = '00:00'] = dateTimeString.split('T')
  const [hour = '00', minute = '00'] = timePart.split(':')

  return `${formatThaiDate(datePart)} • ${hour}:${minute} น.`
}

function formatThaiDateWithTime(dateString, timeString = '00:00') {
  const [hour = '00', minute = '00'] = timeString.split(':')
  return `${formatThaiDate(dateString)} • ${hour}:${minute} น.`
}

function getDaysDiff(fromDateString, toDateString) {
  const fromDate = createLocalDate(fromDateString)
  const toDate = createLocalDate(toDateString)
  const diffTime = toDate.getTime() - fromDate.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getDurationDays(openDate, dueDate) {
  const openDateObject = createLocalDate(openDate)
  const dueDateObject = createLocalDate(dueDate)
  const diffTime = dueDateObject.getTime() - openDateObject.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

function getSubmissionDelayDays(submittedAt, dueDate) {
  if (!submittedAt) return 0

  const submittedDate = createLocalDate(submittedAt.split('T')[0])
  const dueDateObject = createLocalDate(dueDate)
  const diffTime = submittedDate.getTime() - dueDateObject.getTime()

  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getDocumentTypeLabel(documentType) {
  if (documentType === 'mqa3') return 'มคอ.3'
  if (documentType === 'mqa5') return 'มคอ.5'
  return '-'
}

function getDeadlineStatusConfig(deadlineRow) {
  const daysUntilOpen = getDaysDiff(mockCurrentDate, deadlineRow.openDate)
  const daysUntilDue = getDaysDiff(mockCurrentDate, deadlineRow.dueDate)

  if (daysUntilOpen > 0) {
    return {
      label: 'ยังไม่เปิดรอบ',
      className: styles.deadlineStatusUpcoming,
      helperText: `มีเวลาจัดทำ ${getDurationDays(deadlineRow.openDate, deadlineRow.dueDate)} วัน`,
    }
  }

  if (daysUntilDue < 0) {
    return {
      label: 'เลยกำหนด',
      className: styles.deadlineStatusOverdue,
      helperText: `มีเวลาจัดทำ ${getDurationDays(deadlineRow.openDate, deadlineRow.dueDate)} วัน`,
    }
  }

  if (daysUntilDue <= 7) {
    return {
      label: 'ใกล้ครบกำหนด',
      className: styles.deadlineStatusUrgent,
      helperText: `มีเวลาจัดทำ ${getDurationDays(deadlineRow.openDate, deadlineRow.dueDate)} วัน`,
    }
  }

  return {
    label: 'กำลังเปิดดำเนินการ',
    className: styles.deadlineStatusOpen,
    helperText: `มีเวลาจัดทำ ${getDurationDays(deadlineRow.openDate, deadlineRow.dueDate)} วัน`,
  }
}

function getDocumentStatusChipConfig(status, submittedAt, dueDate) {
  if (status === 'submitted' && submittedAt) {
    const delayDays = getSubmissionDelayDays(submittedAt, dueDate)

    if (delayDays > 0) {
      return {
        label: 'ส่งล่าช้า',
        className: styles.statusLate,
      }
    }

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

function getDocumentDetailText({ documentType, status, submittedAt, dueDate }) {
  const documentLabel = getDocumentTypeLabel(documentType)
  const delayDays = submittedAt ? getSubmissionDelayDays(submittedAt, dueDate) : 0
  const daysUntilDue = getDaysDiff(mockCurrentDate, dueDate)

  if (status === 'submitted' && submittedAt) {
    if (delayDays > 0) {
      return `ส่ง ${documentLabel} เมื่อ ${formatThaiDateTime(submittedAt)} • ช้ากว่ากำหนด ${delayDays} วัน`
    }

    return `ส่ง ${documentLabel} เมื่อ ${formatThaiDateTime(submittedAt)}`
  }

  if (status === 'waitingGrade') {
    return `รอผลการเรียนก่อนจึงจะส่ง ${documentLabel} ได้`
  }

  if (status === 'draft') {
    if (daysUntilDue < 0) {
      return `บันทึกแบบร่างไว้แล้ว แต่เลยกำหนดส่งแล้ว`
    }

    return `บันทึกแบบร่างไว้แล้ว ยังไม่ได้ส่ง`
  }

  if (daysUntilDue < 0) {
    return `ยังไม่ได้เริ่มจัดทำ และเลยกำหนดส่งแล้ว`
  }

  return `ยังไม่ได้เริ่มจัดทำ`
}

function MqaOverviewPage() {
  const navigate = useNavigate()

  const currentRoundCourseRows = useMemo(() => {
    return mockAssignedCourseRows.filter(
      (item) =>
        item.semester === currentRound.semester &&
        item.academicYear === currentRound.academicYear
    )
  }, [])

  const currentRoundDeadlineRows = useMemo(() => {
    return mockDeadlineRows.filter(
      (item) =>
        item.semester === currentRound.semester &&
        item.academicYear === currentRound.academicYear
    )
  }, [])

  const currentRoundDeadlineMap = useMemo(() => {
    const deadlineMap = {}

    currentRoundDeadlineRows.forEach((item) => {
      deadlineMap[item.documentType] = item
    })

    return deadlineMap
  }, [currentRoundDeadlineRows])

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box className={styles.headerTopRow}>
            <Box className={styles.headerContent}>
              <Typography className={styles.pageEyebrow}>
                หน้าหลักสำหรับอาจารย์ผู้รับผิดชอบรายวิชา
              </Typography>

              <Typography className={styles.pageTitle}>
                ภาพรวมการจัดทำเอกสาร มคอ.
              </Typography>

              <Typography className={styles.pageDescription}>
                หน้านี้ใช้สำหรับแสดงสถานะเอกสารของรายวิชาในรอบการศึกษาปัจจุบัน
                โดยแสดง มคอ.3 และ มคอ.5 ของแต่ละวิชาในแถวเดียวกัน
                เพื่อให้อ่านง่ายและดูเหมือนหน้าจัดทำเอกสารที่คุณใช้อยู่
              </Typography>
            </Box>

            <Box className={styles.headerActionBlock}>
              <Chip
                label={`ภาคการศึกษา ${currentRound.semester} / ปีการศึกษา ${currentRound.academicYear}`}
                className={styles.roundChip}
              />

              <Button
                variant="contained"
                endIcon={<ArrowForwardRoundedIcon />}
                className={styles.headerActionButton}
                onClick={() => navigate('/myAssignedCourses')}
              >
                ไปหน้ารายวิชาที่ได้รับมอบหมาย
              </Button>
            </Box>
          </Box>
        </Box>

        <Box className={styles.deadlineSectionCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>
                กำหนดเวลาการจัดทำเอกสารในรอบปัจจุบัน
              </Typography>
              <Typography className={styles.sectionDescription}>
                แสดงวันและเวลาสิ้นสุดของแต่ละเอกสาร พร้อมจำนวนวันที่เปิดให้จัดทำ
              </Typography>
            </Box>
          </Box>

          <Box className={styles.deadlineList}>
            {currentRoundDeadlineRows.map((deadlineRow) => {
              const deadlineStatus = getDeadlineStatusConfig(deadlineRow)

              return (
                <Box key={deadlineRow.id} className={styles.deadlineRow}>
                  <Box className={styles.deadlineRowLeft}>
                    <Box className={styles.deadlineIcon}>
                      <CalendarMonthRoundedIcon />
                    </Box>

                    <Box className={styles.deadlineInfoBlock}>
                      <Box className={styles.deadlineTitleRow}>
                        <Box
                          className={`${styles.documentTypeBadge} ${
                            deadlineRow.documentType === 'mqa3'
                              ? styles.documentTypeBadgeMqa3
                              : styles.documentTypeBadgeMqa5
                          }`}
                        >
                          {getDocumentTypeLabel(deadlineRow.documentType)}
                        </Box>

                        <Chip
                          label={deadlineStatus.label}
                          className={deadlineStatus.className}
                          size="small"
                        />
                      </Box>

                      <Typography className={styles.deadlineMainText}>
                        หมดเวลาทำ: {formatThaiDateWithTime(deadlineRow.dueDate, deadlineRow.dueTime)}
                      </Typography>

                      <Typography className={styles.deadlineHelperText}>
                        {deadlineStatus.helperText}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )
            })}
          </Box>
        </Box>

        <Box className={styles.tableSectionCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>
                ตารางสถานะเอกสารตามรายวิชา
              </Typography>
              <Typography className={styles.sectionDescription}>
                ตารางนี้จะแสดงเฉพาะสถานะเอกสารและรายละเอียดการส่ง โดยไม่แสดงวันกำหนดส่งซ้ำในตาราง
              </Typography>
            </Box>

            <Chip
              label={`ทั้งหมด ${currentRoundCourseRows.length} วิชา`}
              className={styles.resultChip}
            />
          </Box>

          <TableContainer className={styles.tableContainer}>
            <Table className={styles.table}>
              <TableHead>
                <TableRow className={styles.tableHeadRow}>
                  <TableCell className={styles.headCell}>รหัสวิชา</TableCell>
                  <TableCell className={styles.headCell}>ชื่อรายวิชา</TableCell>
                  <TableCell className={styles.headCell}>กลุ่ม / นักศึกษา</TableCell>
                  <TableCell className={styles.headCell}>สถานะเอกสาร</TableCell>
                  <TableCell className={styles.headCell}>รายละเอียดการส่ง</TableCell>
                  <TableCell className={styles.headCell}>จัดการ</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {currentRoundCourseRows.map((courseItem) => {
                  const mqa3Deadline = currentRoundDeadlineMap.mqa3
                  const mqa5Deadline = currentRoundDeadlineMap.mqa5

                  const mqa3Status = getDocumentStatusChipConfig(
                    courseItem.mqa3Status,
                    courseItem.mqa3SubmittedAt,
                    mqa3Deadline?.dueDate
                  )

                  const mqa5Status = getDocumentStatusChipConfig(
                    courseItem.mqa5Status,
                    courseItem.mqa5SubmittedAt,
                    mqa5Deadline?.dueDate
                  )

                  const mqa3DetailText = getDocumentDetailText({
                    documentType: 'mqa3',
                    status: courseItem.mqa3Status,
                    submittedAt: courseItem.mqa3SubmittedAt,
                    dueDate: mqa3Deadline?.dueDate,
                  })

                  const mqa5DetailText = getDocumentDetailText({
                    documentType: 'mqa5',
                    status: courseItem.mqa5Status,
                    submittedAt: courseItem.mqa5SubmittedAt,
                    dueDate: mqa5Deadline?.dueDate,
                  })

                  return (
                    <TableRow key={courseItem.id} className={styles.tableBodyRow}>
                      <TableCell className={styles.bodyCell}>
                        <Typography className={styles.codeText}>
                          {courseItem.courseCode}
                        </Typography>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.courseInfoBlock}>
                          <Typography className={styles.courseName}>
                            {courseItem.courseName}
                          </Typography>
                          <Typography className={styles.courseMeta}>
                            {courseItem.curriculumName} • สาขา{courseItem.majorName}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.groupInfoBlock}>
                          <Typography className={styles.primaryText}>
                            กลุ่ม {courseItem.sectionNumber}
                          </Typography>
                          <Typography className={styles.secondaryText}>
                            นักศึกษา {courseItem.studentCount} คน
                          </Typography>
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
                        <Box className={styles.detailInfoCell}>
                          <Box className={styles.detailInfoItem}>
                            <Typography className={styles.detailTitle}>
                              มคอ.3
                            </Typography>
                            <Typography className={styles.detailText}>
                              {mqa3DetailText}
                            </Typography>
                          </Box>

                          <Box className={styles.detailInfoItem}>
                            <Typography className={styles.detailTitle}>
                              มคอ.5
                            </Typography>
                            <Typography className={styles.detailText}>
                              {mqa5DetailText}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Button
                          variant="contained"
                          endIcon={<ArrowForwardRoundedIcon />}
                          className={styles.tableActionButton}
                          onClick={() => navigate('/myAssignedCourses')}
                        >
                          เปิดรายการ
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {!currentRoundCourseRows.length && (
                  <TableRow>
                    <TableCell colSpan={6} className={styles.emptyTableCell}>
                      <Box className={styles.emptyState}>
                        <DescriptionRoundedIcon className={styles.emptyStateIcon} />
                        <Typography className={styles.emptyStateTitle}>
                          ยังไม่มีรายวิชาในรอบปัจจุบัน
                        </Typography>
                        <Typography className={styles.emptyStateDescription}>
                          เมื่อมีการมอบหมายรายวิชาแล้ว รายการทั้งหมดจะแสดงในตารางนี้
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
    </Box>
  )
}

export default MqaOverviewPage