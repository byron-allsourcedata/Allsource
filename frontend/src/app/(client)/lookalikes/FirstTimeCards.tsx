import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
} from "@mui/material";

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

const FirstTimeCards = ({ cardData }: ClickableCardsProps) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: 2,
        padding: `16px 0 16px ${cardData[0].isClickable ? "4px" : "0px"}`,
      }}
    >
      {cardData.map((card, index) => (
        <Card
          key={index}
          sx={{
            backgroundColor: "transparent",
            boxShadow: card.isClickable ? "0px 0px 4px rgba(0, 0, 0, 0.3)" : 0,
            borderColor: card.isClickable
              ? "rgba(237, 237, 237, 1)"
              : "inherit",
          }}
        >
          <CardActionArea
            onClick={card.onClick}
            sx={{ pointerEvents: !card.isClickable ? "none" : "inherit" }}
          >
            <CardContent>
              <Typography
                className="fiveth-sub-title"
                sx={{
                  marginBottom: 2,
                  color: "rgba(21, 22, 25, 1) !important",
                  fontSize: "14px !important",
                  transition: "color 0.2s ease",
                  fontWeight: "600 !important",
                }}
              >
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
                  marginBottom: 2,
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

export default FirstTimeCards;
