import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Popover,
    Tooltip,
  } from "@mui/material";
  import React, { useState, useEffect } from "react";
  import Image from "next/image";
  import CheckCircleIcon from "@mui/icons-material/CheckCircle";
  import CustomizedProgressBar from '@/components/CustomizedProgressBar';
  import axiosInstance from '../axios/axiosInterceptorInstance';
  import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
  import ConnectKlaviyo from '@/components/ConnectKlaviyo';
  import ConnectMeta from '@/components/ConnectMeta';
  import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
  import { leadsStyles } from "@/app/leads/leadsStyles";
  import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
  import { showErrorToast, showToast } from "@/components/ToastNotification";
  import axios from "axios";
import { datasyncStyle } from "@/app/data-sync/datasyncStyle";
import MailchimpDatasync from "./MailchimpDatasync";
import OmnisendDataSync from "./OmnisendDataSync";
import CustomTablePagination from "./CustomTablePagination";
  
  interface DataSyncProps {
    service_name?: string | null
  } 
  
  const DataSyncList = ({service_name}: DataSyncProps) => {
    const [order, setOrder] = useState<"asc" | "desc" | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [klaviyoIconPopupOpen, setKlaviyoIconPopupOpen] = useState(false);
    const [metaIconPopupOpen, setMetaIconPopupOpen] = useState(false);
    const [mailchimpIconPopupOpen, setMailchimpIconPopupOpen] = useState(false)
    const [omnisendIconPopupOpen, setOmnisendIconPopupOpen] = useState(false)
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [rowsPerPageOptions, setRowsPerPageOptions] = useState<number[]>([]);
    const handleSortRequest = (property: string) => {
      const isAsc = orderBy === property && order === "asc";
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(property);
    };
  
    const handleIntegrationsSync = async () => {
      try {
        setIsLoading(true)
        let params = null 
        if (service_name) {
          params = {
            service_name: service_name
          }
        }
        const response = await axiosInstance.get('/data-sync/sync', {
          params: params
        });
        const { length: count } = response.data;
        setData(response.data);
        setTotalRows(count);
      let newRowsPerPageOptions: number[] = []; 
            if (count <= 10) {
                newRowsPerPageOptions = [5, 10]; 
            } else if (count <= 50) {
                newRowsPerPageOptions = [10, 20]; 
            } else if (count <= 100) {
                newRowsPerPageOptions = [10, 20, 50]; 
            } else if (count <= 300) {
                newRowsPerPageOptions = [10, 20, 50, 100]; 
            } else if (count <= 500) {
                newRowsPerPageOptions = [10, 20, 50, 100, 300]; 
            } else {
                newRowsPerPageOptions = [10, 20, 50, 100, 300, 500]; 
            }
            if (!newRowsPerPageOptions.includes(count)) {
                newRowsPerPageOptions.push(count);
                newRowsPerPageOptions.sort((a, b) => a - b);
            }
            setRowsPerPageOptions(newRowsPerPageOptions);
      } catch (error) {
      }
      finally {
        setIsLoading(false)
      }
    };
  
    useEffect(() => {
      handleIntegrationsSync();
    }, [service_name]);
  
    const statusIcon = (status: string) => {
      switch (status) {
        case "success":
          return <CheckCircleIcon sx={{ color: "green", fontSize: "16px" }} />;
        case "error":
          return (
            <Tooltip
              title={"Please choose repair sync in action section."}
              placement='bottom-end'
              componentsProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "rgba(217, 217, 217, 1)",
                    color: "rgba(128, 128, 128, 1)",
                    fontFamily: "Roboto",
                    fontWeight: "400",
                    fontSize: "10px",
                    boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.12)",
                    border: "0.2px solid rgba(240, 240, 240, 1)",
                    borderRadius: "4px",
                    maxWidth: "100%",
                    padding: "8px 10px",
                  },
                },
              }}
            >
              <Image
                src={"/danger-icon.svg"}
                alt="klaviyo"
                width={16}
                height={16}
              />
            </Tooltip>
          );
        default:
          return null;
      }
    };
  
    const platformIcon = (platform: string) => {
      switch (platform) {
        case "klaviyo":
          return (
            <Image src={"/klaviyo.svg"} alt="klaviyo" width={18} height={18} />
          );
        case "meta":
          return (
            <Image src={"/meta-icon.svg"} alt="klaviyo" width={18} height={18} />
          );
        case 'omnisend':
           return (
           <Image src={'/omnisend_icon_black.svg'} alt='omnisend' width={18} height={18} />
          )
        case 'mailchimp':
           return (
           <Image src={'/mailchimp-icon.svg'} alt='mailchimp' width={18} height={18} />
          )
        default:
          return null;
      }
    };
    const handleChangePage = (_: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
      setPage(newPage);
    };
  
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    };
  
    // Action
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
  
    const handleClick = (event: any, id: number) => {
      setAnchorEl(event.currentTarget);
      setSelectedId(id);
    };
  
    const handleClose = () => {
      setAnchorEl(null);
      setSelectedId(null);
    };
  
    const open = Boolean(anchorEl);
    const id = open ? "simple-popover" : undefined;
  
    const handleToggleSync = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInterceptorInstance.post(`/data-sync/sync/switch-toggle`, {
          list_id: String(selectedId)
        });
        if (response.status === 200) {
          switch (response.data.status) {
            case 'SUCCESS':
              showToast('successfully');
              setData(prevData =>
                prevData.map(item =>
                  item.id === selectedId ? { ...item, dataSync: response.data.data_sync } : item
                )
              );
              break
            case 'FAILED':
              showErrorToast('Integrations sync delete failed');
              break
            default:
              showErrorToast('Unknown response received.');
          }
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response && error.response.status === 403) {
            showErrorToast('Access denied: You do not have permission to remove this member.');
          } else {
            console.error('Error removing team member:', error);
          }
        }
      } finally {
        setIsLoading(false);
        setSelectedId(null);
        handleClose();
      }
    };
  
    const handleKlaviyoIconPopupClose = async () => {
      setKlaviyoIconPopupOpen(false);
      setSelectedId(null);
      try {
        const response = await axiosInstance.get(`/data-sync/sync?integrations_users_sync_id=${selectedId}`);
        if (response){
          setData(prevData => 
            prevData.map(item => 
                item.id === selectedId ? { ...item, ...response.data } : item
            )
        );      
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
      }
    };
  
    const handleMetaIconPopupClose = async () => {
      setMetaIconPopupOpen(false);
      setSelectedId(null);
      try {
        const response = await axiosInstance.get(`/data-sync/sync?integrations_users_sync_id=${selectedId}`);
        if (response){
          setData(prevData => 
            prevData.map(item => 
                item.id === selectedId ? { ...item, ...response.data } : item
            )
        );      
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
      }
    };

    const handleMailchimpIconPopupClose = async() => {
      setMailchimpIconPopupOpen(false);
      setSelectedId(null);
      try {
        const response = await axiosInstance.get(`/data-sync/sync?integrations_users_sync_id=${selectedId}`);
        if (response){
          setData(prevData => 
            prevData.map(item => 
                item.id === selectedId ? { ...item, ...response.data } : item
            )
        );      
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
      }
    }

    const handleOmnisendIconPopupClose = async() => {
      setOmnisendIconPopupOpen(false);
      setSelectedId(null);
      try {
        const response = await axiosInstance.get(`/data-sync/sync?integrations_users_sync_id=${selectedId}`);
        if (response){
          setData(prevData => 
            prevData.map(item => 
                item.id === selectedId ? { ...item, ...response.data } : item
            )
        );      
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
      }
    }
  
    const handleEdit = async () => {
      const foundItem = data.find(item => item.id === selectedId);
      const dataSyncPlatform = foundItem ? foundItem.platform : null;
      if (dataSyncPlatform) {
          if (dataSyncPlatform === 'klaviyo') {
            setKlaviyoIconPopupOpen(true);
          } else if (dataSyncPlatform === 'meta') {
            setMetaIconPopupOpen(true);
          } else if (dataSyncPlatform === 'mailchimp') {
            setMailchimpIconPopupOpen(true);
          } else if (dataSyncPlatform === 'omnisend') {
            setOmnisendIconPopupOpen(true);
          }
          setIsLoading(false);
          setAnchorEl(null);
        }
      };
  
  
  
    const handleDelete = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInterceptorInstance.delete(`/data-sync/sync`, {
          params: {
            list_id: selectedId
          }
        });
  
        if (response.status === 200) {
          switch (response.data.status) {
            case 'SUCCESS':
              showToast('Integrations sync delete successfully');
              setData(prevData => prevData.filter(item => item.id !== selectedId));
              break
            case 'FAILED':
              showErrorToast('Integrations sync delete failed');
              break
            default:
              showErrorToast('Unknown response received.');
          }
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response && error.response.status === 403) {
            showErrorToast('Access denied: You do not have permission to remove this member.');
          } else {
            console.error('Error removing team member:', error);
          }
        }
      } finally {
        setIsLoading(false);
        setSelectedId(null);
        handleClose();
      }
    };
  
    const handleRepairSync = () => {
      console.log(`Repairing sync for id: ${selectedId}`);
      handleClose();
    };
  
    if (isLoading) {
      return <CustomizedProgressBar />;
    }
  
    const formatFunnelText = (text: boolean) => {
      if (text === true) {
        return 'Enable';
      }
      if (text === false) {
        return 'Disable';
      }
    };
  
    if(service_name && data.length < 1) {
      return null
    }
  
    return (
      <Box sx={datasyncStyle.mainContent}>
        <Box sx={{ width: "100%", pl: 0.5, pt: 3, pr: 1 }}>
          <TableContainer
            component={Paper}
            sx={{
              border: "1px solid rgba(235, 235, 235, 1)",
              overflowY: "auto",
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    { key: "list_name", label: "List Name" },
                    { key: "list_type", label: "List Type" },
                    { key: "number_of_contacts", label: "No. of Contacts" },
                    { key: "created_by", label: "Created By" },
                    {
                      key: "created_date",
                      label: "Created Date",
                      sortable: true,
                    },
                    { key: "platform", label: "Platform" },
                    { key: "account_id", label: "Account ID" },
                    { key: "data_sync", label: "Data Sync" },
                    { key: "last_sync", label: "Last Sync" },
                    { key: "sync_status", label: "Sync Status" },
                    { key: "suppression", label: "Suppression" },
                  ].map(({ key, label, sortable = false }) => (
                    <TableCell
                      key={key}
                      sx={{
                        ...datasyncStyle.table_column,
                        position: "relative",
                        ...(key === "list_name" && {
                          position: "sticky",
                          left: 0,
                          zIndex: 99,
                        }),
                        ...(key === "suppression" && {
                          "::after": {
                            content: "none",
                          },
                        }),
                      }}
                      onClick={
                        sortable ? () => handleSortRequest(key) : undefined
                      }
                      style={{ cursor: sortable ? "pointer" : "default" }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography
                          variant="body2"
                          sx={{ ...leadsStyles.table_column, borderRight: "0" }}
                        >
                          {label}
                        </Typography>
                        {sortable && orderBy === key && (
                          <IconButton size="small" sx={{ ml: 1 }}>
                            {order === "asc" ? (
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
                {data.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((row, index) => (
                  <TableRow
                    key={row.id}
                    sx={{
                      "&:hover": {
                        backgroundColor: "rgba(247, 247, 247, 1)",
                        "& .sticky-cell": {
                          backgroundColor: "rgba(247, 247, 247, 1)",
                        },
                      },
                    }}
                  >
                    <TableCell
                      className="sticky-cell"
                      sx={{
                        ...datasyncStyle.table_array,
                        position: "sticky",
                        left: "0",
                        zIndex: 9,
                        backgroundColor: "rgba(255, 255, 255, 1)",
                      }}
                    >
                      {row.name}
                    </TableCell>
                    <TableCell sx={datasyncStyle.table_array}>
                      {row.type}
                    </TableCell>
                    <TableCell sx={datasyncStyle.table_array}>
                      {row.contacts}
                    </TableCell>
                    <TableCell sx={datasyncStyle.table_array}>
                      {row.createdBy}
                    </TableCell>
                    <TableCell sx={datasyncStyle.table_array}>
                      {row.createdDate}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          padding: "2px 8px",
                          borderRadius: "2px",
                          justifyContent: "center",
                          textTransform: "capitalize",
                        }}
                      >
                        {platformIcon(row.platform)}
                      </Box>
                    </TableCell>
                    <TableCell sx={datasyncStyle.table_array}>
                      {row.accountId}
                    </TableCell>
                    <TableCell sx={datasyncStyle.table_array}>
                      <Box
                        sx={{
                          display: "flex",
                          borderRadius: "2px",
                          justifyContent: "start",
                          textTransform: "capitalize",
                        }}
                      >
                        <Typography
                          className="paragraph"
                          sx={{
                            fontFamily: "Roboto",
                            fontSize: "12px",
                            color:
                              row.dataSync === true
                                ? "rgba(43, 91, 0, 1) !important"
                                : "rgba(74, 74, 74, 1)!important",
                            backgroundColor:
                              row.dataSync === true
                                ? "rgba(234, 248, 221, 1) !important"
                                : "rgba(219, 219, 219, 1) !important",
                            padding: "3px 14.5px",
                            maxHeigh: "1.25rem",
                          }}
                        >
                          {formatFunnelText(row.dataSync)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={datasyncStyle.table_array}>
                      {row.lastSync}
                    </TableCell>
                    <TableCell
                      sx={{ ...datasyncStyle.table_column, position: "relative" }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          padding: "2px 8px",
                          borderRadius: "2px",
                          justifyContent: "center",
                        }}
                      >
                        {statusIcon(row.syncStatus)}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ ...datasyncStyle.table_array }}>
                      <Box
                        sx={{
                          display: "flex",
                          padding: "2px 8px",
                          borderRadius: "2px",
                          alignItems: "center",
                          justifyContent: "space-between",
                          textTransform: "capitalize",
                          paddingLeft: 0
                        }}
                      >
                        {row.suppression}
                        <IconButton
                          sx={{ padding: 0, margin: 0, borderRadius: 4, justifyContent: "start" }}
                          onClick={(e) => handleClick(e, row.id)}
                        >
                          <Image
                            src={"more.svg"}
                            alt="more"
                            width={20}
                            height={20}
                          />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
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
                    backgroundColor: "background: rgba(80, 82, 178, 0.1)",
                  },
                }}
                onClick={handleToggleSync}
              >
                {data.find((row) => row.id === selectedId)?.dataSync === true
                  ? "Disable Sync"
                  : "Enable Sync"}
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
                    backgroundColor: "background: rgba(80, 82, 178, 0.1)",
                  },
                }}
                onClick={handleEdit}
              >
                Edit
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
                    backgroundColor: "background: rgba(80, 82, 178, 0.1)",
                  },
                }}
                onClick={handleDelete}
              >
                Delete
              </Button>
              <Button
                sx={{
                  justifyContent: "flex-start",
                  width: "100%",
                  color: "rgba(32, 33, 36, 1)",
                  textTransform: "none",
                  fontFamily: "Nunito Sans",
                  fontSize: "14px",
                  fontWeight: 600,
                  ":hover": {
                    color: "rgba(80, 82, 178, 1)",
                    backgroundColor: "background: rgba(80, 82, 178, 0.1)",
                  },
                }}
                onClick={handleRepairSync}
              >
                Repair Sync
              </Button>
            </Box>
          </Popover>
          {
            totalRows > 10 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
                <CustomTablePagination
                  count={totalRows}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={rowsPerPageOptions} />
              </Box>
            ) 
          }
        </Box>
        <ConnectKlaviyo open={klaviyoIconPopupOpen} onClose={handleKlaviyoIconPopupClose} data={data.find(item => item.id === selectedId)}/>
        <ConnectMeta open={metaIconPopupOpen} onClose={handleMetaIconPopupClose} data={data.find(item => item.id === selectedId)}/>
        <MailchimpDatasync open={mailchimpIconPopupOpen} onClose={handleMailchimpIconPopupClose} data={data.find(item => item.id === selectedId)} />
        <OmnisendDataSync open={omnisendIconPopupOpen} onClose={handleOmnisendIconPopupClose} data={data.find(item => item.id === selectedId)} />
      </Box>
  
    );
  };

export default DataSyncList