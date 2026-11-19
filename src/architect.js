const fs = require('fs');
const path = require('path');

/**
 * Town Architect Engine (Gemini 2.5 Flash Free API + Multi-Episode Civil Engineering Blueprints)
 * Generates continuous 5-stage progressive diorama construction plans with locked continuity.
 */

const CRAFTSMAN_HANDS_DESCRIPTION = 
  "Real adult male craftsman hands with visible skin pores, subtle dried cement and soil dust on knuckles, rolled-up dark denim work sleeves, and a matte silver wristwatch";

const CAMERA_BASE_PROMPT = 
  "Extreme macro 45-degree isometric tilt-shift photography on a Sony A7RV 90mm f/2.8 lens, 8k resolution, razor-sharp focus on the center miniature build, soft creamy bokeh workbench background, locked tripod perspective, consistent directional 5500K workshop lighting";

// Comprehensive catalog of realistic civil-engineering scenarios for all 3 series
const PROCEDURAL_BLUEPRINTS = {
  smart_city: [
    {
      episode: 1,
      title: "Clearing the Untouched Tabletop for the Metropolis",
      subtitle_2word: "METRO GROUND",
      problem: "Uneven raw dark loam and wild weeds cover the urban tabletop grid.",
      solution: "Clear the weed brush, level the high-density soil, and pave the dual-lane main boulevard.",
      structures_added: "Compacted dual-lane asphalt boulevard with concrete curbs and painted lane markers",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Trimming wild sprouting weed clumps from the dark tabletop loam using precision wire nippers",
          tool: "micro wire nippers and tweezers",
          asmr_type: "grass_trimming",
          narration: "Before our smart metropolis can rise, we clear the virgin tabletop soil of wild weed sprouts."
        },
        {
          stage_num: 2,
          action: "Screeding and packing ultra-fine dark urban subsoil using an aluminum leveling bar",
          tool: "miniature aluminum screed bar",
          asmr_type: "dirt_scraping",
          narration: "A miniature aluminum screed glides across the soil, creating a perfectly laser-flat civil foundation."
        },
        {
          stage_num: 3,
          action: "Troweling genuine dark bitumen asphalt paste into the center boulevard channel",
          tool: "miniature stainless steel trowel",
          asmr_type: "cement_troweling",
          narration: "Real asphalt emulsion paste is troweled into the boulevard corridor with surgical precision."
        },
        {
          stage_num: 4,
          action: "Rolling the fresh asphalt with a heavy brass steamroller drum to achieve true matte pavement texture",
          tool: "solid brass miniature roller",
          asmr_type: "gravel_rolling",
          narration: "A solid brass roller presses the aggregate tight, mimicking the smooth texture of real city asphalt."
        },
        {
          stage_num: 5,
          action: "Spraying crisp white highway centerlines using a precision airbrush and micro brass stencil",
          tool: "micro airbrush and brass stencil",
          asmr_type: "spray_painting",
          narration: "Using a micro airbrush and brass stencil, crisp highway dividers appear. Avenue One is officially open."
        }
      ]
    },
    {
      episode: 2,
      title: "Installing Subterranean Drainage Culverts & Sump Basins",
      subtitle_2word: "STORM DRAINAGE",
      problem: "Heavy urban runoff during monsoon season causes localized flooding on Avenue One.",
      solution: "Excavate deep roadside drainage channels, install slotted concrete box culverts, and drop in laser-cut brass catch basins.",
      structures_added: "Subterranean concrete stormwater drainage culverts and cast-iron style catch basins",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Excavating parallel drainage trenches along both curbs of the asphalt avenue using a micro trenching spade",
          tool: "miniature stainless trenching spade",
          asmr_type: "dirt_scraping",
          narration: "To prevent stormwater accumulation, we cut deep roadside utility trenches on both sides of Avenue One."
        },
        {
          stage_num: 2,
          action: "Bedding the trenches with fine aggregate pea gravel using a miniature brass scoop",
          tool: "miniature brass scoop and tamp",
          asmr_type: "gravel_rolling",
          narration: "A clean bed of graded pea gravel provides a self-draining foundation beneath the culvert pipes."
        },
        {
          stage_num: 3,
          action: "Lowering slotted miniature concrete drainage pipes into the trench using precision watchmaker tweezers",
          tool: "precision watchmaker tweezers",
          asmr_type: "wire_tweezing",
          narration: "Using precision tweezers, pre-cast concrete stormwater conduits are lowered and joined seam to seam."
        },
        {
          stage_num: 4,
          action: "Pouring fast-setting micro mortar around the pipe joints with an adhesive syringe",
          tool: "micro mortar syringe and trowel",
          asmr_type: "cement_troweling",
          narration: "High-strength mortar seals every pipe collar to ensure a flood-proof underground hydraulic network."
        },
        {
          stage_num: 5,
          action: "Seating photo-etched brass storm drain grates flush with the roadway curb",
          tool: "fine tweezers and silicone mallet",
          asmr_type: "brick_tapping",
          narration: "Finally, photo-etched brass catch-basin grates are tapped flush into the curbs, completing the city drainage system."
        }
      ]
    },
    {
      episode: 3,
      title: "Pothole Emergency Repair & Bitumen Seal Coating",
      subtitle_2word: "ROAD REPAIR",
      problem: "Heavy scale-truck traffic created an uneven fissure and pothole on Avenue One.",
      solution: "Saw-cut the damaged asphalt perimeter, excavate loose base material, compact new binder, and hot-pour bitumen sealant.",
      structures_added: "Repaved asphalt patch with tar-sealed perimeter seams and high-visibility road work cones",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Scoring a clean rectangular repair perimeter around the damaged asphalt with a miniature diamond saw blade",
          tool: "miniature diamond scoring wheel",
          asmr_type: "wood_cutting",
          narration: "Proper civil repair starts with clean rectangular cut lines around the cracked roadway surface."
        },
        {
          stage_num: 2,
          action: "Chiseling out the fractured asphalt sub-base using a micro hardened steel chisel and hammer",
          tool: "miniature cold chisel and brass mallet",
          asmr_type: "brick_tapping",
          narration: "With a micro chisel and brass mallet, loose debris is chipped away down to the stable sub-grade."
        },
        {
          stage_num: 3,
          action: "Brushing on a sticky black tack coat primer with a miniature horsehair brush",
          tool: "fine horsehair applicator brush",
          asmr_type: "cement_troweling",
          narration: "A rich bitumen tack coat creates a watertight adhesive bond between the old road and new asphalt."
        },
        {
          stage_num: 4,
          action: "Troweling fresh hot-mix asphalt paste into the patch and leveling with an aluminum screed",
          tool: "miniature steel trowel and tamper",
          asmr_type: "cement_troweling",
          narration: "Fresh high-density asphalt compound is packed tightly into the void, eliminating any future subsidence."
        },
        {
          stage_num: 5,
          action: "Compacting the patch with a heavy brass roller and piping black rubberized crack sealant along the seams",
          tool: "solid brass hand roller and fine needle dispenser",
          asmr_type: "gravel_rolling",
          narration: "Rolled glass-smooth and sealed along the edges, the repaired lane is stronger than the day it was poured."
        }
      ]
    },
    {
      episode: 4,
      title: "Excavating Underground Fuel Storage Vaults (Part 1 of 2)",
      subtitle_2word: "FUEL VAULT",
      problem: "The city's emergency vehicles and construction machinery face a severe fuel distribution shortage.",
      solution: "Excavate a deep reinforced vault pit beside Avenue One and install dual subterranean fuel storage cylinders with leak barriers.",
      structures_added: "Deep reinforced concrete underground fuel containment vault with twin brass fuel cylinders",
      is_multipart: true,
      multipart_info: { part: 1, total_parts: 2, title: "Metropolis Fuel Depot & Charging Hub" },
      stages: [
        {
          stage_num: 1,
          action: "Marking out a 120mm rectangular pit and excavating deep soil alongside Avenue One with a miniature excavator shovel",
          tool: "miniature steel spade and scoop",
          asmr_type: "dirt_scraping",
          narration: "Part one of our fuel depot begins with deep subterranean excavation for hazardous liquid containment."
        },
        {
          stage_num: 2,
          action: "Erecting micro corrugated steel sheet-pile shoring walls to secure the excavation pit edges",
          tool: "precision tweezers and micro hammer",
          asmr_type: "wire_tweezing",
          narration: "Interlocking corrugated sheet piles are driven around the perimeter to prevent soil cave-in during deep work."
        },
        {
          stage_num: 3,
          action: "Pouring a self-leveling fast-cure concrete slab at the bottom of the vault",
          tool: "miniature concrete spatula and syringe",
          asmr_type: "cement_troweling",
          narration: "A reinforced concrete anchor pad is poured to hold the heavy fuel tanks firmly in place."
        },
        {
          stage_num: 4,
          action: "Lowering twin turned-brass underground fuel storage tanks onto the concrete cradle",
          tool: "precision watchmaker tweezers",
          asmr_type: "wire_tweezing",
          narration: "Machined brass fuel cylinders with detailed micro manhole covers are positioned in their concrete saddles."
        },
        {
          stage_num: 5,
          action: "Backfilling the tank vault with fine white quartz silica sand up to the roadway subgrade",
          tool: "miniature brass scoop and leveler",
          asmr_type: "gravel_rolling",
          narration: "Non-combustible quartz sand is packed around the tanks, completing the secure underground storage vault."
        }
      ]
    },
    {
      episode: 5,
      title: "Building the Twin-Pump Petrol Station & Neon Canopy (Part 2 of 2)",
      subtitle_2word: "PETROL DEPOT",
      problem: "The underground tanks are installed, but vehicles need a street-level pumping island and canopy shelter.",
      solution: "Pour the reinforced concrete island apron, erect a modern illuminated canopy structure, and install twin vintage fuel dispensers.",
      structures_added: "Modern street-level fuel station with illuminated canopy, twin chrome fuel dispensers, and safety bollards",
      is_multipart: true,
      multipart_info: { part: 2, total_parts: 2, title: "Metropolis Fuel Depot & Charging Hub" },
      stages: [
        {
          stage_num: 1,
          action: "Casting an elevated concrete fuel dispenser island apron with yellow safety curbs over the vault",
          tool: "miniature steel trowel",
          asmr_type: "cement_troweling",
          narration: "Part two begins by pouring the reinforced concrete pump island with safety-yellow curbed borders."
        },
        {
          stage_num: 2,
          action: "Mounting two detailed miniature chrome fuel dispenser pumps onto the island pad",
          tool: "precision watchmaker tweezers",
          asmr_type: "wire_tweezing",
          narration: "Two chrome fuel dispensers with miniature analog dial faces and flexible rubber hoses are fastened down."
        },
        {
          stage_num: 3,
          action: "Erecting a brushed aluminum cantilever canopy support column onto the concrete foundation",
          tool: "fine tweezers and micro hex wrench",
          asmr_type: "wire_tweezing",
          narration: "A structural steel canopy frame is bolted into place, engineered to shelter vehicles in all weather conditions."
        },
        {
          stage_num: 4,
          action: "Affixing a translucent blue illuminated canopy roof with micro solar panels on the crown",
          tool: "precision tweezers and UV cure lamp",
          asmr_type: "wood_cutting",
          narration: "A sleek blue acrylic canopy with miniature solar arrays is locked over the refueling lanes."
        },
        {
          stage_num: 5,
          action: "Planting steel impact bollards and painting yellow hazard crosshatch bay lines on the apron",
          tool: "micro airbrush and brass stencil",
          asmr_type: "spray_painting",
          narration: "With safety bollards placed and chevron markings sprayed, Metropolis Station One is fully operational."
        }
      ]
    },
    {
      episode: 6,
      title: "Wiring the Micro Solar Streetlamp Grid",
      subtitle_2word: "SOLAR LAMPS",
      problem: "Nighttime darkness along Avenue One creates hazardous conditions for scale autonomous shuttles.",
      solution: "Trench underground micro wiring conduit and erect 6 modern solar-assisted LED streetlamps along the curbs.",
      structures_added: "Array of 6 modern stainless-steel curved solar streetlamps with genuine micro LED illumination",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Drilling precision 3mm anchor holes through the concrete sidewalk curbs with a miniature pin vise",
          tool: "miniature brass pin vise hand drill",
          asmr_type: "dirt_scraping",
          narration: "To illuminate Avenue One, we drill laser-aligned foundation sockets through the concrete sidewalk curbs."
        },
        {
          stage_num: 2,
          action: "Threading ultra-fine insulated copper magnet wire through the underground curb conduit",
          tool: "micro tweezers and needle-nose pliers",
          asmr_type: "wire_tweezing",
          narration: "Micro electrical wiring is routed through the subterranean channels to supply continuous clean power."
        },
        {
          stage_num: 3,
          action: "Lowering curved stainless steel architectural lamp posts into each pre-drilled anchor socket",
          tool: "watchmaker tweezers",
          asmr_type: "brick_tapping",
          narration: "Custom turned stainless steel lamp posts are seated into each foundation and trued with a micro plumb line."
        },
        {
          stage_num: 4,
          action: "Affixing miniature photovoltaic solar panels and high-efficiency luminaire heads to the post crests",
          tool: "fine tweezers and micro glue applicator",
          asmr_type: "wire_tweezing",
          narration: "Photovoltaic solar collector heads are bonded atop each arm, creating an autonomous off-grid lighting array."
        },
        {
          stage_num: 5,
          action: "Powering on the micro SMD LED warm-white diodes to cast realistic scale pools of light across the asphalt",
          tool: "precision tweezers and micro switch",
          asmr_type: "spray_painting",
          narration: "Power is energized. Warm streetlamp glow illuminates the dark pavement, turning Avenue One into a vibrant night corridor."
        }
      ]
    }
  ],

  mountain_village: [
    {
      episode: 1,
      title: "Clearing the Untouched Alpine Ground",
      subtitle_2word: "GROUND CLEARING",
      problem: "Dense wild alpine moss and jagged rocks prevent building any trail.",
      solution: "Trim overgrown brush, level the mountain dirt, and lay a crushed granite foundation road.",
      structures_added: "Crushed granite mountain road base, compacted earth foundation",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Trimming wild moss and overgrown grass using miniature precision shears",
          tool: "miniature brass grass trimmers",
          asmr_type: "grass_trimming",
          narration: "We start from scratch on the untouched pine workbench, trimming away the wild mountain moss to uncover the raw soil."
        },
        {
          stage_num: 2,
          action: "Scraping and leveling uneven mountain dirt with a miniature steel rake",
          tool: "miniature steel rake and wooden tamper",
          asmr_type: "dirt_scraping",
          narration: "Every grain of alpine dirt is leveled and compacted, preparing a rock-solid foundation for the village trail."
        },
        {
          stage_num: 3,
          action: "Spreading fine grey crushed granite stone along the cleared route with a mini metal trowel",
          tool: "miniature steel trowel",
          asmr_type: "gravel_rolling",
          narration: "A layer of fine crushed granite creates an all-weather road that won't wash away in mountain storms."
        },
        {
          stage_num: 4,
          action: "Rolling and packing the granite gravel firmly using a heavy solid brass hand roller",
          tool: "heavy miniature brass roller",
          asmr_type: "gravel_rolling",
          narration: "Using a miniature solid brass roller, we compress the gravel until it forms a glassy, durable roadbed."
        },
        {
          stage_num: 5,
          action: "Placing micro granite curbstones along the finished trail using precision tweezers",
          tool: "precision watchmaker tweezers",
          asmr_type: "brick_tapping",
          narration: "Finally, individual granite curbstones lock the road in place. Our mountain village now has its first permanent avenue."
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
          action: "Carving a stepped foundation trench along the hillside slope with a miniature brass spade",
          tool: "miniature brass spade",
          asmr_type: "dirt_scraping",
          narration: "To prevent mountain mudslides, we excavate a tiered foundation shelf into the alpine dirt bank."
        },
        {
          stage_num: 2,
          action: "Laying heavy granite base stones flat into the footing using precision tweezers",
          tool: "precision stone tweezers",
          asmr_type: "brick_tapping",
          narration: "The largest slate blocks form a gravity-anchored footing, tilted slightly back into the hillside for strength."
        },
        {
          stage_num: 3,
          action: "Dry-stacking courses of fractured natural slate stones with interlocking staggered joints",
          tool: "fine tweezers and stone mallet",
          asmr_type: "brick_tapping",
          narration: "Stone after stone is fitted dry without mortar, allowing hydrostatic water pressure to freely escape."
        },
        {
          stage_num: 4,
          action: "Backfilling behind the slate wall with crushed alpine drainage gravel",
          tool: "miniature brass scoop",
          asmr_type: "gravel_rolling",
          narration: "Coarse crushed gravel behind the wall provides continuous sub-surface drainage, shielding the trail."
        },
        {
          stage_num: 5,
          action: "Placing wide flat alpine capstones along the wall crest and adding micro wild alpine ferns",
          tool: "precision tweezers and micro brush",
          asmr_type: "grass_trimming",
          narration: "With smooth capstones aligned and tiny wild mountain ferns planted in the joints, the terrace is rock-solid."
        }
      ]
    },
    {
      episode: 3,
      title: "Handcrafting the Timber Trestle Ravine Bridge",
      subtitle_2word: "TIMBER BRIDGE",
      problem: "A deep mountain crevasse divides the village from the upper alpine timber stands.",
      solution: "Construct a hand-hewn rustic pine timber trestle bridge across the ravine gap.",
      structures_added: "Rustic heavy pine timber trestle road bridge with safety log railings",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Chiseling bridge abutment seats into the rocky ravine cliffs with a micro chisel",
          tool: "micro cold chisel and mallet",
          asmr_type: "brick_tapping",
          narration: "We carve level masonry bridge abutments into the opposing rock cliffs across the mountain ravine."
        },
        {
          stage_num: 2,
          action: "Assembling A-frame timber bent supports using hand-notched miniature pine beams",
          tool: "fine tweezers and micro clamps",
          asmr_type: "wood_cutting",
          narration: "Hand-hewn pine timbers are joined with miniature mortise and tenon notches to build the structural trestle bents."
        },
        {
          stage_num: 3,
          action: "Spanning the heavy pine log stringers across the ravine gap onto the abutments",
          tool: "precision tweezers",
          asmr_type: "wood_cutting",
          narration: "Massive miniature pine stringer logs span the divide, locked together with solid brass micro drift pins."
        },
        {
          stage_num: 4,
          action: "Laying individual rough-sawn timber road decking planks one by one across the stringers",
          tool: "watchmaker tweezers",
          asmr_type: "brick_tapping",
          narration: "Rough-sawn wood deck planks are secured crosswise, creating an authentic clattering timber roadway."
        },
        {
          stage_num: 5,
          action: "Installing weathered split-rail cedar guardrails along both sides of the bridge span",
          tool: "micro tweezers and needle applicator",
          asmr_type: "wood_cutting",
          narration: "Split-rail cedar safety barriers complete the span. The mountain crevasse is officially bridged."
        }
      ]
    }
  ],

  desert_town: [
    {
      episode: 1,
      title: "Taming the Raw Sand and Establishing the Desert Outpost",
      subtitle_2word: "DESERT ROADS",
      problem: "Loose shifting red desert sand and dry tumbleweeds make travel impossible.",
      solution: "Clear shifting sand dunes, grade the clay base, and install interlocking desert adobe pavers.",
      structures_added: "Interlocking terracotta stone desert road with sandstone drainage trenches",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Brushing away dry red sand drifts and removing miniature brittle desert twigs with fine tweezers",
          tool: "fine horsehair brush and tweezers",
          asmr_type: "grass_trimming",
          narration: "Deep in the arid desert, we brush back loose red dunes to expose the dense underlying clay hardpan."
        },
        {
          stage_num: 2,
          action: "Carving neat sandstone drainage channels with a miniature triangular clay scraper",
          tool: "miniature triangular clay scraper",
          asmr_type: "dirt_scraping",
          narration: "Even in the desert, flash floods happen. We carve deep roadside drainage swales into the clay."
        },
        {
          stage_num: 3,
          action: "Laying moisture-barrier clay slip foundation using a miniature wooden spreader",
          tool: "miniature wood spatula",
          asmr_type: "cement_troweling",
          narration: "A stabilizing clay slip is spread evenly across the roadbed to prevent sand seepage."
        },
        {
          stage_num: 4,
          action: "Placing miniature fired terracotta cobblestone blocks one by one using precision tweezers",
          tool: "watchmaker tweezers",
          asmr_type: "brick_tapping",
          narration: "Fired terracotta pavers are laid in an interlocking herringbone pattern, designed to resist scorching desert heat."
        },
        {
          stage_num: 5,
          action: "Sweeping fine golden silica sand into the paver joints with a miniature camel-hair brush",
          tool: "fine camel-hair brush",
          asmr_type: "dirt_scraping",
          narration: "Fine golden silica sand is swept between the joints, locking the pavers into a permanent desert highway."
        }
      ]
    },
    {
      episode: 2,
      title: "Digging the Artesian Well & Water Cistern",
      subtitle_2word: "WATER CISTERN",
      problem: "The desert outpost cannot survive without a secure deep underground water supply.",
      solution: "Drill a miniature artesian borehole and construct a traditional stone masonry cistern.",
      structures_added: "Deep masonry stone water well with brass hand pump and elevated stone cistern tank",
      is_multipart: false,
      multipart_info: null,
      stages: [
        {
          stage_num: 1,
          action: "Drilling a circular borehole into the tabletop clay with a miniature brass auger drill",
          tool: "miniature manual brass hand drill",
          asmr_type: "dirt_scraping",
          narration: "We sink a miniature auger into the desert clay, drilling deep down to reach the underground aquifer."
        },
        {
          stage_num: 2,
          action: "Inserting a slotted brass well casing sleeve into the drilled shaft using tweezers",
          tool: "precision tweezers",
          asmr_type: "wire_tweezing",
          narration: "A miniature slotted brass casing is slipped into the borehole to prevent sand collapse."
        },
        {
          stage_num: 3,
          action: "Building a circular red sandstone wellhead using micro masonry stones and wet mortar",
          tool: "miniature metal trowel and stone tweezers",
          asmr_type: "brick_tapping",
          narration: "Using micro masonry blocks, we build a circular stone wellhead with authentic lime mortar."
        },
        {
          stage_num: 4,
          action: "Assembling the weathered timber A-frame hoist and miniature copper bucket with micro brass chain",
          tool: "fine tweezers and micro pliers",
          asmr_type: "wood_cutting",
          narration: "A handcrafted wooden hoist frame and miniature copper bucket are suspended over the well shaft."
        },
        {
          stage_num: 5,
          action: "Adding realistic clear epoxy resin inside the well bucket to simulate fresh crystal water",
          tool: "micro pipette and needle applicator",
          asmr_type: "wire_tweezing",
          narration: "Crystal clear simulated water fills the bucket. Our desert outpost now possesses life-giving water."
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
    : "Nothing built yet (untouched wild tabletop terrain)";

  return `You are the Master Diorama Civil Engineer and Miniature Craftsman Director for a viral YouTube Shorts/Instagram Reels series.
Town Series: "${townMemory.name}" (${townKey})
Current Episode: ${nextEpisode}
Fixed Diorama Anchor Tabletop: "${townMemory.diorama_anchor_prompt}"
Previously Built Structures on Table: "${builtList}"
Active Multi-Part Project: ${JSON.stringify(townMemory.active_multipart)}

YOUR MISSION:
Plan Episode ${nextEpisode} as a seamless, continuous step-by-step miniature construction video.
The camera is LOCKED on a fixed tripod at a 45-degree macro isometric tilt-shift view (Sony A7RV 90mm f/2.8) looking at the wooden workbench diorama.
The town builds progressively on the exact same spot without jarring scene jumps.

${nextEpisode === 1 ? `EPISODE 1 SPECIAL RULE:
This is Episode 1! The tabletop is 100% untouched wild overgrown terrain (weeds, wild dirt, uneven rocks). Giant craftsman hands enter with miniature tools to clear the weeds, level the soil, and lay the first foundation road.` : `EPISODE ${nextEpisode} RULE:
Invent a realistic civil-engineering problem arising from the existing town (e.g., mud -> asphalt, drainage flooding, parking shortage, fuel depot, river bridge). Solve it step-by-step.`}

CRITICAL VISUAL SPECIFICATIONS FOR ALL 5 STAGES:
1. Every stage image prompt MUST incorporate real adult craftsman male hands, skin pores, rolled dark denim sleeves, silver wristwatch, holding miniature tools at the front of the prompt.
2. Motion prompts: For each transition between stages, describe how the craftsman's hands smoothly move and install the miniature piece.
3. ASMR Foley type: Select from ["grass_trimming", "dirt_scraping", "cement_troweling", "brick_tapping", "spray_painting", "gravel_rolling", "wood_cutting", "wire_tweezing"].
4. Narration: 1-2 calm, documentary-style US English sentences per stage explaining the craftsmanship.
5. Thumbnail Subtitle: Exactly 2 bold uppercase words (e.g. "METRO GROUND", "STORM DRAINAGE", "ROAD REPAIR", "FUEL VAULT").

OUTPUT REQUIREMENT:
Output ONLY valid JSON matching this exact structure:
{
  "episode": ${nextEpisode},
  "title": "Title of the Episode",
  "subtitle_2word": "TWO WORDS",
  "problem": "Realistic civil engineering problem",
  "solution": "Clear miniature construction solution",
  "is_multipart": false,
  "multipart_info": null,
  "updated_anchor_prompt": "Updated comprehensive visual description of the diorama table including this new build",
  "structures_added": "Name of new structure(s) permanently added to the diorama",
  "stages": [
    {
      "stage_num": 1,
      "title": "Short title",
      "action": "What the craftsman hands are doing",
      "tool": "Miniature tool held",
      "image_prompt": "Complete photorealistic prompt for Stage 1",
      "motion_prompt": "Motion description for video transition from Stage 1 to Stage 2",
      "asmr_type": "dirt_scraping",
      "narration": "Calm narrator voiceover script for Stage 1"
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
    ? `Visible on table: ${townMemory.built_structures.join("; ")}.`
    : "Virgin untouched tabletop landscape.";

  const updatedAnchor = `${townMemory.diorama_anchor_prompt} ${builtSoFar} Completed addition: ${baseBlueprint.structures_added}.`;

  const stages = baseBlueprint.stages.map((stage, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === 4;
    
    // Front-load the craftsman hands, miniature tools, and action so every AI model focuses directly on the hands & build
    const imagePrompt = `Real adult craftsman male hands with visible skin pores, subtle soil dust on knuckles, rolled-up dark denim work sleeves, and a matte silver wristwatch actively holding ${stage.tool} to ${stage.action} on the wooden diorama table. Extreme macro 45-degree isometric tilt-shift photography on a Sony A7RV 90mm f/2.8 lens, locked tripod perspective, razor-sharp macro focus on the miniature build, shallow depth of field, creamy bokeh workshop background, consistent 5500K directional studio lighting, 8k resolution, hyper-realistic diorama scale modeling.`;

    const nextAction = !isLast ? baseBlueprint.stages[idx + 1].action : "finishing the structure and wiping the work surface";
    const motionPrompt = `Extreme macro 45-degree isometric action video: Adult craftsman male hands with visible skin pores and silver wristwatch actively and continuously moving, using ${stage.tool} with vigorous working motions to ${stage.action}, loose miniature materials and dust shifting realistically, hands actively advancing work toward ${nextAction}. Dynamic tactile construction motion, real physical hands in motion, 60fps cinematic macro focus.`;

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

  console.log(`[Architect] Planning Episode ${nextEpisode} for town: "${townKey}" (${townMemory.name})`);

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
