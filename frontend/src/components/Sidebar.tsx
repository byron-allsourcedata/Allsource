'use client';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Divider, LinearProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import LeadsIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import IntegrationsIcon from '@mui/icons-material/IntegrationInstructions';
import FeaturedPlayListIcon from '@mui/icons-material/FeaturedPlayList';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import SettingsIcon from '@mui/icons-material/Settings';
import Image from 'next/image';
import { AxiosError } from 'axios';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import PageWithLoader from './FirstLevelLoader';
import CustomizedProgressBar from '@/components/FirstLevelLoader'

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
        color:'rgba(59, 59, 59, 1)'
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

interface ProgressSectionProps {
    meData: { percent_steps: number };
}

const SetupSection: React.FC<ProgressSectionProps> = ({ meData }) => {
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
                value={meData.percent_steps ? meData.percent_steps : 0}
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
                {meData.percent_steps ? meData.percent_steps : 0}% complete
            </Typography>
        </Box>
    )
};


interface SidebarProps {
    setShowSlider: Dispatch<SetStateAction<boolean>>;
    setLoading: Dispatch<SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ setShowSlider, setLoading }) => {
    const [meData, setMeData] = useState({ percent_steps: 0 });
    useEffect(() => {
        if (typeof window !== "undefined") {
            const meItem = sessionStorage.getItem("me");
            if (meItem) {
                setMeData(JSON.parse(meItem));
            }
        }
    }, []);
    const router = useRouter();
    const pathname = usePathname();
    const [showBookSlider, setShowBookSlider] = useState(false);

    const handleNavigation = async (path: string, route?: string) => {
        try {
            setLoading(true)
            const response = await axiosInstance.get(path);
            if (response.data.status === "NEED_BOOK_CALL") {
                sessionStorage?.setItem("is_slider_opened", "true");
                setShowSlider(true);
            } else {
                if(route){
                    router.push(route)
                } else {
                    router.push(path);
                }
            }
        
        } catch (error) {
            if (error instanceof AxiosError && error.response?.status === 403) {
                if (error.response.data.status === "NEED_BOOK_CALL") {
                    sessionStorage?.setItem("is_slider_opened", "true");
                    setShowSlider(true);
                    setShowBookSlider(true);
                } else {
                    setShowSlider(false);
                    setShowBookSlider(false);
                    if(route){
                        router.push(route)
                    } else {
                        router.push(path);
                    }
                }
            } else {
                console.error("Error fetching data:", error);
            }
        }
        finally {
            setLoading(false)
        }
    };

    const isActive = (path: string) => pathname === path;

    return (
        <Box sx={sidebarStyles.container} >
            <List sx={sidebarStyles.menu}>
                <ListItem button onClick={() => handleNavigation('/check-user-authorization', '/dashboard')} sx={isActive('/dashboard') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <SpaceDashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/check-user-authorization', '/leads')} sx={isActive('/leads') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <LeadsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Contacts" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/check-user-authorization', '/data-sync')} sx={isActive('/data-sync') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
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
                <ListItem button onClick={() => handleNavigation('/check-user-authorization','/integrations')} sx={isActive('/integrations') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
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
                <ListItem button onClick={() => handleNavigation('/check-user-authorization', '/suppressions')} sx={isActive('/suppressions') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <FeaturedPlayListIcon />
                    </ListItemIcon>
                    <ListItemText primary="Suppressions" />
                </ListItem>
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
                width: '100%'
            }}>
                <SetupSection meData={meData ? meData : { percent_steps: 0 }} />
                <Box sx={sidebarStyles.settings}>
                    <ListItem button onClick={() => handleNavigation('/check-user-authorization', 'settings?section=accountDetails')} sx={isActive('/settings') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
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
