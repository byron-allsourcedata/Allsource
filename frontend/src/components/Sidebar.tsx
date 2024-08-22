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

const sidebarStyles = {
    container: {
        width: '100%',
        flexShrink: 0,
        fontFamily: 'Nunito',
        fontSize: '14px',
        fontWeight: '500',
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRight: '1px solid rgba(228, 228, 228, 1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'start',
        '@media (min-width: 1500px)': {
            width: '70%'

        },
    },
    menu: {
        alignItems: 'center',
        paddingTop: '0 !important',
        paddingBottom: '4em !important',
        '& .MuiListItem-root': {
            paddingBottom: '2em',
            paddingTop: '2em',
            '&:hover': {
                backgroundColor: '#e0e0e0',
            },
        },
        '&.css-lf3ci7-MuiList-root': {
            paddingTop: '0px !important',
            paddingBottom: '0px !important',
        },
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
            paddingBottom: '1.5em',
            paddingTop: '1.5em',
            '&:hover': {
                backgroundColor: '#e0e0e0',
            },
        },
        '&.css-lf3ci7-MuiList-root': {
            paddingTop: '0px !important',
            paddingBottom: '0px !important',
        },
    },
    setupSection: {
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        marginLeft: '0.5em',
        marginRight: '0.5em',
        border: '1px solid #e4e4e4',
        borderRadius: '8px',
        backgroundColor: '#fff',
        marginBottom: '2em',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    },
    activeItem: {
        borderLeft: '4px solid rgba(80, 82, 178, 1)',
        color: 'rgba(80, 82, 178, 1)',
        '& .MuiSvgIcon-root': {
            color: 'rgba(80, 82, 178, 1)',
        },
    },
};

const SetupSection: React.FC = () => (
    <Box sx={sidebarStyles.setupSection}>
        <Box display="flex" alignItems="center" mb={2}>
            <Image src={'/Vector9.svg'} alt="Setup" width={20} height={20} />
            <Typography variant="h6" component="div" ml={1}>
                Setup
            </Typography>
        </Box>
        <LinearProgress
            variant="determinate"
            value={33}
            sx={{
                height: '8px',
                borderRadius: '4px',
                '& .MuiLinearProgress-bar': {
                    backgroundColor: 'rgba(110, 193, 37, 1)',
                },
            }}
        />
        <Typography variant="body2" color="textSecondary" mt={1}>
            33% complete
        </Typography>
    </Box>
);

const Sidebar: React.FC = () => {
    const { setShowSlider } = useSlider();
    const router = useRouter();
    const pathname = usePathname();

    const handleNavigation = async (path: string) => {
        try {
            const response = await axiosInstance.get("dashboard");
            if (response.data.status === "NEED_BOOK_CALL") {
              sessionStorage.setItem("is_slider_opened", "true");
              setShowSlider(true);
            } else {
              setShowSlider(false);
              router.push(path);
            }
          } catch (error) {
            if (error instanceof AxiosError && error.response?.status === 403) {
              if (error.response.data.status === "NEED_BOOK_CALL") {
                sessionStorage.setItem("is_slider_opened", "true");
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
                <ListItem button onClick={() => handleNavigation('/dashboard')} sx={isActive('/dashboard') ? sidebarStyles.activeItem : {}}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <SpaceDashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/leads')} sx={isActive('/leads') ? sidebarStyles.activeItem : {}}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <LeadsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Leads" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/audience')} sx={isActive('/audience') ? sidebarStyles.activeItem : {}}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <CategoryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Audience" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/integrations')} sx={isActive('/integrations') ? sidebarStyles.activeItem : {}}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <IntegrationsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Integrations" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/analytics')} sx={isActive('/analytics') ? sidebarStyles.activeItem : {}}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <AnalyticsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Analytics" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/suppressions')} sx={isActive('/suppressions') ? sidebarStyles.activeItem : {}}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <FeaturedPlayListIcon />
                    </ListItemIcon>
                    <ListItemText primary="Suppressions" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/rules')} sx={isActive('/rules') ? sidebarStyles.activeItem : {}}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <RuleFolderIcon />
                    </ListItemIcon>
                    <ListItemText primary="Rules" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/partners')} sx={isActive('/partners') ? sidebarStyles.activeItem : {}}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <AccountBoxIcon />
                    </ListItemIcon>
                    <ListItemText primary="Partners" />
                </ListItem>
            </List>
            <SetupSection />
            <Box sx={sidebarStyles.settings}>
                <ListItem button onClick={() => handleNavigation('/settings')} sx={isActive('/settings') ? sidebarStyles.activeItem : {}}>
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
