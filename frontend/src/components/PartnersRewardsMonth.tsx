import { suppressionsStyles } from "@/css/suppressions";
import { Button, IconButton, InputAdornment, Table, Tabs, Tab, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
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
import CustomTooltip from "@/components/customToolTip";
import SwapVertIcon from '@mui/icons-material/SwapVert';

interface RewardData {
    month: string;
    is_payment_active: boolean;
    company_name: string;
    email: string;
    sources: string;
    number_of_accounts: number;
    partner_id: number;
    reward_amount: string;
    plan_amount: string;
    join_date: Date;
    reward_payout_date: Date;
    reward_status: string;
    is_auto_payout_date?: boolean;
}


interface MonthDetailsProps {
    partner_id: number;
    isMaster: boolean;
    selectedMonth: string;
    flagMounthReward: boolean;
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


const MonthDetails: React.FC<MonthDetailsProps> = ({ partner_id, isMaster, open, flagMounthReward, selectedMonth, onPartnerClick, selectedYear }) => {
    const [page, setPage] = useState(0);
    const [tabIndex, setTabIndex] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [partnerTab, setPartnerTab] = useState(false);
    const [rewardType, setRewardType] = useState("partner");
    const [search, setSearch] = useState("");
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [data, setData] = useState<RewardData[] | []>([]);
    const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
        if (newIndex == 1) {
            setPartnerTab(true)
            setRewardType("master_partner")
        }
        else {
            setPartnerTab(false)
            setRewardType("partner")
        }
        setTabIndex(newIndex);
    };

    const tableHeaders = [
        { key: 'account_name', label: 'Account name', sortable: false },
        { key: 'email', label: 'Email', sortable: false },
        { key: 'join_date', label: 'Join date', sortable: true },
        { key: 'plan_amount', label: partnerTab ? 'Partner reward' : 'Plan amount', sortable: false },
        { key: 'reward_amount', label: 'Payout amount', sortable: false },
        { key: 'reward_status', label: 'Payout status', sortable: false },
        { key: 'reward_payout_date', label: 'Payout date', sortable: true },
    ];



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


    const handleSearchChange = (event: any) => {
        setSearch(event.target.value);
    };


    useEffect(() => {
        if (open) {
            fetchRewardData();
        }
    }, [open, tabIndex]);

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

            const response = await axiosInstance.get("/admin-partners/rewards", {
                params: {
                    year: selectedYear,
                    month: selectedMonthNumber,
                    partner_id,
                    reward_type: rewardType,
                },
            });

            const rewards: RewardData[] = response.data.map((reward: any) => {
                let isAutoPayoutDate = false;
                const rewardPayoutDate = reward.payout_date
                    ? new Date(reward.payout_date)
                    : (() => {
                        isAutoPayoutDate = true;
                        const currentDate = new Date();
                        const nextMonth = currentDate.getMonth() + 1;
                        return new Date(currentDate.getFullYear(), nextMonth, 1);
                    })();

                return {
                    is_payment_active: reward.is_payment_active,
                    partner_id: reward.partner_id,
                    join_date: reward.join_date,
                    company_name: reward.company_name,
                    plan_amount: reward.plan_amount,
                    email: reward.email,
                    sources: reward.sources,
                    number_of_accounts: reward.number_of_accounts,
                    reward_amount: reward.reward_amount,
                    reward_approved: reward.reward_approved,
                    reward_payout_date: rewardPayoutDate,
                    is_auto_payout_date: isAutoPayoutDate,
                    reward_status: reward.status,
                };
            });

            setData(rewards);
            setTotalCount(rewards.length);
        } catch (error) {
        } finally {
            setIsLoading(false)
        }
    };



    return (
        <>
        {flagMounthReward &&
        
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
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    mb: 2 }}>

                    {isMaster && 
                        <Tabs
                            value={tabIndex}
                            onChange={handleTabChange}
                            sx={{
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
                                        color: 'rgba(56, 152, 252, 1)'
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
                                        color: 'rgba(56, 152, 252, 1)'
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
                        </Tabs>
                    }

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
                    </Box>

                    {/* <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
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
                        <Typography sx={{ color: "rgba(0, 0, 0, 1)", fontSize: "16px", lineHeight: "22.4px", fontWeight: 600, fontFamily: "Nunito Sans" }}>{selectedMonth} Payout Details</Typography>
                    </Box> */}


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
                                                    ...suppressionsStyles.tableColumn,
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
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} style={key === "reward_status" ? { justifyContent: "center" } : {}}>
                                                    <Typography variant="body2" className='table-heading'>{label}</Typography>
                                                    {tabIndex === 1 && label === 'Partner reward' && <Box sx={{ "@media (max-width: 600px)": { display: 'none' } }}>
                                                        <CustomTooltip title={"Collaborate with trusted partners to access exclusive resources and services that drive success."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/referral" />
                                                    </Box>}
                                                    {tabIndex === 1 && label === 'Payout amount' && <Box sx={{ "@media (max-width: 600px)": { display: 'none' } }}>
                                                        <CustomTooltip title={"Collaborate with trusted partners to access exclusive resources and services that drive success."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/referral" />
                                                    </Box>}
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
                                    {data && data.length === 0 ? (
                                        <TableRow sx={suppressionsStyles.tableBodyRow}>
                                            <TableCell
                                                colSpan={9}
                                                sx={{
                                                    ...suppressionsStyles.tableBodyColumn,
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

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {item.email}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {dayjs(item.join_date).format('MMM D, YYYY')}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {item.plan_amount}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {item.reward_amount}
                                                </TableCell>

                                                <TableCell sx={{ ...suppressionsStyles.tableColumn, textAlign: 'center' }}>
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
                                                        {item.reward_status === "paid" ? "Credited" : item.reward_status.charAt(0).toUpperCase() + item.reward_status.slice(1)}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell className="table-data" sx={suppressionsStyles.tableBodyColumn}>                                                
                                                    {item.is_auto_payout_date ? 
                                                        <>
                                                        <Typography component="div" sx={{
                                                            width: "100px",
                                                            fontFamily: 'Roboto',
                                                            fontSize: '10px',
                                                            fontWeight: '400',
                                                            lineHeight: '14px'
                                                            }}>
                                                            Would be paid on
                                                        </Typography>
                                                        {dayjs(item.reward_payout_date).format('MMM D, YYYY')}
                                                        </>
                                                    : 
                                                        dayjs(item.reward_payout_date).format('MMM D, YYYY') || '--'
                                                    }
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

        }
        </>
    );
};

export default MonthDetails;