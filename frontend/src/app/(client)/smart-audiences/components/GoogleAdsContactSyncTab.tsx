import { Box, IconButton, ClickAwayListener, MenuItem, Menu,
    Button, ListItemText, TextField, InputAdornment, Divider,} from '@mui/material';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast } from '@/components/ToastNotification';

type ChannelList = {
    list_id: string;
    list_name: string;
}

type Customers = {
    customer_id: string;
    customer_name: string;
}

interface GoogleAdsContactSyncTabProps { 
    setIsLoading: (state: boolean) => void
    customersInfo: Customers[]
    setSelectedOptionGoogle: (state: ChannelList | null) => void
    setSelectedAccountIdGoogle: (state: string) => void
    selectedAccountIdGoogle: string
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
                // borderColor: 'rgba(56, 152, 252, 1)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(56, 152, 252, 1)',
            },
        },
        '&+.MuiFormHelperText-root': {
            marginLeft: '0',
        },
    },
}

const GoogleAdsContactSyncTab: React.FC<GoogleAdsContactSyncTabProps> = ({ setIsLoading, customersInfo, setSelectedOptionGoogle, selectedAccountIdGoogle, setSelectedAccountIdGoogle }) => {
    const textFieldRefGoogle = useRef<HTMLDivElement>(null);
    const [anchorElGoogle, setAnchorElGoogle] = useState<null | HTMLElement>(null);
    const [isDropdownOpenGoogle, setIsDropdownOpenGoogle] = useState<boolean>(false);
    const [showCreateFormGoogle, setShowCreateFormGoogle] = useState<boolean>(false);
    const [newListNameGoogle, setNewListNameGoogle] = useState<string>('');
    const [isShrunkGoogle, setIsShrunkGoogle] = useState<boolean>(false);
    const [anchorElAdAccountGoogle, setAnchorElAdAccountGoogle] = useState<null | HTMLElement>(null);
    const [isDropdownOpenAdAccountGoogle, setIsDropdownOpenAdAccountGoogle] = useState(false);
    const [googleList, setGoogleAdsList] = useState<ChannelList[]>([]);
    const [listNameErrorMessage, setListNameErrorMessage] = useState('')
    const [inputListNameGoogle, setInputListNameGoogle] = useState('');
    const textFieldRefAdAccountGoogle = useRef<HTMLDivElement>(null);
    const [inputCustomerNameGoogle, setInputCustomerNameGoogle] = useState('');
    const [isDropdownValidGoogle, setIsDropdownValidGoogle] = useState(false);
    const [listNameError, setListNameError] = useState(false);

    const createNewListGoogle = async (newListNameGoogle: string) => {
        try {
            setIsLoading(true)
            const newListResponse = await axiosInstance.post('/integrations/sync/list/', {
                name: newListNameGoogle,
                customer_id: String(selectedAccountIdGoogle)
            }, {
                params: {
                    service_name: 'google_ads'
                }
            });

            if (newListResponse.data.status !== 'SUCCESS') {
                showErrorToast(newListResponse.data.message)
            }

            const data = newListResponse.data.channel
            setSelectedOptionGoogle(data)
            setGoogleAdsList(prev => [...prev, data]);
            setInputListNameGoogle(data.list_name)
            setIsDropdownValidGoogle(true)
        }
        finally {
            setIsLoading(false)
        }
    }

    const getGoogleAdsList = async () => {
        try {
            setIsLoading(true)
            const response = await axiosInstance.get('integrations/get-channels', {
                params: {
                    customer_id: selectedAccountIdGoogle,
                    service_name: 'google_ads'
                }
            });
            setInputListNameGoogle('')
            setGoogleAdsList(response.data.user_lists || [])
            if (response.data.status !== 'SUCCESS') {
                showErrorToast(response.data.message)
            }
        } catch { }
        finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (selectedAccountIdGoogle) {
            getGoogleAdsList();
        }
    }, [selectedAccountIdGoogle]);

    const handleClickGoogle = (event: React.MouseEvent<HTMLInputElement>) => {
        setIsShrunkGoogle(true);
        setIsDropdownOpenGoogle(prev => !prev);
        setAnchorElGoogle(event.currentTarget);
        setShowCreateFormGoogle(false);
    };

    const handleDropdownToggleAdAccountGoogle = (event: React.MouseEvent) => {
        event.stopPropagation();
        setIsDropdownOpenAdAccountGoogle(prev => !prev);
        setAnchorElAdAccountGoogle(textFieldRefAdAccountGoogle.current);
    };

    const handleClickAdAccountGoogle = (event: React.MouseEvent<HTMLInputElement>) => {
        setIsShrunkGoogle(true)
        setAnchorElAdAccountGoogle(event.currentTarget);
        setIsDropdownOpenAdAccountGoogle(true);
    };

    const handleSelectAdAccountGoogle = async (value: Customers) => {
        setInputCustomerNameGoogle(value.customer_name)
        setSelectedAccountIdGoogle(value.customer_id)
        handleCloseGoogle();
    }

    const handleCloseAdAccountGoogle = () => {
        setAnchorElAdAccountGoogle(null);
        setIsDropdownOpenAdAccountGoogle(false);
    };

    const handleDropdownToggleGoogle = (event: React.MouseEvent) => {
        event.stopPropagation();
        setIsDropdownOpenGoogle(prev => !prev);
        setAnchorElGoogle(textFieldRefGoogle.current);
    };

    const handleCloseGoogle = () => {
        setAnchorElGoogle(null);
        setAnchorElAdAccountGoogle(null)
        setIsDropdownOpenAdAccountGoogle(false)
        setShowCreateFormGoogle(false);
        setIsDropdownOpenGoogle(false);
    };

    const isKlaviyoListGoogle = (value: ChannelList | string): value is ChannelList => {
        return value !== null &&
            typeof value === 'object' &&
            'list_id' in value &&
            'list_name' in value;
    };

    const handleSelectOptionGoogle = (value: ChannelList | string) => {
        if (value === 'createNew') {
            setShowCreateFormGoogle(prev => !prev);
            if (!showCreateFormGoogle) {
                setAnchorElGoogle(textFieldRefGoogle.current);
            }
        } else if (isKlaviyoListGoogle(value)) {
            setSelectedOptionGoogle({
                list_id: value.list_id,
                list_name: value.list_name,
            });
            setInputListNameGoogle(value.list_name)
            setIsDropdownValidGoogle(true);
            handleCloseGoogle()
        } else {
            setIsDropdownValidGoogle(false);
            setSelectedOptionGoogle(null);
        }
    };

    const handleNewListChangeGoogle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (googleList?.some(list => list.list_name === value)) {
            setListNameError(true);
            setListNameErrorMessage('List name must be unique');
        } else {
            setListNameError(false);
            setListNameErrorMessage('');
        }
        setNewListNameGoogle(value);

        if (!value) {
            setListNameError(true);
            setListNameErrorMessage('List name is required');
        }
    };

    const handleSaveGoogle = async () => {
        let valid = true;

        if (newListNameGoogle.trim() === '') {
            setListNameError(true);
            valid = false;
        } else {
            setListNameError(false);
        }

        if (valid) {
            createNewListGoogle(newListNameGoogle)
            handleCloseGoogle();
        }
    };
    

  
    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <TextField
                    ref={textFieldRefAdAccountGoogle}
                    variant="outlined"
                    value={inputCustomerNameGoogle}
                    onClick={handleClickAdAccountGoogle}
                    size="small"
                    fullWidth
                    label={inputCustomerNameGoogle ? '' : 'Select An Account'}
                    InputLabelProps={{
                        shrink: isShrunkGoogle || inputCustomerNameGoogle !== "",
                        sx: {
                            fontFamily: 'Nunito Sans',
                            fontSize: '12px',
                            lineHeight: '16px',
                            color: 'rgba(17, 17, 19, 0.60)',
                            letterSpacing: '0.06px',
                            top: '5px',
                            '&.Mui-focused': {
                                color: 'rgba(56, 152, 252, 1)',
                            },
                        }
                    }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={handleDropdownToggleAdAccountGoogle} edge="end">
                                    {isDropdownOpenAdAccountGoogle ? <Image src='/chevron-drop-up.svg' alt='chevron-drop-up' height={24} width={24} /> : <Image src='/chevron-drop-down.svg' alt='chevron-drop-down' height={24} width={24} />}
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
                        marginBottom: '24px'

                    }}
                />
                <Menu
                    anchorEl={anchorElAdAccountGoogle}
                    open={Boolean(anchorElAdAccountGoogle) && isDropdownOpenAdAccountGoogle}
                    onClose={handleCloseAdAccountGoogle}
                    PaperProps={{
                        sx: {
                            width: anchorElAdAccountGoogle ? `${anchorElAdAccountGoogle.clientWidth}px` : '538px', borderRadius: '4px',
                            border: '1px solid #e4e4e4'
                        },
                    }}

                >
                    {customersInfo?.map((account: Customers) => (
                        <MenuItem key={account.customer_id} onClick={() => handleSelectAdAccountGoogle(account)} sx={{
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
                        ref={textFieldRefGoogle}
                        variant="outlined"
                        value={inputListNameGoogle}
                        onClick={handleClickGoogle}
                        // disabled={data?.name}
                        size="small"
                        fullWidth
                        label={inputListNameGoogle ? '' : 'Select or Create new list'}
                        InputLabelProps={{
                            shrink: inputListNameGoogle ? false : isShrunkGoogle,
                            sx: {
                                fontFamily: 'Nunito Sans',
                                fontSize: '12px',
                                lineHeight: '16px',
                                color: 'rgba(17, 17, 19, 0.60)',
                                letterSpacing: '0.06px',
                                top: '5px',
                                '&.Mui-focused': {
                                    color: 'rgba(56, 152, 252, 1)',
                                },
                            }
                        }}
                        InputProps={{

                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleDropdownToggleGoogle} edge="end">
                                        {isDropdownOpenGoogle ? <Image src='/chevron-drop-up.svg' alt='chevron-drop-up' height={24} width={24} /> : <Image src='/chevron-drop-down.svg' alt='chevron-drop-down' height={24} width={24} />}
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
                        anchorEl={anchorElGoogle}
                        open={Boolean(anchorElGoogle) && isDropdownOpenGoogle}
                        onClose={handleCloseGoogle}
                        PaperProps={{
                            sx: {
                                width: anchorElGoogle ? `${anchorElGoogle.clientWidth}px` : '538px', borderRadius: '4px',
                                border: '1px solid #e4e4e4'
                            },
                        }}
                        sx={{

                        }}
                    >
                        <MenuItem 
                            // disabled={data?.name}
                            onClick={() => handleSelectOptionGoogle('createNew')} 
                            sx={{
                                borderBottom: showCreateFormGoogle ? "none" : "1px solid #cdcdcd",
                                '&:hover': {
                                    background: 'rgba(80, 82, 178, 0.10)'
                                }
                            }}>
                            <ListItemText primary={`+ Create new list`} primaryTypographyProps={{
                                sx: {
                                    fontFamily: "Nunito Sans",
                                    fontSize: "14px",
                                    color: showCreateFormGoogle ? "rgba(56, 152, 252, 1)" : "#202124",
                                    fontWeight: "500",
                                    lineHeight: "20px",

                                }
                            }} />
                        </MenuItem>
                        {showCreateFormGoogle && (
                            <Box>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '24px',
                                    p: 2,
                                    width: anchorElGoogle ? `${anchorElGoogle.clientWidth}px` : '538px',
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
                                            value={newListNameGoogle}
                                            onChange={handleNewListChangeGoogle}
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
                                                        color: 'rgba(56, 152, 252, 1)',
                                                    },
                                                }
                                            }}
                                            InputProps={{

                                                endAdornment: (
                                                    newListNameGoogle && (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                edge="end"
                                                                onClick={() => setNewListNameGoogle('')}
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
                                                            borderColor: 'rgba(56, 152, 252, 1)',
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
                                        <Button variant="contained" onClick={handleSaveGoogle}
                                            disabled={listNameError || !newListNameGoogle}
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
                                <Divider sx={{ borderColor: '#cdcdcd' }} />
                            </Box>
                        )}
                        {googleList && googleList?.map((klaviyo) => (
                            <MenuItem key={klaviyo.list_id} onClick={() => handleSelectOptionGoogle(klaviyo)} sx={{
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
        </>
    );
  };

export default GoogleAdsContactSyncTab;