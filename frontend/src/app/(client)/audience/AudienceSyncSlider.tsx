import React, { useState, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, List, ListItem, ListItemIcon, ListItemButton, ListItemText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from '@/components//ToastNotification';
import Image from 'next/image';
import ConnectKlaviyo from '@/app/(client)/data-sync/components/ConnectKlaviyo';
import ConnectMeta from './SyncMetaSlider';
import KlaviyoIntegrationPopup from '@/components/KlaviyoIntegrationPopup';
import SlackIntegrationPopup from '@/components//SlackIntegrationPopup';
import MetaConnectButton from '@/components//MetaConnectButton';
import AlivbleIntagrationsSlider from '@/components//AvalibleIntegrationsSlider';
import WebhookConnectPopup from '@/components//WebhookConnectPopup';
import OmnisendConnect from '@/components//OmnisendConnect';
import OnmisendDataSync from '@/app/(client)/data-sync/components/OmnisendDataSync';
import MailchimpConnect from '@/components/MailchimpConnect';
import MailchimpDatasync from '@/app/(client)/data-sync/components/MailchimpDatasync';
import WebhookDatasync from '@/app/(client)/data-sync/components/WebhookDatasync';
import SlackDatasync from '@/app/(client)/data-sync/components/SlackDataSync';
import SendlaneConnect from '@/components/SendlaneConnect';
import SendlaneDatasync from '@/app/(client)/data-sync/components/SendlaneDatasync';
import ZapierDataSync from '@/app/(client)/data-sync/components/ZapierDataSync';

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
    const [createSlack, setCreateSlack] = useState<boolean>(false)
    const [createWebhook, setCreateWebhook] = useState<boolean>(false)
    const [integrations, setIntegrations] = useState<Integrations[]>([])
    const [metaConnectApp, setMetaConnectApp] = useState(false)
    const [openBigcommrceConnect, setOpenBigcommerceConnect] = useState(false)
    const [openOmnisendConnect, setOpenOmnisendConnect] = useState(false)
    const [omnisendIconPopupOpen, setOpenOmnisendIconPopupOpen] = useState(false)
    const [mailchimpIconPopupOpen, setOpenMailchimpIconPopup] = useState(false)
    const [webhookIconPopupOpen, setOpenWebhookIconPopup] = useState(false)
    const [slackIconPopupOpen, setOpenSlackIconPopup] = useState(false)
    const [openMailchimpConnect, setOpenmailchimpConnect] = useState(false)
    const [openSendlaneIconPopupOpen, setOpenSendlaneIconPopupOpen] = useState(false)
    const [openSendlaneConnect, setOpenSendlaneConnect] = useState(false)
    const [openZapierDataSync, setOpenZapierDataSync] = useState(false)
    const [openZapierConnect, setOpenZapierConnect] = useState(false)
    const fetchListItems = async () => {
        try {
            const response = await axiosInstance.get('/audience/list');
            setListItems(response.data);
        } catch (error) {
            showErrorToast('Error fetching list items');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const response = await axiosInstance.get('/integrations/')
            if (response.status === 200) {
                setIntegrations(response.data)
            }
        }
        if (open) {
            fetchData()
        }
    }, [open])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axiosInstance.get('/integrations/credentials/')
                if (response.status === 200) {
                    setIntegrationsCredentials(response.data)
                }
            } catch (error) {

            }
        }
        if (open) {
            fetchData()
        }
    }, [open])

    useEffect(() => {
        if (open) {
            fetchListItems();
        }
    }, [open]);


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

    const handleOmnisendConnectClose = () => {
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

    const handleSlackIconPopupIconOpen = () => {
        setOpenSlackIconPopup(true)
    }

    const handleWebhookIconPopupIconOpen = () => {
        setOpenWebhookIconPopup(true)
    }

    const handleMailchimpIconPopupIconOpen = () => {
        setOpenMailchimpIconPopup(true)
    }

    const handleSlackConnectOpen = () => {
        setOpenSlackIconPopup(true)
    }

    const handleMailchimpIconPopupIconClose = () => {
        setOpenMailchimpIconPopup(false)
        setPlusIconPopupOpen(false)
    }

    const handleWebhookIconPopupIconClose = () => {
        setOpenWebhookIconPopup(false)
        setPlusIconPopupOpen(false)
    }

    const handleSlackIconPopupIconClose = () => {
        setOpenSlackIconPopup(false)
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
        const service = newIntegration.service_name
        switch (service) {
            case 'Meta':
                handleMetaIconPopupOpen()
                break
            case 'Klaviyo':
                handleKlaviyoIconPopupOpen()
                break
            case 'Mailchimp':
                handleMailchimpIconPopupIconOpen()
                break
            case 'Omnisend':
                handleOmnisendIconPopupOpen()
                break
            case 'Sendlane':
                handleSendlaneIconPopupOpen()
                break
            case 'Slack':
                handleSlackIconPopupIconOpen()
                break
            case 'Webhook':
                handleWebhookIconPopupIconOpen()
                break  
        }
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

    const handleCreateSlackClose = () => {
        setCreateSlack(false)
    }

    const handleCreateWebhookClose = () => {
        setCreateWebhook(false)
    }

    const handleOpenZapierDataSync = () => {
        setOpenZapierDataSync(true)
    }

    const handleOpenZapierConnect = () => {
        setOpenZapierConnect(true)
    }

    const handleCloseZapierConnect = () => {
        setOpenZapierConnect(false)
    }

    const handleCloseZapierDataSync = () => {
        setOpenZapierDataSync(false)
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
                slotProps={{
                    backdrop: {
                        sx: {
                            backgroundColor: 'rgba(0, 0, 0, 0.125)'
                        }
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.85, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                    <Typography variant="h6" className="first-sub-title" sx={{ textAlign: 'center', }}>
                        Audience Sync
                    </Typography>
                    <IconButton onClick={onClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 5, height: '100%' }}>
                    <Box sx={{ px: 3, py: 2, width: '100%' }}>
                        <Box sx={{ px: 2, py: 3, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                            <Typography variant="h6" className="first-sub-title">
                                Choose from integrated platform
                            </Typography>
                            <List sx={{ display: 'flex', gap: '16px', py: 2, flexWrap: 'wrap' }}>
                                {/* Meta */}
                                {integrationsCredentials.some(integration => integration.service_name === 'meta') && (
                                    <ListItem sx={{
                                        p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)'
                                        }
                                    }}>
                                        <ListItemButton onClick={() => setMetaIconPopupOpen(true)} sx={{ p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center' }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
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
                                            }} />
                                        </ListItemButton>
                                    </ListItem>)}
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
            <ConnectKlaviyo data={null} open={klaviyoIconPopupOpen} onClose={handleKlaviyoIconPopupClose} />
            <ConnectMeta data={null} open={metaIconPopupOpen} onClose={handleMetaIconPopupClose} />
            <OnmisendDataSync open={omnisendIconPopupOpen} onClose={handleOmnisendIconPopupOpenClose} isEdit={false} data={null} />
            <SendlaneDatasync open={openSendlaneIconPopupOpen} onClose={handleSendlaneIconPopupClose} data={null} isEdit={false} />
            <MailchimpDatasync open={mailchimpIconPopupOpen} onClose={handleMailchimpIconPopupIconClose} data={null} />
            <WebhookDatasync open={webhookIconPopupOpen} onClose={handleWebhookIconPopupIconClose} data={null} isEdit={false}/>
            <SlackDatasync open={slackIconPopupOpen} onClose={handleSlackIconPopupIconClose} data={null} isEdit={false} />
            <ZapierDataSync open={openZapierDataSync} handleClose={handleCloseZapierDataSync} />

            {/* Add Integration */}
            <AlivbleIntagrationsSlider open={plusIconPopupOpen} onClose={handlePlusIconPopupClose} isContactSync={true} integrations={integrations} integrationsCredentials={integrationsCredentials} handleSaveSettings={handleSaveSettings} />
            <WebhookConnectPopup open={createWebhook} handleClose={handleCreateWebhookClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'webhook')?.access_token} />
            <SlackIntegrationPopup open={createSlack} handleClose={handleCreateSlackClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'slack')?.access_token} />
            <KlaviyoIntegrationPopup open={createKlaviyo} handleClose={handleCreateKlaviyoClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'klaviyo')?.access_token} />
            <MailchimpConnect onSave={handleSaveSettings} open={openMailchimpConnect} handleClose={handleOpenMailchimpConnectClose} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'Mailchimp')?.access_token} />
            <SendlaneConnect open={openSendlaneConnect} handleClose={handleSendlaneConnectClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'Sendlane')?.access_token} />
            <OmnisendConnect open={openOmnisendConnect} handleClose={() => setOpenOmnisendConnect(false)} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'Omnisend')?.access_token} />
            <MetaConnectButton open={metaConnectApp} onClose={handleCloseMetaConnectApp} onSave={handleSaveSettings} />
        </>
    );
};

export default AudiencePopup;