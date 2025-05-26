import React, { FC } from "react";
import { Box, SxProps, Theme } from "@mui/material";
import StepperTimeline, { Step } from "./StepperTimeline";
import AudienceSynergyPreview, { AudienceSynergyPreviewProps } from "./AudienceSynergyPreview";

export interface BuilderIntroProps {
  steps: Step[];
  previewProps: AudienceSynergyPreviewProps;
  sx?: SxProps<Theme>;
}

const BuilderIntro: FC<BuilderIntroProps> = ({
  steps,
  sx,
  previewProps,
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: 4,
      width: "100%",
      ...sx,
    }}
  >
    <AudienceSynergyPreview {...previewProps} />

    <StepperTimeline steps={steps} />
  </Box>
);

export default BuilderIntro;
