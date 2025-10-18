// src/pages/ProjectDetail.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/hooks";
import {
  fetchProjectById,
  selectProjectStatus,
  selectSelectedProject,
} from "../redux/projectsSlice";

import {
  addDoc,
  collection,
  documentId,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  limit as qLimit,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../config/firebase";

// Syntax highlighter
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type CommentDoc = {
  id: string;
  authorId: string;
  text: string;
  parentId: string | null;
  createdAt?: any;
};

type PublicUser = { user: string; image?: string };

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams();

  const dispatch = useAppDispatch();
  const project = useAppSelector(selectSelectedProject);
  const status = useAppSelector(selectProjectStatus);

  // --- auth user resuelto a un ID de /users (o uid como fallback) ---
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // --- comentarios ---
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [rootText, setRootText] = useState(""); // textarea grande
  const [openReplyFor, setOpenReplyFor] = useState<string | null>(null); // id del comentario que tiene la respuesta abierta
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({}); // textos por parentId

  // Mapa authorId -> { user, image } para comentarios
  const [commentUsers, setCommentUsers] = useState<Map<string, PublicUser>>(
    new Map()
  );

  // 1) Cargar proyecto
  useEffect(() => {
    if (projectId) dispatch(fetchProjectById(projectId));
  }, [dispatch, projectId]);

  // 2) Resolver usuario autenticado -> id en /users por email (o uid)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setAuthUserId(null);
        setAuthReady(true);
        return;
      }
      let resolvedId: string | null = null;
      if (u.email) {
        const usersCol = collection(db, "users");
        const q = query(usersCol, where("email", "==", u.email), qLimit(1));
        const snap = await getDocs(q);
        if (!snap.empty) resolvedId = snap.docs[0].id;
      }
      setAuthUserId(resolvedId ?? u.uid);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // 3) Escucha en vivo de comments
  useEffect(() => {
    if (!projectId) return;
    const q = query(
      collection(db, "projects", projectId, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows: CommentDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setComments(rows);
    });
    return unsub;
  }, [projectId]);

  // 4) Escribir cantidad de comentarios en Firebase (mantener métrica en el doc)
  useEffect(() => {
    if (!projectId) return;
    const liveCount = comments.length;
    const current = project?.metrics?.comments ?? 0;
    if (liveCount === current) return;
    updateDoc(doc(db, "projects", projectId), {
      "metrics.comments": liveCount,
    }).catch(console.error);
  }, [comments.length, projectId, project?.metrics?.comments]);

  // 5) Resolver autores de comentarios contra /users por lotes
  useEffect(() => {
    if (comments.length === 0) {
      setCommentUsers(new Map());
      return;
    }
    const ids = Array.from(new Set(comments.map((c) => c.authorId).filter(Boolean)));

    const fetchUsersChunk = async (idsChunk: string[]) => {
      const usersCol = collection(db, "users");
      const q = query(usersCol, where(documentId(), "in", idsChunk));
      const snap = await getDocs(q);
      const map = new Map<string, PublicUser>();
      snap.forEach((d) => {
        const data = d.data() as any;
        map.set(d.id, {
          user: String(data.user ?? ""),
          image: data.image ? String(data.image) : undefined,
        });
      });
      return map;
    };

    (async () => {
      const chunkSize = 10; // Firestore 'in' limita a 10
      const maps: Map<string, PublicUser>[] = [];
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        maps.push(await fetchUsersChunk(chunk));
      }
      const merged = new Map<string, PublicUser>();
      maps.forEach((m) => m.forEach((v, k) => merged.set(k, v)));
      setCommentUsers(merged);
    })();
  }, [comments]);

  const rootComments = useMemo(
    () => comments.filter((c) => !c.parentId),
    [comments]
  );

  const repliesByParent = useMemo(() => {
    const map = new Map<string, CommentDoc[]>();
    comments.forEach((c) => {
      if (!c.parentId) return;
      const arr = map.get(c.parentId) ?? [];
      arr.push(c);
      map.set(c.parentId, arr);
    });
    return map;
  }, [comments]);

  // --- helpers para replies ---
  const setReplyDraft = (parentId: string, v: string) =>
    setReplyDrafts((prev) => ({ ...prev, [parentId]: v }));

  const handleAddRoot = async () => {
    if (!projectId || !authUserId) return;
    const text = rootText.trim();
    if (!text) return;
    await addDoc(collection(db, "projects", projectId, "comments"), {
      authorId: authUserId,
      text,
      parentId: null,
      createdAt: serverTimestamp(),
    });
    setRootText("");
  };

  const handleAddReply = async (parentId: string) => {
    if (!projectId || !authUserId) return;
    const text = (replyDrafts[parentId] || "").trim();
    if (!text) return;
    await addDoc(collection(db, "projects", projectId, "comments"), {
      authorId: authUserId,
      text,
      parentId,
      createdAt: serverTimestamp(),
    });
    setReplyDrafts((prev) => ({ ...prev, [parentId]: "" }));
    setOpenReplyFor(null);
  };

  const authorName = project?.autorData?.user ?? project?.autorId ?? "";
  const authorImage = project?.autorData?.image;

  if (status === "loading" || !project || !authReady) {
    return (
      <main className="w-[996px] mx-auto px-4 py-8 text-gray-300">Cargando…</main>
    );
  }

  return (
    <main className="w-[996px] px-4 py-6">
      {/* IMAGEN PRINCIPAL */}
      <section className="relative aspect-video w-full rounded-xl overflow-hidden ring-1 ring-white/10 bg-[#0f1419]">
        <img
          src={project.image}
          alt={project.titulo}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
      </section>

      {/* INFO (título, descripción, métricas y autor) */}
      <section className="mt-6 bg-[#1E232A] rounded-xl p-6 ring-1 ring-white/10">
        <h1 className="text-white text-2xl font-semibold">{project.titulo}</h1>
        <p className="text-gray-300 mt-2">{project.descripcion}</p>

        <div className="mt-4 flex items-center justify-between text-gray-400">
          {/* Métricas */}
          <div className="flex items-center gap-5 text-sm">
            {/* Code metric (</>) */}
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 6.75L21 12l-3.75 5.25M6.75 17.25L3 12l3.75-5.25M14.25 6.75l-4.5 10.5"
                />
              </svg>
              {project.metrics.code}
            </span>

            {/* Comments metric (en vivo) */}
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M18 10c0 3.866-3.582 7-8 7a8.84 8.84 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
              </svg>
              {comments.length}
            </span>

            {/* Share metric */}
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47z" />
              </svg>
              {project.metrics.share}
            </span>
          </div>

          {/* Autor */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 ring-1 ring-white/10">
              {authorImage ? (
                <img
                  src={authorImage}
                  alt={authorName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <svg
                  className="w-8 h-8 text-gray-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              )}
            </div>
            <span className="text-white text-sm">@{authorName}</span>
          </div>
        </div>
      </section>

      {/* CÓDIGO */}
      {project.code && (
        <section className="mt-6 bg-[#1E232A] rounded-xl p-6 ring-1 ring-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">Código:</h3>
            <button
              onClick={() => navigator.clipboard.writeText(project.code!)}
              className="text-xs px-2 py-1 rounded bg-[#2A2F36] hover:bg-[#343A42] text-gray-200"
            >
              Copiar
            </button>
          </div>

          <div className="rounded-lg overflow-hidden ring-1 ring-white/10">
            <SyntaxHighlighter
              language={project.language ?? "tsx"}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                background: "#151A20",
                fontSize: 13,
              }}
              wrapLongLines
              showLineNumbers
            >
              {project.code ?? ""}
            </SyntaxHighlighter>
          </div>

          {project.language && (
            <span className="mt-2 inline-block text-xs text-gray-400">
              {project.language}
            </span>
          )}
        </section>
      )}

      {/* COMENTARIOS */}
      <section className="mt-6 bg-[#2A2F36] rounded-xl p-6 ring-1 ring-white/10">
        <h3 className="text-white font-semibold mb-4">Comentarios</h3>

        <textarea
          value={rootText}
          onChange={(e) => setRootText(e.target.value)}
          placeholder="Escribe un comentario…"
          className="w-full bg-[#141A1F] text-gray-200 rounded-lg border border-white/10 p-3 outline-none"
          rows={3}
        />
        <div className="mt-2">
          <button
            onClick={handleAddRoot}
            disabled={!authUserId}
            className="px-3 py-1 rounded bg-[#2E7D32] hover:bg-[#2c6f2d] text-white disabled:opacity-50"
          >
            Comentar
          </button>
        </div>

        {/* Lista de comentarios */}
        <div className="mt-6 space-y-4">
          {rootComments.map((c) => {
            const replies = repliesByParent.get(c.id) ?? [];
            const u = commentUsers.get(c.authorId);
            const name = u?.user || c.authorId;
            const img = u?.image;
            const replyValue = replyDrafts[c.id] ?? "";

            return (
              <article key={c.id} className="bg-[#1E232A] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                    {img ? (
                      <img src={img} alt={name} className="w-full h-full object-cover" />
                    ) : null}
                  </div>

                  <div className="flex-1">
                    <header className="text-sm text-gray-300 mb-1">@{name}</header>
                    <p className="text-gray-200 whitespace-pre-wrap">{c.text}</p>

                    <button
                      className="mt-2 text-xs text-gray-400 hover:text-gray-200"
                      onClick={() =>
                        setOpenReplyFor((prev) => (prev === c.id ? null : c.id))
                      }
                    >
                      Responder
                    </button>

                    {openReplyFor === c.id && (
                      <div className="mt-3">
                        <textarea
                          value={replyValue}
                          onChange={(e) => setReplyDraft(c.id, e.target.value)}
                          placeholder="Escribe una respuesta…"
                          className="w-full bg-[#10151B] text-gray-200 rounded-lg border border-white/10 p-3 outline-none"
                          rows={2}
                        />
                        <div className="mt-2">
                          <button
                            onClick={() => handleAddReply(c.id)}
                            disabled={!authUserId}
                            className="px-3 py-1 rounded bg-[#2E7D32] hover:bg-[#2c6f2d] text-white disabled:opacity-50"
                          >
                            Responder
                          </button>
                        </div>
                      </div>
                    )}

                    {replies.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {replies.map((r) => {
                          const ur = commentUsers.get(r.authorId);
                          const rName = ur?.user || r.authorId;
                          const rImg = ur?.image;
                          return (
                            <div key={r.id} className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700">
                                {rImg ? (
                                  <img
                                    src={rImg}
                                    alt={rName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : null}
                              </div>
                              <div className="flex-1">
                                <header className="text-xs text-gray-400 mb-1">
                                  @{rName}
                                </header>
                                <p className="text-gray-200 whitespace-pre-wrap">
                                  {r.text}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default ProjectDetail;
