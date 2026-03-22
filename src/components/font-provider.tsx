"use client"

import * as React from "react"

type Font = "font-inter" | "font-roboto" | "font-lora" | "font-baskerville" | "font-jetbrains"

interface FontContextType {
  font: Font
  setFont: (font: Font) => void
}

const FontContext = React.createContext<FontContextType | undefined>(undefined)

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [font, setFontState] = React.useState<Font>("font-inter")

  React.useEffect(() => {
    const savedFont = localStorage.getItem("app-font") as Font
    if (savedFont) {
      applyFont(savedFont)
      setFontState(savedFont)
    }
  }, [])

  const applyFont = (newFont: Font) => {
    const fontVarMap: Record<Font, string> = {
      "font-inter": "var(--font-inter)",
      "font-roboto": "var(--font-roboto)",
      "font-lora": "var(--font-lora)",
      "font-baskerville": "var(--font-baskerville)",
      "font-jetbrains": "var(--font-jetbrains)"
    }
    
    const root = document.documentElement
    const val = fontVarMap[newFont]

    // Override all major font variables so elements using font-sans, font-serif, etc., adopt the chosen font.
    root.style.setProperty('--font-sans', `${val}, ui-sans-serif, system-ui`)
    root.style.setProperty('--font-serif', `${val}, ui-serif, Georgia`)
    root.style.setProperty('--font-heading', `${val}, ui-sans-serif`)
    // Also add the utility class just in case manual inheritance is needed in some custom CSS
    root.className = root.className
      .split(" ")
      .filter(c => !c.startsWith("font-"))
      .join(" ") + " " + newFont
  }

  const setFont = (newFont: Font) => {
    setFontState(newFont)
    localStorage.setItem("app-font", newFont)
    applyFont(newFont)
  }

  return (
    <FontContext.Provider value={{ font, setFont }}>
      {children}
    </FontContext.Provider>
  )
}

export const useFont = () => {
  const context = React.useContext(FontContext)
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider")
  }
  return context
}
