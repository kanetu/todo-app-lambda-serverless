
import createTodoSchema from "../schemas/createTodoSchema";

test('createTodoSchema should validate name and priority fields', () => {
    const data = {
        name: "Test name",
        status: "pending",
        priority: "normal",
        due_date: "10/10/2024"
    };
    const validation = createTodoSchema.validate(data);
    expect(validation.error).toBeUndefined();
});