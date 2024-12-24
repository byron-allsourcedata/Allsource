import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, TextField, Button, List, ListItemText, ListItemButton, InputLabel, MenuItem, Select, IconButton, Tabs, Tab, InputAdornment, Accordion, AccordionSummary, AccordionDetails, DialogActions, DialogContent, DialogContentText, Popover, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import CustomizedProgressBar from "./CustomizedProgressBar";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { suppressionsStyles } from "@/css/suppressions";
import dayjs from "dayjs";
import CustomTablePagination from "./CustomTablePagination";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Image from "next/image";
import CalendarPopup from "./CustomCalendar";
import { DateRangeIcon } from "@mui/x-date-pickers/icons";
import SwapVertIcon from '@mui/icons-material/SwapVert';
import SearchIcon from '@mui/icons-material/Search';

const tableHeaders = [
    { key: 'partner_name', label: 'Partner name', sortable: false },
    { key: 'email', label: 'Email', sortable: false },
    { key: 'join_date', label: 'Join date', sortable: true },
    { key: 'commission', label: 'Commission %', sortable: false },
    { key: 'subscription', label: 'Subscription', sortable: false },
    { key: 'sources', label: 'Sources', sortable: false },
    { key: 'last_payment_date', label: 'Last payment date', sortable: true },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'actions', label: 'Actions', sortable: false },
];

const getStatusStyle = (status: any) => {
    switch (status) {
        case "Accepted":
            return {
                background: 'rgba(234, 248, 221, 1)',
                color: 'rgba(43, 91, 0, 1)',
            };
        case 'Paid':
            return {
                background: 'rgba(234, 248, 221, 1)',
                color: 'rgba(43, 91, 0, 1)',
            };
        case 'Active':
            return {
                background: 'rgba(234, 248, 221, 1)',
                color: 'rgba(43, 91, 0, 1)',
            };
        case 'Pending':
            return {
                background: 'rgba(236, 236, 236, 1)',
                color: 'rgba(74, 74, 74, 1)',
            };
        case 'Signup':
            return {
                background: 'rgba(241, 241, 249, 1)',
                color: 'rgba(80, 82, 178, 1)',
            };
        case 'Free trial':
            return {
                background: 'rgba(235, 243, 254, 1)',
                color: 'rgba(20, 110, 246, 1)',
            };
        default:
            return {
                background: 'transparent',
                color: 'inherit',
            };
    }
};

interface PartnersAdminProps {
    tabIndex: number;
    handleTabChange: (event: React.SyntheticEvent, newIndex: number) => void;
}



