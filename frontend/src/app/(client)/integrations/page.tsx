'use client';


import React, { useState, useEffect, Suspense, useRef } from "react";
import { integrationsStyle } from "./integrationsStyle";
import axiosInstance from '../../../axios/axiosInterceptorInstance';
import { Box, Button, Typography, Tab, TextField, InputAdornment, Popover, IconButton, TableContainer, Table, Paper, TableHead, TableRow, TableCell, TableBody, Tooltip, Drawer, Backdrop, LinearProgress } from "@mui/material";
import Image from "next/image";
import CustomTooltip from "@/components/customToolTip";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import TabList from "@mui/lab/TabList";
import { useRouter, useSearchParams } from 'next/navigation';
import axios, { AxiosError } from "axios";
import Slider from '../../../components/Slider';
import { SliderProvider } from "@/context/SliderContext";
import MetaConnectButton from "@/components/MetaConnectButton";
import KlaviyoIntegrationPopup from "@/components/KlaviyoIntegrationPopup";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from "@/components/ToastNotification";
import AlivbleIntagrationsSlider from "@/components/AvalibleIntegrationsSlider";
import ShopifySettings from "@/components/ShopifySettings";
import PixelInstallation from "@/app/(client)/dashboard/components/PixelInstallation";
import VerifyPixelIntegration from "@/components/VerifyPixelIntegration";
import DataSyncList from "@/app/(client)/data-sync/components/DataSyncList";
import BCommerceConnect from "@/components/Bcommerce";
import OmnisendConnect from "@/components/OmnisendConnect";
import MailchimpConnect from "@/components/MailchimpConnect";
import RevenueTracking from "@/components/RevenueTracking";
import SendlaneConnect from "@/components/SendlaneConnect";
import AttentiveIntegrationPopup from "@/components/AttentiveIntegrationPopup";
import { useNotification } from "@/context/NotificationContext";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import ZapierConnectPopup from "@/components/ZapierConnectPopup";
import SlackConnectPopup from "@/components/SlackConnectPopup";
import { useIntegrationContext } from "@/context/IntegrationContext";


interface IntegrationBoxProps {
  image: string;
  handleClick?: () => void;
  handleDelete?: () => void;
  service_name: string;
  active?: boolean;
  is_avalible?: boolean;
  error_message?: string;
  is_failed?: boolean;
  is_integrated?: boolean;
  isEdit?: boolean;
}

interface IntegrationCredentials {
  access_token: string;
  service_name: string;
  shop_domain: string;
  ad_account_id: string;
  is_with_suppresions: boolean;
  error_message?: string
  is_failed: boolean
}

const integrationStyle = {
  tabHeading: {
    textTransform: 'none',
    padding: '4px 10px',
    pb: '10px',
    flexGrow: 0,
    minHeight: 'auto',
    minWidth: 'auto',
    fontSize: '14px',
    fontWeight: 700,
    lineHeight: '19.1px',
    textAlign: 'left',
    mr: 2,
    '&.Mui-selected': {
      color: 'rgba(80, 82, 178, 1)'
    },
    "@media (max-width: 600px)": {
      flexGrow: 1,
      mr: 0, borderRadius: '4px', '&.Mui-selected': {
        backgroundColor: 'rgba(249, 249, 253, 1)',
        border: '1px solid rgba(220, 220, 239, 1)'
      },
    }
  },
};


