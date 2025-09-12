export const defaultPaginationOptions = [10, 20, 50, 100, 300, 500];

/**
 * Remove unnecessary options for rows per page
 *
 * @param options a sorted array of displayed rows per page
 * @param objectCount total number of objects
 */
export function filterPaginationOptions(
	options: number[],
	objectCount: number | null,
): number[] {
	if (!objectCount) return options;

	let rowsPerPageOptions = options.filter((option) => option <= objectCount);
	if (rowsPerPageOptions.length < options.length) {
		rowsPerPageOptions = [...rowsPerPageOptions];
	}

	if (!rowsPerPageOptions.includes(objectCount)) {
		rowsPerPageOptions.push(objectCount);
		rowsPerPageOptions.sort((a, b) => a - b);
	}
	return rowsPerPageOptions;
}

export function filterDefaultPaginationOptions(objectCount: number): number[] {
	return filterPaginationOptions(defaultPaginationOptions, objectCount);
}
