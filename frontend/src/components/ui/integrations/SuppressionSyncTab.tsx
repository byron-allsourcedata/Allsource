import { Box, Switch, Typography } from "@mui/material";
import Image from "next/image";
import { useState } from "react";

export interface SuppressionSyncTabProps {
	image: string;
	serviceName: string;
}

export const SuppressionSyncTab = ({
	image,
	serviceName,
}: SuppressionSyncTabProps) => {
	const [checked, setChecked] = useState(false);

	const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setChecked(event.target.checked);
	};
	const label = { inputProps: { "aria-label": "Switch demo" } };

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
			<Box
				sx={{
					p: 2,
					border: "1px solid #f0f0f0",
					borderRadius: "4px",
					boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.20)",
					display: "flex",
					flexDirection: "column",
					gap: "16px",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
					<Image src={image} alt={serviceName} height={26} width={32} />
					<Typography
						variant="h6"
						sx={{
							fontFamily: "var(--font-nunito)",
							fontSize: "16px",
							fontWeight: "600",
							color: "#202124",
							lineHeight: "normal",
						}}
					>
						Eliminate Redundancy: Stop Paying for Contacts You Already Own
					</Typography>
				</Box>
				<Typography
					variant="subtitle1"
					sx={{
						fontFamily: "var(--font-roboto)",
						fontSize: "12px",
						fontWeight: "400",
						color: "#808080",
						lineHeight: "20px",
						letterSpacing: "0.06px",
					}}
				>
					Sync your current list to avoid collecting contacts you already
					possess. Newly added contacts in GreenArrow will be automatically
					suppressed each day.
				</Typography>

				<Box
					sx={{
						display: "flex",
						gap: "32px",
						alignItems: "center",
					}}
				>
					<Typography
						variant="subtitle1"
						sx={{
							fontFamily: "var(--font-roboto)",
							fontSize: "12px",
							fontWeight: "400",
							color: "#808080",
							lineHeight: "normal",
							letterSpacing: "0.06px",
						}}
					>
						Enable Automatic Contact Suppression
					</Typography>

					{/* Switch Control with Yes/No Labels */}
					<Box position="relative" display="inline-block">
						<Switch
							{...label}
							checked={checked}
							onChange={handleSwitchChange}
							sx={{
								width: 54, // Increase width to fit "Yes" and "No"
								height: 24,
								padding: 0,
								"& .MuiSwitch-switchBase": {
									padding: 0,
									top: "2px",
									left: "3px",
									"&.Mui-checked": {
										left: 0,
										transform: "translateX(32px)", // Adjust for larger width
										color: "#fff",
										"&+.MuiSwitch-track": {
											backgroundColor: checked
												? "rgba(56, 152, 252, 1)"
												: "#7b7b7b",
											opacity: checked ? "1" : "1",
										},
									},
								},
								"& .MuiSwitch-thumb": {
									width: 20,
									height: 20,
								},
								"& .MuiSwitch-track": {
									borderRadius: 20 / 2,
									backgroundColor: checked
										? "rgba(56, 152, 252, 1)"
										: "#7b7b7b",
									opacity: checked ? "1" : "1",
									"& .MuiSwitch-track.Mui-checked": {
										backgroundColor: checked
											? "rgba(56, 152, 252, 1)"
											: "#7b7b7b",
										opacity: checked ? "1" : "1",
									},
								},
							}}
						/>
						<Box
							sx={{
								position: "absolute",
								top: "50%",
								left: "0px",
								width: "100%",
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								transform: "translateY(-50%)",
								pointerEvents: "none",
							}}
						>
							{/* Conditional Rendering of Text */}
							{!checked && (
								<Typography
									variant="caption"
									sx={{
										fontFamily: "var(--font-roboto)",
										fontSize: "12px",
										color: "#fff",
										fontWeight: "400",
										marginRight: "8px",
										lineHeight: "normal",
										width: "100%",
										textAlign: "right",
									}}
								>
									No
								</Typography>
							)}

							{checked && (
								<Typography
									variant="caption"
									sx={{
										fontFamily: "var(--font-roboto)",
										fontSize: "12px",
										color: "#fff",
										fontWeight: "400",
										marginLeft: "6px",
										lineHeight: "normal",
									}}
								>
									Yes
								</Typography>
							)}
						</Box>
					</Box>
				</Box>
			</Box>
			<Box
				sx={{
					background: "#efefef",
					borderRadius: "4px",
					px: 1.5,
					py: 1,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
					<Image
						src="/info-circle.svg"
						alt="info-circle"
						height={20}
						width={20}
					/>
					<Typography
						variant="subtitle1"
						sx={{
							fontFamily: "var(--font-roboto)",
							fontSize: "12px",
							fontWeight: "400",
							color: "#808080",
							lineHeight: "20px",
							letterSpacing: "0.06px",
						}}
					>
						By performing this action, all your GreenArrow contacts will be
						added to your Grow suppression list, and new contacts will be
						imported daily around 6pm EST.
					</Typography>
				</Box>
			</Box>
		</Box>
	);
};