const IntegrationBox = ({ image, handleClick, handleDelete, service_name, active, is_avalible, is_failed, is_integrated = false, isEdit }: IntegrationBoxProps) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const openPopover = Boolean(anchorEl);
  const [isHovered, setIsHovered] = useState(false);
  const [openToolTip, setOpenTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const altImageIntegration = [
    'Cordial'
  ]

  const openToolTipClick = () => {
    const isMobile = window.matchMedia('(max-width:900px)').matches;
    if (isMobile && is_integrated) {
      setOpenTooltip(true);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
      setOpenTooltip(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);


  const handleOpen = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClickEdit = () => {
    handleClose();
    if (handleClick) {
      handleClick();
    }
  };

  const handleClickDelete = () => {
    handleClose();
    if (handleDelete) {
      handleDelete();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const formatServiceName = (name: string): string => {
    if (name === "big_commerce") {
      return "BigCommerce";
    }
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };


  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      cursor: 'pointer',
    }}>
      <Tooltip
        open={openToolTip || isHovered}
        ref={tooltipRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={openToolTipClick}
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: '#f5f5f5',
              color: '#000',
              boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.12)',
              border: ' 0.2px rgba(0, 0, 0, 0.04)',
              borderRadius: '4px',
              maxHeight: '100%',
              whiteSpace: 'normal',
              minWidth: '200px',
              zIndex: 99,
              padding: '11px 10px',
              fontSize: '12px !important',
              fontFamily: 'Nunito Sans',

            },
          },
        }}
        title={is_integrated ? `A ${service_name} account is already integrated. To connect a different account, please remove the existing ${service_name} integration first from Your integration.` : ""}>
        <Box sx={{
          backgroundColor: is_integrated ? 'rgba(0, 0, 0, 0.04)' : active
            ? 'rgba(80, 82, 178, 0.1)'
            : 'transparent',
          border: active ? '1px solid #5052B2' : '1px solid #E4E4E4',
          position: 'relative',
          display: 'flex',
          borderRadius: '4px',
          cursor: is_integrated ? 'default' : 'pointer',
          width: '8rem',
          height: '8rem',
          filter: is_integrated ? 'grayscale(1)' : 'none',
          justifyContent: 'center',
          alignItems: 'center',
          transition: '0.2s',
          '&:hover': {
            boxShadow: is_integrated ? 'none' : '0 0 4px #00000040'
          },
          '&:hover .edit-icon': {
            opacity: 1
          },
          "@media (max-width: 900px)": {
            width: '156px'
          },
        }}>
          {!is_avalible && (
            <Box sx={{
              display: 'flex',
              justifyContent: 'center'
            }}>
              <Box onClick={handleClick} sx={{
                position: 'absolute',
                top: '0%',
                left: '0%',
                margin: '8px 0 0 8px',
                transition: 'opacity 0.2s',
                cursor: 'pointer',
                display: 'flex',
                background: !is_failed ? '#EAF8DD' : '#FCDBDC',
                height: '20px',
                padding: '2px 8px 1px 8px',
                borderRadius: '4px'
              }}>
                {!is_failed ? (
                  <Typography fontSize={'12px'} fontFamily={'Nunito Sans'} color={'#2B5B00'} fontWeight={600}>Integrated</Typography>
                ) : (
                  <Typography fontSize={'12px'} fontFamily={'Nunito Sans'} color={'#4E0110'} fontWeight={600}>Failed</Typography>
                )}
              </Box>
              <Box className="edit-icon" onClick={handleOpen} sx={{
                position: 'absolute',
                top: '0%',
                right: '0%',
                margin: '8px 8.4px 0 0',
                opacity: openPopover ? 1 : 0,
                transition: 'opacity 0.2s',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                '&:hover': {
                  backgroundColor: '#EDEEF7'
                },
                "@media (max-width: 900px)": {
                  opacity: 1
                },
              }}>
                <MoreVertIcon sx={{ height: '20px' }} />
              </Box>
            </Box>
          )}
          <Image src={image} width={altImageIntegration.some(int => int == service_name) ? 100 : 32} height={32} alt={service_name} />
        </Box>
      </Tooltip>
      <Typography mt={0.5} fontSize={'14px'} fontWeight={500} textAlign={'center'} fontFamily={'Nunito Sans'}>
        {formatServiceName(service_name)}
      </Typography>
      <Popover
        open={openPopover}
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
                backgroundColor: "rgba(80, 82, 178, 0.1)",
              },
            }}
            onClick={handleClickEdit}
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
                backgroundColor: "rgba(80, 82, 178, 0.1)",
              },
            }}
            onClick={handleClickDelete}
          >
            Delete
          </Button>
        </Box>
      </Popover>
    </Box>
  );
};

const IntegrationAdd = () => (
  <Box sx={{
    border: '1px dashed #5052B2',
    display: 'flex',
    borderRadius: '4px',
    width: '8rem',
    height: '8rem',
    justifyContent: 'center',
    alignItems: 'center',
    transition: '0.2s',
    '&:hover': { boxShadow: '0 0 4px #00000040' },
    "@media (max-width: 900px)": {
      width: '156px'
    },
  }}>
    <Image src={'/add-square.svg'} width={44} height={44} alt={'add'} />
  </Box>
);

interface DeletePopupProps {
  service_name: string | null
  open: boolean
  handleDelete: () => void
  onClose: () => void
}

const DeleteIntegrationPopup = ({ service_name, open, handleDelete, onClose }: DeletePopupProps) => {
  const [loading, setLoading] = useState(false)

  const handleDeleteClick = async () => {
    setLoading(true)
    await handleDelete()
    setLoading(false)
    onClose()
  }

  if (!open) return null;

  const formatServiceName = (name: string): string => {
    if (name === "big_commerce") {
      return "BigCommerce";
    }
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };


  return (
    <>
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1400,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ width: '100%', top: 0, height: '100vh' }}>
            <LinearProgress />
          </Box>
        </Box>
      )}
      <Backdrop open={open} onClick={onClose} sx={{ zIndex: 1300, color: '#fff', bgcolor: 'rgba(0, 0, 0, 0.1)' }} />
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        variant="persistent"
        PaperProps={{
          sx: {
            width: '620px',
            position: 'fixed',
            zIndex: 1300,
            top: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column', // Flex-контейнер для колонок
            height: '100vh', // Высота на весь экран
            '@media (max-width: 600px)': {
              width: '100%',
            },
          },
        }}
      >

        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: '24px', pb: '19px', borderBottom: '1px solid rgba(0, 0, 0, 0.1)', }}>
          <Typography variant='h3' fontSize={'1rem'}>Confirm deletion {service_name ? formatServiceName(service_name) : ''}</Typography>
          <CloseIcon sx={{ cursor: 'pointer' }} onClick={onClose} />
        </Box>


        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Image src='/Inbox cleanup-rafiki 1.svg' alt='cleanup' width={535} height={356.67} />
          </Box>

          <Typography
            variant='h6'
            textAlign='center'
            fontFamily='Nunito Sans'
            fontWeight={500}
            fontSize='14px'
            sx={{
              width: '100%',
              textAlign: 'center',
              whiteSpace: 'pre-line',
              userSelect: 'text',
              p: 4
            }}
          >
            Are you sure you want to delete the {service_name ? formatServiceName(service_name) : ''} integration? This action will remove all
            associated lists and disconnect {service_name ? formatServiceName(service_name) : ''} from your account.
          </Typography>
        </Box>
        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '20px',
          position: 'absolute',
          bottom: 0,
          width: '100%',
          backgroundColor: 'white',
          pt: '12px', borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        }}>
          <Button
            sx={{
              border: '1px #5052B2 solid',
              color: '#5052B2',
              '&:hover': {
                border: '1px #5052B2 solid',
              }
            }}
            variant='outlined'
            onClick={onClose}
          >
            <Typography padding={'0rem 1rem'} sx={{ textTransform: 'none' }} fontSize={'0.8rem'}>Cancel</Typography>
          </Button>
          <Button
            sx={{
              margin: '0 16px',
              fontFamily: 'Nunito Sans',
              background: '#5052B2',
              '&:hover': {
                backgroundColor: '#5052B2',
              },
              "&.Mui-disabled": {
                backgroundColor: "rgba(80, 82, 178, 0.6)",
                color: "#fff",
              },
            }}
            variant='contained'
            onClick={handleDeleteClick}
          >
            <Typography padding={'0.35rem 2rem'} sx={{ textTransform: 'none' }} fontSize={'0.8rem'}>Confirm</Typography>
          </Button>
        </Box>
      </Drawer>
    </>
  );
};


