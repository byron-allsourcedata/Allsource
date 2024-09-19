"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogActions, Tooltip, Slider, DialogContent, DialogTitle, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel, InputAdornment, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import Image from 'next/image';

const accontDetailsStyles = {
    formField: {
        margin: '0',
    },
    inputLabel: {
        fontFamily: 'Nunito Sans',
        fontSize: '12px',
        lineHeight: '16px',
        color: 'rgba(17, 17, 19, 0.60)',
        '&.Mui-focused': {
            color: '#0000FF',
          },
    },
    formInput: {
        '&.MuiFormControl-root': {
            margin: 0,
        },
        '&.MuiOutlinedInput-root': {
          height: '48px',
          '& .MuiOutlinedInput-input': {
            padding: '12px 16px 13px 16px',
            fontFamily: 'Roboto',
            color: '#202124',
            fontSize: '14px',
            lineHeight: '20px'
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#A3B0C2',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#A3B0C2',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0000FF',
          },
        },
        '&+.MuiFormHelperText-root': {
            marginLeft: '0',
        },
      },
      orDivider: {
        display: 'flex',
        alignItems: 'center',
        margin: '0 -40px'
      },
      passwordValidationText: {
        '& .MuiTypography-root' : {
          fontFamily: 'Nunito',
          fontSize: '12px',
          fontWeight: '400',
          color: 'rgba(17, 17, 19, 0.60)',
        }
      },
      passwordValidationTextSuccess: {
        '& .MuiTypography-root' : {
          fontFamily: 'Nunito',
          fontSize: '12px',
          fontWeight: '400',
          color: '#111113',
        }
      },
      passwordContentList: {
        display: 'flex',
        padding: '0',
        margin: '-24px 0 0'
      },
      passwordContentListItem: {
        width: 'auto',
        padding: '0 16px 0 0',
        '@media (max-width: 440px)': {
          padding: '0 8px 0 0',
        },
        '&:last-child' : {
          padding: 0
        }
      },
      passwordContentListItemIcon: {
        minWidth: '0',
        marginRight: '4px'
      },
}

