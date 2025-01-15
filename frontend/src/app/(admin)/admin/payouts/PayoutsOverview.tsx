import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, TextField, Button, FormControl, InputLabel, MenuItem, Select, IconButton, InputAdornment, Accordion, AccordionSummary, AccordionDetails, SelectChangeEvent, TableContainer, Table, TableBody, TableRow, TableCell, TableHead } from "@mui/material";
import { useEffect, useState } from "react";
import ProgressBar from "../../../../components/ProgressBar";
import Image from "next/image";
import { payoutsStyle } from "./payoutsStyle";
import { showToast } from "../../../../components/ToastNotification";
import CustomTooltip from "@/components/customToolTip";
import CalendarPopup from "@/components/CustomCalendar";
import DateRangeIcon from '@mui/icons-material/DateRange';
import dayjs from "dayjs";
import CustomTablePagination from "@/components/CustomTablePagination";

interface FAQItem {
    question: string;
    answer: string;
}

interface ReferralDiscountCode {
    id: number
    name: string
    discount_amount: number
}


const faqItems: FAQItem[] = [
    { question: 'How the referral works?', answer: 'Once a user integrates their Stripe account, they can select a predefined discount code for referrals. A referral code is then generated, which the user can share with their contacts. When a contact signs up using this referral code, the user receives a reward.' },
    { question: 'When will the reward credits be available in my Stripe account?', answer: 'Referral rewards are distributed in the first week of the following month.' },
    { question: 'Who is the official partner?', answer: 'An official partner who refers new users to Maximiz receives higher rewards compared to a regular referral user.' },
];


