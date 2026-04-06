import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import SubjectSelectorModal from '../../components/courseOpeningBachelor/subjectSelectorModal'
import styles from './courseOpeningDoctoralPage.module.css'

const campusOptions = [
  { value: 'chakrabongse', label: 'จักรพงษภูวนารถ' },
  { value: 'bangpra', label: 'บางพระ' },
]

const doctoralFormTypeOptions = [
  { value: '1.1', label: '1.1' },
  { value: '1.2', label: '1.2' },
]

const responsibleOptions = [
  'ผู้ช่วยศาสตราจารย์ อภิรัตน์ ใจผ่อง',
  'อาจารย์ ปวีณา เกิดทรัพย์',
  'อาจารย์ วรเมธ ศิริสุข',
]

const yearLevelOptions = ['1', '2', '3', '4', '5', '6']

const defaultGeneralForm = {
  submissionRound: '1',
  semester: '1',
  academicYear: '2568',
  curriculumName: '',
  majorName: 'วิทยาการคอมพิวเตอร์',
  doctoralFormType: '1.1',
  campus: 'chakrabongse',
}

function createDefaultResponsiblePeople() {
  return [
    { id: 1, name: '', signedDate: '' },
    { id: 2, name: '', signedDate: '' },
    { id: 3, name: '', signedDate: '' },
  ]
}

function createDefaultApprovalForm() {
  return {
    responsiblePeople: createDefaultResponsiblePeople(),
    headName: 'อาจารย์ ปวีรา เครือโสม',
    headDate: '',
    deputyDeanName: 'ผู้ช่วยศาสตราจารย์ อภิรัตน์ ใจผ่อง',
    deputyDeanDate: '',
    deanName: 'นาย สมเกตุ วรัทพัฒน์ชัย',
    deanDate: '',
    isConfirmed: false,
  }
}

function createEmptySubjectRow() {
  return {
    id: Date.now() + Math.random(),
    courseCode: '',
    courseName: '',
    credits: '',
    groupCount: '1',
    studentCount: '0',
    isFreeElective: false,
    scienceTrack: false,
    humanitiesTrack: false,
    note: '',
  }
}

function createYearBlock(order = 1) {
  return {
    id: Date.now() + Math.random(),
    yearLevel: String(order),
    entryTerm: '',
    academicYear: '',
    subjectRows: [createEmptySubjectRow()],
  }
}

function normalizeSubjectRow(row = {}) {
  return {
    ...createEmptySubjectRow(),
    ...row,
    id: row.id ?? Date.now() + Math.random(),
  }
}

function normalizeYearBlock(block = {}, order = 1) {
  return {
    ...createYearBlock(order),
    ...block,
    id: block.id ?? Date.now() + Math.random(),
    yearLevel: String(block.yearLevel ?? order),
    subjectRows:
      Array.isArray(block.subjectRows) && block.subjectRows.length
        ? block.subjectRows.map((row) => normalizeSubjectRow(row))
        : [createEmptySubjectRow()],
  }
}

function normalizeResponsiblePeople(responsiblePeople) {
  if (!Array.isArray(responsiblePeople) || !responsiblePeople.length) {
    return createDefaultResponsiblePeople()
  }

  return responsiblePeople.map((person, index) => ({
    id: person.id ?? Date.now() + Math.random() + index,
    name: person.name ?? '',
    signedDate: person.signedDate ?? '',
  }))
}

function buildInitialPageData(requestData) {
  const documentData = requestData?.documentData || {}
  const defaultApprovalForm = createDefaultApprovalForm()
  const nextGeneralForm = {
    ...defaultGeneralForm,
    ...(documentData.generalForm || {}),
  }

  nextGeneralForm.doctoralFormType =
    documentData.generalForm?.doctoralFormType ||
    documentData.generalForm?.formType ||
    nextGeneralForm.doctoralFormType

  return {
    generalForm: nextGeneralForm,
    yearBlocks:
      Array.isArray(documentData.yearBlocks) && documentData.yearBlocks.length
        ? documentData.yearBlocks.map((block, index) =>
            normalizeYearBlock(block, index + 1)
          )
        : [createYearBlock(1)],
    approvalForm: {
      ...defaultApprovalForm,
      ...(documentData.approvalForm || {}),
      responsiblePeople: normalizeResponsiblePeople(
        documentData.approvalForm?.responsiblePeople
      ),
    },
  }
}

