import React, { RefObject } from "react";
import { Box, Typography } from "@mui/material";
import HintCard from "../../../components/HintCard";
import { useSourcesHints } from "../../context/SourcesHintsContext";
import { useSourcesBuilder } from "../../context/SourceBuilderContext";
import { builderHintCards } from "../../context/hintsCardsContent";
import { useWhitelabel } from "@/app/features/whitelabel/contexts/WhitelabelContext";
import {
	sourceTypes,
	SourceType,
	InterfaceMappingRowsSourceType,
	InterfaceMappingHeadingSubstitution,
} from "./types";
import scrollToBlock from "@/utils/autoscroll";
import { BuilderKey } from "../../context/hintsCardsContent";
import { SourceTypeCard } from "./SourceTypeCard";

interface ChooseDomainContactTypeProps {
	fetchDomainsAndLeads: () => void;
	closeDotHintClick: (key: BuilderKey) => void;
	openDotHintClick: (key: BuilderKey) => void;
	closeSkeleton: (key: BuilderKey) => void;
}

const ChooseSourceTypeBox: React.FC<ChooseDomainContactTypeProps> = ({
	fetchDomainsAndLeads,
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
		block1Ref,
		block2Ref,
		block4Ref,
		sourceType,
		setHeadingsNotSubstitution,
		setTargetAudience,
		setSelectedDomainId,
		handleDeleteFile,
		setSourceMethod,
		setMappingRows,
		selectedDomain,
		setSelectedDomain,
		setSourceType,
		setShowTargetStep,
		setPixelNotInstalled,
		setIsContinuePressed,
		defaultMapping,
		mappingRowsSourceType,
		defautlHeadingSubstitution,
		mappingHeadingSubstitution,
	} = useSourcesBuilder();

	const { whitelabel } = useWhitelabel();

	const handleChangeSourceType = (newSourceType: string) => {
		handleDeleteFile();
		setTargetAudience("");
		setSelectedDomainId(0);
		setShowTargetStep(false);
		setIsContinuePressed(false);

		closeDotHintClick("sourceType");
		if (newSourceType === "Website - Pixel") {
			setSourceMethod(2);
			closeSkeleton("pixelDomain");
			if (selectedDomain === "") {
				openDotHintClick("pixelDomain");
			}
			setTimeout(() => {
				scrollToBlock(block4Ref as RefObject<HTMLDivElement>);
			}, 0);
			fetchDomainsAndLeads();
		} else {
			setMappingRows([
				...defaultMapping,
				...mappingRowsSourceType[
					newSourceType as keyof InterfaceMappingRowsSourceType
				],
			]);
			setHeadingsNotSubstitution({
				...defautlHeadingSubstitution,
				...mappingHeadingSubstitution[
					newSourceType as keyof InterfaceMappingHeadingSubstitution
				],
			});
			setSourceMethod(1);
			closeSkeleton("sourceFile");
			if (sourceType === "") {
				openDotHintClick("sourceFile");
			}
			setPixelNotInstalled(false);
			setTimeout(() => {
				scrollToBlock(block2Ref as RefObject<HTMLDivElement>);
			}, 0);
		}

		setSelectedDomain("");
		setSourceType(newSourceType as SourceType);
	};

	return (
		<Box
			ref={block1Ref}
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: 2,
				flexWrap: "wrap",
				border: "1px solid rgba(228, 228, 228, 1)",
				borderRadius: "6px",
				padding: "20px",
			}}
		>
			<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
					Choose your data source, and let {whitelabel.brand_name} AI Audience
					Algorithm identify high-intent leads and create lookalike audiences to
					slash your acquisition costs.
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
				<Box display="flex" gap="16px" sx={{ position: "relative" }}>
					{sourceTypes.map((el, index) => (
						<SourceTypeCard
							key={index}
							onSelect={handleChangeSourceType}
							selectedSourceType={sourceType}
							sourceTypeSchema={el}
						/>
					))}
					{sourcesBuilderHints["sourceType"].show && (
						<HintCard
							card={builderHintCards["sourceType"]}
							positionLeft={220}
							positionTop={-50}
							isOpenBody={sourcesBuilderHints["sourceType"].showBody}
							toggleClick={() =>
								changeSourcesBuilderHint("sourceType", "showBody", "toggle")
							}
							closeClick={() =>
								changeSourcesBuilderHint("sourceType", "showBody", "close")
							}
						/>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default ChooseSourceTypeBox;
