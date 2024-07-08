import { SxProps, Theme } from '@mui/system';
import { red, grey } from '@mui/material/colors';

export const styles: { [key: string]: SxProps<Theme> } = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2em',
    fontFamily: 'Nunito'
  },
  employeeButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  employeeButton: {
    margin: '8px',
    padding: '16px',
    border: '1px solid #ccc',
  },
  activeButton: {
    backgroundColor: '#007BFF',
    color: '#fff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    padding: '1em 2em',
    borderBottom: `1px solid rgba(244, 87, 69, 1)`,
    marginBottom: '2em',
  },
  nav: {
    display: 'flex',
    gap: '2em',
  },
  logo: {
    display: 'flex',
    justifyItems: 'start',
    paddingBottom: '20px'
  },
  formContainer: {
    maxWidth: '600px',
    width: '100%',
    padding: '2em',
    borderRadius: '0.5em',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: '1em',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: '2em',
    color: grey[600],
    textAlign: 'center',
  },
  formField: {
    marginBottom: '1.5em',
  },
  employeeButtons: {
    display: 'flex',
    gap: '1em',
    marginBottom: '2em',
    flexWrap: 'wrap',
  },
  employeeButton: {
    padding: '0.5em 1em',
    borderRadius: '0.5em',
    border: `1px solid ${grey[300]}`,
    backgroundColor: '#fff',
    '&:hover': {
      backgroundColor: grey[100],
    },
  },
  activeButton: {
    backgroundColor: red[100],
    borderColor: red[500],
    color: red[500],
    '&:hover': {
      backgroundColor: red[50],
    },
  },
  submitButton: {
    backgroundColor: red[500],
    color: '#fff',
    '&:hover': {
      backgroundColor: red[700],
    },
  },
};
