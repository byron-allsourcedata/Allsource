"use client";

import React from "react";
import {
	Modal,
	Box,
	Typography,
	IconButton,
	Button,
	Stack,
	Paper,
	SxProps,
	Theme,
} from "@mui/material";
import {
	CloseIcon,
	WarningRoundedIcon,
	WarningAmberRoundedIcon,
	LaunchRoundedIcon,
} from "@/icon";
import FixCard from "./FixCard";
import { useRouter } from "next/navigation";

interface ModalProps {
	open: boolean;
	onClose: () => void;
}

export const popupStyle: Record<string, SxProps<Theme>> = {
	regularText: {
		marginTop: "16px",
		fontFamily: "var(--font-roboto)",
		fontSize: "16px",
		fontWeight: 400,
		color: "#5F6368",
	},
	boldText: {
		fontSize: "16px",
		fontWeight: 500,
		fontFamily: "var(--font-roboto)",
		color: "#5F6368",
	},
	learnMoreText: {
		fontFamily: "var(--font-nunito)",
		fontSize: "14px",
		fontWeight: 500,
		textTransform: "none",
		textDecoration: "underline",
		color: "#3898FC",
	},
	learnMoreIcon: {
		fontSize: "16px",
		marginLeft: "5px",
	},
};

const BadSourceErrorModal: React.FC<ModalProps> = ({ open, onClose }) => {
	const router = useRouter();

	return (
		<Modal open={open} onClose={onClose}>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					position: "absolute",
					top: "50%",
					left: "50%",
					padding: "24px",
					transform: "translate(-50%, -50%)",
					width: "75%",
					maxWidth: "1000px",
					bgcolor: "#fff",
					borderRadius: "4px",
					boxShadow: "1px 4px 6.8px rgba(0, 0, 0, 0.15)",
					maxHeight: "90vh",
					overflowY: "auto",
				}}
			>
				{/* Close button */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "flex-end",
					}}
				>
					<IconButton onClick={onClose}>
						<CloseIcon
							sx={{
								width: "24px",
								height: "24px",
							}}
						/>
					</IconButton>
				</Box>

				{/* Title and Description */}
				<Box>
					{/* Modal Title */}
					<Box
						sx={{
							marginBottom: "24px",
						}}
					>
						<Typography
							sx={{
								textAlign: "center",
								fontWeight: 400,
								color: "#E03130",
								fontFamily: "var(--font-nunito)",
								fontSize: "26px",
							}}
						>
							<Box
								component="span"
								sx={{ display: "inline-flex", alignItems: "center" }}
							>
								<WarningAmberRoundedIcon
									sx={{ width: "32px", height: "32px", marginRight: "8px" }}
								/>
								Training Failed: Data Issue
							</Box>
						</Typography>
						<Typography
							sx={{
								textAlign: "center",
								fontWeight: 400,
								color: "#5F6368",
								fontFamily: "var(--font-nunito)",
								fontSize: "18px",
							}}
						>
							We couldn’t train your model due to issues in the uploaded data.
							Fix these issues, re-upload your file, and try again.
						</Typography>
					</Box>

					{/* Error box */}
					<Box
						sx={{
							border: "1px solid #E03130",
							borderRadius: "4px",
							bgcolor: "#FCEAEA",
							padding: "16px",
							marginBottom: "24px",
							position: "relative" as const,
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",

								"@media (max-width:900px)": {
									flexWrap: "wrap",
									flexDirection: "column",
								},
							}}
						>
							<Typography
								sx={{
									display: "flex",
									flexDirection: "row",
								}}
							>
								<WarningRoundedIcon
									sx={{
										color: "#E03130",
										marginRight: "8px",
										fontSize: "24px",
									}}
								/>
								<Typography
									sx={{
										color: "#202124",
										fontFamily: "var(--font-nunito)",
										fontSize: "16px",
										fontWeight: 600,
										textAlign: "center",
									}}
								>
									Dataset is too small
								</Typography>
							</Typography>
							<Box sx={{ flexGrow: 1 }} />
							<Box
								sx={{
									position: "absolute",
									top: 0,
									right: 0,
									marginTop: "4px",
									marginRight: "8px",

									"@media (max-width:900px)": {
										position: "static",
									},
								}}
							>
								<Button
									href="https://allsourceio.zohodesk.com/portal/en/kb/allsource"
									sx={popupStyle.learnMoreText}
								>
									Learn more <LaunchRoundedIcon sx={popupStyle.learnMoreIcon} />
								</Button>
							</Box>
						</Box>
						<Typography sx={popupStyle.regularText}>
							The dataset must contain enough rows (at least 500) to allow the
							model to learn meaningful patterns.{" "}
							<Typography sx={popupStyle.boldText}>
								Upload a larger dataset with more examples. Bigger dataset =
								Better results.
							</Typography>
						</Typography>
					</Box>

					<Typography
						sx={{
							fontFamily: "var(--font-nunito)",
							fontSize: "16px",
							fontWeight: 400,
							marginBottom: "16px",
						}}
					>
						You can also check:
					</Typography>

					{/* Additional suggestions */}
					<Stack spacing={2}>
						<FixCard
							title="Sale amount/frequency are the same for all customers"
							description="Machine learning requires variation in data. If all the values are identical (e.g., all $200), the model can't learn how to distinguish between customers."
							boldNote="Make sure the target column contains distinct values."
							learnMoreHref="#"
						/>

						<FixCard
							title="Invalid date formats"
							description="Some columns may contain dates in inconsistent or unrecognized formats."
							boldNote="Ensure all dates follow a consistent and valid format like YYYY-MM-DD (e.g., 2024-07-04)."
							learnMoreHref="#"
						/>

						<FixCard
							title="Invalid email formats"
							description="Email columns may contain values that don't resemble valid email addresses."
							boldNote="Check for and correct entries with typos or missing parts (e.g., @domain.com, user@)."
							learnMoreHref="#"
						/>
					</Stack>

					{/* Bottom buttons */}
					<Stack
						spacing={2}
						direction="row"
						useFlexGap
						sx={{
							flexWrap: "wrap",
							justifyContent: "flex-end",
							marginTop: "24px",
						}}
					>
						<Button
							variant="outlined"
							onClick={() =>
								router.push(
									"https://allsourceio.zohodesk.com/portal/en/kb/allsource",
								)
							}
							sx={{
								textTransform: "none",
								fontFamily: "var(--font-nunito)",
								fontSize: "14px",
								fontWeight: 600,
								color: "#3898FC",
								boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.25)",
							}}
						>
							Contact Support
						</Button>
						<Button
							variant="contained"
							onClick={() => router.push("/sources/builder")}
							sx={{
								textTransform: "none",
								fontFamily: "var(--font-nunito)",
								fontSize: "14px",
								fontWeight: 600,
								backgroundColor: "#3898FC",
								boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.25)",
							}}
						>
							Re-Upload CSV
						</Button>
					</Stack>
				</Box>
			</Box>
		</Modal>
	);
};

export default BadSourceErrorModal;
