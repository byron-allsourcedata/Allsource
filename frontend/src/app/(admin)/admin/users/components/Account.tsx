import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, TextField, Button, Tabs, Tab, Grid, Pagination, Popover, Paper, IconButton, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { MoreHoriz } from "@mui/icons-material";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { suppressionsStyles } from "@/css/suppressions";
import dayjs from "dayjs";
import { leadsStyles } from "@/app/(client)/leads/leadsStyles";
import { datasyncStyle } from "@/app/(client)/data-sync/datasyncStyle";
import Image from "next/image";
import CustomTablePagination from "@/components/CustomTablePagination";
import { DateRangeIcon } from "@mui/x-date-pickers/icons";
import InviteAdmin from "./InviteAdmin";
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import CustomCards from "./CustomCards";
import { useRouter } from "next/navigation";
import { useUser } from '@/context/UserContext';
import { Solitreo } from "next/font/google";
import { fetchUserData } from "@/services/meService";


interface UserData {
    id: number;
    full_name: string;
    email: string;
    created_at: string;
    payment_status?: string;
    is_trial?: boolean;
    last_login: string;
    invited_by_email?: string;
    role: string[];
    pixel_installed_count?: number;
}


interface tableHeaders {
    key: string,
    label: string,
    sortable: boolean
}

interface TableBodyUserProps {
    data: UserData[],
    tableHeaders: tableHeaders[],
    setLoading: (state: boolean) => void;
}

