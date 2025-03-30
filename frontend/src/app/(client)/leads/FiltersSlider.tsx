import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop, TextField, InputAdornment, Collapse, Divider, FormControlLabel, Checkbox, Radio, List, ListItem, ListItemText } from '@mui/material';
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
  const [isTimeSpentOpen, setIsTimeSpentOpen] = useState(false);
  const [isVisitedTimeOpen, setIsVisitedTimeOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isPageUrlOpen, setIsPageUrlOpen] = useState(false);
  const [isLeadFunnel, setIsLeadFunnel] = useState(false);
  const [isStatus, setIsStatus] = useState(false);
  const [isRecurringVisits, setIsRecurringVisits] = useState(false);
  const [region, setRegions] = useState("");
  const [pageUrl, setPageUrls] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(
    null
  );
  const [selectedTimeRange, setSelectedTimeRange] = useState<string | null>(
    null
  );
  const [cities, setCities] = useState<{ city: string, state: string }[]>([]);
  const [pageUrls, setUrls] = useState<{page_url: string}[]>([]);
  const [contacts, setContacts] = useState<{ name: string }[]>([]);
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
  const [regions, setTags] = useState<string[]>([]);
  const [pages, setPageUrlTags] = useState<string[]>([]);
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

  const handleAddPage = (e: { key: string }) => {
    if (e.key === "Enter" && pageUrl.trim()) {
      setPageUrlTags([...pages, pageUrl.trim()]);
      setPageUrls("");
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

      if (category === "pageVisits") {
        const tagMap: { [key: string]: string } = {
          "1 page": "page",
          "2 pages": "two_page",
          "3 pages": "three_page",
          "More than 3 pages": "more_three",
        };

        const filterName = tagMap[tag];
        if (filterName) {
          setCheckedFiltersPageVisits((prevFilters) => ({
            ...prevFilters,
            [filterName]: false,
          }));
        }
      }

      return { ...prevTags, [category]: updatedTags };
    });
  };

  const handleDeletePageVisit = (valueToDelete: string) => {
    setSelectedTags((prevTags) => {
      const updatedTags = prevTags.pageVisits.filter((tag) => tag !== valueToDelete);

      const tagMap: { [key: string]: string } = {
        "1 page": "page",
        "2 pages": "two_page",
        "3 pages": "three_page",
        "More than 3 pages": "more_three",
      };

      const filterName = tagMap[valueToDelete];
      if (filterName) {
        setCheckedFiltersPageVisits((prevFilters) => ({
          ...prevFilters,
          [filterName]: false,
        }));
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

  ////Page
  const [checkedFiltersPageVisits, setCheckedFiltersPageVisits] = useState({
    page: false,
    two_page: false,
    three_page: false,
    more_three: false,
  });

  const handleCheckboxChangePageVisits = (event: {
    target: { name: any; checked: any };
  }) => {
    const { name, checked } = event.target;

    setCheckedFiltersPageVisits((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        [name]: checked,
      };

      const tagMap: { [key: string]: string } = {
        page: "1 page",
        two_page: "2 pages",
        three_page: "3 pages",
        more_three: "More than 3 pages",
      };

      if (checked) {
        addTag("pageVisits", tagMap[name]);
      } else {
        removeTag("pageVisits", tagMap[name]);
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
      from_time: fromTime, // Set start time value
      to_time: toTime, // Set end time value
      selectedFunnels: buttonFilters ? buttonFilters.selectedFunnels : selectedFunnels,
      button: buttonFilters ? buttonFilters.button : selectedButton,
      checkedFiltersTime,     // Filters by time (morning, afternoon, evening, etc.)
      checkedFiltersPageVisits,
      checkedFilters,
      regions,
      checkedFiltersTimeSpent,
      selectedStatus,
      recurringVisits: selectedValues,
      searchQuery,
      pages
    };

    saveFiltersToSessionStorage(filters);

    return filters;
  };


  const saveFiltersToSessionStorage = (filters: {
    from_date: number | null;
    to_date: number | null;
    from_time: string | null;
    to_time: string | null;
    selectedFunnels: string[]; button: string | null;
    checkedFiltersTime: { morning: boolean; evening: boolean; afternoon: boolean; all_day: boolean; };
    checkedFiltersPageVisits: { page: boolean; two_page: boolean; three_page: boolean; more_three: boolean; };
    regions: string[];
    checkedFiltersTimeSpent: { under_10: boolean; over_10: boolean; over_30: boolean; over_60: boolean; };
    selectedStatus: string[]; recurringVisits: string[];
    searchQuery: string; dateRange?: { fromDate: number | null; toDate: number | null; } | undefined;
    pages: string[];
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
      setCheckedFiltersPageVisits(savedFilters.checkedFiltersPageVisits || {
        page: false,
        two_page: false,
        three_page: false,
        more_three: false,
      });

      // Checking active page visit filters
      const isPageVisitsFilterActive = Object.values(savedFilters.checkedFiltersPageVisits || {}).some(value => value === true);

      if (isPageVisitsFilterActive) {
        const pageVisitsTagMap: { [key: string]: string } = {
          page: "1 page",
          two_page: "2 pages",
          three_page: "3 pages",
          more_three: "More than 3 pages",
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
      // if (savedFilters.pageUrls) {
      //   setTags((prevTags) => {
      //     const uniqueTags = new Set(prevTags);
      //     savedFilters.pageUrls.forEach((urlTag: string) => {
      //       uniqueTags.add(urlTag);
      //     });
      //     return Array.from(uniqueTags);
      //   });
      // }
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

  const isPageVisitsFilterActive = () => {
    return Object.values(checkedFiltersPageVisits).some(value => value);
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


  // const handleLoadOpen = () => setOpenLoadDrawer(true);
  // const handleLoadClose = () => setOpenLoadDrawer(false);

  // // Function to determine if filters are selected
  // const updateButtonState = () => {
  //   const filters = handleFilters();
  //   // console.log('Filters:', filters); // For debugging

  //   if (!filters || typeof filters !== 'object' || Object.keys(filters).length === 0) {
  //     setIsButtonDisabled(true);
  //     return;
  //   }

  //   const hasActiveFilters = Object.values(filters).some(value => {
  //     if (Array.isArray(value)) {
  //       return value.length > 0;
  //     } else if (typeof value === 'object' && value !== null) {
  //       return Object.values(value).some(val => {
  //         if (val === null || val === '') return false;
  //         if (Array.isArray(val)) return val.length > 0;
  //         if (typeof val === 'boolean') return val;
  //         return true;
  //       });
  //     } else {
  //       if (typeof value === 'string') return value.trim() !== '';
  //       if (typeof value === 'boolean') return value;
  //       return value !== null;
  //     }
  //   });

  //   setIsButtonDisabled(!hasActiveFilters);
  // };



  // // Call updateButtonState when filter states change
  // useEffect(() => {
  //   updateButtonState();
  // }, [
  //   selectedButton,
  //   isVisitedDateOpen,
  //   isVisitedPageOpen,
  //   isTimeSpentOpen,
  //   isVisitedTimeOpen,
  //   isRegionOpen,
  //   isLeadFunnel,
  //   isStatus,
  //   isRecurringVisits,
  //   email,
  //   region,
  //   selectedDateRange,
  //   selectedTimeRange,
  //   selectedTags,
  //   regions,
  //   emails,
  //   selectedFunnels,
  //   selectedStatus,
  //   buttonFilters,
  //   selectedValues,
  //   searchQuery
  // ]);



  // const handleSave = () => {
  //   try {
  //     const filters = handleFilters();

  //     // console.log('Filter:', filters);

  //     const newFilter = { name: filterName, data: filters };
  //     // console.log('New Filter:', newFilter);

  //     setSavedFilters(prevFilters => {
  //       // console.log('Previous Filters:', prevFilters);
  //       return [...prevFilters, newFilter];
  //     });

  //     setFilterName('');
  //     handleClose(); // Close the modal
  //   } catch (error) {
  //     console.error('Error saving filter:', error);
  //   }
  // };

  const handleClearFilters = () => {
    setSelectedButton(null);
    setIsVisitedDateOpen(false);
    setIsVisitedPageOpen(false);
    setIsTimeSpentOpen(false);
    setIsVisitedTimeOpen(false);
    setIsRegionOpen(false);
    setIsPageUrlOpen(false);
    setIsLeadFunnel(false);
    setIsStatus(false);
    setIsRecurringVisits(false);

    setCheckedFiltersPageVisits({
      page: false,
      two_page: false,
      three_page: false,
      more_three: false,
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
    setPageUrls("");
    setSelectedDateRange(null);
    setSelectedTimeRange(null);
    setSelectedTags({
      visitedDate: [],
      visitedTime: [],
      region: [],
      pageUrl: [],
      pageVisits: [],
      timeSpents: [],
    });
    setTags([]);
    setPageUrlTags([]);
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

  const fetchPages = debounce(async (pageValue: string) => {
    if (pageValue.length >= 3) {
      try {
        const response = await axiosInstance.get('leads/search-page-url', {
          params: { start_letter: pageValue },
        });
        setUrls(response.data);
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

  const handlePageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPageUrls(value);
    fetchPages(value);
  };

  const handleSelectPageUrl = ({ page_url }: { page_url: string }) => {
    setPageUrlTags((prevTags) => [...prevTags, page_url]);
    setPageUrls('');
    setUrls([]);
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
            padding: "0.75em 1em 0.25em 1em",
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
            {/* <Button onClick={handleLoadOpen}>
              <Typography
                sx={{
                  textAlign: "center",
                  color: "rgba(80, 82, 178, 1)",
                  textTransform: "none",
                  fontFamily: "Nunito Sans",
                  fontWeight: "600",
                  fontSize: "16px",
                  lineHeight: "22.4px",
                }}
              >
                Load
              </Typography>
            </Button> */}
            {/* <Drawer
              anchor="right"
              open={openLoadDrawer}
              onClose={handleLoadClose}
              PaperProps={{
                sx: {
                  width: "40%",
                  position: "fixed",
                  zIndex: 1301,
                  top: 0,
                  bottom: 0,
                  "@media (max-width: 600px)": {
                    width: "100%",
                  },
                },
              }}
            > */}
            {/* <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1.5em 1em",
                  borderBottom: "1px solid #e4e4e4",
                }}
              >
                <IconButton onClick={handleLoadClose}>
                  <CloseIcon />
                </IconButton>
                <Typography
                  variant="h6"
                  sx={{
                    textAlign: "center",
                    color: "#4A4A4A",
                    fontFamily: "Nunito Sans",
                    fontWeight: "600",
                    fontSize: "16px",
                    lineHeight: "22.4px",
                  }}
                >
                  Load with saved filters
                </Typography>
              </Box> */}


            {/* {savedFilters.length > 0 ? (
                savedFilters.map((filter, index) => (
                  <Box key={index} sx={{
                    padding: '1.5em', borderBottom: "1px solid #ebebeb", display: "flex",
                    justifyContent: "space-between", alignItems: "center"
                  }}>
                    <Typography variant="h6" sx={{
                      fontFamily: 'Nunito Sans',
                      color: '#3B3B3B',
                      fontSize: '16px',
                      fontWeight: '600',
                      lineHeight: '22.4px'
                    }}>
                      {filter.name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'Nunito Sans' }}>
                    </Typography>
                    <Box sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "22px"
                    }}>
                      <IconButton>
                        <Image
                          src="/edit.svg"
                          height={18} width={18} // Adjust the size as needed
                          alt="edit"
                        />
                      </IconButton>
                      <IconButton>
                        <Image
                          src="/trash.svg"
                          height={18} width={18} // Adjust the size as needed
                          alt="trash"
                        />
                      </IconButton>
                    </Box>
                  </Box>
                ))
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px solid rgba(235, 235, 235, 1)',
                    borderRadius: 2,
                    padding: 3,
                    boxSizing: 'border-box',
                    width: '100%',
                    textAlign: 'center',
                    flex: 1,
                    '& img': {
                      width: 'auto',
                      height: 'auto',
                      maxWidth: '100%',
                    },
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 3,
                      fontFamily: 'Nunito Sans',
                      fontSize: '20px',
                      color: '#4a4a4a',
                      fontWeight: '600',
                      lineHeight: '28px',
                    }}
                  >
                    Data not Found
                  </Typography>
                  <Image
                    src="/pixel_installation_needed.svg"
                    alt="Need Pixel Install"
                    height={250}
                    width={300}
                  />
                </Box>
              )} */}

            {/* </Drawer> */}
            {/* <Typography
              sx={{
                color: "rgba(228, 228, 228, 1)",
                pt: 0.5,
                fontSize: "20px",
                fontWeight: "100",
              }}
            >
              |
            </Typography>
            <Button onClick={handleOpen} disabled={isButtonDisabled}>
              <Typography
                sx={{
                  textAlign: "center",
                  color: isButtonDisabled ? "rgba(80, 82, 178, 0.5)" : "rgba(80, 82, 178, 1)",
                  textTransform: "none",
                  fontFamily: "Nunito Sans",
                  fontWeight: "600",
                  fontSize: "16px",
                  lineHeight: "22.4px",
                }}

              >
                Save
              </Typography>
            </Button> */}
            {/* <Modal
              open={open_save}
              onClose={handleClose}
              aria-labelledby="modal-title"
              aria-describedby="modal-description"
            >
              <Box sx={style}>
                <Typography
                  id="modal-title"
                  variant="h6"
                  component="h2"
                  sx={{
                    textAlign: "center",
                    color: "rgba(59, 59, 59, 1)",
                    fontFamily: "Nunito Sans",
                    fontWeight: "600",
                    fontSize: "14px",
                    lineHeight: "19.6px",
                    pr: 30,
                    textWrap: "nowrap",
                  }}
                >
                  Save the Filter
                </Typography>
                <TextField
                  InputLabelProps={{ sx: { color: "white" } }}
                  placeholder="Enter name"
                  name="filter"
                  type="text"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-end",
                    paddingTop: "1em",
                    maxHeight: "20em",
                  }}
                >
                  <Button
                    onClick={handleClear}
                    variant="outlined"
                    sx={{
                      mr: 2,
                      backgroundColor: "rgba(255, 255, 255, 1)",
                      color: "rgba(80, 82, 178, 1)",
                      textTransform: "none",
                      border: "1px solid rgba(80, 82, 178, 1)",
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "rgba(80, 82, 178, 1)",
                      fontFamily: "Nunito Sans",
                      textTransform: "none",
                    }}
                    disabled={!filterName.trim()}
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                </Box>
              </Box>
            </Modal> */}
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
              placeholder="Search by name, emails, phone"
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
          {/* Status */}
          <Box
            sx={filterStyles.main_filter_form}
          >
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsStatus(!isStatus)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isStatusFilterActive() ? "visible" : "hidden"
                }}
              />
              <Image src="/status.svg" alt="calendar" width={18} height={18} />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                Visitor type
              </Typography>
              {selectedStatus.map((mappedLabel) => {
                const originalLabel = Object.keys(statusMapping).find(
                  (key) => statusMapping[key] === mappedLabel
                ) as keyof typeof statusMapping;
                return (
                  <CustomChip
                    key={mappedLabel}
                    label={originalLabel}
                    onDelete={() => handleButtonStatusClick(originalLabel)}
                  />
                );
              })}
              <IconButton
                onClick={() => setIsStatus(!isStatus)}
                aria-label="toggle-content"
              >
                {isStatus ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isStatus}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, pt: 1, pl: 2, pb: 0.75 }}>
                {["New", "Returning"].map((label) => {
                  const mappedStatus = statusMapping[label];
                  const isSelected = selectedStatus.includes(mappedStatus);

                  return (
                    <Button
                      key={label}
                      onClick={() => handleButtonStatusClick(label)}
                      className='second-sub-title'
                      sx={{
                        width: "calc(25% - 5px)",
                        height: "2em",
                        textTransform: "none",
                        textWrap: 'nowrap',
                        padding: "5px 0px",
                        gap: "10px",
                        textAlign: "center",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: isSelected
                          ? "1px solid rgba(80, 82, 178, 1)"
                          : "1px solid rgba(220, 220, 239, 1)",
                        color: isSelected
                          ? "rgba(80, 82, 178, 1) !important"
                          : "#5F6368 !important",
                        backgroundColor: isSelected
                          ? "rgba(237, 237, 247, 1)"
                          : "rgba(255, 255, 255, 1)",
                        lineHeight: '20px !important'
                      }}
                    >
                      {label}
                    </Button>
                  );
                })}
              </Box>
            </Collapse>

          </Box>
          {/* Lead status */}
          <Box
            sx={filterStyles.main_filter_form}
          >
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsLeadFunnel(!isLeadFunnel)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isLeadFunnelActive() ? "visible" : "hidden"
                }}
              />
              <Image src="/Leads.svg" alt="calendar" width={18} height={18} />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                Lead Status
              </Typography>
              {selectedFunnels.map((label) => (
                <CustomChip
                  key={label}
                  label={label}
                  onDelete={() => handleButtonLeadFunnelClick(label)}
                />
              ))}
              <IconButton
                onClick={() => setIsLeadFunnel(!isLeadFunnel)}
                aria-label="toggle-content"
              >
                {isLeadFunnel ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isLeadFunnel}>
              <Box sx={{ display: "flex", width: '100%', flexWrap: 'wrap', gap: 1, pt: 1, pl: 2, pb: 0.75 }}>
                {[
                  "Abandoned cart",
                  "View Product",
                  "Converted sales",
                  "Visitor",
                ].map((label) => {
                  const isSelected = selectedFunnels.includes(label);
                  return (
                    <Button
                      key={label}
                      className='second-sub-title'
                      onClick={() => handleButtonLeadFunnelClick(label)}
                      sx={{
                        width: "calc(25% - 8px)",
                        height: "2em",
                        textTransform: "none",
                        gap: "0px",
                        padding: '1em 2em',
                        textWrap: "nowrap",
                        textAlign: "center",
                        borderRadius: "4px",
                        fontFamily: "Nunito Sans",
                        opacity: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: isSelected
                          ? "1px solid rgba(80, 82, 178, 1)"
                          : "1px solid rgba(220, 220, 239, 1)",
                        color: isSelected
                          ? "rgba(80, 82, 178, 1) !important"
                          : "#5F6368 !important",
                        backgroundColor: isSelected
                          ? "rgba(237, 237, 247, 1)"
                          : "rgba(255, 255, 255, 1)",
                        lineHeight: '20px !important',
                        "@media (max-width: 1250px)": {
                          whiteSpace: "normal",
                          flexDirection: "column",
                          height: "3em",
                        },
                        "@media (max-width: 1080px)": {
                          width: "48%",
                          whiteSpace: "nowrap",
                          height: "2em",
                        },
                        '@media (max-width:700px)': {
                          whiteSpace: "normal",
                          height: "3em",
                        },
                        '@media (max-width:600px)': {
                          whiteSpace: "nowrap",
                          height: "2em",
                        }
                      }}
                    >
                      {label}
                    </Button>
                  );
                })}
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
          {/* Visited time */}
          <Box
            sx={filterStyles.main_filter_form}
          >
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsVisitedTimeOpen(!isVisitedTimeOpen)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isTimeFilterActive() ? "visible" : "hidden"
                }}
              />
              <Image src="/timer.svg" alt="timer" width={18} height={18} />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                Visited time
              </Typography>
              {selectedTags.visitedTime.map((tag, index) => (
                <CustomChip
                  key={index}
                  label={tag}
                  onDelete={() => removeTag("visitedTime", tag)}
                />
              ))}
              {selectedTimeRange && (
                <CustomChip
                  label={selectedTimeRange}
                  onDelete={() => deleteTagTime()}
                />
              )}
              <IconButton
                onClick={() => setIsVisitedTimeOpen(!isVisitedTimeOpen)}
                aria-label="toggle-content"
              >
                {isVisitedTimeOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isVisitedTimeOpen}>
              <Box
                sx={{
                  ...filterStyles.filter_dropdown
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedFiltersTime.morning}
                        onChange={handleRadioChangeTime}
                        name="morning"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ ...filterStyles.collapse_font, color: checkedFiltersTime.morning ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>Morning 12AM - 11AM</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedFiltersTime.evening}
                        onChange={handleRadioChangeTime}
                        name="evening"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ ...filterStyles.collapse_font, color: checkedFiltersTime.evening ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>Evening 5PM - 9PM</Typography>}
                  />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedFiltersTime.afternoon}
                        onChange={handleRadioChangeTime}
                        name="afternoon"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ ...filterStyles.collapse_font, color: checkedFiltersTime.afternoon ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>Afternoon 11AM - 5PM</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedFiltersTime.all_day}
                        onChange={handleRadioChangeTime}
                        name="all_day"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ ...filterStyles.collapse_font, color: checkedFiltersTime.all_day ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>All day</Typography>}
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
                  <TimePicker
                    label="From time"
                    value={timeRange.fromTime}
                    onChange={handleTimeChange("fromTime")}
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
                  <TimePicker
                    label="To time"
                    value={timeRange.toTime}
                    onChange={handleTimeChange("toTime")}
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
          {/* Page url */}
          <Box
            sx={filterStyles.main_filter_form}
          >
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsPageUrlOpen(!isPageUrlOpen)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: pageUrl.length > 0 ? 'visible' : "hidden",
                }}
              />
              <Image
                src="/url.svg"
                alt="url"
                width={18}
                height={18}
              />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                Page url
              </Typography>
              <Box
                sx={{ display: "flex", flexWrap: "wrap", gap: "8px", mb: 2 }}
              >
                {pages.map((tag, index) => (
                  <CustomChip
                    key={index}
                    label={tag}
                    onDelete={() =>
                      setTags(pages.filter((_, i) => i !== index))
                    }
                  />
                ))}
              </Box>
              <IconButton
                onClick={() => setIsPageUrlOpen(!isPageUrlOpen)}
                aria-label="toggle-content"
              >
                {isPageUrlOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isPageUrlOpen}>
              <TextField
                placeholder="Search by page url.."
                variant="outlined"
                fullWidth
                value={pageUrl}
                onChange={handlePageUrlChange}
                onKeyDown={handleAddPage}
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
              {pageUrls.map((data, index) => (
                <ListItem button key={index} onClick={() => handleSelectPageUrl(data)}>
                  <ListItemText
                    primary={
                      <span style={{ fontFamily: 'Nunito Sans', fontSize: '13px', fontWeight: 600, lineHeight: '16.8px', textAlign: 'left', color: 'rgba(74, 74, 74, 1)' }}>
                        {data.page_url}
                      </span>
                    }
                  />
                </ListItem>
              ))}
            </Collapse>
          </Box>
          {/* Page visits */}
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
                  visibility: isPageVisitsFilterActive() ? "visible" : "hidden"
                }}
              />
              <Image src="/people.svg" alt="calendar" width={18} height={18} />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                Page visits
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
              <Box
                sx={{
                  ...filterStyles.filter_dropdown
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <FormControlLabel sx={{ fontFamily: 'Nunito Sans', fontWeight: 100 }}
                    control={
                      <Checkbox
                        checked={checkedFiltersPageVisits.page}
                        onChange={handleCheckboxChangePageVisits}
                        size='small'
                        name="page"
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFiltersPageVisits.page ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>1 page</Typography>}
                  />
                  <FormControlLabel sx={{ fontFamily: 'Nunito Sans', fontWeight: 100 }}
                    control={
                      <Checkbox
                        checked={checkedFiltersPageVisits.two_page}
                        onChange={handleCheckboxChangePageVisits}
                        size='small'
                        name="two_page"
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFiltersPageVisits.two_page ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>2 pages</Typography>}
                  />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <FormControlLabel sx={{ fontFamily: 'Nunito Sans', fontWeight: 100 }}
                    control={
                      <Checkbox
                        checked={checkedFiltersPageVisits.three_page}
                        onChange={handleCheckboxChangePageVisits}
                        size='small'
                        name="three_page"
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFiltersPageVisits.three_page ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>3 pages</Typography>}
                  />
                  <FormControlLabel sx={{ fontFamily: 'Nunito Sans', fontWeight: 100 }}
                    control={
                      <Checkbox
                        checked={checkedFiltersPageVisits.more_three}
                        onChange={handleCheckboxChangePageVisits}
                        size='small'
                        name="more_three"
                        sx={{
                          '&.Mui-checked': {
                            color: "rgba(80, 82, 178, 1)",
                          },
                        }}
                      />
                    }
                    label={<Typography className='table-data' sx={{ color: checkedFiltersPageVisits.more_three ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>More than 3 pages</Typography>}
                  />
                </Box>
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
