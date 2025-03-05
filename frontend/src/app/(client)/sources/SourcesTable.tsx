"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { Box, Grid, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Drawer, List, ListItemText, ListItemButton, Popover } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axiosInstance from '../../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';
import { sourcesStyles } from './sourcesStyles';
import Slider from '../../../components/Slider';
import { SliderProvider } from '../../../context/SliderContext';
import { ChevronLeft, ChevronRight, MoreVert } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import DateRangeIcon from '@mui/icons-material/DateRange';
import FilterListIcon from '@mui/icons-material/FilterList';
// import FilterPopup from './CompanyEmployeesFilters';
import AudiencePopup from '@/components/AudienceSlider';
import SouthOutlinedIcon from '@mui/icons-material/SouthOutlined';
import NorthOutlinedIcon from '@mui/icons-material/NorthOutlined';
import dayjs from 'dayjs';
// import PopupDetails from './EmployeeDetails';
// import PopupChargeCredits from './ChargeCredits'
import CloseIcon from '@mui/icons-material/Close';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import Tooltip from '@mui/material/Tooltip';
import CustomToolTip from '@/components/customToolTip';
import CustomTablePagination from '@/components/CustomTablePagination';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNotification } from '@/context/NotificationContext';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { UpgradePlanPopup } from  '../components/UpgradePlanPopup'
import { sources } from 'next/dist/compiled/webpack/webpack';
import { useSSE } from '../../../context/SSEContext';


interface FetchDataParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page: number;
    rowsPerPage: number;
}

interface Sources {
    id: string
    name: string
    source_origin: string
    source_type: string
    created_date: Date
    updated_date: Date
    created_by: string
    total_records?: number
    matched_records?: number
}

interface SourceTableProps {
    setStatus: (status: string) => void
    status: string | null
    setData: (data: Sources[] | ((prevData: Sources[]) => Sources[])) => void;
    data: Sources[]
    setSources: (newState: boolean) => void
}

interface RenderCeil {
    value: any;
    visibility_status: string
}


