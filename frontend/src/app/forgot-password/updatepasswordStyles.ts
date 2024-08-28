import { SxProps, Theme } from '@mui/system';

export const updatepasswordStyles: { [key: string]: SxProps<Theme> } = {
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
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        boxShadow: '0rem 2px 8px 0px #00000033',
        borderRadius: '0.625rem',
        border: '0.0625rem solid transparent',
        textAlign: 'center',
        padding: '24px 32px',
        maxWidth: '396px',
        marginTop: '143px',
        marginBottom: '143px',
        '@media (min-width: 1400px)': {
            marginTop: '130px',
            marginBottom: '130px',
        },
        '@media (max-width: 440px)': {
            padding: '24px 16px', 
            marginTop: '0',
            marginBottom: '0',
            margin: '0 16px 40px 16px',
            maxWidth: '100%'
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
        paddingBottom: '16px',
        fontFamily: 'Nunito',
        lineHeight: 'normal',
        '@media (max-width: 440px)': {
            fontSize: '24px',
            paddingBottom: '0.5rem',
        },
      },
    subtitle: {
        mb: 2,
        fontWeight: 'bold',
        color: 'gray',
        fontSize: '16px',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        padding: '0 1rem 2rem',
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
      marginTop: '2.5rem',
      padding: '10px 24px',
      textTransform: 'none',
      fontSize: '16px',
      fontFamily: 'Nunito',
      '@media (max-width: 440px)': {
          margin: '0',
          position: 'absolute',
          bottom: '30px',
          left: '20px',
          width: '90%',
      }
    },
    resetPassword: {
        mt: 2,
        margin: '3em 0em 0em',
        fontFamily: 'Nunito',
        fontSize: '16px',
    },
    text: {
        fontSize: '14px',
        fontFamily: 'Nunito',
        fontWeight: '500',
        textAlign: 'center',
        color: '#000',
        paddingBottom: '1.5rem',
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
      passwordValidationText: {
        '& .MuiTypography-root' : {
          fontFamily: 'Nunito',
          fontSize: '12px',
          fontWeight: '400',
          color: 'rgba(17, 17, 19, 0.60)',
        }
      },
      passwordValidationTextSuccess: {
        '& .MuiTypography-root' : {
          fontFamily: 'Nunito',
          fontSize: '12px',
          fontWeight: '400',
          color: '#111113',
        }
      },
      passwordContentList: {
        display: 'flex',
        padding: '0',
        marginBottom: '0.5rem'
      },
      passwordContentListItem: {
        width: 'auto',
        padding: '0 16px 0 0',
        '@media (max-width: 440px)': {
          padding: '0 8px 0 0',
        },
        '&:last-child' : {
          padding: 0
        }
      },
      passwordContentListItemIcon: {
        minWidth: '0',
        marginRight: '4px'
      },

}