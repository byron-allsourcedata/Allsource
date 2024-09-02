'use client';
import React from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Divider, LinearProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import LeadsIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import IntegrationsIcon from '@mui/icons-material/IntegrationInstructions';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import FeaturedPlayListIcon from '@mui/icons-material/FeaturedPlayList';
import RuleFolderIcon from '@mui/icons-material/RuleFolder';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import SettingsIcon from '@mui/icons-material/Settings';
import Image from 'next/image';
import { useSlider } from '@/context/SliderContext';
import { AxiosError } from 'axios';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { Height } from '@mui/icons-material';

const sidebarStyles = {
    container: {
        width: '100%',
        flexShrink: 0,
        fontFamily: 'Nunito',
        fontSize: '14px',
        fontWeight: '500',
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRight: '1px solid rgba(228, 228, 228, 1)',
        height: '90.99vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'start'
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
            fontFamily: 'Nunito',
            fontSize: '0.875rem',
            lineHeight: 'normal'
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
            fontFamily: 'Nunito',
            fontSize: '0.875rem',
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
        minHeight: '4.5em' 
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
    const percent_steps = meData?.percent_steps ?? 0;


    return (
        <Box sx={sidebarStyles.setupSection}>
            <Box display="flex" alignItems="center" mb={2}>
                <Image src={'/Vector9.svg'} alt="Setup" width={20} height={20} />
                <Typography variant="h6" component="div" ml={1} sx={{
                    fontFamily: 'Nunito',
                    fontWeight: '700',
                    lineHeight: 'normal',
                    color: '#000',
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
                    '& .MuiLinearProgress-bar': {
                        backgroundColor: 'rgba(110, 193, 37, 1)',
                    },
                }}
            />
            <Typography variant="body2" color="textSecondary" mt={1} sx={{
                        fontFamily: 'Nunito',
                        lineHeight: 'normal',
                        color: '#000',
                        fontSize: '0.625rem'
                    }}>
                {meData.percent_steps ? meData.percent_steps : 0}% complete
            </Typography>
        </Box>
    )
};


const Sidebar: React.FC = () => {
    const meItem = typeof window !== 'undefined' ? sessionStorage.getItem('me') : null;
    const meData = meItem ? JSON.parse(meItem) : { percent_steps: 0 };
    const { setShowSlider } = useSlider();
    const router = useRouter();
    const pathname = usePathname();

    const handleNavigation = async (path: string) => {
        try {
            const response = await axiosInstance.get("dashboard");
            if (response.data.status === "NEED_BOOK_CALL") {
                sessionStorage?.setItem("is_slider_opened", "true");
                setShowSlider(true);
            } else {
                setShowSlider(false);
                router.push(path);
            }
        } catch (error) {
            if (error instanceof AxiosError && error.response?.status === 403) {
                if (error.response.data.status === "NEED_BOOK_CALL") {
                    sessionStorage?.setItem("is_slider_opened", "true");
                    setShowSlider(true);
                } else {
                    setShowSlider(false);
                    router.push(path);
                }
            } else {
                console.error("Error fetching data:", error);
            }
        }
    };

    const isActive = (path: string) => pathname === path;

    return (
        <Box sx={sidebarStyles.container} >
            <List sx={sidebarStyles.menu}>
                <ListItem button onClick={() => handleNavigation('/dashboard')} sx={isActive('/dashboard') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <SpaceDashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/leads')} sx={isActive('/leads') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <LeadsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Contacts" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/audience')} sx={isActive('/audience') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <CategoryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Audience" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/integrations')} sx={isActive('/integrations') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <IntegrationsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Integrations" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/analytics')} sx={isActive('/analytics') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <AnalyticsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Analytics" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/suppressions')} sx={isActive('/suppressions') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <FeaturedPlayListIcon />
                    </ListItemIcon>
                    <ListItemText primary="Suppressions" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/rules')} sx={isActive('/rules') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <RuleFolderIcon />
                    </ListItemIcon>
                    <ListItemText primary="Rules" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/partners')} sx={isActive('/partners') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <AccountBoxIcon />
                    </ListItemIcon>
                    <ListItemText primary="Partners" />
                </ListItem>
            </List>
            <SetupSection meData={meData ? meData : { percent_steps: 0 }} />
            <Box sx={sidebarStyles.settings}>
                <ListItem button onClick={() => handleNavigation('/settings')} sx={isActive('/settings') ? sidebarStyles.activeItem : sidebarStyles.ListItem}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Settings" />
                </ListItem>
            </Box>
        </Box>
    );
};

export default Sidebar;
