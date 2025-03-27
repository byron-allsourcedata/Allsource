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
import ExpandableCheckboxFilter from '@/components/filters/ExpandableCheckboxFilter';


interface FilterPopupProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

const FilterPopup: React.FC<FilterPopupProps> = ({ open, onClose, onApply }) => {
  const [isLookalikeSize, setIsLookalikeSize] = useState(false);
  const [isLookalikeType, setIsLookalikeType] = useState(false);
  const [contacts, setContacts] = useState<{ name: string }[]>([]);
  const [selectedSize, setSelectedSize] = useState<string[]>([]);
  const [buttonFilters, setButtonFilters] = useState<ButtonFilters>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleTypeChange = (option: string) => {
    setcheckedFiltersTypes((prev) => ({
      ...prev,
      [option]: !prev[option]
    }));
  };
  
  const handleMenuItemClick = (item: string) => {
    setcheckedFiltersTypes((prevState) => ({
      ...prevState,
      [item]: !prevState[item],
    }));
  };

  const isTypesFilterActive = () => {
    return Object.values(checkedFiltersTypes).some(value => value);
  };

  const handleFilters = () => {



    // Составление объекта с фильтрами
    const filters = {
      size: buttonFilters ? buttonFilters.selectedSize : selectedSize,
      type: checkedFiltersTypes,
      searchQuery,
    };

    saveFiltersToSessionStorage(filters);


    return filters;
  };


  const saveFiltersToSessionStorage = (filters: {
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

      setSelectedSize(savedFilters.size || []);
      setcheckedFiltersTypes(savedFilters.type || {})
      setSearchQuery(savedFilters.searchQuery || '');
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


  // Lead Funnel
  const isLookalikeSizeActive = () => {
    return selectedSize.length > 0;
  };


  const handleClearFilters = () => {

    setIsLookalikeSize(false);
    setIsLookalikeType(false);

    // Reset date
    setcheckedFiltersTypes({})
    setSelectedSize([])
    setButtonFilters(null);
    setSearchQuery("");

    sessionStorage.removeItem('lookalike_filters')
  };

  const fetchContacts = debounce(async (query: string) => {
    if (query.length >= 3) {
      try {
        const response = await axiosInstance.get('/audience-lookalikes/search-lookalikes', {
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
              <ExpandableCheckboxFilter
                selectedOptions={Object.keys(checkedFiltersTypes).filter((key) => checkedFiltersTypes[key])}
                allowedOptions={[
                  "Customer Conversions",
                  "Lead Failures",
                  "Interest",
                  "Visitor",
                  "Viewed Product",
                  "Abandoned Cart",
                  "Converted sales"
                ]}
                onOptionToggle={handleTypeChange}
                placeholder="Select Type"
                sx={{ pt: 1, pl: 2 }}
              />
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
