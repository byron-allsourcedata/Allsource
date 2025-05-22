import React, { useState } from 'react';
import {
    Box,
    Typography,
    Link as MuiLink,

} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { DashboardHelpCard } from './HelpCard';
import NotificationInfoBanner from './NotificationInfoBanner'
import { FeatureCardProps, TimeScreenProps } from '@/types/first_time_screens';
import CardsSection from './CardsSection';
import router from 'next/router';
import NotificationBanner from './NotificationWarningBanner';

const FirstTimeScreenCommon: React.FC<TimeScreenProps> = ({
    Header,
    InfoNotification,
    WarningNotification = {
        condition: false,
        ctaUrl: '/test',
        ctaLabel: 'Test Header',
        message: 'Test Message'
    },
    Content,
    HelpCard,
    customStyleSX,
}) => {
    const [bannerVisible, setBannerVisible] = useState(true);
    return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column'
            }}>
                {WarningNotification?.condition && (
                    <Box sx={{ mt: 2, }}>
                        <NotificationBanner
                            ctaUrl={WarningNotification.ctaUrl}
                            ctaLabel={WarningNotification.ctaLabel}
                            message={WarningNotification.message}
                        />
                    </Box>
                )}
                <Box
                    sx={{
                        ...customStyleSX
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 3,
                        }}
                    >
                        <Box>
                            <Typography
                                variant="h5"
                                align="center"
                                className="first-sub-title"
                                sx={{
                                    fontFamily: "Nunito Sans",
                                    fontSize: "24px !important",
                                    color: "#4a4a4a",
                                    fontWeight: "500 !important",
                                    lineHeight: "22px",
                                }}
                            >
                                {Header.TextTitle}
                            </Typography>
                            {Header.TextSubtitle && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        mt: 1,
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontFamily: "Nunito Sans",
                                            fontSize: "14px",
                                            color: "rgba(50, 54, 62, 1)",
                                            fontWeight: "400",
                                            lineHeight: "22px",
                                        }}
                                    >
                                        {Header.TextSubtitle}
                                    </Typography>

                                    {Header.link && (
                                        <MuiLink
                                            href={Header.link}
                                            target="_blank"
                                            underline="hover"
                                            sx={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                color: "#3898FC",
                                                fontSize: 14,
                                                fontFamily: "Nunito Sans",
                                            }}
                                        >
                                            Learn more&nbsp;
                                            <OpenInNewIcon sx={{ fontSize: 16 }} />
                                        </MuiLink>
                                    )}
                                </Box>
                            )}
                        </Box>

                    </Box>

                    {/* Info Notification */}
                    {InfoNotification && bannerVisible && (
                        <NotificationInfoBanner
                            message="Your dashboard displays key performance data across 5 core areas: pixel-captured users, created sources, lookalikes, smart audiences, and data sync status. Monitor all critical metrics in one place to optimize targeting."
                            onClose={() => setBannerVisible(false)}
                        />

                    )}

                    {/* Main Content */}
                    {Content && (
                        <Box sx={{ width: '100%', mt: 3 }}>
                            {
                                typeof Content === 'function'
                                    ? React.createElement(Content as React.ComponentType)
                                    : Content
                            }
                        </Box>
                    )}

                    {/* Help Card */}
                    <Box sx={{ mt: 3, width: '100%' }}>
                        {HelpCard && (
                            <DashboardHelpCard
                                headline={HelpCard.headline}
                                description={HelpCard.description}
                                helpPoints={HelpCard.helpPoints}
                            />
                        )}
                    </Box>

                </Box>
            </Box>
    );
};

export default FirstTimeScreenCommon;
