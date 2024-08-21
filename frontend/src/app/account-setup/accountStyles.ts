import { SxProps, Theme } from '@mui/system';
import { red } from '@mui/material/colors';

export const styles: { [key: string]: SxProps<Theme> } = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingLeft: '0px',
    paddingTop: '1.5em',
    fontFamily: 'Nunito'
  },
  employeeButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    color: 'black',
    width: '100%',
    marginBottom: '2.5em',
    textTransform: 'none',
    '@media (max-width: 600px)': { marginBottom: 1, }
  },
  visitsButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    color: 'black',
    width: '100%',
    marginBottom: '2.5em',
    textTransform: 'none',
    '@media (max-width: 400px)': { marginBottom: 1.5 },
    '@media (max-width: 600px)': { marginBottom: 2.5 }
  },
  visitButton: {
    padding: '9px 16px',
    color: 'black',
    border: '1px solid #ccc',
    textTransform: 'none'
  },
  employeeButton: {
    padding: '0.25em 2.25em',
    color: 'black',
    border: '1px solid #ccc',
    textTransform: 'none',
  },
  rolesButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    color: 'black',
    width: '115%',
    marginBottom: '2.5em',
    textTransform: 'none',
    '@media (max-width: 400px)': { marginBottom: 1.5, width: '100%' },
    '@media (max-width: 600px)': { marginBottom: 2.5, width: '100%' }
  },
  roleButton: {
    padding: '0.25em 1.5em',
    color: 'black',
    border: '1px solid #ccc',
    textTransform: 'none'
  },
  activeButton: {
    backgroundColor: '#007BFF',
    color: '#fff',
  },
  headers: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: '2em',
    marginLeft: '2em',
    textTransform: 'none',
    textDecoration: 'none',
    width: '100%',
    color: 'rgba(244, 87, 69, 1)',
    borderBottom: `1px solid rgba(228, 228, 228, 1)`,
    marginBottom: '1.25em',
    '@media (max-width: 600px)': { display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'start' },
    '@media (max-height: 670px)': { marginBottom: 1 }
  },
  header: {
    display: 'flex',
    marginTop: '10px',
    justifyContent: 'space-between',
    fontFamily: 'Nunito',
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '21.82px',
    textAlign: 'left',
    width: '100%',
    color: 'rgba(244, 87, 69, 1)',
    borderBottom: `1px solid rgba(244, 87, 69, 1)`,
    marginBottom: '1.25em',
  },
  subheader: {
    fontFamily: 'Nunito',
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '21.82px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    marginTop: '10px',
    color: 'rgba(142, 142, 142, 1)'
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
    marginBottom: '1em',
    '@media (max-width: 600px)': { gap: 0.5 }
  },
  logo: {
    display: 'flex',
    justifyItems: 'start',
    paddingBottom: '20px',
    paddingLeft: '20px'
  },
  formContainer: {
    pt: 10,
    display: 'flex',
    maxWidth: '600px',
    width: '90%',
    flexDirection: 'column',
    alignItems: 'start',
    borderRadius: '0.5em',
    backgroundColor: '#fff',
    '@media (max-width: 400px)': { pl: 2, pt: 0 },
    '@media (max-width: 600px)': { pl: 0, pt: 8, gap: 1 },
    '@media (max-height: 670px)': { pl: 0, pt: 1, gap: 0 },
    '@media (min-width: 1500px)': {pt: 'calc(15vh)',},
  },
  title: {
    fontFamily: 'Nunito',
    fontSize: '28px',
    fontWeight: '700',
    lineHeight: '38.19px',
    marginBottom: '0.25em',
    textAlign: 'start',
    '@media (max-width: 600px)': { fontSize: '24px', lineHeight: '32.74px', }
  },
  subtitle: {
    marginBottom: '2em',
    color: 'rgba(138, 138, 138, 1)',
    fontFamily: 'Nunito',
    fontSize: '16px',
    fontWeight: '700',
    textAlign: 'start',
    '@media (max-width: 600px)': { marginBottom: 0.35 }
  },
  text: {
    color: 'rgba(72, 72, 72, 1)',
    fontFamily: 'Nunito',
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '21.82px',
    textAlign: 'left',
    paddingBottom: '0.5em',
    '@media (max-width: 600px)': { marginBottom: 0.35, fontSize: '14px', fontWeight: '400' }
  },

  formField: {
    marginBottom: '1.5em',
  },
  submitButton: {
    backgroundColor: 'rgba(244, 87, 69, 1)',
    textTransform: 'none',
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: '16px',
    lineHeight: '22.4px',
    padding: '1em',
    color: '#fff',
    '&:hover': {
      backgroundColor: red[700],
    },
    '@media (max-width: 600px)': { marginBottom: 0.35, fontSize: '14px', fontWeight: '400' }
  },
};
