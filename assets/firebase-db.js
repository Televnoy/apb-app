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

export const loginWithKey = async (inputKey, deviceId) => {
    const key = clean(inputKey);
    try {
        const docRef = doc(db, "judges", key);
        const snap = await getDoc(docRef);
        
        if (!snap.exists()) return { success: false, error: "Ключ не найден" };
        
        const data = snap.data();
        
        // --- ПРОВЕРКА ПРИВЯЗКИ УСТРОЙСТВА ---
        // Если в базе уже есть записанный deviceId и он отличается от текущего
        if (data.deviceId && data.deviceId !== deviceId) {
            return { success: false, error: "Ключ активирован на другом устройстве" };
        }

        // Если устройство еще не привязано — привязываем навсегда
        const updateData = { lastLogin: serverTimestamp() };
        if (!data.deviceId) {
            updateData.deviceId = deviceId;
        }

        await updateDoc(docRef, updateData);
        return { success: true, user: data };
    } catch (e) { return { success: false, error: e.message }; }
};

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

export const changeJudgeKey = async (oldKey, newKey, name, city) => {
    try {
        const cleanNewKey = clean(newKey);
        
        // --- ВАЛИДАЦИЯ ДЛИНЫ ПАРОЛЯ ---
        if (cleanNewKey.length < 6) {
            return { success: false, error: "Пароль должен быть не менее 6 символов" };
        }

        const oldRef = doc(db, "judges", clean(oldKey));
        const newRef = doc(db, "judges", cleanNewKey);
        
        // --- ПРОВЕРКА КОЛЛИЗИЙ (УНИКАЛЬНОСТЬ) ---
        const checkSnap = await getDoc(newRef);
        if (checkSnap.exists()) {
            return { success: false, error: "Этот пароль уже занят другим судьей" };
        }

        const snap = await getDoc(oldRef);
        if (!snap.exists()) return { success: false, error: "Профиль не найден" };

        // Переносим данные (включая привязку к девайсу) в новый документ
        const newData = { 
            ...snap.data(), 
            displayName: name, 
            city: city, 
            updatedAt: serverTimestamp() 
        };
        
        await setDoc(newRef, newData);
        await deleteDoc(oldRef);
        
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
};

export const saveEvaluation = async (data) => {
    try {
        await addDoc(collection(db, "evaluations"), { ...data, createdAt: serverTimestamp() });
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
};

// Добавь это в конец firebase-db.js
import { getStorage, ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const storage = getStorage(app);

export const uploadPhoto = async (base64Data, path) => {
    const storageRef = ref(storage, path);
    // Загружаем как Data URL (Base64)
    await uploadString(storageRef, base64Data, 'data_url');
    // Возвращаем ссылку
    return await getDownloadURL(storageRef);
};
