import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import PlaylistRemoveIcon from "@mui/icons-material/PlaylistRemove";
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import Image from 'next/image';

interface CardData {
    id: string;
    chain_ids: string[];
    status: string;
    date: string;
    event_info: Record<string, string | number>;
    tabType: string;
}

interface SmartAudienceCardProps {
    data: CardData;
    onClick?: () => void;
    highlighted?: boolean;
}

const getUseCaseStyle = (useCase: string) => {
    switch (useCase.trim()) {
        case 'Postal':
            return <Image src="/postal.svg" alt="postal icon" width={20} height={20} />;
        case 'Google':
            return <Image src="/google-ads.svg" alt="google icon" width={20} height={20} />;
        case 'Meta':
            return <Image src="/meta.svg" alt="meta icon" width={20} height={20} />;
        case 'Bing':
            return <Image src="/bing.svg" alt="bing icon" width={20} height={20} />;
        case 'LinkedIn':
            return <Image src="/linkedIn.svg" alt="linkedin icon" width={20} height={20} />;
        case 'Tele Marketing':
            return <HeadsetMicOutlinedIcon />;
        default:
            return <MailOutlinedIcon />;
    }
};

const renderTags = (value: string, type: "include" | "exclude") => {
    if (!value.trim()) return null;

    const parts = value.split(',').map(v => v.trim());
    const colorMap = {
        include: {
            lookalike: {
                bg: 'rgba(224, 176, 5, 0.2)',
                color: 'rgba(224, 176, 5, 1)'
            },
            source: {
                bg: 'rgba(80, 82, 178, 0.2)',
                color: 'rgba(80, 82, 178, 1)'
            },
        },
        exclude: {
            lookalike: {
                bg: 'rgba(224, 176, 5, 0.2)',
                color: 'rgba(224, 176, 5, 1)'
            },
            source: {
                bg: 'rgba(80, 82, 178, 0.2)',
                color: 'rgba(80, 82, 178, 1)'
            },
        },
        default: {
            bg: 'rgba(0, 0, 0, 0.05)',
            color: 'rgba(74, 74, 74, 1)'
        }
    };

    return (
        <Box mb={1}>
            <Box display="flex" alignItems="center" mb={0.5}>
                {type === 'include' ? (
                    <PlaylistAddIcon sx={{ fontSize: 20, mr: 0.5, color: "rgba(74, 74, 74, 1)" }} />
                ) : (
                    <PlaylistRemoveIcon sx={{ fontSize: 20, mr: 0.5, color: "rgba(74, 74, 74, 1)" }} />
                )}
                <Typography className="dashboard-card-text">{type === "include" ? "Included" : "Excluded"}</Typography>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
                {parts.map((entry, i) => {
                    const match = entry.match(/^(.*?)\s*\((.*?)\)$/);
                    const name = match?.[1] || entry;
                    const tag = match?.[2]?.toLowerCase();
                    const colors =
                        type === 'include'
                            ? colorMap.include[tag as keyof typeof colorMap.include] ?? colorMap.default
                            : colorMap.exclude[tag as keyof typeof colorMap.exclude] ?? colorMap.default;


                    return (
                        <Box
                            key={`${name}-${i}`}
                            sx={{
                                px: 1,
                                py: 0.5,
                                backgroundColor: colors.bg,
                                color: colors.color,
                                borderRadius: 1,
                                fontSize: 14,
                            }}
                        >
                            {name}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

const SmartAudienceCard: React.FC<SmartAudienceCardProps> = ({
    data,
    onClick,
    highlighted = false,
}) => {
    const { status, date, event_info } = data;
    console.log(data)

    const name = event_info["Name"] as string;
    const useCase = event_info["Use Case"] as string;
    const segment = event_info["Active Segment"];
    const include = event_info["Include"] as string;
    const exclude = event_info["Exclude"] as string;

    return (
        <Card
            onClick={onClick}
            sx={{
                borderRadius: 2,
                boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
                padding: "0.5rem 0.75rem 1rem",
                border: highlighted ? `2px solid rgba(5, 105, 226, 1)` : "transparent",
                cursor: "pointer",
                "&:hover": {
                    border: `1px solid rgba(5, 105, 226, 1)`,
                },
            }}
        >
            <CardContent sx={{ p: 0, "&:last-child": { paddingBottom: 0 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography
                        className="paragraph"
                        sx={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            padding: '3px 1rem',
                            maxWidth: '120px',
                            backgroundColor: status.includes("Synced") ? "rgba(234, 248, 221, 1)" : 'rgba(222, 237, 255, 1)',
                            color: status.includes("Synced") ? "rgba(43, 91, 0, 1)!important" : 'rgba(5, 105, 226, 1) !important',
                        }}
                    >
                        {status}
                    </Typography>
                    <Typography className="dashboard-card-text">{date}</Typography>
                </Box>

                <Typography className="dashboard-card-heading" sx={{ mb: 1 }}>{name}</Typography>

                <Box display="flex" gap={4} mb={2}>
                    <Box flex={1}>
                        <Typography className="dashboard-card-text">Usecase</Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                            {getUseCaseStyle(useCase)}
                            <Typography className="dashboard-card-heading">{useCase}</Typography>
                        </Box>
                    </Box>
                    <Box flex={1}>
                        <Typography className="dashboard-card-text">Segment</Typography>
                        <Typography className="dashboard-card-heading">
                            {typeof segment === 'number' ? segment.toLocaleString() : segment}
                        </Typography>
                    </Box>
                </Box>

                {include && renderTags(include, "include")}
                {exclude && renderTags(exclude, "exclude")}
            </CardContent>
        </Card>
    );
};

export default SmartAudienceCard;
