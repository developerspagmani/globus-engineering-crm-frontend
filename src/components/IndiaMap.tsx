"use client";

import { useEffect, useRef, useState, useMemo, memo } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { isDistrictMatch } from '@/utils/geo_utils';

interface IndiaMapProps {
    onDistrictSelect?: (district: any) => void;
    activeDistrict?: any;
    activeDistricts?: string[];
    onVisibleFeaturesChange?: (features: any[]) => void;
    onViewModeChange?: (mode: string) => void;
    onStateSelect?: (state: string | null) => void;
    searchTerm?: string;
    onRegionSelect?: (region: string | null) => void;
    selectedRegion?: string | null;
    activeStates?: string[];
}

const geoCache: { states: any; districts: any } = { states: null, districts: null };

const SHORT_NAMES: Record<string, string> = {
    'TAMIL NADU': 'TN',
    'KARNATAKA': 'KA',
    'ANDHRA PRADESH': 'AP',
    'MAHARASHTRA': 'MH',
    'TELANGANA': 'TG',
    'KERALA': 'KL',
    'GUJARAT': 'GJ',
    'RAJASTHAN': 'RJ',
    'MADHYA PRADESH': 'MP',
    'UTTAR PRADESH': 'UP',
    'WEST BENGAL': 'WB',
    'HIMACHAL PRADESH': 'HP',
    'ARUNACHAL PRADESH': 'AR',
    'JAMMU AND KASHMIR': 'JK',
    'HARYANA': 'HR',
    'PUNJAB': 'PB'
};

const getLabelOffset = (name: string): [number, number] => {
    const n = name.toUpperCase();
    if (n === 'TAMIL NADU') return [0, 8];
    if (n === 'KERALA') return [-8, 5];
    if (n === 'PUDUCHERRY') return [12, 0];
    if (n === 'GOA') return [-15, 0];
    return [0, 0];
};

