import { doc, setDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Вызови эту функцию в консоли браузера или при загрузке страницы для теста
export const createTestData = async () => {
    try {
        // 1. Создаем судью
        const judgeKey = "TESTKEY123";
        await setDoc(doc(db, "judges", judgeKey), {
            displayName: "Иван Иванов",
            city: "Москва",
            devices: ["test_device_001"],
            updatedAt: new Date().toISOString()
        });
        console.log("Судья создан!");

        // 2. Создаем первую оценку
        await addDoc(collection(db, "evaluations"), {
            accessKey: judgeKey,
            judgeName: "Иван Иванов",
            participantId: "U-001",
            city: "Москва",
            discipline: "Акробатика",
            score: 9.5,
            comment: "Отличное выступление!",
            photoUrls: [],
            timestamp: new Date().toISOString()
        });
        console.log("Оценка создана!");
    } catch (e) {
        console.error("Ошибка при создании тестовых данных:", e);
    }
};
