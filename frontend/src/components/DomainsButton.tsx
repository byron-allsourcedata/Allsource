import { Box, Typography, Button, Menu, MenuItem, TextField, IconButton, InputAdornment, colors } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import React, { useEffect, useState } from 'react';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import CloseIcon from '@mui/icons-material/Close';
import { showToast } from './ToastNotification';
import { UpgradePlanPopup } from './UpgradePlanPopup';
import { AxiosError } from 'axios';
import { SliderProvider } from '@/context/SliderContext';
import Slider from '../components/Slider';
import Image from 'next/image';
import ConfirmDeleteDomain from './DeleteDomain';
import CustomizedProgressBar from './FirstLevelLoader';
import { useUser } from '@/context/UserContext';

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
  handleSave: (domain: Domain) => void;
}

interface HoverImageProps {
  srcDefault: string
  srcHover: string
  alt: string
  onClick: () => void
}

const HoverableImage = ({ srcDefault, srcHover, alt, onClick }: HoverImageProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="delete-icon"
      sx={{
        padding: 0,
        minWidth: 'auto',
        border: 'none',
        background: 'transparent'
      }}>
      <Image
        height={20}
        width={20}
        alt={alt}
        src={isHovered ? srcHover : srcDefault}
        style={{
          transition: 'opacity 0.3s ease',
          cursor: 'pointer',
        }}
      />
    </Button>
  );
};

