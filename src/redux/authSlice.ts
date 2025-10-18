import { createAsyncThunk, createSlice, type PayloadAction} from "@reduxjs/toolkit";
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../config/firebase";

export type AuthStatus = "idle" | "loading" | "succeeded" | "failed";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};

// Helpers
const toAuthUser = (u:AuthUser) => ({
  uid: u.uid,
  email: u.email,
  displayName: u.displayName,
});

// Mapear errores de Firebase a mensajes claros
const friendly = (code: string) => {
  const map: Record<string, string> = {
    "auth/invalid-email": "Email inválido.",
    "auth/user-disabled": "Usuario deshabilitado.",
    "auth/user-not-found": "Usuario no encontrado.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
    "auth/email-already-in-use": "Ese email ya está registrado.",
    "auth/weak-password": "La contraseña es muy débil.",
  };
  return map[code] ?? "Ocurrió un error. Intenta nuevamente.";
};

// Thunks
export const loginWithEmail = createAsyncThunk<
  AuthUser,
  { email: string; password: string },
  { rejectValue: string }
>("auth/loginWithEmail", async ({ email, password }, { rejectWithValue }) => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return toAuthUser(cred.user);
  } catch (e: any) {
    return rejectWithValue(friendly(e.code));
  }
});

export const registerWithEmail = createAsyncThunk<
  AuthUser,
  { name: string; email: string; password: string },
  { rejectValue: string }
>("auth/registerWithEmail", async ({ name, email, password }, { rejectWithValue }) => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    return toAuthUser(cred.user);
  } catch (e: any) {
    return rejectWithValue(friendly(e.code));
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  await signOut(auth);
});

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    setUserFromObserver(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(loginWithEmail.pending, (s) => { s.status = "loading"; s.error = null; });
    b.addCase(loginWithEmail.fulfilled, (s, a) => { s.status = "succeeded"; s.user = a.payload; });
    b.addCase(loginWithEmail.rejected, (s, a) => { s.status = "failed"; s.error = a.payload ?? "Error al iniciar sesión"; });

    b.addCase(registerWithEmail.pending, (s) => { s.status = "loading"; s.error = null; });
    b.addCase(registerWithEmail.fulfilled, (s, a) => { s.status = "succeeded"; s.user = a.payload; });
    b.addCase(registerWithEmail.rejected, (s, a) => { s.status = "failed"; s.error = a.payload ?? "Error al registrar"; });

    b.addCase(logout.fulfilled, (s) => { s.user = null; s.status = "idle"; s.error = null; });
  },
});

export const { clearAuthError, setUserFromObserver } = authSlice.actions;
export default authSlice.reducer;

// Selectores
export const selectAuthUser = (state: any) => (state.auth as AuthState).user;
export const selectAuthStatus = (state: any) => (state.auth as AuthState).status;
export const selectAuthError = (state: any) => (state.auth as AuthState).error;
