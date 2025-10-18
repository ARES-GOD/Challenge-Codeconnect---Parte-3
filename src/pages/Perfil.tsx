import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit as qLimit,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import type { IProject } from "../interface/IProject";
import ProjectCard from "../components/ProjectCard";
import ProfileTabs from "../components/ProfileTabs";

type PublicUserDoc = {
    user?: string;     // handle (@user)
    name?: string;     // nombre visible
    image?: string;
    descripcion?: string;
    email?: string;
};


const Perfil: React.FC = () => {
    // Auth + userDoc
    const [uid, setUid] = useState<string | null>(null);
    const [userDocId, setUserDocId] = useState<string | null>(null);
    const [userDoc, setUserDoc] = useState<PublicUserDoc | null>(null);
    const [ready, setReady] = useState(false);

    // UI state Tabs
    const [activeTab, setActiveTab] = useState<"mine" | "approved" | "shared">("mine");

    // Projects
    const [projects, setProjects] = useState<IProject[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);

    // 1) Resolver usuario autenticado y su doc en /users (por email si existe)
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                setUid(null);
                setUserDocId(null);
                setUserDoc(null);
                setReady(true);
                return;
            }

            setUid(u.uid);

            // Busca el doc en /users por email (es tu estructura actual)
            let docId: string | null = null;
            if (u.email) {
                const usersCol = collection(db, "users");
                const qUsers = query(usersCol, where("email", "==", u.email), qLimit(1));
                const snap = await getDocs(qUsers);
                if (!snap.empty) {
                    docId = snap.docs[0].id;
                }
            }
            // fallback: si no encontró por email, usa el uid como ID (por si tienes ese esquema)
            docId = docId ?? u.uid;

            setUserDocId(docId);

            // Cargar datos del doc
            try {
                const ref = doc(db, "users", docId);
                const d = await getDoc(ref);
                if (d.exists()) {
                    setUserDoc(d.data() as PublicUserDoc);
                } else {
                    // fallback simple si no hay doc
                    setUserDoc({
                        user: u.displayName || u.email || "user",
                        name: u.displayName || "Usuario",
                    });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setReady(true);
            }
        });

        return unsub;
    }, []);

    // 2) Traer proyectos del usuario (soporta autor como Reference o autorId string)
    useEffect(() => {
        if (!userDocId) return;

        setLoadingProjects(true);

        const projectsCol = collection(db, "projects");
        const refFilter = query(projectsCol, where("autor", "==", doc(db, "users", userDocId)));
        const idFilter = query(projectsCol, where("autorId", "==", userDocId));

        // Escuchamos AMBAS consultas y hacemos merge por id de doc
        const offA = onSnapshot(
            refFilter,
            (snap) => {
                const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
                setProjects((prev) => {
                    const m = new Map<string, any>();
                    [...prev, ...rows].forEach((r) => m.set(r.id, r));
                    return Array.from(m.values()).map((p: any) => ({
                        ...p,
                        // normalizamos información del autor para ProjectCard
                        autorId: userDocId,
                        autorData: {
                            id: userDocId,
                            user: userDoc?.user ?? userDocId,
                            image: userDoc?.image,
                        },
                    })) as IProject[];
                });
                setLoadingProjects(false);
            },
            (err) => {
                console.error("refFilter error:", err);
                setLoadingProjects(false);
            }
        );

        const offB = onSnapshot(
            idFilter,
            (snap) => {
                const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
                setProjects((prev) => {
                    const m = new Map<string, any>();
                    [...prev, ...rows].forEach((r) => m.set(r.id, r));
                    return Array.from(m.values()).map((p: any) => ({
                        ...p,
                        autorId: userDocId,
                        autorData: {
                            id: userDocId,
                            user: userDoc?.user ?? userDocId,
                            image: userDoc?.image,
                        },
                    })) as IProject[];
                });
                setLoadingProjects(false);
            },
            (err) => {
                console.error("idFilter error:", err);
                setLoadingProjects(false);
            }
        );

        return () => {
            offA();
            offB();
        };
    }, [userDocId, userDoc?.user, userDoc?.image]);

    // Derivados para UI
    const displayName =
        userDoc?.name?.trim() ||
        userDoc?.user?.trim() ||
        "Usuario";

    const handle = userDoc?.user ? `@${userDoc.user}` : "@user";

    const avatar = userDoc?.image || "";

    const projectsCount = useMemo(() => projects.length, [projects.length]);

    if (!ready) {
        return (
            <main className="max-w-[996px] mx-auto px-4 py-12 text-gray-300">
                Cargando perfil…
            </main>
        );
    }

    return (
        <main className="max-w-[996px] px-4 pb-16">
            {/* Header */}
            <section className="pt-6">
                <div className="flex items-start gap-6">
                    {/* Avatar grande (como Figma) */}
                    <div className="shrink-0 w-40 h-40 rounded-full overflow-hidden ring-1 ring-white/10">
                        {avatar ? (
                            <img
                                src={avatar}
                                alt={displayName}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-700" />
                        )}
                    </div>

                    {/* Texto */}
                    <div className="flex-1 min-w-0">
                        {/* fila: @handle + seguir (arriba a la izquierda) */}
                        <div className="flex items-center gap-3">
                            <span className="text-gray-300">{handle}</span>
                            <button
                                className="px-3 py-1 rounded-md text-sm bg-[#2A2F36] hover:bg-[#343A42] text-gray-100"
                                type="button"
                            >
                                Seguir
                            </button>
                        </div>

                        {/* Nombre (debajo, grande y verde como Figma) */}
                        <h1 className="mt-2 text-2xl font-semibold text-[#b5ffcc]">
                            {displayName}
                        </h1>

                        {/* Bio */}
                        <p className="mt-3 text-gray-300 leading-relaxed">
                            {userDoc?.descripcion ||
                                "Añade una breve bio para tu perfil."}
                        </p>

                        {/* Métricas pequeñas */}
                        <div className="mt-4 flex items-center gap-6 text-gray-300">
                            <span className="text-sm">
                                <span className="text-white">{projectsCount}</span>{" "}
                                Proyectos
                            </span>
                            <span className="text-sm">
                                <span className="text-white">25</span>{" "}
                                Conexiones
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tabs */}
            <ProfileTabs
                active={activeTab}
                onChange={setActiveTab}
                className="mt-6"
            />

            {/* Contenido por tab */}
            <section className="mt-6">
                {activeTab === "mine" && (
                    <>
                        {loadingProjects ? (
                            <div className="py-16 text-center text-gray-400">
                                Cargando proyectos…
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="py-16 text-center text-gray-400">
                                Aún no tienes proyectos publicados.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {projects.map((p) => (
                                    <ProjectCard key={p.id} project={p} />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === "approved" && (
                    <div className="py-16 text-center text-gray-400">
                        Próximamente: proyectos aprobados.
                    </div>
                )}

                {activeTab === "shared" && (
                    <div className="py-16 text-center text-gray-400">
                        Próximamente: proyectos compartidos.
                    </div>
                )}
            </section>
        </main>
    );
};

export default Perfil;
