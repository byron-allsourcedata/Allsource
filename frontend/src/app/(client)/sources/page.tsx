"use client";
import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { Box, Grid, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, List, ListItemText, ListItemButton, Popover, DialogActions, DialogContent, DialogContentText, LinearProgress } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axiosInstance from '../../../axios/axiosInterceptorInstance';
import { sourcesStyles } from './sourcesStyles';
import Slider from '../../../components/Slider';
import { SliderProvider } from '../../../context/SliderContext';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
// import FilterPopup from './CompanyFilters';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import dayjs from 'dayjs';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import CustomToolTip from '@/components/customToolTip';
import CustomTablePagination from '@/components/CustomTablePagination';
import { useNotification } from '@/context/NotificationContext';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import ThreeDotsLoader from './components/ThreeDotsLoader';
import ProgressBar from './components/ProgressLoader';
import { MoreVert } from '@mui/icons-material'
import { useSSE } from '../../../context/SSEContext';

interface Source {
    id: string
    name: string
    source_origin: string
    source_type: string
    created_at: Date
    updated_at: Date
    created_by: string
    processed_records: number
    total_records: number
    matched_records: number
    matched_records_status: string
}

interface FetchDataParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page: number;
    rowsPerPage: number;
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
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [count_sources, setCount] = useState<number | null>(null);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [status, setStatus] = useState<string | null>(null);
    const [showSlider, setShowSlider] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
    const dropdownOpen = Boolean(dropdownEl);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [activeFilter, setActiveFilter] = useState<string>('');
    const [selectedDates, setSelectedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [filterPopupOpen, setFilterPopupOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState<{ label: string, value: string }[]>([]);
    const { sourceProgress } = useSSE();
    const [loaderForTable, setLoaderForTable] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [selectedRowData, setSelectedRowData] = useState<Source | null>(null);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [rowsPerPageOptions, setRowsPerPageOptions] = useState<number[]>([]);
    const isOpen = Boolean(anchorEl);
    // const hasUnmatchedRecords = useMemo(() => {
    //     return data.some(item => item.matched_records === 0 && item.matched_records_status === "pending");
    // }, [data]);

    const memoizedData = useMemo(() => data, [data]);
    const hasUnmatchedRecords = useMemo(() => {
    return memoizedData.some(item => item.matched_records === 0 && item.matched_records_status === "pending");
}, [memoizedData]);

    // useEffect(() => {
    //     document.body.style.overflow = 'hidden';
    //     return () => {
    //         document.body.style.overflow = 'auto';
    //     };
    // }, []);

    // useEffect(() => {
    //     fetchSources({
    //         sortBy: orderBy,
    //         sortOrder: order,
    //         page,
    //         rowsPerPage,
    //     });
    // }, [orderBy, order, page, rowsPerPage, selectedFilters]);

    const fetchSourcesMemoized = useCallback(() => {
        fetchSources({
            sortBy: orderBy,
            sortOrder: order,
            page,
            rowsPerPage,
        });
    }, [orderBy, order, page, rowsPerPage]);
    
    useEffect(() => {
        if (isFirstLoad || hasUnmatchedRecords) {   
            const interval = setInterval(fetchSourcesMemoized, 5000);
    
            return () => clearInterval(interval);
        }
    }, [fetchSourcesMemoized, hasUnmatchedRecords]);
      

    const fetchData = async () => {
    try {
        const idsToFetch = data
        .filter(item => item.matched_records === 0 && item.matched_records_status === "pending")
        .map(item => item.id);

        const response = await axiosInstance.post('/audience-sources/get-processing-sources', {
            sources_ids: idsToFetch,
        });

        const updatedData = data.map(item => {
        const updatedItem = response.data.find(
            (record: any) => record.id === item.id
        );
        return updatedItem ? { ...item, ...updatedItem } : item;
        });

        setData(updatedData);
    } catch (error) {
        console.error('Failed to fetch data:', error);
    }
    };

    const fetchSources = async ({ sortBy, sortOrder, page, rowsPerPage }: FetchDataParams) => {
        try {
            isFirstLoad ? setLoading(true)  : setLoaderForTable(true);
            const accessToken = localStorage.getItem("token");
            if (!accessToken) {
                router.push('/signin');
                return;
            }

            let url = `/audience-sources?&page=${page + 1}&per_page=${rowsPerPage}`

            if (sortBy) {
                setPage(0)
                url += `&sort_by=${sortBy}&sort_order=${sortOrder}`;
            }

            const response = await axiosInstance.get(url)

            const { source_list, count } = response.data;
            setData(source_list);
            setCount(count || 0);
            setStatus("");

            const options = [10, 20, 50, 100, 300, 500];
            let RowsPerPageOptions = options.filter(option => option <= count);
            if (RowsPerPageOptions.length < options.length) {
                RowsPerPageOptions = [...RowsPerPageOptions, options[RowsPerPageOptions.length]];
            }
            setRowsPerPageOptions(RowsPerPageOptions);
            const selectedValue = RowsPerPageOptions.includes(rowsPerPage) ? rowsPerPage : 10;
            setRowsPerPage(selectedValue);

        } catch {
        } finally {
            if (isFirstLoad) {
                setLoading(false);
                setIsFirstLoad(false);
            } else {
                setLoaderForTable(false);
            }
        }
    }

    const handleFilterPopupOpen = () => {
        setFilterPopupOpen(true);
    };

    const handleFilterPopupClose = () => {
        setFilterPopupOpen(false);
    };

    const handleOpenPopover = (event: React.MouseEvent<HTMLElement>, rowData: Source) => {
        setAnchorEl(event.currentTarget);
        setSelectedRowData(rowData);
    };

    const handleClosePopover = () => {
        setAnchorEl(null);
    };

    const handleSortRequest = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };
    
    const handleDeleteSource = async () => {
        setLoaderForTable(true);
        try {
            if (selectedRowData?.id) {
                const response = await axiosInstance.delete(`/audience-sources/${selectedRowData.id}`);
                if (response.status === 200 && response.data) {
                    showToast("Source successfully deleted!");
                    setData((prevAccounts: Source[]) =>
                        prevAccounts.filter((item: Source) => item.id !== selectedRowData.id)
                    );
                }
            }
        } catch {
            showErrorToast("Error deleting source")
        } finally {
            setLoaderForTable(false);
            handleClosePopover();
            handleCloseConfirmDialog();
        }
    };

    const handleOpenConfirmDialog = () => {
        setOpenConfirmDialog(true);
    };

    const handleCloseConfirmDialog = () => {
        setOpenConfirmDialog(false);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<{ value: unknown }>) => {
        setRowsPerPage(parseInt(event.target.value as string, 10));
        setPage(0);
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

    const handleResetFilters = async () => {
        const url = `/company`;

        try {
            setIsLoading(true)
            sessionStorage.removeItem('filters')
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

    const setSourceOrigin = (sourceOrigin: string) => {
        return sourceOrigin === "pixel" ? "Pixel" : "CSV File"
    }

    const setSourceType = (sourceType: string) => {
        return sourceType
            .split('_')
            .map((item: string) => item.charAt(0).toUpperCase() + item.slice(1))
            .join(' ');
    }


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
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', }}>
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
                                <CustomToolTip title={'Here you can view your active sources.'} linkText='Learn more' linkUrl='https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/contacts' />
                            </Box>
                            <Box sx={{
                                display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px', pt: '4px', pr:2,
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
                                        router.push("/sources/builder")
                                    }}
                                >
                                    Import Source
                                </Button>
                                <Button
                                    onClick={handleFilterPopupOpen}
                                    disabled={data?.length === 0}
                                    aria-controls={dropdownOpen ? 'account-dropdown' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={dropdownOpen ? 'true' : undefined}
                                    sx={{
                                        textTransform: 'none',
                                        color: selectedFilters.length > 0 ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)',
                                        border: selectedFilters.length > 0 ? '1px solid rgba(80, 82, 178, 1)' : '1px solid rgba(184, 184, 184, 1)',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        opacity: data?.length === 0 ? '0.5' : '1',
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

                        <Box sx={{
                            flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4.25rem)', pr:2, overflow: 'auto', maxWidth: '100%',
                            '@media (max-width: 900px)': {
                                pt: '2px',
                                pb: '18px'
                            }
                        }}>
                            
                            <Box sx={{
                                display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%',
                                '@media (max-width: 900px)': {
                                    paddingRight: 0,
                                    minHeight: '100vh'

                                }
                            }}>
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 2, overflowX: 'auto', "@media (max-width: 600px)": { mb: 1 } }}>
                                        {/* CHIPS */}
                                    </Box>
                                    <Box sx={{
                                        flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '100%', pl: 0, pr: 0, pt: '14px', pb: '20px',
                                        '@media (max-width: 900px)': {
                                            pt: '2px',
                                            pb: '18px'
                                        }
                                    }}>
                                        {data.length === 0 &&
                                            <Box sx={sourcesStyles.centerContainerStyles}>
                                                <Typography variant="h5" sx={{
                                                    mb: 3,
                                                    fontFamily: 'Nunito Sans',
                                                    fontSize: "20px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "600",
                                                    lineHeight: "28px"
                                                }}>
                                                    Import Your First Source
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
                                                    Import your first source to generate lookalikes.
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    onClick={() => router.push("/sources/builder")}
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
                                                    Import Your First Source
                                                </Button>
                                            </Box>
                                        }
                                        {data.length !== 0 &&
                                            <Grid container spacing={1} sx={{ flex: 1 }}>
                                                <Grid item xs={12}>
                                                    <TableContainer
                                                        component={Paper}
                                                        sx={{
                                                            border: '1px solid rgba(235, 235, 235, 1)',
                                                            overflowX: 'scroll',
                                                            maxHeight: selectedFilters.length > 0
                                                                ? (hasNotification ? '63vh' : '68vh')
                                                                : '72vh',
                                                            overflowY: 'auto',
                                                            "@media (max-height: 800px)": {
                                                                maxHeight: selectedFilters.length > 0
                                                                    ? (hasNotification ? '53vh' : '57vh')
                                                                    : '70vh',
                                                            },
                                                            "@media (max-width: 400px)": {
                                                                maxHeight: selectedFilters.length > 0
                                                                    ? (hasNotification ? '53vh' : '60vh')
                                                                    : '67vh',
                                                            },
                                                        }}
                                                    >
                                                        <Table stickyHeader aria-label="leads table">
                                                            <TableHead sx={{position: "relative"}}>
                                                                <TableRow>
                                                                    {[
                                                                        { key: 'name', label: 'Name' },
                                                                        { key: 'source', label: 'Source' },
                                                                        { key: 'type', label: 'Type' },
                                                                        { key: 'created_date', label: 'Created Date', sortable: true },
                                                                        { key: 'created_by', label: 'Created By' },
                                                                        { key: 'updated_date', label: 'Update Date' },
                                                                        { key: 'number_of_customers', label: 'Number of Customers', sortable: true },
                                                                        { key: 'matched_records', label: 'Matched Records', sortable: true },
                                                                        { key: 'actions', label: 'Actions' }
                                                                    ].map(({ key, label, sortable = false }) => (
                                                                        <TableCell
                                                                            key={key}
                                                                            sx={{
                                                                                ...sourcesStyles.table_column,
                                                                                ...(key === 'name' && {
                                                                                    position: 'sticky',
                                                                                    left: 0,
                                                                                    zIndex: 10,
                                                                                    top: 0,
                                                                                }),
                                                                                ...(key === 'average_time_sec' && {
                                                                                    "::after": { content: 'none' }
                                                                                })
                                                                            }}

                                                                            onClick={sortable ? () => handleSortRequest(key) : undefined}
                                                                            style={{ cursor: sortable ? 'pointer' : 'default' }}
                                                                        >
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: "space-between", }}>
                                                                                <Typography variant="body2" sx={{ ...sourcesStyles.table_column, borderRight: '0' }}>{label}</Typography>
                                                                                {sortable && (
                                                                                    <IconButton size="small">
                                                                                        {orderBy === key ? (
                                                                                            order === 'asc' ? (
                                                                                                <ArrowDownwardRoundedIcon fontSize="inherit" />
                                                                                            ) : (
                                                                                                <ArrowUpwardRoundedIcon fontSize="inherit" />
                                                                                            )
                                                                                        ) : (
                                                                                            <SwapVertIcon fontSize="inherit" />
                                                                                        )}
                                                                                    </IconButton>
                                                                                )}
                                                                            </Box>
                                                                        </TableCell>
                                                                    ))}
                                                                </TableRow>
                                                                {loaderForTable && (
                                                                    <TableRow sx={{
                                                                        position: "sticky",
                                                                        top: '56px',
                                                                        zIndex: 11,
                                                                    }}>
                                                                        <TableCell colSpan={9} sx={{p: 0, pb: "4px"}}>
                                                                            <LinearProgress variant="indeterminate" sx={{width: "100%", position: "absolute"}}/> 
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </TableHead>
                                                            <TableBody>
                                                                {data.map((row: Source) => {
                                                                    const progress = sourceProgress[row.id];
                                                                    return (
                                                                        <TableRow
                                                                            key={row.id}
                                                                            selected={selectedRows.has(row.id)}
                                                                            sx={{
                                                                                backgroundColor: selectedRows.has(row.id) && !loaderForTable ? 'rgba(247, 247, 247, 1)' : '#fff',
                                                                                '&:hover': {
                                                                                    backgroundColor: 'rgba(247, 247, 247, 1)',
                                                                                    '& .sticky-cell': {
                                                                                        backgroundColor: 'rgba(247, 247, 247, 1)',
                                                                                    }
                                                                                }
                                                                            }}
                                                                        >
                                                                            {/* Name Column */}
                                                                            <TableCell className="sticky-cell"
                                                                                sx={{
                                                                                    ...sourcesStyles.table_array, position: 'sticky', left: '0', zIndex: 9, backgroundColor: loaderForTable ? 'transparent' : '#fff',
                                                                                }}>
                                                                                {row.name}
                                                                            </TableCell>

                                                                            {/* Source Column */}
                                                                            <TableCell
                                                                                sx={{ ...sourcesStyles.table_array, position: 'relative' }}
                                                                            >
                                                                                {setSourceOrigin(row.source_type)}
                                                                            </TableCell>

                                                                            {/* Type Column */}
                                                                            <TableCell
                                                                                sx={{ ...sourcesStyles.table_array, position: 'relative' }}
                                                                            >
                                                                                {setSourceType(row.source_origin)}
                                                                            </TableCell>

                                                                            {/* Created date Column */}
                                                                            <TableCell
                                                                                sx={{ ...sourcesStyles.table_array, position: 'relative' }}
                                                                            >
                                                                                {dayjs(row.created_at).isValid() ? dayjs(row.created_at).format('MMM D, YYYY') : '--'}
                                                                            </TableCell>

                                                                            {/* Created By Column */}
                                                                            <TableCell
                                                                                sx={{ ...sourcesStyles.table_array, position: 'relative' }}
                                                                            >
                                                                                {row.created_by}
                                                                            </TableCell>

                                                                            {/* Update Date Column */}
                                                                            <TableCell
                                                                                sx={{ ...sourcesStyles.table_array, position: 'relative' }}
                                                                            >
                                                                                {dayjs(row.updated_at).isValid() ? dayjs(row.updated_at).format('MMM D, YYYY') : '--'}
                                                                            </TableCell>

                                                                            {/* Number of Customers Column */}
                                                                            <TableCell
                                                                                sx={{ ...sourcesStyles.table_array, position: 'relative' }}
                                                                            >
                                                                                {/* {row.matched_records_status === "pending" 
                                                                                ? progress?.total
                                                                                    ? progress?.total.toLocaleString('en-US')
                                                                                    : <ThreeDotsLoader />
                                                                                : row.total_records.toLocaleString('en-US') ?? '--'} */}

                                                                                {progress?.total && progress?.total > 0 || row?.total_records > 0
                                                                                ? progress?.total > 0
                                                                                    ? progress?.total.toLocaleString('en-US')
                                                                                    : row?.total_records?.toLocaleString('en-US')
                                                                                :  <ThreeDotsLoader />
                                                                                }
                                                                            </TableCell>

                                                                            {/* Matched Records  Column */}
                                                                            <TableCell
                                                                                sx={{ ...sourcesStyles.table_array, position: 'relative' }}
                                                                            >
                                                                                {/* {row.matched_records_status === "pending" 
                                                                                ? progress?.processed == progress?.total && progress?.processed
                                                                                    ? progress?.matched.toLocaleString('en-US')
                                                                                    : <ProgressBar progress={progress}/>
                                                                                : row.matched_records.toLocaleString('en-US') ?? '--'} */}
                                                                                {(progress?.processed && progress?.processed == progress?.total) || (row?.processed_records == row?.total_records)
                                                                                ? progress?.matched > row?.matched_records 
                                                                                    ? progress?.matched.toLocaleString('en-US')
                                                                                    : row.matched_records.toLocaleString('en-US')
                                                                                :  <ProgressBar progress={progress}/> 
                                                                                }
                                                                            </TableCell>

                                                                            <TableCell sx={{ ...sourcesStyles.tableBodyColumn, paddingLeft: "16px", textAlign: 'center' }}>
                                                                                <IconButton onClick={(event) => handleOpenPopover(event, row)} sx={{ ':hover': { backgroundColor: 'transparent' } }} >
                                                                                    <MoreVert sx={{ color: "rgba(32, 33, 36, 1)" }} height={8} width={24} />
                                                                                </IconButton>

                                                                                <Popover
                                                                                    open={isOpen}
                                                                                    anchorEl={anchorEl}
                                                                                    onClose={handleClosePopover}
                                                                                    anchorOrigin={{
                                                                                        vertical: 'bottom',
                                                                                        horizontal: 'left',
                                                                                    }}
                                                                                >
                                                                                    <List
                                                                                        sx={{
                                                                                            width: '100%', maxWidth: 360
                                                                                        }}
                                                                                    >
                                                                                        <ListItemButton sx={{ padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)" } }} onClick={() => {
                                                                                            handleClosePopover()
                                                                                            router.push(`/lookalikes/${row.id}/builder`)
                                                                                        }}>
                                                                                            <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Create Lookalike" />
                                                                                        </ListItemButton>
                                                                                        <ListItemButton
                                                                                            sx={{ padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)" } }}
                                                                                            onClick={() => {
                                                                                                handleOpenConfirmDialog();
                                                                                            }}
                                                                                        >
                                                                                            <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Remove" />
                                                                                        </ListItemButton>
                                                                                        <Popover
                                                                                            open={openConfirmDialog}
                                                                                            onClose={handleCloseConfirmDialog}
                                                                                            anchorEl={anchorEl}
                                                                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                                                            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                                                                                            slotProps={{ paper: {
                                                                                                sx: {
                                                                                                    padding: '0.125rem',
                                                                                                    width: '15.875rem',
                                                                                                    boxShadow: 0,
                                                                                                    borderRadius: '8px',
                                                                                                    border: '0.5px solid rgba(175, 175, 175, 1)'
                                                                                                }
                                                                                            }}}
                                                                                        >
                                                                                            <Typography className="first-sub-title" sx={{ paddingLeft: 2, pt: 1, pb: 0 }}>
                                                                                                Confirm Deletion
                                                                                            </Typography>
                                                                                            <DialogContent sx={{ padding: 2 }}>
                                                                                                <DialogContentText className="table-data">
                                                                                                    Are you sure you want to delete this source?
                                                                                                </DialogContentText>
                                                                                            </DialogContent>
                                                                                            <DialogActions>
                                                                                                <Button
                                                                                                    className="second-sub-title"
                                                                                                    onClick={handleCloseConfirmDialog}
                                                                                                    sx={{
                                                                                                        backgroundColor: '#fff',
                                                                                                        color: 'rgba(80, 82, 178, 1) !important',
                                                                                                        fontSize: '14px',
                                                                                                        textTransform: 'none',
                                                                                                        padding: '0.75em 1em',
                                                                                                        border: '1px solid rgba(80, 82, 178, 1)',
                                                                                                        maxWidth: '50px',
                                                                                                        maxHeight: '30px',
                                                                                                        '&:hover': { backgroundColor: '#fff', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)' },
                                                                                                    }}
                                                                                                >
                                                                                                    Cancel
                                                                                                </Button>
                                                                                                <Button
                                                                                                    className="second-sub-title"
                                                                                                    onClick={handleDeleteSource}
                                                                                                    sx={{
                                                                                                        backgroundColor: 'rgba(80, 82, 178, 1)',
                                                                                                        color: '#fff !important',
                                                                                                        fontSize: '14px',
                                                                                                        textTransform: 'none',
                                                                                                        padding: '0.75em 1em',
                                                                                                        border: '1px solid rgba(80, 82, 178, 1)',
                                                                                                        maxWidth: '60px',
                                                                                                        maxHeight: '30px',
                                                                                                        '&:hover': { backgroundColor: 'rgba(80, 82, 178, 1)', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)' },
                                                                                                    }}
                                                                                                >
                                                                                                    Delete
                                                                                                </Button>
                                                                                            </DialogActions>
                                                                                        </Popover>
                                                                                    </List>
                                                                                </Popover>
                                                                            </TableCell>

                                                                        </TableRow>
                                                                    )
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>
                                                    {count_sources && count_sources > 10 
                                                    ?
                                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: '24px 0 0', "@media (max-width: 600px)": { padding: '12px 0 0' } }}>
                                                            <CustomTablePagination
                                                                count={count_sources ?? 0}
                                                                page={page}
                                                                rowsPerPage={rowsPerPage}
                                                                onPageChange={handleChangePage}
                                                                onRowsPerPageChange={handleChangeRowsPerPage}
                                                                rowsPerPageOptions={rowsPerPageOptions}
                                                            />
                                                        </Box>
                                                    :
                                                        <Box
                                                            display="flex"
                                                            justifyContent="flex-end"
                                                            alignItems="center"
                                                            sx={{
                                                                padding: '16px',
                                                                backgroundColor: '#f9f9f9',
                                                                borderRadius: '4px',
                                                                "@media (max-width: 600px)": { padding: '12px' }
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontFamily: 'Nunito Sans',
                                                                    fontWeight: '400',
                                                                    fontSize: '12px',
                                                                    lineHeight: '16px',
                                                                    marginRight: '16px',
                                                                }}
                                                            >
                                                                {`${count_sources} - ${rowsPerPage} of ${rowsPerPage}`}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                </Grid>
                                            </Grid>
                                        }
                                        {showSlider && <Slider />}
                                    </Box>

                                    {/* <FilterPopup open={filterPopupOpen} 
                                        onClose={handleFilterPopupClose} 
                                        onApply={handleApplyFilters} 
                                        jobTitles={jobTitles || []} 
                                        seniorities={seniorities || []} 
                                        departments={departments || []} />
                                    */}

                                </Box>
                            </Box>
                            {/* {showSlider && <Slider />} */}
                        </Box>
                    </Box>
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
