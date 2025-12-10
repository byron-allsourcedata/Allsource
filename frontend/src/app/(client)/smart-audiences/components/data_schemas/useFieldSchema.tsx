// useFieldSchema.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
	getAvailableFields,
	getDefaultRowsForService,
	FieldSpec,
	ServiceType,
	UseCase,
	TargetSchema,
	getRequiredFields, // добавлен новый экспорт
} from "./schemaConfig";

/**
 * Типы, совместимые с вашим существующим кодом
 */
export interface Row {
	id: number;
	type: string; // human label (e.g. "Email", "First name")
	value: string; // canonical key (e.g. "email", "first_name")
	selectValue?: string;
	canDelete?: boolean;
	required?: boolean; // новое поле: является ли поле обязательным
}

export interface CustomRow {
	type: string; // canonical key
	value: string; // label (or mapped value)
	is_constant?: boolean;
}

export interface AvailableField {
	value: string;
	type: string;
	is_constant?: boolean;
	_spec?: FieldSpec;
	required?: boolean; // новое поле: является ли поле обязательным
}

type UseFieldSchemaReturn = {
	rows: Row[];
	setRows: React.Dispatch<React.SetStateAction<Row[]>>;
	customFields: CustomRow[];
	setCustomFields: React.Dispatch<React.SetStateAction<CustomRow[]>>;
	availableFields: AvailableField[];
	requiredFields: string[]; // массив ключей обязательных полей
	addCustomFieldByKey: (key: string) => void;
	removeCustomFieldByIndex: (index: number) => void;
	removeCustomFieldByKey: (key: string) => void;
	handleChangeCustomField: (
		index: number,
		key: keyof CustomRow,
		value: string | boolean | undefined,
	) => void;
	handleAddEmptyCustomField: () => void;
	handleDeleteCustomField: (index: number) => void;
	isValueDuplicate: (value: string, currentIndex?: number) => boolean;
	hasAnyDuplicates: () => boolean;
	buildDataMapForRequest: () => CustomRow[];
	resetToDefaults: () => void;
	validateRows: () => { isValid: boolean; missingFields: string[] };
};

/**
 * Хук, который формирует rows/customFields/availableFields на основе
 * service / useCase / targetSchema и предоставляет утилиты для UI.
 */
