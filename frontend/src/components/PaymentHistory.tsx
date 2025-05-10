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
import CustomizedProgressBar from "@/components/CustomizedProgressBar";

const getStatusStyle = (status: string) => {
    switch (status) {
        case 'Successfull':
            return {
                background: 'rgba(234, 248, 221, 1)',
                color: 'rgba(43, 91, 0, 1)',
            };
        case 'Decline':
            return {
                background: 'rgba(236, 236, 236, 1)',
                color: 'rgba(74, 74, 74, 1)',
            };
        case 'Failed':
            return {
                background: 'rgba(252, 212, 207, 1)',
                color: 'rgba(166, 17, 0, 1)',
            };
        default:
            return {
                background: 'transparent',
                color: 'inherit',
            };
    }
};

interface PaymentHistoryDate {
    id: number;
    invoice_id: number;
    pricing_plan: string;
    date: Date | string;
    amount: number;
    subscription: string;
    total: number;
    overage: string;
    status: string;
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

const PaymentHistory: React.FC = () => {
    const [isMaster, setIsMaster] = useState(false);
    const [partners, setPartners] = useState<PaymentHistoryDate[]>([{id: 0, date: new Date(), invoice_id: 123244, pricing_plan: "Basic", amount: 23456, status: "Failed", subscription: "Basic", total: 1122323, overage: "Enable - 2k used till now"}]);
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
    const [accountPage, setAccountPage] = useState(false);
    const [id, setId] = useState<number | null>(null);
    const [partnerName, setPartnerName] = useState<string | null>(null);
    const [accountName, setAccountName] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [errorResponse, setErrosResponse] = useState(false);

    const tableHeaders = [
        { key: 'date', label: 'Date' },
        { key: 'invoice_id', label: 'Invoice id' },
        { key: 'pricing_plan', label: 'Pricing plan' },
        { key: 'amount', label: 'Amount'},
        { key: 'status', label: 'Status' },
        { key: 'actions', label: 'Actions' },
    ];


    const makePartner = async (userId: number, isPartner: boolean) => {
        try {
            const response = await axiosInstance.put('/admin/user', {
                user_id: userId,
                is_partner: isPartner,
            });
            showToast('User updated succesfuly')
            fetchRules();
        } catch (error) {
            showErrorToast('Error updating user');
        }
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
    const validatedRowsPerPage = allowedRowsPerPage.includes(rowsPerPage) ? rowsPerPage : 10;   

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


    const fetchRules = useCallback(async () => {

        // setLoading(true);
        // try {
        //     const response = await axiosInstance.get("/admin-accounts", {
        //         params: { 
        //             search,
        //             start_date: appliedDates.start ? appliedDates.start.toLocaleDateString('en-CA') : null,
        //             end_date: appliedDates.end ? appliedDates.end.toLocaleDateString('en-CA') : null,
        //             page, 
        //             rows_per_page: rowsPerPage,
        //             order_by: orderBy,
        //             order,
        //         }})
        //     if (response.status === 200 && response.data.totalCount > 0) {
        //         setErrosResponse(false)
        //         setPartners([...response.data.items])
        //         setTotalCount(response.data.totalCount)   
        //     }
        //     else {
        //         setPartners([])
        //         setErrosResponse(true)
        //         setTotalCount(0)
        //     }

        // } catch {
        // } finally {
        //     setLoading(false);
        // }
        // setPartners[
        //     {id: 0, date: Date.now(), invoice_id: 123244, pricing_plan: "Basic", amount: 23456, status: "Failed", subscription: "Basic", total: 1122323, overage: "Enable - 2k used till now"}
        // ]
    }, [page, rowsPerPage, search, appliedDates, orderBy, order]);

    const handleSearchChange = (event: any) => {
        setSearch(event.target.value);
    };

    useEffect(() => {
        fetchRules();
    }, [page, rowsPerPage, appliedDates, orderBy, order])


    return (
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
            <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: "24px", justifyContent: 'space-between' }}>
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
                                        Payment History
                                    </Typography>
                                    <Box sx={{display: 'flex', gap: "16px"}}>
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

                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <TableContainer sx={{
                                        border: '1px solid #EBEBEB',
                                        borderRadius: '4px 4px 0px 0px',
                                    }}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    {tableHeaders.map(({ key, label }) => (
                                                        <TableCell
                                                            key={key}
                                                            sx={{...suppressionsStyles.tableColumn, paddingLeft: "16px"}}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }} style={key === "status" || key === "actions" ? { justifyContent: "center" } : {}}>
                                                                <Typography variant="body2" className='table-heading'>{label}</Typography>
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
                                                        

                                                            <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                                {dayjs(data.date).isValid() ? dayjs(data.date).format('MMM D, YYYY') : '--'}
                                                            </TableCell>

                                                            <TableCell className='table-data'sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                                {data.invoice_id}
                                                            </TableCell>

                                                            <TableCell className='table-data'sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                                {data.pricing_plan}
                                                            </TableCell>

                                                            <TableCell className='table-data'sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                                {data.amount}
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
                </Box>
            </Box>
        </Box>
    )
};

export default PaymentHistory;