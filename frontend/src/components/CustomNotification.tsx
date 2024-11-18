import React, { useState } from 'react';
import { Box, Button, Link, Typography } from '@mui/material';
import Image from 'next/image';
import axiosInstance from "@/axios/axiosInterceptorInstance";


interface CustomNotificationProps {
    id: number;
    message: string;
    showDismiss: boolean;
    onDismiss: () => void;
}

const CustomNotification: React.FC<CustomNotificationProps> = ({ id, message, showDismiss, onDismiss }) => {
    const [show, setShow] = useState(true)
    const handleDismiss = () => {
        try {
            const response = axiosInstance.post("/notification/dismiss", {
                notification_ids: [id]
            });
            setShow(false);
            onDismiss();
        } catch (error) {
        }
    }

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
                    <Link key={index} className="second-sub-title" href={keyword.link} sx={{ textDecoration: 'none', color: 'rgba(20, 110, 246, 1) !important', '@media (max-width: 600px)': { fontSize: '11px !important'}, }}>
                        {part}
                    </Link>
                );
            }
            return part;
        });
        return <>{parts}</>;
    };
    return (
        (show &&  
        <Box
            sx={{
                display: 'flex',
                top: '4.25rem',
                position: 'fixed',
                alignItems: 'center',
                border: '1px solid rgba(248, 70, 75, 1)',
                borderRadius: '6px',
                padding: '1.25rem 1.5rem',
                width: 'calc(100% - 20px)',
                marginLeft: '10px',
                maxHeight: '34px',
                zIndex: 1200,
                '@media (max-width: 900px)': { top: '4.75rem', zIndex: 60,},
                '@media (max-width: 600px)': { padding: '0.25rem 0.5rem', top: '4.75rem', maxHeight: '56px'},
                backgroundColor: '#fff',
            }}
        >
            <Image src="/danger-icon.svg" alt="Danger Icon"  width={20} height={20} />
            
            <Typography variant="body1" className='second-sub-title' sx={{ marginLeft: '8px', flexGrow: 1, '@media (max-width: 600px)': { fontSize: '10px !important'},  }}>
                {transformTextToLinks(message)}
            </Typography>

            {showDismiss && (
                <Button
                    onClick={handleDismiss}
                    className='second-sub-title'
                    sx={{
                        color: 'rgba(80, 82, 178, 1) !important',
                        textTransform: 'none',
                        '@media (max-width: 600px)': { fontSize: '12px !important'},
                    }}
                >
                    Dismiss
                </Button>
            )}
        </Box>)
    );
};

export default CustomNotification;
