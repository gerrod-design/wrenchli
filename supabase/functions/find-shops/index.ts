import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";

const BASE_URL = "https://wrenchli.lovable.app";

interface ServiceProvider {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  address: string;
  phone: string;
  distance_miles: number;
  specialties: string[];
  price_tier: "budget" | "mid" | "premium";
  response_time: string;
  availability: "same_day" | "next_day" | "within_week";
  wrenchli_verified: boolean;
  quote_url: string;
  is_dealer?: boolean;
  dealer_brands?: string[];
  is_partnered?: boolean;
}

/* ── Location Mapping ── */
const locationMap: Record<string, string> = {
  // Michigan — Detroit Metro
  warren: "Warren", "48088": "Warren", "48089": "Warren", "48091": "Warren", "48092": "Warren", "48093": "Warren", "48094": "Warren", "48095": "Warren",
  birmingham: "Birmingham", "48009": "Birmingham", "48012": "Birmingham", "48025": "Birmingham", "48301": "Birmingham", "48302": "Birmingham", "48303": "Birmingham", "48304": "Birmingham",
  troy: "Troy", "48007": "Troy", "48083": "Troy", "48084": "Troy", "48085": "Troy", "48098": "Troy", "48099": "Troy",
  sterling: "Sterling Heights", "48310": "Sterling Heights", "48311": "Sterling Heights", "48312": "Sterling Heights", "48313": "Sterling Heights", "48314": "Sterling Heights", "48315": "Sterling Heights", "48316": "Sterling Heights", "48317": "Sterling Heights",
  "ann arbor": "Ann Arbor", "48103": "Ann Arbor", "48104": "Ann Arbor", "48105": "Ann Arbor", "48106": "Ann Arbor", "48107": "Ann Arbor", "48108": "Ann Arbor", "48109": "Ann Arbor", "48113": "Ann Arbor",
  dearborn: "Dearborn", "48120": "Dearborn", "48121": "Dearborn", "48123": "Dearborn", "48124": "Dearborn", "48126": "Dearborn", "48128": "Dearborn",
  livonia: "Livonia", "48150": "Livonia", "48151": "Livonia", "48152": "Livonia", "48153": "Livonia", "48154": "Livonia",
  detroit: "Detroit", "48201": "Detroit", "48202": "Detroit", "48203": "Detroit", "48204": "Detroit", "48205": "Detroit", "48206": "Detroit", "48207": "Detroit", "48208": "Detroit", "48209": "Detroit", "48210": "Detroit", "48211": "Detroit", "48212": "Detroit", "48213": "Detroit", "48214": "Detroit", "48215": "Detroit", "48216": "Detroit", "48217": "Detroit", "48218": "Detroit", "48219": "Detroit", "48221": "Detroit", "48222": "Detroit", "48223": "Detroit", "48224": "Detroit", "48225": "Detroit", "48226": "Detroit", "48227": "Detroit", "48228": "Detroit", "48229": "Detroit", "48230": "Detroit", "48231": "Detroit", "48232": "Detroit", "48233": "Detroit", "48234": "Detroit", "48235": "Detroit", "48236": "Detroit", "48237": "Detroit", "48238": "Detroit", "48239": "Detroit", "48240": "Detroit", "48242": "Detroit", "48243": "Detroit",
  southfield: "Southfield", "48033": "Southfield", "48034": "Southfield", "48037": "Southfield", "48075": "Southfield", "48076": "Southfield", "48086": "Southfield",
  "royal oak": "Royal Oak", "48067": "Royal Oak", "48068": "Royal Oak", "48073": "Royal Oak", "48074": "Royal Oak",
  farmington: "Farmington Hills", "48331": "Farmington Hills", "48332": "Farmington Hills", "48333": "Farmington Hills", "48334": "Farmington Hills", "48335": "Farmington Hills", "48336": "Farmington Hills",
  novi: "Novi", "48374": "Novi", "48375": "Novi", "48376": "Novi", "48377": "Novi",
  canton: "Canton", "48187": "Canton", "48188": "Canton",
  // MI — cities with own shops
  pontiac: "Pontiac", "48340": "Pontiac", "48341": "Pontiac", "48342": "Pontiac", "48343": "Pontiac",
  "rochester hills": "Rochester Hills", rochester: "Rochester Hills", "48306": "Rochester Hills", "48307": "Rochester Hills", "48308": "Rochester Hills", "48309": "Rochester Hills",
  westland: "Westland", "48185": "Westland", "48186": "Westland",
  plymouth: "Plymouth", "48170": "Plymouth", "48171": "Plymouth",
  ypsilanti: "Ypsilanti", "48197": "Ypsilanti", "48198": "Ypsilanti",
  // MI — nearby cities → nearest shop city
  "clarkston": "Pontiac", "48346": "Pontiac", "48347": "Pontiac", "48348": "Pontiac",
  "waterford": "Pontiac", "48327": "Pontiac", "48328": "Pontiac", "48329": "Pontiac",
  "lake orion": "Rochester Hills", "48359": "Rochester Hills", "48360": "Rochester Hills", "48361": "Rochester Hills", "48362": "Rochester Hills",
  "garden city": "Westland", "48135": "Westland", "48136": "Westland",
  "inkster": "Westland", "48141": "Westland",
  "wayne": "Westland", "48184": "Westland",
  "redford": "Detroit", "48239": "Detroit", "48240": "Detroit",
  "taylor": "Dearborn", "48180": "Dearborn",
  "lincoln park": "Dearborn", "48146": "Dearborn",
  "allen park": "Dearborn", "48101": "Dearborn",
  "wyandotte": "Dearborn", "48192": "Dearborn",
  "roseville": "Warren", "48066": "Warren",
  "eastpointe": "Warren", "48021": "Warren",
  "st clair shores": "Warren", "48080": "Warren", "48081": "Warren", "48082": "Warren",
  "madison heights": "Royal Oak", "48071": "Royal Oak",
  "hazel park": "Royal Oak", "48030": "Royal Oak",
  "berkley": "Royal Oak", "48072": "Royal Oak",
  "clawson": "Royal Oak", "48017": "Royal Oak",
  "northville": "Plymouth", "48167": "Plymouth", "48168": "Plymouth",
  "wixom": "Novi", "48393": "Novi",
  "south lyon": "Novi", "48178": "Novi",
  "milford": "Novi", "48381": "Novi",
  "commerce": "Farmington Hills", "48382": "Farmington Hills", "48390": "Farmington Hills",
  "west bloomfield": "Farmington Hills", "48322": "Farmington Hills", "48323": "Farmington Hills", "48324": "Farmington Hills", "48325": "Farmington Hills",
  "bloomfield": "Birmingham", "48320": "Birmingham", "48321": "Birmingham",
  "belleville": "Ypsilanti", "48111": "Ypsilanti", "48112": "Ypsilanti",
  "saline": "Ann Arbor", "48176": "Ann Arbor",
  // Flint area
  flint: "Flint", "48501": "Flint", "48502": "Flint", "48503": "Flint", "48504": "Flint", "48505": "Flint", "48506": "Flint", "48507": "Flint", "48509": "Flint",
  "burton": "Flint", "48519": "Flint", "48529": "Flint",
  "grand blanc": "Flint", "48439": "Flint",
  "fenton": "Flint", "48430": "Flint",
  // Lansing area
  lansing: "Lansing", "48901": "Lansing", "48906": "Lansing", "48910": "Lansing", "48911": "Lansing", "48912": "Lansing", "48915": "Lansing", "48917": "Lansing", "48924": "Lansing",
  "east lansing": "Lansing", "48823": "Lansing", "48824": "Lansing", "48825": "Lansing", "48826": "Lansing",
  "okemos": "Lansing", "48864": "Lansing",
  // Kalamazoo area
  kalamazoo: "Kalamazoo", "49001": "Kalamazoo", "49002": "Kalamazoo", "49003": "Kalamazoo", "49004": "Kalamazoo", "49006": "Kalamazoo", "49007": "Kalamazoo", "49008": "Kalamazoo", "49009": "Kalamazoo",
  "portage": "Kalamazoo", "49002": "Kalamazoo", "49024": "Kalamazoo",
  // Grand Rapids area
  "grand rapids": "Grand Rapids", "49501": "Grand Rapids", "49503": "Grand Rapids", "49504": "Grand Rapids", "49505": "Grand Rapids", "49506": "Grand Rapids", "49507": "Grand Rapids", "49508": "Grand Rapids", "49509": "Grand Rapids", "49512": "Grand Rapids", "49525": "Grand Rapids", "49534": "Grand Rapids", "49546": "Grand Rapids",
  "wyoming": "Grand Rapids", "49509": "Grand Rapids", "49519": "Grand Rapids",
  "kentwood": "Grand Rapids", "49508": "Grand Rapids", "49512": "Grand Rapids",
  // Ohio
  columbus: "Columbus", "43201": "Columbus", "43202": "Columbus", "43203": "Columbus", "43204": "Columbus", "43205": "Columbus", "43206": "Columbus", "43207": "Columbus", "43209": "Columbus", "43210": "Columbus", "43211": "Columbus", "43212": "Columbus", "43213": "Columbus", "43214": "Columbus", "43215": "Columbus", "43216": "Columbus", "43217": "Columbus", "43218": "Columbus", "43219": "Columbus", "43220": "Columbus", "43221": "Columbus", "43222": "Columbus", "43223": "Columbus", "43224": "Columbus", "43226": "Columbus", "43227": "Columbus", "43228": "Columbus", "43229": "Columbus", "43230": "Columbus", "43231": "Columbus", "43232": "Columbus", "43234": "Columbus", "43235": "Columbus", "43236": "Columbus", "43240": "Columbus",
  toledo: "Toledo", "43601": "Toledo", "43603": "Toledo", "43604": "Toledo", "43605": "Toledo", "43606": "Toledo", "43607": "Toledo", "43608": "Toledo", "43609": "Toledo", "43610": "Toledo", "43611": "Toledo", "43612": "Toledo", "43613": "Toledo", "43614": "Toledo", "43615": "Toledo", "43617": "Toledo", "43620": "Toledo", "43623": "Toledo", "43635": "Toledo",
  dublin: "Dublin", "43016": "Dublin", "43017": "Dublin",
  westerville: "Westerville", "43081": "Westerville", "43082": "Westerville",
  "bowling green": "Bowling Green", "43402": "Bowling Green", "43403": "Bowling Green",
  perrysburg: "Perrysburg", "43551": "Perrysburg", "43552": "Perrysburg",
  // OH — nearby cities → nearest shop city
  "hilliard": "Hilliard", "43026": "Hilliard",
  "grove city": "Columbus", "43123": "Columbus",
  "reynoldsburg": "Columbus", "43068": "Columbus",
  "gahanna": "Columbus", "43230": "Columbus",
  "upper arlington": "Columbus", "43220": "Columbus", "43221": "Columbus",
  "worthington": "Columbus", "43085": "Columbus",
  "powell": "Dublin", "43065": "Dublin",
  "delaware": "Dublin", "43015": "Dublin",
  "maumee": "Toledo", "43537": "Toledo",
  "sylvania": "Toledo", "43560": "Toledo",
  "oregon": "Toledo", "43616": "Toledo",
  "findlay": "Perrysburg", "45839": "Perrysburg", "45840": "Perrysburg",
  // OH — Cleveland area
  cleveland: "Cleveland", "44101": "Cleveland", "44102": "Cleveland", "44103": "Cleveland", "44104": "Cleveland", "44105": "Cleveland", "44106": "Cleveland", "44107": "Cleveland", "44108": "Cleveland", "44109": "Cleveland", "44110": "Cleveland", "44111": "Cleveland", "44112": "Cleveland", "44113": "Cleveland", "44114": "Cleveland", "44115": "Cleveland", "44118": "Cleveland", "44119": "Cleveland", "44120": "Cleveland", "44121": "Cleveland", "44125": "Cleveland", "44127": "Cleveland", "44128": "Cleveland", "44129": "Cleveland", "44130": "Cleveland", "44134": "Cleveland", "44135": "Cleveland",
  "parma": "Cleveland", "44129": "Cleveland", "44130": "Cleveland", "44134": "Cleveland",
  "lakewood": "Cleveland", "44107": "Cleveland",
  "euclid": "Cleveland", "44117": "Cleveland", "44123": "Cleveland", "44132": "Cleveland",
  // OH — Cincinnati area
  cincinnati: "Cincinnati", "45201": "Cincinnati", "45202": "Cincinnati", "45203": "Cincinnati", "45204": "Cincinnati", "45205": "Cincinnati", "45206": "Cincinnati", "45207": "Cincinnati", "45208": "Cincinnati", "45209": "Cincinnati", "45210": "Cincinnati", "45211": "Cincinnati", "45212": "Cincinnati", "45213": "Cincinnati", "45214": "Cincinnati", "45215": "Cincinnati", "45216": "Cincinnati", "45217": "Cincinnati", "45218": "Cincinnati", "45219": "Cincinnati", "45220": "Cincinnati", "45223": "Cincinnati", "45224": "Cincinnati", "45225": "Cincinnati", "45226": "Cincinnati", "45227": "Cincinnati", "45229": "Cincinnati", "45230": "Cincinnati", "45231": "Cincinnati", "45232": "Cincinnati", "45233": "Cincinnati", "45236": "Cincinnati", "45237": "Cincinnati", "45238": "Cincinnati", "45239": "Cincinnati", "45240": "Cincinnati", "45241": "Cincinnati", "45242": "Cincinnati", "45243": "Cincinnati", "45244": "Cincinnati", "45245": "Cincinnati", "45246": "Cincinnati", "45247": "Cincinnati", "45248": "Cincinnati", "45249": "Cincinnati", "45251": "Cincinnati", "45252": "Cincinnati",
  "mason": "Cincinnati", "45040": "Cincinnati",
  "west chester": "Cincinnati", "45069": "Cincinnati",
  // OH — Dayton area
  dayton: "Dayton", "45401": "Dayton", "45402": "Dayton", "45403": "Dayton", "45404": "Dayton", "45405": "Dayton", "45406": "Dayton", "45409": "Dayton", "45410": "Dayton", "45414": "Dayton", "45415": "Dayton", "45416": "Dayton", "45417": "Dayton", "45419": "Dayton", "45420": "Dayton", "45424": "Dayton", "45426": "Dayton", "45428": "Dayton", "45429": "Dayton", "45430": "Dayton", "45431": "Dayton", "45432": "Dayton", "45433": "Dayton", "45439": "Dayton", "45440": "Dayton",
  "kettering": "Dayton", "45429": "Dayton", "45420": "Dayton",
  "beavercreek": "Dayton", "45431": "Dayton", "45432": "Dayton",
  // OH — Akron area
  akron: "Akron", "44301": "Akron", "44302": "Akron", "44303": "Akron", "44304": "Akron", "44305": "Akron", "44306": "Akron", "44307": "Akron", "44308": "Akron", "44310": "Akron", "44311": "Akron", "44312": "Akron", "44313": "Akron", "44314": "Akron", "44319": "Akron", "44320": "Akron",
  "canton oh": "Akron", "44701": "Akron", "44702": "Akron", "44703": "Akron", "44704": "Akron", "44705": "Akron", "44706": "Akron", "44707": "Akron", "44708": "Akron", "44709": "Akron", "44710": "Akron", "44711": "Akron", "44714": "Akron", "44718": "Akron", "44720": "Akron", "44721": "Akron",
};

