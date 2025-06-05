const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.post('/calendly-webhook', async (req, res) => {
  const { event, payload } = req.body;

  if (event !== 'invitee.created') {
    return res.status(204).send(); // Only care about invitee.created
  }

  const eventName = payload.event_type.name;
  const allowedEvents = [
    'Patient Growth - Onboarding Call (Customer Enablement)',
    'Patient Growth - Priority Onboarding Call (Customer Enablement)'
  ];

  if (!allowedEvents.includes(eventName)) {
    console.log(`Ignored event: ${eventName}`);
    return res.status(204).send();
  }

  const inviteeName = payload.invitee.name;
  const meetingStartTime = new Date(payload.event.start_time);
  const phoneNumber = payload.invitee.questions_and_answers.find(q => q.question.toLowerCase().includes('phone'))?.answer || 'N/A';
  const practiceName = payload.invitee.questions_and_answers.find(q => q.question.toLowerCase().includes('practice'))?.answer || 'N/A';

  // Reminder time = 24 hours before the meeting
  const reminderStartTime = new Date(meetingStartTime.getTime() - 24 * 60 * 60 * 1000);

  // Pre-filled Google Calendar event link
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Reminder:+${encodeURIComponent(eventName)}&details=Call+with+${encodeURIComponent(inviteeName)}+from+${encodeURIComponent(practiceName)}&dates=${formatGoogleTime(reminderStartTime)}/${formatGoogleTime(meetingStartTime)}&location=Phone:+${encodeURIComponent(phoneNumber)}`;

  // Send to Slack
  await axios.post(process.env.SLACK_WEBHOOK_URL, {
    text: `📅 *New ${eventName} Booked!*\n*Invitee:* ${inviteeName}\n*Practice:* ${practiceName}\n*Phone:* ${phoneNumber}\n*Start:* ${meetingStartTime.toISOString()}\n\n➕ [Set reminder 24hr before](<${googleCalendarUrl}>)`
  });

  res.status(200).send('Received and processed');
});

function formatGoogleTime(date) {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '').slice(0, 15) + 'Z';
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
