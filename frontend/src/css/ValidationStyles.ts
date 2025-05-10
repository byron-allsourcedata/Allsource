import { SxProps, Theme } from '@mui/system';

export const ValidationStyle: { [key: string]: SxProps<Theme> } = {
    filter_name: {
        color: "rgba(32, 33, 36, 1)",
        fontFamily: "Nunito Sans",
        fontWeight: "500",
        fontSize: ".875rem",
        lineHeight: "1.225rem",
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
        mt: '.625rem',
        mb: '.625rem',
        '@media (max-width: 27.5rem)': {
            marginTop: '1rem',
            marginBottom: '1rem',
        }
    },
    or_text: {
        px: '.5rem',
        fontWeight: '400',
        fontSize: '.75rem',
        fontFamily: 'Nunito Sans',
        color: 'rgba(74, 74, 74, 1)',
        lineHeight: '1rem'
    },
    filter_form: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        gap: 1,
        cursor: 'pointer'
    },
    main_filter_form: {
        width: "100%",
        borderBottom: ".0625rem solid rgba(228, 228, 228, 1)",
    },
    active_filter_dote: {
        width: '.5rem',
        height: '.5rem',
        backgroundColor: "rgba(56, 152, 252, 1)",
        borderRadius: "50%",
    },
    collapse_font: {
        fontFamily: 'Nunito Sans',
        color: 'rgba(74, 74, 74, 1)',
        fontSize: '.75rem',
        fontWeight: 600,
        lineHeight: '1.05rem'
    },
    datetime_picker: {
        '& .MuiInputBase-input': {
            fontFamily: 'Nunito Sans',
            fontSize: '.875rem',
            fontWeight: 400,
            lineHeight: '1.225rem',
            textAlign: 'left',
        },
        '& .MuiInputLabel-root': {
            fontFamily: 'Nunito Sans',
            fontSize: '.875rem',
            fontWeight: 400,
            lineHeight: '1.225rem',
            textAlign: 'left',
        }

    }

};