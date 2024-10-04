"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation'; // Импорт для работы с URL
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

    const router = useRouter();
    const searchParams = useSearchParams(); // Получаем query-параметры из URL

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

    // useEffect для установки активного раздела из URL-параметра
    useEffect(() => {
        const sectionFromUrl = searchParams.get('section'); // Извлекаем параметр "section"
        if (sectionFromUrl) {
            setActiveSection(sectionFromUrl);
        }
        fetchAccountDetails();
    }, [searchParams]);

    // Функция для изменения активного раздела и обновления URL
    const handleTabChange = (section: string) => {
        setActiveSection(section);
        router.push(`/settings?section=${section}`); // Обновляем URL при смене таба
    };

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
                    onClick={() => handleTabChange('accountDetails')}
                >
                    Account Details
                </Button>
                <Button
                    className='tab-heading'
                    sx={planStyles.buttonHeading}
                    variant={activeSection === 'teams' ? 'contained' : 'outlined'}
                    onClick={() => handleTabChange('teams')}
                >
                    Teams
                </Button>
                <Button
                    className='tab-heading'
                    sx={planStyles.buttonHeading}
                    variant={activeSection === 'billing' ? 'contained' : 'outlined'}
                    onClick={() => handleTabChange('billing')}
                >
                    Billing
                </Button>
                <Button
                    className='tab-heading'
                    sx={planStyles.buttonHeading}
                    variant={activeSection === 'subscription' ? 'contained' : 'outlined'}
                    onClick={() => handleTabChange('subscription')}
                >
                    Subscription
                </Button>
                <Button
                    className='tab-heading'
                    sx={planStyles.buttonHeading}
                    variant={activeSection === 'apiDetails' ? 'contained' : 'outlined'}
                    onClick={() => handleTabChange('apiDetails')}
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

const SettingsPage: React.FC = () => {
    return (
        <Suspense fallback={<CustomizedProgressBar />}>
            <Settings />
        </Suspense>
    )
};

export default SettingsPage;
