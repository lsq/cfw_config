import { webcrack } from '@bratel/webcrack';
import fs from 'fs';

const code = fs.readFileSync('./iframe.js', 'utf8');
const result = await webcrack(code);
await result.save('./');
