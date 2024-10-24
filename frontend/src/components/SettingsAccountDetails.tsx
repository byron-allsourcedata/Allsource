"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogActions, Tooltip, Slider, DialogContent, DialogTitle, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel, InputAdornment, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import Image from 'next/image';
import { showErrorToast, showToast } from './ToastNotification';
import CustomizedProgressBar from './CustomizedProgressBar';
import { display } from '@mui/system';

const accontDetailsStyles = {
    formField: {
        margin: '0',
        maxWidth: '65%'
    },
    inputLabel: {
        fontFamily: 'Nunito Sans',
        fontSize: '12px',
        lineHeight: '16px',
        color: 'rgba(17, 17, 19, 0.60)',
        '&.Mui-focused': {
            color: 'rgba(17, 17, 19, 0.6)',
            fontFamily: 'Nunito Sans',
            fontWeight: 400,
            fontSize: '12px',
            lineHeight: '16px'
        },
    },
    formInput: {
        '&.MuiOutlinedInput-root': {
            '& .MuiOutlinedInput-input': {
                color: '#202124 !important',
            },
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#5052B2',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#5052B2',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#5052B2',
            },
        },
    },
    orDivider: {
        display: 'flex',
        alignItems: 'center',
        maxWidth: '80%',
        margin: '0',
        '@media (max-width: 440px)': {
            maxWidth: '115%',
            margin: '0 -1em',
        }

    },
    passwordValidationText: {
        '& .MuiTypography-root' : {
          fontFamily: 'Nunito Sans',
          fontSize: '12px',
          fontWeight: '400',
          color: '#707071',
          lineHeight: '22px'
        }
      },
      passwordValidationTextSuccess: {
        '& .MuiTypography-root' : {
          fontFamily: 'Nunito Sans',
          fontSize: '12px',
          fontWeight: '400',
          color: '#202124',
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
        '&:last-child': {
            padding: 0
        }
    },
    passwordContentListItemIcon: {
        minWidth: '0',
        marginRight: '4px'
    },
}

interface SettingsAccountDetailsProps {
    accountDetails: {
        full_name: string;
        email_address: string;
        pass_exists: boolean;
        company_name: string;
        company_website: string;
        company_website_visits: string;
        is_email_confirmed: string;
        reset_password_sent_at: string;
    };
}

