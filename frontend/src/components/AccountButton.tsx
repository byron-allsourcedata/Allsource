"use client";
import { Box,  Typography, Button, Menu, MenuItem } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useUser } from '@/context/UserContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const AccountButton: React.FC = () => {
  const { full_name: userFullName, email: userEmail } = useUser();
  const meItem = typeof window !== 'undefined' ? sessionStorage.getItem('me') : null;
  const meData = meItem ? JSON.parse(meItem) : { full_name: '', email: '' };
  
  const fullName = userFullName || meData.full_name;
  const email = userEmail || meData.email;
  
    const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
    const router = useRouter();
    const dropdownOpen = Boolean(dropdownEl);
    const handleDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setDropdownEl(event.currentTarget);
      };
    
      const handleDropdownClose = () => {
        setDropdownEl(null);
      };

      const handleSignOut = () => {
        localStorage.clear();
        sessionStorage.clear();
        router.push('/signin');
      };
    
      const handleSettingsClick = () => {
        router.push('/settings');
      };
  
    

    return (
        <>
        <Button
            aria-controls={dropdownOpen ? 'account-dropdown' : undefined}
            aria-haspopup="true"
            aria-expanded={dropdownOpen ? 'true' : undefined}
            onClick={handleDropdownClick}
            sx={{
              textTransform: 'none',
              color: 'rgba(128, 128, 128, 1)',
              border: '1px solid rgba(184, 184, 184, 1)',
              borderRadius: '3.27px',
              padding: '7px'
            }}
          >
            <Typography sx={{
              marginRight: '0.5em',
              fontFamily: 'Nunito',
              lineHeight: '19.1px',
              letterSpacing: '-0.02em',
              textAlign: 'left',
              fontSize: '0.875rem'
            }}> Account Name </Typography>
            <ExpandMoreIcon sx={{
              width: '20px',
              height: '20px'
            }} />
          </Button>
          <Menu
            id="account-dropdown"
            anchorEl={dropdownEl}
            open={dropdownOpen}
            onClose={handleDropdownClose}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="h6">{fullName}</Typography>
              <Typography variant="body2" color="textSecondary">{email}</Typography>
            </Box>
            <MenuItem onClick={handleSettingsClick}>Settings</MenuItem>
            <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
            {/* TODO ELEMENTS MENU */}
          </Menu>
          </>
    )
}

export default AccountButton;