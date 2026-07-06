import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import styles from './manageUsersPage.module.css'

const UNASSIGNED_DEPARTMENT_ID = 'unassigned'

const roleOptions = [
  { value: 'teacher', label: 'อาจารย์' },
  { value: 'headmajor', label: 'หัวหน้าสาขา' },
  { value: 'staff', label: 'เจ้าหน้าที่' },
  { value: 'dean', label: 'คณบดี' },
  { value: 'admin', label: 'ผู้ดูแลระบบ' },
  { value: '', label: 'ยังไม่ระบุตำแหน่ง' },
]

const emptyFormValue = {
  prefixname: '',
  firstName: '',
  lastName: '',
  email: '',
  role: 'teacher',
  departmentId: '',
}

const getRoleLabel = (role) => roleOptions.find((item) => item.value === role)?.label || role || 'ยังไม่ระบุตำแหน่ง'

const normalizeText = (value) => String(value ?? '').trim()
const getResponseList = (data, keys = []) => {
  if (Array.isArray(data)) return data

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
  }

  return []
}

const normalizeDepartment = (department) => ({
  id: department.id ?? department.department_id ?? department.departmentId,
  departmentName: department.department_name || department.departmentName || department.name || '-',
  facultyName: department.faculty_name || department.facultyName || department.faculty?.faculty_name || department.faculty?.facultyName || '',
})

const normalizeUser = (user) => ({
  id: user.id,
  prefixname: user.prefixname || user.prefix_name || user.prefixName || '',
  firstName: user.first_name || user.firstName || '',
  lastName: user.last_name || user.lastName || '',
  email: user.email || '',
  role: user.role || '',
  departmentId: user.department_id ?? user.departmentId ?? user.department?.id ?? null,
})