interface IntegrationsListProps {
  integrationsCredentials: IntegrationCredentials[];
  integrations: any[]
  changeTab?: (value: string) => void
  handleSaveSettings: (new_integration: any) => void
  handleDeleteSettings?: (serviceName: string) => void

}

interface DataSyncIntegrationsProps {
  service_name: string | null
}

const UserIntegrationsList = ({ integrationsCredentials, integrations, handleSaveSettings, handleDeleteSettings }: IntegrationsListProps) => {
  const [activeService, setActiveService] = useState<string | null>(null);
  const [openAvalible, setOpenAvalible] = useState(false)
  const [openKlaviyoConnect, setOpenKlaviyoConnect] = useState(false)
  const [openMetaConnect, setOpenMetaConnect] = useState(false)
  const [openShopifyConnect, setOpenShopifyConnect] = useState(false)
  const [openBigcommrceConnect, setOpenBigcommerceConnect] = useState(false)
  const [openOmnisendConnect, setOpenOmnisendConnect] = useState(false)
  const [openMailchinpConnect, setOpenMailchimpConnect] = useState(false)
  const [openSendlaneConnect, setOpenSendlaneConnect] = useState(false)
  const [openSlackConnect, setOpenSlackConnect] = useState(false)
  const [OpenAttentiveConnect, setOpenAttentiveConnect] = useState(false)
  const [openZapierConnect, setOpenZapierConnect] = useState(false)
  const [openDeletePopup, setOpenDeletePopup] = useState(false)
  const handleActive = (service: string) => {
    setActiveService(service);
  };


  const handleClose = () => {
    setOpenKlaviyoConnect(false)
    setOpenMetaConnect(false)
    setOpenShopifyConnect(false)
    setOpenBigcommerceConnect(false)
    setOpenOmnisendConnect(false)
    setOpenMailchimpConnect(false)
    setOpenSendlaneConnect(false)
    setOpenAttentiveConnect(false)
    setOpenZapierConnect(false)
    setOpenSlackConnect(false)
  }

  const handleDeleteOpen = () => {
    setOpenDeletePopup(true)
  }

  const handleDeleteClose = () => {
    setOpenDeletePopup(false)
  }

  const handleDelete = async () => {
    try {

      const response = await axiosInstance.delete('/integrations/', {
        params: {
          service_name: activeService,
        },
      });

      if (response.status === 200) {
        showToast(`Remove ${activeService} Successfully`)
        if (handleDeleteSettings && activeService) {
          handleDeleteSettings(activeService)
          setActiveService(null)
        }
      }
    } catch (error) {
      showErrorToast(`Remove ${activeService} failed`)
    }
  };


  return (
    <>
      <Box sx={{
        display: 'flex', gap: 2, flexWrap: 'wrap',
        "@media (max-width: 900px)": {
          justifyContent: 'center',
        }
      }}>
        {integrationsCredentials.some(integration => integration.service_name === "shopify") && (
          <Box onClick={() => handleActive('shopify')}>
            <IntegrationBox
              image="/shopify-icon.svg"
              service_name="shopify"
              active={activeService === 'shopify'}
              handleClick={() => setOpenShopifyConnect(true)}
              handleDelete={handleDeleteOpen}
              is_failed={integrationsCredentials?.find(integration => integration.service_name === 'shopify')?.is_failed}
            />
          </Box>
        )}
        {integrationsCredentials.some(integration => integration.service_name === "klaviyo") && (
          <Box onClick={() => handleActive('klaviyo')}>
            <IntegrationBox
              image="/klaviyo.svg"
              service_name="klaviyo"
              active={activeService === 'klaviyo'}
              handleClick={() => setOpenKlaviyoConnect(true)}
              handleDelete={handleDeleteOpen}
              is_failed={integrationsCredentials?.find(integration => integration.service_name === 'klaviyo')?.is_failed}
            />
          </Box>
        )}
        {integrationsCredentials.some(integration => integration.service_name === "meta") && (
          <Box onClick={() => handleActive('meta')}>
            <IntegrationBox
              image="/meta-icon.svg"
              service_name="meta"
              active={activeService === 'meta'}
              handleClick={() => setOpenMetaConnect(true)}
              handleDelete={handleDeleteOpen}
              is_failed={integrationsCredentials?.find(integration => integration.service_name === 'meta')?.is_failed}
            />
          </Box>
        )}
        {integrationsCredentials.some(integration => integration.service_name === "big_commerce") && (
          <Box onClick={() => handleActive('big_commerce')}>
            <IntegrationBox
              image="/bigcommerce-icon.svg"
              service_name="big_commerce"
              active={activeService === 'big_commerce'}
              handleClick={() => setOpenBigcommerceConnect(true)}
              handleDelete={handleDeleteOpen}
              is_failed={integrationsCredentials?.find(integration => integration.service_name === 'big_commerce')?.is_failed}
            />
          </Box>
        )}
        {integrationsCredentials.some(integration => integration.service_name === "omnisend") && (
          <Box onClick={() => handleActive('omnisend')}>
            <IntegrationBox
              image="/omnisend_icon_black.svg"
              service_name="omnisend"
              active={activeService === 'omnisend'}
              handleClick={() => setOpenOmnisendConnect(true)}
              handleDelete={handleDeleteOpen}
              is_failed={integrationsCredentials?.find(integration => integration.service_name === 'omnisend')?.is_failed}
            />
          </Box>
        )}
        {integrationsCredentials.some(integration => integration.service_name === "mailchimp") && (
          <Box onClick={() => handleActive('mailchimp')}>
            <IntegrationBox
              image="/mailchimp-icon.svg"
              service_name="mailchimp"
              active={activeService === 'mailchimp'}
              handleClick={() => setOpenMailchimpConnect(true)}
              handleDelete={handleDeleteOpen}
              is_failed={integrationsCredentials?.find(integration => integration.service_name === 'mailchimp')?.is_failed}
            />
          </Box>
        )}
        {integrationsCredentials.some(integration => integration.service_name === "sendlane") && (
          <Box onClick={() => handleActive('sendlane')}>
            <IntegrationBox
              image="/sendlane-icon.svg"
              service_name="sendlane"
              active={activeService === 'sendlane'}
              handleClick={() => setOpenSendlaneConnect(true)}
              handleDelete={handleDeleteOpen}
              is_failed={integrationsCredentials?.find(integration => integration.service_name === 'sendlane')?.is_failed}
            />
          </Box>
        )}
        {integrationsCredentials.some(integration => integration.service_name === "slack") && (
          <Box onClick={() => handleActive('slack')}>
            <IntegrationBox
              image="/slack-icon.svg"
              service_name="slack"
              active={activeService === 'slack'}
              handleClick={() => setOpenSlackConnect(true)}
              handleDelete={handleDeleteOpen}
              is_failed={integrationsCredentials?.find(integration => integration.service_name === 'slack')?.is_failed}
            />
          </Box>
        )}
        {integrationsCredentials.some(integration => integration.service_name === "attentive") && (
          <Box onClick={() => handleActive('attentive')}>
            <IntegrationBox
              image="/attentive.svg"
              service_name="attentive"
              active={activeService === 'attentive'}
              handleClick={() => setOpenAttentiveConnect(true)}
              handleDelete={handleDeleteOpen}
              is_failed={integrationsCredentials?.find(integration => integration.service_name === 'attentive')?.is_failed}
            />
          </Box>
        )}
        {integrationsCredentials.some(integration => integration.service_name === "zapier") && (
          <Box onClick={() => handleActive('zapier')}>
            <IntegrationBox
              image="/zapier-icon.svg"
              service_name="zapier"
              active={activeService === 'zapier'}
              handleClick={() => setOpenZapierConnect(true)}
              handleDelete={handleDeleteOpen}
              is_failed={integrationsCredentials?.find(integration => integration.service_name === 'zapier')?.is_failed}
            />
          </Box>
        )}
        <Box onClick={() => setOpenAvalible(true)}>
          <IntegrationAdd />
        </Box>
      </Box>
      <KlaviyoIntegrationPopup
        open={openKlaviyoConnect}
        handleClose={handleClose}
        onSave={handleSaveSettings}
        initApiKey={integrationsCredentials?.find(integration => integration.service_name === 'klaviyo')?.access_token}
        boxShadow="rgba(0, 0, 0, 0.1)"
      />
      <AttentiveIntegrationPopup
        open={OpenAttentiveConnect}
        handleClose={handleClose}
        onSave={handleSaveSettings}
        initApiKey={integrationsCredentials?.find(integration => integration.service_name === 'attentive')?.access_token}
        boxShadow="rgba(0, 0, 0, 0.1)"
      />
      <MetaConnectButton
        open={openMetaConnect}
        onClose={handleClose}
        onSave={handleSaveSettings}
        isEdit={true}
        boxShadow="rgba(0, 0, 0, 0.1)"
      />
      <ShopifySettings
        open={openShopifyConnect}
        handleClose={handleClose}
        onSave={handleSaveSettings}
        initApiKey={integrationsCredentials?.find(integration => integration.service_name === 'shopify')?.access_token}
        initShopDomain={integrationsCredentials?.find(integration => integration.service_name === 'shopify')?.shop_domain}
      />
      <BCommerceConnect
        open={openBigcommrceConnect}
        onClose={handleClose}
        initShopHash={integrationsCredentials?.find(integration => integration.service_name === 'big_commerce')?.shop_domain}
        error_message={integrationsCredentials?.find(integration => integration.service_name === 'big_commerce')?.error_message}
      />
      {openOmnisendConnect && <OmnisendConnect open={openOmnisendConnect} handleClose={handleClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials?.find(integration => integration.service_name === 'omnisend')?.access_token} boxShadow="rgba(0, 0, 0, 0.1)" />}
      <MailchimpConnect open={openMailchinpConnect} handleClose={handleClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials?.find(integration => integration.service_name === 'mailchimp')?.access_token} boxShadow="rgba(0, 0, 0, 0.1)" />
      <SendlaneConnect open={openSendlaneConnect} handleClose={handleClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials?.find(integration => integration.service_name === 'sendlane')?.access_token} boxShadow="rgba(0, 0, 0, 0.1)" />
      {OpenAttentiveConnect && (
        <>
          <AttentiveIntegrationPopup open={OpenAttentiveConnect} handleClose={handleClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials?.find(integration => integration.service_name === 'attentive')?.access_token} boxShadow="rgba(0, 0, 0, 0.1)" />
        </>
      )
      }
      <ZapierConnectPopup open={openZapierConnect} handlePopupClose={handleClose} boxShadow="rgba(0, 0, 0, 0.01)" />
      <AlivbleIntagrationsSlider
        isContactSync={false}
        open={openAvalible}
        onClose={() => setOpenAvalible(false)}
        integrations={integrations}
        integrationsCredentials={integrationsCredentials}
        handleSaveSettings={handleSaveSettings}
      />
      <SlackConnectPopup open={openSlackConnect} handlePopupClose={handleClose} boxShadow="rgba(0, 0, 0, 0.01)" />
      <Box>
        {(activeService && activeService != 'shopify' && activeService != 'big_commerce') && (<DataSyncList key={activeService} service_name={activeService} />)}
      </Box>

      <DeleteIntegrationPopup open={openDeletePopup} onClose={handleDeleteClose} service_name={activeService} handleDelete={handleDelete} />
    </>
  );
};


