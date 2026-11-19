const fs = require('fs');
const path = require('path');

/**
 * Town Architect Engine (Gemini 2.5 Flash Free API + Deterministic Civil Engineering Fallback)
 * Generates continuous 5-stage progressive diorama construction plans.
 */

const CRAFTSMAN_HANDS_DESCRIPTION = 
  "Real adult male craftsman hands with visible skin pores, subtle dried cement and soil dust on knuckles, rolled-up dark denim work sleeves, and a matte silver wristwatch";

const CAMERA_BASE_PROMPT = 
  "Extreme macro 45-degree isometric tilt-shift photography on a Sony A7RV 90mm f/2.8 lens, 8k resolution, razor-sharp focus on the center miniature build, soft creamy bokeh workbench background, locked tripod perspective, consistent directional 5500K workshop lighting";

// Procedural episode templates for fallback / offline generation
const PROCEDURAL_BLUEPRINTS = {
  mountain_village: [
    {
      episode: 1,
      title: "Clearing the Untouched Alpine Ground",
      subtitle_2word: "GROUND CLEARING",
      problem: "Dense wild alpine moss and jagged rocks prevent building any trail.",
      solution: "Trim overgrown brush, level the mountain dirt, and lay a crushed granite foundation road.",
      structures_added: "Crushed granite mountain road base, compacted earth foundation",
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
      title: "Building the Timber Lumber Mill",
      subtitle_2word: "LUMBER MILL",
      problem: "The mountain village needs building lumber from local pines.",
      solution: "Erect a miniature timber water-powered lumber mill beside the mountain runoff.",
      structures_added: "Timber lumber mill with rotating water wheel and log staging deck",
      stages: [
        {
          stage_num: 1,
          action: "Digging a micro millrace channel into the dirt base using a miniature metal spade",
          tool: "miniature brass spade",
          asmr_type: "dirt_scraping",
          narration: "To power our lumber mill, we carve a miniature millrace canal through the mountain slope."
        },
        {
          stage_num: 2,
          action: "Laying dry-stacked slate stone foundation blocks using fine tweezers",
          tool: "precision tweezers and epoxy adhesive",
          asmr_type: "brick_tapping",
          narration: "Dry-stacked slate foundation stones are bonded one by one to withstand heavy water pressure."
        },
        {
          stage_num: 3,
          action: "Assembling rustic timber post-and-beam frame with mini wooden dowels",
          tool: "fine tweezers and micro clamps",
          asmr_type: "wood_cutting",
          narration: "Handcrafted miniature pine beams are slotted together to form the sturdy mill framing."
        },
        {
          stage_num: 4,
          action: "Mounting the detailed miniature wooden paddle wheel onto the brass axle",
          tool: "precision tweezers and micro oiler",
          asmr_type: "wood_cutting",
          narration: "The precision wooden water wheel is calibrated to turn freely with authentic hydrodynamic paddles."
        },
        {
          stage_num: 5,
          action: "Shingling the timber roof with cedar shakes and setting up micro cut pine logs",
          tool: "miniature tweezers and fine brush",
          asmr_type: "wood_cutting",
          narration: "Finished with miniature cedar roof shakes and miniature log stacks, our mountain lumber mill is ready for production."
        }
      ]
    }
  ],
  smart_city: [
    {
      episode: 1,
      title: "Clearing the Untouched Tabletop for the Metropolis",
      subtitle_2word: "METRO GROUND",
      problem: "Uneven raw dark loam and wild weeds cover the urban tabletop grid.",
      solution: "Clear the weed brush, level the high-density soil, and pave the dual-lane main boulevard.",
      structures_added: "Compacted dual-lane asphalt boulevard with concrete curbs and painted lane markers",
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
      title: "Building the Smart EV Charging Station",
      subtitle_2word: "EV CHARGER",
      problem: "Electric autonomous shuttles have no power infrastructure along the new boulevard.",
      solution: "Excavate underground conduit trench, install battery vaults, and erect high-speed solar EV chargers.",
      structures_added: "Solar-canopied EV charging depot with 4 glowing micro charging pods and safety bollards",
      stages: [
        {
          stage_num: 1,
          action: "Excavating a neat utility trench alongside the boulevard curb using a miniature trenching spade",
          tool: "miniature stainless trenching spade",
          asmr_type: "dirt_scraping",
          narration: "We cut a clean subterranean utility trench adjacent to Avenue One to house high-voltage micro wiring."
        },
        {
          stage_num: 2,
          action: "Threading micro copper conduits into the trench and pouring miniature rapid-setting concrete pads",
          tool: "precision tweezers and micro syringe",
          asmr_type: "cement_troweling",
          narration: "Insulated micro conduits are laid and anchored in fast-curing miniature concrete foundation pads."
        },
        {
          stage_num: 3,
          action: "Mounting the sleek tempered-glass solar canopy frame onto the concrete pad",
          tool: "fine tweezers and micro clamps",
          asmr_type: "wire_tweezing",
          narration: "An architectural solar canopy frame made of etched stainless steel is securely fastened over the stalls."
        },
        {
          stage_num: 4,
          action: "Installing four detailed miniature EV charging pedestals with tiny illuminated display screens",
          tool: "fine watchmaker tweezers",
          asmr_type: "wire_tweezing",
          narration: "Four ultra-fast micro charging pedestals are wired into the subterranean grid."
        },
        {
          stage_num: 5,
          action: "Planting miniature urban safety bollards and spraying green electric-vehicle bay markings",
          tool: "miniature stencil and micro airbrush",
          asmr_type: "spray_painting",
          narration: "With safety bollards locked and bays painted electric green, our smart city has its first clean energy hub."
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
Invent a realistic civil-engineering problem arising from the existing town (e.g., mud -> asphalt, dark streets -> streetlamps, fuel shortage -> 2-part gas station, river -> bridge). Solve it step-by-step.`}

CRITICAL VISUAL SPECIFICATIONS FOR ALL 5 STAGES:
1. Every stage image prompt MUST incorporate:
   - Camera: "${CAMERA_BASE_PROMPT}"
   - Table Base: "${townMemory.diorama_anchor_prompt}"
   - Existing structures: Keep all previously built structures visible in their exact spatial positions.
   - Hands: "${CRAFTSMAN_HANDS_DESCRIPTION}"
   - Hand action: Craftsman hands visibly holding a specific miniature tool and performing the physical work.
   - Stage progression: Stage 1 to 5 must show the structure physically growing on the exact same spot.
2. Motion prompts: For each transition between stages, describe how the craftsman's hands smoothly move, manipulate tools, and install the miniature piece.
3. ASMR Foley type: Select from ["grass_trimming", "dirt_scraping", "cement_troweling", "brick_tapping", "spray_painting", "gravel_rolling", "wood_cutting", "wire_tweezing"].
4. Narration: 1-2 calm, documentary-style US English sentences per stage explaining the craftsmanship.
5. Thumbnail Subtitle: Exactly 2 bold uppercase words (e.g. "FOUNDATION ROAD", "MICRO ASPHALT", "EV CHARGER").

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
 * Call Gemini 2.5 Flash Free API
 */
async function callGemini(prompt, apiKey) {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${model}): ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Empty candidate response from Gemini API");

      const parsed = JSON.parse(rawText.trim());
      if (parsed.stages && parsed.stages.length === 5) {
        return parsed;
      }
      throw new Error("Gemini response did not contain 5 stages");
    } catch (err) {
      lastError = err;
      // Try next model fallback
    }
  }

  throw lastError || new Error("Failed to call Gemini API across models");
}

/**
 * Procedural Fallback Architect when offline or Gemini API key not present
 */
function generateProceduralPlan(townKey, townMemory, nextEpisode) {
  const blueprints = PROCEDURAL_BLUEPRINTS[townKey] || PROCEDURAL_BLUEPRINTS.smart_city;
  const blueprintIndex = (nextEpisode - 1) % blueprints.length;
  const baseBlueprint = blueprints[blueprintIndex];

  // Adjust for episode number if beyond template count
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
    
    // Construct strict photorealistic prompt adhering to locked camera & hands
    const imagePrompt = `${CAMERA_BASE_PROMPT}. Diorama Tabletop Base: ${townMemory.diorama_anchor_prompt}. ${builtSoFar} Current construction focus in center frame: ${stage.action}. ${CRAFTSMAN_HANDS_DESCRIPTION} entering the frame holding ${stage.tool}, executing delicate physical work on the tabletop. Highly detailed tactile textures, visible dust particles, razor sharp focus on the miniature build, locked 45-degree isometric angle, photorealistic diorama photography.`;

    const nextAction = !isLast ? baseBlueprint.stages[idx + 1].action : "finishing the structure and wiping the work surface";
    const motionPrompt = `Extreme macro 45-degree isometric video: Craftsman male hands with rolled dark denim sleeves and silver wristwatch smoothly use ${stage.tool} to ${stage.action}, transitioning seamlessly toward ${nextAction}. The camera remains locked on a fixed tripod with zero camera shake. Subtle tactile micro movements, ultra-smooth craftsmanship transition.`;

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
    is_multipart: false,
    multipart_info: null,
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
      console.log(`[Architect] Contacting Gemini 2.5 Flash API...`);
      const prompt = buildGeminiPrompt(townKey, townMemory, nextEpisode);
      const plan = await callGemini(prompt, apiKey);
      console.log(`[Architect] Successfully generated episode plan via Gemini: "${plan.title}"`);
      return plan;
    } catch (err) {
      console.warn(`[Architect] Gemini API warning: ${err.message}. Falling back to procedural diorama blueprint.`);
    }
  } else {
    console.log(`[Architect] GEMINI_API_KEY not provided or in offline mode. Using procedural diorama blueprint.`);
  }

  const plan = generateProceduralPlan(townKey, townMemory, nextEpisode);
  console.log(`[Architect] Procedural plan ready: "${plan.title}" [${plan.subtitle_2word}] (5 stages)`);
  return plan;
}

module.exports = {
  planEpisode,
  CRAFTSMAN_HANDS_DESCRIPTION,
  CAMERA_BASE_PROMPT
};
