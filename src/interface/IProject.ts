import type { IUserState } from "./IUserState";

export interface IProject {
    id: string;
    titulo: string;
    descripcion: string;
    image: string;
    autorId: string; // Ahora será el ID del usuario, no la referencia completa
    autorData?: IUserState; // Datos del usuario (opcional para cuando los necesites)
    comments: string[];
    tags: string[];
    metrics: {
        code: number;
        comments: number;
        share: number;
    };
    //NUEVO
    code?: string;
    language?: string;
}