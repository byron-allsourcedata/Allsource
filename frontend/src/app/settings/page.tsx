"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogActions, Tooltip, Slider, DialogContent, DialogTitle, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel, InputAdornment, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { planStyles } from './settingsStyles';
import { SettingsAccountDetails } from '@/components/SettingsAccountDetails';
import { SettingsTeams } from '@/components/SettingsTeams';
import { SettingsBilling } from '@/components/SettingsBilling';
import { SettingsSubscription } from '@/components/SettingsSubscription';
import { SettingsApiDetails } from '@/components/SettingsApiDetails';

const Settings: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>('accountDetails');

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={planStyles.title}>
                Settings
            </Typography>
            <Box sx={{ display: 'flex', gap: 4.25, marginBottom: 3, overflowX: 'auto' }}>
                <Button
                    sx={planStyles.buttonHeading}
                    variant={activeSection === 'accountDetails' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('accountDetails')}
                >
                    Account Details
                </Button>
                <Button
                    sx={planStyles.buttonHeading}
                    variant={activeSection === 'teams' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('teams')}
                >
                    Teams
                </Button>
                <Button
                    sx={planStyles.buttonHeading}
                    variant={activeSection === 'billing' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('billing')}
                >
                    Billing
                </Button>
                <Button
                    sx={planStyles.buttonHeading}
                    variant={activeSection === 'subscription' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('subscription')}
                >
                    Subscription
                </Button>
                <Button
                    sx={planStyles.buttonHeading}
                    variant={activeSection === 'apiDetails' ? 'contained' : 'outlined'}
                    onClick={() => setActiveSection('apiDetails')}
                >
                    API Details
                </Button>
            </Box>

            {activeSection === 'accountDetails' && (
                <SettingsAccountDetails />
            )}

            {activeSection === 'teams' && (
                <SettingsTeams />
            )}

            {activeSection === 'billing' && (
                <SettingsBilling />
            )}

            {activeSection === 'subscription' && (
                <SettingsSubscription />
            )}


            {activeSection === 'apiDetails' && (
                <SettingsApiDetails />
                
            )}

        </Box>
    );
};

export default Settings;
