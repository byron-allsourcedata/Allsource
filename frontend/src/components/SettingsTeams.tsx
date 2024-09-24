"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogActions, Tooltip, Slider, DialogContent, DialogTitle, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel, InputAdornment, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText, FormControl, Select, MenuItem, OutlinedInput, SelectChangeEvent } from '@mui/material';
import axios from 'axios';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import Image from 'next/image';
import { BorderBottom, LineWeight } from '@mui/icons-material';
import { Content } from 'next/font/google';
import { InviteUsersPopup } from './InviteUsersPopup';

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
    tableBodyColumn : {
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
    const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
    // const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [inviteUsersPopupOpen, setInviteUsersPopupOpen] = useState(false);
    const [idCounter, setIdCounter] = useState<number>(0);
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
    const [teamMembers, setTeamMembers] = useState([
        { id: 1, email: 'kalley22@gmail.com', date: 'Aug 18, 2024', role: 'Admin', invite: 'kalley22@gmail.com', addedon: 'Aug 30, 2024' },
        { id: 2, email: 'metro23@gmail.com', date: 'Aug 30, 2024', role: 'Member', invite: 'metro23@gmail.com', addedon: 'Aug 30, 2024' },
    ]);
    const [teamSelectOpen, setTeamSelectOpen] = useState<number | null>(null);

    const handleInviteUsersPopupOpen = () => {
        setInviteUsersPopupOpen(true);
    };

    const handleInviteUsersPopupClose = () => {
        setInviteUsersPopupOpen(false);
    };

    const handleRevoke = (idToRevoke: string) => {
        setPendingInvitations(prevInvitations => 
            prevInvitations.filter(invitation => invitation.id !== idToRevoke)
        );
    };

    const handleSend = (emails: string[], role: string) => {
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

        setPendingInvitations(prevInvitations => [
            ...prevInvitations,
            ...newInvitations,
        ]);
        setIdCounter(prevCounter => prevCounter + emails.length);
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

    const handleRemoveMember = (id: number) => {
        setTeamMembers(prevMembers => prevMembers.filter(member => member.id !== id));
    };

    const handleSelectionChange = (e: SelectChangeEvent<string>, memberId: number) => {
        const newRole = e.target.value as string;
        handleTeamRoleChange(memberId, newRole);
        setTeamSelectOpen(memberId); // Keep the dropdown open after selection
    };

    const handleTeamRoleChange = (id: number, newRole: string) => {
        setTeamMembers(prevMembers => 
            prevMembers.map(member => 
                member.id === id ? { ...member, role: newRole } : member
            )
        );
    };

    const handleRowClick = (id: number) => {
        setSelectedRowId(id); // Update the selected row ID
    };

    const handleArrowClick = (e: React.MouseEvent, memberId: number) => {
        e.stopPropagation(); // Prevent row click event
        // Toggle dropdown on arrow click
        setTeamSelectOpen(prev => (prev === memberId ? null : memberId));
    };

    const handleDropdownClick = (e: React.MouseEvent, memberId: number) => {
        e.stopPropagation(); // Prevent row click event
        // Toggle dropdown on column click
        setTeamSelectOpen(prev => (prev === memberId ? null : memberId));
    };

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
                                            sx={{...teamsStyles.tableColumn,
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
                                        <TableCell className="sticky-cell" sx={{...teamsStyles.tableBodyColumn,
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
                                            <Button onClick={() => handleRevoke(invitation.id)} 
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

                    <Divider sx={{borderColor: '#e4e4e4'}} />

                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 3.75, alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px'}}>
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
                                    3/3 Member limit
                                </Typography>
                                <Tooltip title="Team Info" placement="right">
                                    <Image src='/info-icon.svg' alt='info-icon' height={13} width={13} />
                                </Tooltip>
                            </Box>
                            <Box sx={{ border: '1px dashed #5052B2', borderRadius: '4px'}}>
                                <Button onClick={handleInviteUsersPopupOpen}><Image src="/add-square.svg" alt="add-square" height={24} width={24} /></Button>
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
                                        <TableCell sx={{...teamsStyles.tableColumn,
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
                                ):(
                                    teamMembers.map((member) => (
                                        <TableRow key={member.id}
                                        sx={{
                                            ...teamsStyles.tableBodyRow,
                                            '&:hover': {
                                                backgroundColor: '#F7F7F7',
                                                '& .sticky-cell': {
                                                    backgroundColor: '#F7F7F7',
                                                }
                                            },
                                           
                                        }}
                                        onClick={() => handleRowClick(member.id)} // Handle row click
                                        >
                                            <TableCell className="sticky-cell" sx={{...teamsStyles.tableBodyColumn,
                                                cursor: 'pointer', position: 'sticky', left: '0', zIndex: 9, backgroundColor: '#fff'
                                            }}>{member.email}</TableCell>
                                            <TableCell sx={teamsStyles.tableBodyColumn}>{member.date}</TableCell>
                                            <TableCell sx={teamsStyles.tableBodyColumn} onClick={(e) => handleDropdownClick(e, member.id)}>
                                            <FormControl variant="outlined" sx={{ width: '100%' }}>
                                                <Select
                                                    value={member.role}
                                                    onChange={(e) => handleSelectionChange(e, member.id)}
                                                    open={teamSelectOpen === member.id}
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
                                                                teamSelectOpen === member.id && ( // Show arrow only if the row is selected
                                                                    <InputAdornment position="end" onClick={(e) => handleArrowClick(e, member.id)} sx={{ cursor: 'pointer' }}>
                                                                        <Image
                                                                            src={teamSelectOpen === member.id ? '/chevron-drop-up.svg' : '/chevron-drop-down.svg'}
                                                                            alt={teamSelectOpen === member.id ? 'chevron-drop-up' : 'chevron-drop-down'}
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
                                            <TableCell sx={teamsStyles.tableBodyColumn}>{member.invite}</TableCell>
                                            <TableCell sx={teamsStyles.tableBodyColumn}>{member.addedon}</TableCell>
                                            <TableCell sx={teamsStyles.tableBodyColumn}>
                                                <Button onClick={() => handleRemoveMember(member.id)} 
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
