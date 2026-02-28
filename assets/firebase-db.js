import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, doc, getDoc, updateDoc, collection, addDoc, 
    arrayUnion, serverTimestamp, setDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

const clean = (str) => (str ? String(str).trim() : "");

// 1. Логин
export const loginWithKey = async (inputKey, deviceId) => {
    const key = clean(inputKey);
    try {
        const docRef = doc(db, "judges", key);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return { success: false, error: "Ключ не найден" };
        await updateDoc(docRef, { devices: arrayUnion(deviceId), lastLogin: serverTimestamp() });
        return { success: true, user: snap.data() };
    } catch (e) { return { success: false, error: e.message }; }
};

// 2. Обновление только имени и города
export const updateJudgeProfile = async (key, name, city) => {
    try {
        const docRef = doc(db, "judges", clean(key));
        await updateDoc(docRef, { 
            displayName: name || "Без имени", 
            city: city || "Не указан",
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
};

// 3. Смена Ключа (перенос документа)
export const changeJudgeKey = async (oldKey, newKey, name, city) => {
    try {
        const oldRef = doc(db, "judges", clean(oldKey));
        const newRef = doc(db, "judges", clean(newKey));
        const snap = await getDoc(oldRef);
        
        if (!snap.exists()) return { success: false, error: "Старый профиль не найден" };
        
        const newData = {
            ...snap.data(),
            displayName: name,
            city: city,
            updatedAt: serverTimestamp()
        };

        await setDoc(newRef, newData); // Создаем новый документ
        await deleteDoc(oldRef);      // Удаляем старый
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
};

// 4. Сохранение оценки
export const saveEvaluation = async (data) => {
    try {
        await addDoc(collection(db, "evaluations"), { ...data, createdAt: serverTimestamp() });
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
};
