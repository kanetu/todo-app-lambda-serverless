import type {
  Context,
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyEventV2,
  Handler,
} from "aws-lambda";
import { createDbInstance } from "../utils/db";
import { query } from "../utils/query";
import { createTodoSchema } from "../schemas";
import { dbSecret } from "../const";

export const createTodo: Handler = async (
  _event: APIGatewayProxyEventV2,
  _context: Context
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log("start::createTodo");

  if (!_event.body){
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Bad Request",
      }),
    };
  }
  const db = await createDbInstance(dbSecret);

  let result;

  try {

    const validateResult = createTodoSchema.validate(JSON.parse(_event.body))
    console.log("akne->", validateResult)
    if(validateResult.error){
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Bad Request",
          error: `${validateResult.error.name} ${validateResult.error.message}`
        }),
      };
    }

    const { name, status, priority, due_date } = validateResult.value

    await db.connect();
    result = await db.query(query.insertTodo, [name, status, due_date, priority]);
  } catch (err) {
    console.log("error: ", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
      })
    };
  } finally {
    await db.end();
    console.log("end::createTodo--");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Create todo successfully",
      data: result?.rows
    }),
  };
};
