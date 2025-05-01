import React, { useState } from "react";
import { Box, Typography, Stack, IconButton, Collapse } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

type BarData = {
  label: string;
  percent: number;
};

type GradientBarChartProps = {
  title: string;
  data: BarData[];
  gradientColor?: string;
  sortByPercent?: boolean;
  rank?: number;
};

const getGradient = (relativePercent: number, gradientColor: string) => {
  const opacity = 0.4 + 0.6 * relativePercent;

  if (gradientColor.startsWith("rgba(")) {
    const rgbValues = gradientColor.match(/\d+/g)?.slice(0, 3).join(", ");
    return `rgba(${rgbValues}, ${opacity})`;
  }

  return `rgba(${gradientColor}, ${opacity})`;
};

export const GradientBarChart: React.FC<GradientBarChartProps> = ({
  title,
  data,
  gradientColor = "98, 178, 253",
  sortByPercent = true,
  rank
}) => {
  const [expanded, setExpanded] = useState(false);
  const sortedData = sortByPercent
    ? [...data].sort((a, b) => b.percent - a.percent)
    : data;
  const maxPercent = Math.max(...sortedData.map((d) => d.percent)) || 1;

  const visibleData = expanded
    ? sortedData.slice(0, 20)
    : sortedData.slice(0, 5);

  return (
    <Box
      p={2}
      bgcolor="#fff"
      sx={{
        width: "100%",
        borderRadius: "6px",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
      }}
    >
      <Box sx={{
        width: "100%",
        justifyContent: 'space-between',
        display: 'flex',
        flexDirection: 'row',
        mb: 2
      }}>
        <Typography className="dashboard-card-heading">
          {title}
        </Typography>
        {rank !== undefined && (
          <Typography
            component="span"
            sx={{
              fontSize: 12,
              ml: 1,
              color: "#888",
              verticalAlign: "middle",
            }}
          >
            #{rank}
          </Typography>
        )}
      </Box>

      <Stack spacing={1}>
        {visibleData.map(({ label, percent }, index) => {
          const relative = percent / maxPercent;

          return (
            <Box key={index}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography
                  className="dashboard-card-text"
                  sx={{ color: "rgba(66, 66, 66, 1)", fontWeight: 400 }}
                >
                  {label}
                </Typography>
                <Typography
                  className="dashboard-card-text"
                  sx={{ color: "rgba(66, 66, 66, 1)", fontWeight: 400 }}
                >
                  {percent}%
                </Typography>
              </Box>
              <Box
                height={24}
                borderRadius={2}
                sx={{
                  width: `${percent}%`,
                  backgroundColor: getGradient(relative, gradientColor),
                  transition: "background 0.3s ease",
                }}
              />
            </Box>
          );
        })}
      </Stack>

      {sortedData.length > 5 && (
        <Box mt={2} display="flex" justifyContent="center">
          <IconButton onClick={() => setExpanded((prev) => !prev)} size="small">
            <Typography sx={{ fontSize: 14, mr: 0.5 }}>
              {expanded ? "Show Less" : "Show More"}
            </Typography>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      )}
    </Box>
  );
};
