import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import MainNavbar from '../mainNavbar/mainNavbar'
import styles from './appLayout.module.css'

function AppLayout() {
  return (
    <Box className={styles.layout}>
      <Box className={styles.navbarSection}>
        <Box className={styles.navbarInner}>
          <MainNavbar
            userName="ธนชัย บัวรุ่ง"
            userRole="อาจารย์"
            facultyName="คณะบริหารธุรกิจและเทคโนโลยีสารสนเทศ"
          />
        </Box>
      </Box>

      <Box className={styles.pageContent}>
        <Outlet />
      </Box>
    </Box>
  )
}

export default AppLayout