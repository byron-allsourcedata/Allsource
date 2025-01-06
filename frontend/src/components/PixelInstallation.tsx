"use client";
import { Box, Grid, Typography, Button } from "@mui/material";
import Image from "next/image";
import axiosInterceptorInstance from "../axios/axiosInterceptorInstance";
import { AxiosError } from "axios";
import { useSlider } from '../context/SliderContext';
import React, { useEffect, useState, useMemo } from "react";
import ManualPopup from '../components/ManualPopup';
import GoogleTagPopup from '../components/GoogleTagPopup';
import CRMPopup from "./CMSPopup";
import CustomizedProgressBar from "./CustomizedProgressBar";
import CustomTooltip from "./customToolTip";



interface CmsData {
  manual?: string;
  pixel_client_id?: string;
}

const PixelInstallation: React.FC = () => {
  const { setShowSlider } = useSlider();
  const [isLoading, setIsLoading] = useState(false);

  const installManually = async () => {
    try {
      setIsLoading(true)
      const response = await axiosInterceptorInstance.get('/install-pixel/manually');
      setPixelCode(response.data.manual);
      setOpen(true);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 403) {
        if (error.response.data.status === 'NEED_BOOK_CALL') {
          sessionStorage.setItem('is_slider_opened', 'true');
          setShowSlider(true);
        } else {
          sessionStorage.setItem('is_slider_opened', 'false');
          setShowSlider(false);
        }
      }
    }
    finally {
      setIsLoading(false)
    }
  };

  const installGoogleTag = async () => {
    try {
      setIsLoading(true)
      const response = await axiosInterceptorInstance.get('/install-pixel/google-tag');
      setGoogleOpen(true)
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 403) {
        if (error.response.data.status === 'NEED_BOOK_CALL') {
          sessionStorage.setItem('is_slider_opened', 'true');
          setShowSlider(true);
        } else {
          sessionStorage.setItem('is_slider_opened', 'false');
          setShowSlider(false);
        }
      }
    }
    finally {
      setIsLoading(false)
    }
  };

  const [openmanually, setOpen] = useState(false);
  const [pixelCode, setPixelCode] = useState('');
  const [opengoogle, setGoogleOpen] = useState(false);
  const [cmsData, setCmsData] = useState<CmsData>({});
  const [opencrm, setCMSOpen] = useState(false);
  const sourcePlatform = useMemo(() => {
    if (typeof window !== 'undefined') {
      const savedMe = sessionStorage.getItem('me');
      if (savedMe) {
        try {
          const parsed = JSON.parse(savedMe);
          return parsed.source_platform || '';
        } catch (error) {}
      }
    }
    return '';
  }, [typeof window !== 'undefined' ? sessionStorage.getItem('me') : null]);

  useEffect(() => {
    const handleRedirect = async () => {
      const query = new URLSearchParams(window.location.search);
      const authorizationCode = query.get('code');

      if (authorizationCode) {
        try {
          setGoogleOpen(true);
        } catch (error) {
        }
      }
    };

    handleRedirect();
  }, []);


  const handleManualClose = () => setOpen(false);
  const handleGoogleClose = () => setGoogleOpen(false);
  const handleCRMClose = () => setCMSOpen(false);



  const installCMS = async () => {
    try {
      setIsLoading(true)
      const response = await axiosInterceptorInstance.get('/install-pixel/cms');
      setCmsData(response.data);
      setCMSOpen(true);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 403) {
        if (error.response.data.status === 'NEED_BOOK_CALL') {
          sessionStorage.setItem('is_slider_opened', 'true');
          setShowSlider(true);
        } else {
          sessionStorage.setItem('is_slider_opened', 'false');
          setShowSlider(false);
        }
      }
    }
    finally {
      setIsLoading(false)
    }
  };

  return (
    <Box sx={{
      padding: '1.25em',
      border: '1px solid #e4e4e4',
      borderRadius: '8px',
      backgroundColor: 'rgba(247, 247, 247, 1)',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      marginBottom: '2rem',
      '@media (max-width: 1199px)': {
        padding: '1.5rem 1rem',
        marginBottom: '1.5rem',
      }
    }}>
      <Typography variant="h6" component="div" mb={1} className="first-sub-title" sx={{
        fontFamily: 'Nunito Sans',
        fontWeight: '700',
        lineHeight: '21.82px',
        textAlign: 'left',
        color: '#1c1c1c',
        fontSize: '1rem',
        '@media (max-width: 1199px)': {
          fontSize: '1rem',
          lineHeight: 'normal',
          marginBottom: '0.25rem'
        }
      }}>
        1. Pixel Installation
      </Typography>
      <Typography variant="body2" color="textSecondary" className="table-data" mb={2}
        sx={{
          fontFamily: 'Nunito Sans',
          fontWeight: '500',
          color: 'rgba(128, 128, 128, 1)',
          fontSize: '12px',
          '@media (max-width: 1199px)': {
            fontSize: '0.875rem',
            lineHeight: 'normal',
          }
        }}
      >
        Select how you would like to install the pixel
      </Typography>
      <Grid container md={12}>
        <Box sx={{
          display: 'flex', flexDirection: 'row', width: '100%', gap: 2, '@media (max-width: 899px)': {
            flexDirection: 'column'
          }
        }}>
          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              fullWidth
              onClick={installManually}
              sx={{
                ...buttonStyles,
                ...(sourcePlatform === 'shopify' && {
                  color: 'grey',
                  borderColor: 'grey',
                  pointerEvents: 'none',
                  backgroundColor: 'lightgrey'
                })
              }}
              disabled={sourcePlatform === 'shopify'}
            >
              <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'space-between', flexDirection: 'row' }}>
                <Image src={'/install_manually.svg'} alt="Install Manually" width={24} height={24} />
                <CustomTooltip title={"Manually install to have full control over setup and configuration."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2/how-do-i-install-maximiz-pixel-on-my-website" />
              </Box>
              <Typography className="second-sub-title" sx={typographyStyles}>Install Manually</Typography>
            </Button>
            <ManualPopup open={openmanually} handleClose={handleManualClose} pixelCode={pixelCode} />
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              fullWidth
              onClick={installGoogleTag}
              sx={{
                ...buttonGoogle,
                ...(sourcePlatform === 'shopify' && {
                  color: 'grey',
                  borderColor: 'grey',
                  pointerEvents: 'none',
                  backgroundColor: 'lightgrey'
                })
              }}
              disabled={sourcePlatform === 'shopify'}
            >
              <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'space-between', flexDirection: 'row' }}>
                <Image src={'/install_gtm.svg'} className="icon-img" alt="Install on Google Tag Manager" width={24} height={24} />
                <CustomTooltip title={"Quickly integrate using Google Tag Manager for seamless setup."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2/how-do-i-install-my-pixel-on-google-tag" />
              </Box>
              <Typography className="second-sub-title" sx={typographyGoogle}>Install on Google Tag Manager</Typography>
            </Button>
            <GoogleTagPopup open={opengoogle} handleClose={handleGoogleClose} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button variant="outlined" fullWidth onClick={installCMS} sx={buttonStyles}>
              <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'space-between', flexDirection: 'row' }}>
                <Box sx={{ display: 'flex', width: '100%', gap: 0.25 }}>
                  <Image src={'/install_cms1.svg'} alt="Install on CMS" width={24} height={24} />
                  <Image src={'/install_cms2.svg'} alt="Install on CMS" width={24} height={24} />
                  <Image src={'/bigcommerce-icon.svg'} className="icon-img" alt="Install on CMS" width={24} height={24} />
                </Box>
                <CustomTooltip title={"Install easily on your CMS for a streamlined integration experience."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/get-started/installation-and-setup-2/how-do-i-install-maximiz-pixel-on-shopify-store" />
              </Box>
              <Typography className="second-sub-title" sx={{ ...typographyStyles, pt: '9px' }}>Install on CMS</Typography>
            </Button>
            <CRMPopup open={opencrm} handleClose={handleCRMClose} pixelCode={cmsData.manual || ''} pixel_client_id={cmsData.pixel_client_id || ''} />
          </Grid>
        </Box>
      </Grid>
      {isLoading && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1,
        }}>
          <CustomizedProgressBar />
        </Box>
      )}
    </Box>
  );
};


