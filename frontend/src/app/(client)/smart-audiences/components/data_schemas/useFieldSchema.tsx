// useFieldSchema.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import schemaConfig, {
	getAvailableFields,
	getDefaultRowsForService,
	FieldSpec,
	ServiceType,
	UseCase,
	TargetSchema,
} from "./schemaConfig";

/**
 * Типы, совместимые с вашим существующим кодом
 * Row — используется в defaultRows / rows (id, type=label, value=key)
 * CustomRow — ваш RequestData.data_map item
 */
export interface Row {
	id: number;
	type: string; // human label (e.g. "Email", "First name")
	value: string; // canonical key (e.g. "email", "first_name")
	selectValue?: string;
	canDelete?: boolean;
}

export interface CustomRow {
	type: string; // canonical key
	value: string; // label (or mapped value)
	is_constant?: boolean;
}

/**
 * AvailableField shape — matches earlier code where extendedFieldsList items
 * had { value: key, type: label, is_constant }
 */
export interface AvailableField {
	value: string;
	type: string;
	is_constant?: boolean;
	_spec?: FieldSpec;
}

type UseFieldSchemaReturn = {
	rows: Row[];
	// теперь expose-им setter как React.Dispatch<SetStateAction> — позволяет prev => ... и прямые массивы
	setRows: React.Dispatch<React.SetStateAction<Row[]>>;
	customFields: CustomRow[];
	setCustomFields: React.Dispatch<React.SetStateAction<CustomRow[]>>;
	availableFields: AvailableField[];
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
};

/**
 * Хук, который формирует rows/customFields/availableFields на основе
 * service / useCase / targetSchema и предоставляет утилиты для UI.
 */
export function useFieldSchema(
	activeService?: ServiceType,
	useCase?: UseCase,
	targetSchema?: TargetSchema,
	opts?: {
		initialRows?: Row[] | null;
		initialCustomFields?: CustomRow[] | null;
	},
): UseFieldSchemaReturn {
	const nextId = useRef(1);

	const specToRow = (spec: FieldSpec) => {
		const id = nextId.current++;
		return { id, type: spec.label, value: spec.key } as Row;
	};

	const specToAvailable = (spec: FieldSpec): AvailableField => ({
		value: spec.key,
		type: spec.label,
		is_constant: spec.is_constant,
		_spec: spec,
	});

	// use new helpers from schemaConfig
	const mergedFieldSpecs = useMemo(() => {
		// getAvailableFields returns deduplicated FieldSpec[] based on service/useCase/target
		return getAvailableFields(activeService, useCase, targetSchema);
	}, [activeService, useCase, targetSchema]);

	const availableFields = useMemo(
		() => mergedFieldSpecs.map(specToAvailable),
		[mergedFieldSpecs],
	);

	// initial rows: use getDefaultRowsForService which returns array of {key,label}
	const getInitialRowsForService = (svc?: ServiceType): Row[] => {
		// If opts.initialRows provided, keep using those (caller choice)
		if (opts?.initialRows) return opts.initialRows;
		const defaults = getDefaultRowsForService(svc);
		// defaults is array of { key, label } (see schemaConfig helper)
		nextId.current = 1;
		return defaults.map((d) => ({
			id: nextId.current++,
			type: (d as any).label ?? d.key,
			value: (d as any).key ?? d.key,
		}));
	};

	const [rows, setRows] = useState<Row[]>(() =>
		getInitialRowsForService(activeService),
	);

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
		// intentionally depend on availableFields so rebuild when availableFields recalculates
	}, [
		activeService,
		useCase,
		targetSchema,
		/* availableFields included via mergedFieldSpecs deps */ availableFields,
	]);

	// Utilities
	const addCustomFieldByKey = (key: string) => {
		const spec = mergedFieldSpecs.find((s) => s.key === key);
		if (!spec) return;
		setCustomFields((prev) => {
			if (prev.some((c) => c.type === spec.key)) return prev;
			if (rows.some((r) => r.value === spec.key)) return prev;
			return [
				...prev,
				{ type: spec.key, value: spec.label, is_constant: spec.is_constant },
			];
		});
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
		setRows(newRows);
		const rowKeys = new Set(newRows.map((r) => r.value));
		setCustomFields(
			availableFields
				.filter((f) => !rowKeys.has(f.value))
				.map((f) => ({
					type: f.value,
					value: f.type,
					is_constant: f.is_constant,
				})),
		);
	};

	return {
		rows,
		setRows,
		customFields,
		setCustomFields,
		availableFields,
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
	};
}

export default useFieldSchema;
