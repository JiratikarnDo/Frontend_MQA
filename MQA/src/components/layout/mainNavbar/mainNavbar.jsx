import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { NavLink, useLocation } from 'react-router-dom'
import rmuttoLogo from '../../../assets/images/rmuttoLogo.png'
import styles from './mainNavbar.module.css'

const courseOpeningItems = [
  {
    label: 'ระดับปริญญาตรี',
    path: '/courseOpeningBachelor',
  },
  {
    label: 'ระดับปริญญาโท',
    path: '/courseOpeningMaster',
  },
  {
    label: 'ระดับปริญญาเอก',
    path: '/courseOpeningDoctoral',
  },
]

function MainNavbar({
  userName = 'ธนชัย บัวรุ่ง',
  userRole = 'อาจารย์',
  facultyName = 'คณะบริหารธุรกิจและเทคโนโลยีสารสนเทศ',
}) {
  const location = useLocation()
  const dropdownRef = useRef(null)
  const [isCourseOpeningOpen, setIsCourseOpeningOpen] = useState(false)

  const isCourseOpeningActive = useMemo(() => {
    return courseOpeningItems.some((item) => item.path === location.pathname)
  }, [location.pathname])

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) return

      if (!dropdownRef.current.contains(event.target)) {
        setIsCourseOpeningOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleToggleCourseOpening = () => {
    setIsCourseOpeningOpen((prev) => !prev)
  }

  const handleCloseCourseOpening = () => {
    setIsCourseOpeningOpen(false)
  }

  return (
    <Box
      component="header"
      className={`${styles.navbar} ${isCourseOpeningOpen ? styles.navbarDropdownOpen : ''}`}
    >
      <Box className={styles.leftSection}>
        <Box className={styles.logoBox}>
          <img
            src={rmuttoLogo}
            alt="RMUTTO Logo"
            className={styles.logo}
          />
        </Box>

        <Box className={styles.identityBlock}>
          <Typography className={styles.systemTitle}>
            ระบบบริหารจัดการเอกสาร มคอ.
          </Typography>

          <Typography className={styles.systemSubtitle}>
            {facultyName}
          </Typography>
        </Box>
      </Box>

      <Box className={styles.rightSection}>
        <Typography className={styles.userName}>
          {userName}
        </Typography>

        <Typography className={styles.userRole}>
          {userRole}
        </Typography>
      </Box>

      <Box className={styles.centerSection}>
        <NavLink
          to="/selectDegree"
          className={({ isActive }) =>
            `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`
          }
        >
          จัดการหลักสูตร
        </NavLink>

        <NavLink
          to="/manageMajor"
          className={({ isActive }) =>
            `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`
          }
        >
          จัดการสาขา
        </NavLink>

        <NavLink
          to="/manageDeadline"
          className={({ isActive }) =>
            `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`
          }
        >
          จัดการกำหนดส่ง
        </NavLink>

        <NavLink
          to="/manageSubPlo"
          className={({ isActive }) =>
            `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`
          }
        >
          จัดการ Sub-PLO ของหลักสูตร
        </NavLink>
        <NavLink
          to="/mqaOverview"
          className={({ isActive }) =>
            `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`
          }
        >
          หน้าแรก
        </NavLink>

        <NavLink
          to="/deanMajorSelect"
          className={({ isActive }) =>
            `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`
          }
        >
          พิจารณาการเปิดรายวิชา
        </NavLink>
        <NavLink
          to="/myAssignedCourses"
          className={({ isActive }) =>
            `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`
          }
        >
          กรอกเอกสาร มคอ.
        </NavLink>
        <NavLink
          to="/courseManagement"
          className={({ isActive }) =>
            `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`
          }
        >
          จัดการรายวิชา
        </NavLink>
        <NavLink
          to="/courseOpeningRequestList"
          className={({ isActive }) =>
            `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`
          }
        >
          ดูรายละเอียดการเปิดรายวิชา
        </NavLink>

        <Box className={styles.dropdownWrapper} ref={dropdownRef}>
          <button
            type="button"
            className={`${styles.navButton} ${styles.dropdownTrigger} ${
              isCourseOpeningActive || isCourseOpeningOpen ? styles.navButtonActive : ''
            }`}
            onClick={handleToggleCourseOpening}
          >
            <span>ยื่นเปิดรายวิชา</span>
            <span
              className={`${styles.triggerArrow} ${
                isCourseOpeningOpen ? styles.triggerArrowOpen : ''
              }`}
            >
              ▾
            </span>
          </button>

          {isCourseOpeningOpen && (
            <Box className={styles.dropdownMenu}>
              <Typography className={styles.dropdownTitle}>
                ยื่นเปิดรายวิชา
              </Typography>

              <Box className={styles.dropdownList}>
                {courseOpeningItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleCloseCourseOpening}
                    className={({ isActive }) =>
                      `${styles.dropdownItem} ${isActive ? styles.dropdownItemActive : ''}`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default MainNavbar