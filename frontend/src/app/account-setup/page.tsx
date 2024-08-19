'use client';
import React, { Suspense, useState, useEffect } from 'react';
import { Box, Button, Menu, MenuItem, Tab, Tabs, TextField, Typography } from '@mui/material';
import Image from 'next/image';
import PersonIcon from '@mui/icons-material/Person';
import { styles } from './accountStyles';
import { useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import axiosInterceptorInstance from '../../axios/axiosInterceptorInstance';
import { showErrorToast } from '../../components/ToastNotification';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const AccountSetup = () => {
  const [organizationName, setOrganizationName] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState('');
  const [selectedVisits, setSelectedVisits] = useState('');
  const [selectedRoles, setSelectedRoles] = useState('');
  const [errors, setErrors] = useState({ websiteLink: '', organizationName: '', selectedEmployees: '', selectedVisits: '' });
  const router = useRouter();
  const { full_name, email } = useUser();

  const [activeTab, setActiveTab] = useState(0);

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

  const getButtonVisitsStyles = (isSelected: boolean): any => {
    return isSelected
      ? { ...styles.visitButton, backgroundColor: 'rgba(249, 189, 182, 1)', color: 'black' }
      : { ...styles.visitButton, color: 'black' };
  };

  const getButtonRolesStyles = (isSelected: boolean): any => {
    return isSelected
      ? { ...styles.roleButton, backgroundColor: 'rgba(249, 189, 182, 1)', color: 'black' }
      : { ...styles.roleButton, color: 'black' };
  };

  const handleEmployeeRangeChange = (label: string) => {
    setSelectedEmployees(label);
    setErrors({ ...errors, selectedEmployees: '' });
  };
  const handleVisitsRangeChange = (label: string) => {
    console.log(label)
    setSelectedVisits(label);
    setErrors({ ...errors, selectedVisits: '' });
  };
  const handleRolesChange = (label: string) => {
    setSelectedRoles(label);
    setErrors({ ...errors, selectedVisits: '' });
  };

  const handleWebsiteLinkChange = (e: { target: { value: any; }; }) => {
    const value = e.target.value;
    setWebsiteLink(value);
  
    const websiteLinkError = validateField(value, 'website');
    setErrors((prevErrors) => ({
      ...prevErrors,
      websiteLink: websiteLinkError,
    }));
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
      organizationName: validateField(organizationName, 'organizationName'),
      selectedEmployees: selectedEmployees ? '' : 'Please select number of employees',
      selectedVisits: selectedVisits ? '' : 'Please select number of visits',
      selectedRoles: selectedRoles ? '' : 'Please select your`s role',
    };
    setErrors(newErrors);

    if (newErrors.websiteLink || newErrors.organizationName || newErrors.selectedEmployees) {
      return;
    }

    try {
      const response = await axiosInterceptorInstance.post('/company-info', {
        organization_name: organizationName.trim(),
        company_website: websiteLink,
        company_role: selectedRoles,
        monthly_visits: selectedVisits,
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

  const isFormValid = () => {
    const errors = {
      websiteLink: validateField(websiteLink, 'website'),
      organizationName: validateField(organizationName, 'organizationName'),
      selectedVisits: selectedVisits ? '' : 'Please select number of visits'
    };
  
    return !errors.websiteLink && !errors.organizationName && !errors.selectedVisits;
  };

  const ranges = [
    { min: 1, max: 10, label: '1-10' },
    { min: 11, max: 50, label: '11-50' },
    { min: 51, max: 100, label: '51-100' },
    { min: 101, max: 500, label: '100-500' },
    { min: 501, max: Infinity, label: '500+' },
  ];
  const roles = [
    { label: 'Digital Marketer' },
    { label: 'CEO' },
    { label: 'Data Analyst' },
    { label: 'Product Manager' },
    { label: 'Engineer' },
    { label: 'Consultant' },
    { label: 'UX Researcher' },
    { label: 'Product Designer' },
    { label: 'Content Designer' },
    { label: 'Other' },
  ];
  const ranges_visits = [
    { min: 1, max: 10, label: '0-10K' },
    { min: 11, max: 50, label: '10-50K' },
    { min: 51, max: 100, label: '50-100K' },
    { min: 101, max: 500, label: '100-250K' },
    { min: 501, max: Infinity, label: '>250K' },
  ];

  const handleBackClick = () => {
    setActiveTab(0);
  };

  const handleNextClick = () => {
    setActiveTab(1);
  };

  return (
    <Box sx={styles.pageContainer}>
      <Box sx={styles.headers}>
        <Box sx={styles.logo}>
          <Image src='/logo.svg' alt='logo' height={30} width={50} />
        </Box>
        <Box sx={styles.nav}>
          {activeTab === 1 && (
            <Button
              variant="outlined"
              onClick={handleBackClick}
              sx={{
                marginRight: 2, color: 'rgba(50, 50, 50, 1)', border: 'none', position: 'fixed', left: 600, top: 30, fontFamily: 'Nunito', textTransform: 'none', fontSize: '16px', '&:hover': {
                  border: 'none',
                  backgroundColor: 'transparent',
                },
                '@media (max-width: 600px)': { display: 'flex', mr:0, position: 'inherit' }
              }}
            >
              <ArrowBackIcon sx={{ color: 'rgba(50, 50, 50, 1)' }} />
              Back
            </Button>
          )}
          <Tabs
            value={activeTab}
            sx={{
              ...styles.tabs,
              '& .MuiTabs-indicator': {
                backgroundColor: 'rgba(244, 87, 69, 1)',
              },
            }}
          >
            <Tab
              label="Create Account"
              sx={{
                textTransform: 'none',
                fontFamily: 'Nunito',
                fontSize: '16px',
                fontWeight: '600',
                pointerEvents: 'none',
                lineHeight: '21.82px',
                color: activeTab === 0 ? 'rgba(50, 50, 50, 1)' : 'rgba(142, 142, 142, 1)',
                '&.Mui-selected': {
                  color: 'rgba(50, 50, 50, 1)',
                },
              }}
            />
            <Tab
              label="Business Info"
              sx={{
                textTransform: 'none',
                fontFamily: 'Nunito',
                fontSize: '16px',
                fontWeight: '600',
                pointerEvents: 'none',
                lineHeight: '21.82px',
                color: activeTab === 1 ? 'rgba(50, 50, 50, 1)' : 'rgba(142, 142, 142, 1)',
                '&.Mui-selected': {
                  color: 'rgba(50, 50, 50, 1)',
                },
              }}
            />
          </Tabs>
        </Box>
        <Button
          aria-controls={open ? 'profile-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleProfileMenuClick}
          sx={{'@media (max-width: 600px)': { display: 'none'}}}
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
        {activeTab === 0 && (
          <>
            <Typography variant="body1" component="h3" sx={styles.text}>
              What is your organization&apos;s name
            </Typography>
            <TextField
              fullWidth
              label="Organization name"
              variant="outlined"
              sx={styles.formField}
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              error={!!errors.organizationName}
              helperText={errors.organizationName} />
            <Typography variant="body1" component="h3" sx={styles.text}>
              Share your company website
            </Typography>
            <TextField
              fullWidth
              label="Enter website link"
              variant="outlined"
              sx={styles.formField}
              value={websiteLink}
              onChange={handleWebsiteLinkChange}
              error={!!errors.websiteLink}
              helperText={errors.websiteLink} />
            <Typography variant="body1" sx={styles.text}>
              How many monthly visits to your website?
            </Typography>
            {errors.selectedEmployees && (
              <Typography variant="body2" color="error">
                {errors.selectedEmployees}
              </Typography>
            )}
            <Box sx={styles.visitsButtons}>
              {ranges_visits.map((range, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  onClick={() => handleVisitsRangeChange(range.label)}
                  sx={getButtonVisitsStyles(selectedVisits === range.label)}
                >
                  {range.label}
                </Button>
              ))}
            </Box>
            <Button
              fullWidth
              variant="contained"
              sx={{
                ...styles.submitButton,
                opacity: isFormValid() ? 1 : 0.2,
                pointerEvents: isFormValid() ? 'auto' : 'none',
              }}
              onClick={handleNextClick}
              disabled={!isFormValid()}
            >
              Next
            </Button>
          </>
        )}
        {activeTab === 1 && (
          <>
            {/* Business info */}
            < Typography variant="body1" sx={styles.text}>
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
            <Typography variant="body1" sx={styles.text}>
              Whats your role?
            </Typography>
            {errors.selectedEmployees && (
              <Typography variant="body2" color="error">
                {errors.selectedEmployees}
              </Typography>
            )}
            <Box sx={styles.rolesButtons}>
              {roles.map((range, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  onClick={() => handleRolesChange(range.label)}
                  sx={getButtonRolesStyles(selectedRoles === range.label)}
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
          </>
        )}
      </Box>
    </Box >
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
