"use client";
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
import { datasyncStyle } from "./datasyncStyle";
import CustomTooltip from "@/components/customToolTip";
import FilterListIcon from "@mui/icons-material/FilterList";
import Image from "next/image";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ConnectKlaviyo from '@/components/ConnectKlaviyo';
import ConnectMeta from '@/components/ConnectMeta';
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { leadsStyles } from "../leads/leadsStyles";
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from "@/components/ToastNotification";
import axios, { AxiosError } from "axios";
import DataSyncList from "@/components/DataSyncList";
import { useRouter } from "next/navigation";

const centerContainerStyles = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  border: '1px solid rgba(235, 235, 235, 1)',
  borderRadius: 2,
  padding: 3,
  boxSizing: 'border-box',
  width: '100%',
  textAlign: 'center',
  flex: 1,
  '& img': {
      width: 'auto',
      height: 'auto',
      maxWidth: '100%'
  }
};
import FilterDatasync from "@/components/FilterDatasync";

interface DataSyncProps {
  service_name?: string
}

const DataSync = () => {
  const router = useRouter();
  const [order, setOrder] = useState<"asc" | "desc" | undefined>(undefined);
  const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
  const [data, setData] = useState<any[]>([]);
  const [klaviyoIconPopupOpen, setKlaviyoIconPopupOpen] = useState(false);
  const [metaIconPopupOpen, setMetaIconPopupOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [rowsPerPageOptions, setRowsPerPageOptions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterPopup, setFilterPopup] = useState(false)
  const [filters, setFilters] = useState<any>()
  const handleFilterPopupOpen = () => {
    setFilterPopup(true)
  }

  const handleFilterPopupClose = () => {
    setFilterPopup(false)
  }

  const onApply = (filter: any) => {
    setFilters(filter)
  }

  const handleSortRequest = (property: string) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  useEffect(() => {
    handleIntegrationsSync()
}, []);

  const handleIntegrationsSync = async () => {
    try {
      setIsLoading(true)
      let params = null
      const response = await axiosInstance.get('/data-sync/sync', {
        params: params
      });
      const { count } = response.data.length;

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
            setRowsPerPageOptions(newRowsPerPageOptions); // Update the options
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 403) {
          if (error.response.data.status === 'NEED_BOOK_CALL') {
              sessionStorage.setItem('is_slider_opened', 'true');
          } else if (error.response.data.status === 'PIXEL_INSTALLATION_NEEDED') {
              setStatus(error.response.data.status);
          }
      } else {
          console.error('Error fetching data:', error);
      }
    }
    finally {
      setIsLoading(false)
    }
  };



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
      default:
        return null;
    }
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

      setSelectedId(null);
      handleClose();
    }
  };

  const handleKlaviyoIconPopupClose = async () => {
    setKlaviyoIconPopupOpen(false);
    setSelectedId(null);
    try {
      const response = await axiosInstance.get(`/data-sync/sync?integrations_users_sync_id=${selectedId}`);
      if (response) {
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
      if (response) {
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

  const handleEdit = async () => {
    const foundItem = data.find(item => item.id === selectedId);
    const dataSyncPlatform = foundItem ? foundItem.platform : null;
    if (dataSyncPlatform) {
      if (dataSyncPlatform === 'klaviyo') {
        setKlaviyoIconPopupOpen(true);
      } else if (dataSyncPlatform === 'meta') {
        setMetaIconPopupOpen(true);
      }
      setAnchorEl(null);
    }
  };

  const handleDelete = async () => {
    try {

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

      setSelectedId(null);
      handleClose();
    }
  };

  const handleRepairSync = () => {
    console.log(`Repairing sync for id: ${selectedId}`);
    handleClose();
  };


  const formatFunnelText = (text: boolean) => {
    if (text === true) {
      return 'Enable';
    }
    if (text === false) {
      return 'Disable';
    }
  };

  const installPixel = () => {
    router.push('/dashboard');
  };

  const handleChangePage = (_: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when changing rows per page
  };

  if (isLoading) {
    return <CustomizedProgressBar />;
  }

  return (
    <>
    <Box sx={datasyncStyle.mainContent}>
        <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          mt: 2,
          ml: 1,
          pr: 1.5,
          "@media (max-width: 600px)": {
            flexDirection: "column",
            display: "flex",
            alignItems: "flex-start",
          },
          "@media (max-width: 440px)": {
            flexDirection: "column",
            pt: 8,
            justifyContent: "flex-start",
          },
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 1,
            "@media (max-width: 600px)": { mb: 2 },
          }}
        >
          <Typography
            className="first-sub-title"
            sx={{
              fontFamily: "Nunito Sans",
              fontSize: "16px",
              lineHeight: "normal",
              fontWeight: 600,
              color: "#202124",
            }}
          >
            Data Sync
          </Typography>
          <CustomTooltip
            title={"how data synch works and to customise your sync settings."}
            linkText="Learn more"
            linkUrl="https://maximiz.ai"
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "15px",
            "@media (max-width: 900px)": {
              gap: "8px",
            },
          }}
        >
          <Button
            // onClick={handleAudiencePopupOpen}
            aria-haspopup="true"
            disabled={true}
            sx={{
              textTransform: "none",
              //color: status === 'PIXEL_INSTALLATION_NEEDED' ? 'rgba(128, 128, 128, 1)' : 'rgba(80, 82, 178, 1)',
              border: "1px solid rgba(80, 82, 178, 0.4)",
              borderRadius: "4px",
              padding: "9px 16px",
              opacity: "0.4",
              minWidth: "auto",
              "@media (max-width: 900px)": {
                display: "none",
              },
            }}
          >
            <Typography
              sx={{
                fontFamily: "Nunito Sans",
                fontWeight: "normal",
                marginRight: "0.5em",
                padding: 0.2,
                fontSize: "14px !important",
                textAlign: "left",
                opacity: 0.4,
                color: "#5052B2 !important",
              }}
            >
              Prospect
            </Typography>
          </Button>
          <Button
            onClick={handleFilterPopupOpen}
            //aria-controls={dropdownOpen ? 'account-dropdown' : undefined}
            aria-haspopup="true"
            //aria-expanded={dropdownOpen ? 'true' : undefined}
            sx={{
              textTransform: "none",
              //selectedFilters.length > 0 ? 'rgba(80, 82, 178, 1)' :
              color: "rgba(128, 128, 128, 1)",
              //selectedFilters.length > 0 ? '1px solid rgba(80, 82, 178, 1)' :
              border: "1px solid rgba(184, 184, 184, 1)",
              borderRadius: "4px",
              padding: "8px",
              //opacity: status === "PIXEL_INSTALLATION_NEEDED" ? "0.5" : "1",
              minWidth: "auto",
              position: "relative",
              "@media (max-width: 900px)": {
                border: "none",
                padding: 0,
              },
            }}
          >
            <FilterListIcon
              fontSize="medium"
              sx={{
                //selectedFilters.length > 0 ? 'rgba(80, 82, 178, 1)' :
                color: "rgba(128, 128, 128, 1)",
              }}
            />
          </Button>
          <Button
            //onClick={handleFilterPopupOpen}
            //aria-controls={dropdownOpen ? 'account-dropdown' : undefined}
            aria-haspopup="true"
            //aria-expanded={dropdownOpen ? 'true' : undefined}
            sx={{
              textTransform: "none",
              //color: selectedFilters.length > 0 ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)',
              border: "1px solid rgba(80, 82, 178, 1)",
              borderRadius: "4px",
              padding: "10px",
              //opacity: status === "PIXEL_INSTALLATION_NEEDED" ? "0.5" : "1",
              minWidth: "auto",
              position: "relative",
              "@media (max-width: 900px)": {
                border: "none",
                padding: 0,
              },
            }}
          >
            <Image src="/plane.svg" alt="plane" height={20} width={20} />
          </Button>
        </Box>
      </Box>
      <Box sx={{ width: "100%", pl: 0.5, pt: 3, pr: 1 }}>
      {status === 'PIXEL_INSTALLATION_NEEDED' && !isLoading ? (
            <Box sx={centerContainerStyles} >
              <Typography variant="h5" className='first-sub-title' sx={{
                mb: 3,
                fontFamily: "Nunito Sans",
                fontSize: "20px",
                color: "#4a4a4a",
                fontWeight: "600",
                lineHeight: "28px"
              }}>
                Pixel Integration isn&apos;t completed yet!
              </Typography>
              <Image src='/pixel_installation_needed.svg' alt='Need Pixel Install'
                height={250} width={300} />
              <Typography variant="body1" className='table-data' sx={{
                mt: 3,
                fontFamily: "Nunito Sans",
                fontSize: "14px",
                color: "#808080",
                fontWeight: "600",
                lineHeight: "20px"
              }}>
                Install the pixel to unlock and gain valuable insights! Start viewing your leads now
              </Typography>
              <Button
                variant="contained"
                onClick={installPixel}
                className='second-sub-title'
                sx={{
                  backgroundColor: 'rgba(80, 82, 178, 1)',
                  textTransform: 'none',
                  padding: '10px 24px',
                  mt: 3,
                  color: '#fff !important',
                  ':hover': {
                    backgroundColor: 'rgba(80, 82, 178, 1)'
                  }
                }}
              >
                Setup Pixel
              </Button>
            </Box>
          ) : !isLoading && (
            <>
            <DataSyncList service_name={null} filters={filters}/>
            </>)
          }
      </Box>
    </Box>
    <FilterDatasync open={filterPopup} onClose={handleFilterPopupClose} onApply={onApply}/>

      </>

  );
};

const DatasyncPage: React.FC = () => {
  return <DataSync />;
};

export default DatasyncPage;
