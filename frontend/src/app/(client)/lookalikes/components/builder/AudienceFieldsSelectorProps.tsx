// components/AudienceFieldsSelector.tsx
"use client";

import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import type {
  CalculationResults,
  FinancialResults,
  LifestylesResults,
  VoterResults,
  RealEstateResults,
} from "@/types";
import { FeatureImportanceTable } from "./FeatureImportanceTable";

interface AudienceFieldsSelectorProps {
  calculation: CalculationResults;
  financialData: FinancialResults;
  lifestylesData: LifestylesResults;
  voterData: VoterResults;
  realEstateData: RealEstateResults;
  onPersonalChange: (keys: (keyof CalculationResults)[]) => void;
  onFinancialChange: (keys: (keyof FinancialResults)[]) => void;
  onLifestylesChange: (keys: (keyof LifestylesResults)[]) => void;
  onVoterChange: (keys: (keyof VoterResults)[]) => void;
  onRealEstateChange: (keys: (keyof RealEstateResults)[]) => void;
}

export const AudienceFieldsSelector: React.FC<AudienceFieldsSelectorProps> = ({
  calculation,
  financialData,
  lifestylesData,
  voterData,
  realEstateData,
  onPersonalChange,
  onFinancialChange,
  onLifestylesChange,
  onVoterChange,
  onRealEstateChange,
}) => (
  <Box
    sx={{
      border: "1px solid #E4E4E4",
      borderRadius: "6px",
      bgcolor: "white",
      p: 2,
      mt: 2,
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", mb: 2, ml: 1 }}>
      <Typography
        variant="h6"
        sx={{
          fontFamily: "Nunito Sans",
          fontWeight: 500,
          fontSize: "16px",
          lineHeight: "22.5px",
        }}
      >
        Step&nbsp;1
      </Typography>
      <ArrowRightAltIcon
        sx={{
          fontSize: 28,
          color: "text.disabled",
          mx: 1,
          verticalAlign: "middle",
        }}
      />
      <Typography
        variant="h6"
        sx={{
          fontFamily: "Nunito Sans",
          fontWeight: 500,
          fontSize: "16px",
          lineHeight: "22.5px",
          color: "text.disabled",
        }}
      >
        Step&nbsp;2
      </Typography>
    </Box>

    <Grid container sx={{ mb: 2 }}>
      <Grid item xs={7}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: "Nunito Sans",
            fontWeight: 500,
            fontSize: "16px",
            lineHeight: "22.5px",
            mb: 1,
            ml: 1,
          }}
        >
          Select and order predictable fields
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontSize: "14px",
            color: "text.secondary",
            mb: 1,
            ml: 1,
          }}
        >
          You can configure the predictable fields that will be used for audience
          building yourself.
        </Typography>
      </Grid>
      <Grid item xs={5}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: "Nunito Sans",
            fontWeight: 500,
            fontSize: "16px",
            lineHeight: "22.5px",
            mb: 1,
            ml: 1,
          }}
        >
          How do Lookalikes work?
        </Typography>
      </Grid>
    </Grid>

    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <FeatureImportanceTable
          title="Personal Profile"
          features={calculation}
          onChangeDisplayed={onPersonalChange}
        />
        <FeatureImportanceTable
          title="Financial"
          features={financialData}
          onChangeDisplayed={onFinancialChange}
        />
        <FeatureImportanceTable
          title="Lifestyles"
          features={lifestylesData}
          onChangeDisplayed={onLifestylesChange}
        />
        <FeatureImportanceTable
          title="Voter"
          features={voterData}
          onChangeDisplayed={onVoterChange}
        />
        <FeatureImportanceTable
          title="Real Estate"
          features={realEstateData}
          onChangeDisplayed={onRealEstateChange}
        />
      </Grid>
      <Grid item xs={12} md={1} />
      <Grid item xs={12} md={5} sx={{ borderLeft: "1px solid #E4E4E4" }}>
        <Box sx={{ p: 0, bgcolor: "transparent" }}>
          <Typography
            variant="body2"
            sx={{ fontSize: "14px", color: "text.secondary", mb: 2 }}
          >
            When building an audience, it&apos;s important to work with the right data. You
            have the flexibility to configure which predictable fields you want to use based
            on your specific goals. These fields might include things like age, location,
            interests, purchase behavior, or other relevant data points that help define
            your audience more precisely.
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontSize: "14px", color: "text.secondary", mb: 2 }}
          >
            To get started, simply click on &quot;Add More&quot; to open the full list of
            available fields. From there, you can select the ones that are most relevant to
            your campaign. The fields are usually organized into categories (such as
            demographics, behavior, engagement, etc.), so be sure to make selections within
            each category to create a well-rounded profile of your audience.
          </Typography>
          <Typography
            component="a"
            href="#"
            sx={{
              fontSize: "14px",
              color: "rgba(80, 82, 178, 1)",
              textDecoration: "underline",
              cursor: "pointer",
              display: "inline-block",
            }}
          >
            Learn more
          </Typography>
        </Box>
      </Grid>
    </Grid>
  </Box>
);
