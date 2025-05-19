import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, IconButton, Backdrop, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import DownloadIcon from '@mui/icons-material/Download';

interface DetailsPopupProps {
  open: boolean;
  onClose: () => void;
  id?: string
  name?: string
}

interface DataSource {
  name: string
  source_type: string
  size: number
}

const BorderLinearProgress = styled(LinearProgress)(() => ({
    height: 4,
    borderRadius: 0,
    backgroundColor: '#c6dafc',
    '& .MuiLinearProgress-bar': {
      borderRadius: 5,
      backgroundColor: '#4285f4',
    },
  }));

const setSourceType = (sourceType: string) => {
  return sourceType
      .split(',')
      .map(item =>
          item
              .split('_')
              .map(subItem => subItem.charAt(0).toUpperCase() + subItem.slice(1))
              .join(' ')
      )
      .join(', ');
}


const DataSourceTable = ({ title, dataSources }: {title: string, dataSources: DataSource[]}) => (
  <Box sx={{ width: "100%" }}>
      <Box sx={{ 
        width: "100%", 
        display: 'flex', 
        alignItems: "center", 
        justifyContent: "space-between", 
        py: "20px", 
        px: "24px", 
        border: "1px solid rgba(240, 240, 240, 1)", 
        boxShadow: "rgba(0, 0, 0, 0.2)"}}>
          <Typography className='first-sub-title'>{title}</Typography>
      </Box>
      <Box sx={{ 
        width: "100%", 
        display: 'flex', 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "space-between", 
        py: "20px", 
        px: "24px", 
        border: "1px solid rgba(240, 240, 240, 1)", 
        borderTop: "none", 
        boxShadow: "rgba(0, 0, 0, 0.2)"}}>
          <Box sx={{ width: "100%", py: 1, gap: 4, borderBottom: "1px solid rgba(240, 240, 240, 1)", display: "flex", justifyContent: "space-between"}}>
              <Typography sx={{flex: 1}} className='table-data'>Name</Typography>
              <Typography sx={{flex: 1}} className='table-data'>Type</Typography>
              <Typography sx={{flex: 1}} className='table-data'>Size</Typography>
          </Box>
          {dataSources?.map((el: DataSource, index: number) => (
              <Box key={index} sx={{ 
                width: "100%", 
                pt: "12px", 
                pb: index !== dataSources.length - 1 ? "12px" : 0, 
                gap: 4, 
                borderBottom: index !== dataSources.length - 1 ? "1px solid rgba(240, 240, 240, 1)" : "none", 
                display: "flex", 
                justifyContent: "space-between"
              }}>
                  <Typography sx={{flex: 1}} className='black-table-header'>{el.name}</Typography>
                  <Typography sx={{flex: 1}} className='black-table-header'>{setSourceType(el.source_type)}</Typography>
                  <Typography sx={{flex: 1}} className='black-table-header'>{el.size}</Typography>
              </Box>
          ))}
      </Box>
  </Box>
);




const DetailsPopup: React.FC<DetailsPopupProps> = ({ open, onClose, id, name }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [dataSourcesExclude, setDataSourcesExclude] = useState<DataSource[]>([]);
    const [dataSourcesInclude, setDataSourcesInclude] = useState<DataSource[]>([]);

    const fetchDataSources = async () => {
        setIsLoading(true)
        try {
            const response = await axiosInstance.get(`/audience-smarts/${id}/data-sources`);
            if (response.status === 200) {
              const {includes, excludes} = response.data
              setDataSourcesExclude(excludes)
              setDataSourcesInclude(includes)
            }
        } 
        catch {
        }
        finally {
            setIsLoading(false)
        }
    }
 

  useEffect(() => {
    if (open) {
      fetchDataSources()
    }
  }, [open]);


  return (
    <>
      <Backdrop open={open} sx={{ zIndex: 100, color: "#fff" }} />
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: "40%",
            position: "fixed",
            top: 0,
            bottom: 0,
            "@media (max-width: 600px)": {
              width: "100%",
            },
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.01)'
            }
          }
        }}
      >
        {isLoading && (
            <Box
                sx={{
                width: '100%',
                position: 'fixed',
                top: '4.2rem',
                zIndex: 1200,   
                }}
            >
                <BorderLinearProgress variant="indeterminate" />
            </Box>
        )}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75em 1em 0.925em 1em",
            borderBottom: "1px solid #e4e4e4",
            position: "sticky",
            top: 0,
            zIndex: 1200,
            backgroundColor: "#fff",
          }}
        >
          <Typography
            variant="h6"
            className='first-sub-title'
            sx={{
              textAlign: "center",
            }}
          >
            Smart Audience
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "row" }}>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

        </Box>
        <Box
          sx={{
            p: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            position: "relative",
            height: '100%',
            width: '100%'
          }}
        >
            <Box sx={{ width: "100%", pt: 3, pb: 2, px: 3, border: "1px solid rgba(240, 240, 240, 1)"}}>
                <Box sx={{ width: "100%", display: 'flex', alignItems: "center", justifyContent: "space-between", py: "20px", px: "24px", border: "1px solid rgba(240, 240, 240, 1)", boxShadow: "rgba(0, 0, 0, 0.2)"}}>
                    <Typography className='first-sub-title'>{name}</Typography>
                    <IconButton size="small">
                        <DownloadIcon fontSize='medium' sx={{color: 'rgba(128, 128, 128, 1)'}}/>
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2, px: 3}}>
              <DataSourceTable title="Included" dataSources={dataSourcesInclude} />
              <DataSourceTable title="Excluded" dataSources={dataSourcesExclude} />
            </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default DetailsPopup;
