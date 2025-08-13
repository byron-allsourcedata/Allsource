"use client";
import Image from "next/image";
import { Typography, Box, Link } from "@mui/material";
import { useEffect } from "react";
import { thanksInstalledAppStyle } from "./thanksInstalledAppStyle";
import { LogoSmall } from "@/components/ui/Logo";
import { useWhitelabel } from "../features/whitelabel/contexts/WhitelabelContext";

const ThanksInstalledApp = () => {
	const { whitelabel } = useWhitelabel();

	useEffect(() => {
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "auto";
		};
	}, []);
	return (
		<Box sx={thanksInstalledAppStyle.mainContent}>
			<Link
				display={"flex"}
				sx={{ alignItems: "center", textDecoration: "none" }}
			>
				<LogoSmall width={61} height={39} />
				<Typography
					variant="h1"
					color={"#002868"}
					fontSize={"51.21px"}
					fontWeight={400}
				>
					{whitelabel.brand_name}
				</Typography>
			</Link>
			<Image
				src={"/app_intalled.svg"}
				width={330}
				height={246}
				alt="Maximiz installed"
			/>
			<Typography variant="h6" fontSize={"16px"} fontWeight={400} mt={2}>
				{whitelabel.brand_name} installed! Get ready to supercharge your store’s
				success!
			</Typography>
		</Box>
	);
};

export default ThanksInstalledApp;
