import { Box, Grid, Typography, Button } from "@mui/material";
import Image from "next/image";
import axiosInterceptorInstance from "../axios/axiosInterceptorInstance";
import { AxiosError } from "axios";
import { useSlider } from '../context/SliderContext';
import React from "react";

const PixelInstallation: React.FC = () => {
  const { setShowSlider } = useSlider();

  const installManually = async () => {
    try {
      const response = await axiosInterceptorInstance.get('/install-pixel/manually');
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 403) {
        if (error.response.data.status === 'NEED_BOOK_CALL') {
          sessionStorage.setItem('is_slider_opened', 'true');
          setShowSlider(true);
        } else {
          sessionStorage.setItem('is_slider_opened', 'false');
          setShowSlider(false); 
        }
      } else {
        console.error('Error fetching data:', error);
      }
    }
  };

  const installGoogleTag = async () => {
    try {
      const response = await axiosInterceptorInstance.get('/install-pixel/google-tag');
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 403) {
        if (error.response.data.status === 'NEED_BOOK_CALL') {
          sessionStorage.setItem('is_slider_opened', 'true');
          setShowSlider(true);
        } else {
          sessionStorage.setItem('is_slider_opened', 'false');
          setShowSlider(false);
        }
      } else {
        console.error('Error fetching data:', error);
      }
    }
  };

  const installCMS = async () => {
    try {
      const response = await axiosInterceptorInstance.get('/install-pixel/cms');
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 403) {
        if (error.response.data.status === 'NEED_BOOK_CALL') {
          sessionStorage.setItem('is_slider_opened', 'true');
          setShowSlider(true);
        } else {
          sessionStorage.setItem('is_slider_opened', 'false');
          setShowSlider(false);
        }
      } else {
        console.error('Error fetching data:', error);
      }
    }
  };

  return (
    <Box sx={{ padding: '0.5rem', border: '1px solid #e4e4e4', borderRadius: '8px', backgroundColor: 'rgba(247, 247, 247, 1)', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', marginBottom: '2rem' }}>
      <Typography variant="h6" component="div" mb={2}>
        1. Pixel Installation
      </Typography>
      <Typography variant="body2" color="textSecondary" mb={2}>
        Select how you would like to install the pixel
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Button variant="outlined" fullWidth onClick={installManually} sx={buttonStyles}>
            <Image src={'/install_manually.svg'} alt="Install Manually" width={32} height={32} />
            <Typography sx={typographyStyles}>Install Manually</Typography>
          </Button>
        </Grid>
        <Grid item xs={12} md={4} width={700}>
          <Button variant="outlined" fullWidth onClick={installGoogleTag} sx={buttonGoogle}>
            <Image src={'/install_gtm.svg'} alt="Install on Google Tag Manager" width={24} height={24} />
            <Typography sx={typographyGoogle}>Install on Google Tag Manager</Typography>
          </Button>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button variant="outlined" fullWidth onClick={installCMS} sx={buttonStyles}>
            <Box>
              <Image src={'/install_cms1.svg'} alt="Install on CMS" width={24} height={24} />
              <Image src={'/install_cms2.svg'} alt="Install on CMS" width={24} height={24} />
            </Box>
            <Typography sx={typographyStyles}>Install on CMS</Typography>
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};


const buttonStyles = {
  backgroundColor: '#fff',
  display: "flex",
  flexDirection: 'column',
  alignItems: 'self-start',
  padding: '1em',
  borderColor: 'rgba(228, 228, 228, 1)',
  border: '1px solid rgba(228, 228, 228, 1)',
  width: '100%', 
};

const buttonGoogle = {
  backgroundColor: '#fff',
  display: "flex",
  flexDirection: 'column',
  alignItems: 'self-start',
  padding: '1em 2em 1.5em 1em', 
  borderColor: 'rgba(228, 228, 228, 1)',
  border: '1px solid rgba(228, 228, 228, 1)',
  width: '100%', 
};


const typographyStyles = {
  textTransform: 'none',
  fontFamily: 'Nunito',
  fontSize: '14px',
  fontWeight: '400',
  lineHeight: '19.6px',
  color: 'rgba(74, 74, 74, 1)',
  textWrap: 'nowrap',
  paddingTop: '1em',
  paddingBottom: '0.75em',
};

const typographyGoogle = {
  textTransform: 'none',
  fontFamily: 'Nunito',
  fontSize: '14px',
  fontWeight: '400',
  lineHeight: '19.6px',
  color: 'rgba(74, 74, 74, 1)',
  textWrap: 'nowrap',
  paddingTop: '1.5em',

  paddingBottom: '0.25em',
};

export default PixelInstallation;
