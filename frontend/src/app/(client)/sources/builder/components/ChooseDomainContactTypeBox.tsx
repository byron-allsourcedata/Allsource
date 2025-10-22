import React, { ReactNode, RefObject, useState } from "react";
import { Box, Typography } from "@mui/material";
import { CustomButton } from "@/components/ui";
import HintCard from "../../../components/HintCard";
import { useSourcesHints } from "../../context/SourcesHintsContext";
import { useSourcesBuilder } from "../../context/SourceBuilderContext";
import { DomainsLeads } from "./types";
import { builderHintCards } from "../../context/hintsCardsContent";
import scrollToBlock from "@/utils/autoscroll";
import { BuilderKey } from "../../context/hintsCardsContent";

interface ChooseDomainContactTypeProps {
	renderSkeleton: (key: BuilderKey) => ReactNode;
	closeDotHintClick: (key: BuilderKey) => void;
	openDotHintClick: (key: BuilderKey) => void;
	closeSkeleton: (key: BuilderKey) => void;
}

const ChooseDomainContactTypeBox: React.FC<ChooseDomainContactTypeProps> = ({
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

	const {
		block4Ref,
		block5Ref,
		skeletons,
		domains,
		eventTypes,
		eventType,
		setEventType,
		showTargetStep,
		setMatchedLeads,
		matchedLeads,
		selectedDomain,
		totalLeads,
		setShowTargetStep,
	} = useSourcesBuilder();

	const [isAllSelected, setIsAllSelected] = useState(true);
	const allSelected = isAllSelected;

	const toggleEventType = (id: number) => {
		if (isAllSelected) {
			setIsAllSelected(false);
			setMatchedLeads(0);
		}

		const isActive = eventType.includes(id);
		const newEventTypes = isActive
			? eventType.filter((e) => e !== id)
			: [...eventType, id];

		if (newEventTypes.length === 0) {
			setIsAllSelected(true);
			setEventType([]);
			setMatchedLeads(totalLeads);
			return;
		}

		setEventType(newEventTypes);

		const sum = newEventTypes.reduce((acc, evId) => {
			const field = eventTypes.find((e) => e.id === evId)!
				.name as keyof DomainsLeads;
			const cnt = domains.find((d) => d.name === selectedDomain)?.[field] || 0;
			return acc + Number(cnt);
		}, 0);
		setMatchedLeads(sum);
	};

	const handleToggleAll = () => {
		setIsAllSelected(true);
		setEventType([]);
		setMatchedLeads(totalLeads);
	};

	return (
		<Box
			ref={block5Ref}
			sx={{
				display: "flex",
				flexDirection: "column",
			}}
		>
			{!skeletons["dataSource"] && (
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						position: "relative",
						gap: 2,
						flexWrap: "wrap",
						border: "1px solid rgba(228, 228, 228, 1)",
						borderRadius: "6px",
						padding: "20px",
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
							Choose your data source
						</Typography>
						<Typography
							sx={{
								fontFamily: "var(--font-roboto)",
								fontSize: "12px",
								color: "rgba(95, 99, 104, 1)",
							}}
						>
							Please select your event type.
						</Typography>
					</Box>
					<Box
						sx={{
							display: "flex",
							gap: 2,
							"@media (max-width: 420px)": {
								display: "grid",
								gridTemplateColumns: "1fr",
							},
						}}
					>
						<CustomButton
							variant="outlined"
							onClick={handleToggleAll}
							sx={{
								boxShadow: "none !important",
								fontWeight: 500,
								backgroundColor: allSelected
									? "rgba(246, 248, 250, 1)"
									: "rgba(255, 255, 255, 1)",
								borderColor: allSelected
									? "rgba(117, 168, 218, 1)"
									: "rgba(208, 213, 221, 1)",
								color: allSelected
									? "rgba(32, 33, 36, 1)"
									: "rgba(32, 33, 36, 1)",
								":hover": {
									borderColor: "rgba(208, 213, 221, 1)",
									backgroundColor: "rgba(236, 238, 241, 1)",
								},
							}}
						>
							All
						</CustomButton>
						{eventTypes.map((ev) => {
							const active = !isAllSelected && eventType.includes(ev.id);
							return (
								<CustomButton
									key={ev.id}
									variant="outlined"
									onClick={() => toggleEventType(ev.id)}
									sx={{
										color: "rgba(32, 33, 36, 1)",
										border: "1px solid rgba(208, 213, 221, 1)",
										boxShadow: "none !important",
										fontWeight: 500,
										backgroundColor: active
											? "rgba(246, 248, 250, 1)"
											: "rgba(255, 255, 255, 1)",
										borderColor: active
											? "rgba(117, 168, 218, 1)"
											: "rgba(208, 213, 221, 1)",
										":hover": {
											borderColor: "rgba(208, 213, 221, 1)",
											backgroundColor: "rgba(236, 238, 241, 1)",
										},
									}}
								>
									{ev.title.charAt(0).toUpperCase() +
										ev.title.slice(1).replace("_", " ")}
								</CustomButton>
							);
						})}
						{sourcesBuilderHints["dataSource"].show && (
							<HintCard
								card={builderHintCards["dataSource"]}
								positionLeft={650}
								positionTop={100}
								isOpenBody={sourcesBuilderHints["dataSource"].showBody}
								toggleClick={() =>
									changeSourcesBuilderHint("dataSource", "showBody", "toggle")
								}
								closeClick={() =>
									changeSourcesBuilderHint("dataSource", "showBody", "close")
								}
							/>
						)}
					</Box>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 1,
						}}
					>
						<Typography
							sx={{
								fontFamily: "var(--font-roboto)",
								fontSize: "14px",
								color: "rgba(32, 33, 36, 1)",
							}}
						>
							Total Leads
						</Typography>
						<Typography
							className="second-sub-title"
							sx={{
								fontFamily: "Nunino Sans",
								fontWeight: 600,
								fontSize: "16px",
								color: "rgba(32, 33, 36, 1)",
							}}
						>
							{eventType.some((id) => [1, 2, 3, 4].includes(id))
								? matchedLeads
								: totalLeads}
						</Typography>
					</Box>

					{!showTargetStep && (
						<Box sx={{ display: "flex", justifyContent: "right" }}>
							<CustomButton
								variant="contained"
								onClick={() => {
									setShowTargetStep(true);
									closeDotHintClick("dataSource");
									openDotHintClick("targetType");
									closeSkeleton("targetType");
									setTimeout(() => {
										scrollToBlock(block4Ref as RefObject<HTMLDivElement>);
									}, 0);
								}}
								sx={{
									width: "120px",
									height: "40px",
								}}
							>
								Continue
							</CustomButton>
						</Box>
					)}
				</Box>
			)}
			{renderSkeleton("dataSource")}
		</Box>
	);
};

export default ChooseDomainContactTypeBox;
