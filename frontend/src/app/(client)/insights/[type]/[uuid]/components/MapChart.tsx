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
import { Tooltip, IconButton } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import {
	getColorFromPercentage,
	defaultColor,
	RegionData,
} from "./B2BTabComponents/mapChartUtils";
import { useStatsRowContext } from "./StatsRowContext";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface MapChartProps {
	title: string;
	regions: RegionData[];
	rank?: number;
	hasCityMode?: boolean;
}

const MapChart: FC<MapChartProps> = ({
	title,
	regions,
	rank,
	hasCityMode = false,
}) => {
	const [geographies, setGeographies] = useState<any[]>([]);
	const [mode, setMode] = useState<"state" | "city">("state");

	const { expanded, toggle: toggleExpanded } = useStatsRowContext();

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

				if ("features" in result) {
					setGeographies(result.features);
				} else {
					setGeographies([result]);
				}
			});
	}, []);

	return (
		<Box
			sx={{
				backgroundColor: "#fff",
				borderRadius: "6px",
				boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
				width: "100%",
				display: "flex",
				maxHeight: expanded ? "563px" : "463px",
				flexDirection: "column",
				position: "relative",
				justifyContent: "space-between",
				...(rank !== undefined && {
					overflow: "hidden",
					"&::before, &::after": {
						content: '""',
						position: "absolute",
						backgroundRepeat: "no-repeat",
						pointerEvents: "none",
					},
					"&::before": {
						top: 0,
						right: 0,
						height: "1px",
						width: "100%",
						backgroundImage:
							"linear-gradient(to left, rgba(30,136,229,1) 0%, rgba(30,136,229,0) 100%)",
					},
					"&::after": {
						top: 0,
						right: 0,
						width: "1px",
						height: "100%",
						backgroundImage:
							"linear-gradient(to bottom, rgba(30,136,229,1) 0%, rgba(30,136,229,0) 100%)",
					},
				}),
			}}
		>
			{rank !== undefined && (
				<Box
					sx={{
						position: "absolute",
						top: 0,
						right: 0,
						display: "inline-flex",
						alignItems: "center",
						backgroundColor: "rgba(30, 136, 229, 1)",
						color: "white",
						borderTopRightRadius: "4px",
						borderBottomLeftRadius: "4px",
						px: 1.5,
						py: 0.5,
						fontFamily: "var(--font-roboto)",
						fontSize: 12,
						fontWeight: 500,
						maxWidth: "100%",
						whiteSpace: "nowrap",
					}}
				>
					<ArrowDropUpIcon sx={{ fontSize: 16, mr: 0.5 }} />#{rank} Predictable
					field
				</Box>
			)}
			<Box
				sx={{
					padding: 2,
					width: "100%",
					display: "flex",
					maxHeight: expanded ? "563px" : "463px",
					flexDirection: "column",
					position: "relative",
					justifyContent: "space-between",
				}}
			>
				<Box
					sx={{
						width: "100%",
						justifyContent: "space-between",
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						pt: 1,
					}}
				>
					<Typography className="dashboard-card-heading">{title}</Typography>
					{hasCityMode && (
						<IconButton
							onClick={() =>
								setMode((prev) => (prev === "state" ? "city" : "state"))
							}
							size="small"
							sx={{
								backgroundColor: "rgba(30,136,229,0.1)",
								borderRadius: 1,
								fontSize: 12,
								fontWeight: 500,
							}}
						>
							<Typography sx={{ fontSize: 12, fontWeight: 500 }}>
								View by {mode === "state" ? "City" : "State"}
							</Typography>
						</IconButton>
					)}
				</Box>
				{mode === "state" && (
					<ComposableMap projection="geoAlbersUsa">
						{geographies.length > 0 && (
							<Geographies geography={geographies}>
								{({ geographies }) =>
									geographies.map((geo) => {
										const state = allStates.find(
											(s) => s.name === geo.properties.name,
										);
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
															<Typography
																className="table-data"
																component="div"
																sx={{
																	fontSize: "12px !important",
																	display: "flex",
																	gap: 0.5,
																}}
															>
																{geo.properties.name}
																{regionData ? (
																	<Typography className="table-data">
																		{regionData.percentage}%
																	</Typography>
																) : null}
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
				)}

				<Box>
					{mode === "state" ? (
						<Grid container spacing={1}>
							{[...regions]
								.sort((a, b) => b.percentage - a.percentage)
								.slice(0, expanded ? 20 : 4)
								.map((region, index) => (
									<Grid item xs={6} sm={4} md={3} key={index}>
										<Stack direction="row" alignItems="center" gap={1}>
											<Box
												width={24}
												height={24}
												borderRadius="8px"
												sx={{
													backgroundColor: getColorFromPercentage(
														region.percentage,
													),
													minWidth: 24,
												}}
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
								))}
						</Grid>
					) : (
						<Grid container spacing={1}>
							{[...regions]
								.sort((a, b) => b.percentage - a.percentage)
								.slice(0, expanded ? 16 : 8)
								.map((region, index) => (
									<Grid item xs={6} sm={4} md={3} key={index}>
										<Stack direction="row" alignItems="center" gap={1}>
											<Box key={region.label} mb={1}>
												<Typography
													className="dashboard-card-text"
													sx={{ fontWeight: "700 !important" }}
												>
													{region.label} – {region.percentage}%
												</Typography>
												{region.cities?.map((city) => (
													<Typography
														key={city.name}
														sx={{
															fontSize: 14,
															display: "flex",
															gap: 1,
														}}
													>
														<span className="dashboard-gist-card-text ">
															{capitalize(city.name)} - {city.percent}%
														</span>
													</Typography>
												))}
											</Box>
										</Stack>
									</Grid>
								))}
						</Grid>
					)}

					{regions.length > 4 && (
						<Box mt={2} display="flex" justifyContent="center">
							<IconButton onClick={toggleExpanded} size="small">
								<Typography sx={{ fontSize: 14, mr: 0.5 }}>
									{expanded ? "Show Less" : "Show More"}
								</Typography>
								{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
							</IconButton>
						</Box>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default MapChart;
