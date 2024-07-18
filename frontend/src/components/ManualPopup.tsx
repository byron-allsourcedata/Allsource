"use client";
import React, { useState } from 'react';
import { Box, Button, Typography, Modal, IconButton, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Padding } from '@mui/icons-material';
import Image from 'next/image';


const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '40%',
  height: '90%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

const maintext = {
  fontFamily: 'Nunito',
  fontSize: '16',
  fontWeight: '600',
  lineHeight: '19.6px',
  textAlign: 'left',
  color: 'rgba(0, 0, 0, 1)',
  padding: '0em 0em 0em 1em'
}
const subtext = {
  fontFamily: 'Nunito',
  fontSize: '14',
  fontWeight: '400',
  lineHeight: '16.8px',
  textAlign: 'left',
  color: 'rgba(0, 0, 0, 1)',
  paddingTop: '1em',
  paddingLeft: '2.9em'
}

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

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Box display="flex" justifyContent="space-between" sx={{ width: '100%', paddingBottom: '1em' }}>
          <Typography variant="h6" component="h2" sx={{fontFamily: 'Nunito', fontSize: '14', fontWeight: '700', lineHeight: '19.1px', textAlign: 'left', color: 'rgba(28, 28, 28, 1)'}}>
            Install Manually
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '2em 0em 0em 0em', justifyContent: 'start'}}>
        <Image src='/1.svg' alt='1' width={28} height={28}/>
        <Typography sx={maintext}>Copy the pixel code</Typography>
        </Box>
        <Box
          component="pre"
          sx={{
            backgroundColor: '#ffffff',
            p: 2,
            position: 'relative',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            border: '1px solid rgba(228, 228, 228, 1)',
            borderRadius: '10px',
            marginLeft: '3em'
          }}
        >
          <IconButton
            onClick={handleCopy}
            sx={{ position: 'absolute', right: '-5px', top: '-5px' }}
          >
            <ContentCopyIcon />
          </IconButton>
          <code style={{ color: '#000000'}}>{pixelCode}</code>
        </Box>
        <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '2em 0em 0em 0em', justifyContent: 'start'}}>
        <Image src='/2.svg' alt='2' width={28} height={28}/>
        <Typography sx={maintext}>Paste the pixel in your website</Typography>
        </Box>
        <Typography sx={subtext}> Paste the above pixel in the header of your website. The header script starts with &lt;head&gt; and ends with &lt;/head&gt; </Typography>
        <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '2em 0em 0em 0em', justifyContent: 'start'}}>
        <Image src='/3.svg' alt='3' width={28} height={28}/>
        <Typography sx={maintext}>Verify Your Pixel</Typography>
        </Box>
        <Typography sx={subtext}> Once the pixel is pasted in your website, wait for 10-15 mins and verify your pixel.</Typography>


        <Box display="flex" justifyContent="flex-end" mt={3} sx={{ position: 'absolute', bottom: '8px', right: '8px' }}>
          <Button variant="outlined" sx={{ mr: 2, backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(80, 82, 178, 1)', textTransform: 'none', padding: '1em 2em', border: '1px solid rgba(80, 82, 178, 1)' }}>
            Contact support
          </Button>
          <Button variant="contained" onClick={handleClose} sx={{ mr: 2, backgroundColor: 'rgba(80, 82, 178, 1)', fontFamily: "Nunito", textTransform: 'none', padding: '1em 3em' }}>
            Next
          </Button>
        </Box>
        <Divider sx={{ position: 'absolute', bottom: '5em', width: '94.5%', }} />
      </Box>
    </Modal>
  );
};

export default Popup;
