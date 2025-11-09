import { AlertLevel } from '@/lib/alertLevel';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'NONE';

export interface Alert {
    level: AlertLevel;
    remark: string;
}

export type ModalType = 'add-student' | 'add-teacher' | 'add-class' | 'add-department' | 'add-course' | 'bulk-add';

interface ModalState {
    // type: ModalType | null;
    body: React.ReactNode;
    header: string;
}

interface AppState {
    user: {
        loggedIn: boolean;
        teacher: boolean;
        student: boolean;
        role: UserRole;
        username: string;
        displayName: string;
        location: string;
        website: string;
        id: string;
        bio: string;    
        profilePicture: string;
    };
    alerts: Alert[];
    modal: ModalState;
    refetch: boolean;
}

const initialState: AppState = {
    user: {
        loggedIn: false,
        teacher: false,
        student: false,
        displayName: '',
        role: 'NONE',
        username: '',
        id: '',
        profilePicture: '',
        location: '',
        website: '',
        bio: '',
    },
    alerts: [],
    modal: {
        body: null,
        header: '',
    },
    refetch: false,
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setAuth: (state, action) => {
            state.user = {
                ...state.user,
                ...action.payload
            }
        },
        addAlert: (state, action) => {
            state.alerts.push({
                level: action.payload.level,
                remark: action.payload.remark
            })
        },
        removeAlert: (state, action) => {
            const id = action.payload;

            state.alerts = state.alerts.filter((_, index) => index !== id);
        },
        openModal: (state, action: PayloadAction<ModalState>) => {
            state.modal = action.payload;
        },
        closeModal: (state) => {
            state.modal = initialState.modal;
        },
        setRefetch: (state, action) => {
            state.refetch = action.payload;
        },
        setTeacher: (state, action) => {
            state.user = {
                ...state.user,
                teacher: action.payload,
                student: !action.payload
            }
        }
    },
});

export const { setAuth, addAlert, removeAlert, openModal, closeModal, setRefetch, setTeacher } = appSlice.actions;
export default appSlice.reducer;