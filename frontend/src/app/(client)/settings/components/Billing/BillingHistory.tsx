"use client";
import React, { useMemo, useEffect, useState } from "react";
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
import { showErrorToast } from "@/components/ToastNotification";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import axios from "axios";
import CustomTooltip from "@/components/customToolTip";
import { billingStyles } from "./billingStyles";
import DownloadIcon from "@mui/icons-material/Download";
import TelegramIcon from "@mui/icons-material/Telegram";
import CustomTablePagination from "@/components/CustomTablePagination";
import { BillingHistoryItem } from "./types";

interface BillingHistoryProps {
	setIsLoading: (state: boolean) => void;
	handleSendInvoicePopupOpen: (id: string) => void;
}

export const BillingHistory: React.FC<BillingHistoryProps> = ({
	setIsLoading,
	handleSendInvoicePopupOpen,
}) => {
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [hide, setHide] = useState(false);
	const [totalRows, setTotalRows] = useState(0);
	const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>(
		[],
	);
	const [rowsPerPageOptions, setRowsPerPageOptions] = useState<number[]>([]);

	const fetchBillingHistoryData = async (page: number, rowsPerPage: number) => {
		try {
			const response = await axiosInterceptorInstance.get(
				"/settings/billing-history",
				{
					params: {
						page: page + 1,
						per_page: rowsPerPage,
					},
				},
			);
			if (response.data == "hide") {
				setHide(true);
			} else {
				const { billing_history, count } = response.data;
				console.log(billingHistory);
				setBillingHistory(billing_history);
				setTotalRows(count);
				let newRowsPerPageOptions: number[] = [];
				if (count <= 10) {
					newRowsPerPageOptions = [5, 10];
				} else if (count <= 50) {
					newRowsPerPageOptions = [10, 20];
				} else if (count <= 100) {
					newRowsPerPageOptions = [10, 20, 50];
				} else if (count <= 300) {
					newRowsPerPageOptions = [10, 20, 50, 100];
				} else if (count <= 500) {
					newRowsPerPageOptions = [10, 20, 50, 100, 300];
				} else {
					newRowsPerPageOptions = [10, 20, 50, 100, 300, 500];
				}
				if (!newRowsPerPageOptions.includes(count)) {
					newRowsPerPageOptions.push(count);
					newRowsPerPageOptions.sort((a, b) => a - b);
				}
				setRowsPerPageOptions(newRowsPerPageOptions);
			}
		} catch (error) {
		} finally {
		}
	};

	useEffect(() => {
		console.log("dfdfrf");
		fetchBillingHistoryData(page, rowsPerPage);
	}, [page, rowsPerPage]);

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

	const handleChangePage = (
		_: React.MouseEvent<HTMLButtonElement> | null,
		newPage: number,
	) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	return (
		<>
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
			<Box
				sx={{
					display: "flex",
					justifyContent: "flex-end",
					padding: "42px 0 0px",
					mb: 1,
				}}
			>
				<CustomTablePagination
					count={totalRows}
					page={page}
					rowsPerPage={rowsPerPage}
					onPageChange={handleChangePage}
					onRowsPerPageChange={handleChangeRowsPerPage}
					rowsPerPageOptions={rowsPerPageOptions}
				/>
			</Box>
		</>
	);
};
