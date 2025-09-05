export const BANNER_CONFIG = {
  // General banners (feeds, events, etc.)
  RECOMMENDED_WIDTH: 1300,
  RECOMMENDED_HEIGHT: 300,
  ASPECT_RATIO: 1300 / 300,
  MAX_WIDTH: 1300,
  RECOMMENDATION_TEXT: "Recomendado: 1300x300 pixels",
  
  // Login banner (vertical)
  LOGIN: {
    RECOMMENDED_WIDTH: 1080,
    RECOMMENDED_HEIGHT: 1920,
    ASPECT_RATIO: 9 / 16,
    MAX_WIDTH: 768,
    RECOMMENDATION_TEXT: "Recomendado: 1080x1920 px (9:16)"
  }
} as const;