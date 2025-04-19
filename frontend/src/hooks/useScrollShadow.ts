import { useState, useEffect, RefObject } from 'react';

interface ScrollShadow {
  isScrolledX: boolean;
  isScrolledY: boolean;
}

export function useScrollShadow(
  containerRef: RefObject<HTMLElement>,
  watchDependency: any = null
): ScrollShadow {
  const [isScrolledX, setIsScrolledX] = useState(false);
  const [isScrolledY, setIsScrolledY] = useState(false);

  useEffect(() => {
    let container: HTMLElement | null = null;
    let rafId: number;

    const checkScroll = () => {
      if (!container) return;
      setIsScrolledX(container.scrollLeft > 0);
      setIsScrolledY(container.scrollTop > 0);
    };

    const init = () => {
      container = containerRef.current;
      if (container) {
        container.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
        checkScroll();
      } else {
        rafId = requestAnimationFrame(init);
      }
    };

    init();

    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      }
      cancelAnimationFrame(rafId);
    };
  }, [watchDependency]);

  return { isScrolledX, isScrolledY };
}
