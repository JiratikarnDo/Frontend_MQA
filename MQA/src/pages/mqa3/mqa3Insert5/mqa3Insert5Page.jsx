import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import styles from './mqa3Insert5Page.module.css'

function mqa3Insert5Page() {
  const navigate = useNavigate()

  const [rows16, setRows16] = useState([
    { clo: '', activities: '', weeks: '', percent: '' },
  ])

  const [exam16, setExam16] = useState({
    label: 'คะแนนสอบกลางภาคและปลายภาค (รวมทุก CLO)',
    items: [
      { name: 'สอบกลางภาค', week: '9', percent: '20' },
      { name: 'สอบปลายภาค', week: '17', percent: '30' },
    ],
  })

  const [popup, setPopup] = useState({
    open: false,
    title: '',
    value: '',
    onSave: null,
  })

  const openPopup = (title, value, onSave) => {
    setPopup({
      open: true,
      title,
      value,
      onSave,
    })
  }

  const closePopup = () => {
    setPopup((prev) => ({
      ...prev,
      open: false,
    }))
  }

  const savePopup = () => {
    popup.onSave?.(popup.value)
    closePopup()
  }

  const renderROCell = (value, title, onSave, rows = 3) => (
    <TextField
      fullWidth
      multiline
      rows={rows}
      value={value}
      placeholder="คลิกเพื่อกรอกข้อมูล"
      InputProps={{ readOnly: true }}
      onClick={() => openPopup(title, value, onSave)}
      size="small"
      className={styles.popupPreviewField}
    />
  )

  const addRow16 = () => {
    setRows16((prev) => [
      ...prev,
      { clo: '', activities: '', weeks: '', percent: '' },
    ])
  }

  const removeRow16 = (index) => {
    setRows16((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const updateRow16 = (index, field, value) => {
    setRows16((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        [field]: value,
      }
      return next
    })
  }

  const addExamItem16 = () => {
    setExam16((prev) => ({
      ...prev,
      items: [...prev.items, { name: 'สอบ...', week: '', percent: '' }],
    }))
  }

  const removeExamItem16 = (index) => {
    setExam16((prev) => {
      if (prev.items.length === 1) return prev
      return {
        ...prev,
        items: prev.items.filter((_, itemIndex) => itemIndex !== index),
      }
    })
  }

  const updateExamItem16 = (index, field, value) => {
    setExam16((prev) => {
      const nextItems = [...prev.items]
      nextItems[index] = {
        ...nextItems[index],
        [field]: value,
      }
      return {
        ...prev,
        items: nextItems,
      }
    })
  }

  const sumPercent = (values) =>
    values.reduce((total, item) => total + (Number.parseFloat(item) || 0), 0)

  const cloTotal = sumPercent(rows16.map((row) => row.percent))
  const examTotal = sumPercent(exam16.items.map((item) => item.percent))
  const total = Math.round((cloTotal + examTotal) * 100) / 100
  const totalColor = total === 100 ? 'text.primary' : 'error.main'

  const [agreements17, setAgreements17] = useState([''])
  const [integration18, setIntegration18] = useState([''])
  const [books19, setBooks19] = useState([''])
  const [websites19, setWebsites19] = useState([''])

  const updateListItem = (setter, index, value) => {
    setter((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const addListItem = (setter) => {
    setter((prev) => [...prev, ''])
  }

  const removeListItem = (setter, index, minItems = 1) => {
    setter((prev) => {
      if (prev.length <= minItems) return prev
      return prev.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const NumberedListEditor = ({
    title,
    items,
    setItems,
    minItems = 1,
    addLabel = 'เพิ่มข้อ',
    placeholder = 'คลิกเพื่อกรอกข้อมูล',
  }) => (
    <Box className={styles.numberedListBlock}>
      <Typography className={styles.subSectionTitle}>
        {title}
      </Typography>

      {items.map((text, index) => (
        <Box key={index} className={styles.listRow}>
          <Typography className={styles.listIndex}>
            {index + 1}.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={1}
            value={text}
            placeholder={placeholder}
            InputProps={{ readOnly: true }}
            onClick={() =>
              openPopup(
                `${title} (ข้อ ${index + 1})`,
                text,
                (value) => updateListItem(setItems, index, value),
              )
            }
            size="small"
            className={styles.popupPreviewField}
          />

          <IconButton
            color="error"
            onClick={() => removeListItem(setItems, index, minItems)}
            disabled={items.length <= minItems}
            className={styles.listDeleteButton}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Box>
      ))}

      <Button
        startIcon={<AddCircleOutlineIcon />}
        onClick={() => addListItem(setItems)}
        className={styles.addButton}
      >
        {addLabel}
      </Button>
    </Box>
  )

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Mqa3FormNav currentStep={5} />

        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>
                การประเมินผล
              </Typography>
              <Typography className={styles.pageDescription}>
                กรอกข้อมูลตามแบบฟอร์มเดิมของหัวข้อ 16 - 19
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
                16. แผนการประเมินผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา
              </Typography>

              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.assessmentTable}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="30%" align="center">
                        ผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา (CLOs)
                      </TableCell>
                      <TableCell width="35%" align="center">
                        กิจกรรมการประเมินผลการเรียนรู้ของผู้เรียน
                      </TableCell>
                      <TableCell width="20%" align="center">
                        กำหนดการประเมิน (สัปดาห์ที่)
                      </TableCell>
                      <TableCell width="10%" align="center">
                        สัดส่วนของการประเมินผล (%)
                      </TableCell>
                      <TableCell width="5%" align="center" />
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows16.map((row, index) => (
                      <TableRow key={`clo-${index}`} hover>
                        <TableCell>
                          {renderROCell(
                            row.clo,
                            'ผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา (CLOs)',
                            (value) => updateRow16(index, 'clo', value),
                            3,
                          )}
                        </TableCell>

                        <TableCell>
                          {renderROCell(
                            row.activities,
                            'กิจกรรมการประเมินผลการเรียนรู้ของผู้เรียน',
                            (value) => updateRow16(index, 'activities', value),
                            3,
                          )}
                        </TableCell>

                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                            placeholder="เช่น 1-2, 15"
                            value={row.weeks}
                            onChange={(event) =>
                              updateRow16(index, 'weeks', event.target.value)
                            }
                            className={styles.fixedTextField}
                          />
                        </TableCell>

                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            placeholder="0"
                            value={row.percent}
                            onChange={(event) =>
                              updateRow16(index, 'percent', event.target.value)
                            }
                            inputProps={{ min: 0 }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <IconButton
                            color="error"
                            onClick={() => removeRow16(index)}
                            disabled={rows16.length === 1}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}

                    {exam16.items.map((item, index) => (
                      <TableRow key={`exam-${index}`} hover>
                        {index === 0 && (
                          <TableCell rowSpan={exam16.items.length} className={styles.examLabelCell}>
                            {renderROCell(
                              exam16.label,
                              'หัวข้อสรุปท้ายตาราง',
                              (value) =>
                                setExam16((prev) => ({
                                  ...prev,
                                  label: value,
                                })),
                              3,
                            )}
                          </TableCell>
                        )}

                        <TableCell>
                          <Box className={styles.examNameWrap}>
                            <Typography className={styles.examBullet}>■</Typography>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="ชื่อรายการ (เช่น สอบกลางภาค)"
                              value={item.name}
                              onChange={(event) =>
                                updateExamItem16(index, 'name', event.target.value)
                              }
                            />
                          </Box>
                        </TableCell>

                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="สัปดาห์ที่ (เช่น 9)"
                            value={item.week}
                            onChange={(event) =>
                              updateExamItem16(index, 'week', event.target.value)
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            placeholder="0"
                            value={item.percent}
                            onChange={(event) =>
                              updateExamItem16(index, 'percent', event.target.value)
                            }
                            inputProps={{ min: 0 }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <IconButton
                            color="error"
                            onClick={() => removeExamItem16(index)}
                            disabled={exam16.items.length === 1}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}

                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography fontWeight="bold">รวม</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontWeight="bold" sx={{ color: totalColor }}>
                          {total}
                        </Typography>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box className={styles.addButtonRow}>
                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={addRow16}
                  className={styles.addButton}
                >
                  เพิ่มรายการ CLO
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={addExamItem16}
                  className={styles.addButton}
                >
                  เพิ่มรายการสอบ (ท้ายตาราง)
                </Button>
              </Box>
            </Box>

            <Divider className={styles.divider} />

            <NumberedListEditor
              title="17. ข้อตกลงร่วมกันระหว่างผู้เรียนและผู้สอน"
              items={agreements17}
              setItems={setAgreements17}
              minItems={1}
              addLabel="เพิ่มข้อ"
              placeholder="คลิกเพื่อกรอกข้อมูล"
            />

            <Divider className={styles.divider} />

            <NumberedListEditor
              title="18. แผนการบูรณาการระหว่างรายวิชา"
              items={integration18}
              setItems={setIntegration18}
              minItems={1}
              addLabel="เพิ่มข้อ"
              placeholder="คลิกเพื่อกรอกข้อมูล"
            />

            <Divider className={styles.divider} />

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                19. ตำราและเอกสารที่ใช้ประกอบการเรียนการสอน
              </Typography>

              <NumberedListEditor
                title="หนังสือและเอกสารประกอบการสอน"
                items={books19}
                setItems={setBooks19}
                minItems={1}
                addLabel="เพิ่มรายการหนังสือ/เอกสาร"
                placeholder="คลิกเพื่อกรอกข้อมูล"
              />

              <Divider className={styles.divider} />

              <NumberedListEditor
                title="เว็บไซต์และแหล่งข้อมูลออนไลน์"
                items={websites19}
                setItems={setWebsites19}
                minItems={1}
                addLabel="เพิ่มรายการเว็บไซต์/แหล่งข้อมูล"
                placeholder="คลิกเพื่อกรอกข้อมูล"
              />
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button
              variant="outlined"
              startIcon={<NavigateBeforeIcon />}
              className={styles.backButton}
              onClick={() => navigate('/mqa3Insert-4')}
            >
              ย้อนกลับ
            </Button>

            <Button
              variant="contained"
              endIcon={<NavigateNextIcon />}
              className={styles.nextButton}
              disabled
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

export default mqa3Insert5Page