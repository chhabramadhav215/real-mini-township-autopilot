const fs = require('fs');
const path = require('path');

/**
 * Town Architect Engine (Gemini 2.5 Flash Free API + Multi-Episode Civil Engineering Blueprints)
 * Generates continuous 5-stage progressive real-world construction / building process plans
 * with locked single-structure continuity.
 */

const CRAFTSMAN_HANDS_DESCRIPTION = 
  "Authentic skilled construction craftsman hands with natural skin texture, subtle dried cement and fine stone dust on knuckles, rolled-up dark denim work sleeves, bare wrists with no jewelry or wristwatches, holding heavy-duty construction tools";

const CAMERA_BASE_PROMPT = 
  "Cinematic 4K real-world construction site cinematography: locked eye-level and crisp 45-degree documentary angle, natural daylight and construction work lighting, razor-sharp focus on the active building structure and materials, genuine depth of field, real gravel and concrete foundations, Sony FX6 cinema camera, authentic physical construction process";

// Comprehensive catalog of realistic civil-engineering construction scenarios for all 3 series
const PROCEDURAL_BLUEPRINTS = {
  smart_city: [
    {
      episode: 1,
      title: "Site Preparation and Road Paving",
      subtitle_2word: "ROAD PAVING",
      problem: "Uneven raw terrain, dense clay soil, and wild surface roots cover the roadway corridor.",
      solution: "Clear the surface brush, grade and pack the dense subsoil, and lay a paved dual-lane boulevard.",
      structures_added: "Compacted dual-lane asphalt boulevard with concrete curbs and painted lane markers",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Clearing stubborn surface roots and wild brush from the ground using steel shears and trenching cutters",
          tool: "heavy hand shears and ground cutters",
          asmr_type: "grass_trimming",
          narration: "Before construction can begin, we clear the ground corridor of stubborn roots and surface brush."
        },
        {
          stage_num: 2,
          action: "Screeding and packing the dense subsoil using a heavy aluminum leveling bar",
          tool: "heavy aluminum screed bar",
          asmr_type: "dirt_scraping",
          narration: "A heavy aluminum screed glides across the subsoil, establishing a perfectly flat foundation."
        },
        {
          stage_num: 3,
          action: "Troweling fresh dark bitumen asphalt compound into the center road channel",
          tool: "pointed stainless steel trowel",
          asmr_type: "cement_troweling",
          narration: "Fresh asphalt compound is troweled into the road corridor with precision."
        },
        {
          stage_num: 4,
          action: "Rolling the fresh asphalt with a heavy steel compactor roller to achieve a smooth durable pavement",
          tool: "heavy steel compactor roller",
          asmr_type: "gravel_rolling",
          narration: "A heavy steel roller compresses the aggregate tight, creating a dense, durable roadway surface."
        },
        {
          stage_num: 5,
          action: "Spraying crisp white highway centerlines using a precision line-marking sprayer and steel guide",
          tool: "precision line-marking sprayer and steel stencil",
          asmr_type: "spray_painting",
          narration: "Using a precision line-marking sprayer and steel guide, crisp dividers appear, completing the new roadway."
        }
      ]
    },
    {
      episode: 2,
      title: "Installing Subterranean Drainage Culverts & Sump Basins",
      subtitle_2word: "STORM DRAINAGE",
      problem: "Heavy urban runoff during monsoon season causes localized flooding along the main avenue.",
      solution: "Excavate deep roadside drainage channels, install slotted concrete box culverts, and seat heavy cast iron catch basins.",
      structures_added: "Subterranean concrete stormwater drainage culverts and cast-iron catch basins",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Excavating parallel drainage trenches along both curbs of the asphalt avenue using a steel trenching spade",
          tool: "steel trenching spade",
          asmr_type: "dirt_scraping",
          narration: "To prevent stormwater accumulation, we cut deep roadside utility trenches on both sides of Avenue One."
        },
        {
          stage_num: 2,
          action: "Bedding the trenches with fine aggregate pea gravel using a utility scoop and tamper",
          tool: "utility scoop and tamper",
          asmr_type: "gravel_rolling",
          narration: "A clean bed of graded pea gravel provides a self-draining foundation beneath the culvert pipes."
        },
        {
          stage_num: 3,
          action: "Lowering slotted reinforced concrete drainage pipes into the trench using steel alignment tongs",
          tool: "steel alignment tongs",
          asmr_type: "wire_tweezing",
          narration: "Pre-cast concrete stormwater conduits are aligned and seated seam to seam along the gravel bed."
        },
        {
          stage_num: 4,
          action: "Applying fast-setting hydraulic mortar around the pipe joints with a dispensing nozzle and trowel",
          tool: "mortar dispensing nozzle and trowel",
          asmr_type: "cement_troweling",
          narration: "High-strength mortar seals every pipe collar to ensure a flood-proof underground hydraulic network."
        },
        {
          stage_num: 5,
          action: "Seating heavy cast iron storm drain grates flush with the roadway curb using a setting mallet",
          tool: "setting mallet and pry bar",
          asmr_type: "brick_tapping",
          narration: "Finally, cast iron catch-basin grates are tapped flush into the curbs, completing the drainage network."
        }
      ]
    },
    {
      episode: 3,
      title: "Pothole Emergency Repair & Bitumen Seal Coating",
      subtitle_2word: "ROAD REPAIR",
      problem: "Heavy truck traffic created an uneven fissure and pothole on Avenue One.",
      solution: "Saw-cut the damaged asphalt perimeter, excavate loose base material, compact new binder, and hot-pour bitumen sealant.",
      structures_added: "Repaved asphalt patch with tar-sealed perimeter seams and high-visibility road work cones",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Scoring a clean rectangular repair perimeter around the damaged asphalt with a diamond scoring saw",
          tool: "diamond scoring saw",
          asmr_type: "wood_cutting",
          narration: "Proper civil repair starts with clean rectangular cut lines around the cracked roadway surface."
        },
        {
          stage_num: 2,
          action: "Chiseling out the fractured asphalt sub-base using a cold chisel and steel mallet",
          tool: "cold chisel and steel mallet",
          asmr_type: "brick_tapping",
          narration: "With a cold chisel and steel mallet, loose debris is chipped away down to the stable sub-grade."
        },
        {
          stage_num: 3,
          action: "Brushing on a rich black bitumen tack coat primer with a horsehair applicator brush",
          tool: "tack coat applicator brush",
          asmr_type: "cement_troweling",
          narration: "A rich bitumen tack coat creates a watertight adhesive bond between the old road and new asphalt."
        },
        {
          stage_num: 4,
          action: "Troweling fresh hot-mix asphalt paste into the patch and leveling with an aluminum screed",
          tool: "steel trowel and heavy tamper",
          asmr_type: "cement_troweling",
          narration: "Fresh high-density asphalt compound is packed tightly into the void, eliminating any future subsidence."
        },
        {
          stage_num: 5,
          action: "Compacting the patch with a heavy steel roller and applying rubberized crack sealant along the seams",
          tool: "heavy hand roller and sealant gun",
          asmr_type: "gravel_rolling",
          narration: "Rolled glass-smooth and sealed along the edges, the repaired lane is stronger than the day it was poured."
        }
      ]
    },
    {
      episode: 4,
      title: "Excavating Underground Fuel Storage Vaults (Part 1 of 2)",
      subtitle_2word: "FUEL VAULT",
      problem: "The district's emergency vehicles and construction machinery face a critical fuel distribution shortage.",
      solution: "Excavate a deep reinforced vault pit beside Avenue One and install dual subterranean fuel storage cylinders with leak barriers.",
      structures_added: "Deep reinforced concrete underground fuel containment vault with twin heavy fuel cylinders",
      is_multipart: true,
      multipart_info: { part: 1, total_parts: 2, title: "Metropolis Fuel Depot & Charging Hub" },
      stages: [
        {
          stage_num: 1,
          action: "Marking out the containment pit perimeter and excavating deep soil alongside Avenue One with a trenching spade",
          tool: "trenching spade and excavation scoop",
          asmr_type: "dirt_scraping",
          narration: "Part one of our fuel depot begins with deep subterranean excavation for hazardous liquid containment."
        },
        {
          stage_num: 2,
          action: "Erecting corrugated steel sheet-pile shoring walls to secure the excavation pit perimeter",
          tool: "clamping tongs and mallet",
          asmr_type: "wire_tweezing",
          narration: "Interlocking corrugated sheet piles are driven around the perimeter to prevent soil cave-in during deep work."
        },
        {
          stage_num: 3,
          action: "Pouring a self-leveling reinforced concrete foundation slab at the base of the vault",
          tool: "concrete trowel and dispensing nozzle",
          asmr_type: "cement_troweling",
          narration: "A reinforced concrete anchor pad is poured to hold the heavy fuel tanks firmly in place."
        },
        {
          stage_num: 4,
          action: "Lowering twin heavy cylindrical underground fuel storage tanks onto the concrete cradle",
          tool: "heavy rigging straps and placement grips",
          asmr_type: "wire_tweezing",
          narration: "Heavy cylindrical fuel containment tanks are lowered into position and secured directly into the concrete saddles."
        },
        {
          stage_num: 5,
          action: "Backfilling the tank vault with clean quartz silica sand up to the roadway subgrade level",
          tool: "sand scoop and leveling tamper",
          asmr_type: "gravel_rolling",
          narration: "Non-combustible quartz sand is packed around the tanks, completing the secure underground storage vault."
        }
      ]
    },
    {
      episode: 5,
      title: "Building the Twin-Pump Petrol Station & Canopy (Part 2 of 2)",
      subtitle_2word: "PETROL STATION",
      problem: "The underground fuel vault is secured, and now the site requires a dedicated concrete fueling island, commercial dispensers, and an overhead protective canopy.",
      solution: "Pour the reinforced concrete island apron directly above the fuel tanks, install two commercial fuel dispensers, erect the structural canopy columns, and mount the overhead roof shelter.",
      structures_added: "Modern street-level fuel station with overhead canopy, twin commercial fuel dispensers, and safety bollards",
      is_multipart: true,
      multipart_info: { part: 2, total_parts: 2, title: "Metropolis Fuel Depot & Charging Hub" },
      stages: [
        {
          stage_num: 1,
          action: "Forming and troweling the raised reinforced concrete fueling island apron directly above the underground vault",
          tool: "stainless steel concrete trowel and edge tool",
          asmr_type: "cement_troweling",
          narration: "Building the fuel station starts with forming and finishing the raised concrete island apron directly over the fuel vault."
        },
        {
          stage_num: 2,
          action: "Mounting and bolting two commercial fuel dispenser pump units onto the cured concrete island",
          tool: "socket wrench and alignment level",
          asmr_type: "brick_tapping",
          narration: "Two commercial fuel dispensers are anchored onto the island pad, with heavy rubber delivery hoses connected."
        },
        {
          stage_num: 3,
          action: "Erecting structural steel cantilever canopy columns and cross-beams directly over the concrete fueling island",
          tool: "steel erection wrench and torque tool",
          asmr_type: "brick_tapping",
          narration: "Heavy structural steel canopy columns are bolted onto anchor plates directly above the island to support the overhead roof."
        },
        {
          stage_num: 4,
          action: "Installing the protective weather canopy deck and fascia panels directly across the steel canopy frame over the dispensers",
          tool: "fastener driver and alignment clamps",
          asmr_type: "wood_cutting",
          narration: "The protective overhead canopy deck is hoisted and fastened directly over the fuel dispensers, shielding the pumps from the elements."
        },
        {
          stage_num: 5,
          action: "Bolting yellow steel impact protection bollards and painting safety chevron bay markings around the fueling island",
          tool: "line-marking sprayer and stencil",
          asmr_type: "spray_painting",
          narration: "With steel impact bollards anchored at the island corners and yellow safety bay lines applied, the fueling station is fully operational."
        }
      ]
    },
    {
      episode: 6,
      title: "Wiring the Modern Solar Streetlamp Grid",
      subtitle_2word: "SOLAR LAMPS",
      problem: "Nighttime darkness along Avenue One creates hazardous conditions for vehicular traffic.",
      solution: "Trench underground wiring conduit and erect 6 modern solar-assisted LED streetlamps along the curbs.",
      structures_added: "Array of 6 modern stainless-steel curved solar streetlamps with bright LED luminaires",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Drilling precision anchor sockets through the concrete sidewalk curbs using a rotary hammer drill",
          tool: "rotary hammer drill",
          asmr_type: "dirt_scraping",
          narration: "To illuminate Avenue One, we drill foundation anchor sockets through the concrete sidewalk curbs."
        },
        {
          stage_num: 2,
          action: "Threading insulated copper electrical conduit through the underground curb raceway",
          tool: "wire strippers and needle-nose pliers",
          asmr_type: "wire_tweezing",
          narration: "Electrical wiring is routed through the subterranean channels to supply continuous clean power."
        },
        {
          stage_num: 3,
          action: "Lowering curved stainless steel lamp posts into each pre-drilled anchor socket with setting clamps",
          tool: "setting clamp and alignment level",
          asmr_type: "brick_tapping",
          narration: "Curved stainless steel lamp posts are seated into each foundation and checked with an alignment level."
        },
        {
          stage_num: 4,
          action: "Affixing photovoltaic solar panels and high-efficiency luminaire heads to the post crests",
          tool: "hex driver and fastener tool",
          asmr_type: "wire_tweezing",
          narration: "Photovoltaic solar collector heads are secured atop each arm, creating an autonomous off-grid lighting array."
        },
        {
          stage_num: 5,
          action: "Powering on the LED warm-white luminaires to cast clean light pools across the asphalt",
          tool: "electrical testing meter and switch",
          asmr_type: "spray_painting",
          narration: "Power is energized. Clean streetlamp glow illuminates the dark pavement, turning Avenue One into a vibrant corridor."
        }
      ]
    }
  ],

  mountain_village: [
    {
      episode: 1,
      title: "Clearing the Alpine Route and Grading Road Base",
      subtitle_2word: "GROUND CLEARING",
      problem: "Dense wild roots, rocky outcrops, and unstable slope loam prevent building any access route.",
      solution: "Clear brush, grade the mountain dirt, and lay a compacted crushed granite roadbed.",
      structures_added: "Crushed granite mountain road base, compacted earth foundation",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Clearing brush and dense roots from the mountain trail using heavy hand shears and clearing hooks",
          tool: "hand shears and clearing hook",
          asmr_type: "grass_trimming",
          narration: "We begin on the untouched mountain slope, clearing away wild brush and roots to uncover the solid ground."
        },
        {
          stage_num: 2,
          action: "Scraping and leveling uneven mountain dirt with a steel grading rake and heavy tamper",
          tool: "grading rake and tamper",
          asmr_type: "dirt_scraping",
          narration: "Every section of alpine dirt is leveled and compacted, preparing a rock-solid foundation for the village trail."
        },
        {
          stage_num: 3,
          action: "Spreading coarse grey crushed granite stone along the cleared route with a steel spreader",
          tool: "steel trowel and spreader",
          asmr_type: "gravel_rolling",
          narration: "A layer of crushed granite creates an all-weather road that won't wash away in mountain storms."
        },
        {
          stage_num: 4,
          action: "Compacting and rolling the granite gravel firmly using a heavy steel compaction roller",
          tool: "heavy compaction roller",
          asmr_type: "gravel_rolling",
          narration: "Using a heavy compaction roller, we compress the gravel until it forms a dense, durable roadbed."
        },
        {
          stage_num: 5,
          action: "Setting heavy granite curbstones along the finished trail using stone setting clamps and a mallet",
          tool: "stone setting clamps and mallet",
          asmr_type: "brick_tapping",
          narration: "Finally, heavy granite curbstones lock the roadbed in place, completing the alpine access route."
        }
      ]
    },
    {
      episode: 2,
      title: "Building the Dry-Stacked Stone Retaining Wall",
      subtitle_2word: "RETAINING WALL",
      problem: "Spring thaw runoff causes alpine topsoil to slide toward the newly cleared road.",
      solution: "Erect a traditional dry-stacked alpine slate retaining wall along the hillside terrace.",
      structures_added: "Terraced dry-stacked mountain slate retaining wall with gravel weep holes",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Carving a stepped foundation trench along the hillside slope with a steel trenching spade",
          tool: "trenching spade",
          asmr_type: "dirt_scraping",
          narration: "To prevent mountain mudslides, we excavate a tiered foundation shelf into the alpine dirt bank."
        },
        {
          stage_num: 2,
          action: "Setting heavy granite foundation stones flat into the footing using setting tongs",
          tool: "stone setting tongs",
          asmr_type: "brick_tapping",
          narration: "The largest slate blocks form a gravity-anchored footing, tilted slightly back into the hillside for strength."
        },
        {
          stage_num: 3,
          action: "Dry-stacking courses of fractured natural slate stones with interlocking staggered joints",
          tool: "stonemason hammer and chisel",
          asmr_type: "brick_tapping",
          narration: "Stone after stone is fitted dry without mortar, allowing hydrostatic water pressure to freely escape."
        },
        {
          stage_num: 4,
          action: "Backfilling behind the slate wall with crushed alpine drainage gravel using a utility scoop",
          tool: "drainage gravel scoop",
          asmr_type: "gravel_rolling",
          narration: "Coarse crushed gravel behind the wall provides continuous sub-surface drainage, shielding the trail."
        },
        {
          stage_num: 5,
          action: "Setting wide flat capstones along the wall crest and pointing joints with a setting mallet",
          tool: "masonry trowel and setting mallet",
          asmr_type: "grass_trimming",
          narration: "With smooth capstones aligned and securely tapped into the joints, the terrace is rock-solid."
        }
      ]
    },
    {
      episode: 3,
      title: "Constructing the Heavy Timber Trestle Ravine Bridge",
      subtitle_2word: "TIMBER BRIDGE",
      problem: "A deep mountain ravine divides the village road from the upper timber stands.",
      solution: "Construct a hand-hewn rustic pine timber trestle bridge across the ravine gap.",
      structures_added: "Rustic heavy pine timber trestle road bridge with safety log railings",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Chiseling bridge abutment seats into the rocky ravine cliffs with a heavy cold chisel",
          tool: "carpentry chisel and mallet",
          asmr_type: "brick_tapping",
          narration: "We carve level masonry bridge abutments into the opposing rock cliffs across the mountain ravine."
        },
        {
          stage_num: 2,
          action: "Assembling A-frame timber bent supports using hand-notched pine beams and framing clamps",
          tool: "heavy timber clamps and framing square",
          asmr_type: "wood_cutting",
          narration: "Hand-hewn pine timbers are joined with mortise and tenon notches to build the structural trestle bents."
        },
        {
          stage_num: 3,
          action: "Spanning heavy pine log stringers across the ravine gap onto the abutments with timber tongs",
          tool: "timber tongs and drift pin hammer",
          asmr_type: "wood_cutting",
          narration: "Heavy milled pine stringer logs span the divide, locked together with solid steel drift pins."
        },
        {
          stage_num: 4,
          action: "Laying individual rough-sawn timber road decking planks one by one across the stringers",
          tool: "framing hammer and timber fasteners",
          asmr_type: "brick_tapping",
          narration: "Rough-sawn wood deck planks are secured crosswise, creating an authentic clattering timber roadway."
        },
        {
          stage_num: 5,
          action: "Installing weathered split-rail cedar guardrails along both sides of the bridge span",
          tool: "fastener driver and brackets",
          asmr_type: "wood_cutting",
          narration: "Split-rail cedar safety barriers complete the span. The mountain crevasse is officially bridged."
        }
      ]
    }
  ],

  desert_town: [
    {
      episode: 1,
      title: "Grading the Desert Route & Interlocking Pavements",
      subtitle_2word: "DESERT ROADS",
      problem: "Loose shifting red desert sand and dry tumbleweeds make travel impossible.",
      solution: "Clear shifting sand dunes, grade the clay base, and install interlocking desert adobe pavers.",
      structures_added: "Interlocking terracotta stone desert road with sandstone drainage trenches",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Brushing away dry red sand drifts and clearing brittle desert scrub with clearing rakes",
          tool: "sand broom and clearing rake",
          asmr_type: "grass_trimming",
          narration: "Deep in the arid desert, we brush back loose red dunes to expose the dense underlying clay hardpan."
        },
        {
          stage_num: 2,
          action: "Carving neat sandstone drainage channels with a heavy triangular clay grading tool",
          tool: "grading scraper and trenching tool",
          asmr_type: "dirt_scraping",
          narration: "Even in the desert, flash floods happen. We carve deep roadside drainage swales into the clay."
        },
        {
          stage_num: 3,
          action: "Laying a stabilizing clay slip foundation using a broad wooden leveling board",
          tool: "leveling board and trowel",
          asmr_type: "cement_troweling",
          narration: "A stabilizing clay slip is spread evenly across the roadbed to prevent sand seepage."
        },
        {
          stage_num: 4,
          action: "Placing fired terracotta cobblestone pavers in an interlocking herringbone pattern with paver clamps",
          tool: "paver clamps and rubber mallet",
          asmr_type: "brick_tapping",
          narration: "Fired terracotta pavers are laid in an interlocking herringbone pattern, designed to resist scorching desert heat."
        },
        {
          stage_num: 5,
          action: "Sweeping fine golden silica sand into the paver joints with a heavy joint-sand broom",
          tool: "joint-sand broom",
          asmr_type: "dirt_scraping",
          narration: "Fine golden silica sand is swept between the joints, locking the pavers into a permanent desert highway."
        }
      ]
    },
    {
      episode: 2,
      title: "Drilling the Artesian Well & Water Cistern",
      subtitle_2word: "WATER CISTERN",
      problem: "The desert outpost cannot survive without a secure deep underground water supply.",
      solution: "Drill a deep artesian borehole and construct a traditional stone masonry cistern.",
      structures_added: "Deep masonry stone water well with brass hand pump and elevated stone cistern tank",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Drilling a circular borehole deep into the dense clay ground using a heavy manual auger drill",
          tool: "manual auger drill",
          asmr_type: "dirt_scraping",
          narration: "We sink a heavy auger into the desert clay, drilling deep down to reach the underground aquifer."
        },
        {
          stage_num: 2,
          action: "Inserting a slotted steel well casing sleeve into the drilled shaft using alignment clamps",
          tool: "alignment clamps",
          asmr_type: "wire_tweezing",
          narration: "A slotted steel casing is slipped into the borehole to prevent sand collapse."
        },
        {
          stage_num: 3,
          action: "Building a circular red sandstone wellhead using shaped masonry stones and wet mortar",
          tool: "masonry trowel and stone hammer",
          asmr_type: "brick_tapping",
          narration: "Using shaped masonry blocks, we build a circular stone wellhead with authentic lime mortar."
        },
        {
          stage_num: 4,
          action: "Assembling the weathered timber A-frame hoist and heavy copper bucket with steel chain",
          tool: "rigging hardware and pliers",
          asmr_type: "wood_cutting",
          narration: "A handcrafted wooden hoist frame and copper bucket are suspended over the well shaft."
        },
        {
          stage_num: 5,
          action: "Testing the hand pump and filling the well bucket with fresh clear water from the aquifer",
          tool: "bucket line and clean water pour",
          asmr_type: "wire_tweezing",
          narration: "Fresh clear water fills the bucket. Our desert outpost now possesses life-giving water."
        }
      ]
    }
  ]
};

