'use client'

import React, { useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
} from "@mui/material";
import Lookalike from "./components/Lokalike";
import Image from "next/image";
import DownloadIcon from '@mui/icons-material/Download';
import DateRangeIcon from '@mui/icons-material/DateRange';
import FilterListIcon from '@mui/icons-material/FilterList';
import CustomToolTip from "@/components/customToolTip";
import Link from "next/link"


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
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        pl: '0.5rem',
                        mb: 2,
                        gap: '15px',
                    }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, pt:2 }}>
                        <Typography className='first-sub-title'>
                            Lookalikes
                        </Typography>
                    </Box>
                    <Box sx={{
                        display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px', pt: '4px',
                        '@media (max-width: 900px)': {
                            gap: '8px'
                        }
                    }}>
                        {isLookalikeGenerated &&
                            <Box>
                                <Button
                                    aria-controls={dropdownOpen ? 'account-dropdown' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={dropdownOpen ? 'true' : undefined}
                                    disabled={status === 'PIXEL_INSTALLATION_NEEDED'}
                                    sx={{
                                        textTransform: 'none',
                                        color: 'rgba(128, 128, 128, 1)',
                                        opacity: status === 'PIXEL_INSTALLATION_NEEDED' ? '0.5' : '1',
                                        border: '1px solid rgba(184, 184, 184, 1)',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        minWidth: 'auto',
                                        '@media (max-width: 900px)': {
                                            border: 'none',
                                            padding: 0
                                        },
                                        '&:hover': {
                                            backgroundColor: 'transparent',
                                            border: '1px solid rgba(80, 82, 178, 1)',
                                            color: 'rgba(80, 82, 178, 1)',
                                            '& .MuiSvgIcon-root': {
                                                color: 'rgba(80, 82, 178, 1)'
                                            }
                                        }
                                    }}
                                //onClick={handleDownload}
                                >
                                    <DownloadIcon fontSize='medium' />
                                </Button>
                                <Button
                                    onClick={handleFilterPopupOpen}
                                    disabled={status === 'PIXEL_INSTALLATION_NEEDED'}
                                    aria-controls={dropdownOpen ? 'account-dropdown' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={dropdownOpen ? 'true' : undefined}
                                    sx={{
                                        textTransform: 'none',
                                        // color: selectedFilters.length > 0 ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)',
                                        // border: selectedFilters.length > 0 ? '1px solid rgba(80, 82, 178, 1)' : '1px solid rgba(184, 184, 184, 1)',
                                        color: 'rgba(128, 128, 128, 1)',
                                        border: '1px solid rgba(184, 184, 184, 1)',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        opacity: status === 'PIXEL_INSTALLATION_NEEDED' ? '0.5' : '1',
                                        minWidth: 'auto',
                                        position: 'relative',
                                        '@media (max-width: 900px)': {
                                            border: 'none',
                                            padding: 0
                                        },
                                        '&:hover': {
                                            backgroundColor: 'transparent',
                                            border: '1px solid rgba(80, 82, 178, 1)',
                                            color: 'rgba(80, 82, 178, 1)',
                                            '& .MuiSvgIcon-root': {
                                                color: 'rgba(80, 82, 178, 1)'
                                            }
                                        }
                                    }}
                                >
                                    <FilterListIcon fontSize='medium' sx={{
                                        //color: selectedFilters.length > 0 ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)' 
                                        color: 'rgba(128, 128, 128, 1)'
                                    }} />

                                    {/* {selectedFilters.length > 0 && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 6,
                                            right: 8,
                                            width: '10px',
                                            height: '10px',
                                            backgroundColor: 'red',
                                            borderRadius: '50%',
                                            '@media (max-width: 900px)': {
                                                top: -1,
                                                right: 1
                                            }
                                        }}
                                    />
                                )} */}
                                </Button>

                                <Button
                                    aria-controls={isCalendarOpen ? 'calendar-popup' : undefined}
                                    aria-haspopup="true"
                                    disabled={status === 'PIXEL_INSTALLATION_NEEDED'}
                                    aria-expanded={isCalendarOpen ? 'true' : undefined}
                                    onClick={handleCalendarClick}
                                    sx={{
                                        textTransform: 'none',
                                        color: 'rgba(128, 128, 128, 1)',
                                        border: formattedDates ? '1px solid rgba(80, 82, 178, 1)' : '1px solid rgba(184, 184, 184, 1)',
                                        borderRadius: '4px',
                                        opacity: status === 'PIXEL_INSTALLATION_NEEDED' ? '0.5' : '1',
                                        padding: '8px',
                                        minWidth: 'auto',
                                        '@media (max-width: 900px)': {
                                            border: 'none',
                                            padding: 0
                                        },
                                        '&:hover': {
                                            backgroundColor: 'transparent',
                                            border: '1px solid rgba(80, 82, 178, 1)',
                                            color: 'rgba(80, 82, 178, 1)',
                                            '& .MuiSvgIcon-root': {
                                                color: 'rgba(80, 82, 178, 1)'
                                            }
                                        }
                                    }}
                                >
                                    <DateRangeIcon fontSize='medium' sx={{ color: formattedDates ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)', }} />
                                    <Typography variant="body1" sx={{
                                        fontFamily: 'Nunito Sans',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        lineHeight: '19.6px',
                                        textAlign: 'left',

                                        "@media (max-width: 600px)": {
                                            display: 'none'
                                        },
                                    }}>
                                    </Typography>
                                </Button>
                            </Box>
                        }
                    </Box>
                </Box>
                <Box>
                    {isLookalikeGenerated ? (
                        <Lookalike tableRows={tableRows} />
                    ) : (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            border: '1px solid rgba(235, 235, 235, 1)',
                            borderRadius: 2,
                            padding: 3,
                            boxSizing: 'border-box',
                            width: '100%',
                            textAlign: 'center',
                            flex: 1,
                            '& img': {
                                width: 'auto',
                                height: 'auto',
                                maxWidth: '100%'
                            }
                        }}>
                            <Typography variant="h5" className='first-sub-title' sx={{
                                mb: 3,
                                fontFamily: 'Nunito Sans',
                                fontSize: "20px",
                                color: "#4a4a4a",
                                fontWeight: "600",
                                lineHeight: "28px"
                            }}>
                                Generate Your First Lookalike on Source Page
                            </Typography>
                            <Image src='/pixel_installation_needed.svg' alt='Need Pixel Install'
                                height={250} width={300} />
                            <Typography variant="body1" className='table-data' sx={{
                                mt: 3,
                                fontFamily: 'Nunito Sans',
                                fontSize: "14px",
                                color: "#808080",
                                fontWeight: "600",
                                lineHeight: "20px"
                            }}>
                                To generate your first Lookalike go to Source page and start creating.
                            </Typography>
                            <Link href="/sources" passHref>
                                <Button
                                    variant="contained"
                                    className="second-sub-title"
                                    sx={{
                                        backgroundColor: "rgba(80, 82, 178, 1)",
                                        textTransform: "none",
                                        padding: "10px 24px",
                                        mt: 3,
                                        color: "#fff !important",
                                        ":hover": {
                                            backgroundColor: "rgba(80, 82, 178, 1)",
                                        },
                                    }}
                                >
                                    Go to Source Page
                                </Button>
                            </Link>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default CreateLookalikePage;
