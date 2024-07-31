"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { Box, Grid, Typography, Button, Menu, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, TablePagination } from '@mui/material';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { AxiosError } from 'axios';
import { leadsStyles } from './leadsStyles';
import Slider from '../../components/Slider';
import { SliderProvider } from '../../context/SliderContext';
import PersonIcon from '@mui/icons-material/Person';
import TrialStatus from '@/components/TrialLabel';
import AccountButton from '@/components/AccountButton';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

const Sidebar = dynamic(() => import('../../components/Sidebar'), {
  suspense: true,
});


interface CustomTablePaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<{ value: unknown }>) => void;
}

const CustomTablePagination: React.FC<CustomTablePaginationProps> = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const totalPages = Math.ceil(count / rowsPerPage);
  const maxPagesToShow = 3;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      onPageChange(null as any, newPage);
    }
  };

  const getPageButtons = () => {
    const pages = [];
    let startPage = Math.max(0, page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: 1 }}>
      <select
        value={rowsPerPage}
        onChange={onRowsPerPageChange}
        style={{ marginLeft: 8, border: '1px solid rgba(235, 235, 235, 1)', backgroundColor: 'rgba(255, 255, 255, 1)' }}
      >
        {[10, 15, 25, 50].map((option) => (
          <option key={option} value={option}>
            {option} rows
          </option>
        ))}
      </select>
      <Button
        onClick={(e) => handlePageChange(page - 1)}
        disabled={page === 0}
      >
        <ChevronLeft />
      </Button>
      {totalPages > 1 && (
        <>
          {page > 1 && <Button onClick={() => handlePageChange(0)} sx={leadsStyles.page_number}>1</Button>}
          {page > 2 && <Typography variant="body2" sx={{ mx: 1 }}>...</Typography>}
          {getPageButtons().map((pageNumber) => (
            <Button
              key={pageNumber}
              onClick={() => handlePageChange(pageNumber)}
              sx={{ mx: 0.5, ...leadsStyles.page_number }}
              variant={page === pageNumber ? 'contained' : 'text'}
            >
              {pageNumber + 1}
            </Button>
          ))}
          {totalPages - page > 3 && <Typography variant="body2" sx={{ mx: 1 }}>...</Typography>}
          {page < totalPages - 1 && <Button onClick={() => handlePageChange(totalPages - 1)} sx={leadsStyles.page_number}>{totalPages}</Button>}
        </>
      )}
      <Button
        onClick={(e) => handlePageChange(page + 1)}
        disabled={page >= totalPages - 1}
      >
        <ChevronRight />
      </Button>
    </Box>
  );
};


