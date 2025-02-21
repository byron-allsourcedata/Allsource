import { SxProps, Theme } from '@mui/system';

export const suppressionsStyles: { [key: string]: SxProps<Theme> } = {
    box: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        width: '100%',
        padding: 0,
        margin: '0 auto',
        marginBottom: '1.5rem',
        color: 'rgba(32, 33, 36, 1)',
        border: '1px solid rgba(240, 240, 240, 1)',
        boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.2)',
    },
    container: {
        width: '100%',
        padding: '1.5rem',
        "@media (max-width: 700px)": { padding: '16px' }
    },
    suppressionContainer: {
        width: '100%',
        padding: '1.5rem',
        "@media (max-width: 700px)": { padding: '8px' }
    },
    title: {
        fontWeight: '600',
        lineHeight: '21.82px',
        marginBottom: '16px',
        fontSize: '1rem',
        color: 'rgba(32, 33, 36, 1)',
    },
    subtitle: {
        marginBottom: '1rem',
        fontWeight: 400,
        fontSize: '0.75rem',
        color: 'rgba(128, 128, 128, 1)'
    },
    dote_text: {
        color: 'rgba(32, 33, 36, 1)',
        display: 'flex',
        alignItems: 'center',
        '::before': {
            content: '"•"',
            marginRight: '0.5rem',
            color: 'rgba(32, 33, 36, 1)',
            fontSize: '1rem'
        }
    },
    dote_subtext: {
        color: 'rgba(95, 99, 104, 1)',
        fontWeight: '400',
        fontSize: '0.75rem',
        lineHeight: '1.05rem',
        marginBottom: '1rem',
        mt: '0.5rem',
        pl: '1.75rem',
        "@media (max-width:700px)": {
            pl: 2
        }
    },
    text: {
        color: 'rgba(32, 33, 36, 1)',
        display: 'flex',
        fontSize: '12px',
        lineHeight: '1.05rem',
        alignItems: 'center',
    },
    or_border: {
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '100%',  
        mt: '1.5rem', 
        mb: '1.5rem',
        '@media (max-width: 440px)': { 
            marginTop: '16px', 
            marginBottom: '16px',
        } 
    },
    or_text: {
        px: '36px',
        fontWeight: '400',
        fontSize: '12px',
        fontFamily: 'Nunito Sans',
        color: '4a4a4a',
        lineHeight: '16px'
    },
    tableColumn: {
        lineHeight: '16px !important',
        position: 'relative',
        paddingLeft: '45px',
        paddingTop: '16px',
        paddingBottom: '16px',
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
        },
        '&:last-child::after': {
            content: 'none'
        }
    },
    tableBodyRow: {
        '&:last-child td': {
            borderBottom: 0
        }
    },
    tableBodyColumn: {
        lineHeight: '16px !important',
        position: 'relative',
        paddingLeft: '45px',
        paddingTop: '10.5px',
        paddingBottom: '10.5px',
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
        },
        '&:last-child::after': {
            content: 'none'
        }
    },
    page_number: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        color: 'rgba(80, 82, 178, 1)',
      },
    centerContainerStyles: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        border: '1px solid rgba(235, 235, 235, 1)',
        borderRadius: 2,
        padding: 3,
        boxSizing: 'border-box',
        width: '100%',
        textAlign: 'center',
        flex: 1,
        '& img': {
            width: 'auto',
            height: 'auto',
            maxWidth: '100%'
        }
    }
}