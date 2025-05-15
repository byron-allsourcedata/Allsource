import { Box, Step, StepLabel, Stepper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";

type StepStatus = "completed" | "default" | "active";

export interface StepConfig {
  label: string;
  status: StepStatus;
  icon: React.ReactNode;
}

interface VerticalStepperProps {
  steps: StepConfig[];
}

const StepIconWrapper = styled("div")<{
  completed: boolean;
}>(({ completed }) => ({
  width: 24,
  height: 24,
  borderRadius: "50%",
  backgroundColor: completed
    ? "rgba(56, 152, 252, 1)"
    : "rgba(231, 231, 231, 1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

export const VerticalStepper: React.FC<VerticalStepperProps> = ({ steps }) => {
  return (
    <Box
      sx={{
        border: "1px solid rgba(231, 231, 233, 1)",
        p: 3,
        borderRadius: "4px",
        ml: 2,
        backgroundColor: "rgba(255, 255, 255, 1)",
      }}
    >
      <Typography className="second-sub-title" mb={2}>
        Installation steps
      </Typography>
      <Stepper
        orientation="vertical"
        nonLinear
        sx={{
          backgroundColor: "transparent",
        }}
      >
        {steps.map((step, index) => (
          <Step
            key={index}
            active={step.status === "active"}
            completed={step.status === "completed"}
          >
            <StepLabel
              icon={
                <StepIconWrapper
                  completed={
                    step.status === "completed" || step.status === "active"
                  }
                >
                  {step.icon}
                </StepIconWrapper>
              }
              sx={{
                color:
                  step.status === "active"
                    ? "rgba(56, 152, 252, 1) !important"
                    : step.status === "completed"
                    ? "rgba(0, 0, 0, 1) !important"
                    : "rgba(82, 82, 82, 1) !important",
                "& .MuiStepLabel-label": {
                  fontFamily: "Nunito Sans",
                  fontSize: "14px",
                  fontWeight: 400,
                  color:
                    step.status === "active"
                      ? "rgba(56, 152, 252, 1) !important"
                      : step.status === "completed"
                      ? "rgba(0, 0, 0, 1) !important" // Чёрный
                      : "rgba(82, 82, 82, 1) !important", // Серый
                },
              }}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};