export const SettingsAccountDetails: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [emailAddress, setEmailAddress] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [companyWebsite, setCompanyWebsite] = useState('');
    const [monthlyVisits, setMonthlyVisits] = useState('');
    const [resetPasswordDate, setResetPasswordDate] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isModified, setIsModified] = useState(false); 
    const [initialValue, setInitialValue] = useState('');

    const [initialEmail, setInitialEmail] = useState('');
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isEmailTyping, setIsEmailTyping] = useState(false);
    const [isEmailModified, setIsEmailModified] = useState(false); 
    
    const [initialOrganizationName, setInitialOrganizationName] = useState('');
    const [isOrganizationNameFocused, setIsOrganizationNameFocused] = useState(false);
    const [isOrganizationNameTyping, setIsOrganizationNameTyping] = useState(false);
    const [isOrganizationNameModified, setIsOrganizationNameModified] = useState(false);
    
    const [initialCompanyWebsite, setInitialCompanyWebsite] = useState('');
    const [isCompanyWebsiteFocused, setIsCompanyWebsiteFocused] = useState(false);
    const [isCompanyWebsiteTyping, setIsCompanyWebsiteTyping] = useState(false);
    const [isCompanyWebsiteModified, setIsCompanyWebsiteModified] = useState(false);

    const [initialMonthlyVisits, setInitialMonthlyVisits] = useState('');
    const [isMonthlyVisitsFocused, setIsMonthlyVisitsFocused] = useState(false);
    const [isMonthlyVisitsTyping, setIsMonthlyVisitsTyping] = useState(false);
    const [isMonthlyVisitsModified, setIsMonthlyVisitsModified] = useState(false);

    const [changePasswordPopupOpen, setChangePasswordPopupOpen] = useState(false);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});


    

    const calculateDaysAgo = (dateString: string) => {
        if (!dateString) return 'Never';

        const lastChangedDate = new Date(dateString);
        const today = new Date();
        const differenceInTime = today.getTime() - lastChangedDate.getTime();
        const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

        return `${differenceInDays} days ago`;
    };

    useEffect(() => {
        const fetchAccountDetails = async () => {
            try {
                const response = await axiosInterceptorInstance.get('/settings/account-details');
                const data = response.data;
                setResetPasswordDate(data.reset_password_sent_at);
                setFullName(data.full_name);
                setInitialValue(data.full_name);
                setEmailAddress(data.email_address);
                setInitialEmail(data.email_address);
                setOrganizationName(data.company_name);
                setInitialOrganizationName(data.company_name);
                setCompanyWebsite(data.company_website);
                setInitialCompanyWebsite(data.company_website);
                setMonthlyVisits(data.company_website_visits);
                setInitialMonthlyVisits(data.company_website_visits);
            } catch (error) {
                console.error('Error fetching account details:', error);
            }
        };

        fetchAccountDetails();
    }, []);


    

    const handleSaveAccountDetails = (field: 'full_name' | 'email_address') => {
        const accountData = {
            account: {
                [field]: field === 'full_name' ? fullName : emailAddress
            }
        };
        axiosInterceptorInstance.put('/settings/account-details', accountData)
            .then(() => {
                alert('Account details updated successfully');
            })
            .catch(error => {
                console.error('Error updating account details:', error);
            });
    };
    

    const handleChangePassword = () => {
        const newErrors: { [key: string]: string } = {};
        if (!newPassword) {
            newErrors.newPassword = 'Password is required';
          } else if (!passwordValidation.length || !passwordValidation.upperCase || !passwordValidation.lowerCase) {
            newErrors.newPassword = 'Please enter a stronger password';
          }
      
          if (!confirmNewPassword) {
            newErrors.confirmNewPassword = 'Confirm password is required';
          } else if (confirmNewPassword !== newPassword) {
            newErrors.confirmNewPassword = 'Invalid password combination.';
          }
      
          setErrors(newErrors);
      
          if (Object.keys(newErrors).length > 0) {
            return;
          }

        if (newPassword === confirmNewPassword) {
            const changePasswordData = {
                change_password: {
                    current_password: currentPassword,
                    new_password: newPassword
                }
            };
            axiosInterceptorInstance.put('/api/changePassword', changePasswordData)
                .then(() => {
                    alert('Password changed successfully');
                })
                .catch(error => {
                    console.error('Error changing password:', error);
                });
        } else {
            console.error('New passwords do not match');
        }
    };
    

    const handleSaveBusinessInfo = (field: 'organizationName' | 'companyWebsite' | 'monthlyVisits') => {
        const businessInfoData = {
            business_info: {
                organization_name: field === 'organizationName' ? organizationName : undefined,
                company_website: field === 'companyWebsite' ? companyWebsite : undefined,
                visits_to_website: field === 'monthlyVisits' ? monthlyVisits : undefined
            }
        };
        axiosInterceptorInstance.put('/settings/account-details', businessInfoData)
            .then(() => {
                alert('Business info updated successfully');
            })
            .catch(error => {
                console.error('Error updating business info:', error);
            });
    };


    // Generic function to handle input changes
    const handleChange = (
        setValue: React.Dispatch<React.SetStateAction<string>>,
        setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
        setIsModified: React.Dispatch<React.SetStateAction<boolean>>) => 
        (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        setIsTyping(true);
        setIsModified(true);
        };
  
  // Generic function to handle input reset
  const handleReset = (
    setValue: React.Dispatch<React.SetStateAction<string>>,
    setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
    setIsModified: React.Dispatch<React.SetStateAction<boolean>>) => () => {
      setValue('');
      setIsTyping(false);
      setIsModified(false);
  };
  
  // Generic function to handle focus
  const handleFocus = (value: string, setIsFocused: React.Dispatch<React.SetStateAction<boolean>>, setIsTyping: React.Dispatch<React.SetStateAction<boolean>>) => () => {
      setIsFocused(true);
      if (value.trim() === '') {
          setIsTyping(false);
      }
  };
  
  // Generic function to handle blur
  const handleBlur = (value: string, setIsFocused: React.Dispatch<React.SetStateAction<boolean>>, setIsTyping: React.Dispatch<React.SetStateAction<boolean>>) => () => {
      setIsFocused(false);
      if (value === '') {
          setIsTyping(false);
      }
  };
  
  // Check if the save button should be enabled
  const isSaveEnabled = (value: string, initialValue: string, isModified: boolean) => 
    value.trim() !== '' && value !== initialValue && isModified;
  
  // Show close icon conditionally
  const showCloseIcon = (isTyping: boolean, value: string, initialValue: string) => 
    isTyping && value.trim() !== '' && value !== initialValue;

  const handleChangePasswordPopupOpen = () => {
    setChangePasswordPopupOpen(true);

};

