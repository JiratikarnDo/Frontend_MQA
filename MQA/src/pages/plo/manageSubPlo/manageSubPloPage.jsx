import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import PlaylistAddRoundedIcon from '@mui/icons-material/PlaylistAddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import styles from './manageSubPloPage.module.css'

const ploMasterList = [
  {
    id: 1,
    code: 'PLO1',
    title:
      'เสริมสร้างความเป็นมนุษย์ให้พร้อมสำหรับโลกในปัจจุบันและอนาคต เพื่อให้เป็นบุคคลผู้ใฝ่รู้และมีทักษะที่จำเป็นสำหรับศตวรรษที่ 21',
  },
  {
    id: 2,
    code: 'PLO2',
    title:
      'เป็นผู้ตระหนักรู้ถึงการบูรณาการศาสตร์ต่าง ๆ ในการพัฒนาหรือแก้ไขปัญหา เป็นผู้ที่สามารถสร้างโอกาสและคุณค่าให้ตนเองและสังคม รู้เท่าทันการเปลี่ยนแปลงของสังคมและของโลก',
  },
  {
    id: 3,
    code: 'PLO3',
    title:
      'เป็นบุคคลที่ดำรงตนเป็นพลเมืองที่เข้มแข็ง มีจริยธรรมและยึดมั่นในสิ่งที่ถูกต้อง รู้คุณค่าและรักษาชาติกำเนิด ร่วมมือรวมพลังเพื่อสร้างสรรค์และพัฒนาสังคมอย่างยั่งยืน',
  },
  {
    id: 4,
    code: 'PLO4',
    title:
      'เป็นบุคคลที่สามารถสื่อสารได้อย่างมีประสิทธิภาพทั้งในการพูด การฟัง การอ่าน การเขียน และเลือกใช้รูปแบบการนำเสนอที่เหมาะสมสำหรับกลุ่มบุคคลที่แตกต่างกันได้',
  },
  {
    id: 5,
    code: 'PLO5',
    title:
      'อธิบายหลักการออกแบบเบื้องต้นและมีความรู้และแนวคิดด้านศิลปะ เทคโนโลยีดิจิทัล รวมถึงความเป็นผู้ประกอบการ',
  },
  {
    id: 6,
    code: 'PLO6',
    title:
      'ผู้เรียนสามารถประยุกต์ใช้ซอฟต์แวร์และเครื่องมือต่าง ๆ เพื่อใช้ในการสร้างสรรค์สื่อดิจิทัล เพื่อสื่อสารต่อกลุ่มเป้าหมายได้อย่างเหมาะสมและมีความรับผิดชอบต่อสื่อดิจิทัลที่สร้างขึ้น',
  },
  {
    id: 7,
    code: 'PLO7',
    title:
      'ผู้เรียนสามารถออกแบบและสร้างสรรค์สื่อดิจิทัลได้ โดยไม่ขัดต่อกฎ กติกา ของวิชาชีพ',
  },
  {
    id: 8,
    code: 'PLO8',
    title:
      'ผู้เรียนสามารถนำเสนอผลงานการออกแบบและสร้างสรรค์สื่อดิจิทัลได้ตรงตามความต้องการของกลุ่มเป้าหมายหรือผู้ประกอบการ อย่างซื่อสัตย์ต่อวิชาชีพ',
  },
]

const initialSubPloMap = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
  8: [],
}

function getNextSubPloCode(ploId, subPloMap) {
  const currentItems = subPloMap[ploId] ?? []
  const currentNumbers = currentItems
    .map((item) => Number(item.code.split('.')[1]))
    .filter((value) => !Number.isNaN(value))

  const nextNumber =
    currentNumbers.length > 0 ? Math.max(...currentNumbers) + 1 : 1

  return `${ploId}.${nextNumber}`
}

function sortSubPloItems(subPloItems) {
  return [...subPloItems].sort((firstItem, secondItem) => {
    const [firstMain, firstSub] = firstItem.code.split('.').map(Number)
    const [secondMain, secondSub] = secondItem.code.split('.').map(Number)

    if (
      Number.isNaN(firstMain) ||
      Number.isNaN(firstSub) ||
      Number.isNaN(secondMain) ||
      Number.isNaN(secondSub)
    ) {
      return firstItem.code.localeCompare(secondItem.code)
    }

    if (firstMain !== secondMain) {
      return firstMain - secondMain
    }

    return firstSub - secondSub
  })
}

