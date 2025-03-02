import { Box, Button, Drawer, IconButton, InputAdornment, List, ListItem, ListItemButton, ListItemIcon, ListItemText, TextField, Typography } from "@mui/material"
import Image from "next/image"
import MetaConnectButton from "./MetaConnectButton"
import KlaviyoIntegrationPopup from "./KlaviyoIntegrationPopup"
import AttentiveIntegrationPopup from "./AttentiveIntegrationPopup"
import { useState } from "react"
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ShopifySettings from "./ShopifySettings"
import BCommerceConnect from "./Bcommerce"
import OmnisendConnect from "./OmnisendConnect"
import MailchimpConnect from "./MailchimpConnect"
import SendlaneConnect from "./SendlaneConnect"
import SlackConnectPopup from "./SlackConnectPopup"
import WebhookConnectPopup from "./WebhookConnectPopup"
import ZapierConnectPopup from "./ZapierConnectPopup"
import GoogleADSConnectPopup from "./GoogleADSConnectPopup"


interface AvailableIntegrationsSliderProps {
    isContactSync: boolean
    integrations: any[]
    integrationsCredentials: any[]
    open: boolean
    onClose: () => void
    handleSaveSettings?: (new_integration: any) => void
}

const intergrations = {
    integrate: {
        fontFamily: "Nunito Sans",
        fontSize: "14px",
        color: "#4a4a4a",
        fontWeight: "500",
        lineHeight: "20px"
    },
  }