/* ── ZIP prefix → state mapping for fallback ── */
const zipPrefixToState: Record<string, string> = {
  "480": "MI", "481": "MI", "482": "MI", "483": "MI", "484": "MI", "485": "MI", "486": "MI", "487": "MI", "488": "MI", "489": "MI", "490": "MI", "491": "MI", "492": "MI", "493": "MI", "494": "MI", "495": "MI", "496": "MI", "497": "MI", "498": "MI", "499": "MI",
  "430": "OH", "431": "OH", "432": "OH", "433": "OH", "434": "OH", "435": "OH", "436": "OH", "437": "OH", "438": "OH", "439": "OH", "440": "OH", "441": "OH", "442": "OH", "443": "OH", "444": "OH", "445": "OH", "446": "OH", "447": "OH", "448": "OH", "449": "OH", "450": "OH", "451": "OH", "452": "OH", "453": "OH", "454": "OH", "455": "OH", "456": "OH", "457": "OH", "458": "OH",
};

const stateAddressTag: Record<string, string> = { MI: ", MI ", OH: ", OH " };

const LUXURY_BRANDS = ["BMW", "Mercedes-Benz", "Audi", "Lexus"];

/* ── Coordinates for map pins ── */
const cityCoords: Record<string, { lat: number; lng: number }> = {
  Warren: { lat: 42.4897, lng: -83.0148 },
  Birmingham: { lat: 42.5467, lng: -83.2113 },
  Troy: { lat: 42.5803, lng: -83.1458 },
  "Sterling Heights": { lat: 42.5803, lng: -83.0302 },
  "Ann Arbor": { lat: 42.2808, lng: -83.7430 },
  Dearborn: { lat: 42.3223, lng: -83.1763 },
  Livonia: { lat: 42.3684, lng: -83.3527 },
  Detroit: { lat: 42.3314, lng: -83.0458 },
  Southfield: { lat: 42.4734, lng: -83.2219 },
  "Royal Oak": { lat: 42.4895, lng: -83.1446 },
  "Farmington Hills": { lat: 42.4853, lng: -83.3771 },
  Novi: { lat: 42.4801, lng: -83.4755 },
  Canton: { lat: 42.3087, lng: -83.4816 },
  Pontiac: { lat: 42.6389, lng: -83.2910 },
  "Rochester Hills": { lat: 42.6584, lng: -83.1499 },
  Westland: { lat: 42.3242, lng: -83.4002 },
  Plymouth: { lat: 42.3714, lng: -83.4702 },
  Ypsilanti: { lat: 42.2411, lng: -83.6130 },
  Flint: { lat: 43.0125, lng: -83.6875 },
  Lansing: { lat: 42.7325, lng: -84.5555 },
  Kalamazoo: { lat: 42.2917, lng: -85.5872 },
  "Grand Rapids": { lat: 42.9634, lng: -85.6681 },
  // Ohio
  Columbus: { lat: 39.9612, lng: -82.9988 },
  Toledo: { lat: 41.6528, lng: -83.5379 },
  Dublin: { lat: 40.0992, lng: -83.1141 },
  Westerville: { lat: 40.1262, lng: -82.9291 },
  Hilliard: { lat: 40.0334, lng: -83.1585 },
  "Bowling Green": { lat: 41.3748, lng: -83.6513 },
  Perrysburg: { lat: 41.5570, lng: -83.6271 },
  Cleveland: { lat: 41.4993, lng: -81.6944 },
  Cincinnati: { lat: 39.1031, lng: -84.5120 },
  Dayton: { lat: 39.7589, lng: -84.1916 },
  Akron: { lat: 41.0814, lng: -81.5190 },
};

