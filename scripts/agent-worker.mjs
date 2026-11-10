// ==============================================================================
// Givi — Background Autonomous Giving Agent Worker
// Periodically evaluates urgent verified community relief needs on Render
// ==============================================================================

const POLL_INTERVAL_MS = parseInt(process.env.AGENT_POLL_INTERVAL_MS || "60000", 10);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000";

console.log(`[givi-agent-worker] Autonomous Giving Agent worker started.`);
console.log(`[givi-agent-worker] Poll interval: ${POLL_INTERVAL_MS / 1000}s. Target: ${APP_URL}`);

let isRunning = false;

async function runAutonomousCycle() {
  if (isRunning) return;
  isRunning = true;

  try {
    const timestamp = new Date().toISOString();
    console.log(`[givi-agent-worker] [${timestamp}] Scanning causes for autonomous relief opportunities...`);

    const response = await fetch(`${APP_URL}/api/agent/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donorId: "worker_agentic_cron",
        maxAmountPerCause: 15.0,
        minTrustScore: 85,
        maxTotalBudget: 50.0,
        categories: ["utilities", "medical", "food"],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[givi-agent-worker] Cycle complete: ${data.executedDisbursements || 0} relief payouts executed ($${data.totalDisbursed || 0}).`);
    } else {
      const errorText = await response.text();
      console.warn(`[givi-agent-worker] Agent cycle response ${response.status}: ${errorText}`);
    }
  } catch (err) {
    console.warn(`[givi-agent-worker] Agent cycle deferred (app may be starting up):`, err.message);
  } finally {
    isRunning = false;
  }
}

// Initial cycle on boot
runAutonomousCycle();

// Recurring interval
setInterval(runAutonomousCycle, POLL_INTERVAL_MS);

// Graceful termination
process.on("SIGTERM", () => {
  console.log("[givi-agent-worker] SIGTERM received. Shutting down gracefully.");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("[givi-agent-worker] SIGINT received. Shutting down gracefully.");
  process.exit(0);
});

