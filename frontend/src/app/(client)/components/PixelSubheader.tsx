"use client";
import {
	Box,
	Typography,
	Button,
	Menu,
	MenuItem,
	IconButton,
	Switch,
} from "@mui/material";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";

const subheaderStyles = {
	headers: {
		display: "flex",
		padding: "1.125rem 1.5rem",
		pl: ".75rem",
		justifyContent: "space-between",
		alignItems: "center",
		minHeight: "4rem",
		maxHeight: "4rem",
		color: "rgba(244, 87, 69, 1)",
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
					Hello
				</Box>
			</Box>
		</Box>
	);
};

export default PixelSubheader;
