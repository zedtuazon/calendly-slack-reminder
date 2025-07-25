/* ==== DEPRECATED CODE: Survey email backend ====
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.post('/calendly-webhook', async (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2));

  const { event, payload } = req.body;

  if (event !== 'invitee.created') {
    console.log(`Ignored event: ${event}`);
    return res.status(204).send(); // Ignore other events
  }

  if (!payload) {
    console.log('Missing payload in request body');
    return res.status(400).send('Bad payload');
  }

  // Fix here: get event type name from scheduled_event.name and trim it
  const eventNameRaw = payload.scheduled_event?.name?.trim() || '';

  const allowedEvents = [
    'Patient Growth - Onboarding Call',
    'Patient Growth - Priority Onboarding Call',
  ];

  if (!allowedEvents.some(name => eventNameRaw.startsWith(name))) {
    console.log(`Ignored event name: ${eventNameRaw}`);
    return res.status(204).send();
  }

  const inviteeName = `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || 'N/A';

  const meetingStartTimeStr = payload.scheduled_event?.start_time || payload.event?.start_time;
  const meetingStartTime = meetingStartTimeStr ? new Date(meetingStartTimeStr) : null;

  const qAndA = payload.questions_and_answers || [];

  const practiceName = qAndA.find(q =>
    q.question.toLowerCase().includes('practice')
  )?.answer || 'N/A';

  const phoneNumber = qAndA.find(q =>
    q.question.toLowerCase().includes('phone')
  )?.answer || 'N/A';

  if (!meetingStartTime) {
    console.log('Missing or invalid meeting start time:', meetingStartTimeStr);
    return res.status(400).send('Bad meeting start time');
  }

  // Reminder time = 24 hours before the meeting
  const reminderStartTime = new Date(meetingStartTime.getTime() - 24 * 60 * 60 * 1000);

  // Build Google Calendar URL
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`PRE- OB survey call + ${practiceName}`)}&dates=${formatGoogleTime(reminderStartTime)}/${formatGoogleTime(meetingStartTime)}&location=${encodeURIComponent(phoneNumber)}`;

  const slackMessage = {
    text: `A new OB call has been scheduled for *${practiceName}*. Please update the funnel accordingly and use this <${googleCalendarUrl}|LINK> to add the Pre-OB survey call to your calendar.`,
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

function formatGoogleTime(date) {
  // YYYYMMDDTHHMMSSZ format (Google Calendar expects UTC time with Z)
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
==== END DEPRECATED CODE ==== */

/* ==== DEPRECATED CODE: Survey email backend ====
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.post('/calendly-webhook', async (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2));

  const { event, payload } = req.body;

  if (event !== 'invitee.created') {
    console.log(`Ignored event: ${event}`);
    return res.status(204).send(); // Ignore other events
  }

  if (!payload) {
    console.log('Missing payload in request body');
    return res.status(400).send('Bad payload');
  }

  // Get event type name from scheduled_event.name and trim it
  const eventNameRaw = payload.scheduled_event?.name?.trim() || '';

  const allowedEvents = [
    'Patient Growth - Onboarding Call',
    'Patient Growth - Priority Onboarding Call',
  ];

  if (!allowedEvents.some(name => eventNameRaw.startsWith(name))) {
    console.log(`Ignored event name: ${eventNameRaw}`);
    return res.status(204).send();
  }

  const inviteeName = `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || 'N/A';

  const meetingStartTimeStr = payload.scheduled_event?.start_time || payload.event?.start_time;
  const meetingStartTime = meetingStartTimeStr ? new Date(meetingStartTimeStr) : null;

  const qAndA = payload.questions_and_answers || [];

  const practiceName = qAndA.find(q =>
    q.question.toLowerCase().includes('practice')
  )?.answer || 'N/A';

  const phoneNumber = qAndA.find(q =>
    q.question.toLowerCase().includes('phone')
  )?.answer || 'N/A';

  if (!meetingStartTime) {
    console.log('Missing or invalid meeting start time:', meetingStartTimeStr);
    return res.status(400).send('Bad meeting start time');
  }

  // Reminder time = 24 hours before the meeting
  const reminderStartTime = new Date(meetingStartTime.getTime() - 24 * 60 * 60 * 1000);

  // Build Google Calendar URL
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`PRE- OB survey call + ${practiceName}`)}&dates=${formatGoogleTime(reminderStartTime)}/${formatGoogleTime(meetingStartTime)}&location=${encodeURIComponent(phoneNumber)}`;

  const slackMessage = {
    text: `A new OB call has been scheduled for [${practiceName}]. Please update the funnel accordingly and use this <${googleCalendarUrl}|LINK> to add the Pre-OB survey call to your calendar.`,
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

function formatGoogleTime(date) {
  // YYYYMMDDTHHMMSSZ format (Google Calendar expects UTC time with Z)
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
==== END DEPRECATED CODE ==== */


