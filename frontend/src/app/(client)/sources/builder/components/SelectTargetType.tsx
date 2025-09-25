import React, { ReactNode, RefObject } from "react";
import { Box, Typography } from "@mui/material";
import HintCard from "../../../components/HintCard";
import { useSourcesHints } from "../../context/SourcesHintsContext";
import { useSourcesBuilder } from "../../context/SourceBuilderContext";
import { builderHintCards } from "../../context/hintsCardsContent";
import scrollToBlock from "@/utils/autoscroll";
import { BuilderKey } from "../../context/hintsCardsContent";
import { CustomToggle } from "@/components/ui";

interface SelectTargetTypeProps {
	renderSkeleton: (key: BuilderKey, height: string) => ReactNode;
	closeDotHintClick: (key: BuilderKey) => void;
	openDotHintClick: (key: BuilderKey) => void;
	closeSkeleton: (key: BuilderKey) => void;
}

const SelectTargetType: React.FC<SelectTargetTypeProps> = ({
	renderSkeleton,
	closeDotHintClick,
	openDotHintClick,
	closeSkeleton,
}) => {
	const {
		changeSourcesBuilderHint,
		sourcesBuilderHints,
		resetSourcesBuilderHints,
	} = useSourcesHints();

	const { block4Ref, block6Ref, skeletons, targetAudience, setTargetAudience } =
		useSourcesBuilder();

	const handleTargetAudienceChange = (value: string) => {
		setTargetAudience(value);
		setTimeout(() => {
			scrollToBlock(block6Ref as RefObject<HTMLDivElement>);
		}, 0);
		closeSkeleton("name");
		closeDotHintClick("dataSource");
		closeDotHintClick("targetType");
		if (targetAudience === "") {
			openDotHintClick("name");
		}
	};

	return (
		<Box
			ref={block4Ref}
			sx={{
				display: "flex",
				flexDirection: "column",
			}}
		>
			{!skeletons["targetType"] && (
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 2,
						minWidth: "100%",
						flexGrow: 1,
						position: "relative",
						flexWrap: "wrap",
						border: "1px solid rgba(228, 228, 228, 1)",
						borderRadius: "6px",
						padding: "20px",
					}}
				>
					<Box
						sx={{
							display: "flex",
							width: "100%",
							flexDirection: "row",
							justifyContent: "space-between",
							gap: 1,
						}}
					>
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								gap: 1,
							}}
						>
							<Typography
								sx={{
									fontFamily: "var(--font-nunito)",
									fontSize: "16px",
									fontWeight: 500,
								}}
							>
								Select your target type
							</Typography>
							<Typography
								sx={{
									fontFamily: "var(--font-roboto)",
									fontSize: "12px",
									color: "rgba(95, 99, 104, 1)",
								}}
							>
								Choose what you would like to use it for.
							</Typography>
						</Box>
					</Box>
					<Box
						sx={{
							display: "flex",
							position: "relative",
							flexDirection: "row",
							gap: 2,
						}}
					>
						{["B2B", "B2C"].map((option) => (
							<CustomToggle
								key={option}
								value={option}
								isActive={targetAudience === option}
								onClick={() => handleTargetAudienceChange(option)}
								name={option}
							/>
						))}
						{sourcesBuilderHints["targetType"].show && (
							<HintCard
								card={builderHintCards["targetType"]}
								positionLeft={140}
								isOpenBody={sourcesBuilderHints["targetType"].showBody}
								toggleClick={() =>
									changeSourcesBuilderHint("targetType", "showBody", "toggle")
								}
								closeClick={() =>
									changeSourcesBuilderHint("targetType", "showBody", "close")
								}
							/>
						)}
					</Box>
				</Box>
			)}
			{renderSkeleton("targetType", "146px")}
		</Box>
	);
};

export default SelectTargetType;
