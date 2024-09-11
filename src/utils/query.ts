export const query = {
  getTodo: "SELECT * FROM todo WHERE id = $1",
  getAllTodo: "SELECT * FROM todo",
  insertTodo:
    "INSERT INTO todo(name, status, due_date, priority) VALUES($1, $2, $3, $4) RETURNING *",
  deleteTodo: "DELETE FROM todo WHERE id = $1",
  updateTodo: "UPDATE todo SET name = $1, status = $2, priority = $3 WHERE id = $4 RETURNING *"
};
