'use client'

import React, { useEffect, useState } from "react";
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
import axiosInstance from "@/axios/axiosInterceptorInstance";
import LookalikeTable from "./components/LookalikeTable";
import CustomTablePagination from "@/components/CustomTablePagination";
import CustomizedProgressBar from '@/components/CustomizedProgressBar'


const tableData = [
  {
    id: "1",
    name: "Lookalike Audience 1",
    source: "My Orders",
    sourceType: "Lead Failures",
    lookalikeSize: 'Almost identical 0-3%',
    createdDate: new Date(2025, 3, 10),
    createdBy: "John Doe",
    size: 2500,
  },
  {
    id: "2",
    name: "Lookalike Audience 2",
    source: "CSV",
    sourceType: "Customer Conversions",
    lookalikeSize: 'Almost identical 0-3%',
    createdDate: new Date(2025, 3, 10),
    createdBy: "Jane Smith",
    size: 5000,
  },
];

interface FetchDataParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page: number;
    rowsPerPage: number;
    appliedDates: { start: Date | null; end: Date | null };
}

interface TableRowData {
    id: string;
    name: string;
    source: string;
    source_type: string;
    lookalike_size: string;
    created_date: Date;
    created_by: string;
    size: number;
}

const CreateLookalikePage: React.FC = () => {
    const [isLookalikeGenerated, setIsLookalikeGenerated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lookalikesData, setLookalikeData] = useState<any[]>([]);

    // Pagination and Sorting
    const [count_lookalikes, setCountLookalike] = useState<number | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [rowsPerPageOptions, setRowsPerPageOptions] = useState<number[]>([]);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);

    // Calendary
    const [selectedDates, setSelectedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [appliedDates, setAppliedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [formattedDates, setFormattedDates] = useState<string>('');
    const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
    const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(null);
    const isCalendarOpen = Boolean(calendarAnchorEl);
    const dropdownOpen = Boolean(dropdownEl);

    // Filter
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

    const handleChangeRowsPerPage = (event: React.ChangeEvent<{ value: unknown }>) => {
            setRowsPerPage(parseInt(event.target.value as string, 10));
            setPage(0);
        };
    
    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
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

    const handleFetchLookalikes = async ({ sortBy, sortOrder, page, rowsPerPage, appliedDates }: FetchDataParams) => {
        try {
            setLoading(true);
            // Processing "Date Calendly"
            const timezoneOffsetInHours = -new Date().getTimezoneOffset() / 60;
            const startEpoch = appliedDates.start
                ? Math.floor(new Date(appliedDates.start.toISOString()).getTime() / 1000)
                : null;

            const endEpoch = appliedDates.end
                ? Math.floor(new Date(appliedDates.end.toISOString()).getTime() / 1000)
                : null;

            let url = `/lookalikes?page=${page + 1}&per_page=${rowsPerPage}&timezone_offset=${timezoneOffsetInHours}`;
            if (startEpoch !== null && endEpoch !== null) {
                url += `&from_date=${startEpoch}&to_date=${endEpoch}`;
            }
            if (sortBy) {
                url += `&sort_by=${sortBy}&sort_order=${sortOrder}`;
            }

            const response = await axiosInstance.get(url);
            const [leads, count] = response.data;
            setLookalikeData(Array.isArray(leads) ? leads : []);
            setCountLookalike(count || 0);
            if(leads && count > 0){
                setIsLookalikeGenerated(true)
            }
            const options = [15, 30, 50, 100, 200, 500];
            let RowsPerPageOptions = options.filter(option => option <= count);
            if (RowsPerPageOptions.length < options.length) {
                RowsPerPageOptions = [...RowsPerPageOptions, options[RowsPerPageOptions.length]];
            }
            setRowsPerPageOptions(RowsPerPageOptions);
            const selectedValue = RowsPerPageOptions.includes(rowsPerPage) ? rowsPerPage : 15;
            setRowsPerPage(selectedValue);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        handleFetchLookalikes({
            sortBy: orderBy,
            sortOrder: order,
            page,
            rowsPerPage,
            appliedDates: {
                start: appliedDates.start,
                end: appliedDates.end,
            }
        });
    }, [appliedDates, orderBy, order, page, rowsPerPage]);

    return (
        <Box sx={{ width: "100%", pr: 2, flexGrow: 1 }}>
            {loading && <CustomizedProgressBar />}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        pl: '0.5rem',
                        mb: 1,
                        gap: '15px',
                    }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, pt:1 }}>
                        <Typography className='first-sub-title'>
                            Lookalikes
                        </Typography>
                    </Box>
                    <Box sx={{
                        display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px', pt: '16px',
                        '@media (max-width: 900px)': {
                            gap: '8px'
                        }
                    }}>
                        {isLookalikeGenerated &&
                            <Box sx={{display: 'flex', flexDirection: 'row', gap:2, alignItems: 'center', width: '100%'}}>
                                <Button
                                    aria-controls={dropdownOpen ? 'account-dropdown' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={dropdownOpen ? 'true' : undefined}
                                    sx={{
                                        textTransform: 'none',
                                        color: 'rgba(128, 128, 128, 1)',
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
                                    aria-expanded={isCalendarOpen ? 'true' : undefined}
                                    onClick={handleCalendarClick}
                                    sx={{
                                        textTransform: 'none',
                                        color: 'rgba(128, 128, 128, 1)',
                                        border: formattedDates ? '1px solid rgba(80, 82, 178, 1)' : '1px solid rgba(184, 184, 184, 1)',
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
                <Box sx={{flexGrow: 1, display: 'flex',}}>
                    {isLookalikeGenerated ? (
                        <Box sx={{flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', alignItems: 'end'}}>
                        <LookalikeTable tableData={lookalikesData} />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: '24px 0 0', "@media (max-width: 600px)": { padding: '12px 0 0' } }}>
                                        <CustomTablePagination
                                            count={count_lookalikes ?? 0}
                                            page={page}
                                            rowsPerPage={rowsPerPage}
                                            onPageChange={handleChangePage}
                                            onRowsPerPageChange={handleChangeRowsPerPage}
                                            rowsPerPageOptions={rowsPerPageOptions}
                                        />
                                    </Box>
                                    </Box>
                        //<Lookalike tableRows={tableRows} />
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
