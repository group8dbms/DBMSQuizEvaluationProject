const { authClient } = require("../db/supabase");
const { frontendUrl } = require("../config/env");
const { upsertUserProfile, findUserByAuthUserId, findUserByEmail } = require("./usersService");

async function signUpWithEmail({ email, password, role }) {
  const { data, error } = await authClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${frontendUrl}/?verified=1`
    }
  });

  if (error) {
    return { data: null, error };
  }

  if (data.user) {
    const profileResult = await upsertUserProfile({
      auth_user_id: data.user.id,
      email: data.user.email,
      role
    });

    if (profileResult.error) {
      return { data: null, error: profileResult.error };
    }

    return {
      data: {
        user: data.user,
        session: data.session,
        profile: profileResult.data
      },
      error: null
    };
  }

  return { data, error: null };
}

async function signInWithEmail({ email, password }) {
  const { data, error } = await authClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { data: null, error };
  }

  const profileResult = await findUserByAuthUserId(data.user.id);
  if (profileResult.error) {
    return { data: null, error: profileResult.error };
  }

  return {
    data: {
      user: data.user,
      session: data.session,
      profile: profileResult.data
    },
    error: null
  };
}

async function studentAccess({ email, password }) {
  const loginResult = await signInWithEmail({ email, password });
  if (!loginResult.error) {
    return { ...loginResult, mode: "login" };
  }

  const errorMessage = loginResult.error?.message || "";
  const profileLookup = await findUserByEmail(email);
  if (profileLookup.error) {
    return { data: null, error: profileLookup.error };
  }

  const canAutoRegister = !profileLookup.data && /invalid login credentials/i.test(errorMessage);
  if (!canAutoRegister) {
    return { data: null, error: loginResult.error };
  }

  const signupResult = await signUpWithEmail({ email, password, role: "student" });
  return { ...signupResult, mode: "signup" };
}

module.exports = { signUpWithEmail, signInWithEmail, studentAccess };
