import { APP_NAME, APP_VERSION } from "../../lib/appInfo";
import { STUDY_TIME_OPTIONS } from "../../lib/dailyPlanner";
import DataView from "../DataView";
import { Page, PageHeader, Section } from "../shell/AppShell";

interface SettingsViewProps {
  studyMinutes: number;
  setStudyMinutes: (minutes: number) => void;
}

/*
 * Settings consolidates the existing configuration (study time), the data
 * tools (backup, snapshot, restore steps) and app information. It adds no
 * settings that the app does not actually honour.
 */
export default function SettingsView({ studyMinutes, setStudyMinutes }: SettingsViewProps) {
  return (
    <Page narrow>
      <PageHeader kicker="Settings" title="Settings" />

      <Section title="Study time">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p id="study-time-label" className="font-medium">
              Study time today
            </p>
            <p className="mt-1 max-w-reading text-sm leading-6 text-fg-2">
              Home plans this much each day: due reviews and weak areas first, then the next lessons that fit.
            </p>
          </div>

          <div role="group" aria-labelledby="study-time-label" className="flex rounded-md border border-line bg-white p-1">
            {STUDY_TIME_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                aria-pressed={minutes === studyMinutes}
                onClick={() => setStudyMinutes(minutes)}
                className={[
                  "dl-press tabular rounded-sm px-3.5 py-2 text-sm",
                  minutes === studyMinutes ? "bg-accent font-semibold text-on-accent" : "text-fg-2 hover:bg-surface",
                ].join(" ")}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Motion and audio">
        <p className="max-w-reading text-sm leading-6 text-fg-2">
          Animations follow your Mac's <em>Reduce motion</em> setting (System Settings → Accessibility →
          Display). German audio uses the voices installed on your Mac and never plays on its own.
        </p>
      </Section>

      <Section title="Your data">
        <DataView />
      </Section>

      <Section title="About">
        <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-y-2 text-sm">
          <dt className="text-fg-3">App</dt>
          <dd className="m-0">
            {APP_NAME} {APP_VERSION}
          </dd>
          <dt className="text-fg-3">Scope</dt>
          <dd className="m-0">Unit 1, October Foundations (Weeks 1–4)</dd>
          <dt className="text-fg-3">Data</dt>
          <dd className="m-0">Stored only on this Mac. No account, no cloud.</dd>
          <dt className="text-fg-3">Fonts</dt>
          <dd className="m-0">Bricolage Grotesque, DM Sans and Instrument Serif (SIL Open Font License)</dd>
        </dl>
      </Section>
    </Page>
  );
}
