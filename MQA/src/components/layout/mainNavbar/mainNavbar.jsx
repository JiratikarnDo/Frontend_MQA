import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import rmuttoLogo from '../../../assets/images/rmuttoLogo.png'
import styles from './mainNavbar.module.css'

const courseOpeningItems = [
  { label: 'ระดับปริญญาตรี', path: '/courseOpeningBachelor' },
  { label: 'ระดับปริญญาโท', path: '/courseOpeningMaster' },
  { label: 'ระดับปริญญาเอก', path: '/courseOpeningDoctoral' },
]

const roleLabelMap = { admin: 'ผู้ดูแลระบบ', staff: 'เจ้าหน้าที่', officer: 'เจ้าหน้าที่', headMajor: 'หัวหน้าสาขา', teacher: 'อาจารย์', dean: 'คณบดี' }

function MainNavbar({ facultyName = 'คณะบริหารธุรกิจและเทคโนโลยีสารสนเทศ' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const apiUrl = import.meta.env.VITE_API_URL
  const [isCourseOpeningOpen, setIsCourseOpeningOpen] = useState(false)
  const [userProfile, setUserProfile] = useState({ name: 'กำลังโหลด...', role: '', roleKey: '' })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('mqa_token')
        if (!token) return

        const response = await axios.get(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        const roleKey = response.data.role || ''
        const firstName = response.data.first_name || ''
        const lastName = response.data.last_name || ''

        setUserProfile({ name: `${firstName} ${lastName}`.trim(), role: roleLabelMap[roleKey] || roleKey, roleKey })
      } catch (error) {
        console.error('Error fetching profile:', error)
        setUserProfile({ name: 'ไม่พบข้อมูล', role: '', roleKey: '' })
      }
    }

    fetchProfile()
  }, [apiUrl])

  const isAdmin = userProfile.roleKey === 'admin'
  const isStaff = userProfile.roleKey === 'staff' || userProfile.roleKey === 'officer'
  const isHeadMajor = userProfile.roleKey === 'headMajor'
  const isTeacher = userProfile.roleKey === 'teacher'
  const isDean = userProfile.roleKey === 'dean'
  const canViewCourseOpening = isAdmin || isHeadMajor

  useEffect(() => {
    if (isStaff && location.pathname === '/mqaOverview') navigate('/selectDegree', { replace: true })
    if (isDean && location.pathname === '/mqaOverview') navigate('/deanMajorSelect', { replace: true })
  }, [isStaff, isDean, location.pathname, navigate])

  const isCourseOpeningActive = useMemo(() => courseOpeningItems.some((item) => item.path === location.pathname), [location.pathname])

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) return
      if (!dropdownRef.current.contains(event.target)) setIsCourseOpeningOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleCourseOpening = () => setIsCourseOpeningOpen((prev) => !prev)
  const handleCloseCourseOpening = () => setIsCourseOpeningOpen(false)

  return (
    <Box component="header" className={`${styles.navbar} ${isCourseOpeningOpen && canViewCourseOpening ? styles.navbarDropdownOpen : ''}`}>
      <Box className={styles.leftSection}>
        <Box className={styles.logoBox}>
          <img src={rmuttoLogo} alt="RMUTTO Logo" className={styles.logo} />
        </Box>

        <Box className={styles.identityBlock}>
          <Typography className={styles.systemTitle}>ระบบบริหารจัดการเอกสาร มคอ.</Typography>
          <Typography className={styles.systemSubtitle}>{facultyName}</Typography>
        </Box>
      </Box>

      <Box className={styles.rightSection}>
        <Typography className={styles.userName}>{userProfile.name}</Typography>
        <Typography className={styles.userRole}>{userProfile.role}</Typography>
      </Box>

      <Box className={styles.centerSection}>
        {(isAdmin || isStaff) && <NavLink to="/selectDegree" className={({ isActive }) => `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}>จัดการหลักสูตร</NavLink>}
        {(isAdmin || isStaff) && <NavLink to="/manageMajor" className={({ isActive }) => `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}>จัดการสาขา</NavLink>}
        {(isAdmin || isStaff) && <NavLink to="/manageDeadline" className={({ isActive }) => `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}>จัดการกำหนดส่ง</NavLink>}
        {(isAdmin || isStaff) && <NavLink to="/manageSubPlo" className={({ isActive }) => `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}>จัดการ Sub-PLO</NavLink>}

        {(isAdmin || isHeadMajor || isTeacher) && <NavLink to="/mqaOverview" className={({ isActive }) => `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}>หน้าแรก</NavLink>}
        {(isAdmin || isDean) && <NavLink to="/deanMajorSelect" className={({ isActive }) => `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}>พิจารณาเปิดรายวิชา</NavLink>}
        {(isAdmin || isHeadMajor || isTeacher) && <NavLink to="/myAssignedCourses" className={({ isActive }) => `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}>กรอกเอกสาร มคอ.</NavLink>}
        {(isAdmin || isHeadMajor) && <NavLink to="/courseManagement" className={({ isActive }) => `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}>จัดการรายวิชา</NavLink>}
        {(isAdmin || isHeadMajor) && <NavLink to="/courseOpeningRequestList" className={({ isActive }) => `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}>รายละเอียดเปิดรายวิชา</NavLink>}

        {canViewCourseOpening && (
          <Box className={styles.dropdownWrapper} ref={dropdownRef}>
            <button type="button" className={`${styles.navButton} ${styles.dropdownTrigger} ${isCourseOpeningActive || isCourseOpeningOpen ? styles.navButtonActive : ''}`} onClick={handleToggleCourseOpening}>
              <span>ยื่นเปิดรายวิชา</span>
              <span className={`${styles.triggerArrow} ${isCourseOpeningOpen ? styles.triggerArrowOpen : ''}`}>▾</span>
            </button>

            {isCourseOpeningOpen && (
              <Box className={styles.dropdownMenu}>
                <Typography className={styles.dropdownTitle}>ยื่นเปิดรายวิชา</Typography>
                <Box className={styles.dropdownList}>
                  {courseOpeningItems.map((item) => (
                    <NavLink key={item.path} to={item.path} onClick={handleCloseCourseOpening} className={({ isActive }) => `${styles.dropdownItem} ${isActive ? styles.dropdownItemActive : ''}`}>{item.label}</NavLink>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default MainNavbar