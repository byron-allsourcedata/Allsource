import React from "react";
import { Box } from "@mui/material";
import { keyframes, styled } from "@mui/system";

interface PulsingDotComponentProps {
    toggleClick: () => void
  }

const ripple = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(3);
    opacity: 0;
  }
`;

const PulsingDot = styled(Box)(() => ({
  width: "16px",
  height: "16px",
  backgroundColor: "#3898FC",
  borderRadius: "50%",
  animation: `${ripple} 1.5s infinite ease-in-out`,
}));


const PulsingDotComponent: React.FC<PulsingDotComponentProps> = ({ toggleClick }) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        cursor: "pointer",  
        position: "absolute",
        left: -7,
        top: -5,
        zIndex: 9999
      }}
    >
      <PulsingDot onClick={toggleClick}/>
    </Box>
  );
};

export default PulsingDotComponent;
