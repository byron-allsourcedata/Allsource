import React, { useState } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop, TextField, InputAdornment, Collapse, Divider, FormControlLabel, Checkbox } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';


interface FilterPopupProps {
  open: boolean;
  onClose: () => void;
}

const FilterPopup: React.FC<FilterPopupProps> = ({ open, onClose }) => {
  const [selectedButton, setSelectedButton] = useState<string | null>(null);
  const [isVisitedDateOpen, setIsVisitedDateOpen] = useState(false);
  const [isVisitedPageOpen, setIsVisitedPageOpen] = useState(false);
  const [isTimeSpentOpen, setIsTimeSpentOpen] = useState(false);
  const [isVisitedTimeOpen, setIsVisitedTimeOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isLeadFunnel, setIsLeadFunnel] = useState(false);
  const [emails, setEmails] = useState('');
  const [region, setRegions] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: string[] }>({
    visitedDate: [],
    visitedTime: [],
    region: [],
    pageVisits: [],
    timeSpents: []
  });
  const [regions, setTags] = useState<string[]>([]);
  const [selectedButtons, setSelectedButtons] = useState<string[]>([]);


  const handleAddTag = (e: { key: string; }) => {
    if (e.key === 'Enter' && region.trim()) {
      setTags([...regions, region.trim()]);
      setRegions('');
    }
  };


  const getButtonStyle = (label: string) => {
    switch (label) {
      case 'Visitor':
        return {
          background: 'rgba(235, 243, 254, 1)',
          color: 'rgba(20, 110, 246, 1)',
        };
      case 'Converted':
        return {
          background: 'rgba(244, 252, 238, 1)',
          color: 'rgba(110, 193, 37, 1)',
        };
      case 'Added to cart':
        return {
          background: 'rgba(241, 241, 249, 1)',
          color: 'rgba(80, 82, 178, 1)',
        };
      case 'Cart abandoned':
        return {
          background: 'rgba(254, 238, 236, 1)',
          color: 'rgba(244, 87, 69, 1)',
        };
      default:
        return {};
    }
  };


  const handleButtonLeadFunnelClick = (label: string) => {
    setSelectedButtons(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const addTag = (category: string, tag: string) => {
    setSelectedTags((prevTags) => {
      const newTags = [...prevTags[category]];
      if (!newTags.includes(tag)) {
        newTags.push(tag);
      }
      return { ...prevTags, [category]: newTags };
    });

    updateCheckedFilters(category, tag, true);
  };


  const removeTag = (category: string, tag: string) => {
    setSelectedTags((prevTags) => {
      const updatedTags = prevTags[category].filter(t => t !== tag);

      // Clear date range if the tag is related to date
      if (category === 'visitedDate') {
        if (updatedTags.length === 0) {
          setDateRange({ fromDate: null, toDate: null });
          setSelectedDateRange(null); // Clear the displayed date range
        }
      }

      // Clear time range if the tag is related to time
      if (category === 'visitedTime') {
        if (updatedTags.length === 0) {
          setTimeRange({ fromTime: null, toTime: null });
          setSelectedTimeRange(null); // Clear the displayed time range
        }
      }

      // Update checkbox states if necessary
      if (category === 'visitedDate') {
        const tagMap: { [key: string]: string } = {
          'Last week': 'lastWeek',
          'Last 30 days': 'last30Days',
          'Last 6 months': 'last6Months',
          'All time': 'allTime',
        };

        const filterName = tagMap[tag];
        if (filterName) {
          setCheckedFilters((prevFilters) => ({
            ...prevFilters,
            [filterName]: false,
          }));
        }
      }

      if (category === 'visitedTime') {
        const tagMapTime: { [key: string]: string } = {
          'Morning 12AM - 11AM': 'morning',
          'Afternoon 11AM - 5PM': 'afternoon',
          'Evening 5PM - 9PM': 'evening',
          'All day': 'all_day',
        };

        const filterName = tagMapTime[tag];
        if (filterName) {
          setCheckedFiltersTime((prevFiltersTime) => ({
            ...prevFiltersTime,
            [filterName]: false,
          }));
        }
      }

      return { ...prevTags, [category]: updatedTags };
    });
  };




  interface TagMap {
    [key: string]: string;
  }


  const updateCheckedFilters = (category: string, tag: string, isChecked: boolean) => {
    const tagMap: TagMap = {
      'Last week': 'lastWeek',
      'Last 30 days': 'last30Days',
      'Last 6 months': 'last6Months',
      'All time': 'allTime',
    };

    const tagMapTime: TagMap = {
      'Morning 12AM - 11AM': 'morning',
      'Afternoon 11AM - 5PM': 'afternoon',
      'Evening 5PM - 9PM': 'evening',
      'All day': 'all_day',
    };

    const mapToUse = category === 'visitedDate' ? tagMap : tagMapTime;
    const filterName = mapToUse[tag];

    if (filterName) {
      if (category === 'visitedDate') {
        setCheckedFilters((prevFilters) => ({
          ...prevFilters,
          [filterName]: isChecked,
        }));
      } else if (category === 'visitedTime') {
        setCheckedFiltersTime((prevFiltersTime) => ({
          ...prevFiltersTime,
          [filterName]: isChecked,
        }));
      }
    }
  };

  interface CustomChipProps {
    label: string;
    onDelete: () => void;
  }
  const CustomChip: React.FC<CustomChipProps> = ({ label, onDelete }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(228, 228, 228, 1)',
        color: 'rgba(123, 123, 123, 1)',
        borderRadius: 2,
        px: 1,
        mr: 1,
        py: 0.5,
        fontSize: '12px',
      }}
    >
      <IconButton
        size="small"
        onClick={onDelete}
        sx={{ p: 0, mr: 0.5 }}
      >
        <CloseIcon sx={{ fontSize: '12px' }} />
      </IconButton>
      <Typography sx={{ fontFamily: 'Nunito', fontSize: '14px' }}>{label}</Typography>
    </Box>
  );



  const handleButtonClick = (label: string) => {
    setSelectedButton(label);
  };


  ///// Date
  const [dateRange, setDateRange] = useState({
    fromDate: null,
    toDate: null,
  });
  const [checkedFilters, setCheckedFilters] = useState({
    lastWeek: false,
    last30Days: false,
    last6Months: false,
    allTime: false,
  });

  const handleCheckboxChange = (event: { target: { name: any; checked: any; }; }) => {
    const { name, checked } = event.target;

    setCheckedFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        [name]: checked,
      };

      const tagMap: { [key: string]: string } = {
        lastWeek: 'Last week',
        last30Days: 'Last 30 days',
        last6Months: 'Last 6 months',
        allTime: 'All time',
      };

      if (checked) {
        addTag('visitedDate', tagMap[name]);
      } else {
        removeTag('visitedDate', tagMap[name]);
      }

      return newFilters;
    });
  };



  const handleDateChange = (name: string) => (newValue: any) => {
    setDateRange(prevRange => {
      const updatedRange = {
        ...prevRange,
        [name]: newValue,
      };

      const fromDate = updatedRange.fromDate ? dayjs(updatedRange.fromDate).format('MMM DD, YYYY') : '';
      const toDate = updatedRange.toDate ? dayjs(updatedRange.toDate).format('MMM DD, YYYY') : '';

      if (fromDate && toDate) {
        setSelectedDateRange(`${fromDate} to ${toDate}`);
      } else {
        setSelectedDateRange(null);
      }

      return updatedRange;
    });
  };

  /////// Time
  const [timeRange, setTimeRange] = useState({
    fromTime: null,
    toTime: null,
  });
  const [checkedFiltersTime, setCheckedFiltersTime] = useState({
    morning: false,
    evening: false,
    afternoon: false,
    all_day: false,
  });

  const handleCheckboxChangeTime = (event: { target: { name: any; checked: any; }; }) => {
    const { name, checked } = event.target;

    setCheckedFiltersTime((prevFiltersTime) => {
      const newFiltersTime = {
        ...prevFiltersTime,
        [name]: checked,
      };

      const tagMapTime: { [key: string]: string } = {
        morning: 'Morning 12AM - 11AM',
        afternoon: 'Afternoon 11AM - 5PM',
        evening: 'Evening 5PM - 9PM',
        all_day: 'All day',
      };
      if (checked) {
        addTag('visitedTime', tagMapTime[name]);
      } else {
        removeTag('visitedTime', tagMapTime[name]);
      }
      return newFiltersTime;
    });
  };


  const handleTimeChange = (name: string) => (newValue: any) => {
    setTimeRange(prevRange => {
      const updatedRange = {
        ...prevRange,
        [name]: newValue,
      };

      const fromTime = updatedRange.fromTime ? dayjs(updatedRange.fromTime).format('h:mm A') : '';
      const toTime = updatedRange.toTime ? dayjs(updatedRange.toTime).format('h:mm A') : '';

      // Set the formatted time range if both times are selected
      if (fromTime && toTime) {
        setSelectedTimeRange(`${fromTime} to ${toTime}`);
      } else {
        setSelectedTimeRange(null);
      }

      return updatedRange;
    });
  };

  ////Page
  const [checkedFiltersPageVisits, setCheckedFiltersPageVisits] = useState({
    page: false,
    two_page: false,
    three_page: false,
    more_three: false,
  });

  const handleCheckboxChangePageVisits = (event: { target: { name: any; checked: any; }; }) => {
    const { name, checked } = event.target;

    setCheckedFiltersPageVisits((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        [name]: checked,
      };

      const tagMap: { [key: string]: string } = {
        page: '1 page',
        two_page: '2 pages',
        three_page: '3 pages',
        more_three: 'More than 3 pages',
      };

      if (checked) {
        addTag('pageVisits', tagMap[name]);
      } else {
        removeTag('pageVisits', tagMap[name]);
      }

      return newFilters;
    });
  };



  ////time spent
  const [checkedFiltersTimeSpent, setCheckedFiltersTimeSpent] = useState({
    under_10: false,
    over_10: false,
    over_30: false,
    over_60: false,
  });

  const handleCheckboxChangeTimeSpent = (event: { target: { name: any; checked: any; }; }) => {
    const { name, checked } = event.target;

    setCheckedFiltersTimeSpent((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        [name]: checked,
      };

      const tagMap: { [key: string]: string } = {
        under_10: 'under 10 secs',
        over_10: '10-30 secs',
        over_30: '30-60 secs',
        over_60: 'Over 60 secs',
      };

      if (checked) {
        addTag('timeSpents', tagMap[name]);
      } else {
        removeTag('timeSpents', tagMap[name]);
      }

      return newFilters;
    });
  };


  const handleApplyFilters = () => {
    const filters = {
      button: selectedButton,
      filter1: emails,
      region,
      dateRange: {
        fromDate: dateRange.fromDate ? dayjs(dateRange.fromDate).format('YYYY-MM-DD') : null,
        toDate: dateRange.toDate ? dayjs(dateRange.toDate).format('YYYY-MM-DD') : null,
      },
      timeRange: {
        fromTime: timeRange.fromTime ? dayjs(timeRange.fromTime).format('HH:mm:ss') : null,
        toTime: timeRange.toTime ? dayjs(timeRange.toTime).format('HH:mm:ss') : null,
      },
      checkedFilters, // Object with the state of checkboxes for dates
      checkedFiltersTime, // Object with the state of checkboxes for time
      checkedFiltersPageVisits, // Object with the state of checkboxes for page visits
      regions, // Object with the state of checkboxes for regions
      checkedFiltersTimeSpent, // Object with the state of checkboxes for spent time
      selectedButtons, // Array of selected buttons for leads funnel
    };


    console.log('Filters:', filters);
  };

  return (
    <>
      <Backdrop open={open} sx={{ zIndex: 1200, color: '#fff' }} />
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: '40%',
            position: 'fixed',
            zIndex: 1301,
            top: 0,
            bottom: 0,
            '@media (max-width: 600px)': {
              width: '100%',
            }
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #e4e4e4' }}>
          <Typography variant="h6" sx={{ textAlign: 'center', color: '#4A4A4A', fontFamily: 'Nunito', fontWeight: '600', fontSize: '22px', lineHeight: '25.2px' }}>
            Filter Search
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', }}>
          <TextField
            placeholder="Search people"
            variant="outlined"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Button sx={{ textTransform: 'none', textDecoration: 'none' }}>
                    <SearchIcon sx={{ color: 'rgba(101, 101, 101, 1)' }} fontSize='medium' />
                  </Button>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {['Abandon Checkout leads in last 30 days', 'Converters in last 30 days', 'Non Converters in last 30 days', 'Add to cart leads in last 30 days'].map((label) => (
              <Button
                key={label}
                onClick={() => handleButtonClick(label)}
                sx={{
                  width: 'calc(50% - 5px)',
                  height: '33px',
                  textTransform: 'none',
                  padding: '1.25em',
                  gap: '10px',
                  textAlign: 'center',
                  borderRadius: '4px',
                  border: '1px solid rgba(220, 220, 239, 1)',
                  backgroundColor: selectedButton === label ? 'rgba(219, 219, 240, 1)' : '#fff',
                  color: '#000',
                  fontFamily: 'Nunito',
                  opacity: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
          {/* Visited date */}
          <Box sx={{ width: '95%', mb: 2, mt: 2, padding: '1em', border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '4px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 0 }}>
              <Typography sx={{ flexGrow: 1, color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '600', fontSize: '16px', lineHeight: '25.2px' }}>
                Visited date
              </Typography>
              {selectedTags.visitedDate.map((tag, index) => (
                <CustomChip
                  key={index}
                  label={tag}
                  onDelete={() => removeTag('visitedDate', tag)}
                />
              ))}
              {selectedDateRange && (
                <CustomChip
                  label={selectedDateRange}
                  onDelete={() => setSelectedDateRange(null)}
                />
              )}
              <IconButton onClick={() => setIsVisitedDateOpen(!isVisitedDateOpen)} aria-label="toggle-content">
                {isVisitedDateOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isVisitedDateOpen}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'rows', gap: 10, justifyContent: 'start' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={<Checkbox checked={checkedFilters.lastWeek} onChange={handleCheckboxChange} name="lastWeek" />}
                    label="Last week"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={checkedFilters.last30Days} onChange={handleCheckboxChange} name="last30Days" />}
                    label="Last 30 days"
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={<Checkbox checked={checkedFilters.last6Months} onChange={handleCheckboxChange} name="last6Months" />}
                    label="Last 6 months"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={checkedFilters.allTime} onChange={handleCheckboxChange} name="allTime" />}
                    label="All time"
                  />
                </Box>
              </Box>
              <Typography sx={{ mt: 2, mb: 1.5, fontFamily: 'Nunito', fontSize: '16px', color: 'rgba(74, 74, 74, 1)', fontWeight: '400', lineHeight: '16.8px', textAlign: 'left' }}>
                OR
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="From date"
                    value={dateRange.fromDate}
                    onChange={(newValue) => handleDateChange('fromDate')(newValue)}
                    sx={{ width: '100%' }}
                    slots={{ textField: (props) => <TextField {...props} variant="outlined" fullWidth /> }}
                  />
                  <DatePicker
                    label="To date"
                    value={dateRange.toDate}
                    onChange={(newValue) => handleDateChange('toDate')(newValue)}
                    sx={{ width: '100%' }}
                    slots={{ textField: (props) => <TextField {...props} variant="outlined" fullWidth /> }}
                  />
                </LocalizationProvider>
              </Box>
            </Collapse>
          </Box>
          {/* Visited time */}
          <Box sx={{ width: '95%', mb: 2, border: '1px solid rgba(228, 228, 228, 1)', padding: '1em' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Typography sx={{ flexGrow: 1, color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '600', fontSize: '16px', lineHeight: '25.2px' }}>
                Visited time
              </Typography>
              {selectedTags.visitedTime.map((tag, index) => (
                <CustomChip
                  key={index}
                  label={tag}
                  onDelete={() => removeTag('visitedTime', tag)}
                />
              ))}
              {selectedTimeRange && (
                <CustomChip
                  label={selectedTimeRange}
                  onDelete={() => setSelectedTimeRange(null)}
                />
              )}
              <IconButton onClick={() => setIsVisitedTimeOpen(!isVisitedTimeOpen)} aria-label="toggle-content">
                {isVisitedTimeOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isVisitedTimeOpen}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'rows', gap: 10, justifyContent: 'start' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={<Checkbox checked={checkedFiltersTime.morning} onChange={handleCheckboxChangeTime} name="morning" />}
                    label="Morning 12AM - 11AM"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={checkedFiltersTime.evening} onChange={handleCheckboxChangeTime} name="evening" />}
                    label="Evening 5PM - 9PM"
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={<Checkbox checked={checkedFiltersTime.afternoon} onChange={handleCheckboxChangeTime} name="afternoon" />}
                    label="Afternoon 11AM - 5PM"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={checkedFiltersTime.all_day} onChange={handleCheckboxChangeTime} name="all_day" />}
                    label="All day"
                  />
                </Box>
              </Box>
              <Typography sx={{ mt: 2, mb: 1, fontFamily: 'Nunito', fontSize: '16px', color: 'rgba(74, 74, 74, 1)', fontWeight: '400', lineHeight: '16.8px', textAlign: 'left' }}>
                OR
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    label="From time"
                    value={timeRange.fromTime}
                    onChange={handleTimeChange('fromTime')}
                    slots={{ textField: (props) => <TextField {...props} variant="outlined" fullWidth /> }}
                  />
                  <TimePicker
                    label="To time"
                    value={timeRange.toTime}
                    onChange={handleTimeChange('toTime')}
                    slots={{ textField: (props) => <TextField {...props} variant="outlined" fullWidth /> }}
                  />
                </LocalizationProvider>
              </Box>
            </Collapse>
          </Box>
          {/* Region */}
          <Box sx={{ width: '95%', mb: 2, border: '1px solid rgba(228, 228, 228, 1)', padding: '1em' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Typography sx={{ flexGrow: 1, color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '600', fontSize: '16px', lineHeight: '25.2px' }}>
                Region
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', mb: 2 }}>
                {regions.map((tag, index) => (
                  <CustomChip
                    key={index}
                    label={tag}
                    onDelete={() => setTags(regions.filter((_, i) => i !== index))}
                  />
                ))}
              </Box>
              <IconButton onClick={() => setIsRegionOpen(!isRegionOpen)} aria-label="toggle-content">
                {isRegionOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isRegionOpen}>
              <Divider sx={{ mb: 2 }} />
              <TextField
                placeholder="Region"
                variant="outlined"
                fullWidth
                value={region}
                onChange={(e) => setRegions(e.target.value)}
                onKeyDown={handleAddTag}
                sx={{ mb: 2 }}
              />
            </Collapse>
          </Box>
          {/* Page visits */}
          <Box sx={{ width: '95%', mb: 2, mt: 2, padding: '1em', border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '4px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 0 }}>
              <Typography sx={{ flexGrow: 1, color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '600', fontSize: '16px', lineHeight: '25.2px' }}>
                Page visits
              </Typography>
              {selectedTags.pageVisits.map((tag, index) => (
                <CustomChip
                  key={index}
                  label={tag}
                  onDelete={() => removeTag('pageVisits', tag)}
                />
              ))}
              <IconButton onClick={() => setIsVisitedPageOpen(!isVisitedPageOpen)} aria-label="toggle-content">
                {isVisitedPageOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isVisitedPageOpen}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'rows', gap: 10, justifyContent: 'start' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={<Checkbox checked={checkedFiltersPageVisits.page} onChange={handleCheckboxChangePageVisits} name="page" />}
                    label="1 page"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={checkedFiltersPageVisits.two_page} onChange={handleCheckboxChangePageVisits} name="two_page" />}
                    label="2 pages"
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={<Checkbox checked={checkedFiltersPageVisits.three_page} onChange={handleCheckboxChangePageVisits} name="three_page" />}
                    label="3 pages"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={checkedFiltersPageVisits.more_three} onChange={handleCheckboxChangePageVisits} name="more_three" />}
                    label="More than 3 pages"
                  />
                </Box>
              </Box>
            </Collapse>
          </Box>
          {/* Average time spent */}
          <Box sx={{ width: '95%', mb: 2, mt: 2, padding: '1em', border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '4px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 0 }}>
              <Typography sx={{ flexGrow: 1, color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '600', fontSize: '16px', lineHeight: '25.2px' }}>
                Average time spent
              </Typography>
              {selectedTags.timeSpents.map((tag, index) => (
                <CustomChip
                  key={index}
                  label={tag}
                  onDelete={() => removeTag('timeSpents', tag)}
                />
              ))}
              <IconButton onClick={() => setIsTimeSpentOpen(!isTimeSpentOpen)} aria-label="toggle-content">
                {isTimeSpentOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isTimeSpentOpen}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'rows', gap: 10, justifyContent: 'start' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={<Checkbox checked={checkedFiltersTimeSpent.under_10} onChange={handleCheckboxChangeTimeSpent} name="under_10" />}
                    label="under 10 secs"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={checkedFiltersTimeSpent.over_10} onChange={handleCheckboxChangeTimeSpent} name="over_10" />}
                    label="10-30 secs"
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={<Checkbox checked={checkedFiltersTimeSpent.over_30} onChange={handleCheckboxChangeTimeSpent} name="over_30" />}
                    label="30-60 secs"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={checkedFiltersTimeSpent.over_60} onChange={handleCheckboxChangeTimeSpent} name="over_60" />}
                    label="Over 60 secs"
                  />
                </Box>
              </Box>
            </Collapse>
          </Box>
          {/* Lead Funnel */}
          <Box sx={{ width: '95%', mb: 2, mt: 2, padding: '1em', border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '4px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 0 }}>
              <Typography sx={{ flexGrow: 1, color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '600', fontSize: '16px', lineHeight: '25.2px' }}>
                Lead Funnel
              </Typography>
              {selectedButtons.map(label => (
                <CustomChip
                  key={label}
                  label={label}
                  onDelete={() => handleButtonLeadFunnelClick(label)}
                />
              ))}
              <IconButton onClick={() => setIsLeadFunnel(!isLeadFunnel)} aria-label="toggle-content">
                {isLeadFunnel ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isLeadFunnel}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'rows', gap: 3 }}>
                {['Converted', 'Visitor', 'Added to cart', 'Cart abandoned'].map((label) => (
                  <Button
                    key={label}
                    onClick={() => handleButtonLeadFunnelClick(label)}
                    sx={{
                      width: 'calc(50% - 5px)',
                      height: '2em',
                      textTransform: 'none',
                      padding: '1.25em',
                      gap: '10px',
                      textAlign: 'center',
                      borderRadius: '4px',
                      border: '1px solid rgba(220, 220, 239, 1)',
                      backgroundColor: selectedButton === label ? 'rgba(219, 219, 240, 1)' : getButtonStyle(label).background,
                      color: selectedButton === label ? '#000' : getButtonStyle(label).color,
                      fontFamily: 'Nunito',
                      opacity: 1,
                      display: 'flex',
                      alignItems: 'center',
                      textWrap: 'nowrap',
                      justifyContent: 'center',
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </Box>
            </Collapse>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyFilters}
            sx={{ mt: 3, width: '100%' }}
          >
            Apply Filters
          </Button>
        </Box>
      </Drawer>
    </>
  );
};

export default FilterPopup;
