const { supabase } = require("../db/supabase");

async function listCaseEvidence(caseId) {
  return supabase
    .from("case_evidence")
    .select("*, users!case_evidence_created_by_fkey(email, role)")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });
}

async function createCaseEvidence(payload) {
  return supabase.from("case_evidence").insert(payload).select().single();
}

module.exports = {
  listCaseEvidence,
  createCaseEvidence
};
