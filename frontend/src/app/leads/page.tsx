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
import FilterPopup from '@/components/FiltersSlider';
import AudiencePopup from '@/components/AudienceSlider';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import dayjs from 'dayjs';
import PopupDetails from '@/components/AccountDetails';
import CloseIcon from '@mui/icons-material/Close';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import Tooltip from '@mui/material/Tooltip';
import CustomToolTip from '@/components/customToolTip';
import CalendarPopup from '@/components/CustomCalendar'
import CustomTablePagination from '@/components/CustomTablePagination';
import UnlockButton from '@/components/UnlockButton';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNotification } from '@/context/NotificationContext';

const style = {
    buttonBlockText: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    }
}



interface FetchDataParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page: number;
    rowsPerPage: number;
    activeFilter: string;
    appliedDates: { start: Date | null; end: Date | null };
}


const Leads: React.FC = () => {
    const router = useRouter();
    const { hasNotification } = useNotification();
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
    const [rowsPerPageOptions, setRowsPerPageOptions] = useState<number[]>([]);

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


    const installPixel = () => {
        router.push('/dashboard');
    };


    const handleChangeRowsPerPage = (event: React.ChangeEvent<{ value: unknown }>) => {
        setRowsPerPage(parseInt(event.target.value as string, 10));
        setPage(0);
    };


    const fetchData = async ({ sortBy, sortOrder, page, rowsPerPage, activeFilter, appliedDates }: FetchDataParams) => {
        try {
            setIsLoading(true);
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
                    const formattedStatus = status.map(status => status.toLowerCase().replace(/\s+/g, '_'));
                    url += `&behavior_type=${encodeURIComponent(formattedStatus.join(','))}`;
                }
            }


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
                    url += `&average_time_sec=${encodeURIComponent(formattedTimeSpent.join(','))}`;
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
            let newRowsPerPageOptions: number[] = []; // Default options
            if (count <= 15) {
                newRowsPerPageOptions = [10, 15];
            } else if (count <= 50) {
                newRowsPerPageOptions = [15, 20];
            } else if (count <= 100) {
                newRowsPerPageOptions = [15, 20, 50];
            } else if (count <= 300) {
                newRowsPerPageOptions = [10, 20, 50, 100];
            } else if (count <= 500) {
                newRowsPerPageOptions = [10, 20, 50, 100, 300];
            } else {
                newRowsPerPageOptions = [10, 20, 50, 100, 300, 500];
            }

            setRowsPerPageOptions(newRowsPerPageOptions);
        } catch (error) {
            if (error instanceof AxiosError && error.response?.status === 403) {
                if (error.response.data.status === 'NEED_BOOK_CALL') {
                    sessionStorage.setItem('is_slider_opened', 'true');
                    setShowSlider(true);
                } else if (error.response.data.status === 'PIXEL_INSTALLATION_NEEDED') {
                    setStatus(error.response.data.status);
                } else {
                    setShowSlider(false);
                }
            } else {
                console.error('Error fetching data:', error);
            }
            setIsLoading(false);
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
            setIsLoading(true)
            const response = await axiosInstance.get(url);
            const [leads, count] = response.data;

            setData(Array.isArray(leads) ? leads : []);
            setCount(count || 0);
            setStatus(response.data.status);
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
                break;
            case 'To Date':
                filters.to_date = null;
                break;
            case 'From Time':
                filters.from_time = null;
                break;
            case 'To Time':
                filters.to_time = null;
                filters.checkedFiltersTime = {
                    ...filters.checkedFiltersTime,
                    [filterToDelete.value]: false
                };
                break;
            case 'Lead Status':
                filters.selectedFunnels = []
                break;
            case 'Regions':
                filters.regions = '';
                break;
            case 'Visitor Type':
                filters.selectedStatus = filters.selectedStatus.filter((status: string) => status !== filterToDelete.value);
                break;
            case 'Search':
                filters.searchQuery = '';
                break;
            case 'Time of Day':
                filters.checkedFiltersTime = {
                    ...filters.checkedFiltersTime,
                    [filterToDelete.value]: false
                };
                break;
            case 'Page Visits':
                filters.checkedFiltersPageVisits = {
                    page: false,
                    two_page: false,
                    three_page: false,
                    more_three: false,
                };
                break;
            case 'Time Spent':
                filters.checkedFiltersTimeSpent = {
                    under_10: false,
                    over_10: false,
                    over_30: false,
                    over_60: false,
                };
                break;
            case 'Recurring Visits':
                filters.recurringVisits = []
                break;
            default:
                break;
        }

        if (!filters.from_time) {
            if (!filters.to_time) {
                filters.checkedFiltersTime = {
                    morning: false,
                    evening: false,
                    afternoon: false,
                    all_day: false,
                };
            }
        }
        if (!filters.from_date) {
            if (!filters.to_date) {
                filters.checkedFilters = {
                    lastWeek: false,
                    last30Days: false,
                    last6Months: false,
                    allTime: false,
                };
            }
        }


        sessionStorage.setItem('filters', JSON.stringify(filters));

        if (filterToDelete.label === 'Dates') {
            setAppliedDates({ start: null, end: null });
            setFormattedDates('');
        }

        // Обновляем фильтры для применения
        const newFilters: FilterParams = {
            from_date: updatedFilters.find(f => f.label === 'From Date') ? dayjs(updatedFilters.find(f => f.label === 'From Date')!.value).unix() : null,
            to_date: updatedFilters.find(f => f.label === 'To Date') ? dayjs(updatedFilters.find(f => f.label === 'To Date')!.value).unix() : null,
            selectedStatus: updatedFilters.find(f => f.label === 'Visitor Type') ? updatedFilters.find(f => f.label === 'Visitor Type')!.value.split(', ') : [],
            regions: updatedFilters.find(f => f.label === 'Regions') ? updatedFilters.find(f => f.label === 'Regions')!.value.split(', ') : [],
            emails: updatedFilters.find(f => f.label === 'Emails') ? updatedFilters.find(f => f.label === 'Emails')!.value.split(', ') : [],
            selectedFunnels: updatedFilters.find(f => f.label === 'Lead Status') ? updatedFilters.find(f => f.label === 'Lead Status')!.value.split(', ') : [],
            searchQuery: updatedFilters.find(f => f.label === 'Search') ? updatedFilters.find(f => f.label === 'Search')!.value : '',

            // Сбрасываем флаги фильтров, если они удалены
            checkedFilters: {
                lastWeek: updatedFilters.some(f => f.label === 'Date Range' && f.value === 'lastWeek'),
                last30Days: updatedFilters.some(f => f.label === 'Date Range' && f.value === 'last30Days'),
                last6Months: updatedFilters.some(f => f.label === 'Date Range' && f.value === 'last6Months'),
                allTime: updatedFilters.some(f => f.label === 'Date Range' && f.value === 'allTime')
            },
            checkedFiltersPageVisits: {
                page: updatedFilters.some(f => f.label === 'Page Visits' && f.value.split(', ').includes('1 page')),
                two_page: updatedFilters.some(f => f.label === 'Page Visits' && f.value.split(', ').includes('2 pages')),
                three_page: updatedFilters.some(f => f.label === 'Page Visits' && f.value.split(', ').includes('3 pages')),
                more_three: updatedFilters.some(f => f.label === 'Page Visits' && f.value.split(', ').includes('more than 3 pages')),
            },
            checkedFiltersTime: {
                morning: updatedFilters.some(f => f.label === 'Time of Day' && f.value === 'morning'),
                evening: updatedFilters.some(f => f.label === 'Time of Day' && f.value === 'evening'),
                afternoon: updatedFilters.some(f => f.label === 'Time of Day' && f.value === 'afternoon'),
                all_day: updatedFilters.some(f => f.label === 'Time of Day' && f.value === 'all_day')
            },
            checkedFiltersTimeSpent: {
                under_10: updatedFilters.some(f => f.label === 'Time Spent' && f.value.split(', ').includes('under 10')),
                over_10: updatedFilters.some(f => f.label === 'Time Spent' && f.value.split(', ').includes('10-30 secs')),
                over_30: updatedFilters.some(f => f.label === 'Time Spent' && f.value.split(', ').includes('30-60 secs')),
                over_60: updatedFilters.some(f => f.label === 'Time Spent' && f.value.split(', ').includes('over 60 secs')),
            },
            recurringVisits: updatedFilters.find(f => f.label === 'Recurring Visits') ? updatedFilters.find(f => f.label === 'Recurring Visits')!.value.split(', ') : [],
            from_time: updatedFilters.find(f => f.label === 'From Time') ? updatedFilters.find(f => f.label === 'From Time')!.value : null,
            to_time: updatedFilters.find(f => f.label === 'To Time') ? updatedFilters.find(f => f.label === 'To Time')!.value : null
        };


        // Применяем обновленные фильтры
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

    const handleDateLabelChange = (label: string) => {
    };


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
            case false:
                return {
                    background: 'rgba(235, 243, 254, 1)',
                    color: 'rgba(20, 110, 246, 1)',
                };
            case true:
                return {
                    background: 'rgba(244, 252, 238, 1)',
                    color: 'rgba(43, 91, 0, 1)',
                };
            case "viewed_product":
                return {
                    background: 'rgba(254, 238, 236, 1)',
                    color: 'rgba(244, 87, 69, 1)',
                };
            case 'visitor':
                return {
                    background: 'rgba(254, 243, 205, 1)',
                    color: 'rgba(101, 79, 0, 1)',
                };
            case 'converted_sales':
                return {
                    background: 'rgba(235, 243, 254, 1)',
                    color: 'rgba(20, 110, 246, 1)',
                };
            case 'product_added_to_cart':
                return {
                    background: 'rgba(241, 241, 249, 1)',
                    color: 'rgba(80, 82, 178, 1)',
                };
            default:
                return {
                    background: 'transparent',
                    color: 'inherit',
                };
        }
    };

    const formatFunnelText = (text: boolean) => {
        if (text === false) {
            return 'New';
        }
        if (text === true) {
            return 'Returning';
        }
        if (text === 'visitor') {
            return "Visitor"
        }
        if (text === 'viewed_product') {
            return "View Product"
        }
        if (text === 'product_added_to_cart') {
            return "Abandoned cart"
        }
        if (text === 'converted_sales') {
            return "Converted sales"
        }
    };

    const handleDownload = async () => {
        setLoading(true);
        try {
            // Processing "Date Calendly"
            const startEpoch = appliedDates.start ? Math.floor(appliedDates.start.getTime() / 1000) : null;
            const endEpoch = appliedDates.end ? Math.floor(appliedDates.end.getTime() / 1000) : null;

            let url = '/leads/download_leads';
            let params = [];

            if (startEpoch !== null && endEpoch !== null) {
                params.push(`from_date=${startEpoch}&to_date=${endEpoch}`);
            }

            if (selectedFilters.some(filter => filter.label === 'Visitor Type')) {
                const status = selectedFilters.find(filter => filter.label === 'Visitor Type')?.value.split(', ') || [];
                if (status.length > 0) {
                    const formattedStatus = status.map(status => status.toLowerCase().replace(/\s+/g, '_'));
                    params.push(`behavior_type=${encodeURIComponent(formattedStatus.join(','))}`);
                }
            }

            if (selectedFilters.some(filter => filter.label === 'Regions')) {
                const regions = selectedFilters.find(filter => filter.label === 'Regions')?.value.split(', ') || [];
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
                const funnels = selectedFilters.find(filter => filter.label === 'Lead Status')?.value.split(', ') || [];
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
                const timeSpent = selectedFilters.find(filter => filter.label === 'Time Spent')?.value.split(', ') || [];
                if (timeSpent.length > 0) {
                    const formattedTimeSpent = timeSpent.map(value => value.replace(/\s+/g, '_'));
                    params.push(`average_time_sec=${encodeURIComponent(formattedTimeSpent.join(','))}`);
                }
            }

            if (selectedFilters.some(filter => filter.label === 'Recurring Visits')) {
                const recurringVisits = selectedFilters.find(filter => filter.label === 'Recurring Visits')?.value.split(', ') || [];
                if (recurringVisits.length > 0) {
                    const formattedRecurringVisits = recurringVisits.map(value => value.replace(/\s+/g, '_'));
                    params.push(`recurring_visits=${encodeURIComponent(formattedRecurringVisits.join(','))}`);
                }
            }

            if (selectedFilters.some(filter => filter.label === 'Page Visits')) {
                const pageVisits = selectedFilters.find(filter => filter.label === 'Page Visits')?.value.split(', ') || [];
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

    const formatTimeSpent = (seconds: number): string => {
        if (!seconds) return '--';

        const hours = Math.floor(seconds / 3600); // Получаем часы
        const minutes = Math.floor((seconds % 3600) / 60); // Получаем оставшиеся минуты
        const remainingSeconds = seconds % 60; // Получаем оставшиеся секунды

        let result = '';
        if (hours > 0) {
            result += `${hours} hr `;
        }
        if (minutes > 0) {
            result += `${minutes} min `;
        }
        if (remainingSeconds > 0) {
            result += `${remainingSeconds} sec`;
        }

        return result.trim();
    };

    const truncateText = (text: string, maxLength: number) => {
        return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
    };

    const handleUnlock = () => {
        router.push('settings?section=subscription')
    }

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
                            marginTop: hasNotification ? '1rem' : '0.5rem',
                            flexWrap: 'wrap',
                            pl: '0.5rem',
                            gap: '15px',
                            '@media (max-width: 900px)': {
                                marginTop: hasNotification ? '3rem' : '1.125rem',
                            }
                        }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                            <Typography className='first-sub-title'>
                                Resolved Contacts {data.length === 0 ? '' : `(${count_leads})`}
                            </Typography>
                            <CustomToolTip title={'Contacts automatically sync across devices and platforms.'} linkText='Learn more' linkUrl='https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/contacts' />
                        </Box>
                        <Box sx={{
                            display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px', pt:'4px',
                            '@media (max-width: 900px)': {
                                gap: '8px'
                            }
                        }}>
                            <Button
                                onClick={handleAudiencePopupOpen}
                                aria-haspopup="true"
                                disabled={status === 'PIXEL_INSTALLATION_NEEDED'}

                                sx={{
                                    textTransform: 'none',
                                    color: status === 'PIXEL_INSTALLATION_NEEDED' ? 'rgba(128, 128, 128, 1)' : 'rgba(80, 82, 178, 1)',
                                    border: '1px solid rgba(80, 82, 178, 1)',
                                    borderRadius: '4px',
                                    padding: '9px 16px',
                                    opacity: status === 'PIXEL_INSTALLATION_NEEDED' ? '0.4' : '1',
                                    minWidth: 'auto',
                                    '@media (max-width: 900px)': {
                                        display: 'none'
                                    }
                                }}
                            >
                                <Typography className='second-sub-title' sx={{
                                    marginRight: '0.5em',
                                    padding: 0.2,
                                    textAlign: 'left',
                                    color: '#5052B2 !important'
                                }}>
                                    Create Contact Sync
                                </Typography>
                            </Button>
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
                                <DateRangeIcon fontSize='medium' />
                                <Typography variant="body1" sx={{
                                    fontFamily: 'Nunito Sans',
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
                                    '@media (min-width: 901px)': {
                                        display: 'none'
                                    }
                                }}
                            >
                                <Image src='/add.svg' alt='logo' height={24} width={24} />
                            </Button>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 2 }}>
                        {selectedFilters.length > 0 && (
                            <Chip
                                className='second-sub-title'
                                label="Clear all"
                                onClick={handleResetFilters}
                                sx={{ color: '#5052B2 !important', backgroundColor: 'transparent', lineHeight: '20px !important', fontWeight: '400 !important', borderRadius: '4px' }}
                            />
                        )}
                        {selectedFilters.map(filter => {
                            let displayValue = filter.value;
                            // Если фильтр Regions, применяем форматирование
                            if (filter.label === 'Regions') {
                                const regions = filter.value.split(', ') || [];
                                const formattedRegions = regions.map(region => {
                                    const [name] = region.split('-');
                                    return name;
                                });
                                displayValue = formattedRegions.join(', ');
                            }
                            return (
                                <Chip
                                    className='paragraph'
                                    key={filter.label}
                                    label={`${filter.label}: ${displayValue.charAt(0).toUpperCase() + displayValue.slice(1)}`}
                                    onDelete={() => handleDeleteFilter(filter)}
                                    deleteIcon={
                                        <CloseIcon
                                            sx={{
                                                backgroundColor: 'transparent',
                                                color: '#828282 !important',
                                                fontSize: '14px !important'
                                            }}
                                        />
                                    }
                                    sx={{
                                        borderRadius: '4.5px',
                                        backgroundColor: 'rgba(80, 82, 178, 0.10)',
                                        color: '#5F6368 !important',
                                        lineHeight: '16px !important'
                                    }}
                                />
                            );
                        })}
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
                                <Typography variant="h5" className='first-sub-title' sx={{
                                    mb: 3,
                                    fontFamily: 'Nunito Sans',
                                    fontSize: "20px",
                                    color: "#4a4a4a",
                                    fontWeight: "600",
                                    lineHeight: "28px"
                                }}>
                                    Pixel Integration isn&apos;t completed yet!
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
                                    Install the pixel to unlock and gain valuable insights! Start viewing your leads now
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={installPixel}
                                    className='second-sub-title'
                                    sx={{
                                        backgroundColor: 'rgba(80, 82, 178, 1)',
                                        textTransform: 'none',
                                        padding: '10px 24px',
                                        mt: 3,
                                        color: '#fff !important',
                                        ':hover': {
                                            backgroundColor: 'rgba(80, 82, 178, 1)'
                                        }
                                    }}
                                >
                                    Setup Pixel
                                </Button>
                            </Box>
                        ) : data.length === 0 ? (
                            <Box sx={centerContainerStyles}>
                                <Typography variant="h5" sx={{
                                    mb: 3,
                                    fontFamily: 'Nunito Sans',
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
                                        fontFamily: 'Nunito Sans',
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
                                            maxHeight: selectedFilters.length > 0 
                                                ? (hasNotification ? '63vh' : '68vh') 
                                                : '72vh',
                                            overflowY: 'scroll'
                                        }}
                                    >
                                        <Table stickyHeader aria-label="leads table">
                                            <TableHead>
                                                <TableRow>
                                                    {[
                                                        { key: 'name', label: 'Name', sortable: true },
                                                        { key: 'personal_email', label: 'Personal Email' },
                                                        { key: 'business_email', label: 'Business Email' },
                                                        { key: 'mobile_phone', label: 'Mobile phone' },
                                                        { key: 'first_visited_date', label: 'Visited date', sortable: true },
                                                        { key: 'funnel', label: 'Lead Status' },
                                                        { key: 'status', label: 'Visitor Type' },
                                                        { key: 'average_time_sec', label: 'Average time on site', sortable: true },
                                                    ].map(({ key, label, sortable = false }) => (
                                                        <TableCell
                                                            key={key}
                                                            sx={{
                                                                ...leadsStyles.table_column,
                                                                ...(key === 'name' && {
                                                                    position: 'sticky',
                                                                    left: 0,
                                                                    zIndex: 99
                                                                }),
                                                                ...(key === 'average_time_sec' && {
                                                                    "::after": { content: 'none' }
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
                                                        sx={{
                                                            backgroundColor: selectedRows.has(row.id) ? 'rgba(247, 247, 247, 1)' : '#fff',
                                                            '&:hover': {
                                                                backgroundColor: 'rgba(247, 247, 247, 1)',
                                                                '& .sticky-cell': {
                                                                    backgroundColor: 'rgba(247, 247, 247, 1)',
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
                                                        <TableCell sx={{ ...leadsStyles.table_array, position: 'relative' }}>
                                                            {row.is_active ? (
                                                                row.personal_emails ? (
                                                                    <Tooltip title={row.personal_emails.split(',')[0]}>
                                                                        <span className="truncate-email">
                                                                            {truncateText(row.personal_emails.split(',')[0], 24)}
                                                                        </span>
                                                                    </Tooltip>
                                                                ) : (
                                                                    <span className="truncate-email">--</span>
                                                                )
                                                            ) : (
                                                                <UnlockButton onClick={() => handleUnlock()} label="Unlock email" />
                                                            )}
                                                        </TableCell>

                                                        {/* Business Email Column */}
                                                        <TableCell sx={{ ...leadsStyles.table_array, position: 'relative' }}>
                                                            {row.is_active ? (
                                                                row.business_email ? (
                                                                    <Tooltip title={row.business_email.split(',')[0]}>
                                                                        <span className="truncate-email">
                                                                            {truncateText(row.business_email.split(',')[0], 24)}
                                                                        </span>
                                                                    </Tooltip>
                                                                ) : (
                                                                    <span className="truncate-email">--</span>
                                                                )
                                                            ) : (
                                                                <UnlockButton onClick={() => handleUnlock()} label="Unlock email" />
                                                            )}
                                                        </TableCell>

                                                        {/* Mobile Phone Column */}
                                                        <TableCell sx={leadsStyles.table_array_phone}>
                                                            {row.is_active ? (
                                                                row.mobile_phone
                                                                    ? row.mobile_phone.split(',')[0]
                                                                    : row.personal_phone
                                                                        ? row.personal_phone.split(',')[0]
                                                                        : row.direct_number
                                                                            ? row.direct_number.split(',')[0]
                                                                            : '--'
                                                            ) : (
                                                                <UnlockButton onClick={() => handleUnlock()} label="Unlock mobile number" />
                                                            )}
                                                        </TableCell>
                                                        <TableCell
                                                            sx={{ ...leadsStyles.table_array, position: 'relative' }}>{row.first_visited_date || '--'}</TableCell>
                                                        <TableCell
                                                            sx={{ ...leadsStyles.table_column, position: 'relative' }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '2px',
                                                                    fontFamily: 'Roboto',
                                                                    fontSize: '12px',
                                                                    fontWeight: '400',
                                                                    lineHeight: 'normal',
                                                                    backgroundColor: getStatusStyle(row.behavior_type).background,
                                                                    color: getStatusStyle(row.behavior_type).color,
                                                                    justifyContent: 'center',
                                                                    minWidth: '110px',
                                                                    textTransform: 'capitalize'
                                                                }}
                                                            >
                                                                {formatFunnelText(row.behavior_type) || '--'}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell
                                                            sx={{ ...leadsStyles.table_column, position: 'relative' }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '2px',
                                                                    fontFamily: 'Roboto',
                                                                    fontSize: '12px',
                                                                    fontWeight: '400',
                                                                    lineHeight: 'normal',
                                                                    backgroundColor: getStatusStyle(row.visitor_type).background,
                                                                    color: getStatusStyle(row.visitor_type).color,
                                                                    justifyContent: 'center',
                                                                    minWidth: '110px',
                                                                    textTransform: 'capitalize'
                                                                }}
                                                            >
                                                                {formatFunnelText(row.visitor_type) || '--'}
                                                            </Box>
                                                        </TableCell>

                                                        <TableCell sx={{ ...leadsStyles.table_array, "::after": { content: 'none' } }}>
                                                            {row.average_time_sec ? formatTimeSpent(row.average_time_sec) : '--'}
                                                        </TableCell>

                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: '24px 0 0' }}>
                                        <CustomTablePagination
                                            count={count_leads ?? 0}
                                            page={page}
                                            rowsPerPage={rowsPerPage}
                                            onPageChange={handleChangePage}
                                            onRowsPerPageChange={handleChangeRowsPerPage}
                                            rowsPerPageOptions={rowsPerPageOptions}
                                        />
                                    </Box>
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
                        onDateLabelChange={handleDateLabelChange}
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
