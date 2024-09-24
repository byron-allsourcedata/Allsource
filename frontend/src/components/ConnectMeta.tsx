import React, { useState, useRef, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, TextField, Divider, FormGroup, FormControlLabel, FormControl, FormLabel, Radio, Collapse, Checkbox, Button, List, ListItem, Link, Tab, Tooltip, Switch, RadioGroup, InputLabel, MenuItem, Select, Dialog, DialogActions, DialogContent, DialogTitle, Popover, Menu, SelectChangeEvent, ListItemText, ClickAwayListener, InputAdornment, Grid} from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Image from 'next/image';
import CloseIcon from '@mui/icons-material/Close';

interface ConnectMetaPopupProps {
    open: boolean;
    onClose: () => void;
}

const ConnectMeta: React.FC<ConnectMetaPopupProps> = ({ open, onClose }) => {

    const [value, setValue] = React.useState('1');

    const [checked, setChecked] = useState(false);

    const [selectedRadioValue, setSelectedRadioValue] = useState('');

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedOption, setSelectedOption] = useState<string>(''); // Track selected option
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
    const [newListName, setNewListName] = useState<string>('');
    const [tagName, setTagName] = useState<string>('');
    const [isShrunk, setIsShrunk] = useState<boolean>(false);
    const textFieldRef = useRef<HTMLDivElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const [isDropdownValid, setIsDropdownValid] = useState(false);
    const [adId, setAdId] = useState('');
    const [adIdError, setAdIdError] = useState(false);
    const [listNameError, setListNameError] = useState(false);
    const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
    const [newMapListName, setNewMapListName] = useState<string>('');
    const [showCreateMapForm, setShowCreateMapForm] = useState<boolean>(false);
    const [maplistNameError, setMapListNameError] = useState(false);
    const [mapListOptions, setMapListOptions] = useState<string[]>([
        'Email',
        'Phone number',
        'First name',
        'Second name',
        'Gender',
        'Age',
        'Job Title',
        'Location',
    ]);

      // Handle click outside to unshrink the label if input is empty
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (textFieldRef.current && !textFieldRef.current.contains(event.target as Node)) {
        // If clicked outside, reset shrink only if there is no input value
        if (selectedOption === '') {
            setIsShrunk(false);
          }
          if (isDropdownOpen) {
            setIsDropdownOpen(false); // Close dropdown when clicking outside
          }
      }
    };

    // Attach event listener for detecting click outside
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedOption]);

    // Static options
    const staticOptions = ['Email List', 'Phone List', 'SMS List', 'Maximiz Contacts', 'Preview List', 'Maximiz'];

    // Handle menu open
    const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
        setIsShrunk(true);
        setIsDropdownOpen(prev => !prev);
        setAnchorEl(event.currentTarget);
        setShowCreateForm(false); // Reset form when menu opens
    };

      // Handle dropdown toggle specifically when clicking on the arrow
  const handleDropdownToggle = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the input field click
    setIsDropdownOpen(prev => !prev);
    setAnchorEl(textFieldRef.current);
  };

    // Handle menu close
    const handleClose = () => {
        setAnchorEl(null);
        setShowCreateForm(false);
        setIsDropdownOpen(false);
        setNewListName(''); // Clear new list name when closing
    };

    const handleMapClose = () => {
        setShowCreateMapForm(false);
        setNewMapListName(''); // Clear new list name when closing
    };

    // Handle option selection
    const handleSelectOption = (value: string) => {
        if (value === 'createNew') {
            // If the form is already open, close it
            if (showCreateForm) {
                setShowCreateForm(false);
            } else {
                // If the form is not open, open it and keep the dropdown open
                setShowCreateForm(true);
                setAnchorEl(textFieldRef.current); // Keep the menu open
            }
        } else {
            setSelectedOption(value);
            handleClose();
        }
        setIsDropdownValid(value !== '');
    };

    const handleSelectMapOption = (value: string, event: React.MouseEvent<HTMLElement>, id: number) => {
        event.stopPropagation(); // Prevent click event from closing the dropdown

        if (value === 'createNewField') {
            setShowCreateMapForm(prev => !prev); // Toggle form visibility

            // Ensure dropdown remains open if it was already open or if form is being opened
            if (openDropdown !== id) {
                setOpenDropdown(id); // Open dropdown if it’s not already open
            }
        } else {
            handleDropdownClose(); // Close dropdown for other selections
        }
    };

    // Handle Save action for the create new list form
    const handleSave = () => {
        let valid = true;
    
        // Validate List Name
        if (newListName.trim() === '') {
            setListNameError(true);
            valid = false;
        } else {
            setListNameError(false);
        }
    
        // If valid, save and close
        if (valid) {
            setSelectedOption(newListName); // Update selected option with new list name
            handleClose();
        }
    };

    const handleMapSave = (id: number) => {
        let valid = true;
    
        // Validate List Name
        if (newMapListName.trim() === '') {
            setMapListNameError(true);
            valid = false;
        } else {
            setMapListNameError(false);
        }
    
       
    
        // If valid, save and close
        if (valid) {
            if (newMapListName.trim() === '') return; // Prevent saving empty values

            // Update the value in the rows state
            handleMapListChange(id, 'selectValue', newMapListName);

            setMapListOptions(prevOptions => [...prevOptions, newMapListName]);

            // Optionally, reset the new value state if needed
            setNewMapListName('');

            
            setShowCreateMapForm(false); // Close the form
            setOpenDropdown(null); // Close the dropdown if needed
            handleMapClose();
        }
    };



    const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setChecked(event.target.checked);
    };

    const label = { inputProps: { 'aria-label': 'Switch demo' } };

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };


    const metaStyles = {
        tabHeading: {
            fontFamily: 'Nunito Sans',
            fontSize: '14px',
            color: '#707071',
            fontWeight: '500',
            lineHeight: '20px',
            textTransform: 'none',
            padding: 0,
            minWidth: 'auto',
            px: 2,
            pointerEvents: 'none',
            '@media (max-width: 600px)': {
                alignItems: 'flex-start',
                p: 0
            },
            '&.Mui-selected': {
                color: '#5052b2',
                fontWeight: '700'
            }
        },
        inputLabel: {
            fontFamily: 'Nunito Sans',
            fontSize: '12px',
            lineHeight: '16px',
            color: 'rgba(17, 17, 19, 0.60)',
            '&.Mui-focused': {
                color: '#0000FF',
              },
        },
        formInput: {
            '&.MuiOutlinedInput-root': {
              height: '48px',
              '& .MuiOutlinedInput-input': {
                padding: '12px 16px 13px 16px',
                fontFamily: 'Roboto',
                color: '#202124',
                fontSize: '14px',
                lineHeight: '20px',
                fontWeight: '400'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#A3B0C2',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#A3B0C2',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#0000FF',
              },
            },
            '&+.MuiFormHelperText-root': {
                marginLeft: '0',
            },
          },
          
    }

    // Define buttons for each tab
    const getButton = (tabValue: string) => {
        switch (tabValue) {
            case '2':
                return (
                    <Button
                        variant="contained"
                        onClick={handleNextTab}
                        disabled={adIdError || !adId || !isDropdownValid}
                        sx={{
                            backgroundColor: '#5052B2',
                            fontFamily: "Nunito Sans",
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: '20px',
                            letterSpacing: 'normal',
                            color: "#fff",
                            textTransform: 'none',
                            padding: '10px 24px',
                            boxShadow:'0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                            '&:hover': {
                                backgroundColor: '#5052B2'
                            },
                            borderRadius: '4px',
                        }}
                    >
                        Next
                    </Button>
                );
            case '3':
                return (
                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: '#5052B2',
                            fontFamily: "Nunito Sans",
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: '20px',
                            letterSpacing: 'normal',
                            color: "#fff",
                            textTransform: 'none',
                            padding: '10px 24px',
                            boxShadow:'0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                            '&:hover': {
                                backgroundColor: '#5052B2'
                            },
                            borderRadius: '4px',
                        }}
                    >
                        Export
                    </Button>
                );
            default:
                return null;
        }
    };

    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedRadioValue(event.target.value);
    };

    /** Map List */

    // Define the Row type
    interface Row {
        id: number;
        type: string;
        value: string;
        selectValue?: string;
        canDelete?: boolean; 
    }

    const defaultRows: Row[] = [
        { id: 1, type: 'Email', value: '' },
        { id: 2, type: 'Phone number', value: '' },
      ];
      const [rows, setRows] = useState<Row[]>(defaultRows);

      // Update function with typed parameters
      const handleMapListChange = (id: number, field: 'value' | 'selectValue', value: string) => {
        setRows(rows.map(row =>
          row.id === id ? { ...row, [field]: value } : row
        ));
      };

    // Delete function with typed parameter
    // Delete function with typed parameter
    const handleClickOpen = (event: React.MouseEvent<HTMLElement>, id: number) => {
        setDeleteAnchorEl(event.currentTarget);  // Set the current target as the anchor
        setSelectedRowId(id);  // Set the ID of the row to delete
    };

    const handleDeleteClose = () => {
        setDeleteAnchorEl(null);
        setSelectedRowId(null);
    };

    const handleDelete = () => {
        if (selectedRowId !== null) {
            setRows(rows.filter(row => row.id !== selectedRowId));
            handleDeleteClose();
        }
    };

    // Add row function
    const handleAddRow = () => {
        const newRow: Row = {
          id: Date.now(), // Unique ID for each new row
          type: 'Enter new data',
          value: '',
          selectValue: '', // Ensure selectValue is present for new rows
          canDelete: true, // This new row can be deleted
        };
        setRows([...rows, newRow]);
    };
    const handleDropdownOpen = (id: number) => {
        setOpenDropdown(id); // Set the open state for the current dropdown
    };

    const handleDropdownClose = () => {
        setOpenDropdown(null); // Reset when dropdown closes
    };

    const handleAdIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAdId(event.target.value);
        setAdIdError(event.target.value === ''); // Set error if API Key is empty
    };
    
    const validateAdId = () => {
        // Your logic to validate the API key
        if (adId.trim() === '') {
          setAdIdError(true);
          return false;
        }
        setAdIdError(false);
        return true;
    };

    const handleNextTab = () => {
        if (value === '2') {
            // Validate Tab 3
            if (isDropdownValid && validateAdId()) {
                // Proceed to next tab
                setValue((prevValue) => String(Number(prevValue) + 1));
            }
        }
      };

    const deleteOpen = Boolean(deleteAnchorEl);
    const deleteId = deleteOpen ? 'delete-popover' : undefined;

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: '620px',
                    position: 'fixed',
                    zIndex: 1301,
                    top: 0,
                    bottom: 0,
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': {
                        display: 'none',
                    },
                    '@media (max-width: 600px)': {
                        width: '100%',
                    }
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 3.5, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                <Typography variant="h6" sx={{ textAlign: 'center', color: '#202124', fontFamily: 'Nunito Sans', fontWeight: '600', fontSize: '16px', lineHeight: 'normal' }}>
                    Connect to Meta
                </Typography>
                <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                    <Link href="#" sx={{
                        fontFamily: 'Nunito Sans',
                        fontSize: '14px',
                        fontWeight: '600',
                        lineHeight: '20px',
                        color: '#5052b2',
                        textDecorationColor: '#5052b2'
                    }}>Tutorial</Link>
                    <IconButton onClick={onClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: '100%',
                '@media (max-width: 480px)': {
                    height: 'auto'
                }
             }}>
                <Box sx={{ width: '100%', padding: '16px 24px 24px 24px', position: 'relative', height: '100%', marginBottom: '100px',
                    '@media (max-width: 480px)': {
                        height: 'auto'
                    }
                 }}>
                <TabContext value={value}>
                    <Box sx={{pb: 4}}>
                        <TabList centered aria-label="Connect to Meta Tabs"
                        TabIndicatorProps={{sx: {backgroundColor: "#5052b2" } }} 
                        sx={{
                            "& .MuiTabs-scroller": {
                                overflowX: 'auto !important',
                            },
                            "& .MuiTabs-flexContainer": {
                            justifyContent:'center',
                            '@media (max-width: 600px)': {
                                gap: '16px'
                            }
                        }}}>
                        <Tab label="Login" value="1" sx={metaStyles.tabHeading} />
                        <Tab label="Contact Sync" value="2" sx={metaStyles.tabHeading} />
                        <Tab label="Map data" value="3" sx={metaStyles.tabHeading} />
                        </TabList>
                    </Box>
                    <TabPanel value="1" sx={{ p: 0 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                                
                                <Image src='/meta-icon.svg' alt='meta-icon' height={24} width={36} />
                                    <Typography variant="h6" sx={{
                                        fontFamily: 'Nunito Sans',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#202124',
                                        marginTop: '12px',
                                        lineHeight: 'normal'
                                    }}>login to your Facebook</Typography>
                                    <Button
                                    fullWidth
                                        variant="contained"
                                        startIcon={<Image src='/facebook-icon.svg' alt='facebook' height={24} width={24} /> }
                                        sx={{
                                            backgroundColor: '#0066ff',
                                            fontFamily: "Nunito Sans",
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            lineHeight: '17px',
                                            letterSpacing: '0.25px',
                                            color: "#fff",
                                            textTransform: 'none',
                                            padding: '14.5px 24px',
                                            '&:hover': {
                                                backgroundColor: '#0066ff'
                                            },
                                            borderRadius: '6px',
                                            border: '1px solid #0066ff',
                                        }}
                                    >
                                        Connect to Facebook
                                    </Button>
                            </Box>
                    </TabPanel>
                    
                    <TabPanel value="2" sx={{ p: 0 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 3 }}>
                                    <Image src='/meta-icon.svg' alt='meta-icon' height={24} width={36} />
                                    <Typography variant="h6" sx={{
                                        fontFamily: 'Nunito Sans',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#202124',
                                        lineHeight: 'normal'
                                    }}>Contact sync</Typography>
                                    <Tooltip title="Sync data with list" placement="right">
                                        <Image src='/baseline-info-icon.svg' alt='baseline-info-icon' height={16} width={16} />
                                    </Tooltip>
                                </Box>

                                
                                <ClickAwayListener onClickAway={handleClose}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <TextField
                                    label="AD ID"
                                    variant="outlined"
                                    fullWidth
                                    margin="normal"
                                    error={adIdError}
                                    helperText={adIdError ? 'AD ID is required' : ''}
                                    value={adId}
                                    onChange={handleAdIdChange}
                                    InputLabelProps={{ sx: metaStyles.inputLabel }}
                                    InputProps={{ sx: metaStyles.formInput }}
                                    sx={{ margin: 0}}
                                    />
                                    <TextField
                                    ref={textFieldRef}
                                        variant="outlined"
                                        value={selectedOption}
                                        onClick={handleClick} // Shrinks the label when clicked
                                        size="small"
                                        fullWidth
                                        label="Select or Create custom audience list"
                                        InputLabelProps={{
                                            shrink: isShrunk || selectedOption !== "", // Shrinks label if clicked or if value is not empty
                                            sx: {
                                                fontFamily: 'Nunito Sans',
                                            fontSize: '12px',
                                            lineHeight: '16px',
                                            color: 'rgba(17, 17, 19, 0.60)',
                                            letterSpacing: '0.06px',
                                            top: '5px',
                                            '&.Mui-focused': {
                                                color: '#0000FF',
                                            },
                                            }
                                        }}
                                        InputProps={{
                                            
                                            endAdornment: (
                                              <InputAdornment position="end">
                                                <IconButton onClick={handleDropdownToggle} edge="end">
                                                  {isDropdownOpen ? <Image src='/chevron-drop-up.svg' alt='chevron-drop-up' height={24} width={24} /> : <Image src='/chevron-drop-down.svg' alt='chevron-drop-down' height={24} width={24} />}
                                                </IconButton>
                                              </InputAdornment>
                                            ),
                                            sx: metaStyles.formInput
                                          }}
                                          sx={{
                                            '& input': {
                                              caretColor: 'transparent', // Hide caret with transparent color
                                              fontFamily: "Nunito",
                                            fontSize: "14px",
                                            color: "rgba(0, 0, 0, 0.89)",
                                            fontWeight: "600",
                                            lineHeight: "normal",
                                            },
                                            '& .MuiOutlinedInput-input': {
                                              cursor: 'default', // Prevent showing caret on input field
                                              top: '5px'
                                            },
                                            
                                          }}
                                        />
                                        
                                        <Menu
                                            anchorEl={anchorEl}
                                            open={Boolean(anchorEl) && isDropdownOpen}
                                            onClose={handleClose}
                                            PaperProps={{
                                                sx: { width: anchorEl ? `${anchorEl.clientWidth}px` : '538px', borderRadius: '4px',
                                                border: '1px solid #e4e4e4' }, // Match dropdown width to input
                                            }}
                                            sx={{
                                                
                                            }}
                                        >
                                            {/* Show "Create New List" option */}
                                            <MenuItem onClick={() => handleSelectOption('createNew')} sx={{
                                                borderBottom: showCreateForm ?  "none" : "1px solid #cdcdcd",
                                                '&:hover': {
                                                    background: 'rgba(80, 82, 178, 0.10)'
                                                }
                                            }}>
                                                <ListItemText primary={`+ Create custom audience list`} primaryTypographyProps={{
                                                        sx: {
                                                            fontFamily: "Nunito Sans",
                                                            fontSize: "14px",
                                                            color: showCreateForm ?  "#5052B2" : "rgba(0, 0, 0, 0.89)",
                                                            fontWeight: "500",
                                                            lineHeight: "20px",
                                                            
                                                        }
                                                    }}/>
                                            </MenuItem>

                                            {/* Show Create New List form if 'showCreateForm' is true */}
                                            {showCreateForm && (
                                                <Box>
                                                    <Box sx={{
                                                        display: 'flex',
                                                        gap: '24px',
                                                        p: 2,
                                                        width: anchorEl ? `${anchorEl.clientWidth}px` : '538px',
                                                        pt: 0,
                                                        '@media (max-width: 600px)': {
                                                            flexDirection: 'column'
                                                        },
                                                    }}>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            gap: '16px',
                                                            width: '100%',
                                                            '@media (max-width: 600px)': {
                                                                flexDirection: 'column'
                                                            },
                                                        }}
                                                    >
                                                        <TextField
                                                            label="List Name"
                                                            variant="outlined"
                                                            value={newListName}
                                                            onChange={(e) => setNewListName(e.target.value)}
                                                            size="small"
                                                            fullWidth
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                            error={listNameError}
                                                            helperText={listNameError ? 'List Name is required' : ''}
                                                            InputLabelProps={{
                                                                sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '12px',
                                                                lineHeight: '16px',
                                                                fontWeight: '400',
                                                                color: 'rgba(17, 17, 19, 0.60)',
                                                                '&.Mui-focused': {
                                                                    color: '#0000FF',
                                                                },
                                                                }
                                                            }}
                                                            InputProps={{
                                                                
                                                                endAdornment: (
                                                                    newListName && ( // Conditionally render close icon if input is not empty
                                                                        <InputAdornment position="end">
                                                                          <IconButton 
                                                                            edge="end"
                                                                            onClick={() => setNewListName('')} // Clear the text field when clicked
                                                                          >
                                                                            <Image 
                                                                              src='/close-circle.svg' 
                                                                              alt='close-circle' 
                                                                              height={18} 
                                                                              width={18} // Adjust the size as needed
                                                                            />
                                                                          </IconButton>
                                                                        </InputAdornment>
                                                                      )
                                                                ),
                                                                sx: {
                                                                    '&.MuiOutlinedInput-root': {
                                                                        height: '32px',
                                                                        '& .MuiOutlinedInput-input': {
                                                                            padding: '5px 16px 4px 16px',
                                                                            fontFamily: 'Roboto',
                                                                            color: '#202124',
                                                                            fontSize: '14px',
                                                                            fontWeight: '400',
                                                                            lineHeight: '20px'
                                                                        },
                                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                                            borderColor: '#A3B0C2',
                                                                        },
                                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                            borderColor: '#A3B0C2',
                                                                        },
                                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                            borderColor: '#0000FF',
                                                                        },
                                                                        },
                                                                        '&+.MuiFormHelperText-root': {
                                                                            marginLeft: '0',
                                                                        },
                                                                }
                                                              }}
                                                        />
                                                        
                                                    </Box>
                                                        <Box sx={{textAlign: 'right'}}>
                                                        <Button variant="contained" onClick={handleSave}
                                                        disabled={listNameError || !newListName}
                                                        sx={{
                                                            borderRadius: '4px',
                                                            border: '1px solid #5052B2',
                                                            background: '#fff',
                                                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                            fontFamily: 'Nunito Sans',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            lineHeight: '20px',
                                                            color: '#5052b2',
                                                            textTransform: 'none',
                                                            padding: '4px 22px',
                                                            '&:hover' : {
                                                                background: 'transparent'
                                                            },
                                                            '&.Mui-disabled' : {
                                                                background: 'transparent',
                                                                color: '#5052b2'
                                                            }
                                                        }}>
                                                                Save
                                                            </Button>
                                                        </Box>

                                                        </Box>
                                                    

                                                    {/* Add a Divider to separate form from options */}
                                                    <Divider sx={{ borderColor: '#cdcdcd' }} />
                                                </Box>
                                            )}

                                            {/* Show static options */}
                                            {staticOptions.map((option, index) => (
                                                <MenuItem key={index} onClick={() => handleSelectOption(option)} sx={{
                                                    '&:hover': {
                                                        background: 'rgba(80, 82, 178, 0.10)'
                                                    } }}>
                                                    <ListItemText primary={option}  primaryTypographyProps={{
                                                        sx: {
                                                            fontFamily: "Nunito Sans",
                                                            fontSize: "14px",
                                                            color: "#202124",
                                                            fontWeight: "500",
                                                            lineHeight: "20px"
                                                        }
                                                    }} />
                                                </MenuItem>
                                            ))}
                                        </Menu>
                                    </Box>
                                </ClickAwayListener>
                                
                            </Box>
                        </Box>
                    </TabPanel>
                    <TabPanel value="3" sx={{ p: 0 }}>
                        <Box sx={{
                            borderRadius: '4px',
                            border: '1px solid #f0f0f0',
                            boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)',
                            padding: '16px 24px',
                            overflowX: 'auto'
                        }}>
                            <Box sx={{display: 'flex', gap: '8px', marginBottom: '20px'}}>
                            <Typography variant="h6" sx={{
                                            fontFamily: 'Nunito Sans',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#202124',
                                            lineHeight: 'normal'
                                        }}>Map list</Typography>
                                        <Typography variant='h6' sx={{
                                            background: '#EDEDF7',
                                            borderRadius: '3px',
                                            fontFamily: 'Roboto',
                                            fontSize: '12px',
                                            fontWeight: '400',
                                            color: '#5f6368',
                                            padding: '2px 4px',
                                            lineHeight: '16px'
                                        }}>
                                            Test list 2
                                        </Typography>
                            </Box>

                            <Grid container alignItems="center" sx={{flexWrap: { xs: 'nowrap', sm: 'wrap' }, marginBottom: '14px'}}>
                                <Grid item xs="auto" sm={5} sx={{
                                    textAlign: 'center',
                                    '@media (max-width:599px)': {
                                        minWidth: '196px'
                                    }
                                    }}>
                                    <Image src='/logo.svg' alt='logo' height={15} width={24} />
                                </Grid>
                                <Grid item xs="auto" sm={1} sx={{
                                    '@media (max-width:599px)': {
                                        minWidth: '50px'
                                    }
                                    }}>&nbsp;</Grid>
                                <Grid item xs="auto" sm={5} sx={{textAlign: 'center',
                                    '@media (max-width:599px)': {
                                        minWidth: '196px'
                                    }
                                }}>
                                    <Image src='/meta-icon.svg' alt='meta-icon' height={20} width={30} />
                                </Grid>
                                <Grid item xs="auto" sm={1}>&nbsp;</Grid>
                            </Grid>

                            {rows.map((row, index) => (
                                <Box key={row.id} sx={{ mb: 2 }}> {/* Add margin between rows */}
                                <Grid container spacing={2} alignItems="center" sx={{flexWrap: { xs: 'nowrap', sm: 'wrap' }}}>
                                    {/* Left Input Field */}
                                    <Grid item xs="auto" sm={5}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={row.type}
                                        value={row.value}
                                        onChange={(e) => handleMapListChange(row.id, 'value', e.target.value)}
                                        InputLabelProps={{
                                            sx: {
                                            fontFamily: 'Nunito Sans',
                                            fontSize: '12px',
                                            lineHeight: '16px',
                                            color: 'rgba(17, 17, 19, 0.60)',
                                            top: '-5px',
                                            '&.Mui-focused': {
                                                color: '#0000FF',
                                                top: 0
                                            },
                                            '&.MuiInputLabel-shrink': {
                                                top: 0
                                            }
                                            }
                                        }}
                                        InputProps={{
                                            
                                            sx: {
                                                '&.MuiOutlinedInput-root': {
                                                    height: '36px',
                                                    '& .MuiOutlinedInput-input': {
                                                        padding: '6.5px 8px',
                                                        fontFamily: 'Roboto',
                                                        color: '#202124',
                                                        fontSize: '14px',
                                                        fontWeight: '400',
                                                        lineHeight: '20px'
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#A3B0C2',
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#A3B0C2',
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#0000FF',
                                                    },
                                                    },
                                                    '&+.MuiFormHelperText-root': {
                                                        marginLeft: '0',
                                                    },
                                            }
                                          }}
                                    />
                                    </Grid>
                                    
                                    {/* Middle Icon Toggle (Right Arrow or Close Icon) */}
                                    <Grid item xs="auto" sm={1} container justifyContent="center">
                                    {row.selectValue !== undefined ? (
                                        row.selectValue ? (
                                            <Image 
                                                src='/chevron-right-purple.svg' 
                                                alt='chevron-right-purple' 
                                                height={18} 
                                                width={18} // Adjust the size as needed
                                            />
                                            
                                        ) : (
                                            <Image 
                                                src='/close-circle.svg' 
                                                alt='close-circle' 
                                                height={18} 
                                                width={18} // Adjust the size as needed
                                            />
                                        )
                                    ) : (
                                        <Image 
                                            src='/chevron-right-purple.svg' 
                                            alt='chevron-right-purple' 
                                            height={18} 
                                            width={18} // Adjust the size as needed
                                        /> // For the first two rows, always show the right arrow
                                    )}
                                    </Grid>
                                    
                                    {/* Right Side Input or Dropdown */}
                                    <Grid item xs="auto" sm={5}>
                                    {index < 2 ? ( // For the first two rows, show input fields
                                        <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={row.type}
                                        value={row.value}
                                        onChange={(e) => handleMapListChange(row.id, 'value', e.target.value)}
                                        InputLabelProps={{
                                            sx: {
                                            fontFamily: 'Nunito Sans',
                                            fontSize: '12px',
                                            lineHeight: '16px',
                                            color: 'rgba(17, 17, 19, 0.60)',
                                            top: '-5px',
                                            '&.Mui-focused': {
                                                color: '#0000FF',
                                                top: 0
                                            },
                                            '&.MuiInputLabel-shrink': {
                                                top: 0
                                            }
                                            }
                                        }}
                                        InputProps={{
                                            
                                            sx: {
                                                '&.MuiOutlinedInput-root': {
                                                    height: '36px',
                                                    '& .MuiOutlinedInput-input': {
                                                        padding: '6.5px 8px',
                                                        fontFamily: 'Roboto',
                                                        color: '#202124',
                                                        fontSize: '14px',
                                                        fontWeight: '400',
                                                        lineHeight: '20px'
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#A3B0C2',
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#A3B0C2',
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: '#0000FF',
                                                    },
                                                    },
                                                    '&+.MuiFormHelperText-root': {
                                                        marginLeft: '0',
                                                    },
                                            }
                                          }}
                                        />
                                    ) : (
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            label="Select"
                                            select
                                            sx={{minWidth: '194px'}}
                                            value={row.selectValue || ""}
                                            onChange={(e: React.ChangeEvent<{ value: unknown }>) =>
                                                handleMapListChange(row.id, 'selectValue', e.target.value as string)
                                            }
                                            
                                            InputLabelProps={{
                                                sx: {
                                                fontFamily: 'Nunito Sans',
                                                fontSize: '12px',
                                                lineHeight: '16px',
                                                color: 'rgba(17, 17, 19, 0.60)',
                                                top: '-8px',
                                                '&.Mui-focused': {
                                                    color: '#0000FF',
                                                    top: '0'
                                                },
                                                '&.MuiInputLabel-shrink': {
                                                    top: 0
                                                }
                                                }
                                            }}
                                            SelectProps={{
                                                open: openDropdown === row.id,
                                                onOpen: () => handleDropdownOpen(row.id),
                                                // onClose: handleDropdownClose,
                                                onClose: () => {
                                                if (!showCreateMapForm) {
                                                    handleDropdownClose();
                                                    }
                                                },
                                                IconComponent: () => (
                                                openDropdown === row.id ? (
                                                    <Image src='/chevron-drop-up.svg' alt='chevron-drop-up' height={24} width={24} />
                                                ) : (
                                                    <Image src='/chevron-drop-down.svg' alt='chevron-drop-down' height={24} width={24} />
                                                )
                                                ),
                                                sx: {
                                                    '& .MuiOutlinedInput-input': {
                                                        padding: '6.5px 8px',
                                                    },
                                                paddingRight: '16px', // Adds space for the custom icon
                                                fontFamily: 'Roboto',
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                color: '#707071',
                                                },
                                            }}
                                            onClick={() => {
                                                if (openDropdown === row.id) {
                                                  handleDropdownClose();
                                                } else {
                                                  handleDropdownOpen(row.id);
                                                }
                                              }}
                                            >
                                            {/* <MenuItem value="" sx= {{
                                                            fontFamily: "Nunito",
                                                            fontSize: "14px",
                                                            color: "#7b7b7b",
                                                            lineHeight: "20px"
                                                        }}>Select</MenuItem> */}
                                            <MenuItem 
                                            
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent click event from closing the dropdown
                                                handleSelectMapOption('createNewField',e, row.id);
                                              }} sx={{
                                                borderBottom: showCreateMapForm ?  "none" : "1px solid #cdcdcd",
                                                '&:hover': {
                                                    background: 'rgba(80, 82, 178, 0.10)'
                                                }
                                            }}>
                                                <ListItemText onClick={(e) => {
                                                e.stopPropagation(); // Prevent click event from closing the dropdown
                                                handleSelectMapOption('createNewField',e, row.id);
                                              }} primary={`+ Add new field`} primaryTypographyProps={{
                                                        sx: {
                                                            fontFamily: "Nunito Sans",
                                                            fontSize: "14px",
                                                            color: showCreateMapForm ?  "#5052B2" : "#202124",
                                                            fontWeight: "500",
                                                            lineHeight: "20px",
                                                            
                                                        }
                                                    }}/>
                                            </MenuItem>

                                            {/* Show Create New List form if 'showCreateForm' is true */}
                                            {showCreateMapForm && (
                                                <Box>
                                                    <Box onClick={(e) => e.stopPropagation()}  sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '24px',
                                                        p: 2,
                                                        width: '208px',
                                                        pt: 0
                                                    }}>
                                                    <Box
                                                        sx={{
                                                            
                                                            
                                                            mt: 1, // Margin-top to separate form from menu item
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            gap: '16px',
                                                            '@media (max-width: 600px)': {
                                                                flexDirection: 'column'
                                                            },
                                                        }}
                                                    >
                                                        <TextField
                                                            label="List Name"
                                                            variant="outlined"
                                                            value={newMapListName}
                                                            onChange={(e) => setNewMapListName(e.target.value)}
                                                            size="small"
                                                            fullWidth
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                            error={listNameError}
                                                            helperText={listNameError ? 'List Name is required' : ''}
                                                            InputLabelProps={{
                                                                sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '12px',
                                                                lineHeight: '16px',
                                                                fontWeight: '400',
                                                                color: 'rgba(17, 17, 19, 0.60)',
                                                                '&.Mui-focused': {
                                                                    color: '#0000FF',
                                                                },
                                                                }
                                                            }}
                                                            InputProps={{
                                                                
                                                                endAdornment: (
                                                                    newListName && ( // Conditionally render close icon if input is not empty
                                                                        <InputAdornment position="end">
                                                                          <IconButton 
                                                                            edge="end"
                                                                            onClick={() => setNewMapListName('')} // Clear the text field when clicked
                                                                          >
                                                                            <Image 
                                                                              src='/close-circle.svg' 
                                                                              alt='close-circle' 
                                                                              height={18} 
                                                                              width={18} // Adjust the size as needed
                                                                            />
                                                                          </IconButton>
                                                                        </InputAdornment>
                                                                      )
                                                                ),
                                                                sx: {
                                                                    '&.MuiOutlinedInput-root': {
                                                                        height: '32px',
                                                                        '& .MuiOutlinedInput-input': {
                                                                            padding: '5px 16px 4px 16px',
                                                                            fontFamily: 'Roboto',
                                                                            color: '#202124',
                                                                            fontSize: '14px',
                                                                            fontWeight: '400',
                                                                            lineHeight: '20px'
                                                                        },
                                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                                            borderColor: '#A3B0C2',
                                                                        },
                                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                            borderColor: '#A3B0C2',
                                                                        },
                                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                            borderColor: '#0000FF',
                                                                        },
                                                                        },
                                                                        '&+.MuiFormHelperText-root': {
                                                                            marginLeft: '0',
                                                                        },
                                                                }
                                                              }}
                                                        />
                                                        
                                                    </Box>
                                                        <Box sx={{textAlign: 'right'}}>
                                                        <Button variant="contained" onClick={() => handleMapSave(row.id)}
                                                        disabled={maplistNameError || !newMapListName}
                                                        sx={{
                                                            borderRadius: '4px',
                                                            border: '1px solid #5052B2',
                                                            background: '#fff',
                                                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                            fontFamily: 'Nunito Sans',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            lineHeight: '20px',
                                                            color: '#5052b2',
                                                            textTransform: 'none',
                                                            padding: '4px 22px',
                                                            '&:hover' : {
                                                                background: 'transparent'
                                                            },
                                                            '&.Mui-disabled' : {
                                                                background: 'transparent',
                                                                color: '#5052b2'
                                                            }
                                                        }}>
                                                                Save
                                                            </Button>
                                                        </Box>

                                                        </Box>
                                                    

                                                    {/* Add a Divider to separate form from options */}
                                                    <Divider sx={{ borderColor: '#cdcdcd' }} />
                                                </Box>
                                            )}

                                            {mapListOptions.map(option => (
                                                    <MenuItem key={option} value={option} sx= {{
                                                        fontFamily: "Nunito Sans",
                                                        fontSize: "14px",
                                                        color: "#202124",
                                                        lineHeight: "20px",
                                                        fontWeight: '500'
                                                    }}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                        </TextField>

                                    )}
                                    </Grid>
                                    
                                    {/* Delete Icon */}
                                    <Grid item xs="auto" sm={1} container justifyContent="center">
                                    {row.canDelete && (
                                        <>
                                        <IconButton onClick={(event) => handleClickOpen(event, row.id)}>
                                            <Image 
                                                src='/trash-icon-filled.svg' 
                                                alt='trash-icon-filled' 
                                                height={18} 
                                                width={18} // Adjust the size as needed
                                            />
                                        </IconButton>
                                        <Popover
                                        id={deleteId}
                                        open={deleteOpen}
                                        anchorEl={deleteAnchorEl}
                                        onClose={handleDeleteClose}
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'center',
                                        }}
                                        transformOrigin={{
                                            vertical: 'top',
                                            horizontal: 'right',
                                        }}
                                    >
                                        <Box sx={{
                                            minWidth: '254px',
                                            borderRadius: '4px',
                                            border: '0.2px solid #afafaf',
                                            background: '#fff',
                                            boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.12)',
                                            padding: '16px 21px 16px 16px'
                                        }}>
                                            <Typography variant="body1" sx={{
                                                color: '#202124',
                                                fontFamily: 'Nunito Sans',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                lineHeight: 'normal',
                                                paddingBottom: '12px'
                                            }}>Confirm Deletion</Typography>
                                            <Typography variant="body2" sx={{
                                                color: '#5f6368',
                                                fontFamily: 'Roboto',
                                                fontSize: '12px',
                                                fontWeight: '400',
                                                lineHeight: '16px',
                                                paddingBottom: '26px'
                                            }}>
                                                Are you sure you want to delete this <br /> map data?
                                            </Typography>
                                            <Box display="flex" justifyContent="flex-end" mt={2}>
                                                <Button onClick={handleDeleteClose}  sx={{
                                                    borderRadius: '4px',
                                                    border: '1px solid #5052b2',
                                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                    color: '#5052b2',
                                                    fontFamily: 'Nunito Sans',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    lineHeight: '20px',
                                                    marginRight: '16px',
                                                    textTransform: 'none'
                                                }}>
                                                    Clear
                                                </Button>
                                                <Button onClick={handleDelete} sx={{
                                                    background: '#5052B2',
                                                    borderRadius: '4px',
                                                    border: '1px solid #5052b2',
                                                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                    color: '#fff',
                                                    fontFamily: 'Nunito Sans',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    lineHeight: '20px',
                                                    textTransform: 'none',
                                                    '&:hover': {
                                                        color: '#5052B2'
                                                    }
                                                }}>
                                                    Delete
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Popover>
                                    </>
                                    )}
                                    </Grid>
                                </Grid>
                                </Box>
                            ))}
                                
                                <Button color="primary" onClick={handleAddRow} sx={{
                                    fontFamily: 'Nunito Sans',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#5052B2',
                                    lineHeight: '22px',
                                    textTransform: 'none',
                                    '&:hover': {
                                        background: '#fff'
                                    }
                                }}>
                                    Add Row +
                                    </Button>

                        </Box>
                    </TabPanel>
                </TabContext>
                {/* Button based on selected tab */}
                    
            </Box>
            {getButton(value) && (
            <Box sx={{ px: 2, py: 3.5, border: '1px solid #e4e4e4', position: 'fixed', bottom: 0, right: 0, background: '#fff',
                width: '620px',
                '@media (max-width: 600px)': {
                        width: '100%',
                } }}>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                            
                                {getButton(value)}
                        </Box>
                    </Box>
                    )}
            </Box>
             
        </Drawer>
    );
};
export default ConnectMeta;