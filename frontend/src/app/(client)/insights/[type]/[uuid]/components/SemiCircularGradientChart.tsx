"use client";

import React, { useId } from "react";
import { Box, Typography } from "@mui/material";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";

type ColorStop = {
  offset: string;
  color: string;
};

type SemiCircularGradientChartProps = {
  title: string;
  percent: number;
  labelLeft: string;
  labelRight: string;
  colorStops: ColorStop[];
  rank?: number;
};

export const SemiCircularGradientChart: React.FC<
  SemiCircularGradientChartProps
> = ({ title, percent, labelLeft, labelRight, colorStops, rank }) => {
  const radius = 90;
  const strokeWidth = 20;
  const center = radius + strokeWidth / 2;
  const endAngle = 180 * (percent / 100);
  const gradientId = useId();

  return (
    <Box
      bgcolor="#fff"
      sx={{
        width: "100%",
        borderRadius: "6px",
        boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.25)",
        position: "relative",
        flexGrow: 1,
      }}
    >
      {rank !== undefined && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            display: "inline-flex",
            alignItems: "center",
            backgroundColor: "rgba(30, 136, 229, 1)",
            color: "white",
            borderTopRightRadius: "4px",
            borderBottomLeftRadius: "4px",
            px: 1.5,
            py: 0.5,
            fontFamily: "Roboto",
            fontSize: 12,
            fontWeight: 500,
            maxWidth: "100%",
            whiteSpace: "nowrap",
            ...(rank !== undefined && {
              overflow: "hidden",
              "&::before, &::after": {
                content: '""',
                position: "absolute",
                backgroundRepeat: "no-repeat",
                pointerEvents: "none",
              },
              "&::before": {
                top: 0,
                right: 0,
                height: "1px",
                width: "100%",
                backgroundImage:
                  "linear-gradient(to left, rgba(30,136,229,1) 0%, rgba(30,136,229,0) 100%)",
              },
              "&::after": {
                top: 0,
                right: 0,
                width: "1px",
                height: "100%",
                backgroundImage:
                  "linear-gradient(to bottom, rgba(30,136,229,1) 0%, rgba(30,136,229,0) 100%)",
              },
            }),
          }}
        >
          <ArrowDropUpIcon sx={{ fontSize: 16, mr: 0.5 }} />#{rank} Predictable
          field
        </Box>
      )}
      <Box
        bgcolor="#fff"
        p={2}
        sx={{
          width: "100%",
        }}
      >
        <Box
          sx={{
            width: "100%",
            justifyContent: "space-between",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography className="dashboard-card-heading">{title}</Typography>
        </Box>

        <Box display="flex" justifyContent="center" alignItems="end">
          <Box display="flex" flexDirection="column" alignItems="center" mr={2}>
            <Typography className="dashboard-card-text">{percent}%</Typography>
            <Typography className="dashboard-card-text">{labelLeft}</Typography>
          </Box>

          <svg
            width={radius * 2 + strokeWidth}
            height={radius + strokeWidth}
            viewBox={`0 0 ${radius * 2 + strokeWidth} ${radius + strokeWidth}`}
          >
            <defs>
              <linearGradient id={gradientId} gradientTransform="rotate(90)">
                {colorStops.map((stop, index) => (
                  <stop
                    key={index}
                    offset={stop.offset}
                    stopColor={stop.color}
                  />
                ))}
              </linearGradient>
            </defs>

            <path
              d={describeArc(center, center, radius, 0, 180)}
              fill="none"
              stroke="#F5FAFE"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            <path
              d={describeArc(center, center, radius, 0, endAngle)}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          </svg>

          <Box display="flex" flexDirection="column" alignItems="center" ml={2}>
            <Typography className="dashboard-card-text">
              {(100 - percent).toFixed(2)}%
            </Typography>
            <Typography className="dashboard-card-text">
              {labelRight}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 180) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}
