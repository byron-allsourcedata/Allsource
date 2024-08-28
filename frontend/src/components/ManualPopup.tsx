"use client";
import React, { useState } from 'react';
import { Box, Button, Typography, Modal, IconButton, Divider, Input } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Image from 'next/image';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showToast } from './ToastNotification';

const style = {
  position: 'fixed' as 'fixed',
  top: 0,
  right: 0,
  width: '40%',
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
    p: 0
  },
};

const openStyle = {
  transform: 'translateX(0%)',
  right: 0,
};

const maintext = {
  fontFamily: 'Nunito',
  fontSize: '14px',
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
  paddingTop: '0em',
  paddingLeft: '2.9em',
};

interface PopupProps {
  open: boolean;
  handleClose: () => void;
  pixelCode: string;
}

const Popup: React.FC<PopupProps> = ({ open, handleClose, pixelCode }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(pixelCode);
    alert('Copied to clipboard');
  };

  const [email, setEmail] = useState('');

  const handleButtonClick = () => {
    axiosInstance.post('/install-pixel/send-pixel-code', { email })
      .then(response => {
        showToast('Successfully send email')
      })
      .catch(error => {
        console.error('There was an error!', error);
      });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{ overflow: 'hidden' }}
    >
      <Box sx={{ ...style, ...(open ? openStyle : {}) }}>
        <Box display="flex" justifyContent="space-between" sx={{ width: '100%', alignItems: 'center' }}>
          <Typography variant="h6" component="h2" sx={{ fontFamily: 'Nunito', fontSize: '14px', fontWeight: '700', lineHeight: '19.1px', textAlign: 'left', color: 'rgba(28, 28, 28, 1)', '@media (max-width: 600px)': { pt: 2, pl: 2 } }}>
            Install Manually
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflowY: 'auto', paddingBottom: '30px', '@media (max-width: 600px)': {p: 2} }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '1em 0em 0em 0em', justifyContent: 'start' }}>
            <Image src='/1.svg' alt='1' width={28} height={28} />
            <Typography sx={maintext}>Copy the pixel code</Typography>
          </Box>
          <Box
            component="pre"
            sx={{
              backgroundColor: '#ffffff',
              gap: 2,
              position: 'relative',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              border: '1px solid rgba(228, 228, 228, 1)',
              borderRadius: '10px',
              marginLeft: '3em',
              maxHeight: '13em',
              overflowY: 'auto',
              '@media (max-width: 600px)': {
                maxHeight: '14em',
              },
            }}
          >
            <IconButton
              onClick={handleCopy}
              sx={{ position: 'absolute', right: '10px', top: '10px' }}
            >
              <ContentCopyIcon />
            </IconButton>
            <code style={{ color: '#000000', fontSize: '12px', fontWeight: 600, fontFamily: 'Nunito', textWrap: 'nowrap'}}>{pixelCode}</code>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0.5em 0em 0em 0em', justifyContent: 'start' }}>
            <Image src='/2.svg' alt='2' width={28} height={28} />
            <Typography sx={maintext}>Paste the pixel in your website</Typography>
          </Box>
          <Typography sx={subtext}>Paste the above pixel in the header of your website. The header script starts with &lt;head&gt; and ends with &lt;/head&gt;.</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '1.25em 0em 0em 0em', justifyContent: 'start' }}>
            <Image src='/3.svg' alt='3' width={28} height={28} />
            <Typography sx={maintext}>Verify Your Pixel</Typography>
          </Box>
          <Typography sx={subtext}>Once the pixel is pasted in your website, wait for 10-15 mins and verify your pixel.</Typography>
        </Box>
        <Box
          sx={{
            padding: '1.1em',
            border: '1px solid #e4e4e4',
            borderRadius: '8px',
            backgroundColor: 'rgba(247, 247, 247, 1)',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            marginBottom: '3em',
            '@media (max-width: 600px)': { m: 2 }
          }}
        >
          <Typography
            variant="h6"
            component="div"
            mb={2}
            sx={{
              fontFamily: 'Nunito',
              fontWeight: '700',
              lineHeight: '21.82px',
              textAlign: 'left',
              fontSize: '18px'
            }}
          >
            Send this to my developer
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="space-between" flexDirection="row" sx={{'@media (max-width: 600px)': { flexDirection: 'column', display: 'flex', alignContent: 'flex-start', alignItems: 'flex-start', gap: 1}}}>
            <Input
              id="email_send"
              type="text"
              placeholder="Enter Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{padding: '0.5rem 2em 0.5em 1em',
                width: '65%',
                border: '1px solid #e4e4e4',
                borderRadius: '4px',
                maxHeight: '2.5em',
                fontFamily: 'Nunito',
                fontSize: '16px',
                fontWeight: '700',
                lineHeight: '21.82px',
                textAlign: 'left',
                '@media (max-width: 600px)': {
                  width: '100%',
                },
              }}
            />
            <Button
              onClick={handleButtonClick}
              sx={{
                ml: 2,
                border: '1px solid rgba(80, 82, 178, 1)',
                textTransform: 'none',
                background: '#fff',
                color: 'rgba(80, 82, 178, 1)',
                fontFamily: 'Nunito',
                padding: '0.65em 2em',
                mr: 1,
                '@media (max-width: 600px)': {padding: '0.5em 1.5em', mr: 0, ml: 0, left: 0}
              }}
            >
              <Typography sx={{
                fontFamily: 'Nunito', fontSize: '16px', fontWeight: '600', lineHeight: '22.4px', textAlign: 'left'
              }}>
                Send
              </Typography>
            </Button>
          </Box>
        </Box>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', paddingBottom: '0em', '@media (max-width: 600px)': { justifyContent: 'center', pb: 3, width: '94%', pl: 2 } }}>
          <Button variant="outlined" sx={{ mr: 2, backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(80, 82, 178, 1)', textTransform: 'none', padding: '0.75em 2em', border: '1px solid rgba(80, 82, 178, 1)', '@media (max-width: 600px)': { width: '100%' }, }}>
            Contact support
          </Button>
          <Button variant="contained" onClick={handleClose} sx={{ backgroundColor: 'rgba(80, 82, 178, 1)', fontFamily: "Nunito", textTransform: 'none', padding: '0.75em 3em', '@media (max-width: 600px)': { width: '100%' } }}>
            Next
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default Popup;
