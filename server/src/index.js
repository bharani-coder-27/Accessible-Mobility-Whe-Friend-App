import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';


import authRoutes from './routes/authRoutes.js';
import busRoutes from './routes/busRoutes.js';
import notifyRoutes from './routes/notifyRoutes.js';
import errorHandler from './middleWare/errorHandler.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

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

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('joinBusRoom', (data) => {
        const { bus_id } = data;
        if(bus_id) {
            socket.join(`bus_${bus_id}`);
            console.log(`Socket ${socket.id} joined room bus_${bus_id}`);
        }
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
})

export default server;
