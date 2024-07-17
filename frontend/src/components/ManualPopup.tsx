"use client";
import React, { useState } from 'react';
import { Box, Button, Typography, Modal, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
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

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="h6" component="h2">
            Install Manually
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography sx={{ mt: 2 }}>1. Copy the pixel code</Typography>
        <Box
          component="pre"
          sx={{
            bgcolor: '#f5f5f5',
            p: 2,
            mt: 1,
            borderRadius: '4px',
            position: 'relative',
          }}
        >
          <IconButton
            onClick={handleCopy}
            sx={{ position: 'absolute', right: '8px', top: '8px' }}
          >
            <ContentCopyIcon />
          </IconButton>
          <code>{pixelCode}</code>
        </Box>
        <Typography sx={{ mt: 2 }}>
          2. Paste the pixel in your website
        </Typography>
        <Typography sx={{ mt: 2 }}>
          3. Verify Your Pixel
        </Typography>
        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button variant="outlined" sx={{ mr: 2 }}>
            Contact support
          </Button>
          <Button variant="contained" onClick={handleClose}>
            Next
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default Popup;
