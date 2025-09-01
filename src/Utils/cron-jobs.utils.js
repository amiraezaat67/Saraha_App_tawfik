import cron from "node-cron";
import { blackListTokens, users } from "../DB/Models/index.js";

export const startCronJobs = () => {
  // check every 24 hours if there are any revoked token that has been expired
  cron.schedule("* */24 * * *", async () => {
    await blackListTokens.deleteMany({ expirationDate: { $lt: Date.now() } });
  });

  // ****************************************************************************************
  // ****************************************************************************************

  // disconnect every 10 min to disconnect the devices with expired token
  cron.schedule("*/10 * * * *", async () => {
    // get the users that are alredy connect ther devices
    const loggedInUsers = await users.find({ devicesConnected: { $exists: true, $ne: [] } });

    // loop on each user
    for (const user of loggedInUsers) {
      const originalLength = user.devicesConnected.length;
      user.devicesConnected = user.devicesConnected.filter((device) => new Date(device.exp) > new Date());

      // check if the user already had and expired token, to not wait for every user
      if (user.devicesConnected.length < originalLength) {
        if (user.devicesConnected.length == 0) {
          // to delete the field
          user.devicesConnected = undefined;
        }
        await user.save();
      }
    }
  });

  // ****************************************************************************************
  // ****************************************************************************************
};
