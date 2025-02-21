"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Box, Typography, Button, Table, TableBody, Modal, TableCell, TableContainer, TableHead, TableRow, Grid, IconButton, Switch, Divider, Popover, Drawer, LinearProgress, TextField, Chip } from '@mui/material';
import Image from 'next/image';
import { Elements } from '@stripe/react-stripe-js';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import CloseIcon from '@mui/icons-material/Close';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import CheckoutForm from '@/components/CheckoutForm';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import axios from 'axios';
import CustomTooltip from '@/components/customToolTip';
import DownloadIcon from '@mui/icons-material/Download';
import TelegramIcon from '@mui/icons-material/Telegram';
import CustomTablePagination from '@/components/CustomTablePagination';

type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unionpay';

const cardBrandImages: Record<CardBrand, string> = {
    visa: '/visa-icon.svg',
    mastercard: '/mastercard-icon.svg',
    amex: '/american-express.svg',
    discover: '/discover-icon.svg',
    unionpay: '/unionpay-icon.svg'
};

const billingStyles = {
    tableColumn: {
        lineHeight: '16px !important',
        position: 'relative',
        paddingLeft: '45px',
        paddingTop: '18px',
        paddingBottom: '18px',
        '&::after': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: '15px', // Space from the top
            bottom: '15px', // Space from the bottom
            right: 0, // Position the border at the right edge
            width: '1px',
            height: 'calc(100% - 30px)', // Full height minus top and bottom spacing
            backgroundColor: 'rgba(235, 235, 235, 1)', // Border color
        },
        '&:last-child::after': {
            content: 'none'
        }
    },
    tableBodyRow: {
        '&:last-child td': {
            borderBottom: 0
        }
    },
    tableBodyColumn: {
        lineHeight: '16px !important',
        position: 'relative',
        paddingLeft: '45px',
        paddingTop: '13.5px',
        paddingBottom: '13.5px',
        '&::after': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: '15px', // Space from the top
            bottom: '15px', // Space from the bottom
            right: 0, // Position the border at the right edge
            width: '1px',
            height: 'calc(100% - 30px)', // Full height minus top and bottom spacing
            backgroundColor: 'rgba(235, 235, 235, 1)', // Border color
        },
        '&:last-child::after': {
            content: 'none'
        }
    },
    formField: {
        margin: '0'
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
    },
    formInput: {
        '&.MuiFormControl-root': {
            margin: 0,
        },
        '&.MuiOutlinedInput-root': {
            '& .MuiOutlinedInput-input': {
                fontFamily: 'Roboto',
                color: '#202124',
                fontSize: '14px',
                lineHeight: '20px'
            }
        }
    },
    page_number: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        color: 'rgba(80, 82, 178, 1)',
    },
}


