import { Box, Button, Chip, Typography } from '@mui/material'
import styles from './mqa3FormNav.module.css'

const formSteps = [
  { id: 1, label: 'ข้อมูลทั่วไป', path: '/mqa3Insert-1', status: 'current' },
  { id: 2, label: 'รายวิชาที่ต้องเรียนมาก่อน', path: '/mqa3Insert-2', status: 'pending' },
  { id: 3, label: 'การพัฒนานักศึกษา', path: '/mqa3Insert-3', status: 'pending' },
  { id: 4, label: 'แผนการสอน', path: '/mqa3Insert-4', status: 'pending' },
  { id: 5, label: 'การประเมินผล', path: '/mqa3Insert-5', status: 'pending' },
]

function getStatusText(status) {
  if (status === 'done') return 'ครบ'
  if (status === 'warning') return 'ยังไม่ครบ'
  if (status === 'current') return 'กำลังกรอก'
  return 'ยังไม่เริ่ม'
}

function getStatusColor(status) {
  if (status === 'done') return 'success'
  if (status === 'warning') return 'warning'
  if (status === 'current') return 'primary'
  return 'default'
}

function mqa3FormNav() {
  return (
    <Box className={styles.wrapper}>
      <Box className={styles.headerRow}>
        <Box>
          <Typography className={styles.title}>
            แบบฟอร์ม มคอ.3
          </Typography>
          <Typography className={styles.subtitle}>
            รายละเอียดรายวิชา มหาวิทยาลัยเทคโนโลยีราชมงคลตะวันออก
          </Typography>
        </Box>

        <Chip
          label="แบบร่าง"
          color="primary"
          variant="outlined"
          className={styles.draftChip}
        />
      </Box>

      <Box className={styles.stepGrid}>
        {formSteps.map((step) => (
          <Button
            key={step.id}
            className={`${styles.stepCard} ${step.status === 'current' ? styles.stepCardActive : ''}`}
            variant="text"
          >
            <Box className={styles.stepTopRow}>
              <Box className={styles.stepNumber}>
                {step.id}
              </Box>

              <Chip
                label={getStatusText(step.status)}
                color={getStatusColor(step.status)}
                size="small"
                className={styles.statusChip}
              />
            </Box>

            <Box className={styles.stepContent}>
              <Typography className={styles.stepLabel}>
                {step.label}
              </Typography>

              <Typography className={styles.stepPath}>
                {step.path}
              </Typography>
            </Box>
          </Button>
        ))}
      </Box>
    </Box>
  )
}

export default mqa3FormNav