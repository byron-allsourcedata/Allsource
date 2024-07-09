'use client';
import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import Image from 'next/image';
import PersonIcon from '@mui/icons-material/Person';
import { styles } from './accountStyles';

const AccountSetupPage = () => {
  const [selectedEmployees, setSelectedEmployees] = useState<number | null>(null);


  
  const getButtonStyles = (isSelected: boolean): SxProps<Theme> => {
    return isSelected
      ? { ...styles.employeeButton, ...styles.activeButton }
      : styles.employeeButton;
  };
  
  const EmployeeButtons = () => {
    const [selectedEmployees, setSelectedEmployees] = useState<number | null>(null);
  
    const handleEmployeeClick = (num: number) => {
      setSelectedEmployees(num);
    };
}
  const ranges = [
    { min: 1, max: 10, label: '1-10' },
    { min: 51, max: 100, label: '51-100' },
    { min: 101, max: 250, label: '101-250' },
    { min: 251, max: 1000, label: '251-1000' },
    { min: 1001, max: Infinity, label: '>1k' },
  ];

  return (
    <Box sx={styles.pageContainer}>
      <Box sx={styles.header}>
        <Box sx={styles.logo}>
          <Image src='/logo.svg' alt='logo' height={30} width={50}/>
        </Box>
        <Box sx={styles.nav}>
          <Typography variant="body1" sx={styles.header}>Create Account</Typography>
          <Typography variant="body1" sx={{ color: 'grey[500]' }}>Install pixel</Typography>
        </Box>
        <PersonIcon />
      </Box>
      <Box sx={styles.formContainer}>
        <Typography variant="h5" component="h1" sx={styles.title}>
          Welcome Lakshmi,
        </Typography>
        <Typography variant="body1" component="h2" sx={styles.subtitle}>
          Let's set up your account
        </Typography>
        <TextField
          fullWidth
          label="Organization name"
          variant="outlined"
          sx={styles.formField}
        />
        <TextField
          fullWidth
          label="Enter website link"
          variant="outlined"
          sx={styles.formField}
        />
        <TextField
          fullWidth
          label="Enter website link"
          variant="outlined"
          sx={styles.formField}
        />
        <Typography variant="body1" sx={{ marginBottom: '1em' }}>
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
    </Box>
  );
};

export default AccountSetupPage;
