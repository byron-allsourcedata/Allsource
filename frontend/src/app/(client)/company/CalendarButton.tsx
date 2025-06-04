import { DateRangeIcon } from "@/icon"
import { Button, Typography } from "@mui/material"

export type Props = {
    isCalendarOpen: boolean;
    handleCalendarClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    formattedDates: string;
    status: string | null;
}

export const CalendarButton = (props: Props) => {
    const {status, isCalendarOpen, handleCalendarClick, formattedDates} = props;

    return (
        <Button
            aria-controls={isCalendarOpen ? 'calendar-popup' : undefined}
            aria-haspopup="true"
            disabled={status === 'PIXEL_INSTALLATION_NEEDED'}
            aria-expanded={isCalendarOpen ? 'true' : undefined}
            onClick={handleCalendarClick}
            sx={{
                textTransform: 'none',
                color: 'rgba(128, 128, 128, 1)',
                border: formattedDates ? '1px solid rgba(56, 152, 252, 1)' : '1px solid rgba(184, 184, 184, 1)',
                borderRadius: '4px',
                opacity: status === 'PIXEL_INSTALLATION_NEEDED' ? '0.5' : '1',
                padding: '8px',
                minWidth: 'auto',
                '@media (max-width: 900px)': {
                    border: 'none',
                    padding: 0
                },
                '&:hover': {
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(56, 152, 252, 1)',
                    color: 'rgba(56, 152, 252, 1)',
                    '& .MuiSvgIcon-root': {
                        color: 'rgba(56, 152, 252, 1)'
                    }
                }
            }}
        >
            <DateRangeIcon fontSize='medium' sx={{ color: formattedDates ? 'rgba(56, 152, 252, 1)' : 'rgba(128, 128, 128, 1)', }} />
            <Typography variant="body1" sx={{
                fontFamily: 'Nunito Sans',
                fontSize: '14px',
                fontWeight: '600',
                lineHeight: '19.6px',
                textAlign: 'left',

                "@media (max-width: 600px)": {
                    display: 'none'
                },
            }}>
                {formattedDates}
            </Typography>
        </Button>
    )
}