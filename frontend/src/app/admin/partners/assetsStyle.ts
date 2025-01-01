import { SxProps, Theme } from "@mui/material";

export const assetsStyle: { [key: string]: SxProps<Theme> } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        backgroundColor: '#ffffff',
        width: '100%',
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
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
      },
      title: {
        fontWeight: 'bold',
        fontSize: '16px',
        whiteSpace: 'nowrap',
        textAlign: 'start',
        fontFamily: 'Nunito Sans',
      },
      button_success: {
        fontWeight: 400,
        backgroundColor: '#EAF8DD', 
        color: '#6EC125' 
      },
      button_reject: {
        fontWeight: 400,
        backgroundColor: '#FCD4CF',
        color: '#F45745'
      },
      button_pending: {
        fontWeight: 400,
        backgroundColor: '#FEF3CD',
        color: '#FBC70E'
      },
      modalStyle: {
          position: 'absolute' as 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
      }
}