const PartnersAdmin: React.FC<PartnersAdminProps> = ({tabIndex, handleTabChange}) => {
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState<number | false>(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [totalCount, setTotalCount] = useState(0);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(null);
    const isCalendarOpen = Boolean(calendarAnchorEl);
    const [formattedDates, setFormattedDates] = useState<string>('');
    const [appliedDates, setAppliedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [selectedDateLabel, setSelectedDateLabel] = useState<string>('');
    // const [tabIndex, setTabIndex] = useState(0);
    const [menuAnchor, setMenuAnchor] = useState(null);
    // const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
    //     setTabIndex(newIndex);
    // };

    const handleOpenMenu = (event: any) => {
        setMenuAnchor(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setMenuAnchor(null);
    };

    const open = Boolean(menuAnchor);

    const handleCalendarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setCalendarAnchorEl(event.currentTarget);
    };

    const handleCalendarClose = () => {
        setCalendarAnchorEl(null);
    };
    const handleDateLabelChange = (label: string) => {
        setSelectedDateLabel(label);
    };

    const handleDateChange = (dates: { start: Date | null; end: Date | null }) => {
        const { start, end } = dates;
        if (start && end) {
            const formattedStart = dayjs(start).format('MMM D');
            const formattedEnd = dayjs(end).format('MMM D, YYYY');

            setFormattedDates(`${formattedStart} - ${formattedEnd}`);
        } else if (start) {
            const formattedStart = dayjs(start).format('MMM D, YYYY');
            setFormattedDates(formattedStart);
        } else if (end) {
            const formattedEnd = dayjs(end).format('MMM D, YYYY');
            setFormattedDates(formattedEnd);
        } else {
            setFormattedDates('');
        }
    };

    const handleApply = (dates: { start: Date | null; end: Date | null }) => {
        if (dates.start && dates.end) {

            setAppliedDates(dates);
            setCalendarAnchorEl(null);


            handleCalendarClose();
        }
        else {
            setAppliedDates({ start: null, end: null })
        }
    };


    const handlePageChange = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setPage(newPage);
    };


    const handleRowsPerPageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setRowsPerPage(parseInt(event.target.value as string, 10));
    };

    const handleSortRequest = (key: string) => {
        const isAsc = orderBy === key && order === 'asc';
        const newOrder = isAsc ? 'desc' : 'asc';
        setOrder(newOrder);
        setOrderBy(key);

        const sortedAccounts = [...accounts].sort((a, b) => {
            const aValue = a[key as keyof typeof a];
            const bValue = b[key as keyof typeof b];
    
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return newOrder === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
            if (aValue instanceof Date && bValue instanceof Date) {
                return newOrder === 'asc'
                    ? new Date(aValue).getTime() - new Date(bValue).getTime()
                    : new Date(bValue).getTime() - new Date(aValue).getTime();
            }
            return 0;
        });
    
        setAccounts(sortedAccounts);
    };

    const handleOpenSection = (panel: number) => (
        event: React.SyntheticEvent,
        isExpanded: boolean
    ) => {
        setExpanded(isExpanded ? panel : false);
    };

    const fetchRules = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get("/admin-partners")
            setAccounts([...response.data])

        } catch {
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRules();
        // setAccounts([
        //     {
        //         partner_name: "Lolly",
        //         email: "abc@gmail.com",
        //         join_date: "2024-08-27T10:00:00Z",
        //         commission: '20%',
        //         subscription: 'Basic',
        //         sources: "Direct",
        //         last_payment_date: "2024-08-27T10:00:00Z",
        //         status: "Free trial",
        //     },
        //     {
        //         partner_name: "Maximiz",
        //         email: "abc@gmail.com",
        //         join_date: "2024-06-27T10:00:00Z",
        //         commission: '20%',
        //         subscription: 'Basic',
        //         sources: "Direct",
        //         last_payment_date: "2024-08-26T10:00:00Z",
        //         status: "Free trial",
        //     },
        //     {
        //         partner_name: "Bigcomerce",
        //         email: "abc@gmail.com",
        //         join_date: "2024-12-27T10:00:00Z",
        //         commission: '20%',
        //         subscription: 'Basic',
        //         sources: "Direct",
        //         last_payment_date: "2024-08-27T10:00:00Z",
        //         status: "Free trial",
        //     },
        //     {
        //         partner_name: "Lolly",
        //         email: "abc@gmail.com",
        //         join_date: "2024-10-27T10:00:00Z",
        //         commission: '20%',
        //         subscription: 'Basic',
        //         sources: "Direct",
        //         last_payment_date: "2024-08-15T10:00:00Z",
        //         status: "Free trial",
        //     },
        // ])
    }, [fetchRules]);


    return (
        <>
            {loading &&
                <CustomizedProgressBar />
            }
            <Box sx={{
                backgroundColor: '#fff',
                width: '100%',
                padding: 0,
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '77vh',
                '@media (max-width: 600px)': {margin: '0rem auto 0rem'}
            }}>
                {accounts.length === 0 ? (
                    <Box sx={suppressionsStyles.centerContainerStyles}>
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
                            No Invitee joined from the referreal link.
                        </Typography>
                    </Box>
                ) : (<>
                    <Box>
                        <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mb: 2, alignItems: 'center', gap: 2 }}>
                            <Tabs
                                value={tabIndex}
                                onChange={handleTabChange}
                                sx={{
                                    textTransform: 'none',
                                    minHeight: 0,
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: 'rgba(80, 82, 178, 1)',
                                        height: '1.4px',
                                    },
                                    "@media (max-width: 600px)": {
                                        border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '4px', width: '100%', '& .MuiTabs-indicator': {
                                            height: '0',
                                        },
                                    }
                                }}
                                aria-label="suppression tabs"
                            >
                                <Tab className="main-text"
                                    sx={{
                                        textTransform: 'none',
                                        padding: '4px 1px',
                                        pb: '10px',
                                        flexGrow: 1,
                                        marginRight: '3em',
                                        minHeight: 'auto',
                                        minWidth: 'auto',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        lineHeight: '19.1px',
                                        textAlign: 'left',
                                        mr: 2,
                                        '&.Mui-selected': {
                                            color: 'rgba(80, 82, 178, 1)'
                                        },
                                        "@media (max-width: 600px)": {
                                            mr: 0, borderRadius: '4px', '&.Mui-selected': {
                                                backgroundColor: 'rgba(249, 249, 253, 1)',
                                                border: '1px solid rgba(220, 220, 239, 1)'
                                            },
                                        }
                                    }}
                                    label="Partner"
                                />
                                <Tab className="main-text"
                                    sx={{
                                        textTransform: 'none',
                                        padding: '4px 10px',
                                        minHeight: 'auto',
                                        flexGrow: 1,
                                        pb: '10px',
                                        textAlign: 'center',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        lineHeight: '19.1px',
                                        minWidth: 'auto',
                                        '&.Mui-selected': {
                                            color: 'rgba(80, 82, 178, 1)'
                                        },
                                        "@media (max-width: 600px)": {
                                            mr: 0, borderRadius: '4px', '&.Mui-selected': {
                                                backgroundColor: 'rgba(249, 249, 253, 1)',
                                                border: '1px solid rgba(220, 220, 239, 1)'
                                            },
                                        }
                                    }}
                                    label="Master partner"
                                />
                            </Tabs>
                            <Box sx={{display: 'flex', gap: "16px"}}>
                                <TextField
                                    id="input-with-icon-textfield"
                                    placeholder="Search by account name, emails"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                    variant="outlined"
                                    sx={{
                                        flex: 1,
                                        maxWidth: '400px',
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '8px',
                                            height: '40px',
                                        },
                                        '& input': {
                                            paddingLeft: 0,
                                        },
                                        '& input::placeholder': {
                                            fontSize: '14px',
                                            color: '#8C8C8C',
                                        },
                                    }}
                                />
                                <Button
                                    variant="outlined"
                                    sx={{
                                        height: '40px',
                                        borderRadius: '4px',
                                        textTransform: 'none',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#5052B2',
                                        borderColor: '#5052B2',
                                        '&:hover': {
                                            backgroundColor: 'rgba(80, 82, 178, 0.1)',
                                        },
                                    }}
                                >
                                    Add Partner
                                </Button>
                                <Button
                                    aria-controls={isCalendarOpen ? 'calendar-popup' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={isCalendarOpen ? 'true' : undefined}
                                    onClick={handleCalendarClick}
                                    sx={{
                                        textTransform: 'none',
                                        color: formattedDates ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)',
                                        border: formattedDates ? '1.5px solid rgba(80, 82, 178, 1)' : '1.5px solid rgba(184, 184, 184, 1)',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        minWidth: 'auto',
                                        '@media (max-width: 900px)': {
                                            border: 'none',
                                            padding: 0
                                        },
                                        '&:hover': {
                                            border: '1.5px solid rgba(80, 82, 178, 1)',
                                            '& .MuiSvgIcon-root': {
                                                color: 'rgba(80, 82, 178, 1)'
                                            }
                                        }
                                    }}
                                >
                                    <DateRangeIcon
                                        fontSize="medium"
                                        sx={{ color: formattedDates ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)' }}
                                    />
                                    <Typography variant="body1" sx={{
                                        fontFamily: 'Roboto',
                                        fontSize: '14px',
                                        fontWeight: '400',
                                        color: 'rgba(32, 33, 36, 1)',
                                        lineHeight: '19.6px',
                                        textAlign: 'left'
                                    }}>
                                        {formattedDates}
                                    </Typography>
                                    {formattedDates &&
                                        <Box sx={{ pl: 2, display: 'flex', alignItems: 'center' }}>
                                            <Image src="/arrow_down.svg" alt="arrow down" width={16} height={16} />
                                        </Box>
                                    }
                                </Button>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', }}>
                            <TableContainer sx={{
                                border: '1px solid #EBEBEB',
                                borderRadius: '4px 4px 0px 0px',
                            }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            {tableHeaders.map(({ key, label, sortable }) => (
                                                <TableCell
                                                    key={key}
                                                    sx={{...suppressionsStyles.tableColumn, cursor: sortable ? 'pointer' : 'default'}}
                                                    onClick={sortable ? () => handleSortRequest(key) : undefined}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Typography variant="body2" className='table-heading'>{label}</Typography>
                                                        {sortable && (
                                                        <IconButton size="small" sx={{ ml: 1 }}>
                                                            {orderBy === key ? (
                                                            order === 'asc' ? (
                                                                <ArrowUpwardIcon fontSize="inherit" />
                                                            ) : (
                                                                <ArrowDownwardIcon fontSize="inherit" />
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
                                        {accounts.map((data, index) => (
                                            <TableRow key={index} sx={{
                                                ...suppressionsStyles.tableBodyRow,
                                                '&:hover': {
                                                    backgroundColor: '#F7F7F7',
                                                    '& .sticky-cell': {
                                                        backgroundColor: '#F7F7F7',
                                                    }
                                                },
                                            }}>
                                                <TableCell className='sticky-cell table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {data.partner_name}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {data.email}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {dayjs(data.join_date).format('MMM D, YYYY')}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {data.commission}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {data.subscription}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {data.sources}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {dayjs(data.last_payment_date).format('MMM D, YYYY')}
                                                </TableCell>

                                                <TableCell sx={{ ...suppressionsStyles.tableColumn, textAlign: 'center', pl: 0 }}>
                                                    <Typography component="div" sx={{
                                                        width: "74px",
                                                        margin: "0 auto",
                                                        background: getStatusStyle(data.status).background,
                                                        padding: '3px 8px',
                                                        borderRadius: '2px',
                                                        fontFamily: 'Roboto',
                                                        fontSize: '12px',
                                                        fontWeight: '400',
                                                        lineHeight: '16px',
                                                        color: getStatusStyle(data.status).color,
                                                    }}>
                                                        {data.status}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell sx={{ ...suppressionsStyles.tableColumn, textAlign: 'center', pl: 0 }}>
                                                    <IconButton onClick={handleOpenMenu} sx={{ ':hover': { backgroundColor: 'transparent', }}} >
                                                        <MoreHorizIcon sx={{ width: '22.91px', height: '16.18px',}} />
                                                    </IconButton>
                                                        <Popover
                                                            open={open}
                                                            anchorEl={menuAnchor}
                                                            onClose={handleCloseMenu}
                                                            anchorOrigin={{
                                                                vertical: 'bottom',
                                                                horizontal: 'left',
                                                            }}
                                                            >
                                                            <List
                                                                sx={{ 
                                                                    width: '100%', maxWidth: 360}}
                                                                >
                                                                <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {}}>
                                                                    <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Payment history"/>
                                                                </ListItemButton>
                                                                <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {}}>
                                                                    <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Reward history"/>
                                                                </ListItemButton>
                                                                <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {}}>
                                                                    <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Enable"/>
                                                                </ListItemButton>
                                                                <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {}}>
                                                                    <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Terminate"/>
                                                                </ListItemButton>
                                                                <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {}}>
                                                                    <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Edit"/>
                                                                </ListItemButton>
                                                                <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {}}>
                                                                    <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Log info"/>
                                                                </ListItemButton>
                                                            </List>
                                                        </Popover>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'end' }}>
                        <CustomTablePagination
                            count={totalCount}
                            page={page}
                            rowsPerPage={rowsPerPage}
                            onPageChange={handlePageChange}
                            onRowsPerPageChange={handleRowsPerPageChange}
                        />
                    </Box>
                </>
                )}
            </Box>
            <CalendarPopup
                anchorEl={calendarAnchorEl}
                open={isCalendarOpen}
                onClose={handleCalendarClose}
                onDateChange={handleDateChange}
                onDateLabelChange={handleDateLabelChange}
                onApply={handleApply}
            />
        </>

    );
};

export default PartnersAdmin;