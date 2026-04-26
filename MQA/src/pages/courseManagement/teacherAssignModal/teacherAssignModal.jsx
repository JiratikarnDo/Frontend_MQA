import { useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import styles from './teacherAssignModal.module.css'

const mockTeacherOptions = [
  {
    id: 'teacher-001',
    teacherName: 'อาจารย์ธนกฤต วัฒนกิจ',
    teacherRole: 'หัวหน้าสาขา',
    majorName: 'วิทยาการคอมพิวเตอร์',
    departmentName: 'สาขาวิทยาการคอมพิวเตอร์',
  },
  {
    id: 'teacher-002',
    teacherName: 'อาจารย์พิมพ์ชนก ศรีสว่าง',
    teacherRole: 'อาจารย์ประจำสาขา',
    majorName: 'วิทยาการคอมพิวเตอร์',
    departmentName: 'สาขาวิทยาการคอมพิวเตอร์',
  },
  {
    id: 'teacher-003',
    teacherName: 'อาจารย์กิตติพงษ์ จันทร์ดี',
    teacherRole: 'อาจารย์ประจำสาขา',
    majorName: 'วิทยาการคอมพิวเตอร์',
    departmentName: 'สาขาวิทยาการคอมพิวเตอร์',
  },
  {
    id: 'teacher-004',
    teacherName: 'อาจารย์ณัฐพงศ์ วรวิทย์',
    teacherRole: 'อาจารย์ประจำสาขา',
    majorName: 'วิทยาการคอมพิวเตอร์',
    departmentName: 'สาขาวิทยาการคอมพิวเตอร์',
  },
  {
    id: 'teacher-005',
    teacherName: 'อาจารย์วรกร สุขเจริญ',
    teacherRole: 'หัวหน้าสาขา',
    majorName: 'เทคโนโลยีสารสนเทศ',
    departmentName: 'สาขาเทคโนโลยีสารสนเทศ',
  },
  {
    id: 'teacher-006',
    teacherName: 'อาจารย์นภัสสร พูลทรัพย์',
    teacherRole: 'อาจารย์ประจำสาขา',
    majorName: 'เทคโนโลยีสารสนเทศ',
    departmentName: 'สาขาเทคโนโลยีสารสนเทศ',
  },
  {
    id: 'teacher-007',
    teacherName: 'อาจารย์สิริภรณ์ แก้วคำ',
    teacherRole: 'หัวหน้าสาขา',
    majorName: 'เทคโนโลยีมัลติมีเดีย',
    departmentName: 'สาขาเทคโนโลยีมัลติมีเดีย',
  },
  {
    id: 'teacher-008',
    teacherName: 'อาจารย์รัชพล อินทรวงศ์',
    teacherRole: 'อาจารย์ประจำสาขา',
    majorName: 'เทคโนโลยีมัลติมีเดีย',
    departmentName: 'สาขาเทคโนโลยีมัลติมีเดีย',
  },
]

function getLevelLabel(level) {
  if (level === 'bachelor') return 'ปริญญาตรี'
  if (level === 'master') return 'ปริญญาโท'
  if (level === 'doctoral') return 'ปริญญาเอก'
  return '-'
}

function getTeacherInitials(teacherName) {
  if (!teacherName) return 'อ'
  const cleanedName = teacherName.replace('อาจารย์', '').trim()
  const parts = cleanedName.split(' ')
  const firstChar = parts[0]?.charAt(0) || ''
  const secondChar = parts[1]?.charAt(0) || ''
  return `${firstChar}${secondChar}` || 'อ'
}

function TeacherAssignModal({ open, onClose, courseItem, onSave }) {
  const [searchText, setSearchText] = useState('')
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([])

  useEffect(() => {
    setSearchText('')

    if (!courseItem) {
      setSelectedTeacherIds([])
      return
    }

    const currentAssignedTeacherIds = mockTeacherOptions
      .filter((teacher) => courseItem.assignedTeachers?.includes(teacher.teacherName))
      .map((teacher) => teacher.id)

    setSelectedTeacherIds(currentAssignedTeacherIds)
  }, [courseItem, open])

  const availableTeacherOptions = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLowerCase()
    const targetMajorName = courseItem?.majorName || ''

    const teacherListInMajor = mockTeacherOptions.filter(
      (teacher) => teacher.majorName === targetMajorName
    )

    if (!normalizedSearchText) {
      return teacherListInMajor
    }

    return teacherListInMajor.filter((teacher) => {
      return (
        teacher.teacherName.toLowerCase().includes(normalizedSearchText) ||
        teacher.teacherRole.toLowerCase().includes(normalizedSearchText) ||
        teacher.departmentName.toLowerCase().includes(normalizedSearchText)
      )
    })
  }, [courseItem, searchText])

  const selectedTeacherList = useMemo(() => {
    return selectedTeacherIds
      .map((teacherId) =>
        mockTeacherOptions.find((teacher) => teacher.id === teacherId)
      )
      .filter(Boolean)
  }, [selectedTeacherIds])

  const handleToggleTeacher = (teacherId) => {
    setSelectedTeacherIds((prev) => {
      if (prev.includes(teacherId)) {
        return prev.filter((item) => item !== teacherId)
      }

      return [...prev, teacherId]
    })
  }

  const handleRemoveSelectedTeacher = (teacherId) => {
    setSelectedTeacherIds((prev) => prev.filter((item) => item !== teacherId))
  }

  const handleSave = () => {
    const selectedTeacherNames = selectedTeacherList.map(
      (teacher) => teacher.teacherName
    )

    onSave?.(selectedTeacherNames)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      scroll="paper"
      PaperProps={{
        className: styles.dialogPaper,
      }}
    >
      <DialogContent className={styles.dialogContent}>
        <Box className={styles.backgroundGlowTop} />
        <Box className={styles.backgroundGlowBottom} />

        <Box className={styles.modalShell}>
          <Box className={styles.modalHeader}>
            <Box className={styles.headerContent}>
              <Typography className={styles.modalTitle}>
                เพิ่มอาจารย์ผู้สอน
              </Typography>
              <Typography className={styles.modalDescription}>
                เลือกอาจารย์ผู้รับผิดชอบรายวิชาที่ผ่านการอนุมัติเปิดสอนแล้ว
                สามารถเลือกได้หลายคน และแก้ไขรายการได้ก่อนบันทึก
              </Typography>
            </Box>

            <IconButton onClick={onClose} className={styles.closeButton}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          {courseItem && (
            <Box className={styles.courseInfoCard}>
              <Box className={styles.courseInfoGrid}>
                <Box className={styles.infoItem}>
                  <Box className={styles.infoIconBlue}>
                    <MenuBookRoundedIcon />
                  </Box>
                  <Box>
                    <Typography className={styles.infoLabel}>
                      รายวิชา
                    </Typography>
                    <Typography className={styles.infoValue}>
                      {courseItem.courseCode} - {courseItem.courseName}
                    </Typography>
                  </Box>
                </Box>

                <Box className={styles.infoItem}>
                  <Box className={styles.infoIconIndigo}>
                    <SchoolRoundedIcon />
                  </Box>
                  <Box>
                    <Typography className={styles.infoLabel}>
                      ระดับหลักสูตร / ชั้นปี
                    </Typography>
                    <Typography className={styles.infoValue}>
                      {getLevelLabel(courseItem.level)} • ชั้นปี {courseItem.yearLevel}
                    </Typography>
                  </Box>
                </Box>

                <Box className={styles.infoItem}>
                  <Box className={styles.infoIconGreen}>
                    <GroupsRoundedIcon />
                  </Box>
                  <Box>
                    <Typography className={styles.infoLabel}>
                      กลุ่ม / นักศึกษา
                    </Typography>
                    <Typography className={styles.infoValue}>
                      กลุ่ม {courseItem.sectionNumber} • {courseItem.studentCount} คน
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Typography className={styles.courseMetaText}>
                {courseItem.curriculumName} • สาขา{courseItem.majorName} • ภาคการศึกษา{' '}
                {courseItem.semester}/{courseItem.academicYear}
              </Typography>
            </Box>
          )}

          <Box className={styles.contentGrid}>
            <Box className={styles.leftPanel}>
              <Box className={styles.panelHeader}>
                <Typography className={styles.panelTitle}>
                  ค้นหาอาจารย์ในสาขา
                </Typography>
                <Typography className={styles.panelDescription}>
                  รายการด้านล่างจะแสดงเฉพาะอาจารย์ในสาขาของรายวิชานี้
                  และสามารถเลือกได้หลายคน
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="ค้นหาอาจารย์"
                placeholder="ค้นหาจากชื่อ ตำแหน่ง หรือสาขา"
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

              <Box className={styles.teacherList}>
                {availableTeacherOptions.map((teacher) => {
                  const isSelected = selectedTeacherIds.includes(teacher.id)

                  return (
                    <Box
                      key={teacher.id}
                      className={`${styles.teacherCard} ${
                        isSelected ? styles.teacherCardSelected : ''
                      }`}
                      onClick={() => handleToggleTeacher(teacher.id)}
                    >
                      <Box className={styles.teacherCardLeft}>
                        <Avatar className={styles.teacherAvatar}>
                          {getTeacherInitials(teacher.teacherName)}
                        </Avatar>

                        <Box className={styles.teacherTextBlock}>
                          <Typography className={styles.teacherName}>
                            {teacher.teacherName}
                          </Typography>
                          <Typography className={styles.teacherMeta}>
                            {teacher.teacherRole}
                          </Typography>
                          <Typography className={styles.teacherDepartment}>
                            {teacher.departmentName}
                          </Typography>
                        </Box>
                      </Box>

                      <Box className={styles.teacherCardRight}>
                        {isSelected ? (
                          <Chip
                            icon={<CheckCircleRoundedIcon />}
                            label="เลือกแล้ว"
                            className={styles.selectedChip}
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<PersonAddAlt1RoundedIcon />}
                            label="กดเพื่อเลือก"
                            className={styles.defaultChip}
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  )
                })}

                {!availableTeacherOptions.length && (
                  <Box className={styles.emptyState}>
                    <Typography className={styles.emptyStateTitle}>
                      ไม่พบอาจารย์ที่ตรงกับคำค้นหา
                    </Typography>
                    <Typography className={styles.emptyStateDescription}>
                      ลองเปลี่ยนคำค้นหาใหม่อีกครั้ง
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Box className={styles.rightPanel}>
              <Box className={styles.panelHeader}>
                <Typography className={styles.panelTitle}>
                  อาจารย์ที่เลือกแล้ว
                </Typography>
                <Typography className={styles.panelDescription}>
                  สามารถลบรายชื่อที่เลือกออกได้ก่อนกดบันทึก
                </Typography>
              </Box>

              <Box className={styles.selectedSummaryCard}>
                <Typography className={styles.selectedSummaryLabel}>
                  จำนวนอาจารย์ที่เลือก
                </Typography>
                <Typography className={styles.selectedSummaryValue}>
                  {selectedTeacherList.length} คน
                </Typography>
              </Box>

              <Box className={styles.selectedTeacherList}>
                {selectedTeacherList.length > 0 ? (
                  selectedTeacherList.map((teacher) => (
                    <Box key={teacher.id} className={styles.selectedTeacherCard}>
                      <Box className={styles.selectedTeacherInfo}>
                        <Avatar className={styles.selectedTeacherAvatar}>
                          {getTeacherInitials(teacher.teacherName)}
                        </Avatar>

                        <Box>
                          <Typography className={styles.selectedTeacherName}>
                            {teacher.teacherName}
                          </Typography>
                          <Typography className={styles.selectedTeacherMeta}>
                            {teacher.teacherRole} • {teacher.departmentName}
                          </Typography>
                        </Box>
                      </Box>

                      <IconButton
                        className={styles.removeButton}
                        onClick={() => handleRemoveSelectedTeacher(teacher.id)}
                      >
                        <DeleteOutlineRoundedIcon />
                      </IconButton>
                    </Box>
                  ))
                ) : (
                  <Box className={styles.emptySelectedState}>
                    <Typography className={styles.emptyStateTitle}>
                      ยังไม่ได้เลือกอาจารย์
                    </Typography>
                    <Typography className={styles.emptyStateDescription}>
                      เลือกอาจารย์จากรายการด้านซ้ายเพื่อกำหนดผู้รับผิดชอบรายวิชา
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          <Box className={styles.actionRow}>
            <Button
              variant="outlined"
              className={styles.cancelButton}
              onClick={onClose}
            >
              ยกเลิก
            </Button>

            <Button
              variant="contained"
              className={styles.saveButton}
              onClick={handleSave}
            >
              บันทึกการมอบหมาย
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default TeacherAssignModal