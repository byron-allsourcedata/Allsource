"use client";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";
import { UserProvider } from "../context/UserContext";
import ToastNotificationContainer from "../components/ToastNotification";
import "react-toastify/dist/ReactToastify.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { TrialProvider } from "../context/TrialProvider";
import { HintsProvider } from "../context/HintsContext";
import { SSEProvider } from "../context/SSEContext";
import { IntegrationProvider } from "@/context/IntegrationContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { usePathname } from "next/navigation";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

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
		.join(" ");
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const pageTitle = formatPageTitle(pathname || "");
	return (
		<html lang="en">
			<head>
				<title>{pageTitle ? `AllSource | ${pageTitle} ` : "AllSource"}</title>
				<meta name="description" content={`Page: ${pageTitle}`} />
				<meta
					httpEquiv="Content-Security-Policy"
					content="script-src * 'unsafe-inline' 'unsafe-eval'; object-src 'none';"
				/>
			</head>
			<body className={inter.className}>
				<GoogleOAuthProvider clientId={googleClientId as string}>
					<SSEProvider>
						<SidebarProvider>
							<TrialProvider>
								<HintsProvider>
									<UserProvider>
										<IntegrationProvider>{children}</IntegrationProvider>
									</UserProvider>
								</HintsProvider>
							</TrialProvider>
						</SidebarProvider>
					</SSEProvider>
				</GoogleOAuthProvider>
				<ToastNotificationContainer />
				<script
					defer={true}
					src="https://www.dwin1.com/107427.js"
					type="text/javascript"
				></script>
			</body>
			{/* <Script id="zoho-init" strategy="beforeInteractive">
				{`
            window.$zoho = window.$zoho || {};
            $zoho.salesiq = $zoho.salesiq || { ready: function() {} };
          `}
			</Script>
			<Script
				id="zsiqscript"
				src="https://salesiq.zohopublic.com/widget?wc=siqb8de147bca1b487624f8f2587b4ee3e1eda041e3130528d6440dbf53a2d200eb"
				strategy="afterInteractive"
				defer
			/> */}
		</html>
	);
}
