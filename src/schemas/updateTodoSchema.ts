import * as Joi from "joi";
import common from "./common";

const updateTodoSchema = Joi.object({
  name: common.name.required(),
  status: common.status.required(),
  priority: common.priority.required(),
});

export default updateTodoSchema;
