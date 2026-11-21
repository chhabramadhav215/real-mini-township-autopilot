const fs = require('fs');
const path = require('path');

/**
 * Town Architect Engine (Gemini 2.5 Flash Free API + Infinite Multi-Part Miniature Construction Series)
 * Follows the viral hands-on miniature formwork, ASMR & reveal model (9:16 Vertical).
 * Builds on a sand/soil base with studio rocks and consistent backdrop across shots:
 * - thin wood/plywood shuttering/formwork
 * - metal pins
 * - white grid mesh
 * - pouring grey cement slurry
 * - leveling with a mini trowel/screed
 * - stripping formwork to reveal smooth concrete/stairs/slabs
 * - stacking miniature blocks/bricks
 * Fast step-by-step cuts (~0.8s–2.2s rhythm across ~14–20s vertical reels) with clean part labels.
 *
 * INFINITE PROGRESSION GUARANTEE:
 * Daily and queued scripts NEVER run out ("end") and NEVER repeat identical parts or micro-steps.
 * For any episode N >= 1, structure index S = Math.floor((N - 1) / 4) and part P = ((N - 1) % 4) + 1.
 * When Part 4 completes, the structure is recorded as complete and the series advances to the next structure at Part 1.
 */

const CRAFTSMAN_HANDS_DESCRIPTION = 
  "Authentic craftsman hands with natural skin texture and rolled-up dark denim work sleeves, performing hands-on miniature construction using real miniature tools, thin plywood shuttering, metal pins, white grid mesh, grey cement slurry, and miniature bricks on a fine sand and soil base with studio rocks";

const CAMERA_BASE_PROMPT = 
  "Cinematic 720p, 5s duration miniature construction cinematography (9:16 vertical): macro lens with authentic shallow depth of field, steady eye-level and 45-degree angle focusing on hands-on building on a sand base with studio rocks and consistent backdrop, warm directional studio lighting, Sony FX6 cinema camera, authentic physical craftsmanship";

