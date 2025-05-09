import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card, CardActionArea, CardContent,
} from "@mui/material";
import { sourcesStyles } from "../sourcesStyles";
import Image from "next/image";
import { useRouter } from "next/navigation";

type CardData = {
  title: string;
  description: string;
  icon: string;
  onClick?: () => void;
  isClickable?: boolean;
};

interface ClickableCardsProps {
  cardData: CardData[];
}

const ClickableCards = ({cardData}: ClickableCardsProps) => {

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: 2,
        padding: 2,
      }}
    >
      {cardData.map((card, index) => (
        <Card key={index} sx={{ boxShadow: card.isClickable ? 3 : 0, borderColor: card.isClickable ? "rgba(237, 237, 237, 1)" : "inherit" }}>
          <CardActionArea onClick={card.onClick} sx={{ pointerEvents: !card.isClickable ? "none" : "inherit" }}>
            <CardContent>
              <Typography className="fiveth-sub-title" sx={{ marginBottom: 2 }}>
                {card.title}
              </Typography>
              <Box
                  sx={{
                    height: 140,
                    backgroundColor: "#f0f4ff",
                    backgroundImage: `url(${card.icon})`,
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    borderRadius: 2,
                    marginBottom: 2
                  }}
                />
              <Typography className="fiveth-sub-title">
                {card.description}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
};

const FirstTimeScreen = () => {
  const router = useRouter();
  return (
    <Box sx={sourcesStyles.centerContainerStyles}>
      <Typography
        variant="h5"
        sx={{
          mb: 3,
          fontFamily: "Nunito Sans",
          fontSize: "20px",
          color: "#4a4a4a",
          fontWeight: "600",
          lineHeight: "28px",
        }}
      >
        Import Your First Source
      </Typography>
      <Image
        src="/no-data.svg"
        alt="No Data"
        height={250}
        width={300}
      />
      <Typography
        variant="body1"
        color="textSecondary"
        sx={{
          mt: 3,
          fontFamily: "Nunito Sans",
          fontSize: "14px",
          color: "#808080",
          fontWeight: "600",
          lineHeight: "20px",
        }}
      >
        Import your first source to generate lookalikes.
      </Typography>
      <Button
        variant="contained"
        onClick={() => router.push("/sources/builder")}
        className="second-sub-title"
        sx={{
          backgroundColor: "rgba(80, 82, 178, 1)",
          textTransform: "none",
          padding: "10px 24px",
          mt: 3,
          color: "#fff !important",
          ":hover": {
            backgroundColor: "rgba(80, 82, 178, 1)",
          },
        }}
      >
        Import Your First Source
      </Button>
    </Box>
  );
};

export default ClickableCards;
