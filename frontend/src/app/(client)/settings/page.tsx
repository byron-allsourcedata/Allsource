"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { planStyles } from './settingsStyles';
import { SettingsAccountDetails } from './components/SettingsAccountDetails';
import { SettingsTeams } from './components/SettingsTeams';
import { SettingsBilling } from './components/SettingsBilling';
import { SettingsSubscription } from './components/SettingsSubscription';
import { SettingsApiDetails } from './components/SettingsApiDetails';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import CustomTooltip from '@/components/customToolTip';
import { useNotification } from '@/context/NotificationContext';

const Settings: React.FC = () => {
    const {hasNotification} = useNotification();
    const [activeSection, setActiveSection] = useState<string>('accountDetails');
    const [accountDetails, setAccountDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const router = useRouter();
    const searchParams = useSearchParams();

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

    useEffect(() => {
        const sectionFromUrl = searchParams.get('section');
        if (sectionFromUrl) {
            setActiveSection(sectionFromUrl);
        }
        fetchAccountDetails();
    }, [searchParams]);

    const handleTabChange = (section: string) => {
        setActiveSection(section);
        router.push(`/settings?section=${section}`);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, padding: '1rem 0rem 1rem',
                position: 'fixed',
                top: '68px',
                right: '16px',
                left: '170px',
                background: '#fff',
                zIndex: '1200',
                paddingLeft: '30px',
                paddingRight: '24px',
                mx: '-24px',
                '@media (max-width: 1199px)': {
                    paddingTop: '1rem'
                },
                "@media (max-width: 900px)": { 
                  left: '20px',
                  flexDirection: 'column',
                  alignItems: 'start',
                  zIndex: 10,
                  pt: hasNotification ? '3.25rem' : '20px',
                  top: hasNotification ? '68px' : '60px'
                },
                "@media (max-width: 400px)": { 
                    pt: hasNotification ? '4rem' : '20px',
                    top: hasNotification ? '68px' : '60px'
                  },
            }}>
                <Typography variant="h4" gutterBottom className='first-sub-title' sx={{...planStyles.title, gap:1, alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'row',}}>
                    Settings <CustomTooltip title={"The Settings menu allows you to customise your user experience, manage your account preferences, and adjust notifications."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/settings"/>
                </Typography>
                <Box sx={{ display: 'flex', gap: 4.25, overflowX: 'auto', justifyContent: 'center', width:'86%', alignItems: 'center', "@media (max-width: 900px)": { 
                  width: '100%', gap: 2.5,
                }, "@media (max-width: 400px)": {width: '100%', gap: 1.25  }, "@media (max-width: 350px)": {width: '100%', gap: 1, overflow: 'hidden'  }}}>
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
                {/* <Button
                    sx={planStyles.buttonHeading}
                    variant={activeSection === 'apiDetails' ? 'contained' : 'outlined'}
                    onClick={() => handleTabChange('apiDetails')}
                >
                    API Details
                </Button> */}
            </Box>
            </Box>
            


                        {isLoading ? (
                <CustomizedProgressBar />
            ) : (
                <Box sx={{ marginTop: '68px',
                 "@media (max-width: 900px)": {
                    marginTop: hasNotification ? '7rem' :'5rem'
                    }
                }}>
                    {activeSection === 'accountDetails' && accountDetails && (
                        <SettingsAccountDetails accountDetails={accountDetails} />
                    )}

                    {activeSection === 'teams' && <SettingsTeams />}

                    {activeSection === 'billing' && <SettingsBilling />}

                    {activeSection === 'subscription' && <SettingsSubscription />}

                    {activeSection === 'apiDetails' && <SettingsApiDetails />}
                </Box>
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
