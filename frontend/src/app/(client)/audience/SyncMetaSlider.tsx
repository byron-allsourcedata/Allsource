import React, { useState, useRef, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, TextField, Divider, FormGroup, FormControlLabel, FormControl, FormLabel, Radio, Collapse, Checkbox, Button, List, ListItem, Link, Tab, Tooltip, Switch, RadioGroup, InputLabel, MenuItem, Select, Dialog, DialogActions, DialogContent, DialogTitle, Popover, Menu, SelectChangeEvent, ListItemText, ClickAwayListener, InputAdornment, Grid } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Image from 'next/image';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import LinearProgress from '@mui/material/LinearProgress';
import { useIntegrationContext } from '@/context/IntegrationContext';
import CustomTooltip from '@/components/customToolTip';


interface ConnectMetaPopupProps {
    open: boolean;
    onClose: () => void;
    data: any
}

interface adAccount {
    id: string
    name: string
}

interface MetaAuidece {
    id: string
    list_name: string
}

const ConnectMeta: React.FC<ConnectMetaPopupProps> = ({ open, onClose, data }) => {
    const { triggerSync } = useIntegrationContext();
    const [value, setValue] = React.useState('1');
    const [listID, setListID] = useState<string>('')
    const [checked, setChecked] = useState(false);
    const [selectedRadioValue, setSelectedRadioValue] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedOption, setSelectedOption] = useState<MetaAuidece | null>(null);
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
    const [newListName, setNewListName] = useState<string>('');
    const [tagName, setTagName] = useState<string>('');
    const [isShrunk, setIsShrunk] = useState<boolean>(false);
    const textFieldRef = useRef<HTMLDivElement>(null);
    const textFieldRefAdAccount = useRef<HTMLDivElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const [isDropdownValid, setIsDropdownValid] = useState(false);
    const [listNameError, setListNameError] = useState(false);
    const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
    const [newMapListName, setNewMapListName] = useState<string>('');
    const [showCreateMapForm, setShowCreateMapForm] = useState<boolean>(false);
    const [maplistNameError, setMapListNameError] = useState(false);
    const [loading, setLoading] = useState(true)
    const [adAccounts, setAdAccounts] = useState<adAccount[]>([])
    const [optionAdAccount, setOptionAdAccount] = useState<adAccount | null>(null)
    const [metaAuidence, setMetaAuidence] = useState<MetaAuidece[]>([])
    const [tab2Error, setTab2Error] = useState(false)
    const [UpdateKlaviuo, setUpdateKlaviuo] = useState<any>(null);
    const [anchorElAdAccount, setAnchorElAdAccount] = useState<null | HTMLElement>(null);
    const [isDropdownOpenAdAccount, setIsDropdownOpenAdAccount] = useState(false);

    useEffect(() => {
        const fetchAdAccount = async () => {
            if (open) {
                setLoading(true);
                try {
                    const response = await axiosInstance.get('/integrations/sync/ad_accounts');
                    if (response.status === 200) {
                        setAdAccounts(response.data);
                    }
                }
                finally {
                    setLoading(false);
                }
            } else {
                resetToDefaultValues();
            }
        };

        fetchAdAccount();
    }, [open]);


    const handleClickAdAccount = (event: React.MouseEvent<HTMLInputElement>) => {
        setIsShrunk(true)
        setAnchorElAdAccount(event.currentTarget);
        setIsDropdownOpenAdAccount(true);
    };
    const handleCloseAdAccount = () => {
        setAnchorElAdAccount(null);
        setIsDropdownOpenAdAccount(false);
    };

    useEffect(() => {
        const getList = async () => {
            setLoading(true)
            const response = await axiosInstance.get('/integrations/sync/list/', {
                params: {
                    service_name: 'meta',
                    ad_account_id: optionAdAccount?.id
                }
            })
            if (response.status === 200) {
                setMetaAuidence(response.data)
                const foundItem = response.data?.find((item: any) => item.list_name === data?.name);
                if (foundItem) {
                    setUpdateKlaviuo(data.id)
                    setSelectedOption({
                        id: foundItem.id,
                        list_name: foundItem.list_name
                    });
                } else {
                    setSelectedOption(null);
                }
                setSelectedRadioValue(data?.type);

            }
            setLoading(false)
        }
        if (optionAdAccount) {
            getList()
        }
    }, [optionAdAccount])


    const createNewList = async () => {
        const newListResponse = await axiosInstance.post('/integrations/sync/list/', {
            name: selectedOption?.list_name,
            ad_account_id: optionAdAccount?.id
        }, {
            params: {
                service_name: 'meta'
            }
        });
        if (newListResponse.status == 201 && newListResponse.data.terms_link && newListResponse.data.terms_accepted == false) {
            showErrorToast('User has not accepted the Custom Audience Terms.')
            window.open(newListResponse.data.terms_link, '_blank');
            return
        }
        if (newListResponse.status !== 201) {
            throw new Error('Failed to create a new tags')
        }

        return newListResponse.data;
    };


    // Handle click outside to unshrink the label if input is empty
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (textFieldRef.current && !textFieldRef.current.contains(event.target as Node)) {
                // If clicked outside, reset shrink only if there is no input value
                if (selectedOption?.list_name === '') {
                    setIsShrunk(false);
                }
                if (isDropdownOpen) {
                    setIsDropdownOpen(false); // Close dropdown when clicking outside
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedOption]);

    // Handle menu open
    const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
        setIsShrunk(true);
        setIsDropdownOpen(prev => !prev);
        setAnchorEl(event.currentTarget);
        setShowCreateForm(false); // Reset form when menu opens
    };

    // Handle dropdown toggle specifically when clicking on the arrow
    const handleDropdownToggle = (event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent triggering the input field click
        setIsDropdownOpen(prev => !prev);
        setAnchorEl(textFieldRef.current);
    };

    const handleDropdownToggleAdAccount = (event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent triggering the input field click
        setIsDropdownOpenAdAccount(prev => !prev);
        setAnchorElAdAccount(textFieldRefAdAccount.current);
    };

    const handleConnectToFacebook = () => { }
    // Handle menu close
    const handleClose = () => {
        setAnchorEl(null);
        setAnchorElAdAccount(null)
        setIsDropdownOpenAdAccount(false)
        setShowCreateForm(false);
        setIsDropdownOpen(false);
        setNewListName(''); // Clear new list name when closing
    };

    const handleSelectAdAccount = async (value: any) => {
        setOptionAdAccount(value);
        handleClose();
        // setIsDropdownValid(value.naem !== '');
    }

    // Handle option selection
    const handleSelectOption = (value: MetaAuidece | string) => {
        if (value === 'createNew') {
            setShowCreateForm(prev => !prev);
            if (!showCreateForm) {
                setAnchorEl(textFieldRef.current);
            }
        } else if (isKlaviyoList(value)) {
            // Проверка, является ли value объектом KlaviyoList
            setSelectedOption({
                id: value.id,
                list_name: value.list_name
            });
            setIsDropdownValid(true);
            handleClose();
        } else {
            setIsDropdownValid(false);
            setSelectedOption(null);
        }
    };

    const isKlaviyoList = (value: any): value is MetaAuidece => {
        return value !== null &&
            typeof value === 'object' &&
            'id' in value &&
            'list_name' in value;
    };


    // Handle Save action for the create new list form
    const handleSave = async () => {
        let valid = true;

        // Validate List Name
        if (newListName.trim() === '') {
            setListNameError(true);
            valid = false;
        } else {
            setListNameError(false);
        }


        if (valid) {
            const newKlaviyoList = { id: '-1', list_name: newListName }
            setSelectedOption(newKlaviyoList);
            if (isKlaviyoList(newKlaviyoList)) {
                setIsDropdownValid(true);
            }
            handleClose();
        }
    };


    const metaStyles = {
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
                color: '#0000FF',
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
                    borderColor: '#0000FF',
                },
            },
            '&+.MuiFormHelperText-root': {
                marginLeft: '0',
            },
        },
    }



    const handleDropdownClose = () => {
        setOpenDropdown(null); // Reset when dropdown closes
    };


    const handleNextTab = async () => {
        if (value === '1') {
            setValue((prevValue) => String(Number(prevValue) + 1));
        }
        if (value === '2') {
            // Validate Tab 3
            if (isDropdownValid) {
                // Proceed to next tab
                setValue((prevValue) => String(Number(prevValue) + 1));
            }
        }
    };

    const deleteOpen = Boolean(deleteAnchorEl);
    const deleteId = deleteOpen ? 'delete-popover' : undefined;


    const handleSaveSync = async () => {
        setLoading(true);
        let list: MetaAuidece | null = null;
        try {
            if (selectedOption && selectedOption.id === '-1') {
                list = await createNewList();
            } else if (selectedOption) {
                list = selectedOption;
            } else {
                showToast('Please select a valid option.');
                return;
            }

            if (UpdateKlaviuo) {
                const response = await axiosInstance.put(`/data-sync/sync`, {
                    integrations_users_sync_id: UpdateKlaviuo,
                    list_id: list?.id,
                    list_name: list?.list_name,
                    leads_type: selectedRadioValue,
                }, {
                    params: {
                        service_name: 'meta'
                    }
                });
                if (response.status === 201 || response.status === 200) {
                    resetToDefaultValues();
                    onClose();
                    showToast('Data sync updated successfully');
                }
            } else {
                const response = await axiosInstance.post('/data-sync/sync', {
                    list_id: list?.id,
                    list_name: list?.list_name,
                    leads_type: selectedRadioValue,
                }, {
                    params: {
                        service_name: 'meta'
                    }
                });
                if (response.status === 201 || response.status === 200) {
                    resetToDefaultValues();
                    onClose();
                    showToast('Data sync created successfully');
                    triggerSync();
                }
            }


        } finally {
            setLoading(false);
        }
    };


    const resetToDefaultValues = () => {
        setValue('1');
        setListID('');
        setChecked(false);
        setSelectedRadioValue('');
        setAnchorEl(null);
        setSelectedOption(null);
        setShowCreateForm(false);
        setNewListName('');
        setTagName('');
        setIsShrunk(false);
        setIsDropdownOpen(false);
        setOpenDropdown(null);
        setIsDropdownValid(false);
        setListNameError(false);
        setDeleteAnchorEl(null);
        setSelectedRowId(null);
        setNewMapListName('');
        setShowCreateMapForm(false);
        setMapListNameError(false);
        setLoading(false);
        setOptionAdAccount(null)
        setSelectedOption(null)
    };
    const handleChangeTab = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };
    const handlePopupClose = () => {
        resetToDefaultValues()
        onClose()
    }

    return (
        <>
            {loading && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1400,
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ width: '100%', top: 0, height: '100vh' }}>
                        <LinearProgress sx={{}} />
                    </Box>
                </Box>
            )}
            <Drawer
                anchor="right"
                open={open}
                onClose={handlePopupClose}
                PaperProps={{
                    sx: {
                        width: '620px',
                        position: 'fixed',
                        zIndex: 1300,
                        top: 0,
                        bottom: 0,
                        // msOverflowStyle: 'none',
                        // scrollbarWidth: 'none',
                        // '&::-webkit-scrollbar': {
                        //     display: 'none',
                        // },
                        '@media (max-width: 600px)': {
                            width: '100%',
                        }
                    },
                }}
                slotProps={{
                    backdrop: {
                        sx: {
                            backgroundColor: 'rgba(0, 0, 0, 0)'
                        }
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.85, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                    <Typography variant="h6" className='first-sub-title' sx={{ textAlign: 'center' }}>
                        Audience Sync to Meta
                    </Typography>
                    <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                        <Link href="https://maximizai.zohodesk.eu/portal/en/kb/articles/sync-contacts-to-meta" className="main-text" 
                        target="_blank"
                        rel="noopener referrer"
                        sx={{
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: '20px',
                            color: '#5052b2',
                            textDecorationColor: '#5052b2'
                        }}>Tutorial</Link>
                        <IconButton onClick={handlePopupClose} sx={{ p: 0 }}>
                            <CloseIcon sx={{ width: '20px', height: '20px' }} />
                        </IconButton>
                    </Box>
                </Box>
                <Box sx={{
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: '100%',
                    '@media (max-width: 480px)': {
                        height: 'auto'
                    }
                }}>
                    <Box sx={{
                        width: '100%', padding: '16px 24px 24px 24px', position: 'relative', height: '100%', marginBottom: '100px',
                        '@media (max-width: 480px)': {
                            height: 'auto'
                        }
                    }}>
                        <TabContext value={value}>
                            <Box sx={{ pb: 4 }}>
                                <TabList centered aria-label="Tabs"
                                    TabIndicatorProps={{ sx: { backgroundColor: "#5052b2" } }}
                                    sx={{
                                        "& .MuiTabs-scroller": {
                                            overflowX: 'auto !important',
                                        },
                                        "& .MuiTabs-flexContainer": {
                                            justifyContent: 'center',
                                            '@media (max-width: 600px)': {
                                                gap: '16px'
                                            }
                                        }
                                    }} onChange={handleChangeTab}>

                                    <Tab label="Add audience" value="1" className='tab-heading' sx={{ ...metaStyles.tabHeading }} />
                                </TabList>
                            </Box>
                            <TabPanel value="1" sx={{ p: 0 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 3 }}>
                                            <Image src='/meta-icon.svg' alt='meta-icon' height={24} width={36} />
                                            <Typography variant="h6" className='first-sub-title'>Sync audience</Typography>
                                            <CustomTooltip title={'New audiences become available each Monday and are automatically synced to your integrated platform'} />
                                        </Box>
                                        <ClickAwayListener onClickAway={handleClose}>
                                            <>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                    <TextField
                                                        ref={textFieldRefAdAccount}
                                                        variant="outlined"
                                                        value={
                                                            optionAdAccount?.name || null // Установить значение по умолчанию на пустую строку
                                                        }
                                                        onClick={handleClickAdAccount}
                                                        size="small"

                                                        fullWidth
                                                        label={optionAdAccount?.name ? '' : 'Select Ad Account'}
                                                        InputLabelProps={{
                                                            shrink: isShrunk || optionAdAccount?.name !== "", // Shrinks label if clicked or if value is not empty
                                                            sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '15px',
                                                                lineHeight: '16px',
                                                                color: 'rgba(17, 17, 19, 0.60)',

                                                                padding: 0,
                                                                margin: 0,
                                                                left: '3px',
                                                                '&.Mui-focused': {
                                                                    color: '#0000FF',
                                                                },
                                                            }
                                                        }}
                                                        InputProps={{
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton onClick={handleDropdownToggleAdAccount} edge="end">
                                                                        {isDropdownOpenAdAccount ? <Image src='/chevron-drop-up.svg' alt='chevron-drop-up' height={24} width={24} /> : <Image src='/chevron-drop-down.svg' alt='chevron-drop-down' height={24} width={24} />}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            ),
                                                            sx: metaStyles.formInput
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
                                                            marginBottom: '24px'

                                                        }}
                                                    />
                                                    <Menu
                                                        anchorEl={anchorElAdAccount}
                                                        open={Boolean(anchorElAdAccount) && isDropdownOpenAdAccount}
                                                        onClose={handleCloseAdAccount}
                                                        PaperProps={{
                                                            sx: {
                                                                width: anchorElAdAccount ? `${anchorElAdAccount.clientWidth}px` : '538px', borderRadius: '4px',
                                                                border: '1px solid #e4e4e4'
                                                            }, // Match dropdown width to input
                                                        }}
                                                        sx={{

                                                        }}
                                                    >
                                                        {/* Show static options */}
                                                        {adAccounts?.map((adAccount) => (
                                                            <MenuItem key={adAccount.id} onClick={() => handleSelectAdAccount(adAccount)} sx={{
                                                                '&:hover': {
                                                                    background: 'rgba(80, 82, 178, 0.10)'
                                                                }
                                                            }}>
                                                                <ListItemText primary={adAccount.name} primaryTypographyProps={{
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
                                                <Box>
                                                    <TextField
                                                        ref={textFieldRef}
                                                        variant="outlined"
                                                        value={selectedOption?.list_name}
                                                        onClick={handleClick}
                                                        size="small"
                                                        fullWidth
                                                        label={selectedOption ? '' : 'Select or Create custom audience list'}
                                                        InputLabelProps={{
                                                            shrink: selectedOption ? false : isShrunk,
                                                            sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                color: 'rgba(17, 17, 19, 0.60)',
                                                            }
                                                        }}
                                                        InputProps={{

                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton onClick={handleDropdownToggle} edge="end">
                                                                        {isDropdownOpen ? <Image src='/chevron-drop-up.svg' alt='chevron-drop-up' height={24} width={24} /> : <Image src='/chevron-drop-down.svg' alt='chevron-drop-down' height={24} width={24} />}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            ),
                                                            sx: metaStyles.formInput
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
                                                    >
                                                        {/* Show "Create New List" option */}
                                                        <MenuItem onClick={() => handleSelectOption('createNew')} sx={{
                                                            borderBottom: showCreateForm ? "none" : "1px solid #cdcdcd",
                                                            '&:hover': {
                                                                background: 'rgba(80, 82, 178, 0.10)'
                                                            }
                                                        }}>
                                                            <ListItemText primary={`+ Create new list`} primaryTypographyProps={{
                                                                sx: {
                                                                    fontFamily: "Nunito Sans",
                                                                    fontSize: "14px",
                                                                    color: showCreateForm ? "#5052B2" : "#202124",
                                                                    fontWeight: "500",
                                                                    lineHeight: "20px",

                                                                }
                                                            }} />
                                                        </MenuItem>

                                                        {/* Show Create New List form if 'showCreateForm' is true */}
                                                        {showCreateForm && (
                                                            <Box>
                                                                <Box sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: '24px',
                                                                    p: 2,
                                                                    width: anchorEl ? `${anchorEl.clientWidth}px` : '538px',
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
                                                                                    fontWeight: '400',
                                                                                    color: 'rgba(17, 17, 19, 0.60)',
                                                                                    '&.Mui-focused': {
                                                                                        color: '#0000FF',
                                                                                    },
                                                                                }
                                                                            }}
                                                                            InputProps={{

                                                                                endAdornment: (
                                                                                    newListName && ( // Conditionally render close icon if input is not empty
                                                                                        <InputAdornment position="end">
                                                                                            <IconButton
                                                                                                edge="end"
                                                                                                onClick={() => setNewListName('')} // Clear the text field when clicked
                                                                                            >
                                                                                                <Image
                                                                                                    src='/close-circle.svg'
                                                                                                    alt='close-circle'
                                                                                                    height={18}
                                                                                                    width={18} // Adjust the size as needed
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
                                                                                            borderColor: '#0000FF',
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


                                                                {/* Add a Divider to separate form from options */}
                                                                <Divider sx={{ borderColor: '#cdcdcd' }} />
                                                            </Box>
                                                        )}

                                                        {/* Show static options */}
                                                        {metaAuidence && metaAuidence.map((klaviyo, option) => (
                                                            <MenuItem key={klaviyo.id} onClick={() => handleSelectOption(klaviyo)} sx={{
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
                                            </>
                                        </ClickAwayListener>
                                    </Box>
                                </Box>
                            </TabPanel>
                        </TabContext>
                        {/* Button based on selected tab */}

                    </Box>
                    
                        <Box sx={{
                            px: 2, py: 3.5, position: 'fixed', bottom: 0, right: 0, background: '#fff',
                            width: '620px',
                            '@media (max-width: 600px)': {
                                width: '100%',
                            }
                        }}>
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>

                            <Button
                        variant="contained"
                        onClick={handleNextTab}
                        disabled={!isDropdownValid}
                        sx={{
                            backgroundColor: '#5052B2',
                            fontFamily: "Nunito Sans",
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: '20px',
                            letterSpacing: 'normal',
                            color: "#fff",
                            textTransform: 'none',
                            padding: '10px 24px',
                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                            '&:hover': {
                                backgroundColor: '#5052B2'
                            },
                            borderRadius: '4px',
                        }}
                    >
                        Next
                    </Button>
                            </Box>
                        </Box>
                    
                </Box>

            </Drawer>
        </>
    );
};
export default ConnectMeta;