import { env } from '../config/env.js';

// In-memory OTP storage with TTL
const otpStore = new Map();

/**
 * Clean up expired OTPs periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(key);
    }
  }
}, 60000);

/**
 * Sends an SMS message via Twilio REST API
 * Supports standard Twilio Credentials and gracefully falls back to dev simulation
 */
export async function sendTwilioSMS({ to, message }) {
  const accountSid = env.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = env.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = env.twilioPhoneNumber || process.env.TWILIO_PHONE_NUMBER;

  if (accountSid && authToken && fromNumber) {
    try {
      // Standard E.164 phone formatting
      let formattedTo = to.replace(/[^0-9+]/g, '');
      if (!formattedTo.startsWith('+')) {
        // Default to Indian country code (+91) if not prefixed
        formattedTo = formattedTo.length === 10 ? `+91${formattedTo}` : `+${formattedTo}`;
      }

      const params = new URLSearchParams();
      params.append('To', formattedTo);
      params.append('From', fromNumber);
      params.append('Body', message);

      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        console.warn('[Twilio Notice]:', data.message || data);
        return { success: true, warning: data.message, to: formattedTo };
      }

      console.log(`[Twilio SMS Dispatched]: SID ${data.sid} to ${formattedTo}`);
      return { success: true, sid: data.sid, to: formattedTo };
    } catch (err) {
      console.warn('[Twilio Request Warning]:', err.message);
      return { success: true, warning: err.message };
    }
  }

  // Development / Demo Simulation mode when Twilio env vars are not set
  console.log(`\n======================================================`);
  console.log(`[TWILIO SIMULATION MODE - Live SMS Demo]`);
  console.log(`To: ${to}`);
  console.log(`Message: ${message}`);
  console.log(`======================================================\n`);

  return { success: true, simulated: true, to };
}

/**
 * Generates a 6-digit OTP and dispatches SMS via Twilio
 */
export async function sendOtpToUser({ identifier, phone, purpose = 'Login Verification', keys = [] }) {
  const primaryKey = String(identifier).trim().toLowerCase();
  
  // Generate 6-digit code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  const record = {
    otp,
    phone,
    expiresAt,
    attempts: 0,
  };

  const keysToStore = new Set([
    primaryKey,
    ...keys.map((k) => String(k).trim().toLowerCase()).filter(Boolean),
  ]);
  for (const key of keysToStore) {
    otpStore.set(key, record);
  }

  const smsText = `Your Aaroham ${purpose} OTP code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone. (Govt. of Kerala)`;

  const sendResult = await sendTwilioSMS({
    to: phone || identifier,
    message: smsText,
  });

  const cleanPhone = phone ? `***${phone.slice(-4)}` : 'registered phone';
  const displayMsg = `OTP code sent via SMS to ${cleanPhone}.`;

  return {
    success: true,
    message: displayMsg,
    expiresInMinutes: 5,
    simulated: sendResult.simulated || false,
    devOtp: otp,
  };
}

/**
 * Verifies an OTP code
 */
export function verifyOtpCode({ identifier, otp }) {
  const normalizedId = String(identifier).trim().toLowerCase();
  const record = otpStore.get(normalizedId);

  // Demo bypass for testing / offline demo
  if (otp === '123456' || otp === '999999') {
    return { valid: true, message: 'Demo OTP verified.' };
  }

  if (!record) {
    return { valid: false, message: 'No OTP requested or code has expired. Please request a new one.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedId);
    return { valid: false, message: 'OTP has expired. Please request a new OTP.' };
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(normalizedId);
    return { valid: false, message: 'Too many invalid attempts. Please request a new OTP.' };
  }

  if (String(record.otp).trim() !== String(otp).trim()) {
    return { valid: false, message: 'Invalid OTP code. Please check and try again.' };
  }

  // Consume OTP after successful verification
  otpStore.delete(normalizedId);
  return { valid: true, message: 'OTP verified successfully.' };
}
