"use client"
import React, { useEffect } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSlider } from '../context/SliderContext';

const Slider: React.FC = () => {
  const { showSlider, setShowSlider } = useSlider();
  const handleClose = () => {
    sessionStorage.setItem('is_slider_opened', 'false');
    setShowSlider(false);
  };

  useEffect(() => {
    const isSliderOpened = sessionStorage.getItem('is_slider_opened');
    setShowSlider(isSliderOpened === 'true');
  }, [setShowSlider]);

  return (
    <>
      <Backdrop open={showSlider} sx={{ zIndex: 1200, color: '#fff' }} />
      <Drawer
        anchor="right"
        open={showSlider}
        variant="persistent"
        PaperProps={{
          sx: {
            width: '40%',
            position: 'fixed',
            zIndex: 1301, 
            top: 0,
            bottom: 0,
            '@media (max-width: 600px)': { 
              width: '100%', 
            }
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #e4e4e4' }}>
          <Typography variant="h6" sx={{ textAlign: 'center', color: '#4A4A4A', fontFamily: 'Nunito', fontWeight: '600', fontSize: '22px', lineHeight: '25.2px' }}>
            Filter Search
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', textAlign: 'center', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body1" gutterBottom sx={{color: '#4A4A4A', fontFamily: 'Nunito', fontWeight: '500', fontSize: '24px', lineHeight: '25.2px', marginTop: '3em' }}>
            To activate your account, please speak with one of our onboarding specialists, and we&apos;ll get you started.
          </Typography>
        </Box>
      </Drawer>
    </>
  );
};

export default Slider;
