"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogActions, Tooltip, Slider, DialogContent, DialogTitle, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel, InputAdornment, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import axios from 'axios';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';

export const SettingsTeams: React.FC = () => {
    const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);

    

    

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
    );
};
