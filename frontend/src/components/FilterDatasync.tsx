import React, { useEffect, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  Button,
  IconButton,
  Backdrop,
  TextField,
  InputAdornment,
  Collapse,
  Divider,
  FormControlLabel,
  Checkbox,
  Radio,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DnsIcon from "@mui/icons-material/Dns";
import AllInboxIcon from "@mui/icons-material/AllInbox";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import Image from "next/image";
import { filterStyles } from "../css/filterSlider";
import debounce from "lodash/debounce";
import axiosInstance from "@/axios/axiosInterceptorInstance";

interface FilterPopupProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

const FilterPopup: React.FC<FilterPopupProps> = ({
  open,
  onClose,
  onApply,
}) => {
  const [isVisitedDateOpen, setIsVisitedDateOpen] = useState(false);
  const [isLeadFunnel, setIsLeadFunnel] = useState(false);
  const [isListType, setIsListType] = useState(false);
  const [contacts, setContacts] = useState<{ name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: string[] }>(
    {
      visitedDate: [],
    }
  );
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleButtonLeadFunnelClick = (label: string) => {
    setSelectedStatus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const handleButtonListTypeClick = (label: string) => {
    setSelectedDestination((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
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
      const updatedTags = prevTags[category].filter((t) => t !== tag);

      const isLastTagRemoved = updatedTags.length === 0;

      if (category === "visitedDate" && isLastTagRemoved) {
        setDateRange({ fromDate: null, toDate: null });
      }

      if (category === "visitedDate") {
        const tagMap: { [key: string]: string } = {
          "Last week": "lastWeek",
          "Last 30 days": "last30Days",
          "Last 6 months": "last6Months",
          "All time": "allTime",
        };

        const filterName = tagMap[tag];
        if (filterName) {
          setCheckedDateFilters((prevFilters) => ({
            ...prevFilters,
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

    const filterName = tagMap[tag];

    if (filterName) {
      if (category === "visitedDate") {
        setCheckedDateFilters((prevFilters) => ({
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
        border: ".0625rem solid rgba(229, 229, 229, 1)",
        borderRadius: ".1875rem",
        px: 1,
        mr: 1,
        py: 0.5,
        fontSize: ".75rem",
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
        <CloseIcon sx={{ fontSize: ".875rem" }} />
      </IconButton>
      <Typography className="table-data">{label}</Typography>
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
  const [checkedDateFilters, setCheckedDateFilters] = useState({
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

      setCheckedDateFilters({
        lastWeek: false,
        last30Days: false,
        last6Months: false,
        allTime: false,
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
        const updatedTags = {
          ...prevTags,
          visitedDate: newTag ? [newTag] : [],
        };

        if (newTag) {
          addTag("visitedDate", newTag);
        }

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

    const isDateFilterChecked = Object.values(checkedDateFilters).some(
      (value) => value
    );

    let fromDateTime = null;
    let toDateTime = null;

    if (isDateFilterChecked) {
      if (checkedDateFilters.lastWeek) {
        fromDateTime = filterDates.lastWeek.from;
        toDateTime = filterDates.lastWeek.to;
      } else if (checkedDateFilters.last30Days) {
        fromDateTime = filterDates.last30Days.from;
        toDateTime = filterDates.last30Days.to;
      } else if (checkedDateFilters.last6Months) {
        fromDateTime = filterDates.last6Months.from;
        toDateTime = filterDates.last6Months.to;
      } else if (checkedDateFilters.allTime) {
        fromDateTime = filterDates.allTime.from;
        toDateTime = filterDates.allTime.to;
      }
    } else {
      fromDateTime = dateRange.fromDate
        ? dayjs(dateRange.fromDate).startOf("day").unix()
        : null;
      toDateTime = dateRange.toDate
        ? dayjs(dateRange.toDate).endOf("day").unix()
        : null;
    }

    // Составление объекта с фильтрами
    const filters = {
      from_date: fromDateTime,
      to_date: toDateTime,
      selected_status: selectedStatus,
      selected_destination: selectedDestination,
      searchQuery: searchQuery,
      date_filters: checkedDateFilters,
    };

    saveFiltersToSessionStorage(filters);

    return filters;
  };

  const saveFiltersToSessionStorage = (filters: {
    from_date: number | null;
    to_date: number | null;
    selected_status: string[];
    selected_destination: string[];
    searchQuery: string | null;
  }) => {
    sessionStorage.setItem("filters_data_sync", JSON.stringify(filters));
  };

  const loadFiltersFromSessionStorage = () => {
    const savedFilters = sessionStorage.getItem("filters_data_sync");
    if (savedFilters) {
      return JSON.parse(savedFilters);
    }
    return null;
  };

  const initializeFilters = () => {
    const savedFilters = loadFiltersFromSessionStorage();
    if (savedFilters) {
      setCheckedDateFilters(
        savedFilters.date_filters || {
          lastWeek: false,
          last30Days: false,
          last6Months: false,
          allTime: false,
        }
      );

      setSelectedStatus(savedFilters.selected_status || []);
      setSelectedDestination(savedFilters.selected_destination || []);
      setSearchQuery(savedFilters.searchQuery || "");

      const isAnyFilterActive = Object.values(
        savedFilters.date_filters || {}
      ).some((value) => value === true);
      if (isAnyFilterActive) {
        const tagMap: { [key: string]: string } = {
          lastWeek: "Last week",
          last30Days: "Last 30 days",
          last6Months: "Last 6 months",
          allTime: "All time",
        };
        const activeFilter = Object.keys(savedFilters.date_filters).find(
          (key) => savedFilters.date_filters[key]
        );

        if (activeFilter) {
          addTag("visitedDate", tagMap[activeFilter]);
        }
      } else {
        const fromDate = savedFilters.from_date
          ? dayjs.unix(savedFilters.from_date).format("MMM DD, YYYY")
          : null;
        const toDate = savedFilters.to_date
          ? dayjs.unix(savedFilters.to_date).format("MMM DD, YYYY")
          : null;
        const newTag =
          fromDate && toDate ? `From ${fromDate} to ${toDate}` : null;
        if (newTag) {
          addTag("visitedDate", newTag);
        }
        setDateRange({
          fromDate: savedFilters.from_date
            ? dayjs.unix(savedFilters.from_date)
            : null,
          toDate: savedFilters.to_date
            ? dayjs.unix(savedFilters.to_date)
            : null,
        });
      }
    }
  };

  useEffect(() => {
    initializeFilters();
    if (!open) {
      const filters = handleFilters();
      onApply(filters);
    }
  }, [open]);

  const handleApply = () => {
    const filters = handleFilters();
    onApply(filters);
    onClose();
  };

  const isDateFilterActive = () => {
    return (
      Object.values(checkedDateFilters).some((value) => value) ||
      (dateRange.fromDate && dateRange.toDate)
    );
  };

  // Lead Funnel
  const isLeadFunnelActive = () => {
    return selectedStatus.length > 0;
  };

  const isListTypeActive = () => {
    return selectedDestination.length > 0;
  };

  const handleRadioChange = (event: { target: { name: string } }) => {
    const { name } = event.target;

    setCheckedDateFilters((prevFilters) => {
      // Explicitly type `prevFilters` for better TypeScript support
      const prevFiltersTyped = prevFilters as Record<string, boolean>;

      // Find the previously selected radio button
      const previouslySelected = Object.keys(prevFiltersTyped).find(
        (key) => prevFiltersTyped[key]
      );

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
    setIsLeadFunnel(false);
    setIsListType(false);

    // Сброс состояния дат
    setDateRange({
      fromDate: null,
      toDate: null,
    });

    setCheckedDateFilters({
      lastWeek: false,
      last30Days: false,
      last6Months: false,
      allTime: false,
    });

    // Сброс значений фильтров
    setSelectedTags({
      visitedDate: [],
    });
    setSelectedStatus([]);
    setSearchQuery("");
    setSelectedDestination([]);
    sessionStorage.removeItem("filters");
  };

  const fetchContacts = debounce(async (query: string) => {
    if (query.length >= 3) {
      try {
        const response = await axiosInstance.get("/leads/search-contact", {
          params: { start_letter: query },
        });
        const formattedContacts = response.data.map((contact: string) => ({
          name: contact,
        }));
        setContacts(formattedContacts);
      } catch {}
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
            "@media (max-width: 37.5rem)": {
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
            padding: "0.85em 1em 0.825em 1em",
            borderBottom: ".0625rem solid #e4e4e4",
            position: "sticky",
            top: 0,
            zIndex: 1400,
            backgroundColor: "#fff",
          }}
        >
          <Typography
            variant="h6"
            className="first-sub-title"
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
            height: "100%",
            width: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              width: "100%",
              flexDirection: "column",
              pb: 2,
            }}
          >
            <TextField
              placeholder="Search by lookalikes name, source or creator"
              variant="outlined"
              fullWidth
              value={searchQuery}
              onChange={handleSearchQueryChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Button
                      disabled={true}
                      sx={{
                        textTransform: "none",
                        textDecoration: "none",
                        padding: 0,
                        minWidth: 0,
                        height: "auto",
                        width: "auto",
                      }}
                    >
                      <SearchIcon
                        sx={{ color: "rgba(101, 101, 101, 1)" }}
                        fontSize="medium"
                      />
                    </Button>
                  </InputAdornment>
                ),
                sx: {
                  fontFamily: "Roboto",
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  lineHeight: "19.6px",
                  textAlign: "left",
                  color: "rgba(112, 112, 113, 1)",
                },
              }}
              sx={{
                padding: "1em 1em 0em 1em",
                "& .MuiInputBase-input::placeholder": {
                  fontFamily: "Roboto",
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  lineHeight: "19.6px",
                  textAlign: "left",
                  color: "rgba(112, 112, 113, 1)",
                },
              }}
            />
            <Box sx={{ paddingLeft: 2, paddingRight: 2, pt: "3px" }}>
              {contacts?.length > 0 && (
                <List
                  sx={{
                    maxHeight: 200,
                    overflow: "auto",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    display: "flex",
                    flexDirection: "column",
                    padding: 0,
                  }}
                >
                  {contacts.map((contact, index) => (
                    <ListItem
                      button
                      key={index}
                      onClick={() => handleSelectContact(contact)}
                      sx={{ pl: 1 }}
                    >
                      <ListItemText
                        primaryTypographyProps={{
                          sx: {
                            fontFamily: "Nunito Sans",
                            fontSize: "12px",
                            fontWeight: 600,
                            lineHeight: "16.8px",
                            textAlign: "left",
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
          <Box sx={filterStyles.main_filter_form}>
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsListType(!isListType)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isListTypeActive() ? "visible" : "hidden",
                }}
              />
              <AllInboxIcon
                sx={{ color: "rgba(95, 99, 104, 1)", fontSize: "18px" }}
              />
              <Typography
                sx={{
                  ...filterStyles.filter_name,
                }}
              >
                Destination
              </Typography>
              <IconButton
                onClick={() => setIsListType(!isListType)}
                aria-label="toggle-content"
              >
                {isListType ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px",
                ml: 2,
              }}
            >
              {selectedDestination.map((label) => (
                <CustomChip
                  key={label}
                  label={label}
                  onDelete={() => handleButtonListTypeClick(label)}
                />
              ))}
            </Box>
            <Collapse in={isListType}>
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  flexWrap: "wrap",
                  gap: 1,
                  pt: 2,
                  pl: 2,
                }}
              >
                {/* {[
                  "All Contact",
                  "View Product",
                  "Abandoned cart",
                  "Visitor",
                ].map((label) => {
                  const isSelected = selectedDestination.includes(label);
                  return (
                    <Button
                      key={label}
                      className="second-sub-title"
                      onClick={() => handleButtonListTypeClick(label)}
                      sx={{
                        width: "calc(25% - .5rem)",
                        height: "2em",
                        textTransform: "none",
                        gap: "0rem",
                        padding: "1em 2em",
                        textWrap: "nowrap",
                        textAlign: "center",
                        borderRadius: ".25rem",
                        fontFamily: "Nunito",
                        opacity: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: isSelected
                          ? ".0625rem solid rgba(56, 152, 252, 1)"
                          : ".0625rem solid rgba(220, 220, 239, 1)",
                        color: isSelected
                          ? "rgba(56, 152, 252, 1) !important"
                          : "#5F6368 !important",
                        backgroundColor: isSelected
                          ? "rgba(237, 237, 247, 1)"
                          : "rgba(255, 255, 255, 1)",
                        lineHeight: "1.25rem !important",
                        "@media (max-width:68.75rem)": {
                          width: "48%",
                          height: "auto",
                          maxHeight: "0.5em",
                        },
                        "@media (max-width:37.5rem)": {
                          width: "48%",
                        },
                      }}
                    >
                      {label}
                    </Button>
                  );
                })} */}

                {/* <Box
                  sx={{
                    ...filterStyles.filter_dropdown,
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0 }}
                  >
                    <FormControlLabel
                      sx={{ fontFamily: "Nunito Sans", fontWeight: 100 }}
                      control={
                        <Checkbox
                          checked={checkedFiltersPageVisits.page}
                          onChange={handleCheckboxChangePageVisits}
                          size="small"
                          name="page"
                          sx={{
                            "&.Mui-checked": {
                              color: "rgba(56, 152, 252, 1)",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          className="table-data"
                          sx={{
                            color: checkedFiltersPageVisits.page
                              ? "rgba(56, 152, 252, 1) !important"
                              : "rgba(74, 74, 74, 1)",
                          }}
                        >
                          CSV
                        </Typography>
                      }
                    />
                    <FormControlLabel
                      sx={{ fontFamily: "Nunito Sans", fontWeight: 100 }}
                      control={
                        <Checkbox
                          checked={checkedFiltersPageVisits.two_page}
                          onChange={handleCheckboxChangePageVisits}
                          size="small"
                          name="two_page"
                          sx={{
                            "&.Mui-checked": {
                              color: "rgba(56, 152, 252, 1)",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          className="table-data"
                          sx={{
                            color: checkedFiltersPageVisits.two_page
                              ? "rgba(56, 152, 252, 1) !important"
                              : "rgba(74, 74, 74, 1)",
                          }}
                        >
                          S3
                        </Typography>
                      }
                    />
                  </Box>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0 }}
                  >
                    <FormControlLabel
                      sx={{ fontFamily: "Nunito Sans", fontWeight: 100 }}
                      control={
                        <Checkbox
                          checked={checkedFiltersPageVisits.page}
                          onChange={handleCheckboxChangePageVisits}
                          size="small"
                          name="page"
                          sx={{
                            "&.Mui-checked": {
                              color: "rgba(56, 152, 252, 1)",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          className="table-data"
                          sx={{
                            color: checkedFiltersPageVisits.page
                              ? "rgba(56, 152, 252, 1) !important"
                              : "rgba(74, 74, 74, 1)",
                          }}
                        >
                          Meta
                        </Typography>
                      }
                    />
                    <FormControlLabel
                      sx={{ fontFamily: "Nunito Sans", fontWeight: 100 }}
                      control={
                        <Checkbox
                          checked={checkedFiltersPageVisits.two_page}
                          onChange={handleCheckboxChangePageVisits}
                          size="small"
                          name="two_page"
                          sx={{
                            "&.Mui-checked": {
                              color: "rgba(56, 152, 252, 1)",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          className="table-data"
                          sx={{
                            color: checkedFiltersPageVisits.two_page
                              ? "rgba(56, 152, 252, 1) !important"
                              : "rgba(74, 74, 74, 1)",
                          }}
                        >
                          Google Ads
                        </Typography>
                      }
                    />
                  </Box>

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0 }}
                  >
                    <FormControlLabel
                      sx={{ fontFamily: "Nunito Sans", fontWeight: 100 }}
                      control={
                        <Checkbox
                          checked={checkedFiltersPageVisits.page}
                          onChange={handleCheckboxChangePageVisits}
                          size="small"
                          name="page"
                          sx={{
                            "&.Mui-checked": {
                              color: "rgba(56, 152, 252, 1)",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          className="table-data"
                          sx={{
                            color: checkedFiltersPageVisits.page
                              ? "rgba(56, 152, 252, 1) !important"
                              : "rgba(74, 74, 74, 1)",
                          }}
                        >
                          Bing Ads
                        </Typography>
                      }
                    />
                    <FormControlLabel
                      sx={{ fontFamily: "Nunito Sans", fontWeight: 100 }}
                      control={
                        <Checkbox
                          checked={checkedFiltersPageVisits.two_page}
                          onChange={handleCheckboxChangePageVisits}
                          size="small"
                          name="two_page"
                          sx={{
                            "&.Mui-checked": {
                              color: "rgba(56, 152, 252, 1)",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          className="table-data"
                          sx={{
                            color: checkedFiltersPageVisits.two_page
                              ? "rgba(56, 152, 252, 1) !important"
                              : "rgba(74, 74, 74, 1)",
                          }}
                        >
                          Salesforce
                        </Typography>
                      }
                    />
                  </Box>

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0 }}
                  >
                    <FormControlLabel
                      sx={{ fontFamily: "Nunito Sans", fontWeight: 100 }}
                      control={
                        <Checkbox
                          checked={checkedFiltersPageVisits.page}
                          onChange={handleCheckboxChangePageVisits}
                          size="small"
                          name="page"
                          sx={{
                            "&.Mui-checked": {
                              color: "rgba(56, 152, 252, 1)",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          className="table-data"
                          sx={{
                            color: checkedFiltersPageVisits.page
                              ? "rgba(56, 152, 252, 1) !important"
                              : "rgba(74, 74, 74, 1)",
                          }}
                        >
                          Hubsplot
                        </Typography>
                      }
                    />
                    <FormControlLabel
                      sx={{ fontFamily: "Nunito Sans", fontWeight: 100 }}
                      control={
                        <Checkbox
                          checked={checkedFiltersPageVisits.two_page}
                          onChange={handleCheckboxChangePageVisits}
                          size="small"
                          name="two_page"
                          sx={{
                            "&.Mui-checked": {
                              color: "rgba(56, 152, 252, 1)",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          className="table-data"
                          sx={{
                            color: checkedFiltersPageVisits.two_page
                              ? "rgba(56, 152, 252, 1) !important"
                              : "rgba(74, 74, 74, 1)",
                          }}
                        >
                          MailChimp
                        </Typography>
                      }
                    />
                  </Box>

                  <Box>
                    <FormControlLabel
                      sx={{ fontFamily: "Nunito Sans", fontWeight: 100 }}
                      control={
                        <Checkbox
                          checked={checkedFiltersPageVisits.two_page}
                          onChange={handleCheckboxChangePageVisits}
                          size="small"
                          name="two_page"
                          sx={{
                            "&.Mui-checked": {
                              color: "rgba(56, 152, 252, 1)",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          className="table-data"
                          sx={{
                            color: checkedFiltersPageVisits.two_page
                              ? "rgba(56, 152, 252, 1) !important"
                              : "rgba(74, 74, 74, 1)",
                          }}
                        >
                          LinkedIn
                        </Typography>
                      }
                    />
                  </Box>
                </Box> */}

                {[
                  "CSV",
                  "S3",
                  "Meta",
                  "Google Ads",
                  "Bing Ads",
                  "Hubsplot",
                  "Salesforce",
                  "Mailchimp",
                  "LinkedIn",
                ].map((label) => {
                  const isSelected = selectedDestination.includes(label);
                  return (
                    <Button
                      key={label}
                      className="second-sub-title"
                      onClick={() => handleButtonListTypeClick(label)}
                      sx={{
                        width: "calc(33% - .5rem)",
                        height: "2em",
                        textTransform: "none",
                        gap: "0rem",
                        padding: "1em 2em",
                        textWrap: "nowrap",
                        textAlign: "center",
                        borderRadius: ".25rem",
                        fontFamily: "Nunito",
                        opacity: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: isSelected
                          ? ".0625rem solid rgba(56, 152, 252, 1)"
                          : ".0625rem solid rgba(220, 220, 239, 1)",
                        color: isSelected
                          ? "rgba(56, 152, 252, 1) !important"
                          : "#5F6368 !important",
                        backgroundColor: isSelected
                          ? "rgba(237, 237, 247, 1)"
                          : "rgba(255, 255, 255, 1)",
                        lineHeight: "1.25rem !important",
                        "@media (max-width:68.75rem)": {
                          width: "48%",
                          height: "auto",
                          maxHeight: "0.5em",
                        },
                        "@media (max-width:37.5rem)": {
                          width: "48%",
                        },
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
          <Box sx={filterStyles.main_filter_form}>
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsLeadFunnel(!isLeadFunnel)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isLeadFunnelActive() ? "visible" : "hidden",
                }}
              />
              <DnsIcon
                sx={{ color: "rgba(95, 99, 104, 1)", fontSize: "18px" }}
              />
              <Typography
                sx={{
                  ...filterStyles.filter_name,
                }}
              >
                Status
              </Typography>
              {selectedStatus.map((label) => (
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
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  flexWrap: "wrap",
                  gap: 1,
                  pt: 2,
                  pl: 2,
                }}
              >
                {["Synced", "Failed", "In Progress", "Disabled"].map(
                  (label) => {
                    const isSelected = selectedStatus.includes(label);
                    return (
                      <Button
                        key={label}
                        className="second-sub-title"
                        onClick={() => handleButtonLeadFunnelClick(label)}
                        sx={{
                          width: "calc(25% - .5rem)",
                          height: "2em",
                          textTransform: "none",
                          gap: "0rem",
                          padding: "1em 2em",
                          textWrap: "nowrap",
                          textAlign: "center",
                          borderRadius: ".25rem",
                          fontFamily: "Nunito",
                          opacity: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: isSelected
                            ? ".0625rem solid rgba(56, 152, 252, 1)"
                            : ".0625rem solid rgba(220, 220, 239, 1)",
                          color: isSelected
                            ? "rgba(56, 152, 252, 1) !important"
                            : "#5F6368 !important",
                          backgroundColor: isSelected
                            ? "rgba(237, 237, 247, 1)"
                            : "rgba(255, 255, 255, 1)",
                          lineHeight: "1.25rem !important",
                          "@media (max-width:68.75rem)": {
                            width: "48%",
                            height: "auto",
                            maxHeight: "0.5em",
                          },
                          "@media (max-width:37.5rem)": {
                            width: "48%",
                          },
                        }}
                      >
                        {label}
                      </Button>
                    );
                  }
                )}
              </Box>
            </Collapse>
          </Box>
          {/* Created date */}
          <Box
            sx={{
              width: "100%",
              padding: "0.5em",
              border: ".0625rem solid rgba(228, 228, 228, 1)",
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
              onClick={() => setIsVisitedDateOpen(!isVisitedDateOpen)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isDateFilterActive() ? "visible" : "hidden",
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
                  ...filterStyles.filter_name,
                }}
              >
                Created Date
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
                  ...filterStyles.filter_dropdown,
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedDateFilters.lastWeek}
                        onChange={handleRadioChange}
                        name="lastWeek"
                        size="small"
                        sx={{
                          "&.Mui-checked": {
                            color: "rgba(56, 152, 252, 1)",
                          },
                        }}
                      />
                    }
                    label={
                      <Typography
                        className="table-data"
                        sx={{
                          color: checkedDateFilters.lastWeek
                            ? "rgba(56, 152, 252, 1) !important"
                            : "rgba(74, 74, 74, 1)",
                        }}
                      >
                        Last week
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedDateFilters.last30Days}
                        onChange={handleRadioChange}
                        name="last30Days"
                        size="small"
                        sx={{
                          "&.Mui-checked": {
                            color: "rgba(56, 152, 252, 1)",
                          },
                        }}
                      />
                    }
                    label={
                      <Typography
                        className="table-data"
                        sx={{
                          color: checkedDateFilters.last30Days
                            ? "rgba(56, 152, 252, 1) !important"
                            : "rgba(74, 74, 74, 1)",
                        }}
                      >
                        Last 30 days
                      </Typography>
                    }
                  />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedDateFilters.last6Months}
                        onChange={handleRadioChange}
                        name="last6Months"
                        size="small"
                        sx={{
                          "&.Mui-checked": {
                            color: "rgba(56, 152, 252, 1)",
                          },
                        }}
                      />
                    }
                    label={
                      <Typography
                        className="table-data"
                        sx={{
                          color: checkedDateFilters.last6Months
                            ? "rgba(56, 152, 252, 1) !important"
                            : "rgba(74, 74, 74, 1)",
                        }}
                      >
                        Last 6 months
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Radio
                        checked={checkedDateFilters.allTime}
                        onChange={handleRadioChange}
                        name="allTime"
                        size="small"
                        sx={{
                          "&.Mui-checked": {
                            color: "rgba(56, 152, 252, 1)",
                          },
                        }}
                      />
                    }
                    label={
                      <Typography
                        className="table-data"
                        sx={{
                          color: checkedDateFilters.allTime
                            ? "rgba(56, 152, 252, 1) !important"
                            : "rgba(74, 74, 74, 1)",
                        }}
                      >
                        All time
                      </Typography>
                    }
                  />
                </Box>
              </Box>
              <Box sx={filterStyles.date_time_formatted}>
                <Box
                  sx={{ borderBottom: ".0625rem solid #e4e4e4", flexGrow: 1 }}
                />
                <Typography variant="body1" sx={filterStyles.or_text}>
                  OR
                </Typography>
                <Box
                  sx={{ borderBottom: ".0625rem solid #e4e4e4", flexGrow: 1 }}
                />
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
                    slotProps={{
                      textField: {
                        variant: "outlined",
                        fullWidth: true,
                        sx: {
                          "& .MuiInputBase-input": {
                            fontFamily: "Roboto",
                            fontSize: ".875rem",
                            fontWeight: 400,
                            lineHeight: "1.225rem",
                            textAlign: "left",
                          },
                          "& .MuiInputLabel-root": {
                            fontFamily: "Roboto",
                            fontSize: ".875rem",
                            fontWeight: 400,
                            lineHeight: "1.225rem",
                            textAlign: "left",
                          },
                        },
                      },
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
                          "& .MuiInputBase-input": {
                            fontFamily: "Roboto",
                            fontSize: ".875rem",
                            fontWeight: 400,
                            lineHeight: "1.225rem",
                            textAlign: "left",
                          },
                          "& .MuiInputLabel-root": {
                            fontFamily: "Roboto",
                            fontSize: ".875rem",
                            fontWeight: 400,
                            lineHeight: "1.225rem",
                            textAlign: "left",
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
              visibility: "hidden",
            }}
          ></Box>
          {/* Buttons */}
          <Box
            sx={{
              position: "fixed ",
              width: "40%",
              bottom: 0,
              right: 0,
              zIndex: 1302,
              backgroundColor: "rgba(255, 255, 255, 1)",
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "1em",
              padding: "1em",
              gap: 3,
              borderTop: ".0625rem solid rgba(228, 228, 228, 1)",
              "@media (max-width: 37.5rem)": { width: "100%" },
            }}
          >
            <Button
              variant="contained"
              onClick={handleClearFilters}
              className="second-sub-title"
              sx={{
                color: "rgba(56, 152, 252, 1) !important",
                backgroundColor: "#fff",
                border: " .0625rem solid rgba(56, 152, 252, 1)",
                textTransform: "none",
                padding: "0.75em 2.5em",
                "&:hover": {
                  backgroundColor: "transparent",
                },
              }}
            >
              Clear all
            </Button>
            <Button
              variant="contained"
              onClick={handleApply}
              className="second-sub-title"
              sx={{
                backgroundColor: "rgba(56, 152, 252, 1)",
                color: "rgba(255, 255, 255, 1) !important",
                textTransform: "none",
                padding: "0.75em 2.5em",
                "&:hover": {
                  backgroundColor: "rgba(56, 152, 252, 1)",
                },
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
