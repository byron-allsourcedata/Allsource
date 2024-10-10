import { SxProps, Theme } from '@mui/system';
import { yellow, grey, red } from '@mui/material/colors';

export const planStyles: { [key: string]: SxProps<Theme> } = {
  pageContainer: {
    fontFamily: 'Nunito',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2em',
  },
  headers: {
    display: 'flex',
    marginTop: '10px',
    justifyContent: 'space-between',
    width: '100%',
    color: 'rgba(244, 87, 69, 1)',
  },
  account: {
    padding: '10px',
    width: '1em',
    // marginRight: '1em',
    // marginBottom: "3.5em",
    // marginLeft: "2em",
    // marginTop: "2em",
    color: 'rgba(128, 128, 128, 1)',
    border: '1px solid rgba(184, 184, 184, 1)',
    borderRadius: '3.27px'
  },
  logoContainer: {
    marginBottom: '3.5em',
    marginLeft: '2em',
    marginTop: '2em'
  },
  title: {
    whiteSpace: 'nowrap',
    textAlign: 'start',
    lineHeight: '22px',
    margin: 0
  },
  formContainer: {
    display: 'flex',
    gap: '2em',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    '@media (max-width: 900px)': {
      flexDirection: 'column'
    },
  },
  card: {
    padding: '24px 24px',
    borderRadius: '0.5em',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    fontFamily: "Nunito",
    fontSize: '40px',
    fontWeight: '700',
    color: 'rgba(74, 74, 74, 1)',
    backgroundColor: '#fff',
    border: '1px solid #eee',
  },
  planName: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'start',
    fontFamily: 'Nunito',
    color: red[500],
    marginBottom: '2em',
  },
  planDot: {
    width: '10px',
    height: '10px',
    backgroundColor: red[500],
    textAlign: 'start',
    borderRadius: '50%',
    boxShadow: '0 0 4px rgba(244, 87, 69, 1)',
    marginRight: '0.5em',
  },
  price: {
    fontWeight: 'bold',
    marginBottom: '2em',
    fontFamily: 'Nunito',
    fontSize: '40px',
    lineHeight: '54.56px',
  },
  priceSub: {
    fontSize: '0.5em',
    color: grey[500],
  },
  features: {
    marginBottom: '2em',
    marginRight: '68px'
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.5em',
  },
  boltIcon: {
    color: yellow[700],
    marginRight: '0.5em',
  },
  formWrapper: {
    maxWidth: '380px'
  },
  submitButton: {
    color: red[500],
    borderColor: red[500],
    fontSize: '16px',
    fontWeight: '500',
    lineHeight: '22.4px',
    padding: '0.7em 0em 0.7em',
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'rgba(244, 87, 69, 1)',
      borderColor: 'rgba(244, 87, 69, 1)',
      color: 'rgba(255, 255, 255, 1)'
    },
  },
  buttonHeading: {
        textTransform: 'none',
        padding: '0 0 10px 0',
        minWidth: 'auto',
        boxShadow: 'none',
        borderRadius: 0,
        border: 'none',
        background: 'none',
        lineHeight: 'normal !important',
        '@media (max-width: 600px)': {
            alignItems: 'flex-start',
            p: 0,
            whiteSpace: 'nowrap'
        },
        '&:hover': {
          border: 'none',
          background: 'none',
        },
        '&.MuiButton-contained': {
            color: '#5052b2',
            background: 'transparent',
            borderBottom: '2px solid #5052b2',
            fontWeight: '700',
            '&:hover': {
              boxShadow: 'none'
            }
        }
  },
  formField: {
    margin: '0',
},
inputLabel: {
    fontFamily: 'Nunito Sans',
    fontSize: '12px',
    lineHeight: '16px',
    color: 'rgba(17, 17, 19, 0.60)',
    '&.Mui-focused': {
        color: '#0000FF',
      },
},
formInput: {
    '&.MuiFormControl-root': {
        margin: 0,
    },
    '&.MuiOutlinedInput-root': {
      height: '48px',
      '& .MuiOutlinedInput-input': {
        padding: '12px 16px 13px 16px',
        fontFamily: 'Roboto',
        color: '#202124',
        fontSize: '14px',
        lineHeight: '20px'
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
  orDivider: {
    display: 'flex',
    alignItems: 'center',
    margin: '0 -40px'
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
    margin: '-24px 0 0'
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
};
