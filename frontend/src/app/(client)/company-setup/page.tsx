"use client";
import React, { Suspense, useState, useEffect } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { styles } from "./companySetupStyles";
import { signupStyles } from "../signup/signupStyles";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInterceptorInstance from "../../../axios/axiosInterceptorInstance";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import UserMenuOnboarding from "../privacy-policy/components/UserMenuOnboarding";
import FirstLevelLoader from "@/components/FirstLevelLoader";
import { CustomButton } from "@/components/ui";
import { showToast } from "@/components/ToastNotification";
import { useUser } from "@/context/UserContext";

interface PotentialTeamMember {
	email: string;
	full_name: string;
	company_name: string;
	id: number;
}

const CompanySetup = () => {
	const [potentialTeamMembers, setPotentialTeamMembers] = useState<
		PotentialTeamMember[]
	>([]);
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const { email: userEmail } = useUser();

	useEffect(() => {
		const fetchCompanyInfo = async () => {
			try {
				setLoading(true);
				const response = await axiosInterceptorInstance.get(
					`/potential-team-members`,
				);
				if (response.status === 200) {
					if (response.data.length > 0) {
						setPotentialTeamMembers(response.data);
					} else {
						router.push("/account-setup");
					}
				}
			} catch (error) {
				console.error("Error fetching company info:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchCompanyInfo();
	}, []);

	const handleJoin = async (member: PotentialTeamMember) => {
		try {
			setLoading(true);
			const response = await axiosInterceptorInstance.post(
				"teams/set-team-member",
				{
					id: member.id,
				},
			);
			if (response.status === 200 && response.data) {
				showToast(
					`You have successfully joined the ${member.company_name} team.`,
				);
				router.push("/get-started");
			}
		} catch {
		} finally {
			setLoading(false);
		}
	};

	const handleCreateSeparate = () => {
		router.push("/account-setup");
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
									gap: 3,
								}}
							>
								<Box display={"flex"} flexDirection={"column"} gap={1}>
									<Typography
										variant="h5"
										component="h1"
										className="heading-text"
										sx={{ m: "0 !important" }}
									>
										Email Domain Already Registered
									</Typography>
									<Typography
										variant="body1"
										component="h2"
										className="first-sub-title"
									>
										{`The email domain @${userEmail?.split("@")[1]} is already associated with one or more accounts.`}
									</Typography>
								</Box>

								<Box display={"flex"} flexDirection={"column"} gap={2}>
									<Box display={"flex"} flexDirection={"column"} gap={0.5}>
										<Typography className="first-sub-title">
											Join an existing team
										</Typography>
										<Typography className="eighth-sub-title">
											Collaborate with colleagues under the same organization.
										</Typography>
									</Box>

									{potentialTeamMembers.map((member, index) => (
										<Paper key={index} elevation={0} sx={styles.memberCard}>
											<Box sx={styles.memberInfo}>
												<Box sx={styles.memberText}>
													<Typography className="black-table-header">
														{`${member.full_name} (${member.email})`}
													</Typography>
												</Box>
											</Box>

											<CustomButton
												variant="contained"
												size="medium"
												onClick={() => handleJoin(member)}
												sx={{
													p: "8px 16px",
												}}
											>
												Join
											</CustomButton>
										</Paper>
									))}
								</Box>

								<Box sx={{ ...signupStyles.orDivider, m: "0 !important" }}>
									<Box
										sx={{ borderBottom: "1px solid #DCE1E8", flexGrow: 1 }}
									/>
									<Typography
										variant="body1"
										className="third-sub-title"
										sx={{ ...signupStyles.orText }}
									>
										OR
									</Typography>
									<Box
										sx={{ borderBottom: "1px solid #DCE1E8", flexGrow: 1 }}
									/>
								</Box>

								<Box display={"flex"} flexDirection={"column"} gap={2}>
									<Box display={"flex"} flexDirection={"column"} gap={1}>
										<Typography className="first-sub-title">
											Create a separate account
										</Typography>
										<Typography className="eighth-sub-title">
											Your account will not be linked to existing accounts.
										</Typography>
									</Box>

									<CustomButton
										variant="outlined"
										onClick={handleCreateSeparate}
										sx={{
											p: "10px 24px",
										}}
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
