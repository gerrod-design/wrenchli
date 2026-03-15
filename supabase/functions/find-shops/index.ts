import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  ];
}

function filterByLocation(providers: ServiceProvider[], location: string): { providers: ServiceProvider[]; city: string | null } {
  const loc = location.toLowerCase().trim();

  // 1. Exact match in locationMap (city name or ZIP)
  for (const [key, city] of Object.entries(locationMap)) {
    if (loc.includes(key)) {
      return { providers: providers.filter((p) => p.address.includes(city)), city };
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, service_type = "general", price_range, vehicle_make } = await req.json();

    if (!location || typeof location !== "string") {
      return new Response(JSON.stringify({ error: "Location (ZIP code or city) is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { providers, city } = findServiceProviders({ location, service_type, price_range, vehicle_make });

    // Add coordinates based on matched city
    const coords = city ? cityCoords[city] : cityCoords["Detroit"];
    const providersWithCoords = providers.map((p, i) => ({
      ...p,
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("find-shops error:", e);
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
