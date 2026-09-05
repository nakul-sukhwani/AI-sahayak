// src/lib/university-heuristics.ts
// AI & Civic Engineering Heuristic Generator for University Challenge Insights

export interface HeuristicImprovement {
  approachTitle: string;
  summary: string;
  actionSteps: string[];
  estimatedImpact: string;
  feasibilityScore: number;
  timeframe: string;
  researchFocus: string;
}

export interface MaterialSpec {
  name: string;
  standardCode: string;
  specification: string;
  purpose: string;
  grade: string;
}

export interface MaterialRecommendation {
  materials: MaterialSpec[];
  fieldEquipment: string[];
  durabilityRating: string;
  inspectionInterval: string;
  safetyStandards: string[];
}

export interface ChallengeInsightData {
  severity: 'low' | 'medium' | 'high' | 'critical';
  infrastructureType: string;
  localizedSummary: string;
  estimatedBeneficiaries: string;
  urgencyReason: string;
}

export interface StudentAssignment {
  leadName: string;
  leadId: string;
  studyScope: string;
  deadline: string;
  priority: 'Standard' | 'High' | 'Urgent';
  instructions: string;
  assignedAt: string;
}

export function computeChallengeInsights(challenge: {
  title: string;
  description: string;
  domain: string;
  tags?: string[];
  district?: string | null;
  submitter_type?: string;
  created_at?: string;
}): ChallengeInsightData {
  const text = `${challenge.title} ${challenge.description} ${challenge.domain} ${(challenge.tags || []).join(' ')}`.toLowerCase();

  // Determine Severity
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (
    text.includes('critical') ||
    text.includes('collapse') ||
    text.includes('hazard') ||
    text.includes('emergency') ||
    text.includes('flooding') ||
    text.includes('accident') ||
    text.includes('contamination') ||
    text.includes('burst')
  ) {
    severity = 'critical';
  } else if (
    text.includes('urgent') ||
    text.includes('severe') ||
    text.includes('heavy') ||
    text.includes('major') ||
    text.includes('overflow') ||
    text.includes('broken') ||
    text.includes('damage')
  ) {
    severity = 'high';
  } else if (
    text.includes('minor') ||
    text.includes('cosmetic') ||
    text.includes('routine') ||
    text.includes('maintenance') ||
    text.includes('survey')
  ) {
    severity = 'low';
  }

  // Determine Infrastructure Type
  let infrastructureType = 'Municipal Civic Asset';
  let urgencyReason = 'General public amenity upkeep and civic reliability.';
  let estimatedBeneficiaries = '1,500 – 5,000 citizens';

  if (text.includes('road') || text.includes('pothole') || text.includes('traffic') || text.includes('bridge') || text.includes('pavement')) {
    infrastructureType = 'Arterial Road Network & Pavement Corridor';
    urgencyReason = 'Traffic congestion mitigation, vehicular wear prevention, and pedestrian accident avoidance.';
    estimatedBeneficiaries = '10,000+ daily commuters';
  } else if (text.includes('water') || text.includes('drain') || text.includes('sewage') || text.includes('pipe') || text.includes('flood')) {
    infrastructureType = 'Stormwater Drainage Canal & Hydrological Network';
    urgencyReason = 'Prevention of monsoon inundation, vector-borne disease control, and groundwater protection.';
    estimatedBeneficiaries = '8,000+ neighborhood residents';
  } else if (text.includes('waste') || text.includes('garbage') || text.includes('dump') || text.includes('sanitation') || text.includes('clean')) {
    infrastructureType = 'Solid Waste Collection & Resource Recovery Node';
    urgencyReason = 'Elimination of open dumping leachate, odor suppression, and circular recycling.';
    estimatedBeneficiaries = '5,000+ local households';
  } else if (text.includes('light') || text.includes('energy') || text.includes('power') || text.includes('electric') || text.includes('solar')) {
    infrastructureType = 'Municipal Low-Voltage Grid & Public Lighting Corridor';
    urgencyReason = 'Nighttime public safety, energy conservation, and automated fault resolution.';
    estimatedBeneficiaries = '3,500+ nighttime transit users';
  } else if (text.includes('pollut') || text.includes('air') || text.includes('tree') || text.includes('park') || text.includes('environ')) {
    infrastructureType = 'Urban Ecological Buffer & Microclimate Zone';
    urgencyReason = 'Air quality index (AQI) stabilization and microclimate heat island mitigation.';
    estimatedBeneficiaries = '12,000+ civic precinct inhabitants';
  }

  const districtStr = challenge.district ? `in ${challenge.district} District` : 'in the local municipality';
  const localizedSummary = `Civic challenge reported ${districtStr} impacting ${infrastructureType.toLowerCase()}.`;

  return {
    severity,
    infrastructureType,
    localizedSummary,
    estimatedBeneficiaries,
    urgencyReason,
  };
}

