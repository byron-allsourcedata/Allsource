import React, { useMemo } from "react";
import {
  Box,
  Grid,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export type FeatureObject = Record<string, number>;

interface Props<T extends FeatureObject> {
  features: T;
  title?: string;
  columnHeaders?: [string, string];
}

const formatKey = (k: string) =>
  k
    .replace(/_/g, " ")
    .replace(/(?!^)([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

function FeatureListTable<T extends FeatureObject>({
  features,
  title,
  columnHeaders = ["Field", "Importance"],
}: Props<T>) {
  const theme = useTheme();

  const allPairs = useMemo(
    () =>
      Object.entries(features)
        .map(([k, v]) => [k as keyof T, v] as [keyof T, number])
        .sort((a, b) => b[1] - a[1]),
    [features]
  );

  const renderContent = () => (
    <Box sx={{ pt: 2, px: 2, pb: 2 }}>
      <Grid
        container
        alignItems="center"
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 1,
          mb: 1,
        }}
      >
        <Grid item xs={8}>
          <Typography
            className="black-table-header"
            sx={{
              fontWeight: "500 !important",
              color: "rgba(32, 33, 36, 1) !important",
            }}
          >
            {columnHeaders[0]}
          </Typography>
        </Grid>
        <Grid item xs={4} textAlign="left">
          <Typography
            className="black-table-header"
            sx={{
              fontWeight: "500 !important",
              color: "rgba(32, 33, 36, 1) !important",
            }}
          >
            {columnHeaders[1]}
          </Typography>
        </Grid>
      </Grid>

      {allPairs.map(([k, v]) => (
        <Grid
          container
          key={String(k)}
          alignItems="center"
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            py: 1,
          }}
        >
          <Grid item xs={8}>
            <Typography className="black-table-header">
              {formatKey(String(k))}
            </Typography>
          </Grid>
          <Grid item xs={4} textAlign="left">
            <Typography className="black-table-header">
              {(v * 100).toFixed(1)}%
            </Typography>
          </Grid>
        </Grid>
      ))}
    </Box>
  );

  return title ? (
    <Accordion disableGutters elevation={0} sx={{ mb: 2, width: "100%" }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          flexDirection: "row-reverse",
          px: 2,
          py: 1,
        }}
      >
        <Grid container alignItems="center" sx={{ width: "100%" }}>
          <Grid item xs>
            <Typography variant="body2">{title}</Typography>
          </Grid>
        </Grid>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>{renderContent()}</AccordionDetails>
    </Accordion>
  ) : (
    <Box sx={{ width: "100%", mb: 2 }}>{renderContent()}</Box>
  );
}

export default FeatureListTable;
