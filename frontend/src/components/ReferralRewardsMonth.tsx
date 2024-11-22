import { suppressionsStyles } from "@/css/suppressions";
import { Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { Box } from "@mui/system";
import dayjs from "dayjs";
import CustomTablePagination from "./CustomTablePagination";
import { useEffect, useState } from "react";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import axiosInstance from "@/axios/axiosInterceptorInstance";

interface RewardData {
    month: string;
    account_name: string;
    email: string;
    join_date: Date;
    plan_amount: number;
    reward_amount: string;
    reward_status: string;
    payout_date: Date;
    referral_link: string;
}

interface MonthDetailsProps {
    onBack: () => void;
    selectedMonth: string;
    open: boolean;
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
    { key: 'account_name', label: 'Account name', sortable: false },
    { key: 'email', label: 'Email', sortable: false },
    { key: 'join_date', label: 'Join date', sortable: true },
    { key: 'plan_amount', label: 'Plan amount', sortable: false },
    { key: 'reward_amount', label: 'Reward amount', sortable: false },
    { key: 'reward_status', label: 'Reward status', sortable: false },
    { key: 'reward_payout_date', label: 'Payout date', sortable: true },
    { key: 'referral_link', label: 'Referral link', sortable: false },
];

const MonthDetails: React.FC<MonthDetailsProps> = ({ open, onBack, selectedMonth }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [data, setData] = useState<RewardData[] | null>(null);

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
        } catch (error) {
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

            <Box>
                <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', mb:2, gap:2}}>
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
                    <Typography className="second-sub-title">{selectedMonth} Reward Details</Typography>
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
                                                ...(key === 'personal_email' && {
                                                    position: 'sticky',
                                                    left: 0,
                                                    zIndex: 99,
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
                                {data?.map((item, index) => (
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
                                            left: 0,
                                            zIndex: 1,
                                            backgroundColor: '#fff',
                                        }}>
                                            {item.account_name}
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

                                        <TableCell sx={{ ...suppressionsStyles.tableColumn, textAlign: 'center', pl: 0 }}>
                                            <Typography component="span" sx={{
                                                background: getStatusStyle(item.reward_status).background,
                                                padding: '6px 8px',
                                                borderRadius: '2px',
                                                fontFamily: 'Roboto',
                                                fontSize: '12px',
                                                fontWeight: '400',
                                                lineHeight: '16px',
                                                color: getStatusStyle(item.reward_status).color,
                                            }}>
                                                {item.reward_status}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                            {dayjs(item.payout_date).format('MMM D, YYYY')}
                                        </TableCell>

                                        <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                            {item.referral_link}
                                        </TableCell>
                                    </TableRow>
                                ))}
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