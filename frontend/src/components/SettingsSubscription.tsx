"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogActions, Tooltip, Slider, DialogContent, DialogTitle, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel, InputAdornment, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlanCard from '@/components/PlanCard';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';

const subscriptionStyles = {
    formContainer: {
        display: 'flex',
        gap: '2em',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        '@media (max-width: 900px)': {
          flexDirection: 'column'
        },
      },
      formWrapper: {
        maxWidth: '380px'
      }
}

export const SettingsSubscription: React.FC = () => {
    const [plans, setPlans] = useState<any[]>([]);
    const [credits, setCredits] = useState<number>(50000);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axiosInterceptorInstance.get('/subscriptions/stripe-plans?period=monthly');
                setPlans(response.data.stripe_plans);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const handleBuyCredits = () => {
        // Логика для покупки кредитов
        console.log('Buy Credits clicked');
    };

    const handleChoosePlan = async (stripePriceId: string) => {
        try {
            const response = await axiosInterceptorInstance.get(`/subscriptions/session/new?price_id=${stripePriceId}`);
            if (response.status === 200) {
                window.location.href = response.data.link;
            }
        } catch (error) {
            console.error('Error choosing plan:', error);
        }
    };

    const handleChangeCredits = (event: Event, newValue: number | number[]) => {
        setCredits(newValue as number);
    };

    return (
                <Box sx={{ padding: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Subscription
                    </Typography>

                    {/* Plans Section */}
                    <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Plans
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                            <Typography variant="body1" color="textSecondary">
                                Monthly
                            </Typography>
                            <Typography variant="body1" color="textSecondary">
                                Yearly
                            </Typography>
                            <Typography variant="body1" color="primary">
                                Save 20%
                            </Typography>
                        </Box>

                        {/* Display Plans */}
                        <Box sx={subscriptionStyles.formContainer}>
                            {plans.length > 0 ? (
                                plans.map((plan, index) => (
                                    <Box key={index} sx={subscriptionStyles.formWrapper}>
                                        <PlanCard plan={plan} onChoose={handleChoosePlan} />
                                    </Box>
                                ))
                            ) : (
                                <Typography>No plans available</Typography>
                            )}
                        </Box>
                    </Box>

                    {/* Prospect Credits Section */}
                    <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Prospect Credits
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Choose the number of contacts credits for your team
                        </Typography>
                        <Box sx={{ marginBottom: 2 }}>
                            <Typography variant="body1">50K Credits/month</Typography>
                            <Slider
                                value={credits}
                                onChange={handleChangeCredits}
                                min={10000}
                                max={100000} // Example max value, adjust as needed
                                step={10000}
                                valueLabelDisplay="auto"
                                aria-labelledby="credits-slider"
                            />
                        </Box>
                        <Typography variant="h6" gutterBottom>
                            Summary
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Teams Plan: {selectedPlan?.name || 'None'}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            {credits} prospect contacts credits
                        </Typography>
                        <Typography variant="h6" gutterBottom>
                            ${selectedPlan?.price || '0'}/month
                        </Typography>
                        <Button variant="contained" color="primary" onClick={handleBuyCredits}>
                            Buy Credits
                        </Button>
                    </Box>
                </Box>
    );
};

