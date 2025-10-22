"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
	Box,
	Button,
	TextField,
	Typography,
	Link,
	IconButton,
	InputAdornment,
} from "@mui/material";
import { confirmStyles } from "./confirmStyles";
import { Logo } from "@/components/ui/Logo";

const ConfirmSend: React.FC = () => {
	const router = useRouter();
	const [email, setEmail] = useState<string | null>(null);
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "auto";
		};
	}, []);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const storedMe = sessionStorage.getItem("me");
			setEmail(storedMe ? JSON.parse(storedMe)?.email : null);

			const token = localStorage.getItem("token");
			setIsLoggedIn(!!token);
		}
	}, []);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isLoggedIn) {
			router.push("/settings");
		} else {
			router.push("/signin");
		}
	};

	return (
		<>
			<Box sx={confirmStyles.logoContainer}>
				<Logo />
			</Box>
			<Box sx={confirmStyles.mainContent}>
				<Box sx={confirmStyles.container}>
					<Typography
						variant="h4"
						component="h1"
						className="heading-text"
						sx={confirmStyles.title}
					>
						Help is on the way
					</Typography>
					<Typography className="second-sub-title" sx={confirmStyles.text}>
						Please check your email {email}. If you run into any hiccups, our
						support team is ready to rock &apos;n&apos; roll and help you out.
					</Typography>
					<Typography className="second-sub-title" sx={confirmStyles.text}>
						Please check your spam folder or{" "}
						<Link href="/reset-password" sx={confirmStyles.loginLink}>
							try sending again.
						</Link>
					</Typography>

					<Box component="form" onSubmit={handleSubmit} sx={confirmStyles.form}>
						<Button
							className="hyperlink-red"
							type="submit"
							variant="contained"
							sx={confirmStyles.submitButton}
							fullWidth
						>
							{isLoggedIn ? "Back to settings" : "Back to login"}
						</Button>
					</Box>
				</Box>
			</Box>
		</>
	);
};

export default ConfirmSend;