export function useFieldSchema(
	targetSchema: TargetSchema,
	useCase: UseCase,
	activeService: ServiceType,
	opts?: {
		initialRows?: Row[] | null;
		initialCustomFields?: CustomRow[] | null;
	},
): UseFieldSchemaReturn {
	const nextId = useRef(1);

	// Получаем обязательные поля для валидации
	const requiredFields = useMemo(() => {
		return getRequiredFields(activeService, useCase, targetSchema);
	}, [activeService, useCase, targetSchema]);

	// Конвертер FieldSpec -> Row
	const specToRow = (spec: FieldSpec): Row => {
		const id = nextId.current++;
		const isRequired = requiredFields.includes(spec.key);
		return {
			id,
			type: spec.label,
			value: spec.key,
			required: isRequired,
		} as Row;
	};

	// Конвертер FieldSpec -> AvailableField
	const specToAvailable = (spec: FieldSpec): AvailableField => ({
		value: spec.key,
		type: spec.label,
		is_constant: spec.is_constant,
		_spec: spec,
		required: requiredFields.includes(spec.key),
	});

	// Получаем доступные поля с учетом новой логики email полей
	const mergedFieldSpecs = useMemo(() => {
		return getAvailableFields(activeService, useCase, targetSchema);
	}, [activeService, useCase, targetSchema]);

	const availableFields = useMemo(
		() => mergedFieldSpecs.map(specToAvailable),
		[mergedFieldSpecs, requiredFields],
	);

	// Получаем начальные строки с учетом обязательных полей
	// В useFieldSchema.tsx, в функции getInitialRowsForService:
	const getInitialRowsForService = (svc?: ServiceType): Row[] => {
		if (opts?.initialRows) {
			return opts.initialRows.map((row) => ({
				...row,
				required: requiredFields.includes(row.value),
			}));
		}

		// Передаем useCase в getDefaultRowsForService
		const defaults = getDefaultRowsForService(svc, useCase, targetSchema);
		nextId.current = 1;

		return defaults.map((d) => {
			const isRequired = requiredFields.includes(d.key);
			return {
				id: nextId.current++,
				type: d.label,
				value: d.key,
				required: isRequired,
			} as Row;
		});
	};

	// Инициализация rows с учетом обязательных полей
	const [rows, setRows] = useState<Row[]>(() =>
		getInitialRowsForService(activeService),
	);

	// Построение initial custom fields
	const buildInitialCustomFromAvailable = () => {
		const rowKeys = new Set(rows.map((r) => r.value));
		return availableFields
			.filter((f) => !rowKeys.has(f.value))
			.map((f) => ({
				type: f.value,
				value: f.type,
				is_constant: f.is_constant,
			}));
	};

	const [customFields, setCustomFields] = useState<CustomRow[]>(
		() => opts?.initialCustomFields ?? buildInitialCustomFromAvailable(),
	);

	// Эффект для обновления при изменении параметров
	useEffect(() => {
		nextId.current = 1;
		const newRows = getInitialRowsForService(activeService);
		setRows(newRows);

		const rowKeys = new Set(newRows.map((r) => r.value));
		const newCustom = availableFields
			.filter((f) => !rowKeys.has(f.value))
			.map((f) => ({
				type: f.value,
				value: f.type,
				is_constant: f.is_constant,
			}));
		setCustomFields(newCustom);
	}, [activeService, useCase, targetSchema, availableFields]);

	// Функция валидации - проверяет, что все обязательные поля присутствуют
	const validateRows = () => {
		const currentRowKeys = new Set(rows.map((r) => r.value));
		const missingFields = requiredFields.filter(
			(field) => !currentRowKeys.has(field),
		);

		return {
			isValid: missingFields.length === 0,
			missingFields,
		};
	};

	// Добавляем обязательное поле в rows если оно отсутствует
	const ensureRequiredFieldsInRows = (
		currentRows: Row[],
		newRows: Row[],
	): Row[] => {
		const currentKeys = new Set(newRows.map((r) => r.value));
		const missingRequired = requiredFields.filter(
			(field) => !currentKeys.has(field),
		);

		if (missingRequired.length === 0) {
			return newRows;
		}

		// Добавляем недостающие обязательные поля
		const missingRows = missingRequired
			.map((field) => {
				const spec = mergedFieldSpecs.find((s) => s.key === field);
				if (!spec) return null;

				return {
					id: nextId.current++,
					type: spec.label,
					value: field,
					required: true,
				} as Row;
			})
			.filter(Boolean) as Row[];

		return [...newRows, ...missingRows];
	};

	// Обертываем setRows для автоматического добавления обязательных полей
	const wrappedSetRows: React.Dispatch<React.SetStateAction<Row[]>> = (
		action,
	) => {
		setRows((prev) => {
			const newRows = typeof action === "function" ? action(prev) : action;
			return ensureRequiredFieldsInRows(prev, newRows);
		});
	};

	// Утилиты для работы с custom fields
	const addCustomFieldByKey = (key: string) => {
		const spec = mergedFieldSpecs.find((s) => s.key === key);
		if (!spec) return;

		// Проверяем, является ли поле обязательным
		const isRequired = requiredFields.includes(key);

		// Если поле обязательное, добавляем его в rows
		if (isRequired) {
			wrappedSetRows((prev) => {
				if (prev.some((r) => r.value === key)) return prev;
				return [...prev, specToRow(spec)];
			});
			// Удаляем из custom fields если оно там есть
			removeCustomFieldByKey(key);
		} else {
			// Для необязательных полей добавляем в custom fields
			setCustomFields((prev) => {
				if (prev.some((c) => c.type === key)) return prev;
				if (rows.some((r) => r.value === key)) return prev;
				return [
					...prev,
					{ type: spec.key, value: spec.label, is_constant: spec.is_constant },
				];
			});
		}
	};

	const removeCustomFieldByIndex = (index: number) => {
		setCustomFields((prev) => prev.filter((_, i) => i !== index));
	};

	const removeCustomFieldByKey = (key: string) => {
		setCustomFields((prev) => prev.filter((c) => c.type !== key));
	};

	const handleChangeCustomField = (
		index: number,
		key: keyof CustomRow,
		value: string | boolean | undefined,
	) => {
		setCustomFields((prev) => {
			const copy = [...prev];
			copy[index] = { ...copy[index], [key]: value as any };
			return copy;
		});
	};

	const handleAddEmptyCustomField = () => {
		setCustomFields((prev) => [...prev, { type: "", value: "" }]);
	};

	const handleDeleteCustomField = (index: number) => {
		removeCustomFieldByIndex(index);
	};

	const isValueDuplicate = (value: string, currentIndex?: number): boolean => {
		const dupInCustom = customFields.some(
			(f, idx) => f.type === value && idx !== (currentIndex ?? -1),
		);
		const dupInRows = rows.some((r) => r.value === value);
		return dupInCustom || dupInRows;
	};

	const hasAnyDuplicates = (): boolean => {
		return customFields.some((f, idx) => isValueDuplicate(f.type, idx));
	};

	const buildDataMapForRequest = (): CustomRow[] => {
		return customFields.map((f) => ({
			type: f.type,
			value: f.value,
			is_constant: f.is_constant,
		}));
	};

	const resetToDefaults = () => {
		nextId.current = 1;
		const newRows = getInitialRowsForService(activeService);
		wrappedSetRows(newRows);
		const rowKeys = new Set(newRows.map((r) => r.value));
		setCustomFields(
			availableFields
				.filter(
					(f) => !rowKeys.has(f.value) && !requiredFields.includes(f.value),
				)
				.map((f) => ({
					type: f.value,
					value: f.type,
					is_constant: f.is_constant,
				})),
		);
	};

	return {
		rows,
		setRows: wrappedSetRows,
		customFields,
		setCustomFields,
		availableFields,
		requiredFields,
		addCustomFieldByKey,
		removeCustomFieldByIndex,
		removeCustomFieldByKey,
		handleChangeCustomField,
		handleAddEmptyCustomField,
		handleDeleteCustomField,
		isValueDuplicate,
		hasAnyDuplicates,
		buildDataMapForRequest,
		resetToDefaults,
		validateRows,
	};
}

export default useFieldSchema;
