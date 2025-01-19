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

interface RewardData {
    partner_id: number;
    month: string;
    partner_name: string;
    email: string;
    sources: string;
    number_of_accounts: number;
    reward_amount: string;
    reward_approved: string;
    reward_payout_date: Date;
    reward_status: string;
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

const tableHeaders = [
    { key: 'account_name', label: 'Partner name', sortable: false },
    { key: 'email', label: 'Email', sortable: false },
    { key: 'sources', label: 'Sources', sortable: false },
    { key: 'number_of_accounts', label: 'No.of accounts', sortable: false },
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

    useEffect(() => {
        if (open) {
            fetchRewardData();
        }
    }, [open]);

    const fetchRewardData = async () => {
        try {
            // Отправляем GET-запрос на эндпоинт с параметрами year и month
            const response = await axiosInstance.get("/admin-payouts/partners", {
                params: {
                    year: selectedYear,
                    month: selectedMonth,
                },
            });

            // Обработка данных из ответа
            const rewards: RewardData[] = response.data.map((reward: any) => ({
                partner_name: reward.partner_name,
                email: reward.email,
                sources: reward.sources,
                number_of_accounts: reward.number_of_accounts,
                reward_amount: reward.reward_amount,
                reward_approved: reward.reward_approved,
                reward_payout_date: new Date(reward.reward_payout_date), // Преобразуем строку в объект Date
                reward_status: reward.reward_status,
            }));

            setData(rewards); // Устанавливаем данные в состояние
            setTotalCount(rewards.length); // Устанавливаем общее количество
        } catch (error) {
        }
    };

    const testData: RewardData[] = [
        {   
            partner_id: 1,
            month: selectedMonth,
            partner_name: "Lolly",
            email: "abcdefghijkl@gmail.com",
            sources: "Direct",
            number_of_accounts: 12,
            reward_amount: "$200",
            reward_approved: "$200",
            reward_payout_date: new Date("2024-08-27"),
            reward_status: "Paid",
        },
        {   
            partner_id:2,
            month: selectedMonth,
            partner_name: "Klaviyo",
            email: "abcdefghijkl@gmail.com",
            sources: "Lolly",
            number_of_accounts: 10,
            reward_amount: "$200",
            reward_approved: "$200",
            reward_payout_date: new Date("2024-08-27"),
            reward_status: "Pending",
        },
        {   
            partner_id: 3,
            month: selectedMonth,
            partner_name: "Maximiz",
            email: "abcdefghijkl@gmail.com",
            sources: "Direct",
            number_of_accounts: 12,
            reward_amount: "$200",
            reward_approved: "$200",
            reward_payout_date: new Date("2024-08-27"),
            reward_status: "Paid",
        },
        {   
            partner_id: 4,
            month: selectedMonth,
            partner_name: "Meta",
            email: "abcdefghijkl@gmail.com",
            sources: "Lolly",
            number_of_accounts: 10,
            reward_amount: "$200",
            reward_approved: "$200",
            reward_payout_date: new Date("2024-08-27"),
            reward_status: "Pending",
        },
    ]



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
                            </Typography>
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
                                                    color: 'rgba(80, 82, 178, 1) !important',
                                                    left: 0,
                                                    zIndex: 1,
                                                    backgroundColor: '#fff',
                                                }}
                                                    onClick={() => onPartnerClick(item.partner_id, item.partner_name, selectedYear)}
                                                >
                                                    {item.partner_name}
                                                </TableCell>

                                                <TableCell className='table-data' sx={payoutsStyle.tableBodyColumn}>
                                                    {item.email}
                                                </TableCell>

                                                <TableCell className='table-data' sx={payoutsStyle.tableBodyColumn}>
                                                    {item.sources}
                                                </TableCell>

                                                <TableCell className='table-data' sx={payoutsStyle.tableBodyColumn}>
                                                    {item.number_of_accounts}
                                                </TableCell>

                                                <TableCell className='table-data' sx={payoutsStyle.tableBodyColumn}>
                                                    {item.reward_amount}
                                                </TableCell>

                                                <TableCell className='table-data' sx={payoutsStyle.tableBodyColumn}>
                                                    {item.reward_approved}
                                                </TableCell>

                                                <TableCell className='table-data' sx={payoutsStyle.tableBodyColumn}>
                                                    {dayjs(item.reward_payout_date).format('MMM D, YYYY')}
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
                                                        color: getStatusStyle(item.reward_status).color,
                                                    }}>
                                                        {item.reward_status}
                                                    </Typography>
                                                </TableCell>


                                                <TableCell className='table-data'>
                                                    <Button
                                                        variant="contained"
                                                        //onClick={() => ()}
                                                        sx={{
                                                            backgroundColor: item.reward_status === 'Paid' ? '#fff' : '#fff', // Белый фон всегда
                                                            fontFamily: "Nunito Sans",
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            lineHeight: '20px',
                                                            letterSpacing: 'normal',
                                                            color: "rgba(80, 82, 178, 1)",
                                                            border: '1px solid rgba(80, 82, 178, 1)',
                                                            textTransform: 'none',
                                                            padding: '5px 8px',
                                                            margin: 0,
                                                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                            opacity: item.reward_status === 'Paid' ? 0.6 : 1,
                                                            pointerEvents: item.reward_status === 'Paid' ? 'none' : 'auto',
                                                            '&:hover': {
                                                                backgroundColor: item.reward_status === 'Paid' ? '#FFF' : '#5052B2',
                                                                color: item.reward_status === 'Paid' ? "rgba(80, 82, 178, 1)" : '#fff',
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
                </Box>

            </Box>
        </Box>
    );
};

export default MonthDetails;