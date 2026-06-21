/**
 * Parse ADE School Locator HTML (adedata.arkansas.gov/LEA/Home/schools).
 */
const HIGH_SCHOOL_RE = /high\s*school|senior|grades offered:\s*0?9|grades offered:\s*1[0-2]|grades offered:\s*07\s*-\s*12|grades offered:\s*9\s*-\s*12|grades offered:\s*10\s*-\s*12/i;

export function parseAdeSchoolLocatorHtml(html) {
  if (!html.includes("<h2")) {
    return parseMarkdownStyle(html);
  }

  const schools = [];
  const chunks = html.split(/<h2[^>]*>/i).slice(1);

  for (const chunk of chunks) {
    const nameEnd = chunk.indexOf("</h2>");
    if (nameEnd < 0) continue;
    const school_name = stripTags(chunk.slice(0, nameEnd)).trim();
    if (!school_name || /^address$/i.test(school_name)) continue;

    const leaMatch = chunk.match(/<h3[^>]*>(\d+)/i);
    const gradesMatch = chunk.match(/Grades Offered:\s*([^<]+)/i);
    const principalMatch = chunk.match(/Principal:\s*([^<]+)/i);
    const addrMatch = chunk.match(/class="val-address"[\s\S]*?<span>([^<]+)<\/span>\s*<span>([^<]+)<\/span>/i);

    const grades = gradesMatch?.[1]?.trim() ?? null;
    const addressLine = addrMatch ? `${addrMatch[1].trim()}, ${addrMatch[2].trim()}` : null;
    const cityCounty = parseCityCounty(addressLine);
    const isHighSchool = HIGH_SCHOOL_RE.test(`${school_name} ${grades ?? ""}`);

    schools.push({
      school_name,
      lea_number: leaMatch?.[1] ?? null,
      grades_served: grades,
      is_high_school: isHighSchool,
      principal: principalMatch?.[1]?.trim() ?? null,
      address: addressLine,
      city: cityCounty.city,
      county: cityCounty.county,
      source_url: "https://adedata.arkansas.gov/LEA/Home/schools",
      source: "ade_school_locator",
    });
  }

  return schools;
}

function parseMarkdownStyle(text) {
  const schools = [];
  const blocks = text.split(/\n(?=## )/);
  for (const block of blocks) {
    const nameMatch = block.match(/^##\s+(.+)/m);
    if (!nameMatch) continue;
    const school_name = nameMatch[1].trim();
    const gradesMatch = block.match(/Grades Offered:\s*([^\n]+)/i);
    const grades = gradesMatch?.[1]?.trim() ?? null;
    schools.push({
      school_name,
      lea_number: null,
      grades_served: grades,
      is_high_school: HIGH_SCHOOL_RE.test(`${school_name} ${grades ?? ""}`),
      principal: null,
      address: null,
      city: null,
      county: null,
      source_url: "https://adedata.arkansas.gov/LEA/Home/schools",
      source: "ade_school_locator",
    });
  }
  return schools;
}

function stripTags(s) {
  return String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseCityCounty(address) {
  if (!address) return { city: null, county: null };
  const m = address.match(/,\s*([A-Za-z\s.-]+),\s*AR\s*\d{5}/);
  return { city: m?.[1]?.trim() ?? null, county: null };
}

export function slugifySchool(name, city) {
  return `${String(city ?? "ar").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`.slice(0, 96);
}
