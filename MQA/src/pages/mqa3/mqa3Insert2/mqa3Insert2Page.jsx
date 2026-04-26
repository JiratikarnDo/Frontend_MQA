import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import Mqa3FormNav from '../../../components/mqa3/mqa3FormNav'
import styles from './mqa3Insert2Page.module.css'

function mqa3Insert2Page() {
  const [form, setForm] = useState({
    prereq: '',
    coreq: '',
    desc9: '',
    obj10: '',
    plo11: '',
    clo12: '',
    updateDate: '',
  })
  const navigate = useNavigate()
  const [popup, setPopup] = useState({
    open: false,
    field: '',
    title: '',
    value: '',
  })

  const openPopup = (field, title) => {
    setPopup({
      open: true,
      field,
      title,
      value: form[field] || '',
    })
  }

  const closePopup = () => {
    setPopup((prev) => ({
      ...prev,
      open: false,
    }))
  }

  const savePopup = () => {
    setForm((prev) => ({
      ...prev,
      [popup.field]: popup.value,
    }))

    closePopup()
  }

  const renderPopupField = (label, field, minRows = 5) => (
    <TextField
      fullWidth
      multiline
      minRows={minRows}
      value={form[field]}
      placeholder="คลิกเพื่อกรอกข้อมูล"
      InputProps={{ readOnly: true }}
      onClick={() => openPopup(field, label)}
      className={styles.popupPreviewField}
    />
  )

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Mqa3FormNav currentStep={2} />

        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>
                รายวิชาที่ต้องเรียนมาก่อน
              </Typography>
              <Typography className={styles.pageDescription}>
                กรอกข้อมูลตามแบบฟอร์มเดิมของหัวข้อ 7 - 12
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
                7. รายวิชาที่ต้องเรียนมาก่อน (Pre-requisite) และรายวิชาที่ต้องเรียนพร้อมกัน (Co-requisite)
              </Typography>

              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="40%">ประเภทรายวิชา</TableCell>
                      <TableCell width="60%">ชื่อรายวิชา</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    <TableRow>
                      <TableCell>
                        รายวิชาที่ต้องเรียนมาก่อน (Pre-requisite)
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          placeholder="-"
                          value={form.prereq}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              prereq: event.target.value,
                            }))
                          }
                          className={styles.tableInput}
                        />
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>
                        รายวิชาที่ต้องเรียนพร้อมกัน (Co-requisite)
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          placeholder="-"
                          value={form.coreq}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              coreq: event.target.value,
                            }))
                          }
                          className={styles.tableInput}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                8. วันที่จัดทำหรือปรับปรุงรายละเอียดของรายวิชาครั้งล่าสุด
              </Typography>

              <Box className={styles.dateFieldRow}>
                <TextField
                  type="date"
                  value={form.updateDate}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      updateDate: event.target.value,
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Box>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                9. คำอธิบายรายวิชา
              </Typography>

              {renderPopupField('คำอธิบายรายวิชา', 'desc9', 6)}
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                10. วัตถุประสงค์ในการพัฒนา / ปรับปรุงรายวิชา
              </Typography>

              {renderPopupField('วัตถุประสงค์ในการพัฒนา / ปรับปรุงรายวิชา', 'obj10', 6)}
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                11. ผลลัพธ์การเรียนรู้ของหลักสูตร (PLO)
              </Typography>

              {renderPopupField('ผลลัพธ์การเรียนรู้ของหลักสูตร (PLO)', 'plo11', 6)}
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                12. ผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา (CLOs)
              </Typography>

              {renderPopupField('ผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา (CLOs)', 'clo12', 6)}
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button
              variant="outlined"
              startIcon={<NavigateBeforeIcon />}
              className={styles.backButton}
              onClick={() => navigate('/mqa3Insert-1')}
            >
              ย้อนกลับ
            </Button>

            <Button
              variant="contained"
              endIcon={<NavigateNextIcon />}
              className={styles.nextButton}
              onClick={() => navigate('/mqa3Insert-3')}
            >
              ถัดไป
            </Button>
          </Box>
        </Box>
      </Box>

      <Dialog open={popup.open} onClose={closePopup} maxWidth="md" fullWidth>
        <DialogTitle>{popup.title}</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={10}
            value={popup.value}
            onChange={(event) =>
              setPopup((prev) => ({
                ...prev,
                value: event.target.value,
              }))
            }
            className={styles.dialogField}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={closePopup}>ยกเลิก</Button>
          <Button variant="contained" onClick={savePopup}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default mqa3Insert2Page