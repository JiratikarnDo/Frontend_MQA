import { useState } from 'react'
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import Mqa3FormNav from '../../../components/mqa3/mqa3FormNav'
import styles from './mqa3Insert1Page.module.css'

function mqa3Insert1Page() {
  const [teachers, setTeachers] = useState([''])

  const addTeacher = () => {
    setTeachers((prev) => [...prev, ''])
  }

  const removeTeacher = (index) => {
    setTeachers((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const updateTeacher = (index, value) => {
    setTeachers((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Mqa3FormNav />

        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>
                ข้อมูลทั่วไป
              </Typography>
              <Typography className={styles.pageDescription}>
                กรอกข้อมูลพื้นฐานของรายวิชาเพื่อใช้เป็นข้อมูลตั้งต้นของแบบฟอร์ม มคอ.3
              </Typography>
            </Box>

            <Box className={styles.pageStatus}>
              <Typography className={styles.pageStatusLabel}>
                สถานะหน้านี้
              </Typography>
              <Typography className={styles.pageStatusValue}>
                ยังไม่ครบ
              </Typography>
            </Box>
          </Box>

          <Box className={styles.sectionGrid}>
            <Box className={styles.sectionCard}>
              <Box className={styles.sectionHeader}>
                <Typography className={styles.sectionTitle}>
                  1.รหัสและชื่อรายวิชา
                </Typography>
                <Typography className={styles.sectionHint}>
                  ข้อมูลชื่อรายวิชาในภาษาไทยและภาษาอังกฤษ
                </Typography>
              </Box>

              <Box className={styles.courseCodeGrid}>
              <TextField
                label="รหัสวิชา"
                placeholder="เช่น BIS12345"
                fullWidth
              />

              <TextField
                label="ชื่อรายวิชา (ภาษาไทย)"
                placeholder="เช่น การวิเคราะห์ระบบ"
                fullWidth
              />

              <TextField
                label="ชื่อรายวิชา (ภาษาอังกฤษ)"
                placeholder="เช่น Systems Analysis"
                fullWidth
              />
            </Box>
            </Box>

            <Box className={styles.sectionCard}>
              <Box className={styles.sectionHeader}>
                <Typography className={styles.sectionTitle}>
                  2 จำนวนหน่วยกิต
                </Typography>
                <Typography className={styles.sectionHint}>
                  ระบุจำนวนหน่วยกิตของรายวิชา
                </Typography>
              </Box>

              <Box className={styles.singleFieldRow}>
                <TextField
                  label="จำนวนหน่วยกิต"
                  type="number"
                  placeholder="เช่น 3"
                  fullWidth
                />
              </Box>
            </Box>

            <Box className={styles.sectionCard}>
              <Box className={styles.sectionHeader}>
                <Typography className={styles.sectionTitle}>
                  3 หลักสูตรและประเภทรายวิชา
                </Typography>
                <Typography className={styles.sectionHint}>
                  ข้อมูลหลักสูตร สาขาวิชา และประเภทของรายวิชา
                </Typography>
              </Box>

              <Box className={styles.courseTypeGrid}>
                <TextField
                  label="หลักสูตร / สาขาวิชา"
                  placeholder="เช่น ระบบสารสนเทศทางธุรกิจ"
                  fullWidth
                />

                <TextField
                  label="ประเภทรายวิชา"
                  placeholder="เช่น วิชาบังคับ"
                  fullWidth
                />
              </Box>
            </Box>

            <Box className={styles.sectionCard}>
              <Box className={styles.sectionHeader}>
                <Typography className={styles.sectionTitle}>
                  4 อาจารย์ผู้รับผิดชอบรายวิชาและอาจารย์ผู้สอน
                </Typography>
                <Typography className={styles.sectionHint}>
                  เพิ่มรายชื่ออาจารย์ได้มากกว่า 1 คน
                </Typography>
              </Box>

              <Box className={styles.teacherList}>
                {teachers.map((teacher, index) => (
                  <Box key={index} className={styles.teacherRow}>
                    <TextField
                      label={`ชื่ออาจารย์คนที่ ${index + 1}`}
                      value={teacher}
                      onChange={(event) => updateTeacher(index, event.target.value)}
                      placeholder="กรอกชื่ออาจารย์"
                      fullWidth
                    />

                    <IconButton
                      color="error"
                      onClick={() => removeTeacher(index)}
                      disabled={teachers.length === 1}
                      className={styles.deleteButton}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>

              <Button
                startIcon={<AddCircleOutlineIcon />}
                variant="outlined"
                onClick={addTeacher}
                className={styles.addButton}
              >
                เพิ่มอาจารย์
              </Button>
            </Box>

            <Box className={styles.sectionCard}>
              <Box className={styles.sectionHeader}>
                <Typography className={styles.sectionTitle}>
                  5 ภาคการศึกษา / ชั้นปี / กลุ่มเรียน / จำนวนนักศึกษา
                </Typography>
                <Typography className={styles.sectionHint}>
                  ข้อมูลการเปิดสอนในภาคเรียนนี้
                </Typography>
              </Box>

              <Box className={styles.fieldGridFour}>
                <TextField
                  label="ภาคการศึกษา"
                  placeholder="เช่น 1"
                  fullWidth
                />

                <TextField
                  label="ชั้นปี"
                  placeholder="เช่น 3"
                  fullWidth
                />

                <TextField
                  label="กลุ่มเรียน"
                  placeholder="เช่น BIS3/1"
                  fullWidth
                />

                <TextField
                  label="จำนวนนักศึกษา"
                  type="number"
                  placeholder="เช่น 40"
                  fullWidth
                />
              </Box>
            </Box>

            <Box className={styles.sectionCard}>
              <Box className={styles.sectionHeader}>
                <Typography className={styles.sectionTitle}>
                  6 สถานที่เรียน
                </Typography>
                <Typography className={styles.sectionHint}>
                  ระบุสถานที่เรียนหรือห้องเรียนที่ใช้งาน
                </Typography>
              </Box>

              <Box className={styles.school}> 
                <TextField
                  label="สถานที่เรียน"
                  defaultValue="คณะบริหารธุรกิจและเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีราชมงคลตะวันออก"
                  fullWidth
                />
              </Box>
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button
              variant="outlined"
              startIcon={<NavigateBeforeIcon />}
              disabled
              className={styles.backButton}
            >
              ย้อนกลับ
            </Button>

            <Button
              variant="contained"
              endIcon={<NavigateNextIcon />}
              className={styles.nextButton}
            >
              ถัดไป
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default mqa3Insert1Page