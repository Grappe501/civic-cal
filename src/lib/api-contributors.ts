const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

export interface ContributorSignupPayload {
  name: string;
  email: string;
  county: string;
  city?: string;
  role?: string;
  helpAreas?: string;
}

export async function signupContributor(payload: ContributorSignupPayload): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${fnBase}/trusted-contributors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Signup failed");
  return data;
}
