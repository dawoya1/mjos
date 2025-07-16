const { MJOS } = require('./dist/index.js');

async function testMJOS() {
  console.log('Testing Enhanced MJOS...');

  const mjos = new MJOS();
  console.log('Version:', mjos.getVersion());
  console.log('Status before start:', mjos.getStatus());

  await mjos.start();
  console.log('Status after start:', mjos.getStatus());

  // Test context manager
  const contextManager = mjos.getContextManager();
  contextManager.set('test-key', 'test-value');
  console.log('Context test:', contextManager.get('test-key'));

  await mjos.stop();
  console.log('Status after stop:', mjos.getStatus());

  console.log('Enhanced MJOS test completed successfully!');
}

testMJOS().catch(console.error);
