import React, { useEffect, useState } from 'react';
import { Popover, Box, Button, Typography, Backdrop, Divider } from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { subDays, subMonths, startOfWeek, startOfMonth, subQuarters } from 'date-fns';
import '../css/CustomDatePicker.css';



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
    onApply: (dates: { start: Date | null; end: Date | null }) => void;
}

const CalendarPopup: React.FC<CalendarPopupProps> = ({ anchorEl, open, onClose, onDateChange, onApply }) => {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [key, setKey] = useState(0);

    const handleChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);
        onDateChange({ start, end });
    };

    const updateCalendar = (start: Date | null, end: Date | null) => {
        setStartDate(start);
        setEndDate(end);
        onDateChange({ start, end });
        setKey(prevKey => prevKey + 1); // Обновляем ключ для перерендера
    };

    const handleToday = () => {
        const today = new Date();
        updateCalendar(today, today);
    };

    const handleYesterday = () => {
        setStartDate(null);
        setEndDate(null);
        const yesterday = subDays(new Date(), 1);
        updateCalendar(yesterday, yesterday);
    };

    const handleThisWeek = () => {
        setStartDate(null);
        setEndDate(null);
        const start = startOfWeek(new Date(), { weekStartsOn: 1 });
        const end = new Date();
        updateCalendar(start, end);
    };

    const handleLast7Days = () => {
        const end = new Date();
        const start = subDays(end, 7);
        updateCalendar(start, end);
    };

    const handleLast30Days = () => {
        const end = new Date();
        const start = subDays(end, 30);
        updateCalendar(start, end);
    };

    const handleThisMonth = () => {
        const start = startOfMonth(new Date());
        const end = new Date();
        updateCalendar(start, end);
    };

    const handleLastMonth = () => {
        const end = new Date();
        const start = subMonths(end, 1);
        updateCalendar(start, end);
    };

    const handleLastQuarter = () => {
        const end = new Date();
        const start = subQuarters(end, 1);
        updateCalendar(start, end);
    };

    const handleAllTime = () => {
        updateCalendar(null, new Date());
    };

    const handleClear = () => {
        updateCalendar(null, null);
    };

    const handleApply = () => {
        onApply({ start: startDate, end: endDate });
        onClose();
    };


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
                return 'start-date';  // Класс для первой даты
            } else if (isSameDay(date, endDate)) {
                return 'end-date';  // Класс для последней даты
            } else if (date > startDate && date < endDate) {
                return 'in-range';  // Класс для промежуточных дат
            }
        }
        return '';
    };

    useEffect(() => {
        setKey(prevKey => prevKey + 1); // Обновляем ключ для перерендера при изменении дат
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
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                PaperProps={{
                    style: {
                        minWidth: '400px',
                        maxHeight: '600px',
                    },
                }}
            >
                <Box sx={{ padding: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    {/* Buttons for quick ranges */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', mb: 2, mr: 1, borderRight: '1px solid rgba(74, 74, 74, 0.04)' }}>
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

                    {/* Two DatePickers for selecting a range */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, gap: 2 }}>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            selectsStart
                            startDate={startDate || undefined}
                            endDate={endDate || undefined}
                            dayClassName={dayClassName}
                            inline
                        />
                        <Divider orientation='vertical' />
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            selectsEnd
                            startDate={startDate || undefined}
                            endDate={endDate || undefined}
                            dayClassName={dayClassName}
                            inline
                        />
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
                    sx={{ gap: 1, display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'end' }}
                >
                    <Button variant="outlined" onClick={handleClear} disabled={!startDate && !endDate} className='second-sub-title' sx={{ backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(80, 82, 178, 1) !important', textTransform: 'none',  border: '1px solid rgba(80, 82, 178, 1)', '@media (max-width: 600px)': { width: '100%' }, }}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleApply} className='second-sub-title' sx={{ backgroundColor: 'rgba(80, 82, 178, 1)', color: 'rgba(255, 255, 255, 1) !important', textTransform: 'none', '@media (max-width: 600px)': { width: '100%' } }}>
                        Apply
                    </Button>
                </Box>
            </Popover>
        </>
    );
};

export default CalendarPopup;
