import { useMemo, useState } from 'react'
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
import Mqa5FormNav from '../../../components/mqa5/mqa5FormNav'
import styles from './mqa5Insert2Page.module.css'

const gradeRows = [
  { grade: 'A', range: '80->>' },
  { grade: 'B+', range: '75-79.99' },
  { grade: 'B', range: '70-74.99' },
  { grade: 'C+', range: '65-69.99' },
  { grade: 'C', range: '60-64.99' },
  { grade: 'D+', range: '55-59.99' },
  { grade: 'D', range: '50-54.99' },
  { grade: 'F', range: '49-49.99' },
  { grade: 'I', range: '-' },
]

function Mqa5Insert2Page() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    prereq: '-',
    coreq: '-',
    updateDate: '',
    actualHoursDeviation: '',
    missingTopics: '',
    registered: '',
    remained: '',
    withdrewW: '',
    abnormalReason: 'ไม่มี',
  })

  const [rows11, setRows11] = useState([
    { clo: '', teach: '', assess: '', outcome: '', improve: '' },
  ])

  const [rows126, setRows126] = useState([
    { deviation: '-', reason: '-' },
  ])

  const [gradeCounts, setGradeCounts] = useState(() =>
    Object.fromEntries(gradeRows.map((item) => [item.grade, '']))
  )

  const [popup, setPopup] = useState({
    open: false,
    field: '',
    title: '',
    value: '',
    rowIndex: null,
    rowField: '',
    mode: 'form',
  })

  const openPopupForForm = (field, title) => {
    setPopup({
      open: true,
      field,
      title,
      value: form[field] || '',
      rowIndex: null,
      rowField: '',
      mode: 'form',
    })
  }

  const openPopupForRow11 = (rowIndex, rowField, title) => {
    setPopup({
      open: true,
      field: '',
      title,
      value: rows11[rowIndex]?.[rowField] || '',
      rowIndex,
      rowField,
      mode: 'row11',
    })
  }

  const openPopupForRow126 = (rowIndex, rowField, title) => {
    setPopup({
      open: true,
      field: '',
      title,
      value: rows126[rowIndex]?.[rowField] || '',
      rowIndex,
      rowField,
      mode: 'row126',
    })
  }

  const closePopup = () => {
    setPopup((prev) => ({
      ...prev,
      open: false,
    }))
  }

  const savePopup = () => {
    if (popup.mode === 'form') {
      setForm((prev) => ({
        ...prev,
        [popup.field]: popup.value,
      }))
    }

    if (popup.mode === 'row11') {
      setRows11((prev) => {
        const next = [...prev]
        next[popup.rowIndex] = {
          ...next[popup.rowIndex],
          [popup.rowField]: popup.value,
        }
        return next
      })
    }

    if (popup.mode === 'row126') {
      setRows126((prev) => {
        const next = [...prev]
        next[popup.rowIndex] = {
          ...next[popup.rowIndex],
          [popup.rowField]: popup.value,
        }
        return next
      })
    }

    closePopup()
  }

  const renderPopupField = (label, field, minRows = 5, extraClassName = '') => (
    <TextField
      fullWidth
      multiline
      minRows={minRows}
      maxRows={minRows}
      value={form[field]}
      placeholder="คลิกเพื่อกรอกข้อมูล"
      InputProps={{ readOnly: true }}
      onClick={() => openPopupForForm(field, label)}
      className={`${styles.popupPreviewField} ${extraClassName}`}
    />
  )

  const renderRow11Field = (rowIndex, rowField, label, minRows = 3) => (
    <TextField
      fullWidth
      multiline
      minRows={minRows}
      maxRows={minRows}
      value={rows11[rowIndex]?.[rowField] || ''}
      placeholder="คลิกเพื่อกรอกข้อมูล"
      InputProps={{ readOnly: true }}
      onClick={() => openPopupForRow11(rowIndex, rowField, label)}
      className={styles.compactPreviewField}
    />
  )

  const renderRow126Field = (rowIndex, rowField, label, minRows = 2) => (
    <TextField
      fullWidth
      multiline
      minRows={minRows}
      maxRows={minRows}
      value={rows126[rowIndex]?.[rowField] || ''}
      placeholder="คลิกเพื่อกรอกข้อมูล"
      InputProps={{ readOnly: true }}
      onClick={() => openPopupForRow126(rowIndex, rowField, label)}
      className={styles.compactPreviewField}
    />
  )

  const addRow11 = () => {
    setRows11((prev) => [
      ...prev,
      { clo: '', teach: '', assess: '', outcome: '', improve: '' },
    ])
  }

  const removeRow11 = (index) => {
    setRows11((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const addRow126 = () => {
    setRows126((prev) => [
      ...prev,
      { deviation: '-', reason: '-' },
    ])
  }

  const removeRow126 = (index) => {
    setRows126((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const totalGrades = useMemo(() => {
    return gradeRows.reduce((sum, item) => {
      return sum + (Number.parseFloat(gradeCounts[item.grade]) || 0)
    }, 0)
  }, [gradeCounts])

  const getGradePercent = (grade) => {
    const currentValue = Number.parseFloat(gradeCounts[grade]) || 0
    if (!totalGrades) return '0.00'
    return ((currentValue / totalGrades) * 100).toFixed(2)
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Mqa5FormNav currentStep={2} />

        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>
                รายวิชาที่ต้องเรียนมาก่อน
              </Typography>
              <Typography className={styles.pageDescription}>
                กรอกข้อมูลตามแบบฟอร์มเดิมของหัวข้อ 7 - 12 สำหรับแบบฟอร์ม มคอ.5
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
                7. รายวิชาที่ต้องเรียนมาก่อน (Pre-requisite) และรายวิชาที่ต้องเรียนพร้อมกัน (Co-requisite) (ถ้ามี)
              </Typography>

              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.fixedWideTable}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="45%">ประเภทของรายวิชา</TableCell>
                      <TableCell width="55%">ชื่อรายวิชา</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    <TableRow>
                      <TableCell className={styles.labelCell}>
                        รายวิชาที่ต้องเรียนมาก่อน (Pre-requisite)
                      </TableCell>
                      <TableCell>
                        {renderPopupField(
                          '7. รายวิชาที่ต้องเรียนมาก่อน (Pre-requisite)',
                          'prereq',
                          3
                        )}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className={styles.labelCell}>
                        รายวิชาที่ต้องเรียนพร้อมกัน (Co-requisite)
                      </TableCell>
                      <TableCell>
                        {renderPopupField(
                          '7. รายวิชาที่ต้องเรียนพร้อมกัน (Co-requisite)',
                          'coreq',
                          3
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography className={styles.noteText}>
                ** หากไม่มีรายวิชาที่ต้องเรียนมาก่อน/เรียนพร้อมกัน ให้ใส่เครื่องหมาย "-"
              </Typography>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                8. วันที่จัดทำหรือปรับปรุงผลการดำเนินการของรายวิชาครั้งล่าสุด
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
                9. รายงานชั่วโมงการสอนจริงที่คาดเคลื่อนจากแผนการสอน (ถ้ามี)
              </Typography>

              {renderPopupField(
                '9. รายงานชั่วโมงการสอนจริงที่คาดเคลื่อนจากแผนการสอน (ถ้ามี)',
                'actualHoursDeviation',
                5,
                styles.largePreviewField
              )}
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                10. หัวข้อที่สอนไม่ครอบคลุมตามแผน (ถ้ามี)
              </Typography>

              {renderPopupField(
                '10. หัวข้อที่สอนไม่ครอบคลุมตามแผน (ถ้ามี)',
                'missingTopics',
                5,
                styles.largePreviewField
              )}
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                11. ประสิทธิผลของวิธีการจัดการเรียนรู้และวิธีการประเมินผลที่ดำเนินการเพื่อให้เกิดผลลัพธ์การเรียนรู้ตามที่ระบุในรายละเอียดของรายวิชา
              </Typography>

              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.effectivenessTable}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="18%">CLOs</TableCell>
                      <TableCell width="21%">กลยุทธ์การสอน/การจัดการเรียนรู้</TableCell>
                      <TableCell width="17%">วิธีการประเมินผล</TableCell>
                      <TableCell width="17%">ผลที่เกิดกับนักศึกษา</TableCell>
                      <TableCell width="17%">แนวทางพัฒนา/ปรับปรุง</TableCell>
                      <TableCell width="10%" />
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows11.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {renderRow11Field(
                            index,
                            'clo',
                            `11. CLOs (รายการที่ ${index + 1})`,
                            3
                          )}
                        </TableCell>

                        <TableCell>
                          {renderRow11Field(
                            index,
                            'teach',
                            `11. กลยุทธ์การสอน/การจัดการเรียนรู้ (รายการที่ ${index + 1})`,
                            3
                          )}
                        </TableCell>

                        <TableCell>
                          {renderRow11Field(
                            index,
                            'assess',
                            `11. วิธีการประเมินผล (รายการที่ ${index + 1})`,
                            3
                          )}
                        </TableCell>

                        <TableCell>
                          {renderRow11Field(
                            index,
                            'outcome',
                            `11. ผลที่เกิดกับนักศึกษา (รายการที่ ${index + 1})`,
                            3
                          )}
                        </TableCell>

                        <TableCell>
                          {renderRow11Field(
                            index,
                            'improve',
                            `11. แนวทางพัฒนา/ปรับปรุง (รายการที่ ${index + 1})`,
                            3
                          )}
                        </TableCell>

                        <TableCell className={styles.actionCell}>
                          <IconButton
                            color="error"
                            onClick={() => removeRow11(index)}
                            disabled={rows11.length === 1}
                            className={styles.deleteButton}
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
                variant="outlined"
                onClick={addRow11}
                className={styles.addButton}
              >
                เพิ่มแถว (CLO)
              </Button>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                12. สรุปผลการจัดการเรียนการสอนของรายวิชา
              </Typography>

              <Box className={styles.summaryGrid}>
                <TextField
                  label="12.1 จำนวนนักศึกษาที่ลงทะเบียนเรียน"
                  value={form.registered}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      registered: event.target.value,
                    }))
                  }
                  type="number"
                  fullWidth
                />

                <TextField
                  label="12.2 จำนวนนักศึกษาที่คงอยู่สิ้นสุดภาคการศึกษา"
                  value={form.remained}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      remained: event.target.value,
                    }))
                  }
                  type="number"
                  fullWidth
                />

                <TextField
                  label="12.3 จำนวนนักศึกษาที่ถอน (W)"
                  value={form.withdrewW}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      withdrewW: event.target.value,
                    }))
                  }
                  type="number"
                  fullWidth
                />
              </Box>

              <Box className={styles.subSectionBlock}>
                <Typography className={styles.subSectionTitle}>
                  12.4 การกระจายของระดับคะแนน (เกรด)
                </Typography>

                <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                  <Table size="small" className={styles.gradeTable}>
                    <TableHead>
                      <TableRow>
                        <TableCell width="18%">ระดับคะแนน</TableCell>
                        <TableCell width="28%">ช่วงระดับคะแนน</TableCell>
                        <TableCell width="27%">รวม (คน)</TableCell>
                        <TableCell width="27%">%</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {gradeRows.map((item) => (
                        <TableRow key={item.grade}>
                          <TableCell className={styles.centerCell}>
                            {item.grade}
                          </TableCell>

                          <TableCell className={styles.centerCell}>
                            {item.range}
                          </TableCell>

                          <TableCell className={styles.centerCell}>
                            <TextField
                              size="small"
                              type="number"
                              value={gradeCounts[item.grade]}
                              onChange={(event) =>
                                setGradeCounts((prev) => ({
                                  ...prev,
                                  [item.grade]: event.target.value,
                                }))
                              }
                              className={styles.gradeInput}
                            />
                          </TableCell>

                          <TableCell className={styles.centerCell}>
                            {getGradePercent(item.grade)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Box className={styles.subSectionBlock}>
                <Typography className={styles.subSectionTitle}>
                  12.5 ปัจจัยที่ทำให้ระดับคะแนนผิดปกติ (ถ้ามี)
                </Typography>

                {renderPopupField(
                  '12.5 ปัจจัยที่ทำให้ระดับคะแนนผิดปกติ (ถ้ามี)',
                  'abnormalReason',
                  4
                )}
              </Box>

              <Box className={styles.subSectionBlock}>
                <Typography className={styles.subSectionTitle}>
                  12.6 ความคลาดเคลื่อนจากแผนการประเมินฯ (ถ้ามี)
                </Typography>

                <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                  <Table size="small" className={styles.fixedWideTable}>
                    <TableHead>
                      <TableRow>
                        <TableCell width="45%">ความคลาดเคลื่อน</TableCell>
                        <TableCell width="45%">เหตุผล</TableCell>
                        <TableCell width="10%" />
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {rows126.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {renderRow126Field(
                              index,
                              'deviation',
                              `12.6 ความคลาดเคลื่อน (รายการที่ ${index + 1})`,
                              2
                            )}
                          </TableCell>

                          <TableCell>
                            {renderRow126Field(
                              index,
                              'reason',
                              `12.6 เหตุผล (รายการที่ ${index + 1})`,
                              2
                            )}
                          </TableCell>

                          <TableCell className={styles.actionCell}>
                            <IconButton
                              color="error"
                              onClick={() => removeRow126(index)}
                              disabled={rows126.length === 1}
                              className={styles.deleteButton}
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
                  variant="outlined"
                  onClick={addRow126}
                  className={styles.addButton}
                >
                  เพิ่มแถว (12.6)
                </Button>
              </Box>
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button
              variant="outlined"
              startIcon={<NavigateBeforeIcon />}
              className={styles.backButton}
              onClick={() => navigate('/mqa5Insert-1')}
            >
              ย้อนกลับ
            </Button>

            <Button
              variant="contained"
              endIcon={<NavigateNextIcon />}
              className={styles.nextButton}
              onClick={() => navigate('/mqa5Insert-3')}
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

export default Mqa5Insert2Page