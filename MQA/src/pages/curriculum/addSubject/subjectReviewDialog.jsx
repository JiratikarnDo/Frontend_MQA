import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import styles from './subjectReviewDialog.module.css'

const generalEducationRows = [
  {
    label: 'กลุ่มสาระวิชาอัตลักษณ์',
    bucket: 'ge:กลุ่มสาระวิชาอัตลักษณ์',
    minimum: 3,
  },
  {
    label: 'กลุ่มสาระวิชาคุณภาพชีวิต',
    bucket: 'ge:กลุ่มสาระวิชาคุณภาพชีวิต',
    minimum: 3,
  },
  {
    label: 'กลุ่มสาระวิชาคุณภาพการทำงาน',
    bucket: 'ge:กลุ่มสาระวิชาคุณภาพการทำงาน',
    minimum: 6,
  },
  {
    label: 'กลุ่มสาระวิชาภาษาและการสื่อสาร',
    bucket: 'ge:กลุ่มสาระวิชาภาษาและการสื่อสาร',
    minimum: 6,
  },
  {
    label: 'กลุ่มสาระวิชาการปรับตัวและการใช้ชีวิต',
    bucket: 'ge:กลุ่มสาระวิชาการปรับตัวและการใช้ชีวิต',
    minimum: 3,
  },
  {
    label: 'กลุ่มสาระวิชาความเป็นพลเมืองไทยและพลเมืองโลก',
    bucket: 'ge:กลุ่มสาระวิชาความเป็นพลเมืองไทยและพลเมืองโลก',
    minimum: 3,
  },
]

const specificRows = [
  {
    label: 'กลุ่มวิชาแกน',
    bucket: 'specific:กลุ่มวิชาแกน',
    minimum: 24,
  },
  {
    label: 'กลุ่มวิชาบังคับ',
    bucket: 'specific:กลุ่มวิชาบังคับ',
    minimum: 38,
  },
  {
    label: 'กลุ่มวิชาเลือก',
    bucket: 'specific:กลุ่มวิชาเลือก',
    minimum: 21,
  },
  {
    label: 'กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ',
    bucket: 'specific:กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ',
    minimum: 7,
  },
]

const freeElectiveRows = [
  {
    label: 'วิชาเลือกเสรี',
    bucket: 'freeElective:วิชาเลือกเสรี',
    minimum: 6,
  },
]

const overviewConfigByLevel = {
  bachelor: [
    {
      title: '1) หมวดวิชาศึกษาทั่วไป',
      firstColumnLabel: 'กลุ่ม',
      totalLabel: 'รวมหมวดศึกษาทั่วไป',
      rows: generalEducationRows,
    },
    {
      title: '2) หมวดวิชาเฉพาะ',
      firstColumnLabel: 'กลุ่ม',
      totalLabel: 'รวมหมวดวิชาเฉพาะ',
      rows: specificRows,
    },
    {
      title: '3) หมวดวิชาเลือกเสรี',
      firstColumnLabel: 'หมวด',
      totalLabel: 'รวมหมวดวิชาเลือกเสรี',
      rows: freeElectiveRows,
    },
  ],
  master: [
    {
      title: '1) หมวดวิชาศึกษาทั่วไป',
      firstColumnLabel: 'กลุ่ม',
      totalLabel: 'รวมหมวดศึกษาทั่วไป',
      rows: generalEducationRows,
    },
    {
      title: '2) หมวดวิชาเฉพาะ',
      firstColumnLabel: 'กลุ่ม',
      totalLabel: 'รวมหมวดวิชาเฉพาะ',
      rows: specificRows,
    },
    {
      title: '3) หมวดวิชาเลือกเสรี',
      firstColumnLabel: 'หมวด',
      totalLabel: 'รวมหมวดวิชาเลือกเสรี',
      rows: freeElectiveRows,
    },
  ],
  doctorate: [
    {
      title: '1) หมวดวิชาศึกษาทั่วไป',
      firstColumnLabel: 'กลุ่ม',
      totalLabel: 'รวมหมวดศึกษาทั่วไป',
      rows: generalEducationRows,
    },
    {
      title: '2) หมวดวิชาเฉพาะ',
      firstColumnLabel: 'กลุ่ม',
      totalLabel: 'รวมหมวดวิชาเฉพาะ',
      rows: specificRows,
    },
    {
      title: '3) หมวดวิชาเลือกเสรี',
      firstColumnLabel: 'หมวด',
      totalLabel: 'รวมหมวดวิชาเลือกเสรี',
      rows: freeElectiveRows,
    },
  ],
}

