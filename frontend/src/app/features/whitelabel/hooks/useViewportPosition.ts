import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Props = {
    paddingBottom: number;
}

export function useElementViewportPosition<T extends HTMLElement>({
    paddingBottom = 12
}: Props) {
    const ref = useRef<T>(null);
    const [yTop, setYTop] = useState(0);
    const [pxToBottom, setPxToBottom] = useState(0);

    // decode between layoutEffect and just effect
    useEffect(() => {
        function updatePosition() {
            if (ref.current) {
                const rect = ref.current.getBoundingClientRect();
                setYTop(rect.top);
                setPxToBottom(window.innerHeight - rect.top - paddingBottom);
            }
        }

        updatePosition();

        window.addEventListener("scroll", updatePosition, { passive: true });
        window.addEventListener("resize", updatePosition);

        return () => {
            window.removeEventListener("scroll", updatePosition);
            window.removeEventListener("resize", updatePosition);
        };
    }, [paddingBottom]);

    return [ref, yTop, pxToBottom] as const;
}
