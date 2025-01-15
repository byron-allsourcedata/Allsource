import { suppressionsStyles } from "@/css/suppressions";
import { Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { Box } from "@mui/system";
import dayjs from "dayjs";
import CustomTablePagination from "@/components/CustomTablePagination";
import { useEffect, useState } from "react";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { list } from "postcss";

interface RewardData {
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
    { key: 'sources', label: 'Sources', sortable: true },
    { key: 'number_of_accounts', label: 'No.of accounts', sortable: false },
    { key: 'reward_amount', label: 'Reward amount', sortable: false },
    { key: 'reward_approved', label: 'Reward approved', sortable: false },
    { key: 'reward_payout_date', label: 'Reward Payout date', sortable: true },
    { key: 'reward_status', label: 'Reward status', sortable: false },
    { key: 'actions', label: 'Actions', sortable: false },
];

const MonthDetails: React.FC<MonthDetailsProps> = ({ open, onBack, selectedMonth }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [data, setData] = useState<RewardData[] | []>([]);


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
                    <Typography className="second-sub-title">{selectedMonth}</Typography>
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
                                                    color: 'rgba(80, 82, 178, 1) !important',
                                                    left: 0,
                                                    zIndex: 1,
                                                    backgroundColor: '#fff',
                                                }}>
                                                    {item.partner_name}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {item.email}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {item.sources}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {item.number_of_accounts}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {item.reward_amount}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {item.reward_approved}
                                                </TableCell>

                                                <TableCell className='table-data' sx={suppressionsStyles.tableBodyColumn}>
                                                    {dayjs(item.reward_payout_date).format('MMM D, YYYY')}
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
                                                            padding: '10px 24px',
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