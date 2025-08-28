import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import busRoutes from './routes/busRoutes.js';
import notifyRoutes from './routes/notifyRoutes.js';
import errorHandler from './middleWare/errorHandler.js';

const app = express();


/* app.use(cors({
    origin: 'http://192.168.62.189:8081', // your frontend IP:port
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
})); */

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/notify', notifyRoutes);
//app.use('/api/bus_timings', busRoutes); // Assuming busRoutes includes bus timing routes

// Error handler
app.use(errorHandler);

export default app;
