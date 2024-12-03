import React, { useState } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button, Box, Typography, CircularProgress, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from './ToastNotification';
import axios from 'axios';

interface CheckoutFormProps {
    handleClose: () => void;
    onSuccess: (data: any) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ handleClose, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const handleButtonClick = async () => {
        if (!stripe || !elements) {
            showErrorToast('Stripe.js has not loaded yet.');
            return;
        }
        const cardNumberElement = elements.getElement(CardNumberElement);
        const cardExpiryElement = elements.getElement(CardExpiryElement);
        const cardCvcElement = elements.getElement(CardCvcElement);

        if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
            showErrorToast('Card elements not initialized.');
            return;
        }

        setLoading(true);
        const { paymentMethod, error } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardNumberElement,
        });

        if (error) {
            showErrorToast(error.message || 'An unexpected error occurred.');
            setLoading(false);
            return;
        }

        try {
            const response = await axiosInterceptorInstance.post('/settings/billing/add-card', { payment_method_id: paymentMethod.id });
            if (response.status === 200) {
                const { status } = response.data;
                if (status === 'SUCCESS') {
                    showToast('Card added successfully!');
                    handleClose();
                    onSuccess(response.data.card_details);
                } else {
                    showErrorToast('Unknown response received.');
                }
            } else {
                showErrorToast('Unexpected response status: ' + response.status);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    showErrorToast(`Error: ${error.response.status} - ${error.response.data.message || 'An error occurred.'}`);
                } else {
                    showErrorToast('Network error or no response received.');
                }
            } else {
                showErrorToast('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                padding: '24px',
                background: 'linear-gradient(135deg, #f3f4f6 0%, #e2e8f0 100%)',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                position: 'relative',
                maxWidth: '400px',
                margin: 'auto',
            }}
        >
            <IconButton
                onClick={handleClose}
                sx={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    color: '#fff',
                    '&:hover': {
                        color: '#f44336',
                    }
                }}
            >
                <Close />
            </IconButton>
            <Typography variant="h6" sx={{ marginBottom: '16px', textAlign: 'center', fontWeight: '600', color: '#333' }}>
                Add Your Card
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
                <CardNumberElement
                    options={{
                        style: {
                            base: {
                                color: '#32325d',
                                fontFamily: 'Nunito Sans, sans-serif',
                                fontSize: '16px',
                                fontWeight: '400',
                                lineHeight: '24px',
                                padding: '10px',
                                backgroundColor: '#fff',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                            invalid: {
                                color: '#fa755a',
                            },
                            complete: {
                                color: '#4CAF50',
                            },
                        },
                    }}
                />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Box sx={{ flex: '1', mr: 1 }}>
                    <CardExpiryElement
                        options={{
                            style: {
                                base: {
                                    color: '#32325d',
                                    fontFamily: 'Nunito Sans, sans-serif',
                                    fontSize: '16px',
                                    fontWeight: '400',
                                    lineHeight: '24px',
                                    padding: '10px',
                                    backgroundColor: '#fff',
                                    '::placeholder': {
                                        color: '#aab7c4',
                                    },
                                },
                                invalid: {
                                    color: '#fa755a',
                                },
                                complete: {
                                    color: '#4CAF50',
                                },
                            },
                        }}
                    />
                </Box>
                <Box sx={{ flex: '1', ml: 1 }}>
                    <CardCvcElement
                        options={{
                            style: {
                                base: {
                                    color: '#32325d',
                                    fontFamily: 'Nunito Sans, sans-serif',
                                    fontSize: '16px',
                                    fontWeight: '400',
                                    lineHeight: '24px',
                                    padding: '10px',
                                    backgroundColor: '#fff',
                                    '::placeholder': {
                                        color: '#aab7c4',
                                    },
                                },
                                invalid: {
                                    color: '#fa755a',
                                },
                                complete: {
                                    color: '#4CAF50',
                                },
                            },
                        }}
                    />
                </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    sx={{
                        color: '#007BFF',
                        fontFamily: 'Nunito Sans',
                        textTransform: 'none',
                        lineHeight: '22.4px',
                        fontWeight: '700',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        width: '48%',
                        transition: 'background-color 0.3s, transform 0.2s',
                        '&:hover': {
                            backgroundColor: '#e7f1ff',
                        },
                    }}
                >
                    Cancel
                </Button>

                <Button
                    onClick={handleButtonClick}
                    variant="contained"
                    disabled={loading}
                    sx={{
                        backgroundColor: '#007BFF',
                        color: '#fff',
                        fontFamily: 'Nunito Sans',
                        textTransform: 'none',
                        lineHeight: '22.4px',
                        fontWeight: '700',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        width: '48%',
                        transition: 'background-color 0.3s, transform 0.2s',
                        '&:hover': {
                            backgroundColor: '#0056b3',
                            transform: 'scale(1.02)',
                        },
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Card'}
                </Button>
            </Box>
        </Box>
    );
};

export default CheckoutForm;
