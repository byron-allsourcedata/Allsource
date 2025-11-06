import React from "react";
import {
	Box,
	Typography,
	Drawer,
	Link,
	IconButton,
	Button,
	LinearProgress,
} from "@mui/material";
import { useState } from "react";
import Image from "next/image";
import CloseIcon from "@mui/icons-material/Close";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import { useIntegrationContext } from "@/context/IntegrationContext";

interface CreateWebhookProps {
	handleClose: () => void;
	onSave?: (new_integration: any) => void;
	open: boolean;
	initApiKey?: string;
	boxShadow?: string;
	invalid_api_key?: boolean;
}

const WebhookConnectPopup = ({
	handleClose,
	open,
	onSave,
	initApiKey,
	boxShadow,
	invalid_api_key,
}: CreateWebhookProps) => {
	const { triggerSync, setNeedsSync } = useIntegrationContext();
	const [loading, setLoading] = useState(false);

	const handleApiKeySave = async () => {
		try {
			setLoading(true);
			const response = await axiosInstance.post(
				"/integrations/",
				{},
				{ params: { service_name: "webhook" } },
			);
			if (response.status === 200 && response.data === "SUCCESS") {
				showToast("Integration Webhook Successfully");
				if (onSave) {
					onSave({ service_name: "webhook", is_failed: false });
				}
				handleClose();
				await triggerSync();
				setNeedsSync(false);
			} else {
				showErrorToast("Error connect webhook");
			}
		} catch (error) {
		} finally {
			setLoading(false);
		}
	};

	const getButton = (tabValue: string) => {
		switch (tabValue) {
			case "1":
				return (
					<Button
						variant="contained"
						onClick={handleApiKeySave}
						sx={{
							backgroundColor: "rgba(56, 152, 252, 1)",
							fontFamily: "var(--font-nunito)",
							fontSize: "14px",
							fontWeight: "600",
							lineHeight: "20px",
							letterSpacing: "normal",
							color: "#fff",
							textTransform: "none",
							padding: "10px 24px",
							boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
							"&:hover": {
								backgroundColor: "rgba(56, 152, 252, 1)",
							},
							borderRadius: "4px",
						}}
					>
						Connect
					</Button>
				);
			default:
				return null;
		}
	};

	return (
		<>
			{loading && (
				<Box
					sx={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: "rgba(0, 0, 0, 0.2)",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						zIndex: 1400,
						overflow: "hidden",
					}}
				>
					<Box sx={{ width: "100%", top: 0, height: "100vh" }}>
						<LinearProgress />
					</Box>
				</Box>
			)}
			<Drawer
				anchor="right"
				open={open}
				onClose={handleClose}
				PaperProps={{
					sx: {
						width: "40%",
						position: "fixed",
						top: 0,
						boxShadow: boxShadow
							? "0px 8px 10px -5px rgba(0, 0, 0, 0.2), 0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12)"
							: "none",
						bottom: 0,
						msOverflowStyle: "none",
						scrollbarWidth: "none",
						"&::-webkit-scrollbar": {
							display: "none",
						},
						"@media (max-width: 600px)": {
							width: "100%",
						},
					},
				}}
				slotProps={{
					backdrop: {
						sx: {
							backgroundColor: boxShadow ? boxShadow : "rgba(0, 0, 0, 0.01)",
						},
					},
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						py: 2.85,
						px: 2,
					}}
				>
					<Typography
						variant="h6"
						sx={{
							textAlign: "center",
							color: "#202124",
							fontFamily: "var(--font-nunito)",
							fontWeight: "600",
							fontSize: "16px",
							lineHeight: "normal",
						}}
					>
						Connect to Webhook
					</Typography>
					<Box
						sx={{
							display: "flex",
							gap: "32px",
							"@media (max-width: 600px)": { gap: "8px" },
						}}
					>
						<Link
							href="https://allsourceio.zohodesk.com/portal/en/kb/articles/connect-to-webhook"
							target="_blank"
							rel="noopener refferer"
							sx={{
								fontFamily: "var(--font-nunito)",
								fontSize: "14px",
								fontWeight: "600",
								lineHeight: "20px",
								color: "rgba(56, 152, 252, 1)",
								textDecorationColor: "rgba(56, 152, 252, 1)",
							}}
						>
							Tutorial
						</Link>
						<IconButton onClick={handleClose} sx={{ p: 0 }}>
							<CloseIcon sx={{ width: "20px", height: "20px" }} />
						</IconButton>
					</Box>
				</Box>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						alignItems: "center",
						height: "100%",
						borderTop: "1px solid #e4e4e4",
						padding: "1rem 1.5rem",
					}}
				>
					<Box
						sx={{
							width: "100%",
							height: "320px",
							border: "1px solid rgba(240, 240, 240, 1)",
							display: "flex",
							flexDirection: "column",
							justifyContent: "space-between",
							alignItems: "center",
							textAlign: "center",
							background: "#fff",
							padding: "1rem",
						}}
					>
						<Box
							sx={{
								display: "flex",
								gap: 1,
								alignItems: "center",
								textAlign: "left",
								width: "100%",
							}}
						>
							<Image
								src="/webhook-icon.svg"
								alt="Webhook Header"
								height={30}
								width={30}
							/>
							<Typography
								sx={{
									fontFamily: "var(--font-nunito)",
									fontWeight: 600,
									fontSize: "16px",
									color: "rgba(32, 33, 36, 1)",
									alignSelf: "flex-start",
									pt: "1px",
								}}
							>
								Connect to Webhook
							</Typography>
						</Box>

						<Box
							component="img"
							src="/webhook-plug.svg"
							alt="webhook-illustration"
							sx={{
								maxWidth: "540px",
								objectFit: "contain",
								flexGrow: 1,
							}}
						/>

						<Button
							variant="contained"
							fullWidth
							sx={{
								backgroundColor: "rgba(56, 152, 252, 1)",
								fontFamily: "var(--font-nunito)",
								fontSize: "14px",
								fontWeight: "600",
								lineHeight: "20px",
								letterSpacing: "normal",
								color: "#fff",
								textTransform: "none",
								padding: "10px 24px",
								boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
								"&:hover": {
									backgroundColor: "rgba(56, 152, 252, 1)",
								},
								borderRadius: "4px",
							}}
							onClick={() => handleApiKeySave()}
						>
							Connect
						</Button>

						{invalid_api_key && (
							<Typography
								color="error"
								sx={{
									fontFamily: "var(--font-nunito)",
									fontSize: "14px",
									fontWeight: 600,
									marginTop: "12px",
								}}
							>
								Invalid API Key detected. Please reconnect to Webhook and try
								again.
							</Typography>
						)}
					</Box>
				</Box>
			</Drawer>
		</>
	);
};

export default WebhookConnectPopup;
