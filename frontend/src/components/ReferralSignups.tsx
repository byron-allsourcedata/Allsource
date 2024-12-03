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

const tableHeaders = [
    { key: 'personal_email', label: 'Personal Email', sortable: false },
    { key: 'company_name', label: 'Company name', sortable: false },
    { key: 'join_date', label: 'Join date', sortable: true },
    { key: 'reward_status', label: 'Reward status', sortable: false },
    { key: 'reward_payout_date', label: 'Reward Payout date', sortable: true },
    { key: 'invite_status', label: 'Invite Status', sortable: false },
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
        case 'Pending':
            return {
                background: 'rgba(236, 236, 236, 1)',
                color: 'rgba(74, 74, 74, 1)',
            };
        default:
            return {
                background: 'transparent',
                color: 'inherit',
            };
    }
};



const ReferralSignups: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState<number | false>(false);
    const [signupsInfo, setSignupsInfo] = useState<any[]>([]);
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

    const handleSortRequest = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
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
            // const response = await axiosInstance

        } catch (err) {
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // fetchRules();
        setSignupsInfo([
            {
                personal_email: "abc@gmail.com",
                company_name: 'lolly',
                join_date: "2024-08-27T10:00:00Z",
                reward_status: 'Paid',
                reward_payout_date: "2024-08-27T10:00:00Z",
                invite_status: "Pending",
            },
            {
                personal_email: "abc@gmail.com",
                company_name: 'lolly',
                join_date: "2024-08-27T10:00:00Z",
                reward_status: 'Paid',
                reward_payout_date: "2024-08-27T10:00:00Z",
                invite_status: "Accepted",
            },
            {
                personal_email: "abc@gmail.com",
                company_name: 'lolly',
                join_date: "2024-08-27T10:00:00Z",
                reward_status: 'Pending',
                reward_payout_date: "2024-08-27T10:00:00Z",
                invite_status: "Accepted",
            },
            {
                personal_email: "abc@gmail.com",
                company_name: 'lolly',
                join_date: "2024-08-27T10:00:00Z",
                reward_status: 'Paid',
                reward_payout_date: "2024-08-27T10:00:00Z",
                invite_status: "Accepted",
            },
            {
                personal_email: "abc@gmail.com",
                company_name: 'lolly',
                join_date: "2024-08-27T10:00:00Z",
                reward_status: 'Pending',
                reward_payout_date: "2024-08-27T10:00:00Z",
                invite_status: "Accepted",
            },
        ])
    }, [fetchRules]);

    const [referralLink, setReferralLink] = useState('1233213213tttttt');

    const handleCopyClick = () => {
        navigator.clipboard.writeText(referralLink).then(() => {
            alert('Referral link copied!');
        }).catch(err => {
        });
    };


    return (
        <>
            {loading &&
                <CustomizedProgressBar />
            }
            <Box sx={{
                backgroundColor: '#fff',
                width: '100%',
                padding: 0,
                margin: '3rem auto 0rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '77vh',
                '@media (max-width: 600px)': {margin: '0rem auto 0rem'}
            }}>
                {signupsInfo.length === 0 ? (
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
                        <Box sx={{ display: 'flex', width: '100%', justifyContent: 'end', mb: 2, alignItems: 'center', gap: 2 }}>
                            <Typography className="second-sub-title">{selectedDateLabel ? selectedDateLabel : 'All time'}</Typography>
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
                                                        ...suppressionsStyles.tableColumn,
                                                        ...(key === 'personal_email' && {
                                                            position: 'sticky',
                                                            left: 0,
                                                            zIndex: 99,
                                                            backgroundColor: '#fff',
                                                        }),
                                                    }}
                                                    onClick={sortable ? () => handleSortRequest(key) : undefined}
                                                    style={{ cursor: sortable ? 'pointer' : 'default' }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Typography variant="body2" className='table-heading'>{label}</Typography>
                                                        {sortable && orderBy === key && (
                                                            <IconButton size="small" sx={{ ml: 1 }}>
                                                                {order === 'asc' ? (
                                                                    <ArrowUpwardIcon fontSize="inherit" />
                                                                ) : (
                                                                    <ArrowDownwardIcon fontSize="inherit" />
                                                                )}
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {signupsInfo.map((data, index) => (
                                            <TableRow key={index} sx={{
                                                ...suppressionsStyles.tableBodyRow,
                                                '&:hover': {
                                                    backgroundColor: '#F7F7F7',
                                                    '& .sticky-cell': {
                                                        backgroundColor: '#F7F7F7',
                                                    }
                                                },
                                            }}>
                                                <TableCell className='sticky-cell table-data' sx={{
                                                    ...suppressionsStyles.tableBodyColumn,
                                                    position: 'sticky',
                                                    left: 0,
                                                    zIndex: 1,
                                                    backgroundColor: '#fff',
                                                }}>
                                                    {data.personal_email}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {data.company_name}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {dayjs(data.join_date).format('MMM D, YYYY')}
                                                </TableCell>

                                                <TableCell sx={{ ...suppressionsStyles.tableColumn, textAlign: 'center', pl: 0 }}>
                                                    <Typography component="span" sx={{
                                                        background: getStatusStyle(data.reward_status).background,
                                                        padding: '6px 8px',
                                                        borderRadius: '2px',
                                                        fontFamily: 'Roboto',
                                                        fontSize: '12px',
                                                        fontWeight: '400',
                                                        lineHeight: '16px',
                                                        color: getStatusStyle(data.reward_status).color,
                                                    }}>
                                                        {data.reward_status}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {dayjs(data.reward_payout_date).format('MMM D, YYYY')}
                                                </TableCell>

                                                <TableCell sx={{ ...suppressionsStyles.tableColumn, textAlign: 'center', pl: 0 }}>
                                                    <Typography component="span" sx={{
                                                        background: getStatusStyle(data.invite_status).background,
                                                        padding: '6px 8px',
                                                        borderRadius: '2px',
                                                        fontFamily: 'Roboto',
                                                        fontSize: '12px',
                                                        fontWeight: '400',
                                                        lineHeight: '16px',
                                                        color: getStatusStyle(data.invite_status).color,
                                                    }}>
                                                        {data.invite_status}
                                                    </Typography>
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

export default ReferralSignups;