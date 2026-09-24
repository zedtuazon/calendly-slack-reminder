const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// ---------------------------------------------------------------------------
// Map of Calendly host name -> Slack user ID.
// Keys can be the host's full name ('Zedrick Tuazon') or just first name ('Zedrick').
// resolveSlackId() tries an exact match first, then falls back to first name.
// Get each user's Slack ID from: Slack profile -> "..." menu -> "Copy member ID".
// ---------------------------------------------------------------------------
const HOST_TO_SLACK_ID = {
  Zedrick: 'U01HT9J7G2X',
  Delmar: 'U0A7CSGRM71',
  Rae: 'U08P1133LPL',
  Johnny: 'U08P112CK7C',
};

function resolveSlackId(hostFullName) {
  if (!hostFullName) return null;
  if (HOST_TO_SLACK_ID[hostFullName]) return HOST_TO_SLACK_ID[hostFullName];
  const firstName = hostFullName.split(' ')[0];
  return HOST_TO_SLACK_ID[firstName] || null;
}

// Event-name prefixes -> notification type. Variants like "... + Integration"
// are accepted automatically because we match by startsWith, but the FULL
// event name (including any suffix) is what's shown in the Slack message.
const EVENT_TYPES = [
  { prefix: 'Patient Growth - Onboarding Call', type: 'ob' },
  { prefix: 'Patient Growth - Priority Onboarding Call', type: 'ob' },
  { prefix: 'Opencare Training Call', type: 'training' },
  { prefix: 'Calendar Setup', type: 'integration' },
  { prefix: 'Opencare Calendar Setup', type: 'integration' },
  { prefix: 'Opencare Re-Sync/Install', type: 'integration' },
  { prefix: 'Opencare Pro Integration', type: 'integration' },
];

// Event names that match a prefix above but should never alert.
const EXCLUDED_EVENT_KEYWORDS = ['staging'];

// "Opencare Re-Sync / Install" and "Opencare Re-Sync/Install" both exist in
// Calendly, so compare names with spaces around slashes removed.
const normalizeEventName = (name) => name.replace(/\s*\/\s*/g, '/');

function buildSlackText({ type, ownerMention, practiceName, meetingDate, eventName, pms, email, phone }) {
  if (type === 'integration') {
    return `Hi team! A call has been scheduled for ${eventName} with ${ownerMention}.

Practice Name: ${practiceName}
Email: ${email}
Phone Number: ${phone}
Date: ${meetingDate}`;
  }

  if (type === 'training') {
    return `Hey ${ownerMention}, a Training call has been scheduled!

Practice Name: ${practiceName}
Training Date: ${meetingDate}
PMS: ${pms}

Good luck with your training call!`;
  }

  return `Hey ${ownerMention}, an Onboarding call has been scheduled!

Practice Name: ${practiceName}
Onboarding Date: ${meetingDate}.
OB type: ${eventName}
PMS: ${pms}

Please update our funnel accordingly.`;
}

app.post('/calendly-webhook', async (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2));

  const { event, payload } = req.body;

  if (event !== 'invitee.created') {
    console.log(`Ignored event: ${event}`);
    return res.status(204).send();
  }

  if (!payload) {
    console.log('Missing payload in request body');
    return res.status(400).send('Bad payload');
  }

  const eventNameRaw = payload.scheduled_event?.name?.trim() || '';

  const eventNameNormalized = normalizeEventName(eventNameRaw);
  const isExcluded = EXCLUDED_EVENT_KEYWORDS.some(k =>
    eventNameNormalized.toLowerCase().includes(k)
  );
  const match = isExcluded
    ? null
    : EVENT_TYPES.find(({ prefix }) => eventNameNormalized.startsWith(prefix));

  if (!match) {
    console.log(`Ignored event name: ${eventNameRaw}`);
    return res.status(204).send();
  }

  const meetingStartTimeStr =
    payload.scheduled_event?.start_time || payload.event?.start_time;
  const meetingStartTime = meetingStartTimeStr ? new Date(meetingStartTimeStr) : null;

  if (!meetingStartTime || isNaN(meetingStartTime.getTime())) {
    console.log('Missing or invalid meeting start time:', meetingStartTimeStr);
    return res.status(400).send('Bad meeting start time');
  }

  const qAndA = payload.questions_and_answers || [];

  const findAnswer = (predicate) =>
    qAndA.find(q => predicate(q.question.toLowerCase()))?.answer || 'N/A';

  // PMS first so we can exclude it from the practice-name match.
  const pms = findAnswer(q =>
    q.includes('practice management') || q.includes('software') || q.includes('pms')
  );

  const practiceName = findAnswer(q =>
    q.includes('practice') &&
    !q.includes('management') &&
    !q.includes('software') &&
    !q.includes('pms') &&
    !q.includes('phone')
  );

  const email = payload.email || 'N/A';

  // Phone: prefer the booking-form answer, fall back to Calendly's SMS reminder number.
  const phoneAnswer = findAnswer(q => q.includes('phone'));
  const phone = phoneAnswer !== 'N/A' ? phoneAnswer : payload.text_reminder_number || 'N/A';

  // Resolve host -> Slack mention
  const hostFullName = payload.scheduled_event?.event_memberships?.[0]?.user_name || '';
  const hostFirstName = hostFullName.split(' ')[0] || 'there';
  const hostSlackId = resolveSlackId(hostFullName);
  const ownerMention = hostSlackId
    ? `<@${hostSlackId}>`
    : `@${hostFirstName.toLowerCase()}`;

  const meetingDateFormatted = formatDateToronto(meetingStartTime);

  const slackMessage = {
    text: buildSlackText({
      type: match.type,
      ownerMention,
      practiceName,
      meetingDate: meetingDateFormatted,
      eventName: eventNameRaw,
      pms,
      email,
      phone,
    }),
  };

  console.log('Prepared Slack message:', slackMessage);

  // Each alert type can post to its own channel. If a type's webhook isn't
  // set, it falls back to the main OB channel (SLACK_WEBHOOK_URL).
  const WEBHOOK_BY_TYPE = {
    ob: process.env.SLACK_WEBHOOK_URL,
    training: process.env.SLACK_WEBHOOK2_URL,
    integration: process.env.SLACK_WEBHOOK2_URL,
  };
  const slackWebhookUrl = WEBHOOK_BY_TYPE[match.type] || process.env.SLACK_WEBHOOK_URL;

  try {
    const response = await axios.post(slackWebhookUrl, slackMessage);
    console.log('Slack message sent successfully, status:', response.status);
  } catch (err) {
    console.error('Error sending Slack message:', err.response?.data || err.message);
  }

  res.status(200).send('Received and processed');
});

function formatDateToronto(date) {
  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Toronto',
  };
  // Example output: "18-May-2026"
  return date.toLocaleDateString('en-GB', options).replace(/ /g, '-');
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
