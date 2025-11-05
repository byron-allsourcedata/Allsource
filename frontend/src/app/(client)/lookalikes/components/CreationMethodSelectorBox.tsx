import React from "react";
import { Box, Typography, Button, Slider } from "@mui/material";
import { useLookalikesHints } from "../context/LookalikesHintsContext";
import HintCard from "../../components/HintCard";

const audienceSize = [
	{
		id: "smart",
		label: "Smart Matching",
		text: "Create lookalike based on complete source data.",
		min_value: 0,
		max_value: 3,
	},
	{
		id: "predictive",
		label: "Predictive Matching",
		text: "Our Machine Learning algorithm selects only the most relevant audience signals.",
		min_value: 0,
		max_value: 7,
	},
];

const RECOMMENDED_SIZE = "smart";

interface AudienceSizeSelectorProps {
	onSelectSize: (id: string, min: number, max: number) => void;
	selectedSize: string;
}

const CreationMethodSelectorBox: React.FC<AudienceSizeSelectorProps> = ({
	onSelectSize,
	selectedSize,
}) => {
	const {
		lookalikesBuilderHints,
		cardsLookalikeBuilder,
		changeLookalikesBuilderHint,
		resetSourcesBuilderHints,
	} = useLookalikesHints();
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
					position: "relative",
					padding: "18px",
					gap: "8px",
					mt: 1,
				}}
			>
				<Typography className="second-sub-title">
					Choose lookalike method
				</Typography>
				<Typography className="paragraph">
					{
						"Select how you’d like to build your audience — with AI insights or simple matching."
					}
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
						position: "relative",
					}}
				>
					{audienceSize.map((source) => {
						const isRecommended = source.id === RECOMMENDED_SIZE;
						return (
							<Box
								key={source.id}
								sx={{
									width: { xs: "100%", sm: "auto" },
									position: "relative",
								}}
							>
								{isRecommended && (
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
										onSelectSize(source.id, source.min_value, source.max_value)
									}
									sx={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										justifyContent: "center",
										flex: 1,
										minWidth: "12.125rem",
										border:
											selectedSize === source.id
												? "1px solid rgba(117, 168, 218, 1)"
												: "1px solid rgba(208, 213, 221, 1)",
										backgroundColor:
											selectedSize === source.id
												? "rgba(246, 248, 250, 1)"
												: "rgba(255, 255, 255, 1)",
										padding: "12px",
										borderRadius: isRecommended ? "0 4px 4px 4px" : "4px",
										textTransform: "none",
										width: { xs: "100%", sm: "auto" },
									}}
								>
									<Box
										sx={{
											display: "flex",
											width: "100%",
											flexDirection: "column",
											alignItems: "flex-start",
											justifyContent: "start",
											gap: 1,
										}}
									>
										<Typography className="black-table-header">
											{source.label}
										</Typography>
										<Typography
											className="paragraph"
											sx={{
												textAlign: "left",
												maxWidth: { xs: "100%", sm: "15rem" },
											}}
										>
											{source.text}
										</Typography>
									</Box>
								</Button>
							</Box>
						);
					})}
				</Box>
			</Box>
		</Box>
	);
};

export default CreationMethodSelectorBox;
