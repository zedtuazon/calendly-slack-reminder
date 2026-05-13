const axios = require('axios');
require('dotenv').config();

async function registerWebhook() {
  const calendlyPAT = process.env.CALENDLY_PAT;
  const webhookUrl = 'https://calendly-slack-reminder.onrender.com/calendly-webhook'; // Replace with your actual Render URL

  try {
    // Get current user info (to get the organization URI)
    const userRes = await axios.get('https://api.calendly.com/users/me', {
      headers: {
        Authorization: `Bearer ${calendlyPAT}`
      }
    });

    const organization = userRes.data.resource.current_organization;

    // Register webhook
    const res = await axios.post('https://api.calendly.com/webhook_subscriptions', {
      url: webhookUrl,
      events: ['invitee.created'],
      organization,
      scope: 'organization'
    }, {
      headers: {
        Authorization: `Bearer ${calendlyPAT}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Webhook registered successfully:', res.data.resource.uri);
  } catch (err) {
    console.error('❌ Error registering webhook:', err.response?.data || err.message);
  }
}

registerWebhook();
