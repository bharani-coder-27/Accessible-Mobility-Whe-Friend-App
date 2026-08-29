import React, { useContext } from "react";
import { Redirect } from "expo-router";
import { AuthContext } from "../src/contexts/AuthContext";

/**
 * Entry route. The splash screen is held until the stored session resolves
 * (see AppGate in _layout), so by the time this renders `user` is settled and
 * there is no signed-out flash before the redirect.
 */
export default function Index() {
  const { user } = useContext(AuthContext);

  if (!user) return <Redirect href="/Auth/LoginScreen" />;
  if (user.role === "passenger") return <Redirect href="/Passenger" />;

  return <Redirect href="/Conductor/waiting" />;
}
