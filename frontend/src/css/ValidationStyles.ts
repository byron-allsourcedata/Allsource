import { SxProps, Theme } from '@mui/system';

export const ValidationStyle: { [key: string]: SxProps<Theme> } = {
    filter_name: {
        flexGrow: 1,
        color: "rgba(32, 33, 36, 1)",
        fontFamily: "Nunito Sans",
        fontWeight: "500",
        fontSize: "14px",
        lineHeight: "19.6px",
    },
    filter_dropdown: {
        display: "flex",
        flexDirection: "rows",
        gap: 4,
        pl: 2,
        justifyContent: "start",
    },
    date_time_formatted: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        mt: '10px',
        mb: '10px',
        '@media (max-width: 440px)': {
            marginTop: '16px',
            marginBottom: '16px',
        }
    },
    or_text: {
        px: '8px',
        fontWeight: '400',
        fontSize: '12px',
        fontFamily: 'Nunito Sans',
        color: 'rgba(74, 74, 74, 1)',
        lineHeight: '16px'
    },
    filter_form: {
        display: "flex",
        alignItems: "center",
        justifyContent: "start",
        width: "100%",
        gap: 1,
        cursor: 'pointer'
    },
    main_filter_form: {
        width: "100%",
        borderBottom: "1px solid rgba(228, 228, 228, 1)",
    },
    active_filter_dote: {
        width: '8px',
        height: '8px',
        backgroundColor: "rgba(80, 82, 178, 1)",
        borderRadius: "50%",
    },
    collapse_font: {
        fontFamily: 'Nunito Sans',
        color: 'rgba(74, 74, 74, 1)',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: '16.8px'
    },
    datetime_picker: {
        '& .MuiInputBase-input': {
            fontFamily: 'Nunito Sans',
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: '19.6px',
            textAlign: 'left',
        },
        '& .MuiInputLabel-root': {
            fontFamily: 'Nunito Sans',
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: '19.6px',
            textAlign: 'left',
        }

    }

};