export function generateImprovementSuggestions(challenge: {
  title: string;
  description: string;
  domain: string;
  tags?: string[];
}): HeuristicImprovement {
  const text = `${challenge.title} ${challenge.description} ${challenge.domain} ${(challenge.tags || []).join(' ')}`.toLowerCase();

  if (text.includes('road') || text.includes('pothole') || text.includes('pavement') || text.includes('traffic')) {
    return {
      approachTitle: 'Full-Depth Geosynthetic Base Stabilization & Cold-Mix IRC Bituminous Overlay',
      summary: 'Replace temporary patch fills with engineered sub-base compaction, non-woven geotextile separation, and high-polymer cold asphalt.',
      actionSteps: [
        'Geometrical square-cut perimeter trenching to 150mm depth to reach stable sub-grade.',
        'Dynamic plate compaction to achieve 98% modified Proctor density.',
        'Laying non-woven polypropylene geotextile membrane (Class 1) to eliminate moisture pumping.',
        'Application of IRC:SP:100 compliant rapid-curing cold-mix bituminous macadam with 2% cross-slope camber.',
      ],
      estimatedImpact: 'Reduces surface pothole recurrence by 80% across 3 monsoon cycles.',
      feasibilityScore: 88,
      timeframe: '5–8 Days field deployment',
      researchFocus: 'Longitudinal pavement deflection testing & shear modulus evaluation under heavy axle loads.',
    };
  }

  if (text.includes('water') || text.includes('drain') || text.includes('sewage') || text.includes('flood') || text.includes('pipe')) {
    return {
      approachTitle: 'Subsurface Perforated Galleried Infiltration & Hydrodynamic Silt Baffling',
      summary: 'Engineered gradient stormwater discharge incorporating silt trap chambers and modular permeable attenuation crates.',
      actionSteps: [
        'Hydrological runoff volume calculation based on 25-year return frequency precipitation modeling.',
        'Excavation and installation of precast concrete NP3/NP4 pipe with laser slope alignment at 1:200 gradient.',
        'Integration of twin-chamber catch pits with removable HDPE trash screens and sediment baffles.',
        'Deployment of solar-powered ultrasonic depth telemetry logger for automated surcharge warning.',
      ],
      estimatedImpact: 'Eliminates 95% of peak-monsoon surface pooling and reduces drain desilting frequency.',
      feasibilityScore: 82,
      timeframe: '10–14 Days field deployment',
      researchFocus: 'Hydrological Manning roughness coefficient optimization in urban stormwater conduits.',
    };
  }

  if (text.includes('waste') || text.includes('garbage') || text.includes('dump') || text.includes('sanitation')) {
    return {
      approachTitle: 'Decentralized Plug-Flow Bio-Digestion & IoT Compaction Hub Workflow',
      summary: 'Eliminate secondary open dumping through segregated source-level shredding, bio-methanation, and volume-reduction baling.',
      actionSteps: [
        'GIS hotspot spatial clustering to position decentralized 500kg/day aerobic composting cells.',
        'Inoculation of organic fractions with microbial consortia to accelerate decomposition under 14 days.',
        'Integration of solar optical fill-level telemetry sensors sending real-time route triggers to ULB trucks.',
        'Installation of hydraulic dry-waste balers for high-density transport to recycling processors.',
      ],
      estimatedImpact: 'Diverts 70% of municipal wet waste from landfills and cuts logistics transport emissions by 40%.',
      feasibilityScore: 85,
      timeframe: '7–12 Days deployment',
      researchFocus: 'Life-cycle assessment (LCA) and microbial enzymatic kinetics in humid sub-tropical conditions.',
    };
  }

  if (text.includes('light') || text.includes('energy') || text.includes('power') || text.includes('solar')) {
    return {
      approachTitle: 'Autonomous Solar-Hybrid LED Mesh with Smart MPPT & Dynamic Dimming',
      summary: 'Convert intermittent electrical lighting into self-sufficient solar micro-corridors with LoRaWAN wireless telemetry.',
      actionSteps: [
        'Photometric corridor survey to establish target illuminance (minimum 20 Lux on carriageway).',
        'Mounting 80W monocrystalline PV modules with IP67 LiFePO4 battery storage pack (3000+ cycle life).',
        'Configuration of optical radar motion sensors for 30% ambient standby and 100% active vehicle detection.',
        'Gateway commissioning for automated central dashboard telemetry and fault detection.',
      ],
      estimatedImpact: 'Provides 100% uninterrupted nighttime illumination with zero municipal grid load.',
      feasibilityScore: 92,
      timeframe: '4–7 Days deployment',
      researchFocus: 'Maximum Power Point Tracking (MPPT) efficiency under partial shading & high ambient dust.',
    };
  }

  if (text.includes('pollut') || text.includes('air') || text.includes('tree') || text.includes('park') || text.includes('environ')) {
    return {
      approachTitle: 'Phytoremediation Vegetative Bio-Swale with Calibrated Ambient AQI Sensing',
      summary: 'Deploy tiered native vegetation filters combined with calibrated laser-scattering air quality monitors.',
      actionSteps: [
        'Baseline soil pH, heavy metal contamination, and particulate matter (PM2.5/PM10) spatial mapping.',
        'Excavation of parabolic bioswales filled with engineered 70/20/10 sand-compost filter substrate.',
        'Planting deep-root hyperaccumulating indigenous grasses (e.g., Vetiver, Canna indica).',
        'Installation of solar-powered optical particulate telemetry nodes transmitting hourly public health data.',
      ],
      estimatedImpact: 'Reduces ambient PM10 concentrations by 25% within immediate 50m canopy radius.',
      feasibilityScore: 79,
      timeframe: '10–18 Days deployment',
      researchFocus: 'Phytoremediation bioaccumulation index of native botanical species in industrial-civic interfaces.',
    };
  }

  // Default civic infrastructure
  return {
    approachTitle: 'Non-Destructive Structural Rehabilitation & Polymer-Modified Restoration',
    summary: 'Restore civic asset structural integrity using ultrasonic pulse testing, crack injection, and high-performance mortars.',
    actionSteps: [
      'Ultrasonic pulse velocity and Schmidt rebound hammer inspection to map structural fatigue zones.',
      'Surface hydro-demolition to clear deteriorated concrete down to sound rebar substrate.',
      'Application of zinc-rich anti-corrosion primer on exposed steel followed by polymer repair mortar.',
      'Application of silane-siloxane hydrophobic protective sealant to resist weathering.',
    ],
    estimatedImpact: 'Extends civic asset operational lifespan by 12+ years without complete rebuild costs.',
    feasibilityScore: 84,
    timeframe: '6–10 Days deployment',
    researchFocus: 'Interfacial bond strength and carbonation resistance of polymer-modified composite mortars.',
  };
}

