const fs = require('fs');
const path = require('path');

/**
 * Town Architect Engine (Gemini 2.5 Flash Free API + Multi-Part Miniature Construction Series)
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
 */

const CRAFTSMAN_HANDS_DESCRIPTION = 
  "Authentic craftsman hands with natural skin texture and rolled-up dark denim work sleeves, performing hands-on miniature construction using real miniature tools, thin plywood shuttering, metal pins, white grid mesh, grey cement slurry, and miniature bricks on a fine sand and soil base with studio rocks";

const CAMERA_BASE_PROMPT = 
  "Cinematic 720p, 5s duration miniature construction cinematography (9:16 vertical): macro lens with authentic shallow depth of field, steady eye-level and 45-degree angle focusing on hands-on building on a sand base with studio rocks and consistent backdrop, warm directional studio lighting, Sony FX6 cinema camera, authentic physical craftsmanship";

// Comprehensive multi-part miniature construction series catalog
// Milestone progression: Part 1 Foundation/Stairs -> Part 2 Deck/Columns -> Part 3 Walls/Blocks -> Part 4 Upper/Roof/Reveal
const MINIATURE_STRUCTURE_SERIES = {
  smart_city: [
    {
      structure_name: "Modern Villa",
      parts: [
        {
          part: 1,
          title: "Foundation & Pool Excavation",
          subtitle_2word: "VILLA FOUNDATION",
          milestone: "Foundation / Stairs",
          prior_state: "Raw leveled fine sand and soil base surrounded by natural studio rocks.",
          problem: "The sand base requires precise wood shuttering formwork and reinforced cement foundation slabs for the villa.",
          solution: "Pin thin plywood formwork, lay white grid mesh, pour grey cement slurry, and strip formwork to reveal smooth stairs and slab.",
          structures_added: "Smooth concrete foundation slab and entrance stairs on leveled sand base with studio rocks",
          stages: [
            {
              stage_num: 1,
              title: "Sand Leveling",
              action: "Leveling fine sand and soil base and placing natural studio rocks around the perimeter",
              tool: "miniature sand rake and brass level",
              asmr_type: "sand_level",
              narration: "Leveling the sand base and studio rocks."
            },
            {
              stage_num: 2,
              title: "Formwork & Pins",
              action: "Assembling thin plywood shuttering formwork and securing with slim metal pins",
              tool: "thin plywood shuttering boards and metal pins",
              asmr_type: "pin_placement",
              narration: "Thin plywood formwork pinned in place."
            },
            {
              stage_num: 3,
              title: "White Grid Mesh",
              action: "Positioning miniature white grid reinforcing mesh flat inside the formwork",
              tool: "white grid mesh and tweezers",
              asmr_type: "pin_placement",
              narration: "White grid mesh laid inside the frame."
            },
            {
              stage_num: 4,
              title: "Slurry Pour & Screed",
              action: "Pouring viscous grey cement slurry into the formwork and smoothing with a mini trowel",
              tool: "cement pouring vessel and mini stainless trowel",
              asmr_type: "cement_pour",
              narration: "Pouring the wet grey cement slurry."
            },
            {
              stage_num: 5,
              title: "Formwork Strip Reveal",
              action: "Stripping the plywood shuttering to reveal razor-smooth cured concrete foundation and stairs",
              tool: "pin puller and gentle hand strip",
              asmr_type: "formwork_strip",
              narration: "Stripping the formwork. Look at this finish!"
            }
          ]
        },
        {
          part: 2,
          title: "Pool Formwork & Ground Columns",
          subtitle_2word: "CONCRETE COLUMNS",
          milestone: "Deck / Columns",
          prior_state: "Cured smooth concrete foundation slab and entrance stairs on leveled sand base.",
          problem: "The villa foundation slab needs structural load-bearing columns and a ground terrace deck.",
          solution: "Set vertical plywood column formwork with metal pins, pour grey cement slurry, and demold sleek concrete pillars.",
          structures_added: "Erected smooth concrete structural columns and ground patio deck slab",
          stages: [
            {
              stage_num: 1,
              title: "Column Formwork",
              action: "Erecting vertical plywood column formwork boxes over foundation anchor pins",
              tool: "vertical timber shuttering boxes and pins",
              asmr_type: "pin_placement",
              narration: "Setting column formwork over anchor pins."
            },
            {
              stage_num: 2,
              title: "Column Cement Pour",
              action: "Pouring grey cement slurry into each column box and tamping with a metal pin",
              tool: "funnel and miniature tamp rod",
              asmr_type: "cement_pour",
              narration: "Pouring cement slurry into each column."
            },
            {
              stage_num: 3,
              title: "Deck Shuttering & Mesh",
              action: "Laying horizontal plywood deck shuttering and placing white grid mesh between columns",
              tool: "plywood decking sheets and white mesh",
              asmr_type: "pin_placement",
              narration: "Deck shuttering and white mesh in position."
            },
            {
              stage_num: 4,
              title: "Deck Troweling",
              action: "Pouring grey cement slurry across the deck formwork and leveling with an aluminum screed bar",
              tool: "mini aluminum screed bar and trowel",
              asmr_type: "trowel_scrape",
              narration: "Screeding the deck slab dead-flat."
            },
            {
              stage_num: 5,
              title: "Column Demolding Reveal",
              action: "Peeling off the column and deck wood shuttering to reveal sleek concrete columns and terrace slab",
              tool: "demolding spatula and gentle peel",
              asmr_type: "formwork_strip",
              narration: "Stripping formwork. Sleek concrete pillars revealed."
            }
          ]
        },
        {
          part: 3,
          title: "Lower Floor Walls & Brickwork",
          subtitle_2word: "BRICK WALLS",
          milestone: "Walls / Blocks",
          prior_state: "Cured concrete columns, terrace deck, and foundation slab on sand base.",
          problem: "The concrete columns require structural miniature brick perimeter walls and reinforced lintels.",
          solution: "Stack miniature bricks with troweled cement mortar, place timber lintel boxes, and cast solid concrete headers.",
          structures_added: "Stacked miniature brick perimeter walls with cast concrete window and door lintels",
          stages: [
            {
              stage_num: 1,
              title: "Mortar Bedding",
              action: "Spreading a thin bed of grey cement mortar onto the concrete deck using a mini pointed trowel",
              tool: "mini pointed stainless steel trowel",
              asmr_type: "trowel_scrape",
              narration: "Spreading fresh mortar on the concrete deck."
            },
            {
              stage_num: 2,
              title: "Brick Stacking",
              action: "Stacking individual miniature red bricks in staggered courses and tapping level with trowel handle",
              tool: "miniature bricks and trowel handle",
              asmr_type: "brick_tap",
              narration: "Stacking miniature bricks course by course."
            },
            {
              stage_num: 3,
              title: "Lintel Formwork",
              action: "Installing small timber lintel formwork boxes across window and door openings",
              tool: "timber lintel boxes and metal clips",
              asmr_type: "pin_placement",
              narration: "Wood lintel formwork over door frames."
            },
            {
              stage_num: 4,
              title: "Lintel Cement Pour",
              action: "Pouring grey cement slurry into the lintel formwork and scraping joints flush",
              tool: "cement ladle and joint scraper",
              asmr_type: "cement_pour",
              narration: "Pouring concrete lintels and scraping flush."
            },
            {
              stage_num: 5,
              title: "Lintel Demolding Reveal",
              action: "Stripping the timber lintel formwork to reveal neat brick walls and solid concrete headers",
              tool: "formwork release wedge",
              asmr_type: "formwork_strip",
              narration: "Stripping lintels. The walls are locked solid."
            }
          ]
        },
        {
          part: 4,
          title: "Upper Cantilever Roof & Pool Reveal",
          subtitle_2word: "VILLA REVEAL",
          milestone: "Upper / Roof / Reveal",
          prior_state: "Complete brick walls, concrete columns, lintels, and foundation slab on sand base.",
          problem: "The villa structure requires a modern cantilever roof slab, formwork stripping, and finished pool detailing.",
          solution: "Pour and cure the upper concrete roof, strip all formwork, and fill the pool for the grand transformation payoff.",
          structures_added: "Complete Modern Villa with cantilever roof, stripped formwork, filled pool, and studio rock landscaping",
          stages: [
            {
              stage_num: 1,
              title: "Cantilever Formwork",
              action: "Fitting wide plywood cantilever roof formwork across the top of the brick walls",
              tool: "thin plywood roof shuttering and metal pins",
              asmr_type: "pin_placement",
              narration: "Fitting the wide cantilever roof shuttering."
            },
            {
              stage_num: 2,
              title: "Roof Mesh Placement",
              action: "Laying double-layer white grid reinforcing mesh across the entire roof shuttering",
              tool: "white grid mesh sheets",
              asmr_type: "pin_placement",
              narration: "White grid mesh spanning the entire roof."
            },
            {
              stage_num: 3,
              title: "Roof Slurry Pour",
              action: "Pouring a rich layer of grey cement slurry across the roof formwork",
              tool: "cement pouring vessel and mini screed",
              asmr_type: "cement_pour",
              narration: "Pouring the smooth grey roof slab."
            },
            {
              stage_num: 4,
              title: "Burnish Finishing",
              action: "Burnishing the wet cement slab to a mirror-smooth finish with a flexible mini trowel",
              tool: "mini stainless finishing trowel",
              asmr_type: "trowel_scrape",
              narration: "Burnishing the surface to a silky polish."
            },
            {
              stage_num: 5,
              title: "Grand Demolding Reveal",
              action: "Stripping all roof formwork to reveal the finished architectural villa and filling the pool with crystal water",
              tool: "demolding spatula and water pipette",
              asmr_type: "formwork_strip",
              narration: "Stripping formwork for the grand reveal. Complete!"
            }
          ]
        }
      ]
    },
    {
      structure_name: "Glass Terrace House",
      parts: [
        {
          part: 1,
          title: "Retaining Formwork & Step Footings",
          subtitle_2word: "STEP FOOTINGS",
          milestone: "Foundation / Stairs",
          prior_state: "Raw terraced sand base surrounded by studio rocks.",
          problem: "The multi-tier terrace requires curved plywood shuttering and poured concrete footing steps.",
          solution: "Assemble curved shuttering with pins, lay white grid mesh, pour grey cement slurry, and reveal smooth steps.",
          structures_added: "Curved concrete foundation terrace and step footings",
          stages: [
            { stage_num: 1, title: "Base Prep", action: "Grading stepped sand terraces and bedding studio slate rocks", tool: "mini sand trowel", asmr_type: "sand_level", narration: "Grading stepped terraces on the sand base." },
            { stage_num: 2, title: "Curved Formwork", action: "Bending thin plywood shuttering strips and locking with metal pins", tool: "curved plywood strips and pins", asmr_type: "pin_placement", narration: "Curved plywood shuttering pinned tight." },
            { stage_num: 3, title: "Grid Mesh", action: "Clipping white grid rebar mesh into the stepped foundation channels", tool: "mesh snips and tweezers", asmr_type: "pin_placement", narration: "White reinforcing mesh laid in channels." },
            { stage_num: 4, title: "Slurry Pour", action: "Pouring grey cement slurry into the curved steps and smoothing", tool: "cement pouring spout and mini trowel", asmr_type: "cement_pour", narration: "Pouring grey cement slurry into the steps." },
            { stage_num: 5, title: "Strip Reveal", action: "Stripping wood shuttering to reveal crisp curved concrete terrace steps", tool: "pin puller and strip knife", asmr_type: "formwork_strip", narration: "Stripping formwork. Curved steps revealed!" }
          ]
        },
        {
          part: 2,
          title: "Cantilever Columns & Floor Deck",
          subtitle_2word: "CANTILEVER DECK",
          milestone: "Deck / Columns",
          prior_state: "Curved concrete foundation terrace and step footings.",
          problem: "The second floor needs cantilever column supports and a suspended terrace deck.",
          solution: "Cast twin concrete pillars with rebar pins, lay deck shuttering, and screed the floor slab.",
          structures_added: "Reinforced cantilever concrete pillars and suspended floor deck",
          stages: [
            { stage_num: 1, title: "Column Shuttering", action: "Clamping vertical column boxes over anchor pins", tool: "column shuttering boxes", asmr_type: "pin_placement", narration: "Clamping column boxes over the pins." },
            { stage_num: 2, title: "Pillar Pour", action: "Pouring grey cement slurry into the pillars", tool: "mini cement funnel", asmr_type: "cement_pour", narration: "Pouring cement slurry into the pillars." },
            { stage_num: 3, title: "Cantilever Shuttering", action: "Extending cantilever plywood deck shuttering with white mesh", tool: "cantilever deck forms and mesh", asmr_type: "pin_placement", narration: "Cantilever deck shuttering in position." },
            { stage_num: 4, title: "Deck Screeding", action: "Pouring and screeding the terrace slab with aluminum bar", tool: "mini aluminum screed", asmr_type: "trowel_scrape", narration: "Screeding the suspended terrace slab." },
            { stage_num: 5, title: "Pillar Strip", action: "Stripping column boxes to reveal silky smooth concrete pillars", tool: "formwork release lever", asmr_type: "formwork_strip", narration: "Demolding sleek concrete cantilever pillars." }
          ]
        },
        {
          part: 3,
          title: "Miniature Blockwork & Frame Lintels",
          subtitle_2word: "BLOCKWORK WALLS",
          milestone: "Walls / Blocks",
          prior_state: "Reinforced cantilever concrete pillars and suspended floor deck.",
          problem: "The floor deck requires miniature perimeter walls, glass opening frames, and solid lintels.",
          solution: "Stack miniature grey blocks with mortar, position lintel formwork boxes, and cast headers.",
          structures_added: "Precision miniature blockwork walls with cast concrete window lintels",
          stages: [
            { stage_num: 1, title: "Mortar Line", action: "Troweling grey mortar along the perimeter deck line", tool: "mini pointer trowel", asmr_type: "trowel_scrape", narration: "Laying mortar along the terrace perimeter." },
            { stage_num: 2, title: "Block Stacking", action: "Setting miniature concrete blocks in level courses", tool: "miniature blocks and mallet", asmr_type: "brick_tap", narration: "Setting miniature concrete blocks in line." },
            { stage_num: 3, title: "Lintel Framing", action: "Placing wood lintel boxes across panoramic window spans", tool: "wood lintels and pins", asmr_type: "pin_placement", narration: "Formwork boxes over window openings." },
            { stage_num: 4, title: "Lintel Pour", action: "Filling lintel boxes with dense grey cement mix", tool: "pouring spoon and tamper", asmr_type: "cement_pour", narration: "Filling the window lintels with cement." },
            { stage_num: 5, title: "Lintel Strip", action: "Stripping lintel shuttering to reveal clean window headers", tool: "release wedge", asmr_type: "formwork_strip", narration: "Stripping formwork. Window frames locked." }
          ]
        },
        {
          part: 4,
          title: "Rooftop Slab & Terrace Pool Reveal",
          subtitle_2word: "TERRACE REVEAL",
          milestone: "Upper / Roof / Reveal",
          prior_state: "Miniature blockwork walls with cast concrete window lintels.",
          problem: "The structure requires a flat roof slab, formwork strip, and infinity edge water fill.",
          solution: "Cast the flat roof slab with white mesh, strip all forms, and fill the rooftop terrace pool.",
          structures_added: "Complete Glass Terrace House with roof deck, filled terrace pool, and studio rock landscaping",
          stages: [
            { stage_num: 1, title: "Roof Formwork", action: "Laying thin plywood roof sheets across the walls", tool: "roof plywood sheets", asmr_type: "pin_placement", narration: "Placing thin plywood roof sheets." },
            { stage_num: 2, title: "Roof Mesh", action: "Spreading white grid mesh over the entire roof area", tool: "white grid mesh", asmr_type: "pin_placement", narration: "Spreading white reinforcing mesh." },
            { stage_num: 3, title: "Roof Pour", action: "Pouring grey cement slurry for the flat roof deck", tool: "cement pouring vessel", asmr_type: "cement_pour", narration: "Pouring the smooth flat roof deck." },
            { stage_num: 4, title: "Trowel Burnish", action: "Burnishing roof edges to an ultra-clean chamfer", tool: "chamfer trowel", asmr_type: "trowel_scrape", narration: "Burnishing the roof edges smooth." },
            { stage_num: 5, title: "Final Reveal", action: "Stripping all formwork and filling terrace pool with clear water", tool: "hand strip and water filler", asmr_type: "formwork_strip", narration: "Stripping formwork. Grand reveal complete!" }
          ]
        }
      ]
    }
  ],

  mountain_village: [
    {
      structure_name: "Stone Arch Bridge",
      parts: [
        {
          part: 1,
          title: "Riverbed Abutments & Footings",
          subtitle_2word: "BRIDGE FOOTING",
          milestone: "Foundation / Stairs",
          prior_state: "Raw sand riverbed flanked by natural mountain studio rocks.",
          problem: "The mountain ravine needs solid concrete abutment footings pinned into the sand base.",
          solution: "Erect timber box shuttering, secure with metal pins, place white mesh, pour cement slurry, and reveal smooth abutments.",
          structures_added: "Dual concrete riverbed abutment footing slabs on sand and rock base",
          stages: [
            { stage_num: 1, title: "Sand Bedding", action: "Grading sand riverbed and placing studio slate boulders along banks", tool: "mini gravel rake and level", asmr_type: "sand_level", narration: "Grading riverbed sand and studio rocks." },
            { stage_num: 2, title: "Abutment Formwork", action: "Pinning thin plywood abutment boxes on both riverbanks", tool: "plywood box shuttering and pins", asmr_type: "pin_placement", narration: "Pinning abutment formwork on both banks." },
            { stage_num: 3, title: "Rebar Mesh", action: "Inserting white grid mesh down into the abutment footings", tool: "grid mesh and tweezers", asmr_type: "pin_placement", narration: "Inserting white grid reinforcing mesh." },
            { stage_num: 4, title: "Cement Pour", action: "Pouring viscous grey cement slurry into the footing boxes", tool: "cement pourer and mini spatula", asmr_type: "cement_pour", narration: "Pouring viscous grey cement slurry." },
            { stage_num: 5, title: "Strip Reveal", action: "Stripping wood shuttering to reveal massive smooth concrete abutments", tool: "pin puller and strip wedge", asmr_type: "formwork_strip", narration: "Stripping formwork. Rock-solid footings revealed!" }
          ]
        },
        {
          part: 2,
          title: "Timber Arch Falsework & Stone Vaulting",
          subtitle_2word: "ARCH VAULTING",
          milestone: "Deck / Columns",
          prior_state: "Dual concrete riverbed abutment footing slabs on sand and rock base.",
          problem: "The ravine gap requires a semicircular arch vault spanned by curved timber centering falsework.",
          solution: "Erect curved timber arch falsework with pins, stack wedge-shaped miniature stones, and lock with keystone.",
          structures_added: "Self-supporting curved stone arch vault with locked center keystone",
          stages: [
            { stage_num: 1, title: "Arch Falsework", action: "Positioning curved plywood arch centering falsework across abutments", tool: "curved timber falsework and pins", asmr_type: "pin_placement", narration: "Positioning curved timber arch falsework." },
            { stage_num: 2, title: "Mortar Bed", action: "Applying grey cement mortar along the curved timber centering", tool: "mini pointed trowel", asmr_type: "trowel_scrape", narration: "Applying mortar along the arch centering." },
            { stage_num: 3, title: "Stone Arch", action: "Stacking miniature natural stone voussoirs symmetrically up both sides", tool: "cut stone blocks and tweezers", asmr_type: "brick_tap", narration: "Stacking stone blocks up both sides." },
            { stage_num: 4, title: "Keystone Lock", action: "Tapping the center keystone stone firmly into the arch crown", tool: "mini setting mallet", asmr_type: "brick_tap", narration: "Tapping the keystone into the crown." },
            { stage_num: 5, title: "Falsework Drop", action: "Striking the timber centering pins to reveal the freestanding stone arch", tool: "pin knock tool", asmr_type: "formwork_strip", narration: "Dropping falsework. The stone arch stands!" }
          ]
        },
        {
          part: 3,
          title: "Spandrel Blockwork & Deck Formwork",
          subtitle_2word: "ROADBED DECK",
          milestone: "Walls / Blocks",
          prior_state: "Self-supporting curved stone arch vault with locked center keystone.",
          problem: "The arch requires vertical spandrel retaining walls and a level roadbed deck formwork.",
          solution: "Build stone spandrel walls, lay deck wood shuttering with white mesh, and pour roadbed cement.",
          structures_added: "Stone spandrel walls with reinforced concrete roadbed deck slab",
          stages: [
            { stage_num: 1, title: "Spandrel Walls", action: "Mortaring miniature stone blocks to build vertical spandrel walls", tool: "mini trowel and stone blocks", asmr_type: "brick_tap", narration: "Building vertical stone spandrel walls." },
            { stage_num: 2, title: "Deck Shuttering", action: "Fitting thin plywood road deck shuttering along the bridge span", tool: "deck shuttering and pins", asmr_type: "pin_placement", narration: "Fitting thin plywood deck shuttering." },
            { stage_num: 3, title: "Deck Mesh", action: "Laying white grid mesh across the bridge roadbed channel", tool: "white grid mesh", asmr_type: "pin_placement", narration: "White grid mesh laid along the deck." },
            { stage_num: 4, title: "Roadbed Pour", action: "Pouring grey cement slurry and screeding road surface dead-flat", tool: "cement pouring spout and mini screed", asmr_type: "cement_pour", narration: "Pouring and screeding the roadbed slurry." },
            { stage_num: 5, title: "Deck Strip", action: "Stripping deck shuttering to reveal a flat, seamless road surface", tool: "strip blade", asmr_type: "formwork_strip", narration: "Stripping deck forms. Smooth roadway revealed!" }
          ]
        },
        {
          part: 4,
          title: "Parapets, Formwork Strip & Stream Reveal",
          subtitle_2word: "BRIDGE REVEAL",
          milestone: "Upper / Roof / Reveal",
          prior_state: "Stone spandrel walls with reinforced concrete roadbed deck slab.",
          problem: "The bridge requires safety parapets, final formwork stripping, and flowing mountain water.",
          solution: "Set miniature stone parapets, remove all remaining falsework, and flow water under the arch.",
          structures_added: "Complete Stone Arch Bridge with parapets, crystal mountain stream, and natural rocks",
          stages: [
            { stage_num: 1, title: "Parapet Bedding", action: "Spreading mortar lines along both outer edges of the bridge deck", tool: "mini trowel", asmr_type: "trowel_scrape", narration: "Spreading mortar along the bridge edges." },
            { stage_num: 2, title: "Stone Parapets", action: "Setting miniature carved stone parapet capstones along both sides", tool: "parapet stones and tweezers", asmr_type: "brick_tap", narration: "Setting miniature stone parapet rails." },
            { stage_num: 3, title: "Final Stripping", action: "Stripping all remaining pins and wood braces from under the bridge", tool: "pin puller", asmr_type: "formwork_strip", narration: "Stripping all remaining wooden braces." },
            { stage_num: 4, title: "Stone Pointing", action: "Pointing stone joints flush with a fine miniature tuck trowel", tool: "tuck pointing trowel", asmr_type: "trowel_scrape", narration: "Pointing stone joints clean and flush." },
            { stage_num: 5, title: "Stream Reveal", action: "Releasing crystal clear water to flow under the completed stone arch", tool: "water pipette and river pebbles", asmr_type: "formwork_strip", narration: "Stream flowing under the arch. Completed bridge!" }
          ]
        }
      ]
    }
  ],

  desert_town: [
    {
      structure_name: "Desert Oasis Villa",
      parts: [
        {
          part: 1,
          title: "Clay Hardpan Base & Pool Formwork",
          subtitle_2word: "OASIS BASE",
          milestone: "Foundation / Stairs",
          prior_state: "Raw reddish sand base surrounded by desert studio rocks.",
          problem: "The arid sand base requires sunken pool formwork and reinforced concrete foundation footings.",
          solution: "Carve sunken pool basin in sand, pin thin plywood shuttering, place white mesh, pour cement, and strip reveal.",
          structures_added: "Sunken oasis pool foundation basin and terraced courtyard slab",
          stages: [
            { stage_num: 1, title: "Sand Grading", action: "Grading reddish desert sand and setting desert studio rocks", tool: "mini sand scraper", asmr_type: "sand_level", narration: "Grading desert sand and studio rocks." },
            { stage_num: 2, title: "Pool Shuttering", action: "Assembling thin wood formwork for the sunken pool basin and stairs", tool: "thin wood shuttering and metal pins", asmr_type: "pin_placement", narration: "Wood formwork pinned for the pool basin." },
            { stage_num: 3, title: "White Mesh", action: "Laying white grid rebar mesh into the pool floor and steps", tool: "white grid mesh and clips", asmr_type: "pin_placement", narration: "White grid mesh laid inside the pool." },
            { stage_num: 4, title: "Slurry Pour", action: "Pouring grey cement slurry into the pool walls and troweling smooth", tool: "cement pouring pot and mini trowel", asmr_type: "cement_pour", narration: "Pouring grey cement slurry into the pool." },
            { stage_num: 5, title: "Strip Reveal", action: "Stripping wood shuttering to reveal smooth concrete pool basin and stairs", tool: "pin puller and strip lever", asmr_type: "formwork_strip", narration: "Stripping formwork. Smooth pool basin revealed!" }
          ]
        },
        {
          part: 2,
          title: "Terracotta Columns & Arch Shuttering",
          subtitle_2word: "ADOBE ARCHES",
          milestone: "Deck / Columns",
          prior_state: "Sunken oasis pool foundation basin and terraced courtyard slab.",
          problem: "The courtyard requires structural pillars and shade arches surrounding the pool.",
          solution: "Cast concrete pillar cores with rebar pins, place curved arch formwork, and demold sleek pillars.",
          structures_added: "Surrounding colonnade with concrete pillars and curved shade arches",
          stages: [
            { stage_num: 1, title: "Pillar Boxes", action: "Setting vertical pillar shuttering boxes around the pool deck", tool: "timber pillar forms and pins", asmr_type: "pin_placement", narration: "Setting pillar shuttering around pool." },
            { stage_num: 2, title: "Pillar Pour", action: "Pouring grey cement slurry into each pillar", tool: "mini funnel and tamp rod", asmr_type: "cement_pour", narration: "Pouring cement slurry into pillars." },
            { stage_num: 3, title: "Arch Centering", action: "Placing curved wood arch centering forms across pillars", tool: "curved arch forms and mesh", asmr_type: "pin_placement", narration: "Placing curved arch centering forms." },
            { stage_num: 4, title: "Arch Pour", action: "Pouring cement mix into arch forms and screeding flush", tool: "mini trowel and slurry", asmr_type: "trowel_scrape", narration: "Pouring cement into the arch forms." },
            { stage_num: 5, title: "Arch Strip", action: "Stripping arch forms to reveal elegant colonnade arches", tool: "release spatula", asmr_type: "formwork_strip", narration: "Stripping formwork. Colonnade arches revealed!" }
          ]
        },
        {
          part: 3,
          title: "Adobe Courtyard Brickwork & Lintels",
          subtitle_2word: "COURTYARD WALLS",
          milestone: "Walls / Blocks",
          prior_state: "Surrounding colonnade with concrete pillars and curved shade arches.",
          problem: "The colonnade needs miniature terracotta brick perimeter walls and window lintels.",
          solution: "Stack miniature bricks with mortar, set timber lintel boxes over openings, and pour headers.",
          structures_added: "Terracotta miniature brick walls with concrete window and door headers",
          stages: [
            { stage_num: 1, title: "Mortar Line", action: "Troweling mortar along the courtyard wall line", tool: "mini pointer trowel", asmr_type: "trowel_scrape", narration: "Troweling mortar along the wall line." },
            { stage_num: 2, title: "Brick Stacking", action: "Stacking miniature terracotta bricks in neat courses", tool: "mini terracotta bricks", asmr_type: "brick_tap", narration: "Stacking miniature terracotta bricks." },
            { stage_num: 3, title: "Lintel Formwork", action: "Installing small timber lintel boxes over doors", tool: "timber lintels and pins", asmr_type: "pin_placement", narration: "Wood lintel boxes pinned over doors." },
            { stage_num: 4, title: "Lintel Pour", action: "Pouring cement into lintels and scraping flush", tool: "pouring spoon", asmr_type: "cement_pour", narration: "Pouring cement into the door lintels." },
            { stage_num: 5, title: "Lintel Strip", action: "Stripping lintel forms to reveal solid door headers", tool: "release wedge", asmr_type: "formwork_strip", narration: "Stripping lintels. Courtyard walls locked." }
          ]
        },
        {
          part: 4,
          title: "Terraced Flat Roof & Oasis Pool Reveal",
          subtitle_2word: "OASIS REVEAL",
          milestone: "Upper / Roof / Reveal",
          prior_state: "Terracotta miniature brick walls with concrete window and door headers.",
          problem: "The structure requires a flat roof slab, formwork stripping, and oasis pool water fill.",
          solution: "Pour flat roof slab with white mesh, strip all formwork, and fill the oasis pool with water.",
          structures_added: "Complete Desert Oasis Villa with roof terrace, filled pool, and desert rock landscaping",
          stages: [
            { stage_num: 1, title: "Roof Formwork", action: "Laying thin plywood roof shuttering across courtyard walls", tool: "plywood roof forms", asmr_type: "pin_placement", narration: "Laying thin plywood roof shuttering." },
            { stage_num: 2, title: "Roof Mesh", action: "Spreading white grid mesh across the roof formwork", tool: "white grid mesh", asmr_type: "pin_placement", narration: "Spreading white grid mesh across roof." },
            { stage_num: 3, title: "Roof Pour", action: "Pouring grey cement slurry for the flat roof terrace", tool: "cement pouring pot", asmr_type: "cement_pour", narration: "Pouring smooth grey roof slurry." },
            { stage_num: 4, title: "Trowel Polish", action: "Burnishing the roof terrace surface to a clean finish", tool: "mini smoothing trowel", asmr_type: "trowel_scrape", narration: "Burnishing roof terrace surface smooth." },
            { stage_num: 5, title: "Pool Fill Reveal", action: "Stripping all formwork and filling oasis pool with turquoise water", tool: "hand strip and water filler", asmr_type: "formwork_strip", narration: "Stripping formwork. Oasis pool filled and complete!" }
          ]
        }
      ]
    }
  ]
};

