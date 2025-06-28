import { PomodoroTimer } from "@/components/pomodoro-timer";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-8">
      <PomodoroTimer />
    </div>
  );
}
