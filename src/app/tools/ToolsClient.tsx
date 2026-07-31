'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Gauge,
  Globe,
  Terminal,
  RefreshCw,
  Loader2,
  Wifi,
  MapPin,
  Clock,
  Server,
  Hash,
  ArrowRightLeft,
  FileText,
  AlertCircle,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Speed Test                                                         */
/* ------------------------------------------------------------------ */
function SpeedTestCard() {
  return (
    <div className="card bg-base-200 border border-base-300 shadow-lg">
      <div className="card-body">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Gauge className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="card-title text-xl">Internet Speed Test</h2>
            <p className="text-sm text-base-content/60">
              Test your download &amp; upload speed powered by OpenSpeedTest
            </p>
          </div>
        </div>
        <div className="mt-2 rounded-xl overflow-hidden border border-base-300">
          <iframe
            src="https://openspeedtest.com/speedtest"
            style={{ width: '100%', height: 400, border: 'none' }}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
            title="Internet Speed Test"
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  IP Lookup                                                          */
/* ------------------------------------------------------------------ */
interface IpData {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  org: string;
  asn: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

function IpLookupCard() {
  const [data, setData] = useState<IpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIp = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch IP data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIp();
  }, [fetchIp]);

  return (
    <div className="card bg-base-200 border border-base-300 shadow-lg">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 className="card-title text-xl">IP Lookup &amp; Geolocation</h2>
              <p className="text-sm text-base-content/60">
                Your public IP address and location details
              </p>
            </div>
          </div>
          <button
            onClick={fetchIp}
            className="btn btn-ghost btn-sm gap-1.5"
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Content */}
        <div className="mt-4">
          {loading && !data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-20 w-full rounded-lg" />
              ))}
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
              <button onClick={fetchIp} className="btn btn-sm btn-ghost">
                Retry
              </button>
            </div>
          )}

          {data && !loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatItem icon={<Wifi className="w-4 h-4" />} label="IP Address" value={data.ip} />
              <StatItem
                icon={<MapPin className="w-4 h-4" />}
                label="Location"
                value={[data.city, data.region, data.country_name].filter(Boolean).join(', ')}
              />
              <StatItem
                icon={<Server className="w-4 h-4" />}
                label="ISP / Organization"
                value={data.org || 'N/A'}
              />
              <StatItem
                icon={<Clock className="w-4 h-4" />}
                label="Timezone"
                value={data.timezone || 'N/A'}
              />
              <StatItem
                icon={<Globe className="w-4 h-4" />}
                label="Coordinates"
                value={
                  data.latitude != null && data.longitude != null
                    ? `${data.latitude}, ${data.longitude}`
                    : 'N/A'
                }
              />
              <StatItem
                icon={<Hash className="w-4 h-4" />}
                label="ASN"
                value={data.asn || 'N/A'}
              />
            </div>
          )}

          {data && loading && (
            <div className="flex items-center gap-2 text-sm text-base-content/60 mt-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Refreshing…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-base-100 rounded-lg p-4 border border-base-300">
      <div className="flex items-center gap-2 text-base-content/50 text-xs mb-1">
        {icon}
        <span className="uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className="text-base font-semibold truncate">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Network Diagnostics                                                */
/* ------------------------------------------------------------------ */
const DIAG_TOOLS = [
  { key: 'nping', label: 'Ping', icon: Wifi, endpoint: 'nping' },
  { key: 'dns', label: 'DNS Lookup', icon: Globe, endpoint: 'dnslookup' },
  { key: 'mtr', label: 'Traceroute', icon: ArrowRightLeft, endpoint: 'mtr' },
  { key: 'http', label: 'HTTP Headers', icon: FileText, endpoint: 'httpheaders' },
] as const;

function NetworkDiagnosticsCard() {
  const [target, setTarget] = useState('');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTool = useCallback(async (endpoint: string, toolKey: string) => {
    const q = target.trim();
    if (!q || !/^[a-zA-Z0-9.:\-/]+$/.test(q) || q.length > 253) {
      setResult('Please enter a valid domain or IP address');
      setLoading(false);
      return;
    }
    setActiveTool(toolKey);
    setLoading(true);
    setError(null);
    setResult('');
    try {
      const res = await fetch(`https://api.hackertarget.com/${endpoint}/?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const text = await res.text();
      setResult(text || 'No results returned.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [target]);

  return (
    <div className="card bg-base-200 border border-base-300 shadow-lg">
      <div className="card-body">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="card-title text-xl">Network Diagnostics</h2>
            <p className="text-sm text-base-content/60">
              Ping, DNS lookup, traceroute &amp; HTTP headers via HackerTarget
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <input
            type="text"
            placeholder="Enter domain or IP (e.g. google.com)"
            className="input input-bordered flex-1 bg-base-100"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runTool(DIAG_TOOLS[0].endpoint, DIAG_TOOLS[0].key);
            }}
          />
        </div>

        {/* Tool buttons */}
        <div className="flex flex-wrap gap-2 mt-3">
          {DIAG_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.key && loading;
            return (
              <button
                key={tool.key}
                className={`btn btn-sm gap-1.5 ${
                  activeTool === tool.key ? 'btn-primary' : 'btn-outline'
                }`}
                disabled={loading || !target.trim()}
                onClick={() => runTool(tool.endpoint, tool.key)}
              >
                {isActive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                {tool.label}
              </button>
            );
          })}
        </div>

        {/* Results */}
        {(result || error) && (
          <div className="mt-4">
            {error && (
              <div className="alert alert-error mb-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
            {result && (
              <pre className="bg-base-100 border border-base-300 rounded-lg p-4 overflow-x-auto text-sm font-mono text-base-content/80 max-h-96 overflow-y-auto whitespace-pre-wrap break-all">
                {result}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Client Component                                              */
/* ------------------------------------------------------------------ */
export default function ToolsClient() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          Free Tech Tools
        </h1>
        <p className="text-base-content/60 mt-3 text-lg">
          Essential network and internet tools — free, no signup required
        </p>
      </div>

      {/* Speed Test */}
      <section>
        <SpeedTestCard />
      </section>

      {/* IP Lookup */}
      <section>
        <IpLookupCard />
      </section>

      {/* Network Diagnostics */}
      <section>
        <NetworkDiagnosticsCard />
      </section>
    </div>
  );
}