const categoryAliasMap = {
  general: 'generalEducation',
  generaleducation: 'generalEducation',
  general_education: 'generalEducation',
  ge: 'generalEducation',
  วิชาศึกษาทั่วไป: 'generalEducation',
  หมวดวิชาศึกษาทั่วไป: 'generalEducation',
  หมวดรายวิชาศึกษาทั่วไป: 'generalEducation',

  specific: 'specific',
  วิชาเฉพาะ: 'specific',
  หมวดวิชาเฉพาะ: 'specific',

  free: 'freeElective',
  freeelective: 'freeElective',
  free_elective: 'freeElective',
  วิชาเลือกเสรี: 'freeElective',
  หมวดวิชาเลือกเสรี: 'freeElective',
  หมวดเลือกเสรี: 'freeElective',
}

const exactSubCategoryAliasMap = {
  กลุ่มสาระวิชาอัตลักษณ์: 'กลุ่มสาระวิชาอัตลักษณ์',
  กลุ่มสาระวิชาคุณภาพชีวิต: 'กลุ่มสาระวิชาคุณภาพชีวิต',
  กลุ่มสาระวิชาคุณภาพการทำงาน: 'กลุ่มสาระวิชาคุณภาพการทำงาน',
  กลุ่มสาระวิชาคุณภาพการทํางาน: 'กลุ่มสาระวิชาคุณภาพการทำงาน',
  กลุ่มสาระวิชาภาษาและการสื่อสาร: 'กลุ่มสาระวิชาภาษาและการสื่อสาร',
  กลุ่มสาระวิชาการปรับตัวและการใช้ชีวิต: 'กลุ่มสาระวิชาการปรับตัวและการใช้ชีวิต',
  กลุ่มสาระวิชาความเป็นพลเมืองไทยและพลเมืองโลก: 'กลุ่มสาระวิชาความเป็นพลเมืองไทยและพลเมืองโลก',

  กลุ่มวิชาสังคมศาสตร์และมนุษยศาสตร์: 'กลุ่มสาระวิชาความเป็นพลเมืองไทยและพลเมืองโลก',
  กลุ่มวิชาภาษา: 'กลุ่มสาระวิชาภาษาและการสื่อสาร',
  กลุ่มวิชาวิทยาศาสตร์กับคณิตศาสตร์: 'กลุ่มสาระวิชาคุณภาพชีวิต',
  กลุ่มบูรณาการ: 'กลุ่มสาระวิชาการปรับตัวและการใช้ชีวิต',

  กลุ่มวิชาแกน: 'กลุ่มวิชาแกน',
  กลุ่มวิชาบังคับ: 'กลุ่มวิชาบังคับ',
  กลุ่มวิชาเฉพาะด้าน: 'กลุ่มวิชาบังคับ',
  กลุ่มวิชาเลือก: 'กลุ่มวิชาเลือก',
  กลุ่มวิชาการพัฒนาซอฟต์แวร์: 'กลุ่มวิชาเลือก',
  กลุ่มการพัฒนาซอฟต์แวร์: 'กลุ่มวิชาเลือก',
  กลุ่มวิทยาการข้อมูล: 'กลุ่มวิชาเลือก',
  กลุ่มปัญญาประดิษฐ์และระบบอัตโนมัติ: 'กลุ่มวิชาเลือก',
  กลุ่มโครงสร้างพื้นฐานทางเทคโนโลยีสารสนเทศ: 'กลุ่มวิชาเลือก',
  กลุ่มวิชาโครงงานสำหรับวิทยาการคอมพิวเตอร์: 'กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ',
  กลุ่มวิชาเสริมสร้างประสบการณ์: 'กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ',
  กลุ่มวิชาเสริมสร้างประสบการณ์ทางวิทยาการคอมพิวเตอร์: 'กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ',
  กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ: 'กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ',

  วิชาเลือกเสรี: 'วิชาเลือกเสรี',
  หมวดวิชาเลือกเสรี: 'วิชาเลือกเสรี',
  หมวดเลือกเสรี: 'วิชาเลือกเสรี',
}

function normalizeTextValue(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/ทํางาน/g, 'ทำงาน')
    .trim()
}

