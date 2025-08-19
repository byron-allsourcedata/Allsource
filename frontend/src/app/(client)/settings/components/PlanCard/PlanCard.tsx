import type React from "react";
import { Box, Typography, styled } from "@mui/material";
import { Title } from "./Properties";

import { PlanProperties } from "./Properties";
import {
	CardGiftcard,
	HistoryToggleOff,
	Update,
	ReduceCapacity,
	AddRounded,
} from "@mui/icons-material";
import type { Plan } from "../plans";
import { Row } from "@/components/Row";
import { CustomButton } from "@/components/ui";
import { Column } from "@/components/Column";

const PlanTitle = styled(Typography)`
    font-family: var(--font-nunito);
    font-weight: 600;
    font-size: 20px;
    line-height: 22px;
    letter-spacing: 0%;
    color: #151619;
`;

const PlanPrice = styled(Typography)`
    font-family: var(--font-nunito);
    font-weight: 600;
    font-size: 14px;
    line-height: 22px;
    letter-spacing: 0%;
    color: #151619;
`;

const PlanTerm = styled(Typography)`
    font-family: var(--font-nunito);
    font-weight: 600;
    font-size: 14px;
    line-height: 22px;
    letter-spacing: 0%;
    color: #757575;
`;

export const PlanCard: React.FC<{
	plan: Plan;
	buttonProps: {
		onChoose: (alias: string) => void;
		text: string;
		disabled?: boolean;
		variant?: "contained" | "outlined";
	};
	isRecommended?: boolean;
	isActive?: boolean;
	isPartner?: boolean;
}> = ({
	plan,
	buttonProps,
	isRecommended,
	isActive = false,
	isPartner = false,
}) => {
	const alias = "";

	return (
		<Box
			sx={{
				position: "relative",
				width: "100%",
				height: "100%",
				maxWidth: "500px",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Box
				sx={{
					visibility: isRecommended ? "visible" : "hidden",
					display: "flex",
					justifyContent: "flex-end",
					width: "100%",
					height: "auto",
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
							fontFamily: "var(--font-roboto)",
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
			<Box
				sx={{
					padding: "30px 24px",
					border: isActive
						? "1px solid rgba(56, 152, 252, 1)"
						: "1px solid rgba(237, 237, 237, 1)",
					backgroundColor: isActive ? "rgba(249, 252, 255, 1)" : "transparent",
					borderRadius: isActive ? "4px 0 4px 4px" : "4px",
					boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.08)",
					height: "100%",
					position: "relative",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "end",
						marginBottom: "24px",
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
				<Column
					sx={{
						textAlign: "center",
						gap: "16px",
						display: "flex",
						flexDirection: "column",
						marginBottom: isPartner ? "12px" : "24px",
					}}
				>
					<CustomButton
						onClick={() => buttonProps.onChoose(alias)}
						disabled={buttonProps.disabled ?? false}
						sx={{
							fontSize: "16px",
							width: "100%",
						}}
						variant={buttonProps.variant ?? "contained"}
					>
						{buttonProps.text}
					</CustomButton>
					{isPartner ? (
						<Column
							sx={{
								gap: "4px",
								textAlign: "center",
								alignItems: "center",
							}}
						>
							<Title>Your current plan limits</Title>
							<AddRounded
								sx={{
									width: "20px",
									height: "20px",
									color: "#202124",
								}}
							/>
						</Column>
					) : null}
				</Column>
				<Column
					sx={{
						gap: "16px",
						height: "100%",
					}}
				>
					{plan.permanent_limits ? (
						<PlanProperties
							icon={<HistoryToggleOff />}
							title="Permanent Limits"
							advantages={plan.permanent_limits}
							showLastDivider={true}
						/>
					) : null}
					{plan.referrals ? (
						<PlanProperties
							icon={<ReduceCapacity />}
							title="Referrals"
							advantages={plan.referrals}
							showLastDivider={true}
						/>
					) : null}
					{plan.monthly_limits ? (
						<PlanProperties
							icon={<Update />}
							title="Monthly Limits"
							advantages={plan.monthly_limits}
							showLastDivider={true}
						/>
					) : null}
					{plan.gifted_funds ? (
						<PlanProperties
							icon={<CardGiftcard />}
							title="Gifted Funds"
							advantages={plan.gifted_funds}
							showLastDivider={false}
						/>
					) : null}
					{plan.gifts ? (
						<PlanProperties
							icon={<CardGiftcard />}
							title="Gifts"
							advantages={plan.gifts}
							showLastDivider={false}
						/>
					) : null}
				</Column>
			</Box>
		</Box>
	);
};
