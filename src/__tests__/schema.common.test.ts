
import * as Joi from "joi";
import common from "../schemas/common";

test('common should validate name and priority fields', () => {
    const data = {
        name: "Test name",
        status: "pending",
        priority: "normal"
    };
    const validation = Joi.object(common).validate(data);
    expect(validation.error).toBeUndefined();
});