/**
 * Builds the exact prompt for Gemini 2.5 Flash to plan the next episode
 */
function buildGeminiPrompt(townKey, townMemory, nextEpisode) {
  const builtList = townMemory.built_structures && townMemory.built_structures.length > 0 
    ? townMemory.built_structures.join(", ") 
    : "Virgin ground on building site";

  return `You are the Lead Civil Engineer and Director of Real-World Construction Process Videos for high-engagement YouTube Shorts and Reels.
Project: "${townMemory.name}" (${townKey})
Current Episode: ${nextEpisode}
Active Building Worksite: "${townMemory.diorama_anchor_prompt}"
Previously Built Structures on Site: "${builtList}"
Active Multi-Part Project: ${JSON.stringify(townMemory.active_multipart)}

YOUR MISSION:
Plan Episode ${nextEpisode} as a seamless, authentic step-by-step real-world construction / building process video.
The camera is locked at a professional documentary eye-level or 45-degree angle (Sony FX6 4K) capturing the active building structure and worksite.
The project builds progressively in realistic stages without jumping to unrelated buildings or conflicting structures.

STRICT REQUIREMENTS (ZERO TOY / DIORAMA / MINIATURE FRAMING):
1. FORBIDDEN WORDS: NEVER use the words "miniature", "diorama", "scale model", "1:87", "HO-scale", "cutting mat", "tweezers", "toy", "tabletop", "workbench", "micro".
2. Real-World Construction: Frame every stage around authentic construction and craftsman work—real hands using real workshop and construction tools on physical materials (concrete, steel, timber, stone, asphalt).
3. Story & Structure Continuity: Every stage of the episode must stay strictly focused on the exact same structure and its progressive assembly (e.g., if building a petrol station, every stage is on that fueling island and canopy).
4. Craftsman Hands: Incorporate skilled adult craftsman worker hands with natural skin texture, subtle dried cement/stone dust, rolled dark denim work sleeves, bare wrists with NO jewelry or watches, gripping heavy-duty construction tools.
5. Narration: 1-2 calm, grounded, documentary-style US English sentences per stage describing the engineering and physical construction step. No miniature/toy references.
6. ASMR Foley type: Select from ["dirt_scraping", "cement_troweling", "brick_tapping", "spray_painting", "gravel_rolling", "wood_cutting"].
7. Thumbnail Subtitle: Exactly 2 bold uppercase words representing the real structure (e.g. "PETROL STATION", "STORM DRAINAGE", "ROAD REPAIR", "FUEL VAULT").

OUTPUT REQUIREMENT:
Output ONLY valid JSON matching this exact structure:
{
  "episode": ${nextEpisode},
  "title": "Title of the Episode",
  "subtitle_2word": "TWO WORDS",
  "problem": "Realistic civil engineering or construction problem",
  "solution": "Clear practical building/engineering solution",
  "is_multipart": false,
  "multipart_info": null,
  "updated_anchor_prompt": "Updated comprehensive visual description of the worksite including this new build",
  "structures_added": "Name of new structure(s) permanently added to the site",
  "stages": [
    {
      "stage_num": 1,
      "title": "Short title",
      "action": "What the craftsman hands are doing",
      "tool": "Construction tool held",
      "image_prompt": "Complete photorealistic construction prompt for Stage 1",
      "motion_prompt": "Smooth continuous motion description for video transition from Stage 1 to Stage 2",
      "asmr_type": "cement_troweling",
      "narration": "Grounded documentary voiceover script for Stage 1"
    },
    ... (stages 2, 3, 4, 5)
  ]
}`;
}

