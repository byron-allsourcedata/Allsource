"use client";
import React, {useState, useEffect, Suspense} from 'react';
import { Box, Grid, Typography, Button, Menu, Chip, MenuItem, Table, TableBody, TableCell, IconButton, TableContainer, TableHead, TableRow, Paper, Checkbox} from '@mui/material';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import {useRouter} from 'next/navigation';
import {useUser} from '../../context/UserContext';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import {AxiosError} from 'axios';
import {audienceStyles} from './audienceStyles';
import Slider from '../../components/Slider';
import {SliderProvider} from '../../context/SliderContext';
import PersonIcon from '@mui/icons-material/Person';
import TrialStatus from '@/components/TrialLabel';
import DomainButton from '@/components/DomainsButton';
import {ChevronLeft, ChevronRight} from '@mui/icons-material';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterPopup from '@/components/FiltersSlider';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import Swal from 'sweetalert2';
import BuildAudience from "@/components/BuildAudience";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import {leadsStyles} from "@/app/leads/leadsStyles";
import AudiencePopup from "@/components/AudienceSlider";
import {useTheme} from '@mui/material/styles';


const Sidebar = dynamic(() => import('../../components/Sidebar'), {
    suspense: true,
});

interface LeadData {
    id: number;
    occupation?: string | null;
    email?: string | null;
    name?: string;
    age?: string | null;
    gender?: string | null;
    city?: string | null;
    state?: string | null;
}


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
        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: 1}}>
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
                    }}/>
            </Button>
            {totalPages > 1 && (
                <>
                    {page > 1 && <Button onClick={() => handlePageChange(0)} sx={audienceStyles.page_number}>1</Button>}
                    {page > 2 && <Typography variant="body2" sx={{mx: 1}}>...</Typography>}
                    {getPageButtons().map((pageNumber) => (
                        <Button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            sx={{
                                mx: 0.5, ...audienceStyles.page_number,
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
                    {totalPages - page > 3 && <Typography variant="body2" sx={{mx: 1}}>...</Typography>}
                    {page < totalPages - 1 && <Button onClick={() => handlePageChange(totalPages - 1)}
                                                      sx={audienceStyles.page_number}>{totalPages}</Button>}
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
                }}/>
            </Button>
        </Box>
    );
};


const Audience: React.FC = () => {
    const router = useRouter();
    const {full_name, email} = useUser();
    const [data, setData] = useState<any[]>([]);
    const [count_leads, setCount] = useState<number | null>(null);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState('created_date');
    const [appliedDates, setAppliedDates] = useState<{ start: Date | null; end: Date | null }>({
        start: null,
        end: null
    });
    const [maxPage, setMaxPage] = useState<number>(0);
    const [leadsData, setLeadsData] = useState<LeadData[] | null>(null);
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
    const [filterPopupOpen, setFilterPopupOpen] = useState(false);
    const [audiencePopupOpen, setAudiencePopupOpen] = useState(false);
    const [buildAudiencePopupOpen, setBuildAudiencePopupOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleFilterPopupOpen = () => {
        setFilterPopupOpen(true);
    };

    const handleDataFetch = (leads_list: LeadData[], count_leads: number, max_page: number ) => {
        setLeadsData(leads_list);
        setMaxPage(max_page);
        setCount(count_leads);
    };

    const handleFilterPopupClose = () => {
        setFilterPopupOpen(false);
    };

    const handleAudiencePopupOpen = () => {
        setAudiencePopupOpen(true);
    };

    const handleAudiencePopupClose = () => {
        setSelectedRows(new Set());
        setAudiencePopupOpen(false);
    };

    const handleBuildAudiencePopupOpen = () => {
        setSelectedRows(new Set());
        setBuildAudiencePopupOpen(true);
    };

    const handleBuildAudiencePopupClose = () => {
        setBuildAudiencePopupOpen(false);
    };
    const theme = useTheme();
    const getStateDisplay = (state: string | null | undefined): React.ReactNode => {
        if (!state) return 'N/A';

        const items = state.split(',').map(item => item.trim());
        const count = items.length;

        if (count > 1) {
            return (
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <Chip
                        label={`Hug ${count}`}
                        sx={{
                            margin: '0 2px',
                            backgroundColor: theme.palette.grey[300],
                            color: theme.palette.text.primary
                        }}
                    />
                </Box>
            );
        }

        return items[0];
    };

    const handleSortRequest = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSignOut = () => {
        localStorage.clear();
        sessionStorage.clear();
        router.push('/signin');
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

    const renderAudienceTable = () => (
        <Table sx={{minWidth: 850}} aria-label="Audience table">
            <TableHead>
                <TableRow>
                    <TableCell
                        padding="checkbox"
                        sx={{borderRight: '1px solid rgba(235, 235, 235, 1)'}}
                    >
                        <Checkbox
                            indeterminate={selectedRows.size > 0 && selectedRows.size < data.length}
                            checked={data.length > 0 && selectedRows.size === data.length}
                            onChange={handleSelectAllClick}
                            color="primary"
                        />
                    </TableCell>
                    {[
                        {key: 'list_name', label: 'List Name'},
                        {key: 'no_of_leads', label: 'No: of leads'},
                        {key: 'created_by', label: 'Created by'},
                        {key: 'created_date', label: 'Created date'},
                        {key: 'platform', label: 'Platform', sortable: false},
                        {key: 'status', label: 'Status'},
                        {key: 'exported_on', label: 'Exported on'},
                        {key: 'actions', label: 'Actions', sortable: false},
                    ].map(({key, label, sortable = true}) => (
                        <TableCell
                            key={key}
                            sx={audienceStyles.table_column}
                            onClick={sortable ? () => handleSortRequest(key) : undefined}
                            style={{cursor: sortable ? 'pointer' : 'default'}}
                        >
                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                <Typography variant="body2">{label}</Typography>
                                {sortable && orderBy === key && (
                                    <IconButton size="small" sx={{ml: 1}}>
                                        {order === 'asc' ? (
                                            <ArrowUpwardIcon fontSize="inherit"/>
                                        ) : (
                                            <ArrowDownwardIcon fontSize="inherit"/>
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
                            backgroundColor: selectedRows.has(row.id) ? 'rgba(235, 243, 254, 1)' : 'inherit',
                        }}
                    >
                        <TableCell
                            padding="checkbox"
                            sx={{borderRight: '1px solid rgba(235, 235, 235, 1)'}}
                        >
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectRow(row.id);
                                }}
                            >
                                <Checkbox
                                    checked={selectedRows.has(row.id)}
                                    color="primary"
                                />
                            </div>
                        </TableCell>
                        <TableCell sx={audienceStyles.table_column}>{row.name}</TableCell>
                        <TableCell sx={audienceStyles.table_column}>{row.leads_count || 'N/A'}</TableCell>
                        <TableCell sx={audienceStyles.table_column}>{row.type || 'N/A'}</TableCell>
                        <TableCell sx={audienceStyles.table_column}>{row.created_at || 'N/A'}</TableCell>
                        <TableCell sx={audienceStyles.table_column}>{row.platform || 'N/A'}</TableCell>
                        <TableCell sx={audienceStyles.table_column}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontFamily: 'Nunito',
                                    fontSize: '14px',
                                    fontWeight: '400',
                                    lineHeight: '19.6px',
                                    justifyContent: 'center',
                                    backgroundColor: getStatusStyle(row.status).background,
                                    color: getStatusStyle(row.status).color
                                }}
                            >
                                {row.status || 'N/A'}
                            </Box>
                        </TableCell>
                        <TableCell sx={audienceStyles.table_column}>{row.exported_on || 'N/A'}</TableCell>
                        <TableCell sx={audienceStyles.table_column}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <EditIcon
                                    fontSize="small"
                                    style={{
                                        cursor: 'pointer',
                                        marginRight: '8px'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(row.id);
                                    }}
                                    sx={{color: '#969696'}}
                                />
                                <DeleteIcon
                                    fontSize="small"
                                    style={{cursor: 'pointer'}}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(row.id);
                                    }}
                                    sx={{color: '#E76758'}}
                                />
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    const renderLeadsTable = () => (
        <Table sx={{minWidth: 850}} aria-label="Audience table">
            <TableHead>
                <TableRow>
                    <TableCell padding="checkbox" sx={{borderRight: '1px solid rgba(235, 235, 235, 1)'}}>
                        <Checkbox
                            indeterminate={selectedRows.size > 0 && selectedRows.size < (leadsData?.length ?? 0)}
                            checked={selectedRows.size === (leadsData?.length ?? 0) && (leadsData?.length ?? 0) > 0}
                            onChange={handleLeadsSelectAllClick}
                            color="primary"
                        />
                    </TableCell>
                    {[
                        {key: 'full_name', label: 'Full name', sortable: true},
                        {key: 'email', label: 'Email', sortable: true},
                        {key: 'gender', label: 'Gender', sortable: true},
                        {key: 'age', label: 'Age', sortable: true},
                        {key: 'occupation', label: 'Occupation', sortable: true},
                        {key: 'city', label: 'City', sortable: true},
                        {key: 'state', label: 'State', sortable: true},
                    ].map(({key, label, sortable = true}) => (
                        <TableCell
                            key={key}
                            sx={audienceStyles.table_column}
                            onClick={sortable ? () => handleSortRequest(key) : undefined}
                            style={{cursor: sortable ? 'pointer' : 'default'}}
                        >
                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                <Typography variant="body2">{label}</Typography>
                                {sortable && orderBy === key && (
                                    <IconButton size="small" sx={{ml: 1}}>
                                        {order === 'asc' ? (
                                            <ArrowUpwardIcon fontSize="inherit"/>
                                        ) : (
                                            <ArrowDownwardIcon fontSize="inherit"/>
                                        )}
                                    </IconButton>
                                )}
                            </Box>
                        </TableCell>
                    ))}
                </TableRow>
            </TableHead>

            <TableBody>
                {leadsData?.map((row) => (
                    <TableRow
                        key={row.id}
                        selected={selectedRows.has(row.id)}
                        onClick={() => handleSelectRow(row.id)}
                        sx={{
                            backgroundColor: selectedRows.has(row.id) ? 'rgba(235, 243, 254, 1)' : 'inherit',
                        }}
                    >
                        <TableCell padding="checkbox" sx={{borderRight: '1px solid rgba(235, 235, 235, 1)'}}>
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectRow(row.id);
                                }}
                            >
                                <Checkbox
                                    checked={selectedRows.has(row.id)}
                                    color="primary"
                                />
                            </div>
                        </TableCell>
                        <TableCell sx={audienceStyles.table_column}>{row.name}</TableCell>
                        <TableCell sx={audienceStyles.table_column}>{row.email || 'N/A'}</TableCell>
                        <TableCell sx={audienceStyles.table_column}>{row.gender || 'N/A'}</TableCell>
                        <TableCell sx={audienceStyles.table_column}>{row.age || 'N/A'}</TableCell>
                        <TableCell sx={audienceStyles.table_column}>{row.occupation || 'N/A'}</TableCell>
                        <TableCell sx={audienceStyles.table_column}>{row.city || 'N/A'}</TableCell>
                        <TableCell sx={audienceStyles.table_column}>{getStateDisplay(row.state)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    const handleEdit = async (row_id: number | string) => {
        if (row_id === null) {
            return;
        }
        const {value: newAudienceName} = await Swal.fire({
            title: 'Edit Audience Name',
            input: 'text',
            inputLabel: 'Enter the new audience name',
            inputPlaceholder: 'New audience name',
            showCancelButton: true,
            confirmButtonText: 'Save',
            cancelButtonText: 'Cancel',
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to write something!';
                }
                return null;
            },
            customClass: {
                popup: 'animated-popup'
            }
        });
        if (newAudienceName) {
            const requestBody = {
                audience_ids: [row_id],
                new_audience_name: newAudienceName
            };
            setLoading(true);
            try {
                const response = await axiosInstance.put('/audience', requestBody, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                setData((prevData) =>
                    prevData.map(row =>
                        row.id === row_id ? {...row, name: newAudienceName} : row
                    )
                );
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDelete = async (row_id: number | string) => {
        const confirmDelete = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to undo this action!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete!',
            cancelButtonText: 'Cancel'
        });

        if (!confirmDelete.isConfirmed) {
            return;
        }
        if (row_id === null) {
            return
        }
        let requestBody = null;
        let selectedRowsArray: (number | string)[] | null = null;

        if (selectedRows.size !== 0) {
            selectedRowsArray = Array.from(selectedRows);
            requestBody = {
                audience_ids: selectedRowsArray
            };
        } else {
            requestBody = {
                audience_ids: [row_id]
            };
        }
        setLoading(true);
        try {
            const response = await axiosInstance.delete('/audience', {
                headers: {
                    'Content-Type': 'application/json',
                },
                data: requestBody,
            });

            if (selectedRowsArray) {
                setData((prevData) => prevData.filter(row => !selectedRowsArray.includes(row.id)));
                setSelectedRows(new Set());
            } else {
                setData((prevData) => prevData.filter(row => row.id !== row_id));
            }

        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
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


    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const newSelecteds = data.map((row) => row.id);
            setSelectedRows(new Set(newSelecteds));
            return;
        }
        setSelectedRows(new Set());
    };

    const handleLeadsSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const newSelecteds = leadsData?.map((row) => row.id) || [];
            setSelectedRows(new Set(newSelecteds));
        } else {
            setSelectedRows(new Set());
        }
    };


    const handleChangeRowsPerPage = (event: React.ChangeEvent<{ value: unknown }>) => {
        setRowsPerPage(parseInt(event.target.value as string, 10));
        setPage(0);
    };

    const fetchData = async ({sortBy, sortOrder, page, rowsPerPage, activeFilter, appliedDates}: FetchDataParams) => {
        try {
            const accessToken = localStorage.getItem("token");
            if (!accessToken) {
                router.push('/sign-in');
                return;
            }

            const {start, end} = appliedDates;
            const startEpoch = start ? Math.floor(start.getTime() / 1000) : null;
            const endEpoch = end ? Math.floor(end.getTime() / 1000) : (start ? Math.floor(start.getTime() / 1000) : null);

            let url = `/audience?page=${page + 1}&per_page=${rowsPerPage}`;
            if (sortBy) {
                url += `&sort_by=${sortBy}&sort_order=${sortOrder}`;
            }

            const response = await axiosInstance.get(url);
            const [leads, count, max_page] = response.data;
            setData(Array.isArray(leads) ? leads : []);
            setCount(count || 0);
            max_page(max_page || 0);
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

    useEffect(() => {
        fetchData({sortBy: orderBy, sortOrder: order, page, rowsPerPage, activeFilter, appliedDates});
    }, [orderBy, order, page, rowsPerPage, activeFilter, appliedDates]);


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
            case 'New':
                return {
                    background: '#FEF3CD',
                    color: '#D8B707',
                };
            case 'Exported':
                return {
                    background: '#EAF8DD',
                    color: '#6EC125',
                };
            default:
                return {
                    background: 'transparent',
                    color: 'inherit',
                };
        }
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
                                '0%': {transform: 'rotate(0deg)'},
                                '100%': {transform: 'rotate(360deg)'},
                            },
                        }}
                    />
                </Box>
            )}
            <Box sx={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
                
                    
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                <Typography variant="h4" component="h1" sx={audienceStyles.title}>
                                    {leadsData?.length ? 'Audience List' : 'Build Audience'}
                                </Typography>
                                <Box sx={{display: 'flex', mt: 1,}}>
                                    {leadsData?.length ?
                                        <Button
                                            aria-controls={dropdownOpen ? 'account-dropdown' : undefined}
                                            aria-haspopup="true"
                                            aria-expanded={dropdownOpen ? 'true' : undefined}
                                            sx={{
                                                marginRight: '1.5em',
                                                textTransform: 'none',
                                                border: '1px solid rgba(184, 184, 184, 1)',
                                                borderRadius: '4px',
                                                padding: '0.5em',
                                                mt: 1.25,
                                                color: '#5052B2'
                                            }}
                                        >
                                            <DeleteIcon
                                                fontSize="small"
                                                style={{cursor: 'pointer'}}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                }}
                                                sx={{color: '#E76758'}}
                                            />
                                        </Button> : ''
                                    }
                                    <Button
                                        onClick={handleFilterPopupOpen}
                                        aria-controls={dropdownOpen ? 'account-dropdown' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={dropdownOpen ? 'true' : undefined}
                                        sx={{
                                            marginRight: '1.5em',
                                            textTransform: 'none',
                                            border: '1px solid rgba(184, 184, 184, 1)',
                                            borderRadius: '4px',
                                            padding: '0.5em',
                                            mt: 1.25,
                                            color: '#5052B2'
                                        }}
                                    >
                                        <FilterListIcon fontSize='medium'/>
                                    </Button>

                                    <Button
                                        sx={{
                                            marginRight: '1.5em',
                                            textTransform: 'none',
                                            border: '1px solid rgba(184, 184, 184, 1)',
                                            borderRadius: '4px',
                                            padding: '0.5em',
                                            mt: 1.25,
                                            color: '#5052B2'
                                        }}>
                                        <SendIcon fontSize='medium'/>
                                    </Button>
                                    <Button
                                        onClick={leadsData?.length ? handleAudiencePopupOpen : handleBuildAudiencePopupOpen}
                                        aria-haspopup="true"
                                        sx={{
                                            marginRight: '1.5em',
                                            textTransform: 'none',
                                            color: selectedRows.size === 0 ? 'rgba(128, 128, 128, 1)' : 'rgba(80, 82, 178, 1)',
                                            border: '1px solid rgba(80, 82, 178, 1)',
                                            borderRadius: '4px',
                                            padding: '10px',
                                            mt: 1.25,
                                        }}
                                    >
                                        <Typography sx={{
                                            marginRight: '0.5em',
                                            fontFamily: 'Nunito',
                                            lineHeight: '19.1px',
                                            fontSize: '16px',
                                            textAlign: 'left',
                                            color: '#5052B2'
                                        }}>
                                            {leadsData?.length ? 'Add to List' : 'Build Audience'}
                                        </Typography>
                                    </Button>
                                </Box>
                            </Box>
                            <Box sx={{flex: 1, display: 'flex', flexDirection: 'column', padding: 2}}>
                                {status === 'PIXEL_INSTALLATION_NEEDED' ? (
                                    <Box sx={centerContainerStyles}>
                                        <Typography variant="h5" sx={{mb: 2}}>
                                            Pixel Integration isn&apos;t completed yet!
                                        </Typography>
                                        <Image src='/pixel_installation_needed.svg' alt='Need Pixel Install'
                                               height={200} width={300}/>
                                        <Typography variant="body1" color="textSecondary" sx={{mt: 2}}>
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
                                        <Typography variant="h5" sx={{mb: 6}}>
                                            Data not matched yet!
                                        </Typography>
                                        <Image src='/no-data.svg' alt='No Data' height={400} width={500}/>
                                        <Typography variant="body1" color="textSecondary" sx={{mt: 2}}>
                                            Please check back later.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Grid container spacing={1} sx={{flex: 1}}>
                                        <Grid item xs={12}>
                                            <TableContainer
                                                component={Paper}
                                                sx={{
                                                    border: '1px solid rgba(235, 235, 235, 1)',
                                                    maxHeight: '80vh',
                                                    overflowY: 'auto'
                                                }}
                                            >
                                                {leadsData && leadsData.length > 0 ? renderLeadsTable() : renderAudienceTable()}
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
                                {showSlider && <Slider/>}
                            </Box>
                        <AudiencePopup open={audiencePopupOpen} onClose={handleAudiencePopupClose}
                                       selectedLeads={Array.from(selectedRows)}/>
                        <BuildAudience open={buildAudiencePopupOpen} onClose={handleBuildAudiencePopupClose}
                                       onDataFetch={handleDataFetch}/>
                        {/* <FilterPopup open={filterPopupOpen} onClose={handleFilterPopupClose}/> */}
            </Box>
        </>
    );
};

const AudiencePage: React.FC = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SliderProvider>
                <Audience/>
            </SliderProvider>
        </Suspense>
    );
};

export default AudiencePage;
