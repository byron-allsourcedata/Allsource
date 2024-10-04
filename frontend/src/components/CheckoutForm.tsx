import React from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button, Box } from '@mui/material';
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

    const handleButtonClick = async () => {
        if (!stripe || !elements) {
            console.error('Stripe.js has not loaded yet.');
            return;
        }

        const cardElement = elements.getElement(CardElement);

        if (!cardElement) {
            console.error('CardElement not initialized.');
            return;
        }
        const { paymentMethod, error } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
        });

        if (error) {
            showErrorToast(error.message || 'An unexpected error occurred.');
            return;
        }

        try {
            const response = await axiosInterceptorInstance.post('/settings/billing/add-card', { payment_method_id: paymentMethod.id });
            if (response.status === 200) {
                const { status } = response.data;
                switch (status) {
                    case 'SUCCESS':
                        showToast('Card added successfully!');
                        handleClose();
                        onSuccess(response.data.card_details);
                        break;
                    default:
                        showErrorToast('Unknown response received.');
                        return false;
                }
            } else {
                showErrorToast('Unexpected response status: ' + response.status);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    if (error.response.status === 403) {
                        showErrorToast('Access denied: You do not have permission to remove this member.');
                    } else {
                        showErrorToast(`Error: ${error.response.status} - ${error.response.data.message || 'An error occurred.'}`);
                    }
                } else {
                    console.error('Network error or no response received:', error);
                    showErrorToast('Network error or no response received.');
                }
            } else {
                console.error('Unexpected error:', error);
                showErrorToast('An unexpected error occurred.');
            }
        }
    }

    return (
        <Box sx={{ padding: '16px' }}>
            <CardElement options={{ hidePostalCode: true }} />
            <Box sx={{mt: 4}}>
            <Button 
                onClick={handleButtonClick} 
                sx={{
                    backgroundColor: '#fff',
                    color: 'rgba(80, 82, 178, 1)',
                    fontFamily: "Nunito Sans",
                    textTransform: 'none',
                    lineHeight: '22.4px',
                    fontWeight: '700',
                    padding: '0.5em 0.5em',
                    marginBottom: 1,
                    textWrap: 'nowrap',
                    fontSize: '16px',
                    border: '1px solid rgba(80, 82, 178, 1)',
                    maxWidth: '79px',
                    maxHeight: '40px',
                    '&:hover': { backgroundColor: '#fff', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)' },
                }}>
                    Save
            </Button>
            </Box>
        </Box>
    );
};
export default CheckoutForm;
