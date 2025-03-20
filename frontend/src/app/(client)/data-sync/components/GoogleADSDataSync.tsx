import React, { useState, useRef, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, TextField, Divider, FormControlLabel, FormControl, FormLabel, Radio, Button, Link, Tab, Tooltip, RadioGroup, MenuItem, Popover, Menu, ListItemText, ClickAwayListener, InputAdornment, Grid, LinearProgress } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Image from 'next/image';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from '../../../../components/ToastNotification';
import { useIntegrationContext } from "@/context/IntegrationContext";

interface ConnectGoogleAdsPopupProps {
    open: boolean;
    onClose: () => void;
    data: any;
    isEdit: boolean;
}

type ChannelList = {
    list_id: string;
    list_name: string;
}

type Customers = {
    customer_id: string;
    customer_name: string;
}

const GoogleAdsDataSync: React.FC<ConnectGoogleAdsPopupProps> = ({ open, onClose, data, isEdit }) => {
    const { triggerSync } = useIntegrationContext();
    const [loading, setLoading] = useState(false)
    const [value, setValue] = React.useState('1');
    const [selectedRadioValue, setSelectedRadioValue] = useState(data?.type);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedOption, setSelectedOption] = useState<ChannelList | null>(
        {
            list_id: data?.list_id ?? '',
            list_name: data?.name ?? '',
        }
        ?? null);
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
    const [newListName, setNewListName] = useState<string>(data?.name ?? '');
    const [isShrunk, setIsShrunk] = useState<boolean>(false);
    const textFieldRef = useRef<HTMLDivElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [tab2Error, setTab2Error] = useState(false);
    const [isDropdownValid, setIsDropdownValid] = useState(false);
    const [listNameError, setListNameError] = useState(false);
    const textFieldRefAdAccount = useRef<HTMLDivElement>(null);
    const [notAdsUser, setNotAdsUser] = useState<boolean>(false);
    const [anchorElAdAccount, setAnchorElAdAccount] = useState<null | HTMLElement>(null);
    const [isDropdownOpenAdAccount, setIsDropdownOpenAdAccount] = useState(false);
    const [inputCustomerName, setInputCustomerName] = useState(data?.customer_id ?? '');
    const [inputListName, setInputListName] = useState(data?.name ?? '');
    const [googleList, setGoogleAdsList] = useState<ChannelList[]>([]);

    const [customersInfo, setCustomersInfo] = useState<Customers[]>([
        {
            customer_id: data?.customer_id ?? '',
            customer_name: data?.customer_id ?? '',
        }
    ] ?? []);

    const [selectedAccountId, setSelectedAccountId] = useState<string>(data?.customer_id ?? '');
    const [listNameErrorMessage, setListNameErrorMessage] = useState('')
    const [savedList, setSavedList] = useState<ChannelList | null>({
        list_id: data?.list_id ?? '',
        list_name: data?.name ?? '',
    } ?? null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (textFieldRef.current && !textFieldRef.current.contains(event.target as Node)) {
                if (selectedOption?.list_name === '') {
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

    const handleCloseAdAccount = () => {
        setAnchorElAdAccount(null);
        setIsDropdownOpenAdAccount(false);
    };

    useEffect(() => {
        if (open) { return }
        setLoading(false);
        setValue('1');
        setSelectedRadioValue('');
        setAnchorEl(null);
        setSelectedOption(null);
        setInputListName('')
        setShowCreateForm(false);
        setNewListName('');
        setIsShrunk(false);
        setIsDropdownOpen(false);
        setTab2Error(false);
        setIsDropdownValid(false);
        setListNameError(false);
        setAnchorElAdAccount(null)
        setIsDropdownOpenAdAccount(false)
    }, [open])

    const getGoogleAdsList = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('integrations/google-ads/get-channels', {
                params: {
                    customer_id: selectedAccountId
                }
            });
            setInputListName('')
            setGoogleAdsList(response.data.user_lists || [])
            if (response.data.status !== 'SUCCESS') {
                showErrorToast(response.data.message)
            }
        } catch (error) { }
        finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        if (open && selectedAccountId && !data?.name) {
            getGoogleAdsList();
        }
    }, [open, selectedAccountId]);

    const getCustomersInfo = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('integrations/google-ads/customers-info')
            if (response.data.status === 'SUCCESS') {
                setCustomersInfo(response.data.customers || [])
            }
            else if (response.data.status === 'NOT_ADS_USER') {
                setNotAdsUser(true)
            }
            else {
                showErrorToast(response.data.message)
            }
        } catch (error) { }
        finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        if (open && !data?.customer_id) {
            getCustomersInfo()
        }
    }, [open])

    const createNewList = async () => {
        try {
            setLoading(true)
            const newListResponse = await axiosInstance.post('/integrations/sync/list/', {
                name: selectedOption?.list_name,
                customer_id: String(selectedAccountId)
            }, {
                params: {
                    service_name: 'google_ads'
                }
            });

            if (newListResponse.data.status !== 'SUCCESS') {
                showErrorToast(newListResponse.data.message)
            }

            return newListResponse.data.channel;
        }
        finally {
            setLoading(false)
        }
    }

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
                '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#5052B2',
                },
            },
            '&+.MuiFormHelperText-root': {
                marginLeft: '0',
            },
        },
    }

    const handleSaveList = async () => {
        setLoading(true);
        try {
            let list: ChannelList | null = null;

            if (selectedOption && selectedOption.list_id === '-1') {
                list = await createNewList();
            } else if (selectedOption) {
                list = selectedOption;
            } else {
                showToast('Please select a valid option.');
                return;
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
        if (!savedList) {
            showToast('No list data found. Please save the list first.');
            return;
        }

        setLoading(true);
        try {
            if (isEdit) {
                const response = await axiosInstance.put('/data-sync/sync', {
                    integrations_users_sync_id: data.id,
                    list_id: savedList.list_id,
                    list_name: savedList.list_name,
                    name: savedList.list_name,
                    leads_type: selectedRadioValue,
                }, {
                    params: { service_name: 'google_ads' }
                });

                if (response.status === 201 || response.status === 200) {
                    showToast('Data sync updated successfully');
                    triggerSync();
                    onClose();
                }
            } else {
                const response = await axiosInstance.post('/data-sync/sync', {
                    list_id: String(savedList.list_id),
                    customer_id: String(selectedAccountId),
                    list_name: savedList.list_name,
                    leads_type: selectedRadioValue,
                    data_map: rows
                }, {
                    params: { service_name: 'google_ads' }
                });

                if (response.status === 201 || response.status === 200) {
                    showToast('Data sync created successfully');
                    triggerSync();
                    onClose();
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
        setAnchorElAdAccount(null)
        setIsDropdownOpenAdAccount(false)
        setShowCreateForm(false);
        setIsDropdownOpen(false);
    };

    const handleSelectOption = (value: ChannelList | string) => {
        if (value === 'createNew') {
            setShowCreateForm(prev => !prev);
            if (!showCreateForm) {
                setAnchorEl(textFieldRef.current);
            }
        } else if (isKlaviyoList(value)) {
            setSelectedOption({
                list_id: value.list_id,
                list_name: value.list_name,
            });
            setInputListName(value.list_name)
            setIsDropdownValid(true);
            handleClose()
        } else {
            setIsDropdownValid(false);
            setSelectedOption(null);
        }
    };

    const isKlaviyoList = (value: any): value is ChannelList => {
        return value !== null &&
            typeof value === 'object' &&
            'list_id' in value &&
            'list_name' in value;
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
            const newSlackList = { list_id: '-1', list_name: newListName }
            setSelectedOption(newSlackList);
            setInputListName(newSlackList.list_name)
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
                '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#5052B2',
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
                );
            case '2':
                return (
                    <Button
                        variant="contained"
                        disabled={inputListName === "" || inputCustomerName === ""}
                        onClick={handleSaveList}
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
                        Save
                    </Button>
                );
            case '3':
                return (
                    <Button
                        variant="contained"
                        onClick={handleSaveSync}
                        disabled={!inputListName || !selectedRadioValue.trim()}
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
        { id: 1, type: 'Email', value: 'Email' },
        { id: 2, type: 'Full name', value: 'Full name' },
        { id: 3, type: 'Phone', value: 'Phone' },
        { id: 4, type: 'Address', value: 'Address' }
    ];

    const [rows, setRows] = useState<Row[]>(defaultRows);

    const handleMapListChange = (id: number, field: 'value' | 'type', value: string) => {
        setRows(rows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const handleSelectAdAccount = async (value: Customers) => {
        setInputCustomerName(value.customer_name)
        setSelectedAccountId(value.customer_id)
        handleClose();
    }

    const handleClickAdAccount = (event: React.MouseEvent<HTMLInputElement>) => {
        setIsShrunk(true)
        setAnchorElAdAccount(event.currentTarget);
        setIsDropdownOpenAdAccount(true);
    };

    const handleDropdownToggleAdAccount = (event: React.MouseEvent) => {
        event.stopPropagation();
        setIsDropdownOpenAdAccount(prev => !prev);
        setAnchorElAdAccount(textFieldRefAdAccount.current);
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
        if (googleList?.some(list => list.list_name === value)) {
            setListNameError(true);
            setListNameErrorMessage('List name must be unique');
        } else {
            setListNameError(false);
            setListNameErrorMessage('');
        }
        setNewListName(value);

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
                // Proceed to next tab
                setValue((prevValue) => String(Number(prevValue) + 1));
            }
        }
    };

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
                        Connect to GoogleAds
                    </Typography>
                    <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                        {/* <Link href="https://maximizai.zohodesk.eu/portal/en/kb/articles/up" className="main-text" sx={{
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: '20px',
                            color: '#5052b2',
                            textDecorationColor: '#5052b2'
                        }}>Tutorial</Link> */}
                        <IconButton onClick={handlePopupClose} sx={{ p: 0 }}>
                            <CloseIcon sx={{ width: '20px', height: '20px' }} />
                        </IconButton>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                    <Box sx={{ width: '100%', padding: '16px 24px 24px 24px', position: 'relative' }}>
                        {notAdsUser ?
                            <Box sx={{
                                p: 2,
                                border: '1px solid #f0f0f0',
                                borderRadius: '4px',
                                boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}>
                                <Typography variant="subtitle1" className='paragraph'>
                                    The Google account that generated the OAuth access tokens is not associated with any Ads accounts.
                                    <br />
                                    Please <strong>create a new account</strong> or add the Google account to an existing Ads account.
                                </Typography>

                                <Typography variant="body2" sx={{ color: '#5052b2', fontWeight: 'bold' }}>
                                    <Link href="https://ads.google.com/signup" target="_blank" className="main-text" sx={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        lineHeight: '20px',
                                        color: '#5052b2',
                                        textDecorationColor: '#5052b2'
                                    }}>Register for Google Ads</Link>
                                </Typography>
                            </Box>
                            :
                            <TabContext value={value}>
                                <Box sx={{ pb: 4 }}>
                                    <TabList centered aria-label="Connect to GoogleAds Tabs"
                                        TabIndicatorProps={{ sx: { backgroundColor: "#5052b2" } }}
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
                                                            color: '#5052b2',
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
                                                            color: '#5052b2',
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
                                                            color: '#5052b2',
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
                                                    <FormControlLabel value="added_to_cart" control={<Radio sx={{
                                                        color: '#e4e4e4',
                                                        '&.Mui-checked': {
                                                            color: '#5052b2',
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
                                                            color: '#5052b2',
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
                                                <Image src='/google-ads.svg' alt='webhook' height={26} width={32} />
                                                <Typography variant="h6" className='first-sub-title'>Contact sync</Typography>
                                                <Tooltip title="Sync data with list" placement="right">
                                                    <Image src='/baseline-info-icon.svg' alt='baseline-info-icon' height={16} width={16} />
                                                </Tooltip>
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                <TextField
                                                    ref={textFieldRefAdAccount}
                                                    variant="outlined"
                                                    value={inputCustomerName}
                                                    onClick={handleClickAdAccount}
                                                    size="small"
                                                    fullWidth
                                                    label={inputCustomerName ? '' : 'Select An Account'}
                                                    InputLabelProps={{
                                                        shrink: isShrunk || inputCustomerName !== "",
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
                                                                <IconButton onClick={handleDropdownToggleAdAccount} edge="end">
                                                                    {isDropdownOpenAdAccount ? <Image src='/chevron-drop-up.svg' alt='chevron-drop-up' height={24} width={24} /> : <Image src='/chevron-drop-down.svg' alt='chevron-drop-down' height={24} width={24} />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                        sx: metaStyles.formInput
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
                                                        },
                                                    }}

                                                >
                                                    {customersInfo?.map(account => (
                                                        <MenuItem key={account.customer_id} onClick={() => handleSelectAdAccount(account)} sx={{
                                                            '&:hover': {
                                                                background: 'rgba(80, 82, 178, 0.10)'
                                                            }
                                                        }}>
                                                            <ListItemText primary={account.customer_name} primaryTypographyProps={{
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
                                            <ClickAwayListener onClickAway={() => { }}>
                                                <Box>
                                                    <TextField
                                                        ref={textFieldRef}
                                                        variant="outlined"
                                                        value={inputListName}
                                                        onClick={handleClick}
                                                        disabled={data?.name}
                                                        size="small"
                                                        fullWidth
                                                        label={inputListName ? '' : 'Select or Create new list'}
                                                        InputLabelProps={{
                                                            shrink: inputListName ? false : isShrunk,
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
                                                                        {isDropdownOpen ? <Image src='/chevron-drop-up.svg' alt='chevron-drop-up' height={24} width={24} /> : <Image src='/chevron-drop-down.svg' alt='chevron-drop-down' height={24} width={24} />}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            ),
                                                            sx: klaviyoStyles.formInput
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
                                                        anchorEl={anchorEl}
                                                        open={Boolean(anchorEl) && isDropdownOpen}
                                                        onClose={handleClose}
                                                        PaperProps={{
                                                            sx: {
                                                                width: anchorEl ? `${anchorEl.clientWidth}px` : '538px', borderRadius: '4px',
                                                                border: '1px solid #e4e4e4'
                                                            },
                                                        }}
                                                        sx={{

                                                        }}
                                                    >
                                                        <MenuItem disabled={data?.name}
                                                            onClick={() => handleSelectOption('createNew')} sx={{
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
                                                                            onChange={handleNewListChange}
                                                                            size="small"
                                                                            fullWidth
                                                                            onKeyDown={(e) => e.stopPropagation()}
                                                                            error={listNameError}
                                                                            helperText={listNameErrorMessage}
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
                                                                <Divider sx={{ borderColor: '#cdcdcd' }} />
                                                            </Box>
                                                        )}
                                                        {googleList && googleList?.map((klaviyo) => (
                                                            <MenuItem key={klaviyo.list_id} onClick={() => handleSelectOption(klaviyo)} sx={{
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
                                            {inputListName &&
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
                                                    {inputListName}
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
                                                <Image src='/google-ads.svg' alt='googleAds' height={20} width={24} />
                                            </Grid>
                                            <Grid item xs="auto" sm={1}>&nbsp;</Grid>
                                        </Grid>

                                        {defaultRows.map((row, index) => (
                                            <Box key={row.id} sx={{ mb: 2 }}>
                                                <Grid container spacing={2} alignItems="center" sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' } }}>
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
                                                    <Grid item xs="auto" sm={1} container justifyContent="center">
                                                        {row.selectValue !== undefined ? (
                                                            row.selectValue ? (
                                                                <Image
                                                                    src='/chevron-right-purple.svg'
                                                                    alt='chevron-right-purple'
                                                                    height={18}
                                                                    width={18}
                                                                />

                                                            ) : (
                                                                <Image
                                                                    src='/close-circle.svg'
                                                                    alt='close-circle'
                                                                    height={18}
                                                                    width={18}
                                                                />
                                                            )
                                                        ) : (
                                                            <Image
                                                                src='/chevron-right-purple.svg'
                                                                alt='chevron-right-purple'
                                                                height={18}
                                                                width={18}
                                                            />
                                                        )}
                                                    </Grid>
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
                                    </Box>
                                </TabPanel>
                            </TabContext>
                        }
                    </Box>
                    {!notAdsUser && (
                        <Box sx={{ px: 2, py: 2, width: '100%', borderTop: '1px solid #e4e4e4' }}>
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                                {getButton(value)}
                            </Box>
                        </Box>
                    )}
                </Box>
            </Drawer>
        </>
    );
};
export default GoogleAdsDataSync;