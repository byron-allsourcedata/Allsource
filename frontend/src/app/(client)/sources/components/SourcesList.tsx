"use client";
import React, { useState } from 'react';
import { Box, Grid, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Drawer, List, ListItemText, ListItemButton, Popover } from '@mui/material';
import { useRouter } from 'next/navigation';
import axiosInstance from '../../../../axios/axiosInterceptorInstance';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import ThreeDotsLoader from './ThreeDotsLoader';
import { useNotification } from '@/context/NotificationContext';
import { useSSE } from '../../../../context/SSEContext';
import { MoreVert } from '@mui/icons-material';
import ProgressBar from './ProgressLoader';

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

interface SourcesListProps {
    createdSource: Source | null
    setSources: (action: boolean) => void 
}

interface RenderCeil {
    value: any;
    visibility_status: string
}


const SourcesList: React.FC<SourcesListProps> = ({ createdSource, setSources }) => {
    const router = useRouter();
    const { hasNotification } = useNotification();
    const [data, setData] = useState<any[]>([]);
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
    const [id, setId] = useState<string>('')
    const { sourceProgress } = useSSE();


    const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClosePopover = () => {
        setAnchorEl(null);
        setSelectedJobTitle(null);
    };

    const isOpen = Boolean(anchorEl);

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

            let url = `/company/download-employees?company_id=${5}`;
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


    const truncateText = (text: string, maxLength: number) => {
        return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
    };

    const capitalizeTableCell  = (city: string) => {
        return city
            ?.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

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

                    </Box>
                    <Box sx={{
                        flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '100%', pl: 0, pr: 0, pt: '14px', pb: '20px',
                        '@media (max-width: 900px)': {
                            pt: '2px',
                            pb: '18px'
                        }
                    }}>
                        <Box
                            sx={{
                                display: "flex",
                                padding: 2,
                                border: "1px solid #e0e0e0",
                                borderRadius: 2,
                                '@media (max-width: 600px)': {
                                    alignItems: "start"
                                }
                            }}
                            >
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 5,
                                    width: "100%",
                                    justifyContent: "space-between",
                                    "@media (max-width: 600px)": {
                                    flexDirection: "column",
                                    gap: 2
                                    },
                                }}
                                >
                                <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                    <Typography variant="body2" className="table-heading">
                                        Name
                                    </Typography>
                                    <Typography variant="subtitle1" className="table-data">
                                        {createdSource?.name}
                                    </Typography>
                                </Box>
                                <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                    <Typography
                                        variant="body2"
                                        className="table-heading"
                                        sx={{ textAlign: "left" }}
                                    >
                                        Source
                                    </Typography>
                                    <Typography variant="subtitle1" className="table-data">
                                        {createdSource?.source_origin}
                                    </Typography>
                                </Box>

                                <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                    <Typography variant="body2" className="table-heading">
                                        Type
                                    </Typography>
                                    <Typography variant="subtitle1" className="table-data">
                                        {createdSource?.source_type}
                                    </Typography>
                                </Box>
                                <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                    <Typography
                                        variant="body2"
                                        className="table-heading"
                                        sx={{ textAlign: "left" }}
                                    >
                                        Created By
                                    </Typography>
                                    <Typography variant="subtitle1" className="table-data">
                                        {createdSource?.created_by}
                                    </Typography>
                                </Box>


                                <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                    <Typography variant="body2" className="table-heading">
                                        Created Date
                                    </Typography>
                                    <Typography variant="subtitle1" className="table-data">
                                        {dayjs(createdSource?.created_at).isValid() ? dayjs(createdSource?.created_at).format('MMM D, YYYY') : '--'}
                                    </Typography>
                                </Box>
                                <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                    <Typography
                                        variant="body2"
                                        className="table-heading"
                                        sx={{ textAlign: "left" }}
                                    >
                                        Updated Date
                                    </Typography>
                                    <Typography variant="subtitle1" className="table-data">
                                        {dayjs(createdSource?.updated_at).isValid() ? dayjs(createdSource?.updated_at).format('MMM D, YYYY') : '--'}
                                    </Typography>
                                </Box>

                                <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                    <Typography variant="body2" className="table-heading">
                                        Number of Customers
                                    </Typography>
                                    <Typography variant="subtitle1" className="table-data">
                                    {createdSource?.id && sourceProgress[createdSource?.id]?.total 
                                        ? <ThreeDotsLoader />
                                        : "--"
                                    }
                                    </Typography>
                                </Box>
                                <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                    <Typography
                                        variant="body2"
                                        className="table-heading"
                                        sx={{ textAlign: "left" }}
                                    >
                                        Matched Records
                                    </Typography>
                                    <Typography variant="subtitle1" className="table-data">
                                        {createdSource?.id && sourceProgress[createdSource?.id]?.processed 
                                        ? <ProgressBar progress={sourceProgress[id]} />
                                        : "--"
                                    }
                                    </Typography>
                                </Box>

                                <IconButton onClick={(event) => handleOpenPopover(event)} sx={{ ':hover': { backgroundColor: 'transparent' }}} >
                                    <MoreVert sx={{color: "rgba(32, 33, 36, 1)"}} height={8} width={24}/>
                                </IconButton>
                            </Box>

                        </Box>
                        <Box sx={{display: "flex", justifyContent: "end", gap: 2, mt: 2, alignItems: "center"}}>
                            <Button
                                variant="outlined"
                                onClick={() => setSources(false)}
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
                            >
                                Add Another Source
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => router.push(`/lookalikes/${createdSource?.id}/builder`)}
                                className='second-sub-title'
                                sx={{
                                    backgroundColor: 'rgba(80, 82, 178, 1)',
                                    textTransform: 'none',
                                    padding: '10px 24px',
                                    color: '#fff !important',
                                    ':hover': {
                                        backgroundColor: 'rgba(80, 82, 178, 1)'
                                    }
                                }}
                            >
                                Create Lookalike
                            </Button>
                        </Box>
                    </Box>
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
                                    }}>
                                <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Create Lookalike"/>
                                </ListItemButton>
                                <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {
                                        handleClosePopover()
                                        router.push(`/lookalikes/${createdSource?.id}/builder`)
                                    }}>
                                <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Remove"/>
                                </ListItemButton>
                            </List>
                    </Popover>

                </Box>
            </Box>
        </>
    );
};

export default SourcesList;
