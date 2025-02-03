import { SxProps, Theme } from '@mui/system';
import { red } from '@mui/material/colors';

export const styles: { [key: string]: SxProps<Theme> } = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: "100vh",
  },
  employeeButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    color: 'rgba(0, 0, 0, 1)',
    width: '100%',
    marginBottom: '2.5em',
    textTransform: 'none',
    '@media (max-width: 600px)': { marginBottom: 1, gap: '14px', }
  },
  visitsButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    color: 'rgba(0, 0, 0, 1)',
    width: '100%',
    marginBottom: '2.5em',
    textTransform: 'none',
    '@media (max-width: 600px)': { marginBottom: 2.5 },
    '@media (max-width: 400px)': { marginBottom: 1.5, gap: '16px', },
  },
  visitButton: {
    padding: '9px 16px',
    color: 'rgba(0, 0, 0, 1)',
    border: '1px solid #d0d5dd',
    borderRadius: '4px',
    textWrap: 'nowrap',
    textTransform: 'none',
    '@media (max-width: 400px)': { width: '96px', maxHeight: '38px' },
    '&:hover': {
      backgroundColor: "#fde2e3",
      color: "#202124 !important",
      border: '1px solid #f45745'
    }
  },
  employeeButton: {
    padding: '9px 20px',
    border: '1px solid #d0d5dd',
    borderRadius: '4px',
    textTransform: 'none',
    '@media (max-width: 600px)': { padding: '8px 16px', minWidth: '96px', maxHeight: '38px' },
    '&:hover': {
      backgroundColor: "#fde2e3",
      color: "#202124 !important",
      border: '1px solid #f45745'
    }
  },
  rolesButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    width: '100%',
    marginBottom: '2.5em',
    textTransform: 'none',
    '@media (max-width: 600px)': { marginBottom: 2, width: '100%', gap: '16px' },
    '@media (max-width: 400px)': { marginBottom: 1.5, width: '100%', gap: '14px' },

  },
  roleButton: {
    border: '1px solid #d0d5dd',
    borderRadius: '4px',
    textTransform: 'none',
    padding: '8px 8px',
    '@media (max-width: 600px)': { padding: '10px' },
    '@media (max-width: 400px)': { padding: '5px' },
    '&:hover': {
      backgroundColor: "#fde2e3",
      color: "#202124 !important",
      border: '1px solid #f45745'
    }
  },
  activeButton: {
    backgroundColor: '#007BFF',
    color: '#fff',
  },
  headers: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: "fixed",
    top: 0,
    padding: "1.125rem 1.5rem",
    width: '100%',
    color: 'rgba(244, 87, 69, 1)',
    borderBottom: `1px solid rgba(228, 228, 228, 1)`,
    '@media (max-width: 600px)': { display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'start' },

  },
  header: {
    display: 'flex',
    marginTop: '10px',
    justifyContent: 'space-between',
    fontFamily: 'Nunito Sans',
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '21.82px',
    width: '100%',
    color: 'rgba(244, 87, 69, 1)',
    borderBottom: `1px solid rgba(244, 87, 69, 1)`,
    marginBottom: '1.25em',
  },
  account: {
    padding: '10px',
    width: '1em',
    marginRight: '1em',
    marginBottom: '5px',
    color: 'rgba(128, 128, 128, 1)',
    border: '1px solid rgba(184, 184, 184, 1)',
    borderRadius: '3.27px'
  },
  nav: {
    display: 'flex',
    gap: '1em',
    '@media (max-width: 600px)': { gap: 0.5 }
  },
  logo: {
    display: 'flex',
    justifyItems: 'start',
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '556px',
    width: '100%',
    marginTop: '85px',
    maxHeight: "calc(100vh - 85px)",
    alignItems: 'center',
    justifyContent: 'center',
    '@media (max-height: 670px)': { pl: 0, gap: 0 },
    '@media (max-width: 600px)': { height: '77vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    '@media (max-width: 400px)': { pl: 0, pt: 0, height: '77vh', },


  },
  title: {
    fontWeight: '600',
    marginBottom: '0.25em',
    textAlign: 'start',
    '@media (max-width: 600px)': { marginBottom: '0.15em', }
  },
  subtitle: {
    marginBottom: '2em',
    color: '#707071 !important',
    textAlign: 'start',
    '@media (max-width: 600px)': { marginBottom: 0.15 }
  },
  text: {
    fontWeight: '500',
    textAlign: 'left',
    paddingBottom: '0.75em',
    '@media (max-width: 600px)': { marginBottom: 0 }
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
  formInput: {
    '&.MuiOutlinedInput-root': {
      height: '48px',
      '& .MuiOutlinedInput-input': {
        padding: '12px 16px 13px 16px',
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

  formField: {
    marginTop: 0,
    marginBottom: '1.5em',
    maxHeight: '56px',
    '& .MuiInputBase-root': {
      maxHeight: '48px',
    },
    '&.Mui-focused': {
      color: '#0000FF',
    },
    '& .MuiOutlinedInput-root': {
      paddingTop: '13px',
      paddingBottom: '13px',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#0000FF',
    },
  },
  form: {
    display: 'flex', 
    flexDirection: 'column', 
    width: '100%', 
    height: '100%',
    '@media (max-width: 400px)': { paddingLeft: 2.5, }, 
    '@media (max-width: 600px)': { paddingRight: 2.5, paddingLeft: 2.5, }
  },
  submitButton: {
    backgroundColor: 'rgba(244, 87, 69, 1)',
    textTransform: 'none',
    padding: '1em',
    color: '#fff !important',
    '&:hover': {
      backgroundColor: red[700],
    },
    '@media (max-width: 600px)': { marginBottom: 0.35, fontSize: '14px', fontWeight: '400' }
  },
};
