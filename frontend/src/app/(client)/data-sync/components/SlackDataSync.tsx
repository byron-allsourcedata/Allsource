import React, { useState, useRef, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, TextField, Divider, FormControlLabel, FormControl, FormLabel, Radio, Button, Link, Tab, Tooltip, RadioGroup, MenuItem, Popover, Menu, ListItemText, ClickAwayListener, InputAdornment, Grid, LinearProgress, Checkbox } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Image from 'next/image';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from '../../../../components/ToastNotification';
import { useIntegrationContext } from "@/context/IntegrationContext";

interface ConnectSlackPopupProps {
    open: boolean;
    onClose: () => void;
    data: any;
    isEdit: boolean;
}

type ChannelList = {
    id: string;
    name: string;
}

interface CustomField {
    type: string;
    value: string;
}


const SlackDataSync: React.FC<ConnectSlackPopupProps> = ({ open, onClose, data, isEdit }) => {
    const { triggerSync } = useIntegrationContext();
    const [loading, setLoading] = useState(false)
    const [value, setValue] = React.useState('1');
    const [selectedRadioValue, setSelectedRadioValue] = useState(data?.type);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedOption, setSelectedOption] = useState<ChannelList | null>(null);
    const [listName, setlistName] = useState<string | null>(data?.name ?? '');
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
    const [newListName, setNewListName] = useState<string>('');
    const [isShrunk, setIsShrunk] = useState<boolean>(false);
    const textFieldRef = useRef<HTMLDivElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [apiKeyError, setApiKeyError] = useState(false);
    const [tab2Error, setTab2Error] = useState(false);
    const [isDropdownValid, setIsDropdownValid] = useState(false);
    const [listNameError, setListNameError] = useState(false);
    const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
    const [newMapListName, setNewMapListName] = useState<string>('');
    const [showCreateMapForm, setShowCreateMapForm] = useState<boolean>(false);
    const [UpdateKlaviuo, setUpdateKlaviuo] = useState<any>(null);
    const [maplistNameError, setMapListNameError] = useState(false);
    const [slackList, setSlackList] = useState<ChannelList[]>([])
    const [listNameErrorMessage, setListNameErrorMessage] = useState('')
    const [customFieldsList, setCustomFieldsList] = useState<CustomField[]>([]);
    const [savedList, setSavedList] = useState<ChannelList | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (textFieldRef.current && !textFieldRef.current.contains(event.target as Node)) {
                if (selectedOption?.name === '') {
                    setIsShrunk(false);
                }
                if (isDropdownOpen) {
                    setIsDropdownOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedOption]);


    const [customFields, setCustomFields] = useState<{ type: string, value: string }[]>([]);

    useEffect(() => {
        if (data?.data_map) {
            setCustomFields(data?.data_map);
        } else {
            setCustomFields(customFieldsList.map(field => ({ type: field?.value, value: field?.type })))
        }
    }, [open])

    const handleDeleteField = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const handleChangeField = (index: number, field: string, value: string) => {

        setCustomFields(customFields.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };
    useEffect(() => {
        if (open) { return }
        setLoading(false);
        setValue('1');
        setSelectedRadioValue('');
        setAnchorEl(null);
        setSelectedOption(null);
        setlistName('')
        setShowCreateForm(false);
        setNewListName('');
        setIsShrunk(false);
        setIsDropdownOpen(false);
        setApiKeyError(false);
        setTab2Error(false);
        setIsDropdownValid(false);
        setListNameError(false);
        setDeleteAnchorEl(null);
        setSelectedRowId(null);
        setNewMapListName('');
        setShowCreateMapForm(false);
        setMapListNameError(false);
    }, [open])

    const getChannelList = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/slack/get-channels')
            if (response.data.status === 'authentication_failed') {
                showErrorToast('Key authentication failed')
                onClose();
                return
            }
            setSlackList(response.data.channels || [])
            const foundItem = response.data?.channel.find((item: any) => item.name === data?.channel.name);
            if (foundItem) {
                setUpdateKlaviuo(data.id)
                setSelectedOption({
                    id: foundItem.id,
                    name: foundItem.name
                });
                setlistName(foundItem.name)
            } else {
                setSelectedOption(null);
            }
            setSelectedRadioValue(data?.type);
        } catch (error) { }
        finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        if (open && !data) {
            getChannelList()
        }
    }, [open])

    const createNewList = async () => {
        try {
            setLoading(true)
            const newListResponse = await axiosInstance.post('/slack/create-channel', {
                name: selectedOption?.name
            }
            );


            if (newListResponse.data.status !== 'SUCCESS') {
                showErrorToast('Error when trying to create new list')
            }

            return newListResponse.data.channel;
        }
        finally {
            setLoading(false)
        }
    }

    const handleSaveList = async () => {
        setLoading(true);
        try {
            let list: ChannelList | null = null;
            if (selectedOption && selectedOption.id === '-1') {
                list = await createNewList();
            } else if (selectedOption) {
                list = selectedOption;
            } else {
                if (!listName) {
                    showToast('Please select a valid option.');
                    return;
                }
            }
            if (validateTab2()) {
                setValue((prevValue) => String(Number(prevValue) + 1));
            }
            setSavedList(list);
            showToast('List saved successfully');
        } catch (error) {
            console.error('Error saving list:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSync = async () => {
        setLoading(true);
        try {
            if (isEdit) {
                const response = await axiosInstance.put('/data-sync/sync', {
                    integrations_users_sync_id: data.id,
                    leads_type: selectedRadioValue,
                    data_map: customFields
                }, {
                    params: { service_name: 'slack' }
                });

                if (response.status === 201 || response.status === 200) {
                    onClose();
                    showToast('Data sync updated successfully');
                    triggerSync();
                }
            } else {
                const response = await axiosInstance.post('/data-sync/sync', {
                    list_id: savedList?.id,
                    list_name: savedList?.name,
                    leads_type: selectedRadioValue,
                    data_map: customFields
                }, {
                    params: { service_name: 'slack' }
                });

                if (response.status === 201 || response.status === 200) {
                    onClose();
                    showToast('Data sync created successfully');
                    triggerSync();
                }
            }
        } catch (error) {
            console.error('Error during sync:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
        setIsShrunk(true);
        setIsDropdownOpen(prev => !prev);
        setAnchorEl(event.currentTarget);
        setShowCreateForm(false);
    };

    const handleDropdownToggle = (event: React.MouseEvent) => {
        event.stopPropagation();
        setIsDropdownOpen(prev => !prev);
        setAnchorEl(textFieldRef.current);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setShowCreateForm(false);
        setIsDropdownOpen(false);
        setNewListName('');
    };

    const handleSelectOption = (value: ChannelList | string) => {
        if (value === 'createNew') {
            setShowCreateForm(prev => !prev);
            if (!showCreateForm) {
                setAnchorEl(textFieldRef.current);
            }
        } else if (isKlaviyoList(value)) {
            setSelectedOption({
                id: value.id,
                name: value.name,
            });
            setlistName(value.name)
            setIsDropdownValid(true);
            handleClose();
        } else {
            setIsDropdownValid(false);
            setSelectedOption(null);
        }
    };

    const isKlaviyoList = (value: any): value is ChannelList => {
        return value !== null &&
            typeof value === 'object' &&
            'id' in value &&
            'name' in value;
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
            const newSlackList = { id: '-1', name: newListName }
            setSelectedOption(newSlackList);
            setlistName(newSlackList.name)
            if (isKlaviyoList(newSlackList)) {
                setIsDropdownValid(true);
            }
            handleClose();
        }
    };

    const klaviyoStyles = {
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
                color: 'rgba(56, 152, 252, 1)',
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

    const getButton = (tabValue: string) => {
        switch (tabValue) {
            case '1':
                return (
                    <Button
                        variant="contained"
                        onClick={handleNextTab}
                        disabled={!selectedRadioValue}
                        sx={{
                            backgroundColor: 'rgba(56, 152, 252, 1)',
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
                                backgroundColor: 'rgba(56, 152, 252, 1)'
                            },
                            borderRadius: '4px',
                        }}
                    >
                        Next
                    </Button>
                );
            case '2':
                return (
                    <Button
                        variant="contained"
                        disabled={!selectedOption && !listName}
                        onClick={handleSaveList}
                        sx={{
                            backgroundColor: 'rgba(56, 152, 252, 1)',
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
                                backgroundColor: 'rgba(56, 152, 252, 1)'
                            },
                            borderRadius: '4px',
                        }}
                    >
                        Save
                    </Button>
                );
            case '3':
                return (
                    <Button
                        variant="contained"
                        onClick={handleSaveSync}
                        disabled={!listName && !selectedRadioValue.trim()}
                        sx={{
                            backgroundColor: 'rgba(56, 152, 252, 1)',
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
                                backgroundColor: 'rgba(56, 152, 252, 1)'
                            },
                            borderRadius: '4px',
                        }}
                    >
                        Export
                    </Button>
                );
            default:
                return null;
        }
    };

    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedRadioValue(event.target.value);
    };

    interface Row {
        id: number;
        type: string;
        value: string;
        selectValue?: string;
        canDelete?: boolean;
    }

    const defaultRows: Row[] = [
        { id: 1, type: 'LinkedIn URL', value: 'LinkedIn URL' },
        { id: 2, type: 'Full name', value: 'Full name' },
        { id: 3, type: 'Title', value: 'Title (Job Title)' },
        { id: 4, type: 'Company', value: 'Company' },
        { id: 5, type: 'Detail', value: 'Detail (They show company detail Number of Employee| Revenue| Industry)' },
        { id: 6, type: 'Email', value: 'Email (Business email)' },
        { id: 7, type: 'Visited URL', value: 'Visited URL (Which page user visited on the user website)' },
        { id: 8, type: 'Location', value: 'Location' }
    ];

    const [rows, setRows] = useState<Row[]>(defaultRows);

    const handleMapListChange = (id: number, field: 'value' | 'type', value: string) => {
        setRows(rows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const handleDeleteClose = () => {
        setDeleteAnchorEl(null);
        setSelectedRowId(null);
    };

    const validateTab2 = () => {
        if (selectedRadioValue === null) {
            setTab2Error(true);
            return false;
        }
        setTab2Error(false);
        return true;
    };

    const handleNewListChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        const isValid = /^[а-яА-Яa-zA-Z0-9-_]*$/.test(value);

        if (isValid) {
            if (slackList?.some(list => list.name === value)) {
                setListNameError(true);
                setListNameErrorMessage('List name must be unique');
            } else {
                setListNameError(false);
                setListNameErrorMessage('');
            }
            setNewListName(value);
        } else {
            setListNameError(true);
            setListNameErrorMessage('Only alphanumeric characters are allowed and no spaces.');
        }

        if (!value) {
            setListNameError(true);
            setListNameErrorMessage('List name is required');
        }
    };

    const handleNextTab = async () => {

        if (value === '1') {
            setValue((prevValue) => {
                const nextValue = String(Number(prevValue) + 1);
                return nextValue;
            })
        }
        else if (value === '2') {
            if (validateTab2()) {
                setValue((prevValue) => String(Number(prevValue) + 1));
            }
        } else if (value === '3') {
            if (isDropdownValid) {
                setValue((prevValue) => String(Number(prevValue) + 1));
            }
        }
    };

    const deleteOpen = Boolean(deleteAnchorEl);

    const handleChangeTab = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };

    const handlePopupClose = () => {
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
                        <LinearProgress />
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
                slotProps={{
                    backdrop: {
                        sx: {
                            backgroundColor: 'rgba(0, 0, 0, 0)'
                        }
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.85, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                    <Typography variant="h6" className="first-sub-title" sx={{ textAlign: 'center' }}>
                        Connect to Slack
                    </Typography>
                    <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                        <Link href="https://maximizai.zohodesk.eu/portal/en/kb/articles/up" className="main-text" sx={{
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: '20px',
                            color: 'rgba(56, 152, 252, 1)',
                            textDecorationColor: 'rgba(56, 152, 252, 1)'
                        }}>Tutorial</Link>
                        <IconButton onClick={handlePopupClose} sx={{ p: 0 }}>
                            <CloseIcon sx={{ width: '20px', height: '20px' }} />
                        </IconButton>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                    <Box sx={{ width: '100%', padding: '16px 24px 24px 24px', position: 'relative' }}>
                        <TabContext value={value}>
                            <Box sx={{ pb: 4 }}>
                                <TabList centered aria-label="Connect to Slack Tabs"
                                    TabIndicatorProps={{ sx: { backgroundColor: "rgba(56, 152, 252, 1)" } }}
                                    sx={{
                                        "& .MuiTabs-scroller": {
                                            overflowX: 'auto !important',
                                        },
                                        "& .MuiTabs-flexContainer": {
                                            justifyContent: 'center',
                                            '@media (max-width: 600px)': {
                                                gap: '16px',
                                                justifyContent: 'flex-start'
                                            }
                                        }
                                    }} onChange={handleChangeTab}>
                                    <Tab label="Sync Filter" value="1" className='tab-heading' sx={klaviyoStyles.tabHeading} />
                                    <Tab label="Contact Sync" value="2" className='tab-heading' sx={klaviyoStyles.tabHeading} />
                                    <Tab label="Map data" value="3" className='tab-heading' sx={klaviyoStyles.tabHeading} />
                                </TabList>
                            </Box>
                            <TabPanel value="1" sx={{ p: 0 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <Typography variant="subtitle1" className='paragraph'>Synchronise all data in real-time from this moment forward for seamless integration and continuous updates.</Typography>
                                        <FormControl sx={{ gap: '16px' }} error={tab2Error}>
                                            <FormLabel id="contact-type-radio-buttons-group-label" className='first-sub-title' sx={{
                                                '&.Mui-focused': {
                                                    color: '#000',
                                                    transform: 'none !important'
                                                }
                                            }}>Filter by Contact type</FormLabel>
                                            <RadioGroup
                                                aria-labelledby="contact-type-radio-buttons-group-label"
                                                name="contact-type-row-radio-buttons-group"
                                                value={selectedRadioValue}
                                                onChange={handleRadioChange}
                                            >
                                                <FormControlLabel value="allContacts" control={<Radio sx={{
                                                    color: '#e4e4e4',
                                                    '&.Mui-checked': {
                                                        color: 'rgba(56, 152, 252, 1)', // checked color
                                                    }

                                                }} />} label="All Contacts"
                                                    componentsProps={{
                                                        typography: {
                                                            sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '14px',
                                                                fontWeight: '500',
                                                                color: '#000',
                                                                lineHeight: 'normal',
                                                                opacity: selectedRadioValue === 'allContacts' ? 1 : 0.43,
                                                                '@media (max-width:440px)': {
                                                                    fontSize: '12px'
                                                                }
                                                            },
                                                        },
                                                    }}
                                                    sx={{
                                                        '@media (max-width:600px)': {
                                                            flexBasis: 'calc(50% - 8px)'
                                                        }
                                                    }}
                                                />
                                                <FormControlLabel value="visitor" control={<Radio sx={{
                                                    color: '#e4e4e4',
                                                    '&.Mui-checked': {
                                                        color: 'rgba(56, 152, 252, 1)', // checked color
                                                    }
                                                }} />} label="Visitors"
                                                    componentsProps={{
                                                        typography: {
                                                            sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '14px',
                                                                fontWeight: '500',
                                                                color: '#000',
                                                                lineHeight: 'normal',
                                                                opacity: selectedRadioValue === 'visitors' ? 1 : 0.43,
                                                                '@media (max-width:440px)': {
                                                                    fontSize: '12px'
                                                                }
                                                            },
                                                        },
                                                    }}
                                                    sx={{
                                                        '@media (max-width:600px)': {
                                                            flexBasis: 'calc(50% - 8px)'
                                                        }
                                                    }}
                                                />
                                                <FormControlLabel value="viewed_product" control={<Radio sx={{
                                                    color: '#e4e4e4',
                                                    '&.Mui-checked': {
                                                        color: 'rgba(56, 152, 252, 1)', // checked color
                                                    }
                                                }} />} label="View Product"
                                                    componentsProps={{
                                                        typography: {
                                                            sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '14px',
                                                                fontWeight: '500',
                                                                color: '#000',
                                                                lineHeight: 'normal',
                                                                opacity: selectedRadioValue === 'viewProduct' ? 1 : 0.43,
                                                                '@media (max-width:440px)': {
                                                                    fontSize: '12px'
                                                                }
                                                            },
                                                        },
                                                    }}
                                                    sx={{
                                                        '@media (max-width:600px)': {
                                                            flexBasis: 'calc(50% - 8px)'
                                                        }
                                                    }}
                                                />
                                                <FormControlLabel value="abandoned_cart" control={<Radio sx={{
                                                    color: '#e4e4e4',
                                                    '&.Mui-checked': {
                                                        color: 'rgba(56, 152, 252, 1)', // checked color
                                                    }
                                                }} />} label="Abandoned cart"
                                                    componentsProps={{
                                                        typography: {
                                                            sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '14px',
                                                                fontWeight: '500',
                                                                color: '#000',
                                                                lineHeight: 'normal',
                                                                opacity: selectedRadioValue === 'addToCart' ? 1 : 0.43,
                                                                '@media (max-width:440px)': {
                                                                    fontSize: '12px'
                                                                }
                                                            },
                                                        },
                                                    }}
                                                    sx={{
                                                        '@media (max-width:600px)': {
                                                            flexBasis: 'calc(50% - 8px)'
                                                        }
                                                    }}
                                                />
                                                <FormControlLabel value="converted_sales" control={<Radio sx={{
                                                    color: '#e4e4e4',
                                                    '&.Mui-checked': {
                                                        color: 'rgba(56, 152, 252, 1)', // checked color
                                                    }
                                                }} />} label="Converted Sales"
                                                    componentsProps={{
                                                        typography: {
                                                            sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '14px',
                                                                fontWeight: '500',
                                                                color: '#000',
                                                                lineHeight: 'normal',
                                                                opacity: selectedRadioValue === 'addToCart' ? 1 : 0.43,
                                                                '@media (max-width:440px)': {
                                                                    fontSize: '12px'
                                                                }
                                                            },
                                                        },
                                                    }}
                                                    sx={{
                                                        '@media (max-width:600px)': {
                                                            flexBasis: 'calc(50% - 8px)'
                                                        }
                                                    }}
                                                />
                                            </RadioGroup>
                                        </FormControl>
                                    </Box>
                                </Box>
                            </TabPanel>
                            <TabPanel value="2" sx={{ p: 0 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 3 }}>
                                            <Image src='/slack-icon.svg' alt='Slack' height={26} width={32} />
                                            <Typography variant="h6" className='first-sub-title'>Contact sync</Typography>
                                            <Tooltip title="Sync data with list" placement="right">
                                                <Image src='/baseline-info-icon.svg' alt='baseline-info-icon' height={16} width={16} />
                                            </Tooltip>
                                        </Box>


                                        <ClickAwayListener onClickAway={() => { }}>
                                            <Box>
                                                <TextField
                                                    ref={textFieldRef}
                                                    variant="outlined"
                                                    value={listName}
                                                    disabled={data}
                                                    onClick={handleClick}
                                                    size="small"
                                                    fullWidth
                                                    label={listName ? '' : 'Select or Create new list'}
                                                    InputLabelProps={{
                                                        shrink: listName ? false : isShrunk,
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
                                                                {
                                                                    !data ? (
                                                                        <IconButton onClick={handleDropdownToggle} edge="end">
                                                                            {isDropdownOpen ? <Image src='/chevron-drop-up.svg' alt='chevron-drop-up' height={24} width={24} /> : <Image src='/chevron-drop-down.svg' alt='chevron-drop-down' height={24} width={24} />}
                                                                        </IconButton>
                                                                    ) : ''
                                                                }
                                                            </InputAdornment>
                                                        ),
                                                        sx: klaviyoStyles.formInput
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
                                                    {/* Show "Create New List" option */}
                                                    <MenuItem disabled={data} onClick={() => handleSelectOption('createNew')} sx={{
                                                        borderBottom: showCreateForm ? "none" : "1px solid #cdcdcd",
                                                        '&:hover': {
                                                            background: 'rgba(80, 82, 178, 0.10)'
                                                        }
                                                    }}>
                                                        <ListItemText primary={`+ Create new list`} primaryTypographyProps={{
                                                            sx: {
                                                                fontFamily: "Nunito Sans",
                                                                fontSize: "14px",
                                                                color: showCreateForm ? "rgba(56, 152, 252, 1)" : "#202124",
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


                                                                        mt: 1, // Margin-top to separate form from menu item
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'space-between',
                                                                        gap: '16px',
                                                                        '@media (max-width: 600px)': {
                                                                            flexDirection: 'column'
                                                                        },
                                                                    }}
                                                                >
                                                                    <TextField
                                                                        label="Channel Name"
                                                                        variant="outlined"
                                                                        value={newListName}
                                                                        onChange={handleNewListChange}
                                                                        size="medium"
                                                                        fullWidth
                                                                        onKeyDown={(e) => e.stopPropagation()}
                                                                        error={listNameError}
                                                                        helperText={listNameErrorMessage}
                                                                        InputLabelProps={{
                                                                            sx: {
                                                                                fontFamily: 'Nunito Sans',
                                                                                fontSize: '14px',
                                                                                top: '-5px',
                                                                                left: '3px',
                                                                                lineHeight: '16px',
                                                                                fontWeight: '400',
                                                                                color: 'rgba(17, 17, 19, 0.60)',
                                                                                '&.Mui-focused': {
                                                                                    color: '#0000FF',
                                                                                    top: 0
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
                                                                            border: '1px solid rgba(56, 152, 252, 1)',
                                                                            background: '#fff',
                                                                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                                            fontFamily: 'Nunito Sans',
                                                                            fontSize: '14px',
                                                                            fontWeight: '600',
                                                                            lineHeight: '20px',
                                                                            color: 'rgba(56, 152, 252, 1)',
                                                                            textTransform: 'none',
                                                                            padding: '4px 22px',
                                                                            '&:hover': {
                                                                                background: 'transparent'
                                                                            },
                                                                            '&.Mui-disabled': {
                                                                                background: 'transparent',
                                                                                color: 'rgba(56, 152, 252, 1)'
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
                                                    {slackList && slackList?.map((klaviyo) => (
                                                        <MenuItem key={klaviyo.id} onClick={() => handleSelectOption(klaviyo)} sx={{
                                                            '&:hover': {
                                                                background: 'rgba(80, 82, 178, 0.10)'
                                                            }
                                                        }}>
                                                            <ListItemText primary={klaviyo.name} primaryTypographyProps={{
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

                                    </Box>
                                </Box>
                            </TabPanel>
                            <TabPanel value="3" sx={{ p: 0 }}>
                                <Box sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #f0f0f0',
                                    boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)',
                                    padding: '16px 24px',
                                    overflowX: 'auto'
                                }}>
                                    <Box sx={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                        <Typography variant="h6" className='first-sub-title'>Map list</Typography>
                                        {selectedOption?.name &&
                                            <Typography variant='h6' sx={{
                                                background: '#EDEDF7',
                                                borderRadius: '3px',
                                                fontFamily: 'Roboto',
                                                fontSize: '12px',
                                                fontWeight: '400',
                                                color: '#5f6368',
                                                padding: '2px 4px',
                                                lineHeight: '16px'
                                            }}>
                                                {selectedOption?.name}
                                            </Typography>}
                                    </Box>

                                    <Grid container alignItems="center" sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' }, marginBottom: '14px' }}>
                                        <Grid item xs="auto" sm={5} sx={{
                                            textAlign: 'center',
                                            '@media (max-width:599px)': {
                                                minWidth: '196px'
                                            }
                                        }}>
                                            <Image src='/logo.svg' alt='logo' height={15} width={24} />
                                        </Grid>
                                        <Grid item xs="auto" sm={1} sx={{
                                            '@media (max-width:599px)': {
                                                minWidth: '50px'
                                            }
                                        }}>&nbsp;</Grid>
                                        <Grid item xs="auto" sm={5} sx={{
                                            textAlign: 'center',
                                            '@media (max-width:599px)': {
                                                minWidth: '196px'
                                            }
                                        }}>
                                            <Image src='/slack-icon.svg' alt='Slack' height={20} width={24} />
                                        </Grid>
                                        <Grid item xs="auto" sm={1}>&nbsp;</Grid>
                                    </Grid>

                                    {defaultRows.map((row, index) => (
                                        <Box key={row.id} sx={{ mb: 2 }}> {/* Add margin between rows */}
                                            <Grid container spacing={2} alignItems="center" sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' } }}>
                                                {/* Left Input Field */}
                                                <Grid item xs="auto" sm={5}>
                                                    <TextField
                                                        fullWidth
                                                        variant="outlined"
                                                        disabled={true}
                                                        value={row.value}
                                                        onChange={(e) => handleMapListChange(row.id, 'value', e.target.value)}
                                                        InputLabelProps={{
                                                            sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '12px',
                                                                lineHeight: '16px',
                                                                color: 'rgba(17, 17, 19, 0.60)',
                                                                top: '-5px',
                                                                '&.Mui-focused': {
                                                                    color: '#0000FF',
                                                                    top: 0
                                                                },
                                                                '&.MuiInputLabel-shrink': {
                                                                    top: 0
                                                                }
                                                            }
                                                        }}
                                                        InputProps={{

                                                            sx: {
                                                                '&.MuiOutlinedInput-root': {
                                                                    height: '36px',
                                                                    '& .MuiOutlinedInput-input': {
                                                                        padding: '6.5px 8px',
                                                                        fontFamily: 'Roboto',
                                                                        color: '#202124',
                                                                        fontSize: '12px',
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
                                                </Grid>
                                                {/* Middle Icon Toggle (Right Arrow or Close Icon) */}
                                                <Grid item xs="auto" sm={1} container justifyContent="center">
                                                    {row.selectValue !== undefined ? (
                                                        row.selectValue ? (
                                                            <Image
                                                                src='/chevron-right-purple.svg'
                                                                alt='chevron-right-purple'
                                                                height={18}
                                                                width={18} // Adjust the size as needed
                                                            />

                                                        ) : (
                                                            <Image
                                                                src='/close-circle.svg'
                                                                alt='close-circle'
                                                                height={18}
                                                                width={18} // Adjust the size as needed
                                                            />
                                                        )
                                                    ) : (
                                                        <Image
                                                            src='/chevron-right-purple.svg'
                                                            alt='chevron-right-purple'
                                                            height={18}
                                                            width={18} // Adjust the size as needed
                                                        /> // For the first two rows, always show the right arrow
                                                    )}
                                                </Grid>

                                                {/* Right Side Input or Dropdown */}
                                                <Grid item xs="auto" sm={5}>
                                                    <TextField
                                                        fullWidth
                                                        variant="outlined"
                                                        disabled={true}
                                                        value={row.type}
                                                        onChange={(e) => handleMapListChange(row.id, 'type', e.target.value)}
                                                        InputLabelProps={{
                                                            sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '12px',
                                                                lineHeight: '16px',
                                                                color: 'rgba(17, 17, 19, 0.60)',
                                                                top: '-5px',
                                                                '&.Mui-focused': {
                                                                    color: '#0000FF',
                                                                    top: 0
                                                                },
                                                                '&.MuiInputLabel-shrink': {
                                                                    top: 0
                                                                }
                                                            }
                                                        }}
                                                        InputProps={{

                                                            sx: {
                                                                '&.MuiOutlinedInput-root': {
                                                                    height: '36px',
                                                                    '& .MuiOutlinedInput-input': {
                                                                        padding: '6.5px 8px',
                                                                        fontFamily: 'Roboto',
                                                                        color: '#202124',
                                                                        fontSize: '12px',
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
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    ))}
                                    <Box sx={{ mb: 2 }}>
                                        {customFields.map((field, index) => (
                                            <Grid container spacing={2} alignItems="center" sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' } }} key={index}>
                                                <Grid item xs="auto" sm={5} mb={2}>
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        variant="outlined"
                                                        label='Custom Field'
                                                        value={field.type}
                                                        onChange={(e) => handleChangeField(index, 'type', e.target.value)}
                                                        InputLabelProps={{
                                                            sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '12px',
                                                                lineHeight: '16px',
                                                                color: 'rgba(17, 17, 19, 0.60)',
                                                                top: '-5px',
                                                                '&.Mui-focused': {
                                                                    color: '#0000FF',
                                                                    top: 0
                                                                },
                                                                '&.MuiInputLabel-shrink': {
                                                                    top: 0
                                                                }
                                                            }
                                                        }}
                                                        InputProps={{
                                                            sx: {
                                                                '&.MuiOutlinedInput-root': {
                                                                    height: '36px',
                                                                    '& .MuiOutlinedInput-input': {
                                                                        padding: '6.5px 8px',
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
                                                    >

                                                        {customFieldsList.map((item) => (
                                                            <MenuItem
                                                                key={item.value}
                                                                value={item.value}
                                                                disabled={customFields.some(f => f.type === item.value)}
                                                            >
                                                                {item.type}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                </Grid>
                                                <Grid item xs="auto" sm={1} mb={2} container justifyContent="center">
                                                    <Image
                                                        src='/chevron-right-purple.svg'
                                                        alt='chevron-right-purple'
                                                        height={18}
                                                        width={18}
                                                    />
                                                </Grid>
                                                <Grid item xs="auto" sm={5} mb={2}>
                                                    <TextField
                                                        fullWidth
                                                        variant="outlined"
                                                        value={field.value}
                                                        onChange={(e) => handleChangeField(index, 'value', e.target.value)}
                                                        placeholder="Enter value"
                                                        InputLabelProps={{
                                                            sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '12px',
                                                                lineHeight: '16px',
                                                                color: 'rgba(17, 17, 19, 0.60)',
                                                                top: '-5px',
                                                                '&.Mui-focused': {
                                                                    color: '#0000FF',
                                                                    top: 0,
                                                                },
                                                                '&.MuiInputLabel-shrink': {
                                                                    top: 0,
                                                                },
                                                            },
                                                        }}
                                                        InputProps={{
                                                            sx: {
                                                                height: '36px',
                                                                '& .MuiOutlinedInput-input': {
                                                                    padding: '6.5px 8px',
                                                                    fontFamily: 'Roboto',
                                                                    color: '#202124',
                                                                    fontSize: '14px',
                                                                    fontWeight: '400',
                                                                    lineHeight: '20px',
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
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid item xs="auto" mb={2} sm={1} container justifyContent="center">
                                                    <IconButton onClick={() => handleDeleteField(index)}>
                                                        <Image
                                                            src='/trash-icon-filled.svg'
                                                            alt='trash-icon-filled'
                                                            height={18}
                                                            width={18}
                                                        />
                                                    </IconButton>
                                                </Grid>
                                            </Grid>
                                        ))}
                                    </Box>
                                </Box>
                            </TabPanel>
                        </TabContext>
                        {/* Button based on selected tab */}

                    </Box>
                    <Box sx={{ px: 2, py: 2, width: '100%', borderTop: '1px solid #e4e4e4' }}>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>

                            {getButton(value)}
                        </Box>
                    </Box>
                </Box>

            </Drawer>
        </>
    );
};
export default SlackDataSync;