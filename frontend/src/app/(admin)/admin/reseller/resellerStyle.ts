import { SxProps, Theme } from '@mui/system';

export const resellerStyle: { [ket: string]: SxProps<Theme>} = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        backgroundColor: '#ffffff',
        maxWidth: '25rem',
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
      headers: {
        width: '100%',
        display: 'flex',
        marginTop: '10px',
        justifyContent: 'space-between',
        alignItems: 'center',
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
      logoContainer: {
        paddingLeft: '2.5em',
        paddingRight: '0.5em',
      },
      title: {
        mb: 2,
        fontWeight: 'bold',
        fontSize: '16px',
        whiteSpace: 'nowrap',
        textAlign: 'start',
        padding: '1.5rem 0rem 0',
        fontFamily: 'Nunito Sans',
      }
}