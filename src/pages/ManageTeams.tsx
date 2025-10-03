import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, X, ChevronDown, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ncaaLogo from "@/assets/ncaa-logo.png";
import ncaamLogo from "@/assets/ncaam-logo.png";
import mlsLogo from "@/assets/mls-logo.png";

// Function to get league logo URL
const getLeagueLogo = (league: string): string => {
  const leagueLogos: { [key: string]: string } = {
    MLB: "https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png",
    NFL: "https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png",
    NBA: "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png",
    NHL: "https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png",
    WNBA: "https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png",
    NCAAF: ncaaLogo,
    NCAAM: ncaamLogo,
    MLS: mlsLogo
  };
  return leagueLogos[league] || "";
};

// Function to get team logo URL
const getTeamLogo = (teamName: string, league: string): string => {
  // Create a mapping for team abbreviations/codes for better logo URLs
  const teamMappings: { [key: string]: { [team: string]: string } } = {
    MLB: {
      "Arizona Diamondbacks": "ari",
      "Atlanta Braves": "atl", 
      "Baltimore Orioles": "bal",
      "Boston Red Sox": "bos",
      "Chicago Cubs": "chc",
      "Chicago White Sox": "cws",
      "Cincinnati Reds": "cin",
      "Cleveland Guardians": "cle",
      "Colorado Rockies": "col",
      "Detroit Tigers": "det",
      "Houston Astros": "hou",
      "Kansas City Royals": "kc",
      "Los Angeles Angels": "laa",
      "Los Angeles Dodgers": "lad",
      "Miami Marlins": "mia",
      "Milwaukee Brewers": "mil",
      "Minnesota Twins": "min",
      "New York Mets": "nym",
      "New York Yankees": "nyy",
      "Oakland Athletics": "oak",
      "Philadelphia Phillies": "phi",
      "Pittsburgh Pirates": "pit",
      "San Diego Padres": "sd",
      "San Francisco Giants": "sf",
      "Seattle Mariners": "sea",
      "St. Louis Cardinals": "stl",
      "Tampa Bay Rays": "tb",
      "Texas Rangers": "tex",
      "Toronto Blue Jays": "tor",
      "Washington Nationals": "wsh"
    },
    NFL: {
      "Arizona Cardinals": "ari",
      "Atlanta Falcons": "atl",
      "Baltimore Ravens": "bal",
      "Buffalo Bills": "buf",
      "Carolina Panthers": "car",
      "Chicago Bears": "chi",
      "Cincinnati Bengals": "cin",
      "Cleveland Browns": "cle",
      "Dallas Cowboys": "dal",
      "Denver Broncos": "den",
      "Detroit Lions": "det",
      "Green Bay Packers": "gb",
      "Houston Texans": "hou",
      "Indianapolis Colts": "ind",
      "Jacksonville Jaguars": "jax",
      "Kansas City Chiefs": "kc",
      "Las Vegas Raiders": "lv",
      "Los Angeles Chargers": "lac",
      "Los Angeles Rams": "lar",
      "Miami Dolphins": "mia",
      "Minnesota Vikings": "min",
      "New England Patriots": "ne",
      "New Orleans Saints": "no",
      "New York Giants": "nyg",
      "New York Jets": "nyj",
      "Philadelphia Eagles": "phi",
      "Pittsburgh Steelers": "pit",
      "San Francisco 49ers": "sf",
      "Seattle Seahawks": "sea",
      "Tampa Bay Buccaneers": "tb",
      "Tennessee Titans": "ten",
      "Washington Commanders": "wsh"
    },
    NBA: {
      "Atlanta Hawks": "atl",
      "Boston Celtics": "bos",
      "Brooklyn Nets": "bkn",
      "Charlotte Hornets": "cha",
      "Chicago Bulls": "chi",
      "Cleveland Cavaliers": "cle",
      "Dallas Mavericks": "dal",
      "Denver Nuggets": "den",
      "Detroit Pistons": "det",
      "Golden State Warriors": "gsw",
      "Houston Rockets": "hou",
      "Indiana Pacers": "ind",
      "Los Angeles Clippers": "lac",
      "Los Angeles Lakers": "lal",
      "Memphis Grizzlies": "mem",
      "Miami Heat": "mia",
      "Milwaukee Bucks": "mil",
      "Minnesota Timberwolves": "min",
      "New Orleans Pelicans": "no",
      "New York Knicks": "nyk",
      "Oklahoma City Thunder": "okc",
      "Orlando Magic": "orl",
      "Philadelphia 76ers": "phi",
      "Phoenix Suns": "phx",
      "Portland Trail Blazers": "por",
      "Sacramento Kings": "sac",
      "San Antonio Spurs": "sa",
      "Toronto Raptors": "tor",
      "Utah Jazz": "utah",
      "Washington Wizards": "wsh"
    },
    NHL: {
      "Anaheim Ducks": "ana",
      "Arizona Coyotes": "ari", // Keep old mapping for existing data
      "Utah Mammoth": "uta",
      "Boston Bruins": "bos",
      "Buffalo Sabres": "buf",
      "Calgary Flames": "cgy",
      "Carolina Hurricanes": "car",
      "Chicago Blackhawks": "chi",
      "Colorado Avalanche": "col",
      "Columbus Blue Jackets": "cbj",
      "Dallas Stars": "dal",
      "Detroit Red Wings": "det",
      "Edmonton Oilers": "edm",
      "Florida Panthers": "fla",
      "Los Angeles Kings": "lak",
      "Minnesota Wild": "min",
      "Montreal Canadiens": "mtl",
      "Nashville Predators": "nsh",
      "New Jersey Devils": "njd",
      "New York Islanders": "nyi",
      "New York Rangers": "nyr",
      "Ottawa Senators": "ott",
      "Philadelphia Flyers": "phi",
      "Pittsburgh Penguins": "pit",
      "San Jose Sharks": "sj",
      "Seattle Kraken": "sea",
      "St. Louis Blues": "stl",
      "Tampa Bay Lightning": "tb",
      "Toronto Maple Leafs": "tor",
      "Vancouver Canucks": "van",
      "Vegas Golden Knights": "vgk",
      "Washington Capitals": "wsh",
      "Winnipeg Jets": "wpg"
    },
    WNBA: {
      "Atlanta Dream": "atl",
      "Chicago Sky": "chi",
      "Connecticut Sun": "conn",
      "Dallas Wings": "dal",
      "Indiana Fever": "ind",
      "Las Vegas Aces": "lv",
      "Los Angeles Sparks": "la",
      "Minnesota Lynx": "min",
      "New York Liberty": "ny",
      "Phoenix Mercury": "phx",
      "Seattle Storm": "sea",
      "Washington Mystics": "wsh",
      "Golden State Valkyries": "gs"
    },
    NCAAF: {
      "Air Force Falcons": "2005",
      "Akron Zips": "2006",
      "Alabama Crimson Tide": "333",
      "App State Mountaineers": "2026",
      "Arizona State Sun Devils": "9",
      "Arizona Wildcats": "12",
      "Arkansas Razorbacks": "8",
      "Arkansas State Red Wolves": "2032",
      "Army Black Knights": "349",
      "Auburn Tigers": "2",
      "Ball State Cardinals": "2050",
      "Baylor Bears": "239",
      "Boise State Broncos": "68",
      "Boston College Eagles": "103",
      "Bowling Green Falcons": "189",
      "Buffalo Bulls": "2084",
      "BYU Cougars": "252",
      "California Golden Bears": "25",
      "Central Michigan Chippewas": "2117",
      "Charlotte 49ers": "2429",
      "Cincinnati Bearcats": "2132",
      "Clemson Tigers": "228",
      "Coastal Carolina Chanticleers": "324",
      "Colorado Buffaloes": "38",
      "Colorado State Rams": "36",
      "Delaware Blue Hens": "48",
      "Duke Blue Devils": "150",
      "East Carolina Pirates": "151",
      "Eastern Michigan Eagles": "2199",
      "Florida Atlantic Owls": "2226",
      "Florida Gators": "57",
      "Florida International Panthers": "2229",
      "Florida State Seminoles": "52",
      "Fresno State Bulldogs": "278",
      "Georgia Bulldogs": "61",
      "Georgia Southern Eagles": "290",
      "Georgia State Panthers": "2247",
      "Georgia Tech Yellow Jackets": "59",
      "Hawai'i Rainbow Warriors": "62",
      "Houston Cougars": "248",
      "Illinois Fighting Illini": "356",
      "Indiana Hoosiers": "84",
      "Iowa Hawkeyes": "2294",
      "Iowa State Cyclones": "66",
      "Jacksonville State Gamecocks": "55",
      "James Madison Dukes": "256",
      "Kansas Jayhawks": "2305",
      "Kansas State Wildcats": "2306",
      "Kennesaw State Owls": "338",
      "Kent State Golden Flashes": "2309",
      "Kentucky Wildcats": "96",
      "Liberty Flames": "2335",
      "Louisiana Ragin' Cajuns": "309",
      "Louisiana Tech Bulldogs": "2348",
      "Louisville Cardinals": "97",
      "LSU Tigers": "99",
      "Marshall Thundering Herd": "276",
      "Maryland Terrapins": "120",
      "Massachusetts Minutemen": "113",
      "Memphis Tigers": "235",
      "Miami (OH) RedHawks": "193",
      "Miami Hurricanes": "2390",
      "Michigan State Spartans": "127",
      "Michigan Wolverines": "130",
      "Middle Tennessee Blue Raiders": "2393",
      "Minnesota Golden Gophers": "135",
      "Mississippi State Bulldogs": "344",
      "Missouri State Bears": "2623",
      "Missouri Tigers": "142",
      "Navy Midshipmen": "2426",
      "NC State Wolfpack": "152",
      "Nebraska Cornhuskers": "158",
      "Nevada Wolf Pack": "2440",
      "New Mexico Lobos": "167",
      "New Mexico State Aggies": "166",
      "North Carolina Tar Heels": "153",
      "North Texas Mean Green": "249",
      "Northern Illinois Huskies": "2459",
      "Northwestern Wildcats": "77",
      "Notre Dame Fighting Irish": "87",
      "Ohio Bobcats": "195",
      "Ohio State Buckeyes": "194",
      "Oklahoma Sooners": "201",
      "Oklahoma State Cowboys": "197",
      "Old Dominion Monarchs": "295",
      "Ole Miss Rebels": "145",
      "Oregon Ducks": "2483",
      "Oregon State Beavers": "204",
      "Penn State Nittany Lions": "213",
      "Pittsburgh Panthers": "221",
      "Purdue Boilermakers": "2509",
      "Rice Owls": "242",
      "Rutgers Scarlet Knights": "164",
      "Sam Houston Bearkats": "2534",
      "San Diego State Aztecs": "21",
      "San José State Spartans": "23",
      "SMU Mustangs": "2567",
      "South Alabama Jaguars": "6",
      "South Carolina Gamecocks": "2579",
      "South Florida Bulls": "58",
      "Southern Miss Golden Eagles": "2572",
      "Stanford Cardinal": "24",
      "Syracuse Orange": "183",
      "TCU Horned Frogs": "2628",
      "Temple Owls": "218",
      "Tennessee Volunteers": "2633",
      "Texas A&M Aggies": "245",
      "Texas Longhorns": "251",
      "Texas State Bobcats": "326",
      "Texas Tech Red Raiders": "2641",
      "Toledo Rockets": "2649",
      "Troy Trojans": "2653",
      "Tulane Green Wave": "2655",
      "Tulsa Golden Hurricane": "202",
      "UAB Blazers": "5",
      "UCF Knights": "2116",
      "UCLA Bruins": "26",
      "UConn Huskies": "41",
      "UL Monroe Warhawks": "2433",
      "UNLV Rebels": "2439",
      "USC Trojans": "30",
      "Utah State Aggies": "328",
      "Utah Utes": "254",
      "UTEP Miners": "2638",
      "UTSA Roadrunners": "2636",
      "Vanderbilt Commodores": "238",
      "Virginia Cavaliers": "258",
      "Virginia Tech Hokies": "259",
      "Wake Forest Demon Deacons": "154",
      "Washington Huskies": "264",
      "Washington State Cougars": "265",
      "West Virginia Mountaineers": "277",
      "Western Kentucky Hilltoppers": "98",
      "Western Michigan Broncos": "2711",
      "Wisconsin Badgers": "275",
      "Wyoming Cowboys": "2750"
    },
    NCAAM: {
      "Abilene Christian Wildcats": "2000",
      "Air Force Falcons": "2005",
      "Akron Zips": "2006",
      "Alabama A&M Bulldogs": "2010",
      "Alabama Crimson Tide": "333",
      "Alabama State Hornets": "2011",
      "Alcorn State Braves": "2016",
      "American University Eagles": "44",
      "App State Mountaineers": "2026",
      "Arizona State Sun Devils": "9",
      "Arizona Wildcats": "12",
      "Arkansas Razorbacks": "8",
      "Arkansas State Red Wolves": "2032",
      "Arkansas-Pine Bluff Golden Lions": "2029",
      "Army Black Knights": "349",
      "Auburn Tigers": "2",
      "Austin Peay Governors": "2046",
      "Ball State Cardinals": "2050",
      "Baylor Bears": "239",
      "Bellarmine Knights": "2057",
      "Belmont Bruins": "2065",
      "Bethune-Cookman Wildcats": "2068",
      "Binghamton Bearcats": "2066",
      "Boise State Broncos": "68",
      "Boston College Eagles": "103",
      "Boston University Terriers": "104",
      "Bowling Green Falcons": "189",
      "Bradley Braves": "71",
      "Brown Bears": "225",
      "Bryant Bulldogs": "2083",
      "Bucknell Bison": "2083",
      "Buffalo Bulls": "2084",
      "Butler Bulldogs": "2086",
      "BYU Cougars": "252",
      "Cal Poly Mustangs": "13",
      "Cal State Bakersfield Roadrunners": "2934",
      "Cal State Fullerton Titans": "2239",
      "Cal State Northridge Matadors": "2463",
      "California Baptist Lancers": "2934",
      "California Golden Bears": "25",
      "Campbell Fighting Camels": "2097",
      "Canisius Golden Griffins": "2099",
      "Central Arkansas Bears": "2110",
      "Central Connecticut Blue Devils": "2115",
      "Central Michigan Chippewas": "2117",
      "Charleston Cougars": "232",
      "Charleston Southern Buccaneers": "2127",
      "Charlotte 49ers": "2429",
      "Chattanooga Mocs": "236",
      "Chicago State Cougars": "2130",
      "Cincinnati Bearcats": "2132",
      "Clemson Tigers": "228",
      "Cleveland State Vikings": "325",
      "Coastal Carolina Chanticleers": "324",
      "Colgate Raiders": "2142",
      "Colorado Buffaloes": "38",
      "Colorado State Rams": "36",
      "Columbia Lions": "171",
      "Coppin State Eagles": "2154",
      "Cornell Big Red": "172",
      "Creighton Bluejays": "156",
      "Dartmouth Big Green": "159",
      "Davidson Wildcats": "2166",
      "Dayton Flyers": "2168",
      "Delaware Blue Hens": "48",
      "Delaware State Hornets": "2169",
      "Denver Pioneers": "2172",
      "DePaul Blue Demons": "305",
      "Detroit Mercy Titans": "2174",
      "Drake Bulldogs": "2181",
      "Drexel Dragons": "2182",
      "Duke Blue Devils": "150",
      "Duquesne Dukes": "2184",
      "East Carolina Pirates": "151",
      "East Tennessee State Buccaneers": "2193",
      "East Texas A&M Lions": "2198",
      "Eastern Illinois Panthers": "2197",
      "Eastern Kentucky Colonels": "2198",
      "Eastern Michigan Eagles": "2199",
      "Eastern Washington Eagles": "331",
      "Elon Phoenix": "2210",
      "Evansville Purple Aces": "339",
      "Fairfield Stags": "2217",
      "Fairleigh Dickinson Knights": "2218",
      "Florida A&M Rattlers": "50",
      "Florida Atlantic Owls": "2226",
      "Florida Gators": "57",
      "Florida Gulf Coast Eagles": "526",
      "Florida International Panthers": "2229",
      "Florida State Seminoles": "52",
      "Fordham Rams": "2230",
      "Fresno State Bulldogs": "278",
      "Furman Paladins": "231",
      "Gardner-Webb Runnin' Bulldogs": "2241",
      "George Mason Patriots": "2244",
      "George Washington Revolutionaries": "45",
      "Georgetown Hoyas": "46",
      "Georgia Bulldogs": "61",
      "Georgia Southern Eagles": "290",
      "Georgia State Panthers": "2247",
      "Georgia Tech Yellow Jackets": "59",
      "Gonzaga Bulldogs": "2250",
      "Grambling Tigers": "2755",
      "Grand Canyon Lopes": "2253",
      "Green Bay Phoenix": "2739",
      "Hampton Pirates": "2261",
      "Harvard Crimson": "108",
      "Hawaii Rainbow Warriors": "62",
      "High Point Panthers": "2272",
      "Hofstra Pride": "2275",
      "Holy Cross Crusaders": "107",
      "Houston Christian Huskies": "2277",
      "Houston Cougars": "248",
      "Howard Bison": "47",
      "Idaho State Bengals": "304",
      "Idaho Vandals": "70",
      "Illinois Fighting Illini": "356",
      "Illinois State Redbirds": "2287",
      "Incarnate Word Cardinals": "2916",
      "Indiana Hoosiers": "84",
      "Indiana State Sycamores": "282",
      "Iona Gaels": "2296",
      "Iowa Hawkeyes": "2294",
      "Iowa State Cyclones": "66",
      "IU Indianapolis Jaguars": "84",
      "Jackson State Tigers": "2296",
      "Jacksonville Dolphins": "294",
      "Jacksonville State Gamecocks": "55",
      "James Madison Dukes": "256",
      "Kansas City Roos": "2306",
      "Kansas Jayhawks": "2305",
      "Kansas State Wildcats": "2306",
      "Kennesaw State Owls": "338",
      "Kent State Golden Flashes": "2309",
      "Kentucky Wildcats": "96",
      "La Salle Explorers": "2325",
      "Lafayette Leopards": "322",
      "Lamar Cardinals": "2320",
      "Le Moyne Dolphins": "2332",
      "Lehigh Mountain Hawks": "2329",
      "Liberty Flames": "2335",
      "Lindenwood Lions": "2944",
      "Lipscomb Bisons": "2340",
      "Little Rock Trojans": "2031",
      "Long Beach State Beach": "299",
      "Long Island University Sharks": "2349",
      "Longwood Lancers": "2350",
      "Louisiana Ragin' Cajuns": "309",
      "Louisiana Tech Bulldogs": "2348",
      "Louisville Cardinals": "97",
      "Loyola Chicago Ramblers": "2350",
      "Loyola Maryland Greyhounds": "2350",
      "Loyola Marymount Lions": "2351",
      "LSU Tigers": "99",
      "Maine Black Bears": "311",
      "Manhattan Jaspers": "2363",
      "Marist Red Foxes": "2368",
      "Marquette Golden Eagles": "269",
      "Marshall Thundering Herd": "276",
      "Maryland Eastern Shore Hawks": "2379",
      "Maryland Terrapins": "120",
      "Massachusetts Minutemen": "113",
      "McNeese Cowboys": "2377",
      "Memphis Tigers": "235",
      "Mercer Bears": "2382",
      "Mercyhurst Lakers": "2934",
      "Merrimack Warriors": "2385",
      "Miami (OH) RedHawks": "193",
      "Miami Hurricanes": "2390",
      "Michigan State Spartans": "127",
      "Michigan Wolverines": "130",
      "Middle Tennessee Blue Raiders": "2393",
      "Milwaukee Panthers": "2368",
      "Minnesota Golden Gophers": "135",
      "Mississippi State Bulldogs": "344",
      "Mississippi Valley State Delta Devils": "2400",
      "Missouri State Bears": "2623",
      "Missouri Tigers": "142",
      "Monmouth Hawks": "2405",
      "Montana Grizzlies": "149",
      "Montana State Bobcats": "147",
      "Morehead State Eagles": "2413",
      "Morgan State Bears": "2415",
      "Mount St. Mary's Mountaineers": "2420",
      "Murray State Racers": "93",
      "Navy Midshipmen": "2426",
      "NC State Wolfpack": "152",
      "Nebraska Cornhuskers": "158",
      "Nevada Wolf Pack": "2440",
      "New Hampshire Wildcats": "160",
      "New Haven Chargers": "2441",
      "New Mexico Lobos": "167",
      "New Mexico State Aggies": "166",
      "New Orleans Privateers": "2443",
      "Niagara Purple Eagles": "2447",
      "Nicholls Colonels": "2447",
      "NJIT Highlanders": "2885",
      "Norfolk State Spartans": "2450",
      "North Alabama Lions": "2453",
      "North Carolina A&T Aggies": "2448",
      "North Carolina Central Eagles": "2428",
      "North Carolina Tar Heels": "153",
      "North Dakota Fighting Hawks": "2449",
      "North Dakota State Bison": "2449",
      "North Florida Ospreys": "2454",
      "North Texas Mean Green": "249",
      "Northeastern Huskies": "111",
      "Northern Arizona Lumberjacks": "2464",
      "Northern Colorado Bears": "2458",
      "Northern Illinois Huskies": "2459",
      "Northern Iowa Panthers": "2460",
      "Northern Kentucky Norse": "94",
      "Northwestern State Demons": "2466",
      "Northwestern Wildcats": "77",
      "Notre Dame Fighting Irish": "87",
      "Oakland Golden Grizzlies": "2473",
      "Ohio Bobcats": "195",
      "Ohio State Buckeyes": "194",
      "Oklahoma Sooners": "201",
      "Oklahoma State Cowboys": "197",
      "Old Dominion Monarchs": "295",
      "Ole Miss Rebels": "145",
      "Omaha Mavericks": "2437",
      "Oral Roberts Golden Eagles": "198",
      "Oregon Ducks": "2483",
      "Oregon State Beavers": "204",
      "Pacific Tigers": "279",
      "Penn State Nittany Lions": "213",
      "Pennsylvania Quakers": "219",
      "Pepperdine Waves": "2492",
      "Pittsburgh Panthers": "221",
      "Portland Pilots": "2501",
      "Portland State Vikings": "2502",
      "Prairie View A&M Panthers": "2504",
      "Presbyterian Blue Hose": "2506",
      "Princeton Tigers": "163",
      "Providence Friars": "2507",
      "Purdue Boilermakers": "2509",
      "Purdue Fort Wayne Mastodons": "2870",
      "Queens University Royals": "2918",
      "Quinnipiac Bobcats": "2514",
      "Radford Highlanders": "2515",
      "Rhode Island Rams": "227",
      "Rice Owls": "242",
      "Richmond Spiders": "257",
      "Rider Broncs": "2520",
      "Robert Morris Colonials": "2523",
      "Rutgers Scarlet Knights": "164",
      "Sacramento State Hornets": "16",
      "Sacred Heart Pioneers": "2529",
      "Saint Francis Red Flash": "2598",
      "Saint Joseph's Hawks": "2603",
      "Saint Louis Billikens": "139",
      "Saint Mary's Gaels": "2608",
      "Saint Peter's Peacocks": "2612",
      "Sam Houston Bearkats": "2534",
      "Samford Bulldogs": "2535",
      "San Diego State Aztecs": "21",
      "San Diego Toreros": "301",
      "San Francisco Dons": "2539",
      "San José State Spartans": "23",
      "Santa Clara Broncos": "2541",
      "SE Louisiana Lions": "2545",
      "Seattle U Redhawks": "2547",
      "Seton Hall Pirates": "2550",
      "Siena Saints": "2561",
      "SIU Edwardsville Cougars": "2565",
      "SMU Mustangs": "2567",
      "South Alabama Jaguars": "6",
      "South Carolina Gamecocks": "2579",
      "South Carolina State Bulldogs": "2569",
      "South Carolina Upstate Spartans": "2908",
      "South Dakota Coyotes": "233",
      "South Dakota State Jackrabbits": "2571",
      "South Florida Bulls": "58",
      "Southeast Missouri State Redhawks": "2546",
      "Southern Illinois Salukis": "79",
      "Southern Indiana Screaming Eagles": "2902",
      "Southern Jaguars": "2582",
      "Southern Miss Golden Eagles": "2572",
      "Southern Utah Thunderbirds": "253",
      "St. Bonaventure Bonnies": "179",
      "St. John's Red Storm": "2599",
      "St. Thomas-Minnesota Tommies": "2916",
      "Stanford Cardinal": "24",
      "Stephen F. Austin Lumberjacks": "2617",
      "Stetson Hatters": "2619",
      "Stonehill Skyhawks": "2945",
      "Stony Brook Seawolves": "2619",
      "Syracuse Orange": "183",
      "Tarleton State Texans": "2623",
      "TCU Horned Frogs": "2628",
      "Temple Owls": "218",
      "Tennessee State Tigers": "2634",
      "Tennessee Tech Golden Eagles": "2635",
      "Tennessee Volunteers": "2633",
      "Texas A&M Aggies": "245",
      "Texas A&M-Corpus Christi Islanders": "357",
      "Texas Longhorns": "251",
      "Texas Southern Tigers": "2640",
      "Texas State Bobcats": "326",
      "Texas Tech Red Raiders": "2641",
      "The Citadel Bulldogs": "2643",
      "Toledo Rockets": "2649",
      "Towson Tigers": "119",
      "Troy Trojans": "2653",
      "Tulane Green Wave": "2655",
      "Tulsa Golden Hurricane": "202",
      "UAB Blazers": "5",
      "UAlbany Great Danes": "399",
      "UC Davis Aggies": "302",
      "UC Irvine Anteaters": "300",
      "UC Riverside Highlanders": "27",
      "UC San Diego Tritons": "2540",
      "UC Santa Barbara Gauchos": "2540",
      "UCF Knights": "2116",
      "UCLA Bruins": "26",
      "UConn Huskies": "41",
      "UIC Flames": "82",
      "UL Monroe Warhawks": "2433",
      "UMass Lowell River Hawks": "2349",
      "UMBC Retrievers": "2378",
      "UNC Asheville Bulldogs": "2427",
      "UNC Greensboro Spartans": "2430",
      "UNC Wilmington Seahawks": "350",
      "UNLV Rebels": "2439",
      "USC Trojans": "30",
      "UT Arlington Mavericks": "2029",
      "UT Martin Skyhawks": "2630",
      "UT Rio Grande Valley Vaqueros": "2638",
      "Utah State Aggies": "328",
      "Utah Tech Trailblazers": "3101",
      "Utah Utes": "254",
      "Utah Valley Wolverines": "3101",
      "UTEP Miners": "2638",
      "UTSA Roadrunners": "2636",
      "Valparaiso Beacons": "2674",
      "Vanderbilt Commodores": "238",
      "VCU Rams": "2670",
      "Vermont Catamounts": "261",
      "Villanova Wildcats": "222",
      "Virginia Cavaliers": "258",
      "Virginia Tech Hokies": "259",
      "VMI Keydets": "2678",
      "Wagner Seahawks": "2681",
      "Wake Forest Demon Deacons": "154",
      "Washington Huskies": "264",
      "Washington State Cougars": "265",
      "Weber State Wildcats": "2692",
      "West Georgia Wolves": "2897",
      "West Virginia Mountaineers": "277",
      "Western Carolina Catamounts": "2717",
      "Western Illinois Leathernecks": "2710",
      "Western Kentucky Hilltoppers": "98",
      "Western Michigan Broncos": "2711",
      "Wichita State Shockers": "2724",
      "William & Mary Tribe": "2729",
      "Winthrop Eagles": "2737",
      "Wisconsin Badgers": "275",
      "Wofford Terriers": "2747",
      "Wright State Raiders": "2750",
      "Wyoming Cowboys": "2750",
      "Xavier Musketeers": "2752",
      "Yale Bulldogs": "43",
      "Youngstown State Penguins": "2755"
    }
  };

  const teamCode = teamMappings[league]?.[teamName];
  if (!teamCode) {
    console.log(`No team code found for ${teamName} in ${league}`);
    return "";
  }

  // Using ESPN's logo API with proper team codes
  // College sports (NCAAF, NCAAM) use numeric IDs with the NCAA path
  if (league === 'NCAAF' || league === 'NCAAM') {
    return `https://a.espncdn.com/i/teamlogos/ncaa/500/${teamCode}.png`;
  }
  
  return `https://a.espncdn.com/i/teamlogos/${league.toLowerCase()}/500/${teamCode}.png`;
};

