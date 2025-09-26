import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { InfoIcon, ExpandMoreIcon, ExpandLessIcon } from "@/icon";

interface NotificationBannerProps {
	bgColor?: string;
	iconColor?: string;
	border?: string;
	sourceType: string;
}

const HintBanner: React.FC<NotificationBannerProps> = ({
	sourceType,
	bgColor = "rgba(235, 245, 255, 1)",
	iconColor = "rgba(56, 152, 252, 1)",
	border = "1px solid rgba(181, 217, 254, 1)",
}) => {
	const [openFullText, setOpenFullText] = useState(false);

	const showOrderAmount = () => {
		if (sourceType !== "Customer Conversions") {
			return false;
		}
		return true;
	};

	return (
		<Box
			sx={{
				width: "100%",
				position: "relative",
				display: "flex",
				bgcolor: bgColor,
				border: border,
				borderRadius: "4px",
				p: 2,
			}}
		>
			<Box
				sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 0.5,
						justifyContent: "space-between",
					}}
				>
					<InfoIcon sx={{ color: iconColor }} />
					<Typography
						sx={{
							color: "rgba(50,54,62,1)",
							fontFamily: "var(--font-nunito)",
							fontWeight: "600",
							fontSize: "14px",
							letterSpacing: "0%",
							lineHeight: "22px",
							mr: 2,
						}}
					>
						Why do we need each field
					</Typography>
					<Box sx={{ flexGrow: 1 }} />
				</Box>
				<Typography className="table-data">
					<Typography
						component="span"
						className="table-data"
						style={{ fontWeight: "500" }}
					>
						Email and Phone or ASID:
					</Typography>{" "}
					we use it to match the information we have about contacts in our 250M+
					contact database.
				</Typography>
				{openFullText && (
					<>
						<Typography className="table-data">
							<Typography
								component="span"
								className="table-data"
								style={{ fontWeight: "500" }}
							>
								Date:
							</Typography>{" "}
							its one of the data points we use to rank customers, the more
							recent and frequent purchases were, the more valued the customer.
						</Typography>
						{showOrderAmount() && (
							<Typography className="table-data">
								<Typography
									component="span"
									className="table-data"
									style={{ fontWeight: "500" }}
								>
									Order amount:
								</Typography>{" "}
								another thing we use in our customer ranking, the bigger the
								orders, better the customer is.
							</Typography>
						)}
					</>
				)}
				<Box
					sx={{ alignSelf: "flex-end", display: "flex", cursor: "pointer" }}
					onClick={() => setOpenFullText((state) => !state)}
				>
					<Typography
						className="sixth-sub-title"
						style={{ color: "rgba(56, 152, 252, 1)" }}
					>
						{openFullText ? "Hide" : "Show more"}
					</Typography>
					{openFullText ? (
						<ExpandLessIcon
							sx={{ fontSize: "20px", color: "rgba(56, 152, 252, 1)" }}
						/>
					) : (
						<ExpandMoreIcon
							sx={{ fontSize: "20px", color: "rgba(56, 152, 252, 1)" }}
						/>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default HintBanner;
