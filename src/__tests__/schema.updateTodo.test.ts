
import updateTodoSchema from "../schemas/updateTodoSchema";

test('updateTodoSchema should validate name and priority fields', () => {
    const data = {
        name: "Test name",
        status: "pending",
        priority: "normal"
    };
    const validation = updateTodoSchema.validate(data);
    expect(validation.error).toBeUndefined();
});