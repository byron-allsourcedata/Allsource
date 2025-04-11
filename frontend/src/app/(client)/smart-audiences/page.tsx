"use client";
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Box, Grid, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
        IconButton, List, ListItemText, ListItemButton, Popover, DialogActions, DialogContent, DialogContentText,
        LinearProgress, Chip, Tooltip, TextField } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axiosInstance from '../../../axios/axiosInterceptorInstance';
import { smartAudiences } from './smartAudiences';
import CreateSyncPopup from './components/SmartAudienceCreateSync';
import { SliderProvider } from '../../../context/SliderContext';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import dayjs from 'dayjs';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import CustomToolTip from '@/components/customToolTip';
import CustomTablePagination from '@/components/CustomTablePagination';
import { useNotification } from '@/context/NotificationContext';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import ThreeDotsLoader from '../sources/components/ThreeDotsLoader';
import ProgressBar from '../sources/components/ProgressLoader';
import { MoreVert } from '@mui/icons-material'
import { useSSE } from '../../../context/SSEContext';
import FilterPopup from './components/SmartAudienceFilter';
import DetailsPopup from './components/SmartAudienceDataSources'
import CloseIcon from '@mui/icons-material/Close';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CalendarPopup from "@/components/CustomCalendar";
import EditIcon from '@mui/icons-material/Edit';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import { textAlign } from '@mui/system';

interface Smarts {
    id: string
    name: string
    use_case_alias: string
    created_by: string
    created_at: Date
    total_records: number
    validated_records: number
    active_segment_records: number
    processed_active_segment_records: number
    status: string
    integrations: string[]
}

interface FetchDataParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page: number;
    rowsPerPage: number;
    appliedDates: { start: Date | null; end: Date | null };
}

interface FilterParams {
    searchQuery: string | null;
    selectedUseCases: Record<string, boolean>;
    selectedStatuses: Record<string, boolean>;
}

const getStatusStyle = (status: string) => {
    switch (status) {
        case 'Synced':
            return {
                background: 'rgba(234, 248, 221, 1)',
                color: 'rgba(43, 91, 0, 1)',
            };
        case 'Unvalidated':
            return {
                background: 'rgba(236, 236, 236, 1)',
                color: 'rgba(74, 74, 74, 1)',
            };
        case 'Ready':
            return {
                background: 'rgba(254, 243, 205, 1)',
                color: 'rgba(179, 151, 9, 1)',
            };
        case 'Validating':
            return {
                background: 'rgba(0, 129, 251, 0.2)',
                color: 'rgba(0, 129, 251, 1)',
            };
        case 'Data Syncing':
            return {
                background: 'rgba(0, 129, 251, 0.2)',
                color: 'rgba(0, 129, 251, 1)',
            };
        default:
            return {
                background: 'transparent',
                color: 'inherit',
            };
    }
};

const getUseCaseStyle = (status: string) => {
    switch (status) {
        case 'postal':
            return <Image src="./postal.svg" alt="google icon" width={20} height={20}/>
        case 'google':
            return <Image src="./google-ads.svg" alt="google icon" width={20} height={20}/>
        case 'meta':
            return <Image src="./meta.svg" alt="meta icon" width={20} height={20}/>
        case 'bing':
            return <Image src="./bing.svg" alt="bing icon" width={20} height={20}/>
        case 'tele_marketing':
            return <HeadsetMicOutlinedIcon />
        default:
            return <MailOutlinedIcon />
    }
};


