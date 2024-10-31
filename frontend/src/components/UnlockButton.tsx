"use client";
import React from 'react';
import { Button, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const style = {
    buttonBlock: {
        backdropFilter: 'blur(10px)', 
        backgroundColor: 'rgba(80, 82, 178, 0.1)', 
        textTransform: 'none',
        "&:hover": {
          backgroundColor: 'rgba(80, 82, 178, 0.1)',
        }
      },
      buttonBlockText: {
        display: 'flex', 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center',
      }
}

interface UnlockButtonProps {
    onClick: () => void;
    label: string;
}

const UnlockButton: React.FC<UnlockButtonProps> = React.memo(function UnlockButton({ onClick, label }) {
  return (
      <Button variant="text" sx={style.buttonBlock} onClick={onClick}>
          <Typography className='table-data' sx={style.buttonBlockText}>
              <LockOutlinedIcon fontSize='small' /> {label}
          </Typography>
      </Button>
  );
});


export default UnlockButton;