const buttonStyles = {
  backgroundColor: '#fff',
  display: "flex",
  flexDirection: 'column',
  alignItems: 'self-start',
  padding: '0.875rem',
  borderColor: 'rgba(228, 228, 228, 1)',
  border: '1px solid rgba(228, 228, 228, 1)',
  width: '100%',
  '@media (max-width: 1199px)': {
    maxHeight: '82px',
  },
};

const buttonGoogle = {
  backgroundColor: '#fff',
  display: "flex",
  flexDirection: 'column',
  alignItems: 'self-start',
  padding: '0.875rem',
  borderColor: 'rgba(228, 228, 228, 1)',
  border: '1px solid rgba(228, 228, 228, 1)',
  width: '100%',
  '@media (max-width: 1199px)': {
    maxHeight: '82px',
  }
};


const typographyStyles = {
  textTransform: 'none',
  fontFamily: 'Nunito Sans',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '19.6px',
  color: 'rgba(74, 74, 74, 1)',
  textWrap: 'nowrap',
  paddingTop: '0.625rem',
  '@media (max-width: 1199px)': {
    paddingTop: '0.5rem',
    paddingBottom: 0
  },
  '@media (max-width: 1300px)': {
    fontSize: '13px'
  }
};

const typographyGoogle = {
  textTransform: 'none',
  fontFamily: 'Nunito Sans',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '19.6px',
  color: 'rgba(74, 74, 74, 1)',
  textWrap: 'nowrap',
  paddingTop: '0.625rem',
  '@media (max-width: 1199px)': {
    paddingTop: '0.5rem'
  },
  '@media (max-width: 1300px)': {
    fontSize: '13px'
  }
};

export default PixelInstallation;