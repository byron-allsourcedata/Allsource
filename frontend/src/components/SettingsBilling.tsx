"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogActions, Tooltip, Slider, DialogContent, DialogTitle, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel, InputAdornment, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';


export const SettingsBilling: React.FC = () => {
    const [prospectData, setProspectData] = useState(0);
    const [contactsCollected, setContactsCollected] = useState(0);
    const [cardDetails, setCardDetails] = useState<any[]>([]);
    const [billingHistory, setBillingHistory] = useState<any[]>([]);

    return (
                <Box sx={{ padding: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Billing
                    </Typography>
                    <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Card Details
                        </Typography>
                        {cardDetails.map((card, index) => (
                            <Box key={index} sx={{ marginBottom: 2 }}>
                                <Typography variant="body1">Card Number: {card.cardNumber}</Typography>
                                <Typography variant="body1">Expiration Date: {card.expirationDate}</Typography>
                                <Typography variant="body1">Card Type: {card.cardType}</Typography>
                            </Box>
                        ))}
                    </Box>
                    <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Billing Details
                        </Typography>
                        <Typography variant="body1">Billing Cycle: {'billingCycle'}</Typography>
                        <Typography variant="body1">Plan Name: {'planName'}</Typography>
                        <Typography variant="body1">Domains: {'domains'}</Typography>
                        <Typography variant="body1">Prospect Credits: {'prospectCredits'}</Typography>
                        <Typography variant="body1">Overage: {'overage'}</Typography>
                    </Box>
                    <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Usage
                        </Typography>
                        <Box sx={{ marginBottom: 2 }}>
                            <Typography variant="body1">Contacts Collected</Typography>
                            <Slider
                                value={contactsCollected}
                                min={0}
                                max={1000} // Example max value, adjust as needed
                                valueLabelDisplay="auto"
                                aria-labelledby="contacts-collected-slider"
                            />
                        </Box>
                        <Box sx={{ marginBottom: 2 }}>
                            <Typography variant="body1">Prospect Data</Typography>
                            <Slider
                                value={prospectData}
                                min={0}
                                max={1000} // Example max value, adjust as needed
                                valueLabelDisplay="auto"
                                aria-labelledby="prospect-data-slider"
                            />
                        </Box>
                    </Box>
                    <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Billing History
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Invoice ID</TableCell>
                                        <TableCell>Pricing Plan</TableCell>
                                        <TableCell>Total</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {billingHistory.map((history) => (
                                        <TableRow key={history.id}>
                                            <TableCell>{history.date}</TableCell>
                                            <TableCell>{history.invoiceId}</TableCell>
                                            <TableCell>{history.pricingPlan}</TableCell>
                                            <TableCell>{history.total}</TableCell>
                                            <TableCell>{history.status}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                >
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>

            
    );
};
