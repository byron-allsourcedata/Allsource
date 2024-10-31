import React, { ReactNode, useEffect, useState } from "react";
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
                        setNotifications(response.data);
                        const dismiss = axiosInstance.post("/notification/dismiss");
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

    const keywords: { word: string; link: string }[] = [
        { word: "Enable Overage", link: "/settings?section=billing" },
        { word: "billing", link: "/settings?section=billing" },
        { word: "Enable", link: "/settings?section=billing" },
        { word: "Upgrade", link: "/settings?section=subscription" },
        { word: "Choose a plan", link: "/settings?section=subscription" }
    ];

    const transformTextToLinks = (text: string | null): JSX.Element => {
        if (!text) {
            return <span></span>;
        }

        const regex = new RegExp(`(${keywords.map(k => k.word).join('|')})`, 'g');

        const parts = text.split(regex).map((part, index) => {
            const keyword = keywords.find(k => k.word === part);
            if (keyword) {
                return (
                    <Link key={index} className="paragraph" href={keyword.link} sx={{ textDecoration: 'none', color: 'rgba(20, 110, 246, 1) !important' }}>
                        {part}
                    </Link>
                );
            }
            return part;
        });
        return <>{parts}</>;
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            sx={{zIndex: 1400,}}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.8, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
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
                        <Box key={notification.id} sx={{
                            width: '100%', position: 'relative', padding: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            borderBottom: '1px solid #E8E9EB',
                            '&:last-child': {
                                borderBottom: 'none'
                            }
                        }}>
                            <Box sx={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                position: 'relative',
                                pl: notification.is_checked == false ? 2 : 0,
                                '&:before': notification.is_checked == true ? {} : {
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
                            <Typography
                                key={notification.id}
                                variant="body1"
                                className="paragraph"
                                sx={{
                                    lineHeight: '16px !important',
                                    color: '#5F6368 !important'
                                }}
                            >
                                {transformTextToLinks(notification.text)}
                            </Typography>
                        </Box>
                    ))
                )}
            </Box>
        </Drawer>
    );
}

export default NotificationPopup;
