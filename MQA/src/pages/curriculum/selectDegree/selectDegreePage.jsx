import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import axios from 'axios'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import styles from './selectDegreePage.module.css'

const degreeOptions = [
  { id: 'bachelor', shortLabel: 'ตรี', title: 'ปริญญาตรี', description: 'สำหรับการจัดการหลักสูตรระดับปริญญาตรี' },
  { id: 'master', shortLabel: 'โท', title: 'ปริญญาโท', description: 'สำหรับการจัดการหลักสูตรระดับปริญญาโท' },
  { id: 'doctorate', shortLabel: 'เอก', title: 'ปริญญาเอก', description: 'สำหรับการจัดการหลักสูตรระดับปริญญาเอก' },
]

const degreeLabelMap = { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctorate: 'ปริญญาเอก' }
const degreeValueToThaiMap = { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctorate: 'ปริญญาเอก' }

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

const normalizeDegree = (value) => {
  const degree = String(value || '').trim().toLowerCase()

  if (degree === 'bachelor' || degree === 'ปริญญาตรี' || degree.includes('ตรี')) return 'bachelor'
  if (degree === 'master' || degree === 'ปริญญาโท' || degree.includes('โท')) return 'master'
  if (degree === 'doctorate' || degree === 'doctoral' || degree === 'doctor' || degree === 'phd' || degree === 'ปริญญาเอก' || degree.includes('เอก')) return 'doctorate'
  return degree
}

const mapDepartmentToMajorOption = (department) => ({
  id: department.id || department.department_id || department.departmentId,
  majorRefId: department.id || department.department_id || department.departmentId,
  majorCode: department.external_id || department.department_code || department.departmentCode || department.id || department.department_id,
  majorNameTh: department.department_name || department.departmentName || department.name || '-',
  majorNameEn: department.department_name_en || department.departmentNameEn || '',
  rawData: department,
})

const mapSharedDepartmentToMajor = (sharedDepartment) => {
  const department = sharedDepartment.department || sharedDepartment

  return {
    id: sharedDepartment.id || department.id || department.department_id || department.departmentId,
    majorRefId: sharedDepartment.department_id || department.id || department.department_id || department.departmentId,
    majorCode: department.external_id || department.department_code || department.departmentCode || department.id || department.department_id || sharedDepartment.department_id,
    majorNameTh: department.department_name || department.departmentName || department.name || '-',
    majorNameEn: department.department_name_en || department.departmentNameEn || '',
  }
}

const mapCurriculumFromApi = (curriculum) => {
  const curriculumId = curriculum.id || curriculum.curriculum_id || curriculum.curriculumId
  const sharedDepartments = curriculum.shared_departments || curriculum.sharedDepartments || curriculum.departments || curriculum.department_list || curriculum.departmentList || []

  return {
    id: curriculumId,
    curriculumCode: curriculum.curriculum_code || curriculum.curriculumCode || '-',
    curriculumNameTh: curriculum.curriculum_name_thai || curriculum.curriculum_name_th || curriculum.curriculumNameThai || curriculum.curriculumNameTh || '-',
    curriculumNameEn: curriculum.curriculum_name_english || curriculum.curriculum_name_en || curriculum.curriculumNameEnglish || curriculum.curriculumNameEn || '',
    curriculumLevel: normalizeDegree(curriculum.curriculum_level || curriculum.curriculumLevel || curriculum.degree_level || curriculum.degreeLevel),
    majors: Array.isArray(sharedDepartments) ? sharedDepartments.map((department) => mapSharedDepartmentToMajor(department)) : [],
    rawData: curriculum,
  }
}

function DegreeCard({ degree, isSelected, onSelect }) {
  return (
    <button type="button" className={`${styles.degreeCard} ${isSelected ? styles.degreeCardActive : ''}`} onClick={() => onSelect(degree.id)}>
      <Box className={styles.degreeCardTop}>
        <Chip label={degree.shortLabel} className={isSelected ? styles.activeChip : styles.defaultChip} />
        {isSelected && <Box className={styles.selectedPill}><Typography className={styles.selectedPillText}>เลือกแล้ว</Typography></Box>}
      </Box>

      <Box className={styles.degreeCardBody}>
        <Typography className={styles.degreeTitle}>{degree.title}</Typography>
        <Typography className={styles.degreeDescription}>{degree.description}</Typography>
      </Box>
    </button>
  )
}

