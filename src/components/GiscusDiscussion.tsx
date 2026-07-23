"use client";

import { useEffect, useRef } from "react";

export default function GiscusDiscussion() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", "jahid124421/phonehub");
    script.setAttribute("data-repo-id", "R_kgDOPhoneHub");
    script.setAttribute("data-category", "General");
    script.setAttribute("data-category-id", "DIC_kwDOPhoneHubGeneral");
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", "preferred_color_scheme");
    script.setAttribute("data-lang", "en");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        const iframe = containerRef.current.querySelector("iframe");
        if (iframe) iframe.remove();
      }
    };
  }, []);

  return <div ref={containerRef} className="mt-8" />;
}
