import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  SxProps,
  Theme,
} from '@mui/material';

export interface DemoFeedbackCardProps {
  email: string;
  backgroundSrc?: string;
  onSubmit: (answers: {
    purchaseLikelihood: string;
    aiStrategy: string;
  }) => void;
  sx?: SxProps<Theme>;
}

const DemoFeedbackCard: React.FC<DemoFeedbackCardProps> = ({
  email,
  backgroundSrc = '/demo-bg.svg',
  onSubmit,
  sx,
}) => {
  const labelTypographySx: SxProps<Theme> = {
    fontFamily: 'Nunito Sans',
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '20px',
    letterSpacing: '0%',
    color: 'rgba(0,0,0,1)',
  };

  const radioSx: SxProps<Theme> = {
    color: 'rgba(56,152,252,1)',
    '&.Mui-checked': {
      color: 'rgba(56,152,252,1)',
    },
  };
  const [purchaseLikelihood, setPurchaseLikelihood] = useState('very_likely');
  const [aiStrategy, setAiStrategy] = useState('not_yet');

  const handleSubmit = () => {
    onSubmit({ purchaseLikelihood, aiStrategy });
  };

  return (
    <Card
      sx={{
        width: "100%",
        mx: 'auto',

        p: 4,
        backgroundImage: 'url("/card_backgroundv2.svg")',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 2,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 600,
          mx: "auto",
          px: { xs: 2, sm: 4, md: 6 },
        }}
      >
        <Typography textAlign="center" variant="h5" gutterBottom>
          Thank you for requesting a demo!
        </Typography>
        <Typography textAlign="center" variant="body2" color="text.secondary" gutterBottom>
          A confirmation email will be sent shortly to{' '}
          <strong>{email}</strong>. Please check your inbox for a message from our team.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <FormControl sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontFamily: 'Nunito Sans',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '20px',
              letterSpacing: '0%',
              mb: 1,
            }}
          >
            Help Us to provide the best possible experience
          </Typography>

          <Typography sx={{
            mt: 2,
            mb: 1,
            fontSize: "14px",
            fontWeight: 500,
            letterSpacing: "0%",
            lineHeight: "20px",
            fontFamily: "Nunito Sans",
            color: "rgba(0, 0, 0, 1)",
          }}>
            How likely are you to consider Allsource for your needs?
          </Typography>
          <RadioGroup
            value={purchaseLikelihood}
            onChange={(e) => setPurchaseLikelihood(e.target.value)}
          >
            {[
              { value: 'very_likely', label: 'Very likely' },
              { value: 'possibly', label: 'Possibly' },
              { value: 'just_exploring', label: 'Just exploring' },
            ].map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                control={<Radio sx={radioSx} />}
                label={<Typography sx={labelTypographySx}>{opt.label}</Typography>}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{
            mb: 1, fontSize: "14px",
            fontWeight: 500,
            letterSpacing: "0%",
            lineHeight: "20px",
            fontFamily: "Nunito Sans",
            color: "rgba(0, 0, 0, 1)",
          }}>
            Is AI-powered audience targeting part of your current marketing strategy?
          </Typography>
          <RadioGroup
            value={aiStrategy}
            onChange={(e) => setAiStrategy(e.target.value)}
          >
            {[
              { value: 'key_focus', label: 'Yes, it’s a key focus' },
              { value: 'not_yet', label: 'Not yet, but planning to' },
              { value: 'just_researching', label: 'No, just researching' },
            ].map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                control={<Radio sx={radioSx} />}
                label={<Typography sx={labelTypographySx}>{opt.label}</Typography>}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              width: "100%",
              backgroundColor: "rgba(56,152,252,1)",
              textTransform: "none",
              padding: "10px 42px",
              fontFamily: "Nunito Sans",
              fontWeight: 600,
              fontSize: 14,
              lineHeight: "22.4px",
              color: "#fff !important",
              borderRadius: 2,
              ':hover': { backgroundColor: 'rgba(48,149,250,1)' },
            }}
          >
            Submit
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

export default DemoFeedbackCard;
