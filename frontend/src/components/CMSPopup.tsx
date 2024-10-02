"use client";
import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Modal, IconButton, Divider, Grid, Link, Input, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import { styles } from '../css/cmsStyles';
import styled from 'styled-components';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from './ToastNotification';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

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
  fontFamily: 'Nunito Sans',
  fontSize: '14px',
  fontWeight: '500',
  lineHeight: '19.6px',
  color: 'rgba(74, 74, 74, 1) !important',
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
  color: 'rgba(74, 74, 74, 1) !important',
  textWrap: 'wrap',
  paddingTop: '1em',
  paddingBottom: '0.25em',
};

const maintext = {
  fontFamily: 'Nunito Sans',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '19.6px',
  color: 'rgba(0, 0, 0, 1)',
  paddingTop: '1em',
  paddingBottom: '0.75em',
};

const subtext = {
  fontFamily: 'Nunito Sans',
  fontSize: '15px',
  fontWeight: '600',
  lineHeight: '19.6px',
  textAlign: 'center',
  color: 'rgba(74, 74, 74, 1)',
  paddingTop: '0.25em',
  '@media (max-width: 600px)': { textAlign: 'left', fontSize: '14px' }
};

interface CmsData {
  manual?: string;
  pixel_client_id?: string;
}

interface PopupProps {
  open: boolean;
  handleClose: () => void;
  pixelCode: string;
  pixel_client_id: string;
}

