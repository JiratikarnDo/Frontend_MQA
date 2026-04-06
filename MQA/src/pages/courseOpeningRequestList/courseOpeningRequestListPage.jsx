import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import styles from './courseOpeningRequestListPage.module.css'

const initialRequestList = [
  {
    id: 'REQ-CO-001',
    level: 'bachelor',
    status: 'draft',
    updatedAt: '2026-04-05T14:20:00',
    submittedAt: '',
    rejectedReason: '',
    documentData: {
      generalForm: {
        submissionRound: '1',
        semester: '1',
        academicYear: '2569',
        curriculumName: 'หลักสูตรวิทยาศาสตรบัณฑิต',
        majorName: 'วิทยาการคอมพิวเตอร์',
        programType: '4year',
      },
      studyForm: {
        learningPeriod: 'regular',
        campus: 'bangpra',
        targetGroup: 'bp',
      },
      yearBlocks: [
        {
          id: 1,
          yearLevel: '1',
          entryTerm: '1',
          academicYear: '2569',
          subjectRows: [
            {
              id: 1,
              courseCode: 'CS101',
              courseName: 'พื้นฐานการเขียนโปรแกรม',
              credits: '3(2-2-5)',
              groupCount: '1',
              studentCount: '45',
              isFreeElective: false,
              scienceTrack: true,
              humanitiesTrack: false,
              note: '',
            },
          ],
        },
      ],
      approvalForm: {
        responsiblePeople: [
          { id: 1, name: 'อาจารย์ ก', signedDate: '' },
          { id: 2, name: 'อาจารย์ ข', signedDate: '' },
          { id: 3, name: 'อาจารย์ ค', signedDate: '' },
        ],
        headName: 'หัวหน้าสาขา',
        headDate: '',
        deputyDeanName: 'รองคณบดี',
        deputyDeanDate: '',
        deanName: 'คณบดี',
        deanDate: '',
        isConfirmed: false,
      },
    },
  },
  {
    id: 'REQ-CO-002',
    level: 'doctoral',
    status: 'rejected',
    updatedAt: '2026-04-04T10:00:00',
    submittedAt: '2026-04-04T16:30:00',
    rejectedReason:
      'กรุณาตรวจสอบจำนวนกลุ่มเรียนและข้อมูลรายวิชาที่เปิดสอนให้ตรงกับแผนการเรียนของหลักสูตรอีกครั้ง',
    documentData: {
      generalForm: {
        submissionRound: '1',
        semester: '1',
        academicYear: '2569',
        curriculumName: 'หลักสูตรปรัชญาดุษฎีบัณฑิต',
        majorName: 'เทคโนโลยีสารสนเทศ',
        formType: '1.1',
        campus: 'chakrabongse',
      },
      studyForm: {},
      yearBlocks: [
        {
          id: 1,
          yearLevel: '1',
          entryTerm: '1',
          academicYear: '2569',
          subjectRows: [
            {
              id: 1,
              courseCode: 'ITD801',
              courseName: 'ระเบียบวิธีวิจัยขั้นสูง',
              credits: '3(3-0-6)',
              groupCount: '1',
              studentCount: '12',
              isFreeElective: false,
              scienceTrack: false,
              humanitiesTrack: false,
              note: 'เปิดร่วมกับนักศึกษารุ่นใหม่',
            },
          ],
        },
      ],
      approvalForm: {
        responsiblePeople: [
          { id: 1, name: 'อาจารย์ ง', signedDate: '' },
          { id: 2, name: 'อาจารย์ จ', signedDate: '' },
          { id: 3, name: 'อาจารย์ ฉ', signedDate: '' },
        ],
        headName: 'หัวหน้าสาขา',
        headDate: '',
        deputyDeanName: 'รองคณบดี',
        deputyDeanDate: '',
        deanName: 'คณบดี',
        deanDate: '',
        isConfirmed: false,
      },
    },
  },
  {
    id: 'REQ-CO-003',
    level: 'master',
    status: 'draft',
    updatedAt: '2026-04-06T09:10:00',
    submittedAt: '',
    rejectedReason: '',
    documentData: {
      generalForm: {
        submissionRound: '1',
        semester: '1',
        academicYear: '2569',
        curriculumName: 'หลักสูตรวิทยาศาสตรมหาบัณฑิต',
        majorName: 'วิทยาการคอมพิวเตอร์',
      },
      studyForm: {
        studyPlan: 'planB',
        learningPeriod: 'afterHours',
        campus: 'chakrabongse',
      },
      yearBlocks: [
        {
          id: 1,
          yearLevel: '1',
          entryTerm: '1',
          academicYear: '2569',
          subjectRows: [
            {
              id: 1,
              courseCode: 'CSM601',
              courseName: 'การวิเคราะห์ข้อมูลขั้นสูง',
              credits: '3(3-0-6)',
              groupCount: '1',
              studentCount: '18',
              isFreeElective: false,
              scienceTrack: true,
              humanitiesTrack: false,
              note: '',
            },
          ],
        },
      ],
      approvalForm: {
        responsiblePeople: [
          { id: 1, name: 'อาจารย์ ก', signedDate: '' },
          { id: 2, name: 'อาจารย์ ข', signedDate: '' },
          { id: 3, name: 'อาจารย์ ค', signedDate: '' },
        ],
        headName: 'หัวหน้าสาขา',
        headDate: '',
        deputyDeanName: 'รองคณบดี',
        deputyDeanDate: '',
        deanName: 'คณบดี',
        deanDate: '',
        isConfirmed: false,
      },
    },
  },
]

