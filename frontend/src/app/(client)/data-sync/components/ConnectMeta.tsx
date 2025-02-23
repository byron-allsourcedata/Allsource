import React, { useState, useRef, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, TextField, Divider, FormGroup, FormControlLabel, FormControl, FormLabel, Radio, Collapse, Checkbox, Button, List, ListItem, Link, Tab, Tooltip, Switch, RadioGroup, InputLabel, MenuItem, Select, Dialog, DialogActions, DialogContent, DialogTitle, Popover, Menu, SelectChangeEvent, ListItemText, ClickAwayListener, InputAdornment, Grid } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Image from 'next/image';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from '../../../../components/ToastNotification';
import LinearProgress from '@mui/material/LinearProgress';
import { useIntegrationContext } from '@/context/IntegrationContext';


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
    const [newKlaviyoList, setNewKlaviyoList] = useState()
    const [mapListOptions, setMapListOptions] = useState<string[]>([
        'Email',
        'Phone number',
        'First name',
        'Second name',
        'Gender',
        'Age',
        'Job Title',
        'Location'
    ]);

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

    // Static options
    const staticOptions = ['Email List', 'Phone List', 'SMS List', 'Maximiz Contacts', 'Preview List', 'Maximiz'];

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

    const handleMapClose = () => {
        setShowCreateMapForm(false);
        setNewMapListName(''); // Clear new list name when closing
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

    const handleSelectMapOption = (value: string, event: React.MouseEvent<HTMLElement>, id: number) => {
        event.stopPropagation(); // Prevent click event from closing the dropdown

        if (value === 'createNewField') {
            setShowCreateMapForm(prev => !prev); // Toggle form visibility

            // Ensure dropdown remains open if it was already open or if form is being opened
            if (openDropdown !== id) {
                setOpenDropdown(id); // Open dropdown if it’s not already open
            }
        } else {
            handleDropdownClose(); // Close dropdown for other selections
        }
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

    const handleMapSave = (id: number) => {
        let valid = true;

        // Validate List Name
        if (newMapListName.trim() === '') {
            setMapListNameError(true);
            valid = false;
        } else {
            setMapListNameError(false);
        }



        // If valid, save and close
        if (valid) {
            if (newMapListName.trim() === '') return; // Prevent saving empty values

            // Update the value in the rows state
            handleMapListChange(id, 'selectValue', newMapListName);

            setMapListOptions(prevOptions => [...prevOptions, newMapListName]);

            // Optionally, reset the new value state if needed
            setNewMapListName('');


            setShowCreateMapForm(false); // Close the form
            setOpenDropdown(null); // Close the dropdown if needed
            handleMapClose();
        }
    };



    const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChecked(event.target.checked);
    };

    const label = { inputProps: { 'aria-label': 'Switch demo' } };

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
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
                );
            case '3':
                return (
                    <Button
                        variant="contained"
                        onClick={handleSaveSync}
                        disabled={!selectedOption || !selectedRadioValue}
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

    /** Map List */

    // Define the Row type
    interface Row {
        id: number;
        type: string;
        value: string;
        selectValue?: string;
        canDelete?: boolean;
    }

    const defaultRows: Row[] = [
        { id: 1, type: 'Email', value: '' },
        { id: 2, type: 'Phone number', value: '' },
        { id: 3, type: 'Gender', value: 'Gender' },
        { id: 4, type: 'Last Name', value: 'Last Name' },
        { id: 5, type: 'First Name', value: 'First Name' },
        { id: 6, type: 'Personal State', value: 'Personal State' },
        { id: 7, type: 'Personal City', value: 'Personal City' },
        { id: 8, type: 'Personal Zip', value: 'Personal Zip' }
    ];
    const [rows, setRows] = useState<Row[]>(data?.data_map || defaultRows);

    // Update function with typed parameters
    const handleMapListChange = (id: number, field: 'value' | 'selectValue', value: string) => {
        setRows(rows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    // Delete function with typed parameter
    // Delete function with typed parameter
    const handleClickOpen = (event: React.MouseEvent<HTMLElement>, id: number) => {
        setDeleteAnchorEl(event.currentTarget);  // Set the current target as the anchor
        setSelectedRowId(id);  // Set the ID of the row to delete
    };

    const handleDeleteClose = () => {
        setDeleteAnchorEl(null);
        setSelectedRowId(null);
    };

    const handleDelete = () => {
        if (selectedRowId !== null) {
            setRows(rows.filter(row => row.id !== selectedRowId));
            handleDeleteClose();
        }
    };

    // Add row function
    const handleAddRow = () => {
        const newRow: Row = {
            id: Date.now(), // Unique ID for each new row
            type: 'Enter new data',
            value: '',
            selectValue: '', // Ensure selectValue is present for new rows
            canDelete: true, // This new row can be deleted
        };
        setRows([...rows, newRow]);
    };
    const handleDropdownOpen = (id: number) => {
        setOpenDropdown(id); // Set the open state for the current dropdown
    };

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
                        Connect to Meta
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

                                    <Tab label="Sync Filter" value="1" className='tab-heading' sx={{ ...metaStyles.tabHeading }} />
                                    <Tab label="Contact sync" value="2" className='tab-heading' sx={{ ...metaStyles.tabHeading }} />
                                    <Tab label="Map data" value="3" className='tab-heading' sx={{ ...metaStyles.tabHeading }} />
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
                                            <Image src='/meta-icon.svg' alt='meta-icon' height={24} width={36} />
                                            <Typography variant="h6" className='first-sub-title'>Contact sync</Typography>
                                            <Tooltip title="Sync data with list" placement="right">
                                                <Image src='/baseline-info-icon.svg' alt='baseline-info-icon' height={16} width={16} />
                                            </Tooltip>
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
                                                        label={selectedOption ? '' : 'Select or Create new list'}
                                                        InputLabelProps={{
                                                            shrink: selectedOption ? false : isShrunk,
                                                            sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '15px',
                                                                lineHeight: '16px',
                                                                color: 'rgba(17, 17, 19, 0.60)',
                                                                pl: '3px',
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


                                                                            mt: 1, // Margin-top to separate form from menu item
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
                                        {selectedOption?.list_name && <Typography variant='h6' sx={{
                                            background: '#EDEDF7',
                                            borderRadius: '3px',
                                            fontFamily: 'Roboto',
                                            fontSize: '12px',
                                            fontWeight: '400',
                                            color: '#5f6368',
                                            padding: '2px 4px',
                                            lineHeight: '16px'
                                        }}>
                                            {selectedOption?.list_name}
                                        </Typography>}
                                    </Box>

                                    <Grid container alignItems="center" sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' }, marginBottom: '14px' }}>
                                        <Grid item xs="auto" sm={5} sx={{
                                            textAlign: 'center',
                                            '@media (max-width:599px)': {
                                                minWidth: '196px'
                                            }
                                        }}>
                                            <Image src='/logo.svg' alt='logo' height={22} width={34} />
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
                                            <Image src='/meta-icon.svg' alt='meta-icon' height={20} width={30} />
                                        </Grid>
                                        <Grid item xs="auto" sm={1}>&nbsp;</Grid>
                                    </Grid>

                                    {rows.map((row, index) => (
                                        <Box key={row.id} sx={{ mb: 2 }}> {/* Add margin between rows */}
                                            <Grid container spacing={2} alignItems="center" sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' } }}>
                                                {/* Left Input Field */}
                                                <Grid item xs="auto" sm={5}>
                                                    <TextField
                                                        fullWidth
                                                        variant="outlined"
                                                        disabled={true}
                                                        // label={row.type}
                                                        value={row.type}
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
                                                <Grid item xs="auto" sm={5}>
                                                    <TextField
                                                        fullWidth
                                                        variant="outlined"
                                                        disabled={true}
                                                        value={row.type}
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


                                                {/* Delete Icon */}
                                                <Grid item xs="auto" sm={1} container justifyContent="center">
                                                    {row.canDelete && (
                                                        <>
                                                            <IconButton onClick={(event) => handleClickOpen(event, row.id)}>
                                                                <Image
                                                                    src='/trash-icon-filled.svg'
                                                                    alt='trash-icon-filled'
                                                                    height={18}
                                                                    width={18} // Adjust the size as needed
                                                                />
                                                            </IconButton>
                                                            <Popover
                                                                id={deleteId}
                                                                open={deleteOpen}
                                                                anchorEl={deleteAnchorEl}
                                                                onClose={handleDeleteClose}
                                                                anchorOrigin={{
                                                                    vertical: 'bottom',
                                                                    horizontal: 'center',
                                                                }}
                                                                transformOrigin={{
                                                                    vertical: 'top',
                                                                    horizontal: 'right',
                                                                }}
                                                            >
                                                                <Box sx={{
                                                                    minWidth: '254px',
                                                                    borderRadius: '4px',
                                                                    border: '0.2px solid #afafaf',
                                                                    background: '#fff',
                                                                    boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.12)',
                                                                    padding: '16px 21px 16px 16px'
                                                                }}>
                                                                    <Typography variant="body1" className='first-sub-title' sx={{
                                                                        paddingBottom: '12px'
                                                                    }}>Confirm Deletion</Typography>
                                                                    <Typography variant="body2" sx={{
                                                                        color: '#5f6368',
                                                                        fontFamily: 'Roboto',
                                                                        fontSize: '12px',
                                                                        fontWeight: '400',
                                                                        lineHeight: '16px',
                                                                        paddingBottom: '26px'
                                                                    }}>
                                                                        Are you sure you want to delete this <br /> map data?
                                                                    </Typography>
                                                                    <Box display="flex" justifyContent="flex-end" mt={2}>
                                                                        <Button onClick={handleDeleteClose} sx={{
                                                                            borderRadius: '4px',
                                                                            border: '1px solid #5052b2',
                                                                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                                            color: '#5052b2',
                                                                            fontFamily: 'Nunito Sans',
                                                                            fontSize: '14px',
                                                                            fontWeight: '600',
                                                                            lineHeight: '20px',
                                                                            marginRight: '16px',
                                                                            textTransform: 'none'
                                                                        }}>
                                                                            Clear
                                                                        </Button>
                                                                        <Button onClick={handleDelete} sx={{
                                                                            background: '#5052B2',
                                                                            borderRadius: '4px',
                                                                            border: '1px solid #5052b2',
                                                                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                                            color: '#fff',
                                                                            fontFamily: 'Nunito Sans',
                                                                            fontSize: '14px',
                                                                            fontWeight: '600',
                                                                            lineHeight: '20px',
                                                                            textTransform: 'none',
                                                                            '&:hover': {
                                                                                color: '#5052B2'
                                                                            }
                                                                        }}>
                                                                            Delete
                                                                        </Button>
                                                                    </Box>
                                                                </Box>
                                                            </Popover>
                                                        </>
                                                    )}
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    ))}

                                    {/* <Button color="primary" onClick={handleAddRow} sx={{
                                    fontFamily: 'Nunito Sans',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#5052B2',
                                    lineHeight: '22px',
                                    textTransform: 'none',
                                    '&:hover': {
                                        background: '#fff'
                                    }
                                }}>
                                    Add Row +
                                    </Button> */}

                                </Box>
                            </TabPanel>
                        </TabContext>
                        {/* Button based on selected tab */}

                    </Box>
                    {getButton(value) && (
                        <Box sx={{
                            px: 2, py: 3.5, position: 'fixed', bottom: 0, right: 0, background: '#fff',
                            width: '620px',
                            '@media (max-width: 600px)': {
                                width: '100%',
                            }
                        }}>
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
export default ConnectMeta;