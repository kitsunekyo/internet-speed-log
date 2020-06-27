import cron from "node-cron";

import { Interval } from "./Interval";

export const schedule = (() => {
    let _task: cron.ScheduledTask;
    let _interval: Interval;

    const getInterval = (): Interval => _interval;

    const getCronExpression = (
        minutes: number | string = "*",
        hours: number | string = "*",
        days: number | string = "*",
        months: number | string = "*",
        weekday: number | string = "*"
    ): string => {
        return `${minutes} ${hours} ${days} ${months} ${weekday}`;
    };

    const destroy = () => {
        if (_task) _task.destroy();
    };

    const set = (
        interval: Interval,
        fn: () => void
    ): Promise<cron.ScheduledTask> => {
        return new Promise((resolve, reject) => {
            destroy();

            if (interval === Interval.Off) {
                resolve();
            }

            let hourCronString;
            switch (interval) {
                case Interval.Every6h:
                    hourCronString = "*/6";
                    break;
                case Interval.Every12h:
                    hourCronString = "*/12";
                    break;
                case Interval.Every24h:
                default:
                    hourCronString = "*/24";
                    break;
            }

            const cronExpression = getCronExpression(0, hourCronString);

            if (!cron.validate(cronExpression)) {
                reject(`invalid cron expression ${cronExpression}`);
            }

            _task = cron.schedule(cronExpression, fn);
            _interval = interval;
            _task.start();
            resolve(_task);
        });
    };

    return {
        set,
        destroy,
        getInterval,
    };
})();
