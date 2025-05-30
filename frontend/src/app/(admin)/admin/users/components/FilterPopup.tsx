import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop, TextField, InputAdornment, Collapse, Divider, FormControlLabel, Checkbox, Radio, List, ListItem, ListItemText, RadioGroup, Grid, InputLabel, FormControl, MenuItem, Select } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LineWeightIcon from '@mui/icons-material/LineWeight';
import TimelineIcon from '@mui/icons-material/Timeline';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import Image from 'next/image';
import { filterStyles } from '@/css/filterSlider';
import debounce from 'lodash/debounce';
import axiosInstance from '@/axios/axiosInterceptorInstance';


interface FilterPopupProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  joinDate: string[];
  lastLoginDate: string[];
}

interface CustomChipProps {
  label: string;
  onDelete: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}


const CustomChip: React.FC<CustomChipProps> = ({ label, onDelete }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 1)",
      border: '1px solid rgba(229, 229, 229, 1)',
      borderRadius: '3px',
      px: 1,
      mr: 1,
      py: 0.5,
      fontSize: "12px",
    }}
  >
    <IconButton
      size="medium"
      onClick={(e) => {
        e.stopPropagation();
        onDelete(e);
      }}
      sx={{ p: 0, mr: 0.5 }}
    >
      <CloseIcon sx={{ fontSize: "14px" }} />
    </IconButton>
    <Typography className='table-data'>
      {label}
    </Typography>
  </Box>
);

type TimeRange = {
  fromTime: dayjs.Dayjs | null;
  toTime: dayjs.Dayjs | null;
};

interface DateRange {
  fromDate: Dayjs | null;
  toDate: Dayjs | null;
}

type ButtonFilters = {
  button: string;
  dateRange: {
    fromDate: number;
    toDate: number;
  };
  selectedFunnels: string[];
} | null;

interface TagMap {
  [key: string]: string;
}

