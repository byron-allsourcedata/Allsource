"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Box, Button, Menu, MenuItem, Typography } from "@mui/material";
import { signupStyles } from "../privacyPolicyStyles";
import { useUser } from "../../../../context/UserContext";
import PersonIcon from "@mui/icons-material/Person";

const UserMenuOnboarding: React.FC = () => {
	const { full_name: userFullName, email: userEmail } = useUser();
	const router = useRouter();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const [email, setEmail] = useState("");

	const [full_name, setFullName] = useState("");
	useEffect(() => {
		if (typeof window !== "undefined") {
			const meItem = sessionStorage.getItem("me");
			const meData = meItem ? JSON.parse(meItem) : { full_name: "", email: "" };
			setEmail(userEmail || meData.email);
			setFullName(userFullName || meData.full_name);
		}
	}, [userEmail, userFullName]);

	const handleProfileMenuClick = (
		event: React.MouseEvent<HTMLButtonElement>,
	) => {
		setAnchorEl(event.currentTarget);
	};

	const handleProfileMenuClose = () => {
		setAnchorEl(null);
	};

	const handleSignOut = () => {
		localStorage.clear();
		sessionStorage.clear();
		router.push("/signin");
	};

	return (
		<Box sx={signupStyles.headers}>
			<Box sx={signupStyles.logoContainer}>
				<Image src="/logo.svg" alt="logo" height={30} width={130} />
			</Box>
			<Button
				aria-controls={open ? "profile-menu" : undefined}
				aria-haspopup="true"
				aria-expanded={open ? "true" : undefined}
				onClick={handleProfileMenuClick}
				sx={{
					minWidth: "32px",
					padding: "6px",
					color: "rgba(128, 128, 128, 1)",
					border: "1px solid rgba(184, 184, 184, 1)",
					borderRadius: "3.27px",
					"&:hover": {
						border: "1px solid rgba(56, 152, 252, 1)",
						"& .MuiSvgIcon-root": {
							color: "rgba(56, 152, 252, 1)",
						},
					},
				}}
			>
				<PersonIcon sx={{ fontSize: "22px" }} />
			</Button>
			<Menu
				id="profile-menu"
				anchorEl={anchorEl}
				open={open}
				onClose={handleProfileMenuClose}
				MenuListProps={{
					"aria-labelledby": "profile-menu-button",
				}}
				sx={{
					mt: 0.5,
					ml: -1,
				}}
			>
				<Box
					sx={{
						paddingTop: 1,
						paddingLeft: 2,
						paddingRight: 2,
						paddingBottom: 1,
					}}
				>
					<Typography
						variant="h6"
						sx={{
							fontFamily: "var(--font-nunito)",
							fontSize: "14px",
							fontWeight: 600,
							lineHeight: "19.6px",
							color: "rgba(0, 0, 0, 0.89)",
							mb: 0.25,
						}}
					>
						{full_name}
					</Typography>
					<Typography
						variant="body2"
						color="textSecondary"
						sx={{
							fontFamily: "var(--font-nunito)",
							fontSize: "14px",
							fontWeight: 600,
							lineHeight: "19.6px",
							color: "rgba(0, 0, 0, 0.89)",
						}}
					>
						{email}
					</Typography>
				</Box>

				<MenuItem
					sx={{
						fontFamily: "var(--font-nunito)",
						fontSize: "14px",
						fontWeight: 500,
						lineHeight: "19.6px",
					}}
					onClick={handleSignOut}
				>
					Sign Out
				</MenuItem>
			</Menu>
		</Box>
	);
};

export default UserMenuOnboarding;
