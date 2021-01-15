import express, { Router } from "express";
import * as yup from "yup";

import speedtestService from "./../services/speedtest.service";
import scheduleService from "./../services/schedule.service";

const router = Router();

router.get(
    "/",
    async (req: express.Request, res: express.Response, next: any): Promise<express.Response> => {
        try {
            const results = await speedtestService.list();
            return res.json(results);
        } catch (error) {
            return next(error);
        }
    }
);
router.post(
    "/",
    async (req: express.Request, res: express.Response, next: any): Promise<express.Response> => {
        try {
            const result = await speedtestService.run();
            if (result) {
                await speedtestService.save(result);
                return res.json(result);
            } else {
                throw new Error("Error running speedtest");
            }
        } catch (error) {
            return next(error);
        }
    }
);
router.post(
    "/schedule",
    (req: express.Request, res: express.Response): express.Response => {
        const interval = scheduleService.getInterval();
        return res.json(interval);
    }
);
router.get(
    "/schedule",
    async (req: express.Request, res: express.Response, next: any): Promise<express.Response> => {
        try {
            const schema = yup.number().required();
            await schema.validate(req.body);
        } catch (e) {
            next(e);
        }

        await scheduleService.set(req.body, async () => {
            const res = await speedtestService.run();
            await speedtestService.save(res);
        });
        return res.sendStatus(200);
    }
);

export default router;
