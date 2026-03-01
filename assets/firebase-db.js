import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, doc, getDoc, updateDoc, collection, addDoc, 
    arrayUnion, serverTimestamp, setDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getStorage, ref, uploadString, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDSrWUBYjqYpA6CgG-tn0B2E_h9HN2wgZ8",
    authDomain: "apbapp-862a2.firebaseapp.com",
    projectId: "apbapp-862a2",
    storageBucket: "apbapp-862a2.firebasestorage.app",
    messagingSenderId: "909828829367",
    appId: "1:909828829367:web:64aa085f80b59b95d5dd32",
    measurementId: "G-026CEF7FKV"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const clean = (str) => (str ? String(str).trim() : "");

/**
 * Вход по ключу с привязкой к ID устройства
 */
export const loginWithKey = async (inputKey, deviceId) => {
    const key = clean(inputKey);
    try {
        const docRef = doc(db, "judges", key);
        const snap = await getDoc(docRef);
        
        if (!snap.exists()) return { success: false, error: "Ключ не найден" };
        
        const data = snap.data();
        
        // Проверка привязки устройства
        if (data.deviceId && data.deviceId !== deviceId) {
            return { success: false, error: "Ключ активирован на другом устройстве" };
        }

        const updateData = { lastLogin: serverTimestamp() };
        if (!data.deviceId) {
            updateData.deviceId = deviceId; // Первая привязка
        }

        await updateDoc(docRef, updateData);
        return { success: true, user: { ...data, key } }; 
    } catch (e) { return { success: false, error: e.message }; }
};

/**
 * Сброс привязки устройства (Мастер-пароль)
 */
export const resetDeviceBinding = async (key, adminPassword) => {
    const MASTER_ADMIN_PASSWORD = "ADMIN_777_RESET"; 

    if (adminPassword !== MASTER_ADMIN_PASSWORD) {
        return { success: false, error: "Неверный административный пароль" };
    }

    try {
        const docRef = doc(db, "judges", clean(key));
        const snap = await getDoc(docRef);
        
        if (!snap.exists()) return { success: false, error: "Судья не найден" };

        await updateDoc(docRef, { 
            deviceId: null, 
            resetAt: serverTimestamp() 
        });

        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
};

/**
 * Обновление профиля
 */
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

/**
 * Смена ключа (пароля) с проверкой уникальности
 */
export const changeJudgeKey = async (oldKey, newKey, name, city) => {
    try {
        const cleanNewKey = clean(newKey);
        if (cleanNewKey.length < 6) {
            return { success: false, error: "Пароль должен быть не менее 6 символов" };
        }

        const oldRef = doc(db, "judges", clean(oldKey));
        const newRef = doc(db, "judges", cleanNewKey);
        
        const checkSnap = await getDoc(newRef);
        if (checkSnap.exists()) {
            return { success: false, error: "Этот пароль уже занят другим судьей" };
        }

        const snap = await getDoc(oldRef);
        if (!snap.exists()) return { success: false, error: "Профиль не найден" };

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

/**
 * Сохранение отчета (оценки)
 */
export const saveEvaluation = async (data) => {
    try {
        await addDoc(collection(db, "evaluations"), { ...data, createdAt: serverTimestamp() });
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
};

/**
 * Загрузка фото в Firebase Storage и получение URL
 */
export const uploadPhoto = async (base64Data, path) => {
    try {
        const storageRef = ref(storage, path);
        // Загружаем как Data URL (Base64)
        await uploadString(storageRef, base64Data, 'data_url');
        // Возвращаем прямую ссылку на файл
        return await getDownloadURL(storageRef);
    } catch (e) {
        console.error("Ошибка Storage:", e);
        throw e;
    }
};
// В самом конце файла firebase-db.js добавьте:

window.uploadPhoto = uploadPhoto;
window.saveEvaluation = saveEvaluation;