/**
 * Call Gemini REST API with clean diagnostics for both ?key= and x-goog-api-key header
 */
async function callGemini(prompt, apiKey) {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastDiagnosis = null;

  for (const model of models) {
    // Strategy A: x-goog-api-key header (standard Google Cloud / AI Studio REST header)
    try {
      const urlHeader = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      console.log(`[Architect] Calling Gemini ${model} via x-goog-api-key header...`);
      const resHeader = await fetch(urlHeader, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            responseMimeType: "application/json"
          }
        })
      });

      if (resHeader.ok) {
        const data = await resHeader.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText.trim());
          if (parsed.stages && parsed.stages.length === 5) {
            console.log(`[Architect] Gemini ${model} call SUCCEEDED via x-goog-api-key header!`);
            return parsed;
          }
        }
      } else {
        const errText = await resHeader.text();
        lastDiagnosis = `HTTP ${resHeader.status} (${resHeader.statusText}): ${errText.slice(0, 250)}`;
        console.warn(`[Architect] Gemini (${model} header) returned ${lastDiagnosis}`);
      }
    } catch (e) {
      lastDiagnosis = e.message;
    }

    // Strategy B: URL Query Parameter ?key=
    try {
      const urlQuery = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      console.log(`[Architect] Calling Gemini ${model} via URL query parameter...`);
      const resQuery = await fetch(urlQuery, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            responseMimeType: "application/json"
          }
        })
      });

      if (resQuery.ok) {
        const data = await resQuery.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText.trim());
          if (parsed.stages && parsed.stages.length === 5) {
            console.log(`[Architect] Gemini ${model} call SUCCEEDED via ?key= parameter!`);
            return parsed;
          }
        }
      } else {
        const errText = await resQuery.text();
        lastDiagnosis = `HTTP ${resQuery.status} (${resQuery.statusText}): ${errText.slice(0, 250)}`;
        console.warn(`[Architect] Gemini (${model} query) returned ${lastDiagnosis}`);
      }
    } catch (e) {
      lastDiagnosis = e.message;
    }
  }

  throw new Error(`Gemini API Authentication Diagnosis: ${lastDiagnosis}`);
}

