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
import styles from './mqa3Insert3Page.module.css'

function mqa3Insert3Page() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    lectureHours: '',
    practiceHours: '',
    selfStudyHours: '',
    contactChannel: '',
  })

  const [contactPopup, setContactPopup] = useState({
    open: false,
    value: '',
  })

  const openContactPopup = () => {
    setContactPopup({
      open: true,
      value: form.contactChannel,
    })
  }

  const closeContactPopup = () => {
    setContactPopup((prev) => ({
      ...prev,
      open: false,
    }))
  }

  const saveContactPopup = () => {
    setForm((prev) => ({
      ...prev,
      contactChannel: contactPopup.value,
    }))

    closeContactPopup()
  }

  const [dev14Rows, setDev14Rows] = useState([
    { clo: '', teachStrategy: '', assessStrategy: '' },
  ])

  const addDev14Row = () => {
    setDev14Rows((prev) => [
      ...prev,
      { clo: '', teachStrategy: '', assessStrategy: '' },
    ])
  }

  const removeDev14Row = (index) => {
    setDev14Rows((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const updateDev14Row = (index, field, value) => {
    setDev14Rows((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        [field]: value,
      }
      return next
    })
  }

  const [dev14Popup, setDev14Popup] = useState({
    open: false,
    rowIndex: null,
    field: '',
    title: '',
    value: '',
  })

  const openDev14Popup = (rowIndex, field, title) => {
    setDev14Popup({
      open: true,
      rowIndex,
      field,
      title,
      value: dev14Rows[rowIndex]?.[field] || '',
    })
  }

  const closeDev14Popup = () => {
    setDev14Popup((prev) => ({
      ...prev,
      open: false,
    }))
  }

  const saveDev14Popup = () => {
    if (dev14Popup.rowIndex === null) return

    updateDev14Row(dev14Popup.rowIndex, dev14Popup.field, dev14Popup.value)
    closeDev14Popup()
  }

  const renderDev14Cell = (rowIndex, label, field, rows = 3) => (
    <TextField
      fullWidth
      multiline
      rows={rows}
      value={dev14Rows[rowIndex]?.[field] || ''}
      placeholder="คลิกเพื่อกรอกข้อมูล"
      InputProps={{ readOnly: true }}
      onClick={() => openDev14Popup(rowIndex, field, label)}
      size="small"
      className={styles.popupPreviewField}
    />
  )

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Mqa3FormNav currentStep={3} />

        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>
                การพัฒนานักศึกษาตามผลลัพธ์การเรียนรู้ที่คาดหวัง
              </Typography>
              <Typography className={styles.pageDescription}>
                กรอกข้อมูลตามแบบฟอร์มเดิมของหัวข้อ 13 - 14
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
                13. จำนวนชั่วโมงที่ต้องใช้ต่อสัปดาห์
              </Typography>

              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">บรรยาย</TableCell>
                      <TableCell align="center">
                        การฝึกปฏิบัติ/งานภาคสนาม/การฝึกงาน
                      </TableCell>
                      <TableCell align="center">การศึกษาด้วยตนเอง</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <TextField
                          fullWidth
                          type="number"
                          placeholder="ชั่วโมง/สัปดาห์"
                          value={form.lectureHours}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              lectureHours: event.target.value,
                            }))
                          }
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          fullWidth
                          type="number"
                          placeholder="ชั่วโมง/สัปดาห์"
                          value={form.practiceHours}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              practiceHours: event.target.value,
                            }))
                          }
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          fullWidth
                          type="number"
                          placeholder="ชั่วโมง/สัปดาห์"
                          value={form.selfStudyHours}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              selfStudyHours: event.target.value,
                            }))
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.subSectionTitle}>
                แนวทางและช่องทางการติดต่อกับนักศึกษา
              </Typography>

              <TextField
                fullWidth
                multiline
                minRows={5}
                placeholder="คลิกเพื่อกรอกข้อมูล"
                value={form.contactChannel}
                InputProps={{ readOnly: true }}
                onClick={openContactPopup}
                className={styles.popupPreviewField}
              />
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                14. การพัฒนานักศึกษาตามผลลัพธ์การเรียนรู้ที่คาดหวัง
              </Typography>

              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.dev14Table}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="5%" align="center">
                        ลำดับ
                      </TableCell>
                      <TableCell width="30%" align="center">
                        ผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา (CLOs)
                      </TableCell>
                      <TableCell width="32.5%" align="center">
                        กลยุทธ์การสอนตาม CLOs
                      </TableCell>
                      <TableCell width="32.5%" align="center">
                        กลยุทธ์สำหรับการวัดและประเมินผลตาม CLOs
                      </TableCell>
                      <TableCell width="5%" align="center" />
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {dev14Rows.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell align="center">{index + 1}</TableCell>

                        <TableCell>
                          {renderDev14Cell(
                            index,
                            'ผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา (CLOs)',
                            'clo',
                            3,
                          )}
                        </TableCell>

                        <TableCell>
                          {renderDev14Cell(
                            index,
                            'กลยุทธ์การสอนตาม CLOs',
                            'teachStrategy',
                            3,
                          )}
                        </TableCell>

                        <TableCell>
                          {renderDev14Cell(
                            index,
                            'กลยุทธ์สำหรับการวัดและประเมินผลตาม CLOs',
                            'assessStrategy',
                            3,
                          )}
                        </TableCell>

                        <TableCell align="center">
                          <IconButton
                            color="error"
                            onClick={() => removeDev14Row(index)}
                            disabled={dev14Rows.length === 1}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Button
                startIcon={<AddCircleOutlineIcon />}
                onClick={addDev14Row}
                className={styles.addButton}
              >
                เพิ่มแถว
              </Button>
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button
              variant="outlined"
              startIcon={<NavigateBeforeIcon />}
              className={styles.backButton}
              onClick={() => navigate('/mqa3Insert-2')}
            >
              ย้อนกลับ
            </Button>

            <Button
              variant="contained"
              endIcon={<NavigateNextIcon />}
              className={styles.nextButton}
              onClick={() => navigate('/mqa3Insert-4')}
            >
              ถัดไป
            </Button>
          </Box>
        </Box>
      </Box>

      <Dialog open={contactPopup.open} onClose={closeContactPopup} maxWidth="md" fullWidth>
        <DialogTitle>แนวทางและช่องทางการติดต่อกับนักศึกษา</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={10}
            value={contactPopup.value}
            onChange={(event) =>
              setContactPopup((prev) => ({
                ...prev,
                value: event.target.value,
              }))
            }
            className={styles.dialogField}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={closeContactPopup}>ยกเลิก</Button>
          <Button variant="contained" onClick={saveContactPopup}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dev14Popup.open} onClose={closeDev14Popup} maxWidth="md" fullWidth>
        <DialogTitle>{dev14Popup.title}</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={10}
            value={dev14Popup.value}
            onChange={(event) =>
              setDev14Popup((prev) => ({
                ...prev,
                value: event.target.value,
              }))
            }
            className={styles.dialogField}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDev14Popup}>ยกเลิก</Button>
          <Button variant="contained" onClick={saveDev14Popup}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default mqa3Insert3Page