// Aliased for backward compatibility with existing procedural runners
const PROCEDURAL_BLUEPRINTS = MINIATURE_STRUCTURE_SERIES;

/**
 * Builds the exact prompt for Gemini 2.5 Flash to plan the next episode
 */
function buildGeminiPrompt(townKey, townMemory, nextEpisode) {
  const structureList = MINIATURE_STRUCTURE_SERIES[townKey] || MINIATURE_STRUCTURE_SERIES.smart_city;
  const ep = Math.max(1, nextEpisode || 1);
  const partsPerStructure = 4;
  const structureIndex = Math.floor((ep - 1) / partsPerStructure) % structureList.length;
  const partNumber = ((ep - 1) % partsPerStructure) + 1;
  const currentStructure = structureList[structureIndex];

  return `You are the Lead Miniature Architect and Director of Viral Hands-On Miniature Construction Videos for 9:16 vertical Shorts and Reels.
Project: "${townMemory.name}" (${townKey})
Current Episode: ${ep}
Structure Series: "Mini ${currentStructure.structure_name}"
Active Part: Part ${partNumber} of ${partsPerStructure}

MISSION:
Plan Episode ${ep} as a high-retention, hands-on miniature construction video (9:16 vertical, 720p, 5s duration per clip).
The scene is set on a fine sand and soil base with natural studio rocks and a consistent backdrop across shots.

CRITICAL VISUAL & ASMR STYLE REQUIREMENTS:
1. Physical Miniature Building Process:
   - Thin wood/plywood shuttering/formwork held by metal pins.
   - White grid reinforcing mesh positioned before pouring.
   - Pouring viscous wet grey cement slurry.
   - Leveling and screeding with a mini stainless steel trowel or aluminum bar.
   - Stripping formwork to reveal razor-smooth cured concrete slabs, stairs, and pillars.
   - Stacking miniature red bricks / grey concrete blocks with mini troweled mortar.
2. Fast Step-by-Step Cuts: Snappy ~0.8s–2.2s visual rhythm across a 14–18s total vertical reel.
3. Crisp ASMR Audio: Crisp pour, scrape, tap, and peel sounds (cement_pour, trowel_scrape, formwork_strip, brick_tap, pin_placement, sand_level).
4. Minimal Voiceover Clutter: Exactly 1 ultra-short, punchy ASMR line per stage (4–7 words max). Zero long lectures.
5. Clean Part Label: "Mini ${currentStructure.structure_name} Part ${partNumber}".

OUTPUT REQUIREMENT:
Output ONLY valid JSON matching this exact structure:
{
  "episode": ${ep},
  "title": "Mini ${currentStructure.structure_name} Part ${partNumber}",
  "subtitle_2word": "TWO WORDS",
  "problem": "Brief miniature construction challenge",
  "solution": "Clear practical miniature building solution",
  "is_multipart": true,
  "multipart_info": {
    "structure_name": "${currentStructure.structure_name}",
    "series_label": "Mini ${currentStructure.structure_name} Part ${partNumber}",
    "part": ${partNumber},
    "total_parts": ${partsPerStructure}
  },
  "updated_anchor_prompt": "Hands-on miniature construction worksite on sand base with studio rocks and consistent backdrop",
  "structures_added": "Name of newly revealed structure milestone",
  "stages": [
    {
      "stage_num": 1,
      "title": "Short title",
      "action": "Hands-on miniature action (formwork, pins, mesh, cement pour, mini trowel, strip reveal)",
      "tool": "Miniature tool held",
      "image_prompt": "Complete macro photorealistic prompt for Stage 1",
      "motion_prompt": "Smooth continuous motion description for 720p 5s video",
      "asmr_type": "sand_level",
      "narration": "Short 4-7 word punchy ASMR line"
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
  const structureList = MINIATURE_STRUCTURE_SERIES[townKey] || MINIATURE_STRUCTURE_SERIES.smart_city;
  const ep = Math.max(1, nextEpisode || 1);
  const partsPerStructure = 4;
  const structureIndex = Math.floor((ep - 1) / partsPerStructure) % structureList.length;
  const partNumber = ((ep - 1) % partsPerStructure) + 1;
  const currentStructure = structureList[structureIndex];
  const partData = currentStructure.parts[partNumber - 1];

  const seriesLabel = `Mini ${currentStructure.structure_name} Part ${partNumber}`;
  const episodeTitle = `${seriesLabel}: ${partData.title}`;

  const builtSoFar = townMemory.built_structures && townMemory.built_structures.length > 0
    ? `Completed on site: ${townMemory.built_structures.slice(-3).join("; ")}.`
    : "Fresh sand and soil base with studio rocks.";

  const updatedAnchor = `Hands-on miniature construction worksite on sand and soil base with studio rocks. ${builtSoFar} Current milestone: ${partData.structures_added}. Consistent studio backdrop with warm directional lighting.`;

  const stages = partData.stages.map((stage, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === 4;

    let angleStyle = "Macro 45-degree angle focusing on hands-on miniature construction";
    let motionCamera = "Smooth macro motorized tracking glide";

    if (stage.stage_num === 1) {
      angleStyle = "Wide macro establishing angle showing craftsman hands preparing formwork on the sand base";
      motionCamera = "Smooth macro push-in tracking the formwork setup";
    } else if (stage.stage_num === 2) {
      angleStyle = "Eye-level close-up showing metal pins and white grid mesh placement";
      motionCamera = "Low-angle lateral macro glide tracking pin alignment";
    } else if (stage.stage_num === 3) {
      angleStyle = "Dynamic macro action angle capturing viscous grey cement slurry pouring";
      motionCamera = "Top-down macro tilt tracking wet cement flow";
    } else if (stage.stage_num === 4) {
      angleStyle = "Razor-sharp macro detail of mini trowel smoothing and leveling the wet cement";
      motionCamera = "Precise diagonal glide following the mini trowel blade";
    } else {
      angleStyle = "Grand macro reveal angle stripping the wood formwork to reveal razor-smooth cured concrete";
      motionCamera = "Majestic slow pull-back and elevation reveal of the demolded structure";
    }

    const imagePrompt = `Stage ${stage.stage_num}/5 of ${seriesLabel}: Hands-on miniature construction photography (9:16 vertical). ${angleStyle}. Craftsman hands actively performing: ${stage.action} using ${stage.tool}. Building materials on sand base with studio rocks: thin wood shuttering formwork, metal pins, white grid mesh, grey cement slurry, mini trowel, smooth cured concrete. Consistent studio backdrop, macro lens, shallow depth of field, warm directional lighting, 8k resolution, authentic miniature craftsmanship.`;

    const nextActionDesc = !isLast ? partData.stages[idx + 1].action.toLowerCase() : "celebrating the smooth demolded concrete reveal";
    const motionPrompt = `Cinematic miniature construction video (720p, 5s duration, 9:16 vertical): ${motionCamera}. Craftsman hands perform ${stage.action} using ${stage.tool}, progressing cleanly toward ${nextActionDesc}. Thin wood shuttering, metal pins, grey cement slurry, mini trowel screed, stripping formwork reveal. Studio sand base and rocks, smooth macro cinema tracking, 30fps.`;

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
    series_label: seriesLabel,
    part: partNumber,
    total_parts: partsPerStructure,
    subtitle_2word: partData.subtitle_2word,
    problem: partData.problem,
    solution: partData.solution,
    is_multipart: true,
    multipart_info: {
      structure_name: currentStructure.structure_name,
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
      console.log(`[Architect] Generated plan via Gemini: "${plan.title}"`);
      return plan;
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
  CRAFTSMAN_HANDS_DESCRIPTION,
  CAMERA_BASE_PROMPT,
  MINIATURE_STRUCTURE_SERIES,
  PROCEDURAL_BLUEPRINTS
};
