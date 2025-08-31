import { server } from "./app.js"; // ✅ import server, not app
import connectToDb from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

connectToDb()
  .then(() => {
    server.on("error", (err) => {
      console.error(`Server error: ${err.message}`);
    });

    const PORT = process.env.PORT || 3000;
    if (process.env.NODE_ENV !== "production") {
      server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    }
  })
  .catch((err) => {
    console.error("MONGO DB connection failed:", err);
  });