function normalizeCurriculumLevel(value) {
  const cleanValue = normalizeTextValue(value).toLowerCase()

  if (cleanValue === 'bachelor' || cleanValue === 'ปริญญาตรี' || cleanValue.includes('ตรี')) {
    return 'bachelor'
  }

  if (cleanValue === 'master' || cleanValue === 'ปริญญาโท' || cleanValue.includes('โท')) {
    return 'master'
  }

  if (
    cleanValue === 'doctorate' ||
    cleanValue === 'doctoral' ||
    cleanValue === 'doctor' ||
    cleanValue === 'phd' ||
    cleanValue === 'ปริญญาเอก' ||
    cleanValue.includes('เอก')
  ) {
    return 'doctorate'
  }

  return cleanValue
}

function normalizeSubjectCategory(value, courseCode = '') {
  const cleanValue = normalizeTextValue(value)
  const compactValue = cleanValue.replace(/\s+/g, '').toLowerCase()

  if (categoryAliasMap[compactValue]) {
    return categoryAliasMap[compactValue]
  }

  if (categoryAliasMap[cleanValue]) {
    return categoryAliasMap[cleanValue]
  }

  const cleanCourseCode = String(courseCode || '').trim()

  if (cleanCourseCode.startsWith('15-')) return 'generalEducation'
  if (cleanCourseCode.toLowerCase().startsWith('xx-')) return 'freeElective'
  if (cleanCourseCode.startsWith('04-')) return 'specific'

  return cleanValue || ''
}

function normalizeSubCategory(value, subjectCategory = '', courseCode = '') {
  const cleanValue = normalizeTextValue(value)

  if (exactSubCategoryAliasMap[cleanValue]) {
    return exactSubCategoryAliasMap[cleanValue]
  }

  if (cleanValue.includes('กลุ่มสาระวิชาอัตลักษณ์')) return 'กลุ่มสาระวิชาอัตลักษณ์'
  if (cleanValue.includes('กลุ่มสาระวิชาคุณภาพชีวิต')) return 'กลุ่มสาระวิชาคุณภาพชีวิต'
  if (cleanValue.includes('กลุ่มสาระวิชาคุณภาพการทำงาน') || cleanValue.includes('กลุ่มสาระวิชาคุณภาพการทํางาน')) return 'กลุ่มสาระวิชาคุณภาพการทำงาน'
  if (cleanValue.includes('กลุ่มสาระวิชาภาษาและการสื่อสาร')) return 'กลุ่มสาระวิชาภาษาและการสื่อสาร'
  if (cleanValue.includes('กลุ่มสาระวิชาการปรับตัว')) return 'กลุ่มสาระวิชาการปรับตัวและการใช้ชีวิต'
  if (cleanValue.includes('กลุ่มสาระวิชาความเป็นพลเมืองไทย')) return 'กลุ่มสาระวิชาความเป็นพลเมืองไทยและพลเมืองโลก'

  if (cleanValue.includes('กลุ่มวิชาสังคมศาสตร์') || cleanValue.includes('มนุษยศาสตร์')) return 'กลุ่มสาระวิชาความเป็นพลเมืองไทยและพลเมืองโลก'
  if (cleanValue.includes('กลุ่มวิชาภาษา')) return 'กลุ่มสาระวิชาภาษาและการสื่อสาร'
  if (cleanValue.includes('วิทยาศาสตร์กับคณิตศาสตร์')) return 'กลุ่มสาระวิชาคุณภาพชีวิต'
  if (cleanValue.includes('บูรณาการ')) return 'กลุ่มสาระวิชาการปรับตัวและการใช้ชีวิต'

  if (cleanValue.includes('กลุ่มวิชาแกน')) return 'กลุ่มวิชาแกน'
  if (cleanValue.includes('กลุ่มวิชาบังคับ') || cleanValue.includes('กลุ่มวิชาเฉพาะด้าน')) return 'กลุ่มวิชาบังคับ'

  if (
    cleanValue.includes('กลุ่มวิชาเลือก') ||
    cleanValue.includes('พัฒนาซอฟต์แวร์') ||
    cleanValue.includes('วิทยาการข้อมูล') ||
    cleanValue.includes('ปัญญาประดิษฐ์') ||
    cleanValue.includes('ระบบอัตโนมัติ') ||
    cleanValue.includes('โครงสร้างพื้นฐานทางเทคโนโลยีสารสนเทศ')
  ) {
    return 'กลุ่มวิชาเลือก'
  }

  if (cleanValue.includes('เสริมสร้างประสบการณ์') || cleanValue.includes('โครงงานสำหรับวิทยาการคอมพิวเตอร์')) {
    return 'กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ'
  }

  const normalizedCategory = normalizeSubjectCategory(subjectCategory, courseCode)
  const cleanCourseCode = String(courseCode || '').trim()

  if (normalizedCategory === 'freeElective') return 'วิชาเลือกเสรี'

  if (normalizedCategory === 'generalEducation') {
    if (cleanCourseCode.startsWith('15-03-')) return 'กลุ่มสาระวิชาอัตลักษณ์'
    return cleanValue || 'กลุ่มสาระวิชาอัตลักษณ์'
  }

  if (normalizedCategory === 'specific') {
    return cleanValue || 'กลุ่มวิชาบังคับ'
  }

  return cleanValue
}

