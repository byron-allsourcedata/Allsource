import { RefObject, useLayoutEffect, useRef } from "react";

type Deps = React.DependencyList;

/**
 * Hook that keeps an HTML table’s maximum height clamped so that
 * the table + paginator always fit the viewport without causing the
 * paginator to disappear or the table to “jump”.
 *
 * @param tableRef  – **Required.** Ref of the table element whose height will be clamped.
 * @param gap       – Vertical breathing space (in px) left between the bottom edge
 *                    of the paginator and the viewport.
 *                    Defaults to **8 px**.
 *                    A bigger value pushes the paginator further up.
 * @param minHeight – Hard-floor height (in px) for the table. Even if the viewport
 *                    becomes very small, the table’s `max-height` will never drop
 *                    below this number.
 *                    Defaults to **120 px**.
 * @param deps      – Additional React dependency list; useful when external
 *                    values influence the clamping logic.
 *
 * @returns A `ref` that **must** be attached to the paginator element so the hook
 *          can measure its height.
 */
export const useClampTableHeight = (
	tableRef: RefObject<HTMLElement>,
	gap = 8,
	minHeight = 120,
	deps: Deps = [],
) => {
	const paginatorRef = useRef<HTMLElement>(null);
	useLayoutEffect(() => {
		if (!tableRef.current) return;

		const clamp = () => {
			const tableTop = tableRef.current!.getBoundingClientRect().top;
			const pagHeight =
				paginatorRef.current?.getBoundingClientRect().height ?? 0;

			const avail = window.innerHeight - tableTop - pagHeight - gap;
			const px = Math.max(avail, minHeight);

			tableRef.current!.style.maxHeight = `${px}px`;
		};

		clamp();
		window.addEventListener("resize", clamp);
		window.addEventListener("scroll", clamp, true);

		return () => {
			window.removeEventListener("resize", clamp);
			window.removeEventListener("scroll", clamp, true);
		};
	}, [tableRef, paginatorRef, gap, minHeight, ...deps]);
	return paginatorRef;
};
