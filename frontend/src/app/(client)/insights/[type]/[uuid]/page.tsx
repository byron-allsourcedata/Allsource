"use client";
import { Box, Typography, Button, Tabs, Tab, IconButton } from "@mui/material";
import React, { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { AxiosError } from "axios";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";
import { insightsStyle } from "./insightsStyles";

const centerContainerStyles = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  border: "1px solid rgba(235, 235, 235, 1)",
  borderRadius: 2,
  padding: 3,
  boxSizing: "border-box",
  width: "100%",
  textAlign: "center",
  flex: 1,
  "& img": {
    width: "auto",
    height: "auto",
    maxWidth: "100%",
  },
};
import { useNotification } from "@/context/NotificationContext";
import { IconFillIndicator } from "./components/CustomChart";
import { DateRangeIcon } from "@mui/x-date-pickers";
import { dashboardStyles } from "../../../dashboard/dashboardStyles";
import { TabPanel } from "@/components/TabPanel";
import StaticticsTab from "./components/StaticticsTab";
import FeatureListTable, { FeatureObject } from "./components/FeatureListTable";
import CustomTooltip from "@/components/customToolTip";

export interface CalculationResults {
  [key: string]: number;
  PersonExactAge: number;
  PersonGender: number;
  EstimatedHouseholdIncomeCode: number;
  EstimatedCurrentHomeValueCode: number;
  HomeownerStatus: number;
  HasChildren: number;
  NumberOfChildren: number;
  CreditRating: number;
  NetWorthCode: number;
  HasCreditCard: number;
  LengthOfResidenceYears: number;
  MaritalStatus: number;
  OccupationGroupCode: number;
  IsBookReader: number;
  IsOnlinePurchaser: number;
  IsTraveler: number;
  ZipCode5: number;
  ZipCode4: number;
  ZipCode3: number;
  state_name: number;
  state_city: number;
}

export interface FinancialResults extends FeatureObject {
  [key: string]: number;
  CreditScore: number;
  IncomeRange: number;
  NetWorth: number;
  CreditRating: number;
  CreditCards: number;
  BankCard: number;
  CreditCardPremium: number;
  CreditCardNewIssue: number;
  CreditLines: number;
  CreditRangeOfNewCredit: number;
  Donor: number;
  Investor: number;
  MailOrderDonor: number;
}

export interface LifestylesResults extends FeatureObject {
  [key: string]: number;
  Pets: number;
  CookingEnthusiast: number;
  Travel: number;
  MailOrderBuyer: number;
  OnlinePurchaser: number;
  BookReader: number;
  HealthAndBeauty: number;
  Fitness: number;
  OutdoorEnthusiast: number;
  TechEnthusiast: number;
  DIY: number;
  Gardening: number;
  AutomotiveBuff: number;
  GolfEnthusiasts: number;
  BeautyCosmetics: number;
  Smoker: number;
}

export interface VoterResults extends FeatureObject {
  [key: string]: number;
  PartyAffiliation: number;
  VotingPropensity: number;
  CongressionalDistrict: number;
}

export interface RealEstateResults extends FeatureObject {
  [key: string]: number;
  URN: number;
  SiteStreetAddress: number;
  SiteCity: number;
  SiteState: number;
  SiteZipCode: number;
  OwnerFullName: number;
  EstimatedHomeValue: number;
  HomeValueNumeric: number;
  Equity: number;
  EquityNumeric: number;
  MortgageAmount: number;
  MortgageDate: number;
  LenderName: number;
  PurchasePrice: number;
  PurchaseDate: number;
  OwnerOccupied: number;
  LandUseCode: number;
  YearBuilt: number;
  LotSizeSqFt: number;
  BuildingTotalSqFt: number;
  AssessedValue: number;
  MarketValue: number;
  TaxAmount: number;
}

