import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop, TextField, InputAdornment, Collapse, Divider, FormControlLabel, Checkbox, Radio, List, ListItem, ListItemText, RadioGroup, Grid, InputLabel, FormControl, MenuItem, Select } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LineWeightIcon from '@mui/icons-material/LineWeight';
import TimelineIcon from '@mui/icons-material/Timeline';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
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
  departments: string[];
  seniorities: string[];
  jobTitles: string[];
}

interface TagMap {
  [key: string]: string;
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

const CompanyFilterPopup: React.FC<FilterPopupProps> = ({ open, onClose, onApply, departments, seniorities, jobTitles }) => {
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isJobTitleOpen, setIsJobTitleOpen] = useState(false);
  const [isSeniorityOpen, setIsSeniorityOpen] = useState(false);
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
  const [region, setRegions] = useState("");
  const [cities, setCities] = useState<{ city: string, state: string }[]>([]);
  const [contacts, setContacts] = useState<{ name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: string[] }>(
    {
      region: [],
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
  };

  const removeTag = (category: string, tag: string) => {
    setSelectedTags((prevTags) => {
      const updatedTags = prevTags[category].filter((t) => t !== tag);

      const isLastTagRemoved = updatedTags.length === 0;

      return { ...prevTags, [category]: updatedTags };
    });
  };

  // Industry
  const [checkedFiltersSeniority, setCheckedFiltersSeniority] = useState<Record<string, boolean>>({});
  const [checkedFiltersJobTitles, setCheckedFiltersJobTitles] = useState<Record<string, boolean>>({});
  const [checkedFiltersDepartment, setCheckedFiltersDepartment] = useState<Record<string, boolean>>({});

  const handleClose = () => {
    setOpenSelect(false);
  };

  const handleOpen = () => {
    setOpenSelect(true);
  };

  const handleDepartmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;

    setCheckedFiltersDepartment((prev) => ({
      ...prev,
      [value]: checked
    }));
  };
  
  const handleSeniorityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;