const ReferralOverview: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState<number | false>(false);
    // Calendar
    const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(null);
    const isCalendarOpen = Boolean(calendarAnchorEl);
    const [formattedDates, setFormattedDates] = useState<string>('');
    const [selectedDateLabel, setSelectedDateLabel] = useState<string>('');
    const [appliedDates, setAppliedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

    const [accountCreatePending, setAccountCreatePending] = useState(false);
    const [error, setError] = useState(false);
    const [stripeConnect, setStripeConnect] = useState(false);
    const [stripeEmail, setStripeEmail] = useState('');
    const [connectedAccountId, setConnectedAccountId] = useState();
    const [buttonText, setButtonText] = useState('View Dashboard');


    const [payotsList, setSuppressionList] = useState<any[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [totalCount, setTotalCount] = useState(0);



    const handleOpenSection = (panel: number) => (
        event: React.SyntheticEvent,
        isExpanded: boolean
    ) => {
        setExpanded(isExpanded ? panel : false);
    };

    const fetchRules = async () => {
        setLoading(true);
        try {
            const responseOverview = await axiosInstance.get('referral/overview')
            setConnectedAccountId(responseOverview.data.connected_stripe_account_id)
            setStripeConnect(responseOverview.data.is_stripe_connected)
            setStripeEmail(responseOverview.data.stripe_connected_email)
        } catch (err) {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

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

    // interface PayoutsListResponse {
    //     history_list: any[];
    //     total_count: number;
    //     max_page: number;
    // }

    // const fetchHistoryList = async (page: number, perPage: number) => {
    //     try {
    //         setLoading(true)
    //         const response = await axiosInstance.get<PayoutsListResponse>('/suppressions/suppression-list', {
    //             params: {
    //                 page: page + 1,
    //                 per_page: perPage,
    //             },
    //         });
    //         setSuppressionList(response.data.history_list);
    //         setTotalCount(response.data.total_count);
    //     } catch (error) {
    //     }
    //     finally {
    //         setLoading(false)
    //     }
    // };

    // useEffect(() => {
    //     try {
    //         setLoading(true)
    //         fetchHistoryList(page, rowsPerPage);
    //     }
    //     finally {
    //         setLoading(false)
    //     }

    // }, [page, rowsPerPage]);


    return (
        <>
            {loading &&
                <ProgressBar />
            }
            <Box sx={{
                backgroundColor: '#fff',
                width: '100%',
                padding: 0,
                margin: '3rem auto 0rem',
                pr: '1rem',
                '@media (max-width: 600px)': { margin: '0rem auto 0rem', pr: '0rem', }
            }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', gap: 1, '@media (max-width: 600px)': { flexDirection: 'column' } }}>

                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', border: '1px solid rgba(235, 235, 235, 1)', justifyContent: 'start', alignItems: 'start', borderRadius: '4px', pt: 0, pb: 2, gap: 2.5, }}>
                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'start', width: '100%', gap: 1, padding: 1, pb:0 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', width: '100%', gap: 1, padding: 1 }}>
                                    <Image src={'/stripe-image.svg'} width={60} height={60} alt="stripe-icon" />
                                    <Typography className="second-sub-title">
                                        Stripe account details
                                    </Typography>
                                </Box>
                                <Button
                                    variant="outlined"
                                    sx={{

                                        mt: 2,
                                        mr: 2,
                                        textWrap: 'nowrap',
                                        backgroundColor: '#fff',
                                        color: 'rgba(80, 82, 178, 1)',
                                        fontFamily: "Nunito Sans",
                                        textTransform: 'none',
                                        lineHeight: '22.4px',
                                        fontWeight: '600',
                                        padding: '0.75em 2em',
                                        border: '1px solid rgba(80, 82, 178, 1)',
                                        '&:hover': {
                                            backgroundColor: '#fff',
                                            boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)',
                                            '&.Mui-disabled': {
                                                backgroundColor: 'rgba(80, 82, 178, 0.6)',
                                                color: 'rgba(80, 82, 178, 1)',
                                                cursor: 'not-allowed',
                                            }
                                        }
                                    }}
                                    onClick={async () => {
                                        setError(false);
                                        setLoading(true);
                                        try {
                                            const linkResponse = await fetch("/api/account_link", {
                                                method: "POST",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                },
                                                body: JSON.stringify({ account: connectedAccountId })
                                            });
                                            const linkData = await linkResponse.json();

                                            const { url, error: linkError } = linkData;

                                            if (url) {
                                                window.open(url, '_blank');
                                            }

                                            if (linkError) {
                                                setError(true);
                                            }
                                        } catch (err) {
                                            setError(true);
                                            console.error("Error occurred:", err);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }} >
                                    View Dashboard
                                </Button>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', width: '100%', gap: 1, pl: 2, pt:0 }}>
                                <Typography className="table-heading">
                                    Email
                                </Typography>
                                <Typography className="table-data">
                                    {stripeEmail}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', width: '100%', gap: 1, pl: 2 }}>
                                <Typography className="table-heading">
                                    Account ID
                                </Typography>
                                <Typography className="table-data">
                                    {connectedAccountId}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', width: '100%', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                                <Typography className="first-sub-title">Payout History</Typography>
                                <Box sx={{ "@media (max-width: 600px)": { display: 'none' } }}><CustomTooltip title={"Our Referral program rewards you for bringing new users to our platform. Share your unique referral link with friends and colleagues, and earn incentives for each successful sign-up."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/referral" /></Box>
                            </Box>
                            <Box>
                                <Button
                                    aria-controls={isCalendarOpen ? 'calendar-popup' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={isCalendarOpen ? 'true' : undefined}
                                    onClick={handleCalendarClick}
                                    sx={{
                                        textTransform: 'none',
                                        color: 'rgba(128, 128, 128, 1)',
                                        border: formattedDates ? '1px solid rgba(80, 82, 178, 1)' : '1px solid rgba(184, 184, 184, 1)',
                                        borderRadius: '4px',
                                        padding: '8px',
                                        minWidth: 'auto',
                                        '@media (max-width: 900px)': {
                                            border: 'none',
                                            padding: 0
                                        },
                                        '&:hover': {
                                            backgroundColor: 'transparent',
                                            border: '1px solid rgba(80, 82, 178, 1)',
                                            color: 'rgba(80, 82, 178, 1)',
                                            '& .MuiSvgIcon-root': {
                                                color: 'rgba(80, 82, 178, 1)'
                                            }
                                        }
                                    }}
                                >
                                    <DateRangeIcon fontSize='medium' sx={{ color: formattedDates ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)', }} />
                                    <Typography variant="body1" sx={{
                                        fontFamily: 'Nunito Sans',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        lineHeight: '19.6px',
                                        textAlign: 'left',

                                        "@media (max-width: 600px)": {
                                            display: 'none'
                                        },
                                    }}>
                                    </Typography>
                                </Button>
                            </Box>
                        </Box>
                        <Box>
                            <TableContainer sx={{
                                border: '1px solid #EBEBEB',
                                borderRadius: '4px 4px 0px 0px',
                            }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell className='table-heading'
                                                sx={{
                                                    ...payoutsStyle.tableColumn,
                                                    textAlign: 'center',
                                                    pl: 0,
                                                    zIndex: 9,
                                                    position: 'sticky', backgroundColor: '#fff', left: 0
                                                }}>List name</TableCell>
                                            <TableCell className='table-heading' sx={{ ...payoutsStyle.tableColumn, textAlign: 'center', pl: 0 }}>Month</TableCell>
                                            <TableCell className='table-heading' sx={{ ...payoutsStyle.tableColumn, textAlign: 'center', pl: 0 }}>Total Revenue</TableCell>
                                            <TableCell className='table-heading' sx={{ ...payoutsStyle.tableColumn, textAlign: 'center', pl: 0 }}>Total Rewards </TableCell>
                                            <TableCell className='table-heading' sx={{ ...payoutsStyle.tableColumn, textAlign: 'center', pl: 0 }}>Rewards paid </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {payotsList?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} sx={{
                                                    ...payoutsStyle.tableBodyColumn,
                                                    textAlign: 'center'
                                                }}>
                                                    <Typography className="second-sub-title">
                                                        No payout list history
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            payotsList?.map((payout, index) => (
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
                                                        left: 0,
                                                        zIndex: 1,
                                                        backgroundColor: '#fff',
                                                    }}>
                                                        {payout.month}
                                                    </TableCell>
                                                    <TableCell className='table-data' sx={{ ...payoutsStyle.tableColumn, textAlign: 'center', pl: 0 }}>
                                                        <Typography component="span" className='table-data' sx={{
                                                            background: 'rgba(234, 248, 221, 1)',
                                                            padding: '6px 8px',
                                                            borderRadius: '2px',
                                                            fontFamily: 'Roboto',
                                                            fontSize: '12px',
                                                            fontWeight: '400',
                                                            lineHeight: '16px',
                                                            color: 'rgba(43, 91, 0, 1)',
                                                        }}>
                                                            {payout.total_revenue}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell className='table-data' sx={{ ...payoutsStyle.tableColumn, pl: 7 }}>
                                                        {payout.total_rewards}
                                                    </TableCell>
                                                    <TableCell className='table-data' sx={payoutsStyle.tableBodyColumn}>
                                                        {payout.rewards_paid}
                                                    </TableCell>

                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
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
                <CalendarPopup
                    anchorEl={calendarAnchorEl}
                    open={isCalendarOpen}
                    onClose={handleCalendarClose}
                    onDateChange={handleDateChange}
                    onApply={handleApply}
                    onDateLabelChange={handleDateLabelChange}
                />
            </Box >
        </>

    );
};

export default ReferralOverview;