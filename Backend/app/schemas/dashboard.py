from pydantic import BaseModel


class TaskStatusSummary(BaseModel):
    status: str
    count: int


class TaskPrioritySummary(BaseModel):
    priority: str
    count: int


class ProjectSummary(BaseModel):
    total_projects: int
    active_projects: int
    completed_projects: int


class TaskSummary(BaseModel):
    total_tasks: int
    todo_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    overdue_tasks: int


class DashboardResponse(BaseModel):
    project_summary: ProjectSummary
    task_summary: TaskSummary
    tasks_by_status: list[TaskStatusSummary]
    tasks_by_priority: list[TaskPrioritySummary]