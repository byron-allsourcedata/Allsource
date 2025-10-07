"use client";
import React, { Suspense, useState, useEffect } from "react";
import {
	Avatar,
	Box,
	Button,
	InputAdornment,
	Paper,
	TextField,
	Typography,
	useTheme,
} from "@mui/material";
import { styles } from "./companySetupStyles";
import { signupStyles } from "../signup/signupStyles";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInterceptorInstance from "../../../axios/axiosInterceptorInstance";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { fetchUserData } from "@/services/meService";
import UserMenuOnboarding from "../privacy-policy/components/UserMenuOnboarding";
import FirstLevelLoader from "@/components/FirstLevelLoader";
import { CustomButton } from "@/components/ui";

interface PotentialTeamMember {
	email: string;
	full_name: string;
	company_name: string;
}

const CompanySetup = () => {
	const [potentialTeamMembers, setPotentialTeamMembers] = useState<
		PotentialTeamMember[]
	>([]);
	const [loading, setLoading] = useState(false);
	const searchParams = useSearchParams();
	const companyName = searchParams.get("company_name");

	useEffect(() => {
		const fetchCompanyInfo = async () => {
			try {
				setLoading(true);
				const response = await axiosInterceptorInstance.get(
					`/potential-team-members?company_name=${companyName}`,
				);
				if (response.status === 200 && response.data.length > 0) {
					setPotentialTeamMembers(response.data);
				}
			} catch (error) {
				console.error("Error fetching company info:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchCompanyInfo();
	}, []);

	const theme = useTheme();

	const handleJoin = (member: PotentialTeamMember) => {
		console.log("Join clicked for", member);
	};

	const handleCreateSeparate = () => {
		console.log("Create a separate account clicked");
	};

	return (
		<>
			<UserMenuOnboarding />
			<Box
				sx={{
					...styles.pageContainer,
				}}
			>
				{loading && <FirstLevelLoader />}

				<Box
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						width: "100%",
						scrollbarWwidth: "none",
						"&::-webkit-scrollbar": { display: "none" },
					}}
				>
					<Box
						sx={{ ...styles.formContainer, overflow: "hidden", marginTop: 0 }}
					>
						<Box
							sx={{
								...styles.form,
								overflow: "auto",
								"&::-webkit-scrollbar": { display: "none" },
								msOverflowStyle: "none",
								scrollbarWwidth: "none",
							}}
						>
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",
									gap: 2,
								}}
							>
								<Box display={"flex"} flexDirection={"column"} gap={3}>
									<Box display={"flex"} flexDirection={"column"} gap={1}>
										<Typography
											variant="h5"
											component="h1"
											className="heading-text"
											sx={{ m: "0 !important" }}
										>
											Similar Companies Found
										</Typography>
										<Typography
											variant="body1"
											component="h2"
											className="first-sub-title"
										>
											{`We found several companies with names similar to ${companyName}`}
										</Typography>
									</Box>

									<Box display={"flex"} flexDirection={"column"} gap={0.5}>
										<Typography className="first-sub-title">
											Join an existing team
										</Typography>
										<Typography className="seventh-sub-title">
											{`We found several companies with names similar to ${companyName}`}
										</Typography>
									</Box>
								</Box>

								{potentialTeamMembers.map((member, index) => (
									<Paper key={index} elevation={0} sx={styles.memberCard}>
										<Box sx={styles.memberInfo}>
											<Box sx={styles.memberText}>
												<Typography sx={styles.memberName}>
													{member.company_name}
												</Typography>
											</Box>
										</Box>

										<CustomButton
											variant="contained"
											size="medium"
											onClick={() => handleJoin(member)}
										>
											Join
										</CustomButton>
									</Paper>
								))}

								<Box sx={signupStyles.orDivider}>
									<Box
										sx={{ borderBottom: "1px solid #DCE1E8", flexGrow: 1 }}
									/>
									<Typography
										variant="body1"
										className="third-sub-title"
										sx={signupStyles.orText}
									>
										OR
									</Typography>
									<Box
										sx={{ borderBottom: "1px solid #DCE1E8", flexGrow: 1 }}
									/>
								</Box>

								<Box>
									<Typography className="first-sub-title">
										Create a new company
									</Typography>
									<Typography className="seventh-sub-title">
										Your account will not be linked to existing accounts.
									</Typography>

									<CustomButton
										variant="outlined"
										onClick={handleCreateSeparate}
									>
										Create a separate account
									</CustomButton>
								</Box>
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>
		</>
	);
};

const CompanySetupPage = () => {
	return (
		<Suspense fallback={<CustomizedProgressBar />}>
			<CompanySetup />
		</Suspense>
	);
};

export default CompanySetupPage;
