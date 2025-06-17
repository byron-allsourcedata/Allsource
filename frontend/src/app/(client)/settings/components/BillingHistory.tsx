"use client";
import React, { useMemo } from "react";
import {
	Box,
	Typography,
	IconButton,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Table,
	TableBody,
} from "@mui/material";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import axios from "axios";
import CustomTooltip from "@/components/customToolTip";
import { billingStyles } from "./SettingsBilling";
import DownloadIcon from "@mui/icons-material/Download";
import TelegramIcon from "@mui/icons-material/Telegram";

interface BillingHistoryProps {
	billingHistory: any[];
	setIsLoading: (state: boolean) => void;
	handleSendInvoicePopupOpen: (id: string) => void;
}

export const BillingHistory: React.FC<BillingHistoryProps> = ({
	billingHistory,
	setIsLoading,
	handleSendInvoicePopupOpen,
}) => {
	const fetchSaveBillingHistory = async (invoice_id: string) => {
		try {
			setIsLoading(true);
			const response = await axiosInterceptorInstance.get(
				`/settings/billing/download-billing?invoice_id=${invoice_id}`,
			);
			const link = response.data;
			if (link) {
				window.open(link, "_blank");
			} else {
				showErrorToast("Download billing not found.");
			}
		} catch (error: unknown) {
			if (axios.isAxiosError(error)) {
				showErrorToast(error.message);
			} else if (error instanceof Error) {
				showErrorToast(error.message);
			} else {
				showErrorToast("An unexpected error occurred.");
			}
		} finally {
			setIsLoading(false);
		}
	};

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

	const getStatusStyles = (status: string) => {
		switch (status?.toLowerCase()) {
			case "successful":
				return {
					background: "#eaf8dd",
					color: "#2b5b00 !important",
				};
			case "decline":
				return {
					background: "#ececec",
					color: "#4a4a4a !important",
				};
			case "failed":
				return {
					background: "#fcd4cf",
					color: "#a61100 !important",
				};
			default:
				return {
					background: "#ececec",
					color: "#4a4a4a !important",
				};
		}
	};

	return (
		<Box sx={{ marginTop: "30px" }}>
			<Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: 3 }}>
				<Typography
					variant="h6"
					className="first-sub-title"
					sx={{
						lineHeight: "22px !important",
					}}
				>
					Billing History
				</Typography>
				<CustomTooltip
					title={
						"You can download the billing history and share it with your teammates."
					}
					linkText="Learn more"
					linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/billing-history"
				/>
			</Box>
			<TableContainer
				sx={{
					border: "1px solid #EBEBEB",
					borderRadius: "4px 4px 0px 0px",
				}}
			>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell
								className="table-heading"
								sx={{
									...billingStyles.tableColumn,
									background: "#fff",
								}}
							>
								Date
							</TableCell>
							<TableCell
								className="table-heading"
								sx={billingStyles.tableColumn}
							>
								Invoice ID
							</TableCell>
							<TableCell
								className="table-heading"
								sx={billingStyles.tableColumn}
							>
								Pricing Plan
							</TableCell>
							<TableCell
								className="table-heading"
								sx={billingStyles.tableColumn}
							>
								Total
							</TableCell>
							<TableCell
								className="table-heading"
								sx={billingStyles.tableColumn}
							>
								Status
							</TableCell>
							{sourcePlatform !== "shopify" && (
								<TableCell
									className="table-heading"
									sx={billingStyles.tableColumn}
								>
									Actions
								</TableCell>
							)}
						</TableRow>
					</TableHead>
					<TableBody>
						{billingHistory.length === 0 ? (
							<TableRow sx={billingStyles.tableBodyRow}>
								<TableCell
									className="table-data"
									colSpan={5}
									sx={{
										...billingStyles.tableBodyColumn,
										textAlign: "center",
										paddingTop: "18px",
										paddingBottom: "18px",
									}}
								>
									No history found
								</TableCell>
							</TableRow>
						) : (
							billingHistory.map((history, index) => (
								<TableRow
									key={index}
									sx={{
										...billingStyles.tableBodyRow,
										"&:hover": {
											backgroundColor: "#F7F7F7",
											"& .sticky-cell": {
												backgroundColor: "#F7F7F7",
											},
										},
									}}
								>
									<TableCell
										className="sticky-cell table-data"
										sx={{
											...billingStyles.tableBodyColumn,
											backgroundColor: "#fff",
										}}
									>
										{history.date}
									</TableCell>

									<TableCell
										className="table-data"
										sx={billingStyles.tableBodyColumn}
									>
										{history.invoice_id}
									</TableCell>
									<TableCell
										className="table-data"
										sx={billingStyles.tableBodyColumn}
									>
										{history.pricing_plan}
									</TableCell>
									<TableCell
										className="table-data"
										sx={billingStyles.tableBodyColumn}
									>
										${history.total}
									</TableCell>
									<TableCell
										className="table-data"
										sx={billingStyles.tableBodyColumn}
									>
										<Typography
											component="span"
											className="table-data"
											sx={{
												...getStatusStyles(history.status),
												padding: "6px 8px",
												borderRadius: "2px",
											}}
										>
											{history.status}
										</Typography>
									</TableCell>
									{sourcePlatform !== "shopify" && (
										<TableCell
											className="table-data"
											sx={billingStyles.tableBodyColumn}
										>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 2,
												}}
											>
												{/* Download Button */}
												<IconButton
													onClick={() =>
														fetchSaveBillingHistory(history.invoice_id)
													}
													sx={{
														":hover": { backgroundColor: "transparent" },
														padding: 0,
													}}
												>
													<DownloadIcon
														sx={{
															width: "24px",
															height: "24px",
															color: "rgba(188, 188, 188, 1)",
															":hover": {
																color: "rgba(56, 152, 252, 1)",
															},
														}}
													/>
												</IconButton>

												{/* Send Invoice Button */}
												<IconButton
													onClick={() =>
														handleSendInvoicePopupOpen(history.invoice_id)
													}
													sx={{
														":hover": { backgroundColor: "transparent" },
														padding: 0,
													}}
												>
													<TelegramIcon
														sx={{
															width: "24px",
															height: "24px",
															color: "rgba(188, 188, 188, 1)",
															":hover": {
																color: "rgba(56, 152, 252, 1)",
															},
														}}
													/>
												</IconButton>
											</Box>
										</TableCell>
									)}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
};
