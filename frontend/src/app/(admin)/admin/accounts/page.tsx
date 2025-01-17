'use client'
import React, { useEffect, useState } from "react";
import { accountsStyle } from "./accountsStyle";
import {
    Box, Button, Grid, Typography, TableHead, TableRow, TableCell,
    TableBody, TableContainer, Paper, Table,
    Switch, Pagination,
    SwitchProps, Link,
    Menu,
    MenuItem,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    Popover,
    TextField,
    InputAdornment
} from "@mui/material";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useUser } from "@/context/UserContext";
import { useTrial } from '@/context/TrialProvider';
import { styled } from '@mui/material/styles';
import axiosInstance from '../../../../axios/axiosInterceptorInstance';
import { useRouter } from "next/navigation";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CustomizedProgressBar from '@/components/ProgressBar'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { suppressionsStyles } from "@/css/suppressions";
import { orderBy } from "lodash";
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { MoreHoriz } from "@mui/icons-material";
import { datasyncStyle } from "@/app/(client)/data-sync/datasyncStyle";
import { leadsStyles } from "@/app/(client)/leads/leadsStyles";
import { showErrorToast, showToast } from "@/components/ToastNotification";


interface UserData {
    id: number
    full_name: string
    email: string
    created_at: string
    payment_status: string
    is_trial: boolean
}


interface TableBodyUserProps {
    data: UserData[]
    handleSwitchChange: any
}



const IOSSwitch = styled((props: SwitchProps) => (
    <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
    width: 56,
    height: 26,
    padding: 0,
    '& .MuiSwitch-switchBase': {
        padding: 0,
        margin: 2,
        transitionDuration: '300ms',
        '&.Mui-checked': {
            transform: 'translateX(30px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
                backgroundColor: theme.palette.mode === 'dark' ? '#2ECA45' : '#65C466',
                opacity: 1,
                border: 0,
            },
            '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.5,
            },
        },
        '&.Mui-focusVisible .MuiSwitch-thumb': {
            color: '#33cf4d',
            border: '6px solid #fff',
        },
        '&.Mui-disabled .MuiSwitch-thumb': {
            color:
                theme.palette.mode === 'light'
                    ? theme.palette.grey[100]
                    : theme.palette.grey[600],
        },
        '&.Mui-disabled + .MuiSwitch-track': {
            opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
        },
    },
    '& .MuiSwitch-thumb': {
        boxSizing: 'border-box',
        width: 22,
        height: 22,
    },
    '& .MuiSwitch-track': {
        borderRadius: 26 / 2,
        backgroundColor: theme.palette.mode === 'light' ? '#E9E9EA' : '#39393D',
        opacity: 1,
        transition: theme.transitions.create(['background-color'], {
            duration: 500,
        }),
    },
}));

