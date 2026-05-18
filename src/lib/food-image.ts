/**
 * Pick a relevant food photo using Unsplash Source (free, no key).
 * Maps common dish names (Indian, Chinese, Western) to good keywords.
 */

const DISH_KEYWORDS: Record<string, string> = {
  // Indian
  biryani: "biryani,indian,rice",
  paneer: "paneer,indian,curry",
  "butter chicken": "butter-chicken,indian",
  "tikka": "chicken-tikka,indian",
  dal: "dal,lentil,indian",
  samosa: "samosa,indian,snack",
  dosa: "dosa,south-indian",
  idli: "idli,south-indian",
  naan: "naan,indian,bread",
  roti: "roti,indian,bread",
  chole: "chole,chickpea,indian",
  rajma: "rajma,kidney-beans,indian",
  thali: "thali,indian,platter",
  pakora: "pakora,indian,fritter",
  chaat: "chaat,indian,street-food",
  // Chinese
  noodles: "noodles,chinese,asian",
  "fried rice": "fried-rice,chinese",
  manchurian: "manchurian,indo-chinese",
  momos: "momos,dumpling,asian",
  dumpling: "dumpling,chinese",
  "spring roll": "spring-roll,chinese",
  schezwan: "schezwan,asian,spicy",
  // Western / general
  pizza: "pizza,cheese",
  burger: "burger,beef",
  pasta: "pasta,italian",
  sandwich: "sandwich,deli",
  salad: "salad,greens,healthy",
  soup: "soup,bowl",
  // Bakery / sweets
  cake: "cake,dessert,bakery",
  cupcake: "cupcake,bakery",
  pastry: "pastry,bakery",
  bread: "bread,bakery,loaf",
  croissant: "croissant,bakery",
  cookie: "cookie,bakery",
  donut: "donut,bakery",
  brownie: "brownie,chocolate",
  muffin: "muffin,bakery",
  laddu: "laddu,indian-sweet",
  jalebi: "jalebi,indian-sweet",
  gulab: "gulab-jamun,indian-sweet",
  rasgulla: "rasgulla,indian-sweet",
  kheer: "kheer,indian-dessert",
  halwa: "halwa,indian-sweet",
  // Beverages
  juice: "juice,fresh,fruit",
  smoothie: "smoothie,drink",
  lassi: "lassi,indian-drink",
  chai: "chai,tea,indian",
  coffee: "coffee,latte",
  shake: "milkshake,drink",
  // Sushi / Japanese
  sushi: "sushi,japanese",
  ramen: "ramen,japanese,noodle",
  // Generic produce
  vegetable: "vegetables,produce,fresh",
  fruit: "fruit,fresh,produce",
};

const STOP = new Set([
  "the", "a", "an", "of", "and", "with", "for", "to", "in", "on",
  "box", "set", "kit", "bag", "pack", "trio", "surprise", "deal",
  "fresh", "tonight", "today", "special", "platter", "plate", "veg",
]);

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function keywordsFor(title: string, category: string): string {
  const t = title.toLowerCase();
  // Try a multi-word match first (e.g. "butter chicken")
  for (const key of Object.keys(DISH_KEYWORDS)) {
    if (t.includes(key)) return DISH_KEYWORDS[key];
  }
  // Category fallbacks
  const c = category.toLowerCase();
  if (c === "indian") return "indian-food,curry";
  if (c === "chinese") return "chinese-food,asian";
  if (c === "bakery") return "bakery,pastry,bread";
  if (c === "dessert") return "dessert,sweet";
  if (c === "beverages") return "drink,beverage";
  if (c === "snacks") return "snack,food";
  if (c === "sushi") return "sushi,japanese";
  if (c === "vegan") return "vegan,salad,bowl";
  if (c === "produce") return "produce,vegetables";
  if (c === "hot meal") return "meal,dinner,plate";
  // Generic word fallback from title
  const tokens = t
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
  return tokens.slice(0, 2).join(",") || "food";
}

export function pickFoodImage(title: string, category: string): string {
  const kw = encodeURIComponent(keywordsFor(title, category));
  const lock = hash(`${title}|${category}`) % 10000;
  // LoremFlickr: free, real Flickr photos matched by tag.
  return `https://loremflickr.com/800/600/${kw}/all?lock=${lock}`;
}