// --- Пример «псевдо‑данных» ---
const personalData: CalculationResults = {
  PersonExactAge: 0.18,
  PersonGender: 0.12,
  EstimatedHouseholdIncomeCode: 0.22,
  EstimatedCurrentHomeValueCode: 0.1,
  HomeownerStatus: 0.05,
  HasChildren: 0.08,
  NumberOfChildren: 0.02,
  CreditRating: 0.06,
  NetWorthCode: 0.04,
  HasCreditCard: 0.03,
  LengthOfResidenceYears: 0.05,
  MaritalStatus: 0.02,
  OccupationGroupCode: 0.01,
  IsBookReader: 0.02,
  IsOnlinePurchaser: 0.25,
  IsTraveler: 0.2,
  ZipCode5: 0,
  ZipCode4: 0,
  ZipCode3: 0,
  state_name: 0,
  state_city: 0,
};

const financialData: FinancialResults = {
  CreditScore: 0.3,
  IncomeRange: 0.2,
  NetWorth: 0.15,
  CreditRating: 0.1,
  CreditCards: 0.05,
  BankCard: 0.03,
  CreditCardPremium: 0.02,
  CreditCardNewIssue: 0.01,
  CreditLines: 0.04,
  CreditRangeOfNewCredit: 0.02,
  Donor: 0.03,
  Investor: 0.02,
  MailOrderDonor: 0.03,
};

const lifestylesData: LifestylesResults = {
  Pets: 0.12,
  CookingEnthusiast: 0.08,
  Travel: 0.18,
  MailOrderBuyer: 0.1,
  OnlinePurchaser: 0.22,
  BookReader: 0.05,
  HealthAndBeauty: 0.07,
  Fitness: 0.09,
  OutdoorEnthusiast: 0.06,
  TechEnthusiast: 0.1,
  DIY: 0.04,
  Gardening: 0.03,
  AutomotiveBuff: 0.02,
  GolfEnthusiasts: 0.01,
  BeautyCosmetics: 0.02,
  Smoker: 0.01,
};

const voterData: VoterResults = {
  PartyAffiliation: 0.5,
  VotingPropensity: 0.45,
  CongressionalDistrict: 0.05,
};

const realEstateData: RealEstateResults = {
  URN: 0.05,
  SiteStreetAddress: 0.02,
  SiteCity: 0.03,
  SiteState: 0.04,
  SiteZipCode: 0.01,
  OwnerFullName: 0.02,
  EstimatedHomeValue: 0.1,
  HomeValueNumeric: 0.08,
  Equity: 0.06,
  EquityNumeric: 0.05,
  MortgageAmount: 0.04,
  MortgageDate: 0.03,
  LenderName: 0.02,
  PurchasePrice: 0.07,
  PurchaseDate: 0.03,
  OwnerOccupied: 0.05,
  LandUseCode: 0.01,
  YearBuilt: 0.02,
  LotSizeSqFt: 0.01,
  BuildingTotalSqFt: 0.01,
  AssessedValue: 0.02,
  MarketValue: 0.03,
  TaxAmount: 0.01,
};

