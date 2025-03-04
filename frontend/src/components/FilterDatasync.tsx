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
  const [isLeadFunnel, setIsLeadFunnel] = useState(false);
  const [isListType, setIsListType] = useState(false)
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
  const [selectedListType, setSelectedListType] = useState<string[]>([])
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
    selectedListType: string[];
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

  const handleButtonListTypeClick = (label: string) => {
    setSelectedListType((prev) =>
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
    Enable: "Enable",
    "Disable": "Disable"
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
      selectedListType: buttonFilters ? buttonFilters.selectedListType : selectedListType,
      button: buttonFilters ? buttonFilters.button : selectedButton,
      selectedStatus,
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
    selectedStatus: string[]; 
  }) => {
    sessionStorage.setItem('filters_data_sync', JSON.stringify(filters));
  };

  const loadFiltersFromSessionStorage = () => {
    const savedFilters = sessionStorage.getItem('filters_data_sync');
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

      // Проверка активных фильтров посещений страниц
      const isPageVisitsFilterActive = Object.values(savedFilters.checkedFiltersPageVisits || {}).some(value => value === true);

      if (isPageVisitsFilterActive) {
        const pageVisitsTagMap: { [key: string]: string } = {
          page: "1 page",
          two_page: "2 pages",
          three_page: "3 pages",
          more_three: "More than 3 pages",
        };

        // Проходим по всем фильтрам и добавляем тег для каждого активного
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

        // Обработка активных фильтров
        Object.keys(savedFilters.checkedFiltersTime).forEach((key) => {
          if (savedFilters.checkedFiltersTime[key]) {
            addTag("visitedTime", timeTagMap[key]);
          }
        });

      } else {
        // Преобразование времени из строкового формата в Dayjs
        const fromTime = savedFilters.from_time ? dayjs(savedFilters.from_time, 'HH:mm') : null;
        const toTime = savedFilters.to_time ? dayjs(savedFilters.to_time, 'HH:mm') : null;

        // Форматирование времени для тега
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
    if(!open) {
      const filters = handleFilters();
      onApply(filters);
    }
  }, [open]);



  const handleApply = () => {
    const filters = handleFilters();
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

  const isListTypeActive = () => {
    return selectedListType.length > 0
  }

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
    setIsLeadFunnel(false);
    setIsStatus(false);
    setIsRecurringVisits(false);
    setIsListType(false)
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
    setSelectedListType([])
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
            position: "sticky",
            top: 0,
            zIndex: 1400,
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
                Sync type
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
                {["Enable", "Disable"].map((label) => {
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
          <Box
            sx={filterStyles.main_filter_form}
          >
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsListType(!isListType)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isListTypeActive() ? "visible" : "hidden"
                }}
              />
              <Image src="/people.svg" alt="calendar" width={18} height={18} />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                List Type
              </Typography>
              {selectedListType.map((label) => (
                <CustomChip
                  key={label}
                  label={label}
                  onDelete={() => handleButtonListTypeClick(label)}
                />
              ))}
              <IconButton
                onClick={() => setIsListType(!isListType)}
                aria-label="toggle-content"
              >
                {isListType ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isListType}>
              <Box sx={{ display: "flex", width: '100%', flexWrap: 'wrap', gap: 1, pt: 2, pl: 2 }}>
                {[
                  "All Contact",
                  "View Product",
                  "Abandoned cart",
                  "Visitor"
                ].map((label) => {
                  const isSelected = selectedListType.includes(label);
                  return (
                    <Button
                      key={label}
                      className='second-sub-title'
                      onClick={() => handleButtonListTypeClick(label)}
                      sx={{
                        width: "calc(25% - 8px)",
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
                          ? "rgba(80, 82, 178, 1) !important"
                          : "#5F6368 !important",
                        backgroundColor: isSelected
                          ? "rgba(237, 237, 247, 1)"
                          : "rgba(255, 255, 255, 1)",
                        lineHeight: '20px !important',
                        '@media (max-width:1100px)': {
                          width: '48%',
                          height: 'auto',
                          maxHeight: '0.5em'
                        },
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
                Platform
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
                  "klaviyo",
                  "mailchimp",
                  "omnisend",
                  "meta",
                  "sendlane"
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
                        fontFamily: "Nunito",
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
                        '@media (max-width:1100px)': {
                          width: '48%',
                          height: 'auto',
                          maxHeight: '0.5em'
                        },
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
                Last Sync
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
                    label={<Typography className='table-data' sx={{  color: checkedFilters.allTime ? "rgba(80, 82, 178, 1) !important" : "rgba(74, 74, 74, 1)" }}>All time</Typography>}
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
