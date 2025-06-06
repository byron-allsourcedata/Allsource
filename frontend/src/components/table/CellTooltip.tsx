
import React, { ReactNode } from 'react';
import { Box, Typography, Tooltip, TooltipProps, SxProps, Theme } from '@mui/material';

export interface CellTooltipProps {
  content: React.ReactNode;
  always?: boolean;
  props?: Omit<TooltipProps, 'title' | 'children'>;
  isOverflow?: boolean;
  sx?: SxProps<Theme>;
  children: ReactNode;
}

const CellTooltip: React.FC<CellTooltipProps> = ({
  content,
  always = false,
  props,
  isOverflow = false,
  sx,
  children,
}) => {
  const needTooltip = always || isOverflow;

  if (!needTooltip) {
    return <>{children}</>;
  }

  return (
    <Tooltip
      title={
        <Box
          sx={{
            backgroundColor: '#fff',
            m: 0,
            p: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography
            component="div"
            color="inherit"
            sx={{ fontSize: '12px !important' }}
          >
            {content}
          </Typography>
        </Box>
      }
      placement="right"
      sx={{ marginLeft: '0.5rem !important', ...sx }}
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: '#fff',
            color: '#000',
            boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.12)',
            border: '0.2px solid rgba(255, 255, 255, 1)',
            borderRadius: '4px',
            maxHeight: '100%',
            maxWidth: '500px',
            padding: '11px 10px',
            marginLeft: '0.5rem !important',
          },
        },
      }}
      {...props}
    >
       <span style={{ display: 'inline-block' }}>{children}</span>
    </Tooltip>
  );
};

export default CellTooltip;
