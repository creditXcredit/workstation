import { Activity, Browser, Clock, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function App() {
  const [sessions, setSessions] = useState([
    { id: '1', status: 'active', url: 'https://example.com', duration: '2m 15s' },
    { id: '2', status: 'idle', url: 'https://github.com', duration: '45s' },
  ]);

  const [metrics, setMetrics] = useState({
    memory: 45,
    latency: 120,
    integrity: 98.5,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Browser className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Stack Browser Agent</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-muted-foreground">System Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Memory Pressure"
            value={`${metrics.memory}%`}
            icon={<Activity className="h-5 w-5" />}
            status={metrics.memory > 75 ? 'warning' : 'good'}
            description="Container overhead vs baseline"
          />
          <MetricCard
            title="Latency Variance"
            value={`${metrics.latency}ms`}
            icon={<Clock className="h-5 w-5" />}
            status={metrics.latency > 150 ? 'warning' : 'good'}
            description="P95 latency consistency"
          />
          <MetricCard
            title="Data Integrity"
            value={`${metrics.integrity}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            status={metrics.integrity < 95 ? 'warning' : 'good'}
            description="Schema validation success"
          />
        </div>

        {/* Browser Sessions */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Browser className="h-5 w-5 mr-2 text-primary" />
            Active Browser Sessions
          </h2>
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>

        {/* Command Interface */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Browser Commands</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CommandButton label="Navigate" description="Go to URL" />
            <CommandButton label="Screenshot" description="Capture page" />
            <CommandButton label="Health Check" description="Verify status" />
            <CommandButton label="Clear Data" description="Reset session" />
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ title, value, icon, status, description }: any) {
  const statusColor = status === 'good' ? 'text-green-500' : 'text-yellow-500';
  const bgColor = status === 'good' ? 'bg-green-500/10' : 'bg-yellow-500/10';

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <div className={statusColor}>{icon}</div>
        </div>
        {status === 'good' ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <AlertCircle className="h-5 w-5 text-yellow-500" />
        )}
      </div>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function SessionCard({ session }: any) {
  const statusColor = session.status === 'active' ? 'bg-green-500' : 'bg-gray-500';

  return (
    <div className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
      <div className="flex items-center space-x-4">
        <div className={`h-3 w-3 rounded-full ${statusColor}`}></div>
        <div>
          <p className="font-medium text-foreground">{session.url}</p>
          <p className="text-sm text-muted-foreground">Session {session.id} • {session.status}</p>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">{session.duration}</div>
    </div>
  );
}

function CommandButton({ label, description }: any) {
  return (
    <button className="flex items-center justify-between p-4 bg-secondary border border-border rounded-lg hover:bg-primary hover:border-primary transition-all group">
      <div className="text-left">
        <p className="font-semibold text-foreground group-hover:text-primary-foreground">{label}</p>
        <p className="text-sm text-muted-foreground group-hover:text-primary-foreground/80">{description}</p>
      </div>
      <Activity className="h-5 w-5 text-muted-foreground group-hover:text-primary-foreground" />
    </button>
  );
}
