'use client'
import React, { useEffect, useState } from "react";
import { clientStyle } from "./clientStyle";
import { Box, Button, Grid, Typography, TableHead, TableRow, TableCell, Checkbox, TableBody, IconButton, TableContainer, Paper, Table, Switch, Pagination, TablePagination } from "@mui/material";
import Image from "next/image";
import PersonIcon from '@mui/icons-material/Person'
import TrialStatus from "@/components/TrialLabel";
import AccountButton from "@/components/AccountButton";
import dynamic from "next/dynamic";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { styled } from '@mui/material/styles';

const SidebarAdmin = dynamic(() => import('../../../components/SidebarAdmin'), {
    suspense: true,
});

interface ClientFetchData {
    id: number
    name: string
    email: string
    joined_data: string
    parther: string
    reseller: string
    approval: string
}


interface TableBodyClientProps {
    data: ClientFetchData[]
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

const TableHeader = () => {
    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox color="primary" />
                </TableCell>
                <TableCell>Client name</TableCell>
                <TableCell style={{textAlign: 'center'}}>Client email</TableCell>
                <TableCell style={{textAlign: 'center'}}>Joined date</TableCell>
                <TableCell style={{textAlign: 'center'}}>Partner name</TableCell>
                <TableCell style={{textAlign: 'center'}}>Reseller name</TableCell>
                <TableCell style={{textAlign: 'center'}}>Apprval</TableCell>
                <TableCell style={{textAlign: 'center'}}>Accept/Reject</TableCell>
                <TableCell style={{textAlign: 'center'}}>Actions</TableCell>
            </TableRow>
        </TableHead>
    )
  }

const TableBodyClient: React.FC<TableBodyClientProps> = ({ data }) =>
{
    return (
        <TableBody>
        {data.map((row) => (
            <TableRow key={row.id}>
            <TableCell padding="checkbox">
                <Checkbox color="primary" />
            </TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell style={{textAlign: 'center'}}>{row.email}</TableCell>
            <TableCell style={{textAlign: 'center'}}>{row.joined_data}</TableCell>
            <TableCell style={{textAlign: 'center'}}>{row.parther}</TableCell>
            <TableCell style={{textAlign: 'center'}}>{row.reseller}</TableCell>
            <TableCell sx={{ textAlign: 'center' }}>
                <Button 
                variant='text' size="small" style={{fontSize: '12px'}}  sx={ row.approval.toLowerCase() === 'approved' ? clientStyle.button_success : ( row.approval.toLowerCase() === 'rejected' ? clientStyle.button_reject : clientStyle.button_pending) }>
                {row.approval}
                </Button>
            </TableCell>
            <TableCell sx={{ textAlign: 'center'}}><IOSSwitch></IOSSwitch></TableCell>
            <TableCell>
                <IconButton aria-label="edit">
                <EditIcon />
                </IconButton>
                <IconButton aria-label="delete">
                <DeleteIcon color='error' />
                </IconButton>
            </TableCell>
            </TableRow>
        ))}
        </TableBody>
    )
}


const Client: React.FC = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(10);
    const [data, setData] = useState<ClientFetchData[]>([]);
    const [paginatedData, setPaginatedData] = useState<ClientFetchData[]>([]);
    const [totalItems, setTotalItems] = useState(0);



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
    }

    const totalPages = Math.ceil(totalItems / rowsPerPage);


    return (
        <>
            <Box sx={clientStyle.headers}>
                <Box sx={clientStyle.logoContainer}>
                    <Image src='/logo.svg' alt='logo' height={80} width={60} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrialStatus />
                    <AccountButton />
                    <Button
                        aria-controls={open ? 'profile-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                        onClick={handleProfileMenuClick}
                    >
                        <PersonIcon sx={clientStyle.account} />
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
                            <Typography variant="h4" component="h1" sx={clientStyle.title}>
                                Clients
                            </Typography>
                        </Box>
                        { data.length > 0 && (
                            <Grid sx={{ marginRight: '4em' }} xs={12} mt={4}>
                            <TableContainer component={Paper}>
                                <Table aria-label="simple table">
                                    <TableHeader />
                                    <TableBodyClient data={paginatedData} />
                                </Table>
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={handlePageChange}
                                    color="primary"
                                    sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}
                                />
                            </TableContainer>
                        </Grid>
                        )}
                    </Grid>
                </Grid>
            </Box>
        </>
    );
}
export default Client;