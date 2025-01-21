import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Popover, TextField, InputAdornment, Tab, Tabs } from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CustomTablePagination from "@/components/CustomTablePagination";
import { payoutsStyle } from "./payoutsStyle";
import dayjs from "dayjs";
import SearchIcon from '@mui/icons-material/Search';
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import CustomizedProgressBar from "@/components/ProgressBar";
import RejectSlider from "./RejectSlider";

interface PartnerAccountsProps {
    partnerName: string;
    onBack: () => void;
    open: boolean;
    selectMonth: string;
    selectYear: string;
    partnerId: number;
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

interface RewardData {
    partner_id: number;
    company_name: string;
    email: string;
    join_date: Date;
    plan_amount: string;
    reward_amount: string;
    payout_date: Date;
    referral_link: string;
    comment: string;
    reward_status: string;
    referral_payouts_id: number;
}

const tableHeaders = [
    { key: 'account_name', label: 'Account name', sortable: false },
    { key: 'email', label: 'Email', sortable: false },
    { key: 'join_date', label: 'Join date', sortable: true },
    { key: 'plan_amount', label: 'Plan amount', sortable: false },
    { key: 'reward_amount', label: 'Reward amount', sortable: false },
    { key: 'payout_date', label: 'Payout date', sortable: true },
    { key: 'referral_link', label: 'Referral link', sortable: false },
    { key: 'comment', label: 'Comment', sortable: false },
    { key: 'reward_status', label: 'Reward status', sortable: false },
];

const PartnerAccounts: React.FC<PartnerAccountsProps> = ({ partnerName, open, onBack, selectMonth, partnerId, selectYear }) => {
    const [tabIndex, setTabIndex] = useState(0);
    const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
        setTabIndex(newIndex);
    };
    const [page, setPage] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [data, setData] = useState<RewardData[] | []>([]);
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [activeRow, setActiveRow] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [isSliderOpen, setSliderOpen] = useState(false);
    const [selectedPayoutId, setSelectedPayoutId] = useState<number | null>(null);

    const handleOpenSlider = (id: number) => {
        setSelectedPayoutId(id);
        setSliderOpen(true);
    };

    const handleCloseSlider = () => {
        setSliderOpen(false);
        setSelectedPayoutId(null);
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, rowId: number) => {
        setMenuAnchor(event.currentTarget);
        setActiveRow(rowId);
    };

    const handleCloseMenu = () => {
        setMenuAnchor(null);
        setActiveRow(null);
    };

    const handleSubmit = () => {
        fetchRewardData();
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

    const handleStatusChange = async (referralPayoutId: number, confirmationStatus: string) => {
        try {
            const response = await axiosInstance.put(`/admin-payouts/partners/${referralPayoutId}`, {
                confirmation_status: confirmationStatus,
                text: confirmationStatus === "approve" ? "Approved by admin" : "Rejected by admin",
            });
            fetchRewardData();
            showToast('Success changed payouts status')
        } catch (error) {
            showErrorToast("Error updating payout status:");
        }
    };
    

    useEffect(() => {
        if (open) {
            fetchRewardData();
        }
    }, [open]);

    const fetchRewardData = async () => {
        try {
            setIsLoading(true)
            const monthArray = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
    
            const selectedMonthNumber = selectMonth 
                ? monthArray.indexOf(selectMonth) + 1 
                : undefined;

            const response = await axiosInstance.get("/admin-payouts/partners", {
                params: {
                    year: selectYear,
                    month: selectedMonthNumber,
                    partner_id: partnerId,
                    reward_type:'master_partner'
                },
            });
    
            const rewards: RewardData[] = response.data.map((reward: any) => ({
                company_name: reward.company_name,
                email: reward.email,
                sources: reward.sources,
                plan_amount: reward.plan_amount,
                number_of_accounts: reward.number_of_accounts,
                referral_link: reward.referral_link,
                reward_amount: reward.reward_amount,
                reward_approved: reward.reward_approved,
                reward_payout_date: new Date(reward.reward_payout_date),
                reward_status: reward.reward_status,
                comment: reward.comment,
                referral_payouts_id: reward.referral_payouts_id,
            }));
    
            setData(rewards);
            setTotalCount(rewards.length);
        } catch (error) {
        } finally{
            setIsLoading(false)
        }
    };

    const handleSearchChange = (event: any) => {
        setSearch(event.target.value);
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
                        <Typography className="second-sub-title">{selectMonth} -- {partnerName}</Typography>
                    </Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', mb:2 }}>
                    

                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'start', alignItems: 'center', "@media (max-width: 900px)": { pr: 0 }, "@media (max-width: 600px)": { width: '97%', pr: '0' } }}>
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
                        </Tabs>
                </Box>

