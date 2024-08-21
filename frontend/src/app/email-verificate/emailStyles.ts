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
        '@media (max-height: 670px)': {
          boxShadow: '0rem 0px 0px 0px #00000033',
          border: 'none',
          marginTop: '2em',
        },
      },
      hidepc: {
        display: 'none',
        visibility: 'hidden'
      },
      headers: {
        display: 'flex',
        marginTop: '10px',
        justifyContent: 'space-between', 
        alignItems: 'center', 
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
        textTransform: 'none',
        textDecoration: 'none',
        textWrap: 'nowrap'
      },
      loginLink: {
        color: '#F45745',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontFamily: 'Nunito',
        textDecoration: 'none',
        margin: '16px 89px 24px',
        textTransform: 'none',
      },
}