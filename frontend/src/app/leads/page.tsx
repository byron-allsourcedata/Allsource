"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { Box, Grid, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';
import { leadsStyles } from './leadsStyles';
import Slider from '../../components/Slider';
import { SliderProvider } from '../../context/SliderContext';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import DateRangeIcon from '@mui/icons-material/DateRange';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarPopup from '../../components/CalendarPopup';
import FilterPopup from '@/components/FiltersSlider';
import AudiencePopup from '@/components/AudienceSlider';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import dayjs from 'dayjs';
import PopupDetails from '@/components/AccountDetails';
import CloseIcon from '@mui/icons-material/Close';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';




interface CustomTablePaginationProps {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => void;
    onRowsPerPageChange: (event: React.ChangeEvent<{ value: unknown }>) => void;
}

interface FetchDataParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page: number;
    rowsPerPage: number;
    activeFilter: string;
    appliedDates: { start: Date | null; end: Date | null };
}

const CustomTablePagination: React.FC<CustomTablePaginationProps> = ({
    count,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
}) => {
    const totalPages = Math.ceil(count / rowsPerPage);
    const maxPagesToShow = 3;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            onPageChange(null as any, newPage);
        }
    };

    const getPageButtons = () => {
        const pages = [];
        let startPage = Math.max(0, page - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(0, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: 1 }}>
            <select
                value={rowsPerPage}
                onChange={onRowsPerPageChange}
                style={{
                    marginLeft: 8,
                    border: '1px solid rgba(235, 235, 235, 1)',
                    backgroundColor: 'rgba(255, 255, 255, 1)'
                }}
            >
                {[10, 15, 25, 50].map((option) => (
                    <option key={option} value={option}>
                        {option} rows
                    </option>
                ))}
            </select>
            <Button
                onClick={(e) => handlePageChange(page - 1)}
                disabled={page === 0}
                sx={{
                    minWidth: '30px',
                    minHeight: '30px',
                }}
            >
                <ChevronLeft
                    sx={{
                        border: page === 0 ? 'none' : '1px solid rgba(235, 235, 235, 1)',
                        borderRadius: '4px'
                    }} />
            </Button>
            {totalPages > 1 && (
                <>
                    {page > 1 && <Button onClick={() => handlePageChange(0)} sx={leadsStyles.page_number}>1</Button>}
                    {page > 2 && <Typography variant="body2" sx={{ mx: 1 }}>...</Typography>}
                    {getPageButtons().map((pageNumber) => (
                        <Button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            sx={{
                                mx: 0.5, ...leadsStyles.page_number,
                                border: page === pageNumber ? '1px solid rgba(80, 82, 178, 1)' : 'none',
                                color: page === pageNumber ? 'rgba(80, 82, 178, 1)' : 'rgba(122, 122, 122, 1)',
                                minWidth: '30px',
                                minHeight: '30px',
                                padding: 0
                            }}
                            variant={page === pageNumber ? 'contained' : 'text'}
                        >
                            {pageNumber + 1}
                        </Button>
                    ))}
                    {totalPages - page > 3 && <Typography variant="body2" sx={{ mx: 1 }}>...</Typography>}
                    {page < totalPages - 1 && <Button onClick={() => handlePageChange(totalPages - 1)}
                        sx={leadsStyles.page_number}>{totalPages}</Button>}
                </>
            )}
            <Button
                onClick={(e) => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
                sx={{
                    minWidth: '30px',
                    minHeight: '30px',
                }}
            >
                <ChevronRight sx={{
                    border: page >= totalPages - 1 ? 'none' : '1px solid rgba(235, 235, 235, 1)',
                    borderRadius: '4px'
                }} />
            </Button>
        </Box>
    );
};