function IndiaMap({
    onDistrictSelect,
    activeDistrict,
    activeDistricts = [],
    onVisibleFeaturesChange,
    onViewModeChange,
    onStateSelect,
    searchTerm = "",
    onRegionSelect,
    selectedRegion,
    activeStates = []
}: IndiaMapProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [geoData, setGeoData] = useState<{ states: any; districts: any } | null>(geoCache.states ? geoCache : null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isDimensionsReady, setIsDimensionsReady] = useState(false);
    const [viewMode, setViewMode] = useState<'states' | 'districts'>('states');
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
    const lastZoomedStateRef = useRef<string | null>(null);

    const manufacturingStates = useMemo(() => [
        'TAMIL NADU', 'KARNATAKA', 'ANDHRA PRADESH', 'MAHARASHTRA', 'TELANGANA'
    ], []);

    const stateColors = useMemo(() => {
        return (name: string) => {
            return '#cbd5e1'; // Soft but distinct slate-grey for non-active states
        };
    }, []);

    const isManufacturing = (name: string | null) => manufacturingStates.includes((name || '').toUpperCase());

    const [error, setError] = useState<string | null>(null);

    // 1. Fetch TopoJSON (Local & Optimized)
    useEffect(() => {
        if (geoCache.states) {
            setGeoData({ ...geoCache });
            return;
        }

        const loadData = async () => {
            try {
                const response = await fetch('/data/india.json');
                if (!response.ok) throw new Error('Failed to load map data');
                const topology = await response.json();

                // Convert TopoJSON to GeoJSON features
                if (!topology.objects || !topology.objects.states || !topology.objects.districts) {
                    throw new Error('Invalid map data format');
                }

                const states = feature(topology, topology.objects.states as any);
                const districts = feature(topology, topology.objects.districts as any);

                geoCache.states = states;
                geoCache.districts = districts;
                setGeoData({ states, districts });
                setError(null);
                console.log("Map data loaded successfully");
            } catch (err) {
                console.error("Error loading TopoJSON", err);
                setError("Failed to load map data. Please check your connection.");
            }
        };

        loadData();
    }, []);

    // 2. Responsive
    useEffect(() => {
        const observeTarget = wrapperRef.current;
        if (!observeTarget) return;

        // Immediate check on mount
        const rect = observeTarget.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            setDimensions({ width: rect.width, height: rect.height });
            setIsDimensionsReady(true);
        }

        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                if (width > 0 && height > 0) {
                    setDimensions({ width, height });
                    setIsDimensionsReady(true);
                }
            }
        });
        resizeObserver.observe(observeTarget);
        return () => resizeObserver.unobserve(observeTarget);
    }, []);

    const initialFeatures = useMemo(() => {
        if (!geoData || !geoData.states || !geoData.districts) return [];
        return viewMode === 'states' ? geoData.states.features :
            geoData.districts.features.filter((f: any) => {
                const sName = (f.properties?.st_nm || f.properties?.NAME_1 || f.properties?.stname || '').toUpperCase();
                return sName === (selectedState || '').toUpperCase();
            });
    }, [geoData, viewMode, selectedState]);

    const currentFeatures = useMemo(() => {
        if (!searchTerm) return initialFeatures;
        return initialFeatures.filter((f: any) => {
            const name = f.properties?.district || f.properties?.NAME_2 || f.properties?.dtname || f.properties?.st_nm || f.properties?.NAME_1 || f.properties?.stname || '';
            return name.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [initialFeatures, searchTerm]);

    useEffect(() => {
        if (onVisibleFeaturesChange) onVisibleFeaturesChange(currentFeatures);
    }, [currentFeatures, onVisibleFeaturesChange]);

    useEffect(() => {
        if (onViewModeChange) onViewModeChange(viewMode);
    }, [viewMode, onViewModeChange]);

    useEffect(() => {
        if (selectedRegion && selectedRegion !== selectedState) {
            const s = geoData?.states?.features.find((f: any) => {
                const name = f.properties?.st_nm || f.properties?.NAME_1 || f.properties?.stname || '';
                return name.toUpperCase() === selectedRegion.toUpperCase();
            });
            if (s) {
                setSelectedState(selectedRegion);
                setViewMode('districts');
            }
        } else if (!selectedRegion && selectedState) {
            setSelectedState(null);
            setViewMode('states');
        }
    }, [selectedRegion, geoData, selectedState]);

    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

    // 3. Render
    useEffect(() => {
        if (!geoData || !geoData.states || !geoData.districts || !svgRef.current || dimensions.width === 0 || dimensions.height === 0) {
            console.log("Map render skipped. Data:", !!geoData, "SVG:", !!svgRef.current, "Dims:", dimensions);
            return;
        }

        const { width, height } = dimensions;
        console.log("Rendering map with dimensions:", width, height);
        
        const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
        
        // Ensure SVG internal size matches container
        svg.attr("width", width).attr("height", height);
        
        // Always ensure structural groups exist
        let g = svg.select<SVGGElement>(".main-wrapper-g");
        if (g.empty()) {
            svg.selectAll("*").remove();
            console.log("Initializing SVG groups for the first time");
            const defs = svg.append("defs");
            defs.append("filter").attr("id", "selection-glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%")
                .call(f => f.append("feGaussianBlur").attr("stdDeviation", "2").attr("result", "blur"))
                .call(f => f.append("feComposite").attr("in", "SourceGraphic").attr("in2", "blur").attr("operator", "over"));

            g = svg.append("g").attr("class", "main-wrapper-g");
            g.append("g").attr("class", "states-layer");
            g.append("g").attr("class", "districts-layer");
            g.append("g").attr("class", "labels-layer").style("pointer-events", "none");

            zoomRef.current = d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([1, 100])
                .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
                    const currentG = svg.select(".main-wrapper-g");
                    currentG.attr("transform", event.transform.toString());
                    currentG.selectAll<SVGPathElement, any>("path").attr("stroke-width", d => (d.properties?.district ? 0.2 : 0.5) / event.transform.k);
                    svg.select(".labels-layer").selectAll<SVGTextElement, any>("text").style("font-size", (d: any) => {
                        const base = d.properties?.district ? 4 : 10;
                        return (base / Math.sqrt(event.transform.k)) + "px";
                    });
                });

            svg.call(zoomRef.current as any)
                .on("mousedown.zoom", null)
                .on("touchstart.zoom", null)
                .on("wheel.zoom", null)
                .on("dblclick.zoom", null);
        }

        const projection = d3.geoMercator().fitExtent([[20, 20], [width - 20, height - 20]], geoData.states);
        const pathGenerator = d3.geoPath().projection(projection);

        const mainG = svg.select(".main-wrapper-g");
        const statesG = mainG.select(".states-layer");
        const districtsG = mainG.select(".districts-layer");
        const labelsG = mainG.select(".labels-layer");

        const currentTransform = viewMode === 'states' ? d3.zoomIdentity : d3.zoomTransform(svg.node() as Element);
        mainG.attr("transform", currentTransform.toString());


        const zoomToFeature = (feature: any) => {
            if (!zoomRef.current || !svgRef.current) return;
            const bounds = pathGenerator.bounds(feature);
            const dx = bounds[1][0] - bounds[0][0], dy = bounds[1][1] - bounds[0][1];
            const x = (bounds[0][0] + bounds[1][0]) / 2, y = (bounds[0][1] + bounds[1][1]) / 2;
            const scale = Math.max(1, Math.min(30, 0.9 / Math.max(dx / width, dy / height)));
            const translate = [width / 2 - scale * x, height / 2 - scale * y];

            d3.select(svgRef.current).transition()
                .duration(750)
                .ease(d3.easeCubicInOut)
                .call(zoomRef.current.transform as any, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
        };

        // Render States
        statesG.selectAll("path")
            .data(geoData.states.features)
            .join("path")
            .attr("d", pathGenerator as any)
            .attr("fill", (d: any) => {
                const name = d.properties?.st_nm || d.properties?.NAME_1 || d.properties?.stname || '';
                if (name.toUpperCase() === selectedState?.toUpperCase()) return "#f59e0b"; // Vibrant Amber
                if (activeStates.some(as => as.toUpperCase() === name.toUpperCase())) return "#f59e0b"; // Vibrant Amber
                return stateColors(name);
            })
            .style("fill-opacity", (d: any) => {
                const name = d.properties?.st_nm || d.properties?.NAME_1 || d.properties?.stname || '';
                const isActive = name.toUpperCase() === selectedState?.toUpperCase() || activeStates.some(as => as.toUpperCase() === name.toUpperCase());
                return isActive ? 1 : 0.8; 
            })
            .attr("stroke", "#ffffff") 
            .attr("stroke-opacity", 0.5)
            .attr("stroke-width", 0.8)
            .attr("class", "cursor-pointer")
            .on("mouseover", (event: MouseEvent, d: any) => {
                const name = d.properties?.st_nm || d.properties?.NAME_1 || d.properties?.stname;
                setHoveredRegion(name);
            })
            .on("mousemove", (event: MouseEvent) => {
                if (tooltipRef.current && wrapperRef.current) {
                    const rect = wrapperRef.current.getBoundingClientRect();
                    const x = event.clientX - rect.left;
                    const y = event.clientY - rect.top;
                    tooltipRef.current.style.left = `${x}px`;
                    tooltipRef.current.style.top = `${y}px`;
                }
            })
            .on("mouseout", () => setHoveredRegion(null))
            .on("click", (event: MouseEvent, feature: any) => {
                const name = feature.properties?.st_nm || feature.properties?.NAME_1 || feature.properties?.stname;
                setSelectedState(name);
                if (onStateSelect) onStateSelect(name);
                if (onRegionSelect) onRegionSelect(name);
                setViewMode('districts');
            });

        // State Labels
        labelsG.selectAll(".state-label")
            .data(viewMode === 'states' ? geoData.states.features : [])
            .join("text")
            .attr("class", "state-label")
            .attr("transform", (d: any) => {
                const centroid = pathGenerator.centroid(d);
                const name = d.properties?.st_nm || d.properties?.NAME_1 || d.properties?.stname || '';
                const offset = getLabelOffset(name);
                return `translate(${centroid[0] + offset[0]}, ${centroid[1] + offset[1]})`;
            })
            .attr("text-anchor", "middle")
            .attr("fill", "#000000") // Sharp black text
            .attr("stroke", "#ffffff") // White halo for clarity
            .attr("stroke-width", "0.3px")
            .attr("stroke-linejoin", "round")
            .attr("paint-order", "stroke")
            .style("font-size", "11px")
            .style("font-weight", "950")
            .style("pointer-events", "none")
            .style("opacity", (d: any) => {
                const name = d.properties?.st_nm || d.properties?.NAME_1 || d.properties?.stname || '';
                const isActive = activeStates.some(as => as.toUpperCase() === name.toUpperCase()) || isManufacturing(name);
                return isActive ? 1 : 0.6;
            })
            .text((d: any) => {
                const name = d.properties?.st_nm || d.properties?.NAME_1 || d.properties?.stname || d.properties?.name || '';
                return SHORT_NAMES[name.toUpperCase()] || name;
            });

        // Render Districts
        const dFeatures = (viewMode === 'districts' || searchTerm) ? geoData.districts.features.filter((f: any) => {
            const sName = (f.properties?.st_nm || f.properties?.NAME_1 || f.properties?.stname || '').toUpperCase();
            if (searchTerm) {
                const dName = (f.properties?.district || f.properties?.NAME_2 || f.properties?.dtname || '').toLowerCase();
                return dName.includes(searchTerm.toLowerCase());
            }
            return sName === (selectedState || '').toUpperCase();
        }) : [];

        districtsG.selectAll("path")
            .data(dFeatures)
            .join("path")
            .attr("d", pathGenerator as any)
            .attr("fill", (f: any) => {
                const name = f.properties?.district || f.properties?.NAME_2 || f.properties?.dtname || '';
                const isHub = activeDistricts.some(ad => isDistrictMatch(ad, name));
                const isSel = activeDistrict && isDistrictMatch(activeDistrict.properties?.district || activeDistrict.properties?.NAME_2 || activeDistrict.properties?.dtname || '', name);
                if (isSel) return '#ec4899'; // Pink for selection
                if (isHub) return '#10b981'; // Bright Emerald Green
                return '#18181b'; // Deep Zinc-900
            })
            .style("fill-opacity", (f: any) => {
                const name = f.properties?.district || f.properties?.NAME_2 || f.properties?.dtname || '';
                const isHub = activeDistricts.some(ad => isDistrictMatch(ad, name));
                return isHub ? 1 : 0.5;
            })
            .attr("filter", (f: any) => {
                const name = f.properties?.district || f.properties?.NAME_2 || f.properties?.dtname || '';
                const isHub = activeDistricts.some(ad => isDistrictMatch(ad, name));
                return isHub ? "url(#selection-glow)" : null;
            })
            .attr("stroke", "#09090b")
            .attr("stroke-width", 0.2)
            .on("mouseover", (event: MouseEvent, f: any) => {
                const name = f.properties?.district || f.properties?.NAME_2 || f.properties?.dtname || '';
                setHoveredRegion(name);
            })
            .on("mousemove", (event: MouseEvent) => {
                if (tooltipRef.current && wrapperRef.current) {
                    const rect = wrapperRef.current.getBoundingClientRect();
                    const x = event.clientX - rect.left;
                    const y = event.clientY - rect.top;
                    tooltipRef.current.style.left = `${x}px`;
                    tooltipRef.current.style.top = `${y}px`;
                }
            })
            .on("mouseout", () => setHoveredRegion(null))
            .on("click", (event: MouseEvent, f: any) => {
                event.stopPropagation();
                if (onDistrictSelect) onDistrictSelect(f);
                const dName = f.properties?.district || f.properties?.NAME_2 || f.properties?.dtname || '';
                if (onRegionSelect) onRegionSelect(dName);
            });

        // District Labels (Show only for active districts)
        labelsG.selectAll(".district-label")
            .data(dFeatures.filter((f: any) => {
                const name = f.properties?.district || f.properties?.NAME_2 || f.properties?.dtname || '';
                return activeDistricts.some(ad => isDistrictMatch(ad, name));
            }))
            .join("text")
            .attr("class", "district-label")
            .attr("transform", (d: any) => `translate(${pathGenerator.centroid(d)})`)
            .attr("text-anchor", "middle")
            .attr("fill", "#ffffff")
            .style("font-size", "4px")
            .style("font-weight", "900")
            .style("opacity", 1)
            .style("text-shadow", "0 1px 2px rgba(0,0,0,1)")
            .style("pointer-events", "none")
            .text((d: any) => d.properties?.district || d.properties?.NAME_2 || d.properties?.dtname || d.properties?.name || '');

        if (viewMode === 'districts' && selectedState && selectedState !== lastZoomedStateRef.current) {
            const f = geoData.states.features.find((f: any) => {
                const name = f.properties?.st_nm || f.properties?.NAME_1 || f.properties?.stname || '';
                return name.toUpperCase() === selectedState.toUpperCase();
            });
            if (f) { lastZoomedStateRef.current = selectedState; zoomToFeature(f); }
        } else if (viewMode === 'states') {
            lastZoomedStateRef.current = null;
        }

    }, [geoData, dimensions, activeDistricts, activeStates, activeDistrict, viewMode, selectedState, searchTerm]);

    const handleZoomIn = () => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current).transition().duration(150).call(zoomRef.current.scaleBy as any, 2);
        }
    };

    const handleZoomOut = () => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current).transition().duration(150).call(zoomRef.current.scaleBy as any, 0.5);
        }
    };

    const handleResetZoom = () => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.transform as any, d3.zoomIdentity);
            setViewMode('states');
            setSelectedState(null);
            if (onStateSelect) onStateSelect(null);
            if (onRegionSelect) onRegionSelect(null);
            if (onDistrictSelect) onDistrictSelect(null);
        }
    };


    return (
        <div ref={wrapperRef} className="w-100 h-100 position-relative overflow-hidden d-flex justify-content-center align-items-center bg-light bg-opacity-10">
            {error && (
                <div className="position-absolute d-flex flex-column align-items-center gap-3 z-3 p-4 text-center">
                    <i className="bi bi-cloud-slash text-danger fs-1 opacity-50"></i>
                    <div>
                        <div className="fw-bold text-dark small text-uppercase tracking-wider mb-1">{error}</div>
                        <button
                            className="btn btn-primary btn-sm rounded-pill px-4 mt-2"
                            onClick={() => window.location.reload()}
                        >
                            Retry Loading
                        </button>
                    </div>
                </div>
            )}

            {!error && (!isDimensionsReady || !geoData) && (
                <div className="position-absolute d-flex flex-column align-items-center gap-3 z-3">
                    <div className="spinner-grow text-primary opacity-50" style={{ width: '3rem', height: '3rem' }} role="status"></div>
                    <div className="text-center px-4">
                        <span className="smaller text-uppercase fw-bold text-primary tracking-widest d-block mb-1">
                            {!geoData ? 'Syncing Regional Data...' : 'Optimizing Viewport...'}
                        </span>
                        <span className="x-small text-muted fw-medium d-block">Configuring industrial layers for your screen</span>
                    </div>
                </div>
            )}
            <svg
                ref={svgRef}
                className={`w-100 h-100 transition-opacity duration-700 ${isDimensionsReady && geoData ? 'opacity-100' : 'opacity-100'}`}
                style={{ cursor: 'grab', background: 'transparent' }}
            />


            {/* Smarter Floating Tooltip (Ref-based for speed) */}
            {hoveredRegion && (
                <div
                    ref={tooltipRef}
                    className="map-cursor-tooltip"
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        pointerEvents: 'none',
                        zIndex: 1000,
                        transform: 'translate(-50%, -120%)',
                        transition: 'none'
                    }}
                >
                    <div className="tooltip-inner-content shadow-lg px-3 py-2 rounded-3 bg-dark border border-white border-opacity-10">
                        <div className="d-flex align-items-center justify-content-between gap-3 mb-1">
                            <span className="fw-black text-white small text-uppercase tracking-wider">{hoveredRegion}</span>
                            {activeDistricts.some(d => isDistrictMatch(d, hoveredRegion)) || isManufacturing(hoveredRegion) ? (
                                <span className="badge bg-primary smaller animate-pulse">LIVE</span>
                            ) : null}
                        </div>
                        <div className="smaller text-white text-opacity-50 fw-medium">
                            {isManufacturing(hoveredRegion) ? 'Manufacturing Hub' :
                                activeDistricts.some(d => isDistrictMatch(d, hoveredRegion)) ? 'Active Client Zone' :
                                    'Region Inspected'}
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'districts' && (
                <button onClick={handleResetZoom} className="btn btn-dark btn-sm position-absolute top-0 start-0 m-3 z-3 shadow d-flex align-items-center gap-2 px-3 py-2 border-white border-opacity-10 rounded-pill">
                    <i className="bi bi-arrow-left text-primary"></i>
                    <span className="text-uppercase fw-bold smaller tracking-wider">India Map</span>
                </button>
            )}
            <div className="position-absolute bottom-0 end-0 m-3 d-flex flex-row gap-1 bg-dark bg-opacity-75 p-1 rounded-pill border border-white border-opacity-10 shadow">
                <button onClick={handleZoomIn} className="btn btn-sm btn-dark p-1 border-0 rounded-circle w-8 h-8 d-flex align-items-center justify-content-center"><i className="bi bi-zoom-in"></i></button>
                <button onClick={handleZoomOut} className="btn btn-sm btn-dark p-1 border-0 rounded-circle w-8 h-8 d-flex align-items-center justify-content-center"><i className="bi bi-zoom-out"></i></button>
                <button onClick={handleResetZoom} className="btn btn-sm btn-dark p-1 border-0 rounded-circle w-8 h-8 d-flex align-items-center justify-content-center"><i className="bi bi-arrow-counterclockwise"></i></button>
            </div>
            <div className="position-absolute bottom-0 start-0 m-4 d-flex flex-column gap-2 pointer-events-none p-3 bg-white bg-opacity-90 rounded-4 border shadow-sm backdrop-blur-md">
                <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle shadow-sm" style={{ width: 10, height: 10, background: '#f59e0b' }}></div>
                    <span className="smaller text-dark fw-bold text-uppercase tracking-wider">Active State</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle shadow-sm" style={{ width: 10, height: 10, background: '#10b981' }}></div>
                    <span className="smaller text-dark fw-bold text-uppercase tracking-wider">Business active Center</span>
                </div>
                <div className="d-flex align-items-center gap-2 border-top pt-2 opacity-75">
                    <div className="rounded-circle" style={{ width: 10, height: 10, background: '#cbd5e1' }}></div>
                    <span className="smaller text-dark fw-medium text-uppercase tracking-wider">Region View</span>
                </div>
            </div>

            <style jsx global>{`
                .fw-black { font-weight: 900; }
                .smaller { font-size: 0.7rem; }
                .tracking-wider { letter-spacing: 0.05em; }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }

                .tooltip-inner-content {
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    background: rgba(15, 15, 20, 0.95) !important;
                }
                .duration-700 { transition-duration: 700ms; }
                .transition-opacity { transition-property: opacity; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
                
                .tracking-widest { letter-spacing: 0.2em; }
                .z-3 { z-index: 3; }
            `}</style>
        </div>
    );
}

export default memo(IndiaMap);
