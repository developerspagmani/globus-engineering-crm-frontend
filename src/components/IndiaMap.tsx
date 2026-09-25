"use client";

import { useEffect, useRef, useState, useMemo, memo } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { isDistrictMatch, isRegionMatch, canonicalState } from '@/utils/geo_utils';

interface IndiaMapProps {
    selectedState?: string | null;
    selectedDistrict?: string | null;
    onStateSelect?: (state: string | null) => void;
    onDistrictSelect?: (district: string | null, feature?: any) => void;
    onResetZoom?: () => void;
    activeDistricts?: string[];
    activeStates?: string[];
    searchTerm?: string;
    onVisibleFeaturesChange?: (features: any[]) => void;
    onViewModeChange?: (mode: string) => void;
    // Backwards compatibility
    selectedRegion?: string | null;
    onRegionSelect?: (region: string | null) => void;
    activeDistrict?: any;
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
    selectedState,
    selectedDistrict,
    onStateSelect,
    onDistrictSelect,
    onResetZoom,
    activeDistricts = [],
    activeStates = [],
    searchTerm = "",
    onVisibleFeaturesChange,
    onViewModeChange,
    selectedRegion,
    onRegionSelect,
    activeDistrict,
}: IndiaMapProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [geoData, setGeoData] = useState<{ states: any; districts: any } | null>(geoCache.states ? geoCache : null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isDimensionsReady, setIsDimensionsReady] = useState(false);
    const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const lastZoomedTargetRef = useRef<{ state: string | null; district: string | null }>({ state: null, district: null });

    // Derive effective state & district combining new and legacy props
    const effState = useMemo(() => {
        if (selectedState !== undefined && selectedState !== null && selectedState !== '') return selectedState;
        if (selectedRegion && geoData) {
            const s = geoData.states?.features.find((f: any) => isRegionMatch(f.properties?.st_nm, selectedRegion));
            if (s) return s.properties?.st_nm;
            const d = geoData.districts?.features.find((f: any) => isDistrictMatch(selectedRegion, f.properties?.district));
            if (d) return d.properties?.st_nm;
        }
        return null;
    }, [selectedState, selectedRegion, geoData]);

    const effDistrict = useMemo(() => {
        if (selectedDistrict !== undefined && selectedDistrict !== null && selectedDistrict !== '') return selectedDistrict;
        if (selectedRegion && geoData) {
            const d = geoData.districts?.features.find((f: any) => isDistrictMatch(selectedRegion, f.properties?.district));
            if (d) return d.properties?.district;
        }
        if (activeDistrict) {
            return activeDistrict.properties?.district || activeDistrict.properties?.NAME_2 || activeDistrict.properties?.dtname || null;
        }
        return null;
    }, [selectedDistrict, selectedRegion, activeDistrict, geoData]);

    const viewMode = effState || effDistrict ? 'districts' : 'states';

    const manufacturingStates = useMemo(() => [
        'TAMIL NADU', 'KARNATAKA', 'ANDHRA PRADESH', 'MAHARASHTRA', 'TELANGANA'
    ], []);

    const isManufacturing = (name: string | null) => manufacturingStates.includes((name || '').toUpperCase());

    // 1. Fetch TopoJSON
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

                if (!topology.objects || !topology.objects.states || !topology.objects.districts) {
                    throw new Error('Invalid map data format');
                }

                const states = feature(topology, topology.objects.states as any);
                const districts = feature(topology, topology.objects.districts as any);

                geoCache.states = states;
                geoCache.districts = districts;
                setGeoData({ states, districts });
                setError(null);
            } catch (err) {
                console.error("Error loading TopoJSON", err);
                setError("Failed to load map data. Please check your connection.");
            }
        };

        loadData();
    }, []);

    // 2. Responsive dimensions
    useEffect(() => {
        const observeTarget = wrapperRef.current;
        if (!observeTarget) return;

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
                const sName = (f.properties?.st_nm || f.properties?.NAME_1 || f.properties?.stname || '');
                return isRegionMatch(sName, effState);
            });
    }, [geoData, viewMode, effState]);

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

    // 3. Render D3 Map
    useEffect(() => {
        if (!geoData || !geoData.states || !geoData.districts || !svgRef.current || dimensions.width === 0 || dimensions.height === 0) {
            return;
        }

        const { width, height } = dimensions;
        const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
        svg.attr("width", width).attr("height", height);

        let g = svg.select<SVGGElement>(".main-wrapper-g");
        if (g.empty()) {
            svg.selectAll("*").remove();
            const defs = svg.append("defs");
            defs.append("filter").attr("id", "selection-glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%")
                .call(f => f.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "blur"))
                .call(f => f.append("feComposite").attr("in", "SourceGraphic").attr("in2", "blur").attr("operator", "over"));

            g = svg.append("g").attr("class", "main-wrapper-g");
            g.append("g").attr("class", "states-layer");
            g.append("g").attr("class", "districts-layer");
            g.append("g").attr("class", "labels-layer").style("pointer-events", "none");

            // Configured D3 zoom behavior with drag & move and mouse wheel zoom
            zoomRef.current = d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([1, 100])
                .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
                    const currentG = svg.select(".main-wrapper-g");
                    currentG.attr("transform", event.transform.toString());
                    currentG.selectAll<SVGPathElement, any>("path").attr("stroke-width", d => (d.properties?.district ? 0.25 : 0.6) / event.transform.k);
                    svg.select(".labels-layer").selectAll<SVGTextElement, any>("text").style("font-size", (d: any) => {
                        const isDistrict = !!d.properties?.district;
                        const base = isDistrict ? 4.5 : 10;
                        return (base / Math.sqrt(event.transform.k)) + "px";
                    });
                });

            // Enable drag, pan, and wheel scroll zoom, disabling only double click jump
            svg.call(zoomRef.current as any)
                .on("dblclick.zoom", null);
        }

        const projection = d3.geoMercator().fitExtent([[20, 20], [width - 20, height - 20]], geoData.states);
        const pathGenerator = d3.geoPath().projection(projection);

        const mainG = svg.select(".main-wrapper-g");
        const statesG = mainG.select(".states-layer");
        const districtsG = mainG.select(".districts-layer");
        const labelsG = mainG.select(".labels-layer");

        const zoomToFeature = (featureItem: any, maxScale: number = 30) => {
            if (!zoomRef.current || !svgRef.current || !featureItem) return;
            const bounds = pathGenerator.bounds(featureItem);
            const dx = bounds[1][0] - bounds[0][0];
            const dy = bounds[1][1] - bounds[0][1];
            if (dx <= 0 || dy <= 0) return;
            const x = (bounds[0][0] + bounds[1][0]) / 2;
            const y = (bounds[0][1] + bounds[1][1]) / 2;
            const scale = Math.max(1, Math.min(maxScale, 0.85 / Math.max(dx / width, dy / height)));
            const translate = [width / 2 - scale * x, height / 2 - scale * y];

            d3.select(svgRef.current).transition()
                .duration(750)
                .ease(d3.easeCubicInOut)
                .call(zoomRef.current.transform as any, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
        };

        // Render States Layer
        statesG.selectAll("path")
            .data(geoData.states.features)
            .join("path")
            .attr("d", pathGenerator as any)
            .attr("fill", (d: any) => {
                const name = d.properties?.st_nm || d.properties?.NAME_1 || d.properties?.stname || '';
                if (effState && isRegionMatch(name, effState)) return "#ea580c"; // Bold Rust-Orange for selected state
                if (activeStates.some(as => isRegionMatch(as, name))) return "#f97316"; // Vibrant Orange for active states
                return "#cbd5e1"; // Slate Grey for other states
            })
            .style("fill-opacity", (d: any) => {
                const name = d.properties?.st_nm || d.properties?.NAME_1 || d.properties?.stname || '';
                const isActive = (effState && isRegionMatch(name, effState)) || activeStates.some(as => isRegionMatch(as, name));
                return isActive ? 1 : 0.8;
            })
            .attr("stroke", "#ffffff")
            .attr("stroke-opacity", 0.6)
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
            .on("click", (event: MouseEvent, feat: any) => {
                // Prevent selection when dragging/panning
                if (event.defaultPrevented) return;
                event.stopPropagation();
                const name = feat.properties?.st_nm || feat.properties?.NAME_1 || feat.properties?.stname;
                if (onStateSelect) onStateSelect(name);
                if (onDistrictSelect) onDistrictSelect(null);
                if (onRegionSelect) onRegionSelect(name);
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
            .attr("fill", "#000000")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", "0.3px")
            .attr("stroke-linejoin", "round")
            .attr("paint-order", "stroke")
            .style("font-size", "11px")
            .style("font-weight", "950")
            .style("pointer-events", "none")
            .style("opacity", (d: any) => {
                const name = d.properties?.st_nm || d.properties?.NAME_1 || d.properties?.stname || '';
                const isActive = activeStates.some(as => isRegionMatch(as, name)) || isManufacturing(name);
                return isActive ? 1 : 0.6;
            })
            .text((d: any) => {
                const name = d.properties?.st_nm || d.properties?.NAME_1 || d.properties?.stname || d.properties?.name || '';
                return SHORT_NAMES[name.toUpperCase()] || name;
            });

        // Render Districts Layer
        const dFeatures = (viewMode === 'districts' || searchTerm) ? geoData.districts.features.filter((f: any) => {
            const sName = (f.properties?.st_nm || f.properties?.NAME_1 || f.properties?.stname || '');
            if (searchTerm) {
                const dName = (f.properties?.district || f.properties?.NAME_2 || f.properties?.dtname || '').toLowerCase();
                return dName.includes(searchTerm.toLowerCase());
            }
            return isRegionMatch(sName, effState);
        }) : [];

        districtsG.selectAll("path")
            .data(dFeatures)
            .join("path")
            .attr("d", pathGenerator as any)
            .attr("fill", (f: any) => {
                const name = f.properties?.district || f.properties?.NAME_2 || f.properties?.dtname || '';
                const isSel = effDistrict && isDistrictMatch(effDistrict, name);
                if (isSel) return '#ec4899'; // Distinct vibrant pink for selected district
                const isHub = activeDistricts.some(ad => isDistrictMatch(ad, name));
                if (isHub) return '#10b981'; // Bright Emerald Green for active districts
                return '#1e293b'; // Slate-800
            })
            .style("fill-opacity", (f: any) => {
                const name = f.properties?.district || f.properties?.NAME_2 || f.properties?.dtname || '';
                const isSel = effDistrict && isDistrictMatch(effDistrict, name);
                if (isSel) return 1;
                const isHub = activeDistricts.some(ad => isDistrictMatch(ad, name));
                return isHub ? 0.95 : 0.55;
            })
            .attr("filter", (f: any) => {
                const name = f.properties?.district || f.properties?.NAME_2 || f.properties?.dtname || '';
                const isSel = effDistrict && isDistrictMatch(effDistrict, name);
                const isHub = activeDistricts.some(ad => isDistrictMatch(ad, name));
                return (isSel || isHub) ? "url(#selection-glow)" : null;
            })
            .attr("stroke", (f: any) => {
                const name = f.properties?.district || f.properties?.NAME_2 || f.properties?.dtname || '';
                const isSel = effDistrict && isDistrictMatch(effDistrict, name);
                return isSel ? "#ffffff" : "#0f172a";
            })
            .attr("stroke-width", (f: any) => {
                const name = f.properties?.district || f.properties?.NAME_2 || f.properties?.dtname || '';
                const isSel = effDistrict && isDistrictMatch(effDistrict, name);
                return isSel ? 0.9 : 0.25;
            })
            .attr("class", "cursor-pointer")
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
                // Prevent selection when dragging/panning
                if (event.defaultPrevented) return;
                event.stopPropagation();
                const dName = f.properties?.district || f.properties?.NAME_2 || f.properties?.dtname || '';
                const sName = f.properties?.st_nm || f.properties?.NAME_1 || f.properties?.stname || '';
                if (onStateSelect && sName) onStateSelect(sName);
                if (onDistrictSelect) onDistrictSelect(dName, f);
                if (onRegionSelect) onRegionSelect(dName);
            });

        // District Labels
        labelsG.selectAll(".district-label")
            .data(dFeatures.filter((f: any) => {
                const name = f.properties?.district || f.properties?.NAME_2 || f.properties?.dtname || '';
                const isSel = effDistrict && isDistrictMatch(effDistrict, name);
                const isHub = activeDistricts.some(ad => isDistrictMatch(ad, name));
                return isSel || isHub;
            }))
            .join("text")
            .attr("class", "district-label")
            .attr("transform", (d: any) => `translate(${pathGenerator.centroid(d)})`)
            .attr("text-anchor", "middle")
            .attr("fill", "#ffffff")
            .style("font-size", (d: any) => {
                const name = d.properties?.district || d.properties?.NAME_2 || d.properties?.dtname || '';
                const isSel = effDistrict && isDistrictMatch(effDistrict, name);
                return isSel ? "6px" : "4.5px";
            })
            .style("font-weight", "900")
            .style("opacity", 1)
            .style("text-shadow", "0 1px 3px rgba(0,0,0,1)")
            .style("pointer-events", "none")
            .text((d: any) => d.properties?.district || d.properties?.NAME_2 || d.properties?.dtname || d.properties?.name || '');

        // --- DYNAMIC ZOOM HANDLING BASED ON STATE AND DISTRICT ---
        if (effDistrict) {
            // Zoom to selected district
            const dFeature = geoData.districts.features.find((f: any) => {
                const matchD = isDistrictMatch(effDistrict, f.properties?.district);
                if (!matchD) return false;
                if (effState) return isRegionMatch(effState, f.properties?.st_nm);
                return true;
            });

            if (dFeature && (lastZoomedTargetRef.current.district !== effDistrict || lastZoomedTargetRef.current.state !== effState)) {
                lastZoomedTargetRef.current = { state: effState || dFeature.properties?.st_nm || null, district: effDistrict };
                zoomToFeature(dFeature, 35);
            }
        } else if (effState) {
            // Zoom to selected state
            const sFeature = geoData.states.features.find((f: any) => isRegionMatch(effState, f.properties?.st_nm));
            if (sFeature && (lastZoomedTargetRef.current.state !== effState || lastZoomedTargetRef.current.district !== null)) {
                lastZoomedTargetRef.current = { state: effState, district: null };
                zoomToFeature(sFeature, 16);
            }
        } else {
            // Reset to All India view
            if (lastZoomedTargetRef.current.state !== null || lastZoomedTargetRef.current.district !== null) {
                lastZoomedTargetRef.current = { state: null, district: null };
                if (zoomRef.current && svgRef.current) {
                    d3.select(svgRef.current).transition()
                        .duration(750)
                        .ease(d3.easeCubicInOut)
                        .call(zoomRef.current.transform as any, d3.zoomIdentity);
                }
            }
        }

    }, [geoData, dimensions, activeDistricts, activeStates, viewMode, effState, effDistrict, searchTerm]);

    const handleZoomIn = () => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy as any, 1.8);
        }
    };

    const handleZoomOut = () => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy as any, 0.55);
        }
    };

    const handleResetToAllIndia = () => {
        if (onResetZoom) {
            onResetZoom();
        } else {
            if (onStateSelect) onStateSelect(null);
            if (onDistrictSelect) onDistrictSelect(null);
            if (onRegionSelect) onRegionSelect(null);
        }
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current).transition().duration(400).call(zoomRef.current.transform as any, d3.zoomIdentity);
        }
    };

    const handleBackToState = () => {
        if (onDistrictSelect) onDistrictSelect(null);
        if (onRegionSelect && effState) onRegionSelect(effState);
    };

    return (
        <div ref={wrapperRef} className="w-100 h-100 position-relative overflow-hidden d-flex justify-content-center align-items-center bg-light bg-opacity-10">
            {error && (
                <div className="position-absolute d-flex flex-column align-items-center gap-3 z-3 p-4 text-center">
                    <i className="bi bi-cloud-slash text-danger fs-1 opacity-50"></i>
                    <div>
                        <div className="fw-bold text-dark small text-uppercase tracking-wider mb-1">{error}</div>
                        <button
                            className="btn btn-secondary btn-sm rounded-pill px-4 mt-2"
                            onClick={() => window.location.reload()}
                        >
                            Retry Loading
                        </button>
                    </div>
                </div>
            )}

            {!error && (!isDimensionsReady || !geoData) && (
                <div className="position-absolute d-flex flex-column align-items-center gap-3 z-3">
                    <div className="spinner-grow text-secondary opacity-50" style={{ width: '3rem', height: '3rem' }} role="status"></div>
                    <div className="text-center px-4">
                        <span className="smaller text-uppercase fw-bold text-secondary tracking-widest d-block mb-1">
                            {!geoData ? 'Syncing Regional Data...' : 'Optimizing Viewport...'}
                        </span>
                        <span className="x-small text-muted fw-medium d-block">Configuring territorial map for your screen</span>
                    </div>
                </div>
            )}

            <svg
                ref={svgRef}
                className={`w-100 h-100 map-interactive transition-opacity duration-700 ${isDimensionsReady && geoData ? 'opacity-100' : 'opacity-100'}`}
                style={{ background: 'transparent' }}
            />

            {/* Floating Tooltip */}
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
                                <span className="badge bg-secondary smaller animate-pulse">LIVE</span>
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

            {/* Navigation buttons: All India & State */}
            {(effState || effDistrict) && (
                <div className="position-absolute top-0 start-0 m-3 z-3 d-flex align-items-center gap-2">
                    <button
                        onClick={handleResetToAllIndia}
                        className="btn btn-dark btn-sm shadow d-flex align-items-center gap-2 px-3 py-1.5 border-white border-opacity-10 rounded-pill"
                        title="Return to full India Map"
                    >
                        <i className="bi bi-arrow-left text-warning"></i>
                        <span className="text-uppercase fw-bold smaller tracking-wider">All India</span>
                    </button>
                    {effDistrict && effState && (
                        <button
                            onClick={handleBackToState}
                            className="btn btn-dark btn-sm shadow d-flex align-items-center gap-2 px-3 py-1.5 border-white border-opacity-10 rounded-pill"
                            title={`Zoom to entire ${effState}`}
                        >
                            <i className="bi bi-geo-alt text-info"></i>
                            <span className="text-uppercase fw-bold smaller tracking-wider">{effState}</span>
                        </button>
                    )}
                </div>
            )}

            {/* Interactive Control Pill & Zoom Buttons */}
            <div className="position-absolute bottom-0 end-0 m-3 d-flex flex-column align-items-end gap-1.5 z-3">
                <div className="bg-dark bg-opacity-80 text-white px-2.5 py-1 rounded-pill border border-white border-opacity-10 shadow-sm d-flex align-items-center gap-1.5" style={{ fontSize: '0.62rem', letterSpacing: '0.02em' }}>
                    <i className="bi bi-arrows-move text-warning"></i>
                    <span>Drag to pan • Scroll to zoom</span>
                </div>
                <div className="d-flex flex-row gap-1 bg-dark bg-opacity-80 p-1 rounded-pill border border-white border-opacity-10 shadow">
                    <button onClick={handleZoomIn} className="btn btn-sm btn-dark p-1 border-0 rounded-circle w-8 h-8 d-flex align-items-center justify-content-center" title="Zoom In (+)"><i className="bi bi-zoom-in"></i></button>
                    <button onClick={handleZoomOut} className="btn btn-sm btn-dark p-1 border-0 rounded-circle w-8 h-8 d-flex align-items-center justify-content-center" title="Zoom Out (-)"><i className="bi bi-zoom-out"></i></button>
                    <button onClick={handleResetToAllIndia} className="btn btn-sm btn-dark p-1 border-0 rounded-circle w-8 h-8 d-flex align-items-center justify-content-center" title="Reset Zoom (↺)"><i className="bi bi-arrow-counterclockwise"></i></button>
                </div>
            </div>

            {/* Legend */}
            <div className="position-absolute bottom-0 start-0 m-2 d-flex flex-column gap-1 pointer-events-none p-2 bg-white bg-opacity-90 rounded-3 border shadow-sm backdrop-blur-md" style={{ zIndex: 10, minWidth: '100px' }}>
                <div className="d-flex align-items-center gap-1.5">
                    <div className="rounded-circle shadow-sm flex-shrink-0" style={{ width: 8, height: 8, background: '#ea580c' }}></div>
                    <span className="text-dark fw-bold text-uppercase tracking-wider" style={{ fontSize: '8.5px', letterSpacing: '0.03em' }}>Active State</span>
                </div>
                <div className="d-flex align-items-center gap-1.5">
                    <div className="rounded-circle shadow-sm flex-shrink-0" style={{ width: 8, height: 8, background: '#10b981' }}></div>
                    <span className="text-dark fw-bold text-uppercase tracking-wider" style={{ fontSize: '8.5px', letterSpacing: '0.03em' }}>Active District</span>
                </div>
                <div className="d-flex align-items-center gap-1.5">
                    <div className="rounded-circle shadow-sm flex-shrink-0" style={{ width: 8, height: 8, background: '#ec4899' }}></div>
                    <span className="text-dark fw-bold text-uppercase tracking-wider" style={{ fontSize: '8.5px', letterSpacing: '0.03em' }}>Selected Zone</span>
                </div>
                <div className="d-flex align-items-center gap-1.5 border-top pt-1 opacity-75">
                    <div className="rounded-circle flex-shrink-0" style={{ width: 8, height: 8, background: '#cbd5e1' }}></div>
                    <span className="text-dark fw-medium text-uppercase tracking-wider" style={{ fontSize: '8.5px', letterSpacing: '0.03em' }}>Other Region</span>
                </div>
            </div>

            <style jsx global>{`
                .map-interactive {
                    cursor: grab !important;
                    touch-action: none;
                }
                .map-interactive:active {
                    cursor: grabbing !important;
                }

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
