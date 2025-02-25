"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { Box, Grid, Typography, TextField, Button, FormControl, MenuItem, Select, InputLabel, SelectChangeEvent, Paper, IconButton, Chip, Drawer, List, ListItemText, ListItemButton, Popover } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axiosInstance from '../../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';
import { sourcesStyles } from './sourcesStyles';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import LanguageIcon from '@mui/icons-material/Language';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Slider from '../../../components/Slider';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
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
import Link from '@mui/material/Link';


interface FetchDataParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page: number;
    rowsPerPage: number;
}

interface CompanyEmployeesProps {
}

interface RenderCeil {
    value: any;
    visibility_status: string
}

interface Row {
    id: number;
    type: string;
    value: string;
    selectValue?: string;
    canDelete?: boolean;
}


const SourcesImport: React.FC<CompanyEmployeesProps> = ({ }) => {
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
    const [file, setFile] = useState<File | null>(null);
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
    const [sourceType, setSourceType] = useState<string>("");
    const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
    const [sourceName, setSourceName] = useState<string>("");
    const [sourceMethod, setSourceMethod] = useState<number>(0);

    const deleteOpen = Boolean(deleteAnchorEl);
    const deleteId = deleteOpen ? 'delete-popover' : undefined;
    const defaultRows: Row[] = [
        { id: 1, type: 'Email', value: '' },
        { id: 2, type: 'Phone number', value: '' },
        { id: 3, type: 'Last Name', value: 'Last Name' },
        { id: 4, type: 'First Name', value: 'First Name' },
        { id: 5, type: 'Gender', value: 'Gender' },
        { id: 6, type: 'Age', value: 'Age' },
        { id: 7, type: 'Order Amount', value: 'Order Amount' },
        { id: 8, type: 'State', value: 'State' },
        { id: 9, type: 'City', value: 'City' },
        { id: 10, type: 'Zip Code', value: 'Zip Code' }
    ];
    const [rows, setRows] = useState<Row[]>(defaultRows);

    const handleMapListChange = (id: number, field: 'value' | 'selectValue', value: string) => {
        setRows(rows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const handleClickOpen = (event: React.MouseEvent<HTMLElement>, id: number) => {
        setDeleteAnchorEl(event.currentTarget);  // Set the current target as the anchor
        setSelectedRowId(id);  // Set the ID of the row to delete
    };

    const handleChange = (event: SelectChangeEvent<string>) => {
        setSourceType(event.target.value);
    };

    const handleDeleteClose = () => {
        setDeleteAnchorEl(null);
        setSelectedRowId(null);
    };


    const handleDelete = () => {
        if (selectedRowId !== null) {
            setRows(rows.filter(row => row.id !== selectedRowId));
            handleDeleteClose();
        }
    };

    const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClosePopover = () => {
        setAnchorEl(null);
        setSelectedJobTitle(null);
    };

    const isOpen = Boolean(anchorEl);

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

    const handleDeleteFile = () => {
        
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
                    <Box sx={{
                        flex: 1, gap: 2, display: 'flex', flexDirection: 'column', maxWidth: '100%', pl: 0, pr: 0, pt: '14px', pb: '20px',
                        '@media (max-width: 900px)': {
                            pt: '2px',
                            pb: '18px'
                        }
                    }}>
                        <Box sx={{display: "flex", flexDirection: "column", gap: 2, flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px" }}>
                            <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                <Typography sx={{fontFamily: "Nunito Sans", fontSize: "16px"}}>Choose your data source</Typography>
                                <Typography sx={{fontFamily: "Nunito Sans", fontSize: "12px", color: "rgba(95, 99, 104, 1)"}}>Choose your data source, and let Maximia AI Audience Algorithm identify high-intent leads and create lookalike audiences to slash your acquisition costs.</Typography>
                            </Box>
                            <Box sx={{display: "flex",  gap: 2, "@media (max-width: 420px)": { display: "grid", gridTemplateColumns: "1fr" }}}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Image src="upload-minimalistic.svg" alt="upload" width={20} height={20} />}
                                    sx={{
                                        fontFamily: "Nunito Sans",
                                        border: "1px solid rgba(208, 213, 221, 1)",
                                        borderRadius: "4px",
                                        color: "rgba(32, 33, 36, 1)",
                                        textTransform: "none",
                                        fontSize: "14px",
                                        padding: "8px 12px",
                                        backgroundColor: sourceMethod === 1 ? "rgba(246, 248, 250, 1)" : "#fff",
                                        ":hover": {
                                            borderColor: "#1C3A57",
                                            backgroundColor: "rgba(236, 238, 241, 1)"
                                        },
                                    }}
                                    onClick={() => setSourceMethod(1)}
                                    >
                                    Manually upload
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<Image src="website-icon.svg" alt="upload" width={20} height={20} />}
                                    sx={{
                                        fontFamily: "Nunito Sans",
                                        border: "1px solid rgba(208, 213, 221, 1)",
                                        borderRadius: "4px",
                                        color: "rgba(32, 33, 36, 1)",
                                        textTransform: "none",
                                        fontSize: "14px",
                                        padding: "8px 12px",
                                        backgroundColor: sourceMethod === 2 ? "rgba(246, 248, 250, 1)" : "#fff",
                                        ":hover": {
                                            borderColor: "#1C3A57",
                                            backgroundColor: "rgba(236, 238, 241, 1)"
                                        },
                                    }}
                                    onClick={() => setSourceMethod(2)}
                                    >
                                    Website - Pixel
                                </Button>
                            </Box>
                        </Box>
                        <Box sx={{display: sourceMethod === 0 ? "flex" : "flex", flexDirection: "column", gap: 2, flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px" }}>
                            <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                <Typography sx={{fontFamily: "Nunito Sans", fontSize: "16px"}}>Select your Source File</Typography>
                                <Typography sx={{fontFamily: "Nunito Sans", fontSize: "12px", color: "rgba(95, 99, 104, 1)"}}>Please upload a CSV file containing the list of customers who have successfully completed an order on your website.</Typography>
                            </Box>
                            <FormControl
                                variant="outlined"
                                >
                                <Select
                                    value={sourceType}
                                    onChange={handleChange}
                                    displayEmpty
                                    sx={{   
                                        ...sourcesStyles.text,
                                        width: "316px",
                                        borderRadius: "4px",
                                        "@media (max-width: 390px)": { width: "calc(100vw - 74px)" },
                                    }}
                                >
                                    <MenuItem value="" disabled sx={{display: "none"}}>
                                        Select a Source Type
                                    </MenuItem>
                                    <MenuItem value={"Customer Conversions"}>Customer Conversions</MenuItem>
                                    <MenuItem value={"Lead Failures"}>Lead Failures</MenuItem>
                                    <MenuItem value={"Intent"}>Intent</MenuItem>
                                </Select>
                            </FormControl>
                            {sourceType === "" &&
                                <Box sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    width: "316px",
                                    border: "1px dashed rgba(80, 82, 178, 1)",
                                    borderRadius: "4px",
                                    padding: "8px 16px",
                                    height: "80px",
                                    backgroundColor: "rgba(246, 248, 250, 1)",
                                    gap: "16px",
                                    "@media (max-width: 390px)": { width: "calc(100vw - 74px)" }
                                }}>
                                    <Image src="upload.svg" alt="upload" width={40} height={40}/>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography
                                        sx={{
                                            fontFamily: "Nunito Sans",
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "rgba(80, 82, 178, 1)"
                                        }}
                                        >
                                        Upload a file
                                        </Typography>
                                        <Typography
                                        sx={{
                                            fontFamily: "Nunito Sans",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "rgba(32, 33, 36, 1)",
                                        }}
                                        >
                                        CSV.Max 100MB
                                        </Typography>
                                    </Box>
                                </Box>}
                            {sourceType === "" &&
                                <Box sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    width: "316px",
                                    border: "1px solid rgba(228, 228, 228, 1)",
                                    borderRadius: "4px",
                                    padding: "8px 16px",
                                    height: "80px",
                                    backgroundColor: "rgba(246, 248, 250, 1)",
                                    gap: "16px",
                                    "@media (max-width: 390px)": { width: "calc(100vw - 74px)" }
                                }}>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography
                                        sx={{
                                            fontFamily: "Nunito Sans",
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "rgba(32, 33, 36, 1)"
                                        }}
                                        >
                                        September
                                        </Typography>
                                        <Typography
                                        sx={{
                                            fontFamily: "Nunito Sans",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            color: "rgba(74, 74, 74, 1)",
                                        }}
                                        >
                                        44MB
                                        </Typography>
                                    </Box>
                                    <IconButton onClick={handleDeleteFile}>
                                        <DeleteOutlinedIcon />
                                    </IconButton>
                                </Box>
                            }
                            <Typography sx={sourcesStyles.text}>Sample doc: <Link href="https://dev.maximiz.ai/integrations" sx={sourcesStyles.textLink}>sample recent customers-list.csv</Link></Typography>
                        </Box>
                        <Box sx={{display: sourceMethod === 0 || file ? "flex" : "flex", flexDirection: "column", gap: 2, flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px" }}>
                        {rows.map((row) => (
                            <Box key={row.id} sx={{ mb: 2 }}>
                                <Grid container spacing={2} alignItems="center" sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' } }}>
                                    {/* Left Input Field */}
                                    <Grid item xs="auto" sm={5}>
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            disabled={true}
                                            // label={row.type}
                                            value={row.type}
                                            onChange={(e) => handleMapListChange(row.id, 'value', e.target.value)}
                                            InputLabelProps={{
                                                sx: {
                                                    fontFamily: 'Nunito Sans',
                                                    fontSize: '12px',
                                                    lineHeight: '16px',
                                                    color: 'rgba(17, 17, 19, 0.60)',
                                                    top: '-5px',
                                                    '&.Mui-focused': {
                                                        color: '#0000FF',
                                                        top: 0
                                                    },
                                                    '&.MuiInputLabel-shrink': {
                                                        top: 0
                                                    }
                                                }
                                            }}
                                            InputProps={{

                                                sx: {
                                                    '&.MuiOutlinedInput-root': {
                                                        height: '36px',
                                                        '& .MuiOutlinedInput-input': {
                                                            padding: '6.5px 8px',
                                                            fontFamily: 'Roboto',
                                                            color: '#202124',
                                                            fontSize: '12px',
                                                            fontWeight: '400',
                                                            lineHeight: '20px'
                                                        },
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#A3B0C2',
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#A3B0C2',
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#0000FF',
                                                        },
                                                    },
                                                    '&+.MuiFormHelperText-root': {
                                                        marginLeft: '0',
                                                    },
                                                }
                                            }}
                                        />
                                    </Grid>

                                    {/* Middle Icon Toggle (Right Arrow or Close Icon) */}
                                    <Grid item xs="auto" sm={1} container justifyContent="center">
                                        {row.selectValue !== undefined ? (
                                            row.selectValue ? (
                                                <Image
                                                    src='/chevron-right-purple.svg'
                                                    alt='chevron-right-purple'
                                                    height={18}
                                                    width={18} // Adjust the size as needed
                                                />

                                            ) : (
                                                <Image
                                                    src='/close-circle.svg'
                                                    alt='close-circle'
                                                    height={18}
                                                    width={18} // Adjust the size as needed
                                                />
                                            )
                                        ) : (
                                            <Image
                                                src='/chevron-right-purple.svg'
                                                alt='chevron-right-purple'
                                                height={18}
                                                width={18} // Adjust the size as needed
                                            /> // For the first two rows, always show the right arrow
                                        )}
                                    </Grid>
                                    
                                    <Grid item xs="auto" sm={5}>
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            disabled={true}
                                            value={row.type}
                                            InputLabelProps={{
                                                sx: {
                                                    fontFamily: 'Nunito Sans',
                                                    fontSize: '12px',
                                                    lineHeight: '16px',
                                                    color: 'rgba(17, 17, 19, 0.60)',
                                                    top: '-5px',
                                                    '&.Mui-focused': {
                                                        color: '#0000FF',
                                                        top: 0
                                                    },
                                                    '&.MuiInputLabel-shrink': {
                                                        top: 0
                                                    }
                                                }
                                            }}
                                            InputProps={{

                                                sx: {
                                                    '&.MuiOutlinedInput-root': {
                                                        height: '36px',
                                                        '& .MuiOutlinedInput-input': {
                                                            padding: '6.5px 8px',
                                                            fontFamily: 'Roboto',
                                                            color: '#202124',
                                                            fontSize: '12px',
                                                            fontWeight: '400',
                                                            lineHeight: '20px'
                                                        },
                                                        '& .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#A3B0C2',
                                                        },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#A3B0C2',
                                                        },
                                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: '#0000FF',
                                                        },
                                                    },
                                                    '&+.MuiFormHelperText-root': {
                                                        marginLeft: '0',
                                                    },
                                                }
                                            }}
                                        />
                                    </Grid>


                                    {/* Delete Icon */}
                                    <Grid item xs="auto" sm={1} container justifyContent="center">
                                        <>
                                            <IconButton onClick={(event) => handleClickOpen(event, row.id)}>
                                                <Image
                                                    src='/trash-icon-filled.svg'
                                                    alt='trash-icon-filled'
                                                    height={18}
                                                    width={18} // Adjust the size as needed
                                                />
                                            </IconButton>
                                            <Popover
                                                id={deleteId}
                                                open={deleteOpen}
                                                anchorEl={deleteAnchorEl}
                                                onClose={handleDeleteClose}
                                                anchorOrigin={{
                                                    vertical: 'bottom',
                                                    horizontal: 'center',
                                                }}
                                                transformOrigin={{
                                                    vertical: 'top',
                                                    horizontal: 'right',
                                                }}
                                            >
                                                <Box sx={{
                                                    minWidth: '254px',
                                                    borderRadius: '4px',
                                                    border: '0.2px solid #afafaf',
                                                    background: '#fff',
                                                    boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.12)',
                                                    padding: '16px 21px 16px 16px'
                                                }}>
                                                    <Typography variant="body1" className='first-sub-title' sx={{
                                                        paddingBottom: '12px'
                                                    }}>Confirm Deletion</Typography>
                                                    <Typography variant="body2" sx={{
                                                        color: '#5f6368',
                                                        fontFamily: 'Roboto',
                                                        fontSize: '12px',
                                                        fontWeight: '400',
                                                        lineHeight: '16px',
                                                        paddingBottom: '26px'
                                                    }}>
                                                        Are you sure you want to delete this <br /> map data?
                                                    </Typography>
                                                    <Box display="flex" justifyContent="flex-end" mt={2}>
                                                        <Button onClick={handleDeleteClose} sx={{
                                                            borderRadius: '4px',
                                                            border: '1px solid #5052b2',
                                                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                            color: '#5052b2',
                                                            fontFamily: 'Nunito Sans',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            lineHeight: '20px',
                                                            marginRight: '16px',
                                                            textTransform: 'none'
                                                        }}>
                                                            Clear
                                                        </Button>
                                                        <Button onClick={handleDelete} sx={{
                                                            background: '#5052B2',
                                                            borderRadius: '4px',
                                                            border: '1px solid #5052b2',
                                                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                            color: '#fff',
                                                            fontFamily: 'Nunito Sans',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            lineHeight: '20px',
                                                            textTransform: 'none',
                                                            '&:hover': {
                                                                color: '#5052B2'
                                                            }
                                                        }}>
                                                            Delete
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </Popover>
                                        </>
                                    </Grid>
                                </Grid>
                            </Box>
                        ))}
                        </Box>
                        <Box sx={{display: sourceMethod === 0 || file ? "flex" : "flex", flexDirection: "column", gap: 2, flexWrap: "wrap", border: "1px solid rgba(228, 228, 228, 1)", borderRadius: "6px", padding: "20px" }}>
                            <Box sx={{display: "flex", alignItems: "center", gap: 2}}>
                                <Typography sx={{fontFamily: "Nunito Sans", fontSize: "16px"}}>Name</Typography>
                                <TextField
                                    id="outlined"
                                    label="Name"
                                    InputLabelProps={{
                                        sx: {
                                            color: 'rgba(17, 17, 19, 0.6)',
                                            fontFamily: 'Nunito Sans',
                                            fontWeight: 400,
                                            fontSize: '15px',
                                            padding:0,
                                            top: '-1px',
                                            margin:0
                                    }}}
                                    sx={{
                                        "& .MuiInputLabel-root.Mui-focused": {
                                            color: "rgba(17, 17, 19, 0.6)",
                                        },
                                        "& .MuiInputLabel-root[data-shrink='false']": {
                                            transform: "translate(16px, 50%) scale(1)",
                                        },
                                        "& .MuiOutlinedInput-root":{
                                            maxHeight: '40px'
                                        }
                                    }}
                                    InputProps={{
                                        className: "form-input"
                                    }}
                                    value={sourceName}
                                    onChange={(e) => setSourceName(e.target.value)}
                                    />
                            </Box>
                        </Box>
                        {showSlider && <Slider />}
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default SourcesImport;
