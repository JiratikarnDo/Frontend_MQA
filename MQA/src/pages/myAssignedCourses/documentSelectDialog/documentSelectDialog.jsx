import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import EditCalendarRoundedIcon from '@mui/icons-material/EditCalendarRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useNavigate } from 'react-router-dom'
import styles from './documentSelectDialog.module.css'

const MQA3_ACTIVE_DRAFT_KEY = 'mqa3ActiveDraftKey'

function getLevelLabel(level) {
  if (level === 'bachelor') return 'ปริญญาตรี'
  if (level === 'master') return 'ปริญญาโท'
  if (level === 'doctoral') return 'ปริญญาเอก'
  return '-'
}

function normalizeText(value) {
  return String(value ?? '').trim()
}

function normalizeDocumentStatus(value) {
  const text = normalizeText(value).toLowerCase().replace(/[\s_-]/g, '')
  if (!text) return 'notStarted'
  if (['submitted', 'submit', 'sent', 'approved', 'pending', 'pendingapproval', 'waitingapproval'].includes(text)) return 'submitted'
  if (['draft', 'savedraft'].includes(text)) return 'draft'
  if (['waitinggrade', 'waitgrade', 'aftergrade'].includes(text)) return 'waitingGrade'
  if (['rejected', 'reject', 'rejectedbydean'].includes(text)) return 'rejected'
  return 'notStarted'
}

function getDocumentStatusLabel(status) {
  if (status === 'submitted') return 'ส่งแล้ว'
  if (status === 'draft') return 'บันทึกแล้ว'
  if (status === 'waitingGrade') return 'รอหลังเกรดออก'
  if (status === 'rejected') return 'ตีกลับ'
  return 'ยังไม่เริ่ม'
}

