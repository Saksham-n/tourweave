/**
 * preferenceService.js
 * Maps a user's raw Travel DNA into a structured, normalized preference profile.
 * This is the foundational service for all AI recommendation features.
 */

/**
 * Budget display metadata
 */
const BUDGET_META = {
  Budget: {
    label: 'Budget / Backpacker',
    emoji: '🎒',
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
    description: 'Cost-efficient travel with local stays and street food.',
  },
  Moderate: {
    label: 'Moderate / Standard',
    emoji: '🏨',
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
    description: 'Balanced comfort and experiences without breaking the bank.',
  },
  Luxury: {
    label: 'Luxury / Premium',
    emoji: '✨',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    description: 'Premium stays, fine dining, and curated exclusive experiences.',
  },
};

/**
 * Travel style display metadata
 */
const STYLE_META = {
  Adventure: {
    label: 'Adventure / Adrenaline',
    emoji: '🏔️',
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
    traits: ['Trekking', 'Rafting', 'Camping', 'Extreme Sports'],
    destinations: ['Jammu & Kashmir', 'Uttarakhand', 'Himachal Pradesh'],
  },
  Relaxation: {
    label: 'Relaxation / Beach',
    emoji: '🌊',
    color: '#06b6d4',
    bg: '#ecfeff',
    border: '#a5f3fc',
    traits: ['Beaches', 'Spas', 'Sunsets', 'Slow Travel'],
    destinations: ['Goa', 'Kerala Backwaters', 'Andaman Islands'],
  },
  Cultural: {
    label: 'Cultural / Heritage',
    emoji: '🏛️',
    color: '#f97316',
    bg: '#fff7ed',
    border: '#fed7aa',
    traits: ['Museums', 'Architecture', 'Festivals', 'Local Cuisine'],
    destinations: ['Madhya Pradesh', 'Rajasthan', 'Agra'],
  },
  Urban: {
    label: 'Urban / City Explorer',
    emoji: '🏙️',
    color: '#6b7280',
    bg: '#f9fafb',
    border: '#e5e7eb',
    traits: ['Nightlife', 'Cafés', 'Shopping', 'Street Art'],
    destinations: ['Mumbai', 'Delhi', 'Bengaluru'],
  },
  Nature: {
    label: 'Nature / Wildlife',
    emoji: '🌿',
    color: '#1b803a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    traits: ['Wildlife Safaris', 'Forests', 'Bird Watching', 'Hill Stations'],
    destinations: ['Madhya Pradesh', 'Kerala', 'Coorg'],
  },
};

/**
 * Derives a traveler personality type from DNA fields.
 * @param {string} style - travel_style value
 * @param {string} budget - budget value
 * @param {string[]} interests - interests array
 * @returns {{ title: string, subtitle: string, emoji: string }}
 */
const derivePersonalityType = (style, budget, interests) => {
  // Spirit-based combinations
  if (style === 'Adventure' && budget === 'Budget') {
    return { title: 'The Wild Wanderer', subtitle: 'Raw trails, zero frills, maximum stories.', emoji: '🧗' };
  }
  if (style === 'Cultural' && interests.some(i => /heritage|histor|museum/i.test(i))) {
    return { title: 'The Culture Archaeologist', subtitle: 'Every ruin has a story waiting for you.', emoji: '🏺' };
  }
  if (style === 'Relaxation' && budget === 'Luxury') {
    return { title: 'The Serene Luxurist', subtitle: 'Bliss is a private pool and a sunset view.', emoji: '🌅' };
  }
  if (style === 'Nature' && interests.some(i => /wildlife|forest|safari/i.test(i))) {
    return { title: 'The Forest Keeper', subtitle: 'You belong where the signal fades and the leaves whisper.', emoji: '🦁' };
  }
  if (style === 'Urban') {
    return { title: 'The City Nomad', subtitle: 'You read cities like books — cover to cover.', emoji: '🗺️' };
  }
  if (style === 'Adventure') {
    return { title: 'The Adrenaline Pilgrim', subtitle: 'Altitude is your natural habitat.', emoji: '🏔️' };
  }
  if (style === 'Cultural') {
    return { title: 'The Cultural Explorer', subtitle: 'You travel to understand, not just to see.', emoji: '🎭' };
  }
  if (style === 'Relaxation') {
    return { title: 'The Mindful Drifter', subtitle: 'Slow mornings, good light, and zero rush.', emoji: '🌊' };
  }
  if (style === 'Nature') {
    return { title: 'The Eco Voyager', subtitle: 'Leaves a small footprint, carries a big awe.', emoji: '🌿' };
  }
  return { title: 'The Free Spirit', subtitle: 'No fixed category. Just pure wanderlust.', emoji: '✈️' };
};

