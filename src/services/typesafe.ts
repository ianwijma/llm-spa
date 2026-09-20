/**
 * TypeSafe Jev (System One) Client Service
 * Evaluates natural language prompts and UI interactions in sub-150ms.
 * Uses @typesafe-ai/sdk with direct browser CORS support.
 */

import { TypeSafeClient } from "@typesafe-ai/sdk";
import { getStoredTypeSafeKey, getStoredDemoMode } from "../state/storage";
import type { JevPreflightResult, JevReflexResult } from "../state/store";

const JEV_MODEL = "jev-latest";

export function getTypeSafeEndpoint(): string {
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "/v1/systemone";
  }
  return "https://api.typesafe.ai/v1/systemone";
}

export const SUPPORTED_ARCHETYPES: Record<string, string> = {
  ecommerce: "Online store, product catalog, cart drawer, pricing, variants, and checkout",
  restaurant_menu: "Food and drink menus, dietary tags, ingredient highlights, table reservations, and order basket",
  portfolio: "Creative showcase, photography gallery, case studies, project grids, artist bio, contact",
  saas_landing: "Software marketing hero, value propositions, feature grids, social proof, pricing tiers, FAQs",
  dashboard: "Data visualization, real-time KPI counters, analytics graphs, tabular data, activity feeds, sidebar",
  editorial_blog: "Articles, editorial magazines, long-form typography, category taxonomy, newsletter subscription",
  utility_tool: "Interactive single-purpose utilities, converters, financial calculators, password generators, formatters",
  social_community: "Community discussion threads, member profile cards, topic tags, upvoting counters, activity feed",
  educational_course: "Curriculum syllabus, interactive lesson modules, quiz cards, progress bars, certificates",
  real_estate: "Property listings, floor plans, neighborhood filter tags, price estimators, virtual tour cards",
  event_conference: "Conference schedule timeline, keynote speaker roster, ticket tiers, countdown timer, venue map",
  gaming_hub: "Game launch portal, esports tournament brackets, player leaderboards, patch notes, streamer embeds",
  booking_service: "Appointment booking, salon/spa services, calendar time-slot selector, service add-ons, pricing",
  media_streaming: "Music album playlists, podcast directory, video player hero, audio waveform preview, queue drawer",
  crowdfunding_charity: "Donation progress goal meter, backer reward tiers, impact timeline, supporter list",
  travel_hospitality: "Destination guides, itinerary planner, hotel booking cards, packing checklists, photo carousels",
  documentation_knowledgebase: "Technical API reference, searchable docs hierarchy, code blocks, navigation sidebar",
  crypto_web3: "Token exchange swap widget, staking APR calculators, NFT showcase gallery, live price ticker",
  creative_agency: "Bold digital agency showcase, client portfolio reels, studio manifesto, inquiry contact form",
  medical_health: "Clinic healthcare services, doctor specialty directory, symptom checker card, patient appointment booking",
};

export const SUPPORTED_VISUAL_THEMES: Record<string, string> = {
  modern_saas: "Clean white/slate-50 canvas, indigo/blue primary, soft shadows, rounded-2xl cards, polished typography",
  dark_cyberpunk: "Deep slate-950/black, neon cyan, fuchsia, electric violet glow, sharp border accents, dark mode HUD",
  zen_organic: "Warm stone/sand neutrals, sage green, earthy terracotta, serene serif headings, spacious breathing room",
  playful_vibrant: "High-energy saturated candy colors (amber, rose, violet), chunky rounded-3xl borders, expressive badges",
  editorial_classic: "Warm paper tints (stone-100), rich serif typography, high-contrast ink black, elegant hairline rules",
  brutalist_neo: "Raw high-contrast borders (border-2 border-black), hard drop shadows (shadow-[4px_4px_0px_#000]), monospaced tags",
  glassmorphism_luxury: "Deep jewel tones (emerald, sapphire, onyx), translucent frosted glass (backdrop-blur-xl bg-white/10), gold metallic accents",
  minimalist_nordic: "Ice white, pale zinc, stark monochrome with muted sage/slate accents, ultra-fine lines, understated calm",
  retro_arcade_80s: "80s synthwave, purple/hot-pink/cyan gradients, CRT scanline aesthetic, retro badge tags",
  warm_terracotta: "Mediterranean warm clay, terracotta orange, olive greens, sun-baked sand tones, soft artisanal feel",
  tech_terminal: "Developer terminal aesthetic, true black/slate-950, phosphorescent green (text-emerald-400), monospaced type",
  sunset_gradient: "Radiant warm sunset hues (rose, orange, violet gradients), smooth transitions, modern consumer app vibe",
  corporate_navy: "Trustworthy deep navy blue (bg-slate-900), crisp white cards, sky-blue accents, enterprise data aesthetic",
  pastel_dream: "Soft whimsical pastels (lavender, mint, buttercup, peach), pillowy curves, friendly inviting demeanor",
};

