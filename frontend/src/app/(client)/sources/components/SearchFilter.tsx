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

const csvTypes = ["Customer Conversions", "Failed Leads", "Interest"];
const pixelTypes = ["Visitor", "Viewed Product", "Abandoned Cart", "Converted Sales"];



interface FilterPopupProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

const FilterPopup: React.FC<FilterPopupProps> = ({ open, onClose, onApply }) => {
  const [isCreatedDateOpen, setIsCreatedDateOpen] = useState(false);

  const [contacts, setContacts] = useState<{ name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: string[] }>(
    {
      createdDate: [],
      visitedTime: [],
      region: [],
      pageVisits: [],
      timeSpents: [],
    }
  );
  const [regions, setTags] = useState<string[]>([]);
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

    // Logic
    const getAllowedTypes = (): string[] => {
        let allowed: string[] = [];
        if (selectedStatus.includes(statusMapping["CSV"])) {
          allowed = allowed.concat(csvTypes);
        }
        if (selectedStatus.includes(statusMapping["Pixel"])) {
          allowed = allowed.concat(pixelTypes);
        }
        if (selectedStatus.length == 0) {
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
      }, [selectedStatus]);

      useEffect(() => {
        if (selectedStatus.length > 0 && !selectedStatus.includes(statusMapping["Pixel"])) {
          setSelectedDomains([]);
        }
      }, [selectedStatus]);

  const addTag = (category: string, tag: string) => {
    setSelectedTags((prevTags) => {
      const newTags = category === "createdDate" ? [tag] : [...prevTags[category]]; // Очистка старых значений
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
  
      // Если удалена последняя дата, очищаем состояние
      if (category === "createdDate") {
        setDateRange({ fromDate: null, toDate: null });
      }
  
      // Сброс чекбокса, если дата удалена
      if (category === "createdDate") {
        const tagMap: { [key: string]: string } = {
          "Today": "today",
          "Last 7 days": "last7Days",
          "Last 30 days": "last30Days",
          "Last 6 months": "last6Months",
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
        "Today": "today",
        "Last 7 days": "last7Days",
        "Last 30 days": "last30Days",
        "Last 6 months": "last6Months",
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
          removeTag("createdDate", `From ${oldFromDate} to ${oldToDate}`);
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
    const isDateFilterChecked = Object.values(checkedFilters).some((value) => value);

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
        selectedStatus, 
        selectedTypes, 
        selectedDomains,               
        searchQuery, 
        createdDate: selectedTags.createdDate, 
        
        dateRange: {
            fromDate: dateRange.fromDate ? dateRange.fromDate.valueOf() : null,
            toDate: dateRange.toDate ? dateRange.toDate.valueOf() : null,
          }
      };

      saveFiltersToSessionStorage(filters);
      return filters;
  };


  const saveFiltersToSessionStorage = (filters: {
    from_date: number | null;
    to_date: number | null;
    selectedStatus: string[];
    selectedTypes: string[];
    selectedDomains: string[];
    searchQuery: string;
    createdDate: string[];
    dateRange?: { fromDate: number | null; toDate: number | null; } | undefined;
  }) => {
    sessionStorage.setItem('filtersBySource', JSON.stringify(filters));
  };
  

  const loadFiltersFromSessionStorage = () => {
    const savedFilters = sessionStorage.getItem('filtersBySource');
    if (savedFilters) {
      return JSON.parse(savedFilters);
    }
    return null;
  };

  const initializeFilters = () => {
    const savedFilters = loadFiltersFromSessionStorage();
    if (savedFilters) {


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

      setCheckedFilters(savedFilters.checkedFilters || {
        today: false,
        last7Days: false,
        last30Days: false,
        last6Months: false,
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

      setSelectedTypes(savedFilters.selectedTypes || []);
      setSelectedStatus(savedFilters.selectedStatus || []);
      setSelectedDomains(savedFilters.selectedDomains || []);
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

      }

      const isAnyFilterActive = Object.values(savedFilters.checkedFilters || {}).some(value => value === true);
      if (isAnyFilterActive) {
        setButtonFilters(savedFilters.button);
        const tagMap: { [key: string]: string } = {
          today: "Today",
          last7Days: "Last 7 days",
          last30Days: "Last 30 days",
          last6Months: "Last 6 months",
        };
        const activeFilter = Object.keys(savedFilters.checkedFilters).find(key => savedFilters.checkedFilters[key]);

        if (activeFilter) {
          addTag("createdDate", tagMap[activeFilter]);
        }
      } else {
        const fromDate = savedFilters.from_date ? dayjs.unix(savedFilters.from_date).format('MMM DD, YYYY') : null;
        const toDate = savedFilters.to_date ? dayjs.unix(savedFilters.to_date).format('MMM DD, YYYY') : null;
        const newTag = fromDate && toDate ? `From ${fromDate} to ${toDate}` : null;
        if (newTag) {
          addTag("createdDate", newTag);
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
        removeTag("createdDate", tagMap[previouslySelected]);
      }

      setDateRange({ fromDate: null, toDate: null });

      addTag("createdDate", tagMap[name]);

      return newFilters;
    });
  };

  const handleClearFilters = () => {
    setIsCreatedDateOpen(false);
    setIsStatus(false);

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
      visitedTime: [],
      region: [],
      pageVisits: [],
      timeSpents: [],
    });
    setTags([]);
    setSelectedStatus([]);
    setButtonFilters(null);
    setSearchQuery("");

    sessionStorage.removeItem('filters')
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

  const getSelectedDateChip = () => {
    if (dateRange.fromDate && dateRange.toDate) {
      return `${dayjs(dateRange.fromDate).format("YYYY-MM-DD")} - ${dayjs(dateRange.toDate).format("YYYY-MM-DD")}`;
    }
  
    const activeFilter = Object.keys(checkedFilters).find(
      (key) => checkedFilters[key as keyof typeof checkedFilters]
    );
  
    return activeFilter ? formatFilterLabel(activeFilter as keyof typeof checkedFilters) : null;
  };
  
  
  const formatFilterLabel = (key: keyof typeof checkedFilters) => {
    const labels: Record<keyof typeof checkedFilters, string> = {
      today: "Today",
      last7Days: "Last 7 days",
      last30Days: "Last 30 days",
      last6Months: "Last 6 months",
    };
    return labels[key];
  };

  const clearDateFilter = () => {
    setCheckedFilters({
      today: false,
      last7Days: false,
      last30Days: false,
      last6Months: false,
    });
    setDateRange({ fromDate: null, toDate: null });
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
        <Typography sx={filterStyles.filter_name}>Type</Typography>
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
                color: selectedTypes.length ? "rgba(220, 220, 239, 1)" : "#5F6368",
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
            {getAllowedTypes().map((label) => (
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
    {(selectedStatus.length === 0 || selectedStatus.includes(statusMapping["Pixel"])) && (
  <Box sx={filterStyles.main_filter_form}>
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
      <Typography sx={filterStyles.filter_name}>Domain</Typography>
      
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, pt: 1 }}>
        {selectedDomains.map((domain) => (
          <CustomChip key={domain} label={domain} onDelete={() => handleRemoveDomain(domain)} />
        ))}
      </Box>

      <IconButton onClick={() => setIsDomainFilterOpen(!isDomainFilterOpen)} aria-label="toggle-content">
        {isDomainFilterOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    </Box>

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
            { isDomainActive() ? selectedDomains.join(", ") : "Select Domain"}
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
                cursor: 'pointer'
              }}
              onClick={() => setIsCreatedDateOpen(!isCreatedDateOpen)}
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
              {getSelectedDateChip() && (
                <CustomChip
                    label={getSelectedDateChip()!}
                    onDelete={clearDateFilter}
                />
                )}
              <IconButton
                onClick={() => setIsCreatedDateOpen(!isCreatedDateOpen)}
                aria-label="toggle-content"
              >
                {isCreatedDateOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isCreatedDateOpen}>
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