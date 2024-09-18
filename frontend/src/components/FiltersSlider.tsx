import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop, TextField, InputAdornment, Collapse, Divider, FormControlLabel, Checkbox, Radio, List, ListItem, ListItemText } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import Image from 'next/image';
import { filterStyles } from '../css/filterSlider';
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

  const style = {
    position: "absolute" as "absolute",
    top: "17vh",
    left: '85%',
    transform: "translate(-50%, -50%)",
    width: 300,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 2,
    borderRadius: "10px",
    '@media (max-width:600px)': {
      top: "7%",
      left: '50%',
      width: '100%',
    }
  };

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
    Visitor: "visitor",
    "View Product": "viewed_product",
    "Add to cart": "product_added_to_cart",
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

      // Если удалена последняя метка и категория "visitedDate", очищаем состояние
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
      <Typography sx={{ fontFamily: "Nunito", fontSize: "12px", fontWeight: 500, color: 'rgba(74, 74, 74, 1)' }}>
        {label}
      </Typography>
    </Box>
  );


  const handleButtonClick = (label: string) => {
    let funnel = "";
    switch (label) {
      case "Abandoned cart":
        funnel = "Abandoned cart";
        break;
      case "Converters sales":
        funnel = "Converted sales";
        break;
      case "Returning visitors":
        funnel = "Returning visitors";
        break;
      case "Landed to cart":
        funnel = "Added to cart";
        break;
    }

    const now = dayjs();
    const fromDate = now.subtract(30, "days").startOf("day").unix();
    const toDate = now.endOf("day").unix();

    const newFilters = {
      button: label,
      dateRange: {
        fromDate,
        toDate,
      },
      selectedFunnels: [funnel],
    };

    setButtonFilters(newFilters); // Сохраняем фильтры в состоянии
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

      // Определяем старый диапазон дат
      const oldFromDate = prevRange.fromDate
        ? dayjs(prevRange.fromDate).format('MMM DD, YYYY')
        : '';
      const oldToDate = prevRange.toDate
        ? dayjs(prevRange.toDate).format('MMM DD, YYYY')
        : '';

      // Форматируем новый диапазон дат
      const fromDate = updatedRange.fromDate
        ? dayjs(updatedRange.fromDate).format('MMM DD, YYYY')
        : '';
      const toDate = updatedRange.toDate
        ? dayjs(updatedRange.toDate).format('MMM DD, YYYY')
        : '';

      // Устанавливаем новый диапазон дат и метку
      const newTag = fromDate && toDate ? `From ${fromDate} to ${toDate}` : null;

      // Сначала обновляем метку
      setSelectedTags((prevTags) => {
        const updatedTags = {
          ...prevTags,
          visitedDate: newTag ? [newTag] : [],
        };

        // Если новая метка существует, добавляем ее
        if (newTag) {
          addTag("visitedDate", newTag);
        }

        // Если метка была заменена или удалена, очищаем диапазон дат
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


  const handleTimeChange = (name: string) => (newValue: any) => {
    setTimeRange((prevRange) => {
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
    const filterDates = getFilterDates(); // Функция для получения диапазонов дат, например lastWeek, last30Days и т.д.

    // Проверка, что хотя бы один из фильтров по времени активен
    const isDateFilterChecked = Object.values(checkedFilters).some((value) => value);

    let fromTime = timeRange.fromTime ? dayjs(timeRange.fromTime).format('HH:mm') : null;
    let toTime = timeRange.toTime ? dayjs(timeRange.toTime).format('HH:mm') : null;

    // Обработка фильтров по времени (утро, день, вечер, весь день)
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

    // Определение значений from_date и to_date на основе активных фильтров
    let fromDateTime = null;
    let toDateTime = null;

    // Если активен хотя бы один фильтр по дате, используем его диапазоны
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
      // Если не выбран ни один фильтр, используем диапазон из dateRange
      fromDateTime = dateRange.fromDate
        ? dayjs(dateRange.fromDate).startOf("day").unix()
        : null;
      toDateTime = dateRange.toDate
        ? dayjs(dateRange.toDate).endOf("day").unix()
        : null;
    }


    // Составление объекта с фильтрами
    const filters = {
      ...buttonFilters, // Существующие фильтры кнопок
      from_date: fromDateTime, // Установленное значение from_date
      to_date: toDateTime,     // Установленное значение to_date
      from_time: fromTime,     // Установленное значение времени начала
      to_time: toTime,         // Установленное значение времени окончания
      selectedFunnels: buttonFilters ? buttonFilters.selectedFunnels : selectedFunnels,
      button: buttonFilters ? buttonFilters.button : selectedButton,
      checkedFiltersTime,      // Фильтры по времени (утро, день, вечер и т.д.)
      checkedFiltersPageVisits,
      regions,
      checkedFiltersTimeSpent,
      selectedStatus,
      recurringVisits: selectedValues, // Преобразованные выбранные значения
      searchQuery, // Запрос для поиска
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
      searchQuery: string; dateRange?: { fromDate: number; toDate: number; } | undefined;
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
      setCheckedFiltersPageVisits(savedFilters.checkedFiltersPageVisits || {
        page: false,
        two_page: false,
        three_page: false,
        more_three: false,
      });
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
      setCheckedFiltersTimeSpent(savedFilters.checkedFiltersTimeSpent || {
        under_10: false,
        over_10: false,
        over_30: false,
        over_60: false,
      });
      setRegions(savedFilters.regions || []);
      setSelectedFunnels(savedFilters.selectedFunnels || []);
      setSelectedStatus(savedFilters.selectedStatus || []);
      setSelectedValues(savedFilters.recurringVisits || []);
      setSearchQuery(savedFilters.searchQuery || '');
      setButtonFilters(savedFilters.button)
  };
}
  
  useEffect(() => {
    initializeFilters();
  }, [open]);
  


  const handleApply = () => {
    const filters = handleFilters();
    console.log(filters)
    onApply(filters);
    onClose();
  };

  // Check active filters
  const isDateFilterActive = () => {
    return (
      Object.values(checkedFilters).some(value => value) || // Проверка чекбоксов для дат
      (dateRange.fromDate && dateRange.toDate) // Проверка пользовательского выбора диапазона дат
    );
  };

  const isTimeFilterActive = () => {
    return (
      Object.values(checkedFiltersTime).some(value => value) || // Проверка чекбоксов для времени
      (timeRange.fromTime && timeRange.toTime) // Проверка пользовательского выбора диапазона времени
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

    // Сброс состояния дат
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

    // Сброс значений фильтров для времени
    setCheckedFiltersTime({
      morning: false,
      evening: false,
      afternoon: false,
      all_day: false,
    });

    setSelectedValues([]);

    // Сброс значений фильтров
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
    setIsRegionOpen(false);
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
            zIndex: 1301,
            top: 0,
            bottom: 0,
            "@media (max-width: 600px)": {
              width: "100%",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75em 1em 0.25em 1em",
            borderBottom: "1px solid #e4e4e4",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              textAlign: "center",
              color: "#4A4A4A",
              fontFamily: "Nunito",
              fontWeight: "600",
              fontSize: "16px",
              lineHeight: "22.4px",
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
                  fontFamily: "Nunito",
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
                    fontFamily: "Nunito",
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
                      fontFamily: 'Nunito',
                      color: '#3B3B3B',
                      fontSize: '16px',
                      fontWeight: '600',
                      lineHeight: '22.4px'
                    }}>
                      {filter.name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'Nunito' }}>
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
                      fontFamily: 'Nunito',
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
                  fontFamily: "Nunito",
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
                    fontFamily: "Nunito",
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
                      fontFamily: "Nunito",
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
            pb: 2
          }}
        >
          <Box sx={{ display: 'flex', width: '100%', flexDirection: 'column' }}>
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
                  fontFamily: 'Nunito',
                  fontSize: '0.95em',
                  fontWeight: 400,
                  lineHeight: '16.8px',
                  textAlign: 'left',
                  color: 'rgba(74, 74, 74, 1)',
                },
              }}
              sx={{
                padding: "1em 1em 0em 1em",
                '& .MuiInputBase-input::placeholder': {
                  fontFamily: 'Nunito',
                  fontSize: '1em',
                  fontWeight: 400,
                  lineHeight: '16.8px',
                  textAlign: 'left',
                  color: 'rgba(74, 74, 74, 1)',
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
                            fontFamily: 'Nunito',
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
          <Box
            sx={{ display: "flex", flexWrap: "wrap", gap: "10px", p: "1em" }}
          >
            {[
              "Abandoned cart",
              "Converters sales",
              "Returning visitors",
              "Landed to cart",
            ].map((label) => (
              <Button
                key={label}
                onClick={() => handleButtonClick(label)}
                sx={{
                  width: "calc(50% - 5px)",
                  height: "33px",
                  textTransform: "none",
                  padding: "1.25em",
                  gap: "10px",
                  textAlign: "center",
                  borderRadius: "4px",
                  border:
                    selectedButton === label
                      ? "1px solid rgba(80, 82, 178, 1)"
                      : "1px solid rgba(220, 220, 239, 1)",
                  backgroundColor:
                    selectedButton === label
                      ? "rgba(219, 219, 240, 1)"
                      : "#fff",
                  color:
                    selectedButton === label
                      ? "rgba(80, 82, 178, 1)"
                      : "rgba(74, 74, 74, 1)",
                  fontFamily: "Nunito",
                  opacity: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
          {/* Visited date */}
          <Box
            sx={{
              width: "100%",
              mt: 0.5,
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
                    label={<Typography sx={{ ...filterStyles.collapse_font, color: checkedFilters.lastWeek ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>Last week</Typography>}
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
                    label={<Typography sx={{ ...filterStyles.collapse_font, color: checkedFilters.last30Days ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>Last 30 days</Typography>}
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
                    label={<Typography sx={{ ...filterStyles.collapse_font, color: checkedFilters.last6Months ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>Last 6 months</Typography>}
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
                    label={<Typography sx={{ ...filterStyles.collapse_font, color: checkedFilters.allTime ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>All time</Typography>}
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
                    onChange={(newValue) =>
                      handleDateChange("fromDate")(newValue)
                    }
                    sx={{ width: "100%" }}
                    slots={{
                      textField: (props) => (
                        <TextField {...props} variant="outlined" fullWidth sx={{
                          '& .MuiInputBase-input': {
                            fontFamily: 'Nunito',
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '19.6px',
                            textAlign: 'left',
                          },
                          '& .MuiInputLabel-root': {
                            fontFamily: 'Nunito',
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '19.6px',
                            textAlign: 'left',
                          }
                        }} />
                      ),
                    }}
                  />
                  <DatePicker
                    label="To date"
                    value={dateRange.toDate}
                    onChange={(newValue) =>
                      handleDateChange("toDate")(newValue)
                    }
                    sx={{ width: "100%" }}
                    slots={{
                      textField: (props) => (
                        <TextField {...props} variant="outlined" fullWidth
                          sx={{
                            '& .MuiInputBase-input': {
                              fontFamily: 'Nunito',
                              fontSize: '14px',
                              fontWeight: 400,
                              lineHeight: '19.6px',
                              textAlign: 'left',
                            },
                            '& .MuiInputLabel-root': {
                              fontFamily: 'Nunito',
                              fontSize: '14px',
                              fontWeight: 400,
                              lineHeight: '19.6px',
                              textAlign: 'left',
                            }
                          }} />
                      ),
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
                  onDelete={() => setSelectedTimeRange(null)}
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
                    label={<Typography sx={{ ...filterStyles.collapse_font, color: checkedFiltersTime.morning ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>Morning 12AM - 11AM</Typography>}
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
                    label={<Typography sx={{ ...filterStyles.collapse_font, color: checkedFiltersTime.evening ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>Evening 5PM - 9PM</Typography>}
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
                    label={<Typography sx={{ ...filterStyles.collapse_font, color: checkedFiltersTime.afternoon ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>Afternoon 11AM - 5PM</Typography>}
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
                    label={<Typography sx={{ ...filterStyles.collapse_font, color: checkedFiltersTime.all_day ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>All day</Typography>}
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
                    slots={{
                      textField: (props) => (
                        <TextField {...props} variant="outlined" fullWidth sx={{
                          '& .MuiInputBase-input': {
                            fontFamily: 'Nunito',
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '19.6px',
                            textAlign: 'left',
                          },
                          '& .MuiInputLabel-root': {
                            fontFamily: 'Nunito',
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '19.6px',
                            textAlign: 'left',
                          }
                        }} />
                      ),
                    }}
                  />
                  <TimePicker
                    label="To time"
                    value={timeRange.toTime}
                    onChange={handleTimeChange("toTime")}
                    slots={{
                      textField: (props) => (
                        <TextField {...props} variant="outlined" fullWidth sx={{
                          '& .MuiInputBase-input': {
                            fontFamily: 'Nunito',
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '19.6px',
                            textAlign: 'left',
                          },
                          '& .MuiInputLabel-root': {
                            fontFamily: 'Nunito',
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '19.6px',
                            textAlign: 'left',
                          }
                        }} />
                      ),
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
                    fontFamily: 'Nunito',
                    fontSize: '0.95em',
                    fontWeight: 400,
                    lineHeight: '16.8px',
                    textAlign: 'left',
                    color: 'rgba(74, 74, 74, 1)',
                  },
                }}
                sx={{
                  mb: '3px',
                  '& .MuiInputBase-input::placeholder': {
                    fontFamily: 'Nunito',
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: '16.8px',
                    textAlign: 'left',
                    color: 'rgba(74, 74, 74, 1)',
                  },
                }}
              />
              {cities.map((city, index) => (
                <ListItem button key={index} onClick={() => handleSelectCity(city)}>
                  <ListItemText
                    primary={
                      <span style={{ fontFamily: 'Nunito', fontSize: '12px', fontWeight: 600, lineHeight: '16.8px', textAlign: 'left', color: 'rgba(74, 74, 74, 1)' }}>
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
                  <FormControlLabel sx={{ fontFamily: 'Nunito', fontWeight: 100 }}
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
                    label={<Typography sx={{ ...filterStyles.collapse_font, color: checkedFiltersPageVisits.page ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>1 page</Typography>}
                  />
                  <FormControlLabel sx={{ fontFamily: 'Nunito', fontWeight: 100 }}
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
                    label={<Typography sx={{ ...filterStyles.collapse_font, color: checkedFiltersPageVisits.two_page ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>2 pages</Typography>}
                  />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <FormControlLabel sx={{ fontFamily: 'Nunito', fontWeight: 100 }}
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
                    label={<Typography sx={{ ...filterStyles.collapse_font, color: checkedFiltersPageVisits.three_page ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>3 pages</Typography>}
                  />
                  <FormControlLabel sx={{ fontFamily: 'Nunito', fontWeight: 100 }}
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
                    label={<Typography sx={{ ...filterStyles.collapse_font, color: checkedFiltersPageVisits.more_three ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>More than 3 pages</Typography>}
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
                    label={<Typography sx={{ ...filterStyles.collapse_font, color: checkedFiltersTimeSpent.under_10 ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>under 10 secs</Typography>}
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
                    label={<Typography sx={{ ...filterStyles.collapse_font, color: checkedFiltersTimeSpent.over_10 ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>10-30 secs</Typography>}
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
                    label={<Typography sx={{ ...filterStyles.collapse_font, color: checkedFiltersTimeSpent.over_30 ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>30-60 secs</Typography>}
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
                    label={<Typography sx={{ ...filterStyles.collapse_font, color: checkedFiltersTimeSpent.over_60 ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>Over 60 secs</Typography>}
                  />
                </Box>
              </Box>
            </Collapse>
          </Box>
          {/* Lead Funnel */}
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
              <Box sx={{ display: "flex", width: '100%', flexWrap: 'wrap', gap: 1, pt: 2, pl: 2 }}>
                {[
                  "Converted sales",
                  "Returning visitors",
                  "Abandoned cart",
                  "Landed to cart",
                ].map((label) => {
                  const isSelected = selectedFunnels.includes(label);
                  return (
                    <Button
                      key={label}
                      onClick={() => handleButtonLeadFunnelClick(label)}
                      sx={{
                        width: "calc(33% - 8px)",
                        height: "2em",
                        textTransform: "none",
                        gap: "0px",
                        padding: '1em 2em',
                        textWrap: "nowrap",
                        textAlign: "center",
                        borderRadius: "4px",
                        fontFamily: "Nunito",
                        opacity: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: isSelected
                          ? "1px solid rgba(80, 82, 178, 1)"
                          : "1px solid rgba(220, 220, 239, 1)",
                        color: isSelected
                          ? "rgba(80, 82, 178, 1)"
                          : "rgba(74, 74, 74, 1)",
                        background: isSelected
                          ? "rgba(237, 237, 247, 1)"
                          : "transparent",
                        '@media (max-width:600px)': {
                          width: '48%'
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
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, pt: 2, pl: 2 }}>
                {["Visitor", "View Product", "Add to cart"].map((label) => {
                  const mappedStatus = statusMapping[label];
                  const isSelected = selectedStatus.includes(mappedStatus);

                  return (
                    <Button
                      key={label}
                      onClick={() => handleButtonStatusClick(label)}
                      sx={{
                        width: "calc(25% - 5px)",
                        height: "2em",
                        textTransform: "none",
                        textWrap: 'nowrap',
                        padding: "5px 0px",
                        gap: "10px",
                        textAlign: "center",
                        borderRadius: "4px",
                        fontFamily: "Nunito",
                        opacity: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: isSelected
                          ? "1px solid rgba(80, 82, 178, 1)"
                          : "1px solid rgba(220, 220, 239, 1)",
                        color: isSelected
                          ? "rgba(80, 82, 178, 1)"
                          : "rgba(74, 74, 74, 1)",
                        backgroundColor: isSelected
                          ? "rgba(237, 237, 247, 1)"
                          : "rgba(255, 255, 255, 1)",
                      }}
                    >
                      {label}
                    </Button>
                  );
                })}
              </Box>
            </Collapse>

          </Box>
          {/* Recurring Visits */}
          <Box
            sx={{
              width: "100%",
              mb: 2,
              border: "1px solid rgba(228, 228, 228, 1)",
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
                    label={<Typography sx={{ fontSize: '14px', fontFamily: 'Nunito', fontWeight: 400, color: selectedValues.includes(label) ? "rgba(80, 82, 178, 1)" : "rgba(74, 74, 74, 1)" }}>{label}</Typography>}
                    sx={{
                      display: "flex",
                      color: "rgba(74, 74, 74, 1)",
                      alignItems: "center",
                      fontFamily: "Nunito",
                      fontWeight: "600",
                      fontSize: "16px",
                      lineHeight: "25.2px",
                    }}
                  />
                ))}
              </Box>
            </Collapse>
          </Box>
        </Box>
        <Box
          sx={{
            marginRight: "2em",
            display: "flex",
            justifyContent: "end",
            pb: 2,
            gap: 3
          }}
        >
          <Button
            variant="contained"
            onClick={handleClearFilters}
            sx={{
              color: "rgba(80, 82, 178, 1)",
              backgroundColor: '#fff',
              border: 'rgba(80, 82, 178, 1)',
              fontFamily: "Nunito",
              fontSize: "16px",
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
            sx={{
              backgroundColor: "rgba(80, 82, 178, 1)",
              fontFamily: "Nunito",
              fontSize: "16px",
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
      </Drawer>
    </>
  );
};

export default FilterPopup;
