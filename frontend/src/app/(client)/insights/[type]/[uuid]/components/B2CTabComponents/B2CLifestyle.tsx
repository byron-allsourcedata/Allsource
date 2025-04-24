import { TabPanel } from "@/components/TabPanel";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { useState } from "react";
import { IconFillIndicator } from "../CustomChart";
import { GradientBarChart } from "../GradientHorizontalBarChart";
import { VerticalGradientBarChart } from "../VerticalGradientBarChart";
import { SemiCircularGradientChart } from "../SemiCircularGradientChart";
import { PieChartWithLegend } from "../CircularChart";
import { MultiIconFillIndicator } from "../MultiIconChart";

const B2CLifestyle = () => {
  return (
    <Box>
      <Box
        sx={{
          padding: "1.5rem 5rem 1.5rem 2rem",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 3 }}
        >
          <Box sx={{ display: "flex", width: "33%" }}>
            <IconFillIndicator
              imageSrc="/pets.svg"
              title="Own Pets"
              percentage={73}
              labels={["Yes", "No"]}
            />
          </Box>

          <Box sx={{ display: "flex", width: "33%" }}>
            <IconFillIndicator
              imageSrc="/cook.svg"
              title="Cooking Interest"
              percentage={65}
              labels={["Yes", "No"]}
            />
          </Box>

          <Box sx={{ display: "flex", width: "33%" }}>
            <IconFillIndicator
              imageSrc="/mail-order.svg"
              title="Mail-Order Buyer"
              percentage={52}
              labels={["Yes", "No"]}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 3 }}
        >
          <Box sx={{ display: "flex", width: "33%" }}>
            <IconFillIndicator
              imageSrc="/online-purchaser.svg"
              title="Online Purchaser"
              percentage={64}
              labels={["Yes", "No"]}
            />
          </Box>

          <Box sx={{ display: "flex", width: "33%" }}>
            <IconFillIndicator
              imageSrc="/health_and_beauty.svg"
              title="Health And Beauty Interest"
              percentage={84}
              labels={["Yes", "No"]}
            />
          </Box>

          <Box sx={{ display: "flex", width: "33%" }}>
            <IconFillIndicator
              imageSrc="/plains.svg"
              title="Travel Interest"
              percentage={52}
              labels={["Yes", "No"]}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 3 }}
        >
          <Box sx={{ display: "flex", width: "33%" }}>
            <IconFillIndicator
              imageSrc="/fitness.svg"
              title="Fitness Interest"
              percentage={42}
              labels={["Yes", "No"]}
            />
          </Box>

          <Box sx={{ display: "flex", width: "33%" }}>
            <IconFillIndicator
              imageSrc="/bookreader.svg"
              title="Book Reader"
              percentage={91}
              labels={["Yes", "No"]}
            />
          </Box>

          <Box sx={{ display: "flex", width: "33%" }}>
            <IconFillIndicator
              imageSrc="/outdoor.svg"
              title="Outdoor Interest"
              percentage={45}
              labels={["Yes", "No"]}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 3 }}
        >
          <Box sx={{ display: "flex", width: "33%" }}>
            <IconFillIndicator
              imageSrc="/garden.svg"
              title="Gardening Interest"
              percentage={35}
              labels={["Yes", "No"]}
            />
          </Box>
          <Box sx={{ display: "flex", width: "33%" }}>
            <IconFillIndicator
              imageSrc="/sigarette.svg"
              title="Smoker"
              percentage={35}
              labels={["Yes", "No"]}
            />
          </Box>

          <Box sx={{ display: "flex", width: "33%" }}>
            <IconFillIndicator
              imageSrc="/golf.svg"
              title="Golf Interest"
              percentage={39}
              labels={["Yes", "No"]}
            />
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", flexDirection: "row", width: "100%", gap: 3 }}
        >
          <Box sx={{ display: "flex", width: "33%" }}>
            <IconFillIndicator
              imageSrc="/cosmetics.svg"
              title="Beauty/Cosmetic Interest"
              percentage={66}
              labels={["Yes", "No"]}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default B2CLifestyle;