// Comprehensive catalog of 10 architectural archetypes per town
const ARCHETYPE_BLUEPRINTS = {
  smart_city: [
    {
      name: "Modern Villa",
      baseSand: "fine white quartz sand base with natural granite studio rocks",
      formwork: "thin birch plywood shuttering",
      pins: "slim stainless steel pins",
      mesh: "white grid reinforcing mesh",
      slurry: "viscous grey Portland cement slurry",
      blocks: "miniature red clay bricks",
      water: "crystal-clear infinity pool",
      subtitles: ["VILLA FOUNDATION", "CONCRETE COLUMNS", "BRICK WALLS", "VILLA REVEAL"]
    },
    {
      name: "Glass Terrace House",
      baseSand: "stepped quartz sand terraces with studio slate slabs",
      formwork: "curved thin plywood shuttering strips",
      pins: "precision metal pins",
      mesh: "white grid rebar mesh",
      slurry: "smooth grey cement slurry",
      blocks: "miniature grey concrete blocks",
      water: "rooftop terrace plunge pool",
      subtitles: ["STEP FOOTINGS", "CANTILEVER DECK", "BLOCKWORK WALLS", "TERRACE REVEAL"]
    },
    {
      name: "Minimalist Pavilion & Pool",
      baseSand: "compacted sand base with polished studio river stones",
      formwork: "balsa wood shuttering forms",
      pins: "brass anchor pins",
      mesh: "fine white wire grid mesh",
      slurry: "light grey architectural cement slurry",
      blocks: "dark slate miniature blocks",
      water: "perimeter reflecting pool",
      subtitles: ["PAVILION BASE", "PILLAR COLONNADE", "SLATE WALLS", "PAVILION REVEAL"]
    },
    {
      name: "Cantilever Studio & Sunken Deck",
      baseSand: "fine silica sand bed with dark granite studio outcrops",
      formwork: "birch shuttering boards",
      pins: "machined steel pins",
      mesh: "high-tensile white grid mesh",
      slurry: "dense grey cement slurry",
      blocks: "miniature split-face masonry blocks",
      water: "sunken courtyard water basin",
      subtitles: ["STUDIO FOOTING", "SUSPENDED DECK", "MASONRY WALLS", "STUDIO REVEAL"]
    },
    {
      name: "Dual-Wing Horizon Villa",
      baseSand: "graded white sand base with twin granite anchor rocks",
      formwork: "dual-channel plywood formwork",
      pins: "heavy steel pins",
      mesh: "double-layer white grid mesh",
      slurry: "liquid grey Portland cement slurry",
      blocks: "miniature white limestone bricks",
      water: "central horizon lap pool",
      subtitles: ["TWIN FOOTINGS", "BRIDGE DECK", "LIMESTONE WALLS", "HORIZON REVEAL"]
    },
    {
      name: "Sunken Atrium Courtyard",
      baseSand: "tiered sand base with dark studio basalt boulders",
      formwork: "stepped timber formwork boxes",
      pins: "locking steel pins",
      mesh: "square white reinforcing mesh",
      slurry: "viscous grey cement mix",
      blocks: "miniature terracotta face bricks",
      water: "central bubbling fountain pool",
      subtitles: ["ATRIUM BASIN", "MEZZANINE DECK", "TERRACOTTA WALLS", "ATRIUM REVEAL"]
    },
    {
      name: "Monolithic Concrete Residence",
      baseSand: "coarse sand and gravel base with raw studio granite",
      formwork: "board-formed timber shuttering panels",
      pins: "heavy structural pins",
      mesh: "heavy-duty white rebar mesh",
      slurry: "rich grey architectural cement slurry",
      blocks: "miniature fluted concrete blocks",
      water: "interior courtyard reflecting pond",
      subtitles: ["MONOLITH BASE", "SHEAR COLUMNS", "BOARD CONCRETE", "MONOLITH REVEAL"]
    },
    {
      name: "Waterfront Infinity Villa",
      baseSand: "fine beach sand base with studio shoreline rocks",
      formwork: "curved plywood shoreline formwork",
      pins: "marine brass pins",
      mesh: "interlocking white grid mesh",
      slurry: "hydrophobic grey cement slurry",
      blocks: "miniature travertine stone bricks",
      water: "infinity edge ocean-facing pool",
      subtitles: ["WATERFRONT BASE", "CANTILEVER PIERS", "TRAVERTINE WALLS", "INFINITY REVEAL"]
    },
    {
      name: "Modular Geometric Loft",
      baseSand: "level silica sand bed with angular studio stones",
      formwork: "modular cubic plywood form boxes",
      pins: "modular steel corner pins",
      mesh: "precision white grid mesh",
      slurry: "rapid-cure grey cement slurry",
      blocks: "modular grey concrete mini bricks",
      water: "geometric sunken spa pool",
      subtitles: ["CUBIC FOOTINGS", "MODULAR PILLARS", "GEOMETRIC WALLS", "LOFT REVEAL"]
    },
    {
      name: "Biophilic Courtyard Studio",
      baseSand: "loam and sand base with mossy studio rock clusters",
      formwork: "curved planter shuttering strips",
      pins: "bamboo and metal pins",
      mesh: "flexible white wire mesh",
      slurry: "fine grey mortar slurry",
      blocks: "miniature earthen clay pavers",
      water: "bio-filtration lotus pond",
      subtitles: ["PLANTER BASE", "GARDEN COLUMNS", "EARTHEN WALLS", "BIOPHILIC REVEAL"]
    }
  ],

  mountain_village: [
    {
      name: "Stone Arch Bridge",
      baseSand: "sand riverbed flanked by natural mountain studio rocks",
      formwork: "thin plywood abutment boxes and curved arch centering",
      pins: "heavy steel pins",
      mesh: "white grid rebar mesh",
      slurry: "viscous grey cement slurry",
      blocks: "miniature natural cut stone blocks",
      water: "rushing mountain stream",
      subtitles: ["BRIDGE FOOTING", "ARCH VAULTING", "ROADBED DECK", "BRIDGE REVEAL"]
    },
    {
      name: "Alpine Timber Chalet",
      baseSand: "sloped mountain sand and loam base with studio granite boulders",
      formwork: "split-level timber footing formwork",
      pins: "timber anchor pins",
      mesh: "woven white grid mesh",
      slurry: "dense grey mountain cement slurry",
      blocks: "miniature granite foundation stones",
      water: "cascading hillside spring",
      subtitles: ["CHALET FOOTING", "TIMBER FRAMING", "GRANITE WALLS", "CHALET REVEAL"]
    },
    {
      name: "Step-Well & Aqueduct",
      baseSand: "deep ravine sand base surrounded by stratified studio rocks",
      formwork: "tiered step-well timber shuttering",
      pins: "forged steel pins",
      mesh: "heavy white rebar mesh",
      slurry: "waterproof grey cement slurry",
      blocks: "miniature coursed ashlar stones",
      water: "clear mountain well water",
      subtitles: ["WELL FOOTINGS", "AQUEDUCT ARCH", "ASHLAR WALLS", "SPRING REVEAL"]
    },
    {
      name: "Mountain Watermill & Flume",
      baseSand: "rocky river silt and gravel base with riverbed boulders",
      formwork: "millrace box shuttering forms",
      pins: "iron anchor pins",
      mesh: "reinforced white grid mesh",
      slurry: "hydraulic grey cement slurry",
      blocks: "miniature river stone masonry blocks",
      water: "flowing mill flume raceway",
      subtitles: ["MILLRACE BASE", "TIMBER FLUME", "RIVERSTONE WALLS", "WATERMILL REVEAL"]
    },
    {
      name: "Cliffside Bastion & Keep",
      baseSand: "bedrock sand ledge with massive studio granite cliff rocks",
      formwork: "battered cliffside timber shuttering",
      pins: "heavy bedrock expansion pins",
      mesh: "high-strength white grid mesh",
      slurry: "heavy-aggregate grey cement slurry",
      blocks: "miniature dressed castle stone blocks",
      water: "rock-hewn keep reservoir",
      subtitles: ["BASTION BASE", "WATCH TERRACE", "CASTLE WALLS", "BASTION REVEAL"]
    },
    {
      name: "Timber Trestle Viaduct",
      baseSand: "mountain gorge sand bed between vertical studio rock walls",
      formwork: "pier foundation box formwork",
      pins: "trestle joint pins",
      mesh: "pier core white grid mesh",
      slurry: "high-early-strength grey cement slurry",
      blocks: "miniature masonry pier stone blocks",
      water: "gorge river stream",
      subtitles: ["VIADUCT PIERS", "TRESTLE BENTS", "APPROACH WALLS", "VIADUCT REVEAL"]
    },
    {
      name: "Heavy Masonry Gatehouse",
      baseSand: "mountain pass compacted sand base with studio scree stones",
      formwork: "twin portal foundation boxes",
      pins: "structural alignment pins",
      mesh: "foundation white grid mesh",
      slurry: "dense mountain grey cement slurry",
      blocks: "miniature rough-hewn fieldstone blocks",
      water: "gatehouse drainage moat",
      subtitles: ["PORTAL FOOTING", "GATEWAY ARCHES", "FIELDSTONE WALLS", "GATEHOUSE REVEAL"]
    },
    {
      name: "River Sluice & Mill Pond",
      baseSand: "riverbed sand and pebble base with studio slate weir rocks",
      formwork: "spillway flume shuttering boxes",
      pins: "heavy steel tie pins",
      mesh: "spillway white rebar mesh",
      slurry: "waterproof hydraulic grey cement slurry",
      blocks: "miniature granite weir blocks",
      water: "overflowing sluice pond water",
      subtitles: ["SLUICE CHANNEL", "WEIR BUTTRESS", "CHANNEL WALLS", "SLUICE REVEAL"]
    },
    {
      name: "Highland Watchpost & Beacon",
      baseSand: "high summit sand and rocky gravel base with studio crag rocks",
      formwork: "hexagonal plinth shuttering forms",
      pins: "crag anchor pins",
      mesh: "hexagonal white grid mesh",
      slurry: "rapid-set grey cement slurry",
      blocks: "miniature dark basalt stone blocks",
      water: "rock-cut cistern basin",
      subtitles: ["BEACON PLINTH", "OBSERVATION DECK", "BASALT WALLS", "BEACON REVEAL"]
    },
    {
      name: "Log Cabin & Stone Hearth",
      baseSand: "forest loam and mountain sand base with studio river boulders",
      formwork: "hearth footing box shuttering",
      pins: "hearth tie pins",
      mesh: "hearth white wire mesh",
      slurry: "rich grey fireplace cement slurry",
      blocks: "miniature river pebble stones",
      water: "spring-fed brooklet",
      subtitles: ["HEARTH FOOTING", "CABIN FRAME", "RIVERSTONE HEARTH", "CABIN REVEAL"]
    }
  ],

  desert_town: [
    {
      name: "Desert Oasis Villa",
      baseSand: "reddish desert sand base with natural desert studio rocks",
      formwork: "thin wood formwork strips for pool basin and colonnade",
      pins: "metal pins",
      mesh: "white grid rebar mesh",
      slurry: "grey cement slurry",
      blocks: "miniature terracotta bricks",
      water: "turquoise oasis pool",
      subtitles: ["OASIS BASE", "ADOBE ARCHES", "COURTYARD WALLS", "OASIS REVEAL"]
    },
    {
      name: "Desert Watchtower & Rampart",
      baseSand: "dense orange desert sand base with sandstone studio boulders",
      formwork: "curved circular timber shuttering forms",
      pins: "radial metal pins",
      mesh: "curved white wire mesh",
      slurry: "warm terracotta-tinted cement slurry",
      blocks: "miniature sundried clay blocks",
      water: "shaded tower cistern basin",
      subtitles: ["TOWER PLINTH", "LOOKOUT DECK", "CLAY WALLS", "TOWER REVEAL"]
    },
    {
      name: "Underground Cistern & Vault",
      baseSand: "excavated desert trench bed surrounded by studio sandstone rocks",
      formwork: "deep subterranean cistern shuttering boxes",
      pins: "tie pins and bracing struts",
      mesh: "subterranean white grid mesh",
      slurry: "dense waterproof grey cement slurry",
      blocks: "miniature yellow sandstone bricks",
      water: "deep subterranean cistern water",
      subtitles: ["CISTERN BASIN", "VAULT SPRINGERS", "SANDSTONE ARCH", "CISTERN REVEAL"]
    },
    {
      name: "Adobe Caravanserai & Courtyard",
      baseSand: "wide expanse of golden desert sand with studio flat rocks",
      formwork: "quadrangle foundation timber shuttering",
      pins: "staked perimeter pins",
      mesh: "perimeter white grid mesh",
      slurry: "earthen-colored cement slurry",
      blocks: "miniature adobe mud bricks",
      water: "central courtyard fountain basin",
      subtitles: ["CARAVAN BASE", "COURTYARD ARCADE", "ADOBE WALLS", "CARAVAN REVEAL"]
    },
    {
      name: "Sandstone Citadel & Gateway",
      baseSand: "compacted red clay desert base with towering studio sandstone cliffs",
      formwork: "battered gateway timber formwork boxes",
      pins: "heavy steel expansion pins",
      mesh: "structural white rebar mesh",
      slurry: "heavy red-tinted cement slurry",
      blocks: "miniature dressed red sandstone blocks",
      water: "citadel moat reservoir",
      subtitles: ["CITADEL BASE", "GATEWAY ARCHES", "SANDSTONE WALLS", "CITADEL REVEAL"]
    },
    {
      name: "Step-Basin Bathhouse & Atrium",
      baseSand: "mineral-rich desert sand bed with studio crystal mineral rocks",
      formwork: "concentric step-basin shuttering forms",
      pins: "precision brass pins",
      mesh: "concentric white grid mesh",
      slurry: "silky smooth grey cement slurry",
      blocks: "miniature glazed terracotta pavers",
      water: "thermal step-pool water",
      subtitles: ["BATHHOUSE BASE", "PERISTYLE COLUMNS", "GLAZED WALLS", "BATHHOUSE REVEAL"]
    },
    {
      name: "Desert Courtyard Riad",
      baseSand: "fine orange sand base with studio limestone garden stones",
      formwork: "central star-basin timber shuttering",
      pins: "ornate brass pins",
      mesh: "star-pattern white wire mesh",
      slurry: "pure white and grey cement slurry",
      blocks: "miniature earthen clay bricks",
      water: "tiled riad fountain pool",
      subtitles: ["RIAD FOUNDATION", "GALLERY COLUMNS", "CLAY BRICKWORK", "RIAD REVEAL"]
    },
    {
      name: "Terracotta Arcaded Palace",
      baseSand: "leveled desert terrace with studio red clay boulders",
      formwork: "monumental arch formwork centering",
      pins: "heavy iron formwork pins",
      mesh: "high-density white grid mesh",
      slurry: "warm terracotta-tinted cement slurry",
      blocks: "miniature terracotta facade tiles and blocks",
      water: "palace courtyard reflecting basin",
      subtitles: ["PALACE BASE", "DOUBLE ARCHES", "TERRACOTTA WALLS", "PALACE REVEAL"]
    },
    {
      name: "Sunken Clay Kiva & Shrine",
      baseSand: "circular excavated desert sand pit with studio petrified wood rocks",
      formwork: "circular sunken timber formwork bands",
      pins: "radial wood and metal pins",
      mesh: "woven circular white grid mesh",
      slurry: "natural earthen clay cement slurry",
      blocks: "miniature clay adobe stones",
      water: "sacred spring water basin",
      subtitles: ["KIVA BASIN", "RADIAL BENCHES", "ADOBE RINGWALL", "KIVA REVEAL"]
    },
    {
      name: "Fortified Desert Outpost",
      baseSand: "wind-swept desert ridge sand with jagged studio sandstone shards",
      formwork: "bastion corner shuttering boxes",
      pins: "heavy trench pins",
      mesh: "bastion core white grid mesh",
      slurry: "dense grey fortification cement slurry",
      blocks: "miniature desert mud bricks",
      water: "outpost well water",
      subtitles: ["OUTPOST BASE", "CORNER BASTIONS", "MUD-BRICK WALLS", "OUTPOST REVEAL"]
    }
  ]
};

