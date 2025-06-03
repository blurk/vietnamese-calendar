import { serve } from '@hono/node-server'
import { Hono } from 'hono'

import { getLunarDate, isLeapYear } from './utils.js'

import { google } from 'googleapis'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

const app = new Hono()

const events: Map<number, Map<number, string>> = new Map([
  [1, new Map([
    [18, "Gi\u1ED7 c\u1EE5 Nguy\u1EC5n Th\u1EBF H\u1EE3i"],
  ])],
  [2, new Map([
    [15, "Gi\u1ED7 c\u1EE5 Ph\u1EA1m Th\u1ECB M\u00E3o"],
    [17, "Gi\u1ED7 c\u1EE5 Nguy\u1EC5n Th\u1ECB C\u1EA3 - B\u00E0 K\u1EBF"],
  ])],
  [4, new Map([
    [1, "Gi\u1ED7 b\u00E0 c\u00F4 t\u1ED5"],
  ])],
  [5, new Map([
    [6, "Gi\u1ED7 c\u1EE5 Nguy\u1EC5n Th\u1ECB Tr\u00E2m"],
    [8, "Gi\u1ED7 \u00F4ng Nguy\u1EC5n Th\u1EBF T\u00FD"],
    [20, "Gi\u1ED7 c\u1EE5 L\u00EA Th\u1ECB M\u1EADt"],
    [16, "Gi\u1ED7 b\u00E1c Tr\u1EA7n D\u0103ng D\u01B0"],
  ])],
  [6, new Map([
    [7, "Gi\u1ED7 k\u1EF5 Nguy\u1EC5n Th\u1ECB L\u00FD"],
    [20, "Gi\u1ED7 b\u00E0 n\u1ED9i"],
  ])],
  [8, new Map([
    [11, "Gi\u1ED7 c\u1EE5 Nguy\u1EC5n Th\u1EBF S\u1EEDu"],
    [19, "Gi\u1ED7 b\u00E1c Tr\u1EA7n D\u0103ng Th\u00FAc"],
  ])],
  [9, new Map([
    [29, "Gi\u1ED7 \u00F4ng n\u1ED9i"],
  ])],
  [11, new Map([
    [16, "Gi\u1ED7 c\u1EE5 Nguy\u1EC5n Xu\u00E2n Th\u1EE7y"],
    [30, "Gi\u1ED7 c\u1EE5 Tr\u1EA7n D\u0103ng Gi\u00E1p"],
  ])],
  [12, new Map([
    [18, "Gi\u1ED7 k\u1EF5 Nguy\u1EC5n Th\u1EBF L\u00FD"],
  ])],
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

async function checkAndSetEvent(calendarId: string) {
  const today = new Date();
  const days = (today.getMonth() === 1 && isLeapYear(today)) ? 29 : daysInMonth[today.getMonth()]

  for (let i = 1; i <= days; i++) {
    const _today = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    _today.setDate(i)

    const dayLunar = getLunarDate(
      _today.getDate(),
      _today.getMonth() + 1,
      _today.getFullYear()
    );
    const event = events.get(dayLunar.month)?.get(dayLunar.day)
    if (event) {
      const summary = `${event} (${dayLunar.day}-${dayLunar.month})`
      const startUTC = Date.UTC(_today.getFullYear(), _today.getMonth(), _today.getDate() - 1, 17, 0, 0)
      const endUTC = Date.UTC(_today.getFullYear(), _today.getMonth(), _today.getDate(), 16, 0, 0)

      const start = new Date(startUTC)
      const end = new Date(endUTC)

      await setEventOnCalendar(summary, start.toISOString(), end.toISOString(), calendarId)
    }
  }
}

app.post('/trigger', (c) => {
  checkAndSetEvent("nsinh6745@gmail.com").catch((err) => {
    console.log(err.message)
  })

  c.status(200)
  return c.text("OK")
})

serve({
  fetch: app.fetch,
  port: 3000,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
