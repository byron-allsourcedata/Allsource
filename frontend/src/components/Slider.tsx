"use client"
import React, { useEffect } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSlider } from '../context/SliderContext';
import { PopupButton } from "react-calendly";
import Image from 'next/image'

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
          <Image src="/slider-bookcall.png" alt="Setup" style={{ width: '50%', marginBottom: '1rem' }} />
          <div id='calendly-popup-wrapper' className="book-call-button__wrapper">
          <PopupButton 
              className="book-call-button" 
              styles={{
                  color:'#fff',
                  padding: '1em 12em', 
                  fontFamily: 'Nunito', 
                  fontWeight: '700', 
                  fontSize: '16px', 
                  borderRadius: '4px',
                  lineHeight: '22.4px', 
                  backgroundColor: '#5052B2', 
                  textTransform: 'none',
                  cursor: 'pointer',
              }}
              url="https://calendly.com/slava-lolly/123"
              rootElement={document.getElementById("calendly-popup-wrapper")!}
              text="Talk to an expert now!"
          />
          </div>
        </Box>
      </Drawer>
    </>
  );
};

export default Slider;
