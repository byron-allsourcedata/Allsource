import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, TextField, Button, Tabs, Tab, IconButton, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
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
import { useRouter } from "next/navigation";
import { useUser } from '@/context/UserContext';
import { Solitreo } from "next/font/google";

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
        case 'Inactive':
            return {
                background: 'rgba(236, 236, 236, 1)',
                color: 'rgba(74, 74, 74, 1)',
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
    appliedDates?: { start: Date | null; end: Date | null };
    id?: number | null;
    fromAdmin?: boolean;
    masterData?: any;
    loading?: boolean;
    setLoading: (state: boolean) => void;
    tabIndex?: number;
    handleTabChange?: (event: React.SyntheticEvent | null, newIndex: number) => void;
    setMasterData?: any
}

interface AccountData {
    id: number;
    account_name: string;
    email: string;
    join_date: Date | string;
    plan_amount: string;
    reward_status: string;
    reward_amount: string;
    reward_payout_date: string;
    last_payment_date: string;
    status: string;
}


const PartnersAccounts: React.FC<PartnersAccountsProps> = ({ appliedDates: appliedDatesFromMain, id: partnerId, fromAdmin, masterData, setMasterData, loading, setLoading, tabIndex, handleTabChange }) => {
    const [accounts, setAccounts] = useState<AccountData[]>([]);
    const router = useRouter();
    const [page, setPage] = useState(0);
    const {setBackButton, triggerBackButton} = useUser();
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(null);
    const isCalendarOpen = Boolean(calendarAnchorEl);
    const [formattedDates, setFormattedDates] = useState<string>('');
    const [appliedDates, setAppliedDates] = useState<{ start: Date | null; end: Date | null }>(appliedDatesFromMain ?? { start: null, end: null });
    const [selectedDateLabel, setSelectedDateLabel] = useState<string>('');
    const id = partnerId ?? masterData?.id
    const allowedRowsPerPage = [10, 25, 50, 100];
    const [search, setSearch] = useState("");
    const [errorResponse, setErrosResponse] = useState(false);

    const handleSearchChange = (event: any) => {
        setSearch(event.target.value);
    };

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


    const fetchRules = useCallback(async () => {
        setLoading(true)
        let response

        try {
            if (id) {
                response = await axiosInstance.get(`/admin-accounts/${id}/`, {
                    params: {
                        search,
                        start_date: appliedDates.start ? appliedDates.start.toLocaleDateString('en-CA') : null,
                        end_date: appliedDates.end ? appliedDates.end.toLocaleDateString('en-CA') : null,
                        page,
                        rows_per_page: rowsPerPage,
                        order_by: orderBy,
                        order,
                    }
                });
            }
            else {
                response = await axiosInstance.get(`/partners/accounts`, {
                    params: {
                        search,
                        start_date: appliedDates.start ? appliedDates.start.toLocaleDateString('en-CA') : null,
                        end_date: appliedDates.end ? appliedDates.end.toLocaleDateString('en-CA') : null,
                        page,
                        rows_per_page: rowsPerPage,
                        order_by: orderBy,
                        order,
                    }
                });
            }
            if (response.status === 200 && response.data.totalCount > 0) {
                setAccounts([...response.data.items])
                setErrosResponse(false)
                setTotalCount(response.data.totalCount)
            }
            else {
                setAccounts([])
                setErrosResponse(true)
                setTotalCount(0)
            }
        } catch {
        } finally {
            setLoading(false)
        }
    }, [search, appliedDates, page, rowsPerPage, orderBy, order]);

    useEffect(() => {
        fetchRules();
    }, [id, appliedDates, page, rowsPerPage, orderBy, order]);

    useEffect(() => {
        if (
            appliedDatesFromMain?.start instanceof Date || appliedDatesFromMain?.start === null &&
            appliedDatesFromMain?.end instanceof Date || appliedDatesFromMain?.end === null
        ) {
            setAppliedDates(appliedDatesFromMain);
        }

    }, [appliedDatesFromMain]);

    const handleLogin = async (user_account_id: number) => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/referral/generate-token', {
                params: {
                    user_account_id: user_account_id
            }})
            if (response.status === 200){
                const current_token = localStorage.getItem('token')
                const current_domain = sessionStorage.getItem('current_domain')
                sessionStorage.setItem('parent_domain', current_domain || '')
                if (current_token){
                    setBackButton(true)
                    triggerBackButton()
                    localStorage.setItem('parent_token', current_token)
                    localStorage.setItem('token', response.data.token)
                    sessionStorage.removeItem('current_domain')
                    sessionStorage.removeItem('me')
                    router.push('/dashboard')
                    router.refresh()
                }
            }
        }
        catch{
        }
        finally{
            setLoading(false)
        }
    }


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
                '@media (max-width: 600px)': { margin: '0rem auto 0rem' }
            }}>
                <Box>
                    {fromAdmin &&
                        <>
                            <Box sx={{ display: "flex", alignItems: "center", gap: "5px", mb: "24px" }}>
                                <Typography onClick={() => {
                                    if (handleTabChange) {
                                        handleTabChange(null, 0)
                                        setMasterData(null)
                                    }
                                }}
                                    sx={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'Nunito Sans', color: "#808080", cursor: "pointer" }}>
                                    Master Partner {masterData.partner_name ? `- ${masterData.partner_name}` : ""}
                                </Typography>
                                {/* <NavigateNextIcon width={16}/>
                        <Typography sx={{fontWeight: 'bold', fontSize: '12px', fontFamily: 'Nunito Sans', color: "#808080"}}>
                            {accountName}
                        </Typography> */}
                            </Box>
                            <Typography variant="h4" component="h1" sx={{
                                lineHeight: "22.4px",
                                color: "#202124",
                                fontWeight: 'bold',
                                fontSize: '16px',
                                mb: "24px",
                                fontFamily: 'Nunito Sans'
                            }}>
                                Master Partners
                            </Typography>
                        </>}
                    <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mb: fromAdmin ? 2 : 6, alignItems: 'center', gap: 2 }}>
                        {fromAdmin
                            &&
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
                                aria-label="partners role tabs"
                            >
                                <Tab className="main-text"
                                    sx={{
                                        textTransform: 'none',
                                        padding: '4px 1px',
                                        minHeight: 'auto',
                                        flexGrow: 1,
                                        pb: '10px',
                                        textAlign: 'center',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        lineHeight: '19.1px',
                                        minWidth: 'auto',
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
                                    label="Accounts"
                                />
                                <Tab className="main-text"
                                    sx={{
                                        display: "none",
                                        textTransform: 'none',
                                        padding: '4px 1px',
                                        minHeight: 'auto',
                                        flexGrow: 1,
                                        pb: '10px',
                                        textAlign: 'center',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        lineHeight: '19.1px',
                                        minWidth: 'auto',
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
                                    label="Master partners"
                                />
                                <Tab className="main-text"
                                    sx={{
                                        textTransform: 'none',
                                        padding: '4px 10px',
                                        pb: '10px',
                                        flexGrow: 1,
                                        minHeight: 'auto',
                                        minWidth: 'auto',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        lineHeight: '19.1px',
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
                                    label="Partners"
                                />
                            </Tabs>}
                        <Box sx={{ display: 'flex', gap: "16px" }}>
                            {fromAdmin &&
                                <>
                                    <TextField
                                        id="input-with-icon-textfield"
                                        placeholder="Search by account name, emails"
                                        value={search}
                                        onChange={handleSearchChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                fetchRules();
                                            }
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon onClick={fetchRules} style={{ cursor: "pointer" }} />
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
                                </>}
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
                                                    paddingLeft: "16px",
                                                    cursor: sortable ? 'pointer' : 'default',
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
                                    {accounts.map((data) => (
                                        <TableRow key={data.id} sx={{
                                            ...suppressionsStyles.tableBodyRow,
                                            '&:hover': {
                                                backgroundColor: '#F7F7F7',
                                                '& .sticky-cell': {
                                                    backgroundColor: '#F7F7F7',
                                                }
                                            }
                                        }}>
                                            <TableCell className='table-data sticky-cell'
                                            onClick={() => handleLogin(data.id)}
                                            sx={{
                                                ...suppressionsStyles.tableBodyColumn,
                                                paddingLeft: "16px",
                                                position: 'sticky',
                                                left: 0,
                                                zIndex: 1,
                                                cursor: 'pointer',
                                                backgroundColor: '#fff',
                                                "&:hover .icon-button": {
                                                            display: "flex", // Показываем кнопку при наведении
                                                        },
                                            }}>

                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        color: "rgba(80, 82, 178, 1)",
                                                        gap: 0,
                                                        "&:hover .icon-button": {
                                                            display: "flex", // Показываем кнопку при наведении
                                                        },
                                                    }}
                                                >
                                                    {data.account_name}
                                                    <IconButton
                                                        className="icon-button"
                                                        sx={{
                                                            display: "none", // Скрыто по умолчанию
                                                            ":hover": { backgroundColor: "transparent" },
                                                            "@media (max-width: 600px)": {
                                                                display: "flex", // Всегда отображается на мобильных устройствах
                                                            },
                                                        }}
                                                    >
                                                        <Image src="/outband.svg" alt="outband" width={15.98} height={16} />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>

                                            <TableCell className='table-data' sx={{ ...suppressionsStyles.tableBodyColumn, paddingLeft: "16px" }}>
                                                {data.email}
                                            </TableCell>

                                            <TableCell className='table-data' sx={{ ...suppressionsStyles.tableBodyColumn, paddingLeft: "16px" }}>
                                                {dayjs(data.join_date).isValid() ? dayjs(data.join_date).format('MMM D, YYYY') : '--'}
                                            </TableCell>

                                            <TableCell className='table-data' sx={{ ...suppressionsStyles.tableBodyColumn, paddingLeft: "16px" }}>
                                                {data.plan_amount}
                                            </TableCell>

                                            <TableCell sx={{ ...suppressionsStyles.tableColumn, paddingLeft: "16px", textAlign: 'center' }}>
                                                <Box sx={{ display: "flex", justifyContent: "center" }}>
                                                    <Typography component="div" sx={{
                                                        width: "74px",
                                                        margin: "0",
                                                        background: getStatusStyle(data.reward_status).background,
                                                        padding: '3px 8px',
                                                        borderRadius: '2px',
                                                        fontFamily: 'Roboto',
                                                        fontSize: '12px',
                                                        fontWeight: '400',
                                                        lineHeight: '16px',
                                                        color: getStatusStyle(data.reward_status).color,
                                                    }}>
                                                        {data.reward_status}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            {/* {id && <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                {data.reward_amount}
                                            </TableCell>} */}

                                            <TableCell className='table-data' sx={{ ...suppressionsStyles.tableBodyColumn, paddingLeft: "16px" }}>
                                                {dayjs(data.reward_payout_date).isValid() ? dayjs(data.reward_payout_date).format('MMM D, YYYY') : '--'}
                                            </TableCell>

                                            <TableCell className='table-data' sx={{ ...suppressionsStyles.tableBodyColumn, paddingLeft: "16px" }}>
                                                {dayjs(data.last_payment_date).isValid() ? dayjs(data.last_payment_date).format('MMM D, YYYY') : '--'}
                                            </TableCell>

                                            <TableCell sx={{ ...suppressionsStyles.tableBodyColumn, paddingLeft: "16px", textAlign: 'center' }}>
                                                <Box sx={{ display: "flex", justifyContent: "center" }}>
                                                    <Typography component="div" sx={{
                                                        width: "100px",
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
                        {errorResponse && !loading && (
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
                        )}
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'end' }}>
                    <CustomTablePagination
                        count={totalCount}
                        page={page}
                        rowsPerPage={allowedRowsPerPage.includes(rowsPerPage) ? rowsPerPage : 10}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                    />
                </Box>
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