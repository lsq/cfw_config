import fs from 'node:fs';
import { webcrack } from '@bratel/webcrack';

(async () => {
  const code = fs.readFileSync('./iframe.js', 'utf8');
  const result = await webcrack(code);
  await result.save('./');
})();
