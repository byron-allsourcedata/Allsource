import { red } from '@mui/material/colors';
import { SxProps, Theme } from '@mui/system';

export const loginStyles: { [key: string]: SxProps<Theme> } = {
    mainContent: {
        display:'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        marginTop: '-80px',

        '@media (max-width: 440px)': {
            marginTop: '-60px',
            padding: '0',
        },
    },
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        position: 'relative',
        boxShadow: '0rem 2px 8px 0px #00000033',
        borderRadius: '0.625rem',
        border: '0.0625rem solid transparent',
        textAlign: 'center',
        padding: '32px',
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
            padding: '0 20px 40px 20px', 
            marginTop: '0',
            marginBottom: '0',
            maxWidth: '100%',
        },
        '@media (max-width: 380px)': {
            marginTop: '76px',
        }
    },
    logoContainer: {
        paddingLeft: '2.5em',
        paddingRight: '0.5em',
        paddingTop: '2.5em',
        '@media (max-width: 440px)': {
            paddingLeft: '1.25em',
            paddingTop: '1.25em', 
            '& img': {
                width: '40px',
                height: '25px',
            } 
        },
    },
    title: {
        fontWeight: '600',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        paddingBottom: '33px',
        lineHeight: '30px',
        '@media (max-width: 440px)': {
            paddingBottom: '2rem',
        },
    },
    googleButton: {
        mb: 2,
        bgcolor: '#FFFFFF',
        color: '#000000',
        padding: '0.875rem 7.5625rem',
        whiteSpace: 'nowrap',
        border: '0.125rem solid transparent',
        '&:hover': {
            borderColor: '#Grey/Light',
            backgroundColor: 'white',
        },
        textTransform: 'none',
        width: '100%',
        fontWeight: 'medium',
        fontSize: '0.875rem',
    },
    orDivider: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        mt: '24px',
        mb: '24px',
        '@media (max-width: 440px)': {
            marginTop: '16px',
            marginBottom: '16px',
        }
    },
    orText: {
        px: '36px'
    },
    form: {
        width: '100%'
    },
    inputLabel: {
        top: '-3px',
        '&.Mui-focused': {
            color: 'rgba(17, 17, 19, 0.6)',
            fontFamily: 'Nunito Sans',
            fontWeight: 400,
            fontSize: '12px',
            lineHeight: '16px'
          },
    },
    submitButton: {
        mt: 2,
        backgroundColor: '#F45745',
        color: '#FFFFFF !important',
        '&:hover': {
            backgroundColor: red[700],
          },
        margin: '0',
        padding: '10px 24px',
        textTransform: 'none',
        lineHeight: '20px',
        '@media (max-width: 440px)': {
            marginTop: '20px',
            '&:hover': {
            borderColor: '#F45745',
            backgroundColor: '#F45745'}
        }
    },
    loginText: {
        mt: 2,
        margin: '43px 0 0',
        lineHeight: '20px',
        '@media (max-width: 440px)': {
            marginTop: '83px',
        }
    },
    resetPassword: {
        mt: 2,
        margin: '0 0 24px',
        textAlign: 'left',
    },
    loginLink: {
        color: '#F45745',
        cursor: 'pointer',
        textDecoration: 'none',
    },
    formField: {
        marginTop: '0',
        '@media (max-width: 440px)': {
            marginBottom: '0',
        }
    },
    formInput: {
        '&.MuiOutlinedInput-root': {
          height: '48px',
          '& .MuiOutlinedInput-input': {
            padding: '12px 16px 13px 16px',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(208, 213, 221, 1)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(208, 213, 221, 1)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(208, 213, 221, 1)',
          },
        },
        '&+.MuiFormHelperText-root': {
            marginLeft: '0',
        },
      },
}