import { ThemeProvider, useTheme } from "../ThemeProvider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

function ThemeToggleDemo() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="max-w-md mx-auto space-y-4">
        <h2 className="text-2xl font-bold">Theme Provider Demo</h2>
        <p className="text-muted-foreground">
          Current theme: <span className="font-semibold text-foreground">{theme}</span>
        </p>
        <Button data-testid="button-toggle-theme" onClick={toggleTheme} className="gap-2">
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          Toggle to {theme === "light" ? "Dark" : "Light"} Mode
        </Button>
      </div>
    </div>
  );
}

export default function ThemeProviderExample() {
  return (
    <ThemeProvider>
      <ThemeToggleDemo />
    </ThemeProvider>
  );
}
