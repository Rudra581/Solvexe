const { prismaClient } = require('./dist/index.js');
async function test() {
  try {
    const users = await prismaClient.user.findMany();
    console.log('Success!', users);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prismaClient.$disconnect();
  }
}
test();