const TEAMS_BY_LEAGUE = {
  MLB: [
    "Arizona Diamondbacks", "Atlanta Braves", "Baltimore Orioles", "Boston Red Sox", 
    "Chicago Cubs", "Chicago White Sox", "Cincinnati Reds", "Cleveland Guardians",
    "Colorado Rockies", "Detroit Tigers", "Houston Astros", "Kansas City Royals",
    "Los Angeles Angels", "Los Angeles Dodgers", "Miami Marlins", "Milwaukee Brewers",
    "Minnesota Twins", "New York Mets", "New York Yankees", "Oakland Athletics",
    "Philadelphia Phillies", "Pittsburgh Pirates", "San Diego Padres", "San Francisco Giants",
    "Seattle Mariners", "St. Louis Cardinals", "Tampa Bay Rays", "Texas Rangers",
    "Toronto Blue Jays", "Washington Nationals"
  ],
  NFL: [
    "Arizona Cardinals", "Atlanta Falcons", "Baltimore Ravens", "Buffalo Bills",
    "Carolina Panthers", "Chicago Bears", "Cincinnati Bengals", "Cleveland Browns",
    "Dallas Cowboys", "Denver Broncos", "Detroit Lions", "Green Bay Packers",
    "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Kansas City Chiefs",
    "Las Vegas Raiders", "Los Angeles Chargers", "Los Angeles Rams", "Miami Dolphins",
    "Minnesota Vikings", "New England Patriots", "New Orleans Saints", "New York Giants",
    "New York Jets", "Philadelphia Eagles", "Pittsburgh Steelers", "San Francisco 49ers",
    "Seattle Seahawks", "Tampa Bay Buccaneers", "Tennessee Titans", "Washington Commanders"
  ],
  NBA: [
    "Atlanta Hawks", "Boston Celtics", "Brooklyn Nets", "Charlotte Hornets",
    "Chicago Bulls", "Cleveland Cavaliers", "Dallas Mavericks", "Denver Nuggets",
    "Detroit Pistons", "Golden State Warriors", "Houston Rockets", "Indiana Pacers",
    "Los Angeles Clippers", "Los Angeles Lakers", "Memphis Grizzlies", "Miami Heat",
    "Milwaukee Bucks", "Minnesota Timberwolves", "New Orleans Pelicans", "New York Knicks",
    "Oklahoma City Thunder", "Orlando Magic", "Philadelphia 76ers", "Phoenix Suns",
    "Portland Trail Blazers", "Sacramento Kings", "San Antonio Spurs", "Toronto Raptors",
    "Utah Jazz", "Washington Wizards"
  ],
  NHL: [
    "Anaheim Ducks", "Boston Bruins", "Buffalo Sabres", "Calgary Flames",
    "Carolina Hurricanes", "Chicago Blackhawks", "Colorado Avalanche", "Columbus Blue Jackets",
    "Dallas Stars", "Detroit Red Wings", "Edmonton Oilers", "Florida Panthers",
    "Los Angeles Kings", "Minnesota Wild", "Montreal Canadiens", "Nashville Predators",
    "New Jersey Devils", "New York Islanders", "New York Rangers", "Ottawa Senators",
    "Philadelphia Flyers", "Pittsburgh Penguins", "San Jose Sharks", "Seattle Kraken",
    "St. Louis Blues", "Tampa Bay Lightning", "Toronto Maple Leafs", "Utah Mammoth",
    "Vancouver Canucks", "Vegas Golden Knights", "Washington Capitals", "Winnipeg Jets"
  ],
  WNBA: [
    "Atlanta Dream", "Chicago Sky", "Connecticut Sun", "Dallas Wings",
    "Golden State Valkyries", "Indiana Fever", "Las Vegas Aces", "Los Angeles Sparks",
    "Minnesota Lynx", "New York Liberty", "Phoenix Mercury", "Seattle Storm",
    "Washington Mystics"
  ],
  NCAAF: [
    "Air Force Falcons", "Akron Zips", "Alabama Crimson Tide", "App State Mountaineers",
    "Arizona State Sun Devils", "Arizona Wildcats", "Arkansas Razorbacks", "Arkansas State Red Wolves",
    "Army Black Knights", "Auburn Tigers", "Ball State Cardinals", "Baylor Bears",
    "Boise State Broncos", "Boston College Eagles", "Bowling Green Falcons", "Buffalo Bulls",
    "BYU Cougars", "California Golden Bears", "Central Michigan Chippewas", "Charlotte 49ers",
    "Cincinnati Bearcats", "Clemson Tigers", "Coastal Carolina Chanticleers", "Colorado Buffaloes",
    "Colorado State Rams", "Delaware Blue Hens", "Duke Blue Devils", "East Carolina Pirates",
    "Eastern Michigan Eagles", "Florida Atlantic Owls", "Florida Gators", "Florida International Panthers",
    "Florida State Seminoles", "Fresno State Bulldogs", "Georgia Bulldogs", "Georgia Southern Eagles",
    "Georgia State Panthers", "Georgia Tech Yellow Jackets", "Hawai'i Rainbow Warriors", "Houston Cougars",
    "Illinois Fighting Illini", "Indiana Hoosiers", "Iowa Hawkeyes", "Iowa State Cyclones",
    "Jacksonville State Gamecocks", "James Madison Dukes", "Kansas Jayhawks", "Kansas State Wildcats",
    "Kennesaw State Owls", "Kent State Golden Flashes", "Kentucky Wildcats", "Liberty Flames",
    "Louisiana Ragin' Cajuns", "Louisiana Tech Bulldogs", "Louisville Cardinals", "LSU Tigers",
    "Marshall Thundering Herd", "Maryland Terrapins", "Massachusetts Minutemen", "Memphis Tigers",
    "Miami (OH) RedHawks", "Miami Hurricanes", "Michigan State Spartans", "Michigan Wolverines",
    "Middle Tennessee Blue Raiders", "Minnesota Golden Gophers", "Mississippi State Bulldogs", "Missouri State Bears",
    "Missouri Tigers", "Navy Midshipmen", "NC State Wolfpack", "Nebraska Cornhuskers",
    "Nevada Wolf Pack", "New Mexico Lobos", "New Mexico State Aggies", "North Carolina Tar Heels",
    "North Texas Mean Green", "Northern Illinois Huskies", "Northwestern Wildcats", "Notre Dame Fighting Irish",
    "Ohio Bobcats", "Ohio State Buckeyes", "Oklahoma Sooners", "Oklahoma State Cowboys",
    "Old Dominion Monarchs", "Ole Miss Rebels", "Oregon Ducks", "Oregon State Beavers",
    "Penn State Nittany Lions", "Pittsburgh Panthers", "Purdue Boilermakers", "Rice Owls",
    "Rutgers Scarlet Knights", "Sam Houston Bearkats", "San Diego State Aztecs", "San José State Spartans",
    "SMU Mustangs", "South Alabama Jaguars", "South Carolina Gamecocks", "South Florida Bulls",
    "Southern Miss Golden Eagles", "Stanford Cardinal", "Syracuse Orange", "TCU Horned Frogs",
    "Temple Owls", "Tennessee Volunteers", "Texas A&M Aggies", "Texas Longhorns",
    "Texas State Bobcats", "Texas Tech Red Raiders", "Toledo Rockets", "Troy Trojans",
    "Tulane Green Wave", "Tulsa Golden Hurricane", "UAB Blazers", "UCF Knights",
    "UCLA Bruins", "UConn Huskies", "UL Monroe Warhawks", "UNLV Rebels",
    "USC Trojans", "Utah State Aggies", "Utah Utes", "UTEP Miners",
    "UTSA Roadrunners", "Vanderbilt Commodores", "Virginia Cavaliers", "Virginia Tech Hokies",
    "Wake Forest Demon Deacons", "Washington Huskies", "Washington State Cougars", "West Virginia Mountaineers",
    "Western Kentucky Hilltoppers", "Western Michigan Broncos", "Wisconsin Badgers", "Wyoming Cowboys"
  ],
  NCAAM: [
    "Abilene Christian Wildcats", "Air Force Falcons", "Akron Zips", "Alabama A&M Bulldogs",
    "Alabama Crimson Tide", "Alabama State Hornets", "Alcorn State Braves", "American University Eagles",
    "App State Mountaineers", "Arizona State Sun Devils", "Arizona Wildcats", "Arkansas Razorbacks",
    "Arkansas State Red Wolves", "Arkansas-Pine Bluff Golden Lions", "Army Black Knights", "Auburn Tigers",
    "Austin Peay Governors", "Ball State Cardinals", "Baylor Bears", "Bellarmine Knights",
    "Belmont Bruins", "Bethune-Cookman Wildcats", "Binghamton Bearcats", "Boise State Broncos",
    "Boston College Eagles", "Boston University Terriers", "Bowling Green Falcons", "Bradley Braves",
    "Brown Bears", "Bryant Bulldogs", "Bucknell Bison", "Buffalo Bulls",
    "Butler Bulldogs", "BYU Cougars", "Cal Poly Mustangs", "Cal State Bakersfield Roadrunners",
    "Cal State Fullerton Titans", "Cal State Northridge Matadors", "California Baptist Lancers", "California Golden Bears",
    "Campbell Fighting Camels", "Canisius Golden Griffins", "Central Arkansas Bears", "Central Connecticut Blue Devils",
    "Central Michigan Chippewas", "Charleston Cougars", "Charleston Southern Buccaneers", "Charlotte 49ers",
    "Chattanooga Mocs", "Chicago State Cougars", "Cincinnati Bearcats", "Clemson Tigers",
    "Cleveland State Vikings", "Coastal Carolina Chanticleers", "Colgate Raiders", "Colorado Buffaloes",
    "Colorado State Rams", "Columbia Lions", "Coppin State Eagles", "Cornell Big Red",
    "Creighton Bluejays", "Dartmouth Big Green", "Davidson Wildcats", "Dayton Flyers",
    "Delaware Blue Hens", "Delaware State Hornets", "Denver Pioneers", "DePaul Blue Demons",
    "Detroit Mercy Titans", "Drake Bulldogs", "Drexel Dragons", "Duke Blue Devils",
    "Duquesne Dukes", "East Carolina Pirates", "East Tennessee State Buccaneers", "East Texas A&M Lions",
    "Eastern Illinois Panthers", "Eastern Kentucky Colonels", "Eastern Michigan Eagles", "Eastern Washington Eagles",
    "Elon Phoenix", "Evansville Purple Aces", "Fairfield Stags", "Fairleigh Dickinson Knights",
    "Florida A&M Rattlers", "Florida Atlantic Owls", "Florida Gators", "Florida Gulf Coast Eagles",
    "Florida International Panthers", "Florida State Seminoles", "Fordham Rams", "Fresno State Bulldogs",
    "Furman Paladins", "Gardner-Webb Runnin' Bulldogs", "George Mason Patriots", "George Washington Revolutionaries",
    "Georgetown Hoyas", "Georgia Bulldogs", "Georgia Southern Eagles", "Georgia State Panthers",
    "Georgia Tech Yellow Jackets", "Gonzaga Bulldogs", "Grambling Tigers", "Grand Canyon Lopes",
    "Green Bay Phoenix", "Hampton Pirates", "Harvard Crimson", "Hawaii Rainbow Warriors",
    "High Point Panthers", "Hofstra Pride", "Holy Cross Crusaders", "Houston Christian Huskies",
    "Houston Cougars", "Howard Bison", "Idaho State Bengals", "Idaho Vandals",
    "Illinois Fighting Illini", "Illinois State Redbirds", "Incarnate Word Cardinals", "Indiana Hoosiers",
    "Indiana State Sycamores", "Iona Gaels", "Iowa Hawkeyes", "Iowa State Cyclones",
    "IU Indianapolis Jaguars", "Jackson State Tigers", "Jacksonville Dolphins", "Jacksonville State Gamecocks",
    "James Madison Dukes", "Kansas City Roos", "Kansas Jayhawks", "Kansas State Wildcats",
    "Kennesaw State Owls", "Kent State Golden Flashes", "Kentucky Wildcats", "La Salle Explorers",
    "Lafayette Leopards", "Lamar Cardinals", "Le Moyne Dolphins", "Lehigh Mountain Hawks",
    "Liberty Flames", "Lindenwood Lions", "Lipscomb Bisons", "Little Rock Trojans",
    "Long Beach State Beach", "Long Island University Sharks", "Longwood Lancers", "Louisiana Ragin' Cajuns",
    "Louisiana Tech Bulldogs", "Louisville Cardinals", "Loyola Chicago Ramblers", "Loyola Maryland Greyhounds",
    "Loyola Marymount Lions", "LSU Tigers", "Maine Black Bears", "Manhattan Jaspers",
    "Marist Red Foxes", "Marquette Golden Eagles", "Marshall Thundering Herd", "Maryland Eastern Shore Hawks",
    "Maryland Terrapins", "Massachusetts Minutemen", "McNeese Cowboys", "Memphis Tigers",
    "Mercer Bears", "Mercyhurst Lakers", "Merrimack Warriors", "Miami (OH) RedHawks",
    "Miami Hurricanes", "Michigan State Spartans", "Michigan Wolverines", "Middle Tennessee Blue Raiders",
    "Milwaukee Panthers", "Minnesota Golden Gophers", "Mississippi State Bulldogs", "Mississippi Valley State Delta Devils",
    "Missouri State Bears", "Missouri Tigers", "Monmouth Hawks", "Montana Grizzlies",
    "Montana State Bobcats", "Morehead State Eagles", "Morgan State Bears", "Mount St. Mary's Mountaineers",
    "Murray State Racers", "Navy Midshipmen", "NC State Wolfpack", "Nebraska Cornhuskers",
    "Nevada Wolf Pack", "New Hampshire Wildcats", "New Haven Chargers", "New Mexico Lobos",
    "New Mexico State Aggies", "New Orleans Privateers", "Niagara Purple Eagles", "Nicholls Colonels",
    "NJIT Highlanders", "Norfolk State Spartans", "North Alabama Lions", "North Carolina A&T Aggies",
    "North Carolina Central Eagles", "North Carolina Tar Heels", "North Dakota Fighting Hawks", "North Dakota State Bison",
    "North Florida Ospreys", "North Texas Mean Green", "Northeastern Huskies", "Northern Arizona Lumberjacks",
    "Northern Colorado Bears", "Northern Illinois Huskies", "Northern Iowa Panthers", "Northern Kentucky Norse",
    "Northwestern State Demons", "Northwestern Wildcats", "Notre Dame Fighting Irish", "Oakland Golden Grizzlies",
    "Ohio Bobcats", "Ohio State Buckeyes", "Oklahoma Sooners", "Oklahoma State Cowboys",
    "Old Dominion Monarchs", "Ole Miss Rebels", "Omaha Mavericks", "Oral Roberts Golden Eagles",
    "Oregon Ducks", "Oregon State Beavers", "Pacific Tigers", "Penn State Nittany Lions",
    "Pennsylvania Quakers", "Pepperdine Waves", "Pittsburgh Panthers", "Portland Pilots",
    "Portland State Vikings", "Prairie View A&M Panthers", "Presbyterian Blue Hose", "Princeton Tigers",
    "Providence Friars", "Purdue Boilermakers", "Purdue Fort Wayne Mastodons", "Queens University Royals",
    "Quinnipiac Bobcats", "Radford Highlanders", "Rhode Island Rams", "Rice Owls",
    "Richmond Spiders", "Rider Broncs", "Robert Morris Colonials", "Rutgers Scarlet Knights",
    "Sacramento State Hornets", "Sacred Heart Pioneers", "Saint Francis Red Flash", "Saint Joseph's Hawks",
    "Saint Louis Billikens", "Saint Mary's Gaels", "Saint Peter's Peacocks", "Sam Houston Bearkats",
    "Samford Bulldogs", "San Diego State Aztecs", "San Diego Toreros", "San Francisco Dons",
    "San José State Spartans", "Santa Clara Broncos", "SE Louisiana Lions", "Seattle U Redhawks",
    "Seton Hall Pirates", "Siena Saints", "SIU Edwardsville Cougars", "SMU Mustangs",
    "South Alabama Jaguars", "South Carolina Gamecocks", "South Carolina State Bulldogs", "South Carolina Upstate Spartans",
    "South Dakota Coyotes", "South Dakota State Jackrabbits", "South Florida Bulls", "Southeast Missouri State Redhawks",
    "Southern Illinois Salukis", "Southern Indiana Screaming Eagles", "Southern Jaguars", "Southern Miss Golden Eagles",
    "Southern Utah Thunderbirds", "St. Bonaventure Bonnies", "St. John's Red Storm", "St. Thomas-Minnesota Tommies",
    "Stanford Cardinal", "Stephen F. Austin Lumberjacks", "Stetson Hatters", "Stonehill Skyhawks",
    "Stony Brook Seawolves", "Syracuse Orange", "Tarleton State Texans", "TCU Horned Frogs",
    "Temple Owls", "Tennessee State Tigers", "Tennessee Tech Golden Eagles", "Tennessee Volunteers",
    "Texas A&M Aggies", "Texas A&M-Corpus Christi Islanders", "Texas Longhorns", "Texas Southern Tigers",
    "Texas State Bobcats", "Texas Tech Red Raiders", "The Citadel Bulldogs", "Toledo Rockets",
    "Towson Tigers", "Troy Trojans", "Tulane Green Wave", "Tulsa Golden Hurricane",
    "UAB Blazers", "UAlbany Great Danes", "UC Davis Aggies", "UC Irvine Anteaters",
    "UC Riverside Highlanders", "UC San Diego Tritons", "UC Santa Barbara Gauchos", "UCF Knights",
    "UCLA Bruins", "UConn Huskies", "UIC Flames", "UL Monroe Warhawks",
    "UMass Lowell River Hawks", "UMBC Retrievers", "UNC Asheville Bulldogs", "UNC Greensboro Spartans",
    "UNC Wilmington Seahawks", "UNLV Rebels", "USC Trojans", "UT Arlington Mavericks",
    "UT Martin Skyhawks", "UT Rio Grande Valley Vaqueros", "Utah State Aggies", "Utah Tech Trailblazers",
    "Utah Utes", "Utah Valley Wolverines", "UTEP Miners", "UTSA Roadrunners",
    "Valparaiso Beacons", "Vanderbilt Commodores", "VCU Rams", "Vermont Catamounts",
    "Villanova Wildcats", "Virginia Cavaliers", "Virginia Tech Hokies", "VMI Keydets",
    "Wagner Seahawks", "Wake Forest Demon Deacons", "Washington Huskies", "Washington State Cougars",
    "Weber State Wildcats", "West Georgia Wolves", "West Virginia Mountaineers", "Western Carolina Catamounts",
    "Western Illinois Leathernecks", "Western Kentucky Hilltoppers", "Western Michigan Broncos", "Wichita State Shockers",
    "William & Mary Tribe", "Winthrop Eagles", "Wisconsin Badgers", "Wofford Terriers",
    "Wright State Raiders", "Wyoming Cowboys", "Xavier Musketeers", "Yale Bulldogs",
    "Youngstown State Penguins"
  ],
  MLS: [
    "Atlanta United FC", "Austin FC", "CF Montréal", "Charlotte FC",
    "Chicago Fire FC", "Colorado Rapids", "Columbus Crew", "D.C. United",
    "FC Cincinnati", "FC Dallas", "Houston Dynamo FC", "Inter Miami CF",
    "LA Galaxy", "Los Angeles FC", "Minnesota United FC", "Nashville SC",
    "New England Revolution", "New York City FC", "New York Red Bulls", "Orlando City",
    "Philadelphia Union", "Portland Timbers", "Real Salt Lake", "San Diego FC",
    "San Jose Earthquakes", "Seattle Sounders FC", "Sporting Kansas City", "St. Louis City SC",
    "Toronto FC", "Vancouver Whitecaps FC"
  ]
};

