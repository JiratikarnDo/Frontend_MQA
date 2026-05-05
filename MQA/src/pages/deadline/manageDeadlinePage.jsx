import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import axios from 'axios'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import styles from './manageDeadlinePage.module.css'

const initialFormData = {
  formType: 'mqa3',
  termType: '1',
  academicYear: '',
  openAt: '',
  deadlineAt: '',
}

const getAuthConfig = () => {
  const token = localStorage.getItem('mqa_token')
  return { headers: { Authorization: `Bearer ${token}` } }
}

const getResponseList = (data, keyList = []) => {
  if (Array.isArray(data)) return data

  for (const key of keyList) {
    if (Array.isArray(data?.[key])) return data[key]
  }

  const valueList = Object.values(data || {})

  for (const value of valueList) {
    if (Array.isArray(value)) return value
  }

  return []
}

const getApiErrorMessage = (error, fallbackMessage) => {
  const detail = error.response?.data?.detail

  if (typeof detail === 'string') return detail
  if (detail?.message) return detail.message
  if (Array.isArray(detail)) return detail.map((item) => item.msg || item.message || String(item)).join(', ')

  return fallbackMessage
}

const getDateInputValue = (dateValue) => {
  if (!dateValue) return ''
  return String(dateValue).slice(0, 10)
}

const toApiDateTime = (dateValue, timeValue = '00:00:00') => {
  if (!dateValue) return null
  return `${dateValue}T${timeValue}`
}

function parseDateValue(dateValue) {
  const normalizedDate = getDateInputValue(dateValue)
  return new Date(`${normalizedDate}T00:00:00`)
}

