import { pushNotification } from "../todo/pushNotification"

import { sendSingleNotificationService } from "../utils/firebase";
import { context } from "../utils/testData";

jest.mock("../utils/firebase", () => ({
    sendSingleNotificationService: jest.fn()
}));

describe("pushNotification", () => {
    
    it("push notification successfully", async () => {
        const event = {
            pathParameters: { token: "randomtoken"}
        };

        (sendSingleNotificationService as jest.Mock).mockImplementation(() => {
            return {
                status: "Success",
            }
        })
        const result = await pushNotification(event, context, () => { })

        const parsedBody = JSON.parse(result.body);
        const resultData = parsedBody.data

        expect(resultData).toEqual({
            status: "Success"
        });
        expect(result.statusCode).toBe(200);
    })

    it("push notification unsuccessfully", async () => {
        const event = {
            pathParameters: { token: "randomtoken"}
        };

        (sendSingleNotificationService as jest.Mock).mockImplementation(() => {
            throw Error("Unexpected Error");
        })
        const result = await pushNotification(event, context, () => { })

        const parsedBody = JSON.parse(result.body);
        const message = parsedBody.message
        
        expect(message).toBe("Internal Server Error");
        expect(result.statusCode).toBe(500);
    })

    it("pushNotification without :token", async () => {
        const event = {
            pathParameters: {}
        };

        (sendSingleNotificationService as jest.Mock).mockImplementation(() => {
            return {
                status: "Success",
            }
        })
        const result = await pushNotification(event, context, () => { })

        const parsedBody = JSON.parse(result.body);
        const resultMessage = parsedBody.message

        
        expect(resultMessage).toBe("Bad Request");
        expect(result.statusCode).toBe(400);
    })

})