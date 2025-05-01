import React, { useMemo, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Button,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

export type FeatureObject = Record<string, number>;

interface Props<T extends FeatureObject> {
  features: T;
  title?: string;
  columnHeaders?: [string, string];
  first?: boolean;
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
  first,
}: Props<T>) {
  const theme = useTheme();
  const [showAll, setShowAll] = useState(false);

  const allPairs = useMemo(
    () =>
      Object.entries(features)
        .map(([k, v]) => [k as keyof T, v] as [keyof T, number])
        .sort((a, b) => b[1] - a[1]),
    [features]
  );

  const visiblePairs = showAll ? allPairs : allPairs.slice(0, 5);

  const renderContent = () => {
    if (allPairs.length === 0) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No fields selected
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ pt: 2, px: 2 }}>
        <Grid
          container
          alignItems="center"
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            pb: 1,
            mb: 1,
          }}
        >
          <Grid item xs={9}>
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
          <Grid item xs={3} textAlign="left">
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

        {visiblePairs.map(([k, v], index) => (
          <Grid
            container
            key={String(k)}
            alignItems="center"
            sx={{
              borderBottom:
                index !== visiblePairs.length - 1
                  ? `1px solid ${theme.palette.divider}`
                  : "none",
              py: 1,
            }}
          >
            <Grid item xs={9}>
              <Typography className="black-table-header">{formatKey(String(k))}</Typography>
            </Grid>
            <Grid item xs={3} textAlign="left">
              <Typography className="black-table-header">{(v * 100).toFixed(1)}%</Typography>
            </Grid>
          </Grid>
        ))}

        {allPairs.length > 5 && (
          <Box sx={{ textAlign: "center", mt: 1 }}>
            <IconButton sx={{ borderRadius: 1, padding: 0 }} onClick={() => setShowAll((s) => !s)} size="small">
              <Typography sx={{ fontSize: 14, mr: 0.5, borderRadius: 0 }}>
                {showAll ? "Show Less" : `Show More (${allPairs.length - 5})`}
              </Typography>
              {showAll ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        )}
      </Box>
    );
  };

  return title ? (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        mb: 2,
        width: "100%",
        borderTop: first ? "none" : `1px solid ${theme.palette.divider}`,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ flexDirection: "row-reverse", px: 2, py: 1 }}
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