export const SettingsAccountDetails: React.FC<SettingsAccountDetailsProps> = ({ accountDetails }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [fullName, setFullName] = useState(accountDetails.full_name);
    const [emailAddress, setEmailAddress] = useState(accountDetails.email_address);
    const [organizationName, setOrganizationName] = useState(accountDetails.company_name);
    const [companyWebsite, setCompanyWebsite] = useState(accountDetails.company_website);
    const [monthlyVisits, setMonthlyVisits] = useState(accountDetails.company_website_visits);
    const [resetPasswordDate, setResetPasswordDate] = useState(accountDetails.reset_password_sent_at);
    const [isFocused, setIsFocused] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isModified, setIsModified] = useState(false);
    const [initialValue, setInitialValue] = useState(accountDetails.full_name);
    const [isFullNameEditable, setIsFullNameEditable] = useState(false);
    const fullNameRef = useRef<HTMLInputElement>(null);

    const [initialEmail, setInitialEmail] = useState(accountDetails.email_address);
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isEmailTyping, setIsEmailTyping] = useState(false);
    const [isEmailModified, setIsEmailModified] = useState(false);
    const [isEmailEditable, setIsEmailEditable] = useState(false);
    const emailRef = useRef<HTMLInputElement>(null);

    const [initialOrganizationName, setInitialOrganizationName] = useState(accountDetails.company_name);
    const [isOrganizationNameFocused, setIsOrganizationNameFocused] = useState(false);
    const [isOrganizationNameTyping, setIsOrganizationNameTyping] = useState(false);
    const [isOrganizationNameModified, setIsOrganizationNameModified] = useState(false);
    const [isOrganizationNameEditable, setIsOrganizationNameEditable] = useState(false);
    const organizationNameRef = useRef<HTMLInputElement>(null);

    const [initialCompanyWebsite, setInitialCompanyWebsite] = useState(accountDetails.company_website);
    const [isCompanyWebsiteFocused, setIsCompanyWebsiteFocused] = useState(false);
    const [isCompanyWebsiteTyping, setIsCompanyWebsiteTyping] = useState(false);
    const [isCompanyWebsiteModified, setIsCompanyWebsiteModified] = useState(false);
    const [isCompanyWebsiteEditable, setIsCompanyWebsiteEditable] = useState(false);
    const companyWebsiteRef = useRef<HTMLInputElement>(null);

    const [initialMonthlyVisits, setInitialMonthlyVisits] = useState(accountDetails.company_website_visits);
    const [isMonthlyVisitsFocused, setIsMonthlyVisitsFocused] = useState(false);
    const [isMonthlyVisitsTyping, setIsMonthlyVisitsTyping] = useState(false);
    const [isMonthlyVisitsModified, setIsMonthlyVisitsModified] = useState(false);
    const [isMonthlyVisitsEditable, setIsMonthlyVisitsEditable] = useState(false);
    const monthlyVisitsRef = useRef<HTMLInputElement>(null);

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

    // useEffect(() => {
    //     // Проверка на мобильное устройство по ширине экрана
    //     if (window.innerWidth >= 768) {
    //         document.body.style.overflow = 'hidden';
    //     }

    //     return () => {
    //         // Сброс overflow на 'auto' при размонтировании компонента
    //         document.body.style.overflow = 'auto';
    //     };
    // }, []);

    const handleSaveAccountDetails = (field: 'full_name' | 'email_address') => {
        const accountData = {
            account: {
                [field]: field === 'full_name' ? fullName : emailAddress
            }
        };
        axiosInterceptorInstance.put('/settings/account-details', accountData)
            .then(() => {
                showToast('Account details updated successfully');
                if (field === 'full_name') {
                    setIsFullNameEditable(false);
                    setInitialValue(fullName);
                }
                if (field === 'email_address') {
                    setIsEmailEditable(false);
                    setInitialEmail(fullName);
                }
            })
            .catch(error => {
                if (error.response && error.response.status === 403) {
                    showErrorToast('Access denied: You do not have permission.');
                } else {
                    console.error('Error revoking invitation:', error);
                }
            }
            );
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
            let changePasswordData;
            if (accountDetails.pass_exists){
            changePasswordData = {
                change_password: {
                    current_password: currentPassword,
                    new_password: newPassword
                }
            }}
            else{
                changePasswordData = {set_password: {
                    current_password: null,
                    new_password: newPassword
                }}}

            console.log(changePasswordData)
            
            axiosInterceptorInstance.put('/settings/account-details', changePasswordData)
                .then(response => {
                    if (response.data === 'SUCCESS') {
                        showToast('Password changed successfully');
                    } else if (response.data === 'INCORRECT_PASSWORD') {
                        showErrorToast('Incorrect password. Please try again.');
                    }
                })
                .catch(error => {
                    showErrorToast('Error changing password:', error);
                });
        } else {
            showErrorToast('New passwords do not match');
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
                showToast('Business info updated successfully');
                if (field === 'organizationName') {
                    setIsOrganizationNameEditable(false);
                    setInitialOrganizationName(organizationName);
                }
                if (field === 'companyWebsite') {
                    setIsCompanyWebsiteEditable(false);
                    setInitialCompanyWebsite(companyWebsite);
                }
                if (field === 'monthlyVisits') {
                    setIsMonthlyVisitsEditable(false);
                    setInitialMonthlyVisits(monthlyVisits);
                }
            })
            .catch(error => {
                if (error.response && error.response.status === 403) {
                    showErrorToast('Access denied: You do not have permission.');
                } else {
                    console.error('Error revoking invitation:', error);
                }
            });
    };


    const handleChange = (
        setValue: React.Dispatch<React.SetStateAction<string>>,
        setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
        setIsModified: React.Dispatch<React.SetStateAction<boolean>>
      ) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        setIsTyping(true); // Show the close icon when typing
        setIsModified(true);
      };
      
      const handleReset = (
        setValue: React.Dispatch<React.SetStateAction<string>>,
        setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
        setIsModified: React.Dispatch<React.SetStateAction<boolean>>,
        setIsEditable: React.Dispatch<React.SetStateAction<boolean>>,
        initialValue: string
      ) => () => {
        setValue(initialValue); // Reset the input to its initial value
        setIsTyping(false);     // Hide the close icon when reset
        setIsModified(false);
        setIsEditable(false);
      };

      const handleEnableEdit = (
        setIsEditable: React.Dispatch<React.SetStateAction<boolean>>,
        inputRef: React.RefObject<HTMLInputElement>
      ) => () => {
        setIsEditable(true); // Enable field editing
        if (inputRef.current) {
          inputRef.current.focus(); // Focus the input
        }
      };

    // Generic function to handle focus
    const handleFocus = (value: string, setIsFocused: React.Dispatch<React.SetStateAction<boolean>>, setIsTyping: React.Dispatch<React.SetStateAction<boolean>>) => () => {
        setIsFocused(true);
        if (value.trim() === '') {
            setIsTyping(false);
        }
    };

    // Generic function to handle blur
    const handleBlur = (
        value: string,
        initialValue: string,
        setIsEditable: React.Dispatch<React.SetStateAction<boolean>>,
        setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
        setIsModified: React.Dispatch<React.SetStateAction<boolean>>
    ) => () => {
        // If value wasn't modified, hide close icon and disable editing
        if (value === initialValue) {
            setIsTyping(false); // Hide close icon
            setIsEditable(false); // Disable editing when no changes were made
            setIsModified(false);
        }
    };

    // Check if the save button should be enabled
    const isSaveEnabled = (value: string, initialValue: string, isModified: boolean) =>
        value?.trim() !== '' && value !== initialValue && isModified;

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
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Box sx={{
                display: 'flex', flexDirection: 'column', gap: '24px',
                '@media (max-width: 899px)': {
                    minWidth: '100%'
                },
                '@media (min-width: 900px)': {
                    minWidth: '700px'
                },
                '@media (min-width: 1200px)': {
                    minWidth: '780px',
                    pl: 12
                }

            }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <Typography variant="h6" className='first-sub-title' sx={{
                        color: '#4a4a4a !important',
                        lineHeight: '22px !important'
                    }}>Name</Typography>
                    <Box sx={{
                        display: 'flex', gap: 2, alignItems: 'center',
                        '@media (max-width: 600px)': {
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                        },
                    }}>
                        <TextField 
                         sx={{
                            ...accontDetailsStyles.formField,
                            '& .MuiInputBase-root:hover .MuiIconButton-root': {
                                display: 'flex', // Show the write icon on hover
                            },
                            '& .MuiIconButton-root': {
                                display: isFullNameEditable || showCloseIcon(isTyping, fullName, initialValue) ? 'none' : 'none', // Always hidden
                            },
                        }}
                            label="Full Name"
                            value={fullName}
                            inputRef={fullNameRef}
                            onChange={handleChange(setFullName, setIsTyping, setIsModified)}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{
                                className: "form-input-label",
                                sx: accontDetailsStyles.inputLabel }}
                            InputProps={{
                                readOnly: !isFullNameEditable,
                                className: "form-input" ,
                                sx: accontDetailsStyles.formInput,
                                endAdornment: (
                                    <>
                                      {/* Show write icon when not editable, hidden by default */}
                                      {!isFullNameEditable && (
                                        <InputAdornment position="end">
                                          <IconButton
                                            onClick={handleEnableEdit(setIsFullNameEditable, fullNameRef)}
                                            sx={{
                                              display: 'none', // Hidden when input is editable
                                              '&:hover': {
                                                    display: 'flex', // Show on hover
                                                },
                                            }}
                                          >
                                            <Image src="/write-icon.svg" alt="write-icon" height={24} width={24} />
                                          </IconButton>
                                        </InputAdornment>
                                      )}
                          
                                      {/* Show close icon if user starts typing */}
                                      {showCloseIcon(isTyping, fullName, initialValue) && (
                                        <InputAdornment position="end">
                                          <IconButton
                                            onClick={handleReset(setFullName, setIsTyping, setIsModified, setIsFullNameEditable, initialValue)}
                                            size="small"
                                          >
                                            <Image src='/close-circle-purple.svg' alt='close-icon-purple' height={18} width={18} />
                                          </IconButton>
                                        </InputAdornment>
                                      )}
                                    </>
                                  ),
                            }}
                            onBlur={handleBlur(fullName, initialValue, setIsFullNameEditable, setIsTyping, setIsModified)}
                          
                        />
                        <Button className='hyperlink-red' variant="contained" color="primary" onClick={() => handleSaveAccountDetails('full_name')}
                            sx={{
                                borderRadius: '4px',
                                border: '1px solid #5052B2',
                                background: '#fff',
                                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                color: '#5052b2 !important',
                                textTransform: 'none',
                                padding: '10px 24px',
                                height: '40px',
                                '&:hover': {
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
                        margin: '0 -15px',
                        '@media (min-width: 601px)': {
                            display: 'none'
                        },
                    }}>
                        <Box sx={{ borderBottom: '1px solid #e4e4e4', flexGrow: 1 }} />
                    </Box>

                    <Typography variant="h6" sx={{
                        fontFamily: 'Nunito Sans',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#4a4a4a',
                        lineHeight: '22px'
                    }}>Email address</Typography>

                    <Box sx={{
                        display: 'flex', gap: 2, alignItems: 'center',
                        '@media (max-width: 600px)': {
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                        }
                    }}>
                        <TextField sx={{
                            ...accontDetailsStyles.formField,
                            '& .MuiInputBase-root:hover .MuiIconButton-root': {
                                display: 'flex', // Show the write icon on hover
                            },
                            '& .MuiIconButton-root': {
                                display: isEmailEditable || showCloseIcon(isTyping, emailAddress, initialEmail) ? 'none' : 'none', // Always hidden
                            },
                        }}
                            label="Email Address"
                            value={emailAddress}
                            inputRef={emailRef}
                            onChange={handleChange(setEmailAddress, setIsEmailTyping, setIsEmailModified)}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{ 
                                className: "form-input-label",
                                sx: accontDetailsStyles.inputLabel }}
                            InputProps={{
                                readOnly: !isEmailEditable,
                                className: "form-input",
                                sx: accontDetailsStyles.formInput,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {/* Conditionally render the verification status */}
                                        {!isEmailEditable && !isEmailTyping && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {emailAddress === initialEmail && accountDetails.is_email_confirmed ? (
                                                    <>
                                                        <Image src="/green-tick-circle.svg" alt='green-tick-circle' height={16} width={16} />
                                                        <Typography variant="caption" sx={{
                                                            fontFamily: 'Roboto',
                                                            fontSize: '12px',
                                                            fontWeight: '400',
                                                            lineHeight: '16px',
                                                            color: '#2b5b00'
                                                        }}>
                                                            Verified
                                                        </Typography>
                                                    </>
                                                ) : (
                                                    <Typography variant="caption" sx={{
                                                        fontFamily: 'Roboto',
                                                        fontSize: '12px',
                                                        fontWeight: '400',
                                                        lineHeight: '16px',
                                                        color: '#f8464b'
                                                    }}>
                                                        Not Verified
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                        
                                        {/* Show write icon only when hovering over the input */}
                                        {!isEmailEditable && (
                                            <IconButton
                                                onClick={handleEnableEdit(setIsEmailEditable, emailRef)}
                                                sx={{
                                                    display: 'none', // Hidden when input is editable
                                                    '&:hover': {
                                                        display: 'flex', // Show on hover
                                                    },
                                                }}
                                            >
                                                <Image src="/write-icon.svg" alt="write-icon" height={24} width={24} />
                                            </IconButton>
                                        )}chb                        
                                        {/* Show close icon if user starts typing */}
                                        {showCloseIcon(isEmailTyping, emailAddress, initialEmail) && (
                                            <IconButton
                                                onClick={handleReset(setEmailAddress, setIsEmailTyping, setIsEmailModified, setIsEmailEditable, initialEmail)}
                                                size="small"
                                            >
                                                <Image src='/close-circle-purple.svg' alt='close-icon-purple' height={18} width={18} />
                                            </IconButton>
                                        )}
                                    </InputAdornment>
                                ),
                            }}
                            onBlur={handleBlur(emailAddress, initialEmail, setIsEmailEditable, setIsTyping, setIsModified)}
                        />
                        <Button className='hyperlink-red' variant="contained" color="primary" onClick={() => handleSaveAccountDetails('email_address')}
                            sx={{
                                borderRadius: '4px',
                                border: '1px solid #5052B2',
                                background: '#fff',
                                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                color: '#5052b2 !important',
                                textTransform: 'none',
                                padding: '10px 24px',
                                height: '40px',
                                '&:hover': {
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
                        margin: '0 -15px',
                        '@media (min-width: 601px)': {
                            display: 'none'
                        },
                    }}>
                        <Box sx={{ borderBottom: '1px solid #e4e4e4', flexGrow: 1 }} />
                    </Box>

                    <Box sx={{
                        display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center',
                        '@media (min-width: 601px)': {
                            display: 'none'
                        }
                    }}>
                        <Typography variant="h6" className='first-sub-title' sx={{
                            color: '#4a4a4a !important',
                            lineHeight: '22px !important'
                        }}>Password</Typography>
                        <Typography variant="body2" className='third-sub-title' sx={{
                            lineHeight: '16px !important',
                            color: 'rgba(17, 17, 19, 0.60) !important'
                        }}>
                            Last changed: <strong>{calculateDaysAgo(resetPasswordDate)}</strong>
                        </Typography>
                    </Box>
                    <Typography variant="h6" className='first-sub-title' sx={{
                            color: '#4a4a4a !important',
                            lineHeight: '22px !important',
                            '@media (max-width: 600px)': {
                                display: 'none'
                            }
                        }}>Password</Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center', maxWidth: '78%' }}>
                        <Button className='hyperlink-red' variant="contained" color="secondary" onClick={handleChangePasswordPopupOpen}
                            sx={{
                                borderRadius: '4px',
                                border: '1px solid #5052B2',
                                background: '#fff',
                                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                color: '#5052b2 !important',
                                textTransform: 'none',
                                padding: '10px 24px',
                                height: '40px',
                                '&:hover': {
                                    background: 'transparent'
                                }
                            }}
                        >
                            Change password
                        </Button>
                        <Typography variant="body2" className='third-sub-title' sx={{
                            lineHeight: '16px !important',
                            color: 'rgba(17, 17, 19, 0.60) !important',
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
                            <Typography variant="h6" className='first-sub-title' sx={{
                                textAlign: 'center'
                            }}>
                                Change password
                            </Typography>
                            <IconButton onClick={handleChangePasswordPopupClose} sx={{ p: 0 }}>
                                <CloseIcon sx={{ width: '20px', height: '20px' }} />
                            </IconButton>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                            <Box sx={{ px: 4, py: 3, width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Typography variant="h6" className='first-sub-title'>
                                    Update your password to enhance account security and maintain access control.
                                </Typography>

                                <TextField sx={{...accontDetailsStyles.formField,
                                    maxWidth: '100%', 
                                    display: accountDetails.pass_exists ? 'block':'none' 
                                }}
                                    InputLabelProps={{ 
                                        className: "form-input-label",
                                        sx: accontDetailsStyles.inputLabel }}
                                    label="Current Password"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    fullWidth
                                    margin="normal"
                                    InputProps={{
                                        className: "form-input",
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
                                <TextField sx={{...accontDetailsStyles.formField,
                                    maxWidth: '100%'
                                    }}
                                    InputLabelProps={{ 
                                        className: "form-input-label",
                                        sx: accontDetailsStyles.inputLabel }}
                                    label="New Password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    error={Boolean(errors.newPassword)}
                                    helperText={errors.newPassword}
                                    fullWidth
                                    margin="normal"
                                    InputProps={{
                                        className: "form-input",
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
                                        <ListItemText sx={passwordValidation.upperCase ? accontDetailsStyles.passwordValidationTextSuccess : accontDetailsStyles.passwordValidationText} primary="1 uppercase" />
                                    </ListItem>
                                    <ListItem sx={accontDetailsStyles.passwordContentListItem}>
                                        <ListItemIcon sx={accontDetailsStyles.passwordContentListItemIcon}>
                                            <CustomCheckCircleIcon isSuccess={passwordValidation.lowerCase} />
                                        </ListItemIcon>
                                        <ListItemText sx={passwordValidation.lowerCase ? accontDetailsStyles.passwordValidationTextSuccess : accontDetailsStyles.passwordValidationText} primary="1 lowercase" />
                                    </ListItem>
                                </List>
                                <TextField
                                    sx={{...accontDetailsStyles.formField,
                                        maxWidth: '100%'
                                    }}
                                    InputLabelProps={{
                                        className: "form-input-label", 
                                        sx: accontDetailsStyles.inputLabel }}
                                    label="Confirm New Password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    fullWidth
                                    margin="normal"
                                    error={Boolean(errors.confirmNewPassword)}
                                    helperText={errors.confirmNewPassword}
                                    InputProps={{
                                        className: "form-input",
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
                                    className='hyperlink-red'
                                    onClick={handleChangePasswordPopupClose}
                                    sx={{
                                        backgroundColor: '#fff',
                                        letterSpacing: 'normal',
                                        color: "#5052b2 !important",
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
                                    className='hyperlink-red'
                                    onClick={handleChangePassword}
                                    sx={{
                                        backgroundColor: '#5052B2',
                                        letterSpacing: 'normal',
                                        color: "#fff !important",
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
                        <Typography variant="h6" className='first-sub-title' sx={{
                            color: '#4a4a4a !important',
                            lineHeight: '22px !important'
                        }}>
                            Business Info
                        </Typography>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 2,
                            '@media (max-width: 600px)': {
                                flexDirection: 'column',
                                alignItems: 'flex-start'
                            },
                        }}>
                            <TextField sx={{
                                ...accontDetailsStyles.formField,
                                '& .MuiInputBase-root:hover .MuiIconButton-root': {
                                    display: 'flex', // Show the write icon on hover
                                },
                                '& .MuiIconButton-root': {
                                    display: isOrganizationNameEditable || showCloseIcon(isOrganizationNameTyping, organizationName, initialOrganizationName) ? 'none' : 'none', // Always hidden
                                },
                            }}
                                label="Organization Name"
                                value={organizationName}
                                inputRef={organizationNameRef}
                                onChange={handleChange(setOrganizationName, setIsOrganizationNameTyping, setIsOrganizationNameModified)}
                                fullWidth
                                margin="normal"
                                InputLabelProps={{ 
                                    className: "form-input-label",
                                    sx: accontDetailsStyles.inputLabel }}
                                InputProps={{
                                    readOnly: !isOrganizationNameEditable,
                                    className: "form-input",
                                    sx: accontDetailsStyles.formInput,
                                    endAdornment: (
                                            <>
                                              {/* Show write icon when not editable, hidden by default */}
                                              {!isOrganizationNameEditable && (
                                                <InputAdornment position="end">
                                                  <IconButton
                                                    onClick={handleEnableEdit(setIsOrganizationNameEditable, organizationNameRef)}
                                                    sx={{
                                                      display: 'none', // Hidden when input is editable
                                                      '&:hover': {
                                                            display: 'flex', // Show on hover
                                                        },
                                                    }}
                                                  >
                                                    <Image src="/write-icon.svg" alt="write-icon" height={24} width={24} />
                                                  </IconButton>
                                                </InputAdornment>
                                              )}
                                  
                                              {/* Show close icon if user starts typing */}
                                              {showCloseIcon(isOrganizationNameTyping, organizationName, initialOrganizationName) && (
                                                <InputAdornment position="end">
                                                  <IconButton
                                                    onClick={handleReset(setOrganizationName, setIsOrganizationNameTyping, setIsOrganizationNameModified, setIsOrganizationNameEditable, initialOrganizationName)}
                                                    size="small"
                                                  >
                                                    <Image src='/close-circle-purple.svg' alt='close-icon-purple' height={18} width={18} />
                                                  </IconButton>
                                                </InputAdornment>
                                              )}
                                            </>
                                          ),
                                }}
                                onBlur={handleBlur(organizationName, initialOrganizationName, setIsOrganizationNameEditable, setIsOrganizationNameTyping, setIsOrganizationNameModified)}
                            />
                            <Button className='hyperlink-red' variant="contained" color="primary" onClick={() => handleSaveBusinessInfo('organizationName')}
                                sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #5052B2',
                                    background: '#fff',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#5052b2 !important',
                                    textTransform: 'none',
                                    padding: '10px 24px',
                                    height: '40px',
                                    '&:hover': {
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
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 2,
                            '@media (max-width: 600px)': {
                                flexDirection: 'column',
                                alignItems: 'flex-start'
                            }
                        }}>
                            <TextField sx={{
                                ...accontDetailsStyles.formField,
                                '& .MuiInputBase-root:hover .MuiIconButton-root': {
                                    display: 'flex', // Show the write icon on hover
                                },
                                '& .MuiIconButton-root': {
                                    display: isCompanyWebsiteEditable || showCloseIcon(isCompanyWebsiteTyping, companyWebsite, initialCompanyWebsite) ? 'none' : 'none', // Always hidden
                                },
                            }}
                                label="Company Website"
                                value={companyWebsite}
                                inputRef={companyWebsiteRef}
                                onChange={handleChange(setCompanyWebsite, setIsCompanyWebsiteTyping, setIsCompanyWebsiteModified)}
                                fullWidth
                                margin="normal"
                                InputLabelProps={{ 
                                    className: "form-input-label",
                                    sx: accontDetailsStyles.inputLabel }}
                                InputProps={{
                                    readOnly: !isCompanyWebsiteEditable,
                                    className: "form-input",
                                    sx: accontDetailsStyles.formInput,
                                    endAdornment: (
                                        <>
                                          {/* Show write icon when not editable, hidden by default */}
                                          {!isCompanyWebsiteEditable && (
                                            <InputAdornment position="end">
                                              <IconButton
                                                onClick={handleEnableEdit(setIsCompanyWebsiteEditable, companyWebsiteRef)}
                                                sx={{
                                                  display: 'none', // Hidden when input is editable
                                                  '&:hover': {
                                                        display: 'flex', // Show on hover
                                                    },
                                                }}
                                              >
                                                <Image src="/write-icon.svg" alt="write-icon" height={24} width={24} />
                                              </IconButton>
                                            </InputAdornment>
                                          )}
                              
                                          {/* Show close icon if user starts typing */}
                                          {showCloseIcon(isCompanyWebsiteTyping, companyWebsite, initialCompanyWebsite) && (
                                            <InputAdornment position="end">
                                              <IconButton
                                                onClick={handleReset(setCompanyWebsite, setIsCompanyWebsiteTyping, setIsCompanyWebsiteModified, setIsCompanyWebsiteEditable, initialCompanyWebsite)}
                                                size="small"
                                              >
                                                <Image src='/close-circle-purple.svg' alt='close-icon-purple' height={18} width={18} />
                                              </IconButton>
                                            </InputAdornment>
                                          )}
                                        </>
                                      ),
                                }}
                                onBlur={handleBlur(companyWebsite, initialCompanyWebsite, setIsCompanyWebsiteEditable, setIsCompanyWebsiteTyping, setIsCompanyWebsiteModified)}
                            />
                            <Button className='hyperlink-red' variant="contained" color="primary" onClick={() => handleSaveBusinessInfo('companyWebsite')}
                                sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #5052B2',
                                    background: '#fff',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#5052b2 !important',
                                    textTransform: 'none',
                                    padding: '10px 24px',
                                    height: '40px',
                                    '&:hover': {
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
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 2,
                            '@media (max-width: 600px)': {
                                flexDirection: 'column',
                                alignItems: 'flex-start'
                            }
                        }}>
                            <TextField sx={{
                                ...accontDetailsStyles.formField,
                                '& .MuiInputBase-root:hover .MuiIconButton-root': {
                                    display: 'flex', // Show the write icon on hover
                                },
                                '& .MuiIconButton-root': {
                                    display: isMonthlyVisitsEditable || showCloseIcon(isMonthlyVisitsTyping, monthlyVisits, initialMonthlyVisits) ? 'none' : 'none', // Always hidden
                                },
                            }}
                                label="Monthly Visits to Website"
                                value={monthlyVisits}
                                inputRef={monthlyVisitsRef}
                                onChange={handleChange(setMonthlyVisits, setIsMonthlyVisitsTyping, setIsMonthlyVisitsModified)}
                                fullWidth
                                margin="normal"
                                InputLabelProps={{ sx: accontDetailsStyles.inputLabel,
                                    className: "form-input-label"
                                 }}
                                InputProps={{
                                    readOnly: !isMonthlyVisitsEditable,
                                    className: "form-input",
                                    sx: accontDetailsStyles.formInput,
                                    endAdornment: (
                                        <>
                                          {/* Show write icon when not editable, hidden by default */}
                                          {!isMonthlyVisitsEditable && (
                                            <InputAdornment position="end">
                                              <IconButton
                                                onClick={handleEnableEdit(setIsMonthlyVisitsEditable, monthlyVisitsRef)}
                                                sx={{
                                                  display: 'none', // Hidden when input is editable
                                                  '&:hover': {
                                                        display: 'flex', // Show on hover
                                                    },
                                                }}
                                              >
                                                <Image src="/write-icon.svg" alt="write-icon" height={24} width={24} />
                                              </IconButton>
                                            </InputAdornment>
                                          )}
                              
                                          {/* Show close icon if user starts typing */}
                                          {showCloseIcon(isMonthlyVisitsTyping, monthlyVisits, initialMonthlyVisits) && (
                                            <InputAdornment position="end">
                                              <IconButton
                                                onClick={handleReset(setMonthlyVisits, setIsMonthlyVisitsTyping, setIsMonthlyVisitsModified, setIsMonthlyVisitsEditable, initialMonthlyVisits)}
                                                size="small"
                                              >
                                                <Image src='/close-circle-purple.svg' alt='close-icon-purple' height={18} width={18} />
                                              </IconButton>
                                            </InputAdornment>
                                          )}
                                        </>
                                      ),
                                }}
                                onBlur={handleBlur(monthlyVisits, initialMonthlyVisits, setIsMonthlyVisitsEditable, setIsMonthlyVisitsTyping, setIsMonthlyVisitsModified)}
                            />
                            <Button className='hyperlink-red' variant="contained" color="primary" onClick={() => handleSaveBusinessInfo('monthlyVisits')}
                                sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #5052B2',
                                    background: '#fff',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#5052b2 !important',
                                    textTransform: 'none',
                                    padding: '10px 24px',
                                    height: '40px',
                                    '&:hover': {
                                        background: 'transparent'
                                    },
                                    '&.Mui-disabled': {
                                        background: 'transparent',
                                        opacity: '0.4'
                                    }
                                }}
                                disabled={!isSaveEnabled(monthlyVisits, initialMonthlyVisits, isMonthlyVisitsModified)}
                                // disabled={isSaveDisabled}
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