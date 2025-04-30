export interface CategorizedFields {
  personal: Record<string, number>;
  financial: Record<string, number>;
  lifestyle: Record<string, number>;
  voter: Record<string, number>;
  employment: Record<string, number>;
  professional: Record<string, number>;
}

export const featureCategoryMap: Record<string, keyof CategorizedFields> = {
  // personal
  age: "personal",
  gender: "personal",
  homeowner: "personal",
  length_of_residence_years: "personal",
  marital_status: "personal",
  business_owner: "personal",
  birth_day: "personal",
  birth_month: "personal",
  birth_year: "personal",
  has_children: "personal",
  number_of_children: "personal",
  religion: "personal",
  ethnicity: "personal",
  language_code: "personal",
  state: "personal",

  // financial
  income_range: "financial",
  net_worth: "financial",
  credit_rating: "financial",
  credit_cards: "financial",
  bank_card: "financial",
  credit_card_premium: "financial",
  credit_card_new_issue: "financial",
  credit_lines: "financial",
  credit_range_of_new_credit_lines: "financial",
  donor: "financial",
  investor: "financial",
  mail_order_donor: "financial",

  // lifestyle
  pets: "lifestyle",
  cooking_enthusiast: "lifestyle",
  travel: "lifestyle",
  mail_order_buyer: "lifestyle",
  online_purchaser: "lifestyle",
  book_reader: "lifestyle",
  health_and_beauty: "lifestyle",
  fitness: "lifestyle",
  outdoor_enthusiast: "lifestyle",
  tech_enthusiast: "lifestyle",
  diy: "lifestyle",
  gardening: "lifestyle",
  automotive_buff: "lifestyle",
  golf_enthusiasts: "lifestyle",
  beauty_cosmetics: "lifestyle",
  smoker: "lifestyle",

  // voter
  party_affiliation: "voter",
  congressional_district: "voter",
  voting_propensity: "voter",

  // employment_history
  job_title: "employment",
  company_name: "employment",
  start_date: "employment",
  end_date: "employment",
  location: "employment",
  job_description: "employment",

  // professional_profile
  current_job_title: "professional",
  current_company_name: "professional",
  job_start_date: "professional",
  job_duration: "professional",
  job_location: "professional",
  job_level: "professional",
  department: "professional",
  company_size: "professional",
  primary_industry: "professional",
  annual_sales: "professional",
};
