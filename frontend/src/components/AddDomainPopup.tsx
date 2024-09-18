"use client";
import React, { useState } from 'react';
import { Box, Button, Typography, Modal, IconButton, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import { styles } from '../css/cmsStyles';
import axios from 'axios'; 
import { showErrorToast, showToast } from './ToastNotification'
import axiosInstance from '@/axios/axiosInterceptorInstance';


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
};

const maintext = {
  fontFamily: 'Nunito',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '19.6px',
  color: 'rgba(0, 0, 0, 1)',
  paddingTop: '1em',
  paddingBottom: '0.75em',
};

type Props = {
  open: boolean;
  handleClose: () => void;
};

export const AddDomainPopup = ({ open, handleClose }: Props) => {
    const [domain, setDomain] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [errors, setErrors] = useState({ domain: '' });

    const handleFocus = () => {
      setIsFocused(true);
    };

    const validateField = (value: string): string => {
      const domain = value.trim();
      return domain ? "" : "Domain is required";
    };

    const isFormValid = () => {
      return !validateField(domain);
    };

    const handleSubmit = async () => {
      const newErrors = {
        domain: validateField(domain),
      };
      setErrors(newErrors);
  
      if (newErrors.domain) {
        return;
      }
  
      const accessToken = localStorage.getItem('token');
      if (!accessToken) return;
  
      const body = {
        domain: domain
      };
  
      try {
        const response = await axiosInstance.post("/domains/", body, {
        });
  
        if (response.status === 201) {
          showToast('Successfully add domain');
          handleClose();
        } else {
          showErrorToast('Failed to add domain');
          handleClose();
        }
      } catch (error) {
        console.error("An error occurred:", error);
        showErrorToast('An error occurred while add domain');
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    return (
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{ ...style, ...(open ? openStyle : {}) }}>
          <Box
            display="flex"
            justifyContent="space-between"
            sx={{ width: '100%', paddingBottom: '0.5em', alignItems: 'center' }}
          >
            <Typography
              sx={{
                fontFamily: 'Nunito',
                fontSize: '20px',
                fontWeight: '600',
                lineHeight: '19.6px',
                textAlign: 'left',
                color: 'rgba(28, 28, 28, 1)',
                '@media (max-width: 600px)': { padding: 2 },
              }}
            >
              Add Domain
            </Typography>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              <Box
                sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'start' }}
              >
                <Image src='/1.svg' alt='1' width={28} height={28} />
                <Typography
                  sx={{
                    ...maintext,
                    textAlign: 'left',
                    padding: '1em 0em 1em 1em',
                    fontWeight: '500',
                  }}
                >
                  Enter your domain in the special field
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center', margin: 0, pl: 1 }}>
                <TextField
                  fullWidth
                  label="Shop Domain"
                  variant="outlined"
                  placeholder="Enter your Shop Domain"
                  margin="normal"
                  sx={styles.formField}
                  InputLabelProps={{ sx: styles.inputLabel }}
                  value={isFocused ? domain.replace(/^https?:\/\//, "") : `https://${domain.replace(/^https?:\/\//, "")}`}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  InputProps={{ sx: styles.formInput }}
                  onChange={(e) => setDomain(e.target.value)}
                  error={!!errors.domain}
                  helperText={errors.domain}
                />
              </Box>
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                padding: '0em 1em',
              }}
            >
              <Button
                fullWidth
                variant="contained"
                sx={{
                  ...styles.submitButton,
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
                disabled={!isFormValid()}
              >
                Add Domain
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    );
};
