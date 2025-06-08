import React from "react";
import { Box, Typography, Button, Divider, styled } from "@mui/material";

import { PlanProperties } from "./Properties";
import { CardGiftcard, HistoryToggleOff, Update } from "@mui/icons-material";
import { Plan } from "../plans";
import { Row } from "@/components/Row";
import { CustomButton } from "@/components/ui";

const PlanTitle = styled(Typography)`
    font-family: Nunito Sans;
    font-weight: 600;
    font-size: 20px;
    line-height: 22px;
    letter-spacing: 0%;
    color: #151619;
`;

const PlanPrice = styled(Typography)`
    font-family: Nunito Sans;
    font-weight: 600;
    font-size: 14px;
    line-height: 22px;
    letter-spacing: 0%;
    color: #151619;
`;

const PlanTerm = styled(Typography)`
    font-family: Nunito Sans;
    font-weight: 600;
    font-size: 14px;
    line-height: 22px;
    letter-spacing: 0%;
    color: #757575;
`;

export const PlanCard: React.FC<{
	plan: Plan;
	activePlanTitle: string;
	activePlanPeriod: string;
	tabValue: number;
	buttonProps: {
		onChoose: (alias: string) => void;
		text: string;
		disabled?: boolean;
		variant?: "contained" | "outlined";
	};
	isRecommended?: boolean;
}> = ({
	plan,
	activePlanTitle,
	tabValue,
	buttonProps,
	activePlanPeriod,
	isRecommended,
}) => {
	const getButtonLabel = () => {
		if (plan.isActive) return "Current Plan";

		if (activePlanTitle === "") {
			return "Choose Plan";
		}

		const levels = ["Launch", "Pro", "Growth"];
		const currentLevelIndex = levels.indexOf(activePlanTitle);
		const targetLevelIndex = levels.indexOf(plan.title);

		if (currentLevelIndex === -1 || targetLevelIndex === -1) {
			return "Choose Plan";
		}

		if (tabValue === 1 && activePlanPeriod === "year") {
			if (targetLevelIndex > currentLevelIndex) return "Upgrade";
			if (targetLevelIndex < currentLevelIndex) return "Downgrade";
			return "Current";
		}

		if (tabValue === 1 && activePlanPeriod === "month") {
			return "Upgrade";
		}

		if (targetLevelIndex > currentLevelIndex) return "Upgrade";
		if (targetLevelIndex < currentLevelIndex) return "Downgrade";
		return "Downgrade";
	};

	const alias = "";

	return (
		<Box
			sx={{
				position: "relative",
				width: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{isRecommended && (
				<Box
					sx={{
						display: "flex",
						justifyContent: "flex-end",
						width: "100%",
					}}
				>
					<Box
						sx={{
							bgcolor: "rgba(234, 248, 221, 1)",
							borderRadius: "4px 4px 0 0",
							px: 1.5,
							py: 0.5,
						}}
					>
						<Typography
							variant="caption"
							sx={{
								fontFamily: "Roboto",
								fontWeight: 400,
								fontSize: "14px",
								lineHeight: "140%",
								letterSpacing: "0%",
								color: "rgba(43, 91, 0, 1)",
							}}
						>
							Recommended
						</Typography>
					</Box>
				</Box>
			)}
			<Box>
				<Box
					sx={{
						padding: "30px 24px",
						border: isRecommended
							? "1px solid rgba(56, 152, 252, 1)"
							: "1px solid rgba(237, 237, 237, 1)",
						backgroundColor: isRecommended
							? "rgba(249, 252, 255, 1)"
							: "transparent",
						borderRadius: isRecommended ? "4px 0 4px 4px" : "4px",
						boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.08)",
						height: "100%",
						position: "relative",
					}}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "end",
							marginBottom: 2,
							gap: "8px",
						}}
					>
						<Box
							sx={{
								display: "flex",
								whiteSpace: "nowrap",
								alignItems: "center",
								gap: "8px",
							}}
						>
							<PlanTitle>{plan.title}</PlanTitle>
						</Box>

						<Row gap="0.25rem" sx={{ marginLeft: "auto" }}>
							<PlanPrice>{plan.price.value.toLocaleString()}</PlanPrice>
							<PlanTerm>/</PlanTerm>
							<PlanTerm>{plan.price.y}</PlanTerm>
						</Row>
					</Box>
					<Divider
						sx={{
							borderColor: "#e4e4e4",
							marginLeft: "-8px",
							marginRight: "-8px",
						}}
					/>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							justifyContent: "space-between",
							gap: "30px",
							marginTop: "24px",
						}}
					>
						<Box sx={{ textAlign: "center" }}>
							<CustomButton
								onClick={() => buttonProps.onChoose(alias)}
								disabled={buttonProps.disabled ?? false}
								sx={{
									width: "100%",
								}}
								variant={buttonProps.variant ?? "contained"}
							>
								{buttonProps.text}
							</CustomButton>
						</Box>
					</Box>
					<Box
						sx={{
							my: 2,
							display: "flex",
							flexDirection: "column",
							gap: "16px",
						}}
					>
						<PlanProperties
							icon={<HistoryToggleOff />}
							title="Permanent Limits"
							advantages={plan.permanentLimits}
							showLastDivider={true}
						/>
						<PlanProperties
							icon={<Update />}
							title="Monthly Limits"
							advantages={plan.monthlyLimits}
							showLastDivider={true}
						/>
						<PlanProperties
							icon={<CardGiftcard />}
							title="Gifted Funds"
							advantages={plan.giftedFunds}
							showLastDivider={false}
						/>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};
