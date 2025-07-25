"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { useTheme } from 'next-themes';
import { Play, Pause, RotateCcw, Settings, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ContributionGraph } from '@/components/contribution-graph';
import { formatTime, type PomodoroMode, type TimerSettings, type ContributionData, APPS_SCRIPT_URL } from '@/lib/pomodoro';
import { format } from 'date-fns';

const DEFAULT_SETTINGS: TimerSettings = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
};

const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

export function PomodoroTimer() {
  // Initialize state with server-renderable default values to prevent hydration errors.
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.focus * 60);
  const [isActive, setIsActive] = useState(false);
  const [focusCycle, setFocusCycle] = useState<number>(0);
  const [contributionData, setContributionData] = useState<ContributionData>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const synth = useRef<Tone.Synth | null>(null);

  // This effect runs only on the client, after the initial render.
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Load state from localStorage.
    const savedSettings = getFromLocalStorage('pomodoroSettings', DEFAULT_SETTINGS);
    setSettings(savedSettings);

    const savedCycle = getFromLocalStorage('pomodoroCycle', 0);
    setFocusCycle(savedCycle);

    const savedHistory = getFromLocalStorage('pomodoroHistory', {});
    setContributionData(savedHistory);
    
    // Initialize Tone.js synth for audio feedback.
    synth.current = new Tone.Synth().toDestination();

    // Sync data with the backend after loading local data.
    const syncWithBackend = async () => {
      try {
        const [settingsResponse, historyResponse] = await Promise.all([
          fetch(`${APPS_SCRIPT_URL}?action=getAllDurations`),
          fetch(`${APPS_SCRIPT_URL}?action=getHistory`),
        ]);

        if (settingsResponse.ok) {
          const remoteSettings = await settingsResponse.json();
          const newSettings: TimerSettings = {
            focus: remoteSettings.focus / 60,
            shortBreak: remoteSettings.break / 60,
            longBreak: remoteSettings.longBreak / 60,
          };
          setSettings(newSettings);
          localStorage.setItem('pomodoroSettings', JSON.stringify(newSettings));
        } else {
            console.error("Failed to fetch settings, using local/default.");
        }
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setContributionData(historyData);
          localStorage.setItem('pomodoroHistory', JSON.stringify(historyData));
        } else {
            console.error("Failed to fetch contribution history.");
        }
      } catch (error)
      {
        console.error('Failed to sync data with backend', error);
      }
    };
    
    syncWithBackend();
    // The empty dependency array ensures this effect runs only once after the component mounts.
  }, []);

  const showNotification = useCallback((title: string, body: string) => {
    if (notificationPermission === 'granted') {
        new Notification(title, { body });
    }
  }, [notificationPermission]);

  const handleTimerEnd = useCallback(() => {
    synth.current?.triggerAttackRelease('C5', '8n');
    setIsActive(false);

    if (mode === 'focus') {
      const today = format(new Date(), 'yyyy-MM-dd');
      const focusDuration = settings.focus;

      const updatedContributions = { 
          ...contributionData, 
          [today]: (contributionData[today] || 0) + focusDuration 
      };
      setContributionData(updatedContributions);
      localStorage.setItem('pomodoroHistory', JSON.stringify(updatedContributions));
      
      fetch(`${APPS_SCRIPT_URL}?action=incrementHistory&key=${today}&value=${focusDuration}`)
        .catch(error => console.error('Failed to save contribution', error));

      const nextCycle = focusCycle + 1;
      setFocusCycle(nextCycle);
      localStorage.setItem('pomodoroCycle', JSON.stringify(nextCycle));

      if (nextCycle % 4 === 0) {
        setMode('longBreak');
        showNotification('Focus Complete!', `Time for a ${settings.longBreak}-minute long break.`);
      } else {
        setMode('shortBreak');
        showNotification('Focus Complete!', `Time for a ${settings.shortBreak}-minute short break.`);
      }
    } else {
      setMode('focus');
      showNotification("Break's Over!", "Time to get back to focus.");
    }
  }, [mode, settings, focusCycle, contributionData, showNotification]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleTimerEnd();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, handleTimerEnd]);
  
  useEffect(() => {
    document.title = `${formatTime(timeLeft)} - ${mode.charAt(0).toUpperCase() + mode.slice(1)} | FocusFlow`;
  }, [timeLeft, mode]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    switch (mode) {
      case 'focus':
        setTimeLeft(settings.focus * 60);
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreak * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreak * 60);
        break;
    }
  }, [mode, settings]);

  useEffect(() => {
    resetTimer();
  }, [mode, settings, resetTimer]);
  
  const handleModeChange = (newMode: string) => {
    if (['focus', 'shortBreak', 'longBreak'].includes(newMode)) {
        setIsActive(false);
        setMode(newMode as PomodoroMode);
    }
  };

  const handleSettingsSave = (newSettings: TimerSettings) => {
    setIsSettingsOpen(false);
    
    setSettings(newSettings);
    localStorage.setItem('pomodoroSettings', JSON.stringify(newSettings));

    const backendPromise = Promise.all([
        fetch(`${APPS_SCRIPT_URL}?action=updateDuration&key=focus&value=${newSettings.focus * 60}`),
        fetch(`${APPS_SCRIPT_URL}?action=updateDuration&key=break&value=${newSettings.shortBreak * 60}`),
        fetch(`${APPS_SCRIPT_URL}?action=updateDuration&key=longBreak&value=${newSettings.longBreak * 60}`),
    ]);

    backendPromise.catch(error => {
        console.error('Failed to save settings to backend', error);
    });
  };

  const skipToNext = () => {
    if (window.confirm("Are you sure you want to skip to the next session?")) {
        handleTimerEnd();
    }
  };

  const handleStartPauseClick = () => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            setNotificationPermission(permission);
        });
    }
    setIsActive(!isActive);
  };


  return (
    <Card className="w-full max-w-2xl shadow-2xl bg-card">
      <CardHeader className="items-center">
        <div className="flex justify-between items-center w-full">
            <h1 className="text-2xl font-bold">FocusFlow</h1>
            <SettingsDialog onSave={handleSettingsSave} initialSettings={settings} open={isSettingsOpen} onOpenChange={setIsSettingsOpen}/>
        </div>
        <Tabs value={mode} onValueChange={handleModeChange} className="w-full pt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="focus">Focus</TabsTrigger>
            <TabsTrigger value="shortBreak">Break</TabsTrigger>
            <TabsTrigger value="longBreak">Long Break</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-8">
        <div className="text-8xl font-mono font-bold tracking-tighter mb-6 text-center">
          {formatTime(timeLeft)}
        </div>
        <div className="flex gap-4">
          <Button onClick={handleStartPauseClick} size="lg" className="w-36 bg-primary text-primary-foreground hover:bg-primary/90">
            {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isActive ? 'Pause' : 'Start'}
          </Button>
          <Button onClick={resetTimer} variant="outline" size="icon" aria-label="Reset Timer">
            <RotateCcw className="h-5 w-5" />
          </Button>
           <Button onClick={skipToNext} variant="outline" size="icon" aria-label="Skip to next session">
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex-col">
        <p className="text-sm text-muted-foreground mb-4">Completed focus sessions in this cycle: {focusCycle % 4}</p>
        <ContributionGraph data={contributionData} />
      </CardFooter>
    </Card>
  );
}


