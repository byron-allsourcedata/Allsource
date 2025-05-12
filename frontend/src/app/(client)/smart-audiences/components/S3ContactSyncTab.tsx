import { Box, IconButton, ClickAwayListener, Button, ListItemText, TextField,
    InputAdornment, MenuItem, Menu, Divider} from '@mui/material';
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { showErrorToast } from '@/components/ToastNotification';


interface MailchimpContactSyncTabProps { 
    selectedOptions3: string | null
    setSelectedOptions3: (state: string | null) => void
    s3List: string[]
}

const styles = {
    tabHeading: {
        textTransform: 'none',
        padding: 0,
        minWidth: 'auto',
        px: 2,
        '@media (max-width: 600px)': {
            alignItems: 'flex-start',
            p: 0
        },
        '&.Mui-selected': {
            color: '#5052b2',
            fontWeight: '700'
        }
    },
    inputLabel: {
        fontFamily: 'Nunito Sans',
        fontSize: '12px',
        lineHeight: '16px',
        color: 'rgba(17, 17, 19, 0.60)',
        '&.Mui-focused': {
            color: 'rgba(56, 152, 252, 1)',
        },
    },
    formInput: {
        '&.MuiOutlinedInput-root': {
            height: '48px',
            '& .MuiOutlinedInput-input': {
                padding: '12px 16px 13px 16px',
                fontFamily: 'Roboto',
                color: '#202124',
                fontSize: '14px',
                lineHeight: '20px',
                fontWeight: '400'
            },
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#A3B0C2',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#A3B0C2',
                
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#5052B2',
            },
        },
        '&+.MuiFormHelperText-root': {
            marginLeft: '0',
        },
    },
}

const S3ContactSyncTab: React.FC<MailchimpContactSyncTabProps> = ({ setSelectedOptions3, selectedOptions3, s3List }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const textFieldRef = useRef<HTMLDivElement>(null);
    const [isShrunk, setIsShrunk] = useState<boolean>(false);
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isDropdownValid, setIsDropdownValid] = useState(false);

    const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
        setIsShrunk(true);
        setIsDropdownOpen(prev => !prev);
        setAnchorEl(event.currentTarget);
        setShowCreateForm(false); // Reset form when menu opens
    };

    const isKlaviyoString = (value: any): value is string => {
        return value !== null
    };

    const handleDropdownToggle = (event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent triggering the input field click
        setIsDropdownOpen(prev => !prev);
        setAnchorEl(textFieldRef.current);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setShowCreateForm(false);
        setIsDropdownOpen(false);
    };


    const handleSelectOption = (value: string) => {
        if (isKlaviyoString(value)) {
            setSelectedOptions3(value);
            setIsDropdownValid(true);
            handleClose();
        } else {
            setIsDropdownValid(false);
            setSelectedOptions3(null);
        }
    };
    
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
            <ClickAwayListener onClickAway={() => { }}>
                <Box>
                    <TextField
                        ref={textFieldRef}
                        variant="outlined"
                        value={selectedOptions3}
                        onClick={handleClick}
                        size="small"
                        fullWidth
                        label={selectedOptions3 ? '' : 'Select or Create new list'}
                        InputLabelProps={{
                            shrink: selectedOptions3 ? false : isShrunk,
                            sx: {
                                fontFamily: 'Nunito Sans',
                                fontSize: '12px',
                                lineHeight: '16px',
                                color: 'rgba(17, 17, 19, 0.60)',
                                letterSpacing: '0.06px',
                                top: '5px',
                                '&.Mui-focused': {
                                    color: '#0000FF',
                                },
                            }
                        }}
                        InputProps={{

                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleDropdownToggle} edge="end">
                                        {(
                                            isDropdownOpen ? (
                                                <Image src='/chevron-drop-up.svg' alt='chevron-drop-up' height={24} width={24} />
                                            ) : (
                                                <Image src='/chevron-drop-down.svg' alt='chevron-drop-down' height={24} width={24} />
                                            )
                                        )}
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: styles.formInput
                        }}
                        sx={{
                            '& input': {
                                caretColor: 'transparent', // Hide caret with transparent color
                                fontFamily: "Nunito Sans",
                                fontSize: "14px",
                                color: "rgba(0, 0, 0, 0.89)",
                                fontWeight: "600",
                                lineHeight: "normal",
                            },
                            '& .MuiOutlinedInput-input': {
                                cursor: 'default', // Prevent showing caret on input field
                                top: '5px'
                            },

                        }}
                    />

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl) && isDropdownOpen}
                        onClose={handleClose}
                        PaperProps={{
                            sx: {
                                width: anchorEl ? `${anchorEl.clientWidth}px` : '538px', borderRadius: '4px',
                                border: '1px solid #e4e4e4'
                            }, // Match dropdown width to input
                        }}
                        sx={{

                        }}
                    >

                        {/* Show static options */}
                        {s3List && s3List.map((klaviyo, index) => (
                            <MenuItem
                                key={klaviyo}
                                onClick={() => handleSelectOption(klaviyo)}
                                sx={{
                                    '&:hover': {
                                        background: 'rgba(80, 82, 178, 0.10)'
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={klaviyo}
                                    primaryTypographyProps={{
                                        sx: {
                                            fontFamily: "Nunito Sans",
                                            fontSize: "14px",
                                            color: "#202124",
                                            fontWeight: "500",
                                            lineHeight: "20px"
                                        }
                                    }}
                                />
                            </MenuItem>
                        ))}

                    </Menu>
                </Box>
            </ClickAwayListener>

        </Box>
        </Box>
    );
  };

export default S3ContactSyncTab;