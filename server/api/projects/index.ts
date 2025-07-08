import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import type { Project } from "~/types";

// Используем директорию .data в корне проекта
const DATA_DIR = resolve(process.cwd(), ".data");
const STORAGE_FILE = resolve(DATA_DIR, "projects.json");

// Создаем директорию и файл при запуске сервера, а не при каждом запросе
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}
if (!existsSync(STORAGE_FILE)) {
  writeFileSync(STORAGE_FILE, JSON.stringify([], null, 2), "utf-8");
}

export default defineEventHandler(async (event) => {
  const method = event.method;

  try {
    if (method === "GET") {
      // Чтение проектов
      try {
        const data = readFileSync(STORAGE_FILE, "utf-8");
        const projects = JSON.parse(data);
        // Проверяем формат данных, но не перезаписываем файл при ошибке
        if (!Array.isArray(projects)) {
          console.error("Некорректный формат данных в файле");
          return [];
        }
        return projects;
      } catch (parseError) {
        console.error("Ошибка парсинга JSON:", parseError);
        return [];
      }
    } else if (method === "POST") {
      // Сохранение проектов
      const body = await readBody<Project[]>(event);
      if (!Array.isArray(body)) {
        throw createError({
          statusCode: 400,
          message: "Неверный формат данных. Ожидается массив проектов.",
        });
      }

      // Проверяем, что все проекты имеют необходимые поля
      const isValidProject = (project: any): project is Project => {
        return (
          typeof project === "object" &&
          project !== null &&
          typeof project.id === "string" &&
          typeof project.name === "string" &&
          typeof project.description === "string" &&
          typeof project.status === "string" &&
          typeof project.urgency === "string" &&
          typeof project.deadline === "string" &&
          Array.isArray(project.tasks) &&
          project.tasks.every(
            (task: any) =>
              typeof task === "object" &&
              task !== null &&
              typeof task.id === "string" &&
              typeof task.title === "string" &&
              typeof task.completed === "boolean"
          )
        );
      };

      if (!body.every(isValidProject)) {
        throw createError({
          statusCode: 400,
          message: "Некоторые проекты имеют неверный формат",
        });
      }

      try {
        // Читаем текущие данные перед сохранением
        const currentData = readFileSync(STORAGE_FILE, "utf-8");
        let currentProjects = [];
        try {
          currentProjects = JSON.parse(currentData);
        } catch (parseError) {
          console.warn("Не удалось прочитать текущие данные, создаем новые");
        }

        // Сохраняем только если есть изменения
        if (JSON.stringify(currentProjects) !== JSON.stringify(body)) {
          writeFileSync(STORAGE_FILE, JSON.stringify(body, null, 2), "utf-8");
        }
        return { success: true };
      } catch (writeError) {
        console.error("Ошибка записи в файл:", writeError);
        throw createError({
          statusCode: 500,
          message: "Ошибка при сохранении данных",
        });
      }
    }
  } catch (error: any) {
    console.error("Ошибка обработки запроса:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Внутренняя ошибка сервера",
    });
  }
});
