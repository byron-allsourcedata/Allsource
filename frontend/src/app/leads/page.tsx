"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { Box, Grid, Typography, Button, Menu, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, IconButton, Chip } from '@mui/material';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';
import { leadsStyles } from './leadsStyles';
import Slider from '../../components/Slider';
import { SliderProvider } from '../../context/SliderContext';
import PersonIcon from '@mui/icons-material/Person';
import TrialStatus from '@/components/TrialLabel';
import AccountButton from '@/components/AccountButton';
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


const Sidebar = dynamic(() => import('../../components/Sidebar'), {
    suspense: true,
});


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
    const { full_name, email } = useUser();
    const [data, setData] = useState<any[]>([]);
    const [count_leads, setCount] = useState<number | null>(null);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [appliedDates, setAppliedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [maxPage, setMaxPage] = useState<number>(0);
    const [status, setStatus] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showSlider, setShowSlider] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const open = Boolean(anchorEl);
    const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
    const dropdownOpen = Boolean(dropdownEl);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [activeFilter, setActiveFilter] = useState<string>('all');
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

    const handleOpenPopup = (row: any) => {
        setPopupData(row);
        setOpenPopup(true);
    };

    const handleClosePopup = () => {
        setOpenPopup(false);
    };


    interface FilterParams {
        dateRange: {
            fromDate: number | null;
            toDate: number | null;
        };
        selectedStatus: string[];
        regions: string[];
        emails: string[];
        selectedFunnels: string[];
        searchQuery: string | null;
    }
    const [filterParams, setFilterParams] = useState<FilterParams>({
        dateRange: { fromDate: null, toDate: null },
        selectedStatus: [],
        regions: [],
        emails: [],
        selectedFunnels: [],
        searchQuery: '',
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


    const handleSignOut = () => {
        localStorage.clear();
        sessionStorage.clear();
        router.push('/signin');
    };

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);
        setSelectedFilters([]);
        setPage(0);
    };

    const installPixel = () => {
        router.push('/dashboard');
    };

    const handleProfileMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    const handleSettingsClick = () => {
        handleProfileMenuClose();
        router.push('/settings');
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


    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const newSelecteds = data.map((row) => row.lead.id);
            setSelectedRows(new Set(newSelecteds));
            return;
        }
        setSelectedRows(new Set());
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
                start: filterParams.dateRange.fromDate ? dayjs.unix(filterParams.dateRange.fromDate).toDate() : null,
                end: filterParams.dateRange.toDate ? dayjs.unix(filterParams.dateRange.toDate).toDate() : null,
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

            let url = `/leads?page=${page + 1}&per_page=${rowsPerPage}&status=${activeFilter}`;
            if (startEpoch !== null && endEpoch !== null) {
                url += `&from_date=${startEpoch}&to_date=${endEpoch}`;
            }
            if (sortBy) {
                url += `&sort_by=${sortBy}&sort_order=${sortOrder}`;
            }

            // Include other filter parameters if necessary
            // Processing "Regions"
            if (selectedFilters.some(filter => filter.label === 'Regions')) {
                const regions = selectedFilters.find(filter => filter.label === 'Regions')?.value.split(', ') || [];
                if (regions.length > 0) {
                    url += `&regions=${encodeURIComponent(regions.join(','))}`;
                }
            }

            // Processing "Emails"
            if (selectedFilters.some(filter => filter.label === 'Emails')) {
                const emails = selectedFilters.find(filter => filter.label === 'Emails')?.value.split(', ') || [];
                if (emails.length > 0) {
                    url += `&emails=${encodeURIComponent(emails.join(','))}`;
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

            // Processing "Funnels"
            if (selectedFilters.some(filter => filter.label === 'Funnels')) {
                const funnels = selectedFilters.find(filter => filter.label === 'Funnels')?.value.split(', ') || [];
                if (funnels.length > 0) {
                    url += `&lead_funnel=${encodeURIComponent(funnels.join(','))}`;
                }
            }

            // Search string processing
            if (selectedFilters.some(filter => filter.label === 'Search')) {
                const searchQuery = selectedFilters.find(filter => filter.label === 'Search')?.value || '';
                if (searchQuery) {
                    url += `&search_query=${encodeURIComponent(searchQuery)}`;
                }
            }

            const response = await axiosInstance.get(url);
            const [leads, count, max_page] = response.data;

            setData(Array.isArray(leads) ? leads : []);
            setCount(count || 0);
            setMaxPage(max_page || 0);
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

        if (filters.dateRange.fromDate) {
            newSelectedFilters.push({ label: 'From Date', value: dayjs.unix(filters.dateRange.fromDate).format('YYYY-MM-DD') });
        }
        if (filters.dateRange.toDate) {
            newSelectedFilters.push({ label: 'To Date', value: dayjs.unix(filters.dateRange.toDate).format('YYYY-MM-DD') });
        }
        if (filters.selectedStatus && filters.selectedStatus.length > 0) {
            newSelectedFilters.push({ label: 'Status', value: filters.selectedStatus.join(', ') });
        }
        if (filters.regions && filters.regions.length > 0) {
            newSelectedFilters.push({ label: 'Regions', value: filters.regions.join(', ') });
        }
        if (filters.emails && filters.emails.length > 0) {
            newSelectedFilters.push({ label: 'Emails', value: filters.emails.join(', ') });
        }
        if (filters.selectedFunnels && filters.selectedFunnels.length > 0) {
            newSelectedFilters.push({ label: 'Funnels', value: filters.selectedFunnels.join(', ') });
        }
        if (filters.searchQuery && filters.searchQuery.trim() !== '') {
            newSelectedFilters.push({ label: 'Search', value: filters.searchQuery });
        }

        setSelectedFilters(newSelectedFilters);
        setActiveFilter(filters.selectedStatus?.length > 0 ? filters.selectedStatus[0] : 'all');
        setFilterParams(filters);
    };


    const handleResetFilters = async () => {
        const url = `/leads`;

        try {
            const response = await axiosInstance.get(url);
            const [leads, count, max_page] = response.data;

            setData(Array.isArray(leads) ? leads : []);
            setCount(count || 0);
            setMaxPage(max_page || 0);
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
            setFormattedDates('')
        }

        const newFilters = {
            dateRange: {
                fromDate: updatedFilters.find(f => f.label === 'From Date') ? Number(updatedFilters.find(f => f.label === 'From Date')!.value) : null,
                toDate: updatedFilters.find(f => f.label === 'To Date') ? Number(updatedFilters.find(f => f.label === 'To Date')!.value) : null
            },
            selectedStatus: updatedFilters.find(f => f.label === 'Status') ? updatedFilters.find(f => f.label === 'Status')!.value.split(', ') : [],
            regions: updatedFilters.find(f => f.label === 'Regions') ? updatedFilters.find(f => f.label === 'Regions')!.value.split(', ') : [],
            emails: updatedFilters.find(f => f.label === 'Emails') ? updatedFilters.find(f => f.label === 'Emails')!.value.split(', ') : [],
            selectedFunnels: updatedFilters.find(f => f.label === 'Funnels') ? updatedFilters.find(f => f.label === 'Funnels')!.value.split(', ') : [],
            searchQuery: updatedFilters.find(f => f.label === 'Search') ? updatedFilters.find(f => f.label === 'Search')!.value : '',
        };

        handleApplyFilters(newFilters);
    };

    useEffect(() => {
        // Вызов fetchData после обновления appliedDates
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
        return <div>Loading...</div>;
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
        width: '90%',
        textAlign: 'center',
        flex: 1,
    };

    const getStatusStyle = (funnel: any) => {
        switch (funnel) {
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
                start: filterParams.dateRange.fromDate ? dayjs.unix(filterParams.dateRange.fromDate).toDate() : null,
                end: filterParams.dateRange.toDate ? dayjs.unix(filterParams.dateRange.toDate).toDate() : null,
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
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Box sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1100,
                    backgroundColor: 'white',
                    borderBottom: '1px solid rgba(235, 235, 235, 1)'
                }}>
                    <Box sx={leadsStyles.headers}>
                        <Box sx={leadsStyles.logoContainer}>
                            <Image src='/logo.svg' alt='logo' height={80} width={60} />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TrialStatus />
                            <AccountButton />
                            <Button
                                aria-controls={open ? 'profile-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={open ? 'true' : undefined}
                                onClick={handleProfileMenuClick}
                            >
                                <PersonIcon sx={leadsStyles.account} />
                            </Button>
                            <Menu
                                id="profile-menu"
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleProfileMenuClose}
                                MenuListProps={{
                                    'aria-labelledby': 'profile-menu-button',
                                }}
                            >
                                <Box sx={{ p: 2 }}>
                                    <Typography variant="h6">{full_name}</Typography>
                                    <Typography variant="body2" color="textSecondary">{email}</Typography>
                                </Box>
                                <MenuItem onClick={handleSettingsClick}>Settings</MenuItem>
                                <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                            </Menu>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ flex: 1, marginTop: '90px', display: 'flex', flexDirection: 'column' }}>
                    <Grid container sx={{ flex: 1 }}>
                        <Grid item xs={12} md={2} sx={{ padding: '0px', position: 'relative' }}>
                            <Sidebar />
                        </Grid>
                        <Grid item xs={12} md={10} sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mt: 1, }}>
                                    <Typography variant="h4" component="h1" sx={leadsStyles.title}>
                                        Leads ({count_leads})
                                    </Typography>
                                    <Button
                                        onClick={() => handleFilterChange('all')}
                                        sx={{
                                            color: activeFilter === 'all' ? 'rgba(80, 82, 178, 1)' : 'rgba(89, 89, 89, 1)',
                                            borderBottom: activeFilter === 'all' ? '2px solid rgba(80, 82, 178, 1)' : '0px solid transparent',
                                            textTransform: 'none',
                                            mr: '1em',
                                            mt: '1em',
                                            pb: '1.5em',
                                            maxHeight: '3em',
                                            borderRadius: '0px'
                                        }}
                                    >
                                        <Typography variant="body2" sx={leadsStyles.subtitle}>All</Typography>
                                    </Button>
                                    <Button
                                        onClick={() => handleFilterChange('new_customers')}
                                        sx={{
                                            mt: '1em',
                                            color: activeFilter === 'new_customers' ? 'rgba(80, 82, 178, 1)' : 'rgba(89, 89, 89, 1)',
                                            borderBottom: activeFilter === 'new_customers' ? '2px solid rgba(80, 82, 178, 1)' : '0px solid transparent',
                                            textTransform: 'none',
                                            mr: '1em',
                                            pb: '1.5em',
                                            maxHeight: '3em',
                                            borderRadius: '0px'
                                        }}
                                    >
                                        <Typography variant="body2" sx={leadsStyles.subtitle}>New Customers</Typography>
                                    </Button>
                                    <Button
                                        onClick={() => handleFilterChange('existing_customers')}
                                        sx={{
                                            maxHeight: '3em',
                                            color: activeFilter === 'existing_customers' ? 'rgba(80, 82, 178, 1)' : 'rgba(89, 89, 89, 1)',
                                            borderBottom: activeFilter === 'existing_customers' ? '2px solid rgba(80, 82, 178, 1)' : '0px solid transparent',
                                            textTransform: 'none',
                                            mr: '1em',
                                            mt: '1em',
                                            pb: '1.5em',
                                            borderRadius: '0px'
                                        }}
                                    >
                                        <Typography variant="body2" sx={leadsStyles.subtitle}>Existing
                                            Customers</Typography>
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mt: 1, }}>
                                    <Button
                                        onClick={handleAudiencePopupOpen}
                                        aria-haspopup="true"
                                        sx={{
                                            marginRight: '1.5em',
                                            textTransform: 'none',
                                            color: selectedRows.size === 0 ? 'rgba(128, 128, 128, 1)' : 'rgba(80, 82, 178, 1)',
                                            border: '1px solid rgba(80, 82, 178, 1)',
                                            borderRadius: '4px',
                                            padding: '10px',
                                            mt: 1.25,
                                            opacity: selectedRows.size === 0 ? 0.4 : 1,
                                        }}
                                        disabled={selectedRows.size === 0}
                                    >
                                        <Typography sx={{
                                            marginRight: '0.5em',
                                            fontFamily: 'Nunito',
                                            lineHeight: '19.1px',
                                            textSize: '16px',
                                            textAlign: 'left',
                                        }}>
                                            Build Audience List
                                        </Typography>
                                    </Button>
                                    <Button
                                        aria-controls={dropdownOpen ? 'account-dropdown' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={dropdownOpen ? 'true' : undefined}
                                        sx={{
                                            marginRight: '1.5em',
                                            textTransform: 'none',
                                            color: 'rgba(128, 128, 128, 1)',
                                            border: '1px solid rgba(184, 184, 184, 1)',
                                            borderRadius: '4px',
                                            padding: '0.5em',
                                            mt: 1.25
                                        }}
                                        onClick={handleDownload}
                                        disabled={selectedRows.size === 0}
                                    >
                                        <DownloadIcon fontSize='medium' />
                                    </Button>
                                    <Button
                                        onClick={handleFilterPopupOpen}
                                        aria-controls={dropdownOpen ? 'account-dropdown' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={dropdownOpen ? 'true' : undefined}
                                        sx={{
                                            marginRight: '1.5em',
                                            textTransform: 'none',
                                            color: 'rgba(128, 128, 128, 1)',
                                            border: '1px solid rgba(184, 184, 184, 1)',
                                            borderRadius: '4px',
                                            padding: '0.5em',
                                            mt: 1.25
                                        }}
                                    >
                                        <FilterListIcon fontSize='medium' />
                                    </Button>
                                    <Button
                                        aria-controls={isCalendarOpen ? 'calendar-popup' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={isCalendarOpen ? 'true' : undefined}
                                        onClick={handleCalendarClick}
                                        sx={{
                                            marginRight: '1.5em',
                                            textTransform: 'none',
                                            color: 'rgba(128, 128, 128, 1)',
                                            border: '1px solid rgba(184, 184, 184, 1)',
                                            borderRadius: '4px',
                                            padding: '0.5em',
                                            mt: 1.25
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
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 2 }}>
                                {selectedFilters.map(filter => (
                                    <Chip
                                        key={filter.label}
                                        label={`${filter.value}`}
                                        onDelete={() => handleDeleteFilter(filter)}
                                        sx={{ borderRadius: '3px', border: '1px solid rgba(80, 82, 178, 1)', backgroundColor: 'rgba(237, 237, 247, 1)', color: 'rgba(123, 123, 123, 1)', fontFamily: 'Nunito', fontWeight: '600', fontSize: '13px' }}
                                    />
                                ))}
                                {selectedFilters.length > 0 && (
                                    <Chip
                                        label="Clear all"
                                        onDelete={handleResetFilters}
                                        sx={{ backgroundColor: 'rgba(255, 255, 255, 1)', color: 'rgba(80, 82, 178, 1)', border: '1px solid rgba(220, 220, 239, 1)', borderRadius: '3px', fontFamily: 'Nunito', fontWeight: '600', fontSize: '12px' }}
                                    />
                                )}
                            </Box>
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 2 }}>
                                {status === 'PIXEL_INSTALLATION_NEEDED' ? (
                                    <Box sx={centerContainerStyles}>
                                        <Typography variant="h5" sx={{ mb: 2 }}>
                                            Pixel Integration isn&apos;t completed yet!
                                        </Typography>
                                        <Image src='/pixel_installation_needed.svg' alt='Need Pixel Install'
                                            height={250} width={300} />
                                        <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
                                            Install the pixel to complete the setup.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            onClick={installPixel}
                                            sx={{
                                                backgroundColor: 'rgba(80, 82, 178, 1)',
                                                fontFamily: "Nunito",
                                                textTransform: 'none',
                                                padding: '1em 3em',
                                                fontSize: '16px',
                                                mt: 3
                                            }}
                                        >
                                            Setup Pixel
                                        </Button>
                                    </Box>
                                ) : data.length === 0 ? (
                                    <Box sx={centerContainerStyles}>
                                        <Typography variant="h5" sx={{ mb: 6 }}>
                                            Data not matched yet!
                                        </Typography>
                                        <Image src='/no-data.svg' alt='No Data' height={250} width={300} />
                                        <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
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
                                                    maxHeight: '80vh',
                                                    overflowY: 'auto'
                                                }}
                                            >
                                                <Table sx={{ minWidth: 850 }} aria-label="leads table">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell
                                                                padding="checkbox"
                                                                sx={{ borderRight: '1px solid rgba(235, 235, 235, 1)' }}
                                                            >
                                                                <Checkbox
                                                                    indeterminate={selectedRows.size > 0 && selectedRows.size < data.length}
                                                                    checked={data.length > 0 && selectedRows.size === data.length}
                                                                    onChange={handleSelectAllClick}
                                                                    color="primary"
                                                                />
                                                            </TableCell>
                                                            {[
                                                                { key: 'name', label: 'Name' },
                                                                { key: 'business_email', label: 'Email' },
                                                                { key: 'mobile_phone', label: 'Phone number' },
                                                                { key: 'last_visited_date', label: 'Visited date' },
                                                                {
                                                                    key: 'last_visited_time',
                                                                    label: 'Visited time',
                                                                    sortable: false
                                                                },
                                                                { key: 'funnel', label: 'Lead Funnel' },
                                                                { key: 'status', label: 'Status' },
                                                                { key: 'time_spent', label: 'Time Spent' },
                                                                { key: 'no_of_visits', label: 'No of Visits' },
                                                                { key: 'no_of_page_visits', label: 'No of Page Visits' },
                                                                { key: 'age', label: 'Age' },
                                                                { key: 'gender', label: 'Gender' },
                                                                { key: 'state', label: 'State' },
                                                                { key: 'city', label: 'City' },
                                                            ].map(({ key, label, sortable = true }) => (
                                                                <TableCell
                                                                    key={key}
                                                                    sx={leadsStyles.table_column}
                                                                    onClick={sortable ? () => handleSortRequest(key) : undefined}
                                                                    style={{ cursor: sortable ? 'pointer' : 'default' }}
                                                                >
                                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                        <Typography variant="body2">{label}</Typography>
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
                                                                key={row.lead.id}
                                                                selected={selectedRows.has(row.lead.id)}
                                                                onClick={() => handleSelectRow(row.lead.id)}
                                                                sx={{
                                                                    backgroundColor: selectedRows.has(row.lead.id) ? 'rgba(235, 243, 254, 1)' : 'inherit',
                                                                }}
                                                            >
                                                                <TableCell padding="checkbox"
                                                                    sx={{ borderRight: '1px solid rgba(235, 235, 235, 1)' }}>
                                                                    <div
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSelectRow(row.lead.id);
                                                                        }}
                                                                    >
                                                                        <Checkbox
                                                                            checked={selectedRows.has(row.lead.id)}
                                                                            color="primary"
                                                                        />
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell
                                                                    sx={{ ...leadsStyles.table_array, cursor: 'pointer' }} onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenPopup(row);

                                                                    }}>{row.lead.first_name} {row.lead.last_name}</TableCell>
                                                                <TableCell
                                                                    sx={leadsStyles.table_array}>{row.lead.business_email || 'N/A'}</TableCell>
                                                                <TableCell
                                                                    sx={leadsStyles.table_array_phone}>{row.lead.mobile_phone || 'N/A'}</TableCell>
                                                                <TableCell
                                                                    sx={leadsStyles.table_array}>{row.last_visited_date || 'N/A'}</TableCell>
                                                                <TableCell
                                                                    sx={leadsStyles.table_array}>{row.last_visited_time || 'N/A'}</TableCell>
                                                                <TableCell
                                                                    sx={leadsStyles.table_column}
                                                                >
                                                                    <Box
                                                                        sx={{
                                                                            display: 'flex',
                                                                            padding: '4px 8px',
                                                                            borderRadius: '4px',
                                                                            fontFamily: 'Nunito',
                                                                            fontSize: '14px',
                                                                            fontWeight: '400',
                                                                            lineHeight: '19.6px',
                                                                            backgroundColor: getStatusStyle(row.funnel).background,
                                                                            color: getStatusStyle(row.funnel).color,
                                                                            justifyContent: 'center',
                                                                        }}
                                                                    >
                                                                        {row.funnel || 'N/A'}
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell
                                                                    sx={leadsStyles.table_array}>
                                                                        <Box
                                                                        sx={{
                                                                            display: 'flex',
                                                                            padding: '4px 8px',
                                                                            borderRadius: '4px',
                                                                            fontFamily: 'Nunito',
                                                                            fontSize: '14px',
                                                                            fontWeight: '400',
                                                                            lineHeight: '19.6px',
                                                                            backgroundColor: getStatusStyle(row.status).background,
                                                                            color: getStatusStyle(row.status).color,
                                                                            justifyContent: 'center',
                                                                        }}
                                                                    >
                                                                        {row.status || 'N/A'}
                                                                    </Box>
                                                                    </TableCell>
                                                                <TableCell
                                                                    sx={leadsStyles.table_array}>{row.lead.time_spent || 'N/A'}</TableCell>
                                                                <TableCell
                                                                    sx={leadsStyles.table_array}>{row.lead.no_of_visits || 'N/A'}</TableCell>
                                                                <TableCell
                                                                    sx={leadsStyles.table_array}>{row.lead.no_of_page_visits || 'N/A'}</TableCell>
                                                                <TableCell sx={leadsStyles.table_array}>
                                                                    {row.lead.age_min && row.lead.age_max ? `${row.lead.age_min} - ${row.lead.age_max}` : 'N/A'}
                                                                </TableCell>
                                                                <TableCell
                                                                    sx={leadsStyles.table_array}>{row.lead.gender || 'N/A'}</TableCell>
                                                                <TableCell
                                                                    sx={leadsStyles.table_array}>{row.state || 'N/A'}</TableCell>
                                                                <TableCell
                                                                    sx={leadsStyles.table_array}>{row.city || 'N/A'}</TableCell>
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
                        </Grid>
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
                    </Grid>
                </Box>
            </Box>
        </>
    );
};

const LeadsPage: React.FC = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SliderProvider>
                <Leads />
            </SliderProvider>
        </Suspense>
    );
};

export default LeadsPage;
