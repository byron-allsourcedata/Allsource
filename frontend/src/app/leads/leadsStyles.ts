import { SxProps, Theme } from '@mui/system';

export const leadsStyles: { [key: string]: SxProps<Theme> } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: '25rem',
    maxHeight: '100vh',
    margin: '0 auto',
    position: 'relative',
    boxShadow: '0rem 0.2em 0.8em 0px #00000033',
    borderRadius: '0.625rem',
    border: '0.125rem solid transparent',
    marginTop: '7.5em',
    '@media (max-width: 440px)': {
      boxShadow: '0rem 0px 0px 0px #00000033',
      border: 'none',
      marginTop: '3.75em',
    },
  },
  page_number: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    color: 'rgba(80, 82, 178, 1)',
    
  },

  table_array: {
    fontFamily: 'Nunito', fontSize: '14px', fontWeight: '400',
    lineHeight: '19.6px',
    textAlign: 'left',
    textWrap: 'nowrap',
    color: '#000',
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
    fontFamily: 'Nunito', fontSize: '14px', border: '1px solid rgba(235, 235, 235, 1)', fontWeight: '400',
    lineHeight: '19.6px',
    textAlign: 'left',
    textWrap: 'nowrap',
    background: 'rgba(235, 243, 254, 1)',
    color: 'rgba(20, 110, 246, 1)',
  },
  table_array_phone: {
    fontFamily: 'Nunito', fontSize: '14px', fontWeight: '400',
    lineHeight: '19.6px',
    textAlign: 'left',
    textWrap: 'wrap',
    color: '#000',
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
  table_column: {
    fontFamily: 'Nunito', fontSize: '14px', fontWeight: '700',
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
  }

  }
  ,
  headers: {
    display: 'flex',
    marginTop: '10px',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    color: 'rgba(244, 87, 69, 1)',
    borderBottom: `1px solid rgba(228, 228, 228, 1)`,
  },
  account: {
    padding: '10px',
    width: '1em',
    color: 'rgba(128, 128, 128, 1)',
    border: '1px solid rgba(184, 184, 184, 1)',
    borderRadius: '3.27px'
  },
  subtitle: {
    fontWeight: '600',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    textAlign: 'start',
    fontFamily: 'Nunito',
    color: '#595959',
    '@media (max-width: 385px)': {
      fontSize: '12px'
    },
    '@media (max-width: 350px)': {
      fontSize: '10px'
    }
  },
  logoContainer: {
    paddingLeft: '2.5em',
    paddingRight: '0.5em',
  },
  title: {
    fontWeight: 'bold',
    fontSize: '18px',
    // whiteSpace: 'nowrap',
    textAlign: 'start',
    padding: '0 0rem 0',
    fontFamily: 'Nunito',
    mr: '1.5em',
    '@media (max-width: 440px)': {
      fontSize: '16px'
    },
    '@media (max-width: 380px)': {
      fontSize: '12px',
      marginRight: '0'
    }
  },
  formContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2em',
    padding: '0 14em',
    '@media (max-width: 900px)': {
      gridTemplateColumns: 'repeat(1, 1fr)',
      padding: '0 2em',
    },
  },
  formWrapper: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '280px',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    boxShadow: '0rem 0.2em 0.8em 0px #00000033',
    borderRadius: '0.625rem',
    border: '0.125rem solid transparent',
    padding: '2rem',
  },
  form: {
    width: '100%',
    maxWidth: '360px',
    padding: '220px 0px 24px',
    fontFamily: 'Nunito',
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
    margin: '24px 0px 0 0px',
    textTransform: 'none',
    minHeight: '3rem',
    fontSize: '16px',
    fontFamily: 'Nunito',
  },
};