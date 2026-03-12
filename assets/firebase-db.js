import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, doc, getDoc, updateDoc, collection, addDoc, 
    arrayUnion, serverTimestamp, setDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// AWS SDK доступен глобально после подключения скрипта в index.html

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

const clean = (str) => (str ? String(str).trim() : "");

// ========== Существующие функции ==========

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
            fcmToken: null, // также очищаем токен
            resetAt: serverTimestamp() 
        });

        return { success: true };
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

export const saveEvaluation = async (data) => {
    try {
        await addDoc(collection(db, "evaluations"), { ...data, createdAt: serverTimestamp() });
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
};

export const uploadPhoto = async (base64Data, fileName) => {
    // ... (без изменений, как в вашем файле)
    // (я опускаю тело для краткости, но оставьте его как есть)
};

// ========== НОВЫЕ ФУНКЦИИ ДЛЯ FCM TOKEN ==========

/**
 * Сохранить или обновить FCM токен для данного ключа
 */
export const saveFcmToken = async (accessKey, fcmToken) => {
    try {
        const docRef = doc(db, "judges", clean(accessKey));
        await updateDoc(docRef, { 
            fcmToken: fcmToken,
            fcmTokenUpdatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

/**
 * Получить FCM токен для ключа (если нужно)
 */
export const getFcmToken = async (accessKey) => {
    try {
        const docRef = doc(db, "judges", clean(accessKey));
        const snap = await getDoc(docRef);
        if (!snap.exists()) return { success: false, error: "Ключ не найден" };
        return { success: true, fcmToken: snap.data().fcmToken || null };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

/**
 * Удалить FCM токен (при выходе или сбросе устройства)
 */
export const removeFcmToken = async (accessKey) => {
    try {
        const docRef = doc(db, "judges", clean(accessKey));
        await updateDoc(docRef, { 
            fcmToken: null,
            fcmTokenUpdatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

/**
 * Отвязка устройства от ключа (при выходе) – теперь также удаляет FCM токен
 */
export const unbindDevice = async (accessKey, deviceId) => {
    try {
        const docRef = doc(db, "judges", clean(accessKey));
        const snap = await getDoc(docRef);
        if (!snap.exists()) return { success: false, error: "Ключ не найден" };
        
        const data = snap.data();
        if (data.deviceId && data.deviceId === deviceId) {
            await updateDoc(docRef, { 
                deviceId: null,
                fcmToken: null, // очищаем токен
                unboundAt: serverTimestamp() 
            });
            return { success: true };
        } else {
            return { success: false, error: "Устройство не привязано или не совпадает" };
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
};

// Экспортируем в window для доступа из React
window.uploadPhoto = uploadPhoto;
window.saveEvaluation = saveEvaluation;
window.unbindDevice = unbindDevice;
window.saveFcmToken = saveFcmToken;
window.getFcmToken = getFcmToken;
window.removeFcmToken = removeFcmToken;