/**
 * Builds a normalized preference profile from raw Travel DNA data.
 * The returned object is the single source of truth used by all AI features.
 *
 * @param {object|null} dna - Raw Travel DNA from dnaService (or null if not set)
 * @returns {object|null} Normalized preference profile, or null if DNA is missing
 */
export const buildPreferenceProfile = (dna) => {
  if (!dna) return null;

  const budget = dna.budget || 'Moderate';
  const style = dna.travel_style || '';
  const interests = Array.isArray(dna.interests) ? dna.interests : [];
  const preferredStates = Array.isArray(dna.preferred_destinations)
    ? dna.preferred_destinations
    : [];

  const budgetMeta = BUDGET_META[budget] || BUDGET_META.Moderate;
  const styleMeta = style ? STYLE_META[style] : null;
  const personality = derivePersonalityType(style, budget, interests);

  // Build interest tags with smart categorization
  const taggedInterests = interests.map((interest) => {
    const lc = interest.toLowerCase();
    if (/heritage|histor|monument|fort|temple|palace/.test(lc)) return { text: interest, category: 'cultural' };
    if (/nature|forest|wildlife|bird|safari|jungle/.test(lc)) return { text: interest, category: 'nature' };
    if (/beach|ocean|sea|swim|snorkel|dive/.test(lc)) return { text: interest, category: 'water' };
    if (/trek|hike|climb|mountain|peak|expedition/.test(lc)) return { text: interest, category: 'adventure' };
    if (/food|cuisine|dining|restaurant|street food/.test(lc)) return { text: interest, category: 'food' };
    if (/yoga|meditat|spiritual|temple|ashram/.test(lc)) return { text: interest, category: 'spiritual' };
    return { text: interest, category: 'general' };
  });

  return {
    // Raw values for logic consumption
    budget,
    style,
    interests,
    preferredStates,

    // Display-ready metadata
    budgetMeta,
    styleMeta,

    // Personality descriptor
    personality,

    // Tagged interests with categories for colored pills
    taggedInterests,

    // Boolean helpers for downstream features
    isAdventureSeeker: style === 'Adventure',
    isOnBudget: budget === 'Budget',
    isLuxury: budget === 'Luxury',
    prefersNature: style === 'Nature' || interests.some(i => /nature|wildlife|forest/.test(i.toLowerCase())),
    prefersHeritage: style === 'Cultural' || interests.some(i => /heritage|histor|monument/.test(i.toLowerCase())),
    prefersRelaxation: style === 'Relaxation',

    // Completeness score (0–100) to show the user how complete their DNA is
    completenessScore: (() => {
      let score = 0;
      if (budget) score += 25;
      if (style) score += 30;
      if (interests.length > 0) score += 25;
      if (preferredStates.length > 0) score += 20;
      return score;
    })(),
  };
};

/**
 * Returns CSS color for an interest tag category.
 */
export const getTagColor = (category) => {
  const map = {
    cultural: { color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
    nature: { color: '#1b803a', bg: '#f0fdf4', border: '#bbf7d0' },
    water: { color: '#06b6d4', bg: '#ecfeff', border: '#a5f3fc' },
    adventure: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
    food: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
    spiritual: { color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
    general: { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
  };
  return map[category] || map.general;
};
