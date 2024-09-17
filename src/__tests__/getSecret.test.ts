import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { getSecret } from "../utils/getSecret";

jest.mock("@aws-sdk/client-secrets-manager", () => ({
    SecretsManagerClient: jest.fn(),
}));


describe("getSecret", () => {
    const originalEnv = process.env

    beforeEach(() => {
        jest.resetModules()
        process.env = { ...originalEnv }
    })

    afterEach(() => {
        process.env = originalEnv
    })

    it("get secret successfully", async () => {
        (SecretsManagerClient as jest.Mock).mockImplementation(() => {
            return {
                send: () => {
                    console.log("Mock !!!!!!!")
                    return {
                        secret: "secret-344"
                    }
                }
            }
        })
        process.env = {
            ...originalEnv,
            IS_OFFLINE: true as unknown as string,
        };
        const result = await getSecret("u24-w4rt-3223")
        expect(result).toEqual({
            secret: "secret-344"
        })
    })


    it("get secret unsuccessfully", async () => {
        process.env = {
            ...originalEnv,
            IS_OFFLINE: true as unknown as string,
        };
        (SecretsManagerClient as jest.Mock).mockImplementation(() => {
            return {
                send: () => {
                    throw Error("Unexpected: Error")
                }
            }
        })

        const result = await getSecret("u24-w4rt-3223")
        expect((result as Error).name).toBe("Error")
        expect((result as Error).message).toBe("Unexpected: Error")
    })

    it("environment variable IS_OFFLINE is false", async () => {
        process.env = {
            ...originalEnv,
            IS_OFFLINE: false as unknown as string,
        };
        (SecretsManagerClient as jest.Mock).mockImplementation(() => {
            return {
                send: () => {
                    throw Error("Unexpected: Error")
                }
            }
        })

        const result = await getSecret("u24-w4rt-3223")
        expect((result as Error).name).toBe("Error")
        expect((result as Error).message).toBe("Unexpected: Error")
    })
})