/* ==== DEPRECATED CODE: Survey email backend ====
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

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
  const allowedEvents = [
    'Patient Growth - Onboarding Call',
    'Patient Growth - Priority Onboarding Call',
  ];

  if (!allowedEvents.some(name => eventNameRaw.startsWith(name))) {
    console.log(`Ignored event name: ${eventNameRaw}`);
    return res.status(204).send();
  }

  const inviteeName = `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || 'N/A';
  const meetingStartTimeStr = payload.scheduled_event?.start_time || payload.event?.start_time;
  const meetingStartTime = meetingStartTimeStr ? new Date(meetingStartTimeStr) : null;

  const qAndA = payload.questions_and_answers || [];

  const practiceName = qAndA.find(q =>
    q.question.toLowerCase().includes('practice')
  )?.answer || 'N/A';

  const phoneNumber = qAndA.find(q =>
    q.question.toLowerCase().includes('phone')
  )?.answer || 'N/A';

  if (!meetingStartTime) {
    console.log('Missing or invalid meeting start time:', meetingStartTimeStr);
    return res.status(400).send('Bad meeting start time');
  }

  // === Reminder Logic ===
  let reminderStartTime;
  const meetingDay = meetingStartTime.getUTCDay(); // 1 = Monday

  if (meetingDay === 1) {
    // Meeting is on Monday → Reminder on Friday
    reminderStartTime = new Date(meetingStartTime);
    reminderStartTime.setUTCDate(meetingStartTime.getUTCDate() - 3);
  } else {
    // Default: 24 hours before
    reminderStartTime = new Date(meetingStartTime.getTime() - 24 * 60 * 60 * 1000);
  }

  // Fixed duration: 15-minute calendar event
  const eventEndTime = new Date(reminderStartTime.getTime() + 15 * 60 * 1000);

  // Build Google Calendar link
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`PRE- OB survey call - ${practiceName}`)}&dates=${formatGoogleTime(reminderStartTime)}/${formatGoogleTime(eventEndTime)}&location=${encodeURIComponent(phoneNumber)}`;

  // Slack message
  const slackMessage = {
    text: `A new OB call has been scheduled for *[${practiceName}]*. Please update the funnel accordingly and use this <${googleCalendarUrl}|LINK> to add the Pre-OB survey call to your calendar.`,
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

function formatGoogleTime(date) {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
==== END DEPRECATED CODE ==== */

