"use client";
import React, { useState } from 'react';
import { Box, Button, Typography, Modal, IconButton, TextField, Drawer, Backdrop } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import { styles } from '../css/cmsStyles';
import axios from 'axios'; 
import { showErrorToast, showToast } from './ToastNotification'
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { useRouter } from 'next/navigation';

const style = {
  position: 'fixed' as 'fixed',
  top: 0,
  right: 0,
  width: '45%',
  height: '100%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out',
  transform: 'translateX(100%)',
  '@media (max-width: 600px)': {
    width: '100%',
    height: '100%',
    p: 2
  },
};

const openStyle = {
  transform: 'translateX(0%)',
  right: 0,
};

const typographyStyles = {
  textTransform: 'none',
  fontFamily: 'Nunito',
  fontSize: '14px',
  fontWeight: '500',
  lineHeight: '19.6px',
  color: 'rgba(74, 74, 74, 1)',
  textWrap: 'nowrap',
  paddingTop: '1em',
  paddingBottom: '0.75em',
};

const buttonStyles = {
  backgroundColor: '#fff',
  display: "flex",
  flexDirection: 'column',
  padding: '1em',
  borderColor: 'rgba(228, 228, 228, 1)',
  border: '1px solid rgba(228, 228, 228, 1)',
  width: '100%',
};

const buttonGoogle = {
  backgroundColor: '#fff',
  display: "flex",
  flexDirection: 'column',
  padding: '1em 2em 1.5em 1em',
  borderColor: 'rgba(228, 228, 228, 1)',
  border: '1px solid rgba(228, 228, 228, 1)',
  width: '100%',
};

const typographyGoogle = {
  textTransform: 'none',
  fontFamily: 'Nunito',
  fontSize: '18px',
  fontWeight: '450',
  lineHeight: '19.6px',
  color: 'rgba(74, 74, 74, 1)',
  textWrap: 'wrap',
  paddingTop: '1em',
  paddingBottom: '0.25em',
};

const maintext = {
  fontFamily: 'Nunito',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '19.6px',
  color: 'rgba(0, 0, 0, 1)',
  paddingTop: '1em',
  paddingBottom: '0.75em',
};

const subtext = {
  fontFamily: 'Nunito',
  fontSize: '15px',
  fontWeight: '600',
  lineHeight: '19.6px',
  textAlign: 'center',
  color: 'rgba(74, 74, 74, 1)',
  paddingTop: '0.25em',
  '@media (max-width: 600px)': { textAlign: 'left', fontSize: '14px' }
};


type Props = {
  open: boolean;
  handleClose: () => void;
};

export const UpgradePlanPopup = ({ open, handleClose }: Props) => {
    const router = useRouter()
    if (!open) return null;
return (
  <>
    <Backdrop open={open} onClick={handleClose} sx={{ zIndex: 1200, color: '#fff' }} />
    <Drawer
      anchor="right"
      open={open}
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
          },
        },
      }}
    >
      <Box p={4}>
        <Box sx={{
          display: 'flex',
          'justifyContent': 'space-between',
        }}>
        <Typography variant='h5'>Upgrade plan</Typography>
        <CloseIcon onClick={() => handleClose()} />
        
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '1rem' }}>
          <span style={{ border: '1px solid #CDCDCD', marginBottom: '1rem', width: '100%'}}></span>
        </Box>
        <Image src='/upgrade-plan.svg' alt='1'width={800} height={500}/>
        <Typography sx={{
          width: '100%'
        }} variant='h6' textAlign={'justify'} fontSize={'1.4rem'}>You have reached the maximum domain limit for your current plan. To add more domains, please consider upgrading your plan.</Typography>
        <Typography sx={{
          width: '100%'
        }} textAlign={'justify'} mt={4} fontSize={'1.1rem'}>Maximiz provides cutting-edge tools and features tailored to elevate your business performance, delivering superior results and unlocking your full potential.</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '4rem' }}>
        <span style={{ border: '1px solid #CDCDCD', marginBottom: '1rem', width: '100%'}}></span>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '1rem' }}>
      
        <Button sx={{
          margin: '0em 2em 0 4em',
          border: '1px #5052B2 solid',
          color: '#5052B2',
          padding: '0 4rem',
          '&:hover': {
            border: '1px #5052B2 solid',
        }
        }} variant='outlined' onClick={() => handleClose()}>Cancel</Button>
        <Button sx={{
          margin: '0em 2em 0 4em',
          background: '#5052B2',
          padding: '1em 4rem',
          '&:hover': {
          backgroundColor: '#5052B2', 
        }
        }} variant='contained' onClick={() => {router.push('/choose-plan')}}>Upgrade</Button>
      </Box>
    </Drawer>
  </>
);
};
