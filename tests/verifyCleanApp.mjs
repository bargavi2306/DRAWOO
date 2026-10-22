import { createServer } from 'vite';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';

async function runTest() {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  try {
    const mod = await server.ssrLoadModule('/src/App.jsx');
    const App = mod.default;

    const html = renderToString(React.createElement(App));

    // Confirm real game home elements are present
    assert.ok(html.includes('Create Private Room'), 'Home has Create Private Room button');
    assert.ok(html.includes('Join a Room'), 'Home has Join a Room button');
    assert.ok(html.includes('Same People'), 'Home has mascot slogan banner');

    // Confirm development preview toolbar is REMOVED
    assert.ok(!html.includes('UI-02: Home Flow'), 'Phase tag removed');
    assert.ok(!html.includes('UI-01 Component Library'), 'Phase tag removed');
    assert.ok(!html.includes('Workbench'), 'Workbench button removed from game');
    assert.ok(!html.includes('Edge Cases'), 'Edge Cases button removed from game');
    assert.ok(!html.includes('Viewport:'), 'Viewport selector label removed');
    assert.ok(!html.includes('320px'), 'Artificial 320px selector button removed');
    assert.ok(!html.includes('768px'), 'Artificial 768px selector button removed');
    assert.ok(!html.includes('1024px'), 'Artificial 1024px selector button removed');
    assert.ok(!html.includes('topHeader'), 'topHeader toolbar removed from game container');

    console.log('✔ App renders directly into clean Home screen without preview toolbar or artificial viewport frame!');
  } finally {
    await server.close();
  }
}

runTest().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
