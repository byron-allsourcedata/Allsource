import { Box, Grid, Typography, Button } from "@mui/material";
import Image from "next/image";
import axiosInterceptorInstance from "../axios/axiosInterceptorInstance";
import { AxiosError } from "axios";
import { useSlider } from '../context/SliderContext'; // Импортируйте контекст
import React from "react";

const PixelInstallation: React.FC = () => {
  const { setShowSlider } = useSlider(); // Используем контекст

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
    <Box sx={{ padding: '1rem', border: '1px solid #e4e4e4', borderRadius: '8px', backgroundColor: 'rgba(247, 247, 247, 1)', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', marginBottom: '2rem' }}>
      <Typography variant="h6" component="div" mb={2}>
        1. Pixel Installation
      </Typography>
      <Typography variant="body2" color="textSecondary" mb={2}>
        Select how you would like to install the pixel
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Button variant="outlined" fullWidth onClick={installManually} sx={{backgroundColor: '#fff', display: "flex", 
          flexDirection: 'column', justifyContent: 'start', 
          alignItems: 'self-start', textTransform: 'none', 
          fontFamily: 'Nunito', fontSize: '14px',
          fontWeight: '600', lineHeight: '19.6px',
          textAlign: 'center', }}>
            <Image src={'/install_manually.svg'} alt="Install Manually" width={20} height={20} />
            Install Manually
          </Button>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button variant="outlined" fullWidth onClick={installGoogleTag} sx={{backgroundColor: '#fff', display: "flex", 
          flexDirection: 'column', justifyContent: 'start', 
          alignItems: 'self-start', textTransform: 'none', 
          fontFamily: 'Nunito', fontSize: '14px',
          fontWeight: '600', lineHeight: '19.6px',
          textAlign: 'center', }}>
            <Image src={'/install_gtm.svg'} alt="Install on Google Tag Manager" width={20} height={20} />
            Install on Google Tag Manager
          </Button>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button variant="outlined" fullWidth onClick={installCMS} sx={{backgroundColor: '#fff', flexDirection: 'column',
          alignItems: 'self-start', textTransform: 'none', 
          fontFamily: 'Nunito', fontSize: '14px',
          fontWeight: '600', lineHeight: '19.6px',
          textAlign: 'center', }}>
            <Image src={'/install_cms1.svg'} alt="Install on CMS" width={20} height={20} />
            <Image src={'/install_cms2.svg'} alt="Install on CMS" width={20} height={20} />
            Install on CMS
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PixelInstallation;
