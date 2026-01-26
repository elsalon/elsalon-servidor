/**
 * Utility to generate ICS (iCalendar) format for calendar subscriptions
 * Filters events based on sala's timeframe (annual or cuatrimestral)
 */

interface ICSEvent {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha: string;
  sala?: {
    nombre?: string;
  };
}

interface Sala {
  nombre: string;
  slug?: string;
  archivo?: {
    activar: boolean;
    frecuencia: 'anual' | 'cuatrimestral';
    annoInicio: number;
  };
}

/**
 * Converts a date to ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapes special characters for ICS format
 */
function escapeICSText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Detects current cuatrimestre (1 or 2)
 * Cuatri 1: Jan 1 - Jul 31
 * Cuatri 2: Aug 1 - Dec 31
 */
function getCurrentCuatrimestre(): 1 | 2 {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  return month < 7 ? 1 : 2; // months 0-6 = cuatri 1, 7-11 = cuatri 2
}

/**
 * Gets the date range for filtering based on sala's configuration and specific period
 */
function getDateRangeForSala(sala: Sala, year: number, cuatrimestre?: 1 | 2): { start: Date; end: Date } {
  if (sala.archivo?.frecuencia === 'cuatrimestral' && cuatrimestre) {
    if (cuatrimestre === 1) {
      return {
        start: new Date(`${year}-01-01`),
        end: new Date(`${year}-07-31T23:59:59`)
      };
    } else {
      return {
        start: new Date(`${year}-08-01`),
        end: new Date(`${year}-12-31T23:59:59`)
      };
    }
  } else {
    // Annual (default) - return entire year regardless of cuatrimestre param
    return {
      start: new Date(`${year}-01-01`),
      end: new Date(`${year}-12-31T23:59:59`)
    };
  }
}

/**
 * Filters events based on sala's timeframe and specific period
 */
export function filterEventsBySalaTimeframe(events: ICSEvent[], sala: Sala, year: number, cuatrimestre?: 1 | 2): ICSEvent[] {
  const { start, end } = getDateRangeForSala(sala, year, cuatrimestre);
  
  return events.filter(event => {
    const eventDate = new Date(event.fecha);
    return eventDate >= start && eventDate <= end;
  });
}

/**
 * Generates ICS calendar content from events
 */
export function generateICS(events: ICSEvent[], calendarName: string): string {
  const now = new Date();
  const timestamp = formatICSDate(now);

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//El Salon//NONSGML Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICSText(calendarName)}`,
    'X-WR-TIMEZONE:America/Argentina/Buenos_Aires',
    ''
  ];

  events.forEach(event => {
    const eventDate = new Date(event.fecha);
    // Default to 1 hour duration if not specified
    const eventEnd = new Date(eventDate.getTime() + 60 * 60 * 1000);
    
    ics.push('BEGIN:VEVENT');
    ics.push(`UID:evento-${event.id}@elsalon.com`);
    ics.push(`DTSTAMP:${timestamp}`);
    ics.push(`DTSTART:${formatICSDate(eventDate)}`);
    ics.push(`DTEND:${formatICSDate(eventEnd)}`);
    ics.push(`SUMMARY:${escapeICSText(event.titulo)}`);
    
    if (event.descripcion) {
      ics.push(`DESCRIPTION:${escapeICSText(event.descripcion)}`);
    }
    
    if (event.sala?.nombre) {
      ics.push(`LOCATION:${escapeICSText(event.sala.nombre)}`);
    }
    
    ics.push('END:VEVENT');
    ics.push('');
  });

  ics.push('END:VCALENDAR');

  return ics.join('\r\n');
}
