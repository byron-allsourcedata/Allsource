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
import { PaymentIcon, HowToVoteIcon, DirectionsBikeIcon, AccountBoxIcon, OpenInNewIcon, AssignmentIndIcon, WorkHistoryOutlinedIcon, WorkOutlineOutlinedIcon, HistoryOutlinedIcon } from "@/icon"

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
      }}
    >
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
            Your recommended predictable fields
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
            You can configure the predictable fields that will be used for audience building yourself.
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
      </Grid>

      <Grid container sx={{ mb: 2, }}>
        <Grid container xs={12} md={4}>
          <Grid item sx={{ borderRight: "1px solid rgba(233, 233, 233, 1)", borderTopRightRadius: 3 }}>
            {/* «Recommended fields» */}
            <Button
              onClick={handleStep(0)}
              disableRipple
              sx={{
                minWidth: 0,
                textTransform: "none",
                fontFamily: "Nunito Sans",
                fontWeight: 500,
                fontSize: "14px",
                color: "rgba(56, 152, 252, 1)",
                borderTop: "2px solid rgba(56, 152, 252, 1)",
                mb: 0.5,
                "&:hover": { backgroundColor: "transparent" },
              }}
            >
              Recommended fields
            </Button>
          </Grid>
          <Grid item sx={{ borderBottom: "1px solid rgba(233, 233, 233, 1)" }}>
            {/* «Order fields» */}
            <Button
              onClick={handleStep(1)}
              disableRipple
              sx={{
                minWidth: 0,
                textTransform: "none",
                fontFamily: "Nunito Sans",
                fontWeight: 700,
                fontSize: "14px",
                color: "rgba(112, 112, 113, 1)",
                ml: 0.5,
                // borderBottom: "1px solid rgba(212, 212, 212, 1)",
                backgroundColor: "rgba(246, 248, 250, 1)",
                "&:hover": { backgroundColor: "rgba(226, 229, 232, 0.74)" },
              }}
            >
              Order fields
            </Button>
          </Grid>
          <Grid item sx={{ flexGrow: 1, borderBottom: "1px solid rgba(233, 233, 233, 1)" }}>

          </Grid>
        </Grid>
        <Grid item md={2} sx={{ textAlign: "right", borderBottom: "1px solid rgba(233, 233, 233, 1)" }}>
          <Button
            onClick={resetAll}
            disabled={atDefault}
            sx={{
              border: "1px rgba(56, 152, 252, 1) solid",
              color: "rgba(56, 152, 252, 1)",
              backgroundColor: "#FFFFFF",
              textTransform: "none",
              "&:hover": {
                border: "1px rgba(56, 152, 252, 1) solid",
                backgroundColor: "#FFFFFF",
              },
              "&.Mui-disabled": {
                opacity: 1,
                border: "1px rgba(234, 248, 221, 1) solid",
                backgroundColor: "rgba(234, 248, 221, 1)",
                color: "rgba(43, 91, 0, 1)",
              },
            }}
            variant="outlined"
          >
            <Typography fontSize="0.8rem">
              {atDefault ? `Recomended` : `Set recommended`}
            </Typography>
          </Button>
        </Grid>
        <Grid item sx={{ flexGrow: 1, borderBottom: "1px solid rgba(233, 233, 233, 1)" }}>

        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <FeatureImportanceTable
              title="Personal Profile"
              features={personalData}
              onChangeDisplayed={onPersonalChange}
              headerIcon={<AccountBoxIcon />}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <FeatureImportanceTable
              title="Financial"
              features={financialData}
              onChangeDisplayed={onFinancialChange}
              headerIcon={<PaymentIcon />}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <FeatureImportanceTable
              title="Lifestyles"
              features={lifestylesData}
              onChangeDisplayed={onLifestylesChange}
              headerIcon={<DirectionsBikeIcon />}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <FeatureImportanceTable
              title="Voter"
              features={voterData}
              onChangeDisplayed={onVoterChange}
              headerIcon={<HowToVoteIcon />}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <FeatureImportanceTable
              title="Professional Profile"
              features={professionalProfileData}
              onChangeDisplayed={onProfessionalProfileChange}
              headerIcon={<WorkOutlineOutlinedIcon />}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <FeatureImportanceTable
              title="Employment History"
              features={employmentHistoryData}
              onChangeDisplayed={onEmploymentHistoryChange}
              headerIcon={<HistoryOutlinedIcon />}
            />
          </Box>

        </Grid>
        <Grid item sx={{}} />
        <Grid item xs={12} md={5} sx={{ flexGrow: 1 }}>
          <Box sx={{ p: 0, bgcolor: "transparent" }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "Nunito Sans",
                fontWeight: 500,
                fontSize: "16px",
                lineHeight: "22.5px",
                mb: 2,
              }}
            >
              How do Lookalikes work?
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: "14px", color: "text.secondary", mb: 2 }}
            >
              When building an audience, it&aposs important to work with the
              right data. You have the flexibility to configure which
              predictable fields you want to use based on your specific
              goals. These fields might include things like age, location,
              interests, purchase behavior, or other relevant data points
              that help define your audience more precisely.
            </Typography>
            <Typography
              component="a"
              href="https://example.com"
              sx={{
                fontSize: "14px",
                color: "rgba(56, 152, 252, 1)",
                textDecoration: "underline",
                cursor: "pointer",
                display: "inline-block",
              }}
            >
              Learn more <OpenInNewIcon sx={{ fontSize: 14 }} />
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
};

export default memo(AudienceFieldsSelector);
