import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, TextField, Button, FormControl, InputLabel, MenuItem, Select, IconButton, InputAdornment, Accordion, AccordionSummary, AccordionDetails, SelectChangeEvent, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import CustomizedProgressBar from "./CustomizedProgressBar";
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import Image from "next/image";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { showToast } from "./ToastNotification";
import CustomTooltip from "./customToolTip";

interface FAQItem {
    question: string;
    answer: string;
}

interface ReferralDiscountCode {
    id: number
    name: string
    discount_amount: number
}

interface PartnersOverviewProps {
    isMaster: boolean
}


const PartnersOverview: React.FC<PartnersOverviewProps> = ({ isMaster }) => {
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState<number | false>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [accountCreatePending, setAccountCreatePending] = useState(false);
    const [error, setError] = useState(false);
    const [currentDue, setCurrentDue] = useState<string[]>([]);
    const [stripeEmail, setStripeEmail] = useState('');
    const [stripeConnect, setStripeConnect] = useState(false);
    const [connectedAccountId, setConnectedAccountId] = useState();
    const [referralLink, setReferralLink] = useState('');
    const [discountCodeOptions, setDiscountCodeOptions] = useState<ReferralDiscountCode[]>([]);
    const [discountCode, setDiscountCode] = useState<ReferralDiscountCode>();

    const handleDiscountCodeChange = async (event: SelectChangeEvent<string>) => {
        const selectedCode = discountCodeOptions.find(option => option.name === event.target.value);
        if (selectedCode) {
            setDiscountCode(selectedCode);
            try {
                const response = await axiosInstance.get(`referral/details?discount_code_id=${selectedCode.id}`);
                const fullReferralLink = `https://dev.maximiz.ai/signup?referral=${response.data.referral_code}`;
                setReferralLink(fullReferralLink);
            } catch (err) {
                console.error("Error fetching referral details:", err);
            }
        }
    };

    const faqItems: FAQItem[] = !isMaster
        ? [
            { question: 'How the referral works?', answer: 'Once a user integrates their Stripe account, they can select a predefined discount code for referrals. A referral code is then generated, which the partner can share with their contacts. When a contact signs up and buy any subscription plan using this referral code, the partner receives a percentage of commission as agreed.' },
            { question: 'When will the reward credits be available in my Stripe account?', answer: 'Referral rewards are distributed in the first week of the following month.' },
            { question: 'Who is the Master Partner?', answer: 'A master partner can invite other partners, set their commission rates, and earn when those partners make new referrals. Additionally, the master partner can also refer users directly and earn commissions.' },
        ] :
        [
            { question: 'How the referral works?', answer: 'Once a user integrates their Stripe account, they can select a predefined discount code for referrals. A referral code is then generated, which the partner can share with their contacts. When a contact signs up and buy any subscription plan using this referral code, the partner receives a percentage of commission as agreed.' },
            { question: 'When will the reward credits be available in my Stripe account?', answer: 'Referral rewards are distributed in the first week of the following month.' },
        ]


    const handleOpenSection = (panel: number) => (
        event: React.SyntheticEvent,
        isExpanded: boolean
    ) => {
        setExpanded(isExpanded ? panel : false);
    };

    const fetchRules = async () => {
        setIsLoading(true)
        try {
            const responseOverview = await axiosInstance.get('referral/overview')
            setConnectedAccountId(responseOverview.data.connected_stripe_account_id)
            setStripeConnect(responseOverview.data.is_stripe_connected)
            setCurrentDue(responseOverview.data.stripe_connected_currently_due)
            setStripeEmail(responseOverview.data.stripe_connected_email)
            const responseDetails = await axiosInstance.get(`referral/details`)
            setDiscountCodeOptions(responseDetails.data.discount_codes)
            const fullReferralLink = `https://dev.maximiz.ai/signup?referral=${responseDetails.data.referral_code}`;
            setReferralLink(fullReferralLink);
        } catch (err) {
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    useEffect(() => {
        if (discountCodeOptions?.length > 0 && !discountCode) {
            setDiscountCode(discountCodeOptions[0]);
        }
    }, [discountCodeOptions, discountCode]);

    const handleCopyClick = () => {
        navigator.clipboard.writeText(referralLink).then(() => {
            showToast('Referral link copied')
        }).catch(err => {
        });
    };

    if (isLoading) {
        return (<CustomizedProgressBar />)
    }


    return (
        <>
            {loading &&
                <CustomizedProgressBar />
            }
            <Box sx={{
                backgroundColor: '#fff',
                width: '100%',
                padding: 0,
                margin: '3rem auto 0rem',
                '@media (max-width: 600px)': { margin: '0rem auto 0rem' }
            }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', gap: 1, '@media (max-width: 600px)': { flexDirection: 'column' } }}>

                        {connectedAccountId ? (
                            stripeConnect ? (
                                <>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', border: '1px solid rgba(235, 235, 235, 1)', justifyContent: 'start', alignItems: 'start', borderRadius: '4px', pt: 2, pb: 2, gap: 2.5, }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', width: '100%', gap: 1, padding: 1 }}>
                                            <Image src={'/stripe-image.svg'} width={60} height={60} alt="stripe-icon" />
                                            <Typography className="second-sub-title">
                                                Stripe account details
                                            </Typography>
                                        </Box>

                                        {stripeEmail && <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', width: '100%', gap: 1, pl: 2 }}>
                                            <Typography className="table-heading">
                                                Email
                                            </Typography>
                                            <Typography className="table-data">
                                                {stripeEmail}
                                            </Typography>
                                        </Box>}

                                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', width: '100%', gap: 1, pl: 2 }}>
                                            <Typography className="table-heading">
                                                Account ID
                                            </Typography>
                                            <Typography className="table-data">
                                                {connectedAccountId}
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            sx={{

                                                mt: 2,
                                                ml: 2,
                                                textWrap: 'nowrap',
                                                backgroundColor: '#fff',
                                                color: 'rgba(80, 82, 178, 1)',
                                                fontFamily: "Nunito Sans",
                                                textTransform: 'none',
                                                lineHeight: '22.4px',
                                                fontWeight: '600',
                                                padding: '0.75em 2em',
                                                border: '1px solid rgba(80, 82, 178, 1)',
                                                '&:hover': {
                                                    backgroundColor: '#fff',
                                                    boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)',
                                                    '&.Mui-disabled': {
                                                        backgroundColor: 'rgba(80, 82, 178, 0.6)',
                                                        color: 'rgba(80, 82, 178, 1)',
                                                        cursor: 'not-allowed',
                                                    }
                                                }
                                            }}
                                            onClick={async () => {
                                                setError(false);
                                                setLoading(true);
                                                try {
                                                    const linkResponse = await fetch("/api/account_link", {
                                                        method: "POST",
                                                        headers: {
                                                            "Content-Type": "application/json",
                                                        },
                                                        body: JSON.stringify({ account: connectedAccountId })
                                                    });
                                                    const linkData = await linkResponse.json();

                                                    const { url, error: linkError } = linkData;

                                                    if (url) {
                                                        window.open(url, '_blank');
                                                    }

                                                    if (linkError) {
                                                        setError(true);
                                                    }
                                                } catch (err) {
                                                    setError(true);
                                                    console.error("Error occurred:", err);
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }} >
                                            View Dashboard
                                        </Button>
                                    </Box>
                                </>
                            ) :
                                (<>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', border: '1px solid rgba(235, 235, 235, 1)', justifyContent: 'start', alignItems: 'start', borderRadius: '4px', pt: 2, pb: 2, gap: 2.5, }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'start', width: '100%' }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', width: '100%', gap: 1, paddingLeft: 2 }}>
                                                <Image src={'/stripe-image.svg'} width={60} height={60} alt="stripe-icon" />
                                                <Typography className="second-sub-title">
                                                    Stripe account details
                                                </Typography>
                                            </Box>
                                            {currentDue && (<Box sx={{ display: 'flex', alignItems: 'start', pr: 2 }}>
                                                <Tooltip
                                                    title={
                                                        <Box>
                                                            <Typography className="second-sub-title" sx={{ color: '#fff !important', marginBottom: 0.5 }}>
                                                                Please provide all necessary details:
                                                            </Typography>
                                                            <ul style={{ margin: 0, paddingLeft: '1.2em', }}>
                                                                {currentDue.map((item, index) => {
                                                                    const formattedString = item
                                                                        .split('.')
                                                                        .map((word, idx) => {
                                                                            if (idx === 0) {
                                                                                return word.charAt(0).toUpperCase() + word.slice(1);
                                                                            }
                                                                            return word;
                                                                        })
                                                                        .join(' ');

                                                                    return (
                                                                        <li key={index} style={{
                                                                            color: '#fff', fontFamily: 'Nunito Sans', fontSize: '14px',
                                                                            lineHeight: 'normal', fontWeight: 600,
                                                                        }}>
                                                                            {formattedString}
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        </Box>
                                                    }
                                                    arrow
                                                >
                                                    <Typography
                                                        className="paragraph"
                                                        sx={{ textDecoration: 'underline', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                    >
                                                        What data is required?
                                                    </Typography>
                                                </Tooltip>
                                            </Box>
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', width: '100%', gap: 1, pl: 2, mb: accountCreatePending ? 2 : 0 }}>
                                            <Typography className="table-heading">
                                                Account ID
                                            </Typography>
                                            <Typography className="table-data">
                                                {connectedAccountId}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', width: '100%', gap: 1, pl: 2 }}>
                                            <Typography className="table-heading" sx={{ color: 'rgba(244, 87, 69, 1) !important', pl: 0, textAlign: 'left' }}>
                                                Referral details are unavailable. Update your information to proceed.
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            sx={{
                                                mt: accountCreatePending ? 2 : 0,
                                                ml: 2,
                                                textWrap: 'nowrap',
                                                backgroundColor: '#fff',
                                                color: 'rgba(80, 82, 178, 1)',
                                                fontFamily: "Nunito Sans",
                                                textTransform: 'none',
                                                lineHeight: '22.4px',
                                                fontWeight: '600',
                                                padding: '0.75em 2em',
                                                border: '1px solid rgba(80, 82, 178, 1)',
                                                '&:hover': {
                                                    backgroundColor: '#fff',
                                                    boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)',
                                                    '&.Mui-disabled': {
                                                        backgroundColor: 'rgba(80, 82, 178, 0.6)',
                                                        color: 'rgba(80, 82, 178, 1)',
                                                        cursor: 'not-allowed',
                                                    }
                                                }
                                            }}
                                            onClick={async () => {
                                                setError(false);
                                                setLoading(true);
                                                try {
                                                    const linkResponse = await fetch("/api/onboarding", {
                                                        method: "POST",
                                                        headers: {
                                                            "Content-Type": "application/json",
                                                        },
                                                        body: JSON.stringify({ account: connectedAccountId, type: 'partners' })
                                                    });
                                                    const linkData = await linkResponse.json();

                                                    const { url, error: linkError } = linkData;

                                                    if (url) {
                                                        window.open(url, '_blank');
                                                    }

                                                    if (linkError) {
                                                        setError(true);
                                                    }
                                                } catch (err) {
                                                    setError(true);
                                                    console.error("Error occurred:", err);
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }} >
                                            Add Information
                                        </Button>
                                    </Box>
                                </>)
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', border: '1px solid rgba(235, 235, 235, 1)', justifyContent: 'center', alignItems: 'center', borderRadius: '4px', pt: 2, pb: 2, gap: 2.5, }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', gap: 1 }}>
                                    <Image src={'/stripe-image.svg'} width={97} height={97} alt="stripe-icon" />
                                    <Typography className="second-sub-title">
                                        Start by connecting your stripe account
                                    </Typography>
                                </Box>

                                <Button
                                    variant="outlined"
                                    sx={{
                                        display: 'flex',
                                        textWrap: 'nowrap',
                                        backgroundColor: '#fff',
                                        color: 'rgba(80, 82, 178, 1)',
                                        fontFamily: "Nunito Sans",
                                        textTransform: 'none',
                                        lineHeight: '22.4px',
                                        fontWeight: '600',
                                        padding: '0.75em 2em',
                                        border: '1px solid rgba(80, 82, 178, 1)',
                                        '&:hover': {
                                            backgroundColor: '#fff',
                                            boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)',
                                            '&.Mui-disabled': {
                                                backgroundColor: 'rgba(80, 82, 178, 0.6)',
                                                color: 'rgba(80, 82, 178, 1)',
                                                cursor: 'not-allowed',
                                            }
                                        }
                                    }}
                                    onClick={async () => {
                                        setError(false);
                                        setLoading(true);
                                        try {
                                            setAccountCreatePending(true);
                                            const accountResponse = await fetch("/api/account", {
                                                method: "POST",
                                            });
                                            const accountData = await accountResponse.json();
                                            setConnectedAccountId(accountData.account);
                                            setCurrentDue(accountData.currently_due)

                                            const linkResponse = await fetch("/api/onboarding", {
                                                method: "POST",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                },
                                                body: JSON.stringify({ account: accountData.account, type: 'partners' })
                                            });
                                            const linkData = await linkResponse.json();

                                            const { url } = linkData;

                                            if (url) {
                                                window.open(url, '_blank');
                                            }

                                            await axiosInstance.post('/connect-stripe', {
                                                stripe_connect_account_id: accountData.account,
                                            });

                                            const { error } = accountData;

                                            if (error) {
                                                setError(true);
                                            }
                                        } catch (err) {
                                            setAccountCreatePending(false);
                                            setError(true);
                                            console.error("Error occurred:", err);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                >
                                    Connect to stripe
                                </Button>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', border: '1px solid rgba(235, 235, 235, 1)', justifyContent: 'start', borderRadius: '4px', padding: '1rem 1.5rem', gap: 4, opacity: stripeConnect ? 1 : 0.6 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'start', alignItems: 'center', width: '100%' }}>
                                <Typography className="second-sub-title">
                                    Referral Details
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'center', width: '100%', gap: 3, }}>
                                <FormControl
                                    sx={{
                                        width: '100%',

                                    }}
                                >
                                    <InputLabel
                                        sx={{
                                            color: 'rgba(17, 17, 19, 0.6)',
                                            fontFamily: 'Nunito Sans',
                                            fontWeight: 400,
                                            fontSize: '14px',
                                            padding: 0,
                                            "&.Mui-focused": {
                                                color: 'rgba(17, 17, 19, 0.6)',
                                            }
                                        }}
                                    >
                                        Without Discount Code
                                    </InputLabel>
                                    <Select
                                        value={stripeConnect ? discountCode?.name : ''}
                                        onChange={handleDiscountCodeChange}
                                        disabled={!stripeConnect}
                                        label="Discount Code"
                                        sx={{
                                            backgroundColor: '#fff',
                                            borderRadius: '4px',
                                            fontFamily: 'Roboto',
                                            fontSize: '14px',
                                            fontWeight: '400',
                                            lineHeight: '19.6px',
                                            color: 'rgba(32, 33, 36, 1)',
                                            zIndex: 0,
                                            "& .MuiOutlinedInput-root": {
                                                "& fieldset": {
                                                    borderColor: 'rgba(208, 213, 221, 1)',
                                                },
                                            },
                                            "&.Mui-disabled": {
                                                pointerEvents: 'none',
                                                opacity: 0.6,
                                                "&:hover": {
                                                    backgroundColor: '#fff',
                                                },
                                            },
                                        }}
                                        MenuProps={{
                                            PaperProps: { style: { maxHeight: 200, zIndex: 100 } }
                                        }}
                                        IconComponent={(props) => (
                                            discountCode?.name === '' ? (
                                                <KeyboardArrowUpIcon {...props} sx={{ color: 'rgba(74, 74, 74, 1)' }} />
                                            ) : (
                                                <KeyboardArrowDownIcon {...props} sx={{ color: 'rgba(74, 74, 74, 1)' }} />
                                            )
                                        )}
                                    >
                                        {discountCodeOptions?.map((option, index) => (
                                            <MenuItem
                                                key={index}
                                                value={option.name}
                                                sx={{
                                                    fontFamily: 'Roboto',
                                                    fontWeight: 400,
                                                    fontSize: '14px',
                                                    lineHeight: '19.6px',
                                                }}
                                            >
                                                {option.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Referral Link"
                                    variant="outlined"
                                    type="text"
                                    disabled={!referralLink && !stripeConnect}
                                    value={stripeConnect ? referralLink : ''}
                                    InputProps={{
                                        style: {
                                            color: 'rgba(17, 17, 19, 1)',
                                            fontFamily: 'Nunito Sans',
                                            fontWeight: 400,
                                            fontSize: '14px',
                                        },
                                        endAdornment: (
                                            referralLink && stripeConnect && (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={handleCopyClick}
                                                        edge="end"
                                                        disabled={!referralLink || !stripeConnect}
                                                    >
                                                        <ContentCopyIcon fontSize="small" />
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        )
                                    }}
                                    InputLabelProps={{
                                        style: {
                                            color: 'rgba(17, 17, 19, 0.6)',
                                            fontFamily: 'Nunito Sans',
                                            fontWeight: 400,
                                            fontSize: '14px',
                                            padding: 0
                                        }
                                    }}
                                    sx={{
                                        marginBottom: '32px',
                                        backgroundColor: '#fff',
                                        borderRadius: '4px',
                                        width: '100%',
                                        pointerEvents: !stripeConnect ? 'none' : 'auto', // Отключение кликов
                                        "& .MuiOutlinedInput-root": {
                                            pointerEvents: !stripeConnect ? 'none' : 'auto', // Важное дополнение
                                            "& fieldset": {
                                                borderColor: 'rgba(208, 213, 221, 1)',
                                            },
                                            "&:hover fieldset": {
                                                borderColor: 'rgba(208, 213, 221, 1)',
                                            },
                                            "&.Mui-focused fieldset": {
                                                borderColor: 'rgba(208, 213, 221, 1)',
                                            },
                                        },
                                        "@media (max-width: 900px)": { width: '100%', height: '48px' },
                                    }}
                                />

                            </Box>
                        </Box>
                    </Box>

                    {/* <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', backgroundColor: 'rgba(255, 247, 247, 1)', borderRadius: '4px', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', gap: 2, alignItems: 'center', '@media (max-width: 600px)': { flexDirection: 'column', gap: 3 } }}>
                            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', gap: 2, alignItems: 'center' }}>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(248, 70, 75, 0.2)',
                                    borderRadius: '4px',
                                    width: '49px',
                                    height: '52px',
                                    padding: '3px 12px'
                                }}>
                                    <Image src={'/partner-icon.svg'} alt={'hands-icon'} width={42} height={28} />
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1 }}>
                                    <Typography className="second-sub-title">
                                        Become a official partner
                                    </Typography>
                                    <Typography className="paragraph">
                                        Unlock exclusive rewards and benefits by partnering with us—schedule a call with our sales executive today to get started!
                                    </Typography>
                                </Box>
                            </Box>

                            <Button variant="outlined" sx={{
                                textWrap: 'nowrap',
                                backgroundColor: '#fff', color: 'rgba(80, 82, 178, 1)', fontFamily: "Nunito Sans", textTransform: 'none', lineHeight: '22.4px',
                                fontWeight: '600', padding: '0.75em 3em', marginRight: '16px', border: '1px solid rgba(80, 82, 178, 1)', maxWidth: '109px', '&:hover': {
                                    backgroundColor: '#fff', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)', '&.Mui-disabled': {
                                        backgroundColor: 'rgba(80, 82, 178, 0.6)',
                                        color: 'rgba(80, 82, 178, 1)',
                                        cursor: 'not-allowed',
                                    }
                                }
                            }}>
                                Talk to us
                            </Button>
                        </Box>

                    </Box> */}

                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', gap: 1, '@media (max-width: 1200px)': { flexDirection: 'column' } }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', border: '1px solid rgba(235, 235, 235, 1)', height: '200px', justifyContent: 'center', alignItems: 'start', borderRadius: '4px', padding: '1rem 1.5rem', gap: 2, maxHeight: '200px', '@media (max-width: 900px)': { display: 'none' }, }}>
                            <Typography className="second-sub-title">
                                How it works
                            </Typography>
                            <Image src={'/how-works.svg'} width={659} height={140} alt="stripe-icon" />
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', border: '1px solid rgba(235, 235, 235, 1)', justifyContent: 'start', borderRadius: '4px', padding: '1rem 1.5rem', gap: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'start', alignItems: 'center', width: '100%' }}>
                                <Typography className="second-sub-title">
                                    Frequently asked questions
                                </Typography>
                            </Box>

                            <Box>
                                {faqItems.map((item, index) => (
                                    <Accordion
                                        key={index}
                                        expanded={expanded === index}
                                        onChange={handleOpenSection(index)}
                                        sx={{
                                            borderRadius: '8px',
                                            borderBottom: '1px solid rgba(228, 228, 228, 1)',
                                            boxShadow: 'none',
                                            pt: '6px',
                                            mb: 0,
                                            margin: 0,
                                            "&:before": { display: "none", borderBottom: 'none', margin: 0 },
                                        }}
                                    >
                                        <AccordionSummary
                                            expandIcon={
                                                expanded === index ? (
                                                    <RemoveCircleOutlineIcon sx={{ color: 'black' }} fontSize="small" />
                                                ) : (
                                                    <AddIcon sx={{ color: 'black' }} fontSize="small" />
                                                )
                                            }
                                            sx={{
                                                minHeight: '36px', // Убираем min-height
                                                padding: 0,
                                                margin: 0,
                                                '&.Mui-expanded': {
                                                    minHeight: '10px', // Убираем min-height для раскрытого состояния
                                                },
                                                '& .MuiAccordionSummary-content': {
                                                    marginTop: '6px'
                                                },
                                                '& .MuiAccordionSummary-content.Mui-expanded': {
                                                    marginTop: '6px', // Убираем отступы для раскрытого состояния
                                                },
                                            }}
                                        >
                                            <Typography className="second-sub-title">{item.question}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ margin: 0, paddingTop: 0 }}>
                                            <Typography className="table-data" sx={{ fontSize: '13px !important' }}>
                                                {item.answer}
                                            </Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </Box>
                        </Box>
                    </Box>

                </Box>

            </Box >
        </>

    );
};

export default PartnersOverview;