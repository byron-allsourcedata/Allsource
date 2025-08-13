"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import { AxiosError } from "axios";
import { loginStyles } from "./loginStyles";
import { showErrorToast } from "@/components/ToastNotification";
import { GoogleLogin } from "@react-oauth/google";
import { fetchUserData } from "@/services/meService";
import PageWithLoader from "@/components/FirstLevelLoader";
import { usePrivacyPolicyContext } from "../../../context/PrivacyPolicyContext";
import { flagStore } from "@/services/oneDollar";
import { useUser } from "@/context/UserContext";
import { Logo } from "@/components/ui/Logo";

const Signin: React.FC = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { partner } = useUser();
	const { setPrivacyPolicyPromiseResolver } = usePrivacyPolicyContext();
	useEffect(() => {
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "auto";
		};
	}, []);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const token = localStorage.getItem("token");
			if (token) {
				router.push(partner ? "/partners" : "/dashboard");
			}
		}
	}, [router, partner]);

	const [showPassword, setShowPassword] = useState(false);
	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const initialShopifyData = {
		code: searchParams.get("code") || null,
		hmac: searchParams.get("hmac") || null,
		host: searchParams.get("host") || null,
		shop: searchParams.get("shop") || null,
		state: searchParams.get("state") || null,
		timestamp: searchParams.get("timestamp") || null,
	};
	const isShopifyDataComplete = Object.values(initialShopifyData).every(
		(value) => value !== null,
	);
	const [formValues, setFormValues] = useState({
		email: "",
		password: "",
		...(isShopifyDataComplete && { shopify_data: initialShopifyData }),
	});

	const validateField = (name: string, value: string) => {
		const newErrors: { [key: string]: string } = { ...errors };

		switch (name) {
			case "email":
				if (!value) {
					newErrors.email = "Email address is required";
				} else if (!/\S+@\S+\.\S+/.test(value)) {
					newErrors.email = "Email address is invalid";
				} else {
					delete newErrors.email;
				}
				break;
			case "password":
				if (!value) {
					newErrors.password = "Password is required";
				} else {
					delete newErrors.password;
				}
				break;
			default:
				break;
		}

		setErrors(newErrors);
	};

	const get_me = async () => {};

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		setFormValues({
			...formValues,
			[name]: value,
		});
		validateField(name, value);
	};

	const checkPrivacyPolicy = async (): Promise<void> => {
		return new Promise((resolve) => {
			axiosInterceptorInstance
				.get("/privacy-policy/has-accept-privacy-policy")
				.then((response) => {
					if (response.status === 200 && response.data.status === "ok") {
						resolve();
					} else {
						return new Promise<void>((resolveAccept) => {
							setPrivacyPolicyPromiseResolver(() => {
								resolveAccept();
								resolve();
							});
							router.push("/privacy-policy");
						});
					}
				})
				.catch(() => {});
		});
	};

	const checkOneDollarSubscription = (): Promise<void> => {
		return new Promise((resolve) => {
			axiosInterceptorInstance
				.get("/has-current-subscription")
				.then((response) => {
					if (response.status === 200 && response.data.status === "ok") {
						resolve();
						flagStore.set(false);
					} else {
						flagStore.set(true);
						resolve();
					}
				})
				.catch(() => {
					flagStore.set(true);
				});
		});
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		const newErrors: { [key: string]: string } = {};

		if (!formValues.email) {
			newErrors.email = "Email address is required";
		}

		if (!formValues.password) {
			newErrors.password = "Password is required";
		}

		setErrors(newErrors);

		if (Object.keys(newErrors).length > 0) {
			return;
		}

		try {
			let user = null;
			const response = await axiosInterceptorInstance.post(
				"/login",
				formValues,
			);

			if (response.status === 200) {
				const responseData = response.data;
				if (typeof window !== "undefined") {
					if (responseData.token && responseData.token !== null) {
						localStorage.setItem("token", responseData.token);
					}
				}
				if (responseData) {
					switch (responseData.shopify_status) {
						case "ERROR_SHOPIFY_TOKEN":
							showErrorToast("Error shopify token");
							break;
						case "NEED_UPGRADE_PLAN":
							showErrorToast("Need upgrade plan");
							break;
						case "NON_SHOPIFY_ACCOUNT":
							showErrorToast("Non shopify account");
							break;
						case "NO_USER_CONNECTED":
							showErrorToast("No user connected");
							break;
						case "USER_NOT_FOUND":
							showErrorToast("User not found");
							break;
					}
					switch (responseData.status) {
						case "SUCCESS":
							user = await fetchUserData();
							await checkPrivacyPolicy();
							await checkOneDollarSubscription();
							router.push(user?.partner ? "/partners" : "/dashboard");
							break;

						case "SUCCESS_ADMIN":
							sessionStorage.setItem("admin", "true");
							router.push("/admin");
							break;

						case "NON_SHOPIFY_ACCOUNT":
							showErrorToast("non shopify account");
							break;

						case "NEED_ACCEPT_PRIVACY_POLICY":
							router.push("/privacy-policy");
							break;

						case "INCORRECT_PASSWORD_OR_EMAIL":
							showErrorToast("Incorrect password or email.");
							break;

						case "NEED_CONFIRM_EMAIL":
							await fetchUserData();
							router.push("/email-verificate");
							break;

						case "NEED_CHOOSE_PLAN":
							user = await fetchUserData();
							router.push(
								user?.partner ? "/partners" : "/settings?section=subscription",
							);
							break;

						case "NEED_BOOK_CALL":
							user = await fetchUserData();
							router.push(user?.partner ? "/partners" : "/dashboard");
							break;

						case "PAYMENT_NEEDED":
							await fetchUserData();
							router.push(`${response.data.stripe_payment_url}`);
							break;

						case "PIXEL_INSTALLATION_NEEDED":
							user = await fetchUserData();
							router.push(user?.partner ? "/partners" : "/get-started");
							break;

						case "FILL_COMPANY_DETAILS":
							let data = await fetchUserData();
							await checkPrivacyPolicy();
							await checkOneDollarSubscription();
							const { is_pixel_installed, is_source_imported } =
								data?.get_started;
							if (is_pixel_installed && is_source_imported) {
								router.push(data?.partner ? "/partners" : "/dashboard");
							} else {
								router.push(data?.partner ? "/partners" : "/get-started");
							}
							break;

						default:
							user = await fetchUserData();
							router.push(user?.partner ? "/partners" : "/dashboard");
							break;
					}
				} else {
					console.error("Empty response data");
				}
			} else {
				console.error("HTTP error:", response.status);
			}
		} catch (err) {
			const error = err as AxiosError;
			if (error.response && error.response.data) {
				const errorData = error.response.data as { [key: string]: string };
				setErrors(errorData);
			} else {
				console.error("Error:", error);
			}
		}
	};

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	return (
		<>
			<Box sx={loginStyles.logoContainer}>
				<Logo />
			</Box>

			<Box sx={loginStyles.mainContent}>
				<Box sx={loginStyles.container}>
					<Typography className="heading-text" sx={loginStyles.title}>
						Welcome Back!
					</Typography>
					<GoogleLogin
						onSuccess={async (credentialResponse) => {
							try {
								let user = null;
								const response = await axiosInterceptorInstance.post(
									"/login-google",
									{
										token: credentialResponse.credential,
										...(isShopifyDataComplete && {
											shopify_data: initialShopifyData,
										}),
									},
								);
								const responseData = response.data;
								if (typeof window !== "undefined") {
									if (responseData.token && responseData.token !== null) {
										localStorage.setItem("token", responseData.token);
										get_me();
									}
								}
								switch (response.data.shopify_status) {
									case "ERROR_SHOPIFY_TOKEN":
										showErrorToast("Error shopify token");
										break;
									case "NEED_UPGRADE_PLAN":
										showErrorToast("Need upgrade plan");
										break;
									case "NON_SHOPIFY_ACCOUNT":
										showErrorToast("Non shopify account");
										break;
									case "NO_USER_CONNECTED":
										showErrorToast("No user connected");
										break;
									case "USER_NOT_FOUND":
										showErrorToast("User not found");
										break;
								}
								switch (response.data.status) {
									case "SUCCESS":
										user = await fetchUserData();
										await checkPrivacyPolicy();
										await checkOneDollarSubscription();
										router.push(user?.partner ? "/partners" : "/dashboard");
										break;
									case "SUCCESS_ADMIN":
										await fetchUserData();
										sessionStorage.setItem("admin", "true");
										router.push("/admin");
										break;
									case "NEED_CHOOSE_PLAN":
										router.push("/settings?section=subscription");
										break;
									case "NON_SHOPIFY_ACCOUNT":
										showErrorToast("non shopify account");
										break;
									case "NEED_BOOK_CALL":
										sessionStorage.setItem("is_slider_opened", "true");
										router.push("/dashboard");
										break;
									case "PAYMENT_NEEDED":
										router.push(`${response.data.stripe_payment_url}`);
										break;
									case "INCORRECT_PASSWORD_OR_EMAIL":
										showErrorToast("User with this email does not exist");
										break;
									case "PIXEL_INSTALLATION_NEEDED":
										user = await fetchUserData();
										router.push(user?.partner ? "/partners" : "/dashboard");
										break;
									case "FILL_COMPANY_DETAILS":
										let data = await fetchUserData();
										await checkPrivacyPolicy();
										await checkOneDollarSubscription();
										const { is_pixel_installed, is_source_imported } =
											data?.get_started;
										if (is_pixel_installed && is_source_imported) {
											router.push(data?.partner ? "/partners" : "/dashboard");
										} else {
											router.push(data?.partner ? "/partners" : "/get-started");
										}
										break;
									default:
										router.push("/dashboard");
								}
							} catch (error) {
								console.error("Error during Google login:", error);
							}
						}}
						onError={() => {}}
						ux_mode="popup"
					/>
					<Box sx={loginStyles.orDivider}>
						<Box sx={{ borderBottom: "1px solid #DCE1E8", flexGrow: 1 }} />
						<Typography
							variant="body1"
							className="third-sub-title"
							sx={loginStyles.orText}
						>
							OR
						</Typography>
						<Box sx={{ borderBottom: "1px solid #DCE1E8", flexGrow: 1 }} />
					</Box>
					<Box component="form" onSubmit={handleSubmit} sx={loginStyles.form}>
						<TextField
							sx={loginStyles.formField}
							InputLabelProps={{
								className: "form-input-label",
								sx: loginStyles.inputLabel,
								focused: false,
							}}
							label="Email address"
							name="email"
							type="email"
							variant="outlined"
							fullWidth
							margin="normal"
							value={formValues.email}
							onChange={handleChange}
							error={Boolean(errors.email)}
							helperText={errors.email}
							InputProps={{
								className: "form-input",
							}}
						/>
						<TextField
							InputLabelProps={{
								className: "form-input-label",
								sx: loginStyles.inputLabel,
								focused: false,
							}}
							autoComplete="new-password"
							label="Enter password"
							name="password"
							type={showPassword ? "text" : "password"}
							variant="outlined"
							fullWidth
							margin="normal"
							value={formValues.password}
							onChange={handleChange}
							error={Boolean(errors.password)}
							helperText={errors.password}
							InputProps={{
								className: "form-input",
								endAdornment: (
									<InputAdornment position="end">
										<IconButton onClick={togglePasswordVisibility} edge="end">
											{/* {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />} */}
											<Image
												src={
													showPassword
														? "/custom-visibility-icon-off.svg"
														: "/custom-visibility-icon.svg"
												}
												alt={showPassword ? "Show password" : "Hide password"}
												height={18}
												width={18} // Adjust the size as needed
												title={showPassword ? "Hide password" : "Show password"}
											/>
										</IconButton>
									</InputAdornment>
								),
							}}
						/>
						<Typography
							variant="body2"
							className="hyperlink-blue"
							sx={loginStyles.resetPassword}
						>
							<Link href="/reset-password" sx={loginStyles.loginLink}>
								Forgot Password
							</Link>
						</Typography>
						<Button
							className="hyperlink-blue"
							type="submit"
							variant="contained"
							sx={loginStyles.submitButton}
							fullWidth
						>
							Login
						</Button>
					</Box>

					<Typography
						variant="body2"
						className="second-sub-title"
						sx={loginStyles.loginText}
					>
						Don’t have an account?{" "}
						<Link
							href={`/signup?${searchParams.toString()}`}
							className="hyperlink-blue"
							sx={loginStyles.loginLink}
						>
							Signup now
						</Link>
					</Typography>
				</Box>
			</Box>
		</>
	);
};

const SigninPage: React.FC = () => {
	return (
		<Suspense fallback={<PageWithLoader />}>
			<Signin />
		</Suspense>
	);
};

export default SigninPage;
