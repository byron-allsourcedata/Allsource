import React, { ChangeEvent, useState, useEffect } from "react";
import {
	Drawer,
	Backdrop,
	Box,
	Typography,
	Button,
	IconButton,
	TextField,
	LinearProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { styled } from "@mui/material/styles";
import { showErrorToast, showToast } from "@/components/ToastNotification";

interface FormUploadPopupProps {
	isMaster?: boolean;
	open: boolean;
	userID: number;
	onClose: () => void;
	updateOrAddPartner: () => void;
}

const MakePartnerPopup: React.FC<FormUploadPopupProps> = ({
	userID,
	isMaster,
	open,
	onClose,
	updateOrAddPartner,
}) => {
	const [action, setAction] = useState("Edit");
	const [buttonContain, setButtonContain] = useState(false);
	const [commission, setCommission] = useState("");
	const [processing, setProcessing] = useState(false);
	const [commissionError, setCommissionError] = useState(false);

	const handleCommissionChange = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const numericValue = Number(value);

		const isValid =
			value !== "" &&
			!isNaN(numericValue) &&
			numericValue >= 1 &&
			numericValue <= 70;

		setCommission(value);
		setCommissionError(!isValid);
		setButtonContain(isValid);
	};

	const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
		height: 4,
		borderRadius: 0,
		backgroundColor: "#c6dafc",
		"& .MuiLinearProgress-bar": {
			borderRadius: 5,
			backgroundColor: "#4285f4",
		},
	}));

	const handleClose = () => {
		onClose();
		setCommission("");
	};

	const handleSubmit = async () => {
		setProcessing(true);
		setButtonContain(false);

		const requestData = {
			user_id: userID,
			commission: parseInt(commission),
			is_master: isMaster || false,
		};

		try {
			const response = await axiosInstance.post(
				"/admin-partners/promote-user",
				requestData,
				{
					headers: { "Content-Type": "application/json" },
				},
			);

			if (response.status === 200) {
				if (response.data?.message === "SUCCESS") {
					updateOrAddPartner();
					showToast("Partner successfully submitted!");
				} else if (response.data?.message) {
					showErrorToast(response.data.message);
				} else {
					showErrorToast("Unknown response from server.");
				}
			}
		} catch {
			showErrorToast("Failed to submit the invite. Please try again.");
		} finally {
			handleClose();
			setCommission("");
			setProcessing(false);
		}
	};

	return (
		<>
			<Backdrop
				open={open}
				onClick={onClose}
				sx={{ zIndex: 1200, color: "#fff" }}
			/>
			<Drawer
				anchor="right"
				onClose={onClose}
				slotProps={{
					backdrop: {
						sx: {
							backgroundColor: "rgba(0, 0, 0, 0.01)",
						},
					},
				}}
				open={open}
			>
				{processing && (
					<Box
						sx={{
							width: "100%",
							position: "fixed",
							top: "4.2rem",
							zIndex: 1200,
						}}
					>
						<BorderLinearProgress variant="indeterminate" />
					</Box>
				)}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						padding: "24px",
						pb: "11px",
						borderBottom: "1px solid #e4e4e4",
						position: "sticky",
						top: 0,
						zIndex: 9900,
						backgroundColor: "#fff",
					}}
				>
					<Typography
						sx={{
							fontFamily: "var(--font-nunito)",
							fontSize: "16px",
							fontWeight: "600",
							lineHeight: "21.82px",
							color: "#202124",
						}}
					>
						Set Referral Commission Rate
					</Typography>
					<Box sx={{ display: "flex", flexDirection: "row" }}>
						<IconButton onClick={handleClose}>
							<CloseIcon sx={{ width: "16px", height: "16px" }} />
						</IconButton>
					</Box>
				</Box>
				<Box
					sx={{
						padding: "0 32px",
					}}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: "32px",
						}}
					>
						<Typography
							sx={{
								fontFamily: "var(--font-nunito)",
								fontSize: "16px",
								fontWeight: "600",
								lineHeight: "21.82px",
								marginTop: "24px",
							}}
						>
							Set the earnings percentage for this user's referrals.
						</Typography>

						<TextField
							id="outlined-required"
							label="Commission %"
							placeholder="Commission"
							InputLabelProps={{
								sx: {
									color: "rgba(17, 17, 19, 0.6)",
									fontFamily: "var(--font-nunito)",
									fontWeight: 400,
									fontSize: "15px",
									top: "-1px",
									padding: 0,
									margin: 0,
								},
							}}
							sx={{
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
							value={commission}
							onChange={handleCommissionChange}
							error={commissionError}
							helperText={
								commissionError
									? `Commission must be a number between 1 and 70`
									: ""
							}
						/>
					</Box>
				</Box>
				<Box
					sx={{
						display: "flex",
						justifyContent: "flex-end",
						gap: "16px",
						borderTop: "1px solid #e4e4e4",
						position: "absolute",
						width: "100%",
						bottom: 0,
						zIndex: 9901,
						padding: "20px 1em",
					}}
				>
					<Button
						variant="outlined"
						onClick={handleClose}
						sx={{
							borderColor: "rgba(56, 152, 252, 1)",
							width: "92px",
							height: "40px",
							":hover": {
								borderColor: "rgba(30, 136, 229, 1)",
							},
							":active": {
								borderColor: "rgba(56, 152, 252, 1)",
							},
							":disabled": {
								borderColor: "rgba(56, 152, 252, 1)",
								opacity: 0.4,
							},
						}}
					>
						<Typography
							sx={{
								textAlign: "center",
								color: "rgba(56, 152, 252, 1)",
								textTransform: "none",
								fontFamily: "var(--font-nunito)",
								fontWeight: "600",
								fontSize: "14px",
								lineHeight: "19.6px",
								":hover": { color: "rgba(30, 136, 229, 1)" },
							}}
						>
							Cancel
						</Typography>
					</Button>
					<Button
						variant="contained"
						onClick={handleSubmit}
						disabled={!buttonContain}
						sx={{
							backgroundColor: "rgba(56, 152, 252, 1)",
							width: "120px",
							height: "40px",
							":hover": {
								backgroundColor: "rgba(30, 136, 229, 1)",
							},
							":active": {
								backgroundColor: "rgba(56, 152, 252, 1)",
							},
							":disabled": {
								backgroundColor: "rgba(56, 152, 252, 1)",
								opacity: 0.6,
							},
						}}
					>
						<Typography
							sx={{
								textAlign: "center",
								color: "rgba(255, 255, 255, 1)",
								fontFamily: "var(--font-nunito)",
								textTransform: "none",
								fontWeight: "600",
								fontSize: "14px",
								lineHeight: "19.6px",
							}}
						>
							{action === "Edit" ? "Update" : "Send"}
						</Typography>
					</Button>
				</Box>
			</Drawer>
		</>
	);
};

export default MakePartnerPopup;
