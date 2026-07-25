
import amqplib from 'amqplib';

let channel: any = null;


async function getChannel() {
  if (channel) return channel;
  const connection = await amqplib.connect(
  process.env.RABBITMQ_URL || 'amqp://guest:guest@dev_rabbitmq:5672'
);
  channel = await connection.createChannel();

  await channel.assertQueue('submissions', { 
    durable: true  
  });
  
  return channel;
}


export async function addToQueue(submission: {
  submissionId: string;
  code: string;
  languageId: number;
  problemId: string;
  contestId?: string;
  timeLimit: number;
  memoryLimit: number;
  testCases: { input: string; expectedOutput: string }[];
}) {
  const ch = await getChannel();
  ch.sendToQueue(
    'submissions',
    Buffer.from(JSON.stringify(submission)),
    { persistent: true }  
  );
  console.log(`📬 Added submission ${submission.submissionId} to queue`);
}

export async function processQueue(
  handler: (submission: any) => Promise<void>
) {
  const ch = await getChannel();
    //3 at time
  ch.prefetch(3);
  
  ch.consume('submissions', async (msg: any) => {
    if (!msg) return;
    
    const submission = JSON.parse(msg.content.toString());
    console.log(`🔨 Processing submission ${submission.submissionId}`);
    
    try {
      await handler(submission);
      ch.ack(msg);  
      console.log(`✅ Finished submission ${submission.submissionId}`);
    } catch (error) {
      console.error(`❌ Failed:`, error);
      ch.nack(msg, false, true);  // ❌ Failed! Put back in queue for retry
    }
  });
  
  console.log('🚀 Worker is waiting for submissions...');
}