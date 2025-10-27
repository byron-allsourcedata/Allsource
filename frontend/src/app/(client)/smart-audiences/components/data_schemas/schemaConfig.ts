export type ServiceType =
	| "hubspot"
	| "mailchimp"
	| "CSV"
	| "default"
	| "meta"
	| "s3"
	| "google_ads"
	| "sales_force"
	| "go_high_level";

export type UseCase = "email" | "postal" | "tele_marketing" | "generic";
export type TargetSchema = "b2b" | "b2c" | "both";

export type FieldType =
	| "string"
	| "email"
	| "phone"
	| "date"
	| "number"
	| "url"
	| "boolean";

export interface FieldSpec {
	key: string; // canonical key (used in data_map)
	label: string; // shown to user
	type?: FieldType;
	is_constant?: boolean;
	supportedTargets?: TargetSchema[]; // if absent => applicable to all
	supportedUseCases?: UseCase[]; // if absent => applicable to all
	defaultForServices?: ServiceType[]; // used only for default rows (optional)
	requiredFor?: TargetSchema[]; // optional validation hint
	category?: "essential" | "enrichment";
}

/* -------------------------
   1) COMMON fields (always available)
   ------------------------- */
const commonFields: FieldSpec[] = [
	{ key: "email", label: "Email", type: "email" },
	{ key: "first_name", label: "First name", type: "string" },
	{ key: "last_name", label: "Last name", type: "string" },
];

/* -------------------------
   2) UseCase-specific fields
   - postal: split into home vs business so we can pick by targetSchema
   - email: extras
   - tele_marketing: extras (job_title for B2B)
   ------------------------- */

/* -------------------------------------------
   EMAIL Use Case
------------------------------------------- */
const emailB2B: FieldSpec[] = [
	// Essential
	{
		key: "first_name",
		label: "First Name",
		supportedTargets: ["b2b"],
		supportedUseCases: ["email"],
		category: "essential",
	},
	{
		key: "last_name",
		label: "Last Name",
		supportedTargets: ["b2b"],
		supportedUseCases: ["email"],
		category: "essential",
	},
	{
		key: "business_email",
		label: "Business Email",
		type: "email",
		supportedTargets: ["b2b"],
		supportedUseCases: ["email"],
		category: "essential",
	},
	{
		key: "current_company_name",
		label: "Current Company Name",
		supportedTargets: ["b2b"],
		supportedUseCases: ["email"],
		category: "essential",
	},
	// Enrichment
	{
		key: "current_job_title",
		label: "Job Title",
		supportedTargets: ["b2b"],
		supportedUseCases: ["email"],
		category: "enrichment",
	},
	{
		key: "department",
		label: "Department",
		supportedTargets: ["b2b"],
		supportedUseCases: ["email"],
		category: "enrichment",
	},
	{
		key: "primary_industry",
		label: "Industry",
		supportedTargets: ["b2b"],
		supportedUseCases: ["email"],
		category: "enrichment",
	},
	{
		key: "company_size",
		label: "Company Size",
		supportedTargets: ["b2b"],
		supportedUseCases: ["email"],
		category: "enrichment",
	},
	{
		key: "business_country",
		label: "Business Country",
		supportedTargets: ["b2b"],
		supportedUseCases: ["email"],
		category: "enrichment",
	},
	{
		key: "business_state",
		label: "Business State",
		supportedTargets: ["b2b"],
		supportedUseCases: ["email"],
		category: "enrichment",
	},
	{
		key: "business_city",
		label: "Business City",
		supportedTargets: ["b2b"],
		supportedUseCases: ["email"],
		category: "enrichment",
	},
	{
		key: "business_postal_code",
		label: "Business Postal Code",
		supportedTargets: ["b2b"],
		supportedUseCases: ["email"],
		category: "enrichment",
	},
];

