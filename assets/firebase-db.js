import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDSrWUBYjqYpA6CgG-tn0B2E_h9HN2wgZ8",
    authDomain: "apbapp-862a2.firebaseapp.com",
    projectId: "apbapp-862a2",
    storageBucket: "apbapp-862a2.firebasestorage.app",
    messagingSenderId: "909828829367",
    appId: "1:909828829367:web:64aa085f80b59b95d5dd32",
    measurementId: "G-026CEF7FKV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Вспомогательная функция для очистки ключа
const clean = (str) => (str ? String(str).trim() : "");

// 1. Логин: проверка ключа и привязка устройства
export const loginWithKey = async (inputKey, deviceId) => {
    const key = clean(inputKey);
    if (!key) return { success: false, error: "Ключ не может быть пустым" };

    try {
        const docRef = doc(db, "judges", key);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
            console.warn(`Попытка входа с несуществующим ключом: ${key}`);
            return { success: false, error: "Ключ не найден" };
        }

        // Привязываем устройство
        await updateDoc(docRef, {
            devices: arrayUnion(deviceId)
        });

        return { success: true, user: snap.data() };
    } catch (e) {
        console.error("Ошибка при логине:", e);
        return { success: false, error: "Ошибка соединения с сервером" };
    }
};

// 2. Обновление профиля
export const updateJudgeProfile = async (inputKey, name, city) => {
    const key = clean(inputKey);
    try {
        const docRef = doc(db, "judges", key);
        await updateDoc(docRef, { 
            displayName: name || "Без имени", 
            city: city || "Не указан" 
        });
        return { success: true };
    } catch (e) {
        console.error("Ошибка обновления профиля:", e);
        return { success: false, error: "Не удалось обновить профиль" };
    }
};

// 3. Сохранение оценки (с проверкой данных)
export const saveEvaluation = async (evaluationData) => {
    // Проверка, что evaluationData существует
    if (!evaluationData || typeof evaluationData !== 'object') {
        return { success: false, error: "Нет данных для сохранения" };
    }

    try {
        await addDoc(collection(db, "evaluations"), {
            ...evaluationData,
            createdAt: new Date(), // Используем объект Date для Firestore, он лучше сортируется
            timestamp: new Date().toISOString()
        });
        return { success: true };
    } catch (e) {
        console.error("Ошибка сохранения оценки:", e);
        return { success: false, error: "Ошибка отправки на сервер" };
    }
};
