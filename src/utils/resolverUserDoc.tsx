// src/utils/resolveUserDoc.ts
import {
  collection, doc, getDoc, getDocs,
  limit, query, where, DocumentReference
} from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { db } from "../config/firebase";

// Quita undefined/null/""
const compact = (obj: Record<string, any>) => {
  const out: Record<string, any> = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  });
  return out;
};

export type ResolvedUserDoc = {
  ref: DocumentReference;                // referencia a /users/{idBueno}
  data: Record<string, any> | null;      // datos del doc (o null si no existe)
  id: string;                            // id del doc en /users (email o uid)
};

/**
 * Busca el doc de /users:
 * 1) por email (si hay),
 * 2) si no existe, fallback a /users/{uid}
 */
export async function resolveUserDocByAuth(u: FirebaseUser): Promise<ResolvedUserDoc> {
  // intento 1: por email
  if (u.email) {
    const q = query(collection(db, "users"), where("email", "==", u.email), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const found = snap.docs[0];
      const ref = doc(db, "users", found.id);
      const data = compact(found.data() as any);
      return { ref, data, id: found.id };
    }
  }

  // intento 2: /users/{uid}
  const fallbackRef = doc(db, "users", u.uid);
  const fallbackSnap = await getDoc(fallbackRef);
  if (fallbackSnap.exists()) {
    return { ref: fallbackRef, data: compact(fallbackSnap.data() as any), id: u.uid };
  }

  // si tampoco existe, devolvemos la ref a /users/{uid} con data null
  return { ref: fallbackRef, data: null, id: u.uid };
}
