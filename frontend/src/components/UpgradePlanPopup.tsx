"use client";
import React from 'react';
import { Box, Button, Typography, Drawer, Backdrop } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
        <Typography variant='h3' fontSize={'1rem'}>Upgrade plan</Typography>
        <CloseIcon sx={{cursor: 'pointer'}} onClick={() => handleClose()} />
        
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '1rem' }}>
          <span style={{ border: '1px solid #CDCDCD', marginBottom: '1rem', width: '100%'}}></span>
        </Box>
        <Image src='/upgrade-plan.svg' alt='1'width={535} height={356.67}/>
        <Typography sx={{
          width: '100%'
        }} variant='h6' textAlign={'justify'} fontFamily={'Nunito Sans'} fontWeight={500} fontSize={'1rem'}>You have reached the maximum domain limit for your current plan. To add more domains, please consider upgrading your plan.</Typography>
        <Typography sx={{
          width: '100%'
        }} textAlign={'justify'} mt={'1rem'} fontFamily={'Nunito Sans'} fontSize={'0.8rem'}>Maximiz provides cutting-edge tools and features tailored to elevate your business performance, delivering superior results and unlocking your full potential.</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '10rem' }}>
        <span style={{ border: '1px solid #CDCDCD', marginBottom: '1rem', width: '100%'}}></span>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%'}}>
        <Button sx={{
          border: '1px #5052B2 solid',
          color: '#5052B2',
          '&:hover': {
            border: '1px #5052B2 solid',
        }
        }} variant='outlined' onClick={() => handleClose()}><Typography padding={'0.5rem 2rem'} fontSize={'0.8rem'}>Cancel</Typography></Button>
        <Button sx={{
          marginLeft: '2.5em',
          marginRight: '1rem',
          background: '#5052B2',
          '&:hover': {
          backgroundColor: '#5052B2', 
        }
        }} variant='contained' onClick={() => {router.push('/choose-plan')}}><Typography padding={'0.5rem 2rem'} fontSize={'0.8rem'}>Upgrade</Typography></Button>
      </Box>
    </Drawer>
  </>
);
};
