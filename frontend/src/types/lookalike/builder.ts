export type FeatureObject = Record<string, number>;

export interface Props<T extends FeatureObject> {
    features: T;
    title: string;
    onChangeDisplayed?: (selected: (keyof T)[]) => void;
    columnHeaders?: [string, string];
}

export interface Field {
    id: string;
    name: string;
    value: string;
}

export interface LookalikeFieldsGridProps {
    fields: Field[];
    onOrderChange?: (newOrder: Field[]) => void;
}

export interface TableData {
    id: string;
    name: string;
    target_schema: string;
    source: string;
    type: string;
    source_target_schema: string;
    created_date: string;
    created_by: string;
    number_of_customers: number;
    matched_records: number;
}

export interface LookalikeData {
    id: string;
    lookalike_name: string;
    source: string;
    type: string;
    size_progress: number;
    size: number;
    source_target_schema: string;
    lookalike_size: string;
    created_date: string;
    created_by: string;
}

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

export interface CalculationResponse {
    count_matched_persons: number;
    audience_feature_importance: CalculationResults;
}
