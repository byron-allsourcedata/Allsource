import { SxProps, Theme } from "@mui/system";

export const accountStyles: { [key: string]: SxProps<Theme> } = {
  name: {
    fontFamily: 'Nunito Sans',
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '19.1px',
    color: 'rgba(74, 74, 74, 1)'
  },
  inputLabel: {
    '& .MuiOutlinedInput-root': {
      '&:hover fieldset': {
        borderColor: '#A3B0C2',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#A3B0C2',
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#A3B0C2',
    },
  },
  header_text: {
    fontFamily: 'Nunito Sans',
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '19.1px',
    color: 'rgba(74, 74, 74, 1)',
  },
  text: {
    fontFamily: 'Nunito Sans',
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '19.1px',
    color: 'rgba(74, 74, 74, 1)',
    flex: 1,
    wordWrap: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  title_text: {
    fontFamily: 'Nunito Sans',
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '19.1px',
    flex: 1,
  },
  title: {
    fontFamily: 'Nunito Sans',
    fontSize: '18px',
    fontWeight: '700',
    lineHeight: '19.1px',
    color: 'rgba(74, 74, 74, 1)',
    display: 'flex',
    pt:0.5,
    flexDirection: 'row',
    gap: 1,
    pb: 1.5,
    borderBottom: '1px solid rgba(240, 240, 240, 1)',
    paddingLeft: 3,
    '@media (max-width:600px)': {pt:1, pl:1.5}
  },
  headers_title: {
    textTransform: 'none',
    borderRadius: '0',
    fontFamily: 'Nunito Sans',
    fontSize: '16px',
  },
  rows_pam: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingLeft: 3,
    paddingRight: 2,
    borderBottom: '1px solid rgba(240, 240, 240, 1)',
    pb: 1,
    '@media (max-width:600px)': {pl:1.5, pr: 1.5}
  },
  box_param: {
    mt: 2,
    padding: '16px 0px',
    gap: 2,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '93%',
    boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(240, 240, 240, 1)',
    '@media (max-width: 600px)': {
      padding: '8px',
      width: '100%',
      maxWidth: '93%',
    },
  }
};
