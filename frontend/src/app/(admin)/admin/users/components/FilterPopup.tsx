import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Collapse, FormControlLabel, Radio, Grid } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InsertInvitationIcon from "@mui/icons-material/InsertInvitation";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { filterStyles } from '@/css/filterSlider';


interface FilterParams {
  joinDate: { fromDate: number | null; toDate: number | null };
  lastLoginDate: { fromDate: number | null; toDate: number | null };
}

interface FilterPopupProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: FilterParams) => void;
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

interface DateRange {
  fromDate: Dayjs | null;
  toDate: Dayjs | null;
}

interface TagMap {
  [key: string]: string;
}

const dateTypes: Record<string, string> = {
  today: "Today",
  last7Days: "Last 7 days",
  last30Days: "Last 30 days",
  last6Months: "Last 6 months",
}

const FilterPopup: React.FC<FilterPopupProps> = ({ open, onClose, onApply }) => {
  const [isCreatedDateOpen, setIsCreatedDateOpen] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange>({
    fromDate: null,
    toDate: null,
  });
  const [joinDateRange, setJoinDateRange] = useState<DateRange>({
    fromDate: null,
    toDate: null,
  });

  const [checkedFilters, setCheckedFilters] = useState({
    today: false,
    last7Days: false,
    last30Days: false,
    last6Months: false,
  });

  const [checkedJoinDateFilters, setCheckedJoinDateFilters] = useState({
    today: false,
    last7Days: false,
    last30Days: false,
    last6Months: false,
  });
  const [isJoinDateOpen, setIsJoinDateOpen] = useState(false);

  const [selectedTags, setSelectedTags] = useState<{ [key: string]: string[] }>(
    {
      joinDate: [],
      createdDate: [],
    }
  );

  const handleRadioChange = (event: { target: { name: string } }) => {
    const { name } = event.target;

    setCheckedFilters((prevFilters) => {
      const prevFiltersTyped = prevFilters as Record<string, boolean>;

      const previouslySelected = Object.keys(prevFiltersTyped).find(
        (key) => prevFiltersTyped[key]
      );

      const newFilters = {
        today: false,
        last7Days: false,
        last30Days: false,
        last6Months: false,
        [name]: true,
      };


      const tagMap: { [key: string]: string } = {
        today: dateTypes.today,
        last7Days: dateTypes.last7Days,
        last30Days: dateTypes.last30Days,
        last6Months: dateTypes.last6Months,
      };

      if (previouslySelected && previouslySelected !== name) {
        removeTag("createdDate", tagMap[previouslySelected]);
      }

      setDateRange({ fromDate: null, toDate: null });

      addTag("createdDate", tagMap[name]);

      return newFilters;
    });
  };

  const formatFilterLabel = (key: keyof typeof checkedFilters) => {
    const labels: Record<keyof typeof checkedFilters, string> = {
      today: dateTypes.today,
      last7Days: dateTypes.last7Days,
      last30Days: dateTypes.last30Days,
      last6Months: dateTypes.last6Months,
    };
    return labels[key];
  };

  const getSelectedDateChip = () => {

    if (dateRange.fromDate && dateRange.toDate) {
      return `${dayjs(dateRange.fromDate).format("YYYY-MM-DD")} - ${dayjs(
        dateRange.toDate
      ).format("YYYY-MM-DD")}`;
    }

    const activeFilter = Object.keys(checkedFilters).find(
      (key) => checkedFilters[key as keyof typeof checkedFilters]
    );

    return activeFilter
      ? formatFilterLabel(activeFilter as keyof typeof checkedFilters)
      : null;
  };

  const getSelectedJoinDateChip = () => {

    if (joinDateRange.fromDate && joinDateRange.toDate) {
      return `${dayjs(joinDateRange.fromDate).format("YYYY-MM-DD")} - ${dayjs(
        joinDateRange.toDate
      ).format("YYYY-MM-DD")}`;
    }

    const activeFilter = Object.keys(checkedJoinDateFilters).find(
      (key) => checkedJoinDateFilters[key as keyof typeof checkedJoinDateFilters]
    );

    return activeFilter
      ? formatFilterLabel(activeFilter as keyof typeof checkedJoinDateFilters)
      : null;
  };

  const clearDateFilter = () => {
    setSelectedTags((prev) => ({
      ...prev,
      createdDate: [],
    }));


    setCheckedFilters({
      today: false,
      last7Days: false,
      last30Days: false,
      last6Months: false,
    });

    setDateRange({ fromDate: null, toDate: null });
  };

  const clearJoinDateFilter = () => {
    setSelectedTags((prev) => ({
      ...prev,
      joinDate: [],
    }));


    setCheckedJoinDateFilters({
      today: false,
      last7Days: false,
      last30Days: false,
      last6Months: false,
    });

    setJoinDateRange({ fromDate: null, toDate: null });
  };

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
        ? dayjs(prevRange.fromDate).format("MMM DD, YYYY")
        : "";
      const oldToDate = prevRange.toDate
        ? dayjs(prevRange.toDate).format("MMM DD, YYYY")
        : "";

      const fromDate = updatedRange.fromDate
        ? dayjs(updatedRange.fromDate).format("MMM DD, YYYY")
        : "";
      const toDate = updatedRange.toDate
        ? dayjs(updatedRange.toDate).format("MMM DD, YYYY")
        : "";

      const newTag =
        fromDate && toDate ? `From ${fromDate} to ${toDate}` : null;


      setSelectedTags((prevTags) => {
        let updatedJoinTags = prevTags.createdDate;

        const oldTag =
          oldFromDate && oldToDate
            ? `From ${oldFromDate} to ${oldToDate}`
            : null;

        if (oldTag && updatedJoinTags.includes(oldTag)) {
          updatedJoinTags = updatedJoinTags.filter((tag) => tag !== oldTag);
        }

        const newTag =
          fromDate && toDate ? `From ${fromDate} to ${toDate}` : null;

        if (newTag) {
          updatedJoinTags = [newTag];
        }

        return {
          ...prevTags,
          createdDate: updatedJoinTags,
        };
      });

      return updatedRange;
    });
  };

  const handleJoinDateChange = (name: string) => (newValue: any) => {

    setJoinDateRange((prevRange) => {
      const updatedRange = {
        ...prevRange,
        [name]: newValue,
      };

      setCheckedJoinDateFilters({
        today: false,
        last7Days: false,
        last30Days: false,
        last6Months: false,
      });

      const oldFromDate = prevRange.fromDate
        ? dayjs(prevRange.fromDate).format("MMM DD, YYYY")
        : "";
      const oldToDate = prevRange.toDate
        ? dayjs(prevRange.toDate).format("MMM DD, YYYY")
        : "";

      const fromDate = updatedRange.fromDate
        ? dayjs(updatedRange.fromDate).format("MMM DD, YYYY")
        : "";
      const toDate = updatedRange.toDate
        ? dayjs(updatedRange.toDate).format("MMM DD, YYYY")
        : "";

      const newTag =
        fromDate && toDate ? `From ${fromDate} to ${toDate}` : null;

      setSelectedTags((prevTags) => {
        let updatedJoinTags = prevTags.joinDate;

        const oldTag =
          oldFromDate && oldToDate
            ? `From ${oldFromDate} to ${oldToDate}`
            : null;

        if (oldTag && updatedJoinTags.includes(oldTag)) {
          updatedJoinTags = updatedJoinTags.filter((tag) => tag !== oldTag);
        }

        const newTag =
          fromDate && toDate ? `From ${fromDate} to ${toDate}` : null;

        if (newTag) {
          updatedJoinTags = [newTag];
        }

        return {
          ...prevTags,
          joinDate: updatedJoinTags,
        };
      });



      return updatedRange;
    });
  };

  const removeTag = (category: string, tag: string) => {
    setSelectedTags((prevTags) => {
      const updatedTags = prevTags[category].filter((t) => t !== tag);

      if (category === "createdDate") {
        setDateRange({ fromDate: null, toDate: null });
      }

      if (category === "createdDate") {
        const tagMap: { [key: string]: string } = {
          [dateTypes.today]: "today",
          [dateTypes.last7Days]: "last7Days",
          [dateTypes.last30Days]: "last30Days",
          [dateTypes.last6Months]: "last6Months",
        };

        const filterName = tagMap[tag];
        if (filterName) {
          setCheckedFilters((prevFilters) => ({
            ...prevFilters,
            [filterName]: false,
          }));
        }
      }

      if (category === "joinDate") {
        setJoinDateRange({ fromDate: null, toDate: null });
      }

      if (category === "joinDate") {
        const tagMap: { [key: string]: string } = {
          [dateTypes.today]: "today",
          [dateTypes.last7Days]: "last7Days",
          [dateTypes.last30Days]: "last30Days",
          [dateTypes.last6Months]: "last6Months",
        };

        const filterName = tagMap[tag];
        if (filterName) {
          setCheckedJoinDateFilters((prevFilters) => ({
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
      [dateTypes.today]: "today",
      [dateTypes.last7Days]: "last7Days",
      [dateTypes.last30Days]: "last30Days",
      [dateTypes.last6Months]: "last6Months",
    };

    const filterName = tagMap[tag];

    if (filterName) {
      if (category === "lastLoginDate") {
        setCheckedFilters((prevFilters) => ({
          ...prevFilters,
          [filterName]: isChecked,
        }));
      } else if (category === "joinDate") {
        setCheckedJoinDateFilters((prevFiltersTime) => ({
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

  const isDateFilterActive = () => {
    return (
      Object.values(checkedFilters).some((value) => value) ||
      (dateRange.fromDate && dateRange.toDate)
    );
  };

  const isDateFilterJoinDaActive = () => {
    return (
      Object.values(checkedJoinDateFilters).some((value) => value) ||
      (joinDateRange.fromDate && joinDateRange.toDate)
    );
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
    const filterDates = getFilterDates();
    const isDateFilterChecked = Object.values(checkedFilters).some(
      (value) => value
    );

    let fromDateTime = null;
    let toDateTime = null;
    let fromJoinDateTime = null;
    let toJoinDateTime = null;

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
      fromDateTime = dateRange.fromDate
        ? dayjs(dateRange.fromDate).startOf("day").unix()
        : null;
      toDateTime = dateRange.toDate
        ? dayjs(dateRange.toDate).endOf("day").unix()
        : null;
    }
    const isJoinDateFilterChecked = Object.values(checkedJoinDateFilters).some(
      (value) => value
    );

    if (isJoinDateFilterChecked) {
      if (checkedJoinDateFilters.today) {
        fromJoinDateTime = filterDates.today.from;
        toJoinDateTime = filterDates.today.to;
      } else if (checkedJoinDateFilters.last7Days) {
        fromJoinDateTime = filterDates.last7Days.from;
        toJoinDateTime = filterDates.last7Days.to;
      } else if (checkedJoinDateFilters.last30Days) {
        fromJoinDateTime = filterDates.last30Days.from;
        toJoinDateTime = filterDates.last30Days.to;
      } else if (checkedJoinDateFilters.last6Months) {
        fromJoinDateTime = filterDates.last6Months.from;
        toJoinDateTime = filterDates.last6Months.to;
      }
    } else {
      fromJoinDateTime = joinDateRange.fromDate
        ? dayjs(joinDateRange.fromDate).startOf("day").unix()
        : null;
      toJoinDateTime = joinDateRange.toDate
        ? dayjs(joinDateRange.toDate).endOf("day").unix()
        : null;
    }


    const filters = {
      lastLoginDate: {
        fromDate: fromDateTime,
        toDate: toDateTime
      },
      joinDate: {
        fromDate: fromJoinDateTime,
        toDate: toJoinDateTime
      }
    };

    saveFiltersToSessionStorage(filters);

    return filters;
  };

  const handleRadioChangeJoinDate = (event: { target: { name: string } }) => {
    const { name } = event.target;

    setCheckedJoinDateFilters((prevFilters) => {
      const prevFiltersTyped = prevFilters as Record<string, boolean>;
      const previouslySelected = Object.keys(prevFiltersTyped).find((key) => prevFiltersTyped[key]);
      const newFilters = {
        today: false,
        last7Days: false,
        last30Days: false,
        last6Months: false,
        [name]: true,
      };

      const tagMap: TagMap = {
        [dateTypes.today]: "today",
        [dateTypes.last7Days]: "last7Days",
        [dateTypes.last30Days]: "last30Days",
        [dateTypes.last6Months]: "last6Months",
      };

      if (previouslySelected && previouslySelected !== name) {
        removeTag("joinDate", tagMap[previouslySelected]);
      }

      setJoinDateRange({ fromDate: null, toDate: null });

      addTag("joinDate", tagMap[name]);

      return newFilters;
    });
  };

  const saveFiltersToSessionStorage = (filters: any) => {
    sessionStorage.setItem("filtersByAdmin", JSON.stringify(filters));
  };

  const handleApply = () => {
    const filters = handleFilters();
    onApply(filters);
    onClose();
  };


  const handleClearFilters = () => {
    setIsCreatedDateOpen(false)
    setIsJoinDateOpen(false)

    setDateRange({
      fromDate: null,
      toDate: null,
    });
    setJoinDateRange({
      fromDate: null,
      toDate: null,
    });
    setCheckedFilters({
      today: false,
      last7Days: false,
      last30Days: false,
      last6Months: false,
    });

    setCheckedJoinDateFilters({
      today: false,
      last7Days: false,
      last30Days: false,
      last6Months: false,
    });

    setSelectedTags({
      joinDate: [],
      createdDate: [],
    })

    sessionStorage.removeItem('filtersByAdmin')
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
                cursor: "pointer",
              }}
              onClick={() =>
                setIsJoinDateOpen(!isJoinDateOpen)
              }
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isDateFilterJoinDaActive()
                    ? "visible"
                    : "hidden",
                }}
              />
              <InsertInvitationIcon
                sx={{ fontSize: 20, color: "#5F6368" }}
              />
              <Typography
                sx={{
                  ...filterStyles.filter_name,
                }}
              >
                Join Date
              </Typography>
              {getSelectedJoinDateChip() && (
                <CustomChip
                  label={getSelectedJoinDateChip()!}
                  onDelete={clearJoinDateFilter}
                />
              )}
              <IconButton
                onClick={() =>
                  setIsJoinDateOpen(!isJoinDateOpen)
                }
                aria-label="toggle-content"
              >
                {isJoinDateOpen ? (
                  <ExpandLessIcon />
                ) : (
                  <ExpandMoreIcon />
                )}
              </IconButton>
            </Box>
            <Collapse in={isJoinDateOpen}>
              <Box
                sx={{
                  ...filterStyles.filter_dropdown,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                  }}
                >
                  <Grid container spacing={0}>
                    <Grid item xs={4}>
                      <FormControlLabel
                        control={
                          <Radio
                            checked={
                              checkedJoinDateFilters.today
                            }
                            onChange={
                              handleRadioChangeJoinDate
                            }
                            name="today"
                            size="small"
                            sx={{
                              "&.Mui-checked":
                              {
                                color: "rgba(56, 152, 252, 1)",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            className="table-data"
                            sx={{
                              color: checkedJoinDateFilters.today
                                ? "rgba(56, 152, 252, 1) !important"
                                : "rgba(74, 74, 74, 1)",
                            }}
                          >
                            Today
                          </Typography>
                        }
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Radio
                            checked={
                              checkedJoinDateFilters.last7Days
                            }
                            onChange={
                              handleRadioChangeJoinDate
                            }
                            name="last7Days"
                            size="small"
                            sx={{
                              "&.Mui-checked":
                              {
                                color: "rgba(56, 152, 252, 1)",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            className="table-data"
                            sx={{
                              color: filterStyles.last7Days
                                ? "rgba(56, 152, 252, 1) !important"
                                : "rgba(74, 74, 74, 1)",
                            }}
                          >
                            Last 7 days
                          </Typography>
                        }
                      />
                    </Grid>

                    <Grid item xs={4}>
                      <FormControlLabel
                        control={
                          <Radio
                            checked={
                              checkedJoinDateFilters.last30Days
                            }
                            onChange={
                              handleRadioChangeJoinDate
                            }
                            name="last30Days"
                            size="small"
                            sx={{
                              "&.Mui-checked":
                              {
                                color: "rgba(56, 152, 252, 1)",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            className="table-data"
                            sx={{
                              color: checkedJoinDateFilters.last30Days
                                ? "rgba(56, 152, 252, 1) !important"
                                : "rgba(74, 74, 74, 1)",
                            }}
                          >
                            Last 30 days
                          </Typography>
                        }
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Radio
                            checked={
                              checkedJoinDateFilters.last6Months
                            }
                            onChange={
                              handleRadioChangeJoinDate
                            }
                            name="last6Months"
                            size="small"
                            sx={{
                              "&.Mui-checked":
                              {
                                color: "rgba(56, 152, 252, 1)",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            className="table-data"
                            sx={{
                              color: checkedJoinDateFilters.last6Months
                                ? "rgba(56, 152, 252, 1) !important"
                                : "rgba(74, 74, 74, 1)",
                            }}
                          >
                            Last 6 months
                          </Typography>
                        }
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
              <Box sx={filterStyles.date_time_formatted}>
                <Box
                  sx={{
                    borderBottom: "1px solid #e4e4e4",
                    flexGrow: 1,
                  }}
                />
                <Typography
                  variant="body1"
                  sx={filterStyles.or_text}
                >
                  OR
                </Typography>
                <Box
                  sx={{
                    borderBottom: "1px solid #e4e4e4",
                    flexGrow: 1,
                  }}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-start",
                }}
              >
                <LocalizationProvider
                  dateAdapter={AdapterDayjs}
                >
                  <DatePicker
                    label="From date"
                    value={joinDateRange.fromDate}
                    onChange={(newValue) =>
                      handleJoinDateChange("fromDate")(
                        newValue
                      )
                    }
                    sx={{ width: "100%" }}
                    slots={{
                      openPickerIcon:
                        InsertInvitationIcon,
                    }}
                    slotProps={{
                      openPickerButton: {
                        sx: { color: "#5F636880" },
                      },
                      textField: {
                        variant: "outlined",
                        fullWidth: true,
                        sx: {
                          "& .MuiInputBase-input":
                          {
                            fontFamily:
                              "Roboto",
                            fontSize:
                              "14px",
                            fontWeight: 400,
                            lineHeight:
                              "19.6px",
                            textAlign:
                              "left",
                          },
                          "& .MuiInputLabel-root":
                          {
                            fontFamily:
                              "Roboto",
                            fontSize:
                              "14px",
                            fontWeight: 400,
                            lineHeight:
                              "19.6px",
                            textAlign:
                              "left",
                          },
                        },
                      },
                    }}
                  />
                  <DatePicker
                    label="To date"
                    value={joinDateRange.toDate}
                    onChange={(newValue) =>
                      handleJoinDateChange("toDate")(
                        newValue
                      )
                    }
                    sx={{ width: "100%" }}
                    slots={{
                      openPickerIcon:
                        InsertInvitationIcon,
                    }}
                    slotProps={{
                      openPickerButton: {
                        sx: { color: "#5F636880" },
                      },
                      textField: {
                        variant: "outlined",
                        fullWidth: true,
                        sx: {
                          "& .MuiInputBase-input":
                          {
                            fontFamily:
                              "Roboto",
                            fontSize:
                              "14px",
                            fontWeight: 400,
                            lineHeight:
                              "19.6px",
                            textAlign:
                              "left",
                          },
                          "& .MuiInputLabel-root":
                          {
                            fontFamily:
                              "Roboto",
                            fontSize:
                              "14px",
                            fontWeight: 400,
                            lineHeight:
                              "19.6px",
                            textAlign:
                              "left",
                          },
                        },
                      },
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
                cursor: "pointer",
              }}
              onClick={() =>
                setIsCreatedDateOpen(!isCreatedDateOpen)
              }
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isDateFilterActive()
                    ? "visible"
                    : "hidden",
                }}
              />
              <InsertInvitationIcon
                sx={{ fontSize: 20, color: "#5F6368" }}
              />
              <Typography
                sx={{
                  ...filterStyles.filter_name,
                }}
              >
                Last Login Date
              </Typography>
              {getSelectedDateChip() && (
                <CustomChip
                  label={getSelectedDateChip()!}
                  onDelete={clearDateFilter}
                />
              )}
              <IconButton
                onClick={() =>
                  setIsCreatedDateOpen(!isCreatedDateOpen)
                }
                aria-label="toggle-content"
              >
                {isCreatedDateOpen ? (
                  <ExpandLessIcon />
                ) : (
                  <ExpandMoreIcon />
                )}
              </IconButton>
            </Box>
            <Collapse in={isCreatedDateOpen}>
              <Box
                sx={{
                  ...filterStyles.filter_dropdown,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                  }}
                >
                  <Grid container spacing={0}>
                    <Grid item xs={4}>
                      <FormControlLabel
                        control={
                          <Radio
                            checked={
                              checkedFilters.today
                            }
                            onChange={
                              handleRadioChange
                            }
                            name="today"
                            size="small"
                            sx={{
                              "&.Mui-checked":
                              {
                                color: "rgba(56, 152, 252, 1)",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            className="table-data"
                            sx={{
                              color: checkedFilters.today
                                ? "rgba(56, 152, 252, 1) !important"
                                : "rgba(74, 74, 74, 1)",
                            }}
                          >
                            Today
                          </Typography>
                        }
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Radio
                            checked={
                              checkedFilters.last7Days
                            }
                            onChange={
                              handleRadioChange
                            }
                            name="last7Days"
                            size="small"
                            sx={{
                              "&.Mui-checked":
                              {
                                color: "rgba(56, 152, 252, 1)",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            className="table-data"
                            sx={{
                              color: checkedFilters.last7Days
                                ? "rgba(56, 152, 252, 1) !important"
                                : "rgba(74, 74, 74, 1)",
                            }}
                          >
                            Last 7 days
                          </Typography>
                        }
                      />
                    </Grid>

                    <Grid item xs={4}>
                      <FormControlLabel
                        control={
                          <Radio
                            checked={
                              checkedFilters.last30Days
                            }
                            onChange={
                              handleRadioChange
                            }
                            name="last30Days"
                            size="small"
                            sx={{
                              "&.Mui-checked":
                              {
                                color: "rgba(56, 152, 252, 1)",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            className="table-data"
                            sx={{
                              color: checkedFilters.last30Days
                                ? "rgba(56, 152, 252, 1) !important"
                                : "rgba(74, 74, 74, 1)",
                            }}
                          >
                            Last 30 days
                          </Typography>
                        }
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Radio
                            checked={
                              checkedFilters.last6Months
                            }
                            onChange={
                              handleRadioChange
                            }
                            name="last6Months"
                            size="small"
                            sx={{
                              "&.Mui-checked":
                              {
                                color: "rgba(56, 152, 252, 1)",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            className="table-data"
                            sx={{
                              color: checkedFilters.last6Months
                                ? "rgba(56, 152, 252, 1) !important"
                                : "rgba(74, 74, 74, 1)",
                            }}
                          >
                            Last 6 months
                          </Typography>
                        }
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
              <Box sx={filterStyles.date_time_formatted}>
                <Box
                  sx={{
                    borderBottom: "1px solid #e4e4e4",
                    flexGrow: 1,
                  }}
                />
                <Typography
                  variant="body1"
                  sx={filterStyles.or_text}
                >
                  OR
                </Typography>
                <Box
                  sx={{
                    borderBottom: "1px solid #e4e4e4",
                    flexGrow: 1,
                  }}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-start",
                }}
              >
                <LocalizationProvider
                  dateAdapter={AdapterDayjs}
                >
                  <DatePicker
                    label="From date"
                    value={dateRange.fromDate}
                    onChange={(newValue) =>
                      handleDateChange("fromDate")(
                        newValue
                      )
                    }
                    sx={{ width: "100%" }}
                    slots={{
                      openPickerIcon:
                        InsertInvitationIcon,
                    }}
                    slotProps={{
                      openPickerButton: {
                        sx: { color: "#5F636880" },
                      },
                      textField: {
                        variant: "outlined",
                        fullWidth: true,
                        sx: {
                          "& .MuiInputBase-input":
                          {
                            fontFamily:
                              "Roboto",
                            fontSize:
                              "14px",
                            fontWeight: 400,
                            lineHeight:
                              "19.6px",
                            textAlign:
                              "left",
                          },
                          "& .MuiInputLabel-root":
                          {
                            fontFamily:
                              "Roboto",
                            fontSize:
                              "14px",
                            fontWeight: 400,
                            lineHeight:
                              "19.6px",
                            textAlign:
                              "left",
                          },
                        },
                      },
                    }}
                  />
                  <DatePicker
                    label="To date"
                    value={dateRange.toDate}
                    onChange={(newValue) =>
                      handleDateChange("toDate")(
                        newValue
                      )
                    }
                    sx={{ width: "100%" }}
                    slots={{
                      openPickerIcon:
                        InsertInvitationIcon,
                    }}
                    slotProps={{
                      openPickerButton: {
                        sx: { color: "#5F636880" },
                      },
                      textField: {
                        variant: "outlined",
                        fullWidth: true,
                        sx: {
                          "& .MuiInputBase-input":
                          {
                            fontFamily:
                              "Roboto",
                            fontSize:
                              "14px",
                            fontWeight: 400,
                            lineHeight:
                              "19.6px",
                            textAlign:
                              "left",
                          },
                          "& .MuiInputLabel-root":
                          {
                            fontFamily:
                              "Roboto",
                            fontSize:
                              "14px",
                            fontWeight: 400,
                            lineHeight:
                              "19.6px",
                            textAlign:
                              "left",
                          },
                        },
                      },
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
