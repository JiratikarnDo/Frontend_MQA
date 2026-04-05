import { useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SubjectSelectorModal from '../../components/courseOpeningBachelor/subjectSelectorModal'
import styles from './courseOpeningMasterPage.module.css'

const studyPlanOptions = [
  { value: 'planA', label: 'แผน ก' },
  { value: 'planA2', label: 'แบบ ก2' },
  { value: 'planB', label: 'แผน ข' },
]

const learningPeriodOptions = [
  { value: 'regular', label: 'ภาคปกติ' },
  { value: 'afterHours', label: 'ภาคนอกเวลาราชการ' },
]

const campusOptions = [
  { value: 'chakrabongse', label: 'จักรพงษภูวนารถ' },
  { value: 'bangpra', label: 'บางพระ' },
]

const responsibleOptions = [
  'ผู้ช่วยศาสตราจารย์ อภิรัตน์ ใจผ่อง',
  'อาจารย์ ปวีณา เกิดทรัพย์',
  'อาจารย์ วรเมธ ศิริสุข',
]

const initialResponsiblePeople = [
  { id: 1, name: '', signedDate: '' },
  { id: 2, name: '', signedDate: '' },
  { id: 3, name: '', signedDate: '' },
]

const yearLevelOptions = ['1', '2', '3', '4', '5', '6']

function createEmptySubjectRow() {
  return {
    id: Date.now() + Math.random(),
    courseCode: '',
    courseName: '',
    credits: '',
    groupCount: '1',
    studentCount: '',
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

function CourseOpeningMasterPage() {
  const [generalForm, setGeneralForm] = useState({
    submissionRound: '1',
    semester: '1',
    academicYear: '2568',
    curriculumName: '',
    majorName: 'วิทยาการคอมพิวเตอร์',
  })

  const [studyForm, setStudyForm] = useState({
    studyPlan: 'planB',
    learningPeriod: 'afterHours',
    campus: 'chakrabongse',
  })

  const [yearBlocks, setYearBlocks] = useState([createYearBlock(1)])

  const [approvalForm, setApprovalForm] = useState({
    responsiblePeople: initialResponsiblePeople,
    headName: 'อาจารย์ ปวีรา เครือโสม',
    headDate: '',
    deputyDeanName: 'ผู้ช่วยศาสตราจารย์ อภิรัตน์ ใจผ่อง',
    deputyDeanDate: '',
    deanName: 'นาย สมเกตุ วรัทพัฒน์ชัย',
    deanDate: '',
    isConfirmed: false,
  })

  const [subjectSelectorState, setSubjectSelectorState] = useState({
    isOpen: false,
    blockId: null,
    rowId: null,
  })

  const handleChangeGeneralForm = (event) => {
    const { name, value } = event.target
    setGeneralForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }))
  }

  const handleChangeStudyForm = (event) => {
    const { name, value } = event.target
    setStudyForm((previousForm) => ({
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

    window.alert('ตอนนี้เป็น mock page ระดับปริญญาโท ยังไม่ได้เชื่อม API')
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Typography className={styles.pageTitle}>แบบเปิดรายวิชาประจำภาคการศึกษา (ระดับปริญญาโท)</Typography>
          <Typography className={styles.pageDescription}>
            หน้าสำหรับบันทึกคำขอเปิดรายวิชาในสาขา ระดับปริญญาโท
            โดยยึดโครงหน้าหลักจากปริญญาตรีและเปลี่ยนเฉพาะข้อมูลที่แตกต่าง
          </Typography>
        </Box>

        <Box className={styles.sectionCard}>
          <Typography className={styles.sectionTitle}>ส่วนหัวแบบฟอร์ม</Typography>

          <Box className={styles.formGridThree}>
            <TextField
              label="ส่งแบบเปิดรายวิชา ครั้งที่"
              name="submissionRound"
              value={generalForm.submissionRound}
              onChange={handleChangeGeneralForm}
              fullWidth
            />

            <TextField
              select
              label="ภาคการศึกษา"
              name="semester"
              value={generalForm.semester}
              onChange={handleChangeGeneralForm}
              fullWidth
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
            />
          </Box>

          <Box className={styles.formGridTwo}>
            <TextField
              label="หลักสูตร (พิมพ์ชื่อหลักสูตร/ปีที่ปรับปรุง)"
              name="curriculumName"
              value={generalForm.curriculumName}
              onChange={handleChangeGeneralForm}
              placeholder="เช่น เศรษฐศาสตรมหาบัณฑิต"
              fullWidth
            />

            <Box className={styles.majorFieldWrapper}>
              <TextField
                label="สาขาวิชา/กลุ่มวิชา"
                name="majorName"
                value={generalForm.majorName}
                onChange={handleChangeGeneralForm}
                fullWidth
              />

              <Button variant="text" className={styles.inlineEditButton}>
                แก้ไข
              </Button>
            </Box>
          </Box>
        </Box>

        <Box className={styles.sectionCard}>
          <Typography className={styles.sectionTitle}>
            ข้อมูลรูปแบบการเรียน
          </Typography>

          <Box className={styles.studySection}>
            <Box className={styles.optionGroup}>
              <Typography className={styles.optionGroupTitle}>
                แผน (เฉพาะ ป.โท)
              </Typography>

              <RadioGroup
                row
                name="studyPlan"
                value={studyForm.studyPlan}
                onChange={handleChangeStudyForm}
                className={styles.optionRadioRow}
              >
                {studyPlanOptions.map((item) => (
                  <FormControlLabel
                    key={item.value}
                    value={item.value}
                    control={<Radio />}
                    label={item.label}
                  />
                ))}
              </RadioGroup>
            </Box>

            <Box className={styles.optionGroup}>
              <Typography className={styles.optionGroupTitle}>
                ภาคการเรียน
              </Typography>

              <RadioGroup
                row
                name="learningPeriod"
                value={studyForm.learningPeriod}
                onChange={handleChangeStudyForm}
                className={styles.optionRadioRow}
              >
                {learningPeriodOptions.map((item) => (
                  <FormControlLabel
                    key={item.value}
                    value={item.value}
                    control={<Radio />}
                    label={item.label}
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
                value={studyForm.campus}
                onChange={handleChangeStudyForm}
                className={styles.optionRadioRow}
              >
                {campusOptions.map((item) => (
                  <FormControlLabel
                    key={item.value}
                    value={item.value}
                    control={<Radio />}
                    label={item.label}
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
                  InputLabelProps={{ shrink: true }}
                />

                <Box className={styles.responsibleItemActions}>
                  <Box className={styles.signaturePlaceholder}>ลายเซ็น</Box>

                  <Button
                    variant="outlined"
                    color="error"
                    className={styles.removeResponsibleButton}
                    onClick={() => handleRemoveResponsiblePerson(person.id)}
                    disabled={approvalForm.responsiblePeople.length <= 3}
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
            >
              เพิ่มผู้รับผิดชอบ
            </Button>
          </Box>

          <Box className={styles.signerGrid}>
            {[
              { title: 'หัวหน้าสาขาวิชา', nameKey: 'headName', dateKey: 'headDate' },
              {
                title: 'รองคณบดี',
                nameKey: 'deputyDeanName',
                dateKey: 'deputyDeanDate',
              },
              { title: 'คณบดี', nameKey: 'deanName', dateKey: 'deanDate' },
            ].map(({ title, nameKey, dateKey }) => (
              <Box key={nameKey} className={styles.signerCard}>
                <Typography className={styles.signerTitle}>{title}</Typography>

                <TextField
                  name={nameKey}
                  value={approvalForm[nameKey]}
                  onChange={handleChangeApprovalField}
                  fullWidth
                />

                <TextField
                  type="date"
                  name={dateKey}
                  value={approvalForm[dateKey]}
                  onChange={handleChangeApprovalField}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            ))}
          </Box>

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
              ส่งคำร้องขอเปิดรายวิชา (ปริญญาโท)
            </Button>
          </Box>
        </Box>
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

export default CourseOpeningMasterPage