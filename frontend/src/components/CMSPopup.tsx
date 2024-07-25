"use client";
import React from 'react';
import { Box, Button, Typography, Modal, IconButton, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import styled from 'styled-components';

const StyledOl = styled.ol`
  list-style-type: decimal;
  padding-left: 1.5em;
`;
const StyledLi = styled.li`
  margin-bottom: 0.5em;
`;
const StyledLink = styled.a`
  color: blue;
  text-decoration: underline;
`;
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
  display: 'flex',
  flexDirection: 'column',
};
const CenteredImage = styled.div`
  display: flex;
  justify-content: center;
  height: 100vh;
`;

const StyledImage = styled.img`
  width: 500px;
  height: 300px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

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
  pixelCode: string;
}

const Popup: React.FC<PopupProps> = ({ open, handleClose, pixelCode }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(pixelCode);
    alert('Copied to clipboard');
  };
const StyledOrderedListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <StyledLi>{children}</StyledLi>;
};


const StyledOrderedList = ({ children }: { children: React.ReactNode }) => {
  return <StyledOl>{children}</StyledOl>;
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
          <Typography variant="h6" component="h2" sx={{ fontFamily: 'Nunito', fontSize: '14px', fontWeight: '700', lineHeight: '19.1px', textAlign: 'left', color: 'rgba(28, 28, 28, 1)' }}>
            Install on CMS
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflowY: 'auto', paddingBottom: '4em' }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '2em 0em 0em 0em', justifyContent: 'start' }}>
            <Image src='/1.svg' alt='1' width={28} height={28} />
            <Typography sx={maintext}>Copy the verification tag</Typography>
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
              marginLeft: '3em',
              maxHeight: '20em',
              overflowY: 'auto',
            }}
          >
            <IconButton
              onClick={handleCopy}
              sx={{ position: 'absolute', right: '10px', top: '10px' }}
            >
              <ContentCopyIcon />
            </IconButton>
            <code style={{ color: '#000000' }}>{pixelCode}</code>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '2em 0em 0em 0em', justifyContent: 'start' }}>
            <Image src='/2.svg' alt='2' width={28} height={28} />
            <Typography sx={maintext}>To add the code to your website header or footer, take the following steps:</Typography>
          </Box>
          <StyledOrderedList>
            <StyledOrderedListItem>
              Install and activate the free <StyledLink href="https://wordpress.com/plugins/insert-headers-and-footers">Insert Headers and Footers plugin</StyledLink> by WPCode.
            </StyledOrderedListItem>
            <StyledOrderedListItem>On the left-hand side of your dashboard, navigate to Code Snippets → Header & Footer.</StyledOrderedListItem>
            <StyledOrderedListItem>Paste the code into the Header or Footer box and click the “Save Changes” button.</StyledOrderedListItem>
        </StyledOrderedList>
        <CenteredImage>
          <StyledImage src="/install_cms3.png" alt="Install on CMS" />
        </CenteredImage>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: '1em', width: '100%', paddingTop: '1em' }}>
          <Button variant="outlined" sx={{ backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(80, 82, 178, 1)', textTransform: 'none', padding: '1em 2em', border: '1px solid rgba(80, 82, 178, 1)' }}>
            Contact support
          </Button>
          <Button variant="contained" onClick={handleClose} sx={{ backgroundColor: 'rgba(80, 82, 178, 1)', fontFamily: "Nunito", textTransform: 'none', padding: '1em 3em' }}>
            Next
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default Popup;
