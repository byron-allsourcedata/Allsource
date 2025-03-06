"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { Box, Grid, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Drawer, Popover } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axiosInstance from '../../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';
import { sourcesStyles } from './sourcesStyles';
import Slider from '../../../components/Slider';
import { SliderProvider } from '../../../context/SliderContext';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import DateRangeIcon from '@mui/icons-material/DateRange';
import FilterListIcon from '@mui/icons-material/FilterList';
// import FilterPopup from './CompanyFilters';
import AudiencePopup from '@/components/AudienceSlider';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SouthOutlinedIcon from '@mui/icons-material/SouthOutlined';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import NorthOutlinedIcon from '@mui/icons-material/NorthOutlined';
import dayjs from 'dayjs';
// import PopupDetails from './CompanyDetails';
import CloseIcon from '@mui/icons-material/Close';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import Tooltip from '@mui/material/Tooltip';
import CustomToolTip from '@/components/customToolTip';
import CalendarPopup from '@/components/CustomCalendar';
import CustomTablePagination from '@/components/CustomTablePagination';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNotification } from '@/context/NotificationContext';
import { showErrorToast } from '@/components/ToastNotification';
import SourcesTable from "./components/SourcesTable"
import SourcesImport from './SourcesImport';
import SourcesList from './components/SourcesList';


interface Source {
    id: string
    name: string
    source_origin: string
    source_type: string
    created_at: Date
    updated_at: Date
    created_by: string
    total_records?: number
    matched_records?: number
}

interface FilterParams {
    from_date: number | null;
    to_date: number | null;
    regions: string[];
    searchQuery: string | null;
    selectedPageVisit: string | null;
    checkedFiltersNumberOfEmployees: {
        '1-10': boolean,
        '11-25': boolean,
        '26-50': boolean,
        '51-100': boolean,
        '101-250': boolean,
        '251-500': boolean,
        '501-1000': boolean,
        '1001-5000': boolean,
        '2001-5000': boolean,
        '5001-10000': boolean,
        '10001+': boolean,
        "unknown": boolean,
    };
    checkedFiltersRevenue: {
    "Below 10k": boolean,
    "$10k - $50k": boolean,
    "$50k - $100k": boolean,
    "$100k - $500k": boolean,
    "$500k - $1M": boolean,
    "$1M - $5M": boolean,
    "$5M - $10M": boolean,
    "$10M - $50M": boolean,
    "$50M - $100M": boolean,
    "$100M - $500M": boolean,
    "$500M - $1B": boolean,
    "$1 Billion +": boolean,
    "unknown": boolean,
    }
    checkedFilters: {
        lastWeek: boolean;
        last30Days: boolean;
        last6Months: boolean;
        allTime: boolean;
    };
    industry: Record<string, boolean>; 
}


