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
    min: number;
    max: number;
    onSliderChange: (value: number) => void;
    onSelectSize: (id: string, min: number, max: number) => void;
    selectedSize: string;
    sliderValue: number[]; // Массив значений для двух ползунков
}

const AudienceSizeSelector: React.FC<AudienceSizeSelectorProps> = ({
    audienceSize,
    min,
    max,
    onSliderChange,
    onSelectSize,
    selectedSize,
    sliderValue,
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
                                    flexDirection: "row",
                                    alignItems: "center",
                                    border:
                                        selectedSize === source.id
                                            ? "1px solid #1976d2"
                                            : "1px solid rgba(208, 213, 221, 1)",
                                    gap: "10px",
                                    padding: "0.6rem 0.5rem",
                                    borderRadius: "4px",
                                    textTransform: "none",
                                    width: "100%",
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

                <Box sx={{ width: "100%", mt: 0 }}>
                    <Slider
                        value={[min, sliderValue[1]]} // фиксируем min, меняем только второй ползунок
                        onChange={(_, newValue) =>
                            onSliderChange(newValue as number) // обновляем только второй ползунок
                        }
                        min={min}
                        max={max}
                        step={1}
                        valueLabelDisplay="auto"
                        sx={{
                            color: "rgba(80, 82, 178, 1)",
                        }}
                    />
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mt: 0,
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                        >
                            {min}%
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                        >
                            {(min + max) / 2}%
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                        >
                            {max}%
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default AudienceSizeSelector;
