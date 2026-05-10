import 'server-only'
import { tool } from 'ai'
import { z } from 'zod'
import { fetchPartnerLiveOffers } from '../live-offers-server'
import { getLiveHotelOffers } from '../booking-hotels'
import { googleProvider } from './provider'

/**
 * Tools exposed to the assistant. Each tool returns plain JSON; the client
 * renders the result with a dedicated generative-UI component (see
 * components/assistant/generative/*).
 *
 * Tool names map 1:1 to part types on the client (`tool-<name>`).
 */

export const searchFlightsTool = tool({
  description:
    'Search live flight offers between two cities/airports. Use IATA codes (e.g. RUH, JED, DXB, IST) when you know them, otherwise pass city names. Returns up to 8 sorted-by-price offers from Travelpayouts and Duffel.',
  inputSchema: z.object({
    origin: z
      .string()
      .describe('Origin city name or IATA code, e.g. "Riyadh" or "RUH".'),
    destination: z
      .string()
      .describe('Destination city name or IATA code, e.g. "Istanbul" or "IST".'),
    departure_date: z
      .string()
      .optional()
      .describe('YYYY-MM-DD departure date. Omit if user did not specify.'),
    return_date: z
      .string()
      .optional()
      .describe('YYYY-MM-DD return date for round-trip. Omit for one-way.'),
    adults: z.number().int().min(1).max(9).default(1),
    children: z.number().int().min(0).max(9).default(0),
    cabin_class: z.enum(['Y', 'C']).default('Y').describe('Y = economy, C = business'),
    currency: z.string().default('SAR').describe('ISO currency code, default SAR'),
  }),
  execute: async (input) => {
    const offers = await fetchPartnerLiveOffers({
      origin: input.origin,
      destination: input.destination,
      departure_date: input.departure_date,
      return_date: input.return_date,
      trip_type: input.return_date ? 'round_trip' : 'one_way',
      adults: input.adults,
      children: input.children,
      cabin_class: input.cabin_class,
      currency: input.currency,
    })

    const top = offers.slice(0, 8).map((o) => ({
      id: o.id,
      origin: o.origin_iata,
      destination: o.destination_iata,
      origin_city: o.origin_city,
      destination_city: o.destination_city,
      departing_at: o.departing_at,
      arriving_at: o.arriving_at,
      price: o.price_amount,
      currency: o.price_currency,
      airline: o.airline_name,
      airline_iata: o.airline_iata,
      flight_number: o.flight_number,
      transfers: o.transfers,
      duration_minutes: o.duration_minutes,
      booking_url: o.affiliate_url,
      source: o.source ?? 'travelpayouts',
    }))

    return {
      query: {
        origin: input.origin,
        destination: input.destination,
        departure_date: input.departure_date,
        return_date: input.return_date,
        adults: input.adults,
        children: input.children,
        cabin_class: input.cabin_class,
        currency: input.currency,
      },
      count: top.length,
      offers: top,
    }
  },
})

export const searchHotelsTool = tool({
  description:
    'Search live hotel offers in a city. Provide either an IATA city code (DXB, IST, RUH, JED, MAD) or a city name. Returns hotels with star rating and starting price.',
  inputSchema: z.object({
    destination_iata: z
      .string()
      .optional()
      .describe('IATA code if known (e.g. DXB).'),
    city: z.string().optional().describe('City name fallback (e.g. "Dubai").'),
    checkin: z.string().optional().describe('YYYY-MM-DD'),
    checkout: z.string().optional().describe('YYYY-MM-DD'),
    adults: z.number().int().min(1).max(8).default(2),
    currency: z.string().default('SAR'),
    limit: z.number().int().min(1).max(12).default(8),
  }),
  execute: async (input) => {
    const offers = await getLiveHotelOffers({
      destination_iata: input.destination_iata,
      city: input.city,
      checkin: input.checkin,
      checkout: input.checkout,
      adults: input.adults,
      currency: input.currency,
      limit: input.limit,
    })

    const items = offers.map((h) => ({
      id: h.id,
      name: h.hotel_name || `${h.tier_label_en} stay in ${h.city}`,
      city: h.city,
      country: h.country,
      stars: h.star_rating,
      tier: h.tier,
      price_from: h.price_from,
      currency: h.price_currency,
      image_url: h.image_url,
      booking_url: h.affiliate_url,
      property_count: h.property_count,
      checkin: h.checkin,
      checkout: h.checkout,
      lat: h.hotel_lat,
      lng: h.hotel_lng,
      source: h.source,
    }))

    return {
      query: {
        city: input.city || input.destination_iata,
        checkin: input.checkin,
        checkout: input.checkout,
        adults: input.adults,
        currency: input.currency,
      },
      count: items.length,
      hotels: items,
    }
  },
})

export const compareHotelsTool = tool({
  description:
    'Build a side-by-side comparison from a list of hotel offers the user is choosing between. Pass the offers you already retrieved earlier — do not invent new data. Highlights: price, stars, tier, and a one-line pro/con per hotel.',
  inputSchema: z.object({
    hotels: z
      .array(
        z.object({
          name: z.string(),
          stars: z.number().min(0).max(5),
          tier: z.enum(['luxury', 'comfort', 'budget']),
          price_from: z.number(),
          currency: z.string(),
          image_url: z.string().optional(),
          booking_url: z.string().optional(),
          pros: z.array(z.string()).max(3),
          cons: z.array(z.string()).max(3),
        })
      )
      .min(2)
      .max(4),
    summary: z
      .string()
      .describe('1-2 sentence verdict in the user\'s language.'),
  }),
  execute: async (input) => input,
})

/**
 * Web search via Gemini's built-in Google Search grounding.
 *
 * We expose this as a dedicated tool the model can call. Internally we run a
 * lightweight `generateText` against Gemini with `googleSearch` enabled and
 * return the answer + the grounded sources for citation rendering.
 */
export const webSearchTool = tool({
  description:
    'Search the web for current information about airlines, travel news, reviews, advisories, or to find better/cheaper offers. Use this when the user asks about reviews, opinions, baggage rules, or anything that needs up-to-date public info.',
  inputSchema: z.object({
    query: z.string().describe('Concise search query in the same language as the user.'),
    focus: z
      .enum(['airline_review', 'hotel_review', 'better_offer', 'travel_news', 'general'])
      .default('general'),
  }),
  execute: async ({ query, focus }) => {
    const { generateText } = await import('ai')
    try {
      const result = await generateText({
        model: googleProvider(process.env.GEMINI_SEARCH_MODEL || 'gemini-2.5-flash'),
        prompt: `Search the web and answer concisely (3-5 sentences). Focus: ${focus}. Query: ${query}`,
        tools: { google_search: googleProvider.tools.googleSearch({}) },
      })

      // Extract grounded sources where available
      type Source = { url?: string; title?: string; snippet?: string }
      const sources: Source[] = []
      const meta = (result as unknown as { providerMetadata?: { google?: { groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> } } } }).providerMetadata
      const chunks = meta?.google?.groundingMetadata?.groundingChunks ?? []
      for (const c of chunks) {
        if (c.web?.uri) sources.push({ url: c.web.uri, title: c.web.title })
      }

      return {
        query,
        focus,
        answer: result.text,
        sources: sources.slice(0, 6),
      }
    } catch (err) {
      console.error('[webSearch] failed', err)
      return {
        query,
        focus,
        answer: '',
        sources: [] as Array<{ url?: string; title?: string }>,
        error: 'Web search unavailable',
      }
    }
  },
})

export const assistantTools = {
  searchFlights: searchFlightsTool,
  searchHotels: searchHotelsTool,
  compareHotels: compareHotelsTool,
  webSearch: webSearchTool,
} as const

export type AssistantToolName = keyof typeof assistantTools
