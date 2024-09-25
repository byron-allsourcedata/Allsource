"use client";
import React from 'react';
import { Box, Button, Typography, Drawer, Backdrop } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type Props = {
  open: boolean;
  handleClose: () => void;
  limitName: string;
};


export const UpgradePlanPopup: React.FC<Props> = ({ open, handleClose, limitName }) => {
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
            display: 'flex',
            zIndex: 1300,
            top: 0,
            bottom: 0,
            '@media (max-width: 600px)': {
              width: '100%',
            },
          },
        }}
      >
        <Box sx={{ width: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '25px 16px',
              borderBottom: '1px solid rgba(228, 228, 228, 1)',
              width: '100%',
            }}
          >
            <Typography variant='h3' fontSize={'1rem'}>Upgrade plan</Typography>
            <CloseIcon sx={{ cursor: 'pointer' }} onClick={() => handleClose()} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', padding: 3 }}>
            <Box sx={{
              width: '100%',
              maxWidth: 600,
              margin: '0 auto',
              '@media (max-width: 600px)': {
                width: '100%',
              }
            }}>
              <Image
                src='/upgrade-plan.svg'
                alt='Upgrade Plan'
                width={600}
                height={356.67}
                style={{ width: '100%', height: 'auto' }}
              />
            </Box>
            <Box sx={{ paddingRight: 2, paddingLeft: 2 }}>
              <Typography sx={{
                width: '100%',
                textAlign: 'justify',
                fontFamily: 'Nunito Sans',
                fontWeight: 600,
                fontSize: '16px',
                color: 'rgba(32, 33, 36, 1)',
                mb: 2
              }} variant='h6'>
                You have reached the maximum {limitName} limit for your current plan. To add more {limitName}, please consider upgrading your plan.
                </Typography>
              <Typography sx={{
                width: '100%',
                fontFamily: 'Roboto',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '21px',
                letterSpacing: '0.005em',
                textAlign: 'left',
                color: 'rgba(95, 99, 104, 1)'
              }}>Maximiz provides cutting-edge tools and features tailored to elevate your business performance, delivering superior results and unlocking your full potential.</Typography>
            </Box>
          </Box>
          <Box
            sx={{
              position: 'fixed ',
              width: '45%',
              bottom: 0,
              right: 0,
              zIndex: 1302,
              backgroundColor: 'rgba(255, 255, 255, 1)',
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '1em',
              borderTop: '1px solid rgba(228, 228, 228, 1)',
              "@media (max-width: 600px)":
                { width: '100%' }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', borderTop: '1px solid rgba(255, 255, 255, 1)', marginBottom: '1rem', pt: 2 }}>
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
              }} variant='contained' onClick={() => { router.push('/choose-plan') }}><Typography padding={'0.5rem 2rem'} fontSize={'0.8rem'}>Upgrade</Typography></Button>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};