function ManageSubPloPage() {
  const [subPloMap, setSubPloMap] = useState(initialSubPloMap)
  const [expandedPloIds, setExpandedPloIds] = useState([1])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activePloId, setActivePloId] = useState(null)
  const [editingSubPloId, setEditingSubPloId] = useState(null)
  const [formData, setFormData] = useState({
    subPloCode: '',
    subPloDescription: '',
  })

  const handleToggleExpand = (ploId) => {
    const isExpanded = expandedPloIds.includes(ploId)

    if (isExpanded) {
      setExpandedPloIds((previousIds) =>
        previousIds.filter((currentId) => currentId !== ploId)
      )
      return
    }

    setExpandedPloIds((previousIds) => [...previousIds, ploId])
  }

  const handleOpenAddDialog = (ploId) => {
    setActivePloId(ploId)
    setEditingSubPloId(null)
    setFormData({
      subPloCode: getNextSubPloCode(ploId, subPloMap),
      subPloDescription: '',
    })
    setDialogOpen(true)

    if (!expandedPloIds.includes(ploId)) {
      setExpandedPloIds((previousIds) => [...previousIds, ploId])
    }
  }

  const handleOpenEditDialog = (ploId, subPloItem) => {
    setActivePloId(ploId)
    setEditingSubPloId(subPloItem.id)
    setFormData({
      subPloCode: subPloItem.code,
      subPloDescription: subPloItem.description,
    })
    setDialogOpen(true)

    if (!expandedPloIds.includes(ploId)) {
      setExpandedPloIds((previousIds) => [...previousIds, ploId])
    }
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setActivePloId(null)
    setEditingSubPloId(null)
    setFormData({
      subPloCode: '',
      subPloDescription: '',
    })
  }

  const handleChangeFormData = (event) => {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))
  }

  const handleSaveSubPlo = () => {
    if (!activePloId) {
      return
    }

    const cleanedCode = formData.subPloCode.trim()
    const cleanedDescription = formData.subPloDescription.trim()

    if (!cleanedCode || !cleanedDescription) {
      window.alert('กรุณากรอกข้อมูล Sub-PLO ให้ครบถ้วน')
      return
    }

    setSubPloMap((previousMap) => {
      const currentItems = previousMap[activePloId] ?? []
      const hasDuplicateCode = currentItems.some(
        (item) => item.code === cleanedCode && item.id !== editingSubPloId
      )

      if (hasDuplicateCode) {
        window.alert('รหัส Sub-PLO นี้ถูกใช้งานแล้ว')
        return previousMap
      }

      let updatedItems = []

      if (editingSubPloId) {
        updatedItems = currentItems.map((item) =>
          item.id === editingSubPloId
            ? {
                ...item,
                code: cleanedCode,
                description: cleanedDescription,
              }
            : item
        )
      } else {
        updatedItems = [
          ...currentItems,
          {
            id: Date.now(),
            code: cleanedCode,
            description: cleanedDescription,
          },
        ]
      }

      return {
        ...previousMap,
        [activePloId]: sortSubPloItems(updatedItems),
      }
    })

    handleCloseDialog()
  }

  const handleDeleteSubPlo = (ploId, subPloId) => {
    const isConfirmed = window.confirm('ต้องการลบ Sub-PLO นี้ใช่หรือไม่')

    if (!isConfirmed) {
      return
    }

    setSubPloMap((previousMap) => ({
      ...previousMap,
      [ploId]: (previousMap[ploId] ?? []).filter((item) => item.id !== subPloId),
    }))
  }

  const activePloItem = ploMasterList.find((item) => item.id === activePloId)

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>
              จัดการ Sub-PLO ของหลักสูตร
            </Typography>
            <Typography className={styles.pageDescription}>
              หน้านี้ใช้สำหรับเพิ่ม แก้ไข และลบ Sub-PLO ภายใต้ PLO หลักทั้ง 8
              ข้อก่อนนำไปเชื่อมกับรายวิชาในขั้นตอนถัดไป โดยตอนนี้ทำเป็นหน้า Frontend
              สำหรับดีไซน์และ flow การใช้งานก่อน
            </Typography>
          </Box>
        </Box>

        <Box className={styles.sectionCard}>
          <Box className={styles.cardHeader}>
            <Typography className={styles.sectionTitle}>
              รายการ PLO หลัก
            </Typography>
            <Typography className={styles.sectionDescription}>
              แต่ละหัวข้อใหญ่สามารถเพิ่มข้อย่อย Sub-PLO ได้หลายข้อ
              และแต่ละข้อสามารถแก้ไขหรือลบได้
            </Typography>
          </Box>

          <Box className={styles.ploList}>
            {ploMasterList.map((ploItem) => {
              const isExpanded = expandedPloIds.includes(ploItem.id)
              const currentSubPloItems = subPloMap[ploItem.id] ?? []

              return (
                <Box key={ploItem.id} className={styles.ploCard}>
                  <Box className={styles.ploHeader}>
                    <Box className={styles.ploHeadLeft}>
                      <Chip
                        label={ploItem.code}
                        className={styles.ploCodeChip}
                      />
                      <Typography className={styles.ploTitle}>
                        {ploItem.title}
                      </Typography>
                    </Box>

                    <Box className={styles.ploActionRow}>
                      <Chip
                        label={`${currentSubPloItems.length} ข้อย่อย`}
                        className={styles.countChip}
                      />

                      <Button
                        variant="contained"
                        startIcon={<PlaylistAddRoundedIcon />}
                        className={styles.primaryButton}
                        onClick={() => handleOpenAddDialog(ploItem.id)}
                      >
                        เพิ่มข้อย่อย
                      </Button>

                      <IconButton
                        className={styles.expandButton}
                        onClick={() => handleToggleExpand(ploItem.id)}
                      >
                        {isExpanded ? (
                          <KeyboardArrowUpRoundedIcon />
                        ) : (
                          <KeyboardArrowDownRoundedIcon />
                        )}
                      </IconButton>
                    </Box>
                  </Box>

                  <Collapse in={isExpanded}>
                    <Box className={styles.subPloPanel}>
                      {currentSubPloItems.length === 0 ? (
                        <Box className={styles.emptyState}>
                          <Typography className={styles.emptyTitle}>
                            ยังไม่มี Sub-PLO ในหัวข้อนี้
                          </Typography>
                          <Typography className={styles.emptyDescription}>
                            กดปุ่ม “เพิ่มข้อย่อย” เพื่อเริ่มใส่ Sub-PLO ใต้{' '}
                            {ploItem.code}
                          </Typography>
                        </Box>
                      ) : (
                        <Box className={styles.subPloList}>
                          {currentSubPloItems.map((subPloItem) => (
                            <Box
                              key={subPloItem.id}
                              className={styles.subPloItem}
                            >
                              <Box className={styles.subPloItemLeft}>
                                <Chip
                                  label={subPloItem.code}
                                  className={styles.subPloItemCode}
                                />
                                <Typography
                                  className={styles.subPloItemDescription}
                                >
                                  {subPloItem.description}
                                </Typography>
                              </Box>

                              <Box className={styles.subPloItemActionRow}>
                                <IconButton
                                  className={styles.itemActionButton}
                                  onClick={() =>
                                    handleOpenEditDialog(ploItem.id, subPloItem)
                                  }
                                >
                                  <EditRoundedIcon />
                                </IconButton>

                                <IconButton
                                  className={styles.deleteActionButton}
                                  onClick={() =>
                                    handleDeleteSubPlo(
                                      ploItem.id,
                                      subPloItem.id
                                    )
                                  }
                                >
                                  <DeleteOutlineRoundedIcon />
                                </IconButton>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              )
            })}
          </Box>
        </Box>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingSubPloId ? 'แก้ไข Sub-PLO' : 'เพิ่ม Sub-PLO ใหม่'}
        </DialogTitle>

        <DialogContent>
          <Box className={styles.dialogForm}>
            <Typography className={styles.dialogHint}>
              {activePloItem
                ? `กำลังจัดการข้อมูลภายใต้ ${activePloItem.code}`
                : '-'}
            </Typography>

            <TextField
              label="รหัส Sub-PLO"
              name="subPloCode"
              value={formData.subPloCode}
              onChange={handleChangeFormData}
              fullWidth
              placeholder="เช่น 1.1"
            />

            <TextField
              label="คำอธิบาย Sub-PLO"
              name="subPloDescription"
              value={formData.subPloDescription}
              onChange={handleChangeFormData}
              fullWidth
              multiline
              minRows={4}
              placeholder="กรอกคำอธิบายของ Sub-PLO"
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ padding: '0 24px 20px' }}>
          <Button onClick={handleCloseDialog}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSaveSubPlo}>
            บันทึกข้อมูล
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ManageSubPloPage