import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

/** Entrance animation when a dashboard tab panel mounts */
export function useGsapTabEnter(vars = {}) {
  const ref = useRef(null);
  const varsRef = useRef(vars);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        opacity: 0,
        y: 20,
        duration: 0.45,
        ease: 'power3.out',
        ...varsRef.current,
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return ref;
}
