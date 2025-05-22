import React, { useState, useEffect } from "react";
import { Box, Typography, Link, IconButton, Backdrop } from "@mui/material";
import PulsingDotComponent from "./PulsingDot"
import { CloseIcon } from "@/icon";

interface HintCardInterface {
  description: string;
  title: string;
  linkToLoadMore: string
}

interface HintCardProps {
    card: HintCardInterface;
    positionLeft: number
    positionTop?: number
    rightSide?: boolean
    isOpenBody?: boolean
    toggleClick: () => void
    closeClick?: () => void
  }
  
  const HintCard: React.FC<HintCardProps> = ({ card, positionLeft, positionTop, toggleClick, closeClick, isOpenBody, rightSide }) => {
    const [showHint, setShowHint] = useState(false);

    useEffect(() => { 
      const timer = setTimeout(() => setShowHint(true), 2000);
      return () => clearTimeout(timer);
    }, []);
  
    return (
      <> 
        <Backdrop open={isOpenBody ?? true} onClick={closeClick} sx={{ zIndex: 1, color: "#fff", backgroundColor: "transparent"}} />
        <Box sx={{position: "absolute", left: positionLeft, top: positionTop ?? 10, width: 400}}>
          {showHint &&  
            <Box
              sx={{
                visibility: isOpenBody ? "visible" : "hidden", 
                position: "relative",
                right: 0,
                maxWidth: 400,
                zIndex: 9999,
                p: 2,
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                boxShadow: "0 2px 4px #00000026",
                bgcolor: "#fff",
              }}
            >
              <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                <Typography className="first-sub-title" mb={1}>
                  {card.title}
                </Typography>
                <IconButton size="small" onClick={closeClick ?? toggleClick}>
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
          }
          <PulsingDotComponent toggleClick={toggleClick} rightSide={rightSide}/>
        </Box>
      </>
    );
  };

export default HintCard;