import { useMemo, useState } from 'react'
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
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import styles from './selectDegreePage.module.css'

const degreeOptions = [
  {
    id: 'bachelor',
    shortLabel: 'ตรี',
    title: 'ปริญญาตรี',
    description: 'สำหรับการจัดการหลักสูตรระดับปริญญาตรี',
  },
  {
    id: 'master',
    shortLabel: 'โท',
    title: 'ปริญญาโท',
    description: 'สำหรับการจัดการหลักสูตรระดับปริญญาโท',
  },
  {
    id: 'doctorate',
    shortLabel: 'เอก',
    title: 'ปริญญาเอก',
    description: 'สำหรับการจัดการหลักสูตรระดับปริญญาเอก',
  },
]

const degreeLabelMap = {
  bachelor: 'ปริญญาตรี',
  master: 'ปริญญาโท',
  doctorate: 'ปริญญาเอก',
}

const mockMajorOptions = [
  {
    id: 'is',
    majorCode: 'IS',
    majorNameTh: 'สาขาวิชาระบบสารสนเทศ',
    majorNameEn: 'Information Systems',
  },
  {
    id: 'it',
    majorCode: 'IT',
    majorNameTh: 'สาขาวิชาเทคโนโลยีสารสนเทศ',
    majorNameEn: 'Information Technology',
  },
  {
    id: 'dm',
    majorCode: 'DM',
    majorNameTh: 'สาขาวิชาการตลาดดิจิทัล',
    majorNameEn: 'Digital Marketing',
  },
  {
    id: 'acc',
    majorCode: 'ACC',
    majorNameTh: 'สาขาวิชาการบัญชี',
    majorNameEn: 'Accounting',
  },
  {
    id: 'fin',
    majorCode: 'FIN',
    majorNameTh: 'สาขาวิชาการเงิน',
    majorNameEn: 'Finance',
  },
  {
    id: 'log',
    majorCode: 'LOG',
    majorNameTh: 'สาขาวิชาการจัดการโลจิสติกส์',
    majorNameEn: 'Logistics Management',
  },
]

function DegreeCard({ degree, isSelected, onSelect }) {
  return (
    <button
      type="button"
      className={`${styles.degreeCard} ${isSelected ? styles.degreeCardActive : ''}`}
      onClick={() => onSelect(degree.id)}
    >
      <Box className={styles.degreeCardTop}>
        <Chip
          label={degree.shortLabel}
          className={isSelected ? styles.activeChip : styles.defaultChip}
        />

        {isSelected && (
          <Box className={styles.selectedPill}>
            <Typography className={styles.selectedPillText}>
              เลือกแล้ว
            </Typography>
          </Box>
        )}
      </Box>

      <Box className={styles.degreeCardBody}>
        <Typography className={styles.degreeTitle}>
          {degree.title}
        </Typography>

        <Typography className={styles.degreeDescription}>
          {degree.description}
        </Typography>
      </Box>
    </button>
  )
}