const IntegrationsAvaliable = ({ integrationsCredentials, integrations, handleSaveSettings }: IntegrationsListProps) => {
  const [search, setSearch] = useState<string>('');
  const [openMetaConnect, setOpenMetaConnect] = useState(false)
  const [openKlaviyoConnect, setOpenKlaviyoConnect] = useState(false)
  const [openShopifyConnect, setOpenShopifyConnect] = useState(false)
  const [openBigcommrceConnect, setOpenBigcommerceConnect] = useState(false)
  const [openOmnisendConnect, setOpenOmnisendConnect] = useState(false)
  const [openMailchinpConnect, setOpenmailchimpConnect] = useState(false)
  const [openSendlaneConnect, setOpenSendlaneConnect] = useState(false)
  const [openSlackConnect, setOpenSlackConnect] = useState(false)
  const [openAttentiveConnect, setOpenAttentiveConnect] = useState(false)
  const [openZapierConnect, setOpenZapierConnect] = useState(false)

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const integrationsAvailable = [
    { image: 'shopify-icon.svg', service_name: 'shopify' },
    { image: 'klaviyo.svg', service_name: 'klaviyo' },
    { image: 'meta-icon.svg', service_name: 'meta' },
    { image: 'bigcommerce-icon.svg', service_name: 'big_commerce' },
    { image: 'omnisend_icon_black.svg', service_name: 'omnisend' },
    { image: 'mailchimp-icon.svg', service_name: 'mailchimp' },
    { image: 'sendlane-icon.svg', service_name: 'sendlane' },
    { image: 'attentive.svg', service_name: 'attentive' },
    { image: 'listrak.svg', service_name: 'listark' },
    { image: 'cordial.svg', service_name: 'cordial' },
    { image: 'zapier-icon.svg', service_name: 'zapier' },
    { image: 'slack-icon.svg', service_name: 'slack' }
  ];

  const handleClose = () => {
    setOpenMetaConnect(false)
    setOpenKlaviyoConnect(false)
    setOpenShopifyConnect(false)
    setOpenBigcommerceConnect(false)
    setOpenOmnisendConnect(false)
    setOpenmailchimpConnect(false)
    setOpenSendlaneConnect(false)
    setOpenSlackConnect(false)
    setOpenAttentiveConnect(false)
    setOpenZapierConnect(false)
  }

  const handleAddIntegration = (service_name: string) => {
    const isIntegrated = integrationsCredentials.some(integration_cred => integration_cred.service_name === service_name);
    if (isIntegrated) {
      return
    }
    switch (service_name) {
      case 'klaviyo':
        setOpenKlaviyoConnect(true);
        break;
      case 'attentive':
        setOpenAttentiveConnect(true);
        break;
      case 'shopify':
        setOpenShopifyConnect(true);
        break;
      case 'big_commerce':
        setOpenBigcommerceConnect(true);
        break;
      case 'omnisend':
        setOpenOmnisendConnect(true);
        break;
      case 'mailchimp':
        setOpenmailchimpConnect(true);
        break;
      case 'sendlane':
        setOpenSendlaneConnect(true);
        break;
      case 'meta':
        setOpenMetaConnect(true);
        break;
      case 'zapier':
        setOpenZapierConnect(true)
        break;
      case 'slack':
        setOpenSlackConnect(true);
        break;
      default:
        break;
    }
  }

  const filteredIntegrations = integrations.filter((integration: any) =>
    integration.service_name.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <Box>
      <Box>
        <TextField
          fullWidth
          placeholder="Search integrations"
          value={search}
          onChange={handleSearch}
          id="outlined-start-adornment"
          sx={{
            mb: 3.75,
            width: '572px',
            '@media(max-width: 900px)': {
              width: '100%'
            }
          }}
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
      <Box sx={{
        display: 'flex', gap: 2,
        flexWrap: 'wrap',
        width: '100%',
        "@media (max-width: 600px)": {
          alignItems: 'start',
          justifyContent: 'center'
        }
      }}>
        {filteredIntegrations.map((integration: any) => {
          const isIntegrated = integrationsCredentials.some(integration_cred => integration_cred.service_name === integration.service_name);
          const imageSrc = integrationsAvailable.find(img => img.service_name === integration.service_name)?.image || '';
          return (
            <Box key={integration.service_name}
              onClick={() => {
                handleAddIntegration(integration.service_name);
              }}>
              <IntegrationBox
                image={imageSrc}
                service_name={integration.service_name}
                is_avalible={true}
                is_integrated={isIntegrated}
              />
            </Box>
          );
        })}
      </Box>

      <KlaviyoIntegrationPopup open={openKlaviyoConnect} handleClose={handleClose} onSave={handleSaveSettings} />
      <MetaConnectButton
        open={openMetaConnect}
        onClose={handleClose}
        onSave={handleSaveSettings}
        boxShadow="rgba(0, 0, 0, 0.1)"
      />
      <ShopifySettings open={openShopifyConnect} handleClose={handleClose} onSave={handleSaveSettings} />
      <BCommerceConnect open={openBigcommrceConnect} onClose={handleClose} boxShadow="rgba(0, 0, 0, 0.1)" />
      {openOmnisendConnect && <OmnisendConnect open={openOmnisendConnect} handleClose={handleClose} onSave={handleSaveSettings} boxShadow="rgba(0, 0, 0, 0.1)" />}
      <MailchimpConnect open={openMailchinpConnect} handleClose={handleClose} onSave={handleSaveSettings} boxShadow="rgba(0, 0, 0, 0.1)" />
      <SendlaneConnect open={openSendlaneConnect} handleClose={handleClose} onSave={handleSaveSettings} boxShadow="rgba(0, 0, 0, 0.1)" />
      <AttentiveIntegrationPopup open={openAttentiveConnect} handleClose={handleClose} onSave={handleSaveSettings} boxShadow="rgba(0, 0, 0, 0.1)" />
      <ZapierConnectPopup open={openZapierConnect} handlePopupClose={handleClose} boxShadow="rgba(0, 0, 0, 0.1)" />
      <SlackConnectPopup open={openSlackConnect} handlePopupClose={handleClose} boxShadow="rgba(0, 0, 0, 0.1)" />
    </Box>
  );
};


