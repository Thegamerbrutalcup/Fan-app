import React, { useState, useMemo, useEffect } from 'react';
import { 
  Wind, 
  Activity, 
  CheckCircle, 
  Settings, 
  DollarSign, 
  Volume2, 
  AlertTriangle,
  Thermometer,
  LayoutGrid,
  Calculator,
  History,
  FileText,
  ArrowRight,
  Cog,
  FileCode,
  Download,
  Copy,
  RefreshCw,
  ClipboardList,
  Lightbulb,
  Trash2,
  Layers, // Icon for Solid Edge
  Box,    // Icon for Hub
  Fan,    // Icon for Rotor
  Square  // Icon for Casing
} from 'lucide-react';

// --- DATA: APPLICATION PROFILES ---
const APP_PROFILES = {
  'General': { 
    label: "General Ventilation", 
    desc: "Balanced flow and pressure. Good efficiency.",
    bladeType: "Backward",
    recOutlet: 35,
    recInlet: 25
  },
  'High Pressure': { 
    label: "High Pressure Blower", 
    desc: "Combustion air, fluidized beds. Narrow impeller.",
    bladeType: "Radial",
    recOutlet: 90,
    recInlet: 35
  },
  'High Flow': { 
    label: "High Suction / Flow", 
    desc: "HVAC, Fume extraction. Wide impeller.",
    bladeType: "Forward",
    recOutlet: 145,
    recInlet: 20
  },
  'Transport': { 
    label: "High Velocity / Transport", 
    desc: "Dust collecting, material handling. Rugged.",
    bladeType: "Radial",
    recOutlet: 90,
    recInlet: 45
  }
};

// --- DATA: UNIT CONVERSION FACTORS ---
const UNIT_DATA = {
  flow: {
    label: "Air Flow Rate",
    base: "CFM",
    units: {
      "CFM": 1,
      "m³/hr": 1.69901,
      "m³/min": 0.0283168,
      "m³/s": 0.000471947,
      "L/s": 0.471947,
      "ft³/s": 0.0166667,
      "GPM (US)": 7.48052
    }
  },
  pressure: {
    label: "Pressure",
    base: "Pa",
    units: {
      "Pa": 1,
      "kPa": 0.001,
      "MPa": 0.000001,
      "bar": 0.00001,
      "mbar": 0.01,
      "psi": 0.000145038,
      "in. wg": 0.00401463,
      "mm. wg": 0.101972,
      "in. Hg": 0.0002953,
      "mm Hg": 0.00750062,
      "atm": 0.0000098692,
      "kg/cm²": 0.000010197
    }
  },
  power: {
    label: "Power",
    base: "kW",
    units: {
      "kW": 1,
      "W": 1000,
      "MW": 0.001,
      "HP (Electric)": 1.34048,
      "HP (Metric)": 1.35962,
      "HP (Mechanical)": 1.34102,
      "BTU/h": 3412.14,
      "TR": 0.284345,
      "kcal/h": 859.845
    }
  },
  length: {
    label: "Length / Diameter",
    base: "mm",
    units: {
      "mm": 1,
      "cm": 0.1,
      "m": 0.001,
      "inch": 0.0393701,
      "ft": 0.00328084,
      "yd": 0.00109361
    }
  },
  velocity: {
    label: "Velocity",
    base: "m/s",
    units: {
      "m/s": 1,
      "km/h": 3.6,
      "ft/min": 196.85,
      "ft/s": 3.28084,
      "mph": 2.23694,
      "knots": 1.94384
    }
  },
  density: {
    label: "Density",
    base: "kg/m³",
    units: {
      "kg/m³": 1,
      "lb/ft³": 0.062428,
      "g/cm³": 0.001,
      "lb/in³": 0.000036127
    }
  },
  torque: {
    label: "Torque",
    base: "Nm",
    units: {
      "Nm": 1,
      "lb-ft": 0.737562,
      "lb-in": 8.85075,
      "kg-m": 0.101972
    }
  }
};

// --- UI COMPONENTS ---

const ResultCard = ({ title, value, unit, subtext, status }) => (
  <div className={`p-4 rounded-lg border ${status === 'SAFE' || status === 'OK' ? 'bg-green-50 border-green-200' : status === 'UNSAFE' || status === 'WARN' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'} shadow-sm flex flex-col justify-between h-full`}>
    <div>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</div>
      <div className="mt-1 flex items-baseline">
        <span className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toFixed(2) : value}</span>
        {unit && <span className="ml-1 text-sm text-gray-600">{unit}</span>}
      </div>
    </div>
    {subtext && <div className={`mt-2 text-xs ${status === 'UNSAFE' || status === 'WARN' ? 'text-red-700 font-bold' : 'text-gray-500'}`}>{subtext}</div>}
  </div>
);

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 mb-4">
    {Icon ? <Icon className="w-5 h-5 text-blue-600" /> : <div className="w-5 h-5 bg-blue-200 rounded-full" />}
    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
  </div>
);

// Reusable Input Row Component (Updated with Suggestions)
const InputRow = ({ label, value, onChange, unit, suggestion }) => (
  <div className="grid grid-cols-2 gap-2 items-center p-2">
    <label className="text-xs font-medium text-gray-600 truncate" title={label}>{label}</label>
    <div className="flex flex-col items-end w-full">
      <div className="flex items-center space-x-2 w-full">
        <input 
          type="text" 
          inputMode="decimal"
          value={value}
          onChange={onChange}
          className="flex-1 min-w-0 text-right p-1.5 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        {unit && <span className="text-xs text-gray-500 font-medium w-8">{unit}</span>}
      </div>
      {suggestion !== undefined && (
        <div 
          onClick={() => onChange({ target: { value: suggestion } })}
          className="text-[10px] text-blue-500 mt-1 cursor-pointer hover:underline hover:text-blue-700 transition-colors"
          title="Click to apply suggested value"
        >
          Sugg: {suggestion}°
        </div>
      )}
    </div>
  </div>
);

