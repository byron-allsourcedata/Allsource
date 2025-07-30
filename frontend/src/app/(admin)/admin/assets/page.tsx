"use client";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import PartnersAsset from "@/components/PartnersAsset";
import { assetsStyle } from "./assetsStyle";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import PageWithLoader from "../../components/AdminProgressBar";

interface AssetsData {
	id: number;
	file_url: string;
	preview_url: string | null;
	type: string;
	title: string;
	file_extension: string;
	file_size: number;
	video_duration: number;
	isFavorite: boolean;
}

interface PartnersAssetsData {
	type: string;
	asset: AssetsData[] | [];
}

const Assets: React.FC = () => {
	const [loading, setLoading] = useState(false);
	const [assets, setAssets] = useState<PartnersAssetsData[]>([
		{ type: "Videos", asset: [] },
		{ type: "Pitch decks", asset: [] },
		{ type: "Images", asset: [] },
		{ type: "Documents", asset: [] },
	]);

	const fetchRewards = async () => {
		setLoading(true);
		try {
			const response = await axiosInstance.get("/admin-assets");
			const assetsByType = response.data.reduce(
				(acc: Record<string, AssetsData[]>, item: AssetsData) => {
					if (!acc[item.type]) {
						acc[item.type] = [];
					}
					acc[item.type].push({ ...item });
					return acc;
				},
				{},
			);

			setAssets([
				{ type: "Videos", asset: assetsByType["video"] || [] },
				{ type: "Pitch decks", asset: assetsByType["presentation"] || [] },
				{ type: "Images", asset: assetsByType["image"] || [] },
				{ type: "Documents", asset: assetsByType["document"] || [] },
			]);
		} catch (error) {
			console.error("Error fetching rewards:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteAsset = async (id: number) => {
		setLoading(true);
		try {
			const response = await axiosInstance.delete(`admin-assets/${id}`);
			const status = response.data.status;
			if (status === "SUCCESS") {
				removeAssetById(id);
				showToast("Asset successfully deleted!");
			} else {
				showErrorToast("The provided ID is not valid.");
			}
		} catch {
			showErrorToast("Failed to delete asset. Please try again later.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRewards();
	}, []);

	const removeAssetById = (id: number) => {
		setAssets((prevAssets) =>
			prevAssets.map((group) => ({
				...group,
				asset: group.asset.filter((item) => item.id !== id),
			})),
		);
	};

	const assetTypeMap: Record<string, string> = {
		video: "Videos",
		image: "Images",
		presentation: "Pitch decks",
		document: "Documents",
	};

	const updateOrAddAsset = (type: string, newAsset: AssetsData) => {
		setAssets((prevAssets) =>
			prevAssets.map((group) => {
				if (group.type === assetTypeMap[type]) {
					const existingAssetIndex = group.asset.findIndex(
						(item) => item.id === newAsset.id,
					);
					if (existingAssetIndex !== -1) {
						const updatedAssets = [...group.asset];
						updatedAssets[existingAssetIndex] = newAsset;
						return { ...group, asset: updatedAssets };
					} else {
						return { ...group, asset: [...group.asset, newAsset] };
					}
				}
				return group;
			}),
		);
	};

	return (
		<>
			<Box
				sx={{
					display: "grid",
					gridTemplateAreas: `
                    "header header"
                    "sidebar content"
                `,
					gridTemplateRows: "auto 1fr",
					gridTemplateColumns: "0 1fr",
					height: "100vh",
				}}
			>
				<Box
					sx={{
						gridArea: "content",
						padding: "24px",
						pl: 0,
					}}
				>
					<Grid container spacing={1}>
						<Grid
							item
							xs={12}
							sx={{ display: "flex", flexDirection: "column", gap: "24px" }}
						>
							{loading && <PageWithLoader />}
							<Box
								sx={{
									display: "flex",
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<Typography variant="h4" component="h1" sx={assetsStyle.title}>
									Assets
								</Typography>
							</Box>
							<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
								{assets.map((data, index) => (
									<PartnersAsset
										deleteAsset={handleDeleteAsset}
										updateOrAddAsset={updateOrAddAsset}
										key={index}
										data={data}
										isAdmin={true}
									/>
								))}
							</Box>
						</Grid>
					</Grid>
				</Box>
			</Box>
		</>
	);
};

export default Assets;