const TableHeader: React.FC<{ onSort: (field: string) => void, sortField?: string, sortOrder?: string, tableHeaders: tableHeaders[] }> = ({ onSort, sortField, sortOrder, tableHeaders }) => {
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<string>('');

    return (
        <TableHead>
            <TableRow>
                {tableHeaders.map(({ key, label, sortable }) => (
                    <TableCell
                        key={key}
                        sx={{
                            ...datasyncStyle.table_column,
                            backgroundColor: "#fff",
                            textWrap: 'wrap',
                            textAlign: 'center',
                            position: "relative",
                            ...(key === "account_name" && {
                                position: "sticky",
                                left: 0,
                                zIndex: 1,
                            }),
                            ...(key === "actions" && {
                                "::after": {
                                    content: "none",
                                },
                            }),
                        }}
                        onClick={sortable ? () => onSort(key) : undefined}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }} style={key === "email" || key === "status" || key === "actions" ? { justifyContent: "center" } : {}}>
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
    );
};

const TableBodyClient: React.FC<TableBodyUserProps> = ({ data, tableHeaders, setLoading }) => {
    const router = useRouter();
    const { setBackButton, triggerBackButton } = useUser();

    const meItem = typeof window !== "undefined" ? sessionStorage.getItem("me") : null;
    const meData = meItem ? JSON.parse(meItem) : { full_name: '', email: '' };

    const handleLogin = async (user_account_id: number) => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/admin/generate-token', {
                params: {
                    user_account_id: user_account_id
                }
            })
            if (response.status === 200) {
                const current_token = localStorage.getItem('token')
                const current_domain = sessionStorage.getItem('current_domain')
                sessionStorage.setItem('parent_domain', current_domain || '')
                if (current_token) {
                    localStorage.setItem('parent_token', current_token)
                    localStorage.setItem('token', response.data.token)
                    sessionStorage.removeItem('current_domain')
                    sessionStorage.removeItem('me')
                    await fetchUserData()
                    router.push('/dashboard')
                    router.refresh()
                    setBackButton(true)
                    triggerBackButton()
                }
            }
        }
        catch {
        }
        finally {
            setLoading(false)
        }
    }

    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [activeRow, setActiveRow] = useState<number | null>(null);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, rowId: number) => {
        setMenuAnchor(event.currentTarget);
        setActiveRow(rowId);
    };

    const handleCloseMenu = () => {
        setMenuAnchor(null);
        setActiveRow(null);
    };

    const formatDate = (dateString: string | null): string => {
        if (!dateString) return '--';
        const date = new Date(dateString);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };
    const getStatusStyle = (behavior_type: any) => {
        switch (behavior_type) {
            case false:
                return {
                    background: 'rgba(235, 243, 254, 1)',
                    color: 'rgba(20, 110, 246, 1)',
                };
            case true:
                return {
                    background: 'rgba(244, 252, 238, 1)',
                    color: 'rgba(43, 91, 0, 1)',
                };
            case "TRIAL_ACTIVE":
                return {
                    background: 'rgba(235, 243, 254, 1)',
                    color: 'rgba(20, 110, 246, 1) !important',
                };
            case 'FILL_COMPANY_DETAILS':
                return {
                    background: 'rgba(254, 243, 205, 1)',
                    color: 'rgba(101, 79, 0, 1) !important',
                };
            case 'SUBSCRIPTION_ACTIVE':
                return {
                    background: 'rgba(234, 248, 221, 1)',
                    color: 'rgba(43, 91, 0, 1) !important',
                };
            case 'NEED_CONFIRM_EMAIL':
                return {
                    background: 'rgba(241, 241, 249, 1)',
                    color: 'rgba(56, 152, 252, 1) !important',
                };
            case "NEED_CHOOSE_PLAN":
                return {
                    background: 'rgba(254, 238, 236, 1)',
                    color: 'rgba(244, 87, 69, 1) !important',
                };
            case "NEED_BOOK_CALL":
                return {
                    background: 'rgba(254, 238, 236, 1)',
                    color: 'rgba(244, 87, 69, 1) !important',
                };
            default:
                return {
                    background: 'transparent',
                    color: 'inherit',
                };
        }
    };

    const formatFunnelText = (text: string) => {
        if (text === 'NEED_CHOOSE_PLAN') {
            return "Need choose Plan"
        }
        if (text === 'FILL_COMPANY_DETAILS') {
            return "Fill company details"
        }
        if (text === 'TRIAL_ACTIVE') {
            return "Trial Active"
        }
        if (text === 'SUBSCRIPTION_ACTIVE') {
            return "Subscription Active"
        }
        if (text === 'NEED_CONFIRM_EMAIL') {
            return "Need confirm email"
        }
        if (text === 'NEED_BOOK_CALL') {
            return "Need book call"
        }
        if (text === 'PAYMENT_NEEDED') {
            return "Payment needed"
        }
    };

    const renderCellContent = (key: string, row: UserData) => {
        const isCurrentUser = meData.email === row.email;
        switch (key) {
            case 'name':
                return (
                    <Box
                        className="table-data sticky-cell"
                        sx={{
                            ...suppressionsStyles.tableBodyColumn,
                            paddingLeft: "16px",
                            minWidth: "155px",
                            maxWidth: "155px",
                            position: "sticky",
                            justifyContent: "space-between",
                            left: 0,
                            zIndex: 1,
                            cursor: isCurrentUser ? "default" : "pointer",
                            backgroundColor: "#fff",
                            "&:hover .icon-button": {
                                display: isCurrentUser ? "none" : "flex",
                            },
                        }}
                        onClick={() => {
                            if (!isCurrentUser) {
                                handleLogin(row.id);
                            }
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                overflowWrap: "break-word",
                                justifyContent: "space-between",
                                color: "rgba(56, 152, 252, 1)",
                                gap: 0,
                                width: "100%",
                            }}
                        >
                            <Box sx={{ color: isCurrentUser ? "#000" : "rgba(56, 152, 252, 1)" }}>
                                {row.full_name}
                            </Box>

                            {!isCurrentUser && (
                                <IconButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLogin(row.id);
                                    }}
                                    className="icon-button"
                                    sx={{
                                        display: "none",
                                        alignItems: "center",
                                        color: "rgba(56, 152, 252, 1)",
                                    }}
                                >
                                    <Image
                                        src="/outband.svg"
                                        alt="outband"
                                        width={15.98}
                                        height={16}
                                    />
                                </IconButton>
                            )}
                        </Box>
                    </Box>

                );
            case 'email':
                return row.email || '--';
            case 'last_signed_in':
                return formatDate(row.last_login);
            case 'invited_by':
                return row.invited_by_email || '--';
            case 'access_level':
                return row.role || '--';
            case 'pixel_installed_count':
                return row.pixel_installed_count || '0';
            case 'join_date':
                return formatDate(row.created_at);
            case 'status':
                return (
                    <Typography
                        className="paragraph"
                        sx={{
                            display: 'flex',
                            padding: '2px 8px',
                            borderRadius: '2px',
                            fontFamily: 'Roboto',
                            fontSize: '12px',
                            fontWeight: '400',
                            lineHeight: 'normal',
                            backgroundColor: getStatusStyle(row.payment_status).background,
                            color: getStatusStyle(row.payment_status).color,
                            justifyContent: 'center',
                            minWidth: '130px',
                            textTransform: 'capitalize'
                        }}
                    >
                        {formatFunnelText(row.payment_status ?? '') || "--"}
                    </Typography>
                );
            case 'actions':
                if (row.role.includes('admin')) {
                    return (
                        <>
                            <IconButton
                                onClick={(event) => handleOpenMenu(event, row.id)}
                                sx={{ ':hover': { backgroundColor: 'transparent' } }}
                            >
                                <MoreHoriz />
                            </IconButton>
                            <Popover
                                open={Boolean(menuAnchor) && activeRow === row.id}
                                anchorEl={menuAnchor}
                                onClose={handleCloseMenu}
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "center",
                                }}
                            >
                                <Box
                                    sx={{
                                        p: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-start",
                                        width: "100%",
                                        maxWidth: "160px",
                                    }}
                                >
                                    <Button
                                        sx={{
                                            justifyContent: "flex-start",
                                            width: "100%",
                                            textTransform: "none",
                                            fontFamily: "Nunito Sans",
                                            fontSize: "14px",
                                            color: "rgba(32, 33, 36, 1)",
                                            fontWeight: 600,
                                            ":hover": {
                                                color: "rgba(56, 152, 252, 1)",
                                                backgroundColor: "rgba(80, 82, 178, 0.1)",
                                            },
                                        }}
                                        onClick={() => {
                                            handleOpenSlider(row.id);
                                        }}
                                    >
                                        Admin Payment History
                                    </Button>
                                </Box>
                            </Popover>
                        </>
                    );
                } else if (row.role.includes('customer')) {
                    return (
                        <>
                            <IconButton
                                onClick={(event) => handleOpenMenu(event, row.id)}
                                sx={{ ':hover': { backgroundColor: 'transparent' } }}
                            >
                                <MoreHoriz />
                            </IconButton>
                            <Popover
                                open={Boolean(menuAnchor) && activeRow === row.id}
                                anchorEl={menuAnchor}
                                onClose={handleCloseMenu}
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "center",
                                }}
                            >
                                <Box
                                    sx={{
                                        p: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-start",
                                        width: "100%",
                                        maxWidth: "160px",
                                    }}
                                >
                                    <Button
                                        sx={{
                                            justifyContent: "flex-start",
                                            width: "100%",
                                            textTransform: "none",
                                            fontFamily: "Nunito Sans",
                                            fontSize: "14px",
                                            color: "rgba(32, 33, 36, 1)",
                                            fontWeight: 600,
                                            ":hover": {
                                                color: "rgba(56, 152, 252, 1)",
                                                backgroundColor: "rgba(80, 82, 178, 0.1)",
                                            },
                                        }}
                                        onClick={() => {
                                            console.log("Customer: View Orders clicked");
                                        }}
                                    >
                                        View Orders
                                    </Button>
                                </Box>
                            </Popover>
                        </>
                    );
                } else {
                    return null; // или какой-то дефолтный UI
                }

        }
    };

    return (
        <TableBody>
            {data.map((row) => (
                <TableRow key={row.id}>
                    {tableHeaders.map(({ key }) => (
                        <TableCell key={key} sx={{ ...leadsStyles.table_array, textAlign: key === 'actions' ? 'center' : 'left', position: 'relative', padding: '8px' }} >
                            {renderCellContent(key, row)}
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </TableBody>
    );
};

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
                color: 'rgba(56, 152, 252, 1)',
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
    fromMain?: boolean;
    is_admin?: boolean;
    masterData?: any;
    accountName?: string;
    loading?: boolean;
    onBack?: () => void;
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


const Account: React.FC<PartnersAccountsProps> = ({ appliedDates: appliedDatesFromMain, onBack, is_admin, fromMain, loading, setLoading, tabIndex, handleTabChange }) => {
    const tableHeaders = is_admin
        ? [
            { key: 'name', label: 'Name', sortable: false },
            { key: 'email', label: 'Email ID', sortable: false },
            { key: 'join_date', label: 'Join date', sortable: true },
            { key: 'last_signed_in', label: 'Last signed-in', sortable: false },
            { key: 'invited_by', label: 'Invited by', sortable: false },
            { key: 'access_level', label: 'Access level', sortable: true },
            { key: 'actions', label: 'Actions', sortable: false },
        ]
        : [
            { key: 'name', label: 'Name', sortable: false },
            { key: 'email', label: 'Email', sortable: false },
            { key: 'join_date', label: 'Join date', sortable: true },
            { key: 'last_signed_in', label: 'Last signed-in', sortable: false },
            { key: 'pixel_installed_count', label: 'Pixel installed count', sortable: false },
            { key: 'status', label: 'Status', sortable: false },
            { key: 'actions', label: 'Actions', sortable: false },
        ];
    const [accounts, setAccounts] = useState<AccountData[]>([]);
    const router = useRouter();
    const [page, setPage] = useState(0);
    const { setBackButton, triggerBackButton } = useUser();
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(null);
    const isCalendarOpen = Boolean(calendarAnchorEl);
    const [currentPage, setCurrentPage] = useState(1);
    const [isSliderOpen, setSliderOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [totalPages, setTotalPage] = useState(1);
    const [formattedDates, setFormattedDates] = useState<string>('');
    const [appliedDates, setAppliedDates] = useState<{ start: Date | null; end: Date | null }>(appliedDatesFromMain ?? { start: null, end: null });
    const [selectedDateLabel, setSelectedDateLabel] = useState<string>('');
    const allowedRowsPerPage = [10, 25, 50, 100];
    const [userData, setUserData] = useState<UserData[]>([]);
    const [search, setSearch] = useState("");
    const [errorResponse, setErrosResponse] = useState(false);

    useEffect(() => {
        const accessToken = localStorage.getItem('token');
        if (!accessToken) {
            router.push('/signin');
            return;
        }

        const fetchData = async () => {
            try {
                let url = '/admin'
                if (tabIndex === 0) {
                    url += `/admins?page=${currentPage}&per_page=${rowsPerPage}`;
                } else if (tabIndex === 1) {
                    url += `/users?page=${currentPage}&per_page=${rowsPerPage}`;
                }

                const response = await axiosInstance.get(url);
                if (response.status === 200) {
                    setUserData(response.data.users);
                    setTotalCount(response.data.count)
                }
            }
            catch {
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentPage]);

    const handleSearchChange = (event: any) => {
        setSearch(event.target.value);
    };

    const handleOpenSlider = (id: number) => {
        setSelectedUserId(id);
        setSliderOpen(true);
    };

    const handleCloseSlider = () => {
        setSliderOpen(false);
        setSelectedUserId(null);
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

    const fetchInviteAdmin = useCallback(async () => {
        setLoading(true);
        try {
            // const response = await axiosInstance.get("/admin-accounts", {
            //     params: {
            //         search,
            //         start_date: appliedDates.start ? appliedDates.start.toLocaleDateString('en-CA') : null,
            //         end_date: appliedDates.end ? appliedDates.end.toLocaleDateString('en-CA') : null,
            //         page,
            //         rows_per_page: rowsPerPage,
            //         order_by: orderBy,
            //         order,
            //     }
            // })
            // if (response.status === 200 && response.data.totalCount > 0) {
            //     setErrosResponse(false)
            //     setPartners([...response.data.items])
            //     setTotalCount(response.data.totalCount)
            // }
            // else {
            //     setPartners([])
            //     setErrosResponse(true)
            //     setTotalCount(0)
            // }

        } catch {
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, appliedDates, orderBy, order]);

    useEffect(() => {
        if (
            appliedDatesFromMain?.start instanceof Date || appliedDatesFromMain?.start === null &&
            appliedDatesFromMain?.end instanceof Date || appliedDatesFromMain?.end === null
        ) {
            setAppliedDates(appliedDatesFromMain);
        }

    }, [appliedDatesFromMain]);



    const tabs = [
        { label: "Admins", visible: true },
        { label: "Customers", visible: true }
    ];


    return (
        <>
        {(isSliderOpen && selectedUserId) && <InviteAdmin isOpen={isSliderOpen}
                            onClose={handleCloseSlider}
                            onSumbit={fetchInviteAdmin}
                            user_id={selectedUserId} />}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: "24px", }}>

                    <Tabs onChange={handleTabChange} value={tabIndex} sx={{
                        textTransform: 'none',
                        minHeight: 0,
                        '& .MuiTabs-indicator': {
                            backgroundColor: 'rgba(56, 152, 252, 1)',
                            height: '1.4px',
                        },
                        "@media (max-width: 600px)": {
                            border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '4px', width: '100%', '& .MuiTabs-indicator': {
                                height: '0',
                            },
                        }
                    }}
                        aria-label="partners role tabs">
                        {tabs.filter(t => t.visible).map((tab, index) => (
                            <Tab key={index} label={tab.label} sx={{
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
                                    color: 'rgba(56, 152, 252, 1)'
                                },
                                "@media (max-width: 600px)": {
                                    mr: 0, borderRadius: '4px', '&.Mui-selected': {
                                        backgroundColor: 'rgba(249, 249, 253, 1)',
                                        border: '1px solid rgba(220, 220, 239, 1)'
                                    },
                                }
                            }} />
                        ))}
                    </Tabs>

                    <Box sx={{ display: 'flex', gap: "16px" }}>
                        <TextField
                            id="input-with-icon-textfield"
                            placeholder="Search by account name, emails"
                            value={search}
                            onChange={(e) => {
                                const value = e.target.value;
                                handleSearchChange(e);
                                if (value === "") {
                                    //   fetchRules();
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    // fetchRules();
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon style={{ cursor: "pointer" }} />
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
                <Grid container direction="column" justifyContent="flex-start" spacing={2} sx={{ minHeight: '100vh' }}>
                    <Grid item xs={12} sx={{ pl: 1, pr: 3, mt: 0 }}>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHeader onSort={handleSortRequest} tableHeaders={tableHeaders} sortField={orderBy} sortOrder={order} />
                                <TableBodyClient data={userData} tableHeaders={tableHeaders} setLoading={setLoading} />
                            </Table>
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
                        </TableContainer>
                    </Grid>
                </Grid>

            </Box >
        </>

    );
};

export default Account;