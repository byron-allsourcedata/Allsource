"use client";
import React, { Dispatch, SetStateAction, useMemo } from "react";
import { Box, Typography, IconButton, Drawer, Link } from "@mui/material";
import { CloseIcon } from "@/icon";
import Image from "next/image";
import { useBookingUrl } from "@/services/booking";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import CustomTooltip from "@/components/customToolTip";

interface AddFundsPopup {
	setCustomPlanPopupOpen: Dispatch<SetStateAction<boolean>>;
	customPlanPopupOpen: boolean;
}

export const CustomPlan: React.FC<AddFundsPopup> = ({
	setCustomPlanPopupOpen,
	customPlanPopupOpen,
}) => {
	const sourcePlatform = useMemo(() => {
		if (typeof window !== "undefined") {
			const savedMe = sessionStorage.getItem("me");
			if (savedMe) {
				try {
					const parsed = JSON.parse(savedMe);
					return parsed.source_platform || "";
				} catch (error) {}
			}
		}
		return "";
	}, [typeof window !== "undefined" ? sessionStorage.getItem("me") : null]);

	const handleCustomPlanPopupClose = () => {
		setCustomPlanPopupOpen(false);
	};

	const meetingUrl = useBookingUrl(axiosInstance);

	return (
		<Drawer
			anchor="right"
			open={customPlanPopupOpen}
			onClose={handleCustomPlanPopupClose}
			PaperProps={{
				sx: {
					width: "640px",
					position: "fixed",
					zIndex: 1301,
					top: 0,
					bottom: 0,
					"@media (max-width: 600px)": {
						width: "100%",
					},
				},
			}}
		>
			{sourcePlatform !== "shopify" && (
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						py: 3.5,
						px: 2,
						borderBottom: "1px solid #e4e4e4",
						position: "sticky",
						top: 0,
						zIndex: "9",
						backgroundColor: "#fff",
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: "8px",
							mb: 3,
						}}
					>
						<Typography
							variant="h6"
							className="first-sub-title"
							sx={{ textAlign: "center" }}
						>
							Custom plan
						</Typography>
						<CustomTooltip
							title={
								"You can download the billing history and share it with your teammates."
							}
							linkText="Learn more"
							linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/custom-plan"
						/>
					</Box>
					<IconButton onClick={handleCustomPlanPopupClose} sx={{ p: 0 }}>
						<CloseIcon sx={{ width: "20px", height: "20px" }} />
					</IconButton>
				</Box>
			)}
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					alignItems: "center",
					gap: 5,
					height: "100%",
				}}
			>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						padding: 4,
					}}
				>
					<Image
						src="/custom-plan.svg"
						alt="custom-plan"
						width={509}
						height={329}
						style={{ width: "100%" }}
					/>
					<Typography
						className="first-sub-title"
						sx={{
							marginTop: "32px",
							marginBottom: "8px",
							letterSpacing: "0.08px",
						}}
					>
						Tailor your experience with our Custom Plan, designed just for you.
						Choose exactly what you need and only pay for what you use!
					</Typography>
					<Typography
						className="paragraph"
						sx={{
							letterSpacing: "0.07px",
							fontSize: "14px !important",
							color: "#5f6368 !important",
						}}
					>
						Kindly book a call with one of our marketing specialist to custom
						your plan.
					</Typography>
				</Box>

				<Box sx={{ position: "relative" }}>
					<Box
						sx={{
							px: 4,
							py: 3,
							position: "fixed",
							bottom: 0,
							right: 0,
							background: "#fff",
							width: "620px",
							"@media (max-width: 600px)": {
								width: "100%",
							},
						}}
					>
						<Box display="flex" justifyContent="flex-end" mt={2}>
							<Link
								href={meetingUrl}
								target="_blank"
								rel="noopener noreferrer"
								onClick={handleCustomPlanPopupClose}
								sx={{
									display: "inline-block",
									width: "100%",
									textDecoration: "none",
									color: "#fff",
									padding: "1em 8em",
									fontFamily: "var(--font-nunito)",
									fontWeight: "600",
									fontSize: "14px",
									borderRadius: "4px",
									border: "none",
									lineHeight: "22.4px",
									backgroundColor: "rgba(56, 152, 252, 1)",
									textTransform: "none",
									textAlign: "center",
									cursor: "pointer",
								}}
							>
								Book a call
							</Link>
						</Box>
					</Box>
				</Box>
			</Box>
		</Drawer>
	);
};
