"use client";
import {
    Box, Grid, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, IconButton, Link
} from '@mui/material'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import React, { useState } from 'react'
import { resellerStyle } from './resellerStyle'
import PersonIcon from '@mui/icons-material/Person'
import TrialStatus from '../../../(client)/components/TrialLabel'
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Checkbox from '@mui/material/Checkbox';


const SidebarAdmin = dynamic(() => import('../../SidebarAdmin'), {
    suspense: true,
});


interface ResellerData {
  id: number;
  agentName: string;
  joinedDate: string;
  partnerAccounts: number;
  revenue: string;
  commission: string;
  clientAccounts: number;
  status: string;
}


interface TableBodyResellerProps {
  data: ResellerData[];
}

const TableHeader = () => {
  return (
      <TableHead>
          <TableRow>
              <TableCell padding="checkbox">
                  <Checkbox color="primary" />
              </TableCell>
              <TableCell>Agent name</TableCell>
              <TableCell style={{textAlign: 'center'}}>Joined date</TableCell>
              <TableCell style={{textAlign: 'center'}}>Partner accounts</TableCell>
              <TableCell style={{textAlign: 'center'}}>Revenue</TableCell>
              <TableCell style={{textAlign: 'center'}}>Commission</TableCell>
              <TableCell style={{textAlign: 'center'}}>Client accounts</TableCell>
              <TableCell style={{textAlign: 'center'}}>Status</TableCell>
              <TableCell style={{textAlign: 'center'}}>Actions</TableCell>
          </TableRow>
      </TableHead>
  )
}

const TableBodyReseller: React.FC<TableBodyResellerProps> = ({ data }) => {
  return (
    <TableBody>
      {data.map((row) => (
        <TableRow key={row.id}>
          <TableCell padding="checkbox">
            <Checkbox color="primary" />
          </TableCell>
          <TableCell>{row.agentName}</TableCell>
          <TableCell style={{textAlign: 'center'}}>{row.joinedDate}</TableCell>
          <TableCell style={{textAlign: 'center'}}>{row.partnerAccounts}</TableCell>
          <TableCell style={{textAlign: 'center'}}>{row.revenue}</TableCell>
          <TableCell style={{textAlign: 'center'}}>{row.commission}</TableCell>
          <TableCell style={{textAlign: 'center'}}>{row.clientAccounts}</TableCell>
          <TableCell sx={{ textAlign: 'center' }}>
            <Button
            variant='text' size="small" sx={{ fontWeight: 600, backgroundColor: '#EAF8DD', color: '#6EC125' }}>
              {row.status}
            </Button>
          </TableCell>
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
  );
};



const Reseller: React.FC = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const open = Boolean(anchorEl)
    const handleProfileMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget)
    }

    const data = [
      {
          id: 1,
          agentName: 'Company name 1',
          joinedDate: '12/02/2024',
          partnerAccounts: 240,
          revenue: '$123,00.00',
          commission: '20%',
          clientAccounts: 234,
          status: 'Active'
      },
      {
        id: 1,
        agentName: 'Company name 1',
        joinedDate: '12/02/2024',
        partnerAccounts: 240,
        revenue: '$123,00.00',
        commission: '20%',
        clientAccounts: 234,
        status: 'Active'
    },
    {
      id: 1,
      agentName: 'Company name 1',
      joinedDate: '12/02/2024',
      partnerAccounts: 240,
      revenue: '$123,00.00',
      commission: '20%',
      clientAccounts: 234,
      status: 'Active'
  }
  ];
    return (
        <>
      <Box sx={resellerStyle.headers}>
          <Box sx={resellerStyle.logoContainer}>
              <Link href="/" underline="none" sx={{ zIndex: 10 }}>
                  <Image src='/logo.svg' alt='logo' height={80} width={60} />
              </Link>
          </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <TrialStatus />
          <Button
            aria-controls={open ? 'profile-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleProfileMenuClick}
          >
            <PersonIcon sx={resellerStyle.account} />
          </Button>
        </Box>
      </Box>
      <Box sx={{flex: 1, display: 'flex', flexDirection: 'column'}}>
        <Grid container width='100%'>
          <Grid item xs={12} md={2} sx={{ padding: '0px' }}>
            <SidebarAdmin />
          </Grid>
          <Grid item xs={12} md={10} sx={{display: 'flex', flexDirection: 'column', flex: 1}}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h4" component="h1" sx={resellerStyle.title}>
                Reseller
              </Typography>
              <Button variant="contained"
              size='large'
                sx={{ marginRight: '4em',
                      backgroundColor: 'rgba(80, 82, 178, 1)',
                      fontFamily: "Nunito Sans", textTransform: 'none',
                      fontWeight: 'bold',
                      mt: 3 }}
              >
                  Add Reseller
              </Button>
            </Box>
            <Grid sx={{ marginRight: '4em'}} xs={12} mt={4}>
            <TableContainer component={Paper}>
              <Table aria-label="simple table" >
                <TableHeader />
                <TableBodyReseller data={data} />
              </Table>
            </TableContainer>
          </Grid>
          </Grid>
        </Grid>
      </Box>

        </>

     );
}

export default Reseller;