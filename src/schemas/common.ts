import Joi from "joi";

const common = {
  name: Joi.string().min(3).max(50),
  status: Joi.string().valid("pending", "in-process", "on-hold", "done"),
  priority: Joi.string().valid("low", "normal", "high", "urgent"),
};

export default common;
