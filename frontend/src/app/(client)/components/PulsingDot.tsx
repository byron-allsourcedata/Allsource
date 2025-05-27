import React from "react";
import { Box } from "@mui/material";
import { keyframes, styled } from "@mui/system";

interface PulsingDotComponentProps {
  toggleClick: () => void;
  rightSide?: boolean;
}

// const ripple = keyframes`
//   0% {
//     transform: scale(1);
//     opacity: 1;
//   }
//   100% {
//     transform: scale(3);
//     opacity: 0;
//   }
// `;

// const PulsingDot = styled(Box)(() => ({
//   width: "16px",
//   height: "16px",
//   backgroundColor: "#3898FC",
//   borderRadius: "50%",
//   animation: `${ripple} 1.5s infinite ease-in-out`,
// }));

const ripple = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`;

const PulsingDot: React.FC<React.ComponentProps<typeof Box>> = (props) => {
  return (
    <Box
      {...props}
      sx={{
        position: "relative",
        width: "16px",
        height: "16px",
        backgroundColor: "rgba(56, 152, 252, 1)",
        borderRadius: "50%",
        "&::before, &::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background:
            "linear-gradient(rgba(56, 152, 252, 0), rgba(56, 152, 252, 1))",
          boxShadow: "rgba(56, 152, 252, 1)",
          animation: `${ripple} 6s ease-out infinite`,
        },
        "&::after": {
          animationDelay: "2s",
        },
      }}
    />
  );
};

const PulsingDotComponent: React.FC<PulsingDotComponentProps> = ({
  toggleClick,
  rightSide,
}) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        cursor: "pointer",
        position: "absolute",
        left: !rightSide ? -7 : "auto",
        right: rightSide ? -7 : "auto",
        top: -5,
        zIndex: 9999,
      }}
    >
      <PulsingDot onClick={toggleClick} />
    </Box>
  );
};

export default PulsingDotComponent;
