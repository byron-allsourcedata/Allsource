"use client";
import React, { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Box, Typography, Button, Table, TableBody, Modal, TableCell, TableContainer, TableHead, TableRow, Grid, IconButton, Switch, Divider, Popover, Drawer, LinearProgress, Tooltip, TextField, TablePagination } from '@mui/material';
import Image from 'next/image';
import { Elements } from '@stripe/react-stripe-js';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import CloseIcon from '@mui/icons-material/Close';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import CheckoutForm from './CheckoutForm';
import { showErrorToast, showToast } from './ToastNotification';
import axios from 'axios';

type CardBrand = 'visa' | 'mastercard' | 'americanexpress' | 'discover';

const cardBrandImages: Record<CardBrand, string> = {
    visa: '/visa-icon.svg',
    mastercard: '',
    americanexpress: '/american-express.svg',
    discover: ''
};

const billingStyles = {
    tableColumn: {
        fontFamily: 'Nunito Sans',
        fontSize: '12px',
        fontWeight: '600',
        lineHeight: '16px',
        color: '#202124',
        position: 'relative',
        textAlign: 'center',
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
        fontFamily: 'Roboto',
        fontSize: '12px',
        fontWeight: '400',
        lineHeight: '16px',
        color: '#5f6368',
        position: 'relative',
        textAlign: 'center',
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
        fontFamily: 'Nunito Sans',
        fontSize: '12px',
        lineHeight: '16px',
        color: 'rgba(17, 17, 19, 0.60)',
        '&.Mui-focused': {
            color: '#0000FF',
        },
    },
    formInput: {
        '&.MuiFormControl-root': {
            margin: 0,
        },
        '&.MuiOutlinedInput-root': {
            height: '48px',
            '& .MuiOutlinedInput-input': {
                padding: '12px 16px 13px 16px',
                fontFamily: 'Roboto',
                color: '#202124',
                fontSize: '14px',
                lineHeight: '20px'
            },
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#A3B0C2',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#A3B0C2',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#0000FF',
            },
        },
        '&+.MuiFormHelperText-root': {
            marginLeft: '0',
        },
    }
}