const FilterPopup: React.FC<FilterPopupProps> = ({ open, onClose, onApply, joinDate, lastLoginDate }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [pageUrlTags, setPageUrlTags] = useState<string[]>([]);

  // Industry
  const [checkedFiltersLastLoginDate, setCheckedFiltersLastLoginDate] = useState<Record<string, boolean>>({});
  const [checkedFilters, setCheckedFilters] = useState({
    lastWeek: false,
    last30Days: false,
    last6Months: false,
    allTime: false,
  });
  const [checkedFiltersJoinDate, setCheckedFiltersJoinDate] = useState<Record<string, boolean>>({});
  const [regions, setTags] = useState<string[]>([]);
  const [buttonFilters, setButtonFilters] = useState<ButtonFilters>(null);
  const [isJoinDateOpen, setIsJoinDateOpen] = useState(false);
  const [isLastLoginDateOpen, setIsLastLoginDateOpen] = useState(false);
  const [dateRangeJoinDate, setDateRangeJoinDate] = useState<DateRange>({
    fromDate: null,
    toDate: null,
  });
  const [dateRangeLastLoginDate, setDateRangeLastLoginDate] = useState<DateRange>({
    fromDate: null,
    toDate: null,
  });
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: string[] }>(
    {
      visitedDate: [],
      visitedTime: [],
      region: [],
      pageUrl: [],
      pageVisits: [],
      timeSpents: [],
    }
  );

  const removeTag = (category: string, tag: string) => {
    setSelectedTags((prevTags) => {
      const updatedTags = prevTags[category].filter((t) => t !== tag);

      const isLastTagRemoved = updatedTags.length === 0;

      if (category === "joinDate" && isLastTagRemoved) {
        setDateRangeJoinDate({ fromDate: null, toDate: null });
      }

      if (category === "joinDate") {
        const tagMap: { [key: string]: string } = {
          "Last week": "lastWeek",
          "Last 30 days": "last30Days",
          "Last 6 months": "last6Months",
          "All time": "allTime",
        };

        const filterName = tagMap[tag];
        if (filterName) {
          setCheckedFilters((prevFilters) => ({
            ...prevFilters,
            [filterName]: false,
          }));
        }
      }

      if (category === "lastLoginDate" && isLastTagRemoved) {
        setDateRangeJoinDate({ fromDate: null, toDate: null });
      }

      if (category === "lastLoginDate") {
        const tagMap: { [key: string]: string } = {
          "Last week": "lastWeek",
          "Last 30 days": "last30Days",
          "Last 6 months": "last6Months",
          "All time": "allTime",
        };

        const filterName = tagMap[tag];
        if (filterName) {
          setCheckedFilters((prevFilters) => ({
            ...prevFilters,
            [filterName]: false,
          }));
        }
      }

      return { ...prevTags, [category]: updatedTags };
    });
  };
  const updateCheckedFilters = (
    category: string,
    tag: string,
    isChecked: boolean
  ) => {
    const tagMap: TagMap = {
      "Last week": "lastWeek",
      "Last 30 days": "last30Days",
      "Last 6 months": "last6Months",
      "All time": "allTime",
    };

    const tagMapTime: TagMap = {
      "Morning 12AM - 11AM": "morning",
      "Afternoon 11AM - 5PM": "afternoon",
      "Evening 5PM - 9PM": "evening",
      "All day": "all_day",
    };

    const mapToUse = category === "visitedDate" ? tagMap : tagMapTime;
    const filterName = mapToUse[tag];

    if (filterName) {
      if (category === "visitedDate") {
        setCheckedFilters((prevFilters) => ({
          ...prevFilters,
          [filterName]: isChecked,
        }));
      } else if (category === "visitedTime") {
        setCheckedFiltersTime((prevFiltersTime) => ({
          ...prevFiltersTime,
          [filterName]: isChecked,
        }));
      }
    }
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

  const loadFiltersFromSessionStorage = () => {
    const savedFilters = sessionStorage.getItem('filters');
    if (savedFilters) {
      return JSON.parse(savedFilters);
    }
    return null;
  };

  const initializeFilters = () => {
    const savedFilters = loadFiltersFromSessionStorage();
    if (savedFilters) {
      setSearchQuery(savedFilters.searchQuery || '');
      setCheckedFilters(savedFilters.checkedFilters || {
        lastWeek: false,
        last30Days: false,
        last6Months: false,
        allTime: false,
      });



      const isAnyFilterActive = Object.values(savedFilters.checkedFilters || {}).some(value => value === true);
      if (isAnyFilterActive) {
        setButtonFilters(savedFilters.button);
        const tagMap: { [key: string]: string } = {
          lastWeek: "Last week",
          last30Days: "Last 30 days",
          last6Months: "Last 6 months",
          allTime: "All time",
        };
        const activeFilter = Object.keys(savedFilters.checkedFilters).find(key => savedFilters.checkedFilters[key]);

        if (activeFilter) {
          addTag("visitedDate", tagMap[activeFilter]);
        }
      } else {
        const fromDate = savedFilters.from_date ? dayjs.unix(savedFilters.from_date).format('MMM DD, YYYY') : null;
        const toDate = savedFilters.to_date ? dayjs.unix(savedFilters.to_date).format('MMM DD, YYYY') : null;
        const newTag = fromDate && toDate ? `From ${fromDate} to ${toDate}` : null;
        if (newTag) {
          addTag("visitedDate", newTag);
        }
      }
      setButtonFilters(savedFilters.button)
      if (savedFilters.regions) {
        setTags((prevTags) => {
          const uniqueTags = new Set(prevTags);
          savedFilters.regions.forEach((cityTag: string) => {
            uniqueTags.add(cityTag);
          });
          return Array.from(uniqueTags);
        });
      }
      if (savedFilters.pageUrlTags) {
        setPageUrlTags((prevTags) => {
          const uniqueTags = new Set(prevTags);
          savedFilters.pageUrlTags.forEach((urlPageUrlTag: string) => {
            uniqueTags.add(urlPageUrlTag);
          });
          return Array.from(uniqueTags);
        });
      }
    }
  };

  useEffect(() => {
    initializeFilters();
  }, [open]);

  const handleSeniorityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;

    setCheckedFiltersLastLoginDate((prev) => ({
      ...prev,
      [value]: checked
    }));
  };

  const [checkedFiltersTime, setCheckedFiltersTime] = useState({
    morning: false,
    evening: false,
    afternoon: false,
    all_day: false,
  });


  const handleFilters = () => {
    const filters = {
      lastLoginDate: checkedFiltersLastLoginDate,
      joinDate: checkedFiltersJoinDate,
    };

    saveFiltersToSessionStorage(filters);


    return filters;
  };

  const handleLastLoginDateChange = (name: string) => (newValue: any) => {
    setDateRangeJoinDate((prevRange) => {
      const updatedRange = {
        ...prevRange,
        [name]: newValue,
      };

      setCheckedFilters({
        lastWeek: false,
        last30Days: false,
        last6Months: false,
        allTime: false,
      });

      const oldFromDate = prevRange.fromDate
        ? dayjs(prevRange.fromDate).format('MMM DD, YYYY')
        : '';
      const oldToDate = prevRange.toDate
        ? dayjs(prevRange.toDate).format('MMM DD, YYYY')
        : '';

      const fromDate = updatedRange.fromDate
        ? dayjs(updatedRange.fromDate).format('MMM DD, YYYY')
        : '';
      const toDate = updatedRange.toDate
        ? dayjs(updatedRange.toDate).format('MMM DD, YYYY')
        : '';

      const newTag = fromDate && toDate ? `From ${fromDate} to ${toDate}` : null;


      setSelectedTags((prevTags) => {
        const updatedTags = {
          ...prevTags,
          visitedDate: newTag ? [newTag] : [],
        };

        // If a new label exists, add it
        if (newTag) {
          addTag("lastLoginDate", newTag);
        }

        // If the label has been replaced or removed, clear the date range
        if (!newTag && prevTags.visitedDate.length > 0) {
          setDateRangeJoinDate({ fromDate: null, toDate: null });
        } else if (newTag && oldFromDate && oldToDate) {
          removeTag("lastLoginDate", `From ${oldFromDate} to ${oldToDate}`);
        }

        return updatedTags;
      });

      return updatedRange;
    });
  };

  const handleJoinDateChange = (name: string) => (newValue: any) => {
    setDateRangeJoinDate((prevRange) => {
      const updatedRange = {
        ...prevRange,
        [name]: newValue,
      };

      setCheckedFilters({
        lastWeek: false,
        last30Days: false,
        last6Months: false,
        allTime: false,
      });

      const oldFromDate = prevRange.fromDate
        ? dayjs(prevRange.fromDate).format('MMM DD, YYYY')
        : '';
      const oldToDate = prevRange.toDate
        ? dayjs(prevRange.toDate).format('MMM DD, YYYY')
        : '';

      const fromDate = updatedRange.fromDate
        ? dayjs(updatedRange.fromDate).format('MMM DD, YYYY')
        : '';
      const toDate = updatedRange.toDate
        ? dayjs(updatedRange.toDate).format('MMM DD, YYYY')
        : '';

      const newTag = fromDate && toDate ? `From ${fromDate} to ${toDate}` : null;


      setSelectedTags((prevTags) => {
        const updatedTags = {
          ...prevTags,
          visitedDate: newTag ? [newTag] : [],
        };

        // If a new label exists, add it
        if (newTag) {
          addTag("joinDate", newTag);
        }

        // If the label has been replaced or removed, clear the date range
        if (!newTag && prevTags.visitedDate.length > 0) {
          setDateRangeJoinDate({ fromDate: null, toDate: null });
        } else if (newTag && oldFromDate && oldToDate) {
          removeTag("joinDate", `From ${oldFromDate} to ${oldToDate}`);
        }

        return updatedTags;
      });

      return updatedRange;
    });
  };

  const isDateFilterActive = () => {
    return (
      Object.values(checkedFilters).some(value => value) || // Checking checkboxes for dates
      (dateRangeJoinDate.fromDate && dateRangeJoinDate.toDate) // Validate user's date range selection
    );
  };

  const handleRadioChangeJoinDate = (event: { target: { name: string } }) => {
    const { name } = event.target;

    setCheckedFilters((prevFilters) => {
      // Explicitly type `prevFilters` for better TypeScript support
      const prevFiltersTyped = prevFilters as Record<string, boolean>;

      // Find the previously selected radio button
      const previouslySelected = Object.keys(prevFiltersTyped).find((key) => prevFiltersTyped[key]);

      // Reset all filters and select the new one
      const newFilters = {
        lastWeek: false,
        last30Days: false,
        last6Months: false,
        allTime: false,
        [name]: true,
      };

      const tagMap: { [key: string]: string } = {
        lastWeek: "Last week",
        last30Days: "Last 30 days",
        last6Months: "Last 6 months",
        allTime: "All time",
      };

      // Remove the tag for the previously selected radio button, if any
      if (previouslySelected && previouslySelected !== name) {
        removeTag("joinDate", tagMap[previouslySelected]);
      }

      setDateRangeJoinDate({ fromDate: null, toDate: null });

      // Add the tag for the currently selected radio button
      addTag("joinDate", tagMap[name]);

      return newFilters;
    });
  };

  const handleRadioChangeLastLoginDate = (event: { target: { name: string } }) => {
    const { name } = event.target;

    setCheckedFilters((prevFilters) => {
      // Explicitly type `prevFilters` for better TypeScript support
      const prevFiltersTyped = prevFilters as Record<string, boolean>;

      // Find the previously selected radio button
      const previouslySelected = Object.keys(prevFiltersTyped).find((key) => prevFiltersTyped[key]);

      // Reset all filters and select the new one
      const newFilters = {
        lastWeek: false,
        last30Days: false,
        last6Months: false,
        allTime: false,
        [name]: true,
      };

      const tagMap: { [key: string]: string } = {
        lastWeek: "Last week",
        last30Days: "Last 30 days",
        last6Months: "Last 6 months",
        allTime: "All time",
      };

      // Remove the tag for the previously selected radio button, if any
      if (previouslySelected && previouslySelected !== name) {
        removeTag("lastLoginDate", tagMap[previouslySelected]);
      }

      setDateRangeJoinDate({ fromDate: null, toDate: null });

      // Add the tag for the currently selected radio button
      addTag("lastLoginDate", tagMap[name]);

      return newFilters;
    });
  };


  const saveFiltersToSessionStorage = (filters: {
    lastLoginDate: typeof checkedFiltersLastLoginDate,
    joinDate: typeof checkedFiltersJoinDate,
  }) => {
    sessionStorage.setItem('filters-admin', JSON.stringify(filters));
  };

  useEffect(() => {
    if (open) {
      if (lastLoginDate) {
        const initialState = lastLoginDate.reduce((acc, item) => {
          acc[item] = false;
          return acc;
        }, {} as Record<string, boolean>);
        setCheckedFiltersLastLoginDate(initialState);
      }
      if (joinDate) {
        const initialState = joinDate.reduce((acc, item) => {
          acc[item] = false;
          return acc;
        }, {} as Record<string, boolean>);
        setCheckedFiltersJoinDate(initialState);
      }
    }
  }, [open, joinDate, lastLoginDate]);


  const handleApply = () => {
    const filters = handleFilters();
    onApply(filters);
    onClose();
  };


  const handleClearFilters = () => {
    setIsLastLoginDateOpen(false)
    setIsJoinDateOpen(false)
    setCheckedFiltersLastLoginDate({})
    setCheckedFiltersJoinDate({})
    setSearchQuery("");

    sessionStorage.removeItem('filters-admin')
  };


  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: "40%",
            position: "fixed",
            top: 0,
            bottom: 0,
            "@media (max-width: 600px)": {
              width: "100%",
            },
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.2em 1em 0.5em 1em",
            borderBottom: "1px solid #e4e4e4",
            position: "sticky",
            zIndex: 10,
            top: 0,
            backgroundColor: "#fff",
          }}
        >
          <Typography
            variant="h6"
            className='first-sub-title'
            sx={{
              textAlign: "center",
            }}
          >
            Filter Search
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "row" }}>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <Box
          sx={{
            p: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pb: 2,
            position: "relative",
            height: '100%',
            width: '100%'
          }}
        >

          {/* join Date */}
          <Box
            sx={{
              width: "100%",
              padding: "0.5em",
              border: "1px solid rgba(228, 228, 228, 1)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                mb: 0,
                gap: 1,
                cursor: 'pointer'
              }}
              onClick={() => setIsJoinDateOpen(!isJoinDateOpen)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isDateFilterActive() ? "visible" : "hidden"
                }}
              />
              <Image
                src="/calendar-2.svg"
                alt="calendar"
                width={18}
                height={18}
              />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                Join Date
              </Typography>
              {selectedTags.visitedDate.map((tag, index) => (
                <CustomChip
                  key={index}
                  label={tag}
                  onDelete={() => removeTag("visitedDate", tag)}
                />
              ))}
              <IconButton
                onClick={() => setIsJoinDateOpen(!isJoinDateOpen)}
                aria-label="toggle-content"
              >
                {isJoinDateOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isJoinDateOpen}>
              <Box
                sx={{
                  ...filterStyles.filter_dropdown
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedFilters.lastWeek}
                        onChange={handleRadioChangeJoinDate}
                        name="lastWeek"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(56, 152, 252, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFilters.lastWeek ? "rgba(56, 152, 252, 1) !important" : "rgba(74, 74, 74, 1)" }}>Last week</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedFilters.last30Days}
                        onChange={handleRadioChangeJoinDate}
                        name="last30Days"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(56, 152, 252, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFilters.last30Days ? "rgba(56, 152, 252, 1) !important" : "rgba(74, 74, 74, 1)" }}>Last 30 days</Typography>}
                  />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedFilters.last6Months}
                        onChange={handleRadioChangeJoinDate}
                        name="last6Months"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(56, 152, 252, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFilters.last6Months ? "rgba(56, 152, 252, 1) !important" : "rgba(74, 74, 74, 1)" }}>Last 6 months</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedFilters.allTime}
                        onChange={handleRadioChangeJoinDate}
                        name="allTime"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(56, 152, 252, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFilters.allTime ? "rgba(56, 152, 252, 1) !important" : "rgba(74, 74, 74, 1)" }}>All time</Typography>}
                  />
                </Box>
              </Box>
              <Box sx={filterStyles.date_time_formatted}>
                <Box sx={{ borderBottom: '1px solid #e4e4e4', flexGrow: 1 }} />
                <Typography variant="body1"
                  sx={filterStyles.or_text}
                >
                  OR
                </Typography>
                <Box sx={{ borderBottom: '1px solid #e4e4e4', flexGrow: 1 }} />
              </Box>
              <Box
                sx={{ display: "flex", gap: 2, justifyContent: "flex-start" }}
              >
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="From date"
                    value={dateRangeJoinDate.fromDate}
                    onChange={(newValue) => handleJoinDateChange("fromDate")(newValue)}
                    sx={{ width: '100%' }}
                    slotProps={{
                      textField: {
                        variant: "outlined",
                        fullWidth: true,
                        sx: {
                          '& .MuiInputBase-input': {
                            fontFamily: 'Roboto',
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '19.6px',
                            textAlign: 'left',
                          },
                          '& .MuiInputLabel-root': {
                            fontFamily: 'Roboto',
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '19.6px',
                            textAlign: 'left',
                          }
                        }
                      }
                    }}
                  />
                  <DatePicker
                    label="To date"
                    value={dateRangeJoinDate.toDate}
                    onChange={(newValue) =>
                      handleJoinDateChange("toDate")(newValue)
                    }
                    sx={{ width: "100%" }}
                    slotProps={{
                      textField: {
                        variant: "outlined",
                        fullWidth: true,
                        sx: {
                          '& .MuiInputBase-input': {
                            fontFamily: 'Roboto',
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '19.6px',
                            textAlign: 'left',
                          },
                          '& .MuiInputLabel-root': {
                            fontFamily: 'Roboto',
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '19.6px',
                            textAlign: 'left',
                          }
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
              </Box>
            </Collapse>
          </Box>

          {/* Last Login Date */}
          <Box
            sx={{
              width: "100%",
              padding: "0.5em",
              border: "1px solid rgba(228, 228, 228, 1)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                mb: 0,
                gap: 1,
                cursor: 'pointer'
              }}
              onClick={() => setIsLastLoginDateOpen(!isLastLoginDateOpen)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isDateFilterActive() ? "visible" : "hidden"
                }}
              />
              <Image
                src="/calendar-2.svg"
                alt="calendar"
                width={18}
                height={18}
              />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                Last Login Date
              </Typography>
              {selectedTags.visitedDate.map((tag, index) => (
                <CustomChip
                  key={index}
                  label={tag}
                  onDelete={() => removeTag("visitedDate", tag)}
                />
              ))}
              <IconButton
                onClick={() => setIsLastLoginDateOpen(!isLastLoginDateOpen)}
                aria-label="toggle-content"
              >
                {isLastLoginDateOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isLastLoginDateOpen}>
              <Box
                sx={{
                  ...filterStyles.filter_dropdown
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedFilters.lastWeek}
                        onChange={handleRadioChangeLastLoginDate}
                        name="lastWeek"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(56, 152, 252, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFilters.lastWeek ? "rgba(56, 152, 252, 1) !important" : "rgba(74, 74, 74, 1)" }}>Last week</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedFilters.last30Days}
                        onChange={handleRadioChangeLastLoginDate}
                        name="last30Days"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(56, 152, 252, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFilters.last30Days ? "rgba(56, 152, 252, 1) !important" : "rgba(74, 74, 74, 1)" }}>Last 30 days</Typography>}
                  />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedFilters.last6Months}
                        onChange={handleRadioChangeLastLoginDate}
                        name="last6Months"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(56, 152, 252, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFilters.last6Months ? "rgba(56, 152, 252, 1) !important" : "rgba(74, 74, 74, 1)" }}>Last 6 months</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedFilters.allTime}
                        onChange={handleRadioChangeLastLoginDate}
                        name="allTime"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(56, 152, 252, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFilters.allTime ? "rgba(56, 152, 252, 1) !important" : "rgba(74, 74, 74, 1)" }}>All time</Typography>}
                  />
                </Box>
              </Box>
              <Box sx={filterStyles.date_time_formatted}>
                <Box sx={{ borderBottom: '1px solid #e4e4e4', flexGrow: 1 }} />
                <Typography variant="body1"
                  sx={filterStyles.or_text}
                >
                  OR
                </Typography>
                <Box sx={{ borderBottom: '1px solid #e4e4e4', flexGrow: 1 }} />
              </Box>
              <Box
                sx={{ display: "flex", gap: 2, justifyContent: "flex-start" }}
              >
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="From date"
                    value={dateRangeJoinDate.fromDate}
                    onChange={(newValue) => handleLastLoginDateChange("fromDate")(newValue)}
                    sx={{ width: '100%' }}
                    slotProps={{
                      textField: {
                        variant: "outlined",
                        fullWidth: true,
                        sx: {
                          '& .MuiInputBase-input': {
                            fontFamily: 'Roboto',
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '19.6px',
                            textAlign: 'left',
                          },
                          '& .MuiInputLabel-root': {
                            fontFamily: 'Roboto',
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '19.6px',
                            textAlign: 'left',
                          }
                        }
                      }
                    }}
                  />
                  <DatePicker
                    label="To date"
                    value={dateRangeJoinDate.toDate}
                    onChange={(newValue) =>
                      handleLastLoginDateChange("toDate")(newValue)
                    }
                    sx={{ width: "100%" }}
                    slotProps={{
                      textField: {
                        variant: "outlined",
                        fullWidth: true,
                        sx: {
                          '& .MuiInputBase-input': {
                            fontFamily: 'Roboto',
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '19.6px',
                            textAlign: 'left',
                          },
                          '& .MuiInputLabel-root': {
                            fontFamily: 'Roboto',
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '19.6px',
                            textAlign: 'left',
                          }
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
              </Box>
            </Collapse>
          </Box>

          <Box
            sx={{
              mb: 0,
              padding: "0.15em",
              visibility: 'hidden'
            }}
          >
          </Box>
          {/* Buttons */}
          <Box
            sx={{
              position: 'fixed ',
              width: '40%',
              bottom: 0,
              right: 0,
              zIndex: 1302,
              backgroundColor: 'rgba(255, 255, 255, 1)',
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '1em',
              padding: '1em',
              gap: 3,
              borderTop: '1px solid rgba(228, 228, 228, 1)',
              "@media (max-width: 600px)":
                { width: '100%' }
            }}
          >
            <Button
              variant="contained"
              onClick={handleClearFilters}
              className='second-sub-title'
              sx={{
                color: "rgba(56, 152, 252, 1) !important",
                backgroundColor: '#fff',
                border: ' 1px solid rgba(56, 152, 252, 1)',
                textTransform: "none",
                padding: "0.75em 2.5em",
                '&:hover': {
                  backgroundColor: 'transparent'
                }
              }}
            >
              Clear all
            </Button>
            <Button
              variant="contained"
              onClick={handleApply}
              className='second-sub-title'
              sx={{
                backgroundColor: "rgba(56, 152, 252, 1)",
                color: 'rgba(255, 255, 255, 1) !important',
                textTransform: "none",
                padding: "0.75em 2.5em",
                '&:hover': {
                  backgroundColor: 'rgba(56, 152, 252, 1)'
                }
              }}
            >
              Apply
            </Button>
          </Box>

        </Box>
      </Drawer>
    </>
  );
};

export default FilterPopup;