/* ==== DEPRECATED CODE: Survey email backend ====

const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

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
  const allowedEvents = [
    'Patient Growth - Onboarding Call',
    'Patient Growth - Priority Onboarding Call',
  ];

  if (!allowedEvents.some(name => eventNameRaw.startsWith(name))) {
    console.log(`Ignored event name: ${eventNameRaw}`);
    return res.status(204).send();
  }

  const inviteeName = `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || 'N/A';
  const meetingStartTimeStr = payload.scheduled_event?.start_time || payload.event?.start_time;
  const meetingStartTime = meetingStartTimeStr ? new Date(meetingStartTimeStr) : null;

  const qAndA = payload.questions_and_answers || [];

  const practiceName = qAndA.find(q =>
    q.question.toLowerCase().includes('practice')
  )?.answer || 'N/A';

  const phoneNumber = qAndA.find(q =>
    q.question.toLowerCase().includes('phone')
  )?.answer || 'N/A';

  if (!meetingStartTime) {
    console.log('Missing or invalid meeting start time:', meetingStartTimeStr);
    return res.status(400).send('Bad meeting start time');
  }

  // === Reminder Logic ===
  let reminderStartTime;
  const meetingDay = meetingStartTime.getUTCDay(); // 1 = Monday

  if (meetingDay === 1) {
    // Meeting is on Monday → Reminder on Friday
    reminderStartTime = new Date(meetingStartTime);
    reminderStartTime.setUTCDate(meetingStartTime.getUTCDate() - 3);
  } else {
    // Default: 24 hours before
    reminderStartTime = new Date(meetingStartTime.getTime() - 24 * 60 * 60 * 1000);
  }

  // Fixed duration: 15-minute calendar event
  const eventEndTime = new Date(reminderStartTime.getTime() + 15 * 60 * 1000);

  // Build Google Calendar link
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`PRE- OB survey call - ${practiceName}`)}&dates=${formatGoogleTime(reminderStartTime)}/${formatGoogleTime(eventEndTime)}&location=${encodeURIComponent(phoneNumber)}`;

  // Extract host's first name
  const hostFullName = payload.scheduled_event?.event_memberships?.[0]?.user_name || 'there';
  const hostFirstName = hostFullName.split(' ')[0];

  // Slack message
  const slackMessage = {
    text: `Hey ${hostFirstName}, an OB has been booked for [${practiceName}]. Please update our funnel accordingly and use this <${googleCalendarUrl}|link> to add the Pre-OB survey call to your calendar.`,
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

function formatGoogleTime(date) {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

==== END DEPRECATED CODE ==== */


const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

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
  const allowedEvents = [
    'Patient Growth - Onboarding Call',
    'Patient Growth - Priority Onboarding Call',
  ];

  if (!allowedEvents.some(name => eventNameRaw.startsWith(name))) {
    console.log(`Ignored event name: ${eventNameRaw}`);
    return res.status(204).send();
  }

  const inviteeName = `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || 'N/A';
  const meetingStartTimeStr = payload.scheduled_event?.start_time || payload.event?.start_time;
  const meetingStartTime = meetingStartTimeStr ? new Date(meetingStartTimeStr) : null;

  const qAndA = payload.questions_and_answers || [];

  const practiceName = qAndA.find(q =>
    q.question.toLowerCase().includes('practice')
  )?.answer || 'N/A';

  const phoneNumber = qAndA.find(q =>
    q.question.toLowerCase().includes('phone')
  )?.answer || 'N/A';

  if (!meetingStartTime) {
    console.log('Missing or invalid meeting start time:', meetingStartTimeStr);
    return res.status(400).send('Bad meeting start time');
  }

  // === Reminder Logic ===
  let reminderStartTime;
  const meetingDay = meetingStartTime.getUTCDay(); // 1 = Monday

  if (meetingDay === 1) {
    // Meeting is on Monday → Reminder on Friday
    reminderStartTime = new Date(meetingStartTime);
    reminderStartTime.setUTCDate(meetingStartTime.getUTCDate() - 3);
  } else {
    // Default: 24 hours before
    reminderStartTime = new Date(meetingStartTime.getTime() - 24 * 60 * 60 * 1000);
  }

  // Fixed duration: 15-minute calendar event
  const eventEndTime = new Date(reminderStartTime.getTime() + 15 * 60 * 1000);

  // Build Google Calendar link
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`PRE- OB survey call - ${practiceName}`)}&dates=${formatGoogleTime(reminderStartTime)}/${formatGoogleTime(eventEndTime)}&location=${encodeURIComponent(phoneNumber)}`;

  // Extract host's first name
  const hostFullName = payload.scheduled_event?.event_memberships?.[0]?.user_name || 'there';
  const hostFirstName = hostFullName.split(' ')[0];

  // Format meeting date as DD-MMM-YYYY in America/Toronto timezone
  const meetingDateFormatted = formatDateToronto(meetingStartTime);

  // Updated Slack message
  const slackMessage = {
    text: `Hey ${hostFirstName}, an OB has been scheduled!

Practice Name: ${practiceName}
OB Date: ${meetingDateFormatted}.

Please update our funnel accordingly and use this <${googleCalendarUrl}|LINK> to add the Pre-OB survey call to your calendar.`,
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

function formatGoogleTime(date) {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

function formatDateToronto(date) {
  const options = { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Toronto' };
  // Example output: "16-Jun-2025"
  return date.toLocaleDateString('en-GB', options).replace(/ /g, '-');
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
