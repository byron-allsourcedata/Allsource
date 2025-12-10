// schemaConfig.ts
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

export type UseCase =
	| "email"
	| "postal"
	| "tele_marketing"
	| "generic"
	| "meta"
	| "google_ads";
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
	key: string;
	label: string;
	type?: FieldType;
	is_constant?: boolean;
	supportedTargets?: TargetSchema[];
	supportedUseCases?: UseCase[];
	defaultForServices?: ServiceType[];
	requiredFor?: TargetSchema[];
	category?: "essential" | "enrichment";
	isEmailField?: boolean;
	isPhoneField?: boolean;
}

/* ============================
   BASE DICTIONARY
   ============================ */
const baseFields: Record<
	string,
	{
		label: string;
		type?: FieldType;
		is_constant?: boolean;
		isEmailField?: boolean;
		isPhoneField?: boolean;
	}
> = {
	personal_email: {
		label: "Personal Email",
		type: "email",
		isEmailField: true,
	},
	business_email: {
		label: "Business Email",
		type: "email",
		isEmailField: true,
	},

	first_name: { label: "First Name", type: "string" },
	last_name: { label: "Last Name", type: "string" },

	phone: { label: "Phone", type: "phone", isPhoneField: true },
	phone_mobile1: {
		label: "Phone Mobile1",
		type: "phone",
		isPhoneField: true,
	},
	phone_mobile2: {
		label: "Phone Mobile2",
		type: "phone",
		isPhoneField: true,
	},

	gender: { label: "Gender" },
	birth_date: { label: "Birth date", type: "date" },
	age: { label: "Age", type: "number" },

	city: { label: "City" },
	state: { label: "State" },
	zip_code: { label: "Zip code" },
	country_code: { label: "Country code" },

	home_city: { label: "Home City" },
	home_state: { label: "Home State" },
	home_postal_code: { label: "Home Postal Code" },
	home_country: { label: "Home Country" },

	business_city: { label: "Business City" },
	business_state: { label: "Business State" },
	business_postal_code: { label: "Business Postal Code" },
	business_country: { label: "Business Country" },

	current_company_name: { label: "Current Company Name" },
	current_job_title: { label: "Job Title" },
	department: { label: "Department" },
	primary_industry: { label: "Industry" },
	company_size: { label: "Company Size" },
	annual_sales: { label: "Annual Sales", type: "number" },

	homeowner: { label: "Homeowner", type: "boolean" },
	has_children: { label: "Has Children", type: "boolean" },
	income_range: { label: "Income Range" },
	marital_status: { label: "Marital Status" },
};

/* ============================
   RULES / MATRIX
   ============================ */
type RuleGroup = {
	essential?: string[];
	enrichment?: string[];
};

type UseCaseRules = {
	b2b?: RuleGroup;
	b2c?: RuleGroup;
	both?: RuleGroup;
};

