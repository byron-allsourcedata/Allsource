import React, { useState } from 'react';
import {
    Drawer,
    Box,
    Typography,
    Divider,
    IconButton,
    TextField,
    Chip,
    InputAdornment,
    Collapse,
    FormControlLabel,
    Checkbox,
    Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import axiosInstance from '../axios/axiosInterceptorInstance';

interface BuildAudienceProps {
    open: boolean;
    onClose: () => void;
}

const BuildAudience: React.FC<BuildAudienceProps> = ({ open, onClose }) => {
    const [regions, setRegions] = useState<string[]>([]);
    const [professions, setProfessions] = useState<string[]>([]);
    const [ages, setAges] = useState<string[]>([]);
    const [genders, setGenders] = useState<string[]>([]);
    const [netWorths, setNetWorths] = useState<string[]>([]);
    const [interestList, setInterestList] = useState<string[]>([]);
    const [isRegionOpen, setIsRegionOpen] = useState<boolean>(false);
    const [isProfessionOpen, setIsProfessionOpen] = useState<boolean>(false);
    const [isAgeOpen, setIsAgeOpen] = useState<boolean>(false);
    const [isGenderOpen, setIsGenderOpen] = useState<boolean>(false);
    const [isNetWorthOpen, setIsNetWorthOpen] = useState<boolean>(false);
    const [isInterestsOpen, setIsInterestsOpen] = useState<boolean>(false);
    const [isNotInExistingListsOpen, setIsNotInExistingListsOpen] = useState<boolean>(false);
    const [notInExistingLists, setNotInExistingLists] = useState<boolean>(false);

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>, currentTags: string[]) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const inputElement = e.target as HTMLInputElement;
            const newTag = inputElement.value.trim();
            if (newTag && !currentTags.includes(newTag)) {
                setter(prev => [...prev, newTag]);
                inputElement.value = ''; // Clear the input field
            }
        }
    };

    const removeTag = (tag: string, setter: React.Dispatch<React.SetStateAction<string[]>>, currentTags: string[]) => {
        setter(prev => prev.filter(t => t !== tag));
    };

    const handleApplyFilters = async () => {
        const filters = {
            regions,
            professions,
            ages,
            genders,
            netWorths,
            interestList,
            notInExistingLists,
        };

        try {
            // Uncomment when ready to use axios
            // const response = await axiosInstance.post(`/audience`, filters);
            onClose();
        } catch (error) {
            console.error('Error applying filters:', error);
        }
    };

    return (
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
                    },
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #e4e4e4' }}>
                <Typography variant="h6" sx={{ textAlign: 'center', color: '#4A4A4A', fontFamily: 'Nunito', fontWeight: '600', fontSize: '22px', lineHeight: '25.2px' }}>
                    Build an audience
                </Typography>
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <Box sx={{ width: '95%', mb: 2, border: '1px solid rgba(228, 228, 228, 1)', padding: '1em' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Typography sx={{ flexGrow: 1, color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '600', fontSize: '16px', lineHeight: '25.2px' }}>
                        Location
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', mb: 2 }}>
                        {regions.map((tag, index) => (
                            <Chip
                                key={index}
                                label={tag}
                                onDelete={() => removeTag(tag, setRegions, regions)}
                            />
                        ))}
                    </Box>
                    <IconButton onClick={() => setIsRegionOpen(!isRegionOpen)} aria-label="toggle-content">
                        {isRegionOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
                <Collapse in={isRegionOpen}>
                    <Divider sx={{ mb: 2 }} />
                    <TextField
                        placeholder="Region"
                        variant="outlined"
                        fullWidth
                        onKeyDown={(e) => handleAddTag(e as React.KeyboardEvent<HTMLInputElement>, setRegions, regions)} // Use type assertion here
                        sx={{ mb: 2 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Collapse>
            </Box>

            {/* Profession Section */}
            <Box sx={{ width: '95%', mb: 2, border: '1px solid rgba(228, 228, 228, 1)', padding: '1em' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Typography sx={{ flexGrow: 1, color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '600', fontSize: '16px', lineHeight: '25.2px' }}>
                        Profession
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', mb: 2 }}>
                        {professions.map((tag, index) => (
                            <Chip
                                key={index}
                                label={tag}
                                onDelete={() => removeTag(tag, setProfessions, professions)}
                            />
                        ))}
                    </Box>
                    <IconButton onClick={() => setIsProfessionOpen(!isProfessionOpen)} aria-label="toggle-content">
                        {isProfessionOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
                <Collapse in={isProfessionOpen}>
                    <Divider sx={{ mb: 2 }} />
                    <TextField
                        placeholder="Profession"
                        variant="outlined"
                        fullWidth
                        onKeyDown={(e) => handleAddTag(e as React.KeyboardEvent<HTMLInputElement>, setProfessions, professions)} // Use type assertion here
                        sx={{ mb: 2 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Collapse>
            </Box>

            {/* Age Section */}
            <Box sx={{ width: '95%', mb: 2, border: '1px solid rgba(228, 228, 228, 1)', padding: '1em' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Typography sx={{ flexGrow: 1, color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '600', fontSize: '16px', lineHeight: '25.2px' }}>
                        Age
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', mb: 2 }}>
                        {ages.map((tag, index) => (
                            <Chip
                                key={index}
                                label={tag}
                                onDelete={() => removeTag(tag, setAges, ages)}
                            />
                        ))}
                    </Box>
                    <IconButton onClick={() => setIsAgeOpen(!isAgeOpen)} aria-label="toggle-content">
                        {isAgeOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
                <Collapse in={isAgeOpen}>
                    <Divider sx={{ mb: 2 }} />
                    <TextField
                        placeholder="Age"
                        variant="outlined"
                        fullWidth
                        onKeyDown={(e) => handleAddTag(e as React.KeyboardEvent<HTMLInputElement>, setAges, ages)} // Use type assertion here
                        sx={{ mb: 2 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Collapse>
            </Box>

            {/* Gender Section */}
            <Box sx={{ width: '95%', mb: 2, border: '1px solid rgba(228, 228, 228, 1)', padding: '1em' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Typography sx={{ flexGrow: 1, color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '600', fontSize: '16px', lineHeight: '25.2px' }}>
                        Gender
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', mb: 2 }}>
                        {genders.map((tag, index) => (
                            <Chip
                                key={index}
                                label={tag}
                                onDelete={() => removeTag(tag, setGenders, genders)}
                            />
                        ))}
                    </Box>
                    <IconButton onClick={() => setIsGenderOpen(!isGenderOpen)} aria-label="toggle-content">
                        {isGenderOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
                <Collapse in={isGenderOpen}>
                    <Divider sx={{ mb: 2 }} />
                    <TextField
                        placeholder="Gender"
                        variant="outlined"
                        fullWidth
                        onKeyDown={(e) => handleAddTag(e as React.KeyboardEvent<HTMLInputElement>, setGenders, genders)} // Use type assertion here
                        sx={{ mb: 2 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Collapse>
            </Box>

            {/* Net Worth Section */}
            <Box sx={{ width: '95%', mb: 2, border: '1px solid rgba(228, 228, 228, 1)', padding: '1em' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Typography sx={{ flexGrow: 1, color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '600', fontSize: '16px', lineHeight: '25.2px' }}>
                        Net Worth
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', mb: 2 }}>
                        {netWorths.map((tag, index) => (
                            <Chip
                                key={index}
                                label={tag}
                                onDelete={() => removeTag(tag, setNetWorths, netWorths)}
                            />
                        ))}
                    </Box>
                    <IconButton onClick={() => setIsNetWorthOpen(!isNetWorthOpen)} aria-label="toggle-content">
                        {isNetWorthOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
                <Collapse in={isNetWorthOpen}>
                    <Divider sx={{ mb: 2 }} />
                    <TextField
                        placeholder="Net Worth"
                        variant="outlined"
                        fullWidth
                        onKeyDown={(e) => handleAddTag(e as React.KeyboardEvent<HTMLInputElement>, setNetWorths, netWorths)} // Use type assertion here
                        sx={{ mb: 2 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Collapse>
            </Box>

            {/* Interests Section */}
            <Box sx={{ width: '95%', mb: 2, border: '1px solid rgba(228, 228, 228, 1)', padding: '1em' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Typography sx={{ flexGrow: 1, color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '600', fontSize: '16px', lineHeight: '25.2px' }}>
                        Interests
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', mb: 2 }}>
                        {interestList.map((tag, index) => (
                            <Chip
                                key={index}
                                label={tag}
                                onDelete={() => removeTag(tag, setInterestList, interestList)}
                            />
                        ))}
                    </Box>
                    <IconButton onClick={() => setIsInterestsOpen(!isInterestsOpen)} aria-label="toggle-content">
                        {isInterestsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
                <Collapse in={isInterestsOpen}>
                    <Divider sx={{ mb: 2 }} />
                    <TextField
                        placeholder="Interest"
                        variant="outlined"
                        fullWidth
                        onKeyDown={(e) => handleAddTag(e as React.KeyboardEvent<HTMLInputElement>, setInterestList, interestList)} // Use type assertion here
                        sx={{ mb: 2 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Collapse>
            </Box>

            <Box sx={{ width: '95%', mb: 2, border: '1px solid rgba(228, 228, 228, 1)', padding: '1em' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Typography sx={{ flexGrow: 1, color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '600', fontSize: '16px', lineHeight: '25.2px' }}>
                        Not in Existing Lists
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', mb: 2 }}>
                        {interestList.map((tag, index) => (
                            <Chip
                                key={index}
                                label={tag}
                                onDelete={() => removeTag(tag, setIsNotInExistingListsOpen, interestList)}
                            />
                        ))}
                    </Box>
                    <IconButton onClick={() => setIsInterestsOpen(!isInterestsOpen)} aria-label="toggle-content">
                        {isInterestsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>
                <Collapse in={isInterestsOpen}>
                    <Divider sx={{ mb: 2 }} />
                    <TextField
                        placeholder="Interest"
                        variant="outlined"
                        fullWidth
                        onKeyDown={(e) => handleAddTag(e as React.KeyboardEvent<HTMLInputElement>, setInterestList, interestList)} // Use type assertion here
                        sx={{ mb: 2 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Collapse>
            </Box>
            <Button
                variant="contained"
                color="primary"
                onClick={handleApplyFilters}
                sx={{ mt: 3, width: '100%' }}
            >
                Apply Filters
            </Button>
        </Drawer>
    );
};

export default BuildAudience;