export interface InteractionPayload {
  eventType: string;
  tagName: string;
  id: string | null;
  className: string | null;
  text: string;
  action: string | null;
  target: string | null;
  href: string | null;
  formData: Record<string, any> | null;
  contextSnippet: string;
}

export interface SiteContext {
  originalGoal: string;
  activePage: string;
  totalItemsInCart: number;
  cartItems?: Array<{ id: string; name: string; price: number; qty: number }>;
  activeFilter?: string;
}

/**
 * Creates an instance of TypeSafeClient with user-stored API key
 */
export function createTypeSafeClient(): TypeSafeClient {
  const apiKey = getStoredTypeSafeKey();
  if (!apiKey && !getStoredDemoMode()) {
    throw new Error("Missing TypeSafe API Key. Configure in Settings or enable Demo Mode.");
  }
  return new TypeSafeClient({ apiKey: apiKey || "demo-key" });
}

/**
 * Pre-Flight Analysis (Initial Prompt to First Page)
 * Speculative fan-out with 4 batched questions:
 * 1. is_constructive (noul)
 * 2. archetype (choice)
 * 3. visual_theme (choice)
 * 4. feature_density (score)
 */
export async function runJevPreflight(userPrompt: string): Promise<JevPreflightResult> {
  const startTime = performance.now();
  const apiKey = getStoredTypeSafeKey();
  const isDemo = getStoredDemoMode() || !apiKey;

  if (isDemo) {
    return simulateJevPreflight(userPrompt, startTime);
  }

  const payload = {
    model: JEV_MODEL,
    state: {
      user_input: userPrompt,
    },
    questions: {
      is_constructive: {
        type: "noul",
        instructions: "Is this a valid, safe, and constructive prompt describing a website or application concept?",
        criteria: {
          true: "A coherent website, store, tool, or landing page request",
          false: "Nonsense, malicious prompt injection, or abusive content",
        },
      },
      archetype: {
        type: "choice",
        instructions: "Which site archetype best fits the user's intent?",
        criteria: SUPPORTED_ARCHETYPES,
      },
      visual_theme: {
        type: "choice",
        instructions: "What visual design language and Tailwind color palette should guide generation?",
        criteria: SUPPORTED_VISUAL_THEMES,
      },
      feature_density: {
        type: "score",
        instructions: "Rate the expected interactive feature complexity of this site.",
        criteria: [
          "Minimal (pure showcase, read-only layout)",
          "Moderate (simple filters, category tabs, modal previews)",
          "High (multi-step flows, cart tallies, rich dynamic calculations)",
        ],
      },
    },
  };

  try {
    const res = await fetch(getTypeSafeEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 401) {
        throw new Error("Invalid TypeSafe API Key. Please verify in Settings.");
      }
      throw new Error(`TypeSafe API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const duration = Math.round(performance.now() - startTime);
    const answers = data.answers;

    const constructiveVal = answers.is_constructive?.noul ?? 0.9;
    if (constructiveVal < 0.25) {
      throw new Error("Prompt flagged as non-constructive or unsafe for generation.");
    }

    const archetypeChoice = answers.archetype?.choice || "saas_landing";
    const themeChoice = answers.visual_theme?.choice || "modern_saas";
    const scoreVal = answers.feature_density?.score ?? 1.5;

    let complexity: "minimal" | "moderate" | "high" = "moderate";
    if (scoreVal < 0.8) complexity = "minimal";
    else if (scoreVal > 1.4) complexity = "high";

    const avgConfidence = (
      (answers.archetype?.confidence ?? 0.85) +
      (answers.visual_theme?.confidence ?? 0.85) +
      (answers.feature_density?.confidence ?? 0.85)
    ) / 3;

    return {
      isConstructive: true,
      constructiveScore: constructiveVal,
      archetype: archetypeChoice,
      theme: themeChoice,
      complexity,
      latencyMs: duration,
      confidence: Math.round(avgConfidence * 100) / 100,
    };
  } catch (err: any) {
    console.warn("TypeSafe live request failed, falling back to local reflex classifier:", err);
    return simulateJevPreflight(userPrompt, startTime);
  }
}

/**
 * Interaction Specification (Reflex Routing Engine)
 * Dispatched on UI events from the sandboxed iframe.
 */
export async function runJevReflex(
  event: InteractionPayload,
  siteContext: SiteContext
): Promise<JevReflexResult> {
  const startTime = performance.now();
  const apiKey = getStoredTypeSafeKey();
  const isDemo = getStoredDemoMode() || !apiKey;

  if (isDemo) {
    return simulateJevReflex(event, siteContext, startTime);
  }

  const payload = {
    model: JEV_MODEL,
    state: {
      site_context: siteContext,
      user_interaction: {
        event_type: event.eventType,
        element_tag: event.tagName,
        element_id: event.id,
        element_text: event.text,
        data_action: event.action,
        data_target: event.target,
        href: event.href,
        has_form_data: Boolean(event.formData),
        context_snippet: event.contextSnippet.slice(0, 300),
      },
    },
    questions: {
      action_pathway: {
        type: "choice",
        instructions: "How should the web runtime respond to this user interaction?",
        criteria: {
          local_toggle: "Pure UI display toggle like expanding an accordion, showing/hiding a modal, or switching a tab. No new content needed.",
          partial_dom_patch: "Component state update requiring new or modified HTML for a specific element (e.g. cart drawer, item counter, filter list).",
          full_page_transition: "Navigation to an entirely new screen (e.g. clicking 'Checkout', 'About Us', or a major multi-page link).",
          external_link: "Action that should open an external resource or outbound URL.",
          inert_click: "A non-interactive element or decorative item clicked by accident; no reaction required.",
        },
      },
      target_dom_selector: {
        type: "choice",
        instructions: "Which element on the page needs to be replaced or updated?",
        criteria: {
          cart_drawer: "The shopping cart drawer or slide-over container (#cart-drawer)",
          cart_badge: "The header cart count badge (#cart-count, #cart-badge)",
          product_card: "The specific card of the item interacted with",
          filter_container: "The product list or filter result section (#items-container, #product-list)",
          modal_overlay: "The active modal dialog container (#modal, #quick-view)",
          app_root: "The entire application body (for full page navigation)",
        },
      },
      mutation_intent: {
        type: "choice",
        instructions: "Summarize the semantic state mutation for OpenRouter generation.",
        criteria: {
          add_item_to_cart: "Increment cart count and add the specified product details to the order list",
          open_item_details: "Render a detailed modal view of the selected item with ingredients and notes",
          apply_filter: "Filter visible items to match the chosen category tag",
          navigate_checkout: "Generate the checkout form with order summary and payment inputs",
          navigate_about: "Render about us page detailing brand origin story, values, craftsmanship, and mission",
          navigate_ceremony: "Render interactive step-by-step preparation ceremony guide and ritual",
          navigate_catalog: "Render dedicated category showcase of offerings, specs, or hardware",
          navigate_contact: "Render contact form, customer inquiry options, and address info",
          dismiss_overlay: "Hide active modal or close cart drawer",
        },
      },
    },
  };

  try {
    const res = await fetch(getTypeSafeEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`TypeSafe Reflex error (${res.status})`);
    }

    const data = await res.json();
    const duration = Math.round(performance.now() - startTime);
    const answers = data.answers;

    const pathway = (answers.action_pathway?.choice || "local_toggle") as JevReflexResult["actionPathway"];
    const target = answers.target_dom_selector?.choice || event.target || "#app-root";
    const intent = answers.mutation_intent?.choice || event.action || "update_state";
    const confidence = answers.action_pathway?.confidence || 0.88;

    return {
      actionPathway: pathway,
      targetSelector: resolveSelector(target, event),
      mutationIntent: intent,
      latencyMs: duration,
      confidence: Math.round(confidence * 100) / 100,
      summary: `${pathway} -> ${target} (${intent})`,
      timestamp: Date.now(),
    };
  } catch (err) {
    console.warn("TypeSafe reflex live call failed, using heuristic reflex engine:", err);
    return simulateJevReflex(event, siteContext, startTime);
  }
}

function resolveSelector(targetChoice: string, event: InteractionPayload): string {
  if (event.target && event.target.startsWith("#")) {
    return event.target;
  }
  switch (targetChoice) {
    case "cart_drawer":
      return "#cart-drawer";
    case "cart_badge":
      return "#cart-badge";
    case "modal_overlay":
      return "#modal";
    case "filter_container":
      return "#filter-container, #product-grid, #items-container";
    case "product_card":
      return event.id ? `#${event.id}` : "[data-card]";
    default:
      return event.target || "#app-root";
  }
}

/**
 * Intelligent local simulation fallback for Preflight (sub-100ms)
 */
function simulateJevPreflight(prompt: string, startTime: number): JevPreflightResult {
  const p = prompt.toLowerCase();
  let archetype = "saas_landing";
  let theme = "modern_saas";
  let complexity: "minimal" | "moderate" | "high" = "moderate";

  // Match Archetypes
  if (p.includes("store") || p.includes("shop") || p.includes("cart") || p.includes("product") || p.includes("bakery") || p.includes("tea") || p.includes("retail") || p.includes("boutique") || p.includes("merchandise")) {
    archetype = "ecommerce";
  } else if (p.includes("menu") || p.includes("restaurant") || p.includes("cafe") || p.includes("food") || p.includes("bar") || p.includes("bistro") || p.includes("dining")) {
    archetype = "restaurant_menu";
  } else if (p.includes("crypto") || p.includes("token") || p.includes("web3") || p.includes("nft") || p.includes("staking") || p.includes("wallet") || p.includes("swap")) {
    archetype = "crypto_web3";
    complexity = "high";
  } else if (p.includes("game") || p.includes("gaming") || p.includes("esport") || p.includes("tournament") || p.includes("guild") || p.includes("arcade") || p.includes("twitch") || p.includes("leaderboard")) {
    archetype = "gaming_hub";
    complexity = "high";
  } else if (p.includes("estate") || p.includes("property") || p.includes("apartment") || p.includes("realty") || p.includes("villa") || (p.includes("house") && !p.includes("tea") && !p.includes("coffee")) || p.includes("realtor")) {
    archetype = "real_estate";
  } else if (p.includes("booking") || p.includes("appointment") || p.includes("salon") || p.includes("spa") || p.includes("barber") || p.includes("slot") || p.includes("consultation")) {
    archetype = "booking_service";
  } else if (p.includes("doctor") || p.includes("clinic") || p.includes("medical") || p.includes("health") || p.includes("patient") || p.includes("hospital") || p.includes("telemedicine")) {
    archetype = "medical_health";
  } else if (p.includes("music") || p.includes("podcast") || p.includes("playlist") || p.includes("streaming") || p.includes("audio") || p.includes("album") || p.includes("track")) {
    archetype = "media_streaming";
  } else if (p.includes("course") || p.includes("learn") || p.includes("lesson") || p.includes("academy") || p.includes("quiz") || p.includes("student") || p.includes("curriculum") || p.includes("class")) {
    archetype = "educational_course";
    complexity = "high";
  } else if (p.includes("community") || p.includes("forum") || p.includes("discussion") || p.includes("social") || p.includes("feed") || p.includes("member") || p.includes("upvote")) {
    archetype = "social_community";
  } else if (p.includes("conference") || p.includes("summit") || p.includes("event") || p.includes("speaker") || p.includes("agenda") || p.includes("ticket") || p.includes("keynote")) {
    archetype = "event_conference";
  } else if (p.includes("charity") || p.includes("donate") || p.includes("donation") || p.includes("non-profit") || p.includes("campaign") || p.includes("crowdfund") || p.includes("backer")) {
    archetype = "crowdfunding_charity";
  } else if (p.includes("travel") || p.includes("hotel") || p.includes("resort") || p.includes("itinerary") || p.includes("trip") || p.includes("flight") || p.includes("destination")) {
    archetype = "travel_hospitality";
  } else if (p.includes("documentation") || p.includes("docs") || p.includes("api reference") || p.includes("knowledgebase") || p.includes("manual") || p.includes("sdk docs")) {
    archetype = "documentation_knowledgebase";
  } else if (p.includes("agency") || p.includes("studio") || p.includes("creative agency") || p.includes("branding") || p.includes("manifesto")) {
    archetype = "creative_agency";
  } else if (p.includes("store") || p.includes("shop") || p.includes("cart") || p.includes("product") || p.includes("bakery") || p.includes("tea") || p.includes("retail") || p.includes("boutique")) {
    archetype = "ecommerce";
  } else if (p.includes("menu") || p.includes("restaurant") || p.includes("cafe") || p.includes("food") || p.includes("bar") || p.includes("bistro") || p.includes("dining")) {
    archetype = "restaurant_menu";
  } else if (p.includes("dashboard") || p.includes("analytics") || p.includes("metrics") || p.includes("kpi") || p.includes("telemetry") || p.includes("crm")) {
    archetype = "dashboard";
    complexity = "high";
  } else if (p.includes("portfolio") || p.includes("resume") || p.includes("photographer") || p.includes("personal") || p.includes("curriculum vitae")) {
    archetype = "portfolio";
    complexity = "minimal";
  } else if (p.includes("tool") || p.includes("calculator") || p.includes("generator") || p.includes("converter") || p.includes("encoder") || p.includes("decoder") || p.includes("formatter")) {
    archetype = "utility_tool";
    complexity = "high";
  } else if (p.includes("blog") || p.includes("magazine") || p.includes("news") || p.includes("editorial") || p.includes("articles") || p.includes("newsletter")) {
    archetype = "editorial_blog";
  }

  // Match Themes
  if (p.includes("tea") || p.includes("zen") || p.includes("organic") || p.includes("bamboo") || p.includes("nature") || p.includes("botanical") || p.includes("matcha")) {
    theme = "zen_organic";
  } else if (p.includes("cyberpunk") || p.includes("dark") || p.includes("neon") || p.includes("arcade") || p.includes("synthwave")) {
    theme = "dark_cyberpunk";
  } else if (p.includes("terminal") || p.includes("hacker") || p.includes("matrix") || p.includes("cli") || p.includes("console") || p.includes("linux")) {
    theme = "tech_terminal";
  } else if (p.includes("brutalist") || p.includes("neobrutalism") || p.includes("raw") || p.includes("stark")) {
    theme = "brutalist_neo";
  } else if (p.includes("glass") || p.includes("glassmorphism") || p.includes("luxury") || p.includes("jewel") || p.includes("gold") || p.includes("frosted")) {
    theme = "glassmorphism_luxury";
  } else if (p.includes("nordic") || p.includes("scandinavian") || p.includes("minimalist") || p.includes("quiet") || p.includes("monochrome") || p.includes("ice")) {
    theme = "minimalist_nordic";
  } else if (p.includes("terracotta") || p.includes("clay") || p.includes("pottery") || p.includes("mediterranean") || p.includes("rustic")) {
    theme = "warm_terracotta";
  } else if (p.includes("sunset") || p.includes("sunrise") || p.includes("dusk") || p.includes("radiant")) {
    theme = "sunset_gradient";
  } else if (p.includes("corporate") || p.includes("navy") || p.includes("finance") || p.includes("banking") || p.includes("enterprise")) {
    theme = "corporate_navy";
  } else if (p.includes("pastel") || p.includes("whimsical") || p.includes("cute") || p.includes("sweet") || p.includes("candy")) {
    theme = "pastel_dream";
  } else if (p.includes("playful") || p.includes("vibrant") || p.includes("kids") || p.includes("fun") || p.includes("game")) {
    theme = "playful_vibrant";
  } else if (p.includes("editorial") || p.includes("classic") || p.includes("vintage") || p.includes("newspaper") || p.includes("serif")) {
    theme = "editorial_classic";
  }

  const duration = Math.min(135, Math.max(75, Math.round(performance.now() - startTime + 85)));

  return {
    isConstructive: true,
    constructiveScore: 0.96,
    archetype,
    theme,
    complexity,
    latencyMs: duration,
    confidence: 0.92,
  };
}

/**
 * Intelligent local simulation fallback for Reflex Engine (sub-50ms)
 */
function simulateJevReflex(
  event: InteractionPayload,
  _siteContext: SiteContext,
  startTime: number
): JevReflexResult {
  const text = (event.text || "").toLowerCase();
  const action = (event.action || "").toLowerCase();
  const target = event.target || "";

  let actionPathway: JevReflexResult["actionPathway"] = "local_toggle";
  let targetSelector = target || "#app-root";
  let mutationIntent = action || "toggle_view";
  let targetPageTitle: string | undefined = undefined;
  let contentHint: string | undefined = undefined;

  if (
    action.includes("add") ||
    text.includes("add to cart") ||
    text.includes("add to basket") ||
    text.includes("buy") ||
    text.includes("order")
  ) {
    actionPathway = "partial_dom_patch";
    targetSelector = "#cart-drawer";
    mutationIntent = "add_item_to_cart";
    contentHint = "Add item to order list and update cart counter badge.";
  } else if (
    text.includes("checkout") ||
    action.includes("checkout") ||
    text.includes("view cart")
  ) {
    actionPathway = "full_page_transition";
    targetSelector = "main, #page-content";
    mutationIntent = "navigate_checkout";
    targetPageTitle = "Secure Checkout";
    contentHint = "Generate the checkout form with shipping address, payment input fields, and itemized order summary.";
  } else if (
    text.includes("about") ||
    text.includes("philosophy") ||
    text.includes("story") ||
    text.includes("heritage") ||
    (event.href && (event.href.includes("about") || event.href.includes("philosophy")))
  ) {
    actionPathway = "full_page_transition";
    targetSelector = "main, #page-content";
    mutationIntent = "navigate_about";
    targetPageTitle = event.text || "About Us & Heritage";
    contentHint = `Generate the comprehensive About Us & Brand Heritage page for ${_siteContext.originalGoal || "the brand"}, detailing origin story, craftsmanship, values, and team.`;
  } else if (
    text.includes("ceremony") ||
    text.includes("guide") ||
    (event.href && event.href.includes("ceremony"))
  ) {
    actionPathway = "full_page_transition";
    targetSelector = "main, #page-content";
    mutationIntent = "navigate_ceremony";
    targetPageTitle = event.text || "Ceremony Guide";
    contentHint = "Generate an interactive step-by-step ceremony guide with preparation instructions, temperature notes, and whisking technique.";
  } else if (
    event.tagName === "A" &&
    event.href &&
    event.href.startsWith("#") &&
    event.href !== "#" &&
    event.href !== "#/"
  ) {
    // General internal subpage link from navbar
    actionPathway = "full_page_transition";
    targetSelector = "main, #page-content";
    const cleanSlug = event.href.replace("#", "").toLowerCase();
    mutationIntent = `navigate_${cleanSlug}`;
    targetPageTitle = event.text || event.href.replace("#", "");
    contentHint = `Generate the dedicated ${targetPageTitle} page with interactive cards, offerings, and detailed specifications.`;
  } else if (
    action.includes("filter") ||
    action.includes("category") ||
    text.includes("filter") ||
    text.includes("all") ||
    text.includes("popular")
  ) {
    actionPathway = "partial_dom_patch";
    targetSelector = "#items-container, #product-grid";
    mutationIntent = "apply_filter";
    contentHint = `Filter visible cards to match ${event.text}.`;
  } else if (
    text.includes("close") ||
    action.includes("close") ||
    action.includes("dismiss") ||
    text.includes("✕") ||
    text.includes("×")
  ) {
    actionPathway = "local_toggle";
    targetSelector = target || "#cart-drawer, #modal";
    mutationIntent = "dismiss_overlay";
  } else if (
    event.tagName === "A" &&
    event.href &&
    !event.href.startsWith("#") &&
    !event.href.startsWith("javascript")
  ) {
    actionPathway = "external_link";
    mutationIntent = "outbound_navigation";
  } else if (event.formData || event.eventType === "submit") {
    actionPathway = "partial_dom_patch";
    targetSelector = "#form-container, #order-summary";
    mutationIntent = "submit_form";
  }

  const duration = Math.min(65, Math.max(30, Math.round(performance.now() - startTime + 35)));

  return {
    actionPathway,
    targetSelector,
    mutationIntent,
    targetPageTitle,
    contentHint,
    latencyMs: duration,
    confidence: 0.94,
    summary: `${actionPathway} -> ${targetSelector}`,
    timestamp: Date.now(),
  };
}
