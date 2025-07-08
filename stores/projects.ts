import { defineStore } from "pinia";
import { ref, watch, computed } from "vue";
import type { Project } from "~/types";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  editing?: boolean;
  editText?: string;
}

export const useProjectStore = defineStore("projects", () => {
  const projects = ref<Project[]>([]);
  const selectedProject = ref<Project | null>(null);
  const lastSaved = ref<Date | null>(null);
  const isInitialized = ref(false);
  const config = useRuntimeConfig();
  const baseURL = config.public.baseURL || "http://localhost:3000";

  // Вычисляемое свойство для форматирования времени последнего сохранения
  const lastSavedFormatted = computed(() => {
    if (!lastSaved.value) return "Нет данных";
    const now = new Date();
    const saved = new Date(lastSaved.value);
    const diff = now.getTime() - saved.getTime();

    // Если меньше минуты
    if (diff < 60000) {
      return "Только что";
    }

    // Если меньше часа
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} ${minutes === 1 ? "минуту" : "минут"} назад`;
    }

    // Если меньше суток
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} ${hours === 1 ? "час" : "часов"} назад`;
    }

    // Иначе возвращаем дату
    return saved.toLocaleString("ru-RU");
  });

  // Загрузка данных при инициализации
  async function loadProjects(): Promise<Project[]> {
    try {
      const response = await fetch(`${baseURL}/api/projects`);
      if (!response.ok) {
        throw new Error(`Ошибка при загрузке проектов: ${response.statusText}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.warn("Получены некорректные данные, использую пустой массив");
        projects.value = [];
      } else {
        projects.value = data;
      }
      isInitialized.value = true;
      return projects.value;
    } catch (error) {
      console.error("Ошибка при загрузке проектов:", error);
      projects.value = [];
      isInitialized.value = true;
      return [];
    }
  }

  // Сохранение данных после каждого изменения
  async function saveProjects() {
    // Не сохраняем, если еще не загрузили начальные данные
    if (!isInitialized.value) {
      return;
    }

    try {
      console.log(
        "Сохраняемые проекты:",
        JSON.stringify(projects.value, null, 2)
      );
      const response = await fetch(`${baseURL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projects.value),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Ответ сервера:", {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        });
        throw new Error(
          `Ошибка при сохранении проектов: ${response.statusText}`
        );
      }
      lastSaved.value = new Date();
    } catch (error) {
      console.error("Ошибка при сохранении проектов:", error);
      throw error;
    }
  }

  // Автоматическое сохранение при изменении данных
  watch(
    projects,
    async (newProjects, oldProjects) => {
      // Пропускаем первое срабатывание при инициализации
      if (!isInitialized.value) {
        return;
      }
      // Проверяем, действительно ли изменились проекты
      if (JSON.stringify(newProjects) !== JSON.stringify(oldProjects)) {
        try {
          await saveProjects();
        } catch (error) {
          console.error("Ошибка при автоматическом сохранении:", error);
        }
      }
    },
    { deep: true }
  );

  // Управление проектами
  async function createProject(project: Omit<Project, "id" | "tasks">) {
    const newProject: Project = {
      ...project,
      id: crypto.randomUUID(),
      tasks: [],
    };
    projects.value.push(newProject);
    await saveProjects();
    return newProject;
  }

  async function updateProject(project: Project) {
    try {
      const response = await fetch(`${baseURL}/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(project),
      });
      if (!response.ok) {
        throw new Error("Ошибка при обновлении проекта");
      }
      const index = projects.value.findIndex((p) => p.id === project.id);
      if (index !== -1) {
        projects.value[index] = project;
      }
      await saveProjects();
    } catch (error) {
      console.error("Ошибка при обновлении проекта:", error);
      throw error;
    }
  }

  async function deleteProject(id: string) {
    try {
      const response = await fetch(`${baseURL}/api/projects/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Ошибка при удалении проекта");
      }
      projects.value = projects.value.filter((p) => p.id !== id);
      await saveProjects();
    } catch (error) {
      console.error("Ошибка при удалении проекта:", error);
      throw error;
    }
  }

  function setProjects(newProjects: Project[]) {
    projects.value = newProjects;
  }

  // Управление задачами
  async function addTodo(projectId: string, title: string) {
    const project = projects.value.find((p) => p.id === projectId);
    if (project) {
      project.tasks.unshift({
        id: crypto.randomUUID(),
        title,
        completed: false,
      });
      await updateProject(project);
    }
  }

  async function updateTodo(
    projectId: string,
    taskId: string,
    updates: Partial<Todo>
  ) {
    const project = projects.value.find((p) => p.id === projectId);
    if (project) {
      const task = project.tasks.find((t) => t.id === taskId);
      if (task) {
        Object.assign(task, updates);
        await updateProject(project);
      }
    }
  }

  async function deleteTodo(projectId: string, taskId: string) {
    const project = projects.value.find((p) => p.id === projectId);
    if (project) {
      project.tasks = project.tasks.filter((t) => t.id !== taskId);
      await updateProject(project);
    }
  }

  async function toggleTask(projectId: string, taskId: string) {
    const project = projects.value.find((p) => p.id === projectId);
    if (project) {
      const task = project.tasks.find((t) => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
        await updateProject(project);
      }
    }
  }

  async function importProjects(data: Project[]) {
    projects.value = data;
    await saveProjects();
  }

  return {
    projects,
    selectedProject,
    lastSaved,
    lastSavedFormatted,
    isInitialized,
    loadProjects,
    saveProjects,
    createProject,
    updateProject,
    deleteProject,
    setProjects,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTask,
    importProjects,
  };
});
