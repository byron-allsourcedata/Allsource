// components/Slider.tsx
import React, { useState, useEffect } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const Slider: React.FC = () => {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => setOpen(true), 1000);
  };

  useEffect(() => {
    setOpen(true);
  }, []);

  return (
    <>
      <Backdrop open={open} sx={{ zIndex: 1200, color: '#fff' }} />
      <Drawer
        anchor="right"
        open={open}
        variant="persistent"
        PaperProps={{
          sx: {
            width: '40%',
            position: 'fixed',
            zIndex: 1301, 
            top: 0,
            bottom: 0,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #e4e4e4' }}>
          <Typography variant="h6" sx={{ textAlign: 'center', color: '#4A4A4A', fontFamily: 'Nunito', fontWeight: '600', fontSize: '22px', lineHeight: '25.2px' }}>
            Lets get you set up!
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', textAlign: 'center', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body1" gutterBottom sx={{color: '#4A4A4A', fontFamily: 'Nunito', fontWeight: '500', fontSize: '24px', lineHeight: '25.2px', marginTop: '3em' }}>
            To activate your account, please speak with one of our onboarding specialists, and we&apos;ll get you started.
          </Typography>
          <img src="/slider-bookcall.png" alt="Setup" style={{ width: '50%', marginBottom: '1rem' }} />
          <Button variant="contained" color="primary" fullWidth sx={{ padding: '1em 12em', fontFamily: 'Nunito', fontWeight: '700', fontSize: '16px', lineHeight: '22.4px', backgroundColor: '#5052B2', textTransform: 'none' }}>
            Talk to an expert now!
          </Button>
        </Box>
      </Drawer>
    </>
  );
};

export default Slider;
