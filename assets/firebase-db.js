import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// Логин: проверка ключа и привязка устройства
export const loginWithKey = async (inputKey, deviceId) => {
    try {
        const docRef = doc(db, "judges", inputKey);
        const snap = await getDoc(docRef);

        if (!snap.exists()) return { success: false, error: "Ключ не найден" };

        const userData = snap.data();
        
        // Привязываем устройство к судье, если его там еще нет
        await updateDoc(docRef, {
            devices: arrayUnion(deviceId)
        });

        return { success: true, user: userData };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

// Обновление профиля судьи
export const updateJudgeProfile = async (key, name, city) => {
    try {
        const docRef = doc(db, "judges", key);
        await updateDoc(docRef, { displayName: name, city: city });
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