function getStatusConfig(status) {
  if (status === 'draft') {
    return {
      label: 'บันทึกแล้ว ยังไม่ส่ง',
      className: styles.statusChipDraft,
    }
  }

  if (status === 'pendingApproval') {
    return {
      label: 'ส่งเอกสารแล้วกำลังรออนุมัติ',
      className: styles.statusChipPendingApproval,
    }
  }

  if (status === 'rejected') {
    return {
      label: 'ไม่อนุมัติ',
      className: styles.statusChipRejected,
    }
  }

  return {
    label: '-',
    className: '',
  }
}

function CourseOpeningDoctoralPage() {
  const location = useLocation()
  const requestData = location.state?.requestData || null
  const initialPageData = useMemo(
    () => buildInitialPageData(requestData),
    [requestData]
  )

  const [pageMode, setPageMode] = useState(requestData ? 'view' : 'create')
  const [generalForm, setGeneralForm] = useState(initialPageData.generalForm)
  const [yearBlocks, setYearBlocks] = useState(initialPageData.yearBlocks)
  const [approvalForm, setApprovalForm] = useState(initialPageData.approvalForm)
  const [subjectSelectorState, setSubjectSelectorState] = useState({
    isOpen: false,
    blockId: null,
    rowId: null,
  })

  const isViewMode = pageMode === 'view'
  const isEditMode = pageMode === 'edit'
  const isCreateMode = pageMode === 'create'
  const isFormDisabled = isViewMode

  const currentRequestStatus = requestData?.status || 'draft'
  const statusConfig = getStatusConfig(currentRequestStatus)
  const canEditCurrentDocument =
    !requestData ||
    currentRequestStatus === 'draft' ||
    currentRequestStatus === 'rejected'

  const resetFormStatesFromRequest = () => {
    const nextPageData = buildInitialPageData(requestData)
    setGeneralForm(nextPageData.generalForm)
    setYearBlocks(nextPageData.yearBlocks)
    setApprovalForm(nextPageData.approvalForm)
    setSubjectSelectorState({
      isOpen: false,
      blockId: null,
      rowId: null,
    })
  }

  const handleChangeGeneralForm = (event) => {
    const { name, value } = event.target
    setGeneralForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }))
  }

  const handleChangeYearBlockField = (blockId, fieldName, value) => {
    setYearBlocks((previousBlocks) =>
      previousBlocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              [fieldName]: value,
            }
          : block
      )
    )
  }

  const handleChangeSubjectRowField = (blockId, rowId, fieldName, value) => {
    setYearBlocks((previousBlocks) =>
      previousBlocks.map((block) => {
        if (block.id !== blockId) {
          return block
        }

        return {
          ...block,
          subjectRows: block.subjectRows.map((row) =>
            row.id === rowId
              ? {
                  ...row,
                  [fieldName]: value,
                }
              : row
          ),
        }
      })
    )
  }

  const handleToggleSubjectRowCheckbox = (blockId, rowId, fieldName) => {
    setYearBlocks((previousBlocks) =>
      previousBlocks.map((block) => {
        if (block.id !== blockId) {
          return block
        }

        return {
          ...block,
          subjectRows: block.subjectRows.map((row) =>
            row.id === rowId
              ? {
                  ...row,
                  [fieldName]: !row[fieldName],
                }
              : row
          ),
        }
      })
    )
  }

  const handleAddSubjectRow = (blockId) => {
    setYearBlocks((previousBlocks) =>
      previousBlocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              subjectRows: [...block.subjectRows, createEmptySubjectRow()],
            }
          : block
      )
    )
  }

  const handleDeleteSubjectRow = (blockId, rowId) => {
    setYearBlocks((previousBlocks) =>
      previousBlocks.map((block) => {
        if (block.id !== blockId) {
          return block
        }

        if (block.subjectRows.length === 1) {
          window.alert('อย่างน้อย 1 ตารางชั้นปี ต้องมีรายวิชาอย่างน้อย 1 แถว')
          return block
        }

        return {
          ...block,
          subjectRows: block.subjectRows.filter((row) => row.id !== rowId),
        }
      })
    )
  }

  const handleAddYearBlock = () => {
    if (yearBlocks.length >= 6) {
      window.alert('เพิ่มตารางชั้นปีได้สูงสุด 6 ตาราง')
      return
    }

    const usedYearLevels = yearBlocks.map((block) => block.yearLevel)
    const nextAvailableYearLevel =
      yearLevelOptions.find((yearLevel) => !usedYearLevels.includes(yearLevel)) ||
      String(Math.min(yearBlocks.length + 1, 6))

    setYearBlocks((previousBlocks) => [
      ...previousBlocks,
      createYearBlock(nextAvailableYearLevel),
    ])
  }

  const handleDeleteYearBlock = (blockId) => {
    if (yearBlocks.length === 1) {
      window.alert('ต้องมีตารางชั้นปีอย่างน้อย 1 ตาราง')
      return
    }

    setYearBlocks((previousBlocks) =>
      previousBlocks.filter((block) => block.id !== blockId)
    )
  }

  const openSubjectSelector = (blockId, rowId) => {
    if (isFormDisabled) {
      return
    }

    setSubjectSelectorState({
      isOpen: true,
      blockId,
      rowId,
    })
  }

  const closeSubjectSelector = () => {
    setSubjectSelectorState({
      isOpen: false,
      blockId: null,
      rowId: null,
    })
  }

  const handleSelectSubject = (selectedSubject) => {
    setYearBlocks((previousBlocks) =>
      previousBlocks.map((block) => {
        if (block.id !== subjectSelectorState.blockId) {
          return block
        }

        return {
          ...block,
          subjectRows: block.subjectRows.map((row) =>
            row.id === subjectSelectorState.rowId
              ? {
                  ...row,
                  courseCode: selectedSubject.courseCode,
                  courseName: selectedSubject.courseName,
                  credits: selectedSubject.credits,
                }
              : row
          ),
        }
      })
    )

    closeSubjectSelector()
  }

  const handleAddResponsiblePerson = () => {
    setApprovalForm((previousForm) => ({
      ...previousForm,
      responsiblePeople: [
        ...previousForm.responsiblePeople,
        {
          id: Date.now() + Math.random(),
          name: '',
          signedDate: '',
        },
      ],
    }))
  }

  const handleRemoveResponsiblePerson = (personId) => {
    if (approvalForm.responsiblePeople.length <= 3) {
      window.alert('ผู้รับผิดชอบหลักสูตรต้องมีอย่างน้อย 3 คน')
      return
    }

    setApprovalForm((previousForm) => ({
      ...previousForm,
      responsiblePeople: previousForm.responsiblePeople.filter(
        (person) => person.id !== personId
      ),
    }))
  }

  const handleChangeResponsiblePerson = (personId, fieldName, value) => {
    setApprovalForm((previousForm) => ({
      ...previousForm,
      responsiblePeople: previousForm.responsiblePeople.map((person) =>
        person.id === personId
          ? {
              ...person,
              [fieldName]: value,
            }
          : person
      ),
    }))
  }

  const handleChangeApprovalField = (event) => {
    const { name, value, checked, type } = event.target
    setApprovalForm((previousForm) => ({
      ...previousForm,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmitRequest = () => {
    if (!approvalForm.isConfirmed) {
      window.alert('กรุณาติ๊กรับรองข้อมูลก่อนส่งคำร้อง')
      return
    }

    window.alert('ตอนนี้เป็น mock page ระดับปริญญาเอก ยังไม่ได้เชื่อม API')
  }

  const handleStartEdit = () => {
    if (!canEditCurrentDocument) {
      return
    }

    setPageMode('edit')
  }

  const handleCancelEdit = () => {
    resetFormStatesFromRequest()
    setPageMode('view')
  }

  const handleSaveEditedDocument = () => {
    closeSubjectSelector()
    setPageMode('view')
    window.alert('บันทึกการแก้ไขเรียบร้อย (mock page ยังไม่ได้เชื่อม API)')
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Typography className={styles.pageTitle}>
            {requestData
              ? 'ดูรายละเอียดการเปิดรายวิชา (ระดับปริญญาเอก)'
              : 'แบบเปิดรายวิชาประจำภาคการศึกษา (ระดับปริญญาเอก)'}
          </Typography>

          <Typography className={styles.pageDescription}>
            {requestData
              ? 'หน้านี้ใช้สำหรับตรวจสอบรายละเอียดเอกสารที่บันทึกไว้ก่อนส่งจริง โดยระบบจะเปิดแบบฟอร์มเดิมทั้งหน้าขึ้นมาในโหมดดูอย่างเดียว และสามารถกดแก้ไขเพื่อปลดล็อกฟอร์มได้'
              : 'หน้าสำหรับบันทึกคำขอเปิดรายวิชาในสาขา ระดับปริญญาเอก โดยใช้ดีไซน์เดียวกับหน้าปริญญาตรีและปริญญาโท แล้วปรับเฉพาะข้อมูลที่แตกต่าง'}
          </Typography>
        </Box>

        {requestData && (
          <Box className={styles.modeCard}>
            <Box className={styles.modeCardTop}>
              <Box className={styles.modeTextBlock}>
                <Typography className={styles.modeEyebrow}>
                  {isViewMode ? 'โหมดดูรายละเอียดเอกสาร' : 'โหมดแก้ไขเอกสาร'}
                </Typography>

                <Typography className={styles.modeTitle}>
                  {generalForm.curriculumName || 'ยังไม่ได้ระบุชื่อหลักสูตร'} • สาขา{' '}
                  {generalForm.majorName}
                </Typography>

                <Typography className={styles.modeDescription}>
                  {isViewMode
                    ? 'ในโหมดนี้ข้อมูลทั้งหมดจะถูกล็อกไว้เพื่อให้ตรวจสอบเอกสารได้อย่างเดียว หากต้องการแก้ไขให้กดปุ่มแก้ไขที่ด้านล่างของหน้า'
                    : 'กำลังแก้ไขเอกสารฉบับร่างในหน้าเดิม ข้อมูลทุกส่วนจะถูกปลดล็อกชั่วคราวเพื่อให้แก้ไขและบันทึกได้'}
                </Typography>
              </Box>

              <Box className={styles.modeChipRow}>
                <Chip
                  label={`รหัสคำขอ ${requestData.id}`}
                  className={styles.requestIdChip}
                />
                <Chip
                  label={statusConfig.label}
                  className={statusConfig.className}
                />
              </Box>
            </Box>

            {!canEditCurrentDocument && (
              <Typography className={styles.lockedHint}>
                เอกสารนี้ถูกส่งแล้วและกำลังรออนุมัติ จึงยังไม่สามารถแก้ไขได้จนกว่าจะมีผลไม่อนุมัติ
              </Typography>
            )}
          </Box>
        )}

        <Box className={styles.viewModeHintBox}>
          <VisibilityRoundedIcon className={styles.viewModeHintIcon} />
          <Box>
            <Typography className={styles.viewModeHintTitle}>
              {isViewMode
                ? 'กำลังแสดงเอกสารในโหมดดูอย่างเดียว'
                : isEditMode
                ? 'กำลังแสดงเอกสารในโหมดแก้ไข'
                : 'กำลังแสดงเอกสารในโหมดสร้างรายการใหม่'}
            </Typography>

            <Typography className={styles.viewModeHintDescription}>
              {isViewMode
                ? 'ทุก field และปุ่มภายในเอกสารถูก disabled ไว้ทั้งหมด เพื่อให้ตรวจสอบข้อมูลได้ก่อนตัดสินใจแก้ไข'
                : isEditMode
                ? 'สามารถปรับข้อมูลในแบบฟอร์มได้ทั้งหมด เมื่อแก้ไขเสร็จแล้วให้กดบันทึกการแก้ไขที่ด้านล่างของหน้า'
                : 'โหมดนี้ใช้สำหรับกรอกแบบฟอร์มใหม่ตาม flow เดิมของหน้าเปิดรายวิชา'}
            </Typography>
          </Box>
        </Box>

        <Box className={styles.sectionCard}>
          <Typography className={styles.sectionTitle}>ข้อมูลทั่วไป</Typography>

          <Box className={styles.formGridThree}>
            <TextField
              label="ส่งแบบเปิดรายวิชา ครั้งที่"
              name="submissionRound"
              value={generalForm.submissionRound}
              onChange={handleChangeGeneralForm}
              fullWidth
              disabled={isFormDisabled}
            />

            <TextField
              select
              label="ภาคการศึกษา"
              name="semester"
              value={generalForm.semester}
              onChange={handleChangeGeneralForm}
              fullWidth
              disabled={isFormDisabled}
            >
              <MenuItem value="1">ภาค 1</MenuItem>
              <MenuItem value="2">ภาค 2</MenuItem>
              <MenuItem value="summer">ภาคฤดูร้อน</MenuItem>
            </TextField>

            <TextField
              label="ปีการศึกษา"
              name="academicYear"
              value={generalForm.academicYear}
              onChange={handleChangeGeneralForm}
              fullWidth
              disabled={isFormDisabled}
            />
          </Box>

          <Box className={styles.formGridTwo}>
            <TextField
              label="หลักสูตร (พิมพ์ชื่อหลักสูตร/ปีที่ปรับปรุง)"
              name="curriculumName"
              value={generalForm.curriculumName}
              onChange={handleChangeGeneralForm}
              placeholder="เช่น วิทยาศาสตรดุษฎีบัณฑิต"
              fullWidth
              disabled={isFormDisabled}
            />

            <Box className={styles.majorFieldWrapper}>
              <TextField
                label="สาขาวิชา/กลุ่มวิชา"
                name="majorName"
                value={generalForm.majorName}
                onChange={handleChangeGeneralForm}
                fullWidth
                disabled={isFormDisabled}
              />

              <Button
                variant="text"
                className={styles.inlineEditButton}
                disabled
              >
                แก้ไข
              </Button>
            </Box>
          </Box>

          <Box className={styles.formOptionGrid}>
            <Box className={styles.optionGroup}>
              <Typography className={styles.optionGroupTitle}>
                ประเภทแบบฟอร์ม (ป.เอก)
              </Typography>

              <RadioGroup
                row
                name="doctoralFormType"
                value={generalForm.doctoralFormType}
                onChange={handleChangeGeneralForm}
                className={styles.optionRadioRow}
              >
                {doctoralFormTypeOptions.map((item) => (
                  <FormControlLabel
                    key={item.value}
                    value={item.value}
                    control={<Radio />}
                    label={item.label}
                    disabled={isFormDisabled}
                  />
                ))}
              </RadioGroup>
            </Box>

            <Box className={styles.optionGroup}>
              <Typography className={styles.optionGroupTitle}>
                ศึกษาที่เขตพื้นที่
              </Typography>

              <RadioGroup
                row
                name="campus"
                value={generalForm.campus}
                onChange={handleChangeGeneralForm}
                className={styles.optionRadioRow}
              >
                {campusOptions.map((item) => (
                  <FormControlLabel
                    key={item.value}
                    value={item.value}
                    control={<Radio />}
                    label={item.label}
                    disabled={isFormDisabled}
                  />
                ))}
              </RadioGroup>
            </Box>
          </Box>
        </Box>

        <Box className={styles.sectionCard}>
          <Box className={styles.sectionHeaderRow}>
            <Typography className={styles.sectionTitle}>
              ตารางรายวิชาที่ขอเปิดสอน
            </Typography>

            <Button
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              className={styles.secondaryButton}
              onClick={handleAddYearBlock}
              disabled={isFormDisabled}
            >
              เพิ่มตาราง (ชั้นปี)
            </Button>
          </Box>

          <Box className={styles.yearBlockList}>
            {yearBlocks.map((block) => (
              <Box key={block.id} className={styles.yearBlock}>
                <Box className={styles.yearBlockHeader}>
                  <Box className={styles.yearBlockHeaderLeft}>
                    <Box className={styles.yearBadge}>ชั้นปีที่ {block.yearLevel}</Box>
                    <Typography className={styles.yearBlockTitle}>
                      ตารางรายวิชาที่ขอเปิดสอน
                    </Typography>
                    <Typography className={styles.yearBlockSubtitle}>
                      กำหนดรายวิชาที่ต้องการเปิดสอนในชั้นปีนี้
                    </Typography>
                  </Box>

                  <Box className={styles.yearBlockHeaderRight}>
                    <TextField
                      select
                      label="ชั้นปี"
                      value={block.yearLevel}
                      onChange={(event) =>
                        handleChangeYearBlockField(
                          block.id,
                          'yearLevel',
                          event.target.value
                        )
                      }
                      size="small"
                      className={styles.yearLevelSelect}
                      disabled={isFormDisabled}
                    >
                      {yearLevelOptions.map((yearLevel) => (
                        <MenuItem key={yearLevel} value={yearLevel}>
                          ปีที่ {yearLevel}
                        </MenuItem>
                      ))}
                    </TextField>

                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutlineRoundedIcon />}
                      className={styles.deleteYearBlockButton}
                      onClick={() => handleDeleteYearBlock(block.id)}
                      disabled={isFormDisabled}
                    >
                      ลบตารางนี้
                    </Button>
                  </Box>
                </Box>

                <Box className={styles.yearBlockForm}>
                  <TextField
                    select
                    label="เข้าเรียน"
                    value={block.entryTerm}
                    onChange={(event) =>
                      handleChangeYearBlockField(
                        block.id,
                        'entryTerm',
                        event.target.value
                      )
                    }
                    fullWidth
                    disabled={isFormDisabled}
                  >
                    <MenuItem value="1">ภาค 1</MenuItem>
                    <MenuItem value="2">ภาค 2</MenuItem>
                    <MenuItem value="summer">ภาคฤดูร้อน</MenuItem>
                  </TextField>

                  <TextField
                    label="ปีการศึกษา"
                    value={block.academicYear}
                    onChange={(event) =>
                      handleChangeYearBlockField(
                        block.id,
                        'academicYear',
                        event.target.value
                      )
                    }
                    fullWidth
                    disabled={isFormDisabled}
                  />
                </Box>

                <Box className={styles.tableSection}>
                  <Box className={styles.tableHeaderRow}>
                    <Box className={`${styles.tableHeaderCell} ${styles.colIndex}`}>#</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colCode}`}>รหัสวิชา</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colName}`}>ชื่อรายวิชา</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colCredits}`}>จำนวนหน่วยกิต</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colGroup}`}>กลุ่ม</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colStudents}`}>จำนวนนักศึกษา(จริง)</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colTrack}`}>รายวิชา (สายวิทยาศาสตร์)</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colTrack}`}>รายวิชา (มนุษยศาสตร์และสังคมศาสตร์)</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colNote}`}>หมายเหตุ</Box>
                    <Box className={`${styles.tableHeaderCell} ${styles.colAction}`}>จัดการ</Box>
                  </Box>

                  <Box className={styles.tableBody}>
                    {block.subjectRows.map((row, rowIndex) => (
                      <Box
                        key={row.id}
                        className={`${styles.tableRow} ${
                          rowIndex % 2 === 1 ? styles.tableRowAlt : ''
                        }`}
                      >
                        <Box
                          className={`${styles.tableCell} ${styles.colIndex} ${styles.indexCell}`}
                        >
                          {rowIndex + 1}
                        </Box>

                        <Box className={`${styles.tableCell} ${styles.colCode}`}>
                          <TextField
                            value={row.courseCode}
                            onChange={(event) =>
                              handleChangeSubjectRowField(
                                block.id,
                                row.id,
                                'courseCode',
                                event.target.value
                              )
                            }
                            placeholder="รหัสวิชา"
                            size="small"
                            fullWidth
                            className={styles.compactField}
                            disabled={isFormDisabled}
                          />
                        </Box>

                        <Box className={`${styles.tableCell} ${styles.colName}`}>
                          <Box className={styles.courseNameCell}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<SearchRoundedIcon fontSize="small" />}
                              className={styles.subjectPickerButton}
                              onClick={() => openSubjectSelector(block.id, row.id)}
                              fullWidth
                              disabled={isFormDisabled}
                            >
                              {row.courseName ? (
                                <span className={styles.subjectPickerText}>
                                  {row.courseName}
                                </span>
                              ) : (
                                <span className={styles.subjectPickerPlaceholder}>
                                  เลือกรายวิชา
                                </span>
                              )}
                            </Button>

                            <FormControlLabel
                              className={styles.freeElectiveToggle}
                              control={
                                <Checkbox
                                  checked={row.isFreeElective}
                                  onChange={() =>
                                    handleToggleSubjectRowCheckbox(
                                      block.id,
                                      row.id,
                                      'isFreeElective'
                                    )
                                  }
                                  size="small"
                                  disabled={isFormDisabled}
                                />
                              }
                              label={
                                <span className={styles.freeElectiveLabel}>
                                  เลือกเสรี
                                </span>
                              }
                            />
                          </Box>
                        </Box>

                        <Box className={`${styles.tableCell} ${styles.colCredits}`}>
                          <TextField
                            value={row.credits}
                            onChange={(event) =>
                              handleChangeSubjectRowField(
                                block.id,
                                row.id,
                                'credits',
                                event.target.value
                              )
                            }
                            placeholder="0"
                            size="small"
                            fullWidth
                            className={styles.compactField}
                            disabled={isFormDisabled}
                            inputProps={{ style: { textAlign: 'center' } }}
                          />
                        </Box>

                        <Box className={`${styles.tableCell} ${styles.colGroup}`}>
                          <TextField
                            value={row.groupCount}
                            onChange={(event) =>
                              handleChangeSubjectRowField(
                                block.id,
                                row.id,
                                'groupCount',
                                event.target.value
                              )
                            }
                            placeholder="1"
                            size="small"
                            fullWidth
                            className={styles.compactField}
                            disabled={isFormDisabled}
                            inputProps={{ style: { textAlign: 'center' } }}
                          />
                        </Box>

                        <Box className={`${styles.tableCell} ${styles.colStudents}`}>
                          <TextField
                            value={row.studentCount}
                            onChange={(event) =>
                              handleChangeSubjectRowField(
                                block.id,
                                row.id,
                                'studentCount',
                                event.target.value
                              )
                            }
                            placeholder="0"
                            size="small"
                            fullWidth
                            className={styles.compactField}
                            disabled={isFormDisabled}
                            inputProps={{ style: { textAlign: 'center' } }}
                          />
                        </Box>

                        <Box
                          className={`${styles.tableCell} ${styles.colTrack} ${styles.centerCell}`}
                        >
                          <Checkbox
                            checked={row.scienceTrack}
                            onChange={() =>
                              handleToggleSubjectRowCheckbox(
                                block.id,
                                row.id,
                                'scienceTrack'
                              )
                            }
                            size="small"
                            className={styles.trackCheckbox}
                            disabled={isFormDisabled}
                          />
                        </Box>

                        <Box
                          className={`${styles.tableCell} ${styles.colTrack} ${styles.centerCell}`}
                        >
                          <Checkbox
                            checked={row.humanitiesTrack}
                            onChange={() =>
                              handleToggleSubjectRowCheckbox(
                                block.id,
                                row.id,
                                'humanitiesTrack'
                              )
                            }
                            size="small"
                            className={styles.trackCheckbox}
                            disabled={isFormDisabled}
                          />
                        </Box>

                        <Box className={`${styles.tableCell} ${styles.colNote}`}>
                          <TextField
                            value={row.note}
                            onChange={(event) =>
                              handleChangeSubjectRowField(
                                block.id,
                                row.id,
                                'note',
                                event.target.value
                              )
                            }
                            placeholder="หมายเหตุ"
                            size="small"
                            fullWidth
                            className={styles.compactField}
                            disabled={isFormDisabled}
                          />
                        </Box>

                        <Box
                          className={`${styles.tableCell} ${styles.colAction} ${styles.centerCell}`}
                        >
                          <Button
                            variant="text"
                            color="error"
                            size="small"
                            className={styles.deleteRowButton}
                            onClick={() => handleDeleteSubjectRow(block.id, row.id)}
                            disabled={isFormDisabled}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </Button>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box className={styles.subjectActionRow}>
                  <Button
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    className={styles.primaryButton}
                    onClick={() => handleAddSubjectRow(block.id)}
                    disabled={isFormDisabled}
                  >
                    เพิ่มรายวิชา
                  </Button>

                  <Typography className={styles.rowCount}>
                    แถวทั้งหมด {block.subjectRows.length} รายการ
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box className={styles.sectionCard}>
          <Typography className={styles.sectionTitle}>
            ข้อมูลผู้รับผิดชอบและการลงนาม
          </Typography>

          <Typography className={styles.subSectionTitle}>
            ผู้รับผิดชอบหลักสูตร (อย่างน้อย 3 คน และเพิ่ม/ลบได้)
          </Typography>

          <Box className={styles.responsibleList}>
            {approvalForm.responsiblePeople.map((person, index) => (
              <Box key={person.id} className={styles.responsibleItem}>
                <TextField
                  select
                  label={`ผู้รับผิดชอบหลักสูตร คนที่ ${index + 1}`}
                  value={person.name}
                  onChange={(event) =>
                    handleChangeResponsiblePerson(
                      person.id,
                      'name',
                      event.target.value
                    )
                  }
                  fullWidth
                  disabled={isFormDisabled}
                >
                  {responsibleOptions.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  type="date"
                  value={person.signedDate}
                  onChange={(event) =>
                    handleChangeResponsiblePerson(
                      person.id,
                      'signedDate',
                      event.target.value
                    )
                  }
                  fullWidth
                  disabled={isFormDisabled}
                  InputLabelProps={{ shrink: true }}
                />

                <Box className={styles.responsibleItemActions}>
                  <Box className={styles.signaturePlaceholder}>ลายเซ็น</Box>

                  <Button
                    variant="outlined"
                    color="error"
                    className={styles.removeResponsibleButton}
                    onClick={() => handleRemoveResponsiblePerson(person.id)}
                    disabled={
                      isFormDisabled ||
                      approvalForm.responsiblePeople.length <= 3
                    }
                  >
                    ลบ
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>

          <Box className={styles.addResponsibleRow}>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              className={styles.primaryButton}
              onClick={handleAddResponsiblePerson}
              disabled={isFormDisabled}
            >
              เพิ่มผู้รับผิดชอบ
            </Button>
          </Box>

          <Box className={styles.signerGrid}>
            {[
              {
                title: 'หัวหน้าสาขาวิชา',
                nameKey: 'headName',
                dateKey: 'headDate',
              },
              {
                title: 'รองคณบดี',
                nameKey: 'deputyDeanName',
                dateKey: 'deputyDeanDate',
              },
              {
                title: 'คณบดี',
                nameKey: 'deanName',
                dateKey: 'deanDate',
              },
            ].map(({ title, nameKey, dateKey }) => (
              <Box key={nameKey} className={styles.signerCard}>
                <Typography className={styles.signerTitle}>{title}</Typography>

                <TextField
                  name={nameKey}
                  value={approvalForm[nameKey]}
                  onChange={handleChangeApprovalField}
                  fullWidth
                  disabled={isFormDisabled}
                />

                <TextField
                  type="date"
                  name={dateKey}
                  value={approvalForm[dateKey]}
                  onChange={handleChangeApprovalField}
                  fullWidth
                  disabled={isFormDisabled}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            ))}
          </Box>

          {isCreateMode && (
            <>
              <Box className={styles.confirmBox}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isConfirmed"
                      checked={approvalForm.isConfirmed}
                      onChange={handleChangeApprovalField}
                    />
                  }
                  label="ข้าพเจ้าขอรับรองว่าได้ตรวจสอบข้อมูลทั้งหมดแล้ว และข้อมูลหรือเอกสารมีความถูกต้องครบถ้วน"
                />
              </Box>

              <Box className={styles.submitRow}>
                <Button
                  variant="contained"
                  className={styles.submitButton}
                  disabled={!approvalForm.isConfirmed}
                  onClick={handleSubmitRequest}
                >
                  ส่งคำร้องขอเปิดรายวิชา (ปริญญาเอก)
                </Button>
              </Box>
            </>
          )}
        </Box>

        {requestData && (
          <Box className={styles.requestActionCard}>
            <Box className={styles.requestActionInfo}>
              <Typography className={styles.requestActionTitle}>
                {isViewMode
                  ? 'ตรวจสอบเอกสารเรียบร้อยแล้วหรือยัง'
                  : 'แก้ไขข้อมูลเรียบร้อยแล้วหรือยัง'}
              </Typography>

              <Typography className={styles.requestActionDescription}>
                {isViewMode
                  ? 'หากต้องการแก้ไขข้อมูล ให้กดปุ่มแก้ไขเอกสาร ระบบจะปลดล็อก field ทั้งหมดของเอกสารฉบับนี้ในหน้าเดิม'
                  : 'เมื่อบันทึกการแก้ไขแล้ว เอกสารจะกลับไปอยู่ในโหมดดูอย่างเดียวอีกครั้ง เพื่อใช้ตรวจสอบก่อนย้อนกลับไปหน้ารายการ'}
              </Typography>
            </Box>

            <Box className={styles.requestActionButtons}>
              {isViewMode && canEditCurrentDocument && (
                <Button
                  variant="contained"
                  startIcon={<EditRoundedIcon />}
                  className={styles.editButton}
                  onClick={handleStartEdit}
                >
                  แก้ไขเอกสาร
                </Button>
              )}

              {isEditMode && (
                <>
                  <Button
                    variant="outlined"
                    className={styles.cancelEditButton}
                    onClick={handleCancelEdit}
                  >
                    ยกเลิก
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={<SaveRoundedIcon />}
                    className={styles.saveButton}
                    onClick={handleSaveEditedDocument}
                  >
                    บันทึกการแก้ไข
                  </Button>
                </>
              )}
            </Box>
          </Box>
        )}
      </Box>

      <SubjectSelectorModal
        open={subjectSelectorState.isOpen}
        onClose={closeSubjectSelector}
        onSelectSubject={handleSelectSubject}
        currentMajorName={generalForm.majorName}
      />
    </Box>
  )
}

export default CourseOpeningDoctoralPage