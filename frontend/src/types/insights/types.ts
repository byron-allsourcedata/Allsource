export type PercentageMap = Record<string, any>;
export type BooleanDistribution = Record<"true" | "false", number>;
export type FieldRankMap = Record<string, number>;
export type SignificantFields = Record<string, number>;
export type FeatureObject = Record<string, number>;

// B2C

export interface FinancialInfo {
  income_range: PercentageMap;
  credit_score_range: PercentageMap;
  credit_cards: PercentageMap;
  net_worth_range: PercentageMap;
  number_of_credit_lines: PercentageMap;
  bank_card: PercentageMap;
  mail_order_donor: PercentageMap;
  credit_card_premium: PercentageMap;
  credit_card_new_issue: PercentageMap;
  donor: PercentageMap;
  investor: PercentageMap;
  credit_range_of_new_credit: PercentageMap;
}

export interface PersonalInfo {
  gender: PercentageMap;
  state: PercentageMap;
  religion: PercentageMap;
  age: PercentageMap;
  ethnicity: PercentageMap;
  languages: PercentageMap;
  education_level: PercentageMap;
  have_children: PercentageMap;
  marital_status: PercentageMap;
  homeowner: PercentageMap;
}

export type VoterInfo = {
  congressional_district: PercentageMap;
  political_party: PercentageMap;
  voting_propensity: PercentageMap;
};

export type LifestyleData = Record<string, Record<"true" | "false", number>>;

// B2B

export type ProfessionalInfo = {
  job_location: PercentageMap;
  current_company_name: PercentageMap;
  job_level: PercentageMap;
  current_job_title: PercentageMap;
  job_duration: PercentageMap;
  primary_industry: PercentageMap;
  company_size: PercentageMap;
  annual_sales: PercentageMap;
  department: PercentageMap;
  homeowner: PercentageMap;
};

export type EducationInfo = {
  institution_name: PercentageMap;
  post_graduation_time: PercentageMap;
  degree: PercentageMap;
};

export type EmploymentInfo = {
  job_location: PercentageMap;
  number_of_jobs: PercentageMap;
  company_name: PercentageMap;
  job_tenure: PercentageMap;
  job_title: PercentageMap;
};

export type B2BData = {
  professional_profile: ProfessionalInfo;
  education: EducationInfo;
  employment_history: EmploymentInfo;
};

export type B2CData = {
  personal_info: PersonalInfo;
  financial: FinancialInfo;
  lifestyle: LifestyleData;
  voter: VoterInfo;
};

export type AudienceInsightsStatisticsResponse = {
  b2b: B2BData;
  b2c: B2CData;
  name: string;
  audience_type: string;
  significant_fields: SignificantFields;
};

// Predictable Fields

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
