"use client"
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Grid, Typography, TextField, Button, List, ListItemText, ListItemButton, IconButton, Tabs, Tab, 
    InputAdornment, Popover, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { Suspense, useCallback, useEffect, useState } from "react";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { suppressionsStyles } from "@/css/suppressions";
import dayjs from "dayjs";
import CustomTablePagination from "@/components/CustomTablePagination";
import Image from "next/image";
import CalendarPopup from "@/components/CustomCalendar";
import { DateRangeIcon } from "@mui/x-date-pickers/icons";
import SwapVertIcon from '@mui/icons-material/SwapVert';
import SearchIcon from '@mui/icons-material/Search';
import InvitePartnerPopup from "@/components/InvitePartnerPopup"
import EnablePartnerPopup from "@/components/EnablePartnerPopup"
import { showErrorToast, showToast } from '@/components/ToastNotification';
import PartnersAccounts from "@/components/PartnersAccounts";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CustomizedProgressBar from "@/components/ProgressBar";
import PaymentHistory from "@/components/PaymentHistory";
import Slider from "./MakePartner"
import MakePartner from "./MakePartner";

const getStatusStyle = (status: string) => {
    switch (status) {
        case 'Active':
            return {
                background: 'rgba(234, 248, 221, 1)',
                color: 'rgba(43, 91, 0, 1)',
            };
        case 'Paid':
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
        case 'Invitation sent':
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

interface PartnerData {
    id: number;
    full_name: string;
    email: string;
    created_at: Date | string;
    status: string;
    reward_status: string;
    plan_amount: string;
    sources: string;
    will_pay: boolean;
    paid_at: boolean;
    last_payment_date: Date | string;
    reward_payout_date: Date | string;
}

interface NewPartner {
    id: number, 
    email: string,
    fullName: string, 
    companyName: string,
    commission: string
}

interface EnabledPartner {
    id: number, 
    fullName?: string
}

const Accounts: React.FC = () => {
    const [isMaster, setIsMaster] = useState(false);
    const [partners, setPartners] = useState<PartnerData[]>([]);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(null);
    const isCalendarOpen = Boolean(calendarAnchorEl);
    const [formattedDates, setFormattedDates] = useState<string>('');
    const [appliedDates, setAppliedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [selectedDateLabel, setSelectedDateLabel] = useState<string>('');
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [formPopupOpen, setFormPopupOpen] = useState(false);
    const [noticePopupOpen, setNoticePopupOpen] = useState(false);
    const [fileData, setFileData] = useState<NewPartner>({id: 0, email: "", fullName: "", companyName: "", commission: ""});
    const [enabledData, setEnabledData] = useState<EnabledPartner>({id: 0});
    const [selectedRowData, setSelectedRowData] = useState<any>(null);
    const [paymentHistory, setPaymentHistoryPage] = useState(false);
    const [id, setId] = useState<number | null>(null);
    const [partnerName, setPartnerName] = useState<string | null>(null);
    const [accountName, setAccountName] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [errorResponse, setErrosResponse] = useState(false);
    const [isSliderOpen, setSliderOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    const tableHeaders = [
        { key: 'partner_name', label: 'Account name', sortable: false },
        { key: 'email', label: 'Email', sortable: false },
        { key: 'join_date', label: 'Join date', sortable: true },
        { key: 'plan_amount', label: 'Plan amount', sortable: false },
        { key: 'last_payment_date', label: 'Last payment date', sortable: true },
        { key: 'reward_status', label: 'Reward status', sortable: false },
        { key: 'reward_payout_date', label: 'Reward Payout date', sortable: true },
        { key: 'sources', label: 'Sources', sortable: false },
        { key: 'status', label: 'Status', sortable: false },
        { key: 'actions', label: 'Actions', sortable: false },
    ];

    const handleOpenSlider = (id: number) => {
        setSelectedUserId(id);
        setSliderOpen(true);
    };

    const handleCloseSlider = () => {
        setSliderOpen(false);
        setSelectedUserId(null);
    };

    const handleSubmit = () => {
        fetchRules();
    };

    const handleOpenMenu = (event: any, rowData: any) => {
        setMenuAnchor(event.currentTarget);
        setSelectedRowData(rowData);
    };

    const handleCloseMenu = () => {
        setMenuAnchor(null);
        setSelectedRowData(null);
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

    const allowedRowsPerPage = [10, 25, 50, 100];   

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
            setAppliedDates({ ...dates }); 
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
        setPage(0);
    };

    const handleSortRequest = (key: string) => {
        const isAsc = orderBy === key && order === 'asc';
        const newOrder = isAsc ? 'desc' : 'asc';
        setOrder(newOrder);
        setOrderBy(key);
    
        const sortedAccounts = [...partners].sort((a, b) => {
            const aValue = a[key as keyof typeof a];
            const bValue = b[key as keyof typeof b];
    
            const isANullOrDash = aValue === null || aValue === '--';
            const isBNullOrDash = bValue === null || bValue === '--';
    
            if (isANullOrDash && !isBNullOrDash) return newOrder === 'asc' ? 1 : -1;
            if (isBNullOrDash && !isANullOrDash) return newOrder === 'asc' ? -1 : 1;
    
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return newOrder === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
    
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return newOrder === 'asc' ? aValue - bValue : bValue - aValue;
            }
    
            return 0;
        });
    
        setPartners(sortedAccounts);
    };

    const handleNoticeOpenPopup = () => {
        setNoticePopupOpen(true)
    }

    const handleNoticeClosePopup = () => {
        setNoticePopupOpen(false)
    }

    const handleFormOpenPopup = () => {
        setFormPopupOpen(true)
    }

    const handleFormClosePopup = () => {
        setFormPopupOpen(false)
    }

    const setEnabled = async () => {
        setLoading(true);
    
        try {
            const response = await axiosInstance.put(`admin-partners/${selectedRowData.id}/`, {status: "active"}, {
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.status === 200) {
                updateOrAddAsset(response.data);
                showToast("Partner status successfully updated!");
            }
        } catch {
            showErrorToast("Failed to update status. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchRules = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get("/admin-accounts", {
                params: { 
                    search,
                    start_date: appliedDates.start ? appliedDates.start.toLocaleDateString('en-CA') : null,
                    end_date: appliedDates.end ? appliedDates.end.toLocaleDateString('en-CA') : null,
                    page, 
                    rows_per_page: rowsPerPage,
                    order_by: orderBy,
                    order,
                }})
            if (response.status === 200 && response.data.totalCount > 0) {
                setErrosResponse(false)
                setPartners([...response.data.items])
                setTotalCount(response.data.totalCount)   
            }
            else {
                setPartners([])
                setErrosResponse(true)
                setTotalCount(0)
            }

        } catch {
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, appliedDates, orderBy, order]);

    const updateOrAddAsset = (updatedPartner: PartnerData) => {
        setPartners((prevAccounts) => {
            const index = prevAccounts.findIndex((account) => account.id === updatedPartner.id);
            if (index !== -1) {
                const newAccounts = [...prevAccounts];
                newAccounts[index] = updatedPartner;
                return newAccounts;
            }
            return [...prevAccounts, updatedPartner];
        });
    };

    const removePartnerById = (id: number) => {
        setPartners((prevAccounts) =>
            prevAccounts.filter((item) => item.id !== id)
        );
    };

    const handleSearchChange = (event: any) => {
        setSearch(event.target.value);
    };

    useEffect(() => {
        fetchRules();
    }, [page, rowsPerPage, appliedDates, orderBy, order])


    if (loading) {
        return <CustomizedProgressBar />;
    }


    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateAreas: `
                "header header"
                "sidebar content"
            `,
                gridTemplateRows: 'auto 1fr',
                gridTemplateColumns: '0px 1fr',
                height: '92vh',
            }}
        >
            <Box
                sx={{
                    gridArea: 'content',
                }}
            >
                <Grid container>
                    <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', mt: 3, justifyContent: 'space-between' }}>
                                {partnerName
                                &&
                                <>
                                    <Box sx={{display: "flex", alignItems: "center", gap: "5px" }}>
                                        <Typography onClick={() => {
                                            setPartnerName(null)
                                            setPaymentHistoryPage(false)
                                        }}
                                        sx={{fontWeight: 'bold', fontSize: '12px', fontFamily: 'Nunito Sans', color: "#808080", cursor: "pointer", zIndex: 1000}}>
                                            Account {partnerName ? `- ${partnerName}` : ""}
                                        </Typography>
                                        <NavigateNextIcon width={16}/>
                                        <Typography sx={{fontWeight: 'bold', fontSize: '12px', fontFamily: 'Nunito Sans', color: "#808080"}}>
                                            Payment History
                                        </Typography>
                                    </Box>
                                </>}
                                {paymentHistory && <PaymentHistory/>}
                                {!paymentHistory && 
                                <>
                                    <Box sx={{
                                        backgroundColor: '#fff',
                                        width: '100%',
                                        padding: 0,
                                        margin: '0 auto',
                                        display: 'flex',
                                        mt: 3,
                                        pr: 3,
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        minHeight: '77vh',
                                        '@media (max-width: 600px)': {margin: '0rem auto 0rem'}
                                    }}>
                                        <Box>
                                            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mb: 2, alignItems: 'center', gap: 2 }}>
                                                <Typography variant="h4" component="h1" sx={{
                                                    lineHeight: "22.4px",
                                                    color: "rgba(32, 33, 36, 1)",
                                                    fontWeight: 'bold',
                                                    fontSize: '16px',
                                                    fontFamily: 'Nunito Sans'}}>
                                                    Accounts
                                                </Typography>
                                                <Box sx={{display: 'flex', gap: "16px"}}>
                                                    <TextField
                                                        id="input-with-icon-textfield"
                                                        placeholder="Search by account name, emails"
                                                        value={search}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            handleSearchChange(e);
                                                            if (value === "") {
                                                              fetchRules();
                                                            }
                                                          }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                fetchRules();
                                                            }
                                                        }}
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                        <SearchIcon onClick={fetchRules} style={{ cursor: "pointer" }}/>
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
                                                                        sx={{...suppressionsStyles.tableColumn, paddingLeft: "16px", cursor: sortable ? 'pointer' : 'default'}}
                                                                        onClick={sortable ? () => handleSortRequest(key) : undefined}
                                                                    >
                                                                        <Box sx={{ display: 'flex', alignItems: 'center' }} style={key === "status" || key === "actions" ? { justifyContent: "center" } : {}}>
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
                                                                {partners.map((data) => (
                                                                    <TableRow key={data.id} sx={{
                                                                        ...suppressionsStyles.tableBodyRow,
                                                                        '&:hover': {
                                                                            backgroundColor: '#F7F7F7',
                                                                            '& .sticky-cell': {
                                                                                backgroundColor: '#F7F7F7',
                                                                            }
                                                                        },
                                                                    }}>
                                                                        <TableCell className='sticky-cell table-data' 
                                                                            sx={{
                                                                                ...suppressionsStyles.tableBodyColumn, 
                                                                                paddingLeft: "16px",
                                                                                position: 'sticky',
                                                                                left: 0,
                                                                                zIndex: 1}}>
                                                                            <Box sx={{display: "flex", alignItems: "center", justifyContent: "space-between", color: 'rgba(80, 82, 178, 1)'}}>
                                                                                {data.full_name}
                                                                            </Box>
                                                                        </TableCell>

                                                                        <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                                            {data.email}
                                                                        </TableCell>

                                                                        <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                                            {dayjs(data.created_at).isValid() ? dayjs(data.created_at).format('MMM D, YYYY') : '--'}
                                                                        </TableCell>

                                                                        <TableCell className='table-data'sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                                            {data.plan_amount}
                                                                        </TableCell>

                                                                        <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                                            {dayjs(data.last_payment_date).isValid() ? dayjs(data.last_payment_date).format('MMM D, YYYY') : '--'}
                                                                        </TableCell>

                                                                        <TableCell sx={{ ...suppressionsStyles.tableBodyColumn, paddingLeft: "16px", textAlign: 'center' }}>
                                                                            <Box sx={{display: "flex", justifyContent: "center"}}>
                                                                                <Typography component="div" sx={{
                                                                                    width: "100px",
                                                                                    margin: 0,
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

                                                                        <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                                            {data.will_pay ?
                                                                            <>
                                                                                {data.paid_at && <Typography component="div" sx={{
                                                                                        width: "100px",
                                                                                        fontFamily: 'Roboto',
                                                                                        fontSize: '10px',
                                                                                        fontWeight: '400',
                                                                                        lineHeight: '14px'
                                                                                    }}>
                                                                                        Would be paid on
                                                                                </Typography>}
                                                                                {dayjs(data.reward_payout_date).isValid() ? dayjs(data.reward_payout_date).format('MMM D, YYYY') : '--'}
                                                                            </>
                                                                            : 
                                                                            <>
                                                                                --
                                                                            </>
                                                                            }
                                                                        </TableCell>

                                                                        <TableCell className='table-data'sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                                            {data.sources}
                                                                        </TableCell>

                                                                        <TableCell sx={{ ...suppressionsStyles.tableBodyColumn, paddingLeft: "16px", textAlign: 'center' }}>
                                                                            <Box sx={{display: "flex", justifyContent: "center"}}>
                                                                                <Typography component="div" sx={{
                                                                                    width: "100px",
                                                                                    margin: 0,
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

                                                                        <TableCell sx={{ ...suppressionsStyles.tableBodyColumn, paddingLeft: "16px", textAlign: 'center' }}>
                                                                            <IconButton onClick={(event) => handleOpenMenu(event, data)} sx={{ ':hover': { backgroundColor: 'transparent', }}} >
                                                                                <Image src='/more_horizontal.svg' alt='more' height={16.18} width={22.91} />
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
                                                                                        <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {
                                                                                            handleCloseMenu()
                                                                                            setPaymentHistoryPage(true)
                                                                                            setPartnerName(data.full_name)
                                                                                        }}>
                                                                                            <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Payment history"/>
                                                                                        </ListItemButton>
                                                                                        <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => { handleCloseMenu(), handleOpenSlider(selectedRowData.id) }}>
                                                                                            <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Make partner"/>
                                                                                        </ListItemButton>
                                                                                        <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {}}>
                                                                                            <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Reward history"/>
                                                                                        </ListItemButton>
                                                                                        {selectedRowData?.status === "Active" 
                                                                                        ?   <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {
                                                                                                handleNoticeOpenPopup()
                                                                                                setEnabledData({ 
                                                                                                    id: selectedRowData.id});
                                                                                                handleCloseMenu()
                                                                                            }}>
                                                                                                <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Disable"/>
                                                                                            </ListItemButton>
                                                                                        :   <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {
                                                                                                setEnabled()
                                                                                                setEnabledData({ 
                                                                                                    id: selectedRowData.id});
                                                                                                handleCloseMenu()
                                                                                            }}>
                                                                                                <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Enable"/>
                                                                                            </ListItemButton>
                                                                                        }
                                                                                        <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {
                                                                                            handleNoticeOpenPopup()
                                                                                            setEnabledData({
                                                                                                id: selectedRowData.id,
                                                                                                fullName: selectedRowData.partner_name});
                                                                                            handleCloseMenu()
                                                                                        }}>
                                                                                            <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Terminate"/>
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
                                </>}
                            </Box>
                        </Box>
                        {(isSliderOpen && selectedUserId) && <MakePartner isOpen={isSliderOpen}
                        onClose={handleCloseSlider}
                        onSumbit={handleSubmit}
                        user_id={selectedUserId} />}
                    </Grid>
                </Grid>
            </Box>
        </Box>
    )
};

export default Accounts;