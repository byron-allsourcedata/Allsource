import React, { ReactNode, RefObject, useState } from "react";
import { Box, TextField, Typography } from "@mui/material";
import HintCard from "../../../components/HintCard";
import { useSourcesHints } from "../../context/SourcesHintsContext";
import { useSourcesBuilder } from "../../context/SourceBuilderContext";
import { builderHintCards } from "../../context/hintsCardsContent";
import { BuilderKey } from "../../context/hintsCardsContent";
import { CustomButton } from "@/components/ui";
import { useRouter } from "next/navigation";
import { showErrorToast } from "@/components/ToastNotification";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { fetchUserData } from "@/services/meService";
import { NewSource } from "./types";
import { useSidebar } from "@/context/SidebarContext";

interface SelectTargetTypeProps {
	renderSkeleton: (key: BuilderKey, height: string) => ReactNode;
	setLoading: (state: boolean) => void;
	convertToDBFormat: (sourceType: string) => string;
}

const CreateSourceFormBox: React.FC<SelectTargetTypeProps> = ({
	renderSkeleton,
	setLoading,
	convertToDBFormat,
}) => {
	const {
		changeSourcesBuilderHint,
		sourcesBuilderHints,
		resetSourcesBuilderHints,
	} = useSourcesHints();

	const {
		block6Ref,
		skeletons,
		pixelNotInstalled,
		sourceMethod,
		setSourceMethod,
		eventTypes,
		eventType,
		selectedDomainId,
		sourceType,
		setSourceType,
		targetAudience,
		hasUnsubstitutedHeadings,
		headingsNotSubstitution,
		fileUrl,
		handleDeleteFile,
		mappingRows,
	} = useSourcesBuilder();

	const router = useRouter();

	const { setIsGetStartedPage, setInstalledResources } = useSidebar();

	const handleSumbit = async () => {
		setLoading(true);

		const rowsToSubmit = mappingRows
			.filter((row) => !row.isHidden)
			.filter(
				(row) =>
					headingsNotSubstitution.hasOwnProperty(row.type) &&
					!headingsNotSubstitution[row.type],
			)
			.map(({ id, canDelete, isHidden, ...rest }) => rest);

		const newSource: NewSource = {
			target_schema: toSnakeCase(targetAudience),
			source_type:
				sourceMethod === 1
					? convertToDBFormat(sourceType)
					: convertToDBFormat2(eventType),
			source_origin: sourceMethod === 1 ? "csv" : "pixel",
			source_name: sourceName,
		};

		if (sourceMethod === 1) {
			newSource.file_url = fileUrl;
			newSource.rows = rowsToSubmit;
		}

		if (sourceMethod === 2) {
			newSource.domain_id = selectedDomainId;
		}

		try {
			const response = await axiosInstance.post(
				`/audience-sources/create`,
				newSource,
				{
					headers: { "Content-Type": "application/json" },
				},
			);
			if (response.status === 200) {
				await fetchUserData(setIsGetStartedPage, setInstalledResources);
				const dataString = encodeURIComponent(JSON.stringify(response.data));
				router.push(`/sources/created-source?data=${dataString}`);
			}
		} catch {
		} finally {
			setLoading(false);
		}
	};

	const [sourceName, setSourceName] = useState<string>("");

	const convertToDBFormat2 = (eventTypesArr: number[]) => {
		return eventTypesArr
			.map((id) => {
				const eventType = eventTypes.find((event) => event.id === id);
				return eventType?.title;
			})
			.filter((name) => name)
			.join(",");
	};

	const toSnakeCase = (str: string) => {
		return str
			.replace(/\s+/g, "_")
			.replace(/([a-z])([A-Z])/g, "$1_$2")
			.toLowerCase();
	};

	return (
		<>
			<Box
				ref={block6Ref}
				sx={{
					display: "flex",
					flexDirection: "column",
				}}
			>
				{!skeletons["name"] && (
					<Box
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
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								position: "relative",
								gap: 2,
								"@media (max-width: 400px)": {
									justifyContent: "space-between",
								},
							}}
						>
							<Typography
								sx={{
									fontFamily: "var(--font-nunito)",
									fontSize: "16px",
									fontWeight: 500,
								}}
							>
								Create Name
							</Typography>
							<TextField
								id="outlined"
								label="Name"
								InputLabelProps={{
									sx: {
										color: "rgba(17, 17, 19, 0.6)",
										fontFamily: "var(--font-nunito)",
										fontWeight: 400,
										fontSize: "15px",
										padding: 0,
										top: "-1px",
										margin: 0,
									},
								}}
								sx={{
									width: "250px",
									"@media (max-width: 400px)": { width: "150px" },
									"& .MuiInputLabel-root.Mui-focused": {
										color: "rgba(17, 17, 19, 0.6)",
									},
									"& .MuiInputLabel-root[data-shrink='false']": {
										transform: "translate(16px, 50%) scale(1)",
									},
									"& .MuiOutlinedInput-root": {
										maxHeight: "40px",
									},
								}}
								InputProps={{
									className: "form-input",
								}}
								value={sourceName}
								onChange={(e) => {
									if (e.target.value.length < 128) {
										setSourceName(e.target.value);
									} else {
										showErrorToast("Your name is too long!");
									}
								}}
							/>
							{sourcesBuilderHints["name"].show && (
								<HintCard
									card={builderHintCards["name"]}
									positionLeft={380}
									isOpenBody={sourcesBuilderHints["name"].showBody}
									toggleClick={() =>
										changeSourcesBuilderHint("name", "showBody", "toggle")
									}
									closeClick={() =>
										changeSourcesBuilderHint("name", "showBody", "close")
									}
								/>
							)}
						</Box>
					</Box>
				)}
				{renderSkeleton("name", "82px")}
			</Box>
			<Box
				sx={{
					display: "flex",
					gap: 2,
					flexWrap: "wrap",
					justifyContent: "flex-end",
					borderRadius: "6px",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
					<CustomButton
						variant="outlined"
						onClick={() => {
							setSourceMethod(0);
							handleDeleteFile();
							setSourceName("");
							setSourceType("");
							router.push("/sources");
						}}
						sx={{
							width: "92px",
							height: "40px",
						}}
					>
						Cancel
					</CustomButton>
					<CustomButton
						variant="contained"
						onClick={handleSumbit}
						disabled={
							sourceName.trim() === "" ||
							hasUnsubstitutedHeadings() ||
							pixelNotInstalled
						}
						sx={{
							width: "120px",
							height: "40px",
						}}
					>
						Create
					</CustomButton>
				</Box>
			</Box>
		</>
	);
};

export default CreateSourceFormBox;
