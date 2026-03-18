'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation, AlertTriangle, CheckCircle2, Route, Zap } from 'lucide-react'
import dynamic from 'next/dynamic'

interface Hospital {
  id: string
  name: string
  status: 'Critical' | 'Stable'
  coordinates: { lat: number; lng: number }
}

interface AmbulancePosition {
  lat: number
  lng: number
}

interface RouteData {
  hospitalId: string
  travelTime: number
  waitTime: number
  totalTime: number
  trafficCondition: 'Clear' | 'Moderate' | 'Gridlock'
}

interface GeospatialMapProps {
  hospitals: Hospital[]
  ambulancePosition: AmbulancePosition
  initialRoute?: string
  divertedRoute?: string
  routeData: Record<string, RouteData>
  isCalculating: boolean
  showGpsUpdate: boolean
}

// Inner component that handles the actual Leaflet map
function LeafletMapInner({
  hospitals,
  ambulancePosition,
  initialRoute,
  divertedRoute,
  routeData,
  isCalculating,
  showGpsUpdate,
}: GeospatialMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const polylinesRef = useRef<L.Polyline[]>([])
  const [isMapReady, setIsMapReady] = useState(false)
  const [showCalculation, setShowCalculation] = useState(false)
  const [L, setL] = useState<typeof import('leaflet') | null>(null)

  // Load Leaflet
  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default)
    })
  }, [])

  // Initialize map once
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return

    // Create map instance - centered on San Jose
    const map = L.map(mapContainerRef.current, {
      center: [37.30, -121.90], // San Jose center
      zoom: 12,
      zoomControl: true,
    })

    // Add tile layer with dark theme filter
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '',
    }).addTo(map)

    mapInstanceRef.current = map
    setIsMapReady(true)

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [L])

  // Update markers and routes when data changes
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !L) return

    const map = mapInstanceRef.current

    // Clear existing markers and polylines
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []
    polylinesRef.current.forEach((polyline) => polyline.remove())
    polylinesRef.current = []

    // Create icons
    const hospitalCriticalIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="position:relative;">
        <div style="position:absolute;inset:-8px;border-radius:50%;background:rgba(239,68,68,0.5);animation:ping 1.5s infinite;"></div>
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#dc2626;color:white;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">H</div>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    const hospitalStableIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#16a34a;color:white;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">H</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    const ambulanceIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="position:relative;">
        <div style="position:absolute;inset:-12px;border-radius:50%;background:rgba(59,130,246,0.4);animation:pulse 2s infinite;"></div>
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#2563eb;color:white;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"/><path d="M8 8v4"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
        </div>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    // Generate route points
    const generateRoutePoints = (
      start: { lat: number; lng: number },
      end: { lat: number; lng: number }
    ): [number, number][] => {
      const points: [number, number][] = []
      const segments = 10
      for (let i = 0; i <= segments; i++) {
        const t = i / segments
        const curve = Math.sin(t * Math.PI) * 0.002
        points.push([
          start.lat + (end.lat - start.lat) * t + curve,
          start.lng + (end.lng - start.lng) * t - curve,
        ])
      }
      return points
    }

    // Add hospital markers
    hospitals.forEach((hospital) => {
      const marker = L.marker([hospital.coordinates.lat, hospital.coordinates.lng], {
        icon: hospital.status === 'Critical' ? hospitalCriticalIcon : hospitalStableIcon,
      })
        .bindPopup(`<div style="font-family:monospace;font-size:11px;"><b>${hospital.name}</b><br/><span style="color:${hospital.status === 'Critical' ? '#ef4444' : '#22c55e'}">${hospital.status}</span></div>`)
        .addTo(map)
      markersRef.current.push(marker)
    })

    // Add ambulance marker
    const ambulanceMarker = L.marker([ambulancePosition.lat, ambulancePosition.lng], {
      icon: ambulanceIcon,
    })
      .bindPopup('<div style="font-family:monospace;font-size:11px;"><b>AMB-2847</b><br/><span style="color:#3b82f6">En Route</span></div>')
      .addTo(map)
    markersRef.current.push(ambulanceMarker)

    // Add routes
    const initialHospital = hospitals.find((h) => h.id === initialRoute)
    const divertedHospital = hospitals.find((h) => h.id === divertedRoute)

    if (initialHospital) {
      const initialRoutePoints = generateRoutePoints(ambulancePosition, initialHospital.coordinates)
      const initialPolyline = L.polyline(initialRoutePoints, {
        color: '#ef4444',
        weight: divertedRoute ? 3 : 4,
        opacity: divertedRoute ? 0.4 : 0.8,
        dashArray: divertedRoute ? '5, 15' : '10, 10',
      }).addTo(map)
      polylinesRef.current.push(initialPolyline)
    }

    if (divertedHospital) {
      const divertedRoutePoints = generateRoutePoints(ambulancePosition, divertedHospital.coordinates)
      const divertedPolyline = L.polyline(divertedRoutePoints, {
        color: '#4ade80',
        weight: 5,
        opacity: 0.9,
      }).addTo(map)
      polylinesRef.current.push(divertedPolyline)
    }
  }, [isMapReady, L, hospitals, ambulancePosition, initialRoute, divertedRoute])

  // Show calculation popup
  useEffect(() => {
    if (isCalculating) {
      setShowCalculation(true)
      const timer = setTimeout(() => setShowCalculation(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isCalculating])

  const initialHospital = hospitals.find((h) => h.id === initialRoute)
  const divertedHospital = hospitals.find((h) => h.id === divertedRoute)
  const initialRouteData = initialRoute ? routeData[initialRoute] : null
  const divertedRouteData = divertedRoute ? routeData[divertedRoute] : null

  return (
    <div className="relative h-full w-full">
      <style jsx global>{`
        .leaflet-container {
          height: 100%;
          width: 100%;
          background: #0a0a0f;
          font-family: 'Geist Mono', monospace;
        }
        .leaflet-tile {
          filter: grayscale(100%) invert(100%) contrast(90%) brightness(60%);
        }
        .leaflet-control-attribution {
          display: none;
        }
        .leaflet-control-zoom {
          border: none !important;
        }
        .leaflet-control-zoom a {
          background: rgba(20, 20, 30, 0.9) !important;
          color: #4ade80 !important;
          border: 1px solid rgba(74, 222, 128, 0.3) !important;
        }
        .custom-marker {
          background: transparent;
          border: none;
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Map Container */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Loading state */}
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Navigation className="h-6 w-6 text-primary" />
            </motion.div>
            <span className="font-mono text-[10px] text-muted-foreground">Loading Map...</span>
          </div>
        </div>
      )}

      {/* Navigation Telemetry Overlay */}
      {isMapReady && (
        <div className="absolute left-2 top-2 z-[1000] w-56 rounded border border-border bg-card/95 p-2 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-1.5 border-b border-border pb-1.5">
            <Navigation className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
              Nav Telemetry
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[9px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Route:</span>
              <span className={divertedRoute ? 'text-stable' : 'text-warning'}>
                {divertedRoute ? 'OPTIMIZED' : 'CALCULATING'}
              </span>
            </div>

            {initialRouteData && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Traffic Delay:</span>
                <span className="text-critical">
                  +{initialRouteData.waitTime}m at {initialHospital?.name?.split(' ')[0]}
                </span>
              </div>
            )}

            {divertedRouteData && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Recommended:</span>
                <span className="text-stable">
                  Reroute via {divertedHospital?.name?.split(' ')[0]}
                </span>
              </div>
            )}

            <div className="mt-1.5 border-t border-border pt-1.5">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-critical"></div>
                  <span className="text-[8px] text-muted-foreground">Gridlock</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-stable"></div>
                  <span className="text-[8px] text-muted-foreground">Clear</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GPS Updated Notification */}
      <AnimatePresence>
        {showGpsUpdate && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute left-1/2 top-2 z-[1000] -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded bg-stable px-3 py-1.5 text-primary-foreground shadow-lg">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-mono text-xs font-bold">GPS UPDATED</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calculation Popup */}
      <AnimatePresence>
        {showCalculation && divertedRouteData && initialRouteData && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute bottom-20 left-1/2 z-[1000] -translate-x-1/2"
          >
            <div className="rounded border border-primary/50 bg-card/95 p-3 shadow-xl backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <Zap className="h-4 w-4" />
                <span className="font-mono text-[10px] font-bold uppercase">Neural Processing</span>
              </div>
              <div className="space-y-1 font-mono text-[9px]">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{initialHospital?.name?.split(' ')[0]} Total:</span>
                  <span className="text-critical line-through">
                    {initialRouteData.travelTime + initialRouteData.waitTime}m
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{divertedHospital?.name?.split(' ')[0]} Total:</span>
                  <span className="text-stable font-bold">
                    {divertedRouteData.travelTime + divertedRouteData.waitTime}m
                  </span>
                </div>
                <div className="mt-2 border-t border-border pt-2">
                  <div className="text-[8px] text-muted-foreground">
                    Formula: TotalTime = DrivingTime + HospitalWaitTime
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Route Info Cards */}
      {isMapReady && (
        <div className="absolute bottom-2 right-2 z-[1000] space-y-1.5">
          {initialRouteData && initialHospital && (
            <div className={`rounded border px-2 py-1.5 backdrop-blur-sm ${
              divertedRoute 
                ? 'border-critical/30 bg-critical/10' 
                : 'border-warning/30 bg-warning/10'
            }`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-3 w-3 ${divertedRoute ? 'text-critical' : 'text-warning'}`} />
                <span className="font-mono text-[9px] text-muted-foreground">
                  {initialHospital.name}: {initialRouteData.trafficCondition}
                </span>
              </div>
              <div className="mt-0.5 font-mono text-[8px] text-muted-foreground">
                Drive: {initialRouteData.travelTime}m | Wait: {initialRouteData.waitTime}m
              </div>
            </div>
          )}

          {divertedRouteData && divertedHospital && (
            <div className="rounded border border-stable/30 bg-stable/10 px-2 py-1.5 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Route className="h-3 w-3 text-stable" />
                <span className="font-mono text-[9px] text-foreground font-medium">
                  {divertedHospital.name}: {divertedRouteData.trafficCondition}
                </span>
              </div>
              <div className="mt-0.5 font-mono text-[8px] text-muted-foreground">
                Drive: {divertedRouteData.travelTime}m | Wait: {divertedRouteData.waitTime}m
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Export as dynamic component with SSR disabled
export const GeospatialMap = dynamic(() => Promise.resolve(LeafletMapInner), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Navigation className="h-6 w-6 text-primary" />
        </motion.div>
        <span className="font-mono text-[10px] text-muted-foreground">Initializing GPS...</span>
      </div>
    </div>
  ),
})
