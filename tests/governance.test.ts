import { describe, expect, it } from "vitest";
import { parseProposalPackage, requireRole, riskRulePayloadSchema } from "../lib/governance";
import { activateProposal, reviewProposal, submitProposal } from "../lib/governance-service";
import type { GovernanceProposal } from "../lib/types";

function releaseProposal(): GovernanceProposal {
  return {
    schemaVersion: "1.0",
    id: `GOV-REL-TEST-${Math.random()}`,
    kind: "release",
    title: "Release review: test",
    rationale: "Verify the governed release workflow",
    payload: { targetProposalId: "GOV-KNW-1", recommendation: "conditional", evaluation: null },
    provenance: [{ source: "test suite", version: "1" }],
    evidence: { tests: [{ name: "build", passed: true, detail: "Build passed" }], risks: ["Human review required"] },
    status: "draft",
    createdBy: "Developer",
    createdAt: "2026-08-29T00:00:00.000Z",
  };
}

describe("governance proposal contract", () => {
  it("accepts a valid proposal package", () => {
    expect(parseProposalPackage(releaseProposal()).kind).toBe("release");
  });

  it("rejects executable or unknown risk metrics", () => {
    expect(() => riskRulePayloadSchema.parse({ rule: { id: "bad", name: "Bad rule", metric: "customerAge", operator: ">=", threshold: 65, points: 20, evidenceTemplate: "bad metric {value}" } })).toThrow();
  });

  it("enforces role allowlists", () => {
    expect(() => requireRole("compliance", ["developer"])).toThrow("FORBIDDEN");
    expect(() => requireRole("admin", ["admin"])).not.toThrow();
  });

  it("prevents creator self-approval", () => {
    const proposal = submitProposal(releaseProposal(), "Developer");
    expect(() => reviewProposal(proposal, "Developer", "approve", "I approve my own change")).toThrow("SELF_APPROVAL");
  });

  it("moves through submit, independent approval, and activation", () => {
    const proposal = releaseProposal();
    expect(submitProposal(proposal, "Developer").status).toBe("submitted");
    expect(reviewProposal(proposal, "Compliance", "approve", "Automated gates passed with declared condition").status).toBe("approved");
    expect(activateProposal(proposal, "Administrator").status).toBe("activated");
    expect(proposal.reviewedBy).toBe("Compliance");
    expect(proposal.activatedAt).toBeTruthy();
  });

  it("blocks submission when a mandatory test failed", () => {
    const proposal = releaseProposal();
    proposal.evidence.tests[0].passed = false;
    expect(() => submitProposal(proposal, "Developer")).toThrow("FAILED_GATES");
    expect(proposal.status).toBe("draft");
  });
});
