"use client";
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Box, Typography, Button, IconButton, List, ListItemText, ListItemButton, Popover, DialogActions, DialogContent, DialogContentText, Tooltip } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosInstance from "@/axios/axiosInterceptorInstance";
import dayjs from 'dayjs';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import { useNotification } from '@/context/NotificationContext';
import { useSSE } from '../../../../context/SSEContext';
import { MoreVert } from '@mui/icons-material';
import { SliderProvider } from '../../../../context/SliderContext';
import { showToast, showErrorToast } from '@/components/ToastNotification';
import ProgressBar from '../../sources/components/ProgressLoader';
import ThreeDotsLoader from '../../sources/components/ThreeDotsLoader';
import { getUseCaseIcon } from '../components/utils/getUseCaseIcon'
import Image from 'next/image';
import { getStatusStyle } from '../components/utils/getStatusStyle';

interface SmartAudienceSource {
    id: string,
    name: string,
    use_case_alias: string,
    created_by: string,
    created_at: Date,
    total_records: number,
    validated_records: number,
    active_segment_records: number,
    processed_active_segment_records: number,
    status: string,
    integrations: string[] | null
}

const SourcesList: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const data = searchParams.get('data'); 
    const createdSmartAudienceSource: SmartAudienceSource = data ? JSON.parse(data) : null;
    const { hasNotification } = useNotification();
    const [loading, setLoading] = useState(false);

    const [createdData, setCreatedData] = useState<SmartAudienceSource>(createdSmartAudienceSource);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [anchorElFullName, setAnchorElFullName] = React.useState<null | HTMLElement>(null);
    const [selectedName, setSelectedName] = React.useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isOpenFullName = Boolean(anchorElFullName);

    const { smartAudienceProgress, validationProgress } = useSSE();
    const progress = smartAudienceProgress[createdData.id];
    const progressValidation = validationProgress[createdData.id];

    const handleClosePopoverFullName = () => {
        setAnchorElFullName(null);
        setSelectedName(null);
    };

    useEffect(() => {
        console.log("pooling");
    
        if (!intervalRef.current) {
            console.log("pooling started");
            intervalRef.current = setInterval(() => {
                const hasPending = createdData.active_segment_records !== createdData.processed_active_segment_records || createdData.status === "validating";
                
                if (hasPending) {
                    console.log("Fetching due to pending records");
                
                    fetchData();
                } else {
                    console.log("No pending records, stopping interval");
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                }
            }, 2000);
        }
    
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                console.log("interval cleared");
            }
        };
    }, [createdData]);
      

    const fetchData = async () => {
        try {
            if (createdData) {
                const response = await axiosInstance.get(`/audience-smarts/get-processing-smart-source?&id=${createdData.id}`)
                const updatedItem = response.data
                console.log(updatedItem)
                setCreatedData(updatedItem);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };


    const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClosePopover = () => {
        setAnchorEl(null);
    };

    const isOpen = Boolean(anchorEl);

    const handleDeleteSource = async () => {
        setLoading(true);
        try {
            if (createdData && createdData.id) {
                const response = await axiosInstance.delete(`/audience-smarts/${createdData.id}`);
                if (response.status === 200 && response.data) {
                    showToast("Source successfully deleted!");
                    router.push("/smart-audiences")
                }
            }
        } catch {
            showErrorToast("Error deleting source")
        } finally {
            setLoading(false);
            handleCloseConfirmDialog();
            handleClosePopover()
        }
    };

    const handleOpenConfirmDialog = () => {
        setOpenConfirmDialog(true);
    };

    const handleCloseConfirmDialog = () => {
        setOpenConfirmDialog(false);
    };


    const buttonClickAllSources = () => {
        if (sessionStorage.getItem('filtersBySmarts')) {
            sessionStorage.setItem('filtersBySmarts', JSON.stringify({}));
        }
        router.push("/smart-audiences")
    }

    const preRenderStatus = (status: string) => {
        if (status === "N_a") {
            return "Ready"
        }
        return status
    }
    return (
        <>
            {loading && (
                <CustomizedProgressBar/>
            )}
            <Box sx={{
                display: 'flex', flexDirection: 'column', overflow: 'auto', pr: 2,
                '@media (max-width: 900px)': {
                    height: 'calc(100vh - 4.25rem)'
                }
            }}>
                <Box sx={{display: "flex", flexDirection: 'column'}}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: hasNotification ? '1rem' : '0.5rem',
                            flexWrap: 'wrap',
                            pl: '0.5rem',
                            gap: '15px',
                            mt: 3,
                            '@media (max-width: 900px)': {
                                marginTop: hasNotification ? '3rem' : '1rem',
                            }
                        }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                            <Typography className='first-sub-title'>
                                Generate Smart Audience
                            </Typography>
                        </Box>
                        <Box sx={{
                                display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px', pt: '4px',
                                '@media (max-width: 900px)': {
                                    gap: '8px'
                                }
                            }}>
                        </Box>
                    </Box>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: hasNotification ? '1rem' : '0.5rem',
                                flexWrap: 'wrap',
                                pl: '0.5rem',
                                gap: '15px',
                                '@media (max-width: 900px)': {
                                    marginTop: hasNotification ? '3rem' : '1rem',
                                },
                            }}>

                        </Box>
                        <Box sx={{
                            flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '100%', pl: 0, pr: 0, pt: '14px', pb: '20px',
                            '@media (max-width: 900px)': {
                                pt: '2px',
                                pb: '18px'
                            }
                        }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    padding: 2,
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 2,
                                    '@media (max-width: 900px)': {
                                        alignItems: "start"
                                    }
                                }}
                                >
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 5,
                                        width: "100%",
                                        justifyContent: "space-between",
                                        "@media (max-width: 900px)": {
                                        flexDirection: "column",
                                        gap: 2
                                        },
                                    }}
                                    >
                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        <Typography variant="body2" className="table-heading">
                                            Name
                                        </Typography>
                                        <Typography variant="subtitle1" className="table-data">
                                            {createdData?.name}
                                        </Typography>
                                    </Box>
                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1, alignItems: 'center'}}>
                                        <Typography
                                            variant="body2"
                                            className="table-heading"
                                            sx={{ textAlign: "left" }}
                                        >
                                            Use Case
                                        </Typography>
                                        <Typography variant="subtitle1" className="table-data">
                                            {/* {setSourceOrigin(createdData?.source_origin)} */}
                                            {getUseCaseIcon(createdData?.use_case_alias || "")}
                                        </Typography>
                                    </Box>

                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1, alignItems: 'center'}}>
                                        <Typography
                                            variant="body2"
                                            className="table-heading"
                                            sx={{ textAlign: "left" }}
                                        >
                                            Validations
                                        </Typography>
                                        <Typography variant="subtitle1" className="table-data">
                                        {createdData.status === "unvalidated" 
                                            ? <Image src="./danger_yellow.svg" alt='danger' width={20} height={20}/>
                                            : createdData.status === "n_a"
                                                ? "N/A"
                                                : createdData.validated_records === 0 && createdData.status === "validating" && !progressValidation?.total
                                                    ? <Box sx={{display: "flex", justifyContent: "center"}}><ThreeDotsLoader /></Box> 
                                                    : progressValidation?.total > createdData.validated_records
                                                        ? progressValidation?.total.toLocaleString('en-US')
                                                        : createdData.validated_records.toLocaleString('en-US')}
                                        </Typography>
                                    </Box>

                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        <Typography
                                            variant="body2"
                                            className="table-heading"
                                            sx={{ textAlign: "left" }}
                                        >
                                            Created
                                        </Typography>
                                        <Typography variant="subtitle1" className="table-data">
                                        {createdData?.created_by + ", " + 
                                        (dayjs(createdData?.created_at).isValid() 
                                        ? dayjs(createdData?.created_at).format('MMM D, YYYY') 
                                        : '--')}
                                        </Typography>
                                    </Box>

                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        <Typography variant="body2" className="table-heading">
                                            Total Universe
                                        </Typography>
                                        <Typography variant="subtitle1" className="table-data">
                                        {createdData?.total_records.toLocaleString('en-US')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        <Typography
                                            variant="body2"
                                            className="table-heading"
                                            sx={{ textAlign: "left" }}
                                        >
                                            Active Segment
                                        </Typography>
                                        
                                        <Typography variant="subtitle1" className="table-data">
                                        {(progress?.processed && progress?.processed === createdData?.active_segment_records) || (createdData?.processed_active_segment_records ===  createdData?.active_segment_records && (createdData.status === "unvalidated"  || createdData?.processed_active_segment_records !== 0))
                                            ? createdData.active_segment_records.toLocaleString('en-US')
                                            : createdData?.processed_active_segment_records > progress?.processed
                                                ? <ProgressBar progress={{ total: createdData?.active_segment_records, processed: createdData?.processed_active_segment_records}} />
                                                : <ProgressBar progress={{...progress, total: createdData.active_segment_records}} />
                                        }
                                        </Typography>
                                    </Box>
                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        
                                        <Typography variant="body2" className="table-heading">
                                            Status
                                        </Typography>
                                        {createdData && (
                                            <Typography component="div" sx={{
                                                width: "100px",
                                                margin: 0,
                                                background: getStatusStyle(
                                                    progressValidation?.total 
                                                    ? "Ready"
                                                    : preRenderStatus(createdData.status.charAt(0).toUpperCase() + createdData.status.slice(1))
                                                ).background,
                                                padding: '3px 8px',
                                                borderRadius: '2px',
                                                fontFamily: 'Roboto',
                                                fontSize: '12px',
                                                fontWeight: '400',
                                                lineHeight: '16px',
                                                textAlign: "center",
                                                color: getStatusStyle(
                                                    progressValidation?.total 
                                                    ? "Ready"
                                                    : preRenderStatus(createdData.status.charAt(0).toUpperCase() + createdData.status.slice(1))
                                                ).color,
                                            }}>
                                                {progressValidation?.total 
                                                    ? "Ready"
                                                    : preRenderStatus(createdData.status.charAt(0).toUpperCase() + createdData.status.slice(1))
                                                    }
                                            </Typography>
                                    )}
                                    </Box>
                                    {/* need chnage < on !== */}
                                    <IconButton onClick={(event) => handleOpenPopover(event)} sx={{ '@media (max-width: 900px)': {display: 'none'}, ':hover': { backgroundColor: 'transparent' }}} >
                                        <MoreVert sx={{color: "rgba(32, 33, 36, 1)"}} height={8} width={24}/>
                                    </IconButton>
                                </Box>
                                    {/* need chnage < on !== */}
                                <IconButton onClick={(event) => handleOpenPopover(event)} sx={{ display: 'none', '@media (max-width: 900px)': {display: 'block'}, ':hover': { backgroundColor: 'transparent' }}} >
                                        <MoreVert sx={{color: "rgba(32, 33, 36, 1)"}} height={8} width={24}/>
                                </IconButton>             
                            </Box>
                            <Box sx={{display: "flex", justifyContent: "end", gap: 2, mt: 2, alignItems: "center"}}>
                                <Button
                                    variant="outlined"
                                    onClick={ buttonClickAllSources }
                                    sx={{
                                        height: '40px',
                                        borderRadius: '4px',
                                        textTransform: 'none',
                                        fontSize: '14px',
                                        lineHeight: "19.6px",
                                        fontWeight: '500',
                                        color: '#5052B2',
                                        borderColor: '#5052B2',
                                        '&:hover': {
                                            backgroundColor: 'rgba(80, 82, 178, 0.1)',
                                            borderColor: '#5052B2',
                                        },
                                    }}
                                >
                                    All Smart Audiences
                                </Button>
                                <Button
                                    variant="contained"/* need chnage < on !== */
                                    onClick={() => router.push(`/smart-audiences/builder`)}
                                    className='second-sub-title'
                                    sx={{
                                        backgroundColor: 'rgba(56, 152, 252, 1)',
                                        textTransform: 'none',
                                        padding: '10px 24px',
                                        color: '#fff !important',
                                        ":hover": {
                                            backgroundColor: "rgba(62, 64, 142, 1)"},
                                        ":active": {
                                            backgroundColor: "rgba(56, 152, 252, 1)"},
                                        ":disabled": {
                                            backgroundColor: "rgba(56, 152, 252, 1)",
                                            opacity: 0.6,
                                        },
                                    }}
                                >
                                    Generate Smart Audience
                                </Button>
                            </Box>
                        </Box>
                        <Popover
                            open={isOpenFullName}
                            anchorEl={anchorElFullName}
                            onClose={handleClosePopoverFullName}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "left",
                            }}
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "left",
                            }}
                            PaperProps={{
                                sx: {
                                    width: "184px",
                                    height: "108px",
                                    borderRadius: "4px 0px 0px 0px",
                                    border: "0.2px solid #ddd",
                                    padding: "8px",
                                    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                                },
                            }}
                        >
                            <Box sx={{ maxHeight: "92px", overflowY: "auto", backgroundColor: 'rgba(255, 255, 255, 1)' }}>
                                {selectedName?.split(",").map((part, index) => (
                                    <Typography
                                        key={index}
                                        variant="body2"
                                        className='second-sub-title'
                                        sx={{
                                            wordBreak: "break-word",
                                            backgroundColor: 'rgba(243, 243, 243, 1)',
                                            borderRadius: '4px',
                                            color: 'rgba(95, 99, 104, 1) !important',
                                            marginBottom: index < selectedName?.split(",").length - 1 ? "4px" : 0, 
                                        }}
                                    >
                                        {part.trim()}
                                    </Typography>
                                ))}
                            </Box>
                        </Popover>
                        <Popover
                            open={isOpen}
                            anchorEl={anchorEl}
                            onClose={handleClosePopover}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                            >
                                <List
                                    sx={{ 
                                    width: '100%', maxWidth: 360}}
                                    >
                                    {/* <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {
                                            handleClosePopover()
                                            // router.push(`/lookalikes/${createdData?.id}/builder`)
                                        }}>
                                        <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Create Sync"/>
                                    </ListItemButton> */}
                                    {/* <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {
                                            // handleOpenConfirmDialog()
                                        }}>
                                        <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Clone"/>
                                    </ListItemButton> */}
                                    <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {
                                            handleOpenConfirmDialog()
                                        }}>
                                    <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Remove"/>
                                    </ListItemButton>
                                    <Popover
                                        open={openConfirmDialog}
                                        onClose={handleCloseConfirmDialog}
                                        anchorEl={anchorEl}
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                                        slotProps={{ paper: {
                                            sx: {
                                                padding: '0.125rem',
                                                width: '15.875rem',
                                                boxShadow: 0,
                                                borderRadius: '8px',
                                                border: '0.5px solid rgba(175, 175, 175, 1)'
                                            }
                                        }}}
                                    >
                                        <Typography className="first-sub-title" sx={{ paddingLeft: 2, pt: 1, pb: 0 }}>
                                            Confirm Deletion
                                        </Typography>
                                        <DialogContent sx={{ padding: 2 }}>
                                            <DialogContentText className="table-data">
                                                Are you sure you want to delete this source?
                                            </DialogContentText>
                                        </DialogContent>
                                        <DialogActions>
                                        <Button
                                            className="second-sub-title"
                                            onClick={handleCloseConfirmDialog}
                                            sx={{
                                                backgroundColor: '#fff',
                                                color: 'rgba(56, 152, 252, 1) !important',
                                                fontSize: '14px',
                                                textTransform: 'none',
                                                padding: '0.75em 1em',
                                                border: '1px solid rgba(56, 152, 252, 1)',
                                                maxWidth: '50px',
                                                maxHeight: '30px',
                                                '&:hover': { backgroundColor: '#fff', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)' },
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="second-sub-title"
                                            onClick={handleDeleteSource}
                                            sx={{
                                                backgroundColor: 'rgba(56, 152, 252, 1)',
                                                color: '#fff !important',
                                                fontSize: '14px',
                                                textTransform: 'none',
                                                padding: '0.75em 1em',
                                                border: '1px solid rgba(56, 152, 252, 1)',
                                                maxWidth: '60px',
                                                maxHeight: '30px',
                                                '&:hover': { backgroundColor: 'rgba(56, 152, 252, 1)', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)' },
                                            }}
                                        >
                                            Delete
                                        </Button>
                                        </DialogActions>
                                    </Popover>
                                </List>
                        </Popover>

                    </Box>
                </Box>
            </Box>
        </>
    );
};

const SourcesListPage: React.FC = () => {
    return (
        <Suspense fallback={<CustomizedProgressBar />}>
            <SliderProvider>
                <SourcesList />
            </SliderProvider>
        </Suspense>
    );
};

export default SourcesListPage;
