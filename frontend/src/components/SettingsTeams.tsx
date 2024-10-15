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
import CustomTooltip from './customToolTip';
import CloseIcon from '@mui/icons-material/Close';
import SortIcon from '@mui/icons-material/Sort'; // Import the sort icon

const teamsStyles = {
    tableColumn: {
        lineHeight: '16px !important',
        position: 'relative',
        paddingLeft: '45px',
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
        lineHeight: '16px !important',
        position: 'relative',
        paddingLeft: '45px',
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

const roleOptions = [
    { key: "admin", value: "Admin" },
    { key: "standard", value: "Standard" },
    { key: "read_only", value: "Read Only" },
    { key: "owner", value: "Owner" },
];

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
    const [revokePopupOpen, setRevokePopupOpen] = useState(false);
    const [removePopupOpen, setRemovePopupOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
    const [selectedMemberEmail, setSelectedMemberEmail] = useState<string | null>(null);
    const [sortField, setSortField] = useState<string>('email');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');


    const fetchTeamsData = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.get('/settings/teams');
            const data = response.data;
            setTeamMembers(data.teams.sort((a: any, b: any) => {
                if (a.access_level === 'owner' && b.access_level !== 'owner') {
                    return -1;
                }
                if (a.access_level !== 'owner' && b.access_level === 'owner') {
                    return 1;
                }
                return 0;
            }));

            setMemberLimit(data.member_limit)
            setMemberCount(data.member_count)
        } catch (error) {
            console.error('Error fetching account details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangeUserRole = async (email: string, role: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.post('/settings/teams/change-user-role', { invite_user: email, access_level: role });
            if (response.status === 200) {
                switch (response.data.status) {
                    case 'SUCCESS':
                        showToast('Change user role successfully');
                        return true;
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
        } finally {
            setIsLoading(false);
        }
        return false;
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

    const handleInviteUsersPopupOpen = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInterceptorInstance.get('/settings/teams/check-team-invitations-limit');
            if (response.status === 200) {
                switch (response.data) {
                    case 'INVITATION_LIMIT_NOT_REACHED':
                        setInviteUsersPopupOpen(true);
                        break;
                    case 'INVITATION_LIMIT_REACHED':
                        setUpgradePlanPopup(true);
                        break;
                    default:
                        showErrorToast('Unknown response received.');
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
        } finally {
            setIsLoading(false);
        }
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
        role = role.toLowerCase().replace(/\s+/g, '_');
        for (const email of emails) {
            try {
                setIsLoading(true);
                const response = await axiosInterceptorInstance.post('/settings/teams', { invite_user: email, access_level: role });
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
            } finally {
                setIsLoading(false);
            }
        }

        return results;
    };


    const handleRevokeInvitation = async (email: string) => {
        try {
            setIsLoading(true);
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
                    showErrorToast('Access denied: You do not have permission to revoke this invitation.');
                } else {
                    console.error('Error revoking invitation:', error);
                }
            }
        } finally {
            setIsLoading(false);
        }
        return false; // Return false if the request fails
    };


    const handleRemoveTeamMember = async (email: string) => {
        try {
            setIsLoading(true);
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
        } finally {
            setIsLoading(false);
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
        setTeamSelectOpen(memberMail);
        handleChangeUserRole(memberMail, newRole)
    };

    const handleTeamRoleChange = (email: string, newRole: string) => {
        setTeamMembers(prevMembers =>
            prevMembers.map(member =>
                member.email === email ? { ...member, access_level: newRole } : member
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
    const handleRevokePopupOpen = (email: string) => {
        setSelectedEmail(email); // Set the selected email
        setRevokePopupOpen(true); // Open the drawer
    };
    const handleRevokePopupClose = () => {
        setRevokePopupOpen(false);
    };
    const handleRemovePopupOpen = (email: string) => {
        setSelectedMemberEmail(email);
        setRemovePopupOpen(true);
    };

    const handleRemovePopupClose = () => {
        setRemovePopupOpen(false);
    };

    const handleSort = (field: string) => {
        // Determine if we should sort in ascending or descending order
        const isAsc = sortField === field && sortDirection === 'asc';
        const newDirection = isAsc ? 'desc' : 'asc';
    
        // Update sort direction and field state
        setSortDirection(newDirection);
        setSortField(field);
    
        // Sort team members based on the captured newDirection
        setTeamMembers((prevMembers) => {
            const sortedMembers = [...prevMembers].sort((a, b) => {
                if (field === 'email') {
                    return newDirection === 'asc' ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email);
                }
                return 0;
            });
            return sortedMembers;
        });
    };

   

    if (isLoading) {
        return <CustomizedProgressBar />;
    }

    return (
        <Box>
            {pendingInvitations.length > 0 && (
                <Box sx={{ marginBottom: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 3 }}>
                        <Typography variant="h6" className='first-sub-title' sx={{
                            lineHeight: '22px !important'
                        }}>Pending invitations</Typography>
                        <CustomTooltip title={"The Settings menu allows you to customise your user experience, manage your account preferences, and adjust notifications."} linkText="Learn more" linkUrl="https://maximiz.ai" />
                    </Box>

                    <TableContainer sx={{
                        border: '1px solid #EBEBEB',
                        borderRadius: '4px 4px 0px 0px'
                    }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        className='table-heading'
                                        sx={{
                                            ...teamsStyles.tableColumn,
                                            position: 'sticky', // Make the Name column sticky
                                            left: 0, // Stick it to the left
                                            zIndex: 9,
                                            background: '#fff'
                                        }}>Invited User</TableCell>
                                    <TableCell className='table-heading' sx={teamsStyles.tableColumn}>Access Level</TableCell>
                                    <TableCell className='table-heading' sx={teamsStyles.tableColumn}>Date Invited</TableCell>
                                    <TableCell className='table-heading' sx={teamsStyles.tableColumn}>Status</TableCell>
                                    <TableCell className='table-heading' sx={teamsStyles.tableColumn}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pendingInvitations.length === 0 ? (
                                    <TableRow>
                                        <TableCell className='table-data' colSpan={5} sx={{
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
                                            <TableCell className="sticky-cell table-data" sx={{
                                                ...teamsStyles.tableBodyColumn,
                                                cursor: 'pointer', position: 'sticky', left: '0', zIndex: 9, backgroundColor: '#fff'
                                            }}>{invitation.email}</TableCell>
                                            <TableCell className='table-data' sx={teamsStyles.tableBodyColumn}>{invitation.role}</TableCell>
                                            <TableCell className='table-data' sx={teamsStyles.tableBodyColumn}>{invitation.date}</TableCell>
                                            <TableCell className='table-data' sx={teamsStyles.tableBodyColumn}>
                                                <Typography component="span" className='table-data' sx={{
                                                    background: '#ececec',
                                                    padding: '6px 8px',
                                                    borderRadius: '2px',
                                                    lineHeight: '16px !important'
                                                }}>
                                                    {invitation.status}
                                                </Typography>
                                            </TableCell>
                                            <TableCell className='table-data' sx={teamsStyles.tableBodyColumn}>
                                                <Button className='table-data'
                                                    onClick={() => handleRevokePopupOpen(invitation.email)}
                                                    // onClick={() => {
                                                    //     const confirmed = window.confirm('Are you sure you want to revoke this invitation?');
                                                    //     if (confirmed) {
                                                    //         handleRevoke(invitation.email);
                                                    //     }
                                                    // }}
                                                    sx={{
                                                        lineHeight: '16px !important',
                                                        position: 'relative',
                                                        textAlign: 'center',
                                                        textTransform: 'none',
                                                        '&:hover': {
                                                            background: 'transparent'
                                                        }
                                                    }}
                                                >
                                                    Revoke
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
            <Divider sx={{ borderColor: '#e4e4e4' }} />

            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 3.75, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Typography variant="h6" className='first-sub-title' sx={{
                            lineHeight: '22px !important'
                        }}>Team members</Typography>
                        <Typography variant='h6' className='table-data' sx={{
                            background: '#EDEDF7',
                            borderRadius: '4px',
                            padding: '4px 6px',
                            lineHeight: '16px !important'
                        }}>
                            {memberCount}/{memberLimit} Member limit
                        </Typography>
                        <CustomTooltip title={"Team Info"} linkText="Learn more" linkUrl="https://maximiz.ai" />
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
                                <TableCell className='table-heading' sx={{
                                    ...teamsStyles.tableColumn,
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 9,
                                    background: '#fff',
                                    textAlign: 'left'
                                }}
                                onClick={() => handleSort('email')}
                                >User
                                    <IconButton sx={{ padding: 0, background: 'none', marginLeft: '90px' }}>
                                        <Image
                                            src={
                                                sortField === 'email' && sortDirection === 'asc'
                                                    ? '/user-sort-icon.svg'
                                                    : '/user-sort-icon.svg'
                                            }
                                            alt='sort icon'
                                            height={12} 
                                            width={12}
                                        />
                                    </IconButton>
                                </TableCell>

                                <TableCell className='table-heading' sx={teamsStyles.tableColumn}>Last signed-in</TableCell>
                                <TableCell className='table-heading' sx={teamsStyles.tableColumn}>Access level</TableCell>
                                <TableCell className='table-heading' sx={teamsStyles.tableColumn}>Invited by</TableCell>
                                <TableCell className='table-heading' sx={teamsStyles.tableColumn}>Added on</TableCell>
                                <TableCell className='table-heading' sx={teamsStyles.tableColumn}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {teamMembers.length === 0 ? (
                                <TableRow sx={teamsStyles.tableBodyRow}>
                                    <TableCell className='table-data' colSpan={5} sx={{
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
                                        onClick={() => handleRowClick(member.email)}
                                    >
                                        <TableCell
                                            className="sticky-cell table-data"
                                            sx={{
                                                ...teamsStyles.tableBodyColumn,
                                                cursor: 'pointer',
                                                position: 'sticky',
                                                left: '0',
                                                zIndex: 9,
                                                backgroundColor: '#fff',
                                                textAlign: 'left',
                                            }}
                                        >
                                            {member.email}
                                        </TableCell>

                                        <TableCell className='table-data' sx={teamsStyles.tableBodyColumn}>{member.last_sign_in}</TableCell>
                                        <TableCell className='table-data' sx={teamsStyles.tableBodyColumn} onClick={(e) => handleDropdownClick(e, member.email)}>
                                            <FormControl variant="outlined" sx={{ width: '100%', position: 'relative' }}>
                                                <Select
                                                    className='second-text'
                                                    value={member.access_level}
                                                    onChange={member.access_level === "owner" ? undefined : (e) => handleSelectionChange(e, member.email)}
                                                    open={teamSelectOpen === member.email && member.access_level !== "owner"}
                                                    sx={{
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            border: 'none',
                                                        },
                                                        '& .MuiOutlinedInput-input': {
                                                            display: 'inline-block',
                                                            fontFamily: 'Roboto',
                                                            fontSize: '12px',
                                                            lineHeight: '16px',
                                                            color: '#5f6368',
                                                            paddingBottom: '14px',
                                                        },
                                                        '& .MuiSelect-select': {
                                                            display: 'inline-block',
                                                            position: 'relative',
                                                            borderRadius: '0',
                                                            width: 'auto',
                                                            padding: '0 !important',
                                                            cursor: member.access_level === "owner" ? 'not-allowed' : 'pointer',
                                                            ...(member.access_level !== "owner" && {
                                                                '&:after': {
                                                                    content: '""',
                                                                    position: 'absolute',
                                                                    left: 0,
                                                                    bottom: 0,
                                                                    width: '100%',
                                                                    borderBottom: '1px dashed #51627B', // Dashed line under the text
                                                                }
                                                            })
                                                        },
                                                        '& .MuiSelect-icon': {
                                                            display: 'none',
                                                        }
                                                    }}
                                                    MenuProps={{
                                                        PaperProps: {
                                                            sx: {
                                                                minWidth: '100px !important',
                                                                border: '1px solid #e4e4e4',
                                                                '& .MuiMenuItem-root': {
                                                                    fontFamily: 'Nunito Sans',
                                                                    fontSize: '12px',
                                                                    lineHeight: '16px',
                                                                    color: '#202124',
                                                                    fontWeight: '600'
                                                                },
                                                            },
                                                        },
                                                    }}
                                                    onClick={(e) => {
                                                        if (member.access_level === "owner") {
                                                            e.stopPropagation();
                                                        }
                                                    }}
                                                >
                                                    {roleOptions.map(option => (
                                                        <MenuItem
                                                            key={option.key}
                                                            value={option.key}
                                                            sx={{ display: option.key === "owner" ? 'none' : 'block' }}
                                                        >
                                                            {option.value}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                {/* Chevron Icon Positioned Absolutely */}
                                                {teamSelectOpen === member.email && member.access_level !== "owner" && (
                                                    <span
                                                        onClick={(e) => handleArrowClick(e, member.email)}
                                                        style={{
                                                            position: 'absolute',
                                                            right: '10px',
                                                            top: '50%',
                                                            transform: 'translateY(-50%)',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <Image
                                                            src={teamSelectOpen === member.email ? '/chevron-drop-up.svg' : '/chevron-drop-down.svg'}
                                                            alt={teamSelectOpen === member.email ? 'chevron-drop-up' : 'chevron-drop-down'}
                                                            height={24}
                                                            width={24}
                                                        />
                                                    </span>
                                                )}
                                            </FormControl>
                                        </TableCell>
                                        <TableCell className='table-data' sx={teamsStyles.tableBodyColumn}>
                                            {member.invited_by || '--'}
                                        </TableCell>
                                        <TableCell className='table-data' sx={teamsStyles.tableBodyColumn}>
                                            {member.added_on || '--'}
                                        </TableCell>
                                        <TableCell className='table-data' sx={teamsStyles.tableBodyColumn}>
                                            {member.access_level !== 'owner' && (
                                                <Button className='table-data'
                                                    onClick={() => handleRemovePopupOpen(member.email)}
                                                    // onClick={() => {
                                                    //     const confirmed = window.confirm('Are you sure you want to remove this member?');
                                                    //     if (confirmed) {
                                                    //         handleRemoveMember(member.email);
                                                    //     }
                                                    // }}
                                                    
                                                    sx={{
                                                        lineHeight: '16px !important',
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
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Drawer
                anchor="right"
                open={revokePopupOpen}
                onClose={handleRevokePopupClose}
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
                    <Typography variant="h6" className='first-sub-title' sx={{ textAlign: 'center' }}>
                        Confirm Revoke
                    </Typography>
                    <IconButton onClick={handleRevokePopupClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 5, height: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Image src='/delete-card-icon.svg' alt='delete-card-icon' width={403} height={403} />
                        <Typography className='second-sub-title' sx={{
                            fontWeight: '600 !important',
                            lineHeight: '20px !important',
                            color: '#4a4a4a !important',
                            marginBottom: '20px'
                        }}>
                            Revoke detail
                        </Typography>
                        <Typography className='paragraph' sx={{
                            lineHeight: '16px !important',
                            color: '#5f6368 !important'
                        }}>
                            Are you sure you want to revoke this invitation?
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
                                <Button className="hyperlink-red" onClick={handleRevokePopupClose} sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#5052b2 !important',
                                    marginRight: '16px',
                                    textTransform: 'none',
                                    padding: '10px 24px'
                                }}>
                                    Cancel
                                </Button>
                                <Button className="hyperlink-red" onClick={() => {
                                        if (selectedEmail) {
                                            handleRevoke(selectedEmail); // Use the selected email for revoking
                                        }
                                        handleRevokePopupClose(); // Close the drawer after revoking
                                    }} sx={{
                                    background: '#5052B2',
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#fff !important',
                                    textTransform: 'none',
                                    padding: '10px 24px',
                                    '&:hover': {
                                        color: '#5052B2 !important'
                                    }
                                }}>
                                    Revoke
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>

            </Drawer>

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
                    <Typography variant="h6" className='first-sub-title' sx={{ textAlign: 'center' }}>
                        Confirm Remove
                    </Typography>
                    <IconButton onClick={handleRemovePopupClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 5, height: '100%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Image src='/delete-card-icon.svg' alt='delete-card-icon' width={403} height={403} />
                        <Typography className='second-sub-title' sx={{
                            fontWeight: '600 !important',
                            lineHeight: '20px !important',
                            color: '#4a4a4a !important',
                            marginBottom: '20px'
                        }}>
                            Delete
                        </Typography>
                        <Typography className='paragraph' sx={{
                            lineHeight: '16px !important',
                            color: '#5f6368 !important'
                        }}>
                            Are you sure you want to remove this member?
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
                                <Button className="hyperlink-red" onClick={handleRemovePopupClose} sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#5052b2 !important',
                                    marginRight: '16px',
                                    textTransform: 'none',
                                    padding: '10px 24px'
                                }}>
                                    Cancel
                                </Button>
                                <Button className="hyperlink-red" onClick={() => {
                                        if (selectedMemberEmail) {
                                            handleRemoveMember(selectedMemberEmail); // Use the selected email for revoking
                                        }
                                        handleRemovePopupClose(); // Close the drawer after revoking
                                    }} sx={{
                                    background: '#5052B2',
                                    borderRadius: '4px',
                                    border: '1px solid #5052b2',
                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                    color: '#fff !important',
                                    textTransform: 'none',
                                    padding: '10px 24px',
                                    '&:hover': {
                                        color: '#5052B2 !important'
                                    }
                                }}>
                                    Delete
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>

            </Drawer>

        </Box>
    );
};