const emailB2C: FieldSpec[] = [
	// Essential
	{
		key: "first_name",
		label: "First Name",
		supportedTargets: ["b2c"],
		supportedUseCases: ["email"],
		category: "essential",
	},
	{
		key: "last_name",
		label: "Last Name",
		supportedTargets: ["b2c"],
		supportedUseCases: ["email"],
		category: "essential",
	},
	{
		key: "personal_email",
		label: "Personal Email",
		type: "email",
		supportedTargets: ["b2c"],
		supportedUseCases: ["email"],
		category: "essential",
	},
	// Enrichment
	{
		key: "gender",
		label: "Gender",
		supportedTargets: ["b2c"],
		supportedUseCases: ["email"],
		category: "enrichment",
	},
	{
		key: "age",
		label: "Age",
		type: "number",
		supportedTargets: ["b2c"],
		supportedUseCases: ["email"],
		category: "enrichment",
	},
	{
		key: "home_state",
		label: "Home State",
		supportedTargets: ["b2c"],
		supportedUseCases: ["email"],
		category: "enrichment",
	},
	{
		key: "home_city",
		label: "Home City",
		supportedTargets: ["b2c"],
		supportedUseCases: ["email"],
		category: "enrichment",
	},
	{
		key: "homeowner",
		label: "Homeowner",
		type: "boolean",
		supportedTargets: ["b2c"],
		supportedUseCases: ["email"],
		category: "enrichment",
	},
	{
		key: "income_range",
		label: "Income Range",
		supportedTargets: ["b2c"],
		supportedUseCases: ["email"],
		category: "enrichment",
	},
	{
		key: "has_children",
		label: "Has Children",
		type: "boolean",
		supportedTargets: ["b2c"],
		supportedUseCases: ["email"],
		category: "enrichment",
	},
];

/* -------------------------------------------
   TELEMARKETING Use Case
------------------------------------------- */
const teleB2B: FieldSpec[] = [
	// Essential
	{
		key: "first_name",
		label: "First Name",
		supportedTargets: ["b2b"],
		supportedUseCases: ["tele_marketing"],
		category: "essential",
	},
	{
		key: "last_name",
		label: "Last Name",
		supportedTargets: ["b2b"],
		supportedUseCases: ["tele_marketing"],
		category: "essential",
	},
	{
		key: "phone_mobile1",
		label: "Phone Mobile",
		type: "phone",
		supportedTargets: ["b2b"],
		supportedUseCases: ["tele_marketing"],
		category: "essential",
	},
	{
		key: "current_company_name",
		label: "Current Company Name",
		supportedTargets: ["b2b"],
		supportedUseCases: ["tele_marketing"],
		category: "essential",
	},
	// Enrichment
	{
		key: "current_job_title",
		label: "Job Title",
		supportedTargets: ["b2b"],
		supportedUseCases: ["tele_marketing"],
		category: "enrichment",
	},
	{
		key: "department",
		label: "Department",
		supportedTargets: ["b2b"],
		supportedUseCases: ["tele_marketing"],
		category: "enrichment",
	},
	{
		key: "primary_industry",
		label: "Industry",
		supportedTargets: ["b2b"],
		supportedUseCases: ["tele_marketing"],
		category: "enrichment",
	},
	{
		key: "company_size",
		label: "Company Size",
		supportedTargets: ["b2b"],
		supportedUseCases: ["tele_marketing"],
		category: "enrichment",
	},
	{
		key: "annual_sales",
		label: "Annual Sales",
		type: "number",
		supportedTargets: ["b2b"],
		supportedUseCases: ["tele_marketing"],
		category: "enrichment",
	},
	{
		key: "business_state",
		label: "Business State",
		supportedTargets: ["b2b"],
		supportedUseCases: ["tele_marketing"],
		category: "enrichment",
	},
	{
		key: "business_city",
		label: "Business City",
		supportedTargets: ["b2b"],
		supportedUseCases: ["tele_marketing"],
		category: "enrichment",
	},
];

