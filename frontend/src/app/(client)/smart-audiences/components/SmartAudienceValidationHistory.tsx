import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, IconButton, Backdrop, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import dayjs from 'dayjs';

interface DetailsPopupProps {
  open: boolean;
  onClose: () => void;
  id?: string
  smartAudience?: SmartAudience[]
}

interface ValidationHistoryResponse {
    [category: string]: ValidationHistory
}


interface ValidationHistory {
    types_validation?: string[]
    count_submited: number
    count_validated: number
    count_cost: number
}

interface SmartAudience {
    title?: string, 
    value?: number | Date
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
        .split('_')
        .map(subItem => subItem.charAt(0).toUpperCase() + subItem.slice(1))
        .join(' ')
}


const ValidationsTable = ({ validations }: {validations: ValidationHistoryResponse[]}) => (
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
          <Typography className='first-sub-title'>Details</Typography>
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
              <Box sx={{display: "flex", width: "25%"}}><Typography sx={{flex: 1}} className='table-data'>Validation Parameter</Typography></Box>
              <Box sx={{display: "flex", width: "25%"}}><Typography sx={{flex: 1}} className='table-data'>Records Submited</Typography></Box>
              <Box sx={{display: "flex", width: "25%"}}><Typography sx={{flex: 1}} className='table-data'>Validated</Typography></Box>
              <Box sx={{display: "flex", width: "25%"}}><Typography sx={{flex: 1}} className='table-data'>Cost</Typography></Box>
          </Box>
          {validations.map((validationObj, index) => (
            <Box key={index} sx={{ width: "100%" }}>
                {Object.entries(validationObj).map(([key, validation]: [string, ValidationHistory], subIndex) => (
                    <Box
                        key={subIndex}
                        sx={{
                            width: "100%",
                            pt: "12px",
                            pb: "12px",
                            gap: 4,
                            borderBottom: index === validations.length - 1 ? "none" : "1px solid rgba(240, 240, 240, 1)",
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                        >
                        <Box sx={{display: "flex", flexDirection: "column", width: "25%", gap: 1}}> 
                            <Typography sx={{ flex: 1 }} className="black-table-header">{setSourceType(key)}</Typography>
                            <Box sx={{ display: "inline-flex", flexWrap: "wrap", gap: 1 }}>
                                {validation.types_validation?.map((type, index) => ( //["dnc_filter", "MX", "confirmation", "job_validation"]
                                    <Box sx={{border: "1px solid rgba(229, 229, 229, 1)", p: "2px 8px", borderRadius: "3px", textAlign: "center"}}> 
                                        <Typography key={index} className="paragraph">
                                            {setSourceType(type)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                        
                        <Typography sx={{ flex: 1 }} className="black-table-header">
                            {validation.count_submited}
                        </Typography>
                        <Typography sx={{ flex: 1 }} className="black-table-header">
                            {validation.count_validated}
                        </Typography>
                        <Typography sx={{ flex: 1 }} className="black-table-header">
                            {validation.count_cost} Credits
                        </Typography>
                    </Box>
                ))}
            </Box>
          ))}
      </Box>
  </Box>
);




const ValidationsHistoryPopup: React.FC<DetailsPopupProps> = ({ open, onClose, id, smartAudience }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [validations, setValidations] = useState<ValidationHistoryResponse[]>([]);

    const fetchValidationHistory = async () => {
        setIsLoading(true)
        try {
            const response = await axiosInstance.get(`/audience-smarts/${id}/validation-history`);
            if (response.status === 200) {
              console.log([...response.data, { "total": {count_submited: 0, count_validated: 0, count_cost: 0} }])
              setValidations([...response.data, { "total": {count_submited: 0, count_validated: 0, count_cost: 0} }])
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
      fetchValidationHistory()
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
            Validation Package History
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
            <Box sx={{ width: "100%", pt: 3, pb: 2, px: 3}}>
                <Box sx={{ width: "100%", display: 'flex', alignItems: "center", flexDirection: "column", justifyContent: "space-between", py: "20px", px: "24px", border: "1px solid rgba(240, 240, 240, 1)", boxShadow: "rgba(0, 0, 0, 0.2)"}}>
                    {smartAudience?.map((el: any, index: number) => {
                        const isDateRow = index === 0;
                        const formattedValue = isDateRow ? dayjs(el.value).format('MM/DD/YYYY') : el.value;

                        return ( 
                            <Box key={index} sx={{ 
                                width: "100%", 
                                pt: "12px", 
                                pb: index !== smartAudience.length - 1 ? "12px" : 0, 
                                gap: 4, 
                                borderBottom: index !== smartAudience.length - 1 ? "1px solid rgba(240, 240, 240, 1)" : "none", 
                                display: "flex", 
                                justifyContent: "space-between"
                            }}>
                                <Typography className='black-table-header' style={{fontWeight: isDateRow ? 500 : 400}}>{el.title}</Typography>
                                <Typography className='black-table-header' style={{fontWeight: isDateRow ? 300 : 400}}>{formattedValue}</Typography>
                            </Box>
                        )
                    })}
                </Box>
            </Box>

            <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2, px: 3}}>
              <ValidationsTable validations={validations} />
            </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default ValidationsHistoryPopup;
