import React, { useState, useRef, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, TextField, Divider, FormControlLabel, FormControl, FormLabel, Radio, Button, Link, Tab, RadioGroup, MenuItem, Popover, Grid, LinearProgress } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Image from 'next/image';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showToast } from './ToastNotification';

interface OnmisendDataSyncProps {
    open: boolean;
    onClose: () => void;
    data?: any;
    isEdit?: boolean;
    boxShadow?: string
}


const OnmisendDataSync: React.FC<OnmisendDataSyncProps> = ({ open, onClose, data = null, isEdit, boxShadow }) => {
    const [loading, setLoading] = useState(false)
    const [value, setValue] = React.useState('1');
    const [checked, setChecked] = useState(false);
    const [selectedRadioValue, setSelectedRadioValue] = useState(data?.type);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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
    const [UpdateKlaviuo, setUpdateKlaviuo] = useState<any>(null);
    const [maplistNameError, setMapListNameError] = useState(false);
    const [customFieldsList, setCustomFieldsList] = useState([
    { type: 'Company Name', value: 'company_name' },
    { type: 'Company Domain', value: 'company_domain' },
    { type: 'Company SIC', value: 'company_sic' },
    { type: 'Company LinkedIn URL', value: 'company_linkedin_url' },
    { type: 'Company Revenue', value: 'company_revenue' },
    { type: 'Company Employee Count', value: 'company_employee_count' },
    { type: 'Net Worth', value: 'net_worth' },
    { type: 'Last Updated', value: 'last_updated' },
    { type: 'Personal Emails Last Seen', value: 'personal_emails_last_seen' },
    { type: 'Company Last Updated', value: 'company_last_updated' },
    { type: 'Job Title Last Updated', value: 'job_title_last_updated' },
    { type: 'Age Min', value: 'age_min' },
    { type: 'Age Max', value: 'age_max' },
    { type: 'Additional Personal Emails', value: 'additional_personal_emails' },
    { type: 'LinkedIn URL', value: 'linkedin_url' },
    { type: 'Married', value: 'married' },
    { type: 'Children', value: 'children' },
    { type: 'Income Range', value: 'income_range' },
    { type: 'Homeowner', value: 'homeowner' },
    { type: 'Seniority Level', value: 'seniority_level' },
    { type: 'Department', value: 'department' },
    { type: 'Primary Industry', value: 'primary_industry' },
    { type: 'Work History', value: 'work_history' },
    { type: 'Education History', value: 'education_history' },
    { type: 'Company Description', value: 'company_description' },
    { type: 'Related Domains', value: 'related_domains' },
    { type: 'Social Connections', value: 'social_connections' },
    { type: 'DPV Code', value: 'dpv_code' }]);
    const [customFields, setCustomFields] = useState<{ type: string, value: string }[]>([]);

    useEffect(() => {
        if (data?.data_map) {
            setCustomFields(data?.data_map);
        } else {
            setCustomFields(customFieldsList.map(field => ({ type: field.value, value: field.type })))
        }
    }, [open])



    const handleAddField = () => {
        setCustomFields([...customFields, { type: '', value: '' }]);
    };

    const handleDeleteField = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const handleChangeField = (index: number, field: string, value: string) => {

        setCustomFields(customFields.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };
    const resetToDefaultValues = () => {
        setLoading(false);
        setValue('1');
        setChecked(false);
        setSelectedRadioValue('');
        setAnchorEl(null);
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
    };

    
    useEffect(() => {
        setLoading(false)
    }, [open])



    const handleSaveSync = async () => {
        setLoading(true);
        try {
            if (isEdit) {
                const response = await axiosInstance.put(`/data-sync/sync`, {
                    integrations_users_sync_id: data.id,
                    leads_type: selectedRadioValue,
                    data_map: customFields
                }, {
                    params: {
                        service_name: 'omnisend'
                    }
                });
                if (response.status === 201 || response.status === 200) {
                    resetToDefaultValues();
                    onClose();
                    showToast('Data sync updated successfully');
                }
            } else {
                const response = await axiosInstance.post('/data-sync/sync', {
                    leads_type: selectedRadioValue,
                    data_map: customFields
                }, {
                    params: {
                        service_name: 'omnisend'
                    }
                });
                if (response.status === 201 || response.status === 200) {
                    resetToDefaultValues();
                    onClose();
                    showToast('Data sync created successfully');
                }
            }


        } finally {
            setLoading(false);
        }
    };


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

    // Handle menu close
    const handleClose = () => {
        setAnchorEl(null);
        setShowCreateForm(false);
        setIsDropdownOpen(false);
        setNewListName(''); // Clear new list name when closing
    };

    const handleMapClose = () => {
        setValue('1')
        setShowCreateMapForm(false);
        setNewMapListName('');
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

        // Validate Tag Name
        if (tagName.trim() === '') {
            setTagNameError(true);
            valid = false;
        } else {
            setTagNameError(false);
        }

        // If valid, save and close
        if (valid) {
            handleClose();
        }
    };


    const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChecked(event.target.checked);
    };

    const label = { inputProps: { 'aria-label': 'Switch demo' } };

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
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

    const highlightText = (text: string, highlightConfig: HighlightConfig) => {
        // Start with the whole text as a single part.
        let parts: (string | JSX.Element)[] = [text];

        // For each keyword, split the text and insert the highlighted part.
        Object.keys(highlightConfig).forEach((keyword, keywordIndex) => {
            const { color, fontWeight } = highlightConfig[keyword];
            parts = parts.flatMap((part, partIndex) =>
                // Only split if the part is a string and contains the keyword.
                typeof part === 'string' && part.includes(keyword)
                    ? part.split(keyword).flatMap((segment, index, array) =>
                        index < array.length - 1
                            ? [
                                segment,
                                <span
                                    style={{
                                        color: color || 'inherit',
                                        fontWeight: fontWeight || 'normal'
                                    }}
                                    key={`highlight-${keywordIndex}-${partIndex}-${index}`}
                                >
                                    {keyword}
                                </span>
                            ]
                            : [segment]
                    )
                    : [part] // Otherwise, just keep the part as is (could be JSX).
            );
        });

        return <>{parts}</>; // Return the array wrapped in a fragment.
    };

    const instructions = [
        { id: 'unique-id-1', text: 'Go to the Klaviyo website and log into your account.' },
        { id: 'unique-id-2', text: 'Click on the Settings option located in your Klaviyo account options.' },
        { id: 'unique-id-3', text: 'Click Create Private API Key Name to Maximiz.' },
        { id: 'unique-id-4', text: 'Assign full access permissions to Lists and Profiles, and read access permissions to Metrics, Events, and Templates for your Klaviyo key.' },
        { id: 'unique-id-5', text: 'Click Create.' },
        { id: 'unique-id-6', text: 'Copy the API key in the next screen and paste to API Key field located in Maximiz Klaviyo section.' },
        { id: 'unique-id-7', text: 'Click Connect.' },
        { id: 'unique-id-8', text: 'Select the existing list or create a new one to integrate with Maximiz.' },
        { id: 'unique-id-9', text: 'Click Export.' },

    ]

    // Define the keywords and their styles
    const highlightConfig: HighlightConfig = {
        'Klaviyo': { color: '#5052B2', fontWeight: '500' }, // Blue and bold
        'Settings': { color: '#707071', fontWeight: '500' }, // Bold only
        'Create Private API Key': { color: '#707071', fontWeight: '500' }, // Blue and bold
        'Lists': { color: '#707071', fontWeight: '500' }, // Bold only
        'Profiles': { color: '#707071', fontWeight: '500' }, // Bold only
        'Metrics': { color: '#707071', fontWeight: '500' }, // Blue and bold
        'Events': { color: '#707071', fontWeight: '500' }, // Blue and bold
        'Templates': { color: '#707071', fontWeight: '500' }, // Blue and bold
        'Create': { color: '#707071', fontWeight: '500' }, // Blue and bold
        'API Key': { color: '#707071', fontWeight: '500' }, // Blue and bold
        'Connect': { color: '#707071', fontWeight: '500' }, // Bold only
        'Export': { color: '#707071', fontWeight: '500' } // Blue and bold
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
            // case '2':
            //     return (
            //         <Button
            //             variant="contained"
            //             disabled={!isDropdownValid}
            //             onClick={handleNextTab}
            //             sx={{
            //                 backgroundColor: '#5052B2',
            //                 fontFamily: "Nunito Sans",
            //                 fontSize: '14px',
            //                 fontWeight: '600',
            //                 lineHeight: '20px',
            //                 letterSpacing: 'normal',
            //                 color: "#fff",
            //                 textTransform: 'none',
            //                 padding: '10px 24px',
            //                 boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
            //                 '&:hover': {
            //                     backgroundColor: '#5052B2'
            //                 },
            //                 borderRadius: '4px',
            //             }}
            //         >
            //             Next
            //         </Button>
            //     );
            case '2':
                return (
                    <Button
                        variant="contained"
                        onClick={handleSaveSync}
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
        { id: 3, type: 'First name', value: 'First name' },
        { id: 4, type: 'Second name', value: 'Second name' },
        { id: 5, type: 'Job Title', value: 'Job Title' },
        { id: 6, type: 'Location', value: 'Location' },
        { id: 7, type: 'Gender', value: 'Gender' }
    ];

    const [rows, setRows] = useState<Row[]>(defaultRows);

    const handleMapListChange = (id: number, field: 'value' | 'type', value: string) => {
        setRows(rows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const handleClickOpen = (event: React.MouseEvent<HTMLElement>, id: number) => {
        setDeleteAnchorEl(event.currentTarget);
        setSelectedRowId(id);
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
            type: '',
            value: '',
            canDelete: true, // This new row can be deleted
        };
        setRows([...rows, newRow]);
    };
    const handleDropdownOpen = (id: number) => {
        setOpenDropdown(id); // Set the open state for the current dropdown
    };

    const handleDropdownMaximizOpen = (id: number) => {
        setOpenDropdownMaximiz(id)
    }

    const handleDropdownClose = () => {
        setOpenDropdown(null); // Reset when dropdown closes
    };

    const handleDropdownMaximizClose = () => {
        setOpenDropdownMaximiz(null)
    }

    const validateTab2 = () => {
        if (selectedRadioValue === null) {
            setTab2Error(true);
            return false;
        }
        setTab2Error(false);
        return true;
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

    const deleteOpen = Boolean(deleteAnchorEl);
    const deleteId = deleteOpen ? 'delete-popover' : undefined;

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
            <Box sx={{width: '100%', top: 0, height: '100vh'}}>
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
                    boxShadow: boxShadow ? '0px 8px 10px -5px rgba(0, 0, 0, 0.2), 0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12)' : 'none',
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
                    backgroundColor: boxShadow ? boxShadow : 'rgba(0, 0, 0, 0.01)'
                  }
                }
              }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.85, px: 2, borderBottom: '0.125px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                <Typography variant="h6" className="first-sub-title" sx={{ textAlign: 'center' }}>
                    Connect to Omnisend
                </Typography>
                <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                    <Link href="#" className="main-text" sx={{
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
            <Divider />
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                <Box sx={{ width: '100%', padding: '16px 24px 24px 24px', position: 'relative' }}>
                <TabContext value={value}>
                    <Box sx={{pb: 4}}>
                        <TabList centered aria-label="Connect to Klaviyo Tabs"
                        TabIndicatorProps={{sx: {backgroundColor: "#5052b2" } }} 
                        sx={{
                            "& .MuiTabs-scroller": {
                                overflowX: 'auto !important',
                            },
                            "& .MuiTabs-flexContainer": {
                            justifyContent:'center',
                            '@media (max-width: 600px)': {
                                gap: '16px',
                                justifyContent:'flex-start'
                            }
                        }}} onChange={handleChangeTab}>
                        <Tab label="Sync Filter" value="1" className='tab-heading' sx={klaviyoStyles.tabHeading} />
                        {/* <Tab label="Contact Sync" value="2" className='tab-heading' sx={klaviyoStyles.tabHeading} /> */}
                        <Tab label="Map data" value="2" className='tab-heading' sx={klaviyoStyles.tabHeading} />
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
                                                <FormControlLabel value="coverted_sales" control={<Radio sx={{
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
                                <Box sx={{
                                    borderRadius: '4px',
                                    border: '1px solid #f0f0f0',
                                    boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)',
                                    padding: '16px 24px',
                                    overflowX: 'auto'
                                }}>
                                    <Box sx={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                        <Typography variant="h6" className='first-sub-title'>Map list</Typography>
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
                                            <Image src='/omnisend_icon_black.svg' alt='klaviyo' height={20} width={24} />
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
                                                                    width: '200px',
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
                                                                    width: '200px',
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
                                                                    width: '200px',
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
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 6, mr: 6 }}>
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
                    <Box sx={{ px: 2, py: 1.5, border: '1px solid #e4e4e4', position: 'fixed', bottom: 0, right: 0, background: '#fff', zIndex: '1',
                        width: '620px',
                        '@media (max-width: 600px)': {
                                width: '100%',
                        }
                     }}>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>

                            {getButton(value)}
                        </Box>
                    </Box>
                </Box>

            </Drawer>
        </>
    );
};
export default OnmisendDataSync;