import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import Mqa5FormNav from '../../../components/mqa5/mqa5FormNav'
import styles from './mqa5Insert4Page.module.css'

function createCourseSigner() {
  return {
    name: '',
    signature: '',
    date: '',
  }
}

function createProgramSigner() {
  return {
    name: '',
    signature: '',
    date: '',
  }
}

function Mqa5Insert4Page() {
  const navigate = useNavigate()

  const [plan151, setPlan151] = useState('')
  const [result151, setResult151] = useState('')

  const [items152, setItems152] = useState([''])
  const [items153, setItems153] = useState([''])
  const [items16, setItems16] = useState([''])

  const [rows154, setRows154] = useState([
    { suggestion: '', due: '', owner: '' },
  ])

  const [courseSigners, setCourseSigners] = useState([createCourseSigner()])
  const [programSigners, setProgramSigners] = useState([createProgramSigner()])

  const [popup, setPopup] = useState({
    open: false,
    title: '',
    value: '',
    mode: '',
    itemIndex: null,
    rowIndex: null,
    rowField: '',
    field: '',
  })

  const openPopupForSimple = (field, title, value) => {
    setPopup({
      open: true,
      title,
      value: value || '',
      mode: field,
      itemIndex: null,
      rowIndex: null,
      rowField: '',
      field,
    })
  }

  const openPopupForList = (mode, itemIndex, title, value) => {
    setPopup({
      open: true,
      title,
      value: value || '',
      mode,
      itemIndex,
      rowIndex: null,
      rowField: '',
      field: '',
    })
  }

  const openPopupForRow154 = (rowIndex, rowField, title, value) => {
    setPopup({
      open: true,
      title,
      value: value || '',
      mode: 'row154',
      itemIndex: null,
      rowIndex,
      rowField,
      field: '',
    })
  }

  const closePopup = () => {
    setPopup((prev) => ({
      ...prev,
      open: false,
    }))
  }

  const savePopup = () => {
    if (popup.mode === 'plan151') {
      setPlan151(popup.value)
    }

    if (popup.mode === 'items152') {
      setItems152((prev) => {
        const next = [...prev]
        next[popup.itemIndex] = popup.value
        return next
      })
    }

    if (popup.mode === 'items153') {
      setItems153((prev) => {
        const next = [...prev]
        next[popup.itemIndex] = popup.value
        return next
      })
    }

    if (popup.mode === 'items16') {
      setItems16((prev) => {
        const next = [...prev]
        next[popup.itemIndex] = popup.value
        return next
      })
    }

    if (popup.mode === 'row154') {
      setRows154((prev) => {
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

  const toggleResult151 = (value) => {
    setResult151((prev) => (prev === value ? '' : value))
  }

  const addListItem = (setter) => {
    setter((prev) => [...prev, ''])
  }

  const removeListItem = (setter, index) => {
    setter((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const addRow154 = () => {
    setRows154((prev) => [
      ...prev,
      { suggestion: '', due: '', owner: '' },
    ])
  }

  const removeRow154 = (index) => {
    setRows154((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const addCourseSigner = () => {
    setCourseSigners((prev) => [...prev, createCourseSigner()])
  }

  const removeCourseSigner = (index) => {
    setCourseSigners((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const updateCourseSignerField = (index, field, value) => {
    setCourseSigners((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        [field]: value,
      }
      return next
    })
  }

  const addProgramSigner = () => {
    setProgramSigners((prev) => [...prev, createProgramSigner()])
  }

  const removeProgramSigner = (index) => {
    setProgramSigners((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const updateProgramSignerField = (index, field, value) => {
    setProgramSigners((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        [field]: value,
      }
      return next
    })
  }

  const renderPopupField = (value, onClick, minRows = 4, extraClassName = '') => (
    <TextField
      fullWidth
      multiline
      minRows={minRows}
      maxRows={minRows}
      value={value}
      placeholder="คลิกเพื่อกรอกข้อมูล"
      InputProps={{ readOnly: true }}
      onClick={onClick}
      className={`${styles.popupPreviewField} ${extraClassName}`}
    />
  )

  const renderListSection = (title, items, mode, setter, isNumbered = false, hint = '') => (
    <Box className={styles.sectionBlock}>
      <Typography className={styles.subSectionTitle}>
        {title}
      </Typography>

      {hint && (
        <Typography className={styles.helperText}>
          {hint}
        </Typography>
      )}

      <Box className={styles.listWrap}>
        {items.map((item, index) => (
          <Box key={index} className={styles.listRow}>
            <Typography className={styles.listPrefix}>
              {isNumbered ? `${index + 1}.` : '■'}
            </Typography>

            <Box className={styles.listField}>
              {renderPopupField(
                item,
                () =>
                  openPopupForList(
                    mode,
                    index,
                    `${title} (ข้อ ${index + 1})`,
                    item
                  ),
                2,
                styles.compactPreviewField
              )}
            </Box>

            <IconButton
              color="error"
              onClick={() => removeListItem(setter, index)}
              disabled={items.length === 1}
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
        onClick={() => addListItem(setter)}
        className={styles.addButton}
      >
        เพิ่มข้อ
      </Button>
    </Box>
  )

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Mqa5FormNav currentStep={4} />

        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>
                แผนการปรับปรุง
              </Typography>
              <Typography className={styles.pageDescription}>
                กรอกข้อมูลตามแบบฟอร์มเดิมของหัวข้อ 15 - 16 และข้อมูลลงชื่อสำหรับแบบฟอร์ม มคอ.5
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
                15. แผนการปรับปรุง
              </Typography>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.subSectionTitle}>
                15.1 ความก้าวหน้าของการปรับปรุงการเรียนการสอนตามที่เสนอในรายวิชาครั้งที่ผ่านมา (ถ้ามี)
              </Typography>

              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.fixedWideTable}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="70%">
                        แผนการปรับปรุงที่เสนอในภาคการศึกษา/ปีการศึกษาที่ผ่านมา
                      </TableCell>
                      <TableCell width="30%">
                        ผลการดำเนินการ
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    <TableRow>
                      <TableCell>
                        {renderPopupField(
                          plan151,
                          () =>
                            openPopupForSimple(
                              'plan151',
                              '15.1 แผนการปรับปรุงที่เสนอในภาคการศึกษา/ปีการศึกษาที่ผ่านมา',
                              plan151
                            ),
                          4
                        )}
                      </TableCell>

                      <TableCell>
                        <Box className={styles.checkboxGroup}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={result151 === 'done'}
                                onChange={() => toggleResult151('done')}
                              />
                            }
                            label="ปรับปรุงแล้ว"
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={result151 === 'no'}
                                onChange={() => toggleResult151('no')}
                              />
                            }
                            label="ไม่ได้ปรับปรุง"
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={result151 === 'partial'}
                                onChange={() => toggleResult151('partial')}
                              />
                            }
                            label="ปรับปรุงแต่ไม่เสร็จสมบูรณ์"
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {renderListSection(
              '15.2 การดำเนินการอื่น ๆ ในการปรับปรุงรายวิชาให้สอดคล้องผลลัพธ์การเรียนรู้ (PLO)',
              items152,
              'items152',
              setItems152,
              false,
              '(เช่น เพิ่มตัวอย่างให้นักศึกษา / อภิปรายกลุ่มย่อย / เชิญวิทยากร / โปรแกรมออกแบบผลงาน ฯลฯ)'
            )}

            {renderListSection(
              '15.3 ข้อเสนอแนะของอาจารย์ผู้รับผิดชอบรายวิชาต่ออาจารย์ผู้รับผิดชอบหลักสูตร',
              items153,
              'items153',
              setItems153,
              false
            )}

            <Box className={styles.sectionBlock}>
              <Typography className={styles.subSectionTitle}>
                15.4 ข้อเสนอแผนการปรับปรุงสำหรับภาคการศึกษา/ปีการศึกษาต่อไปที่มีความสอดคล้องกับผลลัพธ์การเรียนรู้ (PLO) ของหลักสูตร
              </Typography>

              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.fixedWideTable}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="50%">ข้อเสนอ</TableCell>
                      <TableCell width="25%">กำหนดเวลาแล้วเสร็จ</TableCell>
                      <TableCell width="17%">ผู้รับผิดชอบ</TableCell>
                      <TableCell width="8%" />
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows154.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box className={styles.indexedFieldWrap}>
                            <Typography className={styles.inlineIndex}>
                              {index + 1}.
                            </Typography>

                            <Box className={styles.inlineField}>
                              {renderPopupField(
                                row.suggestion,
                                () =>
                                  openPopupForRow154(
                                    index,
                                    'suggestion',
                                    `15.4 ข้อเสนอ (ข้อ ${index + 1})`,
                                    row.suggestion
                                  ),
                                3,
                                styles.compactPreviewField
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          {renderPopupField(
                            row.due,
                            () =>
                              openPopupForRow154(
                                index,
                                'due',
                                `15.4 กำหนดเวลาแล้วเสร็จ (ข้อ ${index + 1})`,
                                row.due
                              ),
                            2,
                            styles.compactPreviewField
                          )}
                        </TableCell>

                        <TableCell>
                          {renderPopupField(
                            row.owner,
                            () =>
                              openPopupForRow154(
                                index,
                                'owner',
                                `15.4 ผู้รับผิดชอบ (ข้อ ${index + 1})`,
                                row.owner
                              ),
                            2,
                            styles.compactPreviewField
                          )}
                        </TableCell>

                        <TableCell className={styles.actionCell}>
                          <IconButton
                            color="error"
                            onClick={() => removeRow154(index)}
                            disabled={rows154.length === 1}
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
                onClick={addRow154}
                className={styles.addButton}
              >
                เพิ่มแถว (15.4)
              </Button>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                16. แผนการบูรณาการระหว่างรายวิชา
              </Typography>

              <Typography className={styles.helperText}>
                (อธิบายการเชื่อมโยงรายวิชากับรายวิชาอื่น เช่น รายวิชาพื้นฐานที่สนับสนุนความเข้าใจ หรือรายวิชาต่อเนื่อง)
              </Typography>
            </Box>

            {renderListSection(
              'ตัวอย่าง/รายการบูรณาการ',
              items16,
              'items16',
              setItems16,
              true
            )}

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                ข้อมูลลงชื่อ
              </Typography>

              <Box className={styles.signGroup}>
                <Box className={styles.signHeaderRow}>
                  <Typography className={styles.subSectionTitle}>
                    ผู้ลงนามรายวิชา
                  </Typography>

                  <Button
                    startIcon={<AddCircleOutlineIcon />}
                    variant="outlined"
                    onClick={addCourseSigner}
                    className={styles.addButton}
                  >
                    เพิ่มชุดรายวิชา
                  </Button>
                </Box>

                <Box className={styles.signerWrap}>
                  {courseSigners.map((signer, index) => (
                    <Box key={index} className={styles.signerCard}>
                      <Box className={styles.signerTopRow}>
                        <TextField
                          label="ชื่ออาจารย์ผู้รับผิดชอบรายวิชา"
                          value={signer.name}
                          onChange={(event) =>
                            updateCourseSignerField(index, 'name', event.target.value)
                          }
                          fullWidth
                        />

                        <IconButton
                          color="error"
                          onClick={() => removeCourseSigner(index)}
                          disabled={courseSigners.length === 1}
                          className={styles.deleteSignerButton}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Box>

                      <Box className={styles.signerBottomRow}>
                        <TextField
                          label="ลงชื่อ"
                          value={signer.signature}
                          onChange={(event) =>
                            updateCourseSignerField(index, 'signature', event.target.value)
                          }
                          fullWidth
                        />

                        <TextField
                          type="date"
                          label="วันที่รายงาน"
                          value={signer.date}
                          onChange={(event) =>
                            updateCourseSignerField(index, 'date', event.target.value)
                          }
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box className={styles.signGroup}>
                <Box className={styles.signHeaderRow}>
                  <Typography className={styles.subSectionTitle}>
                    ผู้ลงนามหลักสูตร
                  </Typography>

                  <Button
                    startIcon={<AddCircleOutlineIcon />}
                    variant="outlined"
                    onClick={addProgramSigner}
                    className={styles.addButton}
                  >
                    เพิ่มชุดหลักสูตร
                  </Button>
                </Box>

                <Box className={styles.signerWrap}>
                  {programSigners.map((signer, index) => (
                    <Box key={index} className={styles.signerCard}>
                      <Box className={styles.signerTopRow}>
                        <TextField
                          label="ชื่ออาจารย์ผู้รับผิดชอบหลักสูตร"
                          value={signer.name}
                          onChange={(event) =>
                            updateProgramSignerField(index, 'name', event.target.value)
                          }
                          fullWidth
                        />

                        <IconButton
                          color="error"
                          onClick={() => removeProgramSigner(index)}
                          disabled={programSigners.length === 1}
                          className={styles.deleteSignerButton}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Box>

                      <Box className={styles.signerBottomRow}>
                        <TextField
                          label="ลงชื่อ"
                          value={signer.signature}
                          onChange={(event) =>
                            updateProgramSignerField(index, 'signature', event.target.value)
                          }
                          fullWidth
                        />

                        <TextField
                          type="date"
                          label="วันที่รับรายงาน"
                          value={signer.date}
                          onChange={(event) =>
                            updateProgramSignerField(index, 'date', event.target.value)
                          }
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button
              variant="outlined"
              startIcon={<NavigateBeforeIcon />}
              className={styles.backButton}
              onClick={() => navigate('/mqa5Insert-3')}
            >
              ย้อนกลับ
            </Button>

            <Button
              variant="contained"
              className={styles.nextButton}
            >
              บันทึก
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
export default Mqa5Insert4Page