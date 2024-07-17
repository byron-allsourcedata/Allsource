'use client';
import React, { Suspense, useState, useEffect } from 'react';
import { Box, Button, Menu, MenuItem, TextField, Typography } from '@mui/material';
import Image from 'next/image';
import PersonIcon from '@mui/icons-material/Person';
import { styles } from './accountStyles';
import { useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import axiosInterceptorInstance from '../../axios/axiosInterceptorInstance'; 
import { showErrorToast } from '../../components/ToastNotification';

const AccountSetup = () => {
  const [organizationName, setOrganizationName] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [corporateEmail, setCorporateEmail] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState('');
  const [errors, setErrors] = useState({ websiteLink: '', corporateEmail: '', organizationName: '', selectedEmployees: '' });
  const router = useRouter();
  const { full_name, email } = useUser();

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await axiosInterceptorInstance.get('/company-info');

        const status = response.data.status;

        switch (status) {
          case "NEED_EMAIL_VERIFIED":
            router.push('/email-verificate');
            break;
          case "NEED_CHOOSE_PLAN":
            router.push('/choose-plan');
            break;
          case "DASHBOARD_ALLOWED":
            router.push('/dashboard');
            break;
          default:
            console.error('Unknown status:', status);
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
      }
    };
    fetchCompanyInfo();
  }, [router]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProfileMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsClick = () => {
    handleProfileMenuClose();
    router.push('/settings');
  };

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push('/signin');
  };

  const getButtonStyles = (isSelected: boolean): any => {
    return isSelected
      ? { ...styles.employeeButton, backgroundColor: 'rgba(249, 189, 182, 1)', color: 'black' }
      : { ...styles.employeeButton, color: 'black' };
  };

  const handleEmployeeRangeChange = (label: string) => {
    setSelectedEmployees(label);
    setErrors({ ...errors, selectedEmployees: '' });
  };

  const validateField = (value: string, type: 'email' | 'website' | 'organizationName'): string => {
    switch (type) {
      case 'email':
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRe.test(value) ? '' : 'Invalid email address';
      case 'website':
        const websiteRe = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        return websiteRe.test(value) ? '' : 'Invalid website URL';
      case 'organizationName':
        const orgName = value.trim();
        return orgName ? '' : 'Organization name is required';
      default:
        return '';
    }
  };

  const handleSubmit = async () => {
    const newErrors = {
      websiteLink: validateField(websiteLink, 'website'),
      corporateEmail: validateField(corporateEmail, 'email'),
      organizationName: validateField(organizationName, 'organizationName'),
      selectedEmployees: selectedEmployees ? '' : 'Please select number of employees',
    };
    setErrors(newErrors);

    if (newErrors.websiteLink || newErrors.corporateEmail || newErrors.organizationName || newErrors.selectedEmployees) {
      return;
    }

    try {
      const response = await axiosInterceptorInstance.post('/company-info', {
        organization_name: organizationName.trim(),
        company_website: websiteLink,
        email_address: corporateEmail,
        employees_workers: selectedEmployees,
      });

      switch (response.data.status) {
        case 'SUCCESS':
          router.push('/dashboard');
          break;
        case 'NEED_EMAIL_VERIFIED':
          router.push('/email-verificate');
          break;
        case 'DASHBOARD_ALLOWED':
          router.push('/dashboard');
          break;
        case 'NEED_CHOOSE_PLAN':
          router.push('/choose-plan');
          break;
        default:
          console.log('Unhandled response status:', response.data.status);
          break;
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };

  const ranges = [
    { min: 1, max: 10, label: '1-10' },
    { min: 11, max: 50, label: '11-50' },
    { min: 51, max: 100, label: '51-100' },
    { min: 101, max: 500, label: '100-500' },
    { min: 501, max: Infinity, label: '500+' },
  ];

  return (
    <Box sx={styles.pageContainer}>
      <Box sx={styles.headers}>
        <Box sx={styles.logo}>
          <Image src='/logo.svg' alt='logo' height={80} width={60} />
        </Box>
        <Box sx={styles.nav}>
          <Typography variant="body1" sx={styles.header}>Create Account</Typography>
          <Typography variant="body1" sx={styles.subheader}>Install pixel</Typography>
        </Box>
        <Button
          aria-controls={open ? 'profile-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleProfileMenuClick}
        >
          <PersonIcon sx={styles.account} />
        </Button>
        <Menu
          id="profile-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleProfileMenuClose}
          MenuListProps={{
            'aria-labelledby': 'profile-menu-button',
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">{full_name}</Typography>
            <Typography variant="body2" color="textSecondary">{email}</Typography>
          </Box>
          <MenuItem onClick={handleSettingsClick}>Settings</MenuItem>
          <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
        </Menu>
      </Box>
      <Box sx={styles.formContainer}>
        <Typography variant="h5" component="h1" sx={styles.title}>
          Welcome {full_name},
        </Typography>
        <Typography variant="body1" component="h2" sx={styles.subtitle}>
          Let&apos;s set up your account
        </Typography>
        <Typography variant="body1" component="h3" sx={styles.text}>
          What is your organization’s name
        </Typography>
        <TextField
          fullWidth
          label="Organization name"
          variant="outlined"
          sx={styles.formField}
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          error={!!errors.organizationName}
          helperText={errors.organizationName}
        />
        <Typography variant="body1" component="h3" sx={styles.text}>
          Share your company website
        </Typography>
        <TextField
          fullWidth
          label="Enter website link"
          variant="outlined"
          sx={styles.formField}
          value={websiteLink}
          onChange={(e) => setWebsiteLink(e.target.value)}
          error={!!errors.websiteLink}
          helperText={errors.websiteLink}
        />
        <Typography variant="body1" component="h3" sx={styles.text}>
          Enter your corporate email
        </Typography>
        <TextField
          fullWidth
          label="Enter corporate email"
          variant="outlined"
          sx={styles.formField}
          value={corporateEmail}
          onChange={(e) => setCorporateEmail(e.target.value)}
          error={!!errors.corporateEmail}
          helperText={errors.corporateEmail}
        />
        <Typography variant="body1" sx={styles.text}>
          How many employees work at your organization
        </Typography>
        {errors.selectedEmployees && (
          <Typography variant="body2" color="error">
            {errors.selectedEmployees}
          </Typography>
        )}
        <Box sx={styles.employeeButtons}>
          {ranges.map((range, index) => (
            <Button
              key={index}
              variant="outlined"
              onClick={() => handleEmployeeRangeChange(range.label)}
              sx={getButtonStyles(selectedEmployees === range.label)}
            >
              {range.label}
            </Button>
          ))}
        </Box>
        <Button
          fullWidth
          variant="contained"
          sx={styles.submitButton}
          onClick={handleSubmit}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

const AccountSetupPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccountSetup />
    </Suspense>
  );
};

export default AccountSetupPage;
