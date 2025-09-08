export default async function globalTeardown() {
  console.log('Tearing down test environment...');

  // Stop in-memory MongoDB
  const mongod = global.__MONGOD__;
  if (mongod) {
    await mongod.stop();
    console.log('Test MongoDB stopped');
  }

  console.log('Test environment teardown complete');
}
