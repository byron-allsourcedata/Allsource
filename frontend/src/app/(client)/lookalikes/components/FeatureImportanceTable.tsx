"use client";
import React, { useMemo, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  IconButton,
  Button,
  Popover,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export type FeatureObject = Record<string, number>;

interface Props<T extends FeatureObject> {
  features: T;
  orderedKeys?: (keyof T)[];
  title: string;
  total?: number;
  onChangeDisplayed?: (shown: (keyof T)[], hidden: (keyof T)[]) => void;
  columnHeaders?: [string, string];
}

const formatKey = (k: string) =>
  k
    .replace(/_/g, " ")
    .replace(/(?!^)([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

const sortPairs = <K extends PropertyKey>(arr: [K, number][]) =>
  [...arr].sort((a, b) => b[1] - a[1]);

function FeatureImportanceTable<T extends FeatureObject>({
  features,
  orderedKeys,
  title,
  total,
  onChangeDisplayed,
  columnHeaders = ["Field", "Value"],
}: Props<T>) {
  const allPairs = useMemo(() => {
    const keys = orderedKeys ?? (Object.keys(features) as (keyof T)[]);
    const pairs = keys.map((k) => [k, features[k]] as [keyof T, number]);
    return orderedKeys ? pairs : sortPairs(pairs);
  }, [features, orderedKeys]);

  const nonZero = allPairs.filter(([, v]) => v > 0);
  const zero = allPairs.filter(([, v]) => v === 0);

  const [shown, setShown] = useState(nonZero);
  const [hidden, setHidden] = useState(zero);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(true);

  const propagate = (s = shown, h = hidden) =>
    onChangeDisplayed?.(s.map((x) => x[0]), h.map((x) => x[0]));

  const removeRow = (k: keyof T) => {
    const nextShown = shown.filter(([key]) => key !== k);
    const moved = shown.find(([key]) => key === k)!;
    const nextHidden = sortPairs([...hidden, moved]);
    setShown(nextShown);
    setHidden(nextHidden);
    propagate(nextShown, nextHidden);
  };

  const addRow = (row: [keyof T, number]) => {
    const nextShown = sortPairs([...shown, row]);
    const nextHidden = hidden.filter((x) => x[0] !== row[0]);
    setShown(nextShown);
    setHidden(nextHidden);
    setAnchor(null);
    propagate(nextShown, nextHidden);
  };

  return (
    <Accordion
      disableGutters
      elevation={0}
      expanded={open}
      onChange={(_, v) => setOpen(v)}
      sx={{ borderBottom: 1,
        borderColor: "#E4E4E4",
        borderRadius: 1,
        mb: 0,              
        "&:not(:last-child)": {
          mb: 0                    
        }}}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          flexDirection: "row-reverse", // стрелка слева
          "& .MuiAccordionSummary-content": { m: 0 },
          px: 1.5,
          py: 0.75,
        }}
      >
        <Grid container alignItems="center" sx={{ maxWidth: 600 }}>
          <Grid item sx={{ width: 40, flexShrink: 0 }} />
          <Grid item sx={{ flexBasis: 350, maxWidth: 350, flexShrink: 0 }}>
            <Typography variant="body1">{title}</Typography>
          </Grid>
          <Grid
            item
            sx={{
              flexBasis: 120,
              maxWidth: 120,
              flexShrink: 0,
              textAlign: "left",
            }}
          >
            <Box sx={{ display: "inline-block", minWidth: 32, py: 0.25 }}>
              <Typography variant="body1">{shown.length} Fields</Typography>
            </Box>
          </Grid>
        </Grid>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        <Box sx={{
      pt: 2,       // 16px сверху
      px: 2,       // 16px по бокам
      pb: 0,       // НОЛЬ пикселей снизу
    }}>
          {/* Заголовки столбцов */}
          <Grid
            container
            alignItems="center"
            rowSpacing={0}
        columnSpacing={1}
            sx={{
              p: "4px 16px",
              borderBottom: "1px solid #E4E4E4",
              fontWeight: 500,
              maxWidth: 600,
            }}
          >
            <Grid item sx={{ width: 40, flexShrink: 0 }} />
            <Grid item sx={{ flexBasis: 350, maxWidth: 350, flexShrink: 0 }}>
              <Typography variant="body2" fontWeight={600}>
                {columnHeaders[0]}
              </Typography>
            </Grid>
            <Grid item sx={{ flexBasis: 120, maxWidth: 120, flexShrink: 0 }}>
              <Typography variant="body2" fontWeight={600}>
                {columnHeaders[1]}
              </Typography>
            </Grid>
            <Grid item sx={{ ml: "auto" }} />
          </Grid>

          {/* Данные */}
          {shown.map(([k, v], idx) => (
            <Grid
              container
              key={String(k)}
              alignItems="center"
              rowSpacing={0}
        columnSpacing={1}
              sx={{
                p: "4px 16px",
                borderBottom: "1px solid #E4E4E4",
                cursor: "pointer",
                maxWidth: 600,
                "&:hover": { bgcolor: "rgba(247,247,247,1)" },
                "&:hover .del": { opacity: 1 },
              }}
            >
              {/* ячейка-стрелка: всегда без нижней границы (накрыта белым) */}
              <Grid
                item
                sx={{
                  width: 40,
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "1px",
                    bgcolor: "white",
                  }}
                />
              </Grid>

              <Grid item sx={{ flexBasis: 350, maxWidth: 350, flexShrink: 0 }}>
                <Typography variant="body2">{formatKey(String(k))}</Typography>
              </Grid>
              <Grid item sx={{ flexBasis: 120, maxWidth: 102, flexShrink: 0 }}>
                <Typography variant="body2">{(v * 100).toFixed(1)}%</Typography>
              </Grid>
              <Grid item sx={{ ml: "auto" }}>
                <IconButton
                  size="small"
                  className="del"
                  sx={{ opacity: 0, transition: "opacity .2s", color: "rgba(80,82,178,1)" }}
                  onClick={() => removeRow(k)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Grid>
            </Grid>
          ))}

          {hidden.length > 0 && (
            <>
              <Button
                variant="text"
                sx={{ mt: 1,  mb: 1, textTransform: "none", textDecoration: "underline", color: "rgba(80,82,178,1)" }}
                onClick={(e) => setAnchor(e.currentTarget)}
              >
                + Add More
              </Button>
              <Popover
                open={Boolean(anchor)}
                anchorEl={anchor}
                onClose={() => setAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                slotProps={{ paper: { sx: { maxHeight: 200, overflow: "auto", p: 1 } } }}
              >
                {hidden.map((row) => (
                  <Box
                    key={String(row[0])}
                    sx={{ p: 1, cursor: "pointer", "&:hover": { bgcolor: "rgba(0,0,0,0.04)" } }}
                    onClick={() => addRow(row)}
                  >
                    {formatKey(String(row[0]))} — {(row[1] * 100).toFixed(1)}%
                  </Box>
                ))}
              </Popover>
            </>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

export default FeatureImportanceTable;
