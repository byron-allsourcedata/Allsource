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
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
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


interface FetchDataParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page: number;
    rowsPerPage: number;
}

interface CompanyEmployeesProps {
    onBack: () => void
    companyName: string
    companyId: number
}

interface RenderCeil {
    value: any;
    visibility_status: string
}


const SourcesList: React.FC<CompanyEmployeesProps> = ({ onBack, companyName, companyId }) => {
    const router = useRouter();
    const { hasNotification } = useNotification();
    const [data, setData] = useState<any[]>([]);
    const [count_companies, setCount] = useState<number | null>(null);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [status, setStatus] = useState<string | null>(null);
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


    const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
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


    
    const fetchEmployeesCompany = async ({ sortBy, sortOrder, page, rowsPerPage }: FetchDataParams) => {
        try {
            setIsLoading(true);
            const accessToken = localStorage.getItem("token");
            if (!accessToken) {
                router.push('/signin');
                return;
            }

            // let url = `/company/employess?company_id=${companyId}&page=${page + 1}&per_page=${rowsPerPage}`;
            

    
            // const response = await axiosInstance.get(url);
            // const [employees, count] = response.data;

            const count = 1
            const employees = [{sources: "CSV File", type: "Intent", created_date: "01.01.1020", created_by: "01.01.1020", updated_date: "01.01.1020", number_of_customers: 23, matched_records: 23}]

    
            setData(Array.isArray(employees) ? employees : []);
            setCount(count || 0);
            setStatus("");
    
            const options = [15, 30, 50, 100, 200, 500];
            let RowsPerPageOptions = options.filter(option => option <= count);
            if (RowsPerPageOptions.length < options.length) {
                RowsPerPageOptions = [...RowsPerPageOptions, options[RowsPerPageOptions.length]];
            }
            setRowsPerPageOptions(RowsPerPageOptions);
            const selectedValue = RowsPerPageOptions.includes(rowsPerPage) ? rowsPerPage : 15;
            setRowsPerPage(selectedValue);

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

            let url = `/company/download-employees?company_id=${companyId}`;
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

            if (orderBy) {
                url += `&sort_by=${orderBy}&sort_order=${order}`;
            }

            // Join all parameters into a single query string
            if (params.length > 0) {
                url += `${params.join('&')}`;
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
                            <IconButton onClick={onBack}>
                                <ArrowBackIcon sx={{color: 'rgba(80, 82, 178, 1)'}}/>
                            </IconButton>
                            <Typography className='first-sub-title'>
                                Employee - {companyName}
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

                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 2, overflowX: 'auto', "@media (max-width: 600px)": { mb: 1 } }}>
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
                            if (filter.label === 'Department') {
                                const departments = filter.value.split(', ') || [];
                                const formattedRegions = departments.map(department => {
                                    const [name] = department.split('-');
                                    return name;
                                });
                                displayValue = formattedRegions.join(', ');
                            }
                            if (filter.label === 'Job Title') {
                                const jobTitles = filter.value.split(', ') || [];
                                const formattedRegions = jobTitles.map(jobTitle => {
                                    const [name] = jobTitle.split('-');
                                    return name;
                                });
                                displayValue = formattedRegions.join(', ');
                            }
                            if (filter.label === 'Seniority') {
                                const seniorities = filter.value.split(', ') || [];
                                const formattedRegions = seniorities.map(seniority => {
                                    const [name] = seniority.split('-');
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
                        <Grid container spacing={1} sx={{ flex: 1 }}>
                            <Grid item xs={12}>
                                
                            </Grid>
                        </Grid> 
                        {showSlider && <Slider />}
                    </Box>
                    <Popover
                        open={isOpen}
                        anchorEl={anchorEl}
                        onClose={handleClosePopover}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "left",
                        }}
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "left",
                        }}
                        PaperProps={{
                            sx: {
                                width: "184px",
                                height: "108px",
                                borderRadius: "4px 0px 0px 0px",
                                border: "0.2px solid #ddd",
                                padding: "8px",
                                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                            },
                        }}
                    >
                        <Box sx={{ maxHeight: "92px", overflowY: "auto", backgroundColor: 'rgba(255, 255, 255, 1)' }}>
                            {selectedJobTitle?.split(",").map((part, index) => (
                                <Typography
                                    key={index}
                                    variant="body2"
                                    className='second-sub-title'
                                    sx={{
                                        wordBreak: "break-word",
                                        backgroundColor: 'rgba(243, 243, 243, 1)',
                                        borderRadius: '4px',
                                        color: 'rgba(95, 99, 104, 1) !important',
                                        marginBottom: index < selectedJobTitle.split(",").length - 1 ? "4px" : 0, // Отступы между строками
                                    }}
                                >
                                    {part.trim()}
                                </Typography>
                            ))}
                        </Box>
                    </Popover>

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

export default SourcesList;
