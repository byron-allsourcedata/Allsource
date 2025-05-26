import React, { useEffect, useState } from "react";
import { Box, Link as MuiLink, Grid, Typography } from "@mui/material";
import { dashboardStyles } from "@/app/(client)/dashboard/dashboardStyles";
import {
  StepConfig,
  VerticalStepper,
} from "@/app/(client)/dashboard/components/VerticalStepper";
import PixelInstallation from "@/app/(client)/dashboard/components/PixelInstallation";
import VerifyPixelIntegration from "../components/VerifyPixelIntegration";
import RevenueTracking from "@/components/RevenueTracking";
import CustomTooltip from "@/components/customToolTip";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DomainVerificationOutlinedIcon from "@mui/icons-material/DomainVerificationOutlined";
import OpenInBrowserOutlinedIcon from "@mui/icons-material/OpenInBrowserOutlined";
import VerifiedIcon from "@mui/icons-material/Verified";
import DomainSelector from "@/app/(client)/dashboard/components/DomainSelector";

const GettingStartedSection: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState("");
  const [showHintVerify, setShowHintVerify] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>("");
  const [stepData, setStepData] = useState<StepConfig[]>([
    {
      label: "Choose a domain",
      status: "active",
      icon: (
        <DomainVerificationOutlinedIcon
          sx={{ color: "rgba(255, 255, 255, 1)", fontSize: "17px" }}
        />
      ),
    },
    {
      label: "Select Installation Method",
      status: "default",
      icon: (
        <OpenInBrowserOutlinedIcon
          sx={{ color: "rgba(255, 255, 255, 1)", fontSize: "17px" }}
        />
      ),
    },
    {
      label: "Verify integration",
      status: "default",
      icon: (
        <VerifiedIcon
          sx={{ color: "rgba(255, 255, 255, 1)", fontSize: "17px" }}
        />
      ),
    },
  ]);

  useEffect(() => {
    if (selectedDomain !== "") {
      setStepData((prev) => [
        { ...prev[0], status: "completed" },
        { ...prev[1], status: "active" },
        { ...prev[2], status: "default" },
      ]);
    } else {
      setStepData((prev) => [
        { ...prev[0], status: "completed" },
        { ...prev[1], status: "default" },
        { ...prev[2], status: "default" },
      ]);
    }
  }, [selectedDomain]);

  const defaultStepIcons = [
    <DomainVerificationOutlinedIcon
      key="domain-verification"
      sx={{ color: "white", fontSize: "17px" }}
    />,
    <OpenInBrowserOutlinedIcon
      key="open-in-browser"
      sx={{ color: "white", fontSize: "17px" }}
    />,
    <VerifiedIcon key="verified" sx={{ color: "white", fontSize: "17px" }} />,
  ];

  const handleInstallSelected = (
    method: "manual" | "google" | "cms" | null
  ) => {
    if (method === null) {
      const newStepData: StepConfig[] = [
        {
          label: "Choose a domain",
          status: "completed",
          icon: defaultStepIcons[0],
        },
        {
          label: "Select Installation Method",
          status: "active",
          icon: defaultStepIcons[1],
        },
        {
          label: "Verify integration",
          status: "default",
          icon: defaultStepIcons[2],
        },
      ];
      setStepData(newStepData);
    } else {
      const newStepData: StepConfig[] = [
        {
          label: "Choose a domain",
          status: "completed",
          icon: defaultStepIcons[0],
        },
        {
          label: "Select Installation Method",
          status: "completed",
          icon: defaultStepIcons[1],
        },
        {
          label: "Verify integration",
          status: "active",
          icon: defaultStepIcons[2],
        },
      ];
      setStepData(newStepData);
    }
  };

  return (
    <>
      <Grid container sx={{ height: "100%", pr: 2 }}>
        <Grid
          item
          xs={12}
          sx={{ display: { md: "none" }, overflow: "hidden" }}
        >
          <Typography
            variant="h4"
            component="h1"
            className="first-sub-title"
            sx={dashboardStyles.title}
          >
            Install Your Pixel
          </Typography>
          <VerticalStepper steps={stepData} />
          <DomainSelector
            onDomainSelected={(domain) => {
              setSelectedDomain(domain.domain);
            }}
          />
          {selectedDomain !== "" && (
            <PixelInstallation
              onInstallSelected={(method) => {
                handleInstallSelected(method);
                setShowHintVerify(true);
              }}
            />
          )}

          <VerifyPixelIntegration
            domain={selectedDomain}
            showHint={showHintVerify}
          />
        </Grid>
        <Grid
          item
          xs={12}
          lg={8}
          sx={{
            display: { xs: "none", md: "block" },
          }}
        >
          <Box sx={{}}>
            <DomainSelector
              onDomainSelected={(domain) => {
                setSelectedDomain(domain.domain);
              }}
            />
            {selectedDomain !== "" && (
              <PixelInstallation
                onInstallSelected={(method) => {
                  handleInstallSelected(method);
                  setSelectedMethod(method);
                  setShowHintVerify(true);
                }}
              />
            )}
            {selectedDomain !== "" &&
              selectedMethod !== "" &&
              selectedMethod !== null && (
                <VerifyPixelIntegration
                  domain={selectedDomain}
                  showHint={showHintVerify}
                />
              )}
          </Box>
        </Grid>

        <Grid
          item
          xs={12}
          lg={4}
          sx={{ display: { xs: "none", md: "block" },}}
        >
          <VerticalStepper steps={stepData} />
        </Grid>
      </Grid>
    </>
  );
};

export default GettingStartedSection;