const rules: Record<UseCase, UseCaseRules> = {
	email: {
		b2b: {
			essential: [
				"first_name",
				"last_name",
				"business_email",
				"current_company_name",
			],
			enrichment: [
				"current_job_title",
				"department",
				"primary_industry",
				"company_size",
				// "business_country",
				// "business_state",
				// "business_city",
				// "business_postal_code",
			],
		},
		b2c: {
			essential: ["first_name", "last_name", "personal_email"],
			enrichment: [
				"gender",
				"age",
				"home_state",
				"home_city",
				//"homeowner",
				"income_range",
				"has_children",
			],
		},
	},

	tele_marketing: {
		b2b: {
			essential: [
				"first_name",
				"last_name",
				"phone_mobile1",
				"current_company_name",
			],
			enrichment: [
				"current_job_title",
				"department",
				"primary_industry",
				"company_size",
				"annual_sales",
				"business_state",
				"business_city",
			],
		},
		b2c: {
			essential: ["first_name", "last_name", "phone_mobile1"],
			enrichment: [
				"phone_mobile2",
				"gender",
				"age",
				"home_state",
				"home_city",
				"home_postal_code",
				"homeowner",
				"has_children",
				"income_range",
			],
		},
	},

	postal: {
		b2b: {
			essential: [
				"first_name",
				"last_name",
				"current_company_name",
				"business_postal_code",
			],
			enrichment: [
				"current_job_title",
				"business_city",
				"business_state",
				"business_country",
				"department",
				"primary_industry",
				"company_size",
			],
		},
		b2c: {
			essential: ["first_name", "last_name", "home_postal_code"],
			enrichment: [
				"home_city",
				"home_state",
				"home_country",
				"gender",
				"age",
				"homeowner",
				"marital_status",
				"income_range",
				"has_children",
			],
		},
	},

	meta: {
		both: {
			essential: [
				"phone_mobile1",
				"gender",
				"home_city",
				"home_state",
				"zip_code",
			],
		},
	},
	google_ads: {
		both: {
			essential: [
				"phone_mobile1",
				"gender",
				"home_city",
				"home_state",
				"zip_code",
			],
		},
	},

	generic: {
		both: {
			essential: [],
			enrichment: [],
		},
	},
};

/* ============================
   SERVICE DEFAULTS
   ============================ */
const baseServiceDefaults: Record<ServiceType, string[]> = {
	default: ["first_name", "last_name"],
	mailchimp: ["first_name", "last_name"],
	meta: [
		"first_name",
		"last_name",
		"personal_email",
		"business_email",
		"phone_mobile1",
		"gender", // Добавляем gender в defaults для meta
		"home_city",
		"home_state",
		"zip_code",
	],
	google_ads: [
		"first_name",
		"last_name",
		"personal_email",
		"business_email",
		"phone_mobile1",
		"gender", // Добавляем gender в defaults для google_ads
		"home_city",
		"home_state",
		"country_code",
	],
	sales_force: ["first_name", "last_name"],
	hubspot: ["first_name", "last_name"],
	s3: ["first_name", "last_name"],
	go_high_level: ["first_name", "last_name"],
	CSV: ["first_name", "last_name"],
};

// Функция для получения defaults с учетом useCase и target
function getServiceDefaults(
	service: ServiceType,
	useCase?: UseCase,
	target?: TargetSchema,
): string[] {
	const base = baseServiceDefaults[service] || baseServiceDefaults["default"];

	if (service === "CSV") {
		// Проверяем useCase только если он определен
		if (useCase) {
			// Для CSV с meta или google_ads useCase
			if (useCase === "meta") {
				return baseServiceDefaults["meta"];
			}
			if (useCase === "google_ads") {
				return baseServiceDefaults["google_ads"];
			}
		}

		// Для CSV с другими useCase (email, postal, tele_marketing, generic)
		switch (target) {
			case "b2b":
				return [...base, "business_email"];
			case "b2c":
				return [...base, "personal_email"];
			case "both":
				return [...base, "personal_email", "business_email"];
			default:
				return [...base, "personal_email"];
		}
	}

	// Для meta useCase ВСЕГДА возвращаем meta defaults независимо от сервиса
	if (useCase === "meta") {
		return baseServiceDefaults["meta"]; // Возвращаем defaults для meta
	}

	// Для google_ads useCase ВСЕГДА возвращаем google_ads defaults
	if (useCase === "google_ads") {
		return baseServiceDefaults["google_ads"];
	}

	// Для meta сервиса всегда возвращаем meta defaults
	if (service === "meta") {
		return baseServiceDefaults["meta"];
	}

	// Для google_ads сервиса всегда возвращаем google_ads defaults
	if (service === "google_ads") {
		return baseServiceDefaults["google_ads"];
	}

	// Для CSV сервиса

	// Для всех остальных сервисов добавляем email в зависимости от target и useCase
	if (useCase && useCase !== "generic") {
		const emailUsingUseCases: UseCase[] = ["email", "postal", "tele_marketing"];

		if (emailUsingUseCases.includes(useCase)) {
			switch (target) {
				case "b2b":
					return [...base, "business_email"];
				case "b2c":
					return [...base, "personal_email"];
				case "both":
					return [...base, "personal_email", "business_email"];
				default:
					return [...base, "personal_email"];
			}
		}
	}

	return base;
}

