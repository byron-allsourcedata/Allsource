import FirstTimeCards from "./FirstTimeCards";
import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import { ExternalLink } from "@/components/ExternalLink";
import { DashboardHelpCard } from "@/components/HelpCard";

type CardData = {
  title: string;
  description: string;
  icon: string;
  onClick?: () => void;
  isClickable?: boolean;
};

interface ClickableCardsProps {
  cardData: CardData[];
}

const FirstTimeScreen = ({ cardData }: ClickableCardsProps) => {
  return (
    <Box>
      <FirstTimeCards cardData={cardData} />
    </Box>
  );
};

export default FirstTimeScreen;
