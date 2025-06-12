"use client";
import {
	Box,
	Typography,
	Button,
	Menu,
	MenuItem,
	IconButton,
} from "@mui/material";
import Image from "next/image";
import React from "react";
import DomainButton from "./DomainsButton";

const subheaderStyles = {
	headers: {
		display: "flex",
		padding: "1.125rem 1.5rem",
		pl: "6px",
		justifyContent: "space-between",
		alignItems: "center",
		minHeight: "4rem",
		maxHeight: "4rem",
		borderBottom: `1px solid rgba(228, 228, 228, 1)`,
		position: "sticky",
		overflowY: "hidden",
		top: 0,
		left: 0,
		right: 0,
		background: "#fff",
		zIndex: 10,
	},
};

interface SubHeaderProps {}

const PixelSubheader: React.FC<SubHeaderProps> = ({}) => {
	const meItem =
		typeof window !== "undefined" ? sessionStorage.getItem("me") : null;
	const meData = meItem ? JSON.parse(meItem) : { full_name: "", email: "" };
	const full_name = meData.full_name;
	const email = meData.email;

	return (
		<Box sx={{ display: "flex", width: "100%", flexDirection: "column" }}>
			<Box sx={{ display: "block" }}>
				<Box
					sx={{
						...subheaderStyles.headers,
						display: { xs: "none", md: "flex" },
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: "24px" }}>
						{/* Domain Selector */}
						<DomainButton />

						{/* Colorful Labels */}
						<Box display="flex" gap="8px">
							<Box
								sx={{
									backgroundColor: "rgba(56, 152, 252, 0.1)",
									borderRadius: "4px",
									padding: "4px 8px",
								}}
							>
								<Typography variant="body2" color="primary">
									Label 1
								</Typography>
							</Box>
							<Box
								sx={{
									backgroundColor: "rgba(244, 87, 69, 0.1)",
									borderRadius: "4px",
									padding: "4px 8px",
								}}
							>
								<Typography variant="body2" color="error">
									Label 2
								</Typography>
							</Box>
							<Box
								sx={{
									backgroundColor: "rgba(46, 204, 113, 0.1)",
									borderRadius: "4px",
									padding: "4px 8px",
								}}
							>
								<Typography variant="body2" sx={{ color: "#2ECC71" }}>
									Label 3
								</Typography>
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default PixelSubheader;
