import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, doc, getDoc, updateDoc, collection, addDoc, 
    arrayUnion, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDSrWUBYjqYpA6CgG-tn0B2E_h9HN2wgZ8", // ⚠️ ВАЖНО: см. примечание ниже
    authDomain: "apbapp-862a2.firebaseapp.com",
    projectId: "apbapp-862a2",
    storageBucket: "apbapp-862a2.firebasestorage.app",
    messagingSenderId: "909828829367",
    appId: "1:909828829367:web:64aa085f80b59b95d5dd32",
    measurementId: "G-026CEF7FKV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const clean = (str) => (str ? String(str).trim() : "");

// 1. Логин: проверка ключа и привязка устройства
export const loginWithKey = async (inputKey, deviceId) => {
    const key = clean(inputKey);
    if (!key) return { success: false, error: "Ключ не может быть пустым" };

    try {
        const docRef = doc(db, "judges", key);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
            return { success: false, error: "Ключ не найден" };
        }

        await updateDoc(docRef, {
            devices: arrayUnion(deviceId),
            lastLogin: serverTimestamp() // Добавили метку времени последнего входа
        });

        return { success: true, user: snap.data() };
    } catch (e) {
        console.error("Ошибка при логине:", e);
        return { success: false, error: "Ошибка соединения с сервером" };
    }
};

// 2. Обновление профиля с проверкой существования
export const updateJudgeProfile = async (inputKey, name, city) => {
    const key = clean(inputKey);
    try {
        const docRef = doc(db, "judges", key);
        
        // Проверяем, существует ли судья перед обновлением
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
            return { success: false, error: "Судья не найден" };
        }

        await updateDoc(docRef, { 
            displayName: name || "Без имени", 
            city: city || "Не указан",
            updatedAt: serverTimestamp()
        });
        
        return { success: true };
    } catch (e) {
        console.error("Ошибка обновления профиля:", e);
        return { success: false, error: "Не удалось обновить профиль" };
    }
};

// 3. Сохранение оценки с серверным временем
export const saveEvaluation = async (evaluationData) => {
    if (!evaluationData || typeof evaluationData !== 'object') {
        return { success: false, error: "Нет данных для сохранения" };
    }

    try {
        await addDoc(collection(db, "evaluations"), {
            ...evaluationData,
            createdAt: serverTimestamp() // Используем серверное время Firestore
        });
        return { success: true };
    } catch (e) {
        console.error("Ошибка сохранения оценки:", e);
        return { success: false, error: "Ошибка отправки на сервер" };
    }
};