                <Box sx={{display: 'flex', flexDirection: 'row', gap:2}}>
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
                                                    left: 0,
                                                    zIndex: 1,
                                                    backgroundColor: '#fff',
                                                }}
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
                                                    {item.plan_amount}
                                                </TableCell>

                                                <TableCell className='table-data' sx={payoutsStyle.tableBodyColumn}>
                                                    {item.reward_amount}
                                                </TableCell>

                                                <TableCell className='table-data' sx={payoutsStyle.tableBodyColumn}>
                                                    {dayjs(item.payout_date).format('MMM D, YYYY')}
                                                </TableCell>

                                                <TableCell className='table-data' sx={payoutsStyle.tableBodyColumn}>
                                                    {item.referral_link}
                                                </TableCell>

                                                <TableCell sx={{ ...payoutsStyle.tableBodyColumn, textAlign: 'center', pl: 0 }}>
                                                    <Typography component="span" sx={{
                                                        padding: '6px 8px',
                                                        borderRadius: '2px',
                                                        fontFamily: 'Roboto',
                                                        fontSize: '12px',
                                                        fontWeight: '400',
                                                        lineHeight: '16px',
                                                    }}>
                                                        {item.comment || '--'}
                                                    </Typography>
                                                </TableCell>


                                                <TableCell sx={{ ...payoutsStyle.tableBodyColumn, textAlign: 'center', pl: 0 }}>
                                                <Typography component="span" sx={{
                                                        padding: '6px 8px',
                                                        borderRadius: '2px',
                                                        fontFamily: 'Roboto',
                                                        fontSize: '12px',
                                                        fontWeight: '400',
                                                        lineHeight: '16px',
                                                    }}>
                                                        {item.reward_status.charAt(0).toUpperCase() + item.reward_status.slice(1)}
                                                    </Typography>
                                                    <IconButton
                                                        onClick={(event) => handleOpenMenu(event, index)}
                                                        sx={{ ':hover': { backgroundColor: 'transparent', color: 'rgba(80, 82, 178, 1) !important' }, padding:0 }}
                                                    >
                                                        <KeyboardArrowDownIcon />
                                                    </IconButton>
                                                    <Popover
                                                        open={Boolean(menuAnchor) && activeRow === index}
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
                                                            {item.reward_status !== 'approved' && (<Button
                                                                sx={{
                                                                    justifyContent: "flex-start",
                                                                    width: "100%",
                                                                    textTransform: "none",
                                                                    fontFamily: "Nunito Sans",
                                                                    fontSize: "14px",
                                                                    color: "rgba(32, 33, 36, 1)",
                                                                    fontWeight: 600,
                                                                    ":hover": {
                                                                        color: "rgba(80, 82, 178, 1)",
                                                                        backgroundColor: "rgba(80, 82, 178, 0.1)",
                                                                    },
                                                                }}
                                                                onClick={() =>
                                                                    handleStatusChange(item.referral_payouts_id, "approve")
                                                                }
                                                            >
                                                                Approve
                                                            </Button> )}
                                                            {item.reward_status !== 'reject' && (<Button
                                                                sx={{
                                                                    justifyContent: "flex-start",
                                                                    width: "100%",
                                                                    textTransform: "none",
                                                                    fontFamily: "Nunito Sans",
                                                                    fontSize: "14px",
                                                                    color: "rgba(32, 33, 36, 1)",
                                                                    fontWeight: 600,
                                                                    ":hover": {
                                                                        color: "rgba(80, 82, 178, 1)",
                                                                        backgroundColor: "rgba(80, 82, 178, 0.1)",
                                                                    },
                                                                }}
                                                                onClick={() => { handleCloseMenu(), handleOpenSlider(item.referral_payouts_id) }}
                                                            >
                                                                Reject
                                                            </Button>)}
                                                        
                                                        </Box>
                                                    </Popover>
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
                    {(isSliderOpen && selectedPayoutId) && <RejectSlider isOpen={isSliderOpen}
                        onClose={handleCloseSlider}
                        onSumbit={handleSubmit}
                        referralPayoutId={selectedPayoutId} />}
                </Box>

            </Box>
        </Box>
    );
};

export default PartnerAccounts;