const Leads: React.FC = () => {
  const router = useRouter();
  const { full_name, email } = useUser();
  const [data, setData] = useState<any[]>([]);
  const [count_leads, setCount] = useState<number | null>(null);
  const [max_page, setMaxpage] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showSlider, setShowSlider] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const open = Boolean(anchorEl);
  const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
  const dropdownOpen = Boolean(dropdownEl);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push('/signin');
  };

  const installPixel = () => {
    router.push('/dashboard');
  };

  const handleProfileMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsClick = () => {
    handleProfileMenuClose();
    router.push('/settings');
  };

  const handleSelectRow = (id: number) => {
    setSelectedRows((prevSelectedRows) => {
      const newSelectedRows = new Set(prevSelectedRows);
      if (newSelectedRows.has(id)) {
        newSelectedRows.delete(id);
      } else {
        newSelectedRows.add(id);
      }
      return newSelectedRows;
    });
  };


  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = data.map((row) => row.lead.id);
      setSelectedRows(new Set(newSelecteds));
      return;
    }
    setSelectedRows(new Set());
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<{ value: unknown }>) => {
    setRowsPerPage(parseInt(event.target.value as string, 10));
    setPage(0);
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("token");
    if (accessToken) {
      const fetchData = async () => {
        try {
          const response = await axiosInstance.get(`/leads?page=${page + 1}&per_page=${rowsPerPage}`);
          const [leads, count, max_page] = response.data;
          setData(Array.isArray(leads) ? leads : []);
          setCount(count || 0);
          setMaxpage(max_page || 0);
          setStatus(response.data.status);
        } catch (error) {
          if (error instanceof AxiosError && error.response?.status === 403) {
            if (error.response.data.status === 'NEED_BOOK_CALL') {
              sessionStorage.setItem('is_slider_opened', 'true');
              setShowSlider(true);
            } else if (error.response.data.status === 'PIXEL_INSTALLATION_NEEDED') {
              setStatus(error.response.data.status || null);
            } else {
              setShowSlider(false);
            }
          } else {
            console.error('Error fetching data:', error);
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    } else {
      router.push('/signin')
    }
  }, [setShowSlider, page, rowsPerPage]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const centerContainerStyles = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid rgba(235, 235, 235, 1)',
    borderRadius: 2,
    padding: 3,
    boxSizing: 'border-box',
    width: '90%',
    textAlign: 'center',
    flex: 1,
  };

  const getStatusStyle = (funnel: any) => {
    switch (funnel) {
      case 'Visitor':
        return {
          background: 'rgba(235, 243, 254, 1)',
          color: 'rgba(20, 110, 246, 1)',
        };
      case 'Converted':
        return {
          background: 'rgba(244, 252, 238, 1)',
          color: 'rgba(110, 193, 37, 1)',
        };
      case 'Added to cart':
        return {
          background: 'rgba(241, 241, 249, 1)',
          color: 'rgba(80, 82, 178, 1)',
        };
      case 'Cart abandoned':
        return {
          background: 'rgba(254, 238, 236, 1)',
          color: 'rgba(244, 87, 69, 1)',
        };
      default:
        return {
          background: 'transparent',
          color: 'inherit',
        };
    }
  };

  console.log(data[0])


  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100, backgroundColor: 'white', borderBottom: '1px solid rgba(235, 235, 235, 1)' }}>
          <Box sx={leadsStyles.headers}>
            <Box sx={leadsStyles.logoContainer}>
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
                <PersonIcon sx={leadsStyles.account} />
              </Button>
              <Menu
                id="profile-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleProfileMenuClose}
                MenuListProps={{
                  'aria-labelledby': 'profile-menu-button',
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6">{full_name}</Typography>
                  <Typography variant="body2" color="textSecondary">{email}</Typography>
                </Box>
                <MenuItem onClick={handleSettingsClick}>Settings</MenuItem>
                <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
              </Menu>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: 1, marginTop: '90px', display: 'flex', flexDirection: 'column' }}>
          <Grid container spacing={2} sx={{ flex: 1 }}>
            <Grid item xs={12} md={2} sx={{ padding: '0px', position: 'relative' }}>
              <Sidebar />
            </Grid>
            <Grid item xs={12} md={10} sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Typography variant="h4" component="h1" sx={leadsStyles.title}>
                Leads ({count_leads})
              </Typography>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 2 }}>
                {status === 'PIXEL_INSTALLATION_NEEDED' ? (
                  <Box sx={centerContainerStyles}>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                      Pixel Integration isn&apos;t completed yet!
                    </Typography>
                    <Image src='/pixel_installation_needed.svg' alt='Need Pixel Install' height={200} width={300} />
                    <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
                      Install the pixel to complete the setup.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={installPixel}
                      sx={{ backgroundColor: 'rgba(80, 82, 178, 1)', fontFamily: "Nunito", textTransform: 'none', padding: '1em 3em', fontSize: '16px', mt: 3 }}
                    >
                      Setup Pixel
                    </Button>
                  </Box>
                ) : data.length === 0 ? (
                  <Box sx={centerContainerStyles}>
                    <Typography variant="h5" sx={{ mb: 6 }}>
                      Data not matched yet!
                    </Typography>
                    <Image src='/no-data.svg' alt='No Data' height={400} width={500} />
                    <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
                      Please check back later.
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={1} sx={{ flex: 1 }}>
                    <Grid item xs={12}>
                      <TableContainer
                        component={Paper}
                        sx={{
                          border: '1px solid rgba(235, 235, 235, 1)',
                          maxHeight: '80vh',
                          overflowY: 'auto'
                        }}
                      >
                        <Table sx={{ minWidth: 850 }} aria-label="leads table">
                          <TableHead>
                            <TableRow>
                              <TableCell padding="checkbox" sx={{ borderRight: '1px solid rgba(235, 235, 235, 1)' }}>
                                <Checkbox
                                  indeterminate={selectedRows.size > 0 && selectedRows.size < data.length}
                                  checked={data.length > 0 && selectedRows.size === data.length}
                                  onChange={handleSelectAllClick}
                                  color="primary"
                                />
                              </TableCell>
                              <TableCell sx={leadsStyles.table_column}>Name</TableCell>
                              <TableCell sx={leadsStyles.table_column}>Email</TableCell>
                              <TableCell sx={leadsStyles.table_column}>Phone number</TableCell>
                              <TableCell sx={leadsStyles.table_column}>Visited date</TableCell>
                              <TableCell sx={leadsStyles.table_column}>Visited time</TableCell>
                              <TableCell sx={leadsStyles.table_column}>Lead Funnel</TableCell>
                              <TableCell sx={leadsStyles.table_column}>Status</TableCell>
                              <TableCell sx={leadsStyles.table_column}>Time Spent</TableCell>
                              <TableCell sx={leadsStyles.table_column}>No of Visits</TableCell>
                              <TableCell sx={leadsStyles.table_column}>No of Page Visits</TableCell>
                              <TableCell sx={leadsStyles.table_column}>Age</TableCell>
                              <TableCell sx={leadsStyles.table_column}>Gender</TableCell>
                              <TableCell sx={leadsStyles.table_column}>State</TableCell>
                              <TableCell sx={leadsStyles.table_column}>City</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.map((row) => (
                              <TableRow
                                key={row.id}
                                selected={selectedRows.has(row.id)}
                                onClick={() => handleSelectRow(row.id)}
                              >
                                <TableCell padding="checkbox" sx={{ borderRight: '1px solid rgba(235, 235, 235, 1)' }}>
                                  <Checkbox
                                    checked={selectedRows.has(row.lead.id)}
                                    onChange={() => handleSelectRow(row.lead.id)}
                                    color="primary"
                                  />
                                </TableCell>
                                <TableCell sx={leadsStyles.table_array}>{row.lead.first_name} {row.lead.last_name}</TableCell>
                                <TableCell sx={leadsStyles.table_array}>{row.lead.business_email || 'N/A'}</TableCell>
                                <TableCell sx={leadsStyles.table_array_phone}>{row.lead.mobile_phone || 'N/A'}</TableCell>
                                <TableCell sx={leadsStyles.table_array}>{row.last_visited_date || 'N/A'}</TableCell>
                                <TableCell sx={leadsStyles.table_array}>{row.last_visited_time || 'N/A'}</TableCell>
                                <TableCell sx={leadsStyles.table_array_status} style={getStatusStyle(row.funnel)}>
                                  {row.funnel || 'N/A'}
                                </TableCell>
                                <TableCell sx={leadsStyles.table_array}>{row.status || 'N/A'}</TableCell>
                                <TableCell sx={leadsStyles.table_array}>{row.lead.time_spent || 'N/A'}</TableCell>
                                <TableCell sx={leadsStyles.table_array}>{row.lead.no_of_visits || 'N/A'}</TableCell>
                                <TableCell sx={leadsStyles.table_array}>{row.lead.no_of_page_visits || 'N/A'}</TableCell>
                                <TableCell sx={leadsStyles.table_array}>
                                  {row.lead.age_min && row.lead.age_max ? `${row.lead.age_min} - ${row.lead.age_max}` : 'N/A'}
                                </TableCell>
                                <TableCell sx={leadsStyles.table_array}>{row.lead.gender || 'N/A'}</TableCell>
                                <TableCell sx={leadsStyles.table_array}>{row.state || 'N/A'}</TableCell>
                                <TableCell sx={leadsStyles.table_array}>{row.city || 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <CustomTablePagination
                        count={count_leads ?? 0}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                      />
                    </Grid>
                  </Grid>
                )}
                {showSlider && <Slider />}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </>
  );
};

const LeadsPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SliderProvider>
        <Leads />
      </SliderProvider>
    </Suspense>
  );
};

export default LeadsPage;
