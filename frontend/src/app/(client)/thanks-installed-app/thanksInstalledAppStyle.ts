import { red } from '@mui/material/colors';
import { SxProps, Theme } from '@mui/system';

export const thanksInstalledAppStyle: { [key: string]: SxProps<Theme> } = {
  mainContent: {
      display:'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      marginTop: '-80px',
      position: 'relative',

      '@media (max-width: 440px)': {
          marginTop: '-60px',
          padding: '0',
      },
    },
  }