const Leads: React.FC = () => {
    const router = useRouter();
    const [data, setData] = useState<any[]>([]);
    const [count_leads, setCount] = useState<number | null>(null);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [appliedDates, setAppliedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [status, setStatus] = useState<string | null>(null);
    const [showSlider, setShowSlider] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
    const dropdownOpen = Boolean(dropdownEl);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [activeFilter, setActiveFilter] = useState<string>('');
    const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedDates, setSelectedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const isCalendarOpen = Boolean(calendarAnchorEl);
    const [formattedDates, setFormattedDates] = useState<string>('');
    const [filterPopupOpen, setFilterPopupOpen] = useState(false);
    const [audiencePopupOpen, setAudiencePopupOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState<{ label: string, value: string }[]>([]);
    const [openPopup, setOpenPopup] = React.useState(false);
    const [popupData, setPopupData] = React.useState<any>(null);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleOpenPopup = (row: any) => {
        setPopupData(row);
        setOpenPopup(true);
    };

    const handleClosePopup = () => {
        setOpenPopup(false);
    };

    interface FilterParams {
        from_date: number | null;
        to_date: number | null;
        from_time: string | null;
        to_time: string | null;
        selectedStatus: string[];
        regions: string[];
        emails: string[];
        selectedFunnels: string[];
        searchQuery: string | null;
        checkedFilters: {
            lastWeek: boolean;
            last30Days: boolean;
            last6Months: boolean;
            allTime: boolean;
        };
        checkedFiltersPageVisits: {
            page: boolean;
            two_page: boolean;
            three_page: boolean;
            more_three: boolean;
        };
        checkedFiltersTime: {
            morning: boolean;
            evening: boolean;
            afternoon: boolean;
            all_day: boolean;
        };
        checkedFiltersTimeSpent: {
            under_10: boolean;
            over_10: boolean;
            over_30: boolean;
            over_60: boolean;
        };
        recurringVisits: any[];
    }
    const [filterParams, setFilterParams] = useState<FilterParams>({
        from_date: null,
        to_date: null,
        from_time: '',
        to_time: '',
        selectedStatus: [],
        regions: [],
        emails: [],
        selectedFunnels: [],
        searchQuery: '',
        checkedFilters: { lastWeek: false, last30Days: false, last6Months: false, allTime: false },
        checkedFiltersPageVisits: { page: false, two_page: false, three_page: false, more_three: false },
        checkedFiltersTime: { morning: false, evening: false, afternoon: false, all_day: false },
        checkedFiltersTimeSpent: { under_10: false, over_10: false, over_30: false, over_60: false },
        recurringVisits: [],
    });


    const handleFilterPopupOpen = () => {
        setFilterPopupOpen(true);
    };

    const handleFilterPopupClose = () => {
        setFilterPopupOpen(false);
    };

    const handleAudiencePopupOpen = () => {
        setAudiencePopupOpen(true);
    };

    const handleAudiencePopupClose = () => {
        setAudiencePopupOpen(false);
    };

    const handleSortRequest = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
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
            setFormattedDates('No dates selected');
        }
    };

    const handleApply = (dates: { start: Date | null; end: Date | null }) => {
        if (dates.start && dates.end) {
            const formattedStart = dates.start.toLocaleDateString();
            const formattedEnd = dates.end.toLocaleDateString();

            const dateRange = `${formattedStart} - ${formattedEnd}`;

            setAppliedDates(dates);
            setCalendarAnchorEl(null);

            setSelectedFilters(prevFilters => {
                const existingIndex = prevFilters.findIndex(filter => filter.label === 'Dates');
                const newFilter = { label: 'Dates', value: dateRange };

                if (existingIndex !== -1) {
                    const updatedFilters = [...prevFilters];
                    updatedFilters[existingIndex] = newFilter;
                    return updatedFilters;
                } else {
                    return [...prevFilters, newFilter];
                }
            });
            handleCalendarClose();
        }
    };

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);
        setSelectedFilters([]);
        setPage(0);
    };

    const installPixel = () => {
        router.push('/dashboard');
    };

    const handleSelectRow = (id: number) => {
        setSelectedRows((prevSelectedRows) => {
            const newSelectedRows = new Set(prevSelectedRows);
            if (newSelectedRows.has(id)) {
                newSelectedRows.delete(id);
            } else {
                newSelectedRows.add(id);
            }
            return newSelectedRows;
        });
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<{ value: unknown }>) => {
        setRowsPerPage(parseInt(event.target.value as string, 10));
        setPage(0);
        fetchData({
            sortBy: orderBy,
            sortOrder: order,
            page: 0,
            rowsPerPage: parseInt(event.target.value as string, 10),
            activeFilter,
            appliedDates: {
                start: filterParams.from_date ? dayjs.unix(filterParams.from_date).toDate() : null,
                end: filterParams.to_date ? dayjs.unix(filterParams.to_date).toDate() : null,
            }
        });
    };


    const fetchData = async ({ sortBy, sortOrder, page, rowsPerPage, activeFilter, appliedDates }: FetchDataParams) => {
        try {
            const accessToken = localStorage.getItem("token");
            if (!accessToken) {
                router.push('/signin');
                return;
            }


            // Processing "Date Calendly"
            const startEpoch = appliedDates.start ? Math.floor(appliedDates.start.getTime() / 1000) : null;
            const endEpoch = appliedDates.end ? Math.floor(appliedDates.end.getTime() / 1000) : null;

            let url = `/leads?page=${page + 1}&per_page=${rowsPerPage}`;
            if (startEpoch !== null && endEpoch !== null) {
                url += `&from_date=${startEpoch}&to_date=${endEpoch}`;
            }
            if (sortBy) {
                url += `&sort_by=${sortBy}&sort_order=${sortOrder}`;
            }


            // Processing "Visitor Type"
            if (selectedFilters.some(filter => filter.label === 'Visitor Type')) {
                const status = selectedFilters.find(filter => filter.label === 'Visitor Type')?.value.split(', ') || [];
                if (status.length > 0) {
                    url += `&behavior_type=${encodeURIComponent(status.join(','))}`;
                }
            }

            // Include other filter parameters if necessary
            // Processing "Regions"
            if (selectedFilters.some(filter => filter.label === 'Regions')) {
                const regions = selectedFilters.find(filter => filter.label === 'Regions')?.value.split(', ') || [];
                if (regions.length > 0) {
                    url += `&regions=${encodeURIComponent(regions.join(','))}`;
                }
            }

            // Processing "From Date"
            if (selectedFilters.some(filter => filter.label === 'From Date')) {
                const fromDate = selectedFilters.find(filter => filter.label === 'From Date')?.value || '';
                if (fromDate) {
                    const fromDateEpoch = Math.floor(new Date(fromDate).getTime() / 1000);
                    url += `&from_date=${fromDateEpoch}`;
                }
            }

            // Processing "To Date"
            if (selectedFilters.some(filter => filter.label === 'To Date')) {
                const toDate = selectedFilters.find(filter => filter.label === 'To Date')?.value || '';
                if (toDate) {
                    const toDateEpoch = Math.floor(new Date(toDate).getTime() / 1000);
                    url += `&to_date=${toDateEpoch}`;
                }
            }

            // Processing "Lead Status"
            if (selectedFilters.some(filter => filter.label === 'Lead Status')) {
                const funnels = selectedFilters.find(filter => filter.label === 'Lead Status')?.value.split(', ') || [];
                if (funnels.length > 0) {
                    const formattedFunnels = funnels.map(funnel => funnel.toLowerCase().replace(/\s+/g, '_'));
                    url += `&status=${encodeURIComponent(formattedFunnels.join(','))}`;
                }
            }

            // Search string processing
            if (selectedFilters.some(filter => filter.label === 'Search')) {
                const searchQuery = selectedFilters.find(filter => filter.label === 'Search')?.value || '';
                if (searchQuery) {
                    url += `&search_query=${encodeURIComponent(searchQuery)}`;
                }
            }

            // Add time filters if provided
            if (selectedFilters.some(filter => filter.label === 'From Time')) {
                const fromTime = selectedFilters.find(filter => filter.label === 'From Time')?.value || '';
                if (fromTime) {
                    url += `&from_time=${encodeURIComponent(fromTime)}`;
                }
            }
            if (selectedFilters.some(filter => filter.label === 'To Time')) {
                const toTime = selectedFilters.find(filter => filter.label === 'To Time')?.value || '';
                if (toTime) {
                    url += `&to_time=${encodeURIComponent(toTime)}`;
                }
            }

            // Processing "Time Spent"
            if (selectedFilters.some(filter => filter.label === 'Time Spent')) {
                const timeSpent = selectedFilters.find(filter => filter.label === 'Time Spent')?.value.split(', ') || [];
                if (timeSpent.length > 0) {
                    const formattedTimeSpent = timeSpent.map(value => value.replace(/\s+/g, '_'));
                    url += `&time_spent=${encodeURIComponent(formattedTimeSpent.join(','))}`;
                }
            }

            // Processing "Recurring Visits"
            if (selectedFilters.some(filter => filter.label === 'Recurring Visits')) {
                const recurringVisits = selectedFilters.find(filter => filter.label === 'Recurring Visits')?.value.split(', ') || [];
                if (recurringVisits.length > 0) {
                    const formattedRecurringVisits = recurringVisits.map(value => value.replace(/\s+/g, '_'));
                    url += `&recurring_visits=${encodeURIComponent(formattedRecurringVisits.join(','))}`;
                }
            }

            // Processing "Page Visits"
            if (selectedFilters.some(filter => filter.label === 'Page Visits')) {
                const pageVisits = selectedFilters.find(filter => filter.label === 'Page Visits')?.value.split(', ') || [];
                if (pageVisits.length > 0) {
                    const formattedPageVisits = pageVisits.map(value => value.replace(/\s+/g, '_'));
                    url += `&page_visits=${encodeURIComponent(formattedPageVisits.join(','))}`;
                }
            }


            const response = await axiosInstance.get(url);
            const [leads, count] = response.data;

            setData(Array.isArray(leads) ? leads : []);
            setCount(count || 0);
            setStatus(response.data.status);
        } catch (error) {
            if (error instanceof AxiosError && error.response?.status === 403) {
                if (error.response.data.status === 'NEED_BOOK_CALL') {
                    sessionStorage.setItem('is_slider_opened', 'true');
                    setShowSlider(true);
                } else if (error.response.data.status === 'PIXEL_INSTALLATION_NEEDED') {
                    setStatus(error.response.data.status || null);
                } else {
                    setShowSlider(false);
                }
            } else {
                console.error('Error fetching data:', error);
            }
        } finally {
            setIsLoading(false);
        }
    };



    const handleApplyFilters = (filters: FilterParams) => {
        const newSelectedFilters: { label: string; value: string }[] = [];

        const dateFormat = 'YYYY-MM-DD';

        // Map of filter conditions to their labels
        const filterMappings: { condition: boolean | string | string[] | number | null, label: string, value: string | ((f: any) => string) }[] = [
            { condition: filters.from_date, label: 'From Date', value: () => dayjs.unix(filters.from_date!).format(dateFormat) },
            { condition: filters.to_date, label: 'To Date', value: () => dayjs.unix(filters.to_date!).format(dateFormat) },
            { condition: filters.selectedStatus?.length, label: 'Visitor Type', value: () => filters.selectedStatus!.join(', ') },
            { condition: filters.selectedFunnels?.length, label: 'Lead Status', value: () => filters.selectedFunnels!.join(', ') },
            { condition: filters.regions?.length, label: 'Regions', value: () => filters.regions!.join(', ') },
            { condition: filters.recurringVisits?.length, label: 'Recurring Visits', value: () => filters.recurringVisits!.join(', ') },
            { condition: filters.searchQuery?.trim() !== '', label: 'Search', value: filters.searchQuery || '' },
            { condition: filters.from_time, label: 'From Time', value: filters.from_time! },
            { condition: filters.to_time, label: 'To Time', value: filters.to_time! },
        ];

        const pageVisitFilters = [
            filters.checkedFiltersPageVisits.page && '1 page',
            filters.checkedFiltersPageVisits.two_page && '2 pages',
            filters.checkedFiltersPageVisits.three_page && '3 pages',
            filters.checkedFiltersPageVisits.more_three && 'more than 3 pages',
        ].filter(Boolean).join(', ');

        if (pageVisitFilters) {
            filterMappings.push({
                condition: true,
                label: 'Page Visits',
                value: pageVisitFilters,
            });
        }

        const timeSpentFilters = [
            filters.checkedFiltersTimeSpent.under_10 && 'under 10',
            filters.checkedFiltersTimeSpent.over_10 && '10-30 secs',
            filters.checkedFiltersTimeSpent.over_30 && '30-60 secs',
            filters.checkedFiltersTimeSpent.over_60 && 'over 60 secs',
        ].filter(Boolean).join(', ');

        if (timeSpentFilters) {
            filterMappings.push({
                condition: true,
                label: 'Time Spent',
                value: timeSpentFilters,
            });
        }

        // Iterate over the mappings to populate newSelectedFilters
        filterMappings.forEach(({ condition, label, value }) => {
            if (condition) {
                newSelectedFilters.push({ label, value: typeof value === 'function' ? value(filters) : value });
            }
        });


        setSelectedFilters(newSelectedFilters);
        setActiveFilter(filters.selectedStatus?.[0] || '');
        setFilterParams(filters);
    };

    const handleResetFilters = async () => {
        const url = `/leads`;

        try {
            const response = await axiosInstance.get(url);
            const [leads, count, max_page] = response.data;

            setData(Array.isArray(leads) ? leads : []);
            setCount(count || 0);
            setStatus(response.data.status);
            setSelectedFilters([]);
        } catch (error) {
            console.error('Error fetching leads:', error);
        }
    };

    const handleDeleteFilter = (filterToDelete: { label: string; value: string }) => {
        const updatedFilters = selectedFilters.filter(filter => filter.label !== filterToDelete.label);

        setSelectedFilters(updatedFilters);

        if (filterToDelete.label === 'Dates') {
            setAppliedDates({ start: null, end: null });
            setFormattedDates('');
        }

        const newFilters: FilterParams = {
            from_date: updatedFilters.find(f => f.label === 'From Date') ? Number(updatedFilters.find(f => f.label === 'From Date')!.value) : null,
            to_date: updatedFilters.find(f => f.label === 'To Date') ? Number(updatedFilters.find(f => f.label === 'To Date')!.value) : null,
            selectedStatus: updatedFilters.find(f => f.label === 'Status') ? updatedFilters.find(f => f.label === 'Status')!.value.split(', ') : [],
            regions: updatedFilters.find(f => f.label === 'Regions') ? updatedFilters.find(f => f.label === 'Regions')!.value.split(', ') : [],
            emails: updatedFilters.find(f => f.label === 'Emails') ? updatedFilters.find(f => f.label === 'Emails')!.value.split(', ') : [],
            selectedFunnels: updatedFilters.find(f => f.label === 'Funnels') ? updatedFilters.find(f => f.label === 'Funnels')!.value.split(', ') : [],
            searchQuery: updatedFilters.find(f => f.label === 'Search') ? updatedFilters.find(f => f.label === 'Search')!.value : '',

            checkedFilters: {
                lastWeek: false,
                last30Days: false,
                last6Months: false,
                allTime: false
            },
            checkedFiltersPageVisits: {
                page: false,
                two_page: false,
                three_page: false,
                more_three: false
            },
            checkedFiltersTime: {
                morning: false,
                evening: false,
                afternoon: false,
                all_day: false
            },
            checkedFiltersTimeSpent: {
                under_10: false,
                over_10: false,
                over_30: false,
                over_60: false
            },
            recurringVisits: [],
            from_time: null,
            to_time: null
        };

        handleApplyFilters(newFilters);
    };


    useEffect(() => {
        fetchData({
            sortBy: orderBy,
            sortOrder: order,
            page,
            rowsPerPage,
            activeFilter,
            appliedDates: {
                start: appliedDates.start,
                end: appliedDates.end,
            }
        });
    }, [appliedDates, orderBy, order, page, rowsPerPage, activeFilter, filterParams]);


    if (isLoading) {
        return <CustomizedProgressBar />;
    }

    const centerContainerStyles = {
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
    };

    const getStatusStyle = (behavior_type: any) => {
        switch (behavior_type) {
            case 'visitor':
                return {
                    background: 'rgba(235, 243, 254, 1)',
                    color: 'rgba(20, 110, 246, 1)',
                };
            case 'Visitor':
                return {
                    background: 'rgba(235, 243, 254, 1)',
                    color: 'rgba(20, 110, 246, 1)',
                };
            case 'Converted':
                return {
                    background: 'rgba(244, 252, 238, 1)',
                    color: 'rgba(110, 193, 37, 1)',
                };
            case 'Added to cart':
                return {
                    background: 'rgba(241, 241, 249, 1)',
                    color: 'rgba(80, 82, 178, 1)',
                };
            case 'Cart abandoned':
                return {
                    background: 'rgba(254, 238, 236, 1)',
                    color: 'rgba(244, 87, 69, 1)',
                };
            case 'Existing':
                return {
                    background: 'rgba(244, 252, 238, 1)',
                    color: 'rgba(43, 91, 0, 1)',
                };
            case 'New':
                return {
                    background: 'rgba(254, 243, 205, 1)',
                    color: 'rgba(101, 79, 0, 1))',
                };
            default:
                return {
                    background: 'transparent',
                    color: 'inherit',
                };
        }
    };

    const handleDownload = async () => {
        const selectedRowsArray = Array.from(selectedRows);
        const requestBody = {
            leads_ids: selectedRowsArray
        };
        setLoading(true);
        try {
            const response = await axiosInstance.post('/leads/download_leads', requestBody, {
                responseType: 'blob'
            });

            if (response.status === 200) {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'data.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                console.error('Error downloading file:', response.statusText);
            }
        } catch (error) {
            console.error('Error during the download process:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
        fetchData({
            sortBy: orderBy,
            sortOrder: order,
            page: newPage,
            rowsPerPage,
            activeFilter,
            appliedDates: {
                start: filterParams.from_date ? dayjs.unix(filterParams.from_date).toDate() : null,
                end: filterParams.to_date ? dayjs.unix(filterParams.to_date).toDate() : null,
            }
        });
    };


    return (
        <>
            {loading && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(255, 255, 255, 0.8)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        sx={{
                            border: '8px solid #f3f3f3',
                            borderTop: '8px solid #3498db',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            animation: 'spin 1s linear infinite',
                            '@keyframes spin': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' },
                            },
                        }}
                    />
                </Box>
            )}
            <Box sx={{
                display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%',
                '@media (max-width: 900px)': {
                    paddingRight: 0,
                    minHeight: '100vh'

                }
            }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '1rem',
                            flexWrap: 'wrap',
                            gap: '15px',
                            '@media (max-width: 900px)': {
                                marginTop: '1.125rem'
                            }
                        }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                            <Typography variant="h4" component="h1" sx={leadsStyles.title}>
                                Resolved Contacts ({count_leads ? count_leads : 0})
                            </Typography>
                            {/* {status != 'PIXEL_INSTALLATION_NEEDED' && (
                                    <Button
                                        disabled={status === 'PIXEL_INSTALLATION_NEEDED'}
                                        onClick={() => handleFilterChange('all')}
                                        sx={{
                                            color: activeFilter === 'all' ? 'rgba(80, 82, 178, 1)' : 'rgba(89, 89, 89, 1)',
                                            borderBottom: activeFilter === 'all' && status !== 'PIXEL_INSTALLATION_NEEDED' ? '2px solid rgba(80, 82, 178, 1)' : '0px solid transparent',
                                            textTransform: 'none',
                                            mr: '1em',
                                            borderRadius: '0px',
                                            minWidth: 'auto',
                                            padding: '0.25em 1em 0.25em 1em',
                                            '@media (max-width: 1199px)': {
                                                display: 'none'
                                            }
                                        }}
                                    >
                                        <Typography variant="body2" sx={{...leadsStyles.subtitle,
                                            color: activeFilter === 'all' ? 'rgba(80, 82, 178, 1)' : 'rgba(89, 89, 89, 1)',
                                        }}
                                        
                                        >All</Typography>
                                    </Button>

                                    )} */}
                            {/* {status != 'PIXEL_INSTALLATION_NEEDED' && (
                                    <Button
                                        disabled={status === 'PIXEL_INSTALLATION_NEEDED'}
                                        onClick={() => handleFilterChange('new_customers')}
                                        sx={{
                                            color: activeFilter === 'new_customers' ? 'rgba(80, 82, 178, 1)' : 'rgba(89, 89, 89, 1)',
                                            borderBottom: activeFilter === 'new_customers' ? '2px solid rgba(80, 82, 178, 1)' : '0px solid transparent',
                                            textTransform: 'none',
                                            mr: '1em',
                                            borderRadius: '0px',
                                            minWidth: 'auto',
                                            padding: '0.25em 1em 0.25em 1em',
                                            '@media (max-width: 1199px)': {
                                                display: 'none'
                                            }
                                        }}
                                    >
                                        <Typography variant="body2" sx={{...leadsStyles.subtitle,
                                            color: activeFilter === 'new_customers' ? 'rgba(80, 82, 178, 1)' : 'rgba(89, 89, 89, 1)',
                                        }}>New Customers</Typography>
                                    </Button>
                                    )} */}
                            {/* {status != 'PIXEL_INSTALLATION_NEEDED' && (
                                    <Button
                                        disabled={status === 'PIXEL_INSTALLATION_NEEDED'}
                                        onClick={() => handleFilterChange('existing_customers')}
                                        sx={{
                                            color: activeFilter === 'existing_customers' ? 'rgba(80, 82, 178, 1)' : 'rgba(89, 89, 89, 1)',
                                            borderBottom: activeFilter === 'existing_customers' ? '2px solid rgba(80, 82, 178, 1)' : '0px solid transparent',
                                            textTransform: 'none',
                                            mr: '1em',
                                            borderRadius: '0px',
                                            minWidth: 'auto',
                                            padding: '0.25em 1em 0.25em 1em',
                                            '@media (max-width: 1199px)': {
                                                display: 'none'
                                            }
                                        }}
                                    >
                                        <Typography variant="body2" sx={{...leadsStyles.subtitle,
                                            color: activeFilter === 'existing_customers' ? 'rgba(80, 82, 178, 1)' : 'rgba(89, 89, 89, 1)',
                                        }}>Existing
                                            Customers</Typography>
                                    </Button>
                                    )} */}
                        </Box>
                        <Box sx={{
                            display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px',
                            '@media (max-width: 900px)': {
                                gap: '8px'
                            }
                        }}>
                            <Button
                                onClick={handleAudiencePopupOpen}
                                aria-haspopup="true"
                                sx={{
                                    textTransform: 'none',
                                    color: selectedRows.size === 0 ? 'rgba(128, 128, 128, 1)' : 'rgba(80, 82, 178, 1)',
                                    border: '1px solid rgba(80, 82, 178, 1)',
                                    borderRadius: '4px',
                                    padding: '9px 16px',
                                    minWidth: 'auto',
                                    '@media (max-width: 900px)': {
                                        display: 'none'
                                    }
                                }}
                            >
                                <Typography sx={{
                                    marginRight: '0.5em',
                                    fontFamily: 'Nunito',
                                    lineHeight: '22px',
                                    fontSize: '16px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: '#5052B2'
                                }}>
                                    Create Contact Sync
                                </Typography>
                            </Button>
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
                                    }
                                }}
                                onClick={handleDownload}
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
                                    color: selectedFilters.length > 0 ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)',
                                    border: selectedFilters.length > 0 ? '1px solid rgba(80, 82, 178, 1)' : '1px solid rgba(184, 184, 184, 1)',
                                    borderRadius: '4px',
                                    padding: '8px',
                                    minWidth: 'auto',
                                    position: 'relative',
                                    '@media (max-width: 900px)': {
                                        border: 'none',
                                        padding: 0
                                    }
                                }}
                            >
                                <FilterListIcon fontSize='medium' sx={{ color: selectedFilters.length > 0 ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)' }} />

                                {selectedFilters.length > 0 && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 3,
                                            right: 10,
                                            width: '10px',
                                            height: '10px',
                                            backgroundColor: 'red',
                                            borderRadius: '50%',
                                        }}
                                    />
                                )}
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
                                    border: '1px solid rgba(184, 184, 184, 1)',
                                    borderRadius: '4px',
                                    padding: '8px',
                                    minWidth: 'auto',
                                    '@media (max-width: 900px)': {
                                        border: 'none',
                                        padding: 0
                                    }
                                }}
                            >
                                <DateRangeIcon fontSize='medium' />
                                <Typography variant="body1" sx={{
                                    fontFamily: 'Nunito',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    lineHeight: '19.6px',
                                    textAlign: 'left'
                                }}>
                                    {formattedDates}
                                </Typography>
                            </Button>
                            <Button
                                onClick={handleAudiencePopupOpen}
                                aria-haspopup="true"
                                sx={{
                                    textTransform: 'none',
                                    color: selectedRows.size === 0 ? 'rgba(128, 128, 128, 1)' : 'rgba(80, 82, 178, 1)',
                                    borderRadius: '4px',
                                    padding: '0',
                                    border: 'none',
                                    minWidth: 'auto',
                                    opacity: selectedRows.size === 0 ? 0.4 : 1,
                                    '@media (min-width: 901px)': {
                                        display: 'none'
                                    }
                                }}
                            >
                                <Image src='/add.svg' alt='logo' height={24} width={24} />
                            </Button>
                        </Box>
                    </Box>
                    <Box sx={{
                        display: 'flex', flexDirection: 'row', alignItems: 'center',
                        flexWrap: 'wrap',
                        marginTop: '1.125rem',
                        marginBottom: '0.25rem',
                        '@media (min-width: 1200px)': {
                            display: 'none'
                        }
                    }}>

                        {status != 'PIXEL_INSTALLATION_NEEDED' && data.length != 0 && (
                            <Button
                                disabled={status === 'PIXEL_INSTALLATION_NEEDED'}
                                onClick={() => handleFilterChange('all')}
                                sx={{
                                    color: activeFilter === 'all' ? 'rgba(80, 82, 178, 1)' : 'rgba(89, 89, 89, 1)',
                                    borderBottom: activeFilter === 'all' && status !== 'PIXEL_INSTALLATION_NEEDED' ? '2px solid rgba(80, 82, 178, 1)' : '0px solid transparent',
                                    textTransform: 'none',
                                    borderRadius: '0px',
                                    minWidth: 'auto',
                                    padding: '0.25em 1em 0.25em 1em'
                                }}
                            >
                                <Typography variant="body2" sx={{
                                    ...leadsStyles.subtitle,
                                    color: activeFilter === 'all' ? 'rgba(80, 82, 178, 1)' : 'rgba(89, 89, 89, 1)',
                                }}
                                >All</Typography>
                            </Button>

                        )}
                        {status != 'PIXEL_INSTALLATION_NEEDED' && data.length != 0 && (
                            <Button
                                disabled={status === 'PIXEL_INSTALLATION_NEEDED'}
                                onClick={() => handleFilterChange('new_customers')}
                                sx={{
                                    color: activeFilter === 'new_customers' ? 'rgba(80, 82, 178, 1)' : 'rgba(89, 89, 89, 1)',
                                    borderBottom: activeFilter === 'new_customers' ? '2px solid rgba(80, 82, 178, 1)' : '0px solid transparent',
                                    textTransform: 'none',
                                    borderRadius: '0px',
                                    minWidth: 'auto',
                                    padding: '0.25em 1em 0.25em 1em'
                                }}
                            >
                                <Typography variant="body2" sx={{
                                    ...leadsStyles.subtitle,
                                    color: activeFilter === 'new_customers' ? 'rgba(80, 82, 178, 1)' : 'rgba(89, 89, 89, 1)',
                                }}>New Customers</Typography>
                            </Button>
                        )}
                        {status != 'PIXEL_INSTALLATION_NEEDED' && data.length != 0 && (
                            <Button
                                disabled={status === 'PIXEL_INSTALLATION_NEEDED'}
                                onClick={() => handleFilterChange('existing_customers')}
                                sx={{
                                    color: activeFilter === 'existing_customers' ? 'rgba(80, 82, 178, 1)' : 'rgba(89, 89, 89, 1)',
                                    borderBottom: activeFilter === 'existing_customers' ? '2px solid rgba(80, 82, 178, 1)' : '0px solid transparent',
                                    textTransform: 'none',
                                    borderRadius: '0px',
                                    minWidth: 'auto',
                                    padding: '0.25em 1em 0.25em 1em'
                                }}
                            >
                                <Typography variant="body2" sx={{
                                    ...leadsStyles.subtitle,
                                    color: activeFilter === 'existing_customers' ? 'rgba(80, 82, 178, 1)' : 'rgba(89, 89, 89, 1)',
                                }}>Existing
                                    Customers</Typography>
                            </Button>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 2 }}>
                        {selectedFilters.length > 0 && (
                            <Chip
                                label="Clear all"
                                onClick={handleResetFilters}
                                sx={{ backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(80, 82, 178, 1)', borderRadius: '3px', fontFamily: 'Nunito', fontWeight: '600', fontSize: '12px' }}
                            />
                        )}
                        {selectedFilters.map(filter => (
                            <Chip
                                key={filter.label}
                                label={`${filter.label}: ${filter.value}`}
                                onDelete={() => handleDeleteFilter(filter)}
                                deleteIcon={
                                    <CloseIcon
                                        sx={{
                                            backgroundColor: 'transparent',
                                            color: 'rgba(74, 74, 74, 1)',
                                            fontSize: '14px'
                                        }}
                                    />
                                }
                                sx={{ borderRadius: '4.5px', backgroundColor: 'rgba(237, 237, 247, 1)', color: 'rgba(74, 74, 74, 1)', fontFamily: 'Nunito', fontWeight: '600', fontSize: '12px' }}
                            />
                        ))}
                    </Box>
                    <Box sx={{
                        flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '100%', pl: 0, pr: 0, pt: '14px', pb: '20px',
                        '@media (max-width: 900px)': {
                            pt: '2px',
                            pb: '18px'
                        }
                    }}>
                        {status === 'PIXEL_INSTALLATION_NEEDED' ? (
                            <Box sx={centerContainerStyles}>
                                <Typography variant="h5" sx={{
                                    mb: 3,
                                    fontFamily: "Nunito",
                                    fontSize: "20px",
                                    color: "#4a4a4a",
                                    fontWeight: "600",
                                    lineHeight: "28px"
                                }}>
                                    Pixel Integration isn&apos;t completed yet!
                                </Typography>
                                <Image src='/pixel_installation_needed.svg' alt='Need Pixel Install'
                                    height={250} width={300} />
                                <Typography variant="body1" color="textSecondary" sx={{
                                    mt: 3,
                                    fontFamily: "Nunito",
                                    fontSize: "14px",
                                    color: "#808080",
                                    fontWeight: "600",
                                    lineHeight: "20px"
                                }}>
                                    Install the pixel to unlock and gain valuable insights! Start viewing your leads now
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={installPixel}
                                    sx={{
                                        backgroundColor: 'rgba(80, 82, 178, 1)',
                                        fontFamily: "Nunito",
                                        textTransform: 'none',
                                        padding: '10px 24px',
                                        fontSize: '16px',
                                        mt: 3,
                                        lineHeight: '22px'
                                    }}
                                >
                                    Setup Pixel
                                </Button>
                            </Box>
                        ) : data.length === 0 ? (
                            <Box sx={centerContainerStyles}>
                                <Typography variant="h5" sx={{
                                    mb: 3,
                                    fontFamily: "Nunito",
                                    fontSize: "20px",
                                    color: "#4a4a4a",
                                    fontWeight: "600",
                                    lineHeight: "28px"
                                }}>
                                    Data not matched yet!
                                </Typography>
                                <Image src='/no-data.svg' alt='No Data' height={250} width={300} />
                                <Typography variant="body1" color="textSecondary"
                                    sx={{
                                        mt: 3,
                                        fontFamily: "Nunito",
                                        fontSize: "14px",
                                        color: "#808080",
                                        fontWeight: "600",
                                        lineHeight: "20px"
                                    }}>
                                    Please check back later.
                                </Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={1} sx={{ flex: 1 }}>
                                <Grid item xs={12}>
                                    <TableContainer
                                        component={Paper}
                                        sx={{
                                            border: '1px solid rgba(235, 235, 235, 1)',
                                            maxHeight: selectedFilters.length < 0 ? '70vh' : '67vh',
                                            overflowY: 'auto'
                                        }}
                                    >
                                        <Table stickyHeader aria-label="leads table">
                                            <TableHead>
                                                <TableRow>
                                                    {[
                                                        { key: 'name', label: 'Name' },
                                                        { key: 'business_email', label: 'Email' },
                                                        { key: 'mobile_phone', label: 'Phone number' },
                                                        { key: 'first_visited_date', label: 'Visited date', sortable: true },
                                                        { key: 'behavior_type', label: 'Visitor Type' },
                                                        { key: 'time_spent', label: 'Time on site' },
                                                    ].map(({ key, label, sortable = true }) => (
                                                        <TableCell
                                                            key={key}
                                                            sx={{
                                                                ...leadsStyles.table_column,
                                                                ...(key === 'name' && {
                                                                    position: 'sticky', // Make the Name column sticky
                                                                    left: 0, // Stick it to the left
                                                                    zIndex: 99
                                                                }),
                                                                ...(key === 'time_spent' && {
                                                                    '::after': {
                                                                        content: 'none'
                                                                    }
                                                                })
                                                            }}
                                                            onClick={sortable ? () => handleSortRequest(key) : undefined}
                                                            style={{ cursor: sortable ? 'pointer' : 'default' }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <Typography variant="body2" sx={{ ...leadsStyles.table_column, borderRight: '0' }}>{label}</Typography>
                                                                {sortable && orderBy === key && (
                                                                    <IconButton size="small" sx={{ ml: 1 }}>
                                                                        {order === 'asc' ? (
                                                                            <ArrowUpwardIcon
                                                                                fontSize="inherit" />
                                                                        ) : (
                                                                            <ArrowDownwardIcon
                                                                                fontSize="inherit" />
                                                                        )}
                                                                    </IconButton>
                                                                )}
                                                            </Box>
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.map((row) => (
                                                    <TableRow
                                                        key={row.id}
                                                        selected={selectedRows.has(row.id)}
                                                        onClick={() => handleSelectRow(row.id)}
                                                        sx={{
                                                            backgroundColor: selectedRows.has(row.id) ? 'rgba(235, 243, 254, 1)' : '#fff',
                                                            '&:hover': {
                                                                backgroundColor: 'rgba(235, 243, 254, 1)',
                                                                '& .sticky-cell': {
                                                                    backgroundColor: 'rgba(235, 243, 254, 1)',
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <TableCell className="sticky-cell"
                                                            sx={{
                                                                ...leadsStyles.table_array, cursor: 'pointer', position: 'sticky', left: '0', zIndex: 9, color: 'rgba(80, 82, 178, 1)', backgroundColor: '#fff'

                                                            }} onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenPopup(row);

                                                            }}>{row.first_name} {row.last_name}</TableCell>
                                                        <TableCell
                                                            sx={{ ...leadsStyles.table_array, position: 'relative' }}>{row.business_email || 'N/A'}</TableCell>
                                                        <TableCell
                                                            sx={leadsStyles.table_array_phone}>{row.mobile_phone || 'N/A'}</TableCell>
                                                        <TableCell
                                                            sx={{ ...leadsStyles.table_array, position: 'relative' }}>{row.first_visited_date || 'N/A'}</TableCell>
                                                        <TableCell
                                                            sx={{ ...leadsStyles.table_column, position: 'relative' }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '2px',
                                                                    fontFamily: 'Nunito',
                                                                    fontSize: '12px',
                                                                    fontWeight: '700',
                                                                    lineHeight: 'normal',
                                                                    backgroundColor: getStatusStyle(row.behavior_type).background,
                                                                    color: getStatusStyle(row.behavior_type).color,
                                                                    justifyContent: 'center',
                                                                    minWidth: '130px',
                                                                    textTransform: 'capitalize'
                                                                }}
                                                            >
                                                                {row.behavior_type || 'N/A'}
                                                            </Box>
                                                        </TableCell>

                                                        <TableCell
                                                            sx={leadsStyles.table_array}>{row.time_spent || 'N/A'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    <CustomTablePagination
                                        count={count_leads ?? 0}
                                        page={page}
                                        rowsPerPage={rowsPerPage}
                                        onPageChange={handleChangePage}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                    />
                                </Grid>
                            </Grid>
                        )}
                        {showSlider && <Slider />}
                    </Box>
                    <PopupDetails open={openPopup}
                        onClose={handleClosePopup}
                        rowData={popupData} />
                    <FilterPopup open={filterPopupOpen} onClose={handleFilterPopupClose} onApply={handleApplyFilters} />
                    <AudiencePopup open={audiencePopupOpen} onClose={handleAudiencePopupClose}
                        selectedLeads={Array.from(selectedRows)} />
                    <CalendarPopup
                        anchorEl={calendarAnchorEl}
                        open={isCalendarOpen}
                        onClose={handleCalendarClose}
                        onDateChange={handleDateChange}
                        onApply={handleApply}
                    />
                </Box>
            </Box>
        </>
    );
};

const LeadsPage: React.FC = () => {
    return (
        <Suspense fallback={<CustomizedProgressBar />}>
            <SliderProvider>
                <Leads />
            </SliderProvider>
        </Suspense>
    );
};

export default LeadsPage;
