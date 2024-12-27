"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Tabs, Tab, TextField, Slider, IconButton, Drawer, Divider, Chip, Link } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlanCard from '@/components/PlanCard';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import CustomTooltip from './customToolTip';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import Image from 'next/image';
import axiosInstance from "../axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from './ToastNotification';
import axios from 'axios';



const subscriptionStyles = {
    title: {
        whiteSpace: 'nowrap',
        textAlign: 'start',
        lineHeight: '22px',
        margin: 0
    },
    formContainer: {
        display: 'flex',
        gap: 3,
        justifyContent: 'space-between',
        width: '100%',
        marginTop: '40px',
        '@media (max-width: 900px)': {
            flexDirection: 'column',
            marginTop: '24px'
        },
    },
    formWrapper: {
        '@media (min-width: 901px)': {
            // width: '344px'
            width: '100%'
        }
    },
    plantabHeading: {
        padding: '10px 32px',
        textTransform: 'none',
        fontWeight: '400 !important',
        '&.Mui-selected': {
            background: '#5052b2',
            color: '#fff',
            border: 'none',
            '& .active-text-color': {
                color: '#fff'
            },
            '& .active-save-color': {
                background: '#fff'
            }
        },
        '@media (max-width: 600px)': {
            paddingLeft: '22px',
            paddingRight: '22px',
            fontSize: '18px !important',
            width: '50%',
        }
    },
    saveHeading: {
        background: '#EDEDF7',
        padding: '5px 12px',
        borderRadius: '4px',
        fontSize: '14px !important',
        color: '#202124 !important'
    },
    inputLabel: {
        top: '-3px',
        '&.Mui-focused': {
            top: 0,
            color: 'rgba(17, 17, 19, 0.6)',
            fontFamily: 'Nunito Sans',
            fontWeight: 400,
            fontSize: '12px',
            lineHeight: '16px'
        },
    }
}

const marks = [
    { value: 0, label: '0/yr' },
    { value: 10000, label: '10K' },
    { value: 25000, label: '25K' },
    { value: 50000, label: '50K' },
    { value: 100000, label: '100K' },
    { value: 250000, label: '250K' },
    { value: 500000, label: '500K' },
    { value: 1000000, label: '1M' },
    { value: 2500000, label: '2.5M' },
    { value: 5000000, label: '5M' },
    { value: 7500000, label: '7.5M' },  // Adjusted additional mark to balance space
    { value: 10000000, label: '10M' },
    { value: 50000000, label: '50M' }
];

