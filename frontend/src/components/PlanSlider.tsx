"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography, Modal, IconButton, Divider, Input } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Image from 'next/image';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showToast } from './ToastNotification';
import { PopupButton } from 'react-calendly';

const style = {
    position: 'absolute' as 'absolute',
    top: 0,
    right: 0,
    width: '40%',
    height: '100%',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    transition: 'transform 0.3s ease-in-out',
    transform: 'translateX(100%)',
    '@media (max-width: 1199px)': {
        width: '50%',
        p: 0
    },
    '@media (max-width: 900px)': {
        width: '60%',
        p: 0
    },
    '@media (max-width: 600px)': {
        width: '100%',
        p: 0
    },
};


const openStyle = {
    transform: 'translateX(0%)',
    right: 0,
};

const maintext = {
    fontFamily: 'Nunito',
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '19.6px',
    textAlign: 'left',
    color: 'rgba(0, 0, 0, 1)',
    padding: '0em 0em 0em 1em',
};

const subtext = {
    fontFamily: 'Nunito',
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '16.8px',
    textAlign: 'left',
    color: 'rgba(0, 0, 0, 1)',
    paddingTop: '1em',
    paddingLeft: '2.9em',
};

interface PopupProps {
    open: boolean;
    handleClose: () => void;
    handleChoosePlan: () => void;
}

const PlanSlider: React.FC<PopupProps> = ({ open, handleClose, handleChoosePlan }) => {
    const calendlyPopupRef = useRef<HTMLDivElement | null>(null);
    const [rootElement, setRootElement] = useState<HTMLElement | null>(null);
    useEffect(() => {
        if (calendlyPopupRef.current) {
          setRootElement(calendlyPopupRef.current);
        }
      }, []);

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            sx={{ overflow: 'hidden' }}
        >
            <Box sx={{ ...style, ...(open ? openStyle : {}) }}>
                <Box display="flex" justifyContent="space-between" sx={{ width: '100%', paddingBottom: '1em' }}>
                    <Typography variant="h6" component="h2" sx={{ fontFamily: 'Nunito', fontSize: '18px', fontWeight: '500', lineHeight: '27px', textAlign: 'left', color: 'rgba(28, 28, 28, 1)', '@media (max-width: 600px)': { fontSize: '14px', pt: 2, pl: 2 } }}>
                        Your free trial expired
                    </Typography>
                    <IconButton onClick={handleClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Divider />
                <Box sx={{
                    pl: 0, pr: 0, display: 'flex', flexDirection: 'column', textAlign: 'center', alignItems: 'center',
                    '@media (max-width: 960px)': { pl: 4, pr: 4 },
                    '@media (max-width: 600px)': { pl: 2, pr: 2 }
                }}>
                    <img src="/slider-bookcall.png" alt="Setup" style={{ width: '40%', marginBottom: '0.5em', marginTop: '0.5em', }} />
                    <div id="calendly-popup-wrapper" ref={calendlyPopupRef} />
                    <Typography variant="body1" gutterBottom sx={{
                        color: '#4A4A4A', textAlign: 'left', fontFamily: 'Nunito', fontWeight: '500', fontSize: '18px', lineHeight: '23.2px', marginBottom: '1em',
                        '@media (max-width: 600px)': { fontSize: '18px', lineHeight: '22px', marginBottom: '2em', mt:2 },
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
                                '@media (max-width: 600px)': { fontSize: '16px'  },
                                '@media (min-width: 1500px)': { fontSize: '20px', lineHeight: '25.2px' }
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
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-around', paddingTop: '1em', maxHeight: '20em', gap: 2, '@media (max-width: 600px)': { justifyContent: 'center', pb: 3, width: '60%', } }}>
                    {rootElement && (<PopupButton
                            className="book-call-button"
                            styles={{
                                textWrap: 'nowrap',
                                color: 'rgba(80, 82, 178, 1)',
                                padding: '1em 4.5em',
                                fontFamily: 'Nunito',
                                fontWeight: '700',
                                fontSize: '16px',
                                borderRadius: '4px',
                                border: '1px solid rgba(80, 82, 178, 1)',
                                lineHeight: '22.4px',
                                backgroundColor: '#fff',
                                textTransform: 'none',
                                cursor: 'pointer',
                                width: '100%'

                            }}
                            url="https://calendly.com/maximiz-support/30min"
                            rootElement={rootElement} 
                            text="Book a call"
                        />)}
                        <Button variant="contained" onClick={handleChoosePlan} sx={{
                            backgroundColor: 'rgba(80, 82, 178, 1)', fontFamily: "Nunito", textTransform: 'none', lineHeight: '22.4px',
                            fontWeight: '700', padding: '1em 5em', textWrap: 'nowrap'
                        }}>
                            Choose Plan
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

export default PlanSlider;
