import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notify, setNotify] = useState({ open: false, message: '', severity: 'info' });

  const showNotify = (message, severity = 'info') => {
    setNotify({ open: true, message, severity });
  };

  const handleClose = () => setNotify({ ...notify, open: false });

  return (
    <NotificationContext.Provider value={{ showNotify }}>
      {children}
      <Snackbar 
        open={notify.open} 
        autoHideDuration={3000} 
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={notify.severity} variant="filled" sx={{ width: '100%' }}>
          {notify.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

// Hook สำหรับดึงไปใช้งานง่ายๆ
export const useNotify = () => useContext(NotificationContext);