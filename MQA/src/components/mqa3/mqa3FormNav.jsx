import { Box, Button, Chip, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import styles from './mqa3FormNav.module.css'

const formSteps = [
  { id: 1, label: 'ข้อมูลทั่วไป', path: '/mqa3Insert-1' },
  { id: 2, label: 'รายวิชาที่ต้องเรียนมาก่อน', path: '/mqa3Insert-2' },
  { id: 3, label: 'การพัฒนานักศึกษา', path: '/mqa3Insert-3' },
  { id: 4, label: 'แผนการสอน', path: '/mqa3Insert-4' },
  { id: 5, label: 'การประเมินผล', path: '/mqa3Insert-5' },
]

function getStepStatus(stepId, currentStep) {
  if (stepId === currentStep) return 'current'
  if (stepId < currentStep) return 'done'
  return 'pending'
}

function getStatusText(status) {
  if (status === 'done') return 'ผ่านแล้ว'
  if (status === 'current') return 'กำลังกรอก'
  return 'ยังไม่เริ่ม'
}

function getStatusColor(status) {
  if (status === 'done') return 'success'
  if (status === 'current') return 'primary'
  return 'default'
}

function mqa3FormNav({ currentStep = 1 }) {
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
        {formSteps.map((step) => {
          const status = getStepStatus(step.id, currentStep)

          return (
            <Button
              key={step.id}
              component={Link}
              to={step.path}
              className={`${styles.stepCard} ${status === 'current' ? styles.stepCardActive : ''}`}
              variant="text"
              disabled={status === 'current'}
            >
              <Box className={styles.stepTopRow}>
                <Box className={styles.stepNumber}>
                  {step.id}
                </Box>

                <Chip
                  label={getStatusText(status)}
                  color={getStatusColor(status)}
                  size="small"
                  className={styles.statusChip}
                />
              </Box>

              <Box className={styles.stepContent}>
                <Typography className={styles.stepLabel}>
                  {step.label}
                </Typography>
              </Box>
            </Button>
          )
        })}
      </Box>
    </Box>
  )
}

export default mqa3FormNav