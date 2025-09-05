import cron from "node-cron";
import { blackListTokens, users } from "../DB/Models/index.js";

/**
 * @comment :  It's better to seperate each cron job in different function because what if we need to run a cron Job and stop another one ?
 * also you can make each cron Job wroks with switch and set this switch value on the env because what if we need to run a cron Job on specific environment and stop it on another environment ?
 * @example: 
    process.env.RUN_DISCONNECT_CRON_JOB = OFF
    process.env.RUN_REVOKE_TOKEN_CRON_JOB = ON
 */
export const startCronJobs = () => {
  // check every 24 hours if there are any revoked token that has been expired
  cron.schedule("* */24 * * *", async () => {
    if(process.env.RUN_REVOKE_TOKEN_CRON_JOB == 'ON'){
      console.log(`The revoke token cron Job is running`);
      
      await blackListTokens.deleteMany({ expirationDate: { $lt: Date.now() } });
    }
    console.log(`The revoke token cron Job is STOPPED`);
  });

  // ****************************************************************************************
  // ****************************************************************************************

  // disconnect every 10 min to disconnect the devices with expired token
  cron.schedule("*/10 * * * *", async () => {
   if(process.env.RUN_DISCONNECT_CRON_JOB == 'ON'){
      console.log(`The disconnect cron job is running`);
    
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
    }
    console.log(`The disconnect cron job is STOPPED`);
  });

  // ****************************************************************************************
  // ****************************************************************************************
};