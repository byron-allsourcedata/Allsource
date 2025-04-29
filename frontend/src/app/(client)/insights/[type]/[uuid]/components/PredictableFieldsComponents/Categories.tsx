import { Box, Typography } from "@mui/material";
import Link from "next/link";
import FeatureListTable, { FeatureObject } from "../FeatureListTable";

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

const Categories: React.FC = () => {
  return (
    <Box sx={{ width: "100%", display: "flex" }}>
      <Box
        sx={{
          width: "50%",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: "77vh",
          flexGrow: 1,
          borderRight: "1px solid rgba(82, 82, 82, 0.2)",
        }}
      >
        <FeatureListTable
          title="Personal Profile"
          features={personalData}
          columnHeaders={["Attribute name", "Predictable value"]}
        />
        <FeatureListTable
          title="Financial"
          features={financialData}
          columnHeaders={["Attribute name", "Predictable value"]}
        />
        <FeatureListTable
          title="Lifestyles"
          features={lifestylesData}
          columnHeaders={["Attribute name", "Predictable value"]}
        />
        <FeatureListTable
          title="Voter"
          features={voterData}
          columnHeaders={["Attribute name", "Predictable value"]}
        />
        <FeatureListTable
          title="Real Estate"
          features={realEstateData}
          columnHeaders={["Attribute name", "Predictable value"]}
        />
      </Box>
      <Box
        sx={{
          width: "50%",
          display: "flex",
          flexDirection: "column",
          padding: "0rem 3rem",
          gap: 3,
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Typography
            className="paragraph"
            sx={{ fontWeight: "600 !important" }}
          >
            Predictable Fields{" "}
          </Typography>
          <Typography className="paragraph">
            Gain data-powered insights into your audience&apos;s likely traits
            and behaviors across key life domains. Our predictive models
            estimate values for:{" "}
          </Typography>
        </Box>
        <Box
          sx={{
            gap: 1.5,
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography className="paragraph">
            - Personal Profile: Age, gender, education, household composition,
            and more.
          </Typography>
          <Typography className="paragraph">
            - Financial: Income range, credit propensity, spending habits, and
            financial priorities.
          </Typography>
          <Typography className="paragraph">
            - Lifestyle: Interests, hobbies, brand preferences, and digital
            engagement trends.
          </Typography>
          <Typography className="paragraph">
            - Voter: Political leanings, voting likelihood, and key issues of
            influence.
          </Typography>
          <Typography className="paragraph">
            - Real Estate: Homeownership status, property value estimates, and
            relocation probability.
          </Typography>
        </Box>
        <Typography className="paragraph">
          Refine targeting, reduce guesswork, and act on what truly
          resonates—powered by predictive intelligence.
        </Typography>

        <Box>
          <Link
            style={{
              color: "rgba(80, 82, 178, 1) !important",
              fontSize: "12px",
              fontFamily: "Roboto",
              width: "auto",
              display: "inline",
            }}
            href={""}
          >
            Learn more
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default Categories;
