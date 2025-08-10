import { useEffect, useRef, useState } from "react";

export function useInitialHeight() {
    const elementRef = useRef<HTMLDivElement>(null);
    const [initialHeight, setInitialHeight] = useState(0);
    useEffect(() => {
        if (elementRef.current) {
            setInitialHeight(elementRef.current.clientHeight);
            console.log(elementRef.current.clientHeight)
        }
    }, []);
    return [initialHeight, elementRef] as const;
}