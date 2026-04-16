import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import styles from './deanCourseOpeningReviewListPage.module.css'

const initialRequestList = [
  {
    id: 'REQ-CO-001',
    level: 'bachelor',
    status: 'pendingApproval',
    updatedAt: '2026-04-05T14:20:00',
    submittedAt: '2026-04-05T16:00:00',
    reviewedAt: '',
    rejectedReason: '',
    documentData: {
      generalForm: {
        majorCode: '61',
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
    level: 'master',
    status: 'pendingApproval',
    updatedAt: '2026-04-06T09:10:00',
    submittedAt: '2026-04-06T10:30:00',
    reviewedAt: '',
    rejectedReason: '',
    documentData: {
      generalForm: {
        majorCode: '61',
        submissionRound: '1',
        semester: '1',
        academicYear: '2569',
        curriculumName: 'หลักสูตรวิทยาศาสตรมหาบัณฑิต',
        majorName: 'วิทยาการคอมพิวเตอร์',
        studyPlan: 'planB',
      },
      studyForm: {
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
  {
    id: 'REQ-CO-003',
    level: 'doctoral',
    status: 'pendingApproval',
    updatedAt: '2026-04-04T10:00:00',
    submittedAt: '2026-04-04T16:30:00',
    reviewedAt: '',
    rejectedReason: '',
    documentData: {
      generalForm: {
        majorCode: '91',
        submissionRound: '1',
        semester: '1',
        academicYear: '2569',
        curriculumName: 'หลักสูตรปรัชญาดุษฎีบัณฑิต',
        majorName: 'เทคโนโลยีคอมพิวเตอร์',
        formType: '1.1',
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
    id: 'REQ-CO-004',
    level: 'bachelor',
    status: 'approved',
    updatedAt: '2026-04-03T11:00:00',
    submittedAt: '2026-04-03T13:30:00',
    reviewedAt: '2026-04-04T09:00:00',
    rejectedReason: '',
    documentData: {
      generalForm: {
        majorCode: '61',
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
      yearBlocks: [],
      approvalForm: {
        responsiblePeople: [],
        headName: 'หัวหน้าสาขา',
        headDate: '',
        deputyDeanName: 'รองคณบดี',
        deputyDeanDate: '',
        deanName: 'คณบดี',
        deanDate: '2026-04-04',
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

function getTodayDateForInput() {
  return new Date().toISOString().split('T')[0]
}

function getLevelLabel(level) {
  if (level === 'bachelor') return 'ปริญญาตรี'
  if (level === 'master') return 'ปริญญาโท'
  if (level === 'doctoral') return 'ปริญญาเอก'
  return '-'
}

function getStatusConfig(status) {
  if (status === 'pendingApproval') {
    return {
      label: 'รอคณบดีพิจารณา',
      className: styles.statusChipPendingApproval,
    }
  }

  if (status === 'approved') {
    return {
      label: 'อนุมัติแล้ว',
      className: styles.statusChipApproved,
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

function DeanCourseOpeningReviewListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedMajor = location.state?.selectedMajor || null

  const [requestList, setRequestList] = useState(initialRequestList)
  const [levelFilter, setLevelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [rejectDialog, setRejectDialog] = useState({
    isOpen: false,
    requestId: '',
    requestTitle: '',
    note: '',
  })
  const [reasonDialog, setReasonDialog] = useState({
    isOpen: false,
    requestId: '',
    requestTitle: '',
    rejectedReason: '',
  })

  const scopedRequestList = useMemo(() => {
    if (!selectedMajor?.majorCode) {
      return requestList
    }

    return requestList.filter(
      (item) =>
        String(item.documentData.generalForm.majorCode) ===
        String(selectedMajor.majorCode)
    )
  }, [requestList, selectedMajor])

  const filteredRequestList = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLowerCase()

    return scopedRequestList.filter((item) => {
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
  }, [levelFilter, scopedRequestList, searchText, statusFilter])

  const pageSummary = useMemo(() => {
    const totalCount = scopedRequestList.length
    const pendingApprovalCount = scopedRequestList.filter(
      (item) => item.status === 'pendingApproval'
    ).length
    const approvedCount = scopedRequestList.filter(
      (item) => item.status === 'approved'
    ).length
    const rejectedCount = scopedRequestList.filter(
      (item) => item.status === 'rejected'
    ).length

    return {
      totalCount,
      pendingApprovalCount,
      approvedCount,
      rejectedCount,
    }
  }, [scopedRequestList])

  const handleViewDetail = (item) => {
    const navigationState = {
      requestData: item,
      viewerRole: 'dean',
    }

    if (item.level === 'bachelor') {
      navigate('/courseOpeningBachelor', { state: navigationState })
      return
    }

    if (item.level === 'master') {
      navigate('/courseOpeningMaster', { state: navigationState })
      return
    }

    if (item.level === 'doctoral') {
      navigate('/courseOpeningDoctoral', { state: navigationState })
    }
  }

  const handleApproveRequest = (requestId) => {
    const confirmed = window.confirm('ต้องการอนุมัติคำขอเปิดรายวิชารายการนี้ใช่หรือไม่')
    if (!confirmed) {
      return
    }

    setRequestList((prev) =>
      prev.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: 'approved',
              rejectedReason: '',
              reviewedAt: new Date().toISOString(),
              documentData: {
                ...item.documentData,
                approvalForm: {
                  ...item.documentData.approvalForm,
                  deanDate: getTodayDateForInput(),
                },
              },
            }
          : item
      )
    )
  }

  const handleOpenRejectDialog = (item) => {
    setRejectDialog({
      isOpen: true,
      requestId: item.id,
      requestTitle: `${item.documentData.generalForm.curriculumName} - ${item.documentData.generalForm.majorName}`,
      note: '',
    })
  }

  const handleCloseRejectDialog = () => {
    setRejectDialog({
      isOpen: false,
      requestId: '',
      requestTitle: '',
      note: '',
    })
  }

  const handleConfirmRejectRequest = () => {
    const trimmedNote = rejectDialog.note.trim()

    if (!trimmedNote) {
      window.alert('กรุณาระบุหมายเหตุสำหรับการไม่อนุมัติ')
      return
    }

    setRequestList((prev) =>
      prev.map((item) =>
        item.id === rejectDialog.requestId
          ? {
              ...item,
              status: 'rejected',
              rejectedReason: trimmedNote,
              reviewedAt: new Date().toISOString(),
              documentData: {
                ...item.documentData,
                approvalForm: {
                  ...item.documentData.approvalForm,
                  deanDate: getTodayDateForInput(),
                },
              },
            }
          : item
      )
    )

    handleCloseRejectDialog()
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
              ตรวจสอบเอกสารการเปิดรายวิชา
            </Typography>

            <Typography className={styles.pageDescription}>
              หน้านี้เป็นรายการคำขอเปิดรายวิชาของคณบดี ใช้สำหรับตรวจสอบเอกสารที่หัวหน้าสาขาส่งเข้ามา ดูรายละเอียดเอกสาร และตัดสินใจอนุมัติหรือไม่อนุมัติได้จากหน้านี้
            </Typography>
          </Box>

          {selectedMajor && (
            <Box className={styles.selectedMajorBox}>
              <Typography className={styles.selectedMajorLabel}>
                สาขาที่กำลังตรวจสอบ
              </Typography>
              <Typography className={styles.selectedMajorValue}>
                {selectedMajor.majorNameTh}
              </Typography>
              <Typography className={styles.selectedMajorSubValue}>
                รหัสสาขา {selectedMajor.majorCode}
              </Typography>
            </Box>
          )}
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
              <Typography className={styles.summaryLabel}>
                รอพิจารณา
              </Typography>
              <Typography className={styles.summaryValue}>
                {pageSummary.pendingApprovalCount}
              </Typography>
            </Box>
          </Box>

          <Box className={styles.summaryCard}>
            <Box className={styles.summaryIconGreen}>
              <CheckCircleRoundedIcon />
            </Box>
            <Box>
              <Typography className={styles.summaryLabel}>
                อนุมัติแล้ว
              </Typography>
              <Typography className={styles.summaryValue}>
                {pageSummary.approvedCount}
              </Typography>
            </Box>
          </Box>

          <Box className={styles.summaryCard}>
            <Box className={styles.summaryIconRed}>
              <CancelRoundedIcon />
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
                สามารถกรองตามระดับการศึกษา สถานะ และค้นหาจากรหัสคำขอ ชื่อหลักสูตร หรือชื่อสาขาได้
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
                label="สถานะการพิจารณา"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value="all">ทั้งหมด</MenuItem>
                <MenuItem value="pendingApproval">รอคณบดีพิจารณา</MenuItem>
                <MenuItem value="approved">อนุมัติแล้ว</MenuItem>
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
                คณบดีสามารถกดดูรายละเอียดเอกสาร และเลือกอนุมัติหรือไม่อนุมัติได้จากรายการด้านล่าง
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
                          ดูหมายเหตุ
                        </Button>
                      )}

                      {item.status === 'pendingApproval' && (
                        <>
                          <Button
                            variant="contained"
                            startIcon={<CheckCircleRoundedIcon />}
                            className={styles.approveButton}
                            onClick={() => handleApproveRequest(item.id)}
                          >
                            อนุมัติ
                          </Button>

                          <Button
                            variant="outlined"
                            startIcon={<CancelRoundedIcon />}
                            color="error"
                            className={styles.rejectButton}
                            onClick={() => handleOpenRejectDialog(item)}
                          >
                            ไม่อนุมัติ
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>

                  <Box className={styles.metaGrid}>
                    <Box className={styles.metaCard}>
                      <Typography className={styles.metaLabel}>
                        ภาคการศึกษา
                      </Typography>
                      <Typography className={styles.metaValue}>
                        {item.documentData.generalForm.semester}
                      </Typography>
                    </Box>

                    <Box className={styles.metaCard}>
                      <Typography className={styles.metaLabel}>
                        ปีการศึกษา
                      </Typography>
                      <Typography className={styles.metaValue}>
                        {item.documentData.generalForm.academicYear}
                      </Typography>
                    </Box>

                    <Box className={styles.metaCard}>
                      <Typography className={styles.metaLabel}>
                        วันที่ส่ง
                      </Typography>
                      <Typography className={styles.metaValue}>
                        {formatThaiDateTime(item.submittedAt)}
                      </Typography>
                    </Box>

                    <Box className={styles.metaCard}>
                      <Typography className={styles.metaLabel}>
                        วันที่พิจารณา
                      </Typography>
                      <Typography className={styles.metaValue}>
                        {formatThaiDateTime(item.reviewedAt)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box className={styles.requestFooter}>
                    <Typography className={styles.footerText}>
                      {item.status === 'pendingApproval' &&
                        'เอกสารรายการนี้ถูกส่งเข้ามาแล้วและกำลังรอคณบดีพิจารณา'}
                      {item.status === 'approved' &&
                        'เอกสารรายการนี้ได้รับการอนุมัติแล้ว และสามารถนำไปใช้ในขั้นตอนถัดไปของระบบได้'}
                      {item.status === 'rejected' &&
                        'เอกสารรายการนี้ไม่อนุมัติ โดยสามารถกดดูหมายเหตุเพื่ออ่านเหตุผลประกอบการพิจารณาได้'}
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
        open={rejectDialog.isOpen}
        onClose={handleCloseRejectDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>ไม่อนุมัติการเปิดรายวิชา</DialogTitle>

        <DialogContent dividers>
          <Typography className={styles.dialogTitleText}>
            {rejectDialog.requestTitle}
          </Typography>

          <Typography className={styles.dialogSubText}>
            รหัสคำขอ {rejectDialog.requestId}
          </Typography>

          <TextField
            fullWidth
            multiline
            minRows={4}
            label="หมายเหตุ"
            placeholder="กรุณาระบุเหตุผลหรือข้อเสนอแนะสำหรับการไม่อนุมัติ"
            value={rejectDialog.note}
            onChange={(event) =>
              setRejectDialog((prev) => ({
                ...prev,
                note: event.target.value,
              }))
            }
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseRejectDialog}>ยกเลิก</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmRejectRequest}
          >
            ยืนยันไม่อนุมัติ
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={reasonDialog.isOpen}
        onClose={handleCloseRejectedReason}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>หมายเหตุการไม่อนุมัติ</DialogTitle>

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

export default DeanCourseOpeningReviewListPage