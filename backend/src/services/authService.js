const { authClient } = require("../db/supabase");
const { frontendUrl } = require("../config/env");
const { upsertUserProfile, findUserByAuthUserId } = require("./usersService");

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

module.exports = { signUpWithEmail, signInWithEmail };
