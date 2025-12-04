import {
  createTaskService,
  getAllTasksService,
  getTaskByIdService,
  updateTaskService,
  deleteTaskService,
  getTasksByStaffService
} from "./housekeeping.service.js";

export const createTask = async (req, res) => {
  try {
    const task = await createTaskService(req.body);

    res.status(201).json({
      success: true,
      message: "Task created successfully!",
      data: task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTasks = async (req, res) => {
  try {
    const tasks = await getAllTasksService();
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await getTaskByIdService(req.params.id);

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const updated = await updateTaskService(req.params.id, req.body);

    res.json({
      success: true,
      message: "Task updated successfully!",
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    await deleteTaskService(req.params.id);

    res.json({
      success: true,
      message: "Task deleted successfully!"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTasksByStaff = async (req, res) => {
  try {
    const tasks = await getTasksByStaffService(req.params.staffId);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
