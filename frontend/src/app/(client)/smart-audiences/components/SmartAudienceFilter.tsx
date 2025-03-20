import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Backdrop, TextField, InputAdornment, Collapse, Checkbox, List, ListItem, ListItemText, FormControl, MenuItem, Select } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BackupTableIcon from '@mui/icons-material/BackupTable';
import AnnouncementOutlinedIcon from '@mui/icons-material/AnnouncementOutlined';
import { filterStyles } from '@/css/filterSlider';
import debounce from 'lodash/debounce';
import axiosInstance from '@/axios/axiosInterceptorInstance';


interface FilterPopupProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
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

const FilterPopup: React.FC<FilterPopupProps> = ({ open, onClose, onApply }) => {
  const [isLookalikeType, setIsLookalikeType] = useState(false);
  const [isSmartUseCase, setIsSmartUseCase] = useState(false);
  const [contacts, setContacts] = useState<{ name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openSelect, setOpenSelect] = useState(false);
  const [openSelectUseCase, setOpenSelectUseCase] = useState(false);

  const [checkedFiltersTypes, setcheckedFiltersTypes] = useState<Record<string, boolean>>({});
  const [checkedFiltersUseCases, setcheckedFiltersUseCases] = useState<Record<string, boolean>>({});

  const handleClose = () => {
    setOpenSelect(false);
  };

  const handleOpen = () => {
    setOpenSelect(true);
  };

  const handleCloseUseCase = () => {
    setOpenSelectUseCase(false);
  };

  const handleOpenUseCase = () => {
    setOpenSelectUseCase(true);
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

  const handleUseCaseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;

    setcheckedFiltersUseCases((prev) => ({
      ...prev,
      [value]: checked
    }));
  };


  const handleMenuUseCaseItemClick = (item: string) => {
    setcheckedFiltersUseCases((prevState) => ({
      ...prevState,
      [item]: !prevState[item],
    }));

    handleUseCaseChange({
      target: { value: item, checked: !checkedFiltersUseCases[item] },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const isUseCasesFilterActive = () => {
    return Object.values(checkedFiltersUseCases).some(value => value);
  };

  const handleFilters = () => {
    const filters = {
      selectedStatuses: checkedFiltersTypes,
      selectedUseCases: checkedFiltersUseCases,
      searchQuery,
    };

    saveFiltersToSessionStorage(filters);


    return filters;
  };


  const saveFiltersToSessionStorage = (filters: {
    selectedStatuses: typeof checkedFiltersTypes;
    selectedUseCases: typeof checkedFiltersUseCases;
    searchQuery: string;
  }) => {
    sessionStorage.setItem('filtersBySmarts', JSON.stringify(filters));
  };

  const loadFiltersFromSessionStorage = () => {
    const savedFilters = sessionStorage.getItem('filtersBySmarts');
    if (savedFilters) {
      return JSON.parse(savedFilters);
    }
    return null;
  };

  const initializeFilters = () => {
    const savedFilters = loadFiltersFromSessionStorage();
    if (savedFilters) {

      setcheckedFiltersTypes(savedFilters.status || {})
      setcheckedFiltersUseCases(savedFilters.useCases || {})
      setSearchQuery(savedFilters.searchQuery || '');

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


  const handleClearFilters = () => {

    setIsLookalikeType(false);
    setIsSmartUseCase(false);

    setcheckedFiltersTypes({})
    setcheckedFiltersUseCases({})
    setSearchQuery("");

    sessionStorage.removeItem('filtersBySmarts')
  };

  const fetchContacts = debounce(async (query: string) => {
    if (query.length >= 3) {
      try {
        const response = await axiosInstance.get('/audience-smarts/search', {
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
              placeholder="Search audiences by name or creator"
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
                '& input': {
                  paddingLeft: 0,
                },
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
          {/* Use Case */}
          <Box
            sx={filterStyles.main_filter_form}
          >
            <Box
              sx={filterStyles.filter_form}
              onClick={() => setIsSmartUseCase(!isSmartUseCase)}
            >
              <Box
                sx={{
                  ...filterStyles.active_filter_dote,
                  visibility: isUseCasesFilterActive() ? "visible" : "hidden"
                }}
              />
              <BackupTableIcon sx={{ width: '18px', height: '18px', color: 'rgba(95, 99, 104, 1)' }} />
              <Typography
                sx={{
                  ...filterStyles.filter_name
                }}
              >
                Use Case
              </Typography>
              {Object.keys(checkedFiltersUseCases).some((key) => checkedFiltersUseCases[key]) && (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1, mb: 2 }}>
                              {Object.keys(checkedFiltersUseCases)
                                .filter((key) => checkedFiltersUseCases[key])
                                .map((tag, index) => (
                                  <CustomChip
                                    key={index}
                                    label={tag}
                                    onDelete={() => handleMenuUseCaseItemClick(tag)}
                                  />
                                ))}
                            </Box>
                          )}
              <IconButton
                onClick={() => setIsSmartUseCase(!isSmartUseCase)}
                aria-label="toggle-content"
              >
                {isSmartUseCase ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={isSmartUseCase}>
              <Box sx={{ ...filterStyles.filter_dropdown, height: openSelectUseCase ? 250 : 50 }}>
                <FormControl fullWidth>
                  <Select
                    multiple
                    open={openSelectUseCase}
                    onClose={handleCloseUseCase}
                    onOpen={handleOpenUseCase}
                    value={Object.keys(checkedFiltersUseCases).filter((key) => checkedFiltersUseCases[key])}
                    displayEmpty
                    sx={{ maxHeight: '56px', pt: 1 }}
                    renderValue={() => (
                      <Typography className="table-data" sx={{ fontSize: '14px !important' }}>
                        Select Use Case
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
                    {["Meta", "Google", "Bing", "Email", "Tele Marketing", "Postal"].map((item) => (
                      <MenuItem
                        key={item}
                        value={item}
                        sx={{ maxHeight: '40px', pl: 0, padding: 0, marginTop: 0, marginBottom: 0 }}
                        onClick={() => handleMenuUseCaseItemClick(item)}
                      >
                        <Checkbox
                          checked={checkedFiltersUseCases[item] || false}
                          onChange={handleUseCaseChange}
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
                              color: checkedFiltersUseCases[item] ? "rgba(80, 82, 178, 1)" : "rgba(32, 33, 36, 1)",
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
              <AnnouncementOutlinedIcon sx={{ width: '18px', height: '18px', color: 'rgba(95, 99, 104, 1)' }} />
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
                        Select Status
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
                    {["Unvalidated", "Ready", "Synced", "Validating"].map((item) => (
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
