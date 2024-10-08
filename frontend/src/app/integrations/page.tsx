'use client';


import React, { useState, useEffect } from "react";
import { integrationsStyle } from "./integrationsStyle";
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { Box, Button, Typography, Tab, TextField, InputAdornment, Popover, IconButton, TableContainer, Table, Paper, TableHead, TableRow, TableCell, TableBody, Tooltip } from "@mui/material";
import Image from "next/image";
import CustomTooltip from "@/components/customToolTip";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import TabList from "@mui/lab/TabList";
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from "axios";
import Slider from '../../components/Slider';
import { SliderProvider } from "@/context/SliderContext";
import MetaConnectButton from "@/components/MetaConnectButton";
import ConnectKlaviyo from "@/components/ConnectKlaviyo";
import KlaviyoIntegrationPopup from "@/components/KlaviyoIntegrationPopup";
import FilterListIcon from "@mui/icons-material/FilterList";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from "@/components/ToastNotification";
import AlivbleIntagrationsSlider from "@/components/AvalibleIntegrationsSlider";
import ShopifySettings from "@/components/ShopifySettings";


interface IntegrationBoxProps {
    image: string;
    handleClick?: () => void;
    service_name: string;
    active?: boolean;
    is_avalible?: boolean
}

interface IntegrationCredentials {
    access_token: string;
    service_name: string;
    shop_domain: string;
    ad_account_id: string;
    is_with_suppresions: boolean;
}

const integrationStyle = {
    tabHeading: {
        fontFamily: 'Nunito Sans',
        fontSize: '14px',
        color: '#707071',
        fontWeight: '500',
        lineHeight: '20px',
        textTransform: 'none',
        cursor: 'pointer',
        padding: 0,
        minWidth: 'auto',
        px: 2,
        '@media (max-width: 600px)': {
            alignItems: 'flex-start',
            p: 0
        },
        '&.Mui-selected': {
            color: '#5052b2',
            fontWeight: '700'
        }
    },
};


const IntegrationBox = ({ image, handleClick, service_name, active, is_avalible }: IntegrationBoxProps) => {

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer'
        }}>
            <Box sx={{
                backgroundColor: active ? 'rgba(80, 82, 178, 0.1)' : 'transparent',
                border: active ? '1px solid #5052B2' : '1px solid #E4E4E4',
                position: 'relative',
                display: 'flex',
                borderRadius: '4px',
                width: '7rem',
                height: '7rem',
                justifyContent: 'center',
                alignItems: 'center',
                transition: '0.2s',
                '&:hover': {
                    boxShadow: '0 0 4px #00000040'
                },
                '&:hover .edit-icon': {
                    opacity: 1
                }
            }}>
                {!is_avalible && (
                    <Box className="edit-icon" onClick={handleClick} sx={{
                        position: 'absolute',
                        top: '5%',
                        right: '5%',
                        opacity: 0,  
                        transition: 'opacity 0.2s',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        width: '2rem', 
                        height: '2rem', 
                        '&:hover': {
                            backgroundColor: '#EDEEF7' 
                        }
                    }}>
                        <Image
                            src={'/pen.svg'}
                            width={12}
                            height={12}
                            alt={'edit'}
                        />
                    </Box>
                )}
                <Image src={image} width={32} height={32} alt={service_name} />
            </Box>
            <Typography mt={0.5} fontSize={'0.9rem'} textAlign={'center'} fontFamily={'Nunito Sans'}>
                {service_name}
            </Typography>
        </Box>
    );
};

const IntegrationAdd = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
        <Box sx={{
            border: '1px dashed #5052B2',
            display: 'flex',
            borderRadius: '4px',
            width: '7rem',
            height: '7rem',
            justifyContent: 'center',
            alignItems: 'center',
            transition: '0.2s',
            '&:hover': { boxShadow: '0 0 4px #00000040' }
        }}>
            <Image src={'/add-square.svg'} width={44} height={44} alt={'add'} />
        </Box>
    </Box>
);

interface IntegrationsListProps {
    integrationsCredentials: IntegrationCredentials[];
    integrations: any[]
    changeTab?: (value: string) => void
}

interface DataSyncIntegrationsProps {
    service_name: string | null
}

