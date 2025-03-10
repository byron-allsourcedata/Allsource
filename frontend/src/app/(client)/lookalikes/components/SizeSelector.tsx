import React from "react";
import { Box, Typography, Button, Slider } from "@mui/material";

interface AudienceSize {
    id: string;
    label: string;
    text: string;
    min_value: number;
    max_value: number;
}

interface AudienceSizeSelectorProps {
    audienceSize: AudienceSize[];
    onSelectSize: (id: string, min: number, max: number) => void;
    selectedSize: string;
}

const AudienceSizeSelector: React.FC<AudienceSizeSelectorProps> = ({
    audienceSize,
    onSelectSize,
    selectedSize,
}) => {
    return (
        <Box
            sx={{
                display: "flex",
                width: "100%",
                justifyContent: "start",
            }}
        >
            <Box
                sx={{
                    border: "1px solid rgba(228, 228, 228, 1)",
                    borderRadius: "6px",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    padding: "18px",
                    gap: "8px",
                    mt: 2,
                }}
            >
                <Typography className="second-sub-title">
                    Choose lookalike size
                </Typography>
                <Typography className="paragraph">
                    Fine-tune your targeting! Choose the size of your lookalike
                    audience to match your marketing goals.
                </Typography>

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: {
                            xs: "column",
                            sm: "row",
                        },
                        gap: 2,
                        pt: 2,
                        width: "100%",
                        flexWrap: "wrap",
                    }}
                >
                    {audienceSize.map((source) => (
                        <Box
                            key={source.id}
                            sx={{
                                width: { xs: "100%", sm: "auto" },
                                position: "relative",
                            }}
                        >
                            {source.id === "extremely" && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: "-19px",
                                        left: "0",
                                        backgroundColor: "#009970",
                                        color: "#FFFFFF",
                                        fontSize: "10px",
                                        fontWeight: "bold",
                                        padding: "4px 8px",
                                        borderRadius: "6px 6px 0 0",
                                        whiteSpace: "nowrap",
                                        minWidth: "80px",
                                        textAlign: "center",
                                    }}
                                >
                                    Recommended
                                </Box>
                            )}
                            <Button
                                onClick={() =>
                                    onSelectSize(
                                        source.id,
                                        source.min_value,
                                        source.max_value
                                    )
                                }
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flex: 1,
                                    minWidth: 0, // Избегаем минимальной ширины
                                    border:
                                        selectedSize === source.id
                                            ? "1px solid #1976d2"
                                            : "1px solid rgba(208, 213, 221, 1)",
                                    padding: "0.6rem 0.5rem",
                                    borderRadius: "4px",
                                    textTransform: "none",
                                    width: { xs: "100%", sm: "auto" }, // 100% на маленьких экранах, адаптивно на больших
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "10px",
                                    }}
                                >
                                    <Typography
                                        className="paragraph"
                                        sx={{ color: "rgba(32, 33, 36, 1)" }}
                                    >
                                        {source.label}
                                    </Typography>
                                    <Typography
                                        className="paragraph"
                                        sx={{ fontSize: "12px" }}
                                    >
                                        {source.text}
                                    </Typography>
                                </Box>
                            </Button>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default AudienceSizeSelector;
