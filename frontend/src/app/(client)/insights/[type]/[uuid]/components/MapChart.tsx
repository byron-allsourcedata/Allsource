import React, { FC, useEffect, useMemo, useState } from "react";
import { geoCentroid } from "d3-geo";
import {
    ComposableMap,
    Geographies,
    Geography,
    Annotation,
} from "react-simple-maps";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import allStates from "./data/allstates.json";
import { USAStateAbbreviation } from "@mirawision/usa-map-react";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { Tooltip } from "@mui/material";


const defaultColor = "rgba(199, 228, 255, 1)";
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";


const getColorFromPercentage = (percentage: number): string => {
    if (percentage >= 50) return "#1E5FE0";
    if (percentage >= 30) return "#438AF8";
    if (percentage >= 15) return "#73A6F9";
    if (percentage >= 10) return "#8FB7FA";
    if (percentage >= 5) return "#A4C3FB";
    if (percentage >= 3) return "#BED4FC";
    return defaultColor;
};


interface RegionData {
    label: string;
    percentage: number;
    fillColor: string;
    state: USAStateAbbreviation;
}

interface MapChartProps {
    title: string;
    regions: RegionData[];
    rank?: number;
}



const MapChart: FC<MapChartProps> = ({ title, regions, rank }) => {
    const [geographies, setGeographies] = useState<any[]>([]);

    const fipsToColor: Record<string, string> = useMemo(() => {
        const map: Record<string, string> = {};
        for (const region of regions) {
            const state = allStates.find((s) => s.id === region.state);
            if (state) {
                map[state.val] = getColorFromPercentage(region.percentage);
            }
        }
        return map;
    }, [regions]);

    useEffect(() => {
        fetch(geoUrl)
            .then((res) => res.json())
            .then((topology: Topology) => {
                const result = feature(topology, topology.objects.states);
                console.log(result)

                if ("features" in result) {
                    setGeographies(result.features);
                } else {
                    setGeographies([result]);
                }
            });
    }, []);

    return (
        <Box
            p={2}
            borderRadius={2}
            boxShadow={1}
            sx={{
                backgroundColor: "#fff",
                borderRadius: "6px",
                boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
            }}
        >
            <Box sx={{
                width: "100%",
                justifyContent: 'space-between',
                display: 'flex',
                flexDirection: 'row'
            }}>
                <Typography className="dashboard-card-heading" mb={2}>
                    {title}
                </Typography>
                {rank !== undefined && (
                    <Typography
                        component="span"
                        sx={{
                            fontSize: 12,
                            ml: 1,
                            color: "#888",
                            verticalAlign: "middle",
                        }}
                    >
                        #{rank}
                    </Typography>
                )}
            </Box>
            <ComposableMap projection="geoAlbersUsa">
                {geographies.length > 0 && (
                    <Geographies geography={geographies}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const state = allStates.find((s) => s.name === geo.properties.name);
                                const centroid = geoCentroid(geo);
                                const geoIdNum = String(geo.id).padStart(2, "0");
                                const fill = fipsToColor[geoIdNum] || defaultColor;

                                const regionData = regions.find((r) => {
                                    const s = allStates.find((s) => s.id === r.state);
                                    return s?.val === geoIdNum;
                                });

                                return (
                                    <React.Fragment key={geo.rsmKey}>
                                        <Tooltip
                                            PopperProps={{
                                                modifiers: [
                                                    {
                                                        name: 'offset',
                                                        options: {
                                                            offset: [0, 0], // [x, y] — уменьши Y, чтобы он был ближе
                                                        },
                                                    },
                                                ],
                                            }}
                                            componentsProps={{
                                                tooltip: {
                                                    sx: {
                                                        backgroundColor: "#fff",
                                                        color: "#000",
                                                        boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.12)",
                                                        border: "0.2px solid rgba(255, 255, 255, 1)",
                                                        borderRadius: "4px",
                                                        fontSize: 12,
                                                    },
                                                },
                                            }}
                                            title={
                                                <Box>
                                                    <Typography className="table-data"
                                                        component="div"
                                                        sx={{ fontSize: "12px !important", display: 'flex', gap: 0.5 }}>
                                                        {geo.properties.name}
                                                        {regionData ? (
                                                            <Typography className="table-data">
                                                                {regionData.percentage}%
                                                            </Typography>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">
                                                                No data
                                                            </Typography>
                                                        )}
                                                    </Typography>

                                                </Box>
                                            }
                                        >
                                            <Geography
                                                geography={geo}
                                                fill={fill}
                                                stroke="rgba(0, 0, 0, 1)"
                                                strokeWidth={0.45}
                                            />
                                        </Tooltip>
                                        {state &&
                                            Array.isArray(centroid) &&
                                            centroid.length === 2 && (
                                                <Annotation
                                                    subject={centroid}
                                                    dx={0}
                                                    dy={0}
                                                    connectorProps={{ stroke: "none" }}
                                                >
                                                    <text
                                                        textAnchor="middle"
                                                        alignmentBaseline="central"
                                                        style={{ fontSize: 10, fontWeight: 600 }}
                                                    >
                                                        {state.id}
                                                    </text>
                                                </Annotation>
                                            )}
                                    </React.Fragment>
                                );
                            })
                        }
                    </Geographies>
                )}
            </ComposableMap>
            <Box>
                <Grid container spacing={1}>
                    {[...regions]
                        .sort((a, b) => b.percentage - a.percentage)
                        .slice(0, 5)
                        .map((region, index) => {
                            const fill = getColorFromPercentage(region.percentage);
                            return (
                                <Grid item xs={3.5} key={index}>
                                    <Stack direction="row" alignItems="center" gap={1}>
                                        <Box
                                            width={12}
                                            height={12}
                                            borderRadius="50%"
                                            sx={{ backgroundColor: fill }}
                                        />
                                        <Typography
                                            className="dashboard-card-text"
                                            sx={{ fontWeight: 500 }}
                                        >
                                            {region.percentage}%
                                        </Typography>
                                        <Typography className="dashboard-card-text">
                                            {region.label}
                                        </Typography>
                                    </Stack>
                                </Grid>
                            );
                        })}
                </Grid>
            </Box>
        </Box>
    );
};

export default MapChart;
