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
                <Typography variant="h6" className='first-sub-title' sx={{ textAlign: 'center' }}>
                    Invite Users
                </Typography>
                <IconButton onClick={onClose} sx={{ p: 0 }}>
                    <CloseIcon sx={{ width: '20px', height: '20px' }} />
                </IconButton>
            </Box>
            <Box sx={{ padding: '30px 32px 0 32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <Typography variant="h6" className='first-sub-title'>
                    Invite your team to review or collaborate on this Maximiz project.
                </Typography>

                {/* <Autocomplete
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
                                    className='second-text'
                                    sx={{
                                        marginRight: 0.5,
                                        backgroundColor: '#ededf7',
                                        border: 'none',
                                        borderRadius: '3px',
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
                            autoComplete='off'
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
                                className: 'third-sub-title',
                                sx: {
                                    lineHeight: '16px !important',
                                    color: 'rgba(17, 17, 19, 0.60) !important',
                                    '&.Mui-focused': {
                                        color: '#0000FF',
                                    },
                                }
                            }}
                            sx={{
                                maxWidth: '454px',
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
                        <MenuItem className='second-text' {...props} key={option} sx={{
                            color: '#202124',
                            fontSize: '14px',
                            lineHeight: '20px'
                        }}>
                            {option}
                        </MenuItem>
                    )}
                /> */}


<Autocomplete
    multiple
    freeSolo
    options={[]} // Keep options empty to prevent predefined emails from showing up
    value={emails}
    inputValue={inputValue} // Bind the input value to the state
    onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue); // Keep track of changes to the input value
    }}
    onChange={(event, newValue) => {
        setEmails(newValue);
    }}
    renderTags={(value: readonly string[], getTagProps) =>
        value.map((option: string, index: number) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
                <Chip
                    variant="outlined"
                    label={option}
                    {...tagProps}
                    key={key}
                    deleteIcon={
                        <IconButton size="small" sx={{ padding: '4px' }}>
                            <Image
                                src="/close-clear.svg"
                                alt="close"
                                height={14}
                                width={14}
                            />
                        </IconButton>
                    }
                    className="second-text"
                    sx={{
                        marginRight: 0.5,
                        backgroundColor: '#ededf7',
                        border: 'none',
                        borderRadius: '3px',
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
            autoComplete="off"
            onKeyDown={(e) => {
                if (e.key === 'Enter' && inputValue.trim()) {
                    const emailExists = emails.some(
                        (email) => email.toLowerCase() === inputValue.trim().toLowerCase()
                    );

                    if (!emailExists) {
                        handleAddEmail(inputValue.trim());
                    }
                    setInputValue(''); // Clear the input after adding the email
                    e.preventDefault(); // Prevent the form from submitting on Enter
                }
            }}
            onBlur={() => {
                if (inputValue.trim()) {
                    const emailExists = emails.some(
                        (email) => email.toLowerCase() === inputValue.trim().toLowerCase()
                    );

                    if (!emailExists) {
                        handleAddEmail(inputValue.trim());
                    }
                    setInputValue(''); // Clear the input after adding the email
                }
            }}
            error={!!emailError}
            helperText={emailError}
            InputLabelProps={{
                className: "third-sub-title",
                sx: {
                    lineHeight: "16px !important",
                    color: "rgba(17, 17, 19, 0.60) !important",
                    "&.Mui-focused": {
                        color: "#0000FF",
                    },
                },
            }}
            sx={{
                maxWidth: "454px",
                "& .MuiOutlinedInput-root": {
                    height: 'auto !important',
                    minHeight: "48px !important",
                    padding: "5px 16px 4px 16px",
                },
                "& .MuiInputBase-input": {
                    fontFamily: "Roboto",
                    color: "#202124",
                    fontSize: "14px",
                    fontWeight: "400",
                    lineHeight: "20px",
                },
            }}
        />
    )}
    renderOption={(props, option: string) => (
        <MenuItem className="second-text" {...props} key={option} sx={{
            color: '#202124',
            fontSize: '14px',
            lineHeight: '20px'
        }}>
            {option}
        </MenuItem>
    )}
/>





                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <FormControl variant="outlined" sx={{ width: '100%', minHeight: '48px', lineHeight: 'normal' }}>
                        <InputLabel className='main-text' sx={{ fontSize: '12px', lineHeight: '16px' }}>Access level</InputLabel>
                        <Select
                            value={role}
                            onChange={handleRoleChange}
                            onOpen={handleSelectOpen}
                            onClose={handleSelectClose}
                            sx={{
                                maxWidth: '454px',
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
                                <MenuItem className='second-text' key={roleOption} value={roleOption} sx={{
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
                    <Button className='hyperlink-red' sx={{
                        border: '1px solid #5052b2',
                        borderRadius: '4px',
                        padding: '10px 24px',
                        color: '#5052b2 !important',
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