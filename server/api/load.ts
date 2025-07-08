import { readFileSync } from "fs";
import { resolve } from "path";

export default defineEventHandler((event) => {
  try {
    const query = getQuery(event);
    const fileName = query.file as string;

    if (!fileName) {
      throw new Error("Имя файла не указано");
    }

    const filePath = resolve(process.cwd(), fileName);
    const fileContent = readFileSync(filePath, "utf-8");

    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Ошибка при чтении файла:", error);
    return [];
  }
});
