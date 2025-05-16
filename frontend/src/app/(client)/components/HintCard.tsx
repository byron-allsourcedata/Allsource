import React from "react";
import { Box, Typography, Link, IconButton } from "@mui/material";
import PulsingDotComponent from "./PulsingDot"
import { CloseIcon } from "@/icon";

interface HintCardInterface {
  description: string;
  title: string;
  linkToLoadMore: string
}

interface HintCardProps {
    card: HintCardInterface;
    isOpenSelect: boolean
    positionLeft: number
    toggleClick: () => void
  }
  
  const HintCard: React.FC<HintCardProps> = ({ card, positionLeft, toggleClick, isOpenSelect }) => {
  
    return (
      <Box sx={{position: "absolute", left: positionLeft, top: 10, width: 400}}>
        <Box
          sx={{
            visibility: isOpenSelect ? "visible" : "hidden", 
            position: "relative",
            right: 0,
            maxWidth: 400,
            zIndex: 9999,
            p: 2,
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            bgcolor: "white",
          }}
        >
          <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <Typography className="first-sub-title" mb={1}>
              {card.title}
            </Typography>
            <IconButton size="small" onClick={toggleClick}>
              <CloseIcon/>
            </IconButton>
          </Box>
          <Typography className="fiveth-sub-title" mb={2} style={{textWrap: "balance"}}>
            {card.description}
          </Typography>
          <Box sx={{display: "flex", justifyContent: "end"}}>
            <Link
              href={card.linkToLoadMore}
              underline="hover"
              className="second-sub-title"
              style={{color: "#3898FC" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more
            </Link>
          </Box>
          
        </Box>
        <PulsingDotComponent toggleClick={toggleClick}/>
      </Box>
    );
  };

export default HintCard;