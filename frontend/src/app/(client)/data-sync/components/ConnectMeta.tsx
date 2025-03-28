import React, { useState, useRef, useEffect } from 'react';
import { Drawer, Select, Box, Typography, IconButton, TextField, Divider, FormControlLabel, FormControl, FormLabel, Radio, Button, Link, Tab, Tooltip, Switch, RadioGroup, InputLabel, MenuItem, Popover, Menu, SelectChangeEvent, ListItemText, ClickAwayListener, InputAdornment, Grid } from '@mui/material';
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
    isEdit?: boolean;
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

interface MetaCampaign {
    id: string
    list_name: string
}

interface FormValues {
    campaignName: string;
    campaignObjective: string;
    bidAmount: number;
    dailyBudget: number;
}


const ConnectMeta: React.FC<ConnectMetaPopupProps> = ({ open, onClose, data, isEdit }) => {
    const { triggerSync } = useIntegrationContext();
    const [value, setValue] = React.useState('1');
    const [selectedRadioValue, setSelectedRadioValue] = useState(data?.type);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [anchorElCampaign, setAnchorElCampaign] = useState<null | HTMLElement>(null);
    const [selectedOption, setSelectedOption] = useState<MetaAuidece | null>(null);
    const [selectedOptionCampaign, setSelectedOptionCampaign] = useState<MetaCampaign | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [inputValueCampaign, setInputValueCampaign] = useState(data?.campaign_name ?? '');
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
    const [showCreateFormCampaign, setShowCreateFormCampaign] = useState<boolean>(false);
    const [newListName, setNewListName] = useState<string>('');
    const [isShrunk, setIsShrunk] = useState<boolean>(false);
    const [isShrunkCampaign, setIsShrunkCampaign] = useState<boolean>(false);
    const textFieldRef = useRef<HTMLDivElement>(null);
    const textFieldRefCampaign = useRef<HTMLDivElement>(null);
    const textFieldRefAdAccount = useRef<HTMLDivElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isDropdownOpenCampaign, setIsDropdownOpenCampaign] = useState<boolean>(false);
    const [isDropdownValid, setIsDropdownValid] = useState(false);
    const [listNameError, setListNameError] = useState(false);
    const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true)
    const [adAccounts, setAdAccounts] = useState<adAccount[]>([])
    const [optionAdAccount, setOptionAdAccount] = useState<adAccount | null>(null)
    const [metaAudienceList, setMetaAudience] = useState<MetaAuidece[]>([])
    const [metaCampaign, setMetaCampaign] = useState<MetaCampaign[]>([])
    const [UpdateKlaviuo, setUpdateKlaviuo] = useState<any>(null);
    const [anchorElAdAccount, setAnchorElAdAccount] = useState<null | HTMLElement>(null);
    const [isDropdownOpenAdAccount, setIsDropdownOpenAdAccount] = useState(false);
    const [formValues, setFormValues] = useState<FormValues>({
        campaignName: '',
        campaignObjective: '',
        bidAmount: 1,
        dailyBudget: 100,
    });
    const [isChecked, setIsChecked] = useState(false);

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        const numericValue = (name === 'bidAmount' || name === 'dailyBudget') ? Number(value) : value;
        if (
            (name === 'bidAmount' && (isNaN(numericValue) || numericValue < 1 || numericValue > 918)) ||
            (name === 'dailyBudget' && (isNaN(numericValue) || numericValue < 100 || numericValue > 1000000000))
        ) {
            return;
        }
        setFormValues((prevValues) => ({
            ...prevValues,
            [name]: numericValue,
        }));
    };

    useEffect(() => {
        const allFieldsFilled = Object.values(formValues).every((value) => String(value).trim() !== '');
        setIsChecked(allFieldsFilled);
    }, [formValues]);

    const handleSaveCampaign = () => {
        if (isChecked) {
            const newKlaviyoList = { id: '-1', list_name: formValues.campaignName }
            setSelectedOptionCampaign(newKlaviyoList);
            if (isKlaviyoList(newKlaviyoList)) {
                setIsDropdownValid(true);
            }
            setInputValueCampaign(newKlaviyoList.list_name)
            handleCloseCampaign();
        }
    };

    useEffect(() => {
        const fetchAdAccount = async () => {
            if (open) {
                setLoading(true);
                try {
                    const response = await axiosInstance.get('/integrations/sync/ad_accounts');
                    if (response.status === 200) {
                        setAdAccounts(response.data);
                        const foundItem = response.data?.find((item: any) => item.id === data?.customer_id);
                        if (foundItem) {
                            setUpdateKlaviuo(data.id)
                            setOptionAdAccount({
                                id: foundItem.id,
                                name: foundItem.name
                            });
                        }

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
                setMetaAudience(response.data.audience_lists)
                setMetaCampaign(response.data.campaign_lists)
                const foundItem = response.data.audience_lists?.find((item: any) => item.list_name === data?.name);
                if (foundItem) {
                    setUpdateKlaviuo(data.id)
                    setSelectedOption({
                        id: foundItem.id,
                        list_name: foundItem.list_name
                    });
                    setInputValue(foundItem.list_name)
                    setIsDropdownValid(true)
                } else {
                    setSelectedOption(null);
                }

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


    const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
        setIsShrunk(true);
        setIsDropdownOpen(prev => !prev);
        setAnchorEl(event.currentTarget);
        setShowCreateForm(false);
    };

    const handleClickCampaign = (event: React.MouseEvent<HTMLInputElement>) => {
        setIsShrunkCampaign(true);
        setIsDropdownOpenCampaign(prev => !prev);
        setAnchorElCampaign(event.currentTarget);
        setShowCreateFormCampaign(false);
    };

    // Handle dropdown toggle specifically when clicking on the arrow
    const handleDropdownToggle = (event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent triggering the input field click
        setIsDropdownOpen(prev => !prev);
        setAnchorEl(textFieldRef.current);
    };

    const handleDropdownToggleCampaign = (event: React.MouseEvent) => {
        event.stopPropagation();
        setIsDropdownOpenCampaign(prev => !prev);
        setAnchorElCampaign(textFieldRefCampaign.current);
        setShowCreateFormCampaign(false);
    };

    const handleDropdownToggleAdAccount = (event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent triggering the input field click
        setIsDropdownOpenAdAccount(prev => !prev);
        setAnchorElAdAccount(textFieldRefAdAccount.current);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setAnchorElAdAccount(null)
        setIsDropdownOpenAdAccount(false)
        setShowCreateForm(false);
        setIsDropdownOpen(false);
        setNewListName(''); // Clear new list name when closing
    };

    const handleCloseCampaign = () => {
        setAnchorElCampaign(null);
        setIsDropdownOpenAdAccount(false)
        setShowCreateForm(false);
        setIsDropdownOpenCampaign(false);
    };

    const handleSelectAdAccount = async (value: any) => {
        setOptionAdAccount(value);
        handleClose();
    }

    const handleSelectOption = (value: MetaAuidece | string) => {
        if (value === 'createNew') {
            setShowCreateForm(prev => !prev);
            if (!showCreateForm) {
                setAnchorEl(textFieldRef.current);
            }
        } else if (isKlaviyoList(value)) {
            setSelectedOption({
                id: value.id,
                list_name: value.list_name
            });
            setInputValue(value.list_name)
            setIsDropdownValid(true);
            handleClose();
        } else {
            setIsDropdownValid(false);
            setSelectedOption(null);
        }
    };

    const handleSelectOptionCampaign = (value: MetaAuidece | string) => {
        if (value === 'createNewAudience') {
            setShowCreateFormCampaign(prev => !prev);
            if (!showCreateFormCampaign) {
                setAnchorElCampaign(textFieldRefCampaign.current);
            }
        } else if (isKlaviyoList(value)) {
            setSelectedOptionCampaign({
                id: value.id,
                list_name: value.list_name
            });
            setInputValueCampaign(value.list_name)
            handleCloseCampaign();
        } else {
            setSelectedOptionCampaign(null);
        }
    };

    const isKlaviyoList = (value: any): value is MetaAuidece => {
        return value !== null &&
            typeof value === 'object' &&
            'id' in value &&
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
            const newKlaviyoList = { id: '-1', list_name: newListName }
            setSelectedOption(newKlaviyoList);
            if (isKlaviyoList(newKlaviyoList)) {
                setIsDropdownValid(true);
            }
            setInputValue(newKlaviyoList.list_name)
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
                        disabled={!isDropdownValid || inputValue == ''}
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

    const handleNextTab = async () => {
        if (value === '1') {
            setValue((prevValue) => String(Number(prevValue) + 1));
        }
        if (value === '2') {
            if (isDropdownValid) {
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

                const requestData: any = {
                    customer_id: String(optionAdAccount?.id),
                    list_id: list?.id,
                    integrations_users_sync_id: UpdateKlaviuo,
                    leads_type: selectedRadioValue,
                };

                if (selectedOptionCampaign?.id || formValues?.campaignName) {
                    requestData.campaign = {
                        campaign_id: selectedOptionCampaign?.id,
                        campaign_name: formValues?.campaignName,
                        campaign_objective: formValues?.campaignObjective,
                        bid_amount: formValues?.bidAmount,
                        daily_budget: formValues?.dailyBudget
                    };
                }

                const response = await axiosInstance.put('/data-sync/sync', requestData, {
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
                const requestData: any = {
                    customer_id: String(optionAdAccount?.id),
                    list_id: list?.id,
                    list_name: list?.list_name,
                    leads_type: selectedRadioValue,
                };
                if (selectedOptionCampaign?.id || formValues?.campaignName) {
                    requestData.campaign = {
                        campaign_id: selectedOptionCampaign?.id,
                        campaign_name: selectedOptionCampaign?.list_name,
                        campaign_objective: formValues?.campaignObjective,
                        bid_amount: formValues?.bidAmount,
                        daily_budget: formValues?.dailyBudget
                    };
                }

                const response = await axiosInstance.post('/data-sync/sync', requestData, {
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

    const handleClearCampaign = () => {
        setSelectedOptionCampaign(null)
        setFormValues({
            campaignName: '',
            campaignObjective: '',
            bidAmount: 1,
            dailyBudget: 100
        });
        setInputValueCampaign('')
    };

    const resetToDefaultValues = () => {
        setValue('1');
        setSelectedRadioValue('');
        setAnchorEl(null);
        setAnchorElCampaign(null)
        setSelectedOption(null);
        setSelectedOptionCampaign(null)
        setShowCreateFormCampaign(false)
        setShowCreateForm(false);
        setNewListName('');
        setInputValue('')
        setInputValueCampaign('')
        setIsShrunk(false);
        setIsShrunkCampaign(false)
        setIsDropdownOpen(false);
        setIsDropdownOpenCampaign(false)
        setIsDropdownValid(false);
        setListNameError(false);
        setDeleteAnchorEl(null);
        setSelectedRowId(null);
        setLoading(false);
        setOptionAdAccount(null);
        setFormValues({
            campaignName: '',
            campaignObjective: '',
            bidAmount: 1,
            dailyBudget: 100
        });
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

                                        <FormControl sx={{ gap: '16px' }}>
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
                                                <FormControlLabel value="abandoned_cart" control={<Radio sx={{
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
                                                            optionAdAccount?.name || null
                                                        }
                                                        onClick={handleClickAdAccount}
                                                        size="medium"
                                                        disabled={data?.customer_id}
                                                        fullWidth
                                                        label={optionAdAccount?.name ? '' : 'Select Ad Account'}
                                                        InputLabelProps={{
                                                            shrink: optionAdAccount?.name || optionAdAccount?.name != '' ? false : true,
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
                                                                    <IconButton disabled={data?.customer_id} onClick={handleDropdownToggleAdAccount} edge="end">
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
                                                        open={Boolean(anchorElAdAccount) && isDropdownOpenAdAccount && !data?.customer_id}
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
                                                {/* AudienceList */}
                                                <Box>
                                                    <TextField
                                                        ref={textFieldRef}
                                                        variant="outlined"
                                                        disabled={data?.customer_id}
                                                        value={inputValue}
                                                        onClick={handleClick}
                                                        size="medium"
                                                        fullWidth
                                                        label={selectedOption ? '' : 'Select or Create new list'}
                                                        InputLabelProps={{
                                                            shrink: selectedOption?.list_name ? false : isShrunk,
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
                                                                caretColor: 'transparent',
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
                                                        anchorEl={anchorEl}
                                                        open={Boolean(anchorEl) && isDropdownOpen && !data?.customer_id}
                                                        onClose={handleClose}
                                                        PaperProps={{
                                                            sx: {
                                                                width: anchorEl ? `${anchorEl.clientWidth}px` : '538px', borderRadius: '4px',
                                                                border: '1px solid #e4e4e4'
                                                            },
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

                                                        {showCreateForm && (
                                                            <Box>
                                                                <Box sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: '24px',
                                                                    p: 2,
                                                                    width: anchorEl ? `${anchorEl.clientWidth}px` : '538px',
                                                                    pt: 0,
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
                                                                            label="Audience Name"
                                                                            variant="outlined"
                                                                            value={newListName}
                                                                            onChange={(e) => setNewListName(e.target.value)}
                                                                            size="small"
                                                                            fullWidth
                                                                            onKeyDown={(e) => e.stopPropagation()}
                                                                            error={listNameError}
                                                                            helperText={listNameError ? 'Audience Name is required' : ''}
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
                                                        {metaAudienceList && metaAudienceList.map((klaviyo, option) => (
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
                                                                        lineHeight: "20px",
                                                                    }
                                                                }} />
                                                            </MenuItem>
                                                        ))}
                                                    </Menu>
                                                </Box>

                                                {/* CampaignList */}
                                                {selectedOption && (
                                                    <Box>
                                                        <TextField
                                                            ref={textFieldRefCampaign}
                                                            variant="outlined"
                                                            value={inputValueCampaign}
                                                            onClick={handleClickCampaign}
                                                            disabled={data?.campaign_name}
                                                            size="medium"
                                                            fullWidth
                                                            label={inputValueCampaign ? '' : 'Select or Create new Campaign'}
                                                            InputLabelProps={{
                                                                shrink: inputValueCampaign ? false : isShrunkCampaign,
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
                                                                        <IconButton disabled={data?.campaign_name} onClick={handleDropdownToggleCampaign} edge="end">
                                                                            {isDropdownOpenCampaign ?
                                                                                <Image src='/chevron-drop-up.svg' alt='chevron-drop-up' height={24} width={24} />
                                                                                : <Image src='/chevron-drop-down.svg' alt='chevron-drop-down' height={24} width={24} />}
                                                                        </IconButton>
                                                                        {selectedOptionCampaign && (
                                                                            <IconButton disabled={data?.campaign_name} onClick={handleClearCampaign} edge="end">
                                                                                <CloseIcon />
                                                                            </IconButton>
                                                                        )}
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
                                                            }}
                                                        />

                                                        <Menu
                                                            anchorEl={anchorElCampaign}
                                                            open={Boolean(anchorElCampaign) && isDropdownOpenCampaign && !data?.campaign_name}
                                                            onClose={handleCloseCampaign}
                                                            PaperProps={{
                                                                sx: {
                                                                    width: anchorEl ? `${anchorEl.clientWidth}px` : '538px', borderRadius: '4px',
                                                                    border: '1px solid #e4e4e4'
                                                                },
                                                            }}
                                                        >
                                                            {/* Show "Create New Campaign" option */}
                                                            <MenuItem disabled={data?.campaign_name} onClick={() => handleSelectOptionCampaign('createNewAudience')} sx={{
                                                                borderBottom: showCreateFormCampaign ? "none" : "1px solid #cdcdcd",
                                                                '&:hover': {
                                                                    background: 'rgba(80, 82, 178, 0.10)'
                                                                }
                                                            }}>
                                                                <ListItemText primary={`+ Create new Campaign list`} primaryTypographyProps={{
                                                                    sx: {
                                                                        fontFamily: "Nunito Sans",
                                                                        fontSize: "14px",
                                                                        color: showCreateFormCampaign ? "#5052B2" : "#202124",
                                                                        fontWeight: "500",
                                                                        lineHeight: "20px",

                                                                    }
                                                                }} />
                                                            </MenuItem>

                                                            {showCreateFormCampaign && (
                                                                <Box>
                                                                    <Box sx={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        gap: '24px',
                                                                        p: 2,
                                                                        width: anchorEl ? `${anchorEl.clientWidth}px` : '538px',
                                                                        pt: 0,
                                                                    }}>

                                                                        <Box sx={{ textAlign: 'right' }}>
                                                                            <TextField
                                                                                label="Campaign Name"
                                                                                variant="outlined"
                                                                                name="campaignName"
                                                                                value={formValues.campaignName}
                                                                                onKeyDown={(e) => e.stopPropagation()}
                                                                                onChange={handleInputChange}
                                                                                fullWidth
                                                                                margin="normal"
                                                                                sx={{
                                                                                    fontFamily: 'Nunito Sans',
                                                                                    '& .MuiInputBase-input': {
                                                                                        fontSize: '14px',
                                                                                        lineHeight: '16px',
                                                                                    },
                                                                                    '& .MuiInputLabel-root': {
                                                                                        fontSize: '14px',
                                                                                    },
                                                                                    '& .MuiOutlinedInput-root': {
                                                                                        fontSize: '14px',
                                                                                    },
                                                                                }}
                                                                            />
                                                                            <FormControl variant="outlined" fullWidth margin="normal" sx={{ fontSize: '10px' }}>
                                                                                <InputLabel sx={{ fontSize: '14px' }}>Campaign goal</InputLabel>
                                                                                <Select
                                                                                    name="campaignObjective"
                                                                                    value={formValues.campaignObjective}
                                                                                    onChange={handleInputChange}
                                                                                    label="Campaign goal"
                                                                                    sx={{
                                                                                        fontSize: '16px',
                                                                                        textAlign: 'left',
                                                                                        justifyContent: 'flex-start',
                                                                                        '& .MuiSelect-select': {
                                                                                            fontSize: '16px',
                                                                                        },
                                                                                    }}
                                                                                >
                                                                                    <MenuItem
                                                                                        value="LINK_CLICKS"
                                                                                        sx={{ fontSize: '14px' }}
                                                                                    >
                                                                                        link clicks
                                                                                    </MenuItem>
                                                                                    <MenuItem
                                                                                        value="LANDING_PAGE_VIEWS"
                                                                                        sx={{ fontSize: '14px' }}
                                                                                    >
                                                                                        landing page views
                                                                                    </MenuItem>
                                                                                </Select>
                                                                            </FormControl>
                                                                            <TextField
                                                                                label="Bid Amount"
                                                                                variant="outlined"
                                                                                name="bidAmount"
                                                                                type="number"
                                                                                value={formValues.bidAmount}
                                                                                onChange={handleInputChange}
                                                                                fullWidth
                                                                                margin="normal"
                                                                                InputProps={{
                                                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                                                }}
                                                                            />
                                                                            <TextField
                                                                                label="Daily Budget"
                                                                                variant="outlined"
                                                                                name="dailyBudget"
                                                                                type="number"
                                                                                value={formValues.dailyBudget}
                                                                                onChange={handleInputChange}
                                                                                fullWidth
                                                                                margin="normal"
                                                                                InputProps={{
                                                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                                                }}
                                                                            />
                                                                            <Typography variant="body2" color="textSecondary" paragraph>
                                                                                We will not run your campaign. Maximiz will create a campaign template in your ad account. We won&apos;t run anything without your confirmation.
                                                                            </Typography>
                                                                            <Button variant="contained" onClick={handleSaveCampaign}
                                                                                disabled={!isChecked}
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
                                                                                        backgroundColor: '#E4E4E4',
                                                                                        color: '#808080'
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
                                                            {metaCampaign && metaCampaign.map((klaviyo, option) => (
                                                                <MenuItem
                                                                    key={klaviyo.id}
                                                                    onClick={() => handleSelectOptionCampaign(klaviyo)}
                                                                    sx={{
                                                                        '&:hover': {
                                                                            background: 'rgba(80, 82, 178, 0.10)'
                                                                        }
                                                                    }}
                                                                >
                                                                    <ListItemText
                                                                        primary={klaviyo.list_name}
                                                                        primaryTypographyProps={{
                                                                            sx: {
                                                                                fontFamily: "Nunito Sans",
                                                                                fontSize: "14px",
                                                                                color: "#202124",
                                                                                fontWeight: "500",
                                                                                lineHeight: "20px",
                                                                            }
                                                                        }}
                                                                    />

                                                                </MenuItem>
                                                            ))}
                                                        </Menu>
                                                    </Box>
                                                )}
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
                                            <Image src='/logo-icon.svg' alt='logo' height={22} width={34} />
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