const DataSyncIntegration = ({service_name}: DataSyncIntegrationsProps) => {
    const [data, setData] = useState<any[]>([]);
    const [order, setOrder] = useState<"asc" | "desc" | undefined>(undefined);
    const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const handleSortRequest = (property: string) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
        };
    useEffect(() => {
        const fetchData = async() => {
            if(service_name) {
                const response = await axiosInstance.get('/data-sync/sync', {params: {service_name: service_name}})
                if(response.status === 200) { setData(response.data) }
            }
            return null
        }
        fetchData()
    }, [service_name])
    
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
    } }
    const formatFunnelText = (text: boolean) => {
        if (text === true) {
          return 'Enable';
        }
        if (text === false) {
          return 'Disable';
        }
      };
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

    const handleEdit = () => { }
    const handleDelete = () => { }
    const handleRepairSync = () => { }


    return (
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
                      ...integrationsStyle.table_column,
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
                        sx={{ ...integrationsStyle.table_column, borderRight: "0" }}
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
              {data.map((row, index) => (
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
                      ...integrationsStyle.table_array,
                      position: "sticky",
                      left: "0",
                      zIndex: 9,
                      backgroundColor: "rgba(255, 255, 255, 1)",
                    }}
                  >
                    {row.name}
                  </TableCell>
                  <TableCell sx={integrationsStyle.table_array}>
                    {row.type}
                  </TableCell>
                  <TableCell sx={integrationsStyle.table_array}>
                    {row.contacts}
                  </TableCell>
                  <TableCell sx={integrationsStyle.table_array}>
                    {row.createdBy}
                  </TableCell>
                  <TableCell sx={integrationsStyle.table_array}>
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
                  <TableCell sx={integrationsStyle.table_array}>
                    {row.accountId}
                  </TableCell>
                  <TableCell sx={integrationsStyle.table_array}>
                    <Box
                      sx={{
                        display: "flex",
                        padding: "2px 8px",
                        borderRadius: "2px",
                        justifyContent: "center",
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
                  <TableCell sx={integrationsStyle.table_array}>
                    {row.lastSync}
                  </TableCell>
                  <TableCell
                    sx={{ ...integrationsStyle.table_column, position: "relative" }}
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
                  <TableCell sx={{ ...integrationsStyle.table_array }}>
                    <Box
                      sx={{
                        display: "flex",
                        padding: "2px 8px",
                        borderRadius: "2px",
                        alignItems: "center",
                        justifyContent: "space-between",
                        textTransform: "capitalize",
                      }}
                    >
                      {row.suppression}
                      <IconButton
                        sx={{ padding: 0, margin: 0, borderRadius: 4 }}
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
      </Box>
    )
}


const UserIntegrationsList = ({ integrationsCredentials, changeTab = () => { }, integrations }: IntegrationsListProps) => {
    const [activeService, setActiveService] = useState<string | null>(null);
    const [openAvalible, setOpenAvalible] = useState(false)
    const [openKlaviyoConnect, setOpenKlaviyoConnect] = useState(false)
    const [openMetaConnect, setOpenMetaConnect] = useState(false)
    const [openShopifyConnect, setOpenShopifyConnect] = useState(false)
    const handleActive = (service: string) => {
        setActiveService(service);
    };

    const handleClose = () => {
        setOpenKlaviyoConnect(false)
        setOpenMetaConnect(false)
        setOpenShopifyConnect(false)
    }

    const handleOnSave = () => {
        
    }

    return (
        <>
            <Box sx={{ display: 'flex', gap: 2 }}>
            {integrationsCredentials.some(integration => integration.service_name === "Shopify") && (
                <Box onClick={() => handleActive('Shopify')}>
                    <IntegrationBox
                        image="/shopify-icon.svg"
                        service_name="Shopify"
                        active={activeService === 'Shopify'}
                        handleClick={() => setOpenShopifyConnect(true)}
                    />
                </Box>
            )}
            {integrationsCredentials.some(integration => integration.service_name === "Klaviyo") && (
                <Box onClick={() => handleActive('Klaviyo')}>
                    <IntegrationBox
                        image="/klaviyo.svg"
                        service_name="Klaviyo"
                        active={activeService === 'Klaviyo'}
                        handleClick={() => setOpenKlaviyoConnect(true)}
                    />
                </Box>
            )}
            {integrationsCredentials.some(integration => integration.service_name === "Meta") && (
                <Box onClick={() => handleActive('Meta')}>
                    <IntegrationBox
                        image="/meta-icon.svg"
                        service_name="Meta"
                        active={activeService === 'Meta'}
                        handleClick={() => setOpenMetaConnect(true)}
                    />
                </Box>
            )}
            <Box onClick={() => setOpenAvalible(true)}>
                <IntegrationAdd />
            </Box>
        </Box>
        {(activeService && activeService != 'Shopify') && (
            <Box display={"flex"} sx={{alignItems: 'center', mt: 2, }}>
            <Box sx={{backgroundColor: '#E4E4E4', padding: '3px', borderRadius: '50%'}} />
            <Box sx={{backgroundColor: '#E4E4E4', border: '1px dashed #fff', width: '100%'}} />
            <Box sx={{backgroundColor: '#E4E4E4', padding: '3px', borderRadius: '50%'}} />
        </Box>)}
        <KlaviyoIntegrationPopup 
            open={openKlaviyoConnect} 
            handleClose={handleClose}
            onSave={handleOnSave}  
            initApiKey={integrationsCredentials?.find(integration => integration.service_name === 'Klaviyo')?.access_token}
        />
        <MetaConnectButton 
            open={openMetaConnect} 
            onClose={handleClose} 
            initAdId={integrationsCredentials?.find(integration => integration.service_name === 'Meta')?.ad_account_id} 
        />
        <AlivbleIntagrationsSlider 
            isContactSync={false} 
            open={openAvalible} 
            onClose={() => setOpenAvalible(false)} 
            integrations={integrations} 
            integrationsCredentials={integrationsCredentials} 
        />
        <KlaviyoIntegrationPopup 
            open={openKlaviyoConnect} 
            handleClose={handleClose}
            onSave={handleOnSave}  
            initApiKey={integrationsCredentials?.find(integration => integration.service_name === 'Klaviyo')?.access_token}
        />
        <MetaConnectButton 
            open={openMetaConnect} 
            onClose={handleClose} 
            initAdId={integrationsCredentials?.find(integration => integration.service_name === 'Meta')?.ad_account_id} 
        />
        <ShopifySettings 
            open={openShopifyConnect} 
            handleClose={handleClose}
            onSave={handleOnSave}  
            initApiKey={integrationsCredentials?.find(integration => integration.service_name === 'Shopify')?.access_token}
        />
        <AlivbleIntagrationsSlider 
            isContactSync={false} 
            open={openAvalible} 
            onClose={() => setOpenAvalible(false)} 
            integrations={integrations} 
            integrationsCredentials={integrationsCredentials} 
        />
        <Box>
            {(activeService && activeService != 'Shopify') && (<DataSyncIntegration service_name={activeService} />)}
        </Box>
        </>
    );
};


const IntegrationsAvailable = ({ integrationsCredentials: integrations }: IntegrationsListProps) => {
    const [search, setSearch] = useState<string>('');
    const [openMetaConnect, setOpenMetaConnect] = useState(false)
    const [openKlaviyoConnect, setOpenKlaviyoConnect] = useState(false)
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value);
    };

    const integrationsAvailable = [
        { image: 'shopify-icon.svg', service_name: 'Shopify' },
        { image: 'klaviyo.svg', service_name: 'Klaviyo' },
        { image: 'meta-icon.svg', service_name: 'Meta' },
    ];

    const filteredIntegrations = integrationsAvailable.filter(
        (integrationAvailable) =>
            integrationAvailable.service_name.toLowerCase().includes(search.toLowerCase()) &&
            !integrations.some(integration => integration.service_name === integrationAvailable.service_name)
    );

    const handleClose = () => {
        setOpenMetaConnect(false)
        setOpenKlaviyoConnect(false)
    }

    const handleOnSave = () => {}
    return (
        <Box>
            <Box sx={{ width: '40%', }}>
                <TextField
                    fullWidth
                    placeholder="Search integrations"
                    value={search}
                    onChange={handleSearch}
                    id="outlined-start-adornment"
                    sx={{ mb: 3.75}}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Image src="/ic_round-search.svg" width={24} height={24} alt="search" />
                            </InputAdornment>
                        ),
                    }}
                    variant="outlined"
                />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
                {filteredIntegrations.map((integrationAvailable) => (
                    <Box key={integrationAvailable.service_name}
                    onClick={() => {
                        if (integrationAvailable.service_name === 'Meta') {
                            setOpenMetaConnect(true);
                        } else if (integrationAvailable.service_name === 'Klaviyo') {
                            setOpenKlaviyoConnect(true);
                        }
                    }}>
                        <IntegrationBox
                            image={integrationAvailable.image}
                            service_name={integrationAvailable.service_name}
                            is_avalible={true}
                        />
                    </Box>
                ))}
            </Box>
            <KlaviyoIntegrationPopup open={openKlaviyoConnect} handleClose={handleClose} onSave={handleOnSave}/>
            <MetaConnectButton 
                open={openMetaConnect} 
                onClose={handleClose} 
            />
        </Box>
    );
};


