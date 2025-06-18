import { RefObject, useLayoutEffect, useRef } from "react";

type Deps = React.DependencyList;

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
