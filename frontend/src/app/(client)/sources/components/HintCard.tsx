import React, { useState } from "react";
import { Box, Typography, Button, MobileStepper } from "@mui/material";

interface HintCardInterface {
  description: string;
  title: string;
}

interface HintCardProps {
    cards: HintCardInterface[];
    activeStep: number;
    onStepChange: (step: number) => void;
  }
  
  const HintCard: React.FC<HintCardProps> = ({ cards, activeStep, onStepChange }) => {
    const handleNext = () => {
      if (activeStep < cards.length - 1) {
        onStepChange(activeStep + 1);
      }
    };
  
    const handleBack = () => {
      if (activeStep > 0) {
        onStepChange(activeStep - 1);
      }
    };

    const currentCard = cards[activeStep];
  
    return (
      <Box
        sx={{
          position: "absolute",
          right: 7,
          maxWidth: 400,
          zIndex: 9999,
          p: 2,
          border: "1px solid #e0e0e0",
          borderRadius: 2,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          bgcolor: "white",
        }}
      >
        <Typography className="first-sub-title" mb={1}>
          {currentCard.title}
        </Typography>
        <Typography className="fiveth-sub-title" mb={2} style={{textWrap: "balance"}}>
          {currentCard.description}
        </Typography>
        <MobileStepper
          steps={cards.length}
          position="static"
          activeStep={activeStep}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "transparent",
            "& .MuiMobileStepper-dots": {
              display: "none"
            }
          }}
          backButton={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {Array.from({ length: cards.length }).map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: activeStep === index ? "#3898FC" : "#D7EAFE",
                  }}
                />
              ))}
            </Box>
          }
          nextButton={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {activeStep !== 0 && (
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  sx={{ textTransform: "none", border: "none", ":hover": { border: "none", color: "#F6FAFD" }, ":active": { color: "#BAD5F1" } }}
                >
                  <Typography className="third-sub-title" style={{color: "rgba(0, 0, 0, 0.4)"}}>Back</Typography>
                </Button>
              )}
              <Button
                className="button"
                variant="contained"
                onClick={handleNext}
                disabled={activeStep === cards.length - 1}
                sx={{ 
                  textTransform: "none",     
                  ":hover": {
                    backgroundColor: "rgba(48, 149, 250, 1)",
                  },
                  ":disabled": {
                    backgroundColor: "rgba(56, 152, 252, 0.5)",
                  },
                  "&:active": { 
                    backgroundColor: "rgba(116, 183, 253, 1)" 
                  },
                }}
              >
                <Typography className="third-sub-title" style={{ color: "#fff" }}>
                  Next
                </Typography>
              </Button>
            </Box>
          }
        />
      </Box>
    );
  };

export default HintCard;