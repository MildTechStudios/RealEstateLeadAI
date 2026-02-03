/**
 * Smart Theme Engine
 * Maps locations (City/State) to visual vibes (Images, Colors)
 */

export interface ThemeConfig {
    heroImage: string;
    primaryColor: string;
    gradientFrom: string;
    gradientTo: string;
    vibeName: string;
    regionGroup: string;
}

/**
 * STATE GROUPS
 * Each group maps to a hero image in /assets/regions/
 * 
 * Group 1: Southwest (TX, AZ, NV) -> /assets/regions/southwest.png
 * Group 2: California (CA) -> /assets/regions/california.png
 * Group 3: Southeast (FL, SC, NC) -> /assets/regions/southeast.png
 * Group 4: Northeast (NY, NJ, MA, CT) -> /assets/regions/northeast.png
 * Group 5: Midwest (OH, MI, IL, IN) -> /assets/regions/midwest.png
 * Group 6: Mountain (CO, UT, ID) -> /assets/regions/mountain.png
 */

type RegionGroup = 'southwest' | 'california' | 'southeast' | 'northeast' | 'midwest' | 'mountain' | 'default';

const STATE_TO_REGION: Record<string, RegionGroup> = {
    // Group 1: Southwest
    'TX': 'southwest',
    'AZ': 'southwest',
    'NV': 'southwest',

    // Group 2: California
    'CA': 'california',

    // Group 3: Southeast
    'FL': 'southeast',
    'SC': 'southeast',
    'NC': 'southeast',

    // Group 4: Northeast
    'NY': 'northeast',
    'NJ': 'northeast',
    'MA': 'northeast',
    'CT': 'northeast',

    // Group 5: Midwest
    'OH': 'midwest',
    'MI': 'midwest',
    'IL': 'midwest',
    'IN': 'midwest',

    // Group 6: Mountain
    'CO': 'mountain',
    'UT': 'mountain',
    'ID': 'mountain',
};

// Region-specific theme configs
const REGION_THEMES: Record<RegionGroup, ThemeConfig> = {
    southwest: {
        heroImage: '/assets/regions/southwest.png',
        primaryColor: 'amber-500',
        gradientFrom: 'from-amber-400',
        gradientTo: 'to-orange-500',
        vibeName: 'Desert Modern',
        regionGroup: 'southwest',
    },
    california: {
        heroImage: '/assets/regions/california.png',
        primaryColor: 'cyan-400',
        gradientFrom: 'from-cyan-400',
        gradientTo: 'to-blue-500',
        vibeName: 'West Coast Dream',
        regionGroup: 'california',
    },
    southeast: {
        heroImage: '/assets/regions/southeast.png',
        primaryColor: 'teal-400',
        gradientFrom: 'from-teal-400',
        gradientTo: 'to-cyan-500',
        vibeName: 'Coastal Living',
        regionGroup: 'southeast',
    },
    northeast: {
        heroImage: '/assets/regions/northeast.png',
        primaryColor: 'slate-200',
        gradientFrom: 'from-slate-200',
        gradientTo: 'to-slate-400',
        vibeName: 'Metropolitan',
        regionGroup: 'northeast',
    },
    midwest: {
        heroImage: '/assets/regions/midwest.png',
        primaryColor: 'emerald-500',
        gradientFrom: 'from-emerald-400',
        gradientTo: 'to-green-600',
        vibeName: 'Heartland Classic',
        regionGroup: 'midwest',
    },
    mountain: {
        heroImage: '/assets/regions/mountain.png',
        primaryColor: 'sky-400',
        gradientFrom: 'from-sky-400',
        gradientTo: 'to-indigo-500',
        vibeName: 'Mountain Retreat',
        regionGroup: 'mountain',
    },
    default: {
        heroImage: '/assets/regions/default.png',
        primaryColor: 'amber-500',
        gradientFrom: 'from-amber-400',
        gradientTo: 'to-amber-600',
        vibeName: 'Modern Luxury',
        regionGroup: 'default',
    },
};

// Fallback to Unsplash if local image doesn't exist
const FALLBACK_IMAGES: Record<RegionGroup, string> = {
    southwest: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa',
    california: 'https://images.unsplash.com/photo-1512915990748-d14307921863',
    southeast: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
    northeast: 'https://images.unsplash.com/photo-1469022563328-fa287c8768a3',
    midwest: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
    mountain: 'https://images.unsplash.com/photo-1449844908441-8829872d2607',
    default: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
};

export function getThemeConfig(_city?: string | null, state?: string | null): ThemeConfig {
    const stateKey = state?.toUpperCase() || '';
    const region = STATE_TO_REGION[stateKey] || 'default';

    return {
        ...REGION_THEMES[region],
        // Use local image with fallback
        heroImage: REGION_THEMES[region].heroImage,
    };
}

// Export for debugging/testing
export function getRegionForState(state: string): RegionGroup {
    return STATE_TO_REGION[state.toUpperCase()] || 'default';
}

// Export fallback images for error handling in components
export function getFallbackImage(region: RegionGroup): string {
    return FALLBACK_IMAGES[region];
}
