import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, TextField, Button, FormControl, InputLabel, MenuItem, Select, IconButton, InputAdornment, Accordion, AccordionSummary, AccordionDetails, DialogActions, DialogContent, DialogContentText, Popover, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import CustomizedProgressBar from "./CustomizedProgressBar";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { suppressionsStyles } from "@/css/suppressions";
import dayjs from "dayjs";
import CustomTablePagination from "./CustomTablePagination";
import Image from "next/image";
import CalendarPopup from "./CustomCalendar";
import { DateRangeIcon } from "@mui/x-date-pickers/icons";
import SearchIcon from '@mui/icons-material/Search';
import SwapVertIcon from '@mui/icons-material/SwapVert';

const tableHeaders = [
    { key: 'account_name', label: 'Account name', sortable: false },
    { key: 'email', label: 'Email', sortable: false },
    { key: 'join_date', label: 'Join date', sortable: true },
    { key: 'plan_amount', label: 'Plan amount', sortable: false },
    { key: 'reward_status', label: 'Reward status', sortable: false },
    { key: 'reward_payout_date', label: 'Reward Payout date', sortable: true },
    { key: 'last_payment_date', label: 'Last payment date', sortable: true },
    { key: 'status', label: 'Status', sortable: false },
];

const getStatusStyle = (status: string) => {
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

interface PartnersAccountsProps {
    id: number | null;
    loading: boolean;
    setLoading: (state: boolean) => void;
}



const PartnersAccounts: React.FC<PartnersAccountsProps> = ({id, loading, setLoading}) => {

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

    const fetchRules = async () => {
        setLoading(true)

        try {
        const response = await axiosInstance.get(`/accounts`, {params: { id }});
        setAccounts([...response.data])
        } catch {
            // showErrorToast("Failed to delete partner. Please try again later.");
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) {
            fetchRules();
        }
        else {
            // setAccounts([
            //     {
            //         account_name: "Lolly",
            //         email: "abc@gmail.com",
            //         join_date: "2024-08-27T10:00:00Z",
            //         plan_amount: '$200',
            //         reward_status: 'Paid',
            //         reward_amount: '$2000',
            //         reward_payout_date: "2024-08-27T10:00:00Z",
            //         last_payment_date: "2024-08-27T10:00:00Z",
            //         status: "Free trial",
            //     },
            //     {
            //         account_name: "Lolly",
            //         email: "abc@gmail.com",
            //         join_date: "2024-08-27T10:00:00Z",
            //         plan_amount: '$200',
            //         reward_status: 'Pending',
            //         reward_amount: '$2000',
            //         reward_payout_date: "2024-08-28T10:00:00Z",
            //         last_payment_date: "2024-08-27T10:00:00Z",
            //         status: "Active",
            //     },
            //     {
            //         account_name: "Lolly",
            //         email: "abc@gmail.com",
            //         join_date: "2024-08-29T10:00:00Z",
            //         plan_amount: '--',
            //         reward_status: 'Accepted',
            //         reward_amount: '$2000',
            //         reward_payout_date: "2024-08-27T10:00:00Z",
            //         last_payment_date: "2024-08-27T10:00:00Z",
            //         status: "Signup",
            //     },
            //     {
            //         account_name: "Lolly",
            //         email: "abc@gmail.com",
            //         join_date: "2024-10-27T10:00:00Z",
            //         plan_amount: '$200',
            //         reward_status: 'Paid',
            //         reward_amount: '$2000',
            //         reward_payout_date: "2024-08-27T10:00:00Z",
            //         last_payment_date: "2024-08-27T10:00:00Z",
            //         status: "Pending",
            //     },
            // ])
        }
    }, [id]);

    const [referralLink, setReferralLink] = useState('1233213213tttttt');

    const handleCopyClick = () => {
        navigator.clipboard.writeText(referralLink).then(() => {
            alert('Referral link copied!');
        }).catch(err => {
        });
    };


    return (
        <>
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
                {accounts.length === 0 && !loading ? (
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
                            {/* <Typography className="second-sub-title">{selectedDateLabel ? selectedDateLabel : 'All time'}</Typography> */}
                            <Typography  variant="h4" component="h2"
                                sx={{
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    whiteSpace: 'nowrap',
                                    textAlign: 'start',
                                    fontFamily: 'Nunito Sans',                                  
                                }}>
                                Accounts
                            </Typography>
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
                                                    width: '360px',
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '4px',
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
                                                    sx={{
                                                        paddingLeft: "16px", 
                                                        cursor: sortable ? 'pointer' : 'default',
                                                        ...suppressionsStyles.tableColumn, 
                                                        ...(key === 'account_name' && { 
                                                            position: 'sticky',
                                                            left: 0,
                                                            zIndex: 99,
                                                            backgroundColor: '#fff',
                                                            
                                                        })
                                                    }}
                                                    onClick={sortable ? () => handleSortRequest(key) : undefined}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }} style={key === "status" || key === "reward_status" ? { justifyContent: "center" } : {}}>
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
                                                ...suppressionsStyles.tableBodyRow
                                            }}>
                                                <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, 
                                                    paddingLeft: "16px",
                                                    position: 'sticky',
                                                    left: 0,
                                                    zIndex: 1,
                                                    backgroundColor: '#fff'
                                                }}>
                                                    {data.account_name}
                                                </TableCell>

                                                <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                    {data.email}
                                                </TableCell>

                                                <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                    {dayjs(data.join_date).format('MMM D, YYYY')}
                                                </TableCell>

                                                <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                    {data.plan_amount}
                                                </TableCell>

                                                <TableCell sx={{ ...suppressionsStyles.tableColumn, paddingLeft: "16px", textAlign: 'center' }}>
                                                    <Box sx={{display: "flex", justifyContent: "center"}}>
                                                        <Typography component="div" sx={{
                                                            width: "74px",
                                                            margin: "0",
                                                            background: getStatusStyle(data.status).background,
                                                            padding: '3px 8px',
                                                            borderRadius: '2px',
                                                            fontFamily: 'Roboto',
                                                            fontSize: '12px',
                                                            fontWeight: '400',
                                                            lineHeight: '16px',
                                                            color: getStatusStyle(data.status).color,
                                                        }}>
                                                            {data.reward_status}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>

                                                {/* {id && <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {data.reward_amount}
                                                </TableCell>} */}

                                                <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                    {dayjs(data.reward_payout_date).format('MMM D, YYYY')}
                                                </TableCell>

                                                <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                    {dayjs(data.last_payment_date).format('MMM D, YYYY')}
                                                </TableCell>

                                                <TableCell sx={{ ...suppressionsStyles.tableColumn, paddingLeft: "16px", textAlign: 'center'}}>
                                                    <Box sx={{display: "flex", justifyContent: "center"}}>
                                                        <Typography component="div" sx={{
                                                            width: "74px",
                                                            margin: "0",
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
                                                    </Box>
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

export default PartnersAccounts;