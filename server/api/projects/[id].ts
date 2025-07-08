import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import type { Project } from "~/types";

// Используем директорию .data в корне проекта
const DATA_DIR = resolve(process.cwd(), ".data");
const STORAGE_FILE = resolve(DATA_DIR, "projects.json");

export default defineEventHandler(async (event) => {
  const method = event.method;
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID проекта не указан",
    });
  }

  // Создаем директорию .data, если она не существует
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  // Создаем файл с пустым массивом, если он не существует
  if (!existsSync(STORAGE_FILE)) {
    writeFileSync(STORAGE_FILE, JSON.stringify([], null, 2));
  }

  try {
    // Читаем текущие проекты
    const data = readFileSync(STORAGE_FILE, "utf-8");
    let projects = JSON.parse(data) as Project[];

    // Проверяем, что projects - это массив
    if (!Array.isArray(projects)) {
      projects = [];
      writeFileSync(STORAGE_FILE, JSON.stringify(projects, null, 2));
    }

    if (method === "PUT") {
      // Обновление проекта
      const updatedProject = await readBody<Project>(event);
      const index = projects.findIndex((p: Project) => p.id === id);

      if (index === -1) {
        throw createError({
          statusCode: 404,
          message: "Проект не найден",
        });
      }

      projects[index] = updatedProject;
      writeFileSync(STORAGE_FILE, JSON.stringify(projects, null, 2));
      return { success: true };
    } else if (method === "DELETE") {
      // Удаление проекта
      const newProjects = projects.filter((p: Project) => p.id !== id);

      if (newProjects.length === projects.length) {
        throw createError({
          statusCode: 404,
          message: "Проект не найден",
        });
      }

      writeFileSync(STORAGE_FILE, JSON.stringify(newProjects, null, 2));
      return { success: true };
    }
  } catch (error: any) {
    // Если ошибка парсинга JSON, создаем новый файл с пустым массивом
    if (error instanceof SyntaxError) {
      writeFileSync(STORAGE_FILE, JSON.stringify([], null, 2));
      throw createError({
        statusCode: 404,
        message: "Проект не найден",
      });
    }

    throw createError({
      statusCode: error.statusCode || 500,
      message: `Ошибка при ${
        method === "PUT" ? "обновлении" : "удалении"
      } проекта: ${error.message}`,
    });
  }
});
