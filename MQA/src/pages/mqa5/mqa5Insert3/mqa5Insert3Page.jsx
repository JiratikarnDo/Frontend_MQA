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
import Mqa5FormNav from '../../../components/mqa5/mqa5FormNav'
import styles from './mqa5Insert3Page.module.css'

function Mqa5Insert3Page() {
  const navigate = useNavigate()

  const [sec13, setSec13] = useState({
    issue131: '',
    impact131: '',
    issue132: '',
    impact132: '',
  })

  const [sec141, setSec141] = useState({
    critique: '',
    teacherComment: '',
  })

  const [rows142, setRows142] = useState([
    { critique: '', teacherComment: '' },
  ])

  const [popup, setPopup] = useState({
    open: false,
    title: '',
    value: '',
    mode: '',
    field: '',
    rowIndex: null,
    rowField: '',
  })

  const openPopupForSec13 = (field, title) => {
    setPopup({
      open: true,
      title,
      value: sec13[field] || '',
      mode: 'sec13',
      field,
      rowIndex: null,
      rowField: '',
    })
  }

  const openPopupForSec141 = (field, title) => {
    setPopup({
      open: true,
      title,
      value: sec141[field] || '',
      mode: 'sec141',
      field,
      rowIndex: null,
      rowField: '',
    })
  }

  const openPopupForRow142 = (rowIndex, rowField, title) => {
    setPopup({
      open: true,
      title,
      value: rows142[rowIndex]?.[rowField] || '',
      mode: 'row142',
      field: '',
      rowIndex,
      rowField,
    })
  }

  const closePopup = () => {
    setPopup((prev) => ({
      ...prev,
      open: false,
    }))
  }

  const savePopup = () => {
    if (popup.mode === 'sec13') {
      setSec13((prev) => ({
        ...prev,
        [popup.field]: popup.value,
      }))
    }

    if (popup.mode === 'sec141') {
      setSec141((prev) => ({
        ...prev,
        [popup.field]: popup.value,
      }))
    }

    if (popup.mode === 'row142') {
      setRows142((prev) => {
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

  const renderPopupField = (value, onClickTitle, openFn, minRows = 4, extraClassName = '') => (
    <TextField
      fullWidth
      multiline
      minRows={minRows}
      maxRows={minRows}
      value={value}
      placeholder="คลิกเพื่อกรอกข้อมูล"
      InputProps={{ readOnly: true }}
      onClick={() => openFn(onClickTitle.field, onClickTitle.title)}
      className={`${styles.popupPreviewField} ${extraClassName}`}
    />
  )

  const renderRow142Field = (rowIndex, rowField, title, minRows = 3) => (
    <TextField
      fullWidth
      multiline
      minRows={minRows}
      maxRows={minRows}
      value={rows142[rowIndex]?.[rowField] || ''}
      placeholder="คลิกเพื่อกรอกข้อมูล"
      InputProps={{ readOnly: true }}
      onClick={() => openPopupForRow142(rowIndex, rowField, title)}
      className={styles.compactPreviewField}
    />
  )

  const addRow142 = () => {
    setRows142((prev) => [
      ...prev,
      { critique: '', teacherComment: '' },
    ])
  }

  const removeRow142 = (index) => {
    setRows142((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Mqa5FormNav currentStep={3} />

        <Box className={styles.formShell}>
          <Box className={styles.formHeader}>
            <Box>
              <Typography className={styles.pageTitle}>
                การพัฒนานักศึกษาตามผลลัพธ์การเรียนรู้ที่คาดหวัง
              </Typography>
              <Typography className={styles.pageDescription}>
                กรอกข้อมูลตามแบบฟอร์มเดิมของหัวข้อ 13 - 14 สำหรับแบบฟอร์ม มคอ.5
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
                13. ปัญหาและผลกระทบต่อการดำเนินการ
              </Typography>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.subSectionTitle}>
                13.1 ประเด็นด้านทรัพยากรประกอบการเรียนและสิ่งอำนวยความสะดวก
              </Typography>

              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.fixedWideTable}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="50%">
                        ปัญหาในการใช้แหล่งทรัพยากรประกอบการเรียนการสอน
                      </TableCell>
                      <TableCell width="50%">
                        ผลกระทบต่อการเรียนรู้
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    <TableRow>
                      <TableCell>
                        {renderPopupField(
                          sec13.issue131,
                          {
                            field: 'issue131',
                            title: '13.1 ปัญหาในการใช้แหล่งทรัพยากรประกอบการเรียนการสอน',
                          },
                          openPopupForSec13,
                          4
                        )}
                      </TableCell>

                      <TableCell>
                        {renderPopupField(
                          sec13.impact131,
                          {
                            field: 'impact131',
                            title: '13.1 ผลกระทบต่อการเรียนรู้',
                          },
                          openPopupForSec13,
                          4
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.subSectionTitle}>
                13.2 ประเด็นด้านการบริหารและองค์กร
              </Typography>

              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.fixedWideTable}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="50%">
                        ปัญหาด้านการบริหารและองค์กร
                      </TableCell>
                      <TableCell width="50%">
                        ผลกระทบต่อการเรียนรู้
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    <TableRow>
                      <TableCell>
                        {renderPopupField(
                          sec13.issue132,
                          {
                            field: 'issue132',
                            title: '13.2 ปัญหาด้านการบริหารและองค์กร',
                          },
                          openPopupForSec13,
                          4
                        )}
                      </TableCell>

                      <TableCell>
                        {renderPopupField(
                          sec13.impact132,
                          {
                            field: 'impact132',
                            title: '13.2 ผลกระทบต่อการเรียนรู้',
                          },
                          openPopupForSec13,
                          4
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.sectionTitle}>
                14. การประเมินรายวิชา
              </Typography>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.subSectionTitle}>
                14.1 ผลการประเมินรายวิชาโดยนักศึกษาในระบบทะเบียน (แนบผลการประเมินจากระบบ)
              </Typography>

              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.fixedWideTable}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="50%">
                        ข้อวิพากษ์สำคัญจากผลการประเมินโดยนักศึกษา
                      </TableCell>
                      <TableCell width="50%">
                        ความเห็นของอาจารย์ผู้สอนต่อข้อวิพากษ์
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    <TableRow>
                      <TableCell>
                        {renderPopupField(
                          sec141.critique,
                          {
                            field: 'critique',
                            title: '14.1 ข้อวิพากษ์สำคัญจากผลการประเมินโดยนักศึกษา',
                          },
                          openPopupForSec141,
                          4
                        )}
                      </TableCell>

                      <TableCell>
                        {renderPopupField(
                          sec141.teacherComment,
                          {
                            field: 'teacherComment',
                            title: '14.1 ความเห็นของอาจารย์ผู้สอนต่อข้อวิพากษ์',
                          },
                          openPopupForSec141,
                          4
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box className={styles.sectionBlock}>
              <Typography className={styles.subSectionTitle}>
                14.2 ผลการประเมินรายวิชาโดยวิธีอื่น (เช่น การฟังเสียงสะท้อนจากนักศึกษาในห้องเรียน)
              </Typography>

              <TableContainer component={Paper} variant="outlined" className={styles.tableWrap}>
                <Table size="small" className={styles.fixedWideTable}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="45%">
                        ข้อวิพากษ์สำคัญจากผลการประเมินโดยวิธีอื่น
                      </TableCell>
                      <TableCell width="45%">
                        ความเห็นของอาจารย์ผู้สอนต่อข้อวิพากษ์
                      </TableCell>
                      <TableCell width="10%" />
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows142.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box className={styles.indexedFieldWrap}>
                            <Typography className={styles.inlineIndex}>
                              {index + 1}.
                            </Typography>

                            <Box className={styles.inlineField}>
                              {renderRow142Field(
                                index,
                                'critique',
                                `14.2 ข้อวิพากษ์สำคัญจากผลการประเมินโดยวิธีอื่น (รายการที่ ${index + 1})`,
                                3
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box className={styles.indexedFieldWrap}>
                            <Typography className={styles.inlineIndex}>
                              {index + 1}.
                            </Typography>

                            <Box className={styles.inlineField}>
                              {renderRow142Field(
                                index,
                                'teacherComment',
                                `14.2 ความเห็นของอาจารย์ผู้สอนต่อข้อวิพากษ์ (รายการที่ ${index + 1})`,
                                3
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell className={styles.actionCell}>
                          <IconButton
                            color="error"
                            onClick={() => removeRow142(index)}
                            disabled={rows142.length === 1}
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
                onClick={addRow142}
                className={styles.addButton}
              >
                เพิ่มข้อ (14.2)
              </Button>
            </Box>
          </Box>

          <Box className={styles.actionBar}>
            <Button
              variant="outlined"
              startIcon={<NavigateBeforeIcon />}
              className={styles.backButton}
              onClick={() => navigate('/mqa5Insert-2')}
            >
              ย้อนกลับ
            </Button>

            <Button
              variant="contained"
              endIcon={<NavigateNextIcon />}
              className={styles.nextButton}
              onClick={() => navigate('/mqa5Insert-4')}
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

export default Mqa5Insert3Page