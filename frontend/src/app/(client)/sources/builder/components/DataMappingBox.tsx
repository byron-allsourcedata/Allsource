import React, { ReactNode, RefObject } from "react";
import {
	Box,
	FormControl,
	Grid,
	IconButton,
	MenuItem,
	Select,
	TextField,
	Typography,
} from "@mui/material";
import { CustomButton } from "@/components/ui";
import HintCard from "../../../components/HintCard";
import { useSourcesHints } from "../../context/SourcesHintsContext";
import { useSourcesBuilder } from "../../context/SourceBuilderContext";
import { builderHintCards } from "../../context/hintsCardsContent";
import scrollToBlock from "@/utils/autoscroll";
import { BuilderKey } from "../../context/hintsCardsContent";
import Image from "next/image";
import { LogoSmall } from "@/components/ui/Logo";
import HintBanner from "./HintBanner";
import { BorderLinearProgress } from "@/components/ui/progress-bars/BorderLinearProgress";

interface ChooseDomainContactTypeProps {
	renderSkeleton: (key: BuilderKey) => ReactNode;
	closeDotHintClick: (key: BuilderKey) => void;
	openDotHintClick: (key: BuilderKey) => void;
	closeSkeleton: (key: BuilderKey) => void;
}

const ChooseDomainContactType: React.FC<ChooseDomainContactTypeProps> = ({
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
		block3Ref,
		file,
		sourceType,
		setHeadingsNotSubstitution,
		headingsNotSubstitution,
		isContinuePressed,
		showTargetStep,
		mappingRows,
		setMappingRows,
		isChatGPTProcessing,
		headersinCSV,
		setShowTargetStep,
		hasUnsubstitutedHeadings,
		setIsContinuePressed,
	} = useSourcesBuilder();

	const handleMapListChange = (
		id: number,
		csvValue: string,
		ourValue: string,
	) => {
		setMappingRows((prev) => {
			let rows = prev;
			if (ourValue === "ASID") {
				rows = rows
					.filter((row) => row.isRequiredForAsidMatching)
					.map((row) => {
						if (row.type === "ASID") {
							return { ...row, canDelete: false };
						} else {
							return { ...row };
						}
					});
			}

			return rows.map((row) =>
				row.id === id ? { ...row, value: csvValue } : row,
			);
		});

		setHeadingsNotSubstitution((prev) => ({
			...prev,
			[ourValue]: false,
		}));
	};

	const handleDelete = (id: number) => {
		setMappingRows(
			mappingRows.map((row) =>
				row.id === id ? { ...row, isHidden: true } : row,
			),
		);
	};

	const handleAdd = () => {
		const hiddenRowIndex = mappingRows.findIndex((row) => row.isHidden);
		if (hiddenRowIndex !== -1) {
			const updatedRows = [...mappingRows];
			updatedRows[hiddenRowIndex].isHidden = false;
			setMappingRows(updatedRows);
		}
	};

	return (
		<Box
			ref={block3Ref}
			sx={{
				display: file ? "flex" : "none",
				flexDirection: "column",
				position: "relative",
				gap: 2,
				flexWrap: "wrap",
				border: "1px solid rgba(228, 228, 228, 1)",
				borderRadius: "6px",
				padding: "20px",
			}}
		>
			{isChatGPTProcessing && (
				<Box
					sx={{
						width: "100%",
						position: "absolute",
						top: 0,
						left: 0,
						zIndex: 1200,
					}}
				>
					<BorderLinearProgress
						variant="indeterminate"
						sx={{ borderRadius: "6px" }}
					/>
				</Box>
			)}
			<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
				<Typography
					sx={{
						fontFamily: "var(--font-nunito)",
						fontSize: "16px",
						fontWeight: 500,
					}}
				>
					Data Maping
				</Typography>
				<Typography
					sx={{
						fontFamily: "var(--font-roboto)",
						fontSize: "12px",
						color: "rgba(95, 99, 104, 1)",
					}}
				>
					Map your Field from your Source to the destination data base.
				</Typography>
				{!isContinuePressed && <HintBanner sourceType={sourceType} />}
			</Box>

			<Box
				sx={{
					position: "relative",
					display: "flex",
					flexDirection: "column",
					gap: 1,
				}}
			>
				<Grid
					container
					alignItems="center"
					sx={{ flexWrap: { xs: "nowrap", sm: "wrap" } }}
				>
					<Grid item xs={5} sm={3} sx={{ textAlign: "center" }}>
						<LogoSmall alt="logo" height={22} width={34} />
					</Grid>
					<Grid item xs={1} sm={0.5}>
						&nbsp;
					</Grid>
					<Grid item xs={5} sm={3} sx={{ textAlign: "center" }}>
						<Image src="/csv-icon.svg" alt="scv" height={22} width={34} />
					</Grid>
				</Grid>
				{mappingRows
					?.filter((row) => !row.isHidden)
					.sort((a, b) => {
						if (a.type === "Phone number") return 1;
						if (b.type === "Phone number") return -1;
						return 0;
					})
					.map((row, index) => (
						<Box
							key={index}
							sx={{
								mb:
									!row.canDelete && headingsNotSubstitution[row.type]
										? "10px"
										: 0,
							}}
						>
							<Grid
								container
								spacing={2}
								alignItems="center"
								sx={{ flexWrap: { xs: "nowrap", sm: "wrap" } }}
							>
								{/* Left Input Field */}
								<Grid item xs={5} sm={3}>
									<TextField
										fullWidth
										variant="outlined"
										value={row.type}
										disabled={true}
										InputLabelProps={{
											sx: {
												fontFamily: "var(--font-nunito)",
												fontSize: "12px",
												lineHeight: "16px",
												color: "rgba(17, 17, 19, 0.60)",
												top: "-5px",
												"&.Mui-focused": {
													color: "rgba(56, 152, 252, 1)",
													top: 0,
												},
												"&.MuiInputLabel-shrink": {
													top: 0,
												},
											},
										}}
										InputProps={{
											sx: {
												"&.MuiOutlinedInput-root": {
													height: "36px",
													"& .MuiOutlinedInput-input": {
														padding: "6.5px 8px",
														fontFamily: "var(--font-roboto)",
														color: "#202124",
														fontSize: "12px",
														fontWeight: "400",
														lineHeight: "20px",
													},
													"& .MuiOutlinedInput-notchedOutline": {
														borderColor: "#A3B0C2",
													},
													"&:hover .MuiOutlinedInput-notchedOutline": {
														borderColor: "#A3B0C2",
													},
													"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
														borderColor: "rgba(56, 152, 252, 1)",
													},
												},
												"&+.MuiFormHelperText-root": {
													marginLeft: "0",
												},
											},
										}}
									/>
								</Grid>

								{/* Middle Icon Toggle (Right Arrow or Close Icon) */}
								<Grid item xs={1} sm={0.5} container justifyContent="center">
									<Image
										src="/chevron-right-purple.svg"
										alt="chevron-right-purple"
										height={18}
										width={18}
									/>
								</Grid>

								<Grid item xs={5} sm={3}>
									<FormControl fullWidth sx={{ height: "36px" }}>
										<Select
											value={row.value || ""}
											onChange={(e) =>
												handleMapListChange(row.id, e.target.value, row.type)
											}
											displayEmpty
											inputProps={{
												sx: {
													height: "36px",
													padding: "6.5px 8px",
													fontFamily: "var(--font-roboto)",
													fontSize: "12px",
													fontWeight: "400",
													color: "#202124",
													lineHeight: "20px",
												},
											}}
											sx={{
												"&.MuiOutlinedInput-root": {
													height: "36px",
													"& .MuiOutlinedInput-notchedOutline": {
														borderColor: "#A3B0C2",
													},
													"&:hover .MuiOutlinedInput-notchedOutline": {
														borderColor: "#A3B0C2",
													},
													"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
														borderColor: "rgba(56, 152, 252, 1)",
													},
												},
											}}
										>
											{headersinCSV.map((item: string, index: number) => (
												<MenuItem key={index} value={item}>
													{item}
												</MenuItem>
											))}
										</Select>
										{!row.canDelete &&
											headingsNotSubstitution[row.type] &&
											headingsNotSubstitution[row.type] && (
												<Typography
													sx={{
														fontFamily: "var(--font-nunito)",
														fontSize: "12px",
														color: "rgba(224, 49, 48, 1)",
													}}
												>
													Please match
												</Typography>
											)}
									</FormControl>
								</Grid>

								{/* Delete Icon */}
								<Grid item xs={1} sm={0.5} container justifyContent="center">
									{row.canDelete && (
										<>
											<IconButton onClick={() => handleDelete(row.id)}>
												<Image
													src="/trash-icon-filled.svg"
													alt="trash-icon-filled"
													height={18}
													width={18}
												/>
											</IconButton>
										</>
									)}
								</Grid>
							</Grid>
						</Box>
					))}
				{mappingRows.some((row) => row.isHidden) && (
					<Box
						sx={{ display: "flex", justifyContent: "flex-start" }}
						onClick={handleAdd}
					>
						<Typography
							sx={{
								fontFamily: "var(--font-nunito)",
								lineHeight: "22.4px",
								fontSize: "14px",
								fontWeight: "600",
								color: "rgba(56, 152, 252, 1)",
								cursor: "pointer",
							}}
						>
							+ Add more
						</Typography>
					</Box>
				)}
				{sourcesBuilderHints["dataMaping"].show && (
					<HintCard
						card={builderHintCards["dataMaping"]}
						positionLeft={460}
						isOpenBody={sourcesBuilderHints["dataMaping"].showBody}
						toggleClick={() =>
							changeSourcesBuilderHint("dataMaping", "showBody", "toggle")
						}
						closeClick={() =>
							changeSourcesBuilderHint("dataMaping", "showBody", "close")
						}
					/>
				)}
			</Box>

			{!showTargetStep && (
				<Box sx={{ display: "flex", justifyContent: "right" }}>
					<CustomButton
						disabled={isChatGPTProcessing || hasUnsubstitutedHeadings()}
						variant="contained"
						onClick={() => {
							setShowTargetStep(true);
							setTimeout(() => {
								scrollToBlock(block4Ref as RefObject<HTMLDivElement>);
							}, 0);
							closeDotHintClick("sourceFile");
							openDotHintClick("targetType");
							closeSkeleton("targetType");
							setIsContinuePressed(true);
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
	);
};

export default ChooseDomainContactType;
