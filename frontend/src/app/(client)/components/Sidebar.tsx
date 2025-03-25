'use client';
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, LinearProgress, Typography, Collapse } from '@mui/material';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import LeadsIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import IntegrationsIcon from '@mui/icons-material/IntegrationInstructions';
import BusinessIcon from '@mui/icons-material/Business';
import FeaturedPlayListIcon from '@mui/icons-material/FeaturedPlayList';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import Image from 'next/image';
import { AxiosError } from 'axios';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { useUser } from '@/context/UserContext';
import ContactsIcon from '@mui/icons-material/Contacts';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import LegendToggleIcon from '@mui/icons-material/LegendToggle';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InsightsIcon from '@mui/icons-material/Insights';
import { display } from '@mui/system';

const sidebarStyles = {
    container: {
        width: '100%',
        flexShrink: 0,
        fontFamily: 'Nunito Sans',
        fontSize: '14px',
        fontWeight: '400',
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRight: '1px solid rgba(228, 228, 228, 1)',
        height: 'calc(100vh - 4.25rem)',
        maxWidth: '146px',
        display: 'flex',
        overflow: 'hidden',
        flexDirection: 'column',
        justifyContent: 'start',
        position: 'relative'
    },
    menu: {
        alignItems: 'center',
        paddingTop: '0 !important',
        paddingBottom: '2.75rem !important',
        '& .MuiListItem-root': {
            paddingBottom: '1rem',
            paddingTop: '1rem',
            '&:hover': {
                backgroundColor: '#e0e0e0',
            },
        },
        '& .MuiListItemText-root': {
            marginTop: '0px !important',
            marginBottom: '0px !important',
        },
        '& span.MuiTypography-root': {
            fontFamily: 'Nunito Sans',
            fontSize: '0.875rem',
            fontWeight: 400,
            lineHeight: 'normal',
        }
    },
    listItemIcon: {
        minWidth: '24px',
        marginRight: '4px',
    },
    footer: {
        padding: '1rem',
        '& .MuiListItem-root': {

        },
    },
    settings: {
        alignItems: 'center',
        paddingTop: '0 !important',
        '& .MuiListItem-root': {
            paddingBottom: '1rem',
            paddingTop: '1rem',
            '&:hover': {
                backgroundColor: '#e0e0e0',
            },
        },
        '& .MuiListItemText-root': {
            marginTop: '0px !important',
            marginBottom: '0px !important',
        },
        '& span.MuiTypography-root': {
            fontFamily: 'Nunito Sans',
            fontSize: '0.875rem',
            fontWeight: 400,
            lineHeight: 'normal'
        }
    },
    setupSection: {
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        marginLeft: '1rem',
        marginRight: '1rem',
        border: '1px solid #e4e4e4',
        borderRadius: '8px',
        backgroundColor: '#fff',
        marginBottom: '1rem',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    },
    ListItem: {
        minHeight: '4.5em',
        color: 'rgba(59, 59, 59, 1)',
        ml: '3px'
    },
    activeItem: {
        borderLeft: '3px solid rgba(80, 82, 178, 1)',
        color: 'rgba(80, 82, 178, 1)',
        minHeight: '4.5em',
        '& .MuiSvgIcon-root': {
            color: 'rgba(80, 82, 178, 1)',
        },
    },
};

const containerStyles = (hasNotification: boolean) => ({
    container: {
        width: '100%',
        flexShrink: 0,
        fontFamily: 'Nunito Sans',
        fontSize: '14px',
        fontWeight: '400',
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRight: '1px solid rgba(228, 228, 228, 1)',
        height: hasNotification ? 'calc(100vh - 6.85rem)' : 'calc(100vh - 4.25rem)',
        maxWidth: '170px',
        display: 'flex',
        overflow: 'hidden',
        flexDirection: 'column',
        justifyContent: 'start',
        position: 'relative'
    }
})

interface ProgressSectionProps {
    percent_steps: number;
}

const SetupSection: React.FC<ProgressSectionProps> = ({ percent_steps }) => {
    if (percent_steps > 50) {
        return null
    }

    return (
        <Box sx={sidebarStyles.setupSection}>
            <Box display="flex" alignItems="center" mb={2}>
                <Image src={'/Vector9.svg'} alt="Setup" width={20} height={20} />
                <Typography variant="h6" component="div" ml={1} sx={{
                    fontFamily: 'Nunito Sans',
                    fontWeight: '400',
                    lineHeight: 'normal',
                    color: 'rgba(0, 0, 0, 1)',
                    fontSize: '0.875rem'
                }}>
                    Setup
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={percent_steps ? percent_steps : 0}
                sx={{
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: "rgba(219, 219, 219, 1)",
                    '& .MuiLinearProgress-bar': {
                        backgroundColor: 'rgba(110, 193, 37, 1)',
                    },
                }}
            />
            <Typography variant="body2" color="textSecondary" mt={1} sx={{
                fontFamily: 'Roboto',
                lineHeight: 'normal',
                color: 'rgba(120, 120, 120, 1)',
                fontSize: '0.625rem'
            }}>
                {percent_steps ? percent_steps : 0}% complete
            </Typography>
        </Box>
    )
};


