import * as Joi from "joi";
import common from "./common";

const createTodoSchema = Joi.object({
  name: common.name.required(),
  due_date: Joi.string().required(),
  status: common.status.required(),
  priority: common.priority.required(),
});

export default createTodoSchema;
