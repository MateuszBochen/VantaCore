import {useEffect, useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Plus} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {Popup, type PopupHandle} from '@/components/ui/popup';
import useListMyWorklogHook from '@/lib/Worklog/useListMyWorklogHook';
import {addDays, defaultLogDateTime, formatDuration, formatWeekdayLabel, localDateOf, startOfWeek, todayIso} from '@/lib/Worklog/dateRange';
import LogTimeForm from '../MyWorklog/LogTimeForm';
import type {MyWorklogEntry} from '@/lib/Worklog/Type/types';

const BAR_MAX_HEIGHT = 32;
// A day at (or above) this counts as "full" for the mini bar scale, so one
// long day doesn't visually flatten the rest of the week down to slivers.
const SCALE_MINUTES = 8 * 60;

// Compact "this week, at a glance" card - the same GET /api/worklog/mine
// range query MyWorklogPage's week view uses, just fixed to the current
// week and rendered as 7 slim bars instead of a full grid. Its own "Log
// time" popup reuses LogTimeForm so a quick entry doesn't require leaving
// the dashboard.
const MyWorklogWidget = () => {
  const {listMyWorklog} = useListMyWorklogHook();
  const [entries, setEntries] = useState<MyWorklogEntry[] | null>(null);
  const popupRef = useRef<PopupHandle>(null);

  const weekStart = startOfWeek(todayIso());
  const weekEnd = addDays(weekStart, 6);
  const today = todayIso();

  const refetch = () => {
    setEntries(null);
    listMyWorklog(weekStart, weekEnd).then((result) => setEntries(result.success ? result.entries : []));
  };

  useEffect(() => {
    let cancelled = false;

    listMyWorklog(weekStart, weekEnd).then((result) => {
      if (!cancelled) {
        setEntries(result.success ? result.entries : []);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listMyWorklog is a thin useRequestHook wrapper recreated every render; weekStart/weekEnd are derived from todayIso() once per mount
  }, []);

  const minutesByDate = useMemo(() => {
    const grouped: Record<string, number> = {};
    (entries ?? []).forEach((entry) => {
      const date = localDateOf(entry.dateTime);
      grouped[date] = (grouped[date] ?? 0) + entry.minutes;
    });
    return grouped;
  }, [entries]);

  const days = Array.from({length: 7}, (_, i) => addDays(weekStart, i));
  const weekTotal = Object.values(minutesByDate).reduce((sum, minutes) => sum + minutes, 0);
  const todayTotal = minutesByDate[today] ?? 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">My worklog</p>
        <Link to="/my-worklog" className="text-xs text-accent hover:underline">
          Open calendar
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Today</span>
            <span className="text-lg font-semibold leading-none text-accent">{entries === null ? '—' : formatDuration(todayTotal)}</span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">This week</span>
            <span className="text-sm font-medium text-foreground">{entries === null ? '—' : formatDuration(weekTotal)}</span>
          </div>

          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => popupRef.current?.open()}>
            Log time
          </Button>
        </div>

        <div className="flex items-end justify-between gap-1.5">
          {days.map((date) => {
            const minutes = minutesByDate[date] ?? 0;
            const height = Math.max(3, Math.round((Math.min(minutes, SCALE_MINUTES) / SCALE_MINUTES) * BAR_MAX_HEIGHT));

            return (
              <div key={date} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-8 w-full items-end">
                  <div
                    className={cn('w-full rounded-sm transition-[height]', date === today ? 'bg-accent' : 'bg-cyan-400/40')}
                    style={{height}}
                    title={formatDuration(minutes)}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{formatWeekdayLabel(date).slice(0, 2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Popup ref={popupRef} title="Log time" initialSize={{width: 420, height: 420}} bodyClassName="overflow-visible">
        <LogTimeForm
          defaultDateTime={defaultLogDateTime(today)}
          onLogged={() => {
            popupRef.current?.close();
            refetch();
          }}
        />
      </Popup>
    </div>
  );
};

export default MyWorklogWidget;
