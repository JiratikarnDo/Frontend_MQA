import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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

function createEmptySubPloMap() {
  return ploMasterList.reduce((currentMap, ploItem) => {
    currentMap[ploItem.id] = []
    return currentMap
  }, {})
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

function normalizeSubPloItem(item) {
  return {
    id: item.id,
    code: item.sub_plo_code ?? '',
    description: item.sub_plo_name_thai ?? '',
    ploId: item.plo_id,
  }
}

function getSubPloItemsFromResponse(responseData) {
  if (Array.isArray(responseData)) {
    return responseData
  }

  if (Array.isArray(responseData?.items)) {
    return responseData.items
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data
  }

  if (Array.isArray(responseData?.sub_plos)) {
    return responseData.sub_plos
  }

  return []
}

function buildSubPloMap(subPloItems) {
  const nextSubPloMap = createEmptySubPloMap()

  subPloItems.forEach((item) => {
    const normalizedItem = normalizeSubPloItem(item)

    if (!nextSubPloMap[normalizedItem.ploId]) {
      return
    }

    nextSubPloMap[normalizedItem.ploId].push(normalizedItem)
  })

  Object.keys(nextSubPloMap).forEach((ploId) => {
    nextSubPloMap[ploId] = sortSubPloItems(nextSubPloMap[ploId])
  })

  return nextSubPloMap
}

function ManageSubPloPage() {
  const apiUrl = import.meta.env.VITE_API_URL

  const [subPloMap, setSubPloMap] = useState(() => createEmptySubPloMap())
  const [expandedPloIds, setExpandedPloIds] = useState([1])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activePloId, setActivePloId] = useState(null)
  const [editingSubPloId, setEditingSubPloId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingSubPloId, setDeletingSubPloId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [formData, setFormData] = useState({
    subPloCode: '',
    subPloDescription: '',
  })

  const getAuthConfig = () => {
    const token = localStorage.getItem('mqa_token')

    return {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    }
  }

  const getErrorMessage = (error, fallbackMessage) => {
    const detail = error?.response?.data?.detail
    const message = error?.response?.data?.message

    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).join(', ')
    }

    return detail || message || fallbackMessage
  }

  const resetDialogState = () => {
    setDialogOpen(false)
    setActivePloId(null)
    setEditingSubPloId(null)
    setFormData({
      subPloCode: '',
      subPloDescription: '',
    })
  }

  const fetchSubPlos = async (shouldShowLoading = true) => {
    if (shouldShowLoading) {
      setIsLoading(true)
    }

    setErrorMessage('')

    try {
      const response = await axios.get(`${apiUrl}/plo/sub-plos`, {
        ...getAuthConfig(),
        params: {
          page: 1,
          limit: 500,
        },
      })

      const responseItems = getSubPloItemsFromResponse(response.data)
      setSubPloMap(buildSubPloMap(responseItems))
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, 'ไม่สามารถโหลดข้อมูล Sub-PLO ได้')
      )
    } finally {
      if (shouldShowLoading) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchSubPlos()
  }, [])

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
    setErrorMessage('')
    setSuccessMessage('')
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
    setErrorMessage('')
    setSuccessMessage('')
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
    if (isSaving) {
      return
    }

    resetDialogState()
  }

  const handleChangeFormData = (event) => {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))
  }

  const handleSaveSubPlo = async () => {
    if (!activePloId) {
      return
    }

    const currentPloId = activePloId
    const cleanedCode = formData.subPloCode.trim()
    const cleanedDescription = formData.subPloDescription.trim()

    if (!cleanedCode || !cleanedDescription) {
      window.alert('กรุณากรอกข้อมูล Sub-PLO ให้ครบถ้วน')
      return
    }

    const expectedPrefix = `${currentPloId}.`

    if (!cleanedCode.startsWith(expectedPrefix)) {
      window.alert(
        `รหัส Sub-PLO ใต้ PLO${currentPloId} ต้องขึ้นต้นด้วย ${expectedPrefix} เช่น ${currentPloId}.1`
      )
      return
    }

    const currentItems = subPloMap[currentPloId] ?? []
    const hasDuplicateCode = currentItems.some(
      (item) => item.code === cleanedCode && item.id !== editingSubPloId
    )

    if (hasDuplicateCode) {
      window.alert('รหัส Sub-PLO นี้ถูกใช้งานแล้ว')
      return
    }

    const payload = {
      sub_plo_code: cleanedCode,
      sub_plo_name_thai: cleanedDescription,
      plo_id: currentPloId,
    }

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      if (editingSubPloId) {
        await axios.put(
          `${apiUrl}/plo/sub-plos/${editingSubPloId}`,
          payload,
          getAuthConfig()
        )

        setSuccessMessage('แก้ไข Sub-PLO สำเร็จ')
      } else {
        await axios.post(`${apiUrl}/plo/sub-plos`, payload, getAuthConfig())

        setSuccessMessage('เพิ่ม Sub-PLO สำเร็จ')
      }

      await fetchSubPlos(false)

      setExpandedPloIds((previousIds) =>
        previousIds.includes(currentPloId)
          ? previousIds
          : [...previousIds, currentPloId]
      )

      resetDialogState()
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, 'ไม่สามารถบันทึกข้อมูล Sub-PLO ได้')
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSubPlo = async (subPloId) => {
    const isConfirmed = window.confirm('ต้องการลบ Sub-PLO นี้ใช่หรือไม่')

    if (!isConfirmed) {
      return
    }

    setDeletingSubPloId(subPloId)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await axios.delete(`${apiUrl}/plo/sub-plos/${subPloId}`, getAuthConfig())
      await fetchSubPlos(false)
      setSuccessMessage('ลบ Sub-PLO สำเร็จ')
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, 'ไม่สามารถลบข้อมูล Sub-PLO ได้')
      )
    } finally {
      setDeletingSubPloId(null)
    }
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
              ข้อก่อนนำไปเชื่อมกับรายวิชาในขั้นตอนถัดไป
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

          {errorMessage && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ marginBottom: 2 }}>
              {successMessage}
            </Alert>
          )}

          {isLoading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                padding: '32px',
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
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
                                    disabled={
                                      deletingSubPloId === subPloItem.id
                                    }
                                    onClick={() =>
                                      handleOpenEditDialog(
                                        ploItem.id,
                                        subPloItem
                                      )
                                    }
                                  >
                                    <EditRoundedIcon />
                                  </IconButton>

                                  <IconButton
                                    className={styles.deleteActionButton}
                                    disabled={
                                      deletingSubPloId === subPloItem.id
                                    }
                                    onClick={() =>
                                      handleDeleteSubPlo(subPloItem.id)
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
          )}
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
              disabled={isSaving}
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
              disabled={isSaving}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ padding: '0 24px 20px' }}>
          <Button onClick={handleCloseDialog} disabled={isSaving}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSubPlo}
            disabled={isSaving}
          >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ManageSubPloPage