import React, { useState, useRef, useEffect } from 'react';
import { Drawer, Box, Chip, Typography, IconButton, TextField, FormControl, Button, InputLabel, MenuItem, OutlinedInput, Select, SelectChangeEvent, InputAdornment, Autocomplete, FormHelperText } from '@mui/material';
import Image from 'next/image';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/system';
import { ArrowDropDown } from '@mui/icons-material';

interface InviteUsersPopupProps {
    open: boolean;
    onClose: () => void;
    onSend: (emails: string[], role: string) => void;
}

export const InviteUsersPopup: React.FC<InviteUsersPopupProps> = ({ open, onClose, onSend }) => {
    const [emails, setEmails] = useState<string[]>([]);
    const [role, setRole] = useState<string>('');
    const roles = ['Admin', 'Read only', 'Standard'];
    const [selectOpen, setSelectOpen] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [roleError, setRoleError] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [lastAddedEmail, setLastAddedEmail] = useState('');


    const availableEmails = ['Julie@gmail.com'];

    const handleAddEmail = (email: string) => {
        const trimmedEmail = email.trim();
        if (validateEmail(trimmedEmail)) {
            setEmails(prevEmails => [...prevEmails, trimmedEmail]);
            setEmailError(null); // Reset error on valid email
        } else {
            setEmailError('Please enter a valid email address.');
        }
    };

    const validateEmail = (email: string) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };


    const handleRoleChange = (event: SelectChangeEvent) => {
        setRole(event.target.value as string);
    };

    const handleSelectOpen = () => {
        setSelectOpen(true);
    };

    const handleSelectClose = () => {
        setSelectOpen(false);
    };

    const handleSend = () => {
        setEmailError(null); // Reset error states before validation
        setRoleError(null);

        if (emails.length === 0) {
            setEmailError('At least one email is required.');
        }

        if (!role) {
            setRoleError('Role is required.');
        }
        if (emails.length > 0 && role) {
            onSend(emails, role); // Call the onSend function passed from the parent
            setEmails([]); // Reset the emails input
            setRole('');
            onClose();
        } else {
            // Optionally, handle validation errors
            console.log("Please enter emails and a role");
        }
    };


    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: '620px',
                    position: 'fixed',
                    zIndex: 1301,
                    top: 0,
                    bottom: 0,
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': {
                        display: 'none',
                    },
                    '@media (max-width: 600px)': {
                        width: '100%',
                    }
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 3.5, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                <Typography variant="h6" sx={{ textAlign: 'center', color: '#202124', fontFamily: 'Nunito Sans', fontWeight: '600', fontSize: '16px', lineHeight: 'normal' }}>
                    Invite Users
                </Typography>
                <IconButton onClick={onClose} sx={{ p: 0 }}>
                    <CloseIcon sx={{ width: '20px', height: '20px' }} />
                </IconButton>
            </Box>
            <Box sx={{ padding: '30px 32px 0 32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <Typography variant="h6" sx={{ color: '#202124', fontFamily: 'Nunito Sans', fontWeight: '600', fontSize: '16px', lineHeight: 'normal' }}>
                    Invite your team to review or collaborate on this Maxixmiz project.
                </Typography>

                <Autocomplete
                    multiple
                    freeSolo
                    options={availableEmails}
                    value={emails}
                    onChange={(event, newValue) => {
                        setEmails(newValue);
                    }}
                    renderTags={(value: readonly string[], getTagProps) =>
                        value.map((option: string, index: number) => {
                            const { key, ...tagProps } = getTagProps({ index }); // Destructure to avoid passing key in props
                            return (
                                <Chip
                                    variant="outlined"
                                    label={option}
                                    {...tagProps}
                                    key={key}
                                    deleteIcon={
                                        <IconButton size="small" sx={{ padding: '4px' }}>
                                            <Image
                                                src="/close-clear.svg" // Path to your custom close icon
                                                alt="close"
                                                height={14}
                                                width={14}
                                            />
                                        </IconButton>
                                    }
                                    sx={{
                                        marginRight: 0.5,
                                        backgroundColor: '#ededf7',
                                        border: 'none',
                                        borderRadius: '3px',
                                        fontFamily: 'Roboto',
                                        fontSize: '12px',
                                        color: '#5F6368',
                                        fontWeight: '400',
                                        lineHeight: '16px',
                                        height: 'auto',
                                        padding: '4px 6px',
                                        gap: '4px',
                                        '.MuiChip-label': {
                                            fontFamily: 'Roboto',
                                            fontSize: '12px',
                                            color: '#5F6368',
                                            fontWeight: '400',
                                            lineHeight: '16px',
                                            padding: 0,
                                        },
                                        '.MuiChip-deleteIcon': {
                                            color: '#828282',
                                            backgroundColor: 'transparent',
                                            margin: 0,
                                            width: '14px',
                                            height: '14px',
                                        },
                                    }}
                                />
                            );
                        })
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="outlined"
                            label="Emails"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && inputValue && inputValue !== lastAddedEmail) {
                                    handleAddEmail(inputValue);
                                    setLastAddedEmail(inputValue);
                                    setInputValue('');
                                }
                            }}
                            onBlur={() => {
                                if (inputValue && inputValue !== lastAddedEmail) {
                                    handleAddEmail(inputValue);
                                    setLastAddedEmail(inputValue);
                                    setInputValue('');
                                }
                            }}
                            error={!!emailError}
                            helperText={emailError}
                            InputLabelProps={{
                                sx: {
                                    fontFamily: 'Nunito Sans',
                                    fontSize: '12px',
                                    lineHeight: '16px',
                                    fontWeight: '400',
                                    color: 'rgba(17, 17, 19, 0.60)',
                                    '&.Mui-focused': {
                                        color: '#0000FF',
                                    },
                                }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    minHeight: '48px',
                                    padding: '5px 16px 4px 16px',
                                },
                                '& .MuiInputBase-input': {
                                    fontFamily: 'Roboto',
                                    color: '#202124',
                                    fontSize: '14px',
                                    fontWeight: '400',
                                    lineHeight: '20px'
                                },
                            }}
                        />

                    )}
                    renderOption={(props, option) => (
                        <MenuItem {...props} key={option} sx={{
                            fontFamily: 'Roboto',
                            color: '#202124',
                            fontSize: '14px',
                            lineHeight: '20px'
                        }}>
                            {option}
                        </MenuItem>
                    )}
                />


                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <FormControl variant="outlined" sx={{ width: '100%', minHeight: '48px', lineHeight: 'normal' }}>
                        <InputLabel sx={{ fontFamily: 'Nunito Sans', fontSize: '12px', lineHeight: '16px' }}>Access level</InputLabel>
                        <Select
                            value={role}
                            onChange={handleRoleChange}
                            onOpen={handleSelectOpen}
                            onClose={handleSelectClose}
                            sx={{
                                '& .MuiSelect-icon': {
                                    display: 'none', // Hide the default dropdown icon
                                },
                                '& .MuiOutlinedInput-input': {
                                    fontFamily: 'Roboto',
                                    color: '#202124',
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    paddingTop: '14px',
                                    paddingBottom: '14px',
                                    paddingLeft: '16px'
                                }
                            }}
                            input={
                                <OutlinedInput
                                    label="Access level"
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <Image
                                                src={selectOpen ? '/chevron-drop-up.svg' : '/chevron-drop-down.svg'}
                                                alt={selectOpen ? 'chevron-drop-up' : 'chevron-drop-down'}
                                                height={24}
                                                width={24}
                                            />
                                        </InputAdornment>
                                    }
                                />
                            }
                        >
                            {roles.map((roleOption) => (
                                <MenuItem key={roleOption} value={roleOption} sx={{
                                    fontFamily: 'Roboto',
                                    color: '#202124',
                                    fontSize: '14px',
                                    lineHeight: '20px'
                                }}>
                                    {roleOption}
                                </MenuItem>
                            ))}
                        </Select>
                        {roleError && <FormHelperText error>{roleError}</FormHelperText>}
                    </FormControl>
                    <Button sx={{
                        border: '1px solid #5052b2',
                        borderRadius: '4px',
                        padding: '10px 24px',
                        fontFamily: 'Nunito Sans',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#5052b2',
                        lineHeight: '20px',
                        textTransform: 'none',
                        height: '40px'
                    }}
                        onClick={handleSend}
                    >Send</Button>
                </Box>

            </Box>
        </Drawer>
    )
}