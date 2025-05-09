import FirstTimeCards from "../../components/FirstTimeCards";
import React from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { ExternalLink } from "@/components/ExternalLink";
import CloseIcon from "@mui/icons-material/Close";
import LegendToggleOutlinedIcon from "@mui/icons-material/LegendToggleOutlined";
import AllInboxOutlinedIcon from "@mui/icons-material/AllInboxOutlined";
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

const FirstTimeScreen = ({ cardData }: ClickableCardsProps) => {
  const router = useRouter();
  const navigateToSourcePage = () => {
    router.push("./sources");
  };
  return (
    <Box>
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="center"
        sx={{ mt: 0, pr: 2, width: "100%" }}
      >
        {/* Left Section */}
        <Grid item xs={12} md={6}>
          <Card
            variant="outlined"
            onClick={navigateToSourcePage}
            sx={{
              backgroundColor: "transparent",
              boxShadow: "none",
              cursor: "pointer",
              ":hover": {
                backgroundColor: "rgba(232, 239, 255, 0.4)",
                border: "1px solid rgba(1, 113, 248, 0.5)",
                "& .fiveth-sub-title": { color: "rgba(21, 22, 25, 1)" },
              },
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography className="first-sub-title">
                  Install Pixel
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  <Typography
                    className="table-data"
                    sx={{
                      color: "rgba(43, 91, 0, 1) !important",
                      fontSize: "14px !important",
                      backgroundColor: "rgba(234, 248, 221, 1) !important",
                      padding: "4px 12px",
                      borderRadius: "4px",
                    }}
                  >
                    Recommended
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  height: 140,
                  backgroundColor: "#f0f4ff",
                  backgroundImage: "url(./pixel.svg)",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  borderRadius: 2,
                }}
              />
              <Typography className="description">
                It will automatically collect visitor information from your
                website.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Section */}
        <Grid item xs={12} md={5.75}>
          <Card
            variant="outlined"
            onClick={navigateToSourcePage}
            sx={{
              backgroundColor: "transparent",
              boxShadow: "none",
              cursor: "pointer",
              ":hover": {
                backgroundColor: "rgba(232, 239, 255, 0.4)",
                border: "1px solid rgba(1, 113, 248, 0.5)",
                "& .fiveth-sub-title": { color: "rgba(21, 22, 25, 1)" },
              },
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Typography className="first-sub-title">
                Import Source from CSV file
              </Typography>

              <Box
                sx={{
                  height: 140,
                  backgroundColor: "#f0f4ff",
                  backgroundImage: "url(./audience.svg)",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  borderRadius: 2,
                }}
              />
              <Typography className="description">
                Otherwise, you can upload a CSV file containing your existing
                customer data.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FirstTimeScreen;
