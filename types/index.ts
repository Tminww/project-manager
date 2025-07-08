export type ProjectStatus =
  | "Не начат"
  | "В работе"
  | "На паузе"
  | "Завершен"
  | "Отменен";
export type ProjectUrgency = "Низкая" | "Средняя" | "Высокая";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  editing?: boolean;
  editText?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "В работе" | "Завершен" | "Отложен";
  urgency: "Высокая" | "Средняя" | "Низкая";
  deadline: string;
  tasks: Task[];
}
