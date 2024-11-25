import React, { ReactNode, useEffect, useState } from "react";
import { Dialog, Box, Typography, Link, IconButton, Divider, Popover } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from "@/axios/axiosInterceptorInstance";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { motion, AnimatePresence } from "framer-motion";
import { showErrorToast } from "./ToastNotification";

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
    anchorEl: HTMLElement | null;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ open, onClose, anchorEl }) => {
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const accessToken = localStorage.getItem("token");
        if (accessToken) {
            if (open) {
            const fetchData = async () => {
                try {
                    const response = await axiosInstance.get("/notification");
                    setNotifications(response.data);
                    if (open) {
                        const dismiss = axiosInstance.post("/notification/dismiss");
                    }
                } catch (error) {
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }
    }, [open]);

    const keywords = [
        { word: "Enable Overage", link: "/settings?section=billing" },
        { word: "billing", link: "/settings?section=billing" },
        { word: "Enable", link: "/settings?section=billing" },
        { word: "Upgrade", link: "/settings?section=subscription" },
        { word: "Choose a plan", link: "/settings?section=subscription" }
    ];

    const transformTextToLinks = (text: string | null): JSX.Element => {
        if (!text) return <span></span>;

        const regex = new RegExp(`(${keywords.map(k => k.word).join('|')})`, 'g');
        const parts = text.split(regex).map((part, index) => {
            const keyword = keywords.find(k => k.word === part);
            if (keyword) {
                return (
                    <Link key={index} href={keyword.link} sx={{ textDecoration: 'none', color: 'rgba(20, 110, 246, 1) !important' }}>
                        {part}
                    </Link>
                );
            }
            return part;
        });
        return <>{parts}</>;
    };

    const handleDeleteNotification = async (notificationId: number) => {
        try {
            setNotifications((prevNotifications) =>
                prevNotifications.filter((n) => n.id !== notificationId)
            );
            await axiosInstance.delete('/notification/delete', {
                data: { notification_id: notificationId },
            });
        } catch (error) {
            showErrorToast('Fail on delete notification. Please try delete later')
        }
    };

    return (
        <Popover
            open={open}
            onClose={onClose}
            sx={{ zIndex: 1400 }}
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
            PaperProps={{
                sx: {
                    width: '364px',
                    maxHeight: '530px',
                    overflowY: 'hidden',
                    overflowX: 'hidden',
                    boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)',
                    ml: -16,
                    "@media (max-width: 600px)": {
                        mt: 2,
                        ml: -2,
                        width: '24rem',
                        height: '530px',
                    },
                    "@media (max-width: 400px)": {
                        mt: 2,
                        ml: -0,
                        width: '24rem',
                        height: '33rem',
                    }
                },
            }}
        >
            <Box sx={{ display: 'flex', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1400, justifyContent: 'space-between', alignItems: 'center', padding: 3, pl: 1.5, borderBottom: '1px solid rgba(247, 247, 247, 1)' }}>
                <Typography variant="h6" className="first-sub-title" sx={{ textAlign: 'center' }}>
                    Notifications
                </Typography>
            </Box>
            <Divider />
            <Box sx={{ margin: '2px', overflowY: 'scroll', maxHeight: '400px' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
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
                    <AnimatePresence>
                        {notifications.sort((a, b) => b.created_at - a.created_at).map((notification) => (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Box key={notification.id} sx={{
                                    padding: 1.25,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    borderBottom: '1px solid #E8E9EB',
                                    position: 'relative',
                                    pl: notification.is_checked === false ? 2 : 1.25,
                                    '&:before': notification.is_checked === false ? {
                                        content: '""',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: '#5052B2',
                                        position: 'absolute',
                                        left: 4,
                                        top: '15px',
                                    } : {},
                                    '&:hover .delete-icon': {
                                        opacity: 1,
                                    },
                                    "@media (max-width: 600px)": {
                                        '&:hover .delete-icon': {
                                            opacity: 1,
                                        }
                                    }
                                }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="h6" className="second-sub-title" sx={{
                                            fontWeight: '500 !important',
                                            lineHeight: '20px !important',
                                        }}>
                                            {notification.sub_title}
                                        </Typography>
                                        <IconButton
                                            className="delete-icon"
                                            sx={{
                                                opacity: 0,
                                                transition: 'opacity 0.3s',
                                                "@media (max-width: 600px)": {
                                                    opacity: 1
                                                }
                                            }}
                                            onClick={() => handleDeleteNotification(notification.id)}
                                            size="small"
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
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
                            </motion.div>
                        ))
                        }</AnimatePresence>
                )}
            </Box>
        </Popover>
    );
}

export default NotificationPopup;
