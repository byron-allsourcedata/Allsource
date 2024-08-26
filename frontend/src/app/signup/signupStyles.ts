// signupStyles.ts
import { SxProps, Theme } from '@mui/system';


export const signupStyles: { [key: string]: SxProps<Theme> } = {
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
    boxShadow: '0rem 0.2em 0.8em 0px #00000033',
    borderRadius: '0.625rem',
    border: '0.0625rem solid transparent',
    textAlign: 'center',
    padding: '32px',
    maxWidth: '464px',
    minHeight: '481px',
    marginTop: '76px',
    marginBottom: '76px',
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
    fontWeight: 'bold',
    fontSize: '28px',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    paddingBottom: '33px',
    fontFamily: 'Nunito',
    lineHeight: 'normal',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
    maxWidth: '100%',
    '@media (max-width: 440px)': {
        paddingBottom: '2rem',
        fontSize: '24px'
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
    maxWidth: '22.5rem',
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
    '@media (max-width: 440px)': {
      marginTop: '16px',
      marginBottom: '16px',
    }
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
    color: '#fff',
    '&:hover': {
        borderColor: '#F45745',
        backgroundColor: '#F45745',
    },
    fontWeight: 'bold',
    margin: '24px 0px 0 0px',
    textTransform: 'none',
    minHeight: '3rem',
    fontSize: '16px',
    fontFamily: 'Nunito',
    '@media (max-width: 440px)': {
        marginTop: '32px',
    }
  },
  loginText: {
    mt: 2,
    margin: '43px 0 0',
    fontFamily: 'Nunito',
    fontSize: '14px',
    fontWeight: '500',
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
    marginTop: '24px',
    marginBottom: '0',
    '@media (max-width: 440px)': {
        marginTop: '16px',
    }
},
formInput: {
    '&.MuiOutlinedInput-root': {
      height: '48px',
      '& .MuiOutlinedInput-input': {
        padding: '12px 16px 13px 16px',
        fontFamily: 'Nunito',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#0000FF',
      },
    },
    '&+.MuiFormHelperText-root': {
      marginLeft: '0',
    }
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
    padding: '0'
  },
  passwordContentListItem: {
    width: 'auto',
    padding: '0 16px 0 0',
    '&:last-child' : {
      padding: 0
    }
  },
  passwordContentListItemIcon: {
    minWidth: '0',
    marginRight: '4px'
  },
  checkboxContentField: {
    display: 'table',
    textAlign: 'left',
    color: '#000',
    fontFamily: 'Nunito',
    fontSize: '14px',
    marginTop: '24px',
    marginLeft: '0',
    marginRight: '0',
    '& .MuiCheckbox-root': {
      padding: 0,
      marginRight: '10px',
      position: 'relative',
      top: '-2px',
    },
    '& .MuiSvgIcon-root': {
      width: 0,
      height: 0,
    },
    '& .MuiCheckbox-root:before': {
      content: '""',
      display: 'inline-block',
      width: '18px',
      height: '18px',
      borderRadius: '4px',
      border: '1px solid #e4e4e4', // Default border color
      backgroundColor: '#fff',
      boxShadow: 'none',
    },
    '& .MuiCheckbox-root.Mui-checked:before': {
      border: '1px solid #f45745',
      backgroundColor: '#f45745',
      content: '""',
      backgroundImage: 'url("/checkbox-tick.svg")',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      color: '#fff',
    },
    '& .MuiCheckbox-root:focusVisible:before': {
      boxShadow:
        'rgb(255, 255, 255) 0px 0px 0px 1px, rgb(80, 105, 200) 0px 0px 0px 3px',
    },
    '& .MuiCheckbox-root:hover:before': {
      border: '1px solid #f45745',
    },
  },
  checkboxContentLink: {
      color: '#000',
      fontFamily: 'Nunito',
      fontSize: '14px',
      textDecorationColor: '#000',
      '& img': {
        position: 'relative',
        top: '3px',
        left: '4px',
      }
    },
};
