import { Box, Grid, Typography, Button } from "@mui/material";
import Image from "next/image";
import axiosInterceptorInstance from "../axios/axiosInterceptorInstance";
import { AxiosError } from "axios";
import { useSlider } from '../context/SliderContext';
import React, { useState } from "react";
import ManualPopup from '../components/ManualPopup';
import GoogleTagPopup from '../components/GoogleTagPopup';
import CRMPopup from "./CMSPopup";
import {  useTrial } from "@/context/TrialProvider";


const PixelInstallation: React.FC = () => {
  const { setShowSlider } = useSlider();

  const installManually = async () => {
    try {
      const response = await axiosInterceptorInstance.get('/install-pixel/manually');
      setPixelCode(response.data);
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
      } else {
        console.error('Error fetching data:', error);
      }
    }
  };

  const installGoogleTag = async () => {
    try {
      const response = await axiosInterceptorInstance.get('/install-pixel/manually');
      setGoogleCode(response.data);
      setGoogleOpen(true);
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

  const [openmanually, setOpen] = useState(false);
  const [pixelCode, setPixelCode] = useState('');
  const [opengoogle, setGoogleOpen] = useState(false);
  const [googleCode, setGoogleCode] = useState('');
  const [cmsCode, setCmsCode] = useState('');
  const [opencrm, setCMSOpen] = useState(false);



  const handleManualClose = () => setOpen(false);
  const handleGoogleClose = () => setGoogleOpen(false);
  const handleCRMClose = () => setCMSOpen(false);


  const installCMS = async () => {
    try {
      const response = await axiosInterceptorInstance.get('/install-pixel/cms');
      setCmsCode(response.data);
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
      } else {
        console.error('Error fetching data:', error);
      }
    }
  };

  return (
    <Box sx={{ padding: '0.5rem', border: '1px solid #e4e4e4', borderRadius: '8px', backgroundColor: 'rgba(247, 247, 247, 1)', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', marginBottom: '2rem' }}>
      <Typography variant="h6" component="div" mb={2} sx={{fontFamily: 'Nunito', fontWeight: '700', lineHeight: '21.82px', textAlign: 'left',}}>
        1. Pixel Installation
      </Typography>
      <Typography variant="body2" color="textSecondary" mb={2}>
        Select how you would like to install the pixel
      </Typography>
      <Grid container spacing={2} md={12}>
        <Grid item xs={12} md={4}>
          <Button variant="outlined" fullWidth onClick={installManually} sx={buttonStyles}>
            <Image src={'/install_manually.svg'} alt="Install Manually" width={36} height={36} />
            <Typography sx={typographyStyles}>Install Manually</Typography>
          </Button>
          <ManualPopup open={openmanually} handleClose={handleManualClose} pixelCode={pixelCode} />
        </Grid>
        <Grid item xs={12} md={4} width={700}>
          <Button variant="outlined" fullWidth onClick={installGoogleTag} sx={buttonGoogle}>
            <Image src={'/install_gtm.svg'} alt="Install on Google Tag Manager" width={28} height={28} />
            <Typography sx={typographyGoogle}>Install on Google Tag Manager</Typography>
          </Button>
          <GoogleTagPopup open={opengoogle} handleClose={handleGoogleClose} pixelCode={googleCode} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Button variant="outlined" fullWidth onClick={installCMS} sx={buttonStyles}>
            <Box>
              <Image src={'/install_cms2.svg'} alt="Install on CMS" width={28} height={28} />
            </Box>
            <Typography sx={typographyStyles}>Install on CMS</Typography>
          </Button>
          <CRMPopup open={opencrm} handleClose={handleCRMClose} pixelCode={cmsCode} />
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
  fontSize: '14',
  fontWeight: '500',
  lineHeight: '19.6px',
  color: 'rgba(74, 74, 74, 1)',
  textWrap: 'nowrap',
  paddingTop: '1em',
  paddingBottom: '0.75em',
};

const typographyGoogle = {
  textTransform: 'none',
  fontFamily: 'Nunito',
  fontSize: '18',
  fontWeight: '450',
  lineHeight: '19.6px',
  color: 'rgba(74, 74, 74, 1)',
  textWrap: 'wrap',
  paddingTop: '1.5em',
  paddingBottom: '0.25em',
};

export default PixelInstallation;
