import mongoose from "mongoose";

/**
 * Connects to MongoDB and keeps trying / self-heals instead of crashing.
 *
 * - The first connection is retried with backoff (e.g. while you're still
 *   whitelisting your IP in Atlas) — the server stays up the whole time.
 * - If an established connection later drops (IP change, network blip, Atlas
 *   restart), it actively tears down and reconnects, so it recovers on its own
 *   without you having to restart the backend.
 */
const connectDB = () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/familytree";
  let reconnecting = false; // guards against reacting to our own disconnect
  let retryTimer = null;

  const connect = async (n = 1) => {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
      console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
    } catch (err) {
      const first = err.message.split("\n")[0];
      console.error(`❌ MongoDB connection failed (attempt ${n}): ${first}`);
      if (/whitelist|IP|ServerSelection|ENOTFOUND|ETIMEDOUT/i.test(err.message)) {
        console.error(
          "   → If this is Atlas: Network Access → allow your IP (or 0.0.0.0/0).\n" +
            "     The server keeps running and will connect automatically once allowed."
        );
      }
      scheduleRetry(n + 1);
    }
  };

  const scheduleRetry = (n) => {
    clearTimeout(retryTimer);
    const delay = Math.min(30000, n * 5000); // 5s, 10s … capped at 30s
    console.error(`   → Retrying database connection in ${delay / 1000}s…`);
    retryTimer = setTimeout(() => reconnect(n), delay);
  };

  // Force a clean reconnect (mongoose.connect() alone is a no-op once it has
  // connected before, so we disconnect first to truly re-establish).
  const reconnect = async (n) => {
    if (reconnecting) return;
    reconnecting = true;
    try {
      await mongoose.disconnect();
    } catch {
      /* ignore */
    }
    reconnecting = false;
    connect(n);
  };

  mongoose.connection.on("connected", () => console.log("✅ MongoDB ready."));
  mongoose.connection.on("disconnected", () => {
    if (reconnecting) return; // ignore the disconnect we triggered ourselves
    console.warn("⚠️  MongoDB disconnected — attempting to reconnect…");
    scheduleRetry(1);
  });
  mongoose.connection.on("error", (e) =>
    console.error(`MongoDB error: ${e.message.split("\n")[0]}`)
  );

  connect();
};

export default connectDB;
