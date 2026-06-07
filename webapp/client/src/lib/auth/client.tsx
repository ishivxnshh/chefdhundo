"use client";

import React, {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

export type MobileAuthUser = {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  primaryPhoneNumber: { id: string; phoneNumber: string } | null;
  primaryPhoneNumberId: string | null;
  publicMetadata: { role: "basic" | "pro" | "admin" };
  unsafeMetadata: Record<string, never>;
  reload: () => Promise<void>;
};

export type CompatUser = MobileAuthUser;

type MeResponse = {
  isSignedIn: boolean;
  user: Omit<MobileAuthUser, "reload"> | null;
};

export type MobileAuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

export type MobileAuthState = {
  status: MobileAuthStatus;
  user: MobileAuthUser | null;
  error: Error | null;
};

type MobileAuthAction =
  | { type: "authenticated"; user: MobileAuthUser }
  | { type: "unauthenticated" }
  | { type: "error"; error: Error };

type MobileAuthContextValue = MobileAuthState & {
  reload: () => Promise<void>;
};

const MobileAuthContext = createContext<MobileAuthContextValue | null>(null);

export function createInitialAuthState(
  user: MobileAuthUser | null,
): MobileAuthState {
  return {
    status: user ? "authenticated" : "loading",
    user,
    error: null,
  };
}

export function authStateReducer(
  state: MobileAuthState,
  action: MobileAuthAction,
): MobileAuthState {
  switch (action.type) {
    case "authenticated":
      return {
        status: "authenticated",
        user: action.user,
        error: null,
      };
    case "unauthenticated":
      return {
        status: "unauthenticated",
        user: null,
        error: null,
      };
    case "error":
      return {
        status: "error",
        user: state.user,
        error: action.error,
      };
  }
}

function goToSignIn() {
  window.location.href = "/sign-in";
}

function initials(name?: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() || "U";
}

function toCompatUser(
  user: Omit<MobileAuthUser, "reload">,
  reload: () => Promise<void>,
): MobileAuthUser {
  return {
    ...user,
    reload,
  };
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error("Unable to load session");
}

export function MobileAuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: Omit<MobileAuthUser, "reload"> | null;
}) {
  const [state, dispatch] = useReducer(
    authStateReducer,
    initialUser
      ? createInitialAuthState(
          toCompatUser(initialUser, async () => undefined),
        )
      : createInitialAuthState(null),
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) {
        throw new Error(`Unable to load session (${res.status})`);
      }

      const data: MeResponse = await res.json();
      if (!data?.isSignedIn || !data.user) {
        dispatch({ type: "unauthenticated" });
        return;
      }

      dispatch({
        type: "authenticated",
        user: toCompatUser(data.user, load),
      });
    } catch (error) {
      dispatch({ type: "error", error: toError(error) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo<MobileAuthContextValue>(
    () => ({
      ...state,
      user: state.user ? { ...state.user, reload: load } : null,
      reload: load,
    }),
    [load, state],
  );

  return (
    <MobileAuthContext.Provider value={value}>
      {children}
    </MobileAuthContext.Provider>
  );
}

export function useMobileAuth() {
  const context = useContext(MobileAuthContext);
  if (!context) {
    throw new Error("useMobileAuth must be used within MobileAuthProvider");
  }
  return context;
}

export function useUser() {
  const { status, user, error } = useMobileAuth();
  return {
    isLoaded: status !== "loading",
    isSignedIn: !!user,
    user,
    error,
    status,
  };
}

export function useAuth() {
  const { status, user, error, reload } = useMobileAuth();

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    await reload();
    window.location.href = "/";
  }, [reload]);

  return {
    isLoaded: status !== "loading",
    isSignedIn: !!user,
    userId: user?.id ?? null,
    getToken: async () => null,
    signOut,
    reload,
    error,
    status,
  };
}

export function SignInButton({
  children,
  forceRedirectUrl,
  fallbackRedirectUrl,
}: {
  children: React.ReactNode;
  mode?: "modal" | "redirect";
  forceRedirectUrl?: string;
  fallbackRedirectUrl?: string;
}) {
  const target = `/sign-in${
    forceRedirectUrl || fallbackRedirectUrl
      ? `?next=${encodeURIComponent(forceRedirectUrl || fallbackRedirectUrl || "/dashboard")}`
      : ""
  }`;

  if (isValidElement(children)) {
    const child = children as React.ReactElement<{
      onClick?: React.MouseEventHandler;
    }>;
    return cloneElement(child, {
      onClick: (e) => {
        child.props.onClick?.(e);
        window.location.href = target;
      },
    });
  }

  return (
    <button type="button" onClick={() => (window.location.href = target)}>
      {children}
    </button>
  );
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const { status } = useMobileAuth();
  return status === "unauthenticated" ? <>{children}</> : null;
}

export function UserButton({
  afterSignOutUrl = "/",
}: {
  afterSignOutUrl?: string;
  appearance?: unknown;
}) {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const label = useMemo(() => initials(user?.fullName), [user?.fullName]);

  if (!isLoaded || !user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        title="Account menu"
        aria-label="Open account menu"
        aria-expanded={open}
        disabled={loading}
        onClick={() => setOpen((value) => !value)}
        className="w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-semibold"
      >
        {loading ? "..." : label}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 text-sm shadow-xl">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="font-medium text-gray-900">{user.fullName || "Mobile account"}</p>
            <p className="text-xs text-gray-500">{user.primaryPhoneNumber?.phoneNumber || user.id}</p>
          </div>
          <a
            href="/dashboard"
            className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50"
          >
            Dashboard
          </a>
          <button
            type="button"
            className="w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"
            onClick={async () => {
              setLoading(true);
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = afterSignOutUrl;
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export function SignIn(props?: {
  appearance?: unknown;
  routing?: string;
  path?: string;
  signUpUrl?: string;
  fallbackRedirectUrl?: string;
}) {
  void props;
  return (
    <div className="w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-lg">
      <h2 className="text-2xl font-semibold mb-3">Login with Mobile OTP</h2>
      <p className="text-sm text-gray-600 mb-6">Use your Indian mobile number to continue.</p>
      <button
        type="button"
        className="w-full rounded-md bg-black text-white py-3"
        onClick={goToSignIn}
      >
        Continue
      </button>
    </div>
  );
}

export function SignUp(props?: {
  appearance?: unknown;
  routing?: string;
  path?: string;
  signInUrl?: string;
  fallbackRedirectUrl?: string;
}) {
  void props;
  return <SignIn />;
}