const tableHeaders = [
    { key: 'account_name', label: `Account name`, sortable: false },
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

const TableHeader: React.FC<{ onSort: (field: string) => void, sortField: string, sortOrder: string }> = ({ onSort, sortField, sortOrder }) => {
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);

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

const Users: React.FC = () => {
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(9);
    const [data, setData] = useState<UserData[]>([]);
    const [paginatedData, setPaginatedData] = useState<UserData[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [sortedData, setSortedData] = useState<UserData[]>([]);
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

    const makePartner = async (userId: number, isPartner: boolean) => {
        try {
            const response = await axiosInstance.put('/admin/user', {
                user_id: userId,
                is_partner: isPartner,
            });
            showToast('User updated succesfuly')
            fetchData();
        } catch (error) {
            showErrorToast('Error updating user');
        }
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
                    color: 'rgba(80, 82, 178, 1) !important',
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

    const formatFunnelText = (text: boolean) => {
        if (text === false) {
            return 'New';
        }
        if (text === true) {
            return 'Returning';
        }
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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        const accessToken = localStorage.getItem('token');
        if (!accessToken) {
            router.push('/signin');
            return;
        }
        try {
            const response = await axiosInstance.get('/admin/users', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            if (response.status === 200) {
                setData(response.data);
                setTotalItems(response.data.length);
                setSortedData(response.data);
            }
        }
        catch {
        }
        finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!sortField) {
            setSortField('created_at')
        }
        const sorted = [...data].sort((a: any, b: any) => {
            const valueA = a[sortField];
            const valueB = b[sortField];
            if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
            if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        setSortedData(sorted);
    }, [data, sortField, sortOrder]);

    useEffect(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        setPaginatedData(sortedData.slice(startIndex, endIndex));
    }, [currentPage, sortedData, rowsPerPage]);

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
    };


    const handleSort = (field: string) => {
        const isAsc = sortField === field && sortOrder === 'asc';
        setSortOrder(isAsc ? 'desc' : 'asc');
        setSortField(field);
    };

    const handleSwitchChange = async (user: any, action: 'activate' | 'deactivate') => {
        const updatedData = sortedData.map((item) =>
            item.id === user.id ? { ...item, is_trial: action === 'activate' } : item
        );
        setSortedData(updatedData);

        await axiosInstance.get('/admin/confirm_customer', {
            params: {
                mail: user.email,
                free_trial: action === 'activate',
            },
        });
    };


    const totalPages = Math.ceil(totalItems / rowsPerPage);

    const renderCellContent = (key: string, row: any) => {
        switch (key) {
            case 'account_name':
                return row.full_name || '--';
            case 'email':
                return row.email || '--';
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
                        {formatFunnelText(row.payment_status) || "--"}
                    </Typography>
                );
            // case 'status':
            //     return (
            //         <IOSSwitch
            //             onChange={() => onSwitchChange(row)}
            //             checked={!!row.is_trial}
            //             disabled={['SUBSCRIPTION_ACTIVE', 'NEED_CONFIRM_EMAIL', 'FILL_COMPANY_DETAILS'].includes(row.payment_status)}
            //         />
            //     );
            case 'actions':
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
                                            color: "rgba(80, 82, 178, 1)",
                                            backgroundColor: "rgba(80, 82, 178, 0.1)",
                                        },
                                    }}
                                    onClick={() => {
                                        // Add your logic here
                                        console.log("Payment history clicked");
                                    }}
                                >
                                    Payment History
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
                                        makePartner(row.id, true)
                                    }}
                                >
                                    Make a partner
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
                                        console.log("Rewards history clicked");
                                    }}
                                >
                                    Rewards History
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
                                    Disable
                                </Button>
                                {row.is_trial ? (
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
                                            handleSwitchChange(row, "deactivate");
                                            handleCloseMenu();
                                        }}
                                    >
                                        Deactivate Trial
                                    </Button>
                                ) : (
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
                                            handleSwitchChange(row, "activate");
                                            handleCloseMenu();
                                        }}
                                    >
                                        Activate Trial
                                    </Button>
                                )}
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
                                        console.log("Terminate clicked");
                                    }}
                                >
                                    Terminate
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
                                        handleSwitchChange(row, "activate");
                                        handleCloseMenu();
                                    }}
                                >
                                    Log Info
                                </Button>
                            </Box>
                        </Popover>

                    </>
                );

            default:
                return row[key] || '--';
        }
    };

    if (isLoading) {
        return <CustomizedProgressBar />;
    }

    return (
        <>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Grid container width='100%'>
                    <Grid item xs={12} md={12} sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'start', justifyContent: 'space-between', mb: 4 }}>
                            <Typography variant="h4" component="h1" sx={accountsStyle.title}>
                                Users
                            </Typography>
                        </Box>
                        {/* {data.length > 0 && ( */}
                        <Grid sx={{ pl: 1, pr: 3 }} xs={12} mt={0}>
                            <TableContainer component={Paper}>
                                <Table aria-label="simple table">
                                    <TableHeader onSort={handleSort} sortField={sortField} sortOrder={sortOrder} />
                                    <TableBody>
                                        {paginatedData.map((row) => (
                                            <TableRow key={row.id}>
                                                {tableHeaders.map(({ key }) => (
                                                    <TableCell key={key} sx={{ ...leadsStyles.table_array, textAlign: key === 'actions' ? 'center' : 'left', position: 'relative', padding: '8px' }} >
                                                        {renderCellContent(key, row)}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={handlePageChange}
                                color="primary"
                                sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}
                            />
                        </Grid>
                        {/* )} */}
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

export default Users;