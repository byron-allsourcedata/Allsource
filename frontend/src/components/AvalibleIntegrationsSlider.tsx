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


interface AvailableIntegrationsSliderProps {
    isContactSync: boolean
    integrations: any[]
    integrationsCredentials: any[]
    open: boolean
    onClose: () => void
}

const AlivbleIntagrationsSlider = ({open, isContactSync = false, integrations, integrationsCredentials, onClose}: AvailableIntegrationsSliderProps) => {
    const [openMetaConnect, setOpenMetaConnect] = useState(false)
    const [openKlaviyoConnect, setOpenKlaviyoConnect] = useState(false)
    const [openAttentiveConnect, setAttentiveConnect] = useState(false)
    const [openShopifuConnect, setOpenShopifyConnect] = useState(false)
    const [openBigcommrceConnect, setOpenBigcommerceConnect] = useState(false)
    const [openOmnisendConnect, setOpenOmnisendConnect] = useState(false)
    const [openMailchimpConnect, setOpenMailchimpConnect] = useState(false)
    const [openSendlaneConnect, setOpenSendlaneConnect] = useState(false)

    const handleClose = () => {
        setOpenMetaConnect(false)
        setOpenKlaviyoConnect(false)
        setOpenShopifyConnect(false)
        setAttentiveConnect(false)
        setOpenBigcommerceConnect(false)
        setOpenOmnisendConnect(false)
        setOpenSendlaneConnect(false)
    }

    const handleSave = () => {}

    if(!open) return null

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
                backgroundColor: 'rgba(0, 0, 0, .1)'
              }
            }
          }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 3.5, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                    <Typography variant="h6" className="first-sub-title" sx={{ textAlign: 'center' }}>
                        Add an Integration
                    </Typography>
                    <IconButton onClick={onClose} sx={{p: 0}}>
                        <CloseIcon sx={{width: '20px', height: '20px'}} />
                    </IconButton>
                </Box>
                <Box>
                <TextField
                    placeholder="Search integrations"
                    variant="outlined"
                    fullWidth
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
                    <Box sx={{px: 3, py: 2,  width: '100%'}}>
                        <Box sx={{px: 2, py: 3, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)'}}>
                            <Typography variant="h6" className='first-sub-title'>
                                Available integrations platform
                            </Typography>
                            <List sx={{ display: 'flex', gap: '16px', py: 2, flexWrap: 'wrap' }}>
                                {integrations.some(integration => integration.service_name === 'WordPress') &&
                                    !integrationsCredentials.some(integration =>  
                                        integration.service_name === 'Shopify' || 
                                        integration.service_name === 'Bigcommerce' ||
                                        integration.service_name == 'WordPress'
                                    ) && 
                                    !isContactSync && (
                                    <ListItem sx={{p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)'
                                        }
                                    }}>
                                        <ListItemButton sx={{p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center'}}>
                                        <ListItemIcon sx={{minWidth: 'auto'}}>    
                                            <Image src="/wordpress.svg" alt="wordpress" height={24} width={24} />
                                        </ListItemIcon>
                                        <ListItemText primary="WordPress" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px"
                                                }
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}

                                {/* Klaviyo */}
                                {integrations.some(integration => integration.service_name === 'Klaviyo') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'Klaviyo') )&&(
                                    <ListItem sx={{p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                    '@media (max-width:600px)': {
                                        flexBasis: 'calc(50% - 8px)'
                                    }
                                }}>
                                    <ListItemButton onClick={() => setOpenKlaviyoConnect(true)} sx={{p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center'}}>
                                        <ListItemIcon sx={{minWidth: 'auto'}}>
                                            <Image src="/klaviyo.svg" alt="klaviyo" height={26} width={32} />
                                        </ListItemIcon>
                                        <ListItemText primary="Klaviyo" primaryTypographyProps={{
                                            sx: {
                                                fontFamily: "Nunito Sans",
                                                fontSize: "14px",
                                                color: "#4a4a4a",
                                                fontWeight: "500",
                                                lineHeight: "20px"
                                            }
                                        }}  />
                                    </ListItemButton>
                                </ListItem> )}

                            {/* Attentive */}
                            {integrations.some(integration => integration.service_name === 'Attentive') && (
                                !integrationsCredentials.some(integration => integration.service_name === 'Attentive') )&&(
                                <ListItem sx={{p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                '@media (max-width:600px)': {
                                    flexBasis: 'calc(50% - 8px)'
                                }
                            }}>
                                <ListItemButton onClick={() => setAttentiveConnect(true)} sx={{p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center'}}>
                                    <ListItemIcon sx={{minWidth: 'auto'}}>
                                        <Image src="/attentive.svg" alt="Attentive" height={26} width={32} />
                                    </ListItemIcon>
                                    <ListItemText primary="Attentive" primaryTypographyProps={{
                                        sx: {
                                            fontFamily: "Nunito Sans",
                                            fontSize: "14px",
                                            color: "#4a4a4a",
                                            fontWeight: "500",
                                            lineHeight: "20px"
                                        }
                                    }}  />
                                </ListItemButton>
                            </ListItem> )}



                                {integrations.some(integration => integration.service_name === 'Zepier') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'Zepier') )&&(
                                <ListItem sx={{p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                    '@media (max-width:600px)': {
                                        flexBasis: 'calc(50% - 8px)'
                                    }
                                }}>
                                    <ListItemButton sx={{p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center'}}>
                                        <ListItemIcon sx={{minWidth: 'auto'}}>
                                            <Image src="/zapier-icon.svg" alt="zapier" height={26} width={32} />
                                        </ListItemIcon>
                                        <ListItemText primary="Zapier" primaryTypographyProps={{
                                            sx: {
                                                fontFamily: "Nunito Sans",
                                                fontSize: "14px",
                                                color: "#4a4a4a",
                                                fontWeight: "500",
                                                lineHeight: "20px"
                                            }
                                        }}  />
                                    </ListItemButton>
                                </ListItem>
                                    )}
                                    {integrations.some(integration => integration.service_name === 'Shopify') &&
                                    !integrationsCredentials.some(integration => 
                                        integration.service_name === 'WordPress' || 
                                        integration.service_name === 'Bigcommerce' ||
                                        integration.service_name === 'Shopify'
                                    ) && 
                                    !isContactSync && (
                                <ListItem sx={{p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                    '@media (max-width:600px)': {
                                        flexBasis: 'calc(50% - 8px)'
                                    }
                                }}>
                                    <ListItemButton onClick={() => setOpenShopifyConnect(true)} sx={{p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center'}}>
                                        <ListItemIcon sx={{minWidth: 'auto'}}>
                                            <Image src="/shopify-icon.svg" alt="shopify" height={26} width={32} />
                                        </ListItemIcon>
                                        <ListItemText primary="Shopify" primaryTypographyProps={{
                                            sx: {
                                                fontFamily: "Nunito Sans",
                                                fontSize: "14px",
                                                color: "#4a4a4a",
                                                fontWeight: "500",
                                                lineHeight: "20px"
                                            }
                                        }}  />
                                    </ListItemButton>
                                </ListItem> )}
                                {integrations.some(integration => integration.service_name === 'Elastic') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'Elastic') )&&(
                                <ListItem sx={{p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                    '@media (max-width:600px)': {
                                        flexBasis: 'calc(50% - 8px)'
                                    }
                                }}>
                                    <ListItemButton sx={{p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center'}}>
                                        <ListItemIcon sx={{minWidth: 'auto'}}>
                                            <Image src="/elastic-icon.svg" alt="elastic" height={26} width={32} />
                                        </ListItemIcon>
                                        <ListItemText primary="Elastic" primaryTypographyProps={{
                                            sx: {
                                                fontFamily: "Nunito Sans",
                                                fontSize: "14px",
                                                color: "#4a4a4a",
                                                fontWeight: "500",
                                                lineHeight: "20px"
                                            }
                                        }}  />
                                    </ListItemButton>
                                </ListItem> )}
                                {integrations.some(integration => integration.service_name === 'Meta') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'Meta') )&&(
                                <ListItem  sx={{p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                    '@media (max-width:600px)': {
                                        flexBasis: 'calc(50% - 8px)'
                                    }
                                }}>
                                    <ListItemButton onClick={() => setOpenMetaConnect(true)} sx={{p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center'}}>
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
                                </ListItem> )}
                                {integrations.some(integration => integration.service_name === 'Omnisend') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'Omnisend') )&&(
                                <ListItem sx={{p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                    '@media (max-width:600px)': {
                                        flexBasis: 'calc(50% - 8px)'
                                    }
                                }}>
                                    <ListItemButton onClick={() => setOpenOmnisendConnect(true)} sx={{p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center'}}>
                                        <ListItemIcon sx={{minWidth: 'auto'}}>
                                            <Image src="/omnisend_icon_black.svg" alt="Omnisend" height={26} width={32} />
                                        </ListItemIcon>
                                        <ListItemText primary="Omnisend" primaryTypographyProps={{
                                            sx: {
                                                fontFamily: "Nunito Sans",
                                                fontSize: "14px",
                                                color: "#4a4a4a",
                                                fontWeight: "500",
                                                lineHeight: "20px"
                                            }
                                        }}  />
                                    </ListItemButton>
                                </ListItem> )}
                                {integrations.some(integration => integration.service_name === 'Mailchimp') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'Mailchimp') )&&(
                                <ListItem sx={{p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                    '@media (max-width:600px)': {
                                        flexBasis: 'calc(50% - 8px)'
                                    }
                                }}>
                                    <ListItemButton onClick={() => setOpenMailchimpConnect(true)} sx={{p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center'}}>
                                        <ListItemIcon sx={{minWidth: 'auto'}}>
                                            <Image src="/mailchimp-icon.svg" alt="Mailchimp" height={26} width={32} />
                                        </ListItemIcon>
                                        <ListItemText primary="Mailchimp" primaryTypographyProps={{
                                            sx: {
                                                fontFamily: "Nunito Sans",
                                                fontSize: "14px",
                                                color: "#4a4a4a",
                                                fontWeight: "500",
                                                lineHeight: "20px"
                                            }
                                        }}  />
                                    </ListItemButton>
                                </ListItem> )}
                                {integrations.some(integration => integration.service_name === 'BigCommerce') &&
                                    !integrationsCredentials.some(integration =>  
                                        integration.service_name === 'Shopify' || 
                                        integration.service_name === 'BigCommerce' ||
                                        integration.service_name === 'WordPress'
                                    ) && 
                                    !isContactSync && (
                                    <ListItem sx={{p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)'
                                        }
                                    }}>
                                        <ListItemButton onClick={() => setOpenBigcommerceConnect(true)} sx={{p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center'}}>
                                        <ListItemIcon sx={{minWidth: 'auto'}}>    
                                            <Image src="/bigcommerce-icon.svg" alt="BigCommerce" height={24} width={24} />
                                        </ListItemIcon>
                                        <ListItemText primary="BCommerce" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px"
                                                }
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {integrations.some(integration => integration.service_name === 'Sendlane') && (
                                    !integrationsCredentials.some(integration => integration.service_name === 'Sendlane') )&&(
                                    <ListItem sx={{p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)'
                                        }
                                    }}>
                                        <ListItemButton onClick={() => setOpenSendlaneConnect(true)} sx={{p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center'}}>
                                        <ListItemIcon sx={{minWidth: 'auto'}}>    
                                            <Image src="/sendlane-icon.svg" alt="sendlane" height={24} width={24} />
                                        </ListItemIcon>
                                        <ListItemText primary="Sendlane" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px"
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
        <MetaConnectButton open={openMetaConnect} onClose={handleClose} onSave={() => { }}/>
        <KlaviyoIntegrationPopup open={openKlaviyoConnect} handleClose={handleClose} onSave={handleSave}/>
        <AttentiveIntegrationPopup open={openAttentiveConnect} handleClose={handleClose} onSave={handleSave}/>
        <ShopifySettings open={openShopifuConnect} handleClose={handleClose} onSave={handleSave} />
        <BCommerceConnect 
                    open={openBigcommrceConnect} 
                    onClose={() => setOpenBigcommerceConnect(false)}
                    onSave={() => { }}
                />
        <OmnisendConnect open={openOmnisendConnect} handleClose={() => setOpenOmnisendConnect(false)} onSave={() => { }} />
        <MailchimpConnect open={openMailchimpConnect} handleClose={() => setOpenMailchimpConnect(false)} onSave={() => { }} />
        <SendlaneConnect open={openSendlaneConnect} handleClose={() => setOpenSendlaneConnect(false)} onSave={() => { }} />
        </>
    )
}

export default AlivbleIntagrationsSlider