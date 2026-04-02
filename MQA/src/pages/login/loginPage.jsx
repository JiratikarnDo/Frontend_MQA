import { Box, Button, Card, CardContent, Divider, Typography } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import rmuttoLogo from '../../assets/images/rmuttoLogo.png'
import loginCover from '../../assets/images/loginCover.jpg'
import styles from './loginPage.module.css'

function LoginPage() {
  const handleGoogleLogin = () => {
    console.log('Google login clicked')
  }

  return (
    <Box className={styles.loginPage}>
      <Box className={styles.gridOverlay} />

      <Box className={styles.leftPanel}>
        <Box
          component="img"
          src={loginCover}
          alt="RMUTTO Campus"
          className={styles.coverImage}
        />

        <Box className={styles.imageOverlay} />
        <Box className={styles.imageGridOverlay} />
        <Box className={styles.topGlow} />
        <Box className={styles.bottomGlow} />

        <Box className={styles.leftContent}>
          <Box className={styles.badge}>
            <Typography className={styles.badgeText}>
              RMUTTO MQA PLATFORM
            </Typography>
          </Box>

          <Typography className={styles.leftTitle}>
            ระบบจัดการเอกสาร มคอ.
          </Typography>

          <Typography className={styles.leftDescription}>
            ระบบจัดการเอกสาร มคอ. สำหรับคณะบริหารธุรกิจและเทคโนโลยีสารสนเทศ
          </Typography>
        </Box>
      </Box>

      <Box className={styles.rightPanel}>
        <Box className={styles.rightTopGlow} />
        <Box className={styles.rightBottomGlow} />

        <Card className={styles.loginCard} elevation={0}>
          <Box className={styles.cardTopBar} />

          <CardContent className={styles.cardContent}>
            <Box
              component="img"
              src={rmuttoLogo}
              alt="RMUTTO Logo"
              className={styles.logo}
            />

            <Typography className={styles.loginTitle}>
              เข้าสู่ระบบ
            </Typography>

            <Typography className={styles.loginDescription}>
              กรุณาเข้าสู่ระบบด้วยบัญชี Google
              <br />
              เพื่อใช้งานระบบจัดการเอกสาร มคอ.
            </Typography>

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              className={styles.googleButton}
            >
              เข้าสู่ระบบด้วย Google
            </Button>

            <Divider className={styles.divider} />

            <Typography className={styles.footerText}>
              สำหรับอาจารย์ หัวหน้าสาขา เจ้าหน้าที่ คณบดี และผู้ดูแลระบบ
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default LoginPage