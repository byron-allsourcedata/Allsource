import React, { useState } from "react";
import { Box, Typography, Stack, IconButton, Collapse } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import { getGradient } from "@/utils/colors";

type BarData = {
	label: string;
	percent: number;
};

type GradientBarChartProps = {
	title: string;
	data: BarData[];
	gradientColor?: string;
	sortByPercent?: boolean;
	rank?: number;
	textPadding?: boolean;
	hidePercent?: boolean;
};

export const GradientBarChart: React.FC<GradientBarChartProps> = ({
	title,
	data,
	gradientColor = "98, 178, 253",
	sortByPercent = true,
	rank,
	textPadding,
	hidePercent = false,
}) => {
	const [expanded, setExpanded] = useState(false);
	const sortedData = sortByPercent
		? [...data].sort((a, b) => b.percent - a.percent)
		: data;
	const maxPercent = Math.max(...sortedData.map((d) => d.percent)) || 1;

	const MAX_VISIBLE = 20;

	let processedData: BarData[] = [];
	if (sortedData.length > MAX_VISIBLE) {
		const visibleTop = sortedData.slice(0, MAX_VISIBLE);
		const others = sortedData.slice(MAX_VISIBLE);
		const othersTotal = others.reduce((sum, item) => sum + item.percent, 0);

		processedData = [
			...visibleTop,
			{ label: "Everything else", percent: parseFloat(othersTotal.toFixed(2)) },
		];
	} else {
		processedData = sortedData;
	}

	const shouldShowEverythingElse =
		!hidePercent && sortedData.length > MAX_VISIBLE;

	const visibleWithoutOther = expanded
		? processedData.slice(0, MAX_VISIBLE)
		: processedData.slice(0, hidePercent ? 8 : 5);

	const visibleSum = visibleWithoutOther.reduce(
		(sum, item) => sum + item.percent,
		0,
	);
	const remainingPercent = Math.max(0, 100 - visibleSum);

	const visibleData = shouldShowEverythingElse
		? [
				...visibleWithoutOther,
				{
					label: "Everything else",
					percent: parseFloat(remainingPercent.toFixed(2)),
				},
			]
		: visibleWithoutOther;

	return (
		<Box
			bgcolor="#fff"
			sx={{
				width: "100%",
				borderRadius: "6px",
				boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
				overflow: "hidden",
				position: "relative",
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
				bgcolor="#fff"
				p={2}
				sx={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<Box sx={{ flex: 1 }}>
					{" "}
					<Box
						sx={{
							width: "100%",
							justifyContent: "space-between",
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							mb: 2,
							pt: textPadding ? 1 : 0,
						}}
					>
						<Typography className="dashboard-card-heading">{title}</Typography>
					</Box>
					{visibleData.length === 0 ? (
						<Box
							display="flex"
							justifyContent="center"
							alignItems="center"
							height="120px"
						>
							<Typography className="second-sub-title">
								No data available
							</Typography>
						</Box>
					) : (
						<Stack spacing={textPadding ? 3.5 : 1.25}>
							{visibleData.map(({ label, percent }, index) => {
								const isEverythingElse = label === "Everything else";
								const relative = percent / maxPercent;

								return (
									<Box key={index}>
										<Box display="flex" justifyContent="space-between" mb={0.5}>
											<Typography
												className="dashboard-card-text"
												sx={{
													color: isEverythingElse
														? "rgba(66, 66, 66, 0.6)"
														: "rgba(66, 66, 66, 1)",
													fontStyle: isEverythingElse ? "italic" : "normal",
													fontWeight: 400,
												}}
											>
												{hidePercent ? `${index + 1}. ` : ""}
												{label.charAt(0).toUpperCase() + label.slice(1)}
											</Typography>
											{!hidePercent && (
												<Typography
													className="dashboard-card-text"
													sx={{
														color: isEverythingElse
															? "rgba(66, 66, 66, 0.6)"
															: "rgba(66, 66, 66, 1)",
														fontStyle: isEverythingElse ? "italic" : "normal",
														fontWeight: 400,
													}}
												>
													{percent}%
												</Typography>
											)}
										</Box>
										{!hidePercent && (
											<Box
												height={24}
												borderRadius={2}
												sx={{
													maxWidth: "100%",
													width:
														percent > 100
															? `${relative * 100}%`
															: `${percent}%`,
													backgroundColor: getGradient(relative, gradientColor),
													transition: "background 0.3s ease",
												}}
											/>
										)}
									</Box>
								);
							})}
						</Stack>
					)}
				</Box>

				{sortedData.length > 5 && (
					<Box display="flex" justifyContent="center" mt="auto" pt={2}>
						<IconButton
							onClick={() => setExpanded((prev) => !prev)}
							size="small"
						>
							<Typography sx={{ fontSize: 14, mr: 0.5 }}>
								{expanded ? "Show Less" : "Show More"}
							</Typography>
							{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
						</IconButton>
					</Box>
				)}
			</Box>
		</Box>
	);
};
