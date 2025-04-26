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

export interface PersonalResults extends FeatureObject {
    age: number;
    gender: number;
    homeowner: number;
    length_of_residence_years: number;
    marital_status: number;
    business_owner: number;
    birth_day: number;
    birth_month: number;
    birth_year: number;
    has_children: number;
    number_of_children: number;
    religion: number;
    ethnicity: number;
    language_code: number;
    state_abbr: number;
    zip_code5: number;
} 
  

export interface FinancialResults extends FeatureObject {
    income_range: number;
    net_worth: number;
    credit_rating: number;
    credit_cards: number;
    bank_card: number;
    credit_card_premium: number;
    credit_card_new_issue: number;
    credit_lines: number;
    credit_range_of_new_credit_lines: number;
    donor: number;
    investor: number;
    mail_order_donor: number;
}
export interface LifestylesResults extends FeatureObject {
    pets: number;
    cooking_enthusiast: number;
    travel: number;
    mail_order_buyer: number;
    online_purchaser: number;
    book_reader: number;
    health_and_beauty: number;
    fitness: number;
    outdoor_enthusiast: number;
    tech_enthusiast: number;
    diy: number;
    gardening: number;
    automotive_buff: number;
    golf_enthusiasts: number;
    beauty_cosmetics: number;
    smoker: number;
}

export interface VoterResults extends FeatureObject {
    party_affiliation: number;
    congressional_district: number;
    voting_propensity: number;
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

export interface AudienceFeatureImportance {
    personal:   PersonalResults;
    financial:  FinancialResults;
    lifestyle:  LifestylesResults;
    voter:      VoterResults;
  }

  export interface CalculationResponse {
    count_matched_persons: number;
    audience_feature_importance: AudienceFeatureImportance;
  }

