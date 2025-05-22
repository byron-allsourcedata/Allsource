import React from 'react'
import { Box, Typography, SxProps, Theme } from '@mui/material'

export interface Step {
  title: string
  subtitle: string
}

export interface StepperTimelineProps {
  steps: Step[]
  sx?: SxProps<Theme>
}

const StepperTimeline: React.FC<StepperTimelineProps> = ({ steps, sx }) => {
  return (
    <Box
      sx={{
        border: '1px solid rgba(56, 152, 252, 1)',
        borderRadius: 1,
        p: 2,
        ...sx,
      }}
    >
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1

        return (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              mb: isLast ? 0 : 3,
            }}
          >
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mr: 2,
              }}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  bgcolor: 'rgba(56, 152, 252, 0.1)',  
                  color: 'rgba(56, 152, 252, 1)',  
                  borderRadius: 1,
                  display: 'flex',
                  fontSize: "24px",
                  lineHeight: "22px",
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontFamily: "Nunito Sans"
                }}
              >
                {idx + 1}
              </Box>
              {!isLast && (
                <Box
                  sx={{
                    width: 2,
                    flexGrow: 1,
                    bgcolor: 'rgba(31,78,121,0.2)',
                    mt: 1,
                    borderRadius: 1,
                  }}
                />
              )}
            </Box>

            {/* Правая колонка с текстом */}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: 'Nunito Sans',
                  fontWeight: 600,
                  fontSize: '16px',
                }}
              >
                {step.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'Nunito Sans',
                  color: 'rgba(50,54,62,0.6)',
                  mt: 0.5,
                }}
              >
                {step.subtitle}
              </Typography>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

export default StepperTimeline
