"use client";
import type React from "react";
import { Suspense, useEffect } from "react";
import Image from "next/image";
import { Typography, Box, Link } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { shopifyLandingStyle } from "./high-landing";
import {
	showErrorToast,
	showInfoToast,
	showToast,
} from "../../components/ToastNotification";
import CustomizedProgressBar from "@/components/FirstLevelLoader";

const GoHighLevelLanding = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const code = searchParams.get("code");
	const error = searchParams.get("error");

	useEffect(() => {
		const fetchGoHighLevelLandingData = async () => {
			if (error) {
				showErrorToast(`Error connect to GoHighLevel: ${error}`);
				return;
			}
			try {
				const response = await axiosInstance.post(
					"/integrations/",
					{
						go_high_level: {
							code: code,
						},
					},
					{
						params: {
							service_name: "go_high_level",
						},
					},
				);

				if (response.data.status == "SUCCESS") {
					showToast("Connect to BingAds success!");
					router.push(`/integrations`);
				} else if (response.data.status == "ERROR_BINGADS_TOKEN") {
					showErrorToast("Error connect to BingAds");
					router.push(`/integrations`);
				}
			} catch (error) {
				console.error("BingAds Landing:", error);
			}
		};

		fetchGoHighLevelLandingData();

		return () => {
			document.body.style.overflow = "auto";
		};
	}, [router, searchParams]);

	return (
		<Box sx={shopifyLandingStyle.mainContent}>
			<Link
				display={"flex"}
				sx={{ alignItems: "center", textDecoration: "none" }}
			>
				<Image src={"/logo.svg"} width={100} height={200} alt="Allsource" />
			</Link>
			<Image
				src={"/app_intalled.svg"}
				width={330}
				height={246}
				alt="Allsource installed"
			/>
			<Typography variant="h6" fontSize={"16px"} fontWeight={400} mt={2}>
				Wait for Go High Level token verification
			</Typography>
		</Box>
	);
};

const GoHighLevelLandingPage: React.FC = () => {
	return (
		<Suspense fallback={<CustomizedProgressBar />}>
			<GoHighLevelLanding />
		</Suspense>
	);
};

export default GoHighLevelLandingPage;