const teleB2C: FieldSpec[] = [
	// Essential
	{
		key: "first_name",
		label: "First Name",
		supportedTargets: ["b2c"],
		supportedUseCases: ["tele_marketing"],
		category: "essential",
	},
	{
		key: "last_name",
		label: "Last Name",
		supportedTargets: ["b2c"],
		supportedUseCases: ["tele_marketing"],
		category: "essential",
	},
	{
		key: "phone_mobile1",
		label: "Phone (Mobile 1)",
		type: "phone",
		supportedTargets: ["b2c"],
		supportedUseCases: ["tele_marketing"],
		category: "essential",
	},
	// Enrichment
	{
		key: "phone_mobile2",
		label: "Phone (Mobile 2)",
		type: "phone",
		supportedTargets: ["b2c"],
		supportedUseCases: ["tele_marketing"],
		category: "enrichment",
	},
	{
		key: "gender",
		label: "Gender",
		supportedTargets: ["b2c"],
		supportedUseCases: ["tele_marketing"],
		category: "enrichment",
	},
	{
		key: "age",
		label: "Age",
		type: "number",
		supportedTargets: ["b2c"],
		supportedUseCases: ["tele_marketing"],
		category: "enrichment",
	},
	{
		key: "home_state",
		label: "Home State",
		supportedTargets: ["b2c"],
		supportedUseCases: ["tele_marketing"],
		category: "enrichment",
	},
	{
		key: "home_city",
		label: "Home City",
		supportedTargets: ["b2c"],
		supportedUseCases: ["tele_marketing"],
		category: "enrichment",
	},
	{
		key: "home_postal_code",
		label: "Home Postal Code",
		supportedTargets: ["b2c"],
		supportedUseCases: ["tele_marketing"],
		category: "enrichment",
	},
	{
		key: "homeowner",
		label: "Homeowner",
		type: "boolean",
		supportedTargets: ["b2c"],
		supportedUseCases: ["tele_marketing"],
		category: "enrichment",
	},
	{
		key: "has_children",
		label: "Has Children",
		type: "boolean",
		supportedTargets: ["b2c"],
		supportedUseCases: ["tele_marketing"],
		category: "enrichment",
	},
	{
		key: "income_range",
		label: "Income Range",
		supportedTargets: ["b2c"],
		supportedUseCases: ["tele_marketing"],
		category: "enrichment",
	},
];

/* -------------------------------------------
   POSTAL Use Case
------------------------------------------- */
const postalB2B: FieldSpec[] = [
	{
		key: "first_name",
		label: "First Name",
		supportedTargets: ["b2b"],
		supportedUseCases: ["postal"],
		category: "essential",
	},
	{
		key: "last_name",
		label: "Last Name",
		supportedTargets: ["b2b"],
		supportedUseCases: ["postal"],
		category: "essential",
	},
	{
		key: "current_company_name",
		label: "Current Company Name",
		supportedTargets: ["b2b"],
		supportedUseCases: ["postal"],
		category: "essential",
	},
	{
		key: "business_postal_code",
		label: "Business Postal Code",
		supportedTargets: ["b2b"],
		supportedUseCases: ["postal"],
		category: "essential",
	},
	{
		key: "current_job_title",
		label: "Job Title",
		supportedTargets: ["b2b"],
		supportedUseCases: ["postal"],
		category: "enrichment",
	},
	{
		key: "business_city",
		label: "Business City",
		supportedTargets: ["b2b"],
		supportedUseCases: ["postal"],
		category: "enrichment",
	},
	{
		key: "business_state",
		label: "Business State",
		supportedTargets: ["b2b"],
		supportedUseCases: ["postal"],
		category: "enrichment",
	},
	{
		key: "business_country",
		label: "Business Country",
		supportedTargets: ["b2b"],
		supportedUseCases: ["postal"],
		category: "enrichment",
	},
	{
		key: "department",
		label: "Department",
		supportedTargets: ["b2b"],
		supportedUseCases: ["postal"],
		category: "enrichment",
	},
	{
		key: "primary_industry",
		label: "Industry",
		supportedTargets: ["b2b"],
		supportedUseCases: ["postal"],
		category: "enrichment",
	},
	{
		key: "company_size",
		label: "Company Size",
		supportedTargets: ["b2b"],
		supportedUseCases: ["postal"],
		category: "enrichment",
	},
];

