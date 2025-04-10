import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

interface CardData {
  status: string;
  date: string;
  left: Record<string, string | number>;
  right?: Record<string, string | number>;
  tabType?: string;
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

const InfoCard: React.FC<{ data: CardData }> = ({ data }) => {
  const { status, date, left, right, tabType } = data;
  const color = getStatusColor(status, tabType);

  const renderSection = (sectionData: Record<string, string | number>) =>
    Object.entries(sectionData).map(([label, value]) => (
      <Box key={label} mb={1}>
        <Typography className="dashboard-card-text">{label}</Typography>
        <Typography className="dashboard-card-heading">
          {typeof value === "number" ? value.toLocaleString() : value}
        </Typography>
      </Box>
    ));

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
        padding: "1rem 1.5rem",
        maxWidth: "100%",
        margin: 0.25,
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
          mb={1}
        >
          <Box display="flex" alignItems="center">
            <FiberManualRecordIcon sx={{ fontSize: 12, color, mr: 1 }} />
            <Typography className="dashboard-card-heading">{status}</Typography>
          </Box>
          <Typography className="dashboard-card-text">{date}</Typography>
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
            {renderSection(left)}
          </Box>

          {/* Правая колонка (если есть) */}
          {right && (
            <Box display="flex" flexDirection="column">
              {renderSection(right)}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default InfoCard;
