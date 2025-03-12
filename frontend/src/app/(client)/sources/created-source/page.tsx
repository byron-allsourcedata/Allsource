"use client";
import React, { useState, Suspense } from 'react';
import { Box, Typography, Button, IconButton, List, ListItemText, ListItemButton, Popover, DialogActions, DialogContent, DialogContentText } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosInstance from "@/axios/axiosInterceptorInstance";
import dayjs from 'dayjs';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import ThreeDotsLoader from '../components/ThreeDotsLoader';
import { useNotification } from '@/context/NotificationContext';
import { useSSE } from '../../../../context/SSEContext';
import { MoreVert } from '@mui/icons-material';
import { SliderProvider } from '../../../../context/SliderContext';
import ProgressBar from '../components/ProgressLoader';
import { showToast, showErrorToast } from '@/components/ToastNotification';


const SourcesList: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const data = searchParams.get('data'); 
    const createdSource = data ? JSON.parse(data) : null;
    const { hasNotification } = useNotification();
    const [loading, setLoading] = useState(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const { sourceProgress } = useSSE();


    const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClosePopover = () => {
        setAnchorEl(null);
    };

    const isOpen = Boolean(anchorEl);


    const setSourceOrigin = (sourceOrigin: string) => {
        return sourceOrigin === "pixel" ? "Pixel" : "CSV File"
    }

    const handleDeleteSource = async () => {
        setLoading(true);
        try {
            if (createdSource && createdSource.id) {
                const response = await axiosInstance.delete(`/audience-sources/${createdSource.id}`);
                if (response.status === 200 && response.data) {
                    showToast("Source successfully deleted!");
                    router.push("/sources")
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

    const setSourceType = (sourceType: string) => {
        return sourceType
            .split('_')
            .map((item: string) => item.charAt(0).toUpperCase() + item.slice(1))
            .join(' ');
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
                                Created Source  
                            </Typography>
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
                                            {createdSource?.name}
                                        </Typography>
                                    </Box>
                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        <Typography
                                            variant="body2"
                                            className="table-heading"
                                            sx={{ textAlign: "left" }}
                                        >
                                            Source
                                        </Typography>
                                        <Typography variant="subtitle1" className="table-data">
                                            {setSourceOrigin(createdSource?.source_origin)}
                                        </Typography>
                                    </Box>

                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        <Typography variant="body2" className="table-heading">
                                            Type
                                        </Typography>
                                        <Typography variant="subtitle1" className="table-data">
                                            {setSourceType(createdSource?.source_type)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        <Typography
                                            variant="body2"
                                            className="table-heading"
                                            sx={{ textAlign: "left" }}
                                        >
                                            Created By
                                        </Typography>
                                        <Typography variant="subtitle1" className="table-data">
                                            {createdSource?.created_by}
                                        </Typography>
                                    </Box>


                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        <Typography variant="body2" className="table-heading">
                                            Created Date
                                        </Typography>
                                        <Typography variant="subtitle1" className="table-data">
                                            {dayjs(createdSource?.created_at).isValid() ? dayjs(createdSource?.created_at).format('MMM D, YYYY') : '--'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        <Typography
                                            variant="body2"
                                            className="table-heading"
                                            sx={{ textAlign: "left" }}
                                        >
                                            Updated Date
                                        </Typography>
                                        <Typography variant="subtitle1" className="table-data">
                                            {dayjs(createdSource?.updated_at).isValid() ? dayjs(createdSource?.updated_at).format('MMM D, YYYY') : '--'}
                                        </Typography>
                                    </Box>

                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        <Typography variant="body2" className="table-heading">
                                            Number of Customers
                                        </Typography>
                                        <Typography variant="subtitle1" className="table-data">
                                        {createdSource?.id && (
                                            sourceProgress[createdSource.id]?.total
                                            ? sourceProgress[createdSource.id].total
                                            : <ThreeDotsLoader />
                                        )}
                                        </Typography>
                                    </Box>
                                    <Box sx={{display: "flex", flexDirection: "column", gap: 1}}>
                                        <Typography
                                            variant="body2"
                                            className="table-heading"
                                            sx={{ textAlign: "left" }}
                                        >
                                            Matched Records
                                        </Typography>
                                        <Typography variant="subtitle1" className="table-data">
                                            {createdSource?.id && (
                                                sourceProgress[createdSource.id]?.processed >= sourceProgress[createdSource.id]?.total && sourceProgress[createdSource.id]?.processed /*need chnage >= on ===*/
                                                ? sourceProgress[createdSource.id]?.matched
                                                : <ProgressBar progress={sourceProgress[createdSource.id]} />
                                            )}
                                        </Typography>
                                    </Box>
                                    {/* need chnage < on !== */}
                                    <IconButton disabled={createdSource?.id && sourceProgress[createdSource.id]?.processed < sourceProgress[createdSource.id]?.total} onClick={(event) => handleOpenPopover(event)} sx={{ '@media (max-width: 900px)': {display: 'none'}, ':hover': { backgroundColor: 'transparent' }}} >
                                        <MoreVert sx={{color: "rgba(32, 33, 36, 1)"}} height={8} width={24}/>
                                    </IconButton>
                                </Box>
                                    {/* need chnage < on !== */}
                                <IconButton disabled={createdSource?.id && sourceProgress[createdSource.id]?.processed < sourceProgress[createdSource.id]?.total} onClick={(event) => handleOpenPopover(event)} sx={{ display: 'none', '@media (max-width: 900px)': {display: 'block'}, ':hover': { backgroundColor: 'transparent' }}} >
                                        <MoreVert sx={{color: "rgba(32, 33, 36, 1)"}} height={8} width={24}/>
                                </IconButton>             
                            </Box>
                            <Box sx={{display: "flex", justifyContent: "end", gap: 2, mt: 2, alignItems: "center"}}>
                                <Button
                                    variant="outlined"
                                    onClick={() => router.push("/sources/builder")}
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
                                    Add Another Source
                                </Button>
                                <Button
                                    variant="contained"/* need chnage < on !== */
                                    disabled={createdSource?.id && sourceProgress[createdSource.id]?.processed < sourceProgress[createdSource.id]?.total}
                                    onClick={() => router.push(`/lookalikes/${createdSource?.id}/builder`)}
                                    className='second-sub-title'
                                    sx={{
                                        backgroundColor: 'rgba(80, 82, 178, 1)',
                                        textTransform: 'none',
                                        padding: '10px 24px',
                                        color: '#fff !important',
                                        ":hover": {
                                            backgroundColor: "rgba(62, 64, 142, 1)"},
                                        ":active": {
                                            backgroundColor: "rgba(80, 82, 178, 1)"},
                                        ":disabled": {
                                            backgroundColor: "rgba(80, 82, 178, 1)",
                                            opacity: 0.6,
                                        },
                                    }}
                                >
                                    Create Lookalike
                                </Button>
                            </Box>
                        </Box>
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
                                    <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {
                                            handleClosePopover()
                                            router.push(`/lookalikes/${createdSource?.id}/builder`)
                                        }}>
                                    <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary="Create Lookalike"/>
                                    </ListItemButton>
                                    <ListItemButton sx={{padding: "4px 16px", ':hover': { backgroundColor: "rgba(80, 82, 178, 0.1)"}}} onClick={() => {
                                            handleClosePopover()
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
                                                color: 'rgba(80, 82, 178, 1) !important',
                                                fontSize: '14px',
                                                textTransform: 'none',
                                                padding: '0.75em 1em',
                                                border: '1px solid rgba(80, 82, 178, 1)',
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
                                                backgroundColor: 'rgba(80, 82, 178, 1)',
                                                color: '#fff !important',
                                                fontSize: '14px',
                                                textTransform: 'none',
                                                padding: '0.75em 1em',
                                                border: '1px solid rgba(80, 82, 178, 1)',
                                                maxWidth: '60px',
                                                maxHeight: '30px',
                                                '&:hover': { backgroundColor: 'rgba(80, 82, 178, 1)', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)' },
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