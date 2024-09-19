import React, { useState } from 'react';
import { Box, Drawer, Backdrop, Typography, Button, TextField, InputAdornment } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showToast, showErrorToast } from './ToastNotification';

interface Domain {
  id: number;
  user_id: number;
  domain: string;
  data_provider_id: number;
  is_pixel_installed: boolean;
  enable: boolean;
}

type Props = {
  open: boolean;
  domain: Domain;
  handleClose: () => void;
  handleDelete: (domain: Domain) => void;
};

const ConfirmDeleteDomain = ({ open, handleClose, domain, handleDelete }: Props) => {
  const [enterDomain, setEnterDomain] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);
  const [errors, setErrors] = useState<{ domain: string }>({ domain: '' });

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const websiteCoincidence = (inputValue: string): boolean => {
    const cleanDomain = (value: string): string => {
      return value.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    };
    return cleanDomain(inputValue) === cleanDomain(domain.domain);
  };
  
  const validateField = (value: string): string => {
    return websiteCoincidence(value) ? '' : "Domains don't match";
  };
  
  const handleChangeEnterDomain = (value: string) => {
    setEnterDomain(value);
    handleWebsiteLink(value);
  };
  
  const handleWebsiteLink = (value: string) => {
    const websiteError = validateField(value.trim());
    setErrors({ domain: websiteError });
  };

  const handleFetchDelete = async () => {
    if (!enterDomain.trim()) {
      showErrorToast("Domain field is empty.");
      return;
    }
    if (validateField(enterDomain)) {
      showErrorToast(errors.domain);
      return;
    }

    try {
      await axiosInstance.delete(`/domains/${domain.id}`, {
        data: { domain: enterDomain },
      });
      showToast('Successfully removed domain');
      setEnterDomain('');
      setErrors({ domain: '' });
      handleDelete(domain);
    } catch (error) {
      showErrorToast('Failed to delete domain. Please try again.');
    }
  };

  if (!open) return null;

  return (
    <>
      <Backdrop open={open} onClick={handleClose} sx={{ zIndex: 1400, color: '#fff', bgcolor: 'rgba(0, 0, 0, 0.1)' }} />
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        variant="persistent"
        PaperProps={{
          sx: {
            width: '45%',
            position: 'fixed',
            zIndex: 1500,
            top: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            '@media (max-width: 600px)': { width: '100%' },
          },
        }}
      >
        <Box p={4} sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant='h3' fontSize={'1rem'}>Confirm Removal</Typography>
            <CloseIcon sx={{ cursor: 'pointer' }} onClick={handleClose} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '1rem' }}>
            <span style={{ border: '1px solid #CDCDCD', marginBottom: '1rem', width: '100%' }}></span>
          </Box>
          <Typography
            variant='h6'
            fontFamily='Nunito Sans'
            fontWeight={500}
            fontSize='1rem'
          >
            Are you sure you want to remove this domain? If you do, all data associated with it will be permanently erased.
          </Typography>
          <TextField
            onKeyDown={(e) => e.stopPropagation()}
            fullWidth
            label="Enter domain link"
            variant="outlined"
            sx={{
              margin: '1.5rem auto',

              width: '90%',
              maxHeight: '56px',
              '& .MuiInputBase-root': { maxHeight: '48px' },
              '&.Mui-focused': { color: '#0000FF' },
              '& .MuiOutlinedInput-root': { paddingTop: '13px', paddingBottom: '13px' },
              '& .MuiInputLabel-root': { top: '-5px' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0000FF' },
            }}
            placeholder={isFocused ? "example.com" : ""}
            value={isFocused ? enterDomain.replace(/^https?:\/\//, "") : `https://${enterDomain.replace(/^https?:\/\//, "")}`}
            onChange={(e) => handleChangeEnterDomain(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            error={!!errors.domain}
            helperText={errors.domain}
            InputProps={{
              startAdornment: isFocused && (
                <InputAdornment position="start">https://</InputAdornment>
              ),
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 4 }}>

          <Button
            sx={{ background: '#5052B2', '&:hover': { backgroundColor: '#5052B2' } }}
            variant='contained'
            onClick={handleFetchDelete}
          >
            <Typography padding={'0.5rem 2rem'} fontSize={'0.8rem'}>Yes</Typography>
          </Button>
          <Button
            sx={{
              border: '1px #5052B2 solid',
              marginLeft: '2.5em',
              marginRight: '1rem',
              color: '#5052B2',
              '&:hover': { border: '1px #5052B2 solid' }
            }}
            variant='outlined'
            onClick={handleClose}
          >
            <Typography padding={'0.5rem 2rem'} fontSize={'0.8rem'}>No</Typography>
          </Button>
        </Box>
      </Drawer>
    </>
  );
};



export const DeleteDomainPopup = ({ open, handleClose, domain, handleDelete }: Props) => {
    const [showConfirm, setShowConfirm] = useState(false)
    
    const handleCloseConfirm = () => {
        setShowConfirm(false)
        handleClose()
    }

    if (!open) return null;

  return (
    <>
    <Backdrop open={open} onClick={handleClose} sx={{ zIndex: 1200, color: '#fff', bgcolor: 'rgba(0, 0, 0, 0.1)' }} />
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      variant="persistent"
      PaperProps={{
        sx: {
          width: '45%',
          position: 'fixed',
          zIndex: 1300,
          top: 0,
          bottom: 0,
          '@media (max-width: 600px)': {
            width: '100%',
          },
        },
      }}
    >
      <Box p={4}>
        <Box sx={{
          display: 'flex',
          
          justifyContent: 'space-between',
        }}>
        <Typography variant='h3' fontSize={'1rem'}>Confirm Removal</Typography>
        <CloseIcon sx={{cursor: 'pointer',
        }} onClick={() => handleClose()} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '1rem' }}>
          <span style={{ border: '1px solid #CDCDCD', marginBottom: '1rem', width: '100%'}}></span>
        </Box>
        <Image src='/Inbox cleanup-bro 4.svg' alt='cleanup' width={535} height={356.67}/>
            <Typography
                variant='h6'
                textAlign='center'
                fontFamily='Nunito Sans'
                fontWeight={500}
                fontSize='1rem'
            >
                Are you sure you want to remove this domain? If you do, all data associated with it will be permanently erased.
            </Typography>
        
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '15rem' }}>
          <span style={{ borderBottom: '2px solid #CDCDCD', marginBottom: '1rem', width: '100%', height: '1px'}}></span>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%'}}>
            <Button sx={{
            border: '1px #5052B2 solid',
            color: '#5052B2',
            '&:hover': {
                border: '1px #5052B2 solid',
            }
            }} variant='outlined' onClick={() => handleClose()}><Typography padding={'0.5rem 2rem'} fontSize={'0.8rem'}>Cancel</Typography></Button>
            <Button sx={{
            marginLeft: '2.5em',
            marginRight: '1rem',
            background: '#5052B2',
            '&:hover': {
            backgroundColor: '#5052B2', 
            }
            }} variant='contained' onClick={() => {setShowConfirm(true)}}><Typography padding={'0.5rem 2rem'} fontSize={'0.8rem'}>Remove</Typography></Button>
        </Box>
      <ConfirmDeleteDomain open={showConfirm} handleClose={handleCloseConfirm} domain={domain} handleDelete={handleDelete}/>
      </Drawer>
    </>
  );
};
