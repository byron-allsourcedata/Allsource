'use client';
import React, { useState, useEffect, useContext } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import Image from 'next/image';
import PersonIcon from '@mui/icons-material/Person';
import { styles } from './accountStyles';
import { useRouter} from 'next/navigation';
import { useUser } from '../../context/UserContext'; 


const AccountSetupPage = () => {
  const [selectedEmployees, setSelectedEmployees] = useState<number | null>(null);
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

  const handleEmployeeClick = (num: number) => {
    setSelectedEmployees(num);
  };
  const ranges = [
    { min: 1, max: 10, label: '1-10' },
    { min: 51, max: 100, label: '11-50' },
    { min: 101, max: 250, label: '51-100' },
    { min: 251, max: 1000, label: '100-500' },
    { min: 1001, max: Infinity, label: '500+' },
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
        />
        <Typography variant="body1" component="h3" sx={styles.text}>
          Share your company website 
        </Typography>
        <TextField
          fullWidth
          label="Enter website link"
          variant="outlined"
          sx={styles.formField}
        />
        <Typography variant="body1" component="h3" sx={styles.text}>
          What&apos;s your role?
        </Typography>
        <TextField
          fullWidth
          label="Enter your role"
          variant="outlined"
          sx={styles.formField}
        />
        <Typography variant="body1" sx={styles.text}>
          How many employees work at your organization
        </Typography>
        <Box sx={styles.employeeButtons}>
          {ranges.map((range, index) => (
            <Button
              key={index}
              variant="outlined"
              onClick={() => handleEmployeeClick(range.min)}
              sx={getButtonStyles(selectedEmployees === range.min)}
            >
              {range.label}
            </Button>
          ))}
        </Box>
        <Button
          fullWidth
          variant="contained"
          sx={styles.submitButton}
        >
          Next
        </Button>
      </Box>
      <Button
          onClick={handleSignOut}
          sx={{ widht: '5%'}}
        >
          Sign Out
        </Button>
    </Box>
  );
};

export default AccountSetupPage;
