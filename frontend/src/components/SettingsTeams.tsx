"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogActions, Tooltip, Slider, DialogContent, DialogTitle, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel, InputAdornment, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText, FormControl, Select, MenuItem, OutlinedInput, SelectChangeEvent } from '@mui/material';
import axios from 'axios';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import Image from 'next/image';
import { UpgradePlanPopup } from './UpgradePlanPopup';
import { InviteUsersPopup } from './InviteUsersPopup';
import { showErrorToast, showToast } from './ToastNotification';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';

const teamsStyles = {
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
    }
}

interface Invitation {
    id: string; // Unique identifier for each invitation
    email: string;
    role: string;
    date: string; // Store date as a formatted string
    status: string;
}

export const SettingsTeams: React.FC = () => {
    const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [inviteUsersPopupOpen, setInviteUsersPopupOpen] = useState(false);
    const [idCounter, setIdCounter] = useState<number>(0);
    const [memberLimit, setMemberLimit] = useState<number>(0);
    const [memberCount, setMemberCount] = useState<number>(0);
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
    const [teamSelectOpen, setTeamSelectOpen] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [upgradePlanPopup, setUpgradePlanPopup] = useState(false);


    const fetchTeamsData = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.get('/settings/teams');
            const data = response.data;
            setTeamMembers(data.teams)
            setMemberLimit(data.member_limit)
            setMemberCount(data.member_count)
        } catch (error) {
            console.error('Error fetching account details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPendingInvitationData = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.get('/settings/teams/pending-invations');
            const data = response.data;
            setPendingInvitations(data)
        } catch (error) {
            console.error('Error fetching account details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamsData();
        fetchPendingInvitationData();
    }, []);

    const handleInviteUsersPopupOpen = () => {
        axiosInterceptorInstance.get('/settings/teams/check-team-invitations-limit')
            .then(response => {
                if (response.status === 200) {
                    switch (response.data) {
                        case 'INVITATION_LIMIT_NOT_REACHED':
                            setInviteUsersPopupOpen(true);
                            break;
                        case 'INVITATION_LIMIT_REACHED':
                            setUpgradePlanPopup(true);
                            showErrorToast('Invitation limit reached.');
                            break;
                        default:
                            showErrorToast('Unknown response received.');
                    }
                }
            })
            .catch(error => {
                if (error.response && error.response.status === 403) {
                    showErrorToast('Access denied: You do not have permission to send this invitation.');
                } else {
                    console.error('Error revoking invitation:', error);
                }
            });
    };

    const handleInviteUsersPopupClose = () => {
        setInviteUsersPopupOpen(false);
    };

    const handleRevoke = async (email: string) => {
        const result_revoke = await handleRevokeInvitation(email);
        if (result_revoke === true) {
            setPendingInvitations(prevInvitations =>
                prevInvitations.filter(invitation => invitation.email !== email)
            );
        }
    };

    const handleSend = async (emails: string[], role: string) => {
        const newInvitations = emails.map(email => ({
            id: `invitation-${idCounter}`, // Unique ID
            email,
            role,
            date: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            }),
            status: 'Pending',
        }));

        const results = await handleSendInvitation(emails, role);

        if (results.every(result => result)) {
            setPendingInvitations(prevInvitations => [
                ...prevInvitations,
                ...newInvitations,
            ]);
            setIdCounter(prevCounter => prevCounter + emails.length);
        }
    };

    const handleSendInvitation = async (emails: string[], role: string) => {
        const results = [];
        
        for (const email of emails) {
            try {
                const response = await axiosInterceptorInstance.post('/settings/teams', { invite_user: email, access_level: role.toLowerCase() });
                if (response.status === 200) {
                    switch (response.data.status) {
                        case 'SUCCESS':
                            showToast('Invitation sent successfully');
                            setMemberCount(response.data.invitation_count);
                            results.push(true);
                            break;
                        case 'INVITATION_LIMIT_REACHED':
                            showErrorToast('Invitation limit reached.');
                            setMemberCount(response.data.invitation_count);
                            results.push(false);
                            break;
                        case 'ALREADY_INVITED':
                            showErrorToast('User has already been invited.');
                            setMemberCount(response.data.invitation_count);
                            results.push(false);
                            break;
                        case 'FAILED':
                            showErrorToast('Failed to send invitation.');
                            setMemberCount(response.data.invitation_count);
                            results.push(false);
                            break;
                        default:
                            showErrorToast('Unknown response received.');
                            results.push(false);
                            break;
                    }
                }
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    if (err.response && err.response.status === 403) {
                        showErrorToast('Access denied: You do not have permission to send this invitation.');
                    } else {
                        console.error('Error sending invitation:', err.message);
                    }
                } else {
                    console.error('Unexpected error:', err);
                }
                results.push(false);
            }
        }
    
        return results;
    };
    

    const handleRevokeInvitation = async (email: string) => {
        try {
            const response = await axiosInterceptorInstance.put('/settings/teams', { pending_invitation_revoke: email });

            if (response.status === 200) {
                switch (response.data.status) {
                    case 'SUCCESS':
                        showToast('Invitation removed successfully');
                        setMemberCount(response.data.invitation_count)
                        return true;
                    default:
                        showErrorToast('Unknown response received.');
                        setMemberCount(response.data.invitation_count)
                        return false;
                }
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response && error.response.status === 403) {
                    showErrorToast('Access denied: You do not have permission to send this invitation.');
                } else {
                    console.error('Error revoking invitation:', error);
                }
            }
        }
        return false; // Return false if the request fails
    };


    const handleRemoveTeamMember = async (email: string) => {
        try {
            const response = await axiosInterceptorInstance.put('/settings/teams', { remove_user: email });

            if (response.status === 200) {
                switch (response.data.status) {
                    case 'SUCCESS':
                        showToast('Member removed successfully');
                        setMemberCount(response.data.invitation_count)
                        return true;
                    case 'CANNOT_REMOVE_TEAM_OWNER':
                        showErrorToast('Cannot remove team owner!');
                        return false;
                    case 'CANNOT_REMOVE_YOURSELF_FROM_TEAM':
                        showErrorToast('Cannot remove yourself from team!');
                        return false;
                    default:
                        showErrorToast('Unknown response received.');
                        return false;
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
        }
        return false; // Return false if the request fails or if no cases match
    };


    const handleRemoveMember = async (email: string) => {
        if (await handleRemoveTeamMember(email) === true) {
            setTeamMembers(prevMembers => prevMembers.filter(member => member.email !== email));
        }
    };

    const handleSelectionChange = (e: SelectChangeEvent<string>, memberMail: string) => {
        const newRole = e.target.value as string;
        handleTeamRoleChange(memberMail, newRole);
        setTeamSelectOpen(memberMail); // Keep the dropdown open after selection
    };

    const handleTeamRoleChange = (email: string, newRole: string) => {
        setTeamMembers(prevMembers =>
            prevMembers.map(member =>
                member.email === email ? { ...member, role: newRole } : member
            )
        );
    };

    const handleRowClick = (email: string) => {
        setSelectedRowId(email); // Update the selected row ID
    };

    const handleArrowClick = (e: React.MouseEvent, memberMail: string) => {
        e.stopPropagation(); // Prevent row click event
        // Toggle dropdown on arrow click
        setTeamSelectOpen(prev => (prev === memberMail ? null : memberMail));
    };

    const handleDropdownClick = (e: React.MouseEvent, memberMail: string) => {
        e.stopPropagation(); // Prevent row click event
        // Toggle dropdown on column click
        setTeamSelectOpen(prev => (prev === memberMail ? null : memberMail));
    };

    if (isLoading) {
        return <CustomizedProgressBar />;
    }

    return (

        <Box>
            <Box sx={{ marginBottom: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 3 }}>
                    <Typography variant="h6" sx={{
                        fontFamily: 'Nunito Sans',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#202124',
                        lineHeight: '22px'
                    }}>Pending invitations</Typography>
                    <Tooltip title="Team Info" placement="right">
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
                                <TableCell
                                    sx={{
                                        ...teamsStyles.tableColumn,
                                        position: 'sticky', // Make the Name column sticky
                                        left: 0, // Stick it to the left
                                        zIndex: 9,
                                        background: '#fff'
                                    }}>Invited User</TableCell>
                                <TableCell sx={teamsStyles.tableColumn}>Access Level</TableCell>
                                <TableCell sx={teamsStyles.tableColumn}>Date Invited</TableCell>
                                <TableCell sx={teamsStyles.tableColumn}>Status</TableCell>
                                <TableCell sx={teamsStyles.tableColumn}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pendingInvitations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} sx={{
                                        ...teamsStyles.tableBodyColumn,
                                        textAlign: 'center'
                                    }}>
                                        No pending invitations
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pendingInvitations.map((invitation, index) => (
                                    <TableRow key={index} sx={{
                                        ...teamsStyles.tableBodyRow,
                                        '&:hover': {
                                            backgroundColor: '#F7F7F7',
                                            '& .sticky-cell': {
                                                backgroundColor: '#F7F7F7',
                                            }
                                        },

                                    }}>
                                        <TableCell className="sticky-cell" sx={{
                                            ...teamsStyles.tableBodyColumn,
                                            cursor: 'pointer', position: 'sticky', left: '0', zIndex: 9, backgroundColor: '#fff'
                                        }}>{invitation.email}</TableCell>
                                        <TableCell sx={teamsStyles.tableBodyColumn}>{invitation.role}</TableCell>
                                        <TableCell sx={teamsStyles.tableBodyColumn}>{invitation.date}</TableCell>
                                        <TableCell sx={teamsStyles.tableBodyColumn}>
                                            <Typography component="span" sx={{
                                                background: '#ececec',
                                                padding: '6px 8px',
                                                borderRadius: '2px',
                                                fontFamily: 'Roboto',
                                                fontSize: '12px',
                                                fontWeight: '400',
                                                lineHeight: '16px',
                                                color: '#5f6368',
                                            }}>
                                                {invitation.status}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={teamsStyles.tableBodyColumn}>
                                            <Button onClick={() => handleRevoke(invitation.email)}
                                                sx={{
                                                    fontFamily: 'Roboto',
                                                    fontSize: '12px',
                                                    fontWeight: '400',
                                                    lineHeight: '16px',
                                                    color: '#5f6368',
                                                    position: 'relative',
                                                    textAlign: 'center',
                                                    textTransform: 'none',
                                                    '&:hover': {
                                                        background: 'transparent'
                                                    }
                                                }}
                                            >Revoke</Button></TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Divider sx={{ borderColor: '#e4e4e4' }} />

            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 3.75, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Typography variant="h6" sx={{
                            fontFamily: 'Nunito Sans',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#202124',
                            lineHeight: '22px'
                        }}>Team members</Typography>
                        <Typography variant='h6' sx={{
                            background: '#EDEDF7',
                            borderRadius: '4px',
                            fontFamily: 'Roboto',
                            fontSize: '12px',
                            fontWeight: '400',
                            color: '#5f6368',
                            padding: '4px 6px',
                            lineHeight: '16px'
                        }}>
                            {memberCount}/{memberLimit} Member limit
                        </Typography>
                        <Tooltip title="Team Info" placement="right">
                            <Image src='/info-icon.svg' alt='info-icon' height={13} width={13} />
                        </Tooltip>
                    </Box>
                    <Box sx={{ border: '1px dashed #5052B2', borderRadius: '4px' }}>
                        <Button onClick={handleInviteUsersPopupOpen}><Image src="/add-square.svg" alt="add-square" height={24} width={24} /></Button>
                        <UpgradePlanPopup open={upgradePlanPopup} limitName={'team members'} handleClose={() => setUpgradePlanPopup(false)} />
                    </Box>
                    <InviteUsersPopup open={inviteUsersPopupOpen} onClose={handleInviteUsersPopupClose} onSend={handleSend} />
                </Box>

                <TableContainer sx={{
                    border: '1px solid #EBEBEB',
                    borderRadius: '4px 4px 0px 0px'
                }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{
                                    ...teamsStyles.tableColumn,
                                    position: 'sticky', // Make the Name column sticky
                                    left: 0, // Stick it to the left
                                    zIndex: 9,
                                    background: '#fff'
                                }}>User</TableCell>
                                <TableCell sx={teamsStyles.tableColumn}>Last signed-in</TableCell>
                                <TableCell sx={teamsStyles.tableColumn}>Access level</TableCell>
                                <TableCell sx={teamsStyles.tableColumn}>Invited by</TableCell>
                                <TableCell sx={teamsStyles.tableColumn}>Added on</TableCell>
                                <TableCell sx={teamsStyles.tableColumn}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/* {teamMembers.map((member) => (
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
                                    ))} */}
                            {teamMembers.length === 0 ? (
                                <TableRow sx={teamsStyles.tableBodyRow}>
                                    <TableCell colSpan={5} sx={{
                                        ...teamsStyles.tableBodyColumn,
                                        textAlign: 'center'
                                    }}>
                                        No team members found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                teamMembers.map((member) => (
                                    <TableRow key={member.email}
                                        sx={{
                                            ...teamsStyles.tableBodyRow,
                                            '&:hover': {
                                                backgroundColor: '#F7F7F7',
                                                '& .sticky-cell': {
                                                    backgroundColor: '#F7F7F7',
                                                }
                                            },

                                        }}
                                        onClick={() => handleRowClick(member.email)} // Handle row click
                                    >
                                        <TableCell className="sticky-cell" sx={{
                                            ...teamsStyles.tableBodyColumn,
                                            cursor: 'pointer', position: 'sticky', left: '0', zIndex: 9, backgroundColor: '#fff'
                                        }}>{member.email}</TableCell>
                                        <TableCell sx={teamsStyles.tableBodyColumn}>{member.last_sign_in}</TableCell>
                                        <TableCell sx={teamsStyles.tableBodyColumn} onClick={(e) => handleDropdownClick(e, member.email)}>
                                            <FormControl variant="outlined" sx={{ width: '100%' }}>
                                                {member.access_level}
                                                <Select
                                                    value={member.access_level}
                                                    onChange={(e) => handleSelectionChange(e, member.email)}
                                                    open={teamSelectOpen === member.email}
                                                    sx={{
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            border: 'none', // Remove the default border
                                                        },
                                                        '& .MuiOutlinedInput-input': {
                                                            fontFamily: 'Roboto',
                                                            fontSize: '12px',
                                                            lineHeight: '16px',
                                                            color: '#5f6368',
                                                            paddingBottom: '14px', // Add padding to accommodate the dotted line
                                                        },
                                                        '& .MuiSelect-select': {
                                                            display: 'inline-block',
                                                            position: 'relative',
                                                            borderRadius: '0',
                                                            width: 'auto',
                                                            padding: '0 !important',
                                                            margin: '0 auto',
                                                            '&:after': {
                                                                content: '""',
                                                                position: 'absolute',
                                                                left: 0,
                                                                bottom: 0,
                                                                width: '100%',
                                                                borderBottom: '1px dashed #51627B', // Dashed line under the text
                                                            },
                                                        },
                                                        '& .MuiSelect-icon': {
                                                            display: 'none', // Hide the default dropdown icon
                                                        }
                                                    }}
                                                    input={
                                                        <OutlinedInput
                                                            endAdornment={
                                                                teamSelectOpen === member.email && ( // Show arrow only if the row is selected
                                                                    <InputAdornment position="end" onClick={(e) => handleArrowClick(e, member.email)} sx={{ cursor: 'pointer' }}>
                                                                        <Image
                                                                            src={teamSelectOpen === member.email ? '/chevron-drop-up.svg' : '/chevron-drop-down.svg'}
                                                                            alt={teamSelectOpen === member.email ? 'chevron-drop-up' : 'chevron-drop-down'}
                                                                            height={24}
                                                                            width={24}
                                                                        />
                                                                    </InputAdornment>
                                                                )
                                                            }
                                                        />
                                                    }

                                                    MenuProps={{
                                                        PaperProps: {
                                                            sx: {
                                                                '& .MuiMenuItem-root': {
                                                                    fontFamily: 'Nunito Sans',
                                                                    fontSize: '12px',
                                                                    lineHeight: '16px',
                                                                    color: '#202124',
                                                                    fontWeight: '600',
                                                                    '&:not(:last-child)': {
                                                                        borderBottom: '1px dotted #ccc', // Dotted line separator between items
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    }}
                                                >
                                                    <MenuItem key="admin" value="Admin">Admin</MenuItem>
                                                    <MenuItem key="member" value="Member">Member</MenuItem>
                                                    <MenuItem key="read-only" value="Read Only">Read Only</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        <TableCell sx={teamsStyles.tableBodyColumn}>{member.invited_by}</TableCell>
                                        <TableCell sx={teamsStyles.tableBodyColumn}>{member.added_on}</TableCell>
                                        <TableCell sx={teamsStyles.tableBodyColumn}>
                                            <Button onClick={() => handleRemoveMember(member.email)}
                                                sx={{
                                                    fontFamily: 'Roboto',
                                                    fontSize: '12px',
                                                    fontWeight: '400',
                                                    lineHeight: '16px',
                                                    color: '#5f6368',
                                                    position: 'relative',
                                                    textAlign: 'center',
                                                    textTransform: 'none',
                                                    '&:hover': {
                                                        background: 'transparent'
                                                    }
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};
