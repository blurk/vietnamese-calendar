import { serve } from '@hono/node-server'
import { Hono } from 'hono'

import { getLunarDate } from './utils.js'

import { google } from 'googleapis'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CronJob } from 'cron'
import { env } from 'hono/adapter'

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

const app = new Hono()

const events: Map<number, Map<number, string>> = new Map([
  [4, new Map([
    [11, "Fake"],
  ])],
  [9, new Map([
    [29, "Giỗ ông nội"],
  ])]
])

async function setEventOnCalendar(summary: string, start: string, end: string, calendarId: string) {
  const keyFile = resolve(rootDir, "keys.json")
  const auth = new google.auth.GoogleAuth({
    keyFile: keyFile,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.events.insert({
    calendarId: calendarId,
    requestBody: {
      summary,
      start: {
        dateTime: start
      },
      end: {
        dateTime: end
      }
    },
  });

  console.log("Create event: ", res.data.summary)
}

const daysInMonth: Record<number, number> = {
  0: 31,  // January
  1: 28,  // February (29 in leap years, but we'll keep it simple here)
  2: 31,  // March
  3: 30,  // April
  4: 31,  // May
  5: 30,  // June
  6: 31,  // July
  7: 31,  // August
  8: 30,  // September
  9: 31,  // October
  10: 30, // November
  11: 31  // December
};

const isLeapYear = (date: Date) => {
  const year = date.getFullYear()
  return year % 100 === 0 ? year % 400 === 0 : year % 4 === 0
}

async function checkAndSetEvent(calendarId: string) {
  const today = new Date();
  const days = (today.getMonth() === 1 && isLeapYear(today)) ? 29 : daysInMonth[today.getMonth()]

  for (let i = 0; i < days; i++) {
    const _today = structuredClone(today);
    _today.setDate(today.getDate() + i)

    const dayLunar = getLunarDate(
      _today.getDate(),
      _today.getMonth() + 1,
      _today.getFullYear()
    );
    const event = events.get(dayLunar.month)?.get(dayLunar.day)
    if (event) {
      const summary = `${event} (${dayLunar.day}-${dayLunar.month})`
      const startUTC = Date.UTC(_today.getFullYear(), _today.getMonth(), today.getDate() - 1, 17, 0, 0)
      const endUTC = Date.UTC(_today.getFullYear(), _today.getMonth(), today.getDate(), 23, 0, 0)

      const start = new Date(startUTC)
      const end = new Date(endUTC)

      await setEventOnCalendar(summary, start.toISOString(), end.toISOString(), calendarId)
    }
  }
}

app.get('/', (c) => {
  const { CALENDAR_ID } = env<{ CALENDAR_ID: string }>(c)

  const job = new CronJob(
    '0 0 1 * * *', // cronTime
    function () {
      checkAndSetEvent(CALENDAR_ID).catch(() => {
        job.stop()
        c.status(500)
        return c.text("Error")
      })
    }, // onTick
    null, // onComplete
    true, // start
    'Asia/Ho_Chi_Minh' // timeZone
  );

  job.start()

  return c.text("Whazzup!")
})

serve({
  fetch: app.fetch,
  port: 3000,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})