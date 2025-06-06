import React from "react";
import { Box, Typography, Button, Divider, styled } from "@mui/material";

import { PlanProperties } from "./Properties";
import { CardGiftcard, HistoryToggleOff, Update } from "@mui/icons-material";
import { Plan } from "../plans";
import { Row } from "@/components/Row";
import { PlanButton } from "./PlanButton";

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
    onChoose: (alias: string) => void;
}> = ({ plan, activePlanTitle, tabValue, onChoose, activePlanPeriod }) => {
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
                padding: "30px 24px",
                border: "1px solid #e4e4e4",
                borderRadius: "4px",
                boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
                height: "100%",
                position: "relative",
                width: "320px",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 2,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <PlanTitle>{plan.title}</PlanTitle>
                </Box>

                <Row gap="0.25rem">
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
                    <PlanButton
                        isActive={false}
                        label={"Current Plan"}
                        onClick={() => onChoose(alias)}
                    />
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
    );
};
