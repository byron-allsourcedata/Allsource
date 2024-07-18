'use client';
import React from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Divider, LinearProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const sidebarStyles = {
    container: {
        width: '16em',
        flexShrink: 0,
        fontFamily: 'Nunito',
        fontSize: '14px',
        fontWeight: '500',
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRight: '1px solid rgba(228, 228, 228, 1)',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'start',
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
        maxWidth: '9em',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        marginLeft: '1.5em',
        border: '1px solid #e4e4e4',
        borderRadius: '8px',
        backgroundColor: '#fff',
        marginBottom: '2em',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
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

const Sidebar: React.FC = () => {
    const router = useRouter();

    const handleNavigation = (path: string) => {
        router.push(path);
    };

    return (
        <Box sx={sidebarStyles.container}>
            <List sx={sidebarStyles.menu}>
                <ListItem button onClick={() => handleNavigation('/dashboard')}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <Image src="/Vector1.svg" alt="Dashboard" width={20} height={20} />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <Image src="/Vector2.svg" alt="Leads" width={20} height={20} />
                    </ListItemIcon>
                    <ListItemText primary="Leads" />
                </ListItem>
                <ListItem button>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <Image src="/Vector8.svg" alt="Audience" width={20} height={20} />
                    </ListItemIcon>
                    <ListItemText primary="Audience" />
                </ListItem>
                <ListItem button>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <Image src="/Vector3.svg" alt="Integrations" width={20} height={20} />
                    </ListItemIcon>
                    <ListItemText primary="Integrations" />
                </ListItem>
                <ListItem button>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <Image src="/Vector4.svg" alt="Analytics" width={20} height={20} />
                    </ListItemIcon>
                    <ListItemText primary="Analytics" />
                </ListItem>
                <ListItem button>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <Image src="/Vector5.svg" alt="Suppressions" width={20} height={20} />
                    </ListItemIcon>
                    <ListItemText primary="Suppressions" />
                </ListItem>
                <ListItem button>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <Image src="/Vector6.svg" alt="Rules" width={20} height={20} />
                    </ListItemIcon>
                    <ListItemText primary="Rules" />
                </ListItem>
                <ListItem button>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <Image src="/Vector7.svg" alt="Partners" width={20} height={20} />
                    </ListItemIcon>
                    <ListItemText primary="Partners" />
                </ListItem>
            </List>
            <SetupSection />
            <Box sx={sidebarStyles.settings}>
                <ListItem button onClick={() => handleNavigation('/settings')}>
                    <ListItemIcon sx={sidebarStyles.listItemIcon}>
                        <Image src={'/Vector10.svg'} alt="Settings" width={20} height={20} />
                    </ListItemIcon>
                    <ListItemText primary="Settings" />
                </ListItem>
            </Box>
        </Box>
    );
};

export default Sidebar;
