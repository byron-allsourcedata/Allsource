import { useEffect, useState } from "react";
import { Box, Typography, IconButton, Collapse, Checkbox, FormControl, Select, MenuItem, Chip, Divider, Button, LinearProgress } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ValidationStyle } from '@/css/ValidationStyles';
import React from "react";
import CloseIcon from '@mui/icons-material/Close';
import { smartAudiences } from "../../smartAudiences";
import ValidationPopup from "./SkipValidationPopup";
import { useRouter } from "next/navigation";

interface ExpandableFilterProps {
    targetAudience: string;
    useCaseType: string;
    onSkip: () => void;
    onValidate: (data: FilterData) => void;
    onEdit: () => void;
}

interface FilterData {
    nestedSelections: { [key: string]: string };
    expandedNested: { [key: string]: boolean };
    selectedOptionsPersonalEmail: string[];
    selectedOptionsBusinessEmail: string[];
    selectedOptionsPhone: string[];
    selectedOptionsPostalCAS: string[];
    selectedOptionsLinkedIn: string[];
}

const AllFilters: React.FC<ExpandableFilterProps> = ({ targetAudience, useCaseType, onSkip, onValidate, onEdit }) => {
    const router = useRouter();
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
    const [isValidate, setValidate] = useState(false)

    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    const toggleFilter = (setter: React.Dispatch<React.SetStateAction<boolean>>, state: boolean) => {
        if (!isValidate) setter(!state);
    };

    const handleOptionClick = (setter: React.Dispatch<React.SetStateAction<string[]>>, option: string) => {
        if (!isValidate) {
            setter((prev) => (prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]));
        }
    };

    const handleNestedSelect = (option: string, value: string) => {
        if (!isValidate) {
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
        }
    };

    const toggleNestedExpand = (label: string) => {
        if (!isValidate) { // Разрешаем открывать/закрывать только если isValidate === false
            setExpandedNested((prev) => ({
                ...prev,
                [label]: !prev[label]
            }));
        }
    };

    const removeChip = (setState: Function, option: string) => {
        if (!isValidate) {
            setState((prev: string[]) => prev.filter((item) => item !== option));
            setNestedSelections((prev) => {
                const updated = { ...prev };
                delete updated[option];
                return updated;
            });
        }
    };

    const getChipStyle = (label: string) => {
        if (label === "Recency" || label === "RecencyBusiness") {
            return { backgroundColor: 'rgba(234, 248, 221, 1)', color: 'rgba(43, 91, 0, 1)', borderRadius: '3px', maxHeight:'20px', cursor: isValidate ? 'default' : 'pointer' };
        } else if (label === "MX" || label === "Delivery") {
            return { backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(95, 99, 104, 1)', borderRadius: '3px', border: '1px solid rgba(200, 200, 200, 1)', cursor: isValidate ? 'default' : 'pointer', maxHeight:'20px' };
        }
        return { backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(95, 99, 104, 1)', borderRadius: '3px', border: '1px solid rgba(200, 200, 200, 1)', cursor: isValidate ? 'default' : 'pointer', maxHeight:'20px' };
    };

    const handleValidate = () => {
        setValidate(true);
        setIsOpenPersonalEmail(false);
        setIsOpenBusinessEmail(false);
        setIsOpenPhone(false);
        setIsOpenPostalCAS(false);
        setIsOpenLinkedIn(false);
        onValidate({
            nestedSelections,
            expandedNested,
            selectedOptionsPersonalEmail,
            selectedOptionsBusinessEmail,
            selectedOptionsPhone,
            selectedOptionsPostalCAS,
            selectedOptionsLinkedIn
        });
    }

    const handleSkip = () => {
        setOpenPopup(true);
    }

    const handleEdit = () => {
        setValidate(false);
        onEdit();
    };

    const handleSkipPopup = () => {
        setSelectedOptionsPersonalEmail([]);
        setSelectedOptionsBusinessEmail([]);
        setSelectedOptionsPhone([]);
        setSelectedOptionsPostalCAS([]);
        setSelectedOptionsLinkedIn([]);
        setNestedSelections({});
        setOpenPopup(false); 
        onSkip(), 
        setValidate(true)
    }

    useEffect(() => {
        setSelectedOptionsPersonalEmail([]);
        setSelectedOptionsBusinessEmail([]);
        setSelectedOptionsPhone([]);
        setSelectedOptionsPostalCAS([]);
        setSelectedOptionsLinkedIn([]);
        setNestedSelections({});
        onEdit();

        if ((targetAudience === 'B2C' || targetAudience === 'Both') && useCaseType === 'Email') {
            setNestedSelections(prev => ({ ...prev, "Recency": "40 days" }));
            setSelectedOptionsPersonalEmail(["MX", "Delivery", "Recency"]);
            setValidate(false)
        }

        if ((targetAudience === 'B2B' || targetAudience === 'Both') && useCaseType === 'Email') {
            setNestedSelections(prev => ({ ...prev, "RecencyBusiness": "40 days" }));
            setSelectedOptionsBusinessEmail(["MX", "Delivery", "RecencyBusiness"]);
            setValidate(false)
        }

        if (useCaseType === "Tele Marketing") {
            if (targetAudience === "Both" || targetAudience === "B2B") {
                setSelectedOptionsPhone(["Last updated date", "Confirmation"]);
            } else if (targetAudience === "B2C") {
                setSelectedOptionsPhone(["Last updated date"]);
            }
            setValidate(false)
        }

        if (useCaseType === "Postal") {
            if (targetAudience === "Both") {
                setSelectedOptionsPostalCAS(["CAS office address", "CAS home address"]);
            } else if (targetAudience === "B2C") {
                setSelectedOptionsPostalCAS(["CAS home address"]);
            } else if (targetAudience === "B2B") {
                setSelectedOptionsPostalCAS(["CAS office address"]);
            }
            setValidate(false)
        }

        if ((targetAudience === 'B2B' || targetAudience === 'Both') && useCaseType === 'LinkedIn') {
            setSelectedOptionsLinkedIn(["Job validation"]);
            setValidate(false)
        }
    }, [targetAudience, useCaseType]);

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
                        <Box sx={ValidationStyle.main_filter_form}>
                            <Box sx={{ ...ValidationStyle.filter_form, alignItems: 'center', borderBottom: isOpenPersonalEmail ? '1px solid rgba(235, 235, 235, 1)' : '', cursor: isValidate ? 'default' : 'pointer' }} onClick={() => toggleFilter(setIsOpenPersonalEmail, isOpenPersonalEmail)}>
                                <Box sx={{display: 'flex', justifyContent: 'start', gap:1.5, alignItems: 'start'}}>
                                <Typography sx={ValidationStyle.filter_name}>Personal email</Typography>
                                {selectedOptionsPersonalEmail.map((option) => (
                                    <Chip
                                        key={option}
                                        label={nestedSelections[option] ? `${option} ${nestedSelections[option]}` : option}
                                        onDelete={isValidate ? undefined : () => removeChip(setSelectedOptionsPersonalEmail, option)}
                                        deleteIcon={!isValidate ? <CloseIcon sx={{ color: 'rgba(32, 33, 36, 1)', fontSize: '16px' }} /> : undefined}
                                        sx={{ margin: 0, padding:0, ...getChipStyle(option) }}
                                    />

                                ))}
                                </Box>
                                <IconButton sx={{cursor: isValidate ? 'default' : 'pointer'}} onClick={() => toggleFilter(setIsOpenPersonalEmail, isOpenPersonalEmail)} aria-label="toggle-content">
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
                                                    size="small"
                                                    disabled={isValidate}
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
                                                    size="small"
                                                    disabled={isValidate}
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
                                                    size="small"
                                                    disabled={isValidate}
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
                        <Box sx={ValidationStyle.main_filter_form}>
                            <Box sx={ValidationStyle.filter_form} onClick={() => toggleFilter(setIsOpenBusinessEmail, isOpenBusinessEmail)}>
                            <Box sx={{display: 'flex', justifyContent: 'start', gap:1.5, alignItems: 'center', cursor: isValidate ? 'default' : 'pointer'}}>
                                <Typography sx={ValidationStyle.filter_name}>Business email</Typography>
                                {selectedOptionsBusinessEmail.map((option) => (
                                    <Chip
                                        key={option}
                                        label={nestedSelections[option] ? `${option === 'RecencyBusiness' ? 'Recency' : option}: ${nestedSelections[option]}` : option === 'RecencyBusiness' ? 'Recency' : option}
                                        onDelete={isValidate ? undefined : () => removeChip(setSelectedOptionsBusinessEmail, option)}
                                        deleteIcon={
                                            <CloseIcon
                                                sx={{
                                                    backgroundColor: 'transparent',
                                                    color: '#828282 !important',
                                                    fontSize: '14px !important'
                                                }}
                                            />
                                        }
                                        sx={{ margin: "2px", ...getChipStyle(option) }}
                                    />
                                ))}
                                </Box>
                                <IconButton sx={{cursor: isValidate ? 'default' : 'pointer'}} onClick={() => toggleFilter(setIsOpenBusinessEmail, isOpenBusinessEmail)} aria-label="toggle-content">
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
                                                    size="small"
                                                    disabled={isValidate}
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
                                                    size="small"
                                                    disabled={isValidate}
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
                                                    size="small"
                                                    disabled={isValidate}
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
                        <Box sx={ValidationStyle.main_filter_form}>
                            <Box sx={ValidationStyle.filter_form} onClick={() => toggleFilter(setIsOpenPhone, isOpenPhone)}>
                            <Box sx={{display: 'flex', justifyContent: 'start', gap:1.5, alignItems: 'center', cursor: isValidate ? 'default' : 'pointer'}}>
                                <Typography sx={ValidationStyle.filter_name}>Phone</Typography>
                                {selectedOptionsPhone.map((option) => (
                                    <Chip
                                        key={option}
                                        label={option}
                                        onDelete={isValidate ? undefined : () => removeChip(setSelectedOptionsPhone, option)}
                                        deleteIcon={
                                            <CloseIcon
                                                sx={{
                                                    backgroundColor: 'transparent',
                                                    color: '#828282 !important',
                                                    fontSize: '14px !important'
                                                }}
                                            />
                                        }
                                        sx={{ margin: 0, ...getChipStyle(option) }}
                                    />
                                ))}
                                </Box>
                                <IconButton onClick={() => toggleFilter(setIsOpenPhone, isOpenPhone)} aria-label="toggle-content">
                                    {isOpenPhone ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>
                            <Collapse in={isOpenPhone}>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1, pl: 2, pb: 0.75 }}>
                                    {["Last updated date", "Confirmation"].map((option, index) => {
                                        const isRecommended =
                                            useCaseType === "Tele Marketing" &&
                                            ((targetAudience === "Both" || targetAudience === "B2B") ||
                                                (targetAudience === "B2C" && option === "Last updated date"));

                                        return (
                                            <React.Fragment key={option}>
                                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Checkbox
                                                            size="small"
                                                            disabled={isValidate}
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
                        <Box sx={ValidationStyle.main_filter_form}>
                            <Box sx={ValidationStyle.filter_form} onClick={() => toggleFilter(setIsOpenPostalCAS, isOpenPostalCAS)}>
                            <Box sx={{display: 'flex', justifyContent: 'start', gap:1.5, alignItems: 'center'}}>
                                <Typography sx={ValidationStyle.filter_name}>Postal CAS verification</Typography>
                                {selectedOptionsPostalCAS.map((option) => (
                                    <Chip
                                        key={option}
                                        label={option}
                                        onDelete={isValidate ? undefined : () => removeChip(setSelectedOptionsPostalCAS, option)}
                                        deleteIcon={
                                            <CloseIcon
                                                sx={{
                                                    backgroundColor: 'transparent',
                                                    color: '#828282 !important',
                                                    fontSize: '14px !important'
                                                }}
                                            />
                                        }
                                        sx={{ margin: "2px", ...getChipStyle(option) }}
                                    />
                                ))}
                                </Box>
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
                                                            size="small"
                                                            disabled={isValidate}
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
                        <Box sx={ValidationStyle.main_filter_form}>
                            <Box sx={ValidationStyle.filter_form} onClick={() => toggleFilter(setIsOpenLinkedIn, isOpenLinkedIn)}>
                            <Box sx={{display: 'flex', justifyContent: 'start', gap:1.5, alignItems: 'end'}}>
                                <Typography sx={ValidationStyle.filter_name}>LinkedIn</Typography>
                                {selectedOptionsLinkedIn.map((option) => (
                                    <Chip
                                        key={option}
                                        label={option}
                                        onDelete={isValidate ? undefined : () => removeChip(setSelectedOptionsLinkedIn, option)}
                                        deleteIcon={
                                            <CloseIcon
                                                sx={{
                                                    backgroundColor: 'transparent',
                                                    color: '#828282 !important',
                                                    fontSize: '14px !important'
                                                }}
                                            />
                                        }
                                        sx={{ margin: "2px", ...getChipStyle(option) }}
                                    />
                                ))}
                                </Box>
                                <IconButton onClick={() => toggleFilter(setIsOpenLinkedIn, isOpenLinkedIn)} aria-label="toggle-content">
                                    {isOpenLinkedIn ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>
                            <Collapse in={isOpenLinkedIn}>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1, pl: 2, pb: 0.75 }}>

                                    <Box key={"Job validation"}>
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Checkbox
                                                disabled={isValidate}
                                                    size="small"
                                                    checked={selectedOptionsLinkedIn.includes("Job validation")}
                                                    onChange={() => handleOptionClick(setSelectedOptionsLinkedIn, "Job validation")}
                                                    sx={{ padding: 0, '&.Mui-checked': { color: "rgba(80, 82, 178, 1)" } }}
                                                />
                                                <Typography className="form-input">Job validation</Typography>
                                                {((targetAudience === 'B2B' || targetAudience === 'Both') && useCaseType === 'LinkedIn') && <Typography className='table-data' sx={smartAudiences.labelText}>Recommended</Typography>}
                                            </Box>
                                            
                                        </Box>
                                        
                                    </Box>
                                    
                                </Box>
                            </Collapse>
                        </Box>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'end', mt:1.5 }}>
                            {isValidate ? 
                                <Button
                                variant="contained"
                                onClick={handleEdit} 
                                sx={{
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
                                        Edit
                                    </Typography>
                                </Button> 
                            : 
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
                            }
                        </Box>
                    </Box>
                </Box>
            </Box>

            {!isValidate && 
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 2, justifyContent: "flex-end", borderRadius: "6px" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Button 
                        onClick={() => router.push('/smart-audiences')}
                        variant="outlined" sx={{
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
                    <Button variant="contained" disabled={nestedSelections ? false : true} onClick={handleValidate} sx={{
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
            }
            <ValidationPopup
                open={openPopup}
                onClose={() => setOpenPopup(false)}
                onContinue={() => setOpenPopup(false)}
                onSkip={handleSkipPopup}
            />
        </Box>
    );
};

export default AllFilters;