import { SxProps, Theme } from '@mui/system';

export const accountStyles: { [key: string]: SxProps<Theme> } = {
  name: {
    fontFamily: 'Nunito',
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '19.1px',
    color: 'rgba(74, 74, 74, 1)'
  },
  text: {
    fontFamily: 'Nunito',
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '19.1px',
    color: 'rgba(74, 74, 74, 1)'
  },
  title: {
    fontFamily: 'Nunito',
    fontSize: '18px',
    fontWeight: '700',
    lineHeight: '19.1px',
    color: 'rgba(74, 74, 74, 1)'
  },
  headers_title: {
    textTransform: 'none',
    borderRadius: '0',
    fontFamily: 'Nunito',
    fontSize: '16px',
  }
};