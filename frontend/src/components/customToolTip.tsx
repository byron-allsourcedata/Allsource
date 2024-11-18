import React from 'react';
import { Tooltip, Box, Typography, Link } from '@mui/material';
import Image from 'next/image';

interface CustomTooltipProps {
  title: string; 
  linkText?: string;
  linkUrl?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ title, linkText, linkUrl }) => {
  return (
    <Tooltip
      title={
        <Box sx={{ backgroundColor: '#fff', margin:0, padding: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', }}>
          <Typography className='table-data' component='div'  sx={{ fontSize: '10px !important',}}>
            {title}
            {linkText && linkUrl && (
            <Typography className='table-heading' component='span' sx={{ pl:0.5, color: 'rgba(80, 82, 178, 1) !important', whiteSpace: 'nowrap', fontSize: '11px !important', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Link href={linkUrl} target="_blank" rel="noopener" underline="none" color="inherit">
                {linkText}
              </Link>
            </Typography>
          )}
            </Typography>
          
        </Box>
      }
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: '#fff',
            color: '#000',
            boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.12)', 
            border:' 0.2px solid rgba(255, 255, 255, 1)',
            borderRadius: '4px',
            maxHeight: '100%',
            maxWidth: '500px',
            minWidth: '200px',
            padding: '11px 10px',
          },
        },
      }}
      placement='right'
    >
      <Image src='/info-icon.svg' alt='info-icon' height={13} width={13} />
    </Tooltip>
  );
};

export default CustomTooltip;
