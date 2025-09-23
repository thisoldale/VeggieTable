import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition, Popover } from '@headlessui/react';
import { HexColorPicker } from 'react-colorful';
import { useTheme, Theme } from '../context/ThemeContext';

interface ThemeCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeCustomizeModal: React.FC<ThemeCustomizeModalProps> = ({ isOpen, onClose }) => {
  const { theme: activeTheme, setTheme, saveTheme, themes } = useTheme();
  const [customTheme, setCustomTheme] = useState<Theme>(activeTheme);
  const [newThemeName, setNewThemeName] = useState('');

  useEffect(() => {
    setCustomTheme(activeTheme);
    setNewThemeName(activeTheme.name);
  }, [activeTheme, isOpen]);

  const handleColorChange = (key: keyof Theme['colors'], value: string) => {
    const hslValue = hexToHsl(value);
    setCustomTheme(prevTheme => ({
      ...prevTheme,
      colors: { ...prevTheme.colors, [key]: hslValue },
    }));
  };

  const handleSave = () => {
    if (!newThemeName) {
      alert('Please enter a name for the theme.');
      return;
    }
    saveTheme({ ...customTheme, name: newThemeName });
    onClose();
  };

  const handleThemeSelection = (themeName: string) => {
    const selected = themes.find(t => t.name === themeName);
    if (selected) {
      setCustomTheme(selected);
      setNewThemeName(selected.name);
      setTheme(themeName);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-component-background p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-foreground mb-4">
                Customize Theme
              </Dialog.Title>

              <div className="mb-4">
                <label htmlFor="theme-select" className="block text-sm font-medium text-foreground mb-1">Select Theme</label>
                <select
                  id="theme-select"
                  value={activeTheme.name}
                  onChange={(e) => handleThemeSelection(e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-component-background"
                >
                  {themes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-2">
                {Object.entries(customTheme.colors).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="capitalize text-sm text-muted-foreground">
                      {key.replace(/-/g, ' ')}
                    </label>
                    <Popover className="relative">
                      <Popover.Button
                        className="w-16 h-8 rounded-md border border-border"
                        style={{ backgroundColor: value }}
                      />
                      <Popover.Panel className="absolute z-10 right-0 mt-2">
                        <HexColorPicker
                          color={hslToHex(value)}
                          onChange={(newColor) => handleColorChange(key as keyof Theme['colors'], newColor)}
                        />
                      </Popover.Panel>
                    </Popover>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between items-center">
                <div className="flex items-center">
                  <label htmlFor="theme-name" className="text-sm font-medium text-foreground mr-2">Theme Name:</label>
                  <input
                    id="theme-name"
                    type="text"
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    className="p-2 border border-border rounded-md bg-component-background"
                    placeholder="Enter custom theme name..."
                  />
                </div>
                <div>
                  <button onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-secondary text-secondary-foreground mr-2 hover:bg-secondary/90">Cancel</button>
                  <button onClick={handleSave} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

function hslToHex(hsl: string): string {
    if (!hsl || !hsl.startsWith('hsl')) return '#000000';
    let [h, s, l] = hsl.match(/\d+/g)!.map(Number);
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return `#${[0, 8, 4]
        .map(n => Math.round(f(n) * 255).toString(16).padStart(2, '0'))
        .join('')}`;
}

function hexToHsl(hex: string): string {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    return `hsl(${h} ${s}% ${l}%)`;
}

export default ThemeCustomizeModal;
