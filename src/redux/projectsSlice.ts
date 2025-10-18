// src/redux/projectsSlice.ts
import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
  createSelector,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  collection,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  where,
  startAfter,
} from "firebase/firestore";

import type { IProject } from "../interface/IProject";
import type { IProjectState } from "../interface/IProjectState";
import type { RootState } from "../store/store";
import type { IFilters } from "../interface/IFilters";
import type { IUserState } from "../interface/IUserState";
import { db } from "../config/firebase";

export const projectAdapter = createEntityAdapter<IProject, string>({
  selectId: (p) => p.id,
});

const initialState = projectAdapter.getInitialState<IProjectState>({
  ids: [],
  entities: {},
  status: "idle",
  error: null,
  selectedProjectId: null,
  filters: {
    tags: ["Front-End", "React"],
    busqueda: "",
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 4,
    totalItems: 0,
  },
  lastVisible: null,
});

/** Tags fijas para la UI (no desaparecen al filtrar/paginar) */
const STATIC_TAGS = ["Front-End", "React", "Accesibilidad"];

/** Si ya tienes createdAt (Timestamp) en TODOS los docs => pon true */
const USE_CREATED_AT = false;

export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (_, { getState }) => {
    type PublicUser = Required<Pick<IUserState, "user">> & Pick<IUserState, "image">;

    const state = getState() as RootState;
    const { filters, pagination } = state.projects;
    const { itemsPerPage, currentPage } = pagination;

    try {
      const productsCol = collection(db, "projects");

      // 1) Constraints base
      const base: QueryConstraint[] = [];

      if (filters.tags?.length) {
        base.push(where("tags", "array-contains-any", filters.tags));
      }

      if (filters.busqueda) {
        const s = filters.busqueda.toLowerCase();
        base.push(orderBy("titulo"));
        base.push(where("titulo", ">=", s));
        base.push(where("titulo", "<", s + "\uf8ff"));
      } else {
        // Fallback a titulo si aún no tienes createdAt en todos los docs
        base.push(USE_CREATED_AT ? orderBy("createdAt", "desc") : orderBy("titulo"));
      }

      // 2) Total
      const totalSnap = await getCountFromServer(query(productsCol, ...base));
      const total = totalSnap.data().count;

      // 3) Cursor: salta páginas anteriores
      const skip = Math.max(0, (currentPage - 1) * itemsPerPage);
      let cursorDoc: any = null;

      if (skip > 0) {
        const preSnap = await getDocs(query(productsCol, ...base, limit(skip)));
        cursorDoc = preSnap.docs[preSnap.docs.length - 1] ?? null;
      }

      // 4) Página actual
      const pageSnap = await getDocs(
        query(
          productsCol,
          ...base,
          ...(cursorDoc ? [startAfter(cursorDoc)] : []),
          limit(itemsPerPage)
        )
      );

      // 5) Proyectos base (sin meter DocumentReference al state)
      const rawProjects: IProject[] = pageSnap.docs.map((d) => {
        const data = d.data() as any;
        const autorId =
          typeof data.autor?.id === "string" ? data.autor.id : String(data.autor);
        const { autor, ...rest } = data;

        return {
          id: d.id,
          ...rest,
          autorId,
        } as IProject;
      });

      // 6) Join de usuarios por lotes (in <= 10)
      const uniqueAuthorIds = Array.from(
        new Set(rawProjects.map((p) => p.autorId).filter(Boolean))
      );

      const fetchUsersChunk = async (ids: string[]): Promise<Map<string, PublicUser>> => {
        const usersCol = collection(db, "users");
        const usersQ = query(usersCol, where(documentId(), "in", ids));
        const usersSnap = await getDocs(usersQ);

        const map = new Map<string, PublicUser>();
        usersSnap.forEach((u) => {
          const data = u.data() as any;
          map.set(u.id, {
            user: String(data.user ?? ""),
            image: data.image ? String(data.image) : undefined,
          });
        });
        return map;
      };

      const chunkSize = 10;
      const maps: Map<string, PublicUser>[] = [];
      for (let i = 0; i < uniqueAuthorIds.length; i += chunkSize) {
        const chunk = uniqueAuthorIds.slice(i, i + chunkSize);
        if (chunk.length) maps.push(await fetchUsersChunk(chunk));
      }

      const usersMap: Map<string, PublicUser> = new Map();
      maps.forEach((m) => m.forEach((v, k) => usersMap.set(k, v)));

      // 7) Enriquecer con autorData
      const projects: IProject[] = rawProjects.map((p) => {
        const u = usersMap.get(p.autorId);
        return {
          ...p,
          autorData: u ? { id: p.autorId, user: u.user || p.autorId, image: u.image } : undefined,
        };
      });

      return { projects, total };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  "projects/fetchProjectById",
  async (projectId: string) => {
    const projectRef = doc(db, "projects", projectId);
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) throw new Error("Producto no encontrado");

    const data = projectDoc.data();
    const autorId = typeof data.autor?.id === "string" ?
      data.autor.id : String(data.autor)
    const { autor, ...rest } = data;

    return { id: projectDoc.id, ...rest, autorId } as IProject;
  }
);

/**
 * Trae proyectos del autor indicado (perfil).
 * Usa el ref de /users/{authorId} para filtrar y mapea autor -> autorId (string).
 */
