const { supabase } = require("../db/supabase");

async function listUsers() {
  return supabase.from("users").select("*").order("id", { ascending: true });
}

async function createUser(payload) {
  return supabase.from("users").insert(payload).select().single();
}

module.exports = { listUsers, createUser };
