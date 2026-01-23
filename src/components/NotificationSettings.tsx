import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Calendar, Gift, Wallet, Megaphone, Clock, ClipboardList, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  areNotificationsEnabled,
  enableNotifications,
  disableNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  showNotification,
  type NotificationPreferences,
} from "@/lib/pushNotificationService";

export function NotificationSettings() {
  const { toast } = useToast();
  const [supported] = useState(isPushSupported());
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [enabled, setEnabled] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(getNotificationPreferences());
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
    setEnabled(areNotificationsEnabled());
    setPreferences(getNotificationPreferences());
  }, []);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setEnabled(true);
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notifications.",
        });
        
        // Show a test notification
        setTimeout(() => {
          showNotification({
            title: "🎵 Notifications Active!",
            body: "You'll receive choir updates here.",
          });
        }, 1000);
      } else if (result === 'denied') {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not enable notifications.",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleToggleNotifications = (value: boolean) => {
    if (value) {
      enableNotifications();
    } else {
      disableNotifications();
    }
    setEnabled(value);
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    updateNotificationPreferences(updated);
  };

  const handleTestNotification = () => {
    showNotification({
      title: "🔔 Test Notification",
      body: "This is a test notification from Serenades of Praise!",
    });
  };

  if (!supported) {
    return (
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5 text-muted-foreground" />
            Notifications Not Supported
          </CardTitle>
          <CardDescription>
            Your browser doesn't support push notifications. Try using a modern browser like Chrome, Firefox, or Safari.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Receive instant updates about events, birthdays, and announcements.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        {permission === 'granted' ? (
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${enabled ? 'bg-green-500/20' : 'bg-muted'} flex items-center justify-center`}>
                {enabled ? (
                  <Bell className="w-5 h-5 text-green-500" />
                ) : (
                  <BellOff className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">Notifications {enabled ? 'Enabled' : 'Disabled'}</p>
                <p className="text-sm text-muted-foreground">
                  {enabled ? "You'll receive push notifications" : "Turn on to receive updates"}
                </p>
              </div>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggleNotifications}
            />
          </div>
        ) : permission === 'denied' ? (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-3">
              <BellOff className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Notifications Blocked</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Notifications are blocked by your browser. To enable them:
                </p>
                <ol className="text-sm text-muted-foreground mt-2 list-decimal list-inside space-y-1">
                  <li>Click the lock/info icon in your browser's address bar</li>
                  <li>Find "Notifications" and change to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Enable Push Notifications</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Get instant updates about choir events, birthdays, and important announcements.
                </p>
                <Button
                  variant="gold"
                  size="sm"
                  className="mt-3"
                  onClick={handleEnableNotifications}
                  disabled={isRequesting}
                >
                  {isRequesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-2" />
                      Enable Notifications
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Preferences */}
        {enabled && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Notification Types</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <div>
                    <Label htmlFor="eventReminders" className="cursor-pointer">Event Reminders</Label>
                    <p className="text-xs text-muted-foreground">Upcoming rehearsals & performances</p>
                  </div>
                </div>
                <Switch
                  id="eventReminders"
                  checked={preferences.eventReminders}
                  onCheckedChange={(v) => handlePreferenceChange('eventReminders', v)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Gift className="w-4 h-4 text-pink-500" />
                  <div>
                    <Label htmlFor="birthdays" className="cursor-pointer">Birthday Wishes</Label>
                    <p className="text-xs text-muted-foreground">Celebrate member birthdays</p>
                  </div>
                </div>
                <Switch
                  id="birthdays"
                  checked={preferences.birthdays}
                  onCheckedChange={(v) => handlePreferenceChange('birthdays', v)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Wallet className="w-4 h-4 text-green-500" />
                  <div>
                    <Label htmlFor="contributions" className="cursor-pointer">Contribution Reminders</Label>
                    <p className="text-xs text-muted-foreground">Payment due dates & overdues</p>
                  </div>
                </div>
                <Switch
                  id="contributions"
                  checked={preferences.contributions}
                  onCheckedChange={(v) => handlePreferenceChange('contributions', v)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Megaphone className="w-4 h-4 text-orange-500" />
                  <div>
                    <Label htmlFor="announcements" className="cursor-pointer">Announcements</Label>
                    <p className="text-xs text-muted-foreground">Important choir news</p>
                  </div>
                </div>
                <Switch
                  id="announcements"
                  checked={preferences.announcements}
                  onCheckedChange={(v) => handlePreferenceChange('announcements', v)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <div>
                    <Label htmlFor="leaveStatus" className="cursor-pointer">Leave Status</Label>
                    <p className="text-xs text-muted-foreground">Leave request approvals</p>
                  </div>
                </div>
                <Switch
                  id="leaveStatus"
                  checked={preferences.leaveStatus}
                  onCheckedChange={(v) => handlePreferenceChange('leaveStatus', v)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-4 h-4 text-cyan-500" />
                  <div>
                    <Label htmlFor="surveys" className="cursor-pointer">Surveys</Label>
                    <p className="text-xs text-muted-foreground">New surveys to complete</p>
                  </div>
                </div>
                <Switch
                  id="surveys"
                  checked={preferences.surveys}
                  onCheckedChange={(v) => handlePreferenceChange('surveys', v)}
                />
              </div>
            </div>

            {/* Test Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={handleTestNotification}
            >
              <Bell className="w-4 h-4 mr-2" />
              Send Test Notification
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
