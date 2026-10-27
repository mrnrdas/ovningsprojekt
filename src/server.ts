import { createApp } from "./app";

const port = Number(process.env.PORT ?? 3000);
createApp().listen(port, () => {
  console.info(`API:t lyssnar på http://localhost:${port}`);
});
