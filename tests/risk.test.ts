import { describe, expect, it } from "vitest";
import { evaluateBroker, riskRules } from "../lib/risk";
import type { Broker } from "../lib/types";

const safeBroker: Broker = {
  id: "BR-TEST", name: "测试中介", region: "港岛", clients: 50, premium: 500000,
  metrics: { replacements30d: 1, productConcentration: .4, commissionRatio: .1, refundRatio: .04, sharedAccountCount: 0, complaints30d: 0, afterHoursRatio: .1 },
};

describe("deterministic intermediary risk rules", () => {
  it("does not create a case when no rule is triggered", () => {
    expect(evaluateBroker(safeBroker)).toBeNull();
  });

  it("creates a high-risk explainable case for multiple signals", () => {
    const broker: Broker = { ...safeBroker, metrics: { replacements30d: 9, productConcentration: .9, commissionRatio: .31, refundRatio: .22, sharedAccountCount: 5, complaints30d: 4, afterHoursRatio: .42 } };
    const item = evaluateBroker(broker, new Date("2026-08-29T00:00:00Z"));
    expect(item?.level).toBe("high");
    expect(item?.score).toBe(100);
    expect(item?.evidence).toHaveLength(riskRules.length);
    expect(item?.summary).toContain("不代表欺诈认定");
  });

  it("treats exact thresholds as rule hits", () => {
    const broker: Broker = { ...safeBroker, metrics: { ...safeBroker.metrics, replacements30d: 6 } };
    const item = evaluateBroker(broker);
    expect(item?.score).toBe(25);
    expect(item?.evidence[0].ruleId).toBe("rapid-replacement");
  });
});
