import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";

interface StatCardProps {
  title: string;
  description: string;
  size: number;
  lookalikeSize: string;
  sourceName: string;
  date: string;
  sizeLabel: string;
}

const SelectedCards: React.FC<StatCardProps> = ({
  title,
  description,
  size,
  lookalikeSize,
  sizeLabel,
  sourceName,
  date,
}) => {
  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: 4,
        padding: 2,
        minWidth: 300,
        maxWidth: "100%",
        margin: 1,
      }}
    >
      <CardContent sx={{ padding: 0.5 }}>
        <Box display="flex" justifyContent="space-between">
          <Box>
            <Typography
              className="second-sub-title"
              sx={{ fontSize: "20px !important", fontWeight: "700 !important" }}
            >
              {title}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {description}
            </Typography>
          </Box>
          <Typography className="table-data">{date}</Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" mt={2}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {size.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {sizeLabel}
            </Typography>
          </Box>
          {lookalikeSize && (
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {lookalikeSize}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Lookalike Size
              </Typography>
            </Box>
          )}
          {sourceName && (
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {sourceName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Source Name
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SelectedCards;