function ManageUsersPage() {
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL
  const [departmentList, setDepartmentList] = useState([])
  const [userList, setUserList] = useState([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(UNASSIGNED_DEPARTMENT_ID)
  const [departmentSearchKeyword, setDepartmentSearchKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSavingUser, setIsSavingUser] = useState(false)
  const [dialogMode, setDialogMode] = useState('create')
  const [editingUserId, setEditingUserId] = useState(null)
  const [formValue, setFormValue] = useState(emptyFormValue)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ open: false, userId: null, userName: '' })

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem('mqa_token')
      if (!token) {
        navigate('/', { replace: true })
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage('')

        const config = { headers: { Authorization: `Bearer ${token}` } }
        const [departmentResponse, userResponse] = await Promise.all([
          axios.get(`${apiUrl}/departments/`, config),
          axios.get(`${apiUrl}/users/`, config),
        ])

        const nextDepartmentList = getResponseList(departmentResponse.data, ['departments', 'items', 'data', 'results'])
          .map(normalizeDepartment)
          .filter((department) => department.id)

        const nextUserList = getResponseList(userResponse.data, ['users', 'items', 'data', 'results'])
          .map(normalizeUser)
          .filter((user) => user.id)

        setDepartmentList(nextDepartmentList)
        setUserList(nextUserList)
        setSelectedDepartmentId(nextDepartmentList[0]?.id || UNASSIGNED_DEPARTMENT_ID)
      } catch (error) {
        console.error('Error fetching user management data:', error)

        if (error.response?.status === 401) {
          localStorage.removeItem('mqa_token')
          localStorage.removeItem('user_role')
          navigate('/', { replace: true })
          return
        }

        setErrorMessage(error.response?.data?.detail || 'ไม่สามารถดึงข้อมูลสาขาและผู้ใช้งานจาก API ได้')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [apiUrl, navigate])

  const departmentCardList = useMemo(() => {
    const normalDepartmentCards = departmentList.map((department) => {
      const userCount = userList.filter((user) => String(user.departmentId || '') === String(department.id)).length
      return { ...department, id: department.id, userCount, isUnassigned: false }
    })

    const unassignedCount = userList.filter((user) => !user.departmentId).length
    return [
      ...normalDepartmentCards,
      {
        id: UNASSIGNED_DEPARTMENT_ID,
        departmentName: 'รอจัดสังกัด',
        facultyName: 'รายชื่อที่ยังไม่ได้ระบุสาขา',
        userCount: unassignedCount,
        isUnassigned: true,
      },
    ]
  }, [departmentList, userList])

  const selectedDepartment = useMemo(() => {
    return departmentCardList.find((department) => String(department.id) === String(selectedDepartmentId)) || departmentCardList[0]
  }, [departmentCardList, selectedDepartmentId])

  const filteredDepartmentCardList = useMemo(() => {
    const normalizedKeyword = departmentSearchKeyword.trim().toLowerCase()
    if (!normalizedKeyword) return departmentCardList

    return departmentCardList.filter((department) => {
      const searchSource = `${department.departmentName} ${department.facultyName}`.toLowerCase()
      return searchSource.includes(normalizedKeyword)
    })
  }, [departmentCardList, departmentSearchKeyword])

  const visibleUserList = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase()
    const isUnassignedSelected = String(selectedDepartmentId) === UNASSIGNED_DEPARTMENT_ID

    return userList.filter((user) => {
      const matchedDepartment = isUnassignedSelected ? !user.departmentId : String(user.departmentId || '') === String(selectedDepartmentId)
      const matchedRole = roleFilter === 'all' ? true : roleFilter === 'empty' ? !user.role : user.role === roleFilter
      const searchSource = `${user.prefixname} ${user.firstName} ${user.lastName} ${user.email} ${getRoleLabel(user.role)}`.toLowerCase()
      const matchedSearch = !normalizedKeyword || searchSource.includes(normalizedKeyword)
      return matchedDepartment && matchedRole && matchedSearch
    })
  }, [roleFilter, searchKeyword, selectedDepartmentId, userList])

  const pageSummary = useMemo(() => {
    const unassignedCount = userList.filter((user) => !user.departmentId).length
    return {
      departmentCount: departmentList.length,
      userCount: userList.length,
      unassignedCount,
    }
  }, [departmentList.length, userList])

  const handleChangeFormField = (fieldName, value) => {
    setFormValue((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleOpenCreateDialog = () => {
    setDialogMode('create')
    setEditingUserId(null)
    setFormValue({
      ...emptyFormValue,
      departmentId: selectedDepartmentId === UNASSIGNED_DEPARTMENT_ID ? '' : String(selectedDepartmentId || ''),
    })
    setIsUserDialogOpen(true)
  }

  const handleOpenEditDialog = (user) => {
    setDialogMode('edit')
    setEditingUserId(user.id)
    setFormValue({
      prefixname: user.prefixname || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || '',
      departmentId: user.departmentId ? String(user.departmentId) : '',
    })
    setIsUserDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsUserDialogOpen(false)
    setEditingUserId(null)
    setFormValue(emptyFormValue)
  }

  const handleOpenDeleteConfirmDialog = () => {
    const targetUser = userList.find((user) => user.id === editingUserId)
    if (!targetUser) return

    setDeleteConfirmDialog({
      open: true,
      userId: targetUser.id,
      userName: `${targetUser.prefixname || ''} ${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim(),
    })
  }

  const handleCloseDeleteConfirmDialog = () => {
    setDeleteConfirmDialog({ open: false, userId: null, userName: '' })
  }

  const handleConfirmDeleteUser = () => {
    if (!deleteConfirmDialog.userId) return

    setUserList((prev) => prev.filter((user) => user.id !== deleteConfirmDialog.userId))
    handleCloseDeleteConfirmDialog()
    handleCloseDialog()
  }

  const getAuthConfig = () => {
    const token = localStorage.getItem('mqa_token')
    return { headers: { Authorization: `Bearer ${token}` } }
  }

  const handleUnauthorized = (error) => {
    if (error.response?.status !== 401) return false

    localStorage.removeItem('mqa_token')
    localStorage.removeItem('user_role')
    navigate('/', { replace: true })
    return true
  }

  const handleSaveUser = async () => {
    const nextUser = {
      prefixname: normalizeText(formValue.prefixname),
      firstName: normalizeText(formValue.firstName),
      lastName: normalizeText(formValue.lastName),
      email: normalizeText(formValue.email),
      role: formValue.role,
      departmentId: formValue.departmentId ? Number(formValue.departmentId) : null,
    }

    if (!nextUser.firstName || !nextUser.lastName) {
      window.alert('กรุณากรอกชื่อและนามสกุล')
      return
    }

    if (!nextUser.email) {
      window.alert('กรุณากรอกอีเมล')
      return
    }

    if (dialogMode === 'edit') {
      const currentUser = userList.find((user) => user.id === editingUserId)
      if (!currentUser) return

      if (!nextUser.departmentId) {
        window.alert('API แก้ไขสาขาตอนนี้ยังต้องส่ง department_id เป็นตัวเลข จึงยังไม่สามารถย้ายผู้ใช้ไปไว้กลุ่มรอจัดสังกัดได้')
        return
      }

      try {
        setIsSavingUser(true)

        const config = getAuthConfig()
        const userEndpoint = `${apiUrl}/users/users/${editingUserId}`
        const updateRequests = [
          axios.patch(`${userEndpoint}/info`, {
            prefixname: nextUser.prefixname || null,
            first_name: nextUser.firstName,
            last_name: nextUser.lastName,
            email: nextUser.email,
          }, config),
        ]

        if (String(currentUser.departmentId || '') !== String(nextUser.departmentId || '')) {
          updateRequests.push(axios.patch(`${userEndpoint}/department`, { department_id: nextUser.departmentId }, config))
        }

        if (String(currentUser.role || '') !== String(nextUser.role || '')) {
          updateRequests.push(axios.patch(`${userEndpoint}/role`, { role: nextUser.role }, config))
        }

        await Promise.all(updateRequests)

        setUserList((prev) => prev.map((user) => user.id === editingUserId ? { ...user, ...nextUser } : user))
        if (nextUser.departmentId) setSelectedDepartmentId(nextUser.departmentId)
        else setSelectedDepartmentId(UNASSIGNED_DEPARTMENT_ID)
        window.alert('อัปเดตข้อมูลผู้ใช้สำเร็จ')
        handleCloseDialog()
      } catch (error) {
        console.error('Error updating user:', error)
        if (handleUnauthorized(error)) return
        window.alert(error.response?.data?.detail || 'ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้')
      } finally {
        setIsSavingUser(false)
      }

      return
    } else {
      setUserList((prev) => [{ id: Date.now(), ...nextUser }, ...prev])
      if (nextUser.departmentId) setSelectedDepartmentId(nextUser.departmentId)
      else setSelectedDepartmentId(UNASSIGNED_DEPARTMENT_ID)
    }

    handleCloseDialog()
  }

  const getDepartmentName = (departmentId) => {
    if (!departmentId) return 'รอจัดสังกัด'
    return departmentList.find((department) => Number(department.id) === Number(departmentId))?.departmentName || '-'
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.backgroundGlowTop} />
      <Box className={styles.backgroundGlowBottom} />

      <Box className={styles.container}>
        <Box className={styles.pageHeader}>
          <Box>
            <Typography className={styles.pageTitle}>จัดการผู้ใช้งาน</Typography>
            <Typography className={styles.pageDescription}>เลือกสาขาเพื่อดูรายชื่อผู้ใช้งาน แก้ไขข้อมูลพื้นฐาน ย้ายสังกัด หรือเพิ่มผู้ใช้ใหม่ในระบบ</Typography>
          </Box>

          <Button variant="contained" startIcon={<AddRoundedIcon />} className={styles.addButton} onClick={handleOpenCreateDialog}>
            เพิ่มผู้ใช้
          </Button>
        </Box>

        <Box className={styles.summaryGrid}>
          <Box className={styles.summaryCard}>
            <GroupsRoundedIcon className={styles.summaryIcon} />
            <Box>
              <Typography className={styles.summaryLabel}>สาขาทั้งหมด</Typography>
              <Typography className={styles.summaryValue}>{pageSummary.departmentCount}</Typography>
            </Box>
          </Box>

          <Box className={styles.summaryCard}>
            <BadgeRoundedIcon className={styles.summaryIcon} />
            <Box>
              <Typography className={styles.summaryLabel}>ผู้ใช้ทั้งหมด</Typography>
              <Typography className={styles.summaryValue}>{pageSummary.userCount}</Typography>
            </Box>
          </Box>

          <Box className={styles.summaryCard}>
            <PersonSearchRoundedIcon className={styles.summaryIcon} />
            <Box>
              <Typography className={styles.summaryLabel}>รอจัดสังกัด</Typography>
              <Typography className={styles.summaryValue}>{pageSummary.unassignedCount}</Typography>
            </Box>
          </Box>
        </Box>

        <Box className={styles.contentGrid}>
          <Box className={styles.departmentPanel}>
            <Box className={styles.panelHeader}>
              <Typography className={styles.panelTitle}>เลือกสาขา</Typography>
              <Typography className={styles.panelDescription}>ดึงข้อมูลสาขาจาก API /departments/ และจัดกลุ่มรายชื่อจาก API /users/</Typography>
            </Box>

            <TextField
              fullWidth
              placeholder="ค้นหาชื่อสาขา..."
              value={departmentSearchKeyword}
              onChange={(event) => setDepartmentSearchKeyword(event.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon className={styles.searchIcon} /></InputAdornment> }}
            />

            <Box className={styles.departmentList}>
              {filteredDepartmentCardList.map((department) => {
                const isSelected = String(selectedDepartmentId) === String(department.id)
                return (
                  <Box key={department.id} className={`${styles.departmentCard} ${isSelected ? styles.departmentCardActive : ''} ${department.isUnassigned ? styles.unassignedCard : ''}`} onClick={() => setSelectedDepartmentId(department.id)} role="button" tabIndex={0} onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') setSelectedDepartmentId(department.id)
                  }}>
                    <Box>
                      <Typography className={styles.departmentName}>{department.departmentName}</Typography>
                      <Typography className={styles.departmentMeta}>{department.facultyName}</Typography>
                    </Box>

                    <Chip label={`${department.userCount} คน`} className={isSelected ? styles.departmentChipActive : styles.departmentChip} />
                  </Box>
                )
              })}

              {filteredDepartmentCardList.length === 0 && (
                <Box className={styles.emptyDepartmentState}>
                  <Typography className={styles.emptyStateTitle}>ไม่พบสาขาที่ค้นหา</Typography>
                  <Typography className={styles.emptyStateDescription}>ลองเปลี่ยนคำค้นหาแล้วค้นหาใหม่อีกครั้ง</Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Box className={styles.userPanel}>
            <Box className={styles.userPanelHeader}>
              <Box>
                <Typography className={styles.panelTitle}>{selectedDepartment?.departmentName || 'รายชื่อผู้ใช้งาน'}</Typography>
                <Typography className={styles.panelDescription}>แสดงรายชื่อ อีเมล ตำแหน่ง และสาขาปัจจุบันของผู้ใช้</Typography>
              </Box>

              <Chip label={`พบ ${visibleUserList.length} คน`} className={styles.resultChip} />
            </Box>

            <Box className={styles.filterGrid}>
              <TextField fullWidth placeholder="ค้นหาชื่อ อีเมล หรือตำแหน่ง..." value={searchKeyword} onChange={(event) => setSearchKeyword(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon className={styles.searchIcon} /></InputAdornment> }} />

              <TextField select fullWidth label="ตำแหน่ง" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <MenuItem value="all">ทั้งหมด</MenuItem>
                {roleOptions.map((role) => (
                  <MenuItem key={role.value || 'empty'} value={role.value || 'empty'}>{role.label}</MenuItem>
                ))}
              </TextField>
            </Box>

            <TableContainer className={styles.tableContainer}>
              {isLoading && (
                <Box className={styles.emptyTableCell}>
                  <CircularProgress size={32} />
                  <Typography className={styles.emptyStateDescription}>กำลังดึงข้อมูลสาขาและผู้ใช้งาน...</Typography>
                </Box>
              )}

              {!isLoading && errorMessage && (
                <Box className={styles.emptyTableCell}>
                  <Typography className={styles.emptyStateTitle}>ดึงข้อมูลไม่สำเร็จ</Typography>
                  <Typography className={styles.emptyStateDescription}>{errorMessage}</Typography>
                </Box>
              )}

              {!isLoading && !errorMessage && (
              <Table className={styles.table}>
                <TableHead>
                  <TableRow className={styles.tableHeadRow}>
                    <TableCell className={styles.headCell}>ชื่อผู้ใช้งาน</TableCell>
                    <TableCell className={styles.headCell}>อีเมล</TableCell>
                    <TableCell className={styles.headCell}>ตำแหน่ง</TableCell>
                    <TableCell className={styles.headCell}>สาขา</TableCell>
                    <TableCell className={styles.headCell}>จัดการ</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {visibleUserList.map((user) => (
                    <TableRow key={user.id} className={styles.tableBodyRow}>
                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.userNameCell}>
                          <Box className={styles.avatarCircle}>{(user.firstName || 'ผ').charAt(0)}</Box>
                          <Box>
                            <Typography className={styles.userName}>{`${user.prefixname || ''} ${user.firstName} ${user.lastName}`.trim()}</Typography>
                            <Typography className={styles.userSubText}>รหัสผู้ใช้ #{user.id}</Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Box className={styles.emailCell}>
                          <MailOutlineRoundedIcon fontSize="small" />
                          <Typography className={user.email ? styles.emailText : styles.emptyEmailText}>{user.email || 'ยังไม่ได้ระบุอีเมล'}</Typography>
                        </Box>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Chip label={getRoleLabel(user.role)} className={user.role ? styles.roleChip : styles.emptyRoleChip} />
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Typography className={user.departmentId ? styles.departmentText : styles.unassignedText}>{getDepartmentName(user.departmentId)}</Typography>
                      </TableCell>

                      <TableCell className={styles.bodyCell}>
                        <Button variant="outlined" startIcon={<EditRoundedIcon />} className={styles.editButton} onClick={() => handleOpenEditDialog(user)}>
                          แก้ไข
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {visibleUserList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className={styles.emptyTableCell}>
                        <Typography className={styles.emptyStateTitle}>ไม่พบรายชื่อผู้ใช้งาน</Typography>
                        <Typography className={styles.emptyStateDescription}>ลองเปลี่ยนคำค้นหา หรือตรวจสอบตัวกรองตำแหน่งอีกครั้ง</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              )}
            </TableContainer>
          </Box>
        </Box>
      </Box>

      <Dialog open={isUserDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="md" PaperProps={{ className: styles.dialogPaper }}>
        <DialogTitle className={styles.dialogTitle}>{dialogMode === 'edit' ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</DialogTitle>

        <DialogContent className={styles.dialogContent}>
          <Box className={styles.formGrid}>
            <TextField label="คำนำหน้า" value={formValue.prefixname} onChange={(event) => handleChangeFormField('prefixname', event.target.value)} fullWidth placeholder="เช่น อ., ผศ., ดร." />
            <TextField label="ชื่อ" value={formValue.firstName} onChange={(event) => handleChangeFormField('firstName', event.target.value)} fullWidth />
            <TextField label="นามสกุล" value={formValue.lastName} onChange={(event) => handleChangeFormField('lastName', event.target.value)} fullWidth />
            <TextField label="อีเมล" value={formValue.email} onChange={(event) => handleChangeFormField('email', event.target.value)} fullWidth />

            <TextField select label="ตำแหน่ง" value={formValue.role} onChange={(event) => handleChangeFormField('role', event.target.value)} fullWidth>
              {roleOptions.map((role) => (
                <MenuItem key={role.value || 'empty'} value={role.value}>{role.label}</MenuItem>
              ))}
            </TextField>

            <TextField select label="สาขา" value={formValue.departmentId} onChange={(event) => handleChangeFormField('departmentId', event.target.value)} fullWidth>
              <MenuItem value="">รอจัดสังกัด</MenuItem>
              {departmentList.map((department) => (
                <MenuItem key={department.id} value={String(department.id)}>{department.departmentName}</MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions className={styles.dialogActions}>
          {dialogMode === 'edit' && (
            <Button variant="outlined" color="error" startIcon={<DeleteOutlineRoundedIcon />} className={styles.deleteButton} onClick={handleOpenDeleteConfirmDialog}>
              ลบผู้ใช้
            </Button>
          )}

          <Box className={styles.dialogActionSpacer} />
          <Button onClick={handleCloseDialog} disabled={isSavingUser}>ยกเลิก</Button>
          <Button variant="contained" className={styles.saveButton} onClick={handleSaveUser} disabled={isSavingUser}>
            {isSavingUser ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmDialog.open} onClose={handleCloseDeleteConfirmDialog} fullWidth maxWidth="xs" PaperProps={{ className: styles.confirmDialogPaper }}>
        <DialogTitle className={styles.dialogTitle}>ยืนยันการลบผู้ใช้</DialogTitle>
        <DialogContent>
          <Typography className={styles.confirmDescription}>
            ต้องการลบผู้ใช้ "{deleteConfirmDialog.userName || 'รายชื่อนี้'}" ใช่หรือไม่ หลังจากยืนยัน รายชื่อนี้จะถูกนำออกจากรายการบนหน้าจอนี้ทันที
          </Typography>
        </DialogContent>
        <DialogActions className={styles.dialogActions}>
          <Button onClick={handleCloseDeleteConfirmDialog}>ยกเลิก</Button>
          <Button variant="contained" color="error" className={styles.confirmDeleteButton} onClick={handleConfirmDeleteUser}>ยืนยันการลบ</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ManageUsersPage
