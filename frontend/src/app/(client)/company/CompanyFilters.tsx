import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop, TextField, InputAdornment, Collapse, Divider, FormControlLabel, Checkbox, Radio, List, ListItem, ListItemText, RadioGroup, Grid, InputLabel, FormControl, MenuItem, Select } from '@mui/material';
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
  industry: string[];
}

const CompanyFilterPopup: React.FC<FilterPopupProps> = ({ open, onClose, onApply, industry }) => {
  const [isVisitedDateOpen, setIsVisitedDateOpen] = useState(false);
  const [isVisitedPageOpen, setIsVisitedPageOpen] = useState(false);
  const [isNumberOfEmployeeOpen, setIsNumberOfEmployeeOpen] = useState(false);
  const [isRevenueOpen, setIsRevenueOpen] = useState(false);
  const [isIndustryOpen, setIsIndustryOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [region, setRegions] = useState("");
  const [cities, setCities] = useState<{ city: string, state: string }[]>([]);
  const [contacts, setContacts] = useState<{ name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: string[] }>(
    {
      visitedDate: [],
      region: [],
      pageVisits: [],
      numberOfEmployees: [],
      revenue: [],
    }
  );
  const [regions, setTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openSelect, setOpenSelect] = useState(false);
  // const [open_save, setOpen] = useState(false);
  // const [openLoadDrawer, setOpenLoadDrawer] = useState(false);
  // const [filterName, setFilterName] = useState("");
  // const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  // type SavedFilter = {
  //   name: string;
  //   data: ReturnType<typeof handleFilters>; // Use the return type of handleFilters directly
  // };

  // const handleOpen = () => setOpen(true);
  // const handleClose = () => setOpen(false);

  const handleAddTag = (e: { key: string }) => {
    if (e.key === "Enter" && region.trim()) {
      setTags([...regions, region.trim()]);
      setRegions("");
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

  const removeTag = (category: string, tag: string) => {
    setSelectedTags((prevTags) => {
      const updatedTags = prevTags[category].filter((t) => t !== tag);

      const isLastTagRemoved = updatedTags.length === 0;

      // If the last tag and category "visitedDate" are deleted, clear the state
      if (category === "visitedDate" && isLastTagRemoved) {
        setDateRange({ fromDate: null, toDate: null });
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

      if (category === "numberOfEmployees") {
        setCheckedFiltersNumberOfEmployees((prevFilters: any) => ({
          ...prevFilters,
          [tag]: false,
        }));
      }

      if (category === "revenue") {
        setCheckedFiltersRevenue((prevFilters: any) => ({
          ...prevFilters,
          [tag]: false,
        }));
      }

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
        } else if (newTag && oldFromDate && oldToDate) {
          removeTag("visitedDate", `From ${oldFromDate} to ${oldToDate}`);
        }

        return updatedTags;
      });

      return updatedRange;
    });
  };

  // Industry
  const [checkedFiltersIndustries, setCheckedFiltersIndustries] = useState<Record<string, boolean>>({});

  const handleClose = () => {
    setOpenSelect(false);
  };

  const handleOpen = () => {
    setOpenSelect(true);
  };

  const handleIndustryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;

    setCheckedFiltersIndustries((prev) => ({
      ...prev,
      [value]: checked
    }));
  };


  const handleMenuItemClick = (item: string) => {
    setCheckedFiltersIndustries((prevState) => ({
      ...prevState,
      [item]: !prevState[item],
    }));

    handleIndustryChange({
      target: { value: item, checked: !checkedFiltersIndustries[item] },
    } as React.ChangeEvent<HTMLInputElement>);
  };


  // Revenue

  const [checkedFiltersRevenue, setCheckedFiltersRevenue] = useState({
    "Below 10k": false,
    "$10k - $50k": false,
    "$50k - $100k": false,
    "$100k - $500k": false,
    "$500k - $1M": false,
    "$1M - $5M": false,
    "$5M - $10M": false,
    "$10M - $50M": false,
    "$50M - $100M": false,
    "$100M - $500M": false,
    "$500M - $1B": false,
    "$1 Billion +": false,
    "unknown": false,
  });

  const handleCheckboxChangeRevenue = (event: { target: { name: string; checked: boolean } }) => {
    const { name, checked } = event.target;

    setCheckedFiltersRevenue((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        [name]: checked,
      };

      if (checked) {
        addTag("revenue", name);
      } else {
        removeTag("revenue", name);
      }

      return newFilters;
    });
  };



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


  // Employee Visits
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
      from_date: fromDateTime, // Set value from_date
      to_date: toDateTime, // Set value of to_date
      selectedPageVisit: selectedPageVisit ? selectedPageVisit : '',
      checkedFiltersNumberOfEmployees,
      checkedFiltersRevenue,
      industry: checkedFiltersIndustries,
      checkedFilters,
      regions,
      searchQuery,
    };

    saveFiltersToSessionStorage(filters);


    return filters;
  };


  const saveFiltersToSessionStorage = (filters: {
    from_date: number | null;
    to_date: number | null;
    checkedFiltersRevenue: {
      "Below 10k": boolean,
      "$10k - $50k": boolean,
      "$50k - $100k": boolean,
      "$100k - $500k": boolean,
      "$500k - $1M": boolean,
      "$1M - $5M": boolean,
      "$5M - $10M": boolean,
      "$10M - $50M": boolean,
      "$50M - $100M": boolean,
      "$100M - $500M": boolean,
      "$500M - $1B": boolean,
      "$1 Billion +": boolean,
      "unknown": boolean,
    };
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
    industry: typeof checkedFiltersIndustries,
    selectedPageVisit: string,
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

      setCheckedFiltersIndustries(savedFilters.industry || {})


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
      const isNumberOfEmployeesFilterActive = Object.values(savedFilters.checkedFiltersNumberOfEmployees || {}).some(value => value === true);

      if (isNumberOfEmployeesFilterActive) {
        const NumberOfEmployeesTagMap: { [key: string]: string } = {
          "1-10": "1-10",
          "11-20": "11-20",
          "21-50": "21-50",
          "51-100": "51-100",
          "101-200": "101-200",
          "201-500": "201-500",
          "501-1000": "501-1000",
          "1001-2000": "1001-2000",
          "2001-5000": "2001-5000",
          "5001-10000": "5001-10000",
          "10001+": "10001+",
          "unknown": "unknown",
        };

        // Go through all filters and add a tag for each active one
        Object.keys(savedFilters.checkedFiltersNumberOfEmployees).forEach((key) => {
          if (savedFilters.checkedFiltersNumberOfEmployees[key]) {
            addTag("numberOfEmployees", NumberOfEmployeesTagMap[key]);
          }
        });
      }



      const savedPageVisit = savedFilters.selectedPageVisit || "";

      if (savedPageVisit) {
        addTag("pageVisits", savedPageVisit); // Добавляем тег
        setSelectedPageVisit(savedPageVisit); // Устанавливаем радиокнопку
      } else {
        setSelectedPageVisit(""); // Сбрасываем выбор, если фильтр не активен
      }


      setCheckedFiltersRevenue(savedFilters.checkedFiltersRevenue || {
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
      const isRevenueFilterActive = Object.values(savedFilters.checkedFiltersRevenue || {}).some(value => value === true);

      if (isRevenueFilterActive) {
        const pageVisitsTagMap: { [key: string]: string } = {
          "Below 10k": "Below 10k",
          "$10k - $50k": "$10k - $50k",
          "$50k - $100k": "$50k - $100k",
          "$100k - $500k":  "$100k - $500k",
          "$500k - $1M": "$500k - $1M",
          "$1M - $5M": "$1M - $5M",
          "$5M - $10M": "$5M - $10M",
          "$10M - $50M": "$10M - $50M",
          "$50M - $100M": "$50M - $100M",
          "$100M - $500M": "$100M - $500M",
          "$500M - $1B": "$500M - $1B",
          "$1 Billion +": "$1 Billion +",
          "unknown": "unknown",
        };

        // Go through all filters and add a tag for each active one
        Object.keys(savedFilters.checkedFiltersRevenue).forEach((key) => {
          if (savedFilters.checkedFiltersRevenue[key]) {
            addTag("revenue", pageVisitsTagMap[key]);
          }
        });
      }

      setCheckedFilters(savedFilters.checkedFilters || {
        lastWeek: false,
        last30Days: false,
        last6Months: false,
        allTime: false,
      });


      setSearchQuery(savedFilters.searchQuery || '');



      const isAnyFilterActive = Object.values(savedFilters.checkedFilters || {}).some(value => value === true);
      if (isAnyFilterActive) {
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
    if (open) {
      if (industry) {
        const initialState = industry.reduce((acc, item) => {
          acc[item] = false;
          return acc;
        }, {} as Record<string, boolean>);
        setCheckedFiltersIndustries(initialState);
      }
      initializeFilters();
    }
  }, [open, industry]);




  const handleApply = () => {
    const filters = handleFilters();
    console.log(checkedFiltersIndustries)
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

  const isNumberOfEmployeesFilterActive = () => {
    return Object.values(checkedFiltersNumberOfEmployees).some(value => value);
  };

  const isRevenueFilterActive = () => {
    return Object.values(checkedFiltersRevenue).some(value => value);
  };

  const isIndustryFilterActive = () => {
    return Object.values(checkedFiltersIndustries).some(value => value);
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

  const handleClearFilters = () => {
    setIsVisitedDateOpen(false);
    setIsVisitedPageOpen(false);
    setIsNumberOfEmployeeOpen(false),
    setIsRegionOpen(false);
    setIsRevenueOpen(false)
    setIsIndustryOpen(false);
    setCheckedFiltersIndustries({})
    setSelectedPageVisit('')

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

    setCheckedFiltersRevenue({
      "Below 10k": false,
      "$10k - $50k": false,
      "$50k - $100k": false,
      "$100k - $500k": false,
      "$500k - $1M": false,
      "$1M - $5M": false,
      "$5M - $10M": false,
      "$10M - $50M": false,
      "$50M - $100M": false,
      "$100M - $500M": false,
      "$500M - $1B": false,
      "$1 Billion +": false,
      "unknown": false,
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



    // Reset filter values
    setRegions("");
    setSelectedTags({
      visitedDate: [],
      region: [],
      pageVisits: [],
      numberOfEmployees: [],
      revenue: [],
    });
    setTags([]);
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
              <Image src="/employee-visit.svg" alt="calendar" width={18} height={16} />
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
          {/* Revenue */}
          <Box sx={filterStyles.main_filter_form}>
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsRevenueOpen(!isRevenueOpen)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isRevenueFilterActive() ? "visible" : "hidden",
                }}
              />
              <Image src="/revenue-filter.svg" alt="revenue" width={18} height={18} />
              <Typography sx={filterStyles.filter_name}>
                Revenue
              </Typography>
              {selectedTags.revenue.map((tag, index) => (
                <CustomChip
                  key={index}
                  label={tag}
                  onDelete={() => removeTag("revenue", tag)}
                />
              ))}
              <IconButton
                onClick={() => setIsRevenueOpen(!isRevenueOpen)}
                aria-label="toggle-content"
              >
                {isRevenueOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={isRevenueOpen}>
              <Box sx={filterStyles.filter_dropdown}>
                <Grid container spacing={0}>
                  {[
                    "Below 10k",
                    "$10k - $50k",
                    "$50k - $100k",
                    "$100k - $500k",
                    "$500k - $1M",
                    "$1M - $5M",
                    "$5M - $10M",
                    "$10M - $50M",
                    "$50M - $100M",
                    "$100M - $500M",
                    "$500M - $1B",
                    "$1 Billion +",
                    "unknown"
                  ].map((range, index) => (
                    <Grid item xs={6} key={range}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={checkedFiltersRevenue[range as keyof typeof checkedFiltersRevenue]}
                            onChange={handleCheckboxChangeRevenue}
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
                              color: checkedFiltersRevenue[range as keyof typeof checkedFiltersRevenue]
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

          {/* Industry */}
          <Box sx={filterStyles.main_filter_form}>
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsIndustryOpen(!isIndustryOpen)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isIndustryFilterActive() ? "visible" : "hidden",
                }}
              />
              <Image src="/industry-icon.svg" alt="industry" width={18} height={18} />
              <Typography sx={filterStyles.filter_name}>
                Industry
              </Typography>
              <IconButton
                onClick={() => setIsIndustryOpen(!isIndustryOpen)}
                aria-label="toggle-content"
              >
                {isIndustryOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>

            </Box>
            {Object.keys(checkedFiltersIndustries).some((key) => checkedFiltersIndustries[key]) && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1, mb: 2 }}>
                {Object.keys(checkedFiltersIndustries)
                  .filter((key) => checkedFiltersIndustries[key])
                  .map((tag, index) => (
                    <CustomChip
                      key={index}
                      label={tag}
                      onDelete={() => handleMenuItemClick(tag)}
                    />
                  ))}
              </Box>
            )}


            <Collapse in={isIndustryOpen}>
              <Box sx={{ ...filterStyles.filter_dropdown, height: openSelect ? 250 : 50 }}>
                {industry && industry.length > 0 ? (
                  <FormControl fullWidth>
                    <Select
                      labelId="industry-select-label"
                      id="industry-select"
                      multiple
                      open={openSelect}
                      onClose={handleClose}
                      onOpen={handleOpen}
                      value={Object.keys(checkedFiltersIndustries).filter(
                        (key) => checkedFiltersIndustries[key]
                      )}
                      displayEmpty
                      sx={{ maxHeight: '56px', pt: 1 }}
                      renderValue={() => <Typography className='table-data' sx={{ fontSize: '14px !important' }}> Select an Industry</Typography>}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 200,
                            maxWidth: 80,
                            marginLeft: 8,
                          },
                        },
                      }}
                    >
                      {industry.map((item) => (
                        <MenuItem
                          key={item}
                          value={item}
                          sx={{ maxHeight: '40px', pl: 0, padding: 0, marginTop: 0, marginBottom: 0 }}
                          onClick={() => handleMenuItemClick(item)}
                        >
                          <Checkbox
                            checked={checkedFiltersIndustries[item] || false}
                            onChange={handleIndustryChange}
                            value={item}
                            size='small'
                            sx={{
                              "&.Mui-checked": { color: "rgba(80, 82, 178, 1)" },
                            }}
                          />
                          <ListItemText sx={{}}>
                            <Typography sx={{
                              fontSize: "14px",
                              fontFamily: "Nunito Sans",
                              fontWeight: 500,
                              lineHeight: "19.6px",
                              color: checkedFiltersIndustries[item] ? "rgba(80, 82, 178, 1)" : "rgba(32, 33, 36, 1)"
                            }}>
                              {item}
                            </Typography>
                          </ListItemText>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Typography className='second-sub-title'>No industry data</Typography>
                )}
              </Box>
            </Collapse>
          </Box>

          {/* Location */}
          <Box
            sx={{...filterStyles.main_filter_form, mb: 15}}
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

export default CompanyFilterPopup;