function CurriculumCard({
  curriculum,
  isExpanded,
  onToggleExpand,
  onEditCurriculum,
  onOpenAddMajorDialog,
  onOpenEditMajorDialog,
  onDeleteMajor,
}) {
  const majorCount = curriculum.majors.length

  return (
    <Box className={styles.curriculumCard}>
      <Box className={styles.curriculumCardHeader}>
        <Box>
          <Typography className={styles.curriculumCode}>
            {curriculum.curriculumCode}
          </Typography>

          <Typography className={styles.curriculumNameTh}>
            {curriculum.curriculumNameTh}
          </Typography>

          <Typography className={styles.curriculumNameEn}>
            {curriculum.curriculumNameEn}
          </Typography>
        </Box>

        <Box className={styles.curriculumActionGroup}>
          <Button
            variant="text"
            startIcon={<EditRoundedIcon />}
            className={styles.editCurriculumButton}
            onClick={() => onEditCurriculum(curriculum)}
          >
            แก้ไขหลักสูตร
          </Button>

          <Button
            variant="outlined"
            startIcon={<AddRoundedIcon />}
            className={styles.addMajorButton}
            onClick={() => onOpenAddMajorDialog(curriculum.id)}
          >
            เพิ่มสาขา
          </Button>
        </Box>
      </Box>

      {majorCount === 0 ? (
        <Box className={styles.majorPlaceholder}>
          <Typography className={styles.majorPlaceholderTitle}>
            ยังไม่มีสาขาในหลักสูตรนี้
          </Typography>

          <Typography className={styles.majorPlaceholderDescription}>
            กดปุ่มเพิ่มสาขาเพื่อเลือกสาขาที่ต้องการใช้งาน
          </Typography>
        </Box>
      ) : (
        <>
          <button
            type="button"
            className={styles.majorSummaryButton}
            onClick={() => onToggleExpand(curriculum.id)}
          >
            <Box className={styles.majorSummaryLeft}>
              <Typography className={styles.majorSummaryTitle}>
                มีสาขาในหลักสูตรนี้ {majorCount} รายการ
              </Typography>

              <Typography className={styles.majorSummaryDescription}>
                {isExpanded ? 'กดเพื่อซ่อนรายการสาขา' : 'กดเพื่อดูรายการสาขาทั้งหมด'}
              </Typography>
            </Box>

            <Box className={styles.majorSummaryArrow}>
              {isExpanded ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
            </Box>
          </button>

          <Collapse in={isExpanded} timeout={220}>
            <Box className={styles.majorList}>
              {curriculum.majors.map((major) => (
                <Box key={major.id} className={styles.majorItem}>
                  <Box className={styles.majorMeta}>
                    <Typography className={styles.majorItemCode}>
                      {major.majorCode}
                    </Typography>

                    <Typography className={styles.majorItemNameTh}>
                      {major.majorNameTh}
                    </Typography>

                    <Typography className={styles.majorItemNameEn}>
                      {major.majorNameEn}
                    </Typography>
                  </Box>

                  <Box className={styles.majorActionGroup}>
                    <Button
                      variant="text"
                      startIcon={<EditRoundedIcon />}
                      className={styles.majorTextButton}
                      onClick={() => onOpenEditMajorDialog(curriculum.id, major)}
                    >
                      แก้ไข
                    </Button>

                    <Button
                      variant="text"
                      startIcon={<DeleteOutlineRoundedIcon />}
                      className={styles.deleteMajorButton}
                      onClick={() => onDeleteMajor(curriculum.id, major.id)}
                    >
                      ลบ
                    </Button>
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
  onClose,
  onSave,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        className: styles.majorDialogPaper,
      }}
    >
      <DialogTitle className={styles.majorDialogTitle}>
        {editingMajorId ? 'แก้ไขสาขา' : 'เพิ่มสาขา'}
      </DialogTitle>

      <DialogContent className={styles.majorDialogContent}>
        <Typography className={styles.dialogHint}>
          หลักสูตร: {activeCurriculum?.curriculumNameTh || '-'}
        </Typography>

        <Typography className={styles.dialogSubHint}>
          {editingMajorId
            ? 'เลือกสาขาใหม่ 1 รายการเพื่อแทนที่ข้อมูลเดิม'
            : 'ค้นหาและเลือกได้หลายสาขาในรอบเดียว แล้วกดเพิ่มสาขา'}
        </Typography>

        <TextField
          label="ค้นหาสาขา"
          placeholder="ค้นหาจากรหัส ชื่อภาษาไทย หรือชื่อภาษาอังกฤษ"
          value={majorSearch}
          onChange={(event) => onSearchChange(event.target.value)}
          fullWidth
        />

        <Box className={styles.majorOptionList}>
          {filteredMajorOptions.length === 0 ? (
            <Box className={styles.dialogEmptyState}>
              <Typography className={styles.emptyStateTitle}>
                ไม่พบสาขาที่ค้นหา
              </Typography>

              <Typography className={styles.emptyStateDescription}>
                ลองพิมพ์คำค้นหาใหม่อีกครั้ง
              </Typography>
            </Box>
          ) : (
            filteredMajorOptions.map((majorOption) => {
              const isSelected = selectedMajorIds.includes(majorOption.id)

              return (
                <button
                  key={majorOption.id}
                  type="button"
                  className={`${styles.majorOptionCard} ${isSelected ? styles.majorOptionCardActive : ''}`}
                  onClick={() => onToggleMajorSelection(majorOption.id)}
                >
                  <Box className={styles.majorOptionHeader}>
                    <Typography className={styles.majorOptionCode}>
                      {majorOption.majorCode}
                    </Typography>

                    {isSelected && (
                      <Typography className={styles.majorOptionSelectState}>
                        เลือกอยู่
                      </Typography>
                    )}
                  </Box>

                  <Typography className={styles.majorOptionNameTh}>
                    {majorOption.majorNameTh}
                  </Typography>

                  <Typography className={styles.majorOptionNameEn}>
                    {majorOption.majorNameEn}
                  </Typography>
                </button>
              )
            })
          )}
        </Box>

        {selectedMajorOptions.length > 0 && (
          <Box className={styles.selectedMajorPreview}>
            <Box className={styles.selectedMajorPreviewHeader}>
              <Typography className={styles.selectedMajorPreviewTitle}>
                {editingMajorId ? 'สาขาที่เลือกสำหรับแก้ไข' : 'สาขาที่เลือกในรอบนี้'}
              </Typography>

              <Typography className={styles.selectedMajorPreviewCount}>
                {selectedMajorOptions.length} รายการ
              </Typography>
            </Box>

            <Box className={styles.selectedMajorTagList}>
              {selectedMajorOptions.map((major) => (
                <Box key={major.id} className={styles.selectedMajorTag}>
                  <Typography className={styles.selectedMajorTagCode}>
                    {major.majorCode}
                  </Typography>

                  <Typography className={styles.selectedMajorTagNameTh}>
                    {major.majorNameTh}
                  </Typography>

                  <Typography className={styles.selectedMajorTagNameEn}>
                    {major.majorNameEn}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {majorDialogError && (
          <Typography className={styles.dialogErrorText}>
            {majorDialogError}
          </Typography>
        )}
      </DialogContent>

      <DialogActions className={styles.majorDialogActions}>
        <Button
          variant="outlined"
          onClick={onClose}
          className={styles.dialogCancelButton}
        >
          ยกเลิก
        </Button>

        <Button
          variant="contained"
          onClick={onSave}
          className={styles.dialogSubmitButton}
        >
          {editingMajorId
            ? 'บันทึกการแก้ไข'
            : `เพิ่มสาขา${selectedMajorOptions.length > 0 ? ` (${selectedMajorOptions.length})` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function SelectDegreePage() {
  const [selectedDegree, setSelectedDegree] = useState('')
  const [curriculumCode, setCurriculumCode] = useState('')
  const [curriculumNameTh, setCurriculumNameTh] = useState('')
  const [curriculumNameEn, setCurriculumNameEn] = useState('')
  const [editingCurriculumId, setEditingCurriculumId] = useState(null)

  const [curriculumListByDegree, setCurriculumListByDegree] = useState({
    bachelor: [],
    master: [],
    doctorate: [],
  })

  const [expandedCurriculumIds, setExpandedCurriculumIds] = useState({})

  const [isMajorDialogOpen, setIsMajorDialogOpen] = useState(false)
  const [activeCurriculumId, setActiveCurriculumId] = useState(null)
  const [majorSearch, setMajorSearch] = useState('')
  const [selectedMajorIds, setSelectedMajorIds] = useState([])
  const [editingMajorId, setEditingMajorId] = useState(null)
  const [majorDialogError, setMajorDialogError] = useState('')

  const showCurriculumSection = Boolean(selectedDegree)

  const currentCurriculumList = useMemo(() => {
    if (!selectedDegree) return []
    return curriculumListByDegree[selectedDegree] || []
  }, [selectedDegree, curriculumListByDegree])

  const activeCurriculum = useMemo(() => {
    return currentCurriculumList.find((curriculum) => curriculum.id === activeCurriculumId) || null
  }, [currentCurriculumList, activeCurriculumId])

  const filteredMajorOptions = useMemo(() => {
    const keyword = majorSearch.trim().toLowerCase()

    if (!keyword) return mockMajorOptions

    return mockMajorOptions.filter((major) => {
      return (
        major.majorCode.toLowerCase().includes(keyword) ||
        major.majorNameTh.toLowerCase().includes(keyword) ||
        major.majorNameEn.toLowerCase().includes(keyword)
      )
    })
  }, [majorSearch])

  const selectedMajorOptions = useMemo(() => {
    return mockMajorOptions.filter((major) => selectedMajorIds.includes(major.id))
  }, [selectedMajorIds])

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

  const handleSubmitCurriculum = () => {
    const trimmedCode = curriculumCode.trim()
    const trimmedNameTh = curriculumNameTh.trim()
    const trimmedNameEn = curriculumNameEn.trim()

    if (!selectedDegree || !trimmedCode || !trimmedNameTh || !trimmedNameEn) return

    if (editingCurriculumId) {
      setCurriculumListByDegree((prev) => ({
        ...prev,
        [selectedDegree]: prev[selectedDegree].map((curriculum) => {
          if (curriculum.id !== editingCurriculumId) return curriculum

          return {
            ...curriculum,
            curriculumCode: trimmedCode,
            curriculumNameTh: trimmedNameTh,
            curriculumNameEn: trimmedNameEn,
          }
        }),
      }))

      resetCurriculumForm()
      return
    }

    const newCurriculum = {
      id: Date.now(),
      curriculumCode: trimmedCode,
      curriculumNameTh: trimmedNameTh,
      curriculumNameEn: trimmedNameEn,
      majors: [],
    }

    setCurriculumListByDegree((prev) => ({
      ...prev,
      [selectedDegree]: [...prev[selectedDegree], newCurriculum],
    }))

    resetCurriculumForm()
  }

  const handleEditCurriculum = (curriculum) => {
    setEditingCurriculumId(curriculum.id)
    setCurriculumCode(curriculum.curriculumCode)
    setCurriculumNameTh(curriculum.curriculumNameTh)
    setCurriculumNameEn(curriculum.curriculumNameEn)

    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }

  const handleToggleCurriculumExpand = (curriculumId) => {
    setExpandedCurriculumIds((prev) => ({
      ...prev,
      [curriculumId]: !prev[curriculumId],
    }))
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
      if (prev.includes(majorOptionId)) {
        return prev.filter((id) => id !== majorOptionId)
      }

      return [...prev, majorOptionId]
    })
  }

  const handleDeleteMajor = (curriculumId, majorId) => {
    setCurriculumListByDegree((prev) => ({
      ...prev,
      [selectedDegree]: prev[selectedDegree].map((curriculum) => {
        if (curriculum.id !== curriculumId) return curriculum

        return {
          ...curriculum,
          majors: curriculum.majors.filter((major) => major.id !== majorId),
        }
      }),
    }))
  }

  const handleSaveMajor = () => {
    if (!activeCurriculum) return

    if (selectedMajorOptions.length === 0) {
      setMajorDialogError('กรุณาเลือกสาขาก่อนบันทึก')
      return
    }

    if (editingMajorId) {
      const selectedMajorOption = selectedMajorOptions[0]

      const hasDuplicateMajor = activeCurriculum.majors.some((major) => {
        return major.majorRefId === selectedMajorOption.id && major.id !== editingMajorId
      })

      if (hasDuplicateMajor) {
        setMajorDialogError('สาขานี้ถูกเพิ่มในหลักสูตรนี้แล้ว')
        return
      }

      setCurriculumListByDegree((prev) => ({
        ...prev,
        [selectedDegree]: prev[selectedDegree].map((curriculum) => {
          if (curriculum.id !== activeCurriculumId) return curriculum

          return {
            ...curriculum,
            majors: curriculum.majors.map((major) => {
              if (major.id !== editingMajorId) return major

              return {
                ...major,
                majorRefId: selectedMajorOption.id,
                majorCode: selectedMajorOption.majorCode,
                majorNameTh: selectedMajorOption.majorNameTh,
                majorNameEn: selectedMajorOption.majorNameEn,
              }
            }),
          }
        }),
      }))

      setExpandedCurriculumIds((prev) => ({
        ...prev,
        [activeCurriculumId]: true,
      }))

      resetMajorDialogState()
      return
    }

    const existingMajorRefIds = new Set(
      activeCurriculum.majors.map((major) => major.majorRefId)
    )

    const newMajorOptions = selectedMajorOptions.filter((majorOption) => {
      return !existingMajorRefIds.has(majorOption.id)
    })

    if (newMajorOptions.length === 0) {
      setMajorDialogError('สาขาที่เลือกถูกเพิ่มในหลักสูตรนี้แล้ว')
      return
    }

    setCurriculumListByDegree((prev) => ({
      ...prev,
      [selectedDegree]: prev[selectedDegree].map((curriculum) => {
        if (curriculum.id !== activeCurriculumId) return curriculum

        return {
          ...curriculum,
          majors: [
            ...curriculum.majors,
            ...newMajorOptions.map((majorOption) => ({
              id: Date.now() + Math.random(),
              majorRefId: majorOption.id,
              majorCode: majorOption.majorCode,
              majorNameTh: majorOption.majorNameTh,
              majorNameEn: majorOption.majorNameEn,
            })),
          ],
        }
      }),
    }))

    setExpandedCurriculumIds((prev) => ({
      ...prev,
      [activeCurriculumId]: true,
    }))

    resetMajorDialogState()
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>
              จัดการหลักสูตร
            </Typography>

            <Typography className={styles.pageDescription}>
              เลือกระดับปริญญาเพื่อเริ่มเพิ่มหลักสูตรและจัดการสาขาในหน้าเดียวกัน
            </Typography>
          </Box>

          <Box className={styles.pageStatus}>
            <Typography className={styles.pageStatusLabel}>
              ระดับที่เลือก
            </Typography>

            <Typography className={styles.pageStatusValue}>
              {selectedDegree ? degreeLabelMap[selectedDegree] : '-'}
            </Typography>
          </Box>
        </Box>

        <Box className={styles.contentShell}>
          <Box className={styles.introCard}>
            <Box className={styles.introBadge}>
              <SchoolOutlinedIcon fontSize="small" />
              <Typography className={styles.introBadgeText}>
                CURRICULUM SETUP
              </Typography>
            </Box>

            <Typography className={styles.introTitle}>
              เลือกระดับที่ต้องการจัดการ
            </Typography>

            <Typography className={styles.introDescription}>
              กดเลือกระดับปริญญาที่ต้องการได้เลย
              เมื่อเลือกแล้วส่วนเพิ่มหลักสูตรของระดับนั้นจะแสดงด้านล่างทันที
            </Typography>
          </Box>

          <Box className={styles.degreeGrid}>
            {degreeOptions.map((degree) => (
              <DegreeCard
                key={degree.id}
                degree={degree}
                isSelected={selectedDegree === degree.id}
                onSelect={handleSelectDegree}
              />
            ))}
          </Box>

          {showCurriculumSection && (
            <Box className={styles.curriculumSection}>
              <Box className={styles.sectionHeader}>
                <Box>
                  <Typography className={styles.sectionTitle}>
                    {editingCurriculumId ? 'แก้ไขหลักสูตร' : 'เพิ่มหลักสูตร'}
                  </Typography>

                  <Typography className={styles.sectionDescription}>
                    ระดับที่เลือก: {degreeLabelMap[selectedDegree]}
                  </Typography>
                </Box>
              </Box>

              <Box className={styles.formCard}>
                <Typography className={styles.formTitle}>
                  {editingCurriculumId ? 'แก้ไขข้อมูลหลักสูตร' : 'ข้อมูลหลักสูตร'}
                </Typography>

                <Box className={styles.formGrid}>
                  <TextField
                    label="รหัสหลักสูตร"
                    value={curriculumCode}
                    onChange={(event) => setCurriculumCode(event.target.value)}
                    fullWidth
                  />

                  <TextField
                    label="ชื่อหลักสูตรภาษาไทย"
                    value={curriculumNameTh}
                    onChange={(event) => setCurriculumNameTh(event.target.value)}
                    fullWidth
                  />

                  <TextField
                    label="ชื่อหลักสูตรภาษาอังกฤษ"
                    value={curriculumNameEn}
                    onChange={(event) => setCurriculumNameEn(event.target.value)}
                    fullWidth
                  />
                </Box>

                <Box className={styles.formActionRow}>
                  {editingCurriculumId && (
                    <Button
                      variant="outlined"
                      onClick={resetCurriculumForm}
                      className={styles.cancelCurriculumEditButton}
                    >
                      ยกเลิกการแก้ไข
                    </Button>
                  )}

                  <Button
                    variant="contained"
                    startIcon={editingCurriculumId ? <EditRoundedIcon /> : <AddRoundedIcon />}
                    onClick={handleSubmitCurriculum}
                    disabled={
                      !selectedDegree ||
                      !curriculumCode.trim() ||
                      !curriculumNameTh.trim() ||
                      !curriculumNameEn.trim()
                    }
                    className={styles.addCurriculumButton}
                  >
                    {editingCurriculumId ? 'บันทึกการแก้ไข' : 'เพิ่มหลักสูตร'}
                  </Button>
                </Box>
              </Box>

              <Box className={styles.curriculumListSection}>
                <Box className={styles.sectionHeader}>
                  <Box>
                    <Typography className={styles.sectionTitle}>
                      รายการหลักสูตร
                    </Typography>

                    <Typography className={styles.sectionDescription}>
                      หลักสูตรของ {degreeLabelMap[selectedDegree]} จะแสดงที่ส่วนนี้
                    </Typography>
                  </Box>
                </Box>

                {currentCurriculumList.length === 0 ? (
                  <Box className={styles.emptyState}>
                    <Typography className={styles.emptyStateTitle}>
                      ยังไม่มีหลักสูตรในระดับนี้
                    </Typography>

                    <Typography className={styles.emptyStateDescription}>
                      กรอกข้อมูลด้านบนแล้วกดเพิ่มหลักสูตร เพื่อสร้างรายการแรก
                    </Typography>
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
        onClose={resetMajorDialogState}
        onSave={handleSaveMajor}
      />
    </Box>
  )
}

export default SelectDegreePage