interface SidebarProps {
    setShowSlider: Dispatch<SetStateAction<boolean>>;
    setLoading: Dispatch<SetStateAction<boolean>>;
    hasNotification: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ setShowSlider, setLoading, hasNotification }) => {
    const { domains, partner, backButton } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [currentDomain, setCurrentDomain] = useState<string | null>(null);
    const [activatePercent, setActivatePercent] = useState<number>(0);
    const [isPartnerAvailable, setIsPartnerAvailable] = useState(false);
    const isAuthorized = useRef(false);
    useEffect(() => {
        const storedDomain = sessionStorage.getItem('current_domain');
        if (storedDomain) {
            setCurrentDomain(storedDomain);
        }
    }, []);

    const checkPartner = () => {
        
        const storedMe = localStorage.getItem('account_info');
        let partner = false
        if (storedMe) {
            const storedData = JSON.parse(storedMe);
            partner = storedData.partner
            setIsPartnerAvailable(partner)
        }
        else {
            setIsPartnerAvailable(false)
        }
    }

    useEffect(() => {
        if (currentDomain) {
            const domain = domains.find(d => d.domain === currentDomain);
            if (domain) {
                setActivatePercent(domain.activate_percent);
            }
        }
    }, [currentDomain]);

    useEffect(() => {
        checkPartner()
    }, [backButton]);


    const handleNavigation = async (route: string) => {
        try {
            setLoading(true);

            if (isAuthorized.current) {
                router.push(route);
                return;
            }

            const response = await axiosInstance.get('/check-user-authorization');
            const status = response.data.status;

            if (status === "SUCCESS") {
                isAuthorized.current = true;
                router.push(route);
            } else if (status === "NEED_BOOK_CALL") {
                sessionStorage.setItem("is_slider_opened", "true");
                setShowSlider(true);
            } else {
                router.push(route);
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response?.status === 403) {
                    if (error.response.data.status === "NEED_BOOK_CALL") {
                        sessionStorage.setItem("is_slider_opened", "true");
                        setShowSlider(true);
                    } else {
                        setShowSlider(false);
                        router.push(route);
                    }
                } else {
                }
            } else {
            }
        } finally {
            setLoading(false);
        }
    };

    const isActive = (path: string) => pathname.startsWith(path);

    const [open, setOpen] = useState(false);
    const isPixelActive = isActive('/leads') || isActive('/company') || isActive('/suppressions') || isActive('/dashboard');
    const handleClick = () => {
        setOpen(!open);
    };

    return (
        <Box sx={containerStyles(hasNotification).container} >
            {/* Audience-dashboard */}
            <List sx={sidebarStyles.menu}>
                <ListItem button onClick={() => handleNavigation('/audience-dashboard')} sx={isActive('/audience-dashboard') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <SpaceDashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                </ListItem>
                {/* PIXEL */}
                <List sx={{ width: 250, p: 0 }}>
                    <ListItem 
                    button 
                    onClick={handleClick} 
                    sx={isPixelActive ? sidebarStyles.activeItem : sidebarStyles.ListItem}
                >

                    <Box sx={{ display: "flex", alignItems: 'center', justifyContent: 'space-between' }}>
                        <ListItemIcon sx={sidebarStyles.listItemIcon}>
                            <LegendToggleIcon />
                        </ListItemIcon>
                        <ListItemText primary="Pixel" sx={{ marginRight: 2 }} />
                        {open ? (
                            <ExpandLessIcon />
                        ) : (
                            <ExpandMoreIcon />
                        )}
                    </Box>
                </ListItem>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {/* Insights */}
                            <ListItem 
                                button 
                                onClick={() => handleNavigation('/dashboard')} 
                                sx={isActive('/dashboard') ? { ...sidebarStyles.activeItem, pl: 4 } : { ...sidebarStyles.ListItem, pl: 4 }}
                            >
                                <ListItemIcon sx={sidebarStyles.listItemIcon}>
                                    <InsightsIcon />
                                </ListItemIcon>
                                <ListItemText primary="Insights" />
                            </ListItem>
                            
                            {/* Contacts */}
                            <ListItem 
                                button 
                                onClick={() => handleNavigation('/leads')} 
                                sx={isActive('/leads') ? { ...sidebarStyles.activeItem, pl: 4 } : { ...sidebarStyles.ListItem, pl: 4 }}
                            >
                                <ListItemIcon sx={sidebarStyles.listItemIcon}>
                                    <LeadsIcon />
                                </ListItemIcon>
                                <ListItemText primary="Contacts" />
                            </ListItem>

                            {/* Company */}
                            <ListItem 
                                button 
                                onClick={() => handleNavigation('/company')} 
                                sx={isActive('/company') ? { ...sidebarStyles.activeItem, pl: 4 } : { ...sidebarStyles.ListItem, pl: 4 }}
                            >
                                <ListItemIcon sx={sidebarStyles.listItemIcon}>
                                    <BusinessIcon />
                                </ListItemIcon>
                                <ListItemText primary="Company" />
                            </ListItem>

                            {/* Suppressions */}
                            <ListItem 
                                button 
                                onClick={() => handleNavigation('/suppressions')} 
                                sx={isActive('/suppressions') ? { ...sidebarStyles.activeItem, pl: 4 } : { ...sidebarStyles.ListItem, pl: 4 }}
                            >
                                <ListItemIcon sx={sidebarStyles.listItemIcon}>
                                    <FeaturedPlayListIcon />
                                </ListItemIcon>
                                <ListItemText primary="Suppressions" />
                            </ListItem>
                        </List>
                    </Collapse>
                </List>
                {/* Source */}
                <ListItem button onClick={() => handleNavigation('/sources')} sx={isActive(`/sources`) ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <AllInboxIcon />
                    </ListItemIcon>
                    <ListItemText primary="Sources" />
                </ListItem>
                {/* Lookalikes */}
                <ListItem button onClick={() => handleNavigation('/lookalikes')} sx={isActive(`/lookalikes`) ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <ContactsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Lookalikes" />
                </ListItem>
                {/* Smart-audience */}
                <ListItem button onClick={() => handleNavigation('/smart-audiences')} sx={isActive(`/smart-audiences`) ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <AutoFixHighIcon sx={{rotate:'275deg', mb:1}}/>
                    </ListItemIcon>
                    <ListItemText primary="Smart Audiences" sx={{ whiteSpace: 'nowrap' }} />
                </ListItem>
                {/* Data-synce */}
                <ListItem button onClick={() => handleNavigation('/data-sync')} sx={isActive('/data-sync') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <CategoryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Data Sync" />
                </ListItem>
                {/* <ListItem button onClick={() => handleNavigation('/prospect')} sx={isActive('/prospect') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <Image src="/profile-circle-filled.svg" alt="profile-circle" height={20} width={20} />
                    </ListItemIcon>
                    <ListItemText primary="Prospect" />
                </ListItem> */}
                {/* integrations */}
                <ListItem button onClick={() => handleNavigation('/integrations')} sx={isActive('/integrations') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <IntegrationsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Integrations" />
                </ListItem>
                {/* <ListItem button onClick={() => handleNavigation('/analytics')} sx={isActive('/analytics') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <AnalyticsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Analytics" />
                </ListItem> */}
                {/* partners */}
                {isPartnerAvailable && <ListItem button onClick={() => handleNavigation('/partners')} sx={isActive('/partners') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <AccountBoxIcon />
                    </ListItemIcon>
                    <ListItemText primary="Partners" />
                </ListItem>}
                {/* <ListItem button onClick={() => handleNavigation('/rules')} sx={isActive('/rules') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <RuleFolderIcon />
                    </ListItemIcon>
                    <ListItemText primary="Rules" />
                </ListItem> */}
                {/* <ListItem button onClick={() => handleNavigation('/partners')} sx={isActive('/partners') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <AccountBoxIcon />
                    </ListItemIcon>
                    <ListItemText primary="Partners" />
                </ListItem> */}
            </List>
            <Box sx={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                width: '100%',
                '@media (max-height: 600px)': {
                    position: 'relative',
                }
            }}>
                <SetupSection percent_steps={activatePercent ? activatePercent : 0} />
                <Box sx={sidebarStyles.settings}>
                    <ListItem button onClick={() => handleNavigation('settings?section=accountDetails')} sx={isActive('/settings') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                        <ListItemIcon sx={sidebarStyles.listItemIcon}>
                            <SettingsIcon />
                        </ListItemIcon>
                        <ListItemText primary="Settings" />
                    </ListItem>
                </Box>
            </Box>
        </Box>
    );
};

export default Sidebar;
