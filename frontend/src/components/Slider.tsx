"use client"
import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, IconButton, Backdrop, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSlider } from '../context/SliderContext';
import { PopupButton, useCalendlyEventListener } from "react-calendly";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showToast } from './ToastNotification';

const Slider: React.FC = () => {
  const [prefillData, setPrefillData] = useState<{ email: '', name: '' } | null>(null);

  const fetchPrefillData = async () => {
    try {
      const response = await axiosInstance.get('/calendly');
      const user = response.data.user;

      if (user) {
        const { full_name, email } = user;
        setPrefillData({
          email: email || '',
          name: full_name || '',
        });
      } else {
        setPrefillData(null);
      }
    } catch (error) {
      console.error('Error fetching prefill data:', error);
      setPrefillData(null);
    }
  };
  const { showSlider, setShowSlider } = useSlider();

  useEffect(() => {
    if (showSlider) {
      fetchPrefillData();
    }
  }, [showSlider]);

  useCalendlyEventListener({
    onEventScheduled: async (e) => {

      const eventUri = e.data.payload.event.uri;
      const inviteeUri = e.data.payload.invitee.uri
      const uuidMatch = eventUri.match(/scheduled_events\/([a-zA-Z0-9-]+)/);
      const uuidInvitee = inviteeUri.match(/invitees\/([a-zA-Z0-9-]+)/);
      const eventUUID = uuidMatch ? uuidMatch[1] : null;
      const inviteesUUID = uuidInvitee ? uuidInvitee[1] : null;

      if (eventUUID && inviteesUUID) {

        try {
          const response = await axiosInstance.post('/calendly', {
            uuid: eventUUID,
            invitees: inviteesUUID
          });
          response
        } catch (error) {
        }
        handleClose()
        showToast('You have successfully signed up for a call')
      }
    },
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
      <Backdrop open={showSlider} onClick={handleClose} sx={{ zIndex: 1200, color: '#fff' }} />
      <Drawer
        anchor="right"
        open={showSlider}
        variant="persistent"
        PaperProps={{
          sx: {
            width: '45%',
            position: 'fixed',
            zIndex: 1300,
            top: 0,
            bottom: 0,
            '@media (max-width: 600px)': {
              width: '100%',
            }
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #e4e4e4' }}>
          <Typography variant="h6" sx={{ textAlign: 'center', color: '#4A4A4A', fontFamily: 'Nunito', fontWeight: '500', fontSize: '20px', lineHeight: '27px', '@media (max-width: 600px)': { fontSize: '16px', textAlign: 'left' } }}>
            Unlock the full potential with our maximiz!
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{
          pl: 5, pr: 5, height: '100%', display: 'flex', flexDirection: 'column', textAlign: 'center', alignItems: 'center',
          '@media (max-width: 960px)': { pl: 4, pr: 4 },
          '@media (max-width: 600px)': { pl: 2, pr: 2 }
        }}>
          <img src="/slider-bookcall.png" alt="Setup" style={{ width: '40%', marginBottom: '0.5em', marginTop: '0.5em', }} />
          <div id='calendly-popup-wrapper' className="book-call-button__wrapper" style={{ zIndex: 2000 }}> </div>
          {prefillData ? (
            <>
              <Typography
                variant="body1"
                gutterBottom
                sx={{
                  color: '#4A4A4A',
                  textAlign: 'left',
                  fontFamily: 'Nunito',
                  fontWeight: '500',
                  fontSize: '22px',
                  lineHeight: '25.2px',
                  marginBottom: '2em',
                  paddingTop: 3,
                  '@media (max-width: 600px)': {
                    fontSize: '18px',
                    lineHeight: '22px',
                    marginBottom: '1em'
                  }
                }}
              >
                Don&apos;t miss out on getting started! Schedule a call with our onboarding specialist now.
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#4A4A4A',
                  textAlign: 'left',
                  fontFamily: 'Nunito',
                  fontWeight: '500',
                  fontSize: '22px',
                  lineHeight: '25.2px',
                  marginBottom: '2em', 
                  marginLeft: '0',
                  '@media (max-width: 600px)': {
                    fontSize: '18px',
                    lineHeight: '22px',
                    marginBottom: '1em'
                  },
                  '@media (min-width: 1500px)': { paddingRight: 20, }
                }}
              >
                Need help? Connect with us directly to activate your account.
              </Typography>
              <Box sx={{width: '100%', height: '100%', display: 'flex', alignItems: 'end', pb: 5}}>
              <Button onClick={handleClose} sx={{width: '100%'}}>
              <PopupButton
                className="book-call-button"
                styles={{
                  width: '100%',
                  textWrap: 'nowrap',
                  color: '#fff',
                  padding: '1em',
                  fontFamily: 'Nunito',
                  fontWeight: '700',
                  fontSize: '16px',
                  textAlign: 'center',
                  borderRadius: '4px',
                  border: 'none',
                  lineHeight: '22.4px',
                  backgroundColor: '#5052B2',
                  textTransform: 'none',
                  cursor: 'pointer',
                }}
                prefill={prefillData}
                url="https://calendly.com/nickit-schatalow09/maximiz"
                rootElement={document.getElementById("calendly-popup-wrapper")!}
                text="Reschedule a Call"
              />
              </Button>              
              </Box>
            </>
          ) : (
            <>
              <Typography variant="body1" gutterBottom sx={{
                color: '#4A4A4A', textAlign: 'left', fontFamily: 'Nunito', fontWeight: '500', fontSize: '18px', lineHeight: '23.2px', marginBottom: '1em',
                '@media (max-width: 600px)': { fontSize: '16px', lineHeight: '22px', marginBottom: '1em' },
                '@media (min-width: 1500px)': { fontSize: '22px', lineHeight: '25.2px', marginBottom: '2em' }
              }}>
                To activate your account, please speak with one of our onboarding specialists, and we&apos;ll get you started.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', '@media (min-width: 1500px)': { gap: 1, } }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ color: 'rgba(110, 193, 37, 1)', fontSize: '20px', '@media (min-width: 1500px)': { fontSize: '24px' } }} />
                  <Typography variant="body1" gutterBottom sx={{
                    color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '700', fontSize: '18px', lineHeight: '23.2px',
                    '@media (max-width: 600px)': { fontSize: '16px' },
                    '@media (min-width: 1500px)': { fontSize: '20px', lineHeight: '25.2px', }
                  }}>
                    Unlock Optimal Efficiency:
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'start', pl: 4.5, }}>
                  <Typography sx={{
                    color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', textAlign: 'left', fontWeight: '400', fontSize: '16px', lineHeight: '19.6px', marginBottom: '1em', '@media (max-width: 600px)': { fontSize: '14px', lineHeight: '18px', marginBottom: '1em' },
                    '@media (min-width: 1500px)': { fontSize: '18px', lineHeight: '19.6px', marginBottom: '2em', }
                  }}>
                    Maximiz offers advanced tools and features designed to enhance your business performance, driving better outcomes and maximizing your potential.
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', '@media (min-width: 1500px)': { gap: 1, } }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ color: 'rgba(110, 193, 37, 1)', fontSize: '20px', '@media (min-width: 1500px)': { fontSize: '24px' } }} />
                  <Typography variant="body1" gutterBottom sx={{
                    color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '700', fontSize: '18px', lineHeight: '23.2px',
                    '@media (max-width: 600px)': { fontSize: '16px' },
                    '@media (min-width: 1500px)': { fontSize: '20px', lineHeight: '25.2px', }
                  }}>
                    Tailored Expert Guidance:
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'start', pl: 4.5 }}>
                  <Typography sx={{
                    color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', textAlign: 'left', fontWeight: '400', fontSize: '16px', lineHeight: '19.6px', marginBottom: '1em', '@media (max-width: 600px)': { fontSize: '14px', lineHeight: '18px', marginBottom: '1em' },
                    '@media (min-width: 1500px)': { fontSize: '18px', lineHeight: '19.6px', marginBottom: '2em', }
                  }}>
                    Our marketing experts are available to provide personalized insights and strategies to help you fully leverage Maximiz&apos;s capabilities for your specific needs.
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', '@media (min-width: 1500px)': { gap: 1, } }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ color: 'rgba(110, 193, 37, 1)', fontSize: '20px', '@media (min-width: 1500px)': { fontSize: '24px' } }} />
                  <Typography variant="body1" gutterBottom sx={{
                    color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '700', fontSize: '18px', lineHeight: '23.2px',
                    '@media (max-width: 600px)': { fontSize: '16px' },
                    '@media (min-width: 1500px)': { fontSize: '20px', lineHeight: '25.2px', }
                  }}>
                    Proven Success in Driving Growth:
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'start', pl: 4.5 }}>
                  <Typography sx={{
                    color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', textAlign: 'left', fontWeight: '400', fontSize: '16px', lineHeight: '19.6px', marginBottom: '1em', '@media (max-width: 600px)': { fontSize: '14px', lineHeight: '18px', marginBottom: '1em' },
                    '@media (min-width: 1500px)': { fontSize: '18px', lineHeight: '19.6px', marginBottom: '4em', }
                  }}>
                    With Maximiz, you can expect tangible results and significant improvements in your business metrics, backed by expert support every step of the way.
                  </Typography>
                </Box>
              </Box>
              <Box sx={{width: '100%', height: '100%', display: 'flex', alignItems: 'end', pb: 5}}>
              <Button onClick={handleClose} sx={{width: '100%'}}>
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
                  border: 'none',
                  lineHeight: '22.4px',
                  backgroundColor: '#5052B2',
                  textTransform: 'none',
                  cursor: 'pointer',
                }}
                url="https://calendly.com/nickit-schatalow09/maximiz"
                rootElement={document.getElementById("calendly-popup-wrapper")!}
                text="Get Started"
              />
              </Button>
              </Box>
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default Slider;
