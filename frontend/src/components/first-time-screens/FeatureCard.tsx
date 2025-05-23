import { FeatureCardProps } from "@/types/first_time_screens";
import { Box, Card, CardContent, Typography } from "@mui/material";

const FeatureCard: React.FC<FeatureCardProps> = ({
    title,
    subtitle,
    imageSrc,
    onClick,
    showRecommended = false,
    img_height = 140
}) => {
    return (
        <Card
            variant="outlined"
            onClick={onClick}
            sx={{
                backgroundColor: 'transparent',
                boxShadow: 'none',
                cursor: 'pointer',
                ':hover': {
                    backgroundColor: 'rgba(246, 249, 255, 1)',
                    border: '1px solid rgba(1, 113, 248, 0.4)',
                    '& .feature-card-title': { color: 'rgba(21, 22, 25, 1)' },
                },
            }}
        >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography
                        className="first-sub-title"
                    >
                        {title}
                    </Typography>
                    {showRecommended && (
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.5,
                            }}
                        >
                            <Typography
                                className="table-data"
                                sx={{
                                    color: "rgba(43, 91, 0, 1) !important",
                                    fontSize: "14px !important",
                                    backgroundColor: "rgba(234, 248, 221, 1) !important",
                                    padding: "4px 12px",
                                    borderRadius: "4px",
                                }}
                            >
                                Recommended
                            </Typography>
                        </Box>
                    )}
                </Box>

                <Box
                    sx={{
                        height: img_height,
                        backgroundImage: `url(${imageSrc})`,
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        borderRadius: 2,
                    }}
                />

                <Typography
                    className="description"
                >
                    {subtitle}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default FeatureCard;