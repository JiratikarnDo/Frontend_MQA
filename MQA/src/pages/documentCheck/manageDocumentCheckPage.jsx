import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Divider,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import { useLocation } from 'react-router-dom'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import styles from './manageDocumentCheckPage.module.css'

const roundOptions = [
  {
    id: 'mqa3-term1-2569',
    label: 'มคอ.3',
    documentType: 'มคอ.3',
    dueAt: '2026-05-30T16:30:00',
  },
  {
    id: 'mqa5-term1-2569',
    label: 'มคอ.5',
    documentType: 'มคอ.5',
    dueAt: '2026-10-10T16:30:00',
  },
]

const teacherDocumentMockData = [
  {
    teacherId: 1,
    teacherName: 'อาจารย์ธนกฤต วัฒนกิจ',
    teacherCode: 'TCH-001',
    assignedCourseItems: [
      {
        itemId: 'mmt1101-sec1',
        roundId: 'mqa3-term1-2569',
        courseCode: 'MMT1101',
        courseName: 'หลักการออกแบบสื่อดิจิทัล',
        sectionLabel: 'กลุ่ม 1',
        documentType: 'มคอ.3',
        submittedAt: '2026-05-28T10:12:00',
        status: 'submittedOnTime',
      },
      {
        itemId: 'mmt1101-sec2',
        roundId: 'mqa3-term1-2569',
        courseCode: 'MMT1101',
        courseName: 'หลักการออกแบบสื่อดิจิทัล',
        sectionLabel: 'กลุ่ม 2',
        documentType: 'มคอ.3',
        submittedAt: '2026-05-30T18:10:00',
        status: 'submittedLate',
      },
      {
        itemId: 'mmt2103-sec1',
        roundId: 'mqa3-term1-2569',
        courseCode: 'MMT2103',
        courseName: 'การออกแบบกราฟิกสำหรับสื่อใหม่',
        sectionLabel: 'กลุ่ม 1',
        documentType: 'มคอ.3',
        submittedAt: null,
        status: 'pending',
      },
      {
        itemId: 'mmt4101-sec1',
        roundId: 'mqa5-term1-2569',
        courseCode: 'MMT4101',
        courseName: 'สัมมนาสื่อดิจิทัล',
        sectionLabel: 'กลุ่ม 1',
        documentType: 'มคอ.5',
        submittedAt: null,
        status: 'pending',
      },
    ],
  },
  {
    teacherId: 2,
    teacherName: 'อาจารย์พิมพ์ชนก ศรีสว่าง',
    teacherCode: 'TCH-002',
    assignedCourseItems: [
      {
        itemId: 'mmt2204-sec1',
        roundId: 'mqa3-term1-2569',
        courseCode: 'MMT2204',
        courseName: 'การถ่ายภาพเพื่อการสื่อสาร',
        sectionLabel: 'กลุ่ม 1',
        documentType: 'มคอ.3',
        submittedAt: '2026-05-29T09:15:00',
        status: 'submittedOnTime',
      },
      {
        itemId: 'mmt2204-sec2',
        roundId: 'mqa3-term1-2569',
        courseCode: 'MMT2204',
        courseName: 'การถ่ายภาพเพื่อการสื่อสาร',
        sectionLabel: 'กลุ่ม 2',
        documentType: 'มคอ.3',
        submittedAt: null,
        status: 'pending',
      },
      {
        itemId: 'mmt3206-sec1',
        roundId: 'mqa5-term1-2569',
        courseCode: 'MMT3206',
        courseName: 'การออกแบบประสบการณ์ผู้ใช้',
        sectionLabel: 'กลุ่ม 1',
        documentType: 'มคอ.5',
        submittedAt: null,
        status: 'pending',
      },
    ],
  },
]

