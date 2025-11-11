import { useState, useEffect, useMemo } from "react";

export interface CustomFieldOption {
	value: string;
	type: string;
	is_constant?: boolean;
}

export interface CustomField {
	type: string;
	value: string;
	is_constant?: boolean;
}

export interface Row {
	id: number;
	type: string;
	value: string;
	selectValue?: string;
	canDelete?: boolean;
	is_constant?: boolean;
}

export const useCustomFields = (
	initialList: CustomFieldOption[],
	data: { data_map?: CustomField[] } | null | undefined,
	canAddConstantField: boolean = false,
	excludedFields: string[] = [],
) => {
	const [customFields, setCustomFields] = useState<CustomField[]>([]);

	const [filteredList] = useState(() =>
		initialList.filter((item) => !excludedFields.includes(item.value)),
	);
	const [emailEntry, setEmailEntry] = useState<CustomField | null>(null);

	useEffect(() => {
		if (!filteredList) return;

		if (data?.data_map?.length) {
			// 1) извлекаем поле Email (если есть) — для внешнего activeEmailVariation
			const foundEmail =
				data.data_map.find((f) => f.value === "Email") ||
				data.data_map.find(
					(f) => f.type === "business_email" || f.type === "personal_emails",
				);

			if (foundEmail) {
				setEmailEntry(foundEmail);
			} else {
				setEmailEntry(null);
			}

			// 2) нормализуем все остальные поля для UI (оставляем value как есть)
			const mapped = data.data_map
				.filter((f) => {
					// исключаем email и excludedFields
					if (f.value === "Email") return false;
					if (excludedFields.includes(f.type)) return false;
					return true;
				})
				.map((f) => {
					// Ищем соответствие в CUSTOM_FIELDS (filteredList)
					// Возможные случаи:
					// - f.type === option.value  (обычный кейс: type=company_name)
					// - f.value === option.type  (когда бэк положил label в value)
					const match = filteredList.find(
						(opt) => opt.value === f.type || opt.type === f.value,
					);

					// Для селекта нужно присвоить `type` = option.value (ключ),
					// чтобы <TextField select value={field.type}> корректно выбрал опцию.
					// Правая колонка (field.value) — оставляем как пришло (чтобы автозаполнялось).
					return {
						type: match ? match.value : f.type, // если нашли — ставим ключ, иначе оставляем f.type
						value: f.value ?? "", // сохраняем то, что пришло (обычно label или пользовательское значение)
						is_constant: f.is_constant ?? false,
					};
				});

			setCustomFields(mapped);
			return;
		}

		// если данных с бэка нет — инициализируем из filteredList (пустые значения справа)
		if (customFields.length === 0) {
			const initialFields = filteredList.map((opt) => ({
				type: opt.value, // ключ для селекта
				value: opt.type, // пустое правое поле — пользователь вводит
				is_constant: opt.is_constant ?? false,
			}));
			setCustomFields(initialFields);
		}
	}, [data, filteredList, excludedFields]);

	const handleChangeField = (
		index: number,
		key: keyof CustomField,
		value: string | boolean,
	) => {
		setCustomFields((prev) =>
			prev.map((field, i) =>
				i === index ? { ...field, [key]: value } : field,
			),
		);
	};

	const handleAddField = () => {
		setCustomFields((prev) => [...prev, { type: "", value: "" }]);
	};

	const handleDeleteField = (index: number) => {
		setCustomFields((prev) => prev.filter((_, i) => i !== index));
	};

	const canAddMore =
		canAddConstantField || customFields.length < filteredList.length;

	return {
		customFields,
		setCustomFields,
		customFieldsList: filteredList,
		handleChangeField,
		handleAddField,
		handleDeleteField,
		canAddMore,
		emailEntry,
	};
};
