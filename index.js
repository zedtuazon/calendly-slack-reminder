// Load environment variables
require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON
app.use(express.json());

// Helper to format time for Google Calendar (YYYYMMDDTHHmmssZ)
function formatDate(date) {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

// Main webhook route
app.post('/calendly-webhook', async (req, res) => {
  try {
    const { event, payload } = req.body;

    // Only handle invitee.created
    if (event !== 'invitee.created') {
      return res.status(204).send(); // ignore other events
    }

    const inviteeName = payload.invitee.name;
    const meetingStartTime = new Date(payload.event.start_time);

    // Extract from questions
    const qna = payload.questions_and_answers || [];
    const practiceName =
      qna.find(q => q.question.toLowerCase().includes('practice'))?.answer || 'Unknown Practice';
    const phoneNumber =
      qna.find(q => q.question.toLowerCase().includes('phone'))?.answer || 'No phone provided';

    // Create 24hr-before reminder time
    const reminderTime = new Date(meetingStartTime.getTime() - 24 * 60 * 60 * 1000);

    // Google Calendar pre-fill link
    const googleCalendarUrl = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(
      `[Reminder] Meeting with ${inviteeName}`
    )}&dates=${formatDate(reminderTime)}/${formatDate(meetingStartTime)}&details=${encodeURIComponent(
      `Practice: ${practiceName}\nPhone: ${phoneNumber}`
    )}`;

    // Send to Slack
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: `📅 *New Calendly Meeting Booked!*\n*Invitee:* ${inviteeName}\n*Practice:* ${practiceName}\n*Phone:* ${phoneNumber}\n*Start:* ${meetingStartTime.toISOString()}\n\n➕ [Set reminder 24hr before](<${googleCalendarUrl}>)`
    });

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error handling webhook');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
