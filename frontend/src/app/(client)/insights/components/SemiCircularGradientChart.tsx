"use client";

import React, { useId } from "react";
import { Box, Typography } from "@mui/material";

type ColorStop = {
  offset: string; // например "11.88%"
  color: string; // например "#62B2FD"
};

type SemiCircularGradientChartProps = {
  title: string;
  percent: number;
  labelLeft: string;
  labelRight: string;
  colorStops: ColorStop[]; // ✅ заменили colorGradient
};

export const SemiCircularGradientChart: React.FC<
  SemiCircularGradientChartProps
> = ({ title, percent, labelLeft, labelRight, colorStops }) => {
  const radius = 90;
  const strokeWidth = 20;
  const center = radius + strokeWidth / 2;
  const endAngle = 180 * (percent / 100);
  const gradientId = useId(); // 👈 уникальный id

  return (
    <Box p={2} borderRadius={2} boxShadow={2} bgcolor="#fff">
      <Typography className="dashboard-card-heading" mb={3}>
        {title}
      </Typography>

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
                <stop key={index} offset={stop.offset} stopColor={stop.color} />
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
            {100 - percent}%
          </Typography>
          <Typography className="dashboard-card-text">{labelRight}</Typography>
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
