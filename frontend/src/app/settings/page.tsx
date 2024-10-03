"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogActions, Tooltip, Slider, DialogContent, DialogTitle, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel, InputAdornment, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { planStyles } from './settingsStyles';
import { SettingsAccountDetails } from '@/components/SettingsAccountDetails';
import { SettingsTeams } from '@/components/SettingsTeams';
import { SettingsBilling } from '@/components/SettingsBilling';
import { SettingsSubscription } from '@/components/SettingsSubscription';
import { SettingsApiDetails } from '@/components/SettingsApiDetails';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import CustomTooltip from '@/components/customToolTip';

const Settings: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>('accountDetails');
    const [accountDetails, setAccountDetails] = useState<any>(null); 
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Функция для получения данных аккаунта
    const fetchAccountDetails = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.get('/settings/account-details');
            const data = response.data;
            setAccountDetails(data);
        } catch (error) {
            console.error('Error fetching account details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // useEffect для загрузки данных один раз при монтировании
    useEffect(() => {
        fetchAccountDetails();
    }, []);
    
    if (isLoading) {
        return <CustomizedProgressBar />;
    }
    
    return (
        <Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 2, padding: '1.5rem 0rem 0',
                '@media (max-width: 1199px)': {
                    paddingTop: '1rem'
                }
            }}>
                <Typography variant="h4" gutterBottom className='first-sub-title' sx={planStyles.title}>
                    Settings
                </Typography>
                <CustomTooltip title={"The Settings menu allows you to customise your user experience, manage your account preferences, and adjust notifications."} linkText="Learn more" linkUrl="https://maximiz.ai"/>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 4.25, marginBottom: 3, overflowX: 'auto' }}>
                <Button
                    className='tab-heading'
                    sx={planStyles.buttonHeading}
                    variant={activeSection === 'accountDetails' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('accountDetails')}
                >
                    Account Details
                </Button>
                <Button
                    className='tab-heading'
                    sx={planStyles.buttonHeading}
                    variant={activeSection === 'teams' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('teams')}
                >
                    Teams
                </Button>
                <Button
                    className='tab-heading'
                    sx={planStyles.buttonHeading}
                    variant={activeSection === 'billing' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('billing')}
                >
                    Billing
                </Button>
                <Button
                    className='tab-heading'
                    sx={planStyles.buttonHeading}
                    variant={activeSection === 'subscription' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('subscription')}
                >
                    Subscription
                </Button>
                <Button
                    className='tab-heading'
                    sx={planStyles.buttonHeading}
                    variant={activeSection === 'apiDetails' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('apiDetails')}
                >
                    API Details
                </Button>
            </Box>

            {activeSection === 'accountDetails' && (
                <SettingsAccountDetails accountDetails={accountDetails} />
            )}

            {activeSection === 'teams' && (
                <SettingsTeams />
            )}

            {activeSection === 'billing' && (
                <SettingsBilling />
            )}

            {activeSection === 'subscription' && (
                <SettingsSubscription />
            )}


            {activeSection === 'apiDetails' && (
                <SettingsApiDetails />
                
            )}

        </Box>
    );
};

export default Settings;