// Generic Converter Component
const GenericConverter = ({ categoryKey, data }) => {
  const [amount, setAmount] = useState(1);
  const [fromUnit, setFromUnit] = useState(Object.keys(data.units)[0]);
  const [toUnit, setToUnit] = useState(Object.keys(data.units)[1] || Object.keys(data.units)[0]);

  const convert = (val, from, to) => {
    if (isNaN(val)) return "---";
    const baseAmount = val / data.units[from];
    return baseAmount * data.units[to];
  };

  const result = convert(amount, fromUnit, toUnit);

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
        <RefreshCw className="w-3 h-3 mr-1" /> {data.label}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <div className="flex flex-col space-y-1">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <select 
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="w-full p-1 text-xs bg-gray-50 border border-gray-200 rounded outline-none text-gray-700"
          >
            {Object.keys(data.units).map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <ArrowRight className="w-4 h-4 text-gray-400 mx-1" />

        <div className="flex flex-col space-y-1">
          <div className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded font-medium text-gray-900 overflow-hidden text-ellipsis h-[38px] flex items-center">
            {typeof result === 'number' ? parseFloat(result.toPrecision(6)) : result}
          </div>
          <select 
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            className="w-full p-1 text-xs bg-gray-50 border border-gray-200 rounded outline-none text-gray-700"
          >
            {Object.keys(data.units).map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

// Temperature Converter
const TemperatureConverter = () => {
  const [amount, setAmount] = useState(70);
  const [fromUnit, setFromUnit] = useState("°F");
  const [toUnit, setToUnit] = useState("°C");
  const units = ["°C", "°F", "K", "°R"];

  const convertTemp = (val, from, to) => {
    let c;
    if (from === "°C") c = val;
    else if (from === "°F") c = (val - 32) * 5/9;
    else if (from === "K") c = val - 273.15;
    else if (from === "°R") c = (val - 491.67) * 5/9;

    if (to === "°C") return c;
    if (to === "°F") return (c * 9/5) + 32;
    if (to === "K") return c + 273.15;
    if (to === "°R") return (c + 273.15) * 9/5;
    return 0;
  };

  const result = convertTemp(amount, fromUnit, toUnit);

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
        <Thermometer className="w-3 h-3 mr-1" /> Temperature
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <div className="flex flex-col space-y-1">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <select 
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="w-full p-1 text-xs bg-gray-50 border border-gray-200 rounded outline-none text-gray-700"
          >
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <ArrowRight className="w-4 h-4 text-gray-400 mx-1" />

        <div className="flex flex-col space-y-1">
          <div className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded font-medium text-gray-900 overflow-hidden text-ellipsis h-[38px] flex items-center">
            {parseFloat(result.toFixed(2))}
          </div>
          <select 
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            className="w-full p-1 text-xs bg-gray-50 border border-gray-200 rounded outline-none text-gray-700"
          >
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

// Impeller Sketch Component (Meridional View)
const ImpellerSketch = ({ D2, D1, b2, b1, Dh }) => {
  const maxDim = D2 * 1.2;
  const scale = 250 / maxDim;
  const cx = 150;
  const cy = 150;
  const r2 = (D2 / 2) * scale;
  const r1 = (D1 / 2) * scale;
  const rh = (Dh / 2) * scale;
  const h2 = b2 * scale;
  const h1 = b1 * scale;
  const backplateY = cy + h1/2;
  const hubX = cx + rh;
  const tipX = cx + r2;
  const inletX = cx + r1;
  
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col items-center">
      <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 w-full text-left">Impeller Meridional Profile</h4>
      <svg width="350" height="300" viewBox="0 0 300 300" className="border border-dashed border-gray-200 rounded bg-gray-50">
        <line x1={cx} y1={20} x2={cx} y2={280} stroke="#9CA3AF" strokeDasharray="5,5" />
        <text x={cx + 5} y={280} fontSize="10" fill="#9CA3AF">Axis</text>
        <rect x={cx - rh} y={cy - 40} width={rh * 2} height={80} fill="#E5E7EB" stroke="#4B5563" />
        <text x={cx} y={cy} fontSize="10" textAnchor="middle" fill="#374151">Hub (Dh)</text>
        <line x1={hubX} y1={backplateY} x2={tipX} y2={backplateY} stroke="#1F2937" strokeWidth="2" />
        <path d={`M ${inletX} ${backplateY - h1} Q ${inletX + (tipX-inletX)*0.4} ${backplateY - h2} ${tipX} ${backplateY - h2}`} fill="none" stroke="#1F2937" strokeWidth="2" />
        <line x1={tipX} y1={backplateY} x2={tipX} y2={backplateY - h2} stroke="#1F2937" strokeWidth="1" />
        <line x1={inletX} y1={backplateY} x2={inletX} y2={backplateY - h1} stroke="#1F2937" strokeWidth="1" strokeDasharray="2,2" />
        <line x1={cx - rh} y1={backplateY} x2={cx - r2} y2={backplateY} stroke="#9CA3AF" strokeWidth="1" />
        <path d={`M ${cx - r1} ${backplateY - h1} Q ${cx - r1 - (r2-r1)*0.4} ${backplateY - h2} ${cx - r2} ${backplateY - h2}`} fill="none" stroke="#9CA3AF" strokeWidth="1" />
        <line x1={cx - r2} y1={backplateY} x2={cx - r2} y2={backplateY - h2} stroke="#9CA3AF" strokeWidth="1" />
        
        {/* Dimension Lines */}
        <line x1={cx} y1={backplateY + 20} x2={tipX} y2={backplateY + 20} stroke="#2563EB" markerEnd="url(#arrow)" />
        <text x={cx + r2/1.5} y={backplateY + 35} fontSize="10" fill="#2563EB" textAnchor="middle">D2/2</text>
        <line x1={cx} y1={backplateY - h1 - 20} x2={inletX} y2={backplateY - h1 - 20} stroke="#2563EB" markerEnd="url(#arrow)" />
        <text x={cx + r1/1.5} y={backplateY - h1 - 25} fontSize="10" fill="#2563EB" textAnchor="middle">D1/2</text>
        <line x1={tipX + 15} y1={backplateY} x2={tipX + 15} y2={backplateY - h2} stroke="#DC2626" />
        <text x={tipX + 20} y={backplateY - h2/2} fontSize="10" fill="#DC2626" alignmentBaseline="middle">b2</text>
        <line x1={inletX - 10} y1={backplateY} x2={inletX - 10} y2={backplateY - h1} stroke="#DC2626" />
        <text x={inletX - 15} y={backplateY - h1/2} fontSize="10" fill="#DC2626" textAnchor="end" alignmentBaseline="middle">b1</text>
        
        {/* Hub Dimension */}
        <line x1={cx} y1={cy + 45} x2={hubX} y2={cy + 45} stroke="#2563EB" markerEnd="url(#arrow)" />
        <text x={cx + rh/1.5} y={cy + 55} fontSize="10" fill="#2563EB" textAnchor="middle">Dh/2</text>

        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#2563EB" />
          </marker>
        </defs>
      </svg>
      <div className="mt-4 grid grid-cols-3 gap-2 w-full text-center text-xs">
        <div className="bg-gray-50 p-2 rounded"><span className="block text-gray-500">D2</span><b>{D2.toFixed(0)}</b></div>
        <div className="bg-gray-50 p-2 rounded"><span className="block text-gray-500">D1</span><b>{D1.toFixed(0)}</b></div>
        <div className="bg-gray-50 p-2 rounded"><span className="block text-gray-500">Dh</span><b>{Dh.toFixed(0)}</b></div>
      </div>
    </div>
  );
};

// Impeller Top View Component (Rotor & Blades)
const ImpellerTopView = ({ D2, D1, Dh, Z, beta1, beta2 }) => {
  const maxDim = D2 * 1.2;
  const scale = 250 / maxDim;
  const cx = 150, cy = 150;
  const r2 = (D2/2) * scale;
  const r1 = (D1/2) * scale;
  const rh = (Dh/2) * scale;

  // Generate Blade Path (Log Spiral approx)
  const generateBladePath = (rotationOffset) => {
    const steps = 10;
    const beta_avg_rad = ((Number(beta1) + Number(beta2))/2) * (Math.PI/180);
    const wrap_angle = Math.log(D2/D1) / Math.tan(beta_avg_rad || 0.5); // Radians
    
    let path = `M ${cx + r1 * Math.cos(rotationOffset)} ${cy + r1 * Math.sin(rotationOffset)}`;
    
    for(let i=1; i<=steps; i++) {
        const t = i/steps;
        const r = r1 + (r2 - r1) * t;
        const theta = rotationOffset + wrap_angle * t; // Curving backwards
        const px = cx + r * Math.cos(theta);
        const py = cy + r * Math.sin(theta);
        path += ` L ${px} ${py}`;
    }
    return path;
  };

  const blades = [];
  for(let i=0; i<Z; i++) {
      blades.push(generateBladePath((i * 2 * Math.PI) / Z));
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col items-center">
      <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 w-full text-left">Impeller Top View (Blades)</h4>
      <svg width="300" height="300" viewBox="0 0 300 300" className="border border-dashed border-gray-200 rounded bg-gray-50">
        <circle cx={cx} cy={cy} r={r2} fill="none" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4,4" />
        <circle cx={cx} cy={cy} r={r1} fill="none" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4,4" />
        <circle cx={cx} cy={cy} r={rh} fill="#E5E7EB" stroke="#4B5563" />
        
        {blades.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#1F2937" strokeWidth="2" />
        ))}
        
        {/* Annotations */}
        <text x={cx} y={cy} fontSize="10" textAnchor="middle" alignmentBaseline="middle" fill="#374151">Hub</text>
        <text x={cx} y={cy - r2 - 5} fontSize="10" textAnchor="middle" fill="#6B7280">D2</text>
        <text x={cx} y={cy - r1 + 10} fontSize="10" textAnchor="middle" fill="#6B7280">D1</text>
      </svg>
      <div className="mt-4 text-xs text-gray-500">
        Showing {Z} blades with inlet angle {beta1}° and outlet {beta2}°
      </div>
    </div>
  );
};

// Casing Diagrams Component
const CasingDiagrams = ({ voluteW, cutoffR, dischargeW, dischargeH, D2 }) => {
  const cx = 100, cy = 100;
  const scale = 150 / (D2 * 2); // approximate scale for volute view
  
  // Side View (Spiral)
  const r_base = cutoffR * scale;
  const r_growth = dischargeH * scale; // Approximation of growth
  const spiralPoints = [];
  for(let i=0; i<=36; i++) {
      const angle = (i * 10) * (Math.PI/180);
      const r = r_base + (r_growth * (i/36));
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      spiralPoints.push(`${x},${y}`);
  }
  
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col items-center col-span-1 lg:col-span-2">
      <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 w-full text-left">Casing & Discharge Geometry</h4>
      <div className="grid grid-cols-2 gap-8 w-full">
        {/* Volute Spiral View */}
        <div className="flex flex-col items-center">
            <div className="text-xs font-bold text-gray-400 mb-2">Volute Profile (Side)</div>
            <svg width="200" height="200" viewBox="0 0 200 200" className="border border-dashed border-gray-200 rounded bg-gray-50">
                <circle cx={cx} cy={cy} r={(D2/2)*scale} fill="none" stroke="#D1D5DB" strokeDasharray="3,3" />
                <path d={`M ${spiralPoints.join(" L ")}`} fill="none" stroke="#1F2937" strokeWidth="2" />
                <line x1={cx} y1={cy} x2={cx + r_base} y2={cy} stroke="#DC2626" />
                <text x={cx + r_base/2} y={cy - 5} fontSize="10" fill="#DC2626">R_cutoff</text>
            </svg>
        </div>
        
        {/* Discharge View */}
        <div className="flex flex-col items-center justify-center">
            <div className="text-xs font-bold text-gray-400 mb-2">Discharge Flange (Front)</div>
            <svg width="150" height="150" viewBox="0 0 150 150" className="border border-dashed border-gray-200 rounded bg-gray-50">
                {/* Centered Rectangle */}
                <rect x={75 - 40} y={75 - 50} width={80} height={100} fill="none" stroke="#1F2937" strokeWidth="2" />
                <text x={75} y={140} fontSize="10" textAnchor="middle" fill="#374151">Width: {dischargeW.toFixed(0)} mm</text>
                <text x={25} y={75} fontSize="10" textAnchor="middle" fill="#374151" transform="rotate(-90, 25, 75)">Height: {dischargeH.toFixed(0)} mm</text>
            </svg>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  // --- 1. INPUTS & STATE ---
  const [inputs, setInputs] = useState({
    flowRate: 5000,    // CFM
    staticPressure: 1000, // Pa
    rpm: 1750,         // RPM
    motorRating: 10,   // HP
    temp: 70,          // °F
    altitude: 0,       // ft
    bladeType: 'Backward', // Radial, Backward, Forward
    material: 'Steel',     // Steel, Aluminum_Alloy, Cast_Iron, FRP, Plastic
    dischargeArea: 2.5,    // ft² (estimated default)
    outletAngle: 35,       // degrees (beta2)
    inletAngle: 25,        // degrees (beta1)
    application: 'General' // NEW: Application Type
  });

  const [activeView, setActiveView] = useState('report');
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('fanDesignHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  // Save history to local storage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem('fanDesignHistory', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  }, [history]);

  // Helper to make inputs easily typable
  const handleInput = (key, value) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputs(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  // --- SUGGESTION LOGIC (Updated to use Application Type) ---
  const suggestions = useMemo(() => {
    // 1. Outlet Angle based on Application
    let recOutlet = 40;
    const app = APP_PROFILES[inputs.application] || APP_PROFILES['General'];
    
    // Default to app profile
    recOutlet = app.recOutlet;
    
    // Manual overrides based on blade type if user changed it manually
    if (inputs.bladeType === 'Radial') recOutlet = 90;
    else if (inputs.bladeType === 'Forward') recOutlet = 145;

    // 2. Inlet Angle (Approximate calculation)
    const Q = Number(inputs.flowRate) || 1000;
    const P = Number(inputs.staticPressure) || 500;
    const N = Number(inputs.rpm) || 1000;
    const rho = 1.2;

    const U2_est = Math.sqrt(2 * P / (rho * 1.0)); 
    const D2_est = (60 * U2_est) / (Math.PI * N);
    const D1_est = D2_est * 0.5; 
    const b1_est = D1_est * 0.25; 
    const A1 = Math.PI * D1_est * b1_est;
    const Q_si = Q * 0.000471947;
    const Cm1 = A1 > 0 ? Q_si / A1 : 10;
    const U1 = (Math.PI * D1_est * N) / 60;
    
    let recInlet = (Math.atan(Cm1 / (U1 || 1)) * 180 / Math.PI) + 3;
    recInlet = Math.max(15, Math.min(60, Math.round(recInlet)));

    return { outlet: recOutlet, inlet: recInlet };
  }, [inputs.bladeType, inputs.flowRate, inputs.staticPressure, inputs.rpm, inputs.application]);


  // --- AUTO CONFIGURE HANDLER ---
  const applyApplicationDefaults = () => {
    const app = APP_PROFILES[inputs.application];
    setInputs(prev => ({
      ...prev,
      bladeType: app.bladeType,
      outletAngle: app.recOutlet,
      inletAngle: suggestions.inlet
    }));
  };


  // --- MATERIAL DATABASE ---
  const materials = {
    'Steel': { density: 7850, yield: 250, poisson: 0.3, youngs: 200, price: 1.5, name: "Carbon Steel" },
    'Aluminum_Alloy': { density: 2700, yield: 150, poisson: 0.33, youngs: 70, price: 3.2, name: "Aluminum Alloy" },
    'Cast_Iron': { density: 7200, yield: 200, poisson: 0.27, youngs: 100, price: 1.2, name: "Cast Iron" },
    'FRP': { density: 1800, yield: 60, poisson: 0.35, youngs: 20, price: 4.5, name: "Fiberglass (FRP)" },
    'Plastic': { density: 1400, yield: 40, poisson: 0.4, youngs: 2, price: 0.8, name: "ABS Plastic" }
  };

  // --- 2. CALCULATIONS CORE (Pure Function) ---
  const calculateResults = (currentInputs) => {
    const flowRate = Number(currentInputs.flowRate) || 0;
    const staticPressure = Number(currentInputs.staticPressure) || 0;
    const rpm = Number(currentInputs.rpm) || 0;
    const motorRating = Number(currentInputs.motorRating) || 0;
    const temp = Number(currentInputs.temp) || 0;
    const altitude = Number(currentInputs.altitude) || 0;
    const outletAngle = Number(currentInputs.outletAngle) || 0;
    const inletAngle = Number(currentInputs.inletAngle) || 0;

    // A. Air Properties
    const airDensityUS = 0.075 * (530 / (460 + temp)) * Math.pow((1 - 0.0000068756 * altitude), 5.2559);
    const airDensitySI = airDensityUS * 16.0185; // kg/m³
    const altitudeWarning = altitude > 5000 ? "Warning: High altitude - consider motor derating" : "OK";

    // B. Unit Conversions
    const Q_si = flowRate * 0.000471947; // m³/s
    const P_si = staticPressure; // Pa
    const P_inwg = staticPressure / 249.088; // Convert Pa back to in.wg
    
    // C. Specific Speed
    const pressureTermUS = Math.pow(P_inwg, 0.75) || 0.001;
    const pressureTermSI = Math.pow(P_si, 0.75) || 0.001;

    const Ns_US = (rpm * Math.sqrt(flowRate)) / pressureTermUS;
    
    let bladeRecommendation = "";
    if (Ns_US < 5000) bladeRecommendation = "Radial Blades (Low Flow, High Pressure)";
    else if (Ns_US < 15000) bladeRecommendation = "Backward Inclined/Curved";
    else if (Ns_US < 30000) bladeRecommendation = "Airfoil Backward Curved";
    else bladeRecommendation = "Forward Curved (High Flow, Low Pressure)";

    // D. Pressure-Velocity & Efficiency
    // Refined Pressure Coefficient (psi) - increases with angle
    let psi = 0.0133 * outletAngle + 0.4; 
    
    let hubRatio = 0.4;
    let typeEffModifier = 0; // Modifier for blade type efficiency

    if (currentInputs.bladeType === 'Radial') {
        hubRatio = 0.35;
        typeEffModifier = -0.10; // Radial is generally less efficient than Backward
    }
    if (currentInputs.bladeType === 'Forward') {
        hubRatio = 0.45;
        typeEffModifier = -0.15; // Forward is less efficient statically
    }
    // Backward is the baseline (0 modifier)

    // Efficiency Penalty (Peak at 40 degrees)
    const effPenalty = Math.abs(outletAngle - 40) * 0.002; 
    
    // Calculate final static efficiency
    // Base log formula + Type Modifier - Angle Penalty
    const effStatic = Math.max(0.3, (0.52 + 0.12 * Math.log10(flowRate || 1)) + typeEffModifier - effPenalty);
    
    // Required Tip Speed
    const safeDensity = airDensitySI || 1.2;
    const safeEff = effStatic > 1 ? 0.85 : (effStatic || 0.5);
    const tipSpeedTheoretical = Math.sqrt((2 * P_si) / (safeDensity * psi * safeEff)); 
    const tipSpeedActual = tipSpeedTheoretical * 1.1; 
    
    let tipSpeedCheck = "OK";
    if (tipSpeedActual > 200) tipSpeedCheck = "Warning: > 200 m/s (Material Limit)";
    if (tipSpeedActual < 25) tipSpeedCheck = "Note: Low Speed";

    // E. Dimensions (ALL IN MM)
    const D2_m = (rpm > 0) ? (tipSpeedActual * 60) / (Math.PI * rpm) : 0;
    const D2_mm = D2_m * 1000; // Converted to mm
    
    // F. Inlet Design
    const D1_m = D2_m * hubRatio;
    const D1_mm = D1_m * 1000; // Converted to mm
    const D_hub_m = D1_m * 0.4;
    const D_hub_mm = D_hub_m * 1000;
    
    const Cm2 = 0.25 * tipSpeedActual;
    const b2_m = (D2_m > 0 && Cm2 > 0) ? Q_si / (Math.PI * D2_m * Cm2) : 0;
    const b2_mm = b2_m * 1000; // Converted to mm

    const Cm1 = (D1_m > 0 && b2_m > 0) ? Q_si / (Math.PI * D1_m * b2_m) : 0; 
    
    // Blade Inlet Height (b1) - typically maintained to keep velocity reasonable
    // Approximation: b1 * D1 ~ b2 * D2 (Constant Area) -> b1 ~ b2 * (D2/D1)
    const b1_mm = b2_mm * (D2_mm / D1_mm);

    let velocityStatus = "OK";
    if (Cm1 < 15) velocityStatus = "Low Velocity - Increase D1 or Decrease b1";
    else if (Cm1 > 30) velocityStatus = "High Velocity - Decrease D1 or Increase b1";

    // G. Blade Count
    const beta2Rad = (outletAngle * Math.PI) / 180;
    const bladeCountCalc = (D2_m - D1_m) > 0 ? 8.5 * Math.sin(beta2Rad) * (D2_m / (D2_m - D1_m)) : 10;
    const bladeCountFinal = Math.max(6, Math.min(12, Math.round(bladeCountCalc)));
    
    // Solidity
    const bladeSpacing = (D2_m > 0) ? (Math.PI * D2_m) / bladeCountFinal : 1;
    const solidity = ((D2_m - D1_m)/2) > 0 ? bladeSpacing / ((D2_m - D1_m)/2) : 0;
    let solidityStatus = "Good (1.8-2.5)";
    if (solidity > 2.5) solidityStatus = "Too many blades";
    if (solidity < 1.8) solidityStatus = "Too few blades";

    // H. Stress Analysis
    const mat = materials[currentInputs.material];
    const sigma_c = (mat.density * Math.pow(tipSpeedActual, 2) * (1 + mat.poisson)) / 3;
    const sigma_b = 0.1 * sigma_c;
    const sigma_total = sigma_c + sigma_b;
    const sigma_total_mpa = sigma_total / 1000000;
    
    const safetyFactor = (sigma_total_mpa > 0) ? mat.yield / sigma_total_mpa : 999;
    let stressStatus = "UNSAFE";
    if (safetyFactor > 2) stressStatus = "SAFE";
    else if (safetyFactor > 1.5) stressStatus = "ACCEPTABLE";
    else if (safetyFactor > 1.2) stressStatus = "MARGINAL";

    // I. Power & Cost
    const airPowerHP = (flowRate * P_inwg) / 6356;
    const brakePowerHP = airPowerHP / (effStatic || 1); // This is the required BHP
    const brakePowerKW = brakePowerHP * 0.7457;
    const powerWatts = brakePowerHP * 745.7;

    // Motor Verification
    const motorLoadPct = motorRating > 0 ? (brakePowerHP / motorRating) * 100 : 0;
    let motorCheck = "OK";
    if (motorLoadPct > 100) motorCheck = "OVERLOADED";
    else if (motorLoadPct > 85) motorCheck = "Warning: High Load";
    else if (motorLoadPct < 50) motorCheck = "Oversized";

    // --- MECHANICAL CALCULATIONS (Shaft, Key, Bearing) ---
    const safeRPM = rpm > 0 ? rpm : 1;
    const torqueNm = (brakePowerKW * 9550) / safeRPM;
    
    const tauAllow = 40 * 1000000; // 40 MPa in Pa
    const designTorque = torqueNm * 1.5;
    const equivTorque = Math.sqrt(Math.pow(1.5 * designTorque, 2) + Math.pow(designTorque, 2)); 
    
    const shaftDiaCalcM = Math.pow((16 * equivTorque) / (Math.PI * tauAllow), 1/3);
    const shaftDiaCalcMm = shaftDiaCalcM * 1000;
    
    const standardShafts = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120];
    const shaftDiaStd = standardShafts.find(d => d >= shaftDiaCalcMm) || Math.ceil(shaftDiaCalcMm);

    let keyWidth = 6, keyHeight = 6;
    if (shaftDiaStd > 22) { keyWidth = 8; keyHeight = 7; }
    if (shaftDiaStd > 30) { keyWidth = 10; keyHeight = 8; }
    if (shaftDiaStd > 38) { keyWidth = 12; keyHeight = 8; }
    if (shaftDiaStd > 44) { keyWidth = 14; keyHeight = 9; }
    if (shaftDiaStd > 50) { keyWidth = 16; keyHeight = 10; }
    if (shaftDiaStd > 58) { keyWidth = 18; keyHeight = 11; }
    if (shaftDiaStd > 65) { keyWidth = 20; keyHeight = 12; }
    if (shaftDiaStd > 75) { keyWidth = 22; keyHeight = 14; }
    if (shaftDiaStd > 85) { keyWidth = 25; keyHeight = 14; }
    
    const keyLength = Math.max(keyWidth, Math.round((2 * torqueNm * 1000) / (shaftDiaStd * keyWidth * 90)));

    const bearingBoreCode = Math.floor(shaftDiaStd / 5);
    const bearingSeries = `63${bearingBoreCode < 10 ? '0'+bearingBoreCode : bearingBoreCode}`;

    // --- Motor Selection (Standard Sizes & Amps) ---
    const requiredMotorPower = brakePowerHP * 1.15; // 1.15 Safety Factor
    const standardMotors = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300];
    const suggestedMotorHP = standardMotors.find(m => m >= requiredMotorPower) || ">300";
    
    // Approx Amps (460V 3-phase, ~1.25A per HP)
    const estAmps = (typeof suggestedMotorHP === 'number') ? (suggestedMotorHP * 1.25).toFixed(1) : "N/A";
    const runningAmps = (brakePowerHP * 1.25).toFixed(1);
    const startingAmps = (Number(runningAmps) * 6).toFixed(1);
    const startingTorque = (torqueNm * 1.5).toFixed(1);

    // --- CASING CALCULATIONS (New) ---
    // Volute Width B (must accommodate the widest part of impeller b1 + clearance)
    const voluteWidth_mm = b1_mm * 1.25; 
    
    // Cut-off Clearance (approx 5-10% of D2)
    const cutoffClearance_mm = D2_mm * 0.07; // 7%
    const cutoffRadius_mm = (D2_mm / 2) + cutoffClearance_mm;

    // Discharge Velocity (typically 0.6-0.8 of Tip Speed for static regain)
    const dischargeVelocity = tipSpeedActual * 0.7; // m/s
    
    // Discharge Area (Q = A * V => A = Q / V)
    const dischargeArea_m2 = (dischargeVelocity > 0) ? (Q_si / dischargeVelocity) : 0;
    const dischargeArea_mm2 = dischargeArea_m2 * 1000000;

    // Rectangular Discharge Dimensions (Aspect Ratio 1.25:1 approx)
    const dischargeWidth_mm = Math.sqrt(dischargeArea_mm2 / 1.25);
    const dischargeHeight_mm = dischargeWidth_mm * 1.25;
    
    // Equivalent Round Discharge Diameter
    const dischargeDiameter_mm = Math.sqrt((4 * dischargeArea_mm2) / Math.PI);
    
    // Casing Radii
    const r_base = cutoffRadius_mm;
    const r_growth = dischargeHeight_mm;
    const R0 = r_base;
    const R90 = r_base + (r_growth * 0.25);
    const R180 = r_base + (r_growth * 0.50);
    const R270 = r_base + (r_growth * 0.75);
    const R360 = r_base + (r_growth * 1.00);

    // --- End Mechanical & Casing ---

    const volImpeller = (Math.PI/4 * (Math.pow(D2_m, 2) - Math.pow(D_hub_m, 2)) * b2_m * bladeCountFinal * 0.1); 
    const volCasing = Math.pow(D2_m * 1.5, 3) * 0.05; 
    const materialCost = (volImpeller + volCasing) * mat.density * mat.price;
    const mfgFactor = 1 + (0.1 * bladeCountFinal) + (P_inwg > 5 ? 0.15 : 0);
    const estCost = materialCost * mfgFactor;

    // J. Noise
    const safeWatts = powerWatts > 1 ? powerWatts : 1;
    const safePsi = P_si > 1 ? P_si : 1;
    const safeU = tipSpeedActual > 1 ? tipSpeedActual : 1;
    const soundPowerLevel = 10 + 10 * Math.log10(safeWatts) + 20 * Math.log10(safePsi/100) + 3 * Math.log10(safeU/50);

    // K. Performance Curve Data
    const performanceCurve = [];
    for(let pct = 40; pct <= 120; pct += 10) {
      const q = (pct/100) * flowRate;
      const ratio = (flowRate > 0) ? q / flowRate : 0;
      const p_static = staticPressure * (1 - 0.25 * Math.pow(ratio - 1, 2)) * (1 - 0.1 * Math.pow(ratio - 1, 3));
      const eff = effStatic * Math.exp(-0.5 * Math.pow((ratio - 1)/0.25, 2));
      const p_static_inwg = p_static / 249.088;
      const bhp = (q * p_static_inwg) / (6356 * (eff || 0.1)); 

      performanceCurve.push({
        pct,
        flow: q,
        pressure: Math.max(0, p_static),
        efficiency: eff * 100,
        power: bhp
      });
    }

    // --- CAD SCRIPT GENERATION (Integrated) ---
    // Ensure all variables match calculated results exactly
    const D2 = D2_mm;
    const D1 = D1_mm;
    const Dh = D_hub_mm;
    const Shaft = shaftDiaStd;
    const Z = bladeCountFinal; // EXACT BLADE COUNT
    const b1 = currentInputs.inletAngle;
    const b2 = currentInputs.outletAngle;

    let scr = "; Centrifugal Fan Design Script\n";
    scr += "; Generated by FanDesign Pro\n";
    scr += "OSMODE 0\n"; 
    scr += "ucs world\n";

    // Text Height
    const th = D2 / 25; 

    // Layers
    scr += "-LAYER M SHAFT C 1 255 \n"; 
    scr += "-LAYER M HUB C 3 255 \n"; 
    scr += "-LAYER M BLADES C 4 255 \n"; 
    scr += "-LAYER M CASING C 6 255 \n"; 
    scr += "-LAYER M DIMS C 7 255 \n"; 
    scr += "-LAYER M TEXT C 7 255 \n"; 

    // Draw Shaft with Keyway
    scr += "CLAYER SHAFT\n";
    scr += `CIRCLE 0,0 D ${Shaft.toFixed(2)}\n`;
    // Keyway
    scr += "PLINE\n";
    scr += `${(-keyWidth/2).toFixed(3)},${(Shaft/2 - keyHeight/2).toFixed(3)}\n`;
    scr += `${(-keyWidth/2).toFixed(3)},${(Shaft/2 + keyHeight/2).toFixed(3)}\n`;
    scr += `${(keyWidth/2).toFixed(3)},${(Shaft/2 + keyHeight/2).toFixed(3)}\n`;
    scr += `${(keyWidth/2).toFixed(3)},${(Shaft/2 - keyHeight/2).toFixed(3)}\n`;
    scr += "C\n"; // Close
    
    scr += `CLAYER TEXT\n`;
    scr += `TEXT 0,${Shaft/2 + th} ${th} 0 SHAFT D${Shaft.toFixed(0)}\n`;

    // Draw Hub
    scr += "CLAYER HUB\n";
    scr += `CIRCLE 0,0 D ${Dh.toFixed(2)}\n`;
    scr += `CLAYER TEXT\n`;
    scr += `TEXT ${Dh/2},${Dh/2} ${th} 0 HUB D${Dh.toFixed(0)}\n`;

    // Draw Impeller Boundaries
    scr += "CLAYER DIMS\n";
    scr += `CIRCLE 0,0 D ${D1.toFixed(2)}\n`;
    scr += `CIRCLE 0,0 D ${D2.toFixed(2)}\n`;
    
    // Labels for D1/D2
    scr += `CLAYER TEXT\n`;
    scr += `TEXT ${D1/2 + 5},0 ${th} 0 D1=${D1.toFixed(0)}\n`;
    scr += `TEXT ${D2/2 + 5},0 ${th} 0 D2=${D2.toFixed(0)}\n`;
    scr += `TEXT ${D2/2 + 5},-${th*1.5} ${th} 0 Thk=4mm\n`;

    // Draw Single Blade (Simplified Logarithmic Curve)
    scr += "CLAYER BLADES\n";
    scr += "PLINE\n";
    
    const r1 = D1/2;
    const r2 = D2/2;
    const steps = 15;
    
    // Blade curvature approximation
    const beta_avg_rad = ((Number(b1) + Number(b2)) / 2) * (Math.PI/180);
    // wrap angle roughly ln(R2/R1) / tan(beta)
    const wrap_angle = Math.log(r2/r1) / Math.tan(beta_avg_rad || 0.5); 
    
    for(let i=0; i<=steps; i++) {
        const r = r1 + (r2 - r1) * (i/steps);
        const current_theta = wrap_angle * (i/steps);
        const x = r * Math.cos(current_theta);
        const y = r * Math.sin(current_theta);
        scr += `${x.toFixed(3)},${y.toFixed(3)}\n`;
    }
    scr += "\n"; // End Pline

    // Array the blade
    scr += "-ARRAY\n";
    scr += "L\n"; // Select Last (the blade)
    scr += "\n"; // End select
    scr += "P\n"; // Polar
    scr += "0,0\n"; // Center
    scr += `${Z}\n`; // Count
    scr += "360\n"; // Angle
    scr += "Y\n"; // Rotate? Yes
    
    // Draw Volute Casing (Spiral)
    scr += "CLAYER CASING\n";
    // Suction Hole
    scr += `CIRCLE 0,0 D ${D1.toFixed(2)}\n`; 

    scr += "PLINE\n";
    
    // const r_base = cutoffRadius_mm;  // Defined above
    // const r_growth = dischargeHeight_mm; // Defined above
    
    const volute_steps = 36; 
    let lastX = 0, lastY = 0;
    for(let i=0; i<=volute_steps; i++) {
        const angle_deg = i * 10;
        const angle_rad = angle_deg * (Math.PI/180);
        const r_curr = r_base + (r_growth * (i/volute_steps));
        
        const x = r_curr * Math.cos(angle_rad);
        const y = r_curr * Math.sin(angle_rad);
        scr += `${x.toFixed(3)},${y.toFixed(3)}\n`;
        lastX = x; lastY = y;
    }
    scr += "\n"; // End Pline
    
    // Label Casing
    scr += `CLAYER TEXT\n`;
    scr += `TEXT ${lastX + 10},${lastY} ${th} 0 CASING\n`;
    scr += `TEXT ${lastX + 10},${lastY - th*1.5} ${th} 0 W=${voluteWidth_mm.toFixed(0)}mm\n`;
    scr += `TEXT ${lastX + 10},${lastY - th*3.0} ${th} 0 Thk=3mm\n`;
    scr += `TEXT ${lastX + 10},${lastY - th*4.5} ${th} 0 DischDia=${dischargeDiameter_mm.toFixed(0)}mm\n`;

    scr += "ZOOM E\n";
    scr += "REGEN\n";

    // --- VBA 2D SCRIPT (VBScript Format) ---
    let vba2D = `
' Solid Edge 2D Fan Draft Script
' Generated by FanDesign Pro
Option Explicit

Dim objApp, objDoc, objSheet, objLines, objCircles, objLine
Dim i, j
Dim r1, r2, wrap, rotOffset
Dim x1, y1, x2, y2, t1, t2, rad1, ang1, rad2, ang2

On Error Resume Next
Set objApp = GetObject(, "SolidEdge.Application")
If Err Then
    Err.Clear
    Set objApp = CreateObject("SolidEdge.Application")
    objApp.Visible = True
End If
On Error GoTo 0

Set objDoc = objApp.Documents.Add("SolidEdge.DraftDocument")
Set objSheet = objDoc.ActiveSheet
Set objLines = objSheet.Lines2d
Set objCircles = objSheet.Circles2d

' Shaft, Hub, Inlet, Outlet
Call objCircles.AddByCenterRadius(0, 0, ${Shaft / 2000})
Call objCircles.AddByCenterRadius(0, 0, ${Dh / 2000})
Call objCircles.AddByCenterRadius(0, 0, ${D1 / 2000})
Call objCircles.AddByCenterRadius(0, 0, ${D2 / 2000})

' Blades
r1 = ${D1 / 2000}
r2 = ${D2 / 2000}
wrap = ${Math.log((D2_mm/2)/(D1_mm/2)) / Math.tan(((Number(b1) + Number(b2)) / 2) * (Math.PI/180) || 0.5)}

For i = 0 To ${Z - 1}
    rotOffset = (i * 2 * 3.14159) / ${Z}
    For j = 0 To 14
        t1 = j / 15
        t2 = (j + 1) / 15
        
        rad1 = r1 + (r2 - r1) * t1
        ang1 = rotOffset + wrap * t1
        x1 = rad1 * Cos(ang1)
        y1 = rad1 * Sin(ang1)
        
        rad2 = r1 + (r2 - r1) * t2
        ang2 = rotOffset + wrap * t2
        x2 = rad2 * Cos(ang2)
        y2 = rad2 * Sin(ang2)
        
        Set objLine = objLines.AddBy2Points(x1, y1, x2, y2)
        
        ' Welding Marks: Set line style to a dashed/phantom type
        On Error Resume Next
        objLine.Style.Name = "Dash-Dot" 
        On Error GoTo 0
    Next
Next

objApp.StartCommand 32793 ' Fit View
`;

    // --- VBA HUB SCRIPT (VBScript Format - Creates Hub.par) ---
    // Updated: Hub Height = b2 * 1.5, Keyway, Text Dimensions
    let vbsHub = `
' Solid Edge Hub Part Generator (Height x Dia with Keyway)
' Generated by FanDesign Pro
Option Explicit

Dim objApp, objDoc, objProfile, objCircle, objExtrusion, objCutout
Dim Dh, Shaft, Width, KeyW, KeyH
Dim x, y

On Error Resume Next
Set objApp = GetObject(, "SolidEdge.Application")
If Err Then
    Err.Clear
    Set objApp = CreateObject("SolidEdge.Application")
    objApp.Visible = True
End If
On Error GoTo 0

Set objDoc = objApp.Documents.Add("SolidEdge.PartDocument")

' Parameters (Meters)
' Hub Diameter: ${D_hub_mm} mm
Dh = ${D_hub_mm / 1000}
' Shaft Diameter: ${shaftDiaStd} mm
Shaft = ${shaftDiaStd / 1000}
' Hub Height (Width) = 1.5 * Blade Width (${b2_mm.toFixed(2)} mm)
Width = ${(b2_mm * 1.5) / 1000} 
' Keyway W=${keyWidth} mm, H=${keyHeight} mm
KeyW = ${keyWidth / 1000}
KeyH = ${keyHeight / 1000}

' 1. Hub Cylinder (Extrusion)
Set objProfile = objDoc.ProfileSets.Add.Profiles.Add(objDoc.RefPlanes.Item(1))
Call objProfile.Circles2d.AddByCenterRadius(0, 0, Dh / 2)
Set objExtrusion = objDoc.Models.AddFiniteExtrudedProtrusion(1, objProfile, 0, Width)
objProfile.Visible = False

' 2. Shaft Bore with Keyway (Cutout)
Set objProfile = objDoc.ProfileSets.Add.Profiles.Add(objDoc.RefPlanes.Item(1))

' Draw shaft circle
Call objProfile.Circles2d.AddByCenterRadius(0, 0, Shaft / 2)

' Draw Keyway Rectangle (Simplified: centered at top of shaft hole)
Call objProfile.Lines2d.AddBy2Points(-KeyW/2, (Shaft/2) - KeyH/2, -KeyW/2, (Shaft/2) + KeyH/2)
Call objProfile.Lines2d.AddBy2Points(-KeyW/2, (Shaft/2) + KeyH/2, KeyW/2, (Shaft/2) + KeyH/2)
Call objProfile.Lines2d.AddBy2Points(KeyW/2, (Shaft/2) + KeyH/2, KeyW/2, (Shaft/2) - KeyH/2)
Call objProfile.Lines2d.AddBy2Points(KeyW/2, (Shaft/2) - KeyH/2, -KeyW/2, (Shaft/2) - KeyH/2)

' Cut through all
Set objCutout = objDoc.Models.AddFiniteExtrudedCutout(1, objProfile, 0, Width * 2)
objProfile.Visible = False

' Add Dimensions Text Profile on Face
Set objProfile = objDoc.ProfileSets.Add.Profiles.Add(objDoc.RefPlanes.Item(1))
Call objProfile.TextBoxes2d.Add(0, Dh/2 + 0.02, 0, "Hub D=${D_hub_mm.toFixed(1)}mm H=${(b2_mm * 1.5).toFixed(1)}mm")
objProfile.Visible = True

objApp.StartCommand 32793 ' Iso View
`;

    // --- VBA ROTOR SCRIPT (VBScript Format - Creates Rotor.par) ---
    // Updated: Plate Thickness 4mm, Center Hole = Hub Dia, Blade Marking
    let vbsRotor = `
' Solid Edge Rotor Part Generator
' Generated by FanDesign Pro
Option Explicit

Dim objApp, objDoc, objProfile, objCircle, objExtrusion, objCutout, objBladeProfile
Dim D2, Dh, PlateThk
Dim i, j, r1, r2, wrap, rotOffset, x1, y1, x2, y2, t1, t2, rad1, ang1, rad2, ang2

On Error Resume Next
Set objApp = GetObject(, "SolidEdge.Application")
If Err Then
    Err.Clear
    Set objApp = CreateObject("SolidEdge.Application")
    objApp.Visible = True
End If
On Error GoTo 0

Set objDoc = objApp.Documents.Add("SolidEdge.PartDocument")

' Parameters
' D2 = ${D2_mm.toFixed(1)} mm
D2 = ${D2_mm / 1000}
' Hub Hole = ${D_hub_mm.toFixed(1)} mm
Dh = ${D_hub_mm / 1000} 
' Plate Thickness = 4mm
PlateThk = 0.004 

' 1. Backplate (Extrusion)
Set objProfile = objDoc.ProfileSets.Add.Profiles.Add(objDoc.RefPlanes.Item(1))
Call objProfile.Circles2d.AddByCenterRadius(0, 0, D2 / 2)
Set objExtrusion = objDoc.Models.AddFiniteExtrudedProtrusion(1, objProfile, 0, PlateThk)
objProfile.Visible = False

' 2. Center Hole for Hub (Cutout)
Set objProfile = objDoc.ProfileSets.Add.Profiles.Add(objDoc.RefPlanes.Item(1))
Call objProfile.Circles2d.AddByCenterRadius(0, 0, Dh / 2)
Set objCutout = objDoc.Models.AddFiniteExtrudedCutout(1, objProfile, 0, PlateThk * 2)
objProfile.Visible = False

' 3. Blade Layout Marking (Sketch on Face for Welding)
' We add a profile but DO NOT extrude it. This remains as a visible sketch.
Set objBladeProfile = objDoc.ProfileSets.Add.Profiles.Add(objDoc.RefPlanes.Item(1))
On Error Resume Next
objBladeProfile.Name = "Blade_Marking_Pattern"
On Error GoTo 0

r1 = ${D1 / 2000}
r2 = ${D2 / 2000}
wrap = ${Math.log((D2_mm/2)/(D1_mm/2)) / Math.tan(((Number(b1) + Number(b2)) / 2) * (Math.PI/180) || 0.5)}

For i = 0 To ${Z - 1}
    rotOffset = (i * 2 * 3.14159265359) / ${Z}
    For j = 0 To 14
         t1 = j / 15
         t2 = (j + 1) / 15
         
         rad1 = r1 + (r2 - r1) * t1
         ang1 = rotOffset + wrap * t1
         x1 = rad1 * Cos(ang1)
         y1 = rad1 * Sin(ang1)
         
         rad2 = r1 + (r2 - r1) * t2
         ang2 = rotOffset + wrap * t2
         x2 = rad2 * Cos(ang2)
         y2 = rad2 * Sin(ang2)
         
         Call objBladeProfile.Lines2d.AddBy2Points(x1, y1, x2, y2)
    Next
Next

' Add Dimension Text to Sketch
Call objBladeProfile.TextBoxes2d.Add(0, D2/2 + 0.05, 0, "D2=${D2_mm.toFixed(0)}mm Thk=4mm")

objBladeProfile.Visible = True 
objApp.StartCommand 32793 ' Iso View
`;

    // --- VBA CASING SCRIPT (VBScript Format - Creates Casing.psm) ---
    // Updated: Sheet Metal 3mm, Suction Hole = D1
    let vbsCasing = `
' Solid Edge Casing SheetMetal Generator
' Generated by FanDesign Pro
Option Explicit

Dim objApp, objDoc, objProfile, objTab, objCutout
Dim r_base, r_growth, x, y, angle, r
Dim i, lastX, lastY
Dim SuctionDia, Thk

On Error Resume Next
Set objApp = GetObject(, "SolidEdge.Application")
If Err Then
    Err.Clear
    Set objApp = CreateObject("SolidEdge.Application")
    objApp.Visible = True
End If
On Error GoTo 0

Set objDoc = objApp.Documents.Add("SolidEdge.SheetMetalDocument")

' Parameters
' Cutoff Radius = ${cutoffRadius_mm.toFixed(1)} mm
r_base = ${cutoffRadius_mm / 1000}
' Growth (Discharge Height) = ${dischargeHeight_mm.toFixed(1)} mm
r_growth = ${dischargeHeight_mm / 1000}
' Suction Hole = ${D1_mm.toFixed(1)} mm
SuctionDia = ${D1_mm / 1000} 
' Thickness = 3mm
Thk = 0.003

' Create Profile for Scroll
Set objProfile = objDoc.ProfileSets.Add.Profiles.Add(objDoc.RefPlanes.Item(1))

' Draw approximate spiral with line segments
lastX = r_base
lastY = 0

For i = 1 To 36
    angle = (i * 10) * (3.14159265359 / 180)
    r = r_base + (r_growth * (i / 36))
    x = r * Cos(angle)
    y = r * Sin(angle)
    
    Call objProfile.Lines2d.AddBy2Points(lastX, lastY, x, y)
    lastX = x
    lastY = y
Next

' Close profile (Straight line back to start)
Call objProfile.Lines2d.AddBy2Points(lastX, lastY, r_base, 0)

' Create Tab (Sheet Metal Base)
Set objTab = objDoc.Models.AddFiniteTab(objProfile, 1, Thk)
objProfile.Visible = False

' Create Suction Hole (Cutout)
Set objProfile = objDoc.ProfileSets.Add.Profiles.Add(objDoc.RefPlanes.Item(1))
Call objProfile.Circles2d.AddByCenterRadius(0, 0, SuctionDia / 2)
Set objCutout = objDoc.Models.AddFiniteCutout(objProfile, 1, 0.01) ' Cut through
objProfile.Visible = False

' Add Dimension Text
Set objProfile = objDoc.ProfileSets.Add.Profiles.Add(objDoc.RefPlanes.Item(1))
Call objProfile.TextBoxes2d.Add(0, r_base + r_growth + 0.05, 0, "Thk=3mm Suction=${D1_mm.toFixed(0)}mm")
objProfile.Visible = True

objApp.StartCommand 32793 ' Iso View
`;

    return {
      airDensityUS,
      airDensitySI,
      altitudeWarning,
      Ns_US,
      bladeRecommendation,
      effStatic,
      tipSpeedActual,
      tipSpeedCheck,
      D2_mm,
      D1_mm,
      b2_mm,
      b1_mm, 
      D_hub_mm,
      Cm1,
      velocityStatus,
      bladeCountFinal,
      solidityStatus,
      sigma_total_mpa,
      safetyFactor,
      stressStatus,
      brakePowerHP,
      motorLoadPct,
      motorCheck,
      estCost,
      soundPowerLevel,
      performanceCurve,
      D2_m,
      P_si,
      torqueNm,
      shaftDiaStd,
      keyWidth,
      keyHeight,
      keyLength,
      bearingSeries,
      suggestedMotorHP,
      estAmps,
      runningAmps,
      startingAmps,
      startingTorque,
      voluteWidth_mm,
      cutoffClearance_mm,
      cutoffRadius_mm,
      dischargeArea_mm2,
      dischargeWidth_mm,
      dischargeHeight_mm,
      dischargeDiameter_mm, // Added this line
      R0, R90, R180, R270, R360, // Added scroll radii
      cadScript: scr,
      vbaScript2D: vba2D, 
      vbsHub: vbsHub, 
      vbsRotor: vbsRotor,
      vbsCasing: vbsCasing
    };
  };

  // --- 3. RESULTS STATE (No longer live updated) ---
  const [results, setResults] = useState(() => calculateResults(inputs));

  // --- 4. ACTION HANDLERS ---
  const handleCalculate = () => {
    const newResults = calculateResults(inputs);
    setResults(newResults);
    
    // Create History Item
    const historyItem = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      inputs: { ...inputs }, // Snapshot of inputs
      summary: {
        flow: Number(inputs.flowRate),
        pressure: Number(inputs.staticPressure),
        rpm: Number(inputs.rpm),
        power: newResults.brakePowerHP,
        efficiency: newResults.effStatic * 100,
        diameter: newResults.D2_mm // Store in mm
      }
    };
    
    setHistory(prev => [historyItem, ...prev]);
    setActiveView('report');
  };

  const handleLoadFromHistory = (item) => {
    setInputs(item.inputs);
    setResults(calculateResults(item.inputs));
    setActiveView('report');
  };

  const handleDeleteHistory = (id, e) => {
    e.stopPropagation(); // Prevent triggering the card click
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* --- LEFT SIDEBAR: INPUT TABLE --- */}
      <div className="w-full lg:w-96 bg-white border-r border-gray-200 overflow-y-auto shadow-xl z-20 flex flex-col">
        {/* Header */}
        <div className="p-5 bg-blue-900 text-white shadow-sm flex items-center space-x-3 sticky top-0 z-10">
           <Wind className="w-6 h-6 text-blue-300" />
           <div>
             <h1 className="text-lg font-bold tracking-wide">FanDesign</h1>
             <div className="text-xs text-blue-200 font-mono tracking-wider">PRO CALCULATOR</div>
           </div>
        </div>

        {/* Input Form Area */}
        <div className="flex-1 p-5 space-y-6 pb-24"> 
           {/* Section 0: Design Wizard */}
           <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center">
                <LayoutGrid className="w-3 h-3 mr-1.5" /> Design Application
              </h3>
              <div className="space-y-3">
                 <select 
                   value={inputs.application}
                   onChange={(e) => setInputs(prev => ({...prev, application: e.target.value}))}
                   className="w-full p-2 text-sm bg-white border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"
                 >
                   {Object.keys(APP_PROFILES).map(key => (
                     <option key={key} value={key}>{APP_PROFILES[key].label}</option>
                   ))}
                 </select>
                 <div className="text-xs text-blue-600 italic">
                   {APP_PROFILES[inputs.application].desc}
                 </div>
                 <button 
                   onClick={applyApplicationDefaults}
                   className="w-full py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold rounded transition-colors flex items-center justify-center"
                 >
                   <Lightbulb className="w-3 h-3 mr-1.5" /> Apply Suggested Settings
                 </button>
              </div>
           </div>

           {/* Section 1: Operations */}
           <div>
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
               <Activity className="w-3 h-3 mr-1.5" /> Operating Conditions
             </h3>
             <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200">
                <InputRow label="Flow Rate" unit="CFM" value={inputs.flowRate} onChange={(e) => handleInput('flowRate', e.target.value)} />
                <InputRow label="Static Pressure" unit="Pa" value={inputs.staticPressure} onChange={(e) => handleInput('staticPressure', e.target.value)} />
                <InputRow label="Fan Speed" unit="RPM" value={inputs.rpm} onChange={(e) => handleInput('rpm', e.target.value)} />
                <InputRow label="Motor Power" unit="HP" value={inputs.motorRating} onChange={(e) => handleInput('motorRating', e.target.value)} />
             </div>
           </div>

           {/* Section 2: Environment */}
           <div>
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
               <Thermometer className="w-3 h-3 mr-1.5" /> Environment
             </h3>
             <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200">
                <InputRow label="Temperature" unit="°F" value={inputs.temp} onChange={(e) => handleInput('temp', e.target.value)} />
                <InputRow label="Altitude" unit="ft" value={inputs.altitude} onChange={(e) => handleInput('altitude', e.target.value)} />
             </div>
           </div>

           {/* Section 3: Geometry & Material */}
           <div>
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
               <Settings className="w-3 h-3 mr-1.5" /> Design Specs
             </h3>
             <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200 p-2 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 block">Blade Type</label>
                  <select 
                    value={inputs.bladeType}
                    onChange={(e) => setInputs({...inputs, bladeType: e.target.value})}
                    className="w-full p-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Radial">Radial (Industrial)</option>
                    <option value="Backward">Backward Curved (HVAC)</option>
                    <option value="Forward">Forward Curved (Unitary)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 block">Material</label>
                  <select 
                    value={inputs.material}
                    onChange={(e) => setInputs({...inputs, material: e.target.value})}
                    className="w-full p-2 text-sm bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.keys(materials).map(k => (
                      <option key={k} value={k}>{materials[k].name}</option>
                    ))}
                  </select>
                </div>
                {/* Added Suggestions here */}
                <InputRow 
                   label="Outlet Angle" 
                   unit="°" 
                   value={inputs.outletAngle} 
                   onChange={(e) => handleInput('outletAngle', e.target.value)} 
                   suggestion={suggestions.outlet}
                />
                <InputRow 
                   label="Inlet Angle" 
                   unit="°" 
                   value={inputs.inletAngle} 
                   onChange={(e) => handleInput('inletAngle', e.target.value)} 
                   suggestion={suggestions.inlet}
                />
             </div>
           </div>
        </div>

        {/* Calculate Button Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0 z-20">
          <button 
            onClick={handleCalculate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2"
          >
            <Calculator className="w-5 h-5" />
            <span>CALCULATE DESIGN</span>
          </button>
        </div>
      </div>

      {/* --- RIGHT PANEL --- */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
         {/* Navigation Header */}
         <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 print:hidden">
            <h2 className="text-xl font-bold text-gray-800">
              {activeView === 'report' ? 'Design Report' : activeView === 'cad' ? 'CAD Export' : activeView === 'solidedge' ? 'Solid Edge (VBA)' : activeView === 'converter' ? 'Unit Converter' : 'Calculation History'}
            </h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveView('report')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'report' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Report</span>
              </button>
              <button 
                onClick={() => setActiveView('cad')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'cad' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FileCode className="w-4 h-4" />
                <span className="hidden sm:inline">CAD</span>
              </button>
              <button 
                onClick={() => setActiveView('solidedge')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'solidedge' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Solid Edge</span>
              </button>
              <button 
                onClick={() => setActiveView('converter')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'converter' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Convert</span>
              </button>
              <button 
                onClick={() => setActiveView('history')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === 'history' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </button>
            </div>
         </div>

         {/* --- REPORT VIEW --- */}
         {activeView === 'report' && (
           <div className="flex-1 overflow-y-auto p-6 lg:p-10 print:p-0 print:overflow-visible" id="report-content">
             <div className="max-w-6xl mx-auto space-y-8 pb-20 print:pb-0 print:w-full print:max-w-none">
              
               {/* PDF Download Button */}
               <div className="flex justify-end mb-4 print:hidden">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Report</span>
                  </button>
               </div>

              {/* 1. INPUT SUMMARY (New Section) */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
                <SectionHeader Icon={ClipboardList} title="Your Inputs" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="block text-gray-500 text-xs">Flow Rate</span>
                    <span className="font-bold text-gray-800">{inputs.flowRate} CFM</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="block text-gray-500 text-xs">Pressure</span>
                    <span className="font-bold text-gray-800">{inputs.staticPressure} Pa</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="block text-gray-500 text-xs">Speed</span>
                    <span className="font-bold text-gray-800">{inputs.rpm} RPM</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="block text-gray-500 text-xs">Temp / Alt</span>
                    <span className="font-bold text-gray-800">{inputs.temp}°F / {inputs.altitude}ft</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="block text-gray-500 text-xs">Motor</span>
                    <span className="font-bold text-gray-800">{inputs.motorRating} HP</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="block text-gray-500 text-xs">Material</span>
                    <span className="font-bold text-gray-800">{materials[inputs.material].name.split(' ')[0]}</span>
                  </div>
                </div>
              </section>

              {/* 2. Performance Overview */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
                <SectionHeader Icon={Activity} title="Performance & Air Properties" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <ResultCard 
                    title="Corrected Density" 
                    value={results.airDensityUS} 
                    unit="lb/ft³" 
                    subtext={results.altitudeWarning}
                    status={results.altitudeWarning === "OK" ? "OK" : "WARN"}
                  />
                  <ResultCard 
                    title="Specific Speed (US)" 
                    value={results.Ns_US} 
                    subtext={results.bladeRecommendation}
                  />
                  <ResultCard 
                    title="Static Efficiency" 
                    value={results.effStatic * 100} 
                    unit="%" 
                    subtext="Estimated Peak"
                  />
                  <ResultCard 
                    title="Brake Power" 
                    value={results.brakePowerHP} 
                    unit="HP" 
                    subtext={
                      <div className="flex flex-col text-right">
                        <span>Rec. Motor: <b>{results.suggestedMotorHP} HP</b></span>
                        <span>Est. Current: <b>{results.estAmps} A</b></span>
                      </div>
                    }
                    status={results.motorCheck === "OK" ? "OK" : "WARN"}
                  />
                </div>
                {/* New Torque/Amp Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                   <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 shadow-sm">
                      <div className="text-xs font-bold text-gray-500 uppercase mb-2">Torque Analysis</div>
                      <div className="flex justify-between mb-1"><span className="text-sm">Running Torque</span><span className="font-bold">{results.torqueNm.toFixed(1)} Nm</span></div>
                      <div className="flex justify-between"><span className="text-sm">Starting Torque (150%)</span><span className="font-bold">{results.startingTorque} Nm</span></div>
                   </div>
                   <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 shadow-sm">
                      <div className="text-xs font-bold text-gray-500 uppercase mb-2">Electrical Specs</div>
                      <div className="flex justify-between mb-1"><span className="text-sm">Running Amps</span><span className="font-bold">{results.runningAmps} A</span></div>
                      <div className="flex justify-between"><span className="text-sm">Starting Amps (DOL)</span><span className="font-bold text-red-600">{results.startingAmps} A</span></div>
                   </div>
                </div>
              </section>

              {/* 3. Casing Geometry Design (Moved Up) */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
                <SectionHeader Icon={Settings} title="Casing Geometry Design" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="col-span-1 space-y-4">
                     <div className="p-4 rounded-lg border-l-4 bg-gray-50 border-gray-500">
                        <div className="text-sm font-bold uppercase text-gray-500 mb-1">Volute Width</div>
                        <div className="text-3xl font-bold text-gray-900">{results.voluteWidth_mm.toFixed(0)} <span className="text-lg text-gray-500">mm</span></div>
                        <div className="text-xs mt-2 text-gray-600">Based on Impeller Width + Clearance</div>
                     </div>
                  </div>
                  <div className="col-span-1 lg:col-span-2">
                     {/* Added Scroll Radii Column */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                        <div>
                           <h4 className="text-xs font-bold text-gray-400 uppercase border-b pb-2 mb-3">Volute Dimensions</h4>
                           <dl className="space-y-2 text-sm">
                              <div className="flex justify-between"><dt className="text-gray-600">Cut-off Clearance</dt><dd className="font-medium">{results.cutoffClearance_mm.toFixed(1)} mm</dd></div>
                              <div className="flex justify-between"><dt className="text-gray-600">Cut-off Radius</dt><dd className="font-medium">{results.cutoffRadius_mm.toFixed(1)} mm</dd></div>
                              <div className="flex justify-between"><dt className="text-gray-600">Expansion Angle</dt><dd className="font-medium">360°</dd></div>
                           </dl>
                        </div>
                        <div>
                           <h4 className="text-xs font-bold text-gray-400 uppercase border-b pb-2 mb-3">Suction & Profile</h4>
                           <dl className="space-y-2 text-sm">
                              <div className="flex justify-between"><dt className="text-gray-600">Suction Dia</dt><dd className="font-medium text-blue-600">{results.D1_mm.toFixed(0)} mm</dd></div>
                              <div className="flex justify-between"><dt className="text-gray-600">Suction Center</dt><dd className="font-medium">(0, 0)</dd></div>
                              <div className="pt-2 text-xs text-gray-500 font-mono">
                                 R90: {results.R90.toFixed(0)} | R180: {results.R180.toFixed(0)}<br/>
                                 R270: {results.R270.toFixed(0)} | R360: {results.R360.toFixed(0)}
                              </div>
                           </dl>
                        </div>
                        <div>
                           <h4 className="text-xs font-bold text-gray-400 uppercase border-b pb-2 mb-3">Discharge Flange</h4>
                           <dl className="space-y-2 text-sm">
                              <div className="flex justify-between"><dt className="text-gray-600">Area</dt><dd className="font-medium">{results.dischargeArea_mm2.toFixed(0)} mm²</dd></div>
                              <div className="flex justify-between"><dt className="text-gray-600">Width (approx)</dt><dd className="font-medium">{results.dischargeWidth_mm.toFixed(0)} mm</dd></div>
                              <div className="flex justify-between"><dt className="text-gray-600">Height (approx)</dt><dd className="font-medium">{results.dischargeHeight_mm.toFixed(0)} mm</dd></div>
                              <div className="flex justify-between pt-1 border-t border-gray-100 mt-1"><dt className="text-gray-500 italic">Diameter (If Round)</dt><dd className="font-medium text-gray-500">{results.dischargeDiameter_mm.toFixed(0)} mm</dd></div>
                           </dl>
                        </div>
                     </div>
                  </div>
                </div>
              </section>

              {/* 4. Impeller Geometry Design */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
                <SectionHeader Icon={Settings} title="Impeller Geometry Design" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="col-span-1 space-y-4">
                    <div className={`p-4 rounded-lg border-l-4 ${results.tipSpeedCheck.includes("Warning") ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'}`}>
                      <div className="text-sm font-bold uppercase text-gray-500 mb-1">Impeller Diameter (D2)</div>
                      <div className="text-3xl font-bold text-gray-900">{results.D2_mm.toFixed(0)} <span className="text-lg text-gray-500">mm</span></div>
                      <div className="text-xs mt-2 text-gray-600">
                        Tip Speed: <span className="font-mono font-bold">{results.tipSpeedActual.toFixed(0)} m/s</span>
                      </div>
                      <div className={`text-xs mt-1 font-bold ${results.tipSpeedCheck.includes("Warning") ? 'text-red-700' : 'text-blue-700'}`}>
                        {results.tipSpeedCheck}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase border-b pb-2 mb-3">Diameters</h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between"><dt className="text-gray-600">Inlet (D1)</dt><dd className="font-medium">{results.D1_mm.toFixed(0)} mm</dd></div>
                          <div className="flex justify-between"><dt className="text-gray-600">Hub (Dh)</dt><dd className="font-medium">{results.D_hub_mm.toFixed(0)} mm</dd></div>
                          <div className="flex justify-between"><dt className="text-gray-600">Ratio (D1/D2)</dt><dd className="font-medium">{(results.D1_mm/results.D2_mm).toFixed(2)}</dd></div>
                        </dl>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase border-b pb-2 mb-3">Velocities</h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between"><dt className="text-gray-600">Inlet (Cm1)</dt><dd className="font-medium">{results.Cm1.toFixed(1)} m/s</dd></div>
                          <div className="flex justify-between"><dt className="text-gray-600">Tip Speed (U2)</dt><dd className="font-medium">{results.tipSpeedActual.toFixed(1)} m/s</dd></div>
                          <div className="flex justify-between pt-1"><dt className="text-gray-600">Status</dt><dd className={`font-bold ${results.velocityStatus === "OK" ? 'text-green-600' : 'text-amber-600'}`}>{results.velocityStatus}</dd></div>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 5. Blade Geometry Design (Split Section) */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
                <SectionHeader Icon={Settings} title="Blade Geometry Design" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="col-span-1 space-y-4">
                     <div className="p-4 rounded-lg border-l-4 bg-gray-50 border-gray-400">
                        <div className="text-sm font-bold uppercase text-gray-500 mb-1">Blade Count</div>
                        <div className="text-3xl font-bold text-gray-900">{results.bladeCountFinal}</div>
                        <div className="text-xs mt-2 text-gray-600">Based on Stepanoff Formula</div>
                     </div>
                  </div>
                  <div className="col-span-1 lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase border-b pb-2 mb-3">Blade Angles</h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between"><dt className="text-gray-600">Inlet Angle (β1)</dt><dd className="font-medium">{inputs.inletAngle}°</dd></div>
                          <div className="flex justify-between"><dt className="text-gray-600">Outlet Angle (β2)</dt><dd className="font-medium">{inputs.outletAngle}°</dd></div>
                        </dl>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase border-b pb-2 mb-3">Blade Heights</h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between"><dt className="text-gray-600">Inlet Height (b1)</dt><dd className="font-medium text-blue-700">{results.b1_mm.toFixed(0)} mm</dd></div>
                          <div className="flex justify-between"><dt className="text-gray-600">Outlet Height (b2)</dt><dd className="font-medium text-blue-700">{results.b2_mm.toFixed(0)} mm</dd></div>
                          <div className="flex justify-between pt-1"><dt className="text-gray-600">Solidity</dt><dd className="font-bold text-blue-600">{results.solidityStatus}</dd></div>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 6. Mechanical Design */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
                <SectionHeader Icon={Cog} title="Mechanical Design" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 shadow-sm">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Drive Shaft</div>
                    <div className="flex justify-between items-end border-b border-gray-300 pb-2 mb-2">
                      <span className="text-sm text-gray-600">Calculated Torque</span>
                      <span className="font-bold text-gray-900">{results.torqueNm.toFixed(1)} Nm</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-sm text-gray-600">Rec. Diameter</span>
                      <span className="font-bold text-blue-700 text-xl">{results.shaftDiaStd} mm</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 shadow-sm">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Key Sizing (DIN 6885)</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Width (b)</span>
                        <span className="font-bold text-gray-900">{results.keyWidth} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Height (h)</span>
                        <span className="font-bold text-gray-900">{results.keyHeight} mm</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                        <span className="text-sm text-gray-600">Min Length</span>
                        <span className="font-bold text-gray-900">{results.keyLength} mm</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 shadow-sm">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Bearing Selection</div>
                    <div className="text-center py-2">
                      <div className="text-sm text-gray-500 mb-1">Recommended Series</div>
                      <div className="text-2xl font-bold text-gray-900">{results.bearingSeries}</div>
                      <div className="text-xs text-blue-600 mt-1">Deep Groove Ball</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 7. Design Validation Matrix */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
                 <SectionHeader Icon={CheckCircle} title="Design Validation Matrix" />
                 <div className="overflow-hidden rounded-lg border border-gray-200">
                   <table className="min-w-full">
                     <thead className="bg-gray-100">
                       <tr>
                         <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Parameter</th>
                         <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Value</th>
                         <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                         <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Recommendation</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       <tr>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Motor Selection</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inputs.motorRating} HP</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm">
                           {results.motorCheck === "OK" ? 
                             <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Pass</span> : 
                             <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Review</span>}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{results.motorCheck} (Load: {results.motorLoadPct.toFixed(0)}%)</td>
                       </tr>
                       <tr>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Mach Number (Tip)</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(results.tipSpeedActual / 340).toFixed(2)}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm">
                           {(results.tipSpeedActual / 340) < 0.3 ? 
                             <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Pass</span> : 
                             <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Review</span>}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(results.tipSpeedActual / 340) > 0.3 ? "Consider noise reduction" : "Standard operation"}</td>
                       </tr>
                       <tr>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Specific Speed</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{results.Ns_US.toFixed(0)}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm">
                           <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Info</span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{results.bladeRecommendation}</td>
                       </tr>
                       <tr>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Stress Safety</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{results.safetyFactor.toFixed(2)}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm">
                           {results.safetyFactor > 1.5 ? 
                             <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Pass</span> : 
                             <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Fail</span>}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{results.safetyFactor < 1.5 ? "Switch to stronger material/reduce speed" : "Material is adequate"}</td>
                       </tr>
                       <tr>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Inlet Velocity</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{results.Cm1.toFixed(1)} m/s</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {results.Cm1 > 15 && results.Cm1 < 30 ? 
                             <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Pass</span> : 
                             <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Check</span>}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{results.velocityStatus}</td>
                       </tr>
                     </tbody>
                   </table>
                 </div>
              </section>

              {/* 8. Predicted Performance Curves */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
                <SectionHeader Icon={LayoutGrid} title="Predicted Performance Curves (AMCA Style)" />
                <div className="flex mb-6 space-x-6">
                  <div className="flex items-center text-sm">
                     <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                     Static Pressure (Pa)
                  </div>
                  <div className="flex items-center text-sm">
                     <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                     Brake Power (HP)
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8 h-80 flex items-end justify-between space-x-2 relative">
                   <div className="absolute top-2 left-2 text-xs text-gray-400 font-mono">Normalized Values</div>
                   {results.performanceCurve.map((pt, i) => (
                     <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                       <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded p-2 shadow-lg z-20 w-40">
                         <div className="font-bold border-b border-gray-700 pb-1 mb-1">@ {pt.flow.toFixed(0)} CFM</div>
                         <div className="flex justify-between"><span>SP:</span> <span>{pt.pressure.toFixed(0)} Pa</span></div>
                         <div className="flex justify-between"><span>Eff:</span> <span>{pt.efficiency.toFixed(1)}%</span></div>
                         <div className="flex justify-between"><span>Pow:</span> <span>{pt.power.toFixed(2)} HP</span></div>
                       </div>
                       <div className="w-full flex space-x-1 items-end h-full px-0.5">
                         <div 
                            style={{height: `${Math.min(100, (pt.pressure / (Math.max(0.1, inputs.staticPressure) * 1.5)) * 100)}%`}} 
                            className="flex-1 bg-blue-500 rounded-t opacity-90 hover:opacity-100 transition-all duration-300"
                         ></div>
                         <div 
                            style={{height: `${Math.min(100, (pt.power / (Math.max(0.1, results.brakePowerHP) * 1.5)) * 100)}%`}} 
                            className="flex-1 bg-green-500 rounded-t opacity-90 hover:opacity-100 transition-all duration-300"
                         ></div>
                       </div>
                       <div className="text-[10px] text-center mt-2 text-gray-500 font-medium">{pt.pct}%</div>
                     </div>
                   ))}
                </div>
              </section>

              {/* 9. Profile Diagrams */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
                 <SectionHeader Icon={Settings} title="Profile Diagrams & Geometry" />
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ImpellerSketch 
                      D2={results.D2_mm} 
                      D1={results.D1_mm} 
                      b2={results.b2_mm} 
                      b1={results.b1_mm} 
                      Dh={results.D_hub_mm}
                    />
                    <ImpellerTopView 
                      D2={results.D2_mm} 
                      D1={results.D1_mm} 
                      Dh={results.D_hub_mm} 
                      Z={results.bladeCountFinal} 
                      beta1={inputs.inletAngle} 
                      beta2={inputs.outletAngle}
                    />
                 </div>
                 <div className="mt-8">
                    <CasingDiagrams 
                      voluteW={results.voluteWidth_mm}
                      cutoffR={results.cutoffRadius_mm}
                      dischargeW={results.dischargeWidth_mm}
                      dischargeH={results.dischargeHeight_mm}
                      D2={results.D2_mm}
                    />
                 </div>
              </section>

              <style>{`
                @media print {
                  @page { margin: 0.5cm; size: auto; }
                  body {
                    visibility: hidden;
                    background-color: white;
                  }
                  #report-content {
                    visibility: visible !important;
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: auto !important;
                    overflow: visible !important;
                    display: block !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  #report-content * {
                    visibility: visible !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .no-print, nav, header, aside, .print\\:hidden {
                    display: none !important;
                  }
                  /* Prevent breaks inside cards */
                  section, .grid > div {
                    break-inside: avoid;
                  }
                }
              `}</style>
             </div>
           </div>
         )}
         
         {/* --- CAD VIEW --- */}
         {activeView === 'cad' && (
           <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
             <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <FileCode className="w-5 h-5 mr-2 text-blue-600" />
                        AutoCAD Script Generator
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Generates a .scr file to draw the Impeller, Blades, Shaft, and Casing in AutoCAD.
                      </p>
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        Generating drawing for {results.bladeCountFinal} blades
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          const text = results.cadScript;
                          const textArea = document.createElement("textarea");
                          textArea.value = text;
                          document.body.appendChild(textArea);
                          textArea.select();
                          try {
                            document.execCommand('copy');
                            alert("Script copied to clipboard!");
                          } catch (err) {
                            console.error('Unable to copy', err);
                            alert("Failed to copy script.");
                          }
                          document.body.removeChild(textArea);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </button>
                      <button 
                        onClick={() => {
                          const element = document.createElement("a");
                          const file = new Blob([results.cadScript], {type: 'text/plain'});
                          element.href = URL.createObjectURL(file);
                          element.download = "fan_design.scr";
                          document.body.appendChild(element); // Required for this to work in FireFox
                          element.click();
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download .SCR</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <textarea 
                      readOnly
                      value={results.cadScript}
                      className="w-full h-96 p-4 font-mono text-xs bg-gray-900 text-green-400 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded border border-gray-700">
                      Read-Only Preview
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
                    <strong>Instructions:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1 ml-1">
                      <li>Download the <code>.scr</code> file.</li>
                      <li>Open AutoCAD.</li>
                      <li>Type <code>SCRIPT</code> in the command line and press Enter.</li>
                      <li>Select the downloaded file to automatically generate drawings.</li>
                    </ol>
                  </div>
                </div>
             </div>
           </div>
         )}
         
         {/* --- SOLID EDGE VIEW --- */}
         {activeView === 'solidedge' && (
           <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
             <div className="max-w-4xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {/* Hub (Part) Card */}
                   <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <Box className="w-5 h-5 mr-2 text-blue-600" />
                            Hub
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Generates a .par (Part) file for the central hub and shaft bore.
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            const element = document.createElement("a");
                            const file = new Blob([results.vbsHub], {type: 'text/plain'});
                            element.href = URL.createObjectURL(file);
                            element.download = "Create_Hub.vbs";
                            document.body.appendChild(element);
                            element.click();
                          }}
                          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>.VBS</span>
                        </button>
                      </div>
                      <div className="relative flex-grow">
                        <textarea 
                          readOnly
                          value={results.vbsHub}
                          className="w-full h-40 p-3 font-mono text-xs bg-gray-50 text-gray-600 rounded-lg border border-gray-300 focus:outline-none resize-none"
                        />
                      </div>
                   </div>

                   {/* Rotor (Part) Card */}
                   <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <Fan className="w-5 h-5 mr-2 text-green-600" />
                            Rotor
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Generates a .par (Part) file with backplate and blades (solid).
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            const element = document.createElement("a");
                            const file = new Blob([results.vbsRotor], {type: 'text/plain'});
                            element.href = URL.createObjectURL(file);
                            element.download = "Create_Rotor.vbs";
                            document.body.appendChild(element);
                            element.click();
                          }}
                          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>.VBS</span>
                        </button>
                      </div>
                      <div className="relative flex-grow">
                        <textarea 
                          readOnly
                          value={results.vbsRotor}
                          className="w-full h-40 p-3 font-mono text-xs bg-gray-50 text-blue-600 rounded-lg border border-gray-300 focus:outline-none resize-none"
                        />
                      </div>
                   </div>

                   {/* Casing (Sheet Metal) Card */}
                   <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <Square className="w-5 h-5 mr-2 text-orange-600" />
                            Casing
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Generates a .psm (Sheet Metal) file for the scroll housing.
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            const element = document.createElement("a");
                            const file = new Blob([results.vbsCasing], {type: 'text/plain'});
                            element.href = URL.createObjectURL(file);
                            element.download = "Create_Casing.vbs";
                            document.body.appendChild(element);
                            element.click();
                          }}
                          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>.VBS</span>
                        </button>
                      </div>
                      <div className="relative flex-grow">
                        <textarea 
                          readOnly
                          value={results.vbsCasing}
                          className="w-full h-40 p-3 font-mono text-xs bg-gray-50 text-orange-600 rounded-lg border border-gray-300 focus:outline-none resize-none"
                        />
                      </div>
                   </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
                  <strong>Instructions for Solid Edge:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1 ml-1">
                    <li>Download the desired component's <code>.vbs</code> script file.</li>
                    <li>Ensure Solid Edge is installed on your Windows machine.</li>
                    <li>Double-click the downloaded <code>.vbs</code> file to run it.</li>
                    <li>The script will automatically launch Solid Edge (if not open), create a new document, and generate the specific 3D geometry.</li>
                  </ol>
                  <p className="mt-2 text-xs italic text-blue-600">Note: Browser environments cannot compile DLL/EXE files. These VBScript files are standard Windows executables for automation.</p>
                </div>
             </div>
           </div>
         )}

         {/* --- CONVERTER VIEW --- */}
         {activeView === 'converter' && (
           <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
             <div className="max-w-4xl mx-auto space-y-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Unit Converter</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(UNIT_DATA).map(([key, data]) => (
                    <GenericConverter key={key} categoryKey={key} data={data} />
                  ))}
                  <TemperatureConverter />
                </div>
             </div>
           </div>
         )}

         {/* --- HISTORY VIEW --- */}
         {activeView === 'history' && (
           <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
             <div className="max-w-4xl mx-auto">
               {history.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
                   <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <History className="w-8 h-8 text-gray-400" />
                   </div>
                   <h3 className="text-lg font-medium text-gray-900">No Calculation History</h3>
                   <p className="text-gray-500 mt-2">Run a calculation to see results here.</p>
                   <button 
                     onClick={() => setActiveView('report')}
                     className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                   >
                     Go to Calculator
                   </button>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {history.map((item) => (
                     <div key={item.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                       <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                         <div className="flex items-center space-x-2">
                           <div className="text-sm font-bold text-gray-900">{item.timestamp}</div>
                         </div>
                         <div className="flex items-center space-x-2">
                            <button 
                                onClick={() => handleLoadFromHistory(item)}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center bg-white border border-blue-200 px-3 py-1 rounded-full"
                            >
                                Load <ArrowRight className="w-3 h-3 ml-1" />
                            </button>
                            <button
                                onClick={(e) => handleDeleteHistory(item.id, e)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                title="Delete Record"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                       </div>
                       <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div>
                           <div className="text-xs text-gray-500 uppercase">Flow Rate</div>
                           <div className="font-semibold text-gray-900">{item.summary.flow} CFM</div>
                         </div>
                         <div>
                           <div className="text-xs text-gray-500 uppercase">Pressure</div>
                           <div className="font-semibold text-gray-900">{item.summary.pressure} Pa</div>
                         </div>
                         <div>
                            <div className="text-xs text-gray-500 uppercase">Speed</div>
                            <div className="font-semibold text-gray-900">{item.summary.rpm} RPM</div>
                         </div>
                         <div>
                            <div className="text-xs text-gray-500 uppercase">Est. Power</div>
                            <div className="font-semibold text-gray-900">{item.summary.power.toFixed(2)} HP</div>
                         </div>
                         <div>
                            <div className="text-xs text-gray-500 uppercase">Efficiency</div>
                            <div className={`font-semibold ${item.summary.efficiency > 70 ? 'text-green-600' : 'text-amber-600'}`}>{item.summary.efficiency.toFixed(1)}%</div>
                         </div>
                         <div>
                            <div className="text-xs text-gray-500 uppercase">Impeller Dia</div>
                            <div className="font-semibold text-gray-900">{item.summary.diameter.toFixed(0)} mm</div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default App;
