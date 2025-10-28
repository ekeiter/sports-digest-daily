/**
 * NCAA Team Logo Utility
 * Dynamically generates NCAA.com logo URLs based on team names
 */

// Map team display names to NCAA logo slugs
const teamSlugOverrides: Record<string, string> = {
  // Special cases where the slug doesn't match the obvious pattern
  "Miami Hurricanes": "miami-fl",
  "Miami (OH) RedHawks": "miami-oh",
  "NC State Wolfpack": "north-carolina-st",
  "Florida St. Seminoles": "florida-st",
  "Ole Miss Rebels": "mississippi",
  "UConn Huskies": "connecticut",
  "USC Trojans": "southern-california",
  "LSU Tigers": "louisiana-st",
  "Texas A&M Aggies": "texas-am",
  "SMU Mustangs": "smu",
  "TCU Horned Frogs": "tcu",
  "UCLA Bruins": "ucla",
  "UCF Knights": "central-florida",
  "UMass Minutemen": "massachusetts",
  "UNLV Rebels": "nevada-las-vegas",
  "UTEP Miners": "texas-el-paso",
  "UTSA Roadrunners": "texas-san-antonio",
  "BYU Cougars": "byu",
  "VCU Rams": "vcu",
  "UAB Blazers": "alabama-birmingham",
  "UL Monroe Warhawks": "louisiana-monroe",
  "Louisiana Ragin' Cajuns": "louisiana-lafayette",
  "App State Mountaineers": "appalachian-st",
  "Sam Houston Bearkats": "sam-houston-st",
  "Arkansas-Pine Bluff Golden Lions": "arkansas-pine-bluff",
  "East Tennessee State Buccaneers": "east-tennessee-st",
  "East Tennessee State Bucs": "east-tennessee-st",
};

/**
 * Convert a team display name to an NCAA logo slug
 */
export function getNCAALogoSlug(teamName: string): string {
  // Check for override first
  if (teamSlugOverrides[teamName]) {
    return teamSlugOverrides[teamName];
  }

  // Extract the main part of the name (remove common suffixes like team mascots)
  let slug = teamName
    .toLowerCase()
    // Remove common patterns
    .replace(/ (crimson tide|wildcats|bulldogs|tigers|bears|eagles|panthers|cougars|lions|rams|falcons|cowboys|aggies|cyclones|terrapins|volunteers|gamecocks|razorbacks|rebels|commodores|blue devils|tar heels|demon deacons|yellow jackets|orange|hoyas|friars|musketeers|explorers|minutemen|catamounts|retrievers|seawolves|highlanders|colonels|bison|gaels|jaspers|peacocks|blackbirds|terriers|bearcats|broncos|chippewas|redhawks|huskies|bobcats|golden eagles|golden flashes|hilltoppers|thundering herd|rockets|zips|cardinals|rainbowwarriors|rainbow warriors|golden gophers|cornhuskers|scarlet knights|nittany lions|boilermakers|fighting illini|wolverines|spartans|buckeyes|badgers|sooners|jayhawks|red raiders|mountaineers|seminoles|gators|cavaliers|hokies|wolfpack|hurricanes|bruins|trojans|sun devils|utes|buffaloes|ducks|beavers|cougars|huskies|beach|warriors)$/gi, '')
    // Replace spaces and special characters with hyphens
    .replace(/\s+/g, '-')
    .replace(/[()]/g, '')
    .replace(/'/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug;
}

/**
 * Get the NCAA logo URL for a team
 */
export function getNCAALogoUrl(teamName: string): string {
  const slug = getNCAALogoSlug(teamName);
  return `https://www.ncaa.com/sites/default/files/images/logos/schools/bgl/${slug}.svg`;
}

/**
 * Check if a logo exists at the given URL
 * Returns a promise that resolves to true if the image loads successfully
 */
export function checkLogoExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
