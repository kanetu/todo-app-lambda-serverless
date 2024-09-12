import { getTodos } from "../todo/getTodos"

import { Client } from "pg";
import { createDbInstance } from "../utils/db";
import { context } from "../utils/testData";

jest.mock("../utils/db", () => ({
    createDbInstance: jest.fn()
}));

const event = {}
describe("getTodos", () => {

    it("getTodos response with 3 records and statusCode is 200", async () => {

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
                            { id: "1", name: "Swimming" },
                            { id: "2", name: "Football" },
                            { id: "3", name: "Criket" },
                        ]
                    }
                }
            } as unknown as Client)
        }

        (createDbInstance as jest.Mock).mockImplementation(createDbInstanceMockedValue);

        const result = await getTodos(event, context, () => { })

        const parsedBody = JSON.parse(result.body);
        const resultData = parsedBody.data

        expect(resultData).toHaveLength(3);
        expect(result.statusCode).toBe(200);
    })

    it("getTodos throw error when querying database", async () => {

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

        const result = await getTodos(event, context, () => { })

        const parsedBody = JSON.parse(result.body);
        const resultMessage = parsedBody.message

        expect(resultMessage).toBe("Internal Server Error");
        expect(result.statusCode).toBe(500);
    })

})