const ManageTeams = () => {
  const [selectedTeams, setSelectedTeams] = useState<Array<{id: string, team_name: string, league: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openLeague, setOpenLeague] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Filter teams across all leagues based on search query
  const getSearchResults = () => {
    if (searchQuery.length < 3) return [];
    
    const results: Array<{ team: string; league: string }> = [];
    const lowerQuery = searchQuery.toLowerCase();
    
    Object.entries(TEAMS_BY_LEAGUE).forEach(([league, teams]) => {
      teams.forEach((team) => {
        if (team.toLowerCase().includes(lowerQuery)) {
          results.push({ team, league });
        }
      });
    });
    
    return results;
  };

  // Update search results visibility when query changes
  useEffect(() => {
    if (searchQuery.length >= 3) {
      setShowSearchResults(true);
    } else if (searchQuery.length === 0) {
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadUserTeams();
  }, []);

  const loadUserTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('user_teams')
        .select('*')
        .eq('user_id', '00000000-0000-0000-0000-000000000000') // Test UUID
        .order('league, team_name');

      if (error) throw error;
      setSelectedTeams(data || []);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast({
        title: "Error",
        description: "Failed to load your teams",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTeam = async (league: string, teamName: string) => {
    const existingTeam = selectedTeams.find(t => t.team_name === teamName && t.league === league);
    
    if (existingTeam) {
      // Remove team
      try {
        const { error } = await supabase
          .from('user_teams')
          .delete()
          .eq('id', existingTeam.id);

        if (error) throw error;
        
        setSelectedTeams(prev => prev.filter(t => t.id !== existingTeam.id));
        toast({
          title: "Team removed",
          description: `${teamName} has been removed from your teams`,
        });
      } catch (error) {
        console.error('Error removing team:', error);
        toast({
          title: "Error",
          description: "Failed to remove team",
          variant: "destructive",
        });
      }
    } else {
      // Add team
      try {
        const { data, error } = await supabase
          .from('user_teams')
          .insert({
            league,
            team_name: teamName,
            user_id: '00000000-0000-0000-0000-000000000000' // Test UUID
          })
          .select()
          .single();

        if (error) throw error;
        
        setSelectedTeams(prev => [...prev, data]);
        toast({
          title: "Team added",
          description: `${teamName} has been added to your teams`,
        });
      } catch (error: any) {
        console.error('Error adding team:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        toast({
          title: "Error",
          description: `Failed to add team: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    }
  };

  const isTeamSelected = (league: string, teamName: string) => {
    return selectedTeams.some(t => t.team_name === teamName && t.league === league);
  };

  const clearAllTeams = async () => {
    if (selectedTeams.length === 0) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_teams')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      
      setSelectedTeams([]);
      toast({
        title: "Teams cleared",
        description: "All teams have been removed from your selections",
      });
    } catch (error) {
      console.error('Error clearing teams:', error);
      toast({
        title: "Error",
        description: "Failed to clear teams",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading your teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/news')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">Manage Teams</h1>
          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {selectedTeams.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllTeams}
                disabled={saving}
                className="text-xs md:text-sm"
              >
                Clear All
              </Button>
            )}
            <Badge variant="secondary" className="text-xs">
              {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''}
            </Badge>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 pb-20">
          {showSearchResults ? (
            /* Search Results View */
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Search Results</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearchResults(false);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </CardHeader>
              <CardContent>
                {getSearchResults().length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {getSearchResults().map(({ team, league }) => {
                      const isSelected = isTeamSelected(league, team);
                      return (
                        <Button
                          key={`${league}-${team}`}
                          variant={isSelected ? "default" : "outline"}
                          className="justify-start h-auto py-3 px-3 text-left w-full"
                          onClick={() => toggleTeam(league, team)}
                        >
                          <div className="flex flex-col gap-1 w-full min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <img 
                                src={getTeamLogo(team, league)}
                                alt={`${team} logo`}
                                className="w-6 h-6 object-contain flex-shrink-0"
                                onError={(e) => e.currentTarget.style.display = 'none'}
                              />
                              <span className="text-sm font-medium truncate flex-1">{team}</span>
                              {isSelected ? (
                                <X className="h-4 w-4 flex-shrink-0" />
                              ) : (
                                <Plus className="h-4 w-4 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-8">
                              <img 
                                src={getLeagueLogo(league)}
                                alt={`${league} logo`}
                                className="w-4 h-4 object-contain"
                                onError={(e) => e.currentTarget.style.display = 'none'}
                              />
                              <span className="text-xs text-muted-foreground">{league}</span>
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No teams found matching "{searchQuery}"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Normal Collapsible League Sections */
            <div className="space-y-4">
              {Object.entries(TEAMS_BY_LEAGUE).map(([league, teams]) => {
                const leagueSelectedTeams = selectedTeams.filter(t => t.league === league);
                
                return (
                  <Collapsible 
                    key={league}
                    open={openLeague === league}
                    onOpenChange={(isOpen) => setOpenLeague(isOpen ? league : null)}
                  >
                    <Card>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-6 h-auto hover:bg-accent"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <img 
                              src={getLeagueLogo(league)}
                              alt={`${league} logo`}
                              className="w-10 h-10 object-contain flex-shrink-0"
                              onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                            <span className="text-lg font-semibold flex-shrink-0">{league}</span>
                            
                            {/* Selected teams displayed inline */}
                            {leagueSelectedTeams.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                                {leagueSelectedTeams.map((team) => (
                                  <Badge 
                                    key={team.id} 
                                    variant="secondary" 
                                    className="flex items-center gap-1.5 py-1 px-2"
                                  >
                                    <img 
                                      src={getTeamLogo(team.team_name, team.league)}
                                      alt={`${team.team_name} logo`}
                                      className="w-4 h-4 object-contain"
                                      onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                    <span className="text-xs truncate max-w-[120px]">{team.team_name}</span>
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                No teams selected
                              </Badge>
                            )}
                          </div>
                          
                          <ChevronDown 
                            className={`h-5 w-5 flex-shrink-0 ml-2 transition-transform duration-200 ${
                              openLeague === league ? 'transform rotate-180' : ''
                            }`}
                          />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          {/* All Teams Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                            {teams.map((team) => {
                              const isSelected = isTeamSelected(league, team);
                              return (
                                <Button
                                  key={team}
                                  variant={isSelected ? "default" : "outline"}
                                  className="justify-start h-14 py-2 px-2 text-left w-full"
                                  onClick={() => toggleTeam(league, team)}
                                >
                                  <div className="flex items-center justify-between w-full min-w-0">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <img 
                                        src={getTeamLogo(team, league)}
                                        alt={`${team} logo`}
                                        className="w-7 h-7 object-contain flex-shrink-0"
                                        onError={(e) => {
                                          console.log(`Failed to load logo for ${team}`);
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                      <span className="text-xs truncate">{team}</span>
                                    </div>
                                    {isSelected ? (
                                      <X className="h-3.5 w-3.5 ml-1 flex-shrink-0" />
                                    ) : (
                                      <Plus className="h-3.5 w-3.5 ml-1 flex-shrink-0" />
                                    )}
                                  </div>
                                </Button>
                              );
                            })}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 safe-area-pb">
        <div className="container mx-auto">
          <Button 
            onClick={() => navigate('/news')} 
            className="w-full"
            size="lg"
          >
            Continue to News
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManageTeams;
