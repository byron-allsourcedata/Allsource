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
  submitButton: {
    backgroundColor: red[500],
    color: '#fff',
    '&:hover': {
      backgroundColor: red[700],
    },
  },
};