    setCheckedFiltersSeniority((prev) => ({
      ...prev,
      [value]: checked
    }));
  };

  const handleJobTitlesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;

    setCheckedFiltersJobTitles((prev) => ({
      ...prev,
      [value]: checked
    }));
  };


  const handleMenuSeniorityClick = (item: string) => {
    setCheckedFiltersDepartment((prevState) => ({
      ...prevState,
      [item]: !prevState[item],
    }));

    handleDepartmentChange({
      target: { value: item, checked: !checkedFiltersDepartment[item] },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleMenuItemClick = (item: string) => {
    setCheckedFiltersDepartment((prevState) => ({
      ...prevState,
      [item]: !prevState[item],
    }));

    handleDepartmentChange({
      target: { value: item, checked: !checkedFiltersDepartment[item] },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleFilters = () => {

    // Составление объекта с фильтрами
    const filters = {
      jobTitles: checkedFiltersJobTitles,
      department: checkedFiltersDepartment,
      seniority: checkedFiltersSeniority,
      regions,
      searchQuery,
    };

    saveFiltersToSessionStorage(filters);


    return filters;
  };


  const saveFiltersToSessionStorage = (filters: {
    regions: string[];
    jobTitles: typeof checkedFiltersJobTitles,
    department: typeof checkedFiltersDepartment,
    seniority: typeof checkedFiltersSeniority,
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
      setCheckedFiltersDepartment(savedFilters.department || {})
      setCheckedFiltersSeniority(savedFilters.seniority || {})
      setCheckedFiltersJobTitles(savedFilters.jobTitles || {})
      }

      setSearchQuery(savedFilters.searchQuery || '');

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

  useEffect(() => {
    if (open) {
      if (departments) {
        const initialState = departments.reduce((acc, item) => {
          acc[item] = false;
          return acc;
        }, {} as Record<string, boolean>);
        setCheckedFiltersDepartment(initialState);
      }
      if (seniorities) {
        const initialState = seniorities.reduce((acc, item) => {
          acc[item] = false;
          return acc;
        }, {} as Record<string, boolean>);
        setCheckedFiltersSeniority(initialState);
      }
      if (jobTitles) {
        const initialState = jobTitles.reduce((acc, item) => {
          acc[item] = false;
          return acc;
        }, {} as Record<string, boolean>);
        setCheckedFiltersJobTitles(initialState);
      }
      initializeFilters();
    }
  }, [open, departments, seniorities, jobTitles]);


  const handleApply = () => {
    const filters = handleFilters();
    onApply(filters);
    onClose();
  };

  // Check active filters
  const isDepartmentFilterActive = () => {
    return Object.values(checkedFiltersDepartment).some(value => value);
  };

  const handleClearFilters = () => {
    setIsDepartmentOpen(false)
    setIsSeniorityOpen(false)
    setCheckedFiltersDepartment({})
    setCheckedFiltersSeniority({})
    setCheckedFiltersJobTitles({})


    // Reset filter values
    setRegions("");
    setSelectedTags({
      region: [],
    });
    setTags([]);
    setSearchQuery("");

    sessionStorage.removeItem('filters')
  };

  const fetchCities = debounce(async (searchValue: string) => {
    if (searchValue.length >= 3) {
      try {
        const response = await axiosInstance.get('company/search-location', {
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
        const response = await axiosInstance.get('/company/search-contact', {
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
                placeholder="Search by name, email, phone number and linkedIn."
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

            {/* Job Title */}
            <Box
                sx={{ ...filterStyles.main_filter_form}}
            >
                <Box
                sx={filterStyles.filter_form}
                onClick={() => setIsJobTitleOpen(!isJobTitleOpen)}
                >
                <Box
                    sx={{
                    ...filterStyles.active_filter_dote,
                    visibility: regions.length > 0 ? 'visible' : "hidden",
                    }}
                />
                <WorkOutlineOutlinedIcon width={18} height={18}/>
                <Typography
                    sx={{
                    ...filterStyles.filter_name
                    }}
                >
                    Job Title
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
                    onClick={() => setIsJobTitleOpen(!isJobTitleOpen)}
                    aria-label="toggle-content"
                >
                    {isJobTitleOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                </Box>
                <Collapse in={isJobTitleOpen}>
                <TextField
                    placeholder="Search by job title"
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

            {/* Seniority */}
            <Box sx={filterStyles.main_filter_form}>
            <Box
                sx={filterStyles.filter_form}
                onClick={() => setIsSeniorityOpen(!isSeniorityOpen)}
            >
                <Box
                sx={{
                    ...filterStyles.active_filter_dote,
                    visibility: isDepartmentFilterActive() ? "visible" : "hidden",
                }}
                />
                <LineWeightIcon  width={18} height={18}/>
                <Typography sx={filterStyles.filter_name}>
                Seniority
                </Typography>
                <IconButton
                onClick={() => setIsSeniorityOpen(!isSeniorityOpen)}
                aria-label="toggle-content"
                >
                {isSeniorityOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>

            </Box>
            {Object.keys(checkedFiltersSeniority).some((key) => checkedFiltersSeniority[key]) && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1, mb: 2 }}>
                {Object.keys(checkedFiltersSeniority)
                    .filter((key) => checkedFiltersSeniority[key])
                    .map((tag, index) => (
                    <CustomChip
                        key={index}
                        label={tag}
                        onDelete={() => handleMenuItemClick(tag)}
                    />
                    ))}
                </Box>
            )}


            <Collapse in={isSeniorityOpen}>
                <Box sx={{ ...filterStyles.filter_dropdown, height: openSelect ? 250 : 50 }}>
                {departments && departments.length > 0 ? (
                    <FormControl fullWidth>
                    <Select
                        labelId="industry-select-label"
                        id="industry-select"
                        multiple
                        open={openSelect}
                        onClose={handleClose}
                        onOpen={handleOpen}
                        value={Object.keys(checkedFiltersSeniority).filter(
                        (key) => checkedFiltersSeniority[key]
                        )}
                        displayEmpty
                        sx={{ maxHeight: '56px', pt: 1 }}
                        renderValue={() => <Typography className='table-data' sx={{ fontSize: '14px !important' }}> Select an Seniority</Typography>}
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
                        {seniorities.map((item) => (
                        <MenuItem
                            key={item}
                            value={item}
                            sx={{ maxHeight: '40px', pl: 0, padding: 0, marginTop: 0, marginBottom: 0 }}
                            onClick={() => handleMenuItemClick(item)}
                        >
                            <Checkbox
                            checked={checkedFiltersSeniority[item] || false}
                            onChange={handleSeniorityChange}
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
                                color: checkedFiltersSeniority[item] ? "rgba(80, 82, 178, 1)" : "rgba(32, 33, 36, 1)"
                            }}>
                                {item}
                            </Typography>
                            </ListItemText>
                        </MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                ) : (
                    <Typography className='second-sub-title'>No seniority data</Typography>
                )}
                </Box>
            </Collapse>
            </Box>

            {/* Department */}
            <Box sx={filterStyles.main_filter_form}>
            <Box
                sx={filterStyles.filter_form}
                onClick={() => setIsDepartmentOpen(!isDepartmentOpen)}
            >
                <Box
                sx={{
                    ...filterStyles.active_filter_dote,
                    visibility: isDepartmentFilterActive() ? "visible" : "hidden",
                }}
                />
                <TimelineIcon  width={18} height={18}/>
                <Typography sx={filterStyles.filter_name}>
                Department
                </Typography>
                <IconButton
                onClick={() => setIsDepartmentOpen(!isDepartmentOpen)}
                aria-label="toggle-content"
                >
                {isDepartmentOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>

            </Box>
            {Object.keys(checkedFiltersDepartment).some((key) => checkedFiltersDepartment[key]) && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1, mb: 2 }}>
                {Object.keys(checkedFiltersDepartment)
                    .filter((key) => checkedFiltersDepartment[key])
                    .map((tag, index) => (
                    <CustomChip
                        key={index}
                        label={tag}
                        onDelete={() => handleMenuItemClick(tag)}
                    />
                    ))}
                </Box>
            )}


            <Collapse in={isDepartmentOpen}>
                <Box sx={{ ...filterStyles.filter_dropdown, height: openSelect ? 250 : 50 }}>
                {departments && departments.length > 0 ? (
                    <FormControl fullWidth>
                    <Select
                        labelId="industry-select-label"
                        id="industry-select"
                        multiple
                        open={openSelect}
                        onClose={handleClose}
                        onOpen={handleOpen}
                        value={Object.keys(checkedFiltersDepartment).filter(
                        (key) => checkedFiltersDepartment[key]
                        )}
                        displayEmpty
                        sx={{ maxHeight: '56px', pt: 1 }}
                        renderValue={() => <Typography className='table-data' sx={{ fontSize: '14px !important' }}> Select an Department</Typography>}
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
                        {departments.map((item) => (
                        <MenuItem
                            key={item}
                            value={item}
                            sx={{ maxHeight: '40px', pl: 0, padding: 0, marginTop: 0, marginBottom: 0 }}
                            onClick={() => handleMenuItemClick(item)}
                        >
                            <Checkbox
                            checked={checkedFiltersDepartment[item] || false}
                            onChange={handleDepartmentChange}
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
                                color: checkedFiltersDepartment[item] ? "rgba(80, 82, 178, 1)" : "rgba(32, 33, 36, 1)"
                            }}>
                                {item}
                            </Typography>
                            </ListItemText>
                        </MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                ) : (
                    <Typography className='second-sub-title'>No department data</Typography>
                )}
                </Box>
            </Collapse>
            </Box>

            {/* Location */}
            <Box
            sx={{ ...filterStyles.main_filter_form, mb: 15 }}
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
                <PlaceOutlinedIcon width={18} height={18}/>
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
