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
        maxWidth: '398px',
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
        fontWeight: 'bold',
        fontSize: '28px',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        paddingBottom: '33px',
        fontFamily: 'Nunito',
        lineHeight: 'normal',
        '@media (max-width: 440px)': {
            fontSize: '24px',
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
        px: '36px',
        fontWeight: 'regular',
        fontSize: '14px',
        fontFamily: 'Nunito',
    },
    form: {
        width: '100%',
        fontFamily: 'Nunito',
    },
    inputLabel: {
        fontFamily: 'Nunito',
        fontSize: '16px',
        lineHeight: 'normal',
        color: 'rgba(17, 17, 19, 0.60)',
        top: '-3px',
        '&.Mui-focused': {
            color: '#0000FF',
          },
    },
    submitButton: {
        mt: 2,
        backgroundColor: '#F45745',
        color: '#FFFFFF',
        '&:hover': {
            borderColor: '#000000',
            backgroundColor: 'lightgreen',
        },
        fontWeight: 'bold',
        margin: '0',
        padding: '10px 24px',
        textTransform: 'none',
        fontSize: '16px',
        fontFamily: 'Nunito',
        '@media (max-width: 440px)': {
            marginTop: '20px',
        }
    },
    loginText: {
        mt: 2,
        margin: '43px 0 0',
        fontFamily: 'Nunito',
        fontSize: '14px',
        fontWeight: '500',
        '@media (max-width: 440px)': {
            marginTop: '83px',
        }
    },
    resetPassword: {
        mt: 2,
        margin: '0 0 24px',
        fontFamily: 'Nunito',
        fontSize: '16px',
        textAlign: 'left',
    },
    loginLink: {
        color: '#F45745',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontFamily: 'Nunito',
        textDecoration: 'none',
        fontSize: '16px',
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
            fontFamily: 'Nunito',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#A3B0C2',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#A3B0C2',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0000FF',
          },
        },
        '&+.MuiFormHelperText-root': {
            marginLeft: '0',
        },
      },
}