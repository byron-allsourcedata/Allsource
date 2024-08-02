import React, { useState, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, Backdrop, TextField, InputAdornment, Divider, FormControlLabel, Radio, Collapse, Checkbox, Button } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';

interface AudiencePopupProps {
    open: boolean;
    onClose: () => void;
}

interface ListItem {
    audience_name: string;
    leads_count: number;
}

const AudiencePopup: React.FC<AudiencePopupProps> = ({ open, onClose }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [isExistingListsOpen, setIsExistingListsOpen] = useState<boolean>(false);
    const [listItems, setListItems] = useState<ListItem[]>([]);
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
    const [listName, setListName] = useState<string>('');

    useEffect(() => {
        const fetchListItems = async () => {
            try {
                const response = await axiosInstance.get('/audience/list');
                setListItems(response.data);
            } catch (error) {
                console.error('Error fetching list items:', error);
            }
        };
        fetchListItems();
    }, []);

    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSelectedOption(value);
        if (value === 'create') {
            setIsFormOpen(true);
            setIsExistingListsOpen(false);
        } else if (value === 'existing') {
            setIsExistingListsOpen(true);
            setIsFormOpen(false); 
        }
    };

    const toggleFormVisibility = () => {
        setIsFormOpen(!isFormOpen);
    };

    const toggleExistingListsVisibility = () => {
        setIsExistingListsOpen(!isExistingListsOpen);
    };

    const handleCheckboxChange = (audience_name: string) => {
        setCheckedItems(prev => {
            const newCheckedItems = new Set(prev);
            if (newCheckedItems.has(audience_name)) {
                newCheckedItems.delete(audience_name);
            } else {
                newCheckedItems.add(audience_name);
            }
            return newCheckedItems;
        });
    };

    const handleListNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setListName(event.target.value);
    };

    const isSaveButtonDisabled = () => {
        if (selectedOption === 'create' && listName.trim() === '') {
            return true;
        }
        if (selectedOption === 'existing' && checkedItems.size === 0) {
            return true;
        }
        if (selectedOption === null) {
            return true;
        }
        return false;
    };

    return (
        <>
            <Backdrop open={open} sx={{ zIndex: 1200, color: '#fff' }} />
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                PaperProps={{
                    sx: {
                        width: '40%',
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #e4e4e4' }}>
                    <Typography variant="h6" sx={{ textAlign: 'center', color: '#4A4A4A', fontFamily: 'Nunito', fontWeight: '600', fontSize: '16px', lineHeight: '25.2px' }}>
                        Add to Audience List
                    </Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Divider />
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90%', border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '4px', padding: '2em' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 2, borderBottom: '2px solid rgba(228, 228, 228, 1)' }}>
                            <Box sx={{ flexGrow: 1, width: '100%' }}>
                                <FormControlLabel
                                    control={<Radio checked={selectedOption === 'create'} onChange={handleRadioChange} value="create" />}
                                    label="Create a New List"
                                    sx={{ width: '100%', display: 'flex', color: 'rgba(74, 74, 74, 1)', alignItems: 'center', fontFamily: 'Nunito', fontWeight: '600', fontSize: '16px', lineHeight: '25.2px' }}
                                />
                            </Box>
                            <IconButton onClick={toggleFormVisibility} aria-label="toggle-content">
                                {isFormOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Box>
                        <Collapse in={isFormOpen} sx={{ width: '100%' }}>
                            <Box sx={{ width: '100%', pt: 1 }}>
                                <TextField
                                    placeholder="List Name"
                                    variant="outlined"
                                    fullWidth
                                    value={listName}
                                    onChange={handleListNameChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ mb: 2 }}
                                />
                            </Box>
                        </Collapse>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90%', border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '4px', padding: '2em' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 2, borderBottom: '2px solid rgba(228, 228, 228, 1)' }}>
                            <Box sx={{ flexGrow: 1, width: '100%' }}>
                                <FormControlLabel
                                    control={<Radio checked={selectedOption === 'existing'} onChange={handleRadioChange} value="existing" />}
                                    label="Existing Lists"
                                    sx={{ width: '100%', display: 'flex', color: 'rgba(74, 74, 74, 1)', alignItems: 'center', fontFamily: 'Nunito', fontWeight: '600', fontSize: '16px', lineHeight: '25.2px' }}
                                />
                            </Box>
                            <IconButton onClick={toggleExistingListsVisibility} aria-label="toggle-content">
                                {isExistingListsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Box>
                        <Collapse in={isExistingListsOpen} sx={{ width: '100%' }}>
                            <Box sx={{ width: '100%', pt: 1 }}>
                                {listItems.map(({ audience_name, leads_count }) => (
                                    <Box key={audience_name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Checkbox
                                            checked={checkedItems.has(audience_name)}
                                            onChange={() => handleCheckboxChange(audience_name)}
                                        />
                                        <Typography sx={{ ml: 1 }}>{audience_name} ({leads_count})</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Collapse>
                    </Box>
                    <Box sx={{ position: 'relative', width: '100%' }}>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', paddingTop: '1em' }}>
                            <Button
                                variant="contained"
                                onClick={() => console.log('Save clicked')}
                                disabled={isSaveButtonDisabled()}
                                sx={{
                                    backgroundColor: 'rgba(80, 82, 178, 1)',
                                    fontFamily: "Nunito",
                                    fontSize: '16px',
                                    textTransform: 'none',
                                    padding: '1em 2.5em',
                                    position: 'fixed',
                                    bottom: 25,
                                    right: 15,
                                    margin: '0 auto',
                                    opacity: isSaveButtonDisabled() ? 0.8 : 1,
                                }}
                            >
                                Save
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
};

export default AudiencePopup;
