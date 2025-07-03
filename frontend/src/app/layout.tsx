"use client";
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
import { Nunito_Sans, Roboto } from "next/font/google";

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
	const pathname = usePathname();
	const pageTitle = formatPageTitle(pathname || "");
	return (
		<html lang="en" className={`${nunito.variable} ${roboto.variable}`}>
			<head>
				<title>{pageTitle ? `Allsource | ${pageTitle} ` : "Allsource"}</title>
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
		</html>
	);
}
