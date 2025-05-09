import React from 'react';
import { useRouter } from "next/navigation";
import FirstTimeCards from "../../components/FirstTimeCards"

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


const FirstTimeScreen = ({cardData}: ClickableCardsProps) => {
  const router = useRouter();
  return (
    <FirstTimeCards cardData={cardData}/>
    // <Box sx={sourcesStyles.centerContainerStyles}>
    //   <Typography
    //     variant="h5"
    //     sx={{
    //       mb: 3,
    //       fontFamily: "Nunito Sans",
    //       fontSize: "20px",
    //       color: "#4a4a4a",
    //       fontWeight: "600",
    //       lineHeight: "28px",
    //     }}
    //   >
    //     Import Your First Source
    //   </Typography>
    //   <Image
    //     src="/no-data.svg"
    //     alt="No Data"
    //     height={250}
    //     width={300}
    //   />
    //   <Typography
    //     variant="body1"
    //     color="textSecondary"
    //     sx={{
    //       mt: 3,
    //       fontFamily: "Nunito Sans",
    //       fontSize: "14px",
    //       color: "#808080",
    //       fontWeight: "600",
    //       lineHeight: "20px",
    //     }}
    //   >
    //     Import your first source to generate lookalikes.
    //   </Typography>
    //   <Button
    //     variant="contained"
    //     onClick={() => router.push("/sources/builder")}
    //     className="second-sub-title"
    //     sx={{
    //       backgroundColor: "rgba(80, 82, 178, 1)",
    //       textTransform: "none",
    //       padding: "10px 24px",
    //       mt: 3,
    //       color: "#fff !important",
    //       ":hover": {
    //         backgroundColor: "rgba(80, 82, 178, 1)",
    //       },
    //     }}
    //   >
    //     Import Your First Source
    //   </Button>
    // </Box>
  );
};

export default FirstTimeScreen;
