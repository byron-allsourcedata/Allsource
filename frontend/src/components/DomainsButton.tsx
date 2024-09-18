"use client";
import { Box, Typography, Button, Menu, MenuItem, TextField, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import React, { useEffect, useState } from 'react';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import CloseIcon from '@mui/icons-material/Close';
import { showErrorToast, showToast } from './ToastNotification'
import axiosInstance from '@/axios/axiosInterceptorInstance';


interface Domain {
    id: number;
    user_id: number;
    domain: string;
    data_provider_id: number;
    is_pixel_installed: boolean;
    enable: boolean;
}

interface AddDomainProps {
  open: boolean;
  handleClose: () => void;
  handleSave: (domain: string) => void; 
}

const AddDomainPopup = ({ open, handleClose, handleSave }: AddDomainProps) => {
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
          handleSave(domain)
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

  if (!open) return null; 

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
      }}
    >
      <TextField
       label="Shop Domain"
       variant="outlined"
       placeholder="Enter your Shop Domain"
       margin="normal"
       value={isFocused ? domain.replace(/^https?:\/\//, "") : `https://${domain.replace(/^https?:\/\//, "")}`}
       onFocus={handleFocus}
       onBlur={handleBlur}
       onChange={(e) => setDomain(e.target.value)}
       error={!!errors.domain}
       helperText={errors.domain}
        InputProps={{
          endAdornment: (
            <IconButton
              aria-label="close"
              edge="end"
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon onClick={() => handleClose()} />
            </IconButton>
          ),
        }}
      />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          width: '100%',
          marginTop: '1rem'
        }}
      >
        <Button color='primary' variant='outlined' onClick={handleSubmit}>Save</Button>
      </Box>
    </Box>
  );
};



const DomainButton: React.FC = () => {
  const [domains, setDomains] = useState<string[]>([]);
  const [currentDomain, setCurrentDomain] = useState('');
  const [showDomainPopup, setDomainPopup] = useState(false);
  const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
  const dropdownOpen = Boolean(dropdownEl);

  const handleDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDropdownEl(event.currentTarget);
  };

  const handleDropdownClose = () => {
    setDropdownEl(null);
  };

  const getCookie = (name: string) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInterceptorInstance.get('/domains/');
        if (response.status === 200) {
          const domainData = response.data.map((domain: Domain) =>
            domain.domain.replace(/^https?:\/\//, '')
          );
          setDomains(domainData);

          const currentDomainCookie = getCookie('current_domain');
          if (currentDomainCookie) {
            setCurrentDomain(currentDomainCookie.replace(/^https?:\/\//, ''));
          } else if (domainData.length > 0) {
            setCurrentDomain(domainData[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch domains:', error);
      }
    };
    fetchData();
  }, []);

  const handleSetDomain = async (domain: string) => {
    try {
      const response = await axiosInterceptorInstance.post('/domains/set', {
        domain: domain
      }, { withCredentials: true });

      if (response.status === 200) {
        setCurrentDomain(domain);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to set domain:', error);
    }
  };

  const handleSave = async (domain: string) => {
    setDomains(prevDomains => [...prevDomains, domain]);
    setDomainPopup(false);
  };

  return (
    <>
      <Button
        aria-controls={dropdownOpen ? 'account-dropdown' : undefined}
        aria-haspopup="true"
        aria-expanded={dropdownOpen ? 'true' : undefined}
        onClick={handleDropdownClick}
        sx={{
          textTransform: 'none',
          color: 'rgba(128, 128, 128, 1)',
          border: '1px solid rgba(184, 184, 184, 1)',
          borderRadius: '3.27px',
          padding: '7px'
        }}
      >
        <Typography sx={{
          marginRight: '0.5em',
          fontFamily: 'Nunito',
          lineHeight: '19.1px',
          letterSpacing: '-0.02em',
          textAlign: 'left',
          fontSize: '0.875rem'
        }}>{currentDomain}</Typography>
        <ExpandMoreIcon sx={{
          width: '20px',
          height: '20px'
        }} />
      </Button>
      <Menu
        id="account-dropdown"
        anchorEl={dropdownEl}
        open={dropdownOpen}
        onClose={handleDropdownClose}
      >
        <MenuItem onClick={() => setDomainPopup(true)} style={{color: '#5052B2'}}>
        +Add Domain
        </MenuItem>
        <AddDomainPopup
          open={showDomainPopup}
          handleClose={() => setDomainPopup(false)}
          handleSave={handleSave}
        />
        <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          width: '100%',
          marginTop: '1rem'
        }}
      ><span style={{border: '1px solid #CDCDCD', marginBottom: '1rem', width: '100%'}}></span></Box>
        
        {
          domains.map((domain) => (
            <MenuItem key={domain} onClick={() => handleSetDomain(domain)}>{domain}</MenuItem>
          ))
        }
      </Menu>
    </>
  );
};

export default DomainButton;
