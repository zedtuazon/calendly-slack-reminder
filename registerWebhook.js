const axios = require('axios');
require('dotenv').config();

async function registerWebhook() {
  const calendlyPAT = process.env.CALENDLY_PAT;
  const webhookUrl =
    process.env.WEBHOOK_URL ||
    'https://calendly-slack-reminder.onrender.com/calendly-webhook';

  if (!calendlyPAT) {
    console.error('Missing CALENDLY_PAT environment variable.');
    process.exit(1);
  }

  try {
    // Get current user info (to grab the organization URI)
    const userRes = await axios.get('https://api.calendly.com/users/me', {
      headers: { Authorization: `Bearer ${calendlyPAT}` },
    });

    const organization = userRes.data.resource.current_organization;

    // Register the webhook
    const res = await axios.post(
      'https://api.calendly.com/webhook_subscriptions',
      {
        url: webhookUrl,
        events: ['invitee.created'],
        organization,
        scope: 'organization',
      },
      {
        headers: {
          Authorization: `Bearer ${calendlyPAT}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Webhook registered successfully:', res.data.resource.uri);
  } catch (err) {
    console.error('Error registering webhook:', err.response?.data || err.message);
    process.exit(1);
  }
}

registerWebhook();
