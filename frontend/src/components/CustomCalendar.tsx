import React, { useState } from 'react';
import { Popover, Box, Button, Typography, Backdrop } from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { subDays, subMonths, startOfWeek, startOfMonth, subQuarters } from 'date-fns';

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

    const handleYesterday = () => {
        const yesterday = subDays(new Date(), 1);
        setStartDate(yesterday);
        setEndDate(yesterday);
        onDateChange({ start: yesterday, end: yesterday });
    };

    const handleThisWeek = () => {
        const start = startOfWeek(new Date(), { weekStartsOn: 1 });
        const end = new Date();
        setStartDate(start);
        setEndDate(end);
        onDateChange({ start, end });
    };

    const handleLast7Days = () => {
        const end = new Date();
        const start = subDays(end, 7);
        setStartDate(start);
        setEndDate(end);
        onDateChange({ start, end });
    };

    const handleLast30Days = () => {
        const end = new Date();
        const start = subDays(end, 30);
        setStartDate(start);
        setEndDate(end);
        onDateChange({ start, end });
    };

    const handleThisMonth = () => {
        const start = startOfMonth(new Date());
        const end = new Date();
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

    const handleLastQuarter = () => {
        const end = new Date();
        const start = subQuarters(end, 1);
        setStartDate(start);
        setEndDate(end);
        onDateChange({ start, end });
    };

    const handleAllTime = () => {
        setStartDate(null);
        setEndDate(new Date());
        onDateChange({ start: null, end: new Date() });
    };

    const handleClear = () => {
        setStartDate(null);
        setEndDate(null);
        onDateChange({ start: null, end: null });
    };

    const handleApply = () => {
        onApply({ start: startDate, end: endDate });
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
                        minWidth: '400px',
                        maxHeight: '600px',
                    },
                }}
            >
                <Box sx={{ padding: 2, display: 'flex', flexDirection: 'crow', alignItems: 'center' }}>
                    {/* Buttons for quick ranges */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', mb: 2 }}>
                        <Button onClick={handleToday}>Today</Button>
                        <Button onClick={handleYesterday}>Yesterday</Button>
                        <Button onClick={handleThisWeek}>This Week</Button>
                        <Button onClick={handleLast7Days}>Last 7 days</Button>
                        <Button onClick={handleLast30Days}>Last 30 days</Button>
                        <Button onClick={handleThisMonth}>This Month</Button>
                        <Button onClick={handleLastMonth}>Last Month</Button>
                        <Button onClick={handleLastQuarter}>Last Quarter</Button>
                        <Button onClick={handleAllTime}>All Time</Button>
                    </Box>

                    {/* Two DatePickers for selecting a range */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, gap:7 }}>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                            inline
                        />
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            inline
                        />
                    </Box>

                    {/* Footer Buttons */}
                    <Box
                        display="flex"
                        justifyContent="flex-end"
                        mt={2}
                        sx={{ gap: 1 }}
                    >
                        <Button onClick={handleClear} disabled={!startDate && !endDate}>
                            Clear
                        </Button>
                        <Button onClick={handleApply}>Apply</Button>
                    </Box>
                </Box>
            </Popover>
        </>
    );
};

export default CalendarPopup;
