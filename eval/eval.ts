import process from "node:process";

const modeArg = process.argv.find(argument => argument.startsWith("--mode="));
const mode = modeArg?.split("=")[1] ?? "mock";

if (mode === "mock") {
  console.log(JSON.stringify({
    mode: "mock",
    status: "CONTRACT_CHECK_ONLY",
    measuredEffect: false,
    checks: [
      "schemas",
      "safety-rules",
      "workflow-states",
      "api-contracts"
    ]
  }, null, 2));
  process.exit(0);
}

console.error(JSON.stringify({
  mode,
  status: "BLOCKED",
  reason: "Authorized data, independent Gold, frozen configuration and holdout manifest are not available.",
  measuredEffect: false
}, null, 2));
process.exit(2);
