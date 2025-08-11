import HintBanner from "@/app/(client)/sources/builder/components/HintBanner";
import { BorderLinearProgress } from "@/components/ui/progress-bars/BorderLinearProgress";
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
import type { FC } from "react";
import Image from "next/image";
import { SmartHintCard } from "./SmartHintCard";
import type { HintsProps } from "./PixelDomainSelector";
import type { MappingRow } from "../schemas";
import {
	builderHintCards,
	type BuilderKey,
} from "@/app/(client)/sources/context/hintsCardsContent";

type Props = {
	block3Ref: React.RefObject<HTMLDivElement | null>;
	smallLogoSrc: string;
	file: File | null;
	isChatGPTProcessing: boolean;
	hintsProps: HintsProps<BuilderKey>;
	isContinuePressed: boolean;
	sourceType: string;
	csvHeaders: string[];
	headingsNotSubstitution: Record<string, boolean>;
	mappingRows: MappingRow[];
	handleDelete: (id: number) => void;
	handleAdd: () => void;
	handleMapListChange: (id: number, value: string, type: string) => void;
};

export const CsvFieldMapperBlock: FC<Props> = ({
	block3Ref,
	file,
	isChatGPTProcessing,
	hintsProps,
	isContinuePressed,
	sourceType,
	csvHeaders,
	mappingRows,
	smallLogoSrc,
	headingsNotSubstitution,
	handleDelete,
	handleAdd,
	handleMapListChange,
}) => {
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
						<Image src={smallLogoSrc} alt="logo" height={22} width={34} />
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
							key={row.id}
							sx={{
								mb: headingsNotSubstitution[row.type] ? "10px" : 0,
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
											{csvHeaders.map((item: string, index: number) => (
												<MenuItem key={index + item} value={item}>
													{item}
												</MenuItem>
											))}
										</Select>
										{row.type !== "Phone number" &&
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
										<IconButton onClick={() => handleDelete(row.id)}>
											<Image
												src="/trash-icon-filled.svg"
												alt="trash-icon-filled"
												height={18}
												width={18}
											/>
										</IconButton>
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
				<SmartHintCard
					hints={hintsProps.hints}
					hintKey={"dataMaping"}
					hintCards={builderHintCards}
					position={{
						left: 460,
					}}
					changeHint={hintsProps.changeHint}
				/>
			</Box>
		</Box>
	);
};
