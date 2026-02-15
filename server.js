require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = "AIzaSyA7Iqhx7MsFklrTkmsaLcFXrWQNAHBd2Co"; 

app.post('/api/get-task', async (req, res) => {
    const { language, step } = req.body;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    try {
        console.log(`📡 ГЕНЕРАЦИЯ: ${language}, Шаг ${step}/8...`);

        // Настраиваем темы в зависимости от шага
        let difficultyInstruction = "";
        if (step <= 2) {
            difficultyInstruction = "Тема: Основы. Создание простых переменных (строки или числа) или вывод текста.";
        } else if (step <= 4) {
            difficultyInstruction = "Тема: Операции. Сложение чисел, конкатенация строк или простые математические действия.";
        } else if (step <= 6) {
            difficultyInstruction = "Тема: Условия (if/else). Проверка простого условия (например, больше или меньше).";
        } else {
            difficultyInstruction = "Тема: Списки или циклы. Создание массива/списка или очень простой цикл.";
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Ты — методист по программированию. Создай задачу на языке ${language}.
                        Пользователь находится на шаге ${step} из 8.
                        
                        ${difficultyInstruction}
                        
                        ТРЕБОВАНИЯ:
                        1. Задание должно быть коротким и понятным.
                        2. Решение (expectedSolution) должно быть СТРОГО одной строкой кода.
                        3. Описание должно быть игровым (например, "Помоги роботу", "Собери ресурсы").
                        
                        Формат ответа — СТРОГО JSON:
                        {
                          "title": "Заголовок с эмодзи",
                          "description": "Что именно сделать?",
                          "expectedSolution": "код_одной_строкой",
                          "hint": "подсказка по синтаксису"
                        }`
                    }]
                }],
                generationConfig: {
                    temperature: 0.8, // Чуть снизил, чтобы задачи были более адекватными учебному плану
                    topP: 0.9
                }
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        let aiText = data.candidates[0].content.parts[0].text;
        const cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
        const taskData = JSON.parse(cleanJson);
        
        console.log(`✅ Задача создана для шага ${step}:`, taskData.title);
        res.json(taskData);

    } catch (error) {
        console.log("🛑 ОШИБКА:", error.message);
        
        // Резервная логика (Fallback) с учетом шагов
        const fallback = step <= 4 
            ? { title: "🤖 Переменные", description: "Создай переменную x равную 5", expectedSolution: language === 'python' ? "x = 5" : "let x = 5", hint: "Используй =" }
            : { title: "🔥 Логика", description: "Напиши условие if x > 0:", expectedSolution: "if x > 0:", hint: "Не забудь двоеточие" };
            
        res.json(fallback);
    }
});

app.listen(5000, () => console.log("🚀 ИИ-Генератор (8 уровней) запущен на порту 5000"));