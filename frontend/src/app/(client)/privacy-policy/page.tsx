"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";
import axiosInstance from "../../../axios/axiosInterceptorInstance";
import { signupStyles } from "./privacyPolicyStyles";
import PrivacyPolicyWindow from "./components/PrivacyPolicyWindow";
import PageWithLoader from "@/components/FirstLevelLoader";
import { usePrivacyPolicyContext } from "../../../context/PrivacyPolicyContext";
import UserMenuOnboarding from "./components/UserMenuOnboarding";

const PrivacyPolicy: React.FC = () => {
	const [loading, setLoading] = useState(false);
	const {
		privacyPolicyPromiseResolver,
		setPrivacyPolicyPromiseResolver,
		privacyAccepted,
		setPrivacyAccepted,
	} = usePrivacyPolicyContext();
	const router = useRouter();

	const handleAcceptPrivacyPolicy = async () => {
		try {
			setLoading(true);
			const response = await axiosInstance.post(`/privacy-policy`, {
				version_privacy_policy: "privacy_policy_1",
			});
			if (response.status === 200) {
				// localStorage.setItem("privacy_accepted", "true");
				setPrivacyAccepted(true);
				if (privacyPolicyPromiseResolver) {
					privacyPolicyPromiseResolver();
					setPrivacyPolicyPromiseResolver(null);
				} else {
					router.push("/dashboard");
				}
			}
		} catch {
		} finally {
			setLoading(false);
		}
	};

	// useEffect(() => {
	//   const handleStorage = (event: StorageEvent) => {
	//     if (event.key === "privacy_accepted" && event.newValue === "true") {
	//       setPrivacyAccepted(true);
	//     }
	//   };

	//   window.addEventListener("storage", handleStorage);

	//   return () => {
	//     window.removeEventListener("storage", handleStorage);
	//   };
	// }, []);

	return (
		<>
			{loading && <PageWithLoader />}
			<UserMenuOnboarding />
			<Box sx={signupStyles.mainContent}>
				<PrivacyPolicyWindow
					onAccept={() => {
						handleAcceptPrivacyPolicy();
					}}
				/>
			</Box>
		</>
	);
};

const PrivacyPolicyPage = () => {
	return (
		<Suspense fallback={<PageWithLoader />}>
			<PrivacyPolicy />
		</Suspense>
	);
};

export default PrivacyPolicyPage;