const PixelManagment = () => {
  const [value, setValue] = useState('1')
  const [filters, setFilters] = useState<any>()

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };
  return (
    <>
      <TabContext value={value}>
        <TabList
          centered
          aria-label="Integrations Tabs"
          TabIndicatorProps={{ sx: { backgroundColor: "#5052b2" } }}
          sx={{
            textTransform: 'none',
            minHeight: 0,
            '& .MuiTabs-indicator': {
              backgroundColor: 'rgba(80, 82, 178, 1)',
              height: '1.4px',
            },
            "@media (max-width: 600px)": {
              border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '4px', width: '100%', '& .MuiTabs-indicator': {
                height: '0',
              },
            }
          }}
          onChange={handleTabChange}
        >
          <Tab label="Pixel Configuration" value="1" sx={{ ...integrationStyle.tabHeading }} />
          <Tab label="Data syncs" value="2" sx={{ ...integrationStyle.tabHeading }} />
        </TabList>
        <TabPanel value="2">
          <Box sx={{
            mt: '1rem',
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            "@media (max-width: 600px)": { mb: 2 },
          }}>
            {/* Title and Tooltip */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                Connections Details
              </Typography>
              <CustomTooltip
                title={"How data synch works and to customise your sync settings"}
                linkText="Learn more"
                linkUrl="https://maximiz.ai"
              />
            </Box>
          </Box>
          <Box >
            <DataSyncList filters={filters} />
          </Box>
        </TabPanel>
        <TabPanel value="1">
          <PixelInstallation />
          <VerifyPixelIntegration />
          <RevenueTracking />
        </TabPanel>
      </TabContext>

    </>

  )
}

