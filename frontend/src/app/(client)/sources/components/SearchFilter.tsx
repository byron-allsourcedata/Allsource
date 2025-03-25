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
  FormControlLabel,
  Checkbox,
  Radio,
  List,
  ListItem,
  ListItemText,
  FormGroup,
  Grid,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import WebIcon from "@mui/icons-material/Web";
import {
  LocalizationProvider,
  DatePicker,
} from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { filterStyles } from "@/css/filterSlider";
import debounce from "lodash/debounce";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import InsertInvitationIcon from "@mui/icons-material/InsertInvitation";
import AllInboxIcon from "@mui/icons-material/AllInbox";
import DnsIcon from "@mui/icons-material/Dns";
import { margin } from "@mui/system";
import ExpandableCheckboxFilter from "./ExpandableCheckboxFilter";

const csvTypes = ["Customer Conversions", "Failed Leads", "Interest"];
const pixelTypes = [
  "Visitor",
  "Viewed Product",
  "Abandoned Cart",
  "Converted Sales",
];

const dateTypes: Record<string, string> = {
  today: "Today",
  last7Days: "Last 7 days",
  last30Days: "Last 30 days",
  last6Months: "Last 6 months",
}

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
  const [isCreatedDateOpen, setIsCreatedDateOpen] = useState(false);

  const [contacts, setContacts] = useState<{ name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<{
    [key: string]: string[];
  }>({
    createdDate: [],
  });
  const [buttonFilters, setButtonFilters] = useState<ButtonFilters>(null);
  const [searchQuery, setSearchQuery] = useState("");

  type ButtonFilters = {
    button: string;
    dateRange: {
      fromDate: number;
      toDate: number;
    };
    selectedFunnels: string[];
  } | null;

  // Source
  const [isSource, setIsSource] = useState<boolean>(false);
  const [selectedSource, setSelectedSource] = useState<string[]>([]);
  const handleButtonSourceClick = (label: string) => {
    const mappedSource = sourceMapping[label];
    setSelectedSource((prev) =>
      prev.includes(mappedSource)
        ? prev.filter((item) => item !== mappedSource)
        : [...prev, mappedSource]
    );
  };
  const isSourceFilterActive = () => selectedSource.length > 0;
  const sourceMapping: Record<string, string> = {
    CSV: "CSV",
    Pixel: "Pixel",
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
  const [isDomainFilterOpen, setIsDomainFilterOpen] =
    useState<boolean>(false);
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

  // Logic
  const getAllowedTypes = (): string[] => {
    let allowed: string[] = [];
    if (selectedSource.includes(sourceMapping["CSV"])) {
      allowed = allowed.concat(csvTypes);
    }
    if (selectedSource.includes(sourceMapping["Pixel"])) {
      allowed = allowed.concat(pixelTypes);
    }
    if (selectedSource.length == 0) {
      allowed = allowed.concat(csvTypes);
      allowed = allowed.concat(pixelTypes);
    }
    return Array.from(new Set(allowed));
  };

  useEffect(() => {
    const allowed = getAllowedTypes();
    setSelectedTypes((prevSelected) =>
      prevSelected.filter((type) => allowed.includes(type))
    );
  }, [selectedSource]);

  useEffect(() => {
    if (
      selectedSource.length > 0 &&
      !selectedSource.includes(sourceMapping["Pixel"])
    ) {
      setSelectedDomains([]);
    }
  }, [selectedSource]);

  const addTag = (category: string, tag: string) => {
    setSelectedTags((prevTags) => {
      const newTags =
        category === "createdDate" ? [tag] : [...prevTags[category]];
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
      [dateTypes.today]: "today",
      [dateTypes.last7Days]: "last7Days",
      [dateTypes.last30Days]: "last30Days",
      [dateTypes.last6Months]: "last6Months",
    };

    const tagMapTime: TagMap = {
      "Morning 12AM - 11AM": "morning",
      "Afternoon 11AM - 5PM": "afternoon",
      "Evening 5PM - 9PM": "evening",
      "All day": "all_day",
    };

    const mapToUse = category === "createdDate" ? tagMap : tagMapTime;
    const filterName = mapToUse[tag];

    if (filterName) {
      if (category === "createdDate") {
        setCheckedFilters((prevFilters) => ({
          ...prevFilters,
          [filterName]: isChecked,
        }));
      }
    }
  };

  interface CustomChipProps {
    label: string;
    onDelete: (
      event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => void;
  }

  const CustomChip: React.FC<CustomChipProps> = ({ label, onDelete }) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 1)",
        border: "1px solid rgba(229, 229, 229, 1)",
        borderRadius: "3px",
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
      <Typography className="table-data">{label}</Typography>
    </Box>
  );

  // Date
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

      console.log(newValue);

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
        const updatedTags = {
          ...prevTags,
          createdDate: newTag ? [newTag] : [],
        };

        // If a new label exists, add it
        if (newTag) {
          addTag("createdDate", newTag);
        }

        // If the label has been replaced or removed, clear the date range
        if (!newTag && prevTags.createdDate.length > 0) {
          setDateRange({ fromDate: null, toDate: null });
        } else if (newTag && oldFromDate && oldToDate) {
          removeTag(
            "createdDate",
            `From ${oldFromDate} to ${oldToDate}`
          );
        }

        return updatedTags;
      });

      return updatedRange;
    });
  };

  // Page
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
    const isDateFilterChecked = Object.values(checkedFilters).some(
      (value) => value
    );

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
      ...buttonFilters,
      from_date: fromDateTime,
      to_date: toDateTime,
      selectedSource,
      selectedTypes,
      selectedDomains,
      searchQuery,
      createdDate: selectedTags.createdDate,
      checkedFilters,
      dateRange: {
        fromDate: dateRange.fromDate
          ? dateRange.fromDate.valueOf()
          : null,
        toDate: dateRange.toDate ? dateRange.toDate.valueOf() : null,
      },
    };

    saveFiltersToSessionStorage(filters);
    return filters;
  };

  const saveFiltersToSessionStorage = (filters: {
    from_date: number | null;
    to_date: number | null;
    selectedSource: string[];
    selectedTypes: string[];
    selectedDomains: string[];
    searchQuery: string;
    createdDate: string[];
    checkedFilters: {today: boolean; last7Days: boolean; last30Days:boolean; last6Months: boolean};
    dateRange?:
    | { fromDate: number | null; toDate: number | null }
    | undefined;
  }) => {
    sessionStorage.setItem("filtersBySource", JSON.stringify(filters));
  };

  const loadFiltersFromSessionStorage = () => {
    const savedFilters = sessionStorage.getItem("filtersBySource");
    if (savedFilters) {
      return JSON.parse(savedFilters);
    }
    return null;
  };

  const initializeFilters = () => {
    const savedFilters = loadFiltersFromSessionStorage();
    if (savedFilters) {
      setCheckedFilters(
        savedFilters.checkedFilters || {
          today: false,
          last7Days: false,
          last30Days: false,
          last6Months: false,
        }
      );

      setSelectedTypes(savedFilters.selectedTypes || []);
      setSelectedSource(savedFilters.selectedSource || []);
      setSelectedDomains(savedFilters.selectedDomains || []);
      setSearchQuery(savedFilters.searchQuery || "");

      const isAnyFilterActive = Object.values(
        savedFilters.checkedFilters || {}
      ).some((value) => value === true);
      if (isAnyFilterActive) {
        setButtonFilters(savedFilters.button);
        const tagMap: { [key: string]: string } = {
          today: dateTypes.today,
          last7Days: dateTypes.last7dDys,
          last30Days: dateTypes.last30Days,
          last6Months: dateTypes.last6Months,
        };

        const activeFilter = Object.keys(
          savedFilters.checkedFilters
        ).find((key) => savedFilters.checkedFilters[key]);

        if (activeFilter) {
          addTag("createdDate", tagMap[activeFilter]);
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
          addTag("createdDate", newTag);
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
      setButtonFilters(savedFilters.button);
    }
  };

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
      Object.values(checkedFilters).some((value) => value) || // Checking checkboxes for dates
      (dateRange.fromDate && dateRange.toDate) // Validate user's date range selection
    );
  };

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

  const handleClearFilters = () => {
    setIsCreatedDateOpen(false);
    setIsSource(false);

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

    // Reset filter values
    setSelectedTags({
      createdDate: [],
    });
    setSelectedSource([]);
    setButtonFilters(null);
    setSearchQuery("");

    sessionStorage.removeItem("filtersBySource");
  };

  const fetchContacts = debounce(async (query: string) => {
    if (query.length >= 3) {
      try {
        const response = await axiosInstance.get(
          "/leads/search-contact",
          {
            params: { start_letter: query },
          }
        );
        const formattedContacts = response.data.map(
          (contact: string) => ({ name: contact })
        );
        setContacts(formattedContacts);
      } catch { }
    } else {
      setContacts([]);
    }
  }, 300);

  const handleSearchQueryChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchContacts(value);
  };

  const handleSelectContact = (contact: { name: string }) => {
    setSearchQuery(contact.name);
    setContacts([]);
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

  const formatFilterLabel = (key: keyof typeof checkedFilters) => {
    const labels: Record<keyof typeof checkedFilters, string> = {
      today: dateTypes.today,
      last7Days: dateTypes.last7Days,
      last30Days: dateTypes.last30Days,
      last6Months: dateTypes.last6Months,
    };
    return labels[key];
  };

  const clearDateFilter = () => {
    setSelectedTags({
      createdDate: [],
    });

    setCheckedFilters({
      today: false,
      last7Days: false,
      last30Days: false,
      last6Months: false,
    });
    
    setDateRange({ fromDate: null, toDate: null });
  };

  const [domains, setDomains] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(10);

  const fetchDomains = async () => {
    try {
      const response = await axiosInstance.get(`/audience-sources/domains?page=${page}&per_page=${perPage}`);
      const { domains: newDomains, has_more } = response.data;
  
      setDomains((prevDomains) => {
        const allDomains = [...prevDomains, ...newDomains];
        const uniqueDomains = Array.from(new Set(allDomains));
        return uniqueDomains;
      });
      setHasMore(has_more);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };
  
  useEffect(() => {
    fetchDomains();
  }, [page]);
  
  const loadMoreDomains = () => {
    if (hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
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
              backgroundColor: "rgba(0, 0, 0, 0.1)",
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
            zIndex: 9900,
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
            overflowY: "auto",
            flexGrow: 1,
            height: "100vh",
            border: "1px solid #ccc",
            marginBottom: "75px", // Fix scroll
          }}
        >
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
                          sx={{
                            color: "rgba(101, 101, 101, 1)",
                          }}
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
              <Box
                sx={{
                  paddingLeft: 2,
                  paddingRight: 2,
                  pt: "3px",
                }}
              >
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
                        onClick={() =>
                          handleSelectContact(contact)
                        }
                        sx={{ pl: 1 }}
                      >
                        <ListItemText
                          primaryTypographyProps={{
                            sx: {
                              fontFamily:
                                "Nunito Sans",
                              fontSize: "12px",
                              fontWeight: 600,
                              lineHeight:
                                "16.8px",
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
            {/* Source */}
            <Box sx={filterStyles.main_filter_form}>
              <Box
                sx={filterStyles.filter_form}
                onClick={() => setIsSource(!isSource)}
              >
                <Box
                  sx={{
                    ...filterStyles.active_filter_dote,
                    visibility: isSourceFilterActive()
                      ? "visible"
                      : "hidden",
                  }}
                />
                <AllInboxIcon
                  sx={{ fontSize: 20, color: "#5F6368" }}
                />
                <Typography
                  sx={{
                    ...filterStyles.filter_name,
                  }}
                >
                  Source
                </Typography>
                {selectedSource.map((mappedLabel) => {
                  const originalLabel = Object.keys(
                    sourceMapping
                  ).find(
                    (key) =>
                      sourceMapping[key] === mappedLabel
                  ) as keyof typeof sourceMapping;
                  return (
                    <CustomChip
                      key={mappedLabel}
                      label={originalLabel}
                      onDelete={() =>
                        handleButtonSourceClick(
                          originalLabel
                        )
                      }
                    />
                  );
                })}
                <IconButton
                  onClick={() => setIsSource(!isSource)}
                  aria-label="toggle-content"
                >
                  {isSource ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </IconButton>
              </Box>

              <Collapse in={isSource}>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    pt: 1,
                    pl: 2,
                    pb: 0.75,
                  }}
                >
                  {["CSV", "Pixel"].map((label) => {
                    const mappedSource =
                      sourceMapping[label];
                    const isSelected =
                      selectedSource.includes(
                        mappedSource
                      );

                    return (
                      <Button
                        key={label}
                        onClick={() =>
                          handleButtonSourceClick(
                            label
                          )
                        }
                        className="second-sub-title"
                        sx={{
                          width: "calc(25% - 5px)",
                          height: "2em",
                          textTransform: "none",
                          textWrap: "nowrap",
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
                          lineHeight:
                            "20px !important",
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
                onClick={() =>
                  setIsLeadFunnelOpen(!isLeadFunnelOpen)
                }
              >
                <Box
                  sx={{
                    ...filterStyles.active_filter_dote,
                    visibility: isTypesFilterActive()
                      ? "visible"
                      : "hidden",
                  }}
                />
                <DnsIcon
                  sx={{ fontSize: 20, color: "#5F6368" }}
                />
                <Typography sx={filterStyles.filter_name}>
                  Type
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    pt: 1,
                  }}
                >
                  {selectedTypes.map((label) => (
                    <CustomChip
                      key={label}
                      label={label}
                      onDelete={() =>
                        handleRemoveLabel(label)
                      }
                    />
                  ))}
                </Box>
                <IconButton
                  onClick={() =>
                    setIsLeadFunnelOpen(!isLeadFunnelOpen)
                  }
                  aria-label="toggle-content"
                >
                  {isLeadFunnelOpen ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </IconButton>
              </Box>
              <Collapse in={isLeadFunnelOpen}>
                <ExpandableCheckboxFilter selectedOptions={selectedTypes}
                    allowedOptions={getAllowedTypes()}
                    onOptionToggle={handleCheckboxChange}
                    placeholder="Select Type" 
                    sx={{ pt: 1, pl: 2 }}/>
              </Collapse>
            </Box>
            {(selectedSource.length === 0 ||
              selectedSource.includes(
                sourceMapping["Pixel"]
              )) && (
                <Box sx={filterStyles.main_filter_form}>
                  <Box
                    sx={filterStyles.filter_form}
                    onClick={() =>
                      setIsDomainFilterOpen(
                        !isDomainFilterOpen
                      )
                    }
                  >
                    <Box
                      sx={{
                        ...filterStyles.active_filter_dote,
                        visibility: isDomainActive()
                          ? "visible"
                          : "hidden",
                      }}
                    />
                    <WebIcon
                      sx={{ fontSize: 20, color: "#5F6368" }}
                    />
                    <Typography sx={filterStyles.filter_name}>
                      Domain
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        pt: 1,
                      }}
                    >
                      {selectedDomains.map((domain) => (
                        <CustomChip
                          key={domain}
                          label={domain}
                          onDelete={() =>
                            handleRemoveDomain(domain)
                          }
                        />
                      ))}
                    </Box>

                    <IconButton
                      onClick={() =>
                        setIsDomainFilterOpen(
                          !isDomainFilterOpen
                        )
                      }
                      aria-label="toggle-content"
                    >
                      {isDomainFilterOpen ? (
                        <ExpandLessIcon />
                      ) : (
                        <ExpandMoreIcon />
                      )}
                    </IconButton>
                  </Box>

                  <Collapse in={isDomainFilterOpen}>
                  <ExpandableCheckboxFilter
                    selectedOptions={selectedDomains}
                    allowedOptions={domains}
                    onOptionToggle={handleDomainCheckboxChange}
                    placeholder="Select Domain"
                    sx={{ pt: 1, pl: 2 }}/>
                  </Collapse>
                </Box>
              )}
            {/* Created date */}
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
                  Created date
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
                                  color: "rgba(80, 82, 178, 1)",
                                },
                              }}
                            />
                          }
                          label={
                            <Typography
                              className="table-data"
                              sx={{
                                color: checkedFilters.today
                                  ? "rgba(80, 82, 178, 1) !important"
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
                                  color: "rgba(80, 82, 178, 1)",
                                },
                              }}
                            />
                          }
                          label={
                            <Typography
                              className="table-data"
                              sx={{
                                color: checkedFilters.last7Days
                                  ? "rgba(80, 82, 178, 1) !important"
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
                                  color: "rgba(80, 82, 178, 1)",
                                },
                              }}
                            />
                          }
                          label={
                            <Typography
                              className="table-data"
                              sx={{
                                color: checkedFilters.last30Days
                                  ? "rgba(80, 82, 178, 1) !important"
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
                                  color: "rgba(80, 82, 178, 1)",
                                },
                              }}
                            />
                          }
                          label={
                            <Typography
                              className="table-data"
                              sx={{
                                color: checkedFilters.last6Months
                                  ? "rgba(80, 82, 178, 1) !important"
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
                borderTop: "1px solid rgba(228, 228, 228, 1)",
                "@media (max-width: 600px)": { width: "100%" },
              }}
            >
              <Button
                variant="contained"
                onClick={handleClearFilters}
                className="second-sub-title"
                sx={{
                  color: "rgba(80, 82, 178, 1) !important",
                  backgroundColor: "#fff",
                  border: " 1px solid rgba(80, 82, 178, 1)",
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
                  backgroundColor: "rgba(80, 82, 178, 1)",
                  color: "rgba(255, 255, 255, 1) !important",
                  textTransform: "none",
                  padding: "0.75em 2.5em",
                  "&:hover": {
                    backgroundColor: "rgba(80, 82, 178, 1)",
                  },
                }}
              >
                Apply
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default FilterPopup;
