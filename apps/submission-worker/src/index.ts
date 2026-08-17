import amqp from "amqplib";
import { prismaClient } from '../../../packages/db/src';
import axios from 'axios';
import { JUDGE0_URI } from "../../web/app/lib/config";
async function startWorker() {
    try {

        const connection = await amqp.connect("amqp://dev_rabbitmq:5672");
        const channel = await connection.createChannel();
        console.log("------channel created-----")
        const queueName = "submissions";
        await channel.assertQueue(queueName, { durable: true });
        console.log(`[*] Waiting for messages in ${queueName}...`);

        channel.consume(queueName, async (message) => {
            if (message !== null) {
                try {

                    const submission = JSON.parse(message.content.toString());
                    console.log(`[+] Processing submission: ${submission.submissionId}`);
                    const response = await axios.post(
                        `${JUDGE0_URI}/submissions/batch?base64_encoded=true`,
                        {
                            submissions: submission.testCases.map((tc: any) => ({
                                source_code: Buffer.from(submission.code).toString('base64'),
                                language_id: submission.languageId,
                                stdin: Buffer.from(tc.input).toString('base64'),
                                expected_output: Buffer.from(tc.expectedOutput).toString('base64'),
                                cpu_time_limit: submission.timeLimit,
                                memory_limit: submission.memoryLimit,
                                callback_url: `${process.env.JUDGE0_CALLBACK_URL}/submission-callback?secret=${process.env.WEBHOOK_SECRET}&base64_encoded=true`,
                            }))
                        },
                        { headers: { "X-Auth-Token": process.env.JUDGE0_AUTH_TOKEN } }
                    );

                    await prismaClient.testCase.createMany({
                        data: submission.testCases.map((tc: any, index: number) => ({

                            submissionId: submission.submissionId,
                            status: "PENDING",
                            index,
                            input: tc.input,
                            expectedOutput: tc.expectedOutput,
                            judge0TrackingId: response.data[index].token,
                        })),
                    });

                    console.log(`[√] Successfully sent to Judge0`);

                } catch (err) {
                    console.error("[-] Error processing message:", err);
                } finally {
                    channel.ack(message);
                }
            }
        });

    } catch (e) {
        console.error("Fatal worker error:", e);
    }
}

startWorker();