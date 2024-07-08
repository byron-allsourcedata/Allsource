import { SxProps, Theme } from '@mui/system';

export const emailStyles: { [key: string]: SxProps<Theme> } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '32rem',
        margin: '0 auto',
        position: 'relative',
        boxShadow: '0rem 2px 8px 0px #00000033',
        borderRadius: '0.625rem',
        border: '0.125rem solid transparent',
        marginTop: '120px',
        '@media (max-width: 440px)': {
          boxShadow: '0rem 0px 0px 0px #00000033',
          border: 'none',
          marginTop: '3.75em',
        },
      },
      hidepc: {
        display: 'none',
        visibility: 'hidden'
      },
      logoContainer: {
        paddingLeft: '2.5em',
        paddingRight: '0.5em',
      },
      title: {
        mb: 2,
        fontWeight: 'bold',
        fontSize: '28px',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        padding: '1.5rem 1rem 2.5rem',
        fontFamily: 'Nunito',
      },
      icon: {
        marginBottom: '20px',
      },
      form: {
        maxWidth: '100%',
        fontFamily: 'Nunito',
        text: 'nowrap',
        alignItems: 'center',
        padding: '1em 2.25em'
      },
      orDivider: {
        alignItems: 'center',
        width: '100%',
        maxWidth: '22.5rem',
        mt: '24px',
        mb: '24px',
        display: 'none',
        visibility: 'hidden',
        '@media (max-width: 440px)': {
          display: 'flex',
          visibility: 'visible',
        },
      },
      orText: {
        px: 2,
        fontWeight: 'regular',
        fontSize: '14px',
        fontFamily: 'Nunito',
      },
      text: {
        fontFamily: 'Nunito',
        fontSize: '14px',
        textAlign: 'center',
      },
      resetPassword: {
        mt: 2,
        margin: '1em 0em 0em',
        fontFamily: 'Nunito',
        fontSize: '16px',
      },
      loginLink: {
        color: '#F45745',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontFamily: 'Nunito',
        textDecoration: 'none',
        margin: '16px 89px 24px'
      },
}