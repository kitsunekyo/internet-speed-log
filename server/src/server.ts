import express from "express";
import http from "http";
import bodyParser from "body-parser";
import helmet from "helmet";
import cors from "cors";
import winston from "winston";
import expressWinston from "express-winston";

import dotenv from "dotenv";
dotenv.config();

import { speedtestService, router as speedtestRouter } from "./Speedtest";
import { router as eventsRouter } from "./Event";
import { scheduleService, Interval } from "./Schedule";
import socket from "./socket";
import { loginController } from "./Auth";

const errorMiddleware = (error: any, req: express.Request, res: express.Response, next: any) => {
    process.env.NODE_ENV !== "production" && console.log(error.message);

    if (error.status) {
        res.status(error.status);
    } else {
        res.status(500);
    }

    res.json({
        message: error.message,
        stack: process.env.NODE_ENV === "production" ? "📦" : error.stack,
    });
};

(async () => {
    const { API_PORT, CORS } = process.env;
    const app = express();

    if (CORS) {
        app.use(
            cors({
                origin: CORS,
            })
        );
    }

    app.use(helmet());
    app.use(bodyParser.json({ strict: false }));

    app.use(
        expressWinston.logger({
            transports: [new winston.transports.Console()],
            format: winston.format.combine(winston.format.colorize(), winston.format.json()),
        })
    );
    app.use("/speedtest", speedtestRouter);
    app.use("/events", eventsRouter);
    app.post("/login", loginController);

    app.use(errorMiddleware);
    app.use(
        expressWinston.errorLogger({
            transports: [new winston.transports.Console()],
            format: winston.format.combine(winston.format.colorize(), winston.format.json()),
        })
    );

    const server = http.createServer(app);
    const io = socket.setup(server);

    io.on("connection", (s) => {
        console.log("connected");
        s.on("disconnect", () => {
            console.log("disconnected");
        });
    });

    scheduleService.set(Interval.Every12h, async () => {
        const result = await speedtestService.run();
        await speedtestService.save(result);
    });

    server.listen(API_PORT, () => {
        console.log(`Server listening on http://localhost:${API_PORT}/`);
    });
})();
