import React, { memo, useState } from "react";
import { Box, Button, FormControlLabel, Grid, styled, Switch, Typography } from "@mui/material";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import type {
  PersonalResults,
  FinancialResults,
  LifestylesResults,
  VoterResults,
  RealEstateResults,
  ProfessionalProfileResults,
  EmploymentHistoryResults,
} from "@/types";
import { FeatureImportanceTable } from "./FeatureImportanceTable";
import { Stepper, Step, StepLabel, StepButton } from '@mui/material';
import { ResetProvider, useResetContext } from "@/context/ResetContext";

interface AudienceFieldsSelectorProps {
  personalData?: PersonalResults;
  financialData?: FinancialResults;
  lifestylesData?: LifestylesResults;
  voterData?: VoterResults;
  professionalProfileData?: ProfessionalProfileResults;
  employmentHistoryData?: EmploymentHistoryResults;
  // realEstateData?: RealEstateResults;
  handleNextStep: () => void;
  onPersonalChange: (keys: (keyof PersonalResults)[]) => void;
  onFinancialChange: (keys: (keyof FinancialResults)[]) => void;
  onLifestylesChange: (keys: (keyof LifestylesResults)[]) => void;
  onVoterChange: (keys: (keyof VoterResults)[]) => void;
  onProfessionalProfileChange: (keys: (keyof ProfessionalProfileResults)[]) => void;
  onEmploymentHistoryChange: (keys: (keyof EmploymentHistoryResults)[]) => void;
  // onRealEstateChange: (keys: (keyof RealEstateResults)[]) => void;
  canProcessed: boolean
}

const AudienceFieldsSelector: React.FC<AudienceFieldsSelectorProps> = ({
  personalData = {} as PersonalResults,
  financialData = {} as FinancialResults,
  lifestylesData = {} as LifestylesResults,
  voterData = {} as VoterResults,
  professionalProfileData = {} as ProfessionalProfileResults,
  employmentHistoryData = {} as EmploymentHistoryResults,
  // realEstateData = {} as RealEstateResults,
  handleNextStep,
  onPersonalChange,
  onFinancialChange,
  onLifestylesChange,
  onVoterChange,
  onProfessionalProfileChange,
  onEmploymentHistoryChange,
  // onRealEstateChange,
  canProcessed
}) => {
  const { atDefault, userInteracted, resetAll } = useResetContext();
  const [activeStep, setActiveStep] = React.useState(0);
  const canProceed = canProcessed;
  const handleStep = (step: number) => () => {
    if (step === 1 && !canProceed) return;
    setActiveStep(step);
    if (step === 1) handleNextStep();
  };
  return (
  <Box
    sx={{
      border: "1px solid #E4E4E4",
      borderRadius: "6px",
      bgcolor: "white",
      p: 2,
      mt: 2,
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "600px", mb: 2, ml: 1 }}>
      <Stepper 
        activeStep={activeStep}
        nonLinear
        sx={{
          ml: 0,
        }}
        >
        {['Select fields', 'Order fields'].map((label, index) => (
          <Step key={label} sx={{pl: 0}}>
            <StepButton onClick={handleStep(index)} disabled={index === 1 && !canProceed} sx={{
                "&:after": {
                  content:'""',
                  backgroundColor: "rgba(212, 212, 212, 1)",
                  width: "80px",
                  marginLeft: "8px",
                  height: "1px",
                  display: index === 0 ? "block" : "none",
                },
              
              '& .MuiStepLabel-label': {
                color: index === activeStep ? 'rgba(51, 51, 51, 1)' : 'rgba(212, 212, 212, 1)',
                fontWeight: 500,
                fontFamily: "Nunito Sans",
                fontSize: '14px',
                },
                '& .MuiStepIcon-root': {
                color: index === 0 ? 'rgba(80, 82, 178, 1) !important' : 'rgba(212, 212, 212, 1)',
                },
            }}>
              {label}
            </StepButton>
          </Step>
        ))}
      </Stepper>
      <Button
    onClick={resetAll}
    disabled={!userInteracted && atDefault}
    sx={{
      border: "1px #5052B2 solid",
      color: "#5052B2",
      backgroundColor: "#FFFFFF",
      textTransform: "none",
      "&:hover": {
        border: "1px #5052B2 solid",
        backgroundColor: "#FFFFFF",
      },
    }}
    variant="outlined"
  >
    <Typography  fontSize="0.8rem">
      Set recommended
    </Typography>
  </Button>
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
        {!canProceed && (
            <Typography
              variant="body2"
              sx={{
                fontSize: "14px",
                color: "error.main",
                mb: 1,
                ml: 1,
              }}
            >
              Please select at least 3 fields to proceed to the next step.
            </Typography>
          )}
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
          features={personalData}
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
          title="Professional Profile"
          features={professionalProfileData}
          onChangeDisplayed={onProfessionalProfileChange}
        />
        <FeatureImportanceTable
          title="Employment History"
          features={employmentHistoryData}
          onChangeDisplayed={onEmploymentHistoryChange}
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
)};

export default memo(AudienceFieldsSelector);