export const SettingsSubscription: React.FC = () => {
    const [plans, setPlans] = useState<any[]>([]);
    const [allPlans, setAllPlans] = useState<any[]>([]);
    const [credits, setCredits] = useState<number>(50000);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [tabValue, setTabValue] = useState(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [customPlanPopupOpen, setCustomPlanPopupOpen] = useState(false);
    const [cancelSubscriptionPlanPopupOpen, setCancelSubscriptionPlanPopupOpen] = useState(false);
    const [excitingOfferPopupOpen, setExcitingOfferPopupOpen] = useState(false);
    const [confirmCancellationPopupOpen, setConfirmCancellationPopupOpen] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [formValues, setFormValues] = useState({ unsubscribe: '', });
    const [hasActivePlan, setHasActivePlan] = useState<boolean>(false);
    const [showSlider, setShowSlider] = useState(true);
    const [utmParams, setUtmParams] = useState<string | null>(null);

    const handleFilterPopupClose = () => {
        setShowSlider(false);
    };


    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        const period = newValue === 0 ? 'month' : 'year';
        const period_plans = allPlans.filter((plan: any) => plan.interval === period);
        setPlans(period_plans);
        const activePlan = allPlans.find((plan: any) => plan.is_active && plan.title !== 'Free Trial') !== undefined;
        setHasActivePlan(activePlan);
    };

    const handleCustomPlanPopupOpen = () => {
        setCustomPlanPopupOpen(true);
    };

    const handleCustomPlanPopupClose = () => {
        setCustomPlanPopupOpen(false);
    };

    const handleCancelSubscriptionPlanPopupOpen = () => {
        setCancelSubscriptionPlanPopupOpen(true);
    };

    const handleCancelSubscriptionPlanPopupClose = () => {
        setCancelSubscriptionPlanPopupOpen(false);
    };

    const handleExcitingOfferPopupOpen = () => {
        setExcitingOfferPopupOpen(true);
    };

    const handleExcitingOfferPopupClose = () => {
        setExcitingOfferPopupOpen(false);
    };

    const handleConfirmCancellationPopupOpen = () => {
        setConfirmCancellationPopupOpen(true);
    };

    const handleConfirmCancellationPopupClose = () => {
        setConfirmCancellationPopupOpen(false);
    };

    interface StripePlan {
        id: string;
        interval: string;
        title: string;
        is_active: boolean;
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                fetchPrefillData();
                const response = await axiosInterceptorInstance.get(`/subscriptions/stripe-plans`);
                setAllPlans(response.data.stripe_plans)
                const stripePlans: StripePlan[] = response.data.stripe_plans;
                const activePlan = stripePlans.find(plan => plan.is_active && plan.title !== 'Free Trial');
                setHasActivePlan(!!activePlan);
                let interval = 'month'
                if (activePlan) {
                    interval = activePlan.interval
                }
                if (interval === 'year') {
                    setTabValue(1)
                }
                const period_plans = response.data.stripe_plans.filter((plan: any) => plan.interval === interval);
                setPlans(period_plans);
            } catch (error) {
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleBuyCredits = () => {
        // Логика для покупки кредитов
    };

    const fetchPrefillData = async () => {
        try {
            const response = await axiosInstance.get('/calendly');
            const user = response.data.user;

            if (user) {
                const { full_name, email, utm_params } = user;
                setUtmParams(utm_params)
            }
        } catch (error) {
            setUtmParams(null);
        }
    };

    const calendlyPopupUrl = () => {
        const baseUrl = "https://calendly.com/maximiz-support/30min";
        const searchParams = new URLSearchParams();

        if (utmParams) {
            try {
                const parsedUtmParams = typeof utmParams === 'string' ? JSON.parse(utmParams) : utmParams;

                if (typeof parsedUtmParams === 'object' && parsedUtmParams !== null) {
                    Object.entries(parsedUtmParams).forEach(([key, value]) => {
                        if (value !== null && value !== undefined) {
                            searchParams.append(key, value as string);
                        }
                    });
                }
            } catch (error) {
                console.error("Error parsing utmParams:", error);
            }
        }

        const finalUrl = `${baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return finalUrl;
    };


    const handleChoosePlan = async (stripePriceId: string) => {
        let path = hasActivePlan
            ? '/subscriptions/upgrade-and-downgrade-user-subscription'
            : '/subscriptions/session/new';
        try {
            setIsLoading(true)
            const response = await axiosInterceptorInstance.get(`${path}?price_id=${stripePriceId}`);
            if (response.status === 200) {
                if (response.data.link !== null && response.data.link !== undefined) {
                    if (response.data?.source_platform == 'big_commerce'){
                        window.open(response.data.link, '_blank');
                    }else{
                        window.location.href = response.data.link;
                    }
                }
                if (response.data.status_subscription) {
                    if (response.data.status_subscription === 'active') {
                        showToast('Subscription was successful!');
                        window.location.href = "/settings?section=subscription"
                    } else {
                        showToast('Subscription purchase error!');
                    }
                }
                else if (response.data.status === 'SUCCESS') {
                    showToast('Subscription was successful!');
                    try {
                        setIsLoading(true);
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        const response = await axiosInterceptorInstance.get(`/subscriptions/stripe-plans`);
                        setAllPlans(response.data.stripe_plans)
                        const stripePlans: StripePlan[] = response.data.stripe_plans;
                        const activePlan = stripePlans.find(plan => plan.is_active);
                        setHasActivePlan(!!activePlan);
                        let interval = 'month'
                        if (activePlan) {
                            interval = activePlan.interval
                        }
                        if (interval === 'year') {
                            setTabValue(1)
                        }
                        const period_plans = response.data.stripe_plans.filter((plan: any) => plan.interval === interval);
                        setPlans(period_plans);
                    } catch (error) {
                    } finally {
                        setIsLoading(false);
                    }
                }
                else if (response.data.status === 'INCOMPLETE') {
                    const errorMessage = response?.data?.message || 'Subscription not found!';
                    showErrorToast(errorMessage);
                }
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response && error.response.status === 403) {
                    showErrorToast('Access denied: You do not have permission to remove this member.');
                }
            }
        } finally {
            setIsLoading(false)
        }
    };

    const handleChangeCredits = (event: Event, newValue: number | number[]) => {
        setCredits(newValue as number);
    };



    // Filter plans based on the selected tab
    const filteredPlans = plans.filter(plan =>
        (tabValue === 0 && plan.interval === 'month') ||
        (tabValue === 1 && plan.interval === 'year')
    );

    const activePlan = filteredPlans.find((plan) => plan.is_active);

    if (isLoading) {
        return <CustomizedProgressBar />;
    }

    const validateField = (name: string, value: string) => {
        const newErrors: { [key: string]: string } = { ...errors };

        switch (name) {
            case 'unsubscribe':
                if (!value) {
                    newErrors.unsubscribe = 'Please enter the reason';
                } else {
                    delete newErrors.unsubscribe;
                }
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
        validateField(name, value);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const newErrors: { [key: string]: string } = {};

        if (!formValues.unsubscribe) {
            newErrors.unsubscribe = 'Please enter the reason';
            setErrors(newErrors);
            return;
        }
        if (formValues.unsubscribe) {
            try {
                setIsLoading(true)
                const response = await axiosInterceptorInstance.post('/subscriptions/cancel-plan', {
                    reason_unsubscribe: formValues.unsubscribe
                });
                if (response.status === 200) {
                    switch (response.data) {
                        case 'SUCCESS':
                            showToast('Unsubscribe Teams Plan processed!');
                            break
                        case 'SUBSCRIPTION_NOT_FOUND':
                            showErrorToast('Subscription not found!');
                            break
                        case 'SUBSCRIPTION_ALREADY_CANCELED':
                            showErrorToast('Subscription already canceled!');
                            break
                        case 'INCOMPLETE':
                            showErrorToast('Subscription cancellation error!');
                            break
                        default:
                            showErrorToast('Unknown response received.');
                    }
                }
            } catch (error) {
                showErrorToast('An error occurred while sending URLs.');
            }
            finally {
                setIsLoading(false);
                handleConfirmCancellationPopupClose()
                handleExcitingOfferPopupClose()
                handleCancelSubscriptionPlanPopupClose()
            }
        }
    };

    return (
        <Box sx={{ marginBottom: '36px' }}>

            {/* Plans Section */}
            <Box sx={{ marginBottom: 4 }}>
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 4, marginBottom: 2, position: 'relative',
                    '@media (max-width: 600px)': {
                        justifyContent: 'start'
                    }
                }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        {/* Tabs for Monthly and Yearly */}
                        <Tabs value={tabValue} onChange={handleTabChange} sx={{
                            border: '1px solid #808080',
                            borderRadius: '4px',
                            '& .MuiTabs-indicator': {
                                background: 'none'
                            },
                            '@media (max-width: 600px)': { width: '100%' }
                        }}>
                            <Tab className='first-sub-title' sx={subscriptionStyles.plantabHeading}
                                label="Monthly" />
                            <Tab className='first-sub-title'
                                sx={subscriptionStyles.plantabHeading}
                                label={
                                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center' }}>
                                        <Typography className='first-sub-title active-text-color' sx={{
                                            fontWeight: '400 !important',
                                            '@media (max-width: 600px)': {
                                                fontSize: '18px !important'
                                            }
                                        }}>Yearly</Typography>
                                        <Typography variant="body2" sx={subscriptionStyles.saveHeading} className='paragraph active-save-color' color="primary">
                                            Save 20%
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Tabs>
                    </Box>

                    {/* Custom Plan Button at the end */}
                    <Button variant="outlined" className='hyperlink-red' sx={{
                        position: 'absolute',
                        right: 0,
                        color: '#5052B2 !important',
                        borderRadius: '4px',
                        border: '1px solid #5052B2',
                        boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                        textTransform: 'none',
                        padding: '9px 16px',
                        '&:hover': {
                            background: 'transparent'
                        },
                        '@media (max-width: 600px)': {
                            display: 'none'
                        }
                    }} onClick={handleCustomPlanPopupOpen}>
                        Custom Plan
                    </Button>
                </Box>

                {/* Display Plans */}
                <Box sx={subscriptionStyles.formContainer}>
                    {filteredPlans.length > 0 ? (
                        filteredPlans.map((plan, index) => (
                            <Box key={index} sx={subscriptionStyles.formWrapper}>
                                <PlanCard plan={plan} activePlanTitle={activePlan?.title || ''} tabValue={tabValue} onChoose={handleChoosePlan} />
                            </Box>
                        ))
                    ) : (
                        <Typography>No plans available</Typography>
                    )}
                </Box>
            </Box>

            <Button variant="outlined" className='hyperlink-red' sx={{
                color: '#5052B2 !important',
                borderRadius: '4px',
                border: '1px solid #5052B2',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                textTransform: 'none',
                padding: '9px 16px',
                marginBottom: '16px',
                width: '100%',
                '&:hover': {
                    background: 'transparent'
                },
                '@media (min-width: 601px)': {
                    display: 'none'
                }
            }} onClick={handleCustomPlanPopupOpen}>
                Custom Plan
            </Button>

            <Divider sx={{
                borderColor: '#e4e4e4',
                '@media (max-width: 600px)': {
                    marginLeft: '-16px',
                    marginRight: '-16px'
                }
            }} />

            {/* Prospect Credits Section */}
            <Box sx={{
                marginTop: 2, marginBottom: '24px', borderRadius: '10px',
                boxShadow: '0px 2px 10px 0px rgba(0, 0, 0, 0.10)',
                border: '1px solid #e4e4e4',
                padding: 3,
            }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" className='first-sub-title' sx={{
                        marginBottom: '8px',
                        opacity: 0.6
                    }}>
                        Prospect Credits
                    </Typography>
                    <Chip
                        label='Coming soon'
                        className='second-sub-title'
                        sx={{ backgroundColor: 'rgba(255, 233, 100, 1)', borderRadius: '4px', justifyContent: 'center', color: '#795E00 !important', }}>
                    </Chip>
                </Box>
                <Typography variant="body1" className='paragraph' sx={{
                    marginBottom: 3,
                    opacity: 0.6
                }}>
                    Choose the number of contacts credits for your team
                </Typography>

                <Box sx={{ marginBottom: 3, opacity: 0.6 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, opacity: 0.6 }}>
                        <Typography variant="body1" className='third-sub-title' sx={{
                            fontSize: '20px !important',
                            color: '#4a4a4a !important'
                        }}>
                            <Typography component="span" className='heading-text' sx={{
                                fontWeight: '700 !important',
                                paddingRight: '8px'
                            }}>50K</Typography>
                            Credits/month</Typography>
                        <Typography variant="body1" className='third-sub-title' sx={{
                            fontSize: '18px !important',
                            color: '#4a4a4a !important'
                        }}>
                            <Typography component="span" className='third-sub-title' sx={{
                                fontWeight: '700 !important',
                                fontSize: '18px !important'
                            }}>$211/</Typography>
                            month</Typography>
                    </Box>

                    <Box sx={{ position: 'relative', width: '100%', marginBottom: '20px', }}>
                        {/* Custom labels above the slider */}
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                position: 'absolute',
                                width: '100%',
                                bottom: '-16px',
                                left: 0,
                                right: 0,

                            }}
                        >
                            {marks.map((mark) => (
                                <Typography
                                    key={mark.value}
                                    sx={{
                                        textAlign: mark.value === 0 ? 'left' : mark.value === 50000000 ? 'right' : 'center',
                                        width: 'fit-content', // Allow flexible label width
                                        fontSize: '12px',
                                    }}
                                >
                                    {mark.label}
                                </Typography>
                            ))}
                        </Box>

                        {/* Slider */}
                        <Slider
                            value={credits}
                            onChange={handleChangeCredits}
                            min={0}
                            disabled={true}
                            max={50000000}
                            step={1000}
                            valueLabelDisplay="off" // Remove the default label
                            aria-labelledby="credits-slider"
                            sx={{
                                '& .MuiSlider-rail': {
                                    color: '#dbdbdb',
                                    height: 6,
                                },
                                '& .MuiSlider-track': {
                                    color: '#6EC125',
                                    height: 6,
                                },
                                '& .MuiSlider-thumb': {
                                    color: '#bebebe',
                                    width: '16px',
                                    height: '16px'
                                },
                            }}
                        />
                    </Box>


                </Box>
                <Box sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: '26px',
                    paddingTop: '24px',
                    '@media (max-width: 600px)': {
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                    }
                }}>
                    <Box sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: '#fafaf6',
                        border: '1px solid #bdbdbd',
                        borderRadius: '4px',
                        padding: '18px 24px',
                        width: '100%',
                        opacity: 0.6
                    }}>
                        <Box>
                            <Typography variant="h6" className='third-sub-title' sx={{
                                fontWeight: '600 !important',
                                lineHeight: '16px !important',
                                color: '#4a4a4a !important',
                                opacity: 0.6
                            }}>
                                Summary
                            </Typography>
                            <Typography variant="body1" className='first-sub-title' sx={{
                                fontWeight: '700 !important',
                                opacity: 0.6
                            }}>
                                {selectedPlan?.name || 'None'} plan+
                                {' '}{credits} prospect contacts credits.

                            </Typography>

                        </Box>
                        <Box>
                            <Typography variant="h6" className='heading-text' sx={{
                                fontSize: '40px !important',
                                fontWeight: '700 !important',
                                opacity: 0.6
                            }}>
                                ${selectedPlan?.price || '0'}
                                <Typography component='span' className='paragraph' sx={{
                                    paddingLeft: '6px'
                                }}>/month</Typography>
                            </Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Button variant="contained" className='hyperlink-red' color="primary" disabled={true} onClick={handleBuyCredits}
                            sx={{
                                background: '#5052b2 !important',
                                borderRadius: '4px',
                                border: '1px solid #5052B2',
                                padding: '9px 24px',
                                color: '#fff !important',
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                                opacity: 0.6

                            }}
                        >
                            Buy Credits
                        </Button>
                    </Box>

                </Box>
            </Box>

            <Divider sx={{
                borderColor: '#e4e4e4',
                '@media (max-width: 600px)': {
                    marginLeft: '-16px',
                    marginRight: '-16px'
                }
            }} />

            <Box sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '16px',
                '@media (max-width: 600px)': {
                    justifyContent: 'center'
                }
            }}>
                <Button variant="contained" className='hyperlink-red' color="primary"
                    onClick={handleCancelSubscriptionPlanPopupOpen}
                    sx={{
                        background: 'none !important',
                        borderRadius: '4px',
                        border: 'none',
                        padding: '9px 24px',
                        color: '#5052b2 !important',
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                        boxShadow: 'none !important',
                    }}
                >
                    Cancel Subscription
                </Button>
            </Box>

            <Drawer
                anchor="right"
                open={customPlanPopupOpen}
                onClose={handleCustomPlanPopupClose}
                PaperProps={{
                    sx: {
                        width: '640px',
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

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 3.5, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 3 }}>
                        <Typography variant="h6" className='first-sub-title' sx={{ textAlign: 'center' }}>
                            Custom plan
                        </Typography>
                        <CustomTooltip title={"You can download the billing history and share it with your teammates."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/settings/get-custom-subscription-plan" />
                    </Box>

                    <IconButton onClick={handleCustomPlanPopupClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 5, height: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 4 }}>
                        <Image src='/custom-plan.svg' alt='custom-plan' width={509} height={329} style={{ width: '100%' }} />
                        <Typography className='first-sub-title' sx={{
                            marginTop: '32px',
                            marginBottom: '8px',
                            letterSpacing: '0.08px'
                        }}>
                            Tailor your experience with our Custom Plan, designed just for you. Choose exactly what you need and only pay for what you use!
                        </Typography>
                        <Typography className='paragraph' sx={{
                            letterSpacing: '0.07px',
                            fontSize: '14px !important',
                            color: '#5f6368 !important'
                        }}>
                            Kindly book a call with one of our marketing specialist to custom your plan.
                        </Typography>
                    </Box>

                    <Box sx={{ position: 'relative' }}>
                        <Box sx={{
                            px: 4, py: 3, position: 'fixed', bottom: 0, right: 0, background: '#fff',
                            width: '620px',
                            '@media (max-width: 600px)': {
                                width: '100%',
                            }
                        }}>
                            <Box display="flex" justifyContent="flex-end" mt={2}>
                                <Link
                                    href={calendlyPopupUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleCustomPlanPopupClose}
                                    sx={{
                                        display: 'inline-block',
                                        width: '100%',
                                        textDecoration: 'none',
                                        color: '#fff',
                                        padding: '1em 8em',
                                        fontFamily: 'Nunito Sans',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        borderRadius: '4px',
                                        border: 'none',
                                        lineHeight: '22.4px',
                                        backgroundColor: '#5052B2',
                                        textTransform: 'none',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Book a call
                                </Link>
                            </Box>
                        </Box>
                    </Box>
                </Box>

            </Drawer>

            <Drawer
                anchor="right"
                open={cancelSubscriptionPlanPopupOpen}
                onClose={handleCancelSubscriptionPlanPopupClose}
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

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 3.5, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                    <Typography variant="h6" className='first-sub-title' sx={{ textAlign: 'center' }}>
                        Unsubscribe Teams Plan
                    </Typography>
                    <IconButton onClick={handleCancelSubscriptionPlanPopupClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 5, height: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                        <Typography className='first-sub-title' sx={{
                            paddingTop: '24px',
                            paddingLeft: '32px'
                        }}>
                            Are you sure you want to unsubscribe teams plan?
                        </Typography>
                    </Box>

                    <Box sx={{ position: 'relative' }}>
                        <Box sx={{
                            px: 2, py: 3.5, border: '1px solid #e4e4e4', position: 'fixed', bottom: 0, right: 0, background: '#fff',
                            width: '620px',
                            '@media (max-width: 600px)': {
                                width: '100%',
                            }
                        }}>
                            <Box display="flex" justifyContent="flex-end" mt={2}>
                                <Button className="hyperlink-red" sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#5052b2 !important',
                                    marginRight: '16px',
                                    textTransform: 'none',
                                    padding: '10px 24px'
                                }}
                                    onClick={handleExcitingOfferPopupOpen}
                                >
                                    Yes
                                </Button>
                                <Button className="hyperlink-red" onClick={handleCancelSubscriptionPlanPopupClose} sx={{
                                    background: '#5052B2',
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#fff !important',
                                    textTransform: 'none',
                                    padding: '10px 24px',
                                    '&:hover': {
                                        color: '#5052B2 !important'
                                    }
                                }}>
                                    No
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>

            </Drawer>

            <Drawer
                anchor="right"
                open={excitingOfferPopupOpen}
                onClose={handleExcitingOfferPopupClose}
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

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 3.5, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                    <Typography variant="h6" className='first-sub-title' sx={{ textAlign: 'center' }}>
                        Exciting offer only for you!
                    </Typography>
                    <IconButton onClick={handleExcitingOfferPopupClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 5, height: '100%' }}>
                    <Box sx={{
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center',
                        padding: '24px 32px'
                    }}>
                        <Image src='/exciting-offer.svg' alt='exciting-offer-icon' width={316} height={338} />
                        <Typography className='first-sub-title' sx={{
                            marginTop: '40px',
                            textAlign: 'center'
                        }}>
                            We have an exciting offer to you, we give 30% discount on next 3 months subscriptions only for you.
                        </Typography>

                    </Box>

                    <Box sx={{ position: 'relative' }}>
                        <Box sx={{
                            px: 2, py: 3.5, border: '1px solid #e4e4e4', position: 'fixed', bottom: 0, right: 0, background: '#fff',
                            width: '620px',
                            '@media (max-width: 600px)': {
                                width: '100%',
                            }
                        }}>
                            <Box display="flex" justifyContent="flex-end" mt={2}>
                                <Button className="hyperlink-red" sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#5052b2 !important',
                                    marginRight: '16px',
                                    textTransform: 'none',
                                    padding: '10px 24px'
                                }}
                                    onClick={handleConfirmCancellationPopupOpen}
                                >
                                    Confirm cancellation
                                </Button>
                                <Button className="hyperlink-red" sx={{
                                    background: '#5052B2',
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#fff !important',
                                    textTransform: 'none',
                                    padding: '10px 24px',
                                    '&:hover': {
                                        color: '#5052B2 !important'
                                    }
                                }}>
                                    Claim offer
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>

            </Drawer>

            <Drawer
                anchor="right"
                open={confirmCancellationPopupOpen}
                onClose={handleConfirmCancellationPopupClose}
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

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 3.5, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                    <Typography variant="h6" className='first-sub-title' sx={{ textAlign: 'center' }}>
                        Unsubscribe Teams Plan
                    </Typography>
                    <IconButton onClick={handleConfirmCancellationPopupClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 5, height: '100%' }}>
                    <Box sx={{
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        padding: '24px 32px'
                    }}>

                        <Typography className='first-sub-title' sx={{
                            marginBottom: '32px'
                        }}>
                            Are you sure you want to unsubscribe teams plan?
                        </Typography>
                        <TextField
                            InputLabelProps={{
                                sx: subscriptionStyles.inputLabel,
                                focused: false
                            }}
                            label="Enter the reason for unsubscribe"
                            name="unsubscribe"
                            variant="outlined"
                            fullWidth
                            value={formValues.unsubscribe}
                            onChange={handleChange}
                            error={Boolean(errors.unsubscribe)}
                            helperText={errors.unsubscribe}
                            InputProps={{
                                className: "form-input"
                            }}
                        />
                    </Box>

                    <Box sx={{ position: 'relative' }}>
                        <Box sx={{
                            px: 2, py: 3.5, border: '1px solid #e4e4e4', position: 'fixed', bottom: 0, right: 0, background: '#fff',
                            width: '620px',
                            '@media (max-width: 600px)': {
                                width: '100%',
                            }
                        }}>
                            <Box display="flex" justifyContent="flex-end" mt={2}>
                                <Button className="hyperlink-red" onClick={handleSubmit} sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#5052b2 !important',
                                    marginRight: '16px',
                                    textTransform: 'none',
                                    padding: '10px 24px'
                                }}

                                >
                                    Yes
                                </Button>
                                <Button className="hyperlink-red" onClick={handleConfirmCancellationPopupClose} sx={{
                                    background: '#5052B2',
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#fff !important',
                                    textTransform: 'none',
                                    padding: '10px 24px',
                                    '&:hover': {
                                        color: '#5052B2 !important'
                                    }
                                }}>
                                    No
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>

            </Drawer>

        </Box>
    );
};
