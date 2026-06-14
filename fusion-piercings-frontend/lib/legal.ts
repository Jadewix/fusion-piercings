// lib/legal.ts
// Legal-page text. Shared business details (name, address, phone, email, hours,
// socials) come from lib/business.ts so you fill them in ONE place; the fields
// below are specific to the legal pages.
// Everything here is AI-drafted general information, NOT legal advice — have a
// lawyer review before relying on it.
import { BUSINESS, addressDisplay, hoursDisplay } from './business';

export const LEGAL = {
  // Identity & jurisdiction
  tradeName:      BUSINESS.name,
  businessName:   BUSINESS.legalName,
  country:        BUSINESS.country,
  governingCity:  'Lebanon',
  registration:   '', // optional commercial register / VAT no. Leave '' to hide the line.

  // Contact (from lib/business.ts)
  email:          BUSINESS.email,
  whatsapp:       BUSINESS.phone,
  whatsappLink:   BUSINESS.whatsappLink,
  address:        addressDisplay(),
  hours:          hoursDisplay(),

  // Delivery
  courier:        'third-party courier companies or our own drivers',
  deliveryAreas:  'all governorates',
  deliveryTime:   '3–5 business days',
  freeShipThreshold: 75, // USD
  deliveryFee:    3,     // USD

  // Returns
  returnWindowDays: 14,
  refundMethod:   'cash, handed to you by our driver',

  // Social (from lib/business.ts)
  instagram:      BUSINESS.instagram,
  tiktok:         BUSINESS.tiktok,

  // Shown as "Last updated" on every legal page.
  lastUpdated:    'June 14, 2026',
};
