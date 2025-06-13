"use client";
import { Box, Typography } from "@mui/material";
import { Suspense, useEffect, useState } from "react";
import { managementStyle } from "./management";
import CustomToolTip from "@/components/customToolTip";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import GettingStartedSection from "@/components/GettingStartedSection";
import { SliderProvider } from "@/context/SliderContext";
import { FirstTimeScreenCommonVariant2 } from "@/components/first-time-screens";
import DomainButtonSelect from "../components/NavigationDomainButton";
import ManagementTable from "./components/ManagementTable";

export type PixelKey =
	| "is_view_product_installed"
	| "is_add_to_cart_installed"
	| "is_converted_sales_installed";

export interface AdditionalPixel {
	is_add_to_cart_installed: boolean;
	is_converted_sales_installed: boolean;
	is_view_product_installed: boolean;
	[key: string]: boolean;
}

export interface PixelDataSync {
	createdDate: string;
	list_name: string | null;
	lastSync: string | null;
	platform: string;
	contacts: number;
	createdBy: string;
	status: string;
	syncStatus: boolean;
}

export interface PixelManagementItem {
	id: number;
	domain_name: string;
	pixel_status: boolean;
	additional_pixel: AdditionalPixel;
	resulutions: any;
	data_syncs: PixelDataSync[];
}

const Management: React.FC = () => {
	const [pixelData, setPixelData] = useState<PixelManagementItem[]>([]);
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState("");

	const checkPixel = async () => {
		try {
			const response = await axiosInstance.get("/check-user-authorization");
			if (response.data.status === "NEED_BOOK_CALL") {
				sessionStorage?.setItem("is_slider_opened", "true");
			}
		} catch (error) {
			if (error instanceof AxiosError && error.response?.status === 403) {
				if (error.response.data.status === "PIXEL_INSTALLATION_NEEDED") {
					setStatus(error.response.data.status);
				}
			} else {
				showErrorToast(`Error fetching data:${error}`);
			}
		} finally {
			setLoading(false);
		}
	};

	const fetchData = async () => {
		try {
			setLoading(true);
			const response = await axiosInstance.get("/pixel-management");
			if (response.status === 200) {
				setPixelData(response.data);
			}
		} catch (error) {
			showErrorToast(`Error fetching data:${error}`);
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (toDelete: PixelManagementItem) => {
		try {
			setLoading(true);

			const currentDomain = sessionStorage.getItem("current_domain");

			await axiosInstance.delete(`/domains/${toDelete.id}`, {
				data: { domain: toDelete.domain_name },
			});
			showToast("Successfully removed domain");

			await fetchData();

			const updatedDomains: PixelManagementItem[] = JSON.parse(
				sessionStorage.getItem("me") || "{}",
			)?.domains;

			if (currentDomain === toDelete.domain_name && updatedDomains?.length) {
				const newDomain = updatedDomains[0].domain_name;
				sessionStorage.setItem("current_domain", newDomain);
			}
		} catch (error) {
			showErrorToast("Failed to delete domain. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		checkPixel();
		fetchData();
	}, []);

	if (loading) {
		return <CustomizedProgressBar />;
	}

	return (
		<Box sx={{ ...managementStyle.mainContent }}>
			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					position: "sticky",
					top: 0,
					pl: "0.5rem",
					pt: 1.5,
					backgroundColor: "#fff",
					justifyContent: "space-between",
					width: "100%",
					"@media (max-width: 900px)": {
						zIndex: 10,
					},
					"@media (max-width: 600px)": {
						pt: "4.25rem",
						flexDirection: "column",
						pl: "0.5rem",
						alignItems: "flex-start",
						zIndex: 10,
						width: "100%",
						pr: 1.5,
					},
					"@media (max-width: 440px)": {
						flexDirection: "column",
						zIndex: 1,
						justifyContent: "flex-start",
					},
					"@media (max-width: 400px)": {
						pb: "6px",
					},
				}}
			>
				<Box
					sx={{
						flexShrink: 0,
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						gap: 1,
						"@media (max-width: 600px)": { mb: 2 },
						"@media (max-width: 440px)": { mb: 1 },
					}}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							gap: 3,
						}}
					>
						<Box
							sx={{
								display: "flex",
								flexDirection: "row",
								alignItems: "center",
								gap: 1,
								pt: 0.75,
							}}
						>
							<Typography
								className="first-sub-title"
								sx={{ textWrap: "nowrap" }}
							>
								Management
							</Typography>
							<CustomToolTip
								title={
									"Management is a feature that allows you to manage your account."
								}
								linkText="Learn more"
								linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/management"
							/>
						</Box>
					</Box>
				</Box>
				<Box
					sx={{
						flexGrow: 1,
						flexShrink: 1,
						display: "flex",
						overflow: "hidden",
						justifyContent: "center",
						width: "100%",
						pr: "10%",
						alignItems: "center",
						"@media (max-width: 900px)": { pr: 0 },
						"@media (max-width: 600px)": {
							width: "100%",
							pr: "0",
						},
					}}
				/>
			</Box>

			<Box sx={{ width: "100%" }}>
				<ManagementTable tableData={pixelData} onDelete={handleDelete} />
			</Box>
		</Box>
	);
};

const ManagementPage: React.FC = () => {
	return (
		<Suspense fallback={<CustomizedProgressBar />}>
			<SliderProvider>
				<Management />
			</SliderProvider>
		</Suspense>
	);
};

export default ManagementPage;
