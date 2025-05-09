import React from 'react';
import { useRouter } from "next/navigation";
import FirstTimeCards from "../../components/FirstTimeCards"
import {
  Box,
  Typography,
} from "@mui/material";
import { ExternalLink } from "@/components/ExternalLink";

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
    // <FirstTimeCards cardData={cardData}/>
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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "start",
        borderRadius: 2,
        pr: 1,
        boxSizing: "border-box",
        width: "100%",
        flex: 1,
        "& img": {
          width: "auto",
          height: "auto",
          maxWidth: "100%",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Typography
          variant="h5"
          className="first-sub-title"
          sx={{
            fontFamily: "Nunito Sans",
            fontSize: "24px !important",
            color: "#4a4a4a",
            fontWeight: "500 !important",
            lineHeight: "22px",
          }}
        >
          Import Your First Source
        </Typography>
        <ExternalLink href="https://example.com">
          Learn more
        </ExternalLink>
      </Box>
      <Typography
        variant="body1"
        sx={{
          mt: 1,
          fontFamily: "Nunito Sans",
          fontSize: "14px",
          color: "rgba(50, 54, 62, 1)",
          fontWeight: "400",
          lineHeight: "22px",
        }}
      >
        To begin building your audience, you'll first need to provide a data source. Create a source based on one of this types:
      </Typography>

      <Box
        sx={{
          width: "100%",
        }}
      >
        <FirstTimeCards cardData={cardData}/>
      </Box>
    </Box>
  );
};

export default FirstTimeScreen;