function getCurriculumLevelLabel(optionList, value) {
  if (value === 'all') return 'ทุกระดับ'
  return optionList.find((item) => item.value === value)?.label || '-'
}

function getSubjectCategoryLabel(optionList, value, courseCode = '') {
  const normalizedValue = normalizeSubjectCategory(value, courseCode)
  return optionList.find((item) => item.value === normalizedValue)?.label || '-'
}

function getSubjectBucket(subject) {
  const normalizedCategory = normalizeSubjectCategory(
    subject.subjectCategory,
    subject.courseCode
  )

  const normalizedSubCategory = normalizeSubCategory(
    subject.subCategory,
    normalizedCategory,
    subject.courseCode
  )

  if (normalizedCategory === 'generalEducation') {
    return `ge:${normalizedSubCategory}`
  }

  if (normalizedCategory === 'specific') {
    return `specific:${normalizedSubCategory}`
  }

  if (normalizedCategory === 'freeElective') {
    return 'freeElective:วิชาเลือกเสรี'
  }

  return ''
}

function getSubjectSelectionId(subject) {
  const subjectId = subject?.id ?? subject?.course_id ?? subject?.courseId ?? subject?.courseCode ?? ''
  return String(subjectId || '')
}

function SubjectReviewDialog({
  open,
  onClose,
  selectedMajor,
  activeOverviewLevel,
  isUsingDefaultOverviewLevel,
  subjectList,
  curriculumLevelOptions,
  subjectCategoryOptions,
  onEditSubject,
  onDeleteSubject,
  onBulkDeleteSubjects,
}) {
  const [reviewTab, setReviewTab] = useState('overview')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedSubjectIdList, setSelectedSubjectIdList] = useState([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      setReviewTab('overview')
      setSearchKeyword('')
      setIsMultiSelectMode(false)
      setSelectedSubjectIdList([])
    }
  }, [open])

  const safeSubjectList = useMemo(() => {
    return Array.isArray(subjectList) ? subjectList : []
  }, [subjectList])

  const normalizedOverviewLevel = useMemo(() => {
    const normalizedLevel = normalizeCurriculumLevel(activeOverviewLevel)

    if (normalizedLevel === 'bachelor' || normalizedLevel === 'master' || normalizedLevel === 'doctorate') {
      return normalizedLevel
    }

    return 'all'
  }, [activeOverviewLevel])

  const subjectListForOverview = useMemo(() => {
    if (normalizedOverviewLevel === 'all') return safeSubjectList

    return safeSubjectList.filter((subject) => {
      return normalizeCurriculumLevel(subject.curriculumLevel) === normalizedOverviewLevel
    })
  }, [normalizedOverviewLevel, safeSubjectList])

  const filteredSubjectList = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase()

    if (!normalizedKeyword) return safeSubjectList

    return safeSubjectList.filter((subject) => {
      const courseCode = String(subject.courseCode || '').toLowerCase()
      const courseNameThai = String(subject.courseNameThai || '').toLowerCase()
      const courseNameEnglish = String(subject.courseNameEnglish || '').toLowerCase()

      return courseCode.includes(normalizedKeyword) || courseNameThai.includes(normalizedKeyword) || courseNameEnglish.includes(normalizedKeyword)
    })
  }, [searchKeyword, safeSubjectList])

  const selectedSubjectIdSet = useMemo(() => {
    return new Set(selectedSubjectIdList)
  }, [selectedSubjectIdList])

  const selectedSubjectList = useMemo(() => {
    return safeSubjectList.filter((subject) => selectedSubjectIdSet.has(getSubjectSelectionId(subject)))
  }, [safeSubjectList, selectedSubjectIdSet])

  const filteredSubjectIdList = useMemo(() => {
    return filteredSubjectList.map((subject) => getSubjectSelectionId(subject)).filter(Boolean)
  }, [filteredSubjectList])

  const isAllFilteredSelected = useMemo(() => {
    return filteredSubjectIdList.length > 0 && filteredSubjectIdList.every((subjectId) => selectedSubjectIdSet.has(subjectId))
  }, [filteredSubjectIdList, selectedSubjectIdSet])

  const handleToggleMultiSelectMode = () => {
    if (isMultiSelectMode) {
      setSelectedSubjectIdList([])
    }

    setIsMultiSelectMode((prev) => !prev)
  }

  const handleToggleSelectSubject = (subject) => {
    const subjectId = getSubjectSelectionId(subject)

    if (!subjectId) return

    setSelectedSubjectIdList((prev) => {
      if (prev.includes(subjectId)) {
        return prev.filter((item) => item !== subjectId)
      }

      return [...prev, subjectId]
    })
  }

  const handleToggleSelectAllFiltered = () => {
    if (filteredSubjectIdList.length === 0) return

    setSelectedSubjectIdList((prev) => {
      if (isAllFilteredSelected) {
        return prev.filter((subjectId) => !filteredSubjectIdList.includes(subjectId))
      }

      return Array.from(new Set([...prev, ...filteredSubjectIdList]))
    })
  }

  const handleBulkDeleteSelectedSubjects = async () => {
    if (selectedSubjectList.length === 0) {
      window.alert('กรุณาเลือกรายวิชาที่ต้องการลบก่อน')
      return
    }

    const isConfirmed = window.confirm(`ต้องการลบรายวิชาที่เลือกทั้งหมด ${selectedSubjectList.length} รายวิชาใช่หรือไม่`)

    if (!isConfirmed) return

    try {
      setIsBulkDeleting(true)

      if (typeof onBulkDeleteSubjects === 'function') {
        await onBulkDeleteSubjects(selectedSubjectList)
      } else {
        for (const subject of selectedSubjectList) {
          await onDeleteSubject(subject.id, subject.courseNameThai || subject.courseCode || 'รายวิชา')
        }
      }

      setSelectedSubjectIdList([])
      setIsMultiSelectMode(false)
    } catch (error) {
      console.error('Error deleting selected subjects:', error)
      window.alert('ไม่สามารถลบรายวิชาที่เลือกได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const overviewSectionList = useMemo(() => {
    const configKey = normalizedOverviewLevel === 'all' ? 'bachelor' : normalizedOverviewLevel
    const config = overviewConfigByLevel[configKey] || overviewConfigByLevel.bachelor

    return config.map((section) => {
      const computedRows = section.rows.map((row) => {
        const ownedCredits = subjectListForOverview
          .filter((subject) => getSubjectBucket(subject) === row.bucket)
          .reduce((sum, subject) => sum + Number(subject.totalCredits || 0), 0)

        const remainingCredits = Math.max(row.minimum - ownedCredits, 0)

        return {
          ...row,
          ownedCredits,
          remainingCredits,
        }
      })

      return {
        ...section,
        rows: computedRows,
        totalOwnedCredits: computedRows.reduce((sum, row) => sum + row.ownedCredits, 0),
        totalMinimumCredits: computedRows.reduce((sum, row) => sum + row.minimum, 0),
        totalRemainingCredits: computedRows.reduce((sum, row) => sum + row.remainingCredits, 0),
      }
    })
  }, [normalizedOverviewLevel, subjectListForOverview])

  const renderOverviewSectionTable = (section) => {
    return (
      <Box key={section.title} className={styles.overviewSection}>
        <Typography className={styles.overviewSectionTitle}>{section.title}</Typography>

        <Box className={styles.overviewTableWrapper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className={styles.overviewHeadCell}>{section.firstColumnLabel}</TableCell>
                <TableCell align="right" className={styles.overviewHeadCell}>หน่วยกิตที่มี</TableCell>
                <TableCell align="right" className={styles.overviewHeadCell}>เกณฑ์ขั้นต่ำ</TableCell>
                <TableCell align="right" className={styles.overviewHeadCell}>คงเหลือ</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {section.rows.map((row) => (
                <TableRow key={row.bucket}>
                  <TableCell className={styles.overviewBodyCell}>{row.label}</TableCell>
                  <TableCell align="right" className={styles.overviewBodyCell}>{row.ownedCredits}</TableCell>
                  <TableCell align="right" className={styles.overviewBodyCell}>{row.minimum}</TableCell>
                  <TableCell align="right" className={styles.overviewBodyCell}>
                    <Box className={styles.remainingChip}>{row.remainingCredits}</Box>
                  </TableCell>
                </TableRow>
              ))}

              <TableRow>
                <TableCell className={styles.overviewTotalCell}>{section.totalLabel}</TableCell>
                <TableCell align="right" className={styles.overviewTotalCell}>{section.totalOwnedCredits}</TableCell>
                <TableCell align="right" className={styles.overviewTotalCell}>{section.totalMinimumCredits}</TableCell>
                <TableCell align="right" className={styles.overviewTotalCell}>
                  <Box className={styles.remainingChip}>{section.totalRemainingCredits}</Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      scroll="paper"
      PaperProps={{
        className: styles.subjectReviewDialogPaper,
        sx: {
          overflow: 'hidden',
        },
      }}
    >
      <DialogContent
        className={styles.subjectReviewDialogContent}
        sx={{
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <Box className={styles.reviewDialogTopBar}>
          <Box>
            <Typography className={styles.reviewDialogTitleText}>
              ภาพรวมสาขา: {selectedMajor?.majorNameTh || 'ยังไม่ได้ระบุสาขา'} · ระดับ: {getCurriculumLevelLabel(curriculumLevelOptions, normalizedOverviewLevel)}
            </Typography>

            <Typography className={styles.reviewDialogHint}>
              * แสดงรายวิชาทั้งหมดของสาขานี้ โดยระบบจะจัดกลุ่มจากหมวดวิชา/กลุ่มย่อย และช่วยรองรับรายวิชาที่นำเข้าจากไฟล์ Word
            </Typography>

            {isUsingDefaultOverviewLevel && normalizedOverviewLevel !== 'all' && (
              <Typography className={styles.reviewDialogSubHint}>
                ตอนนี้ยังไม่ได้เลือกระดับหลักสูตรในฟอร์ม ระบบจะแสดงเกณฑ์ตัวอย่างของปริญญาตรีก่อน
              </Typography>
            )}

            {safeSubjectList.length > 0 ? (
              <Typography className={styles.reviewDialogSubHint}>
                พบรายวิชาทั้งหมด {safeSubjectList.length} รายวิชาในสาขานี้
              </Typography>
            ) : (
              <Typography className={styles.reviewDialogSubHint}>
                ยังไม่มีรายวิชาในสาขานี้ หรือ API ยังไม่ได้ส่งรายวิชาของสาขานี้กลับมา
              </Typography>
            )}
          </Box>

          <Box className={styles.reviewDialogControlGroup}>
            <Box className={styles.reviewTabGroup}>
              <Button className={reviewTab === 'overview' ? styles.reviewTabButtonActive : styles.reviewTabButton} onClick={() => setReviewTab('overview')}>
                ภาพรวมหน่วยกิต
              </Button>

              <Button className={reviewTab === 'list' ? styles.reviewTabButtonActive : styles.reviewTabButton} onClick={() => setReviewTab('list')}>
                รายการวิชา
              </Button>
            </Box>

            <Button variant="outlined" className={styles.closeReviewButton} onClick={onClose}>ปิด</Button>
          </Box>
        </Box>

        {reviewTab === 'overview' ? (
          <Box className={styles.overviewContent} sx={{ overflow: 'visible', maxHeight: 'none' }}>
            {overviewSectionList.map((section) => renderOverviewSectionTable(section))}
          </Box>
        ) : (
          <Box className={styles.listContent} sx={{ overflow: 'visible', maxHeight: 'none' }}>
            <Box className={styles.reviewToolbar}>
              <TextField
                fullWidth
                placeholder="ค้นหารหัสวิชา ชื่อไทย หรือชื่ออังกฤษ..."
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon className={styles.searchIcon} />
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                <Button variant={isMultiSelectMode ? 'contained' : 'outlined'} onClick={handleToggleMultiSelectMode}>
                  {isMultiSelectMode ? 'ยกเลิกเลือกหลายรายการ' : 'เลือกหลายรายการ'}
                </Button>

                {isMultiSelectMode && (
                  <>
                    <Button variant="outlined" onClick={handleToggleSelectAllFiltered} disabled={filteredSubjectIdList.length === 0 || isBulkDeleting}>
                      {isAllFilteredSelected ? 'ยกเลิกเลือกทั้งหมดที่แสดง' : 'เลือกทั้งหมดที่แสดง'}
                    </Button>

                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<DeleteOutlineRoundedIcon />}
                      onClick={handleBulkDeleteSelectedSubjects}
                      disabled={selectedSubjectList.length === 0 || isBulkDeleting}
                    >
                      {isBulkDeleting ? 'กำลังลบ...' : `ลบรายการที่เลือก (${selectedSubjectList.length})`}
                    </Button>
                  </>
                )}
              </Box>
            </Box>

            {filteredSubjectList.length === 0 ? (
              <Box className={styles.emptySubjectState}>
                <Typography className={styles.emptySubjectTitle}>ยังไม่พบรายวิชาที่ค้นหา</Typography>
                <Typography className={styles.emptySubjectDescription}>ลองเปลี่ยนคำค้นหา หรือเพิ่มรายวิชาใหม่จากฟอร์มด้านหลัง</Typography>
              </Box>
            ) : (
              <Box className={styles.subjectList} sx={{ overflow: 'visible', maxHeight: 'none' }}>
                {filteredSubjectList.map((subject) => {
                  const normalizedCategory = normalizeSubjectCategory(
                    subject.subjectCategory,
                    subject.courseCode
                  )
                  const normalizedSubCategory = normalizeSubCategory(
                    subject.subCategory,
                    normalizedCategory,
                    subject.courseCode
                  )

                  return (
                    <Box
                      key={subject.id || subject.courseCode}
                      className={styles.subjectItemCard}
                      onClick={isMultiSelectMode ? () => handleToggleSelectSubject(subject) : undefined}
                      sx={isMultiSelectMode ? { cursor: 'pointer' } : undefined}
                    >
                      <Box className={styles.subjectItemTop}>
                        <Box className={styles.subjectMetaGroup}>
                          {isMultiSelectMode && (
                            <Checkbox
                              checked={selectedSubjectIdSet.has(getSubjectSelectionId(subject))}
                              onClick={(event) => event.stopPropagation()}
                              onChange={() => handleToggleSelectSubject(subject)}
                            />
                          )}

                          <Chip label={subject.courseCode || '-'} className={styles.subjectCodeChip} />
                          <Chip label={getCurriculumLevelLabel(curriculumLevelOptions, normalizeCurriculumLevel(subject.curriculumLevel))} variant="outlined" className={styles.subjectLevelChip} />
                        </Box>

                        {!isMultiSelectMode && (
                          <Box className={styles.subjectActionGroup}>
                            <IconButton className={styles.subjectActionButton} onClick={() => onEditSubject(subject)}>
                              <EditRoundedIcon />
                            </IconButton>

                            <IconButton className={styles.subjectActionButton} onClick={() => onDeleteSubject(subject.id, subject.courseNameThai)}>
                              <DeleteOutlineRoundedIcon />
                            </IconButton>
                          </Box>
                        )}
                      </Box>

                      <Typography className={styles.subjectItemNameThai}>{subject.courseNameThai || '-'}</Typography>
                      <Typography className={styles.subjectItemNameEnglish}>{subject.courseNameEnglish || '-'}</Typography>

                      <Box className={styles.subjectInfoRow}>
                        <Typography className={styles.subjectInfoText}>
                          หมวดวิชา: {getSubjectCategoryLabel(subjectCategoryOptions, normalizedCategory, subject.courseCode)}
                        </Typography>

                        <Typography className={styles.subjectInfoText}>
                          กลุ่มย่อย: {normalizedSubCategory || '-'}
                        </Typography>

                        <Typography className={styles.subjectInfoText}>
                          หน่วยกิต: {`${subject.totalCredits}(${subject.lectureHours}-${subject.labHours}-${subject.selfStudyHours})`}
                        </Typography>
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SubjectReviewDialog
