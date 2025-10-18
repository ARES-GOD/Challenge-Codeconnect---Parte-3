// src/pages/share.tsx (Publicar.tsx)
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppSelector } from "../hooks/hooks";
import { selectAuthUser } from "../redux/authSlice";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    limit as qLimit,
} from "firebase/firestore";
import { db } from "../config/firebase";

// ✅ usa el selector global de tags para pintarlos como botones
import { selectAllTags } from "../redux/projectsSlice";
import { useNavigate } from "react-router-dom";

type FormVals = {
    titulo: string;
    descripcion: string;
    tagInput?: string;
    imageUrl: string;
};

// 🧩 Resuelve el ID REAL del doc en /users (por email; fallback al uid)
async function resolveUserDocId(uid: string, email?: string | null) {
    if (email) {
        const usersCol = collection(db, "users");
        const q = query(usersCol, where("email", "==", email), qLimit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
            return snap.docs[0].id; // <- ESTE es el ID correcto de tu /users
        }
    }
    // fallback: usa el UID si no encontró por email
    return uid;
}

export default function Publicar() {
    const user = useAppSelector(selectAuthUser); // { uid, email, displayName }
    const allTags = useAppSelector(selectAllTags) ?? []; // <- tags “fijos” globales

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormVals>({
        defaultValues: { titulo: "", descripcion: "", tagInput: "", imageUrl: "" },
        mode: "onSubmit",
    });

    const [tags, setTags] = useState<string[]>([]);
    const tagInput = watch("tagInput");
    const imageUrl = watch("imageUrl");
    const navigate = useNavigate();

    // Normaliza para evitar duplicados por mayúsculas/minúsculas
    const norm = (s: string) => s.trim();
    const hasTag = (t: string) =>
        tags.map((x) => x.toLowerCase()).includes(t.toLowerCase());

    const toggleTag = (t: string) => {
        const val = norm(t);
        setTags((prev) =>
            prev.map((x) => x.toLowerCase()).includes(val.toLowerCase())
                ? prev.filter((x) => x.toLowerCase() !== val.toLowerCase())
                : [...prev, val]
        );
    };

    const addTagFromInput = () => {
        const v = norm(tagInput || "");
        if (!v) return;
        if (!hasTag(v)) setTags((t) => [...t, v]);
        setValue("tagInput", "");
    };

    const preview = useMemo(() => {
        const url = (imageUrl || "").trim();
        if (!url) return null;
        return /^https?:\/\/.+/i.test(url) ? url : null;
    }, [imageUrl]);

    const onSubmit = async (data: FormVals) => {
        if (!user?.uid) {
            alert("Debes iniciar sesión para publicar.");
            return;
        }
        const img = (data.imageUrl || "").trim();
        if (!img) {
            alert("La URL de imagen es obligatoria.");
            return;
        }

        // 1) Resolver el ID del documento /users correcto (no el uid)
        const userDocId = await resolveUserDocId(user.uid, user.email);

        // (Opcional) verifica que exista el doc
        const userRef = doc(db, "users", userDocId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            console.warn("No existe doc en /users para", userDocId, "se usará de todos modos.");
        }

        // 2) Crear el proyecto con la MISMA estructura de los antiguos
        const payload = {
            autor: userRef, // referencia a /users/{<docId real>}
            titulo: data.titulo.trim(),
            descripcion: data.descripcion.trim(),
            image: img,
            code: null as string | null,
            language: null as string | null,
            metrics: { code: 0, comments: 0, share: 0 },
            tags: tags, // los activos (de globales + los que el user agregó)
        };

        await addDoc(collection(db, "projects"), payload);
        navigate("/feed");
    };

    // Para mostrar “customTags” (los que no vienen de allTags) como verdes
    const customTags = tags.filter(
        (t) => !allTags.map((x) => x.toLowerCase()).includes(t.toLowerCase())
    );

    return (
        <main className="w-[996px] h-[677px] px-6 py-8 bg-[#1E232A]">
            <div className="grid grid-cols-12 gap-6">
                {/* Izquierda: Preview + URL */}
                <div className="col-span-12 lg:col-span-6">

                    <div className="rounded-xl ring-1 ring-white/10 bg-[#1E232A] p-3">
                        <div className="aspect-video rounded-lg overflow-hidden bg-black/30 grid place-items-center text-gray-500 text-sm">
                            {preview ? (
                                <img src={preview} alt="preview" className="w-full h-full object-cover" />
                            ) : (
                                <>Tu imagen se previsualizará aquí.</>
                            )}
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm text-gray-300 mb-1">URL de imagen</label>
                            <input
                                {...register("imageUrl", {
                                    required: "Requerido",
                                    pattern: { value: /^https?:\/\/.+/i, message: "Debe ser una URL http(s) válida" },
                                })}
                                className="w-full bg-[#30363A] border border-[#4A545B] text-white rounded-md px-3 py-2 focus:border-[#81FE88] outline-none"
                                placeholder="https://mi-imagen.com/portada.png"
                            />
                            {errors.imageUrl && (
                                <p className="text-xs text-red-400 mt-1">{errors.imageUrl.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Derecha: Formulario */}
                <form className="col-span-12 lg:col-span-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    <h2 className="text-white text-xl font-semibold mb-4">Nuevo proyecto</h2>
                    <div>
                        <label className="text-sm text-gray-300">Nombre del proyecto</label>
                        <input
                            {...register("titulo", { required: "Requerido" })}
                            className="w-full bg-[#30363A] border border-[#4A545B] text-white rounded-md px-3 py-2 focus:border-[#81FE88] outline-none"
                            placeholder="React zero to hero"
                        />
                        {errors.titulo && <p className="text-xs text-red-400 mt-1">{errors.titulo.message}</p>}
                    </div>

                    <div>
                        <label className="text-sm text-gray-300">Descripción</label>
                        <textarea
                            rows={6}
                            {...register("descripcion", {
                                required: "Requerido",
                                minLength: { value: 10, message: "Mínimo 10 caracteres" },
                            })}
                            className="w-full bg-[#30363A] border border-[#4A545B] text-white rounded-md px-3 py-2 focus:border-[#81FE88] outline-none"
                            placeholder="Resumen del proyecto..."
                        />
                        {errors.descripcion && (
                            <p className="text-xs text-red-400 mt-1">{errors.descripcion.message}</p>
                        )}
                    </div>

                    {/* Entrada + botones de tags */}
                    <div>
                        <label className="text-sm text-gray-300">Tags</label>

                        {/* Input para agregar nuevos tags */}
                        <div className="flex gap-2 mb-2">
                            <input
                                {...register("tagInput")}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTagFromInput())}
                                className="flex-1 bg-[#30363A] border border-[#4A545B] text-white rounded-md px-3 py-2 focus:border-[#81FE88] outline-none"
                                placeholder="React, Front-end…"
                            />
                            <button
                                type="button"
                                onClick={addTagFromInput}
                                className="px-3 py-2 rounded-md bg-[#2A2F36] text-gray-200 hover:bg-[#343A42]"
                            >
                                Añadir
                            </button>
                        </div>

                        {/* Botonera: todos los globales en gris; si están activos, se ponen verdes con “×” */}
                        <div className="flex flex-wrap gap-2">
                            {allTags.map((t) => {
                                const active = hasTag(t);
                                return (
                                    <button
                                        key={`global-${t}`}
                                        type="button"
                                        onClick={() => toggleTag(t)}
                                        className={[
                                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                                            active
                                                ? "bg-[#81FE88] text-black hover:opacity-90"
                                                : "bg-[#2A2F36] text-gray-200 hover:bg-[#343A42]",
                                        ].join(" ")}
                                    >
                                        {t}
                                        {active && <span className="text-black">×</span>}
                                    </button>
                                );
                            })}

                            {/* Tags personalizados (no están en allTags) siempre verdes con “×” */}
                            {customTags.map((t) => (
                                <button
                                    key={`custom-${t}`}
                                    type="button"
                                    onClick={() => toggleTag(t)}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-[#81FE88] text-black hover:opacity-90"
                                >
                                    {t}
                                    <span>×</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Botonera inferior ocupando todo el ancho de la columna (50/50) */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => history.back()}
                            className="w-full px-4 py-3 rounded-md bg-[#2A2F36] text-gray-200 hover:bg-[#343A42]"
                        >
                            Desechar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full px-4 py-3 rounded-md bg-[#81FE88] text-black font-semibold hover:bg-[#6be678] disabled:opacity-60"
                        >
                            {isSubmitting ? "Publicando…" : "Publicar"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
