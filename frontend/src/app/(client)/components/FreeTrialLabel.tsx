"use client";
import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import DomainVerificationIcon from '@mui/icons-material/DomainVerification';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import useAxios from 'axios-hooks';
import { BookACallPopup } from './BookACallPopup';
import ProgressBar from '../sources/components/BlueProgressLoader';

const FreeTrialLabel: React.FC = () => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [domainCount, setDomainCount] = useState<number>(0);
    const [creditsCount, setCreditsCount] = useState<number>(0);
    const [domainLimitCount, setDomainLimitCount] = useState<number>(0);
    const [creditsLimitCount, setCreditsLimitCount] = useState<number>(0);
    const [upgradePlanPopup, setUpgradePlanPopup] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setAccessToken(token);
    }, []);

    const [{ data, loading }, refetch] = useAxios(
        {
            url: `${process.env.NEXT_PUBLIC_API_BASE_URL}me`,
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            method: 'GET',
        },
        { manual: true }
    );

    useEffect(() => {
        if (accessToken) {
            refetch();
        }
    }, [accessToken]);

    useEffect(() => {
        if (data) {
            const { user_info, user_plan, user_domains } = data;
            if (user_info && user_plan) {
                setCreditsCount(user_info.leads_credits);
                setDomainCount(user_domains.length);
                setDomainLimitCount(user_plan.domain_limit);
                setCreditsLimitCount(user_plan.lead_credits)
            }
        }
    }, [data]);


    const is_artificial_status = data?.user_plan?.is_artificial_status


    const handleContactSales = () => {
        setUpgradePlanPopup(true);
    }

    const handleChoosePlanSlider = () => {
        setUpgradePlanPopup(true);
    };

    return (
        <>
            <BookACallPopup open={upgradePlanPopup} handleClose={() => setUpgradePlanPopup(false)} />
            {is_artificial_status && (
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexGrow: 1,
                    px: 2,
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    backgroundColor: '#EBF5FF',
                    borderRadius: '8px',
                    border: '2px solid rgba(56, 152, 252, 0.2)',
                    width: '100%',
                    fontSize: '14px',
                    '@media (min-width: 901px)': {
                        marginRight: '2em'
                    }
                }}>

                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            p: '6.25px 0px',
                            fontSize: '12px',
                            width: '100%',
                            justifyContent: 'space-between',
                            color: '#323232',
                        }}
                    >
                        <Box>
                            <Typography component="div" sx={{ display: 'flex', alignItems: 'center', }}>
                                <Box component="span" sx={{ mr: '4px', textDecorationStyle: 'solid', }}>
                                    You are on Free Trial:
                                </Box>
                                <Box component="span" sx={{ fontWeight: 'normal', mr: '4px', color: 'rgba(0, 0, 0, 0.5)' }}>
                                    To upgrade, unlock or schedule demo, please
                                </Box>
                                <Box
                                    component="span"
                                    sx={{
                                        textDecoration: 'underline',
                                        cursor: 'pointer',
                                        mr: '8px',
                                        textDecorationStyle: 'solid'
                                    }}
                                    onClick={handleContactSales}
                                >
                                    Contact sales
                                </Box>
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <DomainVerificationIcon fontSize="small" sx={{ color: '#3898FC' }} />
                                <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                    <Box component="span" sx={{ color: 'rgba(0, 0, 0, 0.5)' }}>{domainCount}</Box>
                                    /{domainLimitCount === -1 ? 'unlimited' : domainLimitCount}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AllInboxIcon fontSize="small" sx={{ color: '#3898FC' }} />
                                <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                    <Box component="span" sx={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                                        {creditsCount === -1 ? '0' : creditsCount.toLocaleString()}
                                    </Box>
                                    /{creditsLimitCount === -1 ? '0' : creditsLimitCount} Credits
                                </Typography>
                            </Box>

                            <Button
                                onClick={handleChoosePlanSlider}
                                variant="outlined"
                                sx={{
                                    textTransform: 'none',
                                    fontFamily: 'Nunito Sans',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    px: '9px',
                                    py: '2px',
                                    borderColor: '#3898FC',
                                    borderRadius: '4px',
                                    bgcolor: '#3898FC',
                                    marginLeft: 'auto',
                                    color: '#FFFFFF',
                                    textAlign: 'right',
                                    '&:hover': {
                                        bgcolor: '#E6F2FF',
                                        borderColor: '#3898FC',
                                    },
                                }}
                            >
                                Request pricing
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ width: '100%', mb: '8px' }}>
                        <ProgressBar progress={{ total: 100, processed: 50 }} />
                    </Box>
                </Box>

            )}

        </>
    );
};

export default FreeTrialLabel;
