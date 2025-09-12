/**
 * Generate a subdomain slug from company name
 */
export const generateSubdomain = (companyName: string): string => {
  return companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 63); // Limit to 63 characters (DNS limit)
};

/**
 * Validate subdomain format
 */
export const isValidSubdomain = (subdomain: string): boolean => {
  if (!subdomain || subdomain.length < 1 || subdomain.length > 63) {
    return false;
  }

  // Must start and end with alphanumeric, can contain hyphens in between
  const regex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return regex.test(subdomain);
};

/**
 * Check if subdomain is reserved
 */
export const isReservedSubdomain = (subdomain: string): boolean => {
  const reserved = [
    'www', 'mail', 'ftp', 'admin', 'api', 'app', 'dev', 'test', 'staging',
    'cdn', 'static', 'assets', 'blog', 'docs', 'support', 'help', 'about',
    'contact', 'terms', 'privacy', 'legal', 'security', 'status', 'health'
  ];
  
  return reserved.includes(subdomain.toLowerCase());
};

/**
 * Get the base domain from current hostname
 */
export const getBaseDomain = (): string => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // If we have more than 2 parts, return the last two (domain.com)
  if (parts.length > 2) {
    return parts.slice(-2).join('.');
  }
  
  return hostname;
};

/**
 * Build subdomain URL
 */
export const buildSubdomainUrl = (subdomain: string, path: string = ''): string => {
  const baseDomain = getBaseDomain();
  const protocol = window.location.protocol;
  return `${protocol}//${subdomain}.${baseDomain}${path}`;
};