export const SettingsBilling: React.FC = () => {
    const [prospectData, setProspectData] = useState(0);
    const [contactsCollected, setContactsCollected] = useState(0);
    const [cardDetails, setCardDetails] = useState<any[]>([]);
    const [billingDetails, setBillingDetails] = useState<any>({});
    const [billingHistory, setBillingHistory] = useState<any[]>([]);
    const [checked, setChecked] = useState(false);
    const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(null);
    const [overageAnchorEl, setOverageAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedCardId, setSelectedCardId] = useState<string | null>();
    const [removePopupOpen, setRemovePopupOpen] = useState(false);
    const [sendInvoicePopupOpen, setSendInvoicePopupOpen] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [rowsPerPageOptions, setRowsPerPageOptions] = useState<number[]>([]);
    const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
    const [open, setOpen] = useState(false);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const fetchCardData = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.get('/settings/billing');
            setCardDetails(response.data.card_details);
            setChecked(response.data.billing_details.overage)
            setBillingDetails(response.data.billing_details);


        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBillingHistoryData = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.get('/settings/billing-history');
            const { billing_history, count, max_page } = response.data;
            setBillingHistory(billing_history);
            setTotalRows(count);
            setTotalPages(max_page);
            const derivedRowsPerPage = Math.ceil(count / max_page);
            const options = [10, 25, 50].filter(option => option <= count); // Defaulting to 10, 25, 50
            setRowsPerPageOptions(options);


        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCardData();
        fetchBillingHistoryData();

    }, []);

    const formatKey = (key: string) => {
        return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const renderValue = (value: any) => {
        if (value === null || value === undefined) {
            return 'N/A'; // Fallback value if undefined or null
        }
        if (typeof value === 'object') {
            return JSON.stringify(value); // Convert objects/arrays to string
        }
        return String(value); // Ensure numbers and other values are converted to strings
    };

    const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChecked(event.target.checked);
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
        setRemovePopupOpen(true);
        setDeleteAnchorEl(null);
    };

    const handleSetDefault = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.put('/settings/billing/default-card', { payment_method_id: selectedCardId });

            if (response.status === 200) {
                switch (response.data.status) {
                    case 'SUCCESS':
                        showToast('Delete user card successfully');
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
                } else {
                    console.error('Error removing team member:', error);
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
                } else {
                    console.error('Error removing team member:', error);
                }
            }
        } finally {
            setIsLoading(false);
            handleRemovePopupClose()
            setSelectedCardId(null);
        }
    };

    const handleSendInvoicePopupOpen = () => {
        setSendInvoicePopupOpen(true);
    };

    const handleSendInvoicePopupClose = () => {
        setSendInvoicePopupOpen(false);
    };

    const handleSendInvoice = () => {

    };

    const fetchSaveBillingHistory = async (invoice_id: string) => {
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.get(`/settings/billing/download-billing?invoice_id=${invoice_id}`, {
                responseType: 'blob',
            });
    
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'billing_data.csv');

            document.body.appendChild(link);
            link.click();
            if (link.parentNode) {
                link.parentNode.removeChild(link);
            }
            window.URL.revokeObjectURL(url);
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
                } else {
                    console.error('Error removing team member:', error);
                }
            }
        } finally {
            setOverageAnchorEl(null);
            setIsLoading(false);
        }
    };

    // Handler for rows per page change
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleCheckoutSuccess = (data: any) => {
        setCardDetails(prevDetails => [...prevDetails, data]);
    };


    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'successful':
                return {
                    background: '#eaf8dd',
                    color: '#2b5b00'
                };
            case 'decline':
                return {
                    background: '#ececec',
                    color: '#4a4a4a'
                };
            case 'failed':
                return {
                    background: '#fcd4cf',
                    color: '#a61100'
                };
            default:
                return {
                    background: '#ececec',
                    color: '#4a4a4a'
                };
        }
    };

    const deleteOpen = Boolean(deleteAnchorEl);
    const deleteId = deleteOpen ? 'delete-popover' : undefined;

    if (isLoading) {
        return <CustomizedProgressBar />;
    }


    return (
        <Box>
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6} sx={{ padding: '0px' }}>
                    <Box sx={{ border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)', p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
                            <Typography className="main-text" sx={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                lineHeight: 'normal',
                                color: '#202124'
                            }}>
                                Card Details
                            </Typography>
                            <Button
                                aria-haspopup="true"
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: '4px',
                                    padding: '0',
                                    border: 'none',
                                    minWidth: 'auto',
                                    '@media (min-width: 601px)': {
                                        display: 'none'
                                    }
                                }}
                            >
                                <Image src='/add.svg' alt='logo' height={24} width={24} />
                            </Button>
                        </Box>
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
                                            <Typography className="main-text" sx={{
                                                fontSize: '1rem',
                                                fontWeight: '600',
                                                lineHeight: 'normal',
                                                color: '#202124',
                                                '@media (max-width: 600px)': {
                                                    fontSize: '12px'
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
                                    <IconButton onClick={(event) => handleClickOpen(event, card.id)}>
                                        <Image
                                            src='/more.svg'
                                            alt='more'
                                            height={20}
                                            width={20} // Adjust the size as needed
                                        />
                                    </IconButton>
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
                                                <Button onClick={handleRemovePopupOpen} sx={{
                                                    border: 'none',
                                                    boxShadow: 'none',
                                                    color: '#202124',
                                                    fontFamily: 'Nunito Sans',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    lineHeight: 'normal',
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
                                                {!card.is_default && (
                                                    <Button onClick={handleSetDefault} sx={{
                                                        border: 'none',
                                                        boxShadow: 'none',
                                                        color: '#202124',
                                                        fontFamily: 'Nunito Sans',
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        lineHeight: 'normal',
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
                                                )}
                                            </Box>
                                        </Box>
                                    </Popover>
                                </Box>
                            </Box>
                        ))}

                        <Box sx={{
                            border: '1px dashed #5052B2',
                            borderRadius: '4px',
                            width: '62px',
                            height: '62px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            '@media (max-width: 600px)': {
                                display: 'none'
                            }
                        }}>
                            <Button onClick={handleOpen}>
                                <Image src="/add-square.svg" alt="add-square" height={32} width={32} />
                            </Button>
                        </Box>

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
                            <Typography className="main-text" sx={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                lineHeight: 'normal',
                                color: '#202124'
                            }}>
                                Billing Details
                            </Typography>
                            {billingDetails.active && (
                                <Box sx={{ display: 'flex', borderRadius: '4px', background: '#eaf8dd', padding: '2px 12px', gap: '3px' }}>
                                    <Typography className="main-text" sx={{
                                        borderRadius: '4px',
                                        color: '#2b5b00',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        lineHeight: '16px'
                                    }}>Active</Typography>
                                    <Image
                                        src='/tick-circle-filled.svg'
                                        alt='tick-circle-filled'
                                        height={16}
                                        width={16} // Adjust the size as needed
                                    />
                                </Box>
                            )}

                        </Box>


                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {Object.entries(billingDetails).map(([key, value], index) => {
                                if (key === 'overage') {
                                    // Custom flex layout for "Overage"
                                    return (
                                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Box sx={{
                                                display: 'flex', flexDirection: 'row', gap: '26px',
                                                '@media (max-width: 600px)': {
                                                    gap: '12px'
                                                }
                                            }}>
                                                <Typography className="main-text" sx={{
                                                    width: '130px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    lineHeight: '16px',
                                                    color: '#202124',
                                                    '@media (max-width: 600px)': {
                                                        width: '110px'
                                                    }
                                                }}>
                                                    Overage
                                                </Typography>
                                                <Typography className="second-text" sx={{
                                                    fontSize: '12px',
                                                    fontWeight: '400',
                                                    lineHeight: '16px',
                                                    color: '#5f6368',
                                                    letterSpacing: '0.06px'
                                                }}>{renderValue(value)}</Typography>
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
                                                            variant="caption"
                                                            sx={{
                                                                fontFamily: 'Roboto',
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
                                                            variant="caption"
                                                            sx={{
                                                                fontFamily: 'Roboto',
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
                                                        <Typography variant="body1" sx={{
                                                            color: '#202124',
                                                            fontFamily: 'Nunito Sans',
                                                            fontSize: '16px',
                                                            fontWeight: '600',
                                                            lineHeight: 'normal',
                                                            paddingBottom: '8px'
                                                        }}>Enable Overage</Typography>
                                                        <Typography variant="body2" sx={{
                                                            color: '#5f6368',
                                                            fontFamily: 'Roboto',
                                                            fontSize: '12px',
                                                            fontWeight: '400',
                                                            lineHeight: '16px',
                                                            paddingBottom: '24px'
                                                        }}>
                                                            On enabling overage, we will send 10,000 contacts that were collected after 7th September, when your plan exceeded the limit and from now  new contacts will be added with overage charge
                                                            $0.49/contact.
                                                        </Typography>
                                                        <Box display="flex" justifyContent="flex-end" mt={2}>
                                                            <Button onClick={handleOverageClose} sx={{
                                                                borderRadius: '4px',
                                                                border: '1px solid #5052b2',
                                                                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                                color: '#5052b2',
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '14px',
                                                                fontWeight: '600',
                                                                lineHeight: '20px',
                                                                marginRight: '16px',
                                                                textTransform: 'none'
                                                            }}>
                                                                Cancel
                                                            </Button>
                                                            <Button onClick={handleSendChangeOverage} sx={{
                                                                background: '#5052B2',
                                                                borderRadius: '4px',
                                                                border: '1px solid #5052b2',
                                                                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                                color: '#fff',
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '14px',
                                                                fontWeight: '600',
                                                                lineHeight: '20px',
                                                                textTransform: 'none',
                                                                '&:hover': {
                                                                    color: '#5052B2'
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

                                if (key === 'next_billing_date') {
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
                                                    }}>Next Billing Date</Typography>
                                                    <Typography className='main-text' sx={{
                                                        fontSize: '16px',
                                                        fontWeight: '700',
                                                        lineHeight: 'normal',
                                                        color: '#202124',
                                                        '@media (max-width: 600px)': {
                                                            fontSize: '12px'
                                                        }

                                                    }}>On {renderValue(value)}</Typography>
                                                </Box>
                                            </Box>

                                            {/* Divider */}
                                            <Divider orientation="vertical" flexItem sx={{ height: '32px', alignSelf: 'center' }} />

                                            {/* Monthly Total - find it in the next iteration */}
                                            {Object.entries(billingDetails).map(([nextKey, nextValue], nextIndex) => {
                                                if (nextKey === 'monthly_total') {
                                                    return (
                                                        <Box key={nextIndex} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                            <Typography className='main-text' sx={{
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                lineHeight: '16px',
                                                                color: '#4a4a4a'
                                                            }}>Monthly Total</Typography>
                                                            <Typography className='main-text' sx={{
                                                                fontSize: '16px',
                                                                fontWeight: '700',
                                                                lineHeight: 'normal',
                                                                color: '#202124'
                                                            }}>{renderValue(nextValue)}</Typography>
                                                        </Box>
                                                    );
                                                }
                                                return null; // Skip other keys
                                            })}
                                        </Box>
                                    );
                                }

                                // Skip rendering 'Monthly Total' in its own row, since it's already handled
                                if (key === 'monthly_total' || key === 'active') {
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
                                        <Typography className="main-text" sx={{
                                            width: '130px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            lineHeight: '16px',
                                            color: '#202124',
                                            '@media (max-width: 600px)': {
                                                width: '110px'
                                            }
                                        }}>
                                            {formatKey(key)}
                                        </Typography>
                                        <Typography className="second-text" sx={{
                                            fontSize: '12px',
                                            fontWeight: '400',
                                            lineHeight: '16px',
                                            color: '#5f6368',
                                            letterSpacing: '0.06px'
                                        }}>{renderValue(value)}</Typography>
                                    </Box>
                                );
                            })}
                        </Box>


                    </Box>
                </Grid>
            </Grid>

            <Box sx={{ borderRadius: '4px', border: '1px solid #f0f0f0', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)', p: 3, marginBottom: 2 }}>
                <Typography className='main-text' sx={{ fontSize: '16px', fontWeight: '600', lineHeight: 'normal', color: '#202124', mb: 2 }}>
                    Usages
                </Typography>
                <Box sx={{
                    display: 'flex', justifyContent: 'space-between', gap: '55px',
                    '@media (max-width: 600px)': {
                        gap: '24px',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }
                }}>

                    <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography className='main-text' sx={{ fontSize: '14px', fontWeight: '500', lineHeight: '20px', color: '#202124', mb: '12px' }}>
                                Contacts collected
                            </Typography>
                            <Typography className='main-text' sx={{ fontSize: '14px', fontWeight: '500', lineHeight: '20px', color: '#202124', mb: '12px' }}>
                                46% Used
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={(120 / 250) * 100} // Adjust this calculation as needed
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
                        <Typography className='second-text' sx={{ fontSize: '12px', fontWeight: '400', lineHeight: 'normal', color: '#787878', letterSpacing: '0.06px' }}>
                            120 out of 250 Remaining
                        </Typography>
                    </Box>
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


                    <Box sx={{ width: '100%', marginBottom: 2 }}>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography className='main-text' sx={{ fontSize: '14px', fontWeight: '500', lineHeight: '20px', color: '#202124', mb: '12px' }}>
                                Prospect Data
                            </Typography>
                            <Typography className='main-text' sx={{ fontSize: '14px', fontWeight: '500', lineHeight: '20px', color: '#202124', mb: '12px' }}>
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
                                mb: 1
                            }}
                        />
                        <Typography className='second-text' sx={{ fontSize: '12px', fontWeight: '400', lineHeight: 'normal', color: '#787878', letterSpacing: '0.06px' }}>
                            No data found
                        </Typography>
                    </Box>


                    <Box sx={{ flexShrink: 0 }}>
                        <Button sx={{
                            background: '#5052B2',
                            borderRadius: '4px',
                            border: '1px solid #5052b2',
                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                            color: '#fff',
                            fontFamily: 'Nunito Sans',
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: '20px',
                            textTransform: 'none',
                            padding: '10px 24px',
                            '&:hover': {
                                color: '#5052B2'
                            }
                        }}>Buy Credits</Button>
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
            <Box sx={{ marginTop: '30px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 3 }}>
                    <Typography variant="h6" sx={{
                        fontFamily: 'Nunito Sans',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#202124',
                        lineHeight: '22px'
                    }}>Billing History</Typography>
                    <Tooltip title="Billing Info" placement="right">
                        <Image src='/info-icon.svg' alt='info-icon' height={13} width={13} />
                    </Tooltip>
                </Box>
                <TableContainer sx={{
                    border: '1px solid #EBEBEB',
                    borderRadius: '4px 4px 0px 0px'
                }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{
                                    ...billingStyles.tableColumn,
                                    position: 'sticky', // Make the Name column sticky
                                    left: 0, // Stick it to the left
                                    zIndex: 9,
                                    background: '#fff'
                                }}>Date</TableCell>
                                <TableCell sx={billingStyles.tableColumn}>Invoice ID</TableCell>
                                <TableCell sx={billingStyles.tableColumn}>Pricing Plan</TableCell>
                                <TableCell sx={billingStyles.tableColumn}>Total</TableCell>
                                <TableCell sx={billingStyles.tableColumn}>Status</TableCell>
                                <TableCell sx={billingStyles.tableColumn}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {billingHistory.length === 0 ? (
                                <TableRow sx={billingStyles.tableBodyRow}>
                                    <TableCell colSpan={5} sx={{
                                        ...billingStyles.tableBodyColumn,
                                        textAlign: 'center'
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
                                        <TableCell className="sticky-cell" sx={{
                                            ...billingStyles.tableBodyColumn,
                                            cursor: 'pointer', position: 'sticky', left: '0', zIndex: 9, backgroundColor: '#fff'
                                        }}>{history.date}</TableCell>
                                        <TableCell sx={billingStyles.tableBodyColumn}>{history.invoice_id}</TableCell>
                                        <TableCell sx={billingStyles.tableBodyColumn}>
                                            {history.pricing_plan}
                                        </TableCell>
                                        <TableCell sx={billingStyles.tableBodyColumn}>{history.total}</TableCell>
                                        <TableCell sx={billingStyles.tableBodyColumn}>
                                            <Typography component="span" sx={{
                                                ...getStatusStyles(history.status),
                                                background: '#eaf8dd',
                                                padding: '6px 8px',
                                                borderRadius: '2px',
                                                fontFamily: 'Roboto',
                                                fontSize: '12px',
                                                fontWeight: '400',
                                                lineHeight: 'normal',
                                                color: '#2b5b00',
                                            }}>
                                                {history.status}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={billingStyles.tableBodyColumn}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <IconButton onClick={() => fetchSaveBillingHistory(history.invoice_id)}>
                                                    <Image
                                                        src='/download-icon.svg'
                                                        alt='download-icon'
                                                        height={20}
                                                        width={20}
                                                    />
                                                </IconButton>
                                                <IconButton onClick={handleSendInvoicePopupOpen}>
                                                    <Image
                                                        src='/share-icon.svg'
                                                        alt='share-icon'
                                                        height={20}
                                                        width={20}
                                                    />
                                                </IconButton>
                                            </Box>
                                        </TableCell>

                                    </TableRow>
                                )))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* Pagination Component */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
                    <TablePagination
                        component="div"
                        count={totalRows}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={rowsPerPageOptions}  // Options [10, 25, 50]
                        labelRowsPerPage=""
                        sx={{
                            '& .MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                                fontSize: '0.875rem',
                            }
                        }}
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
                    <Typography variant="h6" sx={{ textAlign: 'center', color: '#202124', fontFamily: 'Nunito Sans', fontWeight: '600', fontSize: '16px', lineHeight: 'normal' }}>
                        Confirm Deletion
                    </Typography>
                    <IconButton onClick={handleRemovePopupClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 5, height: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Image src='/delete-card-icon.svg' alt='delete-card-icon' width={403} height={403} />
                        <Typography className='main-text' sx={{
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: '20px',
                            color: '#4a4a4a',
                            marginBottom: '20px'
                        }}>
                            Delete card detail
                        </Typography>
                        <Typography className='second-text' sx={{
                            fontSize: '12px',
                            fontWeight: '400',
                            lineHeight: '16px',
                            color: '#5f6368'
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
                                <Button onClick={handleRemovePopupClose} sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#5052b2',
                                    fontFamily: 'Nunito Sans',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    lineHeight: '20px',
                                    marginRight: '16px',
                                    textTransform: 'none',
                                    padding: '10px 24px'
                                }}>
                                    Cancel
                                </Button>
                                <Button onClick={handleDeleteCard} sx={{
                                    background: '#5052B2',
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#fff',
                                    fontFamily: 'Nunito Sans',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    lineHeight: '20px',
                                    textTransform: 'none',
                                    padding: '10px 24px',
                                    '&:hover': {
                                        color: '#5052B2'
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
                    <Typography variant="h6" sx={{ textAlign: 'center', color: '#202124', fontFamily: 'Nunito Sans', fontWeight: '600', fontSize: '16px', lineHeight: 'normal' }}>
                        Send Invoice
                    </Typography>
                    <IconButton onClick={handleSendInvoicePopupClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 5, height: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', p: 4 }}>
                        <Typography className='main-text' sx={{
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: 'normal',
                            color: '#4a4a4a',
                            marginBottom: '38px'
                        }}>
                            Invoice with 23423443 ID will be shared to the email inbox directly.
                            Please kindly check your mail inbox.
                        </Typography>
                        <TextField sx={billingStyles.formField}
                            label="Enter Email ID"
                            fullWidth
                            margin="normal"
                            InputLabelProps={{ sx: billingStyles.inputLabel }}
                            InputProps={{
                                sx: billingStyles.formInput,

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
                                <Button onClick={handleSendInvoicePopupClose} sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#5052b2',
                                    fontFamily: 'Nunito Sans',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    lineHeight: '20px',
                                    marginRight: '16px',
                                    textTransform: 'none',
                                    padding: '10px 24px'
                                }}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSendInvoice} sx={{
                                    background: '#5052B2',
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#fff',
                                    fontFamily: 'Nunito Sans',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    lineHeight: '20px',
                                    textTransform: 'none',
                                    padding: '10px 24px',
                                    '&:hover': {
                                        color: '#5052B2'
                                    }
                                }}>
                                    Send
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>

            </Drawer>

        </Box>




    );
};
