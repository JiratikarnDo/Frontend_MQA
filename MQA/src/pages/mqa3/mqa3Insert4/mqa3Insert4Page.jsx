import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import Mqa3FormNav from '../../../components/mqa3/mqa3FormNav'
import styles from './mqa3Insert4Page.module.css'

function mqa3Insert4Page() {
  const navigate = useNavigate()

  const [plan15Rows, setPlan15Rows] = useState([
    {
      type: 'normal',
      week: '',
      topic: '',
      clos: '',
      hours: '',
      activities: '',
      teacher: '',
      examText: '',
    },
  ])

  const addPlan15Row = () => {
    setPlan15Rows((prev) => [
      ...prev,
      {
        type: 'normal',
        week: '',
        topic: '',
        clos: '',
        hours: '',
        activities: '',
        teacher: '',
        examText: '',
      },
    ])
  }

  const addExamRow = () => {
    setPlan15Rows((prev) => [
      ...prev,
      {
        type: 'exam',
        week: '',
        topic: '',
        clos: '',
        hours: '',
        activities: '',
        teacher: '',
        examText: 'สอบปลายภาค',
      },
    ])
  }

  const removePlan15Row = (index) => {
    setPlan15Rows((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const updatePlan15Row = (index, field, value) => {
    setPlan15Rows((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        [field]: value,
      }
      return next
    })
  }

  const [plan15Popup, setPlan15Popup] = useState({
    open: false,
    rowIndex: null,
    field: '',
    title: '',
    value: '',
  })

  const openPlan15Popup = (rowIndex, field, title) => {
    setPlan15Popup({
      open: true,
      rowIndex,
      field,
      title,
      value: plan15Rows[rowIndex]?.[field] || '',
    })
  }

  const closePlan15Popup = () => {
    setPlan15Popup((prev) => ({
      ...prev,
      open: false,
    }))
  }

  const savePlan15Popup = () => {
    if (plan15Popup.rowIndex === null) return

    updatePlan15Row(plan15Popup.rowIndex, plan15Popup.field, plan15Popup.value)
    closePlan15Popup()
  }

  const renderPlan15Cell = (rowIndex, label, field, rows = 2) => (
    <TextField
      fullWidth
      multiline
      rows={rows}
      value={plan15Rows[rowIndex]?.[field] || ''}
      placeholder="คลิกเพื่อกรอกข้อมูล"
      InputProps={{ readOnly: true }}
      onClick={() => openPlan15Popup(rowIndex, field, label)}
      size="small"
      className={styles.popupPreviewField}
    />
  )

  const renderExamMergedCell = (rowIndex) => (
    <Box
      onClick={() => openPlan15Popup(rowIndex, 'examText', 'ข้อความแถวสอบ')}
      className={styles.examMergedCell}
    >
      <Typography
        className={styles.examMergedText}
        color={plan15Rows[rowIndex]?.examText ? 'text.primary' : 'text.secondary'}
      >
        {plan15Rows[rowIndex]?.examText || 'คลิกเพื่อกรอก (เช่น สอบปลายภาค)'}
      </Typography>
    </Box>
  )

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Mqa3FormNav currentStep={4} />

        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>
                แผนการสอน
              </Typography>
              <Typography className={styles.pageDescription}>
                กรอกข้อมูลตามแบบฟอร์มเดิมของหัวข้อ 15
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

          <Box className={styles.contentFlow}>
            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                15. แผนการสอน
              </Typography>

              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.planTable}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="8%" align="center">
                        สัปดาห์ที่
                      </TableCell>
                      <TableCell width="24%" align="center">
                        หัวข้อ/รายละเอียด
                      </TableCell>
                      <TableCell width="20%"  align="center">
                        CLOs
                      </TableCell>
                      <TableCell width="8%" align="center">
                        จำนวนชั่วโมง
                      </TableCell>
                      <TableCell width="20%" align="center">
                        กิจกรรมการเรียนการสอน/สื่อที่ใช้
                      </TableCell>
                      <TableCell width="15%" align="center">
                        ผู้สอน
                      </TableCell>
                      <TableCell width="5%" align="center" />
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {plan15Rows.map((row, index) => {
                      if (row.type === 'exam') {
                        return (
                          <TableRow key={index} hover>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                placeholder="-"
                                value={row.week}
                                onChange={(event) =>
                                  updatePlan15Row(index, 'week', event.target.value)
                                }
                              />
                            </TableCell>

                            <TableCell colSpan={5} align="center">
                              {renderExamMergedCell(index)}
                            </TableCell>

                            <TableCell align="center">
                              <IconButton
                                color="error"
                                onClick={() => removePlan15Row(index)}
                                disabled={plan15Rows.length === 1}
                              >
                                <DeleteOutlineIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      }

                      return (
                        <TableRow key={index} hover>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              placeholder="-"
                              value={row.week}
                              onChange={(event) =>
                                updatePlan15Row(index, 'week', event.target.value)
                              }
                            />
                          </TableCell>

                          <TableCell>
                            {renderPlan15Cell(index, 'หัวข้อ/รายละเอียด', 'topic', 3)}
                          </TableCell>

                          <TableCell>
                            {renderPlan15Cell(index, 'CLOs', 'clos', 3)}
                          </TableCell>

                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              placeholder="-"
                              value={row.hours}
                              onChange={(event) =>
                                updatePlan15Row(index, 'hours', event.target.value)
                              }
                            />
                          </TableCell>

                          <TableCell>
                            {renderPlan15Cell(
                              index,
                              'กิจกรรมการเรียนการสอน/สื่อที่ใช้',
                              'activities',
                              3,
                            )}
                          </TableCell>

                          <TableCell>
                            {renderPlan15Cell(index, 'ผู้สอน', 'teacher', 3)}
                          </TableCell>

                          <TableCell align="center">
                            <IconButton
                              color="error"
                              onClick={() => removePlan15Row(index)}
                              disabled={plan15Rows.length === 1}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box className={styles.addButtonRow}>
                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={addPlan15Row}
                  className={styles.addButton}
                >
                  เพิ่มแถวสอน
                </Button>

                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  variant="outlined"
                  onClick={addExamRow}
                  className={styles.addButton}
                >
                  เพิ่มแถวสอบ
                </Button>
              </Box>
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button
              variant="outlined"
              startIcon={<NavigateBeforeIcon />}
              className={styles.backButton}
              onClick={() => navigate('/mqa3Insert-3')}
            >
              ย้อนกลับ
            </Button>

            <Button
              variant="contained"
              endIcon={<NavigateNextIcon />}
              className={styles.nextButton}
              onClick={() => navigate('/mqa3Insert-5')}
            >
              ถัดไป
            </Button>
          </Box>
        </Box>
      </Box>

      <Dialog open={plan15Popup.open} onClose={closePlan15Popup} maxWidth="md" fullWidth>
        <DialogTitle>{plan15Popup.title}</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={10}
            value={plan15Popup.value}
            onChange={(event) =>
              setPlan15Popup((prev) => ({
                ...prev,
                value: event.target.value,
              }))
            }
            className={styles.dialogField}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={closePlan15Popup}>ยกเลิก</Button>
          <Button variant="contained" onClick={savePlan15Popup}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default mqa3Insert4Page