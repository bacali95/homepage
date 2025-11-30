import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useNotificationChannels,
  useUpdateNotificationChannel,
  useTestNotificationChannel,
} from "@/lib/use-notifications";
import { toast } from "@/lib/use-toast";
import { ArrowLeft, Mail, MessageSquare, Save, Send } from "lucide-react";
import { LoadingState } from "./LoadingState";
import { Select } from "@/components/ui/select";

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { data: channels = [], isLoading } = useNotificationChannels();
  const updateChannelMutation = useUpdateNotificationChannel();
  const testChannelMutation = useTestNotificationChannel();

  const [configs, setConfigs] = useState<Record<string, Record<string, any>>>(
    {}
  );
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  // Initialize state from channels data
  useEffect(() => {
    if (channels.length > 0) {
      const initialConfigs: Record<string, Record<string, any>> = {};
      const initialEnabled: Record<string, boolean> = {};

      channels.forEach((channel) => {
        initialConfigs[channel.channel_type] = { ...channel.config };
        initialEnabled[channel.channel_type] = channel.enabled;
      });

      setConfigs(initialConfigs);
      setEnabled(initialEnabled);
    }
  }, [channels]);

  const handleConfigChange = (
    channelType: string,
    key: string,
    value: string
  ) => {
    setConfigs((prev) => ({
      ...prev,
      [channelType]: {
        ...prev[channelType],
        [key]: value,
      },
    }));
  };

  const handleEnabledChange = (channelType: string, value: boolean) => {
    setEnabled((prev) => ({
      ...prev,
      [channelType]: value,
    }));
  };

  const handleSave = async (channelType: string) => {
    try {
      await updateChannelMutation.mutateAsync({
        channelType,
        enabled: enabled[channelType] || false,
        config: configs[channelType] || {},
      });
      toast.success(
        `${channelType} channel updated`,
        "Notification settings saved successfully"
      );
    } catch (error) {
      toast.error(
        "Failed to save settings",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  };

  const handleTest = async (channelType: string) => {
    try {
      await testChannelMutation.mutateAsync({
        channelType,
        config: configs[channelType] || {},
      });
      toast.success(
        "Test notification sent",
        `Check your ${channelType} to confirm the notification was received.`
      );
    } catch (error) {
      toast.error(
        "Failed to send test notification",
        error instanceof Error
          ? error.message
          : "Please check your configuration."
      );
    }
  };

  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case "email":
        return <Mail className="h-5 w-5" />;
      case "telegram":
        return <MessageSquare className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getChannelLabel = (channelType: string) => {
    return channelType.charAt(0).toUpperCase() + channelType.slice(1);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/10">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Button variant="outline" onClick={onBack} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Apps
          </Button>
          <h1 className="text-4xl font-bold mb-2">Notification Settings</h1>
          <p className="text-muted-foreground">
            Configure notification channels for update alerts
          </p>
        </div>

        <div className="space-y-6">
          {channels.map((channel) => (
            <Card key={channel.channel_type} className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {getChannelIcon(channel.channel_type)}
                <h2 className="text-2xl font-semibold">
                  {getChannelLabel(channel.channel_type)}
                </h2>
                <div className="ml-auto">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled[channel.channel_type] || false}
                      onChange={(e) =>
                        handleEnabledChange(
                          channel.channel_type,
                          e.target.checked
                        )
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Enable</span>
                  </label>
                </div>
              </div>

              {channel.channel_type === "email" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        type="text"
                        placeholder="smtp.gmail.com"
                        value={configs[channel.channel_type]?.smtpHost || ""}
                        onChange={(e) =>
                          handleConfigChange(
                            channel.channel_type,
                            "smtpHost",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        placeholder="587"
                        value={configs[channel.channel_type]?.smtpPort || ""}
                        onChange={(e) =>
                          handleConfigChange(
                            channel.channel_type,
                            "smtpPort",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="security">Security</Label>
                    <Select
                      id="security"
                      value={configs[channel.channel_type]?.security || "auto"}
                      onChange={(e) =>
                        handleConfigChange(
                          channel.channel_type,
                          "security",
                          e.target.value
                        )
                      }
                    >
                      <option value="auto">Auto (detect from port)</option>
                      <option value="none">None</option>
                      <option value="tls">TLS/SSL</option>
                      <option value="starttls">STARTTLS</option>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      Auto: 465 = TLS/SSL, 587/25 = STARTTLS
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      placeholder="sender@example.com"
                      value={configs[channel.channel_type]?.fromEmail || ""}
                      onChange={(e) =>
                        handleConfigChange(
                          channel.channel_type,
                          "fromEmail",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="toEmail">To Email</Label>
                    <Input
                      id="toEmail"
                      type="email"
                      placeholder="recipient@example.com"
                      value={configs[channel.channel_type]?.toEmail || ""}
                      onChange={(e) =>
                        handleConfigChange(
                          channel.channel_type,
                          "toEmail",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpUser">SMTP Username (optional)</Label>
                      <Input
                        id="smtpUser"
                        type="text"
                        placeholder="username"
                        value={configs[channel.channel_type]?.smtpUser || ""}
                        onChange={(e) =>
                          handleConfigChange(
                            channel.channel_type,
                            "smtpUser",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPassword">
                        SMTP Password (optional)
                      </Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        placeholder="password"
                        value={
                          configs[channel.channel_type]?.smtpPassword || ""
                        }
                        onChange={(e) =>
                          handleConfigChange(
                            channel.channel_type,
                            "smtpPassword",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {channel.channel_type === "telegram" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="botToken">Bot Token</Label>
                    <Input
                      id="botToken"
                      type="password"
                      placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                      value={configs[channel.channel_type]?.botToken || ""}
                      onChange={(e) =>
                        handleConfigChange(
                          channel.channel_type,
                          "botToken",
                          e.target.value
                        )
                      }
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Get your bot token from @BotFather on Telegram
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="chatId">Chat ID</Label>
                    <Input
                      id="chatId"
                      type="text"
                      placeholder="123456789"
                      value={configs[channel.channel_type]?.chatId || ""}
                      onChange={(e) =>
                        handleConfigChange(
                          channel.channel_type,
                          "chatId",
                          e.target.value
                        )
                      }
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Your Telegram user ID or group chat ID
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleTest(channel.channel_type)}
                  disabled={
                    testChannelMutation.isPending ||
                    updateChannelMutation.isPending
                  }
                >
                  <Send className="mr-2 h-4 w-4" />
                  {testChannelMutation.isPending ? "Sending..." : "Test"}
                </Button>
                <Button
                  onClick={() => handleSave(channel.channel_type)}
                  disabled={
                    updateChannelMutation.isPending ||
                    testChannelMutation.isPending
                  }
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateChannelMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>

              {channel.configured && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-600 dark:text-green-400">
                  ✓ Channel is configured and ready
                </div>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
