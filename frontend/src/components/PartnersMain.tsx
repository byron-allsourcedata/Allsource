import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, TextField, Button, List, ListItemText, ListItemButton, IconButton, Tabs, Tab, 
    InputAdornment, Popover, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { styled } from '@mui/material/styles';
import Switch, { SwitchProps } from '@mui/material/Switch';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import FormControlLabel from '@mui/material/FormControlLabel';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { suppressionsStyles } from "@/css/suppressions";
import dayjs from "dayjs";
import CustomTablePagination from "./CustomTablePagination";
import { useUser } from '@/context/UserContext';
import Image from "next/image";
import CalendarPopup from "./CustomCalendar";
import { DateRangeIcon } from "@mui/x-date-pickers/icons";
import SwapVertIcon from '@mui/icons-material/SwapVert';
import SearchIcon from '@mui/icons-material/Search';
import InvitePartnerPopup from "@/components/InvitePartnerPopup"
import EnablePartnerPopup from "@/components/EnablePartnerPopup"
import { showErrorToast, showToast } from '@/components/ToastNotification';
import PartnersAccounts from "./PartnersAccounts";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface PartnerData {
    id: number;
    partner_name: string;
    email: string;
    join_date: Date | string;
    commission: string;
    subscription: string;
    sources: string;
    last_payment_date: string;
    status: string;
    count: number;
    reward_payout_date: string;
    reward_status: string;
    reward_amount: string;
}

const getStatusStyle = (status: string) => {
    switch (status) {
        case 'Active':
            return {
                background: 'rgba(234, 248, 221, 1)',
                color: 'rgba(43, 91, 0, 1)',
            };
        case 'Inactive':
            return {
                background: 'rgba(236, 236, 236, 1)',
                color: 'rgba(74, 74, 74, 1)',
            };
        case 'Signup':
            return {
                background: 'rgba(241, 241, 249, 1)',
                color: 'rgba(80, 82, 178, 1)',
            };
        case 'Invitation sent':
            return {
                background: 'rgba(235, 243, 254, 1)',
                color: 'rgba(20, 110, 246, 1)',
            };
        default:
            return {
                background: 'transparent',
                color: 'inherit',
            };
    }
};

interface PartnersProps {
    setLoading: any;
    appliedDates: { start: Date | null; end: Date | null };
    masterId: number;
}

interface PartnerState {
    id: number
    isActive: boolean;
}

interface NewPartner {
    id: number, 
    email: string,
    fullName: string, 
    companyName: string,
    commission: string
}

interface EnabledPartner {
    id: number, 
    fullName?: string
}
  
  

type CombinedPartnerData = NewPartner & EnabledPartner;


