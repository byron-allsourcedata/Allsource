// components/USMap.tsx
import { Box, Typography, Tooltip } from "@mui/material";
import { useMemo } from "react";
import usMap from "./us-map.svg";

type StateData = {
  [key: string]: number; // example: { NE: 0.45, KS: 0.25 }
};

type Props = {
  statePercentages: StateData;
};

export const USMap = ({ statePercentages }: Props) => {
  const getFillColor = (stateCode: string) => {
    const percent = statePercentages[stateCode] || 0;
    return interpolateColor(percent);
  };

  return (
    <Box position="relative" width="100%" maxWidth={800}>
      <svg viewBox="0 0 960 600" width="100%" height="auto">
        {Object.entries(statePaths).map(([stateCode, pathData]) => (
          <Tooltip
            key={stateCode}
            title={`${stateCode}: ${Math.round(
              (statePercentages[stateCode] || 0) * 100
            )}%`}
          >
            <path
              d={pathData}
              fill={getFillColor(stateCode)}
              stroke="#fff"
              strokeWidth={1}
              style={{ cursor: "pointer" }}
            />
          </Tooltip>
        ))}
      </svg>
    </Box>
  );
};

const statePaths: { [key: string]: string } = {
  NE: "M200,150 L250,150 L250,200 L200,200 Z", // заменяется настоящим path из SVG
  KS: "M250,200 L300,200 L300,250 L250,250 Z",
  OK: "M250,250 L300,250 L300,300 L250,300 Z",
  TX: "M250,300 L300,300 L300,350 L250,350 Z",
  // ...и так далее
};

const interpolateColor = (percentage: number) => {
  const start = [199, 228, 255];
  const end = [2, 103, 198];

  const r = Math.round(start[0] + (end[0] - start[0]) * percentage);
  const g = Math.round(start[1] + (end[1] - start[1]) * percentage);
  const b = Math.round(start[2] + (end[2] - start[2]) * percentage);

  return `rgb(${r}, ${g}, ${b})`;
};
