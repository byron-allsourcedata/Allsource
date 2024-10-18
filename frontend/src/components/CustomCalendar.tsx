import React, { useEffect, useState } from 'react';
import { Popover, Box, Button, Typography, Backdrop, Divider, TextField } from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { subDays, subMonths, startOfWeek, startOfMonth, subQuarters } from 'date-fns';
import '../css/CustomDatePicker.css';
import { width } from '@mui/system';



const style = {
    button_date: {
        fontFamily: 'Roboto',
        fontWeight: '500',
        color: 'rgba(74, 74, 74, 1)',
        textTransform: 'none',
        textAlign: 'left',
        display: 'flex',
        fontSize: '12px',
        lineHeight: '16px',
        justifyContent: 'start'
    }
}

interface CalendarPopupProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    onDateChange: (dates: { start: Date | null; end: Date | null }) => void;
    onDateLabelChange: (label: string) => void;
    onApply: (dates: { start: Date | null; end: Date | null }) => void;
}

const CalendarPopup: React.FC<CalendarPopupProps> = ({ anchorEl, open, onClose, onDateChange, onApply, onDateLabelChange }) => {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [key, setKey] = useState(0);


    const [startDateString, setStartDateString] = useState<string>('');
    const [endDateString, setEndDateString] = useState<string>('');

    const handleChangeStringStart = () => {
        const start = new Date(startDateString);
        if (isNaN(start.getTime())) {
            return;
        }
        onDateLabelChange("");
        setStartDate(start);
    };
    const handleChangeStringEnd = () => {
        const end = new Date(endDateString);

        if (isNaN(end.getTime())) {
            return;
        }
        onDateLabelChange("");
        setEndDate(end);
    };
    const handleFocus = (setter: React.Dispatch<React.SetStateAction<string>>) => {
        setter('');
    };

    const handleChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);
        onDateChange({ start, end });
        onDateLabelChange("");
    };

    const updateCalendar = (start: Date | null, end: Date | null, label: string) => {
        setStartDate(start);
        setEndDate(end);
        setEndDateString('');
        setStartDateString('');
        onDateChange({ start, end });
        setKey(prevKey => prevKey + 1);
        onDateLabelChange(label);
    };

    const handleToday = () => {
        const today = new Date();
        updateCalendar(today, today, 'Today');
    }


    const handleYesterday = () => {
        const yesterday = subDays(new Date(), 1);
        updateCalendar(yesterday, yesterday, 'Yesterday');
    };

    const handleThisWeek = () => {
        const start = startOfWeek(new Date(), { weekStartsOn: 1 });
        const end = new Date();
        updateCalendar(start, end, 'This Week');
    };

    const handleLast7Days = () => {
        const end = new Date();
        const start = subDays(end, 7);
        updateCalendar(start, end, 'Last 7 days');
    };

    const handleLast30Days = () => {
        const end = new Date();
        const start = subDays(end, 30);
        updateCalendar(start, end, 'Last 30 days');
    };

    const handleThisMonth = () => {
        const start = startOfMonth(new Date());
        const end = new Date();
        updateCalendar(start, end, 'This Month');
    };

    const handleLastMonth = () => {
        const end = new Date();
        const start = subMonths(end, 1);
        updateCalendar(start, end, 'Last Month');
    };

    const handleLastQuarter = () => {
        const end = new Date();
        const start = subQuarters(end, 1);
        updateCalendar(start, end, 'Last Quarter');
    };

    const handleAllTime = () => {
        updateCalendar(null, new Date(), 'All Time');
    };

    const handleApply = () => {
        onApply({ start: startDate, end: endDate });
        onDateChange({ start: startDate, end: endDate });
        onClose();
    };

    const handleCancel = () => {
        setStartDate(null);
        setEndDate(null);
        onDateChange({ start: null, end: null });
        onDateLabelChange('');
        setEndDateString('')
        setStartDateString('')
        onClose();
    }

    const isSameDay = (date1: Date, date2: Date) => {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    };

    const dayClassName = (date: Date) => {
        if (startDate && endDate) {
            if (isSameDay(date, startDate)) {
                return 'start-date';
            } else if (isSameDay(date, endDate)) {
                return 'end-date';
            } else if (date > startDate && date < endDate) {
                return 'in-range';
            }
        }
        return '';
    };

    useEffect(() => {
        setKey(prevKey => prevKey + 1);
    }, [startDate, endDate]);

    return (
        <>
            <Backdrop open={open} sx={{ zIndex: 1200, color: '#fff' }} />
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={onClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <Box sx={{ padding: 2, display: 'flex', flexDirection: 'column', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', mb: 0, mr: 1, borderRight: '1px solid var(--Color-4, rgba(23, 22, 25, 0.04))' }}>
                        <Button sx={style.button_date} onClick={handleToday}>Today</Button>
                        <Button sx={style.button_date} onClick={handleYesterday}>Yesterday</Button>
                        <Button sx={style.button_date} onClick={handleThisWeek}>This Week</Button>
                        <Button sx={style.button_date} onClick={handleLast7Days}>Last 7 days</Button>
                        <Button sx={style.button_date} onClick={handleLast30Days}>Last 30 days</Button>
                        <Button sx={style.button_date} onClick={handleThisMonth}>This Month</Button>
                        <Button sx={style.button_date} onClick={handleLastMonth}>Last Month</Button>
                        <Button sx={style.button_date} onClick={handleLastQuarter}>Last Quarter</Button>
                        <Button sx={style.button_date} onClick={handleAllTime}>All Time</Button>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box sx={{ padding: 2, display: 'flex', justifyContent: 'center', mb: 0, gap: 2, "@media (max-width: 900px)": { display: 'none' } }}>
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => handleChange([date, endDate])} // Изменяем на вызов handleChange
                                selectsStart
                                startDate={startDate || undefined}
                                endDate={endDate || undefined}
                                dayClassName={dayClassName}
                                inline
                            />
                            <Box sx={{ width: '2px', height: 'auto', border: '1px solid var(--Color-4, rgba(23, 22, 25, 0.04))' }} />
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => handleChange([startDate, date])} // Изменяем на вызов handleChange
                                selectsEnd
                                startDate={startDate || undefined}
                                endDate={endDate || undefined}
                                dayClassName={dayClassName}
                                inline
                            />
                        </Box>

                        <Box
                            sx={{
                                display: 'none',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                mb: 2,
                                borderBottom: '0.5px solid rgba(190, 190, 190, 1)',
                                "@media (max-width: 900px)": {
                                    display: 'flex',
                                    '& .react-datepicker': {
                                        fontSize: '0.8rem',
                                        width: '100%',
                                        padding:1,
                                    },
                                }
                            }}
                        >
                            <DatePicker
                                selected={startDate}
                                startDate={startDate || undefined}
                                endDate={endDate || undefined}
                                onChange={handleChange}
                                selectsRange
                                dayClassName={dayClassName}
                                inline
                                calendarClassName="react-datepicker"
                                renderDayContents={(day) => <span>{day}</span>}
                            />
                        </Box>

                        <Box
                            sx={{ gap: 1, display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', paddingBottom: 1, pr: 2, alignItems: 'center', borderTop: '1px solid var(--Color-4, rgba(23, 22, 25, 0.04))' }}
                        >
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', pl: 2, pt: 1, "@media (max-width: 900px)": {display: 'none'} }}>
                                <TextField
                                    value={startDateString}
                                    onChange={(e) => setStartDateString(e.target.value)}
                                    placeholder="MM/DD/YYYY"
                                    onBlur={handleChangeStringStart}
                                    InputProps={{
                                        style: { fontSize: '12px', margin: 0, padding: 0 },
                                        sx: {
                                            '& .MuiInputBase-input::placeholder': {
                                                fontSize: '11px',
                                                fontFamily: 'Roboto',
                                                margin: 0,
                                                padding: 0
                                            },
                                            '& .MuiInputBase-input': {
                                                fontSize: '12px',
                                                padding: 0,
                                                pl: 1.5
                                            },
                                        },
                                    }}
                                    sx={{ width: '94px', height: '24px' }}
                                />
                                <Box sx={{ width: '11px', height: '1px', border: '1px solid var(--Color-2, rgba(23, 22, 25, 0.1))' }}>
                                </Box>
                                <TextField
                                    value={endDateString}
                                    size='small'
                                    onChange={(e) => setEndDateString(e.target.value)}
                                    placeholder="MM/DD/YYYY"
                                    onBlur={handleChangeStringEnd}
                                    InputProps={{
                                        style: { fontSize: '12px', margin: 0, padding: 0 },
                                        sx: {
                                            '& .MuiInputBase-input::placeholder': {
                                                fontSize: '11px',
                                                fontFamily: 'Roboto',
                                                margin: 0,
                                                padding: 0
                                            },
                                            '& .MuiInputBase-input': {
                                                fontSize: '12px',
                                                padding: 0,
                                                pl: 1.5
                                            },
                                        },
                                    }}
                                    sx={{ width: '94px', height: '24px' }}
                                />
                            </Box>
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'end', gap: 2, alignItems: 'end', pt: 1.5 }}>
                                <Button variant="outlined" onClick={handleCancel} className='second-sub-title' sx={{ backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(80, 82, 178, 1) !important', textTransform: 'none', border: '1px solid rgba(80, 82, 178, 1)', '@media (max-width: 600px)': { width: '100%' }, }}>
                                    Cancel
                                </Button>
                                <Button variant="contained" onClick={handleApply} className='second-sub-title' sx={{ backgroundColor: 'rgba(80, 82, 178, 1)', color: 'rgba(255, 255, 255, 1) !important', textTransform: 'none', '@media (max-width: 600px)': { width: '100%' } }}>
                                    Apply
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Popover>
        </>
    );
};

export default CalendarPopup;
