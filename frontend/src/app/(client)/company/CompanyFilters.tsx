import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop, TextField, InputAdornment, Collapse, Divider, FormControlLabel, Checkbox, Radio, List, ListItem, ListItemText, RadioGroup, Grid } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import Image from 'next/image';
import { filterStyles } from '../../../css/filterSlider';
import debounce from 'lodash/debounce';
import axiosInstance from '@/axios/axiosInterceptorInstance';


interface FilterPopupProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

const FilterPopup: React.FC<FilterPopupProps> = ({ open, onClose, onApply }) => {
  const [selectedButton, setSelectedButton] = useState<string | null>(null);
  const [isVisitedDateOpen, setIsVisitedDateOpen] = useState(false);
  const [isVisitedPageOpen, setIsVisitedPageOpen] = useState(false);
  const [isNumberOfEmployeeOpen, setIsNumberOfEmployeeOpen] = useState(false);
  const [isTimeSpentOpen, setIsTimeSpentOpen] = useState(false);
  const [isVisitedTimeOpen, setIsVisitedTimeOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isLeadFunnel, setIsLeadFunnel] = useState(false);
  const [isStatus, setIsStatus] = useState(false);
  const [isRecurringVisits, setIsRecurringVisits] = useState(false);
  const [region, setRegions] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(
    null
  );
  const [selectedTimeRange, setSelectedTimeRange] = useState<string | null>(
    null
  );
  const [cities, setCities] = useState<{ city: string, state: string }[]>([]);
  const [contacts, setContacts] = useState<{ name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: string[] }>(
    {
      visitedDate: [],
      visitedTime: [],
      region: [],
      pageVisits: [],
      numberOfEmployees: [],
      timeSpents: [],
    }
  );
  const [regions, setTags] = useState<string[]>([]);
  const [selectedFunnels, setSelectedFunnels] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [buttonFilters, setButtonFilters] = useState<ButtonFilters>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // const [open_save, setOpen] = useState(false);
  // const [openLoadDrawer, setOpenLoadDrawer] = useState(false);
  const [filterName, setFilterName] = useState("");
  // const [isButtonDisabled, setIsButtonDisabled] = useState(true);


  type SavedFilter = {
    name: string;
    data: ReturnType<typeof handleFilters>; // Use the return type of handleFilters directly
  };
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  const handleClear = () => {
    setFilterName("");
  };

  // const handleOpen = () => setOpen(true);
  // const handleClose = () => setOpen(false);


  type ButtonFilters = {
    button: string;
    dateRange: {
      fromDate: number;
      toDate: number;
    };
    selectedFunnels: string[];
  } | null;

  const handleAddTag = (e: { key: string }) => {
    if (e.key === "Enter" && region.trim()) {
      setTags([...regions, region.trim()]);
      setRegions("");
    }
  };

  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const handleChangeRecurringVisits = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;


    setSelectedValues((prevSelectedValues) => {
      if (prevSelectedValues.includes(value)) {
        return prevSelectedValues.filter((item) => item !== value);
      } else {
        return [...prevSelectedValues, value];
      }
    });
  };


  const handleDeleteRecurringVisit = (valueToDelete: string) => {
    setSelectedValues((prevSelectedValues) =>
      prevSelectedValues.filter((value) => value !== valueToDelete)
    );
  };



  const handleButtonLeadFunnelClick = (label: string) => {
    setSelectedFunnels((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  // Status button
  const handleButtonStatusClick = (label: string) => {
    const mappedStatus = statusMapping[label];
    setSelectedStatus((prev) =>
      prev.includes(mappedStatus)
        ? prev.filter((item) => item !== mappedStatus)
        : [...prev, mappedStatus]
    );
  };

  const statusMapping: Record<string, string> = {
    New: "New",
    "Returning": "Returning"
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
      const updatedTags = prevTags[category].filter((t) => t !== tag);

      const isLastTagRemoved = updatedTags.length === 0;

      // If the last tag and category "visitedDate" are deleted, clear the state
      if (category === "visitedDate" && isLastTagRemoved) {
        setDateRange({ fromDate: null, toDate: null });
        setSelectedDateRange(null);
      }

      // Update checkbox states if necessary
      if (category === "visitedDate") {
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

      if (category === "visitedTime") {
        if (updatedTags.length === 0) {
          setTimeRange({ fromTime: null, toTime: null });
          setSelectedTimeRange(null);
        }
      }

      if (category === "visitedTime") {
        const tagMapTime: { [key: string]: string } = {
          "Morning 12AM - 11AM": "morning",
          "Afternoon 11AM - 5PM": "afternoon",
          "Evening 5PM - 9PM": "evening",
          "All day": "all_day",
        };

        const filterName = tagMapTime[tag];
        if (filterName) {
          setCheckedFiltersTime((prevFiltersTime) => ({
            ...prevFiltersTime,
            [filterName]: false,
          }));
        }
      }

      // if (category === "pageVisits") {
      //   const tagMap: { [key: string]: string } = {
      //     "1": "1",
      //     "2": "2",
      //     "3": "3",
      //     "4": "4",
      //     "4+": "4+"
      //   };

      //   const filterName = tagMap[tag];
      //   if (filterName) {
      //     setCheckedFiltersPageVisits((prevFilters) => ({
      //       ...prevFilters,
      //       [filterName]: false,
      //     }));
      //   }
      // }

      return { ...prevTags, [category]: updatedTags };
    });
  };

  const handleDeletePageVisit = (valueToDelete: string) => {
    setSelectedTags((prevTags) => {
      const updatedTags = prevTags.pageVisits.filter((tag) => tag !== valueToDelete);

      const tagMap: { [key: string]: string } = {
        "1": "1",
        "2": "2",
        "3": "3",
        "4": "4",
        "4+": "4+"
      };

      const filterName = tagMap[valueToDelete];
      if (filterName) {
        setSelectedPageVisit(null);
      }

      return { ...prevTags, pageVisits: updatedTags };
    });
  };

  const handleDeleteTimeSpent = (valueToDelete: string) => {
    setSelectedTags((prevTags) => {
      const updatedTags = prevTags.timeSpents.filter((tag) => tag !== valueToDelete);

      const tagMap: { [key: string]: string } = {
        "under 10 secs": "under_10",
        "10-30 secs": "over_10",
        "30-60 secs": "over_30",
        "Over 60 secs": "over_60",
      };

      const filterName = tagMap[valueToDelete];
      if (filterName) {
        setCheckedFiltersTimeSpent((prevFilters) => ({
          ...prevFilters,
          [filterName]: false,
        }));
      }

      return { ...prevTags, timeSpents: updatedTags };
    });
  };



  interface TagMap {
    [key: string]: string;
  }

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



  ///// Date

  interface DateRange {
    fromDate: Dayjs | null;
    toDate: Dayjs | null;
  }
  const [dateRange, setDateRange] = useState<DateRange>({
    fromDate: null,
    toDate: null,
  });
  const [checkedFilters, setCheckedFilters] = useState({
    lastWeek: false,
    last30Days: false,
    last6Months: false,
    allTime: false,
  });


  const handleDateChange = (name: string) => (newValue: any) => {
    setDateRange((prevRange) => {
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
          addTag("visitedDate", newTag);
        }

        // If the label has been replaced or removed, clear the date range
        if (!newTag && prevTags.visitedDate.length > 0) {
          setDateRange({ fromDate: null, toDate: null });
          setSelectedDateRange(null);
        } else if (newTag && oldFromDate && oldToDate) {
          removeTag("visitedDate", `From ${oldFromDate} to ${oldToDate}`);
        }

        return updatedTags;
      });

      return updatedRange;
    });
  };

  /////// Time
  type TimeRange = {
    fromTime: dayjs.Dayjs | null;
    toTime: dayjs.Dayjs | null;
  };

  // Инициализация состояния
  const [timeRange, setTimeRange] = useState<TimeRange>({
    fromTime: null,
    toTime: null,
  });
  const [checkedFiltersTime, setCheckedFiltersTime] = useState({
    morning: false,
    evening: false,
    afternoon: false,
    all_day: false,
  });


  const handleTimeChange = (name: string) => (newValue: any) => {
    setTimeRange((prevRange) => {
      const updatedRange = {
        ...prevRange,
        [name]: newValue,
      };

      setCheckedFiltersTime((prevFiltersTime) => {
        // Explicitly type `prevFilters` for better TypeScript support
        const prevFiltersTimeTyped = prevFiltersTime as Record<string, boolean>;

        // Find the previously selected radio button
        const previouslySelectedTime = Object.keys(prevFiltersTimeTyped).find((key) => prevFiltersTimeTyped[key]);

        // Reset all filters and select the new one
        const newFiltersTime = {
          morning: false,
          afternoon: false,
          evening: false,
          all_day: false,
          [name]: true,
        };

        const tagMapTime: { [key: string]: string } = {
          morning: "Morning 12AM - 11AM",
          afternoon: "Afternoon 11AM - 5PM",
          evening: "Evening 5PM - 9PM",
          all_day: "All day",
        };

        // Remove the tag for the previously selected radio button, if any
        if (previouslySelectedTime && previouslySelectedTime !== name) {
          removeTag("visitedTime", tagMapTime[previouslySelectedTime]);
        }

        setCheckedFiltersTime({
          morning: false,
          evening: false,
          afternoon: false,
          all_day: false,
        });

        return newFiltersTime;
      });

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

  const deleteTagTime = () => {
    setSelectedTimeRange(null)
    setTimeRange({
      fromTime: null,
      toTime: null,
    });
  }

  ////Number of Employees
  const [checkedFiltersNumberOfEmployees, setCheckedFiltersNumberOfEmployees] = useState({
    "1-10": false,
    "11-20": false,
    "21-50": false,
    "51-100": false,
    "101-200": false,
    "201-500": false,
    "501-1000": false,
    "1001-2000": false,
    "2001-5000": false,
    "5001-10000": false,
    "10001+": false,
    "unknown": false,
  });


  const handleCheckboxChangeNumberOfEmployees = (event: { target: { name: string; checked: boolean } }) => {
    const { name, checked } = event.target;

    setCheckedFiltersNumberOfEmployees((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        [name]: checked,
      };

      if (checked) {
        addTag("numberOfEmployees", name);
      } else {
        removeTag("numberOfEmployees", name);
      }

      return newFilters;
    });
  };



  const [selectedPageVisit, setSelectedPageVisit] = useState<string | null>(null);

  const handleRadioChangePageVisits = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSelectedPageVisit(value);

    const tagMap: { [key: string]: string } = {
      "1": "1",
      "2": "2",
      "3": "3",
      "4": "4",
      "4+": "4+"
    };

    if (selectedPageVisit) {
      removeTag("pageVisits", tagMap[selectedPageVisit]);
    }
    addTag("pageVisits", tagMap[value]);
  };

  ////time spent
  const [checkedFiltersTimeSpent, setCheckedFiltersTimeSpent] = useState({
    under_10: false,
    over_10: false,
    over_30: false,
    over_60: false,
  });

  const handleCheckboxChangeTimeSpent = (event: {
    target: { name: any; checked: any };
  }) => {
    const { name, checked } = event.target;

    setCheckedFiltersTimeSpent((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        [name]: checked,
      };

      const tagMap: { [key: string]: string } = {
        under_10: "under 10 secs",
        over_10: "10-30 secs",
        over_30: "30-60 secs",
        over_60: "Over 60 secs",
      };

      if (checked) {
        addTag("timeSpents", tagMap[name]);
      } else {
        removeTag("timeSpents", tagMap[name]);
      }

      return newFilters;
    });
  };

  const getFilterDates = () => {
    const today = dayjs();
    return {
      lastWeek: {
        from: today.subtract(1, "week").startOf("day").unix(),
        to: today.endOf("day").unix(),
      },
      last30Days: {
        from: today.subtract(30, "day").startOf("day").unix(),
        to: today.endOf("day").unix(),
      },
      last6Months: {
        from: today.subtract(6, "month").startOf("day").unix(),
        to: today.endOf("day").unix(),
      },
      allTime: {
        from: null,
        to: today.endOf("day").unix(),
      },
    };
  };

  const handleFilters = () => {
    const filterDates = getFilterDates(); // Function to get date ranges like lastWeek, last30Days, etc.

    // Check that at least one of the time filters is active
    const isDateFilterChecked = Object.values(checkedFilters).some((value) => value);

    let fromTime = timeRange.fromTime ? dayjs(timeRange.fromTime).format('HH:mm') : null;
    let toTime = timeRange.toTime ? dayjs(timeRange.toTime).format('HH:mm') : null;

    // Process filters by time (morning, afternoon, evening, all day)
    if (checkedFiltersTime.morning) {
      fromTime = "00:00"; // 12AM
      toTime = "11:00";   // 11AM
    } else if (checkedFiltersTime.afternoon) {
      fromTime = "11:00"; // 11AM
      toTime = "17:00";   // 5PM
    } else if (checkedFiltersTime.evening) {
      fromTime = "17:00"; // 5PM
      toTime = "21:00";   // 9PM
    } else if (checkedFiltersTime.all_day) {
      fromTime = "00:00"; // 12AM
      toTime = "23:59";   // 11:59PM
    }

    // Determine from_date and to_date values ​​based on active filters
    let fromDateTime = null;
    let toDateTime = null;

    // If at least one date filter is active, use its ranges
    if (isDateFilterChecked) {
      if (checkedFilters.lastWeek) {
        fromDateTime = filterDates.lastWeek.from;
        toDateTime = filterDates.lastWeek.to;
      } else if (checkedFilters.last30Days) {
        fromDateTime = filterDates.last30Days.from;
        toDateTime = filterDates.last30Days.to;
      } else if (checkedFilters.last6Months) {
        fromDateTime = filterDates.last6Months.from;
        toDateTime = filterDates.last6Months.to;
      } else if (checkedFilters.allTime) {
        fromDateTime = filterDates.allTime.from;
        toDateTime = filterDates.allTime.to;
      }
    } else {
      // If no filter is selected, use the range from dateRange
      fromDateTime = dateRange.fromDate
        ? dayjs(dateRange.fromDate).startOf("day").unix()
        : null;
      toDateTime = dateRange.toDate
        ? dayjs(dateRange.toDate).endOf("day").unix()
        : null;
    }


    // Составление объекта с фильтрами
    const filters = {
      ...buttonFilters, // Existing button filters
      from_date: fromDateTime, // Set value from_date
      to_date: toDateTime, // Set value of to_date
      selectedFunnels: buttonFilters ? buttonFilters.selectedFunnels : selectedFunnels,
      button: buttonFilters ? buttonFilters.button : selectedButton,
      checkedFiltersTime,     // Filters by time (morning, afternoon, evening, etc.)
      selectedPageVisit: selectedPageVisit ? selectedPageVisit : '',
      checkedFiltersNumberOfEmployees,
      checkedFilters,
      regions,
      checkedFiltersTimeSpent,
      selectedStatus,
      recurringVisits: selectedValues,
      searchQuery,
    };

    saveFiltersToSessionStorage(filters);


    return filters;
  };


  const saveFiltersToSessionStorage = (filters: {
    from_date: number | null;
    to_date: number | null;
    selectedFunnels: string[]; button: string | null;
    checkedFiltersTime: { morning: boolean; evening: boolean; afternoon: boolean; all_day: boolean; };
    checkedFiltersNumberOfEmployees: {
      "1-10": boolean,
      "11-20": boolean,
      "21-50": boolean,
      "51-100": boolean,
      "101-200": boolean,
      "201-500": boolean,
      "501-1000": boolean,
      "1001-2000": boolean,
      "2001-5000": boolean,
      "5001-10000": boolean,
      "10001+": boolean,
      "unknown": boolean,
    };
    regions: string[];
    selectedPageVisit: string,
    checkedFiltersTimeSpent: { under_10: boolean; over_10: boolean; over_30: boolean; over_60: boolean; };
    selectedStatus: string[]; recurringVisits: string[];
    searchQuery: string; dateRange?: { fromDate: number | null; toDate: number | null; } | undefined;
  }) => {
    sessionStorage.setItem('filters', JSON.stringify(filters));
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

      // Page visits
      setCheckedFiltersNumberOfEmployees(savedFilters.checkedFiltersNumberOfEmployees || {
        "1-10": false,
        "11-20": false,
        "21-50": false,
        "51-100": false,
        "101-200": false,
        "201-500": false,
        "501-1000": false,
        "1001-2000": false,
        "2001-5000": false,
        "5001-10000": false,
        "10001+": false,
        "unknown": false,
      });

      // Checking active page visit filters
      const isPageVisitsFilterActive = Object.values(savedFilters.checkedFiltersPageVisits || {}).some(value => value === true);

      if (isPageVisitsFilterActive) {
        const pageVisitsTagMap: { [key: string]: string } = {
          "1": "1",
          "2": "2",
          "3": "3",
          "4": "4",
          "5": "5"
        };

        // Go through all filters and add a tag for each active one
        Object.keys(savedFilters.checkedFiltersPageVisits).forEach((key) => {
          if (savedFilters.checkedFiltersPageVisits[key]) {
            addTag("pageVisits", pageVisitsTagMap[key]);
          }
        });
      }

      setCheckedFiltersTime(savedFilters.checkedFiltersTime || {
        morning: false,
        afternoon: false,
        evening: false,
        all_day: false,
      });
      setCheckedFilters(savedFilters.checkedFilters || {
        lastWeek: false,
        last30Days: false,
        last6Months: false,
        allTime: false,
      });

      // Time spent
      setCheckedFiltersTimeSpent(savedFilters.checkedFiltersTimeSpent || {
        under_10: false,
        over_10: false,
        over_30: false,
        over_60: false,
      });

      const isTimeSpentFilterActive = Object.values(savedFilters.checkedFiltersTimeSpent || {}).some(value => value === true);
      if (isTimeSpentFilterActive) {
        const timeSpentTagMap: { [key: string]: string } = {
          under_10: "under 10 secs",
          over_10: "10-30 secs",
          over_30: "30-60 secs",
          over_60: "Over 60 secs",
        };

        Object.keys(savedFilters.checkedFiltersTimeSpent).forEach((key) => {
          if (savedFilters.checkedFiltersTimeSpent[key]) {
            addTag("timeSpents", timeSpentTagMap[key]);
          }
        });
      }


      setSelectedFunnels(savedFilters.selectedFunnels || []);
      setSelectedStatus(savedFilters.selectedStatus || []);
      setSelectedValues(savedFilters.recurringVisits || []);
      setSearchQuery(savedFilters.searchQuery || '');


      const isTimeFilterActive = Object.values(savedFilters.checkedFiltersTime || {}).some(value => value === true);
      if (isTimeFilterActive) {
        const timeTagMap: { [key: string]: string } = {
          morning: "Morning 12AM - 11AM",
          afternoon: "Afternoon 11AM - 5PM",
          evening: "Evening 5PM - 9PM",
          all_day: "All day",
        };

        // Process active filters
        Object.keys(savedFilters.checkedFiltersTime).forEach((key) => {
          if (savedFilters.checkedFiltersTime[key]) {
            addTag("visitedTime", timeTagMap[key]);
          }
        });

      } else {
        // Convert time from string format to Dayjs
        const fromTime = savedFilters.from_time ? dayjs(savedFilters.from_time, 'HH:mm') : null;
        const toTime = savedFilters.to_time ? dayjs(savedFilters.to_time, 'HH:mm') : null;

        // Formatting time for tag
        const formattedFromTime = fromTime ? fromTime.format('h:mm A') : '';
        const formattedToTime = toTime ? toTime.format('h:mm A') : '';
        if (fromTime && toTime) {
          setSelectedTimeRange(`${formattedFromTime} to ${formattedToTime}`);
        } else {
          setSelectedTimeRange(null);
        }

        // Обновление состояния
        setTimeRange({
          fromTime: fromTime && fromTime.isValid() ? fromTime : null,
          toTime: toTime && toTime.isValid() ? toTime : null,
        });
      }


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
        setDateRange({
          fromDate: savedFilters.from_date ? dayjs.unix(savedFilters.from_date) : null,
          toDate: savedFilters.to_date ? dayjs.unix(savedFilters.to_date) : null,
        });
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
    };
  }

  useEffect(() => {
    initializeFilters();
  }, [open]);



  const handleApply = () => {
    const filters = handleFilters();
    onApply(filters);
    onClose();
  };

  // Check active filters
  const isDateFilterActive = () => {
    return (
      Object.values(checkedFilters).some(value => value) || // Checking checkboxes for dates
      (dateRange.fromDate && dateRange.toDate) // Validate user's date range selection
    );
  };

  const isTimeFilterActive = () => {
    return (
      Object.values(checkedFiltersTime).some(value => value) || // Checking checkboxes for time
      (timeRange.fromTime && timeRange.toTime) // Validate custom time range selection
    );
  };

  const isNumberOfEmployeesFilterActive = () => {
    return Object.values(checkedFiltersNumberOfEmployees).some(value => value);
  };

  const isTimeSpentFilterActive = () => {
    return Object.values(checkedFiltersTimeSpent).some(value => value);
  };

  // Lead Funnel
  const isLeadFunnelActive = () => {
    return selectedFunnels.length > 0;
  };

  // Status
  const isStatusFilterActive = () => {
    return selectedStatus.length > 0;
  };

  // Recurring Visits
  const isRecurringVisitsFilterActive = () => {
    return selectedValues.length > 0;
  };



  const handleRadioChange = (event: { target: { name: string } }) => {
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
        removeTag("visitedDate", tagMap[previouslySelected]);
      }

      setDateRange({ fromDate: null, toDate: null });

      // Add the tag for the currently selected radio button
      addTag("visitedDate", tagMap[name]);

      return newFilters;
    });
  };

  const handleRadioChangeTime = (event: { target: { name: string } }) => {

    const { name } = event.target;
    deleteTagTime()

    setCheckedFiltersTime((prevFiltersTime) => {
      // Explicitly type `prevFilters` for better TypeScript support
      const prevFiltersTimeTyped = prevFiltersTime as Record<string, boolean>;

      // Find the previously selected radio button
      const previouslySelectedTime = Object.keys(prevFiltersTimeTyped).find((key) => prevFiltersTimeTyped[key]);

      // Reset all filters and select the new one
      const newFiltersTime = {
        morning: false,
        afternoon: false,
        evening: false,
        all_day: false,
        [name]: true,
      };

      const tagMapTime: { [key: string]: string } = {
        morning: "Morning 12AM - 11AM",
        afternoon: "Afternoon 11AM - 5PM",
        evening: "Evening 5PM - 9PM",
        all_day: "All day",
      };

      // Remove the tag for the previously selected radio button, if any
      if (previouslySelectedTime && previouslySelectedTime !== name) {
        removeTag("visitedTime", tagMapTime[previouslySelectedTime]);
      }

      // Add the tag for the currently selected radio button
      addTag("visitedTime", tagMapTime[name]);

      return newFiltersTime;
    });
  };

  const handleClearFilters = () => {
    setSelectedButton(null);
    setIsVisitedDateOpen(false);
    setIsVisitedPageOpen(false);
    setIsTimeSpentOpen(false);
    setIsVisitedTimeOpen(false);
    setIsNumberOfEmployeeOpen(false),
    setIsRegionOpen(false);
    setIsLeadFunnel(false);
    setIsStatus(false);
    setIsRecurringVisits(false);

    setCheckedFiltersNumberOfEmployees({
      "1-10": false,
      "11-20": false,
      "21-50": false,
      "51-100": false,
      "101-200": false,
      "201-500": false,
      "501-1000": false,
      "1001-2000": false,
      "2001-5000": false,
      "5001-10000": false,
      "10001+": false,
      "unknown": false,
    });

    setTimeRange({
      fromTime: null,
      toTime: null,
    });

    setCheckedFiltersTimeSpent({
      under_10: false,
      over_10: false,
      over_30: false,
      over_60: false,
    });

    // Reset date
    setDateRange({
      fromDate: null,
      toDate: null,
    });

    setCheckedFilters({
      lastWeek: false,
      last30Days: false,
      last6Months: false,
      allTime: false,
    });

    // Reset time filters
    setCheckedFiltersTime({
      morning: false,
      evening: false,
      afternoon: false,
      all_day: false,
    });

    setSelectedValues([]);

    // Reset filter values
    setRegions("");
    setSelectedDateRange(null);
    setSelectedTimeRange(null);
    setSelectedTags({
      visitedDate: [],
      visitedTime: [],
      region: [],
      pageVisits: [],
      numberOfEmployees: [],
      timeSpents: [],
    });
    setTags([]);
    setSelectedFunnels([]);
    setSelectedStatus([]);
    setButtonFilters(null);
    setSearchQuery("");

    sessionStorage.removeItem('filters')
  };

  const fetchCities = debounce(async (searchValue: string) => {
    if (searchValue.length >= 3) {
      try {
        const response = await axiosInstance.get('leads/search-location', {
          params: { start_letter: searchValue },
        });
        setCities(response.data);
      } catch {
      }
    } else {
      setCities([]);
    }
  }, 300);


  const handleRegionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRegions(value);
    fetchCities(value);
  };

  const handleSelectCity = (city: { city: string, state: string }) => {
    setTags((prevTags) => [...prevTags, `${city.city}-${city.state}`]);
    setRegions('');
    setCities([]);
  };


  const fetchContacts = debounce(async (query: string) => {
    if (query.length >= 3) {
      try {
        const response = await axiosInstance.get('/leads/search-contact', {
          params: { start_letter: query },
        });
        const formattedContacts = response.data.map((contact: string) => ({ name: contact }));
        setContacts(formattedContacts);
      } catch {
      }
    } else {
      setContacts([]);
    }
  }, 300);

  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchContacts(value);
  };

  const handleSelectContact = (contact: { name: string }) => {
    setSearchQuery(contact.name);
    setContacts([]);
  };

  return (
    <>
      <Backdrop open={open} sx={{ zIndex: 1200, color: "#fff" }} />
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: "40%",
            position: "fixed",
            zIndex: 2602,
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
            top: 0,
            zIndex: 9900,
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
          <Box sx={{ display: 'flex', width: '100%', flexDirection: 'column', pb: 2 }}>
            <TextField
              placeholder="Search company by name or phone"
              variant="outlined"
              fullWidth
              value={searchQuery}
              onChange={handleSearchQueryChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Button
                      disabled={true}
                      sx={{ textTransform: "none", textDecoration: "none", padding: 0, minWidth: 0, height: 'auto', width: 'auto' }}
                    >
                      <SearchIcon
                        sx={{ color: "rgba(101, 101, 101, 1)" }}
                        fontSize="medium"
                      />
                    </Button>
                  </InputAdornment>
                ),
                sx: {
                  fontFamily: 'Roboto',
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  lineHeight: '19.6px',
                  textAlign: 'left',
                  color: 'rgba(112, 112, 113, 1)',
                },
              }}
              sx={{
                padding: "1em 1em 0em 1em",
                '& .MuiInputBase-input::placeholder': {
                  fontFamily: 'Roboto',
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  lineHeight: '19.6px',
                  textAlign: 'left',
                  color: 'rgba(112, 112, 113, 1)',
                },
              }}
            />
            <Box sx={{ paddingLeft: 2, paddingRight: 2, pt: '3px' }}>
              {contacts?.length > 0 && (
                <List sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #ccc', borderRadius: '4px', display: 'flex', flexDirection: 'column', padding: 0 }}>
                  {contacts.map((contact, index) => (
                    <ListItem button key={index} onClick={() => handleSelectContact(contact)} sx={{ pl: 1 }}>
                      <ListItemText
                        primaryTypographyProps={{
                          sx: {
                            fontFamily: 'Nunito Sans',
                            fontSize: '12px',
                            fontWeight: 600,
                            lineHeight: '16.8px',
                            textAlign: 'left',
                          },
                        }}
                        primary={`${contact.name}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>
          {/* Employee visits */}
          <Box
            sx={filterStyles.main_filter_form}
          >
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsVisitedPageOpen(!isVisitedPageOpen)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: selectedPageVisit ? "visible" : "hidden"
                }}
              />
              <Image src="/people.svg" alt="calendar" width={18} height={18} />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                Employee visits
              </Typography>
              {selectedTags.pageVisits.map((tag, index) => (
                <CustomChip
                  key={index}
                  label={tag}
                  onDelete={() => handleDeletePageVisit(tag)}
                />
              ))}
              <IconButton
                onClick={() => setIsVisitedPageOpen(!isVisitedPageOpen)}
                aria-label="toggle-content"
              >
                {isVisitedPageOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isVisitedPageOpen}>
              <Box sx={filterStyles.filter_dropdown}>
                <RadioGroup row value={selectedPageVisit} onChange={handleRadioChangePageVisits}>
                  {[
                    { name: "1", label: "1" },
                    { name: "2", label: "2" },
                    { name: "3", label: "3" },
                    { name: "4", label: "4" },
                    { name: "4+", label: "4+" }
                  ].map(({ name, label }) => (
                    <FormControlLabel
                      key={name}
                      value={name}
                      control={
                        <Radio
                          sx={{
                            '&.Mui-checked': { color: "rgba(80, 82, 178, 1)" }
                          }}
                        />
                      }
                      label={
                        <Typography
                          className='table-data'
                          sx={{
                            color: selectedPageVisit === name ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)"
                          }}
                        >
                          {label}
                        </Typography>
                      }
                    />
                  ))}
                </RadioGroup>
              </Box>
            </Collapse>
          </Box>
          {/* Visited date */}
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
              onClick={() => setIsVisitedDateOpen(!isVisitedDateOpen)}
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
                Visited date
              </Typography>
              {selectedTags.visitedDate.map((tag, index) => (
                <CustomChip
                  key={index}
                  label={tag}
                  onDelete={() => removeTag("visitedDate", tag)}
                />
              ))}
              <IconButton
                onClick={() => setIsVisitedDateOpen(!isVisitedDateOpen)}
                aria-label="toggle-content"
              >
                {isVisitedDateOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isVisitedDateOpen}>
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
                        onChange={handleRadioChange}
                        name="lastWeek"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFilters.lastWeek ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>Last week</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedFilters.last30Days}
                        onChange={handleRadioChange}
                        name="last30Days"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFilters.last30Days ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>Last 30 days</Typography>}
                  />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedFilters.last6Months}
                        onChange={handleRadioChange}
                        name="last6Months"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFilters.last6Months ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>Last 6 months</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedFilters.allTime}
                        onChange={handleRadioChange}
                        name="allTime"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFilters.allTime ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>All time</Typography>}
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
                    value={dateRange.fromDate}
                    onChange={(newValue) => handleDateChange("fromDate")(newValue)}
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
                    value={dateRange.toDate}
                    onChange={(newValue) =>
                      handleDateChange("toDate")(newValue)
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
          {/* Location */}
          <Box
            sx={filterStyles.main_filter_form}
          >
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsRegionOpen(!isRegionOpen)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: regions.length > 0 ? 'visible' : "hidden",
                }}
              />
              <Image
                src="/location.svg"
                alt="calendar"
                width={18}
                height={18}
              />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                Location
              </Typography>
              <Box
                sx={{ display: "flex", flexWrap: "wrap", gap: "8px", mb: 2 }}
              >
                {regions.map((tag, index) => (
                  <CustomChip
                    key={index}
                    label={tag}
                    onDelete={() =>
                      setTags(regions.filter((_, i) => i !== index))
                    }
                  />
                ))}
              </Box>
              <IconButton
                onClick={() => setIsRegionOpen(!isRegionOpen)}
                aria-label="toggle-content"
              >
                {isRegionOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isRegionOpen}>
              <TextField
                placeholder="Search by town, city or state.."
                variant="outlined"
                fullWidth
                value={region}
                onChange={handleRegionChange}
                onKeyDown={handleAddTag}
                InputProps={{
                  sx: {
                    fontFamily: 'Roboto',
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    lineHeight: '19.6px',
                    textAlign: 'left',
                    color: 'rgba(74, 74, 74, 1)',
                  },
                }}
                sx={{
                  mb: '3px',
                  '& .MuiInputBase-input::placeholder': {
                    fontFamily: 'Roboto',
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    lineHeight: '19.6px',
                    textAlign: 'left',
                    color: 'rgba(74, 74, 74, 1)',
                  },
                }}
              />
              {cities.map((city, index) => (
                <ListItem button key={index} onClick={() => handleSelectCity(city)}>
                  <ListItemText
                    primary={
                      <span style={{ fontFamily: 'Nunito Sans', fontSize: '13px', fontWeight: 600, lineHeight: '16.8px', textAlign: 'left', color: 'rgba(74, 74, 74, 1)' }}>
                        {city.city},{' '}
                        <span style={{ color: 'rgba(200, 202, 203, 1)' }}>
                          {city.state}
                        </span>
                      </span>
                    }
                  />
                </ListItem>
              ))}


            </Collapse>
          </Box>
          {/* Number of Employees */}
          <Box sx={filterStyles.main_filter_form}>
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsNumberOfEmployeeOpen(!isNumberOfEmployeeOpen)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isNumberOfEmployeesFilterActive() ? "visible" : "hidden",
                }}
              />
              <Image src="/people.svg" alt="employees" width={18} height={18} />
              <Typography sx={filterStyles.filter_name}>
                Number of employees
              </Typography>
              {selectedTags.numberOfEmployees.map((tag, index) => (
                <CustomChip
                  key={index}
                  label={tag}
                  onDelete={() => removeTag("numberOfEmployees", tag)}
                />
              ))}
              <IconButton
                onClick={() => setIsNumberOfEmployeeOpen(!isNumberOfEmployeeOpen)}
                aria-label="toggle-content"
              >
                {isNumberOfEmployeeOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={isNumberOfEmployeeOpen}>
              <Box sx={filterStyles.filter_dropdown}>
                <Grid container spacing={0}>
                  {[
                    "1-10",
                    "11-20",
                    "21-50",
                    "51-100",
                    "101-200",
                    "201-500",
                    "501-1000",
                    "1001-2000",
                    "2001-5000",
                    "5001-10000",
                    "10001+",
                    "unknown",
                  ].map((range, index) => (
                    <Grid item xs={6} key={range}> {/* xs=3 означает 1/4 ширины контейнера (12 колонок / 4 = 3) */}
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={checkedFiltersNumberOfEmployees[range as keyof typeof checkedFiltersNumberOfEmployees]}
                            onChange={handleCheckboxChangeNumberOfEmployees}
                            name={range}
                            size="small"
                            sx={{
                              "&.Mui-checked": { color: "rgba(80, 82, 178, 1)" },
                            }}
                          />
                        }
                        label={
                          <Typography
                            className="table-data"
                            sx={{
                              color: checkedFiltersNumberOfEmployees[range as keyof typeof checkedFiltersNumberOfEmployees]
                                ? "rgba(80, 82, 178, 1) !important"
                                : "rgba(74, 74, 74, 1)",
                            }}
                          >
                            {range === "unknown" ? "# of employees is unknown" : range}
                          </Typography>
                        }
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Collapse>
          </Box>

          {/* Average time spent */}
          <Box
            sx={filterStyles.main_filter_form}
          >
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsTimeSpentOpen(!isTimeSpentOpen)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isTimeSpentFilterActive() ? "visible" : "hidden"
                }}
              />
              <Image
                src="/sand_clock.svg"
                alt="calendar"
                width={18}
                height={18}
              />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                Average time spent
              </Typography>
              {selectedTags.timeSpents.map((tag, index) => (
                <CustomChip
                  key={index}
                  label={tag}
                  onDelete={() => handleDeleteTimeSpent(tag)}
                />
              ))}
              <IconButton
                onClick={() => setIsTimeSpentOpen(!isTimeSpentOpen)}
                aria-label="toggle-content"
              >
                {isTimeSpentOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isTimeSpentOpen}>
              <Box
                sx={{
                  ...filterStyles.filter_dropdown
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFiltersTimeSpent.under_10}
                        onChange={handleCheckboxChangeTimeSpent}
                        name="under_10"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFiltersTimeSpent.under_10 ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>under 10 secs</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFiltersTimeSpent.over_10}
                        onChange={handleCheckboxChangeTimeSpent}
                        name="over_10"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFiltersTimeSpent.over_10 ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>10-30 secs</Typography>}
                  />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFiltersTimeSpent.over_30}
                        onChange={handleCheckboxChangeTimeSpent}
                        name="over_30"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFiltersTimeSpent.over_30 ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>30-60 secs</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFiltersTimeSpent.over_60}
                        onChange={handleCheckboxChangeTimeSpent}
                        name="over_60"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFiltersTimeSpent.over_60 ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>Over 60 secs</Typography>}
                  />
                </Box>
              </Box>
            </Collapse>
          </Box>
          {/* Recurring Visits */}
          <Box
            sx={{
              width: "100%",
              mb: 15,

              padding: "0.5em",
            }}
          >
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsRecurringVisits(!isRecurringVisits)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isRecurringVisitsFilterActive() ? "visible" : "hidden"
                }}
              />
              <Image
                src="/repeate-one.svg"
                alt="calendar"
                width={18}
                height={18}
              />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                Recurring Visists
              </Typography>
              {selectedValues.length > 0 &&
                selectedValues.map((value) => (
                  <CustomChip
                    key={value}
                    label={value}
                    onDelete={() => handleDeleteRecurringVisit(value)}
                  />
                ))
              }

              <IconButton
                onClick={() => setIsRecurringVisits(!isRecurringVisits)}
                aria-label="toggle-content"
              >
                {isRecurringVisits ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isRecurringVisits}>
              <Box sx={{ display: "flex", justifyContent: "start", gap: 2, pl: 2 }}>
                {["1", "2", "3", "4", "4+"].map((label) => (
                  <FormControlLabel
                    key={label}
                    control={
                      <Checkbox
                        checked={selectedValues.includes(label)}
                        onChange={handleChangeRecurringVisits}
                        value={label}
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: selectedValues.includes(label) ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>{label}</Typography>}
                    sx={{
                      display: "flex",
                      color: "rgba(74, 74, 74, 1)",
                      alignItems: "center",
                      fontFamily: "Nunito Sans",
                      fontWeight: "600",
                      fontSize: "16px",
                      lineHeight: "25.2px",
                    }}
                  />
                ))}
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
                color: "rgba(80, 82, 178, 1) !important",
                backgroundColor: '#fff',
                border: ' 1px solid rgba(80, 82, 178, 1)',
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
                backgroundColor: "rgba(80, 82, 178, 1)",
                color: 'rgba(255, 255, 255, 1) !important',
                textTransform: "none",
                padding: "0.75em 2.5em",
                '&:hover': {
                  backgroundColor: 'rgba(80, 82, 178, 1)'
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
