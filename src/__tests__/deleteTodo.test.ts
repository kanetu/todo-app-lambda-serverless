import {deleteTodo} from "../todo/deleteTodo"

import { Client } from "pg";
import { createDbInstance } from "../utils/db";
import { context } from "../utils/testData";

jest.mock("../utils/db", () => ( {
    createDbInstance: jest.fn() 
}));


describe("deleteTodo",() => {

    it("deleteTodo response successful and statusCode is 200", async () => {
        const event = {
            pathParameters: {
                id: 1
            }
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
                }
            } as unknown as Client)
        }
        
        (createDbInstance as jest.Mock).mockImplementation(createDbInstanceMockedValue);
    
        const result = await deleteTodo(event, context, () => {})

        const parsedBody = JSON.parse(result.body);
        const resultMessage = parsedBody.message
        
        expect(resultMessage).toBe("Delete todo successfully");
        expect(result.statusCode).toBe(200);
    })

    it("deleteTodo throw error when querying database", async () => {
        const event = {
            pathParameters: {
                id: 1
            }
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
    
        const result = await deleteTodo(event, context, () => {})

        const parsedBody = JSON.parse(result.body);
        const resultMessage = parsedBody.message
    
        expect(resultMessage).toBe("Internal Server Error");
        expect(result.statusCode).toBe(500);
    })

    it("deleteTodo without :id", async () => {
        const event = {
        }
        const result = await deleteTodo(event, context, () => {})

        const parsedBody = JSON.parse(result.body);
        const resultMessage = parsedBody.message
    
        expect(resultMessage).toBe("Bad Request");
        expect(result.statusCode).toBe(400);
    })
    
})