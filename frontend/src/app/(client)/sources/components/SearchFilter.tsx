import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop, TextField, InputAdornment, Collapse, Divider, FormControlLabel, Checkbox, Radio, List, ListItem, ListItemText, FormGroup } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import WebIcon from '@mui/icons-material/Web';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import Image from 'next/image';
import { filterStyles } from '@/css/filterSlider';
import debounce from 'lodash/debounce';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import DnsIcon from '@mui/icons-material/Dns';
import { margin } from '@mui/system';

const mockDomains = [
  "example.com",
  "testsite.io",
  "myblog.net",
  "shoponline.store",
];

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
  const [isLeadFunnel, setIsLeadFunnel] = useState(false);
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
      timeSpents: [],
    }
  );
  const [regions, setTags] = useState<string[]>([]);
  const [selectedFunnels, setSelectedFunnels] = useState<string[]>([]);
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

  // Source
  const [isStatus, setIsStatus] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const handleButtonStatusClick = (label: string) => {
    const mappedStatus = statusMapping[label];
    setSelectedStatus((prev) =>
      prev.includes(mappedStatus)
        ? prev.filter((item) => item !== mappedStatus)
        : [...prev, mappedStatus]
    );
  };
  const isStatusFilterActive = () => selectedStatus.length > 0;
  const statusMapping: Record<string, string> = {
    "CSV": "CSV",
    "Pixel": "Pixel"
  };

  // Selected Type
    const [isLeadFunnelOpen, setIsLeadFunnelOpen] = useState<boolean>(false);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [isFieldOpen, setIsFieldOpen] = useState<boolean>(false);
    const handleRemoveLabel = (label: string) => {
    setSelectedTypes((prevSelected) =>
        prevSelected.filter((item) => item !== label)
    );
    };
    const handleCheckboxChange = (label: string) => {
    setSelectedTypes((prevSelected) =>
        prevSelected.includes(label)
        ? prevSelected.filter((item) => item !== label)
        : [...prevSelected, label]
    );
    };
    const isTypesFilterActive = () => selectedTypes.length > 0;

    // Domain
    const [isDomainFilterOpen, setIsDomainFilterOpen] = useState<boolean>(false);
    const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
    const [isFieldDomainOpen, setIsFieldDomainOpen] = useState<boolean>(false);

    const handleRemoveDomain = (domain: string) => {
    setSelectedDomains((prevDomains) =>
        prevDomains.filter((item) => item !== domain)
    );
    };

    const handleDomainCheckboxChange = (domain: string) => {
      setSelectedDomains((prevDomains) =>
        prevDomains.includes(domain)
          ? prevDomains.filter((item) => item !== domain)
          : [...prevDomains, domain]
      );
    };

    const isDomainActive = () => selectedDomains.length > 0;

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
          "Today": "today",
          "Last 7 days": "last7Days",
          "Last 30 days": "last30Days",
          "Last 6 months": "last6Monts",
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
        "Today": "today",
        "Last 7 days": "last7Days",
        "Last 30 days": "last30Days",
        "Last 6 months": "last6Monts",
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
    today: false,
    last7Days: false,
    last30Days: false,
    last6Months: false,
  });


  const handleDateChange = (name: string) => (newValue: any) => {
    setDateRange((prevRange) => {
      const updatedRange = {
        ...prevRange,
        [name]: newValue,
      };

      setCheckedFilters({
        today: false,
        last7Days: false,
        last30Days: false,
        last6Months: false,
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
      today: {
        from: today.startOf("day").unix(),
        to: today.endOf("day").unix(),
      },
      last7Days: {
        from: today.subtract(7, "day").startOf("day").unix(),
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
    };
  };
  

  const handleFilters = () => {
    const filterDates = getFilterDates(); // Function to get date ranges like today, last7Days, etc.

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
      if (checkedFilters.today) {
        fromDateTime = filterDates.today.from;
        toDateTime = filterDates.today.to;
      } else if (checkedFilters.last7Days) {
        fromDateTime = filterDates.last7Days.from;
        toDateTime = filterDates.last7Days.to;
      } else if (checkedFilters.last30Days) {
        fromDateTime = filterDates.last30Days.from;
        toDateTime = filterDates.last30Days.to;
      } else if (checkedFilters.last6Months) {
        fromDateTime = filterDates.last6Months.from;
        toDateTime = filterDates.last6Months.to;
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
        today: false,
        last7Days: false,
        last30Days: false,
        last6Monts: false,
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
          today: "Today",
          last7Days: "Last 7 days",
          last30Days: "Last 30 days",
          last6Monts: "Last 6 months",
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

  const isPageVisitsFilterActive = () => {
    return Object.values(checkedFiltersPageVisits).some(value => value);
  };

  const isTimeSpentFilterActive = () => {
    return Object.values(checkedFiltersTimeSpent).some(value => value);
  };


  const isLeadFunnelActive = () => {
    return selectedFunnels.length > 0;
  };

  const isRecurringVisitsFilterActive = () => {
    return selectedValues.length > 0;
  };



  const handleRadioChange = (event: { target: { name: string } }) => {
    const { name } = event.target;

    setCheckedFilters((prevFilters) => {
      const prevFiltersTyped = prevFilters as Record<string, boolean>;

      const previouslySelected = Object.keys(prevFiltersTyped).find((key) => prevFiltersTyped[key]);

      const newFilters = {
        today: false,
        last7Days: false,
        last30Days: false,
        last6Months: false,
        [name]: true,
      };

      const tagMap: { [key: string]: string } = {
        today: "Today",
        last7Days: "Last 7 days",
        last30Days: "Last 30 days",
        last6Months: "Last 6 months",
      };

      if (previouslySelected && previouslySelected !== name) {
        removeTag("visitedDate", tagMap[previouslySelected]);
      }

      setDateRange({ fromDate: null, toDate: null });

      addTag("visitedDate", tagMap[name]);

      return newFilters; // Теперь возвращается объект с правильными ключами
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
    setIsRegionOpen(false);
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
      today: false,
      last7Days: false,
      last30Days: false,
      last6Months: false,
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

  const isDomainFilterActive = () => selectedDomains.length > 0;


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
              placeholder="Search by name or creator"
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
          {/* Source */}
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
              <AllInboxIcon sx={{ fontSize: 20}} />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                Source
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
              <IconButton onClick={() => setIsStatus(!isStatus)} aria-label="toggle-content">
                {isStatus ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>
            
            <Collapse in={isStatus}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, pt: 1, pl: 2, pb:0.75 }}>
                {["CSV", "Pixel"].map((label) => {
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
          {/* Type */}
          <Box sx={filterStyles.main_filter_form}>
      <Box
        sx={filterStyles.filter_form}
        onClick={() => setIsLeadFunnelOpen(!isLeadFunnelOpen)}
      >
        <Box
            sx={{
                ...filterStyles.active_filter_dote,
                visibility: isTypesFilterActive() ? "visible" : "hidden"
            }}
        />
        <DnsIcon sx={{ fontSize: 20}} />
        <Typography sx={filterStyles.filter_name}>Select Type</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, pt: 1 }}>
          {selectedTypes.map((label) => (
            <CustomChip key={label} label={label} onDelete={() => handleRemoveLabel(label)} />
          ))}
        </Box>
        <IconButton onClick={() => setIsLeadFunnelOpen(!isLeadFunnelOpen)} aria-label="toggle-content">
          {isLeadFunnelOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={isLeadFunnelOpen}>
          <Box sx={{ pt: 1, pl: 2 }} onClick={() => setIsFieldOpen(!isFieldOpen)}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid rgba(220, 220, 239, 1)",
              borderRadius: "4px",
              padding: "5px 10px",
              cursor: "pointer",
              backgroundColor: "#fff",
            }}
            onClick={() => setIsFieldOpen(!isFieldOpen)}
          >
            <Typography
              sx={{
                fontFamily: "Nunito Sans",
                color: selectedDomains.length ? "rgba(220, 220, 239, 1)" : "#5F6368",
              }}
            >
              {selectedTypes.length > 0 ? selectedTypes.join(", ") : "Select Type"}
            </Typography>
            <IconButton size="small">
                {isFieldOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          </Box>
      <Collapse in={isFieldOpen}>
        <Box sx={{pt: "2px", pl: 2 }}>
          <FormGroup sx={{
              border: "1px solid rgba(220, 220, 239, 1)",
              borderRadius: "4px",
              pl: 2
            }}>
            {["Customer Conversions", "Intent", "Visitor", "View Product"].map((label) => (
              <FormControlLabel
                sx={{ fontFamily: 'Nunito Sans', fontWeight: 100 }}
                key={label}
                control={
                  <Checkbox
                    checked={selectedTypes.includes(label)}
                    onChange={() => handleCheckboxChange(label)}
                    size="small"
                    sx={{
                      '&.Mui-checked': {
                        color: "rgba(80, 82, 178, 1)",
                      },
                    }}
                  />
                }
                label={
                  <Typography
                    className="table-data"
                    sx={{
                      color: selectedTypes.includes(label)
                        ? "rgba(80, 82, 178, 1) !important"
                        : "rgba(74, 74, 74, 1)",
                    }}
                  >
                    {label}
                  </Typography>
                }
              />
            ))}
          </FormGroup>
        </Box>

        
      </Collapse>
      </Collapse>  
    </Box>
    {/* Domain */}
    <Box
            sx={filterStyles.main_filter_form}
          >
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsDomainFilterOpen(!isDomainFilterOpen)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isDomainActive() ? "visible" : "hidden"
                }}
              />
        <WebIcon sx={{ fontSize: 20 }} />
        <Typography sx={filterStyles.filter_name}>Select Domain</Typography>
        
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, pt: 1 }}>
          {selectedDomains.map((domain) => (
            <CustomChip key={domain} label={domain} onDelete={() => handleRemoveDomain(domain)} />
          ))}
        </Box>

        <IconButton onClick={() => setIsDomainFilterOpen(!isDomainFilterOpen)} aria-label="toggle-content">
            {isDomainFilterOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Выпадающий список */}
      <Collapse in={isDomainFilterOpen}>
        <Box sx={{ pt: 1, pl: 2 }} onClick={() => setIsFieldDomainOpen(!isFieldDomainOpen)}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid rgba(220, 220, 239, 1)",
              borderRadius: "4px",
              padding: "5px 10px",
              cursor: "pointer",
              backgroundColor: "#fff",
            }}
            onClick={() => setIsFieldDomainOpen(!isFieldDomainOpen)}
          >
            <Typography
              sx={{
                fontFamily: "Nunito Sans",
                color: selectedDomains.length ? "rgba(220, 220, 239, 1)" : "#5F6368",
              }}
            >
              { isDomainFilterActive() ? selectedDomains.join(", ") : "Select Domain"}
            </Typography>
            <IconButton size="small">
              {isFieldDomainOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={isFieldDomainOpen}>
          <Box sx={{ pt: "2px", pl: 2 }}>
            <FormGroup sx={{ border: "1px solid rgba(220, 220, 239, 1)", borderRadius: "4px", pl: 2 }}>
              {mockDomains.map((domain) => (
                <FormControlLabel
                  sx={{ fontFamily: "Nunito Sans", fontWeight: 100 }}
                  key={domain}
                  control={
                    <Checkbox
                      checked={selectedDomains.includes(domain)}
                      onChange={() => handleDomainCheckboxChange(domain)}
                      size="small"
                      sx={{ "&.Mui-checked": { color: "rgba(80, 82, 178, 1)" } }}
                    />
                  }
                  label={
                    <Typography
                      className="table-data"
                      sx={{
                        color: selectedDomains.includes(domain)
                          ? "rgba(80, 82, 178, 1) !important"
                          : "rgba(74, 74, 74, 1)",
                      }}
                    >
                      {domain}
                    </Typography>
                  }
                />
              ))}
            </FormGroup>
          </Box>
        </Collapse>
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
                Created date
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
      checked={checkedFilters.today}
      onChange={handleRadioChange}
      name="today"
      size="small"
      sx={{
        '&.Mui-checked': {
          color: "rgba(80, 82, 178, 1)",
        },
      }}
    />
  }
  label={<Typography className="table-data" sx={{ color: checkedFilters.today ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>Today</Typography>}
/>

<FormControlLabel
  control={
    <Radio
      checked={checkedFilters.last7Days}
      onChange={handleRadioChange}
      name="last7Days"
      size="small"
      sx={{
        '&.Mui-checked': {
          color: "rgba(80, 82, 178, 1)",
        },
      }}
    />
  }
  label={<Typography className="table-data" sx={{ color: checkedFilters.last7Days ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>Last 7 days</Typography>}
/>

<FormControlLabel
  control={
    <Radio
      checked={checkedFilters.last30Days}
      onChange={handleRadioChange}
      name="last30Days"
      size="small"
      sx={{
        '&.Mui-checked': {
          color: "rgba(80, 82, 178, 1)",
        },
      }}
    />
  }
  label={<Typography className="table-data" sx={{ color: checkedFilters.last30Days ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>Last 30 days</Typography>}
/>

<FormControlLabel
  control={
    <Radio
      checked={checkedFilters.last6Months}
      onChange={handleRadioChange}
      name="last6Months"
      size="small"
      sx={{
        '&.Mui-checked': {
          color: "rgba(80, 82, 178, 1)",
        },
      }}
    />
  }
  label={<Typography className="table-data" sx={{ color: checkedFilters.last6Months ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>Last 6 months</Typography>}
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