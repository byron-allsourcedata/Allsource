import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export type FeatureObject = Record<string, number>;

interface Props<T extends FeatureObject> {
  features: T;
  title: string;
  onChangeDisplayed?: (selected: (keyof T)[]) => void;
  columnHeaders?: [string, string];
}

const formatKey = (k: string) =>
  k
    .replace(/_/g, " ")
    .replace(/(?!^)([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

function FeatureImportanceTable<T extends FeatureObject>({
  features,
  title,
  onChangeDisplayed,
  columnHeaders = ["Field", "Importance"],
}: Props<T>) {
  const theme = useTheme();
  
  // Prepare sorted pairs descending
  const allPairs = useMemo(() => {
    return Object.entries(features)
      .map(([k, v]) => [k as keyof T, v] as [keyof T, number])
      .sort((a, b) => b[1] - a[1]);
  }, [features]);

  // Determine non-zero pairs and max selectable count
  const nonZeroPairs = allPairs.filter(([, v]) => v > 0);
  const maxSelectable = Math.min(allPairs.length, 14);

  // Initialize selected only from non-zero, up to maxSelectable
  const initialSelected = useMemo(
    () => nonZeroPairs.slice(0, maxSelectable).map(([k]) => k),
    [nonZeroPairs, maxSelectable]
  );

  const [selectedKeys, setSelectedKeys] = useState<(keyof T)[]>(initialSelected);

  // Notify parent on change
  useEffect(() => {
    onChangeDisplayed?.(selectedKeys);
  }, [selectedKeys, onChangeDisplayed]);

  // Toggle checkbox
  const onOptionToggle = (key: keyof T) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Header text color based on any selected
  const headerColor = selectedKeys.length > 0 ? 'rgba(80, 82, 178, 1)' : theme.palette.text.disabled;

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: "#E4E4E4",
        borderRadius: 1,
        mb: 0,
        "&:not(:last-child)": { mb: 0 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          flexDirection: "row-reverse",
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
              flexBasis: 155,
              maxWidth: 155,
              flexShrink: 0,
              textAlign: "left",
            }}
          >
            <Typography variant="body1" sx={{ color: headerColor }}>
              {`${selectedKeys.length}/${maxSelectable} fields selected`}
            </Typography>
          </Grid>
          <Grid item sx={{ ml: "auto" }} />
        </Grid>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        <Box sx={{ pt: 2, px: 2, pb: 0 }}>
          {/* Column headers */}
          <Grid
            container
            alignItems="center"
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

          {/* Data rows */}
          {allPairs.map(([k, v]) => {
            const checked = selectedKeys.includes(k);
            const displayValue = `${(v * 100).toFixed(1)}%`;

            return (
              <Grid
                container
                key={String(k)}
                alignItems="center"
                columnSpacing={1}
                sx={{
                  p: "4px 16px",
                  borderBottom: "1px solid #E4E4E4",
                  maxWidth: 600,
                }}
              >
                <Grid item sx={{ width: 40, flexShrink: 0 }}>
                  <Checkbox
                    checked={checked}
                    onChange={() => onOptionToggle(k)}
                    size="small"
                    sx={{
                      fontSize: '12px',
                      '&.Mui-checked': {
                        color: 'rgba(80, 82, 178, 1)',
                      },
                    }}
                  />
                </Grid>
                <Grid item sx={{ flexBasis: 350, maxWidth: 350, flexShrink: 0 }}>
                  <Typography variant="body2">{formatKey(String(k))}</Typography>
                </Grid>
                <Grid item sx={{ flexBasis: 120, maxWidth: 120, flexShrink: 0 }}>
                  <Typography variant="body2">{displayValue}</Typography>
                </Grid>
                <Grid item sx={{ ml: 'auto' }} />
              </Grid>
            );
          })}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

export default FeatureImportanceTable;
