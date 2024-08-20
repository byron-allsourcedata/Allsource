"use client"
import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, IconButton, Backdrop } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSlider } from '../context/SliderContext';
import { PopupButton, useCalendlyEventListener } from "react-calendly";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axiosInstance from '@/axios/axiosInterceptorInstance';

const Slider: React.FC = () => {
  const [prefillData, setPrefillData] = useState({
    email: '',
    name: '',
  });

  const fetchPrefillData = async () => {
    try {
      const response = await axiosInstance.get('/calendly');
      const { name, email } = response.data;

      const [firstName, lastName] = name.split(' ');
      setPrefillData({
        email: email || '',
        name: name || '',
      });
    } catch (error) {
      console.error('Ошибка при получении данных:', error);
    }
  };
  const { showSlider, setShowSlider } = useSlider();

  useEffect(() => {
    if (showSlider) {
      fetchPrefillData();
    }
  }, [showSlider]);

  useCalendlyEventListener({
    onProfilePageViewed: () => console.log("onProfilePageViewed"),
    onDateAndTimeSelected: () => console.log("onDateAndTimeSelected"),
    onEventTypeViewed: () => console.log("onEventTypeViewed"),
    onEventScheduled: (e) => console.log(e.data),
  });
  
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
          <Typography variant="h6" sx={{ textAlign: 'center', color: '#4A4A4A', fontFamily: 'Nunito', fontWeight: '600', fontSize: '22px', lineHeight: '25.2px', '@media (max-width: 600px)': { fontSize: '16px' } }}>
            Unlock the full potential with our maximiz!
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ pl: 5, pr: 5, display: 'flex', flexDirection: 'column', textAlign: 'center', alignItems: 'center', justifyContent: 'center', '@media (max-width: 600px)': { pl: 4, pr: 2 } }}>
          <img src="/slider-bookcall.png" alt="Setup" style={{ width: '50%', marginBottom: '1rem', marginTop: '1em' }} />
          <div id='calendly-popup-wrapper' className="book-call-button__wrapper"> </div>
            <Typography variant="body1" gutterBottom sx={{ color: '#4A4A4A', textAlign: 'left', fontFamily: 'Nunito', fontWeight: '500', fontSize: '22px', lineHeight: '25.2px', marginBottom: '2em', '@media (max-width: 600px)': { fontSize: '18px', lineHeight: '22px', marginBottom: '1em'} }}>
              To activate your account, please speak with one of our onboarding specialists, and we&apos;ll get you started.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', gap: 1}}>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center' }}>
                <CheckCircleIcon sx={{ color: 'rgba(110, 193, 37, 1)', fontSize: '24px' }} />
                <Typography variant="body1" gutterBottom sx={{ color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '700', fontSize: '20px', lineHeight: '25.2px', '@media (max-width: 600px)': { fontSize: '16px' } }}>
                  Unlock Optimal Efficiency:
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'start', pl: 4.5, }}>
                <Typography sx={{ color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', textAlign: 'left', fontWeight: '400', fontSize: '18px', lineHeight: '19.6px', marginBottom: '2em', '@media (max-width: 600px)': { fontSize: '14px', lineHeight: '18px', marginBottom: '1em' } }}>
                  Maximiz offers advanced tools and features designed to enhance your business performance, driving better outcomes and maximizing your potential.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', gap: 1}}>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center' }}>
                <CheckCircleIcon sx={{ color: 'rgba(110, 193, 37, 1)', fontSize: '24px' }} />
                <Typography variant="body1" gutterBottom sx={{ color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '700', fontSize: '20px', lineHeight: '25.2px', '@media (max-width: 600px)': { fontSize: '16px' } }}>
                  Tailored Expert Guidance:
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'start', pl: 4.5 }}>
                <Typography sx={{ color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', textAlign: 'left', fontWeight: '400', fontSize: '18px', lineHeight: '19.6px', marginBottom: '2em', '@media (max-width: 600px)': { fontSize: '14px', lineHeight: '18px', marginBottom: '1em' } }}>
                  Our marketing experts are available to provide personalized insights and strategies to help you fully leverage Maximiz&apos;s capabilities for your specific needs.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', gap: 1}}>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center' }}>
                <CheckCircleIcon sx={{ color: 'rgba(110, 193, 37, 1)', fontSize: '24px' }} />
                <Typography variant="body1" gutterBottom sx={{ color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '700', fontSize: '20px', lineHeight: '25.2px', '@media (max-width: 600px)': { fontSize: '16px' } }}>
                  Proven Success in Driving Growth:
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'start', pl: 4.5 }}>
                <Typography sx={{ color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', textAlign: 'left', fontWeight: '400', fontSize: '18px', lineHeight: '19.6px', marginBottom: '4em', '@media (max-width: 600px)': { fontSize: '14px', lineHeight: '18px', marginBottom: '4em' } }}>
                  With Maximiz, you can expect tangible results and significant improvements in your business metrics, backed by expert support every step of the way.
                </Typography>
              </Box>
            </Box>
            <PopupButton
              className="book-call-button"
              styles={{
                width: '100%',
                textWrap: 'nowrap',
                color: '#fff',
                padding: '1em 8em',
                fontFamily: 'Nunito',
                fontWeight: '700',
                fontSize: '16px',
                borderRadius: '4px',
                lineHeight: '22.4px',
                backgroundColor: '#5052B2',
                textTransform: 'none',
                cursor: 'pointer',
              }}
              prefill={prefillData}
              url="https://calendly.com/nickit-schatalow09/maximiz"
              rootElement={document.getElementById("calendly-popup-wrapper")!}
              text="Get Started"
            />
        </Box>
      </Drawer>
    </>
  );
};

export default Slider;
