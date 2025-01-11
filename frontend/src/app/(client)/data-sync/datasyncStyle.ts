import { SxProps, Theme } from '@mui/system';

export const datasyncStyle: { [key: string]: SxProps<Theme> } = {
    mainContent: {
        display:'flex',
        flexDirection: 'column',
        width: '100%',
        padding: 0,
        margin: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    table_column: {
      fontFamily: 'Nunito Sans', fontSize: '12px', fontWeight: '600',
      lineHeight: '19.6px',
      textAlign: 'left',
      textWrap: 'nowrap',
      color: '#4a4a4a',
      '&::after': {
        content: '""',
        display: 'block',
        position: 'absolute',
        top: '15px', // Space from the top
        bottom: '15px', // Space from the bottom
        right: 0, // Position the border at the right edge
        width: '1px',
        height: 'calc(100% - 30px)', // Full height minus top and bottom spacing
        backgroundColor: 'rgba(235, 235, 235, 1)', // Border color
    }},
    
    container: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        position: 'relative',
        boxShadow: '0rem 2px 8px 0px #00000033',
        borderRadius: '0.625rem',
        border: '0.0625rem solid transparent',
        textAlign: 'center',
        maxWidth: '464px',
        minHeight: '481px',
        marginTop: '143px',
        marginBottom: '143px',
        '@media (min-width: 1400px)': {
            marginTop: '130px',
            marginBottom: '130px',
        },
        '@media (max-width: 440px)': {
            boxShadow: '0rem 0px 0px 0px #00000033',
            border: 'none',
            marginTop: '0',
            marginBottom: '0',
            maxWidth: '100%',
        },
        '@media (max-width: 380px)': {
            marginTop: '76px',
        }
    },
    table_array: {
        fontFamily: 'Roboto',
        fontSize: '12px',
        fontWeight: '400',
        lineHeight: '16.8px',
        textAlign: 'left',
        whiteSpace: 'nowrap',
        color: 'rgba(95, 99, 104, 1)',
        position: 'relative', // Для работы с псевдоэлементом ::after
        '&::after': {
          content: '""',
          display: 'block',
          position: 'absolute',
          top: '15px', // Space from the top
          bottom: '15px', // Space from the bottom
          right: 0, // Position the border at the right edge
          width: '1px',
          height: 'calc(100% - 30px)', // Full height minus top and bottom spacing
          backgroundColor: 'rgba(235, 235, 235, 1)', // Border color
        }
      },
      table_array_status: {
        fontFamily: 'Nunito Sans', fontSize: '12px', border: '1px solid rgba(235, 235, 235, 1)', fontWeight: '400',
        lineHeight: '14.06px',
        textAlign: 'left',
        textWrap: 'nowrap',
        background: 'rgba(235, 243, 254, 1)',
        color: 'rgba(20, 110, 246, 1)',
      },
      table_array_phone: {
        fontFamily: 'Roboto', fontSize: '12px', fontWeight: '400',
        lineHeight: '16.8px',
        textAlign: 'left',
        textWrap: 'wrap',
        color: 'rgba(95, 99, 104, 1)',
        position: 'relative',
        '&::after': {
          content: '""',
          display: 'block',
          position: 'absolute',
          top: '15px', // Space from the top
          bottom: '15px', // Space from the bottom
          right: 0, // Position the border at the right edge
          width: '1px',
          height: 'calc(100% - 30px)', // Full height minus top and bottom spacing
          backgroundColor: 'rgba(235, 235, 235, 1)', // Border color
      }
      },
}
