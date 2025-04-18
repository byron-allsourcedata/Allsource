import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import PlaylistRemoveIcon from "@mui/icons-material/PlaylistRemove";

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

  const renderLabeledValue = (label: string, value: string | number) => {
    const isInclude = label.includes("Include Names");
    const isExclude = label.includes("Exclude Names");

    const isLookalike = Math.random() > 0.5;

    const bgColor = isLookalike
      ? "rgba(224, 176, 5, 0.2)"
      : "rgba(80, 82, 178, 0.2)";
    const textColor = isLookalike
      ? "rgba(224, 176, 5, 1)"
      : "rgba(80, 82, 178, 1)";
    const icon = isInclude ? (
      <PlaylistAddIcon sx={{ fontSize: 20, mr: 0.25 }} />
    ) : isExclude ? (
      <PlaylistRemoveIcon sx={{ fontSize: 16, mr: 0.5 }} />
    ) : null;

    return (
      <Box key={label} flex={1} mb={1}>
        <Typography
          className="dashboard-card-text"
          sx={{
            display: "flex",
            alignItems: "center",
            textWrap: "nowrap",
          }}
        >
          {icon}
          {label}
        </Typography>

        {typeof value === "string" && (isInclude || isExclude) ? (
          <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
            {value.split(",").map((item, index) => (
              <Box
                key={index}
                sx={{
                  backgroundColor: bgColor,
                  color: `${textColor} !important`,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: "12px",
                  fontWeight: 500,
                  maxWidth: "100%",
                  wordBreak: "break-word",
                }}
              >
                {item.trim()}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography
            sx={{
              fontWeight: 400,
              fontFamily: "Roboto",
              fontSize: "12px",
              textWrap: "wrap",
              maxWidth: "100%",
              mt: 0.5,
            }}
          >
            {typeof value === "number" ? value.toLocaleString() : value}
          </Typography>
        )}
      </Box>
    );
  };

  const renderSection = (
    sectionData: Record<string, string | number>,
    isCreatedType: boolean
  ) => {
    const entries = Object.entries(sectionData).filter(([key, value]) => {
      if (["id", "chain_ids"].includes(key)) return false;
      if (typeof value === "number") return true;
      if (typeof value === "string") return value.trim() !== "";
      return false;
    });

    const nameEntry = entries.find(([label]) =>
      ["Name", "Audience Name"].includes(label)
    );
    const otherEntries = entries.filter(
      ([label]) => !["Name", "Audience Name"].includes(label)
    );

    if (isCreatedType) {
      return (
        <Box
          sx={{
            width: "100%",
            justifyContent: "space-between",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {nameEntry && (
            <Box mb={2}>
              <Typography className="dashboard-card-text">Name</Typography>
              <Typography
                className="dashboard-card-heading"
                sx={{ textWrap: "wrap", maxWidth: "100%" }}
              >
                {typeof nameEntry[1] === "number"
                  ? nameEntry[1].toLocaleString()
                  : nameEntry[1]}
              </Typography>
            </Box>
          )}

          {Array.from({ length: Math.ceil(otherEntries.length / 2) }).map(
            (_, i) => {
              const pair = otherEntries.slice(i * 2, i * 2 + 2);
              return (
                <Box
                  key={i}
                  display="flex"
                  gap={2}
                  mb={1}
                  sx={{ width: "100%" }}
                >
                  {pair.map(([label, value]) =>
                    renderLabeledValue(label, value)
                  )}
                </Box>
              );
            }
          )}
        </Box>
      );
    }

    const allEntries = nameEntry ? [nameEntry, ...otherEntries] : otherEntries;

    return allEntries.map(([label, value]) => {
      const isInclude = label.includes("Include Names");
      const isExclude = label.includes("Exclude Names");

      const isLookalike = Math.random() > 0.5;

      const bgColor = isLookalike
        ? "rgba(224, 176, 5, 0.2)"
        : "rgba(80, 82, 178, 0.2)";
      const textColor = isLookalike
        ? "rgba(224, 176, 5, 1)"
        : "rgba(80, 82, 178, 1)";
      const icon = isInclude ? (
        <PlaylistAddIcon sx={{ fontSize: 16, mr: 0.5 }} />
      ) : isExclude ? (
        <PlaylistRemoveIcon sx={{ fontSize: 16, mr: 0.5 }} />
      ) : null;

      return (
        <Box key={label} mb={1}>
          <Typography
            className="dashboard-card-text"
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: isInclude || isExclude ? bgColor : undefined,
              color: isInclude || isExclude ? textColor : undefined,
              p: isInclude || isExclude ? "2px 6px" : undefined,
              borderRadius: isInclude || isExclude ? 1 : undefined,
            }}
          >
            {icon}
            {label}
          </Typography>
          <Typography
            className="dashboard-card-heading"
            sx={{
              textWrap: "wrap",
              maxWidth: "100%",
              color: isInclude || isExclude ? textColor : undefined,
            }}
          >
            {typeof value === "number" ? value.toLocaleString() : value}
          </Typography>
        </Box>
      );
    });
  };

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
        padding: "1rem 1.5rem",
        maxWidth: "100%",
        minHeight: 235,
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
          <Box
            display="flex"
            flexDirection="column"
            sx={{ width: "100%", justifyContent: "space-between" }}
          >
            {renderSection(
              left,
              ["Created", "Audience Created"].includes(status)
            )}
          </Box>

          {/* Правая колонка (если есть) */}
          {right && (
            <Box display="flex" flexDirection="column">
              {renderSection(right, false)}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default InfoCard;
