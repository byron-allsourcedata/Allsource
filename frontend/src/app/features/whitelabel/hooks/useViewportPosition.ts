import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export function useElementViewportPosition<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [yTop, setYTop] = useState(0);
    const [pxToBottom, setPxToBottom] = useState(0);

    useLayoutEffect(() => {
        if (ref.current != null) {
            const rect = ref.current.getBoundingClientRect();
            console.log(window.innerHeight - rect.top);
            setYTop(rect.top);
            setPxToBottom(window.innerHeight - rect.top);
        } top
    });

    return [ref, yTop, pxToBottom] as const
}
