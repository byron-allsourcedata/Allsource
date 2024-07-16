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
  const [role, setRole] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<number | null>(null);
  const router = useRouter();
  const { full_name } = useUser();

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push('/signin');
  };



  const handleEmployeeClick = (num: number) => {
    setSelectedEmployees(num);
  };

  const handleSubmit = async () => {
    try {
      const response = await axiosInterceptorInstance.post('/company-info', {
        organizationName,
        websiteLink,
        role,
        employees: selectedEmployees,
      });
      
      if (response.data.status === 'SUCCESS') {
        router.push('/pixel_setup');
      } else if (response.data.status === 'NEED_EMAIL_VERIFIED') {
        router.push('/email-verificate');
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
          <Typography variant="body1" sx={styles.subheader}>Create Account</Typography>
          <Typography variant="body1" sx={styles.header}>Install pixel</Typography>
        </Box>
        <PersonIcon sx={styles.account}/>
      </Box>
      <Box sx={styles.formContainer}>
        <Typography variant="h5" component="h1" sx={styles.title}>
        Install Maximiz on your site
        </Typography>

        <TextField
          fullWidth
          label="Organization name"
          variant="outlined"
          sx={styles.formField}
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
        />

        <TextField
          fullWidth
          label="Enter website link"
          variant="outlined"
          sx={styles.formField}
          value={websiteLink}
          onChange={(e) => setWebsiteLink(e.target.value)}
        />

        <TextField
          fullWidth
          label="Enter your role"
          variant="outlined"
          sx={styles.formField}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <Typography variant="body1" sx={styles.text}>
          How many employees work at your organization
        </Typography>

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
