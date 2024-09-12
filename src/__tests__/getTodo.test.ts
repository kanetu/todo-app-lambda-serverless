import {getTodo} from "../todo/getTodo"

import { Client } from "pg";
import { createDbInstance } from "../utils/db";
import { context } from "../utils/testData";

jest.mock("../utils/db", () => ( {
    createDbInstance: jest.fn() 
}));

describe("getTodo",() => {

    it("getTodo response with 2 records and statusCode is 200", async () => {
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
                    return {
                        rows: [
                            {id: "1", name: "Swimming"},
                            {id: "2", name: "Football"},
                        ]
                    }
                }
            } as unknown as Client)
        }
        
        (createDbInstance as jest.Mock).mockImplementation(createDbInstanceMockedValue);
    
        const result = await getTodo(event, context, () => {})

        const parsedBody = JSON.parse(result.body);
        const resultData = parsedBody.data
    
        expect(resultData).toHaveLength(2);
        expect(result.statusCode).toBe(200);
    })
    it("getTodo throw error when querying database", async () => {
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
    
        const result = await getTodo(event, context, () => {})

        const parsedBody = JSON.parse(result.body);
        const resultMessage = parsedBody.message
    
        expect(resultMessage).toBe("Internal Server Error");
        expect(result.statusCode).toBe(500);
    })

    it("getTodo without :id", async () => {
        const event = {
        }
        const result = await getTodo(event, context, () => {})

        const parsedBody = JSON.parse(result.body);
        const resultMessage = parsedBody.message
    
        expect(resultMessage).toBe("Bad Request");
        expect(result.statusCode).toBe(400);
    })
    
})