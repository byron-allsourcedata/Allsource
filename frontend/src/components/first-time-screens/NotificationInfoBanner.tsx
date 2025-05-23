import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { InfoIcon, CloseIcon } from "@/icon"

interface NotificationBannerProps {
  message: string;
  onClose?: () => void;
}

const NotificationInfoBanner: React.FC<NotificationBannerProps> = ({ message, onClose }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'rgba(254,247,223,1)',
        border: '1px solid rgba(235,193,46,0.3)',
        borderRadius: 1,
        p: 2,
      }}
    >
      <InfoIcon sx={{ color: 'rgba(235,193,46,1)', mr: 3 }} />
      <Typography
        sx={{
          color: 'rgba(50,54,62,1)',
          fontFamily: "Nunito Sans",
          fontWeight: "600",
          fontSize: "14px",
          letterSpacing: "0%",
          lineHeight: "22px",
          mr: 3
        }}
      >
        {message}
      </Typography>
      <Box sx={{ flexGrow: 1 }} />
      <IconButton onClick={onClose} size="small" sx={{
        position: 'absolute',
        top: 8,
        right: 8,
      }}>
        <CloseIcon sx={{ fontSize: '20px', color: 'rgba(82, 82, 82, 1)' }} />
      </IconButton>
    </Box>
  );
};

export default NotificationInfoBanner;
