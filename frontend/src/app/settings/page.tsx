"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogActions, Tooltip, Slider, DialogContent, DialogTitle, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { planStyles } from './settingsStyles';
import PlanCard from '@/components/PlanCard';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';

const Settings: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>('accountDetails');
    const [openDialog, setOpenDialog] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [emailAddress, setEmailAddress] = useState('');
    const [prospectData, setProspectData] = useState(0);
    const [organizationName, setOrganizationName] = useState('');
    const [companyWebsite, setCompanyWebsite] = useState('');
    const [monthlyVisits, setMonthlyVisits] = useState('');
    const [resetPasswordDate, setResetPasswordDate] = useState('');
    const [contactsCollected, setContactsCollected] = useState(0);
    const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [cardDetails, setCardDetails] = useState<any[]>([]);
    const [billingHistory, setBillingHistory] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [credits, setCredits] = useState<number>(50000);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [apiKeys, setApiKeys] = useState<any[]>([]);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axiosInterceptorInstance.get('/subscriptions/stripe-plans');
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

    const calculateDaysAgo = (dateString: string) => {
        if (!dateString) return 'Never';

        const lastChangedDate = new Date(dateString);
        const today = new Date();
        const differenceInTime = today.getTime() - lastChangedDate.getTime();
        const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

        return `${differenceInDays} days ago`;
    };

    const handleChangeCredits = (event: Event, newValue: number | number[]) => {
        setCredits(newValue as number);
    };

    useEffect(() => {
        const fetchAccountDetails = async () => {
            try {
                const response = await axiosInterceptorInstance.get('/settings/account-details');
                const data = response.data;
                setResetPasswordDate(data.reset_password_sent_at);
                setFullName(data.full_name);
                setEmailAddress(data.email_address);
                setOrganizationName(data.company_name);
                setCompanyWebsite(data.company_website);
                setMonthlyVisits(data.company_website_visits);
            } catch (error) {
                console.error('Error fetching account details:', error);
            }
        };

        fetchAccountDetails();
    }, []);

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleEdit = (id: string) => {
        // Handle the edit functionality
        console.log('Edit API Key:', id);
    };

    const handleDelete = (id: string) => {
        // Handle the delete functionality
        console.log('Delete API Key:', id);
    };

    const handleSaveAccountDetails = (field: 'full_name' | 'email_address') => {
        const accountData = {
            account: {
                [field]: field === 'full_name' ? fullName : emailAddress
            }
        };
        axiosInterceptorInstance.put('/settings/account-details', accountData)
            .then(() => {
                alert('Account details updated successfully');
            })
            .catch(error => {
                console.error('Error updating account details:', error);
            });
    };
    

    const handleChangePassword = () => {
        if (newPassword === confirmNewPassword) {
            const changePasswordData = {
                change_password: {
                    current_password: currentPassword,
                    new_password: newPassword
                }
            };
            axiosInterceptorInstance.put('/api/changePassword', changePasswordData)
                .then(() => {
                    alert('Password changed successfully');
                    handleCloseDialog();
                })
                .catch(error => {
                    console.error('Error changing password:', error);
                });
        } else {
            console.error('New passwords do not match');
        }
    };
    

    const handleSaveBusinessInfo = (field: 'organizationName' | 'companyWebsite' | 'monthlyVisits') => {
        const businessInfoData = {
            business_info: {
                organization_name: field === 'organizationName' ? organizationName : undefined,
                company_website: field === 'companyWebsite' ? companyWebsite : undefined,
                visits_to_website: field === 'monthlyVisits' ? monthlyVisits : undefined
            }
        };
        axiosInterceptorInstance.put('/settings/account-details', businessInfoData)
            .then(() => {
                alert('Business info updated successfully');
            })
            .catch(error => {
                console.error('Error updating business info:', error);
            });
    };
    

    const handleRevokeInvitation = (userId: number) => {
        axiosInterceptorInstance.post('/api/revokeInvitation', { userId })
            .then(() => {
                alert('Invitation revoked');
                // Refresh the data after revoking
                axiosInterceptorInstance.get('/api/teamData')
                    .then(response => {
                        setPendingInvitations(response.data.pendingInvitations);
                    })
                    .catch(error => {
                        console.error('Error refreshing pending invitations:', error);
                    });
            })
            .catch(error => {
                console.error('Error revoking invitation:', error);
            });
    };

    const handleRemoveTeamMember = (userId: number) => {
        axiosInterceptorInstance.post('/api/removeTeamMember', { userId })
            .then(() => {
                alert('Team member removed');
                axios.get('/api/teamData')
                    .then(response => {
                        setTeamMembers(response.data.teamMembers);
                    })
                    .catch(error => {
                        console.error('Error refreshing team members:', error);
                    });
            })
            .catch(error => {
                console.error('Error removing team member:', error);
            });
    };

    return (
        <Box sx={{ padding: 2 }}>
            <Typography variant="h4" gutterBottom>
                Settings
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                <Button
                    variant={activeSection === 'accountDetails' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('accountDetails')}
                >
                    Account Details
                </Button>
                <Button
                    variant={activeSection === 'teams' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('teams')}
                >
                    Teams
                </Button>
                <Button
                    variant={activeSection === 'billing' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('billing')}
                >
                    Billing
                </Button>
                <Button
                    variant={activeSection === 'subscription' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('subscription')}
                >
                    Subscription
                </Button>
                <Button
                    variant={activeSection === 'apiDetails' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('apiDetails')}
                >
                    API Details
                </Button>
            </Box>

            {activeSection === 'accountDetails' && (
                <Box sx={{ padding: 2, border: '1px solid #ddd', borderRadius: 1, marginTop: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Account Details
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                        <TextField
                            label="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <Button variant="contained" color="primary" onClick={() => handleSaveAccountDetails('full_name')}>
                            Save
                        </Button>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                        <TextField
                            label="Email Address"
                            value={emailAddress}
                            onChange={(e) => setEmailAddress(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <Button variant="contained" color="primary" onClick={() => handleSaveAccountDetails('email_address')}>
                            Save
                        </Button>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
                        <Button variant="contained" color="secondary" onClick={handleOpenDialog}>
                            Change Password
                        </Button>
                        <Typography variant="body2" sx={{ marginLeft: 2 }}>
                            Last changed: {calculateDaysAgo(resetPasswordDate)} days ago
                        </Typography>
                    </Box>
                    <Dialog open={openDialog} onClose={handleCloseDialog}>
                        <DialogTitle>
                            Change Password
                            <IconButton
                                edge="end"
                                color="inherit"
                                onClick={handleCloseDialog}
                                aria-label="close"
                                sx={{ position: 'absolute', right: 8, top: 8 }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent>
                            <TextField
                                label="Current Password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                fullWidth
                                margin="normal"
                            />
                            <TextField
                                label="New Password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                fullWidth
                                margin="normal"
                            />
                            <TextField
                                label="Confirm New Password"
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                fullWidth
                                margin="normal"
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancel</Button>
                            <Button onClick={handleChangePassword} color="primary">
                                Change Password
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Business Info Section */}
                    <Box sx={{ padding: 2, border: '1px solid #ddd', borderRadius: 1, marginTop: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Business Info
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                            <TextField
                                label="Organization Name"
                                value={organizationName}
                                onChange={(e) => setOrganizationName(e.target.value)}
                                fullWidth
                                margin="normal"
                            />
                            <Button variant="contained" color="primary" onClick={() => handleSaveBusinessInfo('organizationName')}>
                                Save
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                            <TextField
                                label="Company Website"
                                value={companyWebsite}
                                onChange={(e) => setCompanyWebsite(e.target.value)}
                                fullWidth
                                margin="normal"
                            />
                            <Button variant="contained" color="primary" onClick={() => handleSaveBusinessInfo('companyWebsite')}>
                                Save
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                            <TextField
                                label="Monthly Visits to Website"
                                value={monthlyVisits}
                                onChange={(e) => setMonthlyVisits(e.target.value)}
                                fullWidth
                                margin="normal"
                            />
                            <Button variant="contained" color="primary" onClick={() => handleSaveBusinessInfo('monthlyVisits')}>
                                Save
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}

            {activeSection === 'teams' && (
                <Box sx={{ padding: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Teams
                    </Typography>

                    <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Pending Invitations
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Invited User</TableCell>
                                        <TableCell>Access Level</TableCell>
                                        <TableCell>Date Invited</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pendingInvitations.map((invitation) => (
                                        <TableRow key={invitation.id}>
                                            <TableCell>{invitation.invitedUser}</TableCell>
                                            <TableCell>{invitation.accessLevel}</TableCell>
                                            <TableCell>{invitation.dateInvited}</TableCell>
                                            <TableCell>{invitation.status}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() => handleRevokeInvitation(invitation.userId)}
                                                >
                                                    Revoke
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Team Members
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>User</TableCell>
                                        <TableCell>Last Signed-in</TableCell>
                                        <TableCell>Access Level</TableCell>
                                        <TableCell>Invited By</TableCell>
                                        <TableCell>Added On</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {teamMembers.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell>{member.user}</TableCell>
                                            <TableCell>{member.lastSignedIn}</TableCell>
                                            <TableCell>{member.accessLevel}</TableCell>
                                            <TableCell>{member.invitedBy}</TableCell>
                                            <TableCell>{member.addedOn}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() => handleRemoveTeamMember(member.userId)}
                                                >
                                                    Remove
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>
            )}

            {activeSection === 'billing' && (
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
            )}

            {activeSection === 'subscription' && (
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
                        <Box sx={planStyles.formContainer}>
                            {plans.length > 0 ? (
                                plans.map((plan, index) => (
                                    <Box key={index} sx={planStyles.formWrapper}>
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
            )}


            {activeSection === 'apiDetails' && (
                <Box sx={{ padding: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        API Details
                    </Typography>

                    {/* API Keys Section */}
                    <Box sx={{ marginBottom: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            API Keys
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>API Key</TableCell>
                                        <TableCell>API ID</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell>Last Used</TableCell>
                                        <TableCell>Created Date</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {apiKeys.length > 0 ? (
                                        apiKeys.map((key) => (
                                            <TableRow key={key.apiId}>
                                                <TableCell>{key.apiKey}</TableCell>
                                                <TableCell>{key.apiId}</TableCell>
                                                <TableCell>{key.name}</TableCell>
                                                <TableCell>{key.description}</TableCell>
                                                <TableCell>{key.lastUsed}</TableCell>
                                                <TableCell>{key.createdDate}</TableCell>
                                                <TableCell>
                                                    <Tooltip title="Edit">
                                                        <IconButton
                                                            aria-label="edit"
                                                            onClick={() => handleEdit(key.apiId)}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton
                                                            aria-label="delete"
                                                            onClick={() => handleDelete(key.apiId)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7}>No API keys available</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>
            )}

        </Box>
    );
};

export default Settings;
