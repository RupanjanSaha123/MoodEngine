import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isValidUrl = (url: string | undefined) => {
    try {
        return url && new URL(url).protocol.startsWith("http");
    } catch {
        return false;
    }
};

const isConfigured = isValidUrl(supabaseUrl) &&
    supabaseAnonKey &&
    !supabaseUrl?.includes("YOUR_SUPABASE_URL") &&
    !supabaseAnonKey?.includes("YOUR_SUPABASE_ANON_KEY");

export const supabase = isConfigured
    ? createClient(supabaseUrl!, supabaseAnonKey!)
    : createMockClient();

function createMockClient() {
    // console.warn("⚠️ Supabase is not configured using valid environment variables. Database features will be disabled.");

    const noop = () => ({
        data: null,
        error: new Error("Supabase is not configured"),
        select: noop,
        insert: noop,
        update: noop,
        delete: noop,
        eq: noop,
        single: noop,
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    });

    return new Proxy({}, {
        get: (target, prop) => {
            if (prop === 'then') return undefined;
            // Handle auth specifically as it's often accessed as an object
            if (prop === 'auth') {
                return {
                    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
                    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
                    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error("Mock auth failed") }),
                    signOut: () => Promise.resolve({ error: null }),
                };
            }
            return noop;
        }
    }) as any;
}
