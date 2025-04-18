import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import PlaylistRemoveIcon from "@mui/icons-material/PlaylistRemove";

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

  const renderLabeledValue = (label: string, value: string | number) => {
    const isInclude = label.includes("Include");
    const isExclude = label.includes("Exclude");
    const LabelIcon = isInclude
      ? PlaylistAddIcon
      : isExclude
      ? PlaylistRemoveIcon
      : null;

    // Include / Exclude с разбором типов и цветом
    if (typeof value === "string" && (isInclude || isExclude)) {
      const parts = value.split(",").map((entry) => entry.trim());

      return (
        <Box key={label} mb={1}>
          <Box display="flex" alignItems="center" mb={0.5}>
            {LabelIcon && (
              <LabelIcon
                sx={{ fontSize: 20, mr: 0.5, color: "rgba(74, 74, 74, 1)" }}
              />
            )}
            <Typography className="dashboard-card-text">{label}</Typography>
          </Box>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {parts.map((part, i) => {
              const match = part.match(/^(.*?)\s*\((.*?)\)$/);
              const name = match?.[1] || part;
              const type = match?.[2] || "";

              const isLookalike = type.toLowerCase() === "lookalike";
              const isSource = type.toLowerCase() === "source";

              const bgColor = isLookalike
                ? "rgba(224, 176, 5, 0.2)"
                : isSource
                ? "rgba(80, 82, 178, 0.2)"
                : "rgba(0, 0, 0, 0.05)";
              const textColor = isLookalike
                ? "rgba(224, 176, 5, 1)"
                : isSource
                ? "rgba(80, 82, 178, 1)"
                : "rgba(0, 0, 0, 0.8)";

              return (
                <Box
                  key={`${name}-${i}`}
                  sx={{
                    px: 1,
                    py: 0.5,
                    backgroundColor: bgColor,
                    color: textColor,
                    borderRadius: 1,
                    fontSize: 14,
                  }}
                >
                  {name}
                </Box>
              );
            })}
          </Box>
        </Box>
      );
    }

    // Обычные значения
    return (
      <Box key={label} mb={1}>
        <Typography className="dashboard-card-text">{label}</Typography>
        <Typography
          className="dashboard-card-heading"
          sx={{ textWrap: "wrap", maxWidth: "100%" }}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </Typography>
      </Box>
    );
  };

  const renderSection = (sectionData: Record<string, string | number>) => {
    const entries = Object.entries(sectionData).filter(([key, value]) => {
      if (["id", "chain_ids"].includes(key)) return false;
      if (typeof value === "number") return true;
      if (typeof value === "string") return value.trim() !== "";
      return false;
    });

    const nameEntry = entries.find(([label]) => label === "Name");
    const otherEntries = entries.filter(([label]) => label !== "Name");

    const allEntries = nameEntry ? [nameEntry, ...otherEntries] : otherEntries;

    return allEntries.map(([label, value]) => renderLabeledValue(label, value));
  };

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
