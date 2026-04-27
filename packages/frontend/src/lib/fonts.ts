export interface FontDefinition {
  name: string;
  label: string;
  category: "sans-serif" | "serif" | "display-serif" | "geometric" | "mono";
  googleFamily: string | null;
  stack: string;
  contexts: ("body" | "heading")[];
}

export const FONTS: FontDefinition[] = [
  // System defaults — no Google Fonts load needed
  { name: "system", label: "System sans-serif", category: "sans-serif", googleFamily: null, stack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", contexts: ["body", "heading"] },
  { name: "system-serif", label: "System serif", category: "serif", googleFamily: null, stack: "Georgia, 'Times New Roman', Times, serif", contexts: ["body", "heading"] },
  { name: "system-mono", label: "System monospace", category: "mono", googleFamily: null, stack: "'Courier New', Courier, monospace", contexts: ["body"] },

  // Sans-serif
  { name: "inter", label: "Inter", category: "sans-serif", googleFamily: "Inter", stack: "'Inter', system-ui, sans-serif", contexts: ["body", "heading"] },
  { name: "plus-jakarta-sans", label: "Plus Jakarta Sans", category: "sans-serif", googleFamily: "Plus Jakarta Sans", stack: "'Plus Jakarta Sans', system-ui, sans-serif", contexts: ["body", "heading"] },
  { name: "dm-sans", label: "DM Sans", category: "sans-serif", googleFamily: "DM Sans", stack: "'DM Sans', system-ui, sans-serif", contexts: ["body", "heading"] },
  { name: "lato", label: "Lato", category: "sans-serif", googleFamily: "Lato", stack: "'Lato', system-ui, sans-serif", contexts: ["body", "heading"] },
  { name: "open-sans", label: "Open Sans", category: "sans-serif", googleFamily: "Open Sans", stack: "'Open Sans', system-ui, sans-serif", contexts: ["body", "heading"] },
  { name: "nunito", label: "Nunito", category: "sans-serif", googleFamily: "Nunito", stack: "'Nunito', system-ui, sans-serif", contexts: ["body", "heading"] },

  // Serif
  { name: "source-serif-4", label: "Source Serif 4", category: "serif", googleFamily: "Source Serif 4", stack: "'Source Serif 4', Georgia, serif", contexts: ["body", "heading"] },
  { name: "merriweather", label: "Merriweather", category: "serif", googleFamily: "Merriweather", stack: "'Merriweather', Georgia, serif", contexts: ["body", "heading"] },
  { name: "lora", label: "Lora", category: "serif", googleFamily: "Lora", stack: "'Lora', Georgia, serif", contexts: ["body", "heading"] },
  { name: "libre-baskerville", label: "Libre Baskerville", category: "serif", googleFamily: "Libre Baskerville", stack: "'Libre Baskerville', Georgia, serif", contexts: ["body", "heading"] },

  // Display serif (headings only)
  { name: "playfair-display", label: "Playfair Display", category: "display-serif", googleFamily: "Playfair Display", stack: "'Playfair Display', Georgia, serif", contexts: ["heading"] },
  { name: "dm-serif-display", label: "DM Serif Display", category: "display-serif", googleFamily: "DM Serif Display", stack: "'DM Serif Display', Georgia, serif", contexts: ["heading"] },
  { name: "fraunces", label: "Fraunces", category: "display-serif", googleFamily: "Fraunces", stack: "'Fraunces', Georgia, serif", contexts: ["heading"] },

  // Geometric sans
  { name: "space-grotesk", label: "Space Grotesk", category: "geometric", googleFamily: "Space Grotesk", stack: "'Space Grotesk', system-ui, sans-serif", contexts: ["body", "heading"] },
  { name: "sora", label: "Sora", category: "geometric", googleFamily: "Sora", stack: "'Sora', system-ui, sans-serif", contexts: ["body", "heading"] },
  { name: "raleway", label: "Raleway", category: "geometric", googleFamily: "Raleway", stack: "'Raleway', system-ui, sans-serif", contexts: ["body", "heading"] },

  // Monospace
  { name: "jetbrains-mono", label: "JetBrains Mono", category: "mono", googleFamily: "JetBrains Mono", stack: "'JetBrains Mono', 'Courier New', monospace", contexts: ["body"] },
  { name: "ibm-plex-mono", label: "IBM Plex Mono", category: "mono", googleFamily: "IBM Plex Mono", stack: "'IBM Plex Mono', 'Courier New', monospace", contexts: ["body"] },
];

export const FONT_CATEGORIES: { id: FontDefinition["category"]; label: string }[] = [
  { id: "sans-serif", label: "Sans-serif" },
  { id: "serif", label: "Serif" },
  { id: "display-serif", label: "Display serif" },
  { id: "geometric", label: "Geometric" },
  { id: "mono", label: "Monospace" },
];

export function getFontByName(name: string): FontDefinition | undefined {
  return FONTS.find((f) => f.name === name);
}

export function buildGoogleFontsUrl(fontNames: string[]): string | null {
  const families = fontNames
    .map((name) => getFontByName(name))
    .filter((f): f is FontDefinition => !!f && f.googleFamily !== null)
    .map((f) => `family=${encodeURIComponent(f.googleFamily!)}:wght@400;500;600;700`);

  if (families.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}
