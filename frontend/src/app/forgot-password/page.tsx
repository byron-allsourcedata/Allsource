'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Box, Button, TextField, Typography, IconButton, InputAdornment, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';
import { updatepasswordStyles } from './updatepasswordStyles';
import { showErrorToast, showToast } from '../../components/ToastNotification';

const ForgotPassword: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);


  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formValues, setFormValues] = useState({ password: '', confirmPassword: '' });
  const [formSubmitted, setFormSubmitted] = useState(false); // Track form submission

  const validateField = (name: string, value: string) => {
    const newErrors: { [key: string]: string } = { ...errors };

    switch (name) {
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else {
          const passwordValidation = isPasswordValid(value);
          if (!passwordValidation.length || !passwordValidation.upperCase || !passwordValidation.lowerCase) {
            newErrors.password = 'Please enter a stronger password';
          } else {
            delete newErrors.password;
          }
        }
        break;
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Confirm password is required';
        } else if (value !== formValues.password) {
          newErrors.confirmPassword = 'Invalid password combination.';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
    if (formSubmitted) {
      validateField(name, value);
    }
  };

  const isPasswordValid = (password: string) => {
    return {
      length: password.length >= 8,
      upperCase: /[A-Z]/.test(password),
      lowerCase: /[a-z]/.test(password),
    };
  };

  

  const passwordValidation = isPasswordValid(formValues.password);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormSubmitted(true); // Mark the form as submitted
    const newErrors: { [key: string]: string } = {};

    if (!formValues.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordValidation.length || !passwordValidation.upperCase || !passwordValidation.lowerCase) {
      newErrors.password = 'Please enter a stronger password';
    }

    if (!formValues.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formValues.confirmPassword !== formValues.password) {
      newErrors.confirmPassword = 'Invalid password combination.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
        const response = await axiosInstance.post('update-password', {
          confirm_password: formValues.confirmPassword,
            password: formValues.password,
            
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }});

      if (response.status === 200) {
        const responseData = response.data;

        if (responseData) {
          switch (responseData.status) {
            case "PASSWORD_UPDATED_SUCCESSFULLY":
              showToast("Password update successfuly!");
              router.push('/signin');
              break;

            case "PASSWORD_DO_NOT_MATCH":
              showErrorToast("Incorrect password");
              break;
            default:
              showErrorToast('Unexpected status: Service is not available now, try again or contact us at support@maximiz.ai');
          }
        } else {
          console.error('Empty response data');
        }
      } else {
        console.error('HTTP error:', response.status);
      }
    } catch (err) {
      const error = err as AxiosError;
      if (error.response && error.response.data) {
        const errorData = error.response.data as { [key: string]: string };
        setErrors(errorData);
      } else {
        console.error('Error:', error);
      }
    }
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
    <>
      <Box sx={updatepasswordStyles.logoContainer}>
        <Image src='/logo.svg' alt='logo' height={30} width={50} />
      </Box>
      <Box sx={updatepasswordStyles.mainContent}>
        <Box sx={updatepasswordStyles.container}>
          <Typography variant="h4" component="h1" className='heading-text' sx={updatepasswordStyles.title}>
            Change your password
          </Typography>
          <Typography className='second-sub-title' sx={updatepasswordStyles.text}>
            Update your password to enhance account security and maintain access control.
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={updatepasswordStyles.form}>
            <TextField sx={updatepasswordStyles.formField}
              InputLabelProps={{
                className: "form-input-label",
                sx: updatepasswordStyles.inputLabel }}
              label="New password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              fullWidth
              margin="normal"
              value={formValues.password}
              onChange={handleChange}
              error={Boolean(errors.password)}
              helperText={errors.password}
              InputProps={{
                className: "form-input",
                sx: updatepasswordStyles.formInput,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {/* {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />} */}
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
            <List sx={updatepasswordStyles.passwordContentList}>
              <ListItem sx={updatepasswordStyles.passwordContentListItem}>
                <ListItemIcon sx={updatepasswordStyles.passwordContentListItemIcon}>
                  <CustomCheckCircleIcon isSuccess={passwordValidation.length} />
                </ListItemIcon>
                <ListItemText sx={passwordValidation.length ? updatepasswordStyles.passwordValidationTextSuccess : updatepasswordStyles.passwordValidationText} primary="8 characters min." />
              </ListItem>
              <ListItem sx={updatepasswordStyles.passwordContentListItem}>
                <ListItemIcon sx={updatepasswordStyles.passwordContentListItemIcon}>
                  <CustomCheckCircleIcon isSuccess={passwordValidation.upperCase} />
                </ListItemIcon>
                <ListItemText sx={passwordValidation.upperCase ? updatepasswordStyles.passwordValidationTextSuccess : updatepasswordStyles.passwordValidationText}  primary="1 uppercase" />
              </ListItem>
              <ListItem sx={updatepasswordStyles.passwordContentListItem}>
                <ListItemIcon sx={updatepasswordStyles.passwordContentListItemIcon}>
                  <CustomCheckCircleIcon isSuccess={passwordValidation.lowerCase} />
                </ListItemIcon>
                <ListItemText sx={passwordValidation.lowerCase ? updatepasswordStyles.passwordValidationTextSuccess : updatepasswordStyles.passwordValidationText} primary="1 lowercase" />
              </ListItem>
          </List>
            <TextField
              InputLabelProps={{ 
                className: "form-input-label",
                sx: updatepasswordStyles.inputLabel }}
              label="Confirm password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              variant="outlined"
              fullWidth
              margin="normal"
              value={formValues.confirmPassword}
              onChange={handleChange}
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword}
              InputProps={{
                className: "form-input",
                sx: updatepasswordStyles.formInput,
                endAdornment: (
                  <InputAdornment position="end">
                    {Boolean(errors.confirmPassword) && (
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
                      {/* {showConfirmPassword ? <VisibilityIcon /> : <VisibilityOffIcon />} */}
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
            <Button className='hyperlink-red'
              type="submit"
              variant="contained"
              sx={updatepasswordStyles.submitButton}
              fullWidth
            >
              Reset Password
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
};

const ForgotPasswordPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPassword />
    </Suspense>
  );
};

export default ForgotPasswordPage;
