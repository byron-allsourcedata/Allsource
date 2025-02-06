import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, TextField, Button, FormControl, InputLabel, MenuItem, Select, IconButton, InputAdornment, Accordion, AccordionSummary, AccordionDetails, SelectChangeEvent, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import Image from "next/image";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { showToast } from "@/components/ToastNotification";
import React from "react";

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

const withoutDiscountCode = {
    id: 0,
    name: "Without discount code",
    discount_amount: 0,
};


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
    const [initialDiscountCode, setInitialDiscountCode] = useState('');

    const handleDiscountCodeChange = async (event: SelectChangeEvent<string>) => {
        const selectedCode = discountCodeOptions.find(option => option.name === event.target.value) || withoutDiscountCode;
    
        setDiscountCode(selectedCode);
    
        if (selectedCode.id === 0) {
            setReferralLink(initialDiscountCode);
            return;
        }
    
        try {
            setLoading(true)
            const response = await axiosInstance.get(`referral/details?discount_code_id=${selectedCode.id}`);
            setReferralLink(`${process.env.NEXT_PUBLIC_BASE_URL}/signup?referral=${response.data.referral_code}`);
        } catch (err) {
            console.error("Error fetching referral details:", err);
        } finally{
            setLoading(false)
        }
    };
    

    const faqItems: FAQItem[] = !isMaster
        ? [
            {
                question: '1. How do I start?',
                answer: `To get started, follow these steps: 
                1. Connect Your Stripe Account: Begin by connecting your Stripe account and ensure all necessary details are filled in accurately. 
                2. Verify Connection: Once your Stripe account is successfully connected, you can proceed to the next step. 
                3. Select Discount Code: Choose the available discount code for the referral user. 
                4. Copy Referral Code: Copy the referral code provided. 
                5. Share with Your Network: Send the referral code to your network to start referring users.`
            },
            {
                question: '2. How do I connect Stripe to get paid?', answer: `To connect your Stripe account and start receiving payments, follow these steps:
                1. Click "Connect to Stripe": Begin by clicking the "Connect to Stripe" button.
                2. Generate Account ID: We will generate an account ID for you.
                3. Add Information: Click on "Add Information" and fill in all the necessary details to successfully connect your Stripe account.` },
            {
                question: '3. How do I invite users to sign up?', answer: `To invite users to sign up, follow these steps:
                1. Connect Your Stripe Account: Ensure your Stripe account is successfully connected.
                2. Select Discount Code: Choose the discount code for signup referrals.
                3. Copy Referral Code: Copy the referral code provided.
                4. Share the Link: Send the referral link to users to invite them to sign up.` },
            {
                question: '4. How do I see my sign-ups?', answer: `To view the users who signed up using your referral link, follow these steps:
                1. Go to Account: Select the "Accounts" heading at the top of the page.
                2. View Referral Details: In the account section, you will find the details of users who signed up through your referral link.` },
            {
                question: '5. How do I see my commission?', answer: `To view your commission, follow these steps:
                1. Go to Payout: Select the "Payout" heading at the top of the page.
                2. View Commission Details: In the payout section, you will find the details of your commission.` },
            {
                question: '6. When do I get paid?', answer: `Referral rewards are distributed in the first week of the following month.` },
        ] :
        [
            {
                question: '1. How do I start?',
                answer: `To get started, follow these steps: 
                1. Connect Your Stripe Account: Begin by connecting your Stripe account and ensure all necessary details are filled in accurately.
                2. Verify Connection: Once your Stripe account is successfully connected, you can proceed to the next step.
                3. Select Discount Code: Choose the available discount code for the referral user.
                4. Copy Referral Code: Copy the referral code provided.
                5. Share with Your Network: Send the referral code to your network to start referring users.
                6. Invite Partners: Alternatively, you can click on "Add Partner" to invite a partner.`
            },
            {
                question: '2. How do I connect Stripe to get paid?', answer: `To connect your Stripe account and start receiving payments, follow these steps:
                1. Click "Connect to Stripe": Begin by clicking the "Connect to Stripe" button.
                2. Generate Account ID: We will generate an account ID for you.
                3. Add Information: Click on "Add Information" and fill in all the necessary details to successfully connect your Stripe account.` },
            {
                question: '3. How do I invite users to sign up?', answer: `To invite users to sign up, follow these steps:
                1. Connect Your Stripe Account: Ensure your Stripe account is successfully connected.
                2. Select Discount Code: Choose the discount code for signup referrals.
                3. Copy Referral Code: Copy the referral code provided.
                4. Share the Link: Send the referral link to users to invite them to sign up.` },
            {
                question: '4. How do I see my sign-ups?', answer: `To view the users who signed up using your referral link, follow these steps:
                1. Go to Account: Select the "Accounts" heading at the top of the page.
                2. View Referral Details: In the account section, you will find the details of users who signed up through your referral link.` },
            {
                question: '5. How do I see my commission?', answer: `To view your commission, follow these steps:
                1. Go to Payout: Select the "Payout" heading at the top of the page.
                2. View Commission Details: In the payout section, you will find the details of your commission.` },
            {
                question: '6. How do I invite a partner?', answer: `To invite a partner, follow these steps:
                1. Click "Add Partner": Begin by clicking the "Add Partner" button.
                2. Enter Partner Details: Fill in the partner's full name, email, company name, and commission.
                3. Set Commission: Ensure the commission you assign to the partner is less than the commission assigned to you.
                4. Send Invitation: Click "Send" to send the invitation link to the partner's email you entered.` },
            {
                question: "7. How do I set up the partner's commission?", answer: `There are two ways to set up a partner's commission:
                1. During Invitation: When you invite the partner by clicking on the "Add Partner" button, you can assign the commission at that time.
                2. Edit Existing Partner: Select the "Partner" heading at the top of the page. In the partner table, find the action column and click on "Edit" to change the partner's commission.` },
            {
                question: '8. When do I get paid?', answer: `Referral rewards are distributed in the first week of the following month.` },
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
            const fullReferralLink = `${process.env.NEXT_PUBLIC_BASE_URL}/signup?referral=${responseDetails.data.referral_code}`;
            setReferralLink(fullReferralLink);
            setInitialDiscountCode(fullReferralLink)
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
                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', border: '1px solid rgba(235, 235, 235, 1)', justifyContent: 'start', borderRadius: '4px', padding: '1rem 1.5rem', gap: 4, opacity: 1 }}>
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
                                        value={discountCode?.name}
                                        onChange={handleDiscountCodeChange}
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
                                        {[withoutDiscountCode, ...discountCodeOptions].map((option, index) => (
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
                                    value={referralLink}
                                    InputProps={{
                                        style: {
                                            color: 'rgba(17, 17, 19, 1)',
                                            fontFamily: 'Nunito Sans',
                                            fontWeight: 400,
                                            fontSize: '14px',
                                        },
                                        endAdornment: (
                                            referralLink && (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={handleCopyClick}
                                                        edge="end"
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
                                        pointerEvents: 'auto',
                                        "& .MuiOutlinedInput-root": {
                                            pointerEvents: 'auto', // Важное дополнение
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

                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', border: '1px solid rgba(235, 235, 235, 1)', justifyContent: 'start', borderRadius: '4px', padding: '1rem 1.5rem', gap: 2, mb:1 }}>
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
                                            '&.Mui-expanded': {
                                                margin: '0px',
                                            },
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
                                                minHeight: '36px',
                                                padding: 0,
                                                margin: 0,
                                                '&.Mui-expanded': {
                                                    minHeight: '10px',
                                                },
                                                '& .MuiAccordionSummary-content': {
                                                    marginTop: '6px'
                                                },
                                                '& .MuiAccordionSummary-content.Mui-expanded': {
                                                    marginTop: '6px',
                                                },
                                            }}
                                        >
                                            <Typography className="second-sub-title">{item.question}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ margin: 0, paddingTop: 0 }}>
                                            <Typography className="table-data" sx={{ fontSize: '13px !important', lineHeight: '18px !important' }}>
                                                {item.answer.split('\n').map((line, i) => (
                                                    <React.Fragment key={i}>
                                                        {line}
                                                        <br />
                                                    </React.Fragment>
                                                ))}
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