import { Box, Typography } from "@mui/material";
import Link from "next/link";
import FeatureListTable, { FeatureObject } from "../FeatureListTable";
import { categorizeFields } from "./categorizeFields";
import { SignificantFields } from '../../page';

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

type PredictableFieldsTabProps = {
  data: SignificantFields
};

const Categories: React.FC<PredictableFieldsTabProps> = ({ data }) => {
  const categorized = categorizeFields(data);
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
          features={categorized.personal}
          columnHeaders={["Attribute name", "Predictable value"]}
          first={true}
        />
        <FeatureListTable
          title="Financial"
          features={categorized.financial}
          columnHeaders={["Attribute name", "Predictable value"]}
        />
        <FeatureListTable
          title="Lifestyles"
          features={categorized.lifestyle}
          columnHeaders={["Attribute name", "Predictable value"]}
        />
        <FeatureListTable
          title="Voter"
          features={categorized.voter}
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