function formatThaiDateTime(dateValue) {
  if (!dateValue) {
    return '-'
  }

  return new Date(dateValue).toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTeacherSummary(courseItems) {
  const submittedOnTimeCount = courseItems.filter(
    (item) => item.status === 'submittedOnTime'
  ).length
  const submittedLateCount = courseItems.filter(
    (item) => item.status === 'submittedLate'
  ).length
  const pendingCount = courseItems.filter(
    (item) => item.status === 'pending'
  ).length
  const submittedCount = submittedOnTimeCount + submittedLateCount
  const completionPercent = courseItems.length
    ? Math.round((submittedCount / courseItems.length) * 100)
    : 0

  return {
    totalAssignedCount: courseItems.length,
    submittedOnTimeCount,
    submittedLateCount,
    pendingCount,
    submittedCount,
    completionPercent,
  }
}

function getTeacherOverallStatus(summary) {
  if (summary.pendingCount === 0 && summary.submittedLateCount === 0) {
    return {
      label: 'ส่งครบแล้ว',
      className: styles.teacherStatusComplete,
    }
  }

  if (summary.pendingCount === 0 && summary.submittedLateCount > 0) {
    return {
      label: 'ส่งครบแต่มีล่าช้า',
      className: styles.teacherStatusLate,
    }
  }

  if (summary.submittedCount > 0) {
    return {
      label: 'ส่งบางส่วน',
      className: styles.teacherStatusPartial,
    }
  }

  return {
    label: 'ยังไม่ส่ง',
    className: styles.teacherStatusPending,
  }
}

const courseStatusMap = {
  submittedOnTime: {
    label: 'ส่งตรงเวลา',
    className: styles.statusChipSuccess,
  },
  submittedLate: {
    label: 'ส่งล่าช้า',
    className: styles.statusChipLate,
  },
  pending: {
    label: 'ยังไม่ส่ง',
    className: styles.statusChipPending,
  },
}

function ManageDocumentCheckPage() {
  const location = useLocation()
  const selectedMajorFromState = location.state?.major

  const [selectedRoundId, setSelectedRoundId] = useState(roundOptions[0].id)
  const [searchText, setSearchText] = useState('')
  const [expandedTeacherIds, setExpandedTeacherIds] = useState([1])

  const selectedRound = useMemo(
    () => roundOptions.find((item) => item.id === selectedRoundId) ?? roundOptions[0],
    [selectedRoundId]
  )

  const displayMajorName =
    selectedMajorFromState?.majorNameTh || 'สาขาวิชาเทคโนโลยีมัลติมีเดีย'

  const teacherItems = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLowerCase()

    return teacherDocumentMockData
      .map((teacher) => {
        const filteredCourseItems = teacher.assignedCourseItems.filter(
          (courseItem) => courseItem.roundId === selectedRoundId
        )

        const hasMatchedSearch =
          normalizedSearchText.length === 0 ||
          teacher.teacherName.toLowerCase().includes(normalizedSearchText) ||
          teacher.teacherCode.toLowerCase().includes(normalizedSearchText) ||
          filteredCourseItems.some(
            (courseItem) =>
              courseItem.courseCode.toLowerCase().includes(normalizedSearchText) ||
              courseItem.courseName.toLowerCase().includes(normalizedSearchText) ||
              courseItem.sectionLabel.toLowerCase().includes(normalizedSearchText)
          )

        if (!filteredCourseItems.length || !hasMatchedSearch) {
          return null
        }

        return {
          ...teacher,
          majorName: displayMajorName,
          filteredCourseItems,
          summary: getTeacherSummary(filteredCourseItems),
        }
      })
      .filter(Boolean)
  }, [displayMajorName, searchText, selectedRoundId])

  const pageSummary = useMemo(() => {
    const totalTeacherCount = teacherDocumentMockData.length
    const totalAssignedCount = teacherItems.reduce(
      (sum, teacher) => sum + teacher.summary.totalAssignedCount,
      0
    )
    const submittedOnTimeCount = teacherItems.reduce(
      (sum, teacher) => sum + teacher.summary.submittedOnTimeCount,
      0
    )
    const submittedLateCount = teacherItems.reduce(
      (sum, teacher) => sum + teacher.summary.submittedLateCount,
      0
    )
    const pendingCount = teacherItems.reduce(
      (sum, teacher) => sum + teacher.summary.pendingCount,
      0
    )
    const submittedCount = submittedOnTimeCount + submittedLateCount
    const completionPercent = totalAssignedCount
      ? Math.round((submittedCount / totalAssignedCount) * 100)
      : 0

    return {
      totalTeacherCount,
      totalAssignedCount,
      submittedOnTimeCount,
      submittedLateCount,
      pendingCount,
      completionPercent,
    }
  }, [teacherItems])

  const handleToggleExpand = (teacherId) => {
    setExpandedTeacherIds((previousIds) => {
      if (previousIds.includes(teacherId)) {
        return previousIds.filter((item) => item !== teacherId)
      }

      return [...previousIds, teacherId]
    })
  }

  const handleExpandAll = () => {
    setExpandedTeacherIds(teacherItems.map((teacher) => teacher.teacherId))
  }

  const handleCollapseAll = () => {
    setExpandedTeacherIds([])
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>
              ตรวจเอกสาร มคอ.
            </Typography>

            <Typography className={styles.pageDescription}>
              หน้านี้ใช้สำหรับตรวจสอบว่าอาจารย์ในสาขาได้รับมอบหมายรายวิชาและกลุ่มเรียนอะไรบ้าง
              และได้ส่งเอกสาร มคอ. ตามรอบที่กำหนดแล้วหรือยัง
              พร้อมดูเวลาในการส่งและแยกสถานะตรงเวลา ล่าช้า หรือยังไม่ส่ง
            </Typography>
          </Box>

          <Box className={styles.pageStatusCard}>
            <Typography className={styles.pageStatusLabel}>
              ความครบของรอบปัจจุบัน
            </Typography>
            <Typography className={styles.pageStatusValue}>
              {pageSummary.completionPercent}%
            </Typography>
            <Typography className={styles.pageStatusSubtext}>
              {selectedRound.documentType} • {selectedRound.termLabel}
            </Typography>
          </Box>
        </Box>

        <Box className={styles.filterCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>
                ตัวกรองและข้อมูลรอบส่ง
              </Typography>
              <Typography className={styles.sectionDescription}>
                ตอนนี้เป็น mock data ก่อน เพื่อให้เห็นภาพการตรวจเอกสารจริงในระดับรายวิชาและกลุ่มเรียน
              </Typography>
            </Box>

            <Chip
              icon={<FactCheckRoundedIcon />}
              label={`กำลังตรวจ ${selectedRound.label}`}
              className={styles.roundChip}
            />
          </Box>

          <Box className={styles.filterGrid}>
            <TextField
              select
              fullWidth
              label="เลือกรอบส่งเอกสาร"
              value={selectedRoundId}
              onChange={(event) => setSelectedRoundId(event.target.value)}
            >
              {roundOptions.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="ค้นหาอาจารย์ / รหัสวิชา / ชื่อรายวิชา / กลุ่มเรียน"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="เช่น MMT1101 หรือ กลุ่ม 2"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box className={styles.metaGrid}>
            <Box className={styles.metaCard}>
              <Typography className={styles.metaLabel}>
                สาขาที่กำลังตรวจ
              </Typography>
              <Typography className={styles.metaValue}>
                {displayMajorName}
              </Typography>
            </Box>

            <Box className={styles.metaCard}>
              <Typography className={styles.metaLabel}>
                เอกสารรอบนี้
              </Typography>
              <Typography className={styles.metaValue}>
                {selectedRound.documentType}
              </Typography>
            </Box>

            <Box className={styles.metaCard}>
              <Typography className={styles.metaLabel}>
                กำหนดส่ง
              </Typography>
              <Typography className={styles.metaValue}>
                {formatThaiDateTime(selectedRound.dueAt)} น.
              </Typography>
            </Box>

            <Box className={styles.metaCard}>
              <Box className={styles.metaLabelWithIcon}>
                <GroupsRoundedIcon fontSize="small" />
                <Typography className={styles.metaLabel}>
                  จำนวนอาจารย์ในสาขานี้
                </Typography>
              </Box>
              <Typography className={styles.metaValue}>
                {pageSummary.totalTeacherCount} คน
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box className={styles.listCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>
                รายชื่ออาจารย์และสถานะการส่งเอกสาร
              </Typography>
              <Typography className={styles.sectionDescription}>
                กดดูรายละเอียดเพื่อเช็กแต่ละรายการตามรหัสวิชา ชื่อวิชา กลุ่มเรียน และเวลาที่ส่งเอกสาร
              </Typography>
            </Box>

            <Box className={styles.headerButtonGroup}>
              <Button
                variant="outlined"
                onClick={handleExpandAll}
                className={styles.headerButton}
              >
                แสดงทั้งหมด
              </Button>

              <Button
                variant="outlined"
                onClick={handleCollapseAll}
                className={styles.headerButton}
              >
                ย่อทั้งหมด
              </Button>
            </Box>
          </Box>

          {!teacherItems.length ? (
            <Box className={styles.emptyState}>
              <Typography className={styles.emptyTitle}>
                ไม่พบข้อมูลที่ค้นหา
              </Typography>
              <Typography className={styles.emptyDescription}>
                ลองเปลี่ยนคำค้นหา หรือเลือกรอบส่งเอกสารอื่น
              </Typography>
            </Box>
          ) : (
            <Box className={styles.teacherList}>
              {teacherItems.map((teacher) => {
                const isExpanded = expandedTeacherIds.includes(teacher.teacherId)
                const teacherStatus = getTeacherOverallStatus(teacher.summary)

                return (
                  <Box key={teacher.teacherId} className={styles.teacherCard}>
                    <Box className={styles.teacherCardTop}>
                      <Box>
                        <Typography className={styles.teacherName}>
                          {teacher.teacherName}
                        </Typography>
                        <Typography className={styles.teacherSubtext}>
                          {teacher.teacherCode} • {teacher.majorName}
                        </Typography>
                      </Box>

                      <Box className={styles.teacherTopActions}>
                        <Chip
                          label={teacherStatus.label}
                          className={teacherStatus.className}
                        />

                        <Button
                          variant="outlined"
                          onClick={() => handleToggleExpand(teacher.teacherId)}
                          endIcon={
                            isExpanded
                              ? <ExpandLessRoundedIcon />
                              : <ExpandMoreRoundedIcon />
                          }
                          className={styles.expandButton}
                        >
                          {isExpanded ? 'ย่อรายละเอียด' : 'ดูรายละเอียด'}
                        </Button>
                      </Box>
                    </Box>

                    <Box className={styles.teacherSummaryGrid}>
                      <Box className={styles.teacherSummaryCard}>
                        <Typography className={styles.teacherSummaryLabel}>
                          รายการที่รับผิดชอบ
                        </Typography>
                        <Typography className={styles.teacherSummaryValue}>
                          {teacher.summary.totalAssignedCount}
                        </Typography>
                      </Box>

                      <Box className={styles.teacherSummaryCard}>
                        <Typography className={styles.teacherSummaryLabel}>
                          ส่งแล้ว
                        </Typography>
                        <Typography className={styles.teacherSummaryValue}>
                          {teacher.summary.submittedCount}
                        </Typography>
                      </Box>

                      <Box className={styles.teacherSummaryCard}>
                        <Typography className={styles.teacherSummaryLabel}>
                          ยังไม่ส่ง
                        </Typography>
                        <Typography className={styles.teacherSummaryValue}>
                          {teacher.summary.pendingCount}
                        </Typography>
                      </Box>

                      <Box className={styles.teacherSummaryCard}>
                        <Typography className={styles.teacherSummaryLabel}>
                          ความครบ
                        </Typography>
                        <Typography className={styles.teacherSummaryValue}>
                          {teacher.summary.completionPercent}%
                        </Typography>
                      </Box>
                    </Box>

                    {isExpanded && (
                      <Box className={styles.detailSection}>
                        <Divider className={styles.detailDivider} />

                        <Box className={styles.courseList}>
                          {teacher.filteredCourseItems.map((courseItem) => {
                            const statusData = courseStatusMap[courseItem.status]

                            return (
                              <Box
                                key={courseItem.itemId}
                                className={styles.courseCard}
                              >
                                <Box className={styles.courseInfoBlock}>
                                  <Typography className={styles.courseCode}>
                                    {courseItem.courseCode}
                                  </Typography>

                                  <Typography className={styles.courseName}>
                                    {courseItem.courseName}
                                  </Typography>

                                  <Box className={styles.courseMetaRow}>
                                    <Chip
                                      label={courseItem.sectionLabel}
                                      className={styles.sectionChip}
                                    />
                                    <Typography className={styles.courseSubtext}>
                                      เอกสารที่ต้องส่ง: {courseItem.documentType}
                                    </Typography>
                                  </Box>
                                </Box>

                                <Box className={styles.courseRightSide}>
                                  <Chip
                                    label={statusData.label}
                                    className={statusData.className}
                                  />

                                  <Box className={styles.timeCard}>
                                    <AccessTimeRoundedIcon fontSize="small" />
                                    <Box>
                                      <Typography className={styles.timeLabel}>
                                        เวลาที่ส่งเอกสาร
                                      </Typography>
                                      <Typography className={styles.timeValue}>
                                        {formatThaiDateTime(courseItem.submittedAt)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              </Box>
                            )
                          })}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default ManageDocumentCheckPage