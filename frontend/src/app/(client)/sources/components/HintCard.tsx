import React, { useState } from "react";
import { Box, Typography, Button, MobileStepper } from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";

interface HintCardProps {
    title: string;
    description: string;
    steps: number;
    activeStep: number;
    onStepChange: (step: number) => void;
  }
  
  const HintCard: React.FC<HintCardProps> = ({ title, description, steps, activeStep, onStepChange }) => {
    const handleNext = () => {
      if (activeStep < steps - 1) {
        onStepChange(activeStep + 1);
      }
    };
  
    const handleBack = () => {
      if (activeStep > 0) {
        onStepChange(activeStep - 1);
      }
    };
  
    return (
      <Box
        sx={{
          maxWidth: 400,
          p: 3,
          border: "1px solid #e0e0e0",
          borderRadius: 2,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          bgcolor: "white",
        }}
      >
        <Typography className="first-sub-title" mb={2}>
          {title}
        </Typography>
        <Typography className="fiveth-sub-title" mb={3}>
          {description}
        </Typography>
        <MobileStepper
          variant="dots"
          steps={steps}
          position="static"
          activeStep={activeStep}
          sx={{
            justifyContent: "space-between",
            bgcolor: "transparent",
            ".MuiMobileStepper-dotActive": {
              bgcolor: "#1976d2",
            },
          }}
          nextButton={
            <Button size="small" onClick={handleNext} disabled={activeStep === steps - 1}>
              Next
              <KeyboardArrowRight />
            </Button>
          }
          backButton={
            <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
              <KeyboardArrowLeft />
              Back
            </Button>
          }
        />
      </Box>
    );
  };

export default HintCard;