const SourcesTable: React.FC<SourceTableProps> = ({ status, setStatus, data, setData, setSources }) => {
    const router = useRouter();
    const { hasNotification } = useNotification();
    const [count_companies, setCount] = useState<number | null>(null);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [showSlider, setShowSlider] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
    const dropdownOpen = Boolean(dropdownEl);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [filterPopupOpen, setFilterPopupOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState<{ label: string, value: string }[]>([]);
    const [openPopup, setOpenPopup] = React.useState(false);
    const [creditsChargePopup, setCreditsChargePopup] = React.useState(false);
    const [upgradePlanPopup, setUpgradePlanPopup] = React.useState(false);
    const [rowsPerPageOptions, setRowsPerPageOptions] = useState<number[]>([]);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [selectedJobTitle, setSelectedJobTitle] = React.useState<string | null>(null);
    const [employeeId, setEmployeeId] = useState<number | null>(null)
    const [selectedRowData, setSelectedRowData] = useState<Sources | null>(null);
    const { sourceProgress } = useSSE();


    const handleOpenPopover = (event: React.MouseEvent<HTMLElement>, rowData: Sources) => {
        setAnchorEl(event.currentTarget);
        setSelectedRowData(rowData);
    };

    const handleClosePopover = () => {
        setAnchorEl(null);
        setSelectedJobTitle(null);
    };

    const isOpen = Boolean(anchorEl);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleClosePopup = () => {
        setOpenPopup(false);
    };

    const installPixel = () => {
        router.push('/dashboard');
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


    const handleDeleteSource = async () => {
        setIsLoading(true);
        try {
            if (selectedRowData && selectedRowData.id){
                const response = await axiosInstance.delete(`/audience-sources/${selectedRowData.id}`)
                if (response.status === 200){
                    showToast("Source successfully deleted!")
                    setData((prevAccounts: Sources[]) =>
                        prevAccounts.filter((item: Sources) => item.id !== selectedRowData.id)
                    );
                }
            }
        } catch {
        } finally {
            setIsLoading(false);
        }
    }


    
    const fetchEmployeesCompany = async ({ sortBy, sortOrder, page, rowsPerPage }: FetchDataParams) => {
        try {
            setIsLoading(true);
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

            if (response.status === 200){
                const [employees, count] = response.data;
                setData(employees);
                setCount(count || 0);
            }



            // const count = 1
            // const count = 0
            // const employees = [{id: 1, name: "SVO", source: "CSV File", type: "Intent", created_date: "01.01.1020", created_by: "01.01.1020", updated_date: "01.01.1020", number_of_customers: 23, matched_records: 23}]
            // const employees: Sources[] = [];
    
            // setData(employees);
            // setCount(count || 0);
            setStatus("");
    
            // const options = [15, 30, 50, 100, 200, 500];
            // let RowsPerPageOptions = options.filter(option => option <= count_companies);
            // if (RowsPerPageOptions.length < options.length) {
            //     RowsPerPageOptions = [...RowsPerPageOptions, options[RowsPerPageOptions.length]];
            // }
            // setRowsPerPageOptions(RowsPerPageOptions);
            // const selectedValue = RowsPerPageOptions.includes(rowsPerPage) ? rowsPerPage : 15;
            // setRowsPerPage(selectedValue);

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
            }
        } finally {
            setIsLoading(false);
        }
    }

    interface FilterParams {
        regions: string[];
        searchQuery: string | null;
        department: Record<string, boolean>; 
        seniority: Record<string, boolean>; 
        jobTitle: Record<string, boolean>; 
    }

    useEffect(() => {
        fetchEmployeesCompany({
            sortBy: orderBy,
            sortOrder: order,
            page,
            rowsPerPage,
        });
    }, [orderBy, order, page, rowsPerPage, selectedFilters]);

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

    const handleDownload = async () => {
        setLoading(true);
        try {

            // let url = `/company/download-employees?company_id=${companyId}`;
            let params = [];

            if (selectedFilters.some(filter => filter.label === 'Regions')) {
                const regions = selectedFilters.find(filter => filter.label === 'Regions')?.value.split(', ') || [];
                if (regions.length > 0) {
                    params.push(`regions=${encodeURIComponent(regions.join(','))}`);
                }
            }

            const processMultiFilter = (label: string, paramName: string) => {
                const filter = selectedFilters.find(filter => filter.label === label)?.value;
                if (filter) {
                    params.push(`${paramName}=${encodeURIComponent(filter.split(', ').join(','))}`);
                }
            };
            processMultiFilter('Department', 'department'); 
            processMultiFilter('Seniority', 'seniority');
            processMultiFilter('Job Title', 'job_title');


            if (selectedFilters.some(filter => filter.label === 'Department')) {
                const regions = selectedFilters.find(filter => filter.label === 'Department')?.value.split(', ') || [];
                if (regions.length > 0) {
                    params.push(`department=${encodeURIComponent(regions.join(','))}`);
                }
            }

            if (selectedFilters.some(filter => filter.label === 'Search')) {
                const searchQuery = selectedFilters.find(filter => filter.label === 'Search')?.value || '';
                if (searchQuery) {
                    params.push(`search_query=${encodeURIComponent(searchQuery)}`);
                }
            }

            // if (orderBy) {
            //     url += `&sort_by=${orderBy}&sort_order=${order}`;
            // }

            // // Join all parameters into a single query string
            // if (params.length > 0) {
            //     url += `${params.join('&')}`;
            // }

            // const response = await axiosInstance.get(url, { responseType: 'blob' });

            // if (response.status === 200) {
            //     const url = window.URL.createObjectURL(new Blob([response.data]));
            //     const link = document.createElement('a');
            //     link.href = url;
            //     link.setAttribute('download', 'data.csv');
            //     document.body.appendChild(link);
            //     link.click();
            //     document.body.removeChild(link);
            //     window.URL.revokeObjectURL(url);
            // } else {
            //     console.error('Error downloading file:', response.statusText);
            // }
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

        const getSelectedValues = (obj: Record<string, boolean>): string => {
            return Object.entries(obj)
                .filter(([_, value]) => value)
                .map(([key]) => key)
                .join(', ');
        };

        // Map of filter conditions to their labels
        const filterMappings: { condition: boolean | string | string[] | number | null, label: string, value: string | ((f: any) => string) }[] = [
            { condition: filters.regions?.length, label: 'Regions', value: () => filters.regions!.join(', ') },
            { condition: filters.searchQuery?.trim() !== '', label: 'Search', value: filters.searchQuery || '' },
            { 
                condition: filters.seniority && Object.values(filters.seniority).some(Boolean), 
                label: 'Seniority', 
                value: () => getSelectedValues(filters.seniority!) 
            },
            { 
                condition: filters.jobTitle && Object.values(filters.jobTitle).some(Boolean), 
                label: 'Job Title', 
                value: () => getSelectedValues(filters.jobTitle!) 
            },
            { 
                condition: filters.department && Object.values(filters.department).some(Boolean), 
                label: 'Department', 
                value: () => getSelectedValues(filters.department!) 
            },
        ];


        filterMappings.forEach(({ condition, label, value }) => {
            if (condition) {
                newSelectedFilters.push({ label, value: typeof value === 'function' ? value(filters) : value });
            }
        });

        setSelectedFilters(newSelectedFilters);
    };

    const capitalizeTableCell  = (city: string) => {
        return city
            ?.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    const handleResetFilters = async () => {
        const url = `/company`;

        try {
            setIsLoading(true)
            sessionStorage.removeItem('filters-employee')
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
        
        const filters = JSON.parse(sessionStorage.getItem('filters-employee') || '{}');
        const valuesToDelete = filterToDelete.value.split(',').map(value => value.trim());
    
        switch (filterToDelete.label) {
            case 'Search':
                filters.searchQuery = '';
                break;
            case 'Job Title':
                Object.keys(filters.jobTitle).forEach(key => {
                    if (valuesToDelete.includes(key)) {
                        filters.jobTitle[key] = false;
                    }
                });
                break;
            case 'Department':
                Object.keys(filters.department).forEach(key => {
                    if (valuesToDelete.includes(key)) {
                        filters.department[key] = false;
                    }
                });
                break;
            case 'Seniority':
                Object.keys(filters.seniority).forEach(key => {
                    if (valuesToDelete.includes(key)) {
                        filters.seniority[key] = false;
                    }
                });
                break;
            default:
                break;
        }
        
        sessionStorage.setItem('filters-employee', JSON.stringify(filters));
    
        // Обновляем фильтры для применения
        const newFilters: FilterParams = {
            regions: updatedFilters.find(f => f.label === 'Regions') ? updatedFilters.find(f => f.label === 'Regions')!.value.split(', ') : [],
            searchQuery: updatedFilters.find(f => f.label === 'Search') ? updatedFilters.find(f => f.label === 'Search')!.value : '',
            department: Object.fromEntries(Object.keys(filters.department).map(key => [key, updatedFilters.some(f => f.label === 'Department' && f.value.includes(key))])),
            jobTitle: Object.fromEntries(Object.keys(filters.jobTitle).map(key => [key, updatedFilters.some(f => f.label === 'Job Title' && f.value.includes(key))])),
            seniority: Object.fromEntries(Object.keys(filters.seniority).map(key => [key, updatedFilters.some(f => f.label === 'Seniority' && f.value.includes(key))]))
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
                        {status === 'PIXEL_INSTALLATION_NEEDED' &&
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
                                    Install the pixel to unlock and gain valuable insights!
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
                        }
                        {status !== 'PIXEL_INSTALLATION_NEEDED' && data.length === 0 &&
                            <Box sx={centerContainerStyles}>
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
                                    onClick={() => setSources(false)}
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
                        {status !== 'PIXEL_INSTALLATION_NEEDED' && data.length !== 0 && 
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
                                            <TableHead>
                                                <TableRow>
                                                    {[
                                                        { key: 'name', label: 'Name' },
                                                        { key: 'source', label: 'Source' },
                                                        { key: 'type', label: 'Type'},
                                                        { key: 'created_date', label: 'Created Date' },
                                                        { key: 'created_by', label: 'Created By'},
                                                        { key: 'updated_date', label: 'Update Date'},
                                                        { key: 'number_of_customers', label: 'Number of Customers', sortable: true},
                                                        { key: 'matched_records', label: 'Matched Records', sortable: true},
                                                        { key: 'actions', label: 'Actions'}
                                                    ].map(({ key, label, sortable = false }) => (
                                                        <TableCell
                                                            key={key}
                                                            sx={{
                                                                ...sourcesStyles.table_column,
                                                                ...(key === 'employee_name' && {
                                                                    position: 'sticky',
                                                                    left: 0,
                                                                    zIndex: 10
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
                                                                                <NorthOutlinedIcon fontSize="inherit" />
                                                                            ) : (
                                                                                <SouthOutlinedIcon fontSize="inherit" />
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
                                            </TableHead>
                                            <TableBody>
                                                {data.map((row: any) => {
                                                    const progress = sourceProgress[row.id];
                                                    return (
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
                                                            {/* Name Column */}
                                                            <TableCell className="sticky-cell"
                                                                sx={{
                                                                    ...sourcesStyles.table_array, position: 'sticky', left: '0', zIndex: 9, backgroundColor: '#fff'

                                                                }} onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenPopup(true);
                                                                    setEmployeeId(row.id)

                                                                }}>
                                                                {row.source_name}
                                                            </TableCell>

                                                            {/* Source Column */}
                                                            <TableCell
                                                                sx={{ ...sourcesStyles.table_array, position: 'relative'}}
                                                            >
                                                                {row.source_origin}
                                                            </TableCell>

                                                            {/* Type Column */}
                                                            <TableCell
                                                                sx={{ ...sourcesStyles.table_array, position: 'relative'}}
                                                            >
                                                                {row.source_type}
                                                            </TableCell>

                                                            {/* Created date Column */}
                                                            <TableCell 
                                                                sx={{ ...sourcesStyles.table_array, position: 'relative'}}
                                                            >
                                                                {dayjs(row.created_date).isValid() ? dayjs(row.created_date).format('MMM D, YYYY') : '--'}
                                                            </TableCell>

                                                            {/* Created By Column */}
                                                            <TableCell 
                                                                sx={{...sourcesStyles.table_array, position: 'relative'}}
                                                            >
                                                                {row.created_by}
                                                            </TableCell>

                                                            {/* Update Date Column */}
                                                            <TableCell
                                                                sx={{ ...sourcesStyles.table_array, position: 'relative' }}
                                                            >
                                                                {dayjs(row.updated_date).isValid() ? dayjs(row.updated_date).format('MMM D, YYYY') : '--'}
                                                            </TableCell>

                                                            {/* Number of Customers Column */}
                                                            <TableCell
                                                                sx={{ ...sourcesStyles.table_array, position: 'relative' }}
                                                            >
                                                                {row.matched_records_status === "pending" 
                                                                ? progress?.total ??  "loading"
                                                                : row.total_records ?? "--"
                                                                }
                                                            </TableCell>

                                                            {/* Matched Records  Column */}
                                                            <TableCell
                                                                sx={{ ...sourcesStyles.table_array, position: 'relative' }}
                                                            >
                                                                {row.matched_records_status === "pending" 
                                                                ? `${((progress?.processed / progress?.total) * 100).toFixed(2)}%`
                                                                : row.matched_records ?? '--'}
                                                            </TableCell>

                                                            <TableCell sx={{ ...sourcesStyles.tableBodyColumn, paddingLeft: "16px", textAlign: 'center' }}>
                                                                <IconButton onClick={(event) => handleOpenPopover(event, row)} sx={{ ':hover': { backgroundColor: 'transparent' }}} >
                                                                    {/* <Image src='/more_horizontal.svg' alt='more' height={16.18} width={22.91} /> */}
                                                                    <MoreVert sx={{color: "rgba(32, 33, 36, 1)"}} height={8} width={24}/>
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
                                                                            width: '100%', maxWidth: 360}}
                                                                        >
                                                                        <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {
                                                                                handleClosePopover()
                                                                            }}>
                                                                            <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Download"/>
                                                                        </ListItemButton>
                                                                        <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {
                                                                                handleClosePopover()
                                                                                router.push(`/lookalikes/${row.id}/builder`)
                                                                        }}>
                                                                            <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Create Lookalike"/>
                                                                        </ListItemButton>
                                                                        <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {
                                                                                handleClosePopover()
                                                                                handleDeleteSource()
                                                                        }}>
                                                                            <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Remove"/>
                                                                        </ListItemButton>
                                                                    </List>
                                                                </Popover>
                                                            </TableCell>

                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    {count_companies && count_companies > 15 && <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: '24px 0 0', "@media (max-width: 600px)": { padding: '12px 0 0' } }}>
                                        <CustomTablePagination
                                            count={count_companies ?? 0}
                                            page={page}
                                            rowsPerPage={rowsPerPage}
                                            onPageChange={handleChangePage}
                                            onRowsPerPageChange={handleChangeRowsPerPage}
                                            rowsPerPageOptions={rowsPerPageOptions}
                                        />
                                    </Box>}
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
                    <PopupDetails open={openPopup}
                        onClose={handleClosePopup}
                        companyId={companyId}
                        updateEmployeeCallback={chargeCredit}
                        employeeId={employeeId}
                        employeeisUnlocked={employeeisUnlocked}
                        />
                    <PopupChargeCredits open={creditsChargePopup}
                        onClose={() => setCreditsChargePopup(false)}
                        updateEmployeeCallback={chargeCredit}
                        id={employeeId}
                    /> */}
                    <UpgradePlanPopup open={upgradePlanPopup}
                        handleClose={() => setUpgradePlanPopup(false)}
                        limitName={"contact credits"}
                    />
                </Box>
            </Box>
        </>
    );
};

export default SourcesTable;
