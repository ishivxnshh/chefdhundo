import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  authStateReducer,
  createInitialAuthState,
  MobileAuthProvider,
  type MobileAuthUser,
  useAuth,
  useUser,
} from "./client";

const user: MobileAuthUser = {
  id: "phone:+919876543210",
  fullName: "+919876543210",
  firstName: "+919876543210",
  lastName: null,
  imageUrl: null,
  primaryPhoneNumber: {
    id: "primary-phone",
    phoneNumber: "+919876543210",
  },
  primaryPhoneNumberId: "primary-phone",
  publicMetadata: { role: "basic" },
  unsafeMetadata: {},
  reload: async () => undefined,
};

describe("mobile auth state", () => {
  it("starts authenticated when the server provides a user", () => {
    const state = createInitialAuthState(user);

    expect(state.status).toBe("authenticated");
    expect(state.user).toBe(user);
    expect(state.error).toBeNull();
  });

  it("keeps the known user when refreshing the session fails", () => {
    const initialState = createInitialAuthState(user);
    const error = new Error("temporary network failure");

    const state = authStateReducer(initialState, {
      type: "error",
      error,
    });

    expect(state.status).toBe("error");
    expect(state.user).toBe(user);
    expect(state.error).toBe(error);
  });

  it("represents an auth request failure differently from signed-out", () => {
    const error = new Error("service unavailable");

    const state = authStateReducer(createInitialAuthState(null), {
      type: "error",
      error,
    });

    expect(state.status).toBe("error");
    expect(state.user).toBeNull();
    expect(state.error).toBe(error);
  });

  it("clears the user only after an explicit unauthenticated response", () => {
    const state = authStateReducer(createInitialAuthState(user), {
      type: "unauthenticated",
    });

    expect(state.status).toBe("unauthenticated");
    expect(state.user).toBeNull();
    expect(state.error).toBeNull();
  });
});

describe("mobile auth compatibility hooks", () => {
  it("shares one provider user between useAuth and useUser", () => {
    function Consumer() {
      const auth = useAuth();
      const currentUser = useUser();

      return React.createElement(
        "span",
        null,
        `${auth.userId}:${currentUser.user?.id}:${String(auth.isSignedIn)}`,
      );
    }

    const html = renderToStaticMarkup(
      React.createElement(
        MobileAuthProvider,
        { initialUser: user },
        React.createElement(Consumer),
      ),
    );

    expect(html).toContain(
      "phone:+919876543210:phone:+919876543210:true",
    );
  });
});
