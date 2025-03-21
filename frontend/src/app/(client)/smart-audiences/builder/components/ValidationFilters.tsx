import { useState } from "react";
import { Box, Typography, IconButton, Collapse, Checkbox, FormControl, Select, MenuItem, Chip, Divider, Button, LinearProgress } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ValidationStyle } from '@/css/ValidationStyles';
import React from "react";
import CloseIcon from '@mui/icons-material/Close';
import { smartAudiences } from "../../smartAudiences";
import ValidationPopup from "./SkipValidationPopup";

interface ExpandableFilterProps {
    targetAudience: string;
    useCaseType: string;
    onSkip: () => void;
}



const AllFilters: React.FC<ExpandableFilterProps> = ({ targetAudience, useCaseType, onSkip }) => {
    const [isOpenPersonalEmail, setIsOpenPersonalEmail] = useState(false);
    const [isOpenBusinessEmail, setIsOpenBusinessEmail] = useState(false);
    const [isOpenPhone, setIsOpenPhone] = useState(false);
    const [isOpenPostalCAS, setIsOpenPostalCAS] = useState(false);
    const [isOpenLinkedIn, setIsOpenLinkedIn] = useState(false);

    const [selectedOptionsPersonalEmail, setSelectedOptionsPersonalEmail] = useState<string[]>([]);
    const [selectedOptionsBusinessEmail, setSelectedOptionsBusinessEmail] = useState<string[]>([]);
    const [selectedOptionsPhone, setSelectedOptionsPhone] = useState<string[]>([]);
    const [selectedOptionsPostalCAS, setSelectedOptionsPostalCAS] = useState<string[]>([]);
    const [selectedOptionsLinkedIn, setSelectedOptionsLinkedIn] = useState<string[]>([]);

    const [nestedSelections, setNestedSelections] = useState<{ [key: string]: string }>({});
    const [expandedNested, setExpandedNested] = useState<{ [key: string]: boolean }>({});

    const [openPopup, setOpenPopup] = useState(false);

    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    const toggleFilter = (setter: React.Dispatch<React.SetStateAction<boolean>>, state: boolean) => setter(!state);

    const handleOptionClick = (setter: React.Dispatch<React.SetStateAction<string[]>>, option: string) => {
        setter((prev) => (prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]));
    };

    const handleNestedSelect = (option: string, value: string) => {
        setNestedSelections((prev) => ({
            ...prev,
            [option]: value,
        }));
        if (value && !selectedOptionsPersonalEmail.includes(option) && !selectedOptionsBusinessEmail.includes(option)) {
            if (option === "Recency") {
                setSelectedOptionsPersonalEmail((prev) => [...prev, option]);
            } else if (option === "RecencyBusiness") {
                setSelectedOptionsBusinessEmail((prev) => [...prev, option]);
            }
        }
    };

    const toggleNestedExpand = (label: string) => {
        setExpandedNested((prev) => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    const removeChip = (setState: Function, option: string) => {
        setState((prev: string[]) => prev.filter((item) => item !== option));
        setNestedSelections((prev) => {
            const updated = { ...prev };
            delete updated[option]; // Удаляем значение параметра
            return updated;
        });
    };

    const getChipStyle = (label: string) => {
        if (label === "Recency" || label === "RecencyBusiness") {
            return { backgroundColor: 'rgba(234, 248, 221, 1)', color: 'rgba(43, 91, 0, 1)', borderRadius: '3px' };
        } else if (label === "MX" || label === "Delivery") {
            return { backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(95, 99, 104, 1)', borderRadius: '3px', border: '1px solid rgba(200, 200, 200, 1)' };
        }
        return { backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(95, 99, 104, 1)', borderRadius: '3px', border: '1px solid rgba(200, 200, 200, 1)' };
    };

    const handleValidate = () => {

    }

    const handleSkip = () => {
        setOpenPopup(true)
    }

    return (
        <Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: '100%', flexGrow: 1, position: "relative", flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px", mt: 2 }}>
                {uploadProgress !== null && (
                    <Box sx={{ width: "100%", position: "absolute", top: 0, left: 0, zIndex: 1200 }}>
                        <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: "6px", backgroundColor: '#c6dafc', '& .MuiLinearProgress-bar': { borderRadius: 5, backgroundColor: '#4285f4' } }} />
                    </Box>
                )}
                <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: "flex", width: '100%', flexDirection: "row", justifyContent: 'space-between', gap: 1 }}>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, }}>
                            <Typography sx={{ fontFamily: "Nunito Sans", fontSize: "16px", fontWeight: 500 }}>Validation</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography className='table-data' sx={{ color: 'rgba(43, 91, 0, 1) !important', fontSize: '14px !important', backgroundColor: 'rgba(234, 248, 221, 1) !important', padding: '4px 12px' }}>Recommended</Typography>
                        </Box>

                    </Box>
                    <Typography sx={{ fontFamily: "Roboto", fontSize: "12px", color: "rgba(95, 99, 104, 1)" }}>Choose parameters that you want to validate.</Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {/* Personal Email Filter */}
                        <Box sx={{ ...ValidationStyle.main_filter_form, borderBottom: '1px solid rgba(235, 235, 235, 1)' }}>
                            <Box sx={{ ...ValidationStyle.filter_form, borderBottom: isOpenPersonalEmail ? '1px solid rgba(235, 235, 235, 1)' : '', }} onClick={() => toggleFilter(setIsOpenPersonalEmail, isOpenPersonalEmail)}>
                                <Typography sx={ValidationStyle.filter_name}>Personal email</Typography>
                                {selectedOptionsPersonalEmail.map((option) => (
                                    <Chip
                                        key={option}
                                        label={nestedSelections[option] ? `${option}: ${nestedSelections[option]}` : option}
                                        onDelete={() => removeChip(setSelectedOptionsPersonalEmail, option)}
                                        deleteIcon={
                                            <CloseIcon
                                                sx={{
                                                    backgroundColor: 'transparent',
                                                    color: '#828282 !important',
                                                    fontSize: '14px !important'
                                                }}
                                            />
                                        }
                                        sx={{ margin: "2px", mb: 1, ...getChipStyle(option) }}
                                    />

                                ))}
                                <IconButton onClick={() => toggleFilter(setIsOpenPersonalEmail, isOpenPersonalEmail)} aria-label="toggle-content">
                                    {isOpenPersonalEmail ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>
                            <Collapse in={isOpenPersonalEmail}>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, pt: 2, pl: 2, pb: 0.75 }}>
                                    {/* MX Checkbox */}
                                    <Box>
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Checkbox
                                                    checked={selectedOptionsPersonalEmail.includes("MX")}
                                                    onChange={() => handleOptionClick(setSelectedOptionsPersonalEmail, "MX")}
                                                    sx={{ padding: 0, '&.Mui-checked': { color: "rgba(80, 82, 178, 1)" } }}
                                                />
                                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                                    <Typography className="form-input">MX</Typography>
                                                    {((targetAudience === 'B2C' || targetAudience === 'Both') && useCaseType === 'Email') && <Typography className='table-data' sx={{ color: 'rgba(43, 91, 0, 1) !important', fontSize: '14px !important', backgroundColor: 'rgba(234, 248, 221, 1) !important', borderRadius: '3px', padding: '4px 12px' }}>Recommended</Typography>}
                                                    <Typography className='table-data' sx={{ color: 'rgba(0, 129, 251, 1) !important', fontSize: '14px !important', borderRadius: '3px', backgroundColor: 'rgba(204, 230, 254, 1) !important', padding: '4px 12px' }}>Free</Typography>
                                                </Box>
                                            </Box>

                                        </Box>
                                        <Divider sx={{ my: 1 }} />
                                    </Box>

                                    {/* Last seen Checkbox with Expand */}
                                    <Box>
                                        <Box onClick={() => toggleNestedExpand("Last seen Personal")} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Checkbox
                                                    checked={selectedOptionsPersonalEmail.includes("Recency")}
                                                    onChange={() => {
                                                        if (nestedSelections["Recency"]) {
                                                            handleOptionClick(setSelectedOptionsPersonalEmail, "Recency");
                                                        }
                                                    }}
                                                    sx={{ padding: 0, '&.Mui-checked': { color: "rgba(80, 82, 178, 1)" } }}
                                                />


                                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                                    <Typography className="form-input">Last seen</Typography>
                                                    {((targetAudience === 'B2C' || targetAudience === 'Both') && useCaseType === 'Email') && <Typography className='table-data' sx={{ color: 'rgba(43, 91, 0, 1) !important', fontSize: '14px !important', backgroundColor: 'rgba(234, 248, 221, 1) !important', borderRadius: '3px', padding: '4px 12px' }}>Recommended</Typography>}
                                                </Box>
                                            </Box>

                                            <IconButton onClick={(e) => {
                                                e.stopPropagation();
                                                toggleNestedExpand("Last seen Personal");
                                            }}>
                                                {expandedNested["Last seen Personal"] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        </Box>
                                        {expandedNested["Last seen Personal"] && (
                                            <Box sx={{ pl: 6, pt: 2, display: 'flex', gap: 1, flexDirection: 'column', borderTop: '1px solid rgba(235, 235, 235, 1)' }}>
                                                <Typography className="form-input">Recency</Typography>
                                                <FormControl variant="outlined" size="small">
                                                    <Select
                                                        value={nestedSelections["Recency"] || ""}
                                                        onChange={(e) => handleNestedSelect("Recency", e.target.value)}
                                                        displayEmpty
                                                        className="second-sub-title"
                                                        sx={{ width: "200px", color: 'rgba(112, 112, 113, 1) !important' }}
                                                    >
                                                        <MenuItem className="second-sub-title" value="" sx={{ display: "none", mt: 0 }} disabled>
                                                            Select recency
                                                        </MenuItem>
                                                        {["40 days", "50 days", "60 days"].map((selectOption: string) => (
                                                            <MenuItem className="second-sub-title" key={selectOption} value={selectOption}>
                                                                {selectOption}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Box>
                                        )}
                                        <Divider sx={{ my: 1 }} />
                                    </Box>

                                    {/* Delivery Checkbox */}
                                    <Box>
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Checkbox
                                                    checked={selectedOptionsPersonalEmail.includes("Delivery")}
                                                    onChange={() => handleOptionClick(setSelectedOptionsPersonalEmail, "Delivery")}
                                                    sx={{ padding: 0, '&.Mui-checked': { color: "rgba(80, 82, 178, 1)" } }}
                                                />
                                                <Typography className="form-input">Delivery</Typography>
                                                {((targetAudience === 'B2C' || targetAudience === 'Both') && useCaseType === 'Email') && <Typography className='table-data' sx={{ color: 'rgba(43, 91, 0, 1) !important', fontSize: '14px !important', backgroundColor: 'rgba(234, 248, 221, 1) !important', borderRadius: '3px', padding: '4px 12px' }}>Recommended</Typography>}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Collapse>
                        </Box>

                        {/* Business Email Filter */}
                        <Box sx={{ ...ValidationStyle.main_filter_form, borderBottom: '1px solid rgba(235, 235, 235, 1)' }}>
                            <Box sx={ValidationStyle.filter_form} onClick={() => toggleFilter(setIsOpenBusinessEmail, isOpenBusinessEmail)}>
                                <Typography sx={ValidationStyle.filter_name}>Business email</Typography>
                                {selectedOptionsBusinessEmail.map((option) => (
                                    <Chip
                                        key={option}
                                        label={nestedSelections[option] ? `${option === 'RecencyBusiness' ? 'Recency' : option}: ${nestedSelections[option]}` : option === 'RecencyBusiness' ? 'Recency' : option}
                                        onDelete={() => removeChip(setSelectedOptionsBusinessEmail, option)}
                                        sx={{ margin: "2px", ...getChipStyle(option) }}
                                    />
                                ))}
                                <IconButton onClick={() => toggleFilter(setIsOpenBusinessEmail, isOpenBusinessEmail)} aria-label="toggle-content">
                                    {isOpenBusinessEmail ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>
                            <Collapse in={isOpenBusinessEmail}>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1, pl: 2, pb: 0.75 }}>
                                    {/* MX Checkbox */}
                                    <Box>
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Checkbox
                                                    checked={selectedOptionsBusinessEmail.includes("MX")}
                                                    onChange={() => handleOptionClick(setSelectedOptionsBusinessEmail, "MX")}
                                                    sx={{ padding: 0, '&.Mui-checked': { color: "rgba(80, 82, 178, 1)" } }}
                                                />
                                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                                    <Typography className="form-input">MX</Typography>
                                                    {((targetAudience === 'B2B' || targetAudience === 'Both') && useCaseType === 'Email') && <Typography className='table-data' sx={{ color: 'rgba(43, 91, 0, 1) !important', fontSize: '14px !important', backgroundColor: 'rgba(234, 248, 221, 1) !important', borderRadius: '3px', padding: '4px 12px' }}>Recommended</Typography>}
                                                    <Typography className='table-data' sx={{ color: 'rgba(0, 129, 251, 1) !important', fontSize: '14px !important', borderRadius: '3px', backgroundColor: 'rgba(204, 230, 254, 1) !important', padding: '4px 12px' }}>Free</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                        <Divider sx={{ my: 1 }} />
                                    </Box>

                                    {/* Last seen Checkbox with Expand */}
                                    <Box>
                                        <Box onClick={() => toggleNestedExpand("Last seen Business")} sx={{ display: "flex", cursor: 'pointer', alignItems: "center", justifyContent: "space-between" }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Checkbox
                                                    checked={selectedOptionsBusinessEmail.includes("RecencyBusiness")}
                                                    onChange={() => {
                                                        if (nestedSelections["RecencyBusiness"]) {
                                                            handleOptionClick(setSelectedOptionsBusinessEmail, "RecencyBusiness")
                                                        }
                                                    }}
                                                    sx={{ padding: 0, '&.Mui-checked': { color: "rgba(80, 82, 178, 1)" } }}
                                                />
                                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                                    <Typography className="form-input">Last seen</Typography>
                                                    {((targetAudience === 'B2B' || targetAudience === 'Both') && useCaseType === 'Email') && <Typography className='table-data' sx={{ color: 'rgba(43, 91, 0, 1) !important', fontSize: '14px !important', backgroundColor: 'rgba(234, 248, 221, 1) !important', borderRadius: '3px', padding: '4px 12px' }}>Recommended</Typography>}
                                                </Box>

                                            </Box>
                                            <IconButton
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleNestedExpand("Last seen Business");
                                                }}
                                            >
                                                {expandedNested["Last seen Business"] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        </Box>
                                        {expandedNested["Last seen Business"] && (
                                            <Box sx={{ pl: 6, pt: 2, display: 'flex', gap: 1, flexDirection: 'column', borderTop: '1px solid rgba(235, 235, 235, 1)' }}>
                                                <Typography className="form-input">Recency</Typography>
                                                <FormControl variant="outlined" size="small">
                                                    <Select
                                                        value={nestedSelections["RecencyBusiness"] || ""}
                                                        onChange={(e) => handleNestedSelect("RecencyBusiness", e.target.value)}
                                                        displayEmpty
                                                        className="second-sub-title"
                                                        sx={{ width: "200px", color: 'rgba(112, 112, 113, 1) !important' }}
                                                    >
                                                        <MenuItem className="second-sub-title" value="" sx={{ display: "none", mt: 0 }} disabled>
                                                            Select recency
                                                        </MenuItem>
                                                        {["40 days", "50 days", "60 days"].map((selectOption: string) => (
                                                            <MenuItem className="second-sub-title" key={selectOption} value={selectOption}>
                                                                {selectOption}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Box>
                                        )}
                                        <Divider sx={{ my: 1 }} />
                                    </Box>

                                    {/* Delivery Checkbox */}
                                    <Box>
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Checkbox
                                                    checked={selectedOptionsBusinessEmail.includes("Delivery")}
                                                    onChange={() => handleOptionClick(setSelectedOptionsBusinessEmail, "Delivery")}
                                                    sx={{ padding: 0, '&.Mui-checked': { color: "rgba(80, 82, 178, 1)" } }}
                                                />
                                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                                    <Typography className="form-input">Delivery</Typography>
                                                    {((targetAudience === 'B2B' || targetAudience === 'Both') && useCaseType === 'Email') && <Typography className='table-data' sx={{ color: 'rgba(43, 91, 0, 1) !important', fontSize: '14px !important', backgroundColor: 'rgba(234, 248, 221, 1) !important', borderRadius: '3px', padding: '4px 12px' }}>Recommended</Typography>}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Collapse>
                        </Box>

                        {/* Phone Filter */}
                        <Box sx={{ ...ValidationStyle.main_filter_form, borderBottom: '1px solid rgba(235, 235, 235, 1)' }}>
                            <Box sx={ValidationStyle.filter_form} onClick={() => toggleFilter(setIsOpenPhone, isOpenPhone)}>
                                <Typography sx={ValidationStyle.filter_name}>Phone</Typography>
                                {selectedOptionsPhone.map((option) => (
                                    <Chip
                                        key={option}
                                        label={option}
                                        onDelete={() => removeChip(setSelectedOptionsPhone, option)}
                                        sx={{ margin: "2px", ...getChipStyle(option) }}
                                    />
                                ))}
                                <IconButton onClick={() => toggleFilter(setIsOpenPhone, isOpenPhone)} aria-label="toggle-content">
                                    {isOpenPhone ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>
                            <Collapse in={isOpenPhone}>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1, pl: 2, pb: 0.75 }}>
                                    {["Date", "Confirmation"].map((option, index) => {
                                        const isRecommended =
                                            useCaseType === "Tele Marketing" &&
                                            ((targetAudience === "Both" || targetAudience === "B2B") ||
                                                (targetAudience === "B2C" && option === "Date"));

                                        return (
                                            <React.Fragment key={option}>
                                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Checkbox
                                                            checked={selectedOptionsPhone.includes(option)}
                                                            onChange={() => handleOptionClick(setSelectedOptionsPhone, option)}
                                                            sx={{ padding: 0, '&.Mui-checked': { color: "rgba(80, 82, 178, 1)" } }}
                                                        />
                                                        <Typography className="form-input">{option}</Typography>
                                                        {isRecommended && (
                                                            <Typography
                                                                className="table-data"
                                                                sx={smartAudiences.labelText}
                                                            >
                                                                Recommended
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                                {index === 0 && <Divider />}
                                            </React.Fragment>
                                        )
                                    })}
                                </Box>
                            </Collapse>
                        </Box>

                        {/* Postal CAS Verification Filter */}
                        <Box sx={{ ...ValidationStyle.main_filter_form, borderBottom: '1px solid rgba(235, 235, 235, 1)' }}>
                            <Box sx={ValidationStyle.filter_form} onClick={() => toggleFilter(setIsOpenPostalCAS, isOpenPostalCAS)}>
                                <Typography sx={ValidationStyle.filter_name}>Postal CAS verification</Typography>
                                {selectedOptionsPostalCAS.map((option) => (
                                    <Chip
                                        key={option}
                                        label={option}
                                        onDelete={() => removeChip(setSelectedOptionsPostalCAS, option)}
                                        sx={{ margin: "2px", ...getChipStyle(option) }}
                                    />
                                ))}
                                <IconButton onClick={() => toggleFilter(setIsOpenPostalCAS, isOpenPostalCAS)} aria-label="toggle-content">
                                    {isOpenPostalCAS ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>
                            <Collapse in={isOpenPostalCAS}>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1, pl: 2, pb: 0.75 }}>
                                    {["CAS office address", "CAS home address"].map((option, index) => {
                                        const isRecommended =
                                            useCaseType === "Postal" &&
                                            ((targetAudience === "Both") ||
                                                (targetAudience === "B2C" && option === "CAS home address") ||
                                                (targetAudience === "B2B" && option === "CAS office address"));

                                        return (
                                            <React.Fragment key={option}>
                                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Checkbox
                                                            checked={selectedOptionsPostalCAS.includes(option)}
                                                            onChange={() => handleOptionClick(setSelectedOptionsPostalCAS, option)}
                                                            sx={{ padding: 0, "&.Mui-checked": { color: "rgba(80, 82, 178, 1)" } }}
                                                        />
                                                        <Typography className="form-input">{option}</Typography>
                                                        {isRecommended && (
                                                            <Typography
                                                                className="table-data"
                                                                sx={smartAudiences.labelText}
                                                            >
                                                                Recommended
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                                {index === 0 && <Divider />}
                                            </React.Fragment>
                                        );
                                    })}
                                </Box>

                            </Collapse>
                        </Box>
                        {/* LinkedIn Filter */}
                        <Box sx={{ ...ValidationStyle.main_filter_form, border: 'none', borderBottom: '1px solid rgba(235, 235, 235, 1)' }}>
                            <Box sx={ValidationStyle.filter_form} onClick={() => toggleFilter(setIsOpenLinkedIn, isOpenLinkedIn)}>
                                <Typography sx={ValidationStyle.filter_name}>LinkedIn</Typography>
                                {selectedOptionsLinkedIn.map((option) => (
                                    <Chip
                                        key={option}
                                        label={option}
                                        onDelete={() => removeChip(setSelectedOptionsLinkedIn, option)}
                                        sx={{ margin: "2px", ...getChipStyle(option) }}
                                    />
                                ))}
                                <IconButton onClick={() => toggleFilter(setIsOpenLinkedIn, isOpenLinkedIn)} aria-label="toggle-content">
                                    {isOpenLinkedIn ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>
                            <Collapse in={isOpenLinkedIn}>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1, pl: 2, pb: 0.75 }}>

                                    <Box key={"Relevance"}>
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Checkbox
                                                    checked={selectedOptionsLinkedIn.includes("Relevance")}
                                                    onChange={() => handleOptionClick(setSelectedOptionsLinkedIn, "Relevance")}
                                                    sx={{ padding: 0, '&.Mui-checked': { color: "rgba(80, 82, 178, 1)" } }}
                                                />
                                                <Typography className="form-input">Relevance</Typography>
                                                {((targetAudience === 'B2B' || targetAudience === 'Both') && useCaseType === 'LinkedIn') && <Typography className='table-data' sx={smartAudiences.labelText}>Recommended</Typography>}
                                            </Box>
                                        </Box>

                                    </Box>
                                </Box>
                            </Collapse>
                        </Box>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'end' }}>
                            <Button variant="contained" onClick={handleSkip} sx={{
                                ...smartAudiences.buttonform,
                                backgroundColor: "rgba(255, 255, 255, 1)",
                                border: '1px solid rgba(80, 82, 178, 1)',
                                boxShadow: 0,
                                width: "120px",
                                ":hover": {
                                    backgroundColor: "rgba(255, 255, 255, 1)",
                                },
                            }}>
                                <Typography
                                    sx={{
                                        ...smartAudiences.textButton,
                                        color: "rgba(80, 82, 178, 1)",

                                    }}
                                >
                                    Skip
                                </Typography>
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 2, justifyContent: "flex-end", borderRadius: "6px" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Button variant="outlined" sx={{
                        ...smartAudiences.buttonform,
                        borderColor: "rgba(80, 82, 178, 1)",
                        width: "92px",
                    }}>
                        <Typography
                            sx={{
                                ...smartAudiences.textButton,
                                color: "rgba(80, 82, 178, 1)",
                            }}
                        >
                            Cancel
                        </Typography>
                    </Button>
                    <Button variant="contained" onClick={handleValidate} sx={{
                        ...smartAudiences.buttonform,
                        backgroundColor: "rgba(80, 82, 178, 1)",
                        width: "237px",
                        ":hover": {
                            backgroundColor: "rgba(80, 82, 178, 1)"
                        },
                    }}>
                        <Typography
                            sx={{
                                ...smartAudiences.textButton,
                                color: "rgba(255, 255, 255, 1)",

                            }}
                        >
                            Set validation Package
                        </Typography>

                    </Button>
                </Box>
            </Box>
            <ValidationPopup
                open={openPopup}
                onClose={() => setOpenPopup(false)}
                onContinue={() => { console.log("Continue validation"); setOpenPopup(false); }}
                onSkip={() => { setOpenPopup(false); onSkip() }}
            />
        </Box>
    );
};

export default AllFilters;