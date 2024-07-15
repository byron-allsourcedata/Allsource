'use client';
import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import Image from 'next/image';
import PersonIcon from '@mui/icons-material/Person';
import { styles } from './accountStyles';
import { useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';

const AccountSetupPage = () => {
  const [organizationName, setOrganizationName] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [corporateEmail, setCorporateEmail] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState('');
  const [errors, setErrors] = useState({ websiteLink: '', corporateEmail: '' });
  const router = useRouter();
  const { full_name } = useUser();

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

  const handleEmployeeRangeChange = (label: any) => {
    setSelectedEmployees(label);
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateWebsite = (url: string) => {
    const re = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return re.test(url);
  };

  const handleSubmit = async () => {
    const newErrors = {
      websiteLink: validateWebsite(websiteLink) ? '' : 'Invalid website URL',
      corporateEmail: validateEmail(corporateEmail) ? '' : 'Invalid email address',
    };
    setErrors(newErrors);

    if (newErrors.websiteLink || newErrors.corporateEmail) {
      return;
    }

    try {
      const response = await axiosInterceptorInstance.post('/company-info', {
        organization_name:organizationName,
        company_website: websiteLink,
        email_address:corporateEmail,
        employees_workers: selectedEmployees,
      });

      if (response.data.status === 'SUCCESS') {
        router.push('/pixel_setup');
      } else if (response.data.status === 'NEED_EMAIL_VERIFIED') {
        router.push('/email-verificate');
      } else if (response.data.status === 'DASHBOARD_ALLOWED') {
        router.push('/dashboard');
      } else if (response.data.status === 'NEED_CHOOSE_PLAN') {
        router.push('/choose-plan');
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
          <Image src='/logo.svg' alt='logo' height={30} width={50}/>
        </Box>
        <Box sx={styles.nav}>
          <Typography variant="body1" sx={styles.header}>Create Account</Typography>
          <Typography variant="body1" sx={styles.subheader}>Install pixel</Typography>
        </Box>
        <PersonIcon sx={styles.account}/>
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
      <Button
        onClick={handleSignOut}
        sx={{ width: '5%' }}
      >
        Sign Out
      </Button>
    </Box>
  );
};

export default AccountSetupPage;
