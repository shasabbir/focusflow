"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { Play, Pause, RotateCcw, Settings, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ContributionGraph } from '@/components/contribution-graph';
import { formatTime, type PomodoroMode, type TimerSettings, type ContributionData } from '@/lib/pomodoro';
import { format } from 'date-fns';

const DEFAULT_SETTINGS: TimerSettings = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
};

export function PomodoroTimer() {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timeLeft, setTimeLeft] = useState(settings.focus * 60);
  const [isActive, setIsActive] = useState(false);
  const [focusCycle, setFocusCycle] = useState(0);
  const [contributionData, setContributionData] = useState<ContributionData>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const synth = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    // Client-side only initialization
    synth.current = new Tone.Synth().toDestination();
    
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      setTimeLeft(parsedSettings.focus * 60);
    }

    const savedContributions = localStorage.getItem('pomodoroContributions');
    if (savedContributions) {
      setContributionData(JSON.parse(savedContributions));
    }

    const savedCycle = localStorage.getItem('pomodoroCycle');
    if (savedCycle) {
      setFocusCycle(JSON.parse(savedCycle));
    }
  }, []);

  const handleTimerEnd = useCallback(() => {
    synth.current?.triggerAttackRelease('C5', '8n');
    setIsActive(false);

    if (mode === 'focus') {
      const today = format(new Date(), 'yyyy-MM-dd');
      const newContribution = (contributionData[today] || 0) + settings.focus;
      const updatedContributions = { ...contributionData, [today]: newContribution };
      setContributionData(updatedContributions);
      localStorage.setItem('pomodoroContributions', JSON.stringify(updatedContributions));

      const nextCycle = focusCycle + 1;
      setFocusCycle(nextCycle);
      localStorage.setItem('pomodoroCycle', JSON.stringify(nextCycle));

      if (nextCycle % 4 === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      setMode('focus');
    }
  }, [mode, settings, focusCycle, contributionData]);

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
    if (newMode === 'focus' || newMode === 'shortBreak' || newMode === 'longBreak') {
        setIsActive(false);
        setMode(newMode as PomodoroMode);
    }
  };

  const handleSettingsSave = (newSettings: TimerSettings) => {
    setSettings(newSettings);
    localStorage.setItem('pomodoroSettings', JSON.stringify(newSettings));
    setIsSettingsOpen(false);
    // Reset current timer if mode is active or not
    setIsActive(false);
    switch (mode) {
      case 'focus':
        setTimeLeft(newSettings.focus * 60);
        break;
      case 'shortBreak':
        setTimeLeft(newSettings.shortBreak * 60);
        break;
      case 'longBreak':
        setTimeLeft(newSettings.longBreak * 60);
        break;
    }
  };

  const skipToNext = () => {
    if (window.confirm("Are you sure you want to skip to the next session?")) {
        handleTimerEnd();
    }
  };


  return (
    <Card className="w-full max-w-2xl shadow-2xl">
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
          <Button onClick={() => setIsActive(!isActive)} size="lg" className="w-36 bg-accent hover:bg-accent/90 text-accent-foreground">
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
        </div>
        <DialogFooter>
          <Button onClick={handleSaveClick}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
