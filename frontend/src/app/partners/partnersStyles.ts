import { SxProps, Theme } from '@mui/system';

export const partnersStyle: { [key: string]: SxProps<Theme> } = {
    mainContent: {
        display:'flex',
        flexDirection: 'column',
        width: '100%',
        padding: 0,
        margin: 0,
        alignItems: 'center',
        justifyContent: 'center',
        '@media (min-width: 900px)': {
            paddingLeft: '0.5rem',
            paddingRight: '0.5rem',
        },
        '@media (max-width: 440px)': {
            marginTop: '-60px',
            padding: '0',
        },
    },
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
    titleBox: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        flexDirection: 'row',
        margin: '0 auto',
    },
      collectionRules: {
        backgroundColor: '#fff',
        width: '100%',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
      }
};