function SettingsDialog({ initialSettings, onSave, open, onOpenChange }: { initialSettings: TimerSettings, onSave: (settings: TimerSettings) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
  const [tempSettings, setTempSettings] = useState(initialSettings);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setTempSettings(initialSettings);
  }, [initialSettings]);

  const handleSaveClick = () => {
    onSave(tempSettings);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Timer Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="focus" className="text-right">Focus</Label>
            <Input id="focus" type="number" value={tempSettings.focus} onChange={(e) => setTempSettings({...tempSettings, focus: Number(e.target.value)})} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="shortBreak" className="text-right">Short Break</Label>
            <Input id="shortBreak" type="number" value={tempSettings.shortBreak} onChange={(e) => setTempSettings({...tempSettings, shortBreak: Number(e.target.value)})} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="longBreak" className="text-right">Long Break</Label>
            <Input id="longBreak" type="number" value={tempSettings.longBreak} onChange={(e) => setTempSettings({...tempSettings, longBreak: Number(e.target.value)})} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Theme</Label>
            <RadioGroup
              value={theme}
              onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
              className="col-span-3 flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="r1" />
                <Label htmlFor="r1">Light</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="r2" />
                <Label htmlFor="r2">Dark</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="r3" />
                <Label htmlFor="r3">System</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSaveClick}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
