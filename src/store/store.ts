import { configureStore } from "@reduxjs/toolkit";
import authReducer from '../redux/authSlice';
import projectsReducer from '../redux/projectsSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        projects: projectsReducer,
    }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch