"use client"
import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, IconButton, Backdrop, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSlider } from '../context/SliderContext';
import { PopupButton, useCalendlyEventListener } from "react-calendly";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showToast } from './ToastNotification';
import { useBookingUrl } from '@/services/booking';


interface SliderProps {
  setShowSliders?: (value: boolean) => void;
}

const Slider: React.FC<SliderProps> = ({ setShowSliders }) => {
  const [prefillData, setPrefillData] = useState<{ email: '', name: ''} | null>(null);
  const [isPrefillLoaded, setIsPrefillLoaded] = useState(false);
  const [fullName, setFullName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [utmParams, setUtmParams] = useState<string | null>(null);
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const meItem = typeof window !== 'undefined' ? sessionStorage.getItem('me') : null;
    if (meItem) {
      const meData = JSON.parse(meItem);
      setFullName(meData.full_name);
      setEmail(meData.email);
    }
  },); 
  
  const prefillDataStorage = {
    name: fullName || '',
    email: email || '',
  };

  const meetingUrl = useBookingUrl(axiosInstance);
  
  const fetchPrefillData = async () => {
    try {
      const response = await axiosInstance.get('/calendly');
      const user = response.data.user;

      if (user) {
        const { full_name, email, utm_params } = user;
        setUtmParams(utm_params)
        setPrefillData({
          email: email || '',
          name: full_name || '',
        });
      } else {
        setPrefillData(null);
      }
    } catch (error) {
      setPrefillData(null);
    } finally {
      setIsPrefillLoaded(true);
    }
  };

  const { showSlider, setShowSlider } = useSlider();

  useEffect(() => {
    if (showSlider) {
      setIsPrefillLoaded(false);
      fetchPrefillData();
    }
  }, [showSlider]);

  useEffect(() => {
    if (isPrefillLoaded && showSlider) {
      setShowSlider(true);
    }
  }, [isPrefillLoaded]);

  useCalendlyEventListener({
    onEventScheduled: async (e) => {
      const eventUri = e.data.payload.event.uri;
      const inviteeUri = e.data.payload.invitee.uri;
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
          response;
        } catch (error) {
        }
        handleClose();
        showToast('You have successfully signed up for a call');
      }
    },
  });

  const handleClose = () => {
    sessionStorage.setItem('is_slider_opened', 'false');
    setShowSlider(false);
    if (setShowSliders) {
      setShowSliders(false);
    }
  };

  useEffect(() => {
    const isSliderOpened = sessionStorage.getItem('is_slider_opened');
    setShowSlider(isSliderOpened === 'true');
  }, [setShowSlider]);

  useEffect(() => {
    const element = document.getElementById("calendly-popup-wrapper");
    if (element) {
      setRootElement(element);
    }
  }, []);

  return (
    <>
      <div id='calendly-popup-wrapper' className="book-call-button__wrapper" style={{ zIndex: 2000 }}> </div>
      <Backdrop open={showSlider} onClick={handleClose} sx={{ zIndex: 100,color: '#fff' }} />
      <Drawer
        anchor="right"
        open={showSlider && isPrefillLoaded}
        variant="persistent"
        PaperProps={{
          sx: {
            width: '45%',
            position: 'fixed',
            
            top: 0,
            bottom: 0,
            '@media (max-width: 600px)': {
              width: '100%',
            }
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb:1.4, borderBottom: '1px solid #e4e4e4' }}>
          <Typography className='first-sub-title' sx={{ textAlign: 'center', '@media (max-width: 600px)': { fontSize: '16px', textAlign: 'left' }, '@media (min-width: 1500px)': { fontSize: '22px !important', lineHeight: '25.2px !important' } }}>
            Activate your Free Trial 
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon sx={{'@media (min-width: 1500px)': { fontSize: '28px !important', lineHeight: '25.2px !important' }}} />
          </IconButton>
        </Box>
        <Box sx={{
          pl: 5, pr: 5, height: '100%', display: 'flex', flexDirection: 'column', textAlign: 'center', alignItems: 'center',
          '@media (max-width: 960px)': { pl: 4, pr: 4 },
          '@media (max-width: 600px)': { pl: 2, pr: 2 }
        }}>
          <img src="/slider-bookcall.png" alt="Setup" style={{ width: '40%', marginBottom: '3rem', marginTop: '2rem', }} />
          {prefillData && prefillData.email ? (
            <>
              <Typography
                variant="body1"
                gutterBottom
                className='second-sub-title'
                sx={{
                  textAlign: 'cemter',
                  marginBottom: '1rem',
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
                className='second-sub-title'
                sx={{
                  textAlign: 'center',
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
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'end', pb: 5 }}>
                <Button onClick={handleClose} sx={{ width: '100%' }}>
                  <PopupButton
                    className="book-call-button"
                    styles={{
                      width: '100%',
                      textWrap: 'nowrap',
                      color: '#fff',
                      padding: '1em',
                      fontFamily: 'Nunito Sans',
                      fontWeight: '600',
                      fontSize: '14px',
                      textAlign: 'center',
                      borderRadius: '4px',
                      border: 'none',
                      lineHeight: '22.4px',
                      backgroundColor: 'rgba(56, 152, 252, 1)',
                      textTransform: 'none',
                      cursor: 'pointer',
                    }}
                    prefill={prefillData}
                    url={meetingUrl}
                    rootElement={document.getElementById("calendly-popup-wrapper")!}
                    text="Reschedule a Call"
                  />
                </Button>
              </Box>
            </>
          ) : (
            <>
            <Box sx={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height:'100%' }}>
              <Typography variant="body1" gutterBottom className="second-sub-title" sx={{
                textAlign: 'left', marginBottom: '1.5rem',
                '@media (max-width: 600px)': { fontSize: '10px !important', lineHeight: '22px !important', marginBottom: '1em' },
                '@media (min-width: 1500px)': { fontSize: '22px !important', lineHeight: '25.2px !important', marginBottom: '2em' },
                '@media (min-width: 2000px)': { fontSize: '26px !important', lineHeight: '25.2px !important', marginBottom: '2em' }
              }}>
                To activate your Free Trial, speak to one of our onboarding specialists, and we&apos;ll get you started. 
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', '@media (min-width: 1500px)': { gap: 1, } }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ color: 'rgba(110, 193, 37, 1)', fontSize: '20px', '@media (min-width: 1500px)': { fontSize: '24px' } }} />
                  <Typography variant="body1" className='table-heading' gutterBottom sx={{
                    '@media (max-width: 600px)': { fontSize: '10px !important' },
                    '@media (min-width: 1500px)': { fontSize: '20px !important', lineHeight: '25.2px !important', },
                    '@media (min-width: 2000px)': { fontSize: '24px !important', lineHeight: '25.2px !important', }
                  }}>
                    Get your Pixel installed:
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'start', pl: 4.5, }}>
                  <Typography className='table-data' sx={{
                    textAlign: 'left', marginBottom: '2rem', '@media (max-width: 600px)': { fontSize: '14px !important', lineHeight: '18px !important', marginBottom: '1em' },
                    '@media (min-width: 1500px)': { fontSize: '18px !important', lineHeight: '19.6px !important', marginBottom: '2em', },
                    '@media (min-width: 2000px)': { fontSize: '22px !important', lineHeight: '23.2px !important', }
                  }}>
                    Once you are live within 30 minutes you will start collecting the details of your anonymous visitors. 
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', '@media (min-width: 1500px)': { gap: 1, } }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ color: 'rgba(110, 193, 37, 1)', fontSize: '20px', '@media (min-width: 1500px)': { fontSize: '24px' } }} />
                  <Typography variant="body1" className='table-heading' gutterBottom sx={{
                    '@media (max-width: 600px)': { fontSize: '10px !important' },
                    '@media (min-width: 1500px)': { fontSize: '20px !important', lineHeight: '25.2px !important', },
                    '@media (min-width: 2000px)': { fontSize: '24px !important', lineHeight: '25.2px !important', }
                  }}>
                    Connect your 3<span style={{ verticalAlign: 'super', fontSize: 'smaller' }}>rd</span> party integrations:
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'start', pl: 4.5 }}>
                <Typography className='table-data' sx={{
                    textAlign: 'left', marginBottom: '2rem', '@media (max-width: 600px)': { fontSize: '14px !important', lineHeight: '18px !important', marginBottom: '1em' },
                    '@media (min-width: 1500px)': { fontSize: '16px !important', lineHeight: '19.6px !important', marginBottom: '2em', },
                    '@media (min-width: 2000px)': { fontSize: '22px !important', lineHeight: '23.2px !important', }
                  }}>
                    Simply connect all your 3<span style={{ verticalAlign: 'super', fontSize: 'smaller' }}>rd</span> party integrations such as your store or email provider to start contacting your leads. 
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'start', '@media (min-width: 1500px)': { gap: 1, } }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'start', justifyContent: 'start' }}>
                  <CheckCircleIcon sx={{ color: 'rgba(110, 193, 37, 1)', fontSize: '20px', '@media (min-width: 1500px)': { fontSize: '24px' } }} />
                  <Typography variant="body1" className='table-heading' gutterBottom sx={{
                    '@media (max-width: 600px)': { fontSize: '10px !important' },
                    '@media (min-width: 1500px)': { fontSize: '18px !important', lineHeight: '23.2px !important', },
                    '@media (min-width: 2000px)': { fontSize: '24px !important', lineHeight: '25.2px !important', },
                  }}>
                    Watch the revenue roll in:
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'start', pl: 4.5 }}>
                <Typography className='table-data' sx={{
                    textAlign: 'left', marginBottom: '2rem', '@media (max-width: 600px)': { fontSize: '12px !important', lineHeight: '18px !important', marginBottom: '1em' },
                    '@media (min-width: 1500px)': { fontSize: '16px !important', lineHeight: '19.6px !important', marginBottom: '2em', },
                    '@media (min-width: 2000px)': { fontSize: '22px !important', lineHeight: '23.2px !important', }
                  }}>
                    Within a few days start watching the sales and revenue from your account.  
                  </Typography>
                </Box>
              </Box>
              </Box>
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'end', pb: 5 }}>
                <Button sx={{ width: '100%' }}>
                  <PopupButton
                    className="book-call-button"
                    styles={{
                      width: '100%',
                      textWrap: 'nowrap',
                      color: '#fff',
                      padding: '1em 8em',
                      fontFamily: 'Nunito Sans',
                      fontWeight: '600',
                      fontSize: '14px',
                      borderRadius: '4px',
                      border: 'none',
                      lineHeight: '22.4px',
                      backgroundColor: 'rgba(56, 152, 252, 1)',
                      textTransform: 'none',
                      cursor: 'pointer',
                    }}
                    url={meetingUrl}
                    rootElement={document.getElementById("calendly-popup-wrapper")!}
                    text="Get Started"
                    prefill={prefillDataStorage}
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
