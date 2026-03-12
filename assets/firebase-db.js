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
            // Если deviceId не совпадает, проверим время последнего входа
            const lastLogin = data.lastLogin ? data.lastLogin.toDate() : null;
            const now = new Date();
            // Если последний вход был менее 5 минут назад, разрешаем перепривязку (вероятно, тот же пользователь после сброса)
            if (lastLogin && (now - lastLogin) < 5 * 60 * 1000) {
                // Обновляем deviceId на новый
                await updateDoc(docRef, { 
                    deviceId: deviceId,
                    lastLogin: serverTimestamp(),
                    deviceChangedAt: serverTimestamp()
                });
                return { success: true, user: { ...data, key } };
            } else {
                return { success: false, error: "Ключ активирован на другом устройстве" };
            }
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
 * Загрузка фото в Yandex Object Storage и получение URL
 */
export const uploadPhoto = async (base64Data, fileName) => {
    try {
        console.log('🚀 Начинаем загрузку в Yandex Cloud:', fileName);
        
        if (!window.YANDEX_CLOUD_CONFIG) {
            throw new Error('Отсутствует конфигурация Yandex Cloud. Создайте файл config.js с ключами доступа.');
        }
        
        const s3 = new AWS.S3({
            endpoint: 'https://storage.yandexcloud.net',
            region: 'ru-central1',
            credentials: {
                accessKeyId: window.YANDEX_CLOUD_CONFIG.accessKeyId,
                secretAccessKey: window.YANDEX_CLOUD_CONFIG.secretAccessKey
            },
            s3ForcePathStyle: true,
            signatureVersion: 'v4',
            httpOptions: {
                timeout: 30000,
                connectTimeout: 10000
            }
        });

        const base64Image = base64Data.split(';base64,').pop();
        const binaryString = atob(base64Image);
        const uint8Array = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            uint8Array[i] = binaryString.charCodeAt(i);
        }

        const params = {
            Bucket: 'bucket-apb',
            Key: fileName,
            Body: uint8Array,
            ContentType: 'image/jpeg',
            ACL: 'public-read'
        };

        console.log('📤 Отправляем запрос в Yandex Cloud...');
        const result = await s3.upload(params).promise();
        console.log('✅ Фото успешно загружено, URL:', result.Location);
        return result.Location;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки в Yandex Cloud:', error);
        if (error.code === 'NetworkingError') {
            throw new Error(`Ошибка сети при подключении к Yandex Cloud. Проверьте интернет и CORS. Детали: ${error.message}`);
        } else if (error.code === 'AccessDenied') {
            throw new Error(`Доступ запрещён. Проверьте ключи доступа и права бакета.`);
        } else if (error.message.includes('конфигурация')) {
            throw error;
        } else {
            throw new Error(`Ошибка загрузки фото: ${error.message || 'Неизвестная ошибка'}`);
        }
    }
};

/**
 * Отвязка устройства от ключа (при выходе)
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