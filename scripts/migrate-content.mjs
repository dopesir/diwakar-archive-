#!/usr/bin/env node
/**
 * migrate-content.mjs — ONE-TIME content seed.
 *
 * Generates the initial content collections (hero / work / stories / thoughts)
 * from the v4 reference data, applying every rule in OPUS_BUILD_SPEC §6:
 *  - hero SLIDES -> 7 yaml
 *  - workTitles + years + workImgMap + workCapMap -> ~52 work md
 *    (4 India-Today-CDN portraits kept image-less with caption + TODO;
 *     "years array wins" on year conflicts; AFMJ award added; filler skipped)
 *  - storiesData -> 19 stories (the beggar ethics piece moves to thoughts)
 *  - the 8 ethics/behind-the-frame pieces -> thoughts (dedupe §6.3)
 *
 * After this runs, the markdown/yaml files are the source of truth — the CMS
 * edits them directly. Re-running overwrites the seed files, so only run it to
 * regenerate from scratch. Bodies are factual-neutral expansions that add NO
 * new facts, names, or quotes beyond the source entry (§6.2/§6.3).
 *
 * ⚠ The stories/thoughts narratives + quotes are unverified draft material and
 *   must be checked with Mr. Diwakar before launch (README §6.4).
 */

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CONTENT = join(ROOT, 'src', 'content');

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const y = (v) => JSON.stringify(v); // safe YAML scalar (JSON is valid YAML)

function frontmatter(obj) {
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'number' || typeof v === 'boolean') lines.push(`${k}: ${v}`);
    else lines.push(`${k}: ${y(v)}`);
  }
  return lines.join('\n');
}