const Integrations = () => {
  const { hasNotification } = useNotification();
  const { needsSync, setNeedsSync } = useIntegrationContext();
  const [value, setValue] = useState('1');
  const [integrationsCredentials, setIntegrationsCredentials] = useState<IntegrationCredentials[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([])
  const [status, setStatus] = useState<string>('');
  const router = useRouter();
  const [showSlider, setShowSlider] = useState(false);
  const [isLoading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("1");
  const searchParams = useSearchParams();
  const statusIntegrate = searchParams.get('message');
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    setActiveTab(newValue)
  };

  const installPixel = () => {
    router.push('/dashboard');
  };

  useEffect(() => {
    const code = searchParams.get('code');
    const scope = searchParams.get('scope');
    if (code && scope) {
      setValue("3")
      setActiveTab("3");
    }
  }, []);

  useEffect(() => {
    if (statusIntegrate) {
      if (statusIntegrate == 'Successfully') {
        showToast('Connect to Bigcommerce Successfully');
      } else {
        showErrorToast(`Connect to Bigcommerce Failed ${statusIntegrate && statusIntegrate != 'Failed' ? statusIntegrate : ''}`)
      }
    }
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete('message');
    router.replace(`?${newSearchParams.toString()}`);
  }, [statusIntegrate])

  const centerContainerStyles = {
    mt: 3,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid rgba(235, 235, 235, 1)',
    borderRadius: 2,
    padding: 3,
    pb: 0,
    width: '100%',
    textAlign: 'center',
    flex: 1,
    fontFamily: 'Nunito Sans',
    overflowY: 'auto',
  };

  useEffect(() => {
    const fetchIntegrationCredentials = async () => {
      try {
        const response = await axiosInstance.get('/integrations/credentials/')
        if (response.status === 200) {
          setIntegrationsCredentials(response.data)
        }
      }
      catch (error) {
        if (error instanceof AxiosError && error.response?.status === 403) {
          const status = error.response.data.status
          if (status === 'NEED_BOOK_CALL') {
            sessionStorage.setItem('is_slider_opened', 'true');
            setShowSlider(true);
          } else if (status === 'PIXEL_INSTALLATION_NEEDED') {
            setStatus('PIXEL_INSTALLATION_NEEDED');
          } else {
            setShowSlider(false);
          }
        }
      }
      finally {
        setLoading(false)
      }
    }
    const fetchIntegration = async () => {
      try {
        const response = await axiosInstance.get('/integrations/')
        if (response.status === 200) {
          setIntegrations(response.data)
        }
      }
      finally {
        setLoading(false)
        setNeedsSync(false);
      }
    }
    if (value === '1') {
      fetchIntegrationCredentials()
      if (!status) {
        fetchIntegration()
      }
    }
  }, [value, needsSync]);

  const handleSaveSettings = (newIntegration: IntegrationCredentials) => {
    setIntegrationsCredentials(prevIntegrations => {
      if (prevIntegrations.some(integration => integration.service_name === newIntegration.service_name)) {
        return prevIntegrations.map(integration =>
          integration.service_name === newIntegration.service_name ? newIntegration : integration
        );
      } else {
        return [...prevIntegrations, newIntegration];
      }
    });
  };

  const handleDeleteSettings = (serviceName: string) => {
    setIntegrationsCredentials(prevIntegrations => {
      return prevIntegrations.filter(integration => integration.service_name !== serviceName);
    });
  };
  const changeTab = (value: string) => {
    setValue(value)
  }
  return (
    <>
      {isLoading && <CustomizedProgressBar />}
      <TabContext value={value}>
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
            "@media (max-width: 900px)": {
              flexDirection: "column",
              display: "flex",
              alignItems: "flex-start",
              marginTop: hasNotification ? '36px' : '16px'
            },
            "@media (max-width: 600px)": {
              flexDirection: "column",
              display: "flex",
              alignItems: "flex-start",
              marginTop: hasNotification ? '36px' : '16px'
            },
            "@media (max-width: 440px)": {
              flexDirection: "column",
              justifyContent: "flex-start",
              marginTop: hasNotification ? '44px' : '16px'
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', position: 'fixed', top: hasNotification ? '7.05rem' : '4.25rem', pt: '12px', pb: '12px', left: '9.1rem', pl: '2rem', zIndex: 1200, backgroundColor: '#fff', justifyContent: 'space-between', width: '100%', ml: 0, "@media (max-width: 900px)": { left: 0, zIndex: 50 }, "@media (max-width: 700px)": { flexDirection: 'column', pl: '1.5rem', display: 'flex', alignItems: 'flex-start', zIndex: 50, width: '97%' }, "@media (max-width: 440px)": { flexDirection: 'column', pt: hasNotification ? '3rem' : '0.75rem', top: hasNotification ? '4.5rem' : '', zIndex: 50, justifyContent: 'flex-start' }, "@media (max-width: 400px)": { pt: hasNotification ? '4.25rem' : '', pb: '6px', } }}>
            <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', width: '10%', gap: 1, "@media (max-width: 600px)": { mb: 2 }, "@media (max-width: 440px)": { mb: 1 }, }}>
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

              <Box sx={{ "@media (max-width: 600px)": { display: 'none' } }}>
                <CustomTooltip
                  title={"Connect your favourite tools to automate tasks and ensure all your data is accessible in one place."}
                  linkText="Learn more"
                  linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/integration"
                />
              </Box>
            </Box>

            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', width: '90%', pr: '20%', alignItems: 'center', "@media (max-width: 900px)": { pr: 0 }, "@media (max-width: 600px)": { width: '97%', pr: '0' } }}>
              {status === 'PIXEL_INSTALLATION_NEEDED' ? '' : (
                <TabList
                  centered
                  aria-label="Integrations Tabs"
                  TabIndicatorProps={{ sx: { backgroundColor: "#5052b2" } }}
                  sx={{
                    textTransform: 'none',
                    pt: '8px',
                    minHeight: 0,
                    '& .MuiTabs-indicator': {
                      backgroundColor: 'rgba(80, 82, 178, 1)',
                      height: '1.4px',
                    },
                    "@media (max-width: 600px)": {
                      border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '4px', width: '100%', '& .MuiTabs-indicator': {
                        height: '0',
                      },
                    }
                  }}
                  onChange={handleTabChange}
                >
                  <Tab value="1" label="Your Integrations" className="main-text"
                    sx={{
                      textTransform: 'none',
                      padding: '4px 10px',
                      pb: '10px',
                      flexGrow: 1,
                      marginRight: '3em',
                      minHeight: 'auto',
                      minWidth: 'auto',
                      fontSize: '14px',
                      fontWeight: 700,
                      lineHeight: '19.1px',
                      textAlign: 'left',
                      mr: 2,
                      '&.Mui-selected': {
                        color: 'rgba(80, 82, 178, 1)'
                      },
                      "@media (max-width: 600px)": {
                        mr: 0, borderRadius: '4px', '&.Mui-selected': {
                          backgroundColor: 'rgba(249, 249, 253, 1)',
                          border: '1px solid rgba(220, 220, 239, 1)'
                        },
                      }
                    }}
                  />
                  <Tab label="Add an Integration" value="2" className="main-text"
                    sx={{
                      textTransform: 'none',
                      padding: '4px 10px',
                      pb: '10px',
                      flexGrow: 1,
                      marginRight: '3em',
                      minHeight: 'auto',
                      minWidth: 'auto',
                      fontSize: '14px',
                      fontWeight: 700,
                      lineHeight: '19.1px',
                      textAlign: 'left',
                      mr: 2,
                      '&.Mui-selected': {
                        color: 'rgba(80, 82, 178, 1)'
                      },
                      "@media (max-width: 600px)": {
                        mr: 0, borderRadius: '4px', '&.Mui-selected': {
                          backgroundColor: 'rgba(249, 249, 253, 1)',
                          border: '1px solid rgba(220, 220, 239, 1)'
                        },
                      }
                    }} />
                  <Tab label="Pixel Management" value="3" className="main-text"
                    sx={{
                      textTransform: 'none',
                      padding: '4px 10px',
                      pb: '10px',
                      flexGrow: 1,
                      marginRight: '3em',
                      minHeight: 'auto',
                      minWidth: 'auto',
                      fontSize: '14px',
                      fontWeight: 700,
                      lineHeight: '19.1px',
                      textAlign: 'left',
                      mr: 2,
                      '&.Mui-selected': {
                        color: 'rgba(80, 82, 178, 1)'
                      },
                      "@media (max-width: 600px)": {
                        mr: 0, borderRadius: '4px', '&.Mui-selected': {
                          backgroundColor: 'rgba(249, 249, 253, 1)',
                          border: '1px solid rgba(220, 220, 239, 1)'
                        },
                      }
                    }} />
                </TabList>
              )}
            </Box>

            {status !== 'PIXEL_INSTALLATION_NEEDED' && !isLoading && activeTab === "3" && (
              <Box sx={{
                border: '1px solid #E4E4E4',
                mt: 2.5,
                width: '86%',
                position: 'fixed',
                top: '7rem',
                "@media (max-width: 700px)": { display: 'none' }

              }}></Box>)}
          </Box>
        </Box>
        <Box sx={{
          '@media (max-width: 600px)':
          {

          }
        }}>

          {status === 'PIXEL_INSTALLATION_NEEDED' && !isLoading ? (
            <Box sx={centerContainerStyles}>
              <Typography variant="h5" sx={{ mb: 2, fontSize: '0.9rem' }}>
                Pixel Integration isn&apos;t completed yet!
              </Typography>
              <Image src={'/pixel_installation_needed.svg'} width={300} height={241} alt="pixel installed needed" />
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
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                '&:hover': {
                  backgroundColor: '#5052B2'
                },
                borderRadius: '4px',
              }}>
                Setup Pixel
              </Button>
            </Box>
          ) : (!isLoading && (
            <>
              <TabPanel value="1" sx={{ mt: 6, "@media (max-width: 600px)": { mt: 10 } }}>
                <UserIntegrationsList
                  integrationsCredentials={integrationsCredentials}
                  changeTab={changeTab}
                  integrations={integrations}
                  handleSaveSettings={handleSaveSettings}
                  handleDeleteSettings={handleDeleteSettings}
                />
              </TabPanel>
              <TabPanel value="2" sx={{ mt: 6, "@media (max-width: 600px)": { mt: 8 } }}>
                <IntegrationsAvaliable
                  integrationsCredentials={integrationsCredentials}
                  integrations={integrations}
                  handleSaveSettings={handleSaveSettings}
                />
              </TabPanel>
              <TabPanel value="3" >
                <Box sx={{ mt: 6, "@media (max-width: 600px)": { mt: 8 } }}>
                  <PixelManagment />
                </Box>
              </TabPanel>
            </>
          ))}
        </Box>
      </TabContext>
      {showSlider && <Slider />}
    </>
  );
};

const IntegraitonsPage = () => {
  return (
    <SliderProvider>
      <Suspense fallback={<CustomizedProgressBar />}>
        <Integrations />
      </Suspense>
    </SliderProvider>
  )
}

export default IntegraitonsPage;