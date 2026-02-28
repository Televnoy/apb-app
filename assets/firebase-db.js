import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// Логин: проверка ключа
export const loginWithKey = async (name, key) => {
    try {
        const docRef = doc(db, "judges", key);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // Если ключ есть, возвращаем данные судьи
            return { success: true, user: docSnap.data() };
        } else {
            // Если ключа нет - создаем нового судью
            await setDoc(docRef, { displayName: name, lastLogin: new Date().toISOString() });
            return { success: true, user: { displayName: name } };
        }
    } catch (e) {
        console.error(e);
        return { success: false, error: "Ошибка подключения к БД" };
    }
};

// Обновление профиля (чтобы менять настройки)
export const updateProfile = async (key, name) => {
    try {
        const docRef = doc(db, "judges", key);
        await setDoc(docRef, { displayName: name, lastLogin: new Date().toISOString() }, { merge: true });
        return { success: true };
    } catch (e) {
        return { success: false };
    }
};

// Сохранение оценки
export const saveEvaluation = async (evaluationData) => {
    try {
        await addDoc(collection(db, "evaluations"), {
            ...evaluationData,
            timestamp: new Date().toISOString()
        });
        return { success: true };
    } catch (e) {
        return { success: false };
    }
};
