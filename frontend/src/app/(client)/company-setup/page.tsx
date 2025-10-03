"use client";
import React, { Suspense, useState, useEffect } from "react";
import { Box, InputAdornment, TextField, Typography } from "@mui/material";
import { styles } from "./companySetupStyles";
import { useRouter } from "next/navigation";
import axiosInterceptorInstance from "../../../axios/axiosInterceptorInstance";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { fetchUserData } from "@/services/meService";
import UserMenuOnboarding from "../privacy-policy/components/UserMenuOnboarding";
import FirstLevelLoader from "@/components/FirstLevelLoader";
import { CustomButton } from "@/components/ui";

const AccountSetup = () => {
	const [organizationName, setOrganizationName] = useState("");
	const [websiteLink, setWebsiteLink] = useState("");
	const [domainLink, setDomainLink] = useState("");
	const [stripeUrl, setStripeUrl] = useState("");
	const [domainName, setDomainName] = useState("");
	const [editingName, setEditingName] = useState(true);
	const [errors, setErrors] = useState({
		websiteLink: "",
		organizationName: "",
	});
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchCompanyInfo = async () => {
			try {
				setLoading(true);
				const response = await axiosInterceptorInstance.get("/company-info");
				const status = response.data.status;

				switch (status) {
					case "SUCCESS":
						const domain_url = response.data.domain_url;
						if (domain_url) {
							setDomainLink(response.data.domain_url);
							setWebsiteLink(response.data.domain_url);
						}
						break;
					case "NEED_EMAIL_VERIFIED":
						router.push("/email-verificate");
						break;
					case "NEED_CHOOSE_PLAN":
						router.push("/settings?section=subscription");
						break;
					case "DASHBOARD_ALLOWED":
						router.push("/get-started");
						break;
					default:
						console.error("Unknown status:", status);
				}
			} catch (error) {
				console.error("Error fetching company info:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchCompanyInfo();
	}, []);

	const [isFocused, setIsFocused] = useState(false);

	const handleFocus = () => {
		setIsFocused(true);
	};

	const handleBlur = () => {
		setIsFocused(false);
	};

	const validateField = (
		value: string,
		type: "email" | "website" | "organizationName",
	): string => {
		switch (type) {
			case "email":
				const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				return emailRe.test(value) ? "" : "Invalid email address";
			case "website":
				const sanitizedValue = value?.replace(/^www\./, "");
				const websiteRe =
					/^(https?:\/\/)?([\da-z.-]+)\.([a-z]{2,20})([/\w .-]*)*\/?$/i;
				return websiteRe.test(sanitizedValue) ? "" : "Invalid website URL";
			case "organizationName":
				const orgName = value.trim();

				const hasLetter = /[a-zA-Zа-яА-Я0-9]/.test(orgName);

				if (!orgName) {
					return "Organization name is required";
				} else if (!hasLetter) {
					return "Organization name must contain at least one letter";
				}

				return "";
			default:
				return "";
		}
	};

	const endSetup = () => {
		if (stripeUrl) {
			router.push(stripeUrl);
		} else {
			// router.push("/dashboard");
			router.push("/get-started");
			localStorage.setItem("welcome_popup", "true");
		}
	};

	const handleSubmit = async () => {
		const newErrors = {
			websiteLink: validateField(websiteLink, "website"),
			organizationName: validateField(organizationName, "organizationName"),
		};
		setErrors(newErrors);

		if (newErrors.websiteLink) {
			return;
		}

		try {
			const response = await axiosInterceptorInstance.post("/company-info", {
				company_website: websiteLink,
			});

			switch (response.data.status) {
				case "SUCCESS":
					const domain = websiteLink.replace(/^https?:\/\//, "");
					sessionStorage.setItem("current_domain", domain);
					setDomainName(domain);
					setEditingName(false);
					await fetchUserData();
					if (response.data.stripe_payment_url) {
						setStripeUrl(`${response.data.stripe_payment_url}`);
					}
					break;
				case "NEED_EMAIL_VERIFIED":
					router.push("/email-verificate");
					break;
				case "NEED_CHOOSE_PLAN":
					router.push("/settings?section=subscription");
					break;
				default:
					break;
			}
		} catch (error) {
			console.error("An error occurred:", error);
		}
	};

	const handleWebsiteLink = (event: { target: { value: string } }) => {
		let input = event.target.value.trim();

		if (!input.startsWith("http://") && !input.startsWith("https://")) {
			input = `https://${input}`;
		}

		try {
			const url = new URL(input);

			const sanitizedInput = url.origin;

			setWebsiteLink(sanitizedInput);

			const websiteError = validateField(sanitizedInput, "website");
			setErrors((prevErrors) => ({
				...prevErrors,
				websiteLink: websiteError,
			}));
		} catch (error) {
			setWebsiteLink(input);
			setErrors((prevErrors) => ({
				...prevErrors,
				websiteLink: "Invalid website URL",
			}));
		}
	};

	const isFormValidFirst = () => {
		const errors = {
			websiteLink: validateField(websiteLink, "website"),
		};
		return errors.websiteLink === "";
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
							</Box>
							{
								<>
									<Typography
										variant="body1"
										component="h3"
										className="first-sub-title"
										sx={styles.text}
									>
										What is your organization&apos;s name
									</Typography>
									<TextField
										InputProps={{ className: "form-input" }}
										fullWidth
										label="Organization name"
										variant="outlined"
										margin="normal"
										sx={styles.formField}
										value={organizationName}
										onChange={(e) => setOrganizationName(e.target.value)}
										error={!!errors.organizationName}
										helperText={errors.organizationName}
										InputLabelProps={{
											className: "form-input-label",
											focused: false,
										}}
									/>

									<Typography
										variant="body1"
										component="h3"
										className="first-sub-title"
										sx={styles.text}
									>
										Share your primary company website
									</Typography>

									<TextField
										fullWidth
										label="Enter website link"
										variant="outlined"
										placeholder={isFocused ? "example.com" : ""}
										sx={styles.formField}
										InputLabelProps={{
											className: "form-input-label",
											focused: false,
										}}
										value={
											websiteLink
												? websiteLink.replace(/^https?:\/\//, "")
												: isFocused
													? websiteLink.replace(/^https?:\/\//, "")
													: `https://${websiteLink.replace(/^https?:\/\//, "")}`
										}
										onChange={domainLink ? undefined : handleWebsiteLink}
										onFocus={domainLink ? undefined : handleFocus}
										onBlur={domainLink ? undefined : handleBlur}
										disabled={!!domainLink}
										error={!!errors.websiteLink}
										helperText={errors.websiteLink}
										InputProps={{
											className: "form-input",
											startAdornment: isFocused && !websiteLink && (
												<InputAdornment position="start">
													https://
												</InputAdornment>
											),
										}}
									/>

									<Typography
										variant="body1"
										component="h2"
										className="first-sub-title"
										sx={styles.subtitle}
									>
										You can add more domains later
									</Typography>

									<CustomButton
										variant="contained"
										onClick={() => {
											handleSubmit();
											endSetup();
										}}
										disabled={!isFormValidFirst()}
										sx={{
											padding: "14px",
										}}
									>
										Get Started
									</CustomButton>
								</>
							}
						</Box>
					</Box>
				</Box>
			</Box>
		</>
	);
};

const AccountSetupPage = () => {
	return (
		<Suspense fallback={<CustomizedProgressBar />}>
			<AccountSetup />
		</Suspense>
	);
};

export default AccountSetupPage;
