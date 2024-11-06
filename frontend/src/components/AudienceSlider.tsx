import React, { useState, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, Backdrop, TextField, InputAdornment, Divider, FormControlLabel, Radio, Collapse, Checkbox, Button, List, ListItem, ListItemIcon, ListItemButton, ListItemText, Link, Tab, Tooltip  } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showToast } from './ToastNotification';
import Image from 'next/image';
import SearchIcon from '@mui/icons-material/Search';
import ConnectKlaviyo from './ConnectKlaviyo';
import ConnectMeta from './ConnectMeta';
import { fetchUserData } from '@/services/meService';
import KlaviyoIntegrationPopup from './KlaviyoIntegrationPopup';
import MetaConnectButton from './MetaConnectButton';
import AlivbleIntagrationsSlider from './AvalibleIntegrationsSlider';
import OmnisendConnect from './OmnisendConnect';
import OnmisendDataSync from './OmnisendDataSync';
import MailchimpConnect from './MailchimpConnect';
import MailchimpDatasync from './MailchimpDatasync';
import SendlaneConnect from './SendlaneConnect';
import SendlaneDatasync from './SendlaneDatasync';

interface AudiencePopupProps {
    open: boolean;
    onClose: () => void;
    selectedLeads?: number[];
}

interface ListItem {
    audience_id: number;
    audience_name: string;
    leads_count: number;
}


interface IntegrationsCredentials {
    id?: number
    access_token?: string
    shop_domain?: string
    data_center?: string
    service_name: string
    is_with_suppression?: boolean
    is_failed?: boolean
}

interface Integrations {
    id: number
    service_name: string
    data_sync: boolean
}