export const fetchProjectsByAuthor = createAsyncThunk(
  "projects/fetchByAuthor",
  async (authorId: string, { getState }) => {
    // user requerido, image opcional (mismo helper que ya usaste)
    type PublicUser = { user: string; image?: string };

    const state = getState() as RootState;
    const { itemsPerPage } = state.projects.pagination;

    const projectsCol = collection(db, "projects");

    // Filtramos por autor (DocumentReference)
    const authorRef = doc(db, "users", authorId);

    // Constraints (orden por fecha, opcionalmente limit como en feed)
    const queryConstraints: QueryConstraint[] = [
      where("autor", "==", authorRef),
      orderBy("createdAt", "desc"),
      limit(itemsPerPage)
    ];

    const q = query(projectsCol, ...queryConstraints);

    // Total para paginación/counter (sin limit)
    const totalSnap = await getCountFromServer(
      query(projectsCol, where("autor", "==", authorRef))
    );
    const total = totalSnap.data().count;

    const snap = await getDocs(q);

    // 1) Base sin meter DocumentReference
    const rawProjects: IProject[] = snap.docs.map(d => {
      const data = d.data() as any;
      const autorId =
        typeof data.autor?.id === "string" ? data.autor.id : String(data.autor);
      const { autor, ...rest } = data;
      return { id: d.id, ...rest, autorId } as IProject;
    });

    // 2) (Opcional) Enriquecer autor (en este caso todos son el mismo, pero dejamos genérico)
    const uniqueAuthorIds = Array.from(new Set(rawProjects.map(p => p.autorId).filter(Boolean)));
    const fetchUsersChunk = async (ids: string[]): Promise<Map<string, PublicUser>> => {
      const usersCol = collection(db, "users");
      const usersQ = query(usersCol, where(documentId(), "in", ids));
      const usersSnap = await getDocs(usersQ);
      const map = new Map<string, PublicUser>();
      usersSnap.forEach(u => {
        const data = u.data() as any;
        map.set(u.id, {
          user: String(data.user ?? ""),
          image: data.image ? String(data.image) : undefined
        });
      });
      return map;
    };

    const chunkSize = 10;
    const maps: Map<string, PublicUser>[] = [];
    for (let i = 0; i < uniqueAuthorIds.length; i += chunkSize) {
      const chunk = uniqueAuthorIds.slice(i, i + chunkSize);
      maps.push(await fetchUsersChunk(chunk));
    }
    const usersMap: Map<string, PublicUser> = new Map();
    maps.forEach(m => m.forEach((v, k) => usersMap.set(k, v)));

    const projects: IProject[] = rawProjects.map(p => {
      const u = usersMap.get(p.autorId);
      return {
        ...p,
        autorData: u ? { id: p.autorId, user: u.user || p.autorId, image: u.image } : undefined
      };
    });

    return { projects, total };
  }
);

export const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<IFilters>) => {
      state.filters = action.payload;
      state.pagination.currentPage = 1;
      state.lastVisible = null;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
    clearProjects: (state) => {
      projectAdapter.removeAll(state);
      state.lastVisible = null;
      state.pagination.currentPage = 1;
    },
    setSelectedProject: (state, action: PayloadAction<string>) => {
      state.selectedProjectId = action.payload;
    },
    setProjects: (state, action: PayloadAction<IProject[]>) => {
      projectAdapter.setAll(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (action.payload) {
          projectAdapter.setAll(state, action.payload.projects);
          state.pagination.totalItems = action.payload.total;
        }
        state.error = null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Error cargando los productos";
      })
      .addCase(fetchProjectById.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (action.payload) {
          projectAdapter.upsertOne(state, action.payload);
          state.selectedProjectId = action.payload.id;
        }
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Error consultando el producto";
      })
      //Para seccion de PERFIL
      .addCase(fetchProjectsByAuthor.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProjectsByAuthor.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (action.payload) {
          projectAdapter.setAll(state, action.payload.projects);
          state.pagination.totalItems = action.payload.total;
        }
        state.error = null;
      })
      .addCase(fetchProjectsByAuthor.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Error cargando proyectos del autor";
      });
  },
});

export const {
  selectAll: selectAllProjects,
  selectById: selectProjectById,
} = projectAdapter.getSelectors<RootState>((state) => state.projects);

export const selectSelectedProject = (state: RootState) =>
  state.projects.selectedProjectId ? selectProjectById(state, state.projects.selectedProjectId) : null;

export const selectProjectStatus = (state: RootState) => state.projects.status;
export const selectProjectError = (state: RootState) => state.projects.error;
export const selectFilters = (state: RootState) => state.projects.filters;

/** Memoizado: evita el warning de “selector returned a different result…” */
const selectPagination = (state: RootState) => state.projects.pagination;
export const selectPaginationInfo = createSelector([selectPagination], (pagination) => {
  const totalPages =
    pagination.itemsPerPage > 0
      ? Math.ceil(pagination.totalItems / pagination.itemsPerPage)
      : 0;
  return { ...pagination, totalPages };
});

/** Tags fijas */
export const selectAllTags = (_: RootState) => STATIC_TAGS;

export const { setSelectedProject, setProjects, setFilters, clearProjects, setCurrentPage } =
  projectsSlice.actions;

export default projectsSlice.reducer;
