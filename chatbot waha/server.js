// ===============================
// 🚀 Chef Dhundo WhatsApp Bot
// ===============================

const express = require("express");
const app = express();

app.use(express.json({ limit: "10mb" }));

// ===============================
// 🌐 CONFIG
// ===============================
const BASE_URL = "https://chefdhundo.com";

const WAHA_URL = "http://13.233.124.22";
const WAHA_API_KEY = "8bd2ab7aa5834b79983d569c7b6495e9";
const WAHA_SESSION = "default";

// ✅ CHANGE 1: WhatsApp ingestion secret — must match WHATSAPP_INGEST_SECRET
// env variable on the website server. Required by /api/resumes/check and /api/resumes.
const WHATSAPP_INGEST_SECRET = process.env.WHATSAPP_INGEST_SECRET || "";

console.log(
    "WHATSAPP_INGEST_SECRET loaded:",
    WHATSAPP_INGEST_SECRET ? "YES" : "NO"
);

console.log(
    "WHATSAPP_INGEST_SECRET length:",
    WHATSAPP_INGEST_SECRET.length
);

// ✅ FIX: When BASE_URL points to an ngrok tunnel, every outbound fetch must include
// the "ngrok-skip-browser-warning" header. Without it, ngrok intercepts the request
// and returns an HTML interstitial page instead of forwarding to Next.js, causing
// JSON.parse() to crash with: "Unexpected token '<', '<!DOCTYPE ...' is not valid JSON".
// This header is consumed by ngrok only; it is never seen by the website.
const BASE_URL_HEADERS = {
    "ngrok-skip-browser-warning": "true"
};

// ===============================
// 📦 In-Memory User Store
// ===============================
const users = {};

// ===============================
// 📋 Inquiry Auto-Reply Tracker
// ===============================
// Tracks phone numbers that have already received the auto-reply.
// Resets on server restart — acceptable for V1.
const inquiryReplied = new Set();

// ===============================
// 📍 Location Categories
// ===============================
const LOCATION_CATEGORIES = ['Metro City', 'Non-Metro City'];

function formatLocationQuestion() {
    return `📍 *Where are you currently based?*
*आप वर्तमान में कहाँ रहते हैं?*

1. Metro City
2. Non-Metro City

✍️ Type 1 or 2
नंबर टाइप करें`;
}
// ===============================
// 👨‍🍳 Professions
// ===============================
const PROFESSIONS = [
    'Executive Chef', 'Executive Sous Chef', 'Sous Chef', 'Junior Sous Chef',
    'Commis Chef', 'Demi Chef de Partie', 'Apprentice / Trainee',
    'Kitchen Helper', 'Baker', 'Butcher',
    'Chef - Indian Curry', 'Chef - Tandoor', 'Chef - Chaat', 'Chef - Sweets', 'Others'
];

// ===============================
// 🛠 HELPERS
// ===============================

function formatProfessionList(arr) {

    let text =
        `👨‍🍳 *Tell us about your role in the kitchen*
*रसोई में आपकी भूमिका क्या है?*

`;

    arr.forEach((item, i) => {
        text += `${i + 1}. ${item}\n`;
    });

    text +=
        `\n✍️ You can type your role OR send the number
आप अपनी भूमिका टाइप कर सकते हैं या नंबर भेज सकते हैं`;

    return text;
}

// ✅ CHANGE 2: Normalize WhatsApp number to +91XXXXXXXXXX format.
// The website's normalizeIndianPhone() stores phones as +91XXXXXXXXXX.
// getResumeByPhone() does a direct .eq('phone', phone) query, so the format
// must match exactly. This also ensures canClaimResumeForPhone() works correctly.
function normalizeToIndianPhone(rawWhatsappId) {
    // rawWhatsappId examples: "919876543210@c.us" or "919876543210@lid"
    let digits = rawWhatsappId
        .replace("@c.us", "")
        .replace("@lid", "");

    // Already has country code — convert to E.164 format with +
    if (digits.startsWith("91") && digits.length === 12) {
        return `+${digits}`;
    }

    // 10-digit number without country code
    if (digits.length === 10) {
        return `+91${digits}`;
    }

    // Fallback: return as-is with + prefix if not already present
    return digits.startsWith("+") ? digits : `+${digits}`;
}

