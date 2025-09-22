"use client";
import axios from "axios";
import { showErrorToast } from "@/components/ToastNotification";
import { flagStore } from "@/services/oneDollar";
import { makeUseAxios, UseAxios } from "axios-hooks";

const axiosInterceptorInstance = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

axiosInterceptorInstance.interceptors.request.use(
	async (config) => {
		if (typeof window === "undefined") {
			return;
		}
		const accessToken = localStorage.getItem("token");
		let currentDomain = sessionStorage.getItem("current_domain");

		if (config.headers) {
			if (accessToken) {
				config.headers.Authorization = `Bearer ${accessToken}`;
				if (!currentDomain) {
					try {
						const response = await axios.get(
							`${process.env.NEXT_PUBLIC_API_BASE_URL}domains/`,
							{
								headers: { Authorization: `Bearer ${accessToken}` },
							},
						);

						if (response.status === 200 && response.data.length > 0) {
							currentDomain = response.data[0].domain;
							sessionStorage.setItem("current_domain", currentDomain);
						}
					} catch (error) {
						console.error("Error fetching domain:", error);
					}
				}
				if (currentDomain) {
					config.headers.CurrentDomain = currentDomain;
				}
			} else {
				config.headers.Authorization = `Bearer`;
			}
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

const navigateTo = (path) => {
	window.location.href = path;
};
axiosInterceptorInstance.interceptors.response.use(
	(response) => {
		return response;
	},
	async (error) => {
		const url = error.config?.url;
		if (url?.endsWith("/whitelabel/settings")) {
			return Promise.reject(error);
		}

		if (
			error.response &&
			error.response.data instanceof Blob &&
			error.response.data.type === "application/json"
		) {
			try {
				const text = await error.response.data.text();
				error.response.data = JSON.parse(text);
			} catch (e) {
				console.error("Failed to parse blob error response:", e);
			}
		}

		if (error.response) {
			switch (error.response.status) {
				case 307:
					break;
				case 400:
					break;
				case 401:
					// 401 error handler (Unauthorized)
					localStorage.clear();
					navigateTo("/signin");
					break;
				case 403:
					switch (error.response.data.status) {
						case "DOMAIN_NOT_FOUND":
							navigateTo("dashboard");
							// navigateTo("/account-setup");
							break;
						case "NEED_BOOK_CALL":
							sessionStorage.setItem("is_slider_opened", "true");
							break;
						case "NEED_CONFIRM_EMAIL":
							navigateTo("/email-verificate");
							break;
						case "NEED_ACCEPT_PRIVACY_POLICY":
							navigateTo("/privacy-policy");
							break;
						case "NEED_PAY_BASIC":
							flagStore.set(true);
							break;
						case "PIXEL_INSTALLATION_NEEDED":
							break;
						case "FILL_COMPANY_DETAILS":
							// navigateTo("/account-setup");
							break;
						case "TEAM_TOKEN_EXPIRED":
							localStorage.clear();
							sessionStorage.clear();
							navigateTo("/signin");
							break;
						case "PAYMENT_NEEDED":
							navigateTo(`${error.response.data.stripe_payment_url}`);
							break;
						case "PAYMENT_FAILED":
							const currentUrl =
								window.location.pathname + window.location.search;
							const expectedUrl =
								"/settings?section=billing&payment_failed=true";
							if (currentUrl !== expectedUrl) {
								navigateTo(expectedUrl);
							}
							break;
						case "FORBIDDEN":
							break;
					}
					break;
				case 404:
					//navigateTo('/not_found')
					break;
				case 429:
					break;
				case 500:
					// Handle 500 Internal Server Error
					showErrorToast("Internal Server Error. Please try again later.");
					break;
				// Handle other statuses if needed
				default:
					showErrorToast(
						`An error occurred: ${
							error.response.data.status || "Unknown error"
						}`,
					);
			}
		} else if (error.request) {
		} else {
		}

		return Promise.reject(error);
	},
);

export const useAxios = makeUseAxios({
	axios: axiosInterceptorInstance,
	defaultOptions: {
		manual: true,
	},
});

export default axiosInterceptorInstance;
