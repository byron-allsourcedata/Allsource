import { Box, Button, Divider, Drawer, IconButton, InputAdornment, Link, Switch, Tab, TextField, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close';
import Image from "next/image";
import TabPanel from '@mui/lab/TabPanel';
import TabList from '@mui/lab/TabList';
import TabContext from '@mui/lab/TabContext';
import { useEffect, useState } from 'react';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { ContentCopy } from '@mui/icons-material';



interface ApIkeyPopup {
    open: boolean
    handlePopupClose: () => void
}

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

const ZapierConnectPopup = ({open, handlePopupClose}: ApIkeyPopup) => {
    const [apiKey, setApiKey] = useState('')
    const [value, setValue] = useState('1')
    const [checked, setChecked] = useState(false);
    
    const label = { inputProps: { 'aria-label': 'Switch demo' } };
    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey);
    };

    useEffect(() => {
        const fetchApiKey = async() => {
            const response = await axiosInstance.get('/domains/api_key')
            if(response.status === 200) {
                setApiKey(response.data)
            }
        }
        fetchApiKey()
    }, [])
    

    const handleChangeTab = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };


    const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChecked(event.target.checked);
    };


    const handleLogin = async () => {
        const width = 800;  
        const height = 600; 
        const left = (window.innerWidth - width) / 2;  
        const top = (window.innerHeight - height) / 2; 
    
        const windowParams = `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`;
    
        const authWindow = window.open(
            'https://zapier.com/engine/auth/start/App215646CLIAPI@1.0.0/',
            'ZapierAuthWindow', 
            windowParams
        );
        if (authWindow) {
            const checkWindowInterval = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(checkWindowInterval);
                    console.log("Окно закрыто, процесс аутентификации завершен.");
                    
                    // Здесь можно добавить логику для обработки данных, полученных после аутентификации
                    // Например, сделать запрос для получения токена или продолжить авторизацию
                }
            }, 1000);
        } else {
            console.error("Не удалось открыть окно для аутентификации");
        }
    };
    

    if (!open) {
        return
    }

    return ( 
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
                    backgroundColor: 'rgba(0, 0, 0, .2)'
                  }
                }
              }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 3.5, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                <Typography variant="h6" sx={{ textAlign: 'center', color: '#202124', fontFamily: 'Nunito Sans', fontWeight: '600', fontSize: '16px', lineHeight: 'normal' }}>
                    Connect to Klaviyo
                </Typography>
                <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                    <Link href="https://maximizai.zohodesk.eu/portal/en/kb/articles/integrate-klaviyo-to-maximiz" target="_blank"rel="noopener noreferrer" 
                        sx={{
                            fontFamily: 'Nunito Sans',
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
                        <TabList centered aria-label="Connect to Zapier Tabs"
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
                            <Tab label="Connection" value="1" className='tab-heading' sx={klaviyoStyles.tabHeading} onClick={() => setValue('1')}/>
                            <Tab label="Suppression Sync" value="2" className='tab-heading' sx={klaviyoStyles.tabHeading} onClick={() => setValue('2')}/>
                        </TabList>
                    </Box>
                    <TabPanel value="1" sx={{ p: 0 }}>
                        <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Image src='/logo.svg' alt='Maximiz' height={26} width={32} />
                                <Typography variant="h6" sx={{
                                    fontFamily: 'Nunito Sans',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: '#202124'
                                }}>API Key</Typography>
                            </Box>
                            <Typography variant="h6" sx={{
                                    fontFamily: 'Nunito Sans',
                                    fontSize: '14px',
                                    color: '#202124ad'
                                }}>Copy your API Key — you’ll need it for Zapier login.</Typography>
                            <TextField
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                disabled
                                value={apiKey}
                                InputLabelProps={{ sx: klaviyoStyles.inputLabel }}
                                InputProps={{ sx: klaviyoStyles.formInput, endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton onClick={handleCopy} edge="end">
                                        <ContentCopy />
                                      </IconButton>
                                    </InputAdornment>
                                  )}}
                                
                            />
                            <Box sx={{display: 'flex', alignItems: 'center', gap: '8px'}} mt={2} mb={2}>
                                <Image src='/zapier-icon.svg' alt='zapier' height={24} width={24} />
                                <Typography variant="h6" sx={{
                                    fontFamily: 'Nunito Sans',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: '#202124',
                                    // marginTop: '12px',
                                    lineHeight: 'normal'
                                }}>
                                    Login to your Zapier
                                </Typography>
                            </Box>
                            <Box>
                                <Button
                                fullWidth
                                onClick={handleLogin}
                                variant="contained"
                                startIcon={<Image src='/zapier-white.svg' alt='zapier' height={24} width={24} />}
                                sx={{
                                    backgroundColor: '#f24e1e',
                                    fontFamily: "Nunito Sans",
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    lineHeight: '17px',
                                    letterSpacing: '0.25px',
                                    color: "#fff",
                                    textTransform: 'none',
                                    padding: '14.5px 24px',
                                    '&:hover': {
                                    backgroundColor: '#f24e1e'
                                    },
                                    borderRadius: '6px',
                                    border: '1px solid #f24e1e',
                                }}
                                >
                                Connect to Zapier
                                </Button>
                            </Box>
                        </Box>
                              
                </TabPanel>
                <TabPanel value="2" sx={{ p: 0 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Image src='/zapier-icon.svg' alt='zapier' height={26} width={32} />
                                    <Typography variant="h6" sx={{
                                        fontFamily: 'Nunito Sans',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#202124',
                                        lineHeight: 'normal'
                                    }}>Eliminate Redundancy: Stop Paying for Contacts You Already Own</Typography>
                                </Box>
                                <Typography variant="subtitle1" sx={{
                                    fontFamily: 'Roboto',
                                    fontSize: '12px',
                                    fontWeight: '400',
                                    color: '#808080',
                                    lineHeight: '20px',
                                    letterSpacing: '0.06px'
                                }}>Sync your current list to avoid collecting contacts you already possess.
                                    Newly added contacts in Zapier will be automatically suppressed each day.</Typography>


                                <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <Typography variant="subtitle1" sx={{
                                        fontFamily: 'Roboto',
                                        fontSize: '12px',
                                        fontWeight: '400',
                                        color: '#808080',
                                        lineHeight: 'normal',
                                        letterSpacing: '0.06px'
                                    }}>
                                        Enable Automatic Contact Suppression
                                    </Typography>

                                    {/* Switch Control with Yes/No Labels */}
                                    <Box position="relative" display="inline-block">
                                        <Link variant='h6' sx={{
                                            fontFamily: 'Nunito Sans',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            lineHeight: '20px',
                                            color: '#5052b2',
                                            cursor: 'pointer',
                                            textDecorationColor: '#5052b2'
                                            }}>Tutorial</Link>
                                    </Box>
                                </Box>




                            </Box>
                            <Box sx={{ background: '#efefef', borderRadius: '4px', px: 1.5, py: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Image src='/info-circle.svg' alt='info-circle' height={20} width={20} />
                                    <Typography variant="subtitle1" sx={{
                                        fontFamily: 'Roboto',
                                        fontSize: '12px',
                                        fontWeight: '400',
                                        color: '#808080',
                                        lineHeight: '20px',
                                        letterSpacing: '0.06px'
                                    }}>By performing this action, all your Zapier contacts will be added to your Grow suppression list, and new contacts will be imported daily around 6pm EST.</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </TabPanel>
                </TabContext>
                </Box>
                <Box sx={{ px: 2, py: 3.5, width: '100%', border: '1px solid #e4e4e4' }}>
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        onClick={handlePopupClose}
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
                            boxShadow:'0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                            '&:hover': {
                                backgroundColor: '#5052B2'
                            },
                            borderRadius: '4px',
                        }}
                    >
                        Close
                    </Button>
                    </Box>
                </Box>                  
            </Box>
        </Drawer>
     );
}
 
export default ZapierConnectPopup;