/**
 * Procedural Fallback Architect when offline or Gemini API key hits error/quota
 */
function generateProceduralPlan(townKey, townMemory, nextEpisode) {
  const blueprints = PROCEDURAL_BLUEPRINTS[townKey] || PROCEDURAL_BLUEPRINTS.smart_city;
  const blueprintIndex = (nextEpisode - 1) % blueprints.length;
  const baseBlueprint = blueprints[blueprintIndex];

  const episodeTitle = nextEpisode <= blueprints.length 
    ? baseBlueprint.title 
    : `Expansion Phase ${nextEpisode}: ${baseBlueprint.title}`;

  const builtSoFar = townMemory.built_structures && townMemory.built_structures.length > 0
    ? `Visible on site: ${townMemory.built_structures.join("; ")}.`
    : "Virgin ground on building site.";

  const updatedAnchor = `${townMemory.diorama_anchor_prompt} ${builtSoFar} Completed addition: ${baseBlueprint.structures_added}.`;

  const stages = baseBlueprint.stages.map((stage, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === 4;
    
    // Authentic real-world construction process prompt (zero diorama/toy/cutting mat framing)
    const actionDesc = stage.action.toLowerCase();
    const imagePrompt = `Stage ${stage.stage_num}/5 of ${baseBlueprint.title}: Authentic real-world construction process showing skilled adult craftsman worker hands actively using ${stage.tool} while ${actionDesc} on the active building worksite. Crisp work-in-progress construction angle showing the structure under assembly: ${stage.action}, surrounded by authentic building materials, leveled ground foundation, and genuine structural elements of the site. Natural daylight and workshop lighting, locked cinema camera angle on a Sony FX6, razor-sharp focus on the physical build and materials, authentic construction craftsmanship, 8k resolution, highly detailed realistic construction.`;

    const nextActionDesc = !isLast ? baseBlueprint.stages[idx + 1].action.toLowerCase() : "inspecting and finalizing the completed structure";
    const motionPrompt = `Cinematic real-world construction process video: Smooth, steady motorized camera glide across the active construction site. Skilled craftsman hands steadily use ${stage.tool} while ${actionDesc}, progressing cleanly toward ${nextActionDesc}. Continuous physical construction motion, authentic building craftsmanship, steady cinema tracking, zero jitter, 30fps.`;

    return {
      stage_num: stage.stage_num,
      title: `Stage ${stage.stage_num}: ${stage.action.split(' ')[0]}`,
      action: stage.action,
      tool: stage.tool,
      image_prompt: imagePrompt,
      motion_prompt: motionPrompt,
      asmr_type: stage.asmr_type,
      narration: stage.narration
    };
  });

  return {
    episode: nextEpisode,
    title: episodeTitle,
    subtitle_2word: baseBlueprint.subtitle_2word,
    problem: baseBlueprint.problem,
    solution: baseBlueprint.solution,
    is_multipart: baseBlueprint.is_multipart || false,
    multipart_info: baseBlueprint.multipart_info || null,
    updated_anchor_prompt: updatedAnchor,
    structures_added: baseBlueprint.structures_added,
    stages: stages
  };
}