const AlivbleIntagrationsSlider = ({ open, isContactSync = false, integrations, integrationsCredentials, onClose, handleSaveSettings }: AvailableIntegrationsSliderProps) => {
    const [openMetaConnect, setOpenMetaConnect] = useState(false)
    const [openKlaviyoConnect, setOpenKlaviyoConnect] = useState(false)
    const [openAttentiveConnect, setAttentiveConnect] = useState(false)
    const [openShopifuConnect, setOpenShopifyConnect] = useState(false)
    const [openBigcommrceConnect, setOpenBigcommerceConnect] = useState(false)
    const [openOmnisendConnect, setOpenOmnisendConnect] = useState(false)
    const [openMailchimpConnect, setOpenMailchimpConnect] = useState(false)
    const [openSendlaneConnect, setOpenSendlaneConnect] = useState(false)
    const [openZapierConnect, setOPenZapierComnect] = useState(false)
    const [openSlackConnect, setOpenSlackConnect] = useState(false)
    const [openGoogleAdsConnect, setOpenGoogleAdsConnect] = useState(false)
    const [openWebhookConnect, setOpenWebhookConnect] = useState(false)
    const [searchQuery, setSearchQuery] = useState("");
    const handleClose = () => {
        setOpenMetaConnect(false)
        setOpenKlaviyoConnect(false)
        setOpenShopifyConnect(false)
        setAttentiveConnect(false)
        setOpenBigcommerceConnect(false)
        setOpenOmnisendConnect(false)
        setOpenSendlaneConnect(false)
        setOPenZapierComnect(false)
        setOpenSlackConnect(false)
        setOpenGoogleAdsConnect(false)
        setOpenWebhookConnect(false)
    }

    const saveIntegration = (new_integration: any) => {
        if (handleSaveSettings) {
            handleSaveSettings(new_integration)
        }
    }


    const filteredIntegrations = integrations.filter((integration) =>
        integration.service_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
      const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
      };

    if (!open) return null

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
                            backgroundColor: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.85, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                    <Typography variant="h6" className="first-sub-title" sx={{ textAlign: 'center' }}>
                        Add an Integration
                    </Typography>
                    <IconButton onClick={onClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>
                <Box>
                    <TextField
                        placeholder="Search integrations"
                        variant="outlined"
                        fullWidth
                        value={searchQuery}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start" sx={{
                                    marginRight: "4px"
                                }}>
                                    <Button
                                        sx={{ textTransform: "none", textDecoration: "none", minWidth: "auto", padding: "0" }}
                                    >
                                        <SearchIcon
                                            sx={{ color: "rgba(101, 101, 101, 1)" }}
                                            fontSize="medium"
                                        />
                                    </Button>
                                </InputAdornment>
                            ),
                            sx: {
                                paddingLeft: "12px",
                                paddingRight: "12px",
                                color: "#707071",
                                fontFamily: "Roboto",
                                fontSize: "14px",
                                fontWeight: "400",
                                lineHeight: "20px",
                                "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#e4e4e4",
                                },
                                '& .MuiOutlinedInput-input': {
                                    padding: '16px 0',
                                    fontFamily: 'Roboto',
                                    height: 'auto',
                                    '@media (max-width:600px)': {
                                        padding: '13px 0',
                                    }
                                },
                                '&::placeholder': {
                                    color: "#707071",
                                    fontFamily: "Roboto",
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    lineHeight: "20px",
                                }

                            }

                        }}
                        sx={{ px: 3, py: 2, paddingBottom: '0' }}
                    />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 5, height: '100%' }}>
                    <Box sx={{ px: 3, py: 2, width: '100%' }}>
                        <Box sx={{ px: 2, py: 3, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                            <Typography variant="h6" className='first-sub-title'>
                                Available integrations platform
                            </Typography>
                            <List sx={{ display: 'flex', gap: '16px', py: 2, flexWrap: 'wrap' }}>
                                {filteredIntegrations.some(integration => integration.service_name === 'wordpress') &&
                                    !integrationsCredentials.some(integration =>
                                        integration.service_name === 'shopify' ||
                                        integration.service_name === 'big_commerce' ||
                                        integration.service_name == 'wordpress'
                                    ) &&
                                    !isContactSync && (
                                        <ListItem sx={{
                                            p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                            '@media (max-width:600px)': {
                                                flexBasis: 'calc(50% - 8px)'
                                            }
                                        }}>
                                            <ListItemButton sx={{ p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center' }}>
                                                <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                    <Image src="/wordpress.svg" alt="wordpress" height={24} width={24} />
                                                </ListItemIcon>
                                                <ListItemText primary="WordPress" primaryTypographyProps={{
                                                    sx: {
                                                        ...intergrations.integrate
                                                    }
                                                }} />
                                            </ListItemButton>
                                        </ListItem>
                                    )}

                                {/* Klaviyo */}
                                {filteredIntegrations.some(integration => integration.service_name === 'klaviyo') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'klaviyo')) && (
                                        <ListItem sx={{
                                            p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                            '@media (max-width:600px)': {
                                                flexBasis: 'calc(50% - 8px)'
                                            }
                                        }}>
                                            <ListItemButton onClick={() => setOpenKlaviyoConnect(true)} sx={{ p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center' }}>
                                                <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                    <Image src="/klaviyo.svg" alt="klaviyo" height={26} width={32} />
                                                </ListItemIcon>
                                                <ListItemText primary="Klaviyo" primaryTypographyProps={{
                                                    sx: {
                                                        ...intergrations.integrate
                                                    }
                                                }} />
                                            </ListItemButton>
                                        </ListItem>)}

                                {/* Attentive */}
                                {filteredIntegrations.some(integration => integration.service_name === 'attentive') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'attentive')) && (
                                        <ListItem sx={{
                                            p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                            '@media (max-width:600px)': {
                                                flexBasis: 'calc(50% - 8px)'
                                            }
                                        }}>
                                            <ListItemButton onClick={() => setAttentiveConnect(true)} sx={{ p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center' }}>
                                                <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                    <Image src="/attentive.svg" alt="attentive" height={26} width={32} />
                                                </ListItemIcon>
                                                <ListItemText primary="Attentive" primaryTypographyProps={{
                                                    sx: {
                                                        ...intergrations.integrate
                                                    }
                                                }} />
                                            </ListItemButton>
                                        </ListItem>)}
                                {filteredIntegrations.some(integration => integration.service_name === 'shopify') &&
                                    !integrationsCredentials.some(integration =>
                                        integration.service_name === 'wordpess' ||
                                        integration.service_name === 'big_commerce' ||
                                        integration.service_name === 'shopify'
                                    ) &&
                                    !isContactSync && (
                                        <ListItem sx={{
                                            p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                            '@media (max-width:600px)': {
                                                flexBasis: 'calc(50% - 8px)'
                                            }
                                        }}>
                                            <ListItemButton onClick={() => setOpenShopifyConnect(true)} sx={{ p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center' }}>
                                                <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                    <Image src="/shopify-icon.svg" alt="shopify" height={26} width={32} />
                                                </ListItemIcon>
                                                <ListItemText primary="Shopify" primaryTypographyProps={{
                                                    sx: {
                                                        ...intergrations.integrate
                                                    }
                                                }} />
                                            </ListItemButton>
                                        </ListItem>)}
                                {filteredIntegrations.some(integration => integration.service_name === 'elastic') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'elastic')) && (
                                        <ListItem sx={{
                                            p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                            '@media (max-width:600px)': {
                                                flexBasis: 'calc(50% - 8px)'
                                            }
                                        }}>
                                            <ListItemButton sx={{ p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center' }}>
                                                <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                    <Image src="/elastic-icon.svg" alt="elastic" height={26} width={32} />
                                                </ListItemIcon>
                                                <ListItemText primary="Elastic" primaryTypographyProps={{
                                                    sx: {
                                                        ...intergrations.integrate
                                                    }
                                                }} />
                                            </ListItemButton>
                                        </ListItem>)}
                                {filteredIntegrations.some(integration => integration.service_name === 'meta') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'meta')) && (
                                        <ListItem sx={{
                                            p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                            '@media (max-width:600px)': {
                                                flexBasis: 'calc(50% - 8px)'
                                            }
                                        }}>
                                            <ListItemButton onClick={() => setOpenMetaConnect(true)} sx={{ p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center' }}>
                                                <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                    <Image src="/meta-icon.svg" alt="meta" height={26} width={32} />
                                                </ListItemIcon>
                                                <ListItemText primary="Meta" primaryTypographyProps={{
                                                    sx: {
                                                        ...intergrations.integrate
                                                    }
                                                }} />
                                            </ListItemButton>
                                        </ListItem>)}
                                {filteredIntegrations.some(integration => integration.service_name === 'omnisend') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'omnisend')) && (
                                        <ListItem sx={{
                                            p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                            '@media (max-width:600px)': {
                                                flexBasis: 'calc(50% - 8px)'
                                            }
                                        }}>
                                            <ListItemButton onClick={() => setOpenOmnisendConnect(true)} sx={{ p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center' }}>
                                                <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                    <Image src="/omnisend_icon_black.svg" alt="omnisend" height={26} width={32} />
                                                </ListItemIcon>
                                                <ListItemText primary="Omnisend" primaryTypographyProps={{
                                                    sx: {
                                                        ...intergrations.integrate
                                                    }
                                                }} />
                                            </ListItemButton>
                                        </ListItem>)}
                                {filteredIntegrations.some(integration => integration.service_name === 'mailchimp') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'mailchimp')) && (
                                        <ListItem sx={{
                                            p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                            '@media (max-width:600px)': {
                                                flexBasis: 'calc(50% - 8px)'
                                            }
                                        }}>
                                            <ListItemButton onClick={() => setOpenMailchimpConnect(true)} sx={{ p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center' }}>
                                                <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                    <Image src="/mailchimp-icon.svg" alt="mailchimp" height={26} width={32} />
                                                </ListItemIcon>
                                                <ListItemText primary="Mailchimp" primaryTypographyProps={{
                                                    sx: {
                                                        ...intergrations.integrate
                                                    }
                                                }} />
                                            </ListItemButton>
                                        </ListItem>)}
                                {filteredIntegrations.some(integration => integration.service_name === 'big_commerce') &&
                                    !integrationsCredentials.some(integration =>
                                        integration.service_name === 'shopify' ||
                                        integration.service_name === 'big_commerce' ||
                                        integration.service_name === 'wordpress'
                                    ) &&
                                    !isContactSync && (
                                        <ListItem sx={{
                                            p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                            '@media (max-width:600px)': {
                                                flexBasis: 'calc(50% - 8px)'
                                            }
                                        }}>
                                            <ListItemButton onClick={() => setOpenBigcommerceConnect(true)} sx={{ p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center' }}>
                                                <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                    <Image src="/bigcommerce-icon.svg" alt="bigcommerce" height={24} width={24} />
                                                </ListItemIcon>
                                                <ListItemText primary="BCommerce" primaryTypographyProps={{
                                                    sx: {
                                                        ...intergrations.integrate
                                                    }
                                                }} />
                                            </ListItemButton>
                                        </ListItem>
                                    )}
                                {filteredIntegrations.some(integration => integration.service_name === 'sendlane') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'sendlane')) && (
                                        <ListItem sx={{
                                            p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                            '@media (max-width:600px)': {
                                                flexBasis: 'calc(50% - 8px)'
                                            }
                                        }}>
                                            <ListItemButton onClick={() => setOpenSendlaneConnect(true)} sx={{ p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center' }}>
                                                <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                    <Image src="/sendlane-icon.svg" alt="sendlane" height={24} width={24} />
                                                </ListItemIcon>
                                                <ListItemText primary="Sendlane" primaryTypographyProps={{
                                                    sx: {
                                                        ...intergrations.integrate
                                                    }
                                                }} />
                                            </ListItemButton>
                                        </ListItem>
                                    )}
                                {filteredIntegrations.some(integration => integration.service_name === 'zapier') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'zapier')) && (
                                        <ListItem sx={{
                                            p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                            '@media (max-width:600px)': {
                                                flexBasis: 'calc(50% - 8px)'
                                            }
                                        }}>
                                            <ListItemButton onClick={() => setOPenZapierComnect(true)} sx={{ p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center' }}>
                                                <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                    <Image src="/zapier-icon.svg" alt="zapier" height={24} width={24} />
                                                </ListItemIcon>
                                                <ListItemText primary="Zapier" primaryTypographyProps={{
                                                    sx: {
                                                        ...intergrations.integrate
                                                    }
                                                }} />
                                            </ListItemButton>
                                        </ListItem>
                                    )}
                                {filteredIntegrations.some(integration => integration.service_name === 'webhook') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'webhook')) && (
                                        <ListItem sx={{
                                            p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                            '@media (max-width:600px)': {
                                                flexBasis: 'calc(50% - 8px)'
                                            }
                                        }}>
                                            <ListItemButton onClick={() => setOpenWebhookConnect(true)} sx={{ p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center' }}>
                                                <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                    <Image src="/webhook-icon.svg" alt="webhook" height={24} width={24} />
                                                </ListItemIcon>
                                                <ListItemText primary="Webhook" primaryTypographyProps={{
                                                    sx: {
                                                        ...intergrations.integrate
                                                    }
                                                }} />
                                            </ListItemButton>
                                        </ListItem>
                                    )}
                                {filteredIntegrations.some(integration => integration.service_name === 'slack') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'slack')) && (
                                        <ListItem sx={{
                                            p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                            '@media (max-width:600px)': {
                                                flexBasis: 'calc(50% - 8px)'
                                            }
                                        }}>
                                            <ListItemButton onClick={() => setOpenSlackConnect(true)} sx={{ p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center' }}>
                                                <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                    <Image src="/slack-icon.svg" alt="slack" height={24} width={24} />
                                                </ListItemIcon>
                                                <ListItemText primary="Slack" primaryTypographyProps={{
                                                    sx: {
                                                        ...intergrations.integrate
                                                    }
                                                }} />
                                            </ListItemButton>
                                        </ListItem>
                                    )}
                                    {filteredIntegrations.some(integration => integration.service_name === 'google_ads') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'google_ads')) && (
                                        <ListItem sx={{
                                            p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                            '@media (max-width:600px)': {
                                                flexBasis: 'calc(50% - 8px)'
                                            }
                                        }}>
                                            <ListItemButton onClick={() => setOpenGoogleAdsConnect(true)} sx={{ p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center' }}>
                                                <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                    <Image src="/google-ads.svg" alt="google_ads" height={24} width={24} />
                                                </ListItemIcon>
                                                <ListItemText primary="GoogleAds" primaryTypographyProps={{
                                                    sx: {
                                                        ...intergrations.integrate
                                                    }
                                                }} />
                                            </ListItemButton>
                                        </ListItem>
                                    )}
                            </List>
                        </Box>
                    </Box>
                </Box>
            </Drawer>
            <MetaConnectButton open={openMetaConnect} onClose={handleClose} onSave={saveIntegration} />
            <KlaviyoIntegrationPopup open={openKlaviyoConnect} handleClose={handleClose} onSave={saveIntegration} />
            <AttentiveIntegrationPopup open={openAttentiveConnect} handleClose={handleClose} onSave={saveIntegration} />
            <ShopifySettings open={openShopifuConnect} handleClose={handleClose} onSave={saveIntegration} />
            <BCommerceConnect
                open={openBigcommrceConnect}
                onClose={() => setOpenBigcommerceConnect(false)}
            />
            <OmnisendConnect open={openOmnisendConnect} handleClose={() => setOpenOmnisendConnect(false)} onSave={saveIntegration} />
            <MailchimpConnect open={openMailchimpConnect} handleClose={() => setOpenMailchimpConnect(false)} onSave={saveIntegration} />
            <SendlaneConnect open={openSendlaneConnect} handleClose={() => setOpenSendlaneConnect(false)} onSave={saveIntegration} />
            <ZapierConnectPopup open={openZapierConnect} handlePopupClose={handleClose} />
            <SlackConnectPopup open={openSlackConnect} handlePopupClose={() => setOpenSlackConnect(false)} onSave={saveIntegration} />
            <GoogleADSConnectPopup open={openGoogleAdsConnect} handlePopupClose={() => setOpenGoogleAdsConnect(false)} onSave={saveIntegration} />
            <WebhookConnectPopup open={openWebhookConnect} handleClose={() => setOpenWebhookConnect(false)} onSave={saveIntegration} />
        </>
    )
}

export default AlivbleIntagrationsSlider
