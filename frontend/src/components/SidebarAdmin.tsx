'use client';
import React from 'react';
import {
    Box,
    List,
    ListItemIcon,
    ListItemText,
    LinearProgress,
    Typography,
    ListItemButton
} from '@mui/material';
import {useRouter} from 'next/navigation';
import {usePathname} from 'next/navigation';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import LeadsIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import FeaturedPlayListIcon from '@mui/icons-material/FeaturedPlayList';

import Image from 'next/image';
import { display, width } from '@mui/system';

const sidebarStyles = {
    container: {
        width: '100%',
        paddingTop: "24px",
        flexShrink: 0,
        fontFamily: 'Nunito Sans',
        fontSize: '14px',
        fontWeight: '500',
        backgroundColor: 'rgba(255, 255, 255, 1)',
        height: '95vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'start',
    },
    menu: {
        display: "flex",
        flexDirection: "column",
        gap: "35px",
        alignItems: 'center',
        paddingTop: '0 !important',
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
        '& .MuiListItem-root': {},
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
        width: "100%",
        display: "flex",
        gap: "16px",
        borderLeft: '4px solid rgba(80, 82, 178, 1)',
        color: 'rgba(80, 82, 178, 1)',
        '& .MuiSvgIcon-root': {
            color: 'rgba(80, 82, 178, 1)',
        },
    },
    inactiveItem: {
        width: "100%",
        display: "flex",
        gap: "16px",
        backgroundColor: 'transparent',
        color: '#000',
        '&:hover': {
            backgroundColor: '#e9ecef',
        },
    },
};

const SetupSection: React.FC = () => (
    <Box sx={sidebarStyles.setupSection}>
        <Box display="flex" alignItems="center" mb={2}>
            <Image src={'/Vector9.svg'} alt="Setup" width={20} height={20}/>
            <Typography variant="h6" component="div" ml={1}>
                Setup
            </Typography>
        </Box>
        <LinearProgress variant="determinate" color='success' value={14} sx={{height: '8px', borderRadius: '4px'}}/>
        <Typography variant="body2" color="textSecondary" mt={1}>
            14% complete
        </Typography>
    </Box>
);

const SidebarAdmin: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();

    const handleNavigation = (path: string) => {
        router.push(path);
    };

    const isActive = (path: string) => pathname === path;

    return (
        <Box sx={sidebarStyles.container}>
            <List sx={sidebarStyles.menu}>
                <ListItemButton
                    onClick={() => handleNavigation('/admin/users')}
                    sx={isActive('/admin/users') ? sidebarStyles.activeItem : sidebarStyles.inactiveItem}
                >
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <LeadsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Users" />
                </ListItemButton>
                <ListItemButton
                    onClick={() => handleNavigation('/admin/reseller')}
                    sx={isActive('/admin/resellers') ? sidebarStyles.activeItem : sidebarStyles.inactiveItem}
                >
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <SpaceDashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary="Resellers" />
                </ListItemButton>
                <ListItemButton
                    onClick={() => handleNavigation('/admin/assets')}
                    sx={isActive('/admin/assets') ? sidebarStyles.activeItem : sidebarStyles.inactiveItem}
                >
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <CategoryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Assets" />
                </ListItemButton>
                <ListItemButton
                    onClick={() => handleNavigation('/admin/payouts')}
                    sx={isActive('/admin/payouts') ? sidebarStyles.activeItem : sidebarStyles.inactiveItem}
                >
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <FeaturedPlayListIcon />
                    </ListItemIcon>
                    <ListItemText primary="Payouts" />
                </ListItemButton>
                <ListItemButton
                    onClick={() => handleNavigation('/admin/partners')}
                    sx={isActive('/admin/partners') ? sidebarStyles.activeItem : sidebarStyles.inactiveItem}
                >
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <CategoryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Partners" />
                </ListItemButton>
            </List>
        </Box>
    );
};

export default SidebarAdmin;