const PartnersMain: React.FC<PartnersProps> = ({setLoading, masterId, appliedDates}) => {
    const [partners, setPartners] = useState<PartnerData[]>([]);
    const [partnerStates, setPartnerStates] = useState<PartnerState[]>([])
    const [page, setPage] = useState(0);
    const { email } = useUser();
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [order, setOrder] = useState<'asc' | 'desc' | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [formPopupOpen, setFormPopupOpen] = useState(false);
    const [noticePopupOpen, setNoticePopupOpen] = useState(false);
    const [fileData, setFileData] = useState<NewPartner>({id: 0, email: "", fullName: "", companyName: "", commission: ""});
    const [enabledData, setEnabledData] = useState<EnabledPartner>({id: 0});
    const [selectedRowData, setSelectedRowData] = useState<any>(null);
    const [errorResponse, setErrosResponse] = useState(false);

    const tableHeaders = [
        { key: 'partner_name', label: `Account name`, sortable: false },
        { key: 'email', label: 'Email', sortable: false },
        { key: 'join_date', label: 'Join date', sortable: true },
        { key: 'count', label: 'No.of accounts', sortable: false },
        { key: 'commission', label: 'Commission %', sortable: false },
        { key: 'reward_amount', label: 'Reward amount', sortable: false },
        { key: 'reward_status', label: 'Reward Status', sortable: false },
        { key: 'reward_payout_date', label: 'Reward payout date', sortable: false },
        { key: 'last_payment_date', label: 'Last payment date', sortable: true },
        { key: 'account_status', label: 'Account status', sortable: false },
        { key: 'status', label: 'Status', sortable: false },
        { key: 'actions', label: 'Actions', sortable: false },
    ];

    const handleOpenMenu = (event: any, rowData: any) => {
        setMenuAnchor(event.currentTarget);
        setSelectedRowData(rowData);
        setFileData({...rowData, fullName: rowData.partner_name, companyName: rowData.sources})
        handleFormOpenPopup()
    };

    const open = Boolean(menuAnchor);
    const allowedRowsPerPage = [10, 25, 50, 100];


    const handlePageChange = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setPage(newPage);
    };

    const fetchRules = useCallback(async () => {
        setLoading(true)

        try {
            const response = await axiosInstance.get(`/partners/partners`, { 
                params: {
                    email: encodeURIComponent(email ? email : ''),
                    start_date: appliedDates.start ? appliedDates.start.toLocaleDateString('en-CA') : null,
                    end_date: appliedDates.end ? appliedDates.end.toLocaleDateString('en-CA') : null,
                    page, rowsPerPage
                }});
            if(response.status === 200 && response.data.totalCount > 0) {
                setPartners([...response.data.items])
                setTotalCount(response.data.totalCount)  
                setPartnerStates(
                    response.data.items.map((partner: any) => ({
                      id: partner.id,
                      isActive: partner.status === "Active",
                    }))
                  );
            }
        } catch {
        } finally {
            setLoading(false)
        }
    }, [page, rowsPerPage, appliedDates, email]);

    useEffect(() => {
        fetchRules()
    }, [page, rowsPerPage, appliedDates]); 


    const handleRowsPerPageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setRowsPerPage(parseInt(event.target.value as string, 10));
        setPage(0);
    };

    const handleSortRequest = (key: string) => {
        const isAsc = orderBy === key && order === 'asc';
        const newOrder = isAsc ? 'desc' : 'asc';
        setOrder(newOrder);
        setOrderBy(key);
    
        const sortedAccounts = [...partners].sort((a, b) => {
            const aValue = a[key as keyof typeof a];
            const bValue = b[key as keyof typeof b];
    
            const isANullOrDash = aValue === null || aValue === '--';
            const isBNullOrDash = bValue === null || bValue === '--';
    
            if (isANullOrDash && !isBNullOrDash) return newOrder === 'asc' ? 1 : -1;
            if (isBNullOrDash && !isANullOrDash) return newOrder === 'asc' ? -1 : 1;
    
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return newOrder === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
    
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return newOrder === 'asc' ? aValue - bValue : bValue - aValue;
            }
    
            return 0;
        });
    
        setPartners(sortedAccounts);
    };

    const handleNoticeOpenPopup = () => {
        setNoticePopupOpen(true)
    }

    const handleNoticeClosePopup = () => {
        setNoticePopupOpen(false)
    }

    const handleFormOpenPopup = () => {
        setFormPopupOpen(true)
    }

    const handleFormClosePopup = () => {
        setFormPopupOpen(false)
    }


    const updateOrAddAsset = (updatedPartner: PartnerData) => {
        setPartners((prevAccounts) => {
            const index = prevAccounts.findIndex((account) => account.id === updatedPartner.id);
            if (index !== -1) {
                const newAccounts = [...prevAccounts];
                newAccounts[index] = updatedPartner;
                return newAccounts;
            }
            return [...prevAccounts, updatedPartner];
        });
    };

    const removePartnerById = (id: number) => {
        setPartners((prevAccounts) =>
            prevAccounts.filter((item) => item.id !== id)
        );
    };


    const Toggle: React.FC<{isActive: boolean; onToggle: () => void}> = ({ isActive, onToggle  }) => {
        return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: 70,
                height: 24,
                backgroundColor: isActive ? "rgba(80, 82, 178, 1)" : "rgba(123, 123, 123, 1)",
                borderRadius: "20px",
                cursor: "pointer",
                position: "relative",
                transition: "0.3s ease",
                padding: "0 5px",
                userSelect: "none",
              }}
              onClick={onToggle}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: "white",
                  borderRadius: "50%",
                  position: "absolute",
                  left: isActive ? "48px" : "2px",
                  transition: "left 0.3s ease",
                }}
              />
              <Typography
                sx={{
                  fontFamily: "Roboto",
                  fontSize: 12,
                  lineHeight: "16.8px",
                  color: "white",
                  position: "absolute",
                  top: "50%",
                  left: isActive ? "25%" : "49%",
                  right: isActive ? "49%" : "25%",
                  transform: "translate(-50%, -50%)",
                  transition: "0.3s ease",
                }}
              >
                {isActive ? "Active" : "Inactive"}
              </Typography>
            </Box>
          );
      };

    
    const handleStatusChange = async (id: number) => {
        setLoading(true);
        const partnerIndex = partnerStates.findIndex((p: any) => p.id === id);
        const newPartnerStates = [...partnerStates];
        const isCurrentlyActive = newPartnerStates[partnerIndex].isActive;

        newPartnerStates[partnerIndex].isActive = !isCurrentlyActive;
        setPartnerStates(newPartnerStates);

        const newStatus = !isCurrentlyActive ? "Active" : "Inactive";
    
        try {
            const response = await axiosInstance.put(`partners/${id}/`, {status: newStatus, message: newStatus=="Active" ? "Your account active again" : "Your account has become inactive!" }, {
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.status === 200) {
                updateOrAddAsset(response.data);
                showToast("Partner status successfully updated!");
            }
        } catch {
            showErrorToast("Failed to update status. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: "24px", justifyContent: 'space-between' }}>
            <Box sx={{
                backgroundColor: '#fff',
                width: '100%',
                padding: 0,
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '77vh',
                '@media (max-width: 600px)': {margin: '0rem auto 0rem'}
            }}>
                <Box>
                    <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mb: 6, alignItems: 'center', gap: 2 }}>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
                                                    paddingLeft: "16px", 
                                                    cursor: sortable ? 'pointer' : 'default',
                                                    ...(key === 'partner_name' && { 
                                                        position: 'sticky',
                                                        left: 0,
                                                        zIndex: 99,
                                                        backgroundColor: '#fff',
                                                        
                                                    })}}
                                                onClick={sortable ? () => handleSortRequest(key) : undefined}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center' }} style={key === "status" || key === "actions" ? { justifyContent: "center" } : {}}>
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
                                <TableBody>
                                        {partners.map((data) => {
                                            const isActive = partnerStates.find((p: any) => p.id === data.id)?.isActive;
                                            return (
                                            <TableRow key={data.id} sx={{
                                                ...suppressionsStyles.tableBodyRow,
                                                '&:hover': {
                                                    backgroundColor: '#F7F7F7',
                                                    '& .sticky-cell': {
                                                        backgroundColor: '#F7F7F7',
                                                    }
                                                },
                                            }}>
                                                <TableCell className='sticky-cell table-data' 
                                                    sx={{
                                                        ...suppressionsStyles.tableBodyColumn, 
                                                        paddingLeft: "16px",
                                                        position: 'sticky',
                                                        left: 0,
                                                        zIndex: 1, 
                                                        background: "#fff"}}
                                                    >
                                                    <Box sx={{display: "flex", alignItems: "center", justifyContent: "space-between", color: 'rgba(80, 82, 178, 1)'}}>
                                                        {data.partner_name}
                                                        <IconButton
                                                            className="icon-button"
                                                            sx={{ display: 'none', ':hover': {backgroundColor: "transparent"}}} >
                                                            <Image src='/outband.svg' alt="outband" width={15.98} height={16}/>
                                                        </IconButton>
                                                    </Box>
                                                </TableCell>

                                                <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                    {data.email}
                                                </TableCell>

                                                <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                    {dayjs(data.join_date).isValid() ? dayjs(data.join_date).format('MMM D, YYYY') : '--'}
                                                </TableCell>

                                                <TableCell className='table-data'sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                    {data.count}
                                                </TableCell>

                                                <TableCell className='table-data'sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                    {data.commission}
                                                </TableCell>

                                                <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                    {data.reward_amount ?? '--'}
                                                </TableCell>

                                                <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                    {data.reward_status ?? '--'}
                                                </TableCell>

                                                <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                    {dayjs(data.reward_payout_date).isValid() ? dayjs(data.reward_payout_date).format('MMM D, YYYY') : '--'}
                                                </TableCell>

                                                <TableCell className='table-data' sx={{...suppressionsStyles.tableBodyColumn, paddingLeft: "16px"}}>
                                                    {dayjs(data.last_payment_date).isValid() ? dayjs(data.last_payment_date).format('MMM D, YYYY') : '--'}
                                                </TableCell>

                                                <TableCell sx={{ ...suppressionsStyles.tableBodyColumn, paddingLeft: "16px", textAlign: 'center' }}>
                                                    <Toggle isActive={isActive || false} onToggle={() => handleStatusChange(data.id)} />
                                                </TableCell>

                                                <TableCell sx={{ ...suppressionsStyles.tableBodyColumn, paddingLeft: "16px", textAlign: 'center' }}>
                                                    <Box sx={{display: "flex", justifyContent: "center"}}>
                                                        <Typography component="div" sx={{
                                                            width: "100px",
                                                            margin: 0,
                                                            background: getStatusStyle(data.status).background,
                                                            padding: '3px 8px',
                                                            borderRadius: '2px',
                                                            fontFamily: 'Roboto',
                                                            fontSize: '12px',
                                                            fontWeight: '400',
                                                            lineHeight: '16px',
                                                            color: getStatusStyle(data.status).color,
                                                        }}>
                                                            {data.status}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ ...suppressionsStyles.tableBodyColumn, paddingLeft: "16px", textAlign: 'center' }}>
                                                    <IconButton onClick={(event) => handleOpenMenu(event, data)} sx={{ ':hover': { backgroundColor: 'transparent', }}} >
                                                        <Image src='/edit-partner.svg' alt='edit' height={16.18} width={22.91} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        )})}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {errorResponse && (
                                <Box sx={suppressionsStyles.centerContainerStyles}>
                                    <Typography variant="h5" sx={{
                                        mb: 3,
                                        fontFamily: 'Nunito Sans',
                                        fontSize: "20px",
                                        color: "#4a4a4a",
                                        fontWeight: "600",
                                        lineHeight: "28px"
                                    }}>
                                        Data not matched yet!
                                    </Typography>
                                    <Image src='/no-data.svg' alt='No Data' height={250} width={300} />
                                    <Typography variant="body1" color="textSecondary"
                                        sx={{
                                            mt: 3,
                                            fontFamily: 'Nunito Sans',
                                            fontSize: "14px",
                                            color: "#808080",
                                            fontWeight: "600",
                                            lineHeight: "20px"
                                        }}>
                                        No Invitee joined from the referreal link.
                                    </Typography>
                                </Box>
                                )}
                    </Box>
                    <InvitePartnerPopup
                        masterId={masterId}
                        updateOrAddAsset={updateOrAddAsset}
                        fileData={fileData} 
                        open={formPopupOpen} 
                        onClose={handleFormClosePopup}  />
                    <EnablePartnerPopup 
                        updateOrAddAsset={updateOrAddAsset}
                        removePartnerById={removePartnerById}
                        enabledData={enabledData} 
                        open={noticePopupOpen} 
                        onClose={handleNoticeClosePopup}  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'end' }}>
                    <CustomTablePagination
                        count={totalCount}
                        page={page}
                        rowsPerPage={allowedRowsPerPage.includes(rowsPerPage) ? rowsPerPage : 10}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                    />
                </Box>
                
            </Box>
        </Box>
    );
};

export default PartnersMain;