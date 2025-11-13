import React, { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	Typography,
	Box,
	CardContent,
	CardActions,
	Card,
	Stack,
	Divider,
	IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CustomButton from "@/components/ui/CustomButton";
import Image from "next/image";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { flagPixelPlan } from "@/services/payPixelPlan";
import { useFlagPayPixelPlan } from "@/hooks/usePixelPlan";

const PayPixelInstallationDrawer = () => {
	const [open, setOpen] = useState(true);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const isShowPayPixelDrawer = useFlagPayPixelPlan();

	const handleClose = () => {
		if (!isShowPayPixelDrawer.isCanClose) {
			flagPixelPlan.set(true, false);
		} else {
			flagPixelPlan.set(false, true);
			setOpen(false);
		}
	};

	const redirectToCheckoutSession = async () => {
		try {
			setIsLoading(true);

			const response = await axiosInstance.get(
				"/subscriptions/pay-pixel-install",
			);

			if (response.status === 200) {
				if (response.data != null) {
					window.location.href = response.data;
				}
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Dialog
				open={open}
				disablePortal
				hideBackdrop
				sx={{
					position: "absolute",
					zIndex: 9,
					"& .MuiDialog-paper": {
						borderRadius: "16px",
					},
				}}
				onClose={() => handleClose()}
			>
				<Box>
					<IconButton
						aria-label="close"
						onClick={handleClose}
						sx={{
							position: "absolute",
							right: 8,
							top: 8,
							color: "rgba(82, 82, 82, 1)",
						}}
					>
						<CloseIcon />
					</IconButton>
				</Box>
				<DialogTitle sx={{ p: "16px 16px 8px" }}>
					<Box sx={{ pt: 2 }}>
						<Typography
							fontWeight="600"
							fontSize="26px"
							textAlign="center"
							fontFamily="var(--font-nunito)"
						>
							Get Started for Just $5
						</Typography>
					</Box>
				</DialogTitle>
				<DialogContent sx={{ p: 2 }}>
					<Typography
						className="fourth-sub-title"
						sx={{
							textAlign: "center",
							lineHeight: 1.4,
							maxWidth: "380px",
							margin: "0 auto",
						}}
					>
						Get started now for only $5 for 14 days of contacts. Then $499/mo —
						unlimited pixel capture, no per-contact fees
					</Typography>

					<Card
						variant="outlined"
						sx={{
							border: "none",
							boxShadow: "none",
						}}
					>
						<CardContent
							sx={{ display: "flex", flexDirection: "column", gap: 2 }}
						>
							<Box
								sx={{
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
								}}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										width: "100%",
									}}
								>
									<Box
										sx={{
											height: "2px",
											flex: 1,
											background:
												"linear-gradient(to right, transparent, #88C1FD66)",
										}}
									/>

									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
											border: "2px solid #A3D2FF",
											borderRadius: "20px",
											px: 2,
											py: 0.5,
											backgroundColor: "#fff",
											position: "relative",
											zIndex: 1,
										}}
									>
										<Image
											src="/special_offer.png"
											alt="special offer icon"
											width={24}
											height={24}
										/>
										<Typography
											sx={{
												color: "#3898FC",
												fontWeight: 600,
												fontSize: "16px",
												fontFamily: "var(--font-nunito)",
											}}
										>
											Special offer
										</Typography>
									</Box>

									<Box
										sx={{
											height: "2px",
											flex: 1,
											background:
												"linear-gradient(to left, transparent, #88C1FD66)",
										}}
									/>
								</Box>
							</Box>

							<Box display="flex" alignItems="center" gap={2}>
								<Box
									sx={{
										backgroundColor: "#EBF5FF",
										padding: "6px",
										borderRadius: "8px",
									}}
								>
									<Image
										src="/your_gifts.svg"
										alt="your gifts icon"
										width={24}
										height={24}
									/>
								</Box>
								<Typography
									fontWeight="600"
									fontSize="20px"
									fontFamily="var(--font-nunito)"
								>
									Your Gifts
								</Typography>
							</Box>

							<Divider
								sx={{
									height: "2px",
									border: "none",
									background:
										"linear-gradient(to right, #FFFFFF, #88C1FD66, #FFFFFF)",
								}}
							/>

							<Stack spacing={2}>
								<GiftRow
									icon={
										<Image
											src="/domains_monitored.png"
											alt="domains monitored icon"
											width={24}
											height={24}
										/>
									}
									label="Domains monitored:"
									value="Unlimited"
								/>
								<GiftRow
									icon={
										<Image
											src="/free_contact_downloads.png"
											alt="free contact downloads icon"
											width={24}
											height={24}
										/>
									}
									label="Free Contact Downloads:"
									value="Unlimited"
								/>
							</Stack>
						</CardContent>
						<CardActions sx={{ pt: 0, pl: 2, pr: 2 }}>
							<CustomButton
								fullWidth
								variant="contained"
								onClick={redirectToCheckoutSession}
								sx={{ borderRadius: "8px" }}
							>
								GET 14 DAYS FOR $5
							</CustomButton>
						</CardActions>
						<Typography
							sx={{ pt: 0, pl: 2, pr: 2 }}
							className="sixth-sub-title"
							style={{ fontWeight: "500" }}
						>
							*After 14 days, $499/mo unless canceled. Full refund if canceled
							within 14 days.
						</Typography>
					</Card>
				</DialogContent>
			</Dialog>
		</>
	);
};

type GiftRowProps = {
	icon: React.ReactNode;
	label: string;
	value: string;
};

const GiftRow = ({ icon, label, value }: GiftRowProps) => (
	<Box
		sx={{
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			width: "100%",
		}}
	>
		<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
			<Box
				sx={{ backgroundColor: "#EBF5FF", borderRadius: "8px", padding: "6px" }}
			>
				{icon}
			</Box>
			<Box
				sx={{
					fontFamily: "var(--font-nunito)",
					fontSize: "16px",
					color: "#20212499",
					display: "flex",
					alignItems: "center",
					flex: 1,
					whiteSpace: "nowrap",
					overflow: "hidden",
				}}
			>
				<Box
					component="span"
					sx={{
						overflow: "hidden",
						textOverflow: "ellipsis",
						display: "inline-block",
						flexShrink: 0,
						maxWidth: "100%",
					}}
				>
					{label}
				</Box>
				<Box
					component="span"
					sx={{
						flexGrow: 1,
						borderBottom: "1px dashed #D7EAFE",
						mx: 1,
						height: "1em",
					}}
				/>
			</Box>
		</Box>
		<Typography className="seventh-sub-title">{value}</Typography>
	</Box>
);

export default PayPixelInstallationDrawer;
