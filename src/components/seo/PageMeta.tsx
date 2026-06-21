import { useEffect } from "react";

const SITE = "https://arkansaseverywhere.org";

interface Props {
  title: string;
  description: string;
  canonicalPath: string;
  ogType?: string;
}

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function PageMeta({ title, description, canonicalPath, ogType = "website" }: Props) {
  useEffect(() => {
    const fullTitle = title.includes("Arkansas Everywhere") ? title : `${title} | Arkansas Everywhere`;
    document.title = fullTitle;
    setMeta("description", description);
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:type", ogType, true);
    setMeta("og:url", `${SITE}${canonicalPath}`, true);
    setLink("canonical", `${SITE}${canonicalPath}`);
  }, [title, description, canonicalPath, ogType]);

  return null;
}
