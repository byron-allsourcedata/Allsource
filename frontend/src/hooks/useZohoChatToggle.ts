import { useEffect } from "react";

/**
 * Хук для управления видимостью Zoho SalesIQ чата
 * @param condition boolean | любое значение, по которому решаем — скрывать чат или показывать
 */
export function useZohoChatToggle(condition: boolean) {
	useEffect(() => {
		if (condition) {
			document.body.classList.add("hide-zoho");
		} else {
			document.body.classList.remove("hide-zoho");
		}
	}, [condition]);
}
