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

  // Extract event name from multiple possible locations
  const eventNameRaw =
    payload.event_type?.name ||
    payload.name ||
    payload.scheduled_event?.name ||
    '';

  const eventName = eventNameRaw.trim();

  const allowedEvents = [
    'Patient Growth - Onboarding Call',
    'Patient Growth - Priority Onboarding Call',
  ];

  // Partial match check (startsWith) for flexibility
  if (!allowedEvents.some(name => eventName.startsWith(name))) {
    console.log(`Ignored event name: ${eventName}`);
    return res.status(204).send();
  }

  // Extract invitee info
  const inviteeName = payload.invitee?.name || `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || 'N/A';

  const meetingStartTimeStr = payload.event?.start_time || payload.scheduled_event?.start_time;
  const meetingStartTime = meetingStartTimeStr ? new Date(meetingStartTimeStr) : null;

  const qAndA = payload.questions_and_answers || payload.invitee?.questions_and_answers || [];

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

  // Format dates for Google Calendar URL: YYYYMMDDTHHMMSSZ/YYYYMMDDTHHMMSSZ
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Reminder:+${encodeURIComponent(eventName)}&details=Call+with+${encodeURIComponent(inviteeName)}+from+${encodeURIComponent(practiceName)}&dates=${formatGoogleTime(reminderStartTime)}/${formatGoogleTime(meetingStartTime)}&location=Phone:+${encodeURIComponent(phoneNumber)}`;

  const slackMessage = {
    text: `A new OB call has been scheduled for *${practiceName}*. Please update the funnel accordingly and use this <${googleCalendarUrl}|LINK> to add the Pre-OB survey call to your calendar.`,
  };

  try {
    const response = await axios.post(process.env.SLACK_WEBHOOK_URL, slackMessage);
    console.log('Slack message sent successfully, status:', response.status);
  } catch (err) {
    console.error('Error sending Slack message:', err.response?.data || err.message);
  }

  res.status(200).send('Received and processed');
});

function formatGoogleTime(date) {
  // YYYYMMDDTHHMMSSZ format
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '').slice(0, 15) + 'Z';
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
