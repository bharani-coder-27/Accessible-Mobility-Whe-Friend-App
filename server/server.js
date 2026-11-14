import "dotenv/config";
import server from './src/index.js';

const PORT = process.env.PORT || 5000;

server.listen(PORT);
