
import React from 'react';
import { ToastContainer, toast, ToastOptions, Bounce } from 'react-toastify';
import { Typography } from '@mui/material';

export const CustomToast = ({ message }: { message: string }) => (
  <div  style={{ color: 'green' }}>
    <Typography style={{ fontWeight: '700', color: 'rgba(86, 153, 27, 1)', fontFamily: 'Nunito', fontSize: '16px' }}>
      Success
    </Typography>
    <Typography variant="body2" sx={{ color: 'rgba(110, 193, 37, 1)', fontFamily: 'Nunito', fontWeight: '400', fontSize: '12px', }}>
      {message}
    </Typography>
  </div>
);

export const CustomInfoToast = ({ message }: { message: string }) => (
  <div style={{ color: 'orange' }}>
    <Typography style={{ fontWeight: 'bold', }}>
      Info
    </Typography>
    <Typography variant="body2">
      {message}
    </Typography>
  </div>
);

export const CustomErrorToast = ({ message }: { message: string }) => (
  <div style={{ color: 'rgba(255, 245, 245, 1)' }}>
    <Typography style={{ fontWeight: '700', color: 'rgba(224, 49, 48, 1)', fontFamily: 'Nunito', fontSize: '16px' }}>
      Error
    </Typography>
    <Typography variant="body2" sx={{ color: 'rgba(224, 49, 48, 1)', fontWeight: '400', fontFamily: 'Nunito', fontSize: '12px' }}>
      {message}
    </Typography>
  </div>
);

export const showToast = (message: string, options: ToastOptions = {}) => {
  toast.success(<CustomToast message={message} />, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    draggable: true,
    style: {
      background: '#EFFAE5',
      color: '#56991B',
      fontFamily: 'Nunito',
      fontSize: '16px',
      fontWeight: 'bold',
      padding: '8px 12px',
      
    },
    className: 'customToastSuccess',
    theme: "light",
    transition: Bounce,
    icon: false,
    ...options
  });
};

export const showErrorToast = (message: string, options: ToastOptions = {}) => {
  toast.error(<CustomErrorToast message={message} />, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    draggable: true,
    style: {
      background: '#FAE5E5',
      color: '#D8000C',
      fontFamily: 'Nunito',
      fontSize: '16px',
      fontWeight: 'bold',
      padding: '8px 12px',
    },
    className: 'customToastError',
    theme: "light",
    transition: Bounce,
    icon: false,
    ...options
  });
};

export const showInfoToast = (message: string, options: ToastOptions = {}) => {
  toast.info(<CustomInfoToast message={message} />, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    draggable: true,
    style: {
      fontFamily: 'Nunito',
      fontSize: '16px',
      fontWeight: 'bold'
    },
    theme: "light",
    transition: Bounce,
    icon: false,
    ...options
  });
};

const ToastNotificationContainer = () => (
  <ToastContainer
    position="top-right"
    autoClose={4000}
    hideProgressBar={false}
    newestOnTop={false}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="light"
    className="customToastContainer"
  />
);

export default ToastNotificationContainer;