const AudiencePopup: React.FC<AudiencePopupProps> = ({ open, onClose, selectedLeads }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [isExistingListsOpen, setIsExistingListsOpen] = useState<boolean>(false);
    const [listItems, setListItems] = useState<ListItem[]>([]);
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
    const [listName, setListName] = useState<string>('');
    const [plusIconPopupOpen, setPlusIconPopupOpen] = useState(false);
    const [klaviyoIconPopupOpen, setKlaviyoIconPopupOpen] = useState(false);
    const [metaIconPopupOpen, setMetaIconPopupOpen] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
    const [isExportDisabled, setIsExportDisabled] = useState(true);
    const [integrationsCredentials, setIntegrationsCredentials] = useState<IntegrationsCredentials[]>([])
    const [createKlaviyo, setCreateKlaviyo] = useState<boolean>(false)
    const [integrations, setIntegrations] = useState<Integrations[]>([])
    const [metaConnectApp, setMetaConnectApp] = useState(false)
    const [openBigcommrceConnect, setOpenBigcommerceConnect] = useState(false)
    const [openOmnisendConnect, setOpenOmnisendConnect] = useState(false)
    const [omnisendIconPopupOpen, setOpenOmnisendIconPopupOpen] = useState(false)
    const [mailchimpIconPopupOpen, setOpenMailchimpIconPopup] = useState(false)
    const [openMailchimpConnect, setOpenmailchimpConnect] = useState(false)
    const [openSendlaneIconPopupOpen, setOpenSendlaneIconPopupOpen] = useState(false)
    const [openSendlaneConnect, setOpenSendlaneConnect] = useState(false)
    const fetchListItems = async () => {
        try {
            const response = await axiosInstance.get('/audience/list');
            setListItems(response.data);
        } catch (error) {
            console.error('Error fetching list items:', error);
        }
    }; 

    useEffect(() => {
        const fetchData = async() => {
            const response = await axiosInstance.get('/integrations/')
            if(response.status === 200) {
                setIntegrations(response.data)
            }
        }
        if(open) {
            fetchData()
        }
    }, [open])

    useEffect(() => {
        const fetchData = async() => {
            try {
            const response = await axiosInstance.get('/integrations/credentials/')
            if(response.status === 200) {
                setIntegrationsCredentials(response.data)
            }
        } catch (error) {
            
        }
        }
        if(open) {
            fetchData()
        }
    }, [open])

    useEffect(() => {
        if (open) {
            fetchListItems();
        }
    }, [open]);

    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSelectedOption(value);
        if (value === 'create') {
            setIsFormOpen(true);
            setIsExistingListsOpen(false);
        } else if (value === 'existing') {
            setIsExistingListsOpen(true);
            setIsFormOpen(false);
        }
    };

    const handleOmnisendIconPopupOpenClose = () => {
        setOpenOmnisendConnect(false)
        setOpenOmnisendIconPopupOpen(false)
    }

    const toggleFormVisibility = () => {
        setIsFormOpen(!isFormOpen);
    };

    const toggleExistingListsVisibility = () => {
        setIsExistingListsOpen(!isExistingListsOpen);
    };

    const handleCheckboxChange = (audience_id: number) => {
        setCheckedItems(prev => {
            const newCheckedItems = new Set(prev);
            if (newCheckedItems.has(audience_id)) {
                newCheckedItems.delete(audience_id);
            } else {
                newCheckedItems.add(audience_id);
            }
            return newCheckedItems;
        });
    };

    const handleListNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setListName(event.target.value);
    };

    const isSaveButtonDisabled = () => {
        if (selectedOption === 'create' && listName.trim() === '') {
            return true;
        }
        if (selectedOption === 'existing' && checkedItems.size === 0) {
            return true;
        }
        if (selectedOption === null) {
            return true;
        }
        return false;
    };


    const handlePlusIconPopupOpen = () => {
        setPlusIconPopupOpen(true);
        setSelectedIntegration(null); // Reset the selection
        setIsExportDisabled(true); // Disable export button when the plus icon is clicked

    };

    const handlePlusIconPopupClose = () => {
        setPlusIconPopupOpen(false);
    };

    const handleKlaviyoIconPopupOpen = () => {
        setKlaviyoIconPopupOpen(true);
    };

    const handleOmnisendConnectOpen = () => {
        setOpenOmnisendConnect(true)
    }

    const handleOmnisendConnectClose =() => {
        setOpenOmnisendConnect(false)
        handleOmnisendIconPopupOpen()
    }

    const handleOmnisendIconPopupOpen = () => {
        setOpenOmnisendIconPopupOpen(true);
    };

    const handleKlaviyoIconPopupClose = () => {
        setKlaviyoIconPopupOpen(false);
        setOpenOmnisendConnect(false)
        setPlusIconPopupOpen(false)
    };

    const handleOpenMailchimpConnect = () => {
        setOpenmailchimpConnect(true)
    }

    const handleMailchimpIconPopupIconOpen = () => {
        setOpenMailchimpIconPopup(true)
    }

    const handleMailchimpIconPopupIconClose = () => {
        setOpenMailchimpIconPopup(false)
        setPlusIconPopupOpen(false)
    }

    const handleMetaIconPopupOpen = () => {
        setMetaIconPopupOpen(true);
    };

    const handleMetaIconPopupClose = () => {
        setMetaIconPopupOpen(false);
        setPlusIconPopupOpen(false)
    };
    
    const handleOpenMailchimpConnectClose = () => {
        setOpenmailchimpConnect(false)
    }

    const handleIntegrationSelect = (integration: string) => {
        setSelectedIntegration(integration);
        setIsExportDisabled(false); // Enable export button when an integration is selected
      };

      const handleSaveSettings = (newIntegration: any) => {
        setIntegrationsCredentials(prevIntegrations => {
            if (prevIntegrations.some(integration => integration.service_name === newIntegration.service_name)) {
                return prevIntegrations.map(integration =>
                    integration.service_name === newIntegration.service_name ? newIntegration : integration
                );
            } else {
                return [...prevIntegrations, newIntegration];
            }
        });
    };

    const handleSendlaneIconPopupOpen = () => {
        setOpenSendlaneIconPopupOpen(true)
    }

    const handleSendlaneIconPopupClose = () => {
        setOpenSendlaneIconPopupOpen(false)
    }

    const handleSendlaneConnectOpen = () => {
        setOpenSendlaneConnect(true)
    }

    const handleSendlaneConnectClose = () => {
        setOpenSendlaneConnect(false)
    }

    const handleCreateKlaviyoOpen = () => {
        setCreateKlaviyo(true)
    }

    const handleCreateKlaviyoClose = () => {
        setCreateKlaviyo(false)
    }

    const handleCloseMetaConnectApp = () => {
        setIntegrationsCredentials(prevIntegratiosn => [...prevIntegratiosn, {
            service_name: 'Meta'
        }])
        setMetaIconPopupOpen(true)
        setMetaConnectApp(false)
    }

    return (
        <>
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                PaperProps={{
                    sx: {
                        width: '620px',
                        position: 'fixed',
                        zIndex: 1301,
                        top: 0,
                        bottom: 0,
                        '@media (max-width: 600px)': {
                            width: '100%',
                        }
                    },
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 3.5, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                    <Typography variant="h6" className="first-sub-title" sx={{ textAlign: 'center',  }}>
                        Create contact sync
                    </Typography>
                    <IconButton onClick={onClose} sx={{p: 0}}>
                        <CloseIcon sx={{width: '20px', height: '20px'}} />
                    </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 5, height: '100%' }}>
                    <Box sx={{px: 3, py: 2,  width: '100%'}}>
                        <Box sx={{px: 2, py: 3, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)'}}>
                            <Typography variant="h6" className="first-sub-title">
                                Choose from integrated platform
                            </Typography>
                            <List sx={{ display: 'flex', gap: '16px', py: 2, flexWrap: 'wrap' }}>
                                {/* Meta */}
                                {integrationsCredentials.some(integration => integration.service_name === 'Meta')&&(
                                <ListItem  sx={{p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                    '@media (max-width:600px)': {
                                        flexBasis: 'calc(50% - 8px)'
                                    }
                                }}>
                                    <ListItemButton onClick={() => setMetaIconPopupOpen(true)} sx={{p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center'}}>
                                        <ListItemIcon sx={{minWidth: 'auto'}}>
                                            <Image src="/meta-icon.svg" alt="meta" height={26} width={32} />
                                        </ListItemIcon>
                                        <ListItemText primary="Meta" primaryTypographyProps={{
                                            sx: {
                                                fontFamily: "Nunito Sans",
                                                fontSize: "14px",
                                                color: "#4a4a4a",
                                                fontWeight: "500",
                                                lineHeight: "20px"
                                            }
                                        }}  />
                                    </ListItemButton>
                                </ListItem>  )}
                                {/* HubSpot */}
                                {integrationsCredentials.some(integration => integration.service_name === 'HubSpot') && (
                                    <ListItem sx={{p: 0, borderRadius: '4px', border: selectedIntegration === 'HubSpot' ? '1px solid #5052B2' : '1px solid #e4e4e4', width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)'
                                        }
                                    }}>
                                        <ListItemButton sx={{p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'HubSpot' ? 'rgba(80, 82, 178, 0.10)' : 'transparent'
                                        }}>
                                        <ListItemIcon sx={{minWidth: 'auto'}}>
                                            <Image src="/hubspot.svg" alt="hubspot" height={28} width={27} />
                                        </ListItemIcon>
                                        <ListItemText primary="HubSpot" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px"
                                                }
                                            }}/>
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {/* Klaviyo */}
                                {integrationsCredentials.some(integration => integration.service_name === 'Klaviyo') && (
                                    <ListItem sx={{
                                        p: 0,
                                        borderRadius: '4px',
                                        border: selectedIntegration === 'Klaviyo' ? '1px solid #5052B2' : '1px solid #e4e4e4',
                                        width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)',
                                        },
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 'Klaviyo')?.is_failed
                                                ? handleKlaviyoIconPopupOpen
                                                : handleCreateKlaviyoOpen
                                            } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'Klaviyo' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/klaviyo.svg" alt="klaviyo" height={26} width={32} />
                                            </ListItemIcon>
                                            <ListItemText primary="Klaviyo" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px",
                                                },
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {/* Omnisend */}
                                {integrationsCredentials.some(integration => integration.service_name === 'Omnisend') && (
                                    <ListItem sx={{
                                        p: 0,
                                        borderRadius: '4px',
                                        border: selectedIntegration === 'Omnisend' ? '1px solid #5052B2' : '1px solid #e4e4e4',
                                        width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)',
                                        },
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 'Omnisend')?.is_failed
                                                ? handleOmnisendIconPopupOpen
                                                : handleOmnisendConnectOpen
                                            } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'Omnisend' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/omnisend_icon_black.svg" alt="Omnisend" height={26} width={32} />
                                            </ListItemIcon>
                                            <ListItemText primary="Omnisend" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px",
                                                },
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {/* Mailchimp */}
                                {integrationsCredentials.some(integration => integration.service_name === 'Mailchimp') && (
                                    <ListItem sx={{
                                        p: 0,
                                        borderRadius: '4px',
                                        border: selectedIntegration === 'Mailchimp' ? '1px solid #5052B2' : '1px solid #e4e4e4',
                                        width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)',
                                        },
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 'Mailchimp')?.is_failed
                                                ? handleMailchimpIconPopupIconOpen
                                                : handleOpenMailchimpConnect
                                            } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'Mailchimp' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/mailchimp-icon.svg" alt="Mailchimp" height={26} width={32} />
                                            </ListItemIcon>
                                            <ListItemText primary="Mailchimp" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px",
                                                },
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {/* Sendlane */}
                                {integrationsCredentials.some(integration => integration.service_name === 'Sendlane') && (
                                    <ListItem sx={{
                                        p: 0,
                                        borderRadius: '4px',
                                        border: selectedIntegration === 'Sendlane' ? '1px solid #5052B2' : '1px solid #e4e4e4',
                                        width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)',
                                        },
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 'Sendlane')?.is_failed
                                                ? handleSendlaneIconPopupOpen
                                                : handleSendlaneConnectOpen
                                            } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'Mailchimp' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/sendlane-icon.svg" alt="sendlane" height={26} width={32} />
                                            </ListItemIcon>
                                            <ListItemText primary="Sendlane" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px",
                                                },
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                <ListItem sx={{
                                    p: 0,
                                    borderRadius: '4px',
                                    border: '1px dotted #5052B2',
                                    width: 'auto',
                                    '@media (max-width:600px)': {
                                        flexBasis: 'calc(50% - 8px)',
                                    },
                                }}>
                                    <ListItemButton onClick={handlePlusIconPopupOpen} sx={{
                                        p: 0,
                                        flexDirection: 'column',
                                        px: 3,
                                        py: 1.5,
                                        width: '102px',
                                        height: '72px',
                                        justifyContent: 'center',
                                    }}>
                                        <ListItemIcon sx={{ minWidth: 'auto' }}>
                                            <Image src="/add-square.svg" alt="add-square" height={36} width={40} />
                                        </ListItemIcon>
                                    </ListItemButton>
                                </ListItem>

                            </List>

                        </Box>
                    </Box>
                </Box>
            </Drawer>
            
            {/* Data Sync */}
            <ConnectKlaviyo data = {null} open={klaviyoIconPopupOpen} onClose={handleKlaviyoIconPopupClose}/>
            <ConnectMeta data = {null} open={metaIconPopupOpen} onClose={handleMetaIconPopupClose} />
            <OnmisendDataSync open={omnisendIconPopupOpen} onClose={handleOmnisendIconPopupOpenClose} data={ null } />
            <SendlaneDatasync open={openSendlaneIconPopupOpen} onClose={handleSendlaneIconPopupClose} data={ null } />
            <MailchimpDatasync open={mailchimpIconPopupOpen} onClose={handleMailchimpIconPopupIconClose} data={ null } />

            {/* Add Integration */}
            <AlivbleIntagrationsSlider open={plusIconPopupOpen} onClose={handlePlusIconPopupClose} isContactSync={true} integrations={integrations} integrationsCredentials={integrationsCredentials} handleSaveSettings={handleSaveSettings}/>
            <KlaviyoIntegrationPopup open={createKlaviyo} handleClose={handleCreateKlaviyoClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'Klaviyo')?.access_token}/>
            <MailchimpConnect onSave={handleSaveSettings} open={openMailchimpConnect} handleClose={handleOpenMailchimpConnectClose} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'Mailchimp')?.access_token}  />
            <SendlaneConnect open={openSendlaneConnect} handleClose={handleSendlaneConnectClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'Sendlane')?.access_token} />
            <OmnisendConnect open={openOmnisendConnect} handleClose={() => setOpenOmnisendConnect(false)} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'Omnisend')?.access_token} />
            <MetaConnectButton open={metaConnectApp} onClose={handleCloseMetaConnectApp} onSave={handleSaveSettings}/>
        </>
    );
};

export default AudiencePopup;