const AddDomainPopup = ({ open, handleClose, handleSave }: AddDomainProps) => {
  const [domain, setDomain] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [errors, setErrors] = useState({ domain: '' });
  const [upgradePlanPopup, setUpgradePlanPopup] = useState(false);
  const [showSlider, setShowSlider] = useState(false)
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const validateField = (
    value: string,
    type: "domain"
  ): string => {
    const sanitizedValue = value.replace(/^www\./, '');
    const websiteRe = /^(https?:\/\/)?([\da-z.-]+)\.([a-z]{2,20})([/\w .-]*)*\/?$/i;
    return websiteRe.test(sanitizedValue) ? "" : "Invalid website URL";
  }
  const handleSubmit = async () => {
    const newErrors = { domain: validateField(domain, 'domain') };
    setErrors(newErrors);
    if (newErrors.domain) return;

    try {
      const response = await axiosInstance.post("domains/", { domain });
      if (response.status === 201) {
        handleClose();
        handleSave(response.data);
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 403) {
          if (error.response.data.status === 'NEED_UPGRADE_PLAN') {
            setUpgradePlanPopup(true);
          } else if (error.response.data.status === 'NEED_BOOK_CALL') {
            sessionStorage.setItem('is_slider_opened', 'true');
            setShowSlider(true);
          } else {
            sessionStorage.setItem('is_slider_opened', 'false');
            setShowSlider(false);
          }
        }
      }
    }
  };

  const handleWebsiteLink = (event: { target: { value: string } }) => {
    let input = event.target.value.trim();

    const hasWWW = input.startsWith("www.");

    const sanitizedInput = hasWWW ? input.replace(/^www\./, '') : input;

    const domainPattern = /^[\w-]+\.[a-z]{2,}$/i;
    const isValidDomain = domainPattern.test(sanitizedInput);

    let finalInput = input;

    if (isValidDomain) {
      finalInput = hasWWW ? `https://www.${sanitizedInput}` : `https://${sanitizedInput}`;
    }

    setDomain(finalInput);

    const websiteError = validateField(input, "domain");
    setErrors((prevErrors) => ({
      domain: websiteError,
    }));
  };

  if (!open) return null;

  return (

    <Box sx={{ display: 'flex', flexDirection: 'column', padding: '1rem', width: '100%', }}>
      <TextField
        onKeyDown={(e) => e.stopPropagation()}
        fullWidth
        label="Enter domain link"
        variant="outlined"
        sx={{
          marginBottom: '1.5em',
          maxHeight: '56px',
          '& .MuiOutlinedInput-root': {
            maxHeight: '48px',
            '& fieldset': {
              borderColor: 'rgba(107, 107, 107, 1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(107, 107, 107, 1)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'rgba(107, 107, 107, 1)',
            },
            paddingTop: '13px',
            paddingBottom: '13px',
          },
          '& .MuiInputLabel-root': {
            top: '-5px',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(107, 107, 107, 1)',
          },
        }}
        placeholder={isFocused ? "example.com" : ""}
        value={isFocused ? domain.replace(/^https?:\/\//, "") : `https://${domain.replace(/^https?:\/\//, "")}`}
        onChange={handleWebsiteLink}
        onFocus={handleFocus}
        onBlur={handleBlur}
        error={!!errors.domain}
        helperText={errors.domain}
        InputProps={{
          startAdornment: isFocused && (
            <InputAdornment position="start" disablePointerEvents sx={{ marginRight: 0 }}>https://</InputAdornment>
          ),
          endAdornment: (
            <IconButton aria-label="close" edge="end" sx={{ color: 'text.secondary' }} onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          ),
        }} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <Button className='hyperlink-red' onClick={handleSubmit} sx={{
          borderRadius: '4px',
          border: '1px solid #5052b2',
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
          color: '#5052b2 !important',
          textTransform: 'none',
          padding: '6px 24px'
        }}>
          Save
        </Button>
      </Box>
      <UpgradePlanPopup open={upgradePlanPopup} limitName={'domain'} handleClose={() => setUpgradePlanPopup(false)} />
      {showSlider && <Slider />}
    </Box>
  );
};

const DomainButton: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [currentDomain, setCurrentDomain] = useState('');
  const [showDomainPopup, setDomainPopup] = useState(false);
  const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
  const dropdownOpen = Boolean(dropdownEl);
  const [deleteDomainPopup, setDeleteDomainPopup] = useState(false);
  const [deleteDomain, setDeleteDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(false);
  const [upgradePlanPopup, setUpgradePlanPopup] = useState(false);
  useEffect(() => {
    const intervalId = setInterval(() => {
      const savedMe = sessionStorage.getItem('me');
      const savedDomains = savedMe ? JSON.parse(savedMe || '{}').domains : [];
      const savedCurrentDomain = sessionStorage.getItem('current_domain') || '';
  
      if (JSON.stringify(domains) !== JSON.stringify(savedDomains)) {
        setDomains(savedDomains);
      }
  
      if (currentDomain !== savedCurrentDomain) {
        setCurrentDomain(savedCurrentDomain);
      }
    }, 1000); 
  
    return () => clearInterval(intervalId)
  }, [domains, currentDomain]);
  
  



  const handleDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDropdownEl(event.currentTarget);
  };

  const handleDropdownClose = () => {
    setDropdownEl(null);
  };


  const handleSetDomain = (domain: string) => {
    sessionStorage.setItem('current_domain', domain);
    setCurrentDomain(domain.replace('https://', ''));
    sessionStorage.removeItem('me')
    window.location.reload();
  };

  const handleSave = (domain: Domain) => {
    setDomains((prevDomains) => [...prevDomains, domain]);
    setDomainPopup(false);
    handleSetDomain(domain.domain);
    showToast('Successfully added domain');
  };

  const handleShowDelete = (domain: Domain) => {
    setDeleteDomain(domain);
    setDeleteDomainPopup(true);
    handleDropdownClose();
  };

  const handleDeleteDomain = (domain: Domain) => {
    if (sessionStorage.getItem('current_domain') === domain.domain) {
      sessionStorage.removeItem('current_domain');
      window.location.reload();
    } else {
      setDomains(prevDomains => prevDomains.filter(d => d.id !== domain.id));
    }
    setDeleteDomainPopup(false);
  };


  return (
    <>
      <UpgradePlanPopup open={upgradePlanPopup} limitName={'domain'} handleClose={() => setUpgradePlanPopup(false)} />
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
        <Typography className='second-sub-title' sx={{
          marginRight: '0.5em',
          letterSpacing: '-0.02em',
          textAlign: 'left',
          color: 'rgba(98, 98, 98, 1) !important'
        }}>
          {currentDomain}
        </Typography>
        <ExpandMoreIcon sx={{ width: '20px', height: '20px' }} />
      </Button>
      <Menu
        id="account-dropdown"
        variant='menu'
        anchorEl={dropdownEl}
        open={dropdownOpen}
        onClose={handleDropdownClose}
        sx={{ '& .MuiMenu-list': { padding: '2px' } }}
      >
        <MenuItem onClick={() => setDomainPopup(true)}>
          <Typography className='second-sub-title' sx={{ color: '#5052B2 !important' }}> + Add new domain</Typography>
        </MenuItem>
        <AddDomainPopup
          open={showDomainPopup}
          handleClose={() => setDomainPopup(false)}
          handleSave={handleSave}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '0.5rem' }}>
          <span style={{ border: '1px solid #CDCDCD', marginBottom: '0.5rem', width: '100%' }}></span>
        </Box>
        {domains.map((domain) => (
          <MenuItem key={domain.id} onClick={() => {
            handleSetDomain(domain.domain);
          }}
            sx={{
              '&:hover .delete-icon': {
                opacity: 1,
              },
              '& .delete-icon': {
                opacity: 0,
                transition: 'opacity 0.3s ease',
              },
            }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: domain.enable ? 'pointer' : 'not-allowed',
              width: '20rem',
              color: domain.enable ? 'inherit' : 'gray'
            }}>
              <Typography className='second-sub-title'>
                {domain.domain.replace('https://', '')}
              </Typography>
              {domains.length > 1 && (
                <HoverableImage
                  srcDefault='/trash-03.svg'
                  srcHover='/trash-03-active.svg'
                  alt='Remove'
                  onClick={() => handleShowDelete(domain)}
                />
              )}
            </Box>
          </MenuItem>
        ))}
      </Menu>
      {deleteDomainPopup && deleteDomain && (
        <ConfirmDeleteDomain
          open={deleteDomainPopup}
          domain={deleteDomain}
          handleClose={() => setDeleteDomainPopup(false)}
          handleDelete={handleDeleteDomain}
        />
      )}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          <CustomizedProgressBar />
        </Box>
      )}
    </>
  );
};

const DomainSelect = () => {
  return (
    <SliderProvider><DomainButton /></SliderProvider>
  )
}

export default DomainSelect