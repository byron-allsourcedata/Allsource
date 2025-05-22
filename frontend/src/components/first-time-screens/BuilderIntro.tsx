// LookalikeBuilderIntro.tsx
import React, { FC } from 'react'
import { Box, SxProps, Theme } from '@mui/material'
import StepperTimeline, { Step } from './StepperTimeline'
import AudienceSynergyPreview from './AudienceSynergyPreview'
import { PreviewConfig } from '@/types/first_time_screens'

export interface BuilderIntroProps extends PreviewConfig {
  steps: Step[]
  sx?: SxProps<Theme>
}

const BuilderIntro: FC<BuilderIntroProps> = ({
  steps,
  sx,
  ...previewProps 
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      width: '100%',
      ...sx,
    }}
  >
    <StepperTimeline steps={steps} />

    <AudienceSynergyPreview {...previewProps} />
  </Box>
)

export default BuilderIntro