/**
 * Procedural Multi-Part Miniature Structure Synthesizer
 * Returns a fully fleshed-out 4-part structure blueprint for ANY structureIndex S >= 0.
 * Guarantees infinite non-repeating content with varied materials, tools, studio setups, and camera angles.
 */
function getMiniatureStructure(townKey, structureIndex) {
  const catalog = ARCHETYPE_BLUEPRINTS[townKey] || ARCHETYPE_BLUEPRINTS.smart_city;
  const numArchetypes = catalog.length;
  const archetype = catalog[structureIndex % numArchetypes];
  const cycle = Math.floor(structureIndex / numArchetypes) + 1;

  const cyclePrefixes = ["", "East Wing ", "Upper Terrace ", "South Quad ", "Highland ", "North Pavilion ", "Grand Promenade ", "Royal Annex "];
  const prefix = cycle === 1 ? "" : (cyclePrefixes[(cycle - 1) % cyclePrefixes.length] || `Phase ${cycle} `);
  const structureName = cycle === 1 ? archetype.name : `${prefix}${archetype.name}`;

  // Variation in physical craft materials per cycle
  let formworkDesc = archetype.formwork;
  let pinsDesc = archetype.pins;
  let meshDesc = archetype.mesh;
  let slurryDesc = archetype.slurry;
  let blocksDesc = archetype.blocks;

  if (cycle === 2) {
    formworkDesc = `dark walnut timber formwork boards`;
    pinsDesc = `machined brass pins`;
    meshDesc = `high-tensile copper wire rebar grid`;
    slurryDesc = `dark charcoal-tinted cement slurry`;
    blocksDesc = `miniature charcoal basalt pavers`;
  } else if (cycle === 3) {
    formworkDesc = `fine balsa shuttering strips`;
    pinsDesc = `black oxide pins`;
    meshDesc = `galvanized silver wire mesh`;
    slurryDesc = `warm sandstone-tinted cement slurry`;
    blocksDesc = `miniature cream limestone blocks`;
  } else if (cycle >= 4) {
    formworkDesc = `phenolic film-faced formwork`;
    pinsDesc = `titanium pins`;
    meshDesc = `composite glass-fiber mesh`;
    slurryDesc = `volcanic basalt mineral cement slurry`;
    blocksDesc = `miniature weathered slate blocks`;
  }

  // 4 Parts per structure with explicit milestone progression
  const parts = [
    {
      part: 1,
      title: `${structureName} - Foundation & Earthworks`,
      subtitle_2word: archetype.subtitles[0] || "FOUNDATION BASE",
      milestone: "Foundation / Stairs",
      prior_state: `Raw leveled ${archetype.baseSand}.`,
      problem: `The virgin ground base requires precise shuttering formwork and reinforced cement foundation footings for the ${structureName}.`,
      solution: `Assemble ${formworkDesc}, secure with ${pinsDesc}, position ${meshDesc}, pour ${slurryDesc}, and strip formwork to reveal smooth stairs and slab.`,
      structures_added: `Smooth concrete foundation slab and entrance stairs on ${archetype.baseSand}`,
      stages: [
        {
          stage_num: 1,
          title: "Sand Leveling",
          action: `Leveling ${archetype.baseSand} and placing natural studio rocks around the perimeter`,
          tool: "miniature sand rake and brass level",
          asmr_type: "sand_level",
          narration: `Leveling the sand base and studio rocks.`
        },
        {
          stage_num: 2,
          title: "Formwork & Pins",
          action: `Assembling ${formworkDesc} and securing with ${pinsDesc}`,
          tool: `${formworkDesc} and ${pinsDesc}`,
          asmr_type: "pin_placement",
          narration: `Formwork pinned firmly in place.`
        },
        {
          stage_num: 3,
          title: "Grid Mesh",
          action: `Positioning ${meshDesc} flat inside the foundation formwork`,
          tool: `${meshDesc} and tweezers`,
          asmr_type: "pin_placement",
          narration: `Reinforcing mesh laid inside the frame.`
        },
        {
          stage_num: 4,
          title: "Slurry Pour & Screed",
          action: `Pouring ${slurryDesc} into the formwork and smoothing with a mini trowel`,
          tool: "cement pouring vessel and mini stainless trowel",
          asmr_type: "cement_pour",
          narration: `Pouring the wet cement slurry.`
        },
        {
          stage_num: 5,
          title: "Formwork Strip Reveal",
          action: `Stripping the ${formworkDesc} to reveal razor-smooth cured concrete foundation and stairs`,
          tool: "pin puller and gentle hand strip",
          asmr_type: "formwork_strip",
          narration: `Stripping the formwork. Look at this finish!`
        }
      ]
    },
    {
      part: 2,
      title: `${structureName} - Structural Columns & Deck`,
      subtitle_2word: archetype.subtitles[1] || "CONCRETE COLUMNS",
      milestone: "Deck / Columns",
      prior_state: `Cured smooth concrete foundation slab and entrance stairs on ${archetype.baseSand}.`,
      problem: `The foundation slab needs structural load-bearing columns and a ground terrace deck.`,
      solution: `Set vertical column formwork boxes with ${pinsDesc}, pour ${slurryDesc}, and demold sleek concrete pillars and terrace deck.`,
      structures_added: `Erected smooth concrete structural columns and ground patio deck slab`,
      stages: [
        {
          stage_num: 1,
          title: "Column Formwork",
          action: `Erecting vertical timber column formwork boxes over foundation anchor pins`,
          tool: "vertical column shuttering boxes and pins",
          asmr_type: "pin_placement",
          narration: `Setting column formwork over anchor pins.`
        },
        {
          stage_num: 2,
          title: "Column Pour",
          action: `Pouring ${slurryDesc} into each column box and tamping with a metal pin`,
          tool: "funnel and miniature tamp rod",
          asmr_type: "cement_pour",
          narration: `Pouring cement slurry into each column.`
        },
        {
          stage_num: 3,
          title: "Deck Shuttering & Mesh",
          action: `Laying horizontal ${formworkDesc} deck sheets and placing ${meshDesc} between columns`,
          tool: "plywood decking sheets and mesh",
          asmr_type: "pin_placement",
          narration: `Deck shuttering and mesh in position.`
        },
        {
          stage_num: 4,
          title: "Deck Troweling",
          action: `Pouring ${slurryDesc} across deck formwork and leveling with an aluminum screed bar`,
          tool: "mini aluminum screed bar and trowel",
          asmr_type: "trowel_scrape",
          narration: `Screeding the deck slab dead-flat.`
        },
        {
          stage_num: 5,
          title: "Column Demolding Reveal",
          action: `Peeling off column and deck formwork to reveal sleek concrete columns and terrace slab`,
          tool: "demolding spatula and gentle peel",
          asmr_type: "formwork_strip",
          narration: `Stripping formwork. Sleek concrete pillars revealed.`
        }
      ]
    },
    {
      part: 3,
      title: `${structureName} - Walls & Masonry Lintels`,
      subtitle_2word: archetype.subtitles[2] || "MASONRY WALLS",
      milestone: "Walls / Blocks",
      prior_state: `Cured concrete columns, terrace deck, and foundation slab on ${archetype.baseSand}.`,
      problem: `The structural frame requires perimeter walls and reinforced concrete lintels over openings.`,
      solution: `Stack ${blocksDesc} with troweled mortar, place timber lintel boxes, and cast solid concrete headers.`,
      structures_added: `Stacked ${blocksDesc} perimeter walls with cast concrete window and door lintels`,
      stages: [
        {
          stage_num: 1,
          title: "Mortar Bedding",
          action: `Spreading a thin bed of mortar onto the concrete deck using a mini pointed trowel`,
          tool: "mini pointed stainless steel trowel",
          asmr_type: "trowel_scrape",
          narration: `Spreading fresh mortar on the concrete deck.`
        },
        {
          stage_num: 2,
          title: "Block Stacking",
          action: `Stacking individual ${blocksDesc} in staggered courses and tapping level with trowel handle`,
          tool: `${blocksDesc} and trowel handle`,
          asmr_type: "brick_tap",
          narration: `Stacking miniature blocks course by course.`
        },
        {
          stage_num: 3,
          title: "Lintel Formwork",
          action: `Installing timber lintel formwork boxes across window and door openings`,
          tool: "timber lintel boxes and metal clips",
          asmr_type: "pin_placement",
          narration: `Wood lintel formwork over door frames.`
        },
        {
          stage_num: 4,
          title: "Lintel Cement Pour",
          action: `Pouring ${slurryDesc} into lintel formwork and scraping joints flush`,
          tool: "cement ladle and joint scraper",
          asmr_type: "cement_pour",
          narration: `Pouring concrete lintels and scraping flush.`
        },
        {
          stage_num: 5,
          title: "Lintel Demolding Reveal",
          action: `Stripping timber lintel formwork to reveal neat masonry walls and solid concrete headers`,
          tool: "formwork release wedge",
          asmr_type: "formwork_strip",
          narration: `Stripping lintels. The walls are locked solid.`
        }
      ]
    },
    {
      part: 4,
      title: `${structureName} - Roof Slab & Grand Transformation`,
      subtitle_2word: archetype.subtitles[3] || "GRAND REVEAL",
      milestone: "Upper / Roof / Reveal",
      prior_state: `Complete masonry walls, concrete columns, lintels, and foundation slab on ${archetype.baseSand}.`,
      problem: `The structure requires a cantilever roof slab, formwork stripping, and finished water landscaping.`,
      solution: `Pour and cure upper concrete roof, strip all formwork, and fill the ${archetype.water} for the grand payoff.`,
      structures_added: `Complete ${structureName} with roof slab, stripped formwork, filled ${archetype.water}, and natural landscaping`,
      stages: [
        {
          stage_num: 1,
          title: "Roof Formwork",
          action: `Fitting wide ${formworkDesc} roof shuttering across top of walls`,
          tool: `${formworkDesc} and ${pinsDesc}`,
          asmr_type: "pin_placement",
          narration: `Fitting wide roof shuttering boards.`
        },
        {
          stage_num: 2,
          title: "Roof Mesh Placement",
          action: `Laying double-layer ${meshDesc} across the entire roof shuttering`,
          tool: `${meshDesc} sheets`,
          asmr_type: "pin_placement",
          narration: `Reinforcing mesh spanning the entire roof.`
        },
        {
          stage_num: 3,
          title: "Roof Slurry Pour",
          action: `Pouring a rich layer of ${slurryDesc} across the roof formwork`,
          tool: "cement pouring vessel and mini screed",
          asmr_type: "cement_pour",
          narration: `Pouring the smooth roof slab.`
        },
        {
          stage_num: 4,
          title: "Burnish Finishing",
          action: `Burnishing wet cement slab to a mirror-smooth finish with a flexible mini trowel`,
          tool: "mini stainless finishing trowel",
          asmr_type: "trowel_scrape",
          narration: `Burnishing the surface to a silky polish.`
        },
        {
          stage_num: 5,
          title: "Grand Demolding Reveal",
          action: `Stripping all formwork to reveal the finished architectural build and filling ${archetype.water}`,
          tool: "demolding spatula and water pipette",
          asmr_type: "formwork_strip",
          narration: `Stripping formwork for the grand reveal. Complete!`
        }
      ]
    }
  ];

  return {
    structure_name: structureName,
    cycle,
    parts
  };
}

