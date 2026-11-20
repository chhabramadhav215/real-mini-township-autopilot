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
          narration: "This raw corridor was completely blocked by stubborn roots and rocks. Watch us carve the avenue."
        },
        {
          stage_num: 2,
          action: "Screeding and packing the dense subsoil using a heavy aluminum leveling bar",
          tool: "heavy aluminum screed bar",
          asmr_type: "dirt_scraping",
          narration: "An aluminum screed slices through the subsoil, locking down a dead-flat foundation."
        },
        {
          stage_num: 3,
          action: "Troweling fresh dark bitumen asphalt compound into the center road channel",
          tool: "pointed stainless steel trowel",
          asmr_type: "cement_troweling",
          narration: "Hot black bitumen asphalt is troweled seam-to-seam into the roadway channel."
        },
        {
          stage_num: 4,
          action: "Rolling the fresh asphalt with a heavy steel compactor roller to achieve a smooth durable pavement",
          tool: "heavy steel compactor roller",
          asmr_type: "gravel_rolling",
          narration: "A heavy steel compactor compresses the aggregate tight, forging a rock-solid road surface."
        },
        {
          stage_num: 5,
          action: "Spraying crisp white highway centerlines using a precision line-marking sprayer and steel guide",
          tool: "precision line-marking sprayer and steel stencil",
          asmr_type: "spray_painting",
          narration: "Crisp white dividers sprayed on! From wild overgrowth to a pristine modern boulevard."
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
          narration: "Monsoon floods used to completely drown this avenue. Today, that stops."
        },
        {
          stage_num: 2,
          action: "Bedding the trenches with fine aggregate pea gravel using a utility scoop and tamper",
          tool: "utility scoop and tamper",
          asmr_type: "gravel_rolling",
          narration: "Deep utility trenches are carved along the curbs and bedded with fine pea gravel."
        },
        {
          stage_num: 3,
          action: "Lowering slotted reinforced concrete drainage pipes into the trench using steel alignment tongs",
          tool: "steel alignment tongs",
          asmr_type: "wire_tweezing",
          narration: "Reinforced concrete stormwater box culverts are lowered and aligned tight."
        },
        {
          stage_num: 4,
          action: "Applying fast-setting hydraulic mortar around the pipe joints with a dispensing nozzle and trowel",
          tool: "mortar dispensing nozzle and trowel",
          asmr_type: "cement_troweling",
          narration: "High-strength hydraulic mortar seals every collar, locking out subterranean leaks."
        },
        {
          stage_num: 5,
          action: "Seating heavy cast iron storm drain grates flush with the roadway curb using a setting mallet",
          tool: "setting mallet and pry bar",
          asmr_type: "brick_tapping",
          narration: "Cast iron grates tapped flush into the curbs. Avenue One is officially flood-proof!"
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
          narration: "A heavy truck smashed a dangerous crater into Avenue One. Can we fix it permanently?"
        },
        {
          stage_num: 2,
          action: "Chiseling out the fractured asphalt sub-base using a cold chisel and steel mallet",
          tool: "cold chisel and steel mallet",
          asmr_type: "brick_tapping",
          narration: "A diamond saw cuts clean boundary lines before we chisel out the fractured base."
        },
        {
          stage_num: 3,
          action: "Brushing on a rich black bitumen tack coat primer with a horsehair applicator brush",
          tool: "tack coat applicator brush",
          asmr_type: "cement_troweling",
          narration: "Hot bitumen tack coat is brushed on, creating a powerful watertight adhesive bond."
        },
        {
          stage_num: 4,
          action: "Troweling fresh hot-mix asphalt paste into the patch and leveling with an aluminum screed",
          tool: "steel trowel and heavy tamper",
          asmr_type: "cement_troweling",
          narration: "Dense asphalt compound is packed in tight, eliminating all future settling."
        },
        {
          stage_num: 5,
          action: "Compacting the patch with a heavy steel roller and applying rubberized crack sealant along the seams",
          tool: "heavy hand roller and sealant gun",
          asmr_type: "gravel_rolling",
          narration: "Rolled glass-smooth and sealed! You can't even tell there was a crater here."
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
          narration: "Buried beneath this street lies a heavy-duty fuel vault. Watch how deep we go."
        },
        {
          stage_num: 2,
          action: "Erecting corrugated steel sheet-pile shoring walls to secure the excavation pit perimeter",
          tool: "clamping tongs and mallet",
          asmr_type: "wire_tweezing",
          narration: "Interlocking steel shoring piles are driven into the perimeter, preventing trench collapse."
        },
        {
          stage_num: 3,
          action: "Pouring a self-leveling reinforced concrete foundation slab at the base of the vault",
          tool: "concrete trowel and dispensing nozzle",
          asmr_type: "cement_troweling",
          narration: "A reinforced concrete anchor slab is poured to cradle the massive fuel cylinders."
        },
        {
          stage_num: 4,
          action: "Lowering twin heavy cylindrical underground fuel storage tanks onto the concrete cradle",
          tool: "heavy rigging straps and placement grips",
          asmr_type: "wire_tweezing",
          narration: "Heavy containment tanks are lowered into place and anchored into the saddles."
        },
        {
          stage_num: 5,
          action: "Backfilling the tank vault with clean quartz silica sand up to the roadway subgrade level",
          tool: "sand scoop and leveling tamper",
          asmr_type: "gravel_rolling",
          narration: "Silica sand backfills the pit level with the road. The underground vault is secured!"
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
          narration: "The underground fuel vault is ready. Now comes the danger zone: the live fueling island."
        },
        {
          stage_num: 2,
          action: "Mounting and bolting two commercial fuel dispenser pump units onto the cured concrete island",
          tool: "socket wrench and alignment level",
          asmr_type: "brick_tapping",
          narration: "We form and trowel a raised reinforced concrete island apron directly above the vault."
        },
        {
          stage_num: 3,
          action: "Erecting structural steel cantilever canopy columns and cross-beams directly over the concrete fueling island",
          tool: "steel erection wrench and torque tool",
          asmr_type: "brick_tapping",
          narration: "Two commercial fuel dispensers are bolted down and piped into the fuel lines."
        },
        {
          stage_num: 4,
          action: "Installing the protective weather canopy deck and fascia panels directly across the steel canopy frame over the dispensers",
          tool: "fastener driver and alignment clamps",
          asmr_type: "wood_cutting",
          narration: "Heavy structural steel columns and weather canopy panels are hoisted into position."
        },
        {
          stage_num: 5,
          action: "Bolting yellow steel impact protection bollards and painting safety chevron bay markings around the fueling island",
          tool: "line-marking sprayer and stencil",
          asmr_type: "spray_painting",
          narration: "Impact bollards bolted and safety chevron lines painted. The fuel station is fully open!"
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
          narration: "At night, Avenue One was pitch black and dangerous. Watch us light it up."
        },
        {
          stage_num: 2,
          action: "Threading insulated copper electrical conduit through the underground curb raceway",
          tool: "wire strippers and needle-nose pliers",
          asmr_type: "wire_tweezing",
          narration: "Heavy hammer drills bore precision anchor sockets through the concrete curbs."
        },
        {
          stage_num: 3,
          action: "Lowering curved stainless steel lamp posts into each pre-drilled anchor socket with setting clamps",
          tool: "setting clamp and alignment level",
          asmr_type: "brick_tapping",
          narration: "Insulated copper electrical lines are routed through subterranean raceways."
        },
        {
          stage_num: 4,
          action: "Affixing photovoltaic solar panels and high-efficiency luminaire heads to the post crests",
          tool: "hex driver and fastener tool",
          asmr_type: "wire_tweezing",
          narration: "Curved stainless steel lamp posts are hoisted, aligned, and crowned with solar collectors."
        },
        {
          stage_num: 5,
          action: "Powering on the LED warm-white luminaires to cast clean light pools across the asphalt",
          tool: "electrical testing meter and switch",
          asmr_type: "spray_painting",
          narration: "Power connected! Clean LED light floods the asphalt, turning dark into day."
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
          narration: "Jagged rocks and steep cliffs blocked all access to the village. Watch us carve the road."
        },
        {
          stage_num: 2,
          action: "Scraping and leveling uneven mountain dirt with a steel grading rake and heavy tamper",
          tool: "grading rake and tamper",
          asmr_type: "dirt_scraping",
          narration: "We shear away thick wild roots and grade the steep alpine slope down to bedrock."
        },
        {
          stage_num: 3,
          action: "Spreading coarse grey crushed granite stone along the cleared route with a steel spreader",
          tool: "steel trowel and spreader",
          asmr_type: "gravel_rolling",
          narration: "A thick layer of coarse crushed granite stone is spread along the graded trail."
        },
        {
          stage_num: 4,
          action: "Compacting and rolling the granite gravel firmly using a heavy steel compaction roller",
          tool: "heavy compaction roller",
          asmr_type: "gravel_rolling",
          narration: "A heavy compaction roller compresses the gravel into a dense, storm-proof foundation."
        },
        {
          stage_num: 5,
          action: "Setting heavy granite curbstones along the finished trail using stone setting clamps and a mallet",
          tool: "stone setting clamps and mallet",
          asmr_type: "brick_tapping",
          narration: "Granite curbstones locked in place. From impassable cliffside to a finished mountain highway!"
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
          narration: "One heavy rain and this entire slope would bury the village road. Watch this defense."
        },
        {
          stage_num: 2,
          action: "Setting heavy granite foundation stones flat into the footing using setting tongs",
          tool: "stone setting tongs",
          asmr_type: "brick_tapping",
          narration: "A stepped foundation shelf is notched into the hillside dirt and anchored with granite."
        },
        {
          stage_num: 3,
          action: "Dry-stacking courses of fractured natural slate stones with interlocking staggered joints",
          tool: "stonemason hammer and chisel",
          asmr_type: "brick_tapping",
          narration: "Natural slate blocks are dry-stacked with interlocking joints, releasing water pressure."
        },
        {
          stage_num: 4,
          action: "Backfilling behind the slate wall with crushed alpine drainage gravel using a utility scoop",
          tool: "drainage gravel scoop",
          asmr_type: "gravel_rolling",
          narration: "Crushed drainage gravel is backfilled behind the wall for continuous water runoff."
        },
        {
          stage_num: 5,
          action: "Setting wide flat capstones along the wall crest and pointing joints with a setting mallet",
          tool: "masonry trowel and setting mallet",
          asmr_type: "grass_trimming",
          narration: "Wide capstones tapped tight. This massive retaining wall will hold the mountain for centuries!"
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
          narration: "A 50-foot gorge cut off the village from the forest. Watch us build a bridge across it."
        },
        {
          stage_num: 2,
          action: "Assembling A-frame timber bent supports using hand-notched pine beams and framing clamps",
          tool: "heavy timber clamps and framing square",
          asmr_type: "wood_cutting",
          narration: "Level masonry abutment seats are carved directly into the opposing cliff faces."
        },
        {
          stage_num: 3,
          action: "Spanning heavy pine log stringers across the ravine gap onto the abutments with timber tongs",
          tool: "timber tongs and drift pin hammer",
          asmr_type: "wood_cutting",
          narration: "Hand-notched pine A-frames and massive log stringers span the divide."
        },
        {
          stage_num: 4,
          action: "Laying individual rough-sawn timber road decking planks one by one across the stringers",
          tool: "framing hammer and timber fasteners",
          asmr_type: "brick_tapping",
          narration: "Rough-sawn timber decking planks are hammered crosswise across the frame."
        },
        {
          stage_num: 5,
          action: "Installing weathered split-rail cedar guardrails along both sides of the bridge span",
          tool: "fastener driver and brackets",
          asmr_type: "wood_cutting",
          narration: "Split-rail cedar guardrails secured. The gorge is conquered!"
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
          narration: "Shifting sand dunes swallowed every vehicle in this desert. Watch us pave it forever."
        },
        {
          stage_num: 2,
          action: "Carving neat sandstone drainage channels with a heavy triangular clay grading tool",
          tool: "grading scraper and trenching tool",
          asmr_type: "dirt_scraping",
          narration: "We clear loose dunes down to clay hardpan and carve deep roadside drainage swales."
        },
        {
          stage_num: 3,
          action: "Laying a stabilizing clay slip foundation using a broad wooden leveling board",
          tool: "leveling board and trowel",
          asmr_type: "cement_troweling",
          narration: "Stabilizing clay slip is spread smooth, locking the desert earth in place."
        },
        {
          stage_num: 4,
          action: "Placing fired terracotta cobblestone pavers in an interlocking herringbone pattern with paver clamps",
          tool: "paver clamps and rubber mallet",
          asmr_type: "brick_tapping",
          narration: "Fired terracotta cobblestone pavers are laid in an interlocking herringbone grid."
        },
        {
          stage_num: 5,
          action: "Sweeping fine golden silica sand into the paver joints with a heavy joint-sand broom",
          tool: "joint-sand broom",
          asmr_type: "dirt_scraping",
          narration: "Golden silica sand swept into the joints. A permanent highway through the burning dunes!"
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
          narration: "In a desert with zero rainfall, survival means hitting the aquifer. Watch how deep we drill."
        },
        {
          stage_num: 2,
          action: "Inserting a slotted steel well casing sleeve into the drilled shaft using alignment clamps",
          tool: "alignment clamps",
          asmr_type: "wire_tweezing",
          narration: "A manual auger bores deep into the clay, driving a slotted steel casing to prevent collapse."
        },
        {
          stage_num: 3,
          action: "Building a circular red sandstone wellhead using shaped masonry stones and wet mortar",
          tool: "masonry trowel and stone hammer",
          asmr_type: "brick_tapping",
          narration: "A circular sandstone wellhead is built course by course with authentic lime mortar."
        },
        {
          stage_num: 4,
          action: "Assembling the weathered timber A-frame hoist and heavy copper bucket with steel chain",
          tool: "rigging hardware and pliers",
          asmr_type: "wood_cutting",
          narration: "A timber A-frame hoist and heavy copper bucket are rigged over the shaft."
        },
        {
          stage_num: 5,
          action: "Testing the hand pump and filling the well bucket with fresh clear water from the aquifer",
          tool: "bucket line and clean water pour",
          asmr_type: "wire_tweezing",
          narration: "The hand pump is primed—and crystal clear water flows from the desert aquifer!"
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
5. HIGH-RETENTION STORYTELLING ARC (0-3s Hook -> Build -> Transformation Payoff):
   - Stage 1 (0-3s HOOK): High-stakes, scroll-stopping hook stating the raw challenge/curiosity ("This impassable clay was completely blocked by stubborn roots. Watch us carve the avenue.").
   - Stage 2 (BUILD 1 - The Breakthrough): Rapid momentum, slicing into bedrock or foundational excavation ("An aluminum screed slices through the subsoil, locking down a dead-flat foundation.").
   - Stage 3 (BUILD 2 - Core Engineering): Tension and precision, assembling the structural core ("Next, hot black bitumen asphalt is troweled seam-to-seam with extreme precision.").
   - Stage 4 (BUILD 3 - Final Assembly): Rapid convergence, sealing and weather-proofing ("A steel roller compresses the aggregate tight, forging a rock-solid road surface.").
   - Stage 5 (TRANSFORMATION PAYOFF): Triumphant climax celebrating the finished build and dramatic before-vs-after contrast ("Crisp white dividers sprayed on! From wild overgrowth to a pristine modern boulevard.").
   - Narration Pacing: Exactly 1 punchy, energetic sentence per stage (10-15 words). Active verbs, high engagement, zero dry lectures.
6. VISUAL VARIETY ACROSS 5 STAGES:
   - Stage 1: Wide establishing shot with dramatic morning sunlight / worksite challenge.
   - Stage 2: Dynamic low-angle motorized tracking shot following active equipment.
   - Stage 3: Extreme razor-sharp close-up macro detail of material bonding and tool alignment with shallow depth of field.
   - Stage 4: Medium fast-action construction perspective showing structural components locking into place.
   - Stage 5: Grand cinematic pull-back reveal under warm golden-hour glow showcasing the completed, pristine transformed structure!
7. ASMR Foley type: Select from ["dirt_scraping", "cement_troweling", "brick_tapping", "spray_painting", "gravel_rolling", "wood_cutting"].
8. Thumbnail Subtitle: Exactly 2 bold uppercase words representing the real structure (e.g. "PETROL STATION", "STORM DRAINAGE", "ROAD REPAIR", "FUEL VAULT").

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
    
    // Dynamic camera angle & lighting progression across cuts
    let angleStyle = "Wide-to-medium documentary construction angle";
    let lightingStyle = "natural daylight and clean worksite lighting";
    let motionCamera = "Smooth, steady motorized camera glide";
    
    if (stage.stage_num === 1) {
      angleStyle = "Wide establishing construction angle showing the full raw site challenge";
      lightingStyle = "crisp morning directional sunlight with rich long shadows";
      motionCamera = "Dramatic establishing push-in and upward tilt";
    } else if (stage.stage_num === 2) {
      angleStyle = "Dynamic low-angle motorized tracking shot capturing rapid subsoil progress";
      lightingStyle = "bright clear daytime construction lighting";
      motionCamera = "Smooth low-angle lateral tracking dolly glide";
    } else if (stage.stage_num === 3) {
      angleStyle = "Razor-sharp macro close-up detail angle with shallow cinematic depth of field focusing on material bonding";
      lightingStyle = "high-contrast directional architectural lighting highlighting physical textures";
      motionCamera = "Precise macro push-in and diagonal tracking glide";
    } else if (stage.stage_num === 4) {
      angleStyle = "Medium fast-action construction perspective showing structural components converging into place";
      lightingStyle = "natural afternoon documentary worksite lighting";
      motionCamera = "Dynamic lateral sweep tracking active assembly";
    } else {
      angleStyle = "Grand cinematic wide pull-back reveal showcasing the complete, pristine transformed structure";
      lightingStyle = "dramatic warm golden-hour glow casting rich highlights across the finished build";
      motionCamera = "Majestic sweeping pull-back and elevation reveal";
    }

    // Authentic real-world construction process prompt (zero diorama/toy/cutting mat framing)
    const actionDesc = stage.action.toLowerCase();
    const imagePrompt = `Stage ${stage.stage_num}/5 of ${baseBlueprint.title}: Authentic real-world civil engineering worksite photography showing ${stage.action} with ${stage.tool}. ${angleStyle} showing the structure under assembly: ${stage.action}, surrounded by authentic building materials, leveled ground foundation, and genuine structural elements of the site. ${lightingStyle}, cinema camera angle on a Sony FX6, razor-sharp focus on the physical build and materials, authentic engineering craftsmanship, 8k resolution, highly detailed realistic construction.`;

    const nextActionDesc = !isLast ? baseBlueprint.stages[idx + 1].action.toLowerCase() : "inspecting and celebrating the completed transformation";
    const motionPrompt = `Cinematic real-world construction process video: ${motionCamera} across the active construction site. Professional camera tracks ${stage.action} with ${stage.tool}, progressing cleanly toward ${nextActionDesc}. Continuous physical construction motion, authentic building craftsmanship, steady cinema tracking, zero jitter, 30fps.`;

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
