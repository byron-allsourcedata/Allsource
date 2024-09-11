import { SxProps, Theme } from '@mui/system';

export const filterStyles: { [key: string]: SxProps<Theme> } = {
    filter_name: {
        flexGrow: 1,
        color: "rgba(115, 115, 115, 1)",
        fontFamily: "Nunito",
        fontWeight: "600",
        fontSize: "14px",
        lineHeight: "19.6px",
    },
    filter_dropdown:{
        display: "flex",
        flexDirection: "rows",
        gap: 4,
        pl: 2,
        justifyContent: "start",
    },
    date_time_formatted:{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        mt: '20px',
        mb: '20px',
        '@media (max-width: 440px)': {
          marginTop: '16px',
          marginBottom: '16px',
        }
    },
    or_text: {
        px: '8px',
        fontWeight: '400',
        fontSize: '12px',
        fontFamily: 'Nunito',
        color: '4a4a4a',
        lineHeight: '16px'
    },
    filter_form: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        gap: 1,
    },
    main_filter_form: {
        width: "100%",
        border: "1px solid rgba(228, 228, 228, 1)",
        padding: "0.5em",
    },
    active_filter_dote: {
        width: '8px',
        height: '8px',
        backgroundColor: "rgba(80, 82, 178, 1)",
        borderRadius: "50%",
    },
    collapse_font: {
        fontFamily: 'Nunito',
        color: 'rgba(74, 74, 74, 1)',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: '16.8px'
    }

};