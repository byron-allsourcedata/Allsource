import React, { useEffect, useState } from 'react';
import { Popover, Box, Button, Typography, Backdrop, Divider, TextField } from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { subDays, subMonths, startOfWeek, startOfMonth, subQuarters } from 'date-fns';
import '../css/CustomDatePicker.css';



const style = {
    button_date: {
        fontFamily: 'Roboto',
        fontWeight: '500',
        color: '#4a4a4a',
        textTransform: 'none',
        textAlign: 'left',
        display: 'flex',
        fontSize: '12px',
        lineHeight: '16px',
        justifyContent: 'start',
        padding: '4px 10px',
        '&:hover': {
            backgroundColor: 'rgba(80, 82, 178, 0.10)',
            borderRadius: '4px',
            color: '#171619'
        }
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
    const [activeLabel, setActiveLabel] = useState<string | null>(null);

    const [startDateString, setStartDateString] = useState<string>('');
    const [endDateString, setEndDateString] = useState<string>('');
    const [showDatePicker, setShowDatePicker] = useState(false);

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
        let [start, end] = dates;
        if (start && end && start.getTime() === end.getTime()) {
            end = new Date(start);
            end.setHours(23, 59, 59, 999);
        }
        setStartDate(start);
        setEndDate(end);
        onDateChange({ start, end });
        setStartDateString(start ? start.toLocaleDateString() : '');
        setEndDateString(end ? end.toLocaleDateString() : '');
        onDateLabelChange("");
    };

    const updateCalendar = (start: Date | null, end: Date | null, label: string) => {
        setStartDate(start);
        setEndDate(end);
        setEndDateString('');
        setStartDateString('');
        onDateChange({ start, end });
        onDateLabelChange(label);
    };

    const handleToday = () => {
        const todayStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), 0, 0, 0, 0));
        const todayEnd = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), 23, 59, 59, 999));
        
        updateCalendar(todayStart, todayEnd, 'Today');
        setActiveLabel('Today');
    };
    
    
    const handleYesterday = () => {
        const yesterdayStart = subDays(new Date(), 1);
        yesterdayStart.setUTCHours(0, 0, 0, 0);
        
        const yesterdayEnd = subDays(new Date(), 1);
        yesterdayEnd.setUTCHours(23, 59, 59, 999);
        
        updateCalendar(yesterdayStart, yesterdayEnd, 'Yesterday');
        setActiveLabel('Yesterday');
    };
    
    

    const handleThisWeek = () => {
        const start = startOfWeek(new Date(), { weekStartsOn: 1 });
        const end = new Date();
        
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);
    
        updateCalendar(start, end, 'This Week');
        setActiveLabel('This Week');
    };

    const handleLast7Days = () => {
        const end = new Date();
        const start = subDays(end, 7);
    
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);
    
        updateCalendar(start, end, 'Last 7 days');
        setActiveLabel('Last 7 days');
    };
    

    const handleLast30Days = () => {
        const end = new Date();
        const start = subDays(end, 30);
    
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);
    
        updateCalendar(start, end, 'Last 30 days');
        setActiveLabel('Last 30 days');
    };
    

    const handleThisMonth = () => {
        const start = startOfMonth(new Date());
        const end = new Date();
    
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);
    
        updateCalendar(start, end, 'This Month');
        setActiveLabel('This Month');
    };
    

    const handleLastMonth = () => {
        const now = new Date();
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
        const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
    
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);
    
        updateCalendar(start, end, 'Last Month');
        setActiveLabel('Last Month');
    };
    
    
    const handleLastQuarter = () => {
        const end = new Date();
        const start = subQuarters(end, 1);

        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);
    
        updateCalendar(start, end, 'Last Quarter');
        setActiveLabel('Last Quarter');
    };
    

    const handleAllTime = () => {
        const end = new Date();
        
        end.setUTCHours(23, 59, 59, 999);
    
        updateCalendar(null, end, 'All Time');
        setActiveLabel('All Time');
    };
    

    const handleApply = () => {
        onApply({ start: startDate, end: endDate });
        onDateChange({ start: startDate, end: endDate });
        onClose();
        setShowDatePicker(false);
    };

    const handleCancel = () => {
        setStartDate(null);
        setEndDate(null);
        onDateChange({ start: null, end: null });
        onDateLabelChange('');
        setEndDateString('')
        setStartDateString('')
        onApply({ start: null, end: null });
        setActiveLabel('')
        onClose();
        setShowDatePicker(false);
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


    const handleCustomClick = () => {
        setShowDatePicker(true); // Show the date picker
    };
    const handleCustomGoBack = () => {
        setShowDatePicker(false);
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
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    sx: {
                      "@media (max-width: 900px)": {
                        width: '100%', // Full width on mobile,
                        maxWidth: '100%',
                        left: '0 !important',
                        top: '0 !important',
                        borderRadius: 0,
                        height: '100vh',
                        maxHeight: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      },
                    },
                  }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2,
                    "@media (max-width: 900px)": {
                        display: 'block'
                    }
                 }}>
                    <Box sx={{ padding: 2, display: 'flex', flexDirection: 'column', gap: 2, flexWrap: 'wrap', width: '100%', mb: 0, borderRight: '1px solid var(--Color-4, rgba(23, 22, 25, 0.04))',
                        "@media (max-width: 900px)": {
                            display: showDatePicker ? 'none' : 'flex',
                            borderRight: 'none',
                            gap: '42px'
                        }
                        
                     }}>
                        <Button sx={{...style.button_date,
                            "@media (min-width: 901px)": {
                                display: 'none'
                            }
                        }} onClick={handleCustomClick}>Custom</Button>
                        <Button sx={{...style.button_date, color: activeLabel === 'Today' ? 'rgba(80, 82, 178, 1)' : 'inherit'}} onClick={handleToday}>Today</Button>
                        <Button sx={{...style.button_date, color: activeLabel === 'Yesterday' ? 'rgba(80, 82, 178, 1)' : 'inherit'}} onClick={handleYesterday}>Yesterday</Button>
                        <Button sx={{...style.button_date, color: activeLabel === 'This Week' ? 'rgba(80, 82, 178, 1)' : 'inherit'}} onClick={handleThisWeek}>This Week</Button>
                        <Button sx={{...style.button_date, color: activeLabel === 'Last 7 days' ? 'rgba(80, 82, 178, 1)' : 'inherit'}} onClick={handleLast7Days}>Last 7 days</Button>
                        <Button sx={{...style.button_date, color: activeLabel === 'Last 30 days' ? 'rgba(80, 82, 178, 1)' : 'inherit'}} onClick={handleLast30Days}>Last 30 days</Button>
                        <Button sx={{...style.button_date, color: activeLabel === 'This Month' ? 'rgba(80, 82, 178, 1)' : 'inherit'}} onClick={handleThisMonth}>This Month</Button>
                        <Button sx={{...style.button_date, color: activeLabel === 'Last Month' ? 'rgba(80, 82, 178, 1)' : 'inherit'}} onClick={handleLastMonth}>Last Month</Button>
                        <Button sx={{...style.button_date, color: activeLabel === 'Last Quarter' ? 'rgba(80, 82, 178, 1)' : 'inherit'}} onClick={handleLastQuarter}>Last Quarter</Button>
                        <Button sx={{...style.button_date, color: activeLabel === 'All Time' ? 'rgba(80, 82, 178, 1)' : 'inherit'}} onClick={handleAllTime}>All Time</Button>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pt: 2, pb: 1, "@media (max-width: 900px)": {
                                                display: 'none'
                                            } }}>
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
                                                p: '8px 12px'
                                            },
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(23, 22, 25, 0.10)'
                                            },
                                            "@media (max-width: 900px)": {
                                                display: 'none'
                                            }
                                        },
                                    }}
                                    sx={{ width: '94px', height: '32px' }}
                                />
                                <Box sx={{ width: '11px', height: '1px', border: '1px solid rgba(23, 22, 25, 0.1)',  }}>
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
                                                p: '8px 12px'
                                            },
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(23, 22, 25, 0.10)'
                                            },
                                            "@media (max-width: 900px)": {
                                                display: 'none'
                                            }
                                        },
                                    }}
                                    sx={{ width: '94px', height: '32px' }}
                                />
                            </Box>
                                
                        <Box
                        sx={{
                            padding: 2,
                            display: 'flex',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            mb: 0,
                            gap: 4,
                            pl: 0,
                            '&  .react-datepicker': {
                            border: 'none'
                            },
                            '& .react-datepicker__header': {
                            backgroundColor: 'transparent',
                            borderBottom: 'none',
                            padding: 0
                            },
                            '& .react-datepicker__day-names': {
                            marginBottom: '10px',
                            marginTop: '10px'
                            },
                            '& .react-datepicker__day-name': {
                            fontFamily: 'Roboto',
                            fontSize: '12px',
                            fontWeight: '500',
                            lineHeight: 'normal',
                            color: 'rgba(74, 74, 74, 0.40)',
                            margin: '6px'
                            },
                            '& .react-datepicker__day': {
                            fontFamily: 'Roboto',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#4a4a4a',
                            margin: '6px',
                            },
                            '& .react-datepicker__day.in-range': {
                                background: 'rgba(80, 82, 178, 0.04) !important',
                                color: 'rgba(74, 74, 74, 0.40) !important',
                                position: 'relative',
                                borderRadius: 0
                            },
                            '& .react-datepicker__day.in-range:before': {
                                content: '""',
                                width: '12px',
                                position: 'absolute',
                                height: '27.2px',
                                left: '-12px',
                                background: 'rgba(80, 82, 178, 0.04)!important'
                            },
                            '& .react-datepicker__day.start-date': {
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0
                            },
                            '& .react-datepicker__day.end-date': {
                                position: 'relative',
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0
                            },
                            '& .react-datepicker__day.end-date:before': {
                                content: '""',
                                width: '12px',
                                position: 'absolute',
                                height: '27.2px',
                                left: '-12px',
                                background: 'rgba(80, 82, 178, 0.04)!important'
                            },
                            '& .react-datepicker__day.in-range.react-datepicker__day--outside-month:before': {
                                content: '""',
                                width: 0,
                                background: 'none'
                            },
                            '& .react-datepicker__day.end-date.react-datepicker__day--outside-month:before': {
                                content: '""',
                                width: 0,
                                background: 'none'
                            },
                            '& .react-datepicker__day--in-selecting-range:not(.react-datepicker__day--in-range, .react-datepicker__month-text--in-range, .react-datepicker__quarter-text--in-range, .react-datepicker__year-text--in-range)':
                             {
                                background: 'rgba(80, 82, 178, 0.04) !important',
                                color: 'rgba(74, 74, 74, 0.40) !important'
                            },
                            '& .react-datepicker__day--disabled': {
                            fontFamily: 'Roboto',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: 'rgba(74, 74, 74, 0.40)',
                            margin: '6px'
                            },
                            '& .react-datepicker__day--keyboard-selected': {
                                backgroundColor: '#5052B2 !important',
                                color: '#fff !important'
                            },
                            '& .react-datepicker__day:hover': {
                            backgroundColor: '#5052B2 !important',
                            color: '#fff !important'
                            },
                            '& .react-datepicker__day--disabled:hover': {
                                backgroundColor: 'transparent !important',
                                color: 'rgba(74, 74, 74, 0.40) !important'
                            },
                            '& .react-datepicker__current-month': {
                            fontFamily: 'Roboto',
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#4a4a4a',
                            margin: '10px 0',
                            textAlign: 'left', // Align the month name to the left
                            width: '100%' // Ensure it takes up the full width
                            },
                            '& .react-datepicker__navigation': {
                            top: '10px',
                            lineHeight: '24px',
                            width: '20px',
                            height: '20px'
                            },
                            '& .react-datepicker__navigation--previous': {
                            right: '45px', // Move left navigation closer to the left
                            left: 'auto', // Ensure it's properly aligned
                            },
                            '& .react-datepicker__navigation--next': {
                            left: 'auto', // Ensure the right navigation is on the far right
                            right: '10px',
                            },
                            '& .react-datepicker__month-container': {
                            display: 'block', // Stack months vertically instead of side by side
                            width: '100%', // Ensure each month takes up full width,
                            float: 'none'
                            },
                            '& .react-datepicker__navigation-icon::before': {
                                borderColor: '#4a4a4a',
                                borderWidth: '2px 2px 0 0'
                            },
                            "@media (max-width: 900px)": {
                                display: showDatePicker ? 'flex' : 'none',
                                pl: 2,
                                gap: 2
                            }
                        }}
                        >
                        <Box sx={{
                            "@media (min-width: 901px)": {
                                display: 'none'
                            }
                        }}>
                            <Button variant="outlined" className='second-sub-title' onClick={handleCustomGoBack} sx={{ backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(80, 82, 178, 1) !important', textTransform: 'none',
                                border: '1px solid rgba(80, 82, 178, 1)',
                                padding: '6px 12px'
                                }}>
                                    Go back
                            </Button>
                        </Box>
                        <DatePicker
                            selected={startDate}
                            onChange={handleChange}
                            selectsStart
                            startDate={startDate || undefined}
                            endDate={endDate || undefined}
                            dayClassName={dayClassName}
                            selectsRange
                            inline
                            monthsShown={2} // Show two months
                            maxDate={new Date()} // Disable future dates
                        />
                        </Box>
                    </Box>
                </Box>
                <Box
                            sx={{ gap: 1, display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', paddingBottom: 2, pr: 2, pl: 2, alignItems: 'center', borderTop: '1px solid var(--Color-4, rgba(23, 22, 25, 0.04))' }}
                        >
                            
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'end', gap: 2, alignItems: 'end', pt: 2 }}>
                                <Button variant="outlined" onClick={handleCancel} className='second-sub-title' sx={{ backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(80, 82, 178, 1) !important', textTransform: 'none',
                                border: '1px solid rgba(80, 82, 178, 1)',
                                padding: '6px 12px',
                                     '@media (max-width: 600px)': { width: '100%' }, }}>
                                    Cancel
                                </Button>
                                <Button variant="contained" onClick={handleApply} className='second-sub-title' sx={{ backgroundColor: 'rgba(80, 82, 178, 1)', color: 'rgba(255, 255, 255, 1) !important', textTransform: 'none',
                                padding: '6px 12px',
                                    '@media (max-width: 600px)': { width: '100%' } }}>
                                    Apply
                                </Button>
                            </Box>
                        </Box>
            </Popover>
        </>
    );
};

export default CalendarPopup;
