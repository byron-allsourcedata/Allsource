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
    fontFamily: 'Nunito',
    fontSize: '40px',
    marginBottom: '2em',
    fontWeight: '700',
    textAlign: 'center',
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
};