const Integrations = () => {
    const [value, setValue] = useState('1');
    const [integrationsCredentials, setIntegrationsCredentials] = useState<IntegrationCredentials[]>([]);
    const [integrations, setIntegrations] = useState<any[]>([])
    const [status, setStatus] = useState<string>('');
    const router = useRouter();
    const [showSlider, setShowSlider] = useState(false);
    const [isLoading, setLoading] = useState(true)
    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };

    const installPixel = () => {
        router.push('/dashboard');
    };

    const centerContainerStyles = {
        mt: 3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        border: '1px solid rgba(235, 235, 235, 1)',
        borderRadius: 2,
        padding: 3,
        width: '100%',
        textAlign: 'center',
        flex: 1,
        fontFamily: 'Nunito Sans'
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [credentialsResponse, integrationsResponse] = await Promise.all([
                    axiosInstance.get('/integrations/credentials/'),
                    axiosInstance.get('/integrations/')
                ]);
                if (credentialsResponse.status === 200) {
                    setIntegrationsCredentials(credentialsResponse.data);
                }
                if (integrationsResponse.status === 200) {
                    setIntegrations(integrationsResponse.data);
                }
            } catch (error) {
                if (error instanceof AxiosError && error.response?.status === 403) {
                    const status = error.response.data.detail.status;
                    if (status === 'NEED_BOOK_CALL') {
                        sessionStorage.setItem('is_slider_opened', 'true');
                        setShowSlider(true);
                    } else if (status === 'PIXEL_INSTALLATION_NEEDED') {
                        setStatus('PIXEL_INSTALLATION_NEEDED');
                    } else {
                        setShowSlider(false);
                    }
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    

    const changeTab = (value: string) => {
        setValue(value)
    }
    return (
        <>
            {isLoading && <CustomizedProgressBar />}
            <TabContext value={value}>
                <Box sx={{
                    mt: '1rem',
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    "@media (max-width: 600px)": { mb: 2 },
                }}>
                    {/* Title and Tooltip */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1}}>
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
                            Integrations
                        </Typography>
                        <CustomTooltip
                            title={"Connect your favourite tools to automate tasks and ensure all your data is accessible in one place."}
                            linkText="Learn more"
                            linkUrl="https://maximiz.ai"
                        />
                    </Box>
                    {/* Tabs */}
                    {status !== 'PIXEL_INSTALLATION_NEEDED' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', margin: '0 auto'}}>
                            <TabList
                                centered
                                aria-label="Integrations Tabs"
                                TabIndicatorProps={{ sx: { backgroundColor: "#5052b2" } }}
                                sx={{
                                    width: 'fit-content',
                                    "& .MuiTabs-flexContainer": {
                                        justifyContent: 'center',
                                        "@media (max-width: 600px)": { gap: '16px' }
                                    }
                                }}
                                onChange={handleTabChange}
                            >
                                <Tab label="Your Integration" value="1" sx={{ ...integrationStyle.tabHeading }} />
                                <Tab label="Available Integrations" value="2" sx={{ ...integrationStyle.tabHeading }} />
                                <Tab label="Pixel Management" value="3" sx={{ ...integrationStyle.tabHeading }} />
                            </TabList>
                        </Box>
                    )}  
                </Box>
                <Box sx={{
                    border: '1px solid #E4E4E4',
                    mt: 2.5
                }}></Box>
                {status === 'PIXEL_INSTALLATION_NEEDED' ? (
                    <Box sx={centerContainerStyles}>
                        <Typography variant="h5" sx={{ mb: 2, fontSize: '0.9rem' }}>
                            Pixel Integration isn&#39t completed yet!
                        </Typography>
                        <Image src={'/pixel_installation_needed.svg'} width={300} height={241} alt="pixel installed needed"/>
                        <Typography sx={{ mb: 3, color: '#808080', fontSize: '0.8rem', mt: 3 }}>
                            Install the pixel to unlock and gain valuable insights! Start viewing your leads now
                        </Typography>
                        <Button onClick={installPixel} variant="contained" sx={{
                            backgroundColor: '#5052B2',
                            fontFamily: "Nunito Sans",
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: '20px',
                            letterSpacing: 'normal',
                            color: "#fff",
                            textTransform: 'none',
                            padding: '10px 24px',
                            boxShadow:'0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                            '&:hover': {
                                backgroundColor: '#5052B2'
                            },
                            borderRadius: '4px',
                        }}>
                            Setup Pixel
                        </Button>
                    </Box>
                ) : (
                    <>
                        <TabPanel value="1" sx={{ px: 0 }}>
                            <UserIntegrationsList 
                                integrationsCredentials={integrationsCredentials} 
                                changeTab={changeTab} 
                                integrations={integrations}/>
                        </TabPanel>
                        <TabPanel value="2" sx={{ px: 0 }}>
                            <IntegrationsAvailable 
                            integrationsCredentials={integrationsCredentials} 
                            integrations={integrations}/>
                        </TabPanel>
                        <TabPanel value="3" sx={{ px: 0 }}>
                            <Typography>Pixel Management content goes here.</Typography>
                        </TabPanel>
                    </>
                )}
            </TabContext>
            {showSlider && <Slider/>}
        </>
    );
};

const IntegraitonsPage = () => {
    return (
        <SliderProvider>
            <Integrations />
        </SliderProvider>
    )
}

export default IntegraitonsPage;