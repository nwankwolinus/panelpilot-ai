import { StatusBadge } from "@/components/status-badge";

export default function HomePage() {
  return (
    <main>
      <div className="container">
        <div className="card">
          <StatusBadge label="Architecture Foundation Established" variant="success" />

          <h1>PanelPilot AI</h1>
          <p className="subtitle">LV Electrical Panel Engineering and Quotation Platform</p>

          <div className="status-box">
            <p>
              The modular monolith architectural skeleton is established. Explicit module
              boundaries, shared domain primitives, protected server infrastructure, and automated
              architectural guardrails are active.
            </p>
          </div>

          <div className="meta-footer">
            <span>Sprint 0 &bull; Stage 0.2</span>
            <span>Modular Monolith Skeleton</span>
          </div>
        </div>
      </div>
    </main>
  );
}
