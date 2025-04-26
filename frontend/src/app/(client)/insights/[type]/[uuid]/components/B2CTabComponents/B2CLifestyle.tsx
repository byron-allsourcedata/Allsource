import { Box } from "@mui/material";
import { IconFillIndicator } from "../CustomChart";
import _ from "lodash";

type LifestyleData = Record<string, Record<"true" | "false", number>>;

interface B2CLifestyleProps {
  data: LifestyleData;
}

const lifestyleMap: {
  key: keyof LifestyleData;
  title: string;
  imageSrc: string;
}[] = [
  { key: "own_pets", title: "Own Pets", imageSrc: "/pets.svg" },
  { key: "cooking_interest", title: "Cooking Interest", imageSrc: "/cook.svg" },
  {
    key: "mail_order_buyer",
    title: "Mail-Order Buyer",
    imageSrc: "/mail-order.svg",
  },
  {
    key: "online_purchaser",
    title: "Online Purchaser",
    imageSrc: "/online-purchaser.svg",
  },
  {
    key: "health_and_beauty_interest",
    title: "Health And Beauty Interest",
    imageSrc: "/health_and_beauty.svg",
  },
  { key: "travel_interest", title: "Travel Interest", imageSrc: "/plains.svg" },
  {
    key: "fitness_interest",
    title: "Fitness Interest",
    imageSrc: "/fitness.svg",
  },
  { key: "book_reader", title: "Book Reader", imageSrc: "/bookreader.svg" },
  {
    key: "outdoor_interest",
    title: "Outdoor Interest",
    imageSrc: "/outdoor.svg",
  },
  { key: "diy_interest", title: "Gardening Interest", imageSrc: "/garden.svg" },
  { key: "smoker", title: "Smoker", imageSrc: "/sigarette.svg" },
  { key: "golf_interest", title: "Golf Interest", imageSrc: "/golf.svg" },
  {
    key: "beauty_cosmetic_interest",
    title: "Beauty/Cosmetic Interest",
    imageSrc: "/cosmetics.svg",
  },
];

const B2CLifestyle = ({ data }: B2CLifestyleProps) => {
  return (
    <Box
      sx={{
        padding: "1.5rem 5rem 1.5rem 2rem",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {_.chunk(lifestyleMap, 3).map((row, rowIndex) => (
        <Box key={rowIndex} sx={{ display: "flex", width: "100%", gap: 3 }}>
          {row.map(({ key, title, imageSrc }) => {
            const item = data[key];
            const trueVal = item?.true || 0;
            const falseVal = item?.false || 0;
            const total = trueVal + falseVal;
            const percentage =
              total > 0 ? Math.round((trueVal / total) * 100) : 0;

            return (
              <Box key={key} sx={{ display: "flex", width: "33%" }}>
                <IconFillIndicator
                  imageSrc={imageSrc}
                  title={title}
                  percentage={percentage}
                  labels={["Yes", "No"]}
                />
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};

export default B2CLifestyle;
