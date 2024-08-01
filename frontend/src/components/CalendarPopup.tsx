import React, { useState } from 'react';
import { Popover, Box, Button, Typography, Divider, Backdrop } from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../css/calendar_styles.css';

import { subDays, subMonths } from 'date-fns';

interface CalendarPopupProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    onDateChange: (dates: { start: Date | null; end: Date | null }) => void;
}

const CalendarPopup: React.FC<CalendarPopupProps> = ({ anchorEl, open, onClose, onDateChange }) => {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const handleChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);
        onDateChange({ start, end });
    };

    const handleToday = () => {
        const today = new Date();
        setStartDate(today);
        setEndDate(today);
        onDateChange({ start: today, end: today });
    };

    const handleLast7Days = () => {
        const end = new Date();
        const start = subDays(end, 7);
        setStartDate(start);
        setEndDate(end);
        onDateChange({ start, end });
    };

    const handleLastMonth = () => {
        const end = new Date();
        const start = subMonths(end, 1);
        setStartDate(start);
        setEndDate(end);
        onDateChange({ start, end });
    };

    const handleClear = () => {
        setStartDate(null);
        setEndDate(null);
        onDateChange({ start: null, end: null });
    };

    const handleApply = () => {
        onDateChange({ start: startDate, end: endDate });
        onClose();
    };

    return (
        <>
            <Backdrop open={open} sx={{ zIndex: 1200, color: '#fff' }} />
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={onClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                PaperProps={{
                    style: {
                        minWidth: '320px',
                        maxHeight: '500px',
                    },
                }}
            >
                <Box sx={{ padding: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mb: 2, borderBottom: '0.5px solid rgba(190, 190, 190, 1)' }}>
                        <Box display="flex" justifyContent="space-between" mb={2}>
                            <Button onClick={handleToday}><Typography sx={{ fontFamily: 'Nunito', color: 'rgba(0, 0, 0, 1)', textTransform: 'none' }}>Today</Typography></Button>
                            <Button onClick={handleLast7Days}><Typography sx={{ fontFamily: 'Nunito', color: 'rgba(0, 0, 0, 1)', textTransform: 'none' }}>Last 7 days</Typography></Button>
                            <Button onClick={handleLastMonth}><Typography sx={{ fontFamily: 'Nunito', color: 'rgba(0, 0, 0, 1)', textTransform: 'none' }}>Last Month</Typography></Button>
                        </Box>
                    </Box>

                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', mb: 2, borderBottom: '0.5px solid rgba(190, 190, 190, 1)'}}>
                        <DatePicker
                            selected={startDate}
                            startDate={startDate || undefined}
                            endDate={endDate || undefined}
                            onChange={handleChange}
                            selectsRange
                            inline
                            calendarClassName="react-datepicker"
                            renderDayContents={(day) => <span>{day}</span>}
                        />
                    </Box>
                </Box>

                {/* Footer Buttons */}
                <Box
                    display="flex"
                    justifyContent="flex-end"
                    mt={2}
                    mr={2}
                    sx={{
                        gap: 1,
                        padding: 2,
                    }}
                >
                    <Button
                        onClick={handleClear}
                        sx={{
                            width: '55px',
                            fontFamily: 'Nunito',
                            height: '30px',
                            padding: '4px 8px',
                            borderRadius: '4px 0 0 0',
                            backgroundColor: startDate || endDate ? 'rgba(228, 228, 228, 1)' : 'rgba(200, 200, 200, 1)',
                            color: '#333',
                            textTransform: 'none',
                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                            opacity: startDate || endDate ? 1 : 0.5,
                            cursor: startDate || endDate ? 'pointer' : 'not-allowed',
                        }}
                        disabled={!startDate && !endDate}
                    >
                        <Typography sx={{ fontFamily: 'Nunito' }}>Clear</Typography>
                    </Button>
                    <Button
                        onClick={handleApply}
                        sx={{
                            width: '60px',
                            height: '30px',
                            padding: '4px 8px',
                            borderRadius: '4px 0 0 0',
                            backgroundColor: 'rgba(80, 82, 178, 1)',
                            color: '#fff',
                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                            textTransform: 'none',
                        }}
                    >
                        <Typography sx={{ fontFamily: 'Nunito' }}>Apply</Typography>
                    </Button>
                </Box>
            </Popover>
        </>
    );
};

export default CalendarPopup;
