import React, { useEffect, useState } from "react";
import { Drawer, Box, Typography, Link, IconButton, Divider } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from "@/axios/axiosInterceptorInstance";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';


dayjs.extend(relativeTime);

interface Notification {
    id: number;
    sub_title: string;
    text: string;
    is_checked: boolean;
    created_at: number;
}

interface NotificationPopupProps {
    open: boolean;
    onClose: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ open, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (open) {
            setLoading(true);
            const accessToken = localStorage.getItem("token");
            if (accessToken) {
                const fetchData = async () => {
                    try {
                        const response = await axiosInstance.get("/notification");
                        console.log(response.data)
                        setNotifications(response.data);
                    } catch (error) {
                        console.error(error);
                    } finally {
                        setLoading(false);
                    }
                };
                fetchData();
            }
        }
    }, [open]);

    

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: '620px',
                    position: 'fixed',
                    zIndex: 1301,
                    top: 0,
                    bottom: 0,
                    '@media (max-width: 900px)': {
                        width: '100%'
                    }
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 3.5, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                <Typography variant="h6" className="first-sub-title" sx={{ textAlign: 'center' }}>
                    Notifications
                </Typography>
                <IconButton onClick={onClose} sx={{ p: 0 }}>
                    <CloseIcon sx={{ width: '20px', height: '20px' }} />
                </IconButton>
            </Box>
            <Divider />
            <Box sx={{ margin: '16px 24px 24px 24px', border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                {loading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            height: '100%',
                            minHeight: '85vh'
                        }}
                    >
                        {/* Spinner */}
                        <Box sx={{
                            border: '8px solid #f3f3f3',
                            borderTop: '8px solid #3498db',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            animation: 'spin 1s linear infinite',
                        }} />
                    </Box>
                ) : (
                    notifications.sort((a, b) => b.created_at - a.created_at).map((notification) => (
                        <Box key={notification.id} sx={{ width: '100%', position: 'relative', padding: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            borderBottom: '1px solid #E8E9EB',
                            '&:last-child': {
                                borderBottom: 'none'
                            }
                         }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                position: 'relative',
                                pl: notification.is_checked ? 2 : 0,
                                '&:before': notification.is_checked == false ? {} : {
                                    content: '""',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#5052B2',
                                    position: 'absolute',
                                    left: 0,
                                    top: '6px',
                                }
                            }}>
                                <Typography variant="h6" className="second-sub-title" sx={{
                                    fontWeight: '500 !important',
                                    lineHeight: '20px !important'
                                }}>
                                    {notification.sub_title}
                                </Typography>
                                <Typography variant="body1" className='paragraph' sx={{
                                    fontWeight: '500 !important',
                                    lineHeight: '16px !important',
                                    color: '#5F6368 !important'
                                }} >
                                    {dayjs.unix(notification.created_at).fromNow()}
                                </Typography>
                            </Box>
                            <Typography variant="body1" className='paragraph' sx={{ 
                                lineHeight: '16px !important',
                                color: '#5F6368 !important'
                            }} >
                            {notification.text} {/*Тут остальной текст*/}
                                {' '}<Link
                                sx={{
                                    textDecoration: 'none',
                                    color: '#146EF6 !important'
                                }}
                                href='/settings?section=subscription'
                                >
                                Choose Plan
                                </Link>
                                </Typography>
                        </Box>
                    ))
                )}
            </Box>
        </Drawer>
    );
}

export default NotificationPopup;