export function generateMaterialRecommendations(challenge: {
  title: string;
  description: string;
  domain: string;
  tags?: string[];
}): MaterialRecommendation {
  const text = `${challenge.title} ${challenge.description} ${challenge.domain} ${(challenge.tags || []).join(' ')}`.toLowerCase();

  if (text.includes('road') || text.includes('pothole') || text.includes('pavement') || text.includes('traffic')) {
    return {
      materials: [
        {
          name: 'Cold-Mix Bituminous Macadam',
          standardCode: 'IRC:SP:100-2014',
          specification: 'Modified Bitumen Emulsion RS-2 Grade with graded crushed stone aggregate (13.2mm - 5.6mm)',
          purpose: 'High-durability all-weather pothole patching and leveling course.',
          grade: 'Commercial Grade A',
        },
        {
          name: 'Non-Woven Polypropylene Geotextile',
          standardCode: 'IS 16325 / MoRTH Sec 700',
          specification: 'Needle-punched continuous filament synthetic geotextile, Mass: 200 g/m²',
          purpose: 'Sub-base reinforcement, stress absorption, and moisture capillary barrier.',
          grade: 'Class 1 Heavy Duty',
        },
        {
          name: 'Granular Sub-Base Aggregates',
          standardCode: 'MoRTH Table 400-1 (Grading II)',
          specification: 'Naturally crushed stone aggregate with 10% fines value >= 50 kN',
          purpose: 'Sub-grade load distribution and structural base formation.',
          grade: 'Grading II Standard',
        },
        {
          name: 'Bituminous Tack Coat Primer',
          standardCode: 'IS 8887:2018',
          specification: 'Cationic bitumen emulsion RS-1 grade, spray application rate 0.25 kg/m²',
          purpose: 'Interlayer bonding between existing pavement and patch overlay.',
          grade: 'RS-1 Cationic',
        },
      ],
      fieldEquipment: [
        'Vibratory Walk-Behind Plate Compactor (90–120 kg force)',
        'Dynamic Cone Penetrometer (DCP) for sub-grade CBR measurement',
        'Digital Asphalt Infrared Thermometer & Thickness Gauge',
        'Diamond Blade Wet Asphalt / Concrete Floor Saw',
      ],
      durabilityRating: '5–8 Years (with annual crack sealing)',
      inspectionInterval: 'Quarterly & post-monsoon inspection',
      safetyStandards: ['IRC:SP:55 (Traffic Management at Road Work Zones)', 'IS 3786 (Industrial Safety)'],
    };
  }

  if (text.includes('water') || text.includes('drain') || text.includes('sewage') || text.includes('flood') || text.includes('pipe')) {
    return {
      materials: [
        {
          name: 'Reinforced Precast Concrete Hume Pipes',
          standardCode: 'IS 458:2003',
          specification: 'Class NP3 / NP4 centrifugally cast spun concrete with sacrificial cover',
          purpose: 'Heavy load-bearing stormwater conveyance under carriageways.',
          grade: 'Class NP3 / NP4',
        },
        {
          name: 'Corrugated Double-Wall HDPE Pipes',
          standardCode: 'IS 16098 (Part 2):2013',
          specification: 'High-Density Polyethylene structured-wall piping, Ring Stiffness SN8',
          purpose: 'Smooth internal flow line, high chemical resistance against domestic sewage.',
          grade: 'SN8 Stiffness',
        },
        {
          name: 'Filtration Geotextile Wrap',
          standardCode: 'IS 16325 / ASTM D4751',
          specification: 'Needle-punched non-woven polyester fabric, Apparent Opening Size (AOS) <= 75 µm',
          purpose: 'Wrapping gravel trenches to prevent silt intrusion into French drains.',
          grade: '180 GSM Medium',
        },
        {
          name: 'Ductile Iron Heavy Duty Drain Grating',
          standardCode: 'IS 1726:1991',
          specification: 'Epoxy powder-coated ductile iron frame and hinged grating (Class D400)',
          purpose: 'Surface water intake with vehicular wheel load rating up to 40 tons.',
          grade: 'Class D400 Heavy',
        },
      ],
      fieldEquipment: [
        'Trench Shoring Cage Shields for worker safety during deep excavation',
        'Digital Laser Rotary Level & Pipe Invert Slope Alignment Tool',
        'Ultrasonic Doppler Flow Velocity & Water Level Meter',
        'Hydrostatic Pressure Testing Rig for joint leak verification',
      ],
      durabilityRating: '15–20 Years (with pre-monsoon silt clearance)',
      inspectionInterval: 'Pre-monsoon (May) and Post-monsoon (October)',
      safetyStandards: ['CPHEEO Manual on Sewerage & Sewage Treatment', 'IS 11972 (Safety in Sewer Works)'],
    };
  }

  if (text.includes('waste') || text.includes('garbage') || text.includes('dump') || text.includes('sanitation')) {
    return {
      materials: [
        {
          name: 'UV-Stabilized High-Density Polyethylene Bins',
          standardCode: 'IS 12444 / EN 840',
          specification: 'Injection molded virgin HDPE with chemical & thermal stability (-20°C to 60°C)',
          purpose: 'Heavy-duty segregated collection containers (240L / 1100L capacity).',
          grade: 'Grade HDPE-UV8',
        },
        {
          name: 'Aerobic Microbial Bio-Inoculant Consortium',
          standardCode: 'CPCB Bio-Remediation Protocol',
          specification: 'Thermotolerant Bacillus and fungal cellulolytic bacterial strains (> 10^8 CFU/g)',
          purpose: 'Rapid in-situ odor suppression and organic waste compost conversion.',
          grade: 'Bio-Active Grade',
        },
        {
          name: 'Corrosion-Resistant Structural Steel',
          standardCode: 'IS 2062:2011 Grade E250',
          specification: 'Hot-dip galvanized structural hollow sections with minimum 80 µm zinc coating',
          purpose: 'Protective canopy frame and sorting platform for decentralized processing unit.',
          grade: 'Grade E250BR',
        },
        {
          name: 'Heavy-Duty Geomembrane Base Liner',
          standardCode: 'IS 16352:2020',
          specification: '1.5mm thick High-Density Polyethylene textured impermeable geomembrane',
          purpose: 'Leachate containment barrier under composting processing yard.',
          grade: '1.5mm HDPE Geomembrane',
        },
      ],
      fieldEquipment: [
        'Multi-Gas Portable Electrochemical Analyzer (CH4, H2S, NH3, CO2)',
        'Hydraulic Waste Baler & Density Compactor (10-ton pressing force)',
        'Heavy-Duty Organic Shredder / Chipper Unit (3 HP induction motor)',
        'Soil & Compost Multi-Depth Digital pH / Temperature Probes',
      ],
      durabilityRating: '8–12 Years (Modular equipment overhaul at Year 5)',
      inspectionInterval: 'Monthly microbial activity & leachate containment audit',
      safetyStandards: ['Solid Waste Management Rules 2016 (MoEFCC)', 'CPCB Leachate Management Standards'],
    };
  }

  if (text.includes('light') || text.includes('energy') || text.includes('power') || text.includes('solar')) {
    return {
      materials: [
        {
          name: 'Monocrystalline Solar PV Modules',
          standardCode: 'IS 14286:2010 / IEC 61215',
          specification: 'High-efficiency half-cut cells, minimum 21.2% module efficiency, IP68 junction box',
          purpose: 'Daytime solar energy harvesting with low-light response.',
          grade: 'Tier-1 Mono PERC',
        },
        {
          name: 'Lithium Iron Phosphate (LiFePO4) Battery',
          standardCode: 'IS 16046 (Part 2):2018',
          specification: '12.8V 42Ah LiFePO4 battery pack with built-in Smart Battery Management System (BMS)',
          purpose: 'Overnight energy storage with 3,000+ deep discharge cycles at 80% DoD.',
          grade: 'Industrial Grade A',
        },
        {
          name: 'Die-Cast Aluminum LED Luminaire',
          standardCode: 'IS 10322 (Part 5/Sec 3):2012',
          specification: 'Pressure die-cast LM6 aluminum housing, 140 lm/W luminous efficacy, IK08 / IP66',
          purpose: 'High-uniformity roadway and pathway illumination with heat dissipation fins.',
          grade: 'IP66 / IK08 Rated',
        },
        {
          name: 'LoRaWAN IoT Smart Lighting Controller',
          standardCode: 'WPC India 865-867 MHz Band',
          specification: 'Microcontroller with ambient light sensor, dynamic PWM dimming, and mesh transceiver',
          purpose: 'Automated ON/OFF scheduling, power consumption telemetry, and lamp failure alerts.',
          grade: 'Industrial Wireless',
        },
      ],
      fieldEquipment: [
        'Digital Class-A Cosine-Corrected Lux Light Meter',
        'Solar Irradiance Pyranometer & PV Curve Tracer',
        'Handheld Thermal Imaging Camera for electrical hotspot detection',
        'Earth Grounding Resistance Clamp Meter (IS 3043 compliance)',
      ],
      durabilityRating: '10–15 Years (PV Modules: 25 Years; LED: 50,000 Hours)',
      inspectionInterval: 'Biannual optical lens cleaning and battery state-of-charge check',
      safetyStandards: ['IS 3043 (Code of Practice for Earthing)', 'CEA (Measures Relating to Safety and Electric Supply)'],
    };
  }

  // Default civic infrastructure
  return {
    materials: [
      {
        name: 'Polymer-Modified Structural Mortar',
        standardCode: 'EN 1504-3 / IS 516',
        specification: 'Thixotropic fiber-reinforced mortar with compressive strength >= 45 MPa at 28 days',
        purpose: 'Non-shrink structural restoration of damaged concrete assets.',
        grade: 'Class R4 Structural',
      },
      {
        name: 'Carbon Fiber Reinforced Polymer (CFRP)',
        standardCode: 'ACI 440.2R / IS 16444',
        specification: 'Unidirectional high-tensile carbon fiber fabric (300 g/m²) with epoxy saturant resin',
        purpose: 'Flexural and shear strengthening of overloaded structural members.',
        grade: 'High Tensile Structural',
      },
      {
        name: 'Hydrophobic Silane-Siloxane Sealant',
        standardCode: 'IS 15809:2008',
        specification: 'Solvent-free water-repellent impregnant penetrating deep into concrete pores',
        purpose: 'Surface waterproofing, chloride barrier, and anti-carbonation defense.',
        grade: '100% Active Silane',
      },
      {
        name: 'Stainless Steel Anchor Fasteners',
        standardCode: 'IS 1367 (Part 14) / AISI 316',
        specification: 'Heavy-duty torque-controlled expansion anchors with corrosion resistance',
        purpose: 'Secure mechanical anchoring for civic fixtures and protective rails.',
        grade: 'Marine Grade 316',
      },
    ],
    fieldEquipment: [
      'Digital Schmidt Rebound Hammer for in-situ compressive strength estimation',
      'Ultrasonic Pulse Velocity (UPV) Non-Destructive Concrete Tester',
      'Elcometer Adhesion Pull-Off Tester for coating bond strength',
      'High-Precision Laser Distance & Tilt Leveling Device',
    ],
    durabilityRating: '10–15 Years (with 5-year sealant re-application)',
    inspectionInterval: 'Annual structural condition survey',
    safetyStandards: ['IS 456:2000 (Plain and Reinforced Concrete Code)', 'NBC 2016 (National Building Code of India)'],
  };
}
