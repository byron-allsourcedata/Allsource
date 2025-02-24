import React, { useState, useRef, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, TextField, ToggleButtonGroup, ToggleButton, FormControlLabel, FormControl, FormLabel, Radio, Button, Link, Tab, Tooltip, RadioGroup, MenuItem, Popover, Menu, ListItemText, ClickAwayListener, InputAdornment, Grid, LinearProgress } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Image from 'next/image';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import { useIntegrationContext } from "@/context/IntegrationContext";

interface ConnectWebhookPopupProps {
    open: boolean;
    onClose: () => void;
    data: any;
    isEdit: boolean;
}

type WebhookList = {
    list_name: string
}


const WebhookDatasync: React.FC<ConnectWebhookPopupProps> = ({ open, onClose, data, isEdit }) => {
    const { triggerSync } = useIntegrationContext();
    const [loading, setLoading] = useState(false)
    const [value, setValue] = React.useState('1');
    const [checked, setChecked] = useState(false);
    const [selectedRadioValue, setSelectedRadioValue] = useState(data?.type);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedOption, setSelectedOption] = useState<WebhookList | null>(null);
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
    const [newListName, setNewListName] = useState<string>('');
    const [tagName, setTagName] = useState<string>('');
    const [isShrunk, setIsShrunk] = useState<boolean>(false);
    const textFieldRef = useRef<HTMLDivElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const [openDropdownMaximiz, setOpenDropdownMaximiz] = useState<number | null>(null)
    const [apiKeyError, setApiKeyError] = useState(false);
    const [tab2Error, setTab2Error] = useState(false);
    const [isDropdownValid, setIsDropdownValid] = useState(false);
    const [listNameError, setListNameError] = useState(false);
    const [tagNameError, setTagNameError] = useState(false);
    const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
    const [newMapListName, setNewMapListName] = useState<string>('');
    const [showCreateMapForm, setShowCreateMapForm] = useState<boolean>(false);
    const [maplistNameError, setMapListNameError] = useState(false);
    const [klaviyoList, setKlaviyoList] = useState<WebhookList[]>([])
    const [senders, setSenders] = useState<any[]>([])
    const [listNameErrorMessage, setListNameErrorMessage] = useState('')
    const [url, setUrl] = useState('');
    const [method, setMethod] = useState('GET');
    const [error, setError] = useState(false);


    const [customFieldsList, setCustomFieldsList] = useState([
    { type: 'first_name', value: 'first_name' },
    { type: 'last_name', value: 'last_name' },
    { type: 'mobile_phone', value: 'mobile_phone' },
    { type: 'direct_number', value: 'direct_number' },
    { type: 'gender', value: 'gender' },
    { type: 'personal_phone', value: 'personal_phone' },
    { type: 'business_phone', value: 'business_phone' },
    { type: 'personal_email', value: 'personal_email' },
    { type: 'personal_city', value: 'personal_city' },
    { type: 'personal_state', value: 'personal_state' },
    { type: 'company_name', value: 'company_name' },
    { type: 'company_domain', value: 'company_domain' },
    { type: 'job_title', value: 'job_title' },
    { type: 'last_updated', value: 'last_updated' },
    { type: 'age_min', value: 'age_min' },
    { type: 'age_max', value: 'age_max' },
    { type: 'personal_address', value: 'personal_address' },
    { type: 'personal_zip', value: 'personal_zip' },
    { type: 'married', value: 'married' },
    { type: 'children', value: 'children' },
    { type: 'income_range', value: 'income_range' },
    { type: 'homeowner', value: 'homeowner' },
    { type: 'dpv_code', value: 'dpv_code' },
    { type: 'time_on_site', value: 'time_on_site' },
    { type: 'url_visited', value: 'url_visited' },
    { type: 'business_phone', value: 'business_phone' },
    { type: 'business_email', value: 'business_email' },
    { type: 'linkedin_url', value: 'linkedin_url' }]);
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


    const [customFields, setCustomFields] = useState<{ type: string, value: string }[]>([]);

    useEffect(() => {
        if (data?.data_map) {
            setCustomFields(data?.data_map);
        } else {
            setCustomFields(customFieldsList.map(field => ({ type: field.value, value: field.type })))
        }
    }, [open])

    const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setUrl(value);
        setError(!isValidUrl(value));
    };

    const handleListNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewListName(event.target.value);
    };

    const handleMethodChange = (event: React.MouseEvent<HTMLElement>, newMethod: string | null) => {
        if (newMethod) {
            setMethod(newMethod);
        }
    };

    const isValidUrl = (string: string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleAddField = () => {
        setCustomFields([...customFields, { type: '', value: '' }]);
    };

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
        setOpenDropdownMaximiz(null);
        setApiKeyError(false);
        setTab2Error(false);
        setIsDropdownValid(false);
        setListNameError(false);
        setTagNameError(false);
        setDeleteAnchorEl(null);
        setSelectedRowId(null);
        setNewMapListName('');
        setShowCreateMapForm(false);
        setMapListNameError(false);
    }, [open])

    const getSender = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/integrations/sync/sender')
            setSenders(response.data)
        }
        finally {
            setLoading(false)
        }
    }

    const createNewList = async () => {
        try {
            setLoading(true)
            const newListResponse = await axiosInstance.post('/integrations/sync/list/', {
                name: newListName,
                webhook_url: url,
                method: method
            }, {
                params: {
                    service_name: 'webhook'
                }
            });
            if (newListResponse.data == 'INVALID_WEBHOOK_URL') {
                showErrorToast('Failed to connect a new webhook')
                return
            }

            return newListResponse.data;
        }
        finally {
            setLoading(false)
        }
    }

    const handleSaveSync = async () => {
        setLoading(true);
        let list = ''
        try {
            if (newListName) {
                list = await createNewList();
            } else if (newListName) {
                list = newListName;
            } else {
                showToast('Please select a valid option.');
                return;
            }
            if (isEdit) {
                const response = await axiosInstance.put(`/data-sync/sync`, {
                    list_name: newListName,
                    webhook_url: url,
                    method: method,
                    data_map: customFields
                }, {
                    params: {
                        service_name: 'webhook'
                    }
                });
                if (response.status === 201 || response.status === 200) {
                    onClose();
                    showToast('Data sync updated successfully');
                }
            } else {
                if (!list) {
                    return
                }
                handleNextTab()
                if (Number(value) != 3) { return }
                const response = await axiosInstance.post('/data-sync/sync', {
                    list_name: newListName,
                    webhook_url: url,
                    method: method,
                    leads_type: selectedRadioValue,
                    data_map: customFields
                }, {
                    params: {
                        service_name: 'webhook'
                    }
                });
                if (response.status === 201 || response.status === 200) {
                    onClose();
                    showToast('Data sync created successfully');
                    triggerSync();
                }
            }
        } finally {
            setLoading(false);
        }
    };


    // Handle menu close
    const handleClose = () => {
        setAnchorEl(null);
        setShowCreateForm(false);
        setIsDropdownOpen(false);
        setNewListName(''); // Clear new list name when closing
    };

    const isKlaviyoList = (value: any): value is WebhookList => {
        return value !== null &&
            typeof value === 'object' &&
            'id' in value &&
            'list_name' in value;
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

    type HighlightConfig = {
        [keyword: string]: { color?: string; fontWeight?: string }; // keyword as the key, style options as the value
    };

    // Define buttons for each tab
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
                        disabled={newListName == '' || url == '' || error}
                        onClick={handleSaveSync}
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
                        disabled={!selectedRadioValue.trim() || customFields.length == 0}
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

    const handleClickOpen = (event: React.MouseEvent<HTMLElement>, id: number) => {
        setDeleteAnchorEl(event.currentTarget);
        setSelectedRowId(id);
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
        const value = e.target.value
        if (klaviyoList?.some(list => list.list_name === value)) {
            setListNameError(true)
            setListNameErrorMessage('List name must be unique')
        }
        setNewListName(value)
        if (!value) {
            setListNameError(true)
            setListNameErrorMessage('List name is required')
        }
    }

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

    const deleteOpen = Boolean(deleteAnchorEl);
    const deleteId = deleteOpen ? 'delete-popover' : undefined;

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
                        Connect to Webhook
                    </Typography>
                    <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                        {/* <Link href="#" className="main-text" sx={{
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
                        <TabContext value={value}>
                            <Box sx={{ pb: 4 }}>
                                <TabList centered aria-label="Connect to Webhook Tabs"
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
                                                        color: '#5052b2', // checked color
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
                                                        color: '#5052b2', // checked color
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
                                                        color: '#5052b2', // checked color
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
                                                        color: '#5052b2', // checked color
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
                                                        color: '#5052b2', // checked color
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
                                            <Image src='/webhook-icon.svg' alt='sendlane' height={26} width={32} />
                                            <Typography variant="h6" className='first-sub-title'>Url webhook</Typography>
                                            <Tooltip title="Sync data with list" placement="right">
                                                <Image src='/baseline-info-icon.svg' alt='baseline-info-icon' height={16} width={16} />
                                            </Tooltip>
                                        </Box>
                                        <Box sx={{
                                            display: 'flex', flexDirection: 'column', gap: 2, fontFamily: 'Nunito Sans',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#000',
                                            lineHeight: 'normal',
                                            '@media (max-width:440px)': {
                                                fontSize: '12px'
                                            }
                                        }}>

                                            <TextField
                                                label="Enter Name"
                                                variant="outlined"
                                                fullWidth
                                                value={newListName}
                                                onChange={handleListNameChange}
                                            />
                                            <TextField
                                                label="Enter URL"
                                                variant="outlined"
                                                fullWidth
                                                value={url}
                                                onChange={handleUrlChange}
                                                error={error}
                                                helperText={error ? "Invalid URL" : ""}
                                            />
                                            <ToggleButtonGroup
                                                value={method}
                                                exclusive
                                                onChange={handleMethodChange}
                                                aria-label="request method"
                                            >
                                                <ToggleButton value="POST">POST</ToggleButton>
                                                <ToggleButton value="PUT">PUT</ToggleButton>
                                            </ToggleButtonGroup>
                                        </Box>
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
                                            {newListName}
                                        </Typography>
                                        <Typography variant='h6' sx={{
                                            fontFamily: 'Roboto',
                                            fontSize: '12px',
                                            fontWeight: '400',
                                            color: '#5f6368',
                                            padding: '2px 4px',
                                            lineHeight: '16px'
                                        }}>
                                            Enter the field format as it should be sent
                                        </Typography>
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
                                            <Image src='/webhook-icon.svg' alt='webhook' height={20} width={24} />
                                        </Grid>
                                        <Grid item xs="auto" sm={1}>&nbsp;</Grid>
                                    </Grid>
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
                                                                disabled={customFields.some(f => f.type === item.value)} // Дизейблим выбранные
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
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mr: 6 }}>
                                            <Button
                                                onClick={handleAddField}
                                                aria-haspopup="true"
                                                sx={{
                                                    textTransform: 'none',
                                                    border: '1px solid rgba(80, 82, 178, 1)',
                                                    borderRadius: '4px',
                                                    padding: '9px 16px',
                                                    minWidth: 'auto',
                                                    '@media (max-width: 900px)': {
                                                        display: 'none'
                                                    }
                                                }}
                                            >
                                                <Typography sx={{
                                                    marginRight: '0.5em',
                                                    fontFamily: 'Nunito Sans',
                                                    lineHeight: '22.4px',
                                                    fontSize: '16px',
                                                    textAlign: 'left',
                                                    fontWeight: '500',
                                                    color: '#5052B2'
                                                }}>
                                                    Add
                                                </Typography>
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>
                            </TabPanel>
                        </TabContext>
                        {/* Button based on selected tab */}

                    </Box>
                    <Box sx={{ px: 2, py: 2, width: '100%', border: '1px solid #e4e4e4' }}>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>

                            {getButton(value)}
                        </Box>
                    </Box>
                </Box>

            </Drawer>
        </>
    );
};
export default WebhookDatasync;