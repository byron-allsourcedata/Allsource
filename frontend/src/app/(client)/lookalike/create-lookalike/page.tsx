'use client'

import React, { useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
} from "@mui/material";
import Image from "next/image";
import DownloadIcon from '@mui/icons-material/Download';
import DateRangeIcon from '@mui/icons-material/DateRange';
import FilterListIcon from '@mui/icons-material/FilterList';
import CreateLookalikeForm from "../components/CreateLookalikeForm";
import CustomToolTip from "@/components/customToolTip";


const tableRows = [
    {
        name: "My First Lookalike",
        source: "My Orders",
        sourceType: "Customer Conversions",
        lookalikeSize: "Almost identical 0-3%",
        createdDate: "Feb 18, 2025",
        createdBy: "Mikhail Sofin",
        size: "7,523",
    },
];

const CreateLookalikePage: React.FC = () => {
    const [isLookalikeGenerated, setIsLookalikeGenerated] = useState(false);
    const [formattedDates, setFormattedDates] = useState<string>('');
    const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
    const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedDates, setSelectedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [appliedDates, setAppliedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const isCalendarOpen = Boolean(calendarAnchorEl);
    const dropdownOpen = Boolean(dropdownEl);
    const [filterPopupOpen, setFilterPopupOpen] = useState(false);

    const handleFilterPopupOpen = () => {
        setFilterPopupOpen(true);
    };

    const handleFilterPopupClose = () => {
        setFilterPopupOpen(false);
    };

    const handleCalendarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setCalendarAnchorEl(event.currentTarget);
    };

    const handleCalendarClose = () => {
        setCalendarAnchorEl(null);
    };

    const handleDateChange = (dates: { start: Date | null; end: Date | null }) => {
        setSelectedDates(dates);
        const { start, end } = dates;
        if (start && end) {
            setFormattedDates(`${start.toLocaleDateString()} - ${end.toLocaleDateString()}`);
        } else if (start) {
            setFormattedDates(`${start.toLocaleDateString()}`);
        } else {
            setFormattedDates('');
        }
    };

    const handleApply = (dates: { start: Date | null; end: Date | null }) => {
        if (dates.start && dates.end) {
            const formattedStart = dates.start.toLocaleDateString();
            const formattedEnd = dates.end.toLocaleDateString();

            const dateRange = `${formattedStart} - ${formattedEnd}`;

            setAppliedDates(dates);
            setCalendarAnchorEl(null);

            handleCalendarClose();
        }
    };


    return (
        <Box sx={{ width: "100%", pr: 2 }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <Box>
                        <CreateLookalikeForm />
                </Box>
            </Box>
        </Box>
    );
};

export default CreateLookalikePage;
