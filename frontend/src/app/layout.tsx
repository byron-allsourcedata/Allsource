"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import type React from "react";
import { useEffect, useState } from "react";
import { UserProvider } from "../context/UserContext";
import { PrivacyPolicyProvider } from "../context/PrivacyPolicyContext";
import ToastNotificationContainer from "../components/ToastNotification";
import "react-toastify/dist/ReactToastify.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { TrialProvider } from "../context/TrialProvider";
import { HintsProvider } from "../context/HintsContext";
import { BillingProvider } from "../context/BillingContext";
import { SSEProvider } from "../context/SSEContext";
import { IntegrationProvider } from "@/context/IntegrationContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { usePathname } from "next/navigation";
import { Nunito_Sans, Roboto } from "next/font/google";
import {
	restoreWhitelabel,
	WhitelabelProvider,
} from "./features/whitelabel/contexts/WhitelabelContext";
import type { WhitelabelSettingsSchema } from "./features/whitelabel/schemas";
import { getStoredWhitelabel } from "@/components/utils";
import { useZohoChatToggle } from "@/hooks/useZohoChatToggle";
import { ThemeProvider } from "@mui/material/styles";
import { coreTheme } from "@/themes/coreTheme";

const inter = Inter({ subsets: ["latin"] });
const nunito = Nunito_Sans({
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700", "900"],
	display: "swap",
	variable: "--font-nunito",
});

const roboto = Roboto({
	subsets: ["latin"],
	weight: ["100", "300", "400", "500", "700", "900"],
	display: "swap",
	variable: "--font-roboto",
});

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

if (!googleClientId) {
	throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined");
}

const formatPageTitle = (path: string) => {
	return path
		.replace(/[-_]/g, " ")
		.split("/")
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.slice(0, 2)
		.join(" ");
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [whitelabel, setWhitelabel] = useState<WhitelabelSettingsSchema>(
		restoreWhitelabel() ?? {
			brand_name: "",
			// brand_logo_url: "", was be so
			brand_logo_url: "/logo.svg",
			brand_icon_url: "/logo-icon.svg",
		},
	);

	const pathname = usePathname();
	const pageTitle = formatPageTitle(pathname || "");
	const isAdminPage = pathname?.startsWith("/admin");

	const formattedPageTitle = pageTitle
		? `${whitelabel.brand_name} | ${pageTitle} `
		: `${whitelabel.brand_name}`;

	useZohoChatToggle(isAdminPage);

	useEffect(() => {
		if (!isAdminPage) {
			if (!document.getElementById("zsiqscript")) {
				const init = document.createElement("script");
				init.id = "zoho-init";
				init.innerHTML = `
        window.$zoho = window.$zoho || {};
        $zoho.salesiq = $zoho.salesiq || { ready: function(){} };

        $zoho.salesiq.ready = function() {
          $zoho.salesiq.chatbutton.visible("show");
        };
      `;
				document.body.appendChild(init);

				const script = document.createElement("script");
				script.id = "zsiqscript";
				script.src =
					"https://salesiq.zohopublic.com/widget?wc=siqb8de147bca1b487624f8f2587b4ee3e1eda041e3130528d6440dbf53a2d200eb";
				script.defer = true;
				document.body.appendChild(script);
			}
		}
	}, [isAdminPage]);

	return (
		<html lang="en" className={`${nunito.variable} ${roboto.variable}`}>
			<head>
				<title>{formattedPageTitle}</title>
				<meta name="description" content={`Page: ${pageTitle}`} />
				<link rel="icon" href={whitelabel.brand_icon_url ?? "/logo-icon.svg"} />
				<meta
					httpEquiv="Content-Security-Policy"
					content="script-src * 'unsafe-inline' 'unsafe-eval'; object-src 'none';"
				/>
			</head>
			<body className={inter.className}>
				<ThemeProvider theme={coreTheme}>
					<GoogleOAuthProvider clientId={googleClientId as string}>
						<SSEProvider>
							<SidebarProvider>
								<TrialProvider>
									<HintsProvider>
										<BillingProvider>
											<PrivacyPolicyProvider>
												<UserProvider>
													<WhitelabelProvider
														whitelabel={whitelabel}
														setWhitelabel={setWhitelabel}
														autofetch={true}
													>
														<IntegrationProvider>
															{children}
														</IntegrationProvider>
													</WhitelabelProvider>
												</UserProvider>
											</PrivacyPolicyProvider>
										</BillingProvider>
									</HintsProvider>
								</TrialProvider>
							</SidebarProvider>
						</SSEProvider>
					</GoogleOAuthProvider>
				</ThemeProvider>

				<ToastNotificationContainer />
				<script
					defer={true}
					src="https://www.dwin1.com/107427.js"
					type="text/javascript"
				></script>
			</body>
		</html>
	);
}