function getTodayDate() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function formatDateThai(dateValue) {
  if (!dateValue) return '-'

  return parseDateValue(dateValue).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getDeadlineStatus(item) {
  const today = getTodayDate()
  const openDate = parseDateValue(item.openAt)
  const closeDate = parseDateValue(item.deadlineAt)

  if (today < openDate) {
    return {
      key: 'upcoming',
      label: 'ยังไม่เปิด',
      className: styles.statusChipUpcoming,
    }
  }

  if (today >= openDate && today <= closeDate) {
    return {
      key: 'open',
      label: 'เปิดใช้งาน',
      className: styles.statusChipOpen,
    }
  }

  return {
    key: 'closed',
    label: 'ปิดแล้ว',
    className: styles.statusChipClosed,
  }
}

function isNearDeadline(item) {
  const today = getTodayDate()
  const closeDate = parseDateValue(item.deadlineAt)
  const status = getDeadlineStatus(item)

  if (status.key !== 'open') return false

  const diffTime = closeDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays >= 0 && diffDays <= 7
}

function getFormTypeLabel(formType) {
  return formType === 'mqa3' ? 'มคอ.3' : 'มคอ.5'
}

function getTermTypeLabel(termType) {
  const normalizedTermType = String(termType)

  if (normalizedTermType === '1') return 'ภาคการศึกษาที่ 1'
  if (normalizedTermType === '2') return 'ภาคการศึกษาที่ 2'

  return 'ภาคฤดูร้อน'
}

function mapDeadlineFromApi(deadline) {
  return {
    id: deadline.id || deadline.deadline_id || deadline.deadlineId,
    formType: deadline.tqf_type || deadline.tqfType || deadline.form_type || deadline.formType || 'mqa3',
    termType: String(deadline.semester ?? deadline.termType ?? deadline.term_type ?? '1'),
    academicYear: String(deadline.academic_year ?? deadline.academicYear ?? ''),
    openAt: getDateInputValue(deadline.start_date || deadline.startDate || deadline.open_at || deadline.openAt),
    deadlineAt: getDateInputValue(deadline.end_date || deadline.endDate || deadline.deadline_at || deadline.deadlineAt),
    isActive: deadline.is_active ?? deadline.isActive ?? true,
    rawData: deadline,
  }
}

function buildDeadlinePayload(item) {
  return {
    tqf_type: item.formType,
    semester: item.termType,
    academic_year: Number(item.academicYear),
    start_date: toApiDateTime(item.openAt, '00:00:00'),
    end_date: toApiDateTime(item.deadlineAt, '23:59:00'),
  }
}

function ManageDeadlinePage() {
  const apiUrl = import.meta.env.VITE_API_URL

  const [formData, setFormData] = useState(initialFormData)
  const [deadlineItems, setDeadlineItems] = useState([])
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingDeadlineAt, setEditingDeadlineAt] = useState('')
  const [expandedItemIds, setExpandedItemIds] = useState([])
  const [isDeadlineLoading, setIsDeadlineLoading] = useState(false)
  const [isDeadlineSaving, setIsDeadlineSaving] = useState(false)
  const [deadlineErrorMessage, setDeadlineErrorMessage] = useState('')

  const fetchDeadlineItems = useCallback(async () => {
    try {
      setIsDeadlineLoading(true)
      setDeadlineErrorMessage('')

      const response = await axios.get(`${apiUrl}/tqf/deadlines`, getAuthConfig())
      const responseList = getResponseList(response.data, ['deadlines', 'items', 'data'])
      const mappedDeadlineItems = responseList.map((deadline) => mapDeadlineFromApi(deadline))

      setDeadlineItems(mappedDeadlineItems)
    } catch (error) {
      console.error('Error fetching TQF deadlines:', error)
      setDeadlineErrorMessage(getApiErrorMessage(error, 'ไม่สามารถดึงข้อมูลรอบเวลาได้ กรุณาลองใหม่อีกครั้ง'))
    } finally {
      setIsDeadlineLoading(false)
    }
  }, [apiUrl])

  useEffect(() => {
    fetchDeadlineItems()
  }, [fetchDeadlineItems])

  const handleChangeFormData = (event) => {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))
  }

  const handleResetForm = () => {
    setFormData(initialFormData)
  }

  const handleSubmitForm = async () => {
    const { formType, termType, academicYear, openAt, deadlineAt } = formData

    if (!formType || !termType || !academicYear || !openAt || !deadlineAt) {
      window.alert('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    if (openAt >= deadlineAt) {
      window.alert('วันปิดระบบต้องอยู่หลังวันเปิดระบบเสมอ')
      return
    }

    try {
      setIsDeadlineSaving(true)
      setDeadlineErrorMessage('')

      await axios.post(`${apiUrl}/tqf/deadlines`, buildDeadlinePayload(formData), getAuthConfig())
      await fetchDeadlineItems()
      handleResetForm()
    } catch (error) {
      console.error('Error creating TQF deadline:', error)
      window.alert(getApiErrorMessage(error, 'ไม่สามารถบันทึกรอบเวลาได้ กรุณาลองใหม่อีกครั้ง'))
    } finally {
      setIsDeadlineSaving(false)
    }
  }

  const handleStartEditDeadline = (item) => {
    setEditingItemId(item.id)
    setEditingDeadlineAt(item.deadlineAt)
    setExpandedItemIds((previousIds) =>
      previousIds.includes(item.id) ? previousIds : [item.id, ...previousIds]
    )
  }

  const handleCancelEditDeadline = () => {
    setEditingItemId(null)
    setEditingDeadlineAt('')
  }

  const handleSaveEditedDeadline = async (itemId) => {
    const currentItem = deadlineItems.find((item) => item.id === itemId)

    if (!currentItem) return

    if (!editingDeadlineAt) {
      window.alert('กรุณาเลือกวันปิดระบบ')
      return
    }

    if (currentItem.openAt >= editingDeadlineAt) {
      window.alert('วันปิดระบบต้องอยู่หลังวันเปิดระบบเสมอ')
      return
    }

    try {
      setIsDeadlineSaving(true)
      setDeadlineErrorMessage('')

      const updatedItem = {
        ...currentItem,
        deadlineAt: editingDeadlineAt,
      }

      await axios.put(`${apiUrl}/tqf/deadlines/${itemId}`, buildDeadlinePayload(updatedItem), getAuthConfig())
      await fetchDeadlineItems()
      handleCancelEditDeadline()
    } catch (error) {
      console.error('Error updating TQF deadline:', error)
      window.alert(getApiErrorMessage(error, 'ไม่สามารถอัปเดตรอบเวลาได้ กรุณาลองใหม่อีกครั้ง'))
    } finally {
      setIsDeadlineSaving(false)
    }
  }

  const handleDeleteItem = async (itemId) => {
    const isConfirmed = window.confirm('ต้องการลบรอบเวลานี้ใช่หรือไม่')

    if (!isConfirmed) return

    try {
      setIsDeadlineSaving(true)
      setDeadlineErrorMessage('')

      await axios.delete(`${apiUrl}/tqf/deadlines/${itemId}`, getAuthConfig())

      if (editingItemId === itemId) {
        handleCancelEditDeadline()
      }

      setExpandedItemIds((previousIds) => previousIds.filter((id) => id !== itemId))
      await fetchDeadlineItems()
    } catch (error) {
      console.error('Error deleting TQF deadline:', error)
      window.alert(getApiErrorMessage(error, 'ไม่สามารถลบรอบเวลาได้ กรุณาลองใหม่อีกครั้ง'))
    } finally {
      setIsDeadlineSaving(false)
    }
  }

  const handleToggleItemExpand = (itemId) => {
    const isExpanded = expandedItemIds.includes(itemId)

    if (isExpanded) {
      if (editingItemId === itemId) {
        handleCancelEditDeadline()
      }

      setExpandedItemIds((previousIds) => previousIds.filter((id) => id !== itemId))
      return
    }

    setExpandedItemIds((previousIds) => [itemId, ...previousIds])
  }

  const handleExpandAllItems = () => {
    setExpandedItemIds(deadlineItems.map((item) => item.id))
  }

  const handleCollapseAllItems = () => {
    handleCancelEditDeadline()
    setExpandedItemIds([])
  }

  const totalCount = deadlineItems.length
  const openCount = deadlineItems.filter((item) => getDeadlineStatus(item).key === 'open').length
  const nearDeadlineCount = deadlineItems.filter((item) => isNearDeadline(item)).length

  const summaryItems = [
    {
      id: 1,
      title: 'รอบเวลาทั้งหมด',
      value: String(totalCount),
      description: 'จำนวนรอบเวลาที่ตั้งไว้ในระบบ',
      icon: <AccessTimeRoundedIcon />,
    },
    {
      id: 2,
      title: 'รอบที่เปิดใช้งาน',
      value: String(openCount),
      description: 'จำนวนรอบเวลาที่กำลังเปิดให้ใช้งาน',
      icon: <EventAvailableRoundedIcon />,
    },
    {
      id: 3,
      title: 'ใกล้หมดเวลา',
      value: String(nearDeadlineCount),
      description: 'จำนวนรอบเวลาที่เหลือเวลาปิดส่งไม่เกิน 7 วัน',
      icon: <PendingActionsRoundedIcon />,
    },
  ]

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>
              กำหนดเวลาการจัดทำ มคอ.
            </Typography>

            <Typography className={styles.pageDescription}>
              ตั้งค่าช่วงเวลาเปิดและปิดการจัดทำเอกสาร มคอ.3 และ มคอ.5 ตามภาคการศึกษา
            </Typography>
          </Box>

          <Box className={styles.pageStatus}>
            <Typography className={styles.pageStatusLabel}>
              จำนวนรอบเวลา
            </Typography>

            <Typography className={styles.pageStatusValue}>
              {deadlineItems.length}
            </Typography>
          </Box>
        </Box>

        <Box className={styles.summaryGrid}>
          {summaryItems.map((item) => (
            <Box key={item.id} className={styles.summaryCard}>
              <Box className={styles.iconBox}>{item.icon}</Box>

              <Box className={styles.textContent}>
                <Typography className={styles.cardTitle}>
                  {item.title}
                </Typography>

                <Typography className={styles.cardValue}>
                  {item.value}
                </Typography>

                <Typography className={styles.cardDescription}>
                  {item.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Box className={styles.formCard}>
          <Box className={styles.cardHeader}>
            <Typography className={styles.sectionTitle}>
              ตั้งค่ารอบเวลาใหม่
            </Typography>

            <Typography className={styles.sectionDescription}>
              กำหนดช่วงเวลาเปิดและปิดการจัดทำเอกสารตามประเภทแบบฟอร์ม
            </Typography>
          </Box>

          <Box className={styles.formGrid}>
            <TextField
              select
              label="ประเภทเอกสาร"
              name="formType"
              value={formData.formType}
              onChange={handleChangeFormData}
              fullWidth
            >
              <MenuItem value="mqa3">มคอ.3</MenuItem>
              <MenuItem value="mqa5">มคอ.5</MenuItem>
            </TextField>

            <TextField
              select
              label="ภาคการศึกษา"
              name="termType"
              value={formData.termType}
              onChange={handleChangeFormData}
              fullWidth
            >
              <MenuItem value="1">ภาคการศึกษาที่ 1</MenuItem>
              <MenuItem value="2">ภาคการศึกษาที่ 2</MenuItem>
              <MenuItem value="summer">ภาคฤดูร้อน</MenuItem>
            </TextField>

            <TextField
              label="ปีการศึกษา"
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChangeFormData}
              placeholder="เช่น 2569"
              fullWidth
            />

            <TextField
              label="วันเปิดระบบ"
              name="openAt"
              type="date"
              value={formData.openAt}
              onChange={handleChangeFormData}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="วันปิดระบบ"
              name="deadlineAt"
              type="date"
              value={formData.deadlineAt}
              onChange={handleChangeFormData}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box className={styles.actionRow}>
            <Button
              variant="contained"
              className={styles.primaryButton}
              onClick={handleSubmitForm}
              disabled={isDeadlineSaving}
            >
              {isDeadlineSaving ? 'กำลังบันทึก...' : 'บันทึกรอบเวลา'}
            </Button>
          </Box>
        </Box>

        <Box className={styles.listCard}>
          <Box className={styles.listHeaderRow}>
            <Box className={styles.cardHeader}>
              <Typography className={styles.sectionTitle}>
                รายการรอบเวลาที่ตั้งไว้
              </Typography>

              <Typography className={styles.sectionDescription}>
                รายการนี้ดึงจากข้อมูลรอบเวลาที่บันทึกไว้ในระบบจริง
              </Typography>

              {deadlineErrorMessage && (
                <Typography className={styles.emptyStateDescription}>
                  {deadlineErrorMessage}
                </Typography>
              )}
            </Box>

            {deadlineItems.length > 0 && (
              <Box className={styles.listHeaderActionRow}>
                <Button
                  variant="outlined"
                  className={styles.itemSecondaryButton}
                  onClick={handleExpandAllItems}
                >
                  ดูทั้งหมด
                </Button>

                <Button
                  variant="outlined"
                  className={styles.itemSecondaryButton}
                  onClick={handleCollapseAllItems}
                >
                  ย่อทั้งหมด
                </Button>
              </Box>
            )}
          </Box>

          {isDeadlineLoading ? (
            <Box className={styles.emptyState}>
              <Chip label="กำลังโหลด" className={styles.emptyChip} />

              <Typography className={styles.emptyTitle}>
                กำลังโหลดข้อมูลรอบเวลา
              </Typography>

              <Typography className={styles.emptyDescription}>
                กรุณารอสักครู่
              </Typography>
            </Box>
          ) : deadlineItems.length === 0 ? (
            <Box className={styles.emptyState}>
              <Chip label="ยังไม่มีข้อมูล" className={styles.emptyChip} />

              <Typography className={styles.emptyTitle}>
                ยังไม่มีรอบเวลาที่สร้างไว้
              </Typography>

              <Typography className={styles.emptyDescription}>
                เมื่อมีการเพิ่มรอบเวลาใหม่ รายการจะแสดงในส่วนนี้
              </Typography>
            </Box>
          ) : (
            <Box className={styles.listGrid}>
              {deadlineItems.map((item) => {
                const status = getDeadlineStatus(item)
                const isEditing = editingItemId === item.id
                const isExpanded = expandedItemIds.includes(item.id)

                return (
                  <Box
                    key={item.id}
                    className={`${styles.deadlineItem} ${
                      !isExpanded ? styles.deadlineItemCollapsed : ''
                    }`}
                  >
                    <Box className={styles.itemTopRow}>
                      <Box className={styles.itemMainInfo}>
                        <Typography className={styles.itemTitle}>
                          {getFormTypeLabel(item.formType)}
                        </Typography>

                        {isExpanded && (
                          <Typography className={styles.itemSubtitle}>
                            {getTermTypeLabel(item.termType)} / ปีการศึกษา{' '}
                            {item.academicYear}
                          </Typography>
                        )}
                      </Box>

                      <Box className={styles.itemTopRight}>
                        <Chip
                          label={status.label}
                          className={`${styles.statusChip} ${status.className}`}
                        />

                        <Button
                          variant="text"
                          className={styles.toggleButton}
                          onClick={() => handleToggleItemExpand(item.id)}
                          startIcon={
                            isExpanded ? (
                              <KeyboardArrowUpRoundedIcon />
                            ) : (
                              <KeyboardArrowDownRoundedIcon />
                            )
                          }
                        >
                          {isExpanded ? 'ย่อรายละเอียด' : 'ดูรายละเอียด'}
                        </Button>

                        {!isExpanded && (
                          <Button
                            variant="outlined"
                            className={styles.deleteButton}
                            startIcon={<DeleteOutlineRoundedIcon />}
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={isDeadlineSaving}
                          >
                            ลบ
                          </Button>
                        )}
                      </Box>
                    </Box>

                    {isExpanded && (
                      <>
                        <Box className={styles.itemMetaRow}>
                          <Box className={styles.metaCard}>
                            <Typography className={styles.metaLabel}>
                              วันเปิดระบบ
                            </Typography>

                            <Typography className={styles.metaValue}>
                              {formatDateThai(item.openAt)}
                            </Typography>
                          </Box>

                          <Box className={styles.metaCard}>
                            <Typography className={styles.metaLabel}>
                              วันปิดระบบ
                            </Typography>

                            {isEditing ? (
                              <TextField
                                type="date"
                                value={editingDeadlineAt}
                                onChange={(event) =>
                                  setEditingDeadlineAt(event.target.value)
                                }
                                fullWidth
                                size="small"
                                InputLabelProps={{ shrink: true }}
                              />
                            ) : (
                              <Typography className={styles.metaValue}>
                                {formatDateThai(item.deadlineAt)}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        <Box className={styles.itemActionRow}>
                          {isEditing ? (
                            <>
                              <Button
                                variant="outlined"
                                className={styles.itemSecondaryButton}
                                onClick={handleCancelEditDeadline}
                                disabled={isDeadlineSaving}
                              >
                                ยกเลิก
                              </Button>

                              <Button
                                variant="contained"
                                className={styles.itemPrimaryButton}
                                onClick={() => handleSaveEditedDeadline(item.id)}
                                disabled={isDeadlineSaving}
                              >
                                {isDeadlineSaving ? 'กำลังบันทึก...' : 'บันทึกวันปิด'}
                              </Button>

                              <Button
                                variant="outlined"
                                className={styles.deleteButton}
                                startIcon={<DeleteOutlineRoundedIcon />}
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={isDeadlineSaving}
                              >
                                ลบ
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outlined"
                                className={styles.itemSecondaryButton}
                                onClick={() => handleStartEditDeadline(item)}
                              >
                                แก้ไขวันปิด
                              </Button>

                              <Button
                                variant="outlined"
                                className={styles.deleteButton}
                                startIcon={<DeleteOutlineRoundedIcon />}
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={isDeadlineSaving}
                              >
                                ลบ
                              </Button>
                            </>
                          )}
                        </Box>
                      </>
                    )}
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default ManageDeadlinePage