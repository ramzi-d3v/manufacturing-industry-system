"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  IconLogout,
  IconBell,
  IconShield,
  IconPalette,
  IconUser,
  IconMail,
  IconLock,
  IconArrowRight,
} from "@tabler/icons-react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset } from "@/components/ui/sidebar"

export default function SettingsPage() {
  const router = useRouter()
  const [user] = useAuthState(auth)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(true)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await signOut(auth)
      router.replace("/signin")
    } catch (error) {
      console.error("Logout failed:", error)
      alert("Failed to logout: " + error.message)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (!user) {
    return null
  }

  const settingsSections = [
    {
      id: "account",
      title: "Account Settings",
      description: "Manage your account information",
      icon: IconUser,
      settings: [
        {
          label: "Email Address",
          value: user.email || "Not set",
          description: "Your email is used for login and notifications",
          editable: false,
        },
        {
          label: "Display Name",
          value: user.displayName || "Not set",
          description: "Your name as displayed across the platform",
          editable: true,
        },
      ],
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Manage your notification preferences",
      icon: IconBell,
      toggleSettings: [
        {
          label: "Push Notifications",
          description: "Receive push notifications for important updates",
          value: notificationsEnabled,
          onChange: setNotificationsEnabled,
        },
        {
          label: "Email Notifications",
          description: "Receive email updates about your account and activity",
          value: emailNotifications,
          onChange: setEmailNotifications,
        },
      ],
    },
    {
      id: "privacy",
      title: "Privacy & Security",
      description: "Manage your privacy and security settings",
      icon: IconShield,
      settings: [
        {
          label: "Two-Factor Authentication",
          description: "Add an extra layer of security to your account",
          action: "Enable",
        },
        {
          label: "Password Change",
          description: "Change your password regularly to keep your account secure",
          action: "Change",
        },
      ],
    },
    {
      id: "appearance",
      title: "Appearance",
      description: "Customize how the app looks",
      icon: IconPalette,
      toggleSettings: [
        {
          label: "Dark Mode",
          description: "Use dark theme for the application",
          value: darkMode,
          onChange: setDarkMode,
        },
      ],
    },
  ]

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="flex flex-col">
        <SiteHeader />
        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-4 md:px-6 py-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-2">
                  Manage your account preferences and settings
                </p>
              </div>

              {/* Settings Sections */}
              <div className="space-y-6">
                {settingsSections.map((section) => {
                  const Icon = section.icon
                  return (
                    <Card key={section.id} className="border-border/50">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-purple-500" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{section.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {section.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {section.settings && (
                          <>
                            {section.settings.map((setting, idx) => (
                              <div key={idx}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{setting.label}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {setting.description}
                                    </p>
                                  </div>
                                  {setting.action ? (
                                    <Button size="sm" variant="outline">
                                      {setting.action}
                                    </Button>
                                  ) : (
                                    <Badge variant="secondary">{setting.value}</Badge>
                                  )}
                                </div>
                                {idx < section.settings.length - 1 && (
                                  <Separator className="mt-4" />
                                )}
                              </div>
                            ))}
                          </>
                        )}

                        {section.toggleSettings && (
                          <>
                            {section.toggleSettings.map((setting, idx) => (
                              <div key={idx}>
                                <div className="flex items-center justify-between py-2">
                                  <div className="flex-1">
                                    <p className="font-medium">{setting.label}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {setting.description}
                                    </p>
                                  </div>
                                  <Switch
                                    checked={setting.value}
                                    onCheckedChange={setting.onChange}
                                  />
                                </div>
                                {idx < section.toggleSettings.length - 1 && (
                                  <Separator className="my-4" />
                                )}
                              </div>
                            ))}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Logout Section */}
              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <IconLogout className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-red-500">Logout</CardTitle>
                      <CardDescription className="mt-1">
                        Sign out from your account
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">End your session</p>
                      <p className="text-sm text-muted-foreground">
                        You will be logged out and redirected to the signin page
                      </p>
                    </div>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="gap-2"
                    >
                      {isLoggingOut ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Logging out...
                        </>
                      ) : (
                        <>
                          <IconLogout className="h-4 w-4" />
                          Logout
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <Card className="border-border/50 bg-muted/30">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <IconMail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Need help?</p>
                        <p className="text-sm text-muted-foreground">
                          Contact our support team at support@manufacturehub.com
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <IconLock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Security Note</p>
                        <p className="text-sm text-muted-foreground">
                          Your data is encrypted and secured. We follow industry best practices
                          to keep your information safe.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
