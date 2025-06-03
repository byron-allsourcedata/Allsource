import React, { memo, useEffect, useState } from "react";
import { Box, Button, Grid, Typography } from "@mui/material";
import type {
  CalculationResponse,
  RecommendedByCategory,
} from "@/types";
import { FeatureImportanceTable } from "./FeatureImportanceTable";
import { PaymentIcon, HowToVoteIcon, DirectionsBikeIcon, AccountBoxIcon, OpenInNewIcon, WorkOutlineOutlinedIcon, HistoryOutlinedIcon } from "@/icon"
import { useLookalikesHints } from "../../context/LookalikesHintsContext";
import HintCard from "@/app/(client)/components/HintCard";

interface AudienceFieldsSelectorProps {
  calculatedResults?: CalculationResponse
  handleNextStep: () => void;
  currentSelection: RecommendedByCategory;
  recommendedByCategory: RecommendedByCategory;
  onFieldsChange: (selected: RecommendedByCategory) => void;
  canProcessed: boolean
  onResetSelection: () => void;
  disableResetSelection: boolean;
}

const AudienceFieldsSelector: React.FC<AudienceFieldsSelectorProps> = ({
  calculatedResults,
  handleNextStep,
  recommendedByCategory,
  onFieldsChange,
  canProcessed,
  onResetSelection,
  currentSelection,
  disableResetSelection,
}) => {
  const { lookalikesBuilderHints, cardsLookalikeBuilder, changeLookalikesBuilderHint, resetSourcesBuilderHints } = useLookalikesHints();
  const [activeStep, setActiveStep] = React.useState(0);
  const { personal, financial, lifestyle, voter, professional_profile, employment_history } = currentSelection;
  const handleResetToRecommended = () => {
    onFieldsChange(recommendedByCategory);
    onResetSelection();
  };

  useEffect(() => {
    onFieldsChange(recommendedByCategory);
  }, [
    recommendedByCategory
  ]);

  const handlePersonalChange = (keys: string[]) => {
    onFieldsChange({ ...currentSelection, personal: keys });
  };
  const handleFinancialChange = (keys: string[]) => {
    onFieldsChange({ ...currentSelection, financial: keys });
  };
  const handleLifestyleChange = (keys: string[]) => {
    onFieldsChange({ ...currentSelection, lifestyle: keys });
  };
  const handleVoterChange = (keys: string[]) => {
    onFieldsChange({ ...currentSelection, voter: keys });
  };
  const handleProfessionalChange = (keys: string[]) => {
    onFieldsChange({ ...currentSelection, professional_profile: keys });
  };
  const handleEmploymentChange = (keys: string[]) => {
    onFieldsChange({ ...currentSelection, employment_history: keys });
  };

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
        position: "relative"
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
          <Grid item sx={{ borderRight: "1px solid rgba(233, 233, 233, 1)", borderLeft: "1px solid rgba(233, 233, 233, 1)", borderTopRightRadius: 3, borderTopLeftRadius: 3 }}>
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
            <Box
              sx={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <HintCard
                card={cardsLookalikeBuilder.predictable}
                positionTop={15}
                positionLeft={130}
                rightSide={false}
                isOpenBody={lookalikesBuilderHints.predictable.showBody}
                toggleClick={() =>
                  changeLookalikesBuilderHint("predictable", "showBody", "toggle")
                }
                closeClick={() =>
                  changeLookalikesBuilderHint("predictable", "showBody", "close")
                }
              />
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
                  backgroundColor: "rgba(246, 248, 250, 1)",
                  "&:hover": { backgroundColor: "rgba(226, 229, 232, 0.74)" },
                }}
              >
                Order fields
              </Button>
            </Box>
          </Grid>
          <Grid item sx={{ flexGrow: 1, borderBottom: "1px solid rgba(233, 233, 233, 1)" }}>
          </Grid>
        </Grid>
        <Grid item md={2} sx={{ textAlign: "right", borderBottom: "1px solid rgba(233, 233, 233, 1)" }}>
          <Button
            onClick={handleResetToRecommended}
            disabled={disableResetSelection}
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
              {disableResetSelection ? `Recommended` : `Set recommended`}
            </Typography>
          </Button>
        </Grid>
        <Grid item sx={{ flexGrow: 1, borderBottom: "1px solid rgba(233, 233, 233, 1)" }}>

        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          {calculatedResults && (
            <>
              <Box sx={{ mb: 2, position: "relative" }}>
                <FeatureImportanceTable
                  title="Personal Profile"
                  currentFeatures={personal}
                  features={calculatedResults.audience_feature_importance_b2c.personal}
                  onChangeDisplayed={handlePersonalChange}
                  headerIcon={<AccountBoxIcon />}
                  initialFeatures={recommendedByCategory.personal}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <FeatureImportanceTable
                  title="Financial"
                  features={calculatedResults.audience_feature_importance_b2c.financial}
                  initialFeatures={recommendedByCategory.financial}
                  currentFeatures={financial}
                  onChangeDisplayed={handleFinancialChange}
                  headerIcon={<PaymentIcon />}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <FeatureImportanceTable
                  title="Lifestyles"
                  features={calculatedResults.audience_feature_importance_b2c.lifestyle}
                  initialFeatures={recommendedByCategory.lifestyle}
                  currentFeatures={lifestyle}
                  onChangeDisplayed={handleLifestyleChange}
                  headerIcon={<DirectionsBikeIcon />}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <FeatureImportanceTable
                  title="Voter"
                  features={calculatedResults.audience_feature_importance_b2c.voter}
                  initialFeatures={recommendedByCategory.voter}
                  currentFeatures={voter}
                  onChangeDisplayed={handleVoterChange}
                  headerIcon={<HowToVoteIcon />}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <FeatureImportanceTable
                  title="Professional Profile"
                  features={calculatedResults.audience_feature_importance_b2b.professional_profile}
                  initialFeatures={recommendedByCategory.professional_profile}
                  currentFeatures={professional_profile}
                  onChangeDisplayed={handleProfessionalChange}
                  headerIcon={<WorkOutlineOutlinedIcon />}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <FeatureImportanceTable
                  title="Employment History"
                  features={calculatedResults.audience_feature_importance_b2b.employment_history}
                  initialFeatures={recommendedByCategory.employment_history}
                  currentFeatures={employment_history}
                  onChangeDisplayed={handleEmploymentChange}
                  headerIcon={<HistoryOutlinedIcon />}
                />
              </Box>

            </>
          )}
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
              When building an audience, it&apos;s important to work with the
              right data. You have the flexibility to configure which
              predictable fields you want to use based on your specific
              goals. These fields might include things like age, location,
              interests, purchase behavior, or other relevant data points
              that help define your audience more precisely.
            </Typography>
            <Typography
              component="a"
              href="https://allsourceio.zohodesk.com/portal/en/kb/articles/lookalikes"
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
