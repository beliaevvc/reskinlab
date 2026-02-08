/**
 * IP Hash utility for rate limiting shared calculator sessions.
 * Fetches public IP and generates a SHA-256 hash (never sends raw IP to server).
 */

const IP_CACHE_KEY = 'shared_calc_ip_hash';
const IP_CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Get public IP address from free API
 * @returns {Promise<string|null>}
 */
async function fetchPublicIp() {
  try {
    const response = await fetch('https://api.ipify.org?format=text', {
      signal: AbortSignal.timeout(5000), // 5s timeout
    });
    if (!response.ok) return null;
    return (await response.text()).trim();
  } catch {
    return null;
  }
}

/**
 * Generate SHA-256 hash of a string
 * @param {string} input
 * @returns {Promise<string>}
 */
async function sha256(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get a hashed identifier for rate limiting.
 * Uses SHA-256 of the user's public IP address.
 * Result is cached in sessionStorage for 1 hour.
 *
 * @returns {Promise<string|null>} SHA-256 hash or null if IP couldn't be fetched
 */
export async function getIpHash() {
  // Check cache
  try {
    const cached = sessionStorage.getItem(IP_CACHE_KEY);
    if (cached) {
      const { hash, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < IP_CACHE_TTL) {
        return hash;
      }
    }
  } catch {
    // sessionStorage might not be available
  }

  // Fetch and hash
  const ip = await fetchPublicIp();
  if (!ip) return null;

  // Add salt to prevent rainbow table attacks on known IPs
  const hash = await sha256(`reskin_lab_rate_limit_${ip}`);

  // Cache result
  try {
    sessionStorage.setItem(
      IP_CACHE_KEY,
      JSON.stringify({ hash, timestamp: Date.now() })
    );
  } catch {
    // Ignore storage errors
  }

  return hash;
}
