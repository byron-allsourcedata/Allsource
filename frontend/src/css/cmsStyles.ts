import { red } from '@mui/material/colors';
import { SxProps, Theme } from '@mui/system';

export const styles: { [key: string]: SxProps<Theme> } = {
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
  formField: {
    maxHeight: '56px',
    maxWidth: '100%',
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
    '& .MuiInputLabel-root': {
      top: '-5px',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#0000FF',
    },
  },
  form: {
    display: 'flex', flexDirection: 'column', width: '100%', justifyContent: 'center', alignContent: 'center', '@media (max-width: 400px)': { paddingLeft: 2.5, }, '@media (max-width: 600px)': { paddingRight: 2.5, paddingLeft: 2.5, }
  },
  submitButton: {
    backgroundColor: 'rgba(80, 82, 178, 1)',
    textTransform: 'none',
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: '16px',
    lineHeight: '22.4px',
    padding: '1em',
    color: '#fff',
    '&:hover': {
      backgroundColor: 'rgba(88, 90, 178, 1)',
    },
    '@media (max-width: 600px)': { marginBottom: 0.35, fontSize: '14px', fontWeight: '400' }
  },
};
