import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Popover } from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CustomTablePagination from "@/components/CustomTablePagination";
import { payoutsStyle } from "./payoutsStyle";
import dayjs from "dayjs";

interface PartnerAccountsProps {
    partnerName: string;
    onBack: () => void;
    open: boolean;
    selectMonth: string;
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
    account_name: string;
    email: string;
    join_date: Date;
    plan_amount: string;
    reward_amount: string;
    payout_date: Date;
    referral_link: string;
    comment: string;
    reward_status: string;
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

const PartnerAccounts: React.FC<PartnerAccountsProps> = ({ partnerName, open, onBack, selectMonth }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [data, setData] = useState<RewardData[] | []>([]);
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
            //const response = await axiosInstance.get(`/api/rewards/${selectedMonth}`);
            // Обработка данных из ответа
            // setTotalCount(response.data.totalCount);
            // setData(response.data.rewards);
            setData(testData);
            setTotalCount(testData.length);
        } catch (error) {
        }
    };

    const testData: RewardData[] = [
        {
            account_name: "Lolly",
            email: "abcdefghijkl@gmail.com",
            join_date: new Date("2024-08-27"),
            plan_amount: "$200",
            reward_amount: "$200",
            payout_date: new Date("2024-08-27"),
            referral_link: 'maximiz-referral-g22s',
            comment: '--',
            reward_status: "Pending",
        },
        {
            account_name: "Klaviyo",
            email: "abcdefghijkl@gmail.com",
            join_date: new Date("2024-08-27"),
            plan_amount: "$200",
            reward_amount: "$200",
            payout_date: new Date("2024-08-27"),
            referral_link: 'maximiz-referral-g22s',
            comment: '--',
            reward_status: "Pending",
        },
        {
            account_name: "Maximiz",
            email: "abcdefghijkl@gmail.com",
            join_date: new Date("2024-08-27"),
            plan_amount: "$200",
            reward_amount: "$200",
            payout_date: new Date("2024-08-27"),
            referral_link: 'maximiz-referral-g22s',
            comment: '--',
            reward_status: "Pending",
        },
        {
            account_name: "Meta",
            email: "abcdefghijkl@gmail.com",
            join_date: new Date("2024-08-27"),
            plan_amount: "$200",
            reward_amount: "$200",
            payout_date: new Date("2024-08-27"),
            referral_link: 'maximiz-referral-g22s',
            comment: '--',
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
                                                    {item.account_name}
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
                                                        {item.reward_status}
                                                    </Typography>
                                                    <IconButton
                                                        onClick={(event) => handleOpenMenu(event, index)}
                                                        sx={{ ':hover': { backgroundColor: 'transparent', color: 'rgba(80, 82, 178, 1) !important', },  }}
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
                                                                        color: "rgba(80, 82, 178, 1)",
                                                                        backgroundColor: "rgba(80, 82, 178, 0.1)",
                                                                    },
                                                                }}
                                                                onClick={() => {
                                                                    // Add your logic here
                                                                    console.log("Rewards history clicked");
                                                                }}
                                                            >
                                                                Approve
                                                            </Button>
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
                                                                        color: "rgba(80, 82, 178, 1)",
                                                                        backgroundColor: "rgba(80, 82, 178, 0.1)",
                                                                    },
                                                                }}
                                                                onClick={() => {
                                                                    // Add your logic here
                                                                    console.log("Disable clicked");
                                                                }}
                                                            >
                                                                Reject
                                                            </Button>
                                                        
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
                </Box>

            </Box>
        </Box>
    );
};

export default PartnerAccounts;