function formatThaiDateTime(dateValue) {
  if (!dateValue) {
    return '-'
  }

  return new Date(dateValue).toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getLevelLabel(level) {
  if (level === 'bachelor') return 'ปริญญาตรี'
  if (level === 'master') return 'ปริญญาโท'
  if (level === 'doctoral') return 'ปริญญาเอก'
  return '-'
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

function CourseOpeningRequestListPage() {
  const navigate = useNavigate()
  const [requestList, setRequestList] = useState(initialRequestList)
  const [levelFilter, setLevelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [reasonDialog, setReasonDialog] = useState({
    isOpen: false,
    requestId: '',
    requestTitle: '',
    rejectedReason: '',
  })

  const filteredRequestList = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLowerCase()

    return requestList.filter((item) => {
      const matchedLevel =
        levelFilter === 'all' ? true : item.level === levelFilter

      const matchedStatus =
        statusFilter === 'all' ? true : item.status === statusFilter

      const matchedSearch =
        normalizedSearchText.length === 0 ||
        item.id.toLowerCase().includes(normalizedSearchText) ||
        item.documentData.generalForm.curriculumName
          .toLowerCase()
          .includes(normalizedSearchText) ||
        item.documentData.generalForm.majorName
          .toLowerCase()
          .includes(normalizedSearchText) ||
        getLevelLabel(item.level).toLowerCase().includes(normalizedSearchText)

      return matchedLevel && matchedStatus && matchedSearch
    })
  }, [levelFilter, requestList, searchText, statusFilter])

  const pageSummary = useMemo(() => {
    const totalCount = requestList.length
    const draftCount = requestList.filter((item) => item.status === 'draft').length
    const pendingApprovalCount = requestList.filter(
      (item) => item.status === 'pendingApproval'
    ).length
    const rejectedCount = requestList.filter(
      (item) => item.status === 'rejected'
    ).length

    return {
      totalCount,
      draftCount,
      pendingApprovalCount,
      rejectedCount,
    }
  }, [requestList])

  const handleSendDocument = (requestId) => {
    const confirmed = window.confirm('ต้องการส่งเอกสารรายการนี้ใช่หรือไม่')
    if (!confirmed) {
      return
    }

    setRequestList((prev) =>
      prev.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: 'pendingApproval',
              submittedAt: new Date().toISOString(),
            }
          : item
      )
    )
  }

  const handleViewDetail = (item) => {
    if (item.level === 'bachelor') {
      navigate('/courseOpeningBachelor', {
        state: {
          requestData: item,
        },
      })
      return
    }

    if (item.level === 'master') {
      navigate('/courseOpeningMaster', {
        state: {
          requestData: item,
        },
      })
      return
    }

    if (item.level === 'doctoral') {
      navigate('/courseOpeningDoctoral', {
        state: {
          requestData: item,
        },
      })
    }
  }

  const handleOpenRejectedReason = (item) => {
    setReasonDialog({
      isOpen: true,
      requestId: item.id,
      requestTitle: `${item.documentData.generalForm.curriculumName} - ${item.documentData.generalForm.majorName}`,
      rejectedReason: item.rejectedReason,
    })
  }

  const handleCloseRejectedReason = () => {
    setReasonDialog({
      isOpen: false,
      requestId: '',
      requestTitle: '',
      rejectedReason: '',
    })
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>
              ดูรายละเอียดการเปิดรายวิชา
            </Typography>
            <Typography className={styles.pageDescription}>
              หน้านี้ใช้สำหรับตรวจสอบรายการคำขอเปิดรายวิชาที่บันทึกไว้ก่อนส่งเอกสารจริง
              ผู้ใช้สามารถดูรายละเอียดของคำขอแต่ละรายการ ตรวจสอบสถานะ
              และกดส่งเอกสารจากหน้ารายการได้ทันที
            </Typography>
          </Box>
        </Box>

        <Box className={styles.summaryGrid}>
          <Box className={styles.summaryCard}>
            <Box className={styles.summaryIconBlue}>
              <DescriptionRoundedIcon />
            </Box>
            <Box>
              <Typography className={styles.summaryLabel}>
                เอกสารทั้งหมด
              </Typography>
              <Typography className={styles.summaryValue}>
                {pageSummary.totalCount}
              </Typography>
            </Box>
          </Box>

          <Box className={styles.summaryCard}>
            <Box className={styles.summaryIconAmber}>
              <AccessTimeRoundedIcon />
            </Box>
            <Box>
              <Typography className={styles.summaryLabel}>แบบร่าง</Typography>
              <Typography className={styles.summaryValue}>
                {pageSummary.draftCount}
              </Typography>
            </Box>
          </Box>

          <Box className={styles.summaryCard}>
            <Box className={styles.summaryIconGreen}>
              <FactCheckRoundedIcon />
            </Box>
            <Box>
              <Typography className={styles.summaryLabel}>
                รออนุมัติ
              </Typography>
              <Typography className={styles.summaryValue}>
                {pageSummary.pendingApprovalCount}
              </Typography>
            </Box>
          </Box>

          <Box className={styles.summaryCard}>
            <Box className={styles.summaryIconRed}>
              <InfoOutlinedIcon />
            </Box>
            <Box>
              <Typography className={styles.summaryLabel}>
                ไม่อนุมัติ
              </Typography>
              <Typography className={styles.summaryValue}>
                {pageSummary.rejectedCount}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box className={styles.filterCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>
                ค้นหาและกรองรายการ
              </Typography>
              <Typography className={styles.sectionDescription}>
                สามารถกรองตามระดับการศึกษา สถานะ และค้นหาด้วยรหัสคำขอ ชื่อหลักสูตร
                หรือชื่อสาขาได้
              </Typography>
            </Box>
          </Box>

          <Box className={styles.filterGrid}>
            <TextField
              fullWidth
              label="ค้นหารายการ"
              placeholder="ค้นหาจากรหัสคำขอ / หลักสูตร / สาขา"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon />
                  </InputAdornment>
                ),
              }}
            />

            <Box className={styles.filterRightGrid}>
              <TextField
                select
                fullWidth
                label="ระดับการศึกษา"
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.target.value)}
              >
                <MenuItem value="all">ทั้งหมด</MenuItem>
                <MenuItem value="bachelor">ปริญญาตรี</MenuItem>
                <MenuItem value="master">ปริญญาโท</MenuItem>
                <MenuItem value="doctoral">ปริญญาเอก</MenuItem>
              </TextField>

              <TextField
                select
                fullWidth
                label="สถานะเอกสาร"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value="all">ทั้งหมด</MenuItem>
                <MenuItem value="draft">บันทึกแล้ว ยังไม่ส่ง</MenuItem>
                <MenuItem value="pendingApproval">
                  ส่งเอกสารแล้วกำลังรออนุมัติ
                </MenuItem>
                <MenuItem value="rejected">ไม่อนุมัติ</MenuItem>
              </TextField>
            </Box>
          </Box>
        </Box>

        <Box className={styles.listCard}>
          <Box className={styles.sectionHeader}>
            <Box>
              <Typography className={styles.sectionTitle}>
                รายการคำขอเปิดรายวิชา
              </Typography>
              <Typography className={styles.sectionDescription}>
                ตอนนี้ปุ่มดูรายละเอียดเชื่อมเข้าหน้าปริญญาตรี ปริญญาโท และปริญญาเอกแล้ว
              </Typography>
            </Box>

            <Chip
              label={`พบ ${filteredRequestList.length} รายการ`}
              className={styles.resultChip}
            />
          </Box>

          <Box className={styles.requestList}>
            {filteredRequestList.map((item) => {
              const statusConfig = getStatusConfig(item.status)

              return (
                <Box key={item.id} className={styles.requestCard}>
                  <Box className={styles.requestCardTop}>
                    <Box className={styles.requestTitleBlock}>
                      <Box className={styles.requestBadgeRow}>
                        <Box className={styles.levelBadge}>
                          <SchoolRoundedIcon fontSize="small" />
                          <span>{getLevelLabel(item.level)}</span>
                        </Box>

                        <Chip
                          label={statusConfig.label}
                          className={statusConfig.className}
                        />
                      </Box>

                      <Typography className={styles.requestTitle}>
                        {item.documentData.generalForm.curriculumName}
                      </Typography>

                      <Typography className={styles.requestSubtitle}>
                        สาขา {item.documentData.generalForm.majorName} • รหัสคำขอ{' '}
                        {item.id}
                      </Typography>
                    </Box>

                    <Box className={styles.actionGroup}>
                      <Button
                        variant="outlined"
                        startIcon={<VisibilityRoundedIcon />}
                        className={styles.outlinedButton}
                        onClick={() => handleViewDetail(item)}
                      >
                        ดูรายละเอียด
                      </Button>

                      {item.status === 'rejected' && (
                        <Button
                          variant="outlined"
                          startIcon={<InfoOutlinedIcon />}
                          color="error"
                          className={styles.outlinedButton}
                          onClick={() => handleOpenRejectedReason(item)}
                        >
                          ดูสาเหตุ
                        </Button>
                      )}

                      {item.status === 'draft' && (
                        <Button
                          variant="contained"
                          startIcon={<SendRoundedIcon />}
                          className={styles.primaryButton}
                          onClick={() => handleSendDocument(item.id)}
                        >
                          ส่งเอกสาร
                        </Button>
                      )}
                    </Box>
                  </Box>

                  <Box className={styles.metaGrid}>
                    <Box className={styles.metaCard}>
                      <Typography className={styles.metaLabel}>ภาคการศึกษา</Typography>
                      <Typography className={styles.metaValue}>
                        {item.documentData.generalForm.semester}
                      </Typography>
                    </Box>

                    <Box className={styles.metaCard}>
                      <Typography className={styles.metaLabel}>ปีการศึกษา</Typography>
                      <Typography className={styles.metaValue}>
                        {item.documentData.generalForm.academicYear}
                      </Typography>
                    </Box>

                    <Box className={styles.metaCard}>
                      <Typography className={styles.metaLabel}>
                        แก้ไขล่าสุด
                      </Typography>
                      <Typography className={styles.metaValue}>
                        {formatThaiDateTime(item.updatedAt)}
                      </Typography>
                    </Box>

                    <Box className={styles.metaCard}>
                      <Typography className={styles.metaLabel}>วันที่ส่ง</Typography>
                      <Typography className={styles.metaValue}>
                        {formatThaiDateTime(item.submittedAt)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box className={styles.requestFooter}>
                    <Typography className={styles.footerText}>
                      {item.status === 'pendingApproval' &&
                        'เอกสารรายการนี้ถูกส่งแล้วและกำลังอยู่ระหว่างรอการอนุมัติ'}
                      {item.status === 'draft' &&
                        'เอกสารรายการนี้ยังอยู่ในสถานะบันทึกไว้ สามารถตรวจสอบและส่งเอกสารได้'}
                      {item.status === 'rejected' &&
                        'เอกสารรายการนี้ไม่อนุมัติ สามารถกดดูสาเหตุและเตรียมแก้ไขในขั้นตอนถัดไป'}
                    </Typography>
                  </Box>
                </Box>
              )
            })}

            {!filteredRequestList.length && (
              <Box className={styles.emptyState}>
                <DescriptionRoundedIcon className={styles.emptyStateIcon} />
                <Typography className={styles.emptyStateTitle}>
                  ไม่พบรายการที่ตรงกับเงื่อนไข
                </Typography>
                <Typography className={styles.emptyStateDescription}>
                  ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองใหม่อีกครั้ง
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Dialog
        open={reasonDialog.isOpen}
        onClose={handleCloseRejectedReason}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>สาเหตุที่ไม่อนุมัติ</DialogTitle>

        <DialogContent dividers>
          <Typography className={styles.dialogTitleText}>
            {reasonDialog.requestTitle}
          </Typography>

          <Typography className={styles.dialogSubText}>
            รหัสคำขอ {reasonDialog.requestId}
          </Typography>

          <Box className={styles.reasonBox}>
            <Typography className={styles.reasonText}>
              {reasonDialog.rejectedReason || '-'}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseRejectedReason}>ปิด</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CourseOpeningRequestListPage