import { payoutsStyle } from "./payoutsStyle";
import { Button, IconButton, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { Box } from "@mui/system";
import dayjs from "dayjs";
import CustomTablePagination from "@/components/CustomTablePagination";
import { useEffect, useState } from "react";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { DateRangeIcon } from "@mui/x-date-pickers";
import SearchIcon from '@mui/icons-material/Search';
import { showErrorToast, showToast } from "@/components/ToastNotification";
import CustomizedProgressBar from "@/components/ProgressBar";
import CalendarPopup from "@/components/CustomCalendar";
import Image from "next/image";

interface RewardData {
    month: string;
    is_payment_active: boolean;
    company_name: string;
    email: string;
    join_date: Date;
    commission: number;
    partner_id: number;
    reward_amount: string;
    reward_approved: string;
    reward_payout_date: Date;
    reward_status: string;
    is_auto_payout_date?: boolean;
}


interface MonthDetailsProps {
    onBack: () => void;
    selectedMonth: string;
    open: boolean;
    onPartnerClick: (partner_id: number, partner_name: string, selected_year: string,) => void;
    selectedYear: string;
}

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
        case 'paid':
            return {
                background: 'rgba(234, 248, 221, 1)',
                color: 'rgba(43, 91, 0, 1)',
            };
        case 'Pending':
            return {
                background: 'rgba(236, 236, 236, 1)',
                color: 'rgba(74, 74, 74, 1)',
            };
        case 'pending':
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

const tableHeaders = [
    { key: 'account_name', label: 'Master Partner name', sortable: false },
    { key: 'email', label: 'Email', sortable: false },
    { key: 'join_date', label: 'Join date', sortable: true },
    { key: 'comission', label: 'Comission', sortable: false },
    { key: 'reward_amount', label: 'Reward amount', sortable: false },
    { key: 'reward_approved', label: 'Reward approved', sortable: false },
    { key: 'reward_payout_date', label: 'Reward Payout date', sortable: true },
    { key: 'reward_status', label: 'Reward status', sortable: false },
    { key: 'actions', label: 'Actions', sortable: false },
];

const MonthDetails: React.FC<MonthDetailsProps> = ({ open, onBack, selectedMonth, onPartnerClick, selectedYear }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [data, setData] = useState<RewardData[] | []>([]);
    const [search, setSearch] = useState("");

    // Calendar
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


    const handleSearchChange = (event: any) => {
        setSearch(event.target.value);
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

    const handlePayOutReferral = async (partnerId: number) => {
        try {
            const response = await axiosInstance.get(`admin-payouts/pay-out-referrals/${partnerId}`);
            await fetchRewardData()
            showToast(response.data.status)
        } catch (error) {
            showErrorToast("Error during payment")
        }
    };


    useEffect(() => {
        if (open) {
            fetchRewardData();
        }
    }, [open, appliedDates, orderBy, order]);

    const fetchRewardData = async () => {
        try {
            setIsLoading(true)
            const monthArray = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];

            const selectedMonthNumber = selectedMonth
                ? monthArray.indexOf(selectedMonth) + 1
                : undefined;

            const params: { [key: string]: any } = {
                year: selectedYear,
                month: selectedMonthNumber,
                is_master: true,
            };

            if (appliedDates.start && appliedDates.end) {
                params.from_date = Math.floor(new Date(appliedDates.start).getTime() / 1000);
                params.to_date = Math.floor(new Date(appliedDates.end).getTime() / 1000);
            }

            if (search) {
                params.search_query = search
            }

            if (orderBy) {
                params.sort_by = orderBy
                params.sort_order = order
            }

            const response = await axiosInstance.get("/admin-payouts/partners", { params });

            const rewards: RewardData[] = response?.data.map((reward: any) => {
                let isAutoPayoutDate = false;
                const rewardPayoutDate = reward.reward_payout_date
                    ? new Date(reward.reward_payout_date)
                    : (() => {
                        isAutoPayoutDate = true;
                        const currentDate = new Date();
                        const nextMonth = currentDate.getMonth() + 1;
                        return new Date(currentDate.getFullYear(), nextMonth, 1);
                    })();

                return {
                    is_payment_active: reward.is_payment_active,
                    partner_id: reward.partner_id,
                    company_name: reward.company_name,
                    email: reward.email,
                    sources: reward.sources,
                    number_of_accounts: reward.number_of_accounts,
                    reward_amount: reward.reward_amount,
                    reward_approved: reward.reward_approved,
                    reward_payout_date: rewardPayoutDate,
                    is_auto_payout_date: isAutoPayoutDate,
                    reward_status: reward.reward_status,
                };
            });

            setData(rewards);
            setTotalCount(rewards.length);
        } catch (error) {
        } finally {
            setIsLoading(false)
        }
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



    return (
        <Box sx={{
            backgroundColor: '#fff',
            width: '100%',
            padding: 0,
            margin: '0rem auto 0rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '77vh',
        }}>
            {isLoading &&
            <CustomizedProgressBar />
            }
            <Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', mb: 2 }}>

                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mb: 2, gap: 2 }}>
                        <IconButton
                            onClick={onBack}
                            sx={{
                                textTransform: "none",
                                backgroundColor: "#fff",
                                border: '0.73px solid rgba(184, 184, 184, 1)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                padding: 0.25
                            }}
                        >
                            <KeyboardArrowLeftIcon sx={{ color: "rgba(128, 128, 128, 1)" }} />
                        </IconButton>
                        <Typography className="second-sub-title">{selectedMonth} {selectedYear}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                        <TextField
                            id="input-with-icon-textfield"
                            placeholder="Search by partner name, emails"
                            value={search}
                            onChange={handleSearchChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                    fetchRewardData();
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon onClick={fetchRewardData} style={{ cursor: "pointer" }} />
                                    </InputAdornment>
                                ),
                            }}
                            variant="outlined"
                            sx={{
                                flex: 1,
                                width: '360px',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '4px',
                                    height: '44px',
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
                                color: formattedDates ? 'rgba(56, 152, 252, 1)' : 'rgba(128, 128, 128, 1)',
                                border: formattedDates ? '1.5px solid rgba(56, 152, 252, 1)' : '1.5px solid rgba(184, 184, 184, 1)',
                                borderRadius: '4px',
                                padding: '8px',
                                minWidth: 'auto',
                                '@media (max-width: 900px)': {
                                    border: 'none',
                                    padding: 0
                                },
                                '&:hover': {
                                    border: '1.5px solid rgba(56, 152, 252, 1)',
                                    '& .MuiSvgIcon-root': {
                                        color: 'rgba(56, 152, 252, 1)'
                                    }
                                }
                            }}
                        >
                            <DateRangeIcon
                                fontSize="medium"
                                sx={{ color: formattedDates ? 'rgba(56, 152, 252, 1)' : 'rgba(128, 128, 128, 1)' }}
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


                <Box sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '76vh',
                }}>
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
                                                    ...payoutsStyle.tableColumn,
                                                    ...(key === 'account_name' && {
                                                        position: 'sticky',
                                                        left: 0,
                                                        zIndex: 1,
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
                                    {data && data.length === 0 ? (
                                        <TableRow sx={payoutsStyle.tableBodyRow}>
                                            <TableCell
                                                colSpan={9}
                                                sx={{
                                                    ...payoutsStyle.tableBodyColumn,
                                                    textAlign: 'center',
                                                    paddingTop: '16px',
                                                    paddingBottom: '16px',
                                                }}
                                            >
                                                <Typography className="second-sub-title">
                                                    No rewards details
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data && data.map((item, index) => (
                                            <TableRow key={index} sx={{
                                                ...payoutsStyle.tableBodyRow,
                                                '&:hover': {
                                                    backgroundColor: '#F7F7F7',
                                                    '& .sticky-cell': {
                                                        backgroundColor: '#F7F7F7',
                                                    }
                                                },
                                            }}>
                                                <TableCell className='sticky-cell table-data' sx={{
                                                    ...payoutsStyle.tableBodyColumn,
                                                    cursor: 'pointer',
                                                    position: 'sticky',
                                                    color: 'rgba(56, 152, 252, 1) !important',
                                                    left: 0,
                                                    zIndex: 1,
                                                    backgroundColor: '#fff',
                                                }}
                                                    onClick={() => onPartnerClick(item.partner_id, item.company_name, selectedYear)}
                                                >
                                                    {item.company_name}
                                                </TableCell>

                                                <TableCell className='table-data' sx={payoutsStyle.tableBodyColumn}>
                                                    {item.email}
                                                </TableCell>

                                                <TableCell className='table-data' sx={payoutsStyle.tableBodyColumn}>
                                                    {dayjs(item.join_date).format('MMM D, YYYY')}
                                                </TableCell>

                                                <TableCell className='table-data' sx={payoutsStyle.tableBodyColumn}>
                                                    {item.commission}
                                                </TableCell>

                                                <TableCell className='table-data' sx={payoutsStyle.tableBodyColumn}>
                                                    {item.reward_amount}
                                                </TableCell>

                                                <TableCell className='table-data' sx={payoutsStyle.tableBodyColumn}>
                                                    {item.reward_approved}
                                                </TableCell>

                                                <TableCell className="table-data" sx={payoutsStyle.tableBodyColumn}>
                                                    {item.is_auto_payout_date ? (
                                                        <Typography className="table-data" sx={{ fontStyle: "italic", color: "gray" }}>
                                                            Would be paid on {dayjs(item.reward_payout_date).format('MMM D, YYYY')}
                                                        </Typography>
                                                    ) : (
                                                        dayjs(item.reward_payout_date).format('MMM D, YYYY') || '--'
                                                    )}
                                                </TableCell>

                                                <TableCell sx={{ ...payoutsStyle.tableColumn, textAlign: 'center', pl: 0 }}>
                                                    <Typography component="span" sx={{
                                                        background: getStatusStyle(item.reward_status).background,
                                                        padding: '6px 8px',
                                                        borderRadius: '2px',
                                                        fontFamily: 'Roboto',
                                                        fontSize: '12px',
                                                        fontWeight: '400',
                                                        lineHeight: '16px',
                                                        margin: 0,
                                                        color: getStatusStyle(item.reward_status.charAt(0).toUpperCase() + item.reward_status.slice(1)).color,
                                                    }}>
                                                        {item.reward_status.charAt(0).toUpperCase() + item.reward_status.slice(1)}
                                                    </Typography>
                                                </TableCell>


                                                <TableCell className='table-data'>
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => {
                                                            if (item.is_payment_active) {
                                                                handlePayOutReferral(item.partner_id);
                                                            }
                                                        }}
                                                        sx={{
                                                            backgroundColor: item.reward_status === 'paid' ? '#fff' : '#fff',
                                                            fontFamily: "Nunito Sans",
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            lineHeight: '20px',
                                                            letterSpacing: 'normal',
                                                            color: "rgba(56, 152, 252, 1)",
                                                            border: '1px solid rgba(56, 152, 252, 1)',
                                                            textTransform: 'none',
                                                            padding: '5px 8px',
                                                            margin: 0,
                                                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                            opacity: item.reward_status === 'paid' ? 0.6 : 1,
                                                            pointerEvents: item.reward_status === 'paid' ? 'none' : 'auto',
                                                            '&:hover': {
                                                                backgroundColor: item.reward_status === 'paid' ? '#FFF' : 'rgba(56, 152, 252, 1)',
                                                                color: item.reward_status === 'paid' ? "rgba(56, 152, 252, 1)" : '#fff',
                                                            },
                                                            borderRadius: '4px'
                                                        }}
                                                    >
                                                        Pay
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )))}
                                </TableBody>
                            </Table>
                        </TableContainer>
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
                    <CalendarPopup
                        anchorEl={calendarAnchorEl}
                        open={isCalendarOpen}
                        onClose={handleCalendarClose}
                        onDateChange={handleDateChange}
                        onApply={handleApply}
                        onDateLabelChange={handleDateLabelChange}
                    />
                </Box>

            </Box>
        </Box>
    );
};

export default MonthDetails;