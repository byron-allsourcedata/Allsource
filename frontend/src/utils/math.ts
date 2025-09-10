/**
 * calculate percentage from x / y, capped at 100 and min of 0
 *
 * if its impossible to calculate return null
 */
export function percentage(used: number, max: number): number | null {
	if (max <= 0) {
		return null;
	}

	const usage = Math.round(((max - used) / max) * 100);

	return Math.max(Math.min(100, usage), 0);
}
