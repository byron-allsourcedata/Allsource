import { Box, IconButton, ClickAwayListener, Button, ListItemText, TextField,
    InputAdornment, MenuItem, Menu, Divider} from '@mui/material';
import React, { useState, useRef } from 'react';
import Image from 'next/image';

type KlaviyoList = {
    id: string
    list_name: string
}

interface MailchimpContactSyncTabProps { 
    selectedOptionMailchimp: KlaviyoList | null
    setSelectedOptionMailchimp: (state: KlaviyoList | null) => void
    klaviyoList: KlaviyoList[]
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
            color: 'rgba(80, 82, 178, 1)',
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

const MailchimpContactSyncTab: React.FC<MailchimpContactSyncTabProps> = ({ selectedOptionMailchimp, setSelectedOptionMailchimp, klaviyoList }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [newListName, setNewListName] = useState<string>('');
    const [showCreateFormMailchimp, setShowCreateFormMailchimp] = useState<boolean>(false);
    const [listNameError, setListNameError] = useState(false);
    const [isShrunkMailchimp, setIsShrunkMailchimp] = useState<boolean>(false);
    const [anchorElMailchimp, setAnchorElMailchimp] = useState<null | HTMLElement>(null);
    const textFieldRefMailchimp = useRef<HTMLDivElement>(null);
    const [isDropdownValid, setIsDropdownValid] = useState(false);

    const handleSelectOptionMailchimp = (value: KlaviyoList | string) => {
        if (value === 'createNew') {
            setShowCreateFormMailchimp(prev => !prev);
            if (!showCreateFormMailchimp) {
                setAnchorElMailchimp(textFieldRefMailchimp.current);
            }
        } else if (isKlaviyoList(value)) {
            
            setSelectedOptionMailchimp({
                id: value.id,
                list_name: value.list_name
            });
            setIsDropdownValid(true);
            handleCloseSelectMailchimp();
        } else {
            setIsDropdownValid(false);
            setSelectedOptionMailchimp(null);
        }
    };


    const handleClickMailchimp = (event: React.MouseEvent<HTMLInputElement>) => {
        setIsShrunkMailchimp(true);
        setIsDropdownOpen(prev => !prev);
        setAnchorElMailchimp(event.currentTarget);
        setShowCreateFormMailchimp(false); 
    };

    const handleCloseSelectMailchimp = () => {
        setAnchorElMailchimp(null);
        setShowCreateFormMailchimp(false);
        setIsDropdownOpen(false);
        setNewListName(''); 
    };

    const isKlaviyoList = (value: KlaviyoList | string): value is KlaviyoList => {
        return value !== null &&
            typeof value === 'object' &&
            'id' in value &&
            'list_name' in value;
    };

    const handleDropdownToggleMailchimp = (event: React.MouseEvent) => {
        event.stopPropagation(); 
        setIsDropdownOpen(prev => !prev);
        setAnchorElMailchimp(textFieldRefMailchimp.current);
    };

    const handleSave = async () => {
        let valid = true;

        
        if (newListName.trim() === '') {
            setListNameError(true);
            valid = false;
        } else {
            setListNameError(false);
        }

        
        if (valid) {
            const newKlaviyoList = { id: '-1', list_name: newListName }
            setSelectedOptionMailchimp(newKlaviyoList);
            if (isKlaviyoList(newKlaviyoList)) {
                setIsDropdownValid(true);
            }
            handleCloseSelectMailchimp();
        }
    };

    
    return (
        <ClickAwayListener onClickAway={handleCloseSelectMailchimp}>
            <Box>
                <TextField
                    ref={textFieldRefMailchimp}
                    variant="outlined"
                    value={selectedOptionMailchimp?.list_name}
                    onClick={handleClickMailchimp}
                    size="small"
                    fullWidth
                    label={selectedOptionMailchimp ? '' : 'Select or Create new list'}
                    InputLabelProps={{
                        shrink: selectedOptionMailchimp ? false : isShrunkMailchimp,
                        sx: {
                            fontFamily: 'Nunito Sans',
                            fontSize: '12px',
                            lineHeight: '16px',
                            color: 'rgba(17, 17, 19, 0.60)',
                            letterSpacing: '0.06px',
                            top: '5px',
                            '&.Mui-focused': {
                                color: 'rgba(80, 82, 178, 1)',
                            },
                        }
                    }}
                    InputProps={{

                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={handleDropdownToggleMailchimp} edge="end">
                                    {isDropdownOpen ? <Image src='/chevron-drop-up.svg' alt='chevron-drop-up' height={24} width={24} /> : <Image src='/chevron-drop-down.svg' alt='chevron-drop-down' height={24} width={24} />}
                                </IconButton>
                            </InputAdornment>
                        ),
                        sx: styles.formInput
                    }}
                    sx={{
                        '& input': {
                            caretColor: 'transparent',
                            fontFamily: "Nunito Sans",
                            fontSize: "14px",
                            color: "rgba(0, 0, 0, 0.89)",
                            fontWeight: "600",
                            lineHeight: "normal",
                        },
                        '& .MuiOutlinedInput-input': {
                            cursor: 'default', 
                            top: '5px'
                        },

                    }}
                />

                <Menu
                    anchorEl={anchorElMailchimp}
                    open={Boolean(anchorElMailchimp) && isDropdownOpen}
                    onClose={handleCloseSelectMailchimp}
                    PaperProps={{
                        sx: {
                            width: anchorElMailchimp ? `${anchorElMailchimp.clientWidth}px` : '538px', borderRadius: '4px',
                            border: '1px solid #e4e4e4'
                        },
                    }}
                    sx={{

                    }}
                >
                    <MenuItem onClick={() => handleSelectOptionMailchimp('createNew')} sx={{
                        borderBottom: showCreateFormMailchimp ? "none" : "1px solid #cdcdcd",
                        '&:hover': {
                            background: 'rgba(80, 82, 178, 0.10)'
                        }
                    }}>
                        <ListItemText primary={`+ Create new list`} primaryTypographyProps={{
                            sx: {
                                fontFamily: "Nunito Sans",
                                fontSize: "14px",
                                color: showCreateFormMailchimp ? "#5052B2" : "#202124",
                                fontWeight: "500",
                                lineHeight: "20px",

                            }
                        }} />
                    </MenuItem>

                    {showCreateFormMailchimp && (
                        <Box>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '24px',
                                p: 2,
                                width: anchorElMailchimp ? `${anchorElMailchimp.clientWidth}px` : '538px',
                                pt: 0
                            }}>
                                <Box
                                    sx={{


                                        mt: 1,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        gap: '16px',
                                        '@media (max-width: 600px)': {
                                            flexDirection: 'column'
                                        },
                                    }}
                                >
                                    <TextField
                                        label="List Name"
                                        variant="outlined"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        size="small"
                                        fullWidth
                                        onKeyDown={(e) => e.stopPropagation()}
                                        error={listNameError}
                                        helperText={listNameError ? 'List Name is required' : ''}
                                        InputLabelProps={{
                                            sx: {
                                                fontFamily: 'Nunito Sans',
                                                fontSize: '12px',
                                                lineHeight: '16px',
                                                fontWeight: '400',
                                                color: 'rgba(17, 17, 19, 0.60)',
                                                '&.Mui-focused': {
                                                    color: 'rgba(80, 82, 178, 1)',
                                                },
                                            }
                                        }}
                                        InputProps={{

                                            endAdornment: (
                                                newListName && (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            edge="end"
                                                            onClick={() => setNewListName('')}
                                                        >
                                                            <Image
                                                                src='/close-circle.svg'
                                                                alt='close-circle'
                                                                height={18}
                                                                width={18}
                                                            />
                                                        </IconButton>
                                                    </InputAdornment>
                                                )
                                            ),
                                            sx: {
                                                '&.MuiOutlinedInput-root': {
                                                    height: '32px',
                                                    '& .MuiOutlinedInput-input': {
                                                        padding: '5px 16px 4px 16px',
                                                        fontFamily: 'Roboto',
                                                        color: '#202124',
                                                        fontSize: '14px',
                                                        fontWeight: '400',
                                                        lineHeight: '20px'
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#A3B0C2',
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#A3B0C2',
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'rgba(80, 82, 178, 1)',
                                                    },
                                                },
                                                '&+.MuiFormHelperText-root': {
                                                    marginLeft: '0',
                                                },
                                            }
                                        }}
                                    />
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Button variant="contained" onClick={handleSave}
                                        disabled={listNameError || !newListName}
                                        sx={{
                                            borderRadius: '4px',
                                            border: '1px solid #5052B2',
                                            background: '#fff',
                                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                            fontFamily: 'Nunito Sans',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            lineHeight: '20px',
                                            color: '#5052b2',
                                            textTransform: 'none',
                                            padding: '4px 22px',
                                            '&:hover': {
                                                background: 'transparent'
                                            },
                                            '&.Mui-disabled': {
                                                background: 'transparent',
                                                color: '#5052b2'
                                            }
                                        }}>
                                        Save
                                    </Button>
                                </Box>

                            </Box>

                            <Divider sx={{ borderColor: '#cdcdcd' }} />
                        </Box>
                    )}

                    {klaviyoList && klaviyoList.map((klaviyo) => (
                        <MenuItem key={klaviyo.id} onClick={() => handleSelectOptionMailchimp(klaviyo)} sx={{
                            '&:hover': {
                                background: 'rgba(80, 82, 178, 0.10)'
                            }
                        }}>
                            <ListItemText primary={klaviyo.list_name} primaryTypographyProps={{
                                sx: {
                                    fontFamily: "Nunito Sans",
                                    fontSize: "14px",
                                    color: "#202124",
                                    fontWeight: "500",
                                    lineHeight: "20px"
                                }
                            }} />
                        </MenuItem>
                    ))}
                </Menu>
            </Box>
        </ClickAwayListener>
    );
  };

export default MailchimpContactSyncTab;