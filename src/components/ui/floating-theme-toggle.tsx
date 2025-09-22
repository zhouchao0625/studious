import { Moon, Sun, Settings, Palette, Globe, ChevronLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useTheme, DarkMode, ColorTheme } from "@/components/ui/theme-provider"
import { useState, useEffect } from "react"

// Color theme configurations
const colorThemes = [
  { id: "default", name: "Default", color: "#6b7280" },
  { id: "blue", name: "Blue", color: "#3b82f6" },
  { id: "green", name: "Green", color: "#22c55e" },
  { id: "purple", name: "Purple", color: "#a855f7" },
  { id: "orange", name: "Orange", color: "#f97316" },
]

// Dark mode configurations  
const darkModes = [
  { id: "light", name: "Light", icon: Sun },
  { id: "dark", name: "Dark", icon: Moon },
  { id: "system", name: "System", icon: Settings },
]

// Language configurations
const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
]

type View = "main" | "themes" | "languages"

export function FloatingThemeToggle() {
  const { darkMode, colorTheme, setDarkMode, setColorTheme } = useTheme()
  const [currentLanguage, setCurrentLanguage] = useState("en")
  const [isOpen, setIsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<View>("main")

  // Load saved language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("app-language")
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage)
    }
  }, [])

  // Save language to localStorage
  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode)
    localStorage.setItem("app-language", languageCode)
    // You can add actual i18n implementation here
  }

  const currentColorTheme = colorThemes.find(t => t.id === colorTheme) || colorThemes[0]
  const currentDarkMode = darkModes.find(d => d.id === darkMode) || darkModes[0]
  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0]

  const handleClose = () => {
    setIsOpen(false)
    setCurrentView("main")
  }

  const handleColorThemeSelect = (themeId: string) => {
    setColorTheme(themeId as ColorTheme)
  }

  const handleDarkModeSelect = (modeId: string) => {
    setDarkMode(modeId as DarkMode)
  }

  const handleLanguageSelect = (langCode: string) => {
    handleLanguageChange(langCode)
  }

  const toggleDarkMode = () => {
    setDarkMode(darkMode === "dark" ? "light" : "dark")
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={() => setIsOpen(true)}
          size="icon" 
          className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-background border border-border relative"
        >
          <Settings className="h-5 w-5 text-foreground" />
        </Button>
      </div>

      {/* Settings Popup */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-50"
            onClick={handleClose}
          />
          
          {/* Popup */}
          <div className="fixed bottom-20 right-6 z-50 w-72 max-h-96 bg-popover border border-border rounded-lg shadow-lg animate-in slide-in-from-bottom-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="flex items-center gap-2">
                {currentView !== "main" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -ml-1"
                    onClick={() => setCurrentView("main")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <Settings className="h-4 w-4" />
                <h3 className="font-medium text-sm">
                  {currentView === "main" ? "Settings" : 
                   currentView === "themes" ? "Theme" : "Language"}
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-hidden">
              {/* Main View */}
              {currentView === "main" && (
                <div className="p-2 space-y-1">
                  <div>
                    <div className="flex items-center justify-between mb-2 p-3">
                      <div className="flex items-center gap-2 w-full">
                        {darkMode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        <span className="font-medium text-sm">Dark Mode</span>
                      </div>
                      <Switch
                        checked={darkMode === "dark"}
                        onCheckedChange={toggleDarkMode}
                      />
                    </div>
                    <button
                      className="w-full flex items-center justify-start p-3 rounded-md hover:bg-muted/50 transition-colors"
                      onClick={() => setCurrentView("themes")}
                    >
                      <Palette className="h-4 w-4 mr-3" />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">Color Theme</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full border" 
                            style={{ backgroundColor: currentColorTheme.color }}
                          />
                          {currentColorTheme.name}
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  <button
                    className="w-full flex items-center justify-start p-3 rounded-md hover:bg-muted/50 transition-colors"
                    onClick={() => setCurrentView("languages")}
                  >
                    <Globe className="h-4 w-4 mr-3" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">Language</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{currentLang.flag}</span>
                        {currentLang.name}
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Color Themes View */}
              {currentView === "themes" && (
                <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                  {colorThemes.map((themeOption) => {
                    const isSelected = colorTheme === themeOption.id
                    
                    return (
                      <button
                        key={themeOption.id}
                        className={`w-full flex items-center gap-3 p-3 rounded-md transition-colors ${
                          isSelected 
                            ? 'bg-muted' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleColorThemeSelect(themeOption.id)}
                      >
                        <span className="font-medium flex-1 text-left text-sm">{themeOption.name}</span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full border" 
                            style={{ backgroundColor: themeOption.color }}
                          />
                          {isSelected && <Check className="h-4 w-4" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Languages View */}
              {currentView === "languages" && (
                <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                  {languages.map((language) => {
                    const isSelected = currentLanguage === language.code
                    
                    return (
                      <button
                        key={language.code}
                        className={`w-full flex items-center gap-3 p-3 rounded-md transition-colors ${
                          isSelected 
                            ? 'bg-muted' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleLanguageSelect(language.code)}
                      >
                        <span className="text-base">{language.flag}</span>
                        <span className="font-medium flex-1 text-left text-sm">{language.name}</span>
                        {isSelected && (
                          <Check className="h-3 w-3 text-foreground" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}