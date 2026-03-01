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

// 1. Логин с жесткой привязкой к устройству
export const loginWithKey = async (inputKey, deviceId) => {
    const key = clean(inputKey);
    try {
        const docRef = doc(db, "judges", key);
        const snap = await getDoc(docRef);
        
        if (!snap.exists()) {
            return { success: false, error: "Ключ не найден в базе" };
        }

        const userData = snap.data();

        // ПРОВЕРКА ПРИВЯЗКИ
        if (userData.deviceId && userData.deviceId !== deviceId) {
            // Если в базе уже есть ID и он не совпадает с текущим
            return { 
                success: false, 
                error: "Этот ключ уже привязан к другому устройству!" 
            };
        }

        // Если привязки еще нет, создаем её
        if (!userData.deviceId) {
            await updateDoc(docRef, { 
                deviceId: deviceId,
                firstLogin: serverTimestamp() 
            });
        }

        // Обновляем время последнего входа
        await updateDoc(docRef, { lastLogin: serverTimestamp() });
        
        return { success: true, user: userData };
    } catch (e) { 
        return { success: false, error: "Ошибка базы: " + e.message }; 
    }
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

// 3// 3. Смена Ключа с защитой от дубликатов и проверкой длины
export const changeJudgeKey = async (oldKey, newKey, name, city) => {
    try {
        const cleanedOld = clean(oldKey);
        const cleanedNew = clean(newKey);

        // 1. Проверка на минимальную длину (например, 6 символов)
        if (cleanedNew.length < 6) {
            return { 
                success: false, 
                error: "Ключ слишком короткий! Придумайте пароль от 6 символов и более." 
            };
        }

        // 2. Если пользователь ввел тот же самый ключ, просто обновляем имя/город
        if (cleanedOld === cleanedNew) {
            return await updateJudgeProfile(cleanedOld, name, city);
        }

        const oldRef = doc(db, "judges", cleanedOld);
        const newRef = doc(db, "judges", cleanedNew);

        // 3. ПРОВЕРКА: не занят ли новый ключ другим судьей
        const targetSnap = await getDoc(newRef);
        if (targetSnap.exists()) {
            return { 
                success: false, 
                error: "Этот ключ уже используется! Пожалуйста, создайте уникальный пароль." 
            };
        }

        // 4. Получаем данные старого профиля
        const snap = await getDoc(oldRef);
        if (!snap.exists()) return { success: false, error: "Старый профиль не найден" };
        
        const oldData = snap.data();

        // Формируем новые данные, сохраняя deviceId (привязку к устройству)
        const newData = {
            ...oldData,
            displayName: name || oldData.displayName,
            city: city || oldData.city,
            updatedAt: serverTimestamp()
        };

        // 5. Создаем новую запись и удаляем старую
        await setDoc(newRef, newData); 
        await deleteDoc(oldRef);      
        
        return { success: true };
    } catch (e) { 
        return { success: false, error: "Ошибка при смене ключа: " + e.message }; 
    }
};

