import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    addDoc, 
    updateDoc,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Вставьте сюда ваши данные из консоли Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDSrWUBYjqYpA6CgG-tn0B2E_h9HN2wgZ8",
  authDomain: "apbapp-862a2.firebaseapp.com",
  projectId: "apbapp-862a2",
  storageBucket: "apbapp-862a2.firebasestorage.app",
  messagingSenderId: "909828829367",
  appId: "1:909828829367:web:64aa085f80b59b95d5dd32",
  measurementId: "G-026CEF7FKV"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = "apb-app-v1"; // ID вашего приложения для путей в Firestore

/**
 * Генерация простого ID устройства (для привязки)
 */
const getDeviceId = () => {
    let id = localStorage.getItem('apb_device_id');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('apb_device_id', id);
    }
    return id;
};

/**
 * Вход и проверка ключа/устройства
 */
export const loginWithKey = async (username, accessKey) => {
    try {
        await signInAnonymously(auth);
        const deviceId = getDeviceId();
        
        // Путь согласно правилам: /artifacts/{appId}/public/data/users
        const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', username);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error("Пользователь не найден в базе");
        }

        const userData = userSnap.data();

        // Проверка ключа
        if (userData.accessKey !== accessKey) {
            throw new Error("Неверный ключ доступа");
        }

        // Привязка устройства (если еще не привязано)
        if (!userData.deviceId) {
            await updateDoc(userRef, { deviceId: deviceId });
            return { success: true, user: username, message: "Устройство успешно привязано" };
        } 
        
        // Проверка соответствия устройства
        if (userData.deviceId !== deviceId) {
            throw new Error("Доступ запрещен: этот аккаунт привязан к другому устройству");
        }

        return { success: true, user: username };
    } catch (error) {
        console.error("Ошибка входа:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Сохранение оценки участника
 */
export const saveEvaluation = async (username, evaluationData) => {
    try {
        if (!auth.currentUser) throw new Error("Необходима авторизация");

        const evalRef = collection(db, 'artifacts', appId, 'public', 'data', 'evaluations');
        
        const dataToSave = {
            judge: username,
            nomination: evaluationData.nomination,
            participantId: evaluationData.participantId,
            score: evaluationData.score,
            comment: evaluationData.comment,
            photoBase64: evaluationData.photo, // Фото передаем как строку base64
            timestamp: new Date().toISOString()
        };

        await addDoc(evalRef, dataToSave);
        return { success: true };
    } catch (error) {
        console.error("Ошибка сохранения:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Смена логина/пароля в профиле
 */
export const updateProfile = async (oldUsername, newUsername, newKey) => {
    try {
        const oldUserRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', oldUsername);
        const userSnap = await getDoc(oldUserRef);
        
        if (!userSnap.exists()) throw new Error("Ошибка доступа");
        
        const currentData = userSnap.data();
        const newUserRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', newUsername);
        
        // Создаем новую запись, копируем deviceId
        await setDoc(newUserRef, {
            accessKey: newKey,
            deviceId: currentData.deviceId
        });
        
        // Здесь можно удалить старую запись, если логин изменился
        // await deleteDoc(oldUserRef); 

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
