import { Box, Grid, Typography, Button } from "@mui/material";
import Image from "next/image";
import axiosInterceptorInstance from "../axios/axiosInterceptorInstance";
import { AxiosError } from "axios";
import { useSlider } from '../context/SliderContext';
import React, {useEffect, useState} from "react";
import ManualPopup from '../components/ManualPopup';
import GoogleTagPopup from '../components/GoogleTagPopup';
import CRMPopup from "./CMSPopup";



interface CmsData {
  manual?: string;
  pixel_client_id?: string;
}

const PixelInstallation: React.FC = () => {
  const { setShowSlider } = useSlider();

  const installManually = async () => {
    try {
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
      } else {
        console.error('Error fetching data:', error);
      }
    }
  };

  const installGoogleTag = async () => {
    try {
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
      } else {
        console.error('Error fetching data:', error);
      }
    }
  };

  const [openmanually, setOpen] = useState(false);
  const [pixelCode, setPixelCode] = useState('');
  const [opengoogle, setGoogleOpen] = useState(false);
  const [cmsData, setCmsData] = useState<CmsData>({});
  const [opencrm, setCMSOpen] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      const query = new URLSearchParams(window.location.search);
      const authorizationCode = query.get('code');

      if (authorizationCode) {
        try {
          setGoogleOpen(true);
        } catch (error) {
          console.error('Error handling redirect:', error);
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
      } else {
        console.error('Error fetching data:', error);
      }
    }
  };

  return (
    <Box sx={{
      padding: '1.25rem',
      border: '1px solid #e4e4e4',
      borderRadius: '8px',
      backgroundColor: 'rgba(247, 247, 247, 1)',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      marginBottom: '2rem' ,
      '@media (max-width: 1199px)': {
        padding: '1.5rem 1rem',
        marginBottom: '1.5rem' ,
      }
      }}>
      <Typography variant="h6" component="div" mb={2} sx={{
        fontFamily: 'Nunito',
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
      <Typography variant="body2" color="textSecondary" mb={2}
      sx={{
        fontFamily: 'Nunito',
        fontWeight: '500',
        color: '#808080',
        '@media (max-width: 1199px)': {
          fontSize: '0.875rem',
          lineHeight: 'normal',
        }
        }}
      >
        Select how you would like to install the pixel
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Button variant="outlined" fullWidth onClick={installManually} sx={buttonStyles}>
            <Image src={'/install_manually.svg'} alt="Install Manually" width={32} height={32}
            
            />
            <Typography sx={typographyStyles}>Install Manually</Typography>
          </Button>
          <ManualPopup open={openmanually} handleClose={handleManualClose} pixelCode={pixelCode} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Button variant="outlined" fullWidth onClick={installGoogleTag} sx={buttonGoogle}>
            <Image src={'/install_gtm.svg'} alt="Install on Google Tag Manager" width={32} height={32} />
            <Typography sx={typographyGoogle}>Install on Google Tag Manager</Typography>
          </Button>
          <GoogleTagPopup open={opengoogle} handleClose={handleGoogleClose}/>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button variant="outlined" fullWidth onClick={installCMS} sx={buttonStyles}>
            <Box>
              <Image src={'/install_cms1.svg'} alt="Install on CMS" width={24} height={24} style={{marginRight:4}} />
              <Image src={'/install_cms2.svg'} alt="Install on CMS" width={24} height={24} />
            </Box>
            <Typography sx={{...typographyStyles, pt: '9px'}}>Install on CMS</Typography>
          </Button>
          <CRMPopup open={opencrm} handleClose={handleCRMClose} pixelCode={cmsData.manual || ''}  pixel_client_id={cmsData.pixel_client_id || ''} />
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
  padding: '0.875rem',
  borderColor: 'rgba(228, 228, 228, 1)',
  border: '1px solid rgba(228, 228, 228, 1)',
  width: '100%', 
  '& img': {
    '@media (max-width: 1199px)': {
      width: '24px',
      height: '24px'
    }
  },
  '@media (min-width: 1200px) and (max-width: 1399px)': {
    paddingRight: '0',
  } 
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
  '& img': {
    '@media (max-width: 1199px)': {
      width: '24px',
      height: '24px'
    }
  },
  '@media (min-width: 1200px) and (max-width: 1399px)': {
    paddingRight: '0',
  }
};


const typographyStyles = {
  textTransform: 'none',
  fontFamily: 'Nunito',
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
  '@media (min-width: 1200px) and (max-width: 1399px)': {
    fontSize: '12px'
  }
};

const typographyGoogle = {
  textTransform: 'none',
  fontFamily: 'Nunito',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '19.6px',
  color: 'rgba(74, 74, 74, 1)',
  textWrap: 'wrap',
  paddingTop: '0.625rem',
  '@media (max-width: 1199px)': {
    paddingTop: '0.5rem'
  },
  '@media (min-width: 1200px) and (max-width: 1399px)': {
    fontSize: '12px'
  }
};

export default PixelInstallation;