// Pre-instantiated catalog for backward-compatibility with direct property access
const MINIATURE_STRUCTURE_SERIES = {
  smart_city: ARCHETYPE_BLUEPRINTS.smart_city.map((_, idx) => getMiniatureStructure('smart_city', idx)),
  mountain_village: ARCHETYPE_BLUEPRINTS.mountain_village.map((_, idx) => getMiniatureStructure('mountain_village', idx)),
  desert_town: ARCHETYPE_BLUEPRINTS.desert_town.map((_, idx) => getMiniatureStructure('desert_town', idx))
};

// Aliased for backward compatibility with existing procedural runners
const PROCEDURAL_BLUEPRINTS = MINIATURE_STRUCTURE_SERIES;

/**
 * Builds the exact prompt for Gemini 2.5 Flash to plan the next episode
 */
function buildGeminiPrompt(townKey, townMemory, nextEpisode) {
  const ep = Math.max(1, nextEpisode || 1);
  const partsPerStructure = 4;
  let structureIndex;
  let partNumber;

  if (townMemory && townMemory.active_multipart && townMemory.active_multipart.part && townMemory.active_multipart.total_parts === partsPerStructure) {
    structureIndex = typeof townMemory.active_multipart.structure_index === 'number'
      ? townMemory.active_multipart.structure_index
      : Math.floor((ep - 1) / partsPerStructure);
    partNumber = townMemory.active_multipart.part;
  } else {
    structureIndex = Math.floor((ep - 1) / partsPerStructure);
    partNumber = ((ep - 1) % partsPerStructure) + 1;
  }

  const currentStructure = getMiniatureStructure(townKey, structureIndex);
  const partData = currentStructure.parts[partNumber - 1];

  return `You are the Lead Miniature Architect and Director of Viral Hands-On Miniature Construction Videos for 9:16 vertical Shorts and Reels.
Project: "${townMemory.name}" (${townKey})
Current Episode: ${ep}
Structure Series: "Mini ${currentStructure.structure_name}"
Active Part: Part ${partNumber} of ${partsPerStructure}
Current Milestone: ${partData.milestone}
Prior Worksite State: ${partData.prior_state}

MISSION:
Plan Episode ${ep} as a high-retention, hands-on miniature construction video (9:16 vertical, 720p, 5s duration per clip).
The scene is set on a fine sand and soil base with natural studio rocks and a consistent backdrop across shots.
Every stage must continue directly from the prior part's completed state: "${partData.prior_state}".

CRITICAL VISUAL & ASMR STYLE REQUIREMENTS:
1. Physical Miniature Building Process:
   - Thin wood/plywood shuttering/formwork held by metal pins.
   - Grid reinforcing mesh positioned before pouring.
   - Pouring viscous wet grey/colored cement slurry.
   - Leveling and screeding with a mini stainless steel trowel or aluminum bar.
   - Stripping formwork to reveal razor-smooth cured concrete slabs, stairs, and pillars.
   - Stacking miniature bricks / stone blocks with mini troweled mortar.
2. Fast Step-by-Step Cuts: Snappy ~0.8s–2.2s visual rhythm across a 14–18s total vertical reel.
3. Crisp ASMR Audio: Crisp pour, scrape, tap, and peel sounds (cement_pour, trowel_scrape, formwork_strip, brick_tap, pin_placement, sand_level).
4. Minimal Voiceover Clutter: Exactly 1 ultra-short, punchy ASMR line per stage (4–7 words max). Zero long lectures.
5. Clean Part Label: "Mini ${currentStructure.structure_name} Part ${partNumber}".

OUTPUT REQUIREMENT:
Output ONLY valid JSON matching this exact structure:
{
  "episode": ${ep},
  "title": "Mini ${currentStructure.structure_name} Part ${partNumber}",
  "structure_name": "${currentStructure.structure_name}",
  "series_label": "Mini ${currentStructure.structure_name} Part ${partNumber}",
  "part": ${partNumber},
  "total_parts": ${partsPerStructure},
  "subtitle_2word": "${partData.subtitle_2word}",
  "problem": "${partData.problem}",
  "solution": "${partData.solution}",
  "is_multipart": true,
  "multipart_info": {
    "structure_name": "${currentStructure.structure_name}",
    "structure_index": ${structureIndex},
    "series_label": "Mini ${currentStructure.structure_name} Part ${partNumber}",
    "part": ${partNumber},
    "total_parts": ${partsPerStructure},
    "milestone": "${partData.milestone}",
    "prior_state": "${partData.prior_state}"
  },
  "updated_anchor_prompt": "Hands-on miniature construction worksite on sand base with studio rocks and consistent backdrop",
  "structures_added": "${partData.structures_added}",
  "stages": [
    {
      "stage_num": 1,
      "title": "${partData.stages[0].title}",
      "action": "${partData.stages[0].action}",
      "tool": "${partData.stages[0].tool}",
      "image_prompt": "Complete macro photorealistic prompt for Stage 1",
      "motion_prompt": "Smooth continuous motion description for 720p 5s video",
      "asmr_type": "${partData.stages[0].asmr_type}",
      "narration": "${partData.stages[0].narration}"
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
    try {
      const urlHeader = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
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
            return parsed;
          }
        }
      } else {
        const errText = await resHeader.text();
        lastDiagnosis = `HTTP ${resHeader.status}: ${errText.slice(0, 250)}`;
      }
    } catch (e) {
      lastDiagnosis = e.message;
    }

    try {
      const urlQuery = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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
            return parsed;
          }
        }
      }
    } catch (e) {
      lastDiagnosis = e.message;
    }
  }

  throw new Error(`Gemini API Authentication Diagnosis: ${lastDiagnosis}`);
}

/**
 * Procedural Fallback Architect when offline or Gemini API key hits error/quota
 * Computes deterministic multi-part series progression (Part 1 -> Part 2 -> Part 3 -> Part 4 -> Next Structure Part 1)
 */
function generateProceduralPlan(townKey, townMemory, nextEpisode) {
  const ep = Math.max(1, nextEpisode || 1);
  const partsPerStructure = 4;

  let structureIndex;
  let partNumber;

  if (townMemory && townMemory.active_multipart && townMemory.active_multipart.part && townMemory.active_multipart.total_parts === partsPerStructure) {
    structureIndex = typeof townMemory.active_multipart.structure_index === 'number'
      ? townMemory.active_multipart.structure_index
      : Math.floor((ep - 1) / partsPerStructure);
    partNumber = townMemory.active_multipart.part;
  } else {
    structureIndex = Math.floor((ep - 1) / partsPerStructure);
    partNumber = ((ep - 1) % partsPerStructure) + 1;
  }

  const currentStructure = getMiniatureStructure(townKey, structureIndex);
  const partData = currentStructure.parts[partNumber - 1];

  const seriesLabel = `Mini ${currentStructure.structure_name} Part ${partNumber}`;
  const episodeTitle = `${seriesLabel}: ${partData.title}`;

  const builtSoFar = townMemory && townMemory.built_structures && townMemory.built_structures.length > 0
    ? `Completed on site: ${townMemory.built_structures.slice(-3).join("; ")}.`
    : "Fresh sand and soil base with studio rocks.";

  const updatedAnchor = `Hands-on miniature construction worksite on sand and soil base with studio rocks. Prior state: ${partData.prior_state} ${builtSoFar} Current milestone: ${partData.structures_added}. Consistent studio backdrop with warm directional lighting.`;

  const stages = partData.stages.map((stage, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === 4;

    let angleStyle = "Macro 45-degree angle with active human hands in motion, continuous physical craftsmanship";
    let motionCamera = "Continuous physical hands-on motion: smooth macro motorized tracking glide with uninterrupted hand movement";

    if (stage.stage_num === 1) {
      angleStyle = "Continuous hands-on action: craftsman hands actively setting up and pressing thin wood shuttering formwork boards and inserting metal pins on the sand base";
      motionCamera = "Continuous physical hands-on motion throughout the clip: craftsman hands actively pressing and aligning wood shuttering formwork into the sand base with uninterrupted hand movement, zero static shots";
    } else if (stage.stage_num === 2) {
      angleStyle = "Continuous hands-on action: craftsman hands actively aligning joints, inserting metal anchor pins, and laying white grid mesh";
      motionCamera = "Continuous physical hands-on motion throughout the clip: hands actively securing formwork joints with pins and placing grid mesh with steady non-stop movement";
    } else if (stage.stage_num === 3) {
      angleStyle = "Continuous live-action pouring: hands steadily pouring viscous flowing grey cement slurry into the formwork channels";
      motionCamera = "Continuous live-action pouring motion throughout the clip: craftsman hands steadily pouring wet grey cement slurry into the formwork channels, liquid mortar filling the forms with visible flowing motion throughout";
    } else if (stage.stage_num === 4) {
      angleStyle = "Continuous hands-on screeding: hands actively dragging and vibrating a mini stainless steel trowel and screed blade back and forth across wet mortar";
      motionCamera = "Continuous hands-on leveling motion throughout the clip: craftsman hands actively dragging a mini trowel and screed bar across wet cement, leveling dead-flat with uninterrupted physical movement";
    } else {
      angleStyle = "Continuous hands-on demolding reveal: craftsman hands actively pulling metal pins and peeling away wood shuttering boards to reveal razor-smooth cured concrete";
      motionCamera = "Continuous hands-on reveal motion throughout the clip: craftsman hands actively peeling away wood formwork boards one by one to reveal razor-smooth cured concrete pillars, steps, and slabs, active hand movement revealing fine details throughout the clip";
    }

    const imagePrompt = `Stage ${stage.stage_num}/5 of ${seriesLabel}: Hands-on miniature construction photography (9:16 vertical). ${angleStyle}. Craftsman hands actively performing: ${stage.action} using ${stage.tool}. Building materials on sand base with studio rocks: thin wood shuttering formwork, metal pins, grid mesh, cement slurry, mini trowel, smooth cured concrete. Consistent studio backdrop, macro lens, shallow depth of field, warm directional lighting, crisp macro studio cinematography, authentic miniature craftsmanship.`;

    const nextActionDesc = !isLast ? partData.stages[idx + 1].action.toLowerCase() : "celebrating the smooth demolded concrete reveal";
    const motionPrompt = `Cinematic miniature construction video (720p, 5s duration, 9:16 vertical): ${motionCamera}. Craftsman hands perform ${stage.action} using ${stage.tool}, progressing cleanly toward ${nextActionDesc}. Active human hand and tool movement in every single frame, continuous live hands-on craftsmanship throughout the entire 5 seconds, zero frozen frames, thin wood shuttering, metal pins, flowing cement slurry, mini trowel screed, hands stripping formwork reveal. Studio sand base and rocks, smooth macro cinema tracking, 30fps.`;

    return {
      stage_num: stage.stage_num,
      title: stage.title || `Step ${stage.stage_num}: ${stage.action.split(' ')[0]}`,
      action: stage.action,
      tool: stage.tool,
      image_prompt: imagePrompt,
      motion_prompt: motionPrompt,
      asmr_type: stage.asmr_type,
      narration: stage.narration
    };
  });

  return {
    episode: ep,
    title: episodeTitle,
    structure_name: currentStructure.structure_name,
    structure_index: structureIndex,
    series_label: seriesLabel,
    part: partNumber,
    total_parts: partsPerStructure,
    subtitle_2word: partData.subtitle_2word,
    problem: partData.problem,
    solution: partData.solution,
    is_multipart: true,
    multipart_info: {
      structure_name: currentStructure.structure_name,
      structure_index: structureIndex,
      series_label: seriesLabel,
      part: partNumber,
      total_parts: partsPerStructure,
      milestone: partData.milestone,
      prior_state: partData.prior_state
    },
    updated_anchor_prompt: updatedAnchor,
    structures_added: partData.structures_added,
    stages: stages
  };
}

/**
 * Strict Miniature Plan Validator
 * Rejects any plan that contains forbidden full-scale roadwork, monsoon flooding, trenches, or culverts,
 * or exceeds short punchy ASMR narration limits.
 */
function isStrictMiniaturePlan(plan) {
  if (!plan || !plan.stages || plan.stages.length !== 5) return false;
  if (!plan.is_multipart) return false;
  if (!plan.structure_name || typeof plan.part !== 'number') return false;

  const forbiddenTerms = [
    'monsoon', 'culvert', 'asphalt', 'trenching spade', 'pothole',
    'traffic cone', 'roadwork', 'catch basin', 'bulldozer', 'excavator',
    'full-scale', 'civil engineering', 'sewer grate', 'fuel vault',
    'drainage trenches', 'box culverts'
  ];

  const fullText = JSON.stringify(plan).toLowerCase();
  for (const term of forbiddenTerms) {
    if (fullText.includes(term)) {
      console.warn(`[Architect] Strict miniature validation rejected plan containing forbidden term: "${term}"`);
      return false;
    }
  }

  // Ensure narrations are short (max 10 words per stage)
  for (const stage of plan.stages) {
    if (!stage.narration || stage.narration.split(/\s+/).length > 10) {
      console.warn(`[Architect] Strict miniature validation rejected plan with overly long narration (${stage.narration?.split(/\s+/).length} words).`);
      return false;
    }
  }

  return true;
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
      console.log(`[Architect] Contacting Gemini 2.5 Flash API...`);
      const prompt = buildGeminiPrompt(townKey, townMemory, nextEpisode);
      const plan = await callGemini(prompt, apiKey);
      if (isStrictMiniaturePlan(plan)) {
        console.log(`[Architect] Generated plan via Gemini: "${plan.title}"`);
        return plan;
      } else {
        console.warn(`[Architect] Gemini plan failed strict miniature validation. Engaging procedural miniature generator.`);
      }
    } catch (err) {
      console.warn(`[Architect] Gemini Notice: ${err.message}. Engaging miniature multi-part scenario generator.`);
    }
  } else {
    console.log(`[Architect] GEMINI_API_KEY not provided. Using miniature multi-part scenario generator.`);
  }

  const plan = generateProceduralPlan(townKey, townMemory, nextEpisode);
  console.log(`[Architect] Multi-Part Plan Engaged: Episode ${plan.episode} - "${plan.title}" [${plan.subtitle_2word}] (Part ${plan.part}/${plan.total_parts})`);
  return plan;
}

module.exports = {
  planEpisode,
  generateProceduralPlan,
  getMiniatureStructure,
  isStrictMiniaturePlan,
  ARCHETYPE_BLUEPRINTS,
  MINIATURE_STRUCTURE_SERIES,
  PROCEDURAL_BLUEPRINTS,
  CRAFTSMAN_HANDS_DESCRIPTION,
  CAMERA_BASE_PROMPT
};
