#!/usr/bin/env node

/**
 * Script to generate VAPID keys for web push notifications
 * Run: node scripts/generate-vapid-keys.js
 */

const webPush = require('web-push');

const vapidKeys = webPush.generateVAPIDKeys();

console.log('\n🔐 VAPID Keys Generated Successfully!\n');
console.log('Add these to your .env.local file:\n');
console.log('# Web Push Notifications (VAPID)');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('VAPID_SUBJECT=mailto:your-email@example.com');
console.log('\n⚠️  Keep the VAPID_PRIVATE_KEY secret! Never expose it in client-side code.\n');