const Sources: React.FC = () => {
    const router = useRouter();
    const { hasNotification } = useNotification();
    const [data, setData] = useState<Source[]>([]);
    const [sources, setSources] = useState<boolean>(true);
    const [newSource, setNewSource] = useState<boolean>(false);
    const [count_companies, setCount] = useState<number | null>(null);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [status, setStatus] = useState<string | null>(null);
    const [showSlider, setShowSlider] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
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
    const [companyName, setCompanyName] = useState<string>('');
    const [companyId, setCompanyId] = useState<number>(0);
    const [filterPopupOpen, setFilterPopupOpen] = useState(false);
    const [audiencePopupOpen, setAudiencePopupOpen] = useState(false);
    const [companyEmployeesOpen, setCompanyEmployeesOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState<{ label: string, value: string }[]>([]);
    const [openPopup, setOpenPopup] = React.useState(false);
    const [popupData, setPopupData] = React.useState<any>(null);
    const [rowsPerPageOptions, setRowsPerPageOptions] = useState<number[]>([]);
    const [openDrawer, setOpenDrawer] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [createdSource, setCreatedSource] = useState<Source | null >(null);

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


    const handleFilterPopupOpen = () => {
        setFilterPopupOpen(true);
    };

    const handleFilterPopupClose = () => {
        setFilterPopupOpen(false);
    };

    const handleSortRequest = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<{ value: unknown }>) => {
        setRowsPerPage(parseInt(event.target.value as string, 10));
        setPage(0);
    };

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

    const handleDownload = async () => {
        setLoading(true);
        try {

            let url = '/company/download-companies';
            let params = [];

            if (selectedFilters.some(filter => filter.label === 'Visitor Type')) {
                const status = selectedFilters.find(filter => filter.label === 'Visitor Type')?.value?.split(', ') || [];
                if (status.length > 0) {
                    const formattedStatus = status.map(status => status.toLowerCase().replace(/\s+/g, '_'));
                    params.push(`behavior_type=${encodeURIComponent(formattedStatus.join(','))}`);
                }
            }

            if (selectedFilters.some(filter => filter.label === 'Regions')) {
                const regions = selectedFilters.find(filter => filter.label === 'Regions')?.value?.split(', ') || [];
                if (regions.length > 0) {
                    params.push(`regions=${encodeURIComponent(regions.join(','))}`);
                }
            }

            if (selectedFilters.some(filter => filter.label === 'From Date')) {
                const fromDate = selectedFilters.find(filter => filter.label === 'From Date')?.value || '';
                if (fromDate) {
                    const fromDateEpoch = Math.floor(new Date(fromDate).getTime() / 1000);
                    params.push(`from_date=${fromDateEpoch}`);
                }
            }

            if (selectedFilters.some(filter => filter.label === 'To Date')) {
                const toDate = selectedFilters.find(filter => filter.label === 'To Date')?.value || '';
                if (toDate) {
                    const toDateEpoch = Math.floor(new Date(toDate).getTime() / 1000);
                    params.push(`to_date=${toDateEpoch}`);
                }
            }

            if (selectedFilters.some(filter => filter.label === 'Lead Status')) {
                const funnels = selectedFilters.find(filter => filter.label === 'Lead Status')?.value?.split(', ') || [];
                if (funnels.length > 0) {
                    const formattedFunnels = funnels.map(funnel => funnel.toLowerCase().replace(/\s+/g, '_'));
                    params.push(`status=${encodeURIComponent(formattedFunnels.join(','))}`);
                }
            }

            if (selectedFilters.some(filter => filter.label === 'Search')) {
                const searchQuery = selectedFilters.find(filter => filter.label === 'Search')?.value || '';
                if (searchQuery) {
                    params.push(`search_query=${encodeURIComponent(searchQuery)}`);
                }
            }

            if (selectedFilters.some(filter => filter.label === 'From Time')) {
                const fromTime = selectedFilters.find(filter => filter.label === 'From Time')?.value || '';
                if (fromTime) {
                    params.push(`from_time=${encodeURIComponent(fromTime)}`);
                }
            }

            if (selectedFilters.some(filter => filter.label === 'To Time')) {
                const toTime = selectedFilters.find(filter => filter.label === 'To Time')?.value || '';
                if (toTime) {
                    params.push(`to_time=${encodeURIComponent(toTime)}`);
                }
            }

            if (selectedFilters.some(filter => filter.label === 'Time Spent')) {
                const timeSpent = selectedFilters.find(filter => filter.label === 'Time Spent')?.value?.split(', ') || [];
                if (timeSpent.length > 0) {
                    const formattedTimeSpent = timeSpent.map(value => value.replace(/\s+/g, '_'));
                    params.push(`average_time_sec=${encodeURIComponent(formattedTimeSpent.join(','))}`);
                }
            }

            if (selectedFilters.some(filter => filter.label === 'Recurring Visits')) {
                const recurringVisits = selectedFilters.find(filter => filter.label === 'Recurring Visits')?.value?.split(', ') || [];
                if (recurringVisits.length > 0) {
                    const formattedRecurringVisits = recurringVisits.map(value => value.replace(/\s+/g, '_'));
                    params.push(`recurring_visits=${encodeURIComponent(formattedRecurringVisits.join(','))}`);
                }
            }

            if (selectedFilters.some(filter => filter.label === 'Page Visits')) {
                const pageVisits = selectedFilters.find(filter => filter.label === 'Page Visits')?.value?.split(', ') || [];
                if (pageVisits.length > 0) {
                    const formattedPageVisits = pageVisits.map(value => value.replace(/\s+/g, '_'));
                    params.push(`page_visits=${encodeURIComponent(formattedPageVisits.join(','))}`);
                }
            }

            // Join all parameters into a single query string
            if (params.length > 0) {
                url += `?${params.join('&')}`;
            }

            const response = await axiosInstance.get(url, { responseType: 'blob' });

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
    };

    const truncateText = (text: string, maxLength: number) => {
        return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
    };



    const handleApplyFilters = (filters: FilterParams) => {
        const newSelectedFilters: { label: string; value: string }[] = [];

        const dateFormat = 'YYYY-MM-DD';

        const getSelectedValues = (obj: Record<string, boolean>): string => {
            return Object.entries(obj)
                .filter(([_, value]) => value)
                .map(([key]) => key)
                .join(', ');
        };

        // Map of filter conditions to their labels
        const filterMappings: { condition: boolean | string | string[] | number | null, label: string, value: string | ((f: any) => string) }[] = [
            { condition: filters.from_date, label: 'From Date', value: () => dayjs.unix(filters.from_date!).format(dateFormat) },
            { condition: filters.to_date, label: 'To Date', value: () => dayjs.unix(filters.to_date!).format(dateFormat) },
            { condition: filters.regions?.length, label: 'Regions', value: () => filters.regions!.join(', ') },
            { condition: filters.searchQuery?.trim() !== '', label: 'Search', value: filters.searchQuery || '' },
            { condition: filters.selectedPageVisit?.trim() !== '', label: 'Employee Visits', value: filters.selectedPageVisit || '' },
            { 
                condition: filters.checkedFiltersNumberOfEmployees && Object.values(filters.checkedFiltersNumberOfEmployees).some(Boolean), 
                label: 'Number of Employees', 
                value: () => getSelectedValues(filters.checkedFiltersNumberOfEmployees!) 
            },
            { 
                condition: filters.checkedFiltersRevenue && Object.values(filters.checkedFiltersRevenue).some(Boolean), 
                label: 'Revenue', 
                value: () => getSelectedValues(filters.checkedFiltersRevenue!) 
            },
            { 
                condition: filters.industry && Object.values(filters.industry).some(Boolean), 
                label: 'Industry', 
                value: () => getSelectedValues(filters.industry!) 
            },
        ];


        filterMappings.forEach(({ condition, label, value }) => {
            if (condition) {
                newSelectedFilters.push({ label, value: typeof value === 'function' ? value(filters) : value });
            }
        });

        setSelectedFilters(newSelectedFilters);
    };

    const capitalizeCity = (city: string) => {
        return city
            ?.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    const handleResetFilters = async () => {
        const url = `/company`;

        try {
            setIsLoading(true)
            setFormattedDates('')
            sessionStorage.removeItem('filters')
            const response = await axiosInstance.get(url);
            const [leads, count] = response.data;

            setData(Array.isArray(leads) ? leads : []);
            setCount(count || 0);
            setStatus(response.data.status);
            setSelectedDates({start: null, end: null})
            setSelectedFilters([]);
        } catch (error) {
            console.error('Error fetching leads:', error);
        }
        finally {
            setIsLoading(false)
        }
    };

    const handleDeleteFilter = (filterToDelete: { label: string; value: string }) => {
        const updatedFilters = selectedFilters.filter(filter => filter.label !== filterToDelete.label);
        setSelectedFilters(updatedFilters);
        
        const filters = JSON.parse(sessionStorage.getItem('filters') || '{}');
    
        switch (filterToDelete.label) {
            case 'From Date':
                filters.from_date = null;
                setSelectedDates({ start: null, end: null });
                break;
            case 'To Date':
                filters.to_date = null;
                setSelectedDates({ start: null, end: null });
                break;
            case 'Regions':
                filters.regions = [];
                break;
            case 'Search':
                filters.searchQuery = '';
                break;
            case 'Employee Visits':
                filters.selectedPageVisit = '';
                break;
            case 'Number of Employees':
                Object.keys(filters.checkedFiltersNumberOfEmployees).forEach(key => {
                    filters.checkedFiltersNumberOfEmployees[key] = false;
                });
                break;
            case 'Revenue':
                Object.keys(filters.checkedFiltersRevenue).forEach(key => {
                    filters.checkedFiltersRevenue[key] = false;
                });
                break;
            case 'Industry':
                Object.keys(filters.industry).forEach(key => {
                    filters.industry[key] = false;
                });
                break;
            default:
                break;
        }
        
        if (!filters.from_date && !filters.to_date) {
            filters.checkedFilters = {
                lastWeek: false,
                last30Days: false,
                last6Months: false,
                allTime: false,
            };
        }
    
        sessionStorage.setItem('filters', JSON.stringify(filters));
    
        if (filterToDelete.label === 'Dates') {
            setFormattedDates('');
            setSelectedDates({ start: null, end: null });
        }
    
        // Обновляем фильтры для применения
        const newFilters: FilterParams = {
            from_date: updatedFilters.find(f => f.label === 'From Date') ? dayjs(updatedFilters.find(f => f.label === 'From Date')!.value).unix() : null,
            to_date: updatedFilters.find(f => f.label === 'To Date') ? dayjs(updatedFilters.find(f => f.label === 'To Date')!.value).unix() : null,
            regions: updatedFilters.find(f => f.label === 'Regions') ? updatedFilters.find(f => f.label === 'Regions')!.value?.split(', ') : [],
            searchQuery: updatedFilters.find(f => f.label === 'Search') ? updatedFilters.find(f => f.label === 'Search')!.value : '',
            selectedPageVisit: updatedFilters.find(f => f.label === 'Employee Visits') ? updatedFilters.find(f => f.label === 'Employee Visits')!.value : '',
            checkedFiltersNumberOfEmployees: {
                ...Object.keys(filters.checkedFiltersNumberOfEmployees).reduce((acc, key) => {
                    acc[key as keyof typeof filters.checkedFiltersNumberOfEmployees] = updatedFilters.some(
                        f => f.label === 'Number of Employees' && f.value.includes(key)
                    );
                    return acc;
                }, {} as Record<keyof typeof filters.checkedFiltersNumberOfEmployees, boolean>),
                '1-10': false,
                '11-25': false,
                '26-50': false,
                '51-100': false,
                '101-250': false,
                '251-500': false,
                '501-1000': false,
                '1001-5000': false,
                '2001-5000': false,
                '5001-10000': false,
                '10001+': false,
                unknown: false
            },
            checkedFiltersRevenue: {
                ...Object.keys(filters.checkedFiltersRevenue).reduce((acc, key) => {
                    acc[key as keyof typeof filters.checkedFiltersRevenue] = updatedFilters.some(
                        f => f.label === 'Revenue' && f.value.includes(key)
                    );
                    return acc;
                }, {} as Record<keyof typeof filters.checkedFiltersRevenue, boolean>),
                'Below 10k': false,
                '$10k - $50k': false,
                '$50k - $100k': false,
                '$100k - $500k': false,
                '$500k - $1M': false,
                '$1M - $5M': false,
                '$5M - $10M': false,
                '$10M - $50M': false,
                '$50M - $100M': false,
                '$100M - $500M': false,
                '$500M - $1B': false,
                '$1 Billion +': false,
                unknown: false
            },
            checkedFilters: {
                lastWeek: updatedFilters.some(f => f.label === 'Date Range' && f.value === 'lastWeek'),
                last30Days: updatedFilters.some(f => f.label === 'Date Range' && f.value === 'last30Days'),
                last6Months: updatedFilters.some(f => f.label === 'Date Range' && f.value === 'last6Months'),
                allTime: updatedFilters.some(f => f.label === 'Date Range' && f.value === 'allTime')
            },
            industry: Object.fromEntries(Object.keys(filters.industry).map(key => [key, updatedFilters.some(f => f.label === 'Industry' && f.value.includes(key))]))
        };
    
        // Применяем обновленные фильтры
        handleApplyFilters(newFilters);
    };


    return (
        <>
            {loading && (
                <CustomizedProgressBar/>
            )}
            <Box sx={{
                display: 'flex', flexDirection: 'column', height: '100%',
                '@media (max-width: 900px)': {
                    minHeight: '100vh'

                }
            }}>
                <Box sx={{ flex: 1, display: 'flex', pr: 2, flexDirection: 'column', }}>
                    {sources && 
                        <Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: hasNotification ? '1rem' : '0.5rem',
                                    flexWrap: 'wrap',
                                    pl: '0.5rem',
                                    gap: '15px',
                                    '@media (max-width: 900px)': {
                                        marginTop: hasNotification ? '3rem' : '1.125rem',
                                    },
                                    '@media (max-width: 600px)': {
                                        marginTop: hasNotification ? '2rem' : '0rem',
                                    },
                                }}>
                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                                    <Typography className='first-sub-title'>
                                        Sources
                                    </Typography>
                                    <CustomToolTip title={'Contacts automatically sync across devices and platforms.'} linkText='Learn more' linkUrl='https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/contacts' />
                                </Box>
                                <Box sx={{
                                    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px', pt: '4px',
                                    '@media (max-width: 900px)': {
                                        gap: '8px'
                                    }
                                }}>
                                    <Button
                                        variant="outlined"
                                        sx={{
                                            height: '40px',
                                            borderRadius: '4px',
                                            textTransform: 'none',
                                            fontSize: '14px',
                                            lineHeight: "19.6px",
                                            fontWeight: '500',
                                            color: '#5052B2',
                                            borderColor: '#5052B2',
                                            '&:hover': {
                                                backgroundColor: 'rgba(80, 82, 178, 0.1)',
                                                borderColor: '#5052B2',
                                            },
                                        }}
                                        onClick={() => {
                                            setSources(false)
                                        }}
                                    >
                                        Import Source
                                    </Button>
                                    <Button
                                        aria-controls={dropdownOpen ? 'account-dropdown' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={dropdownOpen ? 'true' : undefined}
                                        disabled={!status || status === 'PIXEL_INSTALLATION_NEEDED' || data?.length === 0}
                                        sx={{
                                            textTransform: 'none',
                                            color: 'rgba(128, 128, 128, 1)',
                                            opacity: status === 'PIXEL_INSTALLATION_NEEDED' || data?.length === 0 ? '0.5' : '1',
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
                                        onClick={handleDownload}
                                    >
                                        <DownloadIcon fontSize='medium' />
                                    </Button>
                                    <Button
                                        onClick={handleFilterPopupOpen}
                                        disabled={!status || status === 'PIXEL_INSTALLATION_NEEDED' || data?.length === 0}
                                        aria-controls={dropdownOpen ? 'account-dropdown' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={dropdownOpen ? 'true' : undefined}
                                        sx={{
                                            textTransform: 'none',
                                            color: selectedFilters.length > 0 ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)',
                                            border: selectedFilters.length > 0 ? '1px solid rgba(80, 82, 178, 1)' : '1px solid rgba(184, 184, 184, 1)',
                                            borderRadius: '4px',
                                            padding: '8px',
                                            opacity: status === 'PIXEL_INSTALLATION_NEEDED' || data?.length === 0 ? '0.5' : '1',
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
                                        <FilterListIcon fontSize='medium' sx={{ color: selectedFilters.length > 0 ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)' }} />

                                        {selectedFilters.length > 0 && (
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
                                        )}
                                    </Button>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 2, "@media (max-width: 600px)": { mb: 1 } }}>
                                    {/* --- CHIPS --- */}
                            </Box>
                            <Box sx={{
                                flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4.25rem)', overflow: 'auto', maxWidth: '100%',
                                '@media (max-width: 900px)': {
                                    pt: '2px',
                                    pb: '18px'
                                }
                            }}>
                                {newSource && 
                                    <SourcesList createdSource={createdSource}/>}
                                {!newSource &&  
                                    <SourcesTable setStatus={setStatus} status={status} setData={setData} data={data} setSources={setSources}/>}
                                {showSlider && <Slider />}
                            </Box>
                        </Box>
                    }
                    {!sources && 
                        <Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: hasNotification ? '1rem' : '0.5rem',
                                    flexWrap: 'wrap',
                                    pl: '0.5rem',
                                    gap: '15px',
                                    '@media (max-width: 900px)': {
                                        marginTop: hasNotification ? '3rem' : '1.125rem',
                                    },
                                    '@media (max-width: 600px)': {
                                        marginTop: hasNotification ? '2rem' : '0rem',
                                    },
                                }}>
                                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                                    <Typography className='first-sub-title'>
                                        Import Sources
                                    </Typography>
                                    <CustomToolTip title={'Contacts automatically sync across devices and platforms.'} linkText='Learn more' linkUrl='https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/contacts' />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 2, overflowX: 'auto', "@media (max-width: 600px)": { mb: 1 } }}>
                                    {/* --- CHIPS --- */}
                            </Box>
                            <Box sx={{
                                flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', height: "calc(100vh - 7rem)", maxWidth: '100%', pl: 0, pr: 0, pt: '14px',
                                '@media (max-width: 900px)': {
                                    pt: '2px',
                                    pb: '18px'
                                }
                            }}>
                                <SourcesImport setCreatedSource={setCreatedSource} setNewSource={setNewSource} setSources={setSources} />
                                {showSlider && <Slider />}
                            </Box>
                        </Box>
                    }

                    {/* <PopupDetails open={openPopup}
                        onClose={handleClosePopup}
                        rowData={popupData} />
                    <FilterPopup open={filterPopupOpen} onClose={handleFilterPopupClose} onApply={handleApplyFilters} industry={industry || []} /> */}
                </Box>
            </Box>
        </>
    );
};

const SourcesPage: React.FC = () => {
    return (
        <Suspense fallback={<CustomizedProgressBar />}>
            <SliderProvider>
                <Sources />
            </SliderProvider>
        </Suspense>
    );
};

export default SourcesPage;