function CurriculumCard({ curriculum, isExpanded, onToggleExpand, onEditCurriculum, onOpenAddMajorDialog, onOpenEditMajorDialog, onDeleteMajor, onDeleteCurriculum }) {
  const majorCount = curriculum.majors.length

  return (
    <Box className={styles.curriculumCard}>
      <Box className={styles.curriculumCardHeader}>
        <Box>
          <Typography className={styles.curriculumCode}>{curriculum.curriculumCode}</Typography>
          <Typography className={styles.curriculumNameTh}>{curriculum.curriculumNameTh}</Typography>
          <Typography className={styles.curriculumNameEn}>{curriculum.curriculumNameEn}</Typography>
        </Box>

        <Box className={styles.curriculumActionGroup}>
          <Button variant="text" startIcon={<EditRoundedIcon />} className={styles.editCurriculumButton} onClick={() => onEditCurriculum(curriculum)}>แก้ไขหลักสูตร</Button>
          <Button variant="outlined" startIcon={<AddRoundedIcon />} className={styles.addMajorButton} onClick={() => onOpenAddMajorDialog(curriculum.id)}>เพิ่มสาขา</Button>
          <Button variant="outlined" startIcon={<DeleteOutlineRoundedIcon />} className={styles.deleteCurriculumButton} onClick={() => onDeleteCurriculum(curriculum)}>ลบหลักสูตร</Button>
        </Box>
      </Box>

      {majorCount === 0 ? (
        <Box className={styles.majorPlaceholder}>
          <Typography className={styles.majorPlaceholderTitle}>ยังไม่มีสาขาในหลักสูตรนี้</Typography>
          <Typography className={styles.majorPlaceholderDescription}>กดปุ่มเพิ่มสาขาเพื่อเลือกสาขาที่ต้องการใช้งาน</Typography>
        </Box>
      ) : (
        <>
          <button type="button" className={styles.majorSummaryButton} onClick={() => onToggleExpand(curriculum.id)}>
            <Box className={styles.majorSummaryLeft}>
              <Typography className={styles.majorSummaryTitle}>มีสาขาในหลักสูตรนี้ {majorCount} รายการ</Typography>
              <Typography className={styles.majorSummaryDescription}>{isExpanded ? 'กดเพื่อซ่อนรายการสาขา' : 'กดเพื่อดูรายการสาขาทั้งหมด'}</Typography>
            </Box>

            <Box className={styles.majorSummaryArrow}>{isExpanded ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}</Box>
          </button>

          <Collapse in={isExpanded} timeout={220}>
            <Box className={styles.majorList}>
              {curriculum.majors.map((major) => (
                <Box key={major.id} className={styles.majorItem}>
                  <Box className={styles.majorMeta}>
                    <Typography className={styles.majorItemCode}>{major.majorCode}</Typography>
                    <Typography className={styles.majorItemNameTh}>{major.majorNameTh}</Typography>
                    {major.majorNameEn && <Typography className={styles.majorItemNameEn}>{major.majorNameEn}</Typography>}
                  </Box>

                  <Box className={styles.majorActionGroup}>
                    <Button variant="text" startIcon={<EditRoundedIcon />} className={styles.majorTextButton} onClick={() => onOpenEditMajorDialog(curriculum.id, major)}>แก้ไข</Button>
                    <Button variant="text" startIcon={<DeleteOutlineRoundedIcon />} className={styles.deleteMajorButton} onClick={() => onDeleteMajor(curriculum.id, major.id)}>ลบ</Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Collapse>
        </>
      )}
    </Box>
  )
}

function MajorDialog({
  open,
  editingMajorId,
  activeCurriculum,
  majorSearch,
  onSearchChange,
  filteredMajorOptions,
  selectedMajorIds,
  onToggleMajorSelection,
  selectedMajorOptions,
  majorDialogError,
  isDepartmentLoading,
  departmentErrorMessage,
  isMajorSaving,
  onClose,
  onSave,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ className: styles.majorDialogPaper }}>
      <DialogTitle className={styles.majorDialogTitle}>{editingMajorId ? 'แก้ไขสาขา' : 'เพิ่มสาขา'}</DialogTitle>

      <DialogContent className={styles.majorDialogContent}>
        <Typography className={styles.dialogHint}>หลักสูตร: {activeCurriculum?.curriculumNameTh || '-'}</Typography>
        <Typography className={styles.dialogSubHint}>{editingMajorId ? 'เลือกสาขาใหม่ 1 รายการเพื่อแทนที่ข้อมูลเดิม' : 'ค้นหาและเลือกได้หลายสาขาในรอบเดียว แล้วกดเพิ่มสาขา'}</Typography>

        <TextField label="ค้นหาสาขา" placeholder="ค้นหาจากรหัสหรือชื่อสาขา" value={majorSearch} onChange={(event) => onSearchChange(event.target.value)} fullWidth />

        <Box className={styles.majorOptionList}>
          {isDepartmentLoading ? (
            <Box className={styles.dialogEmptyState}>
              <Typography className={styles.emptyStateTitle}>กำลังโหลดข้อมูลสาขา...</Typography>
              <Typography className={styles.emptyStateDescription}>กรุณารอสักครู่</Typography>
            </Box>
          ) : departmentErrorMessage ? (
            <Box className={styles.dialogEmptyState}>
              <Typography className={styles.emptyStateTitle}>ดึงข้อมูลสาขาไม่สำเร็จ</Typography>
              <Typography className={styles.emptyStateDescription}>{departmentErrorMessage}</Typography>
            </Box>
          ) : filteredMajorOptions.length === 0 ? (
            <Box className={styles.dialogEmptyState}>
              <Typography className={styles.emptyStateTitle}>ไม่พบสาขาที่ค้นหา</Typography>
              <Typography className={styles.emptyStateDescription}>ลองพิมพ์คำค้นหาใหม่อีกครั้ง</Typography>
            </Box>
          ) : (
            filteredMajorOptions.map((majorOption) => {
              const isSelected = selectedMajorIds.includes(majorOption.id)

              return (
                <button key={majorOption.id} type="button" className={`${styles.majorOptionCard} ${isSelected ? styles.majorOptionCardActive : ''}`} onClick={() => onToggleMajorSelection(majorOption.id)}>
                  <Box className={styles.majorOptionHeader}>
                    <Typography className={styles.majorOptionCode}>{majorOption.majorCode}</Typography>
                    {isSelected && <Typography className={styles.majorOptionSelectState}>เลือกอยู่</Typography>}
                  </Box>

                  <Typography className={styles.majorOptionNameTh}>{majorOption.majorNameTh}</Typography>
                  {majorOption.majorNameEn && <Typography className={styles.majorOptionNameEn}>{majorOption.majorNameEn}</Typography>}
                </button>
              )
            })
          )}
        </Box>

        {selectedMajorOptions.length > 0 && (
          <Box className={styles.selectedMajorPreview}>
            <Box className={styles.selectedMajorPreviewHeader}>
              <Typography className={styles.selectedMajorPreviewTitle}>{editingMajorId ? 'สาขาที่เลือกสำหรับแก้ไข' : 'สาขาที่เลือกในรอบนี้'}</Typography>
              <Typography className={styles.selectedMajorPreviewCount}>{selectedMajorOptions.length} รายการ</Typography>
            </Box>

            <Box className={styles.selectedMajorTagList}>
              {selectedMajorOptions.map((major) => (
                <Box key={major.id} className={styles.selectedMajorTag}>
                  <Typography className={styles.selectedMajorTagCode}>{major.majorCode}</Typography>
                  <Typography className={styles.selectedMajorTagNameTh}>{major.majorNameTh}</Typography>
                  {major.majorNameEn && <Typography className={styles.selectedMajorTagNameEn}>{major.majorNameEn}</Typography>}
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {majorDialogError && <Typography className={styles.dialogErrorText}>{majorDialogError}</Typography>}
      </DialogContent>

      <DialogActions className={styles.majorDialogActions}>
        <Button variant="outlined" onClick={onClose} className={styles.dialogCancelButton} disabled={isMajorSaving}>ยกเลิก</Button>
        <Button variant="contained" onClick={onSave} className={styles.dialogSubmitButton} disabled={isMajorSaving}>
          {isMajorSaving ? 'กำลังบันทึก...' : editingMajorId ? 'บันทึกการแก้ไข' : `เพิ่มสาขา${selectedMajorOptions.length > 0 ? ` (${selectedMajorOptions.length})` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function SelectDegreePage() {
  const apiUrl = import.meta.env.VITE_API_URL
  const [selectedDegree, setSelectedDegree] = useState('')
  const [curriculumCode, setCurriculumCode] = useState('')
  const [curriculumNameTh, setCurriculumNameTh] = useState('')
  const [curriculumNameEn, setCurriculumNameEn] = useState('')
  const [editingCurriculumId, setEditingCurriculumId] = useState(null)
  const [curriculumListByDegree, setCurriculumListByDegree] = useState({ bachelor: [], master: [], doctorate: [] })
  const [isCurriculumLoading, setIsCurriculumLoading] = useState(false)
  const [isCurriculumSaving, setIsCurriculumSaving] = useState(false)
  const [curriculumErrorMessage, setCurriculumErrorMessage] = useState('')
  const [majorOptions, setMajorOptions] = useState([])
  const [isDepartmentLoading, setIsDepartmentLoading] = useState(false)
  const [departmentErrorMessage, setDepartmentErrorMessage] = useState('')
  const [expandedCurriculumIds, setExpandedCurriculumIds] = useState({})
  const [isMajorDialogOpen, setIsMajorDialogOpen] = useState(false)
  const [isMajorSaving, setIsMajorSaving] = useState(false)
  const [activeCurriculumId, setActiveCurriculumId] = useState(null)
  const [majorSearch, setMajorSearch] = useState('')
  const [selectedMajorIds, setSelectedMajorIds] = useState([])
  const [editingMajorId, setEditingMajorId] = useState(null)
  const [majorDialogError, setMajorDialogError] = useState('')

  const fetchInitialData = useCallback(async () => {
    const config = getAuthConfig()

    try {
      setIsCurriculumLoading(true)
      setIsDepartmentLoading(true)
      setCurriculumErrorMessage('')
      setDepartmentErrorMessage('')

      const [curriculumResponse, departmentResponse] = await Promise.all([
        axios.get(`${apiUrl}/curriculums/`, config),
        axios.get(`${apiUrl}/departments/`, config),
      ])

      const curriculumData = getResponseList(curriculumResponse.data, ['curriculums', 'data'])
      const departmentData = getResponseList(departmentResponse.data, ['departments', 'data'])

      const curriculumDetailList = await Promise.all(
        curriculumData.map(async (curriculum) => {
          const curriculumId = curriculum.id || curriculum.curriculum_id || curriculum.curriculumId

          if (!curriculumId) return curriculum

          try {
            const detailResponse = await axios.get(`${apiUrl}/curriculums/${curriculumId}`, config)
            return detailResponse.data?.curriculum || detailResponse.data?.data || detailResponse.data
          } catch (error) {
            return curriculum
          }
        })
      )

      const mappedMajorOptions = departmentData.map((department) => mapDepartmentToMajorOption(department))
      const mappedCurriculumList = curriculumDetailList.map((curriculum) => mapCurriculumFromApi(curriculum))

      setMajorOptions(mappedMajorOptions)
      setCurriculumListByDegree({
        bachelor: mappedCurriculumList.filter((curriculum) => curriculum.curriculumLevel === 'bachelor'),
        master: mappedCurriculumList.filter((curriculum) => curriculum.curriculumLevel === 'master'),
        doctorate: mappedCurriculumList.filter((curriculum) => curriculum.curriculumLevel === 'doctorate'),
      })
    } catch (error) {
      console.error('Error fetching curriculum or department:', error)
      setCurriculumErrorMessage(getApiErrorMessage(error, 'ไม่สามารถดึงข้อมูลหลักสูตรได้ กรุณาลองใหม่อีกครั้ง'))
      setDepartmentErrorMessage('ไม่สามารถดึงข้อมูลสาขาได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsCurriculumLoading(false)
      setIsDepartmentLoading(false)
    }
  }, [apiUrl])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  const showCurriculumSection = Boolean(selectedDegree)
  const currentCurriculumList = useMemo(() => {
    if (!selectedDegree) return []
    return curriculumListByDegree[selectedDegree] || []
  }, [selectedDegree, curriculumListByDegree])

  const activeCurriculum = useMemo(() => currentCurriculumList.find((curriculum) => curriculum.id === activeCurriculumId) || null, [currentCurriculumList, activeCurriculumId])

  const filteredMajorOptions = useMemo(() => {
    const keyword = majorSearch.trim().toLowerCase()
    if (!keyword) return majorOptions

    return majorOptions.filter((major) => {
      return String(major.majorCode).toLowerCase().includes(keyword) || major.majorNameTh.toLowerCase().includes(keyword) || (major.majorNameEn || '').toLowerCase().includes(keyword)
    })
  }, [majorOptions, majorSearch])

  const selectedMajorOptions = useMemo(() => majorOptions.filter((major) => selectedMajorIds.includes(major.id)), [majorOptions, selectedMajorIds])

  const resetCurriculumForm = () => {
    setCurriculumCode('')
    setCurriculumNameTh('')
    setCurriculumNameEn('')
    setEditingCurriculumId(null)
  }

  const resetMajorDialogState = () => {
    setIsMajorDialogOpen(false)
    setActiveCurriculumId(null)
    setMajorSearch('')
    setSelectedMajorIds([])
    setEditingMajorId(null)
    setMajorDialogError('')
  }

  const handleSelectDegree = (degreeId) => {
    setSelectedDegree(degreeId)
    resetCurriculumForm()
    resetMajorDialogState()
  }

  const handleSubmitCurriculum = async () => {
    const trimmedCode = curriculumCode.trim()
    const trimmedNameTh = curriculumNameTh.trim()
    const trimmedNameEn = curriculumNameEn.trim()

    if (!selectedDegree || !trimmedCode || !trimmedNameTh || !trimmedNameEn) return

    try {
      setIsCurriculumSaving(true)
      setCurriculumErrorMessage('')

      const config = getAuthConfig()
      const payload = {
        curriculum_level: degreeValueToThaiMap[selectedDegree] || selectedDegree,
        curriculum_code: trimmedCode,
        curriculum_name_thai: trimmedNameTh,
        curriculum_name_english: trimmedNameEn,
      }

      if (editingCurriculumId) {
        await axios.put(`${apiUrl}/curriculums/${editingCurriculumId}`, payload, config)
      } else {
        await axios.post(`${apiUrl}/curriculums/`, { ...payload, status: 'draft', department_ids: [] }, config)
      }

      await fetchInitialData()
      resetCurriculumForm()
    } catch (error) {
      console.error('Error saving curriculum:', error)
      setCurriculumErrorMessage(getApiErrorMessage(error, 'ไม่สามารถบันทึกหลักสูตรได้ กรุณาลองใหม่อีกครั้ง'))
    } finally {
      setIsCurriculumSaving(false)
    }
  }

  const handleEditCurriculum = (curriculum) => {
    setEditingCurriculumId(curriculum.id)
    setCurriculumCode(curriculum.curriculumCode)
    setCurriculumNameTh(curriculum.curriculumNameTh)
    setCurriculumNameEn(curriculum.curriculumNameEn)

    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteCurriculum = async (curriculum) => {
    if (!curriculum?.id) return

    const isConfirmed = window.confirm(`ต้องการลบหลักสูตร "${curriculum.curriculumNameTh}" ใช่หรือไม่`)
    if (!isConfirmed) return

    try {
      setCurriculumErrorMessage('')
      await axios.delete(`${apiUrl}/curriculums/${curriculum.id}`, getAuthConfig())
      await fetchInitialData()

      setExpandedCurriculumIds((prev) => {
        const nextExpanded = { ...prev }
        delete nextExpanded[curriculum.id]
        return nextExpanded
      })

      if (editingCurriculumId === curriculum.id) resetCurriculumForm()
    } catch (error) {
      console.error('Error deleting curriculum:', error)
      setCurriculumErrorMessage(getApiErrorMessage(error, 'ไม่สามารถลบหลักสูตรได้ กรุณาลองใหม่อีกครั้ง'))
    }
  }

  const handleToggleCurriculumExpand = (curriculumId) => {
    setExpandedCurriculumIds((prev) => ({ ...prev, [curriculumId]: !prev[curriculumId] }))
  }

  const handleOpenAddMajorDialog = (curriculumId) => {
    setActiveCurriculumId(curriculumId)
    setMajorSearch('')
    setSelectedMajorIds([])
    setEditingMajorId(null)
    setMajorDialogError('')
    setIsMajorDialogOpen(true)
  }

  const handleOpenEditMajorDialog = (curriculumId, major) => {
    setActiveCurriculumId(curriculumId)
    setMajorSearch(major.majorNameTh)
    setSelectedMajorIds([major.majorRefId])
    setEditingMajorId(major.id)
    setMajorDialogError('')
    setIsMajorDialogOpen(true)
  }

  const handleToggleMajorSelection = (majorOptionId) => {
    setMajorDialogError('')

    if (editingMajorId) {
      setSelectedMajorIds([majorOptionId])
      return
    }

    setSelectedMajorIds((prev) => {
      if (prev.includes(majorOptionId)) return prev.filter((id) => id !== majorOptionId)
      return [...prev, majorOptionId]
    })
  }

  const handleDeleteMajor = async (curriculumId, majorId) => {
    const targetCurriculum = currentCurriculumList.find((curriculum) => curriculum.id === curriculumId)

    if (!targetCurriculum) return

    const remainingDepartmentIds = targetCurriculum.majors
      .filter((major) => major.id !== majorId)
      .map((major) => Number(major.majorRefId))
      .filter(Boolean)

    try {
      setCurriculumErrorMessage('')
      await axios.put(`${apiUrl}/curriculums/${curriculumId}`, { department_ids: remainingDepartmentIds }, getAuthConfig())
      await fetchInitialData()
      setExpandedCurriculumIds((prev) => ({ ...prev, [curriculumId]: true }))
    } catch (error) {
      console.error('Error deleting curriculum department:', error)
      setCurriculumErrorMessage(getApiErrorMessage(error, 'ไม่สามารถลบสาขาออกจากหลักสูตรได้ กรุณาลองใหม่อีกครั้ง'))
    }
  }

  const handleSaveMajor = async () => {
    if (!activeCurriculum) return

    if (selectedMajorOptions.length === 0) {
      setMajorDialogError('กรุณาเลือกสาขาก่อนบันทึก')
      return
    }

    try {
      setIsMajorSaving(true)
      setMajorDialogError('')

      let departmentIds = []

      if (editingMajorId) {
        const selectedMajorOption = selectedMajorOptions[0]
        const hasDuplicateMajor = activeCurriculum.majors.some((major) => major.majorRefId === selectedMajorOption.id && major.id !== editingMajorId)

        if (hasDuplicateMajor) {
          setMajorDialogError('สาขานี้ถูกเพิ่มในหลักสูตรนี้แล้ว')
          return
        }

        departmentIds = activeCurriculum.majors.map((major) => Number(major.id === editingMajorId ? selectedMajorOption.id : major.majorRefId)).filter(Boolean)
      } else {
        const existingMajorRefIds = new Set(activeCurriculum.majors.map((major) => major.majorRefId))
        const newMajorOptions = selectedMajorOptions.filter((majorOption) => !existingMajorRefIds.has(majorOption.id))

        if (newMajorOptions.length === 0) {
          setMajorDialogError('สาขาที่เลือกถูกเพิ่มในหลักสูตรนี้แล้ว')
          return
        }

        departmentIds = [
          ...activeCurriculum.majors.map((major) => Number(major.majorRefId)).filter(Boolean),
          ...newMajorOptions.map((majorOption) => Number(majorOption.id)).filter(Boolean),
        ]
      }

      await axios.put(`${apiUrl}/curriculums/${activeCurriculumId}`, { department_ids: departmentIds }, getAuthConfig())
      await fetchInitialData()
      setExpandedCurriculumIds((prev) => ({ ...prev, [activeCurriculumId]: true }))
      resetMajorDialogState()
    } catch (error) {
      console.error('Error saving curriculum departments:', error)
      setMajorDialogError(getApiErrorMessage(error, 'ไม่สามารถบันทึกสาขาในหลักสูตรได้ กรุณาลองใหม่อีกครั้ง'))
    } finally {
      setIsMajorSaving(false)
    }
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>จัดการหลักสูตร</Typography>
            <Typography className={styles.pageDescription}>เลือกระดับปริญญาเพื่อเริ่มเพิ่มหลักสูตรและจัดการสาขาในหน้าเดียวกัน</Typography>
          </Box>

          <Box className={styles.pageStatus}>
            <Typography className={styles.pageStatusLabel}>ระดับที่เลือก</Typography>
            <Typography className={styles.pageStatusValue}>{selectedDegree ? degreeLabelMap[selectedDegree] : '-'}</Typography>
          </Box>
        </Box>

        <Box className={styles.contentShell}>
          <Box className={styles.introCard}>
            <Box className={styles.introBadge}>
              <SchoolOutlinedIcon fontSize="small" />
              <Typography className={styles.introBadgeText}>CURRICULUM SETUP</Typography>
            </Box>

            <Typography className={styles.introTitle}>เลือกระดับที่ต้องการจัดการ</Typography>
            <Typography className={styles.introDescription}>กดเลือกระดับปริญญาที่ต้องการได้เลย เมื่อเลือกแล้วส่วนเพิ่มหลักสูตรของระดับนั้นจะแสดงด้านล่างทันที</Typography>
          </Box>

          <Box className={styles.degreeGrid}>
            {degreeOptions.map((degree) => <DegreeCard key={degree.id} degree={degree} isSelected={selectedDegree === degree.id} onSelect={handleSelectDegree} />)}
          </Box>

          {showCurriculumSection && (
            <Box className={styles.curriculumSection}>
              <Box className={styles.sectionHeader}>
                <Box>
                  <Typography className={styles.sectionTitle}>{editingCurriculumId ? 'แก้ไขหลักสูตร' : 'เพิ่มหลักสูตร'}</Typography>
                  <Typography className={styles.sectionDescription}>ระดับที่เลือก: {degreeLabelMap[selectedDegree]}</Typography>
                </Box>
              </Box>

              <Box className={styles.formCard}>
                <Typography className={styles.formTitle}>{editingCurriculumId ? 'แก้ไขข้อมูลหลักสูตร' : 'ข้อมูลหลักสูตร'}</Typography>

                <Box className={styles.formGrid}>
                  <TextField label="รหัสหลักสูตร" value={curriculumCode} onChange={(event) => setCurriculumCode(event.target.value)} fullWidth />
                  <TextField label="ชื่อหลักสูตรภาษาไทย" value={curriculumNameTh} onChange={(event) => setCurriculumNameTh(event.target.value)} fullWidth />
                  <TextField label="ชื่อหลักสูตรภาษาอังกฤษ" value={curriculumNameEn} onChange={(event) => setCurriculumNameEn(event.target.value)} fullWidth />
                </Box>

                <Box className={styles.formActionRow}>
                  {editingCurriculumId && <Button variant="outlined" onClick={resetCurriculumForm} className={styles.cancelCurriculumEditButton} disabled={isCurriculumSaving}>ยกเลิกการแก้ไข</Button>}

                  <Button
                    variant="contained"
                    startIcon={editingCurriculumId ? <EditRoundedIcon /> : <AddRoundedIcon />}
                    onClick={handleSubmitCurriculum}
                    disabled={!selectedDegree || !curriculumCode.trim() || !curriculumNameTh.trim() || !curriculumNameEn.trim() || isCurriculumSaving}
                    className={styles.addCurriculumButton}
                  >
                    {isCurriculumSaving ? 'กำลังบันทึก...' : editingCurriculumId ? 'บันทึกการแก้ไข' : 'เพิ่มหลักสูตร'}
                  </Button>
                </Box>
              </Box>

              <Box className={styles.curriculumListSection}>
                <Box className={styles.sectionHeader}>
                  <Box>
                    <Typography className={styles.sectionTitle}>รายการหลักสูตร</Typography>
                    <Typography className={styles.sectionDescription}>หลักสูตรของ {degreeLabelMap[selectedDegree]} จะแสดงที่ส่วนนี้</Typography>
                  </Box>
                </Box>

                {isCurriculumLoading ? (
                  <Box className={styles.emptyState}>
                    <Typography className={styles.emptyStateTitle}>กำลังโหลดข้อมูลหลักสูตร...</Typography>
                    <Typography className={styles.emptyStateDescription}>กรุณารอสักครู่</Typography>
                  </Box>
                ) : curriculumErrorMessage ? (
                  <Box className={styles.emptyState}>
                    <Typography className={styles.emptyStateTitle}>ดึงข้อมูลหลักสูตรไม่สำเร็จ</Typography>
                    <Typography className={styles.emptyStateDescription}>{curriculumErrorMessage}</Typography>
                  </Box>
                ) : currentCurriculumList.length === 0 ? (
                  <Box className={styles.emptyState}>
                    <Typography className={styles.emptyStateTitle}>ยังไม่มีหลักสูตรในระดับนี้</Typography>
                    <Typography className={styles.emptyStateDescription}>กรอกข้อมูลด้านบนแล้วกดเพิ่มหลักสูตร เพื่อสร้างรายการแรก</Typography>
                  </Box>
                ) : (
                  <Box className={styles.curriculumList}>
                    {currentCurriculumList.map((curriculum) => (
                      <CurriculumCard
                        key={curriculum.id}
                        curriculum={curriculum}
                        isExpanded={Boolean(expandedCurriculumIds[curriculum.id])}
                        onToggleExpand={handleToggleCurriculumExpand}
                        onEditCurriculum={handleEditCurriculum}
                        onOpenAddMajorDialog={handleOpenAddMajorDialog}
                        onOpenEditMajorDialog={handleOpenEditMajorDialog}
                        onDeleteMajor={handleDeleteMajor}
                        onDeleteCurriculum={handleDeleteCurriculum}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <MajorDialog
        open={isMajorDialogOpen}
        editingMajorId={editingMajorId}
        activeCurriculum={activeCurriculum}
        majorSearch={majorSearch}
        onSearchChange={(value) => {
          setMajorSearch(value)
          setMajorDialogError('')
        }}
        filteredMajorOptions={filteredMajorOptions}
        selectedMajorIds={selectedMajorIds}
        onToggleMajorSelection={handleToggleMajorSelection}
        selectedMajorOptions={selectedMajorOptions}
        majorDialogError={majorDialogError}
        isDepartmentLoading={isDepartmentLoading}
        departmentErrorMessage={departmentErrorMessage}
        isMajorSaving={isMajorSaving}
        onClose={resetMajorDialogState}
        onSave={handleSaveMajor}
      />
    </Box>
  )
}

export default SelectDegreePage
