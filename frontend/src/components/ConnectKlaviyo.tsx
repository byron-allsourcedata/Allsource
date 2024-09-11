import React, { useState, useRef, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, TextField, Divider, FormGroup, FormControlLabel, FormControl, FormLabel, Radio, Collapse, Checkbox, Button, List, ListItem, Link, Tab, Tooltip, Switch, RadioGroup, InputLabel, MenuItem, Select, Dialog, DialogActions, DialogContent, DialogTitle, Popover, Menu, SelectChangeEvent, ListItemText, ClickAwayListener, InputAdornment, Grid} from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Image from 'next/image';
import CloseIcon from '@mui/icons-material/Close';

interface ConnectKlaviyoPopupProps {
    open: boolean;
    onClose: () => void;
}

const ConnectKlaviyo: React.FC<ConnectKlaviyoPopupProps> = ({ open, onClose }) => {

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
    };

    // Handle Save action for the create new list form
    const handleSave = () => {
        if (newListName.trim()) { // Only save if newListName is not empty
            setSelectedOption(newListName); // Update selected option with new list name
            handleClose();
        }
    };



    const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setChecked(event.target.checked);
    };

    const label = { inputProps: { 'aria-label': 'Switch demo' } };

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };


    const klaviyoStyles = {
        tabHeading: {
            fontFamily: 'Nunito',
            fontSize: '16px',
            color: '#7b7b7b',
            fontWeight: '400',
            lineHeight: 'normal',
            textTransform: 'none',
            padding: 0,
            minWidth: 'auto',
            px: 2,
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
            fontFamily: 'Nunito',
            fontSize: '16px',
            lineHeight: 'normal',
            color: 'rgba(17, 17, 19, 0.60)',
            top: '-3px',
            '&.Mui-focused': {
                color: '#0000FF',
              },
        },
        formInput: {
            '&.MuiOutlinedInput-root': {
              height: '48px',
              '& .MuiOutlinedInput-input': {
                padding: '12px 16px 13px 16px',
                fontFamily: 'Nunito',
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

    type HighlightConfig = {
        [keyword: string]: { color?: string; fontWeight?: string }; // keyword as the key, style options as the value
      };
      
      const highlightText = (text: string, highlightConfig: HighlightConfig) => {
          // Start with the whole text as a single part.
          let parts: (string | JSX.Element)[] = [text];
      
          // For each keyword, split the text and insert the highlighted part.
          Object.keys(highlightConfig).forEach((keyword, keywordIndex) => {
              const { color, fontWeight } = highlightConfig[keyword];
              parts = parts.flatMap((part, partIndex) =>
                  // Only split if the part is a string and contains the keyword.
                  typeof part === 'string' && part.includes(keyword)
                      ? part.split(keyword).flatMap((segment, index, array) =>
                          index < array.length - 1
                              ? [
                                  segment,
                                  <span
                                      style={{
                                          color: color || 'inherit',
                                          fontWeight: fontWeight || 'normal'
                                      }}
                                      key={`highlight-${keywordIndex}-${partIndex}-${index}`}
                                  >
                                      {keyword}
                                  </span>
                              ]
                              : [segment]
                          )
                      : [part] // Otherwise, just keep the part as is (could be JSX).
              );
          });
      
          return <>{parts}</>; // Return the array wrapped in a fragment.
      };

    const instructions = [
        { id: 'unique-id-1', text: 'Go to the Klaviyo website and log into your account.' },
        { id: 'unique-id-2', text: 'Click on the Settings option located in your Klaviyo account options.' },
        { id: 'unique-id-3', text: 'Click Create Private API Key Name to Maximiz.' },
        { id: 'unique-id-4', text: 'Assign full access permissions to Lists and Profiles, and read access permissions to Metrics, Events, and Templates for your Klaviyo key.' },
        { id: 'unique-id-5', text: 'Click Create.' },
        { id: 'unique-id-6', text: 'Copy the API key in the next screen and paste to API Key field located in Maximiz Klaviyo section.' },
        { id: 'unique-id-7', text: 'Click Connect.' },
        { id: 'unique-id-8', text: 'Select the existing list or create a new one to integrate with Maximiz.' },
        { id: 'unique-id-9', text: 'Click Export.' },
        
    ]

    // Define the keywords and their styles
    const highlightConfig: HighlightConfig = {
        'Klaviyo': { color: '#5052B2', fontWeight: '700' }, // Blue and bold
        'Settings': { fontWeight: '700' }, // Bold only
        'Create Private API Key': { fontWeight: '700' }, // Blue and bold
        'Lists': { fontWeight: '700' }, // Bold only
        'Profiles': { fontWeight: '700' }, // Bold only
        'Metrics': { fontWeight: '700' }, // Blue and bold
        'Events': { fontWeight: '700' }, // Blue and bold
        'Templates': { fontWeight: '700' }, // Blue and bold
        'Create': { fontWeight: '700' }, // Blue and bold
        'API Key': { fontWeight: '700' }, // Blue and bold
        'Connect': { fontWeight: '700' }, // Bold only
        'Export': { fontWeight: '700' } // Blue and bold
    };

    // Define buttons for each tab
    const getButton = (tabValue: string) => {
        switch (tabValue) {
            case '1':
                return (
                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: '#5052B2',
                            fontFamily: "Nunito",
                            fontSize: '16px',
                            fontWeight: '600',
                            lineHeight: '22px',
                            letterSpacing: 'normal',
                            color: "#fff",
                            textTransform: 'none',
                            padding: '10px 24px',
                            '&:hover': {
                                backgroundColor: '#5052B2'
                            },
                            borderRadius: '4px',
                        }}
                    >
                        Connect
                    </Button>
                );
            case '2':
                return (
                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: '#5052B2',
                            fontFamily: "Nunito",
                            fontSize: '16px',
                            fontWeight: '600',
                            lineHeight: '22px',
                            letterSpacing: 'normal',
                            color: "#fff",
                            textTransform: 'none',
                            padding: '10px 24px',
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
                            fontFamily: "Nunito",
                            fontSize: '16px',
                            fontWeight: '600',
                            lineHeight: '22px',
                            letterSpacing: 'normal',
                            color: "#fff",
                            textTransform: 'none',
                            padding: '10px 24px',
                            '&:hover': {
                                backgroundColor: '#5052B2'
                            },
                            borderRadius: '4px',
                        }}
                    >
                        Next
                    </Button>
                );
            case '4':
                return (
                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: '#5052B2',
                            fontFamily: "Nunito",
                            fontSize: '16px',
                            fontWeight: '600',
                            lineHeight: '22px',
                            letterSpacing: 'normal',
                            color: "#fff",
                            textTransform: 'none',
                            padding: '10px 24px',
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
    const handleDelete = (id: number) => {
        setRows(rows.filter(row => row.id !== id));
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
                    '@media (max-width: 600px)': {
                        width: '100%',
                    }
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 3.5, px: 2, borderBottom: '1px solid #e4e4e4' }}>
                <Typography variant="h6" sx={{ textAlign: 'center', color: '#1c1c1c', fontFamily: 'Nunito', fontWeight: '700', fontSize: '16px', lineHeight: 'normal' }}>
                    Connect to Klaviyo
                </Typography>
                <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                    <Link href="#" sx={{
                        fontFamily: 'Nunito',
                        fontSize: '16px',
                        fontWeight: '600',
                        lineHeight: '22px',
                        color: '#5052b2',
                        textDecorationColor: '#5052b2'
                    }}>Tutorial</Link>
                    <IconButton onClick={onClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                <Box sx={{ width: '100%', padding: '16px 24px 24px 24px', position: 'relative' }}>
                <TabContext value={value}>
                    <Box sx={{pb: 4}}>
                        <TabList onChange={handleChange} centered aria-label="Connect to Klaviyo Tabs"
                        TabIndicatorProps={{sx: {backgroundColor: "#5052b2" } }} 
                        sx={{
                            "& .MuiTabs-scroller": {
                                overflowX: 'auto !important',
                            },
                            "& .MuiTabs-flexContainer": {
                            justifyContent:'center',
                            '@media (max-width: 600px)': {
                                gap: '16px',
                                justifyContent:'flex-start'
                            }
                        }}}>
                        <Tab label="API Key" value="1" sx={klaviyoStyles.tabHeading} />
                        <Tab label="Suppression Sync" value="2" sx={klaviyoStyles.tabHeading} />
                        <Tab label="Contact Sync" value="3" sx={klaviyoStyles.tabHeading} />
                        <Tab label="Map data" value="4" sx={klaviyoStyles.tabHeading} />
                        </TabList>
                    </Box>
                    <TabPanel value="1" sx={{ p: 0 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Image src='/klaviyo.svg' alt='klaviyo' height={26} width={32} />
                                    <Typography variant="h6" sx={{
                                        fontFamily: 'Nunito',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        color: '#4a4a4a'
                                    }}>API Key</Typography>
                                    <Tooltip title="Enter the API key provided by Klaviyo" placement="right">
                                        <Image src='/baseline-info-icon.svg' alt='baseline-info-icon' height={16} width={16} />
                                    </Tooltip>
                                </Box>
                                <TextField
                                    label="Enter API Key"
                                    variant="outlined"
                                    fullWidth
                                    margin="normal"
                                    InputLabelProps={{ sx: klaviyoStyles.inputLabel }}
                                    InputProps={{ sx: klaviyoStyles.formInput }}
                                />
                            </Box>
                            <Box sx={{ background: '#f0f0f0', border: '1px solid #efefef', borderRadius: '4px', p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 2 }}>
                                    <Image src='/info-circle.svg' alt='info-circle' height={20} width={20} />
                                    <Typography variant="subtitle1" sx={{
                                        fontFamily: 'Nunito',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        color: '#4a4a4a',
                                        lineHeight: '16px'
                                    }}>How to integrate Klaviyo</Typography>
                                </Box>
                                <List dense sx={{ p: 0 }}>
                                    {instructions.map((instruction, index) => (
                                        <ListItem key={instruction.id} sx={{ p: 0, alignItems: 'flex-start' }}>
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    display: 'inline-block',
                                                    marginRight: '4px',
                                                    fontFamily: 'Nunito',
                                                    fontSize: '12px',
                                                    fontWeight: '400',
                                                    color: '#4a4a4a',
                                                    lineHeight: '22px'
                                                }}
                                            >
                                                {instructions.indexOf(instruction) + 1}.
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    display: 'inline',
                                                    fontFamily: 'Nunito',
                                                    fontSize: '12px',
                                                    fontWeight: '400',
                                                    color: '#4a4a4a',
                                                    lineHeight: '22px'
                                                }}
                                            >
                                                {highlightText(instruction.text, highlightConfig)}
                                            </Typography>
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        </Box>
                    </TabPanel>
                    <TabPanel value="2" sx={{ p: 0 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)', display: 'flex', flexDirection:'column', gap: '16px' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Image src='/klaviyo.svg' alt='klaviyo' height={26} width={32} />
                                    <Typography variant="h6" sx={{
                                        fontFamily: 'Nunito',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        color: '#4a4a4a',
                                        lineHeight: 'normal'
                                    }}>Eliminate Redundancy: Stop Paying for Contacts You Already Own</Typography>
                                </Box>
                                <Typography variant="subtitle1" sx={{
                                        fontFamily: 'Nunito',
                                        fontSize: '14px',
                                        fontWeight: '400',
                                        color: '#7b7b7b',
                                        lineHeight: '20px'
                                    }}>Sync your current list to avoid collecting contacts you already possess.
                                    Newly added contacts in Klaviyo will be automatically suppressed each day.</Typography>
                                

                                        <Box sx={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                                            <Typography variant="subtitle1" sx={{
                                                fontFamily: 'Nunito',
                                                fontSize: '14px',
                                                fontWeight: '400',
                                                color: '#7b7b7b',
                                                lineHeight: '20px'
                                            }}>
                                                Enable Automatic Contact Suppression
                                            </Typography>

                                            {/* Switch Control with Yes/No Labels */}
                                            <Box position="relative" display="inline-block">
                                                <Switch
                                                    {...label}
                                                    checked={checked}
                                                    onChange={handleSwitchChange}
                                                    sx={{
                                                        width: 54, // Increase width to fit "Yes" and "No"
                                                        height: 24,
                                                        padding: 0,
                                                        '& .MuiSwitch-switchBase': {
                                                            padding: 0,
                                                            top: '2px',
                                                            left: '3px',
                                                            '&.Mui-checked': {
                                                                left: 0,
                                                                transform: 'translateX(32px)', // Adjust for larger width
                                                                color: '#fff',
                                                                '&+.MuiSwitch-track': {
                                                                    backgroundColor: checked ? '#5052b2' : '#7b7b7b',
                                                                    opacity: checked ? '1' : '1',
                                                                }
                                                            },
                                                        },
                                                        '& .MuiSwitch-thumb': {
                                                            width: 20,
                                                            height: 20,
                                                        },
                                                        '& .MuiSwitch-track': {
                                                            borderRadius: 20 / 2,
                                                            backgroundColor: checked ? '#5052b2' : '#7b7b7b',
                                                            opacity: checked ? '1' : '1',
                                                            '& .MuiSwitch-track.Mui-checked': {
                                                                backgroundColor: checked ? '#5052b2' : '#7b7b7b',
                                                            opacity: checked ? '1' : '1',
                                                            }
                                                        },
                                                    }}
                                                />
                                                <Box sx={{
                                                    position: "absolute",
                                                    top: "50%",
                                                    left: "0px",
                                                    width: "100%",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    transform: "translateY(-50%)",
                                                    pointerEvents: "none"
                                                }}>
                                                    {/* Conditional Rendering of Text */}
                                                    {!checked && (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontFamily: 'Nunito',
                                                                fontSize: '12px',
                                                                color: '#fff',
                                                                fontWeight: 'bold',
                                                                marginRight: '8px',
                                                                width: '100%',
                                                                textAlign: 'right',
                                                            }}
                                                        >
                                                            No
                                                        </Typography>
                                                    )}

                                                    {checked && (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontFamily: 'Nunito',
                                                                fontSize: '12px',
                                                                color: '#fff',
                                                                fontWeight: 'bold',
                                                                marginLeft: '6px',
                                                            }}
                                                        >
                                                            Yes
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>




                            </Box>
                            <Box sx={{ background: '#efefef', borderRadius: '4px', px: 1.5, py: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Image src='/info-circle.svg' alt='info-circle' height={20} width={20} />
                                    <Typography variant="subtitle1" sx={{
                                        fontFamily: 'Nunito',
                                        fontSize: '12px',
                                        fontWeight: '400',
                                        color: '#4a4a4a',
                                        lineHeight: '16px'
                                    }}>By performing this action, all your Klaviyo contacts will be added to your Grow suppression list, and new contacts will be imported daily around 6pm EST."</Typography>
                                </Box>
                            </Box>
                            <Box sx={{p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)', display: 'flex', flexDirection:'column', gap: '16px'}}>
                                <Typography variant="h6" sx={{
                                        fontFamily: 'Nunito',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        color: '#4a4a4a',
                                        lineHeight: 'normal'
                                    }}>Sync Type</Typography>
                                    <Typography variant="subtitle1" sx={{
                                        fontFamily: 'Nunito',
                                        fontSize: '14px',
                                        fontWeight: '400',
                                        color: '#7b7b7b',
                                        lineHeight: '20px'
                                    }}>Synchronise data gathered from this moment onward in real-time.</Typography>
                                    
                                    <FormControl sx={{gap: '16px'}}>
                                        <FormLabel id="contact-type-radio-buttons-group-label" sx={{
                                            fontFamily: 'Nunito',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#000',
                                            lineHeight: 'normal',
                                            '&.Mui-focused': {
                                                color: '#000'
                                            }
                                        }}>Filter by Contact type</FormLabel>
                                        <RadioGroup
                                            row
                                            aria-labelledby="contact-type-radio-buttons-group-label"
                                            name="contact-type-row-radio-buttons-group"
                                            value={selectedRadioValue}
                                            onChange={handleRadioChange}
                                        >
                                            <FormControlLabel value="allContacts" control={<Radio sx={{color: '#e4e4e4',
                                            '&.Mui-checked': {
                                                color: '#5052b2', // checked color
                                            }
                                            
                                        }} />} label="All Contacts"
                                            componentsProps={{
                                                typography: {
                                                  sx: {
                                                    fontFamily: 'Nunito',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    color: '#000',
                                                    lineHeight: 'normal',
                                                    opacity: selectedRadioValue === 'allContacts' ? 1 : 0.43,
                                                    '@media (max-width:440px)': {
                                                        fontSize: '12px'
                                                    }
                                                  },
                                                },
                                              }}
                                               sx={{
                                            '@media (max-width:600px)': {
                                                flexBasis: 'calc(50% - 8px)'
                                                }
                                               }}
                                            />
                                            <FormControlLabel value="visitors" control={<Radio sx={{color: '#e4e4e4',
                                            '&.Mui-checked': {
                                                color: '#5052b2', // checked color
                                            }
                                            }} />} label="Visitors"
                                            componentsProps={{
                                                typography: {
                                                  sx: {
                                                    fontFamily: 'Nunito',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    color: '#000',
                                                    lineHeight: 'normal',
                                                    opacity: selectedRadioValue === 'visitors' ? 1 : 0.43,
                                                    '@media (max-width:440px)': {
                                                        fontSize: '12px'
                                                    }
                                                  },
                                                },
                                              }}
                                              sx={{
                                                '@media (max-width:600px)': {
                                                    flexBasis: 'calc(50% - 8px)'
                                                    }
                                                   }}
                                            />
                                            <FormControlLabel value="viewProduct" control={<Radio sx={{color: '#e4e4e4',
                                            '&.Mui-checked': {
                                                color: '#5052b2', // checked color
                                            }
                                            }} />} label="View Product"
                                            componentsProps={{
                                                typography: {
                                                  sx: {
                                                    fontFamily: 'Nunito',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    color: '#000',
                                                    lineHeight: 'normal',
                                                    opacity: selectedRadioValue === 'viewProduct' ? 1 : 0.43,
                                                    '@media (max-width:440px)': {
                                                        fontSize: '12px'
                                                    }
                                                  },
                                                },
                                              }}
                                              sx={{
                                                '@media (max-width:600px)': {
                                                    flexBasis: 'calc(50% - 8px)'
                                                    }
                                                   }}
                                              />
                                            <FormControlLabel value="addToCart" control={<Radio sx={{color: '#e4e4e4',
                                            '&.Mui-checked': {
                                                color: '#5052b2', // checked color
                                            }
                                            }} />} label="Add to cart" 
                                            componentsProps={{
                                                typography: {
                                                  sx: {
                                                    fontFamily: 'Nunito',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    color: '#000',
                                                    lineHeight: 'normal',
                                                    opacity: selectedRadioValue === 'addToCart' ? 1 : 0.43,
                                                    '@media (max-width:440px)': {
                                                        fontSize: '12px'
                                                    }
                                                  },
                                                },
                                              }}
                                              sx={{
                                                '@media (max-width:600px)': {
                                                    flexBasis: 'calc(50% - 8px)'
                                                    }
                                                   }}
                                            />
                                        </RadioGroup>
                                    </FormControl>
                            </Box>
                        </Box>
                    </TabPanel>
                    <TabPanel value="3" sx={{ p: 0 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 3 }}>
                                    <Image src='/klaviyo.svg' alt='klaviyo' height={26} width={32} />
                                    <Typography variant="h6" sx={{
                                        fontFamily: 'Nunito',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        color: '#4a4a4a'
                                    }}>Contact sync</Typography>
                                    <Tooltip title="Sync data with list" placement="right">
                                        <Image src='/baseline-info-icon.svg' alt='baseline-info-icon' height={16} width={16} />
                                    </Tooltip>
                                </Box>

                                
                                <ClickAwayListener onClickAway={handleClose}>
                                    <Box>
                                    <TextField
                                    ref={textFieldRef}
                                        variant="outlined"
                                        value={selectedOption}
                                        onClick={handleClick} // Shrinks the label when clicked
                                        size="small"
                                        fullWidth
                                        label="Select or Create new list"
                                        InputLabelProps={{
                                            shrink: isShrunk || selectedOption !== "", // Shrinks label if clicked or if value is not empty
                                            sx: {
                                                fontFamily: 'Nunito',
                                            fontSize: '16px',
                                            lineHeight: 'normal',
                                            color: 'rgba(17, 17, 19, 0.60)',
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
                                            sx: klaviyoStyles.formInput
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
                                                <ListItemText primary={`+ Create new list`} primaryTypographyProps={{
                                                        sx: {
                                                            fontFamily: "Nunito",
                                                            fontSize: "14px",
                                                            color: showCreateForm ?  "#5052B2" : "rgba(0, 0, 0, 0.89)",
                                                            fontWeight: "600",
                                                            lineHeight: "normal",
                                                            
                                                        }
                                                    }}/>
                                            </MenuItem>

                                            {/* Show Create New List form if 'showCreateForm' is true */}
                                            {showCreateForm && (
                                                <>
                                                    <Box sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '24px',
                                                        p: 2,
                                                        width: anchorEl ? `${anchorEl.clientWidth}px` : '538px',
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
                                                            value={newListName}
                                                            onChange={(e) => setNewListName(e.target.value)}
                                                            size="small"
                                                            fullWidth
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                            InputLabelProps={{
                                                                sx: {
                                                                fontFamily: 'Nunito',
                                                                fontSize: '16px',
                                                                lineHeight: 'normal',
                                                                color: 'rgba(17, 17, 19, 0.60)',
                                                                top: '-3px',
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
                                                                            fontFamily: 'Nunito',
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
                                                        <TextField
                                                            label="Enter Tag Name"
                                                            variant="outlined"
                                                            value={tagName}
                                                            onChange={(e) => setTagName(e.target.value)}
                                                            size="small"
                                                            fullWidth
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                            InputLabelProps={{
                                                                sx: {
                                                                fontFamily: 'Nunito',
                                                                fontSize: '16px',
                                                                lineHeight: 'normal',
                                                                color: 'rgba(17, 17, 19, 0.60)',
                                                                top: '-3px',
                                                                '&.Mui-focused': {
                                                                    color: '#0000FF',
                                                                },
                                                                }
                                                            }}
                                                            InputProps={{
                                                                endAdornment: (
                                                                    tagName && (
                                                                        <InputAdornment position="end">
                                                                            <IconButton edge="end"
                                                                            onClick={() => setTagName('')}>
                                                                            <Image 
                                                                                src='/close-circle.svg' 
                                                                                alt='close-circle' 
                                                                                height={18} width={18} // Adjust the size as needed
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
                                                                            fontFamily: 'Nunito',
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
                                                        <Button variant="contained" onClick={handleSave} sx={{
                                                            borderRadius: '4px',
                                                            border: '1px solid #5052B2',
                                                            background: '#fff',
                                                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                            fontFamily: 'Nunito',
                                                            fontSize: '16px',
                                                            fontWeight: '600',
                                                            lineHeight: '22px',
                                                            color: '#5052b2',
                                                            textTransform: 'none',
                                                            padding: '4px 22px',
                                                            '&:hover' : {
                                                                background: 'transparent'
                                                            }
                                                        }}>
                                                                Save
                                                            </Button>
                                                        </Box>

                                                        </Box>
                                                    

                                                    {/* Add a Divider to separate form from options */}
                                                    <Divider sx={{ borderColor: '#cdcdcd' }} />
                                                </>
                                            )}

                                            {/* Show static options */}
                                            {staticOptions.map((option, index) => (
                                                <MenuItem key={index} onClick={() => handleSelectOption(option)} sx={{
                                                    '&:hover': {
                                                        background: 'rgba(80, 82, 178, 0.10)'
                                                    } }}>
                                                    <ListItemText primary={option}  primaryTypographyProps={{
                                                        sx: {
                                                            fontFamily: "Nunito",
                                                            fontSize: "14px",
                                                            color: "rgba(0, 0, 0, 0.89)",
                                                            fontWeight: "600",
                                                            lineHeight: "normal"
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
                    <TabPanel value="4" sx={{ p: 0 }}>
                        <Box sx={{
                            borderRadius: '4px',
                            border: '1px solid #f0f0f0',
                            boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)',
                            padding: '16px 24px',
                            overflowX: 'auto'
                        }}>
                            <Box sx={{display: 'flex', gap: '8px', marginBottom: '20px'}}>
                            <Typography variant="h6" sx={{
                                            fontFamily: 'Nunito',
                                            fontSize: '14px',
                                            fontWeight: '700',
                                            color: '#4a4a4a'
                                        }}>Map list</Typography>
                                        <Typography variant='h6' sx={{
                                            background: 'rgba(80, 82, 178, 0.10)',
                                            borderRadius: '3px',
                                            fontFamily: 'Nunito',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            color: '#4a4a4a',
                                            padding: '2px 4px'
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
                                    <Image src='/klaviyo.svg' alt='klaviyo' height={20} width={24} />
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
                                            fontFamily: 'Nunito',
                                            fontSize: '14px',
                                            lineHeight: 'normal',
                                            color: '#7b7b7b',
                                            top: '-8px',
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
                                                        fontFamily: 'Nunito',
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
                                            fontFamily: 'Nunito',
                                            fontSize: '14px',
                                            lineHeight: 'normal',
                                            color: '#7B7B7B',
                                            top: '-8px',
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
                                                        fontFamily: 'Nunito',
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
                                                fontFamily: 'Nunito',
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                color: '#7B7B7B',
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
                                                onClose: handleDropdownClose,
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
                                                fontFamily: 'Nunito',
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                color: '#7B7B7B',
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
                                            <MenuItem value="" sx= {{
                                                            fontFamily: "Nunito",
                                                            fontSize: "14px",
                                                            color: "#7b7b7b",
                                                            lineHeight: "20px"
                                                        }}>Select</MenuItem>
                                            <MenuItem value="Email" sx= {{
                                                            fontFamily: "Nunito",
                                                            fontSize: "14px",
                                                            color: "#7b7b7b",
                                                            lineHeight: "20px"
                                                        }}>Email</MenuItem>
                                            <MenuItem value="Phone number" sx= {{
                                                            fontFamily: "Nunito",
                                                            fontSize: "14px",
                                                            color: "#7b7b7b",
                                                            lineHeight: "20px"
                                                        }}>Phone number</MenuItem>
                                            <MenuItem value="First name" sx= {{
                                                            fontFamily: "Nunito",
                                                            fontSize: "14px",
                                                            color: "#7b7b7b",
                                                            lineHeight: "20px"
                                                        }}>First name</MenuItem>
                                            <MenuItem value="Second name" sx= {{
                                                            fontFamily: "Nunito",
                                                            fontSize: "14px",
                                                            color: "#7b7b7b",
                                                            lineHeight: "20px"
                                                        }}>Second name</MenuItem>
                                            <MenuItem value="Gender" sx= {{
                                                            fontFamily: "Nunito",
                                                            fontSize: "14px",
                                                            color: "#7b7b7b",
                                                            lineHeight: "20px"
                                                        }}>Gender</MenuItem>
                                            <MenuItem value="Age" sx= {{
                                                            fontFamily: "Nunito",
                                                            fontSize: "14px",
                                                            color: "#7b7b7b",
                                                            lineHeight: "20px"
                                                        }}>Age</MenuItem>
                                            <MenuItem value="Job Title" sx= {{
                                                            fontFamily: "Nunito",
                                                            fontSize: "14px",
                                                            color: "#7b7b7b",
                                                            lineHeight: "20px"
                                                        }}>Job Title</MenuItem>
                                            <MenuItem value="Location" sx= {{
                                                            fontFamily: "Nunito",
                                                            fontSize: "14px",
                                                            color: "#7b7b7b",
                                                            lineHeight: "20px"
                                                        }}>Location</MenuItem>
                                        </TextField>

                                    )}
                                    </Grid>
                                    
                                    {/* Delete Icon */}
                                    <Grid item xs="auto" sm={1} container justifyContent="center">
                                    {row.canDelete && (
                                        <IconButton onClick={() => handleDelete(row.id)}>
                                            <Image 
                                                src='/trash-icon.svg' 
                                                alt='trash-icon' 
                                                height={18} 
                                                width={18} // Adjust the size as needed
                                            />
                                        </IconButton>
                                    )}
                                    </Grid>
                                </Grid>
                                </Box>
                            ))}
                                
                                <Button color="primary" onClick={handleAddRow} sx={{
                                    fontFamily: 'Nunito',
                                    fontSize: '16px',
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
            <Box sx={{ px: 2, py: 3.5, width: '100%', border: '1px solid #e4e4e4' }}>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                            
                                {getButton(value)}
                        </Box>
                    </Box>
            </Box>
             
        </Drawer>
    );
};
export default ConnectKlaviyo;