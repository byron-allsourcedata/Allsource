import { CloseIcon } from "@/icon";
import {
	Backdrop,
	Box,
	Button,
	Drawer,
	LinearProgress,
	Typography,
} from "@mui/material";
import { useState } from "react";
import Image from "next/image";

interface DeletePopupProps {
	service_name: string | null;
	open: boolean;
	handleDelete: () => void;
	onClose: () => void;
}

export const DeleteIntegrationPopup = ({
	service_name,
	open,
	handleDelete,
	onClose,
}: DeletePopupProps) => {
	const [loading, setLoading] = useState(false);

	const handleDeleteClick = async () => {
		setLoading(true);
		await handleDelete();
		setLoading(false);
		onClose();
	};

	if (!open) return null;

	const formatServiceName = (name: string): string => {
		if (name === "big_commerce") {
			return "BigCommerce";
		}
		return name
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
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
			<Backdrop
				open={open}
				onClick={onClose}
				sx={{ zIndex: 100, color: "#fff" }}
			/>
			<Drawer
				anchor="right"
				open={open}
				onClose={onClose}
				variant="persistent"
				PaperProps={{
					sx: {
						width: "40%",
						position: "fixed",
						top: 0,
						bottom: 0,
						"@media (max-width: 600px)": {
							width: "100%",
						},
					},
				}}
				slotProps={{
					backdrop: {
						sx: {
							backgroundColor: "rgba(0, 0, 0, 0.01)",
						},
					},
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						p: "24px",
						pb: "19px",
						borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
					}}
				>
					<Typography variant="h3" fontSize={"1rem"}>
						Confirm deletion{" "}
						{service_name ? formatServiceName(service_name) : ""}
					</Typography>
					<CloseIcon sx={{ cursor: "pointer" }} onClick={onClose} />
				</Box>

				<Box sx={{ flexGrow: 1 }}>
					<Box sx={{ display: "flex", justifyContent: "center" }}>
						<Image
							src="/Inbox cleanup-rafiki 1.svg"
							alt="cleanup"
							width={535}
							height={356.67}
						/>
					</Box>

					<Typography
						variant="h6"
						textAlign="center"
						fontFamily="var(--font-nunito)"
						fontWeight={500}
						fontSize="14px"
						sx={{
							width: "100%",
							textAlign: "center",
							whiteSpace: "pre-line",
							userSelect: "text",
							p: 4,
						}}
					>
						Are you sure you want to delete the{" "}
						{service_name ? formatServiceName(service_name) : ""} integration?
						This action will remove all associated lists and disconnect{" "}
						{service_name ? formatServiceName(service_name) : ""} from your
						account.
					</Typography>
				</Box>
				<Box
					sx={{
						display: "flex",
						justifyContent: "flex-end",
						marginBottom: "20px",
						position: "absolute",
						bottom: 0,
						width: "100%",
						backgroundColor: "white",
						pt: "12px",
						borderTop: "1px solid rgba(0, 0, 0, 0.1)",
					}}
				>
					<Button
						sx={{
							border: "1px rgba(56, 152, 252, 1) solid",
							color: "rgba(56, 152, 252, 1)",
							"&:hover": {
								border: "1px rgba(56, 152, 252, 1) solid",
							},
						}}
						variant="outlined"
						onClick={onClose}
					>
						<Typography
							padding={"0rem 1rem"}
							sx={{ textTransform: "none" }}
							fontSize={"0.8rem"}
						>
							Cancel
						</Typography>
					</Button>
					<Button
						sx={{
							margin: "0 16px",
							fontFamily: "var(--font-nunito)",
							background: "rgba(56, 152, 252, 1)",
							"&:hover": {
								backgroundColor: "rgba(56, 152, 252, 1)",
							},
							"&.Mui-disabled": {
								backgroundColor: "rgba(80, 82, 178, 0.6)",
								color: "#fff",
							},
						}}
						variant="contained"
						onClick={handleDeleteClick}
					>
						<Typography
							padding={"0.35rem 2rem"}
							sx={{ textTransform: "none" }}
							fontSize={"0.8rem"}
						>
							Confirm
						</Typography>
					</Button>
				</Box>
			</Drawer>
		</>
	);
};