const handleChangePasswordPopupClose = () => {
    setChangePasswordPopupOpen(false);
};



  const isPasswordValid = (password: string) => {
    return {
      length: password.length >= 8,
      upperCase: /[A-Z]/.test(password),
      lowerCase: /[a-z]/.test(password),
    };
  };

  const passwordValidation = isPasswordValid(newPassword);

  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const CustomCheckCircleIcon = ({ isSuccess }: { isSuccess: boolean }) => (
    <Image 
        src={isSuccess ? "/tick-circle-green.svg" : "/tick-circle.svg"} 
        alt={isSuccess ? "Success Check Circle" : "Disabled Check Circle"} 
        height={16} width={16}
    />
  );
  



    return (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' , mb: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px',
                    '@media (max-width: 899px)': {
                            minWidth: '100%'
                     },
                     '@media (min-width: 900px)': {
                            minWidth: '700px'
                     },
                     '@media (min-width: 1200px)': {
                            minWidth: '780px'
                     }
                     
                    }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Typography variant="h6" sx={{
                        fontFamily: 'Nunito Sans',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#4a4a4a',
                        lineHeight: '22px'
                    }}>Name</Typography>
                    <Box sx={{ display: 'flex', gap: 2,
                        '@media (max-width: 600px)': {
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                        },
                    }}>
                        <TextField sx={accontDetailsStyles.formField}
                            label="Full Name"
                            value={fullName}
                            onChange={handleChange(setFullName, setIsTyping, setIsModified)} 
                            fullWidth
                            margin="normal"
                            InputLabelProps={{ sx: accontDetailsStyles.inputLabel }}
                            InputProps={{
                                sx: accontDetailsStyles.formInput,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {/* Write Icon */}
                                        <IconButton
                                            sx={{ 
                                                display: (isFocused && !isTyping) ? 'flex' : 'none',
                                                visibility: (isFocused && !isTyping) ? 'visible' : 'hidden',
                                            }}
                                        >
                                            <Image src='/write-icon.svg' alt='write-icon' height={24} width={24} />
                                        </IconButton>
                                        {/* Close Icon */}
                                        <IconButton
                                            onClick={handleReset(setFullName, setIsTyping, setIsModified)}
                                            sx={{ 
                                                display: showCloseIcon(isTyping, fullName, initialValue) ? 'flex' : 'none',
                                                visibility: showCloseIcon(isTyping, fullName, initialValue) ? 'visible' : 'hidden',
                                            }}
                                            size="small"
                                        >
                                            <Image src='/close-circle-purple.svg' alt='close-icon-purple' height={18} width={18} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            onFocus={handleFocus(fullName, setIsFocused, setIsTyping)}
                            onBlur={handleBlur(fullName, setIsFocused, setIsTyping)}
                        />
                        <Button variant="contained" color="primary" onClick={() => handleSaveAccountDetails('full_name')}
                            sx={{
                                borderRadius: '4px',
                                border: '1px solid #5052B2',
                                background: '#fff',
                                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                fontFamily: 'Nunito Sans',
                                fontSize: '14px',
                                fontWeight: '600',
                                lineHeight: '20px',
                                color: '#5052b2',
                                textTransform: 'none',
                                padding: '10px 24px',
                                height: '40px',
                                '&:hover' : {
                                    background: 'transparent'
                                },
                                '&.Mui-disabled': {
                                    background: 'transparent',
                                    opacity: '0.4'
                                }
                            }}
                            disabled={!isSaveEnabled(fullName, initialValue, isModified)}
                            >
                            Save
                        </Button>
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        margin: '0 -40px',
                        '@media (min-width: 601px)': {
                            display: 'none'
                        },}}>
                        <Box sx={{ borderBottom: '1px solid #e4e4e4', flexGrow: 1 }} />
                    </Box>

                    <Typography variant="h6" sx={{
                        fontFamily: 'Nunito Sans',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#4a4a4a',
                        lineHeight: '22px'
                    }}>Email address</Typography>

                    <Box sx={{ display: 'flex', gap: 2,
                        '@media (max-width: 600px)': {
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                        }
                    }}>
                        <TextField sx={accontDetailsStyles.formField}
                            label="Email Address"
                            value={emailAddress}
                            onChange={handleChange(setEmailAddress, setIsEmailTyping, setIsEmailModified)}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{ sx: accontDetailsStyles.inputLabel }}
                            InputProps={{ sx: accontDetailsStyles.formInput,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {/* Write Icon */}
                                        <IconButton
                                            sx={{ 
                                                display: (isEmailFocused && !isEmailTyping) ? 'flex' : 'none',
                                                visibility: (isEmailFocused && !isEmailTyping) ? 'visible' : 'hidden',
                                            }}
                                        >
                                            <Image src='/write-icon.svg' alt='write-icon' height={24} width={24} />
                                        </IconButton>
                                        {/* Close Icon */}
                                        <IconButton
                                            onClick={handleReset(setEmailAddress, setIsEmailTyping, setIsEmailModified)}
                                            sx={{ 
                                                display: showCloseIcon(isEmailTyping, emailAddress, initialEmail) ? 'flex' : 'none',
                                                visibility: showCloseIcon(isEmailTyping, emailAddress, initialEmail) ? 'visible' : 'hidden',
                                            }}
                                            size="small"
                                        >
                                            <Image src='/close-circle-purple.svg' alt='close-icon-purple' height={18} width={18} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            onFocus={handleFocus(emailAddress, setIsEmailFocused, setIsEmailTyping)}
                            onBlur={handleBlur(emailAddress, setIsEmailFocused, setIsEmailTyping)}
                        />
                        <Button variant="contained" color="primary" onClick={() => handleSaveAccountDetails('email_address')}
                            sx={{
                                borderRadius: '4px',
                                border: '1px solid #5052B2',
                                background: '#fff',
                                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                fontFamily: 'Nunito Sans',
                                fontSize: '14px',
                                fontWeight: '600',
                                lineHeight: '20px',
                                color: '#5052b2',
                                textTransform: 'none',
                                padding: '10px 24px',
                                height: '40px',
                                '&:hover' : {
                                    background: 'transparent'
                                },
                                '&.Mui-disabled': {
                                    background: 'transparent',
                                    opacity: '0.4'
                                }
                            }}
                            disabled={!isSaveEnabled(emailAddress, initialEmail, isEmailModified)}
                            >
                            Save
                        </Button>
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        margin: '0 -40px',
                        '@media (min-width: 601px)': {
                            display: 'none'
                        },}}>
                        <Box sx={{ borderBottom: '1px solid #e4e4e4', flexGrow: 1 }} />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center',
                        '@media (min-width: 601px)': {
                            display: 'none'
                        }
                     }}>
                        <Typography variant="h6" sx={{
                            fontFamily: 'Nunito Sans',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#4a4a4a',
                            lineHeight: '22px'
                        }}>Password</Typography>
                          <Typography variant="body2" sx={{ 
                            fontFamily: 'Nunito Sans',
                            fontSize: '12px',
                            lineHeight: '16px',
                            color: 'rgba(17, 17, 19, 0.60)'
                         }}>
                            Last changed: <strong>{calculateDaysAgo(resetPasswordDate)}</strong>
                        </Typography>
                    </Box>
                    <Typography variant="h6" sx={{
                        fontFamily: 'Nunito Sans',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#4a4a4a',
                        lineHeight: '22px',
                        '@media (max-width: 600px)': {
                            display: 'none'
                        }
                    }}>Password</Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button variant="contained" color="secondary" onClick={handleChangePasswordPopupOpen}
                        sx={{
                            borderRadius: '4px',
                            border: '1px solid #5052B2',
                            background: '#fff',
                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                            fontFamily: 'Nunito Sans',
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: '20px',
                            color: '#5052b2',
                            textTransform: 'none',
                            padding: '10px 24px',
                            height: '40px',
                            '&:hover' : {
                                background: 'transparent'
                            }
                        }}
                        >
                            Change password
                        </Button>
                        <Typography variant="body2" sx={{ 
                            fontFamily: 'Nunito Sans',
                            fontSize: '12px',
                            lineHeight: '16px',
                            color: 'rgba(17, 17, 19, 0.60)',
                            '@media (max-width: 600px)': {
                                display: 'none'
                            }
                         }}>
                            Last changed: <strong>{calculateDaysAgo(resetPasswordDate)}</strong>
                        </Typography>
                    </Box>
                    <Drawer
                            anchor="right"
                            open={changePasswordPopupOpen}
                            onClose={handleChangePasswordPopupClose}
                            PaperProps={{
                                sx: {
                                    width: '620px',
                                    position: 'fixed',
                                    zIndex: 1301,
                                    top: 0,
                                    bottom: 0,
                                    '@media (max-width: 600px)': {
                                        width: '100%',
                                    }
                                },
                            }}
                        >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px 24px', borderBottom: '1px solid #e4e4e4' }}>
                            <Typography variant="h6" sx={{
                                textAlign: 'center',
                                color: '#202124',
                                fontFamily: 'Nunito Sans',
                                fontWeight: '600',
                                fontSize: '16px',
                                lineHeight: 'normal' }}>
                                Change password
                            </Typography>
                            <IconButton onClick={handleChangePasswordPopupClose} sx={{p: 0}}>
                                <CloseIcon sx={{width: '20px', height: '20px'}} />
                            </IconButton>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                            <Box sx={{px: 4, py: 3,  width: '100%', display: 'flex', flexDirection: 'column', gap: 4}}>
                                <Typography variant="h6" sx={{
                                    color: '#202124',
                                    fontFamily: 'Nunito Sans',
                                    fontWeight: '600',
                                    fontSize: '16px',
                                    lineHeight: 'normal' }}>
                                    Update your password to enhance account security and maintain access control.
                                </Typography>

                                <TextField sx={accontDetailsStyles.formField}
                                    InputLabelProps={{ sx: accontDetailsStyles.inputLabel }}
                                    label="Current Password"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    fullWidth
                                    margin="normal"
                                    InputProps={{
                                        sx: accontDetailsStyles.formInput,
                                        endAdornment: (
                                          <InputAdornment position="end">
                                            <IconButton onClick={toggleCurrentPasswordVisibility} edge="end">
                                              <Image 
                                                src={showCurrentPassword ? "/custom-visibility-icon-off.svg" : "/custom-visibility-icon.svg"} 
                                                alt={showCurrentPassword ? "Show password" : "Hide password"} 
                                                height={18} width={18}
                                                title={showCurrentPassword ? "Hide password" : "Show password"}
                                              />
                                            </IconButton>
                                          </InputAdornment>
                                        ),
                                      }}
                                />
                                <TextField sx={accontDetailsStyles.formField}
                                    InputLabelProps={{ sx: accontDetailsStyles.inputLabel }}
                                    label="New Password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    error={Boolean(errors.newPassword)}
                                    helperText={errors.newPassword}
                                    fullWidth
                                    margin="normal"
                                    InputProps={{
                                        sx: accontDetailsStyles.formInput,
                                        endAdornment: (
                                          <InputAdornment position="end">
                                            <IconButton onClick={togglePasswordVisibility} edge="end">
                                              <Image 
                                                src={showPassword ? "/custom-visibility-icon-off.svg" : "/custom-visibility-icon.svg"} 
                                                alt={showPassword ? "Show password" : "Hide password"} 
                                                height={18} width={18}
                                                title={showPassword ? "Hide password" : "Show password"}
                                              />
                                            </IconButton>
                                          </InputAdornment>
                                        ),
                                      }}
                                />
                                <List sx={accontDetailsStyles.passwordContentList}>
                                    <ListItem sx={accontDetailsStyles.passwordContentListItem}>
                                        <ListItemIcon sx={accontDetailsStyles.passwordContentListItemIcon}>
                                        <CustomCheckCircleIcon isSuccess={passwordValidation.length} />
                                        </ListItemIcon>
                                        <ListItemText sx={passwordValidation.length ? accontDetailsStyles.passwordValidationTextSuccess : accontDetailsStyles.passwordValidationText} primary="8 characters min." />
                                    </ListItem>
                                    <ListItem sx={accontDetailsStyles.passwordContentListItem}>
                                        <ListItemIcon sx={accontDetailsStyles.passwordContentListItemIcon}>
                                        <CustomCheckCircleIcon isSuccess={passwordValidation.upperCase} />
                                        </ListItemIcon>
                                        <ListItemText sx={passwordValidation.upperCase ? accontDetailsStyles.passwordValidationTextSuccess : accontDetailsStyles.passwordValidationText}  primary="1 uppercase" />
                                    </ListItem>
                                    <ListItem sx={accontDetailsStyles.passwordContentListItem}>
                                        <ListItemIcon sx={accontDetailsStyles.passwordContentListItemIcon}>
                                        <CustomCheckCircleIcon isSuccess={passwordValidation.lowerCase} />
                                        </ListItemIcon>
                                        <ListItemText sx={passwordValidation.lowerCase ? accontDetailsStyles.passwordValidationTextSuccess : accontDetailsStyles.passwordValidationText} primary="1 lowercase" />
                                    </ListItem>
                                </List>
                                <TextField 
                                    sx={accontDetailsStyles.formField}
                                    InputLabelProps={{ sx: accontDetailsStyles.inputLabel }}
                                    label="Confirm New Password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    fullWidth
                                    margin="normal"
                                    error={Boolean(errors.confirmNewPassword)}
                                    helperText={errors.confirmNewPassword}
                                    InputProps={{
                                        sx: accontDetailsStyles.formInput,
                                        endAdornment: (
                                          <InputAdornment position="end">
                                            {Boolean(errors.confirmNewPassword) && (
                                              <IconButton edge="end">
                                                {/* Add your danger icon here */}
                                                <Image 
                                                  src="/danger-icon.svg" 
                                                  alt="Danger icon"
                                                  height={20} width={20} 
                                                  title="Invalid password"
                                                />
                                              </IconButton>
                                            )}
                                            <IconButton onClick={toggleConfirmPasswordVisibility} edge="end">
                                              <Image 
                                                src={showConfirmPassword ? "/custom-visibility-icon-off.svg" : "/custom-visibility-icon.svg"} 
                                                alt={showConfirmPassword ? "Show password" : "Hide password"} 
                                                height={18} width={18}
                                                title={showConfirmPassword ? "Hide password" : "Show password"}
                                              />
                                            </IconButton>
                                          </InputAdornment>
                                        ),
                                      }}
                                />
                            </Box>
                        </Box>
                        <Box sx={{ px: 2, py: 3.5, width: '100%', border: '1px solid #e4e4e4' }}>
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                <Button
                                    onClick={handleChangePasswordPopupClose}
                                    sx={{
                                        backgroundColor: '#fff',
                                        fontFamily: "Nunito Sans",
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        lineHeight: '20px',
                                        letterSpacing: 'normal',
                                        color: "#5052b2",
                                        textTransform: 'none',
                                        padding: '10px 24px',
                                        border: '1px solid #5052B2',
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
                                        '&:hover': {
                                            backgroundColor: '#fff'
                                        },
                                        borderRadius: '4px',
                                    }}
                                    >
                                        Cancel
                                </Button>
                                <Button
                                    onClick={handleChangePassword}
                                    sx={{
                                        backgroundColor: '#5052B2',
                                        fontFamily: "Nunito Sans",
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        lineHeight: '20px',
                                        letterSpacing: 'normal',
                                        color: "#fff",
                                        textTransform: 'none',
                                        padding: '10px 24px',
                                        '&:hover': {
                                            backgroundColor: '#5052B2'
                                        },
                                        borderRadius: '4px',
                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.25)'
                                    }}
                                >
                                    Change
                                </Button>
                            </Box>
                        </Box>
                    </Drawer>

                    <Box sx={accontDetailsStyles.orDivider}>
                        <Box sx={{ borderBottom: '1px solid #e4e4e4', flexGrow: 1 }} />
                    </Box>

                    {/* Business Info Section */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <Typography variant="h6" sx={{
                                fontFamily: 'Nunito Sans',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#4a4a4a',
                                lineHeight: '22px'
                            }}>
                            Business Info
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2,
                            '@media (max-width: 600px)': {
                                flexDirection: 'column',
                                alignItems: 'flex-start'
                            },
                         }}>
                            <TextField sx={accontDetailsStyles.formField}
                                label="Organization Name"
                                value={organizationName}
                                onChange={handleChange(setOrganizationName, setIsOrganizationNameTyping, setIsOrganizationNameModified)}
                                fullWidth
                                margin="normal"
                                InputLabelProps={{ sx: accontDetailsStyles.inputLabel }}
                                InputProps={{ sx: accontDetailsStyles.formInput,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            {/* Write Icon */}
                                            <IconButton
                                                sx={{ 
                                                    display: (isOrganizationNameFocused && !isOrganizationNameTyping) ? 'flex' : 'none',
                                                    visibility: (isOrganizationNameFocused && !isOrganizationNameTyping) ? 'visible' : 'hidden',
                                                }}
                                            >
                                                <Image src='/write-icon.svg' alt='write-icon' height={24} width={24} />
                                            </IconButton>
                                            {/* Close Icon */}
                                            <IconButton
                                                onClick={handleReset(setOrganizationName, setIsOrganizationNameTyping, setIsOrganizationNameModified)}
                                                sx={{ 
                                                    display: showCloseIcon(isOrganizationNameTyping, organizationName, initialOrganizationName) ? 'flex' : 'none',
                                                    visibility: showCloseIcon(isOrganizationNameTyping, organizationName, initialOrganizationName) ? 'visible' : 'hidden',
                                                }}
                                                size="small"
                                            >
                                                <Image src='/close-circle-purple.svg' alt='close-icon-purple' height={18} width={18} />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                onFocus={handleFocus(organizationName, setIsOrganizationNameFocused, setIsOrganizationNameTyping)}
                                onBlur={handleBlur(organizationName, setIsOrganizationNameFocused, setIsOrganizationNameTyping)}
                            />
                            <Button variant="contained" color="primary" onClick={() => handleSaveBusinessInfo('organizationName')}
                                sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #5052B2',
                                    background: '#fff',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    fontFamily: 'Nunito Sans',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    lineHeight: '20px',
                                    color: '#5052b2',
                                    textTransform: 'none',
                                    padding: '10px 24px',
                                    height: '40px',
                                    '&:hover' : {
                                        background: 'transparent'
                                    },
                                    '&.Mui-disabled': {
                                        background: 'transparent',
                                        opacity: '0.4'
                                    }
                                }}
                                disabled={!isSaveEnabled(organizationName, initialOrganizationName, isOrganizationNameModified)}
                                >
                                Save
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2,
                            '@media (max-width: 600px)': {
                                flexDirection: 'column',
                                alignItems: 'flex-start'
                            }
                        }}>
                            <TextField sx={accontDetailsStyles.formField}
                                label="Company Website"
                                value={companyWebsite}
                                onChange={handleChange(setCompanyWebsite, setIsCompanyWebsiteTyping, setIsCompanyWebsiteModified)}
                                fullWidth
                                margin="normal"
                                InputLabelProps={{ sx: accontDetailsStyles.inputLabel }}
                                InputProps={{ sx: accontDetailsStyles.formInput,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            {/* Write Icon */}
                                            <IconButton
                                                sx={{ 
                                                    display: (isCompanyWebsiteFocused && !isCompanyWebsiteTyping) ? 'flex' : 'none',
                                                    visibility: (isCompanyWebsiteFocused && !isCompanyWebsiteTyping) ? 'visible' : 'hidden',
                                                }}
                                            >
                                                <Image src='/write-icon.svg' alt='write-icon' height={24} width={24} />
                                            </IconButton>
                                            {/* Close Icon */}
                                            <IconButton
                                                onClick={handleReset(setCompanyWebsite, setIsCompanyWebsiteTyping, setIsCompanyWebsiteModified)}
                                                sx={{ 
                                                    display: showCloseIcon(isCompanyWebsiteTyping, companyWebsite, initialCompanyWebsite) ? 'flex' : 'none',
                                                    visibility: showCloseIcon(isCompanyWebsiteTyping, companyWebsite, initialCompanyWebsite) ? 'visible' : 'hidden',
                                                }}
                                                size="small"
                                            >
                                                <Image src='/close-circle-purple.svg' alt='close-icon-purple' height={18} width={18} />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                onFocus={handleFocus(companyWebsite, setIsCompanyWebsiteFocused, setIsCompanyWebsiteTyping)}
                                onBlur={handleBlur(companyWebsite, setIsCompanyWebsiteFocused, setIsCompanyWebsiteTyping)}
                            />
                            <Button variant="contained" color="primary" onClick={() => handleSaveBusinessInfo('companyWebsite')}
                                sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #5052B2',
                                    background: '#fff',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    fontFamily: 'Nunito Sans',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    lineHeight: '20px',
                                    color: '#5052b2',
                                    textTransform: 'none',
                                    padding: '10px 24px',
                                    height: '40px',
                                    '&:hover' : {
                                        background: 'transparent'
                                    },
                                    '&.Mui-disabled': {
                                        background: 'transparent',
                                        opacity: '0.4'
                                    }
                                }}
                                disabled={!isSaveEnabled(companyWebsite, initialCompanyWebsite, isCompanyWebsiteModified)}
                                >
                                Save
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2,
                            '@media (max-width: 600px)': {
                                flexDirection: 'column',
                                alignItems: 'flex-start'
                            }
                        }}>
                            <TextField sx={accontDetailsStyles.formField}
                                label="Monthly Visits to Website"
                                value={monthlyVisits}
                                onChange={handleChange(setMonthlyVisits, setIsMonthlyVisitsTyping, setIsMonthlyVisitsModified)}
                                fullWidth
                                margin="normal"
                                InputLabelProps={{ sx: accontDetailsStyles.inputLabel }}
                                InputProps={{ sx: accontDetailsStyles.formInput,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            {/* Write Icon */}
                                            <IconButton
                                                sx={{ 
                                                    display: (isMonthlyVisitsFocused && !isMonthlyVisitsTyping) ? 'flex' : 'none',
                                                    visibility: (isMonthlyVisitsFocused && !isMonthlyVisitsTyping) ? 'visible' : 'hidden',
                                                }}
                                            >
                                                <Image src='/write-icon.svg' alt='write-icon' height={24} width={24} />
                                            </IconButton>
                                            {/* Close Icon */}
                                            <IconButton
                                                onClick={handleReset(setMonthlyVisits, setIsMonthlyVisitsTyping, setIsMonthlyVisitsModified)}
                                                sx={{ 
                                                    display: showCloseIcon(isMonthlyVisitsTyping, monthlyVisits, initialMonthlyVisits) ? 'flex' : 'none',
                                                    visibility: showCloseIcon(isMonthlyVisitsTyping, monthlyVisits, initialMonthlyVisits) ? 'visible' : 'hidden',
                                                }}
                                                size="small"
                                            >
                                                <Image src='/close-circle-purple.svg' alt='close-icon-purple' height={18} width={18} />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                onFocus={handleFocus(monthlyVisits, setIsMonthlyVisitsFocused, setIsMonthlyVisitsTyping)}
                                onBlur={handleBlur(monthlyVisits, setIsMonthlyVisitsFocused, setIsMonthlyVisitsTyping)}
                            />
                            <Button variant="contained" color="primary" onClick={() => handleSaveBusinessInfo('monthlyVisits')}
                                sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #5052B2',
                                    background: '#fff',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    fontFamily: 'Nunito Sans',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    lineHeight: '20px',
                                    color: '#5052b2',
                                    textTransform: 'none',
                                    padding: '10px 24px',
                                    height: '40px',
                                    '&:hover' : {
                                        background: 'transparent'
                                    },
                                    '&.Mui-disabled': {
                                        background: 'transparent',
                                        opacity: '0.4'
                                    }
                                }}
                                disabled={!isSaveEnabled(monthlyVisits, initialMonthlyVisits, isMonthlyVisitsModified)}
                                >
                                Save
                            </Button>
                        </Box>
                        </Box>
                    </Box>
                    </Box>
                </Box>

            
    );
};
