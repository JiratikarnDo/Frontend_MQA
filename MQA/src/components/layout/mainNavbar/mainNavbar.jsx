import { Box, Typography } from '@mui/material'
import { NavLink } from 'react-router-dom'
import rmuttoLogo from '../../../assets/images/rmuttoLogo.png'
import styles from './mainNavbar.module.css'

function MainNavbar({
  userName = 'ธนชัย บัวรุ่ง',
  userRole = 'อาจารย์',
  facultyName = 'คณะบริหารธุรกิจและเทคโนโลยีสารสนเทศ',
}) {
  return (
    <Box component="header" className={styles.navbar}>
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
      </Box>

      <Box className={styles.rightSection}>
        <Typography className={styles.userName}>
          {userName}
        </Typography>

        <Typography className={styles.userRole}>
          {userRole}
        </Typography>
      </Box>
    </Box>
  )
}

export default MainNavbar