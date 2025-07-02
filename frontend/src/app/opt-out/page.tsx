"use client";

import {
	Box,
	Button,
	Grid,
	TextField,
	Typography,
	Paper,
	Stack,
} from "@mui/material";
import Image from "next/image";
import { OptOutStyle } from "./opt-out";
import ReCAPTCHA from "react-google-recaptcha";
import { SetStateAction, useRef, useState } from "react";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import axiosInstance from "@/axios/axiosInterceptorInstance";

export default function CcpaPage() {
	const recaptchaRef = useRef<ReCAPTCHA>(null);
	const [token, setToken] = useState<string | null>(null);
	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const [loading, setLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const [formValues, setFormValues] = useState({
		email: "",
	});

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		setFormValues({
			...formValues,
			[name]: value,
		});
		validateField(name, value.trim());
	};

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
			default:
				break;
		}

		setErrors(newErrors);
	};

	const handleSubmit = async () => {
		if (!token) {
			showErrorToast("Please verify that you are not a robot.");
			return;
		}

		if (!formValues.email || errors.email) {
			showErrorToast("Please enter a valid email.");
			return;
		}

		setLoading(true);

		try {
			const response = await axiosInstance.post("/opt-out", {
				email: formValues.email,
				recaptcha_token: token,
			});

			if (response.status === 200) {
				showToast("Your request has been submitted.");
				setIsSubmitted(true);
				setFormValues({ email: "" });
				setToken(null);
				recaptchaRef.current?.reset();
			}
		} catch (error: any) {
			const status = error.response?.status;
			const detail = error.response?.data;

			if (status === 400 && detail) {
				showErrorToast(detail);
			} else {
				showErrorToast("Failed to submit your request. Please try again.");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box sx={{ minHeight: "100vh" }}>
			<Grid container sx={{ minHeight: "100vh" }}>
				{/* Левая часть */}
				<Grid
					item
					xs={12}
					md={6.75}
					sx={{
						position: "relative",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						px: 4,
						py: 6,
					}}
				>
					<Box
						sx={{
							position: "absolute",
							top: 24,
							left: 32,
						}}
					>
						<Image
							src="/logo.svg"
							alt="Allsource logo"
							width={120}
							height={32}
						/>
					</Box>

					<Paper
						elevation={3}
						sx={{
							display: "flex",
							flexDirection: "column",
							p: 4,
							maxWidth: "50%",
							gap: 4,
						}}
					>
						<Box>
							<Typography sx={OptOutStyle.header}>
								Do Not Sell My Personal Information
							</Typography>
							<Typography sx={{ ...OptOutStyle.secondary, pt: 1 }}>
								Stop being included in business audience matching
							</Typography>
						</Box>

						<Box>
							<Typography sx={{ ...OptOutStyle.text, pb: 1 }}>
								Your email address
							</Typography>
							<TextField
								sx={OptOutStyle.formField}
								InputLabelProps={{
									className: "form-input-label",
									focused: false,
								}}
								placeholder="name@example.com"
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
								disabled={loading}
							/>

							<Box sx={{ my: 4 }}>
								<ReCAPTCHA
									ref={recaptchaRef}
									sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string}
									onChange={(token: SetStateAction<string | null>) =>
										setToken(token)
									}
									theme="light"
								/>
							</Box>

							<Button
								variant="contained"
								fullWidth
								color="primary"
								onClick={handleSubmit}
								sx={OptOutStyle.button}
							>
								{loading ? "Submitting..." : "Delete my data"}
							</Button>
						</Box>
					</Paper>
				</Grid>

				{/* Правая часть */}
				<Grid
					item
					xs={12}
					md={5.25}
					sx={{
						backgroundColor: "#f0f7ff",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						p: 2,
					}}
				>
					<Paper sx={{ p: 3, maxWidth: "64.5%", borderRadius: "8px" }}>
						<Stack spacing={3.5}>
							<Typography sx={OptOutStyle.header}>
								The California Consumer Privacy Act (CCPA), gives residents of
								the state of California the right to prevent businesses from
								selling their personal information.
							</Typography>
							<Typography sx={OptOutStyle.description}>
								California residents may exercise their right to opt-out by
								sending an email to support@allsourcedata.io withdrawing their
								consent to resell their personal information to third parties.
								They may authorize other persons to act on their behalf solely
								for the purposes of exercising their right to opt-out. The
								content of the email should include the email address of the
								person exercising the right to opt-out. Any personal information
								provided in the email in connection with the submission of the
								opt-out request will be used solely for the purposes of
								complying with the request.
							</Typography>
						</Stack>
					</Paper>
				</Grid>
			</Grid>
		</Box>
	);
}