// ===============================
// 📢 INQUIRY DETECTION
// ===============================
function isInquiryMessage(text) {
    // Matches the exact format sent by the website chatbot widget.
    // The message body always contains this exact phrase (sent as WhatsApp bold text).
    return text.toLowerCase().includes("bulk staff hiring enquiry");
}

// ===============================
// 🧠 RESUME TRIGGER WORDS
// ===============================

const RESUME_TRIGGERS = [

    "resume",
    "resum",
    "resme",
    "resuume",
    "rezume",
    "rezum",
    "resuma",
    "resumae",
    "resime",
    "resimee",
    "resmue",
    "resuem",
    "rresume",
    "resumee",
    "reesume",
    "reesum",
    "rsume",
    "rseume",
    "resune",
    "resunee",
    "resyume",
    "reusme",
    "reuume",
    "rezyme",
    "risume",
    "rizume",
    "rezumee",
    "resumaee",
    "resumeee"

];

function isResumeTrigger(text) {

    const msg = text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");

    return RESUME_TRIGGERS.includes(msg);

}

// ===============================
// 🔄 Resolve LID → Phone Number
// ===============================
async function resolveChatId(chatId) {

    try {

        // Already normal phone
        if (!chatId.endsWith("@lid")) {
            return chatId;
        }

        const lid = chatId.replace("@lid", "");

        const response = await fetch(
            `${WAHA_URL}/api/${WAHA_SESSION}/lids/${lid}`,
            {
                method: "GET",
                headers: {
                    "X-Api-Key": WAHA_API_KEY
                }
            }
        );

        const data = await response.json();

        console.log("🔍 LID RESPONSE:", data);

        // ✅ IMPORTANT FIX
        if (data?.pn) {

            const resolved = data.pn;

            console.log(`✅ LID Resolved: ${chatId} -> ${resolved}`);

            return resolved;
        }

        console.log("⚠️ Could not resolve LID");

        return chatId;

    } catch (err) {

        console.log("❌ LID resolve error:", err.message);

        return chatId;
    }
}

// ===============================
// 📤 SEND MESSAGE
// ===============================
async function sendText(chatId, text) {

    try {

        const response = await fetch(`${WAHA_URL}/api/sendText`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": WAHA_API_KEY
            },
            body: JSON.stringify({
                session: WAHA_SESSION,
                chatId,
                text
            })
        });

        const result = await response.text();

        console.log("📤 SEND RESPONSE:", result);

    } catch (err) {

        console.error("❌ sendText error:", err.message);
    }
}