const Insights = () => {
  const router = useRouter();
  const params = useParams();
  const type = params.type;
  const { hasNotification } = useNotification();
  const [tabIndex, setTabIndex] = useState(0);
  const [name, setName] = useState<string>("");

  const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex);
  };

  const handleSetName = (newName: string) => {
    setName(newName);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          position: "sticky",
          top: 0,
          pt: "10px",
          pr: "1.5rem",
          pl: 0,
          zIndex: 1,
          backgroundColor: "#fff",
          justifyContent: "space-between",
          width: "100%",
          "@media (max-width: 600px)": {
            flexDirection: "column",
            display: "flex",
            alignItems: "flex-start",
            zIndex: 1,
            width: "100%",
            pr: 1.5,
          },
          "@media (max-width: 440px)": {
            flexDirection: "column",
            pt: hasNotification ? "3rem" : "0.75rem",
            top: hasNotification ? "4.5rem" : "",
            zIndex: 1,
            justifyContent: "flex-start",
          },
          "@media (max-width: 400px)": {
            pt: hasNotification ? "4.25rem" : "",
            pb: "6px",
          },
        }}
      >
        <IconButton
          onClick={() => {
            router.push("/insights");
          }}
          sx={{
            ":hover": {
              backgroundColor: "transparent",
            },
            "@media (max-width: 600px)": {
              display: "none",
            },
          }}
        >
          <ArrowBackIcon sx={{ color: "#5052B2" }} />
        </IconButton>
        <Typography
          variant="h4"
          component="h1"
          className="first-sub-title"
          sx={{
            ...insightsStyle.title,
            position: "fixed",
            ml: 6,
            mt: 1,
            "@media (max-width: 600px)": {
              display: "none",
            },
          }}
        >
          {type === "sources" ? "Source" : "Lookalike"} - {name}
          <CustomTooltip title="Insights" />
        </Typography>
        <Box
          sx={{
            display: "none",
            width: "100%",
            justifyContent: "start",
            alignItems: "center",
            "@media (max-width: 600px)": {
              display: "flex",
            },
          }}
        >
          <IconButton
            onClick={() => {
              router.push("/insights");
            }}
            sx={{
              "@media (max-width: 600px)": {},
            }}
          >
            <ArrowBackIcon sx={{ color: "#5052B2" }} />
          </IconButton>
          <Typography
            variant="h4"
            component="h1"
            className="first-sub-title"
            sx={{ ...dashboardStyles.title, mb: 0 }}
          >
            {type === "sources" ? "Source" : "Lookalike"} - {name}
          </Typography>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            width: "100%",
            justifyContent: "center",
            alignItems: "start",
            "@media (max-width: 600px)": {
              width: "100%",
              mt: hasNotification ? 1 : 2,
            },
          }}
        >
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            sx={{
              textTransform: "none",
              minHeight: 0,
              alignItems: "start",
              "& .MuiTabs-indicator": {
                backgroundColor: "rgba(80, 82, 178, 1)",
                height: "1.4px",
              },
              "@media (max-width: 600px)": {
                border: "1px solid rgba(228, 228, 228, 1)",
                borderRadius: "4px",
                width: "100%",
                "& .MuiTabs-indicator": {
                  height: "0",
                },
              },
            }}
            aria-label="insights tabs"
          >
            <Tab
              className="main-text"
              sx={{
                textTransform: "none",
                padding: "4px 24px",
                flexGrow: 1,
                minHeight: "auto",
                minWidth: "120px",
                fontSize: "14px",
                fontWeight: 700,
                lineHeight: "19.1px",
                textAlign: "left",
                "&.Mui-selected": {
                  color: "rgba(80, 82, 178, 1)",
                },
                "@media (max-width: 600px)": {
                  mr: 0,
                  borderRadius: "4px",
                  "&.Mui-selected": {
                    backgroundColor: "rgba(249, 249, 253, 1)",
                    border: "1px solid rgba(220, 220, 239, 1)",
                  },
                },
              }}
              label="Statistics"
            />
            <Tab
              className="main-text"
              sx={{
                textTransform: "none",
                padding: "4px 10px",
                minHeight: "auto",
                flexGrow: 1,
                textAlign: "center",
                fontSize: "14px",
                fontWeight: 700,
                lineHeight: "19.1px",
                minWidth: "120px",
                "&.Mui-selected": {
                  color: "rgba(80, 82, 178, 1)",
                },
                "@media (max-width: 600px)": {
                  mr: 0,
                  borderRadius: "4px",
                  "&.Mui-selected": {
                    backgroundColor: "rgba(249, 249, 253, 1)",
                    border: "1px solid rgba(220, 220, 239, 1)",
                  },
                },
              }}
              label="Predictable fields"
            />
          </Tabs>
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <TabPanel value={tabIndex} index={0}>
          <StaticticsTab setName={handleSetName} />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <FeatureListTable
            title="Personal Profile"
            features={personalData}
            columnHeaders={["Field", "Importance"]}
          />
          <FeatureListTable
            title="Financial"
            features={financialData}
            columnHeaders={["Field", "Importance"]}
          />
          <FeatureListTable
            title="Lifestyles"
            features={lifestylesData}
            columnHeaders={["Field", "Importance"]}
          />
          <FeatureListTable
            title="Voter"
            features={voterData}
            columnHeaders={["Field", "Importance"]}
          />
          <FeatureListTable
            title="Real Estate"
            features={realEstateData}
            columnHeaders={["Field", "Importance"]}
          />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default Insights;