function getDocumentStatusChipSx(status) {
  if (status === 'submitted') return { backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.22)', fontWeight: 800 }
  if (status === 'draft') return { backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.22)', fontWeight: 800 }
  if (status === 'rejected') return { backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.22)', fontWeight: 800 }
  return { backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8', border: '1px solid rgba(59, 130, 246, 0.22)', fontWeight: 800 }
}

function getUsableDocumentId(documentInfo) {
  if (!documentInfo || documentInfo.status === 'notStarted') return ''
  return normalizeText(documentInfo.id)
}

function getMqa3DraftKeyFromState(state = {}) {
  const courseItem = state?.courseItem ?? {}
  const keySource = state?.mqa3DraftKey || state?.openingCourseItemId || state?.requestedCourseItemId || state?.courseId || state?.courseCode || courseItem?.openingCourseItemId || courseItem?.requestedCourseItemId || courseItem?.courseId || courseItem?.courseCode || ''
  if (keySource) return String(keySource).startsWith('mqa3Draft:') ? String(keySource) : `mqa3Draft:${keySource}`
  return 'mqa3Draft:new'
}

function clearSessionStorageKey(key) {
  try {
    if (key) sessionStorage.removeItem(key)
  } catch (error) {
    console.warn('Cannot remove MQA3 draft from sessionStorage:', error)
  }
}

function setActiveMqa3DraftKey(draftKey) {
  try {
    if (draftKey) sessionStorage.setItem(MQA3_ACTIVE_DRAFT_KEY, draftKey)
  } catch (error) {
    console.warn('Cannot set active MQA3 draft key:', error)
  }
}

function clearMqa3DraftForCreate(draftKey) {
  clearSessionStorageKey(draftKey)
  setActiveMqa3DraftKey(draftKey)
}

function clearMqa3DocumentFieldsFromCourseItem(courseItem) {
  if (!courseItem || typeof courseItem !== 'object') return courseItem

  const nextRawData = courseItem.rawData && typeof courseItem.rawData === 'object'
    ? {
        ...courseItem.rawData,
        mqa3Id: '',
        mqa3_id: '',
        tqf3Id: '',
        tqf3_id: '',
        mqa3Status: 'notStarted',
        mqa3_status: 'notStarted',
        tqf3Status: 'notStarted',
        tqf3_status: 'notStarted',
        selectedDocumentId: '',
        documentId: '',
        document_id: '',
        mqa3: null,
        tqf3: null,
      }
    : courseItem.rawData

  return {
    ...courseItem,
    mqa3Id: '',
    mqa3_id: '',
    tqf3Id: '',
    tqf3_id: '',
    mqa3Status: 'notStarted',
    mqa3_status: 'notStarted',
    tqf3Status: 'notStarted',
    tqf3_status: 'notStarted',
    selectedDocumentId: '',
    documentId: '',
    document_id: '',
    mqa3: null,
    tqf3: null,
    rawData: nextRawData,
  }
}

function DocumentSelectDialog({ open, onClose, courseItem }) {
  const navigate = useNavigate()

  const getDocumentInfo = (documentType) => {
    if (documentType === 'mqa3') {
      const id = normalizeText(courseItem?.mqa3Id || courseItem?.tqf3Id || courseItem?.mqa3_id || courseItem?.tqf3_id || courseItem?.mqa3?.id || courseItem?.tqf3?.id || '')
      const status = normalizeDocumentStatus(courseItem?.mqa3Status || courseItem?.tqf3Status || courseItem?.mqa3_status || courseItem?.tqf3_status || courseItem?.mqa3?.status || courseItem?.tqf3?.status)
      return { id, status, label: 'มคอ.3', documentType: 'mqa3' }
    }

    const id = normalizeText(courseItem?.mqa5Id || courseItem?.tqf5Id || courseItem?.mqa5_id || courseItem?.tqf5_id || courseItem?.mqa5?.id || courseItem?.tqf5?.id || '')
    const status = normalizeDocumentStatus(courseItem?.mqa5Status || courseItem?.tqf5Status || courseItem?.mqa5_status || courseItem?.tqf5_status || courseItem?.mqa5?.status || courseItem?.tqf5?.status)
    return { id, status, label: 'มคอ.5', documentType: 'mqa5' }
  }

  const isMqa3Saved = () => {
    const mqa3Info = getDocumentInfo('mqa3')
    return Boolean(getUsableDocumentId(mqa3Info))
  }

  const canOpenDocument = (documentType) => {
    const documentInfo = getDocumentInfo(documentType)
    if (!courseItem?.level) return false
    if (documentInfo.status === 'submitted') return false
    if (documentInfo.status === 'waitingGrade') return false
    if (documentType === 'mqa5' && !isMqa3Saved()) return false
    return true
  }

  const getDocumentMode = (documentType) => {
    const documentInfo = getDocumentInfo(documentType)
    if (documentInfo.status === 'submitted') return 'submittedLocked'
    if (documentInfo.status === 'waitingGrade') return 'waitingGradeLocked'
    if (documentType === 'mqa5' && !isMqa3Saved()) return 'mqa3RequiredLocked'
    if (documentInfo.status === 'notStarted') return 'create'
    return getUsableDocumentId(documentInfo) ? 'edit' : 'create'
  }

  const getButtonText = (documentType) => {
    const documentInfo = getDocumentInfo(documentType)
    if (documentType === 'mqa5' && !isMqa3Saved()) return 'ต้องบันทึก มคอ.3 ก่อน'
    if (documentInfo.status === 'submitted') return `${documentInfo.label} ส่งแล้ว ไม่สามารถแก้ไขได้`
    if (documentInfo.status === 'waitingGrade') return `ยังไม่สามารถจัดทำ ${documentInfo.label} ได้`
    if (documentInfo.status === 'draft') return `แก้ไขเอกสาร ${documentInfo.label}`
    if (documentInfo.status === 'rejected') return `แก้ไขและส่งใหม่ ${documentInfo.label}`
    return `ไปหน้ากรอก ${documentInfo.label}`
  }

  const getOptionDescription = (documentType) => {
    const documentInfo = getDocumentInfo(documentType)
    if (documentType === 'mqa5' && !isMqa3Saved()) return 'ต้องมีการบันทึกเอกสาร มคอ.3 ของรายวิชานี้ก่อน จึงจะสามารถจัดทำ มคอ.5 ได้'
    if (documentInfo.status === 'submitted') return `เอกสาร ${documentInfo.label} ถูกส่งเข้าระบบแล้ว จึงไม่สามารถแก้ไขจากหน้านี้ได้`
    if (documentInfo.status === 'waitingGrade') return `เอกสาร ${documentInfo.label} ยังไม่พร้อมให้จัดทำในตอนนี้`
    if (documentInfo.status === 'draft') return `เอกสาร ${documentInfo.label} ถูกบันทึกไว้แล้ว หากเข้าไปครั้งนี้จะเป็นการแก้ไขแบบร่างเดิม`
    if (documentInfo.status === 'rejected') return `เอกสาร ${documentInfo.label} ถูกตีกลับ สามารถเข้าไปแก้ไขเอกสารเดิมได้`
    if (documentType === 'mqa3') return 'ใช้สำหรับจัดทำแผนการสอนและรายละเอียดรายวิชาก่อนเปิดภาคการศึกษา'
    return 'ใช้สำหรับสรุปผลการเรียนการสอนและผลลัพธ์หลังจบรายวิชา โดยอ้างอิงข้อมูลตั้งต้นจาก มคอ.3'
  }

  const buildNavigationState = (documentType) => {
    const mqa3Info = getDocumentInfo('mqa3')
    const mqa5Info = getDocumentInfo('mqa5')
    const selectedDocumentInfo = getDocumentInfo(documentType)
    const selectedDocumentId = getUsableDocumentId(selectedDocumentInfo)
    const mqa3DocumentId = getUsableDocumentId(mqa3Info)
    const mqa5DocumentId = getUsableDocumentId(mqa5Info)
    const isCreatingMqa3 = documentType === 'mqa3' && selectedDocumentInfo.status === 'notStarted'
    const nextCourseItem = isCreatingMqa3 ? clearMqa3DocumentFieldsFromCourseItem(courseItem) : courseItem
    const hasMqa3Reference = Boolean(mqa3DocumentId)

    const navigationState = {
      documentType,
      documentMode: isCreatingMqa3 ? 'create' : getDocumentMode(documentType),
      isExistingDocument: isCreatingMqa3 ? false : Boolean(selectedDocumentId),
      selectedDocumentId: isCreatingMqa3 ? '' : selectedDocumentId,
      selectedDocumentStatus: selectedDocumentInfo.status,
      hasMqa3Reference: isCreatingMqa3 ? false : hasMqa3Reference,
      sourceMqa3Id: isCreatingMqa3 ? '' : mqa3DocumentId,
      sourceTqf3Id: isCreatingMqa3 ? '' : mqa3DocumentId,
      referenceMqa3Id: isCreatingMqa3 ? '' : mqa3DocumentId,
      referenceTqf3Id: isCreatingMqa3 ? '' : mqa3DocumentId,
      referenceMqa3Status: isCreatingMqa3 ? 'notStarted' : mqa3Info.status,
      referenceTqf3Status: isCreatingMqa3 ? 'notStarted' : mqa3Info.status,
      courseItem: nextCourseItem,
      assignmentId: courseItem?.id ?? '',
      level: courseItem?.level ?? '',
      levelLabel: getLevelLabel(courseItem?.level),
      openingRequestId: courseItem?.openingRequestId ?? courseItem?.requestId ?? '',
      openingCourseItemId: courseItem?.openingCourseItemId ?? courseItem?.requestedCourseItemId ?? '',
      requestedCourseItemId: courseItem?.requestedCourseItemId ?? courseItem?.openingCourseItemId ?? '',
      courseId: courseItem?.courseId ?? '',
      courseCode: courseItem?.courseCode ?? '',
      courseName: courseItem?.courseName ?? '',
      curriculumName: courseItem?.curriculumName ?? '',
      majorName: courseItem?.majorName ?? '',
      semester: courseItem?.semester ?? '',
      academicYear: courseItem?.academicYear ?? '',
      yearLevel: courseItem?.yearLevel ?? '',
      sectionNumber: courseItem?.sectionNumber ?? '',
      studentCount: courseItem?.studentCount ?? 0,
      assignedTeacher: courseItem?.assignedTeacher ?? '',
      mqa3Id: isCreatingMqa3 ? '' : mqa3DocumentId,
      tqf3Id: isCreatingMqa3 ? '' : mqa3DocumentId,
      mqa3Status: isCreatingMqa3 ? 'notStarted' : mqa3Info.status,
      tqf3Status: isCreatingMqa3 ? 'notStarted' : mqa3Info.status,
      mqa5Id: mqa5DocumentId,
      tqf5Id: mqa5DocumentId,
      mqa5Status: mqa5Info.status,
      tqf5Status: mqa5Info.status,
    }

    if (isCreatingMqa3) {
      const freshDraftKey = getMqa3DraftKeyFromState(navigationState)
      return { ...navigationState, mqa3DraftKey: freshDraftKey }
    }

    return navigationState
  }

  const handleNavigate = (path, documentType) => {
    if (!canOpenDocument(documentType)) return

    const nextNavigationState = buildNavigationState(documentType)

    if (documentType === 'mqa3' && nextNavigationState.documentMode === 'create') {
      clearMqa3DraftForCreate(nextNavigationState.mqa3DraftKey)
    }

    onClose()
    navigate(path, { state: nextNavigationState })
  }

  const mqa3Info = getDocumentInfo('mqa3')
  const mqa5Info = getDocumentInfo('mqa5')
  const canOpenMqa3 = canOpenDocument('mqa3')
  const canOpenMqa5 = canOpenDocument('mqa5')

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ className: styles.dialogPaper }}>
      <DialogTitle className={styles.dialogTitleWrapper}>
        <Box className={styles.dialogTitleRow}>
          <Box className={styles.dialogTitleContent}>
            <Typography className={styles.dialogEyebrow}>
              เลือกเอกสารที่ต้องการจัดทำ
            </Typography>
            <Typography className={styles.dialogTitle}>
              {courseItem?.courseCode} {courseItem?.courseName}
            </Typography>
            <Typography className={styles.dialogDescription}>
              เลือกว่าจะเข้าไปจัดทำหรือแก้ไข มคอ.3 / มคอ.5 ของรายวิชากลุ่มนี้จากตัวเลือกด้านล่าง
            </Typography>
          </Box>

          <Button onClick={onClose} className={styles.closeButton} startIcon={<CloseRoundedIcon />}>
            ปิด
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent className={styles.dialogContent}>
        <Box className={styles.courseMetaCard}>
          <Box className={styles.metaRow}>
            <Typography className={styles.metaLabel}>ระดับหลักสูตร</Typography>
            <Typography className={styles.metaValue}>{getLevelLabel(courseItem?.level)}</Typography>
          </Box>

          <Box className={styles.metaRow}>
            <Typography className={styles.metaLabel}>หลักสูตร</Typography>
            <Typography className={styles.metaValue}>{courseItem?.curriculumName || '-'}</Typography>
          </Box>

          <Box className={styles.metaRow}>
            <Typography className={styles.metaLabel}>สาขา</Typography>
            <Typography className={styles.metaValue}>{courseItem?.majorName || '-'}</Typography>
          </Box>

          <Box className={styles.metaRow}>
            <Typography className={styles.metaLabel}>ภาคการศึกษา</Typography>
            <Typography className={styles.metaValue}>
              {courseItem?.semester === 'summer' ? `ภาคฤดูร้อน/${courseItem?.academicYear || '-'}` : `ภาคการศึกษา ${courseItem?.semester || '-'}/${courseItem?.academicYear || '-'}`}
            </Typography>
          </Box>

          <Box className={styles.metaRow}>
            <Typography className={styles.metaLabel}>กลุ่มเรียน</Typography>
            <Typography className={styles.metaValue}>กลุ่ม {courseItem?.sectionNumber || '-'}</Typography>
          </Box>
        </Box>

        <Box className={styles.optionGrid}>
          <Box className={styles.optionCard}>
            <Box className={styles.optionIconBlue}>
              <EditCalendarRoundedIcon />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, width: '100%' }}>
              <Typography className={styles.optionTitle}>
                {mqa3Info.status === 'submitted' ? 'มคอ.3 ส่งแล้ว' : getUsableDocumentId(mqa3Info) ? 'แก้ไข มคอ.3' : 'กรอก มคอ.3'}
              </Typography>
              <Chip label={getDocumentStatusLabel(mqa3Info.status)} size="small" sx={getDocumentStatusChipSx(mqa3Info.status)} />
            </Box>

            <Typography className={styles.optionDescription}>
              {getOptionDescription('mqa3')}
            </Typography>

            <Button variant="contained" fullWidth startIcon={<DescriptionRoundedIcon />} className={styles.primaryButton} onClick={() => handleNavigate('/mqa3Insert-1', 'mqa3')} disabled={!canOpenMqa3}>
              {getButtonText('mqa3')}
            </Button>
          </Box>

          <Box className={styles.optionCard}>
            <Box className={styles.optionIconIndigo}>
              <FactCheckRoundedIcon />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, width: '100%' }}>
              <Typography className={styles.optionTitle}>
                {!isMqa3Saved() ? 'มคอ.5 รอ มคอ.3' : mqa5Info.status === 'submitted' ? 'มคอ.5 ส่งแล้ว' : getUsableDocumentId(mqa5Info) ? 'แก้ไข มคอ.5' : 'กรอก มคอ.5'}
              </Typography>
              <Chip label={!isMqa3Saved() ? 'รอ มคอ.3' : getDocumentStatusLabel(mqa5Info.status)} size="small" sx={!isMqa3Saved() ? getDocumentStatusChipSx('waitingGrade') : getDocumentStatusChipSx(mqa5Info.status)} />
            </Box>

            <Typography className={styles.optionDescription}>
              {getOptionDescription('mqa5')}
            </Typography>

            <Button variant="outlined" fullWidth startIcon={<DescriptionRoundedIcon />} className={styles.secondaryButton} onClick={() => handleNavigate('/mqa5Insert-1', 'mqa5')} disabled={!canOpenMqa5}>
              {getButtonText('mqa5')}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default DocumentSelectDialog