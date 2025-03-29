import { useState } from "react";
import { Box, Card, CardContent, Stack, IconButton, Chip, Typography } from "@mui/material";
import { ShowChart, BarChart as IconBarChart } from "@mui/icons-material";
import { LineChart, BarChart } from "@mui/x-charts";

const colorPalette = ["#4285F4", "#EA4335", "#FBBC05", "#34A853", "#A142F4"];

const ExampleChart = ({ data }: { data: any[] }) => {
    const [chartType, setChartType] = useState<"line" | "bar">("line");
    const [visibleSeries, setVisibleSeries] = useState({
        total_contact_collected: true,
        total_visitors: true,
        view_products: true,
        abandoned_cart: true,
        converted_sale: true,
    });

    const toggleChartType = (type: "line" | "bar") => setChartType(type);

    const handleChipClick = (key: keyof typeof visibleSeries) => {
        setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const filteredSeries = Object.keys(visibleSeries)
        .filter((key) => visibleSeries[key as keyof typeof visibleSeries])
        .map((key, index) => ({
            id: key,
            data: data.map((item) => item[key]),
            color: colorPalette[index],
        }));

    return (
        <Box sx={{ mb: 3, boxShadow: "0px 2px 10px 0px rgba(0, 0, 0, 0.1)" }}>
            <Card variant="outlined" sx={{ width: "100%" }}>
                <CardContent>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Stack direction="row" sx={{ gap: 1.5, alignItems: "center", pl: 5 }}>
                            <IconButton
                                onClick={() => toggleChartType("line")}
                                sx={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "4px",
                                    border: `1.5px solid ${chartType === "line" ? "#5052B2" : "#737373"}`,
                                    color: chartType === "line" ? "#5052B2" : "#737373",
                                    padding: "4px",
                                }}
                            >
                                <ShowChart sx={{ fontSize: "16px" }} />
                            </IconButton>
                            <IconButton
                                onClick={() => toggleChartType("bar")}
                                sx={{
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "4px",
                                    border: `1.5px solid ${chartType === "bar" ? "#5052B2" : "#737373"}`,
                                    color: chartType === "bar" ? "#5052B2" : "#737373",
                                    padding: "4px",
                                }}
                            >
                                <IconBarChart sx={{ fontSize: "16px" }} />
                            </IconButton>
                        </Stack>

                        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
                            {Object.keys(visibleSeries).map((seriesId, index) => (
                                <Chip
                                    key={seriesId}
                                    label={
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: colorPalette[index] }} />
                                            <Typography sx={{ fontSize: "12px", color: "rgba(95, 99, 104, 1)" }}>
                                                {seriesId.replace(/_/g, " ").replace(/^(.)(.*)$/, (_, p1, p2) => p1.toUpperCase() + p2)}
                                            </Typography>
                                        </Box>
                                    }
                                    onClick={() => handleChipClick(seriesId as keyof typeof visibleSeries)}
                                    sx={{
                                        backgroundColor: visibleSeries[seriesId as keyof typeof visibleSeries] ? "rgba(237, 237, 247, 1)" : "#fff",
                                        borderRadius: "4px",
                                        maxHeight: "25px",
                                    }}
                                    variant={visibleSeries[seriesId as keyof typeof visibleSeries] ? "filled" : "outlined"}
                                />
                            ))}
                        </Stack>
                    </Stack>

                    {chartType === "line" ? (
                        <LineChart
                            series={filteredSeries}
                            height={300}
                            grid={{ horizontal: true }}
                            margin={{ left: 40, right: 20, top: 20, bottom: 20 }}
                        />
                    ) : (
                        <BarChart
                            series={filteredSeries}
                            height={300}
                            grid={{ horizontal: true }}
                            margin={{ left: 40, right: 20, top: 20, bottom: 20 }}
                        />
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default ExampleChart;
