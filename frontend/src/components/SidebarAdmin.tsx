'use client';
import React from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, LinearProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation'; 
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import LeadsIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';

import Image from 'next/image';

const sidebarStyles = {
    container: {
        width: '80%',
        flexShrink: 0,
        fontFamily: 'Nunito',
        fontSize: '14px',
        fontWeight: '500',
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRight: '1px solid rgba(228, 228, 228, 1)',
        marginRight: '10em',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'start',
        '@media (min-width: 1500px)': {
        width:'70%'

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
        <LinearProgress variant="determinate" color='success' value={14} sx={{ height: '8px', borderRadius: '4px'}} />
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
        <Box sx={sidebarStyles.container} >
            <List sx={sidebarStyles.menu}>
                <ListItem button onClick={() => handleNavigation('/admin/reseller')} sx={isActive('/admin/reseller') ? sidebarStyles.activeItem : {}}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <SpaceDashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary="Reseller" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/admin/client')} sx={isActive('/admin/client') ? sidebarStyles.activeItem : {}}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <LeadsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Client" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/admin/assets')} sx={isActive('/admin/assets') ? sidebarStyles.activeItem : {}}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <CategoryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Assets" />
                </ListItem>
                <ListItem button onClick={() => handleNavigation('/admin/payouts')} sx={isActive('/admin/payouts') ? sidebarStyles.activeItem : {}}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <CategoryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Payouts" />
                </ListItem>
            </List>
        </Box>
    );
};

export default SidebarAdmin;
