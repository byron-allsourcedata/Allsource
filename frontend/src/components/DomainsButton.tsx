"use client";
import { Box, Typography, Button, Menu, MenuItem, TextField, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import React, { useEffect, useState } from 'react';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import CloseIcon from '@mui/icons-material/Close';
import { showErrorToast, showToast } from './ToastNotification';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { UpgradePlanPopup } from './UpgradePlanPopup';
import { AxiosError } from 'axios';

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
  const [upgradePlanPopup, setUpgradePlanPopup] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const validateField = (value: string): string => value.trim() ? "" : "Domain is required";

  const isFormValid = () => !validateField(domain);

  const handleSubmit = async () => {
    const newErrors = { domain: validateField(domain) };
    setErrors(newErrors);
    if (newErrors.domain) return;

    try {
      const response = await axiosInstance.post("/domains/", { domain });
      if (response.status === 201) {
        handleClose();
        handleSave(domain);
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 403) {
        if (error.response.data.status === 'NEED_UPGRADE_PLAN') {
          setUpgradePlanPopup(true); 
        } else {
          showErrorToast('An error occurred while adding the domain');
        }
      }
    }
  };

  if (!open) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
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
            <IconButton aria-label="close" edge="end" sx={{ color: 'text.secondary' }}>
              <CloseIcon onClick={handleClose} />
            </IconButton>
          ),
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '1rem' }}>
        <Button color='primary' variant='outlined' onClick={handleSubmit}>Save</Button>
      </Box>
      <UpgradePlanPopup open={upgradePlanPopup} handleClose={() => setUpgradePlanPopup(false)} />
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInterceptorInstance.get('/domains/');
        if (response.status === 200) {
          const domainData = response.data.map((domain: Domain) =>
            domain.domain.replace('https://', '')
          );
          setDomains(domainData);
          const savedDomain = sessionStorage.getItem('current_domain');
          if (savedDomain) {
            setCurrentDomain(savedDomain.replace('https://', ''));
          } else if (domainData.length > 0) {
            setCurrentDomain(domainData[0]);
            sessionStorage.setItem('current_domain', domainData[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching domains:', error);
      }
    };
    fetchData();
  }, []);
  

  const handleSetDomain = (domain: string) => {
    sessionStorage.setItem('current_domain', domain);
    setCurrentDomain(domain.replace('https://', ''));
    window.location.reload()
  };

  const handleSave = (domain: string) => {
    setDomains((prevDomains) => [...prevDomains, domain]);
    setDomainPopup(false);
    handleSetDomain(domain);
    showToast('Successfully added domain');
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
          padding: '7px',
        }}
      >
        <Typography sx={{
          marginRight: '0.5em',
          fontFamily: 'Nunito',
          lineHeight: '19.1px',
          letterSpacing: '-0.02em',
          textAlign: 'left',
          fontSize: '0.875rem',
        }}>
          {currentDomain}
        </Typography>
        <ExpandMoreIcon sx={{ width: '20px', height: '20px' }} />
      </Button>
      <Menu
        id="account-dropdown"
        anchorEl={dropdownEl}
        open={dropdownOpen}
        onClose={handleDropdownClose}
      >
        <MenuItem onClick={() => setDomainPopup(true)} style={{ color: '#5052B2' }}>
          + Add Domain
        </MenuItem>
        <AddDomainPopup
          open={showDomainPopup}
          handleClose={() => setDomainPopup(false)}
          handleSave={handleSave}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '1rem' }}>
          <span style={{ border: '1px solid #CDCDCD', marginBottom: '1rem', width: '100%' }}></span>
        </Box>
        {domains.map((domain) => (
          <MenuItem key={domain} onClick={() => handleSetDomain(domain)}>
            {domain}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default DomainButton;