/* ============================
   HELPERS
   ============================ */
function keyToSpec(
	key: string,
	opts?: {
		supportedTargets?: TargetSchema[];
		supportedUseCases?: UseCase[];
		category?: "essential" | "enrichment";
	},
): FieldSpec {
	const base = baseFields[key];
	return {
		key,
		label: base?.label ?? prettifyKey(key),
		type: base?.type,
		is_constant: base?.is_constant,
		isEmailField: base?.isEmailField,
		isPhoneField: base?.isPhoneField,
		supportedTargets: opts?.supportedTargets,
		supportedUseCases: opts?.supportedUseCases,
		category: opts?.category,
	};
}

function prettifyKey(k: string) {
	return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Функция для фильтрации дублирующихся полей
function filterDuplicateFields(
	fields: FieldSpec[],
	target?: TargetSchema,
): FieldSpec[] {
	const result: FieldSpec[] = [];
	const seenKeys = new Set<string>();

	for (const field of fields) {
		const key = field.key;

		// Для phone_mobile1 проверяем дублирование
		if (field.isPhoneField && key === "phone_mobile1") {
			if (!seenKeys.has(key)) {
				seenKeys.add(key);
				result.push(field);
			}
			continue;
		}

		// Для email полей применяем логику в зависимости от target
		if (field.isEmailField) {
			if (!seenKeys.has(key)) {
				let shouldInclude = true;

				if (target === "b2b" && key === "personal_email") {
					shouldInclude = false;
				}

				if (target === "b2c" && key === "business_email") {
					shouldInclude = false;
				}

				if (shouldInclude) {
					seenKeys.add(key);
					result.push(field);
				}
			}
		} else if (!seenKeys.has(key)) {
			seenKeys.add(key);
			result.push(field);
		}
	}

	return result;
}

// Функция для проверки, нужно ли учитывать target type
function shouldIgnoreTarget(useCase: UseCase, service: ServiceType): boolean {
	return (
		useCase === "meta" ||
		service === "meta" ||
		useCase === "google_ads" ||
		service === "google_ads"
	);
}

function resolveFieldsFor(
	useCase: UseCase,
	target: TargetSchema,
	service?: ServiceType,
): FieldSpec[] {
	const r = rules[useCase];
	if (!r) return [];

	// Для meta и google_ads всегда используем both группу, игнорируя target
	if (shouldIgnoreTarget(useCase, service || "default") && r.both) {
		const group = r.both;
		const keys = [...(group.essential ?? []), ...(group.enrichment ?? [])];
		return filterDuplicateFields(
			keys.map((k) =>
				keyToSpec(k, {
					supportedTargets: ["both"],
					supportedUseCases: [useCase],
					category: group.essential?.includes(k) ? "essential" : "enrichment",
				}),
			),
			"both",
		);
	}

	const groups: RuleGroup[] = [];

	if (target === "b2b") {
		if (r.b2b) groups.push(r.b2b);
	} else if (target === "b2c") {
		if (r.b2c) groups.push(r.b2c);
	} else if (target === "both") {
		if (r.b2b) groups.push(r.b2b);
		if (r.b2c) groups.push(r.b2c);
	}

	const out: FieldSpec[] = [];
	for (const g of groups) {
		const essential = g.essential ?? [];
		const enrichment = g.enrichment ?? [];

		for (const k of essential) {
			out.push(
				keyToSpec(k, {
					supportedTargets: [target],
					supportedUseCases: [useCase],
					category: "essential",
				}),
			);
		}
		for (const k of enrichment) {
			out.push(
				keyToSpec(k, {
					supportedTargets: [target],
					supportedUseCases: [useCase],
					category: "enrichment",
				}),
			);
		}
	}

	return filterDuplicateFields(out, target);
}

/* ============================
   EXPORT: config + helpers
   ============================ */
export const schemaConfig = {
	allUseCaseFields: {} as Record<
		UseCase,
		{ b2b: FieldSpec[]; b2c: FieldSpec[] }
	>,
	serviceDefaults: baseServiceDefaults,
};

// Динамически заполняем allUseCaseFields
const allUseCases: UseCase[] = [
	"email",
	"postal",
	"tele_marketing",
	"generic",
	"meta",
	"google_ads",
];
for (const useCase of allUseCases) {
	schemaConfig.allUseCaseFields[useCase] = {
		b2b: resolveFieldsFor(useCase, "b2b"),
		b2c: resolveFieldsFor(useCase, "b2c"),
	};
}

/**
 * Get merged available fields for given parameters.
 */
export function getAvailableFields(
	service?: ServiceType,
	useCase?: UseCase,
	target?: TargetSchema,
): FieldSpec[] {
	const t: TargetSchema = target ?? "both";
	const u: UseCase = useCase ?? "generic";
	const s: ServiceType = service || "default";

	const resolved = resolveFieldsFor(u, t, s);

	// Для meta и google_ads useCase НИКОГДА не добавляем email поля
	if (u === "meta" || u === "google_ads") {
		return resolved;
	}

	// Для meta и google_ads сервисов тоже не добавляем email
	if (s === "meta" || s === "google_ads") {
		return resolved;
	}

	// Добавляем email поля для сервисов, которые их используют
	if (service && useCase && useCase !== "generic") {
		const emailUsingUseCases: UseCase[] = ["email", "postal", "tele_marketing"];

		if (emailUsingUseCases.includes(useCase)) {
			const hasPersonalEmail = resolved.some((f) => f.key === "personal_email");
			const hasBusinessEmail = resolved.some((f) => f.key === "business_email");

			if (target === "b2b" && !hasBusinessEmail) {
				resolved.unshift(
					keyToSpec("business_email", {
						category: "essential",
					}),
				);
			} else if (target === "b2c" && !hasPersonalEmail) {
				resolved.unshift(
					keyToSpec("personal_email", {
						category: "essential",
					}),
				);
			} else if (target === "both") {
				if (!hasPersonalEmail) {
					resolved.unshift(
						keyToSpec("personal_email", {
							category: "essential",
						}),
					);
				}
				if (!hasBusinessEmail) {
					resolved.unshift(
						keyToSpec("business_email", {
							category: "essential",
						}),
					);
				}
			}
		}
	}

	return resolved;
}

/**
 * Get rows (default mapping order) for service with target consideration
 */
export function getDefaultRowsForService(
	service?: ServiceType,
	useCase?: UseCase,
	target?: TargetSchema,
) {
	const s: ServiceType = (service ?? "default") as ServiceType;
	const keys = getServiceDefaults(s, useCase, target);

	return keys.map((k) => {
		const pretty = baseFields[k]?.label ?? prettifyKey(k);
		return { key: k, label: pretty };
	});
}

/**
 * Получить обязательные поля для валидации
 */
export function getRequiredFields(
	service: ServiceType,
	useCase: UseCase,
	target: TargetSchema,
): string[] {
	const fields = getAvailableFields(service, useCase, target);
	const essentialFields = fields
		.filter((f) => f.category === "essential")
		.map((f) => f.key);

	return essentialFields;
}

/**
 * Проверяет, нужно ли игнорировать target type для данной комбинации
 */
export function shouldHideTargetSelector(
	service: ServiceType,
	useCase: UseCase,
): boolean {
	return shouldIgnoreTarget(useCase, service);
}

export default schemaConfig;
