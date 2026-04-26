import { Box, Button, Card, CardContent, Divider, Typography } from '@mui/material'
import axios from 'axios';
import GoogleIcon from '@mui/icons-material/Google'
import rmuttoLogo from '../../assets/images/rmuttoLogo.png'
import { GoogleLogin } from '@react-oauth/google';
import loginCover from '../../assets/images/loginCover.jpg'
import styles from './loginPage.module.css'
import { Snackbar, Alert } from '@mui/material'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../../context/NotificationContext';

function LoginPage() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const { showNotify } = useNotify();

  const handleBackendLogin = async (googleToken) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login/google`, {
      token: googleToken.credential
    });

    if (response.status === 200) {
      const { access_token, role, message } = response.data;

      localStorage.setItem('mqa_token', access_token);
      localStorage.setItem('user_role', role);

      showNotify(message || 'เข้าสู่ระบบสำเร็จ!', 'success');

      setTimeout(() => {
        if (role === 'admin') {
          navigate('/selectDegree');
        } else {
          navigate('/mqaOverview');
        }
      }, 1000); 
    }
  } catch (error) {
    console.error('Login Error:', error.response?.data || error.message);
    
    const errorMsg = error.response?.data?.detail || 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง';
    showNotify('เกิดข้อผิดพลาด: ' + errorMsg, 'error');
  }
};

  

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

            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <GoogleLogin
                onSuccess={handleBackendLogin}
                onError={() => console.log('Login Failed')}
                useOneTap
                shape="pill"
                theme="filled_blue"
                text="signin_with"
                width="320px"
              />
            </Box>

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