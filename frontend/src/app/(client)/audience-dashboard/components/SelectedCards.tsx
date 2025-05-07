import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import PlaylistRemoveIcon from "@mui/icons-material/PlaylistRemove";
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import Image from 'next/image';

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

const getUseCaseStyle = (status: string) => {
  switch (status.trim()) {
    case 's3':
      return <Image src="./s3.svg" alt="s3 icon" width={20} height={20} />
    case 'google_ads':
      return <Image src="./google-ads.svg" alt="google icon" width={20} height={20} />
    case 'mailchimp':
      return <Image src="./mailchimp-icon.svg" alt="mailchimp icon" width={20} height={20} />
    case 'sales_force':
      return <Image src="./salesforce-icon.svg" alt="sales_force icon" width={20} height={20} />
    case 'hubspot':
      return <Image src="./hubspot.svg" alt="hubspot icon" width={20} height={20} />
    case 'bing_ads':
      return <Image src="./bingads-icon.svg" alt="bing_ads icon" width={20} height={20} />
    case 'sendlane':
      return <Image src="./sendlane-icon.svg" alt="sendlane icon" width={20} height={20} />
    case 'mailchimp':
      return <Image src="./mailchimp-icon.svg" alt="mailchimp icon" width={20} height={20} />
    case 'meta':
      return <Image src="./meta-icon.svg" alt="meta icon" width={20} height={20} />
    default:
      return <MailOutlinedIcon />
  }
};

const InfoCard: React.FC<{ data: CardData }> = ({ data }) => {
  const { status, date, left, right, tabType } = data;
  const color = getStatusColor(status, tabType);

  const renderLabeledValue = (label: string, value: string | number) => {
    const isInclude = label.includes("Included");
    const isExclude = label.includes("Excluded");
    const LabelIcon = isInclude
      ? PlaylistAddIcon
      : isExclude
        ? PlaylistRemoveIcon
        : null;


    if ((label === "Use Case" || label === "Destination") && typeof value === "string") {
      return (
        <Box key={label} mb={0.5}>


          <Typography className="dashboard-card-text">
            {label}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', width: '100%', gap: 0.25 }}>
            <Box>
              {getUseCaseStyle(value)}
            </Box>
            <Typography className="dashboard-card-heading">

              {value}
            </Typography>
          </Box>
        </Box>
      );
    }

    if (typeof value === "string" && (isInclude || isExclude)) {
      const parts = value.split(",").map((entry) => entry.trim());

      return (
        <Box>
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
              const bgColor = isLookalike
                ? "rgba(224, 176, 5, 0.2)"
                : "rgba(80, 82, 178, 0.2)";
              const textColor = isLookalike
                ? "rgba(224, 176, 5, 1)"
                : "rgba(80, 82, 178, 1)";

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
      <Box>
        <Typography className="dashboard-card-text">{label}</Typography>
        <Typography className="dashboard-card-heading">
          {typeof value === "number" ? value.toLocaleString() : value}
        </Typography>
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
            gap: 1,
          }}
        >
          {nameEntry && (
            <Box mb={2}>
              <Typography className="dashboard-card-text">Name</Typography>
              <Typography
                className="dashboard-card-heading"
                sx={{ textWrap: "wrap", maxWidth: "100%", mb: 0 }}
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
                  justifyContent="space-between"
                  sx={{ width: "100%", gap: 2 }}
                >
                  {pair.map(([label, value]) => (
                    <Box key={label} sx={{ width: "50%" }}>
                      {renderLabeledValue(label, value)}
                    </Box>
                  ))}
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
      const isUseCase = label.includes("Use Case")
      const isDestination = label.includes("Destination")

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

      const iconDestination =
        (isUseCase || isDestination) && typeof value === "string" ? (
          <Box mr={0.5}>{getUseCaseStyle(value)}</Box>
        ) : null;

      return (
        <Box key={label} mb={1} sx={{ width: '100%' }}>
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
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', width: '100%', gap: 0.25 }}>
            {iconDestination}
            <Typography className="dashboard-card-heading"
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                maxWidth: "100%",
                color: isInclude || isExclude ? textColor : undefined,
              }}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </Typography>
          </Box>
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
        minHeight: "auto",
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
              ["Created", "Audience Created", "Data Sync Finished"].includes(
                status
              )
            )}
          </Box>

          {/* Правая колонка (если есть) */}
          {right && (
            <Box display="flex" flexDirection="column" sx={{ width: "40%", justifyContent: 'start', alignItems: 'start' }}>
              {renderSection(right, false)}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default InfoCard;