export const SettingsBilling: React.FC = () => {
    const [prospectData, setProspectData] = useState(0);
    const [contactsCollected, setContactsCollected] = useState(0);
    const [planContactsCollected, setPlanContactsCollected] = useState(0);
    const [cardDetails, setCardDetails] = useState<any[]>([]);
    const [billingDetails, setBillingDetails] = useState<any>({});
    const [billingHistory, setBillingHistory] = useState<any[]>([]);
    const [checked, setChecked] = useState(false);
    const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(null);
    const [overageAnchorEl, setOverageAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedCardId, setSelectedCardId] = useState<string | null>();
    const [selectedInvoiceId, setselectedInvoiceId] = useState<string | null>();
    const [removePopupOpen, setRemovePopupOpen] = useState(false);
    const [downgrade_plan, setDowngrade_plan] = useState<any | null>();
    const [canceled_at, setCanceled_at] = useState<string | null>();
    const [sendInvoicePopupOpen, setSendInvoicePopupOpen] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [rowsPerPageOptions, setRowsPerPageOptions] = useState<number[]>([]);
    const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [inactiveContactCounts, setInactiveContactCounts] = useState(0);
    const [inactiveDate, setInactiveDate] = useState<string | null>();
    const [hide, setHide] = useState(false);
    const sourcePlatform = useMemo(() => {
        if (typeof window !== 'undefined') {
            const savedMe = sessionStorage.getItem('me');
            if (savedMe) {
                try {
                    const parsed = JSON.parse(savedMe);
                    return parsed.source_platform || '';
                } catch (error) { }
            }
        }
        return '';
    }, [typeof window !== 'undefined' ? sessionStorage.getItem('me') : null]);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const fetchCardData = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.get('/settings/billing');
            if (response.data.status == 'hide') {
                setHide(true)
            } else {
                setCardDetails(response.data.card_details);
                setContactsCollected(response.data.usages_credits.leads_credits);
                setPlanContactsCollected(response.data.usages_credits.plan_leads_credits)
                setProspectData(response.data.usages_credits.prospect_credits);
            }
            setChecked(response.data.billing_details.is_leads_auto_charging);
            setBillingDetails(response.data.billing_details.subscription_details);
            setDowngrade_plan(response.data.billing_details.downgrade_plan);
            setCanceled_at(response.data.billing_details.canceled_at);

        } catch (error) {
        } finally {
            setIsLoading(false);
        }
    };


    const fetchBillingHistoryData = async (page: number, rowsPerPage: number) => {
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.get('/settings/billing-history', {
                params: {
                    page: page + 1, // сервер принимает 1 как первую страницу, а пагинация в React считает с 0
                    per_page: rowsPerPage,
                },
            });
            if (response.data == 'hide') {
                setHide(true)
            } else {
                const { billing_history, count } = response.data;
                setBillingHistory(billing_history);
                setTotalRows(count); // Устанавливаем общее количество строк
                let newRowsPerPageOptions: number[] = [];
                if (count <= 10) {
                    newRowsPerPageOptions = [5, 10];
                } else if (count <= 50) {
                    newRowsPerPageOptions = [10, 20];
                } else if (count <= 100) {
                    newRowsPerPageOptions = [10, 20, 50];
                } else if (count <= 300) {
                    newRowsPerPageOptions = [10, 20, 50, 100];
                } else if (count <= 500) {
                    newRowsPerPageOptions = [10, 20, 50, 100, 300];
                } else {
                    newRowsPerPageOptions = [10, 20, 50, 100, 300, 500];
                }
                if (!newRowsPerPageOptions.includes(count)) {
                    newRowsPerPageOptions.push(count);
                    newRowsPerPageOptions.sort((a, b) => a - b); // Ensure the options remain sorted
                }
                setRowsPerPageOptions(newRowsPerPageOptions); // Update the options
            }
        } catch (error) {
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        fetchCardData();
        fetchBillingHistoryData(page, rowsPerPage);
    }, [page, rowsPerPage]);

    const formatKey = (key: string) => {
        return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const renderValue = (value: any) => {
        if (value === null || value === undefined) {
            return '--'; // Fallback value if undefined or null
        }
        if (typeof value === 'object') {
            return JSON.stringify(value); // Convert objects/arrays to string
        }
        return String(value); // Ensure numbers and other values are converted to strings
    };

    const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChecked(event.target.checked);
        handleSwitchOverage()
        if (event.target.checked) {
            setOverageAnchorEl(event.currentTarget); // Set anchor to display popover
        } else {
            handleSendChangeOverage()
            setOverageAnchorEl(null); // Hide popover if unchecked (No)
        }
    };
    const handleOverageClose = () => {
        setOverageAnchorEl(null);
        setChecked(false);
    };

    const overageOpen = Boolean(overageAnchorEl);
    const overageId = overageOpen ? 'overage-popover' : undefined;

    const label = { inputProps: { 'aria-label': 'overage' } };

    const handleClickOpen = (event: React.MouseEvent<HTMLElement>, id: string) => {
        setDeleteAnchorEl(event.currentTarget);
        setSelectedCardId(id);
    };

    const handleDeleteClose = () => {
        setDeleteAnchorEl(null);
    };

    const handleRemovePopupOpen = () => {
        const cardToRemove = cardDetails.find(card => card.id === selectedCardId);

        if (cardToRemove) {
            if (cardToRemove.is_default) {
                showErrorToast('Cannot delete default card');
                return;
            }
        }

        setRemovePopupOpen(true);
        setDeleteAnchorEl(null);
    };


    const handleSetDefault = async () => {
        const cardToRemove = cardDetails.find(card => card.id === selectedCardId);

        if (cardToRemove) {
            if (cardToRemove.is_default) {
                showErrorToast('The bank card is already default');
                return;
            }
        }
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.put('/settings/billing/default-card', { payment_method_id: selectedCardId });

            if (response.status === 200) {
                switch (response.data.status) {
                    case 'SUCCESS':
                        showToast('Set default card successfully');
                        setCardDetails(prevCardDetails =>
                            prevCardDetails.map(card => {
                                if (card.id === selectedCardId) {
                                    return { ...card, is_default: true }
                                } else {
                                    return { ...card, is_default: false };
                                }
                            })
                        );
                        break
                    default:
                        showErrorToast('Unknown response received.');
                }
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response && error.response.status === 403) {
                    showErrorToast('Access denied: You do not have permission to remove this member.');
                }
            }
        } finally {
            setIsLoading(false);
            handleDeleteClose();
            setSelectedCardId(null);
        }
    };

    const handleRemovePopupClose = () => {
        setRemovePopupOpen(false);
    };

    const handleDeleteCard = async () => {
        try {
            setIsLoading(true);
            const payment_method_id = {
                payment_method_id: selectedCardId
            };
            const response = await axiosInterceptorInstance.delete('/settings/billing/delete-card', {
                data: payment_method_id
            });

            if (response.status === 200) {
                switch (response.data.status) {
                    case 'SUCCESS':
                        showToast('Delete user card successfully');
                        setCardDetails(prevCardDetails =>
                            prevCardDetails.filter(card => card.id !== selectedCardId)
                        );
                        break
                    default:
                        showErrorToast('Unknown response received.');
                }
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response && error.response.status === 403) {
                    showErrorToast('Access denied: You do not have permission to remove this member.');
                }
            }
        } finally {
            setIsLoading(false);
            handleRemovePopupClose()
            setSelectedCardId(null);
        }
    };

    const handleSendInvoicePopupOpen = (invoice_id: string) => {
        setselectedInvoiceId(invoice_id)
        setSendInvoicePopupOpen(true);
    };

    const handleSendInvoicePopupClose = () => {
        setSendInvoicePopupOpen(false);
        setselectedInvoiceId(null)
    };

    const handleSendInvoice = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.post('/settings/billing/send-billing', { email: email, invoice_id: selectedInvoiceId });
            if (response.status === 200) {
                switch (response.data) {
                    case 'SUCCESS':
                        showToast('Send invoice successfully');
                        break
                    default:
                        showErrorToast('Unknown response received.');
                }
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response && error.response.status === 403) {
                    showErrorToast('Access denied: You do not have permission to remove this member.');
                }
            }
        } finally {
            setIsLoading(false);
            handleSendInvoicePopupClose()
            setselectedInvoiceId(null)
        }
    };

    const fetchSaveBillingHistory = async (invoice_id: string) => {
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.get(`/settings/billing/download-billing?invoice_id=${invoice_id}`);
            const link = response.data;
            if (link) {
                const a = document.createElement('a');
                a.href = link;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                showErrorToast("Download billing not found.");
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                showErrorToast(error.message);
            } else if (error instanceof Error) {
                showErrorToast(error.message);
            } else {
                showErrorToast("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };


    // Handler for page change
    const handleChangePage = (_: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setPage(newPage);
    };

    const handleSendChangeOverage = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.post('/settings/billing/overage');

            if (response.status === 200) {
                switch (response.data.status) {
                    case 'SUCCESS':
                        setChecked(response.data.is_leads_auto_charging);
                        showToast('Change overage successfully');
                        break
                    default:
                        showErrorToast('Unknown response received.');
                }
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response && error.response.status === 403) {
                    showErrorToast('Access denied: You do not have permission to remove this member.');
                }
            }
        } finally {
            setOverageAnchorEl(null);
            setIsLoading(false);
        }
    };

    const handleSwitchOverage = async () => {
        try {
            const response = await axiosInterceptorInstance.post('/settings/billing/switch-overage');
            if (response.status === 200) {
                setInactiveContactCounts(response.data.contact_count)
                setInactiveDate(response.data.date)
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response && error.response.status === 403) {
                    showErrorToast('Access denied: You do not have permission to remove this member.');
                }
            }
        }
    };

    const handleBuyCredits = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.get(`/subscriptions/buy-credits?credits_used=${10}`);
            if (response && response.data.status) {
                showToast(response.data.status);
                if (response.data.status == 'Payment success') {
                    setProspectData(prospectData + 10)
                }
            }
            else if (response.data.link) {
                window.location.href = response.data.link;
            } else {
                showErrorToast("Payment link not found.");
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                showErrorToast(error.message);
            } else if (error instanceof Error) {
                showErrorToast(error.message);
            } else {
                showErrorToast("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };


    // Handler for rows per page change
    // const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    //     const newRowsPerPage = parseInt(event.target.value, 10); // Преобразуем строку в число
    //     setRowsPerPage(newRowsPerPage);
    // };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Reset to first page when changing rows per page
    };

    const handleCheckoutSuccess = (data: any) => {
        setCardDetails(prevDetails => [...prevDetails, data]);
    };

    const formatDate = (dateString: string): string => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const handleRedirectSubscription = () => {
        window.location.href = '/settings?section=subscription';
    };

    const handleCancel = async () => {
        try {
            setIsLoading(false);
            const response = await axiosInterceptorInstance.get(`/subscriptions/cancel-downgrade`);
            if (response && response.data) {
                showToast(response.data);
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                showErrorToast(error.message);
            } else if (error instanceof Error) {
                showErrorToast(error.message);
            } else {
                showErrorToast("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
        window.location.reload();
    };


    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'successful':
                return {
                    background: '#eaf8dd',
                    color: '#2b5b00 !important'
                };
            case 'decline':
                return {
                    background: '#ececec',
                    color: '#4a4a4a !important'
                };
            case 'failed':
                return {
                    background: '#fcd4cf',
                    color: '#a61100 !important'
                };
            default:
                return {
                    background: '#ececec',
                    color: '#4a4a4a !important'
                };
        }
    };

    const deleteOpen = Boolean(deleteAnchorEl);
    const deleteId = deleteOpen ? 'delete-popover' : undefined;

    if (isLoading) {
        return <CustomizedProgressBar />;
    }


    return (
        <Box sx={{pr:2, pt:1}}>
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6} sx={{ padding: '0px' }}>
                    <Box sx={{ border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)', p: 3, height: '100%' }}>

                        {hide == true ? '' :
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Typography className="first-sub-title">
                                        Card Details
                                    </Typography>
                                    <CustomTooltip title={"View detailed information about your card, including balance, transactions, and expiration date."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/settings/add-the-credit-card" />
                                </Box>
                                <Box sx={{
                                    border: '1px dashed #5052B2',
                                    borderRadius: '4px',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    <Button onClick={handleOpen} sx={{ padding: 2 }}>
                                        <Image src="/add-square.svg" alt="add-square" height={24} width={24} />
                                    </Button>
                                </Box>
                            </Box>
                        }

                        {cardDetails.length > 0 && cardDetails.map((card) => (
                            <Box key={card.id} sx={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2,
                                '@media (max-width: 600px)': {
                                    alignItems: 'flex-end'
                                }
                            }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{
                                        width: '62px',
                                        height: '62px',
                                        borderRadius: '4px',
                                        border: '1px solid #f0f0f0',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <Image
                                            src={cardBrandImages[card.brand as CardBrand] || '/default-card-icon.svg'} // Default icon if brand not found
                                            alt={`${card.brand}-icon`}
                                            height={54}
                                            width={54} // Adjust the size as needed
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Typography className="first-sub-title" sx={{
                                                '@media (max-width: 600px)': {
                                                    fontSize: '12px !important'
                                                }
                                            }}>
                                                {`${card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} (**** ${card.last4})`}
                                            </Typography>
                                            {card.is_default && (
                                                <Typography className="main-text" sx={{
                                                    borderRadius: '4px',
                                                    background: '#eaf8dd',
                                                    color: '#2b5b00',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    padding: '2px 12px'
                                                }}>Default</Typography>
                                            )}
                                        </Box>
                                        <Typography className="second-text" sx={{
                                            fontSize: '12px',
                                            fontWeight: '400',
                                            lineHeight: 'normal',
                                            color: '#787878',
                                            letterSpacing: '0.06px'
                                        }}>
                                            Expire date: {`${card.exp_month < 10 ? '0' : ''}${card.exp_month}/${card.exp_year}`}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box>
                                    {!card.is_default && (
                                        <IconButton onClick={(event) => handleClickOpen(event, card.id)}>
                                            <Image
                                                src='/more.svg'
                                                alt='more'
                                                height={20}
                                                width={20}
                                            />
                                        </IconButton>
                                    )}
                                    <Popover
                                        id={deleteId}
                                        open={deleteOpen}
                                        anchorEl={deleteAnchorEl}
                                        onClose={handleDeleteClose}
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'center',
                                        }}
                                        transformOrigin={{
                                            vertical: 'top',
                                            horizontal: 'right',
                                        }}
                                    >
                                        <Box sx={{
                                            minWidth: '230px'
                                        }}>

                                            <Box sx={{ my: 2 }}>
                                                <Button
                                                    className='hyperlink-red'
                                                    onClick={handleRemovePopupOpen} sx={{
                                                        border: 'none',
                                                        boxShadow: 'none',
                                                        color: '#202124 !important',
                                                        lineHeight: 'normal !important',
                                                        textTransform: 'none',
                                                        minWidth: 'auto',
                                                        width: '100%',
                                                        padding: '4px 0 4px 16px',
                                                        textAlign: 'left',
                                                        display: 'block',
                                                        borderRadius: '0',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(80, 82, 178, 0.10)'
                                                        }

                                                    }}>
                                                    Remove
                                                </Button>
                                                <Button
                                                    className='hyperlink-red'
                                                    onClick={handleSetDefault} sx={{
                                                        border: 'none',
                                                        boxShadow: 'none',
                                                        color: '#202124 !important',
                                                        lineHeight: 'normal !important',
                                                        textTransform: 'none',
                                                        minWidth: 'auto',
                                                        width: '100%',
                                                        padding: '4px 0 4px 16px',
                                                        textAlign: 'left',
                                                        display: 'block',
                                                        borderRadius: '0',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(80, 82, 178, 0.10)'
                                                        }
                                                    }}>
                                                    Set as default
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Popover>
                                </Box>
                            </Box>
                        ))}



                        <Modal open={open} onClose={handleClose}>
                            <Box sx={{
                                bgcolor: 'white',
                                borderRadius: '4px',
                                padding: '16px',
                                maxWidth: '400px',
                                margin: '100px auto',
                            }}>
                                <Elements stripe={stripePromise}>
                                    <CheckoutForm handleClose={handleClose} onSuccess={handleCheckoutSuccess} />
                                </Elements>
                            </Box>
                        </Modal>


                    </Box>

                </Grid>
                <Grid item xs={12} md={6} sx={{ padding: '0px' }}>
                    <Box sx={{ border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)', p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 2 }}>
                            <Typography className="first-sub-title">
                                Billing Details
                            </Typography>
                            {billingDetails?.active ? (
                                canceled_at ? (
                                    <Box sx={{ display: 'flex', borderRadius: '4px', background: '#FCDBDC', padding: '2px 12px', gap: '3px', alignItems: 'center' }}>
                                        <Typography className="main-text" sx={{
                                            borderRadius: '4px',
                                            color: '#4E0110',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            lineHeight: '16px',
                                        }}>
                                            Subscription Cancelled
                                        </Typography>
                                        <Image src={'danger.svg'} alt='danger' width={14} height={13.5} />
                                    </Box>
                                ) : downgrade_plan.plan_name ? (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            borderRadius: '4px',
                                            background: '#FDF2CA',
                                            padding: '2px 12px',
                                            gap: '3px',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Typography
                                            className="main-text"
                                            sx={{
                                                borderRadius: '4px',
                                                color: '#795E00',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                lineHeight: '16px',
                                            }}
                                        >
                                            Downgrade pending - {downgrade_plan.plan_name} {downgrade_plan.downgrade_at}.{' '}
                                            <span
                                                onClick={handleCancel}
                                                style={{
                                                    color: 'blue',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Cancel
                                            </span>
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', borderRadius: '4px', background: '#eaf8dd', padding: '2px 12px', gap: '3px' }}>
                                        <Typography className="main-text" sx={{
                                            borderRadius: '4px',
                                            color: '#2b5b00',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            lineHeight: '16px'
                                        }}>
                                            Active
                                        </Typography>
                                    </Box>
                                )
                            ) : (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        borderRadius: '4px',
                                        background: '#f8dede',
                                        padding: '2px 12px',
                                        gap: '3px'
                                    }}
                                >
                                    <Typography
                                        className="main-text"
                                        sx={{
                                            borderRadius: '4px',
                                            color: '#b00000',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            lineHeight: '16px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Subscription Cancelled.{' '}
                                        <span
                                            onClick={handleRedirectSubscription}
                                            style={{
                                                color: '#146EF6',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.color = 'darkblue')}
                                            onMouseLeave={(e) => (e.currentTarget.style.color = '#146EF6')}
                                        >
                                            Choose Plan
                                        </span>
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {billingDetails && Object.entries(billingDetails).map(([key, value], index) => {
                                if (key === 'overage' && hide === false) {
                                    // Custom flex layout for "Overage"
                                    return (
                                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Box sx={{
                                                display: 'flex', flexDirection: 'row', gap: '26px',
                                                alignItems: 'center',
                                                '@media (max-width: 600px)': {
                                                    gap: '12px'
                                                }
                                            }}>
                                                <Box sx={{display: 'flex', flexDirection: 'row', width: '130px', gap:0.5, alignItems: 'center', '@media (max-width: 600px)': {
                                                        width: '110px'
                                                    }}}> 
                                                <Typography className="third-sub-title" sx={{
                                                    fontWeight: '600 !important',
                                                    lineHeight: '16px !important',
                                                }}>
                                                    Overage
                                                </Typography>
                                                <CustomTooltip title='How overage works.' linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/settings/enable-overage" />
                                                </Box>
                                                <Typography className="second-text" sx={{
                                                    fontSize: '12px',
                                                    fontWeight: '400',
                                                    lineHeight: '16px',
                                                    color: '#5f6368',
                                                    letterSpacing: '0.06px'
                                                }}>
                                                    {billingDetails.overage === 'free' ? `--` : `$ ${billingDetails.overage}/contact`}
                                                </Typography>
                                            </Box>
                                            <Box position="relative" display="inline-block">
                                                <Switch
                                                    {...label}
                                                    checked={checked}
                                                    onChange={handleSwitchChange}
                                                    sx={{
                                                        width: 54, // Increase width to fit "Yes" and "No"
                                                        height: 24,
                                                        padding: 0,
                                                        '& .MuiSwitch-switchBase': {
                                                            padding: 0,
                                                            top: '2px',
                                                            left: '3px',
                                                            '&.Mui-checked': {
                                                                left: 0,
                                                                transform: 'translateX(32px)', // Adjust for larger width
                                                                color: '#fff',
                                                                '&+.MuiSwitch-track': {
                                                                    backgroundColor: checked ? '#5052b2' : '#7b7b7b',
                                                                    opacity: checked ? '1' : '1',
                                                                }
                                                            },
                                                        },
                                                        '& .MuiSwitch-thumb': {
                                                            width: 20,
                                                            height: 20,
                                                        },
                                                        '& .MuiSwitch-track': {
                                                            borderRadius: 20 / 2,
                                                            backgroundColor: checked ? '#5052b2' : '#7b7b7b',
                                                            opacity: checked ? '1' : '1',
                                                            '& .MuiSwitch-track.Mui-checked': {
                                                                backgroundColor: checked ? '#5052b2' : '#7b7b7b',
                                                                opacity: checked ? '1' : '1',
                                                            }
                                                        },
                                                    }}
                                                />
                                                <Box sx={{
                                                    position: "absolute",
                                                    top: "50%",
                                                    left: "0px",
                                                    width: "100%",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    transform: "translateY(-50%)",
                                                    pointerEvents: "none"
                                                }}>
                                                    {/* Conditional Rendering of Text */}
                                                    {!checked && (
                                                        <Typography
                                                            className='second-text'
                                                            variant="caption"
                                                            sx={{
                                                                fontSize: '12px',
                                                                color: '#fff',
                                                                fontWeight: '400',
                                                                marginRight: '8px',
                                                                lineHeight: 'normal',
                                                                width: '100%',
                                                                textAlign: 'right',
                                                            }}
                                                        >
                                                            No
                                                        </Typography>
                                                    )}

                                                    {checked && (
                                                        <Typography
                                                            className='second-text'
                                                            variant="caption"
                                                            sx={{
                                                                fontSize: '12px',
                                                                color: '#fff',
                                                                fontWeight: '400',
                                                                marginLeft: '6px',
                                                                lineHeight: 'normal'
                                                            }}
                                                        >
                                                            Yes
                                                        </Typography>
                                                    )}
                                                </Box>

                                                <Popover
                                                    id={overageId}
                                                    open={overageOpen}
                                                    anchorEl={overageAnchorEl}
                                                    onClose={handleOverageClose}
                                                    anchorOrigin={{
                                                        vertical: 'bottom',
                                                        horizontal: 'center',
                                                    }}
                                                    transformOrigin={{
                                                        vertical: 'top',
                                                        horizontal: 'right',
                                                    }}
                                                >
                                                    <Box sx={{
                                                        width: '405px',
                                                        borderRadius: '4px',
                                                        border: '0.2px solid #afafaf',
                                                        background: '#fff',
                                                        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.12)',
                                                        padding: '16px 21px 16px 16px',
                                                        '@media (max-width: 600px)': {
                                                            width: 'auto'
                                                        }
                                                    }}>
                                                        <Typography variant="body1" className='first-sub-title' sx={{
                                                            paddingBottom: '8px'
                                                        }}>Enable Overage</Typography>
                                                        <Typography variant="body2" className='paragraph' sx={{
                                                            color: '#5f6368 !important',
                                                            lineHeight: '16px !important',
                                                            paddingBottom: '24px'
                                                        }}>
                                                            On enabling overage, we will send {inactiveContactCounts} contacts that were collected after {inactiveDate ? formatDate(inactiveDate) : 'N/A'}, when your plan exceeded the limit and from now  new contacts will be added with overage charge
                                                            ${billingDetails.overage}/contact.
                                                        </Typography>
                                                        <Box display="flex" justifyContent="flex-end" mt={2}>
                                                            <Button className='hyperlink-red' onClick={handleOverageClose} sx={{
                                                                borderRadius: '4px',
                                                                border: '1px solid #5052b2',
                                                                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                                color: '#5052b2 !important',
                                                                marginRight: '16px',
                                                                textTransform: 'none'
                                                            }}>
                                                                Cancel
                                                            </Button>
                                                            <Button className='hyperlink-red' onClick={handleSendChangeOverage} sx={{
                                                                background: '#5052B2',
                                                                borderRadius: '4px',
                                                                border: '1px solid #5052b2',
                                                                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                                color: '#fff !important',
                                                                textTransform: 'none',
                                                                '&:hover': {
                                                                    color: '#5052B2 !important'
                                                                }
                                                            }}>
                                                                Confirm
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                </Popover>

                                            </Box>
                                        </Box>

                                    );
                                }

                                if (key === 'next_billing_date' && value !== null) {
                                    return (
                                        <Box key={index} sx={{
                                            display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '64px',
                                            '@media (max-width: 600px)': {
                                                gap: '12px'
                                            }
                                        }}>
                                            {/* Next Billing Date */}
                                            <Box sx={{
                                                display: 'flex', alignItems: 'center', background: '#fafaf6', borderRadius: '4px', border: '1px solid #bdbdbd', padding: '8px 16px', gap: '16px',
                                                '@media (max-width: 600px)': {
                                                    padding: '8px 10px',
                                                    gap: '8px'
                                                }
                                            }}>
                                                <Image src='/calender-icon.svg'
                                                    alt='calender-icon'
                                                    height={24}
                                                    width={24}
                                                />
                                                <Box>
                                                    <Typography className='main-text' sx={{
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        lineHeight: '16px',
                                                        color: '#4a4a4a'
                                                    }}>
                                                        {canceled_at ? `Cancellation Date` : 'Next Billing Date'}
                                                    </Typography>
                                                    <Typography className='first-sub-title' sx={{
                                                        fontWeight: '700 !important',
                                                        '@media (max-width: 600px)': {
                                                            fontSize: '12px !important'
                                                        }

                                                    }}>On {renderValue(value)}</Typography>
                                                </Box>
                                            </Box>
                                            {/* Divider */}
                                            <Divider orientation="vertical" flexItem sx={{ height: '32px', alignSelf: 'center' }} />

                                            {/* Monthly Total - find it in the next iteration */}
                                            {billingDetails && typeof billingDetails === 'object' && Object.entries(billingDetails).map(([nextKey, nextValue], nextIndex) => {
                                                if (nextKey === 'monthly_total') {
                                                    return (
                                                        <Box key={nextIndex} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                            <Typography className='main-text' sx={{
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                lineHeight: '16px',
                                                                color: '#4a4a4a'
                                                            }}>Monthly Total</Typography>
                                                            <Typography className='first-sub-title' sx={{
                                                                fontWeight: '700 !important'
                                                            }}>{renderValue(nextValue)}</Typography>
                                                        </Box>
                                                    );
                                                }
                                                if (nextKey === 'yearly_total') {
                                                    return (
                                                        <Box key={nextIndex} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                            <Typography className='main-text' sx={{
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                lineHeight: '16px',
                                                                color: '#4a4a4a'
                                                            }}>Yearly Total</Typography>
                                                            <Typography className='first-sub-title' sx={{
                                                                fontWeight: '700 !important'
                                                            }}>{renderValue(nextValue)}</Typography>
                                                        </Box>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </Box>
                                    );
                                }

                                // Skip rendering 'Monthly Total' in its own row, since it's already handled
                                if (key === 'monthly_total' || key === 'active' || key === 'yearly_total') {
                                    return null;
                                }

                                // Default layout for other billing details
                                return (
                                    <Box key={index} sx={{
                                        display: 'flex', flexDirection: 'row', gap: '26px',
                                        '@media (max-width: 600px)': {
                                            gap: '12px'
                                        }
                                    }}>
                                        <Typography className="first-sub-title" sx={{
                                            width: '130px',
                                            fontSize: '12px !important',
                                            lineHeight: '16px !important',
                                            '@media (max-width: 600px)': {
                                                width: '110px'
                                            }
                                        }}>
                                            {formatKey(key)}
                                        </Typography>
                                        <Typography className="paragraph" sx={{
                                            lineHeight: '16px !important',
                                            color: '#5f6368 !important'
                                        }}>
                                            {renderValue(value).includes('-1') ? renderValue(value).replace('-1', 'unlimited') : renderValue(value)}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>


                    </Box>
                </Grid>
            </Grid>

            <Box sx={{ borderRadius: '4px', border: '1px solid #f0f0f0', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)', p: 3, marginBottom: 2 }}>

                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Typography className='first-sub-title' sx={{ mb: 2 }}>
                        Usages
                    </Typography>
                    <Chip
                        label='Coming soon'
                        className='second-sub-title'
                        sx={{
                            backgroundColor: '#FDF2CA', borderRadius: '4px', justifyContent: 'center', color: '#795E00 !important', "@media (max-width: 600px)": { display: 'none' }
                        }}>
                    </Chip>
                </Box>
                <Box sx={{
                    display: 'flex', justifyContent: 'space-between', gap: '55px',
                    '@media (max-width: 600px)': {
                        gap: '24px',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }
                }}>
                    {
                        hide == true ? '' :
                            <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography className='second-sub-title' sx={{ lineHeight: '20px !important', mb: '12px' }}>
                                        Contacts collected
                                    </Typography>
                                    <Typography className='second-sub-title' sx={{ lineHeight: '20px !important', mb: '12px' }}>
                                        {planContactsCollected === -1 && contactsCollected === -1
                                            ? 'Unlimited'
                                            : planContactsCollected
                                                ? `${Math.floor(((planContactsCollected - contactsCollected) / planContactsCollected) * 100)}% Used`
                                                : 0}
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={
                                        planContactsCollected === -1 && contactsCollected === -1
                                            ? 0
                                            : Math.round(((planContactsCollected - contactsCollected) / planContactsCollected) * 100)
                                    }
                                    sx={{
                                        height: '8px',
                                        borderRadius: '4px',
                                        backgroundColor: '#dbdbdb',
                                        mb: 1,
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: '#6ec125',
                                        },
                                    }}
                                />
                                <Typography className='paragraph' sx={{ color: '#787878' }}>
                                    {planContactsCollected === -1 && contactsCollected === -1
                                        ? ''
                                        : `${Math.max(0, planContactsCollected - contactsCollected)} out of ${planContactsCollected} Remaining`}
                                </Typography>
                            </Box>
                    }

                    <Box sx={{
                        width: '100%',
                        '@media (min-width: 601px)': {
                            display: 'none'
                        }
                    }}>
                        <Divider sx={{
                            borderColor: '#e4e4e4',
                            marginLeft: '-24px',
                            marginRight: '-24px'
                        }} />
                    </Box>
                    <Box sx={{ display: 'none', "@media (max-width: 600px)": { display: 'flex', width: '100%', justifyContent: 'end' } }}>
                        <Chip
                            label='Coming soon'
                            className='second-sub-title'
                            sx={{
                                backgroundColor: '#FDF2CA', borderRadius: '4px', justifyContent: 'center', color: '#795E00 !important',
                            }}>
                        </Chip>
                    </Box>
                    {
                        hide == true ? '' :
                            <Box sx={{ width: '100%', marginBottom: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', opacity: 0.6 }}>
                                    <Typography className='second-sub-title' sx={{ lineHeight: '20px !important', mb: '12px' }}>
                                        Prospect Data
                                    </Typography>
                                    <Typography className='second-sub-title' sx={{ lineHeight: '20px !important', mb: '12px' }}>
                                        0% Used
                                    </Typography>
                                </Box>

                                <LinearProgress
                                    variant="determinate"
                                    value={0}
                                    sx={{
                                        height: '8px',
                                        borderRadius: '4px',
                                        backgroundColor: '#dbdbdb',
                                        mb: 1,
                                        opacity: 0.6
                                    }}
                                />
                                <Typography className='paragraph' sx={{ color: '#787878 !important', opacity: 0.6 }}>
                                    {0}
                                </Typography>

                            </Box>
                    }
                    {hide == true ? '' :
                        <Box sx={{ flexShrink: 0, opacity: 0.6 }}>
                            <Button
                                className='hyperlink-red'
                                disabled={true}
                                onClick={handleBuyCredits}
                                sx={{
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
                                }}
                            >
                                Buy Credits
                            </Button>

                        </Box>
                    }

                </Box>


            </Box>


            <Divider sx={{
                borderColor: '#e4e4e4',
                maxWidth: '100%',
                '@media (max-width: 600px)': {
                    marginLeft: '-16px',
                    marginRight: '-16px'
                }
            }} />
            <Box sx={{ marginTop: '30px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 3 }}>
                    <Typography variant="h6" className='first-sub-title' sx={{
                        lineHeight: '22px !important'
                    }}>Billing History</Typography>
                    <CustomTooltip title={"You can download the billing history and share it with your teammates."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/settings/how-to-download-the-billing-invoice" />
                </Box>
                <TableContainer sx={{
                    border: '1px solid #EBEBEB',
                    borderRadius: '4px 4px 0px 0px'
                }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    className='table-heading'
                                    sx={{
                                        ...billingStyles.tableColumn,
                                        background: '#fff'
                                    }}>Date</TableCell>
                                <TableCell className='table-heading' sx={billingStyles.tableColumn}>Invoice ID</TableCell>
                                <TableCell className='table-heading' sx={billingStyles.tableColumn}>Pricing Plan</TableCell>
                                <TableCell className='table-heading' sx={billingStyles.tableColumn}>Total</TableCell>
                                <TableCell className='table-heading' sx={billingStyles.tableColumn}>Status</TableCell>
                                {sourcePlatform !== 'shopify' && (
                                    <TableCell className='table-heading' sx={billingStyles.tableColumn}>Actions</TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {billingHistory.length === 0 ? (
                                <TableRow sx={billingStyles.tableBodyRow}>
                                    <TableCell className='table-data' colSpan={5} sx={{
                                        ...billingStyles.tableBodyColumn,
                                        textAlign: 'center',
                                        paddingTop: '18px',
                                        paddingBottom: '18px'
                                    }}>
                                        No history found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                billingHistory.map((history, index) => (
                                    <TableRow key={index}
                                        sx={{
                                            ...billingStyles.tableBodyRow,
                                            '&:hover': {
                                                backgroundColor: '#F7F7F7',
                                                '& .sticky-cell': {
                                                    backgroundColor: '#F7F7F7',
                                                }
                                            },

                                        }}
                                    >
                                        <TableCell className="sticky-cell table-data" sx={{
                                            ...billingStyles.tableBodyColumn,
                                            cursor: 'pointer',
                                            backgroundColor: '#fff'
                                        }}>{history.date}</TableCell>

                                        <TableCell className='table-data' sx={billingStyles.tableBodyColumn}>{history.invoice_id}</TableCell>
                                        <TableCell className='table-data' sx={billingStyles.tableBodyColumn}>
                                            {history.pricing_plan}
                                        </TableCell>
                                        <TableCell className='table-data' sx={billingStyles.tableBodyColumn}>${history.total}</TableCell>
                                        <TableCell className='table-data' sx={billingStyles.tableBodyColumn}>
                                            <Typography component="span" className='table-data' sx={{
                                                ...getStatusStyles(history.status),
                                                padding: '6px 8px',
                                                borderRadius: '2px',
                                            }}>
                                                {history.status}
                                            </Typography>
                                        </TableCell>
                                        {sourcePlatform !== 'shopify' && (
                                            <TableCell className="table-data" sx={billingStyles.tableBodyColumn}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    {/* Download Button */}
                                                    <IconButton
                                                        onClick={() => fetchSaveBillingHistory(history.invoice_id)}
                                                        sx={{ ':hover': { backgroundColor: 'transparent' }, padding: 0 }}
                                                    >
                                                        <DownloadIcon
                                                            sx={{
                                                                width: '24px',
                                                                height: '24px',
                                                                color: 'rgba(188, 188, 188, 1)',
                                                                ':hover': { color: 'rgba(80, 82, 178, 1)' }
                                                            }}
                                                        />
                                                    </IconButton>

                                                    {/* Send Invoice Button */}
                                                    <IconButton
                                                        onClick={() => handleSendInvoicePopupOpen(history.invoice_id)}
                                                        sx={{ ':hover': { backgroundColor: 'transparent' }, padding: 0 }}
                                                    >
                                                        <TelegramIcon
                                                            sx={{
                                                                width: '24px',
                                                                height: '24px',
                                                                color: 'rgba(188, 188, 188, 1)',
                                                                ':hover': { color: 'rgba(80, 82, 178, 1)' }
                                                            }}
                                                        />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* Pagination Component */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: '42px 0 0px', mb:1 }}>
                    <CustomTablePagination
                        count={totalRows}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={rowsPerPageOptions}
                    />
                </Box>
            </Box>

            <Drawer
                anchor="right"
                open={removePopupOpen}
                onClose={handleRemovePopupClose}
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
                        Confirm Deletion
                    </Typography>
                    <IconButton onClick={handleRemovePopupClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 5, height: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Image src='/delete-card-icon.svg' alt='delete-card-icon' width={403} height={403} />
                        <Typography className='second-sub-title' sx={{
                            fontWeight: '600 !important',
                            lineHeight: '20px !important',
                            color: '#4a4a4a !important',
                            marginBottom: '20px'
                        }}>
                            Delete card detail
                        </Typography>
                        <Typography className='paragraph' sx={{
                            lineHeight: '16px !important',
                            color: '#5f6368 !important'
                        }}>
                            To remove your default payment method, you need to set another payment <br />
                            method as the default first!
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
                                <Button className="hyperlink-red" onClick={handleRemovePopupClose} sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#5052b2 !important',
                                    marginRight: '16px',
                                    textTransform: 'none',
                                    padding: '10px 24px'
                                }}>
                                    Cancel
                                </Button>
                                <Button className="hyperlink-red" onClick={handleDeleteCard} sx={{
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
                                    Delete
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>

            </Drawer>

            <Drawer
                anchor="right"
                open={sendInvoicePopupOpen}
                onClose={handleSendInvoicePopupClose}
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
                        Send Invoice
                    </Typography>
                    <IconButton onClick={handleSendInvoicePopupClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 5, height: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', p: 4 }}>
                        <Typography className='second-sub-title' sx={{
                            fontWeight: '600 !important',
                            color: '#4a4a4a !important',
                            marginBottom: '38px'
                        }}>
                            Invoice with {selectedInvoiceId} ID will be shared to the email inbox directly.
                            Please kindly check your mail inbox.
                        </Typography>
                        <TextField sx={billingStyles.formField}
                            label="Enter Email ID"
                            fullWidth
                            margin="normal"
                            InputLabelProps={{
                                className: "form-input-label",
                                focused: false
                            }}
                            InputProps={{
                                className: "form-input",
                                sx: billingStyles.formInput
                            }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                                <Button className='hyperlink-red' onClick={handleSendInvoicePopupClose} sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#5052b2 !important',
                                    marginRight: '16px',
                                    textTransform: 'none',
                                    padding: '10px 24px'
                                }}>
                                    Cancel
                                </Button>
                                <Button className='hyperlink-red' onClick={handleSendInvoice} sx={{
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
                                    Send
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>

            </Drawer>

        </Box >




    );
};
