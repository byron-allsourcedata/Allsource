"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Tabs, Tab, TextField, Dialog, DialogActions, Tooltip, Slider, DialogContent, DialogTitle, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel, InputAdornment, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlanCard from '@/components/PlanCard';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import CustomTooltip from './customToolTip';
import { Padding } from '@mui/icons-material';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import Image from 'next/image';
import { showErrorToast, showToast } from './ToastNotification';



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
        justifyContent: 'center',
        width: '100%',
        marginTop: '92px',
        '@media (max-width: 900px)': {
            flexDirection: 'column',
            marginTop: '24px'
        },
    },
    formWrapper: {
        '@media (min-width: 901px)': {
            width: '337px'
        }
    },
    plantabHeading: {
        padding: '10px 32px',
        textTransform: 'none',
        '&.Mui-selected': {
            background: '#F8464B',
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
            fontSize: '18px !important'
        }
    },
    saveHeading: {
        background: '#EDEDF7',
        padding: '5px 12px',
        borderRadius: '4px',
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


    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
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



    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const period = tabValue === 0 ? 'monthly' : 'yearly';
                const response = await axiosInterceptorInstance.get(`/subscriptions/stripe-plans?period=${period}`);
                setPlans(response.data.stripe_plans);
                const activePlan = response.data.stripe_plans.find((plan: any) => plan.is_active) !== undefined
                setHasActivePlan(activePlan);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [tabValue]);

    const handleBuyCredits = () => {
        // Логика для покупки кредитов
        console.log('Buy Credits clicked');
    };

    const handleChoosePlan = async (stripePriceId: string) => {
        let path = hasActivePlan
            ? '/subscriptions/upgrade-and-downgrade-user-subscription'
            : '/subscriptions/session/new';
        try {
            const response = await axiosInterceptorInstance.get(`${path}?price_id=${stripePriceId}`);
            if (response.status === 200) {
                if (!hasActivePlan && response.data.link){
                    window.location.href = response.data.link;
                }
                if (response.data.status_subscription) {
                    if (response.data.status_subscription === 'active') {
                        showToast('Subscription was successful!');
                        window.location.href = "/settings?section=subscription"
                    } else {
                        showToast('Subscription purchase error!');
                    }
                }
                else if (response.data === 'SUCCESS') {
                    showToast('Subscription was successful!');
                    window.location.href = "/settings?section=subscription"
                }
            }
        } catch (error) {
            console.error('Error choosing plan:', error);
        }
    };

    const handleChangeCredits = (event: Event, newValue: number | number[]) => {
        setCredits(newValue as number);
    };



    // Filter plans based on the selected tab
    const filteredPlans = plans.filter(plan =>
        (tabValue === 0 && plan.interval === 'monthly') ||
        (tabValue === 1 && plan.interval === 'yearly')
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
                        default:
                            showErrorToast('Unknown response received.');
                    }
                }
            } catch (error) {
                showErrorToast('An error occurred while sending URLs.');
            }
            finally {
                setIsLoading(false);
                window.location.href = "/settings?section=subscription";
                handleConfirmCancellationPopupClose()
                handleExcitingOfferPopupClose()
                handleCancelSubscriptionPlanPopupClose()
            }
        }
    };

    return (
        <Box sx={{ marginBottom: '36px' }}>

            {/* Plans Section */}
            <Box sx={{ marginBottom: 2 }}>
                <Box sx={{
                    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, mb: 2
                }}>
                    <Typography variant="h4" gutterBottom className='first-sub-title' sx={subscriptionStyles.title}>
                        Plans
                    </Typography>
                    <CustomTooltip title={"Plan info"} linkText="Learn more" linkUrl="https://maximiz.ai" />
                </Box>
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginBottom: 2, position: 'relative',
                    '@media (max-width: 600px)': {
                        justifyContent: 'start'
                    }
                }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Tabs for Monthly and Yearly */}
                        <Tabs value={tabValue} onChange={handleTabChange} sx={{
                            border: '1px solid #808080',
                            borderRadius: '4px',
                            '& .MuiTabs-indicator': {
                                background: 'none'
                            }
                        }}>
                            <Tab className='heading-text' sx={subscriptionStyles.plantabHeading}
                                label="Monthly" />
                            <Tab className='heading-text'
                                sx={subscriptionStyles.plantabHeading}
                                label={
                                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center' }}>
                                        <Typography className='heading-text active-text-color' sx={{
                                            '@media (max-width: 600px)': {
                                                fontSize: '18px !important'
                                            }
                                        }}>Yearly</Typography>
                                        <Typography variant="body2" sx={subscriptionStyles.saveHeading} className='first-sub-title active-save-color' color="primary">
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
                                <PlanCard plan={plan} activePlanTitle={activePlan?.title || ''} onChoose={handleChoosePlan} />
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
                marginTop: 4, marginBottom: '24px', borderRadius: '10px',
                boxShadow: '0px 2px 10px 0px rgba(0, 0, 0, 0.10)',
                border: '1px solid #e4e4e4',
                padding: 3
            }}>
                <Typography variant="h6" className='first-sub-title' sx={{
                    marginBottom: '8px'
                }}>
                    Prospect Credits
                </Typography>
                <Typography variant="body1" className='paragraph' sx={{
                    marginBottom: 3
                }}>
                    Choose the number of contacts credits for your team
                </Typography>
                <Box sx={{ marginBottom: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
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

                    {/* <Slider
                                value={credits}
                                onChange={handleChangeCredits}
                                min={10000}
                                max={100000} // Example max value, adjust as needed
                                step={10000}
                                valueLabelDisplay="auto"
                                aria-labelledby="credits-slider"
                            /> */}

                    <Box sx={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
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
                        width: '100%'
                    }}>
                        <Box>
                            <Typography variant="h6" className='third-sub-title' sx={{
                                fontWeight: '600 !important',
                                lineHeight: '16px !important',
                                color: '#4a4a4a !important'
                            }}>
                                Summary
                            </Typography>
                            <Typography variant="body1" className='first-sub-title' sx={{
                                fontWeight: '700 !important'
                            }}>
                                {selectedPlan?.name || 'None'} plan+
                                {' '}{credits} prospect contacts credits.

                            </Typography>

                        </Box>
                        <Box>
                            <Typography variant="h6" className='heading-text' sx={{
                                fontSize: '40px !important',
                                fontWeight: '700 !important'
                            }}>
                                ${selectedPlan?.price || '0'}
                                <Typography component='span' className='paragraph' sx={{
                                    paddingLeft: '6px'
                                }}>/month</Typography>
                            </Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Button variant="contained" className='hyperlink-red' color="primary" onClick={handleBuyCredits}
                            sx={{
                                background: '#5052b2 !important',
                                borderRadius: '4px',
                                border: '1px solid #5052B2',
                                padding: '9px 24px',
                                color: '#fff !important',
                                textTransform: 'none',
                                whiteSpace: 'nowrap'

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
                        Custom plan
                    </Typography>
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

                                <Button className="hyperlink-red" sx={{
                                    background: '#5052B2',
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#fff !important',
                                    textTransform: 'none',
                                    padding: '10px 24px',
                                    width: '100%',
                                    '&:hover': {
                                        color: '#5052B2 !important'
                                    }
                                }}>
                                    Book a call
                                </Button>
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
                                className: "form-input-label"
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

