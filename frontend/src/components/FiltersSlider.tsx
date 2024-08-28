import React, { useState } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop, TextField, InputAdornment, Collapse, Divider, FormControlLabel, Checkbox, RadioGroup, Radio, Modal } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import Image from 'next/image';


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
  const [email, setEmail] = useState("");
  const [region, setRegions] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(
    null
  );
  const [selectedTimeRange, setSelectedTimeRange] = useState<string | null>(
    null
  );
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
  const [emails, setEmails] = useState<string[]>([]);
  const [selectedFunnels, setSelectedFunnels] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [buttonFilters, setButtonFilters] = useState<ButtonFilters>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [open_save, setOpen] = useState(false);
  const [filterName, setFilterName] = useState("");

  const handleClear = () => {
    setFilterName("");
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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

  const handleAddTagEmails = (e: { key: string }) => {
    if (e.key === "Enter" && email.trim()) {
      setEmails([...emails, email.trim()]);
      setEmail("");
    }
  };

  const [selectedValue, setSelectedValue] = useState("");

  const handleChangeRecurringVisits = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setSelectedValue(event.target.value);
  };

  const handleDeleteRecurringVisits = () => {
    setSelectedValue("");
  };

  const getButtonStyle = (label: string) => {
    switch (label) {
      case "Visitor":
        return {
          background: "rgba(235, 243, 254, 1)",
          color: "rgba(20, 110, 246, 1)",
        };
      case "Converted":
        return {
          background: "rgba(244, 252, 238, 1)",
          color: "rgba(110, 193, 37, 1)",
        };
      case "Added to cart":
        return {
          background: "rgba(241, 241, 249, 1)",
          color: "rgba(80, 82, 178, 1)",
        };
      case "Cart abandoned":
        return {
          background: "rgba(254, 238, 236, 1)",
          color: "rgba(244, 87, 69, 1)",
        };
      case "New":
        return {
          background: "rgba(254, 243, 205, 1)",
          color: "rgba(250, 203, 36, 1)",
        };
      case "Existing":
        return {
          background: "rgba(228, 247, 212, 1)",
          color: "rgba(110, 193, 37, 1)",
        };
      case "All":
        return {
          background: "rgba(228, 228, 228, 1)",
          color: "rgba(74, 74, 74, 1)",
        };

      default:
        return {};
    }
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
    New: "new_customers",
    Existing: "existing_customers",
    All: "all_customers",
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

      // Clear date range if the tag is related to date
      if (category === "visitedDate") {
        if (updatedTags.length === 0) {
          setDateRange({ fromDate: null, toDate: null });
          setSelectedDateRange(null); // Clear the displayed date range
        }
      }

      // Clear time range if the tag is related to time
      if (category === "visitedTime") {
        if (updatedTags.length === 0) {
          setTimeRange({ fromTime: null, toTime: null });
          setSelectedTimeRange(null); // Clear the displayed time range
        }
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

      return { ...prevTags, [category]: updatedTags };
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
    onDelete: () => void;
  }
  const CustomChip: React.FC<CustomChipProps> = ({ label, onDelete }) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "rgba(228, 228, 228, 1)",
        color: "rgba(123, 123, 123, 1)",
        borderRadius: 2,
        px: 1,
        mr: 1,
        py: 0.5,
        fontSize: "12px",
      }}
    >
      <IconButton size="small" onClick={onDelete} sx={{ p: 0, mr: 0.5 }}>
        <CloseIcon sx={{ fontSize: "12px" }} />
      </IconButton>
      <Typography sx={{ fontFamily: "Nunito", fontSize: "14px" }}>
        {label}
      </Typography>
    </Box>
  );

  const handleButtonClick = (label: string) => {
    let funnel = "";
    switch (label) {
      case "Abandoned cart":
        funnel = "Cart abandoned";
        break;
      case "Converters sales":
        funnel = "Converted";
        break;
      case "Returning visitors":
        funnel = "Visitor";
        break;
      case "Landed to cart":
        funnel = "Added to cart";
        break;
      default:
        funnel = "";
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

  const handleCheckboxChange = (event: {
    target: { name: any; checked: any };
  }) => {
    const { name, checked } = event.target;

    setCheckedFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        [name]: checked,
      };

      const tagMap: { [key: string]: string } = {
        lastWeek: "Last week",
        last30Days: "Last 30 days",
        last6Months: "Last 6 months",
        allTime: "All time",
      };

      if (checked) {
        addTag("visitedDate", tagMap[name]);
      } else {
        removeTag("visitedDate", tagMap[name]);
      }

      return newFilters;
    });
  };

  const handleDateChange = (name: string) => (newValue: any) => {
    setDateRange((prevRange) => {
      const updatedRange = {
        ...prevRange,
        [name]: newValue,
      };

      const fromDate = updatedRange.fromDate
        ? dayjs(updatedRange.fromDate).format("MMM DD, YYYY")
        : "";
      const toDate = updatedRange.toDate
        ? dayjs(updatedRange.toDate).format("MMM DD, YYYY")
        : "";

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

  const handleCheckboxChangeTime = (event: {
    target: { name: any; checked: any };
  }) => {
    const { name, checked } = event.target;

    setCheckedFiltersTime((prevFiltersTime) => {
      const newFiltersTime = {
        ...prevFiltersTime,
        [name]: checked,
      };

      const tagMapTime: { [key: string]: string } = {
        morning: "Morning 12AM - 11AM",
        afternoon: "Afternoon 11AM - 5PM",
        evening: "Evening 5PM - 9PM",
        all_day: "All day",
      };
      if (checked) {
        addTag("visitedTime", tagMapTime[name]);
      } else {
        removeTag("visitedTime", tagMapTime[name]);
      }
      return newFiltersTime;
    });
  };

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
    const filterDates = getFilterDates();
    const isButtonChecked = Object.values(checkedFilters).some(
      (value) => value
    );

    const fromDateTime = isButtonChecked
      ? (checkedFilters.lastWeek && filterDates.lastWeek.from) ||
      (checkedFilters.last30Days && filterDates.last30Days.from) ||
      (checkedFilters.last6Months && filterDates.last6Months.from) ||
      (checkedFilters.allTime && filterDates.allTime.from)
      : dateRange.fromDate
        ? dayjs(dateRange.fromDate).startOf("day").unix()
        : null;

    const toDateTime = isButtonChecked
      ? (checkedFilters.lastWeek && filterDates.lastWeek.to) ||
      (checkedFilters.last30Days && filterDates.last30Days.to) ||
      (checkedFilters.last6Months && filterDates.last6Months.to) ||
      (checkedFilters.allTime && filterDates.allTime.to)
      : dateRange.toDate
        ? dayjs(dateRange.toDate).endOf("day").unix()
        : null;

    const fromDateTimeWithTime =
      fromDateTime && timeRange.fromTime
        ? dayjs
          .unix(fromDateTime)
          .hour(dayjs(timeRange.fromTime).hour())
          .minute(dayjs(timeRange.fromTime).minute())
          .unix()
        : fromDateTime;

    const toDateTimeWithTime =
      toDateTime && timeRange.toTime
        ? dayjs
          .unix(toDateTime)
          .hour(dayjs(timeRange.toTime).hour())
          .minute(dayjs(timeRange.toTime).minute())
          .unix()
        : toDateTime;

    // Формирование объекта filters с учетом переданных buttonFilters
    const filters = {
      ...buttonFilters, // Включаем фильтры, полученные из кнопки (если есть)
      dateRange: buttonFilters
        ? buttonFilters.dateRange
        : {
          fromDate: fromDateTimeWithTime,
          toDate: toDateTimeWithTime,
        },
      selectedFunnels: buttonFilters
        ? buttonFilters.selectedFunnels
        : selectedFunnels,
      button: buttonFilters ? buttonFilters.button : selectedButton,
      checkedFilters,
      checkedFiltersTime,
      checkedFiltersPageVisits,
      regions,
      checkedFiltersTimeSpent,
      emails,
      selectedStatus,
      selectedValue,
      searchQuery,
    };

    return filters;
  };

  const handleApply = () => {
    const filters = handleFilters();
    onApply(filters);
    setSelectedButton("");
    setButtonFilters(null);
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
    return selectedValue !== '';
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
            <Button>
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
            </Button>
            <Typography
              sx={{
                color: "rgba(228, 228, 228, 1)",
                pt: 0.5,
                fontSize: "20px",
                fontWeight: "100",
              }}
            >
              |
            </Typography>
            <Button onClick={handleOpen}>
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
                Save
              </Typography>
            </Button>
            <Modal
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
                    onClick={handleClose}
                    sx={{
                      backgroundColor: "rgba(80, 82, 178, 1)",
                      fontFamily: "Nunito",
                      textTransform: "none",
                    }}
                  >
                    Save
                  </Button>
                </Box>
              </Box>
            </Modal>
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
          }}
        >
          <TextField
            placeholder="Search people"
            variant="outlined"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Button
                    sx={{ textTransform: "none", textDecoration: "none" }}
                  >
                    <SearchIcon
                      sx={{ color: "rgba(101, 101, 101, 1)" }}
                      fontSize="medium"
                    />
                  </Button>
                </InputAdornment>
              ),
            }}
            sx={{ padding: "1em 1em 0em 1em" }}
          />
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
                  color: "#000",
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
              }}
            >
              <Box
                sx={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(80, 82, 178, 1)",
                  visibility: isDateFilterActive() ? "visibility" : "hidden"
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
                  flexGrow: 1,
                  color: "rgba(74, 74, 74, 1)",
                  fontFamily: "Nunito",
                  fontWeight: "500",
                  fontSize: "16px",
                  lineHeight: "25.2px",
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
              {selectedDateRange && (
                <CustomChip
                  label={selectedDateRange}
                  onDelete={() => setSelectedDateRange(null)}
                />
              )}
              <IconButton
                onClick={() => setIsVisitedDateOpen(!isVisitedDateOpen)}
                aria-label="toggle-content"
              >
                {isVisitedDateOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isVisitedDateOpen}>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "rows",
                  gap: 10,
                  justifyContent: "start",
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFilters.lastWeek}
                        onChange={handleCheckboxChange}
                        name="lastWeek"
                      />
                    }
                    label="Last week"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFilters.last30Days}
                        onChange={handleCheckboxChange}
                        name="last30Days"
                      />
                    }
                    label="Last 30 days"
                  />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFilters.last6Months}
                        onChange={handleCheckboxChange}
                        name="last6Months"
                      />
                    }
                    label="Last 6 months"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFilters.allTime}
                        onChange={handleCheckboxChange}
                        name="allTime"
                      />
                    }
                    label="All time"
                  />
                </Box>
              </Box>
              <Typography
                sx={{
                  mt: 2,
                  mb: 1.5,
                  fontFamily: "Nunito",
                  fontSize: "16px",
                  color: "rgba(74, 74, 74, 1)",
                  fontWeight: "400",
                  lineHeight: "16.8px",
                  textAlign: "left",
                }}
              >
                OR
              </Typography>
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
                        <TextField {...props} variant="outlined" fullWidth />
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
                        <TextField {...props} variant="outlined" fullWidth />
                      ),
                    }}
                  />
                </LocalizationProvider>
              </Box>
            </Collapse>
          </Box>
          {/* Visited time */}
          <Box
            sx={{
              width: "100%",
              border: "1px solid rgba(228, 228, 228, 1)",
              padding: "0.5em",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(80, 82, 178, 1)",
                  visibility: isTimeFilterActive() ? "visibility" : "hidden"
                }}
              />
              <Image src="/timer.svg" alt="timer" width={18} height={18} />
              <Typography
                sx={{
                  flexGrow: 1,
                  color: "rgba(74, 74, 74, 1)",
                  fontFamily: "Nunito",
                  fontWeight: "500",
                  fontSize: "16px",
                  lineHeight: "25.2px",
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
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "rows",
                  gap: 10,
                  justifyContent: "start",
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFiltersTime.morning}
                        onChange={handleCheckboxChangeTime}
                        name="morning"
                      />
                    }
                    label="Morning 12AM - 11AM"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFiltersTime.evening}
                        onChange={handleCheckboxChangeTime}
                        name="evening"
                      />
                    }
                    label="Evening 5PM - 9PM"
                  />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFiltersTime.afternoon}
                        onChange={handleCheckboxChangeTime}
                        name="afternoon"
                      />
                    }
                    label="Afternoon 11AM - 5PM"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFiltersTime.all_day}
                        onChange={handleCheckboxChangeTime}
                        name="all_day"
                      />
                    }
                    label="All day"
                  />
                </Box>
              </Box>
              <Typography
                sx={{
                  mt: 2,
                  mb: 1,
                  fontFamily: "Nunito",
                  fontSize: "16px",
                  color: "rgba(74, 74, 74, 1)",
                  fontWeight: "400",
                  lineHeight: "16.8px",
                  textAlign: "left",
                }}
              >
                OR
              </Typography>
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
                        <TextField {...props} variant="outlined" fullWidth />
                      ),
                    }}
                  />
                  <TimePicker
                    label="To time"
                    value={timeRange.toTime}
                    onChange={handleTimeChange("toTime")}
                    slots={{
                      textField: (props) => (
                        <TextField {...props} variant="outlined" fullWidth />
                      ),
                    }}
                  />
                </LocalizationProvider>
              </Box>
            </Collapse>
          </Box>
          {/* Region */}
          <Box
            sx={{
              width: "100%",
              border: "1px solid rgba(228, 228, 228, 1)",
              padding: "0.5em",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  visibility: regions.length > 0 ? 'visible' : "hidden",
                  backgroundColor: "rgba(80, 82, 178, 1)",
                  borderRadius: "50%",
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
                  flexGrow: 1,
                  color: "rgba(74, 74, 74, 1)",
                  fontFamily: "Nunito",
                  fontWeight: "500",
                  fontSize: "16px",
                  lineHeight: "25.2px",
                }}
              >
                Region
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
          <Box
            sx={{
              width: "100%",
              border: "1px solid rgba(228, 228, 228, 1)",
              padding: "0.5em",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: "rgba(80, 82, 178, 1)",
                  borderRadius: "50%",
                  visibility: isPageVisitsFilterActive() ? "visibility" : "hidden"
                }}
              />
              <Image src="/people.svg" alt="calendar" width={18} height={18} />
              <Typography
                sx={{
                  flexGrow: 1,
                  color: "rgba(74, 74, 74, 1)",
                  fontFamily: "Nunito",
                  fontWeight: "500",
                  fontSize: "16px",
                  lineHeight: "25.2px",
                }}
              >
                Page visits
              </Typography>
              {selectedTags.pageVisits.map((tag, index) => (
                <CustomChip
                  key={index}
                  label={tag}
                  onDelete={() => removeTag("pageVisits", tag)}
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
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "rows",
                  gap: 10,
                  justifyContent: "start",
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFiltersPageVisits.page}
                        onChange={handleCheckboxChangePageVisits}
                        name="page"
                      />
                    }
                    label="1 page"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFiltersPageVisits.two_page}
                        onChange={handleCheckboxChangePageVisits}
                        name="two_page"
                      />
                    }
                    label="2 pages"
                  />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFiltersPageVisits.three_page}
                        onChange={handleCheckboxChangePageVisits}
                        name="three_page"
                      />
                    }
                    label="3 pages"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFiltersPageVisits.more_three}
                        onChange={handleCheckboxChangePageVisits}
                        name="more_three"
                      />
                    }
                    label="More than 3 pages"
                  />
                </Box>
              </Box>
            </Collapse>
          </Box>
          {/* Average time spent */}
          <Box
            sx={{
              width: "100%",
              border: "1px solid rgba(228, 228, 228, 1)",
              padding: "0.5em",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: "rgba(80, 82, 178, 1)",
                  borderRadius: "50%",
                  visibility: isTimeSpentFilterActive() ? "visibility" : "hidden"
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
                  flexGrow: 1,
                  color: "rgba(74, 74, 74, 1)",
                  fontFamily: "Nunito",
                  fontWeight: "500",
                  fontSize: "16px",
                  lineHeight: "25.2px",
                }}
              >
                Average time spent
              </Typography>
              {selectedTags.timeSpents.map((tag, index) => (
                <CustomChip
                  key={index}
                  label={tag}
                  onDelete={() => removeTag("timeSpents", tag)}
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
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "rows",
                  gap: 10,
                  justifyContent: "start",
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFiltersTimeSpent.under_10}
                        onChange={handleCheckboxChangeTimeSpent}
                        name="under_10"
                      />
                    }
                    label="under 10 secs"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFiltersTimeSpent.over_10}
                        onChange={handleCheckboxChangeTimeSpent}
                        name="over_10"
                      />
                    }
                    label="10-30 secs"
                  />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFiltersTimeSpent.over_30}
                        onChange={handleCheckboxChangeTimeSpent}
                        name="over_30"
                      />
                    }
                    label="30-60 secs"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkedFiltersTimeSpent.over_60}
                        onChange={handleCheckboxChangeTimeSpent}
                        name="over_60"
                      />
                    }
                    label="Over 60 secs"
                  />
                </Box>
              </Box>
            </Collapse>
          </Box>
          {/* Lead Funnel */}
          <Box
            sx={{
              width: "100%",
              border: "1px solid rgba(228, 228, 228, 1)",
              padding: "0.5em",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: "rgba(80, 82, 178, 1)",
                  borderRadius: "50%",
                  visibility: isLeadFunnelActive() ? "visibility" : "hidden"
                }}
              />
              <Image src="/Leads.svg" alt="calendar" width={18} height={18} />
              <Typography
                sx={{
                  flexGrow: 1,
                  color: "rgba(74, 74, 74, 1)",
                  fontFamily: "Nunito",
                  fontWeight: "500",
                  fontSize: "16px",
                  lineHeight: "25.2px",
                }}
              >
                Lead Funnel
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
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "flex", flexDirection: "rows", gap: 3 }}>
                {[
                  "Converted",
                  "Visitor",
                  "Added to cart",
                  "Cart abandoned",
                ].map((label) => (
                  <Button
                    key={label}
                    onClick={() => handleButtonLeadFunnelClick(label)}
                    sx={{
                      width: "calc(50% - 5px)",
                      height: "2em",
                      textTransform: "none",
                      padding: "1.25em",
                      gap: "10px",
                      textAlign: "center",
                      borderRadius: "4px",
                      border: "1px solid rgba(220, 220, 239, 1)",
                      backgroundColor:
                        selectedButton === label
                          ? "rgba(219, 219, 240, 1)"
                          : getButtonStyle(label).background,
                      color:
                        selectedButton === label
                          ? "#000"
                          : getButtonStyle(label).color,
                      fontFamily: "Nunito",
                      opacity: 1,
                      display: "flex",
                      alignItems: "center",
                      textWrap: "nowrap",
                      justifyContent: "center",
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </Box>
            </Collapse>
          </Box>
          {/* Status */}
          <Box
            sx={{
              width: "100%",
              border: "1px solid rgba(228, 228, 228, 1)",
              padding: "0.5em",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: "rgba(80, 82, 178, 1)",
                  borderRadius: "50%",
                  visibility: isStatusFilterActive() ? "visibility" : "hidden"
                }}
              />
              <Image src="/status.svg" alt="calendar" width={18} height={18} />
              <Typography
                sx={{
                  flexGrow: 1,
                  color: "rgba(74, 74, 74, 1)",
                  fontFamily: "Nunito",
                  fontWeight: "500",
                  fontSize: "16px",
                  lineHeight: "25.2px",
                }}
              >
                Status
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
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "flex", flexDirection: "rows", gap: 3 }}>
                {["New", "Existing", "All"].map((label) => (
                  <Button
                    key={label}
                    onClick={() => handleButtonStatusClick(label)}
                    sx={{
                      width: "calc(25% - 5px)",
                      height: "2em",
                      textTransform: "none",
                      padding: "1.25em",
                      gap: "10px",
                      textAlign: "center",
                      borderRadius: "4px",
                      border: "1px solid rgba(220, 220, 239, 1)",
                      backgroundColor: selectedStatus.includes(
                        statusMapping[label]
                      )
                        ? "rgba(219, 219, 240, 1)"
                        : getButtonStyle(label).background,
                      color: selectedStatus.includes(statusMapping[label])
                        ? "#000"
                        : getButtonStyle(label).color,
                      fontFamily: "Nunito",
                      opacity: 1,
                      display: "flex",
                      alignItems: "center",
                      textWrap: "nowrap",
                      justifyContent: "center",
                    }}
                  >
                    {label}
                  </Button>
                ))}
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
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: 1,
              }}
            >
               <Box
                sx={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: "rgba(80, 82, 178, 1)",
                  borderRadius: "50%",
                  visibility: isRecurringVisitsFilterActive() ? "visibility" : "hidden"
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
                  flexGrow: 1,
                  color: "rgba(74, 74, 74, 1)",
                  fontFamily: "Nunito",
                  fontWeight: "500",
                  fontSize: "16px",
                  lineHeight: "25.2px",
                }}
              >
                Recurring Visists
              </Typography>
              {selectedValue && (
                <CustomChip
                  label={selectedValue}
                  onDelete={handleDeleteRecurringVisits}
                />
              )}
              <IconButton
                onClick={() => setIsRecurringVisits(!isRecurringVisits)}
                aria-label="toggle-content"
              >
                {isRecurringVisits ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isRecurringVisits}>
              <Divider sx={{ mb: 2 }} />
              <RadioGroup
                value={selectedValue}
                onChange={handleChangeRecurringVisits}
                row
              >
                <Box sx={{ display: "flex", justifyContent: "start", gap: 3 }}>
                  {["1", "2", "3", "4", "4+"].map((label) => (
                    <FormControlLabel
                      key={label}
                      control={<Radio value={label} />}
                      label={label}
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
              </RadioGroup>
            </Collapse>
          </Box>
        </Box>
        <Box
          sx={{
            marginRight: "2em",
            display: "flex",
            justifyContent: "end",
            gap: 3
          }}
        >
          <Button
            variant="contained"
            onClick={handleApply}
            sx={{
              color: "rgba(80, 82, 178, 1)",
              backgroundColor: '#fff',
              border: 'rgba(80, 82, 178, 1)',
              fontFamily: "Nunito",
              fontSize: "16px",
              textTransform: "none",
              padding: "0.75em 2.5em",
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
