const { supabase } = require("../db/supabase");

async function listCases() {
  return supabase
    .from("cases")
    .select("*, submissions(*), users!cases_proctor_id_fkey(email)")
    .order("id", { ascending: false });
}

async function createCase(payload) {
  return supabase.from("cases").insert(payload).select().single();
}

async function updateCase(id, payload) {
  return supabase.from("cases").update(payload).eq("id", id).select().single();
}

module.exports = { listCases, createCase, updateCase };