const SmartAudiences: React.FC = () => {
    const router = useRouter();
    const { hasNotification } = useNotification();
    const { smartAudienceProgress, validationProgress } = useSSE();
    const [data, setData] = useState<Smarts[]>([]);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
    const [selectedRowData, setSelectedRowData] = useState<Smarts>();

    const [loading, setLoading] = useState(false);
    const [loaderForTable, setLoaderForTable] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [count_smarts_audience, setCount] = useState<number | null>(null);
    const [rowsPerPageOptions, setRowsPerPageOptions] = useState<number[]>([]);

    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);

    //xz cho eto
    const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
    const dropdownOpen = Boolean(dropdownEl);

    const [detailsPopupOpen, setDetailsPopupOpen] = useState(false);

    const [filterPopupOpen, setFilterPopupOpen] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState<{ label: string, value: string }[]>([]);

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const isOpeMorePopover = Boolean(anchorEl);
    const [isDownloadAction, setIsDownloadAction] = useState(false);

    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

    const [selectedDates, setSelectedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [appliedDates, setAppliedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [formattedDates, setFormattedDates] = useState<string>('');
    const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(null);
    const isCalendarOpen = Boolean(calendarAnchorEl);

    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [editedName, setEditedName] = useState<string>("");
    const [editPopoverAnchorEl, setEditPopoverAnchorEl] = useState<null | HTMLElement>(null);
    const [isEditPopoverOpen, setIsEditPopoverOpen] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const [dataSyncPopupOpen, setDataSyncPopupOpen] = useState(false);
    
    useEffect(() => {
        fetchSmarts({
            sortBy: orderBy,
            sortOrder: order,
            page,
            rowsPerPage,
            appliedDates: {
                start: appliedDates.start,
                end: appliedDates.end,
            }
        });
    }, [orderBy, order, page, rowsPerPage, appliedDates, selectedFilters]);

    const fetchSmartsMemoized = useCallback(() => {
        fetchSmarts({
            sortBy: orderBy,
            sortOrder: order,
            page,
            rowsPerPage,
            appliedDates: {
                start: appliedDates.start,
                end: appliedDates.end,
            }
        });
    }, [orderBy, order, page, rowsPerPage, appliedDates]);

    const clearPollingInterval = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            console.log("interval cleared");
        }
    }
    
    useEffect(() => {
        console.log("pooling");
    
        if (!intervalRef.current) {
            console.log("pooling started");
            intervalRef.current = setInterval(() => {
                const hasPending = data.some(item => item.active_segment_records !== item.processed_active_segment_records);
    
                if (hasPending) {
                    console.log("Fetching due to pending records");
                    fetchSmartsMemoized();
                } else {
                    console.log("No pending records, stopping interval");
                    clearPollingInterval()
                }
            }, 2000);
        }
    
        return () => {
            clearPollingInterval()
        };
    }, [data, fetchSmartsMemoized, page, rowsPerPage]);

    const fetchSmarts = async ({ sortBy, sortOrder, page, rowsPerPage, appliedDates }: FetchDataParams) => {
        try {
            !intervalRef.current
                ? isFirstLoad ? setLoading(true) : setLoaderForTable(true)
                : () => { }
    
            const accessToken = localStorage.getItem("token");
            if (!accessToken) {
                router.push('/signin');
                return;
            }
    
            let url = `/audience-smarts?&page=${page + 1}&per_page=${rowsPerPage}`;
    
            const startEpoch = appliedDates.start
                ? Math.floor(new Date(appliedDates.start.toISOString()).getTime() / 1000)
                : null;
            const endEpoch = appliedDates.end
                ? Math.floor(new Date(appliedDates.end.toISOString()).getTime() / 1000)
                : null;
            if (startEpoch !== null && endEpoch !== null) {
                url += `&from_date=${startEpoch}&to_date=${endEpoch}`;
            }
    
            if (sortBy) {
                setPage(0);
                url += `&sort_by=${sortBy}&sort_order=${sortOrder}`;
            }
    
            const savedFilters = sessionStorage.getItem('filtersBySmarts');
            let parsedFilters = null;
            if (savedFilters) {
                try {
                    parsedFilters = JSON.parse(savedFilters);
                } catch (error) {
                    console.error("Ошибка при разборе данных sessionStorage", error);
                }
            }

            const selectedStatuses = parsedFilters?.selectedStatuses || {};
            const selectedUseCases = parsedFilters?.selectedUseCases || {};
            const searchQuery = parsedFilters?.searchQuery || "";
    
            const processMultiFilter = (paramName: string, filterData: { [s: string]: unknown }) => {
                const toSnakeCase = (str: string) => str.trim().toLowerCase().replace(/\s+/g, '_');
            
                const filterValues = Object.entries(filterData)
                    .filter(([key, value]) => value)
                    .map(([key]) => toSnakeCase(key));
            
            
                if (filterValues.length) {
                    filterValues.forEach((value) => {
                        url += `&${paramName}=${encodeURIComponent(value)}`;
                    });
                }
            };
    
            processMultiFilter('use_cases', selectedUseCases);
            processMultiFilter('statuses', selectedStatuses);
    
            if (searchQuery) {
                url += `&search_query=${encodeURIComponent(searchQuery)}`;
            }
    
            const response = await axiosInstance.get(url);
            const { audience_smarts_list, count } = response.data;
            setData(audience_smarts_list);
            setCount(count || 0);
    
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
    };
    

    const handleCalendarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setCalendarAnchorEl(event.currentTarget);
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

    const handleDateLabelChange = (label: string) => {
    };

    const handleFilterPopupOpen = () => {
        setFilterPopupOpen(true);
    };

    const handleFilterPopupClose = () => {
        setFilterPopupOpen(false);
    };

    const handleDetailsPopupOpen = () => {
        setDetailsPopupOpen(true);
    };

    const handleDetailsPopupClose = () => {
        setDetailsPopupOpen(false);
    };

    const handleDataSyncPopupOpen = () => {
        setDataSyncPopupOpen(true);
    };

    const handleDataSyncPopupClose = () => {
        setDataSyncPopupOpen(false);
        setIsDownloadAction(false)
    };

    const handleOpenMorePopover = (event: React.MouseEvent<HTMLElement>, rowData: Smarts) => {
        setAnchorEl(event.currentTarget);
        setSelectedRowData(rowData);
    };

    const handleCloseMorePopover = () => {
        setAnchorEl(null);
    };

    const handleSortRequest = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleDeleteSmartAudience = async () => {
        setLoaderForTable(true);
        handleCloseMorePopover();
        handleCloseConfirmDialog();
        try {
            if (selectedRowData?.id) {
                const response = await axiosInstance.delete(`/audience-smarts/${selectedRowData.id}`);
                if (response.status === 200 && response.data) {
                    showToast("Smart audience successfully deleted!");
                    setCount((prev) => (prev ? prev - 1 : 0))
                    setData((prevAccounts: Smarts[]) =>
                        prevAccounts.filter((item: Smarts) => item.id !== selectedRowData.id)
                    );
                }
            }
        } catch {
            showErrorToast("Error deleting smart audience")
        } finally {
            setLoaderForTable(false);
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

    const handleRename = (event: React.MouseEvent<HTMLElement>, rowId: string, rowName: string) => {
        setEditingRowId(rowId);
        setEditedName(rowName)
        setEditPopoverAnchorEl(event.currentTarget);
        setIsEditPopoverOpen(true);
    };

    const handleCloseEditPopover = () => {
        setIsEditPopoverOpen(false);
        setEditPopoverAnchorEl(null);
    };

    const handleConfirmRename = async () => {
        if (!editingRowId || !editedName.trim()) return
        if (editedName.trim().length > 128) {
            showErrorToast("The new name is too long")
            return
        }
        setLoaderForTable(true)
        try {
            const response = await axiosInstance.put(`/audience-smarts/${editingRowId}`, {
                new_name: editedName
            });
            if (response.status === 200) {
                showToast("Smart audience has been successfully updated")
                setData((prevAccounts: Smarts[]) =>
                    prevAccounts.map((item: Smarts) =>
                        item.id === editingRowId ? { ...item, name: editedName } : item
                    )
                );
            }
            else {
                showErrorToast("An error occurred while trying to rename smart audience")
            }
            setEditingRowId(null);
            setIsEditPopoverOpen(false);
        } catch {
        } finally {
            setLoaderForTable(false)
        }
        
    };

    useEffect(() => {
        const storedFilters = sessionStorage.getItem('filtersBySmarts');

        if (storedFilters) {
            const filters = JSON.parse(storedFilters);

            handleApplyFilters(filters);
        }
    }, []);

    const getSelectedValues = (obj: Record<string, boolean>): string => {
        return Object.entries(obj)
            .filter(([_, value]) => value)
            .map(([key]) => key)
            .join(', ');
    };

    const handleApplyFilters = (filters: FilterParams) => {
        const newSelectedFilters: { label: string; value: string }[] = [];


        const filterMappings: { condition: boolean | string | string[] | number | null, label: string, value: string | ((f: any) => string) }[] = [
            {
                condition: filters.selectedStatuses && Object.values(filters.selectedStatuses).some(Boolean),
                label: 'Status',
                value: () => getSelectedValues(filters.selectedStatuses!)
            },
            {
                condition: filters.selectedUseCases && Object.values(filters.selectedUseCases).some(Boolean),
                label: 'Use Case',
                value: () => getSelectedValues(filters.selectedUseCases!)
            },
            { condition: filters.searchQuery, label: 'Search', value: filters.searchQuery! }
        ];

        filterMappings.forEach(({ condition, label, value }) => {
            if (condition) {
                newSelectedFilters.push({ label, value: typeof value === 'function' ? value(filters) : value });
            }
        });

        setSelectedFilters(newSelectedFilters);
    };

    const handleResetFilters = () => {
        setSelectedFilters([]);
        setSelectedDates({start: null, end: null})
        setAppliedDates({ start: null, end: null })
        setFormattedDates('')

        sessionStorage.removeItem('filtersBySmarts');
    };


    const handleDeleteFilter = (filterToDelete: { label: string; value: string }) => {
        // setSelectedFilters([]);
        setSelectedDates({start: null, end: null})
        setAppliedDates({ start: null, end: null })
        setFormattedDates('')
        let updatedFilters = selectedFilters.filter(filter => filter.label !== filterToDelete.label);
        setSelectedFilters(updatedFilters);
    
        let filters = JSON.parse(sessionStorage.getItem('filtersBySmarts') || '{}');
    
        switch (filterToDelete.label) {
            case 'Search':
                filters.searchQuery = '';
                break;
            case 'Use Case':
                filters.selectedUseCases = [];
                break;
            case 'Status':
                filters.selectedStatuses = [];
                break;
            default:
                break;
        }
    
        sessionStorage.setItem('filtersBySmarts', JSON.stringify(filters));
    
        updatedFilters = updatedFilters.filter(f => !['From Date', 'To Date', 'Date Range'].includes(f.label));
        setSelectedFilters(updatedFilters);
    
        if (updatedFilters.length === 0) {
            setSelectedFilters([]);
        }
    
        const newFilters: FilterParams = {
            searchQuery: updatedFilters.find(f => f.label === 'Search') ? updatedFilters.find(f => f.label === 'Search')!.value : '',
            selectedUseCases: Object.fromEntries(Object.keys(filters.selectedUseCases).map(key => [key, updatedFilters.some(f => f.label === 'Use Case' && f.value.includes(key))])),
            selectedStatuses: Object.fromEntries(Object.keys(filters.selectedStatuses).map(key => [key, updatedFilters.some(f => f.label === 'Status' && f.value.includes(key))]))
        };
    
        handleApplyFilters(newFilters);
    };    


    const truncateText = (text: string, maxLength: number) => {
        return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
    };

    const preRenderStatus = (status: string) => {
        if (status === "N_a") {
            return "Ready"
        }
        return status
    }


    return (
        <>
            {loading && (
                <CustomizedProgressBar />
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
                                    Smart Audience
                                </Typography>
                                <CustomToolTip title={'Discover AI-powered Smart Audiences based on your sorces and lookalikes.'} linkText='Learn more' linkUrl='https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/contacts' />
                            </Box>
                            <Box sx={{
                                display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px', pt: '4px', pr: 2,
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
                                        router.push("/smart-audiences/builder")
                                    }}
                                >
                                    Generate Smart Audience
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
                                        maxHeight: '40px',
                                        maxWidth:'40px',
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
                                    disabled={data?.length === 0}
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
                                        opacity: data?.length === 0 ? '0.5' : '1',
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
                                        color: formattedDates ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)',
                                        "@media (max-width: 600px)": {
                                            display: 'none'
                                        },
                                    }}>
                                        {formattedDates}
                                    </Typography>
                                </Button>
                            </Box>
                        </Box>

                        <Box sx={{
                            flex: 1, display: 'flex', flexDirection: 'column', pr: 2, overflow: 'auto', maxWidth: '100%',
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
                                        flex: 1, display: 'flex', flexGrow:1, flexDirection: 'column', maxWidth: '100%', pl: 0, pr: 0, pt: '14px',
                                        '@media (max-width: 900px)': {
                                            pt: '2px',
                                            pb: '18px'
                                        }
                                    }}>
                                        {data.length === 0 &&
                                            <Box sx={smartAudiences.centerContainerStyles}>
                                                <Typography variant="h5" sx={{
                                                    mb: 3,
                                                    fontFamily: 'Nunito Sans',
                                                    fontSize: "20px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "600",
                                                    lineHeight: "28px"
                                                }}>
                                                    Get Started with Your First Audience 
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
                                                    Supercharge your ad campaigns with high-performing lookalikes. Target those most likely to purchase, optimize your ad spend, and scale your profitability like never before.
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    onClick={() => router.push("/smart-audiences/builder")}
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
                                                    Generate Smart Audience
                                                </Button>
                                            </Box>
                                        }
                                        {data.length !== 0 &&
                                            <Grid container spacing={1} sx={{ flex: 1 }}>
                                                <Grid item xs={12} sx={{display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
                                                    <TableContainer
                                                        component={Paper}
                                                        sx={{
                                                            border: '1px solid rgba(235, 235, 235, 1)',
                                                            overflowX: 'auto',
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
                                                            <TableHead sx={{ position: "relative" }}>
                                                                <TableRow>
                                                                    {[
                                                                        { key: 'name', label: 'Smart Audience Name' },
                                                                        { key: 'use_case', label: 'Use Case' },
                                                                        { key: 'validations', label: 'Validations' },
                                                                        { key: 'created_date', label: 'Created', sortable: true },
                                                                        { key: 'number_of_customers', label: 'Total Universe', sortable: true },
                                                                        { key: 'active_segment_records', label: 'Active Segment', sortable: true },
                                                                        { key: 'status', label: 'Status' },
                                                                        { key: 'actions', label: 'Actions' }
                                                                    ].map(({ key, label, sortable = false }) => (
                                                                        <TableCell
                                                                            key={key}
                                                                            sx={{
                                                                                ...smartAudiences.table_column,
                                                                                borderBottom: 0,
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
                                                                                <Typography variant="body2" sx={{ ...smartAudiences.table_column, borderRight: '0' }}>{label}</Typography>
                                                                                {sortable && (
                                                                                    <IconButton size="small">
                                                                                        {orderBy === key ? (
                                                                                            order === 'asc' ? (
                                                                                                <ArrowUpwardRoundedIcon fontSize="inherit" />
                                                                                            ) : (
                                                                                                <ArrowDownwardRoundedIcon fontSize="inherit" />
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
                                                                {loaderForTable 
                                                                    ? (
                                                                        <TableRow sx={{
                                                                            position: "sticky",
                                                                            top: '56px',
                                                                            zIndex: 11,
                                                                        }}>
                                                                            <TableCell colSpan={9} sx={{ p: 0, pb: "1px" }}>
                                                                                <LinearProgress variant="indeterminate" sx={{ width: "100%", height: "2px", position: "absolute" }} />
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )
                                                                    : (
                                                                        <TableRow sx={{
                                                                            position: "sticky",
                                                                            top: '56px',
                                                                            zIndex: 11,
                                                                        }}>
                                                                            <TableCell colSpan={9} sx={{ p: 0, pb: "1px", backgroundColor: "rgba(235, 235, 235, 1)", borderColor: "rgba(235, 235, 235, 1)" }}/>
                                                                        </TableRow>
                                                                    )
                                                                }
                                                            </TableHead>
                                                            <TableBody>
                                                                {data.map((row: Smarts, index) => {
                                                                    const progress = smartAudienceProgress[row.id];
                                                                    const progressValidation = validationProgress[row.id];
                                                                    return (
                                                                        <TableRow
                                                                            key={row.id}
                                                                            selected={selectedRows.has(row.id)}
                                                                            sx={{
                                                                                backgroundColor: selectedRows.has(row.id) && !loaderForTable ? 'rgba(247, 247, 247, 1)' : '#fff',
                                                                                borderTop: index === 0 ? 0 : "default",
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
                                                                                    ...smartAudiences.table_array, position: 'sticky', left: '0', zIndex: 9, backgroundColor: loaderForTable ? 'transparent' : '#fff', '&:hover .edit-icon': { opacity: 1, pointerEvents: 'auto' }
                                                                                }}>
                                                                                <Box sx={{display: 'flex', justifyContent: "space-between"}}>
                                                                                    <Tooltip
                                                                                        title={
                                                                                            <Box onClick={ () => {
                                                                                                    setSelectedRowData(row)
                                                                                                    handleDetailsPopupOpen()
                                                                                                }} 
                                                                                                sx={{ backgroundColor: '#fff', margin: 0, padding: 0, display: 'flex', flexDirection: 'row', cursor: "pointer", alignItems: 'center', }}>
                                                                                            <Typography className='table-data' component='div'style={{color: "rgba(80, 82, 178, 1)"}} sx={{ fontSize: '12px !important' }}>
                                                                                                {row.name}
                                                                                            </Typography>
                                                                                            </Box>
                                                                                        }
                                                                                        sx={{marginLeft:'0.5rem !important'}}
                                                                                        componentsProps={{
                                                                                            tooltip: {
                                                                                                sx: {
                                                                                                    backgroundColor: '#fff',
                                                                                                    color: '#000',
                                                                                                    boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.12)',
                                                                                                    border: '0.2px solid rgba(255, 255, 255, 1)',
                                                                                                    borderRadius: '4px',
                                                                                                    maxHeight: '100%',
                                                                                                    maxWidth: '500px',
                                                                                                    padding: '11px 10px',
                                                                                                    marginLeft: '0.5rem !important',
                                                                                                },
                                                                                            },
                                                                                        }}
                                                                                        placement='right'
                                                                                    >
                                                                                        <Typography className='table-data'
                                                                                            style={{
                                                                                                color: "rgba(80, 82, 178, 1)"
                                                                                            }}
                                                                                            sx={{
                                                                                                whiteSpace: 'nowrap',
                                                                                                overflow: 'hidden',
                                                                                                textOverflow: 'ellipsis',
                                                                                                maxWidth:'150px',
                                                                                            }}
                                                                                        >
                                                                                            {truncateText(row.name, 20)}
                                                                                        </Typography>
                                                                                    </Tooltip>
                                                                                    <IconButton
                                                                                        className="edit-icon"
                                                                                        sx={{
                                                                                            pl: 0, pr: 0, pt: 0.25, pb: 0.25,
                                                                                            margin: 0,
                                                                                            opacity: 0,
                                                                                            pointerEvents: 'none',
                                                                                            transition: 'opacity 0.2s ease-in-out',
                                                                                            '@media (max-width: 900px)': {
                                                                                                opacity: 1
                                                                                            }
                                                                                        }}
                                                                                        onClick={(event) => handleRename(event, row.id, row.name)}
                                                                                    >
                                                                                        <EditIcon sx={{ maxHeight: "18px" }} />
                                                                                    </IconButton>
                                                                                </Box>
                                                                                {/* {row.name} */}
                                                                            </TableCell>

                                                                            <Popover
                                                                                open={isEditPopoverOpen}
                                                                                anchorEl={editPopoverAnchorEl}
                                                                                onClose={handleCloseEditPopover}
                                                                                anchorOrigin={{
                                                                                    vertical: "center",
                                                                                    horizontal: "center",
                                                                                }}
                                                                                transformOrigin={{
                                                                                    vertical: "top",
                                                                                    horizontal: "left",
                                                                                }}
                                                                                slotProps={{
                                                                                    paper: {
                                                                                        sx: {
                                                                                            width: "15.875rem",
                                                                                            boxShadow: 0,
                                                                                            borderRadius: "4px",
                                                                                            border: "0.5px solid rgba(175, 175, 175, 1)",

                                                                                        },
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <Box sx={{ p: 2 }}>
                                                                                    <TextField
                                                                                        value={editedName}
                                                                                        onChange={(e) => setEditedName(e.target.value)}
                                                                                        variant="outlined"
                                                                                        label='Smart Audience Name'
                                                                                        size="small"
                                                                                        fullWidth
                                                                                        sx={{
                                                                                            "& label.Mui-focused": {
                                                                                                color: "rgba(80, 82, 178, 1)",
                                                                                            },
                                                                                            "& .MuiOutlinedInput-root:hover fieldset": {
                                                                                                color: "rgba(80, 82, 178, 1)",
                                                                                            },
                                                                                            "& .MuiOutlinedInput-root": {
                                                                                                "&:hover fieldset": {
                                                                                                    borderColor: "rgba(80, 82, 178, 1)",
                                                                                                    border: "1px solid rgba(80, 82, 178, 1)",
                                                                                                },
                                                                                                "&.Mui-focused fieldset": {
                                                                                                    borderColor: "rgba(80, 82, 178, 1)",
                                                                                                    border: "1px solid rgba(80, 82, 178, 1)",
                                                                                                },
                                                                                            },
                                                                                        }}
                                                                                        InputProps={{
                                                                                            style: {
                                                                                                fontFamily: "Roboto",
                                                                                                fontSize: "14px",
                                                                                            },
                                                                                        }}
                                                                                        InputLabelProps={{
                                                                                            style: {
                                                                                                fontSize: "14px",
                                                                                                fontFamily: "Roboto",
                                                                                            },
                                                                                        }}
                                                                                    />
                                                                                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                                                                                        <Button
                                                                                            onClick={handleCloseEditPopover}
                                                                                            sx={{
                                                                                                backgroundColor: "#fff",
                                                                                                color: "rgba(80, 82, 178, 1) !important",
                                                                                                fontSize: "14px",
                                                                                                textTransform: "none",
                                                                                                padding: "0.75em 1em",
                                                                                                maxWidth: "50px",
                                                                                                maxHeight: "30px",
                                                                                                mr: 0.5,
                                                                                                "&:hover": {
                                                                                                    backgroundColor: "#fff",
                                                                                                    boxShadow: "0 0px 1px 1px rgba(0, 0, 0, 0.3)",
                                                                                                },
                                                                                            }}
                                                                                        >
                                                                                            <Typography className="second-sub-title" sx={{ color: 'rgba(80, 82, 178, 1) !important' }}>Cancel</Typography>
                                                                                        </Button>
                                                                                        <Button
                                                                                            onClick={() => {
                                                                                                handleConfirmRename();
                                                                                                handleCloseEditPopover();
                                                                                            }}
                                                                                            sx={{
                                                                                                backgroundColor: "#fff",
                                                                                                color: "rgba(80, 82, 178, 1) !important",
                                                                                                fontSize: "14px",
                                                                                                textTransform: "none",
                                                                                                padding: "0.75em 1em",
                                                                                                maxWidth: "50px",
                                                                                                maxHeight: "30px",
                                                                                                "&:hover": {
                                                                                                    backgroundColor: "#fff",
                                                                                                    boxShadow: "0 0px 1px 1px rgba(0, 0, 0, 0.3)",
                                                                                                },
                                                                                            }}
                                                                                        >
                                                                                            <Typography className="second-sub-title" sx={{ color: 'rgba(80, 82, 178, 1) !important' }}>Save</Typography>
                                                                                        </Button>
                                                                                    </Box>
                                                                                </Box>
                                                                            </Popover>

                                                                            {/* Use Case Column */}
                                                                            <TableCell
                                                                                sx={{ ...smartAudiences.table_array, position: 'relative', textAlign: "center" }}
                                                                            >
                                                                                {getUseCaseStyle(row.use_case_alias)}
                                                                            </TableCell>

                                                                            {/* Validations Column */}
                                                                            <TableCell
                                                                                sx={{ ...smartAudiences.table_array, position: 'relative', textAlign: "center" }}
                                                                            >
                                                                            {row.status === "unvalidated" 
                                                                                ? <Image src="./danger_yellow.svg" alt='danger' width={20} height={20}/>
                                                                                : row.status === "n_a"
                                                                                    ? "N/A"
                                                                                    : row.validated_records === 0 && row.status === "validating" && !progressValidation?.total
                                                                                        ? <Box sx={{display: "flex", justifyContent: "center"}}><ThreeDotsLoader /></Box> 
                                                                                        : progressValidation?.total > row.validated_records
                                                                                            ? progressValidation?.total.toLocaleString('en-US')
                                                                                            : row.validated_records.toLocaleString('en-US')}
                                                                            </TableCell>
                                                                            {/* Created Column */}
                                                                            <TableCell
                                                                                sx={{ ...smartAudiences.table_array, position: 'relative'}}
                                                                            >
                                                                                <Box>{dayjs(row.created_at).format('MMM D, YYYY')}</Box>
                                                                                <Box>{row.created_by}</Box>
                                                                            </TableCell>

                                                                            {/* Total Universe Column */}
                                                                            <TableCell
                                                                                sx={{ ...smartAudiences.table_array, position: 'relative'}}
                                                                            >
                                                                                {row.total_records.toLocaleString('en-US')}
                                                                            </TableCell>

                                                                            {/* Active Segment Column */}
                                                                            <TableCell
                                                                                sx={{ ...smartAudiences.table_array, position: 'relative' }}
                                                                            >
                                                                                {(progress?.processed && progress?.processed === row?.active_segment_records) || (row?.processed_active_segment_records ===  row?.active_segment_records && (row.status === "unvalidated"  || row?.processed_active_segment_records !== 0))
                                                                                    ? row.active_segment_records.toLocaleString('en-US')
                                                                                    : row?.processed_active_segment_records > progress?.processed
                                                                                        ? <ProgressBar progress={{ total: row?.active_segment_records, processed: row?.processed_active_segment_records}} />
                                                                                        : <ProgressBar progress={{...progress, total: row.active_segment_records}} />
                                                                                }
                                                                            </TableCell>

                                                                            {/* Status Column */}
                                                                            <TableCell
                                                                                sx={{ ...smartAudiences.table_array, position: 'relative' }}
                                                                            >
                                                                                <Box sx={{ display: "flex", justifyContent: "center" }}>
                                                                                    <Typography component="div" sx={{
                                                                                        width: "100px",
                                                                                        margin: 0,
                                                                                        background: getStatusStyle(
                                                                                            progressValidation?.total 
                                                                                            ? "Ready"
                                                                                            : preRenderStatus(row.status.charAt(0).toUpperCase() + row.status.slice(1))
                                                                                        ).background,
                                                                                        padding: '3px 8px',
                                                                                        borderRadius: '2px',
                                                                                        fontFamily: 'Roboto',
                                                                                        fontSize: '12px',
                                                                                        fontWeight: '400',
                                                                                        lineHeight: '16px',
                                                                                        textAlign: "center",
                                                                                        color: getStatusStyle(
                                                                                            progressValidation?.total 
                                                                                            ? "Ready"
                                                                                            : preRenderStatus(row.status.charAt(0).toUpperCase() + row.status.slice(1))
                                                                                        ).color,
                                                                                    }}>
                                                                                        {progressValidation?.total 
                                                                                            ? "Ready"
                                                                                            : preRenderStatus(row.status.charAt(0).toUpperCase() + row.status.slice(1))
                                                                                            }
                                                                                    </Typography>
                                                                                </Box>
                                                                            </TableCell>

                                                                            <TableCell sx={{ ...smartAudiences.tableBodyColumn, paddingLeft: "16px", textAlign: 'center' }}>
                                                                                <IconButton onClick={(event) => handleOpenMorePopover(event, row)} sx={{ ':hover': { backgroundColor: 'transparent' } }} >
                                                                                    <MoreVert sx={{ color: "rgba(32, 33, 36, 1)" }} height={8} width={24} />
                                                                                </IconButton>

                                                                                <Popover
                                                                                    open={isOpeMorePopover}
                                                                                    anchorEl={anchorEl}
                                                                                    onClose={handleCloseMorePopover}
                                                                                    slotProps={{
                                                                                        paper: {
                                                                                            sx: {
                                                                                                boxShadow: 0,
                                                                                                borderRadius: "4px",
                                                                                                border: "0.5px solid rgba(175, 175, 175, 1)",
                                                    
                                                                                            },
                                                                                        }}}
                                                                                        anchorOrigin={{
                                                                                            vertical: "center",
                                                                                            horizontal: "center",
                                                                                        }}
                                                                                    transformOrigin={{
                                                                                        vertical: "top",
                                                                                        horizontal: "right",
                                                                                    }}
                                                                                    
                                                                                >
                                                                                    <List
                                                                                        sx={{
                                                                                            width: '100%', maxWidth: 360, boxShadow: 'none'
                                                                                        }}
                                                                                    >
                                                                                        <ListItemButton disabled={!(selectedRowData?.status === "ready" || selectedRowData?.status === "n_a")} 
                                                                                                        sx={{ padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)" } }} 
                                                                                                        onClick={() => {
                                                                                                            handleCloseMorePopover()
                                                                                                            handleDataSyncPopupOpen()
                                                                                                        }}>
                                                                                            <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Create Sync" />
                                                                                        </ListItemButton>
                                                                                        <ListItemButton disabled={(selectedRowData?.active_segment_records !== selectedRowData?.processed_active_segment_records || selectedRowData?.status === "unvalidated" || selectedRowData?.status === "validating")} 
                                                                                                        sx={{ padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)" } }} 
                                                                                                        onClick={() => {
                                                                                                            setIsDownloadAction(true)
                                                                                                            handleCloseMorePopover()
                                                                                                            handleDataSyncPopupOpen()
                                                                                                        }}>
                                                                                            <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Download" />
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
                                                                                            slotProps={{
                                                                                                paper: {
                                                                                                    sx: {
                                                                                                        padding: '0.125rem',
                                                                                                        width: '15.875rem',
                                                                                                        boxShadow: 0,
                                                                                                        borderRadius: '8px',
                                                                                                        border: '0.5px solid rgba(175, 175, 175, 1)'
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <Typography className="first-sub-title" sx={{ paddingLeft: 2, pt: 1, pb: 0 }}>
                                                                                                Confirm Deletion
                                                                                            </Typography>
                                                                                            <DialogContent sx={{ padding: 2 }}>
                                                                                                <DialogContentText className="table-data">
                                                                                                    Are you sure you want to delete this smart audience?
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
                                                                                                    onClick={handleDeleteSmartAudience}
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
                                                    {count_smarts_audience && count_smarts_audience > 10
                                                        ?
                                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: '24px 0 0', "@media (max-width: 600px)": { padding: '12px 0 0' } }}>
                                                            <CustomTablePagination
                                                                count={count_smarts_audience ?? 0}
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
                                                                backgroundColor: '#fff',
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
                                                                {`1 - ${count_smarts_audience} of ${count_smarts_audience}`}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                </Grid>
                                            </Grid>
                                        }
                                    </Box>

                                    <CreateSyncPopup 
                                        open={dataSyncPopupOpen}
                                        id={selectedRowData?.id}
                                        activeSegmentRecords={selectedRowData?.active_segment_records}
                                        onClose={handleDataSyncPopupClose}
                                        integrationsList={selectedRowData?.integrations}
                                        isDownloadAction={isDownloadAction}
                                        setIsPageLoading={setLoading}
                                    />
                                    <FilterPopup open={filterPopupOpen}
                                        onClose={handleFilterPopupClose}
                                        onApply={handleApplyFilters}
                                    />
                                    <DetailsPopup open={detailsPopupOpen}
                                        onClose={handleDetailsPopupClose}
                                        id={selectedRowData?.id}
                                        name={selectedRowData?.name}
                                    />
                                    <CalendarPopup
                                        anchorEl={calendarAnchorEl}
                                        open={isCalendarOpen}
                                        onClose={handleCalendarClose}
                                        onDateChange={handleDateChange}
                                        onApply={handleApply}
                                        onDateLabelChange={handleDateLabelChange}
                                        selectedDates={selectedDates}
                                    />

                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

const SmartAudiencesPage: React.FC = () => {
    return (
        <Suspense fallback={<CustomizedProgressBar />}>
            <SliderProvider>
                <SmartAudiences />
            </SliderProvider>
        </Suspense>
    );
};

export default SmartAudiencesPage;