const postalB2C: FieldSpec[] = [
	{
		key: "first_name",
		label: "First Name",
		supportedTargets: ["b2c"],
		supportedUseCases: ["postal"],
		category: "essential",
	},
	{
		key: "last_name",
		label: "Last Name",
		supportedTargets: ["b2c"],
		supportedUseCases: ["postal"],
		category: "essential",
	},
	{
		key: "home_postal_code",
		label: "Home Postal Code",
		supportedTargets: ["b2c"],
		supportedUseCases: ["postal"],
		category: "essential",
	},
	{
		key: "home_city",
		label: "Home City",
		supportedTargets: ["b2c"],
		supportedUseCases: ["postal"],
		category: "enrichment",
	},
	{
		key: "home_state",
		label: "Home State",
		supportedTargets: ["b2c"],
		supportedUseCases: ["postal"],
		category: "enrichment",
	},
	{
		key: "home_country",
		label: "Home Country",
		supportedTargets: ["b2c"],
		supportedUseCases: ["postal"],
		category: "enrichment",
	},
	{
		key: "gender",
		label: "Gender",
		supportedTargets: ["b2c"],
		supportedUseCases: ["postal"],
		category: "enrichment",
	},
	{
		key: "age",
		label: "Age",
		type: "number",
		supportedTargets: ["b2c"],
		supportedUseCases: ["postal"],
		category: "enrichment",
	},
	{
		key: "homeowner",
		label: "Homeowner",
		type: "boolean",
		supportedTargets: ["b2c"],
		supportedUseCases: ["postal"],
		category: "enrichment",
	},
	{
		key: "marital_status",
		label: "Marital Status",
		supportedTargets: ["b2c"],
		supportedUseCases: ["postal"],
		category: "enrichment",
	},
	{
		key: "income_range",
		label: "Income Range",
		supportedTargets: ["b2c"],
		supportedUseCases: ["postal"],
		category: "enrichment",
	},
	{
		key: "has_children",
		label: "Has Children",
		type: "boolean",
		supportedTargets: ["b2c"],
		supportedUseCases: ["postal"],
		category: "enrichment",
	},
];

/* -------------------------
   4) Service-specific defaults (rows) — what appears as default rows for a service
   ------------------------- */
const serviceDefaults: Record<ServiceType, string[]> = {
	default: ["email", "first_name", "last_name"],
	CSV: ["first_name", "last_name", "email"],
	mailchimp: ["email", "first_name", "last_name"],
	meta: ["email", "phone"],
	google_ads: ["email", "first_name", "last_name"],
	sales_force: ["email", "first_name", "last_name"],
	hubspot: ["email", "first_name", "last_name"],
	s3: ["email", "first_name", "last_name"],
	go_high_level: ["email", "first_name", "last_name"],
};

/* -------------------------
   EXPORT: config + helpers
   ------------------------- */

const allUseCaseFields: Record<
	UseCase,
	{ b2b: FieldSpec[]; b2c: FieldSpec[] }
> = {
	email: { b2b: emailB2B, b2c: emailB2C },
	tele_marketing: { b2b: teleB2B, b2c: teleB2C },
	postal: { b2b: postalB2B, b2c: postalB2C },
	generic: { b2b: [], b2c: [] },
};

export const schemaConfig = {
	commonFields,
	allUseCaseFields,
	serviceDefaults,
};

/**
 * Get merged available fields for given parameters.
 * - includes commonFields
 * - includes useCase fields (and for postal picks home/business based on target)
 * - includes target-specific fields (b2b / b2c / both)
 *
 * Deduplicates by key (first occurrence wins).
 */
export function getAvailableFields(
	service?: ServiceType,
	useCase?: UseCase,
	target?: TargetSchema,
) {
	const t = target ?? "both";
	const u = useCase ?? "generic";

	let fields: FieldSpec[] = [...commonFields];
	const usecase = schemaConfig.allUseCaseFields[u];

	if (usecase) {
		if (t === "b2b") fields.push(...usecase.b2b);
		else if (t === "b2c") fields.push(...usecase.b2c);
		else fields.push(...usecase.b2b, ...usecase.b2c);
	}

	// deduplicate
	const map = new Map<string, FieldSpec>();
	for (const f of fields) if (!map.has(f.key)) map.set(f.key, f);
	return Array.from(map.values());
}

/**
 * Get rows (default mapping order) for service
 */
export function getDefaultRowsForService(service?: ServiceType) {
	const s = service ?? "default";
	const keys =
		schemaConfig.serviceDefaults[s] ?? schemaConfig.serviceDefaults["default"];
	return keys.map((k) => {
		const pretty = k
			.replace(/_/g, " ")
			.replace(/\b\w/g, (c) => c.toUpperCase());
		return { key: k, label: pretty };
	});
}

export default schemaConfig;
