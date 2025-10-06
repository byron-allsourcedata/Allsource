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
									"@media (max-width: 600px)": {
										display: "flex",
										flexDirection: "column",
										justifyContent: "center",
										pb: 1,
									},
								}}
							>
								<Typography
									variant="h5"
									component="h1"
									className="heading-text"
									sx={styles.title}
								>
									Email Domain Already Registered
								</Typography>
								<Typography
									variant="body1"
									component="h2"
									className="first-sub-title"
									sx={styles.subtitle}
								>
									The email domain @yourcompany.com is already associated with
									one or more accounts.
								</Typography>

								{potentialTeamMembers.map((member, index) => (
									<Paper
										key={index}
										elevation={0}
										sx={signupStyles.memberCard as any}
									>
										<Box sx={signupStyles.memberInfo as any}>
											<Avatar sx={{ width: 44, height: 44 }}>
												{/* первые буквы имени */}
												{member.full_name
													.split(" ")
													.map((s) => s[0])
													.slice(0, 2)
													.join("")
													.toUpperCase()}
											</Avatar>
											<Box sx={signupStyles.memberText as any}>
												<Typography sx={signupStyles.memberName as any}>
													{member.full_name}
												</Typography>
												<Typography sx={signupStyles.memberEmail as any}>
													{member.email}
												</Typography>
											</Box>
										</Box>

										<Button
											variant="contained"
											size="medium"
											onClick={() => handleJoin(member)}
											sx={{
												...styles.joinBtn,
												background: (theme) =>
													theme.palette.mode === "light"
														? "#2E7DFF"
														: undefined,
												"&:hover": {
													filter: "brightness(0.95)",
												},
											}}
										>
											Join
										</Button>
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
