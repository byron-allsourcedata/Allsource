'use client'
import React, { useEffect, useState } from "react";
import { usersStyle } from "./userStyle";
import { Box, Button, Grid, Typography, TableHead, TableRow, TableCell, 
    Checkbox, TableBody, TableContainer, Paper, Table, 
    Switch, Pagination } from "@mui/material";
import Image from "next/image";
import PersonIcon from '@mui/icons-material/Person'
import AccountButton from "@/components/AccountButton";
import dynamic from "next/dynamic"; 
import { styled } from '@mui/material/styles';
import axiosInstance from '../../../axios/axiosInterceptorInstance';
import { useRouter } from "next/navigation";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const SidebarAdmin = dynamic(() => import('../../../components/SidebarAdmin'), {
    suspense: true,
});

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
}

const IOSSwitch = styled((props) => (
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

const TableHeader: React.FC<{ onSort: (field: string) => void, sortField: string, sortOrder: string }> = ({ onSort, sortField, sortOrder }) => {
    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox color="primary" />
                </TableCell>
                <TableCell onClick={() => onSort('full_name')} sx={{ cursor: 'pointer' }}>
                    <Typography sx={{ textAlign: 'center', cursor: 'pointer', display: "flex", }}>
                        Username {sortField === 'full_name' && (sortOrder === 'asc' ? <ExpandLessIcon /> :  <ExpandMoreIcon/ > )}
                    </Typography>
                </TableCell>
                <TableCell onClick={() => onSort('email')} >
                    <Typography sx={{ textAlign: 'center', cursor: 'pointer', display: "flex", justifyContent: 'center'}}>
                        Email {sortField === 'email' && (sortOrder === 'asc' ? <ExpandLessIcon /> : <ExpandMoreIcon/ > )}
                    </Typography>
                </TableCell>
                <TableCell onClick={() => onSort('created_at')} sx={{ textAlign: 'center', cursor: 'pointer',width: '200px' }}>
                    <Typography sx={{ textAlign: 'center', cursor: 'pointer', display: "flex", justifyContent: 'center'}}>
                        Joined date {sortField === 'created_at' && (sortOrder === 'asc' ? <ExpandLessIcon /> : <ExpandMoreIcon/ > )}
                    </Typography>
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}><Typography>Payments status</Typography></TableCell>
                <TableCell sx={{ textAlign: 'center' }}><Typography>Free Trial</Typography></TableCell>
            </TableRow>
        </TableHead>
    )
}

const TableBodyClient: React.FC<TableBodyUserProps> = ({ data }) => {
    const [sortedData, setSortedData] = useState<UserData[]>(data)
    const [sortField, setSortField] = useState<string>('')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString)
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    }
    const handleSort = (field: string) => {
        const isAsc = sortField === field && sortOrder === 'asc'
        setSortOrder(isAsc ? 'desc' : 'asc')
        setSortField(field)
    }

    useEffect(() => {
        if (!sortField) {
            setSortedData(data);
            return;
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


    const handleSwitchChange = async (user_change: any) => {
        const updatedData = sortedData.map(user =>
            user.id === user_change.id ? { ...user, is_trial: !user.is_trial } : user
        )
        setSortedData(updatedData);
        try {
            await axiosInstance.get('/admin/confirm_customer', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                params: {
                    mail: user_change.email,
                    free_trial: !user_change.is_trial
                } 
            })
        } catch (error) {
            console.error('Ошибка при обновлении пользователя:', error);
        }
    };
    return (
        <>
            <TableHeader onSort={handleSort} sortField={sortField} sortOrder={sortOrder} />
            <TableBody>
                {sortedData.map((row) => (
                    <TableRow key={row.id}>
                        <TableCell padding="checkbox">
                            <Checkbox color="primary" />
                        </TableCell>
                        <TableCell>{row.full_name}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{row.email}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{formatDate(row.created_at)}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                            <Button
                                variant='text'
                                size="small"
                                sx={{
                                    fontWeight: 500,
                                    backgroundColor: row.payment_status === 'COMPLETE' ? '#EAF8DD' : '#FEF3CD',
                                    color: row.payment_status === 'COMPLETE' ? '#6EC125' : '#FBC70E'
                                }}>
                                {row.payment_status}
                            </Button>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}><IOSSwitch onChange={() => handleSwitchChange(row)} checked={row.is_trial}  /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </>
    )
}



const Users: React.FC = () => {
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(10);
    const [data, setData] = useState<UserData[]>([]);
    const [paginatedData, setPaginatedData] = useState<UserData[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true)
    useEffect(() => {
        const accessToken = localStorage.getItem('token');
        if (!accessToken) {
            router.push('/signin');
            return;
        }

        const fetchData = async () => {
            try{
                const response = await axiosInstance.get('/admin/users', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                if (response.status === 200) {
                    setData(response.data);
                    setTotalItems(response.data.length);
                }     
            }
            finally {
                setIsLoading(false);
              }
            }
        fetchData();
        
    }, [router]);
    useEffect(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        setPaginatedData(data.slice(startIndex, endIndex));
    }, [currentPage, data, rowsPerPage]);

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
    };

    const handleProfileMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const totalPages = Math.ceil(totalItems / rowsPerPage);

    if (isLoading) {
        return <div>Loading...</div>;
    } 

    return (
        <>
            <Box sx={usersStyle.headers}>
                <Box sx={usersStyle.logoContainer}>
                    <Image src='/logo.svg' alt='logo' height={80} width={60} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountButton />
                    <Button
                        aria-controls={open ? 'profile-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                        onClick={handleProfileMenuClick}
                    >
                        <PersonIcon sx={usersStyle.account} />
                    </Button>
                </Box>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Grid container width='100%'>
                    <Grid item xs={12} md={2} sx={{ padding: '0px' }}>
                        <SidebarAdmin />
                    </Grid>
                    <Grid item xs={12} md={10} sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h4" component="h1" sx={usersStyle.title}>
                                Users
                            </Typography>
                        </Box>
                        {data.length > 0 && (
                            <Grid sx={{ marginRight: '4em' }} xs={12} mt={4}>
                                <TableContainer component={Paper}>
                                    <Table aria-label="simple table">
                                        <TableBodyClient data={paginatedData} />
                                    </Table>
                                </TableContainer>
                                <Pagination
                                        count={totalPages}
                                        page={currentPage}
                                        onChange={handlePageChange}
                                        color="primary"
                                        sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2}}
                                    />
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            </Box>
        </>
    );
}

export default Users;