/**
 * Main Architect Plan Generator
 */
async function planEpisode(townKey, townMemory, forcedEpisode = null) {
  const currentEp = typeof forcedEpisode === 'number' ? forcedEpisode - 1 : (townMemory.episode || 0);
  const nextEpisode = currentEp + 1;

  console.log(`[Architect] Planning Episode ${nextEpisode} for project: "${townKey}" (${townMemory.name})`);

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 5) {
    try {
      console.log(`[Architect] Contacting Gemini 2.5 Flash API (Key prefix: ${apiKey.slice(0, 8)}...)...`);
      const prompt = buildGeminiPrompt(townKey, townMemory, nextEpisode);
      const plan = await callGemini(prompt, apiKey);
      console.log(`[Architect] Successfully generated episode plan via Gemini: "${plan.title}"`);
      return plan;
    } catch (err) {
      console.warn(`[Architect] Gemini Notice: ${err.message}. Engaging continuous civil-engineering scenario generator.`);
    }
  } else {
    console.log(`[Architect] GEMINI_API_KEY not provided. Using continuous civil-engineering scenario generator.`);
  }

  const plan = generateProceduralPlan(townKey, townMemory, nextEpisode);
  console.log(`[Architect] Scenario Plan Engaged: Episode ${plan.episode} - "${plan.title}" [${plan.subtitle_2word}] (5 stages)`);
  return plan;
}

module.exports = {
  planEpisode,
  CRAFTSMAN_HANDS_DESCRIPTION,
  CAMERA_BASE_PROMPT,
  PROCEDURAL_BLUEPRINTS
};
