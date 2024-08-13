"use client"
import React, { useEffect } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSlider } from '../context/SliderContext';
import { PopupButton } from "react-calendly";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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
            width: '45%',
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
            Unlock the full potential with our maximiz!
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ pl: 5, pr: 5, display: 'flex', flexDirection: 'column', textAlign: 'center', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/slider-bookcall.png" alt="Setup" style={{ width: '50%', marginBottom: '1rem', marginTop: '1em' }} />
          <div id='calendly-popup-wrapper' className="book-call-button__wrapper">
            <Typography variant="body1" gutterBottom sx={{ color: '#4A4A4A', textAlign: 'left', fontFamily: 'Nunito', fontWeight: '500', fontSize: '22px', lineHeight: '25.2px', marginBottom: '2em' }}>
              To activate your account, please speak with one of our onboarding specialists, and we&apos;ll get you started.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start' }}>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5 }}>
                <CheckCircleIcon sx={{ color: 'rgba(110, 193, 37, 1)' }} />
                <Typography variant="body1" gutterBottom sx={{ color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '700', fontSize: '20px', lineHeight: '25.2px', }}>
                  Unlock Optimal Efficiency:
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'start', pl: 4.5 }}>
                <Typography sx={{ color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', textAlign: 'left', fontWeight: '400', fontSize: '18px', lineHeight: '19.6px', marginBottom: '2em' }}>
                  Maximiz offers advanced tools and features designed to enhance your business performance, driving better outcomes and maximizing your potential.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start' }}>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5 }}>
                <CheckCircleIcon sx={{ color: 'rgba(110, 193, 37, 1)' }} />
                <Typography variant="body1" gutterBottom sx={{ color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '700', fontSize: '20px', lineHeight: '25.2px', }}>
                  Tailored Expert Guidance:
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'start', pl: 4.5 }}>
                <Typography sx={{ color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', textAlign: 'left', fontWeight: '400', fontSize: '18px', lineHeight: '19.6px', marginBottom: '2em' }}>
                  Our marketing experts are available to provide personalized insights and strategies to help you fully leverage Maximiz's capabilities for your specific needs.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start' }}>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5 }}>
                <CheckCircleIcon sx={{ color: 'rgba(110, 193, 37, 1)' }} />
                <Typography variant="body1" gutterBottom sx={{ color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '700', fontSize: '20px', lineHeight: '25.2px', }}>
                  Proven Success in Driving Growth:
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'start', pl: 4.5 }}>
                <Typography sx={{ color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', textAlign: 'left', fontWeight: '400', fontSize: '18px', lineHeight: '19.6px', marginBottom: '4em' }}>
                  With Maximiz, you can expect tangible results and significant improvements in your business metrics, backed by expert support every step of the way.
                </Typography>
              </Box>
            </Box>
            <PopupButton
              className="book-call-button"
              styles={{
                color: '#fff',
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
              text="Get Started"
            />
          </div>
        </Box>
      </Drawer>
    </>
  );
};

export default Slider;