const Popup: React.FC<PopupProps> = ({ open, handleClose, pixelCode, pixel_client_id, }) => {
  const [selectedCMS, setSelectedCMS] = useState<string | null>(null);
  const [headerTitle, setHeaderTitle] = useState<string>('Install on CMS');
  const [shop_domain, setDomain] = useState('');
  const [access_token, setAccessToken] = useState('');
  const [errors, setErrors] = useState({
    access_token: "",
    shop_domain: "",
  });

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const response = await axiosInstance.get('/integrations/credentials/shopify');
        if (response.status === 200) {
          setDomain(response.data.shop_domain);
          setAccessToken(response.data.access_token);
        } else {
          console.error(`Unexpected status code: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching credentials:', error);
      }
    };
    fetchCredentials()
  }, [])
  const [isFocused, setIsFocused] = useState(true);
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(pixel_client_id);
    showToast('Site ID copied to clipboard!');
  };

  const handleButtonClick = async (cms: string) => {
    setSelectedCMS(cms);
    setHeaderTitle(`Install with ${cms}`);
  };

  const handleBackClick = () => {
    setSelectedCMS(null);
    setHeaderTitle('Install on CMS');
  };

  const validateField = (
    value: string | undefined,
    type: "access_token" | "shop_domain"
  ): string => {
    const stringValue = value ? value.trim() : "";

    switch (type) {
      case "access_token":
        return stringValue ? "" : "Access Token is required";
      case "shop_domain":
        return stringValue ? "" : "Shop Domain is required";
      default:
        return "";
    }
  };


  const handleSubmit = async () => {
    const newErrors = {
      access_token: validateField(access_token, "access_token"),
      shop_domain: validateField(shop_domain, "shop_domain"),
    };
    setErrors(newErrors);

    if (newErrors.access_token || newErrors.shop_domain) {
      return;
    }

    const accessToken = localStorage.getItem('token');
    if (!accessToken) return;

    const body: Record<string, any> = {
      shopify: {
        shop_domain: shop_domain.trim(),
        access_token: access_token.trim()
      },
      pixel_install: true
    };

    try {
      const response = await axiosInstance.post("/integrations/", body, {
        params: {
          service_name: "shopify",
        },
      });

      if (response.status === 200) {
        showToast('Successfully installed pixel');
        handleClose()
      } else {
        showErrorToast('Failed to install pixel');
        handleClose()
      }
    } catch (error) {
      console.error("An error occurred:", error);
      showErrorToast('An error occurred while installing the pixel');
    }
  };


  const isFormValid = () => {
    const errors = {
      access_token: validateField(access_token, "access_token"),
      shop_domain: validateField(shop_domain, "shop_domain"),
    };

    return (
      !errors.shop_domain && !errors.access_token
    );
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
          <Typography className='first-sub-title'
            sx={{
              textAlign: 'left',
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


        <Box sx={{ flex: 1, overflowY: 'auto', }}>
          {selectedCMS ? (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', height: '100%' }} >
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 1, pt: 1 }}>
                  <Button
                    onClick={handleBackClick}
                    sx={{
                      marginTop: '1em',
                      padding: 0,
                      minWidth: 'auto',
                      width: 'auto',
                    }}
                  >
                    <ArrowBackIcon sx={{ color: 'rgba(80, 82, 178, 1)', padding: 0 }} />
                  </Button>
                  <Typography className='table-data' sx={{ ...subtext, marginTop: '0.75em' }}>
                    Follow the instructions to install in Maximiz
                  </Typography>
                </Box>

                {selectedCMS === 'Shopify' ? (
                  <>
                    <Box sx={{ flex: 1, overflowY: 'auto', paddingBottom: '1em', height: '100%' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 0, justifyContent: 'start' }}>
                        <Image src='/1.svg' alt='1' width={28} height={28} />
                        <Typography className='first-sub-title' sx={{ ...maintext, textAlign: 'left', padding: '1em 0em 1em 1em', fontWeight: '500' }}>Enter your Shopify shop domain in the designated field. This allows our system to identify your store.</Typography>
                      </Box>
                      <Box
                        component="pre"
                        sx={{ display: 'flex', width: '100%', justifyContent: 'center', margin: 0, pl: 1 }}
                      >
                        <TextField
                          fullWidth
                          label="Shop Domain"
                          variant="outlined"
                          placeholder='Enter your Shop Domain'
                          margin="normal"
                          value={isFocused
                            ? (shop_domain ? shop_domain.replace(/^https?:\/\//, "") : "")
                            : (shop_domain ? `https://${shop_domain.replace(/^https?:\/\//, "")}` : "https://")
                          }
                          sx={styles.formField}
                          onFocus={handleFocus}
                          onBlur={handleBlur}
                          InputProps={{ sx: styles.formInput }}
                          onChange={(e) => setDomain(e.target.value)}
                          InputLabelProps={{ sx: styles.inputLabel }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'start' }}>
                        <Image src='/2.svg' alt='2' width={28} height={28} />
                        <Typography className='first-sub-title' sx={{ ...maintext, textAlign: 'left', padding: '1em 0em 1em 1em', fontWeight: '500', }}>Enter your Shopify API access token. This token is necessary for secure communication between your Shopify store and our application.</Typography>
                      </Box>
                      <Box
                        component="pre"
                        sx={{ display: 'flex', width: '100%', justifyContent: 'center', margin: 0, pl: 1 }}
                      >
                        <TextField
                          InputProps={{ sx: styles.formInput }}
                          fullWidth
                          label="Access Token"
                          variant="outlined"
                          placeholder='Enter your Access Token'
                          margin="normal"
                          sx={styles.formField}
                          value={access_token}
                          onChange={(e) => setAccessToken(e.target.value)}
                          InputLabelProps={{ sx: styles.inputLabel }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'start' }}>
                        <Image src='/3.svg' alt='3' width={28} height={28} />
                        <Typography className='first-sub-title' sx={{ ...maintext, textAlign: 'left', padding: '2em 1em 1em', fontWeight: '500', '@media (max-width: 600px)': { padding: '1em' } }}>Once you have submitted the required information, our system will automatically install the script on your Shopify store. You don’t need to take any further action.</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', maxHeight: '100%', padding: '0em 1em' }}>
                      <Button
                        fullWidth
                        variant="contained"
                        sx={{
                          ...styles.submitButton,
                          marginTop: 'auto',
                          opacity: isFormValid() ? 1 : 0.6,
                          pointerEvents: isFormValid() ? "auto" : "none",
                          backgroundColor: isFormValid()
                            ? "rgba(80, 82, 178, 1)"
                            : "rgba(80, 82, 178, 0.4)",
                          "&.Mui-disabled": {
                            backgroundColor: "rgba(80, 82, 178, 0.6)",
                            color: "#fff",
                          },
                        }}
                        onClick={handleSubmit}
                        disabled={!isFormValid}
                      >
                        Install Pixel
                      </Button>
                    </Box>
                  </>
                ) : (
                  <>
                    <Box sx={{ flex: 1, overflowY: 'auto', paddingBottom: '2em', }}>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '1em 0em 0em 0em', justifyContent: 'start' }}>
                        <Image src='/1.svg' alt='1' width={28} height={28} />
                        <Typography className='first-sub-title' sx={{ ...maintext, textAlign: 'center', padding: '1em 0em 1em 1em', fontWeight: '500', '@media (max-width: 600px)': { textAlign: 'left' } }}>Add our offical Maximiz pixel plugin to your Wordpress site.</Typography>
                      </Box>
                      <Box>
                        <Button component={Link} href="https://maximiz-data.s3.us-east-2.amazonaws.com/maximiz.zip" variant="outlined" sx={{ ml: 5, backgroundColor: 'rgba(80, 82, 178, 1)', color: 'rgba(255, 255, 255, 1)', textTransform: 'none', padding: '1em 2em', border: '1px solid rgba(80, 82, 178, 1)', '&:hover': { backgroundColor: 'rgba(80, 82, 178, 1)' } }}>
                          <Typography className='second-sub-title' sx={{ fontSize: '14px !important', color: '#fff !important', textAlign: 'left', textWrap: 'wrap' }}>Get plugin</Typography>
                        </Button>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '1em 0em 0em 0em', justifyContent: 'start', maxWidth: '100%', '@media (max-width: 600px)': { maxWidth: '95%' } }}>
                        <Box sx={{ paddingBottom: 11.5 }}>
                          <Image src='/2.svg' alt='2' width={28} height={28} />
                        </Box>
                        <Typography className='first-sub-title'
                          sx={{
                            ...maintext,
                            textAlign: 'left',
                            padding: '1em',
                            fontWeight: '500',
                            maxWidth: '95%',
                            overflowWrap: 'break-word',
                            wordWrap: 'break-word',
                            whiteSpace: 'normal',
                          }}
                        >
                          Enter your site ID:{" "}
                          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                            <Box
                              component="pre"
                              sx={{
                                backgroundColor: '#ffffff',
                                border: '1px solid rgba(228, 228, 228, 1)',
                                borderRadius: '10px',
                                maxHeight: '10em',
                                overflowY: 'auto',
                                position: 'relative',
                                padding: '0.75em',
                                maxWidth: '100%',
                                '@media (max-width: 600px)': {
                                  maxHeight: '14em',
                                },
                              }}
                            >
                              <code
                                style={{
                                  color: '#000000',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  fontFamily: 'Nunito Sans',
                                  textWrap: 'nowrap',
                                }}
                              >
                                {pixel_client_id}
                              </code>

                            </Box>
                            <Box sx={{ display: 'flex', padding: '0px' }}>
                              <IconButton
                                onClick={handleCopyToClipboard}
                              >
                                <ContentCopyIcon />
                              </IconButton>
                            </Box>
                          </Box>
                          during the checkout process
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '1em 0em 0em 0em', justifyContent: 'start' }}>
                        <Image src='/3.svg' alt='3' width={28} height={28} />
                        <Typography className='first-sub-title' sx={{ ...maintext, textAlign: 'left', padding: '1em', fontWeight: '500' }}>Verify if Maximiz is receiving data from your site</Typography>
                      </Box>
                      <Button variant="outlined" sx={{ ml: 5, backgroundColor: 'rgba(255, 255, 255, 1)',  textTransform: 'none', padding: '1em 2em', border: '1px solid rgba(80, 82, 178, 1)' }}>
                        <Typography className='second-sub-title' sx={{ fontSize: '14px !important', color: 'rgba(80, 82, 178, 1) !important', lineHeight: '22.4px', textAlign: 'left', textWrap: 'wrap' }}>View installation</Typography>
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            </>
          ) : (
            <><Box sx={{ display: 'flex', width: '100%', pt: '2rem' }}>
                <Typography className='first-sub-title'>
                  Setup Maximiz by connecting with one of the following CMS
                </Typography>
              </Box><Box
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
                        style={{ marginRight: 4 }} />
                      <Typography className='second-sub-title' sx={typographyGoogle}>Shopify</Typography>
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
                        height={38} />
                      <Typography className='second-sub-title' sx={{ ...typographyStyles, pt: 1.75 }}>
                        WordPress
                      </Typography>
                    </Button>
                  </Grid>
                </Box></>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default Popup;
