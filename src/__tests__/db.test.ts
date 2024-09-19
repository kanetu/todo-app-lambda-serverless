import { Client } from "pg";
import { createDbInstance, connectDatabase } from "../utils/db";
import { getSecret } from "../utils/getSecret";

jest.mock("../utils/getSecret", () => ({
    getSecret: jest.fn()
}));

describe("db", () => {

    it("create database instance successfully", async () => {
        (getSecret as jest.Mock).mockReturnValue({
            SecretString: '{"db_host":"localhost","db_user":"postgres","db_password":"postgresPassword","db_database":"postgres","db_port":5432}'
        })
        const result = await createDbInstance("secretKeyName")
        expect(result).toBeInstanceOf(Client)
    })

    it("create database instance unsuccessfully", async () => {
        (getSecret as jest.Mock).mockReturnValue(null)
        try {
            await createDbInstance("secretKeyName")
        } catch (err) {
            expect((err as Error).name).toBe("Error")
            expect((err as Error).message).toBe("There is no secret string")
        }
    })

    it("connect funciton has been called", async () => {
        const client = ({
            connect: jest.fn()
        }) as unknown as Client;
        await connectDatabase(client)
        expect(client.connect).toHaveBeenCalled()
    })
})