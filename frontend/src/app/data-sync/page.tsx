"use client";
import {
  Box,
  Typography,
  Button,
} from "@mui/material";
import React, { useState, useEffect, Suspense } from "react";
import { datasyncStyle } from "./datasyncStyle";
import CustomTooltip from "@/components/customToolTip";
import FilterListIcon from "@mui/icons-material/FilterList";
import Image from "next/image";
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { AxiosError } from "axios";
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
import AudiencePopup from "@/components/AudienceSlider";
import { useNotification } from "@/context/NotificationContext";

interface DataSyncProps {
  service_name?: string
}

const DataSync = () => {
  const router = useRouter();
  const { hasNotification } = useNotification();
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterPopup, setFilterPopup] = useState(false)
  const [filters, setFilters] = useState<any>()
  const [openCreateDataSyncPopup, setOpenCreateDataSyncPopup] = useState(false)
  const handleFilterPopupOpen = () => {
    setFilterPopup(true)
  }

  const handleAudiencePopupOpen = () => {
    setOpenCreateDataSyncPopup(true)
  }

  const handleAudiencePopupClose = () => {
    setOpenCreateDataSyncPopup(false)
  }
  const handleFilterPopupClose = () => {
    setFilterPopup(false)
  }

  const onApply = (filter: any) => {
    setFilters(filter)
  }

  useEffect(() => {
    handleIntegrationsSync()
}, []);

  const handleIntegrationsSync = async () => {
    try {
      setIsLoading(true)
      const response = await axiosInstance.get('/check-user-authorization');
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

  const installPixel = () => {
    router.push('/dashboard');
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
          ml: 2,
          pr: 1.5,
          "@media (max-width: 900px)": { 
            pt: hasNotification ? 5 : 0,
          },
          "@media (max-width: 400px)": { 
            pt: hasNotification ? 7 : 0,
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
            "@media (max-width: 900px)": { mb: 2 },
 
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
            title={"How data synch works and to customise your sync settings."}
            linkText="Learn more"
            linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/articles/data-sync"
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: 'end',
            mt: 2.05,
            gap: "15px",
            "@media (max-width: 900px)": {
              gap: "8px", 
            },
          }}
        >
            <Button
                onClick={handleAudiencePopupOpen}
                aria-haspopup="true"
                disabled={status === 'PIXEL_INSTALLATION_NEEDED'}
                sx={{
                    textTransform: 'none',
                    color: status === 'PIXEL_INSTALLATION_NEEDED' ? 'rgba(128, 128, 128, 1)' : 'rgba(80, 82, 178, 1)',
                    border: '1px solid rgba(80, 82, 178, 1)',
                    borderRadius: '4px',
                    padding: '9px 16px',
                    opacity: status === 'PIXEL_INSTALLATION_NEEDED' ? '0.4' : '1',
                    minWidth: 'auto',
                    '@media (max-width: 900px)': {
                        display: 'none'
                    }
                }}
            >
                <Typography className='second-sub-title' sx={{
                    marginRight: '0.5em',
                    padding: 0.2,
                    textAlign: 'left',
                    color: '#5052B2 !important'
                }}>
                    Create Contact Sync
                </Typography>
            </Button>
          <Button
            onClick={handleFilterPopupOpen}
            aria-haspopup="true"
            sx={{
              textTransform: "none",
              color: "rgba(128, 128, 128, 1)",
              border: filters?.length > 0 ? '1px solid rgba(80, 82, 178, 1)' : "1px solid rgba(184, 184, 184, 1)",
              borderRadius: "4px",
              padding: "8px",
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
                color: filters?.length > 0 ? 'rgba(80, 82, 178, 1)' : "rgba(128, 128, 128, 1)",
              }}
            />
          </Button>
          <Button
            onClick={handleAudiencePopupOpen}
            aria-haspopup="true"
            sx={{
                textTransform: 'none',
                color: 'rgba(80, 82, 178, 1)',
                borderRadius: '4px',
                padding: '0',
                border: 'none',
                minWidth: 'auto',
                '@media (min-width: 901px)': {
                    display: 'none'
                }
            }}
        >
            <Image src='/add.svg' alt='logo' height={24} width={24} />
        </Button>
        </Box>
      </Box>
      <Box sx={{ width: "100%", pl: 0.5, pt: 0, pr: 1, "@media (max-width: 440px)": {pt: 3}}}>
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
            <DataSyncList filters={filters}/>
            </>)
          }
      </Box>
    </Box>
    <FilterDatasync open={filterPopup} onClose={handleFilterPopupClose} onApply={onApply}/>
    <AudiencePopup open={openCreateDataSyncPopup} onClose={handleAudiencePopupClose} />
      </>

  );
};

const DatasyncPage: React.FC = () => {
  return (
    <Suspense fallback={<CustomizedProgressBar />}>
      <DataSync />
    </Suspense>
  );

};

export default DatasyncPage;
