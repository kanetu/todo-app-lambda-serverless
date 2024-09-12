import { createTodo } from "../todo/createTodo"

import { Client } from "pg";
import { createDbInstance } from "../utils/db";
import { context } from "../utils/testData";
import { createTodoSchema } from "../schemas";

jest.mock("../utils/db", () => ({
    createDbInstance: jest.fn()
}));
jest.mock("../schemas", () => ({
    createTodoSchema: {
        validate: jest.fn()
    }
}));


describe("createTodo", () => {

    it("createTodo response with 1 record and statusCode is 200", async () => {
        const event = {
            body: JSON.stringify({
                name: "Soccer",
                due_date: "10/10/2024",
                status: "pending",
                priority: "low"
            })
        }
        const createDbInstanceMockedValue = (dbSecretName: string) => {
            return Promise.resolve({
                connect: () => {
                    console.log("Database connected!");
                },
                end: () => {
                    console.log("Database disconnected!");
                },
                query: () => {
                    return {
                        rows: [
                            { id: "1", name: "Soccer", status: "pending", priority: "low", due_date: "1728493200000" },
                        ]
                    }
                }
            } as unknown as Client)
        }

        (createDbInstance as jest.Mock).mockImplementation(createDbInstanceMockedValue);

        (createTodoSchema.validate as unknown as jest.Mock).mockImplementation(() => ({
            value: {
                name: "Soccer",
                due_date: "10/10/2024",
                status: "pending",
                priority: "low"
            }
        }))

        const result = await createTodo(event, context, () => { })

        const parsedBody = JSON.parse(result.body);
        const resultData = parsedBody.data
        console.log("result->>", result);

        expect(resultData).toHaveLength(1);
        expect(result.statusCode).toBe(200);
    })

    it("createTodo throw error when querying database", async () => {
        const event = {
            body: JSON.stringify({
                name: "Soccer",
                due_date: "10/10/2024",
                status: "pending",
                priority: "low"
            })
        }
        const createDbInstanceMockedValue = (dbSecretName: string) => {
            return Promise.resolve({
                connect: () => {
                    console.log("Database connected!");
                },
                end: () => {
                    console.log("Database disconnected!");
                },
                query: () => {
                    throw Error("Unexpected error")
                }
            } as unknown as Client)
        }

        (createDbInstance as jest.Mock).mockImplementation(createDbInstanceMockedValue);

        (createTodoSchema.validate as unknown as jest.Mock).mockImplementation(() => ({
            value: {
                name: "Soccer",
                due_date: "10/10/2024",
                status: "pending",
                priority: "low"
            }
        }))
        const result = await createTodo(event, context, () => { })

        const parsedBody = JSON.parse(result.body);
        const resultMessage = parsedBody.message

        expect(resultMessage).toBe("Internal Server Error");
        expect(result.statusCode).toBe(500);
    })

    it("createTodo validate payload parameter fail with statusCode 400", async () => {
        const event = {
            body: JSON.stringify({
                name: "Soccer",
                due_date: "10/10/2024",
                status: "pending",
                priority: "low"
            })
        }
        const createDbInstanceMockedValue = (dbSecretName: string) => {
            return Promise.resolve({
                connect: () => {
                    console.log("Database connected!");
                },
                end: () => {
                    console.log("Database disconnected!");
                },
                query: () => {}
            } as unknown as Client)
        }

        (createDbInstance as jest.Mock).mockImplementation(createDbInstanceMockedValue);

        (createTodoSchema.validate as unknown as jest.Mock).mockImplementation(() => ({
            error: {
                name: "[Validate Error]",
                message: "Validate message"
            }
        }))
        const result = await createTodo(event, context, () => { })

        const parsedBody = JSON.parse(result.body);
        const resultMessage = parsedBody.message
        const resultError = parsedBody.error

        expect(resultMessage).toBe("Bad Request")
        expect(resultError).toBe("[Validate Error] Validate message")
        expect(result.statusCode).toBe(400);
    })

    it("createTodo will fail with statusCode 400 when there is no body include in the request", async () => {
        const event = {}
        const createDbInstanceMockedValue = (dbSecretName: string) => {
            return Promise.resolve({
                connect: () => {
                    console.log("Database connected!");
                },
                end: () => {
                    console.log("Database disconnected!");
                },
                query: () => {}
            } as unknown as Client)
        }

        (createDbInstance as jest.Mock).mockImplementation(createDbInstanceMockedValue);

        const result = await createTodo(event, context, () => { })

        const parsedBody = JSON.parse(result.body);
        const resultMessage = parsedBody.message

        expect(resultMessage).toBe("Bad Request")
        expect(result.statusCode).toBe(400);
    })
})