// ===============================
// 🔥 WEBHOOK
// ===============================
app.post("/webhook", async (req, res) => {

    try {

        const { event, payload } = req.body;

        if (event !== "message.any") {
            return res.sendStatus(200);
        }

        if (!payload) {
            return res.sendStatus(200);
        }

        const rawText = payload.body || "";
        const text = rawText.toLowerCase().trim();

        let from = payload.from || "";
        const fromMe = payload.fromMe;

        // Ignore self messages
        if (fromMe) {
            return res.sendStatus(200);
        }

        // Ignore groups
        if (
            from.includes("@g.us") ||
            from === "status@broadcast"
        ) {
            return res.sendStatus(200);
        }

        // ✅ Resolve LID → Real Number
        from = await resolveChatId(from);

        console.log(`📩 ${from}: ${text}`);

        // ===============================
        // 📢 INQUIRY AUTO-REPLY
        // ===============================
        // Triggered when a recruiter submits the "Bulk Staff Hiring" form on the website.
        // The form opens a wa.me deep-link; the recruiter's WhatsApp sends the pre-filled message.
        // We reply to payload.from (the real WhatsApp number) — not the phone typed in the form.
        if (isInquiryMessage(rawText)) {

            if (!inquiryReplied.has(from)) {

                inquiryReplied.add(from);

                console.log(`📢 Inquiry auto-reply → ${from}`);

                await sendText(
                    from,
                    `Hi! Thanks for showing interest in *ChefDhundo Pro Membership.*

Here's how you can get started in under 1 minute 👇

1️⃣ Visit: https://chefdhundo.com/
2️⃣ Click: Login → Sign Up With Mobile No
3️⃣ Go to: Find Chef
4️⃣ Tap on: Upgrade to Pro

Choose your plan:
Weekly / Monthly / Quarterly / Yearly

✨ Pro Benefits:

• Access 600+ verified chef resumes
• Your team can contact & hire directly
• No middlemen. Instant access.

If you have any questions, just reply to this message — happy to help!

Regards,
*Shreyas Karade*
Talent Manager – Billionaire Chef Media Pvt. Ltd.
+918826147981`
                );

            } else {

                console.log(`⚡ Inquiry auto-reply already sent to ${from}, skipping.`);
            }

            return res.sendStatus(200);
        }

        // ===============================
        // 👤 INIT USER
        // ===============================

        if (!users[from]) {
            users[from] = {
                step: 0,
                data: {}
            };
        }

        const user = users[from];

        // ===============================
        // 🚀 START FLOW
        // ===============================
        if ((!user.step || user.step === 0) && isResumeTrigger(text)) {

            // ✅ CHANGE 2 (applied): phone is now +91XXXXXXXXXX to match website storage format
            const phone = normalizeToIndianPhone(from);

            let resumeExists = false;
            let isClaimed = false;
            let claimToken = null;

            try {

                // ✅ CHANGE 3: Added x-chefdhundo-webhook-secret header.
                // /api/resumes/check now requires this header (verifyWhatsappIngestionSecret).
                // Without it, the endpoint returns 401 Unauthorized.
                // BASE_URL_HEADERS includes ngrok-skip-browser-warning to prevent ngrok
                // from serving its HTML interstitial instead of forwarding to Next.js.
                const response = await fetch(
                    `${BASE_URL}/api/resumes/check`,
                    {
                        method: "POST",
                        headers: {
                            ...BASE_URL_HEADERS,
                            "Content-Type": "application/json",
                            "x-chefdhundo-webhook-secret": WHATSAPP_INGEST_SECRET
                        },
                        body: JSON.stringify({
                            phone
                        })
                    }
                );

                const raw = await response.text();

                try {

                    const parsed = JSON.parse(raw);

                    resumeExists = parsed.exists === true;
                    isClaimed = parsed.claimed === true;
                    claimToken = parsed.token || null;

                } catch (err) {

                    console.error("❌ Invalid JSON:", raw);
                }

            } catch (err) {

                console.error("⚠️ Check API failed:", err.message);
            }

            // ===============================
            // EXISTING RESUME
            // ===============================
            if (resumeExists) {

                if (isClaimed) {

                    // ✅ CHANGE 5: Removed "Login with your Google account".
                    // Website now uses Mobile OTP at /sign-in. Sending direct login URL
                    // so user lands on the correct page instead of the homepage.
                    await sendText(
                        from,
                        `✅ *Your resume is already created*
*आपका रिज्यूमे पहले से बना हुआ है*

You can view or edit it anytime 👇
आप इसे कभी भी देख या एडिट कर सकते हैं 👇

🔗 ${BASE_URL}/sign-in

💡 Login with your mobile number`
                    );

                    return res.sendStatus(200);
                }

                if (!isClaimed && claimToken) {

                    // ✅ CHANGE 6: Replaced vague "Login to access your resume" with
                    // clear mobile OTP instruction.
                    await sendText(
                        from,
                        `🎯 *Your profile is already created!*
*आपकी प्रोफाइल पहले से बनाई जा चुकी है!*

Complete your setup here 👇
अपना सेटअप यहाँ पूरा करें 👇

🔗 ${BASE_URL}/claim/${claimToken}

💡 Login with your mobile number to claim your resume`
                    );

                    return res.sendStatus(200);
                }

                await sendText(
                    from,
                    `✅ *Your resume is already created*
*आपका रिज्यूमे पहले से बना हुआ है*

🔗 ${BASE_URL}/sign-in`
                );

                return res.sendStatus(200);
            }

            // ===============================
            // NEW USER
            // ===============================
            user.step = 1;

            user.data.mobile = phone;

            await sendText(
                from,
                `👋 *Welcome to Chef Dhundo*
*Chef Dhundo में आपका स्वागत है*

We'll create your *professional chef profile* in just a minute 🍽️
हम आपका *प्रोफेशनल शेफ प्रोफाइल* सिर्फ एक मिनट में बना देंगे

👤 *What is your full name?*
*आपका पूरा नाम क्या है?*

(Example: Rahul Sharma)`
            );

            return res.sendStatus(200);
        }

        // ===============================
        // 👤 NAME
        // ===============================
        if (user.step === 1) {

            user.data.name = rawText;

            user.step = 2;

            await sendText(
                from,
                formatProfessionList(PROFESSIONS)
            );

            return res.sendStatus(200);
        }

        // ===============================
        // 👨‍🍳 PROFESSION
        // ===============================
        if (user.step === 2) {

            let index = parseInt(text) - 1;

            user.data.profession =
                (!isNaN(index) && PROFESSIONS[index])
                    ? PROFESSIONS[index]
                    : rawText;

            if (
                user.data.profession.toLowerCase() === "others"
            ) {

                user.step = "profession_other";

                await sendText(
                    from,
                    `✍️ *Tell us your profession*
*अपना प्रोफेशन बताइए*

(Example: Pastry Chef)`
                );

                return res.sendStatus(200);
            }

            user.step = 3;

            await sendText(from, formatLocationQuestion());

            return res.sendStatus(200);
        }

        // ===============================
        // 👨‍🍳 CUSTOM PROFESSION
        // ===============================
        if (user.step === "profession_other") {

            user.data.profession = rawText;

            user.step = 3;

            await sendText(from, formatLocationQuestion());

            return res.sendStatus(200);
        }

        // ===============================
        // 📍 LOCATION CATEGORY
        // ===============================
        if (user.step === 3) {

            const trimmed = text.trim();

            // Accept "1", "metro", "metro city" → Metro City
            // Accept "2", "non-metro", "non metro city" → Non-Metro City
            let location = null;
            if (trimmed === "1" || trimmed.includes("metro") && !trimmed.includes("non")) {
                location = "Metro City";
            } else if (trimmed === "2" || trimmed.includes("non")) {
                location = "Non-Metro City";
            }

            if (!location) {
                // Invalid input — re-ask
                await sendText(
                    from,
                    `⚠️ Please reply with *1* for Metro City or *2* for Non-Metro City.
कृपया Metro City के लिए *1* या Non-Metro City के लिए *2* टाइप करें।`
                );
                return res.sendStatus(200);
            }

            user.data.user_location = location;

            user.step = 4;

            await sendText(
                from,
                `📅 *How many years of experience do you have?*
*आपके पास कितने वर्षों का अनुभव है?*

(Example: 2)`
            );

            return res.sendStatus(200);
        }

        // ===============================
        // 📅 EXPERIENCE
        // ===============================
        if (user.step === 4) {

            user.data.experience_years = rawText;

            try {

                // ✅ CHANGE 4: Added x-chefdhundo-webhook-secret header.
                // /api/resumes POST now requires this header for from_whatsapp:true requests.
                // Without it, the endpoint returns 401 Unauthorized and no resume is created.
                // BASE_URL_HEADERS includes ngrok-skip-browser-warning to prevent ngrok
                // from serving its HTML interstitial instead of forwarding to Next.js.
                const response = await fetch(
                    `${BASE_URL}/api/resumes`,
                    {
                        method: "POST",
                        headers: {
                            ...BASE_URL_HEADERS,
                            "Content-Type": "application/json",
                            "x-chefdhundo-webhook-secret": WHATSAPP_INGEST_SECRET
                        },
                        body: JSON.stringify({
                            name: user.data.name,
                            phone: user.data.mobile,
                            user_location: user.data.user_location,
                            profession: user.data.profession,
                            experience_years: user.data.experience_years,
                            from_whatsapp: true
                        })
                    }
                );

                const raw = await response.text();

                const result = JSON.parse(raw);

                if (!result.success) {
                    throw new Error(result.error);
                }

                // ✅ New flow: resume is immediately owned — no claim token or claim link.
                // The user can log in with their mobile number anytime to view their profile.
                await sendText(
                    from,
                    `🎉 *Your Chef Profile is Ready!*
*आपकी शेफ प्रोफाइल तैयार है!*

You can view and edit your profile anytime.
आप अपनी प्रोफाइल कभी भी देख और एडिट कर सकते हैं।

🔗 ${BASE_URL}

💡 Login with your mobile number to access your profile`
                );

            } catch (err) {

                console.error("❌ API Error:", err.message);

                await sendText(
                    from,
                    `⚠️ Failed to create profile. Try again.
प्रोफाइल बनाने में समस्या हुई। कृपया फिर से प्रयास करें।`
                );
            }

            delete users[from];

            return res.sendStatus(200);
        }

    } catch (err) {

        console.error("❌ Server Error:", err.message);
    }

    res.sendStatus(200);
});

// ===============================
// 🚀 START SERVER
// ===============================
app.listen(3000, "0.0.0.0", () => {

    console.log("🚀 Bot running on port 3000");
});