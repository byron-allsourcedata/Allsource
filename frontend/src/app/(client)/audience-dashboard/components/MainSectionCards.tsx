import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

interface CardData {
  id: string;
  chain_ids: string[];
  status: string;
  date: string;
  event_info: Record<string, string | number>;
  tabType: string;
}

interface MainSectionCardProps {
  data: CardData;
  onClick?: () => void;
  highlighted?: boolean;
}

const getStatusColor = (status: string, tabType?: string): string => {
  if (status.includes("Audience")) return "rgba(110, 193, 37, 1)";
  if (status.includes("Lookalike")) return "rgba(224, 176, 5, 1)";
  if (status.includes("Data")) return "rgba(5, 105, 226, 1)";
  if (tabType) {
    if (tabType.includes("Lookalikes")) return "rgba(224, 176, 5, 1)";
    if (tabType.includes("Smart")) return "rgba(110, 193, 37, 1)";
    if (tabType.includes("Data")) return "rgba(5, 105, 226, 1)";
    if (tabType.includes("Source")) return "rgba(80, 82, 178, 1)";
  }
  return "";
};

const MainSectionCard: React.FC<MainSectionCardProps> = ({
  data,
  onClick,
  highlighted = false,
}) => {
  const { status, date, event_info, tabType } = data;
  const color = getStatusColor(status, tabType);

  const renderSection = (sectionData: Record<string, string | number>) =>
    Object.entries(sectionData)
      .filter(([key, value]) => {
        if (["id", "chain_ids"].includes(key)) return false;
        if (typeof value === "number") return true;
        if (typeof value === "string") return value.trim() !== "";
        return false;
      })
      .map(([label, value]) => (
        <Box key={label} mb={1}>
          <Typography className="dashboard-card-text">{label}</Typography>
          <Typography className="dashboard-card-heading">
            {typeof value === "number" ? value.toLocaleString() : value}
          </Typography>
        </Box>
      ));

  return (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: 2,
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
        padding: "1rem 1.5rem",
        maxWidth: "100%",
        border: highlighted ? `2px solid rgba(5, 105, 226, 1)` : "transparent",
        transition: "border 0.2s ease",
        cursor: "pointer",
        "&:hover": {
          border: `1px solid rgba(5, 105, 226, 1)`,
          transition: "none",
        },
      }}
    >
      <CardContent
        sx={{
          p: 0,
          "&:last-child": {
            paddingBottom: 0,
          },
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexDirection="column"
          mb={2}
          gap={2}
        >
          <Box
            width="100%"
            display="flex"
            alignItems="end"
            justifyContent="end"
          >
            <Typography className="dashboard-card-text">{date}</Typography>
          </Box>
          <Box
            width="100%"
            display="flex"
            alignItems="center"
            justifyContent="start"
          >
            <FiberManualRecordIcon sx={{ fontSize: 12, color, mr: 1 }} />
            <Typography className="dashboard-card-heading">{status}</Typography>
          </Box>
        </Box>

        {/* Content */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          {/* Левая колонка */}
          <Box display="flex" flexDirection="column">
            {renderSection(event_info)}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MainSectionCard;
