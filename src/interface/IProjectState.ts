import {type EntityState } from "@reduxjs/toolkit";
import { DocumentSnapshot } from "firebase/firestore";
import type { IProject } from "./IProject";
import type { IFilters } from "./IFilters";

export interface IProjectState extends EntityState<IProject, string> {
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    selectedProjectId: string | null;
    filters: IFilters,
    pagination: {
        currentPage: number,
        itemsPerPage: number,
        totalItems: number,
    }
    lastVisible: DocumentSnapshot | null;
}