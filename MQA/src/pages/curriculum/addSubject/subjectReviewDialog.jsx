import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
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

const overviewConfigByLevel = {
  bachelor: [
    {
      title: '1) หมวดวิชาศึกษาทั่วไป',
      firstColumnLabel: 'กลุ่ม',
      totalLabel: 'รวมหมวดศึกษาทั่วไป',
      rows: [
        { label: 'กลุ่มวิชาสังคมศาสตร์และมนุษยศาสตร์', bucket: 'ge:กลุ่มวิชาสังคมศาสตร์และมนุษยศาสตร์', minimum: 6 },
        { label: 'กลุ่มวิชาภาษา', bucket: 'ge:กลุ่มวิชาภาษา', minimum: 12 },
        { label: 'กลุ่มวิชาวิทยาศาสตร์กับคณิตศาสตร์', bucket: 'ge:กลุ่มวิชาวิทยาศาสตร์กับคณิตศาสตร์', minimum: 6 },
        { label: 'กลุ่มบูรณาการ', bucket: 'ge:กลุ่มบูรณาการ', minimum: 6 },
      ],
    },
    {
      title: '2) หมวดวิชาเฉพาะ',
      firstColumnLabel: 'กลุ่ม',
      totalLabel: 'รวมหมวดวิชาเฉพาะ',
      rows: [
        { label: 'กลุ่มวิชาแกน', bucket: 'specific:กลุ่มวิชาแกน', minimum: 15 },
        { label: 'กลุ่มวิชาเฉพาะด้าน', bucket: 'specific:กลุ่มวิชาเฉพาะด้าน', minimum: 52 },
        { label: 'กลุ่มวิชาเลือก', bucket: 'specific:กลุ่มวิชาเลือก', minimum: 12 },
        { label: 'กลุ่มวิชาโครงงานสำหรับวิทยาการคอมพิวเตอร์', bucket: 'specific:กลุ่มวิชาโครงงานสำหรับวิทยาการคอมพิวเตอร์', minimum: 6 },
        { label: 'กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ', bucket: 'specific:กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ', minimum: 7 },
      ],
    },
    {
      title: '3) หมวดวิชาเลือกเสรี',
      firstColumnLabel: 'หมวด',
      totalLabel: 'รวมหมวดวิชาเลือกเสรี',
      rows: [
        { label: 'วิชาเลือกเสรี', bucket: 'freeElective:วิชาเลือกเสรี', minimum: 6 },
      ],
    },
  ],
  master: [
    {
      title: '1) หมวดวิชาศึกษาทั่วไป',
      firstColumnLabel: 'กลุ่ม',
      totalLabel: 'รวมหมวดศึกษาทั่วไป',
      rows: [
        { label: 'กลุ่มวิชาสังคมศาสตร์และมนุษยศาสตร์', bucket: 'ge:กลุ่มวิชาสังคมศาสตร์และมนุษยศาสตร์', minimum: 6 },
        { label: 'กลุ่มวิชาภาษา', bucket: 'ge:กลุ่มวิชาภาษา', minimum: 12 },
        { label: 'กลุ่มวิชาวิทยาศาสตร์กับคณิตศาสตร์', bucket: 'ge:กลุ่มวิชาวิทยาศาสตร์กับคณิตศาสตร์', minimum: 6 },
        { label: 'กลุ่มบูรณาการ', bucket: 'ge:กลุ่มบูรณาการ', minimum: 6 },
      ],
    },
    {
      title: '2) หมวดวิชาเฉพาะ',
      firstColumnLabel: 'กลุ่ม',
      totalLabel: 'รวมหมวดวิชาเฉพาะ',
      rows: [
        { label: 'กลุ่มวิชาแกน', bucket: 'specific:กลุ่มวิชาแกน', minimum: 15 },
        { label: 'กลุ่มวิชาเฉพาะด้าน', bucket: 'specific:กลุ่มวิชาเฉพาะด้าน', minimum: 52 },
        { label: 'กลุ่มวิชาเลือก', bucket: 'specific:กลุ่มวิชาเลือก', minimum: 12 },
        { label: 'กลุ่มวิชาโครงงานสำหรับวิทยาการคอมพิวเตอร์', bucket: 'specific:กลุ่มวิชาโครงงานสำหรับวิทยาการคอมพิวเตอร์', minimum: 6 },
        { label: 'กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ', bucket: 'specific:กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ', minimum: 7 },
      ],
    },
    {
      title: '3) หมวดวิชาเลือกเสรี',
      firstColumnLabel: 'หมวด',
      totalLabel: 'รวมหมวดวิชาเลือกเสรี',
      rows: [
        { label: 'วิชาเลือกเสรี', bucket: 'freeElective:วิชาเลือกเสรี', minimum: 6 },
      ],
    },
  ],
  doctorate: [
    {
      title: '1) หมวดวิชาศึกษาทั่วไป',
      firstColumnLabel: 'กลุ่ม',
      totalLabel: 'รวมหมวดศึกษาทั่วไป',
      rows: [
        { label: 'กลุ่มวิชาสังคมศาสตร์และมนุษยศาสตร์', bucket: 'ge:กลุ่มวิชาสังคมศาสตร์และมนุษยศาสตร์', minimum: 6 },
        { label: 'กลุ่มวิชาภาษา', bucket: 'ge:กลุ่มวิชาภาษา', minimum: 12 },
        { label: 'กลุ่มวิชาวิทยาศาสตร์กับคณิตศาสตร์', bucket: 'ge:กลุ่มวิชาวิทยาศาสตร์กับคณิตศาสตร์', minimum: 6 },
        { label: 'กลุ่มบูรณาการ', bucket: 'ge:กลุ่มบูรณาการ', minimum: 6 },
      ],
    },
    {
      title: '2) หมวดวิชาเฉพาะ',
      firstColumnLabel: 'กลุ่ม',
      totalLabel: 'รวมหมวดวิชาเฉพาะ',
      rows: [
        { label: 'กลุ่มวิชาแกน', bucket: 'specific:กลุ่มวิชาแกน', minimum: 15 },
        { label: 'กลุ่มวิชาเฉพาะด้าน', bucket: 'specific:กลุ่มวิชาเฉพาะด้าน', minimum: 52 },
        { label: 'กลุ่มวิชาเลือก', bucket: 'specific:กลุ่มวิชาเลือก', minimum: 12 },
        { label: 'กลุ่มวิชาโครงงานสำหรับวิทยาการคอมพิวเตอร์', bucket: 'specific:กลุ่มวิชาโครงงานสำหรับวิทยาการคอมพิวเตอร์', minimum: 6 },
        { label: 'กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ', bucket: 'specific:กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ', minimum: 7 },
      ],
    },
    {
      title: '3) หมวดวิชาเลือกเสรี',
      firstColumnLabel: 'หมวด',
      totalLabel: 'รวมหมวดวิชาเลือกเสรี',
      rows: [
        { label: 'วิชาเลือกเสรี', bucket: 'freeElective:วิชาเลือกเสรี', minimum: 6 },
      ],
    },
  ],
}

function getCurriculumLevelLabel(optionList, value) {
  return optionList.find((item) => item.value === value)?.label || '-'
}

function getSubjectCategoryLabel(optionList, value) {
  return optionList.find((item) => item.value === value)?.label || '-'
}

function getSubjectBucket(subject) {
  if (subject.subjectCategory === 'generalEducation') {
    return `ge:${subject.subCategory || ''}`
  }

  if (subject.subjectCategory === 'specific') {
    const specificGroupList = [
      'กลุ่มวิชาแกน',
      'กลุ่มวิชาเฉพาะด้าน',
      'กลุ่มวิชาเลือก',
      'กลุ่มวิชาโครงงานสำหรับวิทยาการคอมพิวเตอร์',
      'กลุ่มวิชาเสริมสร้างประสบการณ์วิชาชีพ',
    ]

    if (specificGroupList.includes(subject.subCategory)) {
      return `specific:${subject.subCategory}`
    }

    return 'specific:กลุ่มวิชาเฉพาะด้าน'
  }

  if (subject.subjectCategory === 'freeElective') {
    return 'freeElective:วิชาเลือกเสรี'
  }

  return ''
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
}) {
  const [reviewTab, setReviewTab] = useState('overview')
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    if (open) {
      setReviewTab('overview')
      setSearchKeyword('')
    }
  }, [open])

  const filteredSubjectList = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase()

    if (!normalizedKeyword) return subjectList

    return subjectList.filter((subject) => {
      return (
        subject.courseCode.toLowerCase().includes(normalizedKeyword) ||
        subject.courseNameThai.toLowerCase().includes(normalizedKeyword) ||
        subject.courseNameEnglish.toLowerCase().includes(normalizedKeyword)
      )
    })
  }, [searchKeyword, subjectList])

  const filteredSubjectListByLevel = useMemo(() => {
    return subjectList.filter((subject) => subject.curriculumLevel === activeOverviewLevel)
  }, [activeOverviewLevel, subjectList])

  const overviewSectionList = useMemo(() => {
    const config = overviewConfigByLevel[activeOverviewLevel] || overviewConfigByLevel.bachelor

    return config.map((section) => {
      const computedRows = section.rows.map((row) => {
        const ownedCredits = filteredSubjectListByLevel
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
  }, [activeOverviewLevel, filteredSubjectListByLevel])

  const renderOverviewSectionTable = (section) => {
    return (
      <Box key={section.title} className={styles.overviewSection}>
        <Typography className={styles.overviewSectionTitle}>
          {section.title}
        </Typography>

        <Box className={styles.overviewTableWrapper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className={styles.overviewHeadCell}>
                  {section.firstColumnLabel}
                </TableCell>
                <TableCell align="right" className={styles.overviewHeadCell}>
                  หน่วยกิตที่มี
                </TableCell>
                <TableCell align="right" className={styles.overviewHeadCell}>
                  เกณฑ์ขั้นต่ำ
                </TableCell>
                <TableCell align="right" className={styles.overviewHeadCell}>
                  คงเหลือ
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {section.rows.map((row) => (
                <TableRow key={row.bucket}>
                  <TableCell className={styles.overviewBodyCell}>
                    {row.label}
                  </TableCell>

                  <TableCell align="right" className={styles.overviewBodyCell}>
                    {row.ownedCredits}
                  </TableCell>

                  <TableCell align="right" className={styles.overviewBodyCell}>
                    {row.minimum}
                  </TableCell>

                  <TableCell align="right" className={styles.overviewBodyCell}>
                    <Box className={styles.remainingChip}>
                      {row.remainingCredits}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}

              <TableRow>
                <TableCell className={styles.overviewTotalCell}>
                  {section.totalLabel}
                </TableCell>

                <TableCell align="right" className={styles.overviewTotalCell}>
                  {section.totalOwnedCredits}
                </TableCell>

                <TableCell align="right" className={styles.overviewTotalCell}>
                  {section.totalMinimumCredits}
                </TableCell>

                <TableCell align="right" className={styles.overviewTotalCell}>
                  <Box className={styles.remainingChip}>
                    {section.totalRemainingCredits}
                  </Box>
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
      PaperProps={{
        className: styles.subjectReviewDialogPaper,
      }}
    >
      <DialogContent className={styles.subjectReviewDialogContent}>
        <Box className={styles.reviewDialogTopBar}>
          <Box>
            <Typography className={styles.reviewDialogTitleText}>
              ภาพรวมสาขา: {selectedMajor?.majorNameTh || 'ยังไม่ได้ระบุสาขา'} · ระดับ: {getCurriculumLevelLabel(curriculumLevelOptions, activeOverviewLevel)}
            </Typography>

            <Typography className={styles.reviewDialogHint}>
              * เกณฑ์ขั้นต่ำอาจเปลี่ยนตาม “ระดับหลักสูตร” ที่เลือกในฟอร์มด้านซ้าย
            </Typography>

            {isUsingDefaultOverviewLevel && (
              <Typography className={styles.reviewDialogSubHint}>
                ตอนนี้ยังไม่ได้เลือกระดับหลักสูตรในฟอร์ม ระบบจะแสดงเกณฑ์ตัวอย่างของปริญญาตรีก่อน
              </Typography>
            )}
          </Box>

          <Box className={styles.reviewDialogControlGroup}>
            <Box className={styles.reviewTabGroup}>
              <Button
                className={reviewTab === 'overview' ? styles.reviewTabButtonActive : styles.reviewTabButton}
                onClick={() => setReviewTab('overview')}
              >
                ภาพรวมหน่วยกิต
              </Button>

              <Button
                className={reviewTab === 'list' ? styles.reviewTabButtonActive : styles.reviewTabButton}
                onClick={() => setReviewTab('list')}
              >
                รายการวิชา
              </Button>
            </Box>

            <Button
              variant="outlined"
              className={styles.closeReviewButton}
              onClick={onClose}
            >
              ปิด
            </Button>
          </Box>
        </Box>

        {reviewTab === 'overview' ? (
          <Box className={styles.overviewContent}>
            {overviewSectionList.map((section) => renderOverviewSectionTable(section))}
          </Box>
        ) : (
          <Box className={styles.listContent}>
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
            </Box>

            {filteredSubjectList.length === 0 ? (
              <Box className={styles.emptySubjectState}>
                <Typography className={styles.emptySubjectTitle}>
                  ยังไม่พบรายวิชาที่ค้นหา
                </Typography>

                <Typography className={styles.emptySubjectDescription}>
                  ลองเปลี่ยนคำค้นหา หรือเพิ่มรายวิชาใหม่จากฟอร์มด้านหลัง
                </Typography>
              </Box>
            ) : (
              <Box className={styles.subjectList}>
                {filteredSubjectList.map((subject) => (
                  <Box key={subject.id} className={styles.subjectItemCard}>
                    <Box className={styles.subjectItemTop}>
                      <Box className={styles.subjectMetaGroup}>
                        <Chip
                          label={subject.courseCode}
                          className={styles.subjectCodeChip}
                        />

                        <Chip
                          label={getCurriculumLevelLabel(curriculumLevelOptions, subject.curriculumLevel)}
                          variant="outlined"
                          className={styles.subjectLevelChip}
                        />
                      </Box>

                      <Box className={styles.subjectActionGroup}>
                        <IconButton
                          className={styles.subjectActionButton}
                          onClick={() => onEditSubject(subject)}
                        >
                          <EditRoundedIcon />
                        </IconButton>

                        <IconButton
                          className={styles.subjectActionButton}
                          onClick={() => onDeleteSubject(subject.id, subject.courseNameThai)}
                        >
                          <DeleteOutlineRoundedIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography className={styles.subjectItemNameThai}>
                      {subject.courseNameThai}
                    </Typography>

                    <Typography className={styles.subjectItemNameEnglish}>
                      {subject.courseNameEnglish}
                    </Typography>

                    <Box className={styles.subjectInfoRow}>
                      <Typography className={styles.subjectInfoText}>
                        หมวดวิชา: {getSubjectCategoryLabel(subjectCategoryOptions, subject.subjectCategory)}
                      </Typography>

                      <Typography className={styles.subjectInfoText}>
                        หน่วยกิต: {`${subject.totalCredits}(${subject.lectureHours}-${subject.labHours}-${subject.selfStudyHours})`}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SubjectReviewDialog