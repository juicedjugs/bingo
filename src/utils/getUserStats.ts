/**
 * Player data obtained from the WikiSync plugin on Runelite.
 * https://sync.runescape.wiki/runelite/player/USERNAME/STANDARD
 */
export interface WikiPlayerData {
  // The username of the player.
  username: string;
  // The timestamp that data was last synced from the player's runelite to wikisync.
  timestamp: string;
  // A map of quest names to the number of quest points (0-5) (0 for incomplete)
  quests: {
    [questName: string]: number;
  };
  // A map of achievement diaries with each task corresponding to an ID.
  achievement_diaries: {
    [regionName: string]: {
      Easy: {
        complete: boolean;
        tasks: boolean[];
      };
      Medium: {
        complete: boolean;
        tasks: boolean[];
      };
      Hard: {
        complete: boolean;
        tasks: boolean[];
      };
      Elite: {
        complete: boolean;
        tasks: boolean[];
      };
    };
  };
  // A map of the music tracks the player has completed.
  music_tracks: {
    [trackName: string]: boolean;
  };
  levels: {
    [skillName: string]: number;
  };
  // An array of combat achievement ids that the player has completed.
  combat_achievements: number[];
  // An array of collection log item ids that the player has completed.
  collection_log: number[];
  // The number of collection log items in the game (or null if log not synced).
  collectionLogItemCount: number | null;
}

/**
 * Player stats obtained from the RuneScape API.
 * https://secure.runescape.com/m=hiscore_oldschool/index_lite.json?player=USERNAME
 */
export interface UserStats {
  skills: {
    id: number;
    name: string;
    rank: number;
    level: number;
    xp: number;
  }[];
  activities: {
    id: number;
    name: string;
    rank: number;
    score: number;
  }[];
}
interface CachedUserStats {
  data: UserStats;
  timestamp: number;
  username: string;
}

const CACHE_KEY_PREFIX = "user_stats_cache_";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Use a public CORS proxy to bypass CORS restrictions.
// Note: For production, consider running your own proxy or using a backend.
const getUserStatsFromAPI = async (username: string): Promise<UserStats> => {
  const corsProxy = "https://corsproxy.io/?";
  const url = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.json?player=${encodeURIComponent(
    username,
  )}`;
  const response = await fetch(`${corsProxy}${encodeURIComponent(url)}`);
  const data = await response.json();
  return data;
};

const getUserStats = async (username: string): Promise<UserStats> => {
  const cacheKey = `${CACHE_KEY_PREFIX}${username.toLowerCase()}`;

  try {
    // Check if we have cached data
    const cachedDataStr = localStorage.getItem(cacheKey);
    if (cachedDataStr) {
      const cachedData: CachedUserStats = JSON.parse(cachedDataStr);
      const now = Date.now();

      // Check if cache is still valid (less than 24 hours old)
      if (now - cachedData.timestamp < CACHE_DURATION_MS) {
        console.log(`Using cached stats for ${username}`);
        return cachedData.data;
      } else {
        console.log(`Cache expired for ${username}, fetching new data`);
      }
    }
  } catch (error) {
    console.warn(`Error reading cache for ${username}:`, error);
  }

  // Fetch fresh data from API
  console.log(`Fetching fresh stats for ${username}`);
  const freshData = await getUserStatsFromAPI(username);

  // Cache the fresh data
  try {
    const cacheData: CachedUserStats = {
      data: freshData,
      timestamp: Date.now(),
      username: username.toLowerCase(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn(`Error caching data for ${username}:`, error);
  }

  return freshData;
};

/**
 * Clear all cached user stats
 */
export const clearUserStatsCache = (): void => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} cached user stats entries`);
  } catch (error) {
    console.warn("Error clearing user stats cache:", error);
  }
};

/**
 * Clear expired cache entries to free up localStorage space
 */
export const clearExpiredUserStatsCache = (): void => {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        try {
          const cachedDataStr = localStorage.getItem(key);
          if (cachedDataStr) {
            const cachedData: CachedUserStats = JSON.parse(cachedDataStr);
            if (now - cachedData.timestamp >= CACHE_DURATION_MS) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // If we can't parse the cache entry, remove it
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      console.log(
        `Cleared ${keysToRemove.length} expired user stats cache entries`,
      );
    }
  } catch (error) {
    console.warn("Error clearing expired user stats cache:", error);
  }
};

/**
 * Get cache info for debugging
 */
export const getUserStatsCacheInfo = (): {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
} => {
  try {
    const now = Date.now();
    let totalEntries = 0;
    let validEntries = 0;
    let expiredEntries = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        totalEntries++;
        try {
          const cachedDataStr = localStorage.getItem(key);
          if (cachedDataStr) {
            const cachedData: CachedUserStats = JSON.parse(cachedDataStr);
            if (now - cachedData.timestamp < CACHE_DURATION_MS) {
              validEntries++;
            } else {
              expiredEntries++;
            }
          }
        } catch (error) {
          expiredEntries++;
        }
      }
    }

    return { totalEntries, validEntries, expiredEntries };
  } catch (error) {
    console.warn("Error getting cache info:", error);
    return { totalEntries: 0, validEntries: 0, expiredEntries: 0 };
  }
};

/**
 * Calculate an OSRS combat level (0 – 126).
 * @param skills – full hiscore skill list
 * @returns integer combat level
 */
export function computeCombatLevel(skills: UserStats["skills"]): number {
  // Helper to grab a level by (case-insensitive) name ― defaulting to 1 if missing
  const lvl = (n: string) =>
    skills.find((s) => s.name.toLowerCase() === n.toLowerCase())?.level ?? 1;

  const attack = lvl("Attack");
  const strength = lvl("Strength");
  const defence = lvl("Defence");
  const hitpoints = lvl("Hitpoints");
  const prayer = lvl("Prayer");
  const ranged = lvl("Ranged") || lvl("Range");
  const magic = lvl("Magic");

  // Step 1 – “base” component
  const base = 0.25 * (defence + hitpoints + Math.floor(prayer / 2));

  // Step 2 – dominant combat style
  const melee = 0.325 * (attack + strength);
  const range = 0.325 * Math.floor(ranged * 1.5);
  const mage = 0.325 * Math.floor(magic * 1.5);

  // Step 3 – final level (game truncates any decimal)
  return Math.floor(base + Math.max(melee, range, mage));
}

export default getUserStats;