const b = BASE_URL;

function getProvidersDatabase(): ServiceProvider[] {
  return [
    { id: "warren_precision", name: "Precision Auto Repair", rating: 4.7, review_count: 143, address: "123 Main St, Warren, MI 48091", phone: "(586) 555-0123", distance_miles: 0, specialties: ["general", "engine", "brakes", "transmission"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=warren_precision` },
    { id: "warren_auto_tech", name: "Auto Technology Inc", rating: 4.5, review_count: 89, address: "456 Van Dyke Ave, Warren, MI 48091", phone: "(586) 353-5700", distance_miles: 2, specialties: ["general", "domestic", "import"], price_tier: "mid", response_time: "4 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=warren_auto_tech` },
    { id: "birmingham_auto_europe", name: "Auto Europe", rating: 4.9, review_count: 156, address: "677 S Eton St, Birmingham, MI 48009", phone: "(248) 645-6300", distance_miles: 0, specialties: ["european", "luxury", "bmw", "mercedes", "audi"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=birmingham_auto_europe` },
    { id: "birmingham_first_call", name: "First Call Auto", rating: 4.6, review_count: 78, address: "890 Maple Rd, Birmingham, MI 48009", phone: "(248) 555-0789", distance_miles: 1, specialties: ["european", "domestic", "general"], price_tier: "premium", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=birmingham_first_call` },
    { id: "troy_auto_pro", name: "Auto Pro", rating: 4.8, review_count: 234, address: "1234 Big Beaver Rd, Troy, MI 48084", phone: "(248) 555-0456", distance_miles: 0, specialties: ["general", "brakes", "electrical", "ac_service"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=troy_auto_pro` },
    { id: "troy_auto_lab", name: "Auto Lab", rating: 4.4, review_count: 167, address: "5678 Rochester Rd, Troy, MI 48084", phone: "(248) 555-0321", distance_miles: 2, specialties: ["general", "oil_change", "brakes", "transmission"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=troy_auto_lab` },
    { id: "sterling_family_auto", name: "Sterling Family Auto Care", rating: 4.6, review_count: 198, address: "9012 Van Dyke Ave, Sterling Heights, MI 48315", phone: "(586) 555-0654", distance_miles: 0, specialties: ["general", "family_service", "brakes", "maintenance"], price_tier: "mid", response_time: "3 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=sterling_family_auto` },
    { id: "annarbor_student_auto", name: "A2 Student Auto Service", rating: 4.3, review_count: 156, address: "3456 Washtenaw Ave, Ann Arbor, MI 48104", phone: "(734) 555-0987", distance_miles: 0, specialties: ["general", "budget_friendly", "student_specials"], price_tier: "budget", response_time: "4 hours", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=annarbor_student_auto` },
    { id: "annarbor_professional_auto", name: "Ann Arbor Professional Auto", rating: 4.7, review_count: 89, address: "7890 Plymouth Rd, Ann Arbor, MI 48104", phone: "(734) 555-0147", distance_miles: 3, specialties: ["general", "import", "luxury"], price_tier: "premium", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=annarbor_professional_auto` },
    { id: "dearborn_motor_city_auto", name: "Motor City Auto Works", rating: 4.8, review_count: 212, address: "2345 Michigan Ave, Dearborn, MI 48124", phone: "(313) 555-0234", distance_miles: 0, specialties: ["general", "domestic", "engine", "transmission"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=dearborn_motor_city_auto` },
    { id: "dearborn_ford_country", name: "Ford Country Service Center", rating: 4.6, review_count: 178, address: "4567 Ford Rd, Dearborn, MI 48124", phone: "(313) 555-0567", distance_miles: 1, specialties: ["domestic", "ford", "general", "electrical"], price_tier: "mid", response_time: "3 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=dearborn_ford_country` },
    { id: "dearborn_value_auto", name: "Value Auto Repair", rating: 4.4, review_count: 134, address: "6789 Telegraph Rd, Dearborn, MI 48124", phone: "(313) 555-0891", distance_miles: 2, specialties: ["general", "brakes", "oil_change", "budget_friendly"], price_tier: "budget", response_time: "4 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=dearborn_value_auto` },
    { id: "livonia_suburban_auto", name: "Suburban Auto Care", rating: 4.7, review_count: 189, address: "12345 Middlebelt Rd, Livonia, MI 48150", phone: "(734) 555-0345", distance_miles: 0, specialties: ["general", "family_service", "brakes", "maintenance"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=livonia_suburban_auto` },
    { id: "livonia_euro_tech", name: "Euro Tech Auto Specialists", rating: 4.8, review_count: 145, address: "23456 Plymouth Rd, Livonia, MI 48150", phone: "(734) 555-0678", distance_miles: 2, specialties: ["european", "luxury", "bmw", "mercedes", "volkswagen"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=livonia_euro_tech` },
    { id: "livonia_quick_lane", name: "Quick Lane Livonia", rating: 4.3, review_count: 267, address: "34567 Seven Mile Rd, Livonia, MI 48150", phone: "(734) 555-0912", distance_miles: 3, specialties: ["general", "oil_change", "tires", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=livonia_quick_lane` },
    { id: "detroit_downtown_auto", name: "Downtown Detroit Auto Service", rating: 4.7, review_count: 245, address: "1200 Woodward Ave, Detroit, MI 48201", phone: "(313) 555-1200", distance_miles: 0, specialties: ["general", "domestic", "engine", "electrical"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=detroit_downtown_auto` },
    { id: "detroit_cass_corridor_auto", name: "Cass Corridor Auto Repair", rating: 4.5, review_count: 178, address: "4500 Cass Ave, Detroit, MI 48201", phone: "(313) 555-4500", distance_miles: 1, specialties: ["general", "brakes", "suspension", "budget_friendly"], price_tier: "budget", response_time: "3 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=detroit_cass_corridor_auto` },
    { id: "detroit_midtown_motors", name: "Midtown Motors", rating: 4.8, review_count: 134, address: "3456 Second Ave, Detroit, MI 48201", phone: "(313) 555-3456", distance_miles: 2, specialties: ["european", "luxury", "import", "hybrid"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=detroit_midtown_motors` },
    // Non-partnered shops (real dealerships, demand-capture only)
    { id: "detroit_bob_maxey_ford", name: "Bob Maxey Ford", rating: 4.4, review_count: 892, address: "16901 Mack Ave, Detroit, MI 48224", phone: "(313) 885-4000", distance_miles: 4, specialties: ["domestic", "ford", "general", "oil_change"], price_tier: "mid", response_time: "4 hours", availability: "next_day", wrenchli_verified: false, is_partnered: false, is_dealer: true, dealer_brands: ["Ford"], quote_url: `${b}/find-shops` },
    { id: "detroit_james_martin_chevy", name: "James Martin Chevrolet", rating: 4.3, review_count: 654, address: "65 E Maple Rd, Detroit, MI 48203", phone: "(313) 875-0500", distance_miles: 3, specialties: ["domestic", "chevrolet", "general", "transmission"], price_tier: "mid", response_time: "4 hours", availability: "next_day", wrenchli_verified: false, is_partnered: false, is_dealer: true, dealer_brands: ["Chevrolet"], quote_url: `${b}/find-shops` },
    { id: "detroit_ray_laethem_chrysler", name: "Ray Laethem Chrysler Dodge Jeep Ram", rating: 4.2, review_count: 723, address: "18001 Mack Ave, Detroit, MI 48224", phone: "(313) 886-1700", distance_miles: 5, specialties: ["domestic", "chrysler", "dodge", "jeep", "ram"], price_tier: "mid", response_time: "4 hours", availability: "next_day", wrenchli_verified: false, is_partnered: false, is_dealer: true, dealer_brands: ["Chrysler", "Dodge", "Jeep"], quote_url: `${b}/find-shops` },
    // Non-partnered — Troy, MI
    { id: "troy_suburban_ford", name: "Suburban Ford of Troy", rating: 4.3, review_count: 567, address: "1800 Maplelawn Dr, Troy, MI 48084", phone: "(248) 689-9600", distance_miles: 3, specialties: ["domestic", "ford", "general", "oil_change"], price_tier: "mid", response_time: "4 hours", availability: "next_day", wrenchli_verified: false, is_partnered: false, is_dealer: true, dealer_brands: ["Ford"], quote_url: `${b}/find-shops` },
    { id: "troy_suburban_toyota", name: "Suburban Toyota of Troy", rating: 4.5, review_count: 812, address: "1821 Maplelawn Dr, Troy, MI 48084", phone: "(248) 649-2600", distance_miles: 3, specialties: ["import", "toyota", "general", "hybrid"], price_tier: "mid", response_time: "4 hours", availability: "next_day", wrenchli_verified: false, is_partnered: false, is_dealer: true, dealer_brands: ["Toyota"], quote_url: `${b}/find-shops` },
    { id: "troy_suburban_cadillac", name: "Suburban Cadillac of Troy", rating: 4.4, review_count: 423, address: "1810 Maplelawn Dr, Troy, MI 48084", phone: "(248) 643-0070", distance_miles: 3, specialties: ["domestic", "cadillac", "luxury", "general"], price_tier: "premium", response_time: "4 hours", availability: "next_day", wrenchli_verified: false, is_partnered: false, is_dealer: true, dealer_brands: ["Cadillac"], quote_url: `${b}/find-shops` },
    // Non-partnered — Ann Arbor, MI
    { id: "annarbor_briarwood_ford", name: "Briarwood Ford", rating: 4.2, review_count: 634, address: "7070 S State St, Ann Arbor, MI 48108", phone: "(734) 429-5478", distance_miles: 4, specialties: ["domestic", "ford", "general", "oil_change"], price_tier: "mid", response_time: "4 hours", availability: "next_day", wrenchli_verified: false, is_partnered: false, is_dealer: true, dealer_brands: ["Ford"], quote_url: `${b}/find-shops` },
    { id: "annarbor_toyota", name: "Ann Arbor Toyota", rating: 4.6, review_count: 945, address: "3745 Jackson Rd, Ann Arbor, MI 48103", phone: "(734) 769-3991", distance_miles: 3, specialties: ["import", "toyota", "general", "hybrid"], price_tier: "mid", response_time: "4 hours", availability: "next_day", wrenchli_verified: false, is_partnered: false, is_dealer: true, dealer_brands: ["Toyota"], quote_url: `${b}/find-shops` },
    { id: "annarbor_germain_honda", name: "Germain Honda of Ann Arbor", rating: 4.5, review_count: 756, address: "2601 S State St, Ann Arbor, MI 48104", phone: "(734) 761-3200", distance_miles: 2, specialties: ["import", "honda", "general", "maintenance"], price_tier: "mid", response_time: "4 hours", availability: "next_day", wrenchli_verified: false, is_partnered: false, is_dealer: true, dealer_brands: ["Honda"], quote_url: `${b}/find-shops` },
    // Non-partnered — Columbus, OH
    { id: "columbus_ricart_ford", name: "Ricart Ford", rating: 4.3, review_count: 1123, address: "4255 S Hamilton Rd, Columbus, OH 43125", phone: "(614) 836-3333", distance_miles: 5, specialties: ["domestic", "ford", "general", "oil_change"], price_tier: "mid", response_time: "4 hours", availability: "next_day", wrenchli_verified: false, is_partnered: false, is_dealer: true, dealer_brands: ["Ford"], quote_url: `${b}/find-shops` },
    { id: "columbus_germain_toyota", name: "Germain Toyota of Columbus", rating: 4.5, review_count: 876, address: "5711 Scarborough Blvd, Columbus, OH 43232", phone: "(614) 868-5800", distance_miles: 4, specialties: ["import", "toyota", "general", "hybrid"], price_tier: "mid", response_time: "4 hours", availability: "next_day", wrenchli_verified: false, is_partnered: false, is_dealer: true, dealer_brands: ["Toyota"], quote_url: `${b}/find-shops` },
    { id: "columbus_byers_chevy", name: "Byers Chevrolet", rating: 4.4, review_count: 687, address: "2455 Billingsley Rd, Columbus, OH 43235", phone: "(614) 761-1222", distance_miles: 3, specialties: ["domestic", "chevrolet", "general", "transmission"], price_tier: "mid", response_time: "4 hours", availability: "next_day", wrenchli_verified: false, is_partnered: false, is_dealer: true, dealer_brands: ["Chevrolet"], quote_url: `${b}/find-shops` },
    { id: "columbus_honda_marysville", name: "Honda Marysville", rating: 4.6, review_count: 534, address: "15175 US-36, Marysville, OH 43040", phone: "(937) 644-6950", distance_miles: 6, specialties: ["import", "honda", "general", "maintenance"], price_tier: "mid", response_time: "4 hours", availability: "next_day", wrenchli_verified: false, is_partnered: false, is_dealer: true, dealer_brands: ["Honda"], quote_url: `${b}/find-shops` },
    { id: "southfield_telegraph_auto", name: "Telegraph Auto Care", rating: 4.6, review_count: 203, address: "20100 Telegraph Rd, Southfield, MI 48075", phone: "(248) 555-2010", distance_miles: 0, specialties: ["general", "domestic", "brakes", "transmission"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=southfield_telegraph_auto` },
    { id: "southfield_greenfield_auto", name: "Greenfield Import Specialists", rating: 4.9, review_count: 167, address: "25000 Greenfield Rd, Southfield, MI 48075", phone: "(248) 555-2500", distance_miles: 2, specialties: ["european", "luxury", "bmw", "mercedes", "audi", "import"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=southfield_greenfield_auto` },
    { id: "southfield_budget_brake", name: "Budget Brake & Auto", rating: 4.3, review_count: 289, address: "29000 Northwestern Hwy, Southfield, MI 48075", phone: "(248) 555-2900", distance_miles: 3, specialties: ["general", "brakes", "oil_change", "tires", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=southfield_budget_brake` },
    { id: "royaloak_main_street_auto", name: "Main Street Auto Repair", rating: 4.7, review_count: 198, address: "500 N Main St, Royal Oak, MI 48067", phone: "(248) 555-0500", distance_miles: 0, specialties: ["general", "domestic", "brakes", "electrical"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=royaloak_main_street_auto` },
    { id: "royaloak_euro_auto", name: "Royal Oak Euro Auto", rating: 4.8, review_count: 134, address: "1200 E 11 Mile Rd, Royal Oak, MI 48067", phone: "(248) 555-1200", distance_miles: 1, specialties: ["european", "luxury", "bmw", "mercedes", "volkswagen"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=royaloak_euro_auto` },
    { id: "royaloak_quick_fix", name: "Quick Fix Auto Royal Oak", rating: 4.4, review_count: 312, address: "2800 N Woodward Ave, Royal Oak, MI 48067", phone: "(248) 555-2800", distance_miles: 2, specialties: ["general", "oil_change", "tires", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=royaloak_quick_fix` },
    { id: "farmhills_orchard_auto", name: "Orchard Lake Auto Service", rating: 4.7, review_count: 223, address: "30100 Orchard Lake Rd, Farmington Hills, MI 48334", phone: "(248) 555-3010", distance_miles: 0, specialties: ["general", "domestic", "engine", "transmission"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=farmhills_orchard_auto` },
    { id: "farmhills_grand_river_auto", name: "Grand River Import Specialists", rating: 4.9, review_count: 156, address: "33000 Grand River Ave, Farmington Hills, MI 48334", phone: "(248) 555-3300", distance_miles: 2, specialties: ["european", "luxury", "import", "bmw", "audi"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=farmhills_grand_river_auto` },
    { id: "farmhills_value_tire", name: "Value Tire & Auto", rating: 4.3, review_count: 278, address: "28500 Northwestern Hwy, Farmington Hills, MI 48334", phone: "(248) 555-2850", distance_miles: 3, specialties: ["general", "tires", "oil_change", "brakes", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=farmhills_value_tire` },
    { id: "novi_twelve_oaks_auto", name: "Twelve Oaks Auto Care", rating: 4.7, review_count: 215, address: "42000 Grand River Ave, Novi, MI 48375", phone: "(248) 555-4200", distance_miles: 0, specialties: ["general", "domestic", "brakes", "engine"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=novi_twelve_oaks_auto` },
    { id: "novi_luxury_auto", name: "Novi Luxury Auto Specialists", rating: 4.9, review_count: 142, address: "39500 Ten Mile Rd, Novi, MI 48375", phone: "(248) 555-3950", distance_miles: 2, specialties: ["european", "luxury", "bmw", "mercedes", "audi", "land_rover"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=novi_luxury_auto` },
    { id: "novi_express_lube", name: "Express Lube & Auto Novi", rating: 4.4, review_count: 334, address: "44000 West Rd, Novi, MI 48375", phone: "(248) 555-4400", distance_miles: 3, specialties: ["general", "oil_change", "tires", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=novi_express_lube` },
    { id: "canton_michigan_ave_auto", name: "Michigan Ave Auto Works", rating: 4.6, review_count: 198, address: "41500 Michigan Ave, Canton, MI 48187", phone: "(734) 555-4150", distance_miles: 0, specialties: ["general", "domestic", "transmission", "brakes"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=canton_michigan_ave_auto` },
    { id: "canton_euro_precision", name: "Euro Precision Canton", rating: 4.8, review_count: 123, address: "45000 Ford Rd, Canton, MI 48187", phone: "(734) 555-4500", distance_miles: 2, specialties: ["european", "luxury", "import", "bmw", "volkswagen"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=canton_euro_precision` },
    { id: "canton_budget_auto", name: "Canton Budget Auto Center", rating: 4.3, review_count: 267, address: "42700 Cherry Hill Rd, Canton, MI 48187", phone: "(734) 555-4270", distance_miles: 3, specialties: ["general", "oil_change", "brakes", "tires", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=canton_budget_auto` },
    // Columbus, OH
    { id: "columbus_high_st_auto", name: "High Street Auto Care", rating: 4.8, review_count: 267, address: "1450 N High St, Columbus, OH 43201", phone: "(614) 555-1450", distance_miles: 0, specialties: ["general", "domestic", "engine", "brakes"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=columbus_high_st_auto` },
    { id: "columbus_german_auto", name: "Columbus German Auto Specialists", rating: 4.9, review_count: 189, address: "3200 Olentangy River Rd, Columbus, OH 43202", phone: "(614) 555-3200", distance_miles: 2, specialties: ["european", "luxury", "bmw", "mercedes", "audi", "volkswagen"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=columbus_german_auto` },
    { id: "columbus_budget_muffler", name: "Budget Muffler & Brake", rating: 4.4, review_count: 345, address: "2800 W Broad St, Columbus, OH 43204", phone: "(614) 555-2800", distance_miles: 3, specialties: ["general", "brakes", "exhaust", "oil_change", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=columbus_budget_muffler` },
    { id: "dublin_precision", name: "Dublin Precision Auto", rating: 4.7, review_count: 178, address: "6500 Perimeter Dr, Dublin, OH 43017", phone: "(614) 555-6500", distance_miles: 0, specialties: ["general", "import", "hybrid", "electrical"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=dublin_precision` },
    { id: "westerville_family_auto", name: "Westerville Family Auto", rating: 4.6, review_count: 156, address: "100 S State St, Westerville, OH 43081", phone: "(614) 555-0100", distance_miles: 0, specialties: ["general", "family_service", "brakes", "maintenance"], price_tier: "mid", response_time: "3 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=westerville_family_auto` },
    // Toledo, OH
    { id: "toledo_secor_auto", name: "Secor Road Auto Service", rating: 4.7, review_count: 234, address: "3400 Secor Rd, Toledo, OH 43606", phone: "(419) 555-3400", distance_miles: 0, specialties: ["general", "domestic", "engine", "transmission"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=toledo_secor_auto` },
    { id: "toledo_euro_masters", name: "Toledo Euro Masters", rating: 4.8, review_count: 145, address: "5100 Monroe St, Toledo, OH 43623", phone: "(419) 555-5100", distance_miles: 2, specialties: ["european", "luxury", "bmw", "mercedes", "import"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=toledo_euro_masters` },
    { id: "toledo_express_auto", name: "Express Auto Toledo", rating: 4.3, review_count: 312, address: "1900 W Alexis Rd, Toledo, OH 43612", phone: "(419) 555-1900", distance_miles: 3, specialties: ["general", "oil_change", "tires", "brakes", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=toledo_express_auto` },
    { id: "perrysburg_auto_pro", name: "Perrysburg Auto Pro", rating: 4.6, review_count: 167, address: "26500 N Dixie Hwy, Perrysburg, OH 43551", phone: "(419) 555-2650", distance_miles: 0, specialties: ["general", "brakes", "electrical", "ac_service"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=perrysburg_auto_pro` },
    // Pontiac, MI
    { id: "pontiac_wide_track", name: "Wide Track Auto Service", rating: 4.6, review_count: 187, address: "250 N Telegraph Rd, Pontiac, MI 48341", phone: "(248) 555-2500", distance_miles: 0, specialties: ["general", "domestic", "engine", "brakes"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=pontiac_wide_track` },
    { id: "pontiac_budget_auto", name: "Pontiac Budget Auto", rating: 4.3, review_count: 234, address: "500 S Opdyke Rd, Pontiac, MI 48341", phone: "(248) 555-5000", distance_miles: 2, specialties: ["general", "oil_change", "brakes", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=pontiac_budget_auto` },
    // Rochester Hills, MI
    { id: "rochester_hills_auto", name: "Rochester Hills Auto Care", rating: 4.8, review_count: 198, address: "1500 S Rochester Rd, Rochester Hills, MI 48307", phone: "(248) 555-1500", distance_miles: 0, specialties: ["general", "import", "hybrid", "electrical"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=rochester_hills_auto` },
    { id: "rochester_euro_specialist", name: "Rochester Euro Specialists", rating: 4.9, review_count: 134, address: "2800 Walton Blvd, Rochester Hills, MI 48309", phone: "(248) 555-2800", distance_miles: 2, specialties: ["european", "luxury", "bmw", "mercedes", "audi"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=rochester_euro_specialist` },
    // Westland, MI
    { id: "westland_wayne_rd_auto", name: "Wayne Road Auto Service", rating: 4.6, review_count: 212, address: "35000 Wayne Rd, Westland, MI 48185", phone: "(734) 555-3500", distance_miles: 0, specialties: ["general", "domestic", "brakes", "transmission"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=westland_wayne_rd_auto` },
    { id: "westland_discount_auto", name: "Westland Discount Auto", rating: 4.3, review_count: 289, address: "6700 N Wayne Rd, Westland, MI 48185", phone: "(734) 555-6700", distance_miles: 2, specialties: ["general", "oil_change", "tires", "brakes", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=westland_discount_auto` },
    // Plymouth, MI
    { id: "plymouth_main_auto", name: "Plymouth Main Street Auto", rating: 4.7, review_count: 167, address: "900 W Ann Arbor Trail, Plymouth, MI 48170", phone: "(734) 555-0900", distance_miles: 0, specialties: ["general", "domestic", "brakes", "maintenance"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=plymouth_main_auto` },
    { id: "plymouth_euro_auto", name: "Plymouth Euro Auto Works", rating: 4.8, review_count: 112, address: "41000 Ann Arbor Rd, Plymouth, MI 48170", phone: "(734) 555-4100", distance_miles: 1, specialties: ["european", "luxury", "import", "bmw", "volkswagen"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=plymouth_euro_auto` },
    // Ypsilanti, MI
    { id: "ypsi_michigan_ave_auto", name: "Ypsi Michigan Ave Auto", rating: 4.5, review_count: 178, address: "2100 E Michigan Ave, Ypsilanti, MI 48198", phone: "(734) 555-2100", distance_miles: 0, specialties: ["general", "domestic", "brakes", "engine"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=ypsi_michigan_ave_auto` },
    { id: "ypsi_student_auto", name: "EMU Student Auto Care", rating: 4.3, review_count: 245, address: "850 W Cross St, Ypsilanti, MI 48197", phone: "(734) 555-0850", distance_miles: 1, specialties: ["general", "budget_friendly", "oil_change", "brakes"], price_tier: "budget", response_time: "3 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=ypsi_student_auto` },
    // Flint, MI
    { id: "flint_court_st_auto", name: "Court Street Auto Service", rating: 4.6, review_count: 198, address: "3200 Court St, Flint, MI 48503", phone: "(810) 555-3200", distance_miles: 0, specialties: ["general", "domestic", "engine", "transmission"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=flint_court_st_auto` },
    { id: "flint_budget_auto", name: "Flint Budget Auto & Tire", rating: 4.2, review_count: 267, address: "4500 Corunna Rd, Flint, MI 48532", phone: "(810) 555-4500", distance_miles: 3, specialties: ["general", "oil_change", "tires", "brakes", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=flint_budget_auto` },
    // Lansing, MI
    { id: "lansing_capitol_auto", name: "Capitol City Auto Repair", rating: 4.7, review_count: 213, address: "1200 E Michigan Ave, Lansing, MI 48912", phone: "(517) 555-1200", distance_miles: 0, specialties: ["general", "domestic", "engine", "brakes"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=lansing_capitol_auto` },
    { id: "lansing_msu_auto", name: "Spartan Auto Service", rating: 4.5, review_count: 312, address: "3500 E Grand River Ave, Lansing, MI 48823", phone: "(517) 555-3500", distance_miles: 2, specialties: ["general", "budget_friendly", "oil_change", "student_specials"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=lansing_msu_auto` },
    // Kalamazoo, MI
    { id: "kalamazoo_stadium_auto", name: "Stadium Drive Auto Care", rating: 4.7, review_count: 189, address: "5200 Stadium Dr, Kalamazoo, MI 49009", phone: "(269) 555-5200", distance_miles: 0, specialties: ["general", "domestic", "brakes", "transmission"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=kalamazoo_stadium_auto` },
    { id: "kalamazoo_westnedge_auto", name: "Westnedge Auto Specialists", rating: 4.5, review_count: 234, address: "3800 S Westnedge Ave, Kalamazoo, MI 49008", phone: "(269) 555-3800", distance_miles: 2, specialties: ["general", "import", "oil_change", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=kalamazoo_westnedge_auto` },
    // Grand Rapids, MI
    { id: "gr_division_auto", name: "Division Avenue Auto Works", rating: 4.7, review_count: 234, address: "2500 Division Ave S, Grand Rapids, MI 49507", phone: "(616) 555-2500", distance_miles: 0, specialties: ["general", "domestic", "engine", "transmission"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=gr_division_auto` },
    { id: "gr_euro_auto", name: "Grand Rapids Euro Specialists", rating: 4.9, review_count: 145, address: "3600 28th St SE, Grand Rapids, MI 49512", phone: "(616) 555-3600", distance_miles: 3, specialties: ["european", "luxury", "bmw", "mercedes", "audi"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=gr_euro_auto` },
    { id: "gr_budget_muffler", name: "GR Budget Muffler & Brake", rating: 4.3, review_count: 378, address: "4400 Plainfield Ave NE, Grand Rapids, MI 49525", phone: "(616) 555-4400", distance_miles: 4, specialties: ["general", "brakes", "exhaust", "oil_change", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=gr_budget_muffler` },
    // Hilliard, OH
    { id: "hilliard_cemetery_auto", name: "Hilliard Auto Specialists", rating: 4.7, review_count: 189, address: "4200 Cemetery Rd, Hilliard, OH 43026", phone: "(614) 555-4200", distance_miles: 0, specialties: ["general", "domestic", "brakes", "engine"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=hilliard_cemetery_auto` },
    { id: "hilliard_budget_auto", name: "Hilliard Budget Auto & Tire", rating: 4.4, review_count: 256, address: "5100 Roberts Rd, Hilliard, OH 43026", phone: "(614) 555-5100", distance_miles: 2, specialties: ["general", "oil_change", "tires", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=hilliard_budget_auto` },
    // Cleveland, OH
    { id: "cleveland_superior_auto", name: "Superior Auto Service", rating: 4.7, review_count: 267, address: "3200 Superior Ave, Cleveland, OH 44114", phone: "(216) 555-3200", distance_miles: 0, specialties: ["general", "domestic", "engine", "brakes"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=cleveland_superior_auto` },
    { id: "cleveland_euro_masters", name: "Cleveland Euro Masters", rating: 4.9, review_count: 178, address: "4500 Lee Rd, Cleveland, OH 44128", phone: "(216) 555-4500", distance_miles: 3, specialties: ["european", "luxury", "bmw", "mercedes", "audi", "import"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=cleveland_euro_masters` },
    { id: "cleveland_west_side_auto", name: "West Side Auto Repair", rating: 4.4, review_count: 345, address: "11800 Detroit Ave, Cleveland, OH 44107", phone: "(216) 555-1180", distance_miles: 2, specialties: ["general", "brakes", "oil_change", "tires", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=cleveland_west_side_auto` },
    // Cincinnati, OH
    { id: "cincy_vine_st_auto", name: "Vine Street Auto Service", rating: 4.7, review_count: 234, address: "1800 Vine St, Cincinnati, OH 45202", phone: "(513) 555-1800", distance_miles: 0, specialties: ["general", "domestic", "engine", "transmission"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=cincy_vine_st_auto` },
    { id: "cincy_euro_specialists", name: "Cincinnati Euro Specialists", rating: 4.9, review_count: 156, address: "7200 Montgomery Rd, Cincinnati, OH 45236", phone: "(513) 555-7200", distance_miles: 3, specialties: ["european", "luxury", "bmw", "mercedes", "audi", "porsche"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=cincy_euro_specialists` },
    { id: "cincy_budget_brake", name: "Queen City Budget Auto", rating: 4.3, review_count: 312, address: "4500 Glenway Ave, Cincinnati, OH 45205", phone: "(513) 555-4500", distance_miles: 2, specialties: ["general", "brakes", "oil_change", "tires", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=cincy_budget_brake` },
    // Dayton, OH
    { id: "dayton_main_st_auto", name: "Main Street Auto Dayton", rating: 4.6, review_count: 198, address: "200 N Main St, Dayton, OH 45402", phone: "(937) 555-0200", distance_miles: 0, specialties: ["general", "domestic", "engine", "brakes"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=dayton_main_st_auto` },
    { id: "dayton_budget_auto", name: "Dayton Budget Auto Center", rating: 4.3, review_count: 289, address: "3800 N Dixie Dr, Dayton, OH 45414", phone: "(937) 555-3800", distance_miles: 3, specialties: ["general", "oil_change", "brakes", "tires", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=dayton_budget_auto` },
    // Akron, OH
    { id: "akron_market_st_auto", name: "Market Street Auto Service", rating: 4.7, review_count: 212, address: "1500 S Market St, Akron, OH 44301", phone: "(330) 555-1500", distance_miles: 0, specialties: ["general", "domestic", "engine", "transmission"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=akron_market_st_auto` },
    { id: "akron_euro_import", name: "Akron Euro Import Service", rating: 4.8, review_count: 145, address: "3200 W Market St, Akron, OH 44333", phone: "(330) 555-3200", distance_miles: 3, specialties: ["european", "luxury", "bmw", "mercedes", "import"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=akron_euro_import` },
    { id: "akron_budget_tire", name: "Akron Budget Tire & Auto", rating: 4.3, review_count: 334, address: "800 E Waterloo Rd, Akron, OH 44306", phone: "(330) 555-0800", distance_miles: 2, specialties: ["general", "tires", "oil_change", "brakes", "budget_friendly"], price_tier: "budget", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=akron_budget_tire` },

    // ── Franchised Dealers — Michigan ──
    // Detroit Metro
    { id: "dealer_ford_dearborn", name: "Fairlane Ford", rating: 4.4, review_count: 1245, address: "14585 Michigan Ave, Dearborn, MI 48126", phone: "(313) 846-5000", distance_miles: 1, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in"], price_tier: "premium", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Ford"] },
    { id: "dealer_chevy_warren", name: "Jim Riehl's Friendly Chevrolet", rating: 4.3, review_count: 987, address: "24800 Van Dyke Ave, Warren, MI 48089", phone: "(586) 751-2121", distance_miles: 1, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in"], price_tier: "premium", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Chevrolet"] },
    { id: "dealer_toyota_troy", name: "Toyota of Troy", rating: 4.5, review_count: 1567, address: "1875 Maplelawn Dr, Troy, MI 48084", phone: "(248) 643-6600", distance_miles: 0, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in", "hybrid"], price_tier: "premium", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Toyota"] },
    { id: "dealer_honda_detroit", name: "Genthe Honda", rating: 4.6, review_count: 1123, address: "35300 Ford Rd, Westland, MI 48185", phone: "(734) 513-2700", distance_miles: 1, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Honda"] },
    { id: "dealer_bmw_birmingham", name: "Erhard BMW", rating: 4.7, review_count: 856, address: "38700 Grand River Ave, Farmington Hills, MI 48335", phone: "(248) 699-3300", distance_miles: 2, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in", "luxury"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["BMW"] },
    { id: "dealer_mercedes_birmingham", name: "Mercedes-Benz of Birmingham", rating: 4.6, review_count: 734, address: "35080 Woodward Ave, Birmingham, MI 48009", phone: "(248) 644-8400", distance_miles: 0, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in", "luxury"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Mercedes-Benz"] },
    { id: "dealer_hyundai_southfield", name: "Glassman Hyundai", rating: 4.4, review_count: 678, address: "28000 Telegraph Rd, Southfield, MI 48034", phone: "(248) 354-5600", distance_miles: 1, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Hyundai"] },
    { id: "dealer_nissan_canton", name: "Nissan of Canton", rating: 4.3, review_count: 567, address: "42175 Michigan Ave, Canton, MI 48188", phone: "(734) 495-1000", distance_miles: 1, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Nissan"] },
    // Ann Arbor
    { id: "dealer_toyota_annarbor", name: "Ann Arbor Toyota", rating: 4.5, review_count: 923, address: "3745 Jackson Rd, Ann Arbor, MI 48103", phone: "(734) 769-7900", distance_miles: 2, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in", "hybrid"], price_tier: "premium", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Toyota"] },
    { id: "dealer_subaru_annarbor", name: "Ann Arbor Subaru", rating: 4.6, review_count: 612, address: "555 Auto Mall Dr, Ann Arbor, MI 48103", phone: "(734) 662-3444", distance_miles: 2, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Subaru"] },
    // Grand Rapids
    { id: "dealer_ford_grandrapids", name: "Fox Ford", rating: 4.4, review_count: 834, address: "3560 28th St SE, Grand Rapids, MI 49512", phone: "(616) 949-6000", distance_miles: 2, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Ford"] },
    { id: "dealer_chevy_grandrapids", name: "Todd Wenzel Chevrolet", rating: 4.3, review_count: 756, address: "7200 Broadmoor Ave SE, Grand Rapids, MI 49508", phone: "(616) 956-9781", distance_miles: 3, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Chevrolet"] },
    // Lansing
    { id: "dealer_chevy_lansing", name: "Sundance Chevrolet", rating: 4.5, review_count: 1034, address: "7601 Grand Ledge Hwy, Lansing, MI 48917", phone: "(517) 394-3000", distance_miles: 2, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Chevrolet"] },

    // ── Franchised Dealers — Ohio ──
    // Columbus
    { id: "dealer_toyota_columbus", name: "Germain Toyota of Columbus", rating: 4.6, review_count: 1456, address: "5711 Scarborough Blvd, Columbus, OH 43232", phone: "(614) 868-3333", distance_miles: 2, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in", "hybrid"], price_tier: "premium", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Toyota"] },
    { id: "dealer_honda_columbus", name: "Germain Honda of Dublin", rating: 4.5, review_count: 1234, address: "7000 Sawmill Rd, Dublin, OH 43017", phone: "(614) 889-2571", distance_miles: 1, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Honda"] },
    { id: "dealer_ford_columbus", name: "Ricart Ford", rating: 4.4, review_count: 2345, address: "4255 S Hamilton Rd, Columbus, OH 43125", phone: "(614) 836-6911", distance_miles: 3, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Ford"] },
    // Cleveland
    { id: "dealer_chevy_cleveland", name: "Classic Chevrolet", rating: 4.3, review_count: 876, address: "9000 Brookpark Rd, Cleveland, OH 44129", phone: "(216) 741-0100", distance_miles: 2, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Chevrolet"] },
    { id: "dealer_toyota_cleveland", name: "Toyota of Cleveland Heights", rating: 4.5, review_count: 1023, address: "26701 Miles Rd, Cleveland, OH 44128", phone: "(216) 663-2000", distance_miles: 3, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in", "hybrid"], price_tier: "premium", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Toyota"] },
    { id: "dealer_bmw_cleveland", name: "BMW Cleveland", rating: 4.7, review_count: 645, address: "6135 Kruse Dr, Solon, OH 44139", phone: "(440) 542-3000", distance_miles: 4, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in", "luxury"], price_tier: "premium", response_time: "1 hour", availability: "next_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["BMW"] },
    // Cincinnati
    { id: "dealer_toyota_cincy", name: "Joseph Toyota of Cincinnati", rating: 4.6, review_count: 1567, address: "9101 Colerain Ave, Cincinnati, OH 45251", phone: "(513) 385-1800", distance_miles: 2, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in", "hybrid"], price_tier: "premium", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Toyota"] },
    { id: "dealer_ford_cincy", name: "Kings Ford", rating: 4.4, review_count: 934, address: "9980 Kings Auto Mall Rd, Cincinnati, OH 45249", phone: "(513) 683-0022", distance_miles: 3, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Ford"] },
    // Toledo
    { id: "dealer_chevy_toledo", name: "Dave White Chevrolet", rating: 4.4, review_count: 712, address: "5880 Monroe St, Sylvania, OH 43560", phone: "(419) 885-5111", distance_miles: 2, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Chevrolet"] },
    // Dayton
    { id: "dealer_honda_dayton", name: "Voss Honda", rating: 4.5, review_count: 1089, address: "902 W National Rd, Dayton, OH 45414", phone: "(937) 890-4311", distance_miles: 2, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Honda"] },
    // Akron
    { id: "dealer_ford_akron", name: "Ganley Ford", rating: 4.3, review_count: 823, address: "1395 E Waterloo Rd, Akron, OH 44306", phone: "(330) 733-7511", distance_miles: 1, specialties: ["dealer", "new_vehicles", "used_vehicles", "service", "trade_in"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights`, is_dealer: true, dealer_brands: ["Ford"] },

    // ── AAA Auto Centers — Ohio ──
    // Columbus / Dublin area
    { id: "aaa_dublin", name: "AAA Car Care Plus — Dublin", rating: 4.6, review_count: 412, address: "6350 Sawmill Rd, Dublin, OH 43017", phone: "(614) 431-7901", distance_miles: 0, specialties: ["general", "brakes", "engine", "oil_change", "tires", "electrical", "ac_service", "maintenance"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=aaa_dublin` },
    { id: "aaa_columbus_east", name: "AAA Car Care Plus — Columbus East", rating: 4.5, review_count: 378, address: "5765 Scarborough Blvd, Columbus, OH 43232", phone: "(614) 861-7222", distance_miles: 2, specialties: ["general", "brakes", "engine", "oil_change", "tires", "electrical", "ac_service", "maintenance"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=aaa_columbus_east` },
    { id: "aaa_columbus_northwest", name: "AAA Car Care Plus — Columbus Northwest", rating: 4.5, review_count: 345, address: "1375 Chambers Rd, Columbus, OH 43212", phone: "(614) 488-3990", distance_miles: 3, specialties: ["general", "brakes", "engine", "oil_change", "tires", "electrical", "ac_service", "maintenance"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=aaa_columbus_northwest` },
    { id: "aaa_westerville", name: "AAA Car Care Plus — Westerville", rating: 4.6, review_count: 289, address: "6185 Cleveland Ave, Columbus, OH 43231", phone: "(614) 899-5222", distance_miles: 1, specialties: ["general", "brakes", "engine", "oil_change", "tires", "electrical", "ac_service", "maintenance"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=aaa_westerville` },
    // Toledo
    { id: "aaa_toledo", name: "AAA Car Care Plus — Toledo", rating: 4.4, review_count: 267, address: "5016 Monroe St, Toledo, OH 43623", phone: "(419) 473-1183", distance_miles: 2, specialties: ["general", "brakes", "engine", "oil_change", "tires", "electrical", "ac_service", "maintenance"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=aaa_toledo` },
    // Cleveland
    { id: "aaa_cleveland_south", name: "AAA Car Care Plus — Cleveland South", rating: 4.5, review_count: 312, address: "7280 Broadview Rd, Cleveland, OH 44134", phone: "(216) 524-6500", distance_miles: 3, specialties: ["general", "brakes", "engine", "oil_change", "tires", "electrical", "ac_service", "maintenance"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=aaa_cleveland_south` },
    // Cincinnati
    { id: "aaa_cincinnati", name: "AAA Car Care Plus — Cincinnati", rating: 4.5, review_count: 298, address: "9597 Colerain Ave, Cincinnati, OH 45251", phone: "(513) 385-6700", distance_miles: 2, specialties: ["general", "brakes", "engine", "oil_change", "tires", "electrical", "ac_service", "maintenance"], price_tier: "mid", response_time: "1 hour", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=aaa_cincinnati` },
    // Dayton
    { id: "aaa_dayton", name: "AAA Car Care Plus — Dayton", rating: 4.4, review_count: 234, address: "2614 Miamisburg Centerville Rd, Dayton, OH 45459", phone: "(937) 435-1222", distance_miles: 2, specialties: ["general", "brakes", "engine", "oil_change", "tires", "electrical", "ac_service", "maintenance"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=aaa_dayton` },
    // Akron
    { id: "aaa_akron", name: "AAA Car Care Plus — Akron", rating: 4.4, review_count: 245, address: "3846 Medina Rd, Akron, OH 44333", phone: "(330) 666-4414", distance_miles: 2, specialties: ["general", "brakes", "engine", "oil_change", "tires", "electrical", "ac_service", "maintenance"], price_tier: "mid", response_time: "2 hours", availability: "same_day", wrenchli_verified: true, quote_url: `${b}/vehicle-insights?shop=aaa_akron` },
  ];
}


function filterByLocation(providers: ServiceProvider[], location: string): { providers: ServiceProvider[]; city: string | null } {
  const loc = location.toLowerCase().trim();

  // 1. Exact match in locationMap (city name or ZIP)
  for (const [key, city] of Object.entries(locationMap)) {
    if (loc.includes(key)) {
      const cityPattern = new RegExp(`,\\s*${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[,\\s]`, 'i');
      return { providers: providers.filter((p) => cityPattern.test(p.address)), city };
    }
  }

  // 2. ZIP prefix → filter to same state only
  const zip = loc.replace(/\D/g, "");
  if (zip.length >= 3) {
    const prefix = zip.substring(0, 3);
    const state = zipPrefixToState[prefix];
    if (state) {
      const tag = stateAddressTag[state];
      const stateProviders = providers.filter((p) => p.address.includes(tag));
      if (stateProviders.length > 0) {
        // Default to nearest major city in that state
        const defaultCity = state === "MI" ? "Detroit" : "Columbus";
        return { providers: stateProviders, city: defaultCity };
      }
    }
  }

  // 3. No match at all — return empty rather than everything
  return { providers: [], city: null };
}

function findServiceProviders(params: { location: string; service_type: string; price_range?: string | null; vehicle_make?: string | null }) {
  const { providers: filtered, city } = filterByLocation(getProvidersDatabase(), params.location);
  let results = filtered;

  if (params.price_range) {
    results = results.filter((p) => p.price_tier === params.price_range);
  }
  if (params.service_type && params.service_type !== "general") {
    results = results.filter((p) => p.specialties.includes(params.service_type) || p.specialties.includes("general"));
  }
  if (params.vehicle_make && LUXURY_BRANDS.includes(params.vehicle_make)) {
    results.sort((a, b) => {
      const aSpec = a.specialties.includes("european") || a.specialties.includes("luxury");
      const bSpec = b.specialties.includes("european") || b.specialties.includes("luxury");
      if (aSpec && !bSpec) return -1;
      if (!aSpec && bSpec) return 1;
      return b.rating - a.rating;
    });
  } else {
    results.sort((a, b) => b.rating - a.rating);
  }

  return { providers: results.slice(0, 10), city };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = await checkRateLimit(rateLimitId, RATE_LIMITS.GENEROUS);
  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      { status: 429, headers: { ...securityHeaders, ...getRateLimitHeaders(RATE_LIMITS.GENEROUS.maxRequests, rateResult.remaining, rateResult.resetTime), "Content-Type": "application/json" } }
    );
  }

  try {
    const { location, service_type = "general", price_range, vehicle_make } = await req.json();

    if (!location || typeof location !== "string") {
      return new Response(JSON.stringify({ error: "Location (ZIP code or city) is required" }), {
        status: 400,
        headers: { ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    const { providers, city } = findServiceProviders({ location, service_type, price_range, vehicle_make });

    const coords = city ? cityCoords[city] : cityCoords["Detroit"];
    const providersWithCoords = providers.map((p, i) => ({
      ...p,
      is_partnered: p.is_partnered !== false, // All current DB entries are partnered
      lat: coords ? coords.lat + (i * 0.008 - 0.02) * (i % 2 === 0 ? 1 : -1) : undefined,
      lng: coords ? coords.lng + (i * 0.006 - 0.015) * (i % 2 === 0 ? -1 : 1) : undefined,
    }));

    return new Response(
      JSON.stringify({
        providers: providersWithCoords,
        center: coords,
        results_count: providersWithCoords.length,
        location,
        city: city || "Service Area",
      }),
      { headers: { ...securityHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("find-shops error:", e);
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...securityHeaders, "Content-Type": "application/json" },
    });
  }
});
