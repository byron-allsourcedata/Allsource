import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import PlaylistRemoveIcon from "@mui/icons-material/PlaylistRemove";
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import Image from 'next/image';

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

const getUseCaseStyle = (status: string) => {
  switch (status.trim()) {
    case 'Postal':
      return <Image src="./postal.svg" alt="google icon" width={20} height={20} />
    case 'Google':
      return <Image src="./google-ads.svg" alt="google icon" width={20} height={20} />
    case 'Meta':
      return <Image src="./meta.svg" alt="meta icon" width={20} height={20} />
    case 'Bing':
      return <Image src="./bing.svg" alt="bing icon" width={20} height={20} />
    case 'LinkedIn':
      return <Image src="./linkedIn.svg" alt="linkedin icon" width={20} height={20} />
    case 'Tele Marketing':
      return <HeadsetMicOutlinedIcon />
    default:
      return <MailOutlinedIcon />
  }
};

const MainSectionCard: React.FC<MainSectionCardProps> = ({
  data,
  onClick,
  highlighted = false,
}) => {
  const { status, date, event_info, tabType } = data;

  const renderLabeledValue = (label: string, value: string | number) => {
    const isInclude = label.includes("Include");
    const isExclude = label.includes("Exclude");
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
        padding: "0.5rem 0.75rem 1rem",
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
          gap={2}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            width="100%"
            mb={2}
          >
            <Typography className="paragraph"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                cursor: 'pointer',
                padding: '3px 1rem',
                textOverflow: 'ellipsis',
                maxWidth: '120px',
                backgroundColor: status.includes("Synced") ? "rgba(234, 248, 221, 1)" : 'rgba(222, 237, 255, 1)',
                color: status.includes("Synced") ? "rgba(43, 91, 0, 1)!important" : 'rgba(5, 105, 226, 1) !important'
              }}>
              {status}
            </Typography>
            <Typography className="dashboard-card-text">{date}</Typography>
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
          <Box display="flex" flexDirection="column">
            {renderSection(event_info)}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MainSectionCard;
