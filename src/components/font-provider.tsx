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
      setFontState(savedFont)
      document.documentElement.className = document.documentElement.className
        .split(" ")
        .filter(c => !c.startsWith("font-"))
        .join(" ") + " " + savedFont
    }
  }, [])

  const setFont = (newFont: Font) => {
    setFontState(newFont)
    localStorage.setItem("app-font", newFont)
    document.documentElement.className = document.documentElement.className
      .split(" ")
      .filter(c => !c.startsWith("font-"))
      .join(" ") + " " + newFont
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
