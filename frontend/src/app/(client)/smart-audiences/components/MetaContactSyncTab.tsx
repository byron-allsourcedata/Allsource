import { Drawer, Box, Typography, IconButton, List, LinearProgress, Grid, ClickAwayListener, 
    Button, ListItemText, Popover, Tooltip, Tab, Slider, TextField, Card, CardContent,
    InputAdornment, MenuItem, Menu, Divider, FormControl, InputLabel, Select, Link} from '@mui/material';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import CloseIcon from '@mui/icons-material/Close';

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

type KlaviyoList = {
    id: string
    list_name: string
}

interface MetaContactSyncTabProps {
    setIsLoading: (state: boolean) => void
    setSelectedOptionMeta: any
    selectedOptionMeta: any
    adAccountsMeta: any
    optionAdAccountMeta: any
    setOptionAdAccountMeta: any
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
                // borderColor: '#5052B2',
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

const MetaContactSyncTab: React.FC<MetaContactSyncTabProps> = ({ setIsLoading, setSelectedOptionMeta, selectedOptionMeta, adAccountsMeta, optionAdAccountMeta, setOptionAdAccountMeta }) => {
    const [anchorElMeta, setAnchorElMeta] = useState<null | HTMLElement>(null);
    const [anchorElAdAccountMeta, setAnchorElAdAccountMeta] = useState<null | HTMLElement>(null);
    const [isDropdownOpenAdAccountMeta, setIsDropdownOpenAdAccountMeta] = useState(false);
    const [metaAudienceList, setMetaAudience] = useState<MetaAuidece[]>([])
    const [metaCampaign, setMetaCampaign] = useState<MetaCampaign[]>([])
    const [anchorElCampaignMeta, setAnchorElCampaignMeta] = useState<null | HTMLElement>(null);
    const [selectedOptionCampaignMeta, setSelectedOptionCampaignMeta] = useState<MetaCampaign | null>(null);
    const [isDropdownOpenCampaignMeta, setIsDropdownOpenCampaignMeta] = useState<boolean>(false);
    const [showCreateFormCampaignMeta, setShowCreateFormCampaignMeta] = useState<boolean>(false);
    const [isShrunkCampaignMeta, setIsShrunkCampaignMeta] = useState<boolean>(false);
    const [isShrunkMeta, setIsShrunkMeta] = useState<boolean>(false);
    const [isDropdownOpenMeta, setIsDropdownOpenMeta] = useState<boolean>(false);
    const [showCreateFormMeta, setShowCreateFormMeta] = useState<boolean>(false);
    const [inputValueCampaignMeta, setInputValueCampaignMeta] = useState('');
    const textFieldRefCampaignMeta = useRef<HTMLDivElement>(null);
    const textFieldRefAdAccountMeta = useRef<HTMLDivElement>(null);
    const [isCheckedMeta, setIsCheckedMeta] = useState(false);
    const textFieldRefMeta = useRef<HTMLDivElement>(null);
    const [formValues, setFormValues] = useState<FormValues>({
        campaignName: '',
        campaignObjective: '',
        bidAmount: 1,
        dailyBudget: 100,
    });
    const [inputValueMeta, setInputValueMeta] = useState('');
    const [isDropdownValid, setIsDropdownValid] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [newListName, setNewListName] = useState<string>('');
    const [listNameError, setListNameError] = useState(false);

    useEffect(() => {
        const allFieldsFilled = Object.values(formValues).every((value) => String(value).trim() !== '');
        setIsCheckedMeta(allFieldsFilled);
    }, [formValues]);

    const isKlaviyoList = (value: any): value is KlaviyoList => {
        return value !== null &&
            typeof value === 'object' &&
            'id' in value &&
            'list_name' in value;
    };


    const handleCloseCampaignMeta = () => {
        setAnchorElCampaignMeta(null);
        setIsDropdownOpenAdAccountMeta(false)
        setShowCreateFormCampaignMeta(false);
        setIsDropdownOpenCampaignMeta(false);
    };

    const handleCloseMeta = () => {
        setAnchorElMeta(null);
        setAnchorElAdAccountMeta(null)
        setIsDropdownOpenAdAccountMeta(false)
        setShowCreateFormMeta(false);
        setIsDropdownOpen(false);
        setNewListName(''); // Clear new list name when closing
    };

    const handleClickMeta = (event: React.MouseEvent<HTMLInputElement>) => {
        setIsShrunkMeta(true);
        setIsDropdownOpenMeta(prev => !prev);
        setAnchorElMeta(event.currentTarget);
        setShowCreateFormMeta(false);
    };

    const handleClickCampaignMeta = (event: React.MouseEvent<HTMLInputElement>) => {
        setIsShrunkCampaignMeta(true);
        setIsDropdownOpenCampaignMeta(prev => !prev);
        setAnchorElCampaignMeta(event.currentTarget);
        setShowCreateFormCampaignMeta(false);
    };

    const handleSelectOptionCampaignMeta = (value: MetaAuidece | string) => {
        if (value === 'createNewAudience') {
            setShowCreateFormCampaignMeta(prev => !prev);
            if (!showCreateFormCampaignMeta) {
                setAnchorElCampaignMeta(textFieldRefCampaignMeta.current);
            }
        } else if (isKlaviyoList(value)) {
            setSelectedOptionCampaignMeta({
                id: value.id,
                list_name: value.list_name
            });
            setInputValueCampaignMeta(value.list_name)
            handleCloseCampaignMeta();
        } else {
            setSelectedOptionCampaignMeta(null);
        }
    };

    const handleSaveCampaignMeta = () => {
        if (isCheckedMeta) {
            const newKlaviyoList = { id: '-1', list_name: formValues.campaignName }
            setSelectedOptionCampaignMeta(newKlaviyoList);
            if (isKlaviyoList(newKlaviyoList)) {
                setIsDropdownValid(true);
            }
            setInputValueCampaignMeta(newKlaviyoList.list_name)
            handleCloseCampaignMeta();
        }
    };

    const handleDropdownToggleCampaignMeta = (event: React.MouseEvent) => {
        event.stopPropagation();
        setIsDropdownOpenCampaignMeta(prev => !prev);
        setAnchorElCampaignMeta(textFieldRefCampaignMeta.current);
        setShowCreateFormCampaignMeta(false);
    };

    const handleClearCampaignMeta = () => {
        setSelectedOptionCampaignMeta(null)
        setFormValues({
            campaignName: '',
            campaignObjective: '',
            bidAmount: 1,
            dailyBudget: 100
        });
        setInputValueCampaignMeta('')
    };

    const handleDropdownToggleAdAccount = (event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent triggering the input field click
        setIsDropdownOpenAdAccountMeta(prev => !prev);
        setAnchorElAdAccountMeta(textFieldRefAdAccountMeta.current);
    };

    const handleDropdownToggleMeta = (event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent triggering the input field click
        setIsDropdownOpen(prev => !prev);
        setAnchorElMeta(textFieldRefMeta.current);
    };

    const handleSelectOptionMeta = (value: MetaAuidece | string) => {
        if (value === 'createNew') {
            setShowCreateFormMeta(prev => !prev);
            if (!showCreateFormMeta) {
                setAnchorElMeta(textFieldRefMeta.current);
            }
        } else if (isKlaviyoList(value)) {
            setSelectedOptionMeta({
                id: value.id,
                list_name: value.list_name
            });
            setInputValueMeta(value.list_name)
            setIsDropdownValid(true);
            handleCloseMeta();
        } else {
            setIsDropdownValid(false);
            setSelectedOptionMeta(null);
        }
    };

    const handleInputChangeMeta = (e: any) => {
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

    const handleClickAdAccountMeta = (event: React.MouseEvent<HTMLInputElement>) => {
        setIsShrunkMeta(true)
        setAnchorElAdAccountMeta(event.currentTarget);
        setIsDropdownOpenAdAccountMeta(true);
    };

    const handleCloseAdAccountMeta = () => {
        setAnchorElAdAccountMeta(null);
        setIsDropdownOpenAdAccountMeta(false);
    };

    const handleSelectAdAccountMeta = async (value: any) => {
        setOptionAdAccountMeta(value);
        handleCloseMeta();
    }

    useEffect(() => {
        const getList = async () => {
            setIsLoading(true)
            const response = await axiosInstance.get('/integrations/sync/list/', {
                params: {
                    service_name: 'meta',
                    ad_account_id: optionAdAccountMeta?.id
                }
            })
            if (response.status === 200) {
                setMetaAudience(response.data.audience_lists)
                setMetaCampaign(response.data.campaign_lists)
            }
            setIsLoading(false)
        }
        if (optionAdAccountMeta) {
            getList()
        }
    }, [optionAdAccountMeta])

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
            setSelectedOptionMeta(newKlaviyoList);
            if (isKlaviyoList(newKlaviyoList)) {
                setIsDropdownValid(true);
            }
            setInputValueMeta(newKlaviyoList.list_name)
            handleCloseMeta();
        }
    };

  
    return (
        <ClickAwayListener onClickAway={handleCloseMeta}>
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <TextField
                    ref={textFieldRefAdAccountMeta}
                    variant="outlined"
                    value={
                        optionAdAccountMeta?.name || null
                    }
                    onClick={handleClickAdAccountMeta}
                    size="medium"
                    fullWidth
                    label={optionAdAccountMeta?.name ? '' : 'Select Ad Account'}
                    InputLabelProps={{
                        shrink: optionAdAccountMeta?.name || optionAdAccountMeta?.name != '' ? false : true,
                        sx: {
                            fontFamily: 'Nunito Sans',
                            fontSize: '15px',
                            lineHeight: '16px',
                            color: 'rgba(17, 17, 19, 0.60)',
                            pl: '3px',
                            '&.Mui-focused': {
                                color: 'rgba(80, 82, 178, 1)',
                            },
                        }
                    }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={handleDropdownToggleAdAccount} edge="end">
                                    {isDropdownOpenAdAccountMeta ? <Image src='/chevron-drop-up.svg' alt='chevron-drop-up' height={24} width={24} /> : <Image src='/chevron-drop-down.svg' alt='chevron-drop-down' height={24} width={24} />}
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
                        marginBottom: '24px'

                    }}
                />
                <Menu
                    anchorEl={anchorElAdAccountMeta}
                    open={Boolean(anchorElAdAccountMeta) && isDropdownOpenAdAccountMeta}
                    onClose={handleCloseAdAccountMeta}
                    PaperProps={{
                        sx: {
                            width: anchorElAdAccountMeta ? `${anchorElAdAccountMeta.clientWidth}px` : '538px', borderRadius: '4px',
                            border: '1px solid #e4e4e4'
                        }, // Match dropdown width to input
                    }}
                    sx={{

                    }}
                >
                    {/* Show static options */}
                    {adAccountsMeta?.map((adAccount: any) => (
                        <MenuItem key={adAccount.id} onClick={() => handleSelectAdAccountMeta(adAccount)} sx={{
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
                    ref={textFieldRefMeta}
                    variant="outlined"
                    value={inputValueMeta}
                    onClick={handleClickMeta}
                    size="medium"
                    fullWidth
                    label={selectedOptionMeta ? '' : 'Select or Create new list'}
                    InputLabelProps={{
                        shrink: selectedOptionMeta?.list_name ? false : isShrunkMeta,
                        sx: {
                            fontFamily: 'Nunito Sans',
                            fontSize: '15px',
                            lineHeight: '16px',
                            color: 'rgba(17, 17, 19, 0.60)',
                            pl: '3px',
                            '&.Mui-focused': {
                                color: 'rgba(80, 82, 178, 1)',
                            },
                        }
                    }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={handleDropdownToggleMeta} edge="end">
                                    {isDropdownOpenMeta ? <Image src='/chevron-drop-up.svg' alt='chevron-drop-up' height={24} width={24} /> : <Image src='/chevron-drop-down.svg' alt='chevron-drop-down' height={24} width={24} />}
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
                            cursor: 'default', // Prevent showing caret on input field
                            top: '5px'
                        },
                        marginBottom: '24px'
                    }}
                />

                <Menu
                    anchorEl={anchorElMeta}
                    open={Boolean(anchorElMeta) && isDropdownOpenMeta}
                    onClose={handleCloseMeta}
                    PaperProps={{
                        sx: {
                            width: anchorElMeta ? `${anchorElMeta.clientWidth}px` : '538px', borderRadius: '4px',
                            border: '1px solid #e4e4e4'
                        },
                    }}
                >
                    {/* Show "Create New List" option */}
                    <MenuItem onClick={() => handleSelectOptionMeta('createNew')} sx={{
                        borderBottom: showCreateFormMeta ? "none" : "1px solid #cdcdcd",
                        '&:hover': {
                            background: 'rgba(80, 82, 178, 0.10)'
                        }
                    }}>
                        <ListItemText primary={`+ Create new list`} primaryTypographyProps={{
                            sx: {
                                fontFamily: "Nunito Sans",
                                fontSize: "14px",
                                color: showCreateFormMeta ? "#5052B2" : "#202124",
                                fontWeight: "500",
                                lineHeight: "20px",

                            }
                        }} />
                    </MenuItem>

                    {showCreateFormMeta && (
                        <Box>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '24px',
                                p: 2,
                                width: anchorElMeta ? `${anchorElMeta.clientWidth}px` : '538px',
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
                                                    color: 'rgba(80, 82, 178, 1)',
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


                            {/* Add a Divider to separate form from options */}
                            <Divider sx={{ borderColor: '#cdcdcd' }} />
                        </Box>
                    )}

                    {/* Show static options */}
                    {metaAudienceList && metaAudienceList.map((klaviyo, option) => (
                        <MenuItem key={klaviyo.id} onClick={() => handleSelectOptionMeta(klaviyo)} sx={{
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
            {selectedOptionMeta && (
                <Box>
                    <TextField
                        ref={textFieldRefCampaignMeta}
                        variant="outlined"
                        value={inputValueCampaignMeta}
                        onClick={handleClickCampaignMeta}
                        size="medium"
                        fullWidth
                        label={selectedOptionCampaignMeta ? '' : 'Select or Create new Campaign'}
                        InputLabelProps={{
                            shrink: selectedOptionCampaignMeta ? false : isShrunkCampaignMeta,
                            sx: {
                                fontFamily: 'Nunito Sans',
                                fontSize: '15px',
                                lineHeight: '16px',
                                color: 'rgba(17, 17, 19, 0.60)',
                                pl: '3px',
                                '&.Mui-focused': {
                                    color: 'rgba(80, 82, 178, 1)',
                                },
                            }
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleDropdownToggleCampaignMeta} edge="end">
                                        {isDropdownOpenCampaignMeta ?
                                            <Image src='/chevron-drop-up.svg' alt='chevron-drop-up' height={24} width={24} />
                                            : <Image src='/chevron-drop-down.svg' alt='chevron-drop-down' height={24} width={24} />}
                                    </IconButton>
                                    {selectedOptionCampaignMeta && (
                                        <IconButton onClick={handleClearCampaignMeta} edge="end">
                                            <CloseIcon />
                                        </IconButton>
                                    )}
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
                        anchorEl={anchorElCampaignMeta}
                        open={Boolean(anchorElCampaignMeta) && isDropdownOpenCampaignMeta}
                        onClose={handleCloseCampaignMeta}
                        PaperProps={{
                            sx: {
                                width: anchorElMeta ? `${anchorElMeta.clientWidth}px` : '538px', borderRadius: '4px',
                                border: '1px solid #e4e4e4'
                            },
                        }}
                    >
                        {/* Show "Create New Campaign" option */}
                        <MenuItem onClick={() => handleSelectOptionCampaignMeta('createNewAudience')} sx={{
                            borderBottom: showCreateFormCampaignMeta ? "none" : "1px solid #cdcdcd",
                            '&:hover': {
                                background: 'rgba(80, 82, 178, 0.10)'
                            }
                        }}>
                            <ListItemText primary={`+ Create new Campaign list`} primaryTypographyProps={{
                                sx: {
                                    fontFamily: "Nunito Sans",
                                    fontSize: "14px",
                                    color: showCreateFormCampaignMeta ? "#5052B2" : "#202124",
                                    fontWeight: "500",
                                    lineHeight: "20px",

                                }
                            }} />
                        </MenuItem>

                        {showCreateFormCampaignMeta && (
                            <Box>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '24px',
                                    p: 2,
                                    width: anchorElMeta ? `${anchorElMeta.clientWidth}px` : '538px',
                                    pt: 0,
                                }}>

                                    <Box sx={{ textAlign: 'right' }}>
                                        <TextField
                                            label="Campaign Name"
                                            variant="outlined"
                                            name="campaignName"
                                            value={formValues.campaignName}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            onChange={handleInputChangeMeta}
                                            fullWidth
                                            margin="normal"
                                            sx={{
                                                fontFamily: 'Nunito Sans',
                                                '& .MuiInputBase-input': {
                                                    fontSize: '14px',
                                                    lineHeight: '16px',
                                                },
                                                "& .MuiInputLabel-root.Mui-focused": {
                                                    color: "rgba(17, 17, 19, 0.6)",
                                                },
                                                "& .MuiInputLabel-root[data-shrink='false']": {
                                                    transform: "translate(16px, 60%) scale(1)",
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
                                                onChange={handleInputChangeMeta}
                                                label="Campaign goal"
                                                sx={{
                                                    fontSize: '16px',
                                                    textAlign: 'left',
                                                    justifyContent: 'flex-start',
                                                    '& .MuiSelect-select': {
                                                        fontSize: '16px',
                                                    },
                                                    "& .MuiInputLabel-root.Mui-focused": {
                                                        color: "rgba(17, 17, 19, 0.6)",
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
                                            onChange={handleInputChangeMeta}
                                            fullWidth
                                            margin="normal"
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                            }}
                                            sx={{
                                                "& .MuiInputLabel-root.Mui-focused": {
                                                    color: "rgba(17, 17, 19, 0.6)",
                                                }
                                            }}
                                        />
                                        <TextField
                                            label="Daily Budget"
                                            variant="outlined"
                                            name="dailyBudget"
                                            type="number"
                                            value={formValues.dailyBudget}
                                            onChange={handleInputChangeMeta}
                                            fullWidth
                                            margin="normal"
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                            }}
                                            sx={{
                                                "& .MuiInputLabel-root.Mui-focused": {
                                                    color: "rgba(17, 17, 19, 0.6)",
                                                }
                                            }}
                                        />
                                        <Typography variant="body2" color="textSecondary" paragraph>
                                            We will not run your campaign. Maximiz will create a campaign template in your ad account. We won&apos;t run anything without your confirmation.
                                        </Typography>
                                        <Button variant="contained" onClick={handleSaveCampaignMeta}
                                            disabled={!isCheckedMeta}
                                            sx={{
                                                borderRadius: '4px',
                                                border: '1px solid #5052B2',
                                                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                backgroundColor: "rgba(80, 82, 178, 1)",
                                                fontFamily: 'Nunito Sans',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                lineHeight: '20px',
                                                color: "rgba(255, 255, 255, 1)",
                                                textTransform: 'none',
                                                padding: '4px 22px',
                                                ":hover": {
                                                    backgroundColor: "rgba(62, 64, 142, 1)"},
                                                ":active": {
                                                    backgroundColor: "rgba(80, 82, 178, 1)"},
                                                ":disabled": {
                                                    borderColor: "rgba(80, 82, 178, 1)",
                                                    opacity: 0.4,
                                                },
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
                                onClick={() => handleSelectOptionCampaignMeta(klaviyo)}
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
    );
  };

export default MetaContactSyncTab;