import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition, Popover } from '@headlessui/react';
import { HexColorPicker } from 'react-colorful';
import { useTheme, defaultThemes, Theme } from '../context/ThemeContext';

interface ThemeCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeCustomizeModal: React.FC<ThemeCustomizeModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, resetToDefault } = useTheme();
  const [customTheme, setCustomTheme] = useState<Theme>(theme);

  useEffect(() => {
    setCustomTheme(theme);
  }, [theme, isOpen]);

  const handleColorChange = (key: keyof Theme['colors'], value: string) => {
    const hslValue = hexToHsl(value);
    const newTheme = {
      ...customTheme,
      name: 'custom',
      colors: { ...customTheme.colors, [key]: hslValue },
    };
    setCustomTheme(newTheme);
  };

  const handleSave = () => {
    setTheme(customTheme);
    onClose();
  };

  const handleReset = (themeName: 'light' | 'dark') => {
    resetToDefault(themeName);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* ... Dialog overlay ... */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-component-background p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-foreground mb-4">
                Customize Theme
              </Dialog.Title>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
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

              <div className="mt-6 flex justify-between">
                <div>
                  <button onClick={() => handleReset('light')} className="px-4 py-2 text-sm rounded-md bg-interactive-secondary text-interactive-secondary-foreground mr-2">Reset to Light</button>
                  <button onClick={() => handleReset('dark')} className="px-4 py-2 text-sm rounded-md bg-interactive-secondary text-interactive-secondary-foreground">Reset to Dark</button>
                </div>
                <div>
                  <button onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-interactive-secondary text-interactive-secondary-foreground mr-2">Cancel</button>
                  <button onClick={handleSave} className="px-4 py-2 text-sm rounded-md bg-interactive-primary text-interactive-primary-foreground">Save</button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Helper to convert HSL string to a hex string for the color input
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

// Helper to convert a hex string to an HSL string
function hexToHsl(hex: string): string {
    let r = 0, g = 0, b = 0;
    // 3 digits
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    // 6 digits
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }

    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
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
