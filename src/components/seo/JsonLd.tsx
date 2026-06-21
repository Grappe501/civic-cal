import { useEffect } from "react";

interface Props {
  data: Record<string, unknown> | Record<string, unknown>[];
}

/** Inject JSON-LD for search engines and AI crawlers */
export function JsonLd({ data }: Props) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "civic-jsonld";
    script.text = JSON.stringify(data);
    const existing = document.getElementById("civic-jsonld");
    if (existing) existing.remove();
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [data]);

  return null;
}
