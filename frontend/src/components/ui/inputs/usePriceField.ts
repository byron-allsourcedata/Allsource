import { useMemo, useState, type ChangeEvent } from "react";

/**
 * Hook for handling price input field in dollars, e.g. 0.15, 17.45
 */
export function usePriceInput(initial: string = "") {
	const [value, setValue] = useState<string>(initial);

	function format(input: string): string {
		// Remove all non-numeric except dot
		let cleaned = input.replace(/[^0-9.]/g, "");

		// Ensure only one dot
		const parts = cleaned.split(".");
		if (parts.length > 2) {
			cleaned = `${parts[0]}.${parts.slice(1).join("")}`;
		}

		// Restrict to 2 decimals
		const [intPart, decPart] = cleaned.split(".");
		cleaned =
			decPart !== undefined ? `${intPart}.${decPart.slice(0, 2)}` : intPart;

		// Add dollar sign if not empty
		return cleaned;
	}

	const cents = useMemo(() => {
		try {
			if (!value) return 0;
			const raw = value.replace(/[^0-9.]/g, "");
			if (!raw) return 0;

			const [intPart, decPart] = raw.split(".");
			const dollars = Number.parseInt(intPart || "0", 10);
			const centsPart = Number.parseInt(
				(decPart || "").padEnd(2, "0").slice(0, 2),
				10,
			);

			return Number.isNaN(dollars) || Number.isNaN(centsPart)
				? 0
				: dollars * 100 + centsPart;
		} catch {
			return 0;
		}
	}, [value]);

	function handleChange(e: ChangeEvent<HTMLInputElement>) {
		const raw = e.target.value;
		setValue(format(raw));
	}

	function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
		let raw = e.target.value.replace(/[^0-9.]/g, "");

		if (!raw) {
			setValue("");
			return;
		}

		// Add leading zero if starts with "."
		if (raw.startsWith(".")) {
			raw = `0${raw}`;
		}

		setValue(format(raw));
	}

	return {
		cents,
		value,
		onChange: handleChange,
		onInput: handleChange,
		onBlur: handleBlur,
	};
}
