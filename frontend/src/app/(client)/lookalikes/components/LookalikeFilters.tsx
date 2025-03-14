import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop, TextField, InputAdornment, Collapse, Divider, FormControlLabel, Checkbox, Radio, List, ListItem, ListItemText, FormControl, MenuItem, Select } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import DnsIcon from '@mui/icons-material/Dns';
import GroupsIcon from '@mui/icons-material/Groups';
import EventIcon from '@mui/icons-material/Event';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import Image from 'next/image';
import { filterStyles } from '@/css/filterSlider';
import debounce from 'lodash/debounce';
import axiosInstance from '@/axios/axiosInterceptorInstance';


interface FilterPopupProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

const FilterPopup: React.FC<FilterPopupProps> = ({ open, onClose, onApply }) => {
  const [isCreatedDateOpen, setIsCreatedDateOpen] = useState(false);
  const [isLookalikeSize, setIsLookalikeSize] = useState(false);
  const [isLookalikeType, setIsLookalikeType] = useState(false);
  const [contacts, setContacts] = useState<{ name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: string[] }>(
    {
      CreatedDate: [],
    }
  );
  const [selectedSize, setSelectedSize] = useState<string[]>([]);
  const [buttonFilters, setButtonFilters] = useState<ButtonFilters>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openSelect, setOpenSelect] = useState(false);




  type ButtonFilters = {
    button: string;
    dateRange: {
      fromDate: number;
      toDate: number;
    };
    selectedSize: string[];
  } | null;

  const handleButtonLeadFunnelClick = (label: string) => {
    setSelectedSize((prev) =>
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

      // If the last tag and category "CreatedDate" are deleted, clear the state
      if (category === "CreatedDate" && isLastTagRemoved) {
        setDateRange({ fromDate: null, toDate: null });
      }

      // Update checkbox states if necessary
      if (category === "CreatedDate") {
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
      if (category === "CreatedDate") {
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

  const [checkedFiltersTypes, setcheckedFiltersTypes] = useState<Record<string, boolean>>({});

  const handleClose = () => {
    setOpenSelect(false);
  };

  const handleOpen = () => {
    setOpenSelect(true);
  };

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;

    setcheckedFiltersTypes((prev) => ({
      ...prev,
      [value]: checked
    }));
  };


  const handleMenuItemClick = (item: string) => {
    setcheckedFiltersTypes((prevState) => ({
      ...prevState,
      [item]: !prevState[item],
    }));

    handleTypeChange({
      target: { value: item, checked: !checkedFiltersTypes[item] },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const isTypesFilterActive = () => {
    return Object.values(checkedFiltersTypes).some(value => value);
  };


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
          CreatedDate: newTag ? [newTag] : [],
        };

        // If a new label exists, add it
        if (newTag) {
          addTag("CreatedDate", newTag);
        }

        // If the label has been replaced or removed, clear the date range
        if (!newTag && prevTags.CreatedDate.length > 0) {
          setDateRange({ fromDate: null, toDate: null });
        } else if (newTag && oldFromDate && oldToDate) {
          removeTag("CreatedDate", `From ${oldFromDate} to ${oldToDate}`);
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
      size: buttonFilters ? buttonFilters.selectedSize : selectedSize,
      checkedFilters,
      type: checkedFiltersTypes,
      searchQuery,
    };

    saveFiltersToSessionStorage(filters);


    return filters;
  };


  const saveFiltersToSessionStorage = (filters: {
    from_date: number | null;
    to_date: number | null;
    size: string[];
    type: typeof checkedFiltersTypes;
    searchQuery: string;
  }) => {
    sessionStorage.setItem('lookalike_filters', JSON.stringify(filters));
  };

  const loadFiltersFromSessionStorage = () => {
    const savedFilters = sessionStorage.getItem('lookalike_filters');
    if (savedFilters) {
      return JSON.parse(savedFilters);
    }
    return null;
  };

  const initializeFilters = () => {
    const savedFilters = loadFiltersFromSessionStorage();
    if (savedFilters) {

      setCheckedFilters(savedFilters.checkedFilters || {
        lastWeek: false,
        last30Days: false,
        last6Months: false,
        allTime: false,
      });

      setSelectedSize(savedFilters.size || []);
      setcheckedFiltersTypes(savedFilters.type || {})
      setSearchQuery(savedFilters.searchQuery || '');


      const isDateFilterActive = Object.values(savedFilters.checkedFilters || {}).some(value => value === true);
      if (isDateFilterActive) {
        setButtonFilters(savedFilters.button);
        const tagMap: { [key: string]: string } = {
          lastWeek: "Last week",
          last30Days: "Last 30 days",
          last6Months: "Last 6 months",
          allTime: "All time",
        };
        const activeFilter = Object.keys(savedFilters.checkedFilters).find(key => savedFilters.checkedFilters[key]);

        if (activeFilter) {
          addTag("CreatedDate", tagMap[activeFilter]);
        }
      } else {
        const fromDate = savedFilters.from_date ? dayjs.unix(savedFilters.from_date).format('MMM DD, YYYY') : null;
        const toDate = savedFilters.to_date ? dayjs.unix(savedFilters.to_date).format('MMM DD, YYYY') : null;
        const newTag = fromDate && toDate ? `From ${fromDate} to ${toDate}` : null;
        if (newTag) {
          addTag("CreatedDate", newTag);
        }
        setDateRange({
          fromDate: savedFilters.from_date ? dayjs.unix(savedFilters.from_date) : null,
          toDate: savedFilters.to_date ? dayjs.unix(savedFilters.to_date) : null,
        });
      }
      setButtonFilters(savedFilters.button)
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


  // Lead Funnel
  const isLookalikeSizeActive = () => {
    return selectedSize.length > 0;
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
        removeTag("CreatedDate", tagMap[previouslySelected]);
      }

      setDateRange({ fromDate: null, toDate: null });

      // Add the tag for the currently selected radio button
      addTag("CreatedDate", tagMap[name]);

      return newFilters;
    });
  };

  const handleClearFilters = () => {

    setIsCreatedDateOpen(false);
    setIsLookalikeSize(false);
    setIsLookalikeType(false);

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
    setSelectedTags({
      CreatedDate: [],
    });
    setcheckedFiltersTypes({})
    setButtonFilters(null);
    setSearchQuery("");

    sessionStorage.removeItem('lookalike_filters')
  };

  const fetchContacts = debounce(async (query: string) => {
    if (query.length >= 3) {
      try {
        const response = await axiosInstance.get('/audience-lookalikes/search-lookalike', {
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
      <Backdrop open={open} sx={{ zIndex: 100, color: "#fff" }} />
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
              backgroundColor: 'rgba(0, 0, 0, 0.01)'
            }
          }
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75em 1em 0.925em 1em",
            borderBottom: "1px solid #e4e4e4",
            position: "sticky",
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
              onClick={() => setIsLookalikeType(!isLookalikeType)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isTypesFilterActive() ? "visible" : "hidden"
                }}
              />
              <DnsIcon sx={{ width: '18px', height: '18px', color: 'rgba(95, 99, 104, 1)' }} />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                Type
              </Typography>
              {Object.keys(checkedFiltersTypes).some((key) => checkedFiltersTypes[key]) && (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1, mb: 2 }}>
                              {Object.keys(checkedFiltersTypes)
                                .filter((key) => checkedFiltersTypes[key])
                                .map((tag, index) => (
                                  <CustomChip
                                    key={index}
                                    label={tag}
                                    onDelete={() => handleMenuItemClick(tag)}
                                  />
                                ))}
                            </Box>
                          )}
              <IconButton
                onClick={() => setIsLookalikeType(!isLookalikeType)}
                aria-label="toggle-content"
              >
                {isLookalikeType ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isLookalikeType}>
              <Box sx={{ ...filterStyles.filter_dropdown, height: openSelect ? 250 : 50 }}>
                <FormControl fullWidth>
                  <Select
                    multiple
                    open={openSelect}
                    onClose={handleClose}
                    onOpen={handleOpen}
                    value={Object.keys(checkedFiltersTypes).filter((key) => checkedFiltersTypes[key])}
                    displayEmpty
                    sx={{ maxHeight: '56px', pt: 1 }}
                    renderValue={() => (
                      <Typography className="table-data" sx={{ fontSize: '14px !important' }}>
                        Select Type
                      </Typography>
                    )}
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
                    {["Customer Conversions", "Lead Failures", "Intent", "Visitor", "View Product", "Abandoned Cart", "Converted sales"].map((item) => (
                      <MenuItem
                        key={item}
                        value={item}
                        sx={{ maxHeight: '40px', pl: 0, padding: 0, marginTop: 0, marginBottom: 0 }}
                        onClick={() => handleMenuItemClick(item)}
                      >
                        <Checkbox
                          checked={checkedFiltersTypes[item] || false}
                          onChange={handleTypeChange}
                          value={item}
                          size="small"
                          sx={{
                            "&.Mui-checked": { color: "rgba(80, 82, 178, 1)" },
                          }}
                        />
                        <ListItemText>
                          <Typography
                            sx={{
                              fontSize: "14px",
                              fontFamily: "Nunito Sans",
                              fontWeight: 500,
                              lineHeight: "19.6px",
                              color: checkedFiltersTypes[item] ? "rgba(80, 82, 178, 1)" : "rgba(32, 33, 36, 1)",
                            }}
                          >
                            {item}
                          </Typography>
                        </ListItemText>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Collapse>
          </Box>
          {/* Lookalike Size */}
          <Box
            sx={filterStyles.main_filter_form}
          >
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsLookalikeSize(!isLookalikeSize)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isLookalikeSizeActive() ? "visible" : "hidden"
                }}
              />
              <GroupsIcon sx={{ width: '18px', height: '18px', color: 'rgba(95, 99, 104, 1)' }} />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                Lookalike Size
              </Typography>
              {selectedSize.map((label) => (
                <CustomChip
                  key={label}
                  label={label}
                  onDelete={() => handleButtonLeadFunnelClick(label)}
                />
              ))}
              <IconButton
                onClick={() => setIsLookalikeSize(!isLookalikeSize)}
                aria-label="toggle-content"
              >
                {isLookalikeSize ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isLookalikeSize}>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  pt: 1,
                  pl: 2,
                  pb: 0.75,
                  width: "100%",
                }}
              >
                {[
                  { label: "Almost identical", value: "0-3%" },
                  { label: "Extremely Similar", value: "0-7%" },
                  { label: "Very similar", value: "0-10%" },
                  { label: "Quite similar", value: "0-15%" },
                  { label: "Broad", value: "0-20%" },
                ].map(({ label, value }) => {
                  const isSelected = selectedSize.includes(label);
                  return (
                    <Button
                      key={label}
                      className="second-sub-title"
                      onClick={() => handleButtonLeadFunnelClick(label)}
                      sx={{
                        width: { xs: "48%", sm: "calc(50% - 8px)", md: "calc(25% - 8px)" },

                        textTransform: "none",
                        gap: "0px",
                        padding: "8px",
                        textWrap: "nowrap",
                        textAlign: "center",
                        borderRadius: "4px",
                        fontFamily: "Nunito Sans",
                        opacity: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
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
                        lineHeight: "20px !important",
                        "@media (max-width: 1080px)": {
                          width: "48%",
                          height: "3em",
                        },
                        "@media (max-width: 700px)": {
                          width: "100%",
                          height: "3.5em",
                        },
                      }}
                    >
                      <Typography className='table-data' sx={{ color: 'rgba(32, 33, 36, 1) !important' }}>{label}</Typography>
                      {value && <span style={{ fontSize: "0.8em", color: "#808080" }}>{value}</span>}
                    </Button>
                  );
                })}
              </Box>

            </Collapse>
          </Box>
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
              <EventIcon sx={{ width: '18px', height: '18px', color: 'rgba(95, 99, 104, 1)' }} />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                Created date
              </Typography>
              {selectedTags.CreatedDate.map((tag, index) => (
                <CustomChip
                  key={index}
                  label={tag}
                  onDelete={() => removeTag("CreatedDate", tag)}
                />
              ))}
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
