const { supabase, adminAuthClient } = require("../db/supabase");

async function listUsers() {
  return supabase.from("users").select("*").order("id", { ascending: true });
}

async function listUsersByEmails(emails) {
  return supabase
    .from("users")
    .select("*")
    .in("email", emails)
    .order("email", { ascending: true });
}

async function findUserByAuthUserId(authUserId) {
  return supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
}

async function findUserByEmail(email) {
  return supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();
}

async function createUser(payload) {
  return supabase.from("users").insert(payload).select().single();
}

async function upsertUserProfile(payload) {
  return supabase
    .from("users")
    .upsert(payload, { onConflict: "email" })
    .select()
    .single();
}

async function createManagedAuthUser({ email, password, role, emailConfirmed = true }) {
  return adminAuthClient.auth.admin.createUser({
    email,
    password,
    email_confirm: emailConfirmed,
    user_metadata: { role }
  });
}

module.exports = {
  listUsers,
  listUsersByEmails,
  findUserByAuthUserId,
  findUserByEmail,
  createUser,
  upsertUserProfile,
  createManagedAuthUser
};
