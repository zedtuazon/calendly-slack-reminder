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
];

function buildSlackText({ type, ownerMention, practiceName, meetingDate, eventName, pms }) {
  if (type === 'training') {
    return `Hey ${ownerMention}, Training call has been scheduled

Practice Name: ${practiceName}
Training Date: ${meetingDate}
PMS: ${pms}

Good luck with your training call!`;
  }

  return `Hey ${ownerMention}, an OB has been scheduled!

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

  const match = EVENT_TYPES.find(({ prefix }) => eventNameRaw.startsWith(prefix));

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
    !q.includes('pms')
  );

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
    }),
  };

  console.log('Prepared Slack message:', slackMessage);

  try {
    const response = await axios.post(process.env.SLACK_WEBHOOK_URL, slackMessage);
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
