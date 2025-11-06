import { useState, useEffect, useMemo } from "react";

export interface CustomFieldOption {
	value: string;
	type: string;
}

export interface CustomField {
	type: string;
	value: string;
}

export const useCustomFields = (
	initialList: CustomFieldOption[],
	data: { data_map?: CustomField[] } | null,
	canAddConstantField: boolean = false,
	excludedFields: string[] = [],
) => {
	const [customFields, setCustomFields] = useState<CustomField[]>([]);

	// Вычисляем filteredList один раз при монтировании
	const [filteredList] = useState(() =>
		initialList.filter((item) => !excludedFields.includes(item.value)),
	);

	useEffect(() => {
		if (data?.data_map?.length) {
			// Фильтруем data_map, исключая поля из excludedFields
			const filteredDataMap = data.data_map.filter(
				(field) => !excludedFields.includes(field.type),
			);
			setCustomFields(filteredDataMap);
		} else {
			// Создаем начальные поля только если customFields пуст
			if (customFields.length === 0) {
				const initialFields = filteredList
					.filter((field) => field.value && field.type)
					.map((field) => ({
						type: field.value,
						value: field.type,
					}));
				setCustomFields(initialFields);
			}
		}
	}, [data, filteredList, excludedFields]); // customFields.length добавлен в зависимости

	const handleChangeField = (
		index: number,
		key: keyof CustomField,
		value: string,
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
		customFieldsList: filteredList, // возвращаем отфильтрованный список
		handleChangeField,
		handleAddField,
		handleDeleteField,
		canAddMore,
	};
};