async function writeMd(dir, slug, data, body) {
  const file = join(CONTENT, dir, `${slug}.md`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `---\n${frontmatter(data)}\n---\n\n${body.trim()}\n`, 'utf8');
}
async function writeYaml(dir, name, data) {
  const file = join(CONTENT, dir, `${name}.yaml`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${frontmatter(data)}\n`, 'utf8');
}

/* ===================== HERO (7) ===================== */
const HERO = [
  { order: 1, location: 'Jaipur', title: 'Diwali Night — Firecrackers and Floating Lanterns Light Up the Sky Over Iswari Minar Swarga Sal', img: '01-diwali-lanterns-jaipur.jpg', position: 'center 40%', tone: 'dark', slug: '01-diwali-night-jaipur' },
  { order: 2, location: 'Indo-Pak Border', title: 'Bawaliyanwala Border Outpost — View of the International Fence at 54°C', img: '02-indopak-border.jpg', position: 'center 45%', tone: 'bright', slug: '02-bawaliyanwala-border' },
  { order: 3, location: 'Thar Desert', title: 'Goats Crossing the Arid Terrain — Life in the Desert', img: '03-thar-goats.jpg', position: 'center 55%', tone: 'bright', slug: '03-thar-goats' },
  { order: 4, location: 'Indian Air Force', title: 'CH-47 Chinook Helicopter Airlifting Artillery During Military Exercise', img: '04-chinook-airlift.jpg', position: 'center 35%', tone: 'dark', slug: '04-chinook-airlift' },
  { order: 5, location: 'Rajasthan', title: 'A Moment of Warmth — Purushottam Diwakar with a Village Elder', img: '05-village-elder-warmth.jpg', position: 'center 30%', tone: 'bright', slug: '05-village-elder' },
  { order: 6, location: 'Rajasthan · Archive', title: 'SBBJ Camel Bank — Mobile Banking in the Desert, Snow or Desert We Are Alert', img: '06-camel-bank.jpg', position: 'center center', tone: 'bright', slug: '06-camel-bank' },
  { order: 7, location: 'Rajasthan · Field', title: 'On Assignment — Jeep in the Grasslands of Rural Rajasthan', img: '07-jeep-grasslands.jpg', position: 'center 45%', tone: 'bright', slug: '07-jeep-grasslands' },
];

/* ===================== WORK ===================== */
const titles = [
  'Drought chronicles — Jaisalmer', 'Venus transit — Jaipur', 'Maharaja Padmanabh Singh — 18th birthday',
  'Locust attack — Barmer', 'Thar desert expedition — vanishing flora', 'Political pulse — Rajasthan assembly',
  'Monsoon retreat — Udaipur', 'Rural healthcare — mobile clinic', 'Camel fair — Pushkar',
  'Blue city after rain — Jodhpur', 'Desert school — children at play', 'Harvest season — Bajra fields',
  'Evening aarti — Ganga', 'Old Delhi — spice market', 'Jaipur lit fest — authors in conversation',
  'Ranthambore — tigress at dawn', 'Kutch weavers — living craft', 'Bikaner — fort shadows',
  'Mount Abu — winter fog', 'Chittorgarh — light and stone', 'Sambhar lake — salt workers',
  'Shekhawati — haveli details', 'Bundi — stepwell geometry', 'Alwar — bird sanctuary',
  'Karauli — temple ruins', 'Dungarpur — palace reflections', 'Pali — textile looms',
  'Sirohi — granite hills', 'Tonk — old city lanes', 'Kota — chambal ravines',
  'Bharatpur — wetland birds', 'Sawai Madhopur — rathole mining', 'Dholpur — sandstone quarries',
  'Hanumangarh — canal irrigation', 'Sri Ganganagar — farmscape', 'Churu — painted havelis',
  'Nagaur — cattle fair', 'Jalore — fort on hill', 'Barmer — wood carving artisans',
  'Jhunjhunu — frescoes', 'Sikar — old mansions', 'Neemrana — stepwell',
  'Laxmangarh — hill fort', 'Mandal — rural market', 'Asind — pottery village',
  'Bhinai — stepwell series', 'Deeg — palatial gardens', 'Alwar — banyan tree',
  'Tijara — jain temple', 'Khetri — copper mines', 'Fatehpur — haveli town',
];
const years = [2019, 2012, 2017, 2020, 2015, 2013, 2007, 2016, 2009, 2014, 2018, 2011, 2010, 2012, 2015, 2018, 2016, 2013, 2011, 2014, 2017, 2015, 2019, 2012, 2016, 2018, 2013, 2011, 2015, 2019, 2014, 2016, 2017, 2018, 2020, 2012, 2015, 2016, 2013, 2018, 2019, 2014, 2017, 2018, 2015, 2016, 2019, 2020, 2013, 2014, 2015];

const locations = [
  'Jaisalmer', 'Jaipur', 'Jaipur', 'Barmer', 'Thar Desert', 'Jaipur', 'Udaipur', 'Rajasthan', 'Pushkar', 'Jodhpur',
  'Thar Desert', 'Rajasthan', 'Ganga', 'Delhi', 'Jaipur', 'Ranthambore', 'Kutch', 'Bikaner', 'Mount Abu', 'Chittorgarh',
  'Sambhar Lake', 'Shekhawati', 'Bundi', 'Alwar', 'Karauli', 'Dungarpur', 'Pali', 'Sirohi', 'Tonk', 'Kota',
  'Bharatpur', 'Sawai Madhopur', 'Dholpur', 'Hanumangarh', 'Sri Ganganagar', 'Churu', 'Nagaur', 'Jalore', 'Barmer', 'Jhunjhunu',
  'Sikar', 'Neemrana', 'Laxmangarh', 'Mandal', 'Asind', 'Bhinai', 'Deeg', 'Alwar', 'Tijara', 'Khetri', 'Fatehpur',
];

// factual-neutral bodies — subject & setting only, no invented events/quotes
const bodies = [
  'A long study of western Rajasthan through a failing monsoon. Empty reservoirs, cracked earth and the daily labour of carrying water frame a portrait of endurance across the Jaisalmer district.',
  'The silhouette of Venus crossing the face of the sun, recorded from Jaipur in June 2012. A rare astronomical alignment that will not recur within a lifetime.',
  'Observances marking the eighteenth birthday of Padmanabh Singh of Jaipur. The frame records the formality and gathered household of the occasion.',
  'Swarms moving over the fields of Barmer during the desert-locust season. Farmers worked through the daylight hours to drive the insects off standing crops.',
  'A survey of drought-stressed plant life across the Thar. The series records hardy desert species holding on at the edge of cultivation.',
  'A portrait from the political beat covering the Rajasthan state assembly in Jaipur.\n\n<!-- TODO: add licensed image via CMS — intended portrait: Chief Minister Ashok Gehlot (India Today CDN). -->',
  'Monsoon light returning to the lakes and ghats of Udaipur after the dry months.\n\n<!-- TODO: add licensed image via CMS — intended portrait: farmer Rameswar Regar, Samodh Village (India Today CDN). -->',
  'A frame from a rural health outreach, where mobile clinics carry basic care to villages far from a hospital.\n\n<!-- TODO: add licensed image via CMS — intended portrait: Meera Mali, Rajasthan (India Today CDN). -->',
  'The annual cattle and camel fair at Pushkar, one of the largest gatherings of its kind in the region. Traders, herders and pilgrims share the fairground over several days.',
  'The indigo-washed lanes of Jodhpur after an unseasonal shower, the old quarter’s blue walls darkened with rain.\n\n<!-- TODO: add licensed image via CMS — intended portrait: President Pratibha Devisingh Patil, Jaipur (India Today CDN). -->',
  'An open-air lesson in a desert hamlet, where classes are held without a permanent building. The children gather on the sand around their teacher.',
  'Harvest in the bajra (pearl-millet) fields that sustain much of rural Rajasthan. Cut stalks and winnowing fill the working day.',
  'Evening aarti on the banks of the Ganga, lamps and smoke catching the last light over the water.',
  'The spice market of Old Delhi, its narrow lanes stacked with sacks of chilli, turmeric and dried goods.',
  'Writers and readers in conversation at the Jaipur literature gathering, a study of audience and stage.',
  'A tigress at first light in Ranthambore, moving through the dry grass of the reserve before the heat rises.',
  'Weavers of Kutch at the loom, continuing a textile tradition carried across generations of the region.',
  'The sandstone ramparts of Bikaner under raking afternoon light — a study of carved stone and deep shadow in the northern desert.',
  'Winter fog settling over Mount Abu, the hill station softened to silhouettes of trees and ridgelines.',
  'Light and stone at Chittorgarh, the long walls and towers of the fort reading as mass and shadow.',
  'Salt workers at Sambhar Lake, raking and gathering crystallised salt across the vast shallow flats.',
  'Carved detail from the painted havelis of the Shekhawati region, where merchant houses carry frescoed walls and bracketed windows.',
  'The descending geometry of a Bundi stepwell, the baori’s symmetrical flights built to reach the water table.',
  'Birdlife in the wetlands near Alwar, waders and migrants gathered at the water’s edge.',
  'Temple ruins at Karauli, weathered shrine stone holding its form against time and sun.',
  'Reflections in the palace tanks of Dungarpur, architecture mirrored on still water.',
  'Textile looms at work in Pali, a town long associated with cloth and dyeing.',
  'The granite hills around Sirohi, bare rock and scrub under a wide sky.',
  'The old city lanes of Tonk, shaded passages between aged façades.',
  'The chambal ravines near Kota, eroded badlands cut by the river over centuries.',
  'Wetland birds at Bharatpur, the marshes a wintering ground for resident and migratory species.',
  'Rat-hole mining near Sawai Madhopur, narrow worked seams and the labour around them.',
  'The sandstone quarries of Dholpur, cut faces and stacked blocks of the stone that built much of the region.',
  'Canal irrigation at Hanumangarh, water channelled across fields in the state’s northern plains.',
  'The cultivated farmscape of Sri Ganganagar, ordered fields fed by the canal network.',
  'Painted havelis at Churu, frescoed merchant houses standing in the open desert town.',
  'The cattle fair at Nagaur, one of the region’s great livestock gatherings, traders and animals filling the ground.',
  'The hill fort above Jalore, its walls following the rock against the skyline.',
  'Wood-carving artisans of Barmer at their craft, chisels shaping furniture and door panels.',
  'Frescoes of Jhunjhunu, painted walls and ceilings within the Shekhawati havelis.',
  'The old mansions of Sikar, their faded grandeur set along the town’s streets.',
  'The restored stepwell at Neemrana, a deep multi-storey baori cut into the ground.',
  'The hill fort at Laxmangarh, ramparts rising from the rock above the town.',
  'A rural market at Mandal, weekly trade in produce and household goods.',
  'A pottery village near Asind, wheels and drying rows of unfired earthenware.',
  'A series on the stepwells of Bhinai, the geometry of steps descending to water.',
  'The palatial gardens of Deeg, formal water channels and pavilions of the old summer palace.',
  'A banyan tree near Alwar, its aerial roots and canopy spreading over the ground.',
  'A Jain temple at Tijara, carved marble and ordered shrine interiors.',
  'The copper mines of Khetri, the worked hills of a long-standing mining district.',
  'The haveli town of Fatehpur, frescoed merchant houses lining the Shekhawati streets.',
];

const workImg = { 0: 'slide-1.jpg', 1: 'slide-2.jpg', 3: 'web-banner-2025.png', 8: 'magazine-cover.jpg' };
const workCap = {
  3: 'Field Archive — Documentary Work · 2025',
  5: 'Chief Minister Ashok Gehlot, Jaipur · 2009',
  6: 'Farmer Rameswar Regar, Samodh Village · 2007',
  7: 'Meera Mali — Widow from Child Marriage, Rajasthan · 2008',
  8: 'Magazine Cover — India Today',
  9: 'President Pratibha Devisingh Patil, Jaipur · 2007',
};
const featuredIdx = new Set([3, 8]);

const WORK = titles.map((title, i) => {
  const slug = slugify(title);
  const data = { title, year: years[i] ?? 2010, location: locations[i] };
  if (workImg[i]) data.image = `../../assets/work/${workImg[i]}`;
  if (workCap[i]) data.caption = workCap[i];
  if (featuredIdx.has(i)) data.featured = true;
  return { slug, data, body: bodies[i] };
});
// AFMJ award — featured, not in the original list (§6.2)
WORK.push({
  slug: 'afmj-recognition-2023',
  data: {
    title: 'AFMJ Recognition — 2023',
    year: 2023,
    location: 'Award',
    image: '../../assets/work/afmj-recognition-2023.png',
    caption: 'AFMJ Award · Purushottam Diwakar · 2023',
    featured: true,
  },
  body: 'A 2023 recognition in the AFMJ awards, documented here among the honours received over the career.\n\n<!-- TODO: confirm the full award name and citation with Mr. Diwakar before launch. -->',
});

/* ===================== STORIES (19) ===================== */
// opening paragraph = verbatim v4 body; expansion adds no new facts/quotes.
const STORIES = [
  {
    title: 'When the Earth Cracks', date: 'Jaisalmer · 2019', year: 2019, location: 'Jaisalmer', mood: 'drought',
    quote: '“The land remembers every dry season.”',
    open: 'For three months, Diwakar traversed the arid spine of western Rajasthan. Women walking miles for water, empty reservoirs, and the unbroken resilience of a desert civilization.',
    more: 'Across that long season the same scene repeats from village to village — the walk to a distant source, the wait, the carry home. Read together, the frames become less a record of a single drought than of a way of living with scarcity.',
  },
  {
    title: 'Locusts Over the Desert', date: 'Barmer · 2020', year: 2020, location: 'Barmer', mood: 'drought',
    quote: '“Nature’s fury has no calendar.”',
    open: "During the locust invasion, Diwakar captured farmers fighting with drums and fire. 'The sky turned dark at noon. A man fell to his knees, not from exhaustion, but from hopelessness.'",
    more: 'The pictures hold both the swarm and the response to it — the noise and smoke raised against the insects, and the standing crop they had come to strip. It is a portrait of a community meeting an old threat with whatever is at hand.',
  },
  {
    title: 'Venus Transit: Once in 2117 Years', date: 'Jaipur · 2012', year: 2012, location: 'Jaipur',
    quote: '“Patience is the soul of astronomy and photojournalism.”',
    open: "He photographed the rare transit of Venus across the Sun. 'I knew I was framing history for generations unborn.' The image later appeared in astronomy journals.",
    more: 'The event itself lasted only hours and will not return within any living memory. What remains is the single frame — a small dark disc against the sun, kept for a future that has not yet arrived.',
  },
  {
    title: 'The Blue City After Rains', date: 'Jodhpur · 2014', year: 2014, location: 'Jodhpur', mood: 'water',
    quote: '“Rain reveals hidden textures.”',
    open: "After an unseasonal downpour, Diwakar walked through the soaked lanes of Jodhpur. 'The blue walls reflected the grey sky — it was like walking inside a watercolor.'",
    more: 'The rain changed the city he knew, deepening the indigo of the walls and pooling the light in the lanes. The frames keep that brief, altered version of Jodhpur before it dried back to ordinary day.',
  },
  {
    title: 'The Camel Fair’s Silent Moment', date: 'Pushkar · 2009', year: 2009, location: 'Pushkar',
    quote: '“Silence speaks louder than a thousand camels.”',
    open: "Amid the chaos of the fair, he found an old herder praying alone. 'That solitude became my best frame of the year.'",
    more: 'Around the single figure the great Pushkar fair carried on — the trading, the crowds, the animals. The picture holds the one still point he found inside all that movement.',
  },
  {
    title: 'The Artisans of Mud', date: 'Kutch · 2016', year: 2016, location: 'Kutch',
    quote: '“Craft is conversation with ancestors.”',
    open: "He documented the revival of traditional mud and mirror work. 'Each artisan carries a thousand years of memory in their fingers.'",
    more: 'The work is slow and handmade, each wall and surface built up by the same gestures passed down through the craft. Photographing it became a way of recording continuity as much as decoration.',
  },
  {
    title: 'The Tiger Without a Tail', date: 'Ranthambore · 2018', year: 2018, location: 'Ranthambore',
    quote: '“Wilderness accepts all scars.”',
    open: "A tigress injured by a trap roamed the buffer zone. 'She was majestic despite her wound. That image taught me that imperfection is its own beauty.'",
    more: 'She carried her injury without losing her bearing, moving through the buffer zone as though it were unremarkable. The frame keeps that composure rather than the wound.',
  },
  {
    title: 'Election Night Riot', date: 'Jaipur · 2013', year: 2013, location: 'Jaipur', mood: 'night',
    quote: '“The first duty is to return home.”',
    open: "During a political rally, violence erupted. 'I wrapped my camera in my shirt and ran. I chose my life over the story.'",
    more: 'The picture that might have been made that night was never taken. What he kept instead was the decision itself — the line past which the story is no longer worth the risk.',
  },
  {
    title: 'Monsoon That Never Came', date: 'Udaipur · 2007', year: 2007, location: 'Udaipur', mood: 'drought',
    quote: '“Hope smells like wet earth.”',
    open: "He waited all summer for the first rain. When it finally arrived, he cried behind the camera. 'A farmer raised his arms to the sky — that image became a symbol of hope.'",
    more: 'The whole summer had been a wait — for the sky to change and for the work to begin again. The frame caught the instant relief arrived, held in a single raised figure.',
  },
  {
    title: 'The Pakistani Border at Midnight', date: 'Jaisalmer · 2005', year: 2005, location: 'Jaisalmer', mood: 'night',
    quote: '“Invisible lines divide more than land.”',
    open: "On a moonless night, he photographed the border fence. 'A soldier whispered, ‘Don’t use flash. They’re watching.’ That tension never left me.'",
    more: 'There was almost nothing to see in the dark — only the fence, the silence, and the sense of being watched from the other side. The picture holds that tension more than any landmark.',
  },
  {
    title: 'The Rat Temple’s Secret', date: 'Bikaner · 2015', year: 2015, location: 'Bikaner',
    quote: '“Faith has many forms.”',
    open: "He documented the Karni Mata temple without sensationalism. 'The rats are not monsters — they are part of a belief system. My job is to show, not judge.'",
    more: 'He chose to frame the temple as its worshippers see it rather than as spectacle. The restraint is the point — a record of belief observed rather than judged.',
  },
  {
    title: 'The Frozen Lake Accident', date: 'Himachal · 2017', year: 2017, location: 'Himachal', mood: 'water',
    quote: '“Truth is often messy.”',
    open: "He fell through thin ice while shooting a glacial lake. 'My assistant pulled me out. The camera kept running. The footage is chaotic but real.'",
    more: 'What survived from that moment is unplanned and unsteady, made in the middle of an accident rather than composed around it. He kept it for exactly that reason.',
  },
  {
    title: 'The Dharavi Diary', date: 'Mumbai · 2016', year: 2016, location: 'Mumbai',
    quote: '“Dignity has no postal code.”',
    open: "He spent a week in Dharavi, not photographing poverty, but industry. 'I saw leather tanners, potters, recyclers — an economy of dignity.'",
    more: 'For a week he followed the work rather than the want — the tanneries, the kilns, the sorting and recycling that fill the day. The series is a portrait of labour, not of lack.',
  },
  {
    title: 'The Boatman Who Saved My Camera', date: 'Varanasi · 2014', year: 2014, location: 'Varanasi', mood: 'water',
    quote: '“Sometimes a stranger understands your purpose.”',
    open: "His boat capsized. A boatman dove in and rescued his camera bag before Diwakar himself. 'He said, ‘Your eye is more important than your life.’'",
    more: 'A stranger on the river understood, in an instant, what the bag meant to the man who carried it. The story stays with the work as a reminder of that unasked-for help.',
  },
  {
    title: 'The Serial Bomb Blasts', date: 'Jaipur · 2008', year: 2008, location: 'Jaipur', mood: 'night',
    quote: '“There are things we must never photograph.”',
    open: "He was one of the first photographers at the blast sites. 'I saw body parts and heard screams. I put my camera down for ten minutes. Some moments are too sacred for a shutter.'",
    more: 'Arriving early, he made the opposite of the expected choice and lowered the camera. The ten minutes he did not photograph became the part of the assignment he remembers most.',
  },
  {
    title: 'The Floods of Silence', date: 'Kerala · 2018', year: 2018, location: 'Kerala', mood: 'water',
    quote: '“In disaster, ordinary people become heroes.”',
    open: "During the Kerala floods, he captured rescue operations. 'A fisherman used his boat to save dozens. That image of him carrying a child became a symbol of humanity.'",
    more: 'The rescues were carried out by people who simply had boats and chose to use them. The frame of a fisherman lifting a child came to stand for that ordinary courage.',
  },
  {
    title: 'The Pandemic’s Loneliest Funeral', date: 'Delhi · 2020', year: 2020, location: 'Delhi', mood: 'night',
    quote: '“Grief became distance.”',
    open: "He photographed a funeral with only two mourners. 'The priest wore a hazmat suit. I stood 50 feet away. That image summarized an entire year of grief.'",
    more: 'Everything about the rite had been pared back by distance — two mourners, a covered priest, a photographer kept far off. In that emptiness the single frame held the shape of the whole year.',
  },
  {
    title: 'The Last Waterhole', date: 'Rajasthan · 2021', year: 2021, location: 'Rajasthan', mood: 'drought',
    quote: '“Water is memory.”',
    open: "In a remote village, he documented the last surviving well. 'Women lowered their pots with trembling hands. That well was their grandmother’s grandmother’s.'",
    more: 'The well was the last of many, and the only one still giving water to the village. The frames record both the daily drawing of it and the long inheritance it represents.',
  },
  {
    title: 'The School Under a Tree', date: 'Thar · 2022', year: 2022, location: 'Thar Desert',
    quote: '“Education finds a way.”',
    open: "A government school without a building, held under a banyan tree. 'The teacher had no blackboard — only sand and a stick. The children’s eyes were brighter than the sun.'",
    more: 'With no building and no board, the lesson is taught in the sand and erased again each day. The picture keeps the improvisation and the attention of the children around it.',
  },
];

/* ===================== THOUGHTS (8) — ethics / behind the frame ===================== */
const THOUGHTS = [
  {
    title: 'The Tribe That Wanted to Kill Me', date: 'Remote Africa · 2017', year: 2017, location: 'Remote Africa',
    open: "During an expedition in remote Africa, Diwakar misinterpreted a tribe’s gestures. 'They wanted to kill me.' He escaped without a single frame. 'Survival matters more than the shutter.'",
    more: 'He came away with nothing to show for the journey — no frame, no record of the encounter. The story he keeps is about the limit of the work, the point at which leaving is the only choice.',
  },
  {
    title: 'The Ethics of Not Publishing', date: 'India Today Archives', year: 2010, location: 'India Today Archives',
    open: "He once captured a moment so negative for society that he chose not to disclose it. 'I had to choose not to communicate the negativity.' The image remains locked in his private archive.",
    more: 'The decision was not about whether the picture was true but about what publishing it would do. It stays in the archive as a record of a choice rather than of an event.',
  },
  {
    title: 'The Woman Who Walked 20 Kilometers for Water', date: 'Jaisalmer · 2019', year: 2019, location: 'Jaisalmer',
    open: "He followed a woman named Geeta for two days. 'Her feet were cracked, but she never complained. That portrait was never published — at her request.'",
    more: 'Over two days the walk repeated, the same distance covered for the same water. The portrait exists but stays unpublished, held back at the request of the person in it.',
  },
  {
    title: 'The Last Vulture', date: 'Thar Desert · 2015', year: 2015, location: 'Thar Desert',
    open: "He documented the rapid decline of vultures. 'A dying vulture near a carcass — its eyes were hollow. That image became a requiem for a species.'",
    more: 'The single bird stood in for a population that had all but vanished from the region. The frame reads less as a record of one animal than as an elegy for the rest.',
  },
  {
    title: 'When the Chief Minister Asked to Delete a Photo', date: 'Rajasthan · 2018', year: 2018, location: 'Rajasthan',
    open: "A politician demanded he delete an unflattering image. 'I refused. That’s not journalism.'",
    more: 'The request put the work and the subject’s wishes directly at odds. Refusing it was, for him, simply the definition of the job rather than an act of defiance.',
  },
  {
    title: 'The Blue City in Flames', date: 'Jodhpur · 2010', year: 2010, location: 'Jodhpur',
    open: "A massive fire broke out. He ran toward the flames. 'The heat melted my lens hood, but I got the shot of a family being rescued.'",
    more: 'Moving toward the fire rather than away from it cost him equipment and came close to costing more. What he carried out was the single frame of the rescue.',
  },
  {
    title: 'The Artisan Who Lost His Fingers', date: 'Kutch · 2019', year: 2019, location: 'Kutch',
    open: "A weaver crushed his fingers but continued to weave with his teeth. 'I couldn’t photograph that — it was too cruel.'",
    more: 'He watched the weaver adapt to his injury and continue the work, and chose not to make a picture of it. The restraint, not the image, is what he kept from the day.',
  },
  {
    title: 'The Unseen Portrait of a Beggar', date: 'Delhi · 2011', year: 2011, location: 'Delhi',
    quote: '“Commodifying grief is not journalism.”',
    open: "He spent an afternoon with an elderly man near India Gate. 'He told me his son had thrown him out. I took his portrait but never published it. Some pain is not for sale.'",
    more: 'The afternoon produced a portrait he decided the man’s circumstances did not entitle him to sell. It remains unpublished — a picture made and then deliberately set aside.',
  },
];

/* ===================== WRITE ===================== */
async function main() {
  // start clean so removed/renamed entries don't linger
  for (const d of ['hero', 'work', 'stories', 'thoughts']) {
    await rm(join(CONTENT, d), { recursive: true, force: true });
  }

  for (const h of HERO) {
    await writeYaml('hero', h.slug, {
      order: h.order,
      location: h.location,
      title: h.title,
      imageDesktop: `../../assets/hero/desktop/${h.img}`,
      position: h.position,
      tone: h.tone,
    });
  }

  for (const w of WORK) await writeMd('work', w.slug, w.data, w.body);

  for (const s of STORIES) {
    await writeMd('stories', slugify(s.title), {
      title: s.title, date: s.date, year: s.year, location: s.location,
      quote: s.quote, mood: s.mood,
    }, `${s.open}\n\n${s.more}`);
  }

  for (const t of THOUGHTS) {
    await writeMd('thoughts', slugify(t.title), {
      title: t.title, date: t.date, year: t.year, location: t.location,
      quote: t.quote,
    }, `${t.open}\n\n${t.more}`);
  }

  console.log(
    `Wrote ${HERO.length} hero, ${WORK.length} work, ${STORIES.length} stories, ${THOUGHTS.length} thoughts.`,
  );
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
