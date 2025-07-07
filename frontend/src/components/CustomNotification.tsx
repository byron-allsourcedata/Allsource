import React, { useEffect, useState } from "react";
import { Box, Button, Link, Typography } from "@mui/material";
import Image from "next/image";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useIntegrationLink } from "@/hooks/useIntegrationLink";

interface CustomNotificationProps {
	id: number;
	message: string;
	showDismiss: boolean;
	onDismiss: () => void;
}

const CustomNotification: React.FC<CustomNotificationProps> = ({
	id,
	message,
	showDismiss,
	onDismiss,
}) => {
	const [show, setShow] = useState(true);

	const learnMoreUrl = useIntegrationLink(message);

	const handleDismiss = () => {
		try {
			const response = axiosInstance.post("/notification/dismiss", {
				notification_ids: [id],
			});
			setShow(false);
			onDismiss();
		} catch (error) {}
	};

	const keywords: { word: string; link: string }[] = [
		{ word: "Enable Overage", link: "/settings?section=billing" },
		{ word: "billing", link: "/settings?section=billing" },
		{ word: "Enable", link: "/settings?section=billing" },
		{ word: "Upgrade", link: "/settings?section=subscription" },
		{ word: "Choose a plan", link: "/settings?section=subscription" },
		{ word: "Learn more", link: learnMoreUrl },
	];

	const transformTextToLinks = (text: string | null): JSX.Element => {
		if (!text) {
			return <span></span>;
		}

		const regex = new RegExp(`(${keywords.map((k) => k.word).join("|")})`, "g");

		const parts = text.split(regex).map((part, index) => {
			const keyword = keywords.find((k) => k.word === part);
			if (keyword) {
				return (
					<Link
						key={index}
						{...(keyword.word === "Learn more" && {
							target: "_blank",
							rel: "noopener noreferrer",
						})}
						className="second-sub-title"
						rel="noopener noreferrer"
						href={keyword.link}
						sx={{
							display: "inline-flex",
							alignItems: "center",
							fontFamily: "var(--font-nunito)",
							fontSize: "14px",
							fontWeight: 500,
							lineHeight: "19.6px",
							gap: 1,
							textDecoration:
								keyword.word === "Learn more" ? "underline" : "none",
							color: "rgba(20, 110, 246, 1) !important",
							"@media (max-width: 600px)": { fontSize: "11px !important" },
						}}
					>
						{part}
						{keyword.word === "Learn more" && (
							<OpenInNewIcon sx={{ fontSize: 16 }} />
						)}
					</Link>
				);
			}
			return part;
		});
		return <>{parts}</>;
	};
	return (
		show && (
			<Box
				sx={{
					display: "flex",
					mt: 0.5,
					mb: 0.5,
					top: "4.25rem",
					position: "sticky",
					alignItems: "center",
					border: "1px solid rgba(248, 70, 75, 1)",
					borderRadius: "6px",
					padding: "1.25rem 1.5rem",
					width: "calc(100% - 20px)",
					marginLeft: "10px",
					maxHeight: "34px",
					"@media (max-width: 900px)": { top: "4.75rem", zIndex: 60 },
					"@media (max-width: 600px)": {
						padding: "0.25rem 0.5rem",
						top: "4.75rem",
						maxHeight: "56px",
					},
					backgroundColor: "#fff",
				}}
			>
				<Image
					src="/danger-icon.svg"
					alt="Danger Icon"
					width={20}
					height={20}
				/>

				<Typography
					variant="body1"
					className="second-sub-title"
					sx={{
						marginLeft: "8px",
						flexGrow: 1,
						"@media (max-width: 600px)": { fontSize: "10px !important" },
					}}
				>
					{transformTextToLinks(message)}
				</Typography>

				{showDismiss && (
					<Button
						onClick={handleDismiss}
						className="second-sub-title"
						sx={{
							color: "rgba(56, 152, 252, 1) !important",
							textTransform: "none",
							"@media (max-width: 600px)": { fontSize: "12px !important" },
						}}
					>
						Dismiss
					</Button>
				)}
			</Box>
		)
	);
};

export default CustomNotification;
