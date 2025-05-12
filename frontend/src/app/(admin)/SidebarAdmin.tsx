'use client';
import React from 'react';
import {
    Box,
    List,
    ListItemIcon,
    ListItemText,
    ListItemButton
} from '@mui/material';
import {useRouter} from 'next/navigation';
import {usePathname} from 'next/navigation';
import LeadsIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import FeaturedPlayListIcon from '@mui/icons-material/FeaturedPlayList';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';


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
        color:'rgba(59, 59, 59, 1)',
        ml: '3px'
    },
    activeItem: {
        borderLeft: '3px solid rgba(56, 152, 252, 1)',
        color: 'rgba(56, 152, 252, 1)',
        minHeight: '4.5em',
        '& .MuiSvgIcon-root': {
            color: 'rgba(56, 152, 252, 1)',
        },
    },
    inactiveItem: {
        width: "100%",
        display: "flex",
        padding: "16px",
        gap: "16px",
        backgroundColor: 'transparent',
        color: '#000',
        '&:hover': {
            backgroundColor: '#e9ecef',
        },
    },
};



const SidebarAdmin: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();

    const handleNavigation = (path: string) => {
        if (pathname === path) {
            router.replace(path);
        } else {
            router.push(path);
        }
    };

    const isActive = (path: string) => pathname === path;

    return (
        <Box sx={sidebarStyles.container}>
            <List sx={sidebarStyles.menu}>
                <ListItemButton
                    onClick={() => handleNavigation('/admin/users')}
                    sx={isActive('/admin/users') ? sidebarStyles.activeItem : sidebarStyles.ListItem}
                >
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <LeadsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Users" />
                </ListItemButton>
                <ListItemButton
                    onClick={() => handleNavigation('/admin/partners')}
                    sx={isActive('/admin/partners') ? sidebarStyles.activeItem : sidebarStyles.ListItem}
                >
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <AccountBoxIcon />
                    </ListItemIcon>
                    <ListItemText primary="Partners" />
                </ListItemButton>
                <ListItemButton
                    onClick={() => handleNavigation('/admin/accounts')}
                    sx={isActive('/admin/accounts') ? sidebarStyles.activeItem : sidebarStyles.ListItem}
                >
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <AccountCircleIcon />
                    </ListItemIcon>
                    <ListItemText primary="Accounts" />
                </ListItemButton>
                <ListItemButton
                    onClick={() => handleNavigation('/admin/assets')}
                    sx={isActive('/admin/assets') ? sidebarStyles.activeItem : sidebarStyles.ListItem}
                >
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <CategoryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Assets" />
                </ListItemButton>
                <ListItemButton
                    onClick={() => handleNavigation('/admin/payouts')}
                    sx={isActive('/admin/payouts') ? sidebarStyles.activeItem : sidebarStyles.ListItem}
                >
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <FeaturedPlayListIcon />
                    </ListItemIcon>
                    <ListItemText primary="Payouts" />
                </ListItemButton>
            </List>
        </Box>
    );
};

export default SidebarAdmin;