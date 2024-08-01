import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Typography
} from '@mui/material';
import { DatePicker, StaticDatePicker } from '@mui/lab';
import { format, addMonths, subMonths } from 'date-fns';

const CalendarPopup = ({ open, onClose, onApply }) => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleDateChange = (date) => {
    if (selectedDates.includes(date)) {
      setSelectedDates(selectedDates.filter(d => d !== date));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleClear = () => {
    setSelectedDates([]);
  };

  const handleMonthChange = (direction) => {
    setCurrentMonth(direction === 'next' ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>
        <Grid container justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Select Date</Typography>
          <IconButton onClick={onClose}>X</IconButton>
        </Grid>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Button onClick={() => handleDateChange(new Date())}>Today</Button>
            <Button onClick={() => handleDateChange(subMonths(new Date(), 1))}>Last 7 days</Button>
            <Button onClick={() => handleDateChange(subMonths(new Date(), 1))}>Last Month</Button>
          </Grid>
          <Grid item xs={12}>
            <StaticDatePicker
              displayStaticWrapperAs="desktop"
              value={currentMonth}
              onChange={() => {}}
              onMonthChange={handleMonthChange}
              renderDay={(day, _, pickersDayProps) => (
                <Paper
                  {...pickersDayProps}
                  style={{
                    backgroundColor: selectedDates.includes(day) ? 'lightblue' : undefined,
                  }}
                >
                  {format(day, 'd')}
                </Paper>
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClear}>Clear</Button>
        <Button onClick={() => onApply(selectedDates)}>Apply</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CalendarPopup;
