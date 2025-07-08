import { writeFileSync } from "fs";
import { resolve } from "path";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { file, data } = body;

    if (!file || !data) {
      throw new Error("Не указан файл или данные");
    }

    const filePath = resolve(process.cwd(), file);
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

    return { success: true };
  } catch (error: any) {
    console.error("Ошибка при сохранении файла:", error);
    return { success: false, error: error.message || "Неизвестная ошибка" };
  }
});
