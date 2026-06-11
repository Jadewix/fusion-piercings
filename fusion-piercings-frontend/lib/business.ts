// lib/business.ts
// Single source of truth for the studio's public business info (NAP = Name,
// Address, Phone), location, hours, and service area. Used by the SEO/JSON-LD,
// the footer, and the legal pages — so you fill these details in ONE place.
// Replace every [bracketed] placeholder with your real details.
//
// NAP CONSISTENCY MATTERS: the name/address/phone here should match your Google
// Business Profile and social bios exactly — Google uses that consistency to
// trust and rank a local business.

export const BUSINESS = {
  name: 'Fusion Piercings',
  legalName: '[Legal Business Name — e.g. Fusion Piercings SARL]',

  // Contact
  email:        '[support email — e.g. hello@fusionpiercings.com]',
  phone:        '+961 71 433 119',   // human-readable
  phoneE164:    '+96171433119',      // for tel: links and schema
  whatsappLink: 'https://wa.me/96171433119',

  // Location
  street:      '[Studio street + building, Zgharta]',
  locality:    'Zgharta',
  region:      'North Governorate',  // schema.org addressRegion
  regionLabel: 'North Lebanon',      // friendly label used in page copy
  postalCode:  '',
  country:     'Lebanon',
  countryCode: 'LB',
  // Approximate Zgharta town centre. Replace with your EXACT studio pin: open
  // Google Maps, right-click your location, then click the lat,lng to copy it.
  geo: { lat: 34.3978, lng: 35.8953 },

  // Opening hours. Fill in, e.g.:
  //   { days: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], opens: '11:00', closes: '19:00' }
  hours: [] as Array<{ days: string[]; opens: string; closes: string }>,

  // Towns/areas you serve (used in JSON-LD areaServed + page copy).
  areaServed: ['Zgharta', 'Ehden', 'North Lebanon'],

  // Social
  instagram: 'https://www.instagram.com/fusionpiercings/',
  tiktok:    'https://www.tiktok.com/@rita.sayde',
};

/**
 * Studio locations available for in-person appointments. Used by the booking
 * form dropdown and the footer. The first entry is treated as the primary
 * studio (matches BUSINESS.locality above) for SEO/JSON-LD purposes.
 */
export const LOCATIONS = [
  { value: 'zgharta', label: 'Zgharta', region: 'North Lebanon' },
  { value: 'batroun', label: 'Batroun', region: 'North Lebanon' },
  { value: 'adma',    label: 'Adma',    region: 'Mount Lebanon' },
] as const;

export type LocationValue = typeof LOCATIONS[number]['value'];

/** True once a placeholder has been replaced with a real value. */
export const isFilled = (v?: string): boolean => !!v && !v.trim().startsWith('[');

/** "Street, Zgharta, North Lebanon, Lebanon" — skips the street until it's filled. */
export const addressDisplay = (): string =>
  [
    isFilled(BUSINESS.street) ? BUSINESS.street : null,
    `${BUSINESS.locality}, ${BUSINESS.regionLabel}`,
    BUSINESS.country,
  ].filter(Boolean).join(', ');

/** Human-readable hours, or a placeholder until BUSINESS.hours is filled. */
export const hoursDisplay = (): string =>
  BUSINESS.hours.length
    ? BUSINESS.hours
        .map((h) => `${h.days[0]}–${h.days[h.days.length - 1]} ${h.opens}–${h.closes}`)
        .join('; ')
    : '[Business hours — e.g. Mon–Sat, 11:00–19:00]';
