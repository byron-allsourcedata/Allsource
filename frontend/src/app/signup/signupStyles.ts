// signupStyles.ts
import { SxProps, Theme } from '@mui/system';

export const signupStyles: { [key: string]: SxProps<Theme> } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    backgroundColor: '#ffffff',
    maxWidth: '25rem',
    margin: '0 auto',
    position: 'relative',
    boxShadow: '0rem 0.2em 0.8em 0px #00000033',
    borderRadius: '0.625rem',
    border: '0.0625rem solid transparent',
    marginTop: '47px',
    padding: '24px 32px',
    '@media (max-width: 440px)': {
      boxShadow: '0rem 0px 0px 0px #00000033',
      border: 'none',
      marginTop: '32px',
      padding: '0 20px 64px 20px', 
    },
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
          height: '24px',
        }
    },
  },
  title: {
    fontWeight: 'bold',
    fontSize: '28px',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    paddingBottom: '2.5rem',
    fontFamily: 'Nunito',
    lineHeight: 'normal',
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
    px: 2,
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
    color: '#fff',
    '&:hover': {
        borderColor: '#000000',
        backgroundColor: 'lightgreen',
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
    margin: '40px 0 0',
    fontFamily: 'Nunito',
    fontSize: '16px',
    '@media (max-width: 440px)': {
        marginTop: '32px',
    }
  },
  loginLink: {
    color: '#F45745',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontFamily: 'Nunito',
    textDecoration: 'none',
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
        padding: '13px 16px',
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
  },
};
