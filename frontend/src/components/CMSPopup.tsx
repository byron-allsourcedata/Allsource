"use client";
import React, { useState } from 'react';
import { Box, Button, Typography, Modal, IconButton, Divider, Grid } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import styled from 'styled-components';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

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
  position: 'fixed' as 'fixed',
  top: 0,
  right: 0,
  width: '40%',
  height: '95%',
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
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '19.6px',
  color: 'rgba(74, 74, 74, 1)',
  paddingTop: '1em',
  paddingBottom: '0.75em',
};

const subtext = {
  fontFamily: 'Nunito',
  fontSize: '14px',
  fontWeight: '400',
  lineHeight: '16.8px',
  textAlign: 'left',
  color: 'rgba(0, 0, 0, 1)',
  paddingTop: '0.5em',

};

interface PopupProps {
  open: boolean;
  handleClose: () => void;
  pixelCode: string;
}

const Popup: React.FC<PopupProps> = ({ open, handleClose, pixelCode }) => {
  const [selectedCMS, setSelectedCMS] = useState<string | null>(null);
  const [headerTitle, setHeaderTitle] = useState<string>('Install on CMS');

  const handleCopy = () => {
    navigator.clipboard.writeText(pixelCode);
    alert('Copied to clipboard');
  };

  const handleButtonClick = async (cms: string) => {
    setSelectedCMS(cms);
    setHeaderTitle(`Install with ${cms}`);
  };

  const handleBackClick = () => {
    setSelectedCMS(null);
    setHeaderTitle('Install on CMS');
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={{ ...style, ...(open ? openStyle : {}) }}>
        <Box display="flex" justifyContent="space-between" sx={{ width: '100%', paddingBottom: '0.5em', alignItems: 'center' }}>
          <Typography
            sx={{
              fontFamily: 'Nunito',
              fontSize: '14px',
              fontWeight: '600',
              lineHeight: '19.6px',
              textAlign: 'left',
              color: 'rgba(28, 28, 28, 1)',
              '@media (max-width: 600px)': { padding: 2 },
            }}
          >
            {headerTitle}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        <Box sx={{ flex: 1, overflowY: 'auto', paddingBottom: '4em' }}>
          {selectedCMS ? (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', }} >
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 1 }}>
                  <Button onClick={handleBackClick} sx={{ marginTop: '1em', p: 0}}>
                    <ArrowBackIcon sx={{color: 'rgba(80, 82, 178, 1)'}} />
                  </Button>
                  <Typography sx={{ ...subtext, marginTop: '0.75em' }}>
                    Follow the instructions to install in Maximiz
                  </Typography>
                </Box>
                {selectedCMS === 'Shopify' ? (
                  <>
                    <Box sx={{ flex: 1, overflowY: 'auto', paddingBottom: '2em', pl: 2.25  }}>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '1em 0em 0em 0em', justifyContent: 'start' }}>
                        <Image src='/1.svg' alt='1' width={28} height={28} />
                        <Typography sx={{ ...maintext, textAlign: 'center', padding: '1em' }}>Copy the pixel code</Typography>
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
                          mr: 2
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
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '1em 0em 0em 0em', justifyContent: 'start' }}>
                        <Image src='/2.svg' alt='2' width={28} height={28} />
                        <Typography sx={{ ...maintext, textAlign: 'left', padding: '1em' }}>Follow installation guide</Typography>
                      </Box>
                      <Button variant="outlined" sx={{ml: 5,backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(80, 82, 178, 1)', textTransform: 'none', padding: '1em 2em', border: '1px solid rgba(80, 82, 178, 1)' }}>
                        <Typography sx={{fontFamily: 'Nunito', fontSize: '16px', fontWeight: '600', lineHeight: '22.4px'}}>View installation guide</Typography>
                      </Button>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '1em 0em 0em 0em', justifyContent: 'start' }}>
                        <Image src='/3.svg' alt='3' width={28} height={28} />
                        <Typography sx={{ ...maintext, textAlign: 'left',  padding: '1em' }}>Verify if Maximiz is receiving data from your site</Typography>
                      </Box>
                      <Button variant="outlined" sx={{ml: 5,backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(80, 82, 178, 1)', textTransform: 'none', padding: '1em 2em', border: '1px solid rgba(80, 82, 178, 1)' }}>
                        <Typography sx={{fontFamily: 'Nunito', fontSize: '16px', fontWeight: '600', lineHeight: '22.4px', textAlign: 'left', textWrap: 'wrap'}}>View installation</Typography>
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Typography> WORDPRESS</Typography>
                )}
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '2em 0em 0em 0em',
                justifyContent: 'start',
                gap: 3,
                '@media (max-width: 600px)': {
                  flexDirection: 'column',
                },
              }}
            >
              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleButtonClick('Shopify')}
                  sx={{
                    ...buttonGoogle,
                    '@media (max-width: 600px)': {
                      width: '90%',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'start',
                      gap: 1
                    },
                  }}
                >
                  <Image
                    src={'/install_cms1.svg'}
                    alt="Install on CMS"
                    width={38}
                    height={38}
                    style={{ marginRight: 4 }}
                  />
                  <Typography sx={typographyGoogle}>Shopify</Typography>
                </Button>
              </Grid>
              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleButtonClick('WordPress')}
                  sx={{
                    ...buttonStyles,
                    '@media (max-width: 600px)': {
                      width: '90%',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'start',
                      gap: 1
                    },
                  }}
                >
                  <Image
                    src={'/install_cms2.svg'}
                    alt="Install on CMS"
                    width={38}
                    height={38}
                  />
                  <Typography sx={{ ...typographyStyles, pt: 1.75 }}>
                    WordPress
                  </Typography>
                </